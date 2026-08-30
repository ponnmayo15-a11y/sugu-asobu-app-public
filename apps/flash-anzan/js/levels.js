// 検定の参考表。公式の検定ではない。
const EXAM_LEVELS = [
  { id: "10kyu", name: "10級", digits: 2, count: 2, totalSec: 4 },
  { id: "9kyu", name: "9級", digits: 2, count: 3, totalSec: 6 },
  { id: "8kyu", name: "8級", digits: 2, count: 4, totalSec: 7 },
  { id: "7kyu", name: "7級", digits: 2, count: 5, totalSec: 8 },
  { id: "6kyu", name: "6級", digits: 2, count: 6, totalSec: 9 },
  { id: "5kyu", name: "5級", digits: 2, count: 7, totalSec: 10 },
  { id: "4kyu", name: "4級", digits: 2, count: 8, totalSec: 11 },
  { id: "3kyu", name: "3級", digits: 2, count: 10, totalSec: 12 },
  { id: "2kyu", name: "2級", digits: 2, count: 12, totalSec: 12 },
  { id: "1kyu", name: "1級", digits: 2, count: 15, totalSec: 13 },
  { id: "1dan", name: "初段", digits: 2, count: 15, totalSec: 10 },
  { id: "2dan", name: "2段", digits: 3, count: 4, totalSec: 4 },
  { id: "3dan", name: "3段", digits: 3, count: 6, totalSec: 5 },
  { id: "4dan", name: "4段", digits: 3, count: 8, totalSec: 6 },
  { id: "5dan", name: "5段", digits: 3, count: 10, totalSec: 7 },
  { id: "6dan", name: "6段", digits: 3, count: 12, totalSec: 8 },
  { id: "7dan", name: "7段", digits: 3, count: 15, totalSec: 8 },
  { id: "8dan", name: "8段", digits: 3, count: 15, totalSec: 6 },
  { id: "9dan", name: "9段", digits: 3, count: 15, totalSec: 4.5 },
  { id: "10dan", name: "10段", digits: 3, count: 15, totalSec: 3 },
];

const EXAM_QUESTION_COUNT = 10;
const EXAM_PASS = 7;

// 級の設定を練習と同じ形にする
function settingsFromLevel(level) {
  return {
    count: level.count,
    digits: level.digits,
    timing: "total",
    intervalMs: Math.round((level.totalSec * 1000) / level.count),
    totalMs: Math.round(level.totalSec * 1000),
    minus: false,
    comma: level.digits >= 4,
  };
}

// 競技サバイバルの何問目の設定を出す
function survivalSpec(questionNo) {
  if (questionNo <= 5) {
    const counts = [3, 5, 8, 12, 15];
    return spec(2, counts[questionNo - 1], 3);
  }
  if (questionNo <= 10) {
    const counts = [5, 8, 10, 12, 15];
    return spec(3, counts[questionNo - 6], 3);
  }
  const totalSec = Math.max(0.8, 2.7 - (questionNo - 11) * 0.3);
  return spec(3, 15, totalSec);
}

// 桁・口・秒から設定をつくる
function spec(digits, count, totalSec) {
  return {
    count,
    digits,
    timing: "total",
    intervalMs: Math.round((totalSec * 1000) / count),
    totalMs: Math.round(totalSec * 1000),
    minus: false,
    comma: false,
  };
}
