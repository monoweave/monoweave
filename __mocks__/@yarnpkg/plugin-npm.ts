/* eslint-disable @typescript-eslint/no-unused-vars */
import { createRequire } from 'node:module'

import {
    type Configuration,
    type Ident,
    MessageName,
    ReportError,
    structUtils,
} from '@yarnpkg/core'

const require = createRequire(import.meta.url)

const _registry: { tags: Record<string, Record<string, string | string[]>> } = {
    tags: {},
}

const _reset_ = (): void => {
    _registry.tags = {}
}

const _setTag_ = (pkgName: string, tagValue: string | string[], tagKey = 'latest'): void => {
    _registry.tags[pkgName] = { ..._registry.tags[pkgName], [tagKey]: tagValue }
}

const npmHttpUtilsGet = (
    distTagUrl: string,
    { ident, registry }: { ident: Ident; registry: string },
): Record<string, string | string[]> => {
    const pkgName = structUtils.stringifyIdent(ident)
    const tags = _registry.tags[pkgName]
    if (!tags) {
        throw new ReportError(MessageName.AUTHENTICATION_INVALID, `Cannot access ${pkgName}`)
    }
    return tags
}

const npmHttpUtilsPut = (
    identUrl: string,
    body: Record<string, string>,
    configuration: Configuration,
) => {
    const pkgName = body.name
    for (const [key, version] of Object.entries(body['dist-tags'])) {
        _setTag_(pkgName, version as string, key)
    }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const actualModule = require('@yarnpkg/plugin-npm') as typeof import('@yarnpkg/plugin-npm')

const npmHttpUtils: unknown = {
    ...actualModule.npmHttpUtils,
    get: npmHttpUtilsGet,
    put: npmHttpUtilsPut,
}

const npmPublishUtils = { ...actualModule.npmPublishUtils }

const npmConfigUtils: unknown = actualModule.npmConfigUtils

export { npmHttpUtils, npmPublishUtils, npmConfigUtils, _reset_, _setTag_ }
