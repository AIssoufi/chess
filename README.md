# Chess

A chess game for two players in the browser, written in vanilla JavaScript, with the full rules:
castling, en passant, promotion, check, checkmate and stalemate.

**Live demo:** https://chess.issoufi.fr

<p align="center">
  <img src="docs/screenshot.webp" alt="A game in progress: the white knight on f3 is selected and its legal moves are highlighted" width="800">
</p>

## Tech stack

| Tool                           | Role                                 |
| ------------------------------ | ------------------------------------ |
| JavaScript (ES modules)        | Game model and UI, no framework      |
| Vite 8                         | Dev server and production build      |
| Vitest 5                       | Unit tests                           |
| Prettier 3                     | Code formatting                      |
| Husky, lint-staged, commitlint | Git hooks: formatting, commit format |
| pnpm 12, Node.js 24            | Package manager and runtime          |
| Cloudflare Pages               | Hosting, with a preview per branch   |

## Getting started

Prerequisites:

- Node.js 24 (`.nvmrc`), or 26 and newer: Vitest 5 does not support Node.js 25;
- pnpm 12.14.0, pinned by the `packageManager` field of `package.json`.

```bash
pnpm install    # install the dependencies and the Git hooks
pnpm start      # dev server on http://localhost:5173/
pnpm build      # production build in dist/
pnpm preview    # serve dist/ on http://localhost:4173/
```

## Scripts

| Script              | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `pnpm start`        | Start the Vite dev server with hot reload   |
| `pnpm build`        | Build the site into `dist/`                 |
| `pnpm preview`      | Serve the production build                  |
| `pnpm test`         | Run the unit tests once                     |
| `pnpm format`       | Format every file with Prettier             |
| `pnpm format:check` | Check the formatting without changing files |

## Tests

`pnpm test` runs Vitest in Node.js, without a DOM. The tests live in `test/` and are named
`*.test.js`. The tests of the `prepare-commit-msg` hook run Git in temporary repositories.

## Project structure

```text
.husky/              Git hooks: lint-staged, the ticket trailer and commitlint
app/                 Vite root: the page, its styles and images
  css/               Styles and images
  js/                Game code
    console-log.js   Copies each console.log line to the move log panel of the page
    Echiquier.js     Board model and rules, without DOM
    game-over/       Move outcome (check, mate, stalemate) and game over dialog constants
    main.js          UI controller: renders the board and handles clicks
    PièceFactory.js  Creates the DOM node of a piece from its type and colour
    pieces/          Piece configs: Unicode symbol and starting squares
  public/            Files copied as they are to dist/, such as the Cloudflare Pages _headers
commitlint/          Ticket reference rule, bot commits and the pull request title config
docs/                README screenshot
redirect/            Page that redirects the old GitHub Pages URL to the new domain
test/                Unit tests
.github/workflows/   CI, commit message checks and the GitHub Pages redirect
```

## CI and deployment

- **CI** (`ci.yml`): on every pull request and push to `master`, installs with the frozen lockfile,
  then runs `pnpm format:check`, `pnpm test` and `pnpm build`.
- **Commit messages** (`commit-messages.yml`): on every pull request, and when its title changes,
  runs commitlint on each commit that the base branch lacks, and on the title with
  `commitlint/pr-title.config.js`, which needs no ticket reference.
- **Cloudflare Pages** deploys the game from its Git integration: `master` to
  https://chess.issoufi.fr, and every other branch to a preview URL, linked from its pull request.
  The build is served from the root of the domain, so Vite keeps its default `base` of `/`.
- **GitHub Pages redirect** (`deploy.yml`): on a push to `master` that changes `redirect/` or the
  workflow, or when run by hand, publishes `redirect/` to the old URL,
  https://aissoufi.github.io/chess/, with a copy of its `index.html` as `404.html`. The page sends
  every URL below `/chess/` to the same path, query and fragment on https://chess.issoufi.fr, and
  falls back to the home page without JavaScript.
- **Dependabot** (`.github/dependabot.yml`): each week, one pull request bumps the GitHub Actions,
  one bumps the npm packages within their major, and each new major of a package gets its own.
  Their titles start with `ci(deps):`, `build(deps):` or `build(deps-dev):`, so they pass the
  commit message check.

### Cloudflare Pages settings

The Pages project and its custom domain are set up in the Cloudflare dashboard, not in this
repository:

| Setting                | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| Production branch      | `master`                                                  |
| Preview branches       | All non-production branches                               |
| Framework preset       | None                                                      |
| Build command          | `pnpm build`                                              |
| Build output directory | `dist`                                                    |
| Root directory         | Empty, the repository root                                |
| Build system version   | 3                                                         |
| Node.js version        | Read from `.nvmrc` (24)                                   |
| Environment variables  | `PNPM_VERSION=12.14.0`, the version of `packageManager`   |
| Custom domain          | `chess.issoufi.fr`, a CNAME to the project's `.pages.dev` |

`app/public/_headers` sets the response headers: a one-year immutable cache for the hashed files
of `/assets/`, and a Content Security Policy and a Permissions Policy on every page. Pages already
sends `X-Content-Type-Options` and `Referrer-Policy`. Change `frame-ancestors` in that file to embed
the game in another site.

## Conventions

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and name their
  ticket in a `Refs: CHESS-<n>` trailer, which the `prepare-commit-msg` hook adds on a `CHESS-<n>`
  branch. commitlint checks each commit locally and in CI, merge, revert, fixup and bot commits
  aside, and the CI checks each pull request title like a commit header, without the ticket.
- Prettier formats the staged files on each commit, and the CI rejects unformatted files.
- pnpm runs no build script of a dependency unless the package is listed in `allowBuilds` of a
  `pnpm-workspace.yaml`. No dependency needs one, so the repository has no such file.

## License

[MIT](LICENSE)
