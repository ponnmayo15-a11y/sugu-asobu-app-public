const BASE6 = [
  1, 2, 3, 4, 5, 6,
  4, 5, 6, 1, 2, 3,
  2, 3, 1, 5, 6, 4,
  5, 6, 4, 2, 3, 1,
  3, 1, 2, 6, 4, 5,
  6, 4, 5, 3, 1, 2,
];

const BASE9 = [
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

// 0〜1の乱数
function rng() {
  return Math.random();
}

// 配列を混ぜる
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 数字の名前を付け替える
function mapDigits(board, size) {
  const digits = shuffle([...Array(size).keys()].map((n) => n + 1));
  return board.map((n) => digits[n - 1]);
}

// 行の順番を入れ替える
function reorderRows(board, size, fromRows, toRows) {
  const next = copyBoard(board);
  for (let i = 0; i < fromRows.length; i += 1) {
    for (let c = 0; c < size; c += 1) {
      next[toRows[i] * size + c] = board[fromRows[i] * size + c];
    }
  }
  return next;
}

// 列の順番を入れ替える
function reorderCols(board, size, fromCols, toCols) {
  const next = copyBoard(board);
  for (let r = 0; r < size; r += 1) {
    for (let i = 0; i < fromCols.length; i += 1) {
      next[r * size + toCols[i]] = board[r * size + fromCols[i]];
    }
  }
  return next;
}

// 完成した盤を1つ作る
function makeComplete(size) {
  setShape(size);
  let board = mapDigits(size === 6 ? BASE6 : BASE9, size);
  if (size === 6) {
    board = reorderRows(board, 6, [0, 1], shuffle([0, 1]));
    board = reorderRows(board, 6, [2, 3], shuffle([2, 3]));
    board = reorderRows(board, 6, [4, 5], shuffle([4, 5]));
    board = reorderCols(board, 6, [0, 1, 2], shuffle([0, 1, 2]));
    board = reorderCols(board, 6, [3, 4, 5], shuffle([3, 4, 5]));
    return board;
  }
  for (let band = 0; band < 3; band += 1) {
    const from = [0, 1, 2].map((x) => band * 3 + x);
    board = reorderRows(board, 9, from, shuffle([0, 1, 2]).map((x) => band * 3 + x));
  }
  for (let stack = 0; stack < 3; stack += 1) {
    const from = [0, 1, 2].map((x) => stack * 3 + x);
    board = reorderCols(board, 9, from, shuffle([0, 1, 2]).map((x) => stack * 3 + x));
  }
  return board;
}

// 裸単体・隠れ単体だけで最後まで解けるか
function singlesOnly(board) {
  const work = copyBoard(board);
  while (work.includes(0)) {
    const step = nextSingle(work);
    if (!step) return false;
    work[step.i] = step.n;
  }
  return true;
}

// 指定の数だけ残して穴をあける
function carve(solution, target) {
  const puzzle = copyBoard(solution);
  const order = shuffle([...Array(puzzle.length).keys()]);
  for (const i of order) {
    if (puzzle.filter((n) => n).length <= target) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (!singlesOnly(puzzle)) puzzle[i] = keep;
  }
  return puzzle;
}

// せっていに合う問題を1つ作る
function makePuzzle(size, givenCount) {
  setShape(size);
  const range = givenRange(size);
  const target = clamp(givenCount, range.min, range.max);
  const solution = makeComplete(size);
  const givens = carve(solution, target);
  return { givens, solution };
}
