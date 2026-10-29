import { COLORS } from '../colors/constants.js';
import { CURRENT_PLAYER_LABEL } from '../labels/constants.js';
import { getSquareLabel } from '../labels/utils.js';
import { getMoveTurns } from '../notation/utils.js';
import { BOARD_SELECTOR, SQUARE_SELECTOR } from '../squares/constants.js';
import { isSquare } from '../squares/utils.js';
import { getStatusMessage } from '../status/utils.js';
import {
  BOARD_SQUARE_SELECTOR,
  CAPTURE_COUNT_ID_SUFFIX,
  CAPTURES_ID_SUFFIX,
  CHECK_CLASS,
  CONTROL_SELECTOR,
  CURRENT_PLAYER_CLASS,
  GAME_OVER_BOARD_CLASS,
  MOVE_CLASS,
  MOVE_LIST_EMPTY_SELECTOR,
  MOVE_LIST_SELECTOR,
  PIECE_SELECTOR,
  STATUS_SELECTOR,
  TURN_SELECTOR,
} from './constants.js';
import { getKingSquare } from './utils.js';

/**
 * Returns the node of a square of the board.
 *
 * @param {object} params
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 * @param {unknown} params.square The square, such as `'e4'`, which may be of any type.
 * @returns {HTMLElement | null} The node, or `null` when the value is not a square or the page has
 *   no such square.
 */
export function getSquareNode({ root = document, square }) {
  if (!isSquare(square)) return null;
  return root.querySelector(`${SQUARE_SELECTOR}[data-position="${square}"]`);
}

/**
 * Shows the pieces of the game on the board, in place of the ones shown before. The pieces are
 * hidden from screen readers, since the name of each square already holds its piece.
 *
 * @param {object} params
 * @param {import('../Chessboard.js').default} params.game The game.
 * @param {import('../PieceFactory.js').default} params.factory Builds the node of each piece.
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 */
export function renderPieces({ game, factory, root = document }) {
  root.querySelectorAll(PIECE_SELECTOR).forEach((pieceNode) => pieceNode.remove());
  for (const [square, piece] of game.board) {
    const squareNode = getSquareNode({ root, square });
    const pieceNode = factory.create({ type: piece.type, color: piece.color });
    if (!squareNode || !pieceNode) continue;
    pieceNode.setAttribute('aria-hidden', 'true');
    squareNode.appendChild(pieceNode);
  }
}

/**
 * Names each square of the board for screen readers, after its piece, the selection and the check
 * mark, and marks the selected square.
 *
 * @param {object} params
 * @param {import('../Chessboard.js').default} params.game The game.
 * @param {{ square: string | null, moves: readonly string[] }} params.selection The selected
 *   square and the squares it can move to.
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 */
export function renderSquareLabels({ game, selection, root = document }) {
  root.querySelectorAll(BOARD_SQUARE_SELECTOR).forEach((squareNode) => {
    const square = squareNode.dataset.position;
    const label = getSquareLabel({
      square,
      piece: game.getPiece(square),
      isPossibleMove: selection.moves.includes(square),
      isCheck: squareNode.classList.contains(CHECK_CLASS),
    });
    if (label) squareNode.setAttribute('aria-label', label);
    squareNode.setAttribute('aria-selected', String(square === selection.square));
  });
}

/**
 * Announces the last move and what it leaves the side to play in, in French, in the live region of
 * the page.
 *
 * @param {object} params
 * @param {import('../Chessboard.js').default} params.game The game, after the move.
 * @param {object | null} params.lastMove The last move, as `game.move` returns it, or `null` at
 *   the start of a game.
 * @param {string} params.outcome The outcome of the move, one of `GAME_OUTCOMES`.
 * @param {string | null} params.color The color to play.
 * @param {string | null} params.winner The winning color, after a checkmate.
 * @param {boolean} [params.isCheck] Whether the move leaves the king to play in check, which a
 *   draw announces before itself.
 * @param {string} [params.drawReason] The reason of a draw, one of `DRAW_REASONS`.
 * @param {ParentNode} [params.root] The node that holds the live region, the document by default.
 */
export function renderStatus({
  game,
  lastMove,
  outcome,
  color,
  winner,
  isCheck,
  drawReason,
  root = document,
}) {
  const promotedType = lastMove?.promotion ? game.getPiece(lastMove.to)?.type : undefined;
  root.querySelector(STATUS_SELECTOR).textContent = getStatusMessage({
    lastMove,
    promotedType,
    outcome,
    color,
    winner,
    isCheck,
    drawReason,
  });
}

/**
 * Shows the pieces that each color captured, and their count, next to its player.
 *
 * @param {object} params
 * @param {import('../Chessboard.js').default} params.game The game.
 * @param {import('../PieceFactory.js').default} params.factory Builds the node of each piece.
 * @param {ParentNode} [params.root] The node that holds the panels, the document by default.
 */
