import {
  CONTROL_SELECTOR,
  CURRENT_PLAYER_CLASS,
  TURN_SELECTOR,
} from '../../../app/js/rendering/constants.js';
import { GRID_TOLERANCE_PX } from '../board/constants.js';
import { expect } from '../fixtures.js';
import { PLAYER_NAME_SELECTOR } from './constants.js';

/**
 * Reads, in the panel of the side to move, how far the outline of the name reaches below its box,
 * its width plus its offset, and the space between the box of the name and the turn label under
 * it, in CSS pixels.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 * @returns {Promise<{ outlineReach: number, labelGap: number }>} The reach and the space.
 */
function readTurnLabelGap(page) {
  return page.evaluate(
    ({ currentPlayerSelector, nameSelector, turnSelector }) => {
      const panel = document.querySelector(currentPlayerSelector);
      const name = panel.querySelector(nameSelector);
      const { outlineWidth, outlineOffset } = getComputedStyle(name);
      return {
        outlineReach: parseFloat(outlineWidth) + parseFloat(outlineOffset),
        labelGap:
          panel.querySelector(turnSelector).getBoundingClientRect().top -
          name.getBoundingClientRect().bottom,
      };
    },
    {
      currentPlayerSelector: `${CONTROL_SELECTOR}.${CURRENT_PLAYER_CLASS}`,
      nameSelector: PLAYER_NAME_SELECTOR,
      turnSelector: TURN_SELECTOR,
    }
  );
}

/**
 * Checks that the outline of the name of the side to move leaves its turn label uncovered.
 *
 * @param {import('@playwright/test').Page} page The page of the game.
 */
export async function expectClearTurnLabel(page) {
  const { outlineReach, labelGap } = await readTurnLabelGap(page);

  expect(outlineReach, 'the name of the side to move has its outline').toBeGreaterThan(0);
  expect(labelGap, 'the turn label sits below the outline of the name').toBeGreaterThanOrEqual(
    outlineReach - GRID_TOLERANCE_PX
  );
}
