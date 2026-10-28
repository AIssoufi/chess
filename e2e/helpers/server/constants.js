/** The host the preview server listens on, an IPv4 address so it never resolves to `::1`. */
export const PREVIEW_HOST = '127.0.0.1';

/** The port that asks the system for any free port. */
export const ANY_FREE_PORT = 0;

/** The `_headers` file of Cloudflare Pages, which `vite preview` does not read. */
export const HEADERS_FILE = new URL('../../../app/public/_headers', import.meta.url);

/** The URL pattern of `_headers` whose headers Cloudflare Pages sends with every page. */
export const EVERY_PAGE_PATTERN = '/*';

/** The name of the Content Security Policy header. */
export const CSP_HEADER_NAME = 'Content-Security-Policy';
