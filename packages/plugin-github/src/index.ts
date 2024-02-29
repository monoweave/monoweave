import { type PluginHooks } from '@monoweave/types'

export const PluginName = 'GitHub Plugin'
import { type PluginOptions, createPluginInternals } from './plugin'

export default function GitHubPlugin(
    { onReleaseAvailable }: Pick<PluginHooks, 'onReleaseAvailable'>,
    options?: PluginOptions | undefined,
): void {
    onReleaseAvailable.tapPromise(PluginName, createPluginInternals(options ?? {}))
}
