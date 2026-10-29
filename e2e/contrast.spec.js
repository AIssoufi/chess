import { COLORS } from '../app/js/colors/constants.js';
import { BOARD_SELECTOR } from '../app/js/squares/constants.js';
import { FRAME_SELECTOR, LAYOUT_VIEWPORTS } from './helpers/board/constants.js';
import { addCapturedPieces, addMoves } from './helpers/board/utils.js';
import { AA_TEXT_CONTRAST_RATIO } from './helpers/contrast/constants.js';
import { getWorstContrast } from './helpers/contrast/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** Turns played, so that the move list shows its moves. */
const FILLED_TURNS = 2;

/** Pieces captured from each side, so that the prisoners show their symbols. */
const FILLED_CAPTURES = 2;

/**
 * Reads every visible text of the game frame outside the board, with its color and the background
 * colors of the boxes around it, from the frame inward. The board squares paint their own opaque
 * colors, so their texts are left out.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<{ text: string, color: string, layers: string[] }[]>} The texts.
 */
function readFrameTexts(page) {
  return page.locator(FRAME_SELECTOR).evaluate((frame, boardSelector) => {
    const frameParent = frame.parentElement;
    const texts = [];
    const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const element = node.parentElement;
      const isBlank = node.textContent.trim() === '';
      const isOnBoard = element.closest(boardSelector) !== null;
      const range = document.createRange();
      range.selectNodeContents(node);
      const isHidden = range.getClientRects().length === 0;
      if (isBlank || isOnBoard || isHidden) continue;

      const layers = [];
      for (let box = element; box !== frameParent; box = box.parentElement) {
        layers.unshift(getComputedStyle(box).backgroundColor);
      }
      texts.push({ text: node.textContent.trim(), color: getComputedStyle(element).color, layers });
    }
    return texts;
  }, BOARD_SELECTOR);
}

for (const viewport of LAYOUT_VIEWPORTS) {
  const { width, height } = viewport;

  test.describe(`at ${width}x${height}`, () => {
    // The blinking of the side to move fades its green, which the reduced motion rule stops.
    test.use({ viewport, reducedMotion: 'reduce' });

    test('keeps every text of the game frame at WCAG AA over any photo', async ({ page }) => {
      await page.goto('/');
      const emptyGameTexts = await readFrameTexts(page);
      await addMoves({ page, turns: FILLED_TURNS });
      for (const color of COLORS) {
        await addCapturedPieces({ page, color, count: FILLED_CAPTURES });
      }
      const texts = [...emptyGameTexts, ...(await readFrameTexts(page))];

      expect(texts.length).toBeGreaterThan(0);
      for (const { text, color, layers } of texts) {
        expect(getWorstContrast({ text: color, layers }), text).toBeGreaterThanOrEqual(
          AA_TEXT_CONTRAST_RATIO
        );
      }
    });
  });
}
