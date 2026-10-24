import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const STYLE = readFileSync(fileURLToPath(import.meta.resolve('../app/css/style.css')), 'utf8');
const REDUCED_MOTION_QUERY = '@media (prefers-reduced-motion: reduce)';
const MOTION_PROPERTIES = ['animation', 'transition'];

/**
 * Splits a stylesheet into its rules, keeping the at-rule that holds each one, if any.
 *
 * @param {string} css The stylesheet.
 * @returns {{ atRule: string | null, selectors: string[], declarations: Map<string, string> }[]}
 *   The rules, keyframes included.
 */
function parseRules(css) {
  const rules = [];
  const atRules = [];
  let text = '';
  for (const character of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (character === '{') {
      const prelude = text.trim();
      text = '';
      if (prelude.startsWith('@')) atRules.push(prelude);
      else rules.push({ atRule: atRules.at(-1) ?? null, prelude, body: null });
    } else if (character === '}') {
      const rule = rules.at(-1);
      if (rule && rule.body === null) rule.body = text;
      else atRules.pop();
      text = '';
    } else {
      text += character;
    }
  }
  return rules.map(({ atRule, prelude, body }) => ({
    atRule,
    selectors: prelude.split(',').map((selector) => selector.trim()),
    declarations: new Map(
      body
        .split(';')
        .map((declaration) => declaration.split(':').map((part) => part.trim()))
        .filter(([property, value]) => property && value)
    ),
  }));
}

const RULES = parseRules(STYLE);
const REDUCED_MOTION_RULES = RULES.filter((rule) => rule.atRule === REDUCED_MOTION_QUERY);

/**
 * Tells whether a rule is a step of a `@keyframes` block, such as `from`.
 *
 * @param {{ atRule: string | null }} rule The rule.
 * @returns {boolean} `true` inside a `@keyframes` block.
 */
function isKeyframe(rule) {
  return rule.atRule?.startsWith('@keyframes') ?? false;
}

/**
 * Tells whether a rule sets a property of a selector.
 *
 * @param {object} params
 * @param {{ selectors: string[], declarations: Map<string, string> }} params.rule The rule.
 * @param {string} params.selector The selector, such as `.square.check`.
 * @param {string} params.property The property, such as `animation`.
 * @returns {boolean} `true` when the rule lists the selector and declares the property.
 */
function setsProperty({ rule, selector, property }) {
  const hasSelector = rule.selectors.includes(selector);
  return hasSelector && rule.declarations.has(property);
}

/**
 * Returns the value that the reduced motion rules give to a property of a selector.
 *
 * @param {object} params
 * @param {string} params.selector The selector, such as `.square.check`.
 * @param {string} params.property The property, such as `animation`.
 * @returns {string | undefined} The value, or `undefined` when no rule sets it.
 */
function getReducedMotionValue({ selector, property }) {
  const rule = REDUCED_MOTION_RULES.findLast((candidate) =>
    setsProperty({ rule: candidate, selector, property })
  );
  return rule?.declarations.get(property);
}

const MOVING_SELECTORS = RULES.filter((rule) => !isKeyframe(rule))
  .filter((rule) => rule.atRule !== REDUCED_MOTION_QUERY)
  .flatMap(({ selectors, declarations }) =>
    MOTION_PROPERTIES.filter((property) => declarations.has(property)).flatMap((property) =>
      selectors.map((selector) => ({ selector, property }))
    )
  );

describe('motion of the page', () => {
  it('finds the animations and transitions of the page', () => {
    expect(MOVING_SELECTORS).toEqual(
      expect.arrayContaining([
        { selector: '.square.possible-move', property: 'animation' },
        { selector: '.square.check', property: 'animation' },
        { selector: '.current-player h2', property: 'animation' },
        { selector: '.promotion__pieces button', property: 'transition' },
      ])
    );
  });

  it.each(MOVING_SELECTORS)('stops the $property of $selector with reduced motion', (moving) => {
    expect(getReducedMotionValue(moving)).toBe('none');
  });

  it('keeps the first background of the side to play once its blinking stops', () => {
    expect(
      getReducedMotionValue({ selector: '.current-player h2', property: 'background-color' })
    ).toBe('rgba(139, 195, 74, 0.5)');
  });
});

describe('focus of the squares', () => {
  it('rings the square focused by the keyboard only', () => {
    const focusRules = RULES.filter(({ selectors }) => selectors.includes('.square:focus-visible'));
    const plainFocusRules = RULES.filter(({ selectors }) => selectors.includes('.square:focus'));

    expect(focusRules).toHaveLength(1);
    expect(focusRules[0].declarations.get('outline')).toMatch(/^\d+px solid /);
    expect(plainFocusRules).toHaveLength(0);
  });
});
