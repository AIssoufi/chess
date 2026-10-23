// @vitest-environment happy-dom
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';

const INDEX_PAGE = readFileSync(fileURLToPath(import.meta.resolve('../app/index.html')), 'utf8');
const STYLESHEET = readFileSync(fileURLToPath(import.meta.resolve('../app/css/style.css')), 'utf8');
/** The body of the page without its script, so that happy-dom does not start the game. */
const PAGE_BODY = INDEX_PAGE.match(/<body>([\s\S]*)<\/body>/)[1].replace(
  /<script[\s\S]*?<\/script>/g,
  ''
);
/** An id selector (`#black-captures`) or an attribute selector on the id (`[id*='captures']`). */
const ID_SELECTOR = /#[\w-]+|\[id[^\]]*\]/g;
/** An attribute selector on another attribute than the id, whose value may hold a `#`. */
const OTHER_ATTRIBUTE_SELECTOR = /\[(?!id\b)[^\]]*\]/g;
/** Text before each `{` of a stylesheet: a selector list or the prelude of an at-rule. */
const RULE_PRELUDE = /[^{};]+(?=\{)/g;
/** A CSS comment, which may hold braces and `#`. */
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
/** Ids of the areas that list the pieces captured by each player. */
const CAPTURE_AREA_IDS = ['black-captures', 'white-captures'];
/** The head of the page, in a template so that happy-dom does not try to load the stylesheet. */
const HEAD = document.createElement('template');
HEAD.innerHTML = INDEX_PAGE.match(/<head>([\s\S]*)<\/head>/)[1];
const SITE_URL = 'https://chess.issoufi.fr/';
/** Folder whose files Vite copies to the root of the site. */
const PUBLIC_DIR = fileURLToPath(import.meta.resolve('../app/public/'));
/** Size that social networks expect of a large preview image. */
const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };
/** JPEG start-of-frame markers (baseline and progressive), which hold the image size. */
const JPEG_FRAME_MARKERS = [0xc0, 0xc2];
/** Bytes of a JPEG marker and of its length field. */
const JPEG_MARKER_BYTES = 2;
/** Offsets of the height and the width in a start-of-frame segment, after the sample precision. */
const JPEG_FRAME_HEIGHT_OFFSET = 5;
const JPEG_FRAME_WIDTH_OFFSET = 7;
/** Bytes of a start-of-frame segment up to the end of its width. */
const JPEG_FRAME_SIZE_BYTES = 9;

/**
 * Returns the content of a meta tag of the page.
 *
 * @param {string} selector Attribute selector of the meta tag, such as `[property="og:url"]`.
 * @returns {string | undefined} Its content, or undefined when the page lacks it.
 */
function meta(selector) {
  return HEAD.content.querySelector(`meta${selector}`)?.getAttribute('content') ?? undefined;
}

/**
 * Turns a URL of the site into the file of `app/public/` that it serves.
 *
 * @param {string} href Absolute URL on the site, or path from its root.
 * @returns {string} The path of the file in `app/public/`.
 */
function publicFile(href) {
  return join(PUBLIC_DIR, new URL(href, SITE_URL).pathname);
}

/**
 * Reads the width and height of a JPEG image from its start-of-frame segment.
 *
 * @param {Buffer} bytes Content of the JPEG file.
 * @returns {{ width: number, height: number } | null} Its size, or null without a frame segment.
 */
function jpegSize(bytes) {
  let offset = JPEG_MARKER_BYTES;
  while (offset + JPEG_FRAME_SIZE_BYTES <= bytes.length) {
    const marker = bytes[offset + 1];
    if (JPEG_FRAME_MARKERS.includes(marker)) {
      return {
        height: bytes.readUInt16BE(offset + JPEG_FRAME_HEIGHT_OFFSET),
        width: bytes.readUInt16BE(offset + JPEG_FRAME_WIDTH_OFFSET),
      };
    }
    offset += JPEG_MARKER_BYTES + bytes.readUInt16BE(offset + JPEG_MARKER_BYTES);
  }
  return null;
}

/**
 * Lists the selectors of a stylesheet that target an id, by `#id` or by an attribute selector on
 * `id`, leaving out comments, declarations (such as `#fff` colors) and at-rule preludes.
 *
 * @param {string} css Content of the stylesheet.
 * @returns {string[]} Each id selector, once per occurrence.
 */
