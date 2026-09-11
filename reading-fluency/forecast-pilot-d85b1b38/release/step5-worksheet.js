(() => {
  "use strict";

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "release/step5-settings-v1.css?rev=20260825r";
  css.dataset.module = "step5-settings-v1";
  document.head.append(css);

  function load(src, module, done) {
    const script = document.createElement("script");
    script.src = src;
    script.dataset.module = module;
    script.onload = done || null;
    script.onerror = () => console.error(`[Oncuvate] ${src} 파일을 불러오지 못했습니다.`);
    document.body.append(script);
  }

  load("release/step5-worksheet-core-v1.js?rev=20260823w", "step5-worksheet-core-v1", () => {
    load("release/step5-settings-v1.js?rev=20260825n", "step5-settings-v1");
  });
})();
