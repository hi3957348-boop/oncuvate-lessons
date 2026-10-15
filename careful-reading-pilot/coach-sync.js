(() => {
  "use strict";

  // ══ 온큐베이트 코치모드 v2 — 비문학 꼼꼼 읽기판 (coach-sync.js 2.0.0) ══════════════
  // 기준: 우리는 친구 파일럿 release/coach-mode-v2.js (표준 코치 콘솔)를 이 수업에 옮긴 것.
  //  · 코치도 같은 회차 파일을 연다. 역할은 window.ONCUVATE.role 로만 정한다.
  //    주소 ?ocrole=coach 는 localhost·file 에서 확인할 때만 산다.
  //  · 경로는 nav·prog 둘뿐.
  //      nav  ← 코치가 쓴다 (화면 번호 · 페이지 잠금 · 활동 잠금) · 아이가 읽는다
  //      prog ← 아이가 prog/<아동코드> 에 쓴다 · 읽기는 코치만
  //  · 진행은 화면 글자를 긁지 않는다. 이 수업의 oncuvate:log 기록과 .page·.step-link 로
  //    window.ONQ_PROGRESS() 를 만든다.
  //  · 예전 coach-sync.js 에서 그대로 살린 것: ONQ_PUBLISH(도입 화면이 부른다), 코치가 화면을
  //    넘기면 아이의 도입 화면 닫기, 「도와주세요」 요청 신호, html 의 data-oncuvate-role·mode,
  //    oncuvate:pilot-realtime-ready 듣기.
  //  · 2.3.0 — 옛 엔진(l11~l15·한글)도 받는다: document 로 낸 기록, 종류를 action 에 적은 기록,
  //    step-view·activity-complete 같은 옛 이름. 화면 이동 신호가 없어도 .page 의 active 변화를 지켜본다.
  //  · 2.4.6 (2026-10-13, 수업 한 바퀴 시험기로 찾음) — ① 칭찬·활동 잠금 신호에도 지금 단계를 실어 보낸다
  //    (전에는 단계가 비어서, 그 뒤 늦게 들어오거나 새로고침한 아이가 잠금에 막힌 채 1단계에 갇혔다).
  //    ② 코치가 새로고침 뒤 「수업 시작」을 다시 눌러도 아이들을 1단계로 끌고 가지 않고, 코치가 아이들 단계로 간다.
  // ═══════════════════════════════════════════════════════════════════════════

  const VERSION = "2.4.6";
  const root = document.documentElement;
  const LESSON_ID = root.dataset.lessonId || "careful-reading";
  const SESSION_KEY = root.dataset.session || "session01";
  const storeKey = name => `${LESSON_ID}:coach:${name}`;      // 저장 키에는 늘 수업 식별자 접두사

  // ── 1. 역할·방·아동코드 ─────────────────────────────────────────────────
  const params = new URLSearchParams(location.search);
  const injected = window.ONCUVATE && typeof window.ONCUVATE === "object" ? window.ONCUVATE : null;
  // 코치 콘솔에 아이 코드 대신 이름을 보인다 — 플랫폼이 코치 화면에만 `names`(코드→이름)를 준다(2026-10-10). 없으면 코드 그대로.
  const nameOf = code => (injected && injected.names && typeof injected.names === "object" && injected.names[code]) || code;
  const localCheck = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
  const role = injected
    ? (injected.role === "coach" ? "coach" : "child")
    : (localCheck && params.get("ocrole") === "coach" ? "coach" : "child");
  const isCoach = role === "coach";
  const room = String((injected ? injected.room : (localCheck ? params.get("ocroom") : "")) || "");
  const childCode = String((injected ? injected.child : (localCheck ? params.get("occhild") : "")) || "")
    .replace(/[.#$\[\]\/\s]/g, "").slice(0, 24);   // 실시간 통로 경로에 못 쓰는 글자만 뺀다(영문·숫자만 남기면 코드가 비어 신호를 못 보낼 수 있다)
  const solo = !room;

  root.dataset.oncuvateRole = role;
  root.dataset.oncuvateMode = solo ? "solo" : "coaching";

  // ── 2. 플랫폼 런타임 호출부 (window.ONCUVATE 또는 window) ──────────────────
  function bridged(name) {
    const rt = window.ONCUVATE && typeof window.ONCUVATE === "object" ? window.ONCUVATE : null;
    if (rt && typeof rt[name] === "function") return rt[name].bind(rt);
    if (typeof window[name] === "function") return window[name].bind(window);
    return null;
  }
  const firebaseReady = () => Boolean(window._firebaseReady || (window.ONCUVATE && window.ONCUVATE._firebaseReady));
  const live = () => Boolean(!solo && firebaseReady() && bridged("pth") && bridged("_set") && bridged("_onValue"));
  const valueOf = snap => (snap && typeof snap.val === "function" ? snap.val() : snap);

  function write(path, payload) {
    if (!live()) return false;
    try { Promise.resolve(bridged("_set")(bridged("pth")(path), payload)).catch(() => {}); } catch (_) { return false; }
    return true;
  }

  // ── 3. 수업 화면 정보 ───────────────────────────────────────────────────
  const pages = [...document.querySelectorAll(".page")];
  const stepLinks = [...document.querySelectorAll(".step-link")];
  const DATA = window.LESSON_DATA || {};
  const compact = (value, limit = 120) => String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, limit);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  function activeIndex() {                                  // 0부터
    const i = pages.findIndex(page => page.classList.contains("active"));
    return i < 0 ? 0 : i;
  }
  function stepLabel(i) {
    const link = stepLinks[i];
    return compact((link && link.querySelector("b") && link.querySelector("b").textContent) || `${i + 1}단계`, 40);
  }
  const activityOf = i => (pages[i] && pages[i].dataset.activityId) || "";

  // 활동별 문항 수 — 수업 데이터에서 셀 수 있는 것만. 모르면 비워 둔다(지어내지 않는다).
  function itemsTotalFor(activityId) {
    const n = list => (Array.isArray(list) ? list.length : 0);
    if (activityId === "predict") return n(DATA.prediction) || null;
    if (activityId === "careful-reading") return (n(DATA.gates) + n(DATA.questions)) || null;
    if (activityId === "problem-solver") return (DATA.counsel ? n(DATA.counsel.guests) : n(DATA.classification)) || null;
    if (activityId === "verify") return n(DATA.verify) || null;
    return null;
  }

  // 문항 식별자 → 그 문항의 질문(수업 데이터에서 꺼낸다. 화면 글자가 아니다)
  function promptFor(itemId, detail) {
    const id = String(itemId || "");
    let m;
    try {
      if ((m = id.match(/^predict-(\d+)$/)) && DATA.prediction) return `예측 낱말: ${DATA.prediction[+m[1]][0]}`;
      if ((m = id.match(/^gate-(\d+)$/)) && DATA.gates) return DATA.gates[+m[1] - 1].q;
      if ((m = id.match(/^reading-q(\d+)$/)) && DATA.questions) return DATA.questions[+m[1]][0];
      if ((m = id.match(/^spy-(\d+)$/)) && DATA.spy && DATA.spy[+m[1]]) return `단어 스파이: ${DATA.spy[+m[1]][0]}`;
      if ((m = id.match(/^verify-main-(\d+)$/)) && DATA.verify) return DATA.verify[+m[1]][0];
      if ((m = id.match(/^problem-solver-(\d+)$/)) && DATA.counsel) return DATA.counsel.guests[+m[1] - 1].worry;
    } catch (_) { /* 데이터에 없는 번호면 아래로 */ }
    if (detail && detail.word) return `낱말: ${detail.word}`;
    return "";
  }

  // ── 4. 기록 모으기 (oncuvate:log 만 듣는다) ───────────────────────────────
  const collected = {
    done: {},            // activityId → Set(itemId) — item-result 가 온 문항
    right: {},           // activityId → 맞힌 응답 수
    wrong: {},           // activityId → 틀린 응답 수
    hints: 0,            // 활동 속 도움 단추(help 기록, 「도와주세요」 제외)
    helpRequests: 0,     // 「도와주세요」 단추
    helpRequestedAt: null,
    lastItem: null,      // 마지막으로 붙든 문항 {activityId,itemId,prompt}
    lastAnswer: null,
    events: [],          // 코치가 반응할 만한 것만, 최근 순
    lessonDone: false
  };
  const bump = (bag, key) => { bag[key] = (bag[key] || 0) + 1; };
  const NOTABLE_TYPES = new Set(["answer", "help", "help-request", "item-result", "activity_complete", "lesson_complete"]);

  function remember(entry) {
    collected.events = [entry, ...collected.events].slice(0, 12);
  }

  const OLD_NAMES = { "step-view": "page_view", "activity-complete": "activity_complete", "lesson-complete": "lesson_complete" };
  function onLog(event) {
    const d = event.detail && typeof event.detail === "object" ? event.detail : {};
    const raw = String(d.type || d.action || "");
    const type = OLD_NAMES[raw] || raw;
    if (type === "hint") {                                        // 옛 엔진의 활동 속 도움
      collected.hints += 1;
      remember({ type: "help", activityId: compact(d.activityId || activityOf(activeIndex()), 60), itemId: compact(d.itemId, 60),
        at: new Date().toISOString(), correct: null, response: "", accuracy: "", helpLevel: "" });
      publishSoon("hint");
      return;
    }
    const activityId = compact(d.activityId || activityOf(activeIndex()), 60);
    const itemId = compact(d.itemId, 60);
    const at = new Date().toISOString();

    if (type === "answer") {
      if (d.correct === true) bump(collected.right, activityId);
      if (d.correct === false) bump(collected.wrong, activityId);
      const said = activityId !== "predict" ? d.response : d.response === true || d.response === "true" ? "나올 것 같아요" : d.response === false || d.response === "false" ? "아닐 것 같아요" : d.response;
      collected.lastAnswer = { activityId, itemId, response: compact(said, 60),
        correct: typeof d.correct === "boolean" ? d.correct : null, at };
      collected.lastItem = { activityId, itemId, prompt: compact(promptFor(itemId, d), 140) };
    }
    if (type === "item-result" && itemId) {
      (collected.done[activityId] || (collected.done[activityId] = new Set())).add(itemId);
    }
    if (type === "help" && d.helpLevel) collected.hints += 1;      // 활동 속 도움 단추(A1~A4)
    if (type === "lesson_complete") collected.lessonDone = true;

    if (NOTABLE_TYPES.has(type) && !(type === "help" && !d.helpLevel)) {   // 「도와주세요」는 아래 클릭에서 따로 센다
      remember({ type, activityId, itemId, at,
        correct: typeof d.correct === "boolean" ? d.correct : null,
        response: compact(type === "answer" ? collected.lastAnswer.response : d.response, 40),
        accuracy: compact(d.accuracy, 20),
        helpLevel: compact(d.helpLevel, 4) });
    }
    if (type === "page_view") onPageChange();
    publishSoon(type || "event");
  }
  window.addEventListener("oncuvate:log", onLog);
  document.addEventListener("oncuvate:log", event => { if (event.target === document) onLog(event); });   // 옛 엔진은 document 로 낸다
  // 화면 이동 신호를 내지 않는 엔진도 있어 .page 의 active 변화를 직접 지켜본다(같은 화면이면 아무 일도 안 한다).
  let observedPage = null;
  if (window.MutationObserver) {
    const watch = new MutationObserver(() => {
      const now = activeIndex();
      if (now === observedPage) return;
      observedPage = now;
      onPageChange();
      publishSoon("page");
    });
    pages.forEach(page => watch.observe(page, { attributes: true, attributeFilter: ["class"] }));
    observedPage = activeIndex();
  }

  // 「도와주세요」 — 아이가 직접 부른 도움. 코치 콘솔에 따로 띄운다.
  const helpButton = document.getElementById("helpButton");
  if (helpButton) helpButton.addEventListener("click", () => {
    if (isCoach) return;
    collected.helpRequests += 1;
    collected.helpRequestedAt = new Date().toISOString();
    remember({ type: "help-request", activityId: activityOf(activeIndex()), itemId: `page-${activeIndex() + 1}`,
      at: collected.helpRequestedAt });
    publishSoon("help-request");
  });

  // ── 5. ONQ_PROGRESS — 이 수업의 진행 스냅샷 ───────────────────────────────
  window.ONQ_PROGRESS = function () {
    const i = activeIndex();
    const activityId = activityOf(i);
    const total = itemsTotalFor(activityId);
    const done = collected.done[activityId] ? collected.done[activityId].size : 0;
    const last = collected.lastItem && collected.lastItem.activityId === activityId ? collected.lastItem : null;
    return {
      step: i + 1,
      steps: pages.length || 1,
      stepLabel: stepLabel(i),
      activityId,
      itemsDone: total ? Math.min(done, total) : done,
      itemsTotal: total,
      correct: collected.right[activityId] || 0,
      wrong: collected.wrong[activityId] || 0,
      prompt: last ? last.prompt : ""
    };
  };

  // ── 6. 잠금 ────────────────────────────────────────────────────────────
  const locks = { pageLocked: false, activityLocked: false };
  if (isCoach) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storeKey(`locks:${SESSION_KEY}`)) || "{}");
      locks.pageLocked = Boolean(saved.pageLocked);
      locks.activityLocked = Boolean(saved.activityLocked);
    } catch (_) { /* 깨졌으면 풀린 채로 */ }
  }
  function saveLocks() {
    if (isCoach) { try { sessionStorage.setItem(storeKey(`locks:${SESSION_KEY}`), JSON.stringify(locks)); } catch (_) { /* 무시 */ } }
    root.dataset.coachPageLocked = String(locks.pageLocked);
    root.dataset.coachActivityLocked = String(locks.activityLocked);
  }

  // 화면 이동 = 단계 목록 · 이전 · 다음 · 단계 점. 활동 = 지금 화면(.page) 안의 입력.
  const NAV_SELECTOR = ".step-link, [data-go], #backButton, #nextButton, #stepDots button, .step-dots button";
  const ACTIVITY_SELECTOR = ".page, #vocabDialog, .xr-pop";
  let bypass = false;                                       // 코치를 따라 넘길 때만 잠금을 비켜 간다

  function note(text, follow) {
    const old = document.querySelector(".onq-coach-lock-note");
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = "onq-coach-lock-note" + (follow ? " follow" : "");
    el.setAttribute("role", "status");
    el.textContent = text;
    document.body.append(el);
    window.setTimeout(() => el.remove(), 1600);
  }

  function blockLocked(event) {
    if (isCoach || bypass) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest(".onq-coach-dock, .oi-wrap")) return;
    const isNav = Boolean(target.closest(NAV_SELECTOR));
    const pageBlocked = locks.pageLocked && isNav;
    const activityBlocked = locks.activityLocked && !isNav && Boolean(target.closest(ACTIVITY_SELECTOR));
    if (!pageBlocked && !activityBlocked) return;
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "click" || event.type === "submit") {
      note(pageBlocked ? "지금은 이 화면에서 함께 해요." : "선생님이 잠시 멈췄어요.");
    }
  }
  if (!isCoach) {
    ["click", "pointerdown", "mousedown", "touchstart", "dragstart", "submit", "beforeinput", "input", "change"].forEach(type =>
      document.addEventListener(type, blockLocked, { capture: true, passive: false }));
    document.addEventListener("keydown", event => {
      const target = event.target instanceof Element ? event.target : null;
      const typing = target && target.matches("input, textarea, [contenteditable='true']");
      if (!typing && !["Enter", " ", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
      blockLocked(event);
    }, true);
  }

  // 화면 옮기기 — app.js 의 단계 단추를 눌러 준다(같은 기록·같은 화면 처리를 탄다).
  window.ONQ_GOTO = function (index) {
    const i = Math.max(0, Math.min(Number(index) || 0, pages.length - 1));
    const link = stepLinks[i] || document.querySelector(`[data-go="${i}"]`);
    if (!link) return;
    bypass = true;
    try { link.click(); } finally { bypass = false; }
  };

  // ── 7. 아이 → prog/<아동코드> ─────────────────────────────────────────────
  function snapshot(reason) {
    const p = window.ONQ_PROGRESS();
    const percent = Math.round(((p.step - 1 + (p.itemsTotal ? p.itemsDone / p.itemsTotal : 0)) / p.steps) * 100);
    return {
      child: childCode || "child",
      lessonId: LESSON_ID,
      session: SESSION_KEY,
      page: { index: p.step, total: p.steps, label: p.stepLabel, percent: Math.max(0, Math.min(100, percent)) },
      item: { done: p.itemsDone, total: p.itemsTotal, correct: p.correct, wrong: p.wrong },
      activityId: p.activityId,
      prompt: p.prompt,
      response: collected.lastAnswer,
      hintCount: collected.hints,
      helpRequests: collected.helpRequests,
      helpRequestedAt: collected.helpRequestedAt,
      lessonDone: collected.lessonDone,
      events: collected.events.slice(0, 8),
      locks: { pageLocked: locks.pageLocked, activityLocked: locks.activityLocked },
      visibility: document.visibilityState,
      reason: compact(reason, 30),
      at: new Date().toISOString()
    };
  }

  let publishTimer = 0;
  function publish(reason) {
    if (isCoach || !childCode) return;
    write(`prog/${childCode}`, snapshot(reason || "update"));
  }
  function publishSoon(reason) {
    if (isCoach) return;
    clearTimeout(publishTimer);
    publishTimer = window.setTimeout(() => publish(reason), 120);
  }
  // 도입 화면(intro)이 부른다. 🆕 코치가 「수업 시작」을 누르면 아이 도입 화면도 함께 닫는다(2026-10-10).
  // 🆕 2026-10-11: 코치가 「수업 시작」·「복습하기」를 누르면 아이도 진입 화면에서 곧바로 같은 쪽으로 들어온다.
  //   진입 화면은 단추가 눌리면 먼저 oncuvate:log {type:'intro-start', mode} 를 내고 그다음 화면을 연다
  //   (복습이 다른 파일로 넘어가는 수업도 있다). 그래서 그 기록을 받는 순간 nav 를 보낸다.
  let introStartedAt = null;
  let introMode = "lesson";
  try {
    introStartedAt = sessionStorage.getItem(storeKey(`intro-started:${room}`)) || null;
    introMode = sessionStorage.getItem(storeKey(`intro-mode:${room}`)) || "lesson";
  } catch (_) { /* 무시 */ }
  function coachIntroStart(mode) {
    if (!isCoach) return;
    // 이미 시작한 수업에 코치가 다시 들어왔다(새로고침) — 아이들을 1단계로 끌고 가지 않고 코치가 아이들 단계로 간다(2.4.6)
    const resumeTo = introStartedAt && navPage > 1 ? navPage : null;
    introStartedAt = new Date().toISOString();
    introMode = mode === "review" ? "review" : "lesson";
    try {
      sessionStorage.setItem(storeKey(`intro-started:${room}`), introStartedAt);
      sessionStorage.setItem(storeKey(`intro-mode:${room}`), introMode);
    } catch (_) { /* 무시 */ }
    if (resumeTo) {
      // 진입 화면이 닫히고 수업이 시작 처리를 마친 뒤에 옮긴다. 옮기면 화면 변화 감시가 그 단계로 nav 를 보낸다.
      window.setTimeout(() => window.ONQ_GOTO(resumeTo - 1), 0);
      return;
    }
    sendNav(activeIndex() + 1);
  }
  window.addEventListener("oncuvate:log", event => {
    const d = event.detail && typeof event.detail === "object" ? event.detail : {};
    if (isCoach && d.type === "intro-start") coachIntroStart(d.mode);
  });
  window.ONQ_PUBLISH = reason => {
    if (isCoach && reason === "intro-start") {
      if (!introStartedAt) coachIntroStart("lesson");             // 기록이 먼저 왔으면 이미 보냈다
      return;
    }
    publishSoon(reason || "update");
  };

  // ── 8. 코치 → nav ────────────────────────────────────────────────────────
  // nav = { page(1부터, 없으면 null), pageLocked, activityLocked, by, at }
  // 아이는 pageLocked 일 때만 page 를 따라간다.
  // sendNav(null) = 「새 단계로 데려가지 않는다」일 뿐, 마지막으로 보낸 단계는 그대로 싣는다(2.4.6) —
  // 비워 보내면 그 뒤 늦게 들어오거나 새로고침한 아이가 갈 단계를 몰라 잠금에 막힌 채 1단계에 갇힌다.
  // 마지막 단계는 탭 저장소에도 남겨 코치가 새로고침해도 이어 간다.
  const navPageKey = storeKey(`nav-page:${room}:${SESSION_KEY}`);
  let navPage = null;
  if (isCoach) {
    try { const saved = Number(sessionStorage.getItem(navPageKey)); if (saved >= 1) navPage = saved; } catch (_) { /* 무시 */ }
  }
  function sendNav(page) {
    if (!isCoach) return;
    if (Number.isFinite(page) && page >= 1) {
      navPage = page;
      try { sessionStorage.setItem(navPageKey, String(page)); } catch (_) { /* 무시 */ }
    }
    saveLocks();
    write("nav", { page: navPage,
      pageLocked: locks.pageLocked, activityLocked: locks.activityLocked, by: "coach", at: new Date().toISOString(),
      praise: consoleState.praise || null, introStartedAt: introStartedAt || null, introMode });
  }

  let lastCoachPage = null;
  function onPageChange() {
    if (!isCoach) return;
    const page = activeIndex() + 1;
    if (page === lastCoachPage) return;
    lastCoachPage = page;
    sendNav(page);
    renderConsole();
  }

  // ── 9. 아이: nav 따라가기 · 도입 화면 닫기 ──────────────────────────────────
  let lastNavPage = null;
  function onNav(value) {
    if (!value || typeof value !== "object") return;
    locks.pageLocked = Boolean(value.pageLocked);
    locks.activityLocked = Boolean(value.activityLocked);
    saveLocks();
    const page = Number(value.page);
    const hasPage = Number.isFinite(page) && page >= 1;
    // 공용 도입 화면: 코치가 「수업 시작」을 눌렀으면(또는 늦게 들어와도 이미 시작했으면) 아이도 함께 시작한다.
    if (value.introStartedAt) followIntro(value.introMode === "review" ? "review" : "lesson");
    // 공용 도입 화면: 코치가 화면을 넘기면 아이 도입 화면도 닫고 함께 시작한다.
    if (hasPage && window.ONQ_INTRO && window.ONQ_INTRO.isOpen()
        && ((lastNavPage !== null && page !== lastNavPage) || page !== activeIndex() + 1)) {
      window.ONQ_INTRO.close("coach");
    }
    if (hasPage) lastNavPage = page;
    receivePraise(value.praise);
    if (hasPage && locks.pageLocked && page !== activeIndex() + 1) {
      window.ONQ_GOTO(page - 1);
      note("선생님을 따라 이 화면으로 왔어요.", true);
    }
    publishSoon("nav");
  }

  // 코치가 이미 시작했으면 진입 화면을 그쪽으로 닫는다. 진입 화면이 nav 보다 늦게 그려지는 수업도 있어
  // (늦게 들어온 아이) 몇 초 동안 다시 살핀다.
  let introFollowTimer = 0;
  function followIntro(mode) {
    if (isCoach) return;
    const tryClose = () => {
      if (!window.ONQ_INTRO || !window.ONQ_INTRO.isOpen()) return false;
      window.ONQ_INTRO.close("coach", mode);
      return true;
    };
    clearInterval(introFollowTimer);
    if (tryClose()) return;
    let tries = 0;
    introFollowTimer = window.setInterval(() => {
      tries += 1;
      if (tryClose() || tries > 40) clearInterval(introFollowTimer);   // 최대 약 12초
    }, 300);
  }

  // ── 9-1. 칭찬 받기 (아이) — nav 에 실려 온 칭찬이 나에게 온 새 것이면 축하를 띄운다 ──
  function receivePraise(praise) {
    if (isCoach || !praise || typeof praise !== "object" || !childCode || praise.to !== childCode) return;
    const id = String(praise.id || "");
    let seen = "";
    try { seen = sessionStorage.getItem(storeKey("praise-seen")) || ""; } catch (_) { /* 무시 */ }
    if (!id || id === seen) return;
    try { sessionStorage.setItem(storeKey("praise-seen"), id); } catch (_) { /* 무시 */ }
    const sentAt = Date.parse(praise.at || "");
    if (Number.isFinite(sentAt) && Date.now() - sentAt > 90000) return;   // 늦게 들어와 지난 칭찬은 띄우지 않는다
    showPraise(compact(praise.text, 40));
    try {
      window.dispatchEvent(new CustomEvent("oncuvate:log", { detail: { type: "coach_praise", lessonId: LESSON_ID, sessionId: SESSION_KEY, text: compact(praise.text, 40), timestamp: new Date().toISOString() } }));
    } catch (_) { /* 무시 */ }
  }
  function showPraise(text) {
    const old = document.querySelector(".onq-praise-pop"); if (old) old.remove();
    const pop = document.createElement("div");
    pop.className = "onq-praise-pop";
    pop.setAttribute("role", "status");
    const bits = Array.from({ length: 14 }, (_, i) => `<i style="--a:${i * 26}deg;--d:${(i % 5) * 60}ms"></i>`).join("");
    pop.innerHTML = `<div class="onq-praise-card"><span class="onq-praise-burst" aria-hidden="true">${bits}</span>
      <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.9l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9z" fill="#ffc21a" stroke="#e08a00" stroke-width="1.2" stroke-linejoin="round"></path></svg>
      <small>선생님이 칭찬을 보냈어요</small><b>${esc(text)}</b></div>`;
    document.body.append(pop);
    pop.addEventListener("click", () => pop.remove());
    window.setTimeout(() => pop.classList.add("out"), 3200);
    window.setTimeout(() => pop.remove(), 3700);
  }

  // ── 10. 연결 (런타임이 늦게 붙어도 기다렸다가) ───────────────────────────
  let started = false;
  function connect() {
    if (started || !live()) return started;
    started = true;
    const pth = bridged("pth");
    const onValue = bridged("_onValue");
    if (isCoach) {
      let arrived = false;
      try {
        onValue(pth("prog"), snap => { arrived = true; receiveProg(valueOf(snap), true); });
      } catch (_) { /* 아래 폴백 */ }
      // 방 전체 prog 구독이 막혀 있으면 1:1 수업의 내 아이 하나만이라도 본다.
      if (childCode) {
        window.setTimeout(() => {
          if (arrived) return;
          try { onValue(pth(`prog/${childCode}`), snap => receiveProg({ [childCode]: valueOf(snap) }, true)); } catch (_) { /* 무시 */ }
        }, 6000);
      }
      // 들어오면서 화면 번호는 밀지 않는다(아이가 표지로 끌려오지 않게). 잠금 상태만 내려 준다.
      sendNav(null);
      lastCoachPage = activeIndex() + 1;
    } else {
      try { onValue(pth("nav"), snap => onNav(valueOf(snap))); } catch (_) { /* 현재 화면만 쓴다 */ }
      try {
        const onDisconnect = bridged("_onDisconnect");
        if (onDisconnect && childCode) {
          const handle = onDisconnect(pth(`prog/${childCode}`));
          if (handle && typeof handle.remove === "function") handle.remove();
        }
      } catch (_) { /* 정리 시점은 플랫폼 몫 */ }
      publish("join");
    }
    renderConsole();
    return true;
  }

  // ── 11. 코치 콘솔 ───────────────────────────────────────────────────────
  const ICON = {
    dock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2.5"></rect><path d="M8 21h8M12 17v4M7.5 8.5h6M7.5 12h4"></path></svg>',
    lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>',
    pause: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"></rect><path d="M10 9v6M14 9v6"></path></svg>',
    prev: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg>',
    next: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>',
    hand: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#a45800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-.5A5.5 5.5 0 0 1 6 17.5l-1.6-3.2a1.5 1.5 0 0 1 2.6-1.4L8 14"></path></svg>'
  };

  const ACTIVITY_LABELS = (() => {
    const map = {};
    pages.forEach((page, i) => { if (page.dataset.activityId) map[page.dataset.activityId] = stepLabel(i); });
    return map;
  })();
  const activityLabel = id => ACTIVITY_LABELS[id] || "";

  const consoleState = {
    open: true,
    learners: new Map(),
    selected: "",
    root: null,
    praise: null,            // 마지막으로 보낸 칭찬 { id, to, text, at } — nav 에 실린다
    praiseCount: {},         // 아이별 이번 수업에 보낸 칭찬 수
    praiseNote: {},          // 아이별 「보냈어요」 표시
    praiseDraft: {},         // 아이별 쓰던 칭찬(드롭다운에서 고르거나 직접 쓴 글)
    memoDraft: {},           // 아이별 쓰던 메모
    memoState: {}            // 아이별 저장 상태
  };
  const PRAISES = ["끝까지 꼼꼼히 읽었어요", "근거를 잘 찾았어요", "스스로 고쳐 냈어요", "집중을 잘했어요", "멋진 질문을 했어요", "친구를 응원해 주었어요"];
  const MEMO_MAX = 2000;
  const sessionNo = Number(String(SESSION_KEY).replace(/\D/g, "")) || null;
  const memoKey = child => storeKey(`memo:${room || "solo"}:${child}`);
  function memoText(child) {
    if (Object.prototype.hasOwnProperty.call(consoleState.memoDraft, child)) return consoleState.memoDraft[child];
    try { return localStorage.getItem(memoKey(child)) || ""; } catch (_) { return ""; }
  }

  const STALE_MS = 45000;
  const ageOf = entry => { const t = Date.parse((entry && entry.at) || ""); return Number.isFinite(t) ? Date.now() - t : Infinity; };
  const isFresh = entry => ageOf(entry) < STALE_MS;
  function ago(value) {
    const ms = Date.now() - Date.parse(value || "");
    if (!Number.isFinite(ms) || ms < 0) return "";
    if (ms < 45000) return "방금";
    const min = Math.floor(ms / 60000);
    return min < 60 ? `${min}분 전` : `${Math.floor(min / 60)}시간 전`;
  }

  function receiveProg(map, replace) {
    if (replace) consoleState.learners.clear();
    Object.entries(map && typeof map === "object" ? map : {}).forEach(([key, value]) => {
      if (!value || typeof value !== "object") { consoleState.learners.delete(key); return; }
      const code = compact(value.child || key, 12);
      consoleState.learners.set(code, Object.assign({}, value, { child: code }));
    });
    if (!consoleState.selected || !consoleState.learners.has(consoleState.selected)) {
      consoleState.selected = learnerList()[0] ? learnerList()[0].child : "";
    }
    renderConsole();
  }
  const learnerList = () => [...consoleState.learners.values()].sort((a, b) => String(a.child).localeCompare(String(b.child)));
  const currentLearner = () => consoleState.learners.get(consoleState.selected) || learnerList()[0] || null;

  function eventText(entry) {
    if (entry.type === "help-request") return { text: "도와달라고 했어요", cls: "help" };
    if (entry.type === "help") return { text: `도움 단추를 썼어요${entry.helpLevel ? ` (${entry.helpLevel})` : ""}`, cls: "" };
    if (entry.type === "answer") {
      if (entry.correct === false) return { text: `틀렸어요${entry.response ? ` — ${entry.response}` : ""}`, cls: "warn" };
      if (entry.correct === true) return { text: `맞았어요${entry.response ? ` — ${entry.response}` : ""}`, cls: "ok" };
      return { text: `응답했어요${entry.response ? ` — ${entry.response}` : ""}`, cls: "" };
    }
    if (entry.type === "item-result" && entry.accuracy === "support") return { text: "도움을 받고 마쳤어요", cls: "" };
    if (entry.type === "activity_complete") return { text: "활동을 마쳤어요", cls: "ok" };
    if (entry.type === "lesson_complete") return { text: "수업을 마쳤어요", cls: "ok" };
    return null;
  }

  function consoleMarkup() {
    if (!consoleState.open) {
      return `<button class="onq-dock-tab" type="button" data-coach="open" aria-label="강사 콘솔 열기" title="강사 콘솔 열기">${ICON.dock}</button>`;
    }
    const learners = learnerList();
    const learner = currentLearner();
    const online = learners.filter(isFresh).length;
    const ci = activeIndex();
    const mode = live() ? "온큐베이트 실시간 연동" : (solo ? "수업방 없음 — 혼자 보기" : "실시간 연결을 기다리는 중");
    return `
      <button class="onq-dock-grip" type="button" data-coach="grip" aria-label="콘솔 너비 조절" title="끌어서 너비 조절"></button>
      <aside class="onq-dock-panel" aria-label="강사 콘솔">
        <header class="onq-dock-head">
          <span class="onq-dock-mark">${ICON.dock}</span>
          <span class="onq-dock-title"><strong>강사 콘솔</strong><span>수업 흐름과 학생 상태</span></span>
          <button class="onq-dock-close" type="button" data-coach="close" aria-label="콘솔 접기" title="접기">›</button>
        </header>
        <div class="onq-dock-body">
          <p class="onq-dock-mode ${live() ? "live" : ""}">${esc(mode)}</p>

          <div class="onq-lock-row">
            <button class="onq-lock-btn" type="button" data-coach="page-lock" aria-pressed="${locks.pageLocked}" title="학생이 화면을 스스로 넘기지 못하고 선생님 화면을 따라와요">${ICON.lock}<span>페이지 잠금</span></button>
            <button class="onq-lock-btn" type="button" data-coach="activity-lock" aria-pressed="${locks.activityLocked}" title="지금 화면의 활동 입력만 멈춰요">${ICON.pause}<span>활동 잠금</span></button>
          </div>

          <div class="onq-nav-row">
            <button class="onq-nav-btn" type="button" data-coach="prev" ${ci <= 0 ? "disabled" : ""} aria-label="이전 화면">${ICON.prev}</button>
            <span class="onq-nav-now"><b>${ci + 1} / ${pages.length}</b> ${esc(stepLabel(ci))}</span>
            <button class="onq-nav-btn" type="button" data-coach="next" ${ci >= pages.length - 1 ? "disabled" : ""} aria-label="다음 화면">${ICON.next}</button>
          </div>
          <p class="onq-dock-note">${locks.pageLocked ? "페이지 잠금 중 — 넘기면 학생도 따라와요." : "잠금이 풀려 있어 학생은 따라오지 않아요."}</p>

          <section class="onq-dock-section">
            <h3>접속한 학생 <span class="onq-count">${online}</span><span class="onq-dot ${online ? "on" : ""}"></span></h3>
            ${learners.length ? `<div class="onq-dock-learners">${learners.map(entry => `
              <button class="onq-learner ${learner && entry.child === learner.child ? "active" : ""} ${isFresh(entry) ? "online" : ""}"
                type="button" data-coach="select" data-child="${esc(entry.child)}">${esc(nameOf(entry.child))}${entry.helpRequestedAt && ageOf({ at: entry.helpRequestedAt }) < 120000 ? '<i class="onq-help-dot" aria-label="도움 요청"></i>' : ""}</button>`).join("")}</div>
              <button class="onq-follow" type="button" data-coach="follow">학생이 보는 화면으로 이동</button>`
              : '<p class="onq-dock-empty">아직 접속한 학생이 없어요</p>'}
          </section>

          ${learners.length ? overviewMarkup(learners, ci) : ""}
          ${learner ? progressMarkup(learner) : ""}
          ${learner ? coachToolsMarkup(learner) : ""}
          ${learner ? recentMarkup(learner) : ""}
        </div>
      </aside>`;
  }

  function progressMarkup(learner) {
    const page = learner.page || {};
    const item = learner.item || {};
    const count = item.total
      ? `${item.total}개 중 <b>${item.done || 0}개</b> 마침`
      : (item.done ? `<b>${item.done}개</b> 마침` : "아직 마친 문항 없음");
    const judged = (item.correct || item.wrong) ? `맞음 ${item.correct || 0} · 틀림 ${item.wrong || 0}` : "";
    const resp = learner.response;
    const stale = !isFresh(learner) ? "신호가 끊겼어요" : (learner.visibility && learner.visibility !== "visible" ? "학생 화면이 뒤에 있어요" : "");
    const helpLine = learner.helpRequests
      ? `「도와주세요」 ${learner.helpRequests}번${learner.helpRequestedAt ? ` · 마지막 ${ago(learner.helpRequestedAt)}` : ""}`
      : "";
    const hintLine = learner.hintCount ? `도움 단추 ${learner.hintCount}번` : "";
    return `
      <section class="onq-dock-section">
        <h3>활동 진행<span class="onq-dot ${isFresh(learner) ? "on" : ""}"></span>${stale ? `<span class="onq-stale">${esc(stale)}</span>` : ""}</h3>
        <div class="onq-progress-head"><strong>${esc(page.label || "—")}</strong><span>${page.index || 1} / ${page.total || pages.length} 단계</span></div>
        <div class="onq-progress-track"><i style="width:${Math.max(0, Math.min(100, Number(page.percent) || 0))}%"></i></div>
        ${learner.prompt ? `<p class="onq-now">${esc(learner.prompt)}</p>` : ""}
        <dl class="onq-facts">
          <div><dt>얼마나 했나</dt><dd>${count}${judged ? ` <small>${esc(judged)}</small>` : ""}${learner.lessonDone ? ' <small class="ok">수업 마침</small>' : ""}</dd></div>
          <div><dt>마지막 응답</dt><dd>${resp
            ? `${esc(resp.response || "—")} <small class="${resp.correct === true ? "ok" : resp.correct === false ? "warn" : ""}">${resp.correct === true ? "맞았어요" : resp.correct === false ? "다시 볼 것" : "정오 없음"}</small>`
            : "아직 없음"}</dd></div>
          <div><dt>도움</dt><dd>${helpLine || hintLine ? esc([helpLine, hintLine].filter(Boolean).join(" · ")) : "혼자 하고 있어요"}</dd></div>
        </dl>
      </section>`;
  }

  // ── 한눈에 보기: 학생마다 한 줄 진행 막대 · 선생님 단계 세로선 · 먼저 도울 학생을 위로 ──
  const STUCK_MS = 120000;                 // 2분 넘게 응답이 없으면 「멈춤」
  function lastActive(entry) {
    const times = (entry.events || []).map(e => Date.parse(e.at || "")).filter(Number.isFinite);
    const t = times.length ? Math.max(...times) : Date.parse(entry.startedAt || entry.at || "");
    return Number.isFinite(t) ? t : null;
  }
  function paceOf(entry, coachStep) {
    const page = entry.page || {};
    const step = Number(page.index) || 1;
    const last = lastActive(entry);
    const idle = last ? Date.now() - last : 0;
    const helpNow = entry.helpRequestedAt && ageOf({ at: entry.helpRequestedAt }) < 180000;
    const recentWrong = (entry.events || []).slice(0, 4).filter(e => e.type === "answer" && e.correct === false).length;
    if (entry.lessonDone) return { key: "done", rank: 5, text: "수업 마침" };
    if (!isFresh(entry)) return { key: "off", rank: 4, text: "연결 끊김" };
    if (helpNow) return { key: "help", rank: 0, text: "도움 요청" };
    if (idle > STUCK_MS) return { key: "stuck", rank: 1, text: `${Math.floor(idle / 60000)}분째 멈춤` };
    if (recentWrong >= 3) return { key: "stuck", rank: 1, text: "연달아 틀림" };
    if (coachStep - step >= 2) return { key: "behind", rank: 2, text: `${coachStep - step}단계 뒤` };
    return { key: "ok", rank: 3, text: "잘 가는 중" };
  }
  function overviewMarkup(learners, ci) {
    const total = pages.length;
    const coachStep = ci + 1;
    const coachLeft = Math.max(0, Math.min(100, ((coachStep - 0.5) / total) * 100));
    const rows = learners.map(entry => Object.assign({ entry }, paceOf(entry, coachStep)))
      .sort((a, b) => a.rank - b.rank || String(a.entry.child).localeCompare(String(b.entry.child)));
    const need = rows.filter(r => r.rank <= 2).length;
    const ticks = Array.from({ length: total - 1 }, (_, i) => `<i style="left:${((i + 1) / total) * 100}%"></i>`).join("");
    return `
      <section class="onq-dock-section onq-overview">
        <h3>한눈에 보기${need ? `<span class="onq-need">먼저 볼 학생 ${need}</span>` : '<span class="onq-allgood">모두 잘 가는 중</span>'}</h3>
        <div class="onq-ov-scale"><span>1</span><span>${total}단계</span></div>
        <div class="onq-ov-rows">${rows.map(r => {
          const page = r.entry.page || {};
          const pct = Math.max(2, Math.min(100, Number(page.percent) || 0));
          return `
          <button class="onq-ov-row ${r.key} ${consoleState.selected === r.entry.child ? "active" : ""}" type="button" data-coach="select" data-child="${esc(r.entry.child)}"
            title="${esc(nameOf(r.entry.child))} · ${esc(page.label || "")} · ${esc(r.text)}">
            <span class="onq-ov-name">${esc(nameOf(r.entry.child))}</span>
            <span class="onq-ov-track">${ticks}<b style="width:${pct}%"></b><em class="onq-ov-coach" style="left:${coachLeft}%"></em></span>
            <span class="onq-ov-tag">${esc(r.text)}</span>
          </button>`; }).join("")}</div>
        <p class="onq-ov-legend"><span class="k help"></span>도움 요청 <span class="k stuck"></span>멈춤·연달아 틀림 <span class="k behind"></span>뒤처짐 <span class="k coach"></span>선생님 단계</p>
      </section>`;
  }

  function coachToolsMarkup(learner) {
    const child = learner.child;
    const sent = consoleState.praiseCount[child] || 0;
    const memo = memoText(child);
    const state = consoleState.memoState[child] || "";
    return `
      <section class="onq-dock-section onq-tools">
        <h3>${esc(nameOf(child))}에게 칭찬 보내기${sent ? `<span class="onq-praise-sent">${sent}번 보냄</span>` : ""}</h3>
        <div class="onq-praise-pick">
          <input class="onq-praise-input" id="onqPraise" type="text" maxlength="40" autocomplete="off"
            data-coach-praise="${esc(child)}" value="${esc(consoleState.praiseDraft[child] || "")}"
            placeholder="골라 보내거나 직접 써요" aria-label="${esc(nameOf(child))}에게 보낼 칭찬">
          <button class="onq-praise-open" type="button" data-praise-open aria-label="칭찬 목록 열기" aria-expanded="false">▾</button>
          <button class="onq-praise-send" type="button" data-coach="praise-send">보내기</button>
          <ul class="onq-praise-menu" data-praise-menu hidden>${PRAISES.map(text => `<li><button type="button" data-praise-pick="${esc(text)}">${esc(text)}</button></li>`).join("")}</ul>
        </div>
        ${consoleState.praiseNote[child] ? `<p class="onq-tool-state ${/못/.test(consoleState.praiseNote[child]) ? "warn" : "ok"}">${esc(consoleState.praiseNote[child])}</p>` : ""}
        <label class="onq-memo-label" for="onqMemo">${esc(nameOf(child))} 관찰 메모 <small>보호자·아이에게 안 보여요</small></label>
        <textarea class="onq-memo" id="onqMemo" data-coach-memo="${esc(child)}" rows="3" maxlength="${MEMO_MAX}"
          placeholder="오늘 본 모습과 다음 수업에 줄 도움을 짧게 적어요">${esc(memo)}</textarea>
        <div class="onq-memo-row"><button class="onq-memo-btn" type="button" data-coach="memo-save">메모 저장</button>
          <span class="onq-tool-state ${/못|없음|권한/.test(state) ? "warn" : "ok"}">${esc(state)}</span></div>
      </section>`;
  }

  // 드롭다운에서 고르거나 직접 쓴 칭찬을 보낸다. 보내고 나면 칸을 비워 다음엔 목록이 다 보이게 한다.
  function sendPraiseDraft() {
    const l = currentLearner();
    if (!l) return;
    const field = consoleState.root && consoleState.root.querySelector("[data-coach-praise]");
    const text = compact(field ? field.value : consoleState.praiseDraft[l.child], 40);
    if (!text) { consoleState.praiseNote[l.child] = "칭찬을 고르거나 써 주세요 · 못 보냈어요"; renderConsole(true); return; }
    consoleState.praiseDraft[l.child] = "";
    sendPraise(l.child, text);
  }

  function sendPraise(child, text) {
    if (!child) return;
    consoleState.praise = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, to: child, text: compact(text, 40), at: new Date().toISOString() };
    const sentLive = live();
    sendNav(null);
    if (sentLive) consoleState.praiseCount[child] = (consoleState.praiseCount[child] || 0) + 1;
    const t = new Date();
    consoleState.praiseNote[child] = sentLive
      ? `「${compact(text, 40)}」 보냈어요 · ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`
      : "실시간 연결이 없어 보내지 못했어요";
    renderConsole(true);
  }

  // 코치 메모 — 플랫폼 「코치 메모 통로」(규격 12장): POST ONCUVATE.base + '__memo'. 학습 기록이 아니다.
  // 플랫폼 밖(로컬 확인)에서는 이 컴퓨터에만 남긴다.
  function saveMemo(child) {
    if (!child) return;
    const raw = memoText(child);
    const text = compact(raw, MEMO_MAX);
    try { localStorage.setItem(memoKey(child), raw); } catch (_) { /* 무시 */ }
    const stamp = () => { const t = new Date(); return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`; };
    if (!text) { consoleState.memoState[child] = "메모 내용이 없음"; renderConsole(true); return; }
    if (!injected || (localCheck && !injected.base)) { consoleState.memoState[child] = `이 컴퓨터에만 저장됨 · ${stamp()}`; renderConsole(true); return; }
    consoleState.memoState[child] = "저장하는 중…"; renderConsole(true);
    const base = typeof injected.base === "string" ? injected.base : "";
    fetch(base + "__memo", {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: child, sessionNo, text })
    }).then(response => {
      if (!response.ok) throw new Error(String(response.status));
      consoleState.memoState[child] = `저장됨 · ${stamp()} · 평가 화면에 함께 보여요`;
    }).catch(error => {
      consoleState.memoState[child] = String(error.message) === "403" ? "권한 없음 · 저장 못 했어요" : "저장 못 했어요 · 연결 확인";
    }).then(() => renderConsole(true));
  }

  function recentMarkup(learner) {
    const rows = (learner.events || []).map(entry => Object.assign({ entry }, eventText(entry) || {})).filter(row => row.text).slice(0, 6);
    return `
      <section class="onq-dock-section">
        <h3>최근 응답·도움 요청</h3>
        <div class="onq-events">${rows.length ? rows.map(row => `
          <div class="${row.cls}">${row.cls === "help" ? ICON.hand : ""}<b>${esc(row.text)}</b><time>${esc(ago(row.entry.at))}</time>${
            activityLabel(row.entry.activityId) ? `<small>${esc(activityLabel(row.entry.activityId))}</small>` : ""}</div>`).join("")
          : '<p class="onq-dock-empty">눈여겨볼 일이 아직 없어요</p>'}</div>
      </section>`;
  }

  function renderConsole(force) {
    if (!isCoach || !consoleState.root) return;
    // 메모를 쓰는 중에는 3초마다 다시 그리지 않는다 — 쓰던 글자가 날아간다.
    const typing = document.activeElement && document.activeElement.matches && document.activeElement.matches("[data-coach-memo], [data-coach-praise]");
    if (typing && !force) return;
    const body = consoleState.root.querySelector(".onq-dock-body");
    const scrolled = body ? body.scrollTop : 0;
    consoleState.root.innerHTML = consoleMarkup();
    const nextBody = consoleState.root.querySelector(".onq-dock-body");
    if (nextBody) nextBody.scrollTop = scrolled;
    root.dataset.coachDock = consoleState.open ? "open" : "closed";
    fitStudio();
  }

  // 콘솔을 편 채로 남는 폭이 900px보다 좁으면(예: 클래스인 987×521) 수업 화면을 다시 배치하지 않고
  // 학생 화면 그대로 줄여 보여 준다 — 좁은 폭에서 억지로 다시 흘리면 단추가 겹치기 때문이다.
  function fitStudio() {
    const studio = document.getElementById("studio");
    if (!studio) return;
    const dockW = parseFloat(getComputedStyle(root).getPropertyValue("--onq-dock-w")) || 340;
    const avail = window.innerWidth - dockW - 32;
    const natural = Math.min(1200, window.innerWidth);
    if (isCoach && consoleState.open && window.innerWidth >= 900 && avail < 900) {
      root.dataset.coachFit = "scale";
      root.style.setProperty("--onq-fit", String(Math.max(0.4, avail / natural)));
      root.style.setProperty("--onq-fit-w", `${natural}px`);
    } else {
      delete root.dataset.coachFit;
    }
  }

  function startResize(event) {
    const move = pointer => {
      const width = Math.round(window.innerWidth - pointer.clientX - 14);
      const max = Math.max(260, Math.min(560, window.innerWidth - 560));
      const w = Math.max(260, Math.min(max, width));
      root.style.setProperty("--onq-dock-w", `${w}px`);
      try { sessionStorage.setItem(storeKey("dock-w"), String(w)); } catch (_) { /* 무시 */ }
      window.dispatchEvent(new Event("resize"));
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


  // 칭찬 고르기 목록 — 브라우저 기본 드롭다운(datalist)은 수업 화면 배율 때문에 엉뚱한 자리에 떠서 콘솔 안에 직접 그린다(2026-10-11).
  // 목록을 여닫는 동안 입력칸 초점을 지켜서, 3초마다 다시 그리는 콘솔도 쓰는 중으로 보고 건드리지 않게 한다.
  function wirePraiseMenu(root) {
    const pickOf = node => node && node.closest && node.closest(".onq-praise-pick, .oc-praise-pick");
    const menuOf = node => { const box = pickOf(node); return box ? box.querySelector("[data-praise-menu]") : null; };
    const inputOf = node => { const box = pickOf(node); return box ? box.querySelector("[data-coach-praise], [data-praise-input]") : null; };
    const setOpen = (node, open) => {
      const menu = menuOf(node), box = pickOf(node);
      if (!menu) return;
      menu.hidden = !open;
      const toggle = box && box.querySelector("[data-praise-open]");
      if (toggle) toggle.setAttribute("aria-expanded", String(open));
    };
    root.addEventListener("mousedown", event => {
      if (event.target.closest && event.target.closest("[data-praise-pick], [data-praise-open]")) event.preventDefault();
    });
    root.addEventListener("click", event => {
      const toggle = event.target.closest && event.target.closest("[data-praise-open]");
      if (toggle) { const menu = menuOf(toggle); setOpen(toggle, Boolean(menu && menu.hidden)); const field = inputOf(toggle); if (field) field.focus(); return; }
      const pick = event.target.closest && event.target.closest("[data-praise-pick]");
      if (pick) {
        const field = inputOf(pick);
        if (field) { field.value = pick.dataset.praisePick; field.dispatchEvent(new Event("input", { bubbles: true })); field.focus(); }
        setOpen(pick, false);
      }
    });
    root.addEventListener("focusout", event => {
      const t = event.target;
      if (t && t.matches && t.matches("[data-coach-praise], [data-praise-input]")) setTimeout(() => setOpen(t, false), 150);
    });
    root.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      const menu = menuOf(event.target);
      if (menu && !menu.hidden) { setOpen(event.target, false); event.stopPropagation(); }
    }, true);
  }

  function mountConsole() {
    const dock = document.createElement("div");
    dock.className = "onq-coach-dock";
    document.body.append(dock);
    consoleState.root = dock;
    wirePraiseMenu(dock);

    // 좁은 화면(1100px 미만, 예: 클래스인 987×521)에서는 접힌 채로 시작한다 — 수업 화면이 먼저다.
    let savedOpen = null;
    try { savedOpen = sessionStorage.getItem(storeKey("dock-open")); } catch (_) { /* 무시 */ }
    consoleState.open = savedOpen ? savedOpen === "1" : window.innerWidth >= 1100;
    try {
      const w = Number(sessionStorage.getItem(storeKey("dock-w")));
      if (w >= 260 && w <= 560) root.style.setProperty("--onq-dock-w", `${w}px`);
      else if (window.innerWidth < 1200) root.style.setProperty("--onq-dock-w", "300px");
    } catch (_) { /* 무시 */ }

    const setOpen = open => {
      consoleState.open = open;
      try { sessionStorage.setItem(storeKey("dock-open"), open ? "1" : "0"); } catch (_) { /* 무시 */ }
      renderConsole();
      window.dispatchEvent(new Event("resize"));
    };

    dock.addEventListener("pointerdown", event => {
      if (event.target.closest('[data-coach="grip"]')) startResize(event);
    });
    dock.addEventListener("click", event => {
      const button = event.target.closest("[data-coach]");
      if (!button) return;
      const action = button.dataset.coach;
      if (action === "open") return setOpen(true);
      if (action === "close") return setOpen(false);
      if (action === "select") { consoleState.selected = button.dataset.child; renderConsole(true); return; }
      if (action === "praise") { const l = currentLearner(); if (l) sendPraise(l.child, button.dataset.text); return; }
      if (action === "praise-send") { sendPraiseDraft(); return; }
      if (action === "memo-save") { const l = currentLearner(); if (l) saveMemo(l.child); return; }
      if (action === "follow") {
        const learner = currentLearner();
        const target = learner && learner.page ? Number(learner.page.index) : NaN;
        if (Number.isFinite(target)) window.ONQ_GOTO(target - 1);
        return;
      }
      if (action === "prev") { window.ONQ_GOTO(activeIndex() - 1); return; }
      if (action === "next") { window.ONQ_GOTO(activeIndex() + 1); return; }
      if (action === "page-lock") {
        locks.pageLocked = !locks.pageLocked;
        sendNav(locks.pageLocked ? activeIndex() + 1 : null);   // 잠그는 순간 학생을 내 화면으로 데려온다
        renderConsole();
        return;
      }
      if (action === "activity-lock") {
        locks.activityLocked = !locks.activityLocked;
        sendNav(null);                                         // 활동 잠금은 화면 이동과 무관
        renderConsole();
      }
    });

    dock.addEventListener("keydown", event => {
      const field = event.target.closest && event.target.closest("[data-coach-praise]");
      if (field && event.key === "Enter" && !event.isComposing) { event.preventDefault(); sendPraiseDraft(); }
    });
    dock.addEventListener("input", event => {
      const praiseField = event.target.closest("[data-coach-praise]");
      if (praiseField) { consoleState.praiseDraft[praiseField.dataset.coachPraise] = praiseField.value; return; }
      const field = event.target.closest("[data-coach-memo]");
      if (!field) return;
      consoleState.memoDraft[field.dataset.coachMemo] = field.value;
      consoleState.memoState[field.dataset.coachMemo] = "쓰는 중";
    });
    dock.addEventListener("focusout", event => {
      const field = event.target.closest && event.target.closest("[data-coach-memo]");
      if (field) { try { localStorage.setItem(memoKey(field.dataset.coachMemo), field.value); } catch (_) { /* 무시 */ } }
    });

    window.addEventListener("resize", fitStudio);
    renderConsole();
    window.setInterval(renderConsole, 3000);
  }

  // ── 12. 아동 식별코드 워터마크 (흘러나갔을 때 어느 화면이었는지 남기는 표시) ──
  function mountWatermark() {
    if (isCoach || !childCode) return;
    const mark = document.createElement("div");
    mark.className = "onq-child-watermark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = childCode;
    document.body.append(mark);
  }

  // ── 13. 시작 ───────────────────────────────────────────────────────────
  saveLocks();
  if (isCoach) {
    mountConsole();
  } else {
    mountWatermark();
    document.addEventListener("visibilitychange", () => publishSoon("visibility"));
    window.setInterval(() => publish("heartbeat"), 10000);
    window.addEventListener("pagehide", () => {
      if (!live() || !childCode) return;
      const remove = bridged("_remove");
      try { if (remove) remove(bridged("pth")(`prog/${childCode}`)); } catch (_) { /* 무시 */ }
    });
  }

  if (!connect() && !solo) {
    // 플랫폼 실시간 연결이 늦게 준비돼도 놓치지 않도록, 연결될 때까지 계속 확인한다(예전엔 1분 뒤 포기했다).
    let tries = 0;
    const poll = window.setInterval(() => {
      tries += 1;
      if (connect()) window.clearInterval(poll);
    }, 500);
    window.addEventListener("oncuvate:pilot-realtime-ready", connect);
  }

  // 검수용 — 화면을 열지 않고 지금 상태를 본다.
  window.ONQ_COACH_MODE = Object.freeze({
    version: VERSION,
    role, room, childCode, solo,
    get live() { return live(); },
    get locks() { return Object.assign({}, locks); },
    snapshot: () => snapshot("qa"),
    learners: () => learnerList()
  });
})();
