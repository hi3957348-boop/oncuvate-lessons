/* 숨은 창에서도 화면 상태가 반영되게 한다.
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
 * 보일 때는 원래 rAF 그대로 쓰고, **숨었을 때만** 타이머로 대신한다.
 * 반드시 다른 스크립트보다 **먼저** 실려야 한다.
 */
(() => {
  "use strict";
  if (window.__onqHiddenScheduler) return;
  window.__onqHiddenScheduler = true;

  const nativeRequest = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const timers = new Map();
  let handleSeed = 0;

  // 숨은 동안은 60fps가 필요 없다 — 화면 상태만 따라잡으면 된다.
  const HIDDEN_INTERVAL_MS = 100;

  window.requestAnimationFrame = callback => {
    if (!document.hidden) return nativeRequest(callback);
    const handle = --handleSeed;            // 음수 — 진짜 rAF 번호와 겹치지 않는다
    timers.set(handle, setTimeout(() => {
      timers.delete(handle);
      try { callback(performance.now()); } catch (_) { /* 한 모듈이 죽어도 나머지는 돈다 */ }
    }, HIDDEN_INTERVAL_MS));
    return handle;
  };

  window.cancelAnimationFrame = handle => {
    if (typeof handle === "number" && handle < 0) {
      clearTimeout(timers.get(handle));
      timers.delete(handle);
      return;
    }
    nativeCancel(handle);
  };
})();
