import path from 'path'

import { ErrorsReported } from '@monoweave/logging'
import { getPackageCandidatesForManualRelease } from '@monoweave/node'
import { type DeferredVersionRecord, type PackageStrategyType } from '@monoweave/types'
import { writeDeferredVersionFile } from '@monoweave/versions'
import { Option } from 'clipanion'
import * as t from 'typanion'

import { BaseCommand } from './base'
import { detectIsInCI } from './config/utils'

const promptPackage = async ({
    pkgName,
    currentVersion,
    defaultValue,
}: {
    pkgName: string
    currentVersion: string | undefined
    defaultValue?: string | undefined
}): Promise<PackageStrategyType | null> => {
    const { select } = await import('@inquirer/prompts')

    const answer = await select({
        message: `${pkgName} (current: ${currentVersion ?? 'unknown'})`,
        default: defaultValue,
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

export class MonoweaveVersionCommand extends BaseCommand {
    static paths = [['version']]

    message = Option.String('--message', {
        validator: t.isString(),
        description: 'Changelog message',
    })

    interactive = Option.Boolean(
        '--interactive',
        Boolean(!detectIsInCI() && process.stdout.isTTY),
        {
            description:
                'Whether to run in interactive mode (defaults to true outside of CI, when a TTY is detected).',
        },
    )

    strategy = Option.String<PackageStrategyType>('--strategy', {
        description: 'Default strategy to apply (defaults to patch in non-interactive mode).',
        validator: t.isEnum(['patch', 'minor', 'major']),
    })

    includePatterns = Option.Rest()

    async execute(): Promise<number | void> {
        if (this.interactive) {
            this.context.stdout.write('Checking for local package modifications...\n')
        }

        // inquirer has a transitive dependency on tmp which adds an event listener to process EXIT.
        // This causes the max event listeners to exceed the limit in test runs.
        const { confirm, editor } = await import('@inquirer/prompts')

        let defaultStrategy: PackageStrategyType | undefined =
            this.strategy ?? (this.interactive ? undefined : 'patch')

        try {
            const { config } = await this.parseConfiguration()
            const deferredVersion: DeferredVersionRecord = { changelog: '', strategies: {} }

            const { packages, versionFolder } = await getPackageCandidatesForManualRelease(config, {
                includePatterns: this.includePatterns,
            })

            if (!packages.size) {
                this.context.stdout.write('No packages detected.\n')
                return 1
            }

            // The idea is that if a pattern was specified, it means the user intends to update all matched
            // packages, even if we don't detect modification.
            const suggestedPackages = new Map(
                Array.from(packages.entries()).filter(
                    ([, metadata]) => metadata.modified || Boolean(this.includePatterns.length),
                ),
            )

            if (suggestedPackages.size) {
                this.context.stdout.write(
                    `${suggestedPackages.size} package${suggestedPackages.size === 1 ? '' : 's'} ${this.includePatterns.length ? 'selected' : 'modified'}. ${
                        this.interactive ? 'Select the version strategies to apply:' : ''
                    }\n`,
                )

                for (const [pkgName, { currentVersion }] of suggestedPackages.entries()) {
                    const strategy = this.interactive
                        ? await promptPackage({
                              pkgName,
                              currentVersion,
                              defaultValue: defaultStrategy,
                          })
                        : defaultStrategy
                    if (strategy) {
                        deferredVersion.strategies[pkgName] = strategy
                    }
                    defaultStrategy = strategy ?? undefined
                }
            }

            const remainingPackages = new Map(
                Array.from(packages.entries()).filter(([name]) => !suggestedPackages.has(name)),
            )

            if (
                this.interactive &&
                remainingPackages.size &&
                (await confirm({
                    message:
                        `There ${remainingPackages.size === 1 ? 'is' : 'are'} ${remainingPackages.size} unmodified package${remainingPackages.size === 1 ? '' : 's'}. ` +
                        `Would you like to review ${remainingPackages.size === 1 ? 'it' : 'them'}?\n`,
                    default: false,
                }))
            ) {
                for (const [pkgName, { currentVersion }] of remainingPackages.entries()) {
                    const strategy = await promptPackage({
                        pkgName,
                        currentVersion,
                        defaultValue: defaultStrategy,
                    })
                    if (strategy) {
                        deferredVersion.strategies[pkgName] = strategy
                    }
                    defaultStrategy = strategy ?? undefined
                }
            }

            if (!Object.keys(deferredVersion.strategies).length) {
                this.context.stdout.write('No packages targeted for release.\n')
                return 0
            }

            const defaultMessage = this.message?.trim()
            if (this.interactive) {
                deferredVersion.changelog =
                    defaultMessage ||
                    (
                        await editor({
                            message: 'Please write a changelog entry.',
                            default: defaultMessage ?? '',
                        })
                    ).trim()
            } else {
                deferredVersion.changelog = defaultMessage ?? ''
            }

            const { versionFilePath } = await writeDeferredVersionFile({
                deferredVersion,
                versionFolder,
            })

            if (this.interactive) {
                this.context.stdout.write(
                    `A version file has been written to: ${path.relative(process.cwd(), versionFilePath)}. ` +
                        'You can modify the version file before committing it.\n',
                )
            } else {
                this.context.stdout.write(
                    `A version file has been written to: ${path.relative(process.cwd(), versionFilePath)}.\n`,
                )
            }

            return 0
        } catch (err) {
            if (err instanceof ErrorsReported) {
                // We've already reported the error, return.
                return 1
            }

            this.context.stderr.write(`${err}\n`)
            if (process.env.DEBUG?.match(/monoweave|(^\*$)/)) {
                if (err instanceof Error) {
                    this.context.stderr.write(`${err.stack}\n`)
                }
            }
            return 1
        }
    }
}
