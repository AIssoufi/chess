import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';

let jeu;

beforeEach(() => {
  jeu = new Chessboard();
  jeu.initialize();
});

// ─── Initialisation ────────────────────────────────────────────────────────

describe('Initialisation', () => {
  it('place 32 pièces sur le plateau', () => {
    expect(jeu.board.size).toBe(32);
  });

  it('place le roi blanc en e1', () => {
    expect(jeu.getPiece('e1')).toMatchObject({ type: 'king', color: 'white', hasMoved: false });
  });

  it('place le roi noir en e8', () => {
    expect(jeu.getPiece('e8')).toMatchObject({ type: 'king', color: 'black', hasMoved: false });
  });

  it('commence avec les blancs', () => {
    expect(jeu.currentColor).toBe('white');
  });
});

// ─── Pions ─────────────────────────────────────────────────────────────────

describe('Pion', () => {
  it("peut avancer d'une case", () => {
    expect(jeu.getMoves('e2')).toContain('e3');
  });

  it('peut avancer de deux cases depuis sa position initiale', () => {
    expect(jeu.getMoves('e2')).toContain('e4');
  });

  it("ne peut pas avancer de deux cases s'il a déjà bougé", () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('e4', { type: 'pawn', color: 'white', hasMoved: true });
    const coups = jeu.getMoves('e4');
    expect(coups).toContain('e5');
    expect(coups).not.toContain('e6');
  });

  it('ne peut pas avancer si une pièce bloque', () => {
    jeu.board.set('e3', { type: 'pawn', color: 'black', hasMoved: true });
    const coups = jeu.getMoves('e2');
    expect(coups).not.toContain('e3');
    expect(coups).not.toContain('e4');
  });

  it('capture en diagonale', () => {
    jeu.board.set('d3', { type: 'pawn', color: 'black', hasMoved: true });
    expect(jeu.getMoves('e2')).toContain('d3');
  });
});

// ─── Pièces glissantes ──────────────────────────────────────────────────────

describe('Tour', () => {
  it('se déplace sur toute une rangée libre', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('a4', { type: 'rook', color: 'white', hasMoved: true });
    const coups = jeu.getMoves('a4');
    expect(coups).toContain('h4');
    expect(coups).toContain('a8');
  });

  it('est bloquée par une pièce alliée', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('a4', { type: 'rook', color: 'white', hasMoved: true });
    jeu.board.set('d4', { type: 'pawn', color: 'white', hasMoved: true });
    const coups = jeu.getMoves('a4');
    expect(coups).toContain('c4');
    expect(coups).not.toContain('d4');
    expect(coups).not.toContain('e4');
  });

  it("s'arrête après avoir captured une pièce ennemie", () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('a4', { type: 'rook', color: 'white', hasMoved: true });
    jeu.board.set('d4', { type: 'pawn', color: 'black', hasMoved: true });
    const coups = jeu.getMoves('a4');
    expect(coups).toContain('d4'); // capture
    expect(coups).not.toContain('e4'); // bloquée après
  });
});

// ─── Échec ──────────────────────────────────────────────────────────────────

describe('Échec', () => {
  it('détecte un roi en échec', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('e5', { type: 'rook', color: 'black', hasMoved: true });
    expect(jeu.isInCheck('white')).toBe(true);
  });

  it('ne peut pas jouer un coup qui laisse le roi en échec', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('e5', { type: 'rook', color: 'black', hasMoved: true });
    jeu.board.set('e3', { type: 'rook', color: 'white', hasMoved: true });
    // La tour blanche est clouée — elle ne peut se déplacer que sur la colonne e
    const coups = jeu.getMoves('e3');
    expect(coups.every((c) => c[0] === 'e')).toBe(true);
  });

  it("détecte l'échec et mat", () => {
    jeu.board.clear();
    jeu.board.set('a8', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('h1', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('a1', { type: 'queen', color: 'black', hasMoved: true });
    jeu.board.set('b2', { type: 'rook', color: 'black', hasMoved: true });
    jeu.currentColor = 'white';
    expect(jeu.isCheckmate('white')).toBe(true);
  });

  it('détecte le pat', () => {
    jeu.board.clear();
    jeu.board.set('a8', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('h1', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('b6', { type: 'queen', color: 'black', hasMoved: true });
    jeu.currentColor = 'white';
    expect(jeu.isStalemate('white')).toBe(true);
    expect(jeu.isCheckmate('white')).toBe(false);
  });
});

// ─── Roque ──────────────────────────────────────────────────────────────────

describe('Roque', () => {
  it('petit roque blanc disponible', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: false });
    jeu.board.set('h1', { type: 'rook', color: 'white', hasMoved: false });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    const coups = jeu.getMoves('e1');
    expect(coups).toContain('g1');
  });

  it('grand roque blanc disponible', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: false });
    jeu.board.set('a1', { type: 'rook', color: 'white', hasMoved: false });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    const coups = jeu.getMoves('e1');
    expect(coups).toContain('c1');
  });

  it('roque indisponible si le roi a bougé', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('h1', { type: 'rook', color: 'white', hasMoved: false });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    const coups = jeu.getMoves('e1');
    expect(coups).not.toContain('g1');
  });

  it('roque indisponible si une case de passage est attaquée', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: false });
    jeu.board.set('h1', { type: 'rook', color: 'white', hasMoved: false });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('f8', { type: 'rook', color: 'black', hasMoved: true }); // attaque f1
    const coups = jeu.getMoves('e1');
    expect(coups).not.toContain('g1');
  });

  it('déplacer le roi avec petit roque repositionne la tour', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: false });
    jeu.board.set('h1', { type: 'rook', color: 'white', hasMoved: false });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.move('e1', 'g1');
    expect(jeu.getPiece('g1')).toMatchObject({ type: 'king' });
    expect(jeu.getPiece('f1')).toMatchObject({ type: 'rook' });
    expect(jeu.board.get('h1')).toBeUndefined();
  });
});

