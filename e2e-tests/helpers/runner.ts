/* eslint-disable no-undef */
import path from 'path'

import { type ExecException, exec } from '@monoweave/io'
import { isNodeError } from '@monoweave/types'

const scriptPath = require.resolve('@monoweave/cli')

export default async function run({ cwd, args = '' }: { cwd: string; args: string }): Promise<{
    stdout: string | undefined
    stderr: string | undefined
    error?: ExecException | Error
}> {
    const nycBin = require.resolve('nyc/bin/nyc', {
        paths: [process.cwd()],
    })
    const nycConfig = require.resolve('./nyc.config.js', {
        paths: [process.cwd()],
    })
    const tsx = require.resolve('tsx', {
        paths: [process.cwd()],
    })

    const tsconfig = path.join(process.cwd(), 'tsconfig.json')

    try {
        const { stdout, stderr } = await exec(
            `node ${nycBin} --nycrc-path ${nycConfig} --cwd ${process.cwd()} node --import ${tsx} ${scriptPath} ${args}`,
            {
                cwd,
                env: {
                    ...process.env,
                    TSX_TSCONFIG_PATH: tsconfig,
                    NODE_ENV: 'production',
                },
            },
        )
        if (process.env.DEBUG?.includes('test:e2e')) {
            if (stdout) console.error(stdout)
            if (stderr) console.error(stderr)
        }
        return { stdout, stderr }
    } catch (err) {
        if (isNodeError<ExecException>(err)) {
            if (process.env.DEBUG?.includes('test:e2e')) {
                if (err.stdout) console.error(err.stdout)
                if (err.stderr) console.error(err.stderr)
            }
            return { error: err, stdout: err?.stdout, stderr: err?.stderr }
        }
        throw new Error('Unexpected error')
    }
}