export function renderCaptures({ game, factory, root = document }) {
  for (const color of COLORS) {
    const zone = root.querySelector(`#${color}${CAPTURES_ID_SUFFIX}`);
    const counter = root.querySelector(`#${color}${CAPTURE_COUNT_ID_SUFFIX}`);
    zone.innerHTML = '';
    counter.textContent = String(game.captures[color].length);
    for (const piece of game.captures[color]) {
      const pieceNode = factory.create({ type: piece.type, color: piece.color });
      if (pieceNode) zone.appendChild(pieceNode);
    }
  }
}

/**
 * Highlights the panel of the player to move, and only that one, and writes
 * {@link CURRENT_PLAYER_LABEL} in it, so that the side to move shows without color; the other
 * panel keeps an empty line. Once the game is over, no panel is highlighted, since nobody moves.
 *
 * @param {object} params
 * @param {'white' | 'black'} params.color The color to move.
 * @param {boolean} [params.isOver] Whether the game is over, by checkmate or a draw; any value
 *   other than `true`, a missing one included, counts as going on.
 * @param {ParentNode} [params.root] The node that holds the panels, the document by default.
 */
export function renderCurrentPlayer({ color, isOver, root = document }) {
  const isGoingOn = isOver !== true;
  root.querySelectorAll(CONTROL_SELECTOR).forEach((control) => {
    const isColorToMove = control.dataset.color === color;
    const isCurrent = isGoingOn && isColorToMove;
    control.classList.toggle(CURRENT_PLAYER_CLASS, isCurrent);
    const turnNode = control.querySelector(TURN_SELECTOR);
    if (turnNode) turnNode.textContent = isCurrent ? CURRENT_PLAYER_LABEL : '';
  });
}

/**
 * Marks the board as over once the game ends, so that its squares no longer darken on hover
 * while the players review the final position, and removes the mark for a game that goes on.
 *
 * @param {object} [params]
 * @param {{ isOver?: boolean } | null} [params.game] The game; a missing one counts as going on.
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 */
export function renderGameOver({ game, root = document } = {}) {
  const isOver = game?.isOver === true;
  root.querySelector(BOARD_SELECTOR)?.classList.toggle(GAME_OVER_BOARD_CLASS, isOver);
}

/**
 * Marks the square of the king of a color as in check, and only that one.
 *
 * @param {object} params
 * @param {Map<string, { type: string, color: string }>} params.board The pieces, by square.
 * @param {'white' | 'black'} params.color The color of the king in check.
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 */
export function markCheck({ board, color, root = document }) {
  clearCheck({ root });
  const kingSquare = getKingSquare({ board, color });
  if (kingSquare) getSquareNode({ root, square: kingSquare })?.classList.add(CHECK_CLASS);
}

/**
 * Removes the check mark from the board.
 *
 * @param {object} [params]
 * @param {ParentNode} [params.root] The node that holds the board, the document by default.
 */
export function clearCheck({ root = document } = {}) {
  root
    .querySelectorAll(`${SQUARE_SELECTOR}.${CHECK_CLASS}`)
    .forEach((squareNode) => squareNode.classList.remove(CHECK_CLASS));
}

/**
 * Builds the item of a turn of the move list: white's move, then black's once played. The list
 * numbers the item with the number of the turn.
 *
 * @param {{ number: number, white: string | null, black: string | null }} turn The turn, as
 *   `getMoveTurns` returns it.
 * @returns {HTMLLIElement} The item.
 */
function createTurnNode(turn) {
  const item = document.createElement('li');
  item.value = turn.number;
  const moves = [turn.white, turn.black].filter((notation) => notation !== null);
  for (const notation of moves) {
    const moveNode = document.createElement('span');
    moveNode.className = MOVE_CLASS;
    moveNode.textContent = notation;
    // A space between the two moves, so that screen readers read them apart
    if (item.childNodes.length > 0) item.append(' ');
    item.append(moveNode);
  }
  return item;
}

/**
 * Shows the moves of the game in the move list, numbered by turn, in place of the ones shown
 * before, and scrolls the list to the last one. The note that no move was played shows only
 * while the list is empty.
 *
 * @param {object} [params]
 * @param {unknown} [params.notations] The notation of each move, in the order they were played;
 *   a value that is not an array empties the list.
 * @param {ParentNode} [params.root] The node that holds the move list, the document by default.
 */
export function renderMoveList({ notations, root = document } = {}) {
  const list = root.querySelector(MOVE_LIST_SELECTOR);
  if (!list) return;

  const turns = getMoveTurns(notations);
  list.replaceChildren(...turns.map(createTurnNode));
  list.scrollTop = list.scrollHeight;
  const emptyNote = root.querySelector(MOVE_LIST_EMPTY_SELECTOR);
  if (emptyNote) emptyNote.hidden = turns.length > 0;
}
