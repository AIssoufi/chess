# Evolution

The tools and the architecture of the game, era by era, oldest first. Each change of tool or of
architecture has its decision record in [`decisions/`](decisions/).

## May 2018: gulp, Mocha and a board held in the DOM

The first commit (`d1d7b71`) was a static page: `index.html`, one script and the styles, with no
`package.json`. Within the month the project gained:

- npm, with gulp, browser-sync, Mocha and `gh-pages` in `dependencies` and Babel in
  `devDependencies`;
- gulp 3 running browser-sync on `app/`, which reloaded the page on each change, without a build
  step;
- Mocha 5 with Babel 6 (`babel-register`, `babel-polyfill`, the `env` preset) to load the ES
  modules, and `mocha-jsdom`, added then removed the same day;
- `Plateau.js`, which kept the state of the game in the DOM: piece nodes, CSS classes and `data-`
  attributes;
- a `deploy` script that pushed `app/` to GitHub Pages with the `gh-pages` package.

The 3 tests had empty bodies and imported no game code: the rules needed a document to run.

| Figure                         | Before: `d1d7b71`, 2018-05-04 | After: `2839551`, 2018-05-15                    |
| ------------------------------ | ----------------------------- | ----------------------------------------------- |
| Direct dependencies            | 0, no `package.json`          | 8                                               |
| Install without `node_modules` | No install step               | 7.89 s (`npm ci`)                               |
| Dev server                     | None                          | Not measured: gulp 3 fails on Node.js 24        |
| Build                          | None                          | None, `app/` is served as it is                 |
| Tests                          | None                          | 3 with empty bodies, 0.65 s                     |
| JavaScript served, raw / gzip  | 544 B / 284 B, 1 file         | 21,340 B / 6,538 B, 10 files                    |
| CSS served, raw / gzip         | 1,854 B / 553 B               | 4,730 B / 1,382 B                               |
| Audit advisories               | None                          | 224 (64 critical, 125 high, 30 moderate, 5 low) |

## December 2019: a dependency bump, then a pause

