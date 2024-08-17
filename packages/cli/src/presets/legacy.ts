import type { MonoweaveConfigFile } from '@monoweave/types'

const ConfigRecommended: MonoweaveConfigFile = {
    persistVersions: false,
    autoCommit: false,
    git: {
        push: false,
    },
    commitIgnorePatterns: ['\\[skip-ci\\]'],
    changesetIgnorePatterns: ['**/__tests__', '**/*.test.*'],
}

export default ConfigRecommended
