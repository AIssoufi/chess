import { getOpponent } from '../colors/utils.js';
import { getLabel } from '../labels/utils.js';
import { GAME_OUTCOMES, GAME_OVER_ALERTS } from './constants.js';

/**
 * Tells what the last move leaves the side to play in: checkmate, stalemate, a draw by another
 * rule, check or nothing, and whether its king is in check, which a draw does not tell.
 *
 * @param {object} params
 * @param {import('../Chessboard.js').default} params.game The game, after the move.
 * @returns {{ outcome: string, color: string | null, winner: string | null, isCheck: boolean,
 *   drawReason?: string }}
 *   The outcome (one of `GAME_OUTCOMES`), the color to play, after a checkmate the winning color,
 *   and whether the king of the color to play is in check, as after a checking move that also
 *   ends the game in a draw. A draw also gives its `drawReason`, one of `DRAW_REASONS`.
 *   Without a game, the outcome is `ongoing`, both colors are `null` and no king is in check.
 * @example
 * // After the fool's mate (f3 e5 g4 Qh4):
 * getGameOutcome({ game });
 * // { outcome: 'checkmate', color: 'white', winner: 'black', isCheck: true }
 */
export function getGameOutcome({ game } = {}) {
  if (!game) return { outcome: GAME_OUTCOMES.ongoing, color: null, winner: null, isCheck: false };

  const color = game.currentColor;
  const isCheck = game.isInCheck(color);
  if (game.isCheckmate(color)) {
    return { outcome: GAME_OUTCOMES.checkmate, color, winner: getOpponent(color), isCheck };
  }
  if (game.isStalemate(color)) {
    return { outcome: GAME_OUTCOMES.stalemate, color, winner: null, isCheck };
  }
  const drawReason = game.getDrawReason();
  if (drawReason) return { outcome: GAME_OUTCOMES.draw, color, winner: null, isCheck, drawReason };
  if (isCheck) return { outcome: GAME_OUTCOMES.check, color, winner: null, isCheck };
  return { outcome: GAME_OUTCOMES.ongoing, color, winner: null, isCheck };
}

/**
 * Returns the alert that an outcome opens.
 *
 * @param {string} outcome The outcome, one of `GAME_OUTCOMES`.
 * @returns {string | null} The class name of the alert, one of `GAME_OVER_ALERTS`, or `null` for
 *   an outcome that does not end the game.
 */
export function getOutcomeAlert(outcome) {
  return getLabel({ labels: GAME_OVER_ALERTS, key: outcome });
}
