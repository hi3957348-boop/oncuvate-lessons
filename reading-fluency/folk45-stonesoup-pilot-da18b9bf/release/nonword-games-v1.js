/* 비단어 게임 — 「비단어 빙고」 · 「비단어 탐정」 (2026-10-05 사용자 지정: 회차 목표에 맞는 비단어 게임, 메뉴 하나에서 둘 중 골라서).
 *
 *  · 낱말: content-pack 의 session.nonwords = [{ word: "눅지", sound: "눅찌", third: "누찌" }, …]
 *    — 처음 보는 낱말이라 **규칙을 그대로 써야만** 읽힌다(뜻으로 짐작 못 함). 목록은 _tools/nonword_gen.py 후보에서 사람이 고른 것.
 *  · 비단어 빙고(소리 → 글자): 젤리가 소리 [눅찌]를 불러 주면 판(4×4)에서 글자 「눅지」를 찾는다. 세 줄이면 성공.
 *  · 비단어 탐정(글자 → 소리): 「눅지」를 보고 [눅찌] · [눅지] · [누찌] 가운데 어떻게 읽는지 고른다. 열 사건.
 *  · 두 번 틀리면 정답이 살짝 반짝인다(도움 A2). 점수는 띄우지 않는다.
 *  · 기록: oncuvate:event(answer · hint · activity_complete) — 오답 유형은 기존 값 "otherWord" 만 쓴다(새 값 만들지 않음).
 *    고른 글자는 response 로 남아 「글자대로 읽었는지」는 코치가 본다.
 */
