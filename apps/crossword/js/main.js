// 左上の白マス
function firstWhite() {
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    if (!isBlack(PUZZLE, i)) return i;
  }
  return 0;
}

const state = {
  board: emptyBoard(PUZZLE),
  selected: firstWhite(),
  dir: "across",
  padCol: -1,
  undo: [],
  done: false,
  seconds: 0,
  timerId: 0,
  seenWords: {},
  banner: "",
};

// 画面の部品を取る
function el(id) {
  return document.getElementById(id);
}

// 今選んでいることば
function currentWord() {
  return wordAtDir(PUZZLE, state.selected, state.dir);
}

// セーブ用の中身
function snapshot() {
  return {
    id: PUZZLE.id,
    board: state.board,
    selected: state.selected,
    dir: state.dir,
    undo: state.undo,
    done: state.done,
    seconds: state.seconds,
    seenWords: state.seenWords,
  };
}

// 途中から再開する
function restore() {
  const data = loadPlay();
  if (!data || !Array.isArray(data.board)) return;
  state.board = data.board;
  state.selected = data.selected ?? firstWhite();
  state.dir = data.dir === "down" ? "down" : "across";
  state.undo = Array.isArray(data.undo) ? data.undo : [];
  state.done = Boolean(data.done);
  state.seconds = Number(data.seconds) || 0;
  state.seenWords = data.seenWords || {};
}

// 1秒進める
function tick() {
  if (state.done) return;
  state.seconds += 1;
  paintHud();
  savePlay(snapshot());
}

// 時計を mm:ss にする
function timeText(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// マスを選ぶ。同じマスなら向きを変える
function selectCell(i) {
  if (state.done || isBlack(PUZZLE, i)) return;
  if (state.selected === i) {
    const other = state.dir === "across" ? "down" : "across";
    if (wordsAt(PUZZLE, i).some((w) => w.dir === other)) state.dir = other;
  } else {
    state.selected = i;
    const cur = wordAtDir(PUZZLE, i, state.dir);
    if (cur) state.dir = cur.dir;
  }
  state.padCol = -1;
  state.banner = "";
  paint();
}

// 選んだマスに文字を入れる
function putKana(ch) {
  if (state.done || state.selected < 0) return;
  if (isBlack(PUZZLE, state.selected)) return;
  if (state.board[state.selected] === solutionAt(PUZZLE, state.selected)) return;
  state.undo.push({ i: state.selected, prev: state.board[state.selected] });
  state.board[state.selected] = ch;
  afterEdit();
}

// 濁点・半濁点を付ける
function markKana(kind) {
  const cur = state.board[state.selected];
  if (!cur || cur === BLACK) return;
  const next = kind === "handaku" ? withHandaku(cur) : withDaku(cur);
  if (next === cur) return;
  putKana(next);
}

// 選んだマスを空にする
function eraseCell() {
  if (state.done || state.selected < 0) return;
  if (isBlack(PUZZLE, state.selected)) return;
  const sol = solutionAt(PUZZLE, state.selected);
  if (state.board[state.selected] === sol) return;
  state.undo.push({ i: state.selected, prev: state.board[state.selected] });
  state.board[state.selected] = "";
  afterEdit();
}

// 一手もどす
function undoMove() {
  if (state.done || !state.undo.length) return;
  const last = state.undo.pop();
  state.board[last.i] = last.prev;
  state.selected = last.i;
  afterEdit();
}

// 入れたあとの共通処理
function afterEdit() {
  const word = currentWord();
  if (word && isWordSolved(state.board, word) && !state.seenWords[word.id]) {
    state.seenWords[word.id] = true;
    state.banner = `${word.answer} … ${word.meaning}`;
  } else if (!word || !isWordSolved(state.board, word)) {
    state.banner = "";
  }
  if (isPuzzleSolved(state.board, PUZZLE)) {
    state.done = true;
    clearInterval(state.timerId);
  }
  state.padCol = -1;
  savePlay(snapshot());
  paint();
}

// ヒント。文字は埋めない
function showHint() {
  if (state.done) return;
  const hint = makeHint(state.board, PUZZLE, currentWord());
  state.banner = hint.text;
  if (hint.i >= 0) state.selected = hint.i;
  paint();
}

// はじめから
function resetPlay() {
  state.board = emptyBoard(PUZZLE);
  state.selected = firstWhite();
  state.dir = "across";
  state.padCol = -1;
  state.undo = [];
  state.done = false;
  state.seconds = 0;
  state.seenWords = {};
  state.banner = "";
  clearPlay();
  startTimer();
  paint();
}

// 時計を動かす
function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(tick, 1000);
}

