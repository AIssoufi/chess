// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';
import PieceFactory from '../app/js/PieceFactory.js';
import { GAME_OUTCOMES } from '../app/js/game-over/constants.js';
import {
  clearCheck,
  getSquareNode,
  markCheck,
  renderCaptures,
  renderCurrentPlayer,
  renderMoveList,
  renderPieces,
  renderSquareLabels,
  renderStatus,
} from '../app/js/rendering/render.js';
import { getKingSquare } from '../app/js/rendering/utils.js';
import { BOARD_FILES, BOARD_SIZE, FIRST_RANK } from '../app/js/squares/constants.js';

const NO_SELECTION = { square: null, moves: [] };
const WHITE_KING = { type: 'king', color: 'white' };
const BLACK_KING = { type: 'king', color: 'black' };
const PROMOTION_MOVE = {
  from: 'g7',
  to: 'g8',
  piece: { type: 'pawn', color: 'white' },
  promotion: true,
};

/** Builds the board, the panels and the live region that the rendering functions fill. */
function buildPage() {
  const squares = [];
  for (let rank = BOARD_SIZE; rank >= FIRST_RANK; rank--) {
    for (const file of BOARD_FILES) {
      squares.push(`<button class="square" data-position="${file}${rank}"></button>`);
    }
  }
  document.body.innerHTML = `
    <div data-color="black" class="control"><span id="black-capture-count">0</span>
      <div id="black-captures"></div></div>
    <div class="container-squares">${squares.join('')}</div>
    <div data-color="white" class="control current-player">
      <span id="white-capture-count">0</span><div id="white-captures"></div></div>
    <p class="game-status"></p>
    <section class="move-list"><p class="move-list__empty">Aucun coup joué</p>
      <ol class="move-list__moves"></ol></section>`;
}

/**
 * Returns the piece shown on a square.
 *
 * @param {string} square The square, such as `'e2'`.
 * @returns {DOMStringMap | undefined} The dataset of its piece node, if any.
 */
function pieceOn(square) {
  return getSquareNode({ square }).querySelector('.piece')?.dataset;
}

let game;
let factory;

beforeEach(() => {
  buildPage();
  game = new Chessboard();
  game.initialize();
  factory = new PieceFactory();
});

describe('getKingSquare', () => {
  it('finds the king of each color at the start', () => {
    expect(getKingSquare({ board: game.board, color: 'white' })).toBe('e1');
    expect(getKingSquare({ board: game.board, color: 'black' })).toBe('e8');
  });

  it('returns null for a board without a king of that color', () => {
    expect(getKingSquare({ board: new Map([['e8', BLACK_KING]]), color: 'white' })).toBeNull();
  });

  it('skips the empty entries of the board', () => {
    const board = new Map([
      ['a1', null],
      ['e1', WHITE_KING],
    ]);
    expect(getKingSquare({ board, color: 'white' })).toBe('e1');
  });

  it.each([
    ['no parameters', undefined],
    ['null', null],
    ['a board that is not a Map', { board: { e1: WHITE_KING }, color: 'white' }],
    ['an unknown color', { board: new Map([['e1', WHITE_KING]]), color: 'red' }],
  ])('returns null for %s', (_label, params) => {
    expect(getKingSquare(params)).toBeNull();
  });
});

describe('getSquareNode', () => {
  it('returns the node of a square', () => {
    expect(getSquareNode({ square: 'e4' }).dataset.position).toBe('e4');
  });

  it.each([
    ['a value that is not a square', 'z9'],
    ['a value with a quote', 'e4"]'],
    ['undefined', undefined],
    ['a number', 42],
  ])('returns null for %s', (_label, square) => {
    expect(getSquareNode({ square })).toBeNull();
  });

  it('searches inside the given root only', () => {
    const root = document.createElement('div');
    expect(getSquareNode({ root, square: 'e4' })).toBeNull();
  });
});

