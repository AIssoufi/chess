import { NEW_GAME_BUTTON_SELECTOR } from '../../../app/js/new-game/constants.js';
import { FRAME_SELECTOR, GRID_TOLERANCE_PX } from '../board/constants.js';
import { areOverlapping, readLayout } from '../board/utils.js';
import { expect } from '../fixtures.js';
import { BUTTON_HEIGHT_RATIOS, BUTTON_WIDTH_RATIOS, FOOTER_BLOCK_SELECTORS } from './constants.js';

/**
 * Checks that the `position` of both footer blocks is the expected one.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {string} params.position The expected `position`.
 */
export async function expectFooterPosition({ page, position }) {
  for (const selector of FOOTER_BLOCK_SELECTORS) {
    await expect(page.locator(selector)).toHaveCSS('position', position);
  }
}

/**
 * Checks that neither footer block intersects the game frame, whether it is fixed or follows it.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 */
export async function expectFooterOffFrame(page) {
  const frame = await page.locator(FRAME_SELECTOR).boundingBox();
  const frameBox = toBox(frame);

  for (const selector of FOOTER_BLOCK_SELECTORS) {
    const block = await page.locator(selector).boundingBox();
    expect(areOverlapping({ first: toBox(block), second: frameBox }), selector).toBe(false);
  }
}

/**
 * Checks the width of the board, whatever the footer does around it.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {number} params.boardWidth The expected width, in CSS pixels.
 */
export async function expectBoardWidth({ page, boardWidth }) {
  const { board } = await readLayout(page);

  expect(Math.abs(board.width - boardWidth)).toBeLessThanOrEqual(GRID_TOLERANCE_PX);
}

/**
 * Lists the points of the new game button that a click would miss, once it is in view: another
 * element on top of it takes them.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<{ widthRatio: number, heightRatio: number, element: string | undefined }[]>}
 *   The missed points, as parts of the button size, with the class of what took them.
 */
export async function readMissedButtonPoints(page) {
  const button = page.locator(NEW_GAME_BUTTON_SELECTOR);
  await button.scrollIntoViewIfNeeded();

  return button.evaluate(
    (element, { widthRatios, heightRatios }) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      const points = widthRatios.flatMap((widthRatio) =>
        heightRatios.map((heightRatio) => ({ widthRatio, heightRatio }))
      );
      return points
        .map(({ widthRatio, heightRatio }) => ({
          widthRatio,
          heightRatio,
          target: document.elementFromPoint(left + width * widthRatio, top + height * heightRatio),
        }))
        .filter(({ target }) => target !== element)
        .map(({ widthRatio, heightRatio, target }) => ({
          widthRatio,
          heightRatio,
          element: target?.closest('[class]')?.className,
        }));
    },
    { widthRatios: BUTTON_WIDTH_RATIOS, heightRatios: BUTTON_HEIGHT_RATIOS }
  );
}

/**
 * Turns a Playwright bounding box into the sides that `areOverlapping` compares.
 *
 * @param {{ x: number, y: number, width: number, height: number }} box A bounding box.
 * @returns {{ left: number, top: number, right: number, bottom: number }} Its sides.
 */
function toBox({ x, y, width, height }) {
  return { left: x, top: y, right: x + width, bottom: y + height };
}
