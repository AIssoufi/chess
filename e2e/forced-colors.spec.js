import { BOARD_SELECTOR } from '../app/js/squares/constants.js';
import { getSquare, playMoves, press } from './helpers/board/utils.js';
import {
  AA_NON_TEXT_CONTRAST_RATIO,
  AA_TEXT_CONTRAST_RATIO,
} from './helpers/contrast/constants.js';
import { blendColors, getContrastRatio, parseCssColor } from './helpers/contrast/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** The color schemes of a system in forced colors mode, each with its own palette. */
const COLOR_SCHEMES = Object.freeze(['light', 'dark']);

/** 1. e4 d5: the pawn of white on e4 may then move to the empty e5 or take the pawn on d5. */
const CAPTURE_OPENING_MOVES = Object.freeze([
  { from: 'e2', to: 'e4' },
  { from: 'd7', to: 'd5' },
]);

/** 1. e4 f5 2. Qh5+: the queen of white checks the king of black on e8. */
const CHECK_MOVES = Object.freeze([
  { from: 'e2', to: 'e4' },
  { from: 'f7', to: 'f5' },
  { from: 'd1', to: 'h5' },
]);

/** The king in check after `CHECK_MOVES`. */
const CHECKED_SQUARE = 'e8';

/** The pawn selected after `CAPTURE_OPENING_MOVES`, on a light square. */
const SELECTED_SQUARE = 'e4';

/** The empty square that the selected pawn can reach, marked with a dot. */
const EMPTY_TARGET = 'e5';

/** The square of the pawn that the selected pawn can take, marked with a ring. */
const CAPTURE_TARGET = 'd5';

/** The start and target squares of the last move of `CAPTURE_OPENING_MOVES`. */
const LAST_MOVE_SQUARES = Object.freeze(['d7', 'd5']);

/** A dark square holding a piece, which no move of `CAPTURE_OPENING_MOVES` reaches. */
const DARK_SQUARE = 'a1';

/** A light square holding a piece, next to `DARK_SQUARE`, which no move reaches either. */
const LIGHT_SQUARE = 'b1';

/** The translucent black that a hovered square takes, over whatever lies behind the board. */
const HOVERED_SQUARE_BACKGROUND = 'rgba(0, 0, 0, 0.5)';

/** The squares of the selection and of the capture, whose pieces stand on a marked background. */
const MARKED_PIECE_SQUARES = Object.freeze([SELECTED_SQUARE, CAPTURE_TARGET]);

/**
 * The lowest contrast between the two colors of the checkerboard: the 1.96:1 of the board outside
 * forced colors mode, whose colors stay, rounded down. The pieces and marks reach WCAG AA; the
 * checkerboard conveys no state.
 */
const CHECKERBOARD_CONTRAST_RATIO = 1.9;

/** The triangles that mark a square of the last move, one per corner. */
const CORNER_COUNT = 4;

/** The computed `box-shadow` of a square without any ring. */
const NO_SHADOW = 'none';

/** The white lining of the focus ring, in the computed `box-shadow` of the focused square. */
const FOCUS_LINING_COLOR = 'rgb(255, 255, 255)';

/** The inset rings of a selected square that has the focus: the white lining and the selection. */
const FOCUSED_SELECTION_RING_COUNT = 2;

/** The color at the start of a computed `box-shadow` or of the first stop of a gradient. */
const FIRST_COLOR_PATTERN = /rgba?\([^)]*\)/;

/**
 * Reads what a square paints.
 *
 * @param {import('@playwright/test').Locator} square The button of the square.
 * @returns {Promise<{ background: string, backgroundImage: string, boxShadow: string,
 *   pieceColor: string, marker: { background: string, borderColor: string },
 *   cornersImage: string }>} The computed values of the square, its text and its pseudo-elements.
 */
function readSquare(square) {
  return square.evaluate((node) => {
    const style = getComputedStyle(node);
    const marker = getComputedStyle(node, '::before');
    return {
      background: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      pieceColor: style.color,
      marker: { background: marker.backgroundColor, borderColor: marker.borderTopColor },
      cornersImage: getComputedStyle(node, '::after').backgroundImage,
    };
  });
}

/**
 * Gives the contrast of two computed colors, as `parseCssColor` reads them.
 *
 * @param {object} params
 * @param {string} params.foreground The computed color on top, translucent or not.
 * @param {string} params.background The computed opaque color under it.
 * @returns {number} From 1, for the same colors, to 21, for black on white.
 */
function getCssContrast({ foreground, background }) {
  return getContrastRatio({
    foreground: parseCssColor(foreground),
    background: parseCssColor(background),
  });
}

/**
 * Reads the color that opens a computed value holding several tokens.
 *
 * @param {string} value A computed `box-shadow` or `background-image`.
 * @returns {string} Its first color, or an empty string when it has none.
 */
function readFirstColor(value) {
  return FIRST_COLOR_PATTERN.exec(value)?.[0] ?? '';
}

