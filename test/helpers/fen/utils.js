import Chessboard from '../../../app/js/Chessboard.js';
import pawn from '../../../app/js/pieces/pawn.js';
import { COLORS } from '../../../app/js/colors/constants.js';
import { getOpponent } from '../../../app/js/colors/utils.js';
import { BOARD_FILES, BOARD_SIZE } from '../../../app/js/squares/constants.js';
import { getEnPassantCaptureSquare, isSquare } from '../../../app/js/squares/utils.js';
import {
  CASTLING_PATTERN,
  CASTLING_PIECE_TYPES,
  CASTLING_RIGHTS,
  EMPTY_FIELD,
  EMPTY_SQUARES_PATTERN,
  EN_PASSANT_RANKS,
  FIELD_SEPARATOR_PATTERN,
  MAX_FIELD_COUNT,
  MIN_FIELD_COUNT,
  PAWNLESS_RANKS,
  PIECE_TYPES,
  SIDES,
} from './constants.js';

/**
 * Builds the error thrown for a FEN that the loader refuses.
 *
 * @param {object} params
 * @param {unknown} params.fen The refused FEN.
 * @param {string} params.reason What is wrong with it.
 * @returns {Error} The error to throw.
 */
function invalidFen({ fen, reason }) {
  return new Error(`Invalid FEN "${fen}": ${reason}`);
}

/**
 * Tells whether the FEN shows that a piece has moved, as far as the model cares: a pawn off its
 * starting squares, and every king and rook until a castling right says otherwise. Other pieces
 * stay unmoved, as the model creates them.
 *
 * @param {object} params
 * @param {string} params.type The piece type.
 * @param {'white' | 'black'} params.color The piece color.
 * @param {string} params.square The square of the piece.
 * @returns {boolean} The `hasMoved` flag of the piece before the castling rights are read.
 */
function hasPieceMoved({ type, color, square }) {
  if (type === 'pawn') {
    const isOnStartingSquare = pawn.piece.startingSquares[color].includes(square);
    return !isOnStartingSquare;
  }
  return CASTLING_PIECE_TYPES.includes(type);
}

/**
 * Reads one rank of the placement field onto the board.
 *
 * @param {object} params
 * @param {string} params.fen The whole FEN, for the error messages.
 * @param {string} params.row The rank as the FEN writes it, such as `'r3k2r'`.
 * @param {number} params.rank The number of the rank, from 1 to 8.
 * @param {Map<string, { type: string, color: string, hasMoved: boolean }>} params.board The board,
 *   changed in place.
 */
function parseRank({ fen, row, rank, board }) {
  let fileIndex = 0;
  for (const letter of row) {
    if (EMPTY_SQUARES_PATTERN.test(letter)) {
      fileIndex += Number(letter);
      continue;
    }
    const type = PIECE_TYPES[letter.toLowerCase()];
    if (!type) throw invalidFen({ fen, reason: `unknown piece "${letter}"` });
    if (fileIndex >= BOARD_SIZE) throw invalidFen({ fen, reason: `rank ${rank} is too long` });
    const isPawnOnPawnlessRank = type === 'pawn' && PAWNLESS_RANKS.includes(rank);
    if (isPawnOnPawnlessRank) throw invalidFen({ fen, reason: `pawn on rank ${rank}` });

    const isWhite = letter === letter.toUpperCase();
    const color = isWhite ? 'white' : 'black';
    const square = `${BOARD_FILES[fileIndex]}${rank}`;
    board.set(square, { type, color, hasMoved: hasPieceMoved({ type, color, square }) });
    fileIndex += 1;
  }
  if (fileIndex !== BOARD_SIZE) {
    throw invalidFen({ fen, reason: `rank ${rank} holds ${fileIndex} squares` });
  }
}

/**
 * Checks that each color has exactly one king, which the model needs to find checks.
 *
 * @param {object} params
 * @param {string} params.fen The whole FEN, for the error messages.
 * @param {Map<string, { type: string, color: string, hasMoved: boolean }>} params.board The board.
 */
function checkKingCounts({ fen, board }) {
  for (const color of COLORS) {
    const isKingOfColor = (piece) => piece.type === 'king' && piece.color === color;
    const kingCount = [...board.values()].filter(isKingOfColor).length;
    if (kingCount !== 1) throw invalidFen({ fen, reason: `${kingCount} ${color} kings` });
  }
}

/**
 * Reads the piece placement field into a board, with the `hasMoved` flags of `hasPieceMoved`.
 *
 * @param {object} params
 * @param {string} params.fen The whole FEN, for the error messages.
 * @param {string} params.placement The first field of the FEN, rank 8 first.
 * @returns {Map<string, { type: string, color: string, hasMoved: boolean }>} The board.
 */
