import Chessboard from './Chessboard.js';
import PieceFactory from './PieceFactory.js';
import {
  hideGameOverAlerts,
  showGameOverAlert,
  writeAlertDetails,
} from './alerts/game-over-dialog.js';
import { SQUARE_SELECTOR } from './board-navigation/constants.js';
import { enableBoardNavigation, focusSquare } from './board-navigation/roving-focus.js';
import consoleLog from './console-log.js';
import { showCopyrightYear } from './copyright/show-copyright-year.js';
import { GAME_OVER_DIALOG_DELAY_MS } from './game-over/constants.js';
import {
  getGameOutcome,
  getOutcomeAlert,
  getOutcomeLog,
  isKingInCheck,
} from './game-over/utils.js';
import { getMoveLog } from './moves/utils.js';
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
  renderPieces,
  renderSquareLabels,
  renderStatus,
} from './rendering/render.js';
import { CLICK_ACTIONS, NO_SELECTION } from './selection/constants.js';
import { highlightSelection } from './selection/highlight.js';
import { getClickAction, getSelection } from './selection/utils.js';

const game = new Chessboard();
const factory = new PieceFactory();
const boardNode = document.querySelector('.container-squares');
const gameOverDialog = document.querySelector('.alert__wrapper');

// The selected square and the squares it can move to
let selection = NO_SELECTION;
// The last move played, as `game.move` returns it, which the status announces
let lastMove = null;

// ─── DOM rendering ──────────────────────────────────────────────────────────

function renderLabels() {
  renderSquareLabels({ game, selection });
}

function renderBoard() {
  renderPieces({ game, factory });
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

// ─── After each move ────────────────────────────────────────────────────────

function afterMove() {
  const { outcome, color, winner, drawReason } = getGameOutcome({ game });
  renderStatus({ game, lastMove, outcome, color, winner, drawReason });
  const outcomeLog = getOutcomeLog({ outcome, color, winner, drawReason });
  if (outcomeLog) console.log(outcomeLog);
  if (isKingInCheck(outcome)) showCheck(color);

  const alertName = getOutcomeAlert(outcome);
  if (!alertName) return;
  writeAlertDetails({ dialog: gameOverDialog, winner, drawReason });
  setTimeout(
    () => showGameOverAlert({ dialog: gameOverDialog, alertName }),
    GAME_OVER_DIALOG_DELAY_MS
  );
}

// ─── Promotion ──────────────────────────────────────────────────────────────

const promotionWrapper = document.querySelector('.promotion__wrapper');

promotionWrapper.addEventListener('click', (event) => {
  const type = getChosenPieceType(event);
  if (!type || !game.promotionSquare) return;

  game.promote({ position: game.promotionSquare, type });
  hidePromotionChoice(promotionWrapper);
  renderBoard();
  renderCaptures({ game, factory });
  renderCurrentPlayer({ color: game.currentColor });
  hideCheck();
  afterMove();
  // The focus goes back to the square of the promoted pawn
  focusSquare({ board: boardNode, square: lastMove?.to });
});

// ─── Alerts ─────────────────────────────────────────────────────────────────

// "Rejouer" and Escape both close the dialog: either way a new game starts, so the finished
// game never stays on screen without a way to play again.
gameOverDialog.addEventListener('close', () => {
  hideGameOverAlerts(gameOverDialog);
  initialize();
});

// ─── Click handler (delegated to the board) ─────────────────────────────────

function playMove(to) {
  const result = game.move({ from: selection.square, to });
  if (!result) return;

  renderBoard();
  renderCaptures({ game, factory });
  setSelection(NO_SELECTION);
  hideCheck();

  const moveLog = getMoveLog(result);
  if (moveLog) console.log(moveLog);
  lastMove = result;

  if (result.promotion) {
    showPromotionChoice({
      wrapper: promotionWrapper,
      factory,
      color: game.getPiece(result.to).color,
    });
    return;
  }

  renderCurrentPlayer({ color: game.currentColor });
  afterMove();
}

boardNode.addEventListener('click', (event) => {
  const square = event.target.closest(SQUARE_SELECTOR)?.dataset.position;
  const action = getClickAction({ game, selection, square });
  if (action === CLICK_ACTIONS.move) playMove(square);
  else if (action === CLICK_ACTIONS.select) setSelection(getSelection({ game, square }));
  else if (action === CLICK_ACTIONS.deselect) setSelection(NO_SELECTION);
});

// ─── Initialization ─────────────────────────────────────────────────────────

function initialize() {
  game.initialize();
  lastMove = null;
  renderBoard();
  renderCaptures({ game, factory });
  setSelection(NO_SELECTION);
  hideCheck();
  renderCurrentPlayer({ color: game.currentColor });
  renderStatus({ game, lastMove, ...getGameOutcome({ game }) });
}

consoleLog();
showCopyrightYear();
enableBoardNavigation(boardNode);
initialize();
