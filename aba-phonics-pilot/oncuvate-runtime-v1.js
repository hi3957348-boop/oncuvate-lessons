/* Oncuvate phonics runtime v1
 *
 * Platform contract:
 *   window.ONCUVATE = { role, room, session, child, folder }
 *   window.pth / _set / _onValue / _remove / _onDisconnect
 *
 * The lesson remains fully usable when the platform bridge is absent.  Review
 * and file:// modes intentionally never disable lesson navigation.
 */
(function (global) {
  "use strict";

  if (!global || !global.document || global.ONQ_RUNTIME_V1) return;

  var document = global.document;
  var hasInjected = Boolean(global.ONCUVATE && typeof global.ONCUVATE === "object");
  var injected = hasInjected ? global.ONCUVATE : {};
  var gate = global.ONQ_ROLE || {};
  // 주소 값은 로컬 검토에서만 읽는다(oncuvate-role.js). 플랫폼에서는 ONCUVATE만.
  var query = new URLSearchParams(gate.local && global.location && global.location.search || "");
  var role = gate.role === "coach" ? "coach" : (injected.role === "coach" ? "coach" : "child");
  var room = compact(gate.room || injected.room, 80);
  var child = compact(gate.child || injected.child, 32).replace(/[^a-zA-Z0-9_-]/g, "");
  var session = compact(injected.session || document.documentElement.dataset.session || "1", 24);
  var folder = compact(injected.folder || document.documentElement.dataset.lessonId || "ogkr-digraph", 80);
  var reviewMode = Boolean(
    injected.review === true ||
    injected.mode === "review" ||
    query.get("review") === "1" ||
    query.get("mode") === "review" ||
    (global.location && global.location.protocol === "file:" && query.get("review") !== "0")
  );
  var localPreview = Boolean(global.location && (global.location.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(global.location.hostname || "")));
  var storageKey = "onq-runtime-v1:" + folder + ":" + session + ":" + (room || "solo");
  var selectors = {
    page: "[data-page]",
    previous: "[data-prev]",
    next: "[data-next]",
    group: "[data-menu-group]",
    stage: "#s6Stage",
    activity: ".s6-activity",
    count: ".s6-count"
  };
  var locks = { pageLocked: false, activityLocked: false, revision: 0, updatedAt: 0 };
  var progressExtra = {};
  var counters = { answers: 0, correct: 0, hints: 0, helpRequests: 0 };
  var joinedAt = Date.now();
  var lastEvent = null;
  var lastPage = null;
  var lastNavRevision = -1;
  var lastNavFingerprint = "";
  var localRevision = readStoredRevision();
  var progressRevision = 0;
  var connected = false;
  var connecting = false;
  var publishTimer = 0;
  var mutationTimer = 0;
  var internalNavigation = 0;
  var applyingRemote = false;
  var suppressCoachWriteUntil = 0;
  var disconnectRegistration = null;
  var navUnsubscribe = null;
  var goalUnsubscribe = null;
  var sharedUnsubscribes = Object.create(null);
  var sharedListeners = Object.create(null);
  var sharedValues = Object.create(null);
  var localListening = false;
  var localChannel = null;
  var observer = null;
  var originalProgress = typeof global.ONQ_PROGRESS === "function" ? global.ONQ_PROGRESS : null;
  var originalGoto = typeof global.ONQ_GOTO === "function" ? global.ONQ_GOTO : null;

  function compact(value, limit) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, limit || 120);
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function bridge(name) {
    if (typeof injected[name] === "function") return injected[name].bind(injected);
    if (typeof global[name] === "function") return global[name].bind(global);
    return null;
  }

  function bridgeReady() {
    return Boolean(
      room && global._firebaseReady === true && bridge("pth") &&
      bridge("_set") && bridge("_onValue")
    );
  }

  function localBusPost(message) {
    if (!localPreview || !room) return false;
    var key = "onq.coach.bus.v1:" + room;
    if (!localChannel && typeof global.BroadcastChannel === "function") {
      try { localChannel = new global.BroadcastChannel("oncuvate-coach-v1:" + room); } catch (_) { localChannel = null; }
    }
    try { if (localChannel) localChannel.postMessage(message); } catch (_) { /* storage fallback remains */ }
    try {
      global.localStorage.setItem(key, JSON.stringify(Object.assign({}, message, { nonce: Date.now() + "-" + Math.random() })));
      global.localStorage.removeItem(key);
    } catch (_) { /* file preview may restrict storage */ }
    return true;
  }

  function localBusListen(handler) {
    if (!localPreview || !room || localListening) return false;
    localListening = true;
    if (!localChannel && typeof global.BroadcastChannel === "function") {
      try { localChannel = new global.BroadcastChannel("oncuvate-coach-v1:" + room); } catch (_) { localChannel = null; }
    }
    if (localChannel) localChannel.addEventListener("message", function (event) { handler(event.data); });
    global.addEventListener("storage", function (event) {
      if (event.key !== "onq.coach.bus.v1:" + room || !event.newValue) return;
      try { handler(JSON.parse(event.newValue)); } catch (_) { /* malformed local preview payload */ }
    });
    return true;
  }

  function snapshotValue(snapshot) {
    return snapshot && typeof snapshot.val === "function" ? snapshot.val() : snapshot;
  }

  function safeSessionGet(key) {
    try { return global.sessionStorage && global.sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSessionSet(key, value) {
    try { if (global.sessionStorage) global.sessionStorage.setItem(key, value); } catch (_) { /* file mode can reject storage */ }
  }

  function readStoredRevision() {
    return Math.max(0, number(safeSessionGet(storageKey + ":revision"), 0));
  }

  function nextRevision() {
    localRevision = Math.max(Date.now(), localRevision + 1, lastNavRevision + 1);
    safeSessionSet(storageKey + ":revision", String(localRevision));
    return localRevision;
  }

  function eventPayload(type, detail) {
    var source = detail && typeof detail === "object" ? detail : {};
    var payload = Object.assign({}, source);
    payload.type = compact(type || source.type || source.event_type || "event", 48);
    payload.event_type = compact(source.event_type || payload.type, 48);
    payload.schemaVersion = compact(source.schemaVersion || "1.0", 12);
    payload.sessionNo = source.sessionNo != null ? source.sessionNo : session;
    payload.contentId = compact(source.contentId || folder, 100);
    payload.role = source.role || role;
    payload.childId = source.childId || child || null;
    payload.at = source.at || new Date().toISOString();
    payload.eventId = source.eventId || ("s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    return payload;
  }

  function dispatch(name, payload) {
    try { global.dispatchEvent(new CustomEvent(name, { detail: payload })); } catch (_) { /* old webviews */ }
    return payload;
  }

  function emit(type, detail) {
    return dispatch("oncuvate:event", eventPayload(type, detail));
  }

  function log(type, detail) {
    return dispatch("oncuvate:log", eventPayload(type, detail));
  }

  function record(type, detail) {
    var payload = eventPayload(type, detail);
    dispatch("oncuvate:event", payload);
    dispatch("oncuvate:log", payload);
    return payload;
  }

  function sharedTopic(topic) {
    return compact(topic, 48).replace(/[^a-zA-Z0-9_-]/g, "");
  }

  function applyShared(topic, snapshot) {
    var key = sharedTopic(topic);
    if (!key) return null;
    var payload = snapshotValue(snapshot);
    var value = payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "value") ? payload.value : payload;
    if (value == null) delete sharedValues[key];else sharedValues[key] = value;
    var meta = {
      topic: key,
      updatedAt: payload && number(payload.updatedAt, 0) || Date.now(),
      sharedBy: payload && compact(payload.childId || payload.sharedBy || "", 32) || null
    };
    dispatch("oncuvate:shared-state", { topic: key, value: value == null ? null : value, meta: meta });
    (sharedListeners[key] || []).slice().forEach(function (listener) {
      try { listener(value == null ? null : value, meta); } catch (_) { /* subscriber errors stay isolated */ }
    });
    return value == null ? null : value;
  }

  function subscribeShared(topic) {
    var key = sharedTopic(topic);
    if (!key || sharedUnsubscribes[key] || !bridgeReady()) return false;
    var onValue = bridge("_onValue"), pth = bridge("pth");
    if (!onValue || !pth) return false;
    try {
      sharedUnsubscribes[key] = onValue(pth("state/shared/" + key), function (snapshot) { applyShared(key, snapshot); });
      return true;
    } catch (_) { return false; }
  }

  function share(topic, value) {
    var key = sharedTopic(topic);
    if (!key) return Promise.resolve(false);
    var payload = { value: value == null ? null : value, updatedAt: Date.now(), childId: child || null, role: role };
    applyShared(key, payload);
    if (!bridgeReady()) {
      if (localPreview && room) localBusPost({ source: "onq-share", version: 1, type: "shared-state", payload: { topic: key, value: payload } });
      return Promise.resolve(Boolean(localPreview && room));
    }
    try { return Promise.resolve(bridge("_set")(bridge("pth")("state/shared/" + key), payload)).then(function () { return true; }).catch(function () { return false; }); }
    catch (_) { return Promise.resolve(false); }
  }

  function onShared(topic, listener) {
    var key = sharedTopic(topic);
    if (!key || typeof listener !== "function") return function () {};
    sharedListeners[key] = sharedListeners[key] || [];
    sharedListeners[key].push(listener);
    subscribeShared(key);
    if (Object.prototype.hasOwnProperty.call(sharedValues, key)) {
      try { listener(sharedValues[key], { topic: key, updatedAt: Date.now(), sharedBy: null }); } catch (_) { /* subscriber errors stay isolated */ }
    }
    return function () {
      var list = sharedListeners[key] || [], index = list.indexOf(listener);
      if (index >= 0) list.splice(index, 1);
    };
  }

  function uniquePageControls() {
    return Array.from(document.querySelectorAll(selectors.page));
  }

  function countFromFooter() {
    var node = document.querySelector(selectors.count);
    var match = compact(node && node.textContent, 30).match(/(\d+)\s*\/\s*(\d+)/);
    return match ? { page: Number(match[1]), total: Number(match[2]) } : null;
  }

  function currentPageMeta() {
    var footer = countFromFooter();
    var active = document.querySelector(selectors.page + ".active,[data-page][aria-current='page']");
    var page = footer ? footer.page : active ? number(active.dataset.page, 0) + 1 : 0;
    var total = footer ? footer.total : uniquePageControls().length;
    var label = active ? compact(active.textContent, 80) : "";
    var instruction = document.querySelector(".s6-activity-instruction,.s6-main > header .s6-phase");
    if (!label) label = page ? compact(instruction && instruction.textContent, 80) || (page + "페이지") : "표지";
    var activityNode = document.querySelector("[data-activity-id]");
    var pageId = active && compact(active.dataset.pageId || active.dataset.view, 80);
    if (!pageId) pageId = page ? (document.documentElement.dataset.lessonId || "lesson") + "-page-" + page : "cover";
    return {
      page: page,
      pageIndex: page ? page - 1 : -1,
      pageTotal: total,
      pageId: pageId,
      activityId: compact(activityNode && activityNode.dataset.activityId || pageId, 100),
      activityLabel: compact(activityNode && activityNode.dataset.activityLabel || label, 100),
      itemId: compact(activityNode && activityNode.dataset.itemId || "", 100),
      itemIndex: Math.max(0, number(activityNode && activityNode.dataset.itemIndex, 0)),
      itemTotal: Math.max(0, number(activityNode && activityNode.dataset.itemTotal, 0)),
      screenLabel: label
    };
  }

  function runtimeSnapshot(reason) {
    var base = {};
    if (originalProgress) {
      try { base = originalProgress() || {}; } catch (_) { base = {}; }
    }
    var meta = currentPageMeta();
    return Object.assign({}, base, progressExtra, meta, counters, {
      child: child || null,
      session: session,
      folder: folder,
      role: role,
      reason: compact(reason || progressExtra.reason || "snapshot", 48),
      pageLocked: locks.pageLocked,
      activityLocked: locks.activityLocked,
      reviewMode: reviewMode,
      connected: connected,
      joinedAt: joinedAt,
      lastEvent: lastEvent,
      revision: progressRevision,
      updatedAt: Date.now()
    });
  }

  function publish(reason) {
    if (role === "coach" || !child) return Promise.resolve(false);
    progressRevision = Math.max(Date.now(), progressRevision + 1);
    var payload = runtimeSnapshot(reason || "update");
    if (!bridgeReady()) {
      if (localPreview && room) {
        localBusPost({ source: "onq-student", version: 2, type: "state", clientId: child, sentAt: new Date().toISOString(), payload: { state: payload } });
        document.documentElement.dataset.oncuvateConnected = "local";
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }
    var pth = bridge("pth");
    var setValue = bridge("_set");
    try {
      return Promise.resolve(setValue(pth("prog/" + child), payload)).then(function () {
        document.documentElement.dataset.oncuvateConnected = "true";
        return true;
      }).catch(function () {
        document.documentElement.dataset.oncuvateConnected = "delayed";
        return false;
      });
    } catch (_) {
      document.documentElement.dataset.oncuvateConnected = "delayed";
      return Promise.resolve(false);
    }
  }

  function publishSoon(reason, delay) {
    global.clearTimeout(publishTimer);
    publishTimer = global.setTimeout(function () { publish(reason); }, delay == null ? 90 : delay);
  }

  function progressApi(update) {
    if (update && typeof update === "object") {
      progressExtra = Object.assign({}, progressExtra, update);
      publishSoon(compact(update.reason || "api-update", 48));
    } else if (typeof update === "string") {
      publishSoon(update);
    }
    return runtimeSnapshot(typeof update === "string" ? update : "snapshot");
  }
  progressApi.publish = publish;
  progressApi.publishSoon = publishSoon;
  progressApi.set = function (patch) { return progressApi(patch); };
  progressApi.snapshot = runtimeSnapshot;

  function withInternalNavigation(action) {
    internalNavigation += 1;
    try { return action(); } finally {
      global.setTimeout(function () { internalNavigation = Math.max(0, internalNavigation - 1); }, 0);
    }
  }

  function startLessonIfNeeded() {
    var start = document.querySelector("[data-cover-start]");
    if (!start) return false;
    withInternalNavigation(function () { start.click(); });
    return true;
  }

  function navigateByButtons(targetPage) {
    var guard = 0;
    while (guard++ < 40) {
      var meta = currentPageMeta();
      if (meta.page === targetPage) return true;
      var direction = meta.page < targetPage ? selectors.next : selectors.previous;
      var button = document.querySelector(direction);
      if (!button || button.disabled) return false;
      withInternalNavigation(function () { button.click(); });
    }
    return currentPageMeta().page === targetPage;
  }

  function gotoPage(target, options) {
    options = options && typeof options === "object" ? options : {};
    var before = currentPageMeta();
    if (!before.page) {
      startLessonIfNeeded();
      before = currentPageMeta();
    }

    if (originalGoto && options.useOriginal !== false) {
      try {
        withInternalNavigation(function () { originalGoto(target); });
        pageChanged(options.reason || "goto");
        return true;
      } catch (_) { /* use the Session 06 DOM fallback */ }
    }

    var numeric = typeof target === "number" || /^\d+$/.test(String(target || ""));
    var total = Math.max(1, currentPageMeta().pageTotal || uniquePageControls().length || 1);
    var page = numeric ? Math.max(1, Math.min(number(target, 1), total)) : NaN;
    var direct = null;
    if (!numeric) {
      direct = uniquePageControls().find(function (node) {
        return node.dataset.pageId === target || node.dataset.view === target || compact(node.textContent, 80) === compact(target, 80);
      });
      if (direct) page = number(direct.dataset.page, 0) + 1;
    } else {
      direct = document.querySelector("[data-page='" + (page - 1) + "']");
    }

    var moved = false;
    if (direct) {
      withInternalNavigation(function () { direct.click(); });
      moved = currentPageMeta().page === page;
    }
    if (!moved && Number.isFinite(page)) moved = navigateByButtons(page);
    if (moved) pageChanged(options.reason || "goto");
    return moved;
  }

  function lockSummary() {
    if (locks.pageLocked && locks.activityLocked) return "페이지 이동과 현재 활동이 잠겨 있어요.";
    if (locks.pageLocked) return "지금 페이지에서 활동해 주세요.";
    if (locks.activityLocked) return "코치가 활동을 잠시 멈췄어요.";
    return "";
  }

  function ensureLockBanner() {
    var banner = document.querySelector(".onq-runtime-lock-banner");
    if (!banner && role !== "coach") {
      var host = document.querySelector(".s6-main") || document.body;
      if (!host || typeof document.createElement !== "function") return null;
      banner = document.createElement("div");
      banner.className = "onq-runtime-lock-banner";
      banner.setAttribute("role", "status");
      banner.setAttribute("aria-live", "polite");
      banner.hidden = true;
      host.appendChild(banner);
    }
    return banner;
  }

  function renderSharedGoal(value) {
    var valid = value && typeof value === "object" && Number(value.target) > 0;
    var goal = valid ? value : {};
    var current = Math.max(0, number(goal.current, 0));
    var target = Math.max(1, number(goal.target, 0));
    var host = document.querySelector(".s6-main>header");
    var badge = document.querySelector(".onq-shared-goal");
    if (!host || !valid) { if (badge) badge.remove(); return; }
    if (!badge) {
      badge = document.createElement("span");badge.className = "onq-shared-goal";badge.setAttribute("aria-label", "우리 반 공동 목표");
      var progress = host.querySelector("i");host.insertBefore(badge, progress || null);
    }
    badge.textContent = "우리 목표 " + current + " / " + target;
    badge.style.setProperty("--onq-goal", Math.min(100, Math.round(current / target * 100)) + "%");
  }

  function markRuntimeDisabled(control, kind, disabled) {
    if (!control) return;
    if (disabled) {
      if (!control.disabled) {
        control.disabled = true;
        control.dataset.onqRuntimeDisabled = kind;
      }
      control.setAttribute("aria-disabled", "true");
    } else if (control.dataset.onqRuntimeDisabled === kind) {
      control.disabled = false;
      delete control.dataset.onqRuntimeDisabled;
      control.removeAttribute("aria-disabled");
    }
  }

  function applyLocks() {
    var enforce = role !== "coach" && !reviewMode;
    var pageControls = Array.from(document.querySelectorAll([
      selectors.page, selectors.previous, selectors.next, selectors.group
    ].join(",")));
    pageControls.forEach(function (control) {
      markRuntimeDisabled(control, "page", enforce && locks.pageLocked);
    });

    var stage = document.querySelector(selectors.stage);
    if (stage) {
      if (enforce && locks.activityLocked) {
        stage.inert = true;
        stage.dataset.onqRuntimeInert = "activity";
        stage.setAttribute("aria-disabled", "true");
      } else if (stage.dataset.onqRuntimeInert === "activity") {
        stage.inert = false;
        delete stage.dataset.onqRuntimeInert;
        stage.removeAttribute("aria-disabled");
      }
    }

    document.documentElement.dataset.oncuvatePageLocked = String(Boolean(enforce && locks.pageLocked));
    document.documentElement.dataset.oncuvateActivityLocked = String(Boolean(enforce && locks.activityLocked));
    var banner = ensureLockBanner();
    if (banner) {
      var visible = enforce && (locks.pageLocked || locks.activityLocked);
      banner.hidden = !visible;
      banner.textContent = visible ? lockSummary() : "";
    }
  }

  function normalizeNav(value) {
    value = value && typeof value === "object" ? value : {};
    return {
      page: Math.max(0, number(value.page, 0)),
      pageId: compact(value.pageId || "", 80),
      pageLocked: value.pageLocked === true || value.locked === true,
      activityLocked: value.activityLocked === true,
      revision: Math.max(0, number(value.revision, number(value.updatedAt, 0))),
      updatedAt: Math.max(0, number(value.updatedAt, 0)),
      by: compact(value.by || "coach", 24)
    };
  }

  function navFingerprint(value) {
    return [value.page, value.pageId, value.pageLocked, value.activityLocked, value.revision].join("|");
  }

  function applyRemoteNav(raw) {
    var next = normalizeNav(raw);
    var fingerprint = navFingerprint(next);
    if (next.revision && next.revision < lastNavRevision) return false;
    if (next.revision === lastNavRevision && fingerprint === lastNavFingerprint) return false;
    lastNavRevision = Math.max(lastNavRevision, next.revision);
    lastNavFingerprint = fingerprint;
    localRevision = Math.max(localRevision, lastNavRevision);
    safeSessionSet(storageKey + ":revision", String(localRevision));
    locks.pageLocked = next.pageLocked;
    locks.activityLocked = next.activityLocked;
    locks.revision = next.revision;
    locks.updatedAt = next.updatedAt;
    applyingRemote = true;
    suppressCoachWriteUntil = Date.now() + 250;
    // 페이지 잠금일 때만 코치 화면을 따라간다(잠금 해제 중엔 아이가 자유 이동).
    if (next.pageLocked && next.page && currentPageMeta().page !== next.page) gotoPage(next.page, { reason: "coach-nav", useOriginal: true });
    applyingRemote = false;
    applyLocks();
    if (role !== "coach") publishSoon("coach-nav", 20);
    dispatch("oncuvate:class-control", Object.assign({}, locks, { reviewMode: reviewMode }));
    return true;
  }

  function navPayload(reason) {
    var meta = currentPageMeta();
    return {
      page: meta.page,
      pageId: meta.pageId,
      pageLocked: locks.pageLocked,
      activityLocked: locks.activityLocked,
      revision: nextRevision(),
      updatedAt: Date.now(),
      reason: compact(reason || "coach-update", 48),
      by: "coach"
    };
  }

  function writeNav(reason) {
    if (role !== "coach") return Promise.resolve(false);
    var payload = navPayload(reason);
    locks.revision = payload.revision;
    locks.updatedAt = payload.updatedAt;
    lastNavRevision = Math.max(lastNavRevision, payload.revision);
    lastNavFingerprint = navFingerprint(payload);
    applyLocks();
    record("class-control", payload);
    if (!bridgeReady()) {
      if (localPreview && room) localBusPost({ source: "onq-coach", version: 2, type: "command", targetClientId: "*", sentAt: new Date().toISOString(), payload: { command: "set-nav", value: payload } });
      return Promise.resolve(false);
    }
    try {
      return Promise.resolve(bridge("_set")(bridge("pth")("nav"), payload)).then(function () { return true; }).catch(function () { return false; });
    } catch (_) { return Promise.resolve(false); }
  }

  function setLock(name, on, options) {
    options = options && typeof options === "object" ? options : {};
    if (name !== "pageLocked" && name !== "activityLocked") return false;
    if (role !== "coach" && !options.local) return false;
    locks[name] = on === true;
    locks.updatedAt = Date.now();
    applyLocks();
    dispatch("oncuvate:class-control", Object.assign({}, locks, { reviewMode: reviewMode }));
    if (role === "coach" && options.publish !== false) writeNav(options.reason || name);
    return true;
  }

  function setActivityLocked(on, options) { return setLock("activityLocked", on, options); }
  function setPageLocked(on, options) { return setLock("pageLocked", on, options); }

  function pageChanged(reason) {
    global.clearTimeout(mutationTimer);
    mutationTimer = global.setTimeout(function () {
      applyLocks();
      var meta = currentPageMeta();
      var signature = meta.page + "|" + meta.pageId;
      if (signature === lastPage) return;
      lastPage = signature;
      record("step-view", Object.assign({}, meta, { reason: reason || "navigation" }));
      if (role === "coach") {
        if (!applyingRemote && Date.now() >= suppressCoachWriteUntil) writeNav(reason || "navigation");
      } else {
        publishSoon(reason || "navigation", 20);
      }
    }, 0);
  }

  function navTarget(target) {
    return target && target.closest && target.closest([
      selectors.page, selectors.previous, selectors.next, selectors.group, "[data-cover-start]"
    ].join(","));
  }

  function activityTarget(target) {
    return target && target.closest && target.closest(selectors.stage + "," + selectors.activity);
  }

  function blockLockedEvent(event) {
    if (internalNavigation || role === "coach" || reviewMode) return;
    var blocked = locks.pageLocked && navTarget(event.target) || locks.activityLocked && activityTarget(event.target);
    if (!blocked) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    applyLocks();
    record("locked-action", { kind: locks.activityLocked && activityTarget(event.target) ? "activity" : "page" });
  }

  function observeDom() {
    ["click", "pointerdown", "input", "change", "submit", "keydown"].forEach(function (name) {
      document.addEventListener(name, blockLockedEvent, true);
    });
    document.addEventListener("click", function (event) {
      if (navTarget(event.target)) pageChanged("navigation");
      else if (activityTarget(event.target)) publishSoon("activity", 120);
    }, true);
    if (typeof global.MutationObserver === "function" && document.body) {
      observer = new MutationObserver(function () { pageChanged("render"); });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function handleLearningEvent(event) {
    var detail = event && event.detail && typeof event.detail === "object" ? event.detail : {};
    var type = compact(detail.type || detail.event_type, 48);
    if (!type) return;
    lastEvent = {
      type: type,
      activityId: compact(detail.activityId || detail.activity_id, 100),
      itemId: compact(detail.itemId || detail.item_id, 100),
      response: compact(detail.response != null ? detail.response : detail.value, 120),
      correct: typeof detail.correct === "boolean" ? detail.correct : null,
      helpLevel: compact(detail.helpLevel || detail.help_level, 8),
      attempt: Math.max(0, number(detail.attempt, 0)),
      at: Date.now()
    };
    if (type === "answer" || type === "answer-submit") {
      counters.answers += 1;
      if (detail.correct === true) counters.correct += 1;
    }
    if (type === "hint" || type === "help" || type === "help-used") counters.hints += 1;
    if (type === "help-request") counters.helpRequests += 1;
    publishSoon(type, 80);
  }

  function connect() {
    if (connected || connecting) return connected;
    if (!bridgeReady()) {
      if (!(localPreview && room)) return false;
      localBusListen(function (message) {
        if (!message) return;
        if (message.source === "onq-share" && message.type === "shared-state" && message.payload) {
          applyShared(message.payload.topic, message.payload.value);
          return;
        }
        if (message.source !== "onq-coach") return;
        if (message.type === "command" && message.payload && message.payload.command === "set-nav") applyRemoteNav(message.payload.value);
        if (message.type === "shared-goal") renderSharedGoal(message.payload);
      });
      connected = true;document.documentElement.dataset.oncuvateConnected = "local";
      dispatch("oncuvate:runtime-ready", { role: role, room: room, child: child, session: session, transport: "local" });
      if (role !== "coach" && child) publish("join");
      return true;
    }
    connecting = true;
    var pth = bridge("pth");
    var onValue = bridge("_onValue");
    try {
      navUnsubscribe = onValue(pth("nav"), function (snapshot) {
        applyRemoteNav(snapshotValue(snapshot));
        document.documentElement.dataset.oncuvateConnected = "true";
      });
      goalUnsubscribe = onValue(pth("state/sharedGoal"), function (snapshot) { renderSharedGoal(snapshotValue(snapshot)); });
      Object.keys(sharedListeners).forEach(subscribeShared);
      connected = true;
      connecting = false;
      document.documentElement.dataset.oncuvateConnected = "true";
      if (role !== "coach" && child) {
        try {
          var onDisconnect = bridge("_onDisconnect");
          disconnectRegistration = onDisconnect && onDisconnect(pth("prog/" + child));
          if (disconnectRegistration && typeof disconnectRegistration.remove === "function") disconnectRegistration.remove();
        } catch (_) { /* presence cleanup is best effort */ }
        publish("join");
      }
      dispatch("oncuvate:runtime-ready", { role: role, room: room, child: child, session: session });
      return true;
    } catch (_) {
      connecting = false;
      document.documentElement.dataset.oncuvateConnected = "delayed";
      return false;
    }
  }

  function removeProgress() {
    if (!child || !bridgeReady() || !bridge("_remove")) return Promise.resolve(false);
    try { return Promise.resolve(bridge("_remove")(bridge("pth")("prog/" + child))).then(function () { return true; }).catch(function () { return false; }); }
    catch (_) { return Promise.resolve(false); }
  }

  function destroy() {
    global.clearTimeout(publishTimer);
    global.clearTimeout(mutationTimer);
    if (observer) observer.disconnect();
    if (typeof navUnsubscribe === "function") {
      try { navUnsubscribe(); } catch (_) { /* ignore */ }
    }
    if (typeof goalUnsubscribe === "function") {
      try { goalUnsubscribe(); } catch (_) { /* ignore */ }
    }
    Object.keys(sharedUnsubscribes).forEach(function (key) {
      try { if (typeof sharedUnsubscribes[key] === "function") sharedUnsubscribes[key](); } catch (_) { /* ignore */ }
    });
    if (localChannel) { try { localChannel.close(); } catch (_) { /* ignore */ } }
    observer = null;
    navUnsubscribe = null;
    goalUnsubscribe = null;
    sharedUnsubscribes = Object.create(null);
  }

  global.ONQ_EVENT = emit;
  global.ONQ_LOG = log;
  global.ONQ_PROGRESS = progressApi;
  global.ONQ_GOTO = gotoPage;
  global.setActivityLocked = setActivityLocked;
  global.setPageLocked = setPageLocked;
  global.ONQ_RUNTIME_V1 = Object.freeze({
    version: "1.0.0",
    role: role,
    room: room,
    session: session,
    child: child,
    folder: folder,
    reviewMode: reviewMode,
    selectors: Object.freeze(Object.assign({}, selectors)),
    progress: progressApi,
    goto: gotoPage,
    setActivityLocked: setActivityLocked,
    setPageLocked: setPageLocked,
    writeNav: writeNav,
    applyRemoteNav: applyRemoteNav,
    publish: publish,
    publishSoon: publishSoon,
    share: share,
    onShared: onShared,
    getShared: function (topic) { var key = sharedTopic(topic); return key && Object.prototype.hasOwnProperty.call(sharedValues, key) ? sharedValues[key] : null; },
    removeProgress: removeProgress,
    emit: emit,
    log: log,
    snapshot: runtimeSnapshot,
    locks: function () { return Object.assign({}, locks); },
    connected: function () { return connected; },
    reconnect: connect,
    destroy: destroy
  });

  document.documentElement.dataset.oncuvateRole = role;
  document.documentElement.dataset.oncuvateMode = reviewMode ? "review" : room ? "coaching" : "solo";
  document.documentElement.dataset.oncuvateConnected = room ? "waiting" : "solo";
  global.addEventListener("oncuvate:log", handleLearningEvent);
  global.addEventListener("oncuvate:pilot-realtime-ready", connect);
  global.addEventListener("oncuvate:realtime-ready", connect);
  global.addEventListener("pagehide", function () {
    if (role !== "coach") {
      publish("pagehide");
      if (localPreview && room && child) localBusPost({ source: "onq-student", version: 2, type: "offline", clientId: child, payload: { child: child } });
    }
    destroy();
  }, { once: true });
  observeDom();
  applyLocks();
  pageChanged("runtime-init");

  if (room && !connect()) {
    var attempts = 0;
    var poll = global.setInterval(function () {
      attempts += 1;
      if (connect() || attempts >= 240) {
        global.clearInterval(poll);
        if (!connected) document.documentElement.dataset.oncuvateConnected = "delayed";
      }
    }, 250);
  }
}(window));
