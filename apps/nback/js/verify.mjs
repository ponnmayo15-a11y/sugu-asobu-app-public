import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  makeStream,
  makeRound,
  cloneRound,
  isPosMatch,
  isSoundMatch,
  judgeChannel,
  scoreRound,
  suggestN,
  countsToScore,
  hasMatch,
} = require("./logic.js");

let failed = 0;

function check(name, ok) {
  if (ok) {
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.log(`ng  ${name}`);
}

const stream = makeStream(2, 12, 9);
check("列の長さは n + 回数", stream.length === 12);
check("同じが1つ以上ある", hasMatch(stream, 2));

const fixed = { n: 2, dual: false, positions: [0, 1, 0, 4, 0], sounds: [0, 0, 0, 0, 0] };
check("2個前のばしょが同じ", isPosMatch(fixed, 2));
check("2個前のばしょが違う", !isPosMatch(fixed, 3));
check("覚えるあいだは同じにしない", !isPosMatch(fixed, 1));

check("同じで押すはせいかい", judgeChannel(true, true) === "hit");
check("違うのに押すはおしい", judgeChannel(false, true) === "false");
check("同じなのに押さないは見逃し", judgeChannel(true, false) === "miss");
check("違うときに押さないはせいかい", judgeChannel(false, false) === "ok");

const answers = [];
answers[2] = { pos: true, sound: false };
answers[3] = { pos: false, sound: false };
answers[4] = { pos: false, sound: false };
const scored = scoreRound(fixed, answers);
check("3回分だけ採点する", scored.judged === 3);
check("せいかいは2（押した同じ＋押さない違う）", scored.correct === 2);
check("点は四捨五入のパーセント", scored.percent === 67);

const dual = {
  n: 1,
  dual: true,
  positions: [0, 0],
  sounds: [1, 2],
};
const dualAns = [];
dualAns[1] = { pos: true, sound: false };
const dualScore = scoreRound(dual, dualAns);
check("二重はばしょとおとを足す", dualScore.judged === 2);
check("おとが違うのに押さないはせいかい", !isSoundMatch(dual, 1));
check("ばしょが同じなら同じ", isPosMatch(dual, 1));

const copy = cloneRound(fixed);
copy.positions[0] = 8;
check("コピーは元を変えない", fixed.positions[0] === 0);

check("90点以上はNを上げる", suggestN(2, 90) === 3);
check("70点未満はNを下げる", suggestN(2, 69) === 1);
check("5より上にはしない", suggestN(5, 100) === 5);
check("1より下にはしない", suggestN(1, 10) === 1);

const mid = scoreRound(fixed, answers, 3);
check("途中まで採点できる", mid.judged === 1);

const empty = countsToScore({ hit: 0, ok: 0, falseA: 0, miss: 0 });
check("0回は0点", empty.percent === 0);

const made = makeRound(2, 10, true);
check("二重の音の列もある", made.sounds.length === 12);
check("二重の音にも同じがある", hasMatch(made.sounds, 2));

if (failed) {
  console.log(`失敗 ${failed} 件`);
  process.exit(1);
}
console.log("Nバックの核は、N個前と同じなら押す。足し算はしない。");
