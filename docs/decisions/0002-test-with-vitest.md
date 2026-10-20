# 0002. Run the tests with Vitest

- Date: 2026-03-25 (commit `0900ff4`)
- Status: Accepted

## Context

From May 2018 (`3b40f0e`), `npm test` ran Mocha 5 with
`--require babel-polyfill --compilers js:babel-register` and the Babel 6 `env` preset, so that
Node.js could load the ES modules of the game. `mocha-jsdom` was added for a DOM, then removed the
same day (`0c6ba15`).

- `--compilers` was deprecated: each run prints
  `DeprecationWarning: "--compilers" will be removed in a future version of Mocha`.
- `test/main.test.js` held 3 tests with empty bodies and imported no game code, so nothing was
  tested. The rules lived in DOM code ([0003](0003-keep-the-board-state-in-a-model.md)), which
  Mocha could not run without a DOM.

## Decision

Replace Mocha and Babel with Vitest, in commit `0900ff4`. `vitest.config.js` runs
`test/**/*.test.js` in the Node.js environment, and the new `test/echiquier.test.js` tests the
board model. Tests that need a DOM later opted into happy-dom with a
`// @vitest-environment happy-dom` comment (`aa7b79d`).

## Alternatives considered

- **A current Mocha with its native ES module support**: no Babel left, but a second module
  pipeline next to Vite's, and no `expect` or mocks without more packages.
- **Jest**: its ES module support needs Babel or an experimental Node.js flag, the problem the
  change removes.

## Consequences

Measured on 59bf255 (Mocha, the last commit before the change) and c65212a (Vitest 2.1.9, the same
day as the change), with the method of
[the evolution page](../evolution.md#how-the-figures-were-measured):

| Figure                 | Before: 59bf255, Mocha 5 | After: c65212a, Vitest 2.1.9 |
| ---------------------- | ------------------------ | ---------------------------- |
| Tests                  | 3, with empty bodies     | 25 in 1 file                 |
| Test suite, wall clock | 0.60 s                   | 1.18 s                       |
| Test packages (direct) | 4                        | 1                            |

- The tests use the same ES module transform as the build, with no Babel configuration.
- The suite grew to 196 tests in 7 files by 7d734a8, and Vitest was upgraded from 2 to 5 in #34,
  without a change of tool.
