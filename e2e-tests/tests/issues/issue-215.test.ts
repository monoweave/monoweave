import { RegistryMode } from '@monoweave/types'
import { describe, expect, it } from 'vitest'

import { conventionalChangelogConfig } from '#helpers/conventionalChangelogConfig'
import setupProject from '#helpers/setupProject'

// https://github.com/monoweave/monoweave/issues/215
describe('Issue #215', () => {
  it('replaces catalog protocol ranges on publish and preserves them on disk', async () => {
    await using testContext = await setupProject({
      repository: [
        {
          'pkg-1': {
            dependencies: [
              ['pkg-2', 'catalog:'],
              ['pkg-3', 'catalog:utils'],
            ],
          },
          'pkg-2': {},
          'pkg-3': {},
        },
        {
          nodeLinker: 'node-modules',
          catalog: { 'pkg-2': '^0.0.0' },
          catalogs: { utils: { 'pkg-3': '^0.0.0' } },
        },
      ],
      config: {
        access: 'public',
        changelogFilename: 'changelog.md',
        changesetFilename: 'changes.json.tmp',
        dryRun: false,
        autoCommit: true,
        autoCommitMessage: 'chore: release',
        conventionalChangelogConfig,
        git: {
          push: true,
          remote: 'origin',
          tag: true,
        },
        jobs: 1,
        persistVersions: true,
        registryMode: RegistryMode.NPM,
        topological: true,
        topologicalDev: true,
        maxConcurrentReads: 1,
        maxConcurrentWrites: 1,
      },
    })

    const { run, exec, writeFile } = testContext

    await writeFile('packages/pkg-1/README.md', 'Modification.')
    await exec('git add . && git commit -n -m "feat: some fancy addition" && git push')

    const { error } = await run()
    if (error) console.error(error)
    expect(error).toBeUndefined()

    const pkg1Manifest = JSON.parse(
      (await exec('git cat-file blob origin/main:packages/pkg-1/package.json')).stdout.toString(),
    )
    expect(pkg1Manifest.dependencies).toEqual({
      'pkg-2': 'catalog:',
      'pkg-3': 'catalog:utils',
    })

    const npmInfo = JSON.parse(
      (await exec('yarn npm info pkg-1 --fields dependencies --json')).stdout.toString(),
    )
    expect(npmInfo.dependencies).toEqual({
      'pkg-2': '^0.0.0',
      'pkg-3': '^0.0.0',
    })
  })
})
