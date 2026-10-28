import { PIECE_BUTTON_SELECTOR } from './constants.js';

/**
 * Shows the promotion choice with the symbols of the promoting color, and focuses its first piece.
 *
 * @param {object} params
 * @param {HTMLElement} params.wrapper The node of the promotion choice.
 * @param {import('../PieceFactory.js').default} params.factory Gives the symbol of each piece.
 * @param {'white' | 'black'} params.color The color of the promoting pawn.
 */
export function showPromotionChoice({ wrapper, factory, color }) {
  wrapper.querySelectorAll(PIECE_BUTTON_SELECTOR).forEach((button) => {
    button.textContent = factory.getSymbol(button.dataset.type, color);
  });
  wrapper.hidden = false;
  wrapper.querySelector(PIECE_BUTTON_SELECTOR)?.focus();
}

/**
 * Hides the promotion choice.
 *
 * @param {HTMLElement} wrapper The node of the promotion choice.
 */
export function hidePromotionChoice(wrapper) {
  wrapper.hidden = true;
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
