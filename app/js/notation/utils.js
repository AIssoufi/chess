import { getLabel } from '../labels/utils.js';
import { SPECIAL_MOVES } from '../moves/constants.js';
import { isSquare } from '../squares/utils.js';
import {
  CAPTURE_SIGN,
  CASTLING_NOTATIONS,
  FIRST_TURN_NUMBER,
  MOVES_PER_TURN,
  OUTCOME_SIGNS,
  PIECE_LETTERS,
  PROMOTION_SIGN,
  PROMOTION_TYPES,
} from './constants.js';

/**
 * Returns what tells a piece apart from the other pieces of its type and color that could reach
 * the same square: nothing without such a piece, else the file of its square, else its rank, else
 * the whole square.
 *
 * @param {object} params
 * @param {string} params.from The square the piece leaves.
 * @param {unknown} [params.rivalSquares] The squares of the other pieces that could reach the
 *   target square; values that are not squares, and `from` itself, are ignored.
 * @returns {string} The file, the rank, the square or an empty string.
 */
function getDisambiguation({ from, rivalSquares }) {
  if (!Array.isArray(rivalSquares)) return '';
  const isRivalSquare = (square) => isSquare(square) && square !== from;
  const rivals = rivalSquares.filter(isRivalSquare);
  if (rivals.length === 0) return '';

  const [file, rank] = from;
  const sharesFile = rivals.some((square) => square[0] === file);
  if (!sharesFile) return file;
  const sharesRank = rivals.some((square) => square[1] === rank);
  return sharesRank ? from : rank;
}

/**
 * Returns what the notation writes before the target square, besides the capture sign: the file
 * of a capturing pawn, nothing for another pawn move, and what tells another piece apart.
 *
 * @param {object} params
 * @param {string} params.from The square the piece leaves.
 * @param {boolean} params.isPawn Whether the moving piece is a pawn.
 * @param {boolean} params.isCapture Whether the move takes a piece.
 * @param {unknown} [params.rivalSquares] The squares of the other pieces that could reach the
 *   target square.
 * @returns {string} The origin, possibly empty.
 */
function getOrigin({ from, isPawn, isCapture, rivalSquares }) {
  if (isPawn) return isCapture ? from[0] : '';
  return getDisambiguation({ from, rivalSquares });
}

/**
 * Returns the end of the notation of a promotion, such as `=D`.
 *
 * @param {object} params
 * @param {unknown} params.promotion Whether the move promotes a pawn, `true` only.
 * @param {unknown} [params.promotedType] The type the pawn was promoted to.
 * @returns {string | null} The sign and the letter of the new piece, an empty string for a move
 *   that promotes nothing, or `null` for a promotion to a type a pawn cannot take.
 */
function getPromotionSuffix({ promotion, promotedType }) {
  if (promotion !== true) return '';
  if (!PROMOTION_TYPES.includes(promotedType)) return null;
  return `${PROMOTION_SIGN}${PIECE_LETTERS[promotedType]}`;
}

/**
 * Writes a move in French algebraic notation: the letter of the piece (`R`, `D`, `T`, `F`, `C`,
 * none for a pawn), what tells it apart from a piece of the same kind, `x` for a capture, the
 * target square, the new piece of a promotion, then `+` for check or `#` for checkmate. Castling
 * reads `O-O` or `O-O-O`, and an en passant capture `exd6`.
 *
 * @param {object | null} [params]
 * @param {object} params.move The move, as `Chessboard#move` returns it.
 * @param {string} [params.promotedType] The type the pawn of the move was promoted to, if it was.
 * @param {string} [params.outcome] What the move leaves the side to play in, one of
 *   `GAME_OUTCOMES`, as `getGameOutcome` returns it once the move and its promotion are played.
 * @param {string[]} [params.rivalSquares] The squares of the other pieces of the same type and
 *   color that could also reach the target square before the move, as `getRivalSquares` returns
 *   them.
 * @returns {string | null} The notation, or `null` for a missing move, a move whose squares are not
 *   squares or whose piece type is unknown, and a promotion without a valid new piece.
 * @example
 * getMoveNotation({ move: { from: 'g1', to: 'f3', piece: { type: 'knight', color: 'white' } } });
 * // 'Cf3'
 * // The pawn of e7 takes on d8, becomes a queen and mates:
 * getMoveNotation({ move, promotedType: 'queen', outcome: 'checkmate' }); // 'exd8=D#'
 */
