import { BOARD_SELECTOR, SQUARE_SELECTOR } from '../squares/constants.js';

/** The class of the pieces shown on the page, on the board and among the captures. */
export const PIECE_CLASS = 'piece';

/** The selector of the pieces shown on the page, on the board and among the captures. */
export const PIECE_SELECTOR = `.${PIECE_CLASS}`;

/** The selector of the squares of the board, which hold its pieces. */
export const BOARD_SQUARE_SELECTOR = `${BOARD_SELECTOR} ${SQUARE_SELECTOR}`;

/** The selector of the live region that announces each move to screen readers. */
export const STATUS_SELECTOR = '.game-status';

/** The selector of the panel of each player, which carries its color in `data-color`. */
export const CONTROL_SELECTOR = '.control';

/** The class of the panel of the player to move. */
export const CURRENT_PLAYER_CLASS = 'current-player';

/** The selector of the line of each panel that tells the player to move that it is their turn. */
export const TURN_SELECTOR = '.control__turn';

/** The class of the square of a king in check. */
export const CHECK_CLASS = 'check';

/** The class of the board once the game is over, whose squares then ignore the hover. */
export const GAME_OVER_BOARD_CLASS = 'game-over';

/** The selector of the list of the moves played, one item per turn. */
export const MOVE_LIST_SELECTOR = '.move-list__moves';

/** The selector of the note that the move list shows before the first move. */
export const MOVE_LIST_EMPTY_SELECTOR = '.move-list__empty';

/** The class of a move of the list, white's or black's. */
export const MOVE_CLASS = 'move-list__move';

/** The end of the id of the zone that shows the pieces a color captured, as in `white-captures`. */
export const CAPTURES_ID_SUFFIX = '-captures';

/** The end of the id of the count of the pieces a color captured, as in `white-capture-count`. */
export const CAPTURE_COUNT_ID_SUFFIX = '-capture-count';
