import { Cli } from 'clipanion'

import { MonoweaveCommand } from './command/default'
import { MonoweaveVersionCommand } from './command/version'

const cli = new Cli({
    binaryLabel: 'Monoweave',
    binaryName: 'yarn monoweave',
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    binaryVersion: require('../package.json').version,
    enableCapture: true,
})

cli.register(MonoweaveCommand)
cli.register(MonoweaveVersionCommand)

export { cli }
