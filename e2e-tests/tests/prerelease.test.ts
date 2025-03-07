import { describe, expect, it } from '@jest/globals'
import { RegistryMode } from '@monoweave/types'

import setupProject from 'helpers/setupProject'

describe('Prerelease', () => {
    it('runs the full monoweave pipeline', async () => {
        await using testContext = await setupProject({
            repository: [
                {
                    'pkg-1': {},
                    'pkg-2': {
                        dependencies: ['pkg-1'],
                    },
                    'pkg-3': { dependencies: ['pkg-2'] },
                    'pkg-4': { dependencies: ['pkg-3'] },
                    'pkg-isolated': {},
                },
            ],
            config: {
                access: 'public',
                changelogFilename: 'changelog.md',
                changesetFilename: 'changes.json.tmp',
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
                persistVersions: true,
                registryMode: RegistryMode.NPM,
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 1,
                maxConcurrentWrites: 1,
                prerelease: false,
                prereleaseId: 'alpha',
                prereleaseNPMTag: 'next',
            },
        })

        const { run, readFile, exec, writeFile } = testContext

        // First semantic commit
        await writeFile('packages/pkg-1/README.md', 'Modification.')
        await exec('git add . && git commit -n -m "feat: some fancy addition" && git push')

        const { error } = await run()

        if (error) console.error(error)
        expect(error).toBeUndefined()

        // On Remote:
        // Assert tags pushed
        await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-1@0.1.0')
        await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-2@0.0.1')
        await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-3@0.0.1')

        // Assert changelog updated on remote
        expect((await exec('git cat-file blob origin/main:changelog.md')).stdout).toEqual(
            expect.stringContaining('fancy'),
        )

        // -----

        // Create & switch to "next" branch
        await exec('git checkout -b next')
        await exec('git push --set-upstream origin next')

        // -----

        // Make another semantic change
        await writeFile('packages/pkg-1/README.md', 'Modification.')
        await exec('git add . && git commit -n -m "feat: some exciting addition"')

        const { error: error2 } = await run(['--prerelease'])

        if (error2) console.error(error2)
        expect(error2).toBeUndefined()

        // ---

        let localChangeset = JSON.parse(await readFile('changes.json.tmp'))
        expect(localChangeset).toEqual({
            'pkg-1': expect.objectContaining({
                changelog: expect.stringContaining('some exciting addition'),
                tag: 'pkg-1@0.2.0-alpha.0',
                version: '0.2.0-alpha.0',
                strategy: 'minor',
            }),
            'pkg-2': expect.objectContaining({
                changelog: null,
                tag: 'pkg-2@0.0.2-alpha.0',
                version: '0.0.2-alpha.0',
                strategy: 'patch',
            }),
            'pkg-3': expect.objectContaining({
                changelog: null,
                tag: 'pkg-3@0.0.2-alpha.0',
                version: '0.0.2-alpha.0',
                strategy: 'patch',
            }),
            'pkg-4': expect.objectContaining({
                changelog: null,
                tag: 'pkg-4@0.0.2-alpha.0',
                version: '0.0.2-alpha.0',
                strategy: 'patch',
            }),
        })

        const localChangelog = await readFile('changelog.md')
        expect(localChangelog).toEqual(
            expect.stringContaining('fancy'), // should have old entry
        )
        expect(localChangelog).toEqual(
            expect.stringContaining('exciting'), // should have new entry
        )

        // On Remote:
        // Assert tags pushed
        await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-1@0.2.0-alpha.0')

        // Assert changelog updated on remote
        expect((await exec('git cat-file blob origin/next:changelog.md')).stdout).toEqual(
            expect.stringContaining('exciting'),
        )

        // Another pre-release
        // Make another semantic change
        await writeFile('packages/pkg-1/README.md', 'Modification.')
        await exec('git add . && git commit -n -m "fix: bugfix"')
        const { error: error3 } = await run(['--prerelease'])

        if (error3) console.error(error3)
        expect(error3).toBeUndefined()

        // On Remote:
        // Assert tags pushed
        await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-1@0.2.0-alpha.1')

        // ----

        // Now we'll test merging "next" into "main"

        await exec('git checkout main')
        await exec('git merge next --no-verify --no-edit')

        // Run non-prerelease. We expect all the pre-release versions to be squashed.
        // No additional file modifications required, as the previous pre-release tags
        // are ignored.
        const { error: error4 } = await run()

        if (error4) console.error(error4)
        expect(error4).toBeUndefined()

        localChangeset = JSON.parse(await readFile('changes.json.tmp'))
        expect(localChangeset).toEqual({
            'pkg-1': expect.objectContaining({
                changelog: expect.stringContaining('some exciting addition'),
                tag: 'pkg-1@0.2.0',
                version: '0.2.0',
                previousVersion: '0.1.0',
                strategy: 'minor',
            }),
            'pkg-2': expect.objectContaining({
                changelog: null,
                tag: 'pkg-2@0.0.2',
                version: '0.0.2',
                previousVersion: '0.0.1',
                strategy: 'patch',
            }),
            'pkg-3': expect.objectContaining({
                changelog: null,
                tag: 'pkg-3@0.0.2',
                version: '0.0.2',
                previousVersion: '0.0.1',
                strategy: 'patch',
            }),
            'pkg-4': expect.objectContaining({
                changelog: null,
                tag: 'pkg-4@0.0.2',
                version: '0.0.2',
                previousVersion: '0.0.1',
                strategy: 'patch',
            }),
        })

        // On Remote:
        // Assert tags pushed
        await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-1@0.2.0')
        await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-2@0.0.2')
        await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-3@0.0.2')
        await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-4@0.0.2')
    })
})
