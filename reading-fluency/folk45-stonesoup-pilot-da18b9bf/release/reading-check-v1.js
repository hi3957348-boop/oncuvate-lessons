/* 게임 뒤에 붙는 읽기 평가 — 젤리몬 찾기 · 순서 맞추기
 *
 * 설계: 게임은 **빌드업**이고, 그 뒤에 읽기가 온다.
 *   젤리몬 찾기 — 한 판을 끝내면, 그 판에서 **들었던 낱말들**을 읽는다
 *   순서 맞추기 — 문장을 완성하면, 그 **문장**을 읽는다
 *
 * 🔑 게임 모듈을 건드리지 않는다. 그쪽은 로더가 서로의 소스를 문자열로 잘라 붙이는
 *    사슬이라 한 글자만 어긋나도 통째로 안 뜬다. 여기서는 **이벤트만 듣고** 붙인다.
 *
 * 평가는 문장 읽기·글 읽기가 쓰는 배관을 그대로 쓴다
 * (`window.ONQ_OPENAI_PARAGRAPH_ASSESSOR`의 start/finish).
 * 마이크나 평가 서버가 없으면 **「읽었어요」로 넘어가고 못 쟀다고 남긴다** —
 * 규격 7장의 확정 코드 `notMeasured`를 쓰고, 그때 `A0`(혼자 해냄)를 붙이지 않는다.
 */
