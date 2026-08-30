import { readFileSync } from "fs";
import { createContext, runInContext } from "vm";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const ctx = createContext({ console });
const code = [
  readFileSync(join(dir, "puzzles.js"), "utf8"),
  readFileSync(join(dir, "engine.js"), "utf8"),
  `Object.assign(this, {
    PUZZLE, SIZE, BLACK, cellsOfWord, solutionAt, isBlack, wordsAt,
    emptyBoard, isPuzzleSolved, correctCount, whiteCount, makeHint
  });`,
].join("\n");
runInContext(code, ctx);

const { PUZZLE, SIZE, BLACK } = ctx;
let ng = 0;

function fail(msg) {
  ng += 1;
  console.error(msg);
}

for (const row of PUZZLE.grid) {
  if (row.length !== SIZE) fail(`行の長さが${SIZE}ではない: ${row}`);
}

for (const word of PUZZLE.words) {
  const cells = ctx.cellsOfWord(word);
  if (cells.length !== word.answer.length) {
    fail(`${word.id} のマス数が答えと違う`);
  }
  const got = cells.map((i) => ctx.solutionAt(PUZZLE, i)).join("");
  if (got !== word.answer) fail(`${word.id} 盤面=${got} 答え=${word.answer}`);
}

for (let i = 0; i < SIZE * SIZE; i += 1) {
  if (ctx.isBlack(PUZZLE, i)) continue;
  if (ctx.wordsAt(PUZZLE, i).length === 0) {
    fail(`白マス ${i} がどのことばにも入っていない`);
  }
}

const board = ctx.emptyBoard(PUZZLE);
for (let i = 0; i < board.length; i += 1) {
  const s = ctx.solutionAt(PUZZLE, i);
  if (s) board[i] = s;
}
if (!ctx.isPuzzleSolved(board, PUZZLE)) fail("正解を入れても完成にならない");
if (ctx.correctCount(board, PUZZLE) !== ctx.whiteCount(PUZZLE)) {
  fail("正解数が白マスと合わない");
}
if (ctx.whiteCount(PUZZLE) !== 13) fail("白マスは13のはず");

const hint = ctx.makeHint(ctx.emptyBoard(PUZZLE), PUZZLE, PUZZLE.words[0]);
if (PUZZLE.words[0].answer.split("").some((ch) => hint.text.includes(ch))) {
  fail("ヒントに答えの文字が入っている");
}

if (ng) {
  console.error(`失敗 ${ng} 件`);
  process.exit(1);
}
console.log("クロスワードの問題チェック OK");
