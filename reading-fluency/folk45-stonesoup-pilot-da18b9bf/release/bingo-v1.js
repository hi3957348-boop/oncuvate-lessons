/* 낱말 빙고 — 6번 차례(2026-10-04 사용자 지정: 「목표어들로 구성된 빙고게임 · 4×4 · 비주얼 예쁘게」).
 *
 *  · 판: 이 수업의 목표어 16개(확장 읽기 목표 + 그 확장어). content-pack 의 session.bingo 가 있으면 그것을 쓴다.
 *  · 진행: 젤리가 낱말을 **소리로만** 불러 준다(Aoede 클립) → 아이가 판에서 그 글자를 찾아 누른다 → 노란 도장.
 *          들리는 소리 [다리]와 쓰는 글자 「달이」를 잇는 연습이다(연음 목표와 같은 축).
 *  · 가로·세로·대각선 한 줄이 차면 「빙고!」. 세 줄이면 성공 — 그 뒤로도 판을 다 채울 수 있다.
 *  · 두 번 틀리면 정답 칸이 살짝 반짝인다(도움 A2 로 기록). 점수는 띄우지 않는다.
 *  · 기록: oncuvate:event → coach-mode 가 oncuvate:log 로 넘긴다. 젤리코치도 이 이벤트를 듣고 칭찬·격려한다.
 */
