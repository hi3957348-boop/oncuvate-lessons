(() => {
  "use strict";

  let scheduled = false;

  function loadBarFix() {
    if (document.querySelector('link[data-module="common-shell-barfix-final"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "release/common-shell-barfix-final.css";
    link.dataset.module = "common-shell-barfix-final";
    document.head.append(link);
  }

  function refreshAnnotationEligibility() {
    scheduled = false;
    const studio = document.querySelector(".studio");
    const shell = studio?.querySelector(":scope > .activity-shell");
    if (!shell) return;

    const step = Number(document.querySelector(".step-btn.active")?.dataset.step ?? -1);
    const modalOpen = Boolean(document.querySelector(".modal-backdrop, [role='dialog'][aria-modal='true']"));
    const locked = studio.dataset.platformLocked === "true" || studio.classList.contains("platform-locked");
    // 표지에는 판서를 두지 않는다 — 읽을 것도 짚을 것도 없는 화면이다.
    // (표지는 차례 버튼이 없어 step이 -1로 잡힌다)
    const eligible = step >= 1 && step <= 5 && !modalOpen && !locked;
    shell.classList.toggle("annotation-eligible", eligible);
    if (shell.dataset.annotationEligible !== String(eligible)) shell.dataset.annotationEligible = String(eligible);

    const launcher = shell.querySelector(":scope > .annotation-launcher");
    if (launcher) {
      if (launcher.hidden !== !eligible) launcher.hidden = !eligible;
      if (launcher.disabled) launcher.disabled = false;
      if (launcher.getAttribute("aria-hidden") !== String(!eligible)) launcher.setAttribute("aria-hidden", String(!eligible));
      if (launcher.tabIndex !== (eligible ? 0 : -1)) launcher.tabIndex = eligible ? 0 : -1;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refreshAnnotationEligibility);
  }

  loadBarFix();
  new MutationObserver(schedule).observe(document.getElementById("app"), {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-platform-locked"]
  });
  addEventListener("resize", schedule, { passive: true });
  addEventListener("oncuvate:platform-control", schedule);
  schedule();
})();
