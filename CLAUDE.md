# CLAUDE.md

Conventions and pitfalls for agents. The README describes the stack, the scripts, the structure and
the deployment.

## Tooling

- There is no deploy script: Cloudflare Pages deploys `master` (see the README).
- pnpm is pinned by `packageManager`; allow a dependency's build scripts in `allowBuilds` of
  `pnpm-workspace.yaml`, never in `package.json`.

## Conventions

- `app/js/Echiquier.js` is the model and holds every rule; it never touches the DOM. `main.js`
  re-renders the whole board from the model after each move. `app/js/pieces/*.js` only hold the
  Unicode symbol and the starting squares, never movement.
- The model's identifiers are still French (`plateau`, `couleur`, `cavalier`, `dame`, `roi`,
  `tour`, `fou`, `pion`) until #26 renames them: match the surrounding names. Comments, JSDoc,
  docs and commits are in English; text shown to players stays in French.
- `couleur` is `'blanche'` or `'noire'`, nothing else.
- Squares are lowercase algebraic notation, `'a1'` to `'h8'`, and the keys of the `plateau` Map.
- Pawn direction: `couleur === 'blanche' ? 1 : -1`, white moves toward higher ranks.

## Pitfalls

- `_laisseRoiEnEchec` deletes and re-inserts Map keys to simulate a move, which moves them to the
  end of the Map. Iterate over a snapshot (`[...this.plateau.entries()]`) whenever a loop calls it,
  as `_aucunCoupPossible` does, or the loop never ends.
- A pawn reaching the last rank leaves a pending promotion in `positionPromotion`, and `deplacer`
  returns `null` until `promouvoir` resolves it.
