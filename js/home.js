// ホームのアプリ一覧を、一覧データから描く
function renderApps() {
  const list = document.getElementById("app-list");
  if (!list) return;
  list.innerHTML = APPS.map(cardHtml).join("");
}

// 1つのアプリカードのHTMLをつくる
function cardHtml(app) {
  const ready = app.ready;
  const badge = ready ? "" : '<span class="badge badge-wait">準備中</span>';
  const kicker = app.search
    ? `<span class="app-kicker">${escapeHtml(app.search)}</span>`
    : "";
  const thumb = app.thumb
    ? `<img class="app-thumb" src="${escapeHtml(app.thumb)}" alt="" width="88" height="88" />`
    : "";
  return `
    <a class="app-card ${ready ? "is-ready" : "is-wait"}" href="${app.href}">
      ${thumb}
      <span class="app-body">
        ${kicker}
        <span class="app-name">${escapeHtml(app.name)}</span>
        <span class="app-desc">${escapeHtml(app.desc)}</span>
        ${badge}
      </span>
    </a>
  `;
}

// HTMLに入れる文字を安全にする
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

renderApps();
