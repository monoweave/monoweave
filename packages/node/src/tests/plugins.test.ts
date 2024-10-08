import fs from 'fs'
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
import { setupMonorepo } from '@monoweave/test-utils'
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

describe('Monoweave Plugins', () => {
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
            await fs.promises.rm(monoweaveConfig.cwd, {
                recursive: true,
                force: true,
            })
        } catch {}
    })

    afterAll(() => {
        delete process.env.MONOWEAVE_LOG_LEVEL
    })

    it('executes the onReleaseAvailable plugin', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')

        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const pluginFilename = path.resolve(monoweaveConfig.cwd, 'onReleaseAvailable.plugin.js')
        await fs.promises.writeFile(
            pluginFilename,
            `
                const fs = require('fs');
                const path = require('path');
                module.exports = ({ onReleaseAvailable }) => {
                    onReleaseAvailable.tapPromise('CustomPlugin', async (context, config, changeset) => {
                        fs.writeFileSync(path.resolve(config.cwd, 'plugin-executed.txt'), 'Exists');
                    })
                }
            `,
        )

        await monoweave({
            ...monoweaveConfig,
            plugins: ['./onReleaseAvailable.plugin.js'],
        })

        expect(fs.existsSync(path.resolve(monoweaveConfig.cwd, 'plugin-executed.txt'))).toBe(true)
    })
})

describe('Monoweave Plugins with Options', () => {
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
            await fs.promises.rm(monoweaveConfig.cwd, {
                recursive: true,
                force: true,
            })
        } catch {}
    })

    afterAll(() => {
        delete process.env.MONOWEAVE_LOG_LEVEL
    })

    it('executes the onReleaseAvailable plugin', async () => {
        mockNPM._setTag_('pkg-1', '0.0.1')
        mockNPM._setTag_('pkg-2', '0.0.1')
        mockNPM._setTag_('pkg-3', '0.0.1')

        mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

        const pluginFilename = path.resolve(monoweaveConfig.cwd, 'onReleaseAvailable.plugin.js')
        await fs.promises.writeFile(
            pluginFilename,
            `
                const fs = require('fs');
                const path = require('path');
                module.exports = ({ onReleaseAvailable }, opts) => {
                    onReleaseAvailable.tapPromise('CustomPlugin', async (context, config, changeset) => {
                        fs.writeFileSync(path.resolve(config.cwd, 'plugin-executed.txt'), JSON.stringify(opts));
                    })
                }
            `,
        )

        await monoweave({
            ...monoweaveConfig,
            plugins: [['./onReleaseAvailable.plugin.js', { keyA: 'valueA' }]],
        })

        const writtenData = await fs.promises.readFile(
            path.resolve(monoweaveConfig.cwd, 'plugin-executed.txt'),
            'utf-8',
        )
        expect(writtenData).toEqual(expect.stringContaining('"keyA":"valueA"'))
    })
})
