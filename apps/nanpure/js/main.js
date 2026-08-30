const state = {
  no: 0,
  board: emptyBoard(),
  given: emptyBoard(),
  solution: emptyBoard(),
  selected: -1,
  hintAt: -1,
  done: false,
};

// 画面の部品を取る
function el(id) {
  return document.getElementById(id);
}

// 問題を盤面に載せる
function loadPuzzle(no) {
  const p = PUZZLES[((no % PUZZLES.length) + PUZZLES.length) % PUZZLES.length];
  state.no = ((no % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  state.given = parseBoard(p.givens);
  state.solution = parseBoard(p.solution);
  state.board = copyBoard(state.given);
  state.selected = firstEmpty(state.board);
  state.hintAt = -1;
  state.done = false;
  el("hint-text").textContent = "マスを選んで、下の数字を押してください。";
  paint();
}

// 最初の空きマス
function firstEmpty(board) {
  const i = board.findIndex((n) => n === 0);
  return i;
}

// マスを選ぶ
function selectCell(i) {
  if (state.done) return;
  if (state.given[i]) return;
  state.selected = i;
  state.hintAt = -1;
  paint();
}

// 選んだマスに数字を入れる
function putNumber(n) {
  if (state.done || state.selected < 0) return;
  if (state.given[state.selected]) return;
  state.board[state.selected] = n;
  state.hintAt = -1;
  if (isSolved(state.board, state.solution)) {
    state.done = true;
    el("hint-text").textContent = "できた！";
  }
  paint();
}

// 選んだマスを空にする
function eraseCell() {
  if (state.done || state.selected < 0) return;
  if (state.given[state.selected]) return;
  state.board[state.selected] = 0;
  state.hintAt = -1;
  paint();
}

// ヒントを出す。数字は埋めない
function showHint() {
  if (state.done) return;
  const hint = makeHint(state.board);
  el("hint-text").textContent = hint.text;
  if (hint.i >= 0) {
    state.hintAt = hint.i;
    if (!state.given[hint.i]) state.selected = hint.i;
  }
  paint();
}

// 盤面とボタンを描く
function paint() {
  const conflicts = conflictCells(state.board);
  const wrong = wrongCells(state.board, state.solution, state.given);
  const boardEl = el("board");
  boardEl.replaceChildren();
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const { r, c } = rc(i);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = cellClass(i, r, c, conflicts, wrong);
    btn.textContent = state.board[i] ? String(state.board[i]) : "";
    btn.disabled = Boolean(state.given[i]) || state.done;
    btn.addEventListener("click", () => selectCell(i));
    boardEl.appendChild(btn);
  }
  el("done-box").hidden = !state.done;
  el("puzzle-no").textContent = `${state.no + 1} / ${PUZZLES.length}`;
  paintPad();
}

// 1マスの見た目クラス
function cellClass(i, r, c, conflicts, wrong) {
  const names = ["cell"];
  if (c % BOX_W === 0) names.push("box-l");
  if (r % BOX_H === 0) names.push("box-t");
  if (state.given[i]) names.push("is-given");
  if (i === state.selected) names.push("is-on");
  if (i === state.hintAt) names.push("is-hint");
  if (conflicts.has(i) || wrong.has(i)) names.push("is-ng");
  return names.join(" ");
}

// 下の数字ボタンのオンオフ
function paintPad() {
  const locked = state.done || state.selected < 0 || Boolean(state.given[state.selected]);
  el("pad").querySelectorAll("[data-n]").forEach((btn) => {
    btn.disabled = locked;
  });
  el("erase").disabled = locked;
  el("hint-btn").disabled = state.done;
}

// 最初の1問を出して、ボタンをつなぐ
function boot() {
  el("pad").addEventListener("click", (ev) => {
    const n = ev.target.closest("[data-n]");
    if (n) putNumber(Number(n.dataset.n));
  });
  el("erase").addEventListener("click", eraseCell);
  el("hint-btn").addEventListener("click", showHint);
  el("next").addEventListener("click", () => loadPuzzle(state.no + 1));
  el("again").addEventListener("click", () => loadPuzzle(state.no));
  loadPuzzle(0);
}

boot();
