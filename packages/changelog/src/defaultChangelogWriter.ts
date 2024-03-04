import type { CommitMessage } from '@monoweave/types'

import { type TemplateContext } from './types'

/**
 * Simple changelog entry writer if no conventional changelog config is provided.
 * It is recommended to use a conventional changelog where possible (they'll handle more edge cases).
 */
export async function defaultChangelogWriter({
    commits,
    templateContext: { currentTag, host, owner, previousTag, repoUrl, repository, title, version },
}: {
    commits: CommitMessage[]
    templateContext: TemplateContext
}): Promise<string | null> {
    const headerPattern = /^(\w*)(?:\((.*)\))?: (.*)$/
    const notePattern = /^(revert|note|breaking change):\s/i

    const dateString = new Date().toLocaleDateString()
    const url = repoUrl || `${repository || `${host}/${owner}`}`

    const lines: string[] = []

    const commitMessages: string[] = []
    const notes: string[] = []

    const commitsByLine = commits
        .map(({ sha, body }) => body.split('\n').map((b) => ({ sha, body: b })))
        .flat()
    for (const commit of commitsByLine) {
        const shortSha = commit.sha.substring(0, 8)
        const shaUrl = url ? `[${shortSha}](${url}/commits/${shortSha})` : `[${shortSha}]`

        const headerMatch = commit.body.match(headerPattern)
        if (headerMatch) {
            const [_, commitType] = headerMatch
            if (!commitType || commitType.toLowerCase() === 'wip') {
                continue // ignore wip commits
            }
            commitMessages.push(`* ${commit.body} (${shaUrl})`)
            continue
        }

        const noteMatch = commit.body.match(notePattern)
        if (noteMatch) {
            notes.push(`* ${commit.body} (${shaUrl})`)
        }
    }

    if (commitMessages.length) {
        lines.push('### Changes', '', ...commitMessages)
        if (notes.length) lines.push('')
    }

    if (notes.length) {
        lines.push('### Notes', '', ...notes)
    }

    if (lines.length) {
        const diffUrl =
            url && previousTag
                ? `[${version}](${url}/compare/${previousTag}...${currentTag})`
                : `[${version}]`
        return [
            `## ${diffUrl} "${title}" (${dateString}) <a name="${version}"></a>`,
            '',
            ...lines,
        ].join('\n')
    }

    return null
}
