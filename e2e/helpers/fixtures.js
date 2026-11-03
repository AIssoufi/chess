import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';
import { CSP_HEADER_NAME, EVERY_PAGE_PATTERN, HEADERS_FILE } from './server/constants.js';
import { findHeaderValue, parseHeaderRules } from './server/utils.js';

/** The Content Security Policy that Cloudflare Pages sends with every page of the site. */
const PAGE_POLICY = findHeaderValue({
  headers: parseHeaderRules(readFileSync(HEADERS_FILE, 'utf8')).get(EVERY_PAGE_PATTERN),
  name: CSP_HEADER_NAME,
});

if (PAGE_POLICY === null) {
  throw new Error(`No ${CSP_HEADER_NAME} for ${EVERY_PAGE_PATTERN} in ${HEADERS_FILE}`);
}

/**
 * The style that lifts the blur of the photo behind the page. WebKit on the Linux CI image paints
 * without a GPU and takes 140 ms for a frame of it at 1280x800, against 25 ms without the blur,
 * which makes every test that moves the page several times slower.
 */
const NO_PHOTO_BLUR_STYLE = 'body::before { filter: none; }';

/**
 * Lifts the blur of the photo in the current document. The fixture runs it as an init script, so in
 * every document the page loads, before its own scripts. The sheet is built from a script, since
 * the Content Security Policy of the page refuses an inline style.
 *
 * @param {string} style The style that lifts the blur.
 */
function adoptPhotoBlurLift(style) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(style);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}

/**
 * The Playwright `test`, with a page that gets the Content Security Policy of `_headers`, which
 * `vite preview` leaves out, that fails its test on any uncaught error or console error of the
 * game, a violation of that policy included, and that shows the photo without its blur unless the
 * test sets `keepPhotoBlur`.
 */
export const test = base.extend({
  // The tests that read the real background behind the texts, such as the contrast spec, keep the
  // blur with `test.use({ keepPhotoBlur: true })`.
  keepPhotoBlur: [false, { option: true }],
  photoBlurLift: [
    async ({ page, keepPhotoBlur }, use) => {
      const isBlurLifted = !keepPhotoBlur;
      if (isBlurLifted) await page.addInitScript(adoptPhotoBlurLift, NO_PHOTO_BLUR_STYLE);
      await use(isBlurLifted);
    },
    { auto: true },
  ],
  contentSecurityPolicy: [
    async ({ page }, use) => {
      await page.route('**/*', async (route) => {
        const isPage = route.request().resourceType() === 'document';
        if (!isPage) return route.continue();

        const response = await route.fetch();
        await route.fulfill({
          response,
          headers: { ...response.headers(), [CSP_HEADER_NAME.toLowerCase()]: PAGE_POLICY },
        });
      });
      await use(PAGE_POLICY);
    },
    { auto: true },
  ],
  pageErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