// ─── En passant ─────────────────────────────────────────────────────────────

describe('En passant', () => {
  it('est disponible juste après une avance de deux cases', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('e5', { type: 'pawn', color: 'white', hasMoved: true });
    jeu.board.set('d7', { type: 'pawn', color: 'black', hasMoved: false });
    jeu.currentColor = 'black';
    jeu.move('d7', 'd5'); // avance de deux
    jeu.currentColor = 'white';
    expect(jeu.enPassantSquare).toBe('d6');
    expect(jeu.getMoves('e5')).toContain('d6');
  });

  it("capture le pion adverse lors de l'en passant", () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('e5', { type: 'pawn', color: 'white', hasMoved: true });
    jeu.board.set('d5', { type: 'pawn', color: 'black', hasMoved: true });
    jeu.enPassantSquare = 'd6';
    jeu.currentColor = 'white';
    jeu.move('e5', 'd6');
    expect(jeu.getPiece('d5')).toBeNull(); // pion noir supprimé
    expect(jeu.getPiece('d6')).toMatchObject({ type: 'pawn', color: 'white' });
  });
});

// ─── Promotion ──────────────────────────────────────────────────────────────

describe('Promotion', () => {
  it('détecte une promotion quand le pion atteint la dernière rangée', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('a7', { type: 'pawn', color: 'white', hasMoved: true });
    const result = jeu.move('a7', 'a8');
    expect(result.promotion).toBe(true);
    expect(jeu.promotionSquare).toBe('a8');
  });

  it('transforme le pion en dame après promotion', () => {
    jeu.board.clear();
    jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
    jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    jeu.board.set('a7', { type: 'pawn', color: 'white', hasMoved: true });
    jeu.move('a7', 'a8');
    jeu.promote('a8', 'queen');
    expect(jeu.getPiece('a8')).toMatchObject({ type: 'queen', color: 'white' });
  });
});

// ─── Illegal calls ──────────────────────────────────────────────────────────

/** Puts a white pawn on a7 with both kings, then pushes it to a8 so a promotion is pending. */
function reachPendingPromotion() {
  jeu.board.clear();
  jeu.board.set('e1', { type: 'king', color: 'white', hasMoved: true });
  jeu.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
  jeu.board.set('a7', { type: 'pawn', color: 'white', hasMoved: true });
  jeu.move('a7', 'a8');
}

describe('deplacer guards', () => {
  it('rejects a move of the side not to move and leaves the board unchanged', () => {
    expect(jeu.move('e7', 'e5')).toBeNull();
    expect(jeu.getPiece('e7')).toMatchObject({ type: 'pawn', color: 'black' });
    expect(jeu.getPiece('e5')).toBeNull();
    expect(jeu.currentColor).toBe('white');
  });

  it('accepts a move of the side to move', () => {
    expect(jeu.move('e2', 'e4')).not.toBeNull();
    expect(jeu.move('e7', 'e5')).not.toBeNull();
  });

  it('rejects any move while a promotion is pending', () => {
    reachPendingPromotion();
    expect(jeu.move('e1', 'e2')).toBeNull();
    expect(jeu.move('e8', 'e7')).toBeNull();
    expect(jeu.getPiece('e1')).toMatchObject({ type: 'king', color: 'white' });
    expect(jeu.getPiece('e8')).toMatchObject({ type: 'king', color: 'black' });
  });

  it('rejects any move once the game is over', () => {
    jeu.isOver = true;
    expect(jeu.move('e2', 'e4')).toBeNull();
    expect(jeu.getPiece('e2')).toMatchObject({ type: 'pawn', color: 'white' });
  });

  it('rejects a move from an empty or unknown square', () => {
    expect(jeu.move('e4', 'e5')).toBeNull();
    expect(jeu.move('z9', 'e5')).toBeNull();
    expect(jeu.move(undefined, undefined)).toBeNull();
  });
});

