const FACE_IMG = {
  look: "img/cpu-face-look.png",
  win: "img/cpu-face-win.png",
  lose: "img/cpu-face-lose.jpg",
};

const CPU_IMG = {
  gu: "img/cpu-gu.jpg",
  choki: "img/cpu-choki.jpg",
  pa: "img/cpu-pa.jpg",
};

const settings = loadSettings();

const state = {
  ended: false,
  locked: false,
  score: 0,
  done: 0,
  misses: [],
  cpu: "",
  endAt: 0,
  handEndAt: 0,
  timerId: 0,
};

// 画面の部品を取る
function el(id) {
  return document.getElementById(id);
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

// 時間の表示文字（20秒〜2分、または無限）
function timeLabel(sec) {
  if (sec === 0) return "無限";
  if (sec < 60) return `${sec}秒`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return `${m}分`;
  return `${m}分${s}秒`;
}

// せっていボタンの点灯を合わせる
function paintSettings() {
  document.querySelectorAll("[data-set]").forEach((box) => {
    const key = box.dataset.set;
    box.querySelectorAll(".pick").forEach((btn) => {
      const same = String(settings[key]) === btn.dataset.value;
      btn.classList.toggle("is-on", same);
    });
  });
  el("out-time").textContent = timeLabel(settings.timeSec);
}

// せっていの1つを覚える
function pickSetting(key, value) {
  settings[key] = value;
  saveSettings(settings);
  paintSettings();
}

// 時間を10秒ずつ動かす。2分のつぎは無限
function nudgeTime(dir) {
  const now = settings.timeSec;
  if (dir > 0) {
    if (now === 0) return;
    settings.timeSec = now >= TIME_MAX ? 0 : now + TIME_STEP;
  } else if (now === 0) {
    settings.timeSec = TIME_MAX;
  } else if (now > TIME_MIN) {
    settings.timeSec = now - TIME_STEP;
  }
  saveSettings(settings);
  paintSettings();
}

// のこり秒を 2:00 の形にする
function clockText(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// 上の数字を今の状態に合わせる
function paintHud() {
  if (settings.timeSec === 0) {
    el("time-left").textContent = "無限";
  } else {
    el("time-left").textContent = clockText(state.endAt - Date.now());
  }
  el("score").textContent = String(state.score);
  el("progress").textContent = String(state.done);
}

// 相手の顔を、じろっと／にやり／くやしい にする
function setFace(kind) {
  el("cpu-face").src = FACE_IMG[kind];
}

// 自分の手ボタンの並びを、設定どおりにする
function lineUpHands() {
  const box = el("hands");
  const buttons = Array.from(box.querySelectorAll(".hand-btn"));
  if (settings.shuffle === "on") {
    for (let i = buttons.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = buttons[i];
      buttons[i] = buttons[j];
      buttons[j] = tmp;
    }
  } else {
    const order = { gu: 0, choki: 1, pa: 2 };
    buttons.sort((a, b) => order[a.dataset.hand] - order[b.dataset.hand]);
  }
  buttons.forEach((btn) => box.append(btn));
}

// 相手の手を出す
function putCpu() {
  state.cpu = nextCpu(state.cpu);
  const pic = el("cpu-hand");
  pic.src = CPU_IMG[state.cpu];
  pic.alt = HAND_NAME[state.cpu];
  setFace("look");
  el("judge").textContent = "";
  el("judge").className = "judge";
  el("hands").querySelectorAll(".hand-btn").forEach((btn) => {
    btn.className = "hand-btn";
    btn.disabled = false;
  });
  lineUpHands();
  state.locked = false;
  state.handEndAt = Date.now() + SPEED_MS[settings.speed];
  el("hand-bar").style.width = "100%";
}

// のこり時間を更新する
function tick() {
  paintHud();
  const handLeft = Math.max(0, state.handEndAt - Date.now());
  const limit = SPEED_MS[settings.speed];
  el("hand-bar").style.width = `${(handLeft / limit) * 100}%`;
  if (settings.timeSec > 0 && Date.now() >= state.endAt) {
    finish();
    return;
  }
  if (!state.locked && handLeft <= 0) onTimeout();
}

// 時間内に出せなかったとき
function onTimeout() {
  if (state.ended || state.locked) return;
  state.locked = true;
  state.done += 1;
  state.misses.push({ cpu: state.cpu, player: "", reason: "時間切れ" });
  el("judge").textContent = "不正解。時間切れ";
  el("judge").className = "judge is-ng";
  setFace("win");
  waitThen(900, afterJudge);
}

// せいかい／おしいを見せる
function paintJudge(ok, player) {
  el("hands").querySelectorAll(".hand-btn").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.hand === player) {
      btn.classList.add(ok ? "is-ok" : "is-ng");
    }
    if (!ok && btn.dataset.hand === neededHand(state.cpu, settings.goal)) {
      btn.classList.add("is-right");
    }
  });
  if (ok) {
    el("judge").textContent = "正解";
    el("judge").className = "judge is-ok";
    setFace("lose");
    return;
  }
  const right = HAND_NAME[neededHand(state.cpu, settings.goal)];
  el("judge").textContent = `不正解。正解は ${right}`;
  el("judge").className = "judge is-ng";
  setFace("win");
}

