let audioCtx = null;

// 音を出してよい状態にする（始めるボタンの直後に呼ぶ）
function unlockSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      audioCtx = audioCtx || new Ctx();
      audioCtx.resume();
    }
  } catch {
    audioCtx = null;
  }
  try {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
      const warm = new SpeechSynthesisUtterance("");
      warm.volume = 0;
      speechSynthesis.speak(warm);
    }
  } catch {
    // 読めなくても文字で遊べる
  }
}

// マスが光ったときの短い音
function playTick() {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 640;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch {
    // 音なしでも進める
  }
}

// かなを読む。読めなければ何もしない（画面に文字がある）
function speakKana(kana) {
  if (!window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const talk = new SpeechSynthesisUtterance(kana);
    talk.lang = "ja-JP";
    talk.rate = 1.05;
    talk.volume = 1;
    speechSynthesis.speak(talk);
  } catch {
    // 読めなくても文字で遊べる
  }
}

// 端末が振動できるなら、短く鳴らす
function tapBuzz() {
  try {
    if (navigator.vibrate) navigator.vibrate(18);
  } catch {
    // 振動なしでも進める
  }
}
