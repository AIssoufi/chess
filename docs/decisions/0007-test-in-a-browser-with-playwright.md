# 0007. Test the layout and a game in a browser with Playwright

- Date: 2026-10-27
- Status: Accepted

## Context

Vitest runs the model in Node.js and the page in happy-dom, which builds a DOM but lays nothing
out: no test could see a board wider than a phone, squares out of their grid, or a dialog that a
player cannot reach. The layout issues (#33, #48, #49) were found by hand, one screen size at a
time, and nothing kept a fixed one from coming back.

## Decision

In the pull request that closes #78:

- `@playwright/test` runs the `*.spec.js` files of `e2e/` in Chromium and WebKit, on the
  production build: its web server runs `pnpm build`, then `vite preview` on a free port picked
  once by `playwright.config.js` and shared with the workers through `E2E_PORT`.
- `layout.spec.js` checks, at 390x800, 768x1024, 844x390 and 1280x800, that the page does not
  scroll sideways and that the 64 squares form a grid, white at the bottom, inside the width.
  `game.spec.js` plays the fool's mate to the checkmate dialog, then a promotion to a queen. A page
  error or a console error fails any test.
- An expectation that fails because of an open issue is written as `test.fixme`, with the issue
  number in its title: the board height at 844x390 (#33) and 15 captured pieces at 1280x800
  (#49). The pull request that fixes the issue turns it into a plain test.
- `pnpm test:e2e` runs the suite, and the CI runs it after the build, with the browsers cached
  per Playwright version.

## Alternatives considered

- **Vitest browser mode**: it would reuse the Vitest config, but it runs each test file in a page
  of the Vitest server, not the built site, and it still needs Playwright or WebdriverIO as its
  provider.
- **Cypress**: its WebKit support is still behind an experimental flag.
- **Chromium only**: Safari, and every browser of an iPhone or an iPad, runs WebKit, and the layout
  relies on viewport units (`svh`, `dvh`) whose support differs between engines.
- **Screenshot comparisons**: they catch any change, wanted or not, and their images depend on the
  fonts of the machine; the geometry checks hold on any machine and name the broken rule.

## Consequences

Measured on 2026-10-27 on the same machine with Node.js 24.22.0 and pnpm 12.14.0, before on
`1f4c9d3` and after on the final state of this pull request.

| Figure                                    | Before    | After                                |
| ----------------------------------------- | --------- | ------------------------------------ |
| `pnpm install --frozen-lockfile` (median) | 0.3 s     | 0.4 s                                |
| Browser tests (Chromium and WebKit)       | none      | 30, 4 of them `test.fixme`           |
| `pnpm test:e2e` run time (median, built)  | no script | 6.0 s                                |
| Direct dev dependencies                   | 14        | 15                                   |
| `pnpm audit` advisories                   | 0         | 0                                    |
| Duration of the CI `check` job (median)   | 32 s      | see the pull request that closes #78 |

- Removing the width term of `--square`, the fix of adefd42 that keeps the board inside a phone,
  makes the sideways scroll and grid tests fail at 390x800 in both browsers: the page grows to
  591px.
- One dev dependency is added, `@playwright/test`, with `playwright` and `playwright-core` under
  it. The browsers are not packages: `pnpm exec playwright install chromium webkit` downloads them
  once per Playwright version.
- The CI installs the system libraries of the browsers from apt on every run, since the cache holds
  only the browsers.
- The page is not compared pixel by pixel, so a change of colors or fonts goes unseen.
