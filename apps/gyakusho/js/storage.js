const GYK_KEY = "sugu-asobu-gyakusho-v1";

const DEFAULT_SETTINGS = { digits: 3, viewSec: 5, goal: 5, move: false };

const GOAL_STEPS = [3, 4, 5, 6, 7, 8, 9, 10, 0];

// 数を最小と最大のあいだに収める
function clamp(n, min, max) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return min;
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

// せっていを正しい範囲に直す
function cleanSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const digits = [3, 4, 5, 6, 7].includes(Number(s.digits)) ? Number(s.digits) : 3;
  const rawView = Number(s.viewSec);
  const viewSec = rawView === 0 || !Number.isFinite(rawView) ? 5 : clamp(rawView, 2, 10);
  const rawGoal = Number(s.goal);
  const goal = GOAL_STEPS.includes(rawGoal) ? rawGoal : 5;
  const move = s.move === true || s.move === 1 || s.move === "1";
  return { digits, viewSec, goal, move };
}

// この端末のせっていを読む
function loadSettings() {
  try {
    const raw = localStorage.getItem(GYK_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return cleanSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// せっていを覚える
function saveSettings(settings) {
  const next = cleanSettings(settings);
  localStorage.setItem(GYK_KEY, JSON.stringify(next));
  return next;
}
