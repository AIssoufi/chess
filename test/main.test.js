// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GAME_OVER_DIALOG_DELAY_MS } from '../app/js/game-over/constants.js';
import pion from '../app/js/pieces/pion.js';
import cavalier from '../app/js/pieces/cavalier.js';

const INDEX_PAGE = readFileSync(fileURLToPath(import.meta.resolve('../app/index.html')), 'utf8');
const PAGE_BODY = INDEX_PAGE.match(/<body>([\s\S]*)<\/body>/)[1];
const FOOLS_MATE = [
  ['f2', 'f3'],
  ['e7', 'e5'],
  ['g2', 'g4'],
  ['d8', 'h4'],
];
/** 1. h4 g5 2. hxg5 Nf6 3. gxf6 a6 4. fxe7 a5: the white pawn on e7 can take d8 and promote. */
const MOVES_BEFORE_PROMOTION = [
  ['h2', 'h4'],
  ['g7', 'g5'],
  ['h4', 'g5'],
  ['g8', 'f6'],
  ['g5', 'f6'],
  ['a7', 'a6'],
  ['f6', 'e7'],
  ['a6', 'a5'],
];
/** Sam Loyd's ten-move stalemate: after 10. Qe6, black has no legal move and is not in check. */
const LOYD_STALEMATE = [
  ['e2', 'e3'],
  ['a7', 'a5'],
  ['d1', 'h5'],
  ['a8', 'a6'],
  ['h5', 'a5'],
  ['h7', 'h5'],
  ['h2', 'h4'],
  ['a6', 'h6'],
  ['a5', 'c7'],
  ['f7', 'f6'],
  ['c7', 'd7'],
  ['e8', 'f7'],
  ['d7', 'b7'],
  ['d8', 'd3'],
  ['b7', 'b8'],
  ['d3', 'h7'],
  ['b8', 'c8'],
  ['f7', 'g6'],
  ['c8', 'e6'],
];

const originalConsoleLog = console.log;

/**
 * Returns the square of the board at a position.
 *
 * @param {string} position Algebraic position, such as `'e4'`.
 * @returns {HTMLElement | null} The `.case` element.
 */
function square(position) {
  return document.querySelector(`.case[data-position="${position}"]`);
}

/**
 * Returns the piece shown on a square.
 *
 * @param {string} position Algebraic position.
 * @returns {{ type: string, couleur: string } | null} The piece's dataset, or null on an empty
 *   square.
 */
function pieceOn(position) {
  const node = square(position).querySelector('.piece');
  return node ? { type: node.dataset.type, couleur: node.dataset.couleur } : null;
}

/**
 * Lists the positions of the squares that carry a class.
 *
 * @param {string} className Class of the squares, such as `'chemin'`.
 * @returns {string[]} Their positions, sorted.
 */
function squaresWithClass(className) {
  return [...document.querySelectorAll(`.case.${className}`)]
    .map((node) => node.dataset.position)
    .sort();
}

/** @returns {string | undefined} The color whose control panel is marked as the current player. */
function currentPlayer() {
  return document.querySelector('.control.joueur-courant')?.dataset.couleur;
}

/**
 * Plays moves by clicking their start square, then their target square.
 *
 * @param {string[][]} moves Pairs of `[from, to]` positions.
 */
function play(moves) {
  for (const [from, to] of moves) {
    square(from).click();
    square(to).click();
  }
}

/**
 * Renders the body of index.html, then runs a fresh copy of main.js on it.
 *
 * @param {object} [params]
 * @param {() => Promise<void>} [params.beforeMain] Runs after the module reset and before main.js,
 *   to change the fresh modules that main.js imports.
 */
async function loadPage({ beforeMain } = {}) {
  // A template keeps its content inert: happy-dom neither loads the stylesheet nor runs main.js.
  const template = document.createElement('template');
  template.innerHTML = PAGE_BODY;
  template.content.querySelectorAll('script').forEach((script) => script.remove());
  document.body.replaceChildren(template.content);
  // main.js copies every log into the page and prints it: keep the test output quiet.
  console.log = vi.fn();
  vi.resetModules();
  await beforeMain?.();
  await import('../app/js/main.js');
}

beforeEach(() => loadPage());

afterEach(() => {
  console.log = originalConsoleLog;
  vi.useRealTimers();
});

