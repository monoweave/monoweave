import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as git from '@monoweave/git'
import { createMonorepoContext, getMonoweaveConfig } from '@monoweave/test-utils'
import { npath, ppath } from '@yarnpkg/fslib'

import {
    getManualVersionStrategies,
    parseDeferredVersionFile,
    writeDeferredVersionFile,
} from './getManualVersionStrategies'

const mockGit = jest.mocked(git)

describe('Version File Parsing', () => {
    it('throws an error on invalid files', async () => {
        await expect(() =>
            parseDeferredVersionFile(
                ['"@scope/package": minor', '---', 'Changelog entry.'].join('\n'),
            ),
        ).rejects.toThrow(/Invalid version file/)
    })

    it('parses a version file', async () => {
        const contents = await parseDeferredVersionFile(
            [
                '---',
                '"@my/package-1": minor',
                '"@my/package-2": major',
                '---',
                'This is a multi-line',
                'changelog entry.',
            ].join('\n'),
        )

        expect(contents).toEqual({
            strategies: {
                '@my/package-1': 'minor',
                '@my/package-2': 'major',
            },
            changelog: 'This is a multi-line\nchangelog entry.',
        })
    })
})

describe('getManualVersionStrategies', () => {
    beforeEach(() => {
        delete process.env.GITHUB_REF
        delete process.env.GITHUB_ACTION
        delete process.env.GITHUB_EVENT_NAME
    })

    it('returns an empty strategy map if no version files found', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
            'pkg-2': {},
        })

        const { deferredVersionFiles, intentionalStrategies } = await getManualVersionStrategies({
            context,
            config: await getMonoweaveConfig(),
        })

        expect(deferredVersionFiles).toHaveLength(0)
        expect(intentionalStrategies.size).toBe(0)
    })

    it('ignores failures obtaining upstream branch', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
            'pkg-2': {},
        })

        jest.spyOn(mockGit, 'gitUpstreamBranch').mockRejectedValueOnce(() => {
            throw new Error('Failure!')
        })

        const { deferredVersionFiles, intentionalStrategies } = await getManualVersionStrategies({
            context,
            config: await getMonoweaveConfig(),
        })

        expect(deferredVersionFiles).toHaveLength(0)
        expect(intentionalStrategies.size).toBe(0)
    })

    it('merges version strategies across version files', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
            'pkg-2': {},
        })

        const versionFolder = npath.fromPortablePath(
            ppath.resolve(context.project.cwd, '.monoweave'),
        )

        await writeDeferredVersionFile({
            versionFolder,
            deferredVersion: {
                strategies: {
                    'pkg-1': 'patch',
                },
                changelog: 'changelog-1',
            },
        })
        await writeDeferredVersionFile({
            versionFolder,
            deferredVersion: {
                strategies: {
                    'pkg-1': 'minor',
                    'pkg-2': 'patch',
                },
                changelog: 'changelog-2',
            },
        })

        const { deferredVersionFiles, intentionalStrategies } = await getManualVersionStrategies({
            context,
            config: await getMonoweaveConfig(),
        })

        expect(deferredVersionFiles).toHaveLength(2)
        expect(intentionalStrategies.get('pkg-1')!.type).toBe('minor')
        expect(intentionalStrategies.get('pkg-2')!.type).toBe('patch')
        expect(intentionalStrategies.get('pkg-1')!.changelog).toEqual(
            expect.stringContaining('changelog-1'),
        )
        expect(intentionalStrategies.get('pkg-1')!.changelog).toEqual(
            expect.stringContaining('changelog-2'),
        )

        // and assert pkg-2 only has changelog 2
        expect(intentionalStrategies.get('pkg-2')!.changelog).not.toEqual(
            expect.stringContaining('changelog-1'),
        )
        expect(intentionalStrategies.get('pkg-2')!.changelog).toEqual(
            expect.stringContaining('changelog-2'),
        )
    })

    it('skips version files that have already been consumed on the remote tracking branch', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
            'pkg-2': {},
        })

        const versionFolder = npath.fromPortablePath(
            ppath.resolve(context.project.cwd, '.monoweave'),
        )

        const { versionFilePath: versionFilePath1 } = await writeDeferredVersionFile({
            versionFolder,
            deferredVersion: {
                strategies: {
                    'pkg-1': 'minor',
                },
                changelog: 'changelog-1',
            },
        })

        const { versionFilePath: versionFilePath2 } = await writeDeferredVersionFile({
            versionFolder,
            deferredVersion: {
                strategies: {
                    'pkg-2': 'minor',
                },
                changelog: 'changelog-2',
            },
        })

        jest.spyOn(mockGit, 'gitUpstreamBranch').mockResolvedValue('some-upstream')
        jest.spyOn(mockGit, 'gitDiffTree').mockResolvedValue([versionFilePath1].join('\n'))

        const { deferredVersionFiles, intentionalStrategies } = await getManualVersionStrategies({
            context,
            config: await getMonoweaveConfig(),
        })

        expect(deferredVersionFiles).toHaveLength(1) // 2 minus 1 consumed
        expect(deferredVersionFiles).toContain(versionFilePath2)
        expect(intentionalStrategies.has('pkg-1')).toBe(false)
        expect(intentionalStrategies.get('pkg-2')!.type).toBe('minor')
        expect(intentionalStrategies.get('pkg-2')!.changelog).toEqual(
            expect.stringContaining('changelog-2'),
        )
    })

    it('throws an error if an unknown workspace is referenced in a version file', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
            'pkg-2': {},
        })

        const versionFolder = npath.fromPortablePath(
            ppath.resolve(context.project.cwd, '.monoweave'),
        )

        await writeDeferredVersionFile({
            versionFolder,
            deferredVersion: {
                strategies: {
                    unknown: 'minor',
                },
                changelog: 'changelog-1',
            },
        })

        await expect(
            getManualVersionStrategies({
                context,
                config: await getMonoweaveConfig(),
            }),
        ).rejects.toThrow(/unknown workspace/)
    })

    it('throws an error if a private workspace is referenced in a version file', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': { private: true },
        })

        const versionFolder = npath.fromPortablePath(
            ppath.resolve(context.project.cwd, '.monoweave'),
        )

        await writeDeferredVersionFile({
            versionFolder,
            deferredVersion: {
                strategies: {
                    'pkg-1': 'minor',
                },
                changelog: 'changelog-1',
            },
        })

        await expect(
            getManualVersionStrategies({
                context,
                config: await getMonoweaveConfig(),
            }),
        ).rejects.toThrow(/is private/)
    })

    it('throws an error if an invalid version strategy is specified in a version file', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
            'pkg-2': {},
        })

        const versionFolder = npath.fromPortablePath(
            ppath.resolve(context.project.cwd, '.monoweave'),
        )

        await writeDeferredVersionFile({
            versionFolder,
            deferredVersion: {
                strategies: {
                    // @ts-expect-error testing error case
                    'pkg-1': 'ERROR',
                },
                changelog: 'changelog-1',
            },
        })

        await expect(
            getManualVersionStrategies({
                context,
                config: await getMonoweaveConfig(),
            }),
        ).rejects.toThrow(/Invalid version file/)
    })
})
