import { GITHUB_PAGES_BASE_PATH, LEADING_SLASHES, TARGET_ORIGIN } from './constants.js';

/**
 * Returns the value when it is a string, or an empty string otherwise.
 *
 * @param {unknown} value A part of a URL.
 * @returns {string} The value, or an empty string.
 */
function toText(value) {
  const isText = typeof value === 'string';
  return isText ? value : '';
}

/**
 * Removes the base path from a path, when the path is the base path or below it.
 *
 * @param {object} params
 * @param {string} params.pathname Path of the old URL, such as `/chess/index.html`.
 * @param {string} params.basePath Prefix to remove, such as `/chess`.
 * @returns {string} The path without the base path when it is below it, starting with a single
 *   slash.
 */
function stripBasePath({ pathname, basePath }) {
  const isBelowBasePath = pathname === basePath || pathname.startsWith(`${basePath}/`);
  const rest = isBelowBasePath ? pathname.slice(basePath.length) : pathname;
  // Collapse the leading slashes, so that `/chess//page` maps to `/page` like `/chess/page`.
  return `/${rest.replace(LEADING_SLASHES, '')}`;
}

/**
 * Builds the URL of the game on Cloudflare Pages that matches a URL of the GitHub Pages site,
 * keeping the path below the base path, the query and the fragment.
 *
 * @param {object} [params]
 * @param {{ pathname?: string, search?: string, hash?: string } | null} [params.location] The old
 *   URL, such as `window.location`.
 * @param {string} [params.basePath] Prefix of the old path to remove.
 * @param {string} [params.targetOrigin] Origin of the new URL.
 * @returns {string} The new URL; a missing or invalid part of the old URL is left out.
 * @throws {TypeError} When `targetOrigin` is not a valid absolute URL.
 */
export function getRedirectUrl({
  location,
  basePath = GITHUB_PAGES_BASE_PATH,
  targetOrigin = TARGET_ORIGIN,
} = {}) {
  const { pathname, search, hash } = location ?? {};
  const url = new URL(targetOrigin);
  url.pathname = stripBasePath({ pathname: toText(pathname), basePath });
  url.search = toText(search);
  url.hash = toText(hash);
  return url.href;
}
