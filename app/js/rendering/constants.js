import { BOARD_SELECTOR, SQUARE_SELECTOR } from '../squares/constants.js';

/** The selector of the pieces shown on the page, on the board and among the captures. */
export const PIECE_SELECTOR = '.piece';

/** The selector of the squares of the board, which hold its pieces. */
export const BOARD_SQUARE_SELECTOR = `${BOARD_SELECTOR} ${SQUARE_SELECTOR}`;

/** The selector of the live region that announces each move to screen readers. */
export const STATUS_SELECTOR = '.game-status';

/** The selector of the panel of each player, which carries its color in `data-color`. */
export const CONTROL_SELECTOR = '.control';

/** The class of the panel of the player to move. */
export const CURRENT_PLAYER_CLASS = 'current-player';

/** The class of the square of a king in check. */
export const CHECK_CLASS = 'check';

/** The end of the id of the zone that shows the pieces a color captured, as in `white-captures`. */
export const CAPTURES_ID_SUFFIX = '-captures';

/** The end of the id of the count of the pieces a color captured, as in `white-capture-count`. */
export const CAPTURE_COUNT_ID_SUFFIX = '-capture-count';
