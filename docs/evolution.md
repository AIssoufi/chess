# Evolution

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
