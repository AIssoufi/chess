import { describe, it, expect } from 'vitest';
import { DRAW_REASONS, DRAW_REASON_LABELS } from '../app/js/draws/constants.js';
import { getPositionKey, hasInsufficientMaterial } from '../app/js/draws/utils.js';

const WHITE_KING = Object.freeze({ type: 'king', color: 'white' });
const BLACK_KING = Object.freeze({ type: 'king', color: 'black' });

/**
 * Builds a board with both kings, on e1 and e8, and the given pieces.
 *
 * @param {Record<string, { type: string, color: string }>} [pieces] Other pieces, by square.
 * @returns {Map<string, { type: string, color: string }>} The board.
 */
function boardWith(pieces = {}) {
  return new Map([['e1', WHITE_KING], ['e8', BLACK_KING], ...Object.entries(pieces)]);
}

describe('DRAW_REASON_LABELS', () => {
  it('gives every draw reason a French label', () => {
    for (const reason of Object.values(DRAW_REASONS)) {
      expect(DRAW_REASON_LABELS[reason]).toMatch(/\S/);
    }
  });
});

describe('hasInsufficientMaterial', () => {
  it.each([
    ['the two kings alone', {}],
    ['a king and a bishop against a king', { c1: { type: 'bishop', color: 'white' } }],
    ['a king and a knight against a king', { g8: { type: 'knight', color: 'black' } }],
    [
      'a bishop each, on dark squares',
      { c1: { type: 'bishop', color: 'white' }, f8: { type: 'bishop', color: 'black' } },
    ],
    [
      'a bishop each, on light squares',
      { f1: { type: 'bishop', color: 'white' }, c8: { type: 'bishop', color: 'black' } },
    ],
    [
      'two bishops of one side on squares of the same color',
      { c1: { type: 'bishop', color: 'white' }, e3: { type: 'bishop', color: 'white' } },
    ],
  ])('is true for %s', (_label, pieces) => {
    expect(hasInsufficientMaterial(boardWith(pieces))).toBe(true);
  });

  it.each([
    [
      'a bishop each, on squares of opposite colors',
      { c1: { type: 'bishop', color: 'white' }, c8: { type: 'bishop', color: 'black' } },
    ],
    [
      'a king and two knights against a king',
      { b1: { type: 'knight', color: 'white' }, g1: { type: 'knight', color: 'white' } },
    ],
    [
      'a knight against a bishop',
      { b1: { type: 'knight', color: 'white' }, c8: { type: 'bishop', color: 'black' } },
    ],
    ['a pawn', { e2: { type: 'pawn', color: 'white' } }],
    ['a rook', { a1: { type: 'rook', color: 'white' } }],
    ['a queen', { d8: { type: 'queen', color: 'black' } }],
    ['an unknown piece type', { d8: { type: 'dragon', color: 'black' } }],
    ['a missing piece', { d8: null }],
    ['a bishop off the board', { i9: { type: 'bishop', color: 'white' } }],
  ])('is false for %s', (_label, pieces) => {
    expect(hasInsufficientMaterial(boardWith(pieces))).toBe(false);
  });

  it('is true for an empty board, where no side can mate', () => {
    expect(hasInsufficientMaterial(new Map())).toBe(true);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a plain object', { e1: WHITE_KING }],
    ['an array', [['e1', WHITE_KING]]],
  ])('is false for %s instead of a board', (_label, board) => {
    expect(hasInsufficientMaterial(board)).toBe(false);
  });
});

describe('getPositionKey', () => {
  const position = Object.freeze({
    board: boardWith({ a1: { type: 'rook', color: 'white' } }),
    color: 'white',
    castlingRights: ['white-queenside-castling'],
    enPassantSquare: null,
  });

  it('describes the placement, the side to move, the castling rights and the en passant square', () => {
    expect(getPositionKey({ ...position, enPassantSquare: 'd6' })).toBe(
      'a1:white-rook,e1:white-king,e8:black-king white white-queenside-castling d6'
    );
  });

  it('ignores the order of the board entries and of the castling rights', () => {
    const reversedBoard = new Map([...position.board].reverse());
    const rights = ['white-kingside-castling', 'black-queenside-castling'];

    expect(
      getPositionKey({ ...position, board: reversedBoard, castlingRights: [...rights].reverse() })
    ).toBe(getPositionKey({ ...position, castlingRights: rights }));
  });

  it.each([
    ['side to move', { color: 'black' }],
    ['castling rights', { castlingRights: [] }],
    ['en passant square', { enPassantSquare: 'e3' }],
    ['piece type', { board: boardWith({ a1: { type: 'queen', color: 'white' } }) }],
    ['piece color', { board: boardWith({ a1: { type: 'rook', color: 'black' } }) }],
    ['square', { board: boardWith({ a2: { type: 'rook', color: 'white' } }) }],
  ])('tells two positions apart by their %s', (_label, change) => {
    expect(getPositionKey({ ...position, ...change })).not.toBe(getPositionKey(position));
  });

  it('writes no castling right and no en passant square when they are missing', () => {
    expect(getPositionKey({ board: boardWith(), color: 'black' })).toBe(
      'e1:white-king,e8:black-king black  -'
    );
  });

  it('reads castling rights that are not an array as none', () => {
    expect(getPositionKey({ ...position, castlingRights: 'white-queenside-castling' })).toBe(
      getPositionKey({ ...position, castlingRights: [] })
    );
  });

  it.each([
    ['no parameters', undefined],
    ['a missing board', { color: 'white' }],
    ['a board that is not a Map', { board: {}, color: 'white' }],
  ])('returns null for %s', (_label, params) => {
    expect(getPositionKey(params)).toBeNull();
  });
});
