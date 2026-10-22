import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';

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
