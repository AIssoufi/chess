import { describe, it, expect } from 'vitest';
import { getOpponent, getPawnDirection } from '../app/js/colors/utils.js';

/** Values that are not one of the two colors. */
const NOT_COLORS = [
  ['an unknown color', 'rouge'],
  ['a color in another case', 'Blanche'],
  ['an empty string', ''],
  ['a key of Object.prototype', 'toString'],
  ['undefined', undefined],
  ['null', null],
  ['a number', 1],
  ['an object', { couleur: 'blanche' }],
];

describe('getPawnDirection', () => {
  it('moves a white pawn toward higher ranks', () => {
    expect(getPawnDirection('blanche')).toBe(1);
  });

  it('moves a black pawn toward lower ranks', () => {
    expect(getPawnDirection('noire')).toBe(-1);
  });

  it.each(NOT_COLORS)('returns 0 for %s', (_label, value) => {
    expect(getPawnDirection(value)).toBe(0);
  });
});

describe('getOpponent', () => {
  it('returns black for white', () => {
    expect(getOpponent('blanche')).toBe('noire');
  });

  it('returns white for black', () => {
    expect(getOpponent('noire')).toBe('blanche');
  });

  it.each(NOT_COLORS)('returns null for %s', (_label, value) => {
    expect(getOpponent(value)).toBeNull();
  });
});
