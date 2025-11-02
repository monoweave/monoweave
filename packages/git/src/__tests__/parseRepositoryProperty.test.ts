import { createMonorepoContext } from '@monoweave/test-utils'
import { structUtils } from '@yarnpkg/core'
import { describe, expect, it } from 'vitest'

import { parseRepositoryProperty } from '../parseRepositoryProperty.js'

describe('parseRepositoryProperty', () => {
    it('parses github repository from manifest url as string', async () => {
        await using context = await createMonorepoContext({ 'pkg-1': {} })
        const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))

        workspace.manifest.setRawField('repository', 'git@github.com:some-owner/monoweave.git')
        expect(await parseRepositoryProperty(workspace)).toEqual(
            expect.objectContaining({
                host: 'https://github.com',
                owner: 'some-owner',
                repository: 'monoweave',
                repoUrl: 'https://github.com/some-owner/monoweave',
            }),
        )

        workspace.manifest.setRawField('repository', 'https://github.com/some-owner/monoweave.git')
        expect(await parseRepositoryProperty(workspace)).toEqual(
            expect.objectContaining({
                host: 'https://github.com',
                owner: 'some-owner',
                repository: 'monoweave',
                repoUrl: 'https://github.com/some-owner/monoweave',
            }),
        )

        workspace.manifest.setRawField(
            'repository',
            'git+https://github.com/some-owner/monoweave.git',
        )
        expect(await parseRepositoryProperty(workspace)).toEqual(
            expect.objectContaining({
                host: 'https://github.com',
                owner: 'some-owner',
                repository: 'monoweave',
                repoUrl: 'git+https://github.com/some-owner/monoweave',
            }),
        )
    })

    it('parses ssh url', async () => {
        await using context = await createMonorepoContext({ 'pkg-1': {} })
        const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))

        workspace.manifest.setRawField(
            'repository',
            'git+ssh://git@github.com/some-owner/some-repo.git',
        )
        expect(await parseRepositoryProperty(workspace)).toEqual(
            expect.objectContaining({
                host: 'https://github.com',
                owner: 'some-owner',
                repository: 'some-repo',
                repoUrl: 'https://github.com/some-owner/some-repo',
            }),
        )
    })

    it('parses arbitrary repository from manifest url as string', async () => {
        await using context = await createMonorepoContext({ 'pkg-1': {} })
        const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))

        workspace.manifest.setRawField(
            'repository',
            'git@anyhost.net:group/subgroup/sub-subgroup/package-name.git',
        )
        expect(await parseRepositoryProperty(workspace)).toEqual(
            expect.objectContaining({
                host: 'https://anyhost.net',
                owner: 'group/subgroup/sub-subgroup',
                repository: 'package-name',
                repoUrl: 'https://anyhost.net/group/subgroup/sub-subgroup/package-name',
            }),
        )

        workspace.manifest.setRawField(
            'repository',
            'https://anyhost.net/group/subgroup/sub-subgroup/package-name.git',
        )
        expect(await parseRepositoryProperty(workspace)).toEqual(
            expect.objectContaining({
                host: 'https://anyhost.net',
                owner: 'group/subgroup/sub-subgroup',
                repository: 'package-name',
                repoUrl: 'https://anyhost.net/group/subgroup/sub-subgroup/package-name',
            }),
        )

        workspace.manifest.setRawField(
            'repository',
            'git+https://anyhost.net/group/subgroup/sub-subgroup/package-name.git',
        )
        expect(await parseRepositoryProperty(workspace)).toEqual(
            expect.objectContaining({
                host: 'https://anyhost.net',
                owner: 'group/subgroup/sub-subgroup',
                repository: 'package-name',
                repoUrl: 'git+https://anyhost.net/group/subgroup/sub-subgroup/package-name',
            }),
        )
    })

    it('parses repository from manifest url as object', async () => {
        await using context = await createMonorepoContext({ 'pkg-1': {} })
        const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))

        workspace.manifest.setRawField('repository', {
            type: 'git',
            url: 'https://github.com/some-owner/monoweave.git',
            directory: 'packages/pkg-1',
        })
        expect(await parseRepositoryProperty(workspace)).toEqual(
            expect.objectContaining({
                host: 'https://github.com',
                owner: 'some-owner',
                repository: 'monoweave',
                repoUrl: 'https://github.com/some-owner/monoweave',
            }),
        )
    })

    it('falls back to project root manifest', async () => {
        await using context = await createMonorepoContext({ 'pkg-1': {} })
        const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))
        workspace.project.topLevelWorkspace.manifest.setRawField(
            'repository',
            'git@github.com:some-owner/monoweave.git',
        )
        workspace.manifest.setRawField('repository', '')
        expect(await parseRepositoryProperty(workspace)).toEqual(
            expect.objectContaining({
                host: 'https://github.com',
                owner: 'some-owner',
                repository: 'monoweave',
                repoUrl: 'https://github.com/some-owner/monoweave',
            }),
        )
    })

    it('does not fallback to project root manifest if fallback option disabled', async () => {
        await using context = await createMonorepoContext({ 'pkg-1': {} })
        const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))
        workspace.project.topLevelWorkspace.manifest.setRawField(
            'repository',
            'git@github.com:some-owner/monoweave.git',
        )
        workspace.manifest.setRawField('repository', '')
        expect(
            await parseRepositoryProperty(workspace, {
                fallbackToTopLevel: false,
            }),
        ).toEqual(
            expect.objectContaining({
                host: null,
                owner: null,
                repository: null,
                repoUrl: null,
            }),
        )
    })

    it('fails gracefully if falling back and root does not have repository', async () => {
        await using context = await createMonorepoContext({ 'pkg-1': {} })
        const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent('pkg-1'))
        workspace.project.topLevelWorkspace.manifest.setRawField('repository', '')
        workspace.manifest.setRawField('repository', '')
        expect(
            await parseRepositoryProperty(workspace, {
                fallbackToTopLevel: true,
            }),
        ).toEqual(
            expect.objectContaining({
                host: null,
                owner: null,
                repository: null,
                repoUrl: null,
            }),
        )
    })
})
