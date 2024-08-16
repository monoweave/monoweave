import fs from 'fs'
import path from 'path'

const scriptPath = path.join(__dirname, 'index.ts')
import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals'
import * as monoweave from '@monoweave/node'
import { createTempDir, waitFor } from '@monoweave/test-utils'
import { parseDeferredVersionFile } from '@monoweave/versions'

jest.mock('@monoweave/node')

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
        jest.restoreAllMocks()
    })

    const setArgs = (command: string) => {
        process.argv = command ? ['node', scriptPath, ...command.split(' ')] : ['node', scriptPath]
    }

    it('exits with a warning if no packages detected', async () => {
        const spyLog = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)

        await using temp = await createTempDir()

        jest.spyOn(monoweave, 'getPackageCandidatesForManualRelease').mockResolvedValue({
            remainingPackages: new Map([]),
            suggestedPackages: new Map([]),
            versionFolder: temp.dir,
        })

        setArgs('version')
        jest.isolateModules(() => {
            require('./index')
        })

        await waitFor(async () => {
            expect(spyLog).toHaveBeenCalledWith(expect.stringMatching(/No packages detected/))
        })
        expect(spyLog).not.toHaveBeenCalledWith(
            expect.stringMatching(/A version file has been written/),
        )
    })

    describe('Non-Interactive Mode', () => {
        it('defaults to patch and empty changelog', async () => {
            const spyLog = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)

            await using temp = await createTempDir()

            jest.spyOn(monoweave, 'getPackageCandidatesForManualRelease').mockResolvedValue({
                remainingPackages: new Map([]),
                suggestedPackages: new Map([
                    ['pkg-1', { currentVersion: '1.0.0' }],
                    ['pkg-2', { currentVersion: '1.0.0' }],
                ]),
                versionFolder: temp.dir,
            })

            setArgs('version --no-interactive')
            jest.isolateModules(() => {
                require('./index')
            })

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
            const spyLog = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)

            await using temp = await createTempDir()

            jest.spyOn(monoweave, 'getPackageCandidatesForManualRelease').mockResolvedValue({
                remainingPackages: new Map([]),
                suggestedPackages: new Map([
                    ['pkg-1', { currentVersion: '1.0.0' }],
                    ['pkg-2', { currentVersion: '1.0.0' }],
                ]),
                versionFolder: temp.dir,
            })

            setArgs('version --no-interactive --strategy=minor --message=changelog-entry')
            jest.isolateModules(() => {
                require('./index')
            })

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
