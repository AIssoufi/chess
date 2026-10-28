import { ALERT_CHOICES } from './constants.js';

/**
 * Tells whether the closing of the game over dialog starts a new game: every way of closing it
 * does, Escape and an unknown value included, except "Voir la position", which leaves the final
 * position on screen.
 *
 * @param {unknown} returnValue The `returnValue` of the dialog, possibly missing or of any type.
 * @returns {boolean} `false` for `ALERT_CHOICES.review` only.
 * @example
 * shouldStartNewGame('replay'); // true
 * shouldStartNewGame('review'); // false
 */
export function shouldStartNewGame(returnValue) {
  return returnValue !== ALERT_CHOICES.review;
}
