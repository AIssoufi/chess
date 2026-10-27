import { describe, it, expect } from 'vitest';
import { isOpponentPiece } from '../app/js/moves/utils.js';

const WHITE_PAWN = Object.freeze({ type: 'pawn', color: 'white', hasMoved: false });
const BLACK_ROOK = Object.freeze({ type: 'rook', color: 'black', hasMoved: false });

describe('isOpponentPiece', () => {
  it('returns true for a piece of the other color', () => {
    expect(isOpponentPiece({ piece: BLACK_ROOK, color: 'white' })).toBe(true);
    expect(isOpponentPiece({ piece: WHITE_PAWN, color: 'black' })).toBe(true);
  });

  it('returns false for a piece of the same color', () => {
    expect(isOpponentPiece({ piece: WHITE_PAWN, color: 'white' })).toBe(false);
  });

  it.each([
    ['an empty square', { piece: undefined, color: 'white' }],
    ['a null piece', { piece: null, color: 'white' }],
    ['a missing color', { piece: WHITE_PAWN }],
    ['an unknown color', { piece: WHITE_PAWN, color: 'red' }],
    ['an empty object', {}],
    ['null params', null],
    ['missing params', undefined],
  ])('returns false for %s', (_label, params) => {
    expect(isOpponentPiece(params)).toBe(false);
  });
});
