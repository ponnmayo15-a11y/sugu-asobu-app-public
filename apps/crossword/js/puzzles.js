const SIZE = 5;
const BLACK = "#";

// 最初の1問。こじつけのカギは使わない
const PUZZLE = {
  id: "harukaze-1",
  level: "やさしい",
  grid: ["はるかぜ#", "な###ね", "すし##こ", "##いぬ#", "やま###"],
  words: [
    {
      id: "a1",
      dir: "across",
      r: 0,
      c: 0,
      num: 1,
      answer: "はるかぜ",
      clue: "春にふく、やさしい風",
      hint: "季節の名前と、空をうごくものをつなげます",
      meaning: "春に吹く風",
    },
    {
      id: "d1",
      dir: "down",
      r: 0,
      c: 0,
      num: 1,
      answer: "はなす",
      clue: "口でことばを出すこと",
      hint: "「きく」の反対です",
      meaning: "口でことばを出すこと",
    },
    {
      id: "d2",
      dir: "down",
      r: 1,
      c: 4,
      num: 2,
      answer: "ねこ",
      clue: "にゃあとなく、小さな動物",
      hint: "あしが4本で、ねずみがすきです",
      meaning: "にゃあとなく小さな動物",
    },
    {
      id: "a3",
      dir: "across",
      r: 2,
      c: 0,
      num: 3,
      answer: "すし",
      clue: "しゃりにさかななどをのせる料理",
      hint: "おまつりやお弁当でもよく出ます",
      meaning: "しゃりにさかななどをのせる料理",
    },
    {
      id: "a4",
      dir: "across",
      r: 3,
      c: 2,
      num: 4,
      answer: "いぬ",
      clue: "わんとほえる、人の友だちにされる動物",
      hint: "さんぽがすきです",
      meaning: "わんとほえる、人の友だちになる動物",
    },
    {
      id: "a5",
      dir: "across",
      r: 4,
      c: 0,
      num: 5,
      answer: "やま",
      clue: "高くて、のぼるところ",
      hint: "ふもとからてっぺんまであるものです",
      meaning: "高くて、のぼるところ",
    },
  ],
};

const KANA_COLS = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "ゆ", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "を", "ん"],
];

const DAKU = {
  か: "が",
  き: "ぎ",
  く: "ぐ",
  け: "げ",
  こ: "ご",
  さ: "ざ",
  し: "じ",
  す: "ず",
  せ: "ぜ",
  そ: "ぞ",
  た: "だ",
  ち: "ぢ",
  つ: "づ",
  て: "で",
  と: "ど",
  は: "ば",
  ひ: "び",
  ふ: "ぶ",
  へ: "べ",
  ほ: "ぼ",
};

const HANDAKU = { は: "ぱ", ひ: "ぴ", ふ: "ぷ", へ: "ぺ", ほ: "ぽ" };
const DAKU_BACK = Object.fromEntries(
  Object.entries(DAKU).map(([a, b]) => [b, a])
);
const HANDAKU_BACK = Object.fromEntries(
  Object.entries(HANDAKU).map(([a, b]) => [b, a])
);
