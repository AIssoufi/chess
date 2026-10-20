import { describe, it, expect, beforeEach } from 'vitest';
import Echiquier from '../app/js/Echiquier.js';

let jeu;

beforeEach(() => {
  jeu = new Echiquier();
  jeu.initialiser();
});

// ─── Initialisation ────────────────────────────────────────────────────────

describe('Initialisation', () => {
  it('place 32 pièces sur le plateau', () => {
    expect(jeu.plateau.size).toBe(32);
  });

  it('place le roi blanc en e1', () => {
    expect(jeu.getPièce('e1')).toMatchObject({ type: 'roi', couleur: 'blanche', aBouge: false });
  });

  it('place le roi noir en e8', () => {
    expect(jeu.getPièce('e8')).toMatchObject({ type: 'roi', couleur: 'noire', aBouge: false });
  });

  it('commence avec les blancs', () => {
    expect(jeu.couleurCourante).toBe('blanche');
  });
});

// ─── Pions ─────────────────────────────────────────────────────────────────

describe('Pion', () => {
  it("peut avancer d'une case", () => {
    expect(jeu.getDeplacementsPossibles('e2')).toContain('e3');
  });

  it('peut avancer de deux cases depuis sa position initiale', () => {
    expect(jeu.getDeplacementsPossibles('e2')).toContain('e4');
  });

  it("ne peut pas avancer de deux cases s'il a déjà bougé", () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('e4', { type: 'pion', couleur: 'blanche', aBouge: true });
    const coups = jeu.getDeplacementsPossibles('e4');
    expect(coups).toContain('e5');
    expect(coups).not.toContain('e6');
  });

  it('ne peut pas avancer si une pièce bloque', () => {
    jeu.plateau.set('e3', { type: 'pion', couleur: 'noire', aBouge: true });
    const coups = jeu.getDeplacementsPossibles('e2');
    expect(coups).not.toContain('e3');
    expect(coups).not.toContain('e4');
  });

  it('capture en diagonale', () => {
    jeu.plateau.set('d3', { type: 'pion', couleur: 'noire', aBouge: true });
    expect(jeu.getDeplacementsPossibles('e2')).toContain('d3');
  });
});

// ─── Pièces glissantes ──────────────────────────────────────────────────────

