import path from 'path'

import { gitDiffTree } from '@monoweave/git'
import logging from '@monoweave/logging'
import { type MonoweaveConfiguration, type YarnContext } from '@monoweave/types'
import { structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import micromatch from 'micromatch'

export const getModifiedPackages = async ({
    config,
    context,
    commitSha,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
    commitSha: string
}): Promise<string[]> => {
    const diffOutput = await gitDiffTree(commitSha, {
        cwd: config.cwd,
        context,
    })
    const paths: string[] = diffOutput.split('\n')
    const uniquePaths: Set<string> = paths.reduce(
        (uniquePaths: Set<string>, currentPath: string) => {
            if (currentPath) uniquePaths.add(currentPath)
            return uniquePaths
        },
        new Set(),
    )

    const ignorePatterns = config.changesetIgnorePatterns ?? []

    const modifiedPackages = [...uniquePaths].reduce(
        (modifiedPackages: string[], currentPath: string): string[] => {
            if (!micromatch([currentPath], ignorePatterns).length) {
                try {
                    const workspace = context.project.getWorkspaceByFilePath(
                        npath.toPortablePath(path.resolve(config.cwd, currentPath)),
                    )
                    const ident = workspace?.manifest?.name
                    if (!ident) {
                        if (
                            context.project.topLevelWorkspace.anchoredDescriptor ===
                                workspace.anchoredDescriptor &&
                            workspace.manifest.private
                        ) {
                            // We allow the top level workspace, if private, to be missing a name
                            return modifiedPackages
                        }
                        throw new Error('Missing workspace identity.')
                    }

                    const packageName = structUtils.stringifyIdent(ident)
                    if (packageName) {
                        modifiedPackages.push(packageName)
                    }
                } catch (err) {
                    logging.error(err, { report: context.report })
                }
            }
            return modifiedPackages
        },
        [],
    )
    return [...new Set(modifiedPackages)]
}
