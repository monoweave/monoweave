import { getDependents } from '@monoweave/dependencies'
import type { MonoweaveConfiguration, PackageStrategyMap, YarnContext } from '@monoweave/types'

const getImplicitVersionStrategies = async ({
    config,
    context,
    intentionalStrategies,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
    intentionalStrategies: PackageStrategyMap
}): Promise<PackageStrategyMap> => {
    const dependents = await getDependents(config, context, new Set(intentionalStrategies.keys()))
    const requiresUpdate = new Map()
    for (const dependent of dependents) {
        requiresUpdate.set(dependent, { type: 'patch', commits: [] })
    }

    return requiresUpdate
}

export default getImplicitVersionStrategies
