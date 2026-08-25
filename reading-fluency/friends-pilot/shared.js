(() => {
  "use strict";

  const pack = window.ONQ_CONTENT_PACK;
  const sessionKey = document.body.dataset.session;
  const lesson = pack.sessions[sessionKey];
  const root = document.getElementById("app");
  const steps = [
    { id: "cover", label: "표지", sub: "오늘 읽기" },
    // 낱말 뜻이 **맨 앞**이다. ①(일상 그림)은 가르치기 전에 재므로 어휘 수준은 그대로
    // 남고, 뜻을 알려 준 뒤에 읽으므로 **읽기가 느린 이유를 해독 쪽으로 좁힐 수 있다**.
    // ②(책 문장)도 아직 안 읽은 문장이라 기억이 안 섞인 순수한 옮기기 시험이 된다.
    { id: "vocab", label: "어휘체크", sub: "그림 보고 고르기" },
    { id: "game2", label: "젤리캡쳐", sub: "색 타일 찾고 읽기" },
    { id: "game1", label: "문장 완성", sub: "듣고 순서 맞추기" },
    { id: "sentence", label: "나누어 읽기", sub: "한 문장씩 끊어 읽기" },
    { id: "paragraph", label: "전체 읽기", sub: "전체 글과 질문" },
    { id: "worksheet", label: "3단계 쓰기", sub: "보기·첫소리·스스로" }
  ].filter(step => step.id !== "vocab" || (lesson.vocab || []).length > 0);

  const state = {
    step: 0,
    menuHidden: false,
    mobileMenuOpen: false,
    locked: false,
    modalOpen: false,
    game1Index: 0,
    game1Selected: [],
    game1Fails: 0,
    game2Current: null,
    game2Done: new Set(),
    wordFound: new Set(),
    sentencePhase: "words",
    wordOrder: null,
    wordIndex: 0,
    wordPicked: null,
    wordAttempt: 1,        // 다시 하면 2, 3… (규격 §12.1 `attemptNo`)
    // 낱말 O/X를 거칠지. 자율학습에서는 아이가 건너뛰고, 수업 중에는 코치가 쥔다
    // (읽기 평가 켜고 끄기와 같은 규율).
    wordFindOn: true,
    speakingAll: false,      // 전체듣기가 도는 중인가 (멈추기 버튼을 띄우려고)
    sentenceIndex: 0,
    sentenceFails: {},
    sentenceRecording: false,
    sentenceAssessing: false,
    sentenceAssessment: null,
    speechEnabled: true,      // 평가가 이 자료의 목적이다. 없으면 알아서 「읽었어요」로 폴백한다
    paragraphReady: false,
    paragraphRecording: false,
    paragraphAssessing: false,
    paragraphAssessment: null,
    paragraphTranscript: "",
    questionIndex: 0,
    questionCorrect: new Set(),
    questionFails: {},
    vocabIndex: 0,
    vocabPhase: "daily",        // daily → (틀리면 뜻 보기) → book
    vocabPicked: null,
    vocabTaught: new Set(),     // ①에서 틀려 뜻을 본 낱말. ②의 도움 수준이 갈린다
    vocabScore: { daily: 0, book: 0 },
    vocabAttempt: 1,
    annotationOpen: false,
    annotationTool: null,
    activityStartedAt: performance.now()
  };

  const instructions = {
    cover: ["오늘 읽을 그림책과 목표를 살펴봐요.", "준비되면 시작을 눌러요."],
    game1: ["재생 버튼을 눌러 구나 문장을 끝까지 들어요.", "소리가 끝나면 낱말 카드를 들은 순서대로 골라요.", "순서 확인 뒤 선택한 낱말을 눌러 고칠 수 있어요."],
    game2: ["색 타일을 열어 낱말과 짧은 말을 읽어요.", "가로·세로·색 구역의 단서를 살펴 방패 또는 젤리몬스터로 표시해요."],
    sentence: ["먼저 그림과 관계있는 낱말을 다섯 개 이상 찾아요.", "그다음 그림과 한 문장씩 보며 정확하게 읽어요.", "도움이 나오면 바로 비슷한 문장에 적용해요."],
    paragraph: ["회차에서 읽은 전체 글을 처음부터 끝까지 읽어요.", "질문을 보고 정답이 되는 문장을 본문에서 직접 골라요."],
    worksheet: ["음운인식, 기초 문법, 철자 지식을 확인하는 인쇄 활동은 다음 제작 단계에서 연결해요."]
  };

  // 작업기억 부담 — 42번(2026-08-22)에서 확정된 해석정보. 평가축이 아니라
  // 「이 활동이 머리에 얼마나 붙들게 하는가」를 읽는 쪽에 알려 주는 값이다.
  // primary=주부담 · secondary=보조부담 · none=해당 없음
  const workingMemoryLoad = {
    cover: "none",
    game2: "primary",      // 규칙 셋을 쥐고 판 전체를 훑는다
    game1: "primary",      // 들은 순서를 붙들고 카드를 고른다
    sentence: "secondary", // 읽기가 주부담, 기억은 보조
    paragraph: "secondary",// 전체 글을 읽고 질문에 답한다
    vocab: "none",         // 그림과 문장이 눈앞에 있다
    worksheet: "none"      // 눈앞의 문장을 보고 쓴다
  };

  const activityLabels = {
    cover: "표지",
    game1: "intervention.phrase_sequence",
    game2: "intervention.word_phrase",
    sentence: "intervention.sentence",
    paragraph: "evaluation.paragraph",
    vocab: "evaluation.word_meaning",
    worksheet: "support.printable"
  };

  // 이 화면이 겨냥하는 음운규칙(§8.1 정본 12종). 47번이 정한 정본 키는 `targetRuleId`이고,
  // 화면에는 `data-target-rule-id`로 푼다. 겨냥하는 규칙이 없으면 **비운다** —
  // 없는 값을 지어내면 규격 §12.2의 「분류 대기」와 섞인다.
  function currentRuleId() {
    const id = steps[state.step].id;
    if (id === "sentence") {
      if (state.sentencePhase === "words") return null;   // 낱말 찾기는 평가 대상이 아니다
      return lesson.sentences[state.sentenceIndex]?.rule || null;
    }
    if (id === "game1") return lesson.game1[state.game1Index]?.rule || null;
    if (id === "game2") {
      if (state.game2Current == null) return null;
      return lesson.game2[state.game2Current]?.rule || null;
    }
    return null;
  }

  // 정확성 3값은 **재시도를 보면 계산된다.** 손으로 적을 값이 아니다.
  //   처음에 맞음 → accurate · 틀렸다가 맞음 → self-corrected · 도움 뒤 맞음 → support
  // ⚠️ 이 값이 없으면 세 경우가 전부 「처음부터 맞음」으로 읽힌다 —
  //    세 번 틀리고 맞힌 아이와 한 번에 맞힌 아이가 같아진다.
  // 다른 엔진(순서 맞추기·젤리몬·워크지)도 같은 자를 쓰도록 전역으로 연다.
  window.ONQ_ACCURACY = function (fails, helped) {
    if (helped) return "support";
    return Number(fails) > 0 ? "self-corrected" : "accurate";
  };

  // 녹음 표시등 — 마이크가 실제로 잡는 소리 크기를 막대로 보여 준다.
  // 평가기가 프레임마다 흘리는 onq:mic-level을 받아 그린다(다시 그리기 없음, DOM 직접).
  function recIndicator(label) {
    return `<div class="rec-indicator" role="status" aria-live="polite">
      <span class="rec-dot" aria-hidden="true"></span>
      <span class="rec-label">${esc(label || "듣고 있어요 — 또박또박 읽어요")}</span>
      <span class="rec-meter" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></span>
    </div>`;
  }
  window.ONQ_REC_INDICATOR = recIndicator;   // 게임 뒤 읽기 카드도 같은 표시등을 쓴다
  window.addEventListener("onq:mic-level", event => {
    const detail = event.detail || {};
    const level = Math.max(0, Math.min(1, Number(detail.level) || 0));
    document.querySelectorAll(".rec-meter").forEach(meter => {
      meter.classList.toggle("quiet", !detail.voiced);
      const boost = [0.55, 0.8, 1, 0.8, 0.55];
      for (let i = 0; i < meter.children.length; i += 1) {
        meter.children[i].style.transform = `scaleY(${Math.max(0.15, level * boost[i]).toFixed(3)})`;
      }
    });
  });

  function emit(type, payload = {}) {
    const event = {
      event_type: type,
      lesson_id: lesson.lessonId,
      lesson_version: pack.version,
      session_id: sessionKey,
      activity_id: activityLabels[steps[state.step].id],
      elapsed_ms: Math.round(performance.now() - state.activityStartedAt),
      timestamp: new Date().toISOString(),
      ...(currentRuleId() ? { target_rule_id: currentRuleId() } : {}),
      ...payload
    };
    if (typeof window.ONQ_EVENT_SINK === "function") window.ONQ_EVENT_SINK(event);
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: event }));
    if (window.parent !== window) window.parent.postMessage({ type: "oncuvate:event", event }, "*");
    return event;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function esc(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function pageImage(page) {
    return `assets/book/page-${String(page).padStart(2, "0")}.webp`;
  }

  function markFocus(text, focus) {
    if (!focus || !text.includes(focus)) return esc(text);
    return esc(text).replace(esc(focus), `<mark>${esc(focus)}</mark>`);
  }

  function shell(activityHtml) {
    return `
      <main class="studio ${state.menuHidden || state.locked ? "menu-hidden" : ""} ${state.mobileMenuOpen ? "mobile-menu-open" : ""}" data-step-id="${steps[state.step].id}">
        <header class="topbar">
          <div class="brand">
            <img src="assets/brand/oncuvate-brand-logo.png" alt="Oncuvate">
            <div class="lesson-meta"><strong>${esc(pack.bookTitle)} · ${esc(lesson.sessionLabel)}</strong><span>${esc(lesson.range)}</span></div>
          </div>
          <div class="top-actions">
            <button class="quiet-btn" type="button" data-action="toggle-menu" aria-expanded="${!state.menuHidden}">${state.menuHidden ? "메뉴 보기" : "메뉴 숨기기"}</button>
            <button class="quiet-btn" type="button" data-action="toggle-lock" aria-pressed="${state.locked}">${state.locked ? "잠금 풀기" : "페이지 잠금"}</button>
          </div>
        </header>
        <aside class="sidebar" aria-label="수업 차례">
          <p class="nav-title">TODAY'S READING</p>
          <nav class="step-nav">${steps.map((step, index) => `
            <button class="step-btn ${state.step === index ? "active" : ""}" type="button" data-step="${index}" data-step-id="${step.id}" data-track="navigation">
              <span class="step-no">${index + 1}</span><span class="step-copy"><strong>${step.label}</strong><small>${step.sub}</small></span>
            </button>`).join("")}</nav>
        </aside>
        <section class="activity-shell" aria-label="학습 활동"
                 data-activity-id="${activityLabels[steps[state.step].id]}"
                 data-working-memory-load="${workingMemoryLoad[steps[state.step].id]}"${currentRuleId() ? ` data-target-rule-id="${currentRuleId()}"` : ""}>
          ${activityHtml}
          <canvas class="annotation-canvas ${state.annotationTool ? "active" : ""}" aria-hidden="true"></canvas>
          ${state.annotationOpen ? annotationToolbar() : ""}
          <button class="primary-btn annotation-launcher" type="button" data-action="toggle-annotation" aria-expanded="${state.annotationOpen}">판서</button>
        </section>
        <footer class="bottombar">
          <button class="quiet-btn" type="button" data-action="prev" ${state.step === 0 ? "disabled" : ""}>이전</button>
          <div class="page-dots" aria-label="${state.step + 1} / ${steps.length}">${steps.map((_, i) => `<span class="page-dot ${i === state.step ? "active" : ""}"></span>`).join("")}</div>
          <div class="bottom-actions"><button class="quiet-btn help-request" type="button" data-action="ask-help">도와주세요</button><button class="primary-btn" type="button" data-action="next" ${state.step === steps.length - 1 ? "disabled" : ""}>다음</button></div>
        </footer>
      </main>
      ${state.modalOpen ? instructionModal() : ""}`;
  }

  function annotationToolbar() {
    const tools = [["pen", "펜"], ["highlight", "형광펜"], ["text", "텍스트"]];
    return `<div class="annotation-toolbar" role="toolbar" aria-label="판서 도구">
      ${tools.map(([id, label]) => `<button class="tool-btn ${state.annotationTool === id ? "active" : ""}" type="button" data-annotation-tool="${id}">${label}</button>`).join("")}
      <button class="tool-btn" type="button" data-action="clear-annotation">지우기</button>
      <button class="tool-btn" type="button" data-action="close-annotation">닫기</button>
    </div>`;
  }

  function instructionModal() {
    const step = steps[state.step];
    return `<div class="modal-backdrop" data-action="close-modal" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" data-modal-card>
        <h2 id="modalTitle">${step.label} 활동 안내</h2>
        <ul>${instructions[step.id].map(item => `<li>${item}</li>`).join("")}</ul>
        <div class="modal-actions"><button class="primary-btn" type="button" data-action="close-modal">확인</button></div>
      </section>
    </div>`;
  }

  function pageHead(eyebrow, title) {
    return `<div class="page-head"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1></div><div class="page-tools"><button class="quiet-btn instruction-btn" type="button" data-action="open-modal">활동 안내</button></div></div>`;
  }

  // 원작 표시(규격 9장). CC BY 4.0은 저작자 표시가 의무라 표지에 둔다 —
  // 읽히되 수업을 방해하지 않게 아래쪽에 작게.
  // 표지 아래 권리 표시. 두 겹을 **선 하나로 가른다** —
  // 위는 원작(CC BY 4.0이라 재사용이 열려 있다), 아래는 그 위에 얹은 우리 설계.
  // 원작 표시만 있으면 자료 전체가 CC BY로 읽힌다.
  function creditLine() {
    const c = pack.credit;
    if (!c) return "";
    const origin = [
      c.originalText ? `글 ${c.originalText}` : "",
      c.originalArt ? `그림 ${c.originalArt}` : ""
    ].filter(Boolean).join(" · ");
    const ours = [
      c.koreanText ? `글 ${c.koreanText}` : "",
      c.source ? `출처 ${c.source}` : "",
      c.license
    ].filter(Boolean).join(" · ");
    return `<p class="cover-credit">
      ${origin ? `<span>원작: ${esc(origin)}</span>` : ""}
      ${ours ? `<span>${esc(ours)}</span>` : ""}
      ${c.programRights ? `<span class="cover-credit-ours">${esc(c.programRights)}</span>` : ""}
      ${c.allRights ? `<span class="cover-credit-ours-tail">${esc(c.allRights)}</span>` : ""}
    </p>`;
  }

  function renderCover() {
    return `<div class="activity-view"><div class="cover-layout">
      <div class="cover-copy"><span class="cover-badge">${esc(pack.series)} · ${esc(lesson.sessionLabel)}</span><h1>${esc(lesson.coverTitle)}</h1><p>${esc(lesson.goal)}</p><button class="primary-btn cover-start" type="button" data-action="next" data-track="activity-complete">읽기 시작</button></div>
      <div class="cover-side">
        <div class="cover-art"><img src="${lesson.coverImage}" alt="${esc(pack.bookTitle)} 표지"></div>
        ${creditLine()}
      </div>
    </div></div>`;
  }

  function renderGame1() {
    const item = lesson.game1[state.game1Index];
    const selected = state.game1Selected;
    const options = item._options || (item._options = shuffle([...item.chunks, ...item.distractors]));
    return `<div class="activity-view">${pageHead("소리를 듣고 찾아요", "바른 글자 조각을 골라요")}
      <div class="game-board">
        <div class="jelly-panel"><button class="jelly-button" type="button" data-action="speak-game1" data-track="audio" aria-label="젤리티처를 눌러 낱말 소리 듣기"><img src="assets/jelly/listening.png" alt="소리에 귀 기울이는 젤리티처"></button><p class="jelly-note">젤리티처를 눌러 들어요</p></div>
        <div class="game-stage"><span class="game-kicker">${state.game1Index + 1} / ${lesson.game1.length}</span><h2>들은 순서대로 골라 보세요</h2>
          <div class="answer-slots">${selected.length ? selected.map(value => `<button class="syllable-chip selected" type="button" data-action="remove-chunk">${esc(value)}</button>`).join("") : `<span class="slot-placeholder">글자 조각이 이곳에 놓여요</span>`}</div>
          <div class="chip-grid">${options.map((value, index) => `<button class="syllable-chip" type="button" data-chunk-index="${index}" data-value="${esc(value)}" data-track="answer">${esc(value)}</button>`).join("")}</div>
          <div class="feedback-line ${state.game1Fails ? "retry" : ""}" role="status">${state.game1Fails ? esc(item.hint) : "소리를 충분히 들은 뒤 시작해요."}</div>
        </div>
      </div>
    </div>`;
  }

  function renderGame2() {
    const current = state.game2Current == null ? null : lesson.game2[state.game2Current];
    return `<div class="activity-view">${pageHead("낱말 속 소리를 찾아요", "안전 낱말을 찾아요")}
      <div class="mine-layout">
        <div class="mine-grid">${lesson.game2.map((item, index) => `<button class="mine-card ${state.game2Done.has(index) ? "done" : ""} ${state.game2Current === index ? "current" : ""}" type="button" data-mine-index="${index}" data-track="answer" ${state.game2Done.has(index) ? "disabled" : ""}>${esc(item.word)}</button>`).join("")}</div>
        <aside class="phrase-panel">${current ? `
          <span class="game-kicker">짧은 말을 먼저 읽어요</span><p class="phrase">${esc(current.phrase)}</p>
          <div class="binary-actions"><button class="choice-btn" type="button" data-mine-answer="safe" data-track="answer">안전</button><button class="choice-btn" type="button" data-mine-answer="bomb" data-track="answer">폭탄</button></div>
          <div class="feedback-line" role="status">짧은 말을 읽고 보드의 단서를 살펴 표시해요.</div>` : `
          <button class="jelly-button" type="button" aria-label="게임 안내 듣기" data-action="speak-game2"><img src="assets/jelly/thinking.png" alt="생각하는 젤리티처"></button><p class="phrase">낱말 하나를 골라 보세요</p>`}</aside>
      </div>
    </div>`;
  }

  function renderSentence() {
    if (state.sentencePhase === "words" && state.wordFindOn) return renderWordFind();
    const item = lesson.sentences[state.sentenceIndex];
    const fails = state.sentenceFails[state.sentenceIndex] || 0;
    if (state.pacingSentence !== state.sentenceIndex) {
      state.pacingSentence = state.sentenceIndex;
      window.ONQ_PACING?.show(`sentence:${state.sentenceIndex}`);
    }
    // 나누어 읽기는 **API 평가를 하지 않는다.** 여기서 재는 것은 「읽었다」는 사실뿐이고,
    // 소리 평가는 확장 읽기(다섯 낱말 한 묶음)와 전체 읽기가 맡는다.
    return `<div class="activity-view">${pageHead("한 문장씩 읽어요", "그림과 문장을 함께 읽어요")}
      <div class="sentence-layout">
        <div class="sentence-art"><img src="${pageImage(item.page)}" alt="그림책 ${item.page}쪽 삽화"></div>
        <section class="sentence-panel">
          <span class="sentence-progress">${state.sentenceIndex + 1} / ${lesson.sentences.length}</span>
          <p class="reading-sentence">${markFocus(item.text, item.focus)}</p>
          <div class="speech-row"><button class="quiet-btn" type="button" data-action="speak-sentence" data-track="hint" data-help-level="A3" data-help-type="model-reading">들어보기</button><button class="primary-btn" type="button" data-action="sentence-done" data-track="activity-complete">읽었어요</button></div>
          ${fails ? `<div class="intervention-card"><strong>소리를 살펴봐요</strong>${esc(item.guide)}</div><div class="apply-card"><small>바로 읽어 보기</small><b>${esc(item.apply)}</b></div>` : ""}
          <div class="feedback-line" id="speechFeedback" role="status">소리를 들어 보고, 스스로 읽은 뒤 ‘읽었어요’를 눌러요.</div>
        </section>
      </div>
    </div>`;
  }

  // 낱말 하나씩 「이 책에 나올까요?」 O/X.
  // 여러 개를 한꺼번에 훑던 것을 하나씩으로 바꿨다 — 한 화면에 한 행동(설계원칙)이고,
  // 앞 활동에서 나왔던 낱말을 알아보는지(주의력·작업기억)가 그대로 드러난다.
  // ⚠️ 평가 대상은 아니다. 그래서 정오 칸은 `notApplicable`로 명시한다.
  function wordOrder() {
    if (!state.wordOrder) state.wordOrder = shuffle(lesson.wordPool.map((_, i) => i));
    return state.wordOrder;
  }

  function renderWordFind() {
    const order = wordOrder();
    if (state.wordIndex >= order.length) {
      return `<div class="activity-view">${pageHead("낱말을 다 살펴봤어요", "이제 문장을 읽어요")}
        <div class="word-quiz-done">
          <p class="phrase">낱말 ${order.length}개를 모두 살펴봤어요.</p>
          <div class="done-actions">
            <button class="quiet-btn" type="button" data-action="word-restart">다시 해 볼래요</button>
            <button class="primary-btn" type="button" data-action="start-sentences">문장 읽기</button>
          </div>
        </div></div>`;
    }
    const item = lesson.wordPool[order[state.wordIndex]];
    const picked = state.wordPicked;                    // null | true(나와요) | false(안 나와요)
    const right = picked === null ? null : picked === item.related;
    const mark = value => picked === null ? "" : value === item.related ? "right" : (value === picked ? "wrong" : "dim");
    return `<div class="activity-view">${pageHead("이 책에 나올까요?", "낱말을 하나씩 살펴봐요")}
      <div class="word-quiz-layout">
        <div class="scene-card"><img src="${sessionKey === "session01" ? "assets/book/art/page-03-art.webp" : "assets/book/art/page-13-art.webp"}" alt="그림책 《${esc(pack.bookTitle)}》에 나오는 친구들"></div>
        <section class="word-quiz-card">
          <span class="sentence-progress">${state.wordIndex + 1} / ${order.length}</span>
          <p class="word-quiz-word">${esc(item.word)}</p>
          <div class="word-quiz-choices">
            <button class="word-quiz-btn yes ${mark(true)}" type="button" data-word-ox="yes" data-track="answer" data-correct="${item.related}" data-accuracy="notApplicable" data-attempt-no="${state.wordAttempt}" ${picked === null ? "" : "disabled"}><span aria-hidden="true">○</span>나와요</button>
            <button class="word-quiz-btn no ${mark(false)}" type="button" data-word-ox="no" data-track="answer" data-correct="${!item.related}" data-accuracy="notApplicable" data-attempt-no="${state.wordAttempt}" ${picked === null ? "" : "disabled"}><span aria-hidden="true">✕</span>안 나와요</button>
          </div>
          <div class="feedback-line ${right === true ? "good" : right === false ? "teach" : ""}" role="status">${
            picked === null ? "이 낱말이 책에 나왔는지 떠올려 봐요."
            : right ? (item.related ? "맞아요. 책에 나온 낱말이에요." : "맞아요. 이 책에 없는 낱말이에요.")
                    : (item.related ? "이 낱말은 책에 나왔어요." : "이 낱말은 이 책에 없어요.")}</div>
          ${picked === null ? "" : `<button class="primary-btn" type="button" data-action="word-next">다음</button>`}
          <button class="quiet-btn skip-wordfind" type="button" data-action="start-sentences">낱말 찾기 건너뛰고 바로 읽기</button>
        </section>
      </div>
    </div>`;
  }

  function speechSwitch() {
    return `<div class="sentence-utility-group"><span class="sentence-utility-label">스스로 읽기</span><div class="mode-switch sentence-segmented" role="group" aria-label="스스로 읽기"><button class="mode-btn ${state.speechEnabled ? "active" : ""}" type="button" data-speech-mode="on" aria-pressed="${state.speechEnabled}">ON</button><button class="mode-btn ${!state.speechEnabled ? "active" : ""}" type="button" data-speech-mode="off" aria-pressed="${!state.speechEnabled}">OFF</button></div></div>`;
  }

  // 평가는 몇 초 걸린다. 그동안 아무것도 없으면 아이는 「되고 있나」를 의심한다.
  // 목표 문장은 이미 아니까 **첨삭 자리를 먼저 세우고** 표시만 나중에 채운다.
  function renderAssessmentPending(target) {
    const words = String(target || "").trim().split(/\s+/)
      .map(word => `<span class="ra-word pending">${esc(word)}</span>`).join(" ");
    return `<section class="reading-assessment pending" aria-label="읽기 살펴보는 중">
      <section class="reading-annotate">
        <p class="ra-caption"><span class="ra-spin" aria-hidden="true"></span> 읽은 것을 살펴보고 있어요…</p>
        <p class="ra-text">${words}</p>
      </section>
    </section>`;
  }

  function renderDetailedAssessment(result, scope) {
    // 🔴 「잘했다/못했다」를 쓰지 않는다.
    //   ⑴ 규격 8장 — 아이 화면에 점수·별점을 표시하지 않는다.
    //   ⑵ 통합규격 §10.5 — 「빠름·보통·느림」 3단계 속도판정은 아동 화면에서 제거한다.
    //   ⑶ 그리고 「보통이에요」는 **무엇을 고칠지 알려 주지 않는다.**
    // 대신 읽은 글 위에 직접 첨삭한다 — 틀린 낱말은 형광펜, 끊어읽기는 갈림선.
    // 표시를 누르면 바른 소리를 들려주고 왜 그런지 적어 준다(reading-annotate-v1).
    const target = scope === "sentence"
      ? (lesson.sentences[state.sentenceIndex]?.text || "")
      : lesson.sentences.map(item => item.text).join(" ");
    const annotate = window.ONQ_READING_ANNOTATE;
    const marked = annotate ? annotate.render(target, result) : "";
    const action = scope === "sentence"
      ? `<button class="quiet-btn" type="button" data-action="retry-sentence-reading">다시 읽기</button><button class="primary-btn" type="button" data-action="sentence-done">다음 문장</button>`
      : `<button class="quiet-btn" type="button" data-action="retry-paragraph-reading">다시 읽기</button>`;
    return `<section class="reading-assessment" aria-label="읽기 첨삭">
      ${marked}
      <div class="reading-transcript"><small>내가 읽은 그대로</small><p>${esc(result.transcript || "전사 결과를 확인하지 못했어요.")}</p></div>
      <div class="reading-result-actions">${action}</div>
    </section>`;
  }

  function renderParagraph() {
    const allText = lesson.sentences.map(item => item.text).join(" ");
    const q = lesson.questions[state.questionIndex];
    const finished = state.questionCorrect.size === lesson.questions.length;
    const readingButton = state.paragraphAssessing
      ? `<button class="primary-btn" type="button" disabled>평가 중…</button>`
      : `<button class="primary-btn" type="button" data-action="toggle-paragraph-reading" data-track="speech-attempt">${state.paragraphRecording ? "읽기 마침" : "읽기 시작"}</button>`;
    const assessmentNote = state.paragraphAssessment
      ? renderDetailedAssessment(state.paragraphAssessment, "paragraph")
      : state.paragraphAssessing
        ? renderAssessmentPending(lesson.sentences.map(entry => entry.text).join(" "))
      : state.paragraphRecording
        ? `<div class="feedback-line" role="status">전체 글을 읽는 중이에요. 끝나면 ‘읽기 마침’을 눌러요.</div>`
        : "";
    return `<div class="activity-view">${pageHead("전체 글을 읽고 찾아요", "처음부터 끝까지 읽어요")}
      <div class="paragraph-grid">
        <section class="text-board"><div class="text-board-head"><h2>전체 글</h2>${speechSwitch()}</div><div class="paragraph-text">${lesson.sentences.map((item, index) => state.paragraphReady
          ? `<button class="text-sentence ${state.questionCorrect.has(state.questionIndex) && q && q.answer === index ? "correct" : ""}" type="button" data-text-index="${index}" data-track="answer">${esc(item.text)}</button>`
          : `<button class="text-sentence listen" type="button" data-speak-sentence="${index}" data-track="audio" aria-label="${esc(item.text)} 들어보기"><span class="ts-play" aria-hidden="true"></span>${esc(item.text)}</button>`).join("")}</div>
          <div class="speech-row">${state.speechEnabled ? readingButton : `<button class="primary-btn" type="button" data-action="paragraph-done" data-track="activity-complete">전체 글을 읽었어요</button>`}<button class="quiet-btn${state.speakingAll ? " speaking" : ""}" type="button" data-action="speak-paragraph" data-track="hint" data-help-level="A3" data-help-type="model-reading">${state.speakingAll ? "■ 멈추기" : "전체 듣기"}</button></div>${state.paragraphRecording ? recIndicator("듣고 있어요 — 끝까지 천천히 읽어요") : ""}${assessmentNote}
        </section>
        <aside class="question-panel">${finished ? `<img src="assets/jelly/praise.png" alt="작게 축하하는 젤리티처" width="132" height="132"><span class="game-kicker">읽기 마무리</span><h2>글에서 답을 모두 찾았어요</h2><button class="primary-btn" type="button" data-action="lesson-complete" data-track="lesson-complete">마치기</button>` : state.paragraphReady ? `<span class="game-kicker">글에서 직접 찾아요 · ${state.questionIndex + 1} / ${lesson.questions.length}</span><h2>${esc(q.prompt)}</h2><div class="question-note" id="questionFeedback">정답이 되는 문장을 왼쪽 글에서 골라요.</div>` : state.paragraphRecording || state.paragraphAssessing ? `<img src="assets/jelly/listening.png" alt="읽기를 듣는 젤리티처" width="132" height="132"><span class="game-kicker">${state.paragraphAssessing ? "읽기를 살펴보고 있어요" : "전체 글 읽는 중"}</span><h2>${state.paragraphAssessing ? "잠시만 기다려요" : "천천히 끝까지 읽어요"}</h2>` : `<button class="jelly-button" type="button" aria-label="전체 글 읽기 안내 듣기" data-action="speak-paragraph-guide"><img src="assets/jelly/guide.png" alt="글을 가리키는 젤리티처"></button><span class="game-kicker">먼저 전체 글을 읽어요</span><h2>다 읽은 뒤 질문을 시작해요</h2>`}</aside>
      </div>
      <span class="sr-only" id="paragraphTarget">${esc(allText)}</span>
    </div>`;
  }

  // ── 낱말 뜻 — 한 낱말에 두 걸음 ────────────────────────────────
  // ① 일상 그림으로 뜻을 아는가   ② 그림책 문장으로 옮길 수 있는가
  // ①만 맞고 ②는 틀리는 아이가 갈린다 — 일상어로는 아는데 책에서는 못 알아보는 상태.
  function renderVocab() {
    const items = lesson.vocab || [];
    const item = items[state.vocabIndex];
    if (!item) return `<div class="activity-view">${pageHead("낱말 뜻", "다 했어요")}
      <div class="vocab-done"><p class="phrase">낱말 ${items.length}개를 모두 살펴봤어요.</p>
        <div class="done-actions"><button class="quiet-btn" type="button" data-action="vocab-restart">다시 해 볼래요</button></div>
      </div></div>`;

    const spot = state.vocabPhase === "book" ? item.book : item.daily;
    const picked = state.vocabPicked;
    // 보기 순서는 낱말마다 고정한다 — 매번 흔들리면 위치로 찍게 된다.
    const flip = state.vocabIndex % 2 === 1;
    const options = flip ? [spot.other, spot.answer] : [spot.answer, spot.other];
    const cls = value => picked == null ? "" : value === spot.answer ? "right" : (value === picked ? "wrong" : "dim");

    return `<div class="activity-view">${pageHead("낱말 뜻을 알아봐요", state.vocabPhase === "daily" ? "그림을 보고 골라요" : "책 문장에 넣어 봐요")}
      <div class="vocab-layout">
        <div class="vocab-art${state.vocabPhase === "book" ? " book" : ""}">${
          // ①은 일상 그림으로 뜻을 잡고, ②는 **책 장면 그림**으로 그 뜻을 옮긴다.
          // 옮기는 일이 그림으로도 보이게 하는 자리다. 책 그림이 없으면 표시만 띄운다.
          state.vocabPhase === "daily"
          ? `<img src="${item.image}" alt="${esc(item.alt)}" onerror="this.classList.add('missing')">`
          : item.bookImage
            ? `<img src="${item.bookImage}" alt="${esc(item.bookAlt || item.alt)}" onerror="this.classList.add('missing')">`
            : `<div class="vocab-book-mark"><span>책 문장</span></div>`}</div>
        <section class="vocab-panel">
          <span class="sentence-progress">${state.vocabIndex + 1} / ${items.length}${state.vocabPhase === "book" ? " · 책 문장" : ""}</span>
          <p class="vocab-frame">${esc(spot.frame[0])}<span class="vocab-blank">${picked == null ? "&nbsp;&nbsp;&nbsp;&nbsp;" : esc(picked)}</span>${esc(spot.frame[1] || "")}</p>
          <div class="vocab-choices">${options.map(value => `
            <button class="vocab-choice ${cls(value)}" type="button" data-vocab-choice="${esc(value)}" data-track="answer" data-correct="${value === spot.answer}" data-accuracy="${value === spot.answer ? "accurate" : "support"}" data-attempt-no="${state.vocabAttempt}" ${picked == null ? "" : "disabled"}>${esc(value)}</button>`).join("")}</div>
          ${picked == null ? `<div class="feedback-line" role="status">그림을 보고 알맞은 말을 골라요.</div>`
            : picked === spot.answer
              ? `<div class="feedback-line good" role="status">맞아요. ${esc(item.meaning)}</div>`
              : `<div class="feedback-line teach" role="status" data-track="hint" data-help-level="A2" data-help-type="meaning-shown"><strong>${esc(item.word)}</strong> — ${esc(item.meaning)}</div>`}
          ${picked == null ? "" : `<button class="primary-btn" type="button" data-action="vocab-next">다음</button>`}
        </section>
      </div>
    </div>`;
  }

  function renderWorksheet() {
    return `<div class="activity-view">${pageHead("인쇄 활동", "소리와 글자 지식을 확인해요")}<div class="placeholder-page"><div class="placeholder-card"><h2>다음 제작 단계에서 연결합니다</h2><p>음운인식능력, 기초적인 문법, 철자 지식을 확인하는 워크지 3종의 위치만 유지했습니다.</p></div></div></div>`;
  }

  // 코치 콘솔이 읽는 진행 스냅샷. 화면 글자를 긁는 대신 실제 상태에서 센다 —
  // 「11/14 화면」만으로는 코치가 판단할 수 없고, 「12문항 중 5개 풀고 3개 맞음」이 보여야
  // 느린 아이·막힌 아이에게 먼저 갈 수 있다. 판정이 안 붙은 문항은 맞음/재확인 어디에도 넣지 않는다.
  function activityCounts(id) {
    const none = { itemsDone: null, itemsTotal: null, correct: null, wrong: null };
    if (id === "cover") return { ...none, extra: "오늘 읽을 책을 보고 있어요" };
    if (id === "game1") {
      const total = lesson.game1.length;
      const live = window.ONQ_GAME1_QA?.getState?.();
      const done = live ? (live.completed ? total : Math.min(live.index || 0, total)) : Math.min(state.game1Index, total);
      return { itemsDone: done, itemsTotal: total, correct: null, wrong: null };
    }
    if (id === "game2") {
      // 젤리몬 찾기는 5단계 × 판 3개로 굴러간다(game2-progression). 그 진행이 진짜 문항 수다.
      const live = window.ONQ_GAME2_PROGRESSION_TEST?.state?.();
      if (live && Number.isFinite(live.levelIndex) && Number.isFinite(live.boardIndex)) {
        return { itemsDone: live.levelIndex * 3 + live.boardIndex, itemsTotal: 15, correct: null, wrong: null,
                 extra: `${live.levelIndex + 1}단계 ${live.boardIndex + 1}번째 판` };
      }
      return { itemsDone: state.game2Done.size, itemsTotal: lesson.game2.length, correct: null, wrong: null };
    }
    if (id === "sentence") {
      if (state.sentencePhase === "words") {
        const total = lesson.wordPool.length;
        return { itemsDone: Math.min(state.wordIndex, total), itemsTotal: total,
                 correct: state.wordFound.size, wrong: Math.max(0, Math.min(state.wordIndex, total) - state.wordFound.size) };
      }
      return { itemsDone: state.sentenceIndex, itemsTotal: lesson.sentences.length, correct: null, wrong: null };
    }
    if (id === "paragraph") {
      const total = lesson.questions.length;
      const correct = state.questionCorrect.size;
      return { itemsDone: Math.min(state.questionIndex, total), itemsTotal: total, correct, wrong: Math.max(0, Math.min(state.questionIndex, total) - correct) };
    }
    if (id === "vocab") {
      const total = (lesson.vocab || []).length;
      const correct = state.vocabScore.daily + state.vocabScore.book;
      const done = state.vocabIndex * 2 + (state.vocabPhase === "book" ? 1 : 0);
      return { itemsDone: done, itemsTotal: total * 2, correct, wrong: Math.max(0, done - correct),
               extra: `${state.vocabIndex + 1}번째 낱말 · ${state.vocabPhase === "book" ? "책 문장" : "그림"}` };
    }
    if (id === "worksheet") {
      // 「read A」 같은 내부 코드가 아니라 「읽은 문장 · 보기」로 낸다.
      const live = window.ONQ_STEP5_WORKSHEET?.getState?.();
      if (!live) return none;
      return { itemsDone: live.done ?? null, itemsTotal: live.total ?? null, correct: null, wrong: null,
               extra: [live.packLabel, live.stageLabel].filter(Boolean).join(" · ") };
    }
    return none;
  }

  function currentPrompt(id) {
    if (id === "cover") return lesson.coverTitle;
    if (id === "sentence") return state.sentencePhase === "words" ? "이 책에 나올까요? — 낱말 O/X" : (lesson.sentences[state.sentenceIndex]?.text || "");
    if (id === "paragraph") return state.paragraphReady ? (lesson.questions[state.questionIndex]?.prompt || "질문 마침") : "전체 글 읽는 중";
    if (id === "vocab") return (lesson.vocab || [])[state.vocabIndex]?.word || "낱말 뜻 마침";
    if (id === "game1") return lesson.game1[Math.min(state.game1Index, lesson.game1.length - 1)]?.word || "";
    if (id === "game2") return state.game2Current != null ? (lesson.game2[state.game2Current]?.phrase || "") : "";
    return steps[state.step].sub;
  }

  function progressSnapshot() {
    const step = steps[state.step];
    return {
      step: state.step + 1,
      steps: steps.length,
      stepId: step.id,
      stepLabel: step.label,
      sessionLabel: lesson.sessionLabel,
      activityId: activityLabels[step.id],
      prompt: currentPrompt(step.id),
      elapsedMs: Math.round(performance.now() - state.activityStartedAt),
      ...activityCounts(step.id)
    };
  }
  window.ONQ_PROGRESS = progressSnapshot;
  // 코치가 화면을 넘기면 아이도 따라오게 하는 통로. 버튼을 눌러 흉내 내는 방법은
  // 표지처럼 차례에 버튼이 없는 화면으로 못 가고, 잠금이 그 클릭을 가로챈다.
  window.ONQ_GOTO = index => setStep(Number(index));

  // 읽기 평가 켜고 끄기 — 수업 중에는 **코치 콘솔**이 이 통로로 쥔다.
  // 아이 화면의 스위치는 자율학습에서만 보인다(코치가 없으니 끌 사람이 그뿐이다).
  // 코치 콘솔이 부른다. 켜면 낱말 O/X부터, 끄면 문장 읽기로 바로 간다.
  window.ONQ_WORDFIND = {
    get: () => state.wordFindOn,
    set(on) {
      const want = Boolean(on);
      if (want === state.wordFindOn) return;
      state.wordFindOn = want;
      // 이미 낱말 화면에 있는데 꺼지면 그 자리에서 읽기로 넘긴다.
      if (!want && state.sentencePhase === "words") {
        state.sentencePhase = "sentences";
        emit("activity_complete", { completion: "word_pool", skipped: true, by: "coach" });
      }
      if (steps[state.step].id === "sentence") render();
    }
  };

  window.ONQ_ASSESS = {
    get: () => state.speechEnabled,
    set(enabled) {
      const on = Boolean(enabled);
      if (on === state.speechEnabled) return;
      if (!on && (state.paragraphRecording || state.sentenceRecording)) {
        window.ONQ_OPENAI_PARAGRAPH_ASSESSOR?.release?.();
        state.paragraphRecording = state.paragraphAssessing = false;
        state.sentenceRecording = state.sentenceAssessing = false;
      }
      speech.setEnabled(on);
      render();
    }
  };

  function render() {
    const id = steps[state.step].id;
    const html = id === "cover" ? renderCover() : id === "game1" ? renderGame1() : id === "game2" ? renderGame2() : id === "sentence" ? renderSentence() : id === "paragraph" ? renderParagraph() : id === "vocab" ? renderVocab() : renderWorksheet();
    root.innerHTML = shell(html);
    setupCanvas();
    window.dispatchEvent(new CustomEvent("onq:progress", { detail: progressSnapshot() }));
  }

  function setStep(next) {
    const target = Math.max(0, Math.min(steps.length - 1, next));
    if (target === state.step) return;
    emit("activity_complete", { completion: "navigation_exit" });
    state.step = target;
    state.activityStartedAt = performance.now();
    state.modalOpen = false;          // 안내를 열어 둔 채 넘기면 모달이 따라오고, 그동안 판서가 꺼진다
    state.mobileMenuOpen = false;
    state.annotationTool = null;
    emit("activity_start");
    render();
  }

  // 소리를 멈춘다. 미리 만든 클립이든 브라우저 음성이든 한 자리에서 끈다.
  // 문장을 하나씩 이어 읽는다. 통째로 넘기면 중간에 못 멈추고 문장 경계도 뭉개진다.
  function speakSequence(lines) {
    let index = 0;
    const next = () => {
      if (!state.speakingAll || index >= lines.length) {
        if (state.speakingAll) { state.speakingAll = false; render(); }
        return;
      }
      const text = lines[index++];
      if (window.ONQ_AUDIO?.resolve(text)) {
        window.ONQ_AUDIO.play(text, { onended: next, onerror: next });
        return;
      }
      if (!("speechSynthesis" in window)) { state.speakingAll = false; render(); return; }
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ko-KR";
      utter.rate = .82;
      utter.onend = next;
      utter.onerror = next;
      speechSynthesis.speak(utter);
    };
    next();
  }

  function stopSpeak() {
    try { window.ONQ_AUDIO?.stop?.(); } catch (_) {}
    try { window.speechSynthesis?.cancel?.(); } catch (_) {}
    if (state.speakingAll) { state.speakingAll = false; render(); }
  }

  function speak(text, button, onDone) {
    if (window.ONQ_AUDIO?.resolve(text)) { if (button) button.classList.add("listening"); window.ONQ_AUDIO.play(text, { onended: () => { button?.classList.remove("listening"); onDone?.(); }, onerror: () => { button?.classList.remove("listening"); onDone?.(); } }); emit("audio_play", { text_id: text.slice(0, 24), voice_mode: "aoede_local", playback_rate: 1.1 }); return; }
    if (!("speechSynthesis" in window)) { toast("이 브라우저에서는 소리 재생을 사용할 수 없어요."); return; }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = .82;
    const voices = speechSynthesis.getVoices();
    utter.voice = voices.find(voice => voice.lang.toLowerCase().startsWith("ko") && /neural|natural|online/i.test(voice.name)) || voices.find(voice => voice.lang.toLowerCase().startsWith("ko")) || null;
    if (button) button.classList.add("listening");
    utter.onend = () => { if (button) button.classList.remove("listening"); onDone?.(); };
    utter.onerror = () => { if (button) button.classList.remove("listening"); onDone?.(); };
    speechSynthesis.speak(utter);
    emit("audio_play", { text_id: text.slice(0, 24) });
  }

  function toast(message) {
    document.querySelector(".toast")?.remove();
    const node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.textContent = message;
    document.body.append(node);
    window.setTimeout(() => node.remove(), 1800);
  }

  function handleGame1Chunk(button) {
    const item = lesson.game1[state.game1Index];
    const value = button.dataset.value;
    const expected = item.chunks[state.game1Selected.length];
    const correct = value === expected;
    emit("answer", { item_id: `g1-${state.game1Index}`, response: value, correct, response_time_ms: Math.round(performance.now() - state.activityStartedAt) });
    if (!correct) {
      state.game1Fails += 1;
      emit(state.game1Fails === 1 ? "retry" : "hint", { item_id: `g1-${state.game1Index}`, hint_level: state.game1Fails > 1 ? "initial_sound" : "retry" });
      render();
      return;
    }
    state.game1Selected.push(value);
    if (state.game1Selected.length === item.chunks.length) {
      toast("글자 조각을 모두 찾았어요.");
      window.setTimeout(() => {
        state.game1Index = (state.game1Index + 1) % lesson.game1.length;
        state.game1Selected = [];
        state.game1Fails = 0;
        if (state.game1Index === 0) emit("activity_complete", { completion: "all_items" });
        render();
      }, 700);
    } else render();
  }

  function handleMineAnswer(answer) {
    if (state.game2Current == null) return;
    const item = lesson.game2[state.game2Current];
    const correct = (answer === "safe") === item.safe;
    emit("answer", { item_id: `g2-${state.game2Current}`, response: answer, correct });
    if (!correct) { emit("retry", { item_id: `g2-${state.game2Current}` }); toast("짧은 말을 다시 읽고 골라 봐요."); return; }
    state.game2Done.add(state.game2Current);
    state.game2Current = null;
    if (state.game2Done.size === lesson.game2.length) emit("activity_complete", { completion: "all_items" });
    toast("찾았어요.");
    render();
  }

  function sentenceDone() {
    // API 평가가 없는 구간이라 남는 것이 「눌렀다」뿐이다. **얼마나 머물다 눌렀는지**를
    // 함께 남겨야 정말 읽었는지 사람이 살펴볼 수 있다(판정은 하지 않는다).
    const pace = window.ONQ_PACING?.take(`sentence:${state.sentenceIndex}`) || {};
    emit("reading_practice", {
      accuracy: "notApplicable", text_scope: "sentence", item_index: state.sentenceIndex,
      result_state: "unmeasured", target_syllables: (lesson.sentences[state.sentenceIndex].text.match(/[가-힣]/g) || []).length,
      ...pace
    });
    if (state.sentenceIndex < lesson.sentences.length - 1) state.sentenceIndex += 1;
    else { emit("activity_complete", { completion: "all_sentences" }); toast("문장을 모두 읽었어요."); }
    speech.activeTarget = null;
    state.sentenceRecording = false;
    state.sentenceAssessing = false;
    state.sentenceAssessment = null;
    render();
  }

  function normalizeReading(text) {
    const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
    const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
    const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
    const choGroup = { "ㅋ":"ㄱ", "ㅌ":"ㄷ", "ㅍ":"ㅂ", "ㅊ":"ㅈ" };
    return [...text.normalize("NFC")].map(char => {
      const code = char.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return /[가-힣0-9]/.test(char) ? char : "";
      const cho = Math.floor(code / 588);
      const jung = Math.floor((code % 588) / 28);
      const jong = code % 28;
      return `${choGroup[CHO[cho]] || CHO[cho]}${["ㅐ","ㅔ"].includes(JUNG[jung]) ? "ㅐ" : JUNG[jung]}${JONG[jong]}`;
    }).join("");
  }

  function similarity(a, b) {
    const x = normalizeReading(a), y = normalizeReading(b);
    if (!x.length || !y.length) return 0;
    const row = Array.from({ length: y.length + 1 }, (_, i) => i);
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

  async function evaluateReading(target, transcript, context) {
    if (typeof window.ONQ_READING_ASSESSOR?.evaluate === "function") {
      return window.ONQ_READING_ASSESSOR.evaluate({ lesson_id: lesson.lessonId, target, transcript, context });
    }
    return { source: "local_demo", correct: similarity(target, transcript) >= .75, similarity: similarity(target, transcript) };
  }

  class SpeechSession {
    constructor() {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.supported = Boolean(Recognition);
      this.enabled = false;
      this.running = false;
      this.activeTarget = null;
      this.paragraphMode = false;
      if (!Recognition) return;
      this.recognition = new Recognition();
      this.recognition.lang = "ko-KR";
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.onresult = event => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          if (!event.results[i].isFinal) continue;
          const transcript = event.results[i][0].transcript.trim();
          emit("speech_result", { transcript_length: transcript.length, assessor: "browser_or_hook" });
          if (window.ONQ_READING_PRACTICE?.active && typeof window.ONQ_READING_PRACTICE.handleTranscript === "function") {
            window.ONQ_READING_PRACTICE.handleTranscript(transcript);
          }
          else if (this.paragraphMode) state.paragraphTranscript += ` ${transcript}`;
          else if (this.activeTarget) this.scoreSentence(transcript);
        }
      };
      this.recognition.onend = () => {
        this.running = false;
        if (this.enabled) window.setTimeout(() => this.start(), 220);
      };
      this.recognition.onerror = event => {
        emit("speech_error", { error: event.error });
        if (["not-allowed", "service-not-allowed"].includes(event.error)) this.setEnabled(false);
      };
    }
    setEnabled(value) {
      this.enabled = value;
      state.speechEnabled = value;
      emit("speech_mode", { enabled: value, supported: this.supported });
      if (value) this.start(); else this.stop();
    }
    start() {
      if (!this.supported || this.running || !this.enabled) return;
      try { this.recognition.start(); this.running = true; } catch (_) { /* continuous session may already be starting */ }
    }
    stop() {
      this.activeTarget = null; this.paragraphMode = false;
      if (this.recognition && this.running) this.recognition.stop();
      this.running = false;
    }
    async scoreSentence(transcript) {
      const index = state.sentenceIndex;
      const item = lesson.sentences[index];
      this.activeTarget = null;
      const result = await evaluateReading(item.text, transcript, { activity: "sentence", item_index: index });
      emit("answer", { item_id: `sentence-${index}`, correct: result.correct, assessor: result.source || "integration" });
      window.dispatchEvent(new CustomEvent("onq:reading-assessment-result", { detail: {
        session_id: sessionKey,
        activity: "sentence",
        item_index: index,
        target_text: item.text,
        result
      } }));
      if (result.correct) { toast("문장을 정확하게 읽었어요."); window.setTimeout(sentenceDone, 650); }
      else {
        state.sentenceFails[index] = (state.sentenceFails[index] || 0) + 1;
        emit(state.sentenceFails[index] === 1 ? "retry" : "hint", { item_id: `sentence-${index}`, hint_level: "explicit_rule" });
        render();
      }
    }
  }

  const speech = new SpeechSession();

  async function toggleSentenceAssessment() {
    const assessor = window.ONQ_OPENAI_PARAGRAPH_ASSESSOR;
    const index = state.sentenceIndex;
    const item = lesson.sentences[index];
    if (!assessor?.isSupported?.()) {
      speech.activeTarget = item.text;
      toast("문장을 읽어 보세요.");
      return;
    }
    if (!state.sentenceRecording) {
      try {
        await assessor.start({ scope: "sentence", target: item.text, rules: [...lesson.focusRules, `${item.focus}: ${item.guide}`], silence_ms: 2300 });
        state.sentenceRecording = true;
        state.sentenceAssessing = false;
        state.sentenceAssessment = null;
        emit("reading_capture", { accuracy: "notApplicable", text_scope: "sentence", item_index: index, result_state: "recording_started", assessor: "gpt-audio-1.5" });
        render();
      } catch (_) {
        toast("마이크를 사용할 수 없어요. 평가를 끄면 계속 진행할 수 있어요.");
      }
      return;
    }
    state.sentenceRecording = false;
    state.sentenceAssessing = true;
    render();
    try {
      const result = await assessor.finish({ scope: "sentence", target: item.text, rules: [...lesson.focusRules, `${item.focus}: ${item.guide}`] });
      if (index !== state.sentenceIndex) return;
      state.sentenceAssessment = result;
      if (!result.correct) state.sentenceFails[index] = (state.sentenceFails[index] || 0) + 1;
      emit("reading_capture", { accuracy: "notApplicable", text_scope: "sentence", item_index: index, result_state: result.correct ? "measured_pass" : "measured_review", assessor: result.source || "gpt-audio-1.5", scores: result.scores, error_count: result.all_error_count || 0 });
      window.dispatchEvent(new CustomEvent("onq:reading-assessment-result", { detail: { session_id: sessionKey, activity: "sentence", item_index: index, target_text: item.text, result } }));
      toast("읽기 피드백을 확인해 보세요.");
    } catch (error) {
      state.sentenceAssessment = null;
      console.warn("[oncuvate] 읽기 평가 실패", error); toast("지금은 스스로 읽기를 쓸 수 없어요. 잠시 후 다시 해 주세요.");
    } finally {
      state.sentenceAssessing = false;
      render();
    }
  }

  async function toggleParagraphAssessment() {
    const assessor = window.ONQ_OPENAI_PARAGRAPH_ASSESSOR;
    const target = lesson.sentences.map(item => item.text).join(" ");
    if (!assessor?.isSupported?.()) {
      if (!state.paragraphReady) {
        state.paragraphReady = true;
        state.paragraphTranscript = "";
        speech.paragraphMode = true;
        toast("전체 글을 읽어 보세요.");
      } else {
        speech.paragraphMode = false;
        emit("reading_capture", { accuracy: "notApplicable", text_scope: "paragraph", transcript_length: state.paragraphTranscript.length, result_state: state.paragraphTranscript ? "captured" : "missing" });
        toast("이제 글에서 답을 찾아요.");
      }
      render();
      return;
    }
    if (!state.paragraphRecording) {
      try {
        await assessor.start({ scope: "paragraph", target, rules: lesson.focusRules, silence_ms: 4000 });
        state.paragraphRecording = true;
        state.paragraphReady = false;
        state.paragraphAssessment = null;
        state.paragraphTranscript = "";
        emit("reading_capture", { accuracy: "notApplicable", text_scope: "paragraph", result_state: "recording_started", assessor: "openai" });
        render();
      } catch (_) {
        toast("마이크를 사용할 수 없어요. 평가를 끄면 계속 진행할 수 있어요.");
      }
      return;
    }
    state.paragraphRecording = false;
    state.paragraphAssessing = true;
    render();
    try {
      const result = await assessor.finish({ scope: "paragraph", target, rules: lesson.focusRules });
      state.paragraphTranscript = result.transcript || "";
      state.paragraphAssessment = result;
      state.paragraphReady = true;
      emit("reading_capture", {
        text_scope: "paragraph",
        transcript_length: state.paragraphTranscript.length,
        result_state: result.correct ? "measured_pass" : "measured_review",
        assessor: result.source || "openai",
        similarity: result.similarity,
      });
      window.dispatchEvent(new CustomEvent("onq:reading-assessment-result", { detail: {
        session_id: sessionKey,
        activity: "paragraph",
        target_text: target,
        result,
      } }));
      toast(result.correct ? "전체 글 읽기를 마쳤어요." : "어려웠던 낱말을 확인한 뒤 질문을 시작해요.");
    } catch (error) {
      state.paragraphReady = false;
      state.paragraphAssessment = null;
      console.warn("[oncuvate] 읽기 평가 실패", error); toast("지금은 스스로 읽기를 쓸 수 없어요. 잠시 후 다시 해 주세요.");
    } finally {
      state.paragraphAssessing = false;
      render();
    }
  }

  function setupCanvas() {
    const canvas = document.querySelector(".annotation-canvas");
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(box.width * ratio));
    canvas.height = Math.max(1, Math.round(box.height * ratio));
    canvas._ratio = ratio;
    canvas._strokes = canvas._strokes || [];
    canvas._current = null;
    drawAnnotations(canvas);
    canvas.onpointerdown = event => {
      if (!state.annotationTool) return;
      const point = canvasPoint(canvas, event);
      if (state.annotationTool === "text") {
        const value = window.prompt("적을 내용을 입력하세요.", "");
        if (value) { canvas._strokes.push({ tool: "text", points: [point], text: value }); drawAnnotations(canvas); }
        return;
      }
      canvas.setPointerCapture(event.pointerId);
      canvas._current = { tool: state.annotationTool, points: [point] };
    };
    canvas.onpointermove = event => {
      if (!canvas._current) return;
      canvas._current.points.push(canvasPoint(canvas, event));
      drawAnnotations(canvas, canvas._current);
    };
    canvas.onpointerup = () => {
      if (!canvas._current) return;
      canvas._strokes.push(canvas._current);
      canvas._current = null;
      drawAnnotations(canvas);
    };
  }

  function canvasPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function drawAnnotations(canvas, current = null) {
    const ctx = canvas.getContext("2d");
    const ratio = canvas._ratio || 1;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    [...(canvas._strokes || []), ...(current ? [current] : [])].forEach(stroke => {
      if (stroke.tool === "text") {
        ctx.globalAlpha = 1; ctx.fillStyle = "#35206f"; ctx.font = `700 22px ${getComputedStyle(document.body).fontFamily}`;
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y); return;
      }
      if (stroke.points.length < 2) return;
      ctx.globalAlpha = stroke.tool === "highlight" ? .24 : .95;
      ctx.strokeStyle = stroke.tool === "highlight" ? "#4bc9dc" : "#35206f";
      ctx.lineWidth = stroke.tool === "highlight" ? 20 : 3.5;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length - 1; i += 1) {
        const p = stroke.points[i], next = stroke.points[i + 1];
        ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
      }
      const last = stroke.points[stroke.points.length - 1]; ctx.lineTo(last.x, last.y); ctx.stroke(); ctx.globalAlpha = 1;
    });
  }

  root.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    if (button.dataset.step != null) { setStep(Number(button.dataset.step)); return; }
    if (action === "next") { setStep(state.step + 1); return; }
    if (action === "prev") { setStep(state.step - 1); return; }
    if (action === "toggle-menu") { state.menuHidden = !state.menuHidden; state.mobileMenuOpen = !state.menuHidden; render(); return; }
    if (action === "toggle-lock") { state.locked = !state.locked; if (state.locked) { state.menuHidden = true; state.mobileMenuOpen = false; } render(); return; }
    if (action === "ask-help") {
      // 🔴 이것은 **도움이 아니라 도움 요청**이다. 아이가 눌렀다고 도움이 주어진 것이 아니고,
      // 이유가 읽기와 무관할 수도 있다(소리가 안 나요·화면이 안 넘어가요).
      // ⇒ `data-track="hint"`를 붙이지 않는다. 규격은 「도움을 **주는** 요소에」라고 했다.
      //    붙이면 그 활동에 도움 기록이 생겨 플랫폼이 「혼자 해냄」 유도를 멈춘다.
      // 실제 도움은 **코치가 준 뒤** 코치 콘솔에서 수준과 함께 남긴다.
      emit("help_request", { activity: steps[state.step].id });
      toast("선생님에게 알렸어요. 잠시만 기다려요.");
      return;
    }
    if (action === "open-modal") { state.modalOpen = true; render(); return; }
    if (action === "close-modal" && !event.target.closest("[data-modal-card]") || action === "close-modal" && button) { state.modalOpen = false; render(); return; }
    if (action === "toggle-annotation") { state.annotationOpen = !state.annotationOpen; if (!state.annotationOpen) state.annotationTool = null; render(); return; }
    if (action === "close-annotation") { state.annotationOpen = false; state.annotationTool = null; render(); return; }
    if (action === "clear-annotation") { const canvas = document.querySelector(".annotation-canvas"); if (canvas) { canvas._strokes = []; drawAnnotations(canvas); } return; }
    if (button.dataset.annotationTool) { state.annotationTool = state.annotationTool === button.dataset.annotationTool ? null : button.dataset.annotationTool; render(); return; }
    if (action === "speak-game1") { speak(lesson.game1[state.game1Index].word, button); return; }
    if (button.dataset.chunkIndex != null) { handleGame1Chunk(button); return; }
    if (action === "remove-chunk") { state.game1Selected.pop(); render(); return; }
    if (button.dataset.mineIndex != null) { state.game2Current = Number(button.dataset.mineIndex); speak(lesson.game2[state.game2Current].phrase); render(); return; }
    if (button.dataset.mineAnswer) { handleMineAnswer(button.dataset.mineAnswer); return; }
    if (action === "speak-game2") { speak("낱말을 고르고 짧은 말을 읽은 뒤 안전과 폭탄 중 하나를 골라요.", button); return; }
    if (button.dataset.wordOx) {
      if (state.wordPicked !== null) return;
      const order = wordOrder(), poolIndex = order[state.wordIndex];
      const item = lesson.wordPool[poolIndex];
      if (!item) return;
      const said = button.dataset.wordOx === "yes";
      const correct = said === item.related;
      state.wordPicked = said;
      if (correct) state.wordFound.add(poolIndex);
      // 낱말 찾기는 평가 대상이 아니다(주의력·작업기억을 보는 자리).
      // 정오 칸을 비우면 그 문항이 버려지므로 「해당 없음」을 명시한다.
      emit("answer", { item_id: `word-ox-${poolIndex}`, response: said ? "나와요" : "안 나와요",
                       correct, accuracy: "notApplicable", target_word: item.word,
                       attempt_no: state.wordAttempt });
      render();
      return;
    }
    if (button.dataset.vocabChoice != null) {
      if (state.vocabPicked != null) return;
      const items = lesson.vocab || [], item = items[state.vocabIndex];
      if (!item) return;
      const phase = state.vocabPhase, spot = phase === "book" ? item.book : item.daily;
      const value = button.dataset.vocabChoice, correct = value === spot.answer;
      state.vocabPicked = value;
      if (correct) state.vocabScore[phase] += 1;
      emit("answer", {
        item_id: `vocab-${state.vocabIndex}-${phase}`,
        response: value, correct,
        // 3값 중 둘만 난다 — 2택이라 스스로 고칠 자리가 없다.
        accuracy: correct ? "accurate" : "support",
        target_word: item.word,
        attempt_no: state.vocabAttempt,
        // ②는 ①에서 뜻을 봤는지에 따라 성격이 다르다. 다시 하기를 해도 이 표시는 이어진다.
        ...(phase === "book" ? { meaning_shown: state.vocabTaught.has(state.vocabIndex) } : {})
      });
      if (!correct) {
        // 틀리면 그 자리에서 뜻을 보여 준다(학습). 그것이 도움이므로 따로 남긴다.
        state.vocabTaught.add(state.vocabIndex);
        emit("support", { item_id: `vocab-${state.vocabIndex}-${phase}`,
                          help_level: "A2", help_by: "content", help_type: "meaning-shown" });
      }
      render();
      return;
    }
    if (action === "vocab-next") {
      const items = lesson.vocab || [];
      state.vocabPicked = null;
      if (state.vocabPhase === "daily") { state.vocabPhase = "book"; render(); return; }
      state.vocabPhase = "daily";
      state.vocabIndex += 1;
      if (state.vocabIndex >= items.length) {
        emit("activity_complete", { completion: "vocab", attempt_no: state.vocabAttempt,
          correct: state.vocabScore.daily + state.vocabScore.book, total: items.length * 2 });
      }
      render();
      return;
    }
    if (action === "word-restart") {
      // 그 활동만 처음으로 되돌린다. 회차 전체를 지우지 않는다.
      // 두 번째 판이 첫 판과 섞이지 않게 시도 번호를 올린다(규격 §12.1 `attemptNo`).
      state.wordAttempt += 1;
      state.wordOrder = null; state.wordIndex = 0; state.wordPicked = null;
      state.wordFound = new Set();
      emit("activity_start", { restarted: true, attempt_no: state.wordAttempt });
      render();
      return;
    }
    if (action === "vocab-restart") {
      state.vocabAttempt += 1;
      state.vocabIndex = 0; state.vocabPhase = "daily"; state.vocabPicked = null;
      state.vocabScore = { daily: 0, book: 0 };
      // ⚠️ `vocabTaught`는 **지우지 않는다.** 1판에서 뜻을 본 아이는 2판을 그 뜻을 아는
      // 상태로 푼다. 지우면 「모르는 상태에서 맞혔다」로 기록되어 사실과 달라진다.
      emit("activity_start", { restarted: true, attempt_no: state.vocabAttempt });
      render();
      return;
    }
    if (action === "word-next") {
      state.wordPicked = null;
      state.wordIndex += 1;
      if (state.wordIndex >= wordOrder().length) {
        emit("activity_complete", { completion: "word_pool",
          correct: state.wordFound.size, total: lesson.wordPool.length });
      }
      render();
      return;
    }
    if (action === "start-sentences") { state.sentencePhase = "sentences"; emit("activity_complete", { completion: "word_pool" }); render(); return; }
    if (button.dataset.speechMode) {
      const enabled = button.dataset.speechMode === "on";
      if (!enabled && (state.paragraphRecording || state.sentenceRecording)) {
        window.ONQ_OPENAI_PARAGRAPH_ASSESSOR?.release?.();
        state.paragraphRecording = false;
        state.paragraphAssessing = false;
        state.sentenceRecording = false;
        state.sentenceAssessing = false;
      }
      speech.setEnabled(enabled);
      if (enabled && !speech.supported) toast("이 브라우저에서는 스스로 읽기를 쓸 수 없어요. 끔으로 두고 진행할 수 있어요.");
      render(); return;
    }
    if (action === "speak-sentence") {
      const key = `sentence:${state.sentenceIndex}`;
      // 자동 재생은 프로그램이 누른 것이다. 「다시 듣기」는 **아이가 청한 것만** 센다.
      if (event.isTrusted) window.ONQ_PACING?.replay(key);
      window.ONQ_PACING?.audioStart(key);
      speak(lesson.sentences[state.sentenceIndex].text, null, () => window.ONQ_PACING?.audioEnd(key));
      return;
    }
    if (action === "toggle-sentence-reading") { toggleSentenceAssessment(); return; }
    if (action === "retry-sentence-reading") { state.sentenceAssessment = null; toggleSentenceAssessment(); return; }
    if (action === "sentence-done") { sentenceDone(); return; }
    if (action === "speak-paragraph") {
      // 한 번 더 누르면 멈춘다 — 긴 글이라 끝까지 못 기다리는 아이가 있다.
      if (state.speakingAll) { stopSpeak(); return; }
      state.speakingAll = true;
      speakSequence(lesson.sentences.map(item => item.text));
      render();
      return;
    }
    if (action === "stop-speaking") { stopSpeak(); return; }
    if (button.dataset.speakSentence != null) {
      // 질문 단계 전에는 문장을 눌러 **그 문장만** 들어 본다.
      stopSpeak();
      const index = Number(button.dataset.speakSentence);
      const line = lesson.sentences[index];
      if (line) { speak(line.text, button); emit("audio_play", { item_id: `paragraph-${index}`, text_scope: "sentence" }); }
      return;
    }
    if (action === "speak-paragraph-guide") { speak("전체 글을 처음부터 끝까지 읽은 뒤 질문에 답해요.", button); return; }
    if (action === "toggle-paragraph-reading") {
      toggleParagraphAssessment(); return;
    }
    if (action === "retry-paragraph-reading") { state.paragraphAssessment = null; state.paragraphReady = false; toggleParagraphAssessment(); return; }
    if (action === "paragraph-done") { state.paragraphReady = true; emit("reading_capture", { accuracy: "notApplicable", text_scope: "paragraph", result_state: "not_measured" }); render(); return; }
    if (button.dataset.textIndex != null && state.paragraphReady) {
      const q = lesson.questions[state.questionIndex];
      const selected = Number(button.dataset.textIndex); const correct = selected === q.answer;
      const qFails = state.questionFails[state.questionIndex] || 0;
      emit("answer", { item_id: `comprehension-${state.questionIndex}`, response: selected, correct,
                       // 문항이 풀린 순간에만 3값을 붙인다(규격 「문항마다 3값」).
                       // 틀린 시도는 아래 retry가 따로 남긴다.
                       ...(correct ? { accuracy: window.ONQ_ACCURACY(qFails, false) } : {}) });
      const note = document.getElementById("questionFeedback");
      if (correct) {
        state.questionCorrect.add(state.questionIndex); if (note) { note.textContent = "본문에서 정확히 찾았어요."; note.classList.add("success"); }
        window.setTimeout(() => { state.questionIndex += 1; render(); }, 700);
      } else { state.questionFails[state.questionIndex] = qFails + 1;
        emit("retry", { item_id: `comprehension-${state.questionIndex}` }); if (note) note.textContent = "질문의 핵심 낱말과 같은 내용을 본문에서 다시 찾아봐요."; }
      return;
    }
    if (action === "lesson-complete") { emit("lesson_complete", { completion: "completed" }); toast("오늘 읽기를 마쳤어요."); }
  });

  document.addEventListener("click", event => {
    if (event.target.classList?.contains("modal-backdrop")) { state.modalOpen = false; render(); }
  });
  window.addEventListener("resize", () => setupCanvas(), { passive: true });
  window.addEventListener("onq:reading-auto-stop", event => {
    if (event.detail?.scope === "sentence" && state.sentenceRecording && !state.sentenceAssessing) toggleSentenceAssessment();
    if (event.detail?.scope === "paragraph" && state.paragraphRecording && !state.paragraphAssessing) toggleParagraphAssessment();
  });
  window.addEventListener("beforeunload", () => speech.stop());

  emit("lesson_start", { content_pack_version: pack.version });
  emit("activity_start");
  render();
})();
