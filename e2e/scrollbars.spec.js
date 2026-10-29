import { FRAME_SELECTOR, PHONE_LANDSCAPE_VIEWPORT } from './helpers/board/constants.js';
import { readLayout } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

/**
 * Chromium options for the classic scrollbars of a desktop window, which take room from the page:
 * Playwright hides scrollbars in headless Chromium, and macOS draws overlay ones that take none.
 */
const CLASSIC_SCROLLBARS_LAUNCH_OPTIONS = Object.freeze({
  args: ['--disable-features=OverlayScrollbar'],
  ignoreDefaultArgs: ['--hide-scrollbars'],
});

/**
 * Windows whose page is taller than the screen, so a vertical scrollbar takes its width: the
 * narrowest supported width, a phone upright, the 600px window of #48 and a phone held sideways.
 */
const SCROLLING_VIEWPORTS = Object.freeze([
  { width: 320, height: 568 },
  { width: 390, height: 800 },
  { width: 600, height: 800 },
  PHONE_LANDSCAPE_VIEWPORT,
]);

test.use({ launchOptions: CLASSIC_SCROLLBARS_LAUNCH_OPTIONS });

test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'only Chromium can be given classic scrollbars from the command line'
);

for (const viewport of SCROLLING_VIEWPORTS) {
  const { width, height } = viewport;

  test.describe(`at ${width}x${height} with a classic scrollbar`, () => {
    test.use({ viewport });

    test('keeps the board inside the game frame, without scrolling sideways', async ({ page }) => {
      await page.goto('/');
      const frameLocator = page.locator(FRAME_SELECTOR);
      await expect(frameLocator).toBeVisible();

      const { board, scrollWidth, clientWidth } = await readLayout(page);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      const frame = await frameLocator.boundingBox();

      expect(clientWidth, 'the scrollbar takes room from the page').toBeLessThan(viewportWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      expect(board.left).toBeGreaterThanOrEqual(frame.x);
      expect(board.right).toBeLessThanOrEqual(frame.x + frame.width);
    });
  });
}
