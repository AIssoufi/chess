import { WINNER_COLOR_SELECTOR } from '../app/js/alerts/constants.js';
import { COLOR_LABELS } from '../app/js/colors/constants.js';
import pawn from '../app/js/pieces/pawn.js';
import queen from '../app/js/pieces/queen.js';
import {
  CHECK_CLASS,
  CONTROL_SELECTOR,
  CURRENT_PLAYER_CLASS,
  PIECE_SELECTOR,
  TURN_SELECTOR,
} from '../app/js/rendering/constants.js';
import { FOOLS_MATE_MOVES, PROMOTION_MOVES, PROMOTION_SQUARE } from './helpers/board/constants.js';
import { getSquare, playMoves, press } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** The title of the checkmate alert, which names the game over dialog. */
const CHECKMATE_TITLE = /^Échec et mat/;

/** The title of the promotion choice, which names it. */
const PROMOTION_TITLE = /^Promouvoir le pion/;

/** The name of the queen button of the promotion choice. */
const QUEEN_BUTTON_NAME = 'Dame';

/** The name of the button that closes the game over dialog. */
const REPLAY_BUTTON_NAME = /^Rejouer/;

/** The name of the button that closes the game over dialog on the final position. */
const REVIEW_BUTTON_NAME = 'Voir la position';

/** The name of the button under the move list that starts a new game. */
const NEW_GAME_BUTTON_NAME = 'Nouvelle partie';

/** A square of a pawn of white at the start of a game, emptied by `FOOLS_MATE_MOVES`. */
const STARTING_PAWN_SQUARE = 'f2';

/** The square of the queen of black that ends `FOOLS_MATE_MOVES`. */
const MATING_QUEEN_SQUARE = 'h4';

/** The square of the king of white, mated by `FOOLS_MATE_MOVES`. */
const MATED_KING_SQUARE = 'e1';

/** A square left empty from the start to the end of `FOOLS_MATE_MOVES`. */
const EMPTY_SQUARE = 'a3';

/** The background that the styles give to a hovered square during a game. */
const HOVERED_SQUARE_BACKGROUND = 'rgba(0, 0, 0, 0.5)';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test("ends the fool's mate on the checkmate dialog, then starts a new game", async ({ page }) => {
  await playMoves({ page, moves: FOOLS_MATE_MOVES });

  const dialog = page.getByRole('dialog', { name: CHECKMATE_TITLE });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(WINNER_COLOR_SELECTOR)).toHaveText(COLOR_LABELS.black);

  await press(dialog.getByRole('button', { name: REPLAY_BUTTON_NAME }));

  await expect(dialog).toBeHidden();
  await expect(
    getSquare({ page, square: STARTING_PAWN_SQUARE }).locator(PIECE_SELECTOR)
  ).toHaveText(pawn.piece.white);
});

test('leaves the final position on screen, then starts a new game from the button', async ({
  page,
}) => {
  await playMoves({ page, moves: FOOLS_MATE_MOVES });
  const dialog = page.getByRole('dialog', { name: CHECKMATE_TITLE });

  await press(dialog.getByRole('button', { name: REVIEW_BUTTON_NAME }));

  await expect(dialog).toBeHidden();
  const matingQueenSquare = getSquare({ page, square: MATING_QUEEN_SQUARE });
  await expect(matingQueenSquare.locator(PIECE_SELECTOR)).toHaveText(queen.piece.black);
  await expect(getSquare({ page, square: MATED_KING_SQUARE })).toHaveClass(
    new RegExp(`\\b${CHECK_CLASS}\\b`)
  );

  await press(page.getByRole('button', { name: NEW_GAME_BUTTON_NAME }));

  await expect(matingQueenSquare.locator(PIECE_SELECTOR)).toHaveCount(0);
  await expect(
    getSquare({ page, square: STARTING_PAWN_SQUARE }).locator(PIECE_SELECTOR)
  ).toHaveText(pawn.piece.white);
});

test('highlights no panel on the reviewed final position', async ({ page }) => {
  await playMoves({ page, moves: FOOLS_MATE_MOVES });
  const dialog = page.getByRole('dialog', { name: CHECKMATE_TITLE });

  await press(dialog.getByRole('button', { name: REVIEW_BUTTON_NAME }));

  await expect(dialog).toBeHidden();
  await expect(page.locator(`.${CURRENT_PLAYER_CLASS}`)).toHaveCount(0);
  await expect(page.locator(`${CONTROL_SELECTOR} ${TURN_SELECTOR}`)).toHaveText(['', '']);
});

test('keeps the squares of the reviewed final position as they are on hover', async ({
  page,
  hasTouch,
}) => {
  test.skip(hasTouch, 'a touch screen has no pointer to hover the squares with');
  await playMoves({ page, moves: FOOLS_MATE_MOVES });
  const dialog = page.getByRole('dialog', { name: CHECKMATE_TITLE });
  await press(dialog.getByRole('button', { name: REVIEW_BUTTON_NAME }));
  await expect(dialog).toBeHidden();
  const emptySquare = getSquare({ page, square: EMPTY_SQUARE });
  await page.mouse.move(0, 0);
  const restingBackground = await emptySquare.evaluate(
    (node) => getComputedStyle(node).backgroundColor
  );

  await emptySquare.hover();

  await expect(emptySquare).toHaveCSS('background-color', restingBackground);

  await press(page.getByRole('button', { name: NEW_GAME_BUTTON_NAME }));
  await emptySquare.hover();

  await expect(emptySquare).toHaveCSS('background-color', HOVERED_SQUARE_BACKGROUND);
});

test('starts a new game on Escape, even after a reviewed game', async ({ page }) => {
  await playMoves({ page, moves: FOOLS_MATE_MOVES });
  const dialog = page.getByRole('dialog', { name: CHECKMATE_TITLE });
  await press(dialog.getByRole('button', { name: REVIEW_BUTTON_NAME }));
  await press(page.getByRole('button', { name: NEW_GAME_BUTTON_NAME }));
  await playMoves({ page, moves: FOOLS_MATE_MOVES });
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
  await expect(
    getSquare({ page, square: MATING_QUEEN_SQUARE }).locator(PIECE_SELECTOR)
  ).toHaveCount(0);
});

test('promotes a pawn that reaches the last rank to a queen', async ({ page }) => {
  await playMoves({ page, moves: PROMOTION_MOVES });

  const promotionChoice = page.getByRole('dialog', { name: PROMOTION_TITLE });
  await expect(promotionChoice).toBeVisible();

  await press(promotionChoice.getByRole('button', { name: QUEEN_BUTTON_NAME }));

  await expect(promotionChoice).toBeHidden();
  await expect(getSquare({ page, square: PROMOTION_SQUARE }).locator(PIECE_SELECTOR)).toHaveText(
    queen.piece.white
  );
});
