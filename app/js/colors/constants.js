/** The two colors, white first. */
export const COLORS = Object.freeze(['blanche', 'noire']);

/** The color that plays against each color. */
export const OPPONENT_COLORS = Object.freeze({
  blanche: 'noire',
  noire: 'blanche',
});

/** The rank step of a pawn of each color: white moves up the ranks, black down. */
export const PAWN_DIRECTIONS = Object.freeze({
  blanche: 1,
  noire: -1,
});
