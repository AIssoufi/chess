import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';
import { DRAW_REASONS } from '../app/js/draws/constants.js';

let game;

beforeEach(() => {
  game = new Chessboard();
  game.initialize();
});

// ─── Setup ──────────────────────────────────────────────────────────────────

describe('Setup', () => {
  it('places 32 pieces on the board', () => {
    expect(game.board.size).toBe(32);
  });

  it('places the white king on e1', () => {
    expect(game.getPiece('e1')).toMatchObject({ type: 'king', color: 'white', hasMoved: false });
  });

  it('places the black king on e8', () => {
    expect(game.getPiece('e8')).toMatchObject({ type: 'king', color: 'black', hasMoved: false });
  });

  it('starts with white', () => {
    expect(game.currentColor).toBe('white');
  });
});

// ─── Pawns ──────────────────────────────────────────────────────────────────

describe('Pawn', () => {
  it('can advance one square', () => {
    expect(game.getMoves('e2')).toContain('e3');
  });

  it('can advance two squares from its starting square', () => {
    expect(game.getMoves('e2')).toContain('e4');
  });

  it('cannot advance two squares once it has moved', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('e4', { type: 'pawn', color: 'white', hasMoved: true });
    const moves = game.getMoves('e4');
    expect(moves).toContain('e5');
    expect(moves).not.toContain('e6');
  });

  it('cannot advance when a piece blocks it', () => {
    game.board.set('e3', { type: 'pawn', color: 'black', hasMoved: true });
    const moves = game.getMoves('e2');
    expect(moves).not.toContain('e3');
    expect(moves).not.toContain('e4');
  });

  it('captures diagonally', () => {
    game.board.set('d3', { type: 'pawn', color: 'black', hasMoved: true });
    expect(game.getMoves('e2')).toContain('d3');
  });
});

// ─── Sliding pieces ─────────────────────────────────────────────────────────

describe('Rook', () => {
  it('moves along a whole free line', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('a4', { type: 'rook', color: 'white', hasMoved: true });
    const moves = game.getMoves('a4');
    expect(moves).toContain('h4');
    expect(moves).toContain('a8');
  });

  it('is blocked by a piece of its side', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('a4', { type: 'rook', color: 'white', hasMoved: true });
    game.board.set('d4', { type: 'pawn', color: 'white', hasMoved: true });
    const moves = game.getMoves('a4');
    expect(moves).toContain('c4');
    expect(moves).not.toContain('d4');
    expect(moves).not.toContain('e4');
  });

  it('stops after capturing an enemy piece', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('a4', { type: 'rook', color: 'white', hasMoved: true });
    game.board.set('d4', { type: 'pawn', color: 'black', hasMoved: true });
    const moves = game.getMoves('a4');
    expect(moves).toContain('d4'); // capture
    expect(moves).not.toContain('e4'); // blocked beyond
  });
});

// ─── Check ──────────────────────────────────────────────────────────────────

