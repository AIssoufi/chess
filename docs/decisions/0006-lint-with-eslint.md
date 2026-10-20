# 0006. Lint the code with ESLint

- Date: 2026-10-20
- Status: Accepted

## Context

The CI checked the formatting with Prettier, ran the tests and built the site, but nothing read the
code itself: an undefined variable, an unused import or an unreachable branch only showed when a
test happened to cover it. The repository also kept `app/js/Plateau.js`, the DOM controller of the
2018 version, which nothing imported since the internal board model replaced it, and the model
switched sides with the same inline ternary in four places.

## Decision

In the pull request that closes #20:

- ESLint 10 runs with a flat config, `eslint.config.js`: the recommended rules of `@eslint/js`,
  the browser globals of the `globals` package for `app/` and `redirect/`, and the Node.js globals
  for the configs and the tests (plus the browser globals for the tests that run in happy-dom).
- `pnpm lint` runs `eslint .`, and the CI runs it after the formatting check. On each commit,
  lint-staged runs `eslint --fix` on the staged JavaScript files, before Prettier.
- `app/js/Plateau.js` is deleted, and the same pull request replaces the duplicated color and
  square logic of the model with tested helpers.

## Alternatives considered

- **ESLint 9**: the ticket named it, but ESLint 10 is the current major and 9 only receives
  maintenance fixes. The flat config is the same for both.
- **`eslint-config-prettier`**: it turns off the rules that conflict with Prettier, but the
  recommended rules of ESLint 10 hold no formatting rule, so it would turn off nothing.
- **Biome or oxlint**: faster, and Biome could also replace Prettier, but the project already
  relies on Prettier and its lint-staged hook, and with about 35 files ESLint lints the repository
  in under half a second.

## Consequences

Measured on the same machine with Node.js 24.22.0 and pnpm 12.14.0, before on `7d734a8` and after
on the final state of this pull request; every build gave the same sizes three times in a row.

| Figure                                         | Before            | After             |
| ---------------------------------------------- | ----------------- | ----------------- |
| Lines under `app/` (JS, CSS and HTML)          | 1,759             | 1,502             |
| Lines of JavaScript under `app/`               | 1,159             | 902               |
| Built JavaScript (`dist/assets`), raw          | 11,150 B          | 11,304 B          |
| Built JavaScript (`dist/assets`), gzipped      | 3,603 B           | 3,724 B           |
| Built CSS (`dist/assets`), raw / gzipped       | 5,129 B / 1,661 B | 5,129 B / 1,661 B |
| ESLint findings (29 files before, 34 after)    | 0                 | 0                 |
| `pnpm lint` run time (median of 3, warm cache) | no script         | 0.49 s            |
| Direct dev dependencies                        | 11                | 14                |
| `pnpm audit` advisories                        | 0                 | 0                 |

- `Plateau.js` was never bundled, so deleting it leaves the build unchanged; the built JavaScript
  changes by the new color and square helpers only.
- The code already passed the recommended rules: the config run on `7d734a8` reported no
  finding, so none had to be fixed, and the CI now keeps it that way.
- Three dev dependencies are added: `eslint`, `@eslint/js` and `globals`.
- The inline module script of `redirect/index.html` is not linted: ESLint reads JavaScript files
  only.
