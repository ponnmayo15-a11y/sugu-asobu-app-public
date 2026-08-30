const OK_WAIT = 320;
const NG_WAIT = 1100;
const TIME_STEP = 10;
const GOAL_STEP = 5;

const settings = loadSettings();

const state = {
  started: false,
  ended: false,
  locked: false,
  score: 0,
  streak: 0,
  level: 0,
  done: 0,
  endAt: 0,
  current: null,
  misses: [],
  timerId: 0,
};

// 画面の部品を取る
function el(id) {
  return document.getElementById(id);
}

// 連続正解から、2行のときの数の大きさを決める
function levelFromStreak(streak) {
  if (streak >= 5) return 2;
  if (streak >= 3) return 1;
  return 0;
}

// 指定ミリ秒あとで動かす
function waitThen(ms, fn) {
  setTimeout(fn, ms);
}

// せってい画面を出す
function showSetup() {
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
  el("screen-setup").hidden = true;
  el("screen-play").hidden = true;
  el("screen-result").hidden = false;
}

// せっていの数字を画面に合わせる
function paintSettings() {
  el("out-time").textContent = `${settings.timeSec}秒`;
  el("out-rows").textContent = `${settings.rows}行`;
  el("out-goal").textContent = `${settings.goal}問`;
  document.querySelectorAll("[data-op]").forEach((btn) => {
    btn.classList.toggle("is-on", settings.ops.includes(btn.dataset.op));
  });
}

// 計算の種類をオンオフする。最後の1つは消さない
function toggleOp(kind) {
  const on = settings.ops.includes(kind);
  if (on && settings.ops.length === 1) return;
  settings.ops = on
    ? settings.ops.filter((k) => k !== kind)
    : ["add", "sub", "mul"].filter((k) => settings.ops.includes(k) || k === kind);
  saveSettings(settings);
  paintSettings();
}

// せっていの＋−を1段動かす
function nudge(key, dir, step, min, max) {
  settings[key] = clamp(settings[key] + dir * step, min, max);
  saveSettings(settings);
  paintSettings();
}

// 1つの数を、桁ごとのマスにする
function digitCells(n, width) {
  const box = document.createElement("span");
  box.className = "digits";
  String(n)
    .padStart(width, " ")
    .split("")
    .forEach((ch) => {
      const d = document.createElement("span");
      d.textContent = ch === " " ? "" : ch;
      box.append(d);
    });
  return box;
}

// ひっ算の形で式を出す
function renderExpr(q) {
  const box = el("expr-rows");
  box.replaceChildren();
  const width = Math.max(...q.nums.map((n) => String(n).length));
  q.nums.forEach((n, i) => {
    const row = document.createElement("p");
    row.className = "expr-row";
    const op = document.createElement("span");
    op.className = "op";
    op.textContent = i === q.nums.length - 1 ? q.op : "";
    row.append(op, digitCells(n, width));
    box.append(row);
  });
  const bar = document.createElement("div");
  bar.className = "hissan-bar";
  bar.setAttribute("aria-hidden", "true");
  box.append(bar);
}

// 今の式と4択を画面に出す
function putQuestion() {
  state.current = nextQuestion(settings.rows, state.level, settings.ops);
  el("expr-rows").className = `expr-rows rows-${state.current.nums.length}`;
  renderExpr(state.current);
  el("progress").textContent = `${state.done + 1} / ${settings.goal}`;
  el("choices").querySelectorAll(".choice").forEach((btn, i) => {
    btn.textContent = String(state.current.choices[i]);
    btn.className = "choice";
    btn.disabled = false;
  });
  state.locked = false;
}

// のこり時間のカウントを始める
function beginTimer() {
  state.started = true;
  state.endAt = Date.now() + settings.timeSec * 1000;
  state.timerId = setInterval(tick, 100);
}

// のこり時間を更新する。0になったら終わる
function tick() {
  const limit = settings.timeSec * 1000;
  const left = Math.max(0, state.endAt - Date.now());
  el("time-left").textContent = String(Math.ceil(left / 1000));
  el("time-bar").style.width = `${(left / limit) * 100}%`;
  if (left <= 0) finish();
}

