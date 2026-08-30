// 1タップで結果を共有する。使えなければコピーする。
async function shareResult({ title, text, url }) {
  const body = url ? `${text}\n${url}` : text;
  try {
    if (navigator.share) {
      await navigator.share({ title, text: body, url });
      return "shared";
    }
  } catch (err) {
    if (err && err.name === "AbortError") return "cancel";
  }
  return copyText(body);
}

// 文字をコピーする
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    window.prompt("この文字をコピーしてください", text);
    return "prompt";
  }
}

// 結果カードの絵をつくる
function drawResultCard(play) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4eb6e0";
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 48px sans-serif";
  ctx.fillText("すぐ・あそび", 80, 120);
  ctx.font = "700 72px sans-serif";
  ctx.fillText("フラッシュ暗算", 80, 220);
  paintResult(ctx, play);
  return canvas;
}

// カードの正解・内訳を描く
function paintResult(ctx, play) {
  const ok = play.correct;
  ctx.fillStyle = ok ? "#1b7f6a" : "#c1121f";
  ctx.font = "700 96px sans-serif";
  ctx.fillText(ok ? "せいかい" : "おしい", 80, 380);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 54px sans-serif";
  ctx.fillText(`あなたの答え  ${play.answer}`, 80, 500);
  ctx.fillText(`せいかい      ${play.sum}`, 80, 580);
  ctx.font = "400 40px sans-serif";
  ctx.fillStyle = "#e8f6fc";
  ctx.fillText(`${play.settings.count}口  ${play.settings.digits}桁`, 80, 680);
  if (play.survivalFall) {
    ctx.fillText(`${play.survivalFall}問目で落ちた`, 80, 750);
  }
}

// 結果カードを画像として共有する
async function shareCardImage(play, url) {
  const canvas = drawResultCard(play);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (blob && navigator.canShare) {
    const file = new File([blob], "sugu-asobu.png", { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "すぐ・あそび フラッシュ暗算",
          text: url || "",
        });
        return "shared";
      } catch (err) {
        if (err && err.name === "AbortError") return "cancel";
      }
    }
  }
  return shareResult({
    title: "すぐ・あそび フラッシュ暗算",
    text: resultText(play),
    url,
  });
}

// 共有用の短い文章
function resultText(play) {
  const mark = play.correct ? "せいかい" : "おしい";
  const nums = play.numbers.map((n) => formatNumber(n, play.settings.comma));
  let text = `すぐ・あそび フラッシュ暗算\n${mark}\n答え ${play.answer} / せいかい ${play.sum}\n${nums.join(" + ").replaceAll("+ -", "- ")}\n= ${sumNumbers(play.numbers)}`;
  if (play.survivalFall) text += `\n${play.survivalFall}問目で落ちた（${play.survivalCleared}問クリア）`;
  return text;
}
