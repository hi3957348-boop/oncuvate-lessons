/* Oncuvate coach console v2 — 회차 파일 안의 코치 도크.
 *
 * 같은 회차 파일을 코치·아이가 함께 연다. 역할은 oncuvate-role.js(=window.ONCUVATE.role)만 본다.
 *   coach → 왼쪽 수업화면(아이와 동일) + 오른쪽 이 콘솔
 *   child → 아무것도 만들지 않는다(콘솔 흔적 0)
 *
 * 통로: nav(잠금·화면, oncuvate-runtime-v1이 씀) · prog(아이 진행, 코치만 읽음)
 *       state/sharedGoal(공동 목표, 코치 씀·모두 읽음) · ONCUVATE.base+'__memo'(코치 메모)
 * 수업 본문이 document.body 를 통째로 다시 그리므로 콘솔은 <html> 바로 아래에 붙인다.
 */
(() => {
  "use strict";

  const gate = window.ONQ_ROLE || {};
  if (gate.role !== "coach") return;

  const runtime = window.ONQ_RUNTIME_V1 || null;
  const injected = window.ONCUVATE && typeof window.ONCUVATE === "object" ? window.ONCUVATE : null;
  const html = document.documentElement;
  const localPreview = Boolean(gate.local);
  const room = String(gate.room || "");
  const sessionNo = Number(String(injected?.session || html.dataset.session || 6).replace(/\D/g, "")) || 6;
  const folder = String(injected?.folder || html.dataset.lessonId || "lesson");
  const coachScoreEndpoint = "pilot-praise";   // 파일럿: 방의 praise 통로(window.ONQ_PILOT_PRAISE)
  const memoEndpoint = injected ? `${injected.base || ""}__memo` : "";
  const busKey = `onq.coach.bus.v1:${room}`;

  const model = {
    learners: new Map(), selected: "",
    goal: { current: 0, target: 2000 }
  };

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[char]);
  const compact = (value, max = 100) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const bridged = name => {
    if (injected && typeof injected[name] === "function") return injected[name].bind(injected);
    if (typeof window[name] === "function") return window[name].bind(window);
    return null;
  };
  const platformLive = () => Boolean(injected && room && window._firebaseReady && bridged("pth") && bridged("_set") && bridged("_onValue"));
  const transport = () => platformLive() ? "platform" : (localPreview && room ? "local" : "none");
  const nowIso = () => new Date().toISOString();
  const ssGet = key => { try { return sessionStorage.getItem(`${folder}:${key}`); } catch (_) { return null; } };
  const ssSet = (key, value) => { try { sessionStorage.setItem(`${folder}:${key}`, value); } catch (_) { /* 저장 못 해도 화면은 계속 */ } };

  /* ── 도크 틀 ─────────────────────────────────────────── */
  const dock = document.createElement("aside");
  dock.className = "oc-dock";
  dock.setAttribute("aria-label", "코치 콘솔");
  html.appendChild(dock);

  // 콘솔을 수업 카드에 맞춘다 — 높이 = 메뉴바·활동영역, 폭 = 메뉴바, 활동영역 오른쪽에 같은 간격(12).
  // 수업마다 카드 이름이 달라서 <html data-coach-app / data-coach-side / data-coach-main> 로 받는다.
  //   app  = 987×525 설계 틀(scale 되는 요소) — 없으면 도입화면으로 보고 콘솔을 숨긴다
  //   side = 메뉴바 카드, main = 활동영역 카드 — 없으면 app 테두리에 맞춘다
  const SEL = {
    app: html.dataset.coachApp || ".s6-app",
    side: html.dataset.coachSide || ".s6-app > .s6-side",
    main: html.dataset.coachMain || ".s6-app > .s6-main"
  };
  function syncDockBox() {
    const appNode = document.querySelector(SEL.app);
    const app = appNode?.getBoundingClientRect();
    // 도입(표지) 화면에는 수업 틀이 없다 → 콘솔을 숨긴다(구독·진행 수집은 계속).
    dock.hidden = !app || !app.height;
    if (dock.hidden) {
      dock.classList.remove("oc-dock--fit");
      ["top", "left", "width", "height"].forEach(key => dock.style.removeProperty(key));
      return;
    }
    const k = app.width / 987;
    const cards = [document.querySelector(SEL.side), document.querySelector(SEL.main)]
      .map(node => node?.getBoundingClientRect()).filter(rect => rect && rect.height > 0);
    const side = document.querySelector(SEL.side)?.getBoundingClientRect();
    const top = cards.length ? Math.min(...cards.map(rect => rect.top)) : app.top;
    const bottom = cards.length ? Math.max(...cards.map(rect => rect.bottom)) : app.bottom;
    const right = cards.length ? Math.max(...cards.map(rect => rect.right)) : app.right;
    dock.classList.add("oc-dock--fit");
    dock.style.top = `${Math.round(top)}px`;
    dock.style.height = `${Math.round(bottom - top)}px`;
    dock.style.left = `${Math.round(right + 12 * k)}px`;
    dock.style.width = `${Math.round(side && side.width ? side.width : 220 * k)}px`;
  }
  const syncSoon = () => requestAnimationFrame(syncDockBox);
  window.addEventListener("resize", syncSoon);
  new MutationObserver(syncSoon).observe(document.body, { childList: true });

  function setDockOpen(open) {
    html.dataset.coachDock = open ? "open" : "closed";
    ssSet("coach-dock", open ? "open" : "closed");
    const toggle = dock.querySelector("[data-dock-toggle]");
    if (toggle) { toggle.setAttribute("aria-expanded", String(open)); toggle.title = open ? "콘솔 접기" : "콘솔 펼치기"; }
    window.dispatchEvent(new Event("resize"));
  }

  /* ── 로컬 검토 버스(두 창) ───────────────────────────── */
  function busPost(message) {
    if (!localPreview || !room) return;
    try { new BroadcastChannel(`oncuvate-coach-v1:${room}`).postMessage(message); } catch (_) { /* storage 이벤트로 대신 */ }
    try {
      localStorage.setItem(busKey, JSON.stringify({ ...message, nonce: `${Date.now()}-${Math.random()}` }));
      localStorage.removeItem(busKey);
    } catch (_) { /* 파일 모드 제한 */ }
  }
  function busListen(handler) {
    try { new BroadcastChannel(`oncuvate-coach-v1:${room}`).addEventListener("message", event => handler(event.data)); } catch (_) { /* storage만 */ }
    window.addEventListener("storage", event => {
      if (event.key !== busKey || !event.newValue) return;
      try { handler(JSON.parse(event.newValue)); } catch (_) { /* 잘못된 메시지 무시 */ }
    });
  }

  function snapshotValue(snapshot) { return typeof snapshot?.val === "function" ? snapshot.val() : snapshot; }
  function subscribePath(path, callback) {
    if (!platformLive()) return false;
    try { bridged("_onValue")(bridged("pth")(path), snap => callback(snapshotValue(snap))); return true; }
    catch (_) { return false; }
  }

  function ago(value) {
    const stamp = new Date(value || 0).getTime();
    if (!stamp) return "시간 없음";
    const seconds = Math.max(0, Math.round((Date.now() - stamp) / 1000));
    if (seconds < 5) return "방금";
    if (seconds < 60) return `${seconds}초 전`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    return new Date(stamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  /* ── 참가자(prog 스냅샷 → 카드) ──────────────────────── */
  function normalizeLearner(key, raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const last = source.lastEvent && typeof source.lastEvent === "object" ? source.lastEvent : {};
    const pageIndex = Math.max(0, Number(source.page) || 0);
    const pageTotal = Math.max(pageIndex, Number(source.pageTotal) || 0);
    return {
      id: compact(source.child || key, 60),
      name: compact(source.childName || source.child || key, 40),   // 파일럿: 한글 닉네임
      pageIndex, pageTotal,
      pageLabel: pageIndex ? compact(source.screenLabel || `화면 ${pageIndex}`, 60) : "표지",
      activityLabel: compact(source.activityLabel || last.activityId || "활동 대기", 80),
      itemIndex: Math.max(0, Number(source.itemIndex) || 0),
      itemTotal: Math.max(0, Number(source.itemTotal) || 0),
      answers: Math.max(0, Number(source.answers) || 0),
      correct: Math.max(0, Number(source.correct) || 0),
      hints: Math.max(0, Number(source.hints) || 0),
      helpRequests: Math.max(0, Number(source.helpRequests) || 0),
      response: compact(last.response ?? "", 80),
      lastCorrect: typeof last.correct === "boolean" ? last.correct : null,
      helpLevel: compact(last.helpLevel || "", 8),
      needsHelp: last.type === "coach_support_needed" || last.type === "help-request",
      pageLocked: source.pageLocked === true,
      activityLocked: source.activityLocked === true,
      lastSeen: source.updatedAt || source.at || nowIso()
    };
  }
  const learnerArray = () => [...model.learners.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const selectedLearner = () => model.learners.get(model.selected) || learnerArray()[0] || null;

  // 파일럿: 참가자 상자 아래 칭찬 칸
  function praiseBox(learner) {
    return `<div class="oc-praise-box"><small><b>${esc(learner.name)}</b>에게 칭찬 보내기 · +50</small><div class="oc-praise-row"><button type="button" class="oc-praise" data-action="praise" data-praise="적극적인 발표">🙋 적극적인 발표</button><button type="button" class="oc-praise" data-action="praise" data-praise="친구 도와주기">🤝 친구 도와주기</button><button type="button" class="oc-praise" data-action="praise" data-praise="좋은 질문">💡 좋은 질문</button><button type="button" class="oc-praise" data-action="praise" data-praise="끝까지 도전">💪 끝까지 도전</button><button type="button" class="oc-praise" data-action="praise" data-praise="또박또박 읽기">📖 또박또박 읽기</button><button type="button" class="oc-praise" data-action="praise" data-praise="바른 자세·집중">🎯 바른 자세·집중</button></div><label class="oc-inline-memo"><span>빠른 메모</span><textarea maxlength="500" rows="2" data-inline-memo placeholder="관찰한 반응을 짧게 (아이에게 안 보임)">${esc((model.memoDraft || {})[learner.id] || "")}</textarea></label><div class="oc-inline-memo-row"><button type="button" class="oc-inline-save" data-action="inline-memo">메모 저장</button><span data-inline-memo-state>${esc((model.memoSaved || {})[learner.id] || "")}</span></div></div>`;
  }
  function participantMarkup(learner) {
    const pagePercent = learner.pageTotal ? Math.max(0, Math.min(100, Math.round(learner.pageIndex / learner.pageTotal * 100))) : 0;
    const age = Date.now() - new Date(learner.lastSeen || 0).getTime();
    const fresh = Number.isFinite(age) && age < 15000;
    const item = learner.itemTotal ? `${learner.itemIndex} / ${learner.itemTotal}` : "";
    const verdict = learner.lastCorrect === true ? " · 맞음" : learner.lastCorrect === false ? " · 다시 시도" : learner.helpLevel ? ` · 도움 ${learner.helpLevel}` : "";
    const coachPage = currentPage().page;
    const away = coachPage && learner.pageIndex && learner.pageIndex !== coachPage;
    return `<div class="oc-person-wrap${model.praiseFor === learner.id ? " open" : ""}"><button type="button" class="oc-person${learner.needsHelp ? " help" : ""}" data-select-child="${esc(learner.id)}" aria-current="${learner.id === model.selected}">
      <span class="oc-person-top"><strong>${esc(learner.name)}</strong>${learner.needsHelp ? `<em class="oc-flag">도움 요청</em>` : ""}<span class="${fresh ? "fresh" : ""}">${esc(ago(learner.lastSeen))}</span></span>
      <span class="oc-progress-line"><b>${esc(learner.pageLabel)}</b><span class="${away ? "away" : ""}">${learner.pageIndex || "-"} / ${learner.pageTotal || "-"}${away ? " · 코치와 다른 화면" : ""}</span></span>
      <span class="oc-person-track"><i style="width:${pagePercent}%"></i></span>
      <span class="oc-person-meta"><span>${esc(learner.activityLabel)}</span><span>${esc(item)}</span></span>
      <span class="oc-person-stats"><span>응답 <b>${learner.answers}</b></span><span>맞음 <b>${learner.correct}</b></span><span>힌트 <b>${learner.hints}</b></span><span>요청 <b>${learner.helpRequests}</b></span></span>
      <span class="oc-person-response">최근 응답: <b class="${learner.lastCorrect === false ? "wrong" : ""}">${esc(learner.response || "아직 없음")}${esc(verdict)}</b></span>
    </button>${model.praiseFor === learner.id ? praiseBox(learner) : ""}</div>`;
  }

  function emptyMessage() {
    if (transport() === "platform") return "아직 입장한 아이가 없습니다.<br>아이 화면이 진행을 보내면 여기에 나타납니다.";
    if (localPreview && !room) return "로컬 검토 중 · 방이 없습니다.<br>두 창을 이으려면 주소에 <code>?role=coach&amp;room=test</code>, 아이 창은 <code>?room=test&amp;child=A1</code>를 붙이세요.";
    if (localPreview) return "로컬 검토 중 · 같은 방(<code>" + esc(room) + "</code>)의 아이 창을 기다립니다.";
    return "수업방이 없습니다(수업개시 전 준비 화면).<br>수업이 시작되면 아이 진행이 여기에 나타납니다.";
  }

  function renderParticipants() {
    // 파일럿: 메모를 쓰는 중이면 다시 그리지 않음(쓰던 글 보존) — 입력칸을 벗어나면 그때 그림
    const typing = document.activeElement && document.activeElement.matches && document.activeElement.matches("[data-inline-memo]");
    if (typing) { model.renderPending = true; return; }
    const list = dock.querySelector("[data-participants]");
    const count = dock.querySelector("[data-participant-count]");
    if (!list || !count) return;
    const learners = learnerArray();
    count.textContent = `${learners.length}명`;
    list.innerHTML = learners.length ? learners.map(participantMarkup).join("") : `<p class="oc-empty">${emptyMessage()}</p>`;
    updateTargetFields();
    // 회차 활동(룰렛 빙고 순번 등)이 입장한 아이 명단을 쓸 수 있게 알린다.
    window.ONQ_COACH_LEARNERS = learners.map(learner => ({ id: learner.id, name: learner.name }));
    window.dispatchEvent(new CustomEvent("oncuvate:learners", { detail: window.ONQ_COACH_LEARNERS }));
  }

  function updateTargetFields() {
    const selected = selectedLearner();
    dock.querySelectorAll("[data-selected-name]").forEach(node => { node.textContent = selected?.name || "아이를 선택하세요"; });
    const scoreButton = dock.querySelector("[data-action='score-save']");
    if (scoreButton) scoreButton.disabled = !selected || !coachScoreEndpoint;
    const memoButton = dock.querySelector("[data-action='memo-save']");
    if (memoButton) memoButton.disabled = !selected;
  }

  function setState(kind, text, tone = "") {
    const node = dock.querySelector(`[data-${kind}-state]`);
    if (node) { node.textContent = text; node.dataset.kind = tone; }
  }

  /* ── 수업 제어(잠금은 런타임이 nav로 씀) ─────────────── */
  function currentPage() {
    try { const snap = runtime?.snapshot?.("coach-console") || {}; return { page: Number(snap.page) || 0, total: Number(snap.pageTotal) || 0, label: compact(snap.screenLabel || "", 40) }; }
    catch (_) { return { page: 0, total: 0, label: "" }; }
  }
  function renderPage() {
    const node = dock.querySelector("[data-coach-page]");
    if (!node) return;
    const { page, total, label } = currentPage();
    node.textContent = page ? `${page} / ${total}${label ? ` · ${label}` : ""}` : "표지";
  }
  function renderLocks() {
    const locks = runtime?.locks?.() || {};
    dock.querySelector("[data-action='page-lock']")?.setAttribute("aria-pressed", String(Boolean(locks.pageLocked)));
    dock.querySelector("[data-action='activity-lock']")?.setAttribute("aria-pressed", String(Boolean(locks.activityLocked)));
  }
  async function toggleLock(name) {
    if (!runtime) { setState("nav", "수업 런타임이 없어 잠금을 보낼 수 없음", "warn"); return; }
    const locks = runtime.locks();
    const next = !locks[name];
    if (name === "pageLocked") runtime.setPageLocked(next, { publish: false });
    else runtime.setActivityLocked(next, { publish: false });
    renderLocks();
    setState("nav", "보내는 중…");
    const sent = await runtime.writeNav(name);
    const mode = transport();
    if (mode === "platform") setState("nav", sent ? "아이 화면에 전달됨" : "서버 저장 실패 · 다시 눌러 주세요", sent ? "ok" : "warn");
    else if (mode === "local") setState("nav", "로컬 미리보기 창에 전달됨", "ok");
    else setState("nav", "수업방 없음 · 이 화면에서만 바뀜", "warn");
  }

  /* ── 공동 목표(state/sharedGoal) ─────────────────────── */
  function renderGoal() {
    const current = dock.querySelector("[data-goal-current]");
    const target = dock.querySelector("[data-goal-target]");
    const meter = dock.querySelector("[data-goal-meter]");
    if (current && document.activeElement !== current) current.value = String(model.goal.current);
    if (target && document.activeElement !== target) target.value = String(model.goal.target);
    if (meter) meter.style.width = `${Math.min(100, Math.round(model.goal.current / Math.max(1, model.goal.target) * 100))}%`;
  }
  async function saveGoal() {
    const current = Math.max(0, Number(dock.querySelector("[data-goal-current]")?.value) || 0);
    const target = Math.max(1, Number(dock.querySelector("[data-goal-target]")?.value) || 1);
    model.goal = { current, target, updatedAt: nowIso(), by: "coach" };
    renderGoal();
    const mode = transport();
    if (mode === "platform") {
      setState("goal", "저장 중…");
      try { await Promise.resolve(bridged("_set")(bridged("pth")("state/sharedGoal"), model.goal)); setState("goal", "아이 화면에 전달됨", "ok"); }
      catch (_) { setState("goal", "서버 저장 실패", "warn"); }
    } else if (mode === "local") {
      busPost({ source: "onq-coach", version: 2, type: "shared-goal", sentAt: nowIso(), payload: model.goal });
      setState("goal", "로컬 미리보기 창에 전달됨", "ok");
    } else setState("goal", "수업방 없음 · 전달되지 않음", "warn");
  }

  /* ── 코치 메모(__memo) · 개별 점수 ───────────────────── */
  // 파일럿: 메모 = 방 notes/<아이> 저장 + coach-note 로그(파일럿 relay가 메일로 보냄)
  async function savePilotNote(textRaw, box) {
    const learner = selectedLearner(); const text = compact(textRaw || "", 2000);
    const stateEl = box ? box.querySelector("[data-inline-memo-state]") : null;
    const say = (m, kind) => { if (stateEl) { stateEl.textContent = m; stateEl.className = kind || ""; } else setState("memo", m, kind); };
    if (!learner) return say("아이를 먼저 선택하세요", "warn");
    if (!text) return say("메모 내용을 입력하세요", "warn");
    window.dispatchEvent(new CustomEvent("oncuvate:log", { detail: { type: "coach-note", childId: learner.id, childName: learner.name, sessionNo, text } }));
    try {
      if (typeof window.ONQ_PILOT_NOTE === "function") await window.ONQ_PILOT_NOTE(learner.id, text);
      const t = new Date(); const stamp = `저장됨 · ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
      model.memoSaved = model.memoSaved || {}; model.memoSaved[learner.id] = stamp; model.memoDraft = model.memoDraft || {}; model.memoDraft[learner.id] = "";
      if (box) { const ta = box.querySelector("[data-inline-memo]"); if (ta) ta.value = ""; }
      say(stamp, "ok"); renderParticipants();   // 다시 그려도 「저장됨」이 남게(model.memoSaved)
    } catch (_) { say("저장 실패 · 메일 기록만 보냄", "warn"); }
  }
  async function saveMemo() {
    const learner = selectedLearner();
    const textarea = dock.querySelector("[data-memo]");
    const text = compact(textarea?.value || "", 2000);
    if (!learner) { setState("memo", "아이를 먼저 선택하세요", "warn"); return; }
    if (!text) { setState("memo", "메모 내용을 입력하세요", "warn"); return; }
    if (false) {
      ssSet(`coach-memo:${learner.id}`, text);
      setState("memo", "로컬 미리보기 저장 · 서버 기록 아님", "warn");
      return;
    }
    return savePilotNote(text, null);   // 파일럿: 방에 저장 + 메일 기록
    setState("memo", "서버 기록 중…");
    try {
      const response = await fetch(memoEndpoint, {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: learner.id, sessionNo, text })
      });
      if (!response.ok) throw new Error(String(response.status));
      setState("memo", "서버 기록됨 · 최종피드백 화면에 함께 보입니다", "ok");
    } catch (error) {
      setState("memo", String(error.message) === "403" ? "권한 없음 · 기록 실패" : "서버 기록 실패", "warn");
    }
  }

  async function saveScore() {
    const learner = selectedLearner();
    const delta = Number(dock.querySelector("[data-score-delta]")?.value);
    const reason = compact(dock.querySelector("[data-score-reason]")?.value || "", 160);
    if (!learner || !coachScoreEndpoint) return;
    if (!Number.isFinite(delta) || delta === 0) { setState("score", "0이 아닌 점수를 입력하세요", "warn"); return; }
    if (!reason) { setState("score", "점수 근거를 입력하세요", "warn"); return; }
    setState("score", "서버 기록 중…");
    try {
      if (typeof window.ONQ_PILOT_PRAISE !== "function") throw new Error("offline");
      const result = await window.ONQ_PILOT_PRAISE(learner.id, delta, reason);   // 파일럿: 학생 화면에 축포
      const total = Number.isFinite(Number(result.total)) ? Number(result.total) : null;
      const preview = dock.querySelector("[data-score-preview]");
      if (preview) preview.innerHTML = `<strong>${esc(learner.name)}</strong> ${delta > 0 ? "+" : ""}${delta}점 기록${total == null ? "" : ` · 누적 ${total}점`}`;
      dock.querySelector("[data-score-reason]").value = "";
      setState("score", "학생 화면에 칭찬을 보냈어요 🎉", "ok");
    } catch (error) {
      setState("score", String(error.message) === "403" ? "코치 권한 없음 · 기록 실패" : "칭찬을 보내지 못했어요 · 연결 확인", "warn");
    }
  }

  /* ── 그리기 ──────────────────────────────────────────── */
  function liveLabel() {
    const mode = transport();
    return mode === "platform" ? "서버 연동" : mode === "local" ? "로컬 검토" : room ? "서버 대기" : "방 없음";
  }

  function mount() {
    const endpointReady = Boolean(coachScoreEndpoint);
    dock.innerHTML = `<button type="button" class="oc-dock-tab" data-dock-toggle aria-expanded="true" aria-label="코치 콘솔 접기/펼치기"><span>›</span></button>
      <div class="oc-dock-inner">
      <header class="oc-console-head"><div><h1>코치 콘솔</h1><span class="oc-live" data-live>${liveLabel()}</span></div><p>${sessionNo}회차 · 아이 화면은 왼쪽과 같습니다. 잠금·진행·기록을 여기서 봅니다.</p></header>
      <div class="oc-console-body">
        <section class="oc-section"><h2>수업 제어 <small>내 화면 <span data-coach-page>—</span></small></h2><div class="oc-lock-grid">
          <button class="oc-toggle" type="button" data-action="page-lock" aria-pressed="false">🔒 페이지 잠금<span>아이를 내 화면에 고정</span></button>
          <button class="oc-toggle" type="button" data-action="activity-lock" aria-pressed="false">⏸ 활동 잠금<span>아이 조작 일시정지</span></button>
        </div><p class="oc-save-state" data-nav-state></p></section>
        <section class="oc-section"><h2>참가자 진행 <small data-participant-count>0명</small></h2><div class="oc-participants" data-participants></div></section>
        <section class="oc-section"><h2>공동 목표 <small>아이 화면에 보임</small></h2><div class="oc-inline">
          <label class="oc-field">현재 점수<input type="number" min="0" step="1" data-goal-current value="0"></label>
          <label class="oc-field">목표 점수<input type="number" min="1" step="1" data-goal-target value="2000"></label>
        </div><div class="oc-goal-meter"><i data-goal-meter></i></div><button class="oc-action secondary" type="button" data-action="goal-save">공동 목표 보내기</button><p class="oc-save-state" data-goal-state></p></section>
        <section class="oc-section"><h2>빠른 메모 <small data-selected-name>아이를 선택하세요</small></h2>
          <label class="oc-field">관찰 메모 (보호자·아이에게 안 보임)<textarea maxlength="2000" data-memo placeholder="관찰한 반응과 다음 수업 도움을 짧게 기록하세요."></textarea></label>
          <button class="oc-action" type="button" data-action="memo-save" disabled>메모 서버 저장</button><p class="oc-save-state" data-memo-state></p>
        </section>
        <section class="oc-section"><h2>개별 점수 <small data-selected-name>아이를 선택하세요</small></h2>
          <p class="oc-endpoint-note ready">칭찬을 누르면 바로 학생 화면에 축포와 점수가 떠요.</p><div class="oc-praise-row"><button type="button" class="oc-praise" data-action="praise" data-praise="적극적인 발표">🙋 적극적인 발표</button><button type="button" class="oc-praise" data-action="praise" data-praise="친구 도와주기">🤝 친구 도와주기</button><button type="button" class="oc-praise" data-action="praise" data-praise="좋은 질문">💡 좋은 질문</button><button type="button" class="oc-praise" data-action="praise" data-praise="끝까지 도전">💪 끝까지 도전</button><button type="button" class="oc-praise" data-action="praise" data-praise="또박또박 읽기">📖 또박또박 읽기</button><button type="button" class="oc-praise" data-action="praise" data-praise="바른 자세·집중">🎯 바른 자세·집중</button></div>
          <div class="oc-inline"><label class="oc-field">추가 점수<input type="number" step="1" data-score-delta value="50"></label><label class="oc-field">기록 근거<input type="text" maxlength="160" data-score-reason placeholder="예: 독립적으로 읽음"></label></div>
          <button class="oc-action" type="button" data-action="score-save" disabled>점수 기록</button><p class="oc-score-preview" data-score-preview>직접 쓰려면 점수·근거를 넣고 「점수 기록」.</p><p class="oc-save-state" data-score-state></p>
        </section>
      </div></div>`;
    renderLocks(); renderGoal(); renderParticipants(); renderPage();
  }

  function refreshLive() {
    const node = dock.querySelector("[data-live]");
    if (!node) return;
    node.textContent = liveLabel();
    node.dataset.live = String(transport() !== "none");
  }

  function receiveLocal(message) {
    if (!message || message.source !== "onq-student") return;
    if (message.type === "offline") {
      model.learners.delete(compact(message.payload?.child || message.clientId, 60)); renderParticipants(); return;
    }
    if (message.type !== "state" || !message.clientId) return;
    const learner = normalizeLearner(message.clientId, message.payload?.state || message.payload);
    model.learners.set(learner.id, learner);
    if (!model.selected) model.selected = learner.id;
    renderParticipants();
  }

  let subscribed = false;
  function subscribe() {
    if (subscribed) return;
    if (platformLive()) {
      subscribed = true;
      subscribePath("prog", value => {
        model.learners.clear();
        Object.entries(value && typeof value === "object" ? value : {}).forEach(([key, raw]) => {
          if (!raw || typeof raw !== "object") return;
          const learner = normalizeLearner(key, raw);
          model.learners.set(learner.id, learner);
        });
        if (!model.learners.has(model.selected)) model.selected = learnerArray()[0]?.id || "";
        renderParticipants();
      });
      subscribePath("state/sharedGoal", value => {
        if (!value || typeof value !== "object") return;
        model.goal.current = Math.max(0, Number(value.current) || 0);
        model.goal.target = Math.max(1, Number(value.target) || 2000);
        renderGoal();
      });
    } else if (localPreview && room) { subscribed = true; busListen(receiveLocal); }
    refreshLive();
  }

  /* ── 이벤트 ──────────────────────────────────────────── */
  dock.addEventListener("click", event => {
    if (event.target.closest("[data-dock-toggle]")) { setDockOpen(html.dataset.coachDock !== "open"); return; }
    const child = event.target.closest("[data-select-child]");
    if (child) { const id = child.dataset.selectChild; model.praiseFor = model.praiseFor === id ? null : id; model.selected = id; renderParticipants(); return; }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "page-lock") toggleLock("pageLocked");
    if (action === "activity-lock") toggleLock("activityLocked");
    if (action === "goal-save") saveGoal();
    if (action === "memo-save") saveMemo();
    if (action === "score-save") saveScore();
    if (action === "inline-memo") savePilotNote(button.closest(".oc-praise-box")?.querySelector("[data-inline-memo]")?.value || "", button.closest(".oc-praise-box"));
    // 파일럿: 칭찬 단추 = 근거 채우고 기본 점수(50)로 바로 보내기
    if (action === "praise") { const r = dock.querySelector("[data-score-reason]"); if (r) r.value = button.dataset.praise; const d = dock.querySelector("[data-score-delta]"); if (d && !(Number(d.value) > 0)) d.value = 50; saveScore(); }
  });

  dock.addEventListener("focusout", event => { if (event.target.matches && event.target.matches("[data-inline-memo]") && model.renderPending) { model.renderPending = false; setTimeout(renderParticipants, 0); } });
  dock.addEventListener("input", event => { if (event.target.matches("[data-inline-memo]")) { model.memoDraft = model.memoDraft || {}; model.memoDraft[model.selected] = event.target.value; }
    if (event.target.matches("[data-goal-current],[data-goal-target]")) {
      model.goal.current = Math.max(0, Number(dock.querySelector("[data-goal-current]")?.value) || 0);
      model.goal.target = Math.max(1, Number(dock.querySelector("[data-goal-target]")?.value) || 1);
      renderGoal();
    }
  });

  // 코치가 화면을 넘기면(런타임 step-view) 표시를 갱신한다.
  window.addEventListener("oncuvate:log", event => {
    const type = event.detail?.type;
    if (type === "step-view" || type === "class-control") { renderPage(); renderLocks(); renderParticipants(); }
  });
  window.addEventListener("oncuvate:runtime-ready", subscribe);
  window.addEventListener("oncuvate:realtime-ready", () => setTimeout(subscribe, 0));

  /* ── 시작 ────────────────────────────────────────────── */
  mount();
  setDockOpen(ssGet("coach-dock") !== "closed");
  subscribe();
  if (!subscribed && room) {
    let tries = 0;
    const poll = setInterval(() => { tries += 1; subscribe(); if (subscribed || tries >= 240) clearInterval(poll); }, 250);
  }
  setInterval(() => { renderParticipants(); refreshLive(); }, 5000); // 「n초 전」 갱신

  window.ONQ_COACH_CONSOLE_V1 = Object.freeze({
    version: 2, room, sessionNo,
    get transport() { return transport(); },
    get sharedGoal() { return { ...model.goal }; },
    learners: () => learnerArray().map(item => ({ ...item })),
    open: () => setDockOpen(true), close: () => setDockOpen(false)
  });
})();
