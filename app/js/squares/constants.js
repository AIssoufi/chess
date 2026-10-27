/** A square in lowercase algebraic notation, from `a1` to `h8`. */
export const SQUARE_PATTERN = /^[a-h][1-8]$/;

/** The files of the board, from left to right as white sees it. */
export const BOARD_FILES = 'abcdefgh';

/** The number of files, and of ranks, of the board. */
export const BOARD_SIZE = 8;

/** The lowest rank number; the highest one is `BOARD_SIZE`. */
export const FIRST_RANK = 1;

/** The selector of the board of the page, which holds its squares. */
export const BOARD_SELECTOR = '.container-squares';

/** The selector of the squares of the board, which carry their square in `data-position`. */
export const SQUARE_SELECTOR = '.square';
