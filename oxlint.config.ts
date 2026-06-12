import { defineConfig } from 'oxlint'

export default defineConfig({
  options: {
    typeAware: true,
  },
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'vitest'],
  categories: {
    correctness: 'error',
  },
  ignorePatterns: [
    '**/.*',
    'packages/**/*.js',
    '**/lib',
    'artifacts',
    'coverage',
    'docs-site/build',
    'docs-site/api',
  ],
  rules: {
    'no-redundant-type-constituents': 'off',
    'no-misused-spread': 'off',
    'warn-todo': 'off',
    'vitest/require-to-throw-message': 'off',
  },
  overrides: [
    {
      files: ['docs-site/tsconfig.json'],
      rules: {},
    },
    {
      files: ['*.test.ts'],
      rules: {
        'no-meaningless-void-operator': 'off',
        'vitest/expect-expect': [
          'error',
          {
            assertFunctionNames: [
              'expect',
              'expectTypeOf',
              'assert',
              'assertType',
              'expectOrdering',
            ],
          },
        ],
      },
    },
  ],
}) as ReturnType<typeof defineConfig>
