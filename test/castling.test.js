import { describe, it, expect } from 'vitest';
import { getCastlingRights, isCastlingRook } from '../app/js/castling/utils.js';

const UNMOVED_WHITE_ROOK = Object.freeze({ type: 'rook', color: 'white', hasMoved: false });

describe('isCastlingRook', () => {
  it.each(['white', 'black'])('accepts an unmoved rook of the king color, %s', (color) => {
    expect(isCastlingRook({ piece: { ...UNMOVED_WHITE_ROOK, color }, color })).toBe(true);
  });

  it('refuses an unmoved rook of the opponent', () => {
    expect(isCastlingRook({ piece: UNMOVED_WHITE_ROOK, color: 'black' })).toBe(false);
  });

  it('refuses a rook that has moved', () => {
    const piece = { ...UNMOVED_WHITE_ROOK, hasMoved: true };

    expect(isCastlingRook({ piece, color: 'white' })).toBe(false);
  });

  it('refuses another unmoved piece of the king color', () => {
    const piece = { ...UNMOVED_WHITE_ROOK, type: 'queen' };

    expect(isCastlingRook({ piece, color: 'white' })).toBe(false);
  });

  it.each([
    ['an empty square', { piece: null, color: 'white' }],
    ['a missing piece', { color: 'white' }],
    ['a missing color', { piece: UNMOVED_WHITE_ROOK }],
    ['a rook and a king without color', { piece: { type: 'rook', hasMoved: false } }],
    ['an unknown color', { piece: { ...UNMOVED_WHITE_ROOK, color: 'red' }, color: 'red' }],
    ['an empty object', {}],
  ])('refuses %s', (_label, params) => {
    expect(isCastlingRook(params)).toBe(false);
  });

  it.each([
    ['no argument', undefined],
    ['null', null],
  ])('refuses %s', (_label, params) => {
    expect(isCastlingRook(params)).toBe(false);
  });
});

describe('getCastlingRights', () => {
  /**
   * Builds a board with the kings and rooks of both colors on their starting squares, unmoved,
   * then applies the changes.
   *
   * @param {Record<string, object | undefined>} [changes] Pieces to put, or to remove with
   *   `undefined`, by square.
   * @returns {Map<string, object>} The board.
   */
  function castlingBoard(changes = {}) {
    const board = new Map();
    for (const [color, rank] of [
      ['white', '1'],
      ['black', '8'],
    ]) {
      board.set(`e${rank}`, { type: 'king', color, hasMoved: false });
      board.set(`a${rank}`, { type: 'rook', color, hasMoved: false });
      board.set(`h${rank}`, { type: 'rook', color, hasMoved: false });
    }
    for (const [square, piece] of Object.entries(changes)) {
      if (piece) board.set(square, piece);
      else board.delete(square);
    }
    return board;
  }

  it('lists the four rights of unmoved kings and rooks, white and kingside first', () => {
    expect(getCastlingRights(castlingBoard())).toEqual([
      'white-kingside-castling',
      'white-queenside-castling',
      'black-kingside-castling',
      'black-queenside-castling',
    ]);
  });

  it('drops both rights of a king that has moved', () => {
    const board = castlingBoard({ e1: { type: 'king', color: 'white', hasMoved: true } });

    expect(getCastlingRights(board)).toEqual([
      'black-kingside-castling',
      'black-queenside-castling',
    ]);
  });

  it('drops the right of a rook that has moved, or is gone', () => {
    const board = castlingBoard({ h8: { type: 'rook', color: 'black', hasMoved: true } });

    expect(getCastlingRights(board)).toContain('black-queenside-castling');
    expect(getCastlingRights(board)).not.toContain('black-kingside-castling');
    expect(getCastlingRights(castlingBoard({ a1: undefined }))).not.toContain(
      'white-queenside-castling'
    );
  });

  it('gives no right to a king off its starting square, nor to a piece of the other color', () => {
    const board = castlingBoard({
      e1: undefined,
      d1: { type: 'king', color: 'white', hasMoved: false },
      a8: { type: 'rook', color: 'white', hasMoved: false },
    });

    expect(getCastlingRights(board)).toEqual(['black-kingside-castling']);
  });

  it('returns no right for an empty board', () => {
    expect(getCastlingRights(new Map())).toEqual([]);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a plain object', { e1: { type: 'king', color: 'white', hasMoved: false } }],
  ])('returns no right for %s instead of a board', (_label, board) => {
    expect(getCastlingRights(board)).toEqual([]);
  });
});
