import knight from './pieces/knight.js';
import queen from './pieces/queen.js';
import bishop from './pieces/bishop.js';
import pawn from './pieces/pawn.js';
import king from './pieces/king.js';
import rook from './pieces/rook.js';
import { isCastlingRook } from './castling/utils.js';
import { COLORS } from './colors/constants.js';
import { getOpponent, getPawnDirection } from './colors/utils.js';
import { SPECIAL_MOVES } from './moves/constants.js';
import { getEnPassantCaptureSquare } from './squares/utils.js';

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
function toSquare(c, r) {
  return `${fileLetter(c)}${r}`;
}
function isOnBoard(c, r) {
  return c >= 0 && c < 8 && r >= 1 && r <= 8;
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

  _slidingMoves(c, r, color, directions, maxSteps, moves) {
    for (const [dc, dr] of directions) {
      for (let i = 1; i <= maxSteps; i++) {
        const nc = c + dc * i;
        const nr = r + dr * i;
        if (!isOnBoard(nc, nr)) break;
        const dest = toSquare(nc, nr);
        const target = this.board.get(dest);
        if (target) {
          if (target.color !== color) moves.push(dest); // capture
          break; // blocked
        }
        moves.push(dest);
      }
    }
  }

  /**
   * Returns the raw moves of a piece, without checking whether the king stays in check.
   * @param {string} position
   * @param {object} piece
   * @param {boolean} forAttack When true, pawns attack diagonally without an enemy piece there.
   */
  _rawMoves(position, piece, forAttack = false) {
    const c = fileIndex(position[0]);
    const r = parseInt(position[1]);
    const moves = [];
    const dir = getPawnDirection(piece.color);

    switch (piece.type) {
      case 'rook':
        this._slidingMoves(
          c,
          r,
          piece.color,
          [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
          ],
          7,
          moves
        );
        break;

      case 'bishop':
        this._slidingMoves(
          c,
          r,
          piece.color,
          [
            [1, 1],
            [1, -1],
            [-1, -1],
            [-1, 1],
          ],
          7,
          moves
        );
        break;

      case 'queen':
        this._slidingMoves(
          c,
          r,
          piece.color,
          [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, -1],
            [-1, 1],
          ],
          7,
          moves
        );
        break;

      case 'king':
        this._slidingMoves(
          c,
          r,
          piece.color,
          [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, -1],
            [-1, 1],
          ],
          1,
          moves
        );
        break;

      case 'knight':
        for (const [dx, dy] of [
          [1, 2],
          [-1, 2],
          [2, 1],
          [2, -1],
          [-2, 1],
          [-2, -1],
          [1, -2],
          [-1, -2],
        ]) {
          const nc = c + dx;
          const nr = r + dy;
          if (isOnBoard(nc, nr)) {
            const dest = toSquare(nc, nr);
            const target = this.board.get(dest);
            if (!target || target.color !== piece.color) moves.push(dest);
          }
        }
        break;

      case 'pawn':
        // Advance (not an attack)
        if (!forAttack) {
          const ahead = toSquare(c, r + dir);
          if (isOnBoard(c, r + dir) && !this.board.get(ahead)) {
            moves.push(ahead);
            // Double advance from the starting square
            if (!piece.hasMoved) {
              const twoAhead = toSquare(c, r + 2 * dir);
              if (isOnBoard(c, r + 2 * dir) && !this.board.get(twoAhead)) {
                moves.push(twoAhead);
              }
            }
          }
        }
        // Diagonal captures
        for (const dx of [-1, 1]) {
          const nc = c + dx;
          const nr = r + dir;
          if (isOnBoard(nc, nr)) {
            const dest = toSquare(nc, nr);
            const target = this.board.get(dest);
            if (forAttack || (target && target.color !== piece.color)) {
              moves.push(dest);
            }
            // En passant
            if (!forAttack && dest === this.enPassantSquare) {
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
        for (const dest of this._rawMoves(p, piece, true)) {
          attacked.add(dest);
        }
      }
    }
    return attacked;
  }

  isInCheck(color) {
    let kingSquare = null;
    for (const [p, piece] of this.board) {
      if (piece.type === 'king' && piece.color === color) {
        kingSquare = p;
        break;
      }
    }
    if (!kingSquare) return false;
    return this._squaresAttackedBy(getOpponent(color)).has(kingSquare);
  }

  // Simulates a move and returns true when it leaves the king of the moving color in check
  _leavesKingInCheck(from, to) {
    const piece = this.board.get(from);
    const captured = this.board.get(to);

    // En passant: square of the captured pawn
    let enPassantCaptureSquare = null;
    let enPassantPawn = null;
    if (piece.type === 'pawn' && to === this.enPassantSquare) {
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
    if (enPassantCaptureSquare && enPassantPawn) {
      this.board.set(enPassantCaptureSquare, enPassantPawn);
    }

    return inCheck;
  }

  // ─── Legal moves (with check validation and castling) ────────────────────

  getMoves(position) {
    const piece = this.board.get(position);
    if (!piece) return [];

    const moves = this._rawMoves(position, piece);

    // Add castling for the king
    if (piece.type === 'king' && !piece.hasMoved && !this.isInCheck(piece.color)) {
      const r = parseInt(position[1]);
      const attacked = this._squaresAttackedBy(getOpponent(piece.color));

      // Kingside castling
      const rookH = this.board.get(`h${r}`);
      if (
        isCastlingRook({ piece: rookH, color: piece.color }) &&
        !this.board.get(`f${r}`) &&
        !this.board.get(`g${r}`) &&
        !attacked.has(`f${r}`) &&
        !attacked.has(`g${r}`)
      ) {
        moves.push(`g${r}`);
      }

      // Queenside castling
      const rookA = this.board.get(`a${r}`);
      if (
        isCastlingRook({ piece: rookA, color: piece.color }) &&
        !this.board.get(`b${r}`) &&
        !this.board.get(`c${r}`) &&
        !this.board.get(`d${r}`) &&
        !attacked.has(`c${r}`) &&
        !attacked.has(`d${r}`)
      ) {
        moves.push(`c${r}`);
      }
    }

    // Drop the moves that leave the king in check
    return moves.filter((dest) => !this._leavesKingInCheck(position, dest));
  }

  // ─── Game state ───────────────────────────────────────────────────────────

  _hasNoLegalMove(color) {
    // Iterate over a snapshot of the board: _leavesKingInCheck deletes and restores Map entries,
    // which can change their insertion order and make a loop over the Map itself never end.
    const entries = [...this.board.entries()];
    for (const [p, piece] of entries) {
      if (piece.color === color && this.getMoves(p).length > 0) {
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
   */
  move(from, to) {
    const isPromotionPending = this.promotionSquare !== null;
    if (this.isOver || isPromotionPending) return null;

    const piece = this.board.get(from);
    if (!piece) return null;
    const isSideToMove = piece.color === this.currentColor;
    if (!isSideToMove) return null;

    const legalMoves = this.getMoves(from);
    if (!legalMoves.includes(to)) return null;

    const captured = this.board.get(to) ?? null;
    let specialMove = null;
    let enPassantCaptureSquare = null;

    // ── Castling ──
    const fromFile = fileIndex(from[0]);
    const toFile = fileIndex(to[0]);
    if (piece.type === 'king' && Math.abs(fromFile - toFile) === 2) {
      const r = parseInt(to[1]);
      if (toFile > fromFile) {
        // Kingside castling
        const rook = this.board.get(`h${r}`);
        this.board.set(`f${r}`, { ...rook, hasMoved: true });
        this.board.delete(`h${r}`);
        specialMove = SPECIAL_MOVES.kingsideCastling;
      } else {
        // Queenside castling
        const rook = this.board.get(`a${r}`);
        this.board.set(`d${r}`, { ...rook, hasMoved: true });
        this.board.delete(`a${r}`);
        specialMove = SPECIAL_MOVES.queensideCastling;
      }
    }

    // ── En passant: capture the opponent's pawn ──
    if (piece.type === 'pawn' && to === this.enPassantSquare) {
      enPassantCaptureSquare = getEnPassantCaptureSquare({ target: to, color: piece.color });
      const capturedPawn = this.board.get(enPassantCaptureSquare);
      if (capturedPawn) {
        this.captures[piece.color].push(capturedPawn);
        this.board.delete(enPassantCaptureSquare);
      }
      specialMove = SPECIAL_MOVES.enPassant;
    }

    // ── Update the en passant target ──
    if (piece.type === 'pawn' && Math.abs(parseInt(to[1]) - parseInt(from[1])) === 2) {
      const middleRank = (parseInt(from[1]) + parseInt(to[1])) / 2;
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
   * @param {string} position Square of the pawn to promote.
   * @param {string} type Piece type: 'queen' | 'rook' | 'bishop' | 'knight'.
   * @returns {boolean} true when the pawn was promoted, false when the call was ignored.
   */
  promote(position, type) {
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
