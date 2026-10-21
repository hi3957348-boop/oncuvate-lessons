/* 젤리코치 — 아래 단추 줄에 떠 있는 작은 젤리(2026-10-04 사용자 지정 「젤리코치 캐릭터 활용 · 동적 효과」).
 *
 *  · 평소: 살랑살랑 떠 있다(움직임 줄이기 설정이면 가만히).
 *  · **문제를 풀 때만** 말한다(차례가 바뀔 때 인사는 빼 달라고 함 — 2026-10-04).
 *      맞힘 → 폴짝 뛰며 별이 튀고 칭찬(praise 얼굴)
 *      다시 해야 함 → 갸우뚱하며 격려 + 그 활동에 맞는 도움말 한 줄(thinking 얼굴) — 답은 말하지 않는다
 *  · 🔑 판정을 말하지 않는다 — 점수·「틀렸어요」 같은 말은 없다. 다시 할 때도 「괜찮아」로 받는다(오답 = 지원 신호).
 *  · 화면은 누를 때마다 통째로 다시 그려지므로 젤리는 #app 밖(body)에 두고, 아래 단추 줄 자리를 따라간다.
 *  · 차례가 바뀔 때만 #app 에 kt-enter 를 잠깐 붙여 등장 효과를 준다(누를 때마다 깜빡이지 않게).
 */
