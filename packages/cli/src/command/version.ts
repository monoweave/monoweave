import fs from 'fs'
import path from 'path'

import { confirm, editor, select } from '@inquirer/prompts'
import { ErrorsReported } from '@monoweave/logging'
import { getPackageCandidatesForManualRelease } from '@monoweave/node'
import { type DeferredVersionRecord, type PackageStrategyType } from '@monoweave/types'
import { hashUtils } from '@yarnpkg/core'

import { BaseCommand } from './base'

// TODO: needs test coverage
export class MonoweaveVersionCommand extends BaseCommand {
    static paths = [['version']]

    async execute(): Promise<number | void> {
        try {
            const { config } = await this.parseConfiguration()

            if (config.conventionalChangelogConfig !== false) {
                this.context.stderr.write(
                    'The version command is only available when conventional changelogs are explicitly disabled.',
                )
                return 1
            }

            const { remainingPackages, suggestedPackages, versionFolder } =
                await getPackageCandidatesForManualRelease(config)

            if (!remainingPackages.size && !suggestedPackages.size) {
                this.context.stdout.write('No packages detected.')
                return 1
            }

            const promptPackage = async (
                pkgName: string,
                currentVersion: string | undefined,
            ): Promise<PackageStrategyType | null> => {
                const answer = await select({
                    message: `${pkgName} (current: ${currentVersion ?? 'unknown'})`,
                    choices: [
                        {
                            name: 'Skip',
                            value: 'skip',
                        },
                        {
                            name: 'Patch',
                            value: 'patch',
                        },
                        {
                            name: 'Minor',
                            value: 'minor',
                        },
                        {
                            name: 'Major',
                            value: 'major',
                        },
                    ],
                })

                return answer === 'skip' ? null : (answer as PackageStrategyType)
            }

            const deferredVersion: DeferredVersionRecord = { changelog: '', strategies: {} }

            if (suggestedPackages.size) {
                this.context.stdout.write(
                    `${suggestedPackages.size} package${suggestedPackages.size === 1 ? '' : 's'} modified. Select the version strategies to apply:\n`,
                )

                for (const [pkgName, { currentVersion }] of suggestedPackages.entries()) {
                    const strategy = await promptPackage(pkgName, currentVersion)
                    if (strategy) {
                        deferredVersion.strategies[pkgName] = strategy
                    }
                }
            }

            if (
                remainingPackages.size &&
                (await confirm({
                    message: `There ${remainingPackages.size === 1 ? 'is' : 'are'} ${remainingPackages.size} unmodified package${remainingPackages.size === 1 ? '' : 's'}. Would you like to review ${remainingPackages.size === 1 ? 'it' : 'them'}?\n`,
                    default: false,
                }))
            ) {
                for (const [pkgName, { currentVersion }] of remainingPackages.entries()) {
                    const strategy = await promptPackage(pkgName, currentVersion)
                    if (strategy) {
                        deferredVersion.strategies[pkgName] = strategy
                    }
                }
            }

            if (!Object.keys(deferredVersion.strategies).length) {
                this.context.stdout.write('No packages selected for release.\n')
                return 0
            }

            deferredVersion.changelog = (
                await editor({
                    message: 'Please write a changelog entry.',
                })
            ).trim()

            const versionFile = path.resolve(
                versionFolder,
                `${hashUtils.makeHash(Math.random().toString()).slice(0, 8)}.md`,
            )
            const versionFileContents = [
                '---',
                ...Object.entries(deferredVersion.strategies)
                    .sort(([pkgNameA], [pkgNameB]) => pkgNameA.localeCompare(pkgNameB))
                    .map(([pkgName, strategy]) => `"${pkgName}": ${strategy}`),
                '---',
                deferredVersion.changelog || '',
            ].join('\n')

            await fs.promises.mkdir(path.dirname(versionFile), { recursive: true })
            await fs.promises.writeFile(versionFile, versionFileContents, { encoding: 'utf-8' })

            this.context.stdout.write(
                `A version file has been written to: ${path.relative(process.cwd(), versionFile)}. You can modify the version file before committing it.\n`,
            )

            return 0
        } catch (err) {
            if (err instanceof ErrorsReported) {
                // We've already reported the error, return.
                return 1
            }

            this.context.stderr.write(`${err}\n`)
            if (process.env.DEBUG === 'monoweave') {
                if (err instanceof Error) {
                    this.context.stderr.write(`${err.stack}\n`)
                }
            }
            return 1
        }
    }
}
