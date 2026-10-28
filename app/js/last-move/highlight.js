import { getSquareNode } from '../rendering/render.js';
import { LAST_MOVE_CLASS } from './constants.js';
import { getLastMoveSquares } from './utils.js';

/**
 * Marks the start and target squares of the last move, in place of the previous move.
 *
 * @param {object} params
 * @param {{ from?: unknown, to?: unknown } | null} params.lastMove The last move, as `game.move`
 *   returns it, or `null` before the first move of a game, which clears every mark.
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 */
export function highlightLastMove({ lastMove, root = document }) {
  root
    .querySelectorAll(`.${LAST_MOVE_CLASS}`)
    .forEach((node) => node.classList.remove(LAST_MOVE_CLASS));
  for (const square of getLastMoveSquares(lastMove)) {
    getSquareNode({ root, square })?.classList.add(LAST_MOVE_CLASS);
  }
}
