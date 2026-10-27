import { BOARD_SIZE } from '../squares/constants.js';

/**
 * How each navigation key of the board moves the focus, in files and ranks. A step that leaves
 * the board stops at its edge, so the arrows move one square and the other keys reach an edge.
 */
export const NAVIGATION_STEPS = Object.freeze({
  ArrowUp: Object.freeze({ fileStep: 0, rankStep: 1 }),
  ArrowDown: Object.freeze({ fileStep: 0, rankStep: -1 }),
  ArrowLeft: Object.freeze({ fileStep: -1, rankStep: 0 }),
  ArrowRight: Object.freeze({ fileStep: 1, rankStep: 0 }),
  Home: Object.freeze({ fileStep: -BOARD_SIZE, rankStep: 0 }),
  End: Object.freeze({ fileStep: BOARD_SIZE, rankStep: 0 }),
  PageUp: Object.freeze({ fileStep: 0, rankStep: BOARD_SIZE }),
  PageDown: Object.freeze({ fileStep: 0, rankStep: -BOARD_SIZE }),
});

/** The selector of the squares of the board. */
export const SQUARE_SELECTOR = '.square';

/** The `tabIndex` of the one square that the Tab key reaches. */
export const TABBABLE_INDEX = 0;

/** The `tabIndex` of the other squares, which only the navigation keys and a click reach. */
export const UNTABBABLE_INDEX = -1;

/**
 * The modifiers of a keyboard event that make a key a shortcut of the browser or the system, such
 * as Alt+Left to go back, which the board leaves alone.
 */
export const SHORTCUT_MODIFIERS = Object.freeze(['altKey', 'ctrlKey', 'metaKey']);
