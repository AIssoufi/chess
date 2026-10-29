import { createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import { getGridPlace } from '../e2e/helpers/board/utils.js';
import {
  AA_TEXT_CONTRAST_RATIO,
  BLACK,
  TRANSPARENT_BLACK,
  WHITE,
} from '../e2e/helpers/contrast/constants.js';
import {
  blendColors,
  getContrastRatio,
  getRelativeLuminance,
  getWorstContrast,
  parseCssColor,
} from '../e2e/helpers/contrast/utils.js';
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

describe('parseCssColor', () => {
  it('reads an opaque rgb() color', () => {
    expect(parseCssColor('rgb(0, 0, 0)')).toEqual({ red: 0, green: 0, blue: 0, alpha: 1 });
  });

  it('reads the alpha of an rgba() color', () => {
    expect(parseCssColor('rgba(255, 255, 255, 0.5)')).toEqual({
      red: 255,
      green: 255,
      blue: 255,
      alpha: 0.5,
    });
  });

  it('reads the space separated syntax, and a fully transparent color', () => {
    expect(parseCssColor('rgb(255 152 0 / 0.25)')).toEqual({
      red: 255,
      green: 152,
      blue: 0,
      alpha: 0.25,
    });
    expect(parseCssColor('rgba(0, 0, 0, 0)')).toEqual({ red: 0, green: 0, blue: 0, alpha: 0 });
  });

  it('ignores the spaces around the color', () => {
    expect(parseCssColor('  rgb(1, 2, 3) ')).toEqual({ red: 1, green: 2, blue: 3, alpha: 1 });
  });

  it('keeps a channel of 255 and an alpha of 1', () => {
    expect(parseCssColor('rgba(255, 255, 255, 1)')).toEqual(WHITE);
  });

  it.each([
    ['a channel over 255', 'rgb(256, 0, 0)'],
    ['an alpha over 1', 'rgba(0, 0, 0, 1.01)'],
    ['a negative channel', 'rgb(-1, 0, 0)'],
    ['a channel that is not a number', 'rgb(1.2.3, 0, 0)'],
    ['a missing channel', 'rgb(0, 0)'],
    ['a percent alpha', 'rgb(0 0 0 / 50%)'],
    ['a color keyword', 'transparent'],
    ['a hex color', '#ffffff'],
    ['another color function', 'hsl(0, 0%, 0%)'],
    ['an empty string', ''],
    ['a string of spaces', '   '],
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
  ])('gives null for %s', (_case, text) => {
    expect(parseCssColor(text)).toBeNull();
  });
});

describe('blendColors', () => {
  const halfWhite = { ...WHITE, alpha: 0.5 };

  it('keeps an opaque color on top', () => {
    expect(blendColors({ top: WHITE, bottom: BLACK })).toEqual(WHITE);
  });

  it('keeps the bottom color under a transparent one', () => {
    expect(blendColors({ top: { ...WHITE, alpha: 0 }, bottom: BLACK })).toEqual(BLACK);
  });

  it('mixes a translucent color with the opaque one under it', () => {
    expect(blendColors({ top: halfWhite, bottom: BLACK })).toEqual({
      red: 127.5,
      green: 127.5,
      blue: 127.5,
      alpha: 1,
    });
  });

  it('keeps a translucent color over a transparent one', () => {
    expect(blendColors({ top: halfWhite, bottom: TRANSPARENT_BLACK })).toEqual(halfWhite);
  });

  it('gives transparent black for two transparent colors', () => {
    const transparent = { red: 10, green: 20, blue: 30, alpha: 0 };
    expect(blendColors({ top: transparent, bottom: transparent })).toEqual(TRANSPARENT_BLACK);
  });
});

describe('getRelativeLuminance', () => {
  it('gives 0 for black and 1 for white', () => {
    expect(getRelativeLuminance(BLACK)).toBe(0);
    expect(getRelativeLuminance(WHITE)).toBeCloseTo(1, 10);
  });

  it('uses the linear part of sRGB up to its threshold, and the curve above it', () => {
    expect(getRelativeLuminance({ red: 10, green: 10, blue: 10 })).toBeCloseTo(0.003035, 6);
    expect(getRelativeLuminance({ red: 11, green: 11, blue: 11 })).toBeCloseTo(0.003347, 6);
  });
});

describe('getContrastRatio', () => {
  it('gives 21 for black on white, in either order', () => {
    expect(getContrastRatio({ foreground: BLACK, background: WHITE })).toBeCloseTo(21, 10);
    expect(getContrastRatio({ foreground: WHITE, background: BLACK })).toBeCloseTo(21, 10);
  });

  it('gives 1 for the same color', () => {
    expect(getContrastRatio({ foreground: WHITE, background: WHITE })).toBe(1);
  });

  it('gives the ratio of black on the orange of the buttons', () => {
    const orange = { red: 255, green: 152, blue: 0, alpha: 1 };
    expect(getContrastRatio({ foreground: BLACK, background: orange })).toBeCloseTo(9.74, 2);
  });

  it('paints a translucent text over its background first', () => {
    expect(getContrastRatio({ foreground: TRANSPARENT_BLACK, background: WHITE })).toBe(1);
  });
});

describe('getWorstContrast', () => {
  const text = 'rgb(0, 0, 0)';

  it('gives the contrast over a black photo under a half white card', () => {
    const ratio = getWorstContrast({ text, layers: ['rgba(255, 255, 255, 0.5)'] });
    expect(ratio).toBeCloseTo(5.28, 2);
    expect(ratio).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST_RATIO);
  });

  it('finds the card of #150, 32% white, under WCAG AA', () => {
    const ratio = getWorstContrast({ text, layers: ['rgba(255, 255, 255, 0.32)'] });
    expect(ratio).toBeCloseTo(2.67, 2);
  });

  it('takes the lighter photo for a light text', () => {
    const ratio = getWorstContrast({ text: 'rgb(255, 255, 255)', layers: ['rgba(0, 0, 0, 0.5)'] });
    expect(ratio).toBeCloseTo(3.98, 2);
  });

  it('paints the layers from the outermost, so an opaque inner box hides the outer ones', () => {
    const layers = ['rgb(0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)'];
    expect(getWorstContrast({ text, layers })).toBeCloseTo(21, 10);
  });

  it.each([
    ['no layers', []],
    ['missing layers', undefined],
    ['layers that are not a list', 'rgb(255, 255, 255)'],
  ])('gives 1 for %s, a text right on the photo', (_case, layers) => {
    expect(getWorstContrast({ text, layers })).toBe(1);
  });

  it.each([
    ['text color', { text: 'transparent', layers: [] }],
    ['layer', { text, layers: ['rgb(0, 0, 0)', '#fff'] }],
  ])('throws on an unreadable %s', (_case, params) => {
    expect(() => getWorstContrast(params)).toThrow('Unreadable CSS color');
  });
});
