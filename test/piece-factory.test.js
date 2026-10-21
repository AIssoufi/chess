// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import PieceFactory from '../app/js/PieceFactory.js';
import queen from '../app/js/pieces/queen.js';
import knight from '../app/js/pieces/knight.js';

const PIECE_TYPES = ['knight', 'queen', 'bishop', 'pawn', 'king', 'rook'];
/** Pieces whose type or color is unknown or missing. */
const UNKNOWN_PIECES = [
  ['an unknown type', { type: 'licorne', color: 'white' }],
  ['a type in another case', { type: 'Dame', color: 'white' }],
  ['a key of Object.prototype as type', { type: 'toString', color: 'white' }],
  ['an unknown color', { type: 'queen', color: 'rouge' }],
  ['a key of the piece config as color', { type: 'queen', color: 'type' }],
  ['a missing type', { color: 'black' }],
  ['a missing color', { type: 'queen' }],
  ['null values', { type: null, color: null }],
  ['an empty object', {}],
];

let factory;

beforeEach(() => {
  factory = new PieceFactory();
});

describe('PieceFactory.créer', () => {
  it('creates a piece node with its symbol, class and dataset', () => {
    const node = factory.create({ type: 'queen', color: 'black' });

    expect(node.tagName).toBe('DIV');
    expect(node.className).toBe('piece');
    expect(node.textContent).toBe(queen.piece.black);
    expect(node.dataset).toMatchObject({ type: 'queen', color: 'black' });
  });

  it('gives each node its own increasing id', () => {
    const ids = [
      factory.create({ type: 'pawn', color: 'white' }).id,
      factory.create({ type: 'pawn', color: 'white' }).id,
    ];

    expect(ids).toEqual(['1', '2']);
  });

  it.each(PIECE_TYPES)('uses a different symbol for each color of %s', (type) => {
    const white = factory.create({ type, color: 'white' }).textContent;
    const black = factory.create({ type, color: 'black' }).textContent;

    expect(white).not.toBe('');
    expect(black).not.toBe('');
    expect(white).not.toBe(black);
  });

  it.each(UNKNOWN_PIECES)('returns null for %s', (_label, piece) => {
    expect(factory.create(piece)).toBeNull();
  });

  it.each([
    ['no argument', undefined],
    ['null', null],
  ])('returns null for %s', (_label, params) => {
    expect(factory.create(params)).toBeNull();
  });

  it('does not use an id for a piece it refuses', () => {
    factory.create({ type: 'licorne', color: 'white' });

    expect(factory.create({ type: 'pawn', color: 'white' }).id).toBe('1');
  });
});

describe('PieceFactory.getSymbol', () => {
  it('returns the symbol of a type and a color', () => {
    expect(factory.getSymbol('knight', 'white')).toBe(knight.piece.white);
  });

  it('matches the text of the created node', () => {
    for (const type of PIECE_TYPES) {
      expect(factory.create({ type, color: 'black' }).textContent).toBe(
        factory.getSymbol(type, 'black')
      );
    }
  });

  it.each(UNKNOWN_PIECES)('returns an empty string for %s', (_label, { type, color }) => {
    expect(factory.getSymbol(type, color)).toBe('');
  });
});
