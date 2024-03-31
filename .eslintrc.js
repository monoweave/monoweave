module.exports = {
    root: true,
    extends: ['@noahnu/eslint-config'],
    parserOptions: {
        project: './tsconfig.eslint.json',
    },
    rules: {
        'jest/no-standalone-expect': ['error', { additionalTestBlockFunctions: ['itIf'] }],
    },
    ignorePatterns: ['**/.*', 'packages/**/*.js', '**/lib', 'gatsby/public'],
}
