import { COLOR_LABELS } from '../colors/constants.js';
import { getOpponent } from '../colors/utils.js';
import { DRAW_REASON_LABELS } from '../draws/constants.js';
import { getLabel } from '../labels/utils.js';
import { CHECKED_KING_OUTCOMES, GAME_OUTCOMES, GAME_OVER_ALERTS } from './constants.js';

/**
 * Tells what the last move leaves the side to play in: checkmate, stalemate, a draw by another
 * rule, check or nothing.
 *
 * @param {object} params
 * @param {import('../Chessboard.js').default} params.game The game, after the move.
 * @returns {{ outcome: string, color: string | null, winner: string | null, drawReason?: string }}
 *   The outcome (one of `GAME_OUTCOMES`), the color to play and, after a checkmate, the winning
 *   color. A draw also gives its `drawReason`, one of `DRAW_REASONS`.
 *   Without a game, the outcome is `ongoing` and both colors are `null`.
 * @example
 * // After the fool's mate (f3 e5 g4 Qh4):
 * getGameOutcome({ game }); // { outcome: 'checkmate', color: 'white', winner: 'black' }
 */
export function getGameOutcome({ game } = {}) {
  if (!game) return { outcome: GAME_OUTCOMES.ongoing, color: null, winner: null };

  const color = game.currentColor;
  if (game.isCheckmate(color)) {
    return { outcome: GAME_OUTCOMES.checkmate, color, winner: getOpponent(color) };
  }
  if (game.isStalemate(color)) return { outcome: GAME_OUTCOMES.stalemate, color, winner: null };
  const drawReason = game.getDrawReason();
  if (drawReason) return { outcome: GAME_OUTCOMES.draw, color, winner: null, drawReason };
  if (game.isInCheck(color)) return { outcome: GAME_OUTCOMES.check, color, winner: null };
  return { outcome: GAME_OUTCOMES.ongoing, color, winner: null };
}

/**
 * Returns the French message that the console logs for an outcome.
 *
 * @param {object | null} [params]
 * @param {string} params.outcome The outcome, one of `GAME_OUTCOMES`.
 * @param {string | null} [params.color] The color to play.
 * @param {string | null} [params.winner] The winning color, after a checkmate.
 * @param {string} [params.drawReason] The reason of a draw, one of `DRAW_REASONS`.
 * @returns {string | null} The message, or `null` for a game that goes on, an unknown outcome and
 *   a color or a draw reason without a label.
 * @example
 * getOutcomeLog({ outcome: 'check', color: 'white' }); // 'blanche est en échec !'
 */
export function getOutcomeLog(params) {
  const { outcome, color, winner, drawReason } = params ?? {};
  const colorLabel = getLabel({ labels: COLOR_LABELS, key: color });
  const winnerLabel = getLabel({ labels: COLOR_LABELS, key: winner });
  const drawLabel = getLabel({ labels: DRAW_REASON_LABELS, key: drawReason });

  if (outcome === GAME_OUTCOMES.checkmate) {
    return winnerLabel ? `Échec et mat ! ${winnerLabel} gagne.` : null;
  }
  if (outcome === GAME_OUTCOMES.stalemate) return 'Pat — match nul.';
  if (outcome === GAME_OUTCOMES.draw) return drawLabel ? `Match nul : ${drawLabel}.` : null;
  if (outcome === GAME_OUTCOMES.check) return colorLabel ? `${colorLabel} est en échec !` : null;
  return null;
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

/**
 * Tells whether an outcome leaves the king of the side to play in check.
 *
 * @param {string} outcome The outcome, one of `GAME_OUTCOMES`.
 * @returns {boolean} true after a check or a checkmate.
 */
export function isKingInCheck(outcome) {
  return CHECKED_KING_OUTCOMES.includes(outcome);
}
