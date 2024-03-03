import type { MonoweaveConfigFile } from '@monoweave/types'

const ConfigRecommended: MonoweaveConfigFile = {
    commitIgnorePatterns: ['\\[skip-ci\\]'],
    changesetIgnorePatterns: [
        // Common conventions for test files
        '**/__tests__',
        '**/*.test.*',
        // Jest snapshots
        '**/*.snap',
    ],
    changelogFilename: '<packageDir>/CHANGELOG.md',
}

export = ConfigRecommended
