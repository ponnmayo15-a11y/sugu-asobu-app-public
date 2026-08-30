import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const files = ["engine.js", "storage.js", "generate.js"].map((name) =>
  readFileSync(join(dir, name), "utf8"),
);
const ctx = createContext({ Math });
runInContext(
  `${files.join("\n")}\nthis.api = { makePuzzle, setShape, isSolved, makeHint, nextSingle, copyBoard, givenRange };`,
  ctx,
);
const { makePuzzle, setShape, isSolved, makeHint, nextSingle, copyBoard, givenRange } = ctx.api;

function singlesOnly(board) {
  const work = copyBoard(board);
  while (work.includes(0)) {
    const step = nextSingle(work);
    if (!step) return false;
    work[step.i] = step.n;
  }
  return true;
}

function check(size, givensWanted) {
  setShape(size);
  const p = makePuzzle(size, givensWanted);
  const filled = p.givens.filter((n) => n).length;
  const range = givenRange(size);
  if (p.givens.length !== size * size) throw new Error(`${size}: bad length`);
  if (filled < range.min) throw new Error(`${size}: too few givens ${filled}`);
  if (filled > givensWanted) {
    // 単体だけで解けなくなる手前で止めるので、指定より多く残ってよい
  }
  if (!isSolved(p.solution, p.solution)) throw new Error(`${size}: solution broken`);
  if (p.givens.some((n, i) => n && n !== p.solution[i])) {
    throw new Error(`${size}: given mismatch`);
  }
  if (!singlesOnly(p.givens)) throw new Error(`${size}: not singles`);
  const hint = makeHint(p.givens);
  if (hint.i < 0) throw new Error(`${size}: no first hint`);
  if (p.givens[hint.i] !== 0) throw new Error(`${size}: hint on given`);
  return filled;
}

const g6 = check(6, 18);
const g9 = check(9, 38);
console.log(`ok 6x6 givens=${g6} / 9x9 givens=${g9}`);