(() => {
  "use strict";
  const pack = window.ONQ_CONTENT_PACK || {};
  const sessionKey = document.body.dataset.session || "session01";
  const lesson = (pack.sessions || {})[sessionKey] || {};
  const POOL = Array.isArray(lesson.nonwords) ? lesson.nonwords : [];
  const RULE = pack.targetRule || "liaison";
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { const o = [...a]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const say = text => { if (window.ONQ_AUDIO && window.ONQ_AUDIO.play) window.ONQ_AUDIO.play(text); };
  const LINES = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],[0,5,10,15],[3,6,9,12]];
  const GOAL = 3, CASES = 10;
  const TINT = ["#fdeeeb", "#e8f5fd", "#fff6cf", "#eef9f5"];

  let host = null, mode = "pick", startedAt = 0;
  function emit(id, type, payload = {}) {
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: {
      event_type: type, lesson_id: lesson.lessonId, lesson_version: pack.version, session_id: sessionKey, activity_id: id, measure_id: id,
      working_memory_load: "secondary", target_rule_id: RULE, trend_group_id: id === "game.nonword_bingo" ? "trend.spelling" : "trend.fluency",
      elapsed_ms: Math.round(performance.now() - startedAt), timestamp: new Date().toISOString(), ...payload } }));
  }
  const accuracy = fails => fails >= 2 ? "support" : fails ? "self-corrected" : "accurate";

  // ── 비단어 빙고 ──────────────────────────────────────────
  const B = {};
  function bingoReset() {
    Object.assign(B, { board: shuffle(POOL).slice(0, 16), calls: null, i: -1, stamped: new Set(), lines: new Set(), fails: 0, started: false, celebrate: null });
    B.calls = shuffle(B.board.map((_, k) => k));
  }
  const bCurrent = () => B.calls[B.i];
  function bNext() {
    B.fails = 0;
    do { B.i += 1; } while (B.i < B.calls.length && B.stamped.has(B.calls[B.i]));
    draw();
    if (bCurrent() != null) setTimeout(() => say(B.board[bCurrent()].sound), 350);
  }
  function bTap(k) {
    if (!B.started || B.celebrate || B.stamped.has(k) || bCurrent() == null) return;
    const want = B.board[bCurrent()], got = B.board[k], correct = k === bCurrent();
    emit("game.nonword_bingo", "answer", { item_id: `nwb-${want.word}`, response: got.word, expected: want.word, correct, attempt_no: B.fails + 1,
      ...(correct ? { accuracy: accuracy(B.fails) } : { error_type: "otherWord" }) });
    if (!correct) {
      B.fails += 1;
      if (B.fails === 2) emit("game.nonword_bingo", "hint", { item_id: `nwb-${want.word}`, help_level: "A2", help_by: "content", help_type: "target-glow" });
      const el = host && host.querySelector(`[data-nw-tile="${k}"]`);
      if (el) { el.classList.remove("bg-nope"); void el.offsetWidth; el.classList.add("bg-nope"); }
      setTimeout(draw, 380); return;
    }
    B.stamped.add(k);
    const before = B.lines.size;
    LINES.forEach((ln, n) => { if (ln.every(x => B.stamped.has(x))) B.lines.add(n); });
    if (B.lines.size > before) {
      const goal = B.lines.size >= GOAL && before < GOAL;
      B.celebrate = goal ? "goal" : "bingo";
      emit("game.nonword_bingo", goal ? "activity_complete" : "bingo", { lines: B.lines.size, stamped: B.stamped.size, ...(goal ? { completion: "bingo_goal" } : {}) });
      draw();
      setTimeout(() => { B.celebrate = null; B.stamped.size < 16 ? bNext() : draw(); }, goal ? 2200 : 1300);
      return;
    }
    if (B.stamped.size >= 16) { emit("game.nonword_bingo", "activity_complete", { completion: "board_full" }); draw(); return; }
    draw(); setTimeout(bNext, 650);
  }
  function bingoHtml() {
    const done = B.stamped.size >= 16;
    const lineCells = new Set([...B.lines].flatMap(n => LINES[n]));
    const glow = B.fails >= 2 ? bCurrent() : -1;
    const bubble = !B.started ? "젤리가 부르는 소리를 듣고 글자를 찾아요!" : done ? "판을 다 채웠어요!"
      : B.fails === 1 ? "다시 잘 들어 봐요!" : B.fails >= 2 ? "반짝이는 칸을 찾아봐요!" : "이 소리는 어떤 글자일까?";
    return `<div class="bg-wrap">
      <aside class="bg-side">
        <div class="bg-coach"><div class="bg-bubble">${esc(bubble)}</div>
          <img src="assets/jelly/${B.fails ? "thinking" : B.started ? "listening" : "guide"}.png" alt="젤리코치"></div>
        ${B.started && !done ? `<button type="button" class="bg-listen" data-nw="listen" data-track="hint" data-help-level="A3" data-help-type="model-reading">🔊 다시 듣기</button>`
          : done ? `<button type="button" class="bg-listen" data-nw="again">새 판 하기</button>` : `<button type="button" class="bg-listen go" data-nw="start">▶ 시작</button>`}
        <div class="bg-score"><span class="bg-label">빙고</span>${Array.from({ length: GOAL }, (_, n) => `<span class="bg-star ${n < B.lines.size ? "on" : ""}">★</span>`).join("")}</div>
        <button type="button" class="nw-back" data-nw="pick">↩ 게임 고르기</button>
      </aside>
      <section class="bg-board" aria-label="비단어 빙고 판">
        ${B.board.map((w, k) => `<button type="button" class="bg-tile ${B.stamped.has(k) ? "stamped" : ""} ${lineCells.has(k) ? "lined" : ""} ${k === glow ? "glow" : ""}"
            data-nw-tile="${k}" data-track="answer" style="--t:${TINT[(Math.floor(k / 4) + k) % 4]}" ${B.started ? "" : "disabled"}>
            <span class="bg-word">${esc(w.word)}</span>${B.stamped.has(k) ? `<span class="bg-stamp" aria-hidden="true">★</span>` : ""}</button>`).join("")}
        ${B.celebrate ? `<div class="bg-burst ${B.celebrate}"><b>${B.celebrate === "goal" ? "빙고 세 줄!" : "빙고!"}</b>${reduced ? "" : Array.from({ length: 14 }, (_, n) => `<i style="--a:${n * 26}deg;--d:${90 + (n % 3) * 30}px;--c:${["#ffcf3d", "#6fc2f0", "#f6a89d"][n % 3]}"></i>`).join("")}</div>` : ""}
      </section></div>`;
  }

  // ── 비단어 탐정 ──────────────────────────────────────────
  const D = {};
  function detReset() {
    Object.assign(D, { cases: shuffle(POOL).slice(0, CASES).map(w => ({ ...w, options: shuffle([w.sound, w.word, w.third]) })), i: 0, fails: 0, wrong: [], solved: false, done: false });
  }
  function dPick(opt) {
    const c = D.cases[D.i]; if (!c || D.solved) return;
    const correct = opt === c.sound;
    emit("game.nonword_detective", "answer", { item_id: `nwd-${c.word}`, response: opt, expected: c.sound, correct, attempt_no: D.fails + 1,
      ...(correct ? { accuracy: accuracy(D.fails) } : { error_type: "otherWord", read_as_written: opt === c.word }) });
    if (!correct) {
      D.fails += 1; D.wrong.push(opt);
      if (D.fails === 2) emit("game.nonword_detective", "hint", { item_id: `nwd-${c.word}`, help_level: "A2", help_by: "content", help_type: "target-glow" });
      draw(); return;
    }
    D.solved = true; say(c.sound); draw();
    setTimeout(() => {
      D.i += 1; D.fails = 0; D.wrong = []; D.solved = false;
      if (D.i >= D.cases.length) { D.done = true; emit("game.nonword_detective", "activity_complete", { completion: "all_cases", cases: D.cases.length }); }
      draw();
    }, 1500);
  }
  function detHtml() {
    if (D.done) return `<div class="nw-det nw-end">
        <img src="assets/jelly/praise.png" alt="칭찬하는 젤리코치">
        <h2>사건 ${D.cases.length}개를 모두 풀었어요!</h2>
        <div class="nw-row"><button type="button" class="bg-listen go" data-nw="det-again">🔍 다시 하기</button><button type="button" class="nw-back" data-nw="pick">↩ 게임 고르기</button></div></div>`;
    const c = D.cases[D.i];
    const tip = D.solved ? `[${esc(c.sound)}]로 읽어요!` : D.fails >= 2 ? "반짝이는 답을 골라 봐요." : D.fails === 1 ? "받침 다음 소리를 잘 봐요!" : "이 낱말은 어떻게 읽을까?";
    return `<div class="nw-det">
      <div class="nw-det-head"><span class="nw-case">🔍 사건 ${D.i + 1} / ${D.cases.length}</span>
        <div class="nw-trail">${D.cases.map((_, n) => `<i class="${n < D.i ? "done" : n === D.i ? "now" : ""}"></i>`).join("")}</div>
        <button type="button" class="nw-back" data-nw="pick">↩ 게임 고르기</button></div>
      <div class="nw-det-body">
        <div class="nw-clue ${D.solved ? "solved" : ""}"><span class="nw-glass" aria-hidden="true">🔎</span><b>${esc(c.word)}</b><small>처음 보는 낱말</small></div>
        <div class="nw-side">
          <div class="nw-tip"><img src="assets/jelly/${D.solved ? "praise" : D.fails ? "thinking" : "guide"}.png" alt="젤리코치"><span>${tip}</span></div>
          <div class="nw-opts">${c.options.map(o => `<button type="button" class="nw-opt ${D.wrong.includes(o) ? "wrong" : ""} ${D.solved && o === c.sound ? "right" : ""} ${!D.solved && D.fails >= 2 && o === c.sound ? "glow" : ""}"
              data-nw-opt="${esc(o)}" data-track="answer" ${D.wrong.includes(o) || D.solved ? "disabled" : ""}>[${esc(o)}]</button>`).join("")}</div>
        </div></div></div>`;
  }

  // ── 고르기 화면 ─────────────────────────────────────────
  function pickHtml() {
    return `<div class="nw-pick">
      <div class="nw-pick-title"><img src="assets/jelly/guide.png" alt=""><div><h2>비단어 게임</h2><p>처음 보는 낱말로 소리 규칙을 써 봐요!</p></div></div>
      <div class="nw-cards">
        <button type="button" class="nw-card bingo" data-nw="go-bingo"><i>🔔</i><b>비단어 빙고</b><small>소리를 듣고 글자 찾기</small></button>
        <button type="button" class="nw-card det" data-nw="go-det"><i>🔍</i><b>비단어 탐정</b><small>글자를 보고 소리 맞히기</small></button>
      </div></div>`;
  }

  function draw() {
    if (!host || !host.isConnected) return;
    host.innerHTML = mode === "bingo" ? bingoHtml() : mode === "det" ? detHtml() : pickHtml();
  }

  document.addEventListener("click", ev => {
    const t = ev.target.closest("[data-nw], [data-nw-tile], [data-nw-opt]");
    if (!t || !host || !host.contains(t)) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    const a = t.dataset.nw;
    if (a === "pick") { mode = "pick"; return draw(); }
    if (a === "go-bingo") { mode = "bingo"; bingoReset(); startedAt = performance.now(); return draw(); }
    if (a === "go-det") { mode = "det"; detReset(); startedAt = performance.now(); emit("game.nonword_detective", "activity_start", {}); return draw(); }
    if (a === "start") { B.started = true; emit("game.nonword_bingo", "activity_start", {}); return bNext(); }
    if (a === "listen") { const c = bCurrent(); if (c != null) { emit("game.nonword_bingo", "hint", { item_id: `nwb-${B.board[c].word}`, help_level: "A3", help_type: "model-reading" }); say(B.board[c].sound); } return; }
    if (a === "again") { bingoReset(); return draw(); }
    if (a === "det-again") { detReset(); return draw(); }
    if (t.dataset.nwTile != null) return bTap(Number(t.dataset.nwTile));
    if (t.dataset.nwOpt != null) return dPick(t.dataset.nwOpt);
  }, true);

  window.ONQ_NONWORD = {
    available: POOL.length >= 16,
    mount(el) { host = el; mode = "pick"; draw(); },
    stop() { host = null; },
    progress: () => ({ mode, bingoLines: B.lines ? B.lines.size : 0, case: D.i || 0 })
  };
})();
