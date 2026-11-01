import { DRAW_REASONS } from '../app/js/draws/constants.js';
import { GAME_OUTCOMES } from '../app/js/game-over/constants.js';
import { NEW_GAME_BUTTON_SELECTOR } from '../app/js/new-game/constants.js';
import {
  CONTROL_SELECTOR,
  MOVE_LIST_SELECTOR,
  RESULT_SELECTOR,
  STATUS_SELECTOR,
} from '../app/js/rendering/constants.js';
import { BOARD_SELECTOR } from '../app/js/squares/constants.js';
import { getResultMessage } from '../app/js/status/utils.js';
import {
  FOOLS_MATE_MOVES,
  FRAME_SELECTOR,
  LANDSCAPE_VIEWPORTS,
  LAYOUT_VIEWPORTS,
  MAX_CAPTURED_PIECES,
  SMALL_PHONE_LANDSCAPE_VIEWPORT,
  UPRIGHT_TABLET_VIEWPORTS,
} from './helpers/board/constants.js';
import {
  addCapturedPieces,
  areOverlapping,
  playMoves,
  press,
  toSides,
} from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';
import { expectPanelsToFit } from './helpers/landscape/utils.js';

/** The name of the button that closes the game over dialog on the final position. */
const REVIEW_BUTTON_NAME = 'Voir la position';

/** The name of the button under the move list that starts a new game. */
const NEW_GAME_BUTTON_NAME = 'Nouvelle partie';

/** The zone of the pieces that black captured, beside the result on a large screen. */
const BLACK_CAPTURES_SELECTOR = '#black-captures';

/** What sits beside the result in the panel of black, on one screen or another. */
const RESULT_NEIGHBOR_SELECTORS = Object.freeze(['#black-name', BLACK_CAPTURES_SELECTOR]);

/** Both knights go out and back, twice: the starting position then stands for the third time. */
const THREEFOLD_REPETITION_MOVES = Object.freeze([
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
]);

/** The two ways for a game to end that the test plays, and the result that each one shows. */
const ENDINGS = Object.freeze([
  { name: 'a checkmate', moves: FOOLS_MATE_MOVES, result: 'Échec et mat, les noirs gagnent.' },
  {
    name: 'a draw',
    moves: THREEFOLD_REPETITION_MOVES,
    result: 'Match nul\u00a0: position répétée trois fois.',
  },
]);

/** The longest result, which no short game reaches. */
const LONGEST_RESULT = getResultMessage({
  outcome: GAME_OUTCOMES.draw,
  drawReason: DRAW_REASONS.fiftyMoveRule,
});

/** The narrowest phone that the page supports, where the result wraps the most under the title. */
const NARROW_PHONE_VIEWPORT = Object.freeze({ width: 320, height: 568 });

/** The narrowest upright tablet, where the most room beside the name is the least. */
const [NARROW_TABLET_VIEWPORT] = UPRIGHT_TABLET_VIEWPORTS;

/** The viewports of the result: phones and tablets, upright and sideways, and a laptop. */
const RESULT_VIEWPORTS = Object.freeze([
  NARROW_PHONE_VIEWPORT,
  NARROW_TABLET_VIEWPORT,
  ...LAYOUT_VIEWPORTS,
  SMALL_PHONE_LANDSCAPE_VIEWPORT,
]);

/** What must not move for the result: the frame, the board, the panels and the list. */
const STILL_SELECTORS = Object.freeze([
  FRAME_SELECTOR,
  BOARD_SELECTOR,
  CONTROL_SELECTOR,
  BLACK_CAPTURES_SELECTOR,
  MOVE_LIST_SELECTOR,
  NEW_GAME_BUTTON_SELECTOR,
]);

/**
 * Reads the box of each node that must not move, with the height of the page.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<object>} The boxes and the height of the page, to compare with `toEqual`.
 */
function readStillLayout(page) {
  return page.evaluate(
    (selectors) => ({
      pageHeight: document.documentElement.scrollHeight,
      boxes: selectors.flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((node) => {
          const { left, top, width, height } = node.getBoundingClientRect();
          return { selector, left, top, width, height };
        })
      ),
    }),
    STILL_SELECTORS
  );
}

/**
 * Plays moves up to the end of a game and closes its dialog with "Voir la position".
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {readonly { from: string, to: string }[]} params.moves The moves that end the game.
 * @returns {Promise<object>} The still layout of the page before the dialog closed.
 */
async function reviewFinalPosition({ page, moves }) {
  await playMoves({ page, moves });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator(RESULT_SELECTOR)).toBeEmpty();
  const layout = await readStillLayout(page);

  await press(dialog.getByRole('button', { name: REVIEW_BUTTON_NAME }));
  await expect(dialog).toBeHidden();
  return layout;
}

/**
 * Writes the longest result on the page, which playing a fifty-move draw would take too long.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<void>}
 */
function showLongestResult(page) {
  return page.locator(RESULT_SELECTOR).evaluate((node, text) => {
    node.textContent = text;
  }, LONGEST_RESULT);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

for (const viewport of RESULT_VIEWPORTS) {
  const size = `${viewport.width}x${viewport.height}`;

  test.describe(`The result of a game at ${size}`, () => {
    test.use({ viewport });

    for (const { name, moves, result } of ENDINGS) {
      test(`shows ${name} on the final position, without moving it`, async ({ page }) => {
        const layoutBefore = await reviewFinalPosition({ page, moves });

        const resultNode = page.locator(RESULT_SELECTOR);
        await expect(resultNode).toHaveText(result);
        await expect(resultNode).toBeInViewport({ ratio: 1 });
        await expect(page.locator(STATUS_SELECTOR)).toContainText(result);
        expect(await readStillLayout(page)).toEqual(layoutBefore);

        await press(page.getByRole('button', { name: NEW_GAME_BUTTON_NAME }));
        await expect(resultNode).toBeEmpty();
      });
    }

    test('keeps the longest result clear of the name and the captures', async ({ page }) => {
      await reviewFinalPosition({ page, moves: FOOLS_MATE_MOVES });
      await addCapturedPieces({ page, color: 'black', count: MAX_CAPTURED_PIECES });
      const layoutWithCaptures = await readStillLayout(page);

      await showLongestResult(page);

      const resultNode = page.locator(RESULT_SELECTOR);
      await expect(resultNode).toBeInViewport({ ratio: 1 });
      expect(await readStillLayout(page)).toEqual(layoutWithCaptures);
      const resultBox = await resultNode.boundingBox();
      for (const selector of RESULT_NEIGHBOR_SELECTORS) {
        const neighbor = page.locator(selector);
        await expect(neighbor).toBeVisible();
        const neighborBox = await neighbor.boundingBox();
        const isOverlapping = areOverlapping({
          first: toSides(resultBox),
          second: toSides(neighborBox),
        });
        expect(isOverlapping, `the result overlaps ${selector}`).toBe(false);
      }
    });
  });
}

for (const viewport of LANDSCAPE_VIEWPORTS) {
  const size = `${viewport.width}x${viewport.height}`;

  test.describe(`The result of a game on a phone held sideways at ${size}`, () => {
    test.use({ viewport });

    test('keeps the panels apart with the longest result', async ({ page }) => {
      await reviewFinalPosition({ page, moves: FOOLS_MATE_MOVES });

      await showLongestResult(page);

      await expectPanelsToFit(page);
    });
  });
}
