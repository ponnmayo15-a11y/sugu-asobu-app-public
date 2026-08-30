const HANDS = ["gu", "choki", "pa"];
const HAND_NAME = { gu: "グー", choki: "チョキ", pa: "パー" };
const GOAL_NAME = {
  aiko: "あいこにしましょう",
  kachi: "かちましょう",
  make: "まけましょう",
};
const SPEED_NAME = { walk: "あるく", bike: "じてんしゃ", car: "くるま" };
const SPEED_MS = { walk: 3500, bike: 2000, car: 1000 };

// グー・チョキ・パーから1つ出す
function randomHand() {
  return HANDS[Math.floor(Math.random() * HANDS.length)];
}

// つぎの相手の手。直前と同じなら、もう一度選ぶ
function nextCpu(prev) {
  let hand = randomHand();
  if (hand === prev) hand = randomHand();
  return hand;
}

// 相手の手に対して、出すとせいかいになる手
function neededHand(cpu, goal) {
  if (goal === "aiko") return cpu;
  if (goal === "kachi") {
    if (cpu === "gu") return "pa";
    if (cpu === "choki") return "gu";
    return "choki";
  }
  if (cpu === "gu") return "choki";
  if (cpu === "choki") return "pa";
  return "gu";
}

// 出した手が、メニューどおりかを見る
function isCorrect(cpu, player, goal) {
  return player === neededHand(cpu, goal);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    HANDS,
    HAND_NAME,
    GOAL_NAME,
    SPEED_NAME,
    SPEED_MS,
    randomHand,
    nextCpu,
    neededHand,
    isCorrect,
  };
}
