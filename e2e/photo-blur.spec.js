import { expect, test } from './helpers/fixtures.js';

/** The filter of the photo once the fixtures lift its blur. */
const LIFTED_FILTER = 'none';

/** The filter of the photo that `app/css/style.css` gives it. */
const BLURRED_FILTER = 'blur(5px)';

/**
 * Reads the filter of the photo behind the page, the `body::before` pseudo-element.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<string>} Its computed filter.
 */
function readPhotoFilter(page) {
  return page.evaluate(() => getComputedStyle(document.body, '::before').filter);
}

test.describe('the photo blur of the fixtures', () => {
  test('is lifted on the page and after a reload', async ({ page }) => {
    await page.goto('/');
    expect(await readPhotoFilter(page)).toBe(LIFTED_FILTER);

    await page.reload();
    expect(await readPhotoFilter(page)).toBe(LIFTED_FILTER);
  });

  test.describe('with keepPhotoBlur', () => {
    test.use({ keepPhotoBlur: true });

    test('stays on the page', async ({ page }) => {
      await page.goto('/');
      expect(await readPhotoFilter(page)).toBe(BLURRED_FILTER);
    });
  });
});