describe('Check', () => {
  it('detects a king in check', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('e5', { type: 'rook', color: 'black', hasMoved: true });
    expect(game.isInCheck('white')).toBe(true);
  });

  it('cannot play a move that leaves the king in check', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('e5', { type: 'rook', color: 'black', hasMoved: true });
    game.board.set('e3', { type: 'rook', color: 'white', hasMoved: true });
    // The white rook is pinned: it can only move along the e file
    const moves = game.getMoves('e3');
    expect(moves.every((c) => c[0] === 'e')).toBe(true);
  });

  it('detects checkmate', () => {
    game.board.clear();
    game.board.set('a8', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('h1', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('a1', { type: 'queen', color: 'black', hasMoved: true });
    game.board.set('b2', { type: 'rook', color: 'black', hasMoved: true });
    game.currentColor = 'white';
    expect(game.isCheckmate('white')).toBe(true);
  });

  it('detects stalemate', () => {
    game.board.clear();
    game.board.set('a8', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('h1', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('b6', { type: 'queen', color: 'black', hasMoved: true });
    game.currentColor = 'white';
    expect(game.isStalemate('white')).toBe(true);
    expect(game.isCheckmate('white')).toBe(false);
  });
});

// ─── Castling ───────────────────────────────────────────────────────────────

describe('Castling', () => {
  it('offers white kingside castling', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: false });
    game.board.set('h1', { type: 'rook', color: 'white', hasMoved: false });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    const moves = game.getMoves('e1');
    expect(moves).toContain('g1');
  });

  it('offers white queenside castling', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: false });
    game.board.set('a1', { type: 'rook', color: 'white', hasMoved: false });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    const moves = game.getMoves('e1');
    expect(moves).toContain('c1');
  });

  it('refuses castling once the king has moved', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('h1', { type: 'rook', color: 'white', hasMoved: false });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    const moves = game.getMoves('e1');
    expect(moves).not.toContain('g1');
  });

  it('refuses castling when a square the king crosses is attacked', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: false });
    game.board.set('h1', { type: 'rook', color: 'white', hasMoved: false });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('f8', { type: 'rook', color: 'black', hasMoved: true }); // attacks f1
    const moves = game.getMoves('e1');
    expect(moves).not.toContain('g1');
  });

  it('moves the rook when the king castles kingside', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: false });
    game.board.set('h1', { type: 'rook', color: 'white', hasMoved: false });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.move({ from: 'e1', to: 'g1' });
    expect(game.getPiece('g1')).toMatchObject({ type: 'king' });
    expect(game.getPiece('f1')).toMatchObject({ type: 'rook' });
    expect(game.board.get('h1')).toBeUndefined();
  });

  it.each([
    {
      side: 'kingside',
      kingTarget: 'g8',
      rookFrom: 'h8',
      rookTo: 'f8',
      specialMove: 'kingside-castling',
    },
    {
      side: 'queenside',
      kingTarget: 'c8',
      rookFrom: 'a8',
      rookTo: 'd8',
      specialMove: 'queenside-castling',
    },
  ])('castles black $side on the eighth rank', ({ kingTarget, rookFrom, rookTo, specialMove }) => {
    game.board.clear();
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: false });
    game.board.set(rookFrom, { type: 'rook', color: 'black', hasMoved: false });
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.currentColor = 'black';
    expect(game.getMoves('e8')).toContain(kingTarget);

    const result = game.move({ from: 'e8', to: kingTarget });

    expect(result.specialMove).toBe(specialMove);
    expect(game.getPiece(kingTarget)).toMatchObject({ type: 'king', color: 'black' });
    expect(game.getPiece(rookTo)).toMatchObject({ type: 'rook', color: 'black', hasMoved: true });
    expect(game.getPiece(rookFrom)).toBeNull();
  });
});

// ─── En passant ─────────────────────────────────────────────────────────────

describe('En passant', () => {
  it('is available right after a two-square advance', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('e5', { type: 'pawn', color: 'white', hasMoved: true });
    game.board.set('d7', { type: 'pawn', color: 'black', hasMoved: false });
    game.currentColor = 'black';
    game.move({ from: 'd7', to: 'd5' }); // two-square advance
    game.currentColor = 'white';
    expect(game.enPassantSquare).toBe('d6');
    expect(game.getMoves('e5')).toContain('d6');
  });

  it('captures the opponent pawn en passant', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('e5', { type: 'pawn', color: 'white', hasMoved: true });
    game.board.set('d5', { type: 'pawn', color: 'black', hasMoved: true });
    game.enPassantSquare = 'd6';
    game.currentColor = 'white';
    game.move({ from: 'e5', to: 'd6' });
    expect(game.getPiece('d5')).toBeNull(); // black pawn removed
    expect(game.getPiece('d6')).toMatchObject({ type: 'pawn', color: 'white' });
  });
});

// ─── Promotion ──────────────────────────────────────────────────────────────

