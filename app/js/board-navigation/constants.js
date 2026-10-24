import { BOARD_SIZE } from '../squares/constants.js';

/** The files of the board, from left to right as white sees it. */
export const BOARD_FILES = 'abcdefgh';

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
