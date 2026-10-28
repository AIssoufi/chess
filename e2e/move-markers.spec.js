import { LAST_MOVE_CLASS } from '../app/js/last-move/constants.js';
import { BOARD_SQUARE_SELECTOR, PIECE_SELECTOR } from '../app/js/rendering/constants.js';
import { CAPTURE_MOVE_CLASS, POSSIBLE_MOVE_CLASS } from '../app/js/selection/constants.js';
import { LAYOUT_VIEWPORTS } from './helpers/board/constants.js';
import { getSquare, playMoves, readLayout } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** 1. e4 d5: the pawn of white on e4 may then move to the empty e5 or take the pawn on d5. */
const CAPTURE_OPENING_MOVES = Object.freeze([
  { from: 'e2', to: 'e4' },
  { from: 'd7', to: 'd5' },
]);

/** The pawn selected after `CAPTURE_OPENING_MOVES`. */
const SELECTED_SQUARE = 'e4';

/** The empty square that the selected pawn can reach, marked with a dot. */
const EMPTY_TARGET = 'e5';

/** The square of the pawn that the selected pawn can take, marked with a ring. */
const CAPTURE_TARGET = 'd5';

/** The start and target squares of the last move of `CAPTURE_OPENING_MOVES`. */
const LAST_MOVE_SQUARES = Object.freeze(['d7', 'd5']);

/** The triangles that mark a square of the last move, one per corner. */
const CORNER_COUNT = 4;

/** The computed `content` of a pseudo-element drawn with an empty string. */
const EMPTY_CONTENT = '""';

/** The computed color of a transparent background. */
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

/**
 * How far down the square, as a share of its side, a point sits on the band of the ring: the ring
 * starts 4% inside the square and is 8% thick.
 */
const RING_BAND_SHARE = 0.08;

/**
 * Reads the marker of a square, its `::before` pseudo-element, and the side of the square.
 *
 * @param {import('@playwright/test').Locator} square The button of the square.
 * @returns {Promise<{ content: string, width: number, borderWidth: number, background: string,
 *   squareWidth: number }>} The computed content, width, border width and background color of the
 *   marker, in CSS pixels, with the width of the square.
 */
function readMarker(square) {
  return square.evaluate((node) => {
    const style = getComputedStyle(node, '::before');
    return {
      content: style.content,
      width: parseFloat(style.width),
      borderWidth: parseFloat(style.borderTopWidth),
      background: style.backgroundColor,
      squareWidth: node.getBoundingClientRect().width,
    };
  });
}

for (const { width, height } of LAYOUT_VIEWPORTS) {
  test.describe(`possible moves at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await playMoves({ page, moves: CAPTURE_OPENING_MOVES });
    });

    test('marks an empty target with a dot and a capture with a ring', async ({ page }) => {
      await getSquare({ page, square: SELECTED_SQUARE }).click();

      const emptyTarget = getSquare({ page, square: EMPTY_TARGET });
      const captureTarget = getSquare({ page, square: CAPTURE_TARGET });
      await expect(emptyTarget).toContainClass(POSSIBLE_MOVE_CLASS);
      await expect(emptyTarget).not.toContainClass(CAPTURE_MOVE_CLASS);
      await expect(captureTarget).toContainClass(`${POSSIBLE_MOVE_CLASS} ${CAPTURE_MOVE_CLASS}`);

      const dot = await readMarker(emptyTarget);
      expect(dot.content).toBe(EMPTY_CONTENT);
      expect(dot.borderWidth).toBe(0);
      expect(dot.background).not.toBe(TRANSPARENT);
      expect(dot.width).toBeLessThan(dot.squareWidth / 2);

      const ring = await readMarker(captureTarget);
      expect(ring.content).toBe(EMPTY_CONTENT);
      expect(ring.borderWidth).toBeGreaterThan(0);
      expect(ring.background).toBe(TRANSPARENT);
      expect(ring.width).toBeGreaterThan(ring.squareWidth / 2);
    });

    test('paints the piece to capture over its ring', async ({ page }) => {
      await getSquare({ page, square: SELECTED_SQUARE }).click();

      const box = await getSquare({ page, square: CAPTURE_TARGET }).boundingBox();
      const squareOfTopPiece = await page.evaluate(
        ({ x, y, pieceSelector, squareSelector }) => {
          const piece = document.elementFromPoint(x, y)?.closest(pieceSelector);
          return piece?.closest(squareSelector)?.dataset.position ?? null;
        },
        {
          x: box.x + box.width / 2,
          y: box.y + box.height * RING_BAND_SHARE,
          pieceSelector: PIECE_SELECTOR,
          squareSelector: BOARD_SQUARE_SELECTOR,
        }
      );
      expect(squareOfTopPiece).toBe(CAPTURE_TARGET);
    });

    test('moves no square when the markers show', async ({ page }) => {
      const before = await readLayout(page);
      await getSquare({ page, square: SELECTED_SQUARE }).click();

      expect(await readLayout(page)).toEqual(before);
    });
  });

  test.describe(`last move at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('marks both squares of the last move with corners', async ({ page }) => {
      await playMoves({ page, moves: CAPTURE_OPENING_MOVES });

      for (const square of LAST_MOVE_SQUARES) {
        const squareNode = getSquare({ page, square });
        await expect(squareNode).toContainClass(LAST_MOVE_CLASS);
        const corners = await squareNode.evaluate((node) => {
          const style = getComputedStyle(node, '::after');
          return { content: style.content, image: style.backgroundImage };
        });
        expect(corners.content).toBe(EMPTY_CONTENT);
        expect(corners.image.match(/linear-gradient/g)).toHaveLength(CORNER_COUNT);
      }
    });

    test('moves no square when the last move is marked', async ({ page }) => {
      await playMoves({ page, moves: CAPTURE_OPENING_MOVES });
      await getSquare({ page, square: SELECTED_SQUARE }).click();
      const marked = await readLayout(page);

      // The moves themselves may lengthen the page, so compare with the same position unmarked.
      await page.evaluate((className) => {
        document
          .querySelectorAll(`.${className}`)
          .forEach((node) => node.classList.remove(className));
      }, LAST_MOVE_CLASS);
      await expect(page.locator(`.${LAST_MOVE_CLASS}`)).toHaveCount(0);

      expect(await readLayout(page)).toEqual(marked);
    });
  });
}
