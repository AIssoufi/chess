import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeEach } from 'vitest';
import Echiquier from '../app/js/Chessboard.js';
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
 * @param {Record<string, { type: string, couleur: string }>} params.pieces Pieces by square.
 * @param {'blanche' | 'noire'} params.colorToPlay The color to play.
 */
function setUpBoard({ pieces, colorToPlay }) {
  game.plateau.clear();
  for (const [square, piece] of Object.entries(pieces)) {
    game.plateau.set(square, { ...piece, aBouge: true });
  }
  game.couleurCourante = colorToPlay;
}

beforeEach(() => {
  game = new Echiquier();
  game.initialiser();
});

describe('getGameOutcome', () => {
  it('reports a checkmate and its winner after the fool’s mate', () => {
    for (const [from, to] of FOOLS_MATE) game.deplacer(from, to);

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.checkmate,
      color: 'blanche',
      winner: 'noire',
    });
  });

  it('reports white as the winner when black is mated', () => {
    setUpBoard({
      pieces: {
        h8: { type: 'roi', couleur: 'noire' },
        g7: { type: 'pion', couleur: 'noire' },
        h7: { type: 'pion', couleur: 'noire' },
        a8: { type: 'tour', couleur: 'blanche' },
        g1: { type: 'roi', couleur: 'blanche' },
      },
      colorToPlay: 'noire',
    });

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.checkmate,
      color: 'noire',
      winner: 'blanche',
    });
  });

  it('reports a stalemate without a winner', () => {
    setUpBoard({
      pieces: {
        a8: { type: 'roi', couleur: 'noire' },
        b6: { type: 'dame', couleur: 'blanche' },
        c7: { type: 'roi', couleur: 'blanche' },
      },
      colorToPlay: 'noire',
    });

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.stalemate,
      color: 'noire',
      winner: null,
    });
  });

  it('reports a check that can be escaped', () => {
    setUpBoard({
      pieces: {
        e1: { type: 'roi', couleur: 'blanche' },
        e4: { type: 'tour', couleur: 'blanche' },
        e8: { type: 'roi', couleur: 'noire' },
      },
      colorToPlay: 'noire',
    });

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.check,
      color: 'noire',
      winner: null,
    });
  });

  it('reports an ongoing game at the start', () => {
    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.ongoing,
      color: 'blanche',
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
