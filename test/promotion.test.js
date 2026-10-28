// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import PieceFactory from '../app/js/PieceFactory.js';
import {
  getChosenPieceType,
  hidePromotionChoice,
  showPromotionChoice,
} from '../app/js/promotion/promotion-choice.js';
import { PROMOTION_PIECE_TYPES } from '../app/js/promotion/constants.js';

let wrapper;
const factory = new PieceFactory();

/**
 * Returns the button of a piece type in the promotion choice.
 *
 * @param {string} type The piece type, such as `'queen'`.
 * @returns {HTMLButtonElement} Its button.
 */
function buttonOf(type) {
  return wrapper.querySelector(`[data-type="${type}"]`);
}

beforeEach(() => {
  document.body.innerHTML = `
    <div class="promotion__wrapper" hidden>
      <p>Promouvoir le pion en :</p>
      <div>${PROMOTION_PIECE_TYPES.map((type) => `<button data-type="${type}"></button>`).join('')}</div>
    </div>`;
  wrapper = document.querySelector('.promotion__wrapper');
});

describe('showPromotionChoice', () => {
  it.each(['white', 'black'])('shows the symbols of the %s pieces', (color) => {
    showPromotionChoice({ wrapper, factory, color });
    for (const type of PROMOTION_PIECE_TYPES) {
      expect(buttonOf(type).textContent).toBe(factory.getSymbol(type, color));
    }
  });

  it('shows the choice and focuses its first piece', () => {
    showPromotionChoice({ wrapper, factory, color: 'white' });
    expect(wrapper.hidden).toBe(false);
    expect(document.activeElement).toBe(buttonOf('queen'));
  });

  it('shows a choice without pieces, focusing nothing', () => {
    wrapper.innerHTML = '';
    showPromotionChoice({ wrapper, factory, color: 'white' });
    expect(wrapper.hidden).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('hidePromotionChoice', () => {
  it('hides the choice', () => {
    showPromotionChoice({ wrapper, factory, color: 'white' });
    hidePromotionChoice(wrapper);
    expect(wrapper.hidden).toBe(true);
  });
});

describe('getChosenPieceType', () => {
  it('returns the type of the clicked piece', () => {
    expect(getChosenPieceType({ target: buttonOf('knight') })).toBe('knight');
  });

  it('returns the type of the piece around the clicked node', () => {
    const symbol = document.createElement('span');
    buttonOf('rook').appendChild(symbol);
    expect(getChosenPieceType({ target: symbol })).toBe('rook');
  });

  it('returns null for a click beside the pieces', () => {
    expect(getChosenPieceType({ target: wrapper.querySelector('p') })).toBeNull();
  });

  it.each([
    ['no event', undefined],
    ['null', null],
    ['an event without target', {}],
    ['a target that is not an element', { target: 'queen' }],
  ])('returns null for %s', (_label, event) => {
    expect(getChosenPieceType(event)).toBeNull();
  });
});
