(() => {
  "use strict";

  const data = window.ONQ_STEP5_WORKSHEET_DATA;
  if (!data) return;

  const sessionKey = document.body.dataset.session || "session01";
  const session = data.sessions[sessionKey];
  if (!session) return;

  const state = {
    pack: "read",
    stage: "A",
    soundEnabled: true,
    answers: { read: { A: {}, B: {}, C: {} }, transfer: { A: {}, B: {}, C: {} } },
    judged: new Set(),
    completed: new Set(),
    started: new Set()
  };

  const stageMeta = {
    A: { title: "보기를 보고 완성해요", short: "보기", help: "보기에서 알맞은 낱말을 골라 빈칸을 채워요." },
    B: { title: "첫소리를 보고 써요", short: "첫소리", help: "첫소리 힌트를 보고 낱말을 직접 써요." },
    C: { title: "스스로 완성해요", short: "스스로", help: "보기와 힌트 없이 낱말을 직접 써요." }
  };

  function esc(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function splitSentence(sentence, target) {
    const index = sentence.indexOf(target);
    return index < 0 ? [sentence, ""] : [sentence.slice(0, index), sentence.slice(index + target.length)];
  }

  function initialSounds(text) {
    const choseong = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
    return [...text].map(char => {
      const code = char.charCodeAt(0) - 0xac00;
      return code >= 0 && code <= 11171 ? choseong[Math.floor(code / 588)] : "";
    }).filter(Boolean).join("");
  }

  function normalize(value) {
    return String(value || "").normalize("NFC").replace(/\s+/g, "").replace(/[.,!?·'\"“”‘’]/g, "");
  }

  function emit(type, payload = {}) {
    const lesson = window.ONQ_CONTENT_PACK?.sessions?.[sessionKey];
    const event = {
      event_type: type,
      lesson_id: lesson?.lessonId || document.body.dataset.lessonId || "",
      lesson_version: window.ONQ_CONTENT_PACK?.version || document.body.dataset.lessonVersion || "",
      session_id: sessionKey,
      activity_id: "support.printable.cloze",
      timestamp: new Date().toISOString(),
      ...payload
    };
    if (typeof window.ONQ_EVENT_SINK === "function") window.ONQ_EVENT_SINK(event);
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: event }));
  }

  function speak(text, button) {
    if (!state.soundEnabled) return;
    if (window.ONQ_AUDIO?.resolve(text)) { button?.classList.add("is-playing"); window.ONQ_AUDIO.play(text, { onended: () => button?.classList.remove("is-playing"), onerror: () => button?.classList.remove("is-playing") }); emit("audio_play", { item_id: button?.dataset.wsItem || "", voice_mode: "aoede_local", playback_rate: 1.1 }); return; }
    if (!state.soundEnabled) return;
    if (!("speechSynthesis" in window)) {
      announce("이 브라우저에서는 문장 듣기를 사용할 수 없어요. 듣지 않고도 계속할 수 있어요.");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.82;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.lang.toLowerCase().startsWith("ko") && /neural|natural|online/i.test(voice.name)) || voices.find(voice => voice.lang.toLowerCase().startsWith("ko")) || null;
    button?.classList.add("is-playing");
    utterance.onend = utterance.onerror = () => button?.classList.remove("is-playing");
    speechSynthesis.speak(utterance);
    emit("audio_play", { item_id: button?.dataset.wsItem || "", voice_mode: utterance.voice ? "preferred_korean" : "browser_default" });
  }

  function announce(message) {
    let node = document.querySelector(".ws-live");
    if (!node) {
      node = document.createElement("div");
      node.className = "ws-live sr-only";
      node.setAttribute("aria-live", "polite");
      document.body.append(node);
    }
    node.textContent = "";
    window.setTimeout(() => { node.textContent = message; }, 20);
  }

  function answerFor(item) {
    return state.answers[state.pack][state.stage][item.id] || "";
  }

  function isCorrect(item) {
    return normalize(answerFor(item)) === normalize(item.target);
  }

  function stageKey() {
    return `${state.pack}:${state.stage}`;
  }

  function stageProgress() {
    const items = session[state.pack].items;
    return items.filter(isCorrect).length;
  }

  function recordAnswer(item, response, source, finalAttempt = true) {
    state.answers[state.pack][state.stage][item.id] = response;
    const correct = normalize(response) === normalize(item.target);
    const judgeKey = `${state.pack}:${state.stage}:${item.id}:${normalize(response)}`;
    if ((correct || finalAttempt) && !state.judged.has(judgeKey)) {
      state.judged.add(judgeKey);
      emit("answer", {
        item_id: item.id,
        data_pack: state.pack,
        worksheet_stage: state.stage,
        response,
        correct,
        response_source: source,
        // 이 문항에서 앞서 몇 번 틀렸나로 3값을 정한다. 단계(A·B·C)는 스캐폴딩이지
        // 도움이 아니므로 support로 세지 않는다 — 아래 worksheet_stage로 따로 남는다.
        ...(correct ? { accuracy: (window.ONQ_ACCURACY || (f => f > 0 ? "self-corrected" : "accurate"))(state.wrongCount?.[item.id] || 0, false) } : {}),
        // A(보기)·B(첫소리)·C(스스로)는 이 활동의 **스캐폴딩 위계**다.
        // 그 단계 안에서 해낸 것은 「그 단계의 정상 수행」이지 도움을 받은 것이 아니다.
        // ⇒ 도움 수준(A1~A4)을 붙이지 않는다. 단계는 아래 worksheet_stage로 남는다.
        hint_level: state.stage === "A" ? "choices" : state.stage === "B" ? "initial_sound" : "none"
      });
    }
    if (!correct && finalAttempt) {
      if (!state.wrongCount) state.wrongCount = {};
      state.wrongCount[item.id] = (state.wrongCount[item.id] || 0) + 1;
      emit("retry", { item_id: item.id, data_pack: state.pack, worksheet_stage: state.stage });
    }
    const count = stageProgress();
    if (count === session[state.pack].items.length && !state.completed.has(stageKey())) {
      state.completed.add(stageKey());
      emit("activity_complete", { completion: "all_items", data_pack: state.pack, worksheet_stage: state.stage, correct_count: count });
      announce("여섯 문장을 모두 완성했어요.");
    }
    return correct;
  }

  function publicAudioUrl(item) {
    const isPublished = location.protocol === "https:" && !/^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
    if (!isPublished) return "";
    const url = new URL(location.href);
    url.searchParams.set("session", sessionKey);
    url.searchParams.set("step", "worksheet");
    url.searchParams.set("pack", state.pack);
    url.searchParams.set("audio", item.id);
    return url.toString();
  }

  function sentenceRow(item, number, stage = state.stage, print = false) {
    const [before, after] = splitSentence(item.sentence, item.target);
    const answer = answerFor(item);
    const correct = isCorrect(item);
    const status = answer ? (correct ? "is-correct" : "is-pending") : "";
    const hint = stage === "B" ? `<span class="ws-initial" aria-label="첫소리 힌트">${esc(initialSounds(item.target))}</span>` : "";
    const answerBox = print
      ? `<span class="ws-print-blank ${stage === "B" ? "with-hint" : ""}">${stage === "B" ? esc(initialSounds(item.target)) : ""}</span>`
      : stage === "A"
        ? `<span class="ws-blank ${correct ? "filled" : ""}">${correct ? esc(item.target) : "빈칸"}</span>`
        : `<span class="ws-input-wrap">${hint}<input class="ws-input" type="text" inputmode="text" autocomplete="off" spellcheck="false" value="${esc(answer)}" data-ws-input="${esc(item.id)}" aria-label="${number}번 빈칸에 들어갈 낱말" style="--ws-chars:${Math.max(4, item.target.length)}"><button class="ws-check" type="button" data-ws-action="check" data-ws-item="${esc(item.id)}">확인</button></span>`;
    const choices = stage === "A" && !print ? `<div class="ws-choices" aria-label="${number}번 보기">${item.choices.map(choice => `<button type="button" class="ws-choice ${answer === choice ? (correct ? "selected correct" : "selected") : ""}" data-ws-action="choose" data-ws-item="${esc(item.id)}" data-ws-value="${esc(choice)}">${esc(choice)}</button>`).join("")}</div>` : "";
    const audioUrl = publicAudioUrl(item);
    const qr = print ? `<div class="ws-qr" data-ws-qr-url="${esc(audioUrl)}"><span class="ws-qr-mark" aria-hidden="true"></span><small>${audioUrl ? "소리 듣기" : "배포 후 활성"}</small></div>` : "";
    return `<article class="ws-item ${status}" data-ws-row="${esc(item.id)}">
      <span class="ws-number">${number}</span>
      <div class="ws-item-body">
        <div class="ws-sentence"><span>${esc(before)}</span>${answerBox}<span>${esc(after)}</span></div>
        ${choices}
        <div class="ws-item-meta"><span>${esc(item.rule)}</span>${!print ? `<button type="button" class="ws-audio" data-ws-action="speak" data-ws-item="${esc(item.id)}" ${state.soundEnabled ? "" : "disabled"}><span aria-hidden="true">◖</span> 문장 듣기</button>` : ""}</div>
      </div>${qr}
    </article>`;
  }

  function printDeck() {
    const pack = session[state.pack];
    return `<section class="ws-print-deck" aria-hidden="true">${["A", "B", "C"].map((stage, page) => `<section class="ws-print-page">
      <header class="ws-print-head"><div><span>우리는 친구 · ${esc(window.ONQ_CONTENT_PACK?.sessions?.[sessionKey]?.sessionLabel || "")}</span><h1>${stage}. ${esc(stageMeta[stage].title)}</h1><p>${esc(stageMeta[stage].help)}</p></div><div class="ws-print-name">이름 <span></span></div></header>
      <div class="ws-print-list">${pack.items.map((item, index) => sentenceRow(item, index + 1, stage, true)).join("")}</div>
      ${stage === "A" ? `<footer class="ws-print-bank"><strong>보기</strong>${pack.items.map(item => `<span>${esc(item.target)}</span>`).join("")}</footer>` : ""}
      <div class="ws-print-foot"><span>그림책 기반 읽기유창성 · ${esc(pack.label)}</span><span>${page + 1} / 3</span></div>
    </section>`).join("")}</section>`;
  }

  function screen() {
    const pack = session[state.pack];
    const progress = stageProgress();
    const startedKey = stageKey();
    if (!state.started.has(startedKey)) {
      state.started.add(startedKey);
      emit("activity_start", { data_pack: state.pack, worksheet_stage: state.stage });
    }
    return `<section class="ws-step5" data-ws-mounted="true">
      <div class="ws-toolbar">
        <div class="ws-pack-tabs" role="group" aria-label="문장 묶음 선택">
          ${Object.entries(session).map(([key, value]) => `<button type="button" class="ws-pack-tab ${state.pack === key ? "active" : ""}" data-ws-action="pack" data-ws-pack="${key}" aria-pressed="${state.pack === key}">${esc(value.label)}</button>`).join("")}
        </div>
        <div class="ws-toolbar-actions">
          <div class="ws-sound-switch" role="group" aria-label="문장 소리 사용">
            <span>소리</span><button type="button" data-ws-action="sound" data-ws-sound="on" class="${state.soundEnabled ? "active" : ""}" aria-pressed="${state.soundEnabled}">켬</button><button type="button" data-ws-action="sound" data-ws-sound="off" class="${!state.soundEnabled ? "active" : ""}" aria-pressed="${!state.soundEnabled}">끔</button>
          </div>
          <button type="button" class="ws-print-button" data-ws-action="print">인쇄하기</button>
        </div>
      </div>
      <div class="ws-stage-tabs" role="tablist" aria-label="쓰기 단계">
        ${Object.entries(stageMeta).map(([key, meta]) => `<button type="button" role="tab" aria-selected="${state.stage === key}" class="${state.stage === key ? "active" : ""}" data-ws-action="stage" data-ws-stage="${key}"><span>${key}</span>${esc(meta.short)}</button>`).join("")}
      </div>
      <div class="ws-work-area">
        <aside class="ws-guide-card"><img src="assets/jelly/guide.png" alt="문장 쓰기를 안내하는 젤리티처"><div><span>${esc(pack.note)}</span><h2>${state.stage}. ${esc(stageMeta[state.stage].title)}</h2><p>${esc(stageMeta[state.stage].help)}</p><strong>${progress} / ${pack.items.length} 완성</strong></div></aside>
        <div class="ws-list">${pack.items.map((item, index) => sentenceRow(item, index + 1)).join("")}</div>
      </div>
      ${printDeck()}
    </section>`;
  }

  // 워크지 차례 번호는 회차마다 달라진다(낱말 뜻이 들어오면 하나 밀린다).
  // 번호를 박지 않고 **차례 이름**(data-step-id)으로 찾는다.
  function wsNavBtn(activeOnly) {
    const btn = document.querySelector('.step-nav .step-btn[data-step-id="worksheet"]');
    if (!btn) return null;
    if (activeOnly && !btn.classList.contains("active")) return null;
    return btn;
  }

  function updateShellLabels() {
    const nav = wsNavBtn(false)?.querySelector(".step-copy");
    if (!nav) return;
    const strong = nav.querySelector("strong");
    const small = nav.querySelector("small");
    if (strong && strong.textContent !== "3단계 쓰기") strong.textContent = "3단계 쓰기";
    if (small && small.textContent !== "보기·첫소리·스스로") small.textContent = "보기·첫소리·스스로";
  }

  function updatePageHead(view) {
    const eyebrow = view.querySelector(".page-head .eyebrow");
    const heading = view.querySelector(".page-head h1");
    if (eyebrow) eyebrow.textContent = "인쇄 활동 · 음운인식·문법·철자";
    if (heading) heading.textContent = data.title;
  }

  function mount() {
    updateShellLabels();
    const active = wsNavBtn(true);
    if (!active) return;
    const view = document.querySelector(".activity-view");
    if (!view || view.querySelector(".ws-step5[data-ws-mounted]")) return;
    updatePageHead(view);
    const placeholder = view.querySelector(".placeholder-page") || view.lastElementChild;
    if (placeholder) placeholder.outerHTML = screen();
    renderQrHooks();
    const requested = new URLSearchParams(location.search).get("audio");
    if (requested) {
      const item = session[state.pack].items.find(candidate => candidate.id === requested);
      const button = item && document.querySelector(`[data-ws-action="speak"][data-ws-item="${CSS.escape(item.id)}"]`);
      if (button) button.focus();
    }
  }

  function rerender() {
    const current = document.querySelector(".ws-step5");
    if (!current) return mount();
    current.outerHTML = screen();
    renderQrHooks();
  }

  function renderQrHooks() {
    document.querySelectorAll(".ws-qr[data-ws-qr-url]").forEach(element => {
      const url = element.dataset.wsQrUrl;
      if (url && typeof window.ONQ_QR_RENDERER === "function") {
        const mark = element.querySelector(".ws-qr-mark");
        window.ONQ_QR_RENDERER({ element: mark, url, size: 62, purpose: "worksheet_audio" });
      }
    });
  }

  function itemById(id) {
    return session[state.pack].items.find(item => item.id === id);
  }

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-ws-action]");
    if (!button) return;
    const action = button.dataset.wsAction;
    event.preventDefault();
    event.stopPropagation();
    if (action === "pack") {
      state.pack = button.dataset.wsPack;
      emit("worksheet_pack_change", { data_pack: state.pack });
      rerender();
      return;
    }
    if (action === "stage") {
      state.stage = button.dataset.wsStage;
      emit("worksheet_stage_change", { data_pack: state.pack, worksheet_stage: state.stage });
      rerender();
      return;
    }
    if (action === "sound") {
      state.soundEnabled = button.dataset.wsSound === "on";
      if (!state.soundEnabled && "speechSynthesis" in window) speechSynthesis.cancel();
      emit("audio_mode", { enabled: state.soundEnabled, data_pack: state.pack, worksheet_stage: state.stage });
      rerender();
      return;
    }
    if (action === "print") {
      emit("print_requested", { data_pack: state.pack, page_count: 3 });
      window.print();
      return;
    }
    const item = itemById(button.dataset.wsItem);
    if (!item) return;
    if (action === "speak") { speak(item.sentence, button); return; }
    if (action === "choose") {
      recordAnswer(item, button.dataset.wsValue, "choice", true);
      rerender();
      return;
    }
    if (action === "check") {
      const input = document.querySelector(`[data-ws-input="${CSS.escape(item.id)}"]`);
      recordAnswer(item, input?.value || "", "typed", true);
      rerender();
    }
  }, true);

  document.addEventListener("input", event => {
    const input = event.target.closest("[data-ws-input]");
    if (!input) return;
    const item = itemById(input.dataset.wsInput);
    if (!item) return;
    state.answers[state.pack][state.stage][item.id] = input.value;
    if (normalize(input.value) === normalize(item.target)) {
      recordAnswer(item, input.value, "typed_auto", false);
      input.closest(".ws-item")?.classList.add("is-correct");
      announce("정확하게 썼어요.");
    } else input.closest(".ws-item")?.classList.remove("is-correct");
  }, true);

  document.addEventListener("keydown", event => {
    const input = event.target.closest("[data-ws-input]");
    if (!input || event.key !== "Enter") return;
    const item = itemById(input.dataset.wsInput);
    if (!item) return;
    event.preventDefault();
    recordAnswer(item, input.value, "typed_enter", true);
    rerender();
  }, true);

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(() => {
      mount();
      const modal = document.querySelector(".modal");
      if (modal && wsNavBtn(true)) {
        const heading = modal.querySelector("h2");
        const list = modal.querySelector("ul");
        const headingText = "3단계 쓰기 활동 안내";
        const listMarkup = "<li>같은 문장을 보기, 첫소리, 스스로 쓰기 순서로 완성해요.</li><li>문장 듣기는 선택이에요. 소리를 꺼도 모든 활동을 할 수 있어요.</li><li>인쇄하면 단계별로 A4 한 장씩, 모두 세 장이 나와요.</li>";
        if (heading && heading.textContent !== headingText) heading.textContent = headingText;
        if (list && list.innerHTML !== listMarkup) list.innerHTML = listMarkup;
      }
    });
  });
  observer.observe(document.getElementById("app"), { childList: true, subtree: true });

  window.ONQ_STEP5_WORKSHEET = {
    version: data.version,
    // 코치 콘솔이 「6개 중 3개」로 읽을 수 있게 진행과 사람 말 이름까지 함께 낸다.
    getState: () => ({
      pack: state.pack, stage: state.stage, soundEnabled: state.soundEnabled,
      packLabel: session[state.pack]?.label || state.pack,
      stageLabel: stageMeta[state.stage]?.short || state.stage,
      done: stageProgress(), total: session[state.pack]?.items.length ?? null
    }),
    setPack: pack => { if (session[pack]) { state.pack = pack; rerender(); } },
    setStage: stage => { if (stageMeta[stage]) { state.stage = stage; rerender(); } },
    getData: () => session
  };

  mount();
})();


