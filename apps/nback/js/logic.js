const SOUNDS = ["あ", "か", "さ", "た", "な", "は", "ま", "や"];
const POS_COUNT = 9;
const N_MIN = 1;
const N_MAX = 5;
const INTERVAL_STEPS = [1500, 2000, 2500, 3000];
const TRIAL_STEPS = [5, 10, 15, 20, 25];

// 0以上 max 未満の整数を1つ出す
function randInt(max) {
  return Math.floor(Math.random() * max);
}

// 配列の中に、N個前と同じものが1つ以上あるか
function hasMatch(list, n) {
  return list.some((v, i) => i >= n && v === list[i - n]);
}

// N個前と同じ／違うを混ぜた列をつくる
function makeStream(n, total, max) {
  const out = [];
  for (let i = 0; i < total; i += 1) {
    if (i < n) {
      out.push(randInt(max));
    } else if (Math.random() < 0.3) {
      out.push(out[i - n]);
    } else {
      out.push(randInt(max));
    }
  }
  if (total > n && !hasMatch(out, n)) {
    const i = n + randInt(total - n);
    out[i] = out[i - n];
  }
  return out;
}

// 1回分の並びをつくる。足し算はしない
function makeRound(n, trials, dual) {
  const total = n + trials;
  return {
    n,
    dual,
    positions: makeStream(n, total, POS_COUNT),
    sounds: dual ? makeStream(n, total, SOUNDS.length) : Array(total).fill(0),
  };
}

// 並びをコピーする（同じ並びの再挑戦用）
function cloneRound(round) {
  return {
    n: round.n,
    dual: round.dual,
    positions: round.positions.slice(),
    sounds: round.sounds.slice(),
  };
}

// この回のばしょが、N個前と同じか
function isPosMatch(round, i) {
  return i >= round.n && round.positions[i] === round.positions[i - round.n];
}

// この回のおとが、N個前と同じか
function isSoundMatch(round, i) {
  return round.dual && i >= round.n && round.sounds[i] === round.sounds[i - round.n];
}

// 同じ／違うと、押した／押さないから判定する
function judgeChannel(wasMatch, pressed) {
  if (wasMatch && pressed) return "hit";
  if (!wasMatch && pressed) return "false";
  if (wasMatch && !pressed) return "miss";
  return "ok";
}

// 判定を1チャンネル分、数えに足す
function addJudge(counts, kind) {
  if (kind === "hit") counts.hit += 1;
  else if (kind === "false") counts.falseA += 1;
  else if (kind === "miss") counts.miss += 1;
  else counts.ok += 1;
}

// 空の数えをつくる
function emptyCounts() {
  return { hit: 0, falseA: 0, miss: 0, ok: 0 };
}

// 数えから点を出す。せいかい ÷（せいかい＋おしい＋見逃し）
function countsToScore(counts) {
  const correct = counts.hit + counts.ok;
  const judged = correct + counts.falseA + counts.miss;
  const percent = judged ? Math.round((100 * correct) / judged) : 0;
  return { correct, judged, percent };
}

// 1回の答えを、ばしょとおとで採点する。end まで（省略なら全部）
function scoreRound(round, answers, end) {
  const all = emptyCounts();
  const pos = emptyCounts();
  const sound = emptyCounts();
  const details = [];
  const last = end == null ? round.positions.length : end;
  for (let i = round.n; i < last; i += 1) {
    const ans = answers[i] || {};
    const posKind = judgeChannel(isPosMatch(round, i), !!ans.pos);
    addJudge(all, posKind);
    addJudge(pos, posKind);
    let soundKind = "";
    if (round.dual) {
      soundKind = judgeChannel(isSoundMatch(round, i), !!ans.sound);
      addJudge(all, soundKind);
      addJudge(sound, soundKind);
    }
    details.push({ i, posKind, soundKind });
  }
  return {
    all,
    pos,
    sound,
    details,
    ...countsToScore(all),
  };
}

// 点から、つぎのNを決める。よくできたら上げ、苦しかったら下げる
function suggestN(n, percent) {
  if (percent >= 90 && n < N_MAX) return n + 1;
  if (percent < 70 && n > N_MIN) return n - 1;
  return n;
}

// 判定の日本語
function kindLabel(kind) {
  if (kind === "hit") return "せいかい";
  if (kind === "false") return "おしい";
  if (kind === "miss") return "見逃し";
  return "せいかい";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SOUNDS,
    POS_COUNT,
    N_MIN,
    N_MAX,
    INTERVAL_STEPS,
    TRIAL_STEPS,
    makeStream,
    makeRound,
    cloneRound,
    isPosMatch,
    isSoundMatch,
    judgeChannel,
    scoreRound,
    suggestN,
    countsToScore,
    kindLabel,
    hasMatch,
  };
}
