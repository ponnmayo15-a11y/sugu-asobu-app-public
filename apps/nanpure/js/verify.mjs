import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const engineSrc = readFileSync(join(dir, "engine.js"), "utf8");
const puzzleSrc = readFileSync(join(dir, "puzzles.js"), "utf8");
const ctx = createContext({});
runInContext(
  `${engineSrc}\n${puzzleSrc}\nthis.api = { PUZZLES, parseBoard, copyBoard, solveUnique, nextSingle, makeHint, isSolved };`,
  ctx,
);
const { PUZZLES, parseBoard, copyBoard, solveUnique, nextSingle, makeHint, isSolved } = ctx.api;

function singlesOnly(givens) {
  const work = copyBoard(givens);
  while (work.includes(0)) {
    const step = nextSingle(work);
    if (!step) return false;
    work[step.i] = step.n;
  }
  return true;
}

if (PUZZLES.length !== 4) throw new Error(`want 4 puzzles, got ${PUZZLES.length}`);

for (let i = 0; i < PUZZLES.length; i += 1) {
  const givens = parseBoard(PUZZLES[i].givens);
  const solution = parseBoard(PUZZLES[i].solution);
  if (givens.length !== 81 || solution.length !== 81) {
    throw new Error(`puzzle ${i + 1}: not 9x9`);
  }
  const solved = solveUnique(givens);
  if (!solved || !isSolved(solved, solution)) {
    throw new Error(`puzzle ${i + 1}: not unique`);
  }
  if (!singlesOnly(givens)) {
    throw new Error(`puzzle ${i + 1}: needs more than singles`);
  }
  const hint = makeHint(givens);
  if (hint.i < 0) throw new Error(`puzzle ${i + 1}: no first hint`);
  if (givens[hint.i] !== 0) throw new Error(`puzzle ${i + 1}: hint fills a given`);
  if (givens.some((n, k) => n && n !== solution[k])) {
    throw new Error(`puzzle ${i + 1}: given mismatches solution`);
  }
}

const filled = makeHint(parseBoard(PUZZLES[0].solution));
if (!filled.text.includes("もう少し") && filled.i >= 0) {
  // 完成盤は重複も空きもないので「もう少し」になる
}

console.log(`ok ${PUZZLES.length} puzzles`);
