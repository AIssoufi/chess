/** The selection when no piece is selected: no square, no move and no capture. */
export const NO_SELECTION = Object.freeze({
  square: null,
  moves: Object.freeze([]),
  captures: Object.freeze([]),
});

/** What a click on a square of the board does, after the selection and the game. */
export const CLICK_ACTIONS = Object.freeze({
  move: 'move',
  select: 'select',
  deselect: 'deselect',
  none: 'none',
});

/** The class of the selected square. */
export const SELECTED_CLASS = 'selected';

/** The class of the squares that the selected piece can move to. */
export const POSSIBLE_MOVE_CLASS = 'possible-move';

/** The class of the possible moves that capture a piece, which show a ring instead of a dot. */
export const CAPTURE_MOVE_CLASS = 'capture-move';
