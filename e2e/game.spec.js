import { WINNER_COLOR_SELECTOR } from '../app/js/alerts/constants.js';
import { COLOR_LABELS } from '../app/js/colors/constants.js';
import pawn from '../app/js/pieces/pawn.js';
import queen from '../app/js/pieces/queen.js';
import { PIECE_SELECTOR } from '../app/js/rendering/constants.js';
import { FOOLS_MATE_MOVES, PROMOTION_MOVES, PROMOTION_SQUARE } from './helpers/board/constants.js';
import { getSquare, playMoves } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** The title of the checkmate alert, which names the game over dialog. */
const CHECKMATE_TITLE = /^Échec et mat/;

/** The title of the promotion choice, which names it. */
const PROMOTION_TITLE = /^Promouvoir le pion/;

/** The name of the queen button of the promotion choice. */
const QUEEN_BUTTON_NAME = 'Dame';

/** The name of the button that closes the game over dialog. */
const REPLAY_BUTTON_NAME = /^Rejouer/;

/** A square of a pawn of white at the start of a game, emptied by `FOOLS_MATE_MOVES`. */
const STARTING_PAWN_SQUARE = 'f2';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test("ends the fool's mate on the checkmate dialog, then starts a new game", async ({ page }) => {
  await playMoves({ page, moves: FOOLS_MATE_MOVES });

  const dialog = page.getByRole('dialog', { name: CHECKMATE_TITLE });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(WINNER_COLOR_SELECTOR)).toHaveText(COLOR_LABELS.black);

  await dialog.getByRole('button', { name: REPLAY_BUTTON_NAME }).click();

  await expect(dialog).toBeHidden();
  await expect(
    getSquare({ page, square: STARTING_PAWN_SQUARE }).locator(PIECE_SELECTOR)
  ).toHaveText(pawn.piece.white);
});

test('promotes a pawn that reaches the last rank to a queen', async ({ page }) => {
  await playMoves({ page, moves: PROMOTION_MOVES });

  const promotionChoice = page.getByRole('dialog', { name: PROMOTION_TITLE });
  await expect(promotionChoice).toBeVisible();

  await promotionChoice.getByRole('button', { name: QUEEN_BUTTON_NAME }).click();

  await expect(promotionChoice).toBeHidden();
  await expect(getSquare({ page, square: PROMOTION_SQUARE }).locator(PIECE_SELECTOR)).toHaveText(
    queen.piece.white
  );
});
