"use strict";(self.webpackChunk_monoweave_gatsby=self.webpackChunk_monoweave_gatsby||[]).push([[601],{2470:function(e,a,t){t.r(a);var n=t(6138),o=t(7402),r=t(3788);function l(e){const a=Object.assign({h2:"h2",a:"a",span:"span",img:"img",p:"p",pre:"pre",code:"code",h3:"h3"},(0,n.RP)(),e.components);return o.createElement(o.Fragment,null,o.createElement(a.h2,{id:"what-is-monoweave",style:{position:"relative"}},o.createElement(a.a,{href:"#what-is-monoweave","aria-label":"what is monoweave permalink",className:"anchor before"},o.createElement(a.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"What is Monoweave?"),"\n",o.createElement(a.a,{href:"https://github.com/monoweave/monoweave/actions/workflows/pull-request.yml"},o.createElement(a.img,{src:"https://github.com/monoweave/monoweave/actions/workflows/pull-request.yml/badge.svg",alt:"Continuous Integration"})),"\n","\n","\n",o.createElement(a.a,{href:"https://codecov.io/gh/monoweave/monoweave"},o.createElement(a.img,{src:"https://codecov.io/gh/monoweave/monoweave/branch/main/graph/badge.svg",alt:"codecov"})),"\n","\n","\n",o.createElement(a.a,{href:"https://github.com/monoweave/monoweave/blob/main/LICENSE"},o.createElement(a.img,{src:"https://img.shields.io/github/license/monoweave/monoweave",alt:"GitHub license"})),"\n","\n","\n",o.createElement(a.img,{src:"https://img.shields.io/node/v/@monoweave/cli",alt:"node-current"}),"\n","\n","\n",o.createElement(a.a,{href:"https://www.npmjs.com/package/@monoweave/cli"},o.createElement(a.img,{src:"https://img.shields.io/npm/v/@monoweave/cli.svg",alt:"npm"})),"\n","\n","\n",o.createElement(a.a,{href:"https://npm-stat.com/charts.html?package=@monoweave/cli"},o.createElement(a.img,{src:"https://img.shields.io/npm/dm/monoweave.svg",alt:"npm downloads"})),"\n","\n","\n",o.createElement(a.img,{src:"https://img.shields.io/discord/1253743105249902744",alt:"Discord"}),"\n",o.createElement(a.p,null,"Monoweave is a powerful tool which aims to simplify the package publishing process for monorepos. It leverages ",o.createElement(a.a,{href:"https://yarnpkg.com/features/workspaces"},"Yarn Modern workspaces")," to do the heavy lifting, and is a direct replacement for tools such as ",o.createElement(a.a,{href:"https://github.com/lerna/lerna"},"Lerna")," and ",o.createElement(a.a,{href:"https://github.com/semantic-release/semantic-release"},"Semantic Release"),"."),"\n",o.createElement(a.p,null,"Monoweave only supports projects using Yarn Modern with the minimum node version set to Node v18."),"\n",o.createElement(a.h2,{id:"usage",style:{position:"relative"}},o.createElement(a.a,{href:"#usage","aria-label":"usage permalink",className:"anchor before"},o.createElement(a.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"Usage"),"\n",o.createElement(a.pre,null,o.createElement(a.code,{className:"language-bash"},"yarn add -D @monoweave/cli\nyarn monoweave\n")),"\n",o.createElement(a.p,null,"Although we don't recommend it in production, you can use monoweave directly from the git repository:"),"\n",o.createElement(a.pre,null,o.createElement(a.code,{className:"language-bash"},"yarn add -D @monoweave/cli@monoweave/monoweave#workspace=@monoweave/cli\n")),"\n",o.createElement(a.h2,{id:"getting-started",style:{position:"relative"}},o.createElement(a.a,{href:"#getting-started","aria-label":"getting started permalink",className:"anchor before"},o.createElement(a.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"Getting Started"),"\n",o.createElement(a.p,null,"Please see the ",o.createElement(a.a,{href:"./getting-started"},"Getting Started Guide"),"."),"\n",o.createElement(a.p,null,"You can also check out the ",o.createElement(a.a,{href:"./faq"},"Frequently Asked Questions")," for some information around dealing with various edge cases and more advanced configuration."),"\n",o.createElement(a.h2,{id:"configuration",style:{position:"relative"}},o.createElement(a.a,{href:"#configuration","aria-label":"configuration permalink",className:"anchor before"},o.createElement(a.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"Configuration"),"\n",o.createElement(a.p,null,"For information on how to fine-tune Monoweave, see ",o.createElement(a.a,{href:"./configuration"},"Configuration"),"."),"\n",o.createElement(a.p,null,"For available plugins, as well as plugin development, see ",o.createElement(a.a,{href:"./plugins"},"Plugins"),"."),"\n",o.createElement(a.h3,{id:"note-about-monoweave-package-versioning",style:{position:"relative"}},o.createElement(a.a,{href:"#note-about-monoweave-package-versioning","aria-label":"note about monoweave package versioning permalink",className:"anchor before"},o.createElement(a.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"Note About Monoweave Package Versioning"),"\n",o.createElement(a.p,null,"Only the ",o.createElement(a.code,null,"monoweave"),' package is "public" and follows strict semantic versioning. The other packages such as ',o.createElement(a.code,null,"@monoweave/changelog")," are meant for internal use and may change their APIs at any time."),"\n",o.createElement(a.h2,{id:"contributing",style:{position:"relative"}},o.createElement(a.a,{href:"#contributing","aria-label":"contributing permalink",className:"anchor before"},o.createElement(a.span,{dangerouslySetInnerHTML:{__html:'<svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>'}})),"Contributing"),"\n",o.createElement(a.p,null,"Please give the ",o.createElement(a.a,{href:"./architecture"},"Architecture")," page a read and then check out the ",o.createElement(a.a,{href:"./contributing"},"Contributing Guide"),"."))}a.default=function(e){return void 0===e&&(e={}),o.createElement(r.P,e,o.createElement(l,e))}}}]);
//# sourceMappingURL=component---src-pages-index-mdx-aa51a1936e96e1100b19.js.map