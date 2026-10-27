/** The starting position, with its halfmove clock and move number. */
export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** The fewest fields of a FEN: placement, side to move, castling rights and en passant. */
export const MIN_FIELD_COUNT = 4;

/** The most fields of a FEN: the four others, then the halfmove clock and the move number. */
export const MAX_FIELD_COUNT = 6;

/** The spaces between the fields of a FEN. */
export const FIELD_SEPARATOR_PATTERN = /\s+/;

/** The ranks no pawn can stand on: the promotion rank of each color is behind the other's pawns. */
export const PAWNLESS_RANKS = Object.freeze([1, 8]);

/** The FEN value of an empty castling or en passant field. */
export const EMPTY_FIELD = '-';

/** The run of empty squares that a FEN rank writes as one digit. */
export const EMPTY_SQUARES_PATTERN = /^[1-8]$/;

/** The castling field: `-`, or the rights in the order `KQkq`. */
export const CASTLING_PATTERN = /^(?:-|K?Q?k?q?)$/;

/** The piece type of each FEN letter, in lowercase; an uppercase letter is a white piece. */
export const PIECE_TYPES = Object.freeze({
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
});

/** The color to move of each value of the FEN side field. */
export const SIDES = Object.freeze({ w: 'white', b: 'black' });

/** The piece types that a castling right leaves unmoved. */
export const CASTLING_PIECE_TYPES = Object.freeze(['king', 'rook']);

/** The king and the rook that each castling right leaves unmoved. */
export const CASTLING_RIGHTS = Object.freeze({
  K: { color: 'white', kingSquare: 'e1', rookSquare: 'h1' },
  Q: { color: 'white', kingSquare: 'e1', rookSquare: 'a1' },
  k: { color: 'black', kingSquare: 'e8', rookSquare: 'h8' },
  q: { color: 'black', kingSquare: 'e8', rookSquare: 'a8' },
});

/** The rank of the en passant target square when each color is to move. */
export const EN_PASSANT_RANKS = Object.freeze({ white: '6', black: '3' });
