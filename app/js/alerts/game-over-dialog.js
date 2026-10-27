import { COLOR_LABELS } from '../colors/constants.js';
import { DRAW_REASON_LABELS } from '../draws/constants.js';
import { getLabel } from '../labels/utils.js';
import {
  ALERT_BUTTON_SELECTOR,
  ALERT_TITLE_SELECTOR,
  DRAW_REASON_SELECTOR,
  SHOWN_ALERT_CLASS,
  WINNER_COLOR_SELECTOR,
} from './constants.js';

/**
 * Writes the winning color and the reason of the draw in the alerts of the game over dialog, in
 * French. A missing or unknown value leaves its text as it was.
 *
 * @param {object} params
 * @param {HTMLDialogElement} params.dialog The game over dialog.
 * @param {string | null} [params.winner] The winning color, after a checkmate.
 * @param {string} [params.drawReason] The reason of a draw, one of `DRAW_REASONS`.
 */
export function writeAlertDetails({ dialog, winner, drawReason }) {
  const winnerLabel = getLabel({ labels: COLOR_LABELS, key: winner });
  const drawReasonLabel = getLabel({ labels: DRAW_REASON_LABELS, key: drawReason });
  const winnerNode = dialog.querySelector(WINNER_COLOR_SELECTOR);
  const drawReasonNode = dialog.querySelector(DRAW_REASON_SELECTOR);
  if (winnerLabel && winnerNode) winnerNode.textContent = winnerLabel;
  if (drawReasonLabel && drawReasonNode) drawReasonNode.textContent = drawReasonLabel;
}

/**
 * Opens the game over dialog on one of its alerts, named after its title, and focuses its button.
 *
 * @param {object} params
 * @param {HTMLDialogElement} params.dialog The game over dialog.
 * @param {string} params.alertName The class of the alert, one of `GAME_OVER_ALERTS`.
 */
export function showGameOverAlert({ dialog, alertName }) {
  const alertNode = dialog.querySelector(`.${alertName}`);
  if (!alertNode) return;

  alertNode.classList.add(SHOWN_ALERT_CLASS);
  dialog.setAttribute('aria-labelledby', alertNode.querySelector(ALERT_TITLE_SELECTOR).id);
  dialog.showModal();
  alertNode.querySelector(ALERT_BUTTON_SELECTOR).focus();
}

/**
 * Hides the alerts of the game over dialog, once it closed.
 *
 * @param {HTMLDialogElement} dialog The game over dialog.
 */
export function hideGameOverAlerts(dialog) {
  dialog
    .querySelectorAll(`.${SHOWN_ALERT_CLASS}`)
    .forEach((alertNode) => alertNode.classList.remove(SHOWN_ALERT_CLASS));
}
