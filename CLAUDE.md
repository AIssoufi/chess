# CLAUDE.md

Conventions and pitfalls for agents. The README describes the stack, the scripts, the structure and
the deployment.

## Tooling

- There is no deploy script: Cloudflare Pages deploys `master` (see the README).
- pnpm is pinned by `packageManager`; no dependency runs build scripts. If one ever must, allow it
  in `allowBuilds` of `pnpm-workspace.yaml`, never in `package.json`.

## Conventions

- `app/js/Chessboard.js` is the model and holds every rule; it never touches the DOM. `main.js`
  re-renders the whole board from the model after each move. `app/js/pieces/*.js` only hold the
  Unicode symbol and the starting squares, never movement.
- Code, comments, JSDoc, docs and commits are in English; text shown to players stays in French.
  A value that reaches the page goes through a French label (`COLOR_LABELS`,
  `SPECIAL_MOVE_LABELS`), never the English value itself.
- `color` is `'white'` or `'black'`, nothing else; piece types are `king`, `queen`, `rook`,
  `bishop`, `knight` and `pawn`.
- Squares are lowercase algebraic notation, `'a1'` to `'h8'`, and the keys of the `board` Map.
- Pawn direction: `getPawnDirection(color)` of `app/js/colors/utils.js`, white moves toward
  higher ranks; the opponent is `getOpponent(color)`, never an inline ternary.

## Pitfalls

- `_leavesKingInCheck` deletes and re-inserts Map keys to simulate a move, which moves them to the
  end of the Map. Iterate over a snapshot (`[...this.board.entries()]`) whenever a loop calls it,
  as `_hasNoLegalMove` does, or the loop never ends.
- A pawn reaching the last rank leaves a pending promotion in `promotionSquare`, and `move`
  returns `null` until `promote` resolves it.
