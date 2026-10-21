import { getPawnDirection } from '../colors/utils.js';
import { SQUARE_PATTERN } from './constants.js';

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
  const isSquare = typeof target === 'string' && SQUARE_PATTERN.test(target);
  const direction = getPawnDirection(color);
  const hasDirection = direction !== 0;
  if (!isSquare || !hasDirection) return null;

  const capturedSquare = `${target[0]}${Number(target[1]) - direction}`;
  const isOnBoard = SQUARE_PATTERN.test(capturedSquare);
  return isOnBoard ? capturedSquare : null;
}
