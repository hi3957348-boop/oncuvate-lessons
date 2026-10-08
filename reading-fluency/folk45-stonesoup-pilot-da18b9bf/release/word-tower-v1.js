/* 낱말 탑 쌓기 — 나누어 읽기 바로 뒤 차례 tower(2026-10-07 사용자 승인 설계 · 「돌멩이 수프」부터).
 *
 *  ① 탑 쌓기 — 아래 블록(가운데)이 놓이면 젤리가 읽어 주고, 아이가 소리 내어 읽은 뒤 「읽었어요」.
 *     블록 둘이 떨어진다(바른 다음 덩이 + 닮은 함정: 한가운데 / 안가운데). 바른 것을 누르면 탑 위에 쌓이고, 듣고 읽는다.
 *     마지막 블록까지(한가운데에 / 한가운대에). 소리가 바뀌는 낱말은 마지막 블록 바로 앞에
 *     「여기만 기억해요 [앞]+[뒤] → [소리]」 카드(늘려 읽기와 같은 모양). 탑이 다 서면 젤리가 꼭대기로 폴짝 → 다음 낱말.
 *  ② 번개 탑 — 다 쌓은 낱말이 통째로 잠깐 번쩍(1500ms에서 낱말마다 줄어 700ms, 600ms 밑으로는 안 내려감)하고 사라진다.
 *     아이는 소리 내어 읽고, 본 낱말을 보기 셋(정답 + 닮은 함정 둘)에서 찾는다. 보이는 시간을 줄여 가며 한눈에 읽기(자동성)를 기른다.
 *  ③ 번쩍 카드(2026-10-08 사용자) — 3·2·1 세고 낱말·어절이 아주 짧게(450ms → 250ms) 반짝하고 사라진다.
 *     바르게 적힌 카드를 넷(정답 + 소리 나는 대로 적은 것 등 함정 셋) 가운데서 고른다. 낱말 탑보다 길거나 소리 규칙이 까다로운 말.
 *     데이터: DATA.cards = { flash:{startMs,endMs,minMs}, items:[{ w, lures:[[글자,오답유형]×3], sound, rule, focus }] }
 *  · 틀리면 그 블록이 흔들리고 그대로 남는다. 같은 칸에서 두 번 틀리면 바른 블록이 살짝 빛난다(도움 A2 로 기록).
 *  · 아이 화면에 점수는 띄우지 않는다.
 *  · 기록: oncuvate:event(activity_start · answer · hint · item_complete · round_complete · activity_complete)
 *          → coach-mode 가 oncuvate:log 로 펴서 넘긴다. 정확성은 셸과 같은 자(window.ONQ_ACCURACY) — accurate · self-corrected · support.
 *  · 데이터: window.ONQ_WORD_TOWER = { activityId, flash:{startMs,endMs,minMs},
 *            words:[{ w, chunks:[아래→위], lures:[[글자,오답유형]…](둘째 블록부터), flash:[[글자,오답유형],[…]], eq, tip, rule, focus }] }
 *  · ⚠️ 단추에 data-step·data-action 을 쓰지 않는다 — 수업 셸이 data-step 단추를 「그 차례로 가기」로, data-action 을 셸 명령으로
 *    알아듣는다(이야기 차례 게임에서 겪음). 이 게임의 단추는 data-wt-* 만 쓴다.
 *  · 크롬 109 하한(클래스인) — 새 문법(:has·중첩 CSS·toSorted 등)을 쓰지 않는다.
 */
