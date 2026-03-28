const base = require('@noahnu/eslint-config/base')
const vitest = require('@vitest/eslint-plugin')
const globals = require('globals')

/**
 * @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray}
 */
const config = [
    ...base,
    {
        plugins: { vitest },
        rules: {
            ...vitest.configs.recommended.rules,
            'vitest/prefer-called-exactly-once-with': 'off',
            'vitest/no-focused-tests': 'error',
        },
        files: ['**/*.test.{ts,mts,cts}'],
    },
    {
        languageOptions: {
            parserOptions: { projectService: true, tsconfigRootDir: __dirname },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        ignores: [
            '**/.*',
            'packages/**/*.js',
            '**/lib',
            'artifacts',
            'coverage',
            'docs-site/build',
            'docs-site/api',
        ],
    },
    {
        files: ['docs-site/src/**/*.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            // @docusaurus/* are virtual modules resolved by Docusaurus's webpack config,
            // not by Node module resolution, so the import resolver cannot find them.
            'import-x/no-unresolved': ['error', { ignore: ['^@docusaurus/'] }],
        },
    },
]

module.exports = config
