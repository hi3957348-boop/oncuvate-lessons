(function () {
  "use strict";

  const runtime = window.ONCUVATE && typeof window.ONCUVATE === "object" ? window.ONCUVATE : {};
  const role = runtime.role === "coach" ? "coach" : "child";
  const room = String(runtime.room || "");
  const child = String(runtime.child || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12);
  const lessonId = document.documentElement.dataset.lessonId || "careful-reading";
  const pages = [...document.querySelectorAll(".page")];
  const stepLinks = [...document.querySelectorAll(".step-link")];
  const MAX_EVENTS = 12;
  let started = false;
  let locked = false;
  let answerCount = 0;
  let correctCount = 0;
  let hintCount = 0;
  let helpRequests = 0;
  let helpRequestedAt = 0;
  let done = false;
  let lastEvent = null;
  let publishTimer = 0;
  let dock = null;

  document.documentElement.dataset.oncuvateRole = role;
  document.documentElement.dataset.oncuvateMode = room ? "coaching" : "solo";

  function bridge(name) {
    if (typeof runtime[name] === "function") return runtime[name].bind(runtime);
    if (typeof window[name] === "function") return window[name].bind(window);
    return null;
  }

  function ready() {
    return Boolean(room && window._firebaseReady && bridge("pth") && bridge("_set") && bridge("_onValue"));
  }

  function activePageIndex() {
    const index = pages.findIndex(page => page.classList.contains("active"));
    return index < 0 ? 1 : index + 1;
  }

  function activeLabel() {
    const index = activePageIndex() - 1;
    return String(stepLinks[index]?.querySelector("b")?.textContent || `${index + 1}단계`).trim().slice(0, 40);
  }

  function compact(value, limit = 100) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function snapshot(reason) {
    return {
      child: child || "child",
      lessonId,
      page: activePageIndex(),
      pageTotal: pages.length,
      screenLabel: activeLabel(),
      activityId: pages[activePageIndex() - 1]?.dataset.activityId || "",
      reason,
      answers: answerCount,
      correct: correctCount,
      hints: hintCount,
      helpRequests,
      helpRequestedAt: helpRequestedAt || null,
      done,
      lastEvent,
      updatedAt: Date.now()
    };
  }

  function publish(reason = "update") {
    if (role === "coach" || !child || !ready()) return;
    const pth = bridge("pth");
    const setValue = bridge("_set");
    try {
      Promise.resolve(setValue(pth(`prog/${child}`), snapshot(reason))).catch(() => {});
    } catch (_) {}
  }

  function publishSoon(reason = "update") {
    clearTimeout(publishTimer);
    publishTimer = window.setTimeout(() => publish(reason), 100);
  }

  function navigateTo(page) {
    const index = Math.max(1, Math.min(Number(page) || 1, pages.length)) - 1;
    stepLinks[index]?.click();
  }

  function applyLock(nextLocked) {
    locked = Boolean(nextLocked);
    document.documentElement.dataset.coachPageLocked = String(locked);
    const controls = [...stepLinks, document.getElementById("backButton"), document.getElementById("nextButton")].filter(Boolean);
    controls.forEach(control => {
      if (locked && !control.disabled) {
        control.disabled = true;
        control.dataset.coachDisabled = "true";
      } else if (!locked && control.dataset.coachDisabled === "true") {
        control.disabled = false;
        delete control.dataset.coachDisabled;
      }
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function makeDock() {
    if (dock) return dock;
    dock = document.createElement("aside");
    dock.className = "oncuvate-coach-dock";
    dock.setAttribute("aria-label", "코치 연동");
    dock.innerHTML = `
      <button class="oncuvate-coach-tab" type="button" aria-expanded="true">코치 연동</button>
      <section class="oncuvate-coach-panel">
        <header><strong>실시간 수업</strong><small class="oncuvate-coach-status">${room ? "연결 준비 중" : "수업방 대기"}</small></header>
        <div class="oncuvate-coach-controls">
          <button type="button" data-coach-prev>이전</button>
          <button type="button" data-coach-next>다음</button>
          <button type="button" data-coach-lock aria-pressed="false">이동 잠금</button>
        </div>
        <p class="oncuvate-coach-screen">현재: <b>${escapeHtml(activeLabel())}</b></p>
        <ul class="oncuvate-coach-participants"><li>아직 들어온 학생이 없습니다.</li></ul>
      </section>`;
    document.body.append(dock);
    const panel = dock.querySelector(".oncuvate-coach-panel");
    const tab = dock.querySelector(".oncuvate-coach-tab");
    tab.addEventListener("click", () => {
      const open = !dock.classList.toggle("collapsed");
      tab.setAttribute("aria-expanded", String(open));
    });
    dock.querySelector("[data-coach-prev]").addEventListener("click", () => setCoachPage(activePageIndex() - 1));
    dock.querySelector("[data-coach-next]").addEventListener("click", () => setCoachPage(activePageIndex() + 1));
    dock.querySelector("[data-coach-lock]").addEventListener("click", event => {
      locked = !locked;
      event.currentTarget.setAttribute("aria-pressed", String(locked));
      event.currentTarget.textContent = locked ? "이동 잠금 해제" : "이동 잠금";
      writeNav();
    });
    return dock;
  }

  function setCoachPage(page) {
    navigateTo(page);
    writeNav();
  }

  function writeNav() {
    if (role !== "coach" || !ready()) return;
    const pth = bridge("pth");
    const setValue = bridge("_set");
    const payload = { page: activePageIndex(), locked, updatedAt: Date.now() };
    try {
      Promise.resolve(setValue(pth("nav"), payload)).catch(() => {});
    } catch (_) {}
    const label = dock?.querySelector(".oncuvate-coach-screen b");
    if (label) label.textContent = activeLabel();
  }

  function renderParticipants(map) {
    const list = dock?.querySelector(".oncuvate-coach-participants");
    if (!list) return;
    const rows = Object.entries(map || {})
      .filter(([, value]) => value && typeof value === "object")
      .sort((a, b) => Number(b[1].updatedAt || 0) - Number(a[1].updatedAt || 0));
    if (!rows.length) {
      list.innerHTML = "<li>아직 들어온 학생이 없습니다.</li>";
      return;
    }
    list.innerHTML = rows.map(([key, item]) => {
      const code = compact(item.child || key, 12);
      const page = Number(item.page || 1);
      const total = Number(item.pageTotal || pages.length);
      const answer = item.lastEvent?.type === "answer"
        ? `<small>최근 답: ${escapeHtml(item.lastEvent.response || "선택")}${typeof item.lastEvent.correct === "boolean" ? (item.lastEvent.correct ? " · 정답" : " · 다시 확인") : ""}</small>`
        : "";
      const help = item.helpRequestedAt ? "<strong class=\"oncuvate-help-flag\">도움 요청</strong>" : "";
      return `<li><div><b>${escapeHtml(code)}</b>${help}</div><span>${escapeHtml(item.screenLabel || "")} · ${page}/${total}</span>${answer}${item.done ? "<em>완료</em>" : ""}</li>`;
    }).join("");
  }

  function connect() {
    if (started || !ready()) return false;
    started = true;
    const pth = bridge("pth");
    const onValue = bridge("_onValue");
    if (role === "coach") {
      makeDock();
      const status = dock.querySelector(".oncuvate-coach-status");
      try {
        onValue(pth("prog"), snap => {
          const value = typeof snap?.val === "function" ? snap.val() : snap;
          renderParticipants(value && typeof value === "object" ? value : {});
          status.textContent = "연결됨";
        });
      } catch (_) {
        status.textContent = "연결 지연";
      }
      writeNav();
    } else {
      try {
        const disconnect = bridge("_onDisconnect");
        disconnect?.(pth(`prog/${child}`))?.remove?.();
      } catch (_) {}
      try {
        onValue(pth("nav"), snap => {
          const value = typeof snap?.val === "function" ? snap.val() : snap;
          if (!value || typeof value !== "object") return;
          if (Number(value.page) !== activePageIndex()) {
            applyLock(false);
            navigateTo(value.page);
          }
          applyLock(value.locked);
          publishSoon("coach-nav");
        });
      } catch (_) {}
      publish("join");
    }
    return true;
  }

  window.addEventListener("oncuvate:log", event => {
    const detail = event.detail && typeof event.detail === "object" ? event.detail : {};
    lastEvent = {
      type: compact(detail.type, 30),
      activityId: compact(detail.activityId, 60),
      itemId: compact(detail.itemId, 60),
      response: compact(detail.response ?? detail.value, 80),
      correct: typeof detail.correct === "boolean" ? detail.correct : null,
      at: Date.now()
    };
    if (detail.type === "answer") {
      answerCount += 1;
      if (detail.correct === true) correctCount += 1;
    }
    if (detail.type === "hint" || detail.type === "help") hintCount += 1;
    if (detail.type === "lesson-complete") done = true;
    if (role === "coach" && detail.type === "step-view") writeNav();
    publishSoon(detail.type || "event");
  });

  document.getElementById("helpButton")?.addEventListener("click", () => {
    if (role === "coach") return;
    helpRequests += 1;
    helpRequestedAt = Date.now();
    publishSoon("help-request");
  });

  if (role === "coach") makeDock();
  if (!connect() && room) {
    let tries = 0;
    const poll = window.setInterval(() => {
      tries += 1;
      if (connect() || tries > 240) window.clearInterval(poll);
    }, 250);
    window.addEventListener("oncuvate:pilot-realtime-ready", connect);
  }
}());
