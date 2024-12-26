const eslintConfig = require('@noahnu/eslint-config')
const globals = require('globals')

/**
 * @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray}
 */
const config = [
    ...eslintConfig,
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
