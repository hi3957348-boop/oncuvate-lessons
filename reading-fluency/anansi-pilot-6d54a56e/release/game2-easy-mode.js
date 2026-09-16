/* 젤리캡쳐 이지모드 — 젤리를 잘못 놓으면 **왜 안 되는지** 그 자리에서 말해 준다.
 *
 * 왜
 *  지금은 「보드 확인」을 눌러야 맞는지 알 수 있고, 그때도 **어디가 틀렸는지**는
 *  알려 주지 않는다. 아이는 무엇을 고쳐야 할지 모른 채 지우고 다시 놓는다.
 *  규칙은 넷뿐이고 화면에 다 드러나 있으니, 어긴 규칙을 바로 짚어 줄 수 있다.
 *
 * ⚠️ **정답을 알려 주지 않는다.** 규칙을 어겼을 때만 말하고, 규칙에 어긋나지 않으면
 *    조용히 있는다. 아직 틀린 자리일 수 있지만 그건 아이가 따져 볼 몫이다.
 *
 * ⚠️ **말풍선은 「그 상황일 때만」 떠 있어야 한다.**
 *    처음에는 칸 **요소**로 기억했는데, 판이 다시 그려질 때마다 요소가 새로 만들어져
 *    매번 「새 젤리」로 보고 다시 띄웠다 — 그래서 계속 떠 있었다.
 *    이제 **칸 번호**로 기억하고, 어김이 풀리면(젤리를 지우거나 옮기면) 곧바로 닫는다.
 *
 * 왜 엔진을 안 고치고 얹었나
 *  game2 엔진은 로더 사슬이 소스를 글자로 찾아 바꾸며 기능을 얹는 구조라
 *  건드리면 판이 통째로 안 뜬다. 그래서 화면에서 읽고 화면에 덧그린다.
 *
 * 판 규칙(화면에 적혀 있는 그대로)
 *   가로 1 · 세로 1 · 같은 색 1 · 젤리끼리 붙지 않기(대각선 포함)
 */
