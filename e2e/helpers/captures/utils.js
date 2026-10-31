import { COLORS } from '../../../app/js/colors/constants.js';
import { CAPTURES_ID_SUFFIX } from '../../../app/js/rendering/constants.js';
import { MAX_CAPTURED_PIECES, SCANDINAVIAN_CAPTURES } from '../board/constants.js';
import { addCapturedPieces, playMoves } from '../board/utils.js';
import { expect } from '../fixtures.js';

/**
 * Reads the width of each zone of captured pieces, with the width of a piece and of its symbol.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<{
 *   color: string,
 *   scrollWidth: number,
 *   clientWidth: number,
 *   pieceWidth: number,
 *   symbolWidth: number,
 * }[]>} The widths, in CSS pixels, one entry per color.
 */
function readCaptures(page) {
  return page.evaluate(
    ({ colors, suffix }) =>
      colors.map((color) => {
        const zone = document.getElementById(`${color}${suffix}`);
        const symbol = document.createRange();
        symbol.selectNodeContents(zone.firstElementChild);
        return {
          color,
          scrollWidth: zone.scrollWidth,
          clientWidth: zone.clientWidth,
          pieceWidth: zone.firstElementChild.getBoundingClientRect().width,
          symbolWidth: symbol.getBoundingClientRect().width,
        };
      }),
    { colors: Object.values(COLORS), suffix: CAPTURES_ID_SUFFIX }
  );
}

/**
 * Plays a game, then fills both zones of captured pieces with as many pieces as a side can capture.
 *
 * @param {object} params The page and the game.
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {readonly string[]} params.gameMoves The moves to play, which capture a pawn on each side.
 * @returns {Promise<void>} Resolves once both zones show all their pieces.
 */
export async function fillCaptures({ page, gameMoves }) {
  await playMoves({ page, moves: gameMoves });
  for (const color of Object.values(COLORS)) {
    await addCapturedPieces({ page, color, count: MAX_CAPTURED_PIECES - SCANDINAVIAN_CAPTURES });
    await expect(page.locator(`#${color}${CAPTURES_ID_SUFFIX} > *`)).toHaveCount(
      MAX_CAPTURED_PIECES
    );
  }
}

/**
 * Checks that every captured piece shows at once, with no sideways scroll, and that the symbols
 * stay inside their tracks, whose width does not depend on the font of the system.
 *
 * @param {Awaited<ReturnType<typeof readCaptures>>} captures The zones, from `readCaptures`.
 */
export function expectWholeCaptures(captures) {
  for (const { color, scrollWidth, clientWidth, pieceWidth, symbolWidth } of captures) {
    expect(scrollWidth, `the captures of ${color} do not scroll`).toBeLessThanOrEqual(clientWidth);
    expect(symbolWidth, `the symbols of ${color} stay apart`).toBeLessThanOrEqual(pieceWidth);
  }
}

/**
 * Checks the zones of captured pieces of the page, as `expectWholeCaptures` does.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<void>} Resolves once both zones are checked.
 */
export async function expectVisibleCaptures(page) {
  expectWholeCaptures(await readCaptures(page));
}
