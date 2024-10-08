import { promises as fs } from 'fs'

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { getMonoweaveConfig, setupMonorepo } from '@monoweave/test-utils'
import { type YarnContext } from '@monoweave/types'

import { getImplicitVersionStrategies } from '.'

describe('getImplicitVersionStrategies', () => {
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
        try {
            await fs.rm(context.project.cwd, { recursive: true, force: true })
        } catch {}
    })

    it('produces implicit strategies for the dependents of intentional updates', async () => {
        const mockIntentionalUpdates = new Map()
        // Dependency: pkg-3 -> pkg-2, and pkg-6 -> pkg-3
        mockIntentionalUpdates.set('pkg-2', { type: 'major', commits: [] })
        const strategies = await getImplicitVersionStrategies({
            config: await getMonoweaveConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            }),
            context,
            intentionalStrategies: mockIntentionalUpdates,
        })

        expect(strategies).toEqual(
            new Map(
                Object.entries({
                    'pkg-3': { type: 'patch', commits: [] },
                    'pkg-6': { type: 'patch', commits: [] },
                }),
            ),
        )
    })
})
