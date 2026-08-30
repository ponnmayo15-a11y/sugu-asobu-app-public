const STORE_KEY = "sugu-asobu-crossword-v1";

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