describe('Promotion', () => {
  it('detects a promotion when the pawn reaches the last rank', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('a7', { type: 'pawn', color: 'white', hasMoved: true });
    const result = game.move({ from: 'a7', to: 'a8' });
    expect(result.promotion).toBe(true);
    expect(game.promotionSquare).toBe('a8');
  });

  it('turns the pawn into a queen on promotion', () => {
    game.board.clear();
    game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('a7', { type: 'pawn', color: 'white', hasMoved: true });
    game.move({ from: 'a7', to: 'a8' });
    game.promote({ position: 'a8', type: 'queen' });
    expect(game.getPiece('a8')).toMatchObject({ type: 'queen', color: 'white' });
  });
});

// ─── Illegal calls ──────────────────────────────────────────────────────────

/** Puts a white pawn on a7 with both kings, then pushes it to a8 so a promotion is pending. */
function reachPendingPromotion() {
  game.board.clear();
  game.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
  game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
  game.board.set('a7', { type: 'pawn', color: 'white', hasMoved: true });
  game.move({ from: 'a7', to: 'a8' });
}

describe('move guards', () => {
  it('rejects a move of the side not to move and leaves the board unchanged', () => {
    expect(game.move({ from: 'e7', to: 'e5' })).toBeNull();
    expect(game.getPiece('e7')).toMatchObject({ type: 'pawn', color: 'black' });
    expect(game.getPiece('e5')).toBeNull();
    expect(game.currentColor).toBe('white');
  });

  it('accepts a move of the side to move', () => {
    expect(game.move({ from: 'e2', to: 'e4' })).not.toBeNull();
    expect(game.move({ from: 'e7', to: 'e5' })).not.toBeNull();
  });

  it('rejects any move while a promotion is pending', () => {
    reachPendingPromotion();
    expect(game.move({ from: 'e1', to: 'e2' })).toBeNull();
    expect(game.move({ from: 'e8', to: 'e7' })).toBeNull();
    expect(game.getPiece('e1')).toMatchObject({ type: 'king', color: 'white' });
    expect(game.getPiece('e8')).toMatchObject({ type: 'king', color: 'black' });
  });

  it('rejects any move once the game is over', () => {
    game.isOver = true;
    expect(game.move({ from: 'e2', to: 'e4' })).toBeNull();
    expect(game.getPiece('e2')).toMatchObject({ type: 'pawn', color: 'white' });
  });

  it('rejects a move from an empty or unknown square', () => {
    expect(game.move({ from: 'e4', to: 'e5' })).toBeNull();
    expect(game.move({ from: 'z9', to: 'e5' })).toBeNull();
    expect(game.move({ from: undefined, to: undefined })).toBeNull();
    expect(game.move({})).toBeNull();
    expect(game.move()).toBeNull();
    expect(game.move(null)).toBeNull();
    expect(game.move('e2', 'e4')).toBeNull(); // a caller of the old positional signature
  });
});

describe('promote guards', () => {
  it.each(['queen', 'rook', 'bishop', 'knight'])('promotes the pawn to %s', (type) => {
    reachPendingPromotion();
    expect(game.promote({ position: 'a8', type })).toBe(true);
    expect(game.getPiece('a8')).toMatchObject({ type, color: 'white' });
    expect(game.promotionSquare).toBeNull();
    expect(game.currentColor).toBe('black');
  });

  it.each(['king', 'pawn', '', 'Queen', undefined, null])(
    'ignores the promotion type %s',
    (type) => {
      reachPendingPromotion();
      expect(game.promote({ position: 'a8', type })).toBe(false);
      expect(game.getPiece('a8')).toMatchObject({ type: 'pawn', color: 'white' });
      expect(game.promotionSquare).toBe('a8');
      expect(game.currentColor).toBe('white');
    }
  );

  it('ignores a position other than the pending promotion', () => {
    reachPendingPromotion();
    expect(game.promote({ position: 'e1', type: 'queen' })).toBe(false);
    expect(game.getPiece('e1')).toMatchObject({ type: 'king', color: 'white' });
    expect(game.promotionSquare).toBe('a8');
    expect(game.currentColor).toBe('white');
  });

  it('ignores a call when no promotion is pending', () => {
    expect(game.promote({ position: 'e2', type: 'queen' })).toBe(false);
    expect(game.promote({ position: null, type: 'queen' })).toBe(false);
    expect(game.promote()).toBe(false);
    expect(game.promote(null)).toBe(false);
    expect(game.getPiece('e2')).toMatchObject({ type: 'pawn' });
    expect(game.currentColor).toBe('white');
  });
});

