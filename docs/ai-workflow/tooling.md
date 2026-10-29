# Tooling

The tools the agents use in parallel on this repository. The parts shared by every repository of
the owner are described on the
[Tooling](https://github.com/AIssoufi/AIssoufi/blob/main/docs/agentic-architecture/tooling.md)
page of the agentic architecture docs.

| Tool                 | Use on this repository                                                     |
| -------------------- | -------------------------------------------------------------------------- |
| Claude Code          | Runs the master, each worker and their sub-agents, one session each        |
| cmux                 | A workspace per agent, named after its ticket, and messages between agents |
| Worktrunk (`wt`)     | Creates and removes the Git worktree of each ticket                        |
| GitHub CLI (`gh`)    | Issues, project fields, pull requests, checks and merges                   |
| Husky and commitlint | Commit format and ticket reference, locally and in CI                      |
| GitHub Actions       | CI and commit check of each PR, GitHub Pages redirect on `master`          |
| Cloudflare Pages     | Production on `master`, a preview per branch                               |

## Worktrees

Each ticket gets its own worktree, so the workers never share a working tree. The repository has
no `.config/wt.toml`, so Worktrunk runs no project hook: each worker runs `pnpm install` itself
and, when it needs the app, starts Vite on a port of its own (`pnpm start --port <port>`) rather
than the default 5173, which another worker may hold.

## Commits

Three Husky hooks run on each commit:

- `pre-commit`: lint-staged, which runs ESLint on the staged JavaScript files, then Prettier;
- `prepare-commit-msg`: adds `Refs: CHESS-<n>` on a `CHESS-<n>` branch;
- `commit-msg`: commitlint, which requires Conventional Commits and that ticket reference
  ([#12](https://github.com/AIssoufi/chess/issues/12)); merge, revert, fixup and bot commits are
  exempt.

## Checks on a pull request

| Check            | Workflow              | Checks                                             |
| ---------------- | --------------------- | -------------------------------------------------- |
| `check`          | `ci.yml`              | Formatting, lint, tests and build on `.nvmrc` (26) |
| `test (node 24)` | `ci.yml`              | Tests on Node.js 24                                |
| `commitlint`     | `commit-messages.yml` | Each commit the base lacks, and the title          |
| Cloudflare Pages | Git integration       | Builds the branch and comments its preview URL     |

[#45](https://github.com/AIssoufi/chess/pull/45) shows the three other checks, from before the
second Node.js job. The CI also runs on each push to `master`; the
[README](../../README.md#ci-and-deployment) lists the steps of each workflow.

## Deployment

Cloudflare Pages deploys `master` to https://chess.issoufi.fr and every other branch to a preview
URL ([#28](https://github.com/AIssoufi/chess/pull/28)). The `deploy.yml` workflow only publishes the
page that redirects the old GitHub Pages URL. The [README](../../README.md#ci-and-deployment) lists
the settings.
