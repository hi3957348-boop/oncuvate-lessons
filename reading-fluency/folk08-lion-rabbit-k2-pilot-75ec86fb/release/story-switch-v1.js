/* 이야기 떠올리기 — 같은 목표(이야기 이해)를 두 방법 가운데 골라 한다(2026-10-09 사용자 「같은 목표라도 활동 방식을 고를 수 있게」).
 *
 *  · 방법 가 「차례 놓기」 = 인지훈련게임 「차례대로 놓기」 엔진(release/step-order.js, 데이터 window.ONQ_STORY_ORDER)
 *  · 방법 나 「누가 말했을까」 = 이 파일. 대사를 듣고 누가 한 말인지 고른 뒤, 그 사람 목소리로 읽어 본다(띄어 읽기·표현).
 *  · 처음 보이는 방법은 단계로 갈린다 — 홀수 단계(1·3·5) = 가, 짝수 단계(2·4·6) = 나. 이웃한 두 단계를 읽으면 저절로 다른 방법을 한다.
 *    위쪽 「방법 고르기」로 아이나 코치가 언제든 바꾼다.
 *  · 데이터: window.ONQ_STORY_SWITCH = { first:"order"|"who", who:{ speakers:[{id,name,icon}], items:[{ line, who, why, hint }] } }
 *  · 기록: oncuvate:event(activity_start · answer · item_complete · activity_complete), activity_id "game.who_said".
 *    정확성은 셸과 같은 자(window.ONQ_ACCURACY). 두 번 틀리면 바른 카드가 살짝 빛난다(도움 A2). 아이 화면에 점수 없음.
 *  · ⚠️ 단추에 data-step·data-action 을 쓰지 않는다(수업 셸이 가로챈다) — data-ss-* 만.
 *  · 크롬 109 하한(클래스인) — 새 문법을 쓰지 않는다.
 */
