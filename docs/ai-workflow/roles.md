# Roles

| Role         | Works in                            | Decides                                         | Never does                      |
| ------------ | ----------------------------------- | ----------------------------------------------- | ------------------------------- |
| Owner        | GitHub and the master's session     | Scope, priorities, what players see             |                                 |
| Master agent | The main checkout, on `master`      | Which ticket starts, when a pull request merges | Write the code of a ticket      |
| Worker agent | One worktree, on branch `CHESS-<n>` | How to implement its ticket                     | Merge, or change another ticket |
| Sub-agents   | Launched by a master or a worker    | Nothing: they report                            | Edit the code they review       |

## Owner

Sets the direction and the priority of each issue, answers the questions the master cannot settle,
and validates visible changes. A layout change such as
[#32](https://github.com/AIssoufi/chess/pull/32) waited for the owner's look before it merged.

## Master agent

Keeps the board: creates the issues, gives each one a priority, starts a worker per ticket, relays
the owner's decisions, checks each pull request and merges it. It is the only agent that opens
issues: when a worker finds a problem outside its ticket, it sends the master a finding, and the
master searches for a duplicate before creating the issue.
[#44](https://github.com/AIssoufi/chess/issues/44), the refactor that the rename of
[#26](https://github.com/AIssoufi/chess/issues/26) left out, was created that way a minute before
the rename's pull request opened.

## Worker agents

One per ticket, named after it (`CHESS-19` worked on
[#19](https://github.com/AIssoufi/chess/issues/19)). A worker reads its issue, implements only what
it asks, commits, runs the checks of the CI, has its work reviewed, opens the pull request and
reports to the master. It asks the master rather than guessing when the ticket is unclear.

## Sub-agents

Short-lived agents with a single job and no right to change the code:

- **Repository auditor**: reads the repository and proposes ranked findings (bugs, outdated
  packages, missing tests, accessibility) that the master may turn into issues.
- **Conventions reviewer** and **visual tester**: review a worker's change, see
  [Reviews](reviews.md).
- **Workflow observer**: reads the agents' sessions and proposes improvements to their
  instructions.
