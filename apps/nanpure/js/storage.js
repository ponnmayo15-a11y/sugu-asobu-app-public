const NANPURE_KEY = "sugu-asobu-nanpure-v1";

const GIVEN_RANGE = {
  6: { min: 12, max: 24, step: 2, def: 18 },
  9: { min: 28, max: 46, step: 2, def: 38 },
};

const DEFAULT_SETTINGS = { size: 9, givens: 38, hints: 3 };

// 数を最小と最大のあいだに収める
function clamp(n, min, max) {
  const x = Math.round(n);
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

// 盤の大きさに合う、はじめの数字の範囲
function givenRange(size) {
  return GIVEN_RANGE[size === 6 ? 6 : 9];
}

// せっていを正しい範囲に直す
function cleanSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const size = s.size === 6 ? 6 : 9;
  const range = givenRange(size);
  const givens = clamp(Number(s.givens) || range.def, range.min, range.max);
  return {
    size,
    givens: givens - (givens % 2),
    hints: clamp(Number(s.hints) || 3, 0, 9),
  };
}

// はじめの数字の多さから、やさしい／ふつう／むずかしいを付ける
function givenLabel(size, givens) {
  if (size === 6) {
    if (givens >= 20) return "やさしい";
    if (givens >= 16) return "ふつう";
    return "むずかしい";
  }
  if (givens >= 40) return "やさしい";
  if (givens >= 34) return "ふつう";
  return "むずかしい";
}

// この端末のせっていを読む
function loadSettings() {
  try {
    const raw = localStorage.getItem(NANPURE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return cleanSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// せっていを覚える
function saveSettings(settings) {
  const next = cleanSettings(settings);
  localStorage.setItem(NANPURE_KEY, JSON.stringify(next));
  return next;
}
