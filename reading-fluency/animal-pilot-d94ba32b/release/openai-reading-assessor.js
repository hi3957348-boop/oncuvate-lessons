(() => {
  "use strict";

  const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
  const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const CHO_GROUP = { "ㅋ":"ㄱ", "ㅌ":"ㄷ", "ㅍ":"ㅂ", "ㅊ":"ㅈ" };

  let streamPromise = null;
  let recorder = null;
  let chunks = [];

  function normalizeWord(text, allowFinalM = false) {
    const output = [...String(text || "").normalize("NFC")].map(char => {
      const code = char.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return /[가-힣0-9]/.test(char) ? char : "";
      const cho = Math.floor(code / 588);
      const jung = Math.floor((code % 588) / 28);
      const jong = code % 28;
      return `${CHO_GROUP[CHO[cho]] || CHO[cho]}${["ㅐ","ㅔ"].includes(JUNG[jung]) ? "ㅐ" : JUNG[jung]}${JONG[jong]}`;
    }).join("");
    return allowFinalM && output.endsWith("ㅁ") ? output.slice(0, -1) : output;
  }

  function distanceSimilarity(a, b) {
    if (!a.length || !b.length) return 0;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const held = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
        previous = held;
      }
    }
    return Math.max(0, 1 - row[b.length] / Math.max(a.length, b.length));
  }

  function wordSimilarity(expected, spoken) {
    const normal = distanceSimilarity(normalizeWord(expected), normalizeWord(spoken));
    const finalMAdjusted = distanceSimilarity(normalizeWord(expected, true), normalizeWord(spoken, true));
    return Math.max(normal, finalMAdjusted);
  }

  function alignWords(expectedText, transcript) {
    const expected = String(expectedText || "").trim().split(/\s+/).filter(Boolean);
    const spoken = String(transcript || "").trim().split(/\s+/).filter(Boolean);
    const rows = Array.from({ length: expected.length + 1 }, () => Array(spoken.length + 1).fill(0));
    const ops = Array.from({ length: expected.length + 1 }, () => Array(spoken.length + 1).fill(""));
    for (let i = 1; i <= expected.length; i += 1) { rows[i][0] = i; ops[i][0] = "delete"; }
    for (let j = 1; j <= spoken.length; j += 1) { rows[0][j] = j; ops[0][j] = "insert"; }
    for (let i = 1; i <= expected.length; i += 1) {
      for (let j = 1; j <= spoken.length; j += 1) {
        const similarity = wordSimilarity(expected[i - 1], spoken[j - 1]);
        const choices = [
          [rows[i - 1][j] + 1, "delete"],
          [rows[i][j - 1] + 1, "insert"],
          [rows[i - 1][j - 1] + (similarity >= .75 ? 0 : 1), "match"],
        ].sort((a, b) => a[0] - b[0]);
        rows[i][j] = choices[0][0];
        ops[i][j] = choices[0][1];
      }
    }
    const results = [];
    let i = expected.length, j = spoken.length;
    while (i > 0 || j > 0) {
      const op = ops[i][j];
      if (op === "match") {
        const similarity = wordSimilarity(expected[i - 1], spoken[j - 1]);
        results.push({ expected: expected[i - 1], transcript: spoken[j - 1], correct: similarity >= .75, similarity });
        i -= 1; j -= 1;
      } else if (op === "delete") {
        results.push({ expected: expected[i - 1], transcript: "", correct: false, similarity: 0 });
        i -= 1;
      } else {
        j -= 1;
      }
    }
    return results.reverse();
  }

  function chooseMimeType() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    return candidates.find(type => window.MediaRecorder?.isTypeSupported?.(type)) || "";
  }

  async function getStream() {
    if (!streamPromise) {
      streamPromise = navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      }).catch(error => { streamPromise = null; throw error; });
    }
    return streamPromise;
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("recording_not_supported");
    }
    if (recorder?.state === "recording") return;
    const stream = await getStream();
    chunks = [];
    const mimeType = chooseMimeType();
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
    recorder.start(500);
  }

  async function finish(target) {
    if (!recorder || recorder.state !== "recording") throw new Error("recording_not_started");
    const active = recorder;
    const blob = await new Promise((resolve, reject) => {
      active.onerror = event => reject(event.error || new Error("recording_failed"));
      active.onstop = () => resolve(new Blob(chunks, { type: active.mimeType || "audio/webm" }));
      active.stop();
    });
    recorder = null;
    chunks = [];
    const response = await fetch("__assess/transcribe", {
      method: "POST",
      headers: { "Content-Type": blob.type || "audio/webm" },
      body: blob,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "transcription_failed");
    const transcript = String(payload.text || "").trim();
    const wordResults = alignWords(target, transcript);
    const compared = wordResults.filter(item => item.expected);
    const correctWords = compared.filter(item => item.correct).length;
    const similarity = compared.length ? correctWords / compared.length : 0;
    const errorTokens = compared.filter(item => !item.correct).map(item => item.expected);
    return {
      source: payload.model || "openai_transcription",
      transcript,
      correct: similarity >= .75,
      similarity,
      word_results: wordResults,
      error_tokens: errorTokens,
      token_errors: errorTokens,
    };
  }

  function release() {
    if (recorder?.state === "recording") recorder.stop();
    recorder = null;
    chunks = [];
    if (streamPromise) streamPromise.then(stream => stream.getTracks().forEach(track => track.stop())).catch(() => {});
    streamPromise = null;
  }

  window.ONQ_OPENAI_PARAGRAPH_ASSESSOR = {
    isSupported: () => Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder),
    start,
    finish,
    release,
  };
  window.addEventListener("beforeunload", release, { once: true });
})();
