import type { MonoweaveConfigFile } from '@monoweave/types'

const ConfigRecommended: MonoweaveConfigFile = {
    persistVersions: true,
    autoCommit: true,
    git: {
        push: true,
    },
    commitIgnorePatterns: ['\\[skip-ci\\]'],
    changesetIgnorePatterns: ['**/*.test.*'],
}

export = ConfigRecommended
