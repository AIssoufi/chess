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
