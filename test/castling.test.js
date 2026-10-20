import { describe, it, expect } from 'vitest';
import { isCastlingRook } from '../app/js/castling/utils.js';

const UNMOVED_WHITE_ROOK = Object.freeze({ type: 'tour', couleur: 'blanche', aBouge: false });

describe('isCastlingRook', () => {
  it.each(['blanche', 'noire'])('accepts an unmoved rook of the king color, %s', (couleur) => {
    expect(isCastlingRook({ piece: { ...UNMOVED_WHITE_ROOK, couleur }, couleur })).toBe(true);
  });

  it('refuses an unmoved rook of the opponent', () => {
    expect(isCastlingRook({ piece: UNMOVED_WHITE_ROOK, couleur: 'noire' })).toBe(false);
  });

  it('refuses a rook that has moved', () => {
    const piece = { ...UNMOVED_WHITE_ROOK, aBouge: true };

    expect(isCastlingRook({ piece, couleur: 'blanche' })).toBe(false);
  });

  it('refuses another unmoved piece of the king color', () => {
    const piece = { ...UNMOVED_WHITE_ROOK, type: 'dame' };

    expect(isCastlingRook({ piece, couleur: 'blanche' })).toBe(false);
  });

  it.each([
    ['an empty square', { piece: null, couleur: 'blanche' }],
    ['a missing piece', { couleur: 'blanche' }],
    ['a missing color', { piece: UNMOVED_WHITE_ROOK }],
    ['a rook and a king without color', { piece: { type: 'tour', aBouge: false } }],
    ['an unknown color', { piece: { ...UNMOVED_WHITE_ROOK, couleur: 'rouge' }, couleur: 'rouge' }],
    ['an empty object', {}],
  ])('refuses %s', (_label, params) => {
    expect(isCastlingRook(params)).toBe(false);
  });

  it.each([
    ['no argument', undefined],
    ['null', null],
  ])('refuses %s', (_label, params) => {
    expect(isCastlingRook(params)).toBe(false);
  });
});
