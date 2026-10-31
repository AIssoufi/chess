import { COLORS } from '../app/js/colors/constants.js';
import { BOARD_SIZE } from '../app/js/squares/constants.js';
import {
  CAPTURE_COUNT_ID_SUFFIX,
  CAPTURES_ID_SUFFIX,
  CONTROL_SELECTOR,
  MOVE_LIST_EMPTY_SELECTOR,
  MOVE_LIST_SELECTOR,
  TURN_SELECTOR,
} from '../app/js/rendering/constants.js';
import {
  GRID_TOLERANCE_PX,
  LANDSCAPE_VIEWPORTS,
  LAYOUT_VIEWPORTS,
  NARROW_LAYOUT_MAX_WIDTH_PX,
  MAX_CAPTURED_PIECES,
  MAX_SQUARE_SIZE_PX,
  MIN_NARROW_LANDSCAPE_SQUARE_SIZE_PX,
  MIN_SQUARE_SIZE_PX,
  MOVE_LIST_PANEL_SELECTOR,
  NARROW_LANDSCAPE_VIEWPORTS,
  NARROW_UPRIGHT_VIEWPORTS,
  SCANDINAVIAN_MOVES,
  SHORT_TABLET_VIEWPORT,
  STACKED_TEXT_FONT_SIZE_PX,
  UPRIGHT_TABLET_VIEWPORTS,
} from './helpers/board/constants.js';
import {
  addCapturedPieces,
  addMoves,
  getGridPlace,
  playMoves,
  readLayout,
} from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

const SQUARE_COUNT = BOARD_SIZE * BOARD_SIZE;

/** The turns of `SCANDINAVIAN_MOVES` in the move list. */
const SCANDINAVIAN_TURNS = 3;

/** The laptop viewport where #49 saw 15 captured pieces stretch a panel past the screen. */
const CAPTURES_VIEWPORT = { width: 1280, height: 800 };

const CAPTURES_VIEWPORT_LABEL = `${CAPTURES_VIEWPORT.width}x${CAPTURES_VIEWPORT.height}`;

/** The value that `getComputedStyle` gives for the stacked font size. */
const STACKED_TEXT_FONT_SIZE = `${STACKED_TEXT_FONT_SIZE_PX}px`;

/** The panel of black, above the board in the stacked layout. */
const BLACK_PANEL_SELECTOR = `${CONTROL_SELECTOR}[data-color="black"]`;

/** The panel of white, which #33 puts above the move list on a phone held sideways. */
const WHITE_PANEL_SELECTOR = `${CONTROL_SELECTOR}[data-color="white"]`;

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

/** The copyright of the footer, which wraps on a phone. */
const COPYRIGHT_SELECTOR = 'footer .copyright';

/** The separator between the author and the license mention of the copyright. */
const COPYRIGHT_SEPARATOR = '·';

/** Phone widths where #148 saw the copyright wrap, or nearly, before the license mention. */
const FOOTER_VIEWPORTS = Object.freeze([
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]);

/** How far down a character must sit to start a new line, in CSS pixels: past subpixel rounding. */
const NEW_LINE_MIN_OFFSET_PX = 1;

for (const viewport of LAYOUT_VIEWPORTS) {
  const { width, height } = viewport;

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

    test('shows the whole board without scrolling', async ({ page }) => {
      const { board, clientHeight } = await readLayout(page);

      expect(board.top).toBeGreaterThanOrEqual(0);
      expect(board.bottom).toBeLessThanOrEqual(clientHeight);
    });
  });
}

