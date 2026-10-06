/* ══ 온큐베이트 공용 도입 화면 v1 ═══════════════════════════════════════
 * 수업은 내용만 넘긴다. 그리는 것·기록·코치 연동은 여기서 한다.
 *
 *   ONQ_INTRO.mount({
 *     series:'비문학 꼼꼼 읽기', session:'1회차',
 *     title:'지도 속 거리는 어떻게 알 수 있을까?',
 *     goal:'축척으로 실제 거리를 알아봐요.',   // 젤리코치 말풍선 — 한 문장, 짧게
 *     image:'assets/img/s01-cover.webp',     // 그 수업의 기존 그림
 *     review:{ label:'복습하기' },   // 복습이 있는 콘텐츠만. 빼면 단추가 안 보인다
 *     jelly:'intro/jelly-guide.webp',   // 공용 젤리코치(평면형 안내 자세) — 생략하면 이 값
 *     onStart(mode){ … mode가 'lesson'이면 첫 활동, 'review'면 복습을 연다 … }
 *   });
 *
 * 회차 고르기는 두지 않는다 — 콘텐츠 하나에 도입 화면 하나.
 * 기록: 단추에 data-track="activity-complete" data-activity-id="intro" + oncuvate:log {type:'intro-start', mode:'lesson'|'review'}
 * 코치 연동: <html data-oncuvate-mode="coaching">이면 「선생님과 함께하는 수업」 표시.
 *   코치가 수업을 넘기면 수업 쪽에서 ONQ_INTRO.close()를 불러 함께 넘어간다.
 * 로컬 확인 때만 ?intro=0 으로 건너뛸 수 있다(플랫폼에서는 늘 보인다).
 * ════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var wrap = null, opts = null;

  function close(reason, mode) {
    if (!wrap || wrap.hidden) return;
    mode = mode === "review" ? "review" : "lesson";
    wrap.hidden = true;
    document.documentElement.removeAttribute("data-intro-open");
    try { window.dispatchEvent(new CustomEvent("oncuvate:log", { detail: { type: "intro-start", activityId: "intro", mode: mode, by: reason || "child" } })); } catch (_) { /* 무시 */ }
    if (opts && typeof opts.onStart === "function") { try { opts.onStart(mode); } catch (e) { console.error(e); } }
    if (typeof window.ONQ_PUBLISH === "function") { try { window.ONQ_PUBLISH("intro-start"); } catch (_) { /* 무시 */ } }
  }

  function mount(o) {
    opts = o || {};
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
    if (local && new URLSearchParams(location.search).get("intro") === "0") { if (opts.onStart) opts.onStart("lesson"); return; }
    if (wrap) wrap.remove();
    wrap = document.createElement("div");
    wrap.className = "oi-wrap";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", "수업 시작 화면");
    wrap.innerHTML =
      '<div class="oi-card">' +
        '<div class="oi-art' + (opts.image ? "" : " empty") + '"><div class="oi-frame">' +
          (opts.image ? '<img src="' + esc(opts.image) + '" alt="' + esc(opts.imageAlt || "") + '">' : "<span>📘</span>") +
        "</div></div>" +
        '<div class="oi-body">' +
          '<div class="oi-head"><span class="oi-series">' + esc(opts.series) + "</span>" + (opts.session ? '<span class="oi-badge">' + esc(opts.session) + "</span>" : "") + "</div>" +
          '<h1 class="oi-title">' + esc(opts.title) + "</h1>" +
          '<div class="oi-coach"><img src="' + esc(opts.jelly || "intro/jelly-guide.webp") + '" alt="젤리코치">' +
            '<div class="oi-bubble">' + esc(opts.goal) + "</div></div>" +
          '<div class="oi-btns' + (opts.review ? "" : " one") + '">' +
            '<button class="oi-btn oi-start" type="button" data-mode="lesson" data-track="activity-complete" data-activity-id="intro"><span>▶</span>수업 시작</button>' +
            (opts.review ? '<button class="oi-btn oi-review" type="button" data-mode="review" data-track="activity-complete" data-activity-id="intro-review"><span>↺</span>' +
              esc(opts.review.label || "복습하기") + "</button>" : "") +
          "</div>" +
          '<p class="oi-live">👩‍🏫 선생님과 함께하는 수업이에요</p>' +
        "</div>" +
      "</div>";
    document.body.appendChild(wrap);
    document.documentElement.setAttribute("data-intro-open", "");
    [].forEach.call(wrap.querySelectorAll("[data-mode]"), function (b) {
      b.addEventListener("click", function () { close("child", b.dataset.mode); });
    });
  }

  window.ONQ_INTRO = { mount: mount, close: close, isOpen: function () { return !!(wrap && !wrap.hidden); } };
})();
