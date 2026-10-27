import Chessboard from './Chessboard.js';
import PieceFactory from './PieceFactory.js';
import { enableBoardNavigation, focusSquare } from './board-navigation/roving-focus.js';
import { COLOR_LABELS } from './colors/constants.js';
import consoleLog from './console-log.js';
import { showCopyrightYear } from './copyright/show-copyright-year.js';
import { DRAW_REASON_LABELS } from './draws/constants.js';
import {
  GAME_OUTCOMES,
  GAME_OVER_ALERTS,
  GAME_OVER_DIALOG_DELAY_MS,
} from './game-over/constants.js';
import { getGameOutcome } from './game-over/utils.js';
import { SPECIAL_MOVE_LABELS } from './moves/constants.js';
import {
  clearCheck,
  getSquareNode,
  markCheck,
  renderCaptures,
  renderCurrentPlayer,
  renderPieces,
  renderSquareLabels,
  renderStatus,
} from './rendering/render.js';

const game = new Chessboard();
const factory = new PieceFactory();
const boardNode = document.querySelector('.container-squares');

let selectedSquare = null;
let possibleMoves = [];
// The last move played, as `game.move` returns it, which the status announces
let lastMove = null;

// ─── DOM rendering ──────────────────────────────────────────────────────────

function renderLabels() {
  renderSquareLabels({ game, selection: { square: selectedSquare, moves: possibleMoves } });
}

function renderBoard() {
  renderPieces({ game, factory });
  renderLabels();
}

// ─── Selection and highlighting ─────────────────────────────────────────────

function deselect() {
  document.querySelectorAll('.possible-move').forEach((c) => c.classList.remove('possible-move'));
  document.querySelectorAll('.selected').forEach((c) => c.classList.remove('selected'));
  selectedSquare = null;
  possibleMoves = [];
  renderLabels();
}

function select(position) {
  deselect();
  const piece = game.getPiece(position);
  if (!piece || piece.color !== game.currentColor) return;

  const moves = game.getMoves(position);
  if (moves.length === 0) return;

  selectedSquare = position;
  possibleMoves = moves;
  getSquareNode({ square: position })?.classList.add('selected');
  for (const dest of moves) {
    getSquareNode({ square: dest })?.classList.add('possible-move');
  }
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
  if (outcome === GAME_OUTCOMES.checkmate) {
    console.log(`Échec et mat ! ${COLOR_LABELS[winner]} gagne.`);
    showCheck(color);
    document.querySelector('.winner-color').textContent = COLOR_LABELS[winner];
    setTimeout(() => showAlert(GAME_OVER_ALERTS.checkmate), GAME_OVER_DIALOG_DELAY_MS);
  } else if (outcome === GAME_OUTCOMES.stalemate) {
    console.log('Pat — match nul.');
    setTimeout(() => showAlert(GAME_OVER_ALERTS.stalemate), GAME_OVER_DIALOG_DELAY_MS);
  } else if (outcome === GAME_OUTCOMES.draw) {
    console.log(`Match nul : ${DRAW_REASON_LABELS[drawReason]}.`);
    document.querySelector('.draw-reason').textContent = DRAW_REASON_LABELS[drawReason];
    setTimeout(() => showAlert(GAME_OVER_ALERTS.draw), GAME_OVER_DIALOG_DELAY_MS);
  } else if (outcome === GAME_OUTCOMES.check) {
    console.log(`${COLOR_LABELS[color]} est en échec !`);
    showCheck(color);
  }
}

// ─── Promotion ──────────────────────────────────────────────────────────────

function showPromotion(position) {
  const piece = game.getPiece(position);
  const wrapper = document.querySelector('.promotion__wrapper');
  wrapper.querySelectorAll('[data-type]').forEach((btn) => {
    btn.textContent = factory.getSymbol(btn.dataset.type, piece.color);
  });
  wrapper.style.display = 'flex';
  wrapper.querySelector('[data-type]')?.focus();
}

document.querySelector('.promotion__wrapper').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-type]');
  if (!btn || !game.promotionSquare) return;

  game.promote({ position: game.promotionSquare, type: btn.dataset.type });
  document.querySelector('.promotion__wrapper').style.display = 'none';
  renderBoard();
  renderCaptures({ game, factory });
  renderCurrentPlayer({ color: game.currentColor });
  hideCheck();
  afterMove();
});

// Registered after the listener above, so it runs once the promotion is played: the focus goes
// back to the square of the promoted pawn
document.querySelector('.promotion__wrapper').addEventListener('click', (event) => {
  const isPromotionPlayed = event.target.closest('[data-type]') && !game.promotionSquare;
  if (isPromotionPlayed) focusSquare({ board: boardNode, square: lastMove?.to });
});

// ─── Alerts ─────────────────────────────────────────────────────────────────

const gameOverDialog = document.querySelector('.alert__wrapper');

function showAlert(alertName) {
  const alertElement = gameOverDialog.querySelector(`.${alertName}`);
  alertElement.classList.add('shown');
  gameOverDialog.setAttribute('aria-labelledby', alertElement.querySelector('h2').id);
  gameOverDialog.showModal();
  alertElement.querySelector('button').focus();
}

// "Rejouer" and Escape both close the dialog: either way a new game starts, so the finished
// game never stays on screen without a way to play again.
gameOverDialog.addEventListener('close', () => {
  gameOverDialog.querySelectorAll('.shown').forEach((a) => a.classList.remove('shown'));
  initialize();
});

// ─── Click handler (delegated to the board) ─────────────────────────────────

document.querySelector('.container-squares').addEventListener('click', (event) => {
  if (game.isOver || game.promotionSquare) return;

  const squareNode = event.target.closest('.square');
  if (!squareNode) return;

  const position = squareNode.dataset.position;
  const piece = game.getPiece(position);

  if (selectedSquare) {
    if (possibleMoves.includes(position)) {
      // Play the move
      const result = game.move({ from: selectedSquare, to: position });
      if (!result) return;

      renderBoard();
      renderCaptures({ game, factory });
      deselect();
      hideCheck();

      const log = result.specialMove
        ? `${result.from} → ${result.to} (${SPECIAL_MOVE_LABELS[result.specialMove]})`
        : `${result.from} → ${result.to}`;
      console.log(log);
      lastMove = result;

      if (result.promotion) {
        showPromotion(result.to);
        return;
      }

      renderCurrentPlayer({ color: game.currentColor });
      afterMove();
    } else if (piece && piece.color === game.currentColor) {
      // Select another piece of the same side
      select(position);
    } else {
      deselect();
    }
  } else if (piece && piece.color === game.currentColor) {
    select(position);
  }
});

// ─── Initialization ─────────────────────────────────────────────────────────

function initialize() {
  game.initialize();
  lastMove = null;
  renderBoard();
  renderCaptures({ game, factory });
  deselect();
  hideCheck();
  renderCurrentPlayer({ color: game.currentColor });
  renderStatus({ game, lastMove, ...getGameOutcome({ game }) });
}

consoleLog();
showCopyrightYear();
enableBoardNavigation(boardNode);
initialize();
