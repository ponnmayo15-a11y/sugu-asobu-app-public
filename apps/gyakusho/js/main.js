const settings = loadSettings();

const state = {
  phase: "setup",
  shown: [],
  expected: [],
  typed: [],
  score: 0,
  done: 0,
  locked: false,
  timerId: 0,
};

// 画面の部品を取る
function el(id) {
  return document.getElementById(id);
}

// せってい画面を出す
function showSetup() {
  stopTimer();
  state.phase = "setup";
  el("screen-setup").hidden = false;
  el("screen-play").hidden = true;
  el("screen-result").hidden = true;
}

// 遊ぶ画面を出す
function showPlay() {
  el("screen-setup").hidden = true;
  el("screen-play").hidden = false;
  el("screen-result").hidden = true;
}

// 結果画面を出す
function showResult() {
  stopTimer();
  el("screen-setup").hidden = true;
  el("screen-play").hidden = true;
  el("screen-result").hidden = false;
}

// カウントを止める
function stopTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = 0;
}

// 指定ミリ秒あとで動かす
function waitThen(ms, fn) {
  setTimeout(fn, ms);
}

// 回数の表示用の文字をつくる
function goalText() {
  return settings.goal === 0 ? "無限" : `${settings.goal}回`;
}

// いま何問めかを書く
function progressText() {
  const now = state.done + (state.phase === "judge" ? 0 : 1);
  if (settings.goal === 0) return `${now} / 無限`;
  return `${now} / ${settings.goal}`;
}

// 回数を1段動かす。10のつぎは無限
function nudgeGoal(dir) {
  let i = GOAL_STEPS.indexOf(settings.goal);
  if (i < 0) i = GOAL_STEPS.indexOf(5);
  settings.goal = GOAL_STEPS[clamp(i + dir, 0, GOAL_STEPS.length - 1)];
}

// せっていボタンの見た目を合わせる
function paintSettings() {
  document.querySelectorAll("[data-digits]").forEach((btn) => {
    btn.classList.toggle("is-on", Number(btn.dataset.digits) === settings.digits);
  });
  el("out-view").textContent = `${settings.viewSec}秒`;
  el("out-goal").textContent = goalText();
  document.querySelectorAll("[data-move]").forEach((btn) => {
    const on = btn.dataset.move === "1";
    btn.classList.toggle("is-on", on === settings.move);
  });
}

// せいかい数と問題数を書く
function paintHud() {
  el("score").textContent = String(state.score);
  el("progress").textContent = progressText();
}

// 数字をマスに出す
function paintDigits(digits, emptyCount) {
  const box = el("digit-line");
  box.replaceChildren();
  box.className = `digit-line count-${settings.digits}`;
  if (state.phase === "memo" && settings.move) box.classList.add("is-memo");
  const list = emptyCount != null ? Array(emptyCount).fill("") : digits;
  list.forEach((n) => {
    const cell = document.createElement("span");
    cell.className = n === "" ? "digit-cell is-empty" : "digit-cell";
    cell.textContent = n === "" ? "" : String(n);
    box.append(cell);
  });
}

// 入れた数字をマスに出す
function paintTyped() {
  const cells = [];
  for (let i = 0; i < settings.digits; i += 1) {
    cells.push(state.typed[i] == null ? "" : state.typed[i]);
  }
  paintDigits(cells);
}

// 判定の文字を出す
function paintJudge(ok) {
  const node = el("judge");
  if (ok) {
    node.textContent = "正解";
    node.className = "judge is-ok";
    return;
  }
  node.textContent = `不正解。答えは ${digitsText(state.expected)}`;
  node.className = "judge is-ng";
}

// テンキーの押しやすさを切り替える
function setPadOn(on) {
  el("pad").querySelectorAll("button").forEach((btn) => {
    btn.disabled = !on;
  });
}

