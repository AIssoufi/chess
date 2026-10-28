import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { afterAll, beforeAll, describe, it, expect } from 'vitest';

/** Folder whose files Vite copies to the root of the site. */
const PUBLIC_DIR = fileURLToPath(import.meta.resolve('../app/public/'));
const VITE_CONFIG = fileURLToPath(import.meta.resolve('../vite.config.js'));
const SITE_URL = 'https://chess.issoufi.fr/';
/** Files that Cloudflare Pages and crawlers read at the root of the site. */
const ROOT_FILES = ['_headers', '404.html', 'robots.txt', 'sitemap.xml'];
/** A production build takes a few seconds, more than the default timeout of a hook. */
const BUILD_TIMEOUT_MS = 60_000;
const ONE_YEAR_IN_SECONDS = 31_536_000;

/**
 * Reads a file of `app/public/`.
 *
 * @param {string} name File name, such as `robots.txt`.
 * @returns {string} Its content.
 */
function readPublicFile(name) {
  return readFileSync(join(PUBLIC_DIR, name), 'utf8');
}

/**
 * Reads the rules of a Cloudflare Pages `_headers` file: each unindented line is a URL pattern,
 * and the indented lines below it are its headers. A pattern written twice keeps the headers of
 * both blocks, since Pages applies every block that matches.
 *
 * @param {string} text Content of the file.
 * @returns {Map<string, string[]>} The header lines of each URL pattern, trimmed.
 */
function parseHeaderRules(text) {
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

describe('build', () => {
  let outDir;

  beforeAll(async () => {
    outDir = await mkdtemp(join(tmpdir(), 'chess-build-'));
    await build({
      configFile: VITE_CONFIG,
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
    });
  }, BUILD_TIMEOUT_MS);

  afterAll(async () => {
    if (outDir) await rm(outDir, { recursive: true, force: true });
  });

  it.each(ROOT_FILES)('copies %s to the root of the site unchanged', (name) => {
    expect(readFileSync(join(outDir, name), 'utf8')).toBe(readPublicFile(name));
  });
});

describe('robots.txt', () => {
  const lines = readPublicFile('robots.txt').trim().split('\n');

  it('lets every crawler read the whole site', () => {
    expect(lines).toContain('User-agent: *');
    expect(lines).toContain('Allow: /');
    expect(lines.filter((line) => line.startsWith('Disallow:'))).toEqual([]);
  });

  it('points to the sitemap on the site domain', () => {
    expect(lines).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
  });
});

describe('sitemap.xml', () => {
  const sitemap = readPublicFile('sitemap.xml');

  it('is a sitemap of the sitemaps.org protocol', () => {
    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it('lists the game page only', () => {
    const locations = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, url]) => url);

    expect(locations).toEqual([SITE_URL]);
  });
});

describe('_headers', () => {
  const source = readPublicFile('_headers');
  const rules = parseHeaderRules(source);

  it('sends HSTS for one year on every page', () => {
    expect(rules.get('/*')).toContain(`Strict-Transport-Security: max-age=${ONE_YEAR_IN_SECONDS}`);
  });

  it('keeps HSTS to this host, without includeSubDomains or preload', () => {
    const hstsLines = source.split('\n').filter((line) => line.includes('Strict-Transport'));

    expect(hstsLines).toHaveLength(1);
    expect(hstsLines[0]).not.toMatch(/includeSubDomains|preload/i);
  });
});

describe('parseHeaderRules', () => {
  it('groups the indented headers under their URL pattern', () => {
    const text = '# comment\n/a\n  X-One: 1\n\n/b/*\n  X-Two: 2\n  X-Three: 3\n';

    expect(parseHeaderRules(text)).toEqual(
      new Map([
        ['/a', ['X-One: 1']],
        ['/b/*', ['X-Two: 2', 'X-Three: 3']],
      ])
    );
  });

  it('returns no rule for an empty file or a file of comments', () => {
    expect(parseHeaderRules('')).toEqual(new Map());
    expect(parseHeaderRules('# only a comment\n\n')).toEqual(new Map());
    expect(parseHeaderRules('   \n\t\n')).toEqual(new Map());
  });

  it('skips indented comments and reads CRLF line endings', () => {
    const text = '/a\r\n  # an indented comment\r\n  X-One: 1\r\n';

    expect(parseHeaderRules(text)).toEqual(new Map([['/a', ['X-One: 1']]]));
  });

  it('ignores headers that come before any URL pattern', () => {
    expect(parseHeaderRules('  X-Orphan: 1\n/a\n  X-One: 1')).toEqual(
      new Map([['/a', ['X-One: 1']]])
    );
  });

  it('keeps the headers of every block of a repeated pattern', () => {
    const text = '/a\n  X-One: 1\n/b\n  X-Two: 2\n/a\n  X-Three: 3\n';

    expect(parseHeaderRules(text)).toEqual(
      new Map([
        ['/a', ['X-One: 1', 'X-Three: 3']],
        ['/b', ['X-Two: 2']],
      ])
    );
  });
});
