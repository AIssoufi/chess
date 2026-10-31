/**
 * Gives the place of the piece that the focus moves to, looping over the pieces.
 *
 * @param {object} params
 * @param {number} params.currentIndex The place of the focused piece, `-1` when none has the focus.
 * @param {number} params.count The number of pieces.
 * @param {boolean} params.isBackward Whether the focus moves to the previous piece.
 * @returns {number} The place of the next piece: the first or the last one when none has the focus,
 *   `-1` without pieces.
 *
 * @example
 * getNextPieceIndex({ currentIndex: 3, count: 4, isBackward: false }); // 0
 */
export function getNextPieceIndex({ currentIndex, count, isBackward }) {
  if (count === 0) return -1;
  if (isBackward) return (Math.max(currentIndex, 0) - 1 + count) % count;
  return (currentIndex + 1) % count;
}
