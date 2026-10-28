// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GAME_OVER_DIALOG_DELAY_MS } from '../app/js/game-over/constants.js';
import pawn from '../app/js/pieces/pawn.js';
import knight from '../app/js/pieces/knight.js';

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
/** Both knights go out and back twice: the starting position occurs a third time, a draw. */
const KNIGHT_ROUND_TRIP = [
  ['g1', 'f3'],
  ['g8', 'f6'],
  ['f3', 'g1'],
  ['f6', 'g8'],
];
const THREEFOLD_REPETITION = [...KNIGHT_ROUND_TRIP, ...KNIGHT_ROUND_TRIP];

/**
 * Returns the square of the board at a position.
 *
 * @param {string} position Algebraic position, such as `'e4'`.
 * @returns {HTMLElement | null} The `.square` element.
 */
function square(position) {
  return document.querySelector(`.square[data-position="${position}"]`);
}

/**
 * Returns the piece shown on a square.
 *
 * @param {string} position Algebraic position.
 * @returns {{ type: string, color: string } | null} The piece's dataset, or null on an empty
 *   square.
 */
function pieceOn(position) {
  const node = square(position).querySelector('.piece');
  return node ? { type: node.dataset.type, color: node.dataset.color } : null;
}

/**
 * Lists the positions of the squares that carry a class.
 *
 * @param {string} className Class of the squares, such as `'possible-move'`.
 * @returns {string[]} Their positions, sorted.
 */
function squaresWithClass(className) {
  return [...document.querySelectorAll(`.square.${className}`)]
    .map((node) => node.dataset.position)
    .sort();
}

/** @returns {string | undefined} The color whose control panel is marked as the current player. */
function currentPlayer() {
  return document.querySelector('.control.current-player')?.dataset.color;
}

/** @returns {string[]} The text of each turn of the move list, such as `'f3 e5'`. */
function moveListTurns() {
  return [...document.querySelectorAll('.move-list__moves li')].map((item) => item.textContent);
}

/** @returns {boolean} Whether the move list shows its note for a game without moves. */
function isMoveListEmptyNoteShown() {
  return !document.querySelector('.move-list__empty').hidden;
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
  vi.resetModules();
  await beforeMain?.();
  await import('../app/js/main.js');
}

beforeEach(() => loadPage());

afterEach(() => {
  vi.useRealTimers();
});

