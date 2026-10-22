import { BOARD_SIZE } from '../squares/constants.js';

/** The special moves that `Chessboard#move` reports in its `specialMove` field. */
export const SPECIAL_MOVES = Object.freeze({
  kingsideCastling: 'kingside-castling',
  queensideCastling: 'queenside-castling',
  enPassant: 'en-passant',
});

/** The name of each special move written in the move log shown to the players, in French. */
export const SPECIAL_MOVE_LABELS = Object.freeze({
  [SPECIAL_MOVES.kingsideCastling]: 'petit-roque',
  [SPECIAL_MOVES.queensideCastling]: 'grand-roque',
  [SPECIAL_MOVES.enPassant]: 'en-passant',
});

/** The farthest a rook, a bishop or a queen can slide: from one edge of the board to the other. */
export const MAX_SLIDE_STEPS = BOARD_SIZE - 1;

/** The king moves one square in any direction. */
export const KING_STEPS = 1;

/** The number of ranks a pawn advances on its first move when it moves twice. */
export const PAWN_DOUBLE_STEP = 2;

/** The number of files the king crosses when it castles, on either side. */
export const CASTLING_KING_FILE_STEP = 2;

/**
 * The files of each castling side, kingside first, on the rank of the castling king: where the
 * rook stands and lands, where the king lands, the files that must be empty and the files the
 * king crosses, which no opponent piece may attack.
 */
export const CASTLING_SIDES = Object.freeze([
  Object.freeze({
    specialMove: SPECIAL_MOVES.kingsideCastling,
    rookFile: 'h',
    rookTargetFile: 'f',
    kingTargetFile: 'g',
    emptyFiles: Object.freeze(['f', 'g']),
    safeFiles: Object.freeze(['f', 'g']),
  }),
  Object.freeze({
    specialMove: SPECIAL_MOVES.queensideCastling,
    rookFile: 'a',
    rookTargetFile: 'd',
    kingTargetFile: 'c',
    emptyFiles: Object.freeze(['b', 'c', 'd']),
    safeFiles: Object.freeze(['c', 'd']),
  }),
]);

/** The `[file, rank]` steps of a rook: along the files and the ranks. */
export const ROOK_DIRECTIONS = Object.freeze([
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
]);

/** The `[file, rank]` steps of a bishop: along the diagonals. */
export const BISHOP_DIRECTIONS = Object.freeze([
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
]);

/** The `[file, rank]` steps of a queen and of a king: every line and every diagonal. */
export const ALL_DIRECTIONS = Object.freeze([...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS]);

/** The `[file, rank]` jumps of a knight. */
export const KNIGHT_JUMPS = Object.freeze([
  [1, 2],
  [-1, 2],
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
  [1, -2],
  [-1, -2],
]);

/** The file steps of a pawn's diagonal captures. */
export const PAWN_CAPTURE_FILE_STEPS = Object.freeze([-1, 1]);
