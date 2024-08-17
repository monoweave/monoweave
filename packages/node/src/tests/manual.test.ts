import { promises as fs } from 'fs'

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
import { createFile, setupMonorepo } from '@monoweave/test-utils'
import {
    type CommitMessage,
    type MonoweaveConfiguration,
    RegistryMode,
    type YarnContext,
} from '@monoweave/types'
import { npath } from '@yarnpkg/fslib'
import * as npm from '@yarnpkg/plugin-npm'

import monoweave from '../index.js'

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
        {
            'pkg-1': {},
            'pkg-2': { devDependencies: [] },
            'pkg-3': { dependencies: ['pkg-2'] },
            'pkg-4': {},
            'pkg-5': { dependencies: ['pkg-4'] },
            'pkg-6': {
                dependencies: ['pkg-3', 'pkg-7'],
            },
            'pkg-7': {},
            'pkg-8': { version: '3.1.0' },
        },
        {
            root: {
                dependencies: {
                    'conventional-changelog-angular': '7.0.0',
                },
            },
        },
    )
    return context
}

describe('Monoweave - Manual Mode', () => {
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
        conventionalChangelogConfig: false, // manual mode
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

    it('does not publish if no version files found, even if conventional commits present', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')

        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const result = await monoweave(monoweaveConfig)

        expect(result).toEqual({})
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('publishes based on aggregate of version files', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockNPM._setTag_('pkg-6', '0.0.1')

        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        await createFile({
            cwd: monoweaveConfig.cwd,
            filePath: './.monoweave/file1.md',
            content: ['---', '"pkg-1": patch', '"pkg-2": minor', '---', 'Change 1'].join('\n'),
        })
        await createFile({
            cwd: monoweaveConfig.cwd,
            filePath: './.monoweave/file2.md',
            content: [
                '---',
                '"pkg-1": patch',
                '"pkg-2": patch',
                '"pkg-3": major',
                '---',
                'Change 2',
            ].join('\n'),
        })

        const result = await monoweave(monoweaveConfig)

        // pkg-1 is explicitly updated with patch bump
        expect(result['pkg-1'].version).toBe('0.0.2')
        expect(result['pkg-1'].changelog).toEqual(expect.stringContaining('Change 1'))
        expect(result['pkg-1'].changelog).toEqual(expect.stringContaining('Change 2'))

        // pkg-2 is explicitly bumped with patch + minor -> minor
        expect(result['pkg-2'].version).toBe('0.1.0')
        expect(result['pkg-2'].changelog).toEqual(expect.stringContaining('Change 1'))
        expect(result['pkg-2'].changelog).toEqual(expect.stringContaining('Change 2'))

        // pkg-3 is explicitly bumped with major (but only has one version file, so one changelog entry)
        expect(result['pkg-3'].version).toBe('1.0.0')
        expect(result['pkg-3'].changelog).not.toEqual(expect.stringContaining('Change 1'))
        expect(result['pkg-3'].changelog).toEqual(expect.stringContaining('Change 2'))

        // pkg-6 depends on pkg-3
        expect(result['pkg-6'].version).toBe('0.0.2')
        expect(result['pkg-6'].changelog).toBeNull()

        expect(mockGit._getTags_()).toEqual([
            'pkg-1@0.0.2',
            'pkg-2@0.1.0',
            'pkg-3@1.0.0',
            'pkg-6@0.0.2',
        ])
        expect(mockGit._getPushedTags_()).toEqual([
            'pkg-1@0.0.2',
            'pkg-2@0.1.0',
            'pkg-3@1.0.0',
            'pkg-6@0.0.2',
        ])
    })
})
