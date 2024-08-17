import { createRequire } from 'module'

import type { MonoweaveConfiguration } from '@monoweave/types'
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

    const require = createRequire(config.cwd)

    let conventionalConfigModule = await import(require.resolve(conventionalConfig.name))

    conventionalConfigModule =
        typeof conventionalConfigModule === 'object' && 'default' in conventionalConfigModule
            ? conventionalConfigModule.default
            : conventionalConfigModule

    return await (typeof conventionalConfigModule === 'function'
        ? conventionalConfigModule(conventionalConfig)
        : conventionalConfigModule)
}

export default resolveConventionalConfig
