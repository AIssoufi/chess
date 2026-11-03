// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { getSquareNode } from '../app/js/squares/nodes.js';

beforeEach(() => {
  document.body.innerHTML = `
    <div class="container-squares">
      <button class="square" data-position="e4"></button>
      <button class="square" data-position="e5"></button>
    </div>`;
});

describe('getSquareNode', () => {
  it('returns the node of a square', () => {
    expect(getSquareNode({ square: 'e4' }).dataset.position).toBe('e4');
  });

  it('returns null for a square that the page does not hold', () => {
    expect(getSquareNode({ square: 'a1' })).toBeNull();
  });

  it.each([
    ['a value that is not a square', 'z9'],
    ['a value with a quote', 'e4"]'],
    ['an uppercase square', 'E4'],
    ['an empty string', ''],
    ['undefined', undefined],
    ['null', null],
    ['a number', 42],
  ])('returns null for %s', (_label, square) => {
    expect(getSquareNode({ square })).toBeNull();
  });

  it('searches inside the given root only', () => {
    const root = document.createElement('div');
    expect(getSquareNode({ root, square: 'e4' })).toBeNull();
  });

  it('finds a square inside the given root', () => {
    const root = document.querySelector('.container-squares');
    expect(getSquareNode({ root, square: 'e5' })).toBe(root.lastElementChild);
  });
});