describe('Tour', () => {
  it('se déplace sur toute une rangée libre', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('a4', { type: 'tour', couleur: 'blanche', aBouge: true });
    const coups = jeu.getDeplacementsPossibles('a4');
    expect(coups).toContain('h4');
    expect(coups).toContain('a8');
  });

  it('est bloquée par une pièce alliée', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('a4', { type: 'tour', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('d4', { type: 'pion', couleur: 'blanche', aBouge: true });
    const coups = jeu.getDeplacementsPossibles('a4');
    expect(coups).toContain('c4');
    expect(coups).not.toContain('d4');
    expect(coups).not.toContain('e4');
  });

  it("s'arrête après avoir capturé une pièce ennemie", () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('a4', { type: 'tour', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('d4', { type: 'pion', couleur: 'noire', aBouge: true });
    const coups = jeu.getDeplacementsPossibles('a4');
    expect(coups).toContain('d4'); // capture
    expect(coups).not.toContain('e4'); // bloquée après
  });
});

// ─── Échec ──────────────────────────────────────────────────────────────────

describe('Échec', () => {
  it('détecte un roi en échec', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('e5', { type: 'tour', couleur: 'noire', aBouge: true });
    expect(jeu.estEnEchec('blanche')).toBe(true);
  });

  it('ne peut pas jouer un coup qui laisse le roi en échec', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('e5', { type: 'tour', couleur: 'noire', aBouge: true });
    jeu.plateau.set('e3', { type: 'tour', couleur: 'blanche', aBouge: true });
    // La tour blanche est clouée — elle ne peut se déplacer que sur la colonne e
    const coups = jeu.getDeplacementsPossibles('e3');
    expect(coups.every((c) => c[0] === 'e')).toBe(true);
  });

  it("détecte l'échec et mat", () => {
    jeu.plateau.clear();
    jeu.plateau.set('a8', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('h1', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('a1', { type: 'dame', couleur: 'noire', aBouge: true });
    jeu.plateau.set('b2', { type: 'tour', couleur: 'noire', aBouge: true });
    jeu.couleurCourante = 'blanche';
    expect(jeu.estEchecEtMat('blanche')).toBe(true);
  });

  it('détecte le pat', () => {
    jeu.plateau.clear();
    jeu.plateau.set('a8', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('h1', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('b6', { type: 'dame', couleur: 'noire', aBouge: true });
    jeu.couleurCourante = 'blanche';
    expect(jeu.estPat('blanche')).toBe(true);
    expect(jeu.estEchecEtMat('blanche')).toBe(false);
  });
});

// ─── Roque ──────────────────────────────────────────────────────────────────

describe('Roque', () => {
  it('petit roque blanc disponible', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: false });
    jeu.plateau.set('h1', { type: 'tour', couleur: 'blanche', aBouge: false });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    const coups = jeu.getDeplacementsPossibles('e1');
    expect(coups).toContain('g1');
  });

  it('grand roque blanc disponible', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: false });
    jeu.plateau.set('a1', { type: 'tour', couleur: 'blanche', aBouge: false });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    const coups = jeu.getDeplacementsPossibles('e1');
    expect(coups).toContain('c1');
  });

  it('roque indisponible si le roi a bougé', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('h1', { type: 'tour', couleur: 'blanche', aBouge: false });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    const coups = jeu.getDeplacementsPossibles('e1');
    expect(coups).not.toContain('g1');
  });

  it('roque indisponible si une case de passage est attaquée', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: false });
    jeu.plateau.set('h1', { type: 'tour', couleur: 'blanche', aBouge: false });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('f8', { type: 'tour', couleur: 'noire', aBouge: true }); // attaque f1
    const coups = jeu.getDeplacementsPossibles('e1');
    expect(coups).not.toContain('g1');
  });

  it('déplacer le roi avec petit roque repositionne la tour', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: false });
    jeu.plateau.set('h1', { type: 'tour', couleur: 'blanche', aBouge: false });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.deplacer('e1', 'g1');
    expect(jeu.getPièce('g1')).toMatchObject({ type: 'roi' });
    expect(jeu.getPièce('f1')).toMatchObject({ type: 'tour' });
    expect(jeu.plateau.get('h1')).toBeUndefined();
  });
});

// ─── En passant ─────────────────────────────────────────────────────────────

