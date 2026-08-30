// 1行の数字ヒントを、その行の塗りから作る
function cluesFromLine(line) {
  const clues = [];
  let run = 0;
  for (const cell of line) {
    if (cell === 1) {
      run += 1;
    } else if (run > 0) {
      clues.push(run);
      run = 0;
    }
  }
  if (run > 0) clues.push(run);
  return clues.length ? clues : [0];
}

// 盤面から、ヨコとタテのヒントを作る
function cluesFromGrid(grid) {
  const rows = grid.map((line) => cluesFromLine(line));
  const cols = [];
  const width = grid[0].length;
  for (let c = 0; c < width; c += 1) {
    cols.push(cluesFromLine(grid.map((line) => line[c])));
  }
  return { rows, cols };
}

// ヒントから、その行のありえる塗り方を全部出す
function lineWays(len, clues) {
  const list = clues.filter((n) => n > 0);
  const ways = [];
  fillWays(0, 0, [], len, list, ways);
  return ways;
}

// 1行の塗り方を、再帰で集める
function fillWays(pos, ci, line, len, list, ways) {
  if (ci === list.length) {
    const row = line.concat(Array(len - line.length).fill(0));
    if (row.length === len) ways.push(row);
    return;
  }
  const n = list[ci];
  const rest = list.slice(ci + 1);
  const restNeed = rest.reduce((sum, x) => sum + x, 0) + rest.length;
  const maxStart = len - n - restNeed;
  for (let start = pos; start <= maxStart; start += 1) {
    const next = line.concat(Array(start - line.length).fill(0), Array(n).fill(1));
    const after = start + n;
    fillWays(ci < list.length - 1 ? after + 1 : after, ci + 1, next, len, list, ways);
  }
}

// 途中までのタテ列が、ヒントと矛盾しないか見る
function colPrefixOk(values, clues, height) {
  const list = clues.filter((n) => n > 0);
  const done = [];
  let run = 0;
  for (const v of values) {
    if (v === 1) {
      run += 1;
    } else if (run > 0) {
      done.push(run);
      run = 0;
    }
  }
  if (done.length > list.length) return false;
  for (let i = 0; i < done.length; i += 1) {
    if (done[i] !== list[i]) return false;
  }
  if (run > 0) {
    if (done.length >= list.length) return false;
    if (run > list[done.length]) return false;
  }
  const leftRows = height - values.length;
  const need = remainingNeed(list, done, run);
  return need <= leftRows;
}

// まだ置く必要のある黒マス＋すき間の最小数
function remainingNeed(list, done, run) {
  if (done.length === list.length) return 0;
  if (run > 0) {
    const rest = list[done.length] - run;
    const after = list.slice(done.length + 1);
    return rest + after.reduce((sum, x) => sum + x, 0) + after.length;
  }
  const after = list.slice(done.length);
  return after.reduce((sum, x) => sum + x, 0) + Math.max(0, after.length - 1);
}

// 解がいくつあるか数える。2つ以上なら打ち切る
function countLogicSolutions(rowClues, colClues, limit) {
  const height = rowClues.length;
  const width = colClues.length;
  const opts = rowClues.map((clue) => lineWays(width, clue));
  const grid = [];
  let found = 0;
  function rec(r) {
    if (found >= limit) return;
    if (r === height) {
      found += 1;
      return;
    }
    for (const way of opts[r]) {
      grid[r] = way;
      let ok = true;
      for (let c = 0; c < width; c += 1) {
        const col = [];
        for (let i = 0; i <= r; i += 1) col.push(grid[i][c]);
        if (!colPrefixOk(col, colClues[c], height)) {
          ok = false;
          break;
        }
      }
      if (ok) rec(r + 1);
    }
  }
  rec(0);
  return found;
}

// 塗ったマスが答えと一致するか（×は空きと同じ）
function logicMatches(state, answer) {
  for (let r = 0; r < answer.length; r += 1) {
    for (let c = 0; c < answer[r].length; c += 1) {
      const filled = state[r][c] === 1 ? 1 : 0;
      if (filled !== answer[r][c]) return false;
    }
  }
  return true;
}

// 違うマスの数（×は空きと同じ）
function logicWrongCount(state, answer) {
  let n = 0;
  for (let r = 0; r < answer.length; r += 1) {
    for (let c = 0; c < answer[r].length; c += 1) {
      const filled = state[r][c] === 1 ? 1 : 0;
      if (filled !== answer[r][c]) n += 1;
    }
  }
  return n;
}

// 空の盤面（0=空き, 1=塗り, 2=×）
function emptyLogicState(h, w) {
  return Array.from({ length: h }, () => Array(w).fill(0));
}
