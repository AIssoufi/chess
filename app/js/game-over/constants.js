/** What a move leaves the side to play in. */
export const GAME_OUTCOMES = Object.freeze({
  checkmate: 'checkmate',
  stalemate: 'stalemate',
  check: 'check',
  ongoing: 'ongoing',
});

/** Class name of the alert of `index.html` shown for each outcome that ends the game. */
export const GAME_OVER_ALERTS = Object.freeze({
  [GAME_OUTCOMES.checkmate]: 'fin-de-partie',
  [GAME_OUTCOMES.stalemate]: 'pat',
});

/** Delay before the game over dialog opens, so that the last move shows on the board first. */
export const GAME_OVER_DIALOG_DELAY_MS = 200;
