const GYK_KEY = "sugu-asobu-gyakusho-v1";

const DEFAULT_SETTINGS = { digits: 3, viewSec: 5 };

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
  const viewSec = rawView === 0 || !Number.isFinite(rawView) ? 5 : clamp(rawView, 2, 15);
  return { digits, viewSec };
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
