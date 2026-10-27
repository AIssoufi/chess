import { getOpponent } from '../colors/utils.js';
import { DRAW_REASON_LABELS } from '../draws/constants.js';
import { GAME_OUTCOMES } from '../game-over/constants.js';
import { PIECE_TYPE_LABELS } from '../labels/constants.js';
import { getPieceLabel } from '../labels/utils.js';
import { SPECIAL_MOVES, SPECIAL_MOVE_LABELS } from '../moves/constants.js';
import { isSquare } from '../squares/utils.js';
import {
  MOVE_PART_SEPARATOR,
  PLACEHOLDER_PATTERN,
  SENTENCE_END,
  SENTENCE_SEPARATOR,
  SIDE_LABELS,
  STATUS_TEXTS,
} from './constants.js';

/**
 * Replaces each `{name}` placeholder of a text by its value.
 *
 * @param {object} params
 * @param {string} params.text The text, such as `'Aux {side} de jouer.'`.
 * @param {Record<string, string>} params.values The value of each placeholder.
 * @returns {string} The text with its placeholders replaced.
 */
function fillText({ text, values }) {
  return text.replace(PLACEHOLDER_PATTERN, (_, name) => values[name]);
}

/**
 * Returns the label of a key in a table of labels, without reading the keys that every object
 * inherits, such as `toString`.
 *
 * @param {object} params
 * @param {Readonly<Record<string, string>>} params.labels The labels, by key.
 * @param {unknown} params.key The key, which may be missing or of any type.
 * @returns {string | null} The label, or `null` when the table has no such key.
 */
function getLabel({ labels, key }) {
  const isKnownKey = typeof key === 'string' && Object.hasOwn(labels, key);
  return isKnownKey ? labels[key] : null;
}

/**
 * Returns the piece that a move took: the piece of the target square, or the pawn taken en
 * passant, which stands on another square.
 *
 * @param {{ piece: { color: string }, captured?: object | null, specialMove?: string | null }} move
 *   The move.
 * @returns {{ type: string, color: string } | null} The piece taken, or `null`.
 */
function getCapturedPiece({ piece, captured, specialMove }) {
  if (captured) return captured;
  const isEnPassant = specialMove === SPECIAL_MOVES.enPassant;
  return isEnPassant ? { type: 'pawn', color: getOpponent(piece.color) } : null;
}

/**
 * Describes a move in one sentence, such as `Dernier coup : pion blanc de e2 à e4.`.
 *
 * @param {object} params
 * @param {object} [params.lastMove] The move, as `Chessboard#move` returns it.
 * @param {string} [params.promotedType] The type the pawn was promoted to, if it was.
 * @returns {string | null} The sentence, or `null` when the move is missing or invalid.
 */
function describeMove({ lastMove, promotedType }) {
  if (!lastMove || typeof lastMove !== 'object') return null;

  const { from, to } = lastMove;
  const areSquares = [from, to].every(isSquare);
  const pieceLabel = lastMove.piece ? getPieceLabel(lastMove.piece) : null;
  if (!areSquares || !pieceLabel) return null;

  const parts = [
    fillText({ text: STATUS_TEXTS.lastMove, values: { piece: pieceLabel, from, to } }),
  ];
  const capturedPiece = getCapturedPiece(lastMove);
  const capturedLabel = capturedPiece ? getPieceLabel(capturedPiece) : null;
  if (capturedLabel) {
    parts.push(fillText({ text: STATUS_TEXTS.capture, values: { piece: capturedLabel } }));
  }
  const specialMoveLabel = getLabel({ labels: SPECIAL_MOVE_LABELS, key: lastMove.specialMove });
  if (specialMoveLabel) parts.push(specialMoveLabel);
  const promotedTypeLabel = getLabel({ labels: PIECE_TYPE_LABELS, key: promotedType });
  const isPromotion = lastMove.promotion === true && promotedTypeLabel !== null;
  if (isPromotion) {
    parts.push(fillText({ text: STATUS_TEXTS.promotion, values: { type: promotedTypeLabel } }));
  }
  return parts.join(MOVE_PART_SEPARATOR) + SENTENCE_END;
}

/**
 * Describes the position after a move: the end of the game, or the side to play and whether it
 * is in check.
 *
 * @param {object} params
 * @param {string} [params.outcome] One of `GAME_OUTCOMES`; anything else reads as `ongoing`.
 * @param {string} [params.color] The color to play.
 * @param {string} [params.winner] The winning color, after a checkmate.
 * @param {string} [params.drawReason] Why the game is drawn, one of `DRAW_REASONS`, after a draw.
 * @returns {string[]} The sentences, none when a color they need is missing.
 */
function describeOutcome({ outcome, color, winner, drawReason }) {
  if (outcome === GAME_OUTCOMES.stalemate) return [STATUS_TEXTS.stalemate];

  if (outcome === GAME_OUTCOMES.draw) {
    const reason = getLabel({ labels: DRAW_REASON_LABELS, key: drawReason });
    return reason
      ? [fillText({ text: STATUS_TEXTS.draw, values: { reason } })]
      : [STATUS_TEXTS.unexplainedDraw];
  }

  if (outcome === GAME_OUTCOMES.checkmate) {
    const winnerLabel = getLabel({ labels: SIDE_LABELS, key: winner });
    return winnerLabel
      ? [fillText({ text: STATUS_TEXTS.checkmate, values: { side: winnerLabel } })]
      : [];
  }

  const side = getLabel({ labels: SIDE_LABELS, key: color });
  if (!side) return [];
  const turn = fillText({ text: STATUS_TEXTS.turn, values: { side } });
  if (outcome !== GAME_OUTCOMES.check) return [turn];
  return [fillText({ text: STATUS_TEXTS.check, values: { side } }), turn];
}

/**
 * Returns the announcement read by screen readers after a move: the move, then the end of the
 * game, or the side to play and whether it is in check.
 *
 * @param {object} params
 * @param {object} [params.lastMove] The last move, as `Chessboard#move` returns it, if any.
 * @param {string} [params.promotedType] The type the pawn of the last move was promoted to.
 * @param {string} [params.outcome] What the move leaves the side to play in, one of
 *   `GAME_OUTCOMES`, as `getGameOutcome` returns it.
 * @param {'white' | 'black'} [params.color] The color to play.
 * @param {'white' | 'black'} [params.winner] The winning color, after a checkmate.
 * @param {string} [params.drawReason] Why the game is drawn, one of `DRAW_REASONS`, as
 *   `getGameOutcome` returns it after a draw.
 * @returns {string} The announcement, or an empty string when nothing valid is given.
 * @example
 * getStatusMessage({ outcome: 'ongoing', color: 'white' }); // 'Aux blancs de jouer.'
 * getStatusMessage({
 *   lastMove: { from: 'e2', to: 'e4', piece: { type: 'pawn', color: 'white' } },
 *   outcome: 'ongoing',
 *   color: 'black',
 * }); // 'Dernier coup : pion blanc de e2 à e4. Aux noirs de jouer.'
 */
export function getStatusMessage({
  lastMove,
  promotedType,
  outcome,
  color,
  winner,
  drawReason,
} = {}) {
  const moveSentence = describeMove({ lastMove, promotedType });
  const sentences = moveSentence ? [moveSentence] : [];
  sentences.push(...describeOutcome({ outcome, color, winner, drawReason }));
  return sentences.join(SENTENCE_SEPARATOR);
}