describe('main.js start', () => {
  it('renders the 32 pieces and gives the move to white', () => {
    expect(document.querySelectorAll('.container-squares .piece')).toHaveLength(32);
    expect(pieceOn('e1')).toEqual({ type: 'king', color: 'white' });
    expect(pieceOn('d8')).toEqual({ type: 'queen', color: 'black' });
    expect(currentPlayer()).toBe('white');
  });

  it('skips an unknown piece and still renders the rest of the board and the captures', async () => {
    await loadPage({
      beforeMain: async () => {
        const { default: Chessboard } = await import('../app/js/Chessboard.js');
        const initialize = Chessboard.prototype.initialize;
        vi.spyOn(Chessboard.prototype, 'initialize').mockImplementation(function () {
          initialize.call(this);
          this.board.set('e4', { type: 'unicorn', color: 'white', hasMoved: false });
          this.board.set('d4', { type: 'pawn', color: 'red', hasMoved: false });
          this.captures.white.push({ type: 'unicorn', color: 'black' });
          this.captures.white.push({ type: 'pawn', color: 'black' });
        });
      },
    });

    expect(pieceOn('e4')).toBeNull();
    expect(pieceOn('d4')).toBeNull();
    expect(document.querySelectorAll('.container-squares .piece')).toHaveLength(32);
    expect(document.getElementById('white-captures').children).toHaveLength(1);
    expect(document.getElementById('white-captures').firstElementChild.dataset.type).toBe('pawn');
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

    expect(squaresWithClass('selected')).toEqual(['e2']);
    expect(squaresWithClass('possible-move')).toEqual(['e3', 'e4']);
  });

  it('moves the selected piece to a highlighted square and passes the move', () => {
    play([['e2', 'e4']]);

    expect(pieceOn('e4')).toEqual({ type: 'pawn', color: 'white' });
    expect(pieceOn('e2')).toBeNull();
    expect(squaresWithClass('selected')).toEqual([]);
    expect(squaresWithClass('possible-move')).toEqual([]);
    expect(currentPlayer()).toBe('black');
  });

  it('switches the selection to another piece of the same color', () => {
    square('e2').click();
    square('g1').click();

    expect(squaresWithClass('selected')).toEqual(['g1']);
    expect(squaresWithClass('possible-move')).toEqual(['f3', 'h3']);
  });

  it('clears the selection on a click outside the highlighted squares, without moving', () => {
    square('e2').click();
    square('e5').click();

    expect(pieceOn('e2')).toEqual({ type: 'pawn', color: 'white' });
    expect(pieceOn('e5')).toBeNull();
    expect(squaresWithClass('selected')).toEqual([]);
    expect(squaresWithClass('possible-move')).toEqual([]);
    expect(currentPlayer()).toBe('white');
  });

  it('ignores a click on a piece of the side not to move', () => {
    square('e7').click();

    expect(squaresWithClass('selected')).toEqual([]);
    expect(squaresWithClass('possible-move')).toEqual([]);
    expect(currentPlayer()).toBe('white');
  });

  it('ignores a click on an empty square without a selection', () => {
    square('e4').click();

    expect(squaresWithClass('selected')).toEqual([]);
    expect(currentPlayer()).toBe('white');
  });

  it('does not select a piece without legal moves', () => {
    square('a1').click();

    expect(squaresWithClass('selected')).toEqual([]);
    expect(squaresWithClass('possible-move')).toEqual([]);
  });

  it('ignores a click outside the squares', () => {
    document.querySelector('.container-squares .row').click();

    expect(squaresWithClass('selected')).toEqual([]);
  });

  it('shows the captured pieces next to the capturing side', () => {
    play([
      ['e2', 'e4'],
      ['d7', 'd5'],
      ['e4', 'd5'],
    ]);

    expect(document.getElementById('white-capture-count').textContent).toBe('1');
    const prisoner = document.querySelector('#white-captures .piece');
    expect(prisoner.dataset).toMatchObject({ type: 'pawn', color: 'black' });
  });

  it('starts with an empty move list and its note', () => {
    expect(moveListTurns()).toEqual([]);
    expect(isMoveListEmptyNoteShown()).toBe(true);
  });

  it('numbers the moves by turn in the move list, and hides its note', () => {
    play([
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
    ]);

    expect(moveListTurns()).toEqual(['e4 e5', 'Cf3']);
    expect(document.querySelector('.move-list__moves li:last-child').value).toBe(2);
    expect(isMoveListEmptyNoteShown()).toBe(false);
  });

  it('adds nothing to the move list for a selection without a move', () => {
    square('e2').click();
    square('e2').click();

    expect(moveListTurns()).toEqual([]);
  });

  it('writes the castling in the move list', () => {
    play([
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
      ['b8', 'c6'],
      ['f1', 'c4'],
      ['g8', 'f6'],
      ['e1', 'g1'],
    ]);

    expect(moveListTurns()).toEqual(['e4 e5', 'Cf3 Cc6', 'Fc4 Cf6', 'O-O']);
  });

  it('marks the king in check, then clears the mark once the check is parried', () => {
    play([
      ['e2', 'e4'],
      ['f7', 'f5'],
      ['d1', 'h5'],
    ]);

    expect(squaresWithClass('check')).toEqual(['e8']);

    play([['g7', 'g6']]);
    expect(squaresWithClass('check')).toEqual([]);
  });
});

