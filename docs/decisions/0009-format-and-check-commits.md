# 0009. Format with Prettier and check commits with Husky, lint-staged and commitlint

- Date: 2026-03-25, extended on 2026-10-20
- Status: Accepted

## Context

Before 2026-03-25, the repository had no formatter and no check on commits: the code of the 2018
version followed no recorded style, and the commit messages no convention. The rewrite of
`0900ff4` replaced the whole stack (see [0001](0001-build-with-vite.md)) and brought these tools in
the same commit. In October 2026, each change started to go through a ticket of the form
`CHESS-<n>`, and nothing tied a commit to its ticket.

## Decision

In `0900ff4` (2026-03-25):

- Prettier formats the code, with `.prettierrc.json`: single quotes, semicolons, trailing commas
  where ES5 allows them, 100 characters per line and two spaces of indentation.
- Husky installs the Git hooks from the `prepare` script. The `pre-commit` hook runs lint-staged,
  which formats the staged files with Prettier, and the `commit-msg` hook runs commitlint with
  `@commitlint/config-conventional`, so every message follows Conventional Commits.

In the pull requests that close #8 (#18) and #12 (#31), on 2026-10-20:

- `pnpm format` and `pnpm format:check` wrap Prettier, and the CI runs the check (see
  [0010](0010-run-ci-on-github-actions.md)). lint-staged also formats the YAML files (`51f98b1`).
- A local commitlint plugin, under `commitlint/`, refuses a commit with no `Refs: CHESS-<n>` line,
  in the trailers or in an earlier paragraph. commitlint ignores merge, revert and fixup commits,
  and the commits of Dependabot and release-please, which cannot name a ticket (`d747230`).
- The `prepare-commit-msg` hook adds the `Refs: CHESS-<n>` trailer on a `CHESS-<n>` branch, after
  the other trailers, unless the message already has a `Refs` line; it leaves merge, squash, amend
  and `fixup!` messages alone (`74aa950`).
- The pull request titles are checked with `commitlint/pr-title.config.js`, which keeps the header
  rules but needs no ticket reference, since the merge commit names the branch (`2600f13`).

The ESLint step of lint-staged came later, with [0006](0006-lint-with-eslint.md).

## Alternatives considered

Not recorded: neither `0900ff4` nor #12 names another formatter or commit checker that was weighed.

## Consequences

- Every commit is formatted and has a conventional header before it leaves the machine, and on a
  ticket branch it names its ticket without the author typing it.
- Formatting the files that failed the new check took one commit (`6287975`, four files).
- The hooks run only where `pnpm install` ran the `prepare` script, and `git commit --no-verify`
  skips them: the CI checks the formatting and the commit messages again on each pull request.
- The tests of the `prepare-commit-msg` hook run Git in temporary repositories, and the tests of
  the plugin lint messages with `@commitlint/lint` and the configuration loaded by
  `@commitlint/load`, which became direct dev dependencies.
