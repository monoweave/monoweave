/* eslint-disable @typescript-eslint/no-var-requires */

import fs from 'node:fs'
import path from 'node:path'

import type { MonoweaveConfigFile } from '@monoweave/types'
import { structUtils } from '@yarnpkg/core'
import { type PortablePath, npath, ppath } from '@yarnpkg/fslib'
import JSON5 from 'json5'
import YAML from 'yaml'

import validateConfigFile from './validateConfigFile.js'

class ResolveFailure extends Error {}

const DEFAULT_CONFIG_BASENAME = 'monoweave.config'

async function loadFile(filename: string): Promise<unknown> {
    const ext = path.extname(filename)
    if (ext === '.mjs' || ext === '.cjs') {
        const mod = await import(filename)
        if ('default' in mod && mod.default) {
            return mod.default
        }
        return mod
    }
    if (!ext || ext === '.js' || ext === '.ts') {
        return require(filename)
    }

    const contents = await fs.promises.readFile(filename, { encoding: 'utf-8' })
    if (ext === '.json' || ext === '.jsonc' || ext === '.json5') {
        return await JSON5.parse(contents)
    }
    if (ext === '.yml' || ext === '.yaml') {
        return await YAML.parse(contents, { strict: false })
    }

    throw new Error(`Invalid file extension '${ext}' for monoweave configuration file.`)
}

async function resolvePath(name: string, cwd: PortablePath): Promise<string> {
    try {
        const nCwd = npath.fromPortablePath(cwd)

        if (structUtils.tryParseIdent(name)) {
            try {
                return require.resolve(name, { paths: [nCwd] })
            } catch {}
        }

        const absPath = ppath.resolve(cwd, npath.toPortablePath(name))
        const nativeAbsPath = npath.fromPortablePath(absPath)
        try {
            return require.resolve(nativeAbsPath, { paths: [nCwd] })
        } catch {
            await fs.promises.access(nativeAbsPath, fs.constants.R_OK)
            return nativeAbsPath
        }
    } catch (err) {
        throw new ResolveFailure(String(err))
    }
}

function merge(base: any, overrides: any) {
    if (overrides === undefined && base === undefined) return undefined
    if (overrides !== undefined && base === undefined) return overrides
    if (overrides === undefined && base !== undefined) return base

    // we don't handle merging different types (like string and arrays)
    if (typeof base !== typeof overrides) return overrides

    if (base && typeof base === 'object' && !Array.isArray(base)) {
        // an object like "git: {...}"
        const merged: any = { ...base }
        for (const key in overrides) {
            const newValue = merge(base[key], overrides[key])
            if (newValue !== undefined) {
                merged[key] = newValue
            }
        }
        return merged
    }

    return overrides
}

async function loadPresetConfig(presetPath: string | null, cwd: PortablePath) {
    if (presetPath) {
        if (presetPath.startsWith('monoweave/')) {
            switch (presetPath.split('/')[1]) {
                case 'preset-recommended':
                    return await loadFile('../../presets/recommended')
                case 'preset-legacy':
                    return await loadFile('../../presets/legacy')
                case 'preset-manual':
                    return await loadFile('../../presets/manual')
                default:
                    break
            }
        }
        return await loadFile(await resolvePath(presetPath, cwd))
    }

    return null
}

async function discoverDefaultConfigFile(cwd: PortablePath): Promise<string | undefined> {
    const extensions = ['js', 'cjs', 'mjs', 'yaml', 'yml', 'json5', 'jsonc', 'json']

    // return the first file we can read
    for (const ext of extensions) {
        try {
            const basename = `${DEFAULT_CONFIG_BASENAME}.${ext}`
            const filename = npath.fromPortablePath(ppath.resolve(cwd, basename))
            await fs.promises.access(filename, fs.constants.R_OK)
            return basename
        } catch {
            continue
        }
    }

    return undefined
}

const readConfigFile = async (
    configName: string | undefined,
    { cwd, preset }: { cwd: PortablePath; preset: string | undefined },
): Promise<MonoweaveConfigFile | undefined> => {
    const configPath = configName ?? (await discoverDefaultConfigFile(cwd))
    if (!configPath) {
        // No config file found
        return undefined
    }

    try {
        const configId = await resolvePath(configPath, cwd)
        const fileConfig: unknown = await loadFile(configId)
        const presetPath: string | null =
            (preset ?? (fileConfig as MonoweaveConfigFile)?.preset) || null
        const presetConfig: unknown = await loadPresetConfig(presetPath, cwd)

        const config = merge(presetConfig, fileConfig)

        if (config) {
            // $schema may conflict with our own schema
            if ('$schema' in config) delete config.$schema
        }

        const validate = validateConfigFile()
        if (validate(config)) {
            return config
        }
        throw new Error(
            `Invalid configuration:\n${validate.errors?.map(
                (err) => `  ${err.schemaPath} ${err.message}`,
            )}\n`,
        )
    } catch (err) {
        if (err instanceof ResolveFailure && !configName) {
            // unable to find "default" config file, ignoring
            return undefined
        }

        /* istanbul ignore else */
        if (err instanceof Error && err?.message) {
            throw new Error(
                `Unable to parse monoweave config from '${configPath}'.\n\n${err.message}`,
            )
        }

        /* istanbul ignore next: this just surfaces the original error */
        throw err
    }
}

export default readConfigFile