function idSelectors(css) {
  const preludes = css.replace(CSS_COMMENT, '').match(RULE_PRELUDE) ?? [];
  return preludes
    .filter((prelude) => !isAtRulePrelude(prelude))
    .flatMap((prelude) => prelude.replace(OTHER_ATTRIBUTE_SELECTOR, '').match(ID_SELECTOR) ?? []);
}

/**
 * Tells whether the text before a `{` opens an at-rule, such as `@media`, rather than a rule.
 *
 * @param {string} prelude Text before the `{`.
 * @returns {boolean} True for an at-rule prelude.
 */
function isAtRulePrelude(prelude) {
  return prelude.trim().startsWith('@');
}

describe('index.html head', () => {
  it('describes the game', () => {
    expect(meta('[name="description"]')).toMatch(/^Jeu d'échecs/);
  });

  it('drops the obsolete keywords tag', () => {
    expect(meta('[name="keywords"]')).toBeUndefined();
  });

  it('names the domain as the canonical URL', () => {
    expect(HEAD.content.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(SITE_URL);
  });

  it('links an SVG favicon that the build publishes', () => {
    const icon = HEAD.content.querySelector('link[rel="icon"]');

    expect(icon.getAttribute('type')).toBe('image/svg+xml');
    expect(existsSync(publicFile(icon.getAttribute('href')))).toBe(true);
  });

  it('gives social networks a title, a description and the page URL', () => {
    expect(meta('[property="og:title"]')).toBe(HEAD.content.querySelector('title').textContent);
    expect(meta('[property="og:description"]')).toBe(meta('[name="description"]'));
    expect(meta('[property="og:url"]')).toBe(SITE_URL);
    expect(meta('[name="twitter:card"]')).toBe('summary_large_image');
  });

  it('shows a 1200x630 preview image, at an absolute URL of the site', () => {
    const imageUrl = meta('[property="og:image"]');
    const image = readFileSync(publicFile(imageUrl));

    expect(imageUrl.startsWith(SITE_URL)).toBe(true);
    expect(jpegSize(image)).toEqual(SOCIAL_IMAGE_SIZE);
    expect(Number(meta('[property="og:image:width"]'))).toBe(SOCIAL_IMAGE_SIZE.width);
    expect(Number(meta('[property="og:image:height"]'))).toBe(SOCIAL_IMAGE_SIZE.height);
    expect(meta('[property="og:image:alt"]')).toBeTruthy();
  });
});

describe('style.css on index.html', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE_BODY;
    const style = document.createElement('style');
    style.textContent = STYLESHEET;
    document.head.append(style);
  });

  afterEach(() => {
    document.head.querySelector('style').remove();
    document.body.innerHTML = '';
  });

  it('only targets ids that the page has', () => {
    const selectors = idSelectors(STYLESHEET);

    expect(selectors).not.toHaveLength(0);
    for (const selector of selectors) {
      expect(document.querySelector(selector), selector).not.toBeNull();
    }
  });

  it('lays out the captured pieces of both players in a grid', () => {
    for (const id of CAPTURE_AREA_IDS) {
      expect(getComputedStyle(document.getElementById(id)).display, id).toBe('grid');
    }
  });
});

describe('idSelectors', () => {
  it('finds id selectors and attribute selectors on the id, in selector lists', () => {
    expect(idSelectors("#a,\n.b #c:hover, [id*='d'] {}")).toEqual(['#a', '#c', "[id*='d']"]);
  });

  it('finds the selectors of the rules nested in an at-rule', () => {
    expect(idSelectors('@media (hover: hover) { #a { color: red; } }')).toEqual(['#a']);
  });

  it('ignores hex colors, comments and class selectors', () => {
    const css = '/* #comment { } */ .a { color: #fff; background: #000 }\n.b { fill: #ffffff70 }';

    expect(idSelectors(css)).toEqual([]);
  });

  it('ignores a # in the value of another attribute selector', () => {
    expect(idSelectors("a[href='#top'], [data-id='#x'], [idx='#y'] {}")).toEqual([]);
  });

  it('returns no selector for an empty stylesheet', () => {
    expect(idSelectors('')).toEqual([]);
  });
});

describe('jpegSize', () => {
  it('returns null for a file without a frame segment', () => {
    expect(jpegSize(Buffer.from([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
  });

  it('returns null for an empty file', () => {
    expect(jpegSize(Buffer.alloc(0))).toBeNull();
  });
});
