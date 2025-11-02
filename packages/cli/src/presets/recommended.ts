import type { MonoweaveConfigFile } from '@monoweave/types'

const ConfigRecommended: MonoweaveConfigFile = {
    commitIgnorePatterns: ['\\[skip-ci\\]'],
    changesetIgnorePatterns: [
        // Common conventions for test files
        '**/__tests__',
        '**/__test__',
        '**/*.test.*',
        '**/*.spec.*',
        // vitest snapshots
        '**/*.snap',
        // READMEs
        '**/*.md',
        '**/*.mdx',
    ],
    changelogFilename: '<packageDir>/CHANGELOG.md',
}

export default ConfigRecommended
