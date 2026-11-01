import { FOCUS_MOVE_KEY, PIECE_BUTTON_SELECTOR } from './constants.js';
import { getNextPieceIndex } from './utils.js';

/**
 * Opens the promotion choice as a modal dialog, which keeps the focus away from the page, with the
 * symbols of the promoting color, and focuses its first piece.
 *
 * @param {object} params
 * @param {HTMLDialogElement} params.wrapper The dialog of the promotion choice.
 * @param {import('../PieceFactory.js').default} params.factory Gives the symbol of each piece.
 * @param {'white' | 'black'} params.color The color of the promoting pawn.
 */
export function showPromotionChoice({ wrapper, factory, color }) {
  wrapper.querySelectorAll(PIECE_BUTTON_SELECTOR).forEach((button) => {
    button.textContent = factory.getSymbol(button.dataset.type, color);
  });
  wrapper.showModal();
  wrapper.querySelector(PIECE_BUTTON_SELECTOR)?.focus();
}

/**
 * Closes the promotion choice. A closed choice stays closed.
 *
 * @param {HTMLDialogElement} wrapper The dialog of the promotion choice.
 */
export function hidePromotionChoice(wrapper) {
  wrapper.close();
}

/**
 * Keeps Tab and Shift+Tab on the pieces of the promotion choice. The modal dialog alone does not:
 * Chromium stops on the page body after the last piece, and Safari skips buttons on Tab.
 *
 * @param {KeyboardEvent} event A key press in the dialog of the promotion choice.
 */
export function keepFocusOnPieces(event) {
  if (event.key !== FOCUS_MOVE_KEY) return;

  event.preventDefault();
  const pieces = [...event.currentTarget.querySelectorAll(PIECE_BUTTON_SELECTOR)];
  const nextIndex = getNextPieceIndex({
    currentIndex: pieces.indexOf(document.activeElement),
    count: pieces.length,
    isBackward: event.shiftKey,
  });
  pieces[nextIndex]?.focus();
}

/**
 * Returns the piece type that a click in the promotion choice picks.
 *
 * @param {Event} event The click.
 * @returns {string | null} The type of the clicked piece, such as `'queen'`, or `null` for a
 *   click beside the pieces.
 */
export function getChosenPieceType(event) {
  const target = event?.target;
  if (typeof target?.closest !== 'function') return null;
  return target.closest(PIECE_BUTTON_SELECTOR)?.dataset.type ?? null;
}
