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

// 3行以上の足し算をつくる
function makeSumRows(rows, min, max) {
  const nums = [];
  for (let i = 0; i < rows; i += 1) nums.push(randInt(min, max));
  const answer = nums.reduce((sum, n) => sum + n, 0);
  return { nums, op: "+", answer, text: nums.join(" + ") };
}

// 行数に合わせたやさしい式を1問つくる
function makeProblem(rows, level) {
  if (rows >= 3) return makeSumRows(rows, 1, 9);
  const max = level >= 2 ? 19 : 9;
  if (Math.random() < 0.7) return makeAdd(1, max);
  return makeSub(2, max + 1);
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
function nextQuestion(rows, level) {
  const q = makeProblem(rows, level);
  return { ...q, choices: makeChoices(q.answer) };
}