describe('En passant', () => {
  it('est disponible juste après une avance de deux cases', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('e5', { type: 'pion', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('d7', { type: 'pion', couleur: 'noire', aBouge: false });
    jeu.couleurCourante = 'noire';
    jeu.deplacer('d7', 'd5'); // avance de deux
    jeu.couleurCourante = 'blanche';
    expect(jeu.positionEnPassant).toBe('d6');
    expect(jeu.getDeplacementsPossibles('e5')).toContain('d6');
  });

  it("capture le pion adverse lors de l'en passant", () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('e5', { type: 'pion', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('d5', { type: 'pion', couleur: 'noire', aBouge: true });
    jeu.positionEnPassant = 'd6';
    jeu.couleurCourante = 'blanche';
    jeu.deplacer('e5', 'd6');
    expect(jeu.getPièce('d5')).toBeNull(); // pion noir supprimé
    expect(jeu.getPièce('d6')).toMatchObject({ type: 'pion', couleur: 'blanche' });
  });
});

// ─── Promotion ──────────────────────────────────────────────────────────────

describe('Promotion', () => {
  it('détecte une promotion quand le pion atteint la dernière rangée', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('a7', { type: 'pion', couleur: 'blanche', aBouge: true });
    const result = jeu.deplacer('a7', 'a8');
    expect(result.promotion).toBe(true);
    expect(jeu.positionPromotion).toBe('a8');
  });

  it('transforme le pion en dame après promotion', () => {
    jeu.plateau.clear();
    jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
    jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
    jeu.plateau.set('a7', { type: 'pion', couleur: 'blanche', aBouge: true });
    jeu.deplacer('a7', 'a8');
    jeu.promouvoir('a8', 'dame');
    expect(jeu.getPièce('a8')).toMatchObject({ type: 'dame', couleur: 'blanche' });
  });
});

// ─── Illegal calls ──────────────────────────────────────────────────────────

/** Puts a white pawn on a7 with both kings, then pushes it to a8 so a promotion is pending. */
function reachPendingPromotion() {
  jeu.plateau.clear();
  jeu.plateau.set('e1', { type: 'roi', couleur: 'blanche', aBouge: true });
  jeu.plateau.set('e8', { type: 'roi', couleur: 'noire', aBouge: true });
  jeu.plateau.set('a7', { type: 'pion', couleur: 'blanche', aBouge: true });
  jeu.deplacer('a7', 'a8');
}

describe('deplacer guards', () => {
  it('rejects a move of the side not to move and leaves the board unchanged', () => {
    expect(jeu.deplacer('e7', 'e5')).toBeNull();
    expect(jeu.getPièce('e7')).toMatchObject({ type: 'pion', couleur: 'noire' });
    expect(jeu.getPièce('e5')).toBeNull();
    expect(jeu.couleurCourante).toBe('blanche');
  });

  it('accepts a move of the side to move', () => {
    expect(jeu.deplacer('e2', 'e4')).not.toBeNull();
    expect(jeu.deplacer('e7', 'e5')).not.toBeNull();
  });

  it('rejects any move while a promotion is pending', () => {
    reachPendingPromotion();
    expect(jeu.deplacer('e1', 'e2')).toBeNull();
    expect(jeu.deplacer('e8', 'e7')).toBeNull();
    expect(jeu.getPièce('e1')).toMatchObject({ type: 'roi', couleur: 'blanche' });
    expect(jeu.getPièce('e8')).toMatchObject({ type: 'roi', couleur: 'noire' });
  });

  it('rejects any move once the game is over', () => {
    jeu.termine = true;
    expect(jeu.deplacer('e2', 'e4')).toBeNull();
    expect(jeu.getPièce('e2')).toMatchObject({ type: 'pion', couleur: 'blanche' });
  });

  it('rejects a move from an empty or unknown square', () => {
    expect(jeu.deplacer('e4', 'e5')).toBeNull();
    expect(jeu.deplacer('z9', 'e5')).toBeNull();
    expect(jeu.deplacer(undefined, undefined)).toBeNull();
  });
});

describe('promouvoir guards', () => {
  it.each(['dame', 'tour', 'fou', 'cavalier'])('promotes the pawn to %s', (type) => {
    reachPendingPromotion();
    expect(jeu.promouvoir('a8', type)).toBe(true);
    expect(jeu.getPièce('a8')).toMatchObject({ type, couleur: 'blanche' });
    expect(jeu.positionPromotion).toBeNull();
    expect(jeu.couleurCourante).toBe('noire');
  });

  it.each(['roi', 'pion', '', 'Dame', undefined, null])('ignores the promotion type %s', (type) => {
    reachPendingPromotion();
    expect(jeu.promouvoir('a8', type)).toBe(false);
    expect(jeu.getPièce('a8')).toMatchObject({ type: 'pion', couleur: 'blanche' });
    expect(jeu.positionPromotion).toBe('a8');
    expect(jeu.couleurCourante).toBe('blanche');
  });

  it('ignores a position other than the pending promotion', () => {
    reachPendingPromotion();
    expect(jeu.promouvoir('e1', 'dame')).toBe(false);
    expect(jeu.getPièce('e1')).toMatchObject({ type: 'roi', couleur: 'blanche' });
    expect(jeu.positionPromotion).toBe('a8');
    expect(jeu.couleurCourante).toBe('blanche');
  });

  it('ignores a call when no promotion is pending', () => {
    expect(jeu.promouvoir('e2', 'dame')).toBe(false);
    expect(jeu.promouvoir(null, 'dame')).toBe(false);
    expect(jeu.getPièce('e2')).toMatchObject({ type: 'pion' });
    expect(jeu.couleurCourante).toBe('blanche');
  });
});

// ─── Rule edge cases ────────────────────────────────────────────────────────

/**
 * Empties the board, then puts the given pieces on it and gives the move to a color.
 *
 * @param {object} params
 * @param {Record<string, { type: string, couleur: string, aBouge?: boolean }>} params.pieces
 *   Pieces by square; `aBouge` defaults to true.
 * @param {'blanche' | 'noire'} [params.colorToPlay] The color to play, white by default.
 */
function setUpBoard({ pieces, colorToPlay = 'blanche' }) {
  jeu.plateau.clear();
  for (const [square, piece] of Object.entries(pieces)) {
    jeu.plateau.set(square, { aBouge: true, ...piece });
  }
  jeu.couleurCourante = colorToPlay;
}

/** The white king and both white rooks on their starting squares, with the black king on e8. */
const UNMOVED_WHITE_KING_AND_ROOKS = Object.freeze({
  e1: { type: 'roi', couleur: 'blanche', aBouge: false },
  a1: { type: 'tour', couleur: 'blanche', aBouge: false },
  h1: { type: 'tour', couleur: 'blanche', aBouge: false },
  e8: { type: 'roi', couleur: 'noire' },
});

describe('castling edge cases', () => {
  it('is not offered to a king in check', () => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, e5: { type: 'tour', couleur: 'noire' } },
    });

    const moves = jeu.getDeplacementsPossibles('e1');
    expect(moves).not.toContain('g1');
    expect(moves).not.toContain('c1');
  });

  it.each(['b1', 'c1', 'd1'])('queenside is blocked by a piece on %s', (square) => {
    setUpBoard({
      pieces: {
        ...UNMOVED_WHITE_KING_AND_ROOKS,
        [square]: { type: 'cavalier', couleur: 'blanche' },
      },
    });

    const moves = jeu.getDeplacementsPossibles('e1');
    expect(moves).not.toContain('c1');
    expect(moves).toContain('g1');
  });

  it.each([
    ['d1', 'd8'],
    ['c1', 'c8'],
  ])('queenside is refused when %s is attacked', (_attackedSquare, rookSquare) => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, [rookSquare]: { type: 'tour', couleur: 'noire' } },
    });

    expect(jeu.getDeplacementsPossibles('e1')).not.toContain('c1');
  });

  it('queenside is allowed when only b1, which the king does not cross, is attacked', () => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, b8: { type: 'tour', couleur: 'noire' } },
    });

    expect(jeu.getDeplacementsPossibles('e1')).toContain('c1');
  });

  it('queenside moves the a1 rook to d1', () => {
    setUpBoard({ pieces: UNMOVED_WHITE_KING_AND_ROOKS });

    const result = jeu.deplacer('e1', 'c1');

    expect(result.coupSpécial).toBe('grand-roque');
    expect(jeu.getPièce('c1')).toMatchObject({ type: 'roi', couleur: 'blanche' });
    expect(jeu.getPièce('d1')).toMatchObject({ type: 'tour', couleur: 'blanche', aBouge: true });
    expect(jeu.getPièce('a1')).toBeNull();
  });

  it('is not offered once the rook has been captured on its square', () => {
    setUpBoard({
      // From h1, a knight attacks neither e1, f1 nor g1: only the missing rook forbids castling.
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, g3: { type: 'cavalier', couleur: 'noire' } },
      colorToPlay: 'noire',
    });
    jeu.deplacer('g3', 'h1');

    expect(jeu.getPièce('h1')).toMatchObject({ type: 'cavalier', couleur: 'noire' });
    expect(jeu.estEnEchec('blanche')).toBe(false);
    const moves = jeu.getDeplacementsPossibles('e1');
    expect(moves).not.toContain('g1');
    expect(moves).toContain('c1');
  });

  it('is not offered once the rook has moved, even back to its square', () => {
    setUpBoard({
      pieces: { ...UNMOVED_WHITE_KING_AND_ROOKS, a7: { type: 'pion', couleur: 'noire' } },
    });
    jeu.deplacer('h1', 'h2');
    jeu.deplacer('a7', 'a6');
    jeu.deplacer('h2', 'h1');

    const moves = jeu.getDeplacementsPossibles('e1');
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
        [rookSquare]: { type: 'tour', couleur: 'noire', aBouge: false },
      },
    });

    expect(jeu.getDeplacementsPossibles('e1')).not.toContain(kingTarget);
  });
});

