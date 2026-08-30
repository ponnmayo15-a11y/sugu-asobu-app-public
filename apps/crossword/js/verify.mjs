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
    PUZZLES, SIZE, BLACK, cellsOfWord, solutionAt, isBlack, wordsAt,
    emptyBoard, isPuzzleSolved, correctCount, whiteCount, makeHint
  });`,
].join("\n");
runInContext(code, ctx);

const { PUZZLES, SIZE } = ctx;
let ng = 0;

function fail(msg) {
  ng += 1;
  console.error(msg);
}

function checkPuzzle(puzzle) {
  for (const row of puzzle.grid) {
    if (row.length !== SIZE) fail(`${puzzle.id} 行の長さ: ${row}`);
  }
  for (const word of puzzle.words) {
    const cells = ctx.cellsOfWord(word);
    if (cells.length !== word.answer.length) {
      fail(`${puzzle.id} ${word.id} のマス数が答えと違う`);
    }
    const got = cells.map((i) => ctx.solutionAt(puzzle, i)).join("");
    if (got !== word.answer) {
      fail(`${puzzle.id} ${word.id} 盤面=${got} 答え=${word.answer}`);
    }
  }
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    if (ctx.isBlack(puzzle, i)) continue;
    if (ctx.wordsAt(puzzle, i).length === 0) {
      fail(`${puzzle.id} 白マス ${i} がことばに入っていない`);
    }
  }
  const board = ctx.emptyBoard(puzzle);
  for (let i = 0; i < board.length; i += 1) {
    const s = ctx.solutionAt(puzzle, i);
    if (s) board[i] = s;
  }
  if (!ctx.isPuzzleSolved(board, puzzle)) {
    fail(`${puzzle.id} 正解を入れても完成にならない`);
  }
}

if (!Array.isArray(PUZZLES) || PUZZLES.length !== 3) {
  fail("問題は3つのはず");
}
PUZZLES.forEach(checkPuzzle);

if (ng) {
  console.error(`失敗 ${ng} 件`);
  process.exit(1);
}
console.log("クロスワードの問題チェック OK");
