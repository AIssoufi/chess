import cavalier from './pieces/cavalier.js';
import dame from './pieces/dame.js';
import tour from './pieces/tour.js';
import pion from './pieces/pion.js';
import roi from './pieces/roi.js';
import fou from './pieces/fou.js';
import { isColor } from './colors/utils.js';

const CONFIGS = { cavalier, dame, fou, pion, roi, tour };

export default class PièceFactory {
  constructor() {
    this.compteur = 1;
  }

  /**
   * Builds the DOM node of a piece.
   *
   * @param {object | null} [params]
   * @param {string} params.type The piece type, such as `'dame'`.
   * @param {'blanche' | 'noire'} params.couleur The piece color.
   * @returns {HTMLDivElement | null} The node, or `null` when the type or the color is unknown.
   */
  créer(params) {
    const { type, couleur } = params ?? {};
    const symbole = this.getSymbole(type, couleur);
    if (!symbole) return null;

    const node = document.createElement('div');
    node.id = this.compteur++;
    node.textContent = symbole;
    node.className = 'piece';
    node.dataset.type = type;
    node.dataset.couleur = couleur;
    return node;
  }

  /**
   * Returns the Unicode symbol of a piece.
   *
   * @param {string} type The piece type, such as `'dame'`.
   * @param {'blanche' | 'noire'} couleur The piece color.
   * @returns {string} The symbol, or an empty string when the type or the color is unknown.
   */
  getSymbole(type, couleur) {
    const isKnownPiece = Object.hasOwn(CONFIGS, type) && isColor(couleur);
    return isKnownPiece ? CONFIGS[type].pièce[couleur] : '';
  }
}
