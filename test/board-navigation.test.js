import { describe, it, expect } from 'vitest';
import { getNextSquare } from '../app/js/board-navigation/utils.js';

describe('getNextSquare', () => {
  it.each([
    ['ArrowUp', 'e3'],
    ['ArrowDown', 'e1'],
    ['ArrowLeft', 'd2'],
    ['ArrowRight', 'f2'],
    ['Home', 'a2'],
    ['End', 'h2'],
    ['PageUp', 'e8'],
    ['PageDown', 'e1'],
  ])('moves from e2 with %s to %s', (key, expected) => {
    expect(getNextSquare({ square: 'e2', key })).toBe(expected);
  });

  it.each([
    ['a1', 'ArrowDown'],
    ['a1', 'ArrowLeft'],
    ['h1', 'ArrowDown'],
    ['h1', 'ArrowRight'],
    ['a8', 'ArrowUp'],
    ['a8', 'ArrowLeft'],
    ['h8', 'ArrowUp'],
    ['h8', 'ArrowRight'],
  ])('stays on the corner %s with %s', (square, key) => {
    expect(getNextSquare({ square, key })).toBe(square);
  });

  it.each([
    ['a5', 'Home'],
    ['h5', 'End'],
    ['d8', 'PageUp'],
    ['d1', 'PageDown'],
  ])('stays on %s, already on the edge that %s reaches', (square, key) => {
    expect(getNextSquare({ square, key })).toBe(square);
  });

  it('moves away from an edge', () => {
    expect(getNextSquare({ square: 'a1', key: 'ArrowUp' })).toBe('a2');
    expect(getNextSquare({ square: 'h8', key: 'ArrowLeft' })).toBe('g8');
    expect(getNextSquare({ square: 'a8', key: 'PageDown' })).toBe('a1');
    expect(getNextSquare({ square: 'h1', key: 'Home' })).toBe('a1');
  });

  it.each([
    ['Enter'],
    [' '],
    ['Tab'],
    ['a'],
    ['arrowup'],
    ['toString'],
    ['hasOwnProperty'],
    [''],
    [undefined],
    [null],
    [42],
  ])('returns null for the key %j, which is no navigation key', (key) => {
    expect(getNextSquare({ square: 'e2', key })).toBeNull();
  });

  it.each([['i1'], ['a0'], ['a9'], ['E2'], ['e22'], [''], [undefined], [null], [12]])(
    'returns null for %j, which is no square',
    (square) => {
      expect(getNextSquare({ square, key: 'ArrowUp' })).toBeNull();
    }
  );

  it('returns null without parameters', () => {
    expect(getNextSquare()).toBeNull();
  });
});
