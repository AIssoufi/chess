import { isColor } from '../colors/utils.js';

/**
 * Tells whether a piece is a rook that the king of the given color may castle with: a rook of the
 * king's color that has never moved.
 *
 * @param {object | null} [params]
 * @param {{ type: string, couleur: string, aBouge: boolean } | null | undefined} params.piece The
 *   piece on the rook's starting square, if any.
 * @param {'blanche' | 'noire'} params.couleur The color of the castling king.
 * @returns {boolean} true for an unmoved rook of that color.
 * @example
 * isCastlingRook({ piece: rook, couleur: rook.couleur }); // true for an unmoved rook
 */
export function isCastlingRook(params) {
  const { piece, couleur } = params ?? {};
  const isRook = piece?.type === 'tour';
  const isSameColor = isColor(couleur) && piece?.couleur === couleur;
  const hasNeverMoved = !piece?.aBouge;
  return isRook && isSameColor && hasNeverMoved;
}
