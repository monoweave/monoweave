// @ts-check

const independentWorkspaceIdents = new Set([
    '@monoweave/cli',
    '@monoweave/node',
    '@monoweave/plugin-github',
    '@monoweave/types',
])

/**
 * Enforces that all workspaces depend on each other using the workspace protocol.
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceWorkspaceDependenciesWhenPossible({ Yarn }) {
    for (const dependency of Yarn.dependencies()) {
        // Only enforce for workspaces
        if (!Yarn.workspace({ ident: dependency.ident })) continue

        if (!dependency.range.startsWith('workspace:')) {
            dependency.update('workspace:*')
        }
    }
}

/**
 * Enforces that @yarnpkg/* dependencies have consistent versions across
 * peer and dev dependencies. Since devDependencies are easily updated using
 * "yarn up" tooling and renovate, we will use the devDependency version as the
 * source of truth.
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceYarnLibraryPeerAndDevConsistency({ Yarn }) {
    for (const workspace of Yarn.workspaces()) {
        for (const peerDependency of Yarn.dependencies({ workspace, type: 'peerDependencies' })) {
            if (!peerDependency.ident.startsWith('@yarnpkg/')) continue

            const devDependency = Yarn.dependency({
                workspace,
                type: 'devDependencies',
                ident: peerDependency.ident,
            })
            if (devDependency) {
                peerDependency.update(devDependency.range)
            }
        }
    }
}

/**
 * All workspaces should satisfy their peer dependencies.
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceMonoweaveSatisfiesPeers({ Yarn }) {
    for (const workspace of Yarn.workspaces()) {
        for (const dependency of Yarn.dependencies({ workspace, type: 'dependencies' })) {
            const dependencyWorkspace = Yarn.workspace({ ident: dependency.ident })
            if (!dependencyWorkspace) continue
            // Get all peers of the dependency and make sure we satisfy them.
            // Note that resolution.peerDependencies only shows installed peer dependencies, won't show missing,
            // we have to use the manifest instead
            const peerDependencies = dependencyWorkspace.pkg.peerDependencies
            if (!peerDependencies) continue
            // If the workspace is "independent" (i.e. meant to be consumed directly), the peer must be
            // satisfied as a direct dependency. Otherwise, it should be a peer _if_ it's not directly satisfied.
            const expectedType =
                workspace.ident && independentWorkspaceIdents.has(workspace.ident)
                    ? 'dependencies'
                    : 'peerDependencies'

            for (const [peerName, peerRange] of peerDependencies.entries()) {
                if (peerName.startsWith('@monoweave/')) {
                    /** @type {string | undefined} */
                    const previousRange = workspace.manifest.dependencies?.[peerName]
                    const previousRangeMatch = previousRange?.match(/^(workspace:\^\d+\.\d+)\.\d+$/)
                    if (previousRangeMatch) {
                        if (peerRange.startsWith(previousRangeMatch[1])) {
                            // The range is only a "patch" off and we round peer deps down. So ignore.
                            continue
                        }
                    }
                }
                workspace.set([expectedType, peerName], peerRange)
            }
        }
    }
}

/**
 * Enforces required manifest fields for workspaces.
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceRequiredWorkspaceFields({ Yarn }) {
    for (const workspace of Yarn.workspaces()) {
        workspace.set(['author', 'name'], 'noahnu')
        workspace.set(['author', 'url'], 'https://monoweave.github.io/monoweave/')
        workspace.set(['license'], 'BSD-3')

        if (workspace.manifest.private) continue

        workspace.set(['repository', 'type'], 'git')
        workspace.set(['repository', 'url'], 'https://github.com/monoweave/monoweave.git')
        workspace.set(['repository', 'directory'], workspace.cwd)
        workspace.set(['publishConfig', 'registry'], 'https://registry.npmjs.org/')
        workspace.set(['publishConfig', 'access'], 'public')
    }
}

/**
 * Enforces Yarn libraries are declared as both peer and dependency.
 * Further, @yarnpkg/* should not be listed as a direct dependency.
 *
 * Exclude independent workspaces (they get handled by a separate constraint).
 *
 * @param {import('@yarnpkg/types').Yarn.Constraints.Context} context
 */
function enforceYarnLibrariesPeerAndDev({ Yarn }) {
    for (const workspace of Yarn.workspaces()) {
        if (workspace.manifest.private) continue
        if (workspace.ident && independentWorkspaceIdents.has(workspace.ident)) continue

        for (const dependency of Yarn.dependencies({ workspace })) {
            // Skip if not yarnpkg or if it's not peer/dep.
            if (
                !dependency.ident.startsWith('@yarnpkg/') ||
                dependency.type === 'devDependencies'
            ) {
                continue
            }

            // If it's a direct dependency, move it to peer and dev.
            if (dependency.type === 'dependencies') {
                workspace.set(['peerDependencies', dependency.ident], dependency.range)
                dependency.delete()
            } else if (dependency.type === 'peerDependencies') {
                const devDep = Yarn.dependency({ workspace, ident: dependency.ident })
                if (devDep) {
                    // If it's a peer, make sure it's also a dev.
                    // Use devDep as source of truth because 'yarn up' tooling modifies it directly
                    workspace.set(['devDependencies', dependency.ident], devDep.range)
                }
            }
        }
    }
}

module.exports = {
    async constraints(ctx) {
        enforceMonoweaveSatisfiesPeers(ctx)
        enforceWorkspaceDependenciesWhenPossible(ctx)
        enforceYarnLibraryPeerAndDevConsistency(ctx)
        enforceYarnLibrariesPeerAndDev(ctx)
        enforceRequiredWorkspaceFields(ctx)
    },
}
