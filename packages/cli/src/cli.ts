// https://github.com/arcanis/clipanion/issues/178
import clipanion = require('clipanion')

import { MonoweaveCommand } from './command/default'
import { MonoweaveVersionCommand } from './command/version'

const cli = new clipanion.Cli({
    binaryLabel: 'Monoweave',
    binaryName: 'yarn monoweave',
    binaryVersion: require('../package.json').version,
    enableCapture: true,
})

cli.register(MonoweaveCommand)
cli.register(MonoweaveVersionCommand)

export { cli }
