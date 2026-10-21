import { isColor } from '../colors/utils.js';

/**
 * Tells whether a piece is a rook that the king of the given color may castle with: a rook of the
 * king's color that has never moved.
 *
 * @param {object | null} [params]
 * @param {{ type: string, color: string, hasMoved: boolean } | null | undefined} params.piece The
 *   piece on the rook's starting square, if any.
 * @param {'white' | 'black'} params.color The color of the castling king.
 * @returns {boolean} true for an unmoved rook of that color.
 * @example
 * isCastlingRook({ piece: rook, color: rook.color }); // true for an unmoved rook
 */
export function isCastlingRook(params) {
  const { piece, color } = params ?? {};
  const isRook = piece?.type === 'rook';
  const isSameColor = isColor(color) && piece?.color === color;
  const hasNeverMoved = !piece?.hasMoved;
  return isRook && isSameColor && hasNeverMoved;
}
