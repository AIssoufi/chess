import { describe, it, expect } from 'vitest';
import { areCoordinatesOnBoard, getEnPassantCaptureSquare } from '../app/js/squares/utils.js';

describe('getEnPassantCaptureSquare', () => {
  it('returns the square below the target for a white pawn', () => {
    expect(getEnPassantCaptureSquare({ target: 'd6', color: 'white' })).toBe('d5');
  });

  it('returns the square above the target for a black pawn', () => {
    expect(getEnPassantCaptureSquare({ target: 'e3', color: 'black' })).toBe('e4');
  });

  it.each([
    ['a white pawn on the second rank', { target: 'a2', color: 'white' }, 'a1'],
    ['a black pawn on the seventh rank', { target: 'h7', color: 'black' }, 'h8'],
  ])('returns the edge of the board for %s', (_label, params, expected) => {
    expect(getEnPassantCaptureSquare(params)).toBe(expected);
  });

  it.each([
    ['a white pawn on the first rank', { target: 'a1', color: 'white' }],
    ['a black pawn on the last rank', { target: 'h8', color: 'black' }],
  ])('returns null when the square behind is off the board, for %s', (_label, params) => {
    expect(getEnPassantCaptureSquare(params)).toBeNull();
  });

  it.each([
    ['a file past h', { target: 'i6', color: 'white' }],
    ['a rank past 8', { target: 'd9', color: 'white' }],
    ['rank 0', { target: 'd0', color: 'white' }],
    ['an uppercase square', { target: 'D6', color: 'white' }],
    ['a longer string', { target: 'd6x', color: 'white' }],
    ['an empty target', { target: '', color: 'white' }],
    ['a missing target', { color: 'white' }],
    ['a number target', { target: 46, color: 'white' }],
    ['an unknown color', { target: 'd6', color: 'red' }],
    ['a missing color', { target: 'd6' }],
  ])('returns null for %s', (_label, params) => {
    expect(getEnPassantCaptureSquare(params)).toBeNull();
  });

  it('returns null without parameters', () => {
    expect(getEnPassantCaptureSquare()).toBeNull();
  });
});

describe('areCoordinatesOnBoard', () => {
  it.each([
    ['a1', { file: 0, rank: 1 }],
    ['h8', { file: 7, rank: 8 }],
    ['e4', { file: 4, rank: 4 }],
  ])('returns true for %s', (_label, params) => {
    expect(areCoordinatesOnBoard(params)).toBe(true);
  });

  it.each([
    ['a file left of a', { file: -1, rank: 4 }],
    ['a file right of h', { file: 8, rank: 4 }],
    ['rank 0', { file: 4, rank: 0 }],
    ['rank 9', { file: 4, rank: 9 }],
    ['a missing file', { rank: 4 }],
    ['a missing rank', { file: 4 }],
    ['non-numeric coordinates', { file: 'e', rank: 'x' }],
    ['NaN coordinates', { file: NaN, rank: NaN }],
    ['numeric strings', { file: '4', rank: '4' }],
    ['decimals', { file: 0.5, rank: 1 }],
    ['null params', null],
    ['missing params', undefined],
  ])('returns false for %s', (_label, params) => {
    expect(areCoordinatesOnBoard(params)).toBe(false);
  });
});