describe('main.js promotion', () => {
  const promotionModal = () => document.querySelector('.promotion__wrapper');

  beforeEach(() => {
    play(MOVES_BEFORE_PROMOTION);
    play([['e7', 'd8']]);
  });

  it('opens the promotion choice with the symbols of the promoting color', () => {
    expect(promotionModal().hidden).toBe(false);
    const button = promotionModal().querySelector('[data-type="knight"]');
    expect(button.textContent).toBe(knight.piece.white);
    expect(pieceOn('d8')).toEqual({ type: 'pawn', color: 'white' });
    expect(currentPlayer()).toBe('white');
    expect(moveListTurns()).toEqual(['h4 g5', 'hxg5 Cf6', 'gxf6 a6', 'fxe7 a5']);
  });

  it('ignores clicks on the board while the choice is open', () => {
    square('e8').click();

    expect(squaresWithClass('selected')).toEqual([]);
  });

  it('ignores a click on the modal outside the piece buttons', () => {
    promotionModal().querySelector('p').click();

    expect(promotionModal().hidden).toBe(false);
    expect(pieceOn('d8')).toEqual({ type: 'pawn', color: 'white' });
  });

  it('turns the pawn into the chosen piece, closes the choice and passes the move', () => {
    promotionModal().querySelector('[data-type="knight"]').click();

    expect(pieceOn('d8')).toEqual({ type: 'knight', color: 'white' });
    expect(promotionModal().hidden).toBe(true);
    expect(currentPlayer()).toBe('black');
    expect(document.getElementById('white-capture-count').textContent).toBe('4');
    expect(moveListTurns().at(-1)).toBe('exd8=C');
  });

  it('marks the check given by the promoted piece', () => {
    promotionModal().querySelector('[data-type="queen"]').click();

    expect(squaresWithClass('check')).toEqual(['e8']);
    expect(moveListTurns().at(-1)).toBe('exd8=D+');
  });
});

describe('main.js end of game', () => {
  const dialog = () => document.querySelector('.alert__wrapper');
  const isBoardOver = () =>
    document.querySelector('.container-squares').classList.contains('game-over');

  beforeEach(() => {
    vi.useFakeTimers();
    play(FOOLS_MATE);
  });

  it('marks the mated king and names the winner', () => {
    expect(squaresWithClass('check')).toEqual(['e1']);
    expect(document.querySelector('.winner-color').textContent).toBe('noire');
    expect(moveListTurns()).toEqual(['f3 e5', 'g4 Dh4#']);
  });

  it('opens the checkmate dialog after the delay, not before', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS - 1);
    expect(dialog().open).toBe(false);

    vi.advanceTimersByTime(1);

    expect(dialog().open).toBe(true);
    expect(dialog().querySelector('.checkmate').classList).toContain('shown');
    expect(dialog().getAttribute('aria-labelledby')).toBe('checkmate-title');
  });

  it('ignores clicks on the board once the game is over', () => {
    square('a2').click();

    expect(squaresWithClass('selected')).toEqual([]);
  });

  it('starts a new game when "Rejouer" closes the dialog', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    dialog().querySelector('.checkmate [value="replay"]').click();

    expect(dialog().open).toBe(false);
    expect(dialog().querySelectorAll('.shown')).toHaveLength(0);
    expect(pieceOn('d8')).toEqual({ type: 'queen', color: 'black' });
    expect(pieceOn('f2')).toEqual({ type: 'pawn', color: 'white' });
    expect(pieceOn('h4')).toBeNull();
    expect(squaresWithClass('check')).toEqual([]);
    expect(currentPlayer()).toBe('white');
    expect(moveListTurns()).toEqual([]);
    expect(isMoveListEmptyNoteShown()).toBe(true);

    play([['e2', 'e4']]);
    expect(moveListTurns()).toEqual(['e4']);
    expect(pieceOn('e4')).toEqual({ type: 'pawn', color: 'white' });
    expect(square('e4').querySelector('.piece').textContent).toBe(pawn.piece.white);
  });

  it('focuses "Rejouer !" when the dialog opens', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    expect(document.activeElement).toBe(dialog().querySelector('.checkmate [value="replay"]'));
  });

  it('leaves the final position and the check on screen when "Voir la position" closes it', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    dialog().querySelector('.checkmate [value="review"]').click();

    expect(dialog().open).toBe(false);
    expect(dialog().querySelectorAll('.shown')).toHaveLength(0);
    expect(pieceOn('h4')).toEqual({ type: 'queen', color: 'black' });
    expect(pieceOn('g4')).toEqual({ type: 'pawn', color: 'white' });
    expect(pieceOn('d8')).toBeNull();
    expect(squaresWithClass('check')).toEqual(['e1']);
    expect(moveListTurns()).toEqual(['f3 e5', 'g4 Dh4#']);
  });

  it('ignores clicks on the board while the final position is reviewed', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);
    dialog().querySelector('.checkmate [value="review"]').click();

    square('a2').click();
    square('a3').click();

    expect(squaresWithClass('selected')).toEqual([]);
    expect(squaresWithClass('possible-move')).toEqual([]);
    expect(pieceOn('a2')).toEqual({ type: 'pawn', color: 'white' });
    expect(pieceOn('a3')).toBeNull();
  });

  it('turns off the hover of the squares while the final position is reviewed', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);
    dialog().querySelector('.checkmate [value="review"]').click();

    expect(isBoardOver()).toBe(true);
  });

  it('starts a new game with "Nouvelle partie" once the final position is reviewed', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);
    dialog().querySelector('.checkmate [value="review"]').click();

    document.querySelector('.new-game').click();

    expect(isBoardOver()).toBe(false);
    expect(pieceOn('d8')).toEqual({ type: 'queen', color: 'black' });
    expect(squaresWithClass('check')).toEqual([]);
    expect(moveListTurns()).toEqual([]);
    play([['e2', 'e4']]);
    expect(pieceOn('e4')).toEqual({ type: 'pawn', color: 'white' });
  });

  it('starts a new game on Escape at the end of a game after a reviewed one', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);
    dialog().querySelector('.checkmate [value="review"]').click();
    document.querySelector('.new-game').click();
    play(FOOLS_MATE);
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    // Escape closes the dialog without a value, as `close()` does
    dialog().close();

    expect(dialog().open).toBe(false);
    expect(pieceOn('h4')).toBeNull();
    expect(moveListTurns()).toEqual([]);
    expect(currentPlayer()).toBe('white');
  });

  it('starts a new game when an unknown value closes the dialog', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    dialog().close('cancel');

    expect(pieceOn('h4')).toBeNull();
    expect(squaresWithClass('check')).toEqual([]);
    expect(moveListTurns()).toEqual([]);
  });
});

