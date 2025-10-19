import { promises as fs } from 'fs'
import path from 'path'

import { mergeDefaultConfig } from '@monoweave/node/testUtils'
import {
    type MonoweaveConfiguration,
    type RecursivePartial,
    type YarnContext,
} from '@monoweave/types'
import { getPluginConfiguration } from '@yarnpkg/cli'
import { Configuration, Project, ThrowReport } from '@yarnpkg/core'
import { type PortablePath } from '@yarnpkg/fslib'

export async function setupContext(cwd: PortablePath): Promise<YarnContext> {
    const configuration = await Configuration.find(cwd, getPluginConfiguration())
    const { project, workspace } = await Project.find(configuration, cwd)

    if (!workspace) {
        throw Error('Invalid CWD')
    }

    const context: YarnContext = {
        configuration,
        project,
        workspace,
        report: new ThrowReport(),
    }

    return context
}

export async function getMonoweaveConfig({
    baseBranch,
    commitSha,
    cwd,
    changelogFilename,
    dryRun,
    ...rest
}: Partial<{
    baseBranch: string
    commitSha: string
    cwd: string
    changelogFilename: string
    dryRun: boolean
}> &
    RecursivePartial<MonoweaveConfiguration> = {}): Promise<MonoweaveConfiguration> {
    return await mergeDefaultConfig({
        ...rest,
        cwd,
        git: { baseBranch, commitSha, ...rest.git },
        changelogFilename,
        dryRun,
    })
}

export async function writeConfigCJS({
    cwd,
    config,
}: {
    cwd: string
    config: RecursivePartial<MonoweaveConfiguration>
}): Promise<string> {
    const monoweaveConfigFilename = path.resolve(cwd, 'monoweave.config.cjs')
    const configFile = `module.exports = ${JSON.stringify(config)}`
    await fs.writeFile(monoweaveConfigFilename, configFile, {
        encoding: 'utf8',
    })
    return monoweaveConfigFilename
}

export async function writeConfigESM({
    cwd,
    config,
}: {
    cwd: string
    config: RecursivePartial<MonoweaveConfiguration>
}): Promise<string> {
    const monoweaveConfigFilename = path.resolve(cwd, 'monoweave.config.mjs')
    const configFile = `export default ${JSON.stringify(config)}`
    await fs.writeFile(monoweaveConfigFilename, configFile, {
        encoding: 'utf8',
    })
    return monoweaveConfigFilename
}

export async function waitFor<T>(
    predicate: () => Promise<T>,
    { maxSteps = 200 }: { maxSteps?: number } = {},
): Promise<T> {
    let steps = maxSteps
    while (steps > 0) {
        steps--
        await new Promise((r) => setTimeout(r))

        try {
            const result = await predicate()
            return result
        } catch (err) {
            if (steps > 0) continue
            throw err
        }
    }
    throw new Error(`Max steps exceeded (${maxSteps} interations)`)
}
