import { COLORS } from '../../../app/js/colors/constants.js';
import { NEW_GAME_BUTTON_SELECTOR } from '../../../app/js/new-game/constants.js';
import {
  CAPTURE_COUNT_ID_SUFFIX,
  CONTROL_SELECTOR,
  MOVE_LIST_SELECTOR,
  TURN_SELECTOR,
} from '../../../app/js/rendering/constants.js';
import { FRAME_SELECTOR, GRID_TOLERANCE_PX, MOVE_LIST_PANEL_SELECTOR } from '../board/constants.js';
import { areOverlapping, readLayout } from '../board/utils.js';
import { expect } from '../fixtures.js';
import { GAME_SELECTOR, MIN_VISIBLE_TURNS } from './constants.js';

/**
 * Reads the boxes of the panels of the game frame, in CSS pixels from the top left corner of the
 * viewport, the scroll and client heights of the player panels and of the move list, and the lines
 * of the turn label and of the capture count of each panel.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<{
 *   frame: { left: number, top: number, right: number, bottom: number },
 *   newGame: { left: number, top: number, right: number, bottom: number },
 *   panels: { name: string, left: number, top: number, right: number, bottom: number }[],
 *   controls: {
 *     color: string,
 *     scrollHeight: number,
 *     clientHeight: number,
 *     turnLines: number,
 *     captureCountLines: number,
 *   }[],
 *   moves: { scrollHeight: number, clientHeight: number, turnHeight: number },
 * }>} The boxes and the heights.
 */
function readPanels(page) {
  return page.evaluate(
    ({
      captureCountSuffix,
      colors,
      controlSelector,
      frameSelector,
      gameSelector,
      listSelector,
      movesSelector,
      newGameSelector,
      turnSelector,
    }) => {
      const toBox = (node) => {
        const { left, top, right, bottom } = node.getBoundingClientRect();
        return { left, top, right, bottom };
      };
      const findControl = (color) =>
        document.querySelector(`${controlSelector}[data-color="${color}"]`);
      const countLines = (node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return new Set([...range.getClientRects()].map(({ bottom }) => Math.round(bottom))).size;
      };
      const moves = document.querySelector(movesSelector);
      const firstTurn = moves.querySelector('li');
      return {
        frame: toBox(document.querySelector(frameSelector)),
        newGame: toBox(document.querySelector(newGameSelector)),
        panels: [
          ...colors.map((color) => ({ name: color, ...toBox(findControl(color)) })),
          { name: 'game', ...toBox(document.querySelector(gameSelector)) },
          { name: 'moves', ...toBox(document.querySelector(listSelector)) },
        ],
        controls: colors.map((color) => {
          const control = findControl(color);
          const { scrollHeight, clientHeight } = control;
          const count = document.getElementById(`${color}${captureCountSuffix}`);
          return {
            color,
            scrollHeight,
            clientHeight,
            turnLines: countLines(control.querySelector(turnSelector)),
            captureCountLines: countLines(count.parentElement),
          };
        }),
        moves: {
          scrollHeight: moves.scrollHeight,
          clientHeight: moves.clientHeight,
          turnHeight: firstTurn ? firstTurn.getBoundingClientRect().height : 0,
        },
      };
    },
    {
      captureCountSuffix: CAPTURE_COUNT_ID_SUFFIX,
      colors: Object.values(COLORS),
      controlSelector: CONTROL_SELECTOR,
      frameSelector: FRAME_SELECTOR,
      gameSelector: GAME_SELECTOR,
      listSelector: MOVE_LIST_PANEL_SELECTOR,
      movesSelector: MOVE_LIST_SELECTOR,
      newGameSelector: NEW_GAME_BUTTON_SELECTOR,
      turnSelector: TURN_SELECTOR,
    }
  );
}

/**
 * Checks that the board fits the screen, that the panels of the game frame do not overlap, and
 * that the new game button stays inside the frame.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<Awaited<ReturnType<typeof readPanels>>>} The panels, for further checks.
 */
export async function expectPanelsToFit(page) {
  const { board, clientWidth, clientHeight } = await readLayout(page);
  const layout = await readPanels(page);
  const { frame, newGame, panels } = layout;

  expect(board.left).toBeGreaterThanOrEqual(0);
  expect(board.top).toBeGreaterThanOrEqual(0);
  expect(board.bottom).toBeLessThanOrEqual(clientHeight);
  expect(board.right).toBeLessThanOrEqual(clientWidth);
  expect(newGame.bottom, 'the new game button ends inside the game frame').toBeLessThanOrEqual(
    frame.bottom + GRID_TOLERANCE_PX
  );
  panels.forEach((first, index) => {
    for (const second of panels.slice(index + 1)) {
      const isOverlapping = areOverlapping({ first, second });
      expect(isOverlapping, `${first.name} and ${second.name} overlap`).toBe(false);
    }
  });
  return layout;
}

/**
 * Checks that no player panel scrolls inside itself, which would hide its captured pieces.
 *
 * @param {Awaited<ReturnType<typeof readPanels>>['controls']} controls The player panels, from
 *   `readPanels`.
 */
export function expectWholeControls(controls) {
  for (const { color, scrollHeight, clientHeight } of controls) {
    expect(scrollHeight, `the panel of ${color} does not scroll`).toBeLessThanOrEqual(clientHeight);
  }
}

/**
 * Checks that the capture counts keep one line, as does the turn label, in the panel of the side
 * to move alone.
 *
 * @param {object} params The panels and the side to move.
 * @param {Awaited<ReturnType<typeof readPanels>>['controls']} params.controls The player panels,
 *   from `readPanels`.
 * @param {string} params.sideToMove The color whose panel holds the turn label.
 */
export function expectOneLineTexts({ controls, sideToMove }) {
  for (const { color, turnLines, captureCountLines } of controls) {
    const expectedTurnLines = color === sideToMove ? 1 : 0;
    expect(turnLines, `the turn label of ${color} takes its lines`).toBe(expectedTurnLines);
    expect(captureCountLines, `the capture count of ${color} keeps one line`).toBe(1);
  }
}

/**
 * Checks that the move list shows enough turns for a player to follow the game.
 *
 * @param {{ clientHeight: number, turnHeight: number }} moves The heights of the move list, from
 *   `readPanels`.
 */
export function expectTwoVisibleTurns({ clientHeight, turnHeight }) {
  expect(turnHeight, 'the move list holds a turn').toBeGreaterThan(0);
  expect(clientHeight, 'the move list shows two turns').toBeGreaterThanOrEqual(
    MIN_VISIBLE_TURNS * turnHeight - GRID_TOLERANCE_PX
  );
}