(() => {
  "use strict";

  const SESSION_KEY = document.body.dataset.session || "session01";
  const LESSON_ID = document.documentElement.dataset.lessonId || "lesson";

  const ACTIVITY = {
    game1: "intervention.phrase_sequence",
    game2: "intervention.word_phrase"
  };

  const state = {
    sentenceByItem: new Map(),   // 순서 맞추기 — 문항별 문장 원문
    heardWords: [],              // 젤리몬 — 이번 판에서 들은 낱말
    open: null                   // 지금 열려 있는 읽기 평가
  };

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  // 이 모듈이 내는 기록. shared.js의 emit과 같은 봉투를 쓴다 —
  // 코치모드가 이 이벤트를 받아 표준 통로(oncuvate:log)로 넘긴다.
  function emit(type, payload) {
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: {
      event_type: type,
      lesson_id: LESSON_ID,
      session_id: SESSION_KEY,
      activity_id: state.open?.activityId || null,
      timestamp: new Date().toISOString(),
      ...payload
    } }));
  }

  // ── 이벤트 줍기 ─────────────────────────────────────────────────────────
  window.addEventListener("oncuvate:event", event => {
    const d = event.detail || {};
    if (d.event_type === "audio_play" && d.item_id && d.text) {
      state.sentenceByItem.set(d.item_id, d.text);          // 순서 맞추기의 문장 원문
    }
    if (d.event_type === "reading_attempt" && d.text) {
      if (!state.heardWords.includes(d.text)) state.heardWords.push(d.text);
    }
    // 문장을 완성했다 → 그 문장을 읽는다
    if (d.event_type === "item_complete" && d.activity_id === ACTIVITY.game1) {
      const text = state.sentenceByItem.get(d.item_id);
      if (text) openCheck({ kind: "game1", activityId: ACTIVITY.game1, target: text,
                            title: "완성한 문장을 읽어 볼까요", itemId: d.item_id });
    }
    // 한 판을 끝냈다 → 그 판에서 들은 낱말들을 읽는다
    if (d.event_type === "board_complete" && state.heardWords.length) {
      const words = state.heardWords.slice(0, 8);
      state.heardWords = [];
      openCheck({ kind: "game2", activityId: ACTIVITY.game2, target: words.join(" "),
                  title: "방금 들은 낱말을 읽어 볼까요", itemId: `board-${d.board_number ?? ""}`,
                  words });
    }
  });

  // ── 읽기 평가 한 판 ─────────────────────────────────────────────────────
  function openCheck(check) {
    if (state.open) return;
    state.open = { ...check, phase: "ready", result: null };
    render();
    emit("reading_capture", { accuracy: "notApplicable", text_scope: check.kind, item_id: check.itemId,
                              result_state: "prompted" });
  }

  function closeCheck() {
    state.open = null;
    document.querySelector(".onq-readcheck")?.remove();
  }

  function assessor() {
    const a = window.ONQ_OPENAI_PARAGRAPH_ASSESSOR;
    return a?.isSupported?.() ? a : null;
  }

  async function startReading() {
    const open = state.open;
    const a = assessor();
    if (!a) return finishWithoutMeasure();
    try {
      await a.start({ scope: open.kind, target: open.target, rules: [], silence_ms: 2600 });
      open.phase = "recording";
      render();
    } catch (_) {
      finishWithoutMeasure("마이크를 쓸 수 없어요.");
    }
  }

  async function stopReading() {
    const open = state.open;
    const a = assessor();
    if (!a) return finishWithoutMeasure();
    open.phase = "checking";
    render();
    try {
      const result = await a.finish({ scope: open.kind, target: open.target, rules: [] });
      if (state.open !== open) return;
      open.result = result;
      open.phase = "done";
      emit("reading_capture", { accuracy: "notApplicable", text_scope: open.kind, item_id: open.itemId,
                                result_state: result.correct ? "measured_pass" : "measured_review",
                                assessor: result.source || "gpt-audio-1.5" });
      // 코치 콘솔의 「읽기 피드백」이 이 이벤트를 받는다
      window.dispatchEvent(new CustomEvent("onq:reading-assessment-result", { detail: {
        session_id: SESSION_KEY, activity: open.kind, target_text: open.target, result
      } }));
      render();
    } catch (error) {
      console.warn("[oncuvate] 읽기 평가 실패", error); finishWithoutMeasure("지금은 스스로 읽기를 쓸 수 없어요.");
    }
  }

  // 마이크·평가 서버가 없을 때. 🔴 못 쟀는데 A0(혼자 해냄)를 붙이지 않는다 —
  // 규격 7장이 「A0와 못 쟀음은 다른 값」이라고 이름 붙여 금지한 자리다.
  function finishWithoutMeasure(message) {
    const open = state.open;
    if (!open) return;
    emit("reading_capture", { accuracy: "notApplicable", text_scope: open.kind, item_id: open.itemId,
                              result_state: "notMeasured", measurement_state: "notMeasured",
                              note: message || "assessor_unavailable" });
    open.phase = "unmeasured";
    open.note = message || "";
    render();
  }

  // ── 화면 ────────────────────────────────────────────────────────────────
  // 🔴 아이 화면에는 점수·별점을 띄우지 않는다(규격 7장). 그 자리에서 도움이 되는 말만 남기고,
  //    별점과 오류 목록은 코치 콘솔로 간다.
  function body(open) {
    if (open.phase === "recording") {
      return `${typeof window.ONQ_REC_INDICATOR === "function" ? window.ONQ_REC_INDICATOR("듣고 있어요 — 낱말을 또박또박") : ""}
      <p class="onq-rc-hint" role="status">다 읽으면 <b>읽기 마침</b>을 눌러요.</p>
              <button class="onq-rc-btn primary" type="button" data-rc="stop">읽기 마침</button>`;
    }
    if (open.phase === "checking") {
      return `<p class="onq-rc-hint" role="status">읽기를 살펴보고 있어요. 잠시만요.</p>`;
    }
    if (open.phase === "unmeasured") {
      return `<p class="onq-rc-hint">${esc(open.note || "소리를 재지 못했어요. 읽고 넘어가요.")}</p>
              <button class="onq-rc-btn primary" type="button" data-rc="close" data-track="activity-complete" data-accuracy="notApplicable">읽었어요</button>`;
    }
    if (open.phase === "done") {
      const f = open.result?.feedback || {};
      const said = [f.pronunciation, f.phrasing, f.speed].filter(Boolean)[0] || "이번 읽기를 살펴봤어요.";
      // 두 번 넘게 살펴봤으면 더 붙들지 않는다 — 설계원칙의 「3회에는 중단·지원 전환」과
      // 같은 방향이다. 상한(하루 5번)에 닿으면 「다시 읽기」 자체를 내린다.
      const budget = window.ONQ_ASSESS_BUDGET;
      const enough = budget?.isEnough?.(open.target);
      const spent = budget ? budget.left(open.target) <= 0 : false;
      return `<p class="onq-rc-said">${esc(said)}</p>
              ${enough && !spent ? `<p class="onq-rc-hint">이만큼 살펴봤어요. 넘어가도 좋아요.</p>` : ""}
              ${spent ? `<p class="onq-rc-hint">오늘은 이 문장을 충분히 살펴봤어요. 다음에 또 해 봐요.</p>` : ""}
              <div class="onq-rc-row">
                ${spent ? "" : `<button class="onq-rc-btn" type="button" data-rc="retry">다시 읽기</button>`}
                <button class="onq-rc-btn primary" type="button" data-rc="close" data-track="activity-complete" data-accuracy="notApplicable">계속하기</button>
              </div>`;
    }
    return `<p class="onq-rc-hint">준비되면 <b>읽기 시작</b>을 눌러요.</p>
            <button class="onq-rc-btn primary" type="button" data-rc="start" data-track="speech-attempt">읽기 시작</button>`;
  }

  function render() {
    const open = state.open;
    document.querySelector(".onq-readcheck")?.remove();
    if (!open) return;
    const host = document.querySelector(".activity-shell") || document.body;
    const box = document.createElement("div");
    box.className = "onq-readcheck";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", open.title);
    box.innerHTML = `<div class="onq-rc-card">
        <span class="onq-rc-eyebrow">읽기</span>
        <h2>${esc(open.title)}</h2>
        <p class="onq-rc-target">${open.words
          ? open.words.map(w => `<span>${esc(w)}</span>`).join("")
          : esc(open.target)}</p>
        ${body(open)}
      </div>`;
    host.append(box);
  }

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-rc]");
    if (!button || !state.open) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = button.dataset.rc;
    if (action === "start") startReading();
    else if (action === "stop") stopReading();
    else if (action === "retry") { state.open.phase = "ready"; state.open.result = null; render(); }
    else if (action === "close") closeCheck();
  }, true);

  // 검수용
  window.ONQ_READING_CHECK = Object.freeze({
    open: () => state.open && { kind: state.open.kind, phase: state.open.phase, target: state.open.target },
    heard: () => state.heardWords.slice(),
    force: check => openCheck({ kind: "game2", activityId: ACTIVITY.game2,
                                title: "방금 들은 낱말을 읽어 볼까요", itemId: "qa", ...check })
  });
})();
