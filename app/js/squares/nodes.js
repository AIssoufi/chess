import { SQUARE_SELECTOR } from './constants.js';
import { isSquare } from './utils.js';

/**
 * Returns the node of a square of the board.
 *
 * @param {object} params
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 * @param {unknown} params.square The square, such as `'e4'`, which may be of any type.
 * @returns {HTMLElement | null} The node, or `null` when the value is not a square or the page has
 *   no such square.
 * @example
 * getSquareNode({ square: 'e4' }); // <button class="square" data-position="e4">
 */
export function getSquareNode({ root = document, square }) {
  if (!isSquare(square)) return null;
  return root.querySelector(`${SQUARE_SELECTOR}[data-position="${square}"]`);
}
