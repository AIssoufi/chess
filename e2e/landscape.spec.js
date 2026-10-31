import {
  CAPTURE_GRID_VIEWPORTS,
  LANDSCAPE_VIEWPORTS,
  MAX_CAPTURED_PIECES,
  SCANDINAVIAN_MOVES,
} from './helpers/board/constants.js';
import { playMoves } from './helpers/board/utils.js';
import { expectVisibleCaptures, fillCaptures } from './helpers/captures/utils.js';
import { test } from './helpers/fixtures.js';
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
        await fillCaptures({ page, gameMoves });

        const { controls, moves } = await expectPanelsToFit(page);
        expectWholeControls(controls);
        expectOneLineTexts({ controls, sideToMove });
        expectTwoVisibleTurns(moves);
      });
    }
  });
}

for (const viewport of CAPTURE_GRID_VIEWPORTS) {
  test.describe(`on a wide phone held sideways at ${viewport.width}x${viewport.height} (#168)`, () => {
    test.use({ viewport });

    for (const { sideToMove, gameMoves } of LATE_GAME_POSITIONS) {
      test(`shows ${MAX_CAPTURED_PIECES} captured pieces on each side without a sideways scroll, ${sideToMove} to move`, async ({
        page,
      }) => {
        await page.goto('/');
        await fillCaptures({ page, gameMoves });

        await expectVisibleCaptures(page);
      });
    }
  });
}
