import { describe, it, expect } from 'vitest';
import { getPieceLabel, getSquareLabel } from '../app/js/labels/utils.js';

const PIECE_NAMES = [
  ['king', 'white', 'roi blanc'],
  ['king', 'black', 'roi noir'],
  ['queen', 'white', 'dame blanche'],
  ['queen', 'black', 'dame noire'],
  ['rook', 'white', 'tour blanche'],
  ['rook', 'black', 'tour noire'],
  ['bishop', 'white', 'fou blanc'],
  ['bishop', 'black', 'fou noir'],
  ['knight', 'white', 'cavalier blanc'],
  ['knight', 'black', 'cavalier noir'],
  ['pawn', 'white', 'pion blanc'],
  ['pawn', 'black', 'pion noir'],
];
/** Pieces whose type or color is unknown, missing or of the wrong type. */
const UNKNOWN_PIECES = [
  ['an unknown type', { type: 'unicorn', color: 'white' }],
  ['a type in another case', { type: 'Queen', color: 'white' }],
  ['a key of Object.prototype as type', { type: 'toString', color: 'white' }],
  ['an unknown color', { type: 'queen', color: 'red' }],
  ['a key of Object.prototype as color', { type: 'queen', color: 'constructor' }],
  ['a missing type', { color: 'black' }],
  ['a missing color', { type: 'queen' }],
  ['null values', { type: null, color: null }],
  ['numbers', { type: 1, color: 2 }],
  ['an empty object', {}],
];

describe('getPieceLabel', () => {
  it.each(PIECE_NAMES)('names the %s of color %s "%s"', (type, color, expected) => {
    expect(getPieceLabel({ type, color })).toBe(expected);
  });

  it.each(UNKNOWN_PIECES)('returns null for %s', (_, piece) => {
    expect(getPieceLabel(piece)).toBeNull();
  });

  it('returns null without parameters', () => {
    expect(getPieceLabel()).toBeNull();
  });
});

describe('getSquareLabel', () => {
  it.each(PIECE_NAMES)('names a square with the %s of color %s', (type, color, expected) => {
    expect(getSquareLabel({ square: 'e2', piece: { type, color } })).toBe(`e2, ${expected}`);
  });

  it.each([['a1'], ['h1'], ['a8'], ['h8'], ['e4']])('names the empty square %s', (square) => {
    expect(getSquareLabel({ square })).toBe(`${square}, vide`);
  });

  it('names a square whose piece is null as empty', () => {
    expect(getSquareLabel({ square: 'e4', piece: null })).toBe('e4, vide');
  });

  it.each(UNKNOWN_PIECES)('names a square with %s as empty', (_, piece) => {
    expect(getSquareLabel({ square: 'e4', piece })).toBe('e4, vide');
  });

  it('adds that the selected piece can move to the square', () => {
    expect(getSquareLabel({ square: 'e4', isPossibleMove: true })).toBe('e4, vide, coup possible');
    expect(
      getSquareLabel({
        square: 'd5',
        piece: { type: 'pawn', color: 'black' },
        isPossibleMove: true,
      })
    ).toBe('d5, pion noir, coup possible');
  });

  it('adds that the king on the square is in check', () => {
    expect(
      getSquareLabel({ square: 'e1', piece: { type: 'king', color: 'white' }, isCheck: true })
    ).toBe('e1, roi blanc, en échec');
  });

  it('adds both, the move first, when both apply', () => {
    expect(getSquareLabel({ square: 'e8', isPossibleMove: true, isCheck: true })).toBe(
      'e8, vide, coup possible, en échec'
    );
  });

  it.each([['true'], [1], ['yes']])('ignores the flags when they are %j, not true', (flag) => {
    expect(getSquareLabel({ square: 'e4', isPossibleMove: flag, isCheck: flag })).toBe('e4, vide');
  });

  it.each([['i1'], ['a0'], ['a9'], ['E2'], ['e22'], [''], [undefined], [null], [12]])(
    'returns null for %j, which is no square',
    (square) => {
      expect(getSquareLabel({ square, piece: { type: 'pawn', color: 'white' } })).toBeNull();
    }
  );

  it('returns null without parameters', () => {
    expect(getSquareLabel()).toBeNull();
  });
});
