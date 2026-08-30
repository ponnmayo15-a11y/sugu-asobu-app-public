import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const dir = dirname(fileURLToPath(import.meta.url));
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(readFileSync(join(dir, "logic-engine.js"), "utf8"), ctx);

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

function randomBlob(n, density, rand) {
  const grid = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      grid[r][c] = rand() < density ? 1 : 0;
    }
  }
  return grid;
}

function randomBlocks(n, count, rand) {
  const grid = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < count; i += 1) {
    const h = 1 + Math.floor(rand() * Math.min(4, n));
    const w = 1 + Math.floor(rand() * Math.min(4, n));
    const r0 = Math.floor(rand() * (n - h + 1));
    const c0 = Math.floor(rand() * (n - w + 1));
    for (let r = 0; r < h; r += 1) {
      for (let c = 0; c < w; c += 1) grid[r0 + r][c0 + c] = 1;
    }
  }
  return grid;
}

function collect(need, n, minFill, maxFill, seed, extras) {
  const seen = new Set();
  const out = [];
  const rand = mulberry32(seed);
  let tries = 0;
  const maxTries = 8000;
  function consider(grid) {
    const fill = filledCount(grid);
    if (fill < minFill || fill > maxFill) return;
    const key = keyOf(grid);
    if (seen.has(key)) return;
    if (!isUnique(grid)) return;
    seen.add(key);
    out.push(clone(grid));
  }
  for (const g of extras) consider(g);
  while (out.length < need && tries < maxTries) {
    tries += 1;
    const density = n === 5 ? 0.32 + rand() * 0.28 : 0.28 + rand() * 0.22;
    const grid = tries % 2 === 0 ? randomBlob(n, density, rand) : randomBlocks(n, 2 + Math.floor(rand() * 4), rand);
    consider(grid);
    let t = grid;
    for (let i = 0; i < 3 && out.length < need; i += 1) {
      t = rotate(t);
      consider(t);
      consider(flipH(t));
    }
  }
  if (out.length < need) {
    throw new Error(`${n}x${n} が ${out.length}/${need} しか作れなかった`);
  }
  return out.slice(0, need);
}

const easyBases = [
  [
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
];

const normalBases = [
  [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
  ],
];

const hardBases = [
  [
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 1],
    [0, 1, 0, 0, 0, 0, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ],
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 0, 0, 1, 1, 1],
  ],
];

console.log("やさしいを作る");
const easy = collect(10, 5, 5, 16, 11, easyBases);
console.log("ふつうを作る");
const normal = collect(10, 5, 10, 20, 29, normalBases);
console.log("むずかしいを作る");
const hard = collect(30, 8, 14, 40, 47, hardBases);

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

const parts = [];
easy.forEach((g, i) => parts.push(dump(`easy-${i + 1}`, `やさしい${i + 1}`, "やさしい", g)));
normal.forEach((g, i) => parts.push(dump(`normal-${i + 1}`, `ふつう${i + 1}`, "ふつう", g)));
hard.forEach((g, i) => parts.push(dump(`hard-${i + 1}`, `むずかしい${i + 1}`, "むずかしい", g)));

const text = `// イラストロジックの問題。どれも解が1つだけ。
const LOGIC_PUZZLES = [
${parts.join(",\n")},
];
`;

writeFileSync(join(dir, "logic-puzzles.js"), text, "utf8");
console.log(`書いた: やさしい${easy.length} ふつう${normal.length} むずかしい${hard.length}`);
