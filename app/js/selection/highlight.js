import { getSquareNode } from '../rendering/render.js';
import { CAPTURE_MOVE_CLASS, POSSIBLE_MOVE_CLASS, SELECTED_CLASS } from './constants.js';

/**
 * Highlights the selected square and the squares it can move to, the captures apart, in place of
 * the previous selection.
 *
 * @param {object} params
 * @param {{ square: string | null, moves: readonly string[], captures?: readonly string[] }}
 *   params.selection The selection; without `captures`, no move is marked as a capture.
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 */
export function highlightSelection({ selection, root = document }) {
  for (const className of [POSSIBLE_MOVE_CLASS, CAPTURE_MOVE_CLASS, SELECTED_CLASS]) {
    root.querySelectorAll(`.${className}`).forEach((node) => node.classList.remove(className));
  }
  if (!selection.square) return;

  getSquareNode({ root, square: selection.square })?.classList.add(SELECTED_CLASS);
  const captures = selection.captures ?? [];
  for (const square of selection.moves) {
    const squareNode = getSquareNode({ root, square });
    squareNode?.classList.add(POSSIBLE_MOVE_CLASS);
    if (captures.includes(square)) squareNode?.classList.add(CAPTURE_MOVE_CLASS);
  }
}
