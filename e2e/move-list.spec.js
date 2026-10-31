import { TABBABLE_INDEX } from '../app/js/board-navigation/constants.js';
import { BOARD_SQUARE_SELECTOR, MOVE_LIST_SELECTOR } from '../app/js/rendering/constants.js';
import { NEW_GAME_BUTTON_NAME } from './helpers/board/constants.js';
import { playMoves } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** A phone held upright, where #149 saw the empty list take the focus with a 0px high box. */
const PHONE_VIEWPORT = Object.freeze({ width: 390, height: 800 });

/** A laptop, where the move list sits beside the board. */
const LAPTOP_VIEWPORT = Object.freeze({ width: 1280, height: 800 });

/** The square of the board that the Tab key reaches, the others being left to the arrow keys. */
const TABBABLE_SQUARE_SELECTOR = `${BOARD_SQUARE_SELECTOR}[tabindex="${TABBABLE_INDEX}"]`;

/** The first move of white, which fills the move list. */
const FIRST_MOVE = Object.freeze({ from: 'e2', to: 'e4' });

/**
 * The key that moves the focus to the next element of the page, buttons included: Safari, and so
 * WebKit, skips buttons and links on Tab alone, and reaches them on Option+Tab.
 */
const NEXT_ELEMENT_KEYS = Object.freeze({ webkit: 'Alt+Tab' });

/** The key that moves the focus to the next element in the other browsers. */
const DEFAULT_NEXT_ELEMENT_KEY = 'Tab';

/**
 * Moves the focus to the square of the board that the Tab key reaches, then to the next element
 * of the page, as a keyboard player leaving the board would.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {string} params.browserName The name of the browser of the running project.
 */
async function tabOutOfBoard({ page, browserName }) {
  await page.locator(TABBABLE_SQUARE_SELECTOR).focus();
  await page.keyboard.press(NEXT_ELEMENT_KEYS[browserName] ?? DEFAULT_NEXT_ELEMENT_KEY);
}

for (const viewport of [PHONE_VIEWPORT, LAPTOP_VIEWPORT]) {
  const { width, height } = viewport;

  test.describe(`move list at ${width}x${height}`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('is left out of the Tab order before the first move', async ({ page, browserName }) => {
      await tabOutOfBoard({ page, browserName });

      await expect(page.getByRole('button', { name: NEW_GAME_BUTTON_NAME })).toBeFocused();
      await expect(page.locator(MOVE_LIST_SELECTOR)).toBeHidden();
    });

    test('takes the focus after a move, with a visible focus ring', async ({
      page,
      browserName,
    }) => {
      await playMoves({ page, moves: [FIRST_MOVE] });

      await tabOutOfBoard({ page, browserName });

      const list = page.locator(MOVE_LIST_SELECTOR);
      await expect(list).toBeFocused();
      const {
        isFocusVisible,
        outlineStyle,
        outlineWidth,
        height: listHeight,
      } = await list.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          isFocusVisible: node.matches(':focus-visible'),
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth),
          height: node.getBoundingClientRect().height,
        };
      });
      expect(isFocusVisible, 'the keyboard focus shows a ring').toBe(true);
      expect(outlineStyle).not.toBe('none');
      expect(outlineWidth).toBeGreaterThan(0);
      expect(listHeight, 'the ring has a box to go around').toBeGreaterThan(0);
    });
  });
}
