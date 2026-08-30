const state = {
  name: "",
  mode: "practice",
  settings: quickSettings(),
  numbers: [],
  answer: "0",
  runner: null,
  last: null,
  exam: null,
  survival: null,
  replay: { i: 0, total: 0, auto: false },
  pendingChallenge: null,
};

// 衝動ですぐ遊べる初期設定
function quickSettings() {
  return {
    count: 5,
    digits: 1,
    timing: "interval",
    intervalMs: 1000,
    totalMs: 5000,
    minus: false,
    comma: false,
  };
}

const $ = (id) => document.getElementById(id);

// 画面を1つだけ出す
function show(id) {
  document.querySelectorAll(".screen").forEach((el) => {
    el.hidden = el.id !== id;
  });
}

// 起動。名前と挑戦状を見る
function boot() {
  bind();
  renderLevels();
  renderKeypad();
  const names = listNames();
  $("name-list").textContent = names.length ? `前の名前: ${names.join("、")}` : "";
  const challenge = readChallenge();
  state.name = getCurrentName();
  if (challenge) {
    state.pendingChallenge = challenge;
    if (!state.name) show("screen-name");
    else openChallenge(challenge);
    return;
  }
  if (!state.name) show("screen-name");
  else openMenu();
}

// ハッシュから挑戦状を読む
function readChallenge() {
  const raw = location.hash.startsWith("#c=") ? location.hash.slice(3) : "";
  if (!raw) return null;
  return decodeChallenge(raw);
}

// ボタンを全部つなぐ
function bind() {
  $("name-go").onclick = () => enterName($("name-input").value);
  $("name-guest").onclick = () => enterName("ゲスト");
  $("go-quick").onclick = () => startPlay("practice", quickSettings());
  $("go-practice").onclick = () => openPractice();
  $("go-exam").onclick = () => show("screen-exam");
  $("go-survival").onclick = () => show("screen-survival");
  $("go-records").onclick = () => openRecords();
  $("practice-back").onclick = () => openMenu();
  $("exam-back").onclick = () => openMenu();
  $("survival-back").onclick = () => openMenu();
  $("records-back").onclick = () => openMenu();
  $("practice-start").onclick = () => startPlay("practice", { ...state.settings });
  $("survival-start").onclick = () => startSurvival();
  $("challenge-start").onclick = () => startChallenge();
  $("challenge-back").onclick = () => {
    history.replaceState(null, "", location.pathname);
    openMenu();
  };
  bindSettings();
  bindResult();
  $("flash-quit").onclick = () => quitPlay();
  $("answer-quit").onclick = () => quitPlay();
  $("replay-quit").onclick = () => show("screen-result");
  $("replay-next").onclick = () => stepReplay();
  $("replay-auto").onclick = () => autoReplay();
  $("records-weak-play").onclick = () => playWeak();
}

// 練習の数値ボタンをつなぐ
function bindSettings() {
  document.querySelectorAll("[data-step]").forEach((btn) => {
    btn.onclick = () => stepSetting(btn.dataset.step, Number(btn.dataset.dir));
  });
  document.querySelectorAll("[data-timing]").forEach((btn) => {
    btn.onclick = () => setTiming(btn.dataset.timing);
  });
  $("tog-minus").onclick = () => {
    state.settings.minus = !state.settings.minus;
    paintSettings();
  };
  $("tog-comma").onclick = () => {
    state.settings.comma = !state.settings.comma;
    paintSettings();
  };
}

// 結果画面のボタンをつなぐ
function bindResult() {
  $("res-same").onclick = () => replaySame();
  $("res-again").onclick = () => replayFresh();
  $("res-weak").onclick = () => playWeak();
  $("res-replay").onclick = () => openReplay();
  $("res-share").onclick = () => doShare();
  $("res-link").onclick = () => copyChallenge();
  $("res-menu").onclick = () => openMenu();
}

// 名前を入れてメニューへ
function enterName(name) {
  const saved = setCurrentName(name || "ゲスト");
  if (!saved) {
    toast("名前を入れてください");
    return;
  }
  state.name = saved;
  if (state.pendingChallenge) {
    openChallenge(state.pendingChallenge);
    return;
  }
  openMenu();
}

// メニューを出す
function openMenu() {
  $("who-line").textContent = `${state.name} で記録します`;
  $("name-list").textContent = listNames().length
    ? `前の名前: ${listNames().join("、")}`
    : "";
  show("screen-menu");
}

