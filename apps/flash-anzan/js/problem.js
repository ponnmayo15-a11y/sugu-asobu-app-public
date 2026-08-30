// 指定した桁の整数を1つ作る
function makeNumber(digits, random) {
  const min = digits === 1 ? 1 : 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return min + Math.floor(random() * (max - min + 1));
}

// 口数ぶんの数字を作る。マイナスありのときは一部を負にする
function makeNumbers(settings, random = Math.random) {
  const list = [];
  for (let i = 0; i < settings.count; i += 1) {
    let n = makeNumber(settings.digits, random);
    if (settings.minus && i > 0 && random() < 0.35) n = -n;
    list.push(n);
  }
  return list;
}

// 数字の合計を出す
function sumNumbers(numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

// 画面用に数字を文字にする
function formatNumber(n, comma) {
  const abs = Math.abs(n);
  const body = comma ? abs.toLocaleString("en-US") : String(abs);
  return n < 0 ? `-${body}` : body;
}

// 1口あたりの表示ミリ秒を出す
function intervalMsOf(settings) {
  if (settings.timing === "total") {
    return Math.max(80, Math.round(settings.totalMs / settings.count));
  }
  return settings.intervalMs;
}

// 速さの区分を出す（弱点マップ用）
function speedBucket(intervalMs) {
  if (intervalMs >= 800) return "slow";
  if (intervalMs >= 400) return "mid";
  return "fast";
}

// 繰り上がり／繰り下がりがあったか見る
function hadCarry(before, added) {
  const a = before % 10;
  const b = added % 10;
  const ones = a + b;
  return ones >= 10 || ones < 0;
}

// 挑戦状用に問題を短くする
function packProblem(settings, numbers) {
  return {
    v: 1,
    n: numbers,
    k: settings.count,
    d: settings.digits,
    t: settings.timing,
    i: settings.intervalMs,
    s: settings.totalMs,
    m: settings.minus ? 1 : 0,
    c: settings.comma ? 1 : 0,
  };
}

// 短いデータから設定と数字を戻す
function unpackProblem(pack) {
  return {
    numbers: pack.n,
    settings: {
      count: pack.k,
      digits: pack.d,
      timing: pack.t === "total" ? "total" : "interval",
      intervalMs: pack.i,
      totalMs: pack.s,
      minus: pack.m === 1,
      comma: pack.c === 1,
    },
  };
}

// 挑戦状の文字にする
function encodeChallenge(pack) {
  const json = JSON.stringify(pack);
  const raw = btoa(unescape(encodeURIComponent(json)));
  return raw.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

// 挑戦状の文字を問題に戻す
function decodeChallenge(code) {
  try {
    const pad = code.replaceAll("-", "+").replaceAll("_", "/");
    const json = decodeURIComponent(escape(atob(pad)));
    return unpackProblem(JSON.parse(json));
  } catch {
    return null;
  }
}
