// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import PièceFactory from '../app/js/PièceFactory.js';
import dame from '../app/js/pieces/dame.js';
import cavalier from '../app/js/pieces/cavalier.js';

const PIECE_TYPES = ['cavalier', 'dame', 'fou', 'pion', 'roi', 'tour'];

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
});