test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'WebKit matches the media query under emulation, but paints the normal colors of the page'
);

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`forced colors, ${colorScheme} scheme`, () => {
    test.use({ forcedColors: 'active', colorScheme });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test.describe('after 1. e4 d5, with the pawn on e4 selected', () => {
      test.beforeEach(async ({ page }) => {
        await playMoves({ page, moves: CAPTURE_OPENING_MOVES });
        await press(getSquare({ page, square: SELECTED_SQUARE }));
      });

      test('tells the dark squares from the light ones', async ({ page }) => {
        const dark = await readSquare(getSquare({ page, square: DARK_SQUARE }));
        const light = await readSquare(getSquare({ page, square: LIGHT_SQUARE }));

        const contrast = getCssContrast({
          foreground: dark.background,
          background: light.background,
        });
        expect(contrast).toBeGreaterThanOrEqual(CHECKERBOARD_CONTRAST_RATIO);
      });

      test('rings the selected square, which no other square shows', async ({ page }) => {
        const selected = await readSquare(getSquare({ page, square: SELECTED_SQUARE }));
        const light = await readSquare(getSquare({ page, square: LIGHT_SQUARE }));

        expect(light.boxShadow).toBe(NO_SHADOW);
        expect(selected.boxShadow).not.toBe(NO_SHADOW);
        const contrast = getCssContrast({
          foreground: readFirstColor(selected.boxShadow),
          background: selected.background,
        });
        expect(contrast).toBeGreaterThanOrEqual(AA_NON_TEXT_CONTRAST_RATIO);
      });

      test('keeps the white lining of the focus around the selected ring', async ({ page }) => {
        const selectedSquare = getSquare({ page, square: SELECTED_SQUARE });

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');

        await expect(selectedSquare).toBeFocused();
        await expect(selectedSquare).toHaveCSS('outline-style', 'solid');
        const { boxShadow } = await readSquare(selectedSquare);
        expect(boxShadow.startsWith(FOCUS_LINING_COLOR)).toBe(true);
        expect(boxShadow.match(/inset/g)).toHaveLength(FOCUSED_SELECTION_RING_COUNT);
      });

      test('shows the dot of a legal move', async ({ page }) => {
        const { background, marker } = await readSquare(getSquare({ page, square: EMPTY_TARGET }));

        const contrast = getCssContrast({ foreground: marker.background, background });
        expect(contrast).toBeGreaterThanOrEqual(AA_NON_TEXT_CONTRAST_RATIO);
      });

      test('shows the ring of a capture', async ({ page }) => {
        const { background, marker } = await readSquare(
          getSquare({ page, square: CAPTURE_TARGET })
        );

        const contrast = getCssContrast({ foreground: marker.borderColor, background });
        expect(contrast).toBeGreaterThanOrEqual(AA_NON_TEXT_CONTRAST_RATIO);
      });

      test('shows the corners of the last move', async ({ page }) => {
        for (const square of LAST_MOVE_SQUARES) {
          const { background, cornersImage } = await readSquare(getSquare({ page, square }));

          expect(cornersImage.match(/linear-gradient/g)).toHaveLength(CORNER_COUNT);
          const contrast = getCssContrast({
            foreground: readFirstColor(cornersImage),
            background,
          });
          expect(contrast).toBeGreaterThanOrEqual(AA_NON_TEXT_CONTRAST_RATIO);
        }
      });

      test('keeps every piece readable on its square', async ({ page }) => {
        for (const square of [DARK_SQUARE, LIGHT_SQUARE, ...MARKED_PIECE_SQUARES]) {
          const { background, pieceColor } = await readSquare(getSquare({ page, square }));

          const contrast = getCssContrast({ foreground: pieceColor, background });
          expect(contrast, `the piece on ${square}`).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST_RATIO);
        }
      });

      test('keeps the piece of a hovered square readable', async ({ page }) => {
        const square = getSquare({ page, square: DARK_SQUARE });
        const board = page.locator(BOARD_SELECTOR);

        await square.hover();

        await expect(square).toHaveCSS('background-color', HOVERED_SQUARE_BACKGROUND);
        const { background, pieceColor } = await readSquare(square);
        const boardBackground = await board.evaluate(
          (node) => getComputedStyle(node).backgroundColor
        );
        const contrast = getContrastRatio({
          foreground: parseCssColor(pieceColor),
          background: blendColors({
            top: parseCssColor(background),
            bottom: parseCssColor(boardBackground),
          }),
        });
        expect(contrast).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST_RATIO);
      });
    });

    test('keeps the stripes of a king in check', async ({ page }) => {
      await playMoves({ page, moves: CHECK_MOVES });

      const { backgroundImage } = await readSquare(getSquare({ page, square: CHECKED_SQUARE }));
      expect(backgroundImage).toContain('repeating-linear-gradient');
    });
  });
}
