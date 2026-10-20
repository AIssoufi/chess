# 0005. Host the game on Cloudflare Pages, with a redirect from GitHub Pages

- Date: 2026-10-20 (#28)
- Status: Accepted

## Context

GitHub Pages served the game from the start. In 2018, the `deploy` script pushed `app/` as it was
to `https://aissoufi.github.io/echiquier/` with the `gh-pages` package. From March 2026
(`1fc4c4a`), `.github/workflows/deploy.yml` built the game on each push to `master` and published
`dist/` to `https://aissoufi.github.io/chess/`.

- The site lived under `/chess/`, so Vite needed `base: '/chess/'` (`c65212a`), and a root custom
  domain did not fit that build.
- GitHub Pages sets the response headers itself: every file gets `cache-control: max-age=600`,
  the hashed assets included, and a page cannot send a Content Security Policy header.
- A change was only visible online once merged: GitHub Pages has no preview per branch.

## Decision

Deploy on Cloudflare Pages from its Git integration, at `https://chess.issoufi.fr`, in #28:

- Vite builds for the root of the domain (its default `base` of `/`);
- `app/public/_headers` sets a one-year immutable cache on `/assets/*`, and a Content Security
  Policy and a Permissions Policy on every page;
- every branch other than `master` gets its own preview URL;
- `deploy.yml` now publishes `redirect/` to GitHub Pages, a page that sends every URL below
  `/chess/` to the same path, query and fragment on the new domain.

## Alternatives considered

- **GitHub Pages with a custom domain**: the root path would work, but the cache and security
  headers would stay fixed and there would still be no preview per branch.
- **Netlify or Vercel**: both offer previews and custom headers, but the DNS zone of
  `issoufi.fr` is on Cloudflare, which adds the CNAME of a Pages custom domain itself.

## Consequences

Measured on 2026-10-20 with `curl -sI`: GitHub Pages on the files of the redirect, the only site it
still serves (`index.html` and `utils.js`), and Cloudflare Pages on 7d734a8 (`index.html` and its
hashed JavaScript). The deploy duration comes from the `Deploy` run of
c65212a (23566193547):

| Figure                         | Before: GitHub Pages                | After: Cloudflare Pages                                      |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------ |
| URL                            | `https://aissoufi.github.io/chess/` | `https://chess.issoufi.fr/`                                  |
| `cache-control` of JavaScript  | `max-age=600`                       | `public, max-age=31536000, immutable`                        |
| `cache-control` of the page    | `max-age=600`                       | `public, max-age=0, must-revalidate`                         |
| Content Security Policy header | None                                | `base-uri 'self'; frame-ancestors 'none'; object-src 'none'` |
| Preview per branch             | None                                | One URL per branch                                           |
| Deploy duration                | 39 s (GitHub Actions)               | Not measured: the Cloudflare check reports no duration       |

- A returning visitor downloads the hashed JavaScript and CSS once per release instead of every
  10 minutes, and gets the new page at once.
- The Pages project, its build settings and the custom domain live in the Cloudflare dashboard,
  outside the repository: the README lists them.
- The old URL keeps working through the redirect, which `deploy.yml` still publishes.
