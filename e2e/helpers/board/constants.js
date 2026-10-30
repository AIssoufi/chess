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
 * The `max-height` of the compact panels of a small phone held sideways, in CSS pixels: it must
 * match the `max-height` of their media query in `app/css/style.css`.
 */
export const SMALL_LANDSCAPE_MAX_HEIGHT_PX = 360;

/**
 * The smallest phone held sideways, an iPhone SE, the phone of the touch project: its squares are
 * under 30px, and its side columns about 120px wide.
 */
export const SMALL_PHONE_LANDSCAPE_VIEWPORT = Object.freeze({ width: 568, height: 320 });

/** A small Android phone held sideways, where #156 saw the move list cut to half its turns. */
export const COMPACT_PHONE_LANDSCAPE_VIEWPORT = Object.freeze({ width: 640, height: 360 });

/**
 * The viewports of the landscape layout of phones, from the smallest phone to the largest, on both
 * sides of the 900px breakpoint.
 */
export const LANDSCAPE_VIEWPORTS = Object.freeze([
  SMALL_PHONE_LANDSCAPE_VIEWPORT,
  COMPACT_PHONE_LANDSCAPE_VIEWPORT,
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

/** The number of pieces one side can capture: every piece of the opponent but its king. */
export const MAX_CAPTURED_PIECES = 15;

/** A turn of the move list, both moves played. */
export const TURN_MOVES = Object.freeze(['Cxe4+', 'Dxh8#']);
