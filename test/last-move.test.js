// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';
import { NO_LAST_MOVE_SQUARES } from '../app/js/last-move/constants.js';
import { highlightLastMove } from '../app/js/last-move/highlight.js';
import { getLastMoveSquares } from '../app/js/last-move/utils.js';
import { loadFen } from './helpers/fen/utils.js';

/** A pawn of white on e5 that may take the pawn of black on d5 en passant, on the empty d6. */
const EN_PASSANT_FEN = '4k3/8/8/3pP3/8/8/8/4K3 w - d6';

/** A pawn of white on e7 that promotes on the empty e8 or by taking the rook of black on d8. */
const PROMOTION_FEN = '3r3k/4P3/8/8/8/8/8/4K3 w - -';

/** A king of white that may castle on its side of the king, toward the empty g1. */
const CASTLING_FEN = '4k3/8/8/8/8/8/8/4K2R w K -';

describe('getLastMoveSquares', () => {
  let game;

  beforeEach(() => {
    game = new Chessboard();
    game.initialize();
  });

  it('returns the start and target squares of a move', () => {
    expect(getLastMoveSquares(game.move({ from: 'e2', to: 'e4' }))).toEqual(['e2', 'e4']);
  });

  it('returns the squares of a capture, without the captured piece apart', () => {
    game.move({ from: 'e2', to: 'e4' });
    game.move({ from: 'd7', to: 'd5' });

    expect(getLastMoveSquares(game.move({ from: 'e4', to: 'd5' }))).toEqual(['e4', 'd5']);
  });

  it('returns the squares of the capturing pawn for an en passant capture', () => {
    const position = loadFen(EN_PASSANT_FEN);

    expect(getLastMoveSquares(position.move({ from: 'e5', to: 'd6' }))).toEqual(['e5', 'd6']);
  });

  it('returns the squares of the king for a castling', () => {
    const position = loadFen(CASTLING_FEN);

    expect(getLastMoveSquares(position.move({ from: 'e1', to: 'g1' }))).toEqual(['e1', 'g1']);
  });

  it('returns the squares of the pawn for a promotion, before and after its piece is chosen', () => {
    const position = loadFen(PROMOTION_FEN);
    const move = position.move({ from: 'e7', to: 'd8' });

    expect(getLastMoveSquares(move)).toEqual(['e7', 'd8']);
    position.promote({ position: 'd8', type: 'queen' });
    expect(getLastMoveSquares(move)).toEqual(['e7', 'd8']);
  });

  it('returns no square for an illegal move, which game.move refuses', () => {
    expect(getLastMoveSquares(game.move({ from: 'e2', to: 'e5' }))).toBe(NO_LAST_MOVE_SQUARES);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty object', {}],
    ['a move without a target', { from: 'e2' }],
    ['a move without a start', { to: 'e4' }],
    ['a start that is not a square', { from: 'z9', to: 'e4' }],
    ['a target in upper case', { from: 'e2', to: 'E4' }],
    ['squares that are not strings', { from: 52, to: ['e4'] }],
    ['a string', 'e2e4'],
  ])('returns no square for %s', (_label, move) => {
    expect(getLastMoveSquares(move)).toBe(NO_LAST_MOVE_SQUARES);
  });
});

describe('highlightLastMove', () => {
  beforeEach(() => {
    document.body.innerHTML = ['e2', 'e4', 'd7', 'd5']
      .map((square) => `<button class="square" data-position="${square}"></button>`)
      .join('');
  });

  /** @returns {string[]} The squares marked as the last move, in the order of the page. */
  function lastMoveSquares() {
    return [...document.querySelectorAll('.last-move')].map((node) => node.dataset.position);
  }

  it('marks the start and target squares of the last move', () => {
    highlightLastMove({ lastMove: { from: 'e2', to: 'e4' } });

    expect(lastMoveSquares()).toEqual(['e2', 'e4']);
  });

  it('replaces the marks of the previous move', () => {
    highlightLastMove({ lastMove: { from: 'e2', to: 'e4' } });
    highlightLastMove({ lastMove: { from: 'd7', to: 'd5' } });

    expect(lastMoveSquares()).toEqual(['d7', 'd5']);
  });

  it('keeps the marks of a move rendered twice', () => {
    const lastMove = { from: 'e2', to: 'e4' };
    highlightLastMove({ lastMove });
    highlightLastMove({ lastMove });

    expect(lastMoveSquares()).toEqual(['e2', 'e4']);
  });

  it.each([
    ['null, at the start of a game', null],
    ['undefined', undefined],
    ['a move whose squares are not squares', { from: 'z9', to: 'e0' }],
  ])('clears every mark for %s', (_label, lastMove) => {
    highlightLastMove({ lastMove: { from: 'e2', to: 'e4' } });
    highlightLastMove({ lastMove });

    expect(lastMoveSquares()).toEqual([]);
  });

  it('skips a square missing from the page and marks the other one', () => {
    highlightLastMove({ lastMove: { from: 'g1', to: 'e4' } });

    expect(lastMoveSquares()).toEqual(['e4']);
  });

  it('marks only the squares under the given root', () => {
    const otherBoard = document.createElement('div');
    otherBoard.innerHTML = '<button class="square" data-position="e2"></button>';
    document.body.append(otherBoard);

    highlightLastMove({ lastMove: { from: 'e2', to: 'e4' }, root: otherBoard });

    const marked = [...document.querySelectorAll('.last-move')];
    expect(marked).toEqual([otherBoard.querySelector('.square')]);
  });
});
