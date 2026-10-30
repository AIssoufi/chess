import { writeFileSync } from 'node:fs';
import { COLORS } from '../app/js/colors/constants.js';
import { CAPTURES_ID_SUFFIX } from '../app/js/rendering/constants.js';
import { MAX_CAPTURED_PIECES, SCANDINAVIAN_CAPTURES } from './helpers/board/constants.js';
import { addCapturedPieces, playMoves } from './helpers/board/utils.js';
import { test } from './helpers/fixtures.js';
import { LATE_GAME_POSITIONS } from './helpers/landscape/constants.js';

const RATIOS = [1.75, 1.78, 1.85, 1.9, 1.95, 2, 2.05, 2.1, 2.17, 2.25, 2.4, 2.6, 3, 4];
const HEIGHTS = [];
for (let height = 320; height <= 500; height += 10) HEIGHTS.push(height);
const FACTORS = (process.env.TRACK_FACTORS ?? '0.5,0.55,0.6').split(',');

function readRow({ colors, suffix }) {
  return new Promise((resolve) => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const moves = document.querySelector('.move-list__moves');
        const turn = moves.querySelector('li');
        const out = { movesClient: moves.clientHeight, turn: turn.getBoundingClientRect().height };
        for (const color of colors) {
          const control = document.querySelector(`.control[data-color="${color}"]`);
          const zone = document.getElementById(`${color}${suffix}`);
          const pieces = [...zone.children].map((n) => n.getBoundingClientRect());
          const glyph = document.createRange();
          glyph.selectNodeContents(zone.children[0]);
          out[color] = {
            over: control.scrollHeight - control.clientHeight,
            client: control.clientHeight,
            glyphW: Math.round(glyph.getBoundingClientRect().width * 10) / 10,
            trackW: Math.round(pieces[0].width * 10) / 10,
            rows: new Set(pieces.map((r) => Math.round(r.top))).size,
            cols: new Set(pieces.map((r) => Math.round(r.left))).size,
            capOver: zone.scrollWidth - zone.clientWidth,
          };
        }
        resolve(out);
      })
    );
  });
}

for (const { sideToMove, gameMoves } of LATE_GAME_POSITIONS) {
  test(`measure ${sideToMove}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-webkit');
    test.setTimeout(500000);
    await page.setViewportSize({ width: 1000, height: 500 });
    await page.goto('/');
    await playMoves({ page, moves: gameMoves });
    for (const color of Object.values(COLORS)) {
      await addCapturedPieces({ page, color, count: MAX_CAPTURED_PIECES - SCANDINAVIAN_CAPTURES });
    }
    const name = `${testInfo.project.name}-${sideToMove}`;
    const report = [];
    for (const factor of FACTORS) {
      await page.evaluate(
        ({ colors, suffix, trackFactor }) => {
          for (const color of colors) {
            const { style } = document.getElementById(`${color}${suffix}`);
            style.gridAutoFlow = 'row';
            style.gridTemplateColumns = `repeat(auto-fill, minmax(calc(var(--square) * ${trackFactor}), 1fr))`;
            style.overflow = 'visible';
          }
        },
        { colors: Object.values(COLORS), suffix: CAPTURES_ID_SUFFIX, trackFactor: factor }
      );
      report.push(`--- ${name} factor ${factor}; ratios ${RATIOS.join(' ')}`);
      for (const height of HEIGHTS) {
        let line = `${height} `;
        const details = [];
        for (const ratio of RATIOS) {
          const width = Math.ceil(height * ratio);
          await page.setViewportSize({ width, height });
          const r = await page.evaluate(readRow, {
            colors: Object.values(COLORS),
            suffix: CAPTURES_ID_SUFFIX,
          });
          const twoTurns = r.movesClient >= 2 * r.turn - 1;
          const isOk = r.white.over <= 0 && r.black.over <= 0 && twoTurns;
          line += isOk ? '.' : 'X';
          if (ratio === 2 || ratio === 2.17) {
            details.push(
              `${width}x${height} w${r.white.over}/${r.white.client} b${r.black.over} ${r.white.cols}c${r.white.rows}r g${r.white.glyphW} t${r.white.trackW} m${r.movesClient}/${r.turn}`
            );
          }
        }
        report.push(`${line}  ${details.join(' | ')}`);
      }
    }
    if (process.env.MEASURE_OUT) {
      writeFileSync(`${process.env.MEASURE_OUT}/${name}.txt`, report.join('\n'));
    } else {
      console.log(`MEASURE\n${report.join('\n')}`);
    }
  });
}