export function getMoveNotation(params) {
  const { move, promotedType, outcome, rivalSquares } = params ?? {};
  const hasMove = typeof move === 'object' && move !== null;
  if (!hasMove) return null;

  const { from, to, piece, captured, specialMove, promotion } = move;
  const areSquares = [from, to].every(isSquare);
  const letter = getLabel({ labels: PIECE_LETTERS, key: piece?.type });
  const isKnownMove = areSquares && letter !== null;
  if (!isKnownMove) return null;

  const outcomeSign = getLabel({ labels: OUTCOME_SIGNS, key: outcome }) ?? '';
  const castling = getLabel({ labels: CASTLING_NOTATIONS, key: specialMove });
  if (castling) return `${castling}${outcomeSign}`;

  const promotionSuffix = getPromotionSuffix({ promotion, promotedType });
  if (promotionSuffix === null) return null;

  const isCapture = Boolean(captured) || specialMove === SPECIAL_MOVES.enPassant;
  const isPawn = piece.type === 'pawn';
  const origin = getOrigin({ from, isPawn, isCapture, rivalSquares });
  const captureSign = isCapture ? CAPTURE_SIGN : '';
  return `${letter}${origin}${captureSign}${to}${promotionSuffix}${outcomeSign}`;
}

/**
 * Lists the other pieces of the same type and color as the piece on a square that could also
 * move to a target square, which the notation of the move must tell apart. Call it before the
 * move is played.
 *
 * @param {object | null} [params]
 * @param {import('../Chessboard.js').default} params.game The game, before the move.
 * @param {string} params.from The square of the moving piece.
 * @param {string} params.to The square it moves to.
 * @returns {string[]} The squares of those pieces, none for a missing game, an empty `from` and a
 *   target that is not a square.
 * @example
 * // Knights on b1 and f3, both of which can reach d2:
 * getRivalSquares({ game, from: 'b1', to: 'd2' }); // ['f3']
 */
export function getRivalSquares(params) {
  const { game, from, to } = params ?? {};
  const hasBoard = game?.board instanceof Map;
  const piece = hasBoard ? game.board.get(from) : undefined;
  const isValidMove = Boolean(piece) && isSquare(to);
  if (!isValidMove) return [];

  const canAlsoReach = ([square, other]) => {
    const isSameKind = other.type === piece.type && other.color === piece.color;
    return square !== from && isSameKind && game.getMoves(square).includes(to);
  };
  // A snapshot: getMoves deletes and re-inserts Map keys, so a loop over the Map would never end.
  return [...game.board.entries()].filter(canAlsoReach).map(([square]) => square);
}

/**
 * Groups the moves of a game by turn, white first, as the move list numbers them.
 *
 * @param {unknown} notations The notation of each move, in the order they were played.
 * @returns {{ number: number, white: string | null, black: string | null }[]} One turn per pair
 *   of moves, `black` being `null` while black has not answered. An entry that is not a string
 *   reads as `null`, and a value that is not an array gives no turn.
 * @example
 * getMoveTurns(['e4', 'e5', 'Cf3']);
 * // [{ number: 1, white: 'e4', black: 'e5' }, { number: 2, white: 'Cf3', black: null }]
 */
export function getMoveTurns(notations) {
  if (!Array.isArray(notations)) return [];

  const toNotationOrNull = (notation) => (typeof notation === 'string' ? notation : null);
  const turns = [];
  for (let index = 0; index < notations.length; index += MOVES_PER_TURN) {
    turns.push({
      number: FIRST_TURN_NUMBER + index / MOVES_PER_TURN,
      white: toNotationOrNull(notations[index]),
      black: toNotationOrNull(notations[index + 1]),
    });
  }
  return turns;
}
