import { describe, it, expect, beforeEach } from 'vitest';
import Chessboard from '../app/js/Chessboard.js';
import { getGameOutcome } from '../app/js/game-over/utils.js';
import { getMoveNotation, getMoveTurns, getRivalSquares } from '../app/js/notation/utils.js';

const WHITE_PAWN = Object.freeze({ type: 'pawn', color: 'white' });
const BLACK_PAWN = Object.freeze({ type: 'pawn', color: 'black' });
const WHITE_KNIGHT = Object.freeze({ type: 'knight', color: 'white' });
const WHITE_ROOK = Object.freeze({ type: 'rook', color: 'white' });
const WHITE_KING = Object.freeze({ type: 'king', color: 'white' });
const BLACK_QUEEN = Object.freeze({ type: 'queen', color: 'black' });

let game;

beforeEach(() => {
  game = new Chessboard();
  game.initialize();
});

/**
 * Plays moves on the game and writes each one as the move list would, promoting to the type
 * given as third item of a move.
 */
function playMoves(moves) {
  return moves.map(([from, to, promotedType]) => {
    const rivalSquares = getRivalSquares({ game, from, to });
    const move = game.move({ from, to });
    if (promotedType) game.promote({ position: to, type: promotedType });
    const { outcome } = getGameOutcome({ game });
    return getMoveNotation({ move, promotedType, outcome, rivalSquares });
  });
}

