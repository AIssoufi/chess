// @vitest-environment happy-dom
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const INDEX_PAGE = readFileSync(fileURLToPath(import.meta.resolve('../app/index.html')), 'utf8');
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

describe('jpegSize', () => {
  it('returns null for a file without a frame segment', () => {
    expect(jpegSize(Buffer.from([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
  });

  it('returns null for an empty file', () => {
    expect(jpegSize(Buffer.alloc(0))).toBeNull();
  });
});
