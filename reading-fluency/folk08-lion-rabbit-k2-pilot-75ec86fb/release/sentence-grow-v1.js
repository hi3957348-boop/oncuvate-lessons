/* 문장 자라기 — 나누어 읽기 바로 앞 차례 grow (2026-10-09 사용자 「같은 이야기를 두 단계쯤 읽는다 — 반복이 지루하지 않게」).
 *
 *  · 같은 장면의 문장이 단계마다 자란다(1단계 「사람들이 모여요.」 → 5단계 「궁금해진 사람들이 하나둘 모여들었어요.」).
 *    아래 단계 문장부터 한 줄씩 듣고 소리 내어 읽으면, 다음 단계 문장이 그 밑에 자라난다.
 *  · 앞 줄과 견주어 **새로 생긴 말·바뀐 말**에 노란 칠(어절 단위 견주기 — 데이터에 따로 적지 않는다).
 *  · 맨 끝 한 줄은 「도전」 — 다음 단계 문장(있을 때만). 건너뛰어도 된다.
 *  · 판정하지 않는다(읽었다는 사실과 머문 시간만 — 코치 쪽 기록). 아이 화면에 점수·시간 없음.
 *  · 데이터: window.ONQ_SENTENCE_GROW = { level, scenes:[{ pic, alt, rungs:[{ lv, text, today?, challenge? }] }] }
 *    줄 글은 음성 목록(tools/collect-aoede-texts.mjs)도 읽는다 — 줄마다 Aoede 클립이 생긴다.
 *  · ⚠️ 단추에 data-step·data-action 을 쓰지 않는다(수업 셸이 가로챈다). 이 화면은 data-sg-* 만.
 *  · 크롬 109 하한(클래스인) — :has·중첩 CSS 등 새 문법을 쓰지 않는다.
 */
