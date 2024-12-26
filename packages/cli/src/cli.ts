import { Cli } from 'clipanion'

import { MonoweaveCommand } from './command/default'
import { MonoweaveVersionCommand } from './command/version'

const cli = new Cli({
    binaryLabel: 'Monoweave',
    binaryName: 'yarn monoweave',
    binaryVersion: require('../package.json').version,
    enableCapture: true,
})

cli.register(MonoweaveCommand)
cli.register(MonoweaveVersionCommand)

export { cli }
