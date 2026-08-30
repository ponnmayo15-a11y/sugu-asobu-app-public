const PRIZE_KEY = "sugu-asobu-prize-v1";

// 保存データを読む
function loadPrize() {
  try {
    const raw = localStorage.getItem(PRIZE_KEY);
    if (!raw) return emptyPrize();
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : emptyPrize();
  } catch {
    return emptyPrize();
  }
}

// 空の保存データ
function emptyPrize() {
  return { logic: {} };
}

// 保存データを書く
function savePrize(data) {
  localStorage.setItem(PRIZE_KEY, JSON.stringify(data));
}

// 1問の途中経過を読む
function loadPlay(kind, id) {
  const data = loadPrize();
  return data[kind] && data[kind][id] ? data[kind][id] : null;
}

// 1問の途中経過を書く
function savePlay(kind, id, payload) {
  const data = loadPrize();
  if (!data[kind]) data[kind] = {};
  data[kind][id] = payload;
  savePrize(data);
}
