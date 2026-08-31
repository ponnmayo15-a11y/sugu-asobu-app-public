const OP_KINDS = ["add", "sub", "mul"];

// minからmaxまでの整数を1つ出す
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// 配列の順番を入れ替える
function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// 2つの数の式にまとめる
function pack(a, op, b, answer) {
  return { nums: [a, b], op, answer, text: `${a} ${op} ${b}` };
}

// 2行の足し算をつくる
function makeAdd(min, max) {
  const a = randInt(min, max);
  const b = randInt(min, max);
  return pack(a, "+", b, a + b);
}

// 2行の引き算をつくる。答えは0以上
function makeSub(min, max) {
  const a = randInt(min, max);
  const b = randInt(min, a);
  return pack(a, "−", b, a - b);
}

// 2行の掛け算をつくる（九九）
function makeMul() {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  return pack(a, "×", b, a * b);
}

// 3行以上の足し算をつくる
function makeSumRows(rows, min, max) {
  const nums = [];
  for (let i = 0; i < rows; i += 1) nums.push(randInt(min, max));
  const answer = nums.reduce((sum, n) => sum + n, 0);
  return { nums, op: "+", answer, text: nums.join(" + ") };
}

// 3行以上の引き算をつくる。上の数から下を引く。答えは0以上
function makeSubRows(rows, min, max) {
  if (rows <= 2) return makeSub(min, max);
  const rest = [];
  for (let i = 1; i < rows; i += 1) rest.push(randInt(min, max));
  const restSum = rest.reduce((sum, n) => sum + n, 0);
  const answer = randInt(0, max);
  const first = restSum + answer;
  return {
    nums: [first, ...rest],
    op: "−",
    answer,
    text: `${first} − ${rest.join(" − ")}`,
  };
}

// 掛け算の1つの数の上限。行が増えても答えが大きくなりすぎないようにする
function mulFactorMax(rows) {
  if (rows <= 2) return 9;
  if (rows === 3) return 5;
  if (rows === 4) return 4;
  if (rows === 5) return 3;
  return 2;
}

// 行数どおりの掛け算をつくる
function makeMulRows(rows) {
  if (rows <= 2) return makeMul();
  const hi = mulFactorMax(rows);
  const lo = rows >= 6 ? 1 : 2;
  const nums = [];
  for (let i = 0; i < rows; i += 1) nums.push(randInt(lo, hi));
  if (nums.every((n) => n === 1)) nums[0] = 2;
  const answer = nums.reduce((prod, n) => prod * n, 1);
  return { nums, op: "×", answer, text: nums.join(" × ") };
}

// 種類と行数に合わせたやさしい式を1問つくる
function makeProblem(rows, level, kind) {
  const max = rows >= 3 || level < 2 ? 9 : 19;
  if (kind === "sub") return makeSubRows(rows, 1, max);
  if (kind === "mul") return makeMulRows(rows);
  if (rows >= 3) return makeSumRows(rows, 1, 9);
  return makeAdd(1, max);
}

// 選ばれた計算から、1つを決める
function pickKind(ops) {
  const list = (ops || []).filter((k) => OP_KINDS.includes(k));
  const use = list.length ? list : ["add"];
  return use[randInt(0, use.length - 1)];
}

// 正解の近くに、まちがい3つを足して4択にする
function makeChoices(answer) {
  const bag = new Set([answer]);
  const near = [1, -1, 2, -2, 10, -10, 11, -9, 3, -3];
  near.forEach((d) => {
    const n = answer + d;
    if (n >= 0 && n !== answer) bag.add(n);
  });
  while (bag.size < 4) bag.add(answer + randInt(1, 15));
  const rest = shuffle([...bag].filter((n) => n !== answer)).slice(0, 3);
  return shuffle([answer, ...rest]);
}

// 次の1問（行ごとの数字と4つの選択肢）を出す
function nextQuestion(rows, level, ops) {
  const q = makeProblem(rows, level, pickKind(ops));
  return { ...q, choices: makeChoices(q.answer) };
}