// ─── Rule edge cases ────────────────────────────────────────────────────────

/**
 * Empties the board, then puts the given pieces on it and gives the move to a color.
 *
 * @param {object} params
 * @param {Record<string, { type: string, color: string, hasMoved?: boolean }>} params.pieces
 *   Pieces by square; `hasMoved` defaults to true.
 * @param {'white' | 'black'} [params.colorToPlay] The color to play, white by default.
 */
function setUpBoard({ pieces, colorToPlay = 'white' }) {
  game.board.clear();
  for (const [square, piece] of Object.entries(pieces)) {
    game.board.set(square, { hasMoved: true, ...piece });
  }
  game.currentColor = colorToPlay;
}

/** The white king and both white rooks on their starting squares, with the black king on e8. */
const UNMOVED_WHITE_KING_AND_ROOKS = Object.freeze({
  e1: { type: 'king', color: 'white', hasMoved: false },
  a1: { type: 'rook', color: 'white', hasMoved: false },
  h1: { type: 'rook', color: 'white', hasMoved: false },
  e8: { type: 'king', color: 'black' },
});

describe('castling edge cases', () => {
  it('is not offered to a king in check', () => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, e5: { type: 'rook', color: 'black' } },
    });

    const moves = game.getMoves('e1');
    expect(moves).not.toContain('g1');
    expect(moves).not.toContain('c1');
  });

  it.each(['b1', 'c1', 'd1'])('queenside is blocked by a piece on %s', (square) => {
    setUpBoard({
      pieces: {
        ...UNMOVED_WHITE_KING_AND_ROOKS,
        [square]: { type: 'knight', color: 'white' },
      },
    });

    const moves = game.getMoves('e1');
    expect(moves).not.toContain('c1');
    expect(moves).toContain('g1');
  });

  it.each([
    ['d1', 'd8'],
    ['c1', 'c8'],
  ])('queenside is refused when %s is attacked', (_attackedSquare, rookSquare) => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, [rookSquare]: { type: 'rook', color: 'black' } },
    });

    expect(game.getMoves('e1')).not.toContain('c1');
  });

  it('queenside is allowed when only b1, which the king does not cross, is attacked', () => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, b8: { type: 'rook', color: 'black' } },
    });

    expect(game.getMoves('e1')).toContain('c1');
  });

  it('queenside moves the a1 rook to d1', () => {
    setUpBoard({ pieces: UNMOVED_WHITE_KING_AND_ROOKS });

    const result = game.move({ from: 'e1', to: 'c1' });

    expect(result.specialMove).toBe('queenside-castling');
    expect(game.getPiece('c1')).toMatchObject({ type: 'king', color: 'white' });
    expect(game.getPiece('d1')).toMatchObject({ type: 'rook', color: 'white', hasMoved: true });
    expect(game.getPiece('a1')).toBeNull();
  });

  it('is not offered once the rook has been captured on its square', () => {
    setUpBoard({
      // From h1, a knight attacks neither e1, f1 nor g1: only the missing rook forbids castling.
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, g3: { type: 'knight', color: 'black' } },
      colorToPlay: 'black',
    });
    game.move({ from: 'g3', to: 'h1' });

    expect(game.getPiece('h1')).toMatchObject({ type: 'knight', color: 'black' });
    expect(game.isInCheck('white')).toBe(false);
    const moves = game.getMoves('e1');
    expect(moves).not.toContain('g1');
    expect(moves).toContain('c1');
  });

  it('is not offered once the rook has moved, even back to its square', () => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, a7: { type: 'pawn', color: 'black' } },
    });
    game.move({ from: 'h1', to: 'h2' });
    game.move({ from: 'a7', to: 'a6' });
    game.move({ from: 'h2', to: 'h1' });

    const moves = game.getMoves('e1');
    expect(moves).not.toContain('g1');
    expect(moves).toContain('c1');
  });

  it.each([
    ['kingside', 'h1', 'g1'],
    ['queenside', 'a1', 'c1'],
  ])('%s is not offered with an unmoved opponent rook on %s', (_side, rookSquare, kingTarget) => {
    // The opponent rook also attacks the squares the king crosses, so this position is refused
    // either way: isCastlingRook is what refuses the rook itself, see test/castling.test.js.
    setUpBoard({
      pieces: {
        ...UNMOVED_WHITE_KING_AND_ROOKS,
        [rookSquare]: { type: 'rook', color: 'black', hasMoved: false },
      },
    });

    expect(game.getMoves('e1')).not.toContain(kingTarget);
  });
});