(() => {
  "use strict";
  const DATA = window.ONQ_STORY_SWITCH;
  if (!DATA || !DATA.who || !Array.isArray(DATA.who.items) || !DATA.who.items.length) return;
  const pack = window.ONQ_CONTENT_PACK || {};
  const sessionKey = document.body.dataset.session || "session01";
  const lesson = (pack.sessions || {})[sessionKey] || {};
  const ID = "game.who_said";
  const W = DATA.who, ITEMS = W.items, SPK = W.speakers;
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FACE = { guide: "assets/jelly/guide.png", think: "assets/jelly/thinking.png", praise: "assets/jelly/praise.png" };
  const say = text => { try { window.ONQ_AUDIO && window.ONQ_AUDIO.play && window.ONQ_AUDIO.play(text); } catch (_) { /* 무시 */ } };
  const hush = () => { try { window.ONQ_AUDIO && window.ONQ_AUDIO.stop && window.ONQ_AUDIO.stop(); } catch (_) { /* 무시 */ } };
  const accuracyOf = (fails, helped) => (typeof window.ONQ_ACCURACY === "function" ? window.ONQ_ACCURACY(fails, helped)
    : helped ? "support" : fails > 0 ? "self-corrected" : "accurate");
  const spk = id => SPK.find(s => s.id === id) || { name: id, icon: "" };
  // 받침이 있으면 「이」, 없으면 「가」 — 「나그네가」 · 「마을 사람들이」
  const iga = w => { const c = String(w).charCodeAt(String(w).length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 ? "이" : "가"; };
  const METHODS = [{ id: "order", label: "🔢 차례 놓기" }, { id: "who", label: "💬 누가 말했을까" }];

  const S = { host: null, method: DATA.first === "who" ? "who" : "order", started: false, qi: 0, phase: "pick", fails: 0, helped: false,
              itemAt: 0, startedAt: performance.now(), done: false, results: [], timers: new Set() };
  function later(fn, ms) { const id = setTimeout(() => { S.timers.delete(id); if (S.host && S.host.isConnected) fn(); }, ms); S.timers.add(id); }
  function clearTimers() { S.timers.forEach(id => clearTimeout(id)); S.timers.clear(); }
  function emit(type, payload) {
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: Object.assign({
      event_type: type, lesson_id: lesson.lessonId, lesson_version: pack.version, session_id: sessionKey, activity_id: ID, measure_id: ID,
      working_memory_load: "secondary",
      elapsed_ms: Math.round(performance.now() - S.startedAt), timestamp: new Date().toISOString() }, payload || {}) }));
  }
  function pushProgress() { try { if (typeof window.ONQ_PROGRESS === "function") window.dispatchEvent(new CustomEvent("onq:progress", { detail: window.ONQ_PROGRESS() })); } catch (_) { /* 무시 */ } }

  // ── 방법 고르기 줄 + 아래 판 ──
  function shell() {
    S.host.innerHTML = `<div class="ss-wrap"><div class="ss-bar" role="group" aria-label="방법 고르기"><span class="ss-bar-label">방법 고르기</span>
      ${METHODS.map(m => `<button type="button" class="ss-pill" data-ss-method="${m.id}" aria-pressed="${S.method === m.id}">${m.label}</button>`).join("")}</div>
      <div class="ss-board${S.method === "who" ? " ss-who" : ""}" id="ssBoard"></div></div>`;
    const board = S.host.querySelector("#ssBoard");
    if (S.method === "order") {
      if (window.StepOrder && window.ONQ_STORY_ORDER) window.StepOrder.mount(board, window.ONQ_STORY_ORDER);
      else board.innerHTML = '<p class="ss-empty">이 방법은 준비 중이에요.</p>';
    } else drawWho(board);
  }

  // ── 누가 말했을까 ──
  function drawWho(board) {
    board = board || (S.host && S.host.querySelector("#ssBoard")); if (!board) return;
    if (!S.started) {
      board.innerHTML = `<div class="ws-intro"><img src="${FACE.guide}" alt="젤리 선생님"><div><h3>누가 말했을까?</h3>
        <p>말풍선 속 말을 듣고, 누가 한 말인지 골라요.<br>맞히면 그 사람 목소리로 읽어 봐요.</p>
        <button type="button" class="ws-go" data-ss-start="1">시작하기 ▶</button></div></div>`;
      return;
    }
    if (S.done) {
      board.innerHTML = `<div class="ws-intro"><img src="${FACE.praise}" alt="칭찬하는 젤리 선생님"><div><h3>모두 찾았어요!</h3>
        <p>말 ${ITEMS.length}개를 누가 했는지 다 찾고, 그 목소리로 읽었어요.</p>
        <button type="button" class="ws-go ws-quiet" data-ss-again="1">처음부터 다시</button></div></div>`;
      return;
    }
    const it = ITEMS[S.qi], right = S.phase === "voice", glow = S.helped && !right;
    board.innerHTML = `<div class="ws-card">
      <div class="ws-top"><span class="ws-no">${S.qi + 1} / ${ITEMS.length}</span><button type="button" class="ws-say" data-ss-say="1" aria-label="듣기">🔊 듣기</button></div>
      <div class="ws-bubble${right ? " ws-ok" : ""}">${esc(it.line)}</div>
      ${right ? `<div class="ws-voice"><img src="${FACE.praise}" alt=""><div><b>${esc(spk(it.who).icon)} ${esc(spk(it.who).name)}</b>${iga(spk(it.who).name)} 한 말이에요. ${esc(it.why || "")}<br>이제 <b>${esc(spk(it.who).name)}</b> 목소리로 읽어 봐요.</div>
        <button type="button" class="ws-go" data-ss-voiced="1">읽었어요 ▶</button></div>`
      : `<div class="ws-who">${SPK.map(s => `<button type="button" class="ws-person${glow && s.id === it.who ? " ws-glow" : ""}" data-ss-who="${esc(s.id)}"><span class="ws-icon">${esc(s.icon)}</span>${esc(s.name)}</button>`).join("")}</div>
        <p class="ws-hint" role="status">${S.fails ? `<img src="${FACE.think}" alt="">${esc(it.hint || "누가 그 말을 했는지 이야기를 떠올려 봐요.")}` : ""}</p>`}
    </div>`;
  }
  function startWho() { S.started = true; S.qi = 0; S.done = false; S.results = []; S.startedAt = performance.now(); emit("activity_start", { items_total: ITEMS.length }); beginItem(); }
  function beginItem() { S.phase = "pick"; S.fails = 0; S.helped = false; S.itemAt = performance.now(); drawWho(); pushProgress(); later(() => say(ITEMS[S.qi].line), reduced ? 60 : 350); }
  function pick(id, el) {
    if (S.phase !== "pick") return;
    const it = ITEMS[S.qi], ok = id === it.who;
    const base = { item_id: `who-${S.qi + 1}`, response: id, expected: it.who, correct: ok, attempt_no: S.fails + 1, response_time_ms: Math.round(performance.now() - S.itemAt) };
    if (!ok) {
      S.fails += 1; emit("answer", base);
      if (S.fails >= 2 && !S.helped) { S.helped = true; emit("hint", { item_id: base.item_id, help_level: "A2", help_by: "content", help_type: "target-glow", trigger: "second-miss" }); }
      if (el) { el.classList.remove("ws-nope"); void el.offsetWidth; el.classList.add("ws-nope"); }
      later(() => { if (S.phase === "pick") drawWho(); }, 380);
      return;
    }
    const accuracy = accuracyOf(S.fails, S.helped);
    emit("answer", Object.assign(base, { accuracy }, S.helped ? { help_level: "A2" } : {}));
    S.results.push(accuracy); S.phase = "voice"; S.itemAt = performance.now(); drawWho(); pushProgress();
  }
  function voiced() {
    emit("item_complete", { item_id: `who-${S.qi + 1}`, task: "character_voice_reading", read_ms: Math.round(performance.now() - S.itemAt), accuracy: "notApplicable" });
    hush();
    if (S.qi + 1 < ITEMS.length) { S.qi += 1; beginItem(); return; }
    S.done = true;
    const t = { accurate: 0, "self-corrected": 0, support: 0 }; S.results.forEach(a => { t[a] = (t[a] || 0) + 1; });
    emit("activity_complete", { items_done: ITEMS.length, items_total: ITEMS.length, accurate: t.accurate, self_corrected: t["self-corrected"], support: t.support });
    drawWho(); pushProgress();
  }

  document.addEventListener("click", e => {
    if (!S.host || !S.host.contains(e.target)) return;
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ssMethod) { if (b.dataset.ssMethod !== S.method) { clearTimers(); hush(); S.method = b.dataset.ssMethod; shell(); pushProgress(); } }
    else if (b.dataset.ssStart || b.dataset.ssAgain) startWho();
    else if (b.dataset.ssSay) say(ITEMS[S.qi].line);
    else if (b.dataset.ssWho) pick(b.dataset.ssWho, b);
    else if (b.dataset.ssVoiced) voiced();
  }, true);

  window.ONQ_STORY_SWITCH_GAME = {
    mount(host) { S.host = host; shell(); },
    stop() { clearTimers(); hush(); S.host = null; },
    method() { return S.method; },
    progress() { return S.method === "who" ? { done: S.done ? ITEMS.length : S.results.length, total: ITEMS.length, completed: S.done, extra: "누가 말했을까" } : null; },
    prompt() { return S.method === "who" ? (S.done ? "누가 말했을까 마침" : S.started ? `누가 말했을까 — ${S.qi + 1}번` : "누가 말했을까 — 시작 전") : "차례 놓기"; }
  };
})();
