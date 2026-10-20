# 0004. Manage the packages with pnpm

- Date: 2026-03-25 (commit `0900ff4`), versions pinned on 2026-10-20 (#18)
- Status: Accepted

## Context

From May 2018, npm installed the packages from a version 1 `package-lock.json` (10,426 lines on
2839551, 8,395 on 59bf255).

- gulp, browser-sync, Mocha and `gh-pages` sat in `dependencies`, only the Babel packages in
  `devDependencies`, and `npm` itself was a dependency (`13f6071`), which Dependabot bumped from
  6.0.0 to 6.13.4 in #2.
- Nothing pinned the version of npm or of Node.js, so each machine installed with its own.

## Decision

Replace npm with pnpm, in commit `0900ff4`: `pnpm-lock.yaml` replaces `package-lock.json`, the
tools move to `devDependencies`, and the `npm` package is gone.

#18 then pinned the toolchain: `packageManager` names pnpm 12.14.0, which `pnpm/action-setup`
reads in the CI, `.nvmrc` names Node.js 24, and the build-script allowlist moved from the `pnpm`
field of `package.json`, which pnpm 12 no longer reads, to `allowBuilds` in
`pnpm-workspace.yaml`. #34 removed that file once Vite 8 no longer installed esbuild.

## Alternatives considered

- **Keep npm with `npm ci`**: it installs from the lockfile too, but copies every package into each
  project, where pnpm links them from one store.
- **Yarn**: a second lockfile format and its own release lines to follow, for no feature the
  project needed over pnpm.

## Consequences

Measured on 59bf255 (npm 12.2.0, the last commit before the change) and c65212a (pnpm 12.14.0, the
same day as the change), with the method of
[the evolution page](../evolution.md#how-the-figures-were-measured):

| Figure                         | Before: 59bf255, npm | After: c65212a, pnpm |
| ------------------------------ | -------------------- | -------------------- |
| Install without `node_modules` | 5.18 s (`npm ci`)    | 0.87 s               |
| Lockfile lines                 | 8,395                | 1,826                |
| Direct dependencies            | 8                    | 7                    |
| Audit advisories               | 181                  | 30                   |

- The two commits install different packages, so the install time and the advisories measure the
  whole change of `0900ff4`, not npm against pnpm alone.
- pnpm refuses the build scripts of dependencies unless they are allowed, and pnpm 12 makes an
  ignored one an error: c65212a installs with pnpm 12.14.0 only with the `allowBuilds` file of
  #18 added.