// 挑戦状の説明を出す
function openChallenge(decoded) {
  state.settings = { ...decoded.settings };
  state.numbers = decoded.numbers.slice();
  const s = decoded.settings;
  $("challenge-lead").textContent = `${s.count}口 ${s.digits}桁。同じ数字です。`;
  show("screen-challenge");
}

// 挑戦状を開始する
function startChallenge() {
  startPlay("challenge", state.settings, state.numbers.slice());
}

// 練習画面を出す
function openPractice() {
  paintSettings();
  show("screen-practice");
}

// 設定の数字を1段階動かす
function stepSetting(key, dir) {
  const s = state.settings;
  if (key === "count") s.count = clamp(s.count + dir, 3, 100);
  if (key === "digits") s.digits = clamp(s.digits + dir, 1, 5);
  if (key === "intervalMs") s.intervalMs = clamp(s.intervalMs + dir * 100, 100, 3000);
  if (key === "totalMs") {
    const min = Math.round(s.count * 100);
    const max = Math.round(s.count * 1000);
    s.totalMs = clamp(s.totalMs + dir * 100, min, max);
  }
  paintSettings();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// 間隔と合計秒を切り替える
function setTiming(mode) {
  state.settings.timing = mode;
  paintSettings();
}

// 練習設定の表示を更新する
function paintSettings() {
  const s = state.settings;
  $("out-count").textContent = String(s.count);
  $("out-digits").textContent = String(s.digits);
  $("out-interval").textContent = String(s.intervalMs);
  $("out-total").textContent = `${(s.totalMs / 1000).toFixed(1)}秒`;
  $("field-interval").hidden = s.timing !== "interval";
  $("field-total").hidden = s.timing !== "total";
  document.querySelectorAll("[data-timing]").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.timing === s.timing);
  });
  $("tog-minus").textContent = s.minus ? "マイナス あり" : "マイナス なし";
  $("tog-comma").textContent = s.comma ? "カンマ あり" : "カンマ なし";
}

// 検定の級一覧を描く
function renderLevels() {
  $("level-list").innerHTML = EXAM_LEVELS.map((lv) => {
    return `<button type="button" class="level-btn" data-level="${lv.id}">
      <span>${lv.name}</span>
      <small>参考 ${lv.digits}桁 ${lv.count}口 ${lv.totalSec}秒</small>
    </button>`;
  }).join("");
  $("level-list").onclick = (ev) => {
    const btn = ev.target.closest("[data-level]");
    if (btn) startExam(btn.dataset.level);
  };
}

// テンキーを描く
function renderKeypad() {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "−", "0", "⌫"];
  $("keypad").innerHTML = keys
    .map((k) => `<button type="button" class="key" data-key="${k}">${k}</button>`)
    .join("") + '<button type="button" class="key key-ok" data-key="ok">けってい</button>';
  $("keypad").onclick = (ev) => {
    const btn = ev.target.closest("[data-key]");
    if (btn) tapKey(btn.dataset.key);
  };
}

// 1問を開始する
function startPlay(mode, settings, numbers) {
  state.mode = mode;
  state.settings = { ...settings };
  state.numbers = numbers ? numbers.slice() : makeNumbers(settings);
  state.answer = "0";
  runFlash();
}

// 検定を開始する
function startExam(levelId) {
  const level = EXAM_LEVELS.find((x) => x.id === levelId);
  state.exam = { level, index: 0, results: [] };
  startPlay("exam", settingsFromLevel(level));
}

// 競技を開始する
function startSurvival() {
  state.survival = { index: 1, cleared: 0 };
  startPlay("survival", survivalSpec(1));
}

// 数字の点滅を流す
function runFlash() {
  if (state.runner) state.runner.stop();
  $("flash-num").textContent = "GO";
  $("flash-progress").textContent = progressLabel();
  show("screen-flash");
  const ms = intervalMsOf(state.settings);
  state.runner = playFlash(state.numbers, ms, {
    onReady() {},
    onShow(n) {
      $("flash-num").textContent = formatNumber(n, state.settings.comma);
    },
    onBlank() {
      $("flash-num").textContent = "";
    },
    onDone() {
      state.runner = null;
      openAnswer();
    },
  });
}

// 何問目かを出す
function progressLabel() {
  if (state.mode === "exam" && state.exam) {
    return `${state.exam.index + 1} / ${EXAM_QUESTION_COUNT}`;
  }
  if (state.mode === "survival" && state.survival) {
    return `${state.survival.index}問目`;
  }
  return "";
}

