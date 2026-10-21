import { describe, it, expect } from 'vitest';
import { getOpponent, getPawnDirection, isColor } from '../app/js/colors/utils.js';

/** Values that are not one of the two colors. */
const NOT_COLORS = [
  ['an unknown color', 'rouge'],
  ['a color in another case', 'Blanche'],
  ['an empty string', ''],
  ['a key of Object.prototype', 'toString'],
  ['undefined', undefined],
  ['null', null],
  ['a number', 1],
  ['an object', { color: 'white' }],
];

describe('isColor', () => {
  it.each(['white', 'black'])('accepts %s', (color) => {
    expect(isColor(color)).toBe(true);
  });

  it.each(NOT_COLORS)('rejects %s', (_label, value) => {
    expect(isColor(value)).toBe(false);
  });
});

describe('getPawnDirection', () => {
  it('moves a white pawn toward higher ranks', () => {
    expect(getPawnDirection('white')).toBe(1);
  });

  it('moves a black pawn toward lower ranks', () => {
    expect(getPawnDirection('black')).toBe(-1);
  });

  it.each(NOT_COLORS)('returns 0 for %s', (_label, value) => {
    expect(getPawnDirection(value)).toBe(0);
  });
});

describe('getOpponent', () => {
  it('returns black for white', () => {
    expect(getOpponent('white')).toBe('black');
  });

  it('returns white for black', () => {
    expect(getOpponent('black')).toBe('white');
  });

  it.each(NOT_COLORS)('returns null for %s', (_label, value) => {
    expect(getOpponent(value)).toBeNull();
  });
});
