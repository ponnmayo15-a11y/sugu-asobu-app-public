const STORE_KEY = "sugu-asobu-crossword-v1";
const SETTINGS_KEY = "sugu-asobu-crossword-settings-v1";

// せっていを正しい範囲に直す
function cleanSettings(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const level = LEVELS.includes(s.level) ? s.level : "やさしい";
  const timeSec = TIME_OPTS.includes(Number(s.timeSec))
    ? Number(s.timeSec)
    : 0;
  return { level, timeSec };
}

// せっていを読む
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return cleanSettings(raw ? JSON.parse(raw) : {});
  } catch (err) {
    return cleanSettings({});
  }
}

// せっていを残す
function saveSettings(data) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cleanSettings(data)));
  } catch (err) {
    // 保存できなくても遊べる
  }
}

// 途中の盤面を読む
function loadPlay() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.id !== PUZZLE.id) return null;
    return data;
  } catch (err) {
    return null;
  }
}

// 途中の盤面を残す
function savePlay(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (err) {
    // 保存できなくても遊べる
  }
}

// 途中の盤面を消す
function clearPlay() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch (err) {
    // 消えなくても次の上書きで直る
  }
}
