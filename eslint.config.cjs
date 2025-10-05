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
            parserOptions: { project: './tsconfig.eslint.json', tsconfigRootDir: __dirname },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    { ignores: ['**/.*', 'packages/**/*.js', '**/lib', 'gatsby/public', 'artifacts', 'coverage'] },
    {
        files: ['gatsby/src/**/*.{ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
]

module.exports = config
