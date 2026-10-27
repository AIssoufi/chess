import { isColor } from '../colors/utils.js';
import { getLabel } from '../labels/utils.js';
import { isSquare } from '../squares/utils.js';
import { SPECIAL_MOVE_LABELS } from './constants.js';

/**
 * Tells whether a piece belongs to the opponent of the given color, so that a move onto its
 * square captures it.
 *
 * @param {object | null} [params]
 * @param {{ color: string } | null | undefined} params.piece The piece on the target square, if
 *   any.
 * @param {'white' | 'black'} params.color The color of the moving piece.
 * @returns {boolean} true for a piece of another color, false for an empty square or a piece of
 *   the same color, and for a missing or unknown color.
 * @example
 * isOpponentPiece({ piece: { type: 'pawn', color: 'black' }, color: 'white' }); // true
 */
export function isOpponentPiece(params) {
  const { piece, color } = params ?? {};
  return isColor(color) && Boolean(piece) && piece.color !== color;
}

/**
 * Returns the message that the console logs for a move: its squares and, for a special move, its
 * French name.
 *
 * @param {{ from: string, to: string, specialMove?: string } | null} [move] The move, as
 *   `Chessboard.move` returns it.
 * @returns {string | null} The message, or `null` for a missing move or one whose squares are not
 *   squares. An unknown special move logs the squares alone.
 * @example
 * getMoveLog({ from: 'e1', to: 'g1', specialMove: 'kingside-castling' });
 * // 'e1 → g1 (petit-roque)'
 */
export function getMoveLog(move) {
  const hasSquares = isSquare(move?.from) && isSquare(move?.to);
  if (!hasSquares) return null;

  const squares = `${move.from} → ${move.to}`;
  const specialMoveLabel = getLabel({ labels: SPECIAL_MOVE_LABELS, key: move.specialMove });
  return specialMoveLabel ? `${squares} (${specialMoveLabel})` : squares;
}
