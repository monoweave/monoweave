import fs from 'fs'
import path from 'path'

import {
    type DeferredVersionRecord,
    type MonoweaveConfiguration,
    type PackageStrategyMap,
    type PackageStrategyType,
    type YarnContext,
    isNodeError,
} from '@monoweave/types'
import { structUtils } from '@yarnpkg/core'
import pLimit from 'p-limit'
import YAML from 'yaml'

import { maxStrategy } from '../versionStrategy'

export async function parseVersionFileContents(contents: string): Promise<DeferredVersionRecord> {
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

const allowedStrategies = new Set<string>(['patch', 'minor', 'major'])

function isPackageStrategyType(raw: string): raw is PackageStrategyType {
    return allowedStrategies.has(raw)
}

export async function discoverVersionFiles({
    config,
}: {
    config: MonoweaveConfiguration
}): Promise<string[]> {
    if (!config.versionStrategy?.versionFolder) {
        return []
    }

    const versionFolder = path.resolve(config.cwd, config.versionStrategy.versionFolder)

    try {
        const files = await fs.promises.readdir(versionFolder, {
            encoding: 'utf-8',
            recursive: false,
            withFileTypes: true,
        })

        return files
            .filter((file) => file.isFile() && file.name.endsWith('.md'))
            .map((file) => path.resolve(versionFolder, file.path, file.name))
    } catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT') {
            return []
        }
        throw err
    }
}

export async function getManualVersionStrategies({
    config,
    context,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
}): Promise<{ intentionalStrategies: PackageStrategyMap; deferredVersionFiles: string[] }> {
    const versionStrategies: PackageStrategyMap = new Map()
    const deferredVersionFiles = await discoverVersionFiles({ config })

    const limitRead = pLimit(5)

    const deferredVersions = await Promise.all(
        deferredVersionFiles.map((file) =>
            limitRead(async () => {
                const contents = await fs.promises.readFile(file, { encoding: 'utf-8' })
                return await parseVersionFileContents(contents)
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
