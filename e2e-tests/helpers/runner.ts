import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'

import { type ExecException, exec } from '@monoweave/io'
import { isNodeError } from '@monoweave/types'

const require = createRequire(import.meta.url)

const scriptPath = require.resolve('@monoweave/cli')

export default async function run({ cwd, args = '' }: { cwd: string; args: string }): Promise<{
    stdout: string | undefined
    stderr: string | undefined
    error?: ExecException | Error
}> {
    const tsx = require.resolve('tsx', {
        paths: [process.cwd()],
    })

    const tsconfig = path.join(process.cwd(), 'tsconfig.json')

    const coverageDir = path.resolve(process.cwd(), 'raw-coverage/vitest-e2es')
    await fs.promises.mkdir(coverageDir, { recursive: true })

    try {
        const { stdout, stderr } = await exec(`node --import ${tsx} ${scriptPath} ${args}`, {
            cwd,
            env: {
                ...process.env,
                TSX_TSCONFIG_PATH: tsconfig,
                NODE_ENV: 'production',
                NODE_V8_COVERAGE: coverageDir,
            },
        })
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
