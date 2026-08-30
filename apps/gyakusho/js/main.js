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

// せっていボタンの見た目を合わせる
function paintSettings() {
  document.querySelectorAll("[data-digits]").forEach((btn) => {
    btn.classList.toggle("is-on", Number(btn.dataset.digits) === settings.digits);
  });
  el("out-view").textContent = `${settings.viewSec}秒`;
}

// せいかい数と問題数を書く
function paintHud() {
  el("score").textContent = String(state.score);
  el("progress").textContent = String(state.done + (state.phase === "judge" ? 0 : 1));
}

// 数字をマスに出す
function paintDigits(digits, emptyCount) {
  const box = el("digit-line");
  box.replaceChildren();
  box.className = `digit-line count-${settings.digits}`;
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
    node.textContent = "せいかい";
    node.className = "judge is-ok";
    return;
  }
  node.textContent = `おしい。こたえは ${digitsText(state.expected)}`;
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
  el("hint").textContent = "おぼえましょう";
  el("judge").textContent = "";
  el("judge").className = "judge";
  el("remember").hidden = true;
  paintDigits(state.shown);
  paintHud();
  setPadOn(false);
  let left = settings.viewSec;
  el("hint").textContent = `おぼえましょう　のこり ${left}`;
  state.timerId = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      beginAnswer();
      return;
    }
    el("hint").textContent = `おぼえましょう　のこり ${left}`;
  }, 1000);
}

// 答える画面にする
function beginAnswer() {
  stopTimer();
  state.phase = "answer";
  state.locked = false;
  state.typed = [];
  el("hint").textContent = "逆の順で入れてください";
  el("remember").hidden = true;
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
  el("result-unit").textContent = `${state.done}もんちゅう せいかい`;
  el("result-meta").textContent = `${settings.digits}ケタ・見る時間 ${settings.viewSec}秒`;
}

// 今のせっていで遊びはじめる
function startPlay() {
  saveSettings(settings);
  state.score = 0;
  state.done = 0;
  state.typed = [];
  el("score").textContent = "0";
  el("progress").textContent = "1";
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
    settings.viewSec = clamp(settings.viewSec - 1, 2, 15);
    saveSettings(settings);
    paintSettings();
  });
  el("view-up").addEventListener("click", () => {
    settings.viewSec = clamp(settings.viewSec + 1, 2, 15);
    saveSettings(settings);
    paintSettings();
  });
  el("setup-start").addEventListener("click", startPlay);
  el("remember").addEventListener("click", beginAnswer);
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
