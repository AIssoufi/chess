/** The two colors, white first. */
export const COLORS = Object.freeze(['white', 'black']);

/** The color that plays against each color. */
export const OPPONENT_COLORS = Object.freeze({
  white: 'black',
  black: 'white',
});

/** The rank step of a pawn of each color: white moves up the ranks, black down. */
export const PAWN_DIRECTIONS = Object.freeze({
  white: 1,
  black: -1,
});

/** The name of each color shown to the players, in French. */
export const COLOR_LABELS = Object.freeze({
  white: 'blanche',
  black: 'noire',
});
