import { describe, it, expect } from 'vitest';
import { getEnPassantCaptureSquare } from '../app/js/squares/utils.js';

describe('getEnPassantCaptureSquare', () => {
  it('returns the square below the target for a white pawn', () => {
    expect(getEnPassantCaptureSquare({ target: 'd6', color: 'blanche' })).toBe('d5');
  });

  it('returns the square above the target for a black pawn', () => {
    expect(getEnPassantCaptureSquare({ target: 'e3', color: 'noire' })).toBe('e4');
  });

  it.each([
    ['a white pawn on the second rank', { target: 'a2', color: 'blanche' }, 'a1'],
    ['a black pawn on the seventh rank', { target: 'h7', color: 'noire' }, 'h8'],
  ])('returns the edge of the board for %s', (_label, params, expected) => {
    expect(getEnPassantCaptureSquare(params)).toBe(expected);
  });

  it.each([
    ['a white pawn on the first rank', { target: 'a1', color: 'blanche' }],
    ['a black pawn on the last rank', { target: 'h8', color: 'noire' }],
  ])('returns null when the square behind is off the board, for %s', (_label, params) => {
    expect(getEnPassantCaptureSquare(params)).toBeNull();
  });

  it.each([
    ['a file past h', { target: 'i6', color: 'blanche' }],
    ['a rank past 8', { target: 'd9', color: 'blanche' }],
    ['rank 0', { target: 'd0', color: 'blanche' }],
    ['an uppercase square', { target: 'D6', color: 'blanche' }],
    ['a longer string', { target: 'd6x', color: 'blanche' }],
    ['an empty target', { target: '', color: 'blanche' }],
    ['a missing target', { color: 'blanche' }],
    ['a number target', { target: 46, color: 'blanche' }],
    ['an unknown color', { target: 'd6', color: 'rouge' }],
    ['a missing color', { target: 'd6' }],
  ])('returns null for %s', (_label, params) => {
    expect(getEnPassantCaptureSquare(params)).toBeNull();
  });

  it('returns null without parameters', () => {
    expect(getEnPassantCaptureSquare()).toBeNull();
  });
});
