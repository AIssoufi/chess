import cavalier from './pieces/cavalier.js';
import dame from './pieces/dame.js';
import fou from './pieces/fou.js';
import pion from './pieces/pion.js';
import roi from './pieces/roi.js';
import tour from './pieces/tour.js';

const COLONNES = 'abcdefgh';

function col(lettre) {
  return COLONNES.indexOf(lettre);
}
function lettre(c) {
  return COLONNES[c];
}
function pos(c, r) {
  return `${lettre(c)}${r}`;
}
function valide(c, r) {
  return c >= 0 && c < 8 && r >= 1 && r <= 8;
}

function construirePositionInitiale() {
  const configs = [cavalier, dame, fou, pion, roi, tour];
  const positions = {};
  for (const config of configs) {
    for (const couleur of ['blanche', 'noire']) {
      for (const p of config.pièce.positionInitiale[couleur]) {
        positions[p] = { type: config.pièce.type, couleur, aBouge: false };
      }
    }
  }
  return positions;
}

export default class Echiquier {
  constructor() {
    this.plateau = new Map();
    this.couleurCourante = 'blanche';
    this.positionEnPassant = null; // case cible où un pion peut être capturé en passant
    this.positionPromotion = null; // case où une promotion est en attente
    this.captures = { blanche: [], noire: [] }; // pièces capturées par chaque couleur
    this.termine = false;
  }

  initialiser() {
    const initial = construirePositionInitiale();
    this.plateau = new Map(Object.entries(initial).map(([p, piece]) => [p, { ...piece }]));
    this.couleurCourante = 'blanche';
    this.positionEnPassant = null;
    this.positionPromotion = null;
    this.captures = { blanche: [], noire: [] };
    this.termine = false;
  }

  getPièce(position) {
    return this.plateau.get(position) ?? null;
  }

  // ─── Génération de coups bruts (sans validation d'échec) ─────────────────

  _coupsSliding(c, r, couleur, directions, maxPas, coups) {
    for (const [dc, dr] of directions) {
      for (let i = 1; i <= maxPas; i++) {
        const nc = c + dc * i;
        const nr = r + dr * i;
        if (!valide(nc, nr)) break;
        const dest = pos(nc, nr);
        const cible = this.plateau.get(dest);
        if (cible) {
          if (cible.couleur !== couleur) coups.push(dest); // capture
          break; // bloqué
        }
        coups.push(dest);
      }
    }
  }

  /**
   * Retourne les coups bruts d'une pièce, sans vérifier si le roi reste en échec.
   * @param {string} position
   * @param {object} piece
   * @param {boolean} pourAttaque — true : les pions attaquent en diagonale sans pièce ennemie requise
   */
  _coupsRaw(position, piece, pourAttaque = false) {
    const c = col(position[0]);
    const r = parseInt(position[1]);
    const coups = [];
    const dir = piece.couleur === 'blanche' ? 1 : -1;

    switch (piece.type) {
      case 'tour':
        this._coupsSliding(
          c,
          r,
          piece.couleur,
          [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
          ],
          7,
          coups
        );
        break;

      case 'fou':
        this._coupsSliding(
          c,
          r,
          piece.couleur,
          [
            [1, 1],
            [1, -1],
            [-1, -1],
            [-1, 1],
          ],
          7,
          coups
        );
        break;

      case 'dame':
        this._coupsSliding(
          c,
          r,
          piece.couleur,
          [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, -1],
            [-1, 1],
          ],
          7,
          coups
        );
        break;

      case 'roi':
        this._coupsSliding(
          c,
          r,
          piece.couleur,
          [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, -1],
            [-1, 1],
          ],
          1,
          coups
        );
        break;

      case 'cavalier':
        for (const [dx, dy] of [
          [1, 2],
          [-1, 2],
          [2, 1],
          [2, -1],
          [-2, 1],
          [-2, -1],
          [1, -2],
          [-1, -2],
        ]) {
          const nc = c + dx;
          const nr = r + dy;
          if (valide(nc, nr)) {
            const dest = pos(nc, nr);
            const cible = this.plateau.get(dest);
            if (!cible || cible.couleur !== piece.couleur) coups.push(dest);
          }
        }
        break;

