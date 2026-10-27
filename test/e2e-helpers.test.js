import { createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import { getGridPlace } from '../e2e/helpers/board/utils.js';
import { PREVIEW_HOST } from '../e2e/helpers/server/constants.js';
import { findFreePort } from '../e2e/helpers/server/utils.js';

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
