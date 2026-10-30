import { COLORS } from '../app/js/colors/constants.js';
import { CAPTURES_ID_SUFFIX } from '../app/js/rendering/constants.js';
import {
  LANDSCAPE_VIEWPORTS,
  MAX_CAPTURED_PIECES,
  SCANDINAVIAN_CAPTURES,
  SCANDINAVIAN_MOVES,
} from './helpers/board/constants.js';
import { addCapturedPieces, playMoves } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';
import { LATE_GAME_POSITIONS } from './helpers/landscape/constants.js';
import {
  expectOneLineTexts,
  expectPanelsToFit,
  expectTwoVisibleTurns,
  expectWholeControls,
} from './helpers/landscape/utils.js';

for (const viewport of LANDSCAPE_VIEWPORTS) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  test.describe(`on a phone held sideways at ${viewportLabel} (#156)`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('fits the panels beside the board before the first move', async ({ page }) => {
      await expectPanelsToFit(page);
    });

    test('shows two turns of the move list after three turns', async ({ page }) => {
      await playMoves({ page, moves: SCANDINAVIAN_MOVES });

      const { moves } = await expectPanelsToFit(page);
      expectTwoVisibleTurns(moves);
    });

    test('keeps whole player panels after a capture each', async ({ page }) => {
      await playMoves({ page, moves: SCANDINAVIAN_MOVES });

      const { controls } = await expectPanelsToFit(page);
      expectWholeControls(controls);
      expectOneLineTexts({ controls, sideToMove: 'black' });
    });

    for (const { sideToMove, gameMoves } of LATE_GAME_POSITIONS) {
      test(`keeps the panels whole with ${MAX_CAPTURED_PIECES} captured pieces on each side, ${sideToMove} to move`, async ({
        page,
      }) => {
        await playMoves({ page, moves: gameMoves });
        for (const color of Object.values(COLORS)) {
          await addCapturedPieces({
            page,
            color,
            count: MAX_CAPTURED_PIECES - SCANDINAVIAN_CAPTURES,
          });
          await expect(page.locator(`#${color}${CAPTURES_ID_SUFFIX} > *`)).toHaveCount(
            MAX_CAPTURED_PIECES
          );
        }

        const { controls, moves } = await expectPanelsToFit(page);
        expectWholeControls(controls);
        expectOneLineTexts({ controls, sideToMove });
        expectTwoVisibleTurns(moves);
      });
    }
  });
}
