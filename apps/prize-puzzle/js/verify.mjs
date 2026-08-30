import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const dir = dirname(fileURLToPath(import.meta.url));

function load(name) {
  return readFileSync(join(dir, name), "utf8");
}

const result = { bad: 0 };
const ctx = { console, result };
vm.createContext(ctx);
vm.runInContext(
  [
    load("logic-engine.js"),
    load("logic-puzzles.js"),
    `
    for (const p of LOGIC_PUZZLES) {
      const clues = cluesFromGrid(p.answer);
      const n = countLogicSolutions(clues.rows, clues.cols, 2);
      const ok = n === 1;
      console.log("logic " + p.id + ": " + (ok ? "OK" : "NG") + " (" + n + "解)");
      if (!ok) result.bad += 1;
    }
    const plus = LOGIC_PUZZLES[0];
    const blank = emptyLogicState(5, 5);
    if (logicMatches(blank, plus.answer)) result.bad += 1;
    const filled = plus.answer.map((row) => row.slice());
    if (!logicMatches(filled, plus.answer)) result.bad += 1;
    `,
  ].join("\n"),
  ctx
);

if (result.bad) {
  console.error(`失敗 ${result.bad}件`);
  process.exit(1);
}
console.log("全部OK");
