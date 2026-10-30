import { SCANDINAVIAN_MOVES, SCANDINAVIAN_MOVES_WHITE_TO_MOVE } from '../board/constants.js';

/** The board and its coordinates, between the two side columns of the landscape layout. */
export const GAME_SELECTOR = '.game';

/** The fewest turns that the move list must show at once, so that a player can follow the game. */
export const MIN_VISIBLE_TURNS = 2;

/** Both sides to move, since the label `À vous de jouer` sits in the panel of the side to move. */
export const LATE_GAME_POSITIONS = Object.freeze([
  { sideToMove: 'black', gameMoves: SCANDINAVIAN_MOVES },
  { sideToMove: 'white', gameMoves: SCANDINAVIAN_MOVES_WHITE_TO_MOVE },
]);
