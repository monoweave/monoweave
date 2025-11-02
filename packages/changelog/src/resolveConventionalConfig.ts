import { createRequire } from 'node:module'

import type { MonoweaveConfiguration } from '@monoweave/types'
import { npath } from '@yarnpkg/fslib'
import type { Options as ConventionalCommitsWriterOptions } from 'conventional-changelog-writer'
import type {
    Commit,
    Options as ConventionalCommitsParserOptions,
} from 'conventional-commits-parser'

interface ConventionalStrategy {
    level?: number | null
}

interface ConventionalChangelogConfig {
    parserOpts: ConventionalCommitsParserOptions
    writerOpts: ConventionalCommitsWriterOptions
    recommendedBumpOpts: {
        whatBump: (commits: Commit[]) => ConventionalStrategy
    }
}

const coerceConventionalConfig = (
    config: Exclude<MonoweaveConfiguration['conventionalChangelogConfig'], false | undefined>,
): Exclude<MonoweaveConfiguration['conventionalChangelogConfig'], false | string | undefined> => {
    if (typeof config === 'string') {
        return {
            name: config,
        }
    }
    return config
}

const resolveConventionalConfig = async ({
    config,
}: {
    config: MonoweaveConfiguration
}): Promise<ConventionalChangelogConfig> => {
    const conventionalChangelogConfig = config.conventionalChangelogConfig

    if (!conventionalChangelogConfig) {
        throw new Error('No conventional changelog config provided')
    }

    const conventionalConfig = coerceConventionalConfig(conventionalChangelogConfig)

    const nCwd = npath.join(npath.fromPortablePath(config.cwd), 'package.json')
    const conventionalConfigModule = createRequire(nCwd)(conventionalConfig.name)

    return await (typeof conventionalConfigModule === 'function'
        ? conventionalConfigModule(conventionalConfig)
        : conventionalConfigModule)
}

export default resolveConventionalConfig