test.describe(`with ${MAX_CAPTURED_PIECES} captured pieces at ${CAPTURES_VIEWPORT_LABEL}`, () => {
  test.use({ viewport: CAPTURES_VIEWPORT });

  test('keeps the game inside the screen (#49)', async ({ page }) => {
    await page.goto('/');
    await addCapturedPieces({ page, color: 'white', count: MAX_CAPTURED_PIECES });

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
      await addMoves({ page, turns: LONG_GAME_TURNS });

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

for (const viewport of UPRIGHT_TABLET_VIEWPORTS) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  test.describe(`on a tablet held upright at ${viewportLabel}`, () => {
    test.use({ viewport });

    test('fits the board and both stacked panels without scrolling', async ({ page }) => {
      await page.goto('/');

      const { scrollHeight, clientHeight, squares } = await readLayout(page);

      expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
      expect(squares[0].width).toBeGreaterThanOrEqual(MIN_SQUARE_SIZE_PX);
    });

    test(`still fits with ${MAX_CAPTURED_PIECES} captured pieces on each side and ${LONG_GAME_TURNS} turns`, async ({
      page,
    }) => {
      await page.goto('/');
      for (const color of COLORS) {
        await addCapturedPieces({ page, color, count: MAX_CAPTURED_PIECES });
      }
      await addMoves({ page, turns: LONG_GAME_TURNS });

      const { scrollWidth, scrollHeight, clientWidth, clientHeight } = await readLayout(page);
      const { listHeight, listScrollHeight, turnHeight } = await page
        .locator(MOVE_LIST_SELECTOR)
        .evaluate((list) => ({
          listHeight: list.clientHeight,
          listScrollHeight: list.scrollHeight,
          turnHeight: list.firstElementChild.offsetHeight,
        }));

      expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      expect(listHeight, 'the move list shows a whole turn').toBeGreaterThanOrEqual(turnHeight);
      expect(listScrollHeight, 'the long list scrolls').toBeGreaterThan(listHeight);
      for (const color of COLORS) {
        const zone = page.locator(`#${color}${CAPTURES_ID_SUFFIX}`);
        const { zoneScrollWidth, zoneClientWidth } = await zone.evaluate((node) => ({
          zoneScrollWidth: node.scrollWidth,
          zoneClientWidth: node.clientWidth,
        }));
        expect(zoneScrollWidth, `the captures of ${color} fit their row`).toBeLessThanOrEqual(
          zoneClientWidth
        );
      }
    });
  });
}

test.describe(`on a tablet held upright at ${SHORT_TABLET_VIEWPORT.width}x${SHORT_TABLET_VIEWPORT.height}`, () => {
  test.use({ viewport: SHORT_TABLET_VIEWPORT });

  test('keeps the largest squares, since the stacked page scrolls anyway', async ({ page }) => {
    await page.goto('/');

    const { squares } = await readLayout(page);

    expect(squares[0].width).toBe(MAX_SQUARE_SIZE_PX);
  });
});

for (const viewport of NARROW_UPRIGHT_VIEWPORTS) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  test.describe(`on a narrow screen held upright at ${viewportLabel}`, () => {
    test.use({ viewport });

    test('keeps the squares of a shorter screen as wide, bound by the width', async ({ page }) => {
      await page.goto('/');
      const { squares: tallSquares } = await readLayout(page);
      await page.setViewportSize({ width: viewport.width, height: SHORT_TABLET_VIEWPORT.height });
      const { squares: shortSquares } = await readLayout(page);

      expect(Math.abs(tallSquares[0].width - shortSquares[0].width)).toBeLessThanOrEqual(
        GRID_TOLERANCE_PX
      );
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

for (const viewport of FOOTER_VIEWPORTS) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  test.describe(`in the footer at ${viewportLabel}`, () => {
    test.use({ viewport });

    test('never starts a line of the copyright with its separator (#148)', async ({ page }) => {
      await page.goto('/');

      const lineStarts = await page.locator(COPYRIGHT_SELECTOR).evaluate((copyright, minOffset) => {
        const starts = [];
        let lineTop = -Infinity;
        const walker = document.createTreeWalker(copyright, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (let offset = 0; offset < node.length; offset += 1) {
            const character = node.data[offset];
            const isBlank = /\s/.test(character);
            if (isBlank) continue;
            const range = document.createRange();
            range.setStart(node, offset);
            range.setEnd(node, offset + 1);
            const { top } = range.getBoundingClientRect();
            const startsNewLine = top - lineTop > minOffset;
            if (!startsNewLine) continue;
            starts.push(character);
            lineTop = top;
          }
        }
        return starts;
      }, NEW_LINE_MIN_OFFSET_PX);

      expect(lineStarts.length).toBeGreaterThan(0);
      expect(lineStarts).not.toContain(COPYRIGHT_SEPARATOR);
    });
  });
}

for (const viewport of NARROW_LANDSCAPE_VIEWPORTS) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  test.describe(`in a narrow window held sideways at ${viewportLabel} (#173)`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('keeps squares wide enough to play, inside the width', async ({ page }) => {
      const { board, squares, scrollWidth, clientWidth } = await readLayout(page);

      expect(squares).toHaveLength(SQUARE_COUNT);
      for (const { square, width } of squares) {
        expect(width, square).toBeGreaterThanOrEqual(MIN_NARROW_LANDSCAPE_SQUARE_SIZE_PX);
      }
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      expect(board.left).toBeGreaterThanOrEqual(0);
      expect(board.right).toBeLessThanOrEqual(clientWidth);
    });

    test('stacks the panels around the board, in a page that scrolls', async ({ page }) => {
      const { board, scrollHeight, clientHeight } = await readLayout(page);
      const blackPanel = await page.locator(BLACK_PANEL_SELECTOR).boundingBox();
      const whitePanel = await page.locator(WHITE_PANEL_SELECTOR).boundingBox();

      expect(blackPanel.y + blackPanel.height).toBeLessThanOrEqual(board.top);
      expect(whitePanel.y).toBeGreaterThanOrEqual(board.bottom);
      expect(scrollHeight).toBeGreaterThan(clientHeight);
      expect(board.bottom).toBeLessThanOrEqual(scrollHeight);
    });

    test('keeps the texts of the stacked layout', async ({ page }) => {
      const turnOfTheSideToMove = page.locator(WHITE_PANEL_SELECTOR).locator(TURN_SELECTOR);

      await expect(turnOfTheSideToMove).toHaveCSS('font-size', STACKED_TEXT_FONT_SIZE);
      await expect(page.locator(`#white${CAPTURE_COUNT_ID_SUFFIX}`).locator('..')).toHaveCSS(
        'font-size',
        STACKED_TEXT_FONT_SIZE
      );
    });

    test('plays a move from the last rank of the board', async ({ page }) => {
      await playMoves({ page, moves: SCANDINAVIAN_MOVES });

      await expect(page.locator(`${MOVE_LIST_SELECTOR} li`)).toHaveCount(SCANDINAVIAN_TURNS);
    });
  });
}

test.describe("at the screen size of the project's touch phone", () => {
  test.skip(({ hasTouch }) => !hasTouch, 'the desktop projects test their sizes above');

  test('fits the board in the width, without scrolling sideways', async ({ page }) => {
    await page.goto('/');

    const { board, scrollWidth, clientWidth } = await readLayout(page);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    expect(board.left).toBeGreaterThanOrEqual(0);
    expect(board.right).toBeLessThanOrEqual(clientWidth);
  });
});