function parsePlacement({ fen, placement }) {
  const rows = placement.split('/');
  if (rows.length !== BOARD_SIZE) {
    throw invalidFen({ fen, reason: `${rows.length} ranks instead of ${BOARD_SIZE}` });
  }

  const board = new Map();
  rows.forEach((row, rowIndex) => parseRank({ fen, row, rank: BOARD_SIZE - rowIndex, board }));
  checkKingCounts({ fen, board });
  return board;
}

/**
 * Marks as unmoved the king and the rook of each castling right of the FEN.
 *
 * @param {object} params
 * @param {string} params.fen The whole FEN, for the error messages.
 * @param {string} params.castling The castling field of the FEN, such as `KQkq` or `-`.
 * @param {Map<string, { type: string, color: string, hasMoved: boolean }>} params.board The board
 *   read from the placement field, changed in place.
 */
function applyCastlingRights({ fen, castling, board }) {
  if (!CASTLING_PATTERN.test(castling)) {
    throw invalidFen({ fen, reason: `bad castling rights "${castling}"` });
  }
  if (castling === EMPTY_FIELD) return;

  for (const right of castling) {
    const { color, kingSquare, rookSquare } = CASTLING_RIGHTS[right];
    const king = board.get(kingSquare);
    const rook = board.get(rookSquare);
    const isKingInPlace = king?.type === 'king' && king.color === color;
    const isRookInPlace = rook?.type === 'rook' && rook.color === color;
    if (!isKingInPlace || !isRookInPlace) {
      throw invalidFen({ fen, reason: `castling right "${right}" without its king and rook` });
    }
    king.hasMoved = false;
    rook.hasMoved = false;
  }
}

/**
 * Reads the en passant field: the square behind a pawn of the opponent that has just moved two
 * squares.
 *
 * @param {object} params
 * @param {string} params.fen The whole FEN, for the error messages.
 * @param {string} params.enPassant The en passant field of the FEN, such as `d6` or `-`.
 * @param {'white' | 'black'} params.color The color to move.
 * @param {Map<string, { type: string, color: string, hasMoved: boolean }>} params.board The board.
 * @returns {string | null} The en passant target square, or `null` for none.
 */
function parseEnPassant({ fen, enPassant, color, board }) {
  if (enPassant === EMPTY_FIELD) return null;

  const isOnTargetRank = enPassant[1] === EN_PASSANT_RANKS[color];
  if (!isSquare(enPassant) || !isOnTargetRank) {
    throw invalidFen({ fen, reason: `bad en passant square "${enPassant}"` });
  }

  const pushedPawn = board.get(getEnPassantCaptureSquare({ target: enPassant, color }));
  const hasPushedPawn = pushedPawn?.type === 'pawn' && pushedPawn.color === getOpponent(color);
  if (!hasPushedPawn) {
    throw invalidFen({ fen, reason: `no pawn to capture en passant on "${enPassant}"` });
  }
  return enPassant;
}

/**
 * Builds a game from a position in Forsyth-Edwards Notation. The halfmove clock and the move
 * number, when present, are ignored, since the model has neither.
 *
 * @param {string} fen The position, such as
 *   `'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'`.
 * @returns {Chessboard} A game in that position, with no capture and no pending promotion.
 * @throws {Error} When the FEN is not a string or does not describe a position the model can play:
 *   a wrong field count, a rank of the wrong length, an unknown piece, a pawn on rank 1 or 8, other
 *   than one king of each color, a bad side, castling right or en passant square.
 * @example
 * loadFen('4k3/8/8/8/8/8/8/4K2R w K -').getMoves('e1'); // includes 'g1'
 */
export function loadFen(fen) {
  if (typeof fen !== 'string') throw invalidFen({ fen, reason: 'not a string' });

  const fields = fen.trim().split(FIELD_SEPARATOR_PATTERN);
  const hasFieldCount = fields.length >= MIN_FIELD_COUNT && fields.length <= MAX_FIELD_COUNT;
  if (!hasFieldCount) throw invalidFen({ fen, reason: `${fields.length} fields` });

  const [placement, side, castling, enPassant] = fields;
  const color = SIDES[side];
  if (!color) throw invalidFen({ fen, reason: `bad side to move "${side}"` });

  const board = parsePlacement({ fen, placement });
  applyCastlingRights({ fen, castling, board });

  const game = new Chessboard();
  game.board = board;
  game.currentColor = color;
  game.enPassantSquare = parseEnPassant({ fen, enPassant, color, board });
  return game;
}
