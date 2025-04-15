"use strict";(self.webpackChunk_monoweave_gatsby=self.webpackChunk_monoweave_gatsby||[]).push([[485],{5722:function(e,n,a){a.r(n);var t=a(6138),l=a(7402),o=a(3788);function r(e){const n=Object.assign({h2:"h2",a:"a",span:"span",p:"p",ul:"ul",li:"li",code:"code",pre:"pre",ol:"ol",h3:"h3",h4:"h4",em:"em"},(0,t.RP)(),e.components);return l.createElement(l.Fragment,null,l.createElement(n.h2,{id:"getting-started",style:{position:"relative"}},l.createElement(n.a,{href:"#getting-started","aria-label":"getting started permalink",className:"anchor before"},l.createElement(n.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"Getting Started"),"\n",l.createElement(n.p,null,"Monoweave supports projects with the following minimum requirements:"),"\n",l.createElement(n.ul,null,"\n",l.createElement(n.li,null,"Node v18.19.0+"),"\n",l.createElement(n.li,null,"Yarn Modern (v4.5.0+)"),"\n",l.createElement(n.li,null,"Git 2.13+"),"\n"),"\n",l.createElement(n.p,null,"Install ",l.createElement(n.code,null,"@monoweave/cli"),":"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-bash"},"yarn add -D @monoweave/cli\nyarn monoweave\n")),"\n",l.createElement(n.ol,null,"\n",l.createElement(n.li,null,"\n",l.createElement(n.p,null,"Edit your project's root ",l.createElement(n.code,null,"package.json"),' and set "workspaces": ["packages/*"] (you can use a different glob to match your monorepo layout).'),"\n"),"\n",l.createElement(n.li,null,"\n",l.createElement(n.p,null,"Create a ",l.createElement(n.code,null,"monoweave.config.yaml")," file and set it to:"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-yaml"},"preset: monoweave/preset-recommended # or preset-manual for changeset files\n")),"\n"),"\n"),"\n",l.createElement(n.p,null,"You'll be extending this file as you make changes to your project's publish configuration."),"\n",l.createElement(n.ol,{start:"3"},"\n",l.createElement(n.li,null,"\n",l.createElement(n.p,null,"If your packages require a compilation step (e.g. TypeScript, Babel), do this in a 'prepack' lifecycle hook per workspace. For more information about when prepack is called, ",l.createElement(n.a,{href:"https:/monoweave.github.io/monoweave/architecture#lifecycle-scripts"},"see Lifecycle Scripts"),"."),"\n"),"\n",l.createElement(n.li,null,"\n",l.createElement(n.p,null,"In CI, add a step:"),"\n"),"\n"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-sh"},"yarn monoweave\n")),"\n",l.createElement(n.p,null,"By default, monoweave will create a release commit, add tags, and push the commit to your git remote. To disable the auto push (for example, if you want to create a pull request instead):"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-sh"},"yarn monoweave --no-push\ngit push --tags\n")),"\n",l.createElement(n.ol,{start:"5"},"\n",l.createElement(n.li,null,"If using GitHub Actions, check out If using GitHub Actions, also check out our release preview reusable action: ",l.createElement(n.a,{href:"https://github.com/monoweave/github-action-preview"},"monoweave/github-action-preview@main")," to generate release previews on open pull requests."),"\n"),"\n",l.createElement(n.h3,{id:"api",style:{position:"relative"}},l.createElement(n.a,{href:"#api","aria-label":"api permalink",className:"anchor before"},l.createElement(n.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"API"),"\n",l.createElement(n.p,null,"Monoweave supports both a Command Line Interface, as well as a Node API. Explanation of configuration options can be found at ",l.createElement(n.a,{href:"https:/monoweave.github.io/monoweave/configuration"},"Configuration"),"."),"\n",l.createElement(n.h4,{id:"cli",style:{position:"relative"}},l.createElement(n.a,{href:"#cli","aria-label":"cli permalink",className:"anchor before"},l.createElement(n.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"CLI"),"\n",l.createElement(n.p,null,"For the CLI, use the ",l.createElement(n.code,null,"--help")," flag for a list of options."),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-bash"},"yarn monoweave --help\n")),"\n",l.createElement(n.p,null,"The CLI provides a few sensible defaults, however if using the Node API, you will have to provide all relevant information."),"\n",l.createElement(n.p,null,"You can also pass a ",l.createElement(n.code,null,"--config-file")," flag to load options from a configuration file. The file should export an object matching the MonoweaveConfigFile interface. CLI flags take precedence over the configuration file."),"\n",l.createElement(n.p,null,"Example config file (",l.createElement(n.code,null,"monoweave.config.js"),"):"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-js"},"module.exports = {\n    git: {\n        commitSha: 'HEAD',\n        remote: 'origin',\n        push: true,\n    },\n    conventionalChangelogConfig: 'conventional-changelog-angular',\n    access: 'infer',\n    persistVersions: false,\n    changesetIgnorePatterns: ['**/*.test.js'],\n}\n")),"\n",l.createElement(n.p,null,"or json/jsonc/json5/yml/yaml:"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-yaml"},'git:\n  commitSha: "HEAD"\n  remote: "origin"\n  push: true\nconventionalChangelogConfig: "conventional-changelog-angular"\naccess: "infer"\npersistVersions: false\nchangesetIgnorePatterns:\n  - "**/*.test.js"\n')),"\n",l.createElement(n.p,null,"For an experience closer to the Yarn version plugin, or Atlassian's Changesets project, use the manual preset:"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-js"},"module.exports = { preset: 'monoweave/preset-manual' }\n")),"\n",l.createElement(n.p,null,"and then commit change files generated via:"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-sh"},"yarn monoweave version\n")),"\n",l.createElement(n.p,null,"This will suggest packages to release. You can filter the selection by using one or more globs:"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-sh"},'yarn monoweave version "@my-scope/package-a" "@my-scope/package-*"\n')),"\n",l.createElement(n.p,null,"A non-interactive version is also supported:"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-sh"},'yarn monoweave version --no-interactive --strategy=minor --message="Some changelog entry" "@my-scope/package-a"\n')),"\n",l.createElement(n.p,null,"In this mode, you are choosing ",l.createElement(n.em,null,"not")," to use conventional changelogs."),"\n",l.createElement(n.h4,{id:"node-api",style:{position:"relative"}},l.createElement(n.a,{href:"#node-api","aria-label":"node api permalink",className:"anchor before"},l.createElement(n.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"Node API"),"\n",l.createElement(n.p,null,"To use the API:"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-ts"},"import type { MonoweaveConfiguration }  from '@monoweave/types'\nimport monoweave from '@monoweave/node'\n\nconst config: MonoweaveConfiguration = {\n    cwd: process.cwd(),\n    dryRun: false,\n    git: {\n        commitSha: 'HEAD',\n        remote: 'origin',\n        push: true,\n    },\n    conventionalChangelogConfig: 'conventional-changelog-angular',\n    access: 'infer',\n    persistVersions: false,\n}\nconst changeset = await monoweave(config)\n")),"\n",l.createElement(n.p,null,"Note that configuration presets are not supported when using the Node API."),"\n",l.createElement(n.h3,{id:"changelog",style:{position:"relative"}},l.createElement(n.a,{href:"#changelog","aria-label":"changelog permalink",className:"anchor before"},l.createElement(n.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"Changelog"),"\n",l.createElement(n.p,null,"The recommended preset will create changelog entries within each individual package folder. It is equivalent to adding the ",l.createElement(n.code,null,'--changelog-filename "<packageDir>/CHANGELOG.md"')," flag to the CLI. To aggregate changelog entries in a single changelog file, omit the ",l.createElement(n.code,null,"<packageDir>/")," variable."),"\n",l.createElement(n.p,null,"If adding monoweave to a project with existing changelogs, you'll need to add the a special marker to each changelog file to let monoweave know where to insert the changelog entries. For example:"),"\n",l.createElement(n.pre,null,l.createElement(n.code,{className:"language-md"},"# My Example Changelog\n\nSome blurb here.\n\n\x3c!-- MONOWEAVE:BELOW --\x3e\n\n## v1.0.0\n\nSome entry.\n")),"\n",l.createElement(n.p,null,"The marker ",l.createElement(n.code,null,"\x3c!-- MONOWEAVE:BELOW --\x3e")," must match exactly. It is whitespace and case-sensitive."),"\n",l.createElement(n.p,null,"Monoweave uses a simplistic built-in changelog configuration, if a conventional changelog config is not specified, however it is recommended to use a conventional changelog config if possible."))}n.default=function(e){return void 0===e&&(e={}),l.createElement(o.P,e,l.createElement(r,e))}}}]);
//# sourceMappingURL=component---src-pages-getting-started-mdx-950a7ec61f8d0449e27d.js.map