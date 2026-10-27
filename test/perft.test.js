import { describe, it, expect } from 'vitest';
import { STARTING_FEN } from './helpers/fen/constants.js';
import { loadFen } from './helpers/fen/utils.js';

/**
 * The piece types a pawn may be promoted to, each one a move of its own in perft. Kept apart from
 * the model's own list, so that perft notices a type missing from it.
 */
const PROMOTION_PIECE_TYPES = ['queen', 'rook', 'bishop', 'knight'];

/**
 * The reference positions of https://www.chessprogramming.org/Perft_Results, with their leaf node
 * counts from depth 1. Each depth stops where the run stays near a second in total.
 */
const PERFT_POSITIONS = [
  {
    name: 'the starting position',
    fen: STARTING_FEN,
    nodeCounts: [20, 400, 8902],
  },
  {
    name: 'Kiwipete',
    fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -',
    nodeCounts: [48, 2039],
  },
  {
    name: 'position 3',
    fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -',
    nodeCounts: [14, 191, 2812],
  },
  {
    name: 'position 4',
    fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
    nodeCounts: [6, 264],
  },
  {
    name: 'position 5',
    fen: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    nodeCounts: [44, 1486],
  },
];

const PERFT_CASES = PERFT_POSITIONS.flatMap(({ name, fen, nodeCounts }) =>
  nodeCounts.map((nodeCount, index) => ({ name, fen, depth: index + 1, nodeCount }))
);

/**
 * Plays a change on the game, counts the leaf nodes below it, then puts the game back as it was.
 *
 * @param {object} params
 * @param {import('../app/js/Chessboard.js').default} params.game The game, restored on return.
 * @param {number} params.depth The depth left after the change.
 * @param {() => unknown} params.play Plays the change, and returns a falsy value when refused.
 * @param {string} params.label The change, for the error message.
 * @returns {number} The leaf nodes below the change.
 */
function countAfter({ game, depth, play, label }) {
  const savedState = structuredClone({ ...game });
  if (!play()) throw new Error(`The model refused ${label}`);
  const nodeCount = countLeafNodes({ game, depth });
  Object.assign(game, savedState);
  return nodeCount;
}

/**
 * Counts the positions reached after `depth` moves through `move` and `promote`, each promotion
 * piece counting as a move of its own.
 *
 * @param {object} params
 * @param {import('../app/js/Chessboard.js').default} params.game The game, left unchanged.
 * @param {number} params.depth The number of moves to play.
 * @returns {number} The leaf node count.
 */
function countLeafNodes({ game, depth }) {
  const square = game.promotionSquare;
  if (square !== null) {
    return PROMOTION_PIECE_TYPES.reduce(
      (total, type) =>
        total +
        countAfter({
          game,
          depth,
          play: () => game.promote({ position: square, type }),
          label: `${square}=${type}`,
        }),
      0
    );
  }
  if (depth === 0) return 1;

  const ownSquares = [...game.board.entries()]
    .filter(([, piece]) => piece.color === game.currentColor)
    .map(([from]) => from);
  let nodeCount = 0;
  for (const from of ownSquares) {
    for (const to of game.getMoves(from)) {
      const play = () => game.move({ from, to });
      nodeCount += countAfter({ game, depth: depth - 1, play, label: `${from}-${to}` });
    }
  }
  return nodeCount;
}

describe('Perft', () => {
  it.each(PERFT_CASES)(
    'counts $nodeCount nodes in $name at depth $depth',
    ({ fen, depth, nodeCount }) => {
      expect(countLeafNodes({ game: loadFen(fen), depth })).toBe(nodeCount);
    }
  );
});
