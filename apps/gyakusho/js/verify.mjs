import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { makeDigits, reverseDigits, sameDigits, digitsText } = require("./problem.js");

let failed = 0;

function check(name, ok) {
  if (ok) {
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.log(`ng  ${name}`);
}

const sample = [3, 8, 1];
const rev = reverseDigits(sample);
check("3 8 1 の逆は 1 8 3", sameDigits(rev, [1, 8, 3]));
check("足し算の 12 にはしない", digitsText(rev) !== "12");
check("同じ列はせいかい", sameDigits([1, 8, 3], [1, 8, 3]));
check("ちがう列はおしい", !sameDigits([1, 8, 3], [1, 3, 8]));

check("記号の逆も同じ", sameDigits(reverseDigits(["〇", "▲", "★"]), ["★", "▲", "〇"]));
check("ABCの逆も同じ", sameDigits(reverseDigits(["A", "C", "I"]), ["I", "C", "A"]));
check("色の逆も同じ", sameDigits(reverseDigits(["赤", "青", "緑"]), ["緑", "青", "赤"]));

for (const n of [3, 4, 5, 6, 7]) {
  const d = makeDigits(n);
  check(`${n}ケタつくれる`, d.length === n);
  check(`${n}ケタは1〜9`, d.every((x) => x >= 1 && x <= 9));
}

if (failed) {
  console.log(`失敗 ${failed} 件`);
  process.exit(1);
}
console.log("逆唱の核は、逆の順だけ。足し算なし。");
