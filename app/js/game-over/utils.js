import { getOpponent } from '../colors/utils.js';
import { GAME_OUTCOMES } from './constants.js';

/**
 * Tells what the last move leaves the side to play in: checkmate, stalemate, check or nothing.
 *
 * @param {object} params
 * @param {import('../Chessboard.js').default} params.game The game, after the move.
 * @returns {{ outcome: string, color: string | null, winner: string | null }} The outcome
 *   (one of `GAME_OUTCOMES`), the color to play and, after a checkmate, the winning color.
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
  if (game.isInCheck(color)) return { outcome: GAME_OUTCOMES.check, color, winner: null };
  return { outcome: GAME_OUTCOMES.ongoing, color, winner: null };
}
