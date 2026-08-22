import { pathToFileURL } from 'node:url'

import type { MonoweaveConfiguration } from '@monoweave/types'
import { npath } from '@yarnpkg/fslib'
import type { Options as ConventionalCommitsWriterOptions } from 'conventional-changelog-writer'
import type {
  Commit,
  ParserOptions as ConventionalCommitsParserOptions,
} from 'conventional-commits-parser'

interface ConventionalStrategy {
  level?: number | null
}

interface ConventionalChangelogConfig {
  parserOpts: ConventionalCommitsParserOptions
  writerOpts: ConventionalCommitsWriterOptions
  recommendedBumpOpts: {
    whatBump: (commits: Commit[]) => ConventionalStrategy | Promise<ConventionalStrategy>
  }
}

type RawConventionalPreset = {
  parserOpts?: ConventionalCommitsParserOptions
  writerOpts?: ConventionalCommitsWriterOptions
  recommendedBumpOpts?: ConventionalChangelogConfig['recommendedBumpOpts']
  parser?: ConventionalCommitsParserOptions
  writer?: ConventionalCommitsWriterOptions
  whatBump?: ConventionalChangelogConfig['recommendedBumpOpts']['whatBump']
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

const normalizeConventionalConfig = (
  config: RawConventionalPreset,
): ConventionalChangelogConfig => {
  const whatBump = config.recommendedBumpOpts?.whatBump ?? config.whatBump

  if (!whatBump) {
    throw new Error('Conventional changelog config is missing whatBump')
  }

  return {
    parserOpts: config.parserOpts ?? config.parser ?? {},
    writerOpts: config.writerOpts ?? config.writer ?? {},
    recommendedBumpOpts: { whatBump },
  }
}

const unwrapModule = (mod: unknown): unknown => {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    const exported = (mod as { default: unknown }).default
    if (typeof exported === 'function' || (exported && typeof exported === 'object')) {
      return exported
    }
  }
  return mod
}

const loadConventionalConfigModule = async (name: string, cwdPackageJson: string) => {
  const parentURL = pathToFileURL(cwdPackageJson).href
  const resolvedURL = npath.isAbsolute(name)
    ? pathToFileURL(name).href
    : import.meta.resolve(name, parentURL)

  const imported = await import(resolvedURL)
  return unwrapModule(imported)
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
  const conventionalConfigModule = await loadConventionalConfigModule(conventionalConfig.name, nCwd)

  const resolvedConfig = await (typeof conventionalConfigModule === 'function'
    ? conventionalConfigModule(conventionalConfig)
    : conventionalConfigModule)

  return normalizeConventionalConfig(resolvedConfig)
}

export default resolveConventionalConfig
