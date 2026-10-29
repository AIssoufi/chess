// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach } from 'vitest';

const INDEX_PAGE = readFileSync(fileURLToPath(import.meta.resolve('../app/index.html')), 'utf8');
/** The body of the page without its scripts, which happy-dom would otherwise try to load. */
const PAGE_TEMPLATE = document.createElement('template');
PAGE_TEMPLATE.innerHTML = INDEX_PAGE.match(/<body>([\s\S]*)<\/body>/)[1];
PAGE_TEMPLATE.content.querySelectorAll('script').forEach((script) => script.remove());
const PAGE_BODY = PAGE_TEMPLATE.innerHTML;
const BOARD_SQUARE_COUNT = 64;
const BOARD_ROW_COUNT = 8;
/** The square that takes the focus first, from the Tab key: the king's pawn of white. */
const FIRST_FOCUSED_SQUARE = 'e2';
const PROMOTION_LABELS = ['Dame', 'Tour', 'Fou', 'Cavalier'];

beforeEach(() => {
  document.body.innerHTML = PAGE_BODY;
});

describe('landmarks of the page', () => {
  it('holds the game in a main landmark that keeps its class', () => {
    const main = document.querySelectorAll('main');

    expect(main).toHaveLength(1);
    expect(main[0].classList.contains('main__wrapper')).toBe(true);
    expect(main[0].querySelector('.container-squares')).not.toBeNull();
  });

  it('holds the copyright and the social links in a footer outside the main landmark', () => {
    const footer = document.querySelectorAll('footer');

    expect(footer).toHaveLength(1);
    expect(footer[0].querySelector('.copyright')).not.toBeNull();
    expect(footer[0].querySelector('.social-links')).not.toBeNull();
    expect(footer[0].closest('main')).toBeNull();
  });

  it('names the MIT license in the copyright with a link to it', () => {
    const copyright = document.querySelector('footer .copyright');
    const licenseLink = [...copyright.querySelectorAll('a')].find(
      (link) => link.textContent === 'MIT'
    );

    expect(copyright.textContent).toMatch(/code sous licence\s+MIT/);
    expect(copyright.textContent).not.toMatch(/droits réservés/);
    expect(licenseLink?.getAttribute('href')).toBe(
      'https://github.com/AIssoufi/chess/blob/master/LICENSE'
    );
  });

  it('glues the separator to the author so a wrapped license line never starts with it', () => {
    const copyright = document.querySelector('footer .copyright');
    const author = copyright.querySelector('a[href="https://www.issoufi.fr"]');
    const license = copyright.querySelector('.copyright__license');

    expect(author.nextSibling.textContent).toMatch(/^\u00a0·\s+$/);
    expect(license.textContent).toMatch(/^code sous licence\s+MIT$/);
  });
});

describe('board of the page', () => {
  it('is a named grid of eight rows', () => {
    const grid = document.querySelector('.container-squares');

    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.getAttribute('aria-label')).toBe('Échiquier');
    expect(grid.querySelectorAll(':scope > [role="row"]')).toHaveLength(BOARD_ROW_COUNT);
  });

  it('makes each square a button cell of the grid', () => {
    const squares = [...document.querySelectorAll('.square')];

    expect(squares).toHaveLength(BOARD_SQUARE_COUNT);
    expect(squares.every((square) => square.tagName === 'BUTTON')).toBe(true);
    expect(squares.every((square) => square.getAttribute('role') === 'gridcell')).toBe(true);
  });

  it('lets the Tab key reach a single square of the board', () => {
    const tabbable = document.querySelectorAll('.square[tabindex="0"]');

    expect(tabbable).toHaveLength(1);
    expect(tabbable[0].dataset.position).toBe(FIRST_FOCUSED_SQUARE);
    expect(document.querySelectorAll('.square[tabindex="-1"]')).toHaveLength(
      BOARD_SQUARE_COUNT - 1
    );
  });

  it('hides the file and rank letters, which the names of the squares already hold', () => {
    expect(document.querySelector('.container-files').getAttribute('aria-hidden')).toBe('true');
    expect(document.querySelector('.container-ranks').getAttribute('aria-hidden')).toBe('true');
  });
});

describe('announcements and names of the page', () => {
  it('has a status region, hidden from sight, inside the main landmark', () => {
    const status = document.querySelectorAll('[role="status"]');

    expect(status).toHaveLength(1);
    expect(status[0].classList.contains('game-status')).toBe(true);
    expect(status[0].classList.contains('visually-hidden')).toBe(true);
    expect(status[0].closest('main')).not.toBeNull();
  });

  it('names the move list by its title, inside the main landmark, without announcing it', () => {
    const section = document.querySelector('.move-list');
    const list = section.querySelector('.move-list__moves');
    const title = document.getElementById(section.getAttribute('aria-labelledby'));

    expect(title?.tagName).toBe('H2');
    expect(title.textContent).toBe('Coups');
    expect(list.tagName).toBe('OL');
    expect(list.getAttribute('aria-labelledby')).toBe(title.id);
    expect(section.closest('main')).not.toBeNull();
    expect(section.querySelector('[aria-live]')).toBeNull();
    expect(section.hasAttribute('aria-live')).toBe(false);
  });

  it('lets the keyboard reach the move list, so that it scrolls without a mouse', () => {
    expect(document.querySelector('.move-list__moves').tabIndex).toBe(0);
  });

  it('names the promotion dialog by its title', () => {
    const dialog = document.querySelector('.promotion__wrapper');
    const titleId = dialog.getAttribute('aria-labelledby');

    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(titleId).not.toBe('');
    expect(document.getElementById(titleId)?.closest('.promotion__wrapper')).toBe(dialog);
  });

  it('names each promotion button in French', () => {
    const buttons = [...document.querySelectorAll('.promotion__pieces button')];

    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(PROMOTION_LABELS);
  });

  it('names each social link and hides its icon', () => {
    const links = [...document.querySelectorAll('footer .social-links a')];

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute('aria-label')).toMatch(/\S/);
      expect(link.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    }
  });
});
