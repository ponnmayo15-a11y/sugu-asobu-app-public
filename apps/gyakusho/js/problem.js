const NUMS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const MARKS = ["〇", "◎", "△", "▲", "■", "●", "▢", "★", "☆"];
const ALPHAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const COLORS = [
  { id: "赤", hex: "#c92a2a" },
  { id: "青", hex: "#1864ab" },
  { id: "緑", hex: "#2b8a3e" },
  { id: "黄", hex: "#f59f00" },
  { id: "紫", hex: "#9c36b5" },
  { id: "橙", hex: "#e8590c" },
  { id: "桃", hex: "#e64980" },
  { id: "茶", hex: "#795548" },
  { id: "灰", hex: "#495057" },
];

// 色の名前から色を取る
function colorHex(id) {
  const hit = COLORS.find((c) => c.id === id);
  return hit ? hit.hex : "";
}

// 数字・記号・色・文字の候補を出す
function itemPool(kind) {
  if (kind === "mark") return MARKS.slice();
  if (kind === "both") return NUMS.concat(MARKS);
  if (kind === "alpha") return ALPHAS.slice();
  if (kind === "color") return COLORS.map((c) => c.id);
  return NUMS.slice();
}

// 候補から1つ出す
function randItem(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

// 指定した長さの列をつくる。となり同士は同じにしない
function makeItems(count, kind) {
  const pool = itemPool(kind);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    let n = randItem(pool);
    while (i > 0 && n === out[i - 1]) n = randItem(pool);
    out.push(n);
  }
  return out;
}

// 数字列をつくる（確認用）
function makeDigits(count) {
  return makeItems(count, "num");
}

// 列を逆の順にする。足し算はしない
function reverseDigits(digits) {
  return digits.slice().reverse();
}

// 2つの列が同じかを見る
function sameDigits(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((n, i) => String(n) === String(b[i]));
}

// 列を、間をあけた文字にする
function digitsText(digits) {
  return digits.join(" ");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    NUMS,
    MARKS,
    ALPHAS,
    COLORS,
    colorHex,
    makeItems,
    makeDigits,
    reverseDigits,
    sameDigits,
    digitsText,
  };
}
