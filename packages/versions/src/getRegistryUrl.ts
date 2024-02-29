import { resolveGroupName } from '@monoweave/io'
import { type MonoweaveConfiguration, RegistryMode, type YarnContext } from '@monoweave/types'
import { type Workspace } from '@yarnpkg/core'
import * as pluginNPM from '@yarnpkg/plugin-npm'

export const getFetchRegistryUrl = async ({
    config,
    context,
    workspace,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
    workspace: Workspace
}): Promise<string | null> => {
    const groupName = resolveGroupName({
        context,
        workspace,
        packageGroupManifestField: config.packageGroupManifestField,
    })
    if (groupName) {
        const registryMode = config.packageGroups?.[groupName]?.registryMode ?? config.registryMode
        if (registryMode === RegistryMode.Manifest) {
            return null
        }
    }

    if (!groupName && config.registryMode === RegistryMode.Manifest) {
        return null
    }

    const configRegistryUrl = config.registryUrl
    if (configRegistryUrl) {
        return pluginNPM.npmConfigUtils.normalizeRegistry(configRegistryUrl)
    }

    return await pluginNPM.npmConfigUtils.getScopeRegistry(workspace.manifest.name?.scope ?? null, {
        configuration: context.configuration,
        type: pluginNPM.npmConfigUtils.RegistryType.FETCH_REGISTRY,
    })
}
