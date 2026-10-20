// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showCopyrightYear } from '../app/js/copyright/show-copyright-year.js';

const YEAR_IN_HTML = '2026';
/** A date of another year than the HTML's, so that a test fails when nothing is written. */
const FUTURE_DATE = new Date(2031, 0, 1);

/** @returns {string} The text of the footer's copyright year. */
function shownYear() {
  return document.querySelector('.copyright__year').textContent;
}

beforeEach(() => {
  document.body.innerHTML = `<p class="copyright">© 2018-<span class="copyright__year">${YEAR_IN_HTML}</span></p>`;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('showCopyrightYear', () => {
  it('writes the year of the given date', () => {
    showCopyrightYear({ today: FUTURE_DATE });

    expect(shownYear()).toBe('2031');
  });

  it('writes the current year by default', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FUTURE_DATE);

    showCopyrightYear();

    expect(shownYear()).toBe('2031');
  });

  it('only looks inside the given root', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span class="copyright__year">2018</span>';

    showCopyrightYear({ root, today: FUTURE_DATE });

    expect(root.textContent).toBe('2031');
    expect(shownYear()).toBe(YEAR_IN_HTML);
  });

  it.each([
    ['an invalid date', new Date('not a date')],
    ['a timestamp instead of a Date', FUTURE_DATE.getTime()],
    ['a null date', null],
  ])('keeps the year of the HTML for %s', (_label, today) => {
    showCopyrightYear({ today });

    expect(shownYear()).toBe(YEAR_IN_HTML);
  });

  it('keeps the year of the HTML for a null root', () => {
    showCopyrightYear({ root: null, today: FUTURE_DATE });

    expect(shownYear()).toBe(YEAR_IN_HTML);
  });

  it('does nothing when the page has no copyright year', () => {
    document.body.innerHTML = '<p class="copyright">© 2018</p>';

    showCopyrightYear({ today: FUTURE_DATE });

    expect(document.body.textContent).toBe('© 2018');
  });
});
