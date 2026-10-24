import { describe, it, expect } from 'vitest';
import { getStatusMessage } from '../app/js/status/utils.js';

const WHITE_PAWN = { type: 'pawn', color: 'white' };
const BLACK_PAWN = { type: 'pawn', color: 'black' };
const PAWN_DOUBLE_STEP = { from: 'e2', to: 'e4', piece: WHITE_PAWN, captured: null };

describe('getStatusMessage', () => {
  it.each([
    ['white', 'Aux blancs de jouer.'],
    ['black', 'Aux noirs de jouer.'],
  ])('announces the side to play, %s, before any move', (color, expected) => {
    expect(getStatusMessage({ outcome: 'ongoing', color })).toBe(expected);
  });

  it('announces the last move, then the side to play', () => {
    expect(
      getStatusMessage({ lastMove: PAWN_DOUBLE_STEP, outcome: 'ongoing', color: 'black' })
    ).toBe('Dernier coup : pion blanc de e2 à e4. Aux noirs de jouer.');
  });

  it('names the piece taken', () => {
    const lastMove = {
      from: 'e4',
      to: 'd5',
      piece: WHITE_PAWN,
      captured: { type: 'queen', color: 'black' },
    };

    expect(getStatusMessage({ lastMove, outcome: 'ongoing', color: 'black' })).toBe(
      'Dernier coup : pion blanc de e4 à d5, prend dame noire. Aux noirs de jouer.'
    );
  });

  it('names the pawn taken en passant, which is not on the target square', () => {
    const lastMove = {
      from: 'e5',
      to: 'd6',
      piece: WHITE_PAWN,
      captured: null,
      specialMove: 'en-passant',
    };

    expect(getStatusMessage({ lastMove, outcome: 'ongoing', color: 'black' })).toBe(
      'Dernier coup : pion blanc de e5 à d6, prend pion noir, en-passant. Aux noirs de jouer.'
    );
  });

  it.each([
    ['kingside-castling', 'g8', 'petit-roque'],
    ['queenside-castling', 'c8', 'grand-roque'],
  ])('names the castling %s', (specialMove, to, label) => {
    const lastMove = { from: 'e8', to, piece: { type: 'king', color: 'black' }, specialMove };

    expect(getStatusMessage({ lastMove, outcome: 'ongoing', color: 'white' })).toBe(
      `Dernier coup : roi noir de e8 à ${to}, ${label}. Aux blancs de jouer.`
    );
  });

  it.each([
    ['queen', 'dame'],
    ['rook', 'tour'],
    ['bishop', 'fou'],
    ['knight', 'cavalier'],
  ])('names the promotion to a %s', (promotedType, label) => {
    const lastMove = {
      from: 'e7',
      to: 'd8',
      piece: WHITE_PAWN,
      captured: { type: 'queen', color: 'black' },
      promotion: true,
    };

    expect(getStatusMessage({ lastMove, promotedType, outcome: 'ongoing', color: 'black' })).toBe(
      `Dernier coup : pion blanc de e7 à d8, prend dame noire, promu en ${label}. Aux noirs de jouer.`
    );
  });

  it.each([['unicorn'], ['toString'], [''], [undefined], [null]])(
    'leaves out a promotion to %j, which is no piece type',
    (promotedType) => {
      const lastMove = { from: 'e7', to: 'e8', piece: WHITE_PAWN, promotion: true };

      expect(getStatusMessage({ lastMove, promotedType, outcome: 'ongoing', color: 'black' })).toBe(
        'Dernier coup : pion blanc de e7 à e8. Aux noirs de jouer.'
      );
    }
  );

  it('leaves out the promoted type of a move that is no promotion', () => {
    expect(
      getStatusMessage({
        lastMove: PAWN_DOUBLE_STEP,
        promotedType: 'queen',
        outcome: 'ongoing',
        color: 'black',
      })
    ).toBe('Dernier coup : pion blanc de e2 à e4. Aux noirs de jouer.');
  });

  it.each([
    ['white', 'Les blancs sont en échec. Aux blancs de jouer.'],
    ['black', 'Les noirs sont en échec. Aux noirs de jouer.'],
  ])('announces that %s is in check', (color, expected) => {
    expect(getStatusMessage({ outcome: 'check', color })).toBe(expected);
  });

  it.each([
    ['black', 'Échec et mat, les noirs gagnent.'],
    ['white', 'Échec et mat, les blancs gagnent.'],
  ])('announces a checkmate won by %s, without a side to play', (winner, expected) => {
    const lastMove = { from: 'd8', to: 'h4', piece: { type: 'queen', color: 'black' } };

    expect(getStatusMessage({ outcome: 'checkmate', color: 'white', winner })).toBe(expected);
    expect(getStatusMessage({ lastMove, outcome: 'checkmate', color: 'white', winner })).toBe(
      `Dernier coup : dame noire de d8 à h4. ${expected}`
    );
  });

  it('announces a stalemate as a draw, without a side to play', () => {
    expect(getStatusMessage({ outcome: 'stalemate', color: 'black' })).toBe('Pat, match nul.');
  });

  it.each([['red'], ['toString'], [''], [undefined], [null]])(
    'leaves out the winner %j, which is no color',
    (winner) => {
      expect(getStatusMessage({ outcome: 'checkmate', color: 'white', winner })).toBe('');
    }
  );

  it.each([['red'], ['toString'], [''], [undefined], [null]])(
    'leaves out the side to play %j, which is no color',
    (color) => {
      expect(getStatusMessage({ lastMove: PAWN_DOUBLE_STEP, outcome: 'check', color })).toBe(
        'Dernier coup : pion blanc de e2 à e4.'
      );
    }
  );

  it.each([['unknown'], [''], [undefined], [null]])(
    'reads the outcome %j as an ongoing game',
    (outcome) => {
      expect(getStatusMessage({ outcome, color: 'white' })).toBe('Aux blancs de jouer.');
    }
  );

  it.each([
    ['a missing piece', { from: 'e2', to: 'e4' }],
    ['an unknown piece', { from: 'e2', to: 'e4', piece: { type: 'unicorn', color: 'white' } }],
    ['a missing origin', { to: 'e4', piece: WHITE_PAWN }],
    ['an invalid origin', { from: 'e9', to: 'e4', piece: WHITE_PAWN }],
    ['an invalid target', { from: 'e2', to: 'E4', piece: WHITE_PAWN }],
    ['a string', 'e2-e4'],
    ['null', null],
  ])('leaves out a last move with %s', (_, lastMove) => {
    expect(getStatusMessage({ lastMove, outcome: 'ongoing', color: 'black' })).toBe(
      'Aux noirs de jouer.'
    );
  });

  it('leaves out a captured piece that is unknown', () => {
    const lastMove = { ...PAWN_DOUBLE_STEP, captured: { type: 'unicorn', color: 'black' } };

    expect(getStatusMessage({ lastMove, outcome: 'ongoing', color: 'black' })).toBe(
      'Dernier coup : pion blanc de e2 à e4. Aux noirs de jouer.'
    );
  });

  it('leaves out an unknown special move', () => {
    const lastMove = { ...PAWN_DOUBLE_STEP, specialMove: 'toString' };

    expect(getStatusMessage({ lastMove, outcome: 'ongoing', color: 'black' })).toBe(
      'Dernier coup : pion blanc de e2 à e4. Aux noirs de jouer.'
    );
  });

  it('names the white pawn that a black pawn takes en passant', () => {
    const lastMove = { from: 'd4', to: 'e3', piece: BLACK_PAWN, specialMove: 'en-passant' };

    expect(getStatusMessage({ lastMove, outcome: 'ongoing', color: 'white' })).toBe(
      'Dernier coup : pion noir de d4 à e3, prend pion blanc, en-passant. Aux blancs de jouer.'
    );
  });

  it('returns an empty string without parameters', () => {
    expect(getStatusMessage()).toBe('');
  });
});
