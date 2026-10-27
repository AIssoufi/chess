import { getSquareNode } from '../rendering/render.js';
import { POSSIBLE_MOVE_CLASS, SELECTED_CLASS } from './constants.js';

/**
 * Highlights the selected square and the squares it can move to, in place of the previous
 * selection.
 *
 * @param {object} params
 * @param {{ square: string | null, moves: readonly string[] }} params.selection The selection.
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 */
export function highlightSelection({ selection, root = document }) {
  for (const className of [POSSIBLE_MOVE_CLASS, SELECTED_CLASS]) {
    root.querySelectorAll(`.${className}`).forEach((node) => node.classList.remove(className));
  }
  if (!selection.square) return;

  getSquareNode({ root, square: selection.square })?.classList.add(SELECTED_CLASS);
  for (const square of selection.moves) {
    getSquareNode({ root, square })?.classList.add(POSSIBLE_MOVE_CLASS);
  }
}
