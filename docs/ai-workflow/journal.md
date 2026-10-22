# Journal

Actions and decisions are recorded in three places, from the most public to the most detailed.

## In this repository

- **Ticket references**: the branch `CHESS-<n>`, the `Refs: CHESS-<n>` trailer of each commit and
  the `Closes #<n>` of each pull request all name the ticket. `git log --grep 'Refs: CHESS-12'`
  lists the commits of [#12](https://github.com/AIssoufi/chess/issues/12).
- **Pull request bodies**: what changed, how it was tested, the review verdict and what was not
  tested, as in [#41](https://github.com/AIssoufi/chess/pull/41).
- **Decisions**: a change of tool or architecture writes an ADR in
  [`docs/decisions/`](../decisions/) and a step of [`docs/evolution.md`](../evolution.md) in the
  same pull request, as ESLint did in [#41](https://github.com/AIssoufi/chess/pull/41).

## On GitHub

- **Issues** keep the reason for each ticket and, in their comments, any change of scope.
- **The `chess roadmap` project** keeps the priority and the status of each ticket.

## On the owner's machine

A fleet script appends one JSON line per event to two files outside the repository:

- a **registry** of agent sessions: name, role, repository, parent agent and transcript;
- an **action log**: who started a worker, opened or merged a pull request, created an issue, or
  relayed an owner's decision, with a short note on why.

Each line names the agent and its session, so a merged pull request leads back to the transcript
of the reasoning behind it. Lessons from the agents' mistakes go to a separate journal that
improves their shared instructions. These files hold session transcripts and stay private; the
shared [Traceability](https://github.com/AIssoufi/AIssoufi/blob/main/docs/agentic-architecture/traceability.md)
page describes their format.
