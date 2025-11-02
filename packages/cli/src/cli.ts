import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// https://github.com/arcanis/clipanion/issues/178
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const clipanion = require('clipanion') as typeof import('clipanion')

import { MonoweaveCommand } from './command/default.js'
import { MonoweaveVersionCommand } from './command/version.js'

const cli = new clipanion.Cli({
    binaryLabel: 'Monoweave',
    binaryName: 'yarn monoweave',
    binaryVersion: require('../package.json').version,
    enableCapture: true,
})

cli.register(MonoweaveCommand)
cli.register(MonoweaveVersionCommand)

export { cli }
