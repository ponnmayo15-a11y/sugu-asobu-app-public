const settings = loadSettings();

const state = {
  board: emptyBoard(),
  given: emptyBoard(),
  solution: emptyBoard(),
  selected: -1,
  hintAt: -1,
  hintsLeft: 0,
  done: false,
  making: false,
};

// 画面の部品を取る
function el(id) {
  return document.getElementById(id);
}

// せってい画面を出す
function showSetup() {
  el("screen-setup").hidden = false;
  el("screen-play").hidden = true;
}

// 遊ぶ画面を出す
function showPlay() {
  el("screen-setup").hidden = true;
  el("screen-play").hidden = false;
}

// せっていの数字を画面に合わせる
function paintSettings() {
  el("out-givens").textContent = `${settings.givens}こ（${givenLabel(settings.size, settings.givens)}）`;
  el("out-hints").textContent = settings.hints === 0 ? "なし" : `${settings.hints}かい`;
  document.querySelectorAll(".size-btn").forEach((btn) => {
    const on = Number(btn.dataset.size) === settings.size;
    btn.classList.toggle("btn-ghost", !on);
    btn.classList.toggle("is-on", on);
  });
}

// せっていの＋−を1段動かす
function nudge(key, dir) {
  if (key === "hints") {
    settings.hints = clamp(settings.hints + dir, 0, 9);
  }
  if (key === "givens") {
    const range = givenRange(settings.size);
    settings.givens = clamp(settings.givens + dir * range.step, range.min, range.max);
  }
  saveSettings(settings);
  paintSettings();
}

// ばんめんの大きさを変える
function setSize(size) {
  settings.size = size === 6 ? 6 : 9;
  const range = givenRange(settings.size);
  settings.givens = range.def;
  saveSettings(settings);
  paintSettings();
}

// 作った問題を盤面に載せる
function applyPuzzle(puzzle) {
  setShape(settings.size);
  state.given = copyBoard(puzzle.givens);
  state.solution = copyBoard(puzzle.solution);
  state.board = copyBoard(puzzle.givens);
  state.selected = firstEmpty(state.board);
  state.hintAt = -1;
  state.hintsLeft = settings.hints;
  state.done = false;
  el("hint-text").textContent = "マスを選んで、下の数字を押してください。";
  el("play-meta").textContent = `${settings.size}×${settings.size}　${givenLabel(settings.size, settings.givens)}`;
  paint();
}

// せっていに合う問題を作って始める
function startPuzzle() {
  if (state.making) return;
  state.making = true;
  showPlay();
  el("hint-text").textContent = "もんだいをつくっています…";
  el("setup-start").disabled = true;
  window.setTimeout(() => {
    applyPuzzle(makePuzzle(settings.size, settings.givens));
    el("setup-start").disabled = false;
    state.making = false;
  }, 20);
}

// 同じ問題の最初に戻す
function restartPuzzle() {
  if (state.making) return;
  state.board = copyBoard(state.given);
  state.selected = firstEmpty(state.board);
  state.hintAt = -1;
  state.hintsLeft = settings.hints;
  state.done = false;
  el("hint-text").textContent = "マスを選んで、下の数字を押してください。";
  paint();
}

// 最初の空きマス
function firstEmpty(board) {
  return board.findIndex((n) => n === 0);
}

// マスを選ぶ
function selectCell(i) {
  if (state.done || state.making) return;
  if (state.given[i]) return;
  state.selected = i;
  state.hintAt = -1;
  paint();
}

// 選んだマスに数字を入れる
function putNumber(n) {
  if (state.done || state.making || state.selected < 0) return;
  if (state.given[state.selected]) return;
  if (n < 1 || n > SIZE) return;
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
  if (state.done || state.making || state.selected < 0) return;
  if (state.given[state.selected]) return;
  state.board[state.selected] = 0;
  state.hintAt = -1;
  paint();
}

// ヒントを出す。数字は埋めない。回数を1つ減らす
function showHint() {
  if (state.done || state.making) return;
  if (state.hintsLeft <= 0) {
    el("hint-text").textContent = "ヒントはもうありません。";
    paint();
    return;
  }
  const hint = makeHint(state.board);
  el("hint-text").textContent = hint.text;
  state.hintsLeft -= 1;
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
  boardEl.className = `board size-${SIZE}`;
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
  el("pad").classList.toggle("is-6", SIZE === 6);
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
  const locked = state.done || state.making || state.selected < 0 || Boolean(state.given[state.selected]);
  el("pad").querySelectorAll("[data-n]").forEach((btn) => {
    const n = Number(btn.dataset.n);
    btn.hidden = n > SIZE;
    btn.disabled = locked || n > SIZE;
  });
  el("erase").disabled = locked;
  const noHint = state.done || state.making || state.hintsLeft <= 0;
  el("hint-btn").disabled = noHint;
  el("hint-btn").textContent =
    settings.hints === 0 ? "ヒントなし" : `ヒント のこり${state.hintsLeft}`;
}

// 最初の画面とボタンをつなぐ
function boot() {
  paintSettings();
  document.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", () => setSize(Number(btn.dataset.size)));
  });
  document.querySelectorAll("[data-set]").forEach((btn) => {
    btn.addEventListener("click", () => nudge(btn.dataset.set, Number(btn.dataset.dir)));
  });
  el("setup-start").addEventListener("click", startPuzzle);
  el("play-quit").addEventListener("click", showSetup);
  el("pad").addEventListener("click", (ev) => {
    const n = ev.target.closest("[data-n]");
    if (n) putNumber(Number(n.dataset.n));
  });
  el("erase").addEventListener("click", eraseCell);
  el("hint-btn").addEventListener("click", showHint);
  el("again").addEventListener("click", restartPuzzle);
  el("next").addEventListener("click", startPuzzle);
}

boot();
