(() => {
  "use strict";
  // 회차마다 자기 데이터를 전역으로 올린다(ONQ_SESSION01_… / ONQ_SESSION02_…).
  // 엔진은 회차를 모른다 — 데이터가 있는 회차에서만 살아난다.
  const sessionKey = String(document.body.dataset.session || "");
  const rows = window[`ONQ_${sessionKey.toUpperCase()}_TARGET_EXPANSIONS`] || [];
  if (!rows.length) return;
  const byTarget = new Map(rows.map(row => [row.target, row]));
  const targets = [...byTarget.keys()].sort((a, b) => b.length - a.length);
  const pack = window.ONQ_CONTENT_PACK;
  const lesson = pack?.sessions?.[sessionKey];
  const startedAt = performance.now();
  let panel = null;
  let practice = null;
  let renderQueued = false;
  const bridge = { active: false, handleTranscript: null };
  window.ONQ_READING_PRACTICE = bridge;

  const esc = value => String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const normalize = value => String(value || "").normalize("NFC").replace(/[\s.,!?~'"“”‘’()[\]{}:;·]/gu, "").replace(/애/gu, "에").trim();

  function emit(eventType, payload = {}) {
    const event = { event_type: eventType, lesson_id: lesson?.lessonId || document.body.dataset.lessonId || "", lesson_version: pack?.version || "0.1.0", session_id: sessionKey, activity_id: "intervention.sentence", elapsed_ms: Math.round(performance.now() - startedAt), timestamp: new Date().toISOString(), ...payload };
    window.ONQ_EVENT_SINK?.(event);
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: event }));
    if (window.parent !== window) window.parent.postMessage({ type: "oncuvate:event", event }, "*");
  }

  function similarity(a, b) {
    const x = normalize(a), y = normalize(b);
    if (!x || !y) return 0;
    const row = Array.from({ length: y.length + 1 }, (_, index) => index);
    for (let i = 1; i <= x.length; i += 1) {
      let previous = row[0]; row[0] = i;
      for (let j = 1; j <= y.length; j += 1) {
        const held = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (x[i - 1] === y[j - 1] ? 0 : 1));
        previous = held;
      }
    }
    return Math.max(0, 1 - row[y.length] / Math.max(x.length, y.length));
  }

  // 스위치는 두 모양이다 — ①옛 mode-switch(.sentence-layout 안) ②새 ON/OFF 띠
  // (.sentence-utility-bar, **.sentence-layout 바깥**). 옛 선택자만 보면 새 띠를 못 읽어 늘 「꺼짐」이 된다.
  // 나누어 읽기에서 API 평가를 뺐으므로 그 화면의 스위치를 볼 수 없다.
  // 확장 읽기는 **스스로 판단한다** — 마이크로 들을 수 있으면 듣는다.
  const assessmentOn = () => Boolean(window.ONQ_OPENAI_PARAGRAPH_ASSESSOR?.isSupported?.());

  function speak(text, options = {}) {
    if (window.ONQ_AUDIO?.play?.(text, options)) return true;
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) return false;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR"; utterance.rate = .9;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => /^ko/i.test(voice.lang) && /natural|neural|sunhi|injoon/i.test(voice.name)) || voices.find(voice => /^ko/i.test(voice.lang)) || null;
    utterance.onend = () => options.onended?.();
    utterance.onerror = () => options.onerror?.();
    speechSynthesis.speak(utterance);
    return true;
  }

  function payload(support = "none") {
    return { item_id: practice ? `${practice.row.id}:expansion-${practice.index + 1}` : "s02-expansion", target: practice?.row.target || "", trigger: practice?.trigger || "click", expansion_item: practice?.row.expansions[practice.index] || "", attempt: practice?.attempt || 0, support };
  }
  function disarm() {
    bridge.active = false; bridge.handleTranscript = null;
    if (practice?.recording) { try { window.ONQ_OPENAI_PARAGRAPH_ASSESSOR?.release?.(); } catch (_) {} }
    if (practice) { practice.recording = false; practice.busy = false; }
  }
  function closePractice(reason = "close") {
    disarm(); panel?.remove(); panel = null;
    if (practice) emit("expansion_close", { ...payload(reason), completion: reason });
    practice = null;
  }

  const WORD_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Z" fill="currentColor"/><path d="M17 9.2a4 4 0 0 1 0 5.6M19.5 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function head(kicker) {
    return `<div class="onq-expansion-head"><span class="onq-expansion-kicker">${esc(kicker)}</span><button class="onq-expansion-close" type="button" data-expansion-action="close" aria-label="연습 닫기">×</button></div><p class="onq-expansion-source">${esc(practice.row.target)}와 같은 소리를 연습해요</p>`;
  }

  function markup() {
    const words = practice.row.expansions;

    // ③ 마친 뒤
    if (practice.phase === "done") {
      const again = practice.attempt < 2
        ? '<button class="onq-expansion-skip" type="button" data-expansion-action="again">다시 읽어 보기</button>' : "";
      return `${head("확장 읽기 완료")}<p class="onq-expansion-status" role="status">${esc(practice.status || "좋아요. 원래 문장으로 돌아가 다시 읽어 보세요.")}</p>${practice.review || ""}<div class="onq-expansion-actions"><button class="onq-expansion-next" type="button" data-expansion-action="close">문장으로 돌아가기</button>${again}</div>`;
    }

    // ② 다섯을 **한 번에** 읽고, 평가도 한 번만 받는다
    if (practice.phase === "read") {
      const assessed = assessmentOn() && !practice.manualOnly;
      // 여기는 **고르는 자리**다. 「읽기 시작」 하나만 두면 안내가 「그냥 읽고 누르라」로 읽혀
      // 아이가 고른 줄도 모르고 녹음으로 들어간다. 두 길을 나란히 놓는다.
      const next = practice.busy
        ? '<button class="onq-expansion-next" type="button" disabled>살펴보는 중…</button>'
        : practice.recording
          ? '<button class="onq-expansion-next recording" type="button" data-expansion-action="finish">다 읽었어요</button>'
          : assessed
            ? '<button class="onq-expansion-next" type="button" data-expansion-action="arm">읽기 시작</button><button class="onq-expansion-skip" type="button" data-expansion-action="manual">그냥 읽고 넘어가기</button>'
            : '<button class="onq-expansion-next" type="button" data-expansion-action="manual">다 읽었어요</button>';
      const list = `<ol class="onq-expansion-list">${words.map(word => `<li>${esc(word)}</li>`).join("")}</ol>`;
      const fallback = practice.status || (assessed
        ? "다섯 낱말을 소리 내어 읽어요. 읽는 소리를 살펴보려면 ‘읽기 시작’, 혼자 읽고 넘어가려면 오른쪽을 눌러요."
        : "다섯 낱말을 차례대로 읽고 아래를 눌러요.");
      return `${head("다섯 낱말 읽기")}${list}<p class="onq-expansion-status" role="status">${esc(fallback)}</p><div class="onq-expansion-actions">${next}</div>${practice.recording && window.ONQ_REC_INDICATOR ? window.ONQ_REC_INDICATOR("듣고 있어요 — 다섯 낱말을 차례대로") : ""}`;
    }

    // ① 하나씩 듣고 따라 읽는다 — **녹음하지 않는다**(모델 소리가 섞이면 안 된다)
    const item = words[practice.index];
    const last = practice.index >= words.length - 1;
    return `${head("확장 읽기")}<p class="onq-expansion-word" aria-live="polite">${esc(item)}</p><div class="onq-expansion-progress"><span>${practice.index + 1} / ${words.length}</span><span class="onq-expansion-track" aria-hidden="true"><span style="width:${(practice.index + 1) * (100 / words.length)}%"></span></span></div><p class="onq-expansion-status" role="status">${esc(practice.status || "소리를 듣고 따라 읽어요.")}</p><div class="onq-expansion-actions"><button class="onq-expansion-audio" type="button" data-expansion-action="audio" aria-label="${esc(item)} 다시 듣기" title="다시 듣기">${WORD_SVG}</button><button class="onq-expansion-next" type="button" data-expansion-action="step">${last ? "다섯 낱말 읽기" : "다음"}</button></div>`;
  }

  function renderPanel() {
    if (!practice) return;
    if (!panel) {
      panel = document.createElement("aside"); panel.className = "onq-expansion-panel";
      panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "확장 낱말 읽기");
      document.body.append(panel);
    }
    panel.innerHTML = markup();
  }

  const rulesFor = () => [...(lesson?.focusRules || []), "확장 낱말 — 목표 낱말과 같은 소리 규칙"];
  const batchTarget = () => practice.row.expansions.join(" ");

  async function armCurrent() {
    if (!practice || practice.phase !== "read" || practice.recording || practice.busy) return;
    const api = window.ONQ_OPENAI_PARAGRAPH_ASSESSOR;
    emit("speech_attempt", { ...payload("assessment"), attempt: practice.attempt + 1 });
    if (!api?.isSupported?.()) {
      practice.manualOnly = true;
      practice.status = "마이크를 쓸 수 없어요. 읽은 뒤 ‘다 읽었어요’를 눌러요.";
      renderPanel(); return;
    }
    try {
      // scope는 paragraph — 낱말 사이에 쉬어도 끊기지 않도록 침묵 여유를 길게 준다.
      // sentence로 두면 2.3초만 쉬어도 자동으로 멈춘다.
      await api.start({ scope: "paragraph", target: batchTarget(), rules: rulesFor(), silence_ms: 5000 });
      if (!practice) return;
      practice.recording = true;
      practice.status = "다섯 낱말을 차례대로 읽어요. 다 읽으면 아래를 눌러요.";
      renderPanel();
    } catch (_) {
      if (!practice) return;
      practice.recording = false;
      practice.manualOnly = true;
      practice.status = "마이크를 쓸 수 없어요. 읽은 뒤 ‘다 읽었어요’를 눌러요.";
      renderPanel();
    }
  }

  // ⚠️ 듣기 단계에서만 소리를 낸다. 녹음 중에 모델 소리를 틀면 **그 소리가 같이 녹음돼**
  //    아이가 읽은 것과 섞인다. 그래서 듣기(1단계)와 읽기(2단계)를 갈라 놓았다.
  function playCurrent() {
    if (!practice || practice.phase !== "learn") return;
    const item = practice.row.expansions[practice.index];
    const key = `exp:${practice.row.id}:${practice.index}`;
    window.ONQ_PACING?.audioStart(key);
    practice.status = "소리를 듣고 있어요."; renderPanel(); emit("audio_replay", payload("audio"));
    const done = () => {
      window.ONQ_PACING?.audioEnd(key);
      if (!practice || practice.phase !== "learn") return;
      practice.status = "따라 읽어 보고 ‘다음’을 눌러요."; renderPanel();
    };
    const played = speak(item, { onended: done, onerror: done });
    if (!played) done();
  }

  async function finishCurrent() {
    if (!practice || !practice.recording) return;
    practice.recording = false; practice.busy = true;
    practice.status = "다섯 낱말을 한 번에 살펴보고 있어요.";
    renderPanel();
    let result = null;
    try { result = await window.ONQ_OPENAI_PARAGRAPH_ASSESSOR.finish({ scope: "paragraph", target: batchTarget(), rules: rulesFor() }); }
    catch (_) { result = null; }
    if (!practice) return;
    practice.busy = false;
    if (!result) {
      practice.manualOnly = true;
      practice.status = "지금은 소리를 살펴볼 수 없어요. ‘다 읽었어요’로 넘어갈 수 있어요.";
      renderPanel(); return;
    }
    applyResult(result);
  }

  async function score(target, transcript) {
    if (!practice || normalize(target) !== normalize(practice.row.expansions[practice.index])) return;
    disarm();
    let result = null;
    if (typeof window.ONQ_READING_ASSESSOR?.evaluate === "function") {
      try { result = await window.ONQ_READING_ASSESSOR.evaluate({ lesson_id: lesson?.lessonId, target, transcript, context: { activity: "sentence_expansion", source_target: practice.row.target, expansion_index: practice.index } }); } catch (_) { result = null; }
    }
    if (!result) { const scoreValue = similarity(target, transcript); result = { source: "local_practice", correct: scoreValue >= .75, similarity: scoreValue }; }
    applyResult(result);
  }

  function applyResult(result) {
    if (!practice) return;
    disarm();
    practice.attempt += 1;
    emit("answer", { ...payload(result.correct ? "assessment" : "retry"), correct: Boolean(result.correct), assessor: result.source || "integration" });
    practice.phase = "done";
    practice.status = result.correct
      ? "다섯 낱말을 읽었어요."
      : (practice.attempt >= 2 ? "두 번 읽어 보았어요. 표시된 곳을 눌러 보세요." : "표시된 낱말을 눌러 보세요.");
    // 첨삭은 다섯 낱말 전체에 한 번 — 어디가 달랐는지는 표시로 말한다(점수·판정 없음).
    practice.review = window.ONQ_READING_ANNOTATE?.render
      ? window.ONQ_READING_ANNOTATE.render(batchTarget(), result) : "";
    emit("expansion_complete", { ...payload(result.correct ? "assessment" : "retry"), completion: "all_five_expansions" });
    renderPanel();
  }

  // 듣기 단계에서 다음 낱말로. 마지막이면 읽기 단계로 넘어간다.
  function stepLearn() {
    if (!practice || practice.phase !== "learn") return;
    // 얼마나 머물다 눌렀는지 함께 보낸다 — 판정은 하지 않고 사실만 적는다.
    const pace = window.ONQ_PACING?.take(`exp:${practice.row.id}:${practice.index}`) || {};
    emit("expansion_item_complete", { ...payload("model_reading"), ...pace });
    if (practice.index < practice.row.expansions.length - 1) {
      practice.index += 1; practice.status = ""; renderPanel();
      window.ONQ_PACING?.show(`exp:${practice.row.id}:${practice.index}`);
      playCurrent();
      return;
    }
    practice.phase = "read"; practice.status = ""; renderPanel();
    emit("expansion_read_phase", payload("batch_reading"));
  }

  function openPractice(target, trigger = "click") {
    const row = byTarget.get(target); if (!row) return;
    closePractice("replace");
    practice = { row, trigger, phase: "learn", index: 0, attempt: 0, status: "", review: "" }; renderPanel();
    window.ONQ_PACING?.show(`exp:${row.id}:0`);
    emit("expansion_open", payload(trigger === "assessment_error" ? "assessment_error" : "self_selected"));
    playCurrent();
  }

  function decorateSentence() {
    const sentence = document.querySelector(".sentence-layout .reading-sentence");
    if (!sentence) return;
    const text = sentence.textContent || "";
    const signature = `${text}|${targets.join("|")}`;
    if (sentence.dataset.expansionSignature === signature) return;
    const fragment = document.createDocumentFragment(); let cursor = 0;
    while (cursor < text.length) {
      let hit = "", hitIndex = text.length;
      targets.forEach(target => { const index = text.indexOf(target, cursor); if (index >= 0 && (index < hitIndex || (index === hitIndex && target.length > hit.length))) { hit = target; hitIndex = index; } });
      if (!hit) { fragment.append(document.createTextNode(text.slice(cursor))); break; }
      if (hitIndex > cursor) fragment.append(document.createTextNode(text.slice(cursor, hitIndex)));
      const button = document.createElement("button"); button.type = "button"; button.className = "onq-target-trigger"; button.dataset.expansionTarget = hit;
      // 스캐폴딩 밖의 **추가 도움** — 모델을 보여 주고 따라 읽게 한다(규격 7장 A3)
      button.dataset.track = "hint"; button.dataset.helpLevel = "A3"; button.dataset.helpType = "expansion-reading"; button.setAttribute("aria-label", `${hit} 확장 읽기 열기`); button.textContent = hit; fragment.append(button); cursor = hitIndex + hit.length;
    }
    sentence.replaceChildren(fragment); sentence.dataset.expansionSignature = signature;
  }

  function explicitErrors(result) {
    if (!result || typeof result !== "object") return [];
    const found = [];
    [result.token_errors, result.error_tokens, result.mispronunciations, result.errors].forEach(items => Array.isArray(items) && items.forEach(item => { const value = typeof item === "string" ? item : item?.expected ?? item?.target ?? item?.token ?? item?.word ?? item?.text; if (typeof value === "string") found.push(value); }));
    [result.word_results, result.words, result.tokens].forEach(items => Array.isArray(items) && items.forEach(item => {
      if (!item || typeof item !== "object") return;
      const status = String(item.status ?? item.result ?? "").toLowerCase();
      const wrong = item.correct === false || item.is_correct === false || item.error === true || ["error", "incorrect", "misread", "omission", "substitution"].includes(status);
      const value = item.expected ?? item.target ?? item.token ?? item.word ?? item.text;
      if (wrong && typeof value === "string") found.push(value);
    }));
    return found;
  }

  function targetFromResult(result, sentenceText) {
    const errors = explicitErrors(result).map(normalize).filter(Boolean);
    if (!errors.length) return "";
    return targets.find(target => sentenceText.includes(target) && errors.some(error => error === normalize(target) || error.includes(normalize(target)))) || "";
  }

  document.addEventListener("click", event => {
    const targetButton = event.target.closest("[data-expansion-target]");
    if (targetButton) { openPractice(targetButton.dataset.expansionTarget, "click"); return; }
    const actionButton = event.target.closest("[data-expansion-action]");
    if (!actionButton || !practice) return;
    const action = actionButton.dataset.expansionAction;
    if (action === "close") closePractice("user_close");
    else if (action === "audio") { window.ONQ_PACING?.replay(`exp:${practice.row.id}:${practice.index}`); playCurrent(); }
    else if (action === "step") stepLearn();
    else if (action === "arm") armCurrent();
    else if (action === "finish") finishCurrent();
    else if (action === "manual") {
      emit("activity_response", { ...payload("manual_unmeasured"), result_state: "unmeasured" });
      emit("expansion_complete", { ...payload("manual_unmeasured"), completion: "all_five_expansions" });
      closePractice("returned_to_sentence");   // 보여 줄 첨삭이 없으니 곧장 책 문장으로
    }
    else if (action === "again") { practice.phase = "read"; practice.status = ""; practice.review = ""; practice.manualOnly = false; renderPanel(); }
  });

  window.addEventListener("onq:reading-assessment-result", event => {
    const detail = event.detail || {};
    if (detail.session_id !== sessionKey || detail.activity !== "sentence" || detail.result?.correct !== false) return;
    const target = targetFromResult(detail.result, detail.target_text || "");
    if (target) window.setTimeout(() => openPractice(target, "assessment_error"), 0);
    else emit("assessment_expansion_unmapped", { item_id: `sentence-${detail.item_index ?? "unknown"}`, target: "", trigger: "assessment_error", expansion_item: "", attempt: 0, support: "structured_token_error_unavailable" });
  });

  new MutationObserver(() => {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; decorateSentence(); if (!document.querySelector(".sentence-layout") && panel) closePractice("sentence_view_closed"); });
  }).observe(document.getElementById("app"), { childList: true, subtree: true });
  decorateSentence();

  window.ONQ_EXPANSION_QA = Object.freeze({ targetCount: rows.length, expansionCount: rows.reduce((sum, row) => sum + row.expansions.length, 0), automaticTrigger: "structured_assessment_errors_only", transcriptInference: false, getOpenPractice: () => practice ? { target: practice.row.target, trigger: practice.trigger, index: practice.index, attempt: practice.attempt } : null });
})();
