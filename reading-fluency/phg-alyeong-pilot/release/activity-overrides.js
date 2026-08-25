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
  const g1 = { index: 0, selected: [], fails: 0, startedAt: performance.now(), timerOn: false, seconds: 30, timer: null };
  const g2 = { cells: Array(25).fill(0), pending: null, ready: false, history: [], moves: 0, hints: 3, message: "칸을 누르고 문장을 읽어 보세요." };
  let scheduled = false;
  let lastStep = "";
  let returnFocus = null;

  // 판도 **content-pack에서 만든다.** 회차별 낱말을 이 파일에 박아 두면
  // 책이 바뀔 때 여기까지 따라 고쳐야 한다(실제로 놓쳐서 다른 책 낱말이 떴다).
  const rows = (() => {
    const lesson = window.ONQ_CONTENT_PACK?.sessions?.[sessionKey] || {};
    const pool = (lesson.game2 || []).map(item => item.word).filter(Boolean);
    if (!pool.length) return [];
    // 5×5 = 스물다섯 칸. 낱말이 모자라면 돌려 쓴다(원래 회차들도 그랬다).
    const cells = Array.from({ length: 25 }, (_, i) => pool[i % pool.length]);
    return [0, 1, 2, 3, 4].map(r => cells.slice(r * 5, r * 5 + 5));
  })();

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

  function renderGame1(view) {
    if (view.querySelector(".override-game1")) return;
    const item = lesson.game1[g1.index];
    const expected = item.chunks[g1.selected.length];
    const candidates = item._conveyor || (item._conveyor = shuffle([...new Set([...item.chunks, ...item.distractors])]).slice(0, 9));
    view.innerHTML = `<div class="override-game override-game1">
      ${compactBar(1, `${g1.index + 1} / ${lesson.game1.length}`)}
      <div class="override-hud"><div class="override-hud-copy"><strong>소리를 듣고 글자 조각을 잡아요</strong><span>알맞은 순서대로 조립해요.</span></div><div class="override-controls"><button class="mini-control ${g1.timerOn ? "active" : ""}" type="button" data-override-action="timer">제한시간 ${g1.timerOn ? "켬" : "끔"}</button>${g1.timerOn ? `<span class="compact-progress">${g1.seconds}초</span>` : ""}</div></div>
      <div class="conveyor-layout">
        <aside class="conveyor-guide"><button type="button" data-override-action="g1-sound" aria-label="젤리티처를 눌러 낱말 소리 듣기"><img src="assets/jelly/listening.png" alt="귀 기울이는 젤리티처"></button><p>젤리티처를 눌러 먼저 들어요.</p></aside>
        <section class="conveyor-stage" aria-label="움직이는 글자 조각 게임">
          <div class="assembly-dock">${item.chunks.map((_, index) => `<span class="assembly-slot ${g1.selected[index] ? "filled" : ""}">${g1.selected[index] || ""}</span>`).join("")}</div>
          <div class="belt-window ${reducedMotion.matches ? "reduced" : ""}">${candidates.map((value,index) => `<button type="button" class="moving-syllable ${g1.fails >= 2 && value === expected ? "hint" : ""}" style="--lane:${index % 3};--duration:${7.2 + (index % 3) * .8}s;--delay:${(-index * 1.1).toFixed(1)}s" data-override-piece="${value}" data-track="answer">${value}</button>`).join("")}</div>
          <div class="conveyor-status ${g1.fails >= 2 ? "hint" : ""}">${g1.fails >= 2 ? item.hint : "흐르는 조각을 보고 알맞은 글자를 잡아요."}</div>
        </section>
      </div>
    </div>`;
    if (g1.timerOn) startTimer();
  }

  function startTimer() {
    if (g1.timer) return;
    g1.timer = setInterval(() => {
      if (!g1.timerOn || activeId() !== "game1") { clearInterval(g1.timer); g1.timer = null; return; }
      g1.seconds -= 1;
      if (g1.seconds <= 0) { g1.seconds = 30; emit("retry", "intervention.word_chunk", { item_id: `g1-${g1.index}`, reason: "time_elapsed" }); }
      document.querySelector(".override-game1")?.remove();
      normalizePages();
    }, 1000);
  }

  function choosePiece(button, value) {
    const item = lesson.game1[g1.index];
    const expected = item.chunks[g1.selected.length];
    const correct = value === expected;
    emit("answer", "intervention.word_chunk", { item_id: `g1-${g1.index}`, response: value, correct, response_time_ms: Math.round(performance.now() - g1.startedAt) });
    if (!correct) {
      g1.fails += 1;
      button.classList.add("wrong");
      emit(g1.fails >= 2 ? "hint" : "retry", "intervention.word_chunk", { item_id: `g1-${g1.index}`, hint_level: g1.fails >= 2 ? "initial_sound" : "retry" });
      setTimeout(() => { document.querySelector(".override-game1")?.remove(); normalizePages(); }, 360);
      return;
    }
    button.classList.add("captured");
    g1.selected.push(value);
    if (g1.selected.length === item.chunks.length) {
      setTimeout(() => {
        g1.index = (g1.index + 1) % lesson.game1.length;
        g1.selected = []; g1.fails = 0; g1.seconds = 30; g1.startedAt = performance.now();
        if (g1.index === 0) emit("activity_complete", "intervention.word_chunk", { completion: "all_items" });
        document.querySelector(".override-game1")?.remove(); normalizePages();
      }, 620);
    } else setTimeout(() => { document.querySelector(".override-game1")?.remove(); normalizePages(); }, 260);
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
    if (action === "g1-sound") speak(lesson.game1[g1.index].word);
    else if (action === "timer") { g1.timerOn = !g1.timerOn; g1.seconds = 30; document.querySelector(".override-game1")?.remove(); normalizePages(); }
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