// 判定のあと、次の手へ進む
function afterJudge() {
  if (state.ended) return;
  if (settings.timeSec > 0 && Date.now() >= state.endAt) {
    finish();
    return;
  }
  putCpu();
}

// グー・チョキ・パーを押したとき
function onHand(player) {
  if (state.ended || state.locked) return;
  state.locked = true;
  state.done += 1;
  const ok = isCorrect(state.cpu, player, settings.goal);
  paintJudge(ok, player);
  if (ok) {
    state.score += 1;
    paintHud();
    waitThen(320, afterJudge);
    return;
  }
  state.misses.push({ cpu: state.cpu, player, reason: "間違い" });
  waitThen(1100, afterJudge);
}

// まちがえた手の一覧を書く
function fillMisses() {
  const box = el("miss-list");
  box.replaceChildren();
  if (state.misses.length === 0) {
    const p = document.createElement("p");
    p.className = "note";
    p.textContent = "間違いはありません。";
    box.append(p);
    return;
  }
  const ol = document.createElement("ol");
  state.misses.forEach((m) => {
    const li = document.createElement("li");
    const you = m.player ? HAND_NAME[m.player] : m.reason;
    const right = HAND_NAME[neededHand(m.cpu, settings.goal)];
    li.textContent = `相手 ${HAND_NAME[m.cpu]} → ${right}（あなた ${you}）`;
    ol.append(li);
  });
  box.append(ol);
}

// 結果の数字を埋める
function fillResult(saved) {
  el("result-score").textContent = String(state.score);
  el("result-unit").textContent = `${state.done}問中 正解`;
  el("result-best").textContent = String(saved.best);
  el("result-new").hidden = !saved.isNew;
  el("result-meta").textContent =
    `${GOAL_NAME[settings.goal]}・${SPEED_NAME[settings.speed]}・${timeLabel(settings.timeSec)}・並び${settings.shuffle === "on" ? "有り" : "無し"}`;
  fillMisses();
}

// じかんぎれ、または「おわり」のとき
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
  state.ended = false;
  state.locked = false;
  state.score = 0;
  state.done = 0;
  state.misses = [];
  state.cpu = "";
  if (state.timerId) clearInterval(state.timerId);
  el("goal-now").textContent = GOAL_NAME[settings.goal];
  if (settings.timeSec > 0) {
    state.endAt = Date.now() + settings.timeSec * 1000;
  } else {
    state.endAt = 0;
  }
  paintHud();
  showPlay();
  putCpu();
  state.timerId = setInterval(tick, 100);
}

// ボタンを結びつける
function bind() {
  document.querySelectorAll("[data-set]").forEach((box) => {
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".pick");
      if (!btn) return;
      pickSetting(box.dataset.set, btn.dataset.value);
    });
  });
  el("hands").addEventListener("click", (e) => {
    const btn = e.target.closest(".hand-btn");
    if (!btn) return;
    onHand(btn.dataset.hand);
  });
  el("time-minus").addEventListener("click", () => nudgeTime(-1));
  el("time-plus").addEventListener("click", () => nudgeTime(1));
  el("setup-start").addEventListener("click", startPlay);
  el("again").addEventListener("click", startPlay);
  el("to-setup").addEventListener("click", showSetup);
  el("play-quit").addEventListener("click", finish);
}

paintSettings();
bind();
showSetup();
