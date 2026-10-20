# 0001. Build and serve the game with Vite

- Date: 2026-03-25 (commit `0900ff4`)
- Status: Accepted

## Context

From May 2018 (`3b40f0e`), `npm start` ran gulp 3, whose only task started browser-sync on `app/`
and reloaded the page when an HTML or JS file changed. There was no build step. The browser
loaded the 10 JavaScript files of `app/js/` one by one as ES modules, unminified, and the CSS as
written. The `deploy` script published `app/` as it was with `gh-pages -d app`.

gulp 3 no longer starts on a current Node.js: on 59bf255 with Node.js 24.22.0, `gulp` stops with
`ReferenceError: primordials is not defined`, raised by the `graceful-fs` copy of `vinyl-fs`.

## Decision

Replace gulp and browser-sync with Vite, in commit `0900ff4`. `vite.config.js` sets `app/` as the
Vite root and `../dist` as the output, `pnpm start` runs the dev server with hot reload, and
`pnpm build` bundles and minifies the page into `dist/`.

## Alternatives considered

- **gulp 4**: it runs on current Node.js, but it only runs tasks. Bundling, minification and hashed
  file names would each need a plugin and a task to maintain.
- **webpack**: it bundles, but needs a configuration of its loaders and of its dev server for a
  page that Vite builds with a three-line configuration.
- **No tool, a static file server**: nothing to install, but no live reload, no minification and
  no hashed file names for a long browser cache.

## Consequences

Measured on 59bf255 (gulp, the last commit before the change) and c65212a (Vite 5.4.21, the same
day as the change), with the method of
[the evolution page](../evolution.md#how-the-figures-were-measured):

| Figure                         | Before: 59bf255, gulp 3                    | After: c65212a, Vite 5.4.21 |
| ------------------------------ | ------------------------------------------ | --------------------------- |
| Dev server start               | Not measured: gulp 3 fails on Node.js 24   | 104 ms (Vite's "ready in")  |
| Build, `pnpm build` wall clock | No build step                              | 0.46 s (Vite: 140 ms)       |
| JavaScript served, raw / gzip  | 21,340 B / 6,538 B in 10 files, unminified | 10,937 B / 3,543 B, 1 file  |
| CSS served, raw / gzip         | 4,730 B / 1,382 B                          | 4,063 B / 1,338 B           |

- The page loads one hashed JavaScript file and one hashed CSS file instead of 10 modules, so the
  host can cache `/assets/` for a year ([0005](0005-host-on-cloudflare-pages.md)).
- The deployment needs a build step: a workflow or a host that runs `pnpm build`.
- Vite was later upgraded from 5 to 8 in #34, without a change of tool.