Dependabot bumped the `npm` package, listed as a dependency, from 6.0.0 to 6.13.4 (#2). The
project then had no commit until March 2026. By then gulp 3 no longer ran on a current Node.js, and
the rules still had no test.

| Figure                         | Before: `2839551`, 2018-05-15                   | After: `59bf255`, 2019-12-28                    |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| Direct dependencies            | 8                                               | 8                                               |
| Install without `node_modules` | 7.89 s (`npm ci`)                               | 5.18 s (`npm ci`)                               |
| Tests                          | 3 with empty bodies, 0.65 s                     | 3 with empty bodies, 0.60 s                     |
| Audit advisories               | 224 (64 critical, 125 high, 30 moderate, 5 low) | 181 (47 critical, 100 high, 29 moderate, 5 low) |

## March 2026: Vite, Vitest, pnpm and a board model

One commit (`0900ff4`, 25 files, +3,648 / -9,039 lines) replaced the whole stack: Vite builds and
serves the page, Vitest runs the tests, pnpm installs the packages, and `Echiquier.js` holds the
board and the full rules without DOM. Prettier, Husky and commitlint came in the same commit. A
GitHub Actions workflow then built the game on each push and published it to GitHub Pages under
`/chess/` (`1fc4c4a`, `c65212a`). The next step came because the site could not take a root
domain, custom headers or a preview per branch, and nothing checked a change before `master`.

| Figure                         | Before: `59bf255`, gulp, Mocha, npm      | After: `c65212a`, Vite 5, Vitest 2, pnpm |
| ------------------------------ | ---------------------------------------- | ---------------------------------------- |
| Direct dependencies            | 8                                        | 7                                        |
| Install without `node_modules` | 5.18 s (`npm ci`)                        | 0.87 s                                   |
| Lockfile lines                 | 8,395                                    | 1,826                                    |
| Dev server start               | Not measured: gulp 3 fails on Node.js 24 | 104 ms (Vite's "ready in")               |
| Build, wall clock              | No build step                            | 0.46 s (Vite: 140 ms)                    |
| Tests                          | 3 with empty bodies, 0.60 s              | 25 in 1 file, 1.18 s                     |
| JavaScript served, raw / gzip  | 21,340 B / 6,538 B, 10 files             | 10,937 B / 3,543 B, 1 file               |
| CSS served, raw / gzip         | 4,730 B / 1,382 B                        | 4,063 B / 1,338 B                        |
| Audit advisories               | 181                                      | 30 (3 critical, 18 high, 9 moderate)     |
| Deploy                         | By hand, `npm run deploy`                | 39 s, GitHub Actions run 23566193547     |

Decisions:

- [0001. Build and serve the game with Vite](decisions/0001-build-with-vite.md)
- [0002. Run the tests with Vitest](decisions/0002-test-with-vitest.md)
- [0003. Keep the board state in a model without DOM](decisions/0003-keep-the-board-state-in-a-model.md)
- [0004. Manage the packages with pnpm](decisions/0004-manage-packages-with-pnpm.md)

## October 2026: pinned toolchain, CI and Cloudflare Pages

#18 pinned pnpm 12.14.0 (`packageManager`) and Node.js 24 (`.nvmrc`), moved the build allowlist
to `pnpm-workspace.yaml`, and added a CI that runs the Prettier check, the tests and the build on
each pull request. #28 moved the hosting to Cloudflare Pages at `https://chess.issoufi.fr`, with a
preview per branch, and turned GitHub Pages into a redirect. Later pull requests checked the
commit messages (#31), upgraded Vite to 8 and Vitest to 5 (#34), added Dependabot (#36) and
tested the UI controller in happy-dom (#39). The next step came because no tool checked the code
beyond its formatting.

| Figure                         | Before: `c65212a`, GitHub Pages | After: `7d734a8`, Cloudflare Pages      |
| ------------------------------ | ------------------------------- | --------------------------------------- |
| Direct dependencies            | 7                               | 11                                      |
| Install without `node_modules` | 0.87 s                          | 0.66 s                                  |
| Lockfile lines                 | 1,826                           | 1,615                                   |
| Dev server start               | 104 ms (Vite 5)                 | 89 ms (Vite 8)                          |
| Build, wall clock              | 0.46 s (Vite: 140 ms)           | 0.33 s (Vite: 77 ms)                    |
| Tests                          | 25 in 1 file, 1.18 s            | 196 in 7 files, 7.42 s (5.53 to 10.18)  |
| JavaScript served, raw / gzip  | 10,937 B / 3,543 B              | 11,150 B / 3,603 B                      |
| CSS served, raw / gzip         | 4,063 B / 1,338 B               | 5,129 B / 1,661 B                       |
| Audit advisories               | 30                              | 0                                       |
| `cache-control` of JavaScript  | `max-age=600`, on the redirect  | `public, max-age=31536000, immutable`   |
| Checks on a pull request       | None                            | Prettier, tests, build, commit messages |

The test suite grew from 25 to 196 tests, among them the tests of the commit message hook, which
run Git in temporary repositories.

#34 measured its own step, Vite 5.4.21 to 8.3.4 and Vitest 2.1.9 to 5.0.5, on 5865d1b and
b1f9633: `pnpm audit` from 17 advisories to 0, Vite's "built in" from 109 ms to 49 ms, the dev
server's "ready in" from 104 ms to 81 ms, the JavaScript from 11,206 B / 3,696 B to
10,903 B / 3,527 B. It is a version upgrade, so it has no decision record.

Decision: [0005. Host the game on Cloudflare Pages](decisions/0005-host-on-cloudflare-pages.md)

## October 2026: ESLint

Prettier checked the formatting, but nothing read the code itself, so ESLint 10 now lints every
JavaScript file in the CI, and the dead DOM controller of the 2018 version is gone.

| Figure                                      | Before    | After   |
| ------------------------------------------- | --------- | ------- |
| Lines of JavaScript under `app/`            | 1,159     | 902     |
| Built JavaScript (`dist/assets`), gzipped   | 3,603 B   | 3,724 B |
| ESLint findings (29 files before, 34 after) | 0         | 0       |
| `pnpm lint` run time (warm cache)           | no script | 0.49 s  |

Decision: [0006. Lint the code with ESLint](decisions/0006-lint-with-eslint.md)

## How the figures were measured

- Each commit was checked out in a detached worktree outside the repository, then removed.
- Machine: macOS on Apple silicon, Node.js 24.22.0, npm 12.2.0 for the npm commits, pnpm 12.14.0
  for the pnpm commits. The machine was shared with other jobs, so the times vary between runs.
- Times are the median of three runs of `/usr/bin/time -p`, with a warm cache: the npm cache and
  the pnpm store already held the packages. The install deletes `node_modules` before each run,
  then runs `npm ci` or `pnpm install --frozen-lockfile`.
- pnpm 12 refuses the ignored build script of esbuild on c65212a, whose allowlist sits in the
  `pnpm` field of `package.json`. That commit was measured with the `pnpm-workspace.yaml` of
  `a3c41a6`, which allows it.
- Sizes are those of `dist/assets/` after `pnpm build`, the same after each of the three builds,
  or of the files of `app/` for the commits without a build. Gzip sizes come from
  `gzip -c <file> | wc -c`, summed over the files when there are several.
- The dev server start is Vite's "ready in", median of three starts.
- Audit advisories come from `npm audit --json` after `npm ci`, or from `pnpm audit --json` after
  the install, run on 2026-10-20, so an old commit also counts the advisories published after it.
- Lockfile lines come from `wc -l`, and direct dependencies from `dependencies` and
  `devDependencies` of `package.json`.
- The headers come from `curl -sI` on 2026-10-20 (see
  [0005](decisions/0005-host-on-cloudflare-pages.md)).
- The figures of the ESLint section come from #41 and its decision record.
