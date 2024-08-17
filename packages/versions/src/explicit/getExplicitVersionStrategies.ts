import { getCommitMessages } from '@monoweave/git'
import logging from '@monoweave/logging'
import type {
    MonoweaveConfiguration,
    PackageStrategyMap,
    PackageStrategyType,
    YarnContext,
} from '@monoweave/types'

import {
    STRATEGY,
    createGetConventionalRecommendedStrategy,
    getDefaultRecommendedStrategy,
    maxStrategy,
} from '../versionStrategy.js'

import { getManualVersionStrategies } from './getManualVersionStrategies.js'
import { getModifiedPackages } from './getModifiedPackages.js'

const strategyLevelToType = (level: number): PackageStrategyType | null => {
    const name = Object.entries(STRATEGY)
        .find((key, value) => level === value)?.[0]
        ?.toLowerCase()
    if (name === 'none') return null
    return (name as PackageStrategyType | null) ?? null
}

const getExplicitVersionStrategies = async ({
    config,
    context,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
}): Promise<{ intentionalStrategies: PackageStrategyMap; deferredVersionFiles: string[] }> => {
    if (config.conventionalChangelogConfig === false) {
        // If conventional changelogs are disabled, load manual version files.
        return await getManualVersionStrategies({ config, context })
    }

    const versionStrategies: PackageStrategyMap = new Map()

    const strategyDeterminer = config.conventionalChangelogConfig
        ? createGetConventionalRecommendedStrategy(config)
        : getDefaultRecommendedStrategy

    const commitIgnorePatterns: RegExp[] = [...(config.commitIgnorePatterns ?? [])].map(
        (pattern) => (pattern instanceof RegExp ? pattern : new RegExp(pattern, 'm')),
    )

    const commits = await getCommitMessages(config, context)
    for (const commit of commits) {
        if (commitIgnorePatterns.some((pattern) => pattern.test(`${commit.sha}\n${commit.body}`))) {
            logging.debug(
                `[Explicit Version Strategies] Skipping commit ${commit.sha} for matching a commit ignore pattern.`,
                { report: context.report },
            )
            continue
        }

        const strategy =
            strategyLevelToType(await strategyDeterminer([commit.body])) ??
            config.versionStrategy?.minimumStrategy ??
            null
        const packageNames = await getModifiedPackages({
            config,
            context,
            commitSha: commit.sha,
        })

        for (const pkgName of packageNames) {
            if (!strategy) continue

            const previousVersionStrategy = versionStrategies.get(pkgName)

            versionStrategies.set(pkgName, {
                type: maxStrategy(previousVersionStrategy?.type, strategy),
                commits: [commit, ...(previousVersionStrategy?.commits ?? [])],
            })
        }

        if (strategy && !packageNames.length) {
            logging.warning(
                `[Explicit Version Strategies] The commit "${commit.sha}" indicates a version bump, however ` +
                    'no modified packages were detected. This typically implies a user error.',
                { report: context.report },
            )
        }
    }

    return { intentionalStrategies: versionStrategies, deferredVersionFiles: [] }
}

export default getExplicitVersionStrategies
