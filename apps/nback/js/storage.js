const NB_KEY = "sugu-asobu-nback-v1";

const DEFAULT_SETTINGS = {
  dual: false,
  n: 2,
  intervalMs: 2000,
  trials: 15,
};

// 数を最小と最大のあいだに収める
function clamp(n, min, max) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return min;
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

// 速さの段階から、いちばん近い値を取る
function nearStep(value, steps, fallback) {
  const n = Number(value);
  if (steps.includes(n)) return n;
  return fallback;
}

// せっていを使える値だけにする
function cleanSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    dual: s.dual === true || s.dual === 1 || s.dual === "1",
    n: clamp(s.n, N_MIN, N_MAX),
    intervalMs: nearStep(s.intervalMs, INTERVAL_STEPS, 2000),
    trials: nearStep(s.trials, TRIAL_STEPS, 15),
  };
}

// 空の保存データをつくる
function emptyStore() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    best: {},
    days: {},
    recent: [],
    seenHow: false,
    unlockedN: 3,
  };
}

// この端末の記録を読む
function loadStore() {
  try {
    const raw = localStorage.getItem(NB_KEY);
    if (!raw) return emptyStore();
    const data = JSON.parse(raw);
    const best = data.best && typeof data.best === "object" ? data.best : {};
    const days = data.days && typeof data.days === "object" ? data.days : {};
    const recent = Array.isArray(data.recent) ? data.recent.slice(-14) : [];
    const unlockedN = clamp(data.unlockedN, 3, N_MAX);
    return {
      settings: cleanSettings(data.settings),
      best,
      days,
      recent,
      seenHow: data.seenHow === true,
      unlockedN,
    };
  } catch {
    return emptyStore();
  }
}

// 記録を書く
function saveStore(data) {
  localStorage.setItem(NB_KEY, JSON.stringify(data));
}

// 今のせっていを出す
function loadSettings() {
  return cleanSettings(loadStore().settings);
}

// せっていを覚える
function saveSettings(settings) {
  const data = loadStore();
  data.settings = cleanSettings(settings);
  saveStore(data);
  return data.settings;
}

// 同じせっていのいちばんを比べるための名前
function settingsKey(settings) {
  const s = cleanSettings(settings);
  return `${s.dual ? "dual" : "pos"}-${s.n}-${s.intervalMs}-${s.trials}`;
}

// 今日の日付（この端末）
function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// 今回の点を残す。いちばん更新と、つぎのNの解禁もする
function saveResult(percent, settings) {
  const data = loadStore();
  const key = settingsKey(settings);
  const prev = Number(data.best[key]) || 0;
  const isNew = percent > prev;
  data.best[key] = Math.max(prev, percent);
  const day = todayKey();
  data.days[day] = Math.max(Number(data.days[day]) || 0, percent);
  data.recent.push({
    date: day,
    percent,
    n: settings.n,
    dual: settings.dual,
  });
  data.recent = data.recent.slice(-14);
  if (percent >= 90 && settings.n >= data.unlockedN && data.unlockedN < N_MAX) {
    data.unlockedN = settings.n + 1;
  }
  saveStore(data);
  return {
    best: data.best[key],
    isNew,
    today: data.days[day],
    unlockedN: data.unlockedN,
  };
}

// やり方を見たことにする
function markSeenHow() {
  const data = loadStore();
  data.seenHow = true;
  saveStore(data);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS,
    cleanSettings,
    settingsKey,
    todayKey,
  };
}
