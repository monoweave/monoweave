import { generateChangelogEntry } from '@monoweave/changelog'
import type {
    ChangesetSchema,
    MonoweaveConfiguration,
    PackageStrategyMap,
    PackageVersionMap,
    YarnContext,
} from '@monoweave/types'

export const generateChangeset = async ({
    config,
    context,
    previousTags,
    nextTags,
    versionStrategies,
    gitTags,
    workspaceGroups,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
    previousTags: PackageVersionMap
    nextTags: PackageVersionMap
    versionStrategies: PackageStrategyMap
    gitTags?: Map<string, string>
    workspaceGroups: Map<string, Set<string>>
}): Promise<ChangesetSchema> => {
    const changesetData: ChangesetSchema = {}

    for (const [packageName, newVersion] of nextTags.entries()) {
        const previousVersion = previousTags.get(packageName) ?? null
        const versionStrategy = versionStrategies.get(packageName)

        let changelog: string | null = ''
        if (config.conventionalChangelogConfig === false && versionStrategy?.changelog) {
            changelog = `## ${packageName} (v${newVersion}) <a name="${newVersion}"></a>\n\n${versionStrategy.changelog}\n`
        } else {
            changelog = await generateChangelogEntry({
                config,
                context,
                packageName,
                previousVersion,
                newVersion,
                commits: versionStrategy?.commits ?? [],
            })
        }

        changesetData[packageName] = {
            version: newVersion,
            previousVersion: previousVersion,
            changelog,
            tag: gitTags?.get(packageName) ?? null,
            strategy: versionStrategy?.type ?? null,
            group: packageName, // overwritten below
        }
    }

    for (const [groupKey, group] of workspaceGroups.entries()) {
        for (const packageName of group) {
            if (!changesetData[packageName]) continue
            changesetData[packageName].group = groupKey ?? packageName
        }
    }

    return changesetData
}
