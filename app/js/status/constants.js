/** The name of each side in the announcements, such as `Aux blancs de jouer.`, in French. */
export const SIDE_LABELS = Object.freeze({
  white: 'blancs',
  black: 'noirs',
});

/**
 * The sentences of the announcements read by screen readers after each move, in French. A
 * `{name}` placeholder is replaced by its value.
 */
export const STATUS_TEXTS = Object.freeze({
  lastMove: 'Dernier coup\u00a0: {piece} de {from} à {to}',
  capture: 'prend {piece}',
  promotion: 'promu en {type}',
  turn: 'Aux {side} de jouer.',
  check: 'Les {side} sont en échec.',
  checkmate: 'Échec et mat, les {side} gagnent.',
  stalemate: 'Pat, match nul.',
  draw: 'Match nul\u00a0: {reason}.',
  unexplainedDraw: 'Match nul.',
});

/** A `{name}` placeholder of the status texts, whose first group is the name. */
export const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

/** What separates the parts of the last move sentence, such as `prend pion noir`. */
export const MOVE_PART_SEPARATOR = ', ';

/** What ends the last move sentence. */
export const SENTENCE_END = '.';

/** What separates the sentences of an announcement. */
export const SENTENCE_SEPARATOR = ' ';
