(function () {
  "use strict";

  var root = document.documentElement;
  var lesson = {
    lessonId: root.dataset.lessonId || "",
    title: root.dataset.lessonTitle || document.title || "",
    version: root.dataset.lessonVersion || "1.0.0"
  };
  if (!lesson.lessonId) return;

  var STATE_KEY = "oncuvate-progress:" + lesson.lessonId + ":" + lesson.version;
  var QUEUE_KEY = "oncuvate-progress-queue:v1";
  var trackedSelector = '[data-track="answer"],[data-track="hint"],[data-track="activity-complete"],[data-track="lesson-complete"]';
  var answerSelector = [
    "[data-choice]", "[data-answer]", "[data-correct]", "[role=option]",
    ".gtile", ".qword", ".quiz-option", ".answer-option", ".choice-option",
    ".particle-option", ".order-card", ".worksheet-option"
  ].join(",");
  var activityContainerSelector = [
    "[data-activity-id]", "[data-activity]", ".gboard", ".gstage", ".quiz-card",
    ".question-card", ".worksheet-item", ".activity-card", ".test-item",
    "fieldset", "[role=group]", "form"
  ].join(",");
  var activeStarted = document.visibilityState === "visible" ? Date.now() : 0;
  var flushTimer = 0;
  function apiUrl(path) {
    var base = String(window.ONCUVATE_API_BASE || "").replace(/\/+$/, "");
    return base ? base + path : path;
  }
  var state = readJson(STATE_KEY, {
    startedAt: new Date().toISOString(),
    activeMs: 0,
    completedActivityIds: [],
    correctActivityIds: [],
    attempts: 0,
    hints: 0,
    updatedAt: new Date().toISOString()
  });
  state.completedActivityIds = unique(state.completedActivityIds);
  state.correctActivityIds = unique(state.correctActivityIds);
  state.answers = state.answers && typeof state.answers === "object" ? state.answers : {};
  state.ui = state.ui && typeof state.ui === "object" ? state.ui : {};

  function readJson(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function unique(values) {
    return Array.from(new Set(Array.isArray(values) ? values : []));
  }

  function compactText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 240);
  }

  function hash(value) {
    var h = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function currentSession() {
    if (window.OcSession) return window.OcSession;
    try {
      return JSON.parse(sessionStorage.getItem("oncuvate-session") || "{}");
    } catch (_) {
      return {};
    }
  }

  function updateActiveTime() {
    if (activeStarted) {
      state.activeMs += Math.max(0, Date.now() - activeStarted);
      activeStarted = Date.now();
    }
  }

  function summary() {
    updateActiveTime();
    return {
      completedActivities: state.completedActivityIds.length,
      correctAnswers: state.correctActivityIds.length,
      attempts: Number(state.attempts || 0),
      hintsUsed: Number(state.hints || 0),
      totalActivitySeconds: Math.round(Number(state.activeMs || 0) / 1000)
    };
  }

  function persist() {
    updateActiveTime();
    captureUi();
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function captureUi() {
    var dots = Array.from(document.querySelectorAll("#dots > *"));
    var activeDot = dots.findIndex(function (dot) {
      return dot.classList.contains("on") ||
        dot.classList.contains("active") ||
        dot.getAttribute("aria-current") === "page";
    });
    if (activeDot >= 0) state.ui.pageIndex = activeDot;
    state.ui.hash = location.hash || "";
  }

  function restoreUi() {
    if (state.ui.hash && !location.hash) history.replaceState(null, "", location.pathname + location.search + state.ui.hash);
    if (Number.isInteger(state.ui.pageIndex)) {
      var dots = document.querySelectorAll("#dots > *");
      var dot = dots[state.ui.pageIndex];
      if (dot && typeof dot.click === "function") dot.click();
    }
    document.querySelectorAll('input[data-track="answer"],select[data-track="answer"],textarea[data-track="answer"]').forEach(function (element) {
      var saved = state.answers[element.dataset.activityId];
      if (saved == null) return;
      if (/^(radio|checkbox)$/i.test(element.type || "")) element.checked = choiceOf(element) === saved;
      else element.value = saved;
    });
  }

  function getQueue() {
    var queue = readJson(QUEUE_KEY, []);
    return Array.isArray(queue) ? queue : [];
  }

  function setQueue(queue) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-500))); } catch (_) {}
  }

  function setStatus(kind) {
    var status = document.getElementById("ocActivitySaveStatus");
    if (!status) return;
    var labels = {
      saved: "저장됨",
      saving: "저장 중",
      queued: "연결 후 저장 예정"
    };
    status.dataset.status = kind;
    status.querySelector(".oc-save-label").textContent = labels[kind] || labels.saved;
  }

  function queueEvent(type, activityId, detail) {
    if (!activityId) return;
    persist();
    var session = currentSession();
    var event = Object.assign({
      eventId: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2),
      occurredAt: new Date().toISOString(),
      lessonId: lesson.lessonId,
      lessonTitle: lesson.title,
      lessonVersion: lesson.version,
      activityId: activityId,
      type: type
    }, detail || {});
    var queue = getQueue();
    queue.push(event);
    setQueue(queue);
    setStatus(navigator.onLine ? "saving" : "queued");
    clearTimeout(flushTimer);
    flushTimer = window.setTimeout(flush, 280);
  }

  async function flush() {
    var queue = getQueue();
    if (!queue.length) {
      setStatus("saved");
      return;
    }
    if (!navigator.onLine) {
      setStatus("queued");
      return;
    }
    setStatus("saving");
    var batch = queue.filter(function (event) {
      return event.lessonId === lesson.lessonId;
    }).slice(0, 100);
    if (!batch.length) {
      setStatus("saved");
      return;
    }
    var session = currentSession();
    try {
      var response = await fetch(apiUrl("/activity-progress"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson: lesson,
          learner: {
            name: session.studentName || "",
            studentCode: session.roomCode || "",
            roomCode: session.roomCode || "",
            role: session.role || "student"
          },
          events: batch,
          state: Object.assign({}, state, { summary: summary() })
        })
      });
      if (!response.ok) throw new Error("save-failed");
      var accepted = new Set(batch.map(function (event) { return event.eventId; }));
      queue = queue.filter(function (event) { return !accepted.has(event.eventId); });
      setQueue(queue);
      setStatus(queue.length ? "saving" : "saved");
      if (queue.length) flushTimer = window.setTimeout(flush, 120);
    } catch (_) {
      setStatus("queued");
    }
  }

  function choiceOf(element) {
    return compactText(
      element.dataset.choice ||
      element.dataset.value ||
      element.value ||
      element.getAttribute("aria-label") ||
      element.textContent
    );
  }

  function contextFor(element) {
    return element.closest(activityContainerSelector) || element.parentElement || element;
  }

  function activityIdFor(element, kind) {
    if (element.dataset.activityId) return element.dataset.activityId;
    var context = contextFor(element);
    if (context.dataset.activityId) return context.dataset.activityId;
    var explicit = context.id || context.getAttribute("data-activity") || "";
    var signature = [
      lesson.lessonId, kind, explicit,
      compactText(context.getAttribute("aria-label")),
      compactText(context.textContent)
    ].join("|");
    var id = lesson.lessonId + ":" + kind + ":" + hash(signature);
    context.dataset.activityId = id;
    return id;
  }

  function makeKeyboardAccessible(element, label) {
    if (/^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(element.tagName)) return;
    if (!element.hasAttribute("role")) element.setAttribute("role", "button");
    if (!element.hasAttribute("tabindex")) element.tabIndex = 0;
    if (!element.hasAttribute("aria-label")) element.setAttribute("aria-label", label);
    if (!element.dataset.ocKeyboardBound) {
      element.dataset.ocKeyboardBound = "true";
      element.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          element.click();
        }
      });
    }
  }

  function looksLikeHint(element) {
    return element.matches('[data-track="hint"],[data-hint],.hint-button,#mHint,#aHint') ||
      /힌트/.test(compactText(element.textContent));
  }

  function looksLikeFinal(element) {
    return element.matches('[data-track="lesson-complete"]') ||
      /(수업|학습|최종)\s*완료/.test(compactText(element.textContent));
  }

  function looksLikeActivityComplete(element) {
    return element.matches('[data-track="activity-complete"],[data-complete]') ||
      /^(확인|채점|제출|활동 완료)$/.test(compactText(element.textContent));
  }

  function instrument(scope) {
    var base = scope && scope.querySelectorAll ? scope : document;
    var candidates = [];
    if (scope && scope.nodeType === 1) candidates.push(scope);
    candidates = candidates.concat(Array.from(base.querySelectorAll("button,input,select,[role=option]," + answerSelector)));

    candidates.forEach(function (element) {
      if (!(element instanceof HTMLElement)) return;
      var kind = "";
      if (looksLikeFinal(element)) kind = "lesson-complete";
      else if (looksLikeHint(element)) kind = "hint";
      else if (looksLikeActivityComplete(element)) kind = "activity-complete";
      else if (element.matches(answerSelector) || (
        /^(radio|checkbox|text)$/i.test(element.getAttribute("type") || "") &&
        contextFor(element).matches(activityContainerSelector)
      )) kind = "answer";
      if (!kind) return;

      element.dataset.track = kind;
      element.dataset.activityId = activityIdFor(element, kind === "lesson-complete" ? "lesson" : "activity");
      if (kind === "answer") {
        element.dataset.choice = choiceOf(element);
        makeKeyboardAccessible(element, "답 선택: " + element.dataset.choice);
      } else if (kind === "hint") {
        makeKeyboardAccessible(element, "힌트 보기");
      } else if (kind === "activity-complete") {
        makeKeyboardAccessible(element, "활동 완료 확인");
      } else {
        makeKeyboardAccessible(element, "수업 완료 및 결과 확인");
      }
    });
  }

  function isCorrect(element) {
    if (element.dataset.correct === "true" || element.getAttribute("aria-checked") === "true") return true;
    if (element.dataset.correct === "false" || element.dataset.trap === "1") return false;
    if (element.classList.contains("correct") || element.classList.contains("gok") || element.classList.contains("ok")) return true;
    var context = contextFor(element);
    var feedback = context.querySelector(".gfeedback,.feedback,[role=status],.result");
    return !!feedback && /정답|잘했|맞았|완료/.test(compactText(feedback.textContent)) &&
      !/오답|다시|아쉬|틀렸/.test(compactText(feedback.textContent));
  }

  function addCompleted(activityId) {
    if (state.completedActivityIds.indexOf(activityId) < 0) state.completedActivityIds.push(activityId);
  }

  function addCorrect(activityId) {
    if (state.correctActivityIds.indexOf(activityId) < 0) state.correctActivityIds.push(activityId);
  }

  function onTrackedActivation(element) {
    var activityId = element.dataset.activityId || activityIdFor(element, "activity");
    var type = element.dataset.track;
    if (type === "answer") {
      state.attempts = Number(state.attempts || 0) + 1;
      var choice = choiceOf(element);
      element.dataset.choice = choice;
      state.answers[activityId] = choice;
      window.setTimeout(function () {
        var correct = isCorrect(element);
        if (correct) {
          addCorrect(activityId);
          addCompleted(activityId);
        }
        queueEvent("answer", activityId, { choice: choice, correct: correct });
      }, 180);
    } else if (type === "hint") {
      state.hints = Number(state.hints || 0) + 1;
      queueEvent("hint", activityId, { choice: "" });
    } else if (type === "activity-complete") {
      window.setTimeout(function () {
        var correct = isCorrect(element);
        addCompleted(activityId);
        if (correct) addCorrect(activityId);
        queueEvent("activity-complete", activityId, { choice: "", correct: correct });
      }, 180);
    } else if (type === "lesson-complete") {
      queueEvent("lesson-complete", activityId, { choice: "", summary: summary() });
      showSummary();
    }
  }

  function formatDuration(seconds) {
    var minutes = Math.floor(seconds / 60);
    var rest = seconds % 60;
    return minutes + "분 " + rest + "초";
  }

  function showSummary() {
    var values = summary();
    var old = document.getElementById("ocActivitySummary");
    if (old) old.remove();
    var dialog = document.createElement("div");
    dialog.id = "ocActivitySummary";
    dialog.className = "oc-activity-summary";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "ocActivitySummaryTitle");
    dialog.innerHTML =
      '<div class="oc-summary-card">' +
        '<button type="button" class="oc-summary-close" aria-label="결과 창 닫기">×</button>' +
        '<p class="oc-summary-kicker">오늘의 읽기 기록</p>' +
        '<h2 id="ocActivitySummaryTitle">수업을 완료했어요!</h2>' +
        '<dl>' +
          '<div><dt>완료한 활동</dt><dd>' + values.completedActivities + '개</dd></div>' +
          '<div><dt>정답</dt><dd>' + values.correctAnswers + '개</dd></div>' +
          '<div><dt>시도</dt><dd>' + values.attempts + '회</dd></div>' +
          '<div><dt>힌트</dt><dd>' + values.hintsUsed + '회</dd></div>' +
          '<div><dt>활동 시간</dt><dd>' + formatDuration(values.totalActivitySeconds) + '</dd></div>' +
        '</dl>' +
        '<button type="button" class="oc-summary-confirm">확인</button>' +
      '</div>';
    document.body.appendChild(dialog);
    var close = function () { dialog.remove(); };
    dialog.querySelector(".oc-summary-close").addEventListener("click", close);
    dialog.querySelector(".oc-summary-confirm").addEventListener("click", close);
    dialog.addEventListener("click", function (event) { if (event.target === dialog) close(); });
    dialog.querySelector(".oc-summary-confirm").focus();
  }

  function createStatusArea() {
    if (document.getElementById("ocActivitySaveStatus")) return;
    var panel = document.createElement("aside");
    panel.id = "ocActivitySaveStatus";
    panel.className = "oc-save-status";
    panel.dataset.status = getQueue().length ? "queued" : "saved";
    panel.setAttribute("aria-label", "학습 기록 저장 상태");
    panel.innerHTML =
      '<span class="oc-save-dot" aria-hidden="true"></span>' +
      '<span class="oc-save-label" role="status" aria-live="polite">' +
        (getQueue().length ? "연결 후 저장 예정" : "저장됨") +
      '</span>' +
      '<button type="button" class="oc-lesson-complete" data-track="lesson-complete">수업 완료</button>';
    document.body.appendChild(panel);
  }

  function addStyles() {
    if (document.getElementById("ocActivityTrackerStyles")) return;
    var style = document.createElement("style");
    style.id = "ocActivityTrackerStyles";
    style.textContent =
      ".oc-save-status{position:fixed;left:14px;bottom:14px;z-index:2147483000;display:flex;align-items:center;gap:8px;padding:8px 9px 8px 12px;border:1px solid #ded7f4;border-radius:999px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(49,31,92,.14);font:700 12px/1.2 Pretendard,'Noto Sans KR',sans-serif;color:#554a70}" +
      ".oc-save-dot{width:8px;height:8px;border-radius:50%;background:#43a57b}.oc-save-status[data-status=saving] .oc-save-dot{background:#7d55d9;animation:ocSavePulse 1s infinite}.oc-save-status[data-status=queued] .oc-save-dot{background:#d28b34}" +
      ".oc-lesson-complete{border:0;border-radius:999px;background:#5b31b5;color:#fff;padding:7px 11px;font:800 12px/1 Pretendard,'Noto Sans KR',sans-serif;cursor:pointer}.oc-lesson-complete:focus-visible,.oc-summary-card button:focus-visible,[data-track]:focus-visible{outline:3px solid #56c9df;outline-offset:3px}" +
      ".oc-activity-summary{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:20px;background:rgba(31,22,55,.48)}.oc-summary-card{position:relative;width:min(430px,100%);padding:30px;border-radius:28px;background:#fff;box-shadow:0 28px 70px rgba(35,18,76,.3);color:#2f2350;font-family:Pretendard,'Noto Sans KR',sans-serif}.oc-summary-kicker{margin:0 0 6px;color:#6e46c7;font-size:13px;font-weight:800}.oc-summary-card h2{margin:0 0 20px;font-size:25px}.oc-summary-card dl{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:0 0 22px}.oc-summary-card dl div{padding:13px;border-radius:16px;background:#f6f2ff}.oc-summary-card dt{font-size:12px;color:#746985}.oc-summary-card dd{margin:4px 0 0;font-size:19px;font-weight:900}.oc-summary-close{position:absolute;right:16px;top:14px;border:0;background:transparent;font-size:27px;color:#726786;cursor:pointer}.oc-summary-confirm{width:100%;border:0;border-radius:14px;background:#5b31b5;color:#fff;padding:13px;font-size:15px;font-weight:900;cursor:pointer}" +
      "@keyframes ocSavePulse{50%{opacity:.35;transform:scale(.8)}}@media(max-width:640px){.oc-save-status{left:8px;bottom:8px}.oc-save-label{max-width:105px}.oc-summary-card dl{grid-template-columns:1fr 1fr}}" +
      "@media(prefers-reduced-motion:reduce){.oc-save-status[data-status=saving] .oc-save-dot{animation:none}}";
    document.head.appendChild(style);
  }

  document.addEventListener("click", function (event) {
    var element = event.target.closest(trackedSelector);
    if (element) onTrackedActivation(element);
  }, true);

  document.addEventListener("change", function (event) {
    var element = event.target.closest('[data-track="answer"]');
    if (element && !/^(button|a)$/i.test(element.tagName)) onTrackedActivation(element);
  }, true);

  window.addEventListener("oncuvate:track", function (event) {
    var detail = event.detail || {};
    var activityId = String(detail.activityId || "");
    if (!activityId) return;
    if (detail.type === "answer") {
      state.attempts += 1;
      if (detail.correct) {
        addCorrect(activityId);
        addCompleted(activityId);
      }
    } else if (detail.type === "hint") {
      state.hints += 1;
    } else if (detail.type === "activity-complete") {
      addCompleted(activityId);
    }
    queueEvent(detail.type || "activity", activityId, detail);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") activeStarted = Date.now();
    else {
      updateActiveTime();
      activeStarted = 0;
      persist();
    }
  });
  window.addEventListener("online", flush);
  window.addEventListener("offline", function () { setStatus("queued"); });
  window.addEventListener("pagehide", persist);
  window.addEventListener("oncuvate-session-change", flush);

  function start() {
    addStyles();
    createStatusArea();
    instrument(document);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) instrument(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
    window.setTimeout(restoreUi, 700);
    window.setInterval(persist, 15000);
    flush();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
