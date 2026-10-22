import knight from './pieces/knight.js';
import queen from './pieces/queen.js';
import bishop from './pieces/bishop.js';
import pawn from './pieces/pawn.js';
import king from './pieces/king.js';
import rook from './pieces/rook.js';
import { isCastlingRook } from './castling/utils.js';
import { COLORS } from './colors/constants.js';
import { getOpponent, getPawnDirection } from './colors/utils.js';
import {
  ALL_DIRECTIONS,
  BISHOP_DIRECTIONS,
  CASTLING_KING_FILE_STEP,
  CASTLING_SIDES,
  KING_STEPS,
  KNIGHT_JUMPS,
  MAX_SLIDE_STEPS,
  PAWN_CAPTURE_FILE_STEPS,
  PAWN_DOUBLE_STEP,
  ROOK_DIRECTIONS,
  SPECIAL_MOVES,
} from './moves/constants.js';
import { isOpponentPiece } from './moves/utils.js';
import { areCoordinatesOnBoard, getEnPassantCaptureSquare } from './squares/utils.js';

const FILES = 'abcdefgh';
/** Piece types a pawn may be promoted to. */
const PROMOTION_PIECE_TYPES = ['queen', 'rook', 'bishop', 'knight'];
/** Rank a pawn of each color is promoted on: the last rank in its direction. */
const PROMOTION_RANKS = Object.freeze({ white: '8', black: '1' });

function fileIndex(letter) {
  return FILES.indexOf(letter);
}
function fileLetter(c) {
  return FILES[c];
}
function toSquare({ file, rank }) {
  return `${fileLetter(file)}${rank}`;
}

function buildStartingPosition() {
  const configs = [knight, queen, bishop, pawn, king, rook];
  const positions = {};
  for (const config of configs) {
    for (const color of COLORS) {
      for (const p of config.piece.startingSquares[color]) {
        positions[p] = { type: config.piece.type, color, hasMoved: false };
      }
    }
  }
  return positions;
}

export default class Chessboard {
  constructor() {
    this.board = new Map();
    this.currentColor = 'white';
    this.enPassantSquare = null; // target square where a pawn may be captured en passant
    this.promotionSquare = null; // square where a promotion is pending
    this.captures = { white: [], black: [] }; // pieces captured by each color
    this.isOver = false;
  }

  initialize() {
    const initial = buildStartingPosition();
    this.board = new Map(Object.entries(initial).map(([p, piece]) => [p, { ...piece }]));
    this.currentColor = 'white';
    this.enPassantSquare = null;
    this.promotionSquare = null;
    this.captures = { white: [], black: [] };
    this.isOver = false;
  }

  getPiece(position) {
    return this.board.get(position) ?? null;
  }

  // ─── Raw move generation (without check validation) ──────────────────────

  /**
   * Adds to `moves` the squares a piece reaches by sliding from its square, stopping before a
   * piece of its color and on a piece of the other color.
   * @param {object} params
   * @param {number} params.file File index of the piece, from 0 for `a`.
   * @param {number} params.rank Rank number of the piece.
   * @param {string} params.color Color of the piece.
   * @param {ReadonlyArray<number[]>} params.directions `[file, rank]` steps to slide along.
   * @param {number} params.maxSteps Farthest number of squares the piece slides.
   * @param {string[]} params.moves Squares found so far, extended in place.
   */
  _slidingMoves({ file, rank, color, directions, maxSteps, moves }) {
    for (const [dc, dr] of directions) {
      for (let i = 1; i <= maxSteps; i++) {
        const next = { file: file + dc * i, rank: rank + dr * i };
        if (!areCoordinatesOnBoard(next)) break;
        const dest = toSquare(next);
        const target = this.board.get(dest);
        if (target) {
          if (isOpponentPiece({ piece: target, color })) moves.push(dest); // capture
          break; // blocked
        }
        moves.push(dest);
      }
    }
  }

  _isEnPassantCapture({ piece, to }) {
    return piece.type === 'pawn' && to === this.enPassantSquare;
  }

