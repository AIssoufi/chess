# 0008. Move the project to Node.js 26

- Date: 2026-10-29
- Status: Accepted

## Context

`.nvmrc` pinned Node.js 24, which the `check`, `e2e` and `commitlint` jobs and the Cloudflare Pages
build read. A second CI job, `test (node 26)`, already ran the tests on Node.js 26 (#65), and the
`engines` field of `package.json` allowed both (`^24.0.0 || >=26.0.0`), so nothing in the code
held the project on 24. The Node.js release schedule put Node.js 24 in maintenance on 2026-10-20,
and Node.js 26 became Active LTS on 2026-10-28 (v26.13.0, codename "Lithium" in
`https://nodejs.org/dist/index.json`), supported until 2029-04-30.

## Decision

In the pull request that closes #94:

- `.nvmrc` is `26`, so the `check` and `e2e` jobs, the commit message checks and the Cloudflare
  Pages build run on Node.js 26.
- The second CI job becomes `test (node 24)`, which runs `pnpm test` on Node.js 24, as long as
  `engines` keeps supporting it.
- The README and `docs/ai-workflow/tooling.md` name the new versions.

## Alternatives considered

- **Stay on Node.js 24 until its end of life (2028-04-30)**: maintenance releases only fix
  security issues and critical bugs, and the project already passed its tests on 26.
- **Drop Node.js 24 from `engines` and the CI**: a contributor still on 24 would have to switch
  for no gain, while one extra job of the CI keeps it supported.

## Consequences

Measured on 2026-10-29, base on Node.js 24.22.0, branch on Node.js 26.13.0, same machine, median
of three runs:

| Figure                       | Before (Node.js 24) | After (Node.js 26) |
| ---------------------------- | ------------------- | ------------------ |
| Install (warm store)         | 0.4 s               | 0.4 s              |
| Build                        | 0.2 s               | 0.2 s              |
| JavaScript built, raw / gzip | 24,488 B / 8,048 B  | 24,488 B / 8,048 B |
| CSS built, raw / gzip        | 10,658 B / 3,383 B  | 10,658 B / 3,383 B |
| `pnpm test` run time         | 4.4 s               | 3.9 s              |
| Tests                        | 1127                | 1127               |

The test times overlap between runs (3.6 s to 4.6 s before, 3.5 s to 5.2 s after), so the
difference is noise: the move changes no figure, and the built files are the same. The project
runs on a release line with active support until 2027-10-20 and security fixes until 2029-04-30.
The duration of the CI is in the pull request.
