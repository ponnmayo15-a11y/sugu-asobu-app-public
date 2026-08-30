const JANKEN_KEY = "sugu-asobu-ato-janken-v1";

const DEFAULT_SETTINGS = { goal: "aiko", speed: "walk", timeMin: 2 };

const GOALS = ["aiko", "kachi", "make"];
const SPEEDS = ["walk", "bike", "car"];
const TIMES = [2, 4, 0];

// 空の保存データをつくる
function emptyJanken() {
  return { best: {}, settings: { ...DEFAULT_SETTINGS } };
}

// せっていを、使える値だけにする
function cleanSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    goal: GOALS.includes(s.goal) ? s.goal : "aiko",
    speed: SPEEDS.includes(s.speed) ? s.speed : "walk",
    timeMin: TIMES.includes(Number(s.timeMin)) ? Number(s.timeMin) : 2,
  };
}

// この端末の記録を読む
function loadJanken() {
  try {
    const raw = localStorage.getItem(JANKEN_KEY);
    if (!raw) return emptyJanken();
    const data = JSON.parse(raw);
    const best = data.best && typeof data.best === "object" ? data.best : {};
    return { best, settings: cleanSettings(data.settings) };
  } catch {
    return emptyJanken();
  }
}

// 記録を書く
function saveJanken(data) {
  localStorage.setItem(JANKEN_KEY, JSON.stringify(data));
}

// 今のせっていを出す
function loadSettings() {
  return cleanSettings(loadJanken().settings);
}

// せっていを覚える
function saveSettings(settings) {
  const data = loadJanken();
  data.settings = cleanSettings(settings);
  saveJanken(data);
  return data.settings;
}

// 同じせっていのいちばんを比べるための名前
function settingsKey(settings) {
  const s = cleanSettings(settings);
  return `${s.goal}-${s.speed}-${s.timeMin}`;
}

// 今回の点数がいちばんなら更新する
function saveBest(score, settings) {
  const data = loadJanken();
  const key = settingsKey(settings);
  const prev = Number(data.best[key]) || 0;
  const next = Math.max(prev, score);
  data.best[key] = next;
  saveJanken(data);
  return { best: next, isNew: score > prev };
}
