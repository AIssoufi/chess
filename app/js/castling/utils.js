import { COLORS } from '../colors/constants.js';
import { isColor } from '../colors/utils.js';
import { CASTLING_SIDES } from '../moves/constants.js';
import king from '../pieces/king.js';

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

/**
 * Lists the castling rights left on a board: one per unmoved king on its starting square and
 * unmoved rook of its color on the corner of a castling side. A right says that the king and the
 * rook have never moved, not that castling is possible now.
 *
 * @param {Map<string, { type: string, color: string, hasMoved: boolean }>} board The pieces, by
 *   square.
 * @returns {string[]} The rights, such as `'white-kingside-castling'`, white first and kingside
 *   first; none for a value that is not a Map.
 * @example
 * getCastlingRights(startingBoard); // four rights, two per color
 */
export function getCastlingRights(board) {
  if (!(board instanceof Map)) return [];

  const rights = [];
  for (const color of COLORS) {
    const [kingSquare] = king.piece.startingSquares[color];
    const kingPiece = board.get(kingSquare);
    const isUnmovedKing =
      kingPiece?.type === 'king' && kingPiece.color === color && !kingPiece.hasMoved;
    if (!isUnmovedKing) continue;

    for (const side of CASTLING_SIDES) {
      const rook = board.get(`${side.rookFile}${kingSquare[1]}`);
      if (isCastlingRook({ piece: rook, color })) rights.push(`${color}-${side.specialMove}`);
    }
  }
  return rights;
}
