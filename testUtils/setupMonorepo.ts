import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import { type YarnContext } from '@monoweave/types'
import { Cache, StreamReport, ThrowReport, structUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'

import { packageManager } from '@monoweave/monorepo/package.json'

import { setupContext } from './misc'

const DEBUG = process.env.DEBUG === '1'
const YARN_VERSION = packageManager.match('^yarn@([^+]+)')?.[1] ?? 'invalid'

async function writeJSON(filename: string, data: Record<string, unknown>): Promise<void> {
    await fs.mkdir(path.dirname(filename), { recursive: true })
    await fs.writeFile(filename, JSON.stringify(data), 'utf-8')
}

async function makeDependencyMap(
    packages: Record<string, string> | (string | [string, string])[],
    { useRelativePath = true }: { useRelativePath?: boolean } = {},
): Promise<Record<string, string>> {
    const dependencies: Record<string, string> = {}
    if (Array.isArray(packages)) {
        for (const pkg of packages) {
            if (Array.isArray(pkg)) {
                dependencies[pkg[0]] = pkg[1]
            } else {
                dependencies[pkg] = useRelativePath
                    ? `workspace:packages/${structUtils.parseIdent(pkg).name}`
                    : 'workspace:*'
            }
        }
    } else {
        return { ...packages }
    }
    return dependencies
}

type PackageInitConfiguration = Partial<{
    dependencies: Record<string, string> | (string | [string, string])[]
    devDependencies: Record<string, string> | (string | [string, string])[]
    peerDependencies: Record<string, string> | (string | [string, string])[]
    scripts: Record<string, string>
    private: boolean
    version: string
    raw?: Record<string, any>
}>

type ProjectRootInitConfiguration = PackageInitConfiguration &
    Partial<{
        name?: string | null
        repository: string
    }>

export default async function setupMonorepo(
    monorepo: Record<string, PackageInitConfiguration>,
    {
        root,
        nodeLinker = 'pnp',
        cwd,
    }: {
        root?: ProjectRootInitConfiguration
        nodeLinker?: 'pnp' | 'pnpm' | 'node-modules'
        cwd?: string
    } = {},
): Promise<YarnContext> {
    const workingDir = cwd ?? (await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-')))

    // Generate root package.json
    await writeJSON(path.join(workingDir, 'package.json'), {
        name: root?.name === null ? undefined : (root?.name ?? 'monorepo'),
        private: root?.private ?? true,
        version: root?.version ?? '1.0.0',
        workspaces: Object.keys(monorepo).length ? ['packages/*'] : undefined,
        dependencies: await makeDependencyMap(root?.dependencies ?? []),
        devDependencies: await makeDependencyMap(root?.devDependencies ?? []),
        peerDependencies: await makeDependencyMap(root?.peerDependencies ?? [], {
            useRelativePath: false,
        }),
        repository: root?.repository,
        packageManager: `yarn@${YARN_VERSION}`,
    })

    // Generate children workspaces
    for (const [pkgName, pkgConfig] of Object.entries(monorepo)) {
        const pkgDir = path.join(workingDir, 'packages', structUtils.parseIdent(pkgName).name)
        await fs.mkdir(pkgDir, { recursive: true })

        await writeJSON(path.join(pkgDir, 'package.json'), {
            name: pkgName,
            version: pkgConfig.version ?? '0.0.0',
            private: pkgConfig.private || undefined,
            scripts: pkgConfig.scripts ?? {},
            dependencies: await makeDependencyMap(pkgConfig.dependencies ?? []),
            devDependencies: await makeDependencyMap(pkgConfig.devDependencies ?? []),
            peerDependencies: await makeDependencyMap(pkgConfig.peerDependencies ?? [], {
                useRelativePath: false,
            }),
            ...pkgConfig.raw,
        })
    }

    // Generate .yarnrc.yml
    const authIdent = Buffer.from('test-user:test-password').toString('base64')
    await fs.writeFile(
        path.join(workingDir, '.yarnrc.yml'),
        [
            `nodeLinker: ${nodeLinker}`,
            'enableGlobalCache: false',
            'pnpEnableEsmLoader: false',
            ...(process.env.E2E === '1'
                ? [
                      "unsafeHttpWhitelist: ['localhost']",
                      'npmAlwaysAuth: true',
                      'npmRegistryServer: "http://localhost:4873"',
                      `npmRegistries:\n  "//localhost:4873":\n    npmAuthIdent: "${authIdent}"\n    npmAlwaysAuth: true`,
                  ]
                : []),
        ].join('\n'),
        'utf-8',
    )

    // Initialize project
    const context: YarnContext = await setupContext(npath.toPortablePath(workingDir))

    await context.project.install({
        cache: await Cache.find(context.configuration),
        report: DEBUG
            ? new StreamReport({ configuration: context.configuration, stdout: process.stdout })
            : new ThrowReport(),
    })

    return context
}

export async function createMonorepoContext(
    monorepo: Record<string, PackageInitConfiguration>,
    {
        root,
        debug,
        cwd,
    }: { root?: ProjectRootInitConfiguration; cwd?: string; debug?: boolean } = {},
): Promise<AsyncDisposable & YarnContext> {
    const context = await setupMonorepo(monorepo, { root, cwd })

    return {
        ...context,
        async [Symbol.asyncDispose]() {
            if (debug) {
                console.log(`Working Directory: ${context.project.cwd}`)
            } else {
                try {
                    await fs.rm(context.project.cwd, { recursive: true, force: true })
                } catch {}
            }
        },
    }
}