// 答え入力を出す
function openAnswer() {
  state.answer = "0";
  paintAnswer();
  show("screen-answer");
}

// テンキー1つを処理する
function tapKey(key) {
  if (key === "ok") {
    finishAnswer();
    return;
  }
  if (key === "⌫") {
    state.answer = state.answer.length <= 1 ? "0" : state.answer.slice(0, -1);
    if (state.answer === "-") state.answer = "0";
    paintAnswer();
    return;
  }
  if (key === "−") {
    if (state.answer === "0") state.answer = "-";
    else if (state.answer.startsWith("-")) state.answer = state.answer.slice(1) || "0";
    else state.answer = `-${state.answer}`;
    paintAnswer();
    return;
  }
  if (state.answer === "0" || state.answer === "-0") state.answer = key;
  else if (state.answer === "-") state.answer = `-${key}`;
  else if (state.answer.length < 10) state.answer += key;
  paintAnswer();
}

function paintAnswer() {
  $("answer-display").textContent = state.answer;
}

// 答えを採点する
function finishAnswer() {
  const answer = Number(state.answer);
  if (!Number.isFinite(answer)) {
    toast("数字を入れてください");
    return;
  }
  const sum = sumNumbers(state.numbers);
  const correct = answer === sum;
  const play = {
    settings: { ...state.settings },
    numbers: state.numbers.slice(),
    answer,
    sum,
    correct,
    at: Date.now(),
  };
  saveOne(play);
  if (state.mode === "exam") {
    nextExam(play);
    return;
  }
  if (state.mode === "survival") {
    nextSurvival(play);
    return;
  }
  showResult(play);
}

// 1問を保存する
function saveOne(play) {
  recordPlay(state.name, play);
  addWeakness(state.name, play.settings, play.correct);
}

// 検定の次の問へ進む
async function nextExam(play) {
  state.exam.results.push(play);
  $("flash-num").textContent = play.correct ? "○" : "×";
  show("screen-flash");
  await wait(700);
  if (state.exam.results.length >= EXAM_QUESTION_COUNT) {
    finishExam();
    return;
  }
  state.exam.index += 1;
  startPlay("exam", settingsFromLevel(state.exam.level));
}

// 検定の合否を出す
function finishExam() {
  const ok = state.exam.results.filter((x) => x.correct).length;
  const passed = ok >= EXAM_PASS;
  recordExam(state.name, {
    levelId: state.exam.level.id,
    name: state.exam.level.name,
    ok,
    passed,
    at: Date.now(),
  });
  const last = state.exam.results[state.exam.results.length - 1];
  last.examScore = `${ok} / ${EXAM_QUESTION_COUNT}`;
  last.examPassed = passed;
  last.examName = state.exam.level.name;
  showResult(last);
}

// 競技の次、または脱落
async function nextSurvival(play) {
  if (play.correct) {
    $("flash-num").textContent = "○";
    show("screen-flash");
    await wait(500);
    state.survival.cleared += 1;
    state.survival.index += 1;
    startPlay("survival", survivalSpec(state.survival.index));
    return;
  }
  const fallOn = state.survival.index;
  const cleared = state.survival.cleared;
  recordSurvival(state.name, fallOn, cleared);
  play.survivalFall = fallOn;
  play.survivalCleared = cleared;
  showResult(play);
}

// 結果カードを出す
function showResult(play) {
  state.last = play;
  $("result-mark").textContent = resultTitle(play);
  $("result-mark").className = `result-mark ${play.correct ? "is-ok" : "is-ng"}`;
  const spec = $("result-spectator");
  if (play.survivalFall) {
    spec.hidden = false;
    spec.textContent = `${play.survivalFall}問目で落ちた（${play.survivalCleared}問クリア）`;
  } else {
    spec.hidden = true;
  }
  $("result-answers").textContent = `あなたの答え ${play.answer}　せいかい ${play.sum}`;
  $("result-break").innerHTML = breakdownHtml(play);
  show("screen-result");
}

function resultTitle(play) {
  if (play.examScore) {
    return play.examPassed ? `合格 ${play.examScore}` : `おしい ${play.examScore}`;
  }
  return play.correct ? "せいかい" : "おしい";
}

// 採点の内訳HTML
function breakdownHtml(play) {
  const items = play.numbers
    .map((n) => `<li><span></span><span>${formatNumber(n, play.settings.comma)}</span></li>`)
    .join("");
  return `${items}<li class="sum"><span>合計</span><span>${play.sum}</span></li>`;
}

