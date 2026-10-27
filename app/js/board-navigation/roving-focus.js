import { isSquare } from '../squares/utils.js';
import {
  SHORTCUT_MODIFIERS,
  SQUARE_SELECTOR,
  TABBABLE_INDEX,
  UNTABBABLE_INDEX,
} from './constants.js';
import { getNextSquare } from './utils.js';

/**
 * Returns the node of a square of the board.
 *
 * @param {object} params
 * @param {ParentNode} params.board The node that holds the squares.
 * @param {unknown} params.square The square, such as `'e2'`, which may be of any type.
 * @returns {HTMLElement | null} The node, or `null` when the value is not a square of the board.
 */
function getSquareNode({ board, square }) {
  return isSquare(square)
    ? board.querySelector(`${SQUARE_SELECTOR}[data-position="${square}"]`)
    : null;
}

/**
 * Makes a square the only one of the board that the Tab key reaches.
 *
 * @param {object} params
 * @param {ParentNode} params.board The node that holds the squares.
 * @param {HTMLElement} params.squareNode The node of the square.
 */
function makeTabbable({ board, squareNode }) {
  for (const node of board.querySelectorAll(SQUARE_SELECTOR)) {
    node.tabIndex = node === squareNode ? TABBABLE_INDEX : UNTABBABLE_INDEX;
  }
}

/**
 * Moves the focus to a square of the board, which becomes the one that the Tab key reaches.
 *
 * @param {object} params
 * @param {ParentNode | null} [params.board] The node that holds the squares.
 * @param {string} [params.square] The square, such as `'e4'`.
 * @returns {boolean} Whether the focus moved, which it does not when the board or the square is
 *   missing.
 * @example
 * focusSquare({ board: document.querySelector('.container-squares'), square: 'e4' }); // true
 */
export function focusSquare({ board, square } = {}) {
  const squareNode = board ? getSquareNode({ board, square }) : null;
  if (!squareNode) return false;

  makeTabbable({ board, squareNode });
  squareNode.focus();
  return true;
}

/**
 * Lets the keyboard move the focus across the board, as in a grid: the arrows, Home, End, PageUp
 * and PageDown move it from square to square, and the Tab key reaches the square that last had the
 * focus, whether a key, a click or a script gave it. Keys pressed with Alt, Ctrl or Meta are left
 * to the browser.
 *
 * @param {HTMLElement | null} [board] The node that holds the squares.
 * @returns {() => void} Removes the listeners; does nothing when the board is missing.
 */
export function enableBoardNavigation(board) {
  if (!board) return () => {};

  const onKeyDown = (event) => {
    const isShortcut = SHORTCUT_MODIFIERS.some((modifier) => event[modifier]);
    const squareNode = event.target.closest(SQUARE_SELECTOR);
    if (isShortcut || !squareNode) return;

    const nextSquare = getNextSquare({ square: squareNode.dataset.position, key: event.key });
    if (!nextSquare) return;
    event.preventDefault();
    focusSquare({ board, square: nextSquare });
  };
  const onFocusIn = (event) => {
    const squareNode = event.target.closest(SQUARE_SELECTOR);
    if (squareNode) makeTabbable({ board, squareNode });
  };

  board.addEventListener('keydown', onKeyDown);
  board.addEventListener('focusin', onFocusIn);
  return () => {
    board.removeEventListener('keydown', onKeyDown);
    board.removeEventListener('focusin', onFocusIn);
  };
}
