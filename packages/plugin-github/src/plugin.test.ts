import { afterEach, describe, expect, it, jest as jestImport } from '@jest/globals'
import { createMonorepoContext, getMonoweaveConfig } from '@monoweave/test-utils'
import { type PluginHooks } from '@monoweave/types'
import { AsyncSeriesHook } from 'tapable'

import { createPluginInternals } from './plugin'
import * as requestModule from './request'

import GitHubPlugin, { PluginName } from '.'

// @ts-expect-error https://github.com/swc-project/plugins/issues/310
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, import-x/newline-after-import
;(jest as typeof import('@jest/globals').jest).mock('./request', () => ({
    // @ts-expect-error https://github.com/swc-project/plugins/issues/310
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    request: (jest as typeof import('@jest/globals').jest).fn(),
}))

describe('GitHub Plugin', () => {
    afterEach(() => {
        delete process.env.GITHUB_TOKEN
        delete process.env.GH_TOKEN
        jestImport.resetAllMocks()
    })

    it('registers on the onReleaseAvailable hook', async () => {
        const hooks: Pick<PluginHooks, 'onReleaseAvailable'> = {
            onReleaseAvailable: new AsyncSeriesHook(),
        }

        const info: Record<string, unknown> = await new Promise((r) => {
            hooks.onReleaseAvailable.intercept({
                register: (tapInfo) => {
                    r(tapInfo as unknown as Record<string, unknown>)
                    return tapInfo
                },
            })

            GitHubPlugin(hooks)
        })

        expect(info.type).toBe('promise')
        expect(info.name).toEqual(PluginName)
    })

    it('logs an error if missing auth token and skips release', async () => {
        await using context = await createMonorepoContext({
            'pkg-1': {},
        })

        const spyWarning = jestImport.spyOn(context.report, 'reportWarning')

        const config = {
            ...(await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        const spyRequest = jestImport.spyOn(requestModule, 'request')
        await createPluginInternals({})(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: 'a new feature',
                group: 'pkg-1',
            },
        })

        await expect(spyWarning).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringMatching(/Missing GitHub Personal Access Token/),
        )
        expect(spyRequest).not.toHaveBeenCalled()
    })

    it('throws an error if cannot determine github owner or repository', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'corrupted repository' } },
        )

        const spyError = jestImport.spyOn(context.report, 'reportError')

        const config = {
            ...(await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        process.env.GITHUB_TOKEN = 'abc'

        await createPluginInternals({})(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: 'a new feature',
                group: 'pkg-1',
            },
        })

        expect(spyError).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringMatching(/Cannot determine GitHub owner/),
        )
    })

    it('uses repository info from workspace over root if available', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {
                    raw: {
                        repository: 'https://github.com/example/repo.git',
                    },
                },
            },
            { root: { repository: 'https://github.com/other/other.git' } },
        )

        const spyError = jestImport.spyOn(context.report, 'reportError')

        const config = {
            ...(await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        process.env.GITHUB_TOKEN = 'abc'

        const spyRequest = jestImport.spyOn(requestModule, 'request')
        await createPluginInternals({})(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: 'a new feature',
                group: 'pkg-1',
            },
        })

        expect(spyError).not.toHaveBeenCalled()
        expect(spyRequest).toHaveBeenCalledWith(
            expect.anything(),
            expect.any(String),
            expect.objectContaining({
                owner: 'example',
                repo: 'repo',
            }),
        )
    })

    it('skips releases if no changelog available and includeImplicitUpdates is disabled', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'https://github.com/example/repo.git' } },
        )
        const config = {
            ...(await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        process.env.GITHUB_TOKEN = 'abc'

        const spyRequest = jestImport.spyOn(requestModule, 'request')
        await createPluginInternals({ includeImplicitUpdates: false })(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: null,
                group: 'pkg-1',
            },
        })
        expect(spyRequest).not.toHaveBeenCalled()
    })

    it('includes releases if no changelog available and includeImplicitUpdates is enabled', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'https://github.com/example/repo.git' } },
        )
        const config = {
            ...(await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        process.env.GITHUB_TOKEN = 'abc'

        const spyRequest = jestImport.spyOn(requestModule, 'request')
        await createPluginInternals({ includeImplicitUpdates: true })(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: null,
                group: 'pkg-1',
            },
        })
        expect(spyRequest).toHaveBeenCalledWith(
            expect.anything(),
            expect.any(String),
            expect.objectContaining({
                owner: 'example',
                repo: 'repo',
                tag_name: 'pkg-1@1.0.0',
                prerelease: false,
                body: 'Implicit version bump due to dependency updates.',
            }),
        )
    })

    it('do not create a github release in dry run mode', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'https://github.com/example/repo.git' } },
        )
        const config = {
            ...(await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
                dryRun: true,
            })),
        }
        process.env.GITHUB_TOKEN = 'abc'

        const spyRequest = jestImport.spyOn(requestModule, 'request')
        await createPluginInternals({})(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: 'a new feature',
                group: 'pkg-1',
            },
        })
        expect(spyRequest).not.toHaveBeenCalled()
    })

    it('creates a github release outside of dry run mode', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'https://github.com/example/repo.git' } },
        )
        const config = {
            ...(await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        // standard recommended env var
        process.env.GITHUB_TOKEN = 'abc'

        const spyRequest = jestImport.spyOn(requestModule, 'request')
        const spyWarning = jestImport.spyOn(context.report, 'reportWarning')
        const spyError = jestImport.spyOn(context.report, 'reportError')
        await createPluginInternals({})(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: 'a new feature',
                group: 'pkg-1',
            },
        })
        expect(spyRequest).toHaveBeenCalledWith(
            expect.anything(),
            expect.any(String),
            expect.objectContaining({
                owner: 'example',
                repo: 'repo',
                tag_name: 'pkg-1@1.0.0',
                prerelease: false,
                body: 'a new feature',
            }),
        )

        // No warnings or errors
        expect(spyWarning).not.toHaveBeenCalled()
        expect(spyError).not.toHaveBeenCalled()
    })

    it('defaults to GH_TOKEN if GITHUB_TOKEN not specified', async () => {
        await using context = await createMonorepoContext(
            {
                'pkg-1': {},
            },
            { root: { repository: 'https://github.com/example/repo.git' } },
        )
        const config = {
            ...(await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
        }

        process.env.GH_TOKEN = 'abc'

        const spyRequest = jestImport.spyOn(requestModule, 'request')
        const spyWarning = jestImport.spyOn(context.report, 'reportWarning')
        const spyError = jestImport.spyOn(context.report, 'reportError')
        await createPluginInternals({})(context, config, {
            'pkg-1': {
                version: '1.0.0',
                tag: 'pkg-1@1.0.0',
                changelog: 'a new feature',
                group: 'pkg-1',
            },
        })
        expect(spyRequest).toHaveBeenCalled()

        // No warnings or errors
        expect(spyWarning).not.toHaveBeenCalled()
        expect(spyError).not.toHaveBeenCalled()
    })
})
