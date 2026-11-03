import { writeFile } from 'node:fs/promises';
import { CURRENT_PLAYER_LABEL } from '../app/js/labels/constants.js';
import { getSquare, playMoves, press } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';
import { waitForPhoto } from './helpers/photo/utils.js';

/**
 * Captures the social preview and the README screenshot from the built game, so a refresh runs
 * `CAPTURE_IMAGES=1 pnpm test:e2e e2e/capture-images.spec.js --project=chromium` again. The suite
 * skips it, since it rewrites tracked files.
 */

/** The environment variable that turns the capture on. */
const CAPTURE_FLAG = 'CAPTURE_IMAGES';

/** The only project that captures: the images show the game as Chromium renders it. */
const CAPTURE_PROJECT = 'chromium';

/** An Italian game after 3...Bc5: the move list holds three turns and white is to move. */
const SCENE_MOVES = Object.freeze([
  { from: 'e2', to: 'e4' },
  { from: 'e7', to: 'e5' },
  { from: 'g1', to: 'f3' },
  { from: 'b8', to: 'c6' },
  { from: 'f1', to: 'c4' },
  { from: 'f8', to: 'c5' },
]);

/** The knight selected in the scene: its moves show dots and its capture on e5 a ring. */
const SELECTED_SQUARE = 'f3';

/** The social preview: the 1200x630 size that Open Graph cards use, in JPEG. */
const SOCIAL_IMAGE = Object.freeze({
  file: 'app/public/og-image.jpg',
  viewport: { width: 1200, height: 630 },
  qualityPercent: 80,
});

/** The README screenshot, in WebP, which Chromium encodes from a canvas. */
const README_IMAGE = Object.freeze({
  file: 'docs/screenshot.webp',
  viewport: { width: 1280, height: 800 },
  qualityRatio: 0.8,
});

/** The MIME type of the README screenshot. */
const WEBP_TYPE = 'image/webp';

/**
 * Encodes a PNG as WebP in a blank page of the browser, whose canvas writes WebP, so the capture
 * needs no image package.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page A page with no Content Security Policy.
 * @param {Buffer} params.png The PNG to encode.
 * @param {number} params.quality The WebP quality, from 0 to 1.
 * @returns {Promise<Buffer>} The WebP bytes.
 */
async function encodeWebp({ page, png, quality }) {
  const base64 = await page.evaluate(
    async ({ source, type, level }) => {
      const blob = await (await fetch(`data:image/png;base64,${source}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
      const webp = await canvas.convertToBlob({ type, quality: level });
      const bytes = new Uint8Array(await webp.arrayBuffer());
      return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
    },
    { source: png.toString('base64'), type: WEBP_TYPE, level: quality }
  );
  return Buffer.from(base64, 'base64');
}

/**
 * Opens the game at a viewport, plays the scene and selects the knight, with the pointer moved
 * off the board so no square shows its hover.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {{ width: number, height: number }} params.viewport The size of the capture.
 */
async function showScene({ page, viewport }) {
  await page.setViewportSize(viewport);
  await page.goto('/');
  await playMoves({ page, moves: SCENE_MOVES });
  await press(getSquare({ page, square: SELECTED_SQUARE }));
  await page.mouse.move(0, 0);
  await expect(page.getByText(CURRENT_PLAYER_LABEL)).toBeVisible();
  await waitForPhoto(page);
}

// The images show the page as a visitor sees it: the photo keeps the blur that the fixtures lift
// elsewhere, and the side to move its static green, without the blinking that follows a move.
test.use({ keepPhotoBlur: true, reducedMotion: 'reduce' });

test('captures the social preview and the README screenshot', async ({ page }, testInfo) => {
  const isCaptureOn = Boolean(process.env[CAPTURE_FLAG]);
  const isCaptureProject = testInfo.project.name === CAPTURE_PROJECT;
  test.skip(!isCaptureOn, `Set ${CAPTURE_FLAG}=1 to rewrite the images`);
  test.skip(!isCaptureProject, `Captured in ${CAPTURE_PROJECT} only`);

  await showScene({ page, viewport: SOCIAL_IMAGE.viewport });
  await page.screenshot({
    path: SOCIAL_IMAGE.file,
    type: 'jpeg',
    quality: SOCIAL_IMAGE.qualityPercent,
  });

  await showScene({ page, viewport: README_IMAGE.viewport });
  const png = await page.screenshot({ type: 'png' });
  const blankPage = await page.context().newPage();
  const webp = await encodeWebp({ page: blankPage, png, quality: README_IMAGE.qualityRatio });
  await writeFile(README_IMAGE.file, webp);
});
