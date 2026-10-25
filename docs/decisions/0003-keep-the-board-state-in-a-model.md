# 0003. Keep the board state in a model without DOM

- Date: 2026-03-25 (commit `0900ff4`)
- Status: Accepted

## Context

Until March 2026, the page was the state of the game. `app/js/Plateau.js` (291 lines) read and
wrote the board through the DOM: a move appended the piece node to another square, a capture
moved it to the prisoners panel, the legal squares were the ones with the `chemin` class, and the
type of a piece was its `data-type` attribute. `app/js/main.js` added click listeners on every
square.

- The rules could not run without a document, so no test exercised them
  ([0002](0002-test-with-vitest.md)).
- Each rule had to find its data in the markup, which tied the rules to the HTML and the CSS
  classes.
- The commit that replaced it lists the bugs it fixed: sliding pieces blocked after a capture, and
  click listeners that piled up.

## Decision

Move the state and every rule into `app/js/Echiquier.js` (436 lines), in commit `0900ff4`. The
model keeps the board in a `Map` from algebraic squares (`'a1'` to `'h8'`) to pieces, never
touches the DOM, and adds castling, en passant, promotion, check, checkmate and stalemate.
`main.js` handles clicks with one delegated listener and renders the whole board from the model
after each move.

## Alternatives considered

- **Keep the DOM state and test it with jsdom**: the tests would need the page markup, and the
  rules would stay tied to it.
- **A UI framework holding the state**: it would add its runtime to the bundle of a page that
  draws a single board of 64 squares.
- **A chess rules library**: the rules are the code of this project, not a dependency.

## Consequences

Measured on 59bf255 (DOM state) and c65212a (model), with the method of
[the evolution page](../evolution.md#how-the-figures-were-measured):

| Figure                 | Before: 59bf255, DOM state    | After: c65212a, model           |
| ---------------------- | ----------------------------- | ------------------------------- |
| Tests of the rules     | 0                             | 25, in Node.js                  |
| Test suite, wall clock | 0.60 s                        | 1.18 s                          |
| Lines of game logic    | 450 (`Plateau.js`, `main.js`) | 646 (`Echiquier.js`, `main.js`) |

- Every rule is testable in Node.js without a DOM; the UI controller got its own tests in
  happy-dom later (`aa7b79d`).
- Simulating a move to find check deletes and re-inserts `Map` keys, which moves them to the end
  of the `Map`: a loop that simulates moves must iterate over a snapshot of the entries.
- The model's identifiers were French until #26 renamed them to English (`0a54a18` renamed
  `Echiquier.js` to `Chessboard.js`, `8f03185` the model API).
