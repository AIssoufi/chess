// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { COLOR_LABELS } from '../app/js/colors/constants.js';
import { DRAW_REASON_LABELS } from '../app/js/draws/constants.js';
import {
  CHECK_LABEL,
  EMPTY_SQUARE_LABEL,
  PIECE_LABELS,
  PIECE_TYPE_LABELS,
  POSSIBLE_MOVE_LABEL,
} from '../app/js/labels/constants.js';
import { SPECIAL_MOVE_LABELS } from '../app/js/moves/constants.js';
import { SIDE_LABELS, STATUS_TEXTS } from '../app/js/status/constants.js';

const INDEX_PAGE = readFileSync(fileURLToPath(import.meta.resolve('../app/index.html')), 'utf8');
/**
 * A plain space, tab or line break before a French high punctuation sign. `\s` would also match
 * the non-breaking space that French typography wants there.
 */
const PLAIN_SPACE_BEFORE_SIGN = /[ \t\r\n][:!?]/g;
/** The head and the body of a page, attributes of their tags allowed, in their first group. */
const HEAD_PATTERN = /<head\b[^>]*>([\s\S]*)<\/head>/;
const BODY_PATTERN = /<body\b[^>]*>([\s\S]*)<\/body>/;
/** French texts of the scripts that reach the page or a screen reader. */
const SCRIPT_TEXTS = [
  ...Object.values(STATUS_TEXTS),
  ...Object.values(SIDE_LABELS),
  ...Object.values(COLOR_LABELS),
  ...Object.values(DRAW_REASON_LABELS),
  ...Object.values(SPECIAL_MOVE_LABELS),
  ...Object.values(PIECE_LABELS).flatMap(Object.values),
  ...Object.values(PIECE_TYPE_LABELS),
  CHECK_LABEL,
  EMPTY_SQUARE_LABEL,
  POSSIBLE_MOVE_LABEL,
];
/** Characters kept on each side of a plain space, so that a failure shows where it is. */
const CONTEXT_CHARACTERS = 12;
/** Elements whose text the page never shows. */
const HIDDEN_ELEMENTS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE']);
/** Attributes whose value a player sees or hears, unlike URLs, ids and classes. */
const SHOWN_ATTRIBUTES = ['alt', 'aria-label', 'title', 'placeholder'];
/** Meta tags whose content search engines and social networks show. */
const SHOWN_META_SELECTOR =
  'meta[name="description"], meta[property="og:title"], ' +
  'meta[property="og:description"], meta[property="og:image:alt"]';

/**
 * Finds each plain space before `:`, `!` or `?`, which French typography wants non-breaking.
 *
 * @param {unknown} text Text shown to the players.
 * @returns {string[]} The text around each plain space, or an empty list for a non-string.
 */
function findPlainSpacesBeforeSigns(text) {
  if (typeof text !== 'string') return [];
  return [...text.matchAll(PLAIN_SPACE_BEFORE_SIGN)].map(({ index }) =>
    text.slice(Math.max(0, index - CONTEXT_CHARACTERS), index + CONTEXT_CHARACTERS)
  );
}

/**
 * Parses an HTML fragment in a template, so that happy-dom neither loads nor runs anything.
 *
 * @param {string} html HTML to parse.
 * @returns {DocumentFragment} Its content.
 */
function parse(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

/**
 * Lists the texts of an HTML page that players see: its text nodes outside scripts and styles,
 * its shown attributes and its shown meta tags, never a URL.
 *
 * @param {string} html The whole page.
 * @returns {string[]} The texts, with their character references decoded.
 */
function getShownTexts(html) {
  const head = parse(html.match(HEAD_PATTERN)?.[1] ?? '');
  const body = parse(html.match(BODY_PATTERN)?.[1] ?? '');
  const texts = [];
  for (const fragment of [head, body]) {
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const isHidden = HIDDEN_ELEMENTS.has(walker.currentNode.parentElement?.tagName);
      if (!isHidden) texts.push(walker.currentNode.data);
    }
    for (const attribute of SHOWN_ATTRIBUTES) {
      for (const node of fragment.querySelectorAll(`[${attribute}]`)) {
        texts.push(node.getAttribute(attribute));
      }
    }
  }
  for (const node of head.querySelectorAll(SHOWN_META_SELECTOR)) {
    texts.push(node.getAttribute('content'));
  }
  return texts;
}

