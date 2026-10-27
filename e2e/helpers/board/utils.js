import { BOARD_SQUARE_SELECTOR } from '../../../app/js/rendering/constants.js';
import {
  BOARD_FILES,
  BOARD_SELECTOR,
  BOARD_SIZE,
  SQUARE_PATTERN,
} from '../../../app/js/squares/constants.js';

/**
 * Finds a square of the board of the page.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {string} params.square The square, from `a1` to `h8`.
 * @returns {import('@playwright/test').Locator} The button of the square.
 */
export function getSquare({ page, square }) {
  return page.locator(`${BOARD_SQUARE_SELECTOR}[data-position="${square}"]`);
}

/**
 * Plays moves by clicking the square of each piece, then its destination, as a player would.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {readonly { from: string, to: string }[]} params.moves The moves, in the order played.
 */
export async function playMoves({ page, moves }) {
  for (const { from, to } of moves) {
    await getSquare({ page, square: from }).click();
    await getSquare({ page, square: to }).click();
  }
}

/**
 * Gives the place a square must take on the board, white at the bottom: its column, from the left,
 * and its row, from the top.
 *
 * @param {string} square The square, from `a1` to `h8`.
 * @returns {{ column: number, row: number } | null} The column and the row, both from 0 to 7, or
 *   `null` for a value that is not a square.
 */
export function getGridPlace(square) {
  const isSquare = typeof square === 'string' && SQUARE_PATTERN.test(square);
  if (!isSquare) return null;

  return {
    column: BOARD_FILES.indexOf(square[0]),
    row: BOARD_SIZE - Number(square[1]),
  };
}

/**
 * Reads the layout of the page: the scroll and client sizes of the document, the box of the board
 * and the box of each of its squares, in CSS pixels from the top left corner of the viewport.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<{
 *   scrollWidth: number,
 *   clientWidth: number,
 *   clientHeight: number,
 *   board: { left: number, top: number, right: number, bottom: number },
 *   squares: { square: string, left: number, top: number, width: number, height: number }[],
 * }>} The layout.
 */
export function readLayout(page) {
  return page.evaluate(
    ({ boardSelector, squareSelector }) => {
      const root = document.documentElement;
      const toBox = (node) => {
        const { left, top, right, bottom, width, height } = node.getBoundingClientRect();
        return { left, top, right, bottom, width, height };
      };
      const squareNodes = [...document.querySelectorAll(squareSelector)];
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        clientHeight: root.clientHeight,
        board: toBox(document.querySelector(boardSelector)),
        squares: squareNodes.map((node) => ({ square: node.dataset.position, ...toBox(node) })),
      };
    },
    { boardSelector: BOARD_SELECTOR, squareSelector: BOARD_SQUARE_SELECTOR }
  );
}