describe('en passant edge cases', () => {
  it('expires when it is not taken on the very next move', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        e8: { type: 'king', color: 'black' },
        e5: { type: 'pawn', color: 'white' },
        d7: { type: 'pawn', color: 'black', hasMoved: false },
      },
      colorToPlay: 'black',
    });
    game.move({ from: 'd7', to: 'd5' });
    game.move({ from: 'e1', to: 'f1' });
    game.move({ from: 'e8', to: 'f8' });

    expect(game.enPassantSquare).toBeNull();
    expect(game.getMoves('e5')).not.toContain('d6');
    expect(game.move({ from: 'e5', to: 'd6' })).toBeNull();
  });

  it('is refused when removing both pawns opens the rank to the king', () => {
    setUpBoard({
      pieces: {
        a5: { type: 'king', color: 'white' },
        b5: { type: 'pawn', color: 'white' },
        h5: { type: 'rook', color: 'black' },
        e8: { type: 'king', color: 'black' },
        c7: { type: 'pawn', color: 'black', hasMoved: false },
      },
      colorToPlay: 'black',
    });
    game.move({ from: 'c7', to: 'c5' });

    expect(game.enPassantSquare).toBe('c6');
    const moves = game.getMoves('b5');
    expect(moves).not.toContain('c6');
    expect(moves).toContain('b6');
  });

  it('is not offered to a white pawn beside the white pawn that just advanced two squares', () => {
    game.move({ from: 'e2', to: 'e4' });

    expect(game.getMoves('d2')).toEqual(['d3', 'd4']);
    expect(game.getMoves('f2')).toEqual(['f3', 'f4']);
  });

  it('is not offered to a black pawn beside the black pawn that just advanced two squares', () => {
    game.move({ from: 'a2', to: 'a3' });
    game.move({ from: 'e7', to: 'e5' });

    expect(game.getMoves('d7')).toEqual(['d6', 'd5']);
    expect(game.getMoves('f7')).toEqual(['f6', 'f5']);
  });

  it.each([
    ['an own pawn', { type: 'pawn', color: 'white' }],
    ['an opponent knight', { type: 'knight', color: 'black' }],
    ['no piece', null],
  ])('is not offered when the square behind the target holds %s', (_label, behind) => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        e8: { type: 'king', color: 'black' },
        e5: { type: 'pawn', color: 'white' },
        ...(behind && { d5: behind }),
      },
    });
    game.enPassantSquare = 'd6';

    expect(game.getMoves('e5')).not.toContain('d6');
    expect(game.move({ from: 'e5', to: 'd6' })).toBeNull();
  });
});