describe('main.js start', () => {
  it('renders the 32 pieces and gives the move to white', () => {
    expect(document.querySelectorAll('.container-piece .piece')).toHaveLength(32);
    expect(pieceOn('e1')).toEqual({ type: 'roi', couleur: 'blanche' });
    expect(pieceOn('d8')).toEqual({ type: 'dame', couleur: 'noire' });
    expect(currentPlayer()).toBe('blanche');
  });

  it('skips an unknown piece and still renders the rest of the board and the captures', async () => {
    await loadPage({
      beforeMain: async () => {
        const { default: Echiquier } = await import('../app/js/Echiquier.js');
        const initialiser = Echiquier.prototype.initialiser;
        vi.spyOn(Echiquier.prototype, 'initialiser').mockImplementation(function () {
          initialiser.call(this);
          this.plateau.set('e4', { type: 'licorne', couleur: 'blanche', aBouge: false });
          this.plateau.set('d4', { type: 'pion', couleur: 'rouge', aBouge: false });
          this.captures.blanche.push({ type: 'licorne', couleur: 'noire' });
          this.captures.blanche.push({ type: 'pion', couleur: 'noire' });
        });
      },
    });

    expect(pieceOn('e4')).toBeNull();
    expect(pieceOn('d4')).toBeNull();
    expect(document.querySelectorAll('.container-piece .piece')).toHaveLength(32);
    expect(document.getElementById('blanche-prisoniers').children).toHaveLength(1);
    expect(document.getElementById('blanche-prisoniers').firstElementChild.dataset.type).toBe(
      'pion'
    );
    expect(document.body.textContent).not.toContain('undefined');
  });

  it('ends the copyright range of the footer with the current year', async () => {
    // A year other than the one written in index.html, so that the test fails without main.js.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2031, 0, 1));
    await loadPage();

    expect(document.querySelector('.copyright__year').textContent).toBe('2031');
  });
});

describe('main.js selection and moves', () => {
  it('highlights the selected piece and its moves', () => {
    square('e2').click();

    expect(squaresWithClass('selectionner')).toEqual(['e2']);
    expect(squaresWithClass('chemin')).toEqual(['e3', 'e4']);
  });

  it('moves the selected piece to a highlighted square and passes the move', () => {
    play([['e2', 'e4']]);

    expect(pieceOn('e4')).toEqual({ type: 'pion', couleur: 'blanche' });
    expect(pieceOn('e2')).toBeNull();
    expect(squaresWithClass('selectionner')).toEqual([]);
    expect(squaresWithClass('chemin')).toEqual([]);
    expect(currentPlayer()).toBe('noire');
  });

  it('switches the selection to another piece of the same color', () => {
    square('e2').click();
    square('g1').click();

    expect(squaresWithClass('selectionner')).toEqual(['g1']);
    expect(squaresWithClass('chemin')).toEqual(['f3', 'h3']);
  });

  it('clears the selection on a click outside the highlighted squares, without moving', () => {
    square('e2').click();
    square('e5').click();

    expect(pieceOn('e2')).toEqual({ type: 'pion', couleur: 'blanche' });
    expect(pieceOn('e5')).toBeNull();
    expect(squaresWithClass('selectionner')).toEqual([]);
    expect(squaresWithClass('chemin')).toEqual([]);
    expect(currentPlayer()).toBe('blanche');
  });

  it('ignores a click on a piece of the side not to move', () => {
    square('e7').click();

    expect(squaresWithClass('selectionner')).toEqual([]);
    expect(squaresWithClass('chemin')).toEqual([]);
    expect(currentPlayer()).toBe('blanche');
  });

  it('ignores a click on an empty square without a selection', () => {
    square('e4').click();

    expect(squaresWithClass('selectionner')).toEqual([]);
    expect(currentPlayer()).toBe('blanche');
  });

  it('does not select a piece without legal moves', () => {
    square('a1').click();

    expect(squaresWithClass('selectionner')).toEqual([]);
    expect(squaresWithClass('chemin')).toEqual([]);
  });

  it('ignores a click outside the squares', () => {
    document.querySelector('.container-piece .row').click();

    expect(squaresWithClass('selectionner')).toEqual([]);
  });

  it('shows the captured pieces next to the capturing side', () => {
    play([
      ['e2', 'e4'],
      ['d7', 'd5'],
      ['e4', 'd5'],
    ]);

    expect(document.getElementById('blanche-nb-prisonier').textContent).toBe('1');
    const prisoner = document.querySelector('#blanche-prisoniers .piece');
    expect(prisoner.dataset).toMatchObject({ type: 'pion', couleur: 'noire' });
  });

  it('marks the king in check, then clears the mark once the check is parried', () => {
    play([
      ['e2', 'e4'],
      ['f7', 'f5'],
      ['d1', 'h5'],
    ]);

    expect(squaresWithClass('echec')).toEqual(['e8']);

    play([['g7', 'g6']]);
    expect(squaresWithClass('echec')).toEqual([]);
  });
});

