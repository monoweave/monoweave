import path from 'path'

import { createMonorepoContext, getMonoweaveConfig } from '@monoweave/test-utils'

import { generateChangelogEntry } from './changelog'

function filterOutDate(text: string): string {
    return text.replaceAll(/\(\d{4}-\d{2}-\d{2}\)/g, '<DATE>')
}

describe('Generate Changelog Entry', () => {
    describe('Default - No Conventional Changelog', () => {
        it.each([
            { commits: [] },
            {
                commits: [
                    {
                        sha: '100',
                        body: 'bad commit ignore this',
                    },

                    {
                        sha: '100',
                        body: 'wip: ignore me',
                    },

                    {
                        sha: '101',
                        body: 'feat: this is a feature',
                    },
                ],
            },
            {
                commits: [
                    {
                        sha: '100',
                        body: 'fix: this is a patch',
                    },

                    {
                        sha: '101',
                        body: 'feat: this is a feature',
                    },
                ],
            },
            {
                commits: [
                    {
                        sha: '100',
                        body: 'fix: this is a patch\nfeat: this is a feature',
                    },
                ],
            },
            {
                commits: [
                    {
                        sha: '100',
                        body: 'fix: this is a patch',
                    },

                    {
                        sha: '101',
                        body: 'feat: this is a feature',
                    },

                    {
                        sha: '300',
                        body: 'BREAKING CHANGE: This is breaking!',
                    },
                ],
            },
            {
                commits: [
                    { sha: '100', body: 'BREAKING CHANGE: This is breaking' },
                    { sha: '100', body: 'NOTE: This is a note!' },
                    { sha: '100', body: 'Revert: This is a revert!' },
                ],
            },
        ])('generates a simple changelog entry', async ({ commits }) => {
            await using context = await createMonorepoContext(
                {
                    'pkg-1': {},
                },
                {
                    root: {
                        repository: 'git@github.com:some-owner/some-repo.git',
                    },
                },
            )

            const config = await getMonoweaveConfig({
                cwd: context.project.cwd,
                conventionalChangelogConfig: undefined, // force default
            })

            const entry = await generateChangelogEntry({
                config,
                context,
                commits,
                packageName: 'pkg-1',
                newVersion: '1.2.3',
                previousVersion: '1.2.2',
            })

            expect(filterOutDate(entry || '')).toMatchSnapshot()
        })

        it('generates a changelog correctly when no repository url defined', async () => {
            await using context = await createMonorepoContext(
                {
                    'pkg-1': {},
                },
                {
                    root: {
                        repository: undefined,
                    },
                },
            )

            const config = await getMonoweaveConfig({
                cwd: context.project.cwd,
                conventionalChangelogConfig: undefined, // force default
            })

            const entry = await generateChangelogEntry({
                config,
                context,
                commits: [{ sha: '123', body: 'fix: some fix' }],
                packageName: 'pkg-1',
                newVersion: '1.2.3',
                previousVersion: '1.2.2',
            })

            expect(filterOutDate(entry || '')).toMatchSnapshot()
        })
    })

    describe('Conventional Changelog', () => {
        it('generates a changelog entry using the provided conventional changelog', async () => {
            await using context = await createMonorepoContext({
                'pkg-1': {},
            })

            const config = await getMonoweaveConfig({
                cwd: context.project.cwd,
                conventionalChangelogConfig: path.resolve(
                    path.join(__dirname, '..', 'mocks', 'conventional-config-writer.mock.ts'),
                ),
            })

            const entry = await generateChangelogEntry({
                config,
                context,
                commits: [
                    {
                        sha: '123',
                        body: 'fix: this is a patch',
                    },
                ],
                packageName: 'pkg-1',
                newVersion: '1.2.3',
                previousVersion: '1.2.2',
            })

            expect(entry).toEqual(expect.stringContaining('this is a patch'))
        })
    })
})
