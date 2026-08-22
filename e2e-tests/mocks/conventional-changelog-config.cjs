const STRATEGY = {
  MAJOR: 0,
  MINOR: 1,
  PATCH: 2,
  NONE: null,
}

const parserOpts = {
  headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
  headerCorrespondence: ['type', 'scope', 'subject'],
  noteKeywords: ['BREAKING CHANGE'],
  revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w*)\./i,
  revertCorrespondence: ['header', 'hash'],
}

const writerOpts = {
  transform(commit) {
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

const whatBump = (commits) => {
  let level = STRATEGY.NONE

  for (const commit of commits) {
    if (commit.notes?.some((note) => /breaking change/i.test(note.title))) {
      return { level: STRATEGY.MAJOR }
    }

    if (commit.type === 'feat') {
      level = level === null ? STRATEGY.MINOR : Math.min(level, STRATEGY.MINOR)
    } else if (commit.type === 'fix' || commit.type === 'perf') {
      level = level === null ? STRATEGY.PATCH : Math.min(level, STRATEGY.PATCH)
    } else if (commit.revert) {
      level = level === null ? STRATEGY.PATCH : Math.min(level, STRATEGY.PATCH)
    }
  }

  return { level }
}

module.exports = () => ({
  parserOpts,
  writerOpts,
  recommendedBumpOpts: { whatBump },
})
