import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import { type ExecException, exec } from '@monoweave/io'
import {
    addGitRemote,
    cleanUp,
    initGitRepository,
    setupTestRepository,
    writeConfig,
} from '@monoweave/test-utils'
import { type MonoweaveConfiguration, type RecursivePartial } from '@monoweave/types'
import { npath } from '@yarnpkg/fslib'

import { startRegistry, stopRegistry } from './docker'
import run from './runner'

const registryUrl = 'http://localhost:4873'

type RunFn = (args?: string[]) => Promise<{
    stdout: string | undefined
    stderr: string | undefined
    error?: Error | ExecException
}>

type ExecFn = (cmd: string) => ReturnType<typeof exec>

type ReadFile = (filepath: string) => Promise<string>
type WriteFile = (filepath: string, data: string | Record<string, unknown>) => Promise<string>

interface TestContext {
    cwd: string
    run: RunFn
    readFile: ReadFile
    writeFile: WriteFile
    exec: ExecFn
}

export async function writeConfigWithLocalRegistry(
    config: RecursivePartial<MonoweaveConfiguration>,
    { cwd }: { cwd: string },
): Promise<string> {
    return path.relative(
        cwd,
        await writeConfig({
            cwd,
            config: {
                registryUrl,
                ...config,
            },
        }),
    )
}

export function createSetupProjectContext({
    configFilename,
    project,
}: {
    configFilename: string
    project: string
}) {
    return {
        cwd: project,
        run: (args?: string[]) => {
            if (!project) throw new Error('Missing project path.')
            console.log(`Temporary Project: ${project}`)

            return run({
                cwd: project,
                args: [`--config-file ${configFilename}`, ...(args ? args : [])].join(' '),
            })
        },
        readFile: (filename: string) => {
            if (!project) throw new Error('Missing project path.')
            return fs.readFile(path.resolve(project, filename), {
                encoding: 'utf8',
            })
        },
        writeFile: async (
            filename: string,
            data: string | Record<string, unknown>,
        ): Promise<string> => {
            if (!project) throw new Error('Missing project path.')
            const fullFilename = path.resolve(project, filename)
            await fs.appendFile(
                fullFilename,
                typeof data === 'string' ? data : JSON.stringify(data, null, 4),
                'utf-8',
            )
            return fullFilename
        },
        exec: (command: string) => {
            if (!project) throw new Error('Missing project path.')
            return exec(command, { cwd: project })
        },
    }
}

export default async function setupProject({
    repository,
    config,
}: {
    repository: Parameters<typeof setupTestRepository>
    config: RecursivePartial<MonoweaveConfiguration>
}): Promise<TestContext & AsyncDisposable> {
    await startRegistry()

    let project: string | null = null
    let remotePath: string | null = null

    // the project we're publishing
    project = await setupTestRepository(...repository)

    // remote to push tags/artifacts to
    remotePath = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'monorepo-'))
    await initGitRepository(npath.toPortablePath(remotePath))
    await addGitRemote(project, remotePath, 'origin')

    const configFilename = await writeConfigWithLocalRegistry(config, { cwd: project })

    // initial commit
    await exec('git pull --rebase --no-verify origin main', {
        cwd: project,
    })
    await exec('git add . && git commit -n -m "initial commit"', {
        cwd: project,
    })
    await exec('git push -u origin main', {
        cwd: project,
    })

    return {
        ...createSetupProjectContext({ project, configFilename }),
        async [Symbol.asyncDispose]() {
            await cleanUp([project, remotePath].filter((v): v is string => v !== null))
            await stopRegistry()
        },
    }
}
