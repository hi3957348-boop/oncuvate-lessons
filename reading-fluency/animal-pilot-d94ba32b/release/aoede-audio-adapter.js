(() => {
  "use strict";

  let active = null;
  const normalize = value => String(value || "").trim().replace(/\s+/g, " ");

  function resolve(text) {
    const map = window.ONQ_AOEDE_AUDIO_MAP || {};
    const exact = normalize(text);
    if (map[exact]) return map[exact];
    const withoutFinalPunctuation = exact.replace(/[.!?]+$/u, "");
    const key = Object.keys(map).find(item => item.replace(/[.!?]+$/u, "") === withoutFinalPunctuation);
    return key ? map[key] : "";
  }

  function stop() {
    if (!active) return;
    active.pause();
    active.removeAttribute("src");
    active.load();
    active = null;
  }

  function play(text, options = {}) {
    const source = resolve(text);
    if (!source) return false;
    stop();
    const audio = new Audio(source);
    audio.preload = "auto";
    audio.playbackRate = 1.1;
    audio.preservesPitch = true;
    audio.mozPreservesPitch = true;
    audio.webkitPreservesPitch = true;
    audio.addEventListener("ended", () => {
      if (active === audio) active = null;
      options.onended?.();
    }, { once: true });
    audio.addEventListener("error", () => {
      if (active === audio) active = null;
      options.onerror?.();
    }, { once: true });
    active = audio;
    audio.play().catch(() => {
      if (active === audio) active = null;
      options.onerror?.();
    });
    return true;
  }

  window.ONQ_AUDIO = Object.freeze({ play, stop, resolve, playbackRate: 1.1, voice: "Aoede" });
})();

