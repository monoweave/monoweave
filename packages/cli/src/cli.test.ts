import { promises as fs } from 'fs'
import path from 'path'

import monoweave from '@monoweave/node'
import { createTempDir, waitFor } from '@monoweave/test-utils'
import {
    type MonoweaveConfigFile,
    type MonoweaveConfiguration,
    type RecursivePartial,
} from '@monoweave/types'
import JSON5 from 'json5'
import YAML from 'yaml'

const scriptPath = path.join(__dirname, 'index.ts')

jest.mock('@monoweave/node', () => ({
    __esModule: true,
    default: jest.fn(),
}))

async function waitForMonoweaveRun(): Promise<RecursivePartial<MonoweaveConfiguration>> {
    return await waitFor(async () => {
        const arg = jest.mocked(monoweave).mock.calls[0][0]
        if (!arg) throw new Error('Missing arg!')
        return arg
    })
}

describe('CLI', () => {
    const origArgs = process.argv

    beforeAll(() => {
        process.env.MONOWEAVE_SUPPRESS_EXIT_CODE = '1'
    })

    afterAll(() => {
        process.argv = origArgs
    })

    afterEach(() => {
        // eslint-disable-next-line prettier/prettier
        (monoweave as jest.MockedFunction<typeof monoweave>).mockClear();
        process.env.MONOWEAVE_DISABLE_LOGS = '1'
        jest.clearAllMocks()
    })

    const setArgs = (command: string) => {
        process.argv = command ? ['node', scriptPath, ...command.split(' ')] : ['node', scriptPath]
    }

    describe('CLI Args', () => {
        it('passes cli flags to monoweave', async () => {
            setArgs(
                '--registry-url http://example.com --cwd /tmp --dry-run ' +
                    '--git-base-branch main --git-commit-sha HEAD --git-remote origin ' +
                    '--log-level 0 --conventional-changelog-config @my/config ' +
                    '--changeset-filename changes.json --changelog-filename changelog.md --force-write-change-files ' +
                    '--push --persist-versions --access infer --topological --topological-dev --jobs 6 ' +
                    '--auto-commit --auto-commit-message release --plugins plugin-a --plugins plugin-b ' +
                    '--max-concurrent-reads 3 --max-concurrent-writes 4 --no-git-tag --registry-mode npm ' +
                    '--changeset-ignore-patterns *.test.js --prerelease --prerelease-id rc --prerelease-npm-tag beta ' +
                    '--commit-ignore-patterns skip-ci --package-group-manifest-field group --apply-changeset ' +
                    '--minimum-version-strategy minor',
            )
            jest.isolateModules(() => {
                require('./index')
            })
            expect(await waitForMonoweaveRun()).toMatchSnapshot()
        })

        describe('Dry Run', () => {
            it.each`
                ci             | expected
                ${undefined}   | ${true}
                ${null}        | ${true}
                ${'undefined'} | ${true}
                ${'null'}      | ${true}
                ${''}          | ${true}
                ${'0'}         | ${true}
                ${'false'}     | ${true}
                ${'FALSE'}     | ${true}
                ${'1'}         | ${false}
                ${'true'}      | ${false}
            `(
                'defaults dryRun to $expected when the environment variable CI is $ci',
                async ({ ci, expected }) => {
                    const oldEnv = { ...process.env }
                    process.env.CI = ci

                    // using "null" (which is an invalid env value as a placeholder to mean unset
                    if (ci === null) {
                        delete process.env.CI
                    }

                    setArgs('--cwd /tmp')
                    jest.isolateModules(() => {
                        require('./index')
                    })

                    expect(await waitForMonoweaveRun()).toEqual(
                        expect.objectContaining({ dryRun: expected }),
                    )

                    process.env = { ...oldEnv }
                },
            )

            it('allows disabling dry run outside of CI if --no-dry-run is provided', async () => {
                const oldEnv = { ...process.env }
                delete process.env.CI

                setArgs('--cwd /tmp --no-dry-run')
                jest.isolateModules(() => {
                    require('./index')
                })
                expect(await waitForMonoweaveRun()).toEqual(
                    expect.objectContaining({ dryRun: false }),
                )

                process.env = { ...oldEnv }
            })
        })

        it('passes empty config if no cli flags set', async () => {
            setArgs('')
            jest.isolateModules(() => {
                require('./index')
            })
            expect(await waitForMonoweaveRun()).toMatchSnapshot()
        })

        it('sets exit code to error if monoweave throws', async () => {
            expect.hasAssertions()

            delete process.env.MONOWEAVE_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()
            const error = new Error('Monoweave failed.')
            ;(monoweave as jest.MockedFunction<typeof monoweave>).mockImplementation(() => {
                throw error
            })
            setArgs('')

            jest.isolateModules(() => {
                require('./index')
            })

            await waitFor(async () => {
                expect(spyError).toHaveBeenCalledWith(`${String(error)}\n`)
            })
        })
    })

    describe('Config File', () => {
        it('throws an error if unable to read config file', async () => {
            expect.hasAssertions()

            delete process.env.MONOWEAVE_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()

            const configFileContents = `
                invalid_javascript{} = {
                    invalid code
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })

            await waitFor(async () => {
                expect(spyError).toHaveBeenCalled()
            })
        })

        it('throws an error if invalid configuration', async () => {
            expect.hasAssertions()

            delete process.env.MONOWEAVE_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()

            const configFileContents = `
                module.exports = { git: { baseBranch: true } }
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await waitFor(async () => {
                expect(spyError).toHaveBeenCalled()
            })
        })

        it('reads from specified config file using absolute path', async () => {
            const configFileContents = `
                module.exports = {
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    autoCommit: true,
                    autoCommitMessage: 'chore: release',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    git: {
                        baseBranch: 'main',
                        commitSha: 'HEAD',
                        push: true,
                        remote: 'origin',
                        tag: true,
                    },
                    jobs: 6,
                    persistVersions: true,
                    registryUrl: 'http://example.com',
                    registryMode: 'manifest',
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 3,
                    maxConcurrentWrites: 5,
                    plugins: ['plugin-a', 'plugin-b'],
                    prerelease: true,
                    prereleaseId: 'alpha',
                    prereleaseNPMTag: 'beta',
                    commitIgnorePatterns: ['skip-ci'],
                    packageGroups: { 'pkg-1': { registryMode: 'npm' }, 'pkg-2': { registryMode: 'manifest' } },
                    versionStrategy: {
                        minimumStrategy: 'minor',
                    },
                }
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })
            expect(await waitForMonoweaveRun()).toMatchSnapshot()
        })

        it('reads from specified config file using path relative to cwd', async () => {
            const configFileContents = `
                module.exports = {
                    access: 'restricted',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: {
                        name: '@my/config-from-file',
                        someData: 123,
                    },
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    git: {
                        baseBranch: 'main',
                        commitSha: 'HEAD',
                        push: true,
                        remote: 'origin',
                        tag: false,
                    },
                    jobs: 6,
                    persistVersions: true,
                    registryUrl: 'http://example.com',
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 6,
                    maxConcurrentWrites: 2,
                    prerelease: false,
                    prereleaseNPMTag: 'alpha',
                }
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file monoweave.config.js --cwd ${tmpDir.dir}`)
            jest.isolateModules(() => {
                require('./index')
            })
            expect({
                ...(await waitForMonoweaveRun()),
                cwd: '/tmp/cwd',
            }).toMatchSnapshot()
        })

        it('reads from specified config file using relative path', async () => {
            const configFileContents = `
                module.exports = {
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    changesetIgnorePatterns: ['*.test.js', '*.snap'],
                    git: {
                        baseBranch: 'main',
                        commitSha: 'HEAD',
                        push: true,
                        remote: 'origin',
                        tag: false,
                    },
                    jobs: 6,
                    persistVersions: true,
                    registryUrl: 'http://example.com',
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 2,
                    maxConcurrentWrites: 1,
                    packageGroupManifestField: 'group',
                }
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ./monoweave.config.js --cwd ${tmpDir.dir}`)
            jest.isolateModules(() => {
                require('./index')
            })
            expect({ ...(await waitForMonoweaveRun()), cwd: '/tmp/cwd' }).toMatchSnapshot()
        })

        describe('Config File Formats', () => {
            const configContents: MonoweaveConfigFile = {
                access: 'public',
                changelogFilename: 'from_file.changelog.md',
                changesetFilename: 'from_file.changes.json',
                conventionalChangelogConfig: '@my/config-from-file',
                dryRun: true,
                forceWriteChangeFiles: true,
                changesetIgnorePatterns: ['*.test.js', '*.snap'],
                git: {
                    baseBranch: 'main',
                    commitSha: 'HEAD',
                    push: true,
                    remote: 'origin',
                    tag: false,
                },
                jobs: 6,
                persistVersions: true,
                registryUrl: 'http://example.com',
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 2,
                maxConcurrentWrites: 1,
                packageGroupManifestField: 'group',
            }

            async function writeConfigFile({
                filename,
                contents,
            }: {
                filename: string
                contents: string
            }): Promise<RecursivePartial<MonoweaveConfiguration>> {
                await using tmpDir = await createTempDir()
                const configFilename = path.resolve(path.join(tmpDir.dir, filename))
                await fs.writeFile(configFilename, contents, 'utf-8')
                setArgs(`--config-file ./${filename} --cwd ${tmpDir.dir}`)
                jest.isolateModules(() => {
                    require('./index')
                })

                return await waitFor(async () => {
                    const arg = jest.mocked(monoweave).mock.calls[0][0]
                    if (!arg) throw new Error('Missing arg!')
                    return arg
                })
            }

            beforeEach(() => {
                delete process.env.MONOWEAVE_DISABLE_LOGS
            })

            it('supports .js extensions', async () => {
                const filename = 'monoweave.config.js'
                const contents = `module.exports = ${JSON.stringify(configContents)}`

                const config = await writeConfigFile({ filename, contents })
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toEqual(
                    expect.objectContaining({
                        changelogFilename: configContents.changelogFilename,
                    }),
                )
            })

            it.each(['json', 'jsonc', 'json5'])('supports .%s extensions', async (ext: string) => {
                const filename = `monoweave.config.${ext}`
                const contents = JSON5.stringify(configContents)

                const config = await writeConfigFile({ filename, contents })
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toEqual(
                    expect.objectContaining({
                        changelogFilename: configContents.changelogFilename,
                    }),
                )
            })

            it.each(['yml', 'yaml'])('supports .%s extensions', async (ext: string) => {
                const filename = `monoweave.config.${ext}`
                const contents = YAML.stringify(configContents)

                const config = await writeConfigFile({ filename, contents })
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toEqual(
                    expect.objectContaining({
                        changelogFilename: configContents.changelogFilename,
                    }),
                )
            })

            // TODO: Unable to test this with Jest
            // eslint-disable-next-line jest/no-disabled-tests
            it.skip('supports .cjs extensions', async () => {
                const filename = 'monoweave.config.cjs'
                const contents = `module.exports = ${JSON.stringify(configContents)}`

                const config = await writeConfigFile({ filename, contents })
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toEqual(
                    expect.objectContaining({
                        changelogFilename: configContents.changelogFilename,
                    }),
                )
            })

            it.todo('supports .cts extensions')
            it.todo('supports .mjs extensions')
            it.todo('supports .mts extensions')
        })

        describe('Default Config File Discovery', () => {
            const configContents: MonoweaveConfigFile = {
                access: 'public',
                changelogFilename: 'from_file.changelog.md',
                changesetFilename: 'from_file.changes.json',
                conventionalChangelogConfig: '@my/config-from-file',
                dryRun: true,
                forceWriteChangeFiles: true,
                changesetIgnorePatterns: ['*.test.js', '*.snap'],
                git: {
                    baseBranch: 'main',
                    commitSha: 'HEAD',
                    push: true,
                    remote: 'origin',
                    tag: false,
                },
                jobs: 6,
                persistVersions: true,
                registryUrl: 'http://example.com',
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 2,
                maxConcurrentWrites: 1,
                packageGroupManifestField: 'group',
            }

            async function writeConfigFile({
                filename,
                contents,
            }: {
                filename: string
                contents: string
            }): Promise<RecursivePartial<MonoweaveConfiguration>> {
                await using tmpDir = await createTempDir()
                const configFilename = path.resolve(path.join(tmpDir.dir, filename))
                await fs.writeFile(configFilename, contents, 'utf-8')
                // We're testing "defaults" so do not pass a --config-file
                setArgs(`--cwd ${tmpDir.dir}`)
                jest.isolateModules(() => {
                    require('./index')
                })

                return await waitFor(async () => {
                    const arg = jest.mocked(monoweave).mock.calls[0][0]
                    if (!arg) throw new Error('Missing arg!')
                    return arg
                })
            }

            beforeEach(() => {
                delete process.env.MONOWEAVE_DISABLE_LOGS
            })

            it('supports .js extensions', async () => {
                const filename = 'monoweave.config.js'
                const contents = `module.exports = ${JSON.stringify(configContents)}`

                const config = await writeConfigFile({ filename, contents })
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toEqual(
                    expect.objectContaining({
                        changelogFilename: configContents.changelogFilename,
                    }),
                )
            })

            it.each(['json', 'jsonc', 'json5'])('supports .%s extensions', async (ext: string) => {
                const filename = `monoweave.config.${ext}`
                const contents = JSON5.stringify(configContents)

                const config = await writeConfigFile({ filename, contents })
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toEqual(
                    expect.objectContaining({
                        changelogFilename: configContents.changelogFilename,
                    }),
                )
            })

            it.each(['yml', 'yaml'])('supports .%s extensions', async (ext: string) => {
                const filename = `monoweave.config.${ext}`
                const contents = YAML.stringify(configContents)

                const config = await writeConfigFile({ filename, contents })
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toEqual(
                    expect.objectContaining({
                        changelogFilename: configContents.changelogFilename,
                    }),
                )
            })
        })

        it('gives precedence to cli flags over config file', async () => {
            const configFileContents = `
            module.exports = {
                access: 'public',
                changelogFilename: 'from_file.changelog.md',
                changesetFilename: 'from_file.changes.json',
                conventionalChangelogConfig: '@my/config-from-file',
                dryRun: true,
                forceWriteChangeFiles: true,
                autoCommit: true,
                autoCommitMessage: 'chore: release',
                git: {
                    baseBranch: 'main',
                    commitSha: 'HEAD',
                    push: true,
                    remote: 'origin',
                    tag: false,
                },
                jobs: 6,
                persistVersions: true,
                registryUrl: 'http://example.com',
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 10,
                maxConcurrentWrites: 11,
                prerelease: true,
                prereleaseId: 'beta',
                commitIgnorePatterns: ['skip-ci'],
                packageGroupManifestField: 'group',
                changesetIgnorePatterns: ['*.test.js', '*.snap'],
            }
        `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(
                `--config-file ${configFilename} --git-base-branch next --jobs 3 --commit-ignore-patterns ignore-me --plugins plugin-a`,
            )
            jest.isolateModules(() => {
                require('./index')
            })
            expect(await waitForMonoweaveRun()).toMatchSnapshot()
        })

        it('gives precedence to cli flags over config file with negated flags', async () => {
            const configFileContents = `
            module.exports = {
                access: 'public',
                changelogFilename: 'from_file.changelog.md',
                changesetFilename: 'from_file.changes.json',
                conventionalChangelogConfig: '@my/config-from-file',
                dryRun: true,
                forceWriteChangeFiles: true,
                autoCommit: true,
                autoCommitMessage: 'chore: release',
                git: {
                    baseBranch: 'main',
                    commitSha: 'HEAD',
                    push: true,
                    remote: 'origin',
                    tag: false,
                },
                jobs: 6,
                persistVersions: true,
                registryUrl: 'http://example.com',
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 10,
                maxConcurrentWrites: 11,
                prerelease: true,
                prereleaseId: 'beta',
                changesetIgnorePatterns: ['*.test.js', '*.snap'],
            }
        `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(
                `--config-file ${configFilename} --git-base-branch next --jobs 3 --no-prerelease ` +
                    '--no-topological --no-topological-dev --no-persist-versions --no-changeset-ignore-patterns',
            )
            jest.isolateModules(() => {
                require('./index')
            })
            expect(await waitForMonoweaveRun()).toMatchSnapshot()
        })
    })

    describe('Presets', () => {
        it('throws an error if unable to read the preset file', async () => {
            expect.hasAssertions()

            delete process.env.MONOWEAVE_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()

            const configFileContents = `
                module.exports = { preset: './preset.js', git: { baseBranch: 'main' } }
            `

            const presetFileContents = `
                invalid_javascript{} = {
                    invalid code
            `

            await using tmpDir = await createTempDir()
            const presetFilename = path.resolve(path.join(tmpDir.dir, 'preset.js'))
            await fs.writeFile(presetFilename, presetFileContents, 'utf-8')

            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await waitFor(async () => {
                expect(spyError).toHaveBeenCalled()
            })
        })

        it('throws an error if invalid configuration', async () => {
            expect.hasAssertions()

            delete process.env.MONOWEAVE_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()

            const configFileContents = `
                module.exports = { preset: './preset.js', git: { baseBranch: true } }
            `

            const presetFileContents = `
                module.exports = { git: { baseBranch: true } }
            `

            await using tmpDir = await createTempDir()
            const presetFilename = path.resolve(path.join(tmpDir.dir, 'preset.js'))
            await fs.writeFile(presetFilename, presetFileContents, 'utf-8')

            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await waitFor(async () => {
                expect(spyError).toHaveBeenCalled()
            })
        })

        it('merges preset with overrides, defined in config file', async () => {
            const presetFileContents = `
                module.exports = {
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    changesetIgnorePatterns: ['*.test.js', '*.snap'],
                    git: {
                        baseBranch: 'main-1',
                        commitSha: 'HEAD',
                        push: true,
                        remote: 'origin',
                        tag: false,
                    },
                    jobs: 6,
                    persistVersions: true,
                    registryUrl: 'http://example.com',
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 2,
                    maxConcurrentWrites: 1,
                    packageGroupManifestField: 'group',
                }
            `

            const configFileContents = `
                module.exports = {
                    preset: './some-preset.js',
                    access: 'infer',
                    changesetIgnorePatterns: ['*.snap'],
                    git: {
                        push: false,
                        remote: 'upstream',
                    },
                    jobs: 2,
                    maxConcurrentReads: 0,
                }
            `

            await using tmpDir = await createTempDir()
            const presetFilename = path.resolve(path.join(tmpDir.dir, 'some-preset.js'))
            await fs.writeFile(presetFilename, presetFileContents, 'utf-8')
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ./monoweave.config.js --cwd ${tmpDir.dir}`)
            jest.isolateModules(() => {
                require('./index')
            })
            expect({ ...(await waitForMonoweaveRun()), cwd: '/tmp/cwd' }).toMatchSnapshot()
        })

        it('merges preset with overrides, with preset passed as cli arg', async () => {
            const presetFileContents = `
                module.exports = {
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    changesetIgnorePatterns: ['*.test.js', '*.snap'],
                    git: {
                        baseBranch: 'main-1',
                        commitSha: 'HEAD',
                        push: true,
                        remote: 'origin',
                        tag: false,
                    },
                    jobs: 6,
                    persistVersions: true,
                    registryUrl: 'http://example.com',
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 2,
                    maxConcurrentWrites: 1,
                    packageGroupManifestField: 'group',
                }
            `

            const configFileContents = `
                module.exports = {
                    access: 'infer',
                    changesetIgnorePatterns: ['*.snap'],
                    git: {
                        push: false,
                        remote: 'upstream',
                    },
                    jobs: 2,
                    maxConcurrentReads: 0,
                }
            `

            await using tmpDir = await createTempDir()
            const presetFilename = path.resolve(path.join(tmpDir.dir, 'some-preset.js'))
            await fs.writeFile(presetFilename, presetFileContents, 'utf-8')
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(
                `--config-file ./monoweave.config.js --preset ./some-preset.js --cwd ${tmpDir.dir}`,
            )
            jest.isolateModules(() => {
                require('./index')
            })
            expect({ ...(await waitForMonoweaveRun()), cwd: '/tmp/cwd' }).toMatchSnapshot()
        })

        it.each(['recommended', 'legacy'])('reads built-in presets: %s', async (preset) => {
            await using tmpDir = await createTempDir()

            const configFileContents = `
                module.exports = {
                    preset: 'monoweave/preset-${preset}',
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    autoCommitMessage: 'chore: release',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    git: {
                        baseBranch: 'main',
                        commitSha: 'HEAD',
                        remote: 'origin',
                        tag: true,
                    },
                    jobs: 6,
                    registryUrl: 'http://example.com',
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 3,
                    maxConcurrentWrites: 5,
                    plugins: ['plugin-a', 'plugin-b'],
                    prerelease: true,
                    prereleaseId: 'alpha',
                    prereleaseNPMTag: 'beta',
                }
            `

            const configFilename = path.resolve(path.join(tmpDir.dir, 'monoweave.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--cwd ${tmpDir.dir}`)
            jest.isolateModules(() => {
                require('./index')
            })
            expect({ ...(await waitForMonoweaveRun()), cwd: '/tmp/cwd' }).toMatchSnapshot()
        })
    })
})
