/* 숨거나 가려진 창에서도 화면 상태가 반영되게 한다.
 *
 * 이 자료의 여러 모듈이 「MutationObserver → requestAnimationFrame → 화면 상태 반영」
 * 구조로 되어 있다(판서 버튼 자격·활동 안내 모달·공통 UI 배치·활동 오버라이드 …).
 * 그런데 브라우저는 **보이지 않는 창에서 rAF를 한 번도 실행하지 않는다.**
 *
 * 그래서 창이 뒤에 있는 동안 그 모듈들이 멈추고, 앞으로 가져와도
 *   `if (scheduled) return`  ← 이미 true로 잠겨 있어 다시 예약되지 않는다
 * 는 잠금 때문에 죽은 채로 남는다. 코치 창은 아이 화면을 보는 동안 늘 뒤에 있으므로
 * 실제 수업에서 걸리는 자리다.
 *
 * ── 두 겹으로 막는다 ────────────────────────────────────────────────
 * ① `document.hidden`이면 처음부터 타이머로 돈다.
 * ② 🔴 그렇지 **않은데도** rAF가 안 도는 경우가 있다. 창이 다른 창에 가려지면
 *    브라우저가 그리기를 멈추면서도 `document.hidden`은 거짓으로 두기 때문이다
 *    (클래스인처럼 창을 겹쳐 쓰는 자리에서 실제로 겪었다 — 판서가 통째로 죽었다).
 *    그래서 **감시 타이머**를 함께 건다. 1초 안에 rAF가 안 돌아오면 타이머가
 *    대신 실행한다. 제때 돌아오면 타이머를 끈다. 어느 쪽이든 **한 번만** 실행된다.
 *
 * 반드시 다른 스크립트보다 **먼저** 실려야 한다.
 */
(() => {
  "use strict";
  if (window.__onqHiddenScheduler) return;
  window.__onqHiddenScheduler = true;

  const nativeRequest = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);

  // 우리가 돌려주는 표는 전부 음수다 — 진짜 rAF 번호와 겹치지 않는다.
  const pending = new Map();
  let handleSeed = 0;

  // 숨은 동안은 60fps가 필요 없다 — 화면 상태만 따라잡으면 된다.
  const HIDDEN_INTERVAL_MS = 100;
  // 보이는데도 이만큼 안 돌아오면 가려진 것으로 보고 대신 실행한다.
  const WATCHDOG_MS = 1000;

  function settle(handle, entry, callback) {
    if (!pending.has(handle)) return;   // 이미 실행됐거나 취소됐다
    pending.delete(handle);
    if (entry.timer !== null) clearTimeout(entry.timer);
    if (entry.frame !== null) nativeCancel(entry.frame);
    // 한 모듈이 죽어도 나머지는 돌아야 한다.
    try { callback(performance.now()); } catch (_) { /* 무시 */ }
  }

  window.requestAnimationFrame = callback => {
    const handle = --handleSeed;
    const entry = { frame: null, timer: null };
    pending.set(handle, entry);

    if (document.hidden) {
      entry.timer = setTimeout(() => settle(handle, entry, callback), HIDDEN_INTERVAL_MS);
      return handle;
    }

    // 보일 때는 원래 rAF를 그대로 쓰고, 감시 타이머를 곁에 둔다.
    entry.frame = nativeRequest(() => settle(handle, entry, callback));
    entry.timer = setTimeout(() => settle(handle, entry, callback), WATCHDOG_MS);
    return handle;
  };

  window.cancelAnimationFrame = handle => {
    if (typeof handle === "number" && handle < 0) {
      const entry = pending.get(handle);
      if (!entry) return;
      pending.delete(handle);
      if (entry.timer !== null) clearTimeout(entry.timer);
      if (entry.frame !== null) nativeCancel(entry.frame);
      return;
    }
    nativeCancel(handle);
  };
})();
