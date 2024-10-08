import { afterEach, beforeEach, describe, expect, it, jest as jestImport } from '@jest/globals'
import { exec } from '@monoweave/io'
import { cleanUp, initGitRepository, setupMonorepo } from '@monoweave/test-utils'
import { type YarnContext } from '@monoweave/types'

import { gitLastTaggedCommit, gitPushTags, gitTag } from '.'

// @ts-expect-error https://github.com/swc-project/plugins/issues/310
// eslint-disable-next-line @typescript-eslint/consistent-type-imports, import-x/newline-after-import
;(jest as typeof import('@jest/globals').jest).mock('@monoweave/logging')

const setupRepo = async () => {
    const context: YarnContext = await setupMonorepo({
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
    await initGitRepository(context.project.cwd)
    return context
}

describe('@monoweave/git (mocked invariants)', () => {
    let context: YarnContext

    beforeEach(async () => {
        context = await setupRepo()
    })

    afterEach(async () => {
        jestImport.clearAllMocks()
        await cleanUp([context.project.cwd])
    })

    it('gitTag creates a tag', async () => {
        const cwd = context.project.cwd
        await exec('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        const newTag = 'pkg@1.0.0'
        await gitTag(newTag, { cwd, context })
        const tagList = (
            await exec('git tag -l', {
                cwd,
            })
        ).stdout

        expect(tagList.trim().split('\n')).toEqual([newTag])
    })

    it('gitLastTaggedCommit gets last tagged commit', async () => {
        const cwd = context.project.cwd
        await exec('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        const tag = 'pkg@1.0.0'
        await gitTag(tag, { cwd, context })
        const lastTaggedSha = await gitLastTaggedCommit({ cwd, context })
        const actualSha = (
            await exec(`git log ${tag} -1 --pretty=%H`, {
                cwd,
            })
        ).stdout

        expect(lastTaggedSha.sha).toEqual(actualSha.trim())
    })

    it('gitPushTags pushes to remote', async () => {
        const cwd = context.project.cwd
        const upstreamContext = await setupRepo()

        await exec(`git remote add local ${upstreamContext.project.cwd}`, { cwd })
        await exec('git commit -m "test: base" --allow-empty', {
            cwd,
        })

        await gitTag('pkg@1.0.0', { cwd, context })
        await gitPushTags({ cwd, remote: 'local', context })

        const lastTaggedSha = await gitLastTaggedCommit({ cwd, context })

        const remoteTags = (
            await exec('git ls-remote --tags local', {
                cwd,
            })
        ).stdout
        await cleanUp([upstreamContext.project.cwd])

        expect(remoteTags).toEqual(expect.stringContaining(lastTaggedSha.sha.trim()))
    })
})
