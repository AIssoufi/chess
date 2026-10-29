/** The lowest contrast ratio of WCAG AA for text under the large size (1.4.3, Contrast Minimum). */
export const AA_TEXT_CONTRAST_RATIO = 4.5;

/** The largest value of a red, green or blue channel of a CSS color. */
export const CHANNEL_MAX = 255;

/** The alpha of an opaque CSS color. */
export const OPAQUE_ALPHA = 1;

/** Opaque black, the darkest the background photo can get behind the game frame. */
export const BLACK = Object.freeze({ red: 0, green: 0, blue: 0, alpha: OPAQUE_ALPHA });

/** Fully transparent black, the color seen through two fully transparent ones. */
export const TRANSPARENT_BLACK = Object.freeze({ ...BLACK, alpha: 0 });

/** Opaque white, the lightest the background photo can get behind the game frame. */
export const WHITE = Object.freeze({
  red: CHANNEL_MAX,
  green: CHANNEL_MAX,
  blue: CHANNEL_MAX,
  alpha: OPAQUE_ALPHA,
});

/** The two extremes of any photo, between which the contrast of a text is the lowest. */
export const PHOTO_EXTREMES = Object.freeze([BLACK, WHITE]);

/**
 * A CSS color as `getComputedStyle` writes it: `rgb(r, g, b)`, `rgba(r, g, b, a)`, or the space
 * separated `rgb(r g b / a)`.
 */
export const RGB_COLOR_PATTERN =
  /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/;

/** The channel value under which sRGB is linear, by the sRGB transfer function. */
export const SRGB_LINEAR_THRESHOLD = 0.04045;

/** The slope of the linear part of the sRGB transfer function. */
export const SRGB_LINEAR_DIVISOR = 12.92;

/** The offset of the curved part of the sRGB transfer function. */
export const SRGB_GAMMA_OFFSET = 0.055;

/** The divisor of the curved part of the sRGB transfer function. */
export const SRGB_GAMMA_DIVISOR = 1.055;

/** The exponent of the curved part of the sRGB transfer function. */
export const SRGB_GAMMA = 2.4;

/** The weight of each linear channel in the relative luminance of WCAG. */
export const LUMINANCE_WEIGHTS = Object.freeze({ red: 0.2126, green: 0.7152, blue: 0.0722 });

/** The flare that WCAG adds to both luminances of a contrast ratio. */
export const CONTRAST_FLARE = 0.05;
