// マス番号から行と列を出す
function rc(i) {
  return { r: Math.floor(i / SIZE), c: i % SIZE };
}

// 行と列からマス番号を出す
function idx(r, c) {
  return r * SIZE + c;
}

// ことばが入るマス番号の列
function cellsOfWord(word) {
  return word.answer.split("").map((_, k) => {
    const r = word.dir === "across" ? word.r : word.r + k;
    const c = word.dir === "across" ? word.c + k : word.c;
    return idx(r, c);
  });
}

// 正解の1文字。黒マスは空文字
function solutionAt(puzzle, i) {
  const { r, c } = rc(i);
  const ch = puzzle.grid[r][c];
  return ch === BLACK ? "" : ch;
}

// 黒マスかどうか
function isBlack(puzzle, i) {
  return solutionAt(puzzle, i) === "";
}

// 白マスの数
function whiteCount(puzzle) {
  return puzzle.grid.join("").replaceAll(BLACK, "").length;
}

// そのマスから始まる番号
function numberAt(puzzle, i) {
  const { r, c } = rc(i);
  const hit = puzzle.words.find((w) => w.r === r && w.c === c);
  return hit ? hit.num : 0;
}

// そのマスを通ることば
function wordsAt(puzzle, i) {
  return puzzle.words.filter((w) => cellsOfWord(w).includes(i));
}

// 向きに合うことば。なければもう一方
function wordAtDir(puzzle, i, dir) {
  const list = wordsAt(puzzle, i);
  return list.find((w) => w.dir === dir) || list[0] || null;
}

// 盤面のそのことばが正解か
function isWordSolved(board, word) {
  return cellsOfWord(word).every((i, k) => board[i] === word.answer[k]);
}

// 盤面がすべて正解か
function isPuzzleSolved(board, puzzle) {
  return puzzle.words.every((w) => isWordSolved(board, w));
}

// 正解のマス数
function correctCount(board, puzzle) {
  let n = 0;
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const s = solutionAt(puzzle, i);
    if (s && board[i] === s) n += 1;
  }
  return n;
}

// 空の盤面
function emptyBoard(puzzle) {
  return Array.from({ length: SIZE * SIZE }, (_, i) =>
    isBlack(puzzle, i) ? BLACK : ""
  );
}

// 濁点を付けた文字。付かなければ元の文字
function withDaku(ch) {
  if (DAKU[ch]) return DAKU[ch];
  if (DAKU_BACK[ch]) return DAKU_BACK[ch];
  if (HANDAKU[ch]) return DAKU[ch] || ch;
  return ch;
}

// 半濁点を付けた文字
function withHandaku(ch) {
  if (HANDAKU[ch]) return HANDAKU[ch];
  if (HANDAKU_BACK[ch]) return HANDAKU_BACK[ch];
  if (DAKU_BACK[ch] && HANDAKU[DAKU_BACK[ch]]) {
    return HANDAKU[DAKU_BACK[ch]];
  }
  return ch;
}

// ヒント文。答えの文字は入れない
function makeHint(board, puzzle, word) {
  if (!word) return { text: "マスを選んでください。", i: -1 };
  if (isWordSolved(board, word)) {
    return { text: "このことばはできています。", i: -1 };
  }
  const cells = cellsOfWord(word);
  const filled = cells.findIndex((i) => board[i] && board[i] === solutionAt(puzzle, i));
  if (filled >= 0) {
    return {
      text: `このことばの${filled + 1}文字目は、もう入っています。そこから考えられます。`,
      i: cells[filled],
    };
  }
  return { text: word.hint, i: cells[0] };
}
