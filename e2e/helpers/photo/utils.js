import { CSS_URL_PATTERN } from './constants.js';

/**
 * Waits until the photo of `body::before` is decoded, so that the screenshots show it rather than
 * the dark background color of the body. A missing photo fails.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<void>}
 */
export function waitForPhoto(page) {
  return page.evaluate(async (urlPattern) => {
    const { backgroundImage } = getComputedStyle(document.body, '::before');
    const [, url] = backgroundImage.match(new RegExp(urlPattern)) ?? [];
    const photo = new Image();
    photo.src = url;
    await photo.decode();
  }, CSS_URL_PATTERN.source);
}