// 覚える画面にする
function beginMemorize() {
  stopTimer();
  state.phase = "memo";
  state.locked = true;
  state.shown = makeDigits(settings.digits);
  state.expected = reverseDigits(state.shown);
  state.typed = [];
  el("hint").textContent = "覚えましょう";
  el("judge").textContent = "";
  el("judge").className = "judge";
  paintDigits(state.shown);
  paintHud();
  setPadOn(false);
  let left = settings.viewSec;
  el("hint").textContent = `覚えましょう　残り ${left}`;
  state.timerId = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      beginAnswer();
      return;
    }
    el("hint").textContent = `覚えましょう　残り ${left}`;
  }, 1000);
}

// 答える画面にする
function beginAnswer() {
  stopTimer();
  state.phase = "answer";
  state.locked = false;
  state.typed = [];
  el("hint").textContent = "逆の順で入れてください";
  paintTyped();
  setPadOn(true);
}

// せいかい／おしいを見て、つぎへ進む
function judgeNow() {
  state.phase = "judge";
  state.locked = true;
  state.done += 1;
  const ok = sameDigits(state.typed, state.expected);
  if (ok) state.score += 1;
  paintHud();
  paintJudge(ok);
  setPadOn(false);
  waitThen(ok ? 500 : 1400, () => {
    if (state.phase !== "judge") return;
    if (settings.goal > 0 && state.done >= settings.goal) {
      fillResult();
      showResult();
      return;
    }
    beginMemorize();
  });
}

// テンキーの数字を1つ入れる
function typeDigit(n) {
  if (state.phase !== "answer" || state.locked) return;
  if (state.typed.length >= settings.digits) return;
  state.typed.push(n);
  paintTyped();
  if (state.typed.length === settings.digits) judgeNow();
}

// いちばん後ろの数字を消す
function eraseDigit() {
  if (state.phase !== "answer" || state.locked) return;
  state.typed.pop();
  paintTyped();
}

// 結果の数字を埋める
function fillResult() {
  el("result-score").textContent = String(state.score);
  el("result-unit").textContent = `${state.done}問中 正解`;
  el("result-meta").textContent =
    `${settings.digits}桁・見る時間 ${settings.viewSec}秒・${goalText()}`;
}

// 今のせっていで遊びはじめる
function startPlay() {
  saveSettings(settings);
  state.score = 0;
  state.done = 0;
  state.typed = [];
  el("score").textContent = "0";
  el("progress").textContent = progressText();
  showPlay();
  beginMemorize();
}

// やめて結果を出す。まだ1問も見ていなければせっていへ
function quitPlay() {
  stopTimer();
  if (state.done === 0) {
    showSetup();
    return;
  }
  fillResult();
  showResult();
}

// ボタンを結びつける
function bind() {
  document.querySelectorAll("[data-digits]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.digits = Number(btn.dataset.digits);
      saveSettings(settings);
      paintSettings();
    });
  });
  el("view-down").addEventListener("click", () => {
    settings.viewSec = clamp(settings.viewSec - 1, 2, 10);
    saveSettings(settings);
    paintSettings();
  });
  el("view-up").addEventListener("click", () => {
    settings.viewSec = clamp(settings.viewSec + 1, 2, 10);
    saveSettings(settings);
    paintSettings();
  });
  el("goal-down").addEventListener("click", () => {
    nudgeGoal(-1);
    saveSettings(settings);
    paintSettings();
  });
  el("goal-up").addEventListener("click", () => {
    nudgeGoal(1);
    saveSettings(settings);
    paintSettings();
  });
  document.querySelectorAll("[data-move]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.move = btn.dataset.move === "1";
      saveSettings(settings);
      paintSettings();
    });
  });
  el("setup-start").addEventListener("click", startPlay);
  el("erase").addEventListener("click", eraseDigit);
  el("pad").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-n]");
    if (!btn) return;
    typeDigit(Number(btn.dataset.n));
  });
  el("again").addEventListener("click", startPlay);
  el("to-setup").addEventListener("click", showSetup);
  el("play-quit").addEventListener("click", quitPlay);
}

paintSettings();
bind();
showSetup();
