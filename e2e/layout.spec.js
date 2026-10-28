import { BOARD_SIZE } from '../app/js/squares/constants.js';
import pawn from '../app/js/pieces/pawn.js';
import {
  CAPTURES_ID_SUFFIX,
  CONTROL_SELECTOR,
  MOVE_CLASS,
  MOVE_LIST_EMPTY_SELECTOR,
  MOVE_LIST_SELECTOR,
  PIECE_CLASS,
} from '../app/js/rendering/constants.js';
import {
  GRID_TOLERANCE_PX,
  LANDSCAPE_VIEWPORTS,
  LAYOUT_VIEWPORTS,
  NARROW_LAYOUT_MAX_WIDTH_PX,
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

/** The panel of white, which #33 puts above the move list on a phone held sideways. */
const WHITE_PANEL_SELECTOR = `${CONTROL_SELECTOR}[data-color="white"]`;

/** The whole move list, its title included, around the scrolling list of `MOVE_LIST_SELECTOR`. */
const MOVE_LIST_PANEL_SELECTOR = '.move-list';

/** The title of the move list, "Coups". */
const MOVE_LIST_TITLE_SELECTOR = `${MOVE_LIST_PANEL_SELECTOR} h2`;

/** How far two centered texts may sit apart, in CSS pixels: subpixel rounding only. */
const TEXT_CENTER_TOLERANCE_PX = 1;

/** The layout viewports under the 900px breakpoint, where the move list centers its texts. */
const NARROW_VIEWPORTS = LAYOUT_VIEWPORTS.filter(
  ({ width }) => width <= NARROW_LAYOUT_MAX_WIDTH_PX
);

/** Turns of a long game, more than the move list can show at once beside a phone's board. */
const LONG_GAME_TURNS = 40;

/** A turn of the move list, both moves played. */
const TURN_MOVES = Object.freeze(['Cxe4+', 'Dxh8#']);

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
      (zone, { count, pieceClass, symbol }) => {
        for (let index = 0; index < count; index += 1) {
          const piece = document.createElement('span');
          piece.className = pieceClass;
          piece.textContent = symbol;
          zone.appendChild(piece);
        }
      },
      { count: MAX_CAPTURED_PIECES, pieceClass: PIECE_CLASS, symbol: pawn.piece.black }
    );

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight).toBeLessThanOrEqual(CAPTURES_VIEWPORT.height);
  });
});

for (const viewport of LANDSCAPE_VIEWPORTS) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  test.describe(`with ${LONG_GAME_TURNS} turns in the move list at ${viewportLabel}`, () => {
    test.use({ viewport });

    test('keeps the move list beside the board, under white, inside the screen', async ({
      page,
    }) => {
      await page.goto('/');
      await page.locator(MOVE_LIST_SELECTOR).evaluate(
        (list, { count, moveClass, moves }) => {
          for (let turn = 1; turn <= count; turn += 1) {
            const item = document.createElement('li');
            for (const notation of moves) {
              const move = document.createElement('span');
              move.className = moveClass;
              move.textContent = notation;
              item.append(move, ' ');
            }
            list.appendChild(item);
          }
        },
        { count: LONG_GAME_TURNS, moveClass: MOVE_CLASS, moves: TURN_MOVES }
      );
      await page.locator(MOVE_LIST_EMPTY_SELECTOR).evaluate((note) => {
        note.hidden = true;
      });

      const { board, clientWidth, clientHeight } = await readLayout(page);
      const listNode = page.locator(MOVE_LIST_SELECTOR);
      const list = await page.locator(MOVE_LIST_PANEL_SELECTOR).boundingBox();
      const whitePanel = await page.locator(WHITE_PANEL_SELECTOR).boundingBox();
      const { scrollHeight, clientHeight: listHeight } = await listNode.evaluate((node) => ({
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      }));
      const listRight = list.x + list.width;
      const isBesideBoard = list.x >= board.right || listRight <= board.left;

      expect(board.top).toBeGreaterThanOrEqual(0);
      expect(board.bottom).toBeLessThanOrEqual(clientHeight);
      expect(isBesideBoard, 'the move list does not cover the board').toBe(true);
      expect(list.y).toBeGreaterThanOrEqual(whitePanel.y + whitePanel.height);
      expect(list.y + list.height).toBeLessThanOrEqual(clientHeight);
      expect(listRight).toBeLessThanOrEqual(clientWidth);
      expect(scrollHeight, 'the long list scrolls').toBeGreaterThan(listHeight);
    });
  });
}

for (const viewport of NARROW_VIEWPORTS) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  test.describe(`before the first move at ${viewportLabel}`, () => {
    test.use({ viewport });

    test('centers the empty move list note under its title', async ({ page }) => {
      await page.goto('/');

      const [titleCenter, noteCenter] = await page.evaluate(
        (selectors) =>
          selectors.map((selector) => {
            const range = document.createRange();
            range.selectNodeContents(document.querySelector(selector));
            const { left, right } = range.getBoundingClientRect();
            return (left + right) / 2;
          }),
        [MOVE_LIST_TITLE_SELECTOR, MOVE_LIST_EMPTY_SELECTOR]
      );

      expect(Math.abs(noteCenter - titleCenter)).toBeLessThanOrEqual(TEXT_CENTER_TOLERANCE_PX);
    });
  });
}
