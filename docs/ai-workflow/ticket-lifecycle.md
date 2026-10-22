# Ticket lifecycle

```text
issue -> priority -> worktree -> commits -> pull request -> CI -> review -> merge -> deployment
```

1. **Issue.** The master writes it in English with its context, the problem and its evidence, a
   proposed solution and acceptance criteria, as in
   [#12](https://github.com/AIssoufi/chess/issues/12).
2. **Priority.** The issue joins the `chess roadmap` GitHub Project with a priority from `P0` (most
   urgent) to `P3`. [#8](https://github.com/AIssoufi/chess/issues/8), a broken `pnpm install`, was
   `P0`; this documentation is `P3`. The project's Status field follows the ticket: `Todo`,
   `In Progress`, `In Review`, `Done`.
3. **Worktree.** The master starts a worker in a new worktree on a branch named after the ticket,
   `CHESS-<n>`, from `master`. The status moves to `In Progress`.
4. **Commits.** Conventional Commits, one per part of the change, each ending with a
   `Refs: CHESS-<n>` trailer that the `prepare-commit-msg` hook adds on a ticket branch.
5. **Pull request.** Against `master`, with a Conventional Commit title, a summary, a test plan, the
   review verdict and `Closes #<n>`, as in [#39](https://github.com/AIssoufi/chess/pull/39). The
   status moves to `In Review`.
6. **CI.** The CI and the commit message check run on the pull request, and Cloudflare Pages posts
   a preview URL of the branch. See [Tooling](tooling.md).
7. **Review.** Done by the worker's reviewers before the pull request opens, see
   [Reviews](reviews.md).
8. **Merge.** The master merges with a merge commit once every check is green and the review is
   clean (`Merge pull request #45 from AIssoufi/CHESS-26`), and the issue closes. Before that, the
   worker rebases its branch on `master` when other pull requests merged first: branches never
   get merge commits.
9. **Deployment.** Cloudflare Pages deploys `master` to https://chess.issoufi.fr.

## When the plan changes

- A question the ticket does not answer goes from the worker to the master, and to the owner when
  it is theirs to decide.
- A problem outside the ticket becomes a new issue, never an extra change in the pull request:
  [#37](https://github.com/AIssoufi/chess/issues/37) was found while writing the tests of
  [#19](https://github.com/AIssoufi/chess/issues/19).
