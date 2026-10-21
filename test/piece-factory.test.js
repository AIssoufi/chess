// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import PièceFactory from '../app/js/PieceFactory.js';
import dame from '../app/js/pieces/queen.js';
import cavalier from '../app/js/pieces/knight.js';

const PIECE_TYPES = ['cavalier', 'dame', 'fou', 'pion', 'roi', 'tour'];
/** Pieces whose type or color is unknown or missing. */
const UNKNOWN_PIECES = [
  ['an unknown type', { type: 'licorne', couleur: 'blanche' }],
  ['a type in another case', { type: 'Dame', couleur: 'blanche' }],
  ['a key of Object.prototype as type', { type: 'toString', couleur: 'blanche' }],
  ['an unknown color', { type: 'dame', couleur: 'rouge' }],
  ['a key of the piece config as color', { type: 'dame', couleur: 'type' }],
  ['a missing type', { couleur: 'noire' }],
  ['a missing color', { type: 'dame' }],
  ['null values', { type: null, couleur: null }],
  ['an empty object', {}],
];

let factory;

beforeEach(() => {
  factory = new PièceFactory();
});

describe('PièceFactory.créer', () => {
  it('creates a piece node with its symbol, class and dataset', () => {
    const node = factory.créer({ type: 'dame', couleur: 'noire' });

    expect(node.tagName).toBe('DIV');
    expect(node.className).toBe('piece');
    expect(node.textContent).toBe(dame.pièce.noire);
    expect(node.dataset).toMatchObject({ type: 'dame', couleur: 'noire' });
  });

  it('gives each node its own increasing id', () => {
    const ids = [
      factory.créer({ type: 'pion', couleur: 'blanche' }).id,
      factory.créer({ type: 'pion', couleur: 'blanche' }).id,
    ];

    expect(ids).toEqual(['1', '2']);
  });

  it.each(PIECE_TYPES)('uses a different symbol for each color of %s', (type) => {
    const white = factory.créer({ type, couleur: 'blanche' }).textContent;
    const black = factory.créer({ type, couleur: 'noire' }).textContent;

    expect(white).not.toBe('');
    expect(black).not.toBe('');
    expect(white).not.toBe(black);
  });

  it.each(UNKNOWN_PIECES)('returns null for %s', (_label, piece) => {
    expect(factory.créer(piece)).toBeNull();
  });

  it.each([
    ['no argument', undefined],
    ['null', null],
  ])('returns null for %s', (_label, params) => {
    expect(factory.créer(params)).toBeNull();
  });

  it('does not use an id for a piece it refuses', () => {
    factory.créer({ type: 'licorne', couleur: 'blanche' });

    expect(factory.créer({ type: 'pion', couleur: 'blanche' }).id).toBe('1');
  });
});

describe('PièceFactory.getSymbole', () => {
  it('returns the symbol of a type and a color', () => {
    expect(factory.getSymbole('cavalier', 'blanche')).toBe(cavalier.pièce.blanche);
  });

  it('matches the text of the created node', () => {
    for (const type of PIECE_TYPES) {
      expect(factory.créer({ type, couleur: 'noire' }).textContent).toBe(
        factory.getSymbole(type, 'noire')
      );
    }
  });

  it.each(UNKNOWN_PIECES)('returns an empty string for %s', (_label, { type, couleur }) => {
    expect(factory.getSymbole(type, couleur)).toBe('');
  });
});
