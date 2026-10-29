# 0010. Run CI on GitHub Actions

- Date: 2026-10-20, extended until 2026-10-28
- Status: Accepted

## Context

Since `1fc4c4a` (2026-03-25), one GitHub Actions workflow built the game on each push to
`master` and published it to GitHub Pages, but nothing ran on pull requests: a change could reach
`master`, and production, without its tests or its build being checked. The repository is hosted
on GitHub, and the Husky hooks of [0009](0009-format-and-check-commits.md) run only on the
author's machine.

## Decision

In the pull request that closes #8 (#18, `51f98b1`), `.github/workflows/ci.yml` runs on every pull
request and every push to `master`: a frozen install with the pnpm and Node.js versions pinned by
`packageManager` and `.nvmrc`, then the Prettier check, the tests and the build. A newer push
cancels a running check only on a pull request, so every `master` commit is checked.

Later pull requests extended it:

- **Commit messages** (#31, `2600f13`): `commit-messages.yml` runs commitlint on the commits that
  the base lacks and on the title of the pull request, again when the title is edited.
- **Deployment** (#28, `ed2d46a`): Cloudflare Pages builds the game from its Git integration (see
  [0005](0005-host-on-cloudflare-pages.md)); `deploy.yml` only publishes the GitHub Pages redirect.
- **Dependabot** (#36, `d875e1f`): one weekly grouped pull request for the actions and one for the
  npm packages within their major, with `ci` and `build` prefixes that give conventional titles.
- **Hardening**: every action is pinned by commit SHA, with its tag in a comment (#71,
  `ff826a5`); the Pages write permissions belong to the deploy job only (#69, `3a21f98`); every
  job has a timeout (#104, `d406e00`); `actionlint.yml` lints the workflows on the pull requests
  that change them (#73, `a5ebf2e`).
- **More checks in `ci.yml`**: ESLint (#41, [0006](0006-lint-with-eslint.md)), `pnpm audit` at
  high severity (#92, `df1ad63`), coverage thresholds (#125, `59c4e54`), and a second test job on
  another Node.js version (#70, `fd99e1a`, now `test (node 24)`, [0008](0008-move-to-node-26.md)).
- **Browser tests** (#111, `94bcec7`): the `e2e` job runs in the official
  `mcr.microsoft.com/playwright` image, whose tag a `playwright-version` job reads from the exact
  `@playwright/test` version of the lockfile, so a bump of the package moves the image with it
  (see [0007](0007-test-in-a-browser-with-playwright.md)).
- **Live check** (#83, `ae52069`): `live-check.yml` requests the home page, its scripts and
  styles, the social image and the favicon of `https://chess.issoufi.fr` every hour, and checks
  the GitHub Pages redirect.

## Alternatives considered

Not recorded: #8 names no other CI service, GitHub Actions already ran the deployment at the
time.

## Consequences

- A pull request shows the Prettier, ESLint, audit, test, coverage, build, browser and commit
  message checks before its merge, and `master` is checked again after it.
- Dependabot keeps the actions and the packages current, and the SHA pins keep a moved tag from
  changing the code that runs; it bumps neither the actionlint binary of `actionlint.yml` nor
  the Node.js versions of `.nvmrc` and the `test (node 24)` job.
- The hourly live check reports a broken production site without waiting for a visitor.
- Each workflow runs on GitHub's runners: their durations are measured in the pull requests and in
  [`evolution.md`](../evolution.md).
