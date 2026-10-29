import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const STYLE = readFileSync(fileURLToPath(import.meta.resolve('../app/css/style.css')), 'utf8');
const REDUCED_MOTION_QUERY = '@media (prefers-reduced-motion: reduce)';
const MOTION_PROPERTIES = ['animation', 'transition'];
/** The longest a blinking may last, by WCAG 2.2.2 (Pause, Stop, Hide). */
const MAX_ANIMATION_DURATION_MS = 5000;
const MS_PER_SECOND = 1000;
/** A CSS time, such as `0.5s` or `500ms`, with its amount and its unit. */
const TIME_PATTERN = /^(\d*\.?\d+)(ms|s)$/;
/** A bare iteration count, such as `6` or `2.5`. */
const ITERATION_COUNT_PATTERN = /^\d+(\.\d+)?$/;
/** The longest blinking allowed, in seconds, as the test titles show it. */
const MAX_ANIMATION_DURATION_S = MAX_ANIMATION_DURATION_MS / MS_PER_SECOND;

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

const ANIMATIONS = RULES.filter((rule) => !isKeyframe(rule))
  .filter((rule) => rule.atRule !== REDUCED_MOTION_QUERY)
  .flatMap(({ selectors, declarations }) =>
    declarations.has('animation')
      ? selectors.map((selector) => ({ selector, value: declarations.get('animation') }))
      : []
  );

/**
 * Returns the value that the rules outside any at-rule give to a property of a selector.
 *
 * @param {object} params
 * @param {string} params.selector The selector, such as `.square.check`.
 * @param {string} params.property The property, such as `outline`.
 * @returns {string | undefined} The value, or `undefined` when no rule sets it.
 */
function getStaticValue({ selector, property }) {
  const rule = RULES.filter((candidate) => candidate.atRule === null).findLast((candidate) =>
    setsProperty({ rule: candidate, selector, property })
  );
  return rule?.declarations.get(property);
}

/**
 * Returns how long an `animation` shorthand runs, its delay and all its iterations included.
 *
 * @param {string} value The shorthand, such as `blink 0.5s linear 6 alternate`.
 * @returns {number} The duration in milliseconds, `Infinity` for an endless animation.
 */
function getAnimationDurationMs(value) {
  const words = value.split(/\s+/);
  if (words.includes('infinite')) return Infinity;
  const [durationMs = 0, delayMs = 0] = words
    .map((word) => word.match(TIME_PATTERN))
    .filter(Boolean)
    .map(([, amount, unit]) => Number(amount) * (unit === 's' ? MS_PER_SECOND : 1));
  const iterations = Number(words.find((word) => ITERATION_COUNT_PATTERN.test(word)) ?? 1);
  return delayMs + durationMs * iterations;
}

describe('motion of the page', () => {
  it('finds the animations and transitions of the page', () => {
    expect(MOVING_SELECTORS).toEqual(
      expect.arrayContaining([
        { selector: '.current-player h2', property: 'animation' },
        { selector: '.promotion__pieces button', property: 'transition' },
      ])
    );
  });

  it('keeps the possible moves still, their dot or ring showing them without blinking', () => {
    const movingSelectors = MOVING_SELECTORS.map(({ selector }) => selector);

    expect(movingSelectors).not.toContain('.square.possible-move');
  });

  it.each(MOVING_SELECTORS)('stops the $property of $selector with reduced motion', (moving) => {
    expect(getReducedMotionValue(moving)).toBe('none');
  });

  it.each(ANIMATIONS)(
    `ends the animation of $selector within ${MAX_ANIMATION_DURATION_S}s`,
    ({ value }) => {
      expect(getAnimationDurationMs(value)).toBeLessThanOrEqual(MAX_ANIMATION_DURATION_MS);
    }
  );

  it('keeps a static background on the side to play, outside its blinking', () => {
    expect(getStaticValue({ selector: '.current-player h2', property: 'background-color' })).toBe(
      'rgba(139, 195, 74, 0.5)'
    );
  });
});

describe('getAnimationDurationMs', () => {
  it.each([
    ['blink 0.5s linear 6 alternate', 3000],
    ['blink 500ms linear 1s 2', 2000],
    ['blink 1s', 1000],
  ])('counts %s as %i ms', (value, durationMs) => {
    expect(getAnimationDurationMs(value)).toBe(durationMs);
  });

  it('counts an endless animation as never ending', () => {
    expect(getAnimationDurationMs('blink 0.5s linear 1s infinite alternate')).toBe(Infinity);
  });

  it('counts an animation without duration as instant', () => {
    expect(getAnimationDurationMs('none')).toBe(0);
  });
});

describe('cues that need no color', () => {
  it('rings the name of the side to play with a solid line', () => {
    expect(getStaticValue({ selector: '.current-player h2', property: 'outline' })).toMatch(
      /^\d+px solid /
    );
  });

  it('keeps a line for the turn label in both panels, so that nothing moves', () => {
    const turnSelector = '.control .control__turn';
    const lineHeight = getStaticValue({ selector: turnSelector, property: 'line-height' });

    expect(lineHeight).toBe('1.5em');
    expect(getStaticValue({ selector: turnSelector, property: 'min-height' })).toBe(lineHeight);
  });

  it('stripes the square of a king in check', () => {
    expect(getStaticValue({ selector: '.square.check', property: 'background-image' })).toMatch(
      /^repeating-linear-gradient\(/
    );
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
