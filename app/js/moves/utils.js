import { isColor } from '../colors/utils.js';

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
