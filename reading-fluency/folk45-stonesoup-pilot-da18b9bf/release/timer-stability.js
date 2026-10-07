(() => {
  let enabled = false;
  let seconds = 30;
  let interval = null;
  let scheduled = false;

  function activeGame1() {
    return (document.querySelector(".step-btn.active")?.dataset.stepId || "") === "game1";
  }

  function apply() {
    scheduled = false;
    const controls = document.querySelector(".override-game1 .override-controls");
    const button = controls?.querySelector('[data-override-action="timer"]');
    if (!controls || !button) return;
    button.classList.toggle("active", enabled);
    button.textContent = `제한시간 ${enabled ? "켬" : "끔"}`;
    let counter = controls.querySelector(".timer-stable-count");
    if (enabled && !counter) {
      counter = document.createElement("span");
      counter.className = "compact-progress timer-stable-count";
      controls.appendChild(counter);
    }
    if (counter) {
      counter.textContent = `${seconds}초`;
      counter.hidden = !enabled;
    }
  }

  function ensureInterval() {
    if (interval || !enabled) return;
    interval = setInterval(() => {
      if (!enabled) { clearInterval(interval); interval = null; return; }
      if (!activeGame1()) return;
      seconds -= 1;
      if (seconds <= 0) {
        seconds = 30;
        window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: { event_type: "retry", activity_id: "intervention.word_chunk", reason: "time_elapsed", timestamp: new Date().toISOString() } }));
      }
      apply();
    }, 1000);
  }

  document.addEventListener("click", event => {
    const button = event.target.closest('[data-override-action="timer"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    enabled = !enabled;
    seconds = 30;
    apply();
    ensureInterval();
  }, true);

  const observer = new MutationObserver(() => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(apply); }
  });
  observer.observe(document.getElementById("app"), { childList: true, subtree: true });
})();