// せいかい／おしいを、ボタンと文字で見せる
function paintJudge(ok, index) {
  const buttons = el("choices").querySelectorAll(".choice");
  buttons.forEach((btn) => {
    btn.disabled = true;
  });
  if (ok) {
    buttons[index].classList.add("is-ok");
    el("judge").textContent = "せいかい";
    el("judge").className = "judge is-ok";
    return;
  }
  buttons[index].classList.add("is-ng");
  const right = state.current.choices.indexOf(state.current.answer);
  if (right >= 0) buttons[right].classList.add("is-right");
  el("judge").textContent = `おしい。こたえは ${state.current.answer}`;
  el("judge").className = "judge is-ng";
}

// 判定のあと、次の問題へ進む。問題数に達したら終わる
function afterJudge() {
  if (state.ended) return;
  el("judge").textContent = "";
  el("judge").className = "judge";
  if (state.done >= settings.goal) {
    finish();
    return;
  }
  putQuestion();
}

// 4択の1つを押したときの処理
function onChoice(index) {
  if (state.ended || state.locked) return;
  const picked = state.current.choices[index];
  state.locked = true;
  state.done += 1;
  const ok = picked === state.current.answer;
  paintJudge(ok, index);
  if (ok) {
    state.score += 1;
    state.streak += 1;
    state.level = levelFromStreak(state.streak);
    el("score").textContent = String(state.score);
    waitThen(OK_WAIT, afterJudge);
    return;
  }
  state.streak = 0;
  state.level = Math.max(0, state.level - 1);
  state.misses.push({
    text: state.current.text,
    answer: state.current.answer,
    picked,
  });
  waitThen(NG_WAIT, afterJudge);
}

// まちがえた問題の一覧を書く
function fillMisses() {
  const box = el("miss-list");
  box.replaceChildren();
  if (state.misses.length === 0) {
    const p = document.createElement("p");
    p.className = "note";
    p.textContent = "まちがいは ありません。";
    box.append(p);
    return;
  }
  const ol = document.createElement("ol");
  state.misses.forEach((m) => {
    const li = document.createElement("li");
    li.textContent = `${m.text} = ${m.answer}（あなた ${m.picked}）`;
    ol.append(li);
  });
  box.append(ol);
}

// 結果の数字と自己ベストを埋める
function fillResult(saved) {
  el("result-score").textContent = String(state.score);
  el("result-unit").textContent = `${settings.goal}もんちゅう せいかい`;
  el("result-best").textContent = String(saved.best);
  el("result-new").hidden = !saved.isNew;
  const opsText = settings.ops.map((k) => OP_LABEL[k]).join("・");
  el("result-meta").textContent =
    `${opsText}・${settings.timeSec}秒・${settings.rows}行・${settings.goal}問`;
  fillMisses();
}

// 時間切れ、または問題数に達したときの処理
function finish() {
  if (state.ended) return;
  state.ended = true;
  state.locked = true;
  if (state.timerId) clearInterval(state.timerId);
  fillResult(saveBest(state.score, settings));
  showResult();
}

// 今のせっていで遊びはじめる
function startPlay() {
  state.started = false;
  state.ended = false;
  state.locked = false;
  state.score = 0;
  state.streak = 0;
  state.level = 0;
  state.done = 0;
  state.endAt = 0;
  state.misses = [];
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = 0;
  el("time-left").textContent = String(settings.timeSec);
  el("score").textContent = "0";
  el("progress").textContent = `1 / ${settings.goal}`;
  el("time-bar").style.width = "100%";
  el("hint").textContent = "こたえをえらんでね";
  el("judge").textContent = "";
  el("judge").className = "judge";
  showPlay();
  putQuestion();
  beginTimer();
}

// ボタンを結びつける
function bind() {
  el("choices").addEventListener("click", (e) => {
    const btn = e.target.closest(".choice");
    if (!btn) return;
    onChoice(Number(btn.dataset.i));
  });
  document.querySelectorAll("[data-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.set;
      const dir = Number(btn.dataset.dir);
      if (key === "timeSec") nudge(key, dir, TIME_STEP, 10, 90);
      if (key === "rows") nudge(key, dir, 1, 2, 7);
      if (key === "goal") nudge(key, dir, GOAL_STEP, 5, 30);
    });
  });
  document.querySelectorAll("[data-op]").forEach((btn) => {
    btn.addEventListener("click", () => toggleOp(btn.dataset.op));
  });
  el("setup-start").addEventListener("click", startPlay);
  el("again").addEventListener("click", startPlay);
  el("to-setup").addEventListener("click", showSetup);
  el("play-quit").addEventListener("click", () => {
    if (state.timerId) clearInterval(state.timerId);
    state.ended = true;
    showSetup();
  });
}

paintSettings();
bind();
showSetup();
