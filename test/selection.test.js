// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';
import { getSquareNode } from '../app/js/rendering/render.js';
import { CLICK_ACTIONS, NO_SELECTION } from '../app/js/selection/constants.js';
import { highlightSelection } from '../app/js/selection/highlight.js';
import { getClickAction, getSelection } from '../app/js/selection/utils.js';

const PAWN_SELECTION = { square: 'e2', moves: ['e3', 'e4'] };

let game;

beforeEach(() => {
  game = new Chessboard();
  game.initialize();
});

describe('getSelection', () => {
  it('selects a piece of the side to move with its legal moves', () => {
    expect(getSelection({ game, square: 'e2' })).toEqual(PAWN_SELECTION);
    expect(getSelection({ game, square: 'g1' })).toEqual({ square: 'g1', moves: ['h3', 'f3'] });
  });

  it('selects nothing for a piece without legal moves', () => {
    expect(getSelection({ game, square: 'a1' })).toBe(NO_SELECTION);
  });

  it('selects nothing for a piece of the other color or an empty square', () => {
    expect(getSelection({ game, square: 'e7' })).toBe(NO_SELECTION);
    expect(getSelection({ game, square: 'e4' })).toBe(NO_SELECTION);
  });

  it('selects the black pieces once white played', () => {
    game.move({ from: 'e2', to: 'e4' });
    expect(getSelection({ game, square: 'e2' })).toBe(NO_SELECTION);
    expect(getSelection({ game, square: 'e7' })).toEqual({ square: 'e7', moves: ['e6', 'e5'] });
  });

  it.each([
    ['no parameters', undefined],
    ['null', null],
    ['no game', { square: 'e2' }],
  ])('selects nothing for %s', (_label, params) => {
    expect(getSelection(params)).toBe(NO_SELECTION);
  });

  it.each([
    ['undefined', undefined],
    ['a value that is not a square', 'z9'],
    ['an empty string', ''],
    ['a number', 42],
  ])('selects nothing for a square that is %s', (_label, square) => {
    expect(getSelection({ game, square })).toBe(NO_SELECTION);
  });
});

describe('getClickAction', () => {
  it('selects a piece of the side to move, with or without a selection', () => {
    expect(getClickAction({ game, square: 'e2' })).toBe(CLICK_ACTIONS.select);
    expect(getClickAction({ game, selection: PAWN_SELECTION, square: 'd2' })).toBe(
      CLICK_ACTIONS.select
    );
  });

  it('selects a piece of the side to move even without legal moves', () => {
    expect(getClickAction({ game, square: 'a1' })).toBe(CLICK_ACTIONS.select);
  });

  it('moves to a square the selected piece can reach', () => {
    expect(getClickAction({ game, selection: PAWN_SELECTION, square: 'e4' })).toBe(
      CLICK_ACTIONS.move
    );
  });

  it('drops the selection on a square it cannot reach', () => {
    expect(getClickAction({ game, selection: PAWN_SELECTION, square: 'e5' })).toBe(
      CLICK_ACTIONS.deselect
    );
    expect(getClickAction({ game, selection: PAWN_SELECTION, square: 'e7' })).toBe(
      CLICK_ACTIONS.deselect
    );
  });

  it('does nothing on an empty square or a piece of the other color without a selection', () => {
    expect(getClickAction({ game, square: 'e4' })).toBe(CLICK_ACTIONS.none);
    expect(getClickAction({ game, selection: NO_SELECTION, square: 'e7' })).toBe(
      CLICK_ACTIONS.none
    );
  });

  it('does nothing once the game is over', () => {
    game.isOver = true;
    expect(getClickAction({ game, selection: PAWN_SELECTION, square: 'e4' })).toBe(
      CLICK_ACTIONS.none
    );
  });

  it('does nothing while a promotion waits for its piece', () => {
    game.promotionSquare = 'e8';
    expect(getClickAction({ game, square: 'e2' })).toBe(CLICK_ACTIONS.none);
  });

  it.each([
    ['no parameters', undefined],
    ['null', null],
    ['no game', { square: 'e2' }],
  ])('does nothing for %s', (_label, params) => {
    expect(getClickAction(params)).toBe(CLICK_ACTIONS.none);
  });

  it.each([
    ['undefined', undefined],
    ['a value that is not a square', 'z9'],
    ['a number', 42],
  ])('does nothing for a square that is %s', (_label, square) => {
    expect(getClickAction({ game, selection: PAWN_SELECTION, square })).toBe(CLICK_ACTIONS.none);
  });

  it('treats a null selection as no selection', () => {
    expect(getClickAction({ game, selection: null, square: 'e4' })).toBe(CLICK_ACTIONS.none);
  });
});

describe('highlightSelection', () => {
  beforeEach(() => {
    document.body.innerHTML = ['e2', 'e3', 'e4', 'd2', 'd3', 'd4']
      .map((square) => `<button class="square" data-position="${square}"></button>`)
      .join('');
  });

  /**
   * Returns the squares that hold a class.
   *
   * @param {string} className The class, such as `'selected'`.
   * @returns {string[]} Their squares, in the order of the page.
   */
  function squaresWith(className) {
    return [...document.querySelectorAll(`.${className}`)].map((node) => node.dataset.position);
  }

  it('marks the selected square and the squares it can move to', () => {
    highlightSelection({ selection: PAWN_SELECTION });
    expect(squaresWith('selected')).toEqual(['e2']);
    expect(squaresWith('possible-move')).toEqual(['e3', 'e4']);
  });

  it('replaces the previous selection', () => {
    highlightSelection({ selection: PAWN_SELECTION });
    highlightSelection({ selection: { square: 'd2', moves: ['d3', 'd4'] } });
    expect(squaresWith('selected')).toEqual(['d2']);
    expect(squaresWith('possible-move')).toEqual(['d3', 'd4']);
  });

  it('clears every mark for no selection', () => {
    highlightSelection({ selection: PAWN_SELECTION });
    highlightSelection({ selection: NO_SELECTION });
    expect(squaresWith('selected')).toEqual([]);
    expect(squaresWith('possible-move')).toEqual([]);
  });

  it('skips the squares missing from the page', () => {
    highlightSelection({ selection: { square: 'a2', moves: ['a3', 'e3'] } });
    expect(squaresWith('selected')).toEqual([]);
    expect(squaresWith('possible-move')).toEqual(['e3']);
    expect(getSquareNode({ square: 'a3' })).toBeNull();
  });
});
