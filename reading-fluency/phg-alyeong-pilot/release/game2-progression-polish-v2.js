(() => {
  "use strict";
  const maxHints = { 1:3, 2:3, 3:2, 4:2, 5:1 };
  let scheduled = false;

  function applyPolish() {
    scheduled = false;
    const game = document.querySelector(".progression-game2");
    if (!game) return;
    const level = Number(game.dataset.level || 1);
    const hint = game.querySelector('[data-g2p-action="hint"]');
    if (hint) {
      // 남은 하트는 **게임 상태에서** 읽는다. data-hints-left는 판을 그리는 로더에 따라
      // 붙기도 안 붙기도 하는데, 없으면 0으로 읽혀 처음부터 전부 빈 하트가 됐다.
      const live = window.ONQ_GAME2_PROGRESSION_TEST?.state?.();
      const attr = hint.dataset.hintsLeft;
      const maximum = maxHints[level] || 3;
      const remaining = Number.isFinite(Number(live?.hints)) ? Number(live.hints)
                      : attr != null ? Number(attr) : maximum;
      const filled = Math.max(0, Math.min(maximum, remaining));
      // 한 번만 그리면 힌트를 써도 하트가 안 줄어든다 — 값이 바뀌면 다시 그린다.
      if (hint.dataset.heartsShown !== String(filled)) {
        const hearts = Array.from({ length:maximum }, (_, index) =>
          `<span class="g2p-heart ${index >= filled ? "used" : ""}">♥</span>`).join("");
        hint.innerHTML = `<span class="g2p-hint-label">힌트</span><span class="g2p-hearts" aria-hidden="true">${hearts}</span>`;
        hint.setAttribute("aria-label", `힌트 ${filled}개 남음`);
        hint.dataset.heartsShown = String(filled);
      }
    }
    const reset = game.querySelector('[data-g2p-action="reset"]');
    if (reset) reset.textContent = "재시작";
  }

  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyPolish);
  }).observe(document.getElementById("app") || document.body, { childList:true, subtree:true });
  applyPolish();
})();