describe('findPlainSpacesBeforeSigns', () => {
  it.each([':', '!', '?'])('finds a plain space before "%s"', (sign) => {
    expect(findPlainSpacesBeforeSigns(`Rejouer ${sign}`)).toEqual([`Rejouer ${sign}`]);
  });

  it('finds a tab or a line break before a sign', () => {
    expect(findPlainSpacesBeforeSigns('Pat\t!')).toHaveLength(1);
    expect(findPlainSpacesBeforeSigns('Pat\n!')).toHaveLength(1);
  });

  it('accepts a non-breaking space before each sign', () => {
    expect(findPlainSpacesBeforeSigns('Pat\u00a0! Rejouer\u00a0? Match nul\u00a0: oui')).toEqual(
      []
    );
  });

  it('finds every plain space, with the text around it', () => {
    expect(findPlainSpacesBeforeSigns('Une phrase un peu longue : fin ! encore')).toEqual([
      'n peu longue : fin ! enc',
      'longue : fin ! encore',
    ]);
  });

  it('accepts a sign without a space before it, such as in a URL', () => {
    expect(findPlainSpacesBeforeSigns('https://chess.issoufi.fr/?a=1#x:y')).toEqual([]);
  });

  it.each([[''], [undefined], [null], [42]])('returns an empty list for %j', (text) => {
    expect(findPlainSpacesBeforeSigns(text)).toEqual([]);
  });
});

describe('getShownTexts', () => {
  const page = ({ body = '', head = '' } = {}) =>
    `<html><head>${head}</head><body>${body}</body></html>`;

  it('decodes the non-breaking space of the page', () => {
    expect(getShownTexts(page({ body: '<p>Pat&nbsp;!</p>' }))).toEqual(['Pat\u00a0!']);
  });

  it('keeps the shown attributes and meta tags', () => {
    const texts = getShownTexts(
      page({
        body: '<button aria-label="Dame ?">♛</button>',
        head: '<meta name="description" content="Jeu : échecs" />',
      })
    );

    expect(texts).toEqual(expect.arrayContaining(['Dame ?', 'Jeu : échecs']));
  });

  it('leaves out URLs, scripts, styles and meta tags that are not shown', () => {
    const texts = getShownTexts(
      page({
        body: '<a href="/?a=1 !">x</a><script>a ? b : c</script><style>a :hover {}</style>',
        head: '<meta property="og:url" content="https://x.fr/?q= :" />',
      })
    );

    expect(texts).toEqual(['x']);
  });

  it('reads a head and a body whose tags have attributes', () => {
    const html = '<head lang="fr"><title>Jeu ?</title></head><body class="x"><p>Pat !</p></body>';

    expect(getShownTexts(html)).toEqual(['Jeu ?', 'Pat !']);
  });

  it('returns an empty list for a page without head or body', () => {
    expect(getShownTexts('')).toEqual([]);
  });
});

describe('French punctuation', () => {
  it('reads the texts of the end-of-game dialogs and the promotion prompt', () => {
    expect(getShownTexts(INDEX_PAGE)).toEqual(
      expect.arrayContaining(['Rejouer\u00a0!', 'Promouvoir le pion en\u00a0:'])
    );
  });

  it('puts a non-breaking space before each high sign of the page', () => {
    expect(getShownTexts(INDEX_PAGE).flatMap(findPlainSpacesBeforeSigns)).toEqual([]);
  });

  it('puts a non-breaking space before each high sign of the script texts', () => {
    expect(SCRIPT_TEXTS.flatMap(findPlainSpacesBeforeSigns)).toEqual([]);
  });
});
