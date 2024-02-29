import path from 'path'

import type { MonoweaveConfiguration, YarnContext } from '@monoweave/types'
import { npath } from '@yarnpkg/fslib'

const getPackageJsonPaths = async (
    config: MonoweaveConfiguration,
    context: YarnContext,
): Promise<string[]> => {
    return [
        context.project.topLevelWorkspace.cwd,
        ...context.project.topLevelWorkspace.workspacesCwds,
    ].map((wCwd) => path.resolve(config.cwd, npath.fromPortablePath(wCwd), 'package.json'))
}

export default getPackageJsonPaths
