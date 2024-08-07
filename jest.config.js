// @ts-check

const CI = Boolean(process.env.CI)
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'artifacts'

/** @type {import('jest').Config} */
const config = {
    setupFiles: ['<rootDir>/testUtils/setup.ts'],

    collectCoverageFrom: ['packages/**/src/**/*.ts', '.yarn/__virtual__/**/packages/**/*.ts'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__mocks__/',
        '\\.test.ts$',
        '\\.mock.ts$',
        '<rootDir>\\/testUtils',
    ],
    watchPathIgnorePatterns: [
        '<rootDir>/example-monorepo',
        '<rootDir>/artifacts',
        '<rootDir>/packages/.*/lib',
        '<rootDir>/packages/.*/.*\\.js',
    ],
    transform: {
        '^.+\\.tsx?$': require.resolve('ts-jest'),
    },
    testPathIgnorePatterns: ['/node_modules/', '/.yarn/', '<rootDir>/.*\\.js', '<rootDir>/.*/lib/'],
    haste: {
        throwOnModuleCollision: true,
    },
    modulePathIgnorePatterns: ['<rootDir>/.*/lib'],
}

/** @type {import('jest').Config} */
const multiProject = {
    projects: [
        {
            ...config,
            displayName: 'E2E',
            testMatch: ['<rootDir>/e2e-tests/**/*.test.ts'],
            globalSetup: '<rootDir>/e2e-tests/globalSetup.ts',
        },
        {
            ...config,
            displayName: 'Unit/Integration',
            testMatch: ['<rootDir>/packages/**/*.test.ts'],
            globalSetup: '<rootDir>/jestGlobalSetup.ts',
        },
    ],
    testTimeout: 30000,
    reporters: CI
        ? [
              'default',
              [
                  'jest-junit',
                  {
                      suiteName: 'Jest Tests',
                      outputDirectory: `${ARTIFACT_DIR}/test_results/jest/`,
                      outputName: 'jest.junit.xml',
                  },
              ],
          ]
        : ['default'],
    watchPlugins: [require.resolve('jest-watch-select-projects')],
    coverageReporters: CI ? ['json'] : ['text', 'json'],
    coverageDirectory: 'raw-coverage/jest/',
    collectCoverage: CI,
}

module.exports = multiProject
