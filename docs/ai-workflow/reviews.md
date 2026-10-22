# Reviews

Before opening its pull request, a worker has its committed work reviewed by up to two read-only
sub-agents that run in parallel. Each pull request states their verdict in a Review section.

## Conventions review

The conventions reviewer reads the diff against the coding rules of the agents and the project's
`CLAUDE.md`: English code and French player text, one change per commit, tests for the logic,
named constants and conditions, an up-to-date README. It reports each violation with its file,
line and fix. The worker fixes the confirmed ones in `fixup!` commits and runs the reviewer once
more on those fixes.

[#41](https://github.com/AIssoufi/chess/pull/41) records two rounds: the first found a README line
in the wrong commit and an ADR section to shorten, the second found no violation.

## Visual test

When something visible changes (styles, HTML, rendering), the visual tester runs the app, takes
screenshots of every page at phone, tablet, laptop and large desktop widths, checks that the
requested behavior is visible and works, and looks for regressions: layout, horizontal scroll,
console errors, failed requests. It is skipped for a change that shows nothing new, which the pull
request says, as #41 does.

[#32](https://github.com/AIssoufi/chess/pull/32) checked thirteen widths, from 320 to 1920 pixels,
for a horizontal scroll.

## What blocks a merge

- A red check: the CI, the commit message check or the Cloudflare Pages build.
- A confirmed review finding that is not fixed.
- A branch behind `master` that conflicts, until the worker rebases it.
- A visible change the owner has not validated yet, such as the layout of #32.
- A change outside the ticket: it goes to a new issue instead.