      case 'pion':
        // Avance (non-attaque)
        if (!pourAttaque) {
          const devant = pos(c, r + dir);
          if (valide(c, r + dir) && !this.plateau.get(devant)) {
            coups.push(devant);
            // Double avance depuis la position initiale
            if (!piece.aBouge) {
              const deuxDevant = pos(c, r + 2 * dir);
              if (valide(c, r + 2 * dir) && !this.plateau.get(deuxDevant)) {
                coups.push(deuxDevant);
              }
            }
          }
        }
        // Captures diagonales
        for (const dx of [-1, 1]) {
          const nc = c + dx;
          const nr = r + dir;
          if (valide(nc, nr)) {
            const dest = pos(nc, nr);
            const cible = this.plateau.get(dest);
            if (pourAttaque || (cible && cible.couleur !== piece.couleur)) {
              coups.push(dest);
            }
            // En passant
            if (!pourAttaque && dest === this.positionEnPassant) {
              coups.push(dest);
            }
          }
        }
        break;
    }

    return coups;
  }

  // ─── Vérification d'échec ─────────────────────────────────────────────────

  _casesAttaquéesParCouleur(couleur) {
    const attaques = new Set();
    for (const [p, piece] of this.plateau) {
      if (piece.couleur === couleur) {
        for (const dest of this._coupsRaw(p, piece, true)) {
          attaques.add(dest);
        }
      }
    }
    return attaques;
  }

  estEnEchec(couleur) {
    let posRoi = null;
    for (const [p, piece] of this.plateau) {
      if (piece.type === 'roi' && piece.couleur === couleur) {
        posRoi = p;
        break;
      }
    }
    if (!posRoi) return false;
    const adversaire = couleur === 'blanche' ? 'noire' : 'blanche';
    return this._casesAttaquéesParCouleur(adversaire).has(posRoi);
  }

  // Simule un coup et retourne vrai si le roi de la couleur donnée se retrouve en échec
  _laisseRoiEnEchec(from, to) {
    const piece = this.plateau.get(from);
    const capturé = this.plateau.get(to);

    // En passant : position du pion capturé
    let posEnPassant = null;
    let pioncapturéEnPassant = null;
    if (piece.type === 'pion' && to === this.positionEnPassant) {
      const dir = piece.couleur === 'blanche' ? 1 : -1;
      posEnPassant = `${to[0]}${parseInt(to[1]) - dir}`;
      pioncapturéEnPassant = this.plateau.get(posEnPassant);
    }

    // Effectuer le coup
    this.plateau.set(to, piece);
    this.plateau.delete(from);
    if (posEnPassant) this.plateau.delete(posEnPassant);

    const enEchec = this.estEnEchec(piece.couleur);

    // Annuler le coup
    this.plateau.set(from, piece);
    if (capturé) this.plateau.set(to, capturé);
    else this.plateau.delete(to);
    if (posEnPassant && pioncapturéEnPassant) this.plateau.set(posEnPassant, pioncapturéEnPassant);

    return enEchec;
  }

  // ─── Coups valides (avec validation d'échec + roque) ─────────────────────

  getDeplacementsPossibles(position) {
    const piece = this.plateau.get(position);
    if (!piece) return [];

    const coups = this._coupsRaw(position, piece);

    // Ajouter le roque pour le roi
    if (piece.type === 'roi' && !piece.aBouge && !this.estEnEchec(piece.couleur)) {
      const r = parseInt(position[1]);
      const adversaire = piece.couleur === 'blanche' ? 'noire' : 'blanche';
      const attaques = this._casesAttaquéesParCouleur(adversaire);

      // Petit roque (côté roi)
      const tourH = this.plateau.get(`h${r}`);
      if (
        tourH?.type === 'tour' &&
        !tourH.aBouge &&
        !this.plateau.get(`f${r}`) &&
        !this.plateau.get(`g${r}`) &&
        !attaques.has(`f${r}`) &&
        !attaques.has(`g${r}`)
      ) {
        coups.push(`g${r}`);
      }

      // Grand roque (côté dame)
      const tourA = this.plateau.get(`a${r}`);
      if (
        tourA?.type === 'tour' &&
        !tourA.aBouge &&
        !this.plateau.get(`b${r}`) &&
        !this.plateau.get(`c${r}`) &&
        !this.plateau.get(`d${r}`) &&
        !attaques.has(`c${r}`) &&
        !attaques.has(`d${r}`)
      ) {
        coups.push(`c${r}`);
      }
    }

    // Filtrer les coups qui laissent le roi en échec
    return coups.filter((dest) => !this._laisseRoiEnEchec(position, dest));
  }

  // ─── État de la partie ────────────────────────────────────────────────────

  _aucunCoupPossible(couleur) {
    // On prend un snapshot du plateau car _laisseRoiEnEchec modifie et restaure
    // les entrées de la Map, ce qui peut changer leur ordre d'insertion et provoquer
    // une boucle infinie si on itère la Map directement.
    const entrées = [...this.plateau.entries()];
    for (const [p, piece] of entrées) {
      if (piece.couleur === couleur && this.getDeplacementsPossibles(p).length > 0) {
        return false;
      }
    }
    return true;
  }

  estEchecEtMat(couleur) {
    return this.estEnEchec(couleur) && this._aucunCoupPossible(couleur);
  }

  estPat(couleur) {
    return !this.estEnEchec(couleur) && this._aucunCoupPossible(couleur);
  }

  // ─── Exécution d'un coup ──────────────────────────────────────────────────

  /**
   * Déplace une pièce de `from` vers `to`.
   * Retourne un objet décrivant le coup, ou null si le coup est invalide.
   */
  deplacer(from, to) {
    const piece = this.plateau.get(from);
    if (!piece) return null;

    const coupsPossibles = this.getDeplacementsPossibles(from);
    if (!coupsPossibles.includes(to)) return null;

    const capturé = this.plateau.get(to) ?? null;
    let coupSpécial = null;
    let posCapturéEnPassant = null;

    // ── Roque ──
    const colFrom = col(from[0]);
    const colTo = col(to[0]);
    if (piece.type === 'roi' && Math.abs(colFrom - colTo) === 2) {
      const r = parseInt(to[1]);
      if (colTo > colFrom) {
        // Petit roque
        const t = this.plateau.get(`h${r}`);
        this.plateau.set(`f${r}`, { ...t, aBouge: true });
        this.plateau.delete(`h${r}`);
        coupSpécial = 'petit-roque';
      } else {
        // Grand roque
        const t = this.plateau.get(`a${r}`);
        this.plateau.set(`d${r}`, { ...t, aBouge: true });
        this.plateau.delete(`a${r}`);
        coupSpécial = 'grand-roque';
      }
    }

    // ── En passant : capture du pion adverse ──
    if (piece.type === 'pion' && to === this.positionEnPassant) {
      const dir = piece.couleur === 'blanche' ? 1 : -1;
      posCapturéEnPassant = `${to[0]}${parseInt(to[1]) - dir}`;
      const pionCapturé = this.plateau.get(posCapturéEnPassant);
      if (pionCapturé) {
        this.captures[piece.couleur].push(pionCapturé);
        this.plateau.delete(posCapturéEnPassant);
      }
      coupSpécial = 'en-passant';
    }

    // ── Mettre à jour la cible en passant ──
    if (piece.type === 'pion' && Math.abs(parseInt(to[1]) - parseInt(from[1])) === 2) {
      const milieu = (parseInt(from[1]) + parseInt(to[1])) / 2;
      this.positionEnPassant = `${from[0]}${milieu}`;
    } else {
      this.positionEnPassant = null;
    }

    // ── Déplacer la pièce ──
    this.plateau.set(to, { ...piece, aBouge: true });
    this.plateau.delete(from);

    // ── Enregistrer la capture ──
    if (capturé) this.captures[piece.couleur].push(capturé);

    // ── Promotion ──
    const promotion = piece.type === 'pion' && (to[1] === '8' || to[1] === '1');
    if (promotion) {
      this.positionPromotion = to;
      // Le tour passe après la promotion (via promouvoir())
    } else {
      this.couleurCourante = this.couleurCourante === 'blanche' ? 'noire' : 'blanche';
    }

    return { from, to, piece, capturé, coupSpécial, posCapturéEnPassant, promotion };
  }

  /**
   * Transforme le pion promu en la pièce choisie.
   * @param {string} position
   * @param {string} type — 'dame' | 'tour' | 'fou' | 'cavalier'
   */
  promouvoir(position, type) {
    const piece = this.plateau.get(position);
    if (!piece) return;
    this.plateau.set(position, { ...piece, type });
    this.positionPromotion = null;
    this.couleurCourante = this.couleurCourante === 'blanche' ? 'noire' : 'blanche';
  }
}
