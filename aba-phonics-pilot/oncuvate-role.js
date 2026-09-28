/* Oncuvate role gate — 한 파일에서 코치/아이 화면을 가르는 유일한 판정.
 *
 * 플랫폼: window.ONCUVATE.role 만 믿는다 (주소 값은 절대 보지 않는다).
 *         화이트리스트 — 'coach'만 코치, 나머지는 전부 아이.
 * 로컬 검토(file:// · localhost)에서 ONCUVATE가 없을 때만
 *         ?role=coach (옛 ?preview=coach) · ?room= · ?child= 를 받는다.
 * 다른 스크립트보다 먼저 불러야 한다.
 */
(function (global) {
  "use strict";
  if (global.ONQ_ROLE) return;
  var injected = global.ONCUVATE && typeof global.ONCUVATE === "object" ? global.ONCUVATE : null;
  var loc = global.location || {};
  var local = !injected && (loc.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(loc.hostname || ""));
  var query = local ? new URLSearchParams(loc.search || "") : new URLSearchParams("");
  var role = injected
    ? (injected.role === "coach" ? "coach" : "child")
    : (query.get("role") === "coach" || query.get("preview") === "coach" ? "coach" : "child");
  var clean = function (value, max) { return String(value == null ? "" : value).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, max); };
  global.ONQ_ROLE = Object.freeze({
    role: role,
    isCoach: role === "coach",
    injected: Boolean(injected),
    local: local,
    room: injected ? String(injected.room || "") : clean(query.get("room"), 80),
    child: injected ? String(injected.child || "") : clean(query.get("child"), 32),
    // 코치 콘솔이 펼쳐져 있을 때 수업 맞춤(fit)이 설계폭(987)에 더 비켜 줄 폭: 간격 12 + 콘솔 220 + 여백 10
    dockReserve: function () { return document.documentElement.dataset.coachDock === "open" ? 242 : 0; }
  });
  document.documentElement.dataset.oncuvateRole = role;
}(window));