(() => {
  "use strict";
  if (window.ONQ_JELLY_COACH) return;
  const FACE = { guide: "assets/jelly/guide.png", praise: "assets/jelly/praise.png", thinking: "assets/jelly/thinking.png", listening: "assets/jelly/listening.png" };
  const LINES = {
    good: ["좋아요!", "잘했어요!", "맞아요!", "멋져요!", "바로 그거예요!"],
    retry: ["괜찮아요!", "다시 해 봐요!", "천천히 한 번 더!"],
    done: ["다 했어요! 최고!", "끝까지 했어요!"],
    poke: ["안녕! 나는 젤리코치예요.", "천천히 해도 괜찮아요.", "소리 내어 읽어 봐요!", "잘하고 있어요!"]
  };
  const STEP = { cover: "같이 읽어 볼까요?", vocab: "낱말 뜻을 찾아봐요!", game2: "젤리를 잡아요!", game1: "빈칸을 채워요!",
                 sentence: "한 문장씩 읽어요!", paragraph: "처음부터 끝까지!", worksheet: "써 볼까요?" };
  const pick = list => list[Math.floor(Math.random() * list.length)];
  // 틀렸을 때 도움말 — 활동마다 한 줄. 🔴 답을 알려 주지 않는다(범위만 좁힌다).
  const HELP = {
    "intervention.spelling_choice": (window.ONQ_CONTENT_PACK || {}).helpSpelling || `받침 ${(window.ONQ_CONTENT_PACK || {}).badchim || "ㅁ"}이 있는 글자를 찾아봐요.`,
    "evaluation.word_meaning": "그림을 다시 보고 골라 봐요.",
    "support.printable": "소리를 다시 들어 봐요.",
    "evaluation.paragraph": "글을 다시 읽고 찾아봐요.",
    "game.word_bingo": "소리를 다시 듣고 찾아봐요.",
    "game.nonword_bingo": "소리를 다시 듣고 글자를 찾아봐요.",
    "game.nonword_detective": "받침 다음 소리를 잘 봐요."
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const css = document.createElement("style");
  css.textContent = `
  #onqJelly { position: fixed; z-index: 40; width: 52px; height: 52px; left: -999px; top: -999px; pointer-events: auto; cursor: pointer; }
  #onqJelly img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 4px rgba(79,53,184,.18)); ${reduced ? "" : "animation: jc-bob 2.4s ease-in-out infinite;"} }
  #onqJelly.jc-hop img { ${reduced ? "" : "animation: jc-hop .5s ease-out, jc-bob 2.4s ease-in-out .5s infinite;"} }
  /* 말풍선은 젤리 오른쪽 옆 — 위로 띄우면 수업 화면의 단추를 가린다 */
  #onqJelly .jc-say { position: absolute; left: 58px; top: 50%; transform: translateY(-50%) scale(.9); transform-origin: 0 50%; opacity: 0; pointer-events: none;
    white-space: nowrap; padding: 7px 14px; border: 2.5px solid #f6c4bd; border-radius: 4px 16px 16px 16px; background: #fff; color: #2f3350;
    font: 800 15px/1.3 "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; box-shadow: 0 4px 0 #ece6fd; transition: opacity .18s, transform .18s; }
  #onqJelly.jc-talk .jc-say { opacity: 1; transform: translateY(-50%) scale(1); }
  #onqJelly .jc-say.good { border-color: #ffcf3d; background: #fff6cf; }
  #onqJelly .jc-say.help { border-color: #b6dcf3; background: #e8f5fd; }
  #onqJelly .jc-star { position: absolute; left: 20px; top: 14px; font-size: 16px; pointer-events: none; animation: jc-star .7s ease-out forwards; }
  #onqJelly.jc-wobble img { animation: jc-wobble .55s ease-in-out; }
  @keyframes jc-star { 0% { opacity: 1; transform: translate(0, 0) scale(.6); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.2) rotate(40deg); } }
  @keyframes jc-wobble { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-12deg); } 50% { transform: rotate(9deg); } 75% { transform: rotate(-5deg); } }
  @keyframes jc-bob { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-5px) rotate(2deg); } }
  @keyframes jc-hop { 0% { transform: translateY(0) scale(1); } 35% { transform: translateY(-14px) scale(1.08, .94); } 70% { transform: translateY(0) scale(.96, 1.05); } 100% { transform: none; } }
  @media print { #onqJelly { display: none; } }`;
  document.head.appendChild(css);

  const el = document.createElement("div");
  el.id = "onqJelly"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
  el.innerHTML = `<img src="${FACE.guide}" alt="젤리코치"><span class="jc-say"></span>`;
  document.body.appendChild(el);
  const img = el.querySelector("img"), bubble = el.querySelector(".jc-say");

  let timer = null, lastSay = 0;
  function say(text, face = "guide", tone = "", ms = 2200) {
    lastSay = Date.now();
    img.src = FACE[face] || FACE.guide;
    bubble.textContent = text; bubble.className = "jc-say " + tone;
    el.classList.remove("jc-hop"); void el.offsetWidth; el.classList.add("jc-hop", "jc-talk");
    clearTimeout(timer);
    timer = setTimeout(() => { el.classList.remove("jc-talk"); img.src = FACE.guide; }, ms);
  }
  // 맞혔을 때 — 별이 튀어 오른다 · 틀렸을 때 — 갸우뚱
  function sparkle() {
    if (reduced) return;
    for (let i = 0; i < 6; i++) {
      const s = document.createElement("span"); s.className = "jc-star"; s.textContent = i % 2 ? "✦" : "★";
      const a = (-150 + i * 24) * Math.PI / 180, d = 46 + (i % 3) * 10;
      s.style.setProperty("--dx", Math.round(Math.cos(a) * d) + "px"); s.style.setProperty("--dy", Math.round(Math.sin(a) * d) + "px");
      s.style.color = ["#ffcf3d", "#6fc2f0", "#f6a89d"][i % 3];
      el.appendChild(s); setTimeout(() => s.remove(), 750);
    }
  }
  function wobble() { if (reduced) return; el.classList.remove("jc-wobble"); void el.offsetWidth; el.classList.add("jc-wobble"); setTimeout(() => el.classList.remove("jc-wobble"), 600); }
  window.ONQ_JELLY_COACH = { say, sparkle };

  // 자리 — 아래 단추 줄의 「이전」 단추 오른쪽
  function place() {
    const bar = document.querySelector("#app .bottombar");
    const modalOpen = [...document.querySelectorAll(".modal, .modal-backdrop, [role='dialog'], dialog[open]")].some(m => m.getBoundingClientRect().width > 0);
    if (!bar || modalOpen) { el.style.display = "none"; return; }
    const r = bar.getBoundingClientRect(), first = bar.firstElementChild;
    const fx = first ? first.getBoundingClientRect().right : r.left;
    el.style.display = "";
    el.style.left = Math.round(fx + 14) + "px";
    el.style.top = Math.round(r.top + r.height / 2 - 34) + "px";
  }

  // 차례가 바뀌면 인사 + 등장 효과
  let lastStep = null;
  function onRender() {
    place();
    const id = document.querySelector("#app .step-btn.active")?.dataset.stepId || "cover";
    if (id !== lastStep) {
      const first = lastStep === null;
      lastStep = id;
      const app = document.getElementById("app");
      if (app && !reduced) { app.classList.remove("kt-enter"); void app.offsetWidth; app.classList.add("kt-enter"); setTimeout(() => app.classList.remove("kt-enter"), 700); }
    }
  }
  let queued = false;
  const mo = new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; onRender(); }); } });
  const start = () => { const app = document.getElementById("app"); mo.observe(document.body, { childList: true, subtree: true }); onRender(); };   // 안내 창이 #app 밖에 뜰 수도 있어 body 를 본다
  window.addEventListener("resize", place);
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();

  // 아이가 한 일 — 수업 엔진이 내는 사내 이벤트를 듣는다(기록 통로와 같은 것, 새로 보내는 것은 없다)
  window.addEventListener("oncuvate:event", ev => {
    const d = ev.detail || {}, t = d.event_type;
    if (d.task === "word_prediction" && t === "answer") return;          // 낱말 예측은 한 번에 아홉 건 — 끝날 때만 말한다
    if (Date.now() - lastSay < 500 && t === "answer") return;
    if (t === "answer" && d.accuracy !== "notApplicable") {
      if (d.correct === true) { say(pick(LINES.good), "praise", "good"); sparkle(); }
      else if (d.correct === false) { say(`${pick(LINES.retry)} ${HELP[d.activity_id] || "천천히 다시 해 봐요."}`, "thinking", "help", 3000); wobble(); }
    } else if (t === "activity_complete" && d.completion !== "navigation_exit" && !d.skipped) {   // 메뉴로 옮겨 가며 나는 완료는 칭찬하지 않는다
      say(pick(LINES.done), "praise", "good", 2600);
    }
  });
  el.addEventListener("click", () => say(pick(LINES.poke), "praise", "", 2000));
})();