describe('getMoveNotation', () => {
  it('writes a pawn move with its target square alone', () => {
    const move = { from: 'e2', to: 'e4', piece: WHITE_PAWN, captured: null };
    expect(getMoveNotation({ move })).toBe('e4');
  });

  it.each([
    ['king', 'R'],
    ['queen', 'D'],
    ['rook', 'T'],
    ['bishop', 'F'],
    ['knight', 'C'],
  ])('writes a %s with the French letter %s', (type, letter) => {
    const move = { from: 'd1', to: 'd3', piece: { type, color: 'white' }, captured: null };
    expect(getMoveNotation({ move })).toBe(`${letter}d3`);
  });

  it('writes a capture with x, and the file of a capturing pawn', () => {
    const knightMove = { from: 'f3', to: 'e5', piece: WHITE_KNIGHT, captured: BLACK_PAWN };
    const pawnMove = { from: 'e4', to: 'd5', piece: WHITE_PAWN, captured: BLACK_PAWN };
    expect(getMoveNotation({ move: knightMove })).toBe('Cxe5');
    expect(getMoveNotation({ move: pawnMove })).toBe('exd5');
  });

  it('writes an en passant capture as a pawn capture, though the target square is empty', () => {
    const move = {
      from: 'e5',
      to: 'd6',
      piece: WHITE_PAWN,
      captured: null,
      specialMove: 'en-passant',
    };
    expect(getMoveNotation({ move })).toBe('exd6');
  });

  it.each([
    ['kingside-castling', 'g1', 'O-O'],
    ['queenside-castling', 'c1', 'O-O-O'],
  ])('writes %s as %s', (specialMove, to, notation) => {
    const move = { from: 'e1', to, piece: WHITE_KING, captured: null, specialMove };
    expect(getMoveNotation({ move })).toBe(notation);
    expect(getMoveNotation({ move, outcome: 'check' })).toBe(`${notation}+`);
  });

  it.each([
    ['queen', 'e8=D'],
    ['rook', 'e8=T'],
    ['bishop', 'e8=F'],
    ['knight', 'e8=C'],
  ])('writes a promotion to a %s as %s', (promotedType, notation) => {
    const move = { from: 'e7', to: 'e8', piece: WHITE_PAWN, captured: null, promotion: true };
    expect(getMoveNotation({ move, promotedType })).toBe(notation);
  });

  it('writes a capture that promotes and mates, with every sign in order', () => {
    const move = {
      from: 'e7',
      to: 'd8',
      piece: WHITE_PAWN,
      captured: BLACK_QUEEN,
      promotion: true,
    };
    expect(getMoveNotation({ move, promotedType: 'queen', outcome: 'checkmate' })).toBe('exd8=D#');
  });

  it('adds + for a check and # for a checkmate, and nothing for another outcome', () => {
    const move = { from: 'd1', to: 'h5', piece: { type: 'queen', color: 'white' }, captured: null };
    expect(getMoveNotation({ move, outcome: 'check' })).toBe('Dh5+');
    expect(getMoveNotation({ move, outcome: 'checkmate' })).toBe('Dh5#');
    expect(getMoveNotation({ move, outcome: 'stalemate' })).toBe('Dh5');
    expect(getMoveNotation({ move, outcome: 'draw' })).toBe('Dh5');
    expect(getMoveNotation({ move, outcome: 'ongoing' })).toBe('Dh5');
    expect(getMoveNotation({ move, outcome: 'toString' })).toBe('Dh5');
    expect(getMoveNotation({ move, outcome: 42 })).toBe('Dh5');
  });

  describe('a piece that another piece of its kind could replace', () => {
    const move = { from: 'b1', to: 'd2', piece: WHITE_KNIGHT, captured: null };

    it('is told apart by its file when the files differ', () => {
      expect(getMoveNotation({ move, rivalSquares: ['f3'] })).toBe('Cbd2');
      expect(getMoveNotation({ move, rivalSquares: ['f1'] })).toBe('Cbd2');
    });

    it('is told apart by its rank when the files are the same', () => {
      const rookMove = { from: 'a1', to: 'a4', piece: WHITE_ROOK, captured: null };
      expect(getMoveNotation({ move: rookMove, rivalSquares: ['a8'] })).toBe('T1a4');
    });

    it('is told apart by its square when another piece shares its file and one its rank', () => {
      const queenMove = { from: 'd1', to: 'e2', piece: { type: 'queen', color: 'white' } };
      expect(getMoveNotation({ move: queenMove, rivalSquares: ['d3', 'f1'] })).toBe('Dd1e2');
    });

    it('keeps the capture sign after what tells it apart', () => {
      const capture = { ...move, captured: BLACK_PAWN };
      expect(getMoveNotation({ move: capture, rivalSquares: ['f3'] })).toBe('Cbxd2');
    });

    it.each([
      ['no rival', []],
      ['its own square', ['b1']],
      ['values that are not squares', ['z9', null, 3, {}]],
      ['a list that is not an array', 'f3'],
      ['a null list', null],
    ])('is not told apart with %s', (_label, rivalSquares) => {
      expect(getMoveNotation({ move, rivalSquares })).toBe('Cd2');
    });

    it('never tells a pawn apart, its file being written for a capture only', () => {
      const pawnMove = { from: 'c4', to: 'd5', piece: WHITE_PAWN, captured: BLACK_PAWN };
      expect(getMoveNotation({ move: pawnMove, rivalSquares: ['e4'] })).toBe('cxd5');
    });
  });

  it.each([
    ['a promotion without its new piece', undefined],
    ['a promotion to a king', 'king'],
    ['a promotion to a pawn', 'pawn'],
    ['a promotion to an unknown type', 'dragon'],
    ['a promotion to an inherited key', 'toString'],
  ])('returns null for %s', (_label, promotedType) => {
    const move = { from: 'e7', to: 'e8', piece: WHITE_PAWN, captured: null, promotion: true };
    expect(getMoveNotation({ move, promotedType })).toBeNull();
  });

  it.each([
    ['false', false],
    ['the string true', 'true'],
    ['the number 1', 1],
    ['null', null],
  ])('ignores a new piece when the promotion of the move is %s', (_label, promotion) => {
    const move = { from: 'e2', to: 'e4', piece: WHITE_PAWN, captured: null, promotion };
    expect(getMoveNotation({ move, promotedType: 'queen' })).toBe('e4');
  });

  it.each([
    ['missing params', undefined],
    ['null params', null],
    ['empty params', {}],
    ['a null move', { move: null }],
    ['a move that is not an object', { move: 'e4' }],
    ['an empty move', { move: {} }],
    ['a move without a piece', { move: { from: 'e2', to: 'e4' } }],
    ['a null piece', { move: { from: 'e2', to: 'e4', piece: null } }],
    ['an unknown piece type', { move: { from: 'e2', to: 'e4', piece: { type: 'dragon' } } }],
    ['an inherited piece type', { move: { from: 'e2', to: 'e4', piece: { type: 'toString' } } }],
    ['a missing target square', { move: { from: 'e2', piece: WHITE_PAWN } }],
    ['a target off the board', { move: { from: 'e2', to: 'e9', piece: WHITE_PAWN } }],
    ['an origin off the board', { move: { from: 'i2', to: 'e4', piece: WHITE_PAWN } }],
    ['an uppercase square', { move: { from: 'E2', to: 'E4', piece: WHITE_PAWN } }],
  ])('returns null for %s', (_label, params) => {
    expect(getMoveNotation(params)).toBeNull();
  });
});

