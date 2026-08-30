const play = {
  logicIndex: 0,
  logicState: [],
  logicDone: false,
};

// 今の問題
function currentLogic() {
  return LOGIC_PUZZLES[play.logicIndex];
}

// 最後に開いた問題番号を覚える
function rememberIndex(index) {
  const data = loadPrize();
  data.logicIndex = index;
  savePrize(data);
}

// 覚えた問題番号を読む
function rememberedIndex() {
  const data = loadPrize();
  const i = data.logicIndex;
  if (Number.isInteger(i) && i >= 0 && i < LOGIC_PUZZLES.length) return i;
  return 0;
}

document.getElementById("logic-reset").addEventListener("click", resetLogic);
document.getElementById("logic-check").addEventListener("click", checkLogic);
document.getElementById("logic-next").addEventListener("click", () => {
  play.logicIndex = (play.logicIndex + 1) % LOGIC_PUZZLES.length;
  openLogic();
});

// イラストロジックを開く
function openLogic() {
  const puzzle = currentLogic();
  const saved = loadPlay("logic", puzzle.id);
  const h = puzzle.answer.length;
  const w = puzzle.answer[0].length;
  play.logicState = saved && saved.state ? saved.state : emptyLogicState(h, w);
  play.logicDone = !!(saved && saved.cleared);
  rememberIndex(play.logicIndex);
  document.getElementById("logic-meta").textContent =
    `${puzzle.level}　${w}×${h}　${puzzle.name}`;
  document.getElementById("logic-check-msg").textContent = "";
  renderLogic();
}

// 盤を描く
function renderLogic() {
  const puzzle = currentLogic();
  const clues = cluesFromGrid(puzzle.answer);
  const board = document.getElementById("logic-board");
  const h = puzzle.answer.length;
  const w = puzzle.answer[0].length;
  board.style.gridTemplateColumns = `minmax(32px, max-content) repeat(${w}, minmax(0, 1fr))`;
  board.innerHTML = "";
  board.appendChild(document.createElement("div")).className = "logic-corner";
  for (let c = 0; c < w; c += 1) {
    board.appendChild(colClueEl(clues.cols[c]));
  }
  for (let r = 0; r < h; r += 1) {
    board.appendChild(rowClueEl(clues.rows[r]));
    for (let c = 0; c < w; c += 1) {
      board.appendChild(logicCellEl(r, c));
    }
  }
  document.getElementById("logic-done").hidden = !play.logicDone;
}

// タテのヒントます
function colClueEl(clues) {
  const el = document.createElement("div");
  el.className = "logic-clue-col";
  el.textContent = clues.join("\n");
  el.style.whiteSpace = "pre-line";
  return el;
}

// ヨコのヒントます
function rowClueEl(clues) {
  const el = document.createElement("div");
  el.className = "logic-clue-row";
  el.textContent = clues.join(" ");
  return el;
}

// 塗るマス1つ
function logicCellEl(r, c) {
  const btn = document.createElement("button");
  const v = play.logicState[r][c];
  btn.type = "button";
  btn.className = "logic-cell" + (v === 1 ? " is-fill" : "") + (v === 2 ? " is-x" : "");
  btn.textContent = v === 2 ? "×" : "";
  btn.setAttribute("aria-label", `${r + 1}行${c + 1}列`);
  btn.addEventListener("click", () => tapLogic(r, c));
  return btn;
}

// マスを押した：塗る→×→空
function tapLogic(r, c) {
  if (play.logicDone) return;
  play.logicState[r][c] = (play.logicState[r][c] + 1) % 3;
  persistLogic();
  if (logicMatches(play.logicState, currentLogic().answer)) finishLogic();
  renderLogic();
}

// 途中を保存
function persistLogic() {
  savePlay("logic", currentLogic().id, {
    state: play.logicState,
    cleared: play.logicDone,
  });
}

// できた
function finishLogic() {
  play.logicDone = true;
  persistLogic();
}

// 最初から
function resetLogic() {
  const a = currentLogic().answer;
  play.logicState = emptyLogicState(a.length, a[0].length);
  play.logicDone = false;
  persistLogic();
  document.getElementById("logic-check-msg").textContent = "";
  renderLogic();
}

// 合っているか見る
function checkLogic() {
  if (logicMatches(play.logicState, currentLogic().answer)) {
    finishLogic();
    renderLogic();
    document.getElementById("logic-check-msg").textContent = "";
    return;
  }
  const n = logicWrongCount(play.logicState, currentLogic().answer);
  document.getElementById("logic-check-msg").textContent =
    `まだ違います。違うマスは ${n} 個です。`;
}

play.logicIndex = rememberedIndex();
openLogic();
