(() => {
  "use strict";

  const pack = window.ONQ_CONTENT_PACK;
  // 빈 그림 자리 — 그림 파일이 아직 없으면 깨진 표시 대신 「그림 준비 중」 카드로(shared.css .img-missing).
  window.addEventListener("error", event => {
    const el = event.target;
    if (el && el.tagName === "IMG" && el.closest && el.closest("#app")) el.classList.add("img-missing");
  }, true);
  const sessionKey = document.body.dataset.session;
  const lesson = pack.sessions[sessionKey];

  // 전체 읽기 오른쪽 기다림 판(2026-10-05 「저학년용 디자인 · 동적인 효과」) — 질문이 열리기 전 화면.
  //   읽기 전: 통통 튀는 젤리 + 말풍선 + 두 걸음(① 글 읽기 → ② 질문) · 읽는 중: 소리 물결 · 살펴보는 중: 점 세 개
  function paragraphWaitPanel() {
    const reading = state.paragraphRecording, checking = state.paragraphAssessing;
    const qn = (lesson.questions || []).length;
    const jelly = reading || checking
      ? `<div class="qp-jelly qp-listen"><i class="qp-wave"></i><i class="qp-wave w2"></i><img src="assets/jelly/listening.png" alt="읽기를 듣는 젤리티처"></div>`
      : `<button class="jelly-button qp-jelly" type="button" aria-label="전체 글 읽기 안내 듣기" data-action="speak-paragraph-guide"><img src="assets/jelly/guide.png" alt="글을 가리키는 젤리티처"></button>`;
    const say = checking ? `잘 읽었는지 보고 있어요<span class="qp-dots"><i></i><i></i><i></i></span>`
      : reading ? "천천히 끝까지 읽어요" : "글을 처음부터 끝까지 읽어요!";
    return `<aside class="question-panel qp-v2"><div class="qp-wait">
      <span class="qp-star s1">★</span><span class="qp-star s2">✦</span><span class="qp-star s3">★</span>
      ${jelly}
      <div class="qp-bubble">${say}</div>
      <ol class="qp-steps" aria-label="순서">
        <li class="${checking ? "done" : "on"}"><b>${checking ? "✓" : "1"}</b><span>글 읽기</span></li>
        <li class="qp-arrow" aria-hidden="true">›</li>
        <li class="${checking ? "on" : "lock"}"><b>${checking ? "2" : "🔒"}</b><span>질문 ${qn}개</span></li>
      </ol>
    </div></aside>`;
  }
  const root = document.getElementById("app");
  const steps = [
    { id: "cover", label: "표지", sub: "오늘 읽기" },
    // 낱말 뜻이 **맨 앞**이다. ①(일상 그림)은 가르치기 전에 재므로 어휘 수준은 그대로
    // 남고, 뜻을 알려 준 뒤에 읽으므로 **읽기가 느린 이유를 해독 쪽으로 좁힐 수 있다**.
    // ②(책 문장)도 아직 안 읽은 문장이라 기억이 안 섞인 순수한 옮기기 시험이 된다.
    { id: "vocab", label: "어휘체크", sub: "그림 보고 고르기" },
    // 🔴 id 는 `game2` 그대로다 — 학습기록·코치 통로·차례 이동이 이 id로 묶여 있다.
    //    2026-09-30에 안쪽 게임만 젤리캡쳐(5×5 색 타일) → 점핑워드로 갈아 끼웠다.
    { id: "game2", label: "점핑워드", sub: "뛰어오르는 젤리 잡고 읽기" },
    { id: "game1", label: "문장 완성", sub: "듣고 순서 맞추기" },
    { id: "sentence", label: "나누어 읽기", sub: "한 문장씩 끊어 읽기" },
    { id: "paragraph", label: "전체 읽기", sub: "전체 글과 질문" },
    // 🆕 이야기 차례(세계전래동화) — 인지훈련게임 「차례대로 놓기」 엔진. 데이터 window.ONQ_STORY_ORDER 가 있을 때만.
    { id: "storyorder", label: "이야기 차례", sub: "일어난 차례대로 놓기" },
    // 🆕 6번 낱말 빙고(2026-10-04 사용자 지정) — 화면은 release/bingo-v1.js 가 그린다. 3단계 쓰기는 7번으로.
    { id: "bingo", label: "낱말 빙고", sub: "듣고 찾아 빙고" },
    // 🆕 비단어 게임(2026-10-05 · L6·L7 음운변동 회차만) — 비단어 빙고 / 비단어 탐정 중 골라 하기. 화면은 release/nonword-games-v1.js.
    { id: "nonword", label: "비단어 게임", sub: "빙고·탐정 골라 하기" },
    { id: "worksheet", label: "3단계 쓰기", sub: "보기·첫소리·스스로" }
  ].filter(step => (step.id !== "storyorder" || !!window.ONQ_STORY_ORDER) && (step.id !== "vocab" || (lesson.vocab || []).length > 0) && (step.id !== "nonword" || (lesson.nonwords || []).length >= 16));

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
    // 나누어 읽기 도입(낱말 예측)은 팩에서 wordIntro:false 면 건너뛴다(2026-10-04 사용자 지정 「도입활동 없애고」).
    sentencePhase: lesson.wordIntro === false ? "sentences" : "words",
    wordOrder: null,
    wordIndex: 0,
    wordPicked: null,
    wordAttempt: 1,        // 다시 하면 2, 3… (규격 §12.1 `attemptNo`)
    wordSel: new Set(),    // 🆕 고르기 판(wordPoolMode "pick") — 아이가 고른 낱말 번호
    wordChecked: false,    // 🆕 「다 골랐어요」를 눌렀나
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
    // 질문 단계는 주고받는 대화로 굴러간다. 화면을 다시 그려도 지난 문답이
    // 남아 있어야 아이가 되짚을 수 있어, 기록은 그릴 때 만들지 않고 여기 쌓는다.
    chat: [],                 // {who:"teacher"|"child", text, tone}
    chatAsked: new Set(),     // 이미 물은 질문 번호 — 다시 그려도 한 번만 붙는다
    chatClosed: false,        // 마무리 말풍선을 붙였는가
    questionLocked: false,    // 정답 뒤 다음 질문으로 넘어가는 사이 연타를 막는다
    vocabIndex: 0,
    vocabPhase: "daily",        // daily → (틀리면 뜻 보기) → book
    vocabPicked: null,
    vocabTaught: new Set(),     // ①에서 틀려 뜻을 본 낱말. ②의 도움 수준이 갈린다
    vocabScore: { daily: 0, book: 0 },
    vocabAttempt: 1,
    annotationOpen: false,
    hanjaOpen: false,            // 한자 뜻풀이를 폈는가(어휘마다 새로 접는다)
    annotationTool: null,
    activityStartedAt: performance.now()
  };

  const instructions = {
    cover: ["오늘 읽을 그림책과 목표를 살펴봐요.", "준비되면 시작을 눌러요."],
    game1: ["재생 버튼을 눌러 구나 문장을 끝까지 들어요.", "소리가 끝나면 낱말 카드를 들은 순서대로 골라요.", "순서 확인 뒤 선택한 낱말을 눌러 고칠 수 있어요."],
    game2: ["바닥에서 콩콩 뛰던 젤리 하나가 하늘로 튀어 올라요.", "하늘 선에 닿기 전에 눌러 잡으면 숨어 있던 낱말이 크게 나타나요.", "소리가 나기 전에 먼저 소리 내어 읽어 봐요."],
    sentence: ["먼저 그림과 관계있는 낱말을 다섯 개 이상 찾아요.", "그다음 그림과 한 문장씩 보며 정확하게 읽어요.", "도움이 나오면 바로 비슷한 문장에 적용해요."],
    storyorder: ["이야기에서 일어난 일을 떠올려요.", "카드를 일이 일어난 차례대로 눌러 놓아요.", "어려우면 ‘끝 보기’를 눌러요."],
    paragraph: ["회차에서 읽은 전체 글을 처음부터 끝까지 읽어요.", "질문을 보고 정답이 되는 문장을 본문에서 직접 골라요."],
    bingo: ["젤리코치가 부르는 낱말을 잘 들어요.", "판에서 그 낱말을 찾아 눌러요.", "한 줄을 채우면 빙고! 세 줄에 도전해요."],
    nonword: ["처음 보는 낱말로 소리 규칙을 써 봐요.", "빙고: 소리를 듣고 글자를 찾아요.", "탐정: 글자를 보고 어떻게 읽는지 골라요."],
    worksheet: ["음운인식, 기초 문법, 철자 지식을 확인하는 인쇄 활동은 다음 제작 단계에서 연결해요."]
  };

  // 작업기억 부담 — 42번(2026-08-22)에서 확정된 해석정보. 평가축이 아니라
  // 「이 활동이 머리에 얼마나 붙들게 하는가」를 읽는 쪽에 알려 주는 값이다.
  // primary=주부담 · secondary=보조부담 · none=해당 없음
  // 🆕 빈칸 채우기 갈래 — 차례 밑글과 안내를 바꾼다(화면은 activity-overrides.js 가 그린다).
  if (lesson.game1Mode === "fill") {
    const g1Step = steps.find(step => step.id === "game1");
    if (g1Step) g1Step.sub = "빈칸에 낱말 골라 넣기";
    instructions.game1 = ["젤리티처를 눌러 문장을 들어요.", "빈칸에 들어갈 낱말을 보기 셋 가운데 골라요.", "들리는 소리와 쓰는 글자가 다를 수 있어요. 잘 보고 골라요."];
  }

  const workingMemoryLoad = {
    cover: "none",
    game2: "primary",      // 규칙 셋을 쥐고 판 전체를 훑는다
    game1: "primary",      // 들은 순서를 붙들고 카드를 고른다
    sentence: "secondary", // 읽기가 주부담, 기억은 보조
    paragraph: "secondary",// 전체 글을 읽고 질문에 답한다
    storyorder: "primary", // 일어난 일을 차례대로 떠올려 붙든다
    bingo: "secondary",    // 들은 낱말을 붙들고 판을 훑는다
    nonword: "secondary",  // 처음 보는 낱말에 규칙을 옮겨 쓴다
    vocab: "none",         // 그림과 문장이 눈앞에 있다
    worksheet: "none"      // 눈앞의 문장을 보고 쓴다
  };

  const activityLabels = {
    cover: "표지",
    game1: "intervention.phrase_sequence",
    game2: "intervention.word_phrase",
    sentence: "intervention.sentence",
    paragraph: "evaluation.paragraph",
    storyorder: "game.story_order",
    bingo: "game.word_bingo",
    nonword: "game.nonword_bingo",
    vocab: "evaluation.word_meaning",
    worksheet: "support.printable"
  };

  // 음운·철자 인식 요구도 — 49번(2026-08-23) 해석정보. 값은 high·mid·low·none.
  // ⚠️ workingMemoryLoad와 같은 규율 — **평가축이 아니라 해석정보**다. 이 값으로 능력점수나
  //    진단문구를 만들지 않고, 읽기 결과가 낮을 때 「원인을 짐작할 근거」로만 쓴다.
  //    `none`이 있어야 「해당 없음」과 「안 적었음」이 갈린다.
  const phonologicalAwareness = {
    cover: "none", vocab: "none", game2: "low", game1: "high",
    sentence: "high", paragraph: "mid", storyorder: "none", bingo: "mid", nonword: "high", worksheet: "high"
  };
  const spellingAwareness = {
    cover: "none", vocab: "mid", game2: "mid", game1: "low",
    sentence: "mid", paragraph: "mid", storyorder: "low", bingo: "high", nonword: "high", worksheet: "high"
  };

  // 집계 가능 그룹(`trendGroupId`) — 규격 §12.2 「**추세분석 가능한 값만** 명시적으로 묶는다」.
  // 활동 이름이 아니라 **무엇의 추세를 보는가**로 묶는다. 표지는 활동이 아니라 비운다.
  const trendGroupIds = {
    vocab: "trend.vocabulary", game2: "trend.vocabulary",
    game1: "trend.spelling",   worksheet: "trend.spelling",
    sentence: "trend.fluency", paragraph: "trend.fluency", bingo: "trend.spelling", nonword: "trend.spelling"
  };
  // 🆕 빈칸 채우기 갈래(2026-10-04) — 같은 game1 자리지만 **재는 것이 다르다.**
  //   순서 맞추기(intervention.phrase_sequence)는 들은 어절 순서를 붙드는 일이고,
  //   빈칸 채우기는 들은 소리 [바라미]에서 **글자 바람이를 고르는 일**이다.
  //   이름표(=measureId)를 같이 쓰면 다른 책의 순서 맞추기 기록과 한 칸에 섞여 추이가 흐려진다.
  if (lesson.game1Mode === "fill") {
    activityLabels.game1 = "intervention.spelling_choice";
    workingMemoryLoad.game1 = "secondary";      // 한 줄을 듣고 보기 셋에서 고른다 — 순서를 붙들 일이 없다
    phonologicalAwareness.game1 = "mid";        // 소리를 들어야 하지만 조작하지는 않는다
    spellingAwareness.game1 = "high";           // 소리와 다른 글자를 골라야 한다 — 이 활동의 핵심
  }

  // 평가의미(`measureId`)는 활동 이름표를 그대로 쓴다 — 이미 「무엇을 재는가」로 지어져 있다.


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
      measure_id: activityLabels[steps[state.step].id],
      working_memory_load: workingMemoryLoad[steps[state.step].id],
      phonological_awareness: phonologicalAwareness[steps[state.step].id],
      spelling_awareness: spellingAwareness[steps[state.step].id],
      ...(trendGroupIds[steps[state.step].id] ? { trend_group_id: trendGroupIds[steps[state.step].id] } : {}),
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

  // 삽화만 잘라 둔 그림. 회차가 여럿인 책에서 page-01 을 못 박아 두면
  // 2회차가 1회차 장면을 띄운다(나누어 읽기 장면 카드가 그랬다).
  function artImage(page) {
    return `assets/book/art/page-${String(page).padStart(2, "0")}-art.webp`;
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
            <div class="lesson-meta"><strong>${esc(pack.bookTitle)}${Object.keys(pack.sessions).length > 1 ? " · " + esc(lesson.sessionLabel) : ""}</strong><span>${esc(lesson.range)}</span></div>
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
                 data-measure-id="${activityLabels[steps[state.step].id]}"${trendGroupIds[steps[state.step].id] ? ` data-trend-group-id="${trendGroupIds[steps[state.step].id]}"` : ""}
                 data-working-memory-load="${workingMemoryLoad[steps[state.step].id]}"
                 data-phonological-awareness="${phonologicalAwareness[steps[state.step].id]}"
                 data-spelling-awareness="${spellingAwareness[steps[state.step].id]}"${currentRuleId() ? ` data-target-rule-id="${currentRuleId()}"` : ""}>
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
    // 전해 오는 이야기(탈무드·이솝 등)는 지은이가 따로 없다.
    // 그럴 때는 originalWork 에 「이솝 우화」처럼 적어 「원작: 이솝 우화」로 찍는다.
    const origin = c.originalWork || [
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
      <div class="cover-copy"><span class="cover-badge">${esc(pack.series)}${Object.keys(pack.sessions).length > 1 ? " · " + esc(lesson.sessionLabel) : ""}</span><h1>${esc(lesson.coverTitle)}</h1><p>${esc(lesson.goal)}</p><button class="primary-btn cover-start" type="button" data-action="next" data-track="activity-complete">읽기 시작</button></div>
      <div class="cover-side">
        <div class="cover-art"><img src="${lesson.coverImage}" alt="${esc(pack.bookTitle)} 표지"></div>
        ${creditLine()}
      </div>
    </div></div>`;
  }

  function renderGame1() {
    const item = lesson.game1[state.game1Index];
    // game1 이 비어 있어도 여기서 터지면 안 된다. 이 자리는 activity-overrides 가
    // **어절 카드 순서 맞추기**로 덮어쓰는데, 덮어쓰기가 붙기 전 한 프레임을 이 함수가 그린다.
    // 예전에는 빈 배열이면 item.chunks 에서 터져 **문장 완성 차례가 아예 안 열렸다.**
    if (!item) return `<div class="activity-view">${pageHead("문장 완성", "들은 문장을 순서대로 놓아요")}</div>`;
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

  // ── 점핑워드 (2단계) ────────────────────────────────────────────────
  // 옛 젤리캡쳐(5×5 색 타일 논리 퍼즐)를 걷어내고, ORKR_diagraph 의 점핑워드를 그대로 옮겼다.
  // 낱말은 `lesson.game2[].word` — 모두 그 회차 본문 어절이고 미리 만든 클립이 있다.
  // 🔴 아이 화면에 읽기 판정을 붙이지 않는다. 게임 기록(걸린 시간·개수)은 게임 기록일 뿐이다.
  let jump = null;
  function jumpGame() {
    if (jump) return jump;
    if (typeof window.createJumpingWords !== "function") return null;
    const words = (lesson.game2 || []).map(item => item.word).filter(Boolean);
    if (!words.length) return null;
    jump = window.createJumpingWords({
      words,
      sprite: "assets/jelly/jellymonster-face.png",
      wordHtml: w => esc(w),                 // 꾸미지 않는다 — 낱말만 크게
      speak,                                 // 이 셸의 낱말 소리(Aoede 클립)를 그대로 쓴다
      policy: () => ({ easy: "child", speed: "child" }),
      // 잡은 낱말의 규칙을 `data-target-rule-id` 로 흘려 보낸다(없는 값은 지어내지 않는다).
      onCatch: word => {
        const index = (lesson.game2 || []).findIndex(item => item.word === word);
        if (index >= 0) { state.game2Current = index; state.game2Done.add(index); }
        emit("answer", { item_id: `g2-${index}`, response: word, correct: null, result_state: "not_yet_judged" });
        pushProgress();     // 다시 그리지 않고 코치 숫자만 따라오게 한다(무대를 흔들면 안 된다)
      },
      onMiss: word => {
        emit("retry", { item_id: `g2-${(lesson.game2 || []).findIndex(i => i.word === word)}`, reason: "missed_jelly" });
        pushProgress();
      },
      onFinish: result => {
        emit("activity_complete", {
          completion: "jumping_words", mode: result.mode,
          caught: result.caught, missed: result.missed, elapsed_ms: result.ms
        });
        pushProgress();
      }
    });
    return jump;
  }
  function stopJump() { if (jump) { jump.stop(); jump = null; } }

  function renderGame2() {
    return `<div class="activity-view">${pageHead("뛰어오르는 젤리를 잡아요", "잡은 낱말을 소리 내어 읽어요")}
      <div class="onq-jump" id="jumpHost"></div>
    </div>`;
  }

  // 화면을 그린 뒤 붙인다. 다시 그려도 게임은 살아 있고(같은 객체), 차례를 떠나면 stop().
  function mountJump() {
    const host = document.getElementById("jumpHost");
    if (!host) return;
    const game = jumpGame();
    if (!game) { host.innerHTML = `<div class="placeholder-card"><h2>게임을 불러오는 중이에요</h2><p>수업 주소로 열어야 게임 파일을 읽을 수 있어요.</p></div>`; return; }
    game.mount(host);
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
          <div class="feedback-line" id="speechFeedback" role="status">${(window[`ONQ_${sessionKey.toUpperCase()}_TARGET_EXPANSIONS`] || []).some(t => item.text.includes(t.target))
            ? "노란 낱말을 누르면 더 읽어 볼 수 있어요."
            : "소리를 들어 보고, 스스로 읽은 뒤 ‘읽었어요’를 눌러요."}</div>
        </section>
      </div>
    </div>`;
  }

  // 낱말 하나씩 「이 낱말이 나올까요?」 O/X.
  // 🔑 이 자리는 **아직 본문을 읽기 전**이다. 「나왔는지 떠올려 보라」고 물으면
  //    읽지도 않은 것을 기억해 내라는 말이 된다. **예측**으로 묻는다.
  // 여러 개를 한꺼번에 훑던 것을 하나씩으로 바꿨다 — 한 화면에 한 행동(설계원칙)이고,
  // 앞 활동에서 나왔던 낱말을 알아보는지(주의력·작업기억)가 그대로 드러난다.
  // ⚠️ 평가 대상은 아니다. 그래서 정오 칸은 `notApplicable`로 명시한다.
  function wordOrder() {
    if (!state.wordOrder) state.wordOrder = shuffle(lesson.wordPool.map((_, i) => i));
    return state.wordOrder;
  }

  // 🆕 고르기 판(lesson.wordPoolMode === "pick", 2026-10-04 사용자 지정)
  //   아홉 칸을 한꺼번에 보여 주고 **나올 것 같은 낱말만** 고른다. 나오는 낱말 여섯 + 모양이 닮은 함정 셋.
  //   예측이라 평가하지 않는다(accuracy notApplicable). 아이 화면에 맞힌 개수를 띄우지 않는다 — 칸 색으로만 보여 준다.
  function renderWordPick() {
    const order = wordOrder();
    const checked = state.wordChecked;
    const cell = poolIndex => {
      const item = lesson.wordPool[poolIndex], sel = state.wordSel.has(poolIndex);
      let cls = sel ? "sel" : "", tag = "";
      if (checked) {
        if (item.related && sel) { cls = "hit"; tag = "나와요"; }
        else if (item.related) { cls = "miss"; tag = "나와요"; }
        else if (sel) { cls = "trap"; tag = "안 나와요"; }
        else { cls = "rest"; tag = ""; }
      }
      return `<button type="button" class="pick-cell ${cls}" data-pick-word="${poolIndex}" aria-pressed="${sel}" ${checked ? "disabled" : ""}><b>${esc(item.word)}</b>${tag ? `<small>${tag}</small>` : ""}</button>`;
    };
    return `<div class="activity-view">${pageHead("어떤 낱말이 나올까요?", "읽기 전에 예측해 봐요")}
      <div class="word-quiz-layout">
        <div class="scene-card"><img src="${artImage((lesson.sentences[0] || {}).page || 1)}" alt="《${esc(pack.bookTitle)}》 ${(lesson.sentences[0] || {}).page || 1}쪽 장면"></div>
        <section class="word-quiz-card pick-card">
          <div class="pick-grid">${order.map(cell).join("")}</div>
          <div class="feedback-line ${checked ? "good" : ""}" role="status">${checked
            ? "‘나와요’ 낱말을 글에서 찾아봐요!"
            : "나올 것 같은 낱말을 <b>모두</b> 눌러요."}</div>
          <div class="pick-actions">${checked
            ? `<button class="quiet-btn" type="button" data-action="word-restart">다시 해 볼래요</button><button class="primary-btn" type="button" data-action="start-sentences">문장 읽기</button>`
            : `<button class="quiet-btn skip-wordfind" type="button" data-action="start-sentences">건너뛰기</button><button class="primary-btn" type="button" data-action="word-pick-check" ${state.wordSel.size ? "" : "disabled"}>다 골랐어요</button>`}</div>
        </section>
      </div>
    </div>`;
  }

  function renderWordFind() {
    if (lesson.wordPoolMode === "pick") return renderWordPick();
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
    return `<div class="activity-view">${pageHead("이 낱말이 나올까요?", "읽기 전에 예측해 봐요")}
      <div class="word-quiz-layout">
        <div class="scene-card"><img src="${artImage((lesson.sentences[0] || {}).page || 1)}" alt="《${esc(pack.bookTitle)}》 ${(lesson.sentences[0] || {}).page || 1}쪽 장면"></div>
        <section class="word-quiz-card">
          <span class="sentence-progress">${state.wordIndex + 1} / ${order.length}</span>
          <p class="word-quiz-word">${esc(item.word)}</p>
          <div class="word-quiz-choices">
            <button class="word-quiz-btn yes ${mark(true)}" type="button" data-word-ox="yes" data-track="answer" data-correct="${item.related}" data-accuracy="notApplicable" data-attempt-no="${state.wordAttempt}" ${picked === null ? "" : "disabled"}><span aria-hidden="true">○</span>나와요</button>
            <button class="word-quiz-btn no ${mark(false)}" type="button" data-word-ox="no" data-track="answer" data-correct="${!item.related}" data-accuracy="notApplicable" data-attempt-no="${state.wordAttempt}" ${picked === null ? "" : "disabled"}><span aria-hidden="true">✕</span>안 나와요</button>
          </div>
          <div class="feedback-line ${right === true ? "good" : right === false ? "teach" : ""}" role="status">${
            picked === null ? "이 낱말이 나올지 예측해 봐요."
            : right ? (item.related ? "예측이 맞았어요. 이 낱말이 나와요." : "예측이 맞았어요. 이 낱말은 안 나와요.")
                    : (item.related ? "이 낱말은 나와요. 곧 만나게 돼요." : "이 낱말은 안 나와요.")}</div>
          ${picked === null ? "" : `<button class="primary-btn" type="button" data-action="word-next">다음</button>`}
          <button class="quiet-btn skip-wordfind" type="button" data-action="start-sentences">예측 건너뛰고 바로 읽기</button>
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

  // ── 질문 단계 대화창 ────────────────────────────────────────────
  // 젤리티처가 묻고, 아이가 본문에서 고른 문장이 **그대로** 답 말풍선이 된다.
  // 점수·별점·「잘했어요」는 두지 않는다(규격 8장) — 맞고 틀림은 말풍선의 말로만 전한다.
  function chatPush(who, text, tone) {
    if (!text) return;
    state.chat.push({ who, text, tone: tone || "" });
  }

  // 지금 물어야 할 말을 대화에 채운다. 여러 번 불러도 한 번만 붙는다.
  function chatSyncPrompt() {
    if (state.questionCorrect.size === lesson.questions.length) {
      if (!state.chatClosed) {
        state.chatClosed = true;
        chatPush("teacher", "글에서 답을 모두 찾았어요. 오늘 읽기는 여기까지예요.", "close");
      }
      return;
    }
    const q = lesson.questions[state.questionIndex];
    if (!q || state.chatAsked.has(state.questionIndex)) return;
    state.chatAsked.add(state.questionIndex);
    chatPush("teacher", q.prompt, "ask");
  }

  function questionChatPanel(finished, q) {
    const total = lesson.questions.length;
    const step = Math.min(state.questionIndex + 1, total);
    const lastTeacher = [...state.chat].reverse().find(entry => entry.who === "teacher");
    const face = tone => tone === "close" ? "praise" : tone === "again" ? "thinking" : "guide";
    const rows = state.chat.map(entry => entry.who === "child"
      ? `<div class="chat-row child"><p class="chat-bubble child">${esc(entry.text)}</p></div>`
      : `<div class="chat-row teacher"><span class="chat-face" aria-hidden="true"><img src="assets/jelly/${face(entry.tone)}.png" alt="" width="34" height="34"></span><p class="chat-bubble teacher${entry.tone ? " " + entry.tone : ""}">${esc(entry.text)}</p></div>`).join("");
    return `<aside class="question-panel chat-panel">
          <div class="chat-head"><span class="game-kicker">글에서 직접 찾아요 · ${step} / ${total}</span><h2 class="sr-only">${esc(finished ? "글에서 답을 모두 찾았어요" : (q ? q.prompt : ""))}</h2></div>
          <div class="chat-scroll" id="questionChat">${rows}</div>
          <div class="chat-foot">${finished
            ? `<button class="primary-btn" type="button" data-action="lesson-complete" data-track="lesson-complete">마치기</button>`
            : `<p class="chat-tip">왼쪽 글에서 답이 되는 문장을 눌러요.</p>`}</div>
          <span class="sr-only" id="questionFeedback">${esc(lastTeacher ? lastTeacher.text : "")}</span>
        </aside>`;
  }

  function renderParagraph() {
    const allText = lesson.sentences.map(item => item.text).join(" ");
    const q = lesson.questions[state.questionIndex];
    const finished = state.questionCorrect.size === lesson.questions.length;
    const asking = finished || state.paragraphReady;   // 질문 단계인가 (읽기·녹음 단계는 그대로 둔다)
    if (asking) chatSyncPrompt();
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
      <div class="paragraph-grid${asking ? " chat-mode" : ""}">
        <section class="text-board"><div class="text-board-head"><h2>전체 글</h2>${speechSwitch()}</div><div class="paragraph-text">${lesson.sentences.map((item, index) => state.paragraphReady
          ? `<button class="text-sentence${item.stanzaEnd ? " stanza-end" : ""} ${state.questionCorrect.has(state.questionIndex) && q && q.answer === index ? "correct" : ""}" type="button" data-text-index="${index}" data-track="answer">${esc(item.text)}</button>`
          : `<button class="text-sentence listen${item.stanzaEnd ? " stanza-end" : ""}" type="button" data-speak-sentence="${index}" data-track="audio" aria-label="${esc(item.text)} 들어보기"><span class="ts-play" aria-hidden="true"></span>${esc(item.text)}</button>`).join("")}</div>
          <div class="speech-row">${state.speechEnabled ? readingButton : `<button class="primary-btn" type="button" data-action="paragraph-done" data-track="activity-complete">전체 글을 읽었어요</button>`}<button class="quiet-btn${state.speakingAll ? " speaking" : ""}" type="button" data-action="speak-paragraph" data-track="hint" data-help-level="A3" data-help-type="model-reading">${state.speakingAll ? "■ 멈추기" : "전체 듣기"}</button></div>${state.paragraphRecording ? recIndicator("듣고 있어요 — 끝까지 천천히 읽어요") : ""}${assessmentNote}
        </section>
        ${asking ? questionChatPanel(finished, q) : paragraphWaitPanel()}
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
          ${item.hanja ? `<div class="vocab-hanja${state.hanjaOpen ? " open" : ""}">
            <button class="hanja-toggle" type="button" data-action="vocab-hanja" aria-expanded="${state.hanjaOpen}">
              <span class="hanja-chars">${esc(item.hanja.chars)}</span> 한자 뜻 ${state.hanjaOpen ? "접기" : "보기"}
            </button>
            ${state.hanjaOpen ? `<div class="hanja-body" role="region">
              <p class="hanja-gloss">${item.hanja.parts.map(part => `<span><b>${esc(part.char)}</b> ${esc(part.gloss)}</span>`).join("")}</p>
              <p class="hanja-sum">${esc(item.hanja.sum)}</p>
              ${item.hanja.example ? `<p class="hanja-example">${esc(item.hanja.example)}</p>` : ""}
            </div>` : ""}
          </div>` : ""}
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
      // 문장 완성은 activity-overrides 가 본문 문장으로 덮어쓴다. 그쪽이 통로를 내보내면
      // **개수도 그쪽 것**을 쓴다 — 셸의 game1(낱말 조각)과 문장 수가 다르기 때문이다.
      // 덮어쓰기가 내보내는 통로를 먼저 본다. `ONQ_GAME1_QA` 는 바깥 도구가 화면을
      // 대신 그릴 때 쓰는 다른 이름이라, 뒤에 둔다.
      const live = window.ONQ_GAME1_PROGRESS?.getState?.() || window.ONQ_GAME1_QA?.getState?.();
      const total = live && Number.isFinite(live.total) ? live.total : lesson.game1.length;
      const done = live ? (live.completed ? total : Math.min(live.index || 0, total)) : Math.min(state.game1Index, total);
      return { itemsDone: done, itemsTotal: total, correct: null, wrong: null };
    }
    if (id === "game2") {
      // 점핑워드가 진짜 진행이다. 🔴 아이 화면에 뜬 숫자와 같아야 한다 —
      //   챌린지(ten)  → 아이 화면 「잡은 젤리 n / 20」  → itemsDone n · itemsTotal 20
      //   1분 도전     → 아이 화면 「잡은 젤리 n」(총수 없음) → itemsTotal 은 비운다
      //   모드 고르는 중 → 아직 아무것도 안 했다 → 0
      const live = jump?.getState?.();
      if (!live || live.phase === "menu") return { itemsDone: 0, itemsTotal: null, correct: null, wrong: null, extra: "모드를 고르고 있어요" };
      const modeLabel = live.mode === "minute" ? "1분 도전" : "20개 잡기 챌린지";
      const phaseLabel = live.phase === "end" ? "마침" : live.phase === "count" ? "시작 신호" : "하는 중";
      const extra = `${modeLabel} · ${phaseLabel} · 놓친 젤리 ${live.missed || 0}개`;
      if (live.mode === "ten") return { itemsDone: live.caught, itemsTotal: 20, correct: null, wrong: null, extra };
      return { itemsDone: live.caught, itemsTotal: null, correct: null, wrong: null, extra };
    }
    if (id === "sentence") {
      if (state.sentencePhase === "words" && lesson.wordPoolMode === "pick") {
        const total = lesson.wordPool.length;
        const hits = [...state.wordSel].filter(i => lesson.wordPool[i]?.related).length;
        return { itemsDone: state.wordChecked ? total : state.wordSel.size, itemsTotal: total,
                 correct: state.wordChecked ? hits : null, wrong: state.wordChecked ? state.wordSel.size - hits : null };
      }
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
    if (id === "sentence") return state.sentencePhase === "words" ? "이 낱말이 나올까요? — 읽기 전 예측" : (lesson.sentences[state.sentenceIndex]?.text || "");
    if (id === "paragraph") return state.paragraphReady ? (lesson.questions[state.questionIndex]?.prompt || "질문 마침") : "전체 글 읽는 중";
    if (id === "vocab") return (lesson.vocab || [])[state.vocabIndex]?.word || "낱말 뜻 마침";
    if (id === "game1") return lesson.game1[Math.min(state.game1Index, lesson.game1.length - 1)]?.word || "";
    if (id === "game2") {
      const live = jump?.getState?.();
      if (!live || live.phase === "menu") return "점핑워드 — 모드 고르는 중";
      return state.game2Current != null ? (lesson.game2[state.game2Current]?.word || "점핑워드") : "점핑워드 — 젤리를 기다려요";
    }
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
  // 화면을 다시 그리지 않고 진행만 알린다(점핑워드처럼 무대를 흔들면 안 되는 자리).
  function pushProgress() {
    window.dispatchEvent(new CustomEvent("onq:progress", { detail: progressSnapshot() }));
  }
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
    const html = id === "cover" ? renderCover() : id === "game1" ? renderGame1() : id === "game2" ? renderGame2() : id === "sentence" ? renderSentence() : id === "paragraph" ? renderParagraph() : id === "vocab" ? renderVocab() : id === "storyorder" ? `<div class="activity-view"><div class="onq-storyorder" id="storyorderHost"></div></div>` : id === "bingo" ? `<div class="activity-view"><div class="onq-bingo" id="bingoHost"></div></div>` : id === "nonword" ? `<div class="activity-view"><div class="onq-nonword" id="nonwordHost"></div></div>` : renderWorksheet();
    root.innerHTML = shell(html);
    setupCanvas();
    if (id === "game2") mountJump();
    if (id === "bingo" && window.ONQ_BINGO) window.ONQ_BINGO.mount(document.getElementById("bingoHost"));
    if (id === "storyorder" && window.StepOrder && window.ONQ_STORY_ORDER) window.StepOrder.mount(document.getElementById("storyorderHost"), window.ONQ_STORY_ORDER);
    if (id === "nonword" && window.ONQ_NONWORD) window.ONQ_NONWORD.mount(document.getElementById("nonwordHost"));
    // 새 말풍선이 붙으면 대화창은 맨 아래로 — 마지막 말을 놓치면 다음 걸음을 못 뗀다.
    const chatBox = document.getElementById("questionChat");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
      window.requestAnimationFrame(() => { const box = document.getElementById("questionChat"); if (box) box.scrollTop = box.scrollHeight; });
    }
    window.dispatchEvent(new CustomEvent("onq:progress", { detail: progressSnapshot() }));
  }

  function setStep(next) {
    const target = Math.max(0, Math.min(steps.length - 1, next));
    if (target === state.step) return;
    emit("activity_complete", { completion: "navigation_exit" });
    // 🔴 점핑워드를 떠날 때는 반드시 멈춘다 — rAF·타이머가 남으면 다른 차례에서 계속 돈다.
    if (steps[state.step].id === "game2") stopJump();
    if (steps[state.step].id === "bingo") window.ONQ_BINGO?.stop?.();
    if (steps[state.step].id === "nonword") window.ONQ_NONWORD?.stop?.();
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
  function speakSequence(lines) { /* 제거됨 */ }

  function stopSpeak() {
    try { window.ONQ_AUDIO?.stop?.(); } catch (_) {}
    // speechSynthesis 제거됨 (2026-08-26)
    if (state.speakingAll) { state.speakingAll = false; render(); }
  }

  function speak(text, button, onDone) {
    // 2026-08-26: Aoede 음성맵만 사용. speechSynthesis 제거됨.
    const audioMap = window.ONQ_AOEDE_AUDIO_MAP || {};
    if (audioMap[text]) {
      const audio = new Audio(audioMap[text]);
      audio.onended = onDone;
      audio.play().catch(() => { if (onDone) onDone(); });
    } else {
      if (onDone) onDone();
    }
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

  // handleMineAnswer(안전/폭탄 고르기)는 옛 젤리캡쳐 판과 함께 걷어냈다(2026-09-30).
  // 점핑워드는 고르는 활동이 아니라 잡아서 읽는 활동이다.

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
    if (action === "vocab-hanja") { state.hanjaOpen = !state.hanjaOpen; render(); return; }
    if (action === "toggle-annotation") { state.annotationOpen = !state.annotationOpen; state.annotationTool = state.annotationOpen ? (state.annotationTool || "pen") : null; render(); return; }   // 켜면 펜이 바로 잡힌다(2026-10-05 — 도구를 안 골라 「그려지지 않는다」로 보였다)
    if (action === "close-annotation") { state.annotationOpen = false; state.annotationTool = null; render(); return; }
    if (action === "clear-annotation") { const canvas = document.querySelector(".annotation-canvas"); if (canvas) { canvas._strokes = []; drawAnnotations(canvas); } return; }
    if (button.dataset.annotationTool) { state.annotationTool = state.annotationTool === button.dataset.annotationTool ? null : button.dataset.annotationTool; render(); return; }
    if (action === "speak-game1") { speak(lesson.game1[state.game1Index].word, button); return; }
    if (button.dataset.chunkIndex != null) { handleGame1Chunk(button); return; }
    if (action === "remove-chunk") { state.game1Selected.pop(); render(); return; }
    if (action === "speak-game2") { speak("하늘 선에 닿기 전에 젤리를 눌러 잡고, 나타난 낱말을 소리 내어 읽어요.", button); return; }
    if (button.dataset.pickWord != null) {
      if (state.wordChecked) return;
      const i = Number(button.dataset.pickWord);
      state.wordSel.has(i) ? state.wordSel.delete(i) : state.wordSel.add(i);
      render();
      return;
    }
    if (action === "word-pick-check") {
      if (state.wordChecked || !state.wordSel.size) return;
      state.wordChecked = true;
      // 낱말마다 한 건 — 골랐나 · 나오는 낱말인가 · 맞았나. 함정을 고르면 무엇과 닮아서인지(like)를 함께 남긴다.
      wordOrder().forEach(i => {
        const item = lesson.wordPool[i], selected = state.wordSel.has(i);
        emit("answer", { item_id: `word-pick-${i}`, task: "word_prediction", target_word: item.word, response: selected ? "골랐어요" : "안 골랐어요",
                         selected, related: Boolean(item.related), correct: selected === Boolean(item.related), accuracy: "notApplicable",
                         ...(selected && !item.related ? { error_type: "lookalike", look_alike: item.like || "" } : {}),
                         attempt_no: state.wordAttempt });
      });
      const hits = [...state.wordSel].filter(i => lesson.wordPool[i].related).length;
      const relatedTotal = lesson.wordPool.filter(w => w.related).length;
      emit("activity_complete", { completion: "word_pool", task: "word_prediction", hits, misses: relatedTotal - hits,
                                  false_alarms: state.wordSel.size - hits, total: lesson.wordPool.length, attempt_no: state.wordAttempt });
      render();
      return;
    }
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
      state.hanjaOpen = false;      // 새 낱말은 접힌 채로 만난다
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
      state.wordSel = new Set(); state.wordChecked = false;
      emit("activity_start", { restarted: true, attempt_no: state.wordAttempt });
      render();
      return;
    }
    if (action === "vocab-restart") {
      state.vocabAttempt += 1;
      state.vocabIndex = 0; state.vocabPhase = "daily"; state.vocabPicked = null; state.hanjaOpen = false;
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
      if (state.questionLocked) return;              // 다음 질문으로 넘어가는 사이의 연타를 막는다
      const q = lesson.questions[state.questionIndex];
      if (!q) return;
      const selected = Number(button.dataset.textIndex); const correct = selected === q.answer;
      const qFails = state.questionFails[state.questionIndex] || 0;
      emit("answer", { item_id: `comprehension-${state.questionIndex}`, response: selected, correct,
                       // 문항이 풀린 순간에만 3값을 붙인다(규격 「문항마다 3값」).
                       // 틀린 시도는 아래 retry가 따로 남긴다.
                       ...(correct ? { accuracy: window.ONQ_ACCURACY(qFails, false) } : {}) });
      // 아이가 고른 문장을 **본문 그대로** 답 말풍선으로 붙인다 — 줄이면 무엇을 답했는지 못 되짚는다.
      chatPush("child", lesson.sentences[selected]?.text || "", "pick");
      if (correct) {
        state.questionCorrect.add(state.questionIndex);
        chatPush("teacher", q.explanation || "여기예요. 글에서 찾았어요.", "yes");
        state.questionLocked = true;
        render();
        window.setTimeout(() => { state.questionLocked = false; state.questionIndex += 1; render(); }, 700);
      } else {
        state.questionFails[state.questionIndex] = qFails + 1;
        emit("retry", { item_id: `comprehension-${state.questionIndex}` });
        // 틀린 것은 실패가 아니라 도와줄 신호다. 힌트를 건네고 다시 고를 수 있게 그대로 둔다.
        chatPush("teacher", q.hint || "질문에 나온 말과 같은 내용이 있는 문장을 다시 찾아봐요.", "again");
        render();
      }
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
