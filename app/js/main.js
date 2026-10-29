import Chessboard from './Chessboard.js';
import PieceFactory from './PieceFactory.js';
import { GAME_OVER_DIALOG_SELECTOR } from './alerts/constants.js';
import {
  hideGameOverAlerts,
  showGameOverAlert,
  writeAlertDetails,
} from './alerts/game-over-dialog.js';
import { shouldStartNewGame } from './alerts/utils.js';
import { enableBoardNavigation, focusSquare } from './board-navigation/roving-focus.js';
import { showCopyrightYear } from './copyright/show-copyright-year.js';
import { GAME_OVER_DIALOG_DELAY_MS } from './game-over/constants.js';
import { getGameOutcome, getOutcomeAlert } from './game-over/utils.js';
import { highlightLastMove } from './last-move/highlight.js';
import { NEW_GAME_BUTTON_SELECTOR } from './new-game/constants.js';
import { getMoveNotation, getRivalSquares } from './notation/utils.js';
import { PROMOTION_CHOICE_SELECTOR } from './promotion/constants.js';
import {
  getChosenPieceType,
  hidePromotionChoice,
  showPromotionChoice,
} from './promotion/promotion-choice.js';
import {
  clearCheck,
  markCheck,
  renderCaptures,
  renderCurrentPlayer,
  renderGameOver,
  renderMoveList,
  renderPieces,
  renderSquareLabels,
  renderStatus,
} from './rendering/render.js';
import { CLICK_ACTIONS, NO_SELECTION } from './selection/constants.js';
import { highlightSelection } from './selection/highlight.js';
import { getClickAction, getSelection } from './selection/utils.js';
import { BOARD_SELECTOR, SQUARE_SELECTOR } from './squares/constants.js';

const game = new Chessboard();
const factory = new PieceFactory();
const boardNode = document.querySelector(BOARD_SELECTOR);
const gameOverDialog = document.querySelector(GAME_OVER_DIALOG_SELECTOR);

// The selected square and the squares it can move to
let selection = NO_SELECTION;
// The last move played, as `game.move` returns it, which the status announces and the board marks
let lastMove = null;
// The pieces that could also reach the target square of the last move, which its notation tells
// apart, listed before it was played
let lastRivalSquares = [];
// The notation of each move of the game, in the order they were played
let notations = [];
// The timer that opens the game over dialog, which a new game started meanwhile cancels
let gameOverTimer = null;

// ─── DOM rendering ──────────────────────────────────────────────────────────

function renderLabels() {
  renderSquareLabels({ game, selection });
}

function renderBoard() {
  renderPieces({ game, factory });
  highlightLastMove({ lastMove });
  renderGameOver({ game });
  renderLabels();
}

// ─── Selection and highlighting ─────────────────────────────────────────────

function setSelection(nextSelection) {
  selection = nextSelection;
  highlightSelection({ selection });
  renderLabels();
}

// ─── Check indicator ────────────────────────────────────────────────────────

function showCheck(color) {
  markCheck({ board: game.board, color });
  renderLabels();
}

function hideCheck() {
  clearCheck();
  renderLabels();
}

// ─── Move list ──────────────────────────────────────────────────────────────

// Writes the last move, once its promotion is chosen, at the end of the move list
function recordLastMove({ outcome, isCheck }) {
  const promotedType = lastMove.promotion ? game.getPiece(lastMove.to)?.type : undefined;
  const notation = getMoveNotation({
    move: lastMove,
    promotedType,
    outcome,
    isCheck,
    rivalSquares: lastRivalSquares,
  });
  if (notation) notations.push(notation);
  renderMoveList({ notations });
}

// ─── After each move ────────────────────────────────────────────────────────

function afterMove() {
  const { outcome, color, winner, isCheck, drawReason } = getGameOutcome({ game });
  renderStatus({ game, lastMove, outcome, color, winner, isCheck, drawReason });
  recordLastMove({ outcome, isCheck });
  if (isCheck) showCheck(color);

  const alertName = getOutcomeAlert(outcome);
  if (!alertName) return;
  writeAlertDetails({ dialog: gameOverDialog, winner, drawReason });
  gameOverTimer = setTimeout(
    () => showGameOverAlert({ dialog: gameOverDialog, alertName }),
    GAME_OVER_DIALOG_DELAY_MS
  );
}

// ─── Promotion ──────────────────────────────────────────────────────────────

const promotionWrapper = document.querySelector(PROMOTION_CHOICE_SELECTOR);

promotionWrapper.addEventListener('click', (event) => {
  const type = getChosenPieceType(event);
  if (!type || !game.promotionSquare) return;

  game.promote({ position: game.promotionSquare, type });
  hidePromotionChoice(promotionWrapper);
  renderBoard();
  renderCaptures({ game, factory });
  renderCurrentPlayer({ color: game.currentColor, isOver: game.isOver });
  hideCheck();
  afterMove();
  // The focus goes back to the square of the promoted pawn
  focusSquare({ board: boardNode, square: lastMove?.to });
});

// ─── Alerts ─────────────────────────────────────────────────────────────────

// "Rejouer", Escape and any value other than the review start a new game. "Voir la position"
// leaves the final position and its check marker on screen, where the board ignores clicks until
// "Nouvelle partie".
gameOverDialog.addEventListener('close', () => {
  hideGameOverAlerts(gameOverDialog);
  if (shouldStartNewGame(gameOverDialog.returnValue)) initialize();
});

// ─── Click handler (delegated to the board) ─────────────────────────────────

function playMove(to) {
  const from = selection.square;
  const rivalSquares = getRivalSquares({ game, from, to });
  const result = game.move({ from, to });
  if (!result) return;

  lastMove = result;
  lastRivalSquares = rivalSquares;

  renderBoard();
  renderCaptures({ game, factory });
  setSelection(NO_SELECTION);
  hideCheck();

  if (result.promotion) {
    showPromotionChoice({
      wrapper: promotionWrapper,
      factory,
      color: game.getPiece(result.to).color,
    });
    return;
  }

  renderCurrentPlayer({ color: game.currentColor, isOver: game.isOver });
  afterMove();
}

boardNode.addEventListener('click', (event) => {
  const square = event.target.closest(SQUARE_SELECTOR)?.dataset.position;
  const action = getClickAction({ game, selection, square });
  if (action === CLICK_ACTIONS.move) playMove(square);
  else if (action === CLICK_ACTIONS.select) setSelection(getSelection({ game, square }));
  else if (action === CLICK_ACTIONS.deselect) setSelection(NO_SELECTION);
});

// ─── New game ───────────────────────────────────────────────────────────────

document.querySelector(NEW_GAME_BUTTON_SELECTOR).addEventListener('click', () => initialize());

// ─── Initialization ─────────────────────────────────────────────────────────

function initialize() {
  clearTimeout(gameOverTimer);
  hidePromotionChoice(promotionWrapper);
  game.initialize();
  lastMove = null;
  lastRivalSquares = [];
  notations = [];
  renderMoveList({ notations });
  renderBoard();
  renderCaptures({ game, factory });
  setSelection(NO_SELECTION);
  hideCheck();
  renderCurrentPlayer({ color: game.currentColor, isOver: game.isOver });
  renderStatus({ game, lastMove, ...getGameOutcome({ game }) });
}

showCopyrightYear();
enableBoardNavigation(boardNode);
initialize();