(() => {
  "use strict";
  const DATA = window.ONQ_SENTENCE_GROW;
  if (!DATA || !Array.isArray(DATA.scenes) || !DATA.scenes.length) return;
  const pack = window.ONQ_CONTENT_PACK || {};
  const sessionKey = document.body.dataset.session || "session01";
  const lesson = (pack.sessions || {})[sessionKey] || {};
  const ID = "practice.sentence_grow";
  const SC = DATA.scenes;
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FACE = { guide: "assets/jelly/guide.png", listen: "assets/jelly/listening.png", praise: "assets/jelly/praise.png" };
  const say = (text, done) => { try { if (window.ONQ_AUDIO && window.ONQ_AUDIO.play && window.ONQ_AUDIO.play(text, { onended: done, onerror: done })) return; } catch (_) { /* 소리 없이도 진행 */ } if (done) done(); };
  const hush = () => { try { window.ONQ_AUDIO && window.ONQ_AUDIO.stop && window.ONQ_AUDIO.stop(); } catch (_) { /* 무시 */ } };

  // 앞 줄과 견주어 새로 생긴·바뀐 어절에 표시 — 어절(띄어쓰기) 단위 가장 긴 공통 부분열(LCS)
  const norm = w => w.replace(/[“”"‘’'.,!?…]/g, "");
  function marks(prev, text) {
    const a = prev ? prev.split(/\s+/) : [], b = text.split(/\s+/);
    if (!a.length) return b.map(w => [w, false]);
    const n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = norm(a[i]) === norm(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (j < m) {
      if (i < n && norm(a[i]) === norm(b[j])) { out.push([b[j], false]); i++; j++; }
      else if (i < n && L[i + 1][j] >= L[i][j + 1]) i++;
      else { out.push([b[j], true]); j++; }
    }
    return out;
  }

  const S = { host: null, si: 0, shown: 1, read: new Set(), phase: "read", skipped: new Set(), startedAt: performance.now(), rungAt: 0, started: false, done: false, timers: new Set() };
  const scene = () => SC[S.si];
  const keyOf = (si, ri) => `${si}:${ri}`;
  function later(fn, ms) { const id = setTimeout(() => { S.timers.delete(id); if (S.host && S.host.isConnected) fn(); }, ms); S.timers.add(id); }
  function clearTimers() { S.timers.forEach(id => clearTimeout(id)); S.timers.clear(); }
  function emit(type, payload) {
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: Object.assign({
      event_type: type, lesson_id: lesson.lessonId, lesson_version: pack.version, session_id: sessionKey, activity_id: ID, measure_id: ID,
      working_memory_load: "secondary", trend_group_id: "trend.fluency", accuracy: "notApplicable",
      elapsed_ms: Math.round(performance.now() - S.startedAt), timestamp: new Date().toISOString() }, payload || {}) }));
  }
  function pushProgress() { try { if (typeof window.ONQ_PROGRESS === "function") window.dispatchEvent(new CustomEvent("onq:progress", { detail: window.ONQ_PROGRESS() })); } catch (_) { /* 무시 */ } }
  const totalRungs = () => SC.reduce((n, s) => n + s.rungs.length, 0);

  function rungHtml(r, ri) {
    const prev = ri ? scene().rungs[ri - 1].text : "";
    const words = marks(prev, r.text).map(([w, isNew]) => isNew && ri ? `<mark>${esc(w)}</mark>` : esc(w)).join(" ");
    const k = keyOf(S.si, ri), read = S.read.has(k), skipped = S.skipped.has(k), now = ri === S.shown - 1 && !read && !skipped;
    const tag = r.challenge ? `<span class="sg-lv sg-chal">도전 · ${r.lv}단계</span>` : `<span class="sg-lv${r.today ? " sg-today" : ""}">${r.lv}단계${r.today ? " · 오늘 글" : ""}</span>`;
    return `<li class="sg-rung${now ? " sg-now" : ""}${read ? " sg-read" : ""}${skipped ? " sg-skip" : ""}${r.challenge ? " sg-challenge" : ""}" data-sg-ri="${ri}">
      ${tag}<p class="sg-text">${words}</p>
      <span class="sg-ctrl">${now ? `<button type="button" class="sg-say" data-sg-say="${ri}" aria-label="듣기">🔊</button><button type="button" class="sg-ok" data-sg-read="${ri}">읽었어요</button>${r.challenge ? `<button type="button" class="sg-pass" data-sg-pass="${ri}">건너뛰기</button>` : ""}`
        : read ? '<span class="sg-done" aria-label="읽었어요">✓</span>' : skipped ? '<span class="sg-done sg-p">–</span>' : `<button type="button" class="sg-say" data-sg-say="${ri}" aria-label="다시 듣기">🔊</button>`}</span></li>`;
  }

  function draw() {
    if (!S.host) return;
    if (!S.started) {
      S.host.innerHTML = `<div class="sg-wrap sg-intro"><img class="sg-jelly" src="${FACE.guide}" alt="젤리 선생님"><div><h3>문장이 자라요</h3>
        <p>짧은 문장부터 읽어요. 한 줄씩 읽을 때마다 문장이 조금씩 자라요.<br><mark>노란 말</mark>은 새로 생기거나 바뀐 말이에요.</p>
        <button type="button" class="sg-go" data-sg-start="1">시작하기 ▶</button></div></div>`;
      return;
    }
    if (S.done) {
      S.host.innerHTML = `<div class="sg-wrap sg-intro"><img class="sg-jelly" src="${FACE.praise}" alt="칭찬하는 젤리 선생님"><div><h3>문장이 이만큼 자랐어요!</h3>
        <p>장면 ${SC.length}개를 다 읽었어요. 이제 나누어 읽기에서 오늘 글을 읽어 봐요.</p>
        <button type="button" class="sg-go sg-quiet" data-sg-again="1">처음부터 다시</button></div></div>`;
      return;
    }
    const s = scene(), rungs = s.rungs.slice(0, S.shown), finished = S.phase === "scene-done";
    S.host.innerHTML = `<div class="sg-wrap">
      <figure class="sg-pic">${s.pic ? `<img src="${esc(s.pic)}" alt="${esc(s.alt || "")}" onerror="this.style.visibility='hidden'">` : ""}<figcaption>장면 ${S.si + 1} / ${SC.length}</figcaption></figure>
      <div class="sg-main"><ol class="sg-ladder">${rungs.map(rungHtml).join("")}</ol>
      ${finished ? `<div class="sg-next"><img src="${FACE.praise}" alt=""><span>이 장면 문장이 다 자랐어요!</span><button type="button" class="sg-go" data-sg-next="1">${S.si + 1 < SC.length ? "다음 장면 ▶" : "다 했어요 ✓"}</button></div>` : ""}</div></div>`;
    const now = S.host.querySelector(".sg-now");
    if (now && !reduced) { now.classList.add("sg-grow"); }
  }

  function readRung(ri) {
    const r = scene().rungs[ri];
    S.rungAt = performance.now();
    draw(); pushProgress();
    later(() => say(r.text), reduced ? 60 : 380);
  }
  function afterRung(ri, passed) {
    const k = keyOf(S.si, ri), r = scene().rungs[ri];
    if (passed) S.skipped.add(k); else S.read.add(k);
    emit("item_complete", { item_id: `grow-${S.si + 1}-${r.lv}`, scene: S.si + 1, level: r.lv, text: r.text, challenge: !!r.challenge,
      completed: !passed, skipped: !!passed, read_ms: Math.round(performance.now() - S.rungAt), syllables: (r.text.match(/[가-힣]/g) || []).length });
    hush();
    if (ri + 1 < scene().rungs.length) { S.shown = ri + 2; readRung(ri + 1); }
    else { S.phase = "scene-done"; draw(); pushProgress(); }
  }
  function nextScene() {
    if (S.si + 1 < SC.length) { S.si += 1; S.shown = 1; S.phase = "read"; readRung(0); return; }
    S.done = true; emit("activity_complete", { items_done: S.read.size, items_total: totalRungs(), skipped: S.skipped.size }); draw(); pushProgress();
  }

  document.addEventListener("click", e => {
    if (!S.host || !S.host.contains(e.target)) return;
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.sgStart) { S.started = true; S.startedAt = performance.now(); emit("activity_start", { items_total: totalRungs(), scenes: SC.length }); readRung(0); }
    else if (b.dataset.sgSay != null) { const r = scene().rungs[+b.dataset.sgSay]; if (r) say(r.text); }
    else if (b.dataset.sgRead != null) afterRung(+b.dataset.sgRead, false);
    else if (b.dataset.sgPass != null) afterRung(+b.dataset.sgPass, true);
    else if (b.dataset.sgNext) nextScene();
    else if (b.dataset.sgAgain) { Object.assign(S, { si: 0, shown: 1, phase: "read", done: false, started: true }); S.read.clear(); S.skipped.clear(); S.startedAt = performance.now(); emit("activity_start", { items_total: totalRungs(), attempt_no: 2 }); readRung(0); }
  }, true);

  window.ONQ_SENTENCE_GROW_GAME = {
    mount(host) { S.host = host; draw(); },
    stop() { clearTimers(); hush(); S.host = null; },
    progress() { return { done: S.read.size + S.skipped.size, total: totalRungs(), completed: S.done, extra: S.done ? "마침" : S.started ? `장면 ${S.si + 1}/${SC.length}` : "시작 전" }; },
    prompt() { return S.done ? "문장 자라기 마침" : S.started ? `문장 자라기 — 장면 ${S.si + 1}` : "문장 자라기 — 시작 전"; }
  };
})();
