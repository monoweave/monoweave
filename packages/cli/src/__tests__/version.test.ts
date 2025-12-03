import fs from 'fs'
import path from 'path'

import { createTempDir, waitFor } from '@monoweave/test-utils'
import { parseDeferredVersionFile } from '@monoweave/versions'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const scriptPath = path.join(__dirname, '..', 'index.ts')

vi.mock('@monoweave/node', async () => ({
    ...(await vi.importActual('@monoweave/node')),
}))

describe('CLI - Version', () => {
    const origArgs = process.argv

    beforeAll(() => {
        process.env.MONOWEAVE_SUPPRESS_EXIT_CODE = '1'
        delete process.env.MONOWEAVE_DISABLE_LOGS
        delete process.env.CI
    })

    afterAll(() => {
        process.argv = origArgs
    })

    afterEach(() => {
        vi.resetModules()
    })

    const setArgs = (command: string) => {
        process.argv = command ? ['node', scriptPath, ...command.split(' ')] : ['node', scriptPath]
    }

    it('exits with a warning if no packages detected', async () => {
        const monoweave =
            // eslint-disable-next-line @typescript-eslint/consistent-type-imports
            await vi.importMock<typeof import('@monoweave/node')>('@monoweave/node')

        const spyLog = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

        await using temp = await createTempDir()

        vi.spyOn(monoweave, 'getPackageCandidatesForManualRelease').mockResolvedValue({
            packages: new Map<string, { currentVersion: string | undefined; modified: boolean }>(
                [],
            ),
            versionFolder: temp.dir,
        })

        setArgs('version')
        await vi.importActual('../index')

        await waitFor(async () => {
            expect(spyLog).toHaveBeenCalledWith(expect.stringMatching(/No packages detected/))
        })
        expect(spyLog).not.toHaveBeenCalledWith(
            expect.stringMatching(/A version file has been written/),
        )
    })

    describe('Non-Interactive Mode', () => {
        it('defaults to patch and empty changelog', async () => {
            const monoweave =
                // eslint-disable-next-line @typescript-eslint/consistent-type-imports
                await vi.importMock<typeof import('@monoweave/node')>('@monoweave/node')

            const spyLog = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

            await using temp = await createTempDir()

            vi.spyOn(monoweave, 'getPackageCandidatesForManualRelease').mockResolvedValue({
                packages: new Map([
                    ['pkg-1', { currentVersion: '1.0.0', modified: true }],
                    ['pkg-2', { currentVersion: '1.0.0', modified: true }],
                ]),
                versionFolder: temp.dir,
            })

            setArgs('version --no-interactive')
            await vi.importActual('../index')

            await waitFor(async () => {
                expect(spyLog).toHaveBeenCalledWith(
                    expect.stringMatching(/A version file has been written/),
                )
            })

            const versionFiles = await fs.promises.readdir(temp.dir)
            const versionFile = await parseDeferredVersionFile(
                await fs.promises.readFile(path.join(temp.dir, versionFiles[0]), 'utf-8'),
            )

            expect(versionFile.changelog).toBe('')
            expect(versionFile.strategies).toEqual({
                'pkg-1': 'patch',
                'pkg-2': 'patch',
            })
        })

        it('writes a version file', async () => {
            const monoweave =
                // eslint-disable-next-line @typescript-eslint/consistent-type-imports
                await vi.importMock<typeof import('@monoweave/node')>('@monoweave/node')

            const spyLog = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

            await using temp = await createTempDir()

            vi.spyOn(monoweave, 'getPackageCandidatesForManualRelease').mockResolvedValue({
                packages: new Map([
                    ['pkg-1', { currentVersion: '1.0.0', modified: true }],
                    ['pkg-2', { currentVersion: '1.0.0', modified: true }],
                ]),
                versionFolder: temp.dir,
            })

            setArgs('version --no-interactive --strategy=minor --message=changelog-entry')
            await vi.importActual('../index')

            await waitFor(async () => {
                expect(spyLog).toHaveBeenCalledWith(
                    expect.stringMatching(/A version file has been written/),
                )
            })

            const versionFiles = await fs.promises.readdir(temp.dir)
            const versionFile = await parseDeferredVersionFile(
                await fs.promises.readFile(path.join(temp.dir, versionFiles[0]), 'utf-8'),
            )

            expect(versionFile.changelog).toEqual(expect.stringContaining('changelog-entry'))
            expect(versionFile.strategies).toEqual({
                'pkg-1': 'minor',
                'pkg-2': 'minor',
            })
        })
    })
})
