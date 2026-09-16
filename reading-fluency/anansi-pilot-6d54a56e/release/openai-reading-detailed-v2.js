(() => {
  "use strict";

  let streamPromise = null;
  let capture = null;

  function getStream() {
    if (!streamPromise) {
      streamPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      }).catch(error => {
        streamPromise = null;
        throw error;
      });
    }
    return streamPromise;
  }

  function mergeChunks(chunks) {
    const size = chunks.reduce((sum, item) => sum + item.length, 0);
    const output = new Float32Array(size);
    let offset = 0;
    chunks.forEach(item => { output.set(item, offset); offset += item.length; });
    return output;
  }

  function resample(input, sourceRate, targetRate = 16000) {
    if (sourceRate === targetRate) return input;
    const ratio = sourceRate / targetRate;
    const length = Math.max(1, Math.round(input.length / ratio));
    const output = new Float32Array(length);
    for (let index = 0; index < length; index += 1) {
      const position = index * ratio;
      const left = Math.floor(position);
      const right = Math.min(input.length - 1, left + 1);
      const mix = position - left;
      output[index] = input[left] * (1 - mix) + input[right] * mix;
    }
    return output;
  }

  function wavBlob(samples, sampleRate = 16000) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const write = (offset, text) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    write(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let index = 0; index < samples.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, samples[index]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(reader.error || new Error("audio_encoding_failed"));
      reader.readAsDataURL(blob);
    });
  }

  function stopGraph(active) {
    if (!active) return;
    window.clearTimeout(active.maxTimer);
    try { window.dispatchEvent(new CustomEvent("onq:mic-level", { detail: { level: 0, voiced: false, off: true } })); } catch (_) {}
    try { active.source.disconnect(); } catch (_) {}
    try { active.processor.disconnect(); } catch (_) {}
    try { active.mute.disconnect(); } catch (_) {}
    active.context.close().catch(() => {});
  }

  async function start(options = {}) {
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext && !window.webkitAudioContext) {
      throw new Error("recording_not_supported");
    }
    if (capture) return;
    const stream = await getStream();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    await context.resume();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const mute = context.createGain();
    mute.gain.value = 0;
    source.connect(processor);
    processor.connect(mute);
    mute.connect(context.destination);

    const scope = options.scope === "sentence" ? "sentence" : "paragraph";
    const silenceMs = Number(options.silence_ms) || (scope === "sentence" ? 2300 : 4000);
    const active = {
      scope,
      target: String(options.target || ""),
      rules: Array.isArray(options.rules) ? options.rules : [],
      silenceMs,
      context,
      source,
      processor,
      mute,
      chunks: [],
      startedAt: performance.now(),
      speakingMs: 0,
      speechStarted: false,
      lastVoiceAt: 0,
      silenceStart: 0,
      pauses: [],
      autoDispatched: false,
      maxTimer: 0,
    };
    capture = active;

    processor.onaudioprocess = event => {
      if (capture !== active) return;
      const frame = new Float32Array(event.inputBuffer.getChannelData(0));
      active.chunks.push(frame);
      let sum = 0;
      for (let index = 0; index < frame.length; index += 1) sum += frame[index] * frame[index];
      const rms = Math.sqrt(sum / Math.max(1, frame.length));
      const now = performance.now();
      const frameMs = frame.length / context.sampleRate * 1000;
      const voiced = rms >= 0.018;
      // 표시등용 — 「지금 소리가 실제로 잡히고 있다」를 아이가 눈으로 보게 한다.
      // 값만 흘리고 그리기는 화면 쪽이 한다. rms 0.11쯤이면 또렷한 말소리라 9배로 편다.
      try { window.dispatchEvent(new CustomEvent("onq:mic-level", { detail: { level: Math.min(1, rms * 9), voiced, scope: active.scope } })); } catch (_) {}
      if (voiced) {
        active.speakingMs += frameMs;
        if (active.speechStarted && active.silenceStart) {
          const duration = now - active.silenceStart;
          if (duration >= 350) active.pauses.push({ start_ms: Math.round(active.silenceStart - active.startedAt), duration_ms: Math.round(duration) });
        }
        active.speechStarted = true;
        active.lastVoiceAt = now;
        active.silenceStart = 0;
      } else if (active.speechStarted) {
        if (!active.silenceStart) active.silenceStart = now;
        if (!active.autoDispatched && now - active.lastVoiceAt >= active.silenceMs) {
          active.autoDispatched = true;
          window.dispatchEvent(new CustomEvent("onq:reading-auto-stop", { detail: { scope: active.scope } }));
        }
      }
    };
    active.maxTimer = window.setTimeout(() => {
      if (capture === active && !active.autoDispatched) {
        active.autoDispatched = true;
        window.dispatchEvent(new CustomEvent("onq:reading-auto-stop", { detail: { scope: active.scope, reason: "maximum_duration" } }));
      }
    }, scope === "sentence" ? 30000 : 90000);
  }

  async function finish(input = {}) {
    if (!capture) throw new Error("recording_not_started");
    const active = capture;
    capture = null;
    stopGraph(active);
    const options = typeof input === "string" ? { target: input } : (input || {});
    const target = String(options.target || active.target || "").trim();
    const scope = options.scope === "sentence" || active.scope === "sentence" ? "sentence" : "paragraph";
    const rules = Array.isArray(options.rules) ? options.rules : active.rules;
    const totalDuration = Math.round(performance.now() - active.startedAt);

    const samples = resample(mergeChunks(active.chunks), active.context.sampleRate, 16000);
    const audio = wavBlob(samples, 16000);
    const audioData = await blobToBase64(audio);
    const response = await fetch("__assess/analyze-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        target,
        rules,
        total_duration_ms: totalDuration,
        speaking_duration_ms: Math.round(active.speakingMs),
        pauses: active.pauses,
        target_syllables: (target.match(/[가-힣]/g) || []).length,
        sample_rate: 16000,
        audio_data: audioData,
      }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "reading_analysis_failed");
    return payload;
  }

  function release() {
    if (capture) {
      stopGraph(capture);
      capture = null;
    }
    if (streamPromise) streamPromise.then(stream => stream.getTracks().forEach(track => track.stop())).catch(() => {});
    streamPromise = null;
  }

  window.ONQ_OPENAI_PARAGRAPH_ASSESSOR = {
    isSupported: () => Boolean(navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext)),
    start,
    finish,
    release,
  };
  window.addEventListener("beforeunload", release, { once: true });
})();
