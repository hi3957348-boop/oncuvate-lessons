/* 집중·성실 신호 — 이벤트 어휘 v0.2의 tapSummary · offTask · byPhase (2026-08-26)
 *
 * 🔴 이 값들로 **아이를 판정하지 않는다.** 49번의 해석정보와 같은 규율이다 —
 *    능력점수·진단문구를 만들지 않고, 읽기 결과가 낮을 때 **원인을 짐작할 근거**로만 쓴다.
 *    「집중 못 함」은 아이 특성이 아니라 그 회차의 상태일 수 있다(피곤·어려움·지루함).
 *    여러 아이가 같은 활동에서 공통으로 빨리 넘긴다면 문제는 아이가 아니라 그 활동이다.
 *
 * 무엇을 보나
 *   빠름 계열   응답이 지나치게 빠름 · 빠르고 연속된 오답 · 빠른 페이지 넘김  → 읽지 않는다
 *   흩어짐 계열 조작 대상이 아닌 곳을 누름                                   → 과제에 못 붙는다
 *
 * ⚠️ **개인 기준선은 여기서 못 한다.** 콘텐츠는 그 회차만 안다.
 *    「이전 회차 같은 measureId의 중앙값」은 서버 기록을 가진 플랫폼의 몫이다.
 *    ⇒ 여기서는 **원자료를 그대로 싣고**, 글자 수 기준의 표시만 붙인다.
 * ⚠️ 반드시 `oncuvate:log`로 나가야 한다 — 플랫폼 트래커는 **`data-*` 속성을 버린다**(65번).
 */
(function () {
  "use strict";

  // ── 기준값 — 고쳐 쓰라고 위로 뺀다 ────────────────────────────────
  var MS_PER_CHAR = 120;      // 글자당 최소 시간. 분당 500음절 — 유창한 성인보다 빠르다
  var OVERHEAD_MS = 300;      // 화면 보고 손 옮겨 누르는 시간
  var FAST_NAV_MS = 1500;     // 이보다 빨리 넘기면 「안 읽고 넘김」 후보
  var FAST_WRONG_RUN = 3;     // 빠른 오답이 셋 이어지면 신호. 둘은 우연이고 넷은 놓친다

  // ⚠️ 선택자는 **이 자료의 실제 마크업**을 훑어 맞춘 것이다(2026-08-25 전수 확인).
  //    활동을 새로 넣으면 여기도 같이 봐야 한다 — 안 맞으면 조용히 `ui`로 떨어지고,
  //    그러면 「무엇을 하고 있었나」가 뭉개진다. offTask 오탐보다 알아채기 어렵다.
  var SEL = {
    answer: '[data-track="answer"], [data-track="speech-attempt"], .vocab-choice, .word-quiz-btn,'
          + ' .g2p-cell, .sequence-slot, .ws-choice',
    nav:    '[data-track="navigation"], .step-btn, [data-step]',
    tool:   '[data-track="hint"], [data-track="audio"], .sequence-play, .ws-audio, .jelly-button,'
          + ' [data-action*="annotation"], [data-action*="speak"], .annotation-toolbar',
    word:   '.sequence-word, .onq-expansion-word, [data-word-ox], [data-word]',
    ui:     'button, a, input, select, textarea, label, [data-action], [role=button]'
  };

  var startedAt = performance.now();
  var lastNavAt = null;
  var tap = { answer: 0, nav: 0, tool: 0, word: 0, ui: 0, offTask: 0 };
  var byPhase = { "0-10min": 0, "10-20min": 0, "20-30min": 0, "30min+": 0 };
  var fastRun = 0;
  var signals = { tooFast: 0, fastWrongRun: 0, fastNav: 0 };

  function phaseKey() {
    var min = (performance.now() - startedAt) / 60000;
    if (min < 10) return "0-10min";
    if (min < 20) return "10-20min";
    if (min < 30) return "20-30min";
    return "30min+";
  }

  function classify(el) {
    if (!el || !el.closest) return "offTask";
    if (el.closest(SEL.answer)) return "answer";
    if (el.closest(SEL.nav)) return "nav";
    if (el.closest(SEL.tool)) return "tool";
    if (el.closest(SEL.word)) return "word";
    if (el.closest(SEL.ui)) return "ui";
    return "offTask";
  }

  document.addEventListener("click", function (event) {
    var kind = classify(event.target);
    tap[kind] = (tap[kind] || 0) + 1;
    // ⚠️ 그림을 눌러 보는 것은 자연스러운 탐색이다 — 한두 번으로 「무의미」라 하지 않는다.
    //    그래서 개별 사건이 아니라 **횟수와 구간 분포**로 싣는다.
    if (kind === "offTask") byPhase[phaseKey()] += 1;
    if (kind === "nav") {
      var now = performance.now();
      if (lastNavAt !== null && now - lastNavAt < FAST_NAV_MS) signals.fastNav += 1;
      lastNavAt = now;
    }
  }, true);

  function visibleTextLength() {
    var shell = document.querySelector(".activity-shell");
    if (!shell) return 0;
    return (shell.innerText || "").replace(/\s+/g, "").length;
  }

  function toLog(detail) {
    try { window.dispatchEvent(new CustomEvent("oncuvate:log", { detail: detail })); } catch (_) { /* 무시 */ }
  }

  window.addEventListener("oncuvate:event", function (event) {
    var d = event.detail || {};
    if (d.event_type !== "answer") return;
    var ms = Number(d.response_time_ms);
    if (!isFinite(ms) || ms <= 0) return;

    var chars = visibleTextLength();
    var floor = OVERHEAD_MS + chars * MS_PER_CHAR;
    var tooFast = ms < floor;
    if (tooFast) signals.tooFast += 1;

    fastRun = (d.correct === false && tooFast) ? fastRun + 1 : 0;
    if (fastRun === FAST_WRONG_RUN) signals.fastWrongRun += 1;

    // 원자료를 그대로 싣는다 — 플랫폼이 개인 기준선으로 다시 볼 수 있게.
    toLog({
      type: "engagement_response",
      activityId: d.activity_id || null,
      itemId: d.item_id || null,
      responseTimeMs: Math.round(ms),
      visibleTextLen: chars,
      expectedMinMs: Math.round(floor),
      tooFast: tooFast,
      fastWrongRun: fastRun
    });
  });

  function publishSummary(reason) {
    toLog({
      type: "engagement_summary",
      reason: reason,
      tapAnswer: tap.answer, tapNav: tap.nav, tapTool: tap.tool,
      tapWord: tap.word, tapUi: tap.ui, tapOffTask: tap.offTask,
      offTask0_10min: byPhase["0-10min"],
      offTask10_20min: byPhase["10-20min"],
      offTask20_30min: byPhase["20-30min"],
      offTask30minPlus: byPhase["30min+"],
      signalTooFast: signals.tooFast,
      signalFastWrongRun: signals.fastWrongRun,
      signalFastNav: signals.fastNav,
      elapsedMin: Math.round((performance.now() - startedAt) / 60000)
    });
  }

  window.addEventListener("oncuvate:event", function (event) {
    var t = (event.detail || {}).event_type;
    if (t === "activity_complete" || t === "lesson_complete") publishSummary(t);
  });
  window.addEventListener("pagehide", function () { publishSummary("pagehide"); });

  window.ONQ_ENGAGEMENT = { snapshot: function () { return { tap: tap, byPhase: byPhase, signals: signals }; } };
})();