describe('en passant edge cases', () => {
  it('expires when it is not taken on the very next move', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'roi', couleur: 'blanche' },
        e8: { type: 'roi', couleur: 'noire' },
        e5: { type: 'pion', couleur: 'blanche' },
        d7: { type: 'pion', couleur: 'noire', aBouge: false },
      },
      colorToPlay: 'noire',
    });
    jeu.deplacer('d7', 'd5');
    jeu.deplacer('e1', 'f1');
    jeu.deplacer('e8', 'f8');

    expect(jeu.positionEnPassant).toBeNull();
    expect(jeu.getDeplacementsPossibles('e5')).not.toContain('d6');
    expect(jeu.deplacer('e5', 'd6')).toBeNull();
  });

  it('is refused when removing both pawns opens the rank to the king', () => {
    setUpBoard({
      pieces: {
        a5: { type: 'roi', couleur: 'blanche' },
        b5: { type: 'pion', couleur: 'blanche' },
        h5: { type: 'tour', couleur: 'noire' },
        e8: { type: 'roi', couleur: 'noire' },
        c7: { type: 'pion', couleur: 'noire', aBouge: false },
      },
      colorToPlay: 'noire',
    });
    jeu.deplacer('c7', 'c5');

    expect(jeu.positionEnPassant).toBe('c6');
    const moves = jeu.getDeplacementsPossibles('b5');
    expect(moves).not.toContain('c6');
    expect(moves).toContain('b6');
  });
});

