const GYK_KEY = "sugu-asobu-gyakusho-v1";

const DEFAULT_SETTINGS = { digits: 3, viewSec: 5 };

// せっていを正しい範囲に直す
function cleanSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const digits = [3, 4, 5, 6].includes(Number(s.digits)) ? Number(s.digits) : 3;
  const viewSec = [0, 5, 10].includes(Number(s.viewSec)) ? Number(s.viewSec) : 5;
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
