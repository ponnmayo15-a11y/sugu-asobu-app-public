const settings = loadSettings();

const state = {
  phase: "setup",
  practice: false,
  play: { ...settings },
  round: null,
  answers: [],
  index: 0,
  pressedPos: false,
  pressedSound: false,
  scoredOk: 0,
  last: null,
  review: [],
  reviewI: 0,
  timerShow: 0,
  timerTrial: 0,
  timerFlash: 0,
  timerCount: 0,
};

// 画面の部品を取る
function el(id) {
  return document.getElementById(id);
}

// 画面を1つ出す
function showOnly(id) {
  ["setup", "how", "play", "result", "review"].forEach((name) => {
    el(`screen-${name}`).hidden = name !== id;
  });
}

// タイマーを全部止める
function stopTimers() {
  clearTimeout(state.timerShow);
  clearTimeout(state.timerTrial);
  clearTimeout(state.timerFlash);
  clearInterval(state.timerCount);
  state.timerShow = 0;
  state.timerTrial = 0;
  state.timerFlash = 0;
  state.timerCount = 0;
}

// 速さの表示用の文字
function intervalText(ms) {
  const s = ms / 1000;
  return `${s}秒`;
}

// 段階の配列を1つ動かす
function nudgeStep(value, steps, dir) {
  let i = steps.indexOf(value);
  if (i < 0) i = 0;
  return steps[clamp(i + dir, 0, steps.length - 1)];
}

