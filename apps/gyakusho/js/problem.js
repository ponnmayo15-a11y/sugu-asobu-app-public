// 1から9の数字を1つ出す
function randDigit() {
  return 1 + Math.floor(Math.random() * 9);
}

// 指定したケタの数字列をつくる。となり同士は同じ数字にしない
function makeDigits(count) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    let n = randDigit();
    while (i > 0 && n === out[i - 1]) n = randDigit();
    out.push(n);
  }
  return out;
}

// 数字列を逆の順にする。足し算はしない
function reverseDigits(digits) {
  return digits.slice().reverse();
}

// 2つの数字列が同じかを見る
function sameDigits(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((n, i) => n === b[i]);
}

// 数字列を、間をあけた文字にする
function digitsText(digits) {
  return digits.join(" ");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { makeDigits, reverseDigits, sameDigits, digitsText };
}
