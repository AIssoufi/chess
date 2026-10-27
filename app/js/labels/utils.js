import { isSquare } from '../squares/utils.js';
import {
  CHECK_LABEL,
  EMPTY_SQUARE_LABEL,
  LABEL_SEPARATOR,
  PIECE_LABELS,
  POSSIBLE_MOVE_LABEL,
} from './constants.js';

/**
 * Returns the label of a key in a table of labels, without reading the keys that every object
 * inherits, such as `toString`.
 *
 * @param {object | null} [params]
 * @param {Readonly<Record<string, string>>} params.labels The labels, by key.
 * @param {unknown} params.key The key, which may be missing or of any type.
 * @returns {string | null} The label, or `null` when the table has no such key, and without a
 *   table.
 * @example
 * getLabel({ labels: { white: 'blanche' }, key: 'white' }); // 'blanche'
 */
export function getLabel(params) {
  const { labels, key } = params ?? {};
  const hasTable = typeof labels === 'object' && labels !== null;
  const isKnownKey = hasTable && typeof key === 'string' && Object.hasOwn(labels, key);
  return isKnownKey ? labels[key] : null;
}

/**
 * Returns the French name of a piece, read by screen readers.
 *
 * @param {object} params
 * @param {string} params.type The piece type, such as `'queen'`.
 * @param {'white' | 'black'} params.color The piece color.
 * @returns {string | null} The name, such as `'dame blanche'`, or `null` for an unknown type or
 *   color.
 * @example
 * getPieceLabel({ type: 'pawn', color: 'black' }); // 'pion noir'
 */
export function getPieceLabel({ type, color } = {}) {
  const isKnownType = typeof type === 'string' && Object.hasOwn(PIECE_LABELS, type);
  if (!isKnownType) return null;

  const labels = PIECE_LABELS[type];
  const isKnownColor = typeof color === 'string' && Object.hasOwn(labels, color);
  return isKnownColor ? labels[color] : null;
}

/**
 * Returns the name of a square of the board, read by screen readers: the square, then its piece
 * or `vide`, then whether the selected piece can move there and whether its king is in check.
 *
 * @param {object} params
 * @param {string} params.square The square, such as `'e2'`.
 * @param {{ type: string, color: string } | null} [params.piece] The piece on the square, if any.
 *   A piece of unknown type or color reads as an empty square.
 * @param {boolean} [params.isPossibleMove] Whether the selected piece can move to the square.
 * @param {boolean} [params.isCheck] Whether the square holds a king in check.
 * @returns {string | null} The name, such as `'e4, vide'`, or `null` when the square is not a
 *   square.
 * @example
 * getSquareLabel({ square: 'e2', piece: { type: 'pawn', color: 'white' } }); // 'e2, pion blanc'
 * getSquareLabel({ square: 'e4', isPossibleMove: true }); // 'e4, vide, coup possible'
 */
export function getSquareLabel({ square, piece, isPossibleMove = false, isCheck = false } = {}) {
  if (!isSquare(square)) return null;

  const pieceLabel = piece ? getPieceLabel(piece) : null;
  const parts = [square, pieceLabel ?? EMPTY_SQUARE_LABEL];
  if (isPossibleMove === true) parts.push(POSSIBLE_MOVE_LABEL);
  if (isCheck === true) parts.push(CHECK_LABEL);
  return parts.join(LABEL_SEPARATOR);
}
