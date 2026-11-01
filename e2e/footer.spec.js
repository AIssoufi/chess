import { addMoves } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';
import {
  FIXED_FOOTER_VIEWPORTS,
  FIXED_POSITION,
  LONG_GAME_TURNS,
  NARROW_CLEAR_VIEWPORT,
  PAGE_FOOTER_VIEWPORTS,
  STATIC_POSITION,
} from './helpers/footer/constants.js';
import {
  expectBoardWidth,
  expectFooterOffFrame,
  expectFooterPosition,
  readMissedButtonPoints,
} from './helpers/footer/utils.js';

for (const { width, height } of PAGE_FOOTER_VIEWPORTS) {
  test.describe(`with a footer in the page at ${width}x${height} (#197)`, () => {
    test.use({ viewport: { width, height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await addMoves({ page, turns: LONG_GAME_TURNS });
    });

    test('puts both blocks of the footer in the page', async ({ page }) => {
      await expectFooterPosition({ page, position: STATIC_POSITION });
    });

    test('keeps the footer off the game frame', async ({ page }) => {
      await expectFooterOffFrame(page);
    });

    test('leaves the whole new game button to the clicks', async ({ page }) => {
      expect(await readMissedButtonPoints(page)).toEqual([]);
    });
  });
}

for (const { width, height, boardWidth } of FIXED_FOOTER_VIEWPORTS) {
  test.describe(`with a fixed footer at ${width}x${height} (#197)`, () => {
    test.use({ viewport: { width, height } });

    test('keeps it off the game frame, and the board at its size', async ({ page }) => {
      await page.goto('/');
      await addMoves({ page, turns: LONG_GAME_TURNS });

      await expectFooterPosition({ page, position: FIXED_POSITION });
      await expectFooterOffFrame(page);
      await expectBoardWidth({ page, boardWidth });
    });
  });
}

test.describe('under the limit of the fixed footer (#197)', () => {
  const { width, height, boardWidth } = NARROW_CLEAR_VIEWPORT;

  test.use({ viewport: { width, height } });

  test(`keeps the board at its size at ${width}x${height}`, async ({ page }) => {
    await page.goto('/');

    await expectBoardWidth({ page, boardWidth });
  });
});
