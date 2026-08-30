const LEVELS = [
  {
    id: "easy",
    label: "やさしい（5×5）",
    pick: (p) => p.answer.length === 5 && p.level === "やさしい",
  },
  {
    id: "normal",
    label: "ふつう（5×5）",
    pick: (p) => p.answer.length === 5 && p.level === "ふつう",
  },
  {
    id: "hard",
    label: "むずかしい（8×8）",
    pick: (p) => p.answer.length === 8,
  },
];

const play = {
  levelIndex: 0,
  poolIndex: 0,
  logicState: [],
  logicDone: false,
};

const screens = {
  setup: document.getElementById("screen-setup"),
  logic: document.getElementById("screen-logic"),
};

// 画面を1つだけ出す
function showScreen(name) {
  screens.setup.hidden = name !== "setup";
  screens.logic.hidden = name !== "logic";
}

// 今の難易度
function currentLevel() {
  return LEVELS[play.levelIndex];
}

// 今の難易度の問題一覧
function currentPool() {
  return LOGIC_PUZZLES.filter(currentLevel().pick);
}

// 今の問題
function currentLogic() {
  const pool = currentPool();
  return pool[play.poolIndex] || pool[0];
}

// せっていを覚える
function saveSetup() {
  const data = loadPrize();
  data.levelId = currentLevel().id;
  savePrize(data);
}

// せっていを読む
function loadSetup() {
  const data = loadPrize();
  const i = LEVELS.findIndex((lv) => lv.id === data.levelId);
  play.levelIndex = i >= 0 ? i : 0;
}

// 難易度の表示を更新
function renderSetup() {
  document.getElementById("out-level").textContent = currentLevel().label;
}

document.getElementById("level-minus").addEventListener("click", () => {
  play.levelIndex = (play.levelIndex + LEVELS.length - 1) % LEVELS.length;
  saveSetup();
  renderSetup();
});

document.getElementById("level-plus").addEventListener("click", () => {
  play.levelIndex = (play.levelIndex + 1) % LEVELS.length;
  saveSetup();
  renderSetup();
});

document.getElementById("setup-start").addEventListener("click", () => {
  play.poolIndex = 0;
  openLogic();
});

document.getElementById("logic-setup").addEventListener("click", () => {
  showScreen("setup");
});

document.getElementById("logic-reset").addEventListener("click", resetLogic);
document.getElementById("logic-check").addEventListener("click", checkLogic);
document.getElementById("logic-next").addEventListener("click", () => {
  const n = currentPool().length;
  play.poolIndex = (play.poolIndex + 1) % n;
  openLogic();
});

// イラストロジックを開く
function openLogic() {
  const puzzle = currentLogic();
  if (!puzzle) return;
  const saved = loadPlay("logic", puzzle.id);
  const h = puzzle.answer.length;
  const w = puzzle.answer[0].length;
  play.logicState = saved && saved.state ? saved.state : emptyLogicState(h, w);
  play.logicDone = !!(saved && saved.cleared);
  document.getElementById("logic-meta").textContent =
    `${puzzle.level}　${w}×${h}　${puzzle.name}`;
  document.getElementById("logic-check-msg").textContent = "";
  renderLogic();
  showScreen("logic");
}

// 盤を描く
function renderLogic() {
  const puzzle = currentLogic();
  const clues = cluesFromGrid(puzzle.answer);
  const board = document.getElementById("logic-board");
  const h = puzzle.answer.length;
  const w = puzzle.answer[0].length;
  const wide = w >= 8;
  board.classList.toggle("is-5", !wide);
  board.classList.toggle("is-8", wide);
  board.style.gridTemplateColumns = wide
    ? `minmax(32px, max-content) repeat(${w}, minmax(0, 1fr))`
    : `minmax(56px, auto) repeat(${w}, 48px)`;
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

loadSetup();
renderSetup();
showScreen("setup");