describe('main.js promotion', () => {
  const promotionModal = () => document.querySelector('.promotion__wrapper');

  beforeEach(() => {
    play(MOVES_BEFORE_PROMOTION);
    play([['e7', 'd8']]);
  });

  it('opens the promotion choice with the symbols of the promoting color', () => {
    expect(promotionModal().style.display).toBe('flex');
    const button = promotionModal().querySelector('[data-type="cavalier"]');
    expect(button.textContent).toBe(cavalier.pièce.blanche);
    expect(pieceOn('d8')).toEqual({ type: 'pion', couleur: 'blanche' });
    expect(currentPlayer()).toBe('blanche');
  });

  it('ignores clicks on the board while the choice is open', () => {
    square('e8').click();

    expect(squaresWithClass('selectionner')).toEqual([]);
  });

  it('ignores a click on the modal outside the piece buttons', () => {
    promotionModal().querySelector('p').click();

    expect(promotionModal().style.display).toBe('flex');
    expect(pieceOn('d8')).toEqual({ type: 'pion', couleur: 'blanche' });
  });

  it('turns the pawn into the chosen piece, closes the choice and passes the move', () => {
    promotionModal().querySelector('[data-type="cavalier"]').click();

    expect(pieceOn('d8')).toEqual({ type: 'cavalier', couleur: 'blanche' });
    expect(promotionModal().style.display).toBe('none');
    expect(currentPlayer()).toBe('noire');
    expect(document.getElementById('blanche-nb-prisonier').textContent).toBe('4');
  });

  it('marks the check given by the promoted piece', () => {
    promotionModal().querySelector('[data-type="dame"]').click();

    expect(squaresWithClass('echec')).toEqual(['e8']);
  });
});

describe('main.js end of game', () => {
  const dialog = () => document.querySelector('.alert__wrapper');

  beforeEach(() => {
    vi.useFakeTimers();
    play(FOOLS_MATE);
  });

  it('marks the mated king and names the winner', () => {
    expect(squaresWithClass('echec')).toEqual(['e1']);
    expect(document.querySelector('.couleur-joueur-gagnant').textContent).toBe('noire');
  });

  it('opens the checkmate dialog after the delay, not before', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS - 1);
    expect(dialog().open).toBe(false);

    vi.advanceTimersByTime(1);

    expect(dialog().open).toBe(true);
    expect(dialog().querySelector('.fin-de-partie').classList).toContain('afficher');
    expect(dialog().getAttribute('aria-labelledby')).toBe('checkmate-title');
  });

  it('ignores clicks on the board once the game is over', () => {
    square('a2').click();

    expect(squaresWithClass('selectionner')).toEqual([]);
  });

  it('starts a new game when "Rejouer" closes the dialog', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    dialog().querySelector('.fin-de-partie button').click();

    expect(dialog().open).toBe(false);
    expect(dialog().querySelectorAll('.afficher')).toHaveLength(0);
    expect(pieceOn('d8')).toEqual({ type: 'dame', couleur: 'noire' });
    expect(pieceOn('f2')).toEqual({ type: 'pion', couleur: 'blanche' });
    expect(pieceOn('h4')).toBeNull();
    expect(squaresWithClass('echec')).toEqual([]);
    expect(currentPlayer()).toBe('blanche');

    play([['e2', 'e4']]);
    expect(pieceOn('e4')).toEqual({ type: 'pion', couleur: 'blanche' });
    expect(square('e4').querySelector('.piece').textContent).toBe(pion.pièce.blanche);
  });
});

describe('main.js stalemate', () => {
  const dialog = () => document.querySelector('.alert__wrapper');

  beforeEach(() => {
    vi.useFakeTimers();
    play(LOYD_STALEMATE);
  });

  it('opens the stalemate dialog after the delay, without marking a king', () => {
    expect(squaresWithClass('echec')).toEqual([]);

    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    expect(dialog().open).toBe(true);
    expect(dialog().querySelector('.pat').classList).toContain('afficher');
    expect(dialog().querySelector('.fin-de-partie').classList).not.toContain('afficher');
    expect(dialog().getAttribute('aria-labelledby')).toBe('stalemate-title');
  });

  it('starts a new game when "Rejouer" closes the dialog', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    dialog().querySelector('.pat button').click();

    expect(dialog().open).toBe(false);
    expect(document.querySelectorAll('.container-piece .piece')).toHaveLength(32);
    expect(currentPlayer()).toBe('blanche');
  });
});
