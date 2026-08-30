// 開いたページを、管理人用のシートに1行足す。失敗しても遊びは止めない。
(function sendAccess() {
  try {
    if (localStorage.getItem("sugu-skip-log") === "1") return;
  } catch (e) {
    /* 読めなくても記録する */
  }
  const url = window.ACCESS_LOG_URL;
  if (!url) return;
  const body = JSON.stringify({
    page: String(location.pathname || "/").slice(0, 200),
    screen: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
  });
  try {
    fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body,
      keepalive: true,
    });
  } catch (e) {
    /* 記録できなくても続行 */
  }
})();
