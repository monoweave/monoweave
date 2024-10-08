import { promises as fs } from 'fs'
import path from 'path'

import { afterEach, beforeEach, describe, expect, it, jest as jestImport } from '@jest/globals'
import { getMonoweaveConfig, setupMonorepo } from '@monoweave/test-utils'
import { type YarnContext } from '@monoweave/types'
import { npath, ppath } from '@yarnpkg/fslib'
import * as npm from '@yarnpkg/plugin-npm'

import { getLatestPackageTags } from '.'

// @ts-expect-error https://github.com/swc-project/plugins/issues/310
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, import-x/newline-after-import
;(jest as typeof import('@jest/globals').jest).mock('@yarnpkg/plugin-npm')

const mockNPM = npm as jestImport.Mocked<
    typeof npm & {
        _reset_: () => void
        _setTag_: (pkgName: string, tagValue: string | string[], tagKey?: string) => void
    }
>

class NetworkError extends Error {
    response?: { statusCode?: number }
    constructor(statusCode: number) {
        super(`Error: ${statusCode}`)
        this.response = { statusCode }
    }
}

describe('getLatestPackageTags', () => {
    let context: YarnContext

    beforeEach(async () => {
        context = await setupMonorepo({
            'pkg-1': {},
            'pkg-2': {},
            'pkg-3': { dependencies: ['pkg-2'] },
            'pkg-4': {},
            'pkg-5': { private: true, dependencies: ['pkg-4'] },
            'pkg-6': {
                dependencies: ['pkg-3', 'pkg-7'],
            },
            'pkg-7': {},
        })
    })

    afterEach(async () => {
        jestImport.restoreAllMocks()
        mockNPM._reset_()
        try {
            await fs.rm(context.project.cwd, { recursive: true, force: true })
        } catch {}
    })

    it('returns default tag 0.0.0 if no tags found', async () => {
        // Since we haven't set up any tags for any package, everything is 0.0.0
        const config = await getMonoweaveConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })
        const tags = await getLatestPackageTags({
            config,
            context,
        })
        for (const tagPair of tags) {
            const tag = tagPair[1]
            expect(tag.latest).toBe('0.0.0')
        }
    })

    it('returns tags from the registry if they exist', async () => {
        const registryTags = new Map(
            Object.entries({
                'pkg-1': { latest: '0.0.1' },
                'pkg-2': { latest: '0.1.0' },
                'pkg-3': { latest: '1.0.0' },
            }),
        )

        for (const [pkgName, map] of registryTags) {
            mockNPM._setTag_(pkgName, map.latest)
        }

        const config = await getMonoweaveConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })
        const tags = await getLatestPackageTags({
            config,
            context,
        })

        const expectedTags = new Map([
            ...registryTags.entries(),
            ['pkg-4', { latest: '0.0.0' }],
            ['pkg-6', { latest: '0.0.0' }],
            ['pkg-7', { latest: '0.0.0' }],
        ])

        expect(tags).toEqual(expectedTags)
    })

    it('can read tags when returned as an array', async () => {
        const registryTags = new Map(
            Object.entries({
                'pkg-1': { latest: ['0.0.1'] },
                'pkg-2': { latest: ['0.1.0'] },
                'pkg-3': { latest: ['1.0.0'] },
            }),
        )

        for (const [pkgName, map] of registryTags) {
            mockNPM._setTag_(pkgName, map.latest)
        }

        // we'll also test with a non-latest tag
        mockNPM._setTag_('pkg-2', ['4.5.0'], 'next')

        const config = await getMonoweaveConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })
        const tags = await getLatestPackageTags({
            config,
            context,
        })

        const expectedTags = new Map([
            ['pkg-1', { latest: '0.0.1' }],
            ['pkg-2', { latest: '0.1.0', next: '4.5.0' }],
            ['pkg-3', { latest: '1.0.0' }],

            ['pkg-4', { latest: '0.0.0' }],
            ['pkg-6', { latest: '0.0.0' }],
            ['pkg-7', { latest: '0.0.0' }],
        ])

        expect(tags).toEqual(expectedTags)
    })

    it('bubbles up error if not 404', async () => {
        const mockError = new NetworkError(500)
        const mockGet = mockNPM.npmHttpUtils.get

        jestImport.spyOn(mockNPM.npmHttpUtils, 'get').mockImplementation(() => {
            throw mockError
        })

        const config = await getMonoweaveConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })

        await expect(
            async () =>
                await getLatestPackageTags({
                    config,
                    context,
                }),
        ).rejects.toEqual(mockError)

        mockNPM.npmHttpUtils.get = mockGet
    })

    it('returns default tag if received a 500 and using jfrog', async () => {
        // See: https://www.jfrog.com/jira/browse/RTFACT-16518

        const mockGet = mockNPM.npmHttpUtils.get
        jestImport.spyOn(mockNPM.npmHttpUtils, 'get').mockImplementation(() => {
            throw new NetworkError(500)
        })

        // Since we haven't set up any tags for any package, everything is 0.0.0
        const config = {
            ...(await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
            registryUrl: 'https://my.jfrog.io/my/api/npm/my-npm/',
        }
        const tags = await getLatestPackageTags({
            config,
            context,
        })
        for (const tagPair of tags) {
            const tag = tagPair[1]
            expect(tag.latest).toBe('0.0.0')
        }

        mockNPM.npmHttpUtils.get = mockGet
    })

    it('returns a null pair for malformed workspaces (missing ident)', async () => {
        // Stripping pkg-2 of its ident
        context.project.workspacesByCwd.get(
            ppath.resolve(
                context.project.cwd,
                npath.toPortablePath(path.join('packages', 'pkg-2')),
            ),
        )!.manifest.name = null

        const config = await getMonoweaveConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })
        const tags = await getLatestPackageTags({
            config,
            context,
        })

        expect(tags.keys()).not.toContain('pkg-2')
    })
})