describe('main.js stalemate', () => {
  const dialog = () => document.querySelector('.alert__wrapper');

  beforeEach(() => {
    vi.useFakeTimers();
    play(LOYD_STALEMATE);
  });

  it('opens the stalemate dialog after the delay, without marking a king', () => {
    expect(squaresWithClass('check')).toEqual([]);

    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    expect(dialog().open).toBe(true);
    expect(dialog().querySelector('.stalemate').classList).toContain('shown');
    expect(dialog().querySelector('.checkmate').classList).not.toContain('shown');
    expect(dialog().getAttribute('aria-labelledby')).toBe('stalemate-title');
  });

  it('starts a new game when "Rejouer" closes the dialog', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    dialog().querySelector('.stalemate [value="replay"]').click();

    expect(dialog().open).toBe(false);
    expect(document.querySelectorAll('.container-squares .piece')).toHaveLength(32);
    expect(currentPlayer()).toBe('white');
  });

  it('leaves the final position on screen when "Voir la position" closes the dialog', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    dialog().querySelector('.stalemate [value="review"]').click();

    expect(dialog().open).toBe(false);
    expect(pieceOn('e6')).toEqual({ type: 'queen', color: 'white' });
    expect(pieceOn('d1')).toBeNull();
    expect(moveListTurns()).toHaveLength(10);
  });
});

describe('main.js draw', () => {
  const dialog = () => document.querySelector('.alert__wrapper');

  beforeEach(() => {
    vi.useFakeTimers();
    play(THREEFOLD_REPETITION);
  });

  it('opens the draw dialog with its reason in French after the delay', () => {
    expect(dialog().open).toBe(false);

    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    expect(dialog().open).toBe(true);
    expect(dialog().querySelector('.draw').classList).toContain('shown');
    expect(dialog().querySelector('.stalemate').classList).not.toContain('shown');
    expect(dialog().getAttribute('aria-labelledby')).toBe('draw-title');
    expect(dialog().querySelector('.draw-reason').textContent).toBe('position répétée trois fois');
    expect(moveListTurns()).toHaveLength(4);
  });

  it('ignores clicks on the board once the game is drawn', () => {
    square('g1').click();

    expect(squaresWithClass('selected')).toEqual([]);
  });

  it('starts a new game when "Rejouer" closes the dialog', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    dialog().querySelector('.draw [value="replay"]').click();

    expect(dialog().open).toBe(false);
    expect(dialog().querySelectorAll('.shown')).toHaveLength(0);
    expect(moveListTurns()).toEqual([]);
    play([['g1', 'f3']]);
    expect(pieceOn('f3')).toEqual({ type: 'knight', color: 'white' });
  });

  it('leaves the final position and ignores the board when "Voir la position" closes it', () => {
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    dialog().querySelector('.draw [value="review"]').click();
    square('g1').click();

    expect(dialog().open).toBe(false);
    expect(moveListTurns()).toHaveLength(4);
    expect(squaresWithClass('selected')).toEqual([]);
  });
});

