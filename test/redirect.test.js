import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { GITHUB_PAGES_BASE_PATH, TARGET_ORIGIN } from '../redirect/constants.js';
import { getRedirectUrl } from '../redirect/utils.js';

const REDIRECT_PAGE = readFileSync(new URL('../redirect/index.html', import.meta.url), 'utf8');
const ABSOLUTE_URLS = /https?:\/\/[^"'\s]+/g;
/** The canonical link, the meta refresh and the visible link of the redirect page. */
const TARGET_LINK_COUNT = 3;

describe('getRedirectUrl', () => {
  it.each([
    ['/chess/', 'https://chess.issoufi.fr/'],
    ['/chess', 'https://chess.issoufi.fr/'],
    ['/chess/assets/index.js', 'https://chess.issoufi.fr/assets/index.js'],
    ['/chess/pi%C3%A8ce', 'https://chess.issoufi.fr/pi%C3%A8ce'],
    ['/chessboard', 'https://chess.issoufi.fr/chessboard'],
    ['/echiquier/', 'https://chess.issoufi.fr/echiquier/'],
    ['/chess//page', 'https://chess.issoufi.fr/page'],
    ['index.html', 'https://chess.issoufi.fr/index.html'],
    ['', 'https://chess.issoufi.fr/'],
  ])('redirects the path "%s" to %s', (pathname, expected) => {
    expect(getRedirectUrl({ location: { pathname } })).toBe(expected);
  });

  it('keeps the query and the fragment', () => {
    const location = { pathname: '/chess/index.html', search: '?player=noire', hash: '#e4' };

    expect(getRedirectUrl({ location })).toBe(
      'https://chess.issoufi.fr/index.html?player=noire#e4'
    );
  });

  it('keeps percent-encoded characters of the query as they are', () => {
    const location = { pathname: '/chess/', search: '?q=a%20b' };

    expect(getRedirectUrl({ location })).toBe('https://chess.issoufi.fr/?q=a%20b');
  });

  it('stays on the new host when the path looks like a host after double slashes', () => {
    const url = new URL(getRedirectUrl({ location: { pathname: '/chess//evil.example/x' } }));

    expect(url.origin).toBe('https://chess.issoufi.fr');
    expect(url.pathname).toBe('/evil.example/x');
  });

  it('accepts another base path and target origin', () => {
    const location = { pathname: '/old/page', search: '?a=1' };

    expect(
      getRedirectUrl({ location, basePath: '/old', targetOrigin: 'https://new.example' })
    ).toBe('https://new.example/page?a=1');
  });

  it('redirects to the root when the location is missing', () => {
    expect(getRedirectUrl()).toBe('https://chess.issoufi.fr/');
    expect(getRedirectUrl({})).toBe('https://chess.issoufi.fr/');
    expect(getRedirectUrl({ location: null })).toBe('https://chess.issoufi.fr/');
  });

  it('leaves out the parts of the location that are empty or not strings', () => {
    const location = { pathname: 42, search: ['?a=1'], hash: null };

    expect(getRedirectUrl({ location })).toBe('https://chess.issoufi.fr/');
    expect(getRedirectUrl({ location: { pathname: '/chess/', search: '', hash: '' } })).toBe(
      'https://chess.issoufi.fr/'
    );
  });

  it('throws a TypeError when the target origin is not a valid URL', () => {
    expect(() => getRedirectUrl({ targetOrigin: 'chess.issoufi.fr' })).toThrow(TypeError);
  });
});

describe('redirect page', () => {
  it('only links to the root of the target origin', () => {
    const urls = REDIRECT_PAGE.match(ABSOLUTE_URLS);

    expect(urls).toHaveLength(TARGET_LINK_COUNT);
    expect(new Set(urls)).toEqual(new Set([`${TARGET_ORIGIN}/`]));
  });

  it('imports the redirect from the base path of the GitHub Pages site', () => {
    expect(REDIRECT_PAGE).toContain(`from '${GITHUB_PAGES_BASE_PATH}/utils.js'`);
  });
});