describe('promotion edge cases', () => {
  it('promotes to a knight that then moves like a knight', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'roi', couleur: 'blanche' },
        h8: { type: 'roi', couleur: 'noire' },
        a7: { type: 'pion', couleur: 'blanche' },
      },
    });
    jeu.deplacer('a7', 'a8');
    jeu.promouvoir('a8', 'cavalier');
    jeu.deplacer('h8', 'h7');

    expect(jeu.getDeplacementsPossibles('a8').sort()).toEqual(['b6', 'c7']);
  });

  it('promotes by capturing and records the captured piece', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'roi', couleur: 'blanche' },
        h8: { type: 'roi', couleur: 'noire' },
        b7: { type: 'pion', couleur: 'blanche' },
        a8: { type: 'tour', couleur: 'noire' },
      },
    });

    const result = jeu.deplacer('b7', 'a8');

    expect(result).toMatchObject({ promotion: true, capturé: { type: 'tour', couleur: 'noire' } });
    expect(jeu.positionPromotion).toBe('a8');
    expect(jeu.captures.blanche).toEqual([expect.objectContaining({ type: 'tour' })]);
    expect(jeu.getPièce('b7')).toBeNull();
  });

  it('promotes a black pawn on the first rank', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'roi', couleur: 'blanche' },
        h8: { type: 'roi', couleur: 'noire' },
        a2: { type: 'pion', couleur: 'noire' },
      },
      colorToPlay: 'noire',
    });

    expect(jeu.deplacer('a2', 'a1')).toMatchObject({ promotion: true });
    expect(jeu.positionPromotion).toBe('a1');
    expect(jeu.couleurCourante).toBe('noire');
  });

  it.each([
    ['a white pawn on the seventh rank', { from: 'a6', to: 'a7', couleur: 'blanche' }],
    ['a black pawn on the second rank', { from: 'a3', to: 'a2', couleur: 'noire' }],
  ])('does not promote %s', (_label, { from, to, couleur }) => {
    setUpBoard({
      pieces: {
        e1: { type: 'roi', couleur: 'blanche' },
        h8: { type: 'roi', couleur: 'noire' },
        [from]: { type: 'pion', couleur },
      },
      colorToPlay: couleur,
    });

    expect(jeu.deplacer(from, to)).toMatchObject({ promotion: false });
    expect(jeu.positionPromotion).toBeNull();
  });

  it('gives check with the promoted piece once the promotion is done', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'roi', couleur: 'blanche' },
        h8: { type: 'roi', couleur: 'noire' },
        a7: { type: 'pion', couleur: 'blanche' },
      },
    });
    jeu.deplacer('a7', 'a8');

    expect(jeu.estEnEchec('noire')).toBe(false);
    jeu.promouvoir('a8', 'dame');
    expect(jeu.couleurCourante).toBe('noire');
    expect(jeu.estEnEchec('noire')).toBe(true);
    expect(jeu.estEchecEtMat('noire')).toBe(false);
  });
});