(() => {
  "use strict";

  const STORE = "onq.g2.easy.v1";
  let easy = false;
  try { easy = localStorage.getItem(STORE) === "on"; } catch (_) {}

  let bubble = null;
  let bubbleFor = null;      // 지금 말풍선이 가리키는 칸 번호

  // ⚠️ 시계로 감추지 않는다. 시계로 닫으면 어김이 그대로인데 다음 다시그리기에 또 떠서
  //    화면이 어른거린다. **어김이 있는 동안만** 떠 있고, 풀리면 닫힌다.
  //    아이가 직접 닫으면 그 어김은 다시 말하지 않는다(다른 어김이 생기면 그때 다시).
  function hide() {
    bubbleFor = null;
    shownKey = "";
    if (bubble) bubble.hidden = true;
  }

  function say(cell, index, text) {
    if (!bubble) {
      bubble = document.createElement("div");
      bubble.className = "onq-g2-why";
      bubble.addEventListener("click", () => { dismissedKey = shownKey; hide(); });
      document.body.appendChild(bubble);
    }
    // 낱말 팝업과 겹쳐 뜨면 둘 다 안 읽힌다. 이쪽을 살린다.
    const word = document.querySelector(".onq-g2-word");
    if (word) word.hidden = true;

    bubble.textContent = text;
    bubble.hidden = false;
    bubbleFor = index;

    const box = cell.getBoundingClientRect();
    const own = bubble.getBoundingClientRect();
    let left = box.left + box.width / 2 - own.width / 2;
    let top = box.bottom + 10;                       // 낱말은 위, 까닭은 아래
    if (top + own.height > window.innerHeight - 8) top = box.top - own.height - 10;
    left = Math.max(8, Math.min(left, window.innerWidth - own.width - 8));
    bubble.style.left = `${Math.round(left)}px`;
    bubble.style.top = `${Math.round(top)}px`;
  }

  const cells = () => [].slice.call(document.querySelectorAll(".g2p-cell"));
  const isJelly = (cell) => cell.classList.contains("monster");
  const regionOf = (cell) => (cell.getAttribute("style") || "").split("--region:")[1] || "";

  /** 어긴 규칙을 찾는다. 없으면 빈 문자열 — 그때는 아무 말도 하지 않는다. */
  function whyWrong(cell, all) {
    const size = Math.round(Math.sqrt(all.length));
    if (!size) return "";
    const index = Number(cell.dataset.g2pCell);
    const row = Math.floor(index / size), col = index % size;
    const region = regionOf(cell);

    const others = all.filter(item => item !== cell && isJelly(item));
    const at = (item) => {
      const i = Number(item.dataset.g2pCell);
      return { row: Math.floor(i / size), col: i % size };
    };

    if (others.some(item => at(item).row === row)) return "이 가로줄에 젤리가 벌써 있어요. 한 줄에 하나예요.";
    if (others.some(item => at(item).col === col)) return "이 세로줄에 젤리가 벌써 있어요. 한 줄에 하나예요.";
    if (region && others.some(item => regionOf(item) === region)) return "같은 색 자리에 젤리가 벌써 있어요. 색마다 하나예요.";
    if (others.some(item => {
      const p = at(item);
      return Math.abs(p.row - row) <= 1 && Math.abs(p.col - col) <= 1;
    })) return "젤리끼리는 붙을 수 없어요. 옆도 대각선도 안 돼요.";
    return "";
  }

  // 지금 화면에 떠 있는 것을 「칸 번호 + 까닭」 한 쌍으로 기억한다.
  // 판이 다시 그려져도 같은 쌍이면 그대로 두어야 시계가 초기화되지 않는다.
  let shownKey = "";
  let dismissedKey = "";     // 아이가 직접 닫은 것 — 그 어김은 다시 말하지 않는다

  function scan() {
    if (!easy) { hide(); dismissedKey = ""; return; }

    const all = cells();
    const bad = [];
    all.forEach((cell) => {
      if (!isJelly(cell) || cell.classList.contains("fixed-clue")) return;
      const reason = whyWrong(cell, all);
      if (reason) bad.push({ index: cell.dataset.g2pCell, cell, reason });
    });

    // 어김이 없으면 닫는다 — 상황이 끝났는데 남아 있으면 안 된다.
    if (!bad.length) { hide(); dismissedKey = ""; return; }

    // 보던 것이 아직 어김이면 그대로 둔다. 아니면 남은 것 중 하나를 보여 준다.
    const keep = bad.find(item => item.index === bubbleFor);
    const pick = keep || bad[bad.length - 1];
    const key = `${pick.index}|${pick.reason}`;
    if (key === dismissedKey) return;                    // 아이가 닫은 것은 다시 안 띄운다
    if (key === shownKey && bubble && !bubble.hidden) return;
    shownKey = key;
    say(pick.cell, pick.index, pick.reason);
  }

  // ── 켜고 끄는 스위치를 판 도구 줄에 얹는다 ────────────────────────────
  function mountToggle() {
    const tools = document.querySelector(".g2p-tools");
    if (!tools || tools.querySelector(".onq-g2-easy")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "onq-g2-easy";
    const paint = () => {
      button.textContent = easy ? "이지모드 켬" : "이지모드";
      button.setAttribute("aria-pressed", easy ? "true" : "false");
    };
    button.addEventListener("click", (event) => {
      event.preventDefault();
      easy = !easy;
      try { localStorage.setItem(STORE, easy ? "on" : "off"); } catch (_) {}
      paint();
      if (!easy) { hide(); shownKey = ""; }
      else scan();
    });
    paint();
    tools.appendChild(button);
  }

  let queued = false;
  new MutationObserver(() => {
    mountToggle();
    if (queued) return;                             // 판이 한 번 바뀔 때 한 번만 본다
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  mountToggle();
  scan();
})();
