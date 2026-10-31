/** The piece types a pawn may be promoted to. */
export const PROMOTION_PIECE_TYPES = Object.freeze(['queen', 'rook', 'bishop', 'knight']);

/** The selector of the promotion choice, shown while a pawn waits for its new piece. */
export const PROMOTION_CHOICE_SELECTOR = '.promotion__wrapper';

/** The selector of the buttons of the promotion choice, one per piece type in `data-type`. */
export const PIECE_BUTTON_SELECTOR = '[data-type]';

/** The `key` of the keyboard event that moves the focus inside the promotion choice. */
export const FOCUS_MOVE_KEY = 'Tab';
