import { describe, it, expect } from 'vitest';
import { ALERT_CHOICES } from '../app/js/alerts/constants.js';
import { shouldStartNewGame } from '../app/js/alerts/utils.js';

describe('shouldStartNewGame', () => {
  it('starts a new game after "Rejouer !"', () => {
    expect(shouldStartNewGame(ALERT_CHOICES.replay)).toBe(true);
  });

  it('keeps the final position after "Voir la position"', () => {
    expect(shouldStartNewGame(ALERT_CHOICES.review)).toBe(false);
  });

  it('starts a new game after Escape, which leaves an empty value', () => {
    expect(shouldStartNewGame('')).toBe(true);
  });

  it('starts a new game for an unknown value or another case', () => {
    expect(shouldStartNewGame('cancel')).toBe(true);
    expect(shouldStartNewGame('Review')).toBe(true);
    expect(shouldStartNewGame(' review ')).toBe(true);
  });

  it('starts a new game for a missing value or another type', () => {
    expect(shouldStartNewGame()).toBe(true);
    expect(shouldStartNewGame(null)).toBe(true);
    expect(shouldStartNewGame(0)).toBe(true);
    expect(shouldStartNewGame({ value: 'review' })).toBe(true);
  });
});