// 同じ問題をもう一度
function replaySame() {
  if (!state.last) return;
  const mode = state.mode === "challenge" ? "challenge" : "practice";
  startPlay(mode, state.last.settings, state.last.numbers);
}

// 同じ設定で新しい問題
function replayFresh() {
  if (state.mode === "survival") {
    startSurvival();
    return;
  }
  if (state.mode === "exam" && state.exam) {
    startExam(state.exam.level.id);
    return;
  }
  startPlay(state.mode === "challenge" ? "practice" : state.mode, state.settings);
}

// 弱点に近い問題を出す
function playWeak() {
  const spot = worstSpot(state.name);
  const base = state.last ? state.last.settings : quickSettings();
  startPlay("practice", similarSettings(base, spot));
}

// クラッシュ再生を開く
function openReplay() {
  if (!state.last) return;
  state.replay = { i: 0, total: 0, auto: false };
  $("replay-num").textContent = "ここから";
  $("replay-meta").textContent = "すすむ、で1つずつ見ます";
  show("screen-replay");
}

// 再生を1口進める
function stepReplay() {
  const play = state.last;
  if (!play || state.replay.i >= play.numbers.length) {
    $("replay-num").textContent = String(play ? play.sum : "");
    $("replay-meta").textContent = "おわり。正しい合計です。";
    return;
  }
  const n = play.numbers[state.replay.i];
  const before = state.replay.total;
  state.replay.total += n;
  $("replay-num").textContent = formatNumber(n, play.settings.comma);
  const carry = hadCarry(before, n);
  $("replay-meta").innerHTML = `いまの合計 ${state.replay.total}${
    carry ? '<br><span class="carry-tag">ここで崩れやすい</span>' : ""
  }`;
  state.replay.i += 1;
}

// ゆっくり自動再生する
async function autoReplay() {
  state.replay = { i: 0, total: 0, auto: true };
  while (state.replay.auto && state.last && state.replay.i < state.last.numbers.length) {
    stepReplay();
    await wait(900);
  }
  if (state.replay.auto) stepReplay();
}

// 結果を1タップ共有
async function doShare() {
  if (!state.last) return;
  const url = challengeUrl();
  const status = await shareCardImage({ ...state.last }, url);
  if (status === "copied") toast("コピーしました");
  if (status === "prompt") toast("文字をコピーしてください");
}

// 挑戦状リンクをコピー
async function copyChallenge() {
  const url = challengeUrl();
  const status = await copyText(`${resultText(state.last)}\n${url}`);
  toast(status === "copied" ? "挑戦状をコピーしました" : "このリンクを送ってください");
}

// 今の問題の挑戦状URL
function challengeUrl() {
  const play = state.last;
  if (!play) return location.href.split("#")[0];
  const code = encodeChallenge(packProblem(play.settings, play.numbers));
  return `${location.href.split("#")[0]}#c=${code}`;
}

// 途中でやめてメニューへ
function quitPlay() {
  if (state.runner) state.runner.stop();
  state.runner = null;
  state.replay.auto = false;
  openMenu();
}

// 記録と弱点を出す
function openRecords() {
  const p = getPlayer(state.name);
  const weak = weaknessRows(state.name);
  const exams = p.exams.filter((x) => x.passed).map((x) => x.name);
  const unique = [...new Set(exams)];
  $("records-box").innerHTML = `
    <div class="record-box">
      <strong>${state.name}</strong>
      <p>競技の最高: ${p.survivalBest}問クリア</p>
      <p>最近落ちた問: ${p.survivalFalls.slice(0, 5).join("、") || "まだない"}</p>
      <p>検定（参考）合格: ${unique.join("、") || "まだない"}</p>
    </div>
    ${weakHtml(weak)}
  `;
  show("screen-records");
}

// 弱点マップのHTML
function weakHtml(rows) {
  if (!rows.length) return "<p>まだデータなし。何問かやると出ます。</p>";
  return rows
    .map((r) => {
      const pct = Math.round(r.rate * 100);
      return `<div><strong>${r.label}</strong> まちがい ${pct}%（${r.ng}/${r.ok + r.ng}）
        <div class="weak-bar"><span style="width:${pct}%"></span></div></div>`;
    })
    .join("");
}

// 短い知らせを出す
function toast(text) {
  document.querySelectorAll(".toast").forEach((el) => el.remove());
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

boot();
