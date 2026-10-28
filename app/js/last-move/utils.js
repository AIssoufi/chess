import { isSquare } from '../squares/utils.js';
import { NO_LAST_MOVE_SQUARES } from './constants.js';

/**
 * Returns the squares that show the last move on the board: the square the piece left and the one
 * it reached. A castling marks the squares of the king, an en passant capture the squares of the
 * capturing pawn, and a promotion the squares of the pawn, before and after its piece is chosen.
 *
 * @param {{ from?: unknown, to?: unknown } | null} [move] The last move, as `game.move` returns
 *   it, or `null` before the first move of a game.
 * @returns {readonly string[]} The start and target squares, or `NO_LAST_MOVE_SQUARES` without a
 *   move, and for a move whose start or target is not a square.
 * @example
 * getLastMoveSquares(game.move({ from: 'e2', to: 'e4' })); // ['e2', 'e4']
 */
export function getLastMoveSquares(move) {
  const { from, to } = move ?? {};
  const hasBothSquares = isSquare(from) && isSquare(to);
  return hasBothSquares ? [from, to] : NO_LAST_MOVE_SQUARES;
}
