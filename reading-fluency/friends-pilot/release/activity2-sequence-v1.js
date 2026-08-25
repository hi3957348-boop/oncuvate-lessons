(() => {
  "use strict";

  const pack = window.ONQ_CONTENT_PACK;
  const sessionKey = document.body.dataset.session;
  const lesson = pack?.sessions?.[sessionKey];
  if (!lesson) return;

  const ITEMS = {
    session01: [
      "우리에게는 아주 좋은 친구가 있어요.",
      "그 친구는 우리와 전혀 다르게",
      "작은 벌레들이 나를 괴롭혀요.",
      "새는 벌레를 모두 잡아 주지요.",
      "이빨을 닦을 수가 없어요.",
      "부리로 이빨을 깨끗이 청소해 주지요."
    ],
    session02: [
      "머리가 가렵지만 긁을 수가 없어요.",
      "새는 가려운 곳을 긁어 주지요.",
      "먼 곳이 잘 안 보여요.",
      "위험한 동물이 오는지 감시해요.",
      "아주 다르게 생겼지만 상관없어요.",
      "노래를 듣는 것도 즐거워요."
    ]
  };

  const items = (ITEMS[sessionKey] || ITEMS.session02).map((text, index) => ({
    id: `sequence-${sessionKey}-${index + 1}`,
    text,
    words: text.replace(/[.!?]+$/u, "").split(/\s+/)
  }));
  if (!items.every(item => item.words.length >= 3 && item.words.length <= 5)) return;

  const state = {
    index: 0,
    selected: [],
    listened: false,
    audioBusy: false,
    correct: false,
    attempts: 0,
    startedAt: performance.now(),
    orderCache: new Map()
  };
  let scheduled = false;
  let fallbackAudio = null;

  // 차례 이름으로 잡는다. 번호는 차례를 넣고 뺄 때마다 어긋난다.
  function activeStep() {
    return document.querySelector(".step-btn.active")?.dataset.stepId
        || document.querySelector("main")?.dataset.stepId || "";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
  }

  function emit(type, payload = {}) {
    const event = {
      event_type: type,
      lesson_id: lesson.lessonId,
      lesson_version: pack.version,
      session_id: sessionKey,
      activity_id: "intervention.phrase_sequence",
      timestamp: new Date().toISOString(),
      ...payload
    };
    window.ONQ_EVENT_SINK?.(event);
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail:event }));
  }

  function hash(text) {
    let value = 2166136261;
    for (const character of text) { value ^= character.charCodeAt(0); value = Math.imul(value, 16777619); }
    return value >>> 0;
  }

  function wordOrder(item) {
    if (state.orderCache.has(item.id)) return state.orderCache.get(item.id);
    const output = item.words.map((word, index) => ({ word, index }));
    let value = hash(`${lesson.lessonId}:${item.id}`) || 1;
    for (let index = output.length - 1; index > 0; index -= 1) {
      value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      const target = (value >>> 0) % (index + 1);
      [output[index], output[target]] = [output[target], output[index]];
    }
    if (output.every((entry, index) => entry.index === index)) output.push(output.shift());
    state.orderCache.set(item.id, output);
    return output;
  }

  function updateNavigation() {
    const button = document.querySelector('.step-btn[data-step-id="game1"]');
    if (!button) return;
    const label = button.querySelector("strong");
    const sub = button.querySelector("small");
    if (label) label.textContent = "문장 완성";
    if (sub) sub.textContent = "듣고 순서 맞추기";
  }

  function finishAudio(success = true) {
    state.audioBusy = false;
    state.listened = success || state.listened;
    state.startedAt = performance.now();
    render();
  }

  function playCurrent() {
    if (state.audioBusy) return;
    const item = items[state.index];
    state.audioBusy = true;
    state.listened = false;
    render();
    emit("audio_play", { item_id:item.id, text:item.text, playback_rate:window.ONQ_AUDIO?.playbackRate || 1 });
    if (window.ONQ_AUDIO?.play(item.text, { onended:() => finishAudio(true), onerror:() => playFallback(item.text) })) return;
    playFallback(item.text);
  }

  function playFallback(text) {
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) { finishAudio(false); return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = .88;
    utterance.onend = () => { fallbackAudio = null; finishAudio(true); };
    utterance.onerror = () => { fallbackAudio = null; finishAudio(false); };
    fallbackAudio = utterance;
    speechSynthesis.speak(utterance);
  }

  function choose(index) {
    if (!state.listened || state.audioBusy || state.correct || state.selected.includes(index)) return;
    state.selected.push(index);
    emit("answer", { item_id:items[state.index].id, response:items[state.index].words[index], position:state.selected.length, correct:index === state.selected.length - 1, response_time_ms:Math.round(performance.now() - state.startedAt) });
    render();
  }

  function removeSelected(position) {
    if (state.audioBusy || state.correct) return;
    state.selected.splice(position, 1);
    render();
  }

  function checkAnswer() {
    const item = items[state.index];
    if (state.selected.length !== item.words.length || state.audioBusy) return;
    state.attempts += 1;
    const correct = state.selected.every((wordIndex, position) => wordIndex === position);
    emit("sequence_check", { item_id:item.id, response:state.selected.map(index => item.words[index]).join(" "), correct, attempts:state.attempts });
    if (correct) {
      state.correct = true;
      // 몇 번 만에 맞췄나로 3값을 정한다(첫 시도 = attempts 1).
      emit("item_complete", { item_id:item.id, attempts:state.attempts,
        accuracy:(window.ONQ_ACCURACY || (f => f > 0 ? "self-corrected" : "accurate"))(state.attempts - 1, false) });
    }
    render(correct ? "문장을 완성했어요." : "순서를 다시 살펴보세요. 선택한 낱말을 눌러 고칠 수 있어요.");
  }

  function advance() {
    if (!state.correct) return;
    if (state.index === items.length - 1) {
      emit("activity_complete", { completion:"all_items", item_count:items.length });
      document.querySelector('[data-action="next"]')?.click();
      return;
    }
    state.index += 1;
    state.selected = [];
    state.listened = false;
    state.audioBusy = false;
    state.correct = false;
    state.attempts = 0;
    state.startedAt = performance.now();
    render();
  }

  function render(message = "") {
    if (activeStep() !== "game1") return;
    updateNavigation();
    const view = document.querySelector(".activity-view");
    if (!view) return;
    const item = items[state.index];
    const order = wordOrder(item);
    const completeSelection = state.selected.length === item.words.length;
    const status = message || (state.audioBusy ? "소리를 듣고 있어요." : state.correct ? "완성한 문장을 한 번 더 읽어 보세요." : state.listened ? "낱말을 들은 순서대로 골라 보세요." : "재생 버튼을 눌러 먼저 들어요.");
    view.innerHTML = `<div class="sequence-activity ${state.correct ? "is-correct" : ""}">
      <div class="sequence-top"><span class="sequence-progress">${state.index + 1} / ${items.length}</span><button type="button" class="compact-info" data-action="open-modal">활동 안내</button></div>
      <div class="sequence-layout">
        <aside class="sequence-listen-card">
          <img src="assets/jelly/listening.png" alt="귀 기울이는 젤리티처">
          <strong>문장을 잘 들어요</strong>
          <button type="button" class="sequence-play" data-sequence-action="listen" ${state.audioBusy ? "disabled" : ""} aria-label="문장 듣기">${state.audioBusy ? '<span class="sequence-wave" aria-hidden="true"></span>' : '<span aria-hidden="true">▶</span>'}</button>
        </aside>
        <section class="sequence-stage" aria-label="들은 문장 순서 맞추기">
          <div class="sequence-slots" aria-label="선택한 낱말 순서">${item.words.map((_, position) => {
            const wordIndex = state.selected[position];
            const word = wordIndex == null ? "" : item.words[wordIndex];
            return `<button type="button" class="sequence-slot ${word ? "filled" : ""}" data-sequence-remove="${position}" ${word && !state.correct ? "" : "disabled"} aria-label="${position + 1}번째 자리${word ? ` ${escapeHtml(word)}` : " 비어 있음"}">${word ? escapeHtml(word) : `<span>${position + 1}</span>`}</button>`;
          }).join("")}</div>
          ${state.correct ? `<div class="sequence-complete" role="status"><strong>${escapeHtml(item.text)}</strong><span>완성했어요</span></div>` : `<div class="sequence-bank" aria-label="낱말 카드">${order.map(entry => `<button type="button" class="sequence-word" data-sequence-word="${entry.index}" ${!state.listened || state.audioBusy || state.selected.includes(entry.index) ? "disabled" : ""}>${escapeHtml(entry.word)}</button>`).join("")}</div>`}
          <p class="sequence-status" role="status">${escapeHtml(status)}</p>
          <div class="sequence-actions">${state.correct ? `<button type="button" class="sequence-next" data-sequence-action="advance">${state.index === items.length - 1 ? "활동 마침" : "다음 문장"}</button>` : `<button type="button" class="sequence-check" data-sequence-action="check" ${completeSelection && !state.audioBusy ? "" : "disabled"}>순서 확인</button>`}</div>
        </section>
      </div>
    </div>`;
  }

  function renderIfNeeded() {
    updateNavigation();
    if (activeStep() !== "game1") return;
    const view = document.querySelector(".activity-view");
    if (view && !view.querySelector(".sequence-activity")) render();
  }

  document.addEventListener("click", event => {
    const word = event.target.closest("[data-sequence-word]");
    if (word) { event.preventDefault(); event.stopImmediatePropagation(); choose(Number(word.dataset.sequenceWord)); return; }
    const slot = event.target.closest("[data-sequence-remove]");
    if (slot) { event.preventDefault(); event.stopImmediatePropagation(); removeSelected(Number(slot.dataset.sequenceRemove)); return; }
    const control = event.target.closest("[data-sequence-action]");
    if (!control) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (control.dataset.sequenceAction === "listen") playCurrent();
    else if (control.dataset.sequenceAction === "check") checkAnswer();
    else if (control.dataset.sequenceAction === "advance") advance();
  }, true);

  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; renderIfNeeded(); });
  }).observe(document.getElementById("app"), { childList:true, subtree:true });

  window.ONQ_GAME1_QA = {
    mechanics:"listen-and-sequence-v1",
    itemCount:items.length,
    wordCounts:items.map(item => item.words.length),
    getState:() => ({ index:state.index, selected:[...state.selected], listened:state.listened, audioBusy:state.audioBusy, correct:state.correct })
  };
  renderIfNeeded();
})();
