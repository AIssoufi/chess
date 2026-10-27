/** Why a game ends in a draw, besides a stalemate, as `Chessboard#getDrawReason` returns it. */
export const DRAW_REASONS = Object.freeze({
  insufficientMaterial: 'insufficient-material',
  fiftyMoveRule: 'fifty-move-rule',
  threefoldRepetition: 'threefold-repetition',
});

/** The reason of each draw shown to the players, such as in `Match nul : …`, in French. */
export const DRAW_REASON_LABELS = Object.freeze({
  [DRAW_REASONS.insufficientMaterial]: 'matériel insuffisant pour mater',
  [DRAW_REASONS.fiftyMoveRule]: 'cinquante coups sans prise ni mouvement de pion',
  [DRAW_REASONS.threefoldRepetition]: 'position répétée trois fois',
});

/** Half-moves without a capture or a pawn move that end the game: fifty moves of each side. */
export const FIFTY_MOVE_RULE_HALF_MOVES = 100;

/** Number of times the same position must occur to end the game. */
export const REPETITION_DRAW_COUNT = 3;

/** The piece types that may stand beside the kings in a position where no mate is possible. */
export const MINOR_PIECE_TYPES = Object.freeze(['bishop', 'knight']);

/** The most minor pieces, of any type, that can never mate together with their king. */
export const MAX_LONE_MINOR_PIECES = 1;

/** The number of square shades of the board: a bishop always stays on the shade it starts on. */
export const SQUARE_SHADE_COUNT = 2;

/** What separates the fields of a position key, and the pieces or rights inside a field. */
export const POSITION_KEY_SEPARATORS = Object.freeze({ field: ' ', item: ',' });

/** The field of a position key that holds no en passant square. */
export const NO_EN_PASSANT_SQUARE = '-';
