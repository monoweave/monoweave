import { parseVersionFileContents } from './getManualVersionStrategies'

describe('Version File Parsing', () => {
    it('throws an error on invalid files', async () => {
        await expect(() =>
            parseVersionFileContents(
                ['"@scope/package": minor', '---', 'Changelog entry.'].join('\n'),
            ),
        ).rejects.toThrow(/Invalid version file/)
    })

    it('parses a version file', async () => {
        const contents = await parseVersionFileContents(
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
