import path from 'node:path'

import { describe, expect, it } from '@jest/globals'
import { exec } from '@monoweave/io'
import {
    addGitRemote,
    createFile,
    createMonorepoContext,
    createTempDir,
    initGitRepository,
} from '@monoweave/test-utils'
import { RegistryMode } from '@monoweave/types'
import { npath } from '@yarnpkg/fslib'

import { startRegistry } from 'helpers/docker'
import { createSetupProjectContext, writeConfigWithLocalRegistry } from 'helpers/setupProject'

// https://github.com/monoweave/monoweave/issues/165
describe('Issue #165', () => {
    it('supports yarn monorepos not anchored at the root of the git repository', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await using _ = await startRegistry()

        await using gitRoot = await createTempDir()
        await using remoteGitDir = await createTempDir()

        // Init git and remote
        await initGitRepository(npath.toPortablePath(gitRoot.dir))
        await initGitRepository(npath.toPortablePath(remoteGitDir.dir))
        await addGitRemote(gitRoot.dir, remoteGitDir.dir, 'origin')

        // Create the top-level yarn project at a subdirectory rather than at the root
        // of the git project
        const yarnSubdir = path.join(gitRoot.dir, 'yarn-project')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await using __ = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { cwd: yarnSubdir },
        )
        const configFilename = await writeConfigWithLocalRegistry(
            {
                access: 'public',
                changelogFilename: 'CHANGELOG.md',
                dryRun: false,
                autoCommit: true,
                autoCommitMessage: 'chore: release',
                conventionalChangelogConfig: require.resolve(
                    '@tophat/conventional-changelog-config',
                ),
                git: {
                    push: true,
                    remote: 'origin',
                    tag: true,
                },
                jobs: 1,
                persistVersions: false,
                registryMode: RegistryMode.NPM,
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 1,
                maxConcurrentWrites: 1,
            },
            { cwd: yarnSubdir },
        )

        // Create the non-yarn subfolder. The purpose of this test is to ensure modifications to the
        // non-yarn subfolder are NOT picked up by monoweave.
        const otherSubdir = path.join(gitRoot.dir, 'other-project')

        // Create 2 files with the same names across both subdirectories
        const commonFilename = 'example.txt'
        const exampleFileOther = await createFile({
            filePath: commonFilename,
            content: 'Contents...',
            cwd: otherSubdir,
        })
        const exampleFileYarn = await createFile({
            filePath: commonFilename,
            content: 'Contents...',
            cwd: yarnSubdir,
        })

        // Initial git commit
        await exec('git pull --rebase --no-verify origin main', {
            cwd: gitRoot.dir,
        })
        await exec('git add . && git commit -n -m "initial commit"', {
            cwd: gitRoot.dir,
        })
        await exec('git push -u origin main', {
            cwd: gitRoot.dir,
        })

        const ctx = createSetupProjectContext({
            project: yarnSubdir,
            configFilename,
        })

        // Modify the example.txt file in the non-Yarn project. If everything is working correctly,
        // monoweave should NOT detect this change as it's outside the scope of the Yarn project.
        await ctx.writeFile(exampleFileOther, 'other modification')
        await ctx.exec('git add --all && git commit -n -m "feat: other" && git push')

        let { stdout: beforeRunCommitSHA } = await ctx.exec('git rev-parse HEAD')

        // Trigger monoweave. There should be NO modifications.
        let { error } = await ctx.run()
        if (error) console.error(error)
        expect(error).toBeUndefined()

        const { stdout: afterRunCommitSHA } = await ctx.exec('git rev-parse HEAD')

        // Monoweave should not have created a commit at all.
        expect(beforeRunCommitSHA.trim()).toBe(afterRunCommitSHA.trim())

        // Changelog should also not exist anywhere.
        await expect(ctx.readFile(path.join('..', 'CHANGELOG.md'))).rejects.toThrow()
        await expect(ctx.readFile(path.join(yarnSubdir, 'CHANGELOG.md'))).rejects.toThrow()
        await expect(ctx.readFile(path.join(otherSubdir, 'CHANGELOG.md'))).rejects.toThrow()

        // There should be no git tags
        await expect(exec('git describe', { cwd: gitRoot.dir })).rejects.toThrow()

        // Modify the example.txt in the Yarn project. Monoweave SHOULD detect this change.
        await ctx.writeFile(exampleFileYarn, 'yarn modification')
        await ctx.exec('git add --all && git commit -n -m "feat: yarn 123" && git push')

        beforeRunCommitSHA = (await ctx.exec('git rev-parse HEAD')).stdout

        // Trigger monoweave. We expect a modification to the yarn subfolder
        error = (await ctx.run()).error
        if (error) console.error(error)
        expect(error).toBeUndefined()

        // Expect a new commit
        expect(beforeRunCommitSHA.trim()).not.toBe(afterRunCommitSHA.trim())

        // Changelog should be updated.
        await expect(ctx.readFile(path.join(yarnSubdir, 'CHANGELOG.md'))).resolves.toContain(
            'yarn 123',
        )

        // And sanity check: there should be no changelog file at the root of the git project
        await expect(ctx.readFile(path.join('..', 'CHANGELOG.md'))).rejects.toThrow()
    })
})