describe('renderPieces', () => {
  it('shows the 32 pieces of the start, hidden from screen readers', () => {
    renderPieces({ game, factory });
    const pieces = document.querySelectorAll('.container-squares .piece');
    expect(pieces).toHaveLength(32);
    expect([...pieces].every((piece) => piece.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(pieceOn('e1')).toMatchObject({ type: 'king', color: 'white' });
  });

  it('replaces the pieces shown before, once the game moved', () => {
    renderPieces({ game, factory });
    game.move({ from: 'e2', to: 'e4' });
    renderPieces({ game, factory });
    expect(document.querySelectorAll('.container-squares .piece')).toHaveLength(32);
    expect(pieceOn('e2')).toBeUndefined();
    expect(pieceOn('e4')).toMatchObject({ type: 'pawn', color: 'white' });
  });

  it('skips a piece of an unknown type and a square missing from the page', () => {
    game.board.set('e4', { type: 'dragon', color: 'white' });
    game.board.set('z9', { type: 'queen', color: 'white' });
    renderPieces({ game, factory });
    expect(pieceOn('e4')).toBeUndefined();
    expect(document.querySelectorAll('.container-squares .piece')).toHaveLength(32);
  });
});

describe('renderSquareLabels', () => {
  it('names each square after its piece, or as empty', () => {
    renderSquareLabels({ game, selection: NO_SELECTION });
    expect(getSquareNode({ square: 'e1' }).getAttribute('aria-label')).toBe('e1, roi blanc');
    expect(getSquareNode({ square: 'e4' }).getAttribute('aria-label')).toBe('e4, vide');
    expect(getSquareNode({ square: 'e2' }).getAttribute('aria-selected')).toBe('false');
  });

  it('marks the selected square and names the squares it can move to', () => {
    renderSquareLabels({ game, selection: { square: 'e2', moves: ['e3', 'e4'] } });
    expect(getSquareNode({ square: 'e2' }).getAttribute('aria-selected')).toBe('true');
    expect(getSquareNode({ square: 'e4' }).getAttribute('aria-label')).toBe(
      'e4, vide, coup possible'
    );
  });

  it('names the square marked in check', () => {
    getSquareNode({ square: 'e1' }).classList.add('check');
    renderSquareLabels({ game, selection: NO_SELECTION });
    expect(getSquareNode({ square: 'e1' }).getAttribute('aria-label')).toBe(
      'e1, roi blanc, en échec'
    );
  });

  it('leaves a square without position unnamed and unselected', () => {
    const squareNode = getSquareNode({ square: 'e4' });
    delete squareNode.dataset.position;
    renderSquareLabels({ game, selection: NO_SELECTION });
    expect(squareNode.hasAttribute('aria-label')).toBe(false);
    expect(squareNode.getAttribute('aria-selected')).toBe('false');
  });
});

describe('renderStatus', () => {
  it('announces the side to play at the start of a game', () => {
    renderStatus({ game, lastMove: null, outcome: GAME_OUTCOMES.ongoing, color: 'white' });
    expect(document.querySelector('.game-status').textContent).toBe('Aux blancs de jouer.');
  });

  it('announces the last move', () => {
    const lastMove = game.move({ from: 'e2', to: 'e4' });
    renderStatus({ game, lastMove, outcome: GAME_OUTCOMES.ongoing, color: 'black' });
    expect(document.querySelector('.game-status').textContent).toBe(
      'Dernier coup\u00a0: pion blanc de e2 à e4. Aux noirs de jouer.'
    );
  });

  it('announces the piece a pawn was promoted to', () => {
    game.board.set('g8', { type: 'queen', color: 'white' });
    renderStatus({
      game,
      lastMove: PROMOTION_MOVE,
      outcome: GAME_OUTCOMES.ongoing,
      color: 'black',
    });
    expect(document.querySelector('.game-status').textContent).toBe(
      'Dernier coup\u00a0: pion blanc de g7 à g8, promu en dame. Aux noirs de jouer.'
    );
  });

  it('announces a promotion without its piece when the square is empty', () => {
    game.board.delete('g8');
    renderStatus({
      game,
      lastMove: PROMOTION_MOVE,
      outcome: GAME_OUTCOMES.ongoing,
      color: 'black',
    });
    expect(document.querySelector('.game-status').textContent).toBe(
      'Dernier coup\u00a0: pion blanc de g7 à g8. Aux noirs de jouer.'
    );
  });
});

describe('renderCaptures', () => {
  it('shows no capture and a count of 0 at the start', () => {
    renderCaptures({ game, factory });
    expect(document.querySelector('#white-capture-count').textContent).toBe('0');
    expect(document.querySelector('#white-captures').children).toHaveLength(0);
  });

  it('shows each captured piece and the count next to the capturing color', () => {
    game.captures.white.push({ type: 'pawn', color: 'black' });
    renderCaptures({ game, factory });
    expect(document.querySelector('#white-capture-count').textContent).toBe('1');
    expect(document.querySelector('#white-captures .piece').dataset.type).toBe('pawn');
  });

  it('replaces the captures shown before and skips an unknown piece', () => {
    game.captures.black.push({ type: 'knight', color: 'white' });
    renderCaptures({ game, factory });
    game.captures.black.push({ type: 'dragon', color: 'white' });
    renderCaptures({ game, factory });
    expect(document.querySelector('#black-capture-count').textContent).toBe('2');
    expect(document.querySelector('#black-captures').children).toHaveLength(1);
  });
});

describe('renderCurrentPlayer', () => {
  it('highlights the panel of the color to move, and only that one', () => {
    renderCurrentPlayer({ color: 'black' });
    expect(document.querySelectorAll('.current-player')).toHaveLength(1);
    expect(document.querySelector('.current-player').dataset.color).toBe('black');
  });

  it('highlights no panel for an unknown color', () => {
    renderCurrentPlayer({ color: 'red' });
    expect(document.querySelectorAll('.current-player')).toHaveLength(0);
  });
});

describe('markCheck and clearCheck', () => {
  it('marks the square of the king of the color, and only that one', () => {
    markCheck({ board: game.board, color: 'white' });
    markCheck({ board: game.board, color: 'black' });
    expect([...document.querySelectorAll('.check')].map((node) => node.dataset.position)).toEqual([
      'e8',
    ]);
  });

  it('marks nothing on a board without that king', () => {
    markCheck({ board: new Map([['e8', BLACK_KING]]), color: 'white' });
    expect(document.querySelectorAll('.check')).toHaveLength(0);
  });

  it('removes the mark', () => {
    markCheck({ board: game.board, color: 'white' });
    clearCheck();
    expect(document.querySelectorAll('.check')).toHaveLength(0);
  });

  it('does nothing on a board without a mark', () => {
    expect(() => clearCheck()).not.toThrow();
  });
});

describe('renderMoveList', () => {
  const list = () => document.querySelector('.move-list__moves');
  const isEmptyNoteShown = () => !document.querySelector('.move-list__empty').hidden;
  /** @returns {{ number: number, moves: string[] }[]} Each turn, with its number and its moves. */
  const shownTurns = () =>
    [...list().children].map((item) => ({
      number: item.value,
      moves: [...item.querySelectorAll('.move-list__move')].map((move) => move.textContent),
    }));

  it('numbers the moves by turn, white then black, and hides the note', () => {
    renderMoveList({ notations: ['e4', 'e5', 'Cf3'] });

    expect(shownTurns()).toEqual([
      { number: 1, moves: ['e4', 'e5'] },
      { number: 2, moves: ['Cf3'] },
    ]);
    expect(list().children[0].textContent).toBe('e4 e5');
    expect(isEmptyNoteShown()).toBe(false);
  });

  it('replaces the moves shown before', () => {
    renderMoveList({ notations: ['e4', 'e5', 'Cf3'] });
    renderMoveList({ notations: ['d4'] });

    expect(shownTurns()).toEqual([{ number: 1, moves: ['d4'] }]);
  });

  it('empties the list and shows the note again for a game without moves', () => {
    renderMoveList({ notations: ['e4'] });
    renderMoveList({ notations: [] });

    expect(list().children).toHaveLength(0);
    expect(isEmptyNoteShown()).toBe(true);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'e4 e5'],
    ['an object', { white: 'e4' }],
  ])('empties the list for %s instead of an array', (_name, notations) => {
    renderMoveList({ notations: ['e4'] });
    renderMoveList({ notations });

    expect(list().children).toHaveLength(0);
    expect(isEmptyNoteShown()).toBe(true);
  });

  it('skips a move that is not a string and keeps the rest of its turn', () => {
    renderMoveList({ notations: [42, 'e5', 'Cf3', null] });

    expect(shownTurns()).toEqual([
      { number: 1, moves: ['e5'] },
      { number: 2, moves: ['Cf3'] },
    ]);
  });

  it('empties the list when called without parameters', () => {
    renderMoveList({ notations: ['e4'] });
    renderMoveList();

    expect(list().children).toHaveLength(0);
  });

  it('scrolls the list to the last move', () => {
    Object.defineProperty(list(), 'scrollHeight', { configurable: true, value: 480 });

    renderMoveList({ notations: ['e4', 'e5'] });

    expect(list().scrollTop).toBe(480);
  });

  it('searches inside the given root only', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ol class="move-list__moves"></ol>';

    renderMoveList({ notations: ['e4'], root });

    expect(root.querySelectorAll('li')).toHaveLength(1);
    expect(list().children).toHaveLength(0);
    expect(isEmptyNoteShown()).toBe(true);
  });

  it('does nothing on a page without a move list', () => {
    document.body.innerHTML = '';

    expect(() => renderMoveList({ notations: ['e4'] })).not.toThrow();
  });
});