describe('main.js new game', () => {
  const newGameButton = () => document.querySelector('.new-game');
  const dialog = () => document.querySelector('.alert__wrapper');

  it('resets the board, the move list, the captures and the check during a game', () => {
    play([
      ['e2', 'e4'],
      ['d7', 'd5'],
      ['e4', 'd5'],
      ['e7', 'e6'],
      ['f1', 'b5'],
    ]);
    square('c8').click();
    expect(squaresWithClass('check')).toEqual(['e8']);
    expect(squaresWithClass('selected')).toEqual(['c8']);

    newGameButton().click();

    expect(document.querySelectorAll('.container-squares .piece')).toHaveLength(32);
    expect(pieceOn('e2')).toEqual({ type: 'pawn', color: 'white' });
    expect(pieceOn('d7')).toEqual({ type: 'pawn', color: 'black' });
    expect(pieceOn('b5')).toBeNull();
    expect(squaresWithClass('check')).toEqual([]);
    expect(squaresWithClass('selected')).toEqual([]);
    expect(currentPlayer()).toBe('white');
    expect(moveListTurns()).toEqual([]);
    expect(isMoveListEmptyNoteShown()).toBe(true);
    expect(document.getElementById('white-capture-count').textContent).toBe('0');
    expect(document.querySelectorAll('#white-captures .piece')).toHaveLength(0);
  });

  it('does nothing visible on a game without moves, which stays playable', () => {
    newGameButton().click();

    expect(document.querySelectorAll('.container-squares .piece')).toHaveLength(32);
    play([['e2', 'e4']]);
    expect(moveListTurns()).toEqual(['e4']);
  });

  it('hides a pending promotion choice and lets white play again', () => {
    play(MOVES_BEFORE_PROMOTION);
    play([['e7', 'd8']]);

    newGameButton().click();

    expect(document.querySelector('.promotion__wrapper').hidden).toBe(true);
    expect(pieceOn('d8')).toEqual({ type: 'queen', color: 'black' });
    play([['e2', 'e4']]);
    expect(pieceOn('e4')).toEqual({ type: 'pawn', color: 'white' });
  });

  it('keeps the game over dialog closed when it starts before the dialog opens', () => {
    vi.useFakeTimers();
    play(FOOLS_MATE);

    newGameButton().click();
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    expect(dialog().open).toBe(false);
    expect(currentPlayer()).toBe('white');
  });
});

