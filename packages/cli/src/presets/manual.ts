import type { MonoweaveConfigFile } from '@monoweave/types'

import ConfigRecommended from '@monoweave/cli/preset-recommended'

const ConfigManual: MonoweaveConfigFile = {
    ...ConfigRecommended,
    conventionalChangelogConfig: false,
}

export default ConfigManual
