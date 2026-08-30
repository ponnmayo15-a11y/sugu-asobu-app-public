import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { neededHand, isCorrect } = require("./logic.js");

let failed = 0;

function check(name, ok) {
  if (ok) {
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.log(`ng  ${name}`);
}

check("あいこ・グーはグー", neededHand("gu", "aiko") === "gu");
check("かち・グーはパー", neededHand("gu", "kachi") === "pa");
check("まけ・グーはチョキ", neededHand("gu", "make") === "choki");
check("かち・チョキはグー", neededHand("choki", "kachi") === "gu");
check("まけ・パーはグー", neededHand("pa", "make") === "gu");
check("あいこは同じ手がせいかい", isCorrect("pa", "pa", "aiko"));
check("かちで同じ手はおしい", !isCorrect("gu", "gu", "kachi"));
check("まけで勝つ手はおしい", !isCorrect("gu", "pa", "make"));

if (failed) {
  console.log(`失敗 ${failed} 件`);
  process.exit(1);
}
console.log("後出しじゃんけんの核は、相手のあとにメニューどおりの手。");
