import { COLORS } from '../app/js/colors/constants.js';
import { NEW_GAME_BUTTON_SELECTOR } from '../app/js/new-game/constants.js';
import {
  CAPTURES_ID_SUFFIX,
  CONTROL_SELECTOR,
  MOVE_LIST_SELECTOR,
} from '../app/js/rendering/constants.js';
import {
  FRAME_SELECTOR,
  GRID_TOLERANCE_PX,
  LANDSCAPE_VIEWPORTS,
  MAX_CAPTURED_PIECES,
  MOVE_LIST_PANEL_SELECTOR,
  SCANDINAVIAN_CAPTURES,
  SCANDINAVIAN_MOVES,
} from './helpers/board/constants.js';
import { addCapturedPieces, areOverlapping, playMoves, readLayout } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** The board and its coordinates, between the two side columns of the landscape layout. */
const GAME_SELECTOR = '.game';

/** The fewest turns that the move list must show at once, so that a player can follow the game. */
const MIN_VISIBLE_TURNS = 2;

/**
 * Reads the boxes of the panels of the game frame, in CSS pixels from the top left corner of the
 * viewport, and the scroll and client heights of the player panels and of the move list.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<{
 *   frame: { left: number, top: number, right: number, bottom: number },
 *   newGame: { left: number, top: number, right: number, bottom: number },
 *   panels: { name: string, left: number, top: number, right: number, bottom: number }[],
 *   controls: { color: string, scrollHeight: number, clientHeight: number }[],
 *   moves: { scrollHeight: number, clientHeight: number, turnHeight: number },
 * }>} The boxes and the heights.
 */
function readPanels(page) {
  return page.evaluate(
    ({
      colors,
      controlSelector,
      frameSelector,
      gameSelector,
      listSelector,
      movesSelector,
      newGameSelector,
    }) => {
      const toBox = (node) => {
        const { left, top, right, bottom } = node.getBoundingClientRect();
        return { left, top, right, bottom };
      };
      const findControl = (color) =>
        document.querySelector(`${controlSelector}[data-color="${color}"]`);
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
          const { scrollHeight, clientHeight } = findControl(color);
          return { color, scrollHeight, clientHeight };
        }),
        moves: {
          scrollHeight: moves.scrollHeight,
          clientHeight: moves.clientHeight,
          turnHeight: firstTurn ? firstTurn.getBoundingClientRect().height : 0,
        },
      };
    },
    {
      colors: Object.values(COLORS),
      controlSelector: CONTROL_SELECTOR,
      frameSelector: FRAME_SELECTOR,
      gameSelector: GAME_SELECTOR,
      listSelector: MOVE_LIST_PANEL_SELECTOR,
      movesSelector: MOVE_LIST_SELECTOR,
      newGameSelector: NEW_GAME_BUTTON_SELECTOR,
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
async function expectPanelsToFit(page) {
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
 * @param {{ color: string, scrollHeight: number, clientHeight: number }[]} controls The heights
 *   of the player panels, from `readPanels`.
 */
function expectWholeControls(controls) {
  for (const { color, scrollHeight, clientHeight } of controls) {
    expect(scrollHeight, `the panel of ${color} does not scroll`).toBeLessThanOrEqual(clientHeight);
  }
}

for (const viewport of LANDSCAPE_VIEWPORTS) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  test.describe(`on a phone held sideways at ${viewportLabel} (#156)`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('fits the panels beside the board before the first move', async ({ page }) => {
      await expectPanelsToFit(page);
    });

    test('shows two turns of the move list after three turns', async ({ page }) => {
      await playMoves({ page, moves: SCANDINAVIAN_MOVES });

      const { moves } = await expectPanelsToFit(page);
      expect(moves.turnHeight).toBeGreaterThan(0);
      expect(moves.clientHeight, 'the move list shows two turns').toBeGreaterThanOrEqual(
        MIN_VISIBLE_TURNS * moves.turnHeight - GRID_TOLERANCE_PX
      );
    });

    test('keeps whole player panels after a capture each', async ({ page }) => {
      await playMoves({ page, moves: SCANDINAVIAN_MOVES });

      const { controls } = await expectPanelsToFit(page);
      expectWholeControls(controls);
    });

    test(`keeps whole player panels with ${MAX_CAPTURED_PIECES} captured pieces on each side`, async ({
      page,
    }) => {
      await playMoves({ page, moves: SCANDINAVIAN_MOVES });
      for (const color of Object.values(COLORS)) {
        await addCapturedPieces({
          page,
          color,
          count: MAX_CAPTURED_PIECES - SCANDINAVIAN_CAPTURES,
        });
        await expect(page.locator(`#${color}${CAPTURES_ID_SUFFIX} > *`)).toHaveCount(
          MAX_CAPTURED_PIECES
        );
      }

      const { controls } = await expectPanelsToFit(page);
      expectWholeControls(controls);
    });
  });
}
