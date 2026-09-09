(() => {
  "use strict";

  let scheduled = false;

  function state() {
    return window.ONQ_STEP5_WORKSHEET?.getState?.() || { pack: "read", stage: "A", soundEnabled: true };
  }

  function placePopover() {
    const layer = document.querySelector(".ws-settings-layer");
    const panel = layer?.querySelector(".ws-settings-panel");
    const trigger = document.querySelector(".ws-settings-button");
    if (!layer || !panel || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(374, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const top = Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - panel.offsetHeight - 12));
    panel.style.setProperty("--ws-popover-left", `${left}px`);
    panel.style.setProperty("--ws-popover-top", `${top}px`);
  }

  function optionControls(current) {
    const packButtons = [...document.querySelectorAll('.ws-pack-tabs [data-ws-action="pack"]')];
    const packs = packButtons.length ? packButtons.map(button => ({ key: button.dataset.wsPack, label: button.textContent.trim() })) : [
      { key: "read", label: "읽은 문장" },
      { key: "transfer", label: "새 문장" }
    ];
    const signature = `${current.pack}|${current.soundEnabled ? "on" : "off"}`;
    return `<fieldset class="ws-settings-content" data-ws-settings-signature="${signature}"><legend>활동 내용</legend>
      <div class="ws-settings-row"><span>문장</span><div>${packs.map(pack => `<button type="button" class="${current.pack === pack.key ? "active" : ""}" data-ws-action="pack" data-ws-pack="${pack.key}" aria-pressed="${current.pack === pack.key}">${pack.label}</button>`).join("")}</div></div>
      <div class="ws-settings-row"><span>소리</span><div><button type="button" class="${current.soundEnabled ? "active" : ""}" data-ws-action="sound" data-ws-sound="on" aria-pressed="${current.soundEnabled}">켬</button><button type="button" class="${!current.soundEnabled ? "active" : ""}" data-ws-action="sound" data-ws-sound="off" aria-pressed="${!current.soundEnabled}">끔</button></div></div>
      <button type="button" class="ws-settings-print" data-ws-action="print">인쇄하기</button>
    </fieldset>`;
  }

  function enhance() {
    scheduled = false;
    const root = document.querySelector(".ws-step5");
    if (root) root.dataset.wsCompactSettings = "true";
    const panel = document.querySelector(".ws-settings-panel");
    if (panel) {
      const current = state();
      const signature = `${current.pack}|${current.soundEnabled ? "on" : "off"}`;
      const old = panel.querySelector(".ws-settings-content");
      if (old?.dataset.wsSettingsSignature !== signature) {
        const markup = optionControls(current);
        if (old) old.outerHTML = markup;
        else panel.querySelector("header")?.insertAdjacentHTML("afterend", markup);
      }
      placePopover();
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  }

  document.addEventListener("pointerdown", event => {
    const layer = event.target.closest(".ws-settings-layer");
    if (layer && event.target === layer) layer.querySelector('[data-wsp-action="close"]')?.click();
  }, true);

  window.addEventListener("resize", placePopover);
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  schedule();
})();
