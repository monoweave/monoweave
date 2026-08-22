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
      if (!commit.type) {
        return
      }

      return {
        ...commit,
        type: commit.type,
        subject: commit.subject || commit.header,
        shortHash: typeof commit.hash === 'string' ? commit.hash.substring(0, 7) : commit.shortHash,
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
