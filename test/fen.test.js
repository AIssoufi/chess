import { describe, it, expect } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';
import { STARTING_FEN } from './helpers/fen/constants.js';
import { loadFen } from './helpers/fen/utils.js';

const CASTLING_FEN = 'r3k2r/8/8/8/8/8/8/R3K2R';

describe('loadFen', () => {
  it('builds the starting position of the model, clocks included or not', () => {
    const initialGame = new Chessboard();
    initialGame.initialize();

    for (const fen of [STARTING_FEN, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -']) {
      const game = loadFen(fen);
      expect(game.board).toEqual(initialGame.board);
      expect(game.currentColor).toBe('white');
      expect(game.enPassantSquare).toBeNull();
      expect(game.promotionSquare).toBeNull();
    }
  });

  it('reads the side to move and the en passant square', () => {
    const game = loadFen('rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 3');

    expect(game.currentColor).toBe('black');
    expect(game.enPassantSquare).toBe('e3');
    expect(game.getMoves('d4')).toContain('e3');
  });

  it('marks as moved every pawn off its starting squares, and no other piece', () => {
    const game = loadFen('4k3/1P6/8/8/8/2N5/1p2P3/4K3 w - -');

    expect(game.getPiece('e2').hasMoved).toBe(false);
    expect(game.getPiece('b2').hasMoved).toBe(true);
    expect(game.getPiece('b7').hasMoved).toBe(true);
    expect(game.getPiece('c3').hasMoved).toBe(false);
  });

  it('leaves unmoved only the kings and rooks of the castling rights', () => {
    const game = loadFen(`${CASTLING_FEN} w Kq -`);

    expect(game.getPiece('e1').hasMoved).toBe(false);
    expect(game.getPiece('h1').hasMoved).toBe(false);
    expect(game.getPiece('a1').hasMoved).toBe(true);
    expect(game.getPiece('e8').hasMoved).toBe(false);
    expect(game.getPiece('a8').hasMoved).toBe(false);
    expect(game.getPiece('h8').hasMoved).toBe(true);
    expect(game.getMoves('e1')).toContain('g1');
    expect(game.getMoves('e1')).not.toContain('c1');
  });

  it('marks every king and rook as moved without castling rights', () => {
    const game = loadFen(`${CASTLING_FEN} w - -`);

    for (const square of ['a1', 'e1', 'h1', 'a8', 'e8', 'h8']) {
      expect(game.getPiece(square).hasMoved).toBe(true);
    }
  });

  it('ignores the spaces around and between the fields', () => {
    const game = loadFen(`  ${CASTLING_FEN}   b   KQkq   -  `);

    expect(game.currentColor).toBe('black');
    expect(game.board.size).toBe(6);
  });

  it.each([
    [undefined, 'not a string'],
    [null, 'not a string'],
    [42, 'not a string'],
    ['', '1 fields'],
    ['   ', '1 fields'],
    [`${CASTLING_FEN} w KQkq`, '3 fields'],
    [`${CASTLING_FEN} w KQkq - 0 1 extra`, '7 fields'],
    ['8/8/8/8/8/8/4k2K w - -', '7 ranks instead of 8'],
    ['4k3/8/8/8/8/8/8/4K3/8 w - -', '9 ranks instead of 8'],
    ['4k3/8/8/8/8/8/8/4K2 w - -', 'rank 1 holds 7 squares'],
    ['4k3/8/8/8/8/8/8/54K w - -', 'rank 1 is too long'],
    ['4k3/8/8/8/8/8/8/4K4 w - -', 'rank 1 holds 9 squares'],
    ['4k3/8/8/8/8/8/8/4K2X w - -', 'unknown piece "X"'],
    ['4k3/8/8/8/8/8/8/4K203 w - -', 'unknown piece "0"'],
    ['4k2P/8/8/8/8/8/8/4K3 w - -', 'pawn on rank 8'],
    ['4k3/8/8/8/8/8/8/p3K3 w - -', 'pawn on rank 1'],
    ['8/8/8/8/8/8/8/4K3 w - -', '0 black kings'],
    ['4k3/8/8/8/8/8/8/3KK3 w - -', '2 white kings'],
    [`${CASTLING_FEN} x KQkq -`, 'bad side to move "x"'],
    [`${CASTLING_FEN} W KQkq -`, 'bad side to move "W"'],
    [`${CASTLING_FEN} w qk -`, 'bad castling rights "qk"'],
    [`${CASTLING_FEN} w KK -`, 'bad castling rights "KK"'],
    [`${CASTLING_FEN} w K- -`, 'bad castling rights "K-"'],
    ['r3k2r/8/8/8/8/8/8/R3K3 w K -', 'castling right "K" without its king and rook'],
    ['r3k2r/8/8/8/8/8/8/R2K3R w Q -', 'castling right "Q" without its king and rook'],
    ['r3k2R/8/8/8/8/8/8/R3K3 w k -', 'castling right "k" without its king and rook'],
    [`${CASTLING_FEN} w - e9`, 'bad en passant square "e9"'],
    [`${CASTLING_FEN} w - e3`, 'bad en passant square "e3"'],
    [`${CASTLING_FEN} b - e6`, 'bad en passant square "e6"'],
    [`${CASTLING_FEN} w - e6`, 'no pawn to capture en passant on "e6"'],
    ['4k3/8/8/4P3/8/8/8/4K3 w - e6', 'no pawn to capture en passant on "e6"'],
  ])('refuses %j: %s', (fen, reason) => {
    expect(() => loadFen(fen)).toThrow(reason);
  });
});
