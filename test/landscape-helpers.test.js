import { describe, expect, it } from 'vitest';
import { GRID_TOLERANCE_PX } from '../e2e/helpers/board/constants.js';
import { expectWholeCaptures } from '../e2e/helpers/captures/utils.js';
import { MIN_VISIBLE_TURNS } from '../e2e/helpers/landscape/constants.js';
import {
  expectOneLineTexts,
  expectTwoVisibleTurns,
  expectWholeControls,
} from '../e2e/helpers/landscape/utils.js';

const TURN_HEIGHT_PX = 23;

/** The height of the move list that shows two turns, subpixel rounding included. */
const TWO_TURNS_HEIGHT_PX = MIN_VISIBLE_TURNS * TURN_HEIGHT_PX - GRID_TOLERANCE_PX;

const WHITE_TO_MOVE = Object.freeze({ color: 'white', turnLines: 1, captureCountLines: 1 });

const BLACK_WAITING = Object.freeze({ color: 'black', turnLines: 0, captureCountLines: 1 });

/** A zone that holds its pieces exactly, with symbols as wide as their tracks. */
const WHOLE_CAPTURES = Object.freeze({
  color: 'white',
  scrollWidth: 168,
  clientWidth: 168,
  pieceWidth: 26,
  symbolWidth: 26,
});

describe('expectWholeControls', () => {
  it('accepts a panel that holds exactly its content', () => {
    const controls = [{ color: 'white', scrollHeight: 89, clientHeight: 89 }];

    expect(() => expectWholeControls(controls)).not.toThrow();
  });

  it('refuses a panel that scrolls by one pixel, whichever comes first', () => {
    const controls = [
      { color: 'black', scrollHeight: 89, clientHeight: 89 },
      { color: 'white', scrollHeight: 90, clientHeight: 89 },
    ];

    expect(() => expectWholeControls(controls)).toThrow('the panel of white does not scroll');
  });

  it('has nothing to refuse without any panel', () => {
    expect(() => expectWholeControls([])).not.toThrow();
  });
});

describe('expectOneLineTexts', () => {
  it('accepts one line of label for the side to move and none for the other', () => {
    const controls = [WHITE_TO_MOVE, BLACK_WAITING];

    expect(() => expectOneLineTexts({ controls, sideToMove: 'white' })).not.toThrow();
  });

  it.each([
    ['is missing', { ...WHITE_TO_MOVE, turnLines: 0 }],
    ['wraps', { ...WHITE_TO_MOVE, turnLines: 2 }],
  ])('refuses a turn label that %s', (_case, control) => {
    const controls = [control, BLACK_WAITING];

    expect(() => expectOneLineTexts({ controls, sideToMove: 'white' })).toThrow(
      'the turn label of white takes its lines'
    );
  });

  it('refuses a turn label on the side that waits', () => {
    const controls = [WHITE_TO_MOVE, BLACK_WAITING];

    expect(() => expectOneLineTexts({ controls, sideToMove: 'black' })).toThrow(
      'the turn label of white takes its lines'
    );
  });

  it.each([
    ['is missing', 0],
    ['wraps', 2],
  ])('refuses a capture count that %s', (_case, captureCountLines) => {
    const controls = [WHITE_TO_MOVE, { ...BLACK_WAITING, captureCountLines }];

    expect(() => expectOneLineTexts({ controls, sideToMove: 'white' })).toThrow(
      'the capture count of black keeps one line'
    );
  });

  it('has nothing to refuse without any panel', () => {
    expect(() => expectOneLineTexts({ controls: [], sideToMove: 'white' })).not.toThrow();
  });
});

describe('expectTwoVisibleTurns', () => {
  it('accepts a move list at the exact height of two turns', () => {
    const moves = { clientHeight: TWO_TURNS_HEIGHT_PX, turnHeight: TURN_HEIGHT_PX };

    expect(() => expectTwoVisibleTurns(moves)).not.toThrow();
  });

  it('accepts a move list one pixel taller', () => {
    const moves = { clientHeight: TWO_TURNS_HEIGHT_PX + 1, turnHeight: TURN_HEIGHT_PX };

    expect(() => expectTwoVisibleTurns(moves)).not.toThrow();
  });

  it('refuses a move list one pixel shorter', () => {
    const moves = { clientHeight: TWO_TURNS_HEIGHT_PX - 1, turnHeight: TURN_HEIGHT_PX };

    expect(() => expectTwoVisibleTurns(moves)).toThrow('the move list shows two turns');
  });

  it('refuses a move list without any turn', () => {
    expect(() => expectTwoVisibleTurns({ clientHeight: 100, turnHeight: 0 })).toThrow(
      'the move list holds a turn'
    );
  });
});

describe('expectWholeCaptures', () => {
  it('accepts a zone that holds exactly its pieces, with symbols as wide as their tracks', () => {
    expect(() => expectWholeCaptures([WHOLE_CAPTURES])).not.toThrow();
  });

  it('refuses a zone that scrolls by one pixel, whichever comes first', () => {
    const captures = [
      { ...WHOLE_CAPTURES, color: 'black' },
      { ...WHOLE_CAPTURES, scrollWidth: WHOLE_CAPTURES.clientWidth + 1 },
    ];

    expect(() => expectWholeCaptures(captures)).toThrow('the captures of white do not scroll');
  });

  it('refuses a symbol wider than its track by a fraction of a pixel', () => {
    const captures = [{ ...WHOLE_CAPTURES, symbolWidth: WHOLE_CAPTURES.pieceWidth + 0.5 }];

    expect(() => expectWholeCaptures(captures)).toThrow('the symbols of white stay apart');
  });

  it('accepts a page without any zone', () => {
    expect(() => expectWholeCaptures([])).not.toThrow();
  });
});
