/**
 * Returns the square of the king of a color.
 *
 * @param {object | null} [params]
 * @param {Map<string, { type: string, color: string }>} params.board The pieces, by square.
 * @param {'white' | 'black'} params.color The color of the king.
 * @returns {string | null} The square, such as `'e1'`, or `null` when the board is not a Map or
 *   holds no king of that color.
 * @example
 * getKingSquare({ board: game.board, color: 'white' }); // 'e1' at the start
 */
export function getKingSquare(params) {
  const { board, color } = params ?? {};
  if (!(board instanceof Map)) return null;

  for (const [square, piece] of board) {
    const isKingOfColor = piece?.type === 'king' && piece.color === color;
    if (isKingOfColor) return square;
  }
  return null;
}
