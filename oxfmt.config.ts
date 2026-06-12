import { defineConfig } from 'oxfmt'

export default defineConfig({
  singleQuote: true,
  semi: false,
  sortPackageJson: false,
  ignorePatterns: [
    '**/.*',
    'packages/**/*.js',
    '**/lib',
    'artifacts',
    'coverage',
    'docs-site/build',
    'docs-site/api',
    '.yarn',
  ],
})
