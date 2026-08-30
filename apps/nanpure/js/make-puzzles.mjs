import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, "engine.js"), "utf8");
const ctx = createContext({});
runInContext(
  `${src}\nthis.engine = { SIZE, emptyBoard, copyBoard, nextSingle };`,
  ctx,
);
const { SIZE, copyBoard, nextSingle } = ctx.engine;

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mulberry32(seed) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  4, 5, 6, 7, 8, 9, 1, 2, 3,
  7, 8, 9, 1, 2, 3, 4, 5, 6,
  2, 3, 4, 5, 6, 7, 8, 9, 1,
  5, 6, 7, 8, 9, 1, 2, 3, 4,
  8, 9, 1, 2, 3, 4, 5, 6, 7,
  3, 4, 5, 6, 7, 8, 9, 1, 2,
  6, 7, 8, 9, 1, 2, 3, 4, 5,
  9, 1, 2, 3, 4, 5, 6, 7, 8,
];

function mapDigits(board, rng) {
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  return board.map((n) => digits[n - 1]);
}

function reorderRows(board, fromRows, toRows) {
  const next = copyBoard(board);
  for (let i = 0; i < fromRows.length; i += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      next[toRows[i] * SIZE + c] = board[fromRows[i] * SIZE + c];
    }
  }
  for (let i = 0; i < next.length; i += 1) board[i] = next[i];
}

function reorderCols(board, fromCols, toCols) {
  const next = copyBoard(board);
  for (let r = 0; r < SIZE; r += 1) {
    for (let i = 0; i < fromCols.length; i += 1) {
      next[r * SIZE + toCols[i]] = board[r * SIZE + fromCols[i]];
    }
  }
  for (let i = 0; i < next.length; i += 1) board[i] = next[i];
}

function makeComplete(rng) {
  const board = mapDigits(BASE, rng);
  for (let band = 0; band < 3; band += 1) {
    const from = [0, 1, 2].map((x) => band * 3 + x);
    const to = shuffle([0, 1, 2], rng).map((x) => band * 3 + x);
    reorderRows(board, from, to);
  }
  for (let stack = 0; stack < 3; stack += 1) {
    const from = [0, 1, 2].map((x) => stack * 3 + x);
    const to = shuffle([0, 1, 2], rng).map((x) => stack * 3 + x);
    reorderCols(board, from, to);
  }
  const bandFrom = [0, 1, 2];
  const bandTo = shuffle([0, 1, 2], rng);
  const fromRows = [];
  const toRows = [];
  for (let i = 0; i < 3; i += 1) {
    for (let k = 0; k < 3; k += 1) {
      fromRows.push(bandFrom[i] * 3 + k);
      toRows.push(bandTo[i] * 3 + k);
    }
  }
  reorderRows(board, fromRows, toRows);
  return board;
}

function singlesOnly(board) {
  const work = copyBoard(board);
  while (work.includes(0)) {
    const step = nextSingle(work);
    if (!step) return false;
    work[step.i] = step.n;
  }
  return true;
}

function carve(solution, rng) {
  const puzzle = copyBoard(solution);
  const order = shuffle([...Array(SIZE * SIZE).keys()], rng);
  for (const i of order) {
    const keep = puzzle[i];
    puzzle[i] = 0;
    const filled = puzzle.filter((n) => n).length;
    if (filled < 36 || !singlesOnly(puzzle)) puzzle[i] = keep;
  }
  return puzzle;
}

const puzzles = [];
for (let seed = 11; puzzles.length < 4 && seed < 200; seed += 1) {
  const rng = mulberry32(seed * 1337);
  const solution = makeComplete(rng);
  const givens = carve(solution, rng);
  const filled = givens.filter((n) => n).length;
  if (filled < 36 || filled > 50) continue;
  if (!singlesOnly(givens)) continue;
  puzzles.push({
    givens: givens.join(""),
    solution: solution.join(""),
  });
}

if (puzzles.length < 4) {
  console.error("not enough", puzzles.length);
  process.exit(1);
}

console.log(JSON.stringify(puzzles, null, 2));
