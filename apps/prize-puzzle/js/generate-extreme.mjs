import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const dir = dirname(fileURLToPath(import.meta.url));
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(
  readFileSync(join(dir, "logic-engine.js"), "utf8") +
    "\n" +
    readFileSync(join(dir, "logic-puzzles.js"), "utf8") +
    "\nthis.LOGIC_PUZZLES = LOGIC_PUZZLES;",
  ctx
);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function keyOf(grid) {
  return grid.map((row) => row.join("")).join("/");
}

function clone(grid) {
  return grid.map((row) => row.slice());
}

function rotate(grid) {
  const n = grid.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) out[c][n - 1 - r] = grid[r][c];
  }
  return out;
}

function flipH(grid) {
  return grid.map((row) => row.slice().reverse());
}

function filledCount(grid) {
  return grid.reduce((sum, row) => sum + row.filter((v) => v === 1).length, 0);
}

function isUnique(grid) {
  const clues = ctx.cluesFromGrid(grid);
  return ctx.countLogicSolutions(clues.rows, clues.cols, 2) === 1;
}

function randomSpeckles(n, dots, rand) {
  const grid = Array.from({ length: n }, () => Array(n).fill(0));
  let put = 0;
  let guard = 0;
  while (put < dots && guard < n * n * 8) {
    guard += 1;
    const r = Math.floor(rand() * n);
    const c = Math.floor(rand() * n);
    if (grid[r][c]) continue;
    const len = 1 + Math.floor(rand() * 3);
    const across = rand() < 0.5;
    let ok = true;
    for (let i = 0; i < len; i += 1) {
      const rr = r + (across ? 0 : i);
      const cc = c + (across ? i : 0);
      if (rr >= n || cc >= n || grid[rr][cc]) ok = false;
    }
    if (!ok) continue;
    for (let i = 0; i < len; i += 1) {
      const rr = r + (across ? 0 : i);
      const cc = c + (across ? i : 0);
      grid[rr][cc] = 1;
      put += 1;
    }
  }
  return grid;
}

const kept = ctx.LOGIC_PUZZLES.filter((p) => p.level !== "激難しい");
const seen = new Set(kept.map((p) => keyOf(p.answer)));
const out = [];
const rand = mulberry32(91);
let tries = 0;
const need = 20;
const n = 10;

console.log("激難しい 10×10 を作る");
while (out.length < need && tries < 4000) {
  tries += 1;
  const grid = randomSpeckles(n, 18 + Math.floor(rand() * 16), rand);
  const fill = filledCount(grid);
  if (fill < 20 || fill > 48) continue;
  const key = keyOf(grid);
  if (seen.has(key)) continue;
  if (!isUnique(grid)) continue;
  seen.add(key);
  out.push(clone(grid));
  console.log(`  ${out.length}/${need} (試行${tries})`);
}

if (out.length < need) {
  throw new Error(`激難しいが ${out.length}/${need} しか作れなかった`);
}

function dump(id, name, level, grid) {
  const rows = grid.map((row) => `      [${row.join(", ")}]`).join(",\n");
  return `  {
    id: ${JSON.stringify(id)},
    name: ${JSON.stringify(name)},
    level: ${JSON.stringify(level)},
    answer: [
${rows},
    ],
  }`;
}

function dumpExisting(p) {
  return dump(p.id, p.name, p.level, p.answer);
}

const parts = kept.map(dumpExisting);
out.slice(0, need).forEach((g, i) => {
  parts.push(dump(`extreme-${i + 1}`, `激難しい${i + 1}`, "激難しい", g));
});

const text = `// イラストロジックの問題。どれも解が1つだけ。
const LOGIC_PUZZLES = [
${parts.join(",\n")},
];
`;

writeFileSync(join(dir, "logic-puzzles.js"), text, "utf8");
console.log(`書いた: 既存${kept.length} + 激難しい${need}`);
