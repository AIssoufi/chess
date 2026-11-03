import queen from '../app/js/pieces/queen.js';
import { PIECE_BUTTON_SELECTOR, PROMOTION_CHOICE_SELECTOR } from '../app/js/promotion/constants.js';
import { PIECE_SELECTOR } from '../app/js/rendering/constants.js';
import {
  LANDSCAPE_VIEWPORTS,
  LAYOUT_VIEWPORTS,
  PROMOTION_MOVES,
  PROMOTION_SQUARE,
  QUEEN_BUTTON_NAME,
} from './helpers/board/constants.js';
import { getSquare, playMoves } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** Every tested viewport, once each: both lists hold the same phone held sideways. */
const CHOICE_VIEWPORTS = Object.freeze([...new Set([...LAYOUT_VIEWPORTS, ...LANDSCAPE_VIEWPORTS])]);

/** The names that Tab meets, from the first piece, twice around, so that any stop outside shows. */
const TAB_ORDER = Object.freeze([
  'Tour',
  'Fou',
  'Cavalier',
  'Dame',
  'Tour',
  'Fou',
  'Cavalier',
  'Dame',
]);

/** The names that Shift+Tab meets, from the first piece, twice around. */
const SHIFT_TAB_ORDER = Object.freeze([
  'Cavalier',
  'Fou',
  'Tour',
  'Dame',
  'Cavalier',
  'Fou',
  'Tour',
  'Dame',
]);

/**
 * Chromium closes a modal dialog on the second Escape in a row, even when `cancel` is prevented.
 */
const ESCAPE_PRESSES = 3;

/** The look of a piece of the promotion choice under nothing. */
const RESTING_PIECE_STYLE = Object.freeze({
  transform: 'none',
  backgroundColor: 'rgb(255, 255, 255)',
});

/** The look of a piece of the promotion choice under a mouse: enlarged and orange. */
const HOVERED_PIECE_STYLE = Object.freeze({
  transform: 'matrix(1.15, 0, 0, 1.15, 0, 0)',
  backgroundColor: 'rgb(255, 152, 0)',
});

/**
 * Reads the look of an element once its transitions have ended, so that a growth just started does
 * not read as the resting size.
 *
 * @param {import('@playwright/test').Locator} locator The element to read.
 * @returns {Promise<{ transform: string, backgroundColor: string }>} Its computed transform and
 *   background color.
 */
async function readSettledStyle(locator) {
  return locator.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
    const { transform, backgroundColor } = getComputedStyle(node);
    return { transform, backgroundColor };
  });
}

/**
 * Presses a key once per expected stop and reads which element has the focus after each press.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {string} params.key The key to press.
 * @param {number} params.count The number of presses.
 * @returns {Promise<string[]>} The `aria-label` of each focused element, or its tag name.
 */
async function readFocusOrder({ page, key, count }) {
  const order = [];
  for (let press = 0; press < count; press += 1) {
    await page.keyboard.press(key);
    order.push(
      await page.evaluate(
        () => document.activeElement.getAttribute('aria-label') ?? document.activeElement.tagName
      )
    );
  }
  return order;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await playMoves({ page, moves: PROMOTION_MOVES });
  await expect(page.locator(PROMOTION_CHOICE_SELECTOR)).toBeVisible();
});

test.describe('with a keyboard', () => {
  test.skip(({ hasTouch }) => hasTouch, 'a touch screen has no keyboard to move the focus with');

  test('opens the promotion choice on its first piece', async ({ page }) => {
    await expect(page.getByRole('button', { name: QUEEN_BUTTON_NAME })).toBeFocused();
  });

  test('keeps Tab on the four pieces of the promotion choice', async ({ page }) => {
    const order = await readFocusOrder({ page, key: 'Tab', count: TAB_ORDER.length });

    expect(order).toEqual(TAB_ORDER);
  });

  test('keeps Shift+Tab on the four pieces of the promotion choice', async ({ page }) => {
    const order = await readFocusOrder({ page, key: 'Shift+Tab', count: SHIFT_TAB_ORDER.length });

    expect(order).toEqual(SHIFT_TAB_ORDER);
  });

  test('leaves the promotion choice open on Escape', async ({ page }) => {
    for (let press = 0; press < ESCAPE_PRESSES; press += 1) {
      await page.keyboard.press('Escape');
    }

    const choice = page.locator(PROMOTION_CHOICE_SELECTOR);
    await expect(choice).toBeVisible();
    await expect(choice.locator(PIECE_BUTTON_SELECTOR).first()).toBeFocused();
  });

  test('brings the focus back to the board after a choice made with the keyboard', async ({
    page,
  }) => {
    await page.keyboard.press('Enter');

    await expect(page.locator(PROMOTION_CHOICE_SELECTOR)).toBeHidden();
    const promotionSquare = getSquare({ page, square: PROMOTION_SQUARE });
    await expect(promotionSquare.locator(PIECE_SELECTOR)).toHaveText(queen.piece.white);
    await expect(promotionSquare).toBeFocused();
  });
});

test('enlarges a piece of the promotion choice under a mouse', async ({ page, hasTouch }) => {
  test.skip(hasTouch, 'a touch screen has no pointer to hover the pieces with');
  const piece = page.getByRole('button', { name: QUEEN_BUTTON_NAME });

  await piece.hover();

  expect(await readSettledStyle(piece)).toEqual(HOVERED_PIECE_STYLE);
});

// A tap leaves the pointer over the piece, as a hover does: WebKit then kept it enlarged (#211).
test('leaves a piece of the promotion choice as it is under a finger', async ({
  page,
  hasTouch,
}) => {
  test.skip(!hasTouch, 'only a touch screen keeps the pointer where the finger left it');
  const piece = page.getByRole('button', { name: QUEEN_BUTTON_NAME });

  await piece.hover();

  expect(await readSettledStyle(piece)).toEqual(RESTING_PIECE_STYLE);
});

for (const viewport of CHOICE_VIEWPORTS) {
  test.describe(`at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('covers the page and shows the whole promotion choice', async ({ page }) => {
      const choice = page.locator(PROMOTION_CHOICE_SELECTOR);

      expect(await choice.boundingBox()).toEqual({ x: 0, y: 0, ...viewport });
      for (const piece of await choice.locator(PIECE_BUTTON_SELECTOR).all()) {
        await expect(piece).toBeInViewport({ ratio: 1 });
      }
    });
  });
}
