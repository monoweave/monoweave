import { gitTag } from '@monoweave/git'
import logging from '@monoweave/logging'
import type { MonoweaveConfiguration, YarnContext } from '@monoweave/types'

async function createReleaseGitTags({
    config,
    context,
    gitTags,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
    gitTags: Map<string, string>
}): Promise<void> {
    // packages in a group share the same tag
    const tags = new Set(gitTags.values())

    for (const tag of tags) {
        try {
            if (!config.dryRun) {
                await gitTag(tag, { cwd: config.cwd, context })
            }

            logging.info(`[Tag] ${tag}`, { report: context.report })
        } catch (err) {
            logging.error(`[Tag] Failed ${tag}`, { report: context.report })
            logging.error(err, { report: context.report })
        }
    }
}

export default createReleaseGitTags
