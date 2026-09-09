(() => {
  "use strict";

  const CSS_HREF = "release/common-ui-step5-v23.css?rev=20260822c";
  if (!document.querySelector('link[data-module="common-ui-step5-v23"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_HREF;
    link.dataset.module = "common-ui-step5-v23";
    document.head.append(link);
  }

  let scheduled = false;

  function enhanceStep5() {
    scheduled = false;
    const root = document.querySelector(".ws-step5");
    if (!root) return;
    root.dataset.wsUiFinal = "v23";

    const settings = root.querySelector(".ws-settings-button");
    if (settings && settings.dataset.wsIconOnly !== "true") {
      settings.dataset.wsIconOnly = "true";
      settings.setAttribute("aria-label", "활동 설정");
      settings.setAttribute("title", "활동 설정");
      settings.innerHTML = '<svg class="ws-settings-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.25"></circle><path d="M12 2.75v2.1M12 19.15v2.1M2.75 12h2.1M19.15 12h2.1M5.46 5.46l1.48 1.48M17.06 17.06l1.48 1.48M18.54 5.46l-1.48 1.48M6.94 17.06l-1.48 1.48"></path><circle cx="12" cy="12" r="7.15"></circle></svg>';
    }

    root.querySelectorAll(".ws-audio").forEach(button => {
      if (button.dataset.wsIconOnly === "true") return;
      button.dataset.wsIconOnly = "true";
      button.setAttribute("aria-label", "문장 듣기");
      button.setAttribute("title", "문장 듣기");
      button.innerHTML = '<span aria-hidden="true">▶</span>';
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhanceStep5);
  }

  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  schedule();
})();
