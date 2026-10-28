import { createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import { getGridPlace } from '../e2e/helpers/board/utils.js';
import { PREVIEW_HOST } from '../e2e/helpers/server/constants.js';
import { findFreePort, findHeaderValue, parseHeaderRules } from '../e2e/helpers/server/utils.js';

const HIGHEST_PORT = 65535;

/**
 * Opens a server on a port of the preview host and closes it again.
 *
 * @param {number} port The port.
 * @returns {Promise<void>} Resolves once the server listened and closed, rejects if the port is
 *   taken.
 */
function listenAndClose(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(port, PREVIEW_HOST, () => server.close(() => resolve()));
  });
}

describe('getGridPlace', () => {
  it('puts a8 at the top left corner and h1 at the bottom right one', () => {
    expect(getGridPlace('a8')).toEqual({ column: 0, row: 0 });
    expect(getGridPlace('h1')).toEqual({ column: 7, row: 7 });
  });

  it('puts h8 at the top right corner and a1 at the bottom left one', () => {
    expect(getGridPlace('h8')).toEqual({ column: 7, row: 0 });
    expect(getGridPlace('a1')).toEqual({ column: 0, row: 7 });
  });

  it('counts the columns from the a file and the rows from the eighth rank', () => {
    expect(getGridPlace('e4')).toEqual({ column: 4, row: 4 });
  });

  it.each([
    ['an empty string', ''],
    ['a file past h', 'i1'],
    ['a rank past 8', 'a9'],
    ['rank 0', 'a0'],
    ['an uppercase file', 'A1'],
    ['a square with extra characters', 'a1 '],
    ['undefined', undefined],
    ['null', null],
    ['a number', 11],
  ])('gives null for %s', (_name, square) => {
    expect(getGridPlace(square)).toBeNull();
  });
});

describe('findFreePort', () => {
  it('gives a valid port that a server can listen on', async () => {
    const port = await findFreePort();

    expect(Number.isInteger(port)).toBe(true);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThanOrEqual(HIGHEST_PORT);
    await expect(listenAndClose(port)).resolves.toBeUndefined();
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

describe('findHeaderValue', () => {
  const headers = ['X-One: 1', "Content-Security-Policy:  default-src 'self' ", 'X-One: 2'];

  it('gives the trimmed value of the header, whatever the case of its name', () => {
    expect(findHeaderValue({ headers, name: 'Content-Security-Policy' })).toBe(
      "default-src 'self'"
    );
    expect(findHeaderValue({ headers, name: 'content-security-policy' })).toBe(
      "default-src 'self'"
    );
  });

  it('gives the value of the first line that sets the header', () => {
    expect(findHeaderValue({ headers, name: 'X-One' })).toBe('1');
  });

  it('does not take a header whose name only starts with the name', () => {
    expect(findHeaderValue({ headers: ['X-One-More: 3'], name: 'X-One' })).toBeNull();
  });

  it('gives null for a header that no line sets', () => {
    expect(findHeaderValue({ headers, name: 'X-Missing' })).toBeNull();
    expect(findHeaderValue({ headers: [], name: 'X-One' })).toBeNull();
  });

  it.each([
    ['missing header lines', { name: 'X-One' }],
    ['null header lines', { headers: null, name: 'X-One' }],
    ['header lines that are not a list', { headers: 'X-One: 1', name: 'X-One' }],
    ['an empty name', { headers, name: '' }],
    ['a missing name', { headers }],
    ['a name that is not a string', { headers, name: 1 }],
  ])('gives null for %s', (_case, params) => {
    expect(findHeaderValue(params)).toBeNull();
  });
});
