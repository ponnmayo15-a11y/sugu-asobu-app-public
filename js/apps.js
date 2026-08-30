// アプリ一覧。あとから足すときは、ここを直してフォルダを1つ足す。
const APPS = [
  {
    id: "flash-anzan",
    name: "フラッシュ暗算",
    search: "暗算・そろばん",
    desc: "数字がつぎつぎ出る。足し算。",
    href: "apps/flash-anzan/index.html",
    ready: true,
  },
  {
    id: "nanpure",
    name: "ナンプレ",
    search: "数独",
    desc: "マスをうめるパズル。",
    href: "apps/nanpure/index.html",
    ready: false,
  },
  {
    id: "prize-puzzle",
    name: "懸賞パズル",
    search: "",
    desc: "いまは準備中。抽選はまだない。",
    href: "apps/prize-puzzle/index.html",
    ready: false,
  },
  {
    id: "easy-calc",
    name: "かんたん計算ゲーム",
    search: "計算",
    desc: "やさしい計算。",
    href: "apps/easy-calc/index.html",
    ready: false,
  },
];
