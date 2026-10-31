/**
 * The floor of the height term of the `--square` rule of the styles, in CSS pixels: the smallest
 * side of a square on a screen wide enough for the board. A phone held sideways has no floor: its
 * squares follow the screen height, about 43px at 844x390.
 */
export const MIN_SQUARE_SIZE_PX = 40;

/** The largest side of a square, in CSS pixels, that the `--square` rule of the styles allows. */
export const MAX_SQUARE_SIZE_PX = 70;

/** How far a square may sit from its place on the grid, in CSS pixels: subpixel rounding only. */
export const GRID_TOLERANCE_PX = 1;

/** The `max-width` of the narrow screen rules of the styles, in CSS pixels. */
export const NARROW_LAYOUT_MAX_WIDTH_PX = 899;

/**
 * A phone held sideways, under the 900px breakpoint, where the landscape layout keeps the panels
 * beside the board.
 */
export const PHONE_LANDSCAPE_VIEWPORT = Object.freeze({ width: 844, height: 390 });

/** The largest phone held sideways, above the 900px breakpoint, with the desktop panel rules. */
export const LARGE_PHONE_LANDSCAPE_VIEWPORT = Object.freeze({ width: 932, height: 430 });

/**
 * The smallest phone held sideways, an iPhone SE, the phone of the touch project: its squares are
 * under 30px, and its side columns about 120px wide.
 */
export const SMALL_PHONE_LANDSCAPE_VIEWPORT = Object.freeze({ width: 568, height: 320 });

/** A small Android phone held sideways, where #156 saw the move list cut to half its turns. */
export const COMPACT_PHONE_LANDSCAPE_VIEWPORT = Object.freeze({ width: 640, height: 360 });

/** An iPhone 8 held sideways, where #158 saw the panel of white scroll by 3px. */
export const MEDIUM_PHONE_LANDSCAPE_VIEWPORT = Object.freeze({ width: 667, height: 375 });

/** A 16:9 screen at the `max-width` of the landscape rule of the styles for smaller texts. */
export const SMALL_TEXTS_MAX_LANDSCAPE_VIEWPORT = Object.freeze({ width: 719, height: 404 });

/** A 16:9 screen one pixel wider, whose side columns must hold the texts at full size. */
export const FULL_TEXTS_MIN_LANDSCAPE_VIEWPORT = Object.freeze({ width: 720, height: 405 });

/**
 * The viewports of the landscape layout of phones, from the smallest phone to the largest, on both
 * sides of the 720px and 900px breakpoints.
 */
export const LANDSCAPE_VIEWPORTS = Object.freeze([
  SMALL_PHONE_LANDSCAPE_VIEWPORT,
  COMPACT_PHONE_LANDSCAPE_VIEWPORT,
  MEDIUM_PHONE_LANDSCAPE_VIEWPORT,
  SMALL_TEXTS_MAX_LANDSCAPE_VIEWPORT,
  FULL_TEXTS_MIN_LANDSCAPE_VIEWPORT,
  PHONE_LANDSCAPE_VIEWPORT,
  LARGE_PHONE_LANDSCAPE_VIEWPORT,
]);

/**
 * The viewports of the layout tests: a phone upright, a tablet upright, a phone sideways and a
 * laptop.
 */
export const LAYOUT_VIEWPORTS = Object.freeze([
  { width: 390, height: 800 },
  { width: 768, height: 1024 },
  PHONE_LANDSCAPE_VIEWPORT,
  { width: 1280, height: 800 },
]);

/**
 * Tablets held upright, under the 900px breakpoint, where the player panels stack above and below
 * the board: the 600px and 56rem thresholds of the tablet rule of the styles where the page starts
 * to fit, a short height and the most common one.
 */
export const UPRIGHT_TABLET_VIEWPORTS = Object.freeze([
  { width: 600, height: 896 },
  { width: 768, height: 896 },
  { width: 768, height: 900 },
  { width: 768, height: 1024 },
]);

/** A tablet held upright one pixel under the 56rem threshold, too short for the stacked page. */
export const SHORT_TABLET_VIEWPORT = Object.freeze({ width: 768, height: 895 });

/**
 * Screens held upright past the 56rem threshold but under the 600px of the tablet rule of the
 * styles: a phone at the threshold, a tall phone, and the widest screen left out.
 */
export const NARROW_UPRIGHT_VIEWPORTS = Object.freeze([
  { width: 390, height: 896 },
  { width: 430, height: 932 },
  { width: 599, height: 896 },
]);

/** 1. e4 d5: the pawn of white on e4 may then move to the empty e5 or take the pawn on d5. */
export const CAPTURE_OPENING_MOVES = Object.freeze([
  { from: 'e2', to: 'e4' },
  { from: 'd7', to: 'd5' },
]);

