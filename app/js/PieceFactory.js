import knight from './pieces/knight.js';
import queen from './pieces/queen.js';
import rook from './pieces/rook.js';
import pawn from './pieces/pawn.js';
import king from './pieces/king.js';
import bishop from './pieces/bishop.js';
import { isColor } from './colors/utils.js';
import { getPieceLabel } from './labels/utils.js';

const CONFIGS = { knight, queen, bishop, pawn, king, rook };

export default class PieceFactory {
  constructor() {
    this.counter = 1;
  }

  /**
   * Builds the DOM node of a piece, an image named for screen readers, such as `dame noire`.
   *
   * @param {object | null} [params]
   * @param {string} params.type The piece type, such as `'queen'`.
   * @param {'white' | 'black'} params.color The piece color.
   * @returns {HTMLSpanElement | null} The node, or `null` when the type or the color is unknown.
   */
  create(params) {
    const { type, color } = params ?? {};
    const symbol = this.getSymbol(type, color);
    if (!symbol) return null;

    const node = document.createElement('span');
    node.id = this.counter++;
    node.textContent = symbol;
    node.className = 'piece';
    node.dataset.type = type;
    node.dataset.color = color;
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', getPieceLabel({ type, color }));
    return node;
  }

  /**
   * Returns the Unicode symbol of a piece.
   *
   * @param {string} type The piece type, such as `'queen'`.
   * @param {'white' | 'black'} color The piece color.
   * @returns {string} The symbol, or an empty string when the type or the color is unknown.
   */
  getSymbol(type, color) {
    const isKnownPiece = Object.hasOwn(CONFIGS, type) && isColor(color);
    return isKnownPiece ? CONFIGS[type].piece[color] : '';
  }
}