  /**
   * Returns the raw moves of a piece, without checking whether the king stays in check.
   * @param {object} params
   * @param {string} params.position Square of the piece.
   * @param {object} params.piece The piece on that square.
   * @param {boolean} [params.forAttack] When true, pawns attack diagonally without an enemy
   *   piece there.
   */
  _rawMoves({ position, piece, forAttack = false }) {
    const c = fileIndex(position[0]);
    const r = parseInt(position[1]);
    const moves = [];
    const dir = getPawnDirection(piece.color);
    const slide = { file: c, rank: r, color: piece.color, moves };

    switch (piece.type) {
      case 'rook':
        this._slidingMoves({ ...slide, directions: ROOK_DIRECTIONS, maxSteps: MAX_SLIDE_STEPS });
        break;

      case 'bishop':
        this._slidingMoves({ ...slide, directions: BISHOP_DIRECTIONS, maxSteps: MAX_SLIDE_STEPS });
        break;

      case 'queen':
        this._slidingMoves({ ...slide, directions: ALL_DIRECTIONS, maxSteps: MAX_SLIDE_STEPS });
        break;

      case 'king':
        this._slidingMoves({ ...slide, directions: ALL_DIRECTIONS, maxSteps: KING_STEPS });
        break;

      case 'knight':
        for (const [dx, dy] of KNIGHT_JUMPS) {
          const next = { file: c + dx, rank: r + dy };
          if (areCoordinatesOnBoard(next)) {
            const dest = toSquare(next);
            const target = this.board.get(dest);
            const canLand = !target || isOpponentPiece({ piece: target, color: piece.color });
            if (canLand) moves.push(dest);
          }
        }
        break;

      case 'pawn':
        // Advance (not an attack)
        if (!forAttack) {
          const ahead = { file: c, rank: r + dir };
          const isAheadFree = areCoordinatesOnBoard(ahead) && !this.board.get(toSquare(ahead));
          if (isAheadFree) {
            moves.push(toSquare(ahead));
            // Double advance from the starting square
            if (!piece.hasMoved) {
              const twoAhead = { file: c, rank: r + PAWN_DOUBLE_STEP * dir };
              const isTwoAheadFree =
                areCoordinatesOnBoard(twoAhead) && !this.board.get(toSquare(twoAhead));
              if (isTwoAheadFree) moves.push(toSquare(twoAhead));
            }
          }
        }
        // Diagonal captures
        for (const dx of PAWN_CAPTURE_FILE_STEPS) {
          const next = { file: c + dx, rank: r + dir };
          if (areCoordinatesOnBoard(next)) {
            const dest = toSquare(next);
            const target = this.board.get(dest);
            const isCapture = isOpponentPiece({ piece: target, color: piece.color });
            if (forAttack || isCapture) {
              moves.push(dest);
            }
            // En passant
            const isEnPassantTarget = !forAttack && dest === this.enPassantSquare;
            if (isEnPassantTarget) {
              moves.push(dest);
            }
          }
        }
        break;
    }

    return moves;
  }

  // ─── Check detection ──────────────────────────────────────────────────────

  _squaresAttackedBy(color) {
    const attacked = new Set();
    for (const [p, piece] of this.board) {
      if (piece.color === color) {
        for (const dest of this._rawMoves({ position: p, piece, forAttack: true })) {
          attacked.add(dest);
        }
      }
    }
    return attacked;
  }

  isInCheck(color) {
    let kingSquare = null;
    for (const [p, piece] of this.board) {
      const isOwnKing = piece.type === 'king' && piece.color === color;
      if (isOwnKing) {
        kingSquare = p;
        break;
      }
    }
    if (!kingSquare) return false;
    return this._squaresAttackedBy(getOpponent(color)).has(kingSquare);
  }

  // Simulates a move and returns true when it leaves the king of the moving color in check
  _leavesKingInCheck({ from, to }) {
    const piece = this.board.get(from);
    const captured = this.board.get(to);

    // En passant: square of the captured pawn
    let enPassantCaptureSquare = null;
    let enPassantPawn = null;
    if (this._isEnPassantCapture({ piece, to })) {
      enPassantCaptureSquare = getEnPassantCaptureSquare({ target: to, color: piece.color });
      enPassantPawn = this.board.get(enPassantCaptureSquare);
    }

    // Play the move
    this.board.set(to, piece);
    this.board.delete(from);
    if (enPassantCaptureSquare) this.board.delete(enPassantCaptureSquare);

    const inCheck = this.isInCheck(piece.color);

    // Undo the move
    this.board.set(from, piece);
    if (captured) this.board.set(to, captured);
    else this.board.delete(to);
    const hasRemovedEnPassantPawn = Boolean(enPassantCaptureSquare && enPassantPawn);
    if (hasRemovedEnPassantPawn) {
      this.board.set(enPassantCaptureSquare, enPassantPawn);
    }

    return inCheck;
  }

  // ─── Legal moves (with check validation and castling) ────────────────────

  getMoves(position) {
    const piece = this.board.get(position);
    if (!piece) return [];

    const moves = this._rawMoves({ position, piece });

    // Add castling for the king
    const canKingCastle = piece.type === 'king' && !piece.hasMoved && !this.isInCheck(piece.color);
    if (canKingCastle) {
      const r = parseInt(position[1]);
      const attacked = this._squaresAttackedBy(getOpponent(piece.color));

      const isEmptyFile = (file) => !this.board.get(`${file}${r}`);
      const isSafeFile = (file) => !attacked.has(`${file}${r}`);

      for (const side of CASTLING_SIDES) {
        const rook = this.board.get(`${side.rookFile}${r}`);
        const hasCastlingRook = isCastlingRook({ piece: rook, color: piece.color });
        const isPathEmpty = side.emptyFiles.every(isEmptyFile);
        const isPathSafe = side.safeFiles.every(isSafeFile);
        if (hasCastlingRook && isPathEmpty && isPathSafe) {
          moves.push(`${side.kingTargetFile}${r}`);
        }
      }
    }

    // Drop the moves that leave the king in check
    return moves.filter((dest) => !this._leavesKingInCheck({ from: position, to: dest }));
  }