/** The pawn selected after `CAPTURE_OPENING_MOVES`. */
export const SELECTED_SQUARE = 'e4';

/** The empty square that the selected pawn can reach, marked with a dot. */
export const EMPTY_TARGET = 'e5';

/** The square of the pawn that the selected pawn can take, marked with a ring. */
export const CAPTURE_TARGET = 'd5';

/** The fool's mate, the shortest checkmate: black mates on its second move. */
export const FOOLS_MATE_MOVES = Object.freeze([
  { from: 'f2', to: 'f3' },
  { from: 'e7', to: 'e5' },
  { from: 'g2', to: 'g4' },
  { from: 'd8', to: 'h4' },
]);

/**
 * The main line of the Scandinavian defense, 1.e4 d5 2.exd5 Qxd5 3.Nc3: three turns in the move
 * list, and one captured pawn on each side.
 */
export const SCANDINAVIAN_MOVES = Object.freeze([
  { from: 'e2', to: 'e4' },
  { from: 'd7', to: 'd5' },
  { from: 'e4', to: 'd5' },
  { from: 'd8', to: 'd5' },
  { from: 'b1', to: 'c3' },
]);

/** The same line with 3...Qa5: as many captures, and white to move, its panel labelled. */
export const SCANDINAVIAN_MOVES_WHITE_TO_MOVE = Object.freeze([
  ...SCANDINAVIAN_MOVES,
  { from: 'd5', to: 'a5' },
]);

/** The pieces that each side has captured at the end of `SCANDINAVIAN_MOVES`. */
export const SCANDINAVIAN_CAPTURES = 1;

/**
 * A short game that brings a white pawn from h2 to the last rank, capturing the rook on h8; the
 * last move leaves the promotion pending.
 */
export const PROMOTION_MOVES = Object.freeze([
  { from: 'h2', to: 'h4' },
  { from: 'g7', to: 'g5' },
  { from: 'h4', to: 'g5' },
  { from: 'h7', to: 'h6' },
  { from: 'g5', to: 'h6' },
  { from: 'f8', to: 'g7' },
  { from: 'h6', to: 'g7' },
  { from: 'g8', to: 'f6' },
  { from: 'g7', to: 'h8' },
]);

/** The game frame, the translucent card over the photo, whose padding is the board gutter. */
export const FRAME_SELECTOR = '.wrapper';

/**
 * The whole move list, its title and the new game button included, around the scrolling list of
 * `MOVE_LIST_SELECTOR`.
 */
export const MOVE_LIST_PANEL_SELECTOR = '.move-list';

/** The square where the pawn of `PROMOTION_MOVES` promotes. */
export const PROMOTION_SQUARE = 'h8';

/** The title of the promotion choice, which names it. */
export const PROMOTION_TITLE = /^Promouvoir le pion/;

/** The title of the checkmate alert, which names the game over dialog. */
export const CHECKMATE_TITLE = /^Échec et mat/;

/** The name of the button that closes the game over dialog on the final position. */
export const REVIEW_BUTTON_NAME = 'Voir la position';

/** The name of the button under the move list that starts a new game. */
export const NEW_GAME_BUTTON_NAME = 'Nouvelle partie';

/** The name of the queen button of the promotion choice. */
export const QUEEN_BUTTON_NAME = 'Dame';

/**
 * A game where each side promotes two pawns to queens by capturing, for two of the longest turns
 * of the move list: `bxa8=D bxc1=D` and `gxh8=D gxf1=D+`. `isPromotion` marks the moves that open
 * the promotion choice.
 */
export const LONG_TURNS_MOVES = Object.freeze([
  { from: 'a2', to: 'a4' },
  { from: 'h7', to: 'h5' },
  { from: 'a4', to: 'a5' },
  { from: 'h5', to: 'h4' },
  { from: 'a5', to: 'a6' },
  { from: 'h4', to: 'h3' },
  { from: 'a6', to: 'b7' },
  { from: 'h3', to: 'g2' },
  { from: 'h2', to: 'h4' },
  { from: 'a7', to: 'a5' },
  { from: 'h4', to: 'h5' },
  { from: 'a5', to: 'a4' },
  { from: 'h5', to: 'h6' },
  { from: 'a4', to: 'a3' },
  { from: 'h6', to: 'g7' },
  { from: 'a3', to: 'b2' },
  { from: 'b7', to: 'a8', isPromotion: true },
  { from: 'b2', to: 'c1', isPromotion: true },
  { from: 'g7', to: 'h8', isPromotion: true },
  { from: 'g2', to: 'f1', isPromotion: true },
]);

/** The number of pieces one side can capture: every piece of the opponent but its king. */
export const MAX_CAPTURED_PIECES = 15;

/** A turn of the move list, both moves played. */
export const TURN_MOVES = Object.freeze(['Cxe4+', 'Dxh8#']);
