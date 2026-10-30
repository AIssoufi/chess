import { COLORS } from '../app/js/colors/constants.js';
import { BOARD_SELECTOR } from '../app/js/squares/constants.js';
import { FRAME_SELECTOR, LAYOUT_VIEWPORTS } from './helpers/board/constants.js';
import { addCapturedPieces, addMoves } from './helpers/board/utils.js';
import {
  AA_LARGE_TEXT_CONTRAST_RATIO,
  AA_NON_TEXT_CONTRAST_RATIO,
  AA_TEXT_CONTRAST_RATIO,
} from './helpers/contrast/constants.js';
import {
  getLowestPixelContrast,
  getWorstContrast,
  parseCssColor,
  toPixelBox,
} from './helpers/contrast/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** Turns played, so that the move list shows its moves. */
const FILLED_TURNS = 2;

/** Pieces captured from each side, so that the prisoners show their symbols. */
const FILLED_CAPTURES = 2;

/**
 * The texts and icons outside the game frame, with the CSS property that paints them, the elements
 * whose texts they leave out and the WCAG ratio they must reach. The title sits on the photo
 * itself, and the footer and the social icons on a 60% black backdrop over it.
 */
const PHOTO_TARGETS = Object.freeze([
  { name: 'title', selector: 'h1', paint: 'color', minRatio: AA_LARGE_TEXT_CONTRAST_RATIO },
  {
    name: 'copyright text',
    selector: '.copyright',
    paint: 'color',
    excludedSelector: 'a',
    minRatio: AA_TEXT_CONTRAST_RATIO,
  },
  {
    name: 'copyright links',
    selector: '.copyright a',
    paint: 'color',
    minRatio: AA_TEXT_CONTRAST_RATIO,
  },
  {
    name: 'social icons',
    selector: '.social-links svg',
    paint: 'fill',
    minRatio: AA_NON_TEXT_CONTRAST_RATIO,
  },
]);

/** The paint of a hidden text or icon, which leaves the pixels behind it in the screenshot. */
const HIDDEN_PAINT = 'transparent';

/** The address inside a CSS `url("…")` value, as `getComputedStyle` writes it. */
const CSS_URL_PATTERN = /url\("(.+)"\)/;

/**
 * Waits until the photo of `body::before` is decoded, so that the screenshots show it rather than
 * the dark background color of the body, which every target would pass over. A missing photo fails.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<void>}
 */
function waitForPhoto(page) {
  return page.evaluate(async (urlPattern) => {
    const { backgroundImage } = getComputedStyle(document.body, '::before');
    const [, url] = backgroundImage.match(new RegExp(urlPattern)) ?? [];
    const photo = new Image();
    photo.src = url;
    await photo.decode();
  }, CSS_URL_PATTERN.source);
}

/**
 * Hides a text or an icon of `PHOTO_TARGETS` for the screenshots, by an inline style that the
 * Content Security Policy allows and that wins over the hover rules.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {(typeof PHOTO_TARGETS)[number]} params.target The text or the icon.
 * @returns {Promise<string>} Its computed paint, read before hiding it.
 */
function hideTarget({ page, target }) {
  return page.locator(target.selector).evaluateAll(
    (elements, { paint, hiddenPaint }) => {
      const color = getComputedStyle(elements[0]).getPropertyValue(paint);
      for (const element of elements) element.style.setProperty(paint, hiddenPaint, 'important');
      return color;
    },
    { paint: target.paint, hiddenPaint: HIDDEN_PAINT }
  );
}

/**
 * Reads the boxes of a text or an icon of `PHOTO_TARGETS` in the viewport: the lines of its texts,
 * those inside `excludedSelector` left out, or the whole box of an icon.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {(typeof PHOTO_TARGETS)[number]} params.target The text or the icon.
 * @returns {Promise<{ x: number, y: number, width: number, height: number }[]>} The boxes, in CSS
 *   pixels from the top left corner of the viewport.
 */
function readTargetRects({ page, target }) {
  return page.locator(target.selector).evaluateAll(
    (elements, { isIcon, excludedSelector }) => {
      const toPlainRect = ({ x, y, width, height }) => ({ x, y, width, height });
      if (isIcon) return elements.map((element) => toPlainRect(element.getBoundingClientRect()));

      return elements.flatMap((element) => {
        const rects = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
          const isBlank = node.textContent.trim() === '';
          const isExcluded =
            excludedSelector !== undefined && node.parentElement.closest(excludedSelector) !== null;
          if (isBlank || isExcluded) continue;

          const range = document.createRange();
          range.selectNodeContents(node);
          rects.push(...[...range.getClientRects()].map(toPlainRect));
        }
        return rects;
      });
    },
    { isIcon: target.paint === 'fill', excludedSelector: target.excludedSelector }
  );
}

/**
 * Reads the pixels of boxes of a PNG screenshot, which a canvas of the page decodes.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page A page with no Content Security Policy,
 *   which would refuse the image of the screenshot.
 * @param {Buffer} params.screenshot The PNG screenshot.
 * @param {{ x: number, y: number, width: number, height: number }[]} params.boxes The whole pixels
 *   to read, inside the screenshot.
 * @returns {Promise<number[]>} The red, green, blue and alpha values of each pixel, box by box.
 */
function readPixels({ page, screenshot, boxes }) {
  return page.evaluate(
    async ({ data, boxes }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      return boxes.flatMap(({ x, y, width, height }) => [
        ...context.getImageData(x, y, width, height).data,
      ]);
    },
    { data: screenshot.toString('base64'), boxes }
  );
}

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

    // The title has no background color, and the footer and the social icons a translucent one
    // that lets the photo through. Their paint turns transparent, which leaves the backdrops in
    // the screenshot, so their contrast is read from the pixels behind them, photo included: a
    // white photo would fail the title.
    test('keeps the title, the footer and the social icons at WCAG AA over the photo', async ({
      context,
    }) => {
      // A page of its own, out of the Content Security Policy of the fixtures: WebKit injects a
      // stylesheet for each screenshot, which that policy refuses.
      const page = await context.newPage();
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      await waitForPhoto(page);
      const colors = [];
      for (const target of PHOTO_TARGETS) colors.push(await hideTarget({ page, target }));

      for (const [index, target] of PHOTO_TARGETS.entries()) {
        await page.locator(target.selector).first().scrollIntoViewIfNeeded();
        const rects = await readTargetRects({ page, target });
        const boxes = rects.map((rect) => toPixelBox({ rect, width, height })).filter(Boolean);
        const screenshot = await page.screenshot({ scale: 'css' });
        const pixels = await readPixels({ page, screenshot, boxes });
        const foreground = parseCssColor(colors[index]);

        expect(foreground, target.name).not.toBeNull();
        const ratio = getLowestPixelContrast({ foreground, pixels });
        expect(ratio, target.name).not.toBeNull();
        expect(ratio, target.name).toBeGreaterThanOrEqual(target.minRatio);
      }
      await page.close();
    });
  });
}
