import { describe, it, expect } from 'vitest';
import { getMoveLog, isOpponentPiece } from '../app/js/moves/utils.js';

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

describe('getMoveLog', () => {
  it('logs the squares of a move', () => {
    expect(getMoveLog({ from: 'e2', to: 'e4' })).toBe('e2 → e4');
  });

  it.each([
    ['kingside-castling', 'e1', 'g1', 'e1 → g1 (petit-roque)'],
    ['queenside-castling', 'e8', 'c8', 'e8 → c8 (grand-roque)'],
    ['en-passant', 'e5', 'd6', 'e5 → d6 (en-passant)'],
  ])('names a %s', (specialMove, from, to, log) => {
    expect(getMoveLog({ from, to, specialMove })).toBe(log);
  });

  it('logs the squares alone for an unknown special move', () => {
    expect(getMoveLog({ from: 'e2', to: 'e4', specialMove: 'teleport' })).toBe('e2 → e4');
  });

  it.each([
    ['no move', undefined],
    ['null', null],
    ['an empty move', {}],
    ['a move without target', { from: 'e2' }],
    ['a target that is not a square', { from: 'e2', to: 'e9' }],
  ])('logs nothing for %s', (_label, move) => {
    expect(getMoveLog(move)).toBeNull();
  });
});