(() => {
  "use strict";
  const pack = window.ONQ_CONTENT_PACK || {};
  const sessionKey = document.body.dataset.session || "session01";
  const lesson = (pack.sessions || {})[sessionKey] || {};
  const ID = "game.word_bingo";
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { const o = [...a]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 판 낱말 16개 — 팩에 없으면 확장 읽기 목표 + 확장어에서 고른다(소리가 있는 것만).
  function wordList() {
    const audioOk = w => !window.ONQ_AUDIO || window.ONQ_AUDIO.resolve(w);
    if (Array.isArray(lesson.bingo) && lesson.bingo.length >= 16) return lesson.bingo.slice(0, 16);
    const rows = window[`ONQ_${sessionKey.toUpperCase()}_TARGET_EXPANSIONS`] || [];
    const out = [];
    rows.forEach(r => { if (!out.includes(r.target) && audioOk(r.target)) out.push(r.target); });
    for (let k = 0; out.length < 16 && k < 5; k++) rows.forEach(r => { const w = r.expansions[k]; if (w && out.length < 16 && !out.includes(w) && audioOk(w)) out.push(w); });
    return out.slice(0, 16);
  }
  const LINES = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],[0,5,10,15],[3,6,9,12]];
  const GOAL = 3;
  const TINT = ["#fdeeeb", "#e8f5fd", "#fff6cf", "#eef9f5"];

  const S = { board: [], calls: [], callIndex: -1, stamped: new Set(), lines: new Set(), fails: 0, started: false, celebrate: null, attempt: 1, startedAt: 0, host: null };
  function reset() {
    S.board = shuffle(wordList()); S.calls = shuffle(S.board); S.callIndex = -1; S.stamped = new Set(); S.lines = new Set();
    S.fails = 0; S.started = false; S.celebrate = null; S.startedAt = performance.now();
  }
  reset();

  function emit(type, payload = {}) {
    const ev = { event_type: type, lesson_id: lesson.lessonId, lesson_version: pack.version, session_id: sessionKey, activity_id: ID, measure_id: ID,
                 working_memory_load: "secondary", target_rule_id: pack.targetRule || "liaison", trend_group_id: "trend.spelling",
                 elapsed_ms: Math.round(performance.now() - S.startedAt), timestamp: new Date().toISOString(), ...payload };
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: ev }));
  }
  const current = () => S.calls[S.callIndex];
  const say = text => { if (window.ONQ_AUDIO && window.ONQ_AUDIO.play) window.ONQ_AUDIO.play(text); };

  function nextCall() {
    S.fails = 0;
    do { S.callIndex += 1; } while (S.callIndex < S.calls.length && S.stamped.has(S.board.indexOf(S.calls[S.callIndex])));
    draw();
    if (current()) setTimeout(() => say(current()), 350);
  }
  function start() { S.started = true; emit("activity_start", { attempt_no: S.attempt }); nextCall(); }

  function tap(i) {
    if (!S.started || S.celebrate || S.stamped.has(i) || !current()) return;
    const want = current(), got = S.board[i], correct = got === want;
    emit("answer", { item_id: `bingo-${want}`, response: got, correct, expected: want, attempt_no: S.fails + 1,
                     ...(correct ? { accuracy: S.fails >= 2 ? "support" : S.fails ? "self-corrected" : "accurate" } : { error_type: "otherWord" }) });
    if (!correct) {
      S.fails += 1;
      if (S.fails === 2) emit("hint", { item_id: `bingo-${want}`, help_level: "A2", help_by: "content", help_type: "target-glow" });
      const el = S.host && S.host.querySelector(`[data-bingo="${i}"]`);
      if (el) { el.classList.remove("bg-nope"); void el.offsetWidth; el.classList.add("bg-nope"); }
      setTimeout(draw, 380);
      return;
    }
    S.stamped.add(i);
    const before = S.lines.size;
    LINES.forEach((ln, k) => { if (ln.every(x => S.stamped.has(x))) S.lines.add(k); });
    const newLines = S.lines.size - before;
    if (newLines > 0) {
      S.celebrate = S.lines.size >= GOAL && before < GOAL ? "goal" : "bingo";
      emit(S.celebrate === "goal" ? "activity_complete" : "bingo", { lines: S.lines.size, stamped: S.stamped.size, completion: S.celebrate === "goal" ? "bingo_goal" : undefined });
      draw();
      setTimeout(() => { S.celebrate = null; if (S.stamped.size < 16) nextCall(); else finish(); }, S.lines.size >= GOAL && before < GOAL ? 2200 : 1300);
      return;
    }
    if (S.stamped.size >= 16) { finish(); return; }
    draw();
    setTimeout(nextCall, 650);
  }
  function finish() { S.callIndex = S.calls.length; emit("activity_complete", { completion: "board_full", lines: S.lines.size, stamped: 16 }); draw(); }

  function draw() {
    const host = S.host; if (!host || !host.isConnected) return;
    const done = S.stamped.size >= 16;
    const lineCells = new Set([...S.lines].flatMap(k => LINES[k]));
    const glow = S.fails >= 2 && current() ? S.board.indexOf(current()) : -1;
    const stars = Array.from({ length: GOAL }, (_, k) => `<span class="bg-star ${k < S.lines.size ? "on" : ""}">★</span>`).join("");
    const bubble = !S.started ? "준비되면 시작을 눌러요!"
      : done ? "판을 다 채웠어요!"
      : S.fails === 1 ? "다시 잘 들어 봐요!" : S.fails >= 2 ? "반짝이는 칸을 찾아봐요!" : "이 낱말을 찾아요!";
    host.innerHTML = `
      <div class="bg-wrap">
        <aside class="bg-side">
          <div class="bg-coach">
            <div class="bg-bubble">${esc(bubble)}</div>
            <img src="assets/jelly/${S.fails ? "thinking" : S.started ? "listening" : "guide"}.png" alt="젤리코치">
          </div>
          ${S.started && !done
            ? `<button type="button" class="bg-listen" data-bingo-act="listen" data-track="hint" data-help-level="A3" data-help-type="model-reading">🔊 다시 듣기</button>`
            : done ? `<button type="button" class="bg-listen" data-bingo-act="again">새 판 하기</button>`
            : `<button type="button" class="bg-listen go" data-bingo-act="start">▶ 시작</button>`}
          <div class="bg-score"><span class="bg-label">빙고</span>${stars}</div>
          <div class="bg-count">찾은 낱말 <b>${S.stamped.size}</b> / 16</div>
        </aside>
        <section class="bg-board" aria-label="낱말 빙고 판">
          ${S.board.map((w, i) => `<button type="button" class="bg-tile ${S.stamped.has(i) ? "stamped" : ""} ${lineCells.has(i) ? "lined" : ""} ${i === glow ? "glow" : ""}"
              data-bingo="${i}" data-track="answer" style="--t:${TINT[(Math.floor(i / 4) + i) % 4]}" ${S.started ? "" : "disabled"}>
              <span class="bg-word">${esc(w)}</span>${S.stamped.has(i) ? `<span class="bg-stamp" aria-hidden="true">★</span>` : ""}</button>`).join("")}
          ${S.celebrate ? `<div class="bg-burst ${S.celebrate}"><b>${S.celebrate === "goal" ? "빙고 세 줄!" : "빙고!"}</b>${S.celebrate === "goal" ? "<small>대단해요! 판을 계속 채워 볼까요?</small>" : ""}${reduced ? "" : Array.from({ length: 14 }, (_, k) => `<i style="--a:${k * 26}deg;--d:${90 + (k % 3) * 30}px;--c:${["#ffcf3d", "#6fc2f0", "#f6a89d"][k % 3]}"></i>`).join("")}</div>` : ""}
        </section>
      </div>`;
  }

  document.addEventListener("click", ev => {
    const t = ev.target.closest("[data-bingo], [data-bingo-act]");
    if (!t || !S.host || !S.host.contains(t)) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (t.dataset.bingoAct === "start") return start();
    if (t.dataset.bingoAct === "listen") { emit("hint", { item_id: `bingo-${current()}`, help_level: "A3", help_type: "model-reading" }); return say(current()); }
    if (t.dataset.bingoAct === "again") { S.attempt += 1; reset(); return draw(); }
    if (t.dataset.bingo != null) tap(Number(t.dataset.bingo));
  }, true);

  window.ONQ_BINGO = {
    mount(host) { S.host = host; draw(); },
    stop() { S.host = null; },
    progress: () => ({ index: S.stamped.size, total: 16, lines: S.lines.size, completed: S.stamped.size >= 16 })
  };
})();
