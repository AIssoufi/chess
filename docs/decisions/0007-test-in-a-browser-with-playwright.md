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
- Update of 2026-10-27 (#110): the CI now runs the suite in an `e2e` job of its own, in the
  official `mcr.microsoft.com/playwright` image of the exact `@playwright/test` version that the
  `playwright-version` job reads from the lockfile. The image ships the browsers and their system
  libraries, so nothing is cached or installed from apt any more.
- Update of 2026-10-28 (#33): the board height test at 844x390 is a plain test now, and a new one
  fills the move list with 40 turns at 844x390 and 932x430, on both sides of the 900px
  breakpoint, and checks that it stays beside the board, under the panel of white, inside the
  screen, and scrolls. Below 900px, a third one checks that "Aucun coup joué" is centered under
  the title of the move list.
- Update of 2026-10-28 (#48): `scrollbars.spec.js` launches Chromium with the classic scrollbars
  of a desktop window and checks, at 320x568, 390x800, 600x800 and 844x390, that the page does not
  scroll sideways and that the board stays inside the game frame. It runs in Chromium only, the
  one engine that takes classic scrollbars from the command line; the other specs still run in
  both engines.
- Update of 2026-10-28 (#74): `move-markers.spec.js` selects the pawn on e4 after 1. e4 d5 at
  each layout viewport, and checks that the empty e5 shows a dot and the pawn on d5 a ring, that
  this pawn is painted over its ring, and that no square moves when the markers show.
- Update of 2026-10-28 (#105): `game.spec.js` also closes the checkmate dialog of the fool's mate
  with "Voir la position", checks that the mating queen and the check marker stay on the board and
  that hovering an empty square leaves its background as it was, then starts a new game from
  "Nouvelle partie", where the hover darkens the square again. A last test checks that Escape
  starts a new game at the end of a game played after a reviewed one.
- Update of 2026-10-29 (#131): a `mobile-webkit` project runs the other specs on an emulated
  iPhone SE (320x568, `isMobile` and `hasTouch`), where the `press` helper taps the squares and
  buttons, so the promotion and the mate are played with taps. The hover test skips it, and a
  layout test checks that the board fits the phone's own width without scrolling sideways.
- Update of 2026-10-29 (#149): `move-list.spec.js` checks at 390x800 and 1280x800 that the key
  leaving the board reaches "Nouvelle partie" directly before the first move, and the move list
  after a move, with a focus ring around a box taller than 0px. WebKit presses Option+Tab
  (`Alt+Tab`), since Safari skips buttons on Tab alone.
- Update of 2026-10-29 (#150): `contrast.spec.js` reads, at each layout viewport, the color of
  every text of the game frame outside the board and the background colors of the boxes around
  it, before and after a few moves and captures, and checks that the text keeps 4.5:1 over a
  black and over a white photo, so over any photo. Background images are left out.
- Update of 2026-10-29 (#154): the title, the footer and the social icons sit on the photo itself,
  where no backdrop could pass over a white photo without hiding it. At each layout viewport,
  `contrast.spec.js` hides them, takes a screenshot at one pixel per CSS pixel, and checks their
  color over every whole pixel behind their boxes: 3:1 for the large title (WCAG 1.4.3) and the
  icons (1.4.11), 4.5:1 for the footer text and its links. It measures the photo of the site at
  those viewports only: the crop that another screen size shows of it is not measured. The
  screenshots come from a page of their own, without the Content Security Policy, which refuses
  the stylesheet that WebKit injects for each screenshot.

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
  only the browsers. Update of 2026-10-27 (#110): a slow apt mirror stalled or timed out the
  `check` job, so the suite moved to the official Playwright image, which needs no apt step, and a
  bump of the package moves the image with it.
- The page is not compared pixel by pixel, so a change of colors or fonts goes unseen.
