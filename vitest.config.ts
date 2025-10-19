import { createRequire } from 'node:module'

import { type TestProjectInlineConfiguration, defineConfig } from 'vitest/config'

const require = createRequire(import.meta.url)

const CI = Boolean(process.env.CI)
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'artifacts'

const sharedTestConfig: TestProjectInlineConfiguration['test'] = {
    setupFiles: ['./testUtils/setup.ts'],
    environment: 'node',
    exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
        '**/lib/**',
        '**/.yarn/**',
    ],
    testTimeout: 30_000,
    sequence: {
        hooks: 'list',
    },
}

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    ...sharedTestConfig,
                    name: 'E2E',
                    include: ['e2e-tests/**/*.test.{ts,mts,cts}'],
                    globalSetup: 'e2e-tests/globalSetup.ts',
                    testTimeout: 300_000,
                },
            },
            {
                test: {
                    ...sharedTestConfig,
                    name: 'Unit/Integration',
                    include: ['packages/**/*.test.{ts,mts,cts}'],
                    globalSetup: 'testUtils/globalSetup.ts',
                    alias: {
                        // This ensures the plugin-npm mock works
                        '@yarnpkg/plugin-npm': require.resolve('@yarnpkg/plugin-npm'),
                    },
                },
            },
        ],
        outputFile: `${ARTIFACT_DIR}/test_results/vitest/junit.xml`,
        coverage: {
            enabled: CI,
            include: [
                'packages/**/src/**/*.{ts,mts,cts}',
                '.yarn/__virtual__/**/packages/**/*.{ts,mts,cts}',
            ],
            exclude: [
                '**/node_modules/**',
                '**/__mocks__/**',
                '**/*.test.{ts,mts,cts}',
                '**/*.mock.{ts,mts,cts}',
                '**/testUtils/**',
            ],
            reportsDirectory: './raw-coverage/vitest',
            reporter: CI ? ['json'] : ['text', 'json'],
        },
    },
})
