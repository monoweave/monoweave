export default async function createPreset() {
    const parserOpts = {
        headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
        headerCorrespondence: ['type', 'scope', 'subject'],
        noteKeywords: ['BREAKING CHANGE'],
        revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w*)\./i,
        revertCorrespondence: ['header', 'hash'],
    }
    const writerOpts = {
        transform(commit: any, _context: any) {
            console.error('here?')
            return {
                ...commit,
                mainTemplate: '',
                headerPartial: '',
                commitPartial: '',
                footerPartial: '',
            }
        },
        groupBy: 'type',
        commitGroupsSort: 'title',
        commitsSort: ['scope', 'subject'],
    }

    return {
        parserOpts,
        writerOpts,
        recommendedBumpOpts: { whatBump: () => null },
        conventionalChangelog: { parserOpts, writerOpts },
    }
}