describe('promotion edge cases', () => {
  it('promotes to a knight that then moves like a knight', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        h8: { type: 'king', color: 'black' },
        a7: { type: 'pawn', color: 'white' },
      },
    });
    game.move({ from: 'a7', to: 'a8' });
    game.promote({ position: 'a8', type: 'knight' });
    game.move({ from: 'h8', to: 'h7' });

    expect(game.getMoves('a8').sort()).toEqual(['b6', 'c7']);
  });

  it('promotes by capturing and records the captured piece', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        h8: { type: 'king', color: 'black' },
        b7: { type: 'pawn', color: 'white' },
        a8: { type: 'rook', color: 'black' },
      },
    });

    const result = game.move({ from: 'b7', to: 'a8' });

    expect(result).toMatchObject({ promotion: true, captured: { type: 'rook', color: 'black' } });
    expect(game.promotionSquare).toBe('a8');
    expect(game.captures.white).toEqual([expect.objectContaining({ type: 'rook' })]);
    expect(game.getPiece('b7')).toBeNull();
  });

  it('promotes a black pawn on the first rank', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        h8: { type: 'king', color: 'black' },
        a2: { type: 'pawn', color: 'black' },
      },
      colorToPlay: 'black',
    });

    expect(game.move({ from: 'a2', to: 'a1' })).toMatchObject({ promotion: true });
    expect(game.promotionSquare).toBe('a1');
    expect(game.currentColor).toBe('black');
  });

  it.each([
    ['a white pawn on the seventh rank', { from: 'a6', to: 'a7', color: 'white' }],
    ['a black pawn on the second rank', { from: 'a3', to: 'a2', color: 'black' }],
  ])('does not promote %s', (_label, { from, to, color }) => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        h8: { type: 'king', color: 'black' },
        [from]: { type: 'pawn', color },
      },
      colorToPlay: color,
    });

    expect(game.move({ from, to })).toMatchObject({ promotion: false });
    expect(game.promotionSquare).toBeNull();
  });

  it('gives check with the promoted piece once the promotion is done', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        h8: { type: 'king', color: 'black' },
        a7: { type: 'pawn', color: 'white' },
      },
    });
    game.move({ from: 'a7', to: 'a8' });

    expect(game.isInCheck('black')).toBe(false);
    game.promote({ position: 'a8', type: 'queen' });
    expect(game.currentColor).toBe('black');
    expect(game.isInCheck('black')).toBe(true);
    expect(game.isCheckmate('black')).toBe(false);
  });
});

// ─── Game end and draw rules ────────────────────────────────────────────────

/**
 * Plays moves written as `'from-to'`, such as `'g1-f3'`.
 *
 * @param {string[]} moves The moves, in order.
 * @returns {Array<object | null>} What `move` returned for each one.
 */
function playMoves(moves) {
  return moves.map((move) => {
    const [from, to] = move.split('-');
    return game.move({ from, to });
  });
}

/** Both knights of each side leave and come back: four half-moves that repeat the position. */
const KNIGHT_ROUND_TRIP = Object.freeze(['g1-f3', 'g8-f6', 'f3-g1', 'f6-g8']);

/** The same round trip with black to move first. */
const BLACK_FIRST_KNIGHT_ROUND_TRIP = Object.freeze(['g8-f6', 'g1-f3', 'f6-g8', 'f3-g1']);

/** Both kings and a rook each, which is enough material to mate, with white to move. */
const KINGS_AND_ROOKS = Object.freeze({
  e1: { type: 'king', color: 'white' },
  a1: { type: 'rook', color: 'white' },
  e8: { type: 'king', color: 'black' },
  h8: { type: 'rook', color: 'black' },
});

/** The rooks of `KINGS_AND_ROOKS` leave and come back: four half-moves, white first. */
const ROOK_ROUND_TRIP = Object.freeze(['a1-a2', 'h8-h7', 'a2-a1', 'h7-h8']);

