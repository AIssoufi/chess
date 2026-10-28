import { createServer } from 'node:net';
import { ANY_FREE_PORT, PREVIEW_HOST } from './constants.js';

/**
 * Asks the system for a TCP port that nothing listens on, by opening a server on port 0 and
 * closing it at once.
 *
 * @returns {Promise<number>} A free port of `PREVIEW_HOST`.
 */
export function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(ANY_FREE_PORT, PREVIEW_HOST, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/**
 * Reads the rules of a Cloudflare Pages `_headers` file: each unindented line is a URL pattern,
 * and the indented lines below it are its headers. A pattern written twice keeps the headers of
 * both blocks, since Pages applies every block that matches.
 *
 * @param {string} text Content of the file.
 * @returns {Map<string, string[]>} The header lines of each URL pattern, trimmed.
 */
export function parseHeaderRules(text) {
  const rules = new Map();
  let headers = [];

  for (const line of text.split('\n')) {
    const isSkipped = line.trim() === '' || line.trim().startsWith('#');
    if (isSkipped) continue;

    const isUrlPattern = !/^\s/.test(line);
    if (isUrlPattern) {
      const pattern = line.trim();
      headers = rules.get(pattern) ?? [];
      rules.set(pattern, headers);
    } else {
      headers.push(line.trim());
    }
  }

  return rules;
}

/**
 * Returns the value of a header among the header lines of a `_headers` rule.
 *
 * @param {object} params
 * @param {string[]} [params.headers] The header lines of a URL pattern, as `parseHeaderRules`
 *   gives them.
 * @param {string} params.name The header name, in any case.
 * @returns {string | null} The value of the first line that sets the header, trimmed, or `null`
 *   when no line sets it, the name is empty or the header lines are not a list.
 */
export function findHeaderValue({ headers = [], name }) {
  const isNamed = typeof name === 'string' && name !== '';
  const hasHeaders = Array.isArray(headers);
  if (!isNamed || !hasHeaders) return null;

  const prefix = `${name.toLowerCase()}:`;
  const line = headers.find((header) => header.toLowerCase().startsWith(prefix));
  return line === undefined ? null : line.slice(prefix.length).trim();
}
