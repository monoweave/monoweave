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
import { type MonoweaveConfiguration, RegistryMode, type YarnContext } from '@monoweave/types'
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

describe('Monoweave (Dry Run)', () => {
    const monoweaveConfig: MonoweaveConfiguration = {
        cwd: '/tmp/to-be-overwritten-by-before-each',
        dryRun: true,
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
        maxConcurrentWrites: 0,
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

    it('throws an error if invoked with invalid cwd', async () => {
        await expect(async () => {
            await monoweave({
                ...monoweaveConfig,
                cwd: String(undefined),
            })
        }).rejects.toThrow(/Invalid cwd/)
    })

    it('throws an error if invoked in a non-project', async () => {
        await using tmp = await createTempDir()
        await expect(async () => {
            await monoweave({
                ...monoweaveConfig,
                cwd: tmp.dir,
            })
        }).rejects.toThrow(/No project/)
    })

    it('does not publish if no changes detected', async () => {
        const result = await monoweave(monoweaveConfig)
        expect(result).toEqual({})
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('publishes only changed workspaces', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const result = await monoweave(monoweaveConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toBe('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(expect.stringContaining('some new feature'))

        // pkg-2 and pkg-3 not in dependency graph
        expect(result['pkg-2']).toBeUndefined()
        expect(result['pkg-3']).toBeUndefined()

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('propagates dependant changes', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!\n\nBREAKING CHANGE: major bump!', [
            './packages/pkg-2/README.md',
        ])

        const result = await monoweave(monoweaveConfig)

        // pkg-1 is not in modified dependency graph
        expect(result['pkg-1']).toBeUndefined()

        // pkg-2 is the one explicitly updated with breaking change
        expect(result['pkg-2'].version).toBe('1.0.0')
        expect(result['pkg-2'].changelog).toEqual(expect.stringContaining('some new feature'))

        // pkg-3 depends on pkg-2, and is updated as dependent
        expect(result['pkg-3'].version).toBe('0.0.2')
        expect(result['pkg-3'].changelog).not.toEqual(expect.stringContaining('some new feature'))

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('defaults to 0.0.0 as base version for first publish if no version found in manifest', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const result = await monoweave(monoweaveConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toBe('0.1.0')
        expect(result['pkg-1'].changelog).toEqual(expect.stringContaining('some new feature'))

        // pkg-2 and pkg-3 not in dependency graph
        expect(result['pkg-2']).toBeUndefined()
        expect(result['pkg-3']).toBeUndefined()

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('defaults to version from manifest if no version found in package registry', async () => {
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-8/README.md'])

        const result = await monoweave(monoweaveConfig)

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-8'].version).toBe('3.2.0')
        expect(result['pkg-8'].changelog).toEqual(expect.stringContaining('some new feature'))

        // Not tags pushed in dry run
        expect(mockGit._getPushedTags_()).toHaveLength(0)
    })

    it('updates changelog and changeset if forced', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')
        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

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

        const result = await monoweave({
            ...monoweaveConfig,
            changelogFilename,
            changesetFilename,
            forceWriteChangeFiles: true,
        })

        // pkg-1 is explicitly updated with minor bump
        expect(result['pkg-1'].version).toBe('0.1.0')

        const updatedChangelog = await fs.readFile(changelogFilename, {
            encoding: 'utf-8',
        })

        // assert it contains the new entry
        expect(updatedChangelog).toEqual(expect.stringContaining('some new feature'))

        // assert it contains the old entries
        expect(updatedChangelog).toEqual(expect.stringContaining('Old Versions'))

        const changeset = JSON.parse(
            await fs.readFile(changesetFilename, {
                encoding: 'utf-8',
            }),
        )

        expect(changeset).toEqual(
            expect.objectContaining({
                'pkg-1': expect.objectContaining({
                    version: '0.1.0',
                    changelog: expect.stringContaining('some new feature'),
                }),
            }),
        )
    })
})
