const KEY = "sugu-asobu-v1";

// 保存データを読む
function loadAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const data = JSON.parse(raw);
    if (!data.players) return emptyData();
    return data;
  } catch {
    return emptyData();
  }
}

// 空の保存データをつくる
function emptyData() {
  return { currentName: "", players: {} };
}

// 保存データを書く
function saveAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

// 今の名前を出す
function getCurrentName() {
  return loadAll().currentName || "";
}

// 名前の一覧を出す
function listNames() {
  return Object.keys(loadAll().players);
}

// 名前を選ぶ。なければ新しく作る
function setCurrentName(name) {
  const clean = String(name || "").trim().slice(0, 20);
  if (!clean) return "";
  const data = loadAll();
  data.currentName = clean;
  if (!data.players[clean]) data.players[clean] = newPlayer();
  saveAll(data);
  return clean;
}

// 1人ぶんの初期記録
function newPlayer() {
  return {
    practice: [],
    exams: [],
    survivalBest: 0,
    survivalFalls: [],
    weakness: emptyWeakness(),
  };
}

// 弱点の初期値
function emptyWeakness() {
  return { digits: {}, count: {}, speed: {}, minus: {} };
}

// 今の人の記録を出す
function getPlayer(name) {
  const data = loadAll();
  return data.players[name] || newPlayer();
}

// 今の人の記録を書く
function savePlayer(name, player) {
  const data = loadAll();
  data.players[name] = player;
  saveAll(data);
}

// 1問の結果を記録する
function recordPlay(name, play) {
  const player = getPlayer(name);
  player.practice.unshift(play);
  player.practice = player.practice.slice(0, 50);
  savePlayer(name, player);
}

// 検定の結果を記録する
function recordExam(name, exam) {
  const player = getPlayer(name);
  player.exams.unshift(exam);
  player.exams = player.exams.slice(0, 30);
  savePlayer(name, player);
}

// 競技で落ちた問を記録する
function recordSurvival(name, fallOn, cleared) {
  const player = getPlayer(name);
  player.survivalFalls.unshift(fallOn);
  player.survivalFalls = player.survivalFalls.slice(0, 30);
  if (cleared > player.survivalBest) player.survivalBest = cleared;
  savePlayer(name, player);
}
