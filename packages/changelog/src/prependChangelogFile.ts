import { promises as fs } from 'fs'
import path from 'path'

import { gitCheckout } from '@monoweave/git'
import logging from '@monoweave/logging'
import {
    type ChangesetSchema,
    type MonoweaveConfiguration,
    type YarnContext,
    isNodeError,
} from '@monoweave/types'
import { type Workspace, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

const LEGACY_MARKER = '<!-- MONODEPLOY:BELOW -->'
const MARKER = '<!-- MONOWEAVE:BELOW -->'
const TOKEN_PACKAGE_DIR = '<packageDir>'

const prependEntry = async ({
    config,
    context,
    filename,
    entry,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
    filename: string
    entry: string
}): Promise<void> => {
    let changelogContents: string[] = []
    try {
        changelogContents = (await fs.readFile(filename, { encoding: 'utf-8' })).split('\n')
    } catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT') {
            logging.info(`[Changelog] Changelog ${filename} does not exist, creating.`, {
                report: context.report,
            })
            changelogContents = ['# Changelog', '', MARKER]
        } else {
            logging.error(`[Changelog] Unable to read changelog contents at ${filename}.`, {
                report: context.report,
            })
            throw err
        }
    }

    const changelogOffset = changelogContents.findIndex((value) =>
        [MARKER, LEGACY_MARKER].includes(value.trim()),
    )
    if (changelogOffset === -1) {
        logging.error(`[Changelog] Missing changelog marker: '${MARKER}'`, {
            report: context.report,
        })
        throw new Error('Unable to prepend changelog.')
    }

    // Legacy marker cleanup
    if (changelogContents[changelogOffset].includes(LEGACY_MARKER)) {
        logging.warning(`[Changelog] Upgrading '${LEGACY_MARKER}' to '${MARKER}'`, {
            report: context.report,
        })
        changelogContents[changelogOffset] = changelogContents[changelogOffset].replace(
            LEGACY_MARKER,
            MARKER,
        )
    }

    changelogContents.splice(changelogOffset + 1, 0, `\n${entry}\n`)

    const dataToWrite = changelogContents.join('\n')

    if (config.dryRun && !config.forceWriteChangeFiles) {
        logging.debug('[Changelog] Skipping changelog update.', {
            report: context.report,
        })
    } else {
        await fs.writeFile(filename, dataToWrite, {
            encoding: 'utf-8',
        })
    }

    logging.info(`[Changelog] Updated ${filename}`, {
        report: context.report,
    })
}

const prependChangelogFile = async ({
    config,
    context,
    changeset,
    workspaces,
    forceRefreshChangelogs = false,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
    changeset: ChangesetSchema
    workspaces: Set<Workspace>
    forceRefreshChangelogs?: boolean
}): Promise<void> => {
    const { default: pLimit } = await import('p-limit')

    if (!config.changelogFilename) return

    // Make sure the changelogs are up to date with the remote
    if (!config.dryRun && forceRefreshChangelogs) {
        const changelogGlob = config.changelogFilename.replace('<packageDir>', '**')
        if (changelogGlob) {
            try {
                await gitCheckout(
                    { files: [changelogGlob] },
                    { cwd: config.cwd, context, remote: config.git.remote },
                )
            } catch {
                logging.debug('Force refreshing changelogs failed. Ignoring.', {
                    report: context.report,
                })
            }
        }
    }

    if (config.changelogFilename.includes(TOKEN_PACKAGE_DIR)) {
        const prependForWorkspace = async (workspace: Workspace): Promise<void> => {
            const filename = npath.fromPortablePath(
                config.changelogFilename!.replace(
                    TOKEN_PACKAGE_DIR,
                    npath.fromPortablePath(workspace.cwd),
                ),
            )
            const packageName = structUtils.stringifyIdent(workspace.manifest.name!)
            const entry = changeset[packageName]?.changelog
            if (entry) await prependEntry({ config, context, filename, entry })
        }

        const limit = pLimit(config.jobs || Infinity)
        await Promise.all(
            [...workspaces].map((workspace) => limit(() => prependForWorkspace(workspace))),
        )

        return
    }

    const filename = path.resolve(config.cwd, config.changelogFilename)

    const entry = Object.entries(changeset)
        .sort(([pkgNameA], [pkgNameB]) => pkgNameA.localeCompare(pkgNameB))
        .map(([, changesetValue]) => changesetValue.changelog)
        .filter((value) => value)
        .join('\n')
        .trim()

    if (entry) await prependEntry({ config, context, filename, entry })
}

export default prependChangelogFile