  // ─── Game state ───────────────────────────────────────────────────────────

  _hasNoLegalMove(color) {
    // Iterate over a snapshot of the board: _leavesKingInCheck deletes and restores Map entries,
    // which can change their insertion order and make a loop over the Map itself never end.
    const entries = [...this.board.entries()];
    for (const [p, piece] of entries) {
      const hasLegalMove = piece.color === color && this.getMoves(p).length > 0;
      if (hasLegalMove) {
        return false;
      }
    }
    return true;
  }

  isCheckmate(color) {
    return this.isInCheck(color) && this._hasNoLegalMove(color);
  }

  isStalemate(color) {
    return !this.isInCheck(color) && this._hasNoLegalMove(color);
  }

  // ─── Playing a move ───────────────────────────────────────────────────────

  /**
   * Moves the piece on `from` to `to`.
   * Returns an object describing the move, or null when the move is illegal, the game is
   * over, a promotion is pending, or the piece does not belong to the side to move.
   * @param {object | null} [params]
   * @param {string} params.from Square of the piece to move.
   * @param {string} params.to Square the piece moves to.
   */
  move(params) {
    const { from, to } = params ?? {};
    const isPromotionPending = this.promotionSquare !== null;
    if (this.isOver || isPromotionPending) return null;

    const piece = this.board.get(from);
    if (!piece) return null;
    const isSideToMove = piece.color === this.currentColor;
    if (!isSideToMove) return null;

    const legalMoves = this.getMoves(from);
    const isLegalMove = legalMoves.includes(to);
    if (!isLegalMove) return null;

    const captured = this.board.get(to) ?? null;
    let specialMove = null;
    let enPassantCaptureSquare = null;

    // ── Castling ──
    const fromFile = fileIndex(from[0]);
    const toFile = fileIndex(to[0]);
    const isCastling =
      piece.type === 'king' && Math.abs(fromFile - toFile) === CASTLING_KING_FILE_STEP;
    if (isCastling) {
      const r = parseInt(to[1]);
      const side = CASTLING_SIDES.find(({ kingTargetFile }) => kingTargetFile === to[0]);
      const rook = this.board.get(`${side.rookFile}${r}`);
      this.board.set(`${side.rookTargetFile}${r}`, { ...rook, hasMoved: true });
      this.board.delete(`${side.rookFile}${r}`);
      specialMove = side.specialMove;
    }

    // ── En passant: capture the opponent's pawn ──
    if (this._isEnPassantCapture({ piece, to })) {
      enPassantCaptureSquare = getEnPassantCaptureSquare({ target: to, color: piece.color });
      const capturedPawn = this.board.get(enPassantCaptureSquare);
      if (capturedPawn) {
        this.captures[piece.color].push(capturedPawn);
        this.board.delete(enPassantCaptureSquare);
      }
      specialMove = SPECIAL_MOVES.enPassant;
    }

    // ── Update the en passant target ──
    const fromRank = parseInt(from[1]);
    const toRank = parseInt(to[1]);
    const isPawnDoubleStep =
      piece.type === 'pawn' && Math.abs(toRank - fromRank) === PAWN_DOUBLE_STEP;
    if (isPawnDoubleStep) {
      const middleRank = (fromRank + toRank) / 2;
      this.enPassantSquare = `${from[0]}${middleRank}`;
    } else {
      this.enPassantSquare = null;
    }

    // ── Move the piece ──
    this.board.set(to, { ...piece, hasMoved: true });
    this.board.delete(from);

    // ── Record the capture ──
    if (captured) this.captures[piece.color].push(captured);

    // ── Promotion ──
    const promotion = piece.type === 'pawn' && to[1] === PROMOTION_RANKS[piece.color];
    if (promotion) {
      this.promotionSquare = to;
      // The turn passes after the promotion (through promote())
    } else {
      this.currentColor = getOpponent(this.currentColor);
    }

    return { from, to, piece, captured, specialMove, enPassantCaptureSquare, promotion };
  }

  /**
   * Turns the promoted pawn into the chosen piece.
   * Ignores a position other than the pending promotion and a type outside
   * PROMOTION_PIECE_TYPES.
   * @param {object | null} [params]
   * @param {string} params.position Square of the pawn to promote.
   * @param {string} params.type Piece type: 'queen' | 'rook' | 'bishop' | 'knight'.
   * @returns {boolean} true when the pawn was promoted, false when the call was ignored.
   */
  promote(params) {
    const { position, type } = params ?? {};
    const isPendingPromotionSquare =
      this.promotionSquare !== null && position === this.promotionSquare;
    const isAllowedType = PROMOTION_PIECE_TYPES.includes(type);
    if (!isPendingPromotionSquare || !isAllowedType) return false;

    const piece = this.board.get(position);
    if (!piece) return false;
    this.board.set(position, { ...piece, type });
    this.promotionSquare = null;
    this.currentColor = getOpponent(this.currentColor);
    return true;
  }
}
