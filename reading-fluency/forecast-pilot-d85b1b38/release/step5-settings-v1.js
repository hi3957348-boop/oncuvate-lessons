(() => {
  "use strict";

  function addStyle(href, module) {
    if (document.querySelector(`link[data-module="${module}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.module = module;
    document.head.append(link);
  }

  function load(src, module, done) {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.module = module;
    script.onload = done || null;
    script.onerror = () => console.error(`[Oncuvate] ${src} 파일을 불러오지 못했습니다.`);
    document.body.append(script);
  }

  addStyle("release/step5-sentence-audio-v1.css", "step5-sentence-audio-v1");
  addStyle("release/step5-compact-controls-v2.css?rev=20260824e", "step5-compact-controls-v2");

  load("release/step5-settings-core-v1.js", "step5-settings-core-v1", () => {
    load("release/step5-sentence-audio-v1.js", "step5-sentence-audio-v1", () => {
      load("release/step5-compact-controls-v2.js", "step5-compact-controls-v2");
    });
  });
})();