describe('getRivalSquares', () => {
  it('lists the other pieces of the same kind that can reach the target square', () => {
    playMoves([
      ['g1', 'f3'],
      ['e7', 'e5'],
      ['d2', 'd3'],
      ['e5', 'e4'],
    ]);
    expect(getRivalSquares({ game, from: 'b1', to: 'd2' })).toEqual(['f3']);
    expect(getRivalSquares({ game, from: 'f3', to: 'd2' })).toEqual(['b1']);
  });

  it('lists no piece when no other piece of the same kind can reach the square', () => {
    expect(getRivalSquares({ game, from: 'g1', to: 'f3' })).toEqual([]);
    expect(getRivalSquares({ game, from: 'e2', to: 'e4' })).toEqual([]);
  });

  it('ignores the pieces of the other color', () => {
    game.board.clear();
    game.board.set('e1', { ...WHITE_KING, hasMoved: true });
    game.board.set('e8', { type: 'king', color: 'black', hasMoved: true });
    game.board.set('a1', { ...WHITE_ROOK, hasMoved: true });
    game.board.set('h4', { type: 'rook', color: 'black', hasMoved: true });
    expect(getRivalSquares({ game, from: 'a1', to: 'a4' })).toEqual([]);
  });

  it('keeps every square of the board, the Map being read through a snapshot', () => {
    const squares = [...game.board.keys()];
    getRivalSquares({ game, from: 'b1', to: 'c3' });
    expect([...game.board.keys()].sort()).toEqual(squares.sort());
  });

  it.each([
    ['missing params', undefined],
    ['null params', null],
    ['a missing game', { from: 'b1', to: 'c3' }],
    ['a null game', { game: null, from: 'b1', to: 'c3' }],
    ['a game without a board', { game: {}, from: 'b1', to: 'c3' }],
  ])('returns no square for %s', (_label, params) => {
    expect(getRivalSquares(params)).toEqual([]);
  });

  it.each([
    ['an empty origin', 'e4', 'e5'],
    ['an origin off the board', 'z9', 'c3'],
    ['a missing origin', undefined, 'c3'],
    ['a target off the board', 'b1', 'c9'],
    ['a missing target', 'b1', undefined],
  ])('returns no square for %s on a real game', (_label, from, to) => {
    expect(getRivalSquares({ game, from, to })).toEqual([]);
  });
});

describe('the notation of a game played on the board', () => {
  it('writes the fool’s mate with its final #', () => {
    const notations = playMoves([
      ['f2', 'f3'],
      ['e7', 'e5'],
      ['g2', 'g4'],
      ['d8', 'h4'],
    ]);
    expect(notations).toEqual(['f3', 'e5', 'g4', 'Dh4#']);
  });

  it('writes a kingside castling and the captures before it', () => {
    const notations = playMoves([
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
      ['b8', 'c6'],
      ['f1', 'c4'],
      ['g8', 'f6'],
      ['e1', 'g1'],
      ['f6', 'e4'],
    ]);
    expect(notations).toEqual(['e4', 'e5', 'Cf3', 'Cc6', 'Fc4', 'Cf6', 'O-O', 'Cxe4']);
  });

  it('writes an en passant capture', () => {
    const notations = playMoves([
      ['e2', 'e4'],
      ['a7', 'a6'],
      ['e4', 'e5'],
      ['d7', 'd5'],
      ['e5', 'd6'],
    ]);
    expect(notations.at(-1)).toBe('exd6');
  });

  it('writes a capture that promotes the pawn', () => {
    const notations = playMoves([
      ['e2', 'e4'],
      ['f7', 'f5'],
      ['e4', 'f5'],
      ['g7', 'g6'],
      ['f5', 'g6'],
      ['a7', 'a6'],
      ['g6', 'h7'],
      ['a6', 'a5'],
      ['h7', 'g8', 'queen'],
    ]);
    expect(notations.at(-1)).toBe('hxg8=D');
  });

  it('tells apart the knight that moves when both could reach the square', () => {
    const notations = playMoves([
      ['g1', 'f3'],
      ['e7', 'e5'],
      ['d2', 'd3'],
      ['e5', 'e4'],
      ['b1', 'd2'],
    ]);
    expect(notations.at(-1)).toBe('Cbd2');
  });
});

describe('getMoveTurns', () => {
  it('numbers the turns and pairs the moves, white first', () => {
    expect(getMoveTurns(['e4', 'e5', 'Cf3', 'Cc6'])).toEqual([
      { number: 1, white: 'e4', black: 'e5' },
      { number: 2, white: 'Cf3', black: 'Cc6' },
    ]);
  });

  it('leaves black empty while black has not answered', () => {
    expect(getMoveTurns(['e4'])).toEqual([{ number: 1, white: 'e4', black: null }]);
    expect(getMoveTurns(['e4', 'e5', 'Cf3'])).toEqual([
      { number: 1, white: 'e4', black: 'e5' },
      { number: 2, white: 'Cf3', black: null },
    ]);
  });

  it('reads an entry that is not a string as an empty move', () => {
    expect(getMoveTurns([null, 42])).toEqual([{ number: 1, white: null, black: null }]);
  });

  it.each([
    ['an empty list', []],
    ['missing notations', undefined],
    ['null', null],
    ['a string', 'e4 e5'],
    ['an object', { 0: 'e4', length: 1 }],
  ])('gives no turn for %s', (_label, notations) => {
    expect(getMoveTurns(notations)).toEqual([]);
  });
});