describe('half-move clock', () => {
  it('starts at zero and counts the moves without a capture or a pawn move', () => {
    expect(game.halfMoveClock).toBe(0);
    playMoves(['g1-f3', 'g8-f6']);
    expect(game.halfMoveClock).toBe(2);
  });

  it('is reset by a pawn move', () => {
    playMoves(['g1-f3', 'e7-e5']);
    expect(game.halfMoveClock).toBe(0);
  });

  it('is reset by a capture', () => {
    setUpBoard({ pieces: { ...KINGS_AND_ROOKS, a8: { type: 'knight', color: 'black' } } });
    game.halfMoveClock = 10;
    playMoves(['a1-a8']);
    expect(game.halfMoveClock).toBe(0);
  });

  it('is reset by an en passant capture', () => {
    setUpBoard({
      pieces: {
        ...KINGS_AND_ROOKS,
        e5: { type: 'pawn', color: 'white' },
        d5: { type: 'pawn', color: 'black' },
      },
    });
    game.enPassantSquare = 'd6';
    game.halfMoveClock = 10;
    expect(playMoves(['e5-d6'])).toEqual([expect.objectContaining({ specialMove: 'en-passant' })]);
    expect(game.halfMoveClock).toBe(0);
  });

  it('stays at zero through a promotion, then counts again', () => {
    setUpBoard({ pieces: { ...KINGS_AND_ROOKS, b7: { type: 'pawn', color: 'white' } } });
    game.halfMoveClock = 10;
    playMoves(['b7-b8']);
    expect(game.halfMoveClock).toBe(0);
    game.promote({ position: 'b8', type: 'bishop' });
    expect(game.halfMoveClock).toBe(0);
    expect(playMoves(['h8-h7'])).toEqual([expect.objectContaining({ to: 'h7' })]);
    expect(game.halfMoveClock).toBe(1);
  });
});

describe('fifty-move rule', () => {
  beforeEach(() => {
    setUpBoard({ pieces: KINGS_AND_ROOKS });
    game.halfMoveClock = 98;
  });

  it('does not end the game after 99 half-moves', () => {
    playMoves(['a1-a2']);
    expect(game.halfMoveClock).toBe(99);
    expect(game.getDrawReason()).toBeNull();
    expect(game.isOver).toBe(false);
  });

  it('ends the game after 100 half-moves without a capture or a pawn move', () => {
    playMoves(['a1-a2', 'h8-h7']);
    expect(game.getDrawReason()).toBe(DRAW_REASONS.fiftyMoveRule);
    expect(game.isOver).toBe(true);
    expect(playMoves(['a2-a3'])).toEqual([null]);
  });

  it('does not end the game when the 100th half-move is a pawn move', () => {
    setUpBoard({ pieces: { ...KINGS_AND_ROOKS, b2: { type: 'pawn', color: 'white' } } });
    game.halfMoveClock = 99;
    playMoves(['b2-b3']);
    expect(game.halfMoveClock).toBe(0);
    expect(game.isOver).toBe(false);
  });
});

describe('threefold repetition', () => {
  it('records the starting position once', () => {
    expect(game.positionCounts.get(game.positionKey)).toBe(1);
    expect(game.positionCounts.size).toBe(1);
  });

  it('does not end the game when a position occurs twice', () => {
    playMoves(KNIGHT_ROUND_TRIP);
    expect(game.positionCounts.get(game.positionKey)).toBe(2);
    expect(game.getDrawReason()).toBeNull();
    expect(game.isOver).toBe(false);
  });

  it('ends the game when a position occurs a third time', () => {
    playMoves([...KNIGHT_ROUND_TRIP, ...KNIGHT_ROUND_TRIP]);
    expect(game.getDrawReason()).toBe(DRAW_REASONS.threefoldRepetition);
    expect(game.isOver).toBe(true);
    expect(playMoves(['e2-e4'])).toEqual([null]);
  });

  it('tells apart the same placement with the other side to move', () => {
    setUpBoard({ pieces: KINGS_AND_ROOKS });
    playMoves([...ROOK_ROUND_TRIP, ...ROOK_ROUND_TRIP]);
    // The white rook takes three moves to come back, so black is to move this time
    playMoves(['a1-a3', 'h8-h7', 'a3-a2', 'h7-h8', 'a2-a1']);

    expect(game.currentColor).toBe('black');
    expect(game.getDrawReason()).toBeNull();
    expect(game.isOver).toBe(false);
  });

  it('tells apart the same placement with other castling rights', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white', hasMoved: false },
        h1: { type: 'rook', color: 'white', hasMoved: false },
        b1: { type: 'knight', color: 'white' },
        e8: { type: 'king', color: 'black' },
        a8: { type: 'rook', color: 'black' },
      },
    });
    const knightRoundTrip = ['b1-c3', 'a8-a7', 'c3-b1', 'a7-a8'];
    playMoves([...knightRoundTrip, ...knightRoundTrip]);
    // The rook comes back to h1, but white has lost the right to castle kingside
    playMoves(['h1-h2', 'a8-a7', 'h2-h1', 'a7-a8']);

    expect(game.getDrawReason()).toBeNull();
    expect(game.isOver).toBe(false);
  });

  it('ignores an en passant square where no pawn can take', () => {
    playMoves(['e2-e4', ...BLACK_FIRST_KNIGHT_ROUND_TRIP, ...BLACK_FIRST_KNIGHT_ROUND_TRIP]);
    expect(game.getDrawReason()).toBe(DRAW_REASONS.threefoldRepetition);
    expect(game.isOver).toBe(true);
  });

  it('counts an en passant square where a pawn can take', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        e5: { type: 'pawn', color: 'white' },
        e8: { type: 'king', color: 'black' },
        d7: { type: 'pawn', color: 'black', hasMoved: false },
      },
      colorToPlay: 'black',
    });
    const kingRoundTrip = ['e1-e2', 'e8-e7', 'e2-e1', 'e7-e8'];
    playMoves(['d7-d5', ...kingRoundTrip, ...kingRoundTrip]);

    expect(game.getDrawReason()).toBeNull();
    expect(game.isOver).toBe(false);
  });
});

