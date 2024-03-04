# Monoweave Node

This package exposes a Node API for Monoweave. It provides an alternative to the CLI.

## Installation

```sh
yarn add @monoweave/node
```

## Usage

```ts
import type { MonoweaveConfiguration }  from '@monoweave/types'
import monoweave from '@monoweave/node'

const config: MonoweaveConfiguration = {
    cwd: process.cwd(),
    dryRun: false,
    git: {
        baseBranch: 'main',
        commitSha: 'HEAD',
        remote: 'origin',
        push: true,
    },
    conventionalChangelogConfig: 'conventional-changelog-angular',
    access: 'public',
}
const changeset = await monoweave(config)
```
