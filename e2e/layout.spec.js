import { BOARD_SIZE } from '../app/js/squares/constants.js';
import pawn from '../app/js/pieces/pawn.js';
import { CAPTURES_ID_SUFFIX } from '../app/js/rendering/constants.js';
import {
  GRID_TOLERANCE_PX,
  LAYOUT_VIEWPORTS,
  MAX_CAPTURED_PIECES,
  MAX_SQUARE_SIZE_PX,
  MIN_SQUARE_SIZE_PX,
} from './helpers/board/constants.js';
import { getGridPlace, readLayout } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

const SQUARE_COUNT = BOARD_SIZE * BOARD_SIZE;

/** The laptop viewport where #49 saw 15 captured pieces stretch a panel past the screen. */
const CAPTURES_VIEWPORT = { width: 1280, height: 800 };

const CAPTURES_VIEWPORT_LABEL = `${CAPTURES_VIEWPORT.width}x${CAPTURES_VIEWPORT.height}`;

for (const viewport of LAYOUT_VIEWPORTS) {
  const { width, height, boardOverflowIssue } = viewport;

  test.describe(`at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('does not scroll sideways', async ({ page }) => {
      const { scrollWidth, clientWidth } = await readLayout(page);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test('lays out the 64 squares in a grid, white at the bottom, inside the width', async ({
      page,
    }) => {
      const { board, squares, clientWidth } = await readLayout(page);
      expect(squares).toHaveLength(SQUARE_COUNT);
      const size = squares[0].width;
      expect(size).toBeGreaterThanOrEqual(MIN_SQUARE_SIZE_PX);
      expect(size).toBeLessThanOrEqual(MAX_SQUARE_SIZE_PX);
      for (const { square, left, top, width: squareWidth, height: squareHeight } of squares) {
        const place = getGridPlace(square);
        expect(place, `square of ${square}`).not.toBeNull();
        const { column, row } = place;
        expect(Math.abs(squareWidth - size), square).toBeLessThanOrEqual(GRID_TOLERANCE_PX);
        expect(Math.abs(squareHeight - size), square).toBeLessThanOrEqual(GRID_TOLERANCE_PX);
        expect(Math.abs(left - (board.left + column * size)), square).toBeLessThanOrEqual(
          GRID_TOLERANCE_PX
        );
        expect(Math.abs(top - (board.top + row * size)), square).toBeLessThanOrEqual(
          GRID_TOLERANCE_PX
        );
      }
      expect(board.left).toBeGreaterThanOrEqual(0);
      expect(board.right).toBeLessThanOrEqual(clientWidth);
    });

    const declareBoardFitTest = boardOverflowIssue ? test.fixme : test;
    const issueSuffix = boardOverflowIssue ? ` (#${boardOverflowIssue})` : '';

    declareBoardFitTest(
      `shows the whole board without scrolling${issueSuffix}`,
      async ({ page }) => {
        const { board, clientHeight } = await readLayout(page);

        expect(board.top).toBeGreaterThanOrEqual(0);
        expect(board.bottom).toBeLessThanOrEqual(clientHeight);
      }
    );
  });
}

test.describe(`with ${MAX_CAPTURED_PIECES} captured pieces at ${CAPTURES_VIEWPORT_LABEL}`, () => {
  test.use({ viewport: CAPTURES_VIEWPORT });

  test.fixme('keeps the game inside the screen (#49)', async ({ page }) => {
    await page.goto('/');
    await page.locator(`#white${CAPTURES_ID_SUFFIX}`).evaluate(
      (zone, { count, symbol }) => {
        for (let index = 0; index < count; index += 1) {
          const piece = document.createElement('span');
          piece.className = 'piece';
          piece.textContent = symbol;
          zone.appendChild(piece);
        }
      },
      { count: MAX_CAPTURED_PIECES, symbol: pawn.piece.black }
    );

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight).toBeLessThanOrEqual(CAPTURES_VIEWPORT.height);
  });
});
