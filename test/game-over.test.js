import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';
import { GAME_OUTCOMES, GAME_OVER_ALERTS } from '../app/js/game-over/constants.js';
import { getGameOutcome } from '../app/js/game-over/utils.js';

const INDEX_PAGE = readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
const FOOLS_MATE = [
  ['f2', 'f3'],
  ['e7', 'e5'],
  ['g2', 'g4'],
  ['d8', 'h4'],
];

let game;

/**
 * Empties the board, then puts the given pieces on it and gives the move to a color.
 *
 * @param {object} params
 * @param {Record<string, { type: string, color: string }>} params.pieces Pieces by square.
 * @param {'white' | 'black'} params.colorToPlay The color to play.
 */
function setUpBoard({ pieces, colorToPlay }) {
  game.board.clear();
  for (const [square, piece] of Object.entries(pieces)) {
    game.board.set(square, { ...piece, hasMoved: true });
  }
  game.currentColor = colorToPlay;
}

beforeEach(() => {
  game = new Chessboard();
  game.initialize();
});

describe('getGameOutcome', () => {
  it('reports a checkmate and its winner after the fool’s mate', () => {
    for (const [from, to] of FOOLS_MATE) game.move(from, to);

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.checkmate,
      color: 'white',
      winner: 'black',
    });
  });

  it('reports white as the winner when black is mated', () => {
    setUpBoard({
      pieces: {
        h8: { type: 'king', color: 'black' },
        g7: { type: 'pawn', color: 'black' },
        h7: { type: 'pawn', color: 'black' },
        a8: { type: 'rook', color: 'white' },
        g1: { type: 'king', color: 'white' },
      },
      colorToPlay: 'black',
    });

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.checkmate,
      color: 'black',
      winner: 'white',
    });
  });

  it('reports a stalemate without a winner', () => {
    setUpBoard({
      pieces: {
        a8: { type: 'king', color: 'black' },
        b6: { type: 'queen', color: 'white' },
        c7: { type: 'king', color: 'white' },
      },
      colorToPlay: 'black',
    });

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.stalemate,
      color: 'black',
      winner: null,
    });
  });

  it('reports a check that can be escaped', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'king', color: 'white' },
        e4: { type: 'rook', color: 'white' },
        e8: { type: 'king', color: 'black' },
      },
      colorToPlay: 'black',
    });

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.check,
      color: 'black',
      winner: null,
    });
  });

  it('reports an ongoing game at the start', () => {
    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.ongoing,
      color: 'white',
      winner: null,
    });
  });

  it.each([
    ['no parameters', undefined],
    ['no game', {}],
    ['a null game', { game: null }],
  ])('reports an ongoing game without colors when given %s', (_label, params) => {
    expect(getGameOutcome(params)).toEqual({
      outcome: GAME_OUTCOMES.ongoing,
      color: null,
      winner: null,
    });
  });
});

describe('game over dialog', () => {
  it('is a dialog whose form closes it', () => {
    expect(INDEX_PAGE).toMatch(/<dialog class="alert__wrapper">\s*<form method="dialog">/);
  });

  it.each(Object.entries(GAME_OVER_ALERTS))(
    'has the %s alert "%s", with a titled heading',
    (_outcome, alertName) => {
      const alert = INDEX_PAGE.match(
        new RegExp(`<div class="alert ${alertName}">([\\s\\S]*?)</div>`)
      );

      expect(alert).not.toBeNull();
      expect(alert[1]).toMatch(/<h2 id="[a-z-]+">/);
      expect(alert[1]).toContain('<button>Rejouer !</button>');
    }
  );
});
