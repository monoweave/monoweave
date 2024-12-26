import fs from 'fs/promises'
import os from 'os'
import path from 'path'

export async function createFile({
    filePath,
    content,
    cwd,
}: {
    filePath: string
    content?: string
    cwd: string
}): Promise<string> {
    const fileContent = content ?? 'some content'
    const fullpath = path.join(cwd, filePath)
    await fs.mkdir(path.dirname(fullpath), { recursive: true })
    await fs.writeFile(fullpath, fileContent)
    return fullpath
}

export async function createTempDir(): Promise<{ dir: string } & AsyncDisposable> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
    return {
        dir,
        async [Symbol.asyncDispose]() {
            try {
                await fs.rm(dir, { recursive: true, force: true })
            } catch {}
        },
    }
}
