const CALC_KEY = "sugu-asobu-easy-calc-v1";

const DEFAULT_SETTINGS = { timeSec: 60, rows: 2, goal: 10 };

// 空の保存データをつくる
function emptyCalc() {
  return { best: {}, settings: { ...DEFAULT_SETTINGS } };
}

// せっていを正しい範囲に直す
function cleanSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    timeSec: clamp(Number(s.timeSec) || 60, 10, 90),
    rows: clamp(Number(s.rows) || 2, 2, 7),
    goal: clamp(Number(s.goal) || 10, 5, 30),
  };
}

// 数を最小と最大のあいだに収める
function clamp(n, min, max) {
  const x = Math.round(n);
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

// この端末の記録を読む
function loadCalc() {
  try {
    const raw = localStorage.getItem(CALC_KEY);
    if (!raw) return emptyCalc();
    const data = JSON.parse(raw);
    const best = data.best && typeof data.best === "object" ? data.best : {};
    return { best, settings: cleanSettings(data.settings) };
  } catch {
    return emptyCalc();
  }
}

// 記録を書く
function saveCalc(data) {
  localStorage.setItem(CALC_KEY, JSON.stringify(data));
}

// 今のせっていを出す
function loadSettings() {
  return cleanSettings(loadCalc().settings);
}

// せっていを覚える
function saveSettings(settings) {
  const data = loadCalc();
  data.settings = cleanSettings(settings);
  saveCalc(data);
  return data.settings;
}

// 同じせっていのいちばんを比べるための名前
function settingsKey(settings) {
  const s = cleanSettings(settings);
  return `${s.timeSec}-${s.rows}-${s.goal}`;
}

// このせっていでのいちばんを出す
function getBest(settings) {
  const data = loadCalc();
  return Number(data.best[settingsKey(settings)]) || 0;
}

// 今回の点数がいちばんなら更新する
function saveBest(score, settings) {
  const data = loadCalc();
  const key = settingsKey(settings);
  const prev = Number(data.best[key]) || 0;
  const next = Math.max(prev, score);
  data.best[key] = next;
  saveCalc(data);
  return { best: next, isNew: score > prev };
}
