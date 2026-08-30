// 弱点マップに1問を足す
function addWeakness(name, settings, correct) {
  const player = getPlayer(name);
  const weak = player.weakness || emptyWeakness();
  const interval = settings.timing === "total"
    ? settings.totalMs / settings.count
    : settings.intervalMs;
  bump(weak.digits, String(settings.digits), correct);
  bump(weak.count, bucketCount(settings.count), correct);
  bump(weak.speed, speedBucket(interval), correct);
  bump(weak.minus, settings.minus ? "yes" : "no", correct);
  player.weakness = weak;
  const data = JSON.parse(localStorage.getItem("sugu-asobu-v1") || "{}");
  if (!data.players) return;
  data.players[name] = player;
  localStorage.setItem("sugu-asobu-v1", JSON.stringify(data));
}

// 口数を少なめ／ふつう／多い、に分ける
function bucketCount(count) {
  if (count <= 5) return "few";
  if (count <= 10) return "mid";
  return "many";
}

// 正解・不正解の数を1つ足す
function bump(map, key, correct) {
  if (!map[key]) map[key] = { ok: 0, ng: 0 };
  if (correct) map[key].ok += 1;
  else map[key].ng += 1;
}

// いちばん弱い項目を見つける
function worstSpot(name) {
  const weak = getPlayer(name).weakness || emptyWeakness();
  const spots = [
    ...rows(weak.digits, "digits", labelDigits),
    ...rows(weak.count, "count", labelCount),
    ...rows(weak.speed, "speed", labelSpeed),
    ...rows(weak.minus, "minus", labelMinus),
  ];
  spots.sort((a, b) => b.rate - a.rate);
  return spots[0] || null;
}

// 弱点の行データをつくる
function rows(map, type, labelFn) {
  return Object.entries(map)
    .map(([key, v]) => {
      const total = v.ok + v.ng;
      if (total < 1) return null;
      return {
        type,
        key,
        label: labelFn(key),
        ok: v.ok,
        ng: v.ng,
        rate: v.ng / total,
      };
    })
    .filter(Boolean);
}

function labelDigits(key) {
  return `${key}桁`;
}

function labelCount(key) {
  if (key === "few") return "口が少ない";
  if (key === "many") return "口が多い";
  return "口はふつう";
}

function labelSpeed(key) {
  if (key === "fast") return "はやい";
  if (key === "slow") return "ゆっくり";
  return "ふつうの速さ";
}

function labelMinus(key) {
  return key === "yes" ? "マイナスあり" : "プラスだけ";
}

// 弱点に近い設定をつくる
function similarSettings(base, spot) {
  const next = { ...base };
  if (!spot) return easier(next);
  if (spot.type === "digits") next.digits = Number(spot.key);
  if (spot.type === "count") {
    if (spot.key === "few") next.count = 5;
    else if (spot.key === "many") next.count = 12;
    else next.count = 8;
  }
  if (spot.type === "minus") next.minus = spot.key === "yes";
  if (spot.type === "speed") {
    next.timing = "interval";
    next.intervalMs = spot.key === "fast" ? 500 : spot.key === "slow" ? 1000 : 700;
  }
  return easier(next);
}

// 似た問題を、少しだけやさしくする
function easier(settings) {
  const next = { ...settings };
  if (next.timing === "interval") {
    next.intervalMs = Math.min(2000, next.intervalMs + 150);
  } else {
    next.totalMs = Math.round(next.totalMs * 1.15);
  }
  return next;
}

// 弱点マップの表示用リスト
function weaknessRows(name) {
  const weak = getPlayer(name).weakness || emptyWeakness();
  return [
    ...rows(weak.digits, "digits", labelDigits),
    ...rows(weak.count, "count", labelCount),
    ...rows(weak.speed, "speed", labelSpeed),
    ...rows(weak.minus, "minus", labelMinus),
  ].sort((a, b) => b.rate - a.rate);
}
