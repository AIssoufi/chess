// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';
import { getSquareNode } from '../app/js/rendering/render.js';
import { CLICK_ACTIONS, NO_SELECTION } from '../app/js/selection/constants.js';
import { highlightSelection } from '../app/js/selection/highlight.js';
import { getClickAction, getSelection } from '../app/js/selection/utils.js';
import { loadFen } from './helpers/fen/utils.js';

const PAWN_SELECTION = { square: 'e2', moves: ['e3', 'e4'], captures: [] };

/** A pawn of white on e5 that may take the pawn of black on d5 en passant, on the empty d6. */
const EN_PASSANT_FEN = '4k3/8/8/3pP3/8/8/8/4K3 w - d6';

/** The same position with a knight of white on c4, which reaches the en passant square too. */
const KNIGHT_ON_EN_PASSANT_FEN = '4k3/8/8/3pP3/2N5/8/8/4K3 w - d6';

/** A pawn of white on e7 that promotes on the empty e8 or by taking the rook of black on d8. */
const PROMOTION_FEN = '3r3k/4P3/8/8/8/8/8/4K3 w - -';

/** A king of white that may castle on its side of the king, toward the empty g1. */
const CASTLING_FEN = '4k3/8/8/8/8/8/8/4K2R w K -';

let game;

beforeEach(() => {
  game = new Chessboard();
  game.initialize();
});

describe('getSelection', () => {
  it('selects a piece of the side to move with its legal moves', () => {
    expect(getSelection({ game, square: 'e2' })).toEqual(PAWN_SELECTION);
    expect(getSelection({ game, square: 'g1' })).toEqual({
      square: 'g1',
      moves: ['h3', 'f3'],
      captures: [],
    });
  });

  it('never lists a square of a piece of the same color, as a move or a capture', () => {
    const { moves, captures } = getSelection({ game, square: 'g1' });
    expect(moves).not.toContain('e2');
    expect(captures).not.toContain('e2');
  });

  it('lists the moves that take a piece of the other color as captures', () => {
    game.move({ from: 'e2', to: 'e4' });
    game.move({ from: 'd7', to: 'd5' });
    const { moves, captures } = getSelection({ game, square: 'e4' });
    expect(moves).toEqual(expect.arrayContaining(['e5', 'd5']));
    expect(moves).toHaveLength(2);
    expect(captures).toEqual(['d5']);
  });

  it('lists the captures of black too', () => {
    game.move({ from: 'e2', to: 'e4' });
    game.move({ from: 'd7', to: 'd5' });
    game.move({ from: 'a2', to: 'a3' });
    expect(getSelection({ game, square: 'd5' }).captures).toEqual(['e4']);
  });

  it('lists an en passant capture, whose target square is empty', () => {
    const position = loadFen(EN_PASSANT_FEN);
    expect(position.getPiece('d6')).toBeNull();
    const { moves, captures } = getSelection({ game: position, square: 'e5' });
    expect(moves).toEqual(expect.arrayContaining(['e6', 'd6']));
    expect(captures).toEqual(['d6']);
  });

  it('does not list a move of another piece to the en passant square as a capture', () => {
    const position = loadFen(KNIGHT_ON_EN_PASSANT_FEN);
    const { moves, captures } = getSelection({ game: position, square: 'c4' });
    expect(moves).toContain('d6');
    expect(captures).toEqual([]);
  });

  it('lists a promotion that takes a piece as a capture, and not the one on an empty square', () => {
    const { moves, captures } = getSelection({ game: loadFen(PROMOTION_FEN), square: 'e7' });
    expect(moves).toEqual(expect.arrayContaining(['e8', 'd8']));
    expect(captures).toEqual(['d8']);
  });

  it('does not list castling as a capture', () => {
    const { moves, captures } = getSelection({ game: loadFen(CASTLING_FEN), square: 'e1' });
    expect(moves).toContain('g1');
    expect(captures).toEqual([]);
  });

  it('selects nothing for a piece without legal moves', () => {
    expect(getSelection({ game, square: 'a1' })).toBe(NO_SELECTION);
  });

  it.each([
    ['once the game is over', { isOver: true }],
    ['while a promotion waits for its piece', { promotionSquare: 'e8' }],
  ])('selects nothing %s, even for a piece with legal moves', (_label, state) => {
    Object.assign(game, state);
    expect(getSelection({ game, square: 'e2' })).toBe(NO_SELECTION);
  });

  it('selects nothing for a piece of the other color or an empty square', () => {
    expect(getSelection({ game, square: 'e7' })).toBe(NO_SELECTION);
    expect(getSelection({ game, square: 'e4' })).toBe(NO_SELECTION);
  });

  it('selects the black pieces once white played', () => {
    game.move({ from: 'e2', to: 'e4' });
    expect(getSelection({ game, square: 'e2' })).toBe(NO_SELECTION);
    expect(getSelection({ game, square: 'e7' })).toEqual({
      square: 'e7',
      moves: ['e6', 'e5'],
      captures: [],
    });
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

  it('drops the selection on a second click on the selected piece', () => {
    expect(getClickAction({ game, selection: PAWN_SELECTION, square: 'e2' })).toBe(
      CLICK_ACTIONS.deselect
    );
  });

  it('selects a piece again once its selection is dropped', () => {
    expect(getClickAction({ game, selection: NO_SELECTION, square: 'e2' })).toBe(
      CLICK_ACTIONS.select
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
    highlightSelection({ selection: { square: 'a2', moves: ['a3', 'e3'], captures: ['a3'] } });
    expect(squaresWith('selected')).toEqual([]);
    expect(squaresWith('possible-move')).toEqual(['e3']);
    expect(squaresWith('capture-move')).toEqual([]);
    expect(getSquareNode({ square: 'a3' })).toBeNull();
  });

  it('marks the captures apart from the other possible moves', () => {
    highlightSelection({ selection: { square: 'e3', moves: ['e4', 'd4'], captures: ['d4'] } });
    expect(squaresWith('possible-move')).toEqual(['e4', 'd4']);
    expect(squaresWith('capture-move')).toEqual(['d4']);
  });

  it('clears the captures of the previous selection', () => {
    highlightSelection({ selection: { square: 'e3', moves: ['e4', 'd4'], captures: ['d4'] } });
    highlightSelection({ selection: PAWN_SELECTION });
    expect(squaresWith('capture-move')).toEqual([]);
    highlightSelection({ selection: { square: 'e3', moves: ['e4', 'd4'], captures: ['d4'] } });
    highlightSelection({ selection: NO_SELECTION });
    expect(squaresWith('capture-move')).toEqual([]);
  });

  it.each([
    ['no captures', { square: 'e2', moves: ['e3', 'e4'] }],
    ['null captures', { square: 'e2', moves: ['e3', 'e4'], captures: null }],
    ['an empty list of captures', PAWN_SELECTION],
  ])('marks no capture for %s', (_label, selection) => {
    highlightSelection({ selection });
    expect(squaresWith('possible-move')).toEqual(['e3', 'e4']);
    expect(squaresWith('capture-move')).toEqual([]);
  });

  it('marks no capture on a square that is not a possible move', () => {
    highlightSelection({ selection: { square: 'e2', moves: ['e3'], captures: ['d3'] } });
    expect(squaresWith('possible-move')).toEqual(['e3']);
    expect(squaresWith('capture-move')).toEqual([]);
  });
});
