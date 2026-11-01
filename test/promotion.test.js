// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import PieceFactory from '../app/js/PieceFactory.js';
import {
  getChosenPieceType,
  hidePromotionChoice,
  keepFocusOnPieces,
  showPromotionChoice,
} from '../app/js/promotion/promotion-choice.js';
import { FOCUS_MOVE_KEY, PROMOTION_PIECE_TYPES } from '../app/js/promotion/constants.js';
import { getNextPieceIndex } from '../app/js/promotion/utils.js';

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
    <dialog class="promotion__wrapper">
      <p>Promouvoir le pion en :</p>
      <div>${PROMOTION_PIECE_TYPES.map((type) => `<button data-type="${type}"></button>`).join('')}</div>
    </dialog>`;
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
    expect(wrapper.open).toBe(true);
    expect(document.activeElement).toBe(buttonOf('queen'));
  });

  it('shows a choice without pieces, focusing nothing', () => {
    wrapper.innerHTML = '';
    showPromotionChoice({ wrapper, factory, color: 'white' });
    expect(wrapper.open).toBe(true);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('hidePromotionChoice', () => {
  it('hides the choice', () => {
    showPromotionChoice({ wrapper, factory, color: 'white' });
    hidePromotionChoice(wrapper);
    expect(wrapper.open).toBe(false);
  });

  it('leaves a closed choice closed', () => {
    hidePromotionChoice(wrapper);
    expect(wrapper.open).toBe(false);
  });
});

describe('getNextPieceIndex', () => {
  it.each([
    ['the next piece', { currentIndex: 0, count: 4, isBackward: false }, 1],
    ['the first piece after the last', { currentIndex: 3, count: 4, isBackward: false }, 0],
    ['the previous piece', { currentIndex: 3, count: 4, isBackward: true }, 2],
    ['the last piece before the first', { currentIndex: 0, count: 4, isBackward: true }, 3],
    ['the first piece from outside', { currentIndex: -1, count: 4, isBackward: false }, 0],
    ['the last piece from outside', { currentIndex: -1, count: 4, isBackward: true }, 3],
    ['the only piece', { currentIndex: 0, count: 1, isBackward: false }, 0],
    ['the only piece backward', { currentIndex: 0, count: 1, isBackward: true }, 0],
    ['no piece without pieces', { currentIndex: -1, count: 0, isBackward: false }, -1],
    ['no piece backward without pieces', { currentIndex: -1, count: 0, isBackward: true }, -1],
  ])('gives %s', (_label, params, expected) => {
    expect(getNextPieceIndex(params)).toBe(expected);
  });
});

describe('keepFocusOnPieces', () => {
  /**
   * Presses a key in the promotion choice.
   *
   * @param {KeyboardEventInit} init The key.
   * @returns {KeyboardEvent} The event, once handled.
   */
  function pressKey(init) {
    const event = new KeyboardEvent('keydown', { cancelable: true, ...init });
    wrapper.addEventListener('keydown', keepFocusOnPieces, { once: true });
    wrapper.dispatchEvent(event);
    return event;
  }

  beforeEach(() => {
    showPromotionChoice({ wrapper, factory, color: 'white' });
  });

  it('moves the focus to the next piece on Tab, instead of the browser', () => {
    const event = pressKey({ key: FOCUS_MOVE_KEY });

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttonOf('rook'));
  });

  it('loops to the last piece on Shift+Tab', () => {
    const event = pressKey({ key: FOCUS_MOVE_KEY, shiftKey: true });

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttonOf('knight'));
  });

  it('brings a lost focus back to the first piece', () => {
    document.activeElement.blur();

    pressKey({ key: FOCUS_MOVE_KEY });

    expect(document.activeElement).toBe(buttonOf('queen'));
  });

  it('leaves other keys to the browser', () => {
    const event = pressKey({ key: 'Enter' });

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(buttonOf('queen'));
  });

  it('does not throw without pieces', () => {
    wrapper.innerHTML = '';

    expect(pressKey({ key: FOCUS_MOVE_KEY }).defaultPrevented).toBe(true);
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
