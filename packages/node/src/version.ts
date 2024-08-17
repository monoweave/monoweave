import path from 'path'

import { getCommitMessages } from '@monoweave/git'
import logging, { InvariantError } from '@monoweave/logging'
import type { MonoweaveConfiguration, RecursivePartial, YarnContext } from '@monoweave/types'
import { getLatestPackageTags, getModifiedPackages } from '@monoweave/versions'
import { Configuration, Project, ThrowReport, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import micromatch from 'micromatch'

import { getCompatiblePluginConfiguration } from './utils/getCompatiblePluginConfiguration.js'
import { mergeDefaultConfig } from './utils/mergeDefaultConfig.js'

export const getPackageCandidatesForManualRelease = async (
    baseConfig: RecursivePartial<MonoweaveConfiguration>,
    { includePatterns }: { includePatterns?: string[] } = {},
): Promise<{
    packages: Map<string, { currentVersion: string | undefined; modified: boolean }>
    versionFolder: string
}> => {
    if (baseConfig.logLevel !== undefined && baseConfig.logLevel !== null) {
        process.env.MONOWEAVE_LOG_LEVEL = String(baseConfig.logLevel)
    }

    const config: MonoweaveConfiguration = await mergeDefaultConfig(baseConfig)
    if (config.cwd === typeof undefined) {
        throw new Error('Invalid cwd.')
    }

    const cwd = npath.toPortablePath(path.resolve(process.cwd(), config.cwd))
    const configuration = await Configuration.find(cwd, getCompatiblePluginConfiguration())
    const foundProject = await Project.find(configuration, cwd)
    const { project } = foundProject
    await project.restoreInstallState()

    if (!foundProject.workspace) throw new InvariantError('No workspace found.')

    const context: YarnContext = {
        configuration,
        project,
        workspace: foundProject.workspace,
        report: new ThrowReport(),
    }

    // Fetch latest package versions for workspaces
    const registryTags = await getLatestPackageTags({
        config,
        context,
    })

    const commitIgnorePatterns: RegExp[] = [...(config.commitIgnorePatterns ?? [])].map(
        (pattern) => (pattern instanceof RegExp ? pattern : new RegExp(pattern, 'm')),
    )

    const modifiedPackages = new Set<string>()
    const commits = await getCommitMessages(config, context)
    for (const commit of commits) {
        if (commitIgnorePatterns.some((pattern) => pattern.test(`${commit.sha}\n${commit.body}`))) {
            logging.debug(
                `[Explicit Version Strategies] Skipping commit ${commit.sha} for matching a commit ignore pattern.`,
                { report: context.report },
            )
            continue
        }

        const packageNames = await getModifiedPackages({
            config,
            context,
            commitSha: commit.sha,
        })
        for (const pkg of packageNames) {
            if (project.tryWorkspaceByIdent(structUtils.parseIdent(pkg))?.manifest.private) continue
            modifiedPackages.add(pkg)
        }
    }

    const packages = new Map<string, { currentVersion: string | undefined; modified: boolean }>()

    for (const pkgName of modifiedPackages) {
        if (includePatterns?.length && !micromatch([pkgName], includePatterns).length) continue
        packages.set(pkgName, { currentVersion: registryTags.get(pkgName)?.latest, modified: true })
    }

    for (const workspace of project.workspaces) {
        if (workspace.manifest.private || !workspace.manifest.name) continue
        const pkgName = structUtils.stringifyIdent(workspace.manifest.name)
        if (packages.has(pkgName)) continue
        if (includePatterns?.length && !micromatch([pkgName], includePatterns).length) continue
        packages.set(pkgName, {
            currentVersion: registryTags.get(pkgName)?.latest,
            modified: false,
        })
    }

    return {
        packages,
        versionFolder: path.resolve(
            npath.fromPortablePath(project.cwd),
            config.versionStrategy?.versionFolder ?? '.monoweave',
        ),
    }
}