describe('insufficient material', () => {
  it('ends the game when a capture leaves the two kings alone', () => {
    setUpBoard({
      pieces: {
        d1: { type: 'king', color: 'white' },
        e2: { type: 'rook', color: 'black' },
        h8: { type: 'king', color: 'black' },
      },
    });
    playMoves(['d1-e2']);

    expect(game.getDrawReason()).toBe(DRAW_REASONS.insufficientMaterial);
    expect(game.isOver).toBe(true);
    expect(playMoves(['h8-h7'])).toEqual([null]);
  });

  it('goes on when a capture leaves a king and two knights against a king', () => {
    setUpBoard({
      pieces: {
        d1: { type: 'king', color: 'white' },
        b1: { type: 'knight', color: 'white' },
        g1: { type: 'knight', color: 'white' },
        e2: { type: 'rook', color: 'black' },
        h8: { type: 'king', color: 'black' },
      },
    });
    playMoves(['d1-e2']);

    expect(game.getDrawReason()).toBeNull();
    expect(game.isOver).toBe(false);
  });

  it('ends the game when a promotion to a knight leaves a king and a knight against a king', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        a7: { type: 'pawn', color: 'white' },
        h8: { type: 'king', color: 'black' },
      },
    });
    playMoves(['a7-a8']);
    expect(game.isOver).toBe(false);
    game.promote({ position: 'a8', type: 'knight' });

    expect(game.getDrawReason()).toBe(DRAW_REASONS.insufficientMaterial);
    expect(game.isOver).toBe(true);
  });
});

describe('game end', () => {
  it('ends the game on checkmate', () => {
    playMoves(['f2-f3', 'e7-e5', 'g2-g4', 'd8-h4']);
    expect(game.isCheckmate('white')).toBe(true);
    expect(game.getDrawReason()).toBeNull();
    expect(game.isOver).toBe(true);
  });

  it('ends the game on stalemate', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        f5: { type: 'queen', color: 'white' },
        h8: { type: 'king', color: 'black' },
      },
    });
    playMoves(['f5-g6']);
    expect(game.isStalemate('black')).toBe(true);
    expect(game.isOver).toBe(true);
  });

  it('goes on while the side to move has a legal move and no draw rule applies', () => {
    playMoves(['e2-e4', 'e7-e5']);
    expect(game.isOver).toBe(false);
  });

  it('is cleared by initialize, with the clock and the repetitions', () => {
    playMoves([...KNIGHT_ROUND_TRIP, ...KNIGHT_ROUND_TRIP, 'g1-f3']);
    game.initialize();

    expect(game.isOver).toBe(false);
    expect(game.halfMoveClock).toBe(0);
    expect(game.positionCounts.size).toBe(1);
    expect(game.getDrawReason()).toBeNull();
  });
});