describe('promouvoir guards', () => {
  it.each(['queen', 'rook', 'bishop', 'knight'])('promotes the pawn to %s', (type) => {
    reachPendingPromotion();
    expect(jeu.promote('a8', type)).toBe(true);
    expect(jeu.getPiece('a8')).toMatchObject({ type, color: 'white' });
    expect(jeu.promotionSquare).toBeNull();
    expect(jeu.currentColor).toBe('black');
  });

  it.each(['king', 'pawn', '', 'Dame', undefined, null])(
    'ignores the promotion type %s',
    (type) => {
      reachPendingPromotion();
      expect(jeu.promote('a8', type)).toBe(false);
      expect(jeu.getPiece('a8')).toMatchObject({ type: 'pawn', color: 'white' });
      expect(jeu.promotionSquare).toBe('a8');
      expect(jeu.currentColor).toBe('white');
    }
  );

  it('ignores a position other than the pending promotion', () => {
    reachPendingPromotion();
    expect(jeu.promote('e1', 'queen')).toBe(false);
    expect(jeu.getPiece('e1')).toMatchObject({ type: 'king', color: 'white' });
    expect(jeu.promotionSquare).toBe('a8');
    expect(jeu.currentColor).toBe('white');
  });

  it('ignores a call when no promotion is pending', () => {
    expect(jeu.promote('e2', 'queen')).toBe(false);
    expect(jeu.promote(null, 'queen')).toBe(false);
    expect(jeu.getPiece('e2')).toMatchObject({ type: 'pawn' });
    expect(jeu.currentColor).toBe('white');
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
  jeu.board.clear();
  for (const [square, piece] of Object.entries(pieces)) {
    jeu.board.set(square, { hasMoved: true, ...piece });
  }
  jeu.currentColor = colorToPlay;
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

    const moves = jeu.getMoves('e1');
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

    const moves = jeu.getMoves('e1');
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

    expect(jeu.getMoves('e1')).not.toContain('c1');
  });

  it('queenside is allowed when only b1, which the king does not cross, is attacked', () => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, b8: { type: 'rook', color: 'black' } },
    });

    expect(jeu.getMoves('e1')).toContain('c1');
  });

  it('queenside moves the a1 rook to d1', () => {
    setUpBoard({ pieces: UNMOVED_WHITE_KING_AND_ROOKS });

    const result = jeu.move('e1', 'c1');

    expect(result.specialMove).toBe('queenside-castling');
    expect(jeu.getPiece('c1')).toMatchObject({ type: 'king', color: 'white' });
    expect(jeu.getPiece('d1')).toMatchObject({ type: 'rook', color: 'white', hasMoved: true });
    expect(jeu.getPiece('a1')).toBeNull();
  });

  it('is not offered once the rook has been captured on its square', () => {
    setUpBoard({
      // From h1, a knight attacks neither e1, f1 nor g1: only the missing rook forbids castling.
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, g3: { type: 'knight', color: 'black' } },
      colorToPlay: 'black',
    });
    jeu.move('g3', 'h1');

    expect(jeu.getPiece('h1')).toMatchObject({ type: 'knight', color: 'black' });
    expect(jeu.isInCheck('white')).toBe(false);
    const moves = jeu.getMoves('e1');
    expect(moves).not.toContain('g1');
    expect(moves).toContain('c1');
  });

  it('is not offered once the rook has moved, even back to its square', () => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, a7: { type: 'pawn', color: 'black' } },
    });
    jeu.move('h1', 'h2');
    jeu.move('a7', 'a6');
    jeu.move('h2', 'h1');

    const moves = jeu.getMoves('e1');
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

    expect(jeu.getMoves('e1')).not.toContain(kingTarget);
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
    jeu.move('d7', 'd5');
    jeu.move('e1', 'f1');
    jeu.move('e8', 'f8');

    expect(jeu.enPassantSquare).toBeNull();
    expect(jeu.getMoves('e5')).not.toContain('d6');
    expect(jeu.move('e5', 'd6')).toBeNull();
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
    jeu.move('c7', 'c5');

    expect(jeu.enPassantSquare).toBe('c6');
    const moves = jeu.getMoves('b5');
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
    jeu.move('a7', 'a8');
    jeu.promote('a8', 'knight');
    jeu.move('h8', 'h7');

    expect(jeu.getMoves('a8').sort()).toEqual(['b6', 'c7']);
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

    const result = jeu.move('b7', 'a8');

    expect(result).toMatchObject({ promotion: true, captured: { type: 'rook', color: 'black' } });
    expect(jeu.promotionSquare).toBe('a8');
    expect(jeu.captures.white).toEqual([expect.objectContaining({ type: 'rook' })]);
    expect(jeu.getPiece('b7')).toBeNull();
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

    expect(jeu.move('a2', 'a1')).toMatchObject({ promotion: true });
    expect(jeu.promotionSquare).toBe('a1');
    expect(jeu.currentColor).toBe('black');
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

    expect(jeu.move(from, to)).toMatchObject({ promotion: false });
    expect(jeu.promotionSquare).toBeNull();
  });

  it('gives check with the promoted piece once the promotion is done', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        h8: { type: 'king', color: 'black' },
        a7: { type: 'pawn', color: 'white' },
      },
    });
    jeu.move('a7', 'a8');

    expect(jeu.isInCheck('black')).toBe(false);
    jeu.promote('a8', 'queen');
    expect(jeu.currentColor).toBe('black');
    expect(jeu.isInCheck('black')).toBe(true);
    expect(jeu.isCheckmate('black')).toBe(false);
  });
});
