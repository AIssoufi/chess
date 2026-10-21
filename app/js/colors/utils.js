import { COLORS, OPPONENT_COLORS, PAWN_DIRECTIONS } from './constants.js';

/**
 * Tells whether a value is one of the two colors, `'white'` or `'black'`.
 *
 * @param {unknown} value Any value.
 * @returns {boolean} true for a color.
 */
export function isColor(value) {
  return COLORS.includes(value);
}

/**
 * Returns the color that plays against the given one.
 *
 * @param {'white' | 'black'} color The color of a side.
 * @returns {'white' | 'black' | null} The other color, or `null` for any value that is not a
 *   color.
 * @example
 * getOpponent('white'); // 'black'
 */
export function getOpponent(color) {
  return isColor(color) ? OPPONENT_COLORS[color] : null;
}

/**
 * Returns the rank step of a pawn of the given color: white moves toward higher ranks.
 *
 * @param {'white' | 'black'} color The color of the pawn.
 * @returns {1 | -1 | 0} `1` for white, `-1` for black, or `0`, no move, for any value that is not
 *   a color.
 * @example
 * getPawnDirection('black'); // -1
 */
export function getPawnDirection(color) {
  return isColor(color) ? PAWN_DIRECTIONS[color] : 0;
}
