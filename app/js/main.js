import Chessboard from './Chessboard.js';
import PieceFactory from './PieceFactory.js';
import { enableBoardNavigation, focusSquare } from './board-navigation/roving-focus.js';
import { COLOR_LABELS, COLORS } from './colors/constants.js';
import consoleLog from './console-log.js';
import { showCopyrightYear } from './copyright/show-copyright-year.js';
import {
  GAME_OUTCOMES,
  GAME_OVER_ALERTS,
  GAME_OVER_DIALOG_DELAY_MS,
} from './game-over/constants.js';
import { getGameOutcome } from './game-over/utils.js';
import { getSquareLabel } from './labels/utils.js';
import { SPECIAL_MOVE_LABELS } from './moves/constants.js';
import { getStatusMessage } from './status/utils.js';

const game = new Chessboard();
const factory = new PieceFactory();
const boardNode = document.querySelector('.container-squares');

let selectedSquare = null;
let possibleMoves = [];
// The last move played, as `game.move` returns it, which the status announces
let lastMove = null;

// ─── DOM rendering ──────────────────────────────────────────────────────────

function renderBoard() {
  document.querySelectorAll('.piece').forEach((p) => p.remove());
  for (const [position, piece] of game.board) {
    const squareNode = document.querySelector(`.square[data-position="${position}"]`);
    const pieceNode = factory.create({ type: piece.type, color: piece.color });
    if (!squareNode || !pieceNode) continue;
    // The name of the square already holds the piece: it is not read twice
    pieceNode.setAttribute('aria-hidden', 'true');
    squareNode.appendChild(pieceNode);
  }
  renderSquareLabels();
}

function renderSquareLabels() {
  document.querySelectorAll('.container-squares .square').forEach((squareNode) => {
    const position = squareNode.dataset.position;
    const label = getSquareLabel({
      square: position,
      piece: game.getPiece(position),
      isPossibleMove: possibleMoves.includes(position),
      isCheck: squareNode.classList.contains('check'),
    });
    if (label) squareNode.setAttribute('aria-label', label);
    squareNode.setAttribute('aria-selected', String(position === selectedSquare));
  });
}

function renderStatus({ outcome, color, winner }) {
  const promotedType = lastMove?.promotion ? game.getPiece(lastMove.to)?.type : undefined;
  document.querySelector('.game-status').textContent = getStatusMessage({
    lastMove,
    promotedType,
    outcome,
    color,
    winner,
  });
}

function renderCaptures() {
  for (const color of COLORS) {
    const zone = document.getElementById(`${color}-captures`);
    const counter = document.getElementById(`${color}-capture-count`);
    zone.innerHTML = '';
    counter.textContent = game.captures[color].length;
    for (const piece of game.captures[color]) {
      const pieceNode = factory.create({ type: piece.type, color: piece.color });
      if (pieceNode) zone.appendChild(pieceNode);
    }
  }
}

function updateCurrentPlayer() {
  document.querySelectorAll('.control').forEach((c) => c.classList.remove('current-player'));
  document
    .querySelector(`.control[data-color="${game.currentColor}"]`)
    ?.classList.add('current-player');
}

// ─── Selection and highlighting ─────────────────────────────────────────────

function deselect() {
  document.querySelectorAll('.possible-move').forEach((c) => c.classList.remove('possible-move'));
  document.querySelectorAll('.selected').forEach((c) => c.classList.remove('selected'));
  selectedSquare = null;
  possibleMoves = [];
  renderSquareLabels();
}

function select(position) {
  deselect();
  const piece = game.getPiece(position);
  if (!piece || piece.color !== game.currentColor) return;

  const moves = game.getMoves(position);
  if (moves.length === 0) return;

  selectedSquare = position;
  possibleMoves = moves;
  document.querySelector(`.square[data-position="${position}"]`)?.classList.add('selected');
  for (const dest of moves) {
    document.querySelector(`.square[data-position="${dest}"]`)?.classList.add('possible-move');
  }
  renderSquareLabels();
}

// ─── Check indicator ────────────────────────────────────────────────────────

function markCheck(color) {
  clearCheck();
  for (const [p, piece] of game.board) {
    if (piece.type === 'king' && piece.color === color) {
      document.querySelector(`.square[data-position="${p}"]`)?.classList.add('check');
      break;
    }
  }
  renderSquareLabels();
}

function clearCheck() {
  document.querySelectorAll('.square.check').forEach((c) => c.classList.remove('check'));
  renderSquareLabels();
}

// ─── After each move ────────────────────────────────────────────────────────

function afterMove() {
  const { outcome, color, winner } = getGameOutcome({ game });
  renderStatus({ outcome, color, winner });
  if (outcome === GAME_OUTCOMES.checkmate) {
    game.isOver = true;
    console.log(`Échec et mat ! ${COLOR_LABELS[winner]} gagne.`);
    markCheck(color);
    document.querySelector('.winner-color').textContent = COLOR_LABELS[winner];
    setTimeout(() => showAlert(GAME_OVER_ALERTS.checkmate), GAME_OVER_DIALOG_DELAY_MS);
  } else if (outcome === GAME_OUTCOMES.stalemate) {
    game.isOver = true;
    console.log('Pat — match nul.');
    setTimeout(() => showAlert(GAME_OVER_ALERTS.stalemate), GAME_OVER_DIALOG_DELAY_MS);
  } else if (outcome === GAME_OUTCOMES.check) {
    console.log(`${COLOR_LABELS[color]} est en échec !`);
    markCheck(color);
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
  renderCaptures();
  updateCurrentPlayer();
  clearCheck();
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
      renderCaptures();
      deselect();
      clearCheck();

      const log = result.specialMove
        ? `${result.from} → ${result.to} (${SPECIAL_MOVE_LABELS[result.specialMove]})`
        : `${result.from} → ${result.to}`;
      console.log(log);
      lastMove = result;

      if (result.promotion) {
        showPromotion(result.to);
        return;
      }

      updateCurrentPlayer();
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
  renderCaptures();
  deselect();
  clearCheck();
  updateCurrentPlayer();
  renderStatus(getGameOutcome({ game }));
}

consoleLog();
showCopyrightYear();
enableBoardNavigation(boardNode);
initialize();
