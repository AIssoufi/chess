import { BOARD_FILES, SQUARE_PATTERN } from '../squares/constants.js';
import {
  MAX_LONE_MINOR_PIECES,
  MINOR_PIECE_TYPES,
  NO_EN_PASSANT_SQUARE,
  POSITION_KEY_SEPARATORS,
  SQUARE_SHADE_COUNT,
} from './constants.js';

/**
 * Returns the shade of a square: the same number for all the squares of one color, such as
 * `a1` and `c1`, another one for `b1`.
 *
 * @param {string} square The square, such as `'c1'`.
 * @returns {number} `0` or `1`.
 */
function getSquareShade(square) {
  return (BOARD_FILES.indexOf(square[0]) + Number(square[1])) % SQUARE_SHADE_COUNT;
}

/**
 * Tells whether neither side can ever mate: only the kings are left, with at most one bishop or
 * knight, or with bishops that all stand on squares of the same color.
 *
 * @param {Map<string, { type: string, color: string }>} board The pieces, by square.
 * @returns {boolean} true when no mate is possible; false otherwise, and for a value that is not
 *   a Map or holds a square or a piece the function cannot read.
 * @example
 * hasInsufficientMaterial(new Map([['e1', whiteKing], ['e8', blackKing]])); // true
 */
export function hasInsufficientMaterial(board) {
  if (!(board instanceof Map)) return false;

  const pieces = [...board].filter(([, piece]) => piece?.type !== 'king');
  const isMinorPiece = ([square, piece]) =>
    SQUARE_PATTERN.test(square) && MINOR_PIECE_TYPES.includes(piece?.type);
  const hasOnlyMinorPieces = pieces.every(isMinorPiece);
  if (!hasOnlyMinorPieces) return false;
  if (pieces.length <= MAX_LONE_MINOR_PIECES) return true;

  const areAllBishops = pieces.every(([, piece]) => piece.type === 'bishop');
  const shades = new Set(pieces.map(([square]) => getSquareShade(square)));
  const isSingleShade = shades.size === 1;
  return areAllBishops && isSingleShade;
}

/**
 * Builds the key of a position for the repetition rule: two positions are the same when their
 * keys are equal, whatever the order of the board entries.
 *
 * @param {object} [params]
 * @param {Map<string, { type: string, color: string }>} params.board The pieces, by square.
 * @param {'white' | 'black'} params.color The side to move.
 * @param {string[]} [params.castlingRights] The castling rights left, as `getCastlingRights`
 *   returns them.
 * @param {string | null} [params.enPassantSquare] The square where a pawn of the side to move can
 *   really take en passant, if any.
 * @returns {string | null} The key, or `null` when the board is not a Map.
 * @example
 * getPositionKey({ board, color: 'white', castlingRights: [], enPassantSquare: null });
 * // 'e1:white-king,e8:black-king white  -'
 */
export function getPositionKey({ board, color, castlingRights = [], enPassantSquare } = {}) {
  if (!(board instanceof Map)) return null;

  const { field, item } = POSITION_KEY_SEPARATORS;
  const placement = [...board]
    .map(([square, piece]) => `${square}:${piece?.color}-${piece?.type}`)
    .sort()
    .join(item);
  const rights = Array.isArray(castlingRights) ? [...castlingRights].sort().join(item) : '';
  return [placement, color, rights, enPassantSquare ?? NO_EN_PASSANT_SQUARE].join(field);
}
