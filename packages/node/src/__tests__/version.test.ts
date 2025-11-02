import { promises as fs } from 'fs'

import * as git from '@monoweave/git'
import { LOG_LEVELS } from '@monoweave/logging'
import { setupMonorepo } from '@monoweave/test-utils'
import {
    type CommitMessage,
    type MonoweaveConfiguration,
    RegistryMode,
    type YarnContext,
} from '@monoweave/types'
import { npath } from '@yarnpkg/fslib'
import * as npm from '@yarnpkg/plugin-npm'
import {
    type Mocked,
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { getPackageCandidatesForManualRelease } from '../version.js'

vi.mock('@monoweave/git', async () => vi.importActual('@monoweave/git/test-mocks'))

const mockGit = git as Mocked<
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
const mockNPM = npm as Mocked<
    typeof npm & {
        _reset_: () => void
        _setTag_: (pkgName: string, tagValue: string, tagKey?: string) => void
    }
>

const setupExampleMonorepo = async (): Promise<YarnContext> => {
    const context = await setupMonorepo({
        'pkg-1': {},
        'pkg-2': { devDependencies: [] },
        'pkg-3': { dependencies: ['pkg-2'] },
    })
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

    it('suggests modified packages since last tag', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const { packages } = await getPackageCandidatesForManualRelease(monoweaveConfig)

        expect(packages.size).toBe(3)
        expect(packages.get('pkg-1')).toEqual(expect.objectContaining({ modified: true }))
        expect(packages.get('pkg-2')).toEqual(expect.objectContaining({ modified: false }))
        expect(packages.get('pkg-3')).toEqual(expect.objectContaining({ modified: false }))
    })

    it('filters packages using glob patterns', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const { packages } = await getPackageCandidatesForManualRelease(monoweaveConfig, {
            includePatterns: ['*-2', 'package-*'],
        })
        expect(packages.size).toBe(1)
        expect(packages.get('pkg-2')).toEqual(expect.objectContaining({ modified: false }))
    })

    it('does not filter if includePatterns is empty', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const { packages } = await getPackageCandidatesForManualRelease(monoweaveConfig, {
            includePatterns: [],
        })

        expect(packages.size).toBe(3)
        expect(packages.get('pkg-1')).toEqual(expect.objectContaining({ modified: true }))
        expect(packages.get('pkg-2')).toEqual(expect.objectContaining({ modified: false }))
        expect(packages.get('pkg-3')).toEqual(expect.objectContaining({ modified: false }))
    })
})