// 日付を 2026-08-31 の形にする
function dateKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${day}`;
}

// Nのボタンを、開いている数だけ置く
function paintNPicks() {
  const box = el("n-picks");
  const store = loadStore();
  const maxN = store.unlockedN;
  box.replaceChildren();
  for (let n = 1; n <= maxN; n += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-ghost pick";
    btn.dataset.n = String(n);
    btn.textContent = String(n);
    if (n === settings.n) btn.classList.add("is-on");
    btn.addEventListener("click", () => {
      settings.n = n;
      saveSettings(settings);
      paintSettings();
    });
    box.append(btn);
  }
}

// 今週やった日を点で出す
function paintWeek() {
  const names = ["日", "月", "火", "水", "木", "金", "土"];
  const days = loadStore().days;
  const box = el("week");
  box.replaceChildren();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const item = document.createElement("span");
    item.textContent = names[d.getDay()];
    const dot = document.createElement("i");
    if (days[dateKey(d)]) dot.className = "is-on";
    item.prepend(dot);
    box.append(item);
  }
}

// 直近の点を棒で出す
function paintHist() {
  const recent = loadStore().recent.slice(-7);
  const box = el("hist");
  box.hidden = recent.length === 0;
  box.replaceChildren();
  recent.forEach((row) => {
    const bar = document.createElement("i");
    bar.style.height = `${Math.max(8, row.percent)}%`;
    bar.title = `${row.percent}%`;
    box.append(bar);
  });
}

// せってい画面の数字とボタンを合わせる
function paintSettings() {
  document.querySelectorAll("[data-dual]").forEach((btn) => {
    const on = btn.dataset.dual === "1";
    btn.classList.toggle("is-on", on === settings.dual);
  });
  el("mode-note").textContent = settings.dual
    ? "マスと音（あ・か・さ…）をべつべつに。ボタンも2つです。"
    : "マスの位置だけ。同じなら「同じ」を押します。";
  paintNPicks();
  el("out-interval").textContent = intervalText(settings.intervalMs);
  el("out-trials").textContent = `${settings.trials}回`;
  const today = loadStore().days[todayKey()] || 0;
  el("today-line").textContent = today ? `今日のいちばん ${today}%` : "";
  paintWeek();
  paintHist();
}

// 3×3のマスを描く。lit が光る番号
function paintGrid(root, lit) {
  root.replaceChildren();
  for (let i = 0; i < POS_COUNT; i += 1) {
    const cell = document.createElement("span");
    cell.className = i === lit ? "cell is-on" : "cell";
    root.append(cell);
  }
}

// 判定の色をマス全体に出す
function flashWrap(ok) {
  const wrap = el("grid-wrap");
  wrap.classList.remove("is-ok", "is-ng");
  wrap.classList.add(ok ? "is-ok" : "is-ng");
  el("judge").textContent = ok ? "せいかい" : el("judge").textContent;
  el("judge").className = ok ? "judge is-ok" : "judge is-ng";
  clearTimeout(state.timerFlash);
  state.timerFlash = setTimeout(() => {
    wrap.classList.remove("is-ok", "is-ng");
  }, 280);
}

// 遊ぶときの上の数字
function paintHud() {
  el("hud-n").textContent = String(state.round.n);
  el("score").textContent = String(state.scoredOk);
  if (state.index < state.round.n) {
    el("progress").textContent = `覚える ${state.index + 1} / ${state.round.n}`;
    return;
  }
  const now = state.index - state.round.n + 1;
  el("progress").textContent = `${now} / ${state.play.trials}`;
}

// 同じボタンの押しやすさを切り替える
function setMatchOn(on) {
  el("btn-pos").disabled = !on;
  el("btn-sound").disabled = !on;
}

// 刺激を消す
function hideStimulus() {
  paintGrid(el("grid"), -1);
  const pill = el("sound-pill");
  if (state.round.dual) {
    pill.hidden = false;
    pill.classList.add("is-empty");
    pill.textContent = "　";
  }
}

// この回の刺激を出す
function showStimulus() {
  const i = state.index;
  const round = state.round;
  paintGrid(el("grid"), round.positions[i]);
  playTick();
  const pill = el("sound-pill");
  if (round.dual) {
    const kana = SOUNDS[round.sounds[i]];
    pill.hidden = false;
    pill.classList.remove("is-empty");
    pill.textContent = kana;
    speakKana(kana);
  } else {
    pill.hidden = true;
  }
}

// 1回分を始める
function beginTrial() {
  stopTimers();
  el("pause").hidden = true;
  el("grid-wrap").classList.remove("is-ok", "is-ng");
  el("btn-pos").className = "match-btn";
  el("btn-sound").className = "match-btn";
  state.pressedPos = false;
  state.pressedSound = false;
  const i = state.index;
  const scoring = i >= state.round.n;
  el("hint").textContent = scoring ? "同じなら押す" : "覚えましょう";
  el("judge").textContent = "";
  el("judge").className = "judge";
  setMatchOn(scoring);
  paintHud();
  showStimulus();
  const wait = state.play.intervalMs;
  state.timerShow = setTimeout(hideStimulus, Math.round(wait * 0.4));
  state.timerTrial = setTimeout(endTrial, wait);
}

// この回の採点をして、つぎへ
function endTrial() {
  stopTimers();
  hideStimulus();
  const i = state.index;
  if (i >= state.round.n) {
    state.answers[i] = { pos: state.pressedPos, sound: state.pressedSound };
    const posMiss = isPosMatch(state.round, i) && !state.pressedPos;
    const soundMiss = isSoundMatch(state.round, i) && !state.pressedSound;
    if (posMiss || soundMiss) {
      el("judge").textContent = "見逃し";
      el("judge").className = "judge is-ng";
      flashWrap(false);
    }
    const trial = scoreRound(state.round, state.answers, i + 1);
    state.scoredOk = trial.correct;
  }
  state.index += 1;
  if (state.index >= state.round.positions.length) {
    fillResult();
    showOnly("result");
    return;
  }
  state.timerTrial = setTimeout(beginTrial, 160);
}

// ばしょ／おとを押したときの共通処理
function pressChannel(which) {
  if (state.phase !== "play") return;
  if (state.index < state.round.n) return;
  const i = state.index;
  if (which === "pos") {
    if (state.pressedPos) return;
    state.pressedPos = true;
    const ok = isPosMatch(state.round, i);
    el("btn-pos").classList.add(ok ? "is-ok" : "is-ng");
    el("judge").textContent = ok ? "せいかい" : "おしい";
    el("judge").className = ok ? "judge is-ok" : "judge is-ng";
    flashWrap(ok);
  } else {
    if (state.pressedSound) return;
    state.pressedSound = true;
    const ok = isSoundMatch(state.round, i);
    el("btn-sound").classList.add(ok ? "is-ok" : "is-ng");
    el("judge").textContent = ok ? "せいかい" : "おしい";
    el("judge").className = ok ? "judge is-ok" : "judge is-ng";
    flashWrap(ok);
  }
  tapBuzz();
}

// 3・2・1のあと、1回めを出す
function beginCountdown() {
  state.phase = "play";
  setMatchOn(false);
  paintGrid(el("grid"), -1);
  el("sound-pill").hidden = !state.round.dual;
  el("hint").textContent = "3";
  el("judge").textContent = "";
  let left = 3;
  stopTimers();
  state.timerCount = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(state.timerCount);
      state.timerCount = 0;
      beginTrial();
      return;
    }
    el("hint").textContent = String(left);
  }, 600);
}

// 遊ぶ画面のボタンを、モードに合わせる
function paintPlayChrome() {
  const dual = state.round.dual;
  el("match-row").classList.toggle("is-dual", dual);
  el("btn-sound").hidden = !dual;
  el("btn-pos").textContent = dual ? "ばしょ" : "同じ";
  el("hud-n").textContent = String(state.round.n);
}

// 今のせっていで遊びはじめる
function startPlay(opts) {
  const opt = opts || {};
  unlockSound();
  stopTimers();
  state.practice = !!opt.practice;
  if (state.practice) {
    state.play = { dual: false, n: 1, intervalMs: 2000, trials: 6 };
  } else {
    if (!opt.keepSettings) saveSettings(settings);
    state.play = { ...settings };
  }
  state.round = opt.round
    ? cloneRound(opt.round)
    : makeRound(state.play.n, state.play.trials, state.play.dual);
  state.answers = [];
  state.index = 0;
  state.scoredOk = 0;
  state.last = null;
  el("pause").hidden = true;
  paintPlayChrome();
  showOnly("play");
  beginCountdown();
}

// 結果の数字とおしい一覧を埋める
function fillResult() {
  state.phase = "result";
  stopTimers();
  const scored = scoreRound(state.round, state.answers, state.index);
  state.last = { round: cloneRound(state.round), scored, settings: { ...state.play } };
  let saved = { best: scored.percent, isNew: false, today: scored.percent };
  if (!state.practice) {
    saved = saveResult(scored.percent, state.play);
  }
  el("result-score").textContent = String(scored.percent);
  el("result-unit").textContent = state.practice
    ? "練習おわり"
    : `${scored.correct} / ${scored.judged} せいかい`;
  const mode = state.play.dual ? "ばしょとおと" : "ばしょだけ";
  el("result-meta").textContent =
    `${mode}・${state.play.n}バック・${intervalText(state.play.intervalMs)}・${state.play.trials}回`;
  if (state.play.dual) {
    const p = countsToScore(scored.pos);
    const s = countsToScore(scored.sound);
    el("result-break").textContent = `ばしょ ${p.percent}%　おと ${s.percent}%`;
  } else {
    el("result-break").textContent = "";
  }
  el("result-best").textContent = String(saved.best);
  el("result-today").textContent = String(saved.today);
  el("result-new").hidden = !saved.isNew;
  const next = suggestN(state.play.n, scored.percent);
  const nextBtn = el("next-n-btn");
  if (state.practice || next === state.play.n) {
    el("next-n").textContent = "";
    nextBtn.hidden = true;
  } else if (next > state.play.n) {
    el("next-n").textContent = `よくできました。つぎは ${next}バックがおすすめです。`;
    nextBtn.hidden = false;
    nextBtn.textContent = `${next}バックでやる`;
    nextBtn.dataset.n = String(next);
  } else {
    el("next-n").textContent = `今度は ${next}バックで、楽にやってみましょう。`;
    nextBtn.hidden = false;
    nextBtn.textContent = `${next}バックでやる`;
    nextBtn.dataset.n = String(next);
  }
  paintMissList(scored);
}

// おしい・見逃しの一覧を書く
function paintMissList(scored) {
  const box = el("miss-list");
  const misses = scored.details.filter((row) => {
    return row.posKind === "false" || row.posKind === "miss" ||
      row.soundKind === "false" || row.soundKind === "miss";
  });
  state.review = misses;
  if (misses.length === 0) {
    box.innerHTML = '<p class="note">おしい・見逃しはありません。</p>';
    return;
  }
  const ol = document.createElement("ol");
  misses.forEach((row) => {
    const no = row.i - state.round.n + 1;
    const bits = [];
    if (row.posKind === "false" || row.posKind === "miss") {
      bits.push(`ばしょ ${kindLabel(row.posKind)}`);
    }
    if (row.soundKind === "false" || row.soundKind === "miss") {
      bits.push(`おと ${kindLabel(row.soundKind)}`);
    }
    const li = document.createElement("li");
    li.textContent = `${no}回め ${bits.join(" / ")}`;
    ol.append(li);
  });
  box.replaceChildren(ol);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-ghost btn-wide";
  btn.textContent = "見返す";
  btn.addEventListener("click", startReview);
  box.append(btn);
}

// 見返しの1枚を出す
function paintReview() {
  const row = state.review[state.reviewI];
  if (!row) return;
  const round = state.last.round;
  paintGrid(el("review-grid"), round.positions[row.i]);
  const no = row.i - round.n + 1;
  el("review-hint").textContent = `${state.reviewI + 1} / ${state.review.length}　${no}回め`;
  const bits = [];
  if (row.posKind === "false" || row.posKind === "miss") {
    bits.push(`ばしょは${isPosMatch(round, row.i) ? "同じ" : "違う"}。${kindLabel(row.posKind)}`);
  }
  if (row.soundKind === "false" || row.soundKind === "miss") {
    bits.push(`おとは${isSoundMatch(round, row.i) ? "同じ" : "違う"}。${kindLabel(row.soundKind)}`);
  }
  el("review-judge").textContent = bits.join("　");
  el("review-judge").className = "judge is-ng";
  el("review-next").textContent = state.reviewI + 1 >= state.review.length ? "結果へ" : "つぎ";
}

// 見返しを始める
function startReview() {
  if (!state.review.length) return;
  state.reviewI = 0;
  state.phase = "review";
  showOnly("review");
  paintReview();
}

// やめて結果を出す。まだ採点していなければせっていへ
function quitPlay() {
  stopTimers();
  el("pause").hidden = true;
  if (state.index <= state.round.n) {
    state.phase = "setup";
    showOnly("setup");
    paintSettings();
    return;
  }
  fillResult();
  showOnly("result");
}

// 別アプリに行ったら止める（速さが狂わないように）
function onHide() {
  if (el("screen-play").hidden) return;
  if (state.phase !== "play") return;
  stopTimers();
  hideStimulus();
  el("pause").hidden = false;
}

// ボタンを結びつける
function bind() {
  document.querySelectorAll("[data-dual]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.dual = btn.dataset.dual === "1";
      saveSettings(settings);
      paintSettings();
    });
  });
  el("interval-down").addEventListener("click", () => {
    settings.intervalMs = nudgeStep(settings.intervalMs, INTERVAL_STEPS, -1);
    saveSettings(settings);
    paintSettings();
  });
  el("interval-up").addEventListener("click", () => {
    settings.intervalMs = nudgeStep(settings.intervalMs, INTERVAL_STEPS, 1);
    saveSettings(settings);
    paintSettings();
  });
  el("trials-down").addEventListener("click", () => {
    settings.trials = nudgeStep(settings.trials, TRIAL_STEPS, -1);
    saveSettings(settings);
    paintSettings();
  });
  el("trials-up").addEventListener("click", () => {
    settings.trials = nudgeStep(settings.trials, TRIAL_STEPS, 1);
    saveSettings(settings);
    paintSettings();
  });
  el("setup-start").addEventListener("click", () => startPlay());
  el("to-how").addEventListener("click", () => {
    showOnly("how");
  });
  el("how-ok").addEventListener("click", () => {
    markSeenHow();
    showOnly("setup");
    paintSettings();
  });
  el("how-practice").addEventListener("click", () => {
    markSeenHow();
    startPlay({ practice: true });
  });
  el("btn-pos").addEventListener("click", () => pressChannel("pos"));
  el("btn-sound").addEventListener("click", () => pressChannel("sound"));
  el("play-quit").addEventListener("click", quitPlay);
  el("resume").addEventListener("click", () => {
    el("pause").hidden = true;
    beginTrial();
  });
  el("again").addEventListener("click", () => startPlay());
  el("same-seq").addEventListener("click", () => {
    if (!state.last) return;
    startPlay({ round: state.last.round, keepSettings: true });
  });
  el("next-n-btn").addEventListener("click", () => {
    settings.n = Number(el("next-n-btn").dataset.n);
    saveSettings(settings);
    startPlay();
  });
  el("to-setup").addEventListener("click", () => {
    showOnly("setup");
    paintSettings();
  });
  el("review-next").addEventListener("click", () => {
    if (state.reviewI + 1 >= state.review.length) {
      showOnly("result");
      return;
    }
    state.reviewI += 1;
    paintReview();
  });
  el("review-back").addEventListener("click", () => showOnly("result"));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) onHide();
  });
}

paintSettings();
bind();
if (!loadStore().seenHow) {
  showOnly("how");
} else {
  showOnly("setup");
}
