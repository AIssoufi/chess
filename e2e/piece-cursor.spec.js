import { PIECE_SELECTOR } from '../app/js/rendering/constants.js';
import {
  CAPTURE_OPENING_MOVES,
  CAPTURE_TARGET,
  CHECKMATE_TITLE,
  EMPTY_TARGET,
  FOOLS_MATE_MOVES,
  NEW_GAME_BUTTON_NAME,
  PROMOTION_MOVES,
  PROMOTION_SQUARE,
  PROMOTION_TITLE,
  QUEEN_BUTTON_NAME,
  REVIEW_BUTTON_NAME,
  SELECTED_SQUARE,
} from './helpers/board/constants.js';
import { getSquare, playMoves, press } from './helpers/board/utils.js';
import { expect, test } from './helpers/fixtures.js';

/** The cursor of a piece that a click can select. */
const PLAYABLE_CURSOR = 'pointer';

/** The cursor of a square, which a piece that a click cannot select inherits. */
const UNPLAYABLE_CURSOR = 'not-allowed';

/** The cursor of a hovered square that the selected piece can move to. */
const POSSIBLE_MOVE_CURSOR = 'crosshair';

/** A pawn of white on its starting square. */
const WHITE_PAWN_SQUARE = 'e2';

/** A pawn of black on its starting square. */
const BLACK_PAWN_SQUARE = 'e7';

/** The square of the king of white. */
const WHITE_KING_SQUARE = 'e1';

/** A rook of white hemmed in by its own pieces at the start, so a click selects nothing. */
const BLOCKED_ROOK_SQUARE = 'a1';

/** A knight of white that stays on its square through `FOOLS_MATE_MOVES`. */
const WHITE_KNIGHT_SQUARE = 'g1';

/** The only piece of black that can answer the check of the queen on `PROMOTION_SQUARE`. */
const BLOCKING_KNIGHT_SQUARE = 'f6';

/** The square of the queen of black that ends `FOOLS_MATE_MOVES`. */
const MATING_QUEEN_SQUARE = 'h4';

/** Both knights out and back, twice: the starting position comes a third time, a draw. */
const REPETITION_MOVES = Object.freeze([
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
  { from: 'g1', to: 'f3' },
  { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'g1' },
  { from: 'f6', to: 'g8' },
]);

/** The title of the alert of a draw, which names the game over dialog. */
const DRAW_TITLE = /^Match nul/;

/**
 * Checks the cursor of the piece on a square.
 *
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page The page of the game.
 * @param {string} params.square The square of the piece, from `a1` to `h8`.
 * @param {string} params.cursor The expected computed cursor.
 * @returns {Promise<void>} Resolves once the piece shows the cursor.
 */
function expectPieceCursor({ page, square, cursor }) {
  const piece = getSquare({ page, square }).locator(PIECE_SELECTOR);
  return expect(piece).toHaveCSS('cursor', cursor);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('shows the pointer on the pieces of the side to move only', async ({ page }) => {
  await expectPieceCursor({ page, square: WHITE_PAWN_SQUARE, cursor: PLAYABLE_CURSOR });
  await expectPieceCursor({ page, square: BLACK_PAWN_SQUARE, cursor: UNPLAYABLE_CURSOR });

  await playMoves({ page, moves: CAPTURE_OPENING_MOVES.slice(0, 1) });

  await expectPieceCursor({ page, square: BLACK_PAWN_SQUARE, cursor: PLAYABLE_CURSOR });
  await expectPieceCursor({ page, square: WHITE_KING_SQUARE, cursor: UNPLAYABLE_CURSOR });
});

test('shows no pointer on a piece of the side to move without a legal move', async ({ page }) => {
  await expectPieceCursor({ page, square: BLOCKED_ROOK_SQUARE, cursor: UNPLAYABLE_CURSOR });
});

test('keeps the cursors of a selected piece and of its possible moves', async ({
  page,
  hasTouch,
}) => {
  test.skip(hasTouch, 'a touch screen has no pointer to hover the squares with');
  await playMoves({ page, moves: CAPTURE_OPENING_MOVES });

  await press(getSquare({ page, square: SELECTED_SQUARE }));

  await expectPieceCursor({ page, square: SELECTED_SQUARE, cursor: PLAYABLE_CURSOR });

  const emptyTarget = getSquare({ page, square: EMPTY_TARGET });
  await emptyTarget.hover();
  await expect(emptyTarget).toHaveCSS('cursor', POSSIBLE_MOVE_CURSOR);

  await getSquare({ page, square: CAPTURE_TARGET }).hover();
  await expectPieceCursor({ page, square: CAPTURE_TARGET, cursor: POSSIBLE_MOVE_CURSOR });
});

test('shows the pointer on no piece while a promotion waits for its piece', async ({ page }) => {
  await playMoves({ page, moves: PROMOTION_MOVES });

  await expectPieceCursor({ page, square: WHITE_PAWN_SQUARE, cursor: UNPLAYABLE_CURSOR });
  await expectPieceCursor({ page, square: BLACK_PAWN_SQUARE, cursor: UNPLAYABLE_CURSOR });

  const promotionChoice = page.getByRole('dialog', { name: PROMOTION_TITLE });
  await press(promotionChoice.getByRole('button', { name: QUEEN_BUTTON_NAME }));

  await expectPieceCursor({ page, square: BLOCKING_KNIGHT_SQUARE, cursor: PLAYABLE_CURSOR });
  await expectPieceCursor({ page, square: BLACK_PAWN_SQUARE, cursor: UNPLAYABLE_CURSOR });
  await expectPieceCursor({ page, square: PROMOTION_SQUARE, cursor: UNPLAYABLE_CURSOR });
});

test('shows the pointer on no piece of a draw, whose pieces could still move', async ({ page }) => {
  await playMoves({ page, moves: REPETITION_MOVES });
  const dialog = page.getByRole('dialog', { name: DRAW_TITLE });

  await press(dialog.getByRole('button', { name: REVIEW_BUTTON_NAME }));

  await expect(dialog).toBeHidden();
  await expectPieceCursor({ page, square: WHITE_PAWN_SQUARE, cursor: UNPLAYABLE_CURSOR });
});

test('shows the pointer on no piece of a finished game, until a new one', async ({ page }) => {
  await playMoves({ page, moves: FOOLS_MATE_MOVES });
  const dialog = page.getByRole('dialog', { name: CHECKMATE_TITLE });

  await press(dialog.getByRole('button', { name: REVIEW_BUTTON_NAME }));

  await expect(dialog).toBeHidden();
  await expectPieceCursor({ page, square: WHITE_KNIGHT_SQUARE, cursor: UNPLAYABLE_CURSOR });
  await expectPieceCursor({ page, square: MATING_QUEEN_SQUARE, cursor: UNPLAYABLE_CURSOR });

  await press(page.getByRole('button', { name: NEW_GAME_BUTTON_NAME }));

  await expectPieceCursor({ page, square: WHITE_KNIGHT_SQUARE, cursor: PLAYABLE_CURSOR });
  await expectPieceCursor({ page, square: BLACK_PAWN_SQUARE, cursor: UNPLAYABLE_CURSOR });
});
