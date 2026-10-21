(() => {
  "use strict";

  const stages = ["A", "B", "C"];
  const labels = { A: "보기", B: "첫소리", C: "스스로" };
  const sessionKey = document.body.dataset.session || "session01";
  const storageKey = `onq-step5-progression:${sessionKey}`;
  const completed = new Set();
  let advanceTimer = 0;
  let dialog = null;

  const settings = loadSettings();

  function loadSettings() {
    const defaults = { mode: "auto", stage: "A" };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      return {
        mode: saved?.mode === "manual" ? "manual" : "auto",
        stage: stages.includes(saved?.stage) ? saved.stage : defaults.stage
      };
    } catch (_) {
      return defaults;
    }
  }

  function saveSettings() {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch (_) {}
  }

  function currentState() {
    return window.ONQ_STEP5_WORKSHEET?.getState?.() || { stage: settings.stage, pack: "read" };
  }

  function setStage(stage, source = "settings") {
    if (!stages.includes(stage)) return;
    window.clearTimeout(advanceTimer);
    advanceTimer = 0;
    settings.stage = stage;
    saveSettings();
    window.ONQ_STEP5_WORKSHEET?.setStage?.(stage);
    window.dispatchEvent(new CustomEvent("oncuvate:worksheet-progression", {
      detail: { mode: settings.mode, stage, source }
    }));
  }

  function announce(message) {
    let live = document.querySelector(".ws-progression-live");
    if (!live) {
      live = document.createElement("div");
      live.className = "ws-progression-live sr-only";
      live.setAttribute("aria-live", "polite");
      document.body.append(live);
    }
    live.textContent = "";
    window.setTimeout(() => { live.textContent = message; }, 20);
  }

  function updateControls() {
    const root = document.querySelector(".ws-step5");
    if (!root) return;
    const state = currentState();
    settings.stage = stages.includes(state.stage) ? state.stage : settings.stage;
    root.dataset.wsProgression = settings.mode;

    const toolbar = root.querySelector(".ws-toolbar-actions");
    if (toolbar && !toolbar.querySelector(".ws-settings-button")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ws-settings-button";
      button.dataset.wspAction = "open";
      button.setAttribute("aria-haspopup", "dialog");
      button.innerHTML = '<span class="ws-settings-icon" aria-hidden="true"></span><span>설정</span>';
      toolbar.append(button);
    }

    const tabs = root.querySelector(".ws-stage-tabs");
    if (tabs && !tabs.querySelector(".ws-stage-heading")) {
      const heading = document.createElement("div");
      heading.className = "ws-stage-heading";
      tabs.prepend(heading);
    }
    const heading = tabs?.querySelector(".ws-stage-heading");
    const headingMarkup = `<strong>쓰기 순서</strong><small>${settings.mode === "auto" ? "완성하면 다음 단계" : "직접 선택"}</small>`;
    if (heading && heading.innerHTML !== headingMarkup) heading.innerHTML = headingMarkup;

    tabs?.querySelectorAll('[data-ws-action="stage"]').forEach(button => {
      const stage = button.dataset.wsStage;
      button.classList.toggle("is-finished", completed.has(`${state.pack}:${stage}`));
      button.title = settings.mode === "auto" ? `${labels[stage]} 단계${stage === state.stage ? " 진행 중" : ""}` : `${labels[stage]} 단계 선택`;
    });
  }

  function closeDialog() {
    if (!dialog) return;
    dialog.remove();
    dialog = null;
    document.querySelector(".ws-settings-button")?.focus();
  }

  function openDialog() {
    closeDialog();
    const state = currentState();
    settings.stage = stages.includes(state.stage) ? state.stage : settings.stage;
    dialog = document.createElement("div");
    dialog.className = "ws-settings-layer";
    dialog.innerHTML = `<section class="ws-settings-panel" role="dialog" aria-modal="true" aria-labelledby="ws-settings-title">
      <header><div><span>활동 설정</span><h2 id="ws-settings-title">쓰기 순서를 정해요</h2></div><button type="button" class="ws-settings-close" data-wsp-action="close" aria-label="설정 닫기">×</button></header>
      <fieldset><legend>진행 방식</legend><div class="ws-setting-options">
        <button type="button" class="${settings.mode === "auto" ? "active" : ""}" data-wsp-action="mode" data-wsp-value="auto" aria-pressed="${settings.mode === "auto"}"><strong>순서대로</strong><small>A를 마치면 B, 다음은 C</small></button>
        <button type="button" class="${settings.mode === "manual" ? "active" : ""}" data-wsp-action="mode" data-wsp-value="manual" aria-pressed="${settings.mode === "manual"}"><strong>직접 선택</strong><small>필요한 단계만 골라서 연습</small></button>
      </div></fieldset>
      <fieldset><legend>시작 단계</legend><div class="ws-setting-stages">
        ${stages.map(stage => `<button type="button" class="${settings.stage === stage ? "active" : ""}" data-wsp-action="stage" data-wsp-value="${stage}" aria-pressed="${settings.stage === stage}"><span>${stage}</span>${labels[stage]}</button>`).join("")}
      </div></fieldset>
      <button type="button" class="ws-settings-done" data-wsp-action="close">이대로 시작</button>
    </section>`;
    document.body.append(dialog);
    dialog.querySelector("button")?.focus();
  }

  function scheduleNext(pack, stage) {
    window.clearTimeout(advanceTimer);
    if (settings.mode !== "auto") return;
    const next = stages[stages.indexOf(stage) + 1];
    if (!next) return;
    advanceTimer = window.setTimeout(() => {
      const state = currentState();
      if (settings.mode !== "auto" || state.pack !== pack || state.stage !== stage) return;
      announce(`${labels[next]} 단계로 이어서 해 볼게요.`);
      setStage(next, "auto_progression");
    }, 900);
  }

  document.addEventListener("click", event => {
    const actionButton = event.target.closest("[data-wsp-action]");
    if (!actionButton) return;
    event.preventDefault();
    event.stopPropagation();
    const action = actionButton.dataset.wspAction;
    if (action === "open") { openDialog(); return; }
    if (action === "close") { closeDialog(); updateControls(); return; }
    if (action === "mode") {
      settings.mode = actionButton.dataset.wspValue === "manual" ? "manual" : "auto";
      window.clearTimeout(advanceTimer);
      saveSettings();
      openDialog();
      updateControls();
      return;
    }
    if (action === "stage") {
      setStage(actionButton.dataset.wspValue, "settings");
      openDialog();
    }
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && dialog) closeDialog();
  });

  window.addEventListener("oncuvate:event", event => {
    const detail = event.detail || {};
    if (detail.activity_id !== "support.printable.cloze") return;
    if (detail.event_type === "worksheet_stage_change" && stages.includes(detail.worksheet_stage)) {
      settings.stage = detail.worksheet_stage;
      saveSettings();
      updateControls();
    }
    if (detail.event_type === "activity_complete" && detail.completion === "all_items") {
      const key = `${detail.data_pack}:${detail.worksheet_stage}`;
      completed.add(key);
      updateControls();
      scheduleNext(detail.data_pack, detail.worksheet_stage);
    }
  });

  const observer = new MutationObserver(() => requestAnimationFrame(updateControls));
  observer.observe(document.getElementById("app"), { childList: true, subtree: true });

  const boot = window.setInterval(() => {
    if (!window.ONQ_STEP5_WORKSHEET) return;
    window.clearInterval(boot);
    const state = currentState();
    if (state.stage !== settings.stage) window.ONQ_STEP5_WORKSHEET.setStage(settings.stage);
    updateControls();
  }, 50);
})();




