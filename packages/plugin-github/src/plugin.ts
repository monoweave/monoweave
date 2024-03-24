import { parseRepositoryProperty } from '@monoweave/git'
import logging from '@monoweave/logging'
import {
    type ChangesetRecord,
    type ChangesetSchema,
    type MonoweaveConfiguration,
    type YarnContext,
} from '@monoweave/types'
import { MessageName, structUtils } from '@yarnpkg/core'

import { request } from './request'

export const PluginName = 'GitHub Plugin'

export interface PluginOptions {
    /**
     * Whether to create GitHub releases for version updates with no
     * changes.
     *
     * @default {false}
     */
    includeImplicitUpdates?: boolean | undefined
}

export const createPluginInternals =
    (options: PluginOptions) =>
    async (
        context: YarnContext,
        config: MonoweaveConfiguration,
        changeset: ChangesetSchema,
    ): Promise<void> => {
        const { Octokit } = await import('@octokit/core')
        const { throttling } = await import('@octokit/plugin-throttling')

        // Try GH_TOKEN first for backwards compatibility with older versions of Monoweave
        const personalAccessToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
        if (!personalAccessToken) {
            context.report.reportWarning(
                MessageName.UNNAMED,
                'Missing GitHub Personal Access Token. Unable to create GitHub release(s).',
            )
        }

        const ThrottledOctokit = Octokit.plugin(throttling)
        const octokit = personalAccessToken
            ? new ThrottledOctokit({
                  auth: personalAccessToken,
                  throttle: {
                      onRateLimit: () => true,
                      onSecondaryRateLimit: () => false,
                  },
              })
            : null

        const changesByTag = new Map<string, (ChangesetRecord & { name: string })[]>()
        for (const [pkgName, changeData] of Object.entries(changeset)) {
            const tag = changeData.tag
            if (!tag) {
                throw new Error(`Missing package git tag for ${pkgName}`)
            }

            let changelog = changeData.changelog
            if (options.includeImplicitUpdates) {
                changelog = 'Implicit version bump due to dependency updates.'
            }

            if (!changelog) {
                logging.info(
                    `[${PluginName}] Skipping release for ${changeData.tag} as there's no changelog.`,
                    {
                        report: context.report,
                    },
                )
                continue
            }

            const changes = changesByTag.get(tag) ?? []
            changes.push({ ...changeData, name: pkgName, changelog })
            changesByTag.set(tag, changes)
        }

        const sortedEntries = Array.from(changesByTag.entries()).sort(
            ([tagA, changesA], [tagB, changesB]) => {
                // sort by number of changes in descending order, then by name, reversed so the release with
                // largest number of changes appears first in GitHub.

                if (changesA.length === changesB.length) {
                    return tagB.localeCompare(tagA)
                }
                return changesB.length - changesA.length
            },
        )
        for (const [tag, changes] of sortedEntries) {
            logging.info(`[${PluginName}] Creating release for ${tag}`, {
                report: context.report,
            })

            if (!changes.length) continue

            const pkgName = changes[0].name
            const workspace = context.project.getWorkspaceByIdent(structUtils.parseIdent(pkgName))

            const { owner, repository: repo } = await parseRepositoryProperty(workspace, {
                fallbackToTopLevel: true,
            })

            if (!owner || !repo) {
                context.report.reportError(
                    MessageName.UNNAMED,
                    `Cannot determine GitHub owner or repository for '${pkgName}'`,
                )
                continue
            }

            const combinedChangelog = changes
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((change) => change.changelog)
                .join('\n')

            if (octokit && !config.dryRun) {
                await request(octokit, 'POST /repos/{owner}/{repo}/releases', {
                    owner,
                    repo,
                    tag_name: tag,
                    name: tag,
                    body: combinedChangelog,
                    draft: false,
                    prerelease: config.prerelease,
                })
            }
        }
    }
