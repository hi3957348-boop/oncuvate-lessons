(() => {
  "use strict";
  const soundKey = "oncuvate:sentence-sound";
  let soundOn = localStorage.getItem(soundKey) !== "off";
  let lastAutoKey = "";
  let scheduled = false;

  function assessmentOn(layout) {
    return Boolean(layout.querySelector('[data-speech-mode="on"].active,[data-speech-mode="on"][aria-pressed="true"]'));
  }
  function setToggle(utility, kind, enabled) {
    utility.querySelectorAll(`[data-sentence-toggle="${kind}"]`).forEach(button => {
      button.setAttribute("aria-pressed", String((button.dataset.value === "on") === enabled));
    });
  }
  function autoPlay(layout) {
    if (!soundOn) return;
    const sentence = layout.querySelector(".reading-sentence")?.textContent?.trim();
    const progress = layout.querySelector(".sentence-progress")?.textContent?.trim();
    if (!sentence) return;
    const key = `${document.body.dataset.session || ""}|${progress || ""}|${sentence}`;
    if (key === lastAutoKey) return;
    lastAutoKey = key;
    const source = layout.querySelector('[data-action="speak-sentence"]');
    if (source) window.setTimeout(() => source.click(), 120);
  }
  function enhance() {
    scheduled = false;
    const layout = document.querySelector(".activity-view > .sentence-layout");
    if (!layout) return;
    const view = layout.parentElement;
    view.classList.add("sentence-focus-view");
    const evaluated = assessmentOn(layout);
    let utility = view.querySelector(":scope > .sentence-utility-bar");
    if (!utility) {
      utility = document.createElement("div");
      utility.className = "sentence-utility-bar";
      utility.innerHTML = `<div class="sentence-utility-group"><span class="sentence-utility-label">문장 소리</span><span class="sentence-segmented" role="group" aria-label="문장 소리"><button type="button" data-sentence-toggle="sound" data-value="on">ON</button><button type="button" data-sentence-toggle="sound" data-value="off">OFF</button></span></div>`;
      view.insertBefore(utility, layout);
    }
    setToggle(utility, "sound", soundOn);
    setToggle(utility, "assessment", evaluated);
    const panel = layout.querySelector(".sentence-panel");
    if (panel) {
      let action = panel.querySelector(":scope > .sentence-main-action");
      if (!action) {
        action = document.createElement("button");
        action.type = "button";
        action.className = "sentence-main-action";
        const intervention = panel.querySelector(".intervention-card");
        panel.insertBefore(action, intervention || panel.querySelector(".feedback-line"));
      }
      // 나누어 읽기는 API 평가를 하지 않는다 — 늘 「읽었어요」 하나다.
      const label = "읽었어요";
      action.dataset.mode = "manual";
      if (action.textContent !== label) action.textContent = label;
      action.setAttribute("aria-label", "이 문장을 읽었어요");
    }
    autoPlay(layout);
  }
  document.addEventListener("click", event => {
    const toggle = event.target.closest("[data-sentence-toggle]");
    if (toggle) {
      const enabled = toggle.dataset.value === "on";
      if (toggle.dataset.sentenceToggle === "sound") {
        soundOn = enabled;
        localStorage.setItem(soundKey, enabled ? "on" : "off");
        if (enabled) lastAutoKey = "";
        enhance();
        return;
      }
      document.querySelector(`.sentence-layout [data-speech-mode="${enabled ? "on" : "off"}"]`)?.click();
      return;
    }
    const action = event.target.closest(".sentence-main-action");
    if (!action) return;
    const selector = action.dataset.mode === "assessment" ? '[data-action="toggle-sentence-reading"]' : '[data-action="sentence-done"]';
    document.querySelector(`.sentence-layout ${selector}`)?.click();
  });
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  }).observe(document.body, { childList: true, subtree: true });
  enhance();
})();
