(() => {
  "use strict";

  const pack = window.ONQ_CONTENT_PACK;
  const sessionKey = document.body.dataset.session;
  const lesson = pack.sessions[sessionKey];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const shownInstructions = new Set();
  const activityNames = { vocab: "어휘체크", game2: "젤리캡쳐", game1: "문장 완성", sentence: "나누어 읽기", paragraph: "전체 읽기", worksheet: "3단계 쓰기" };
  const REGIONS = [0,0,1,1,1, 0,0,1,1,1, 0,0,2,1,4, 3,0,0,4,4, 0,0,0,4,4];
  const SOLUTION = [1,4,2,0,3];
  const REGION_COLORS = ["#eef3fb","#f3effb","#edf8f6","#f8f2ee","#eef7fa"];
  const REGION_LINES = ["#8298b2","#9b8fba","#7eaa9f","#ad9685","#77a3ae"];
  const esc = value => String(value).replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  // 문장 완성 = **어절 카드로 문장 순서 맞추기**. 재료는 본문 문장에서 만든다.
  // 카드는 움직이지 않는다 — 흐르는 컨베이어는 무엇을 눌러야 할지 겨누기 어려워 걷어냈다.
  const g1Items = (lesson.sentences || []).map((entry, index) => {
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

  const g2 = { cells: Array(25).fill(0), pending: null, ready: false, history: [], moves: 0, hints: 3, message: "칸을 누르고 문장을 읽어 보세요." };
  let scheduled = false;
  let lastStep = "";
  let returnFocus = null;

  const rows = [
    ["동물은","태어나서","자라고","새끼를","낳아요"],
    ["흐르면","늙어가다","마침내","죽게","되지요"],
    ["어미와","비슷한","모습의","새끼로","태어나요"],
    ["새끼는","먹이를","먹으며","몸집이","커져요"],
    ["애벌레는","번데기를","거쳐","나비가","돼요"]
  ];

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

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = .78;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(v => /^ko/i.test(v.lang) && /natural|neural|sunhi|injoon/i.test(v.name)) || voices.find(v => /^ko/i.test(v.lang)) || null;
    speechSynthesis.speak(utterance);
  }

  function shuffle(values) {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }

  function compactBar(step, progress = "") {
    return `<div class="compact-activity-bar">${progress ? `<span class="compact-progress">${progress}</span>` : ""}<button class="compact-info" type="button" data-action="open-modal">활동 안내</button></div>`;
  }

  // 젤리몬 엔진이 아직(또는 끝내) 안 붙었을 때 그 자리에 세워 두는 안내.
  // http로 열었으면 곧 엔진이 이 자리를 덮어쓴다.
  function renderEngineWait(view) {
    const local = location.protocol === "file:";
    if (view.querySelector(".g2-engine-wait")) {
      // 로컬로 연 것이 확실해지면 문구를 바꿔 준다
      if (local) view.querySelector(".g2-engine-wait")?.classList.add("is-local");
      return;
    }
    view.insertAdjacentHTML("afterbegin", `<div class="g2-engine-wait${local ? " is-local" : ""}">
      <div class="g2-wait-card">
        <strong class="g2-wait-loading">젤리몬 게임을 불러오는 중이에요…</strong>
        <div class="g2-wait-local">
          <strong>이 게임은 서버로 열어야 해요.</strong>
          <p>파일을 직접 열면 브라우저가 게임 파일 읽기를 막습니다. 미리보기 주소로 열어 주세요.</p>
          <small>파일을 두 번 눌러 열지 말고, 수업 주소로 들어와 주세요.</small>
        </div>
      </div>
    </div>`);
  }

  function normalizePages() {
    scheduled = false;
    const step = activeStep();
    const id = activeId();
    document.querySelector(".page-head")?.remove();
    const view = document.querySelector(".activity-view");
    if (!view || id === "cover") return;

    if (id === "game2") {
      // 🔴 구버전 보드로 조용히 되돌아가지 않는다.
      // 신버전 엔진은 로더 사슬을 fetch로 조립하는데, file:// 로 열면 브라우저가 fetch를
      // 막아 사슬이 끊긴다. 그때 옛 지뢰찾기 보드를 대신 그리면 **다른 게임이 뜬 줄 모른 채**
      // 「구버전이 들어갔다」로 읽히게 된다. 무엇이 잘못됐는지 화면에 적는다.
      if (!window.ONQ_GAME2_PROGRESSION_TEST) renderEngineWait(view);
    } else if (id === "game1") {
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
    if (item) item._cards = null;
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

  function renderGame1(view) {
    if (view.querySelector(".override-game1")) return;
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

  function border(index, dr, dc) {
    const r = Math.floor(index / 5), c = index % 5, rr = r + dr, cc = c + dc;
    return rr < 0 || rr >= 5 || cc < 0 || cc >= 5 || REGIONS[rr * 5 + cc] !== REGIONS[index];
  }

  function hasConflict(index) {
    const r = Math.floor(index / 5), c = index % 5, region = REGIONS[index];
    return g2.cells.some((value, other) => {
      if (value !== 2 || other === index) return false;
      const rr = Math.floor(other / 5), cc = other % 5;
      return rr === r || cc === c || REGIONS[other] === region || (Math.abs(rr-r) === 1 && Math.abs(cc-c) === 1);
    });
  }

  function solved() {
    const mines = g2.cells.map((v,i) => v === 2 ? i : -1).filter(i => i >= 0);
    if (mines.length !== 5) return false;
    return new Set(mines.map(i => Math.floor(i/5))).size === 5 && new Set(mines.map(i => i%5)).size === 5 && new Set(mines.map(i => REGIONS[i])).size === 5 && mines.every(i => !hasConflict(i));
  }

  function sentenceMarkup(row, col) {
    return rows[row].map((part,index) => index === col ? `<mark>${part}</mark>` : part).join(" ") + ".";
  }

  function renderGame2(view) {
    if (view.querySelector(".override-game2")) return;
    const mines = g2.cells.filter(v => v === 2).length;
    view.innerHTML = `<div class="override-game override-game2">
      ${compactBar(2, `${mines} / 5`)}
      <div class="override-hud"><div class="override-hud-copy"><strong>문장을 읽고 숨은 지뢰를 찾아요</strong><span>행·열·색 구역의 규칙을 살펴요.</span></div><div class="override-controls"><span class="compact-progress">이동 ${g2.moves}</span></div></div>
      <div class="mine-layout">
        <section class="mine-panel"><div class="mine-progress"><span>지뢰 ${mines} / 5</span><span>각 줄과 색 구역에 하나씩</span></div><div class="word-mine-board" role="grid">${g2.cells.map((value,index) => {
          const region = REGIONS[index], row = Math.floor(index/5), col = index%5;
          const classes = ["mine-cell", value === 1 ? "safe" : "", value === 2 ? "mine" : "", g2.pending === index ? "pending" : "", g2.moves === 0 && index === SOLUTION[0] ? "guide" : "", border(index,-1,0) ? "region-top" : "", border(index,0,1) ? "region-right" : "", border(index,1,0) ? "region-bottom" : "", border(index,0,-1) ? "region-left" : ""].filter(Boolean).join(" ");
          return `<button type="button" class="${classes}" style="--region-bg:${REGION_COLORS[region]};--region-line:${REGION_LINES[region]}" data-override-cell="${index}" data-track="answer" aria-label="${row+1}행 ${col+1}열 ${rows[row][col]}">${rows[row][col]}</button>`;
        }).join("")}</div></section>
        <aside class="mine-side"><div class="mine-rules-mini"><div class="mine-rule"><b>가로·세로</b>마다 지뢰 하나</div><div class="mine-rule"><b>같은 색 구역</b>에도 하나</div><div class="mine-rule"><b>지뢰끼리</b> 대각선으로 붙지 않기</div></div>
          <div class="scan-card">${g2.pending == null ? `<h3>낱말 칸을 골라요</h3><p>고른 칸이 들어간 문장이 열려요.</p>` : `<h3>${sentenceMarkup(Math.floor(g2.pending/5),g2.pending%5)}</h3><p>${g2.ready ? "이제 안전인지 지뢰인지 골라요." : "문장 전체를 소리 내어 읽어요."}</p>`}</div>
          <div class="mine-decisions"><button type="button" data-override-action="mine-safe" ${g2.pending == null || !g2.ready ? "disabled" : ""}>안전</button><button type="button" data-override-action="mine-place" ${g2.pending == null || !g2.ready ? "disabled" : ""}>지뢰</button></div>
          <div class="mine-message" role="status">${g2.message}</div>
          <div class="mine-tools"><button class="mini-control" type="button" data-override-action="mine-undo">되돌리기</button><button class="mini-control" type="button" data-override-action="mine-hint">힌트 ${g2.hints}</button><button class="mini-control" type="button" data-override-action="mine-reset">다시 놓기</button></div>
        </aside>
      </div>
    </div>`;
  }

  function selectMineCell(index) {
    if (g2.pending != null) return;
    g2.pending = index; g2.ready = false; g2.message = "문장을 끝까지 읽은 뒤 선택해요.";
    const row = Math.floor(index/5);
    speak(rows[row].join(" "));
    emit("answer", "intervention.word_phrase", { item_id: `g2-${index}`, response: "cell_selected", correct: null, result_state: "not_yet_judged" });
    document.querySelector(".override-game2")?.remove(); normalizePages();
    setTimeout(() => { if (g2.pending === index) { g2.ready = true; g2.message = "읽었어요. 안전 또는 지뢰를 골라요."; document.querySelector(".override-game2")?.remove(); normalizePages(); } }, 1600);
  }

  function chooseMine(choice) {
    if (g2.pending == null || !g2.ready) return;
    const index = g2.pending, previous = g2.cells[index];
    g2.history.push({ cells: [...g2.cells], moves: g2.moves });
    let next = choice === "mine" ? 2 : 1;
    if (next === 2 && hasConflict(index)) { next = 1; g2.message = "이 칸은 규칙상 안전해요. 줄·색·대각선을 다시 살펴봐요."; emit("retry", "intervention.word_phrase", { item_id: `g2-${index}`, reason: "rule_conflict" }); }
    else g2.message = next === 2 ? "지뢰를 표시했어요. 다른 줄과 색 구역을 살펴봐요." : "안전 표시를 했어요.";
    g2.cells[index] = next; if (previous !== next) g2.moves += 1;
    emit("answer", "intervention.word_phrase", { item_id: `g2-${index}`, response: choice, correct: next === (choice === "mine" ? 2 : 1) });
    g2.pending = null; g2.ready = false;
    if (solved()) { g2.message = "모든 지뢰를 찾았어요."; emit("activity_complete", "intervention.word_phrase", { completion: "logic_board", moves: g2.moves }); }
    document.querySelector(".override-game2")?.remove(); normalizePages();
  }

  function mineUndo() {
    const previous = g2.history.pop(); if (!previous) return;
    g2.cells = previous.cells; g2.moves = previous.moves; g2.pending = null; g2.ready = false; g2.message = "한 단계 전으로 돌아왔어요.";
    document.querySelector(".override-game2")?.remove(); normalizePages();
  }

  function mineHint() {
    if (g2.hints <= 0) return;
    const target = SOLUTION.map((col,row) => row*5+col).find(index => g2.cells[index] !== 2); if (target == null) return;
    g2.history.push({ cells: [...g2.cells], moves: g2.moves }); g2.cells[target] = 2; g2.hints -= 1; g2.moves += 1; g2.message = "지뢰 하나를 찾았어요. 주변 규칙을 이어서 살펴봐요.";
    emit("hint", "intervention.word_phrase", { item_id: `g2-${target}`, hint_level: "board_solution" });
    document.querySelector(".override-game2")?.remove(); normalizePages();
  }

  function mineReset() {
    g2.cells = Array(25).fill(0); g2.pending = null; g2.ready = false; g2.history = []; g2.moves = 0; g2.message = "처음 상태로 돌아왔어요.";
    document.querySelector(".override-game2")?.remove(); normalizePages();
  }

  document.addEventListener("click", event => {
    const piece = event.target.closest("[data-override-piece]");
    if (piece) { event.preventDefault(); event.stopImmediatePropagation(); choosePiece(piece, piece.dataset.overridePiece); return; }
    const cell = event.target.closest("[data-override-cell]");
    if (cell) { event.preventDefault(); event.stopImmediatePropagation(); selectMineCell(Number(cell.dataset.overrideCell)); return; }
    const control = event.target.closest("[data-override-action]");
    if (!control) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const action = control.dataset.overrideAction;
    if (action === "g1-next") {
      // 이지모드로 들어온 문장은 같은 문장을 한 번 더 — 두 번째는 시범 없이, 카드만 다시 섞어서.
      if (g1.twoPass && g1.pass === 1) {
        g1.pass = 2;
        beginItem({ note: "같은 문장을 한 번 더 놓아요." });
        return;
      }
      if (g1.cleared < g1Items.length) g1.cleared += 1;   // 되돌아와도 줄지 않는다
      g1.index = (g1.index + 1) % g1Items.length;
      g1.pass = 1;
      g1.twoPass = g1.easy;                  // 새 문장에 들어올 때 한 번만 걸어 둔다
      if (g1.index === 0) emit("activity_complete", "intervention.phrase_sequence", { completion: "all_items", easy: g1.easy });
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
    else if (action === "mine-safe") chooseMine("safe");
    else if (action === "mine-place") chooseMine("mine");
    else if (action === "mine-undo") mineUndo();
    else if (action === "mine-hint") mineHint();
    else if (action === "mine-reset") mineReset();
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
