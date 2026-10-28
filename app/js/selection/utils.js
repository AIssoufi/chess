import { isOpponentPiece } from '../moves/utils.js';
import { isSquare } from '../squares/utils.js';
import { CLICK_ACTIONS, NO_SELECTION } from './constants.js';

/**
 * Tells whether a square holds a piece of the color to move.
 *
 * @param {object} params
 * @param {import('../Chessboard.js').default} params.game The game.
 * @param {string} params.square The square, such as `'e2'`.
 * @returns {boolean} Whether the side to move can select that piece.
 */
function hasPieceToMove({ game, square }) {
  const piece = game.getPiece(square);
  return Boolean(piece) && piece.color === game.currentColor;
}

/**
 * Tells whether a move of a piece captures: its target holds a piece of the other color, or the
 * piece is a pawn taking en passant, whose target square is empty.
 *
 * @param {object} params
 * @param {import('../Chessboard.js').default} params.game The game.
 * @param {{ type: string, color: string }} params.piece The moving piece.
 * @param {string} params.target The square the piece moves to, such as `'d5'`.
 * @returns {boolean} Whether the move takes a piece.
 */
function isCapture({ game, piece, target }) {
  const isOpponentTarget = isOpponentPiece({ piece: game.getPiece(target), color: piece.color });
  const isEnPassant = piece.type === 'pawn' && target === game.enPassantSquare;
  return isOpponentTarget || isEnPassant;
}

/**
 * Returns the selection that a click on a square makes: the square, its legal moves and those of
 * them that capture, when it holds a piece of the color to move that can move.
 *
 * @param {object | null} [params]
 * @param {import('../Chessboard.js').default} params.game The game.
 * @param {string} params.square The clicked square, such as `'e2'`.
 * @returns {{ square: string | null, moves: readonly string[], captures: readonly string[] }} The
 *   selection, or `NO_SELECTION` for a square that is not a square, is empty, holds a piece of the
 *   other color or a piece without legal moves, and without a game.
 * @example
 * getSelection({ game, square: 'e4' }); // { square: 'e4', moves: ['e5', 'd5'], captures: ['d5'] }
 * // after 1. e4 d5
 */
export function getSelection(params) {
  const { game, square } = params ?? {};
  const canSelect = Boolean(game) && isSquare(square) && hasPieceToMove({ game, square });
  if (!canSelect) return NO_SELECTION;

  const moves = game.getMoves(square);
  if (moves.length === 0) return NO_SELECTION;

  const piece = game.getPiece(square);
  const captures = moves.filter((target) => isCapture({ game, piece, target }));
  return { square, moves, captures };
}

/**
 * Tells what a click on a square of the board does: play the selected piece there, select the
 * piece of the side to move it holds, drop the selection, or nothing.
 *
 * @param {object | null} [params]
 * @param {import('../Chessboard.js').default} params.game The game.
 * @param {{ square: string | null, moves: readonly string[] }} [params.selection] The current
 *   selection, `NO_SELECTION` by default.
 * @param {string} params.square The clicked square, such as `'e4'`.
 * @returns {string} One of `CLICK_ACTIONS`: `none` once the game is over, while a promotion
 *   waits for its piece, for a value that is not a square, without a game, and for an empty
 *   square or a piece of the other color clicked without a selection.
 * @example
 * getClickAction({ game, selection: { square: 'e2', moves: ['e3', 'e4'] }, square: 'e4' });
 * // 'move'
 */
export function getClickAction(params) {
  const { game, selection = NO_SELECTION, square } = params ?? {};
  const isPlayable = Boolean(game) && !game.isOver && !game.promotionSquare;
  if (!isPlayable || !isSquare(square)) return CLICK_ACTIONS.none;

  const isPossibleMove = Boolean(selection?.square) && selection.moves.includes(square);
  if (isPossibleMove) return CLICK_ACTIONS.move;
  if (hasPieceToMove({ game, square })) return CLICK_ACTIONS.select;
  return selection?.square ? CLICK_ACTIONS.deselect : CLICK_ACTIONS.none;
}
