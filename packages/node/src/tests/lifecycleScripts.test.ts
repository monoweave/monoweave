import { promises as fs } from 'fs'
import path from 'path'

import * as git from '@monoweave/git'
import { LOG_LEVELS } from '@monoweave/logging'
import { setupMonorepo } from '@monoweave/test-utils'
import { type MonoweaveConfiguration, RegistryMode } from '@monoweave/types'
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
    topological: true,
    topologicalDev: true,
    jobs: 100,
    forceWriteChangeFiles: false,
    maxConcurrentReads: 4,
    maxConcurrentWrites: 3,
    prerelease: false,
    prereleaseId: 'rc',
    prereleaseNPMTag: 'next',
}

const resolvePackagePath = (pkgName: string, filename: string) =>
    path.resolve(path.join(monoweaveConfig.cwd, 'packages', pkgName), filename)

describe('Monoweave Lifecycle Scripts', () => {
    beforeAll(async () => {
        process.env.MONOWEAVE_LOG_LEVEL = String(LOG_LEVELS.ERROR)
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

    describe('valid scripts', () => {
        beforeEach(async () => {
            const scripts = {
                prepack: 'node -p "process.hrtime.bigint().toString()" > .prepack.test.tmp',
                prepare: 'node -p "process.hrtime.bigint().toString()" > .prepare.test.tmp',
                prepublish: 'node -p "process.hrtime.bigint().toString()" > .prepublish.test.tmp',
                prepublishOnly:
                    'node -p "process.hrtime.bigint().toString()" > .prepublishOnly.test.tmp',
                postpack: 'node -p "process.hrtime.bigint().toString()" > .postpack.test.tmp',
                postpublish: 'node -p "process.hrtime.bigint().toString()" > .postpublish.test.tmp',
            }
            const context = await setupMonorepo(
                {
                    'pkg-1': {},
                    'pkg-2': {},
                    'pkg-3': { dependencies: ['pkg-2'] },
                    'pkg-4': { scripts },
                    'pkg-5': { dependencies: ['pkg-4'], scripts },
                    'pkg-6': {
                        dependencies: ['pkg-3', 'pkg-7'],
                        devDependencies: ['pkg-1'],
                        scripts,
                    },
                    'pkg-7': { scripts },
                },
                {
                    root: {
                        dependencies: {
                            'conventional-changelog-angular': '7.0.0',
                        },
                    },
                },
            )
            monoweaveConfig.cwd = npath.fromPortablePath(context.project.cwd)
        })

        it('runs lifecycle scripts for changed workspaces', async () => {
            mockNPM._setTag_('pkg-1', '0.0.1')
            mockNPM._setTag_('pkg-2', '0.1.1')
            mockNPM._setTag_('pkg-3', '0.0.1')
            mockNPM._setTag_('pkg-4', '0.0.1')
            mockNPM._setTag_('pkg-5', '0.0.1')
            mockNPM._setTag_('pkg-6', '0.0.1')
            mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-4/README.md'])
            mockGit._commitFiles_('sha1', 'feat: some other feature!', [
                './packages/pkg-2/README.md',
            ])

            const result = await monoweave(monoweaveConfig)

            // pkg-4 is explicitly updated with minor bump
            expect(result['pkg-4'].version).toBe('0.1.0')
            expect(result['pkg-4'].changelog).toEqual(expect.stringContaining('some new feature'))

            // pkg-2 is explicitly bumped with minor
            expect(result['pkg-2'].version).toBe('0.2.0')
            expect(result['pkg-2'].changelog).toEqual(expect.stringContaining('some other feature'))

            // pkg-5 depends on pkg-4, so it'll be bumped as a dependant
            // pkg-3 is bumped because it depends on pkg-2
            // pkg-6 is bumped because it depends on pkg-3
            expect(mockGit._getPushedTags_()).toEqual([
                'pkg-2@0.2.0',
                'pkg-3@0.0.2',
                'pkg-4@0.1.0',
                'pkg-5@0.0.2',
                'pkg-6@0.0.2',
            ])

            const orderedFilesToCheck = [
                '.prepublish.test.tmp',
                '.prepare.test.tmp',
                '.prepublishOnly.test.tmp',
                '.prepack.test.tmp',
                '.postpack.test.tmp',
                '.postpublish.test.tmp',
            ]

            let timestamp = BigInt(0)
            for (const fileToCheck of orderedFilesToCheck) {
                const filename = resolvePackagePath('pkg-4', fileToCheck)
                const time = BigInt(await fs.readFile(filename, 'utf8'))

                expect(time).toBeGreaterThanOrEqual(timestamp)
                timestamp = time
            }
        })

        it('does not run lifecycle scripts in dry run mode', async () => {
            mockNPM._setTag_('pkg-1', '0.0.1')
            mockNPM._setTag_('pkg-2', '0.1.1')
            mockNPM._setTag_('pkg-3', '0.0.1')
            mockNPM._setTag_('pkg-4', '0.0.1')
            mockNPM._setTag_('pkg-5', '0.0.1')
            mockNPM._setTag_('pkg-6', '0.0.1')
            mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-4/README.md'])
            mockGit._commitFiles_('sha1', 'feat: some other feature!', [
                './packages/pkg-2/README.md',
            ])

            const result = await monoweave({ ...monoweaveConfig, dryRun: true })

            // pkg-4 is explicitly updated with minor bump
            expect(result['pkg-4'].version).toBe('0.1.0')
            expect(result['pkg-4'].changelog).toEqual(expect.stringContaining('some new feature'))

            // pkg-2 is explicitly bumped with minor
            expect(result['pkg-2'].version).toBe('0.2.0')
            expect(result['pkg-2'].changelog).toEqual(expect.stringContaining('some other feature'))

            const filesToCheck = [
                '.prepack.test.tmp',
                '.prepare.test.tmp',
                '.prepublish.test.tmp',
                '.postpack.test.tmp',
                '.postpublish.test.tmp',
            ]

            for (const fileToCheck of filesToCheck) {
                const filename = resolvePackagePath('pkg-4', fileToCheck)
                const exists = await fs
                    .stat(filename)
                    .then(() => true)
                    .catch(() => false)
                expect(exists).toBe(false)
            }
        })
    })

    describe('script errors', () => {
        it('raises an error if a lifecycle script fails', async () => {
            const scripts = {
                prepack: 'exit 1',
            }
            const context = await setupMonorepo(
                {
                    'pkg-1': { scripts },
                },
                {
                    root: {
                        dependencies: {
                            'conventional-changelog-angular': '7.0.0',
                        },
                    },
                },
            )
            monoweaveConfig.cwd = npath.fromPortablePath(context.project.cwd)

            mockNPM._setTag_('pkg-1', '0.0.1')
            mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])

            await expect(monoweave(monoweaveConfig)).rejects.toThrow()
        })
    })

    describe('variables', () => {
        it('sets working directory', async () => {
            const scripts = {
                prepack: 'echo "$(pwd)" > .prepack.tmp',
            }
            const context = await setupMonorepo(
                {
                    'pkg-1': { scripts },
                },
                {
                    root: {
                        dependencies: {
                            'conventional-changelog-angular': '7.0.0',
                        },
                    },
                },
            )
            monoweaveConfig.cwd = npath.fromPortablePath(context.project.cwd)

            mockNPM._setTag_('pkg-1', '0.0.1')
            mockGit._commitFiles_('sha1', 'feat: some new feature!', ['./packages/pkg-1/README.md'])
            await monoweave(monoweaveConfig)

            const filename = resolvePackagePath('pkg-1', '.prepack.tmp')
            expect((await fs.readFile(filename, 'utf-8')).trim()).toEqual(
                path.resolve(monoweaveConfig.cwd, 'packages', 'pkg-1'),
            )
        })
    })
})
