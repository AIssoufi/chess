import { describe, it, expect } from 'vitest';
import { isCastlingRook } from '../app/js/castling/utils.js';

const UNMOVED_WHITE_ROOK = Object.freeze({ type: 'rook', color: 'white', hasMoved: false });

describe('isCastlingRook', () => {
  it.each(['white', 'black'])('accepts an unmoved rook of the king color, %s', (color) => {
    expect(isCastlingRook({ piece: { ...UNMOVED_WHITE_ROOK, color }, color })).toBe(true);
  });

  it('refuses an unmoved rook of the opponent', () => {
    expect(isCastlingRook({ piece: UNMOVED_WHITE_ROOK, color: 'black' })).toBe(false);
  });

  it('refuses a rook that has moved', () => {
    const piece = { ...UNMOVED_WHITE_ROOK, hasMoved: true };

    expect(isCastlingRook({ piece, color: 'white' })).toBe(false);
  });

  it('refuses another unmoved piece of the king color', () => {
    const piece = { ...UNMOVED_WHITE_ROOK, type: 'queen' };

    expect(isCastlingRook({ piece, color: 'white' })).toBe(false);
  });

  it.each([
    ['an empty square', { piece: null, color: 'white' }],
    ['a missing piece', { color: 'white' }],
    ['a missing color', { piece: UNMOVED_WHITE_ROOK }],
    ['a rook and a king without color', { piece: { type: 'rook', hasMoved: false } }],
    ['an unknown color', { piece: { ...UNMOVED_WHITE_ROOK, color: 'red' }, color: 'red' }],
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