(() => {
  "use strict";
  const DATA = window.ONQ_WORD_TOWER;
  if (!DATA || !Array.isArray(DATA.words) || !DATA.words.length) return;
  const pack = window.ONQ_CONTENT_PACK || {};
  const sessionKey = document.body.dataset.session || "session01";
  const lesson = (pack.sessions || {})[sessionKey] || {};
  const ID = DATA.activityId || "game.word_tower";
  const WORDS = DATA.words;
  const N = WORDS.length;
  const FLASH = Object.assign({ startMs: 1500, endMs: 700, minMs: 600 }, DATA.flash || {});
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = o[i]; o[i] = o[j]; o[j] = t; } return o; };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FACE = { guide: "assets/jelly/guide.png", listen: "assets/jelly/listening.png", think: "assets/jelly/thinking.png", praise: "assets/jelly/praise.png" };
  const blankTally = () => ({ accurate: 0, "self-corrected": 0, support: 0 });
  const CARDS = (DATA.cards && Array.isArray(DATA.cards.items)) ? DATA.cards.items : [];
  const M = CARDS.length;
  const CFLASH = Object.assign({ startMs: 450, endMs: 250, minMs: 200 }, (DATA.cards && DATA.cards.flash) || {});
  const cardExposure = i => Math.max(CFLASH.minMs, Math.round(CFLASH.startMs - (CFLASH.startMs - CFLASH.endMs) * (M > 1 ? i / (M - 1) : 0)));
  const END = 4;   // round 4 = 끝

  // round: 0 처음 · 1 탑 쌓기 · 2 번개 탑 · 3 번쩍 카드 · 4 끝
  // phase(번쩍 카드): ready → count(3·2·1) → flash → mask → pick → show
  // phase(탑 쌓기): read → (card) → pick → read … → hop · between
  // phase(번개 탑): ready → fix → flash → mask → read → pick → show · end
  const S = {
    host: null, round: 0, phase: "intro", attempt: 1, startedAt: performance.now(),
    wi: 0, level: 0, choices: [], fails: 0, helped: false, wordFails: 0, wordHelped: false, wordAt: 0, itemAt: 0,
    built: [], order: [], fi: 0, flashed: [], plannedMs: 0, shownMs: 0, corder: [], ci: 0, carded: [], count: 3,
    tally: { 1: blankTally(), 2: blankTally(), 3: blankTally() }, anim: {}, timers: new Set()
  };

  function later(fn, ms) {
    const id = setTimeout(() => { S.timers.delete(id); if (S.host && S.host.isConnected) fn(); }, ms);
    S.timers.add(id);
  }
  function clearTimers() { S.timers.forEach(id => clearTimeout(id)); S.timers.clear(); }
  const say = text => { try { if (window.ONQ_AUDIO && window.ONQ_AUDIO.play) window.ONQ_AUDIO.play(text); } catch (_) { /* 소리가 없어도 진행한다 */ } };
  const hush = () => { try { if (window.ONQ_AUDIO && window.ONQ_AUDIO.stop) window.ONQ_AUDIO.stop(); } catch (_) { /* 무시 */ } };
  const accuracyOf = (fails, helped) => (typeof window.ONQ_ACCURACY === "function" ? window.ONQ_ACCURACY(fails, helped)
    : helped ? "support" : fails > 0 ? "self-corrected" : "accurate");
  const ruleOf = w => (w && w.rule ? { target_rule_id: w.rule } : {});
  const word = () => WORDS[S.wi];
  const flashWord = () => WORDS[S.order[S.fi]];
  const cardItem = () => CARDS[S.corder[S.ci]];
  const exposureFor = i => Math.max(FLASH.minMs, Math.round(FLASH.startMs - (FLASH.startMs - FLASH.endMs) * (N > 1 ? i / (N - 1) : 0)));

  function emit(type, payload) {
    const ev = Object.assign({
      event_type: type, lesson_id: lesson.lessonId, lesson_version: pack.version, session_id: sessionKey, activity_id: ID, measure_id: ID,
      working_memory_load: "secondary", phonological_awareness: "mid", spelling_awareness: "high", trend_group_id: "trend.fluency",
      elapsed_ms: Math.round(performance.now() - S.startedAt), timestamp: new Date().toISOString()
    }, payload || {});
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: ev }));
  }
  // 코치 콘솔 진행 — 화면을 다시 그리지 않고 셸 스냅샷만 다시 보낸다.
  function pushProgress() {
    try { if (typeof window.ONQ_PROGRESS === "function") window.dispatchEvent(new CustomEvent("onq:progress", { detail: window.ONQ_PROGRESS() })); } catch (_) { /* 무시 */ }
  }

  // ── ① 탑 쌓기 ───────────────────────────────────────────────
  function startTower() {
    clearTimers(); hush();
    if (S.round > 0) S.attempt += 1;
    S.round = 1; S.wi = 0; S.built = []; S.tally[1] = blankTally(); S.startedAt = performance.now();
    emit("activity_start", { round: 1, round_name: "tower_build", attempt_no: S.attempt, items_total: N });
    beginWord();
  }
  function beginWord() {
    S.level = 0; S.wordFails = 0; S.wordHelped = false; S.choices = []; S.wordAt = performance.now();
    placeBlock();
  }
  // 바른 덩이 하나를 탑 위에 올리고 젤리가 읽어 준다(첫 블록은 고르지 않고 바로 놓인다).
  function placeBlock() {
    S.level += 1; S.phase = "read"; S.choices = []; S.anim.placed = S.level - 1;
    draw(); pushProgress();
    later(() => say(word().chunks[S.level - 1]), reduced ? 80 : 450);
  }
  function afterRead() {
    const w = word();
    if (S.level >= w.chunks.length) { towerDone(); return; }
    if (S.level === w.chunks.length - 1 && w.eq) { S.phase = "card"; draw(); return; }
    startPick();
  }
  function startPick() {
    const w = word(), k = S.level, lure = w.lures[k - 1] || [];
    S.choices = shuffle([{ text: w.chunks[k], ok: true }, { text: lure[0], ok: false, type: lure[1] || null }]);
    S.fails = 0; S.helped = false; S.phase = "pick"; S.anim.choices = true; S.itemAt = performance.now();
    draw();
  }
  function towerDone() {
    const w = word(), accuracy = accuracyOf(S.wordFails, S.wordHelped);
    emit("item_complete", Object.assign({ item_id: `tower-${w.w}`, round: 1, word: w.w, slots: w.chunks.length, misses: S.wordFails,
      helped: S.wordHelped, accuracy, duration_ms: Math.round(performance.now() - S.wordAt) }, ruleOf(w)));
    S.built.push(S.wi); S.phase = "hop"; S.anim.hop = true;
    draw(); pushProgress();
    later(nextWord, reduced ? 900 : 1900);
  }
  function nextWord() {
    if (S.phase !== "hop") return;
    S.wi += 1;
    if (S.wi < N) { beginWord(); return; }
    S.phase = "between";
    const t = S.tally[1];
    emit("round_complete", { round: 1, round_name: "tower_build", items: N, accurate: t.accurate, self_corrected: t["self-corrected"], support: t.support });
    draw(); pushProgress();
  }

  // ── ② 번개 탑 ───────────────────────────────────────────────
  function startFlash() {
    clearTimers(); hush();
    if (S.round > 0) S.attempt += 1;
    S.round = 2; S.order = shuffle(WORDS.map((_, i) => i)); S.fi = 0; S.flashed = []; S.tally[2] = blankTally(); S.startedAt = performance.now();
    emit("activity_start", { round: 2, round_name: "flash_read", attempt_no: S.attempt, items_total: N, exposure_start_ms: exposureFor(0) });
    S.phase = "ready"; draw(); pushProgress();
  }
  // 가운데 점 → 낱말(정해진 시간) → 무늬 가림 → 「?」. 보인 시간은 화면에 그려진 뒤부터 잰다.
  function flashGo() {
    if (S.phase !== "ready") return;
    S.plannedMs = exposureFor(S.fi); S.phase = "fix"; draw();
    later(() => {
      const box = S.host.querySelector(".wt-flash");
      if (S.phase !== "fix" || !box) return;
      S.phase = "flash"; box.className = "wt-flash word"; box.textContent = flashWord().w;
      requestAnimationFrame(() => {
        const t0 = performance.now();
        later(() => {
          const b = S.host.querySelector(".wt-flash");
          if (S.phase !== "flash" || !b) return;
          S.shownMs = Math.round(performance.now() - t0);
          S.phase = "mask"; b.className = "wt-flash mask"; b.textContent = "";
          later(() => { if (S.phase === "mask") { S.phase = "read"; draw(); } }, 300);
        }, S.plannedMs);
      });
    }, 600);
  }
  function startPick2() {
    const w = flashWord();
    S.choices = shuffle([{ text: w.w, ok: true }].concat(w.flash.map(f => ({ text: f[0], ok: false, type: f[1] || null }))));
    S.fails = 0; S.helped = false; S.phase = "pick"; S.anim.choices = true; S.itemAt = performance.now();
    draw();
  }
  function flashHit(w, accuracy) {
    emit("item_complete", Object.assign({ item_id: `flash-${w.w}`, round: 2, word: w.w, exposure_ms: S.plannedMs, shown_ms: S.shownMs,
      misses: S.fails, helped: S.helped, accuracy }, ruleOf(w)));
    S.flashed.push(S.order[S.fi]); S.phase = "show"; S.anim.placed = S.flashed.length - 1;
    draw(); pushProgress();
    later(() => say(w.w), 250);
    later(nextFlash, reduced ? 1200 : 1800);
  }
  function nextFlash() {
    if (S.phase !== "show") return;
    S.fi += 1;
    if (S.fi < N) { S.phase = "ready"; draw(); pushProgress(); return; }
    if (M) { S.phase = "between"; const t = S.tally[2];
      emit("round_complete", { round: 2, round_name: "flash_read", items: N, accurate: t.accurate, self_corrected: t["self-corrected"], support: t.support });
      draw(); pushProgress(); return; }
    finish();
  }
  // ── ③ 번쩍 카드 ─────────────────────────────────────────────
  function startCards() {
    if (!M) return;
    clearTimers(); hush();
    if (S.round > 0) S.attempt += 1;
    S.round = 3; S.corder = shuffle(CARDS.map((_, i) => i)); S.ci = 0; S.carded = []; S.tally[3] = blankTally(); S.startedAt = performance.now();
    emit("activity_start", { round: 3, round_name: "flash_card", attempt_no: S.attempt, items_total: M, exposure_start_ms: cardExposure(0) });
    S.phase = "ready"; draw(); pushProgress();
  }
  // 3 · 2 · 1 → 반짝(정해진 시간) → 무늬 가림 → 카드 고르기. 보인 시간은 화면에 그려진 뒤부터 잰다.
  function cardGo() {
    if (S.round !== 3 || S.phase !== "ready") return;
    S.plannedMs = cardExposure(S.ci); S.phase = "count"; S.count = 3; draw();
    const tick = () => {
      if (S.phase !== "count") return;
      S.count -= 1;
      if (S.count > 0) { const b = S.host.querySelector(".wt-count"); if (b) { b.textContent = S.count; b.classList.remove("beat"); void b.offsetWidth; b.classList.add("beat"); } later(tick, 650); return; }
      const box = S.host.querySelector(".wt-flash"); if (!box) return;
      S.phase = "flash"; box.className = "wt-flash word card"; box.textContent = cardItem().w;
      requestAnimationFrame(() => {
        const t0 = performance.now();
        later(() => {
          const b = S.host.querySelector(".wt-flash");
          if (S.phase !== "flash" || !b) return;
          S.shownMs = Math.round(performance.now() - t0);
          S.phase = "mask"; b.className = "wt-flash mask"; b.textContent = "";
          later(() => { if (S.phase === "mask") startPick3(); }, 350);
        }, S.plannedMs);
      });
    };
    later(tick, 650);
  }
  function startPick3() {
    const it = cardItem();
    S.choices = shuffle([{ text: it.w, ok: true }].concat(it.lures.map(f => ({ text: f[0], ok: false, type: f[1] || null }))));
    S.fails = 0; S.helped = false; S.phase = "pick"; S.anim.choices = true; S.itemAt = performance.now();
    draw();
  }
  function cardHit(it, accuracy) {
    emit("item_complete", Object.assign({ item_id: `card-${it.w}`, round: 3, word: it.w, exposure_ms: S.plannedMs, shown_ms: S.shownMs,
      misses: S.fails, helped: S.helped, accuracy }, ruleOf(it)));
    S.carded.push(S.corder[S.ci]); S.phase = "show"; S.anim.placed = S.carded.length - 1;
    draw(); pushProgress();
    later(() => say(it.w), 250);
    later(nextCard, reduced ? 1600 : 2400);
  }
  function nextCard() {
    if (S.phase !== "show") return;
    S.ci += 1;
    if (S.ci < M) { S.phase = "ready"; draw(); pushProgress(); return; }
    finish();
  }
  function finish() {
    S.round = END; S.phase = "end"; S.anim.hop = true;
    const a = S.tally[1], b = S.tally[2], c = S.tally[3];
    emit("activity_complete", Object.assign({ completion: "all_rounds", items: N, final_exposure_ms: exposureFor(N - 1),
      tower_accurate: a.accurate, tower_self_corrected: a["self-corrected"], tower_support: a.support,
      flash_accurate: b.accurate, flash_self_corrected: b["self-corrected"], flash_support: b.support },
      M ? { card_items: M, card_final_exposure_ms: cardExposure(M - 1), card_accurate: c.accurate, card_self_corrected: c["self-corrected"], card_support: c.support } : {}));
    draw(); pushProgress();
  }

  // ── 고르기(두 판 같은 자) ─────────────────────────────────────
  function choose(i, el) {
    if (S.phase !== "pick") return;
    const c = S.choices[i]; if (!c) return;
    const r3 = S.round === 3, r2 = S.round === 2 || r3, w = r3 ? cardItem() : S.round === 2 ? flashWord() : word(), k = S.level;
    const itemId = r3 ? `card-${w.w}` : r2 ? `flash-${w.w}` : `tower-${w.w}-${k + 1}`;
    const base = Object.assign({
      item_id: itemId, round: S.round, word: w.w, response: c.text, expected: r2 ? w.w : w.chunks[k], correct: c.ok,
      attempt_no: S.fails + 1, response_time_ms: Math.round(performance.now() - S.itemAt),
      choices: S.choices.map(x => x.text + (!x.ok && x.type ? ":" + x.type : "")).join("|")
    }, r2 ? { exposure_ms: S.plannedMs, shown_ms: S.shownMs } : { slot: k + 1, slots: w.chunks.length }, ruleOf(w));
    if (!c.ok) {
      S.fails += 1;
      emit("answer", Object.assign(base, c.type ? { error_type: c.type } : {}));
      if (S.fails >= 2 && !S.helped) {
        S.helped = true;
        emit("hint", { item_id: itemId, round: S.round, help_level: "A2", help_by: "content", help_type: "target-glow", trigger: "second-miss" });
      }
      if (el) { el.classList.remove("nope"); void el.offsetWidth; el.classList.add("nope"); }
      const at = S.itemAt;   // 흔들림이 끝나면 말풍선·반짝임만 다시 그린다(그새 바른 블록을 골랐으면 건드리지 않는다)
      later(() => { if (S.phase === "pick" && S.itemAt === at) draw(); }, 400);
      return;
    }
    const accuracy = accuracyOf(S.fails, S.helped);
    emit("answer", Object.assign(base, { accuracy }, S.helped ? { help_level: "A2" } : {}));
    S.tally[S.round][accuracy] += 1;
    if (r3) { cardHit(w, accuracy); return; }
    if (r2) { flashHit(w, accuracy); return; }
    S.wordFails += S.fails; S.wordHelped = S.wordHelped || S.helped;
    placeBlock();
  }

  // ── 그리기 ──────────────────────────────────────────────────
  function marked(text, w) {
    return w.focus && text === w.w && text.indexOf(w.focus) >= 0 ? esc(text).replace(esc(w.focus), `<mark>${esc(w.focus)}</mark>`) : esc(text);
  }
  function hopper(go) {
    return `<div class="wt-hop ${go ? "go" : ""}" aria-hidden="true"><img src="${FACE.praise}" alt="">${go ? '<i class="s1">✦</i><i class="s2">★</i><i class="s3">✦</i>' : ""}</div>`;
  }
  function topBar() {
    const r3 = S.round === 3 || (S.round === END && M);
    const done = r3 ? S.carded.length : S.round >= 2 ? S.flashed.length : S.built.length;
    const cur = S.round === 1 && S.phase !== "between" ? S.wi : S.round === 2 && S.phase !== "between" ? S.fi : S.round === 3 ? S.ci : -1;
    const dots = (r3 ? CARDS : WORDS).map((_, i) => `<i class="${i < done ? "on" : i === cur ? "now" : ""}"></i>`).join("");
    return `<div class="wt-top">
        <b class="wt-title">낱말 탑 쌓기</b>
        <div class="wt-rounds">
          <button type="button" class="wt-round ${S.round === 1 ? "on" : ""}" data-wt-round="1"><span>1</span>탑 쌓기</button>
          <button type="button" class="wt-round ${S.round === 2 ? "on" : ""}" data-wt-round="2"><span>2</span>번개 탑</button>
          ${M ? `<button type="button" class="wt-round ${S.round === 3 ? "on" : ""}" data-wt-round="3"><span>3</span>번쩍 카드</button>` : ""}
        </div>
        <div class="wt-dots" aria-hidden="true">${dots}</div>
      </div>`;
  }
  function stage(a) {
    const deco = `<i class="wt-cloud c1"></i><i class="wt-cloud c2"></i><div class="wt-ground"></div>`;
    if (S.round === 0) {
      return `${deco}<div class="wt-tower ghost"><div class="wt-block ghost" style="width:110px"></div><div class="wt-block ghost" style="width:150px"></div><div class="wt-block ghost" style="width:190px"></div></div>`;
    }
    if (S.round === 1) {
      if (S.phase === "between") {
        return `${deco}<div class="wt-shelf">${S.built.map((i, k) => `<span class="wt-mblock lv${k % 5}">${esc(WORDS[i].w)}</span>`).join("")}</div>`;
      }
      const w = word();
      const blocks = w.chunks.slice(0, S.level).map((c, k) =>
        `<div class="wt-block lv${k % 5} ${k === a.placed ? "drop" : ""}">${marked(c, w)}</div>`).join("");
      const slot = S.phase === "pick" || S.phase === "card" ? `<div class="wt-block slot" aria-hidden="true">?</div>` : "";
      return `${deco}<div class="wt-tower">${blocks}${slot}${S.phase === "hop" ? hopper(!!a.hop) : ""}</div>`;
    }
    if (S.round === 3 || (S.round === END && M)) {
      const cm = CARDS.map((_, k) => {
        const idx = S.carded[k];
        return idx == null ? `<span class="wt-mblock empty"></span>`
          : `<span class="wt-mblock lv${k % 5} ${k === a.placed ? "drop" : ""}">${esc(CARDS[idx].w)}</span>`;
      }).join("");
      if (S.round === END) return `${deco}<div class="wt-mini center">${cm}${hopper(!!a.hop)}</div>`;
      const it = cardItem();
      const box = S.phase === "ready" ? `<div class="wt-flash ready"><button type="button" class="wt-bolt" data-wt-act="card3">✨ 3·2·1 번쩍!</button></div>`
        : S.phase === "count" ? `<div class="wt-flash fix"><b class="wt-count beat">${S.count}</b></div>`
        : S.phase === "flash" ? `<div class="wt-flash word card">${esc(it.w)}</div>`
        : S.phase === "mask" ? `<div class="wt-flash mask"></div>`
        : S.phase === "show" ? `<div class="wt-flash show card"><span>${marked(it.w, it)}</span>${it.sound ? `<small class="wt-sound">소리: ${esc(it.sound)}</small>` : ""}</div>`
        : `<div class="wt-flash ask">?</div>`;
      return `${deco}<div class="wt-mini">${cm}</div><div class="wt-flashzone">${box}</div>`;
    }
    if (S.round === 2 && S.phase === "between") {
      return `${deco}<div class="wt-mini center">${S.flashed.map((i, k) => `<span class="wt-mblock lv${k % 5}">${esc(WORDS[i].w)}</span>`).join("")}</div>`;
    }
    // 번개 탑 — 왼쪽에 다 읽은 낱말이 쌓이는 작은 탑, 가운데에 번쩍 창
    const minis = WORDS.map((_, k) => {
      const idx = S.flashed[k];
      return idx == null ? `<span class="wt-mblock empty"></span>`
        : `<span class="wt-mblock lv${k % 5} ${k === a.placed ? "drop" : ""}">${esc(WORDS[idx].w)}</span>`;
    }).join("");
    if (S.round === END) {
      return `${deco}<div class="wt-mini center">${minis}${hopper(!!a.hop)}</div>`;
    }
    const w = flashWord();
    const box = S.phase === "ready" ? `<div class="wt-flash ready"><button type="button" class="wt-bolt" data-wt-act="flash">⚡ 번개 보기</button></div>`
      : S.phase === "fix" ? `<div class="wt-flash fix"><i class="wt-fixdot"></i></div>`
      : S.phase === "flash" ? `<div class="wt-flash word">${esc(w.w)}</div>`
      : S.phase === "mask" ? `<div class="wt-flash mask"></div>`
      : S.phase === "show" ? `<div class="wt-flash show">${esc(w.w)}</div>`
      : `<div class="wt-flash ask">?</div>`;
    return `${deco}<div class="wt-mini">${minis}</div><div class="wt-flashzone">${box}</div>`;
  }
  function choicesHtml(a) {
    const r3 = S.round === 3, r2 = S.round === 2 || r3, w = r3 ? cardItem() : S.round === 2 ? flashWord() : word(), k = S.level;
    const itemId = r3 ? `card-${w.w}` : r2 ? `flash-${w.w}` : `tower-${w.w}-${k + 1}`;
    const tone = r2 ? "" : `lv${k % 5}`;
    return `<div class="wt-choices ${r3 ? "n3 n4" : r2 ? "n3" : "n2"}" data-item-id="${esc(itemId)}" role="group" aria-label="${r3 ? "바르게 적힌 카드 고르기" : r2 ? "본 낱말 고르기" : "다음 블록 고르기"}">${S.choices.map((c, i) => {
      const glow = c.ok && S.helped;
      const track = glow ? `data-track="hint" data-help-level="A2" data-help-type="target-glow"` : `data-track="answer"`;
      return `<button type="button" class="wt-choice ${tone} ${a.choices ? "fall" : ""} ${glow ? "glow" : ""}" style="--d:${i * 110}ms"
        data-wt-pick="${i}" ${track} data-item-id="${esc(itemId)}" data-correct="${c.ok ? "true" : "false"}" data-response="${esc(c.text)}">${esc(c.text)}</button>`;
    }).join("")}</div>`;
  }
  function side(a) {
    let face = FACE.guide, bubble = "", act = "";
    const read = `<button type="button" class="wt-btn soft" data-wt-act="listen" data-track="audio">🔊 다시 듣기</button>
      <button type="button" class="wt-btn go" data-wt-act="read">읽었어요 ▶</button>`;
    if (S.round === 0) {
      bubble = "블록을 골라 낱말 탑을 쌓아요!";
      act = `<button type="button" class="wt-btn go big" data-wt-act="start">▶ 시작</button>`;
    } else if (S.round === 1) {
      if (S.phase === "read") { face = FACE.listen; bubble = "젤리 소리를 듣고, 소리 내어 읽어요."; act = read; }
      else if (S.phase === "card") {
        const w = word();
        bubble = "마지막 블록 전에 여기를 기억해요.";
        act = `<div class="wt-card"><span class="wt-tag">여기만 기억해요</span>
            <div class="wt-eq"><span class="s">${esc(w.eq[0])}</span><span class="op">+</span><span class="s">${esc(w.eq[1])}</span><span class="op">→</span><span class="to">${esc(w.eq[2])}</span></div>
            ${w.tip ? `<p>${esc(w.tip)}</p>` : ""}</div>
          <button type="button" class="wt-btn go" data-wt-act="card">알았어요 ▶</button>`;
      } else if (S.phase === "pick") {
        face = S.fails ? FACE.think : FACE.guide;
        bubble = S.fails >= 2 ? "반짝이는 블록을 눌러 봐요!" : S.fails ? "비슷하지만 달라요. 글자를 다시 봐요!" : "글자를 잘 보고 다음 블록을 골라요.";
        act = choicesHtml(a);
      } else if (S.phase === "hop") { face = FACE.praise; bubble = "탑 완성! 젤리가 올라가요!"; }
      else if (S.phase === "between") {
        face = FACE.praise; bubble = `탑 ${N}개를 다 쌓았어요! 이번엔 번개 탑이에요.`;
        act = `<button type="button" class="wt-btn go big" data-wt-act="round2">⚡ 번개 탑 시작</button>`;
      }
    } else if (S.round === 2 && S.phase === "between") {
      face = FACE.praise; bubble = "번개 탑 완성! 이번엔 더 빨라요. 번쩍 카드!";
      act = `<button type="button" class="wt-btn go big" data-wt-act="round3">✨ 번쩍 카드 시작</button>`;
    } else if (S.round === 3) {
      if (S.phase === "ready") bubble = "‘3·2·1 번쩍!’을 누르면 아주 잠깐 보였다 사라져요. 눈을 크게!";
      else if (S.phase === "count" || S.phase === "flash" || S.phase === "mask") bubble = "가운데를 잘 봐요!";
      else if (S.phase === "pick") {
        face = S.fails ? FACE.think : FACE.guide;
        bubble = S.fails >= 2 ? "반짝이는 카드를 눌러 봐요!" : S.fails ? "소리 나는 대로 쓴 카드도 있어요. 다시 봐요!" : "바르게 적힌 카드를 골라요.";
        act = choicesHtml(a);
      } else if (S.phase === "show") { face = FACE.praise; bubble = "맞아요! 소리 내어 읽어 봐요."; }
    } else if (S.round === 2) {
      if (S.phase === "ready") bubble = "‘번개 보기’를 누르면 낱말이 잠깐 나타나요. 잘 봐요!";
      else if (S.phase === "fix" || S.phase === "flash" || S.phase === "mask") bubble = "가운데를 잘 봐요!";
      else if (S.phase === "read") { face = FACE.listen; bubble = "방금 본 낱말을 소리 내어 읽어요."; act = `<button type="button" class="wt-btn go" data-wt-act="read">읽었어요 ▶</button>`; }
      else if (S.phase === "pick") {
        face = S.fails ? FACE.think : FACE.guide;
        bubble = S.fails >= 2 ? "반짝이는 낱말을 눌러 봐요!" : S.fails ? "다시 잘 찾아봐요!" : "본 낱말을 찾아 눌러요.";
        act = choicesHtml(a);
      } else if (S.phase === "show") { face = FACE.praise; bubble = "맞아요! 같이 읽어 봐요."; }
    } else {
      face = FACE.praise; bubble = M ? "번쩍 카드까지 다 했어요! 눈이 번개처럼 빨라요!" : "번개 탑까지 다 쌓았어요! 멋져요!";
      act = `<div class="wt-end" data-track="activity-complete" data-activity-id="${esc(ID)}">
          <button type="button" class="wt-btn soft" data-wt-act="again">처음부터 다시</button>
          ${M ? `<button type="button" class="wt-btn go" data-wt-act="round3">✨ 번쩍 카드 다시</button>` : `<button type="button" class="wt-btn go" data-wt-act="round2">⚡ 번개 탑 다시</button>`}</div>`;
    }
    return `<div class="wt-coach"><img src="${face}" alt="젤리코치"><p class="wt-bubble" aria-live="polite">${esc(bubble)}</p></div>
      <div class="wt-act">${act}</div>`;
  }
  function draw() {
    const host = S.host; if (!host || !host.isConnected) return;
    const a = S.anim; S.anim = {};
    host.innerHTML = `<div class="wt-root ${reduced ? "calm" : ""}" data-activity-id="${esc(ID)}" data-working-memory-load="secondary">
        ${topBar()}
        <div class="wt-main">
          <section class="wt-stage ${S.round >= 2 ? "flash-mode" : ""}" aria-label="낱말 탑">${stage(a)}</section>
          <aside class="wt-side">${side(a)}</aside>
        </div>
      </div>`;
  }

  // ── 누르기 — 셸 단추와 겹치지 않게 data-wt-* 만 본다 ─────────────
  document.addEventListener("click", ev => {
    const t = ev.target.closest && ev.target.closest("[data-wt-act], [data-wt-pick], [data-wt-round]");
    if (!t || !S.host || !S.host.contains(t)) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (t.dataset.wtPick != null) { choose(Number(t.dataset.wtPick), t); return; }
    if (t.dataset.wtRound === "1") { startTower(); return; }
    if (t.dataset.wtRound === "2") { startFlash(); return; }
    if (t.dataset.wtRound === "3") { startCards(); return; }
    const act = t.dataset.wtAct;
    if (act === "start" || act === "again") startTower();
    else if (act === "round2") startFlash();
    else if (act === "listen") { if (S.round === 1 && S.level > 0) say(word().chunks[S.level - 1]); }
    else if (act === "read") { if (S.phase !== "read") return; if (S.round === 1) afterRead(); else startPick2(); }
    else if (act === "card") { if (S.phase === "card") startPick(); }
    else if (act === "flash") flashGo();
    else if (act === "round3") startCards();
    else if (act === "card3") cardGo();
  }, true);

  window.ONQ_TOWER_GAME = {
    mount(host) {
      S.host = host;
      // 다른 차례에 갔다 오면 멈춰 둔 흐름을 이어 준다(번쩍 도중이면 그 낱말을 처음부터).
      if (S.phase === "fix" || S.phase === "flash" || S.phase === "mask" || S.phase === "count") { clearTimers(); S.phase = "ready"; }
      else if (S.round === 3 && S.phase === "show" && !S.timers.size) { nextCard(); return; }
      else if (S.phase === "hop" && !S.timers.size) { nextWord(); return; }
      else if (S.phase === "show" && !S.timers.size) { nextFlash(); return; }
      draw();
    },
    stop() { clearTimers(); hush(); S.host = null; },
    progress() {
      const r3 = S.round === 3 || (S.round === END && M);
      const done = r3 ? S.carded.length : S.round >= 2 ? S.flashed.length : S.built.length;
      const name = S.round === 0 ? "시작 전" : S.round === 1 ? "탑 쌓기" : S.round === 2 ? "번개 탑" : S.round === 3 ? "번쩍 카드" : "마침";
      const now = S.round === 1 && S.phase !== "between" ? word() : S.round === 2 && S.phase !== "between" ? flashWord() : S.round === 3 ? cardItem() : null;
      return { round: S.round, done, total: r3 ? M : N, completed: S.round === END,
               extra: `${name}${now ? ` · ${now.w}` : ""}${S.round === 2 ? ` · ${exposureFor(S.fi)}ms` : S.round === 3 ? ` · ${cardExposure(S.ci)}ms` : ""}` };
    },
    prompt() {
      if (S.round === 1 && S.phase !== "between") return `탑 쌓기 — ${word().w}`;
      if (S.round === 2 && S.phase !== "between") return `번개 탑 — ${flashWord().w}`;
      if (S.round === 3) return `번쩍 카드 — ${cardItem().w}`;
      return S.round === END ? "낱말 탑 쌓기 마침" : S.round === 2 ? "번개 탑 마침 — 번쩍 카드로" : "낱말 탑 쌓기 — 시작 전";
    }
  };
})();
