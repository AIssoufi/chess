import { getResultMessage } from '../status/utils.js';
import { RESULT_SELECTOR } from './constants.js';

/**
 * Shows how the game ended, in French, on the final position; a game that goes on empties the line.
 *
 * @param {object} params
 * @param {string} params.outcome The outcome of the game, one of `GAME_OUTCOMES`.
 * @param {string | null} [params.winner] The winning color, after a checkmate.
 * @param {string} [params.drawReason] The reason of a draw, one of `DRAW_REASONS`.
 * @param {ParentNode} [params.root] The node that holds the line, the document by default.
 */
export function renderResult({ outcome, winner, drawReason, root = document }) {
  root.querySelector(RESULT_SELECTOR).textContent = getResultMessage({
    outcome,
    winner,
    drawReason,
  });
}
