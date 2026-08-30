const JANKEN_KEY = "sugu-asobu-ato-janken-v1";

const DEFAULT_SETTINGS = {
  goal: "aiko",
  speed: "normal",
  timeSec: 60,
  shuffle: "off",
};

const GOALS = ["aiko", "kachi", "make"];
const SPEEDS = ["turbo", "fast", "normal", "slow"];
const OLD_SPEED = { walk: "slow", bike: "normal", car: "fast" };
const TIME_MIN = 20;
const TIME_MAX = 120;
const TIME_STEP = 10;

// 数を最小と最大のあいだに収める
function clamp(n, min, max) {
  const x = Math.round(n);
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

// はやさの古い名前を、新しい名前にする
function cleanSpeed(value) {
  if (SPEEDS.includes(value)) return value;
  if (OLD_SPEED[value]) return OLD_SPEED[value];
  return "normal";
}

// 時間を20秒〜2分（10秒刻み）か無限（0）にする。古い「分」指定も読み替える
function cleanTime(raw) {
  if (Number(raw.timeSec) === 0) return 0;
  if (raw.timeSec != null && raw.timeSec !== "") {
    const n = Number(raw.timeSec);
    if (Number.isFinite(n) && n > 0) {
      return clamp(Math.round(n / TIME_STEP) * TIME_STEP, TIME_MIN, TIME_MAX);
    }
  }
  const min = Number(raw.timeMin);
  if (min === 0) return 0;
  if (min === 2 || min === 4) return 120;
  return 60;
}

// 空の保存データをつくる
function emptyJanken() {
  return { best: {}, settings: { ...DEFAULT_SETTINGS } };
}

// せっていを、使える値だけにする
function cleanSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    goal: GOALS.includes(s.goal) ? s.goal : "aiko",
    speed: cleanSpeed(s.speed),
    timeSec: cleanTime(s),
    shuffle: s.shuffle === true || s.shuffle === "on" ? "on" : "off",
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
  return `${s.goal}-${s.speed}-${s.timeSec}-${s.shuffle}`;
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
