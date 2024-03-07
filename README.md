# monoweave

> 📢 This project is a fork of [Monodeploy (licensed under Apache-2.0)](https://github.com/tophat/monodeploy).
>
> Although this project is starting as a fork, the plan is to refactor/rewrite most of the code. The core maintainer of monoweave is the original core contributor of Monodeploy. Since the project has been forked, we're resetting the version numbers of all the packages and starting in a pre-v1 state as refactor is underway.

[![Continuous Integration](https://github.com/monoweave/monoweave/actions/workflows/pull-request.yml/badge.svg)](https://github.com/monoweave/monoweave/actions/workflows/pull-request.yml)
[![codecov](https://codecov.io/gh/monoweave/monoweave/branch/main/graph/badge.svg)](https://codecov.io/gh/monoweave/monoweave)
[![GitHub license](https://img.shields.io/github/license/monoweave/monoweave)](https://github.com/monoweave/monoweave/blob/main/LICENSE)
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-16-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

![node-current](https://img.shields.io/node/v/@monoweave/cli)
[![npm](https://img.shields.io/npm/v/@monoweave/cli.svg)](https://www.npmjs.com/package/@monoweave/cli)
[![npm downloads](https://img.shields.io/npm/dm/monoweave.svg)](https://npm-stat.com/charts.html?package=@monoweave/cli)


Monoweave is a powerful tool which aims to simplify the package publishing process for monorepos. It leverages [Yarn Modern workspaces](https://yarnpkg.com/features/workspaces) to do the heavy lifting, and is a direct replacement for tools such as [Lerna](https://github.com/lerna/lerna) and [Semantic Release](https://github.com/semantic-release/semantic-release).

Monoweave only supports projects using Yarn Modern v4+ with the minimum node version set to Node v18.19.0.

Please see the [Monoweave Website](https://monoweave.github.io/monoweave/) for information on how to get started with Monoweave.

### Note About Monoweave Package Versioning

Only the `@monoweave/cli` package is "public" and follows strict semantic versioning. The other packages such as `@monoweave/changelog` are meant for internal use and may change their APIs at any time.

## Contributing

See the [Contributing Guide](https://monoweave.github.io/monoweave/contributing) for setup instructions, tips, and guidelines.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://msrose.github.io"><img src="https://avatars3.githubusercontent.com/u/3495264?v=4?s=100" width="100px;" alt="Michael Rose"/><br /><sub><b>Michael Rose</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=msrose" title="Code">💻</a> <a href="https://github.com/monoweave/monoweave/commits?author=msrose" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/thebrendan"><img src="https://avatars1.githubusercontent.com/u/48444889?v=4?s=100" width="100px;" alt="Brendan Hall-Hern"/><br /><sub><b>Brendan Hall-Hern</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=thebrendan" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://opensource.tophat.com"><img src="https://avatars0.githubusercontent.com/u/6020693?v=4?s=100" width="100px;" alt="Shouvik DCosta"/><br /><sub><b>Shouvik DCosta</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=sdcosta" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/maryampaz"><img src="https://avatars1.githubusercontent.com/u/30090413?v=4?s=100" width="100px;" alt="Maryam Pazirandeh"/><br /><sub><b>Maryam Pazirandeh</b></sub></a><br /><a href="#design-maryampaz" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jakebolam.com"><img src="https://avatars2.githubusercontent.com/u/3534236?v=4?s=100" width="100px;" alt="Jake Bolam"/><br /><sub><b>Jake Bolam</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=jakebolam" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://emmanuel.ogbizi.com"><img src="https://avatars0.githubusercontent.com/u/2528959?v=4?s=100" width="100px;" alt="Emmanuel Ogbizi"/><br /><sub><b>Emmanuel Ogbizi</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/pulls?q=is%3Apr+reviewed-by%3Aiamogbz" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lime-green"><img src="https://avatars0.githubusercontent.com/u/9436142?v=4?s=100" width="100px;" alt="Josh DM"/><br /><sub><b>Josh DM</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=lime-green" title="Code">💻</a> <a href="#infra-lime-green" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AnvarGazizovTH"><img src="https://avatars1.githubusercontent.com/u/69803154?v=4?s=100" width="100px;" alt="AnvarGazizovTH"/><br /><sub><b>AnvarGazizovTH</b></sub></a><br /><a href="#infra-AnvarGazizovTH" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#tool-AnvarGazizovTH" title="Tools">🔧</a> <a href="https://github.com/monoweave/monoweave/commits?author=AnvarGazizovTH" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://noahnu.com/"><img src="https://avatars0.githubusercontent.com/u/1297096?v=4?s=100" width="100px;" alt="Noah"/><br /><sub><b>Noah</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=noahnu" title="Code">💻</a> <a href="#infra-noahnu" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.karnov.club/"><img src="https://avatars2.githubusercontent.com/u/6210361?v=4?s=100" width="100px;" alt="Marc Cataford"/><br /><sub><b>Marc Cataford</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=mcataford" title="Code">💻</a> <a href="#infra-mcataford" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fmal"><img src="https://avatars.githubusercontent.com/u/927591?v=4?s=100" width="100px;" alt="Filip Malinowski"/><br /><sub><b>Filip Malinowski</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=fmal" title="Code">💻</a> <a href="https://github.com/monoweave/monoweave/issues?q=author%3Afmal" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.ianmccaus.land"><img src="https://avatars.githubusercontent.com/u/20084398?v=4?s=100" width="100px;" alt="Ian McCausland"/><br /><sub><b>Ian McCausland</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=imccausl" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/EdieLemoine"><img src="https://avatars.githubusercontent.com/u/3886637?v=4?s=100" width="100px;" alt="Edie Lemoine"/><br /><sub><b>Edie Lemoine</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=EdieLemoine" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dbasilio"><img src="https://avatars.githubusercontent.com/u/8311284?v=4?s=100" width="100px;" alt="Daniel Basilio"/><br /><sub><b>Daniel Basilio</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/issues?q=author%3Adbasilio" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://papooch.github.io/"><img src="https://avatars.githubusercontent.com/u/46406259?v=4?s=100" width="100px;" alt="Ondřej Švanda"/><br /><sub><b>Ondřej Švanda</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=Papooch" title="Code">💻</a> <a href="https://github.com/monoweave/monoweave/commits?author=Papooch" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://dra.pe"><img src="https://avatars.githubusercontent.com/u/539437?v=4?s=100" width="100px;" alt="Shawn Drape"/><br /><sub><b>Shawn Drape</b></sub></a><br /><a href="https://github.com/monoweave/monoweave/commits?author=shawndrape" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
