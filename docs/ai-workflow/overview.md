# AI agent workflow

Since October 2026 this repository is maintained by a team of
[Claude Code](https://claude.com/claude-code) agents working for its owner. Most commits and pull
requests from then on were written by an agent.

## In short

- The **owner** decides what the game should become and approves what players will see.
- A **master agent** keeps the board of issues, starts one worker per ticket and merges.
- Each **worker agent** implements one ticket in its own Git worktree, reviews its work and opens
  a pull request.
- Every change goes through an issue, a branch named after it, a pull request, the CI and a
  review before it reaches `master`, which Cloudflare Pages deploys.

## Why

- **Parallel work without collisions**: one worktree and one branch per ticket, so several
  workers can change the code at once. For example, the page metadata of
  [#40](https://github.com/AIssoufi/chess/pull/40) stayed open while ESLint
  ([#41](https://github.com/AIssoufi/chess/pull/41)) and the ADRs
  ([#42](https://github.com/AIssoufi/chess/pull/42)) were opened and merged.
- **A trail for every change**: each commit names its ticket (`Refs: CHESS-<n>`) and each pull
  request closes its issue, so the reason for a line of code is one click away.
- **Small, reviewable steps**: a ticket holds one change; anything found on the way becomes a new
  issue instead of growing the pull request, as [#37](https://github.com/AIssoufi/chess/issues/37)
  did while tests were added in [#39](https://github.com/AIssoufi/chess/pull/39).

## Pages

| Page                                    | Topic                                                 |
| --------------------------------------- | ----------------------------------------------------- |
| [Roles](roles.md)                       | Who decides what: owner, master, workers, sub-agents  |
| [Ticket lifecycle](ticket-lifecycle.md) | From an issue to a deployment                         |
| [Reviews](reviews.md)                   | The conventions review, the visual test, merge blocks |
| [Journal](journal.md)                   | How actions and decisions are recorded                |
| [Tooling](tooling.md)                   | The tools the agents share on this repository         |

The agents' own instructions live outside this repository; these pages describe what a reader of
the history needs to know.
