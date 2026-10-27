import { BOARD_SIZE, FIRST_RANK, SQUARE_PATTERN } from '../squares/constants.js';
import { BOARD_FILES, NAVIGATION_STEPS } from './constants.js';

/**
 * Keeps a file index or a rank inside the board.
 *
 * @param {object} params
 * @param {number} params.value The index or rank, which may be off the board.
 * @param {number} params.min The lowest value on the board.
 * @returns {number} The value, moved back to the nearest edge when it is off the board.
 */
function clampToBoard({ value, min }) {
  return Math.min(Math.max(value, min), min + BOARD_SIZE - 1);
}

/**
 * Returns the square that a navigation key moves the focus to: the arrows move one square, Home
 * and End reach the a-file and the h-file, PageUp and PageDown reach the 8th and the 1st rank.
 *
 * @param {object} params
 * @param {string} params.square The focused square, such as `'e2'`.
 * @param {string} params.key The `key` of the keyboard event, such as `'ArrowUp'`.
 * @returns {string | null} The square to focus, the same one at an edge of the board, or `null`
 *   when the key is not a navigation key or the square is not a square.
 * @example
 * getNextSquare({ square: 'e2', key: 'ArrowUp' }); // 'e3'
 * getNextSquare({ square: 'e2', key: 'Home' }); // 'a2'
 */
export function getNextSquare({ square, key } = {}) {
  const isSquare = typeof square === 'string' && SQUARE_PATTERN.test(square);
  const isNavigationKey = typeof key === 'string' && Object.hasOwn(NAVIGATION_STEPS, key);
  if (!isSquare || !isNavigationKey) return null;

  const { fileStep, rankStep } = NAVIGATION_STEPS[key];
  const fileIndex = clampToBoard({ value: BOARD_FILES.indexOf(square[0]) + fileStep, min: 0 });
  const rank = clampToBoard({ value: Number(square[1]) + rankStep, min: FIRST_RANK });
  return `${BOARD_FILES[fileIndex]}${rank}`;
}
