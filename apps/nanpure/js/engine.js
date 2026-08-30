const SIZE = 9;
const BOX_H = 3;
const BOX_W = 3;

// マス番号（0〜80）から行と列を出す
function rc(i) {
  return { r: Math.floor(i / SIZE), c: i % SIZE };
}

// 行と列からマス番号を出す
function idx(r, c) {
  return r * SIZE + c;
}

// そのマスが属するブロックの左上
function boxOrigin(r, c) {
  return {
    r: Math.floor(r / BOX_H) * BOX_H,
    c: Math.floor(c / BOX_W) * BOX_W,
  };
}

// 盤面のコピーを返す
function copyBoard(board) {
  return board.slice();
}

// 空の盤面を返す
function emptyBoard() {
  return Array(SIZE * SIZE).fill(0);
}

// そのマスに数字を置いてよいか
function canPlace(board, r, c, n) {
  for (let x = 0; x < SIZE; x += 1) {
    if (board[idx(r, x)] === n) return false;
    if (board[idx(x, c)] === n) return false;
  }
  const o = boxOrigin(r, c);
  for (let dr = 0; dr < BOX_H; dr += 1) {
    for (let dc = 0; dc < BOX_W; dc += 1) {
      if (board[idx(o.r + dr, o.c + dc)] === n) return false;
    }
  }
  return true;
}

// 空きマスに入る候補の数字
function candidates(board, r, c) {
  if (board[idx(r, c)] !== 0) return [];
  const out = [];
  for (let n = 1; n <= SIZE; n += 1) {
    if (canPlace(board, r, c, n)) out.push(n);
  }
  return out;
}

// 同じ行・列・ブロックに同じ数字があるマス
function conflictCells(board) {
  const bad = new Set();
  for (let i = 0; i < board.length; i += 1) {
    const n = board[i];
    if (!n) continue;
    const { r, c } = rc(i);
    let count = 0;
    for (let x = 0; x < SIZE; x += 1) {
      if (board[idx(r, x)] === n) count += 1;
    }
    if (count > 1) bad.add(i);
    count = 0;
    for (let x = 0; x < SIZE; x += 1) {
      if (board[idx(x, c)] === n) count += 1;
    }
    if (count > 1) bad.add(i);
    count = 0;
    const o = boxOrigin(r, c);
    for (let dr = 0; dr < BOX_H; dr += 1) {
      for (let dc = 0; dc < BOX_W; dc += 1) {
        if (board[idx(o.r + dr, o.c + dc)] === n) count += 1;
      }
    }
    if (count > 1) bad.add(i);
  }
  return bad;
}

// 1通りに解けるか確認し、解けたら答えを返す
function solveUnique(board) {
  const work = copyBoard(board);
  let found = null;
  let count = 0;

  function walk() {
    if (count > 1) return;
    let best = -1;
    let bestCands = null;
    for (let i = 0; i < work.length; i += 1) {
      if (work[i] !== 0) continue;
      const { r, c } = rc(i);
      const cand = candidates(work, r, c);
      if (cand.length === 0) return;
      if (!bestCands || cand.length < bestCands.length) {
        best = i;
        bestCands = cand;
        if (cand.length === 1) break;
      }
    }
    if (best < 0) {
      count += 1;
      found = copyBoard(work);
      return;
    }
    const { r, c } = rc(best);
    for (let k = 0; k < bestCands.length; k += 1) {
      work[best] = bestCands[k];
      walk();
      if (count > 1) {
        work[best] = 0;
        return;
      }
      work[best] = 0;
    }
  }

  walk();
  if (count !== 1) return null;
  return found;
}

// 裸単体・隠れ単体で1手進める
function nextSingle(board) {
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] !== 0) continue;
    const { r, c } = rc(i);
    const cand = candidates(board, r, c);
    if (cand.length === 1) {
      return {
        i,
        n: cand[0],
        text: `このマスには${cand[0]}しか入れない。ほかの数字は、同じ行・列・ブロックにある。`,
      };
    }
  }

  for (let r = 0; r < SIZE; r += 1) {
    for (let n = 1; n <= SIZE; n += 1) {
      const places = [];
      for (let c = 0; c < SIZE; c += 1) {
        if (board[idx(r, c)] === n) {
          places.length = 0;
          break;
        }
        if (board[idx(r, c)] === 0 && canPlace(board, r, c, n)) {
          places.push(idx(r, c));
        }
      }
      if (places.length === 1) {
        return {
          i: places[0],
          n,
          text: `この行では${n}はここしか入れない。`,
        };
      }
    }
  }

  for (let c = 0; c < SIZE; c += 1) {
    for (let n = 1; n <= SIZE; n += 1) {
      const places = [];
      for (let r = 0; r < SIZE; r += 1) {
        if (board[idx(r, c)] === n) {
          places.length = 0;
          break;
        }
        if (board[idx(r, c)] === 0 && canPlace(board, r, c, n)) {
          places.push(idx(r, c));
        }
      }
      if (places.length === 1) {
        return {
          i: places[0],
          n,
          text: `この列では${n}はここしか入れない。`,
        };
      }
    }
  }

  for (let br = 0; br < SIZE; br += BOX_H) {
    for (let bc = 0; bc < SIZE; bc += BOX_W) {
      for (let n = 1; n <= SIZE; n += 1) {
        const places = [];
        let seen = false;
        for (let dr = 0; dr < BOX_H; dr += 1) {
          for (let dc = 0; dc < BOX_W; dc += 1) {
            const i = idx(br + dr, bc + dc);
            if (board[i] === n) {
              seen = true;
            } else if (board[i] === 0 && canPlace(board, br + dr, bc + dc, n)) {
              places.push(i);
            }
          }
        }
        if (!seen && places.length === 1) {
          return {
            i: places[0],
            n,
            text: `このブロックでは${n}はここしか入れない。`,
          };
        }
      }
    }
  }

  return null;
}

// ヒント文を出す。数字は埋めない
function makeHint(board) {
  const bad = conflictCells(board);
  if (bad.size) {
    const i = [...bad][0];
    return {
      i,
      n: board[i],
      text: "同じ行・列・ブロックに、同じ数字がふたつある。",
    };
  }
  const step = nextSingle(board);
  if (step) return step;
  return {
    i: -1,
    n: 0,
    text: "もう少しマスを埋めてから、もう一度押してください。",
  };
}

// 全部埋まって答えと一致するか
function isSolved(board, solution) {
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] !== solution[i]) return false;
  }
  return true;
}

// 答えと違う、自分で入れたマス
function wrongCells(board, solution, given) {
  const bad = new Set();
  for (let i = 0; i < board.length; i += 1) {
    if (given[i]) continue;
    if (board[i] && board[i] !== solution[i]) bad.add(i);
  }
  return bad;
}
