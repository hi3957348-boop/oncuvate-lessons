/* ══ 온큐베이트 공용 도입 화면 v1.4 ═════════════════════════════════════
 * 수업은 내용만 넘긴다. 그리는 것·기록·코치 연동은 여기서 한다.
 *
 *   ONQ_INTRO.mount({
 *     series:'비문학 꼼꼼 읽기', session:'1회차',
 *     title:'지도 속 거리는 어떻게 알 수 있을까?',
 *     goal:'축척으로 실제 거리를 알아봐요.',   // 젤리코치 말풍선 — 한 문장, 짧게
 *     image:'assets/img/s01-cover.webp',     // 그 수업의 기존 그림
 *     review:{ label:'복습하기' },   // 복습이 있는 콘텐츠만. 빼면 단추가 안 보인다
 *     jelly:'intro/jelly-guide.webp',   // 공용 젤리코치(평면형 안내 자세) — 생략하면 이 값
 *     askEmotion:false,                // 「오늘 감정은 어때요?」를 끄고 싶을 때만(기본은 켜짐)
 *     askCompany:false,             // 자율학습 「누구랑 공부해요?」를 끄고 싶을 때만(기본은 켜짐)
 *     onStart(mode){ … mode가 'lesson'이면 첫 활동, 'review'면 복습을 연다 … }
 *   });
 *
 * 회차 고르기는 두지 않는다 — 콘텐츠 하나에 도입 화면 하나.
 * 기록: 단추에 data-track="activity-complete" data-activity-id="intro" + oncuvate:log {type:'intro-start', mode:'lesson'|'review'}
 * 코치 연동: <html data-oncuvate-mode="coaching">이면 「선생님과 함께하는 수업」 표시.
 *   코치가 수업을 넘기면 수업 쪽에서 ONQ_INTRO.close()를 불러 함께 넘어간다.
 * 로컬 확인 때만 ?intro=0 으로 건너뛸 수 있다(플랫폼에서는 늘 보인다).
 *
 * v1.1 (2026-10-12) 자율학습이면 「수업 시작」을 누른 뒤 한 장면 더 — 「오늘은 누구랑 공부해요?」
 *   혼자 해요 / 어른이랑 같이 해요 / 건너뛰기. 고른 값은 oncuvate:log {type:'study-company', company:'alone'|'helper'|'skip'}.
 *   - 코치와 하는 수업(수업방이 있음)·코치 화면에서는 묻지 않는다 — 플랫폼 기록이 이미 「수업」으로 남는다.
 *   - 역할·접근을 바꾸지 않는다. 건너뛰어도 수업이 그대로 열린다(규격 5-2의 「자율학습/강사 선택」과 다름).
 *   - 쓰는 곳: 학습 성향 분석이 「혼자 할 때와 함께할 때」를 견주고, 어른 도움이 숨은 기록을 「참고」로 표시한다.
 *   - 저장소에 남기지 않는다 — 매번 묻는다.
 * v1.2 (2026-10-12) 아이 화면은 들어올 때 기본으로 고르고 진입한다 — 「수업 시작」 뒤
 *   ① 「오늘 감정은 어때요?」 얼굴 다섯(아주 좋아요 5 ~ 많이 힘들어요 1) + 「말하고 싶지 않아요」 → oncuvate:log {type:'checkin-emotion', emotion:1~5|'pass'}
 *   ② 자율학습이면 「누구랑 공부해요?」 혼자 해요 / 어른이랑 같이 해요(건너뛰기 없음) → {type:'study-company', company}
 *   코치와 하는 수업은 ①만, 코치 화면은 아무것도 묻지 않는다. 고르면 바로 다음 장면 — 두 번 누르면 수업이 열린다.
 *   🔴 감정은 아이의 정서 정보다. 학습 기록(2년·지울 수 없음)에 실려 쌓이므로, 처리방침·보호자 동의에 넣은 뒤에 배포한다.
 * v1.3 (2026-10-12) 마무리 질문 ONQ_INTRO.checkout() — 「오늘 공부하면서 도움이 얼마나 필요했나요?」(혼자 할 수 있었어요/조금/많이).
 *   어른과 함께가 「도움」만은 아니다(사용자) — 함께 이야기하며 배운 효과와 도움 받은 것을 가르는 재료.
 * v1.4 (2026-10-13) 감정은 **보호자가 선택 동의한 아이에게만** 묻는다 — 플랫폼이 `ONCUVATE.askEmotion:true` 를 넣어 줄 때만.
 *   값이 없으면 묻지 않는다(옛 플랫폼이 이 값을 모르는 동안 감정이 학습 기록에 새지 않게). 로컬 시험에서는 묻는다.
 *   10-10 꼼꼼 읽기 판의 가림막 표지(data-onq-intro)도 정본에 합쳤다. 그림문자(책·선생님)는 SVG로 바꿨다.
 * ════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var VERSION = "1.4.0";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var wrap = null, opts = null;

  // 아이콘은 SVG(색은 글자값) — 윈도우 그림문자는 쓰지 않는다
  var ICON_ALONE = '<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><circle cx="24" cy="15" r="8" fill="#FFFFFF"/><path d="M10 42c0-8.3 6.3-14 14-14s14 5.7 14 14z" fill="#FFFFFF"/></svg>';
  var ICON_HELPER = '<svg viewBox="0 0 64 48" width="44" height="34" aria-hidden="true"><circle cx="22" cy="13" r="8" fill="#4B33B5"/><path d="M8 42c0-8.3 6.3-14 14-14s14 5.7 14 14z" fill="#4B33B5"/><circle cx="46" cy="21" r="6" fill="#47BEE6"/><path d="M36 42c0-6.1 4.5-10.5 10-10.5S56 35.9 56 42z" fill="#47BEE6"/></svg>';

  var ICON_BOOK = '<svg viewBox="0 0 64 64" width="96" height="96" aria-hidden="true"><path d="M8 14c8-3 16-3 24 2v36c-8-5-16-5-24-2z" fill="#B7A3F6"/><path d="M56 14c-8-3-16-3-24 2v36c8-5 16-5 24-2z" fill="#9AD7F0"/><path d="M32 16v36" stroke="#6B5BB5" stroke-width="2"/></svg>';
  var ICON_COACH = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="vertical-align:-3px;margin-right:4px"><circle cx="12" cy="8" r="4" fill="#0F7B6C"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="#0F7B6C"/></svg>';

  function log(detail) {
    try { window.dispatchEvent(new CustomEvent("oncuvate:log", { detail: detail })); } catch (_) { /* 무시 */ }
  }

  function isLocal() { return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:"; }
  // 코치 화면인가 — 코치 화면에서는 아무것도 묻지 않는다
  function isCoachScreen() {
    var html = document.documentElement, inj = window.ONCUVATE;
    if (html.getAttribute("data-oncuvate-role") === "coach") return true;
    if (inj && typeof inj === "object") return inj.role === "coach";
    return isLocal() && new URLSearchParams(location.search).get("ocrole") === "coach";
  }
  // 코치와 하는 수업인가 — 플랫폼이 넣어 준 수업방이 있으면 수업(「누구랑」은 묻지 않는다 — 기록에 이미 「수업」으로 남는다).
  // 공용 코치 콘솔이 먼저 표시해 두었으면 그것을 따른다.
  function inRoom() {
    var mode = document.documentElement.getAttribute("data-oncuvate-mode"), inj = window.ONCUVATE;
    if (mode === "coaching") return true;
    if (mode === "solo") return false;
    if (inj && typeof inj === "object") return !!inj.room;
    return isLocal() && !!new URLSearchParams(location.search).get("ocroom");
  }

  // 🔴 v1.4 「오늘 감정」을 물어도 되는가(2026-10-13 · 결정 83 · 보호자 선택 동의).
  //    플랫폼에서 열렸으면 플랫폼이 넣어 준 `ONCUVATE.askEmotion` 이 **분명히 true 일 때만** 묻는다 —
  //    값이 없으면(옛 플랫폼·동의 안 함) **묻지 않는다.** 묻지 않으면 저장될 길도 없다.
  //    플랫폼 밖에서는 로컬 시험(file:·localhost)에서만 묻는다(파일럿 확인용 — 서버로 가지 않는다).
  function emotionAllowed() {
    var inj = window.ONCUVATE;
    if (inj && typeof inj === "object") return inj.askEmotion === true;
    return isLocal();
  }

  // 감정 얼굴 다섯 — SVG(색은 글자값). 값은 5(아주 좋아요)~1(많이 힘들어요)
  function face(fill, mouth, filled, tear) {
    return '<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="' + fill + '" stroke="#3A3350" stroke-width="1.5"/>' +
      '<circle cx="17" cy="20" r="2.6" fill="#3A3350"/><circle cx="31" cy="20" r="2.6" fill="#3A3350"/>' +
      (filled ? '<path d="' + mouth + '" fill="#8C3B2E"/>' : '<path d="' + mouth + '" fill="none" stroke="#3A3350" stroke-width="2.6" stroke-linecap="round"/>') +
      (tear ? '<path d="M34 24c1.6 2.6 2 4.4 0 5.6c-2-1.2-1.6-3 0-5.6z" fill="#5AA9E6"/>' : "") + "</svg>";
  }
  var EMOTIONS = [
    { v: 5, label: "아주 좋아요", svg: face("#FFD54A", "M14 27Q24 39 34 27Z", true) },
    { v: 4, label: "좋아요", svg: face("#FFE58F", "M16 29Q24 35 32 29") },
    { v: 3, label: "그냥 그래요", svg: face("#EDE7F6", "M17 31L31 31") },
    { v: 2, label: "조금 힘들어요", svg: face("#D6E4F5", "M16 33Q24 28 32 33") },
    { v: 1, label: "많이 힘들어요", svg: face("#C5D3EE", "M15 34Q24 26 33 34", false, true) }
  ];

  // 시작 단추 다음 장면 — 같은 카드 안에서 말풍선과 단추 자리만 바뀐다
  function stepBox(question, cls, label, html) {
    wrap.querySelector(".oi-bubble").textContent = question;
    wrap.querySelector(".oi-btns").hidden = true;
    var old = wrap.querySelector(".oi-step");
    if (old) old.remove();
    var box = document.createElement("div");
    box.className = "oi-step " + cls;
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", label);
    box.innerHTML = html;
    wrap.querySelector(".oi-body").insertBefore(box, wrap.querySelector(".oi-live"));
    return box;
  }

  // ① 오늘 감정 — 「말하고 싶지 않아요」도 하나의 선택(억지로 고르게 하면 아무 얼굴이나 눌러 기록이 흐려진다)
  function askEmotion(mode, next) {
    var box = stepBox("오늘 감정은 어때요?", "oi-emotion-box", "오늘 감정 고르기",
      '<div class="oi-emotions">' + EMOTIONS.map(function (m) {
        return '<button class="oi-emotion" type="button" data-emotion="' + m.v + '">' + m.svg + "<span>" + m.label + "</span></button>";
      }).join("") + '</div><button class="oi-skip" type="button" data-emotion="pass">말하고 싶지 않아요</button>');
    [].forEach.call(box.querySelectorAll("[data-emotion]"), function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-emotion");
        log({ type: "checkin-emotion", activityId: "intro", emotion: v === "pass" ? "pass" : Number(v), mode: mode });
        next();
      });
    });
  }

  // ② 누구랑 — 자율학습일 때만
  function askCompany(mode, next) {
    var box = stepBox("오늘은 누구랑 공부해요?", "oi-ask", "누구랑 공부하는지 고르기",
      '<button class="oi-btn oi-pick oi-alone" type="button" data-company="alone">' + ICON_ALONE + "<span>혼자 해요</span></button>" +
      '<button class="oi-btn oi-pick oi-helper" type="button" data-company="helper">' + ICON_HELPER + "<span>어른이랑 같이 해요</span></button>");
    [].forEach.call(box.querySelectorAll("[data-company]"), function (b) {
      b.addEventListener("click", function () {
        log({ type: "study-company", activityId: "intro", company: b.getAttribute("data-company"), mode: mode });
        next();
      });
    });
  }

  function close(reason, mode) {
    if (!wrap || wrap.hidden) return;
    mode = mode === "review" ? "review" : "lesson";
    wrap.hidden = true;
    document.documentElement.removeAttribute("data-intro-open");
    log({ type: "intro-start", activityId: "intro", mode: mode, by: reason || "child" });
    if (opts && typeof opts.onStart === "function") { try { opts.onStart(mode); } catch (e) { console.error(e); } }
    if (typeof window.ONQ_PUBLISH === "function") { try { window.ONQ_PUBLISH("intro-start"); } catch (_) { /* 무시 */ } }
  }

  function mount(o) {
    opts = o || {};
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
    if (local && new URLSearchParams(location.search).get("intro") === "0") { document.documentElement.setAttribute("data-onq-intro", "skip"); if (opts.onStart) opts.onStart("lesson"); return; }
    if (wrap) wrap.remove();
    wrap = document.createElement("div");
    wrap.className = "oi-wrap";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", "수업 시작 화면");
    wrap.innerHTML =
      '<div class="oi-card">' +
        '<div class="oi-art' + (opts.image ? "" : " empty") + '"><div class="oi-frame">' +
          (opts.image ? '<img src="' + esc(opts.image) + '" alt="' + esc(opts.imageAlt || "") + '">' : "<span>" + ICON_BOOK + "</span>") +
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
          '<p class="oi-live">' + ICON_COACH + '선생님과 함께하는 수업이에요</p>' +
        "</div>" +
      "</div>";
    document.body.appendChild(wrap);
    document.documentElement.setAttribute("data-intro-open", "");
    [].forEach.call(wrap.querySelectorAll("[data-mode]"), function (b) {
      b.addEventListener("click", function () {
        // 누르는 순간에 다시 본다 — 코치 콘솔이 수업방 표시를 늦게 달 수도 있어서
        var mode = b.getAttribute("data-mode"), steps = [];
        if (!isCoachScreen()) {
          if (opts.askEmotion !== false && emotionAllowed()) steps.push(askEmotion);
          if (opts.askCompany !== false && !inRoom()) steps.push(askCompany);
        }
        (function run(i) {
          if (i >= steps.length) { close("child", mode); return; }
          steps[i](mode, function () { run(i + 1); });
        })(0);
      });
    });
    document.documentElement.setAttribute("data-onq-intro", "ready"); /* 가림막을 걷는 표지(2026-10-10) */
  }

  // ── v1.3 마무리 질문 — 「오늘 공부하면서 도움이 얼마나 필요했나요?」 ──
  // 어른과 같이 한 날이 더 잘 나올 때, 「함께 이야기하며 배운 효과」와 「도움을 많이 받은 것」을 가르는 재료다.
  // 수업이 끝날 때 콘텐츠가 부른다: ONQ_INTRO.checkout({ activityId:'reflection-record', onDone(){ … 마치기 … } })
  // 코치 화면에서는 묻지 않고 바로 onDone. 기록: oncuvate:log {type:'checkout-help', need:'none'|'some'|'lots'}.
  function meter(n) {
    var bars = "";
    for (var i = 0; i < 3; i++) bars += '<rect x="' + (6 + i * 14) + '" y="' + (26 - i * 7) + '" width="10" height="' + (10 + i * 7) + '" rx="2" fill="' + (i < n ? "#6A3FE0" : "#E6DEFA") + '"/>';
    return '<svg viewBox="0 0 50 40" width="46" height="36" aria-hidden="true">' + bars + "</svg>";
  }
  var NEEDS = [
    { v: "none", label: "혼자 할 수 있었어요", n: 0 },
    { v: "some", label: "조금 필요했어요", n: 1 },
    { v: "lots", label: "많이 필요했어요", n: 3 }
  ];
  function checkout(o) {
    o = o || {};
    var done = function () { if (typeof o.onDone === "function") { try { o.onDone(); } catch (e) { console.error(e); } } };
    if (isCoachScreen()) { done(); return; }
    var box = document.createElement("div");
    box.className = "oi-wrap oi-checkout";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "마무리 질문");
    box.innerHTML =
      '<div class="oi-card oi-card-small"><div class="oi-body">' +
        '<div class="oi-coach"><img src="' + esc(o.jelly || "intro/jelly-guide.webp") + '" alt="젤리코치">' +
          '<div class="oi-bubble">오늘 공부하면서 도움이 얼마나 필요했나요?</div></div>' +
        '<div class="oi-needs">' + NEEDS.map(function (x) {
          return '<button class="oi-need" type="button" data-need="' + x.v + '">' + meter(x.n) + "<span>" + x.label + "</span></button>";
        }).join("") + "</div>" +
      "</div></div>";
    document.body.appendChild(box);
    [].forEach.call(box.querySelectorAll("[data-need]"), function (b) {
      b.addEventListener("click", function () {
        log({ type: "checkout-help", activityId: o.activityId || "checkout", need: b.getAttribute("data-need") });
        box.remove();
        done();
      });
    });
  }

  window.ONQ_INTRO = { mount: mount, close: close, checkout: checkout, version: VERSION, isOpen: function () { return !!(wrap && !wrap.hidden); } };
})();
