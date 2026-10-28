// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { ALERT_CHOICES } from '../app/js/alerts/constants.js';
import {
  hideGameOverAlerts,
  showGameOverAlert,
  writeAlertDetails,
} from '../app/js/alerts/game-over-dialog.js';
import { DRAW_REASONS } from '../app/js/draws/constants.js';

let dialog;

beforeEach(() => {
  document.body.innerHTML = `
    <dialog class="alert__wrapper">
      <form method="dialog">
        <div class="alert checkmate">
          <h2 id="checkmate-title">Échec et mat !</h2>
          <p><span class="winner-color"></span></p>
          <div class="alert__actions">
            <button value="replay">Rejouer !</button>
            <button value="review">Voir la position</button>
          </div>
        </div>
        <div class="alert draw">
          <h2 id="draw-title">Match nul !</h2>
          <p><span class="draw-reason"></span></p>
          <div class="alert__actions">
            <button value="replay">Rejouer !</button>
            <button value="review">Voir la position</button>
          </div>
        </div>
      </form>
    </dialog>`;
  dialog = document.querySelector('.alert__wrapper');
});

describe('writeAlertDetails', () => {
  it('writes the winning color in French', () => {
    writeAlertDetails({ dialog, winner: 'white' });
    expect(dialog.querySelector('.winner-color').textContent).toBe('blanche');
  });

  it('writes the reason of the draw in French', () => {
    writeAlertDetails({ dialog, drawReason: DRAW_REASONS.fiftyMoveRule });
    expect(dialog.querySelector('.draw-reason').textContent).toBe(
      'cinquante coups sans prise ni mouvement de pion'
    );
  });

  it('leaves the texts as they were for missing or unknown values', () => {
    writeAlertDetails({ dialog, winner: 'black' });
    writeAlertDetails({ dialog, winner: 'red', drawReason: 'agreement' });
    writeAlertDetails({ dialog });
    expect(dialog.querySelector('.winner-color').textContent).toBe('noire');
    expect(dialog.querySelector('.draw-reason').textContent).toBe('');
  });

  it('skips a dialog without the detail nodes', () => {
    dialog.innerHTML = '';
    expect(() => writeAlertDetails({ dialog, winner: 'white' })).not.toThrow();
  });
});

describe('showGameOverAlert', () => {
  it('opens the dialog on the alert, named after its title, with "Rejouer !" focused', () => {
    showGameOverAlert({ dialog, alertName: 'draw' });
    const alert = dialog.querySelector('.draw');
    expect(dialog.open).toBe(true);
    expect(alert.classList.contains('shown')).toBe(true);
    expect(dialog.querySelector('.checkmate').classList.contains('shown')).toBe(false);
    expect(dialog.getAttribute('aria-labelledby')).toBe('draw-title');
    expect(document.activeElement).toBe(alert.querySelector(`[value="${ALERT_CHOICES.replay}"]`));
  });

  it('keeps the dialog closed for an alert missing from it', () => {
    showGameOverAlert({ dialog, alertName: 'stalemate' });
    expect(dialog.open).toBe(false);
    expect(dialog.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('forgets the choice that closed the dialog at the end of an earlier game', () => {
    showGameOverAlert({ dialog, alertName: 'checkmate' });
    dialog.close('review');
    expect(dialog.returnValue).toBe('review');
    showGameOverAlert({ dialog, alertName: 'draw' });
    expect(dialog.returnValue).toBe('');
  });

  it('keeps the choice of the earlier game for an alert missing from the dialog', () => {
    showGameOverAlert({ dialog, alertName: 'checkmate' });
    dialog.close('review');
    showGameOverAlert({ dialog, alertName: 'stalemate' });
    expect(dialog.returnValue).toBe('review');
  });
});

describe('hideGameOverAlerts', () => {
  it('hides the shown alert', () => {
    showGameOverAlert({ dialog, alertName: 'checkmate' });
    dialog.close();
    hideGameOverAlerts(dialog);
    expect(dialog.querySelectorAll('.shown')).toHaveLength(0);
  });

  it('does nothing when no alert is shown', () => {
    expect(() => hideGameOverAlerts(dialog)).not.toThrow();
  });
});
