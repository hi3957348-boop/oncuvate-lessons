(() => {
  "use strict";

  // ══ 온큐베이트 코치모드 v2 ═══════════════════════════════════════════════
  // 기준: 수업콘텐츠 제작규격 v1.16 (2026-08-22) 6장 실시간 연동 · 7장 학습 기록
  //
  //  · 역할·방·아동코드는 서버가 넣어 준다(window.ONCUVATE). 콘텐츠가 정하지 않는다.
  //  · 경로는 nav·prog 둘뿐이다(report는 v1.7에서 닫혔다).
  //      nav  ← 코치가 쓴다 (화면 번호·화면 잠금)
  //      prog ← 아이가 쓴다 · 읽기는 코치만. 아이 화면에서 prog를 구독하면 값이 오지 않는다.
  //  · 방이 없으면(자율학습) 실시간 연동을 끄고 혼자 도는 것이 기본 동작이다.
  //  · 플랫폼 런타임이 아직 안 붙었을 때만 로컬 프리뷰 통로(BroadcastChannel)로 내려간다.
  //    파일럿의 coach/index.html이 그 통로를 쓰므로 메시지 형태는 v1과 그대로 맞춘다.
  // ═════════════════════════════════════════════════════════════════════════

  const CONTENT_ID = document.documentElement.dataset.lessonId || document.body.dataset.lessonId || "we-are-friends";
  const SESSION_KEY = document.body.dataset.session || "session01";
  const storeKey = name => `${CONTENT_ID}:coach:${name}`;   // 규격 5-6 — 저장 키에 식별자 접두사

  // ── 1. 온큐베이트가 넣어 주는 값 (규격 6장) ─────────────────────────────
  // 주소 파라미터는 플랫폼 밖에서 화면을 확인할 때만 살아 있는 폴백이다.
  const params = new URLSearchParams(location.search);
  const injected = (window.ONCUVATE && typeof window.ONCUVATE === "object") ? window.ONCUVATE : null;
  // 🔴 코치 판정은 **플랫폼이 넣어 준 값으로만** 한다(보안 지침 §4).
  // 종전에는 주입이 없을 때 주소 파라미터(`?ocrole=coach`)로도 코치가 됐다. 그러면
  // 주입이 한 번 늦거나 실패한 순간 **아이가 주소만 고쳐 코치 화면을 연다.**
  // ⚠️ 화면을 가리는 것으로 끝나지 않는다 — 코치 화면은 방 전체의 진행을 구독하므로
  //    **다른 아이의 자료까지 열린다.** 「누가 무엇을 보는가는 서버가 판정한다」가 그 이유다.
  // 주소 파라미터는 **플랫폼 밖(로컬 확인)에서만** 살린다.
  const onPlatform = Boolean(injected);
  const localCheck = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
  const role = onPlatform
    ? (injected.role === "coach" ? "coach" : "child")
    : (localCheck && params.get("ocrole") === "coach" ? "coach" : "child");
  const room = (injected ? injected.room : params.get("ocroom")) || null;
  const childCode = (injected ? injected.child : params.get("occhild")) || null;
  const sessionNo = (injected ? injected.session : params.get("ocsession")) || SESSION_KEY;
  const isCoach = role === "coach";
  const solo = !room;                                        // 자율학습 — 맞출 상대가 없다

  document.documentElement.dataset.oncuvateRole = role;
  document.documentElement.dataset.oncuvateMode = solo ? "solo" : "coaching";

  // ── 2. 주입 런타임 호출부 ───────────────────────────────────────────────
  function bridged(name) {
    if (injected && typeof injected[name] === "function") return injected[name].bind(injected);
    if (typeof window[name] === "function") return window[name].bind(window);
    return null;
  }
  const platformLive = () => Boolean(!solo && window._firebaseReady && bridged("pth") && bridged("_set") && bridged("_onValue"));

  // ── 3. 로컬 프리뷰 통로 (플랫폼 런타임이 없을 때만) ─────────────────────
  // 채널 이름을 고정하면 같은 자료로 동시에 수업하는 두 코치가 한 방을 쓴다
  // (규격 6장이 `const NS = '…'`를 반례로 든 그 상황). 플랫폼 통로는 pth()가 갈라 주고,
  // 이 폴백 통로는 우리가 갈라야 한다.
  const CHANNEL_NAME = `oncuvate-coach-v1:${room || "solo"}`;
  const STORAGE_BUS_KEY = "onq.coach.bus.v1";
  const CLIENT_KEY = storeKey("client");
  let channel = null;
  try { channel = new BroadcastChannel(CHANNEL_NAME); } catch (_) { channel = null; }

  const clientId = sessionStorage.getItem(CLIENT_KEY)
    || `${SESSION_KEY}-${childCode || (crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10))}`;
  sessionStorage.setItem(CLIENT_KEY, clientId);

  function busPost(message) {
    channel?.postMessage(message);
    try {
      localStorage.setItem(STORAGE_BUS_KEY, JSON.stringify({ ...message, nonce: `${Date.now()}-${Math.random()}` }));
      localStorage.removeItem(STORAGE_BUS_KEY);
    } catch (_) { /* 저장소가 막혀 있으면 BroadcastChannel만 쓴다 */ }
  }
  function busListen(handler) {
    channel?.addEventListener("message", event => handler(event.data));
    window.addEventListener("storage", event => {
      if (event.key !== STORAGE_BUS_KEY || !event.newValue) return;
      try { handler(JSON.parse(event.newValue)); } catch (_) { /* 깨진 메시지는 버린다 */ }
    });
  }

  // ── 4. 통로 하나로 묶기 ─────────────────────────────────────────────────
  // 플랫폼이 붙으면 nav·prog로, 아니면 로컬 버스로. 부르는 쪽 코드는 같다.
  const link = {
    get mode() { return platformLive() ? "platform" : (solo ? "solo" : "local"); },

    publishProgress(payload) {                                    // 아이만 부른다
      if (platformLive()) {
        const pth = bridged("pth"), setValue = bridged("_set");
        try { setValue(pth(childCode ? `prog/${childCode}` : "prog"), payload); } catch (_) { /* 끊겨도 화면은 돈다 */ }
        return;
      }
      if (solo) return;
      busPost({ source: "onq-student", version: 2, type: "state", clientId, lessonId: CONTENT_ID, sessionId: SESSION_KEY,
                sentAt: new Date().toISOString(), payload: { reason: payload.reason, state: payload, feedbackHistory: payload.feedback } });
    },

    publishNav(payload) {                                         // 코치만 부른다
      if (platformLive()) {
        const pth = bridged("pth"), setValue = bridged("_set");
        try { setValue(pth("nav"), payload); } catch (_) { /* 끊겨도 콘솔은 돈다 */ }
        return;
      }
      if (solo) return;
      busPost({ source: "onq-coach", version: 2, type: "command", targetClientId: payload.target || "*",
                sentAt: new Date().toISOString(),
                payload: { command: "set-nav", value: { page: payload.page, pageLocked: payload.pageLocked, activityLocked: payload.activityLocked, assessOn: payload.assessOn },
                           requestId: `${Date.now()}` } });
    },

    onNav(callback) {                                             // 아이만 구독한다
      if (platformLive()) {
        const pth = bridged("pth"), onValue = bridged("_onValue");
        try { onValue(pth("nav"), snap => callback(typeof snap?.val === "function" ? snap.val() : snap)); } catch (_) { /* 경로가 없으면 현재 화면만 쓴다 */ }
        return;
      }
      if (solo) return;
      busListen(message => {
        if (!message || message.source !== "onq-coach") return;
        if (message.targetClientId && ![clientId, "*"].includes(message.targetClientId)) return;
        if (message.type === "hello" || message.type === "request-state") { publish("request"); return; }
        if (message.type !== "command") return;
        const { command, value } = message.payload || {};
        if (command === "set-nav" || command === "set-locks") callback(value || {});
        if (command === "set-page-lock") callback({ pageLocked: Boolean(value), activityLocked: locks.activityLocked });
        if (command === "set-activity-lock") callback({ pageLocked: locks.pageLocked, activityLocked: Boolean(value) });
      });
    },

    // 코치만 구독한다 (규격 6장). replace=true면 그 목록이 전부다 —
    // 나간 아이를 지우려면 병합이 아니라 통째로 갈아 끼워야 한다.
    onProg(callback) {
      if (platformLive()) {
        const pth = bridged("pth"), onValue = bridged("_onValue");
        let arrived = false;
        try {
          onValue(pth("prog"), snap => {
            arrived = true;
            const value = typeof snap?.val === "function" ? snap.val() : snap;
            callback(value && typeof value === "object" ? value : {}, true);
          });
        } catch (_) { /* 전체 구독이 막혀 있으면 아래 폴백으로 내려간다 */ }

        // ⚠️ 코치가 `prog` **전체**를 구독할 수 있는지는 아직 확인받지 못했다
        // (규격 6장 예시는 `prog/<내ID>`로 자기 것을 다루는 것뿐이다 · 43번으로 문의).
        // 막혀 있으면 값이 아예 안 오고 조용히 빈 목록이 되므로, 몇 초 기다려 보고
        // 아무것도 안 오면 내 아이 하나만이라도 구독한다 — 1:1 수업은 그것으로 충분하다.
        if (childCode) {
          window.setTimeout(() => {
            if (arrived) return;
            try {
              onValue(pth(`prog/${childCode}`), snap => {
                const value = typeof snap?.val === "function" ? snap.val() : snap;
                callback({ [childCode]: value && typeof value === "object" ? value : null }, true);
              });
            } catch (_) { /* 이쪽도 막히면 목록은 비고 수업 진행은 유지된다 */ }
          }, 6000);
        }
        return;
      }
      if (solo) return;
      busListen(message => {
        if (!message || message.source !== "onq-student" || !message.clientId) return;
        if (message.type === "offline") { callback({ [message.payload?.child || message.clientId]: null }, false); return; }
        const state = message.payload?.state;
        if (!state) return;
        callback({ [message.clientId]: { ...state, child: state.child || message.clientId } }, false);
      });
    },

    armDisconnect() {
      if (!platformLive() || isCoach || !childCode) return;
      const pth = bridged("pth"), onDisconnect = bridged("_onDisconnect");
      if (!onDisconnect) return;
      try { onDisconnect(pth(`prog/${childCode}`))?.remove?.(); } catch (_) { /* 정리 시점은 약속되어 있지 않다(규격 6장) */ }
    },

    clearProgress() {
      if (isCoach) return;
      if (platformLive()) {
        if (!childCode) return;
        const pth = bridged("pth"), remove = bridged("_remove");
        if (!remove) return;
        try { remove(pth(`prog/${childCode}`)); } catch (_) { /* 무시 */ }
        return;
      }
      if (solo) return;
      busPost({ source: "onq-student", version: 2, type: "offline", clientId, lessonId: CONTENT_ID,
                sessionId: SESSION_KEY, sentAt: new Date().toISOString(), payload: { child: childCode } });
    }
  };

  // ── 5. 잠금 상태 ────────────────────────────────────────────────────────
  const lockKey = storeKey(`locks:${SESSION_KEY}`);
  const locks = { pageLocked: false, activityLocked: false };
  try {
    const saved = JSON.parse(sessionStorage.getItem(lockKey) || "{}");
    locks.pageLocked = Boolean(saved.pageLocked);
    locks.activityLocked = Boolean(saved.activityLocked);
  } catch (_) { /* 이전 상태가 깨졌으면 풀린 채로 시작한다 */ }

  function saveLocks() {
    sessionStorage.setItem(lockKey, JSON.stringify(locks));
    document.documentElement.dataset.coachPageLocked = String(locks.pageLocked);
    document.documentElement.dataset.coachActivityLocked = String(locks.activityLocked);
  }

  // ── 6. 수집 — 진행·응답·읽기 피드백 ─────────────────────────────────────
  const MAX_TEXT = 1200;                                 // 규격 7장 문자열 상한(4,000자)보다 넉넉히 아래
  const compact = (value, limit = 180) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);

  const collected = {
    lastEvent: null,
    lastAnswer: null,
    hintCount: 0,
    completed: new Set(),
    events: [],
    feedback: []
  };

  function domProgress() {
    // shared.js가 스냅샷을 안 줄 때만 쓰는 폴백 — 화면 글자에서 「n / m」을 줍는다.
    const visible = selector => {
      const node = [...document.querySelectorAll(selector)].find(item => {
        const box = item.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      });
      return compact(node?.textContent || "");
    };
    const nav = [...document.querySelectorAll(".step-btn, [data-step]")];
    const active = document.querySelector(".step-btn.active, [data-step][aria-current='step']");
    const index = Math.max(0, active ? nav.indexOf(active) : 0);
    const label = compact(active?.querySelector("strong")?.textContent || active?.textContent || "활동 준비", 40);
    const counter = [visible(".game-kicker"), visible("[class*='progress']")]
      .map(text => text.match(/(\d+)\s*\/\s*(\d+)/)).find(Boolean);
    return {
      step: index + 1,
      steps: nav.length || 1,
      stepLabel: label,
      itemsDone: counter ? Number(counter[1]) : null,
      itemsTotal: counter ? Number(counter[2]) : null,
      prompt: visible(".sentence-text, .question-panel h2, .activity-view h1, .activity-view h2")
    };
  }

  function snapshot(reason = "update") {
    const live = typeof window.ONQ_PROGRESS === "function" ? window.ONQ_PROGRESS() : null;
    const base = live || domProgress();
    const stepTotal = base.steps || 1;
    const inner = (base.itemsTotal > 0) ? (base.itemsDone || 0) / base.itemsTotal : 0;
    const percent = Math.round((((base.step || 1) - 1 + inner) / stepTotal) * 100);
    return {
      child: childCode || clientId,
      session: sessionNo,
      lessonTitle: compact(document.querySelector(".lesson-meta strong")?.textContent || document.title, 80),
      sessionLabel: compact(base.sessionLabel || SESSION_KEY, 40),
      page: { index: base.step || 1, total: stepTotal, label: base.stepLabel || "—", percent: Math.min(100, Math.max(0, percent)) },
      item: { current: base.itemsDone ?? null, total: base.itemsTotal ?? null, correct: base.correct ?? null, wrong: base.wrong ?? null,
              label: compact(base.prompt || base.extra, 120), extra: compact(base.extra, 60) },
      activityId: base.activityId || null,
      prompt: compact(base.prompt || base.extra, 160),
      locks: { pageLocked: locks.pageLocked, activityLocked: locks.activityLocked },
      response: collected.lastAnswer,
      hintCount: collected.hintCount,
      completedActivities: [...collected.completed],
      lastEvent: collected.lastEvent,
      events: collected.events.slice(0, 12),
      feedback: collected.feedback.slice(0, 5),
      visibility: document.visibilityState,
      reason,
      at: new Date().toISOString()
    };
  }

  let publishTimer = 0;
  function publish(reason = "update") {
    if (isCoach) return;                                 // 코치 화면은 prog에 쓰지 않는다
    link.publishProgress(snapshot(reason));
  }
  function publishSoon(reason = "dom") {
    clearTimeout(publishTimer);
    publishTimer = window.setTimeout(() => publish(reason), 140);
  }

  // ── 7. 학습 기록 — 표준 통로 `oncuvate:log` (규격 7장 v1.8 확정) ────────
  // shared.js가 쓰는 사내 이벤트(`oncuvate:event`)를 표준 통로로 한 번 더 흘린다.
  // 트래커가 없으면 아무 일도 일어나지 않는다(주입되면 받고, 없으면 무시).
  // ── 사내 이벤트를 표준 통로(`oncuvate:log`)로 흘린다 ──────────────────
  // 🔴 종전에는 **화이트리스트**였다. 그래서 엔진이 새 칸을 실어도 조용히 버려졌다 —
  //    `accuracy`·`helpLevel`·`worksheetStage`가 실제로 그렇게 사라지고 있었다.
  //    규격 §7이 「그 밖의 모든 키는 그대로 저장됩니다」라고 한 이상 거를 이유가 없다.
  // ⇒ **다 보내고, 보내면 안 되는 것만 뺀다.**
  //    ⑴ 봉투에 이미 다른 이름으로 담은 것  ⑵ 중첩 객체(규격이 피하라 했다)
  //    ⑶ 긴 문자열은 자른다(상한 4,000자)
  const ENVELOPE_KEYS = new Set([
    "event_type", "activity_id", "item_id", "elapsed_ms",
    "lesson_id", "lesson_version", "session_id", "timestamp"
  ]);
  const toCamel = key => key.replace(/_([a-z0-9])/g, (_, ch) => ch.toUpperCase());

  function forwardToTracker(detail) {
    const flat = {
      type: detail.event_type || "signal",
      activityId: detail.activity_id || null,            // 있어야 수행조건이 따라붙는다(v1.16)
      itemId: detail.item_id || null,
      sessionKey: SESSION_KEY,
      elapsedMs: Number(detail.elapsed_ms) || 0
    };
    for (const key of Object.keys(detail)) {
      if (ENVELOPE_KEYS.has(key)) continue;
      const value = detail[key];
      if (value == null) continue;
      // 중첩 객체·배열은 색인 동작이 미검증이라 규격이 피하라고 했다.
      // 필요하면 엔진 쪽에서 한 줄 글로 펴서 싣는다(전사의 mismatches가 그 예).
      if (typeof value === "object") continue;
      const name = toCamel(key);
      if (flat[name] !== undefined) continue;
      flat[name] = typeof value === "string" ? compact(value, MAX_TEXT) : value;
    }
    try { window.dispatchEvent(new CustomEvent("oncuvate:log", { detail: flat })); } catch (_) { /* 무시 */ }
  }

  window.addEventListener("oncuvate:event", event => {
    const detail = event.detail || {};
    collected.lastEvent = {
      type: detail.event_type || "event",
      activityId: detail.activity_id || "",
      itemId: detail.item_id || "",
      correct: typeof detail.correct === "boolean" ? detail.correct : null,
      // 연습 구간의 머문 시간 — 코치가 「정말 읽었나」를 살펴볼 근거다(판정은 하지 않는다)
      elapsedMs: Number(detail.elapsed_ms) || 0,
      syllables: Number(detail.target_syllables) || 0,
      heardFull: typeof detail.heard_full === "boolean" ? detail.heard_full : null,
      replays: Number(detail.replays) || 0,
      response: compact(detail.response, 40),
      timestamp: detail.timestamp || new Date().toISOString()
    };
    collected.events = [collected.lastEvent, ...collected.events].slice(0, 30);
    if (detail.event_type === "answer") {
      collected.lastAnswer = {
        itemId: detail.item_id || "",
        response: compact(detail.response, 80),
        correct: typeof detail.correct === "boolean" ? detail.correct : null,
        at: collected.lastEvent.timestamp
      };
    }
    if (detail.event_type === "hint") collected.hintCount += 1;
    if (detail.event_type === "activity_complete" && detail.activity_id) collected.completed.add(detail.activity_id);
    forwardToTracker(detail);
    publishSoon("event");
  });

  window.addEventListener("onq:reading-assessment-result", event => {
    const detail = event.detail || {};
    const result = detail.result || {};
    const metrics = result.metrics || {};
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      activity: detail.activity || "reading",
      itemIndex: Number.isFinite(detail.item_index) ? detail.item_index : null,
      targetText: compact(detail.target_text, MAX_TEXT),
      transcript: compact(result.transcript, MAX_TEXT),
      scores: {
        pronunciation: Number(result.scores?.pronunciation) || null,
        speed: Number(result.scores?.speed) || null,
        phrasing: Number(result.scores?.phrasing) || null
      },
      comments: {
        pronunciation: compact(result.feedback?.pronunciation, 240),
        speed: compact(result.feedback?.speed, 240),
        phrasing: compact(result.feedback?.phrasing, 240)
      },
      errors: (Array.isArray(result.errors) ? result.errors : []).slice(0, 5).map(item => ({
        target: compact(item.target || item.type, 40),
        heard: compact(item.heard, 40),
        note: compact(item.note || item.expected_pronunciation || item.type, 120)
      })),
      rules: (Array.isArray(result.phonological_rules) ? result.phonological_rules : []).slice(0, 6).map(item => ({
        word: compact(item.word || item.rule, 40),
        applied: Boolean(item.applied),
        note: compact(item.expected_pronunciation || item.feedback || item.rule, 120)
      })),
      phrasingExample: compact(result.phrasing_example, 240),
      totalMs: Number(metrics.total_duration_ms) || 0,
      speakingMs: Number(metrics.speaking_duration_ms) || 0,
      syllables: (String(detail.target_text || "").match(/[가-힣]/g) || []).length,
      longPauseCount: Number(metrics.long_pause_count) || 0
    };
    collected.feedback = [entry, ...collected.feedback].slice(0, 10);
    publishSoon("reading-feedback");

    // ── 53번 — **판정에 쓰인 발화**를 학습 기록으로 보낸다.
    // 「어긋난 자리만」으로 좁히려던 것을 플랫폼이 되돌렸다: 원음을 안 남기므로
    // **전사 텍스트가 「기계가 잘못 들었다」에 답할 유일한 값**이고, 어긋난 것만 남기면
    // 그 판정 자체를 검증할 원본이 사라진다.
    // ⚠️ 수업 대화 전체가 아니다 — 읽기 활동에서 나온 것만이다.
    try {
      const flat = {
        type: "reading_transcript",
        activityId: detail.activity_id || detail.activity || "reading",
        itemId: entry.itemIndex != null ? `${entry.activity}-${entry.itemIndex}` : entry.activity,
        sessionKey: SESSION_KEY,
        transcript: entry.transcript,          // STT 원문 — 받아쓴 그대로
        targetText: entry.targetText,          // 무엇과 견주었나
        scorePronunciation: entry.scores.pronunciation,
        scoreSpeed: entry.scores.speed,
        scorePhrasing: entry.scores.phrasing,
        confidence: Number(result.confidence) || null,
        totalMs: entry.totalMs,
        speakingMs: entry.speakingMs
      };
      if (detail.target_rule_id) flat.targetRuleId = detail.target_rule_id;
      // 대조 결과 — 어절별 어긋난 자리. 중첩 객체를 피하라 하셔서 한 줄 글로 폅니다.
      if (entry.errors.length) {
        flat.mismatches = entry.errors
          .map(e => `${e.target}→${e.heard}${e.note ? `(${e.note})` : ""}`).join(" · ");
      }
      // 적용된 보정 규칙 — 적용 여부가 판정을 뒤집는 자리라 함께 남긴다.
      if (entry.rules.length) {
        flat.appliedRules = entry.rules
          .map(r => `${r.word}:${r.applied ? "적용" : "미적용"}`).join(" · ");
      }
      window.dispatchEvent(new CustomEvent("oncuvate:log", { detail: flat }));
    } catch (_) { /* 기록이 실패해도 수업은 계속된다 */ }
  });

  // ── 8. 잠금 적용 (아이 화면) ────────────────────────────────────────────
  const isPageNavigation = target =>
    Boolean(target.closest("[data-step], .step-btn, [data-action='next'], [data-action='prev'], .next-btn, .prev-btn"));
  const isActivityInteraction = target =>
    Boolean(target.closest(".activity-shell, .activity-view, [data-activity-root]"));

  function announceLock(kind) {
    document.querySelector(".onq-coach-lock-note")?.remove();
    const note = document.createElement("div");
    note.className = "onq-coach-lock-note";
    note.setAttribute("role", "status");
    note.textContent = kind === "page" ? "지금은 이 화면에서 함께 해요." : "선생님이 잠시 멈췄어요.";
    document.body.append(note);
    window.setTimeout(() => note.remove(), 1600);
  }

  function blockLocked(event) {
    if (isCoach) return;                                  // 코치 화면은 잠그지 않는다
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest(".onq-coach-dock")) return;         // 콘솔 자신은 언제나 열려 있다
    const pageBlocked = locks.pageLocked && isPageNavigation(target);
    const activityBlocked = locks.activityLocked && isActivityInteraction(target) && !isPageNavigation(target);
    if (!pageBlocked && !activityBlocked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "click" || event.type === "submit") announceLock(pageBlocked ? "page" : "activity");
  }

  ["click", "pointerdown", "submit", "input", "change"].forEach(type =>
    document.addEventListener(type, blockLocked, true));
  document.addEventListener("keydown", event => {
    if (!["Enter", " ", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    blockLocked(event);
  }, true);

  // ── 8-1. 코치 화면 따라가기 (아이 화면) ─────────────────────────────────
  // 코치가 넘긴 화면 번호가 nav로 온다. 잠금과는 별개다 — 잠금은 아이가 스스로
  // 못 넘게 하는 것이고, 이것은 코치를 따라 같이 넘어가는 것이다.
  function followCoachPage(page) {
    const target = Number(page);
    if (!Number.isFinite(target) || target < 1) return;
    // 「같은 값 차단」(lastFollowed)을 걷어냈다 — 잠금을 풀었다 다시 잠그면 같은 번호가
    // 다시 오는데, 그때 아이가 딴 화면에 있으면 끌어와야 한다. 이미 그 화면이면
    // 아래 current 비교가 조용히 걸러 준다(되돌림·안내문 남발 없음).
    const current = typeof window.ONQ_PROGRESS === "function" ? window.ONQ_PROGRESS().step : null;
    if (current === target) return;
    if (typeof window.ONQ_GOTO === "function") window.ONQ_GOTO(target - 1);
    else document.querySelector(`[data-step="${target - 1}"]`)?.click();
    announceFollow();
  }

  function announceFollow() {
    document.querySelector(".onq-coach-lock-note")?.remove();
    const note = document.createElement("div");
    note.className = "onq-coach-lock-note follow";
    note.setAttribute("role", "status");
    note.textContent = "선생님을 따라 이 화면으로 왔어요.";
    document.body.append(note);
    window.setTimeout(() => note.remove(), 1600);
  }

  // ── 9. 아동 식별코드 워터마크 (규격 6장) ────────────────────────────────
  // 막는 장치가 아니라 「흘러나갔을 때 어느 화면이었는지 남기는」 장치다.
  function mountWatermark() {
    if (isCoach || !childCode) return;
    const mark = document.createElement("div");
    mark.className = "onq-child-watermark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = childCode;
    document.body.append(mark);
  }

  // ── 10. 코치 콘솔 (코치 화면에서만) ─────────────────────────────────────
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const clock = value => { try { return new Date(value).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch (_) { return "—"; } };
  // 수업 중에 필요한 건 「몇 시 몇 분」이 아니라 「방금인가 아까인가」다.
  // 정확한 시각은 학습 기록으로 서버에 남는다 — 콘솔이 대신 보여 줄 자리가 아니다.
  function ago(value) {
    const ms = Date.now() - Date.parse(value || "");
    if (!Number.isFinite(ms) || ms < 0) return "";
    if (ms < 45000) return "방금";
    const minutes = Math.floor(ms / 60000);
    return minutes < 60 ? `${minutes}분 전` : `${Math.floor(minutes / 60)}시간 전`;
  }

  // 코치가 **지금 반응해야 할 일**만 남긴다. 활동 시작·마침·소리 재생 같은 것은
  // 진행 표시가 이미 말하고 있고, 정확한 시각까지 붙으면 콘솔이 로그 창이 된다.
  const NOTABLE = {
    hint: "힌트를 봤어요", support: "도움을 받았어요", help_request: "도와달라고 했어요", retry: "다시 시도했어요",
    speech_error: "소리를 못 알아들었어요", reading_capture: "읽기를 마쳤어요",
    expansion_open: "도움 문장이 열렸어요", assessment_expansion_unmapped: "연결 안 된 도움이 있어요"
  };
  function notableText(entry) {
    if (entry.type === "answer") return entry.correct === false
      ? `틀렸어요${entry.response ? ` — ${entry.response}` : ""}` : null;
    // 읽을 시간조차 없이 넘어간 경우만 알린다. **사실만 적는다** — 「기계적으로 눌렀다」는
    // 판단은 여러 회차를 본 코치가 내릴 몫이다(통합규격 §10.5: 속도는 참고치).
    if (entry.type === "reading_practice") {
      if (entry.heardFull === false) return "소리가 끝나기 전에 넘어갔어요";
      // 200ms/음절 = 분당 300음절. 초등 유창성 상단보다도 빨라 소리 내어 읽었다고 보기 어렵다.
      if (entry.syllables && entry.elapsedMs && entry.elapsedMs < entry.syllables * 200)
        return `읽을 시간보다 빨리 넘어갔어요 — ${(entry.elapsedMs / 1000).toFixed(1)}초 · ${entry.syllables}음절`;
      return null;
    }
    return NOTABLE[entry.type] || null;
  }
  // 코치가 읽을 말로 옮긴다. 내부 이름(mine_decision·intervention.phrase_sequence)이
  // 그대로 뜨면 콘솔이 로그 창이 되고, 코치는 아무것도 판단할 수 없다.
  const EVENT_LABELS = {
    lesson_start: "수업 시작", lesson_complete: "수업 마침",
    activity_start: "활동 시작", activity_complete: "활동 마침",
    answer: "응답", hint: "힌트", retry: "다시 시도", support: "도움 받음", help_request: "도움 요청",
    item_complete: "문항 마침", word_complete: "낱말 완성", level_complete: "단계 통과",
    sequence_check: "순서 확인", board_check: "판 확인", board_complete: "판 마침",
    mine_decision: "안전·폭탄 고름",
    reading_attempt: "읽기 시도", reading_capture: "읽기 녹음", reading_practice: "혼자 읽기",
    speech_attempt: "읽기 시작", speech_result: "읽기 인식", speech_error: "인식 실패",
    speech_mode: "평가 켜고 끔", audio_mode: "소리 켜고 끔",
    audio_play: "소리 들음", audio_replay: "다시 들음", replay: "다시 듣기",
    activity_response: "활동 응답",
    expansion_open: "도움 문장 펼침", expansion_close: "도움 문장 닫음",
    expansion_item_complete: "도움 문장 하나", expansion_complete: "도움 문장 마침",
    assessment_expansion_unmapped: "연결 안 된 도움",
    worksheet_pack_change: "워크지 묶음 바꿈", worksheet_stage_change: "워크지 단계 바꿈",
    print_requested: "인쇄 누름"
  };

  // 활동 식별자는 기록용 코드다 — 코치에게는 화면 이름으로 보여 준다.
  const ACTIVITY_LABELS = {
    "표지": "표지",
    "evaluation.word_meaning": "어휘체크",
    "intervention.word_phrase": "젤리캡쳐",
    "intervention.phrase_sequence": "문장 완성",
    "intervention.sentence": "나누어 읽기",
    "evaluation.paragraph": "전체 읽기",
    "support.printable": "3단계 쓰기"
  };
  const eventLabel = type => EVENT_LABELS[type] || String(type || "").replace(/_/g, " ");
  const activityLabel = id => ACTIVITY_LABELS[id] || id || "";

  // 화면 따라오기는 **페이지 잠금에 붙어 있다**. 잠겨 있으면 아이는 스스로 넘길 수 없고
  // 코치를 따라온다 — 「내가 이끄는 대로만 본다」 하나의 뜻이다.
  // 풀려 있으면 아이는 자유롭고, 코치가 넘겨도 끌려오지 않는다(미리 보기가 된다).

  // 창마다 어느 판이 떠 있는지 눈으로 가릴 수 있게 한다.
  // 없으면 「고쳤는데 안 고쳐졌다」를 서로 확인할 방법이 없다.
  const BUILD = "0823z";

  // 코치 메모 — 이 코치의 브라우저에만 남는다. 아이 화면에는 보내지 않는다
  // (규격 7장: 코치 메모는 아이가 보는 화면에 표시하지 않는다).
  // 학습 기록으로 남길 자리는 아직 확인받지 못했다 — 43번으로 문의.
  const MEMO_MAX = 3800;                    // 규격 7장 문자열 상한 4,000자보다 아래로 잡는다
  // 메모는 **아이별**로 따로 남는다. 그룹 수업에서 한 칸을 같이 쓰면 누구 이야기인지
  // 알 수 없게 되고, 기록도 엉뚱한 아이에게 붙는다.
  const memo = { target: null, text: "", saved: true, sent: "" };
  // 읽기 평가 켜고 끄기 — 수업 중에는 코치가 쥔다(아이 화면의 스위치는 자율학습 전용).
  const assessKey = storeKey("assess");
  const assess = { on: sessionStorage.getItem(assessKey) !== "off" };
  // 낱말 찾기(O/X)를 거칠지. 읽기 평가와 같은 규율 — **수업 중에는 코치가 쥔다.**
  const wordFindKey = `${CONTENT_ID}:coach:wordfind:${room || "solo"}`;
  const wordFind = { on: sessionStorage.getItem(wordFindKey) !== "off" };

  const memoKeyFor = target => `${CONTENT_ID}:coach:memo:${room || "solo"}:${target || "class"}`;

  function loadMemo(target) {
    memo.target = target || "";
    try { memo.text = localStorage.getItem(memoKeyFor(memo.target)) || ""; } catch (_) { memo.text = ""; }
    memo.saved = true;
    memo.sent = "";
  }

  const console_ = {
    open: true,
    learners: new Map(),
    selected: "",
    feedbackId: "",
    root: null
  };

  function learnerList() {
    return [...console_.learners.values()].sort((a, b) => String(a.child).localeCompare(String(b.child)));
  }
  function currentLearner() {
    return console_.learners.get(console_.selected) || learnerList()[0] || null;
  }
  // 하트비트 몇 번 놓쳤다고 「나갔다」고 말하지 않는다 — 브라우저는 뒤에 있는 탭의 타이머를
  // 늦추고, 그때마다 목록이 비면 코치는 「아이가 나갔나?」를 계속 의심하게 된다.
  // 진짜로 나간 것은 플랫폼이 prog에서 지워 알려 준다(_onDisconnect).
  const STALE_MS = 45000;
  const ageOf = entry => {
    const at = Date.parse(entry?.at || "");
    return Number.isFinite(at) ? Date.now() - at : Infinity;
  };
  const isFresh = entry => ageOf(entry) < STALE_MS;
  function ageText(entry) {
    const age = ageOf(entry);
    if (!Number.isFinite(age)) return "신호 없음";
    if (age < 15000) return "";
    const minutes = Math.floor(age / 60000);
    return minutes ? `마지막 신호 ${minutes}분 전` : `마지막 신호 ${Math.floor(age / 1000)}초 전`;
  }

  const DOCK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="13" rx="2.5"></rect><path d="M8 21h8M12 17v4M7.5 8.5h6M7.5 12h4"></path></svg>`;

  function consoleMarkup() {
    const learners = learnerList();
    const learner = currentLearner();
    const online = learners.filter(isFresh).length;
    const modeLabel = link.mode === "platform" ? "온큐베이트 실시간 연동"
                    : link.mode === "local" ? "로컬 프리뷰 통로 — 같은 브라우저 안에서만 이어집니다"
                    : "자율학습 — 실시간 연동 없음";
    if (!console_.open) {
      return `<button class="onq-dock-tab" type="button" data-coach="open" aria-label="코치 콘솔 열기" title="코치 콘솔 열기">${DOCK_ICON}</button>`;
    }
    return `
      <button class="onq-dock-grip" type="button" data-coach="grip" aria-label="콘솔 너비 조절"></button>
      <aside class="onq-dock-panel" role="complementary" aria-label="코치 콘솔">
        <header class="onq-dock-head">
          <span class="onq-dock-mark">${DOCK_ICON}</span>
          <span class="onq-dock-title"><strong>코치 콘솔</strong><span>수업 흐름과 학생 상태 · 판 ${esc(BUILD)}</span></span>
          <button class="onq-dock-close" type="button" data-coach="close" aria-label="콘솔 접기">›</button>
        </header>

        <div class="onq-dock-body">
          <p class="onq-dock-mode ${link.mode === "platform" ? "live" : ""}">${esc(modeLabel)}</p>

          <div class="onq-lock-row">
            <button class="onq-lock-btn" type="button" data-coach="page-lock" aria-pressed="${locks.pageLocked}">🔒 페이지 잠금</button>
            <button class="onq-lock-btn" type="button" data-coach="activity-lock" aria-pressed="${locks.activityLocked}">⏸ 활동 잠금</button>
          </div>
          <button class="onq-lock-btn wide" type="button" data-coach="assess" aria-pressed="${assess.on}">
            🎤 읽기 평가 ${assess.on ? "켬" : "끔"}
          </button>
          <button class="onq-lock-btn wide" type="button" data-coach="wordfind" aria-pressed="${wordFind.on}">
            🔎 낱말 찾기 ${wordFind.on ? "거침" : "건너뜀"}
          </button>


          <section class="onq-dock-section">
            <h3>접속한 학생 <span class="onq-count">${online}</span><span class="onq-dot ${online ? "on" : ""}"></span></h3>
            ${learners.length ? `<div class="onq-dock-learners">${learners.map(entry => `
              <button class="onq-learner ${entry.child === learner?.child ? "active" : ""} ${isFresh(entry) ? "online" : ""}"
                      type="button" data-coach="select" data-child="${esc(entry.child)}">${esc(entry.child)}</button>`).join("")}</div>
              <button class="onq-follow" type="button" data-coach="follow">학생이 보는 화면으로 이동</button>`
            : `<p class="onq-dock-empty">아직 접속한 학생이 없어요</p>`}

            <div class="onq-memo-block">
              <label class="onq-memo-label" for="onqMemo">메모<span class="onq-memo-state">${
                !memo.saved ? "쓰는 중" : memo.text ? "저장됨" : ""}</span></label>
              <textarea class="onq-memo" id="onqMemo" data-coach="memo" rows="3" maxlength="${MEMO_MAX}"
                placeholder="${esc(memo.target ? "고른 학생에게 남길 말 — 평가서에 함께 실립니다" : "수업에 남길 말 — 학생을 골라야 서버에 남습니다")}">${esc(memo.text)}</textarea>
              <div class="onq-memo-row">
                                <button class="onq-memo-btn" type="button" data-coach="memo-copy">복사</button>
                <button class="onq-memo-btn" type="button" data-coach="memo-clear">비우기</button>
              </div>
            </div>
          </section>

          ${learner ? progressMarkup(learner) : ""}
          ${learner ? feedbackMarkup(learner) : ""}
        </div>
      </aside>`;
  }

  function progressMarkup(learner) {
    const page = learner.page || {};
    const item = learner.item || {};
    const left = (item.total || 0) - (item.current || 0);
    const countText = item.total
      ? `${item.total}개 중 <b>${item.current ?? 0}개</b> 했어요${left > 0 ? ` · ${left}개 남음` : " · 다 했어요"}`
      : (item.extra || "아직 시작 전");
    const judged = [item.correct != null ? `맞음 ${item.correct}` : "",
                    item.wrong != null ? `다시 볼 것 ${item.wrong}` : ""].filter(Boolean).join(" · ");

    // 지금 붙들고 있는 것 — 화면 이름과 같은 값이면 한 번 더 말하지 않는다.
    const now = compact(learner.prompt || item.label, 90);
    const detail = now && now !== page.label ? now : "";

    // 눈여겨볼 일만. 없으면 없다고 말한다 — 그것도 코치에게는 정보다.
    const notable = (learner.events || []).map(entry => ({ text: notableText(entry), entry }))
      .filter(row => row.text).slice(0, 6);

    const stale = ageText(learner);
    const away = learner.visibility && learner.visibility !== "visible" ? "아이 화면이 뒤에 있어요" : "";
    return `
      <section class="onq-dock-section">
        <h3>활동 진행<span class="onq-dot ${isFresh(learner) ? "on" : ""}"></span>${
          stale || away ? `<span class="onq-stale">${esc(stale || away)}</span>` : ""}</h3>
        <div class="onq-progress-head">
          <strong>${esc(page.label || "—")}</strong>
          <span>${page.index || 1} / ${page.total || 1} 화면</span>
        </div>
        <div class="onq-progress-track"><i style="width:${Math.max(0, Math.min(100, Number(page.percent) || 0))}%"></i></div>
        ${detail ? `<p class="onq-now">${esc(detail)}</p>` : ""}
        <dl class="onq-facts">
          <div><dt>얼마나 했나</dt><dd>${countText}${item.extra && item.total ? ` <small>${esc(item.extra)}</small>` : ""}${judged ? ` <small>${esc(judged)}</small>` : ""}</dd></div>
          <div><dt>마지막 응답</dt><dd>${learner.response
            ? `${esc(learner.response.response || "—")} <small class="${learner.response.correct === true ? "ok" : learner.response.correct === false ? "warn" : ""}">${
                learner.response.correct === true ? "맞았어요" : learner.response.correct === false ? "다시 볼 것" : "정오 없는 활동"}</small>`
            : "아직 없음"}</dd></div>
          <div><dt>도움</dt><dd>${Number(learner.hintCount || 0) ? `힌트 ${learner.hintCount}번 썼어요` : "혼자 하고 있어요"}</dd></div>
        </dl>
        <div class="onq-events">${notable.length ? notable.map(row => `
          <div class="${row.entry.type === "answer" ? "warn" : ""}"><b>${esc(row.text)}</b><time>${esc(ago(row.entry.timestamp))}</time>${
            activityLabel(row.entry.activityId) ? `<small>${esc(activityLabel(row.entry.activityId))}</small>` : ""}</div>`).join("")
          : `<p class="onq-dock-empty">눈여겨볼 일이 아직 없어요</p>`}</div>
      </section>`;
  }

  function feedbackMarkup(learner) {
    const list = learner.feedback || [];
    if (!list.length) {
      return `<section class="onq-dock-section"><h3>읽기 피드백</h3>
        <p class="onq-dock-empty">문장·전체 글 읽기를 마치면 목표 문장, 전사, 별점, 오류가 여기에 나타납니다.</p></section>`;
    }
    const picked = list.find(entry => entry.id === console_.feedbackId) || list[0];
    const label = entry => `${entry.activity === "paragraph" ? "전체 글" : `문장 ${Number(entry.itemIndex ?? 0) + 1}`} · ${clock(entry.at)}`;
  // ── 읽기 속도 — 코치에게만 낸다 (아동 화면 금지: 통합규격 §10.5) ─────────
  // 「12.4초」로는 빠른지 느린지 가늠이 안 된다. **분당 음절 수**로 환산하고
  // 산식을 함께 적는다(§10.5 「사용한 산식과 학문적 근거를 함께 관리한다」).
  // ⚠️ 절대 기준으로 등급을 붙이지 않는다 — 한국어 학년별 규준이 정본에 없다.
  //    대신 **같은 아이의 지난 읽기**와 견준다(개인 기준선).
  function speedBlock(picked, all) {
    const ms = Number(picked.speakingMs) || Number(picked.totalMs) || 0;
    const syl = Number(picked.syllables) || 0;
    if (!ms || !syl) return `<div class="onq-spm"><small>읽기 속도</small><strong>—</strong><small>잴 값이 없습니다</small></div>`;
    const spm = Math.round(syl / (ms / 60000));
    // 같은 아이의 다른 읽기들(이 회차 안) 평균과 견준다.
    const others = (all || []).filter(e => e.id !== picked.id && e.syllables && (e.speakingMs || e.totalMs))
      .map(e => Math.round(e.syllables / (((e.speakingMs || e.totalMs)) / 60000)));
    let compare = "이번 회차의 첫 읽기라 견줄 것이 없습니다";
    if (others.length) {
      const avg = Math.round(others.reduce((a, b) => a + b, 0) / others.length);
      const diff = spm - avg;
      const word = Math.abs(diff) < Math.max(8, avg * 0.08) ? "지난 읽기와 비슷합니다"
        : diff > 0 ? `지난 읽기 평균(${avg})보다 <b>${diff} 빠릅니다</b>`
                   : `지난 읽기 평균(${avg})보다 <b>${Math.abs(diff)} 느립니다</b>`;
      compare = `${word} · 이번 회차 ${others.length + 1}회`;
    }
    return `<div class="onq-spm">
      <small>읽기 속도 · 분당 음절</small>
      <strong>${spm} <span>음절/분</span></strong>
      <small>${syl}음절 ÷ ${(ms / 60000).toFixed(2)}분 (발화 구간)</small>
      <small class="onq-spm-cmp">${compare}</small>
    </div>`;
  }

    const star = (name, key) => `<div class="onq-score"><small>${name}</small><strong>★ ${picked.scores?.[key] != null ? Number(picked.scores[key]).toFixed(1) : "—"}</strong><span>${esc(picked.comments?.[key] || "설명 없음")}</span></div>`;
    return `
      <section class="onq-dock-section">
        <h3>읽기 피드백</h3>
        <select class="onq-select" data-coach="feedback">${list.map(entry =>
          `<option value="${esc(entry.id)}" ${entry.id === picked.id ? "selected" : ""}>${esc(label(entry))}</option>`).join("")}</select>
        <div class="onq-read-block"><small>목표 문장</small><p>${esc(picked.targetText || "—")}</p></div>
        <div class="onq-read-block transcript"><small>실제로 들린 읽기</small><p>${esc(picked.transcript || "전사를 확인하지 못했습니다.")}</p></div>
        ${speedBlock(picked, list)}
        <div class="onq-scores">${star("발음", "pronunciation")}${star("끊어읽기", "phrasing")}</div>
        ${picked.errors?.length ? `<div class="onq-read-list"><small>확인할 오류</small><ul>${picked.errors.map(entry =>
          `<li><b>${esc(entry.target)}</b>${entry.heard ? ` → ${esc(entry.heard)}` : ""}<span>${esc(entry.note)}</span></li>`).join("")}</ul></div>` : ""}
        ${picked.rules?.length ? `<div class="onq-read-list"><small>음운 규칙</small><ul>${picked.rules.map(entry =>
          `<li class="${entry.applied ? "ok" : "warn"}"><b>${esc(entry.word)}</b> · ${entry.applied ? "적용" : "재확인"}<span>${esc(entry.note)}</span></li>`).join("")}</ul></div>` : ""}
        ${picked.phrasingExample ? `<div class="onq-read-block"><small>이렇게 끊어 읽어요</small><p>${esc(picked.phrasingExample)}</p></div>` : ""}
        <div class="onq-chips">
          <span>전체 <b>${(picked.totalMs / 1000).toFixed(1)}초</b></span>
          <span>말한 시간 <b>${(picked.speakingMs / 1000).toFixed(1)}초</b></span>
          <span>긴 쉼 <b>${picked.longPauseCount}회</b></span>
        </div>
        <p class="onq-dock-note">속도는 자동성의 참고치입니다 — 정확성·독립성과 함께 보십시오(규격 7장).</p>
      </section>`;
  }

  function memoState(text) {
    const node = console_.root?.querySelector(".onq-memo-state");
    if (node) node.textContent = text;
  }

  // 고른 아이가 바뀌면 쓰던 것을 갈무리하고 그 아이의 메모를 꺼내 온다.
  function syncMemoTarget() {
    const want = console_.selected || "";
    if (memo.target === want) return false;
    if (memo.target !== null) { saveMemo(); sendMemo("switch"); }
    loadMemo(want);
    return true;
  }

  function saveMemo() {
    try { localStorage.setItem(memoKeyFor(memo.target), memo.text); } catch (_) { /* 저장소가 막혀도 화면에는 남는다 */ }
    memo.saved = true;
    memoState(memo.text ? (memo.sent === memo.text ? "기록됨" : "저장됨 · 기록 대기") : "");
  }

  // ── 53번 — 코치 메모는 **학습 기록이 아니라 전용 자리**로 보낸다 ──────────
  //    POST /lesson/<폴더>/__memo   { childId, sessionNo, text }
  // 학습 기록(append-only·2년)에 담지 않는 이유는 그쪽이 정한 대로다 — 자유 서술은
  // **고치고 지울 수 있어야** 한다. 같은 회차에 다시 보내면 덮인다.
  // 🔒 코치만 쓸 수 있다(아이 화면에서 부르면 403) · 보호자·아동에게 안 보인다.
  // ⚠️ 입력마다 보내지 않는다 — 손을 뗄 때·학생을 바꿀 때·창을 닫을 때, 그리고
  //    **지난번에 보낸 것과 다를 때만** 보낸다.
  const MEMO_MAX_SERVER = 2000;
  // 회차 번호는 **플랫폼이 주입한 값**(위 `sessionNo`)을 먼저 쓴다. 숫자가 아니면
  // 파일 이름에서 뽑는다(session02 → 2).
  const memoSessionNo = () =>
    Number(String(sessionNo).replace(/\D/g, "")) || Number(String(SESSION_KEY).replace(/\D/g, "")) || 1;

  function sendMemo(reason) {
    const text = memo.text.trim().slice(0, MEMO_MAX_SERVER);
    if (!text || text === memo.sent) return;
    // 🔴 반 전체 메모는 보낼 수 없다 — 통로가 아이 하나를 받는다.
    // 그 경우 이 컴퓨터에만 남고, 화면에도 그렇게 적어 둔다.
    if (!memo.target) { memoState("이 컴퓨터에만"); return; }
    memoState("보내는 중…");
    fetch("__memo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: memo.target, sessionNo: memoSessionNo(), text }),
      cache: "no-store"
    }).then(res => {
      if (!res.ok) throw new Error(String(res.status));
      memo.sent = text;
      memoState("기록됨");
    }).catch(err => {
      // 통로가 아직 없거나 권한이 없으면 조용히 실패하지 않는다 — 코치가 알아야 한다.
      memoState(String(err.message) === "403" ? "권한 없음" : "못 보냄 · 이 컴퓨터에만");
    });
  }
  let memoTimer = 0;

  function renderConsole() {
    if (!console_.root) return;
    // 3초마다 다시 그리므로, 메모를 쓰는 중에는 건드리지 않는다 — 아니면 글자가 날아간다.
    if (console_.root.contains(document.activeElement) && document.activeElement?.dataset?.coach === "memo") return;
    syncMemoTarget();
    // 3초마다 다시 그리므로 읽던 자리를 잃지 않게 스크롤을 되돌려 준다.
    const scrolled = console_.root.querySelector(".onq-dock-body")?.scrollTop || 0;
    console_.root.innerHTML = consoleMarkup();
    const body = console_.root.querySelector(".onq-dock-body");
    if (body) body.scrollTop = scrolled;
    document.documentElement.dataset.coachDock = console_.open ? "open" : "closed";
  }

  // 코치가 지금 보고 있는 화면 번호(1부터). 아이를 따라오게 하려면 이 값을 실어야 한다.
  function coachPage() {
    const live = typeof window.ONQ_PROGRESS === "function" ? window.ONQ_PROGRESS() : null;
    return Number.isFinite(live?.step) ? live.step : null;
  }

  function sendNav() {
    saveLocks();
    link.publishNav({ page: locks.pageLocked ? coachPage() : null,
                      pageLocked: locks.pageLocked, activityLocked: locks.activityLocked, assessOn: assess.on, wordFindOn: wordFind.on,
                      by: "coach", at: new Date().toISOString() });
    renderConsole();
  }
  const sendLocks = sendNav;

  // 코치가 「학생이 보는 화면으로」를 누르면 자기 화면을 아이가 있는 곳으로 옮긴다.
  // 아이 화면을 끌고 오지는 않는다 — 그건 잠금과 뜻이 겹치고, 읽던 아이를 갑자기 튕겨 낸다.
  function followLearner() {
    const target = currentLearner()?.page?.index;
    if (!Number.isFinite(target)) return;
    document.querySelector(`[data-step="${target - 1}"]`)?.click();
  }

  function startResize(event) {
    const move = pointer => {
      const width = Math.round(window.innerWidth - pointer.clientX - 14);
      document.documentElement.style.setProperty("--onq-dock-w", `${Math.max(280, Math.min(560, width))}px`);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      document.body.style.userSelect = "";
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    event.preventDefault();
  }

  function mountConsole() {
    const dock = document.createElement("div");
    dock.className = "onq-coach-dock";
    document.body.append(dock);
    console_.root = dock;

    dock.addEventListener("pointerdown", event => {
      if (event.target.closest('[data-coach="grip"]')) startResize(event);
    });

    dock.addEventListener("click", event => {
      const button = event.target.closest("[data-coach]");
      if (!button || button.tagName === "SELECT") return;
      const action = button.dataset.coach;
      if (action === "open") { console_.open = true; renderConsole(); return; }
      if (action === "close") { console_.open = false; renderConsole(); return; }
      if (action === "select") { console_.selected = button.dataset.child; console_.feedbackId = ""; renderConsole(); return; }
      if (action === "follow") { followLearner(); return; }
      if (action === "memo-copy") {
        navigator.clipboard?.writeText(memo.text).then(
          () => { const st = console_.root.querySelector(".onq-memo-state"); if (st) st.textContent = "복사했어요"; },
          () => { const st = console_.root.querySelector(".onq-memo-state"); if (st) st.textContent = "복사 못 했어요"; });
        return;
      }
      if (action === "memo-send") { saveMemo(); sendMemo("button"); return; }
      if (action === "memo-clear") { memo.text = ""; memo.sent = ""; saveMemo(); renderConsole(); return; }
      if (action === "assess") {
        assess.on = !assess.on;
        sessionStorage.setItem(assessKey, assess.on ? "on" : "off");
        sendNav();
        return;
      }
      if (action === "wordfind") {
        wordFind.on = !wordFind.on;
        sessionStorage.setItem(wordFindKey, wordFind.on ? "on" : "off");
        window.ONQ_WORDFIND?.set?.(wordFind.on);     // 코치 화면도 같이 움직인다
        sendNav();
        renderConsole();
        return;
      }
      if (action === "page-lock") { locks.pageLocked = !locks.pageLocked; sendLocks(); return; }
      if (action === "activity-lock") { locks.activityLocked = !locks.activityLocked; sendLocks(); }
    });

    dock.addEventListener("change", event => {
      const field = event.target.closest("[data-coach]");
      if (field?.dataset.coach === "feedback") { console_.feedbackId = field.value; renderConsole(); }
    });

    dock.addEventListener("input", event => {
      const field = event.target.closest('[data-coach="memo"]');
      if (!field) return;
      memo.text = field.value;
      memo.saved = false;
      const state = console_.root.querySelector(".onq-memo-state");
      if (state) state.textContent = "쓰는 중";
      clearTimeout(memoTimer);
      memoTimer = window.setTimeout(saveMemo, 600);          // 손을 멈추면 저장한다
    });
    dock.addEventListener("blur", event => {
      if (!event.target.closest('[data-coach="memo"]')) return;
      saveMemo();
      sendMemo("blur");
    }, true);

    // 활동이 바뀌면 그 활동에 대한 메모로 한 번 묶어 남긴다.
    window.addEventListener("onq:progress", () => sendMemo("activity-change"));
    window.addEventListener("pagehide", () => { saveMemo(); sendMemo("leave"); });

    link.onProg((map, replace) => {
      if (replace) console_.learners.clear();          // prog가 곧 명단이다 — 빠진 아이는 나간 아이
      Object.entries(map || {}).forEach(([key, value]) => {
        if (!value || typeof value !== "object") { console_.learners.delete(key); return; }
        console_.learners.set(value.child || key, { ...value, child: value.child || key });
      });
      if (!console_.selected || !console_.learners.has(console_.selected)) console_.selected = learnerList()[0]?.child || "";
      renderConsole();
    });

    renderConsole();
    window.setInterval(renderConsole, 3000);

    // 코치가 화면을 넘길 때마다 nav를 갱신한다. 같은 번호를 다시 쓰지 않는다 —
    // 아이가 스스로 옮겨 간 화면을 코치의 옛 값이 계속 되돌리면 아이가 아무것도 못 한다.
    // 들어오면서 자기 화면을 밀지 않는다 — 읽고 있던 아이가 표지로 끌려온다.
    // 코치가 **실제로 넘길 때**부터 따라온다. 지금 아이 화면으로 가려면 아래 버튼을 쓴다.
    let publishedPage = coachPage();
    window.addEventListener("onq:progress", () => {
      const page = coachPage();
      if (page === null) return;
      // 🔴 잠금이 꺼진 동안에도 **늘 따라간다.** 종전에는 잠금 중에만 갱신해서,
      // 해제 → 이동 → 재잠금 뒤 옛 페이지로 돌아가면 「이미 보낸 번호」로 착각해
      // 발행을 건너뛰었다 — 아이만 옛 화면에 남는다(2026-08-24 실측).
      const changed = page !== publishedPage;
      publishedPage = page;
      if (!locks.pageLocked || !changed) return;
      link.publishNav({ page, pageLocked: locks.pageLocked, activityLocked: locks.activityLocked, assessOn: assess.on, wordFindOn: wordFind.on,
                        by: "coach", at: new Date().toISOString() });
    });
  }

  // ── 11. 시작 ────────────────────────────────────────────────────────────
  saveLocks();

  if (isCoach) {
    mountConsole();
    // 코치가 들어오면 현재 잠금 상태를 한 번 내려 준다 — 새로고침 뒤에도 아이 화면과 어긋나지 않게.
    link.publishNav({ page: null, pageLocked: locks.pageLocked,
                      activityLocked: locks.activityLocked, assessOn: assess.on, wordFindOn: wordFind.on, by: "coach", at: new Date().toISOString() });
  } else {
    mountWatermark();
    link.onNav(payload => {
      if (!payload || typeof payload !== "object") return;
      locks.pageLocked = Boolean(payload.pageLocked);
      locks.activityLocked = Boolean(payload.activityLocked);
      saveLocks();
      if (typeof payload.assessOn === "boolean" && typeof window.ONQ_ASSESS?.set === "function") {
        window.ONQ_ASSESS.set(payload.assessOn);
      }
      if (typeof payload.wordFindOn === "boolean" && typeof window.ONQ_WORDFIND?.set === "function") {
        window.ONQ_WORDFIND.set(payload.wordFindOn);
      }
      followCoachPage(payload.page);
      publish("nav");
    });
    link.armDisconnect();

    // 화면이 바뀔 때·활동이 움직일 때·주기적으로 진행을 올린다.
    window.addEventListener("onq:progress", () => publishSoon("progress"));
    const observer = new MutationObserver(() => publishSoon("render"));
    observer.observe(document.getElementById("app") || document.body,
      { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-current", "disabled"] });
    document.addEventListener("visibilitychange", () => publish("visibility"));
    window.setInterval(() => publish("heartbeat"), 3000);
    window.addEventListener("beforeunload", () => link.clearProgress());
    publish("hello");
  }

  // 검수용 — 화면을 열지 않고도 지금 어느 통로로, 무엇을 보내는지 확인한다.
  window.ONQ_COACH_MODE = Object.freeze({
    version: 2,
    role, room, childCode, solo,
    get transport() { return link.mode; },
    get locks() { return { ...locks }; },
    snapshot: () => snapshot("qa"),
    learners: () => learnerList()
  });
})();