// うえの数字を描く
function paintHud() {
  const all = whiteCount(PUZZLE);
  el("stat-fill").textContent = `${correctCount(state.board, PUZZLE)}/${all}`;
  el("stat-time").textContent = timeText(state.seconds);
}

// カギの文を描く
function paintClue() {
  if (state.done) {
    el("clue-kicker").textContent = "できた";
    el("clue-text").textContent = "全部つながりました。";
    return;
  }
  const word = currentWord();
  if (!word) {
    el("clue-kicker").textContent = "カギ";
    el("clue-text").textContent = "マスを押してください。";
    return;
  }
  const side = word.dir === "across" ? "ヨコ" : "タテ";
  const kicker = !state.banner
    ? `${side} ${word.num}`
    : state.banner.includes("…")
      ? "つながった"
      : "ヒント";
  el("clue-kicker").textContent = kicker;
  el("clue-text").textContent = state.banner || word.clue;
}

// 盤面を描く
function paintBoard() {
  const word = currentWord();
  const wordCells = word ? cellsOfWord(word) : [];
  const box = el("board");
  box.replaceChildren();
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = cellClass(i, wordCells);
    btn.disabled = isBlack(PUZZLE, i) || state.done;
    const num = numberAt(PUZZLE, i);
    if (num && !isBlack(PUZZLE, i)) {
      const mark = document.createElement("span");
      mark.className = "cell-num";
      mark.textContent = String(num);
      btn.appendChild(mark);
    }
    const letter = document.createElement("span");
    letter.className = "cell-kana";
    letter.textContent = isBlack(PUZZLE, i) ? "" : state.board[i];
    btn.appendChild(letter);
    btn.addEventListener("click", () => selectCell(i));
    box.appendChild(btn);
  }
}

// 1マスの見た目
function cellClass(i, wordCells) {
  const names = ["cell"];
  if (isBlack(PUZZLE, i)) return "cell is-black";
  if (wordCells.includes(i)) names.push("is-word");
  if (i === state.selected) names.push("is-on");
  const sol = solutionAt(PUZZLE, i);
  if (state.board[i] && state.board[i] === sol) names.push("is-ok");
  if (state.board[i] && state.board[i] !== sol) names.push("is-ng");
  return names.join(" ");
}

// ひらがなボタンを描く
function paintPad() {
  const box = el("pad");
  box.replaceChildren();
  if (state.done) return;
  if (state.padCol < 0) {
    KANA_COLS.forEach((col, i) => {
      box.appendChild(padBtn(col[0], () => {
        state.padCol = i;
        paintPad();
      }));
    });
    return;
  }
  KANA_COLS[state.padCol].forEach((ch) => {
    box.appendChild(padBtn(ch, () => putKana(ch)));
  });
  box.appendChild(padBtn("もどる", () => {
    state.padCol = -1;
    paintPad();
  }, true));
}

// 下の1ボタン
function padBtn(label, onClick, ghost) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = ghost ? "pad-n is-ghost" : "pad-n";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

// できたあとのことば一覧
function paintNote() {
  const box = el("word-note");
  box.replaceChildren();
  if (!state.done) {
    el("done-box").hidden = true;
    return;
  }
  el("done-box").hidden = false;
  PUZZLE.words.forEach((w) => {
    const p = document.createElement("p");
    p.textContent = `${w.answer} … ${w.meaning}`;
    box.appendChild(p);
  });
}

// 画面全体を描く
function paint() {
  paintHud();
  paintClue();
  paintBoard();
  paintPad();
  paintNote();
  el("undo").disabled = state.done || !state.undo.length;
  el("erase").disabled = state.done;
  el("hint-btn").disabled = state.done;
  el("mark-daku").hidden = state.done;
  el("mark-handaku").hidden = state.done;
}

el("undo").addEventListener("click", undoMove);
el("erase").addEventListener("click", eraseCell);
el("hint-btn").addEventListener("click", showHint);
el("again").addEventListener("click", resetPlay);
el("mark-daku").addEventListener("click", () => markKana("daku"));
el("mark-handaku").addEventListener("click", () => markKana("handaku"));

restore();
if (!state.done) startTimer();
paint();
