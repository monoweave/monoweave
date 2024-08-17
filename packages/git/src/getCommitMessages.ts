import type { CommitMessage, MonoweaveConfiguration, YarnContext } from '@monoweave/types'

import { gitLastTaggedCommit, gitLog } from './gitCommands.js'

const DELIMITER = '-----------------monoweave-----------------'

export const getCommitMessages = async (
    config: MonoweaveConfiguration,
    context?: YarnContext,
): Promise<CommitMessage[]> => {
    const to = config.git.commitSha
    let from = config.git.baseBranch
    if (!from) {
        const { sha, tag } = await gitLastTaggedCommit({
            cwd: config.cwd,
            context,
            prerelease: config.prerelease,
        })
        from = sha

        if (to === from && tag !== null) {
            // the latest commit is the tagged commit, this run of monoweave should be a no-op
            return []
        }
    }

    const logOutput = await gitLog(from, to, {
        cwd: config.cwd,
        DELIMITER,
        context,
    })
    return logOutput
        .toString()
        .split(`${DELIMITER}\n`)
        .map((logEntry) => {
            const [sha, ...msg] = logEntry.split('\n')
            return { sha, body: msg.join('\n') }
        })
        .filter((msg) => msg.body)
}
