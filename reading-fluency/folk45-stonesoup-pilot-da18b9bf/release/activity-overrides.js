(() => {
  "use strict";

  const pack = window.ONQ_CONTENT_PACK;
  const sessionKey = document.body.dataset.session;
  const lesson = pack.sessions[sessionKey];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const shownInstructions = new Set();
  const activityNames = { vocab: "어휘체크", game2: "점핑워드", game1: "문장 완성", sentence: "나누어 읽기", bingo: "낱말 빙고", nonword: "비단어 게임", paragraph: "전체 읽기", worksheet: "3단계 쓰기" };
  const esc = value => String(value).replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  // 문장 완성 = **어절 카드로 문장 순서 맞추기**. 재료는 본문 문장에서 만든다.
  // 카드는 움직이지 않는다 — 흐르는 컨베이어는 무엇을 눌러야 할지 겨누기 어려워 걷어냈다.
  // 🆕 빈칸 채우기 갈래(lesson.game1Mode === "fill") — 2026-10-04 L1 동시 · L2 줄글.
  //   한 문장에서 낱말 하나를 비우고 보기 셋(정답 + 함정 둘)에서 고른다. 자세한 것은 아래 renderFill.
  const FILL = lesson.game1Mode === "fill" && Array.isArray(lesson.game1Fill) && lesson.game1Fill.length > 0;
  const TRAP_LABEL = { soundSpelling: "소리 나는 대로", codaSwap: "받침 바꿈", vowelSwap: "모음 바꿈",
                       initialSwap: "첫소리 바꿈", syllableDrop: "글자 빠짐", doubleCoda: "받침 겹침", codaDrop: "받침 빠짐" };
  // 기록에 실을 해석정보 — 셸(shared.js)이 화면에 붙이는 값과 같은 것을 **이벤트에도** 싣는다.
  //   oncuvate:log 로 온 이벤트는 화면 요소가 없어 조상을 훑지 못한다(제작규격 v1.28 7장 v1.16절).
  const FILL_ID = "intervention.spelling_choice";
  const fillMeta = () => ({ measure_id: FILL_ID, working_memory_load: "secondary", phonological_awareness: "mid",
                            spelling_awareness: "high", trend_group_id: "trend.spelling", target_rule_id: pack.targetRule || "liaison" });   // 규칙 회차(L6 음운변동)는 팩의 targetRule
  const g1Items = FILL ? lesson.game1Fill.map((entry, index) => {
    const text = (lesson.sentences[entry.line] || {}).text || "";
    return { id: `fill-${index + 1}`, text, word: text, answer: entry.answer, line: entry.line,
             traps: (entry.traps || []).map(([word, type]) => ({ word, type })),
             hint: entry.hint || "들은 소리를 떠올려 글자를 골라요.", chunks: [entry.answer] };
  }) : (lesson.sentences || []).map((entry, index) => {
    const words = String(entry.text).replace(/\s+/g, " ").trim().split(" ");
    return { id: `sentence-${index + 1}`, text: entry.text, word: entry.text,
             chunks: words, hint: entry.guide || "낱말을 문장 순서대로 눌러요." };
  });

  // 이지모드 = 시범(정답 순서대로 카드가 하나씩 빛남) + 같은 문장 두 번(pass 1·2).
  // twoPass는 문장에 들어올 때 한 번만 걸어 둔다 — 도중에 꺼도 지금 문장은 마치고 다음부터 한 번씩.
  const g1 = { index: 0, selected: [], fails: 0, startedAt: performance.now(), timerOn: false, seconds: 30, timer: null,
               easy: false, pass: 1, twoPass: false, demo: false, demoStep: -1, demoTimer: null, note: null,
               done: false,
               // 끝낸 문장 수. index 는 마지막 문장 뒤에 0으로 되돌아가므로 진행을 셀 수 없다.
               cleared: 0 };
  // 코치 콘솔이 읽는 진행 통로. 셸의 `game1`(낱말 조각)이 아니라 **여기서 그리는 문장**을
  // 세야 코치 화면이 아이 화면과 같아진다(shared.js 의 activityCounts 가 이걸 먼저 본다).
  // 🔴 `ONQ_GAME1_QA` 라는 이름은 쓰지 마라 — 아래 normalizePages 에서 그 이름은
  //    **「바깥 도구가 문장 완성을 대신 그린다」**는 뜻이라, 그걸 세우면 이 파일이
  //    자기 화면 그리기를 멈추고 셸의 옛 낱말 조각 판이 대신 뜬다.
  window.ONQ_GAME1_PROGRESS = {
    getState: () => ({ index: g1.cleared, total: g1Items.length, completed: g1.cleared >= g1Items.length })
  };

  let scheduled = false;
  let lastStep = "";
  let returnFocus = null;

  // 🔴 2단계는 2026-09-30에 **점핑워드**로 갈아 끼웠다(shared.js + release/jumping-words-v1.js).
  //    그래서 옛 젤리캡쳐 5×5 색 타일 판(BOARDS·REGIONS·SOLUTION·지뢰 표시)은
  //    이 파일에서 통째로 걷어냈다 — 남겨 두면 어느 길로든 옛 판이 다시 뜬다.
  //    아래에 남은 것은 **문장 완성(game1)** 쪽뿐이다.

  function activeStep() {
    return Number(document.querySelector(".step-btn.active")?.dataset.step || 0);
  }

  // 차례 이름. 번호로 잡으면 차례를 하나 넣는 순간 다른 화면을 덮어쓴다.
  function activeId() {
    return document.querySelector(".step-btn.active")?.dataset.stepId
        || document.querySelector("main")?.dataset.stepId
        || "cover";
  }

  function emit(type, activityId, payload = {}) {
    const event = {
      event_type: type,
      lesson_id: lesson.lessonId,
      lesson_version: pack.version,
      session_id: sessionKey,
      activity_id: activityId,
      timestamp: new Date().toISOString(),
      ...payload
    };
    if (typeof window.ONQ_EVENT_SINK === "function") window.ONQ_EVENT_SINK(event);
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: event }));
  }

  // 2026-10-04: 자연 음성(Aoede 클립)만 쓴다 — 클립이 없으면 기계음 대신 소리를 내지 않는다(사용자 지정).
  function speak(text) {
    window.ONQ_AUDIO?.play?.(text);
  }

  function shuffle(values) {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }

  function compactBar(step, progress = "") {
    return `<div class="compact-activity-bar">${progress ? `<span class="compact-progress">${progress}</span>` : ""}<button class="compact-info" type="button" data-action="open-modal">활동 안내</button></div>`;
  }

  function normalizePages() {
    scheduled = false;
    const step = activeStep();
    const id = activeId();
    document.querySelector(".page-head")?.remove();
    const view = document.querySelector(".activity-view");
    if (!view || id === "cover") return;

    // 🔴 점핑워드(game2)는 이 파일이 손대지 않는다. shared.js 가 무대를 직접 세우고,
    //    엔진이 프레임마다 HUD를 고쳐 쓰므로 여기서 덮어쓰면 무대가 흔들린다.
    //    활동 바만 한 번 얹고 지나간다(아래 마지막 else 와 같은 몫).
    if (id === "game1") {
      if (!window.ONQ_GAME1_QA) renderGame1(view);
    } else if (!view.querySelector(".compact-activity-bar")) view.insertAdjacentHTML("afterbegin", compactBar(step));

    if (id !== lastStep) {
      lastStep = id;
      if (!shownInstructions.has(id)) {
        shownInstructions.add(id);
        requestAnimationFrame(() => view.querySelector('[data-action="open-modal"]')?.click());
      }
    }

    const modal = document.querySelector(".modal");
    if (modal && !modal.dataset.focusReady) {
      modal.dataset.focusReady = "true";
      returnFocus = document.activeElement;
      requestAnimationFrame(() => modal.querySelector("button")?.focus());
    }
  }

  // ── 이지모드 시범 — 정답 순서대로 카드가 하나씩 빛난다 ────────────────
  // 글자로 정답을 적어 주지 않는다. **순서만** 보여 준다.
  // 보여 주는 동안 누르면 순서가 꼬이므로 그때는 눌러도 반응하지 않게 막는다.
  function paintDemo() {
    const root = document.querySelector(".override-game1");
    if (!root) return;
    root.classList.toggle("is-demo", g1.demo);
    root.querySelectorAll(".word-card").forEach(card => {
      card.classList.toggle("demo-glow", g1.demo && Number(card.dataset.pieceKey) === g1.demoStep);
    });
  }

  function stopDemo() {
    if (g1.demoTimer) { clearInterval(g1.demoTimer); g1.demoTimer = null; }
    g1.demo = false; g1.demoStep = -1;
  }

  function finishDemo() {
    if (g1.demoTimer) { clearInterval(g1.demoTimer); g1.demoTimer = null; }
    if (!g1.demo) return;
    g1.demo = false; g1.demoStep = -1;
    g1.note = "이제 순서대로 눌러요.";
    const root = document.querySelector(".override-game1");
    if (!root) return;
    root.classList.remove("is-demo");
    root.querySelectorAll(".demo-glow").forEach(card => card.classList.remove("demo-glow"));
    const status = root.querySelector(".conveyor-status");
    if (status && !status.classList.contains("hint")) status.textContent = g1.note;
  }

  function runDemo() {
    const item = g1Items[g1.index];
    if (!item) { finishDemo(); return; }
    // 움직임을 줄여 달라고 해 둔 화면에서는 짧게 지나간다.
    const beat = reducedMotion.matches ? 300 : 700;
    let step = 0;
    if (g1.demoTimer) { clearInterval(g1.demoTimer); g1.demoTimer = null; }
    const tick = () => {
      if (!g1.demo || activeId() !== "game1") { finishDemo(); return; }
      if (step >= item.chunks.length) { finishDemo(); return; }
      g1.demoStep = step; step += 1;
      paintDemo();
    };
    tick();
    g1.demoTimer = setInterval(tick, beat);
  }

  function redrawGame1() {
    document.querySelector(".override-game1")?.remove();
    normalizePages();
  }

  // 문장 한 판을 새로 연다. 카드는 판마다 다시 섞는다(두 번째 판도 마찬가지).
  function beginItem(options) {
    const opts = options || {};
    stopDemo();
    g1.selected = []; g1.fails = 0; g1.seconds = 30; g1.startedAt = performance.now();
    g1.done = false;               // 새 문항은 언제나 「놓는 중」으로 시작한다
    g1.note = opts.note || null;
    const item = g1Items[g1.index];
    if (item) { item._cards = null; item._choices = null; }
    g1.attempts = 0;
    if (opts.demo && item && item.chunks.length > 1) {
      g1.demo = true; g1.demoStep = -1;
      g1.note = "낱말이 빛나는 순서를 잘 보아요.";
    }
    redrawGame1();
    if (g1.demo) runDemo();
  }

  // 아이 화면이다 — 몇 번째인지만 알리고 점수·별점·잘함못함은 넣지 않는다.
  function passLabel() {
    return g1.twoPass ? ` · ${g1.pass === 2 ? "두 번째" : "첫 번째"}` : "";
  }

  // ── 빈칸 채우기 ──────────────────────────────────────────────
  // 함정은 문항을 열 때마다 **유형이 서로 다른 둘**을 뽑는다(같은 유형 둘이면 한 가지 오류만 재게 된다).
  // 보기 순서는 문항마다 한 번만 섞는다 — 누를 때마다 흔들리면 자리로 찍게 된다.
  function fillChoices(item) {
    if (item._choices) return item._choices;
    const byType = {};
    shuffle(item.traps).forEach(trap => { (byType[trap.type] = byType[trap.type] || []).push(trap); });
    const picked = shuffle(Object.keys(byType)).slice(0, 2).map(type => byType[type][0]);
    item._choices = shuffle([{ word: item.answer, type: null }, ...picked]);
    return item._choices;
  }

  function renderFill(view) {
    const item = g1Items[g1.index];
    if (!item) return;
    const choices = fillChoices(item);
    const wrong = new Set(g1.selected.map(entry => entry.value));
    const cut = item.text.indexOf(item.answer);
    const before = item.text.slice(0, cut);
    const after = item.text.slice(cut + item.answer.length);
    const slot = g1.done ? `<span class="fill-slot filled">${esc(item.answer)}</span>` : `<span class="fill-slot" aria-label="빈칸"></span>`;
    // 아이 화면이다 — 점수·정답 수는 내지 않는다. 오답은 「다시」로만 받는다.
    const statusText = g1.done ? "완성한 문장을 소리 내어 읽어 보세요."
      : g1.fails >= 2 ? esc(item.hint)
      : g1.fails === 1 ? "다시 들어 보고 골라요."
      : "젤리티처를 눌러 듣고, 빈칸에 들어갈 낱말을 골라요.";
    view.innerHTML = `<div class="override-game override-game1 override-fill${g1.done ? " is-done" : ""}">
      ${compactBar(1, `${g1.index + 1} / ${g1Items.length}`)}
      <div class="override-hud"><div class="override-hud-copy"><strong>빈칸에 알맞은 낱말을 골라요</strong></div></div>
      <div class="word-order-layout">
        <aside class="conveyor-guide"><button type="button" data-override-action="g1-sound" aria-label="젤리티처를 눌러 문장 듣기"><img src="assets/jelly/listening.png" alt="귀 기울이는 젤리티처"></button><p>젤리티처를 눌러 들어요.</p></aside>
        <section class="word-order-stage fill-stage" aria-label="빈칸 채우기">
          <p class="fill-line">${esc(before)}${slot}${esc(after)}</p>
          ${g1.done ? `<div class="word-order-done-actions">
              <button class="quiet-btn" type="button" data-override-action="g1-sound" data-track="audio">다시 듣기</button>
              <button class="primary-btn" type="button" data-override-action="g1-next">다음</button>
            </div>` : `<div class="fill-choices">${choices.map(choice => `<button type="button" class="word-card fill-choice ${wrong.has(choice.word) ? "used wrong" : ""}" data-override-fill="${esc(choice.word)}" data-track="answer" data-item-id="g1-fill-${g1.index + 1}" data-response="${esc(choice.word)}" data-correct="${choice.type ? "false" : "true"}" ${wrong.has(choice.word) ? "disabled" : ""}>${esc(choice.word)}</button>`).join("")}</div>`}
          <div class="conveyor-status ${g1.fails >= 2 && !g1.done ? "hint" : ""}" role="status">${statusText}</div>
        </section>
      </div>
    </div>`;
  }

  // 🔴 오답은 **고른 글자와 함정 유형**을 함께 남긴다(사용자 지정 2026-10-04).
  //    oncuvate:event → coach-mode-v2 가 oncuvate:log 로 펴서 넘긴다(error_type → errorType).
  function chooseFill(button, value) {
    const item = g1Items[g1.index];
    if (!item || g1.done) return;
    const choices = fillChoices(item);
    const choice = choices.find(entry => entry.word === value) || { word: value, type: null };
    const correct = value === item.answer;
    emit("answer", FILL_ID, {
      ...fillMeta(),
      item_id: `g1-fill-${g1.index + 1}`,
      task: "fill_blank",
      attempt_no: (g1.attempts || 0) + 1,
      // 정확성 3값 — 처음에 맞음 accurate · 틀렸다가 맞음 self-corrected · 도움(두 번 틀린 뒤 규칙 안내) 뒤 맞음 support.
      // 오답 시도에는 싣지 않는다(시도마다가 아니라 문항이 끝날 때 한 번 정해지는 값이다).
      ...(correct ? { accuracy: window.ONQ_ACCURACY ? window.ONQ_ACCURACY(g1.fails, g1.fails >= 2) : (g1.fails >= 2 ? "support" : g1.fails ? "self-corrected" : "accurate") } : {}),
      response: value,
      correct,
      expected: item.answer,
      error_type: correct ? null : choice.type,
      error_label: correct ? null : (TRAP_LABEL[choice.type] || null),
      choices: choices.map(entry => `${entry.word}${entry.type ? ":" + entry.type : ""}`).join("|"),
      attempt: (g1.attempts || 0) + 1,
      sentence: item.text,
      response_time_ms: Math.round(performance.now() - g1.startedAt)
    });
    g1.attempts = (g1.attempts || 0) + 1;
    if (!correct) {
      g1.fails += 1;
      g1.selected.push({ value, key: -1 });
      // 두 번 틀리면 규칙 안내가 뜨고, 틀린 보기 둘이 막혀 하나만 남는다 — 답을 찾을 범위를 좁힌 도움(A2).
      if (g1.fails === 2) emit("hint", FILL_ID, { ...fillMeta(), item_id: `g1-fill-${g1.index + 1}`, help_level: "A2", help_by: "content", help_type: "rule-hint" });
      button.classList.add("wrong");
      setTimeout(redrawGame1, 360);
      return;
    }
    g1.done = true;
    redrawGame1();
    speak(item.text);
  }

  function renderGame1(view) {
    if (view.querySelector(".override-game1")) return;
    if (FILL) { renderFill(view); return; }
    const item = g1Items[g1.index];
    if (!item) return;
    const expected = item.chunks[g1.selected.length];
    // 보기 순서는 문항마다 한 번만 섞는다 — 누를 때마다 흔들리면 자리로 찍게 된다.
    const cards = item._cards || (item._cards = shuffle(item.chunks.map((value, i) => ({ value, key: i }))));
    const usedKeys = new Set(g1.selected.map(entry => entry.key));
    const statusText = g1.fails >= 2 ? esc(item.hint) : esc(g1.note || "들은 문장을 떠올려 첫 낱말부터 눌러요.");
    // 어절이 많은 문장은 자리·카드·글자를 좁힌다. 예전에는 CSS가 자리 개수를
    // `:has(.assembly-slot:nth-child(N))`으로 셌는데, 다 맞춘 뒤 자리를 지우면
    // 셀 것이 없어져 완성 문장 글자가 도로 커진다 — 그래서 여기서 세어 알린다.
    const size = item.chunks.length >= 12 ? " is-long is-xlong" : item.chunks.length >= 9 ? " is-long" : "";
    // 🔴 다 맞추고 난 뒤에는 **완성한 문장 하나만** 남긴다.
    // 자리에 꽂힌 어절 카드가 그대로 남으면 같은 문장이 두 벌이 되어, 아이가
    // 어디를 봐야 할지 흩어진다(한 화면에 한 가지). 자리·카드·젤리티처 안내는
    // 감추는 것이 아니라 아예 그리지 않는다 — 남겨 두면 스크린리더가 읽는다.
    // 「낱말 카드를 차례대로 눌러요」처럼 이미 끝난 동작을 시키는 안내도 함께 뺀다.
    // 완성 화면에 남는 안내는 「만든 문장을 소리 내어 읽어 보세요.」 하나뿐이다.
    // ⚠️ 놓는 중(g1.done === false)에는 아무것도 바뀌지 않는다.
    view.innerHTML = `<div class="override-game override-game1${g1.demo ? " is-demo" : ""}${g1.done ? " is-done" : ""}">
      ${compactBar(1, `${g1.index + 1} / ${g1Items.length}${passLabel()}`)}
      <div class="override-hud"><div class="override-hud-copy"><strong>들은 문장을 순서대로 놓아요</strong>${g1.done ? "" : `<span>낱말 카드를 차례대로 눌러요.</span>`}</div><div class="override-controls"><button class="mini-control ${g1.easy ? "active" : ""}" type="button" data-override-action="g1-easy">이지모드 ${g1.easy ? "켬" : "끔"}</button><button class="mini-control ${g1.timerOn ? "active" : ""}" type="button" data-override-action="timer">제한시간 ${g1.timerOn ? "켬" : "끔"}</button>${g1.timerOn ? `<span class="compact-progress">${g1.seconds}초</span>` : ""}</div></div>
      <div class="word-order-layout${g1.done ? " is-done" : ""}">
        ${g1.done ? "" : `<aside class="conveyor-guide"><button type="button" data-override-action="g1-sound" aria-label="젤리티처를 눌러 문장 듣기"><img src="assets/jelly/listening.png" alt="귀 기울이는 젤리티처"></button><p>젤리티처를 눌러 먼저 들어요.</p></aside>`}
        <section class="word-order-stage${g1.done ? " is-done" : ""}${size}" aria-label="${g1.done ? "내가 완성한 문장" : "낱말 카드로 문장 순서 맞추기"}">
          ${g1.done ? "" : `<div class="assembly-dock">${item.chunks.map((_, index) => `<span class="assembly-slot ${g1.selected[index] ? "filled" : ""}">${g1.selected[index] ? esc(g1.selected[index].value) : ""}</span>`).join("")}</div>`}
          ${g1.done ? `<div class="word-order-done">
            <p class="word-order-sentence">${esc(item.text)}</p>
            <div class="word-order-done-actions">
              <button class="quiet-btn" type="button" data-override-action="g1-sound" data-track="audio">다시 듣기</button>
              <button class="primary-btn" type="button" data-override-action="g1-next">다음</button>
            </div>
          </div>` : `<div class="word-card-grid">${cards.map(card => `<button type="button" class="word-card ${usedKeys.has(card.key) ? "used" : ""} ${g1.fails >= 2 && card.value === expected && !usedKeys.has(card.key) ? "hint" : ""} ${g1.demo && card.key === g1.demoStep ? "demo-glow" : ""}" data-override-piece="${esc(card.value)}" data-piece-key="${card.key}" data-track="answer" ${usedKeys.has(card.key) ? "disabled" : ""}>${esc(card.value)}</button>`).join("")}</div>`}
          <div class="conveyor-status ${g1.fails >= 2 ? "hint" : ""}">${g1.done ? "만든 문장을 소리 내어 읽어 보세요." : statusText}</div>
        </section>
      </div>
    </div>`;
    if (g1.timerOn) startTimer();
  }

  function startTimer() {
    if (g1.timer) return;
    g1.timer = setInterval(() => {
      if (!g1.timerOn || activeId() !== "game1") { clearInterval(g1.timer); g1.timer = null; return; }
      if (g1.demo) return;                     // 시범을 보여 주는 동안은 시간을 세지 않는다
      g1.seconds -= 1;
      if (g1.seconds <= 0) { g1.seconds = 30; emit("retry", "intervention.word_chunk", { item_id: `g1-${g1.index}`, reason: "time_elapsed" }); }
      document.querySelector(".override-game1")?.remove();
      normalizePages();
    }, 1000);
  }

  function choosePiece(button, value) {
    if (g1.demo) return;                       // 시범을 보여 주는 동안은 눌러도 반응하지 않는다
    const item = g1Items[g1.index];
    if (!item) return;
    const expected = item.chunks[g1.selected.length];
    const correct = value === expected;
    emit("answer", "intervention.phrase_sequence", { item_id: `g1-${g1.index}`, response: value, correct, response_time_ms: Math.round(performance.now() - g1.startedAt), pass: g1.pass, easy: g1.easy });
    if (!correct) {
      g1.fails += 1;
      button.classList.add("wrong");
      emit(g1.fails >= 2 ? "hint" : "retry", "intervention.phrase_sequence", { item_id: `g1-${g1.index}`, hint_level: g1.fails >= 2 ? "position_shown" : "retry", pass: g1.pass, easy: g1.easy });
      setTimeout(() => { redrawGame1(); }, 360);
      return;
    }
    button.classList.add("captured");
    g1.selected.push({ value, key: Number(button.dataset.pieceKey) });
    if (g1.selected.length === item.chunks.length) {
      // 마지막 낱말을 놓자마자 넘어가면 **아이가 자기가 만든 문장을 볼 틈이 없다.**
      // 완성한 문장을 세워 두고, 읽어 본 뒤 스스로 「다음」을 눌러 넘어간다.
      g1.done = true;
      setTimeout(redrawGame1, 320);
      return;
    }
    redrawGame1();
  }

  // 옛 젤리캡쳐 판(5×5 색 타일 · 지뢰 표시 · 되돌리기/힌트/다시 놓기)은 2026-09-30에
  // 통째로 걷어냈다. 2단계는 이제 점핑워드다(shared.js 가 직접 세운다).

  document.addEventListener("click", event => {
    const fill = event.target.closest("[data-override-fill]");
    if (fill) { event.preventDefault(); event.stopImmediatePropagation(); chooseFill(fill, fill.dataset.overrideFill); return; }
    const piece = event.target.closest("[data-override-piece]");
    if (piece) { event.preventDefault(); event.stopImmediatePropagation(); choosePiece(piece, piece.dataset.overridePiece); return; }
    const control = event.target.closest("[data-override-action]");
    if (!control) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const action = control.dataset.overrideAction;
    if (action === "g1-next") {
      // 이지모드로 들어온 문장은 같은 문장을 한 번 더 — 두 번째는 시범 없이, 카드만 다시 섞어서.
      if (!FILL && g1.twoPass && g1.pass === 1) {
        g1.pass = 2;
        beginItem({ note: "같은 문장을 한 번 더 놓아요." });
        return;
      }
      if (g1.cleared < g1Items.length) g1.cleared += 1;   // 되돌아와도 줄지 않는다
      g1.index = (g1.index + 1) % g1Items.length;
      g1.pass = 1;
      g1.twoPass = g1.easy;                  // 새 문장에 들어올 때 한 번만 걸어 둔다
      if (g1.index === 0) emit("activity_complete", FILL ? FILL_ID : "intervention.phrase_sequence", { completion: "all_items", easy: g1.easy, ...(FILL ? fillMeta() : {}) });
      beginItem({ demo: g1.twoPass });
      return;
    }
    if (action === "g1-sound") speak(g1Items[g1.index] ? g1Items[g1.index].text : "");
    else if (action === "timer") { g1.timerOn = !g1.timerOn; g1.seconds = 30; redrawGame1(); }
    else if (action === "g1-easy") {
      g1.easy = !g1.easy;
      // 켜면 지금 문장을 시범부터 다시. 끄면 지금 문장은 그대로 마치고 다음부터 한 번씩(twoPass 래치 유지).
      if (g1.easy) { g1.twoPass = true; g1.pass = 1; beginItem({ demo: true }); }
      else redrawGame1();
    }
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const close = document.querySelector('.modal [data-action="close-modal"]');
    if (close) { close.click(); requestAnimationFrame(() => returnFocus?.focus?.()); }
  });

  const observer = new MutationObserver(() => { if (!scheduled) { scheduled = true; requestAnimationFrame(normalizePages); } });
  observer.observe(document.getElementById("app"), { childList: true, subtree: true });
  normalizePages();
})();
