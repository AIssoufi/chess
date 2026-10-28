import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';
import { ALERT_CHOICES } from '../app/js/alerts/constants.js';
import { DRAW_REASONS, FIFTY_MOVE_RULE_HALF_MOVES } from '../app/js/draws/constants.js';
import { GAME_OUTCOMES, GAME_OVER_ALERTS } from '../app/js/game-over/constants.js';
import { getGameOutcome, getOutcomeAlert } from '../app/js/game-over/utils.js';

const INDEX_PAGE = readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
const FOOLS_MATE = [
  ['f2', 'f3'],
  ['e7', 'e5'],
  ['g2', 'g4'],
  ['d8', 'h4'],
];
/** Both knights go out and back twice: the starting position occurs a third time. */
const KNIGHT_ROUND_TRIP = [
  ['g1', 'f3'],
  ['g8', 'f6'],
  ['f3', 'g1'],
  ['f6', 'g8'],
];
const THREEFOLD_REPETITION = [...KNIGHT_ROUND_TRIP, ...KNIGHT_ROUND_TRIP];
/**
 * The black queen checks the white king from h4 three times, the king going to e3 and back: the
 * third check repeats its position a third time.
 */
const PERPETUAL_CHECK_CYCLE = [
  ['f2', 'e3'],
  ['h4', 'e7'],
  ['e3', 'f2'],
  ['e7', 'h4'],
];
const PERPETUAL_CHECK = [
  ['f2', 'f3'],
  ['e7', 'e5'],
  ['e1', 'f2'],
  ['d8', 'h4'],
  ...PERPETUAL_CHECK_CYCLE,
  ...PERPETUAL_CHECK_CYCLE,
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
    for (const [from, to] of FOOLS_MATE) game.move({ from, to });

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.checkmate,
      color: 'white',
      winner: 'black',
      isCheck: true,
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
      isCheck: true,
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
      isCheck: false,
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
      isCheck: true,
    });
  });

  it('reports a draw and its reason when only the kings are left', () => {
    setUpBoard({
      pieces: { e1: { type: 'king', color: 'white' }, e8: { type: 'king', color: 'black' } },
      colorToPlay: 'black',
    });

    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.draw,
      color: 'black',
      winner: null,
      isCheck: false,
      drawReason: DRAW_REASONS.insufficientMaterial,
    });
  });

  it('reports a draw by repetition once the starting position occurs a third time', () => {
    for (const [from, to] of THREEFOLD_REPETITION) game.move({ from, to });

    expect(getGameOutcome({ game })).toMatchObject({
      outcome: GAME_OUTCOMES.draw,
      drawReason: DRAW_REASONS.threefoldRepetition,
    });
  });

  describe('a checking move that also ends the game in a draw', () => {
    it('keeps the check after a capture that leaves too few pieces to mate', () => {
      setUpBoard({
        pieces: {
          e1: { type: 'king', color: 'white' },
          b3: { type: 'bishop', color: 'white' },
          a8: { type: 'king', color: 'black' },
          d5: { type: 'rook', color: 'black' },
        },
        colorToPlay: 'white',
      });
      game.move({ from: 'b3', to: 'd5' });

      expect(getGameOutcome({ game })).toEqual({
        outcome: GAME_OUTCOMES.draw,
        color: 'black',
        winner: null,
        isCheck: true,
        drawReason: DRAW_REASONS.insufficientMaterial,
      });
    });

    it('keeps the check of a perpetual check that repeats the position a third time', () => {
      for (const [from, to] of PERPETUAL_CHECK) game.move({ from, to });

      expect(getGameOutcome({ game })).toMatchObject({
        outcome: GAME_OUTCOMES.draw,
        isCheck: true,
        drawReason: DRAW_REASONS.threefoldRepetition,
      });
    });

    it('keeps the check of a move that reaches the fifty-move limit', () => {
      setUpBoard({
        pieces: {
          e1: { type: 'king', color: 'white' },
          a1: { type: 'rook', color: 'white' },
          h8: { type: 'king', color: 'black' },
          b7: { type: 'rook', color: 'black' },
        },
        colorToPlay: 'white',
      });
      game.halfMoveClock = FIFTY_MOVE_RULE_HALF_MOVES - 1;
      game.move({ from: 'a1', to: 'a8' });

      expect(getGameOutcome({ game })).toMatchObject({
        outcome: GAME_OUTCOMES.draw,
        isCheck: true,
        drawReason: DRAW_REASONS.fiftyMoveRule,
      });
    });

    it('reports no check for a draw that leaves the king out of check', () => {
      for (const [from, to] of THREEFOLD_REPETITION) game.move({ from, to });

      expect(getGameOutcome({ game })).toMatchObject({
        outcome: GAME_OUTCOMES.draw,
        isCheck: false,
      });
    });
  });

  it('reports a checkmate rather than a draw by the fifty-move rule', () => {
    for (const [from, to] of FOOLS_MATE) game.move({ from, to });
    game.halfMoveClock = 100;

    expect(getGameOutcome({ game })).toMatchObject({ outcome: GAME_OUTCOMES.checkmate });
  });

  it('reports a stalemate rather than a draw by insufficient material', () => {
    setUpBoard({
      pieces: {
        a8: { type: 'king', color: 'black' },
        c8: { type: 'king', color: 'white' },
        b6: { type: 'bishop', color: 'white' },
      },
      colorToPlay: 'black',
    });

    expect(getGameOutcome({ game })).toMatchObject({ outcome: GAME_OUTCOMES.stalemate });
  });

  it('reports an ongoing game at the start', () => {
    expect(getGameOutcome({ game })).toEqual({
      outcome: GAME_OUTCOMES.ongoing,
      color: 'white',
      winner: null,
      isCheck: false,
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
      isCheck: false,
    });
  });
});

describe('game over dialog', () => {
  it('is a dialog whose form closes it', () => {
    expect(INDEX_PAGE).toMatch(/<dialog class="alert__wrapper">\s*<form method="dialog">/);
  });

  it.each(Object.entries(GAME_OVER_ALERTS))(
    'has the %s alert "%s", with a titled heading and its replay and review buttons',
    (_outcome, alertName) => {
      const alert = INDEX_PAGE.match(
        new RegExp(`<div class="alert ${alertName}">([\\s\\S]*?)</div>`)
      );

      expect(alert).not.toBeNull();
      expect(alert[1]).toMatch(/<h2 id="[a-z-]+">/);
      expect(alert[1]).toContain(`<button value="${ALERT_CHOICES.replay}">Rejouer&nbsp;!</button>`);
      expect(alert[1]).toContain(
        `<button value="${ALERT_CHOICES.review}">Voir la position</button>`
      );
    }
  );
});

describe('getOutcomeAlert', () => {
  it.each(Object.entries(GAME_OVER_ALERTS))('opens the alert of a %s', (outcome, alertName) => {
    expect(getOutcomeAlert(outcome)).toBe(alertName);
  });

  it.each([
    ['a check', GAME_OUTCOMES.check],
    ['a game that goes on', GAME_OUTCOMES.ongoing],
    ['an unknown outcome', 'resignation'],
    ['a key that every object inherits', 'toString'],
    ['undefined', undefined],
  ])('opens no alert for %s', (_label, outcome) => {
    expect(getOutcomeAlert(outcome)).toBeNull();
  });
});
