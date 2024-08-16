import { promises as fs } from 'fs'
import path from 'path'

import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from '@jest/globals'
import * as git from '@monoweave/git'
import { LOG_LEVELS } from '@monoweave/logging'
import { createTempDir, setupMonorepo } from '@monoweave/test-utils'
import {
    type CommitMessage,
    type MonoweaveConfiguration,
    RegistryMode,
    type YarnContext,
} from '@monoweave/types'
import { npath } from '@yarnpkg/fslib'
import * as npm from '@yarnpkg/plugin-npm'

import monoweave from '..'

jest.mock('@yarnpkg/plugin-npm')
jest.mock('@monoweave/git')

const mockGit = git as jest.Mocked<
    typeof git & {
        _reset_: () => void
        _commitFiles_: (sha: string, commit: string, files: string[]) => void
        _getPushedTags_: () => string[]
        _getTags_: () => string[]
        _getRegistry_: () => {
            commits: CommitMessage[]
            filesModified: Map<string, string[]>
            tags: string[]
            pushedTags: string[]
            lastTaggedCommit?: string
            pushedCommits: string[]
            stagedFiles: string[]
        }
    }
>
const mockNPM = npm as jest.Mocked<
    typeof npm & {
        _reset_: () => void
        _setTag_: (pkgName: string, tagValue: string, tagKey?: string) => void
    }
>

const setupExampleMonorepo = async (): Promise<YarnContext> => {
    const context = await setupMonorepo(
        {},
        {
            root: {
                name: 'pkg-1',
                version: '0.0.1',
                private: false,
                dependencies: {
                    'conventional-changelog-angular': '7.0.0',
                },
            },
        },
    )
    return context
}

describe('Non-monorepos (single package)', () => {
    const monoweaveConfig: MonoweaveConfiguration = {
        cwd: '/tmp/to-be-overwritten-by-before-each',
        dryRun: false,
        registryMode: RegistryMode.NPM,
        autoCommit: false,
        autoCommitMessage: 'chore: release [skip ci]',
        git: {
            baseBranch: 'main',
            commitSha: 'HEAD',
            remote: 'origin',
            push: true,
            tag: true,
        },
        conventionalChangelogConfig: 'conventional-changelog-angular',
        access: 'public',
        persistVersions: false,
        topological: false,
        topologicalDev: false,
        jobs: 0,
        forceWriteChangeFiles: false,
        maxConcurrentReads: 2,
        maxConcurrentWrites: 2,
        prerelease: false,
        prereleaseId: 'rc',
        prereleaseNPMTag: 'next',
    }

    beforeAll(async () => {
        process.env.MONOWEAVE_LOG_LEVEL = String(LOG_LEVELS.ERROR)
    })

    beforeEach(async () => {
        const context = await setupExampleMonorepo()
        monoweaveConfig.cwd = npath.fromPortablePath(context.project.cwd)
    })

    afterEach(async () => {
        mockGit._reset_()
        mockNPM._reset_()
        try {
            await fs.rm(monoweaveConfig.cwd, { recursive: true, force: true })
        } catch {}
    })

    afterAll(() => {
        delete process.env.MONOWEAVE_LOG_LEVEL
    })

    it('publishes changed workspaces with distinct version stategies and commits', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./README.md'])

        const result = await monoweave(monoweaveConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toBe('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(expect.stringContaining('some new feature'))

        expect(mockGit._getPushedTags_()).toEqual(['pkg-1@0.1.0'])
    })

    it('updates changelog and changeset', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./README.md'])

        await using tmp = await createTempDir()
        const changelogFilename = await path.join(tmp.dir, 'changelog.md')
        const changesetFilename = await path.join(tmp.dir, 'changeset.json')

        const changelogTemplate = [
            '# Changelog',
            'Some blurb',
            '<!-- MONOWEAVE:BELOW -->',
            '## Old Versions',
            'Content',
        ].join('\n')
        await fs.writeFile(changelogFilename, changelogTemplate, {
            encoding: 'utf-8',
        })

        await monoweave({
            ...monoweaveConfig,
            changelogFilename,
            changesetFilename,
        })

        const updatedChangelog = await fs.readFile(changelogFilename, {
            encoding: 'utf-8',
        })

        // assert it contains the new entry
        expect(updatedChangelog).toEqual(expect.stringContaining('some new feature'))

        // assert it contains the old entries
        expect(updatedChangelog).toEqual(expect.stringContaining('Old Versions'))
    })
})
