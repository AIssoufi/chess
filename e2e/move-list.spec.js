import { TABBABLE_INDEX } from '../app/js/board-navigation/constants.js';
import { BOARD_SQUARE_SELECTOR, MOVE_LIST_SELECTOR } from '../app/js/rendering/constants.js';
import {
  LANDSCAPE_VIEWPORTS,
  LAYOUT_VIEWPORTS,
  LONG_TURNS_MOVES,
} from './helpers/board/constants.js';
import { playMoves } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';
import { expectOneLineTurns } from './helpers/landscape/utils.js';

/** A phone held upright, where #149 saw the empty list take the focus with a 0px high box. */
const PHONE_VIEWPORT = Object.freeze({ width: 390, height: 800 });

/** A laptop, where the move list sits beside the board. */
const LAPTOP_VIEWPORT = Object.freeze({ width: 1280, height: 800 });

/** The square of the board that the Tab key reaches, the others being left to the arrow keys. */
const TABBABLE_SQUARE_SELECTOR = `${BOARD_SQUARE_SELECTOR}[tabindex="${TABBABLE_INDEX}"]`;

/** The name of the button under the move list that starts a new game. */
const NEW_GAME_BUTTON_NAME = 'Nouvelle partie';

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

/** The first turn whose number has three digits, and the next one, past the threshold. */
const THREE_DIGIT_TURNS = Object.freeze([100, 101]);

/** The two moves of the longest turn that the styles of the list plan for. */
const LONGEST_TURN = Object.freeze(['gxf1=D+', 'Cb1xd2+']);

/** The last turn of the shorter lists, which keep their usual indent. */
const LAST_TWO_DIGIT_TURN = 99;

/**
 * Tells whether a viewport is one of the short landscape screens.
 *
 * @param {{ width: number, height: number }} viewport The viewport to check.
 * @returns {boolean} Whether the short landscape layout applies.
 */
const isLandscapeViewport = (viewport) => LANDSCAPE_VIEWPORTS.includes(viewport);

/** The screens upright and on a laptop, whose list keeps the size of its fonts. */
const STANDARD_VIEWPORTS = LAYOUT_VIEWPORTS.filter((viewport) => !isLandscapeViewport(viewport));

/**
 * Plays long turns, then numbers the list up to a turn, as a game that lasted that long: copies of
 * the first turn fill the list before the turns played, the last turn shows the longest moves, and
 * the list stays scrolled to it.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {number} params.lastTurn The number of the last turn of the list.
 */
async function playLongGame({ page, lastTurn }) {
  await playMoves({ page, moves: LONG_TURNS_MOVES });
  await page.evaluate(
    ({ listSelector, turnCount, longestTurn }) => {
      const list = document.querySelector(listSelector);
      const turnsPlayed = [...list.children];
      const firstTurn = turnsPlayed[0];
      const copies = Array.from({ length: turnCount - turnsPlayed.length }, () =>
        firstTurn.cloneNode(true)
      );
      list.prepend(...copies);
      [...list.children].forEach((turn, index) => {
        turn.value = index + 1;
      });
      [...turnsPlayed.at(-1).children].forEach((move, index) => {
        move.textContent = longestTurn[index];
      });
      list.scrollTop = list.scrollHeight;
    },
    { listSelector: MOVE_LIST_SELECTOR, turnCount: lastTurn, longestTurn: LONGEST_TURN }
  );
}

/**
 * Reads the room that the list leaves its numbers and what the last number takes. A list marker
 * has no box of its own to read, so a text with the same font and the same trailing space stands
 * for it.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<{
 *   indent: number,
 *   numberWidth: number,
 *   lineHeight: number,
 *   turnHeight: number,
 * }>} The widths and the heights, in pixels.
 */
function readTurnNumbers(page) {
  return page.evaluate((listSelector) => {
    const list = document.querySelector(listSelector);
    const turns = [...list.children];
    const { paddingLeft, lineHeight } = getComputedStyle(list);
    const turnHeight = Math.max(...turns.map((turn) => turn.getBoundingClientRect().height));
    const number = document.createElement('span');
    number.style.cssText = 'position: absolute; white-space: pre';
    number.textContent = `${turns.at(-1).value}. `;
    list.append(number);
    const numberWidth = number.getBoundingClientRect().width;
    number.remove();
    return {
      indent: parseFloat(paddingLeft),
      numberWidth,
      lineHeight: parseFloat(lineHeight),
      turnHeight,
    };
  }, MOVE_LIST_SELECTOR);
}

for (const viewport of [...STANDARD_VIEWPORTS, ...LANDSCAPE_VIEWPORTS]) {
  const { width, height } = viewport;

  test.describe(`turn numbers of the move list at ${width}x${height} (#178)`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    for (const lastTurn of THREE_DIGIT_TURNS) {
      test(`shows the number of turn ${lastTurn} whole`, async ({ page }) => {
        await playLongGame({ page, lastTurn });

        const turnNumbers = await readTurnNumbers(page);
        expect(turnNumbers.numberWidth).toBeLessThanOrEqual(turnNumbers.indent);
        if (isLandscapeViewport(viewport)) expectOneLineTurns(turnNumbers);
      });
    }

    test('keeps the indent of the shorter lists up to turn 99', async ({ page }) => {
      await playLongGame({ page, lastTurn: LAST_TWO_DIGIT_TURN });
      const { indent } = await readTurnNumbers(page);

      await page.locator(MOVE_LIST_SELECTOR).evaluate((list) => {
        list.replaceChildren(...[...list.children].slice(-1));
      });
      expect((await readTurnNumbers(page)).indent).toBe(indent);
    });
  });
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
