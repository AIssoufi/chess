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

/** The social icons of the footer; the first one is GitHub's. */
const SOCIAL_ICON_SELECTOR = '.social-links svg';

/** The fill of a social icon under nothing: a translucent white. */
const RESTING_ICON_FILL = 'rgba(255, 255, 255, 0.44)';

/** The fill of a social icon under a mouse: the orange of the dark squares. */
const HOVERED_ICON_FILL = 'rgb(209, 139, 70)';

test.describe('a social icon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('turns orange under a mouse', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'a touch screen has no pointer to hover the icons with');
    const icon = page.locator(SOCIAL_ICON_SELECTOR).first();

    await icon.hover();

    await expect(icon).toHaveCSS('fill', HOVERED_ICON_FILL);
  });

  // A tap leaves the pointer over the icon, as a hover does: it then stayed orange (#211).
  test('keeps its color under a finger', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'only a touch screen keeps the pointer where the finger left it');
    const icon = page.locator(SOCIAL_ICON_SELECTOR).first();

    await icon.hover();

    expect(await icon.evaluate((node) => getComputedStyle(node).fill)).toBe(RESTING_ICON_FILL);
  });
});

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
