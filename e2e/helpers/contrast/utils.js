import {
  CHANNEL_MAX,
  CONTRAST_FLARE,
  LUMINANCE_WEIGHTS,
  OPAQUE_ALPHA,
  PHOTO_EXTREMES,
  RGB_COLOR_PATTERN,
  SRGB_GAMMA,
  SRGB_GAMMA_DIVISOR,
  SRGB_GAMMA_OFFSET,
  SRGB_LINEAR_DIVISOR,
  SRGB_LINEAR_THRESHOLD,
  TRANSPARENT_BLACK,
} from './constants.js';

/**
 * Reads a CSS color as `getComputedStyle` writes it, such as `rgba(255, 255, 255, 0.5)`.
 *
 * @param {unknown} text The color.
 * @returns {{ red: number, green: number, blue: number, alpha: number } | null} Its channels, from
 *   0 to 255, and its alpha, from 0 to 1, or `null` for any other value or a channel out of range.
 */
export function parseCssColor(text) {
  if (typeof text !== 'string') return null;

  const match = RGB_COLOR_PATTERN.exec(text.trim());
  if (match === null) return null;

  const [red, green, blue] = match.slice(1, 4).map(Number);
  const alpha = match[4] === undefined ? OPAQUE_ALPHA : Number(match[4]);
  const isChannelInRange = (channel) => channel <= CHANNEL_MAX;
  const isInRange = [red, green, blue].every(isChannelInRange) && alpha <= OPAQUE_ALPHA;
  return isInRange ? { red, green, blue, alpha } : null;
}

/**
 * Paints a color over another, as the browser does with `source-over`, in sRGB.
 *
 * @param {object} params
 * @param {{ red: number, green: number, blue: number, alpha: number }} params.top The color on top.
 * @param {{ red: number, green: number, blue: number, alpha: number }} params.bottom The color
 *   under it.
 * @returns {{ red: number, green: number, blue: number, alpha: number }} The color seen, fully
 *   transparent when both are.
 */
export function blendColors({ top, bottom }) {
  const bottomWeight = bottom.alpha * (OPAQUE_ALPHA - top.alpha);
  const alpha = top.alpha + bottomWeight;
  if (alpha === TRANSPARENT_BLACK.alpha) return { ...TRANSPARENT_BLACK };

  const blendChannel = (channel) =>
    (top[channel] * top.alpha + bottom[channel] * bottomWeight) / alpha;
  return {
    red: blendChannel('red'),
    green: blendChannel('green'),
    blue: blendChannel('blue'),
    alpha,
  };
}

/**
 * Gives the relative luminance of an opaque color, by WCAG.
 *
 * @param {{ red: number, green: number, blue: number }} color The color.
 * @returns {number} From 0 for black to 1 for white.
 */
export function getRelativeLuminance(color) {
  const toLinear = (channel) => {
    const value = channel / CHANNEL_MAX;
    const isLinearPart = value <= SRGB_LINEAR_THRESHOLD;
    if (isLinearPart) return value / SRGB_LINEAR_DIVISOR;
    return ((value + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_DIVISOR) ** SRGB_GAMMA;
  };
  return (
    LUMINANCE_WEIGHTS.red * toLinear(color.red) +
    LUMINANCE_WEIGHTS.green * toLinear(color.green) +
    LUMINANCE_WEIGHTS.blue * toLinear(color.blue)
  );
}

/**
 * Gives the contrast ratio of a text color over an opaque background, by WCAG: a translucent text
 * is painted over the background first.
 *
 * @param {object} params
 * @param {{ red: number, green: number, blue: number, alpha: number }} params.foreground The text
 *   color.
 * @param {{ red: number, green: number, blue: number, alpha: number }} params.background The
 *   opaque color behind it.
 * @returns {number} From 1, for the same colors, to 21, for black on white.
 */
export function getContrastRatio({ foreground, background }) {
  const seenForeground = blendColors({ top: foreground, bottom: background });
  const [lighter, darker] = [
    getRelativeLuminance(seenForeground),
    getRelativeLuminance(background),
  ].sort((first, second) => second - first);
  return (lighter + CONTRAST_FLARE) / (darker + CONTRAST_FLARE);
}

/**
 * Gives the lowest contrast a text can have over the background photo, whatever its pixels: the
 * backgrounds of the boxes around the text, from the outermost, are painted over black and over
 * white, the two extremes of the photo. Background images, such as gradients, are left out.
 *
 * @param {object} params
 * @param {string} params.text The computed `color` of the text.
 * @param {readonly string[]} params.layers The computed `background-color` of each box around the
 *   text, the outermost first. Anything but a list counts as no box.
 * @returns {number} The lower of the two contrast ratios.
 * @throws {Error} When a color is not one that `parseCssColor` reads.
 */
export function getWorstContrast({ text, layers }) {
  const readColor = (value) => {
    const color = parseCssColor(value);
    if (color === null) throw new Error(`Unreadable CSS color: ${value}`);
    return color;
  };
  const foreground = readColor(text);
  const backgrounds = (Array.isArray(layers) ? layers : []).map(readColor);
  const ratios = PHOTO_EXTREMES.map((photo) => {
    const background = backgrounds.reduce((bottom, top) => blendColors({ top, bottom }), photo);
    return getContrastRatio({ foreground, background });
  });
  return Math.min(...ratios);
}
