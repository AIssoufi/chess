// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enableBoardNavigation, focusSquare } from '../app/js/board-navigation/roving-focus.js';

const FILES = 'abcdefgh';
const RANKS = '87654321';
const FIRST_TABBABLE_SQUARE = 'e2';

let board;
let disableNavigation;

/**
 * Builds a board of 64 square buttons, rank 8 first, with a single square reached by Tab.
 *
 * @returns {HTMLElement} The node that holds the squares.
 */
function buildBoard() {
  const node = document.createElement('div');
  for (const rank of RANKS) {
    const row = document.createElement('div');
    for (const file of FILES) {
      const square = document.createElement('button');
      square.className = 'square';
      square.dataset.position = `${file}${rank}`;
      square.tabIndex = square.dataset.position === FIRST_TABBABLE_SQUARE ? 0 : -1;
      row.append(square);
    }
    node.append(row);
  }
  document.body.append(node);
  return node;
}

/**
 * Returns the node of a square of the test board.
 *
 * @param {string} position The square, such as `'e4'`.
 * @returns {HTMLElement} Its node.
 */
function square(position) {
  return board.querySelector(`[data-position="${position}"]`);
}

/**
 * Returns the squares that the Tab key reaches.
 *
 * @returns {string[]} Their positions.
 */
function tabbableSquares() {
  return [...board.querySelectorAll('.square')]
    .filter((node) => node.tabIndex === 0)
    .map((node) => node.dataset.position);
}

/**
 * Presses a key on the focused element.
 *
 * @param {KeyboardEventInit} init The key and its modifiers.
 * @returns {KeyboardEvent} The event, to read whether its default action was prevented.
 */
function press(init) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  document.activeElement.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  board = buildBoard();
});

afterEach(() => {
  disableNavigation?.();
  disableNavigation = undefined;
  document.body.innerHTML = '';
});

describe('focusSquare', () => {
  it('focuses a square and makes it the only one that the Tab key reaches', () => {
    expect(focusSquare({ board, square: 'd7' })).toBe(true);

    expect(document.activeElement).toBe(square('d7'));
    expect(tabbableSquares()).toEqual(['d7']);
  });

  it.each([['e9'], ['E4'], ['"]'], ['toString'], [''], [42], [undefined], [null]])(
    'leaves the focus alone for %j, which is no square',
    (value) => {
      square('a1').focus();

      expect(focusSquare({ board, square: value })).toBe(false);
      expect(document.activeElement).toBe(square('a1'));
      expect(tabbableSquares()).toEqual([FIRST_TABBABLE_SQUARE]);
    }
  );

  it.each([
    ['a missing board', undefined],
    ['a null board', null],
  ])('does nothing with %s', (_, missingBoard) => {
    expect(focusSquare({ board: missingBoard, square: 'e4' })).toBe(false);
  });

  it('does nothing without parameters', () => {
    expect(focusSquare()).toBe(false);
  });
});

describe('enableBoardNavigation', () => {
  beforeEach(() => {
    disableNavigation = enableBoardNavigation(board);
    square('e2').focus();
  });

  it.each([
    ['ArrowUp', 'e3'],
    ['ArrowDown', 'e1'],
    ['ArrowLeft', 'd2'],
    ['ArrowRight', 'f2'],
    ['Home', 'a2'],
    ['End', 'h2'],
    ['PageUp', 'e8'],
    ['PageDown', 'e1'],
  ])('moves the focus from e2 with %s to %s', (key, expected) => {
    const event = press({ key });

    expect(document.activeElement).toBe(square(expected));
    expect(tabbableSquares()).toEqual([expected]);
    expect(event.defaultPrevented).toBe(true);
  });

  it('keeps the focus at the edge of the board', () => {
    square('h8').focus();

    press({ key: 'ArrowUp' });
    press({ key: 'ArrowRight' });

    expect(document.activeElement).toBe(square('h8'));
  });

  it.each([['Enter'], [' '], ['Tab'], ['a'], ['Escape']])(
    'leaves %j to the square, which is no navigation key',
    (key) => {
      const event = press({ key });

      expect(document.activeElement).toBe(square('e2'));
      expect(event.defaultPrevented).toBe(false);
    }
  );

  it.each([['altKey'], ['ctrlKey'], ['metaKey']])(
    'leaves an arrow pressed with %s to the browser',
    (modifier) => {
      const event = press({ key: 'ArrowLeft', [modifier]: true });

      expect(document.activeElement).toBe(square('e2'));
      expect(event.defaultPrevented).toBe(false);
    }
  );

  it('moves the focus with an arrow pressed with Shift', () => {
    press({ key: 'ArrowUp', shiftKey: true });

    expect(document.activeElement).toBe(square('e3'));
  });

  it('ignores a key pressed on a node of the board that is no square', () => {
    const other = document.createElement('button');
    board.append(other);
    other.focus();

    const event = press({ key: 'ArrowUp' });

    expect(document.activeElement).toBe(other);
    expect(event.defaultPrevented).toBe(false);
  });

  it('makes a square that gets the focus by a click the one that the Tab key reaches', () => {
    square('b5').focus();

    expect(tabbableSquares()).toEqual(['b5']);
  });

  it('stops listening once disabled', () => {
    disableNavigation();
    disableNavigation = undefined;

    press({ key: 'ArrowUp' });
    square('c3').focus();

    expect(document.activeElement).toBe(square('c3'));
    expect(tabbableSquares()).toEqual([FIRST_TABBABLE_SQUARE]);
  });

  it.each([
    ['a missing board', undefined],
    ['a null board', null],
  ])('returns a cleanup that does nothing for %s', (_, missingBoard) => {
    expect(() => enableBoardNavigation(missingBoard)()).not.toThrow();
  });
});
