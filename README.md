# Monoweave - Versioning, Changelogs, Publishing with Yarn

[![Continuous Integration](https://github.com/monoweave/monoweave/actions/workflows/pull-request.yml/badge.svg)](https://github.com/monoweave/monoweave/actions/workflows/pull-request.yml)
[![codecov](https://codecov.io/gh/monoweave/monoweave/branch/main/graph/badge.svg)](https://codecov.io/gh/monoweave/monoweave)
[![GitHub license](https://img.shields.io/github/license/monoweave/monoweave)](https://github.com/monoweave/monoweave/blob/main/LICENSE)
![node-current](https://img.shields.io/node/v/@monoweave/cli)
[![npm](https://img.shields.io/npm/v/@monoweave/cli.svg)](https://www.npmjs.com/package/@monoweave/cli)
[![npm downloads](https://img.shields.io/npm/dm/@monoweave/cli.svg)](https://npm-stat.com/charts.html?package=@monoweave/cli)
![Discord](https://discord.gg/Pjt46S85dw)

Monoweave is a tool for managing the versioning and publishing lifecycle of a Yarn-based monorepo.

There are a number of presets to choose from, and many aspects of monoweave can be customized. Out of the box, monoweave supports both an automatic mode that determines versioning from reading commit messages for modified files (via conventional commits), as well as a manual mode that puts the version determination in the hands of the developer (via changeset files).

See: [Monoweave Documentation](https://monoweave.github.io/monoweave/)

## Usage

It is recommended to follow the [Getting Started](https://monoweave.github.io/monoweave/getting-started/) guide in the monoweave documentation. In its simplest form to get started:

```sh
yarn add -D @monoweave/cli
```

and then in a `monoweave.config.yaml` file:

```yaml
preset: monoweave/preset-recommended # or preset-manual for changeset files
```

You can run: `yarn monoweave` locally to see a dry run of the changes that would be published.

If using GitHub Actions, also check out our release preview reusable action: [monoweave/github-action-preview@main](https://github.com/monoweave/github-action-preview).

## Monoweave vs. other popular tooling

Monoweave only supports [Yarn-modern](https://yarnpkg.com) projects with minimum Node version >=22 (lts/jod). Monoweave may work with older versions of Node, however these older versions are not tested.

| Tool | Package Managers | Monorepo Support | Conventional Commits | Changeset Files | Changelogs | publishConfig overrides | workspace:^ protocol | Version Groups | Pull Request Previews | GitHub Releases | Plugin Support |
| -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| [Monoweave](https://github.com/monoweave/monoweave) | yarn | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| [Lerna](https://github.com/lerna/lerna) | yarn, npm, pnpm | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | 🟨 | ❌ | ✅ | ❌ |
| [Lerna Lite](https://github.com/lerna-lite/lerna-lite) | yarn, npm, pnpm | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 🟨 | ❌ | ✅ | ❌ |
| [Yarn Version Plugin](https://yarnpkg.com/cli/version) | yarn | ✅ | ❌ | ✅ | ❌ | ✅  | ✅ | ❌ | ❌ | ❌ | ✅
| [Atlassian Changesets](https://github.com/changesets/changesets) | [yarn*](https://github.com/changesets/changesets/pull/674), npm, pnpm | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌
| [Microsoft Beachball](https://github.com/microsoft/beachball) | yarn, npm, pnpm | ✅ | ❌ |  ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌[*](https://github.com/microsoft/beachball/issues/885) | ❌
| [Semantic Release](https://github.com/semantic-release/semantic-release) | yarn, npm, pnpm | ❌ | ✅ | ❌ | ✅ | ✅ | N/A | N/A | ❌ | ✅ | ✅ |

> Legend: ✅ supported, 🟨 partial support, ❌ not supported

_If you notice an error or inaccuracy in the above comparison table, please open a GitHub issue. It's not possible to remove bias, however this should still be an accurate representation of how monoweave compares to other tooling._

**Feature definitions/notes:**

1. Package Managers: Monoweave only supports Yarn modern. Changesets partially supports Yarn modern since they don't use Yarn internally to publish so don't natively support Yarn workspace protocols (e.g. `workspace:^`).
2. Monorepo Support: Only semantic release in the above list doesn't support monorepos. All other tools, including monoweave, also support publishing a single non-monorepo package.
3. Conventional Commits: Monoweave, Lerna, and Semantic Release all support reading git commit messages according to [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) to determine the version strategy to apply. This behaviour can be disabled in monoweave, but is required for semantic release (Lerna does have a way to version from the command line to bypass commit messages).
4. Changeset Files: This is called "manual mode" in monoweave, and is a more explicit versioning approach compared to the conventional commits parsing above. Monoweave's changeset files are called "version files" and follow a format very similar to Changesets.
5. Changelogs: When using the conventional commits mode with Monoweave, changelogs are generated using [conventional changelogs](https://github.com/conventional-changelog/conventional-changelog), otherwise there's a default writer that pulls changelogs from manual version files.
6. publishConfig overrides: Monoweave uses Yarn publishing internally which will copy some fields from your package.json's publishConfig property. This enables a pattern of having "main" point to source code and "publishConfig.main" point to build artifacts.
7. workspace:^ protocol: Yarn supports listing workspace dependencies using `workspace:^` and `workspace:*`. This instructs Yarn to resolve the dependency to a local version instead of remote. Monoweave removes the workspace protocol during publish and respects the version range specifier (`^` and `*`).
8. Version Groups: Lerna offers a "fixed/locked" mode that ties all versions in a project together, however it's marked as "partial" in the table above since it doesn't offer granularity within a monorepo. Beachball calls this version groups.
9. Pull Request Previews: Monoweave has a [GitHub Action](https://github.com/monoweave/github-action-preview) for pull request previews. It can be adapted for other CI systems if there's demand.
10. GitHub Releases: Monoweave implements GitHub releases using the monoweave plugin system. We have some open issues tracking additional functionality for the plugin.
11. Plugin Support: Monoweave exposes [tappable](https://github.com/webpack/tapable) hooks, this is how the GitHub releases functionality is added. Since Monoweave uses Yarn internally, Yarn plugins can also be used to extend monoweave.

## Stability of Monoweave / Public API

Monoweave respects semantic versioning, however only the `@monoweave/cli` package is considered entirely "public". The other packages, e.g. `@monoweave/changelog` are internal and may have unexpected breaking changes if relied upon directly -- we try not to do so, however unlike the CLI, there's less testing of the interface.

In terms of stability and feature completeness, although this GitHub repository is fairly new, monoweave's roots extend from the monodeploy project which has been around for a few years. As can be seen by the above tool comparison table, Monoweave supports all the core features necessary to manage a project. There's always room for improvement though, and contributions are very much welcome.

## Contributing

See the [Contributing Guide](https://monoweave.github.io/monoweave/contributing) for setup instructions, tips, and guidelines.

## Contributors

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-16-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://noahnu.com/"><img src="https://avatars0.githubusercontent.com/u/1297096?v=4?s=50" width="50px;" alt="Noah"/><br /><sub><b>Noah</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=noahnu" title="Code">💻</a> <a href="#infra-noahnu" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.karnov.club/"><img src="https://avatars2.githubusercontent.com/u/6210361?v=4?s=50" width="50px;" alt="Marc Cataford"/><br /><sub><b>Marc Cataford</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=mcataford" title="Code">💻</a> <a href="#infra-mcataford" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fmal"><img src="https://avatars.githubusercontent.com/u/927591?v=4?s=50" width="50px;" alt="Filip Malinowski"/><br /><sub><b>Filip Malinowski</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=fmal" title="Code">💻</a> <a href="https://github.com/monoweave/monoweave/issues?q=author%3Afmal" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.ianmccaus.land"><img src="https://avatars.githubusercontent.com/u/20084398?v=4?s=50" width="50px;" alt="Ian McCausland"/><br /><sub><b>Ian McCausland</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=imccausl" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dbasilio"><img src="https://avatars.githubusercontent.com/u/8311284?v=4?s=50" width="50px;" alt="Daniel Basilio"/><br /><sub><b>Daniel Basilio</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/issues?q=author%3Adbasilio" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://msrose.github.io"><img src="https://avatars3.githubusercontent.com/u/3495264?v=4?s=50" width="50px;" alt="Michael Rose"/><br /><sub><b>Michael Rose</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=msrose" title="Code">💻</a> <a href="https://github.com/monoweave/monoweave/commits?author=msrose" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/thebrendan"><img src="https://avatars1.githubusercontent.com/u/48444889?v=4?s=50" width="50px;" alt="Brendan Hall-Hern"/><br /><sub><b>Brendan Hall-Hern</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=thebrendan" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://opensource.tophat.com"><img src="https://avatars0.githubusercontent.com/u/6020693?v=4?s=50" width="50px;" alt="Shouvik DCosta"/><br /><sub><b>Shouvik DCosta</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=sdcosta" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/maryampaz"><img src="https://avatars1.githubusercontent.com/u/30090413?v=4?s=50" width="50px;" alt="Maryam Pazirandeh"/><br /><sub><b>Maryam Pazirandeh</b></sub></a><br /><a href="#design-maryampaz" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jakebolam.com"><img src="https://avatars2.githubusercontent.com/u/3534236?v=4?s=50" width="50px;" alt="Jake Bolam"/><br /><sub><b>Jake Bolam</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=jakebolam" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://emmanuel.ogbizi.com"><img src="https://avatars0.githubusercontent.com/u/2528959?v=4?s=50" width="50px;" alt="Emmanuel Ogbizi"/><br /><sub><b>Emmanuel Ogbizi</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/pulls?q=is%3Apr+reviewed-by%3Aiamogbz" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lime-green"><img src="https://avatars0.githubusercontent.com/u/9436142?v=4?s=50" width="50px;" alt="Josh DM"/><br /><sub><b>Josh DM</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=lime-green" title="Code">💻</a> <a href="#infra-lime-green" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AnvarGazizovTH"><img src="https://avatars1.githubusercontent.com/u/69803154?v=4?s=50" width="50px;" alt="AnvarGazizovTH"/><br /><sub><b>AnvarGazizovTH</b></sub></a><br /><a href="#infra-AnvarGazizovTH" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#tool-AnvarGazizovTH" title="Tools">🔧</a> <a href="https://github.com/monoweave/monoweave/commits?author=AnvarGazizovTH" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/EdieLemoine"><img src="https://avatars.githubusercontent.com/u/3886637?v=4?s=50" width="50px;" alt="Edie Lemoine"/><br /><sub><b>Edie Lemoine</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=EdieLemoine" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://papooch.github.io/"><img src="https://avatars.githubusercontent.com/u/46406259?v=4?s=50" width="50px;" alt="Ondřej Švanda"/><br /><sub><b>Ondřej Švanda</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=Papooch" title="Code">💻</a> <a href="https://github.com/monoweave/monoweave/commits?author=Papooch" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://dra.pe"><img src="https://avatars.githubusercontent.com/u/539437?v=4?s=50" width="50px;" alt="Shawn Drape"/><br /><sub><b>Shawn Drape</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=shawndrape" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

---

> This project is a fork of [Monodeploy (licensed under Apache-2.0)](https://github.com/tophat/monodeploy) by the original core contributor of Monodeploy.
>
> Note that since this project has been forked from Monodeploy, the original authors of Monodeploy are listed in the contributors section for credit (though the git history wasn't maintained).
