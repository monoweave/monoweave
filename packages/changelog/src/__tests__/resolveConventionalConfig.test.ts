import path from 'path'

import type { MonoweaveConfiguration } from '@monoweave/types'
import { describe, expect, it } from 'vitest'

import { resolveConventionalConfig } from '../index.js'

describe('resolveConventionalConfig', () => {
    it('throw when no conventional changelog config provided', async () => {
        await expect(
            resolveConventionalConfig({
                config: {} as MonoweaveConfiguration,
            }),
        ).rejects.toThrow()
    })

    it('resolves custom conventional config preset', async () => {
        const monoweaveConfig: Pick<MonoweaveConfiguration, 'cwd' | 'conventionalChangelogConfig'> =
            {
                cwd: process.cwd(),
                conventionalChangelogConfig: path.resolve(
                    path.join(__dirname, '..', '..', 'mocks', 'conventional-config-fn.mock.cts'),
                ),
            }

        const config = await resolveConventionalConfig({
            config: monoweaveConfig as MonoweaveConfiguration,
        })

        expect(config).toEqual({
            parserOpts: {
                name: expect.stringContaining('conventional-config-fn'),
            },
            recommendedBumpOpts: expect.objectContaining({
                whatBump: expect.any(Function),
            }),
        })
    })

    it('supports custom conventional config preset with additional configuration', async () => {
        const COMMENT_CHAR = '#'
        const monoweaveConfig: Pick<MonoweaveConfiguration, 'cwd' | 'conventionalChangelogConfig'> =
            {
                cwd: process.cwd(),
                conventionalChangelogConfig: {
                    name: path.resolve(
                        path.join(
                            __dirname,
                            '..',
                            '..',
                            'mocks',
                            'conventional-config-fn.mock.cts',
                        ),
                    ),
                    commentChar: COMMENT_CHAR,
                },
            }

        const config = await resolveConventionalConfig({
            config: monoweaveConfig as MonoweaveConfiguration,
        })

        expect(config).toMatchObject({
            parserOpts: {
                commentChar: COMMENT_CHAR,
            },
        })
    })
})
