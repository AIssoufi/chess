import { GAME_OUTCOMES } from '../game-over/constants.js';
import { SPECIAL_MOVES } from '../moves/constants.js';

/**
 * The letter of each piece type in French algebraic notation: roi, dame, tour, fou, cavalier. A
 * pawn has none.
 */
export const PIECE_LETTERS = Object.freeze({
  king: 'R',
  queen: 'D',
  rook: 'T',
  bishop: 'F',
  knight: 'C',
  pawn: '',
});

/** The notation of each castling, with the letter O, as `Chessboard#move` reports it. */
export const CASTLING_NOTATIONS = Object.freeze({
  [SPECIAL_MOVES.kingsideCastling]: 'O-O',
  [SPECIAL_MOVES.queensideCastling]: 'O-O-O',
});

/** The sign written between the piece and the square of a capture, as in `Cxe5`. */
export const CAPTURE_SIGN = 'x';

/** The sign written between the square of a promotion and the new piece, as in `e8=D`. */
export const PROMOTION_SIGN = '=';

/** The sign written after a move that gives check or checkmate, by the outcome of the move. */
export const OUTCOME_SIGNS = Object.freeze({
  [GAME_OUTCOMES.check]: '+',
  [GAME_OUTCOMES.checkmate]: '#',
});

/** The number of moves of a turn in the move list: one for white, then one for black. */
export const MOVES_PER_TURN = 2;

/** The number of the first turn of a game. */
export const FIRST_TURN_NUMBER = 1;
