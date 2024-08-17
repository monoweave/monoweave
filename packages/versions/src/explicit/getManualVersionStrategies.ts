import fs from 'fs'
import path from 'path'

import { gitDiffTree, gitUpstreamBranch } from '@monoweave/git'
import logging from '@monoweave/logging'
import {
    type DeferredVersionRecord,
    type MonoweaveConfiguration,
    type PackageStrategyMap,
    type PackageStrategyType,
    type YarnContext,
    isNodeError,
} from '@monoweave/types'
import { hashUtils, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import YAML from 'yaml'

import { maxStrategy } from '../versionStrategy.js'

export async function parseDeferredVersionFile(contents: string): Promise<DeferredVersionRecord> {
    const [line1, ...lines] = contents.split('\n')
    if (line1 !== '---') throw new Error('Invalid version file, expected "---".')

    let sealFrontMatter = false
    const frontMatter: string[] = []
    const changelog: string[] = []

    for (const line of lines) {
        if (sealFrontMatter) {
            changelog.push(line)
        } else if (line === '---') {
            sealFrontMatter = true
        } else {
            frontMatter.push(line)
        }
    }

    return {
        changelog: changelog.join('\n'),
        strategies: YAML.parse(frontMatter.join('\n')),
    }
}

export async function writeDeferredVersionFile({
    versionFolder,
    deferredVersion,
}: {
    versionFolder: string
    deferredVersion: DeferredVersionRecord
}): Promise<{ versionFilePath: string }> {
    const versionFilePath = path.resolve(
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

    await fs.promises.mkdir(path.dirname(versionFilePath), { recursive: true })
    await fs.promises.writeFile(versionFilePath, versionFileContents, { encoding: 'utf-8' })

    return { versionFilePath }
}

const allowedStrategies = new Set<string>(['patch', 'minor', 'major'])

function isPackageStrategyType(raw: string): raw is PackageStrategyType {
    return allowedStrategies.has(raw)
}

export async function discoverVersionFiles({
    config,
    context,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
}): Promise<string[]> {
    if (!config.versionStrategy?.versionFolder) {
        return []
    }

    const versionFolder = path.resolve(
        npath.fromPortablePath(context.project.cwd),
        config.versionStrategy.versionFolder,
    )

    // Remove any version files which have already been consumed. i.e. check if there are deletions on the remote
    // This is only necessary if running in an environment where we haven't pulled the latest changes on the main
    // publish branch, e.g. GitHub's default behaviour when you don't override actions/checkout "ref" to point to the
    // branch.
    const filesDeletedOnUpstream = await gitUpstreamBranch({
        cwd: config.cwd,
        context,
        remote: config.git.remote,
    })
        .then((upstream) =>
            gitDiffTree(upstream, {
                cwd: config.cwd,
                context,
                onlyIncludeDeletedFiles: true,
                paths: [versionFolder],
                fetch: true,
            }),
        )
        .then((files) => files.split('\n').map((file) => path.resolve(config.cwd, file)))
        .catch((err): string[] => {
            logging.warning(
                'Failed to detect deleted files on upstream. Being unable to detect deleted files ' +
                    'means there is the possibility that monoweave may process the same version file ' +
                    'twice, resulting in duplicate publishing.',
                { report: context.report },
            )
            logging.warning(err, { report: context.report })
            return []
        })

    const filesDeletedOnUpstreamSet = new Set<string>(filesDeletedOnUpstream)

    const files = await fs.promises
        .readdir(versionFolder, {
            encoding: 'utf-8',
            recursive: false,
            withFileTypes: true,
        })
        .then((files) =>
            files
                .filter((file) => file.isFile() && file.name.endsWith('.md'))
                .map((file) => path.resolve(versionFolder, file.name))
                .filter((file) => !filesDeletedOnUpstreamSet.has(file)),
        )
        .catch((err): string[] => {
            if (isNodeError(err) && err.code === 'ENOENT') {
                return []
            }
            throw err
        })

    return files
}

export async function getManualVersionStrategies({
    config,
    context,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
}): Promise<{ intentionalStrategies: PackageStrategyMap; deferredVersionFiles: string[] }> {
    const { default: pLimit } = await import('p-limit')

    const versionStrategies: PackageStrategyMap = new Map()
    const deferredVersionFiles = await discoverVersionFiles({ config, context })

    const limitRead = pLimit(5)

    const deferredVersions = await Promise.all(
        deferredVersionFiles.map((file) =>
            limitRead(async () => {
                const contents = await fs.promises.readFile(file, { encoding: 'utf-8' })
                return await parseDeferredVersionFile(contents)
            }),
        ),
    )

    for (const deferredVersion of deferredVersions) {
        const changelog = deferredVersion.changelog || ''
        for (const [pkgName, rawStrategy] of Object.entries(deferredVersion.strategies)) {
            const strategy = rawStrategy?.trim()

            const workspace = context.project.tryWorkspaceByIdent(structUtils.parseIdent(pkgName))
            if (!workspace) {
                throw new Error(`Invalid version file, received unknown workspace: '${pkgName}'`)
            }

            if (workspace.manifest.private) {
                throw new Error(`Invalid version file. Workspace '${pkgName}' is private.`)
            }

            if (!strategy) continue
            if (!isPackageStrategyType(strategy)) {
                throw new Error(
                    `Invalid version file. Workspace '${pkgName}' has invalid strategy '${strategy}'`,
                )
            }

            const previousVersionStrategy = versionStrategies.get(pkgName)
            const previousChangelog = previousVersionStrategy?.changelog

            versionStrategies.set(pkgName, {
                type: maxStrategy(previousVersionStrategy?.type, strategy),
                commits: [],
                changelog: (previousChangelog
                    ? `${previousChangelog}\n\n${changelog}`
                    : changelog
                ).trim(),
            })
        }
    }

    return { intentionalStrategies: versionStrategies, deferredVersionFiles }
}
