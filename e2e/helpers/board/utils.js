import { test } from '@playwright/test';
import { getOpponent } from '../../../app/js/colors/utils.js';
import pawn from '../../../app/js/pieces/pawn.js';
import {
  BOARD_SQUARE_SELECTOR,
  CAPTURE_COUNT_ID_SUFFIX,
  CAPTURES_ID_SUFFIX,
  MOVE_CLASS,
  MOVE_LIST_EMPTY_SELECTOR,
  MOVE_LIST_SELECTOR,
  PIECE_CLASS,
} from '../../../app/js/rendering/constants.js';
import {
  BOARD_FILES,
  BOARD_SELECTOR,
  BOARD_SIZE,
  SQUARE_PATTERN,
} from '../../../app/js/squares/constants.js';
import { TURN_MOVES } from './constants.js';

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
 * Presses an element as a player of the running project would: a tap on a touch screen project,
 * a click elsewhere. It reads the `hasTouch` of the project, not a `test.use` override.
 *
 * @param {import('@playwright/test').Locator} locator The element to press.
 * @returns {Promise<void>} Resolves once the element is pressed.
 */
export function press(locator) {
  const isTouchProject = Boolean(test.info().project.use.hasTouch);
  return isTouchProject ? locator.tap() : locator.click();
}

/**
 * Plays moves by pressing the square of each piece, then its destination, as a player would.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {readonly { from: string, to: string }[]} params.moves The moves, in the order played.
 */
export async function playMoves({ page, moves }) {
  for (const { from, to } of moves) {
    await press(getSquare({ page, square: from }));
    await press(getSquare({ page, square: to }));
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
 *   scrollHeight: number,
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
        scrollHeight: root.scrollHeight,
        clientWidth: root.clientWidth,
        clientHeight: root.clientHeight,
        board: toBox(document.querySelector(boardSelector)),
        squares: squareNodes.map((node) => ({ square: node.dataset.position, ...toBox(node) })),
      };
    },
    { boardSelector: BOARD_SELECTOR, squareSelector: BOARD_SQUARE_SELECTOR }
  );
}

/**
 * Shows captured pieces in the zone of a color, as many pawns of the opponent, and their count,
 * without playing the moves that would capture them: the layout tests only need their room on
 * the page.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {string} params.color The color that captured them, `white` or `black`.
 * @param {number} params.count How many pieces to add.
 */
export async function addCapturedPieces({ page, color, count }) {
  await page.locator(`#${color}${CAPTURES_ID_SUFFIX}`).evaluate(
    (zone, { count: pieceCount, counterId, pieceClass, symbol }) => {
      for (let index = 0; index < pieceCount; index += 1) {
        const piece = document.createElement('span');
        piece.className = pieceClass;
        piece.textContent = symbol;
        zone.appendChild(piece);
      }
      const counter = document.getElementById(counterId);
      counter.textContent = String(zone.childElementCount);
    },
    {
      count,
      counterId: `${color}${CAPTURE_COUNT_ID_SUFFIX}`,
      pieceClass: PIECE_CLASS,
      symbol: pawn.piece[getOpponent(color)],
    }
  );
}

/**
 * Fills the move list with turns of `TURN_MOVES`, shows it and hides its empty note, as after a
 * long game, without playing the moves.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {number} params.turns How many turns to add, both moves played in each.
 */
export async function addMoves({ page, turns }) {
  await page.locator(MOVE_LIST_SELECTOR).evaluate(
    (list, { count, moveClass, moves }) => {
      for (let turn = 1; turn <= count; turn += 1) {
        const item = document.createElement('li');
        for (const notation of moves) {
          const move = document.createElement('span');
          move.className = moveClass;
          move.textContent = notation;
          item.append(move, ' ');
        }
        list.appendChild(item);
      }
      list.hidden = false;
    },
    { count: turns, moveClass: MOVE_CLASS, moves: TURN_MOVES }
  );
  await page.locator(MOVE_LIST_EMPTY_SELECTOR).evaluate((note) => {
    note.hidden = true;
  });
}
