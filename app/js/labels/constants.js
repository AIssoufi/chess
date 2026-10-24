/** The name of each piece read by screen readers, by type then by color, in French. */
export const PIECE_LABELS = Object.freeze({
  king: Object.freeze({ white: 'roi blanc', black: 'roi noir' }),
  queen: Object.freeze({ white: 'dame blanche', black: 'dame noire' }),
  rook: Object.freeze({ white: 'tour blanche', black: 'tour noire' }),
  bishop: Object.freeze({ white: 'fou blanc', black: 'fou noir' }),
  knight: Object.freeze({ white: 'cavalier blanc', black: 'cavalier noir' }),
  pawn: Object.freeze({ white: 'pion blanc', black: 'pion noir' }),
});

/** The name of each piece type without its color, such as in `promu en dame`, in French. */
export const PIECE_TYPE_LABELS = Object.freeze({
  king: 'roi',
  queen: 'dame',
  rook: 'tour',
  bishop: 'fou',
  knight: 'cavalier',
  pawn: 'pion',
});

/** What a screen reader says for a square that holds no piece. */
export const EMPTY_SQUARE_LABEL = 'vide';

/** What a screen reader adds after a square that the selected piece can move to. */
export const POSSIBLE_MOVE_LABEL = 'coup possible';

/** What a screen reader adds after the square of a king in check. */
export const CHECK_LABEL = 'en échec';

/** What separates the parts of a square's name, such as `e2, pion blanc`. */
export const LABEL_SEPARATOR = ', ';
