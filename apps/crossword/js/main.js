const settings = loadSettings();

const state = {
  board: [],
  selected: 0,
  dir: "across",
  padCol: -1,
  undo: [],
  done: false,
  timedOut: false,
  seconds: 0,
  timerId: 0,
  seenWords: {},
  banner: "",
};

// 画面の部品を取る
function el(id) {
  return document.getElementById(id);
}

// 左上の白マス
function firstWhite() {
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    if (!isBlack(PUZZLE, i)) return i;
  }
  return 0;
}

// せってい画面を出す
function showSetup() {
  clearInterval(state.timerId);
  el("screen-setup").hidden = false;
  el("screen-play").hidden = true;
  paintSettings();
}

// 遊ぶ画面を出す
function showPlay() {
  el("screen-setup").hidden = true;
  el("screen-play").hidden = false;
}

// 残り時間の表示
function timeLabel(sec) {
  if (!sec) return "なし";
  return `${sec / 60}分`;
}

// せっていを画面に合わせる
function paintSettings() {
  el("out-time").textContent = timeLabel(settings.timeSec);
  document.querySelectorAll(".level-btn").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.level === settings.level);
  });
}

// 難易度を選ぶ
function pickLevel(level) {
  settings.level = level;
  saveSettings(settings);
  paintSettings();
}

// 残り時間を一段動かす
function nudgeTime(dir) {
  const i = TIME_OPTS.indexOf(settings.timeSec);
  const next = TIME_OPTS[i + dir];
  if (next === undefined) return;
  settings.timeSec = next;
  saveSettings(settings);
  paintSettings();
}

// 今選んでいることば
function currentWord() {
  return wordAtDir(PUZZLE, state.selected, state.dir);
}

// 入力を止める状態か
function isLocked() {
  return state.done || state.timedOut;
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
    timedOut: state.timedOut,
    seconds: state.seconds,
    seenWords: state.seenWords,
  };
}

// 盤面を空にして始める
function resetBoard() {
  PUZZLE = puzzleByLevel(settings.level);
  state.board = emptyBoard(PUZZLE);
  state.selected = firstWhite();
  state.dir = "across";
  state.padCol = -1;
  state.undo = [];
  state.done = false;
  state.timedOut = false;
  state.seconds = 0;
  state.seenWords = {};
  state.banner = "";
  clearPlay();
}

// せっていどおりに遊びはじめる
function startPlay() {
  resetBoard();
  showPlay();
  startTimer();
  paint();
}

// せっていに戻る
function quitToSetup() {
  clearInterval(state.timerId);
  clearPlay();
  showSetup();
}

// 1秒進める
function tick() {
  if (isLocked()) return;
  state.seconds += 1;
  if (settings.timeSec && state.seconds >= settings.timeSec) {
    timeUp();
    return;
  }
  paintHud();
  savePlay(snapshot());
}

// 時間切れ
function timeUp() {
  state.timedOut = true;
  state.done = true;
  clearInterval(state.timerId);
  savePlay(snapshot());
  paint();
}

// 時計を mm:ss にする
function timeText(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// マスを選ぶ。同じマスなら向きを変える
function selectCell(i) {
  if (isLocked() || isBlack(PUZZLE, i)) return;
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
  if (isLocked() || state.selected < 0) return;
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
  if (isLocked() || state.selected < 0) return;
  if (isBlack(PUZZLE, state.selected)) return;
  const sol = solutionAt(PUZZLE, state.selected);
  if (state.board[state.selected] === sol) return;
  state.undo.push({ i: state.selected, prev: state.board[state.selected] });
  state.board[state.selected] = "";
  afterEdit();
}

// 一手もどす
function undoMove() {
  if (isLocked() || !state.undo.length) return;
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
  if (isLocked()) return;
  const hint = makeHint(state.board, PUZZLE, currentWord());
  state.banner = hint.text;
  if (hint.i >= 0) state.selected = hint.i;
  paint();
}

// 同じせっていでもういちど
function resetPlay() {
  resetBoard();
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
  el("stat-level").textContent = PUZZLE.level;
  el("stat-fill").textContent = `${correctCount(state.board, PUZZLE)}/${all}`;
  if (settings.timeSec) {
    el("stat-time-label").textContent = "のこり";
    el("stat-time").textContent = timeText(
      Math.max(0, settings.timeSec - state.seconds)
    );
  } else {
    el("stat-time-label").textContent = "じかん";
    el("stat-time").textContent = timeText(state.seconds);
  }
}

// カギの文を描く
function paintClue() {
  if (state.timedOut) {
    el("clue-kicker").textContent = "時間切れ";
    el("clue-text").textContent = "設定に戻って、もういちどできます。";
    return;
  }
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
    btn.disabled = isBlack(PUZZLE, i) || isLocked();
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
  if (isLocked()) return;
  if (state.padCol < 0) {
    KANA_COLS.forEach((col, i) => {
      box.appendChild(padColBtn(col[0], () => {
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

// 「あ行」ボタン。行だけ小さくする
function padColBtn(kana, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pad-n pad-col";
  const head = document.createElement("span");
  head.textContent = kana;
  const gyo = document.createElement("span");
  gyo.className = "pad-gyo";
  gyo.textContent = "行";
  btn.append(head, gyo);
  btn.addEventListener("click", onClick);
  return btn;
}

// できたあとのことば一覧
function paintNote() {
  const box = el("word-note");
  box.replaceChildren();
  const show = state.done || state.timedOut;
  el("done-box").hidden = !show;
  if (!show) return;
  el("done-title").textContent = state.timedOut ? "時間切れ" : "できた！";
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
  el("undo").disabled = isLocked() || !state.undo.length;
  el("erase").disabled = isLocked();
  el("hint-btn").disabled = isLocked();
  el("mark-daku").hidden = isLocked();
  el("mark-handaku").hidden = isLocked();
}

document.querySelectorAll(".level-btn").forEach((btn) => {
  btn.addEventListener("click", () => pickLevel(btn.dataset.level));
});
el("time-down").addEventListener("click", () => nudgeTime(-1));
el("time-up").addEventListener("click", () => nudgeTime(1));
el("setup-start").addEventListener("click", startPlay);
el("play-quit").addEventListener("click", quitToSetup);
el("to-setup").addEventListener("click", quitToSetup);
el("undo").addEventListener("click", undoMove);
el("erase").addEventListener("click", eraseCell);
el("hint-btn").addEventListener("click", showHint);
el("again").addEventListener("click", resetPlay);
el("mark-daku").addEventListener("click", () => markKana("daku"));
el("mark-handaku").addEventListener("click", () => markKana("handaku"));

showSetup();
