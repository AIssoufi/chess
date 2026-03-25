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
