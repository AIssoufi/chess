import { getPawnDirection } from '../colors/utils.js';
import { BOARD_SIZE, FIRST_RANK, SQUARE_PATTERN } from './constants.js';

/**
 * Tells whether a value is a square of the board, in lowercase algebraic notation.
 *
 * @param {unknown} value The value, which may be of any type.
 * @returns {boolean} true for a square from `a1` to `h8`, false otherwise, including for a value
 *   that is not a string.
 * @example
 * isSquare('e4'); // true
 * isSquare('E4'); // false
 */
export function isSquare(value) {
  return typeof value === 'string' && SQUARE_PATTERN.test(value);
}

/**
 * Returns the square of the pawn that an en passant capture takes: one rank behind the target
 * square, from the point of view of the capturing pawn.
 *
 * @param {object} params
 * @param {string} params.target The square the capturing pawn moves to, such as `'d6'`.
 * @param {'white' | 'black'} params.color The color of the capturing pawn.
 * @returns {string | null} The square of the captured pawn, or `null` when the target is not a
 *   square, the color is not a color, or the square behind is off the board.
 * @example
 * getEnPassantCaptureSquare({ target: 'd6', color: 'white' }); // 'd5'
 */
export function getEnPassantCaptureSquare({ target, color } = {}) {
  const direction = getPawnDirection(color);
  const hasDirection = direction !== 0;
  if (!isSquare(target) || !hasDirection) return null;

  const capturedSquare = `${target[0]}${Number(target[1]) - direction}`;
  return isSquare(capturedSquare) ? capturedSquare : null;
}

/**
 * Tells whether board coordinates fall inside the board.
 *
 * @param {object | null} [params]
 * @param {number} params.file The file index, from `0` for `a` to `BOARD_SIZE - 1` for `h`.
 * @param {number} params.rank The rank number, from `FIRST_RANK` to `BOARD_SIZE`.
 * @returns {boolean} true when both coordinates are on the board, false otherwise, including for
 *   missing coordinates and values that are not integers.
 * @example
 * areCoordinatesOnBoard({ file: 7, rank: 8 }); // true, h8
 */
export function areCoordinatesOnBoard(params) {
  const { file, rank } = params ?? {};
  const isFileOnBoard = Number.isInteger(file) && file >= 0 && file < BOARD_SIZE;
  const isRankOnBoard = Number.isInteger(rank) && rank >= FIRST_RANK && rank <= BOARD_SIZE;
  return isFileOnBoard && isRankOnBoard;
}
