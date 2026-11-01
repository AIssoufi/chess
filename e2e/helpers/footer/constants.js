/** The two blocks of the footer, fixed to the screen on wide and tall enough windows. */
export const FOOTER_BLOCK_SELECTORS = Object.freeze(['.copyright', '.social-links']);

/** The `position` of a footer block fixed to the screen. */
export const FIXED_POSITION = 'fixed';

/** The `position` of a footer block that follows the page. */
export const STATIC_POSITION = 'static';

/** Turns of a long game: a filled move list, as in the measures of #197. */
export const LONG_GAME_TURNS = 44;

/** Where to try the new game button, as parts of its width: #197 lost the right part of it. */
export const BUTTON_WIDTH_RATIOS = Object.freeze([0.05, 0.25, 0.5, 0.75, 0.9, 0.95]);

/** Where to try the new game button, as parts of its height: #197 lost its bottom right corner. */
export const BUTTON_HEIGHT_RATIOS = Object.freeze([0.1, 0.5, 0.95]);

/**
 * Windows whose footer follows the page. All but 1199x720 and 1920x500 had it over the game: the
 * first is the last width of the limit, the second shows that short windows have no width limit.
 */
export const PAGE_FOOTER_VIEWPORTS = Object.freeze([
  { width: 1080, height: 810 },
  { width: 1100, height: 720 },
  { width: 1199, height: 720 },
  { width: 1080, height: 450 },
  { width: 1280, height: 450 },
  { width: 1920, height: 500 },
]);

/**
 * Windows that keep the footer fixed, with the board they had before #197, in CSS pixels: 1200x501
 * is the first width of the limit, 1px taller than the short layout held sideways.
 */
export const FIXED_FOOTER_VIEWPORTS = Object.freeze([
  { width: 1200, height: 501, boardWidth: 320 },
  { width: 1200, height: 720, boardWidth: 528 },
  { width: 1280, height: 720, boardWidth: 528 },
  { width: 1366, height: 768, boardWidth: 560 },
  { width: 1440, height: 900, boardWidth: 560 },
  { width: 1920, height: 1080, boardWidth: 560 },
]);

/** A window under the limit that was clear before #197, with its board in CSS pixels. */
export const NARROW_CLEAR_VIEWPORT = Object.freeze({ width: 1024, height: 768, boardWidth: 560 });
