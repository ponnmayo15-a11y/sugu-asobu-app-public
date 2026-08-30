// 数字を順番に点滅させる。途中で止められる。
function playFlash(numbers, intervalMs, hooks) {
  let i = 0;
  let timer = 0;
  const blank = Math.max(50, Math.round(intervalMs * 0.12));
  const show = Math.max(80, intervalMs - blank);

  function tick() {
    if (i >= numbers.length) {
      hooks.onDone();
      return;
    }
    hooks.onShow(numbers[i], i);
    timer = window.setTimeout(() => {
      hooks.onBlank();
      i += 1;
      timer = window.setTimeout(tick, blank);
    }, show);
  }

  hooks.onReady();
  timer = window.setTimeout(tick, 1180);

  return {
    stop() {
      window.clearTimeout(timer);
    },
  };
}

// 指定ミリ秒待つ
function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