describe('main.js keyboard and screen readers', () => {
  const status = () => document.querySelector('.game-status').textContent;
  const label = (position) => square(position).getAttribute('aria-label');
  const promotionButton = (type) =>
    document.querySelector(`.promotion__wrapper [data-type="${type}"]`);

  /**
   * Presses a key on the focused element.
   *
   * @param {string} key The key, such as `'ArrowUp'`.
   */
  function press(key) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    document.activeElement.dispatchEvent(event);
  }

  it('names each square after its piece, or as empty', () => {
    expect(label('e2')).toBe('e2, pion blanc');
    expect(label('d8')).toBe('d8, dame noire');
    expect(label('e4')).toBe('e4, vide');
  });

  it('hides the pieces of the board, which the names of the squares already read', () => {
    const pieces = document.querySelectorAll('.container-squares .piece');

    expect([...pieces].every((piece) => piece.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('leaves the captured pieces readable, as images named in French', () => {
    play([
      ['e2', 'e4'],
      ['d7', 'd5'],
      ['e4', 'd5'],
    ]);
    const prisoner = document.querySelector('#white-captures .piece');

    expect(prisoner.getAttribute('role')).toBe('img');
    expect(prisoner.getAttribute('aria-label')).toBe('pion noir');
    expect(prisoner.hasAttribute('aria-hidden')).toBe(false);
  });

  it('marks the selected square and names the squares it can move to', () => {
    square('e2').click();

    expect(square('e2').getAttribute('aria-selected')).toBe('true');
    expect(square('d2').getAttribute('aria-selected')).toBe('false');
    expect(label('e3')).toBe('e3, vide, coup possible');
    expect(label('e4')).toBe('e4, vide, coup possible');
    expect(label('e5')).toBe('e5, vide');
  });

  it('drops the selection and the possible moves from the names once the move is played', () => {
    play([['e2', 'e4']]);

    expect(label('e4')).toBe('e4, pion blanc');
    expect(label('e3')).toBe('e3, vide');
    expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
  });

  it('announces the side to play at the start, then each move', () => {
    expect(status()).toBe('Aux blancs de jouer.');

    play([['e2', 'e4']]);
    expect(status()).toBe('Dernier coup\u00a0: pion blanc de e2 à e4. Aux noirs de jouer.');

    play([['d7', 'd5']]);
    play([['e4', 'd5']]);
    expect(status()).toBe(
      'Dernier coup\u00a0: pion blanc de e4 à d5, prend pion noir. Aux noirs de jouer.'
    );
  });

  it('keeps the announcement of the previous move while the selection changes', () => {
    play([['e2', 'e4']]);
    square('d7').click();
    square('e7').click();

    expect(status()).toBe('Dernier coup\u00a0: pion blanc de e2 à e4. Aux noirs de jouer.');
  });

  it('announces the checkmate and names the mated king', () => {
    play(FOOLS_MATE);

    expect(status()).toBe(
      'Dernier coup\u00a0: dame noire de d8 à h4. Échec et mat, les noirs gagnent.'
    );
    expect(label('e1')).toBe('e1, roi blanc, en échec');
  });

  it('announces the stalemate', () => {
    play(LOYD_STALEMATE);

    expect(status()).toBe('Dernier coup\u00a0: dame blanche de c8 à e6. Pat, match nul.');
  });

  it('announces the draw by repetition with its reason', () => {
    play(THREEFOLD_REPETITION);

    expect(status()).toBe(
      'Dernier coup\u00a0: cavalier noir de f6 à g8. Match nul\u00a0: position répétée trois fois.'
    );
  });

  it('starts the announcements again in a new game', () => {
    vi.useFakeTimers();
    play(FOOLS_MATE);
    vi.advanceTimersByTime(GAME_OVER_DIALOG_DELAY_MS);

    document.querySelector('.alert__wrapper .checkmate button').click();

    expect(status()).toBe('Aux blancs de jouer.');
    expect(label('e1')).toBe('e1, roi blanc');
  });

  it('moves the focus across the board with the arrows', () => {
    square('e2').focus();

    press('ArrowUp');
    press('ArrowUp');
    press('ArrowLeft');

    expect(document.activeElement).toBe(square('d4'));
    const tabbable = document.querySelectorAll('.container-squares [tabindex="0"]');
    expect([...tabbable]).toEqual([square('d4')]);
  });

  it('focuses the first piece of the promotion choice, then the promoted square', () => {
    play(MOVES_BEFORE_PROMOTION);
    play([['e7', 'd8']]);

    expect(document.activeElement).toBe(promotionButton('queen'));
    expect(status()).toBe('Dernier coup\u00a0: pion noir de a6 à a5. Aux blancs de jouer.');

    promotionButton('queen').click();

    expect(document.activeElement).toBe(square('d8'));
    expect(label('d8')).toBe('d8, dame blanche');
    expect(status()).toBe(
      'Dernier coup\u00a0: pion blanc de e7 à d8, prend dame noire, promu en dame. ' +
        'Les noirs sont en échec. Aux noirs de jouer.'
    );
  });

  it('leaves the focus on the choice after a click outside the piece buttons', () => {
    play(MOVES_BEFORE_PROMOTION);
    play([['e7', 'd8']]);

    document.querySelector('.promotion__wrapper p').click();

    expect(document.activeElement).toBe(promotionButton('queen'));
  });
});
