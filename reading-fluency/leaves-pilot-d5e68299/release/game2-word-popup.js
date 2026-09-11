/* 젤리캡쳐 — 칸을 누르면 낱말이 **그 자리에** 뜨고 소리가 난다.
 *
 * 왜
 *  읽을 낱말이 판 위쪽 띠에만 적혀 있었다. 아이 눈은 방금 누른 칸에 가 있는데
 *  글은 저 위에 있으니 시선이 옮겨 가지 않는다("상단에 적혀있는걸로는 시선이 가기 어렵더라").
 *  그래서 **누른 칸 옆에** 크게 띄우고 소리를 바로 들려준다.
 *
 * 왜 엔진을 안 고치고 얹었나
 *  game2 엔진은 로더 사슬이 **소스를 글자로 찾아 바꾸며** 기능을 얹는 구조다
 *  (`const definitions = …` 한 줄이 그 앵커라, 건드리면 판이 통째로 안 뜬다).
 *  그래서 엔진은 그대로 두고 **화면만** 덧그린다.
 *
 * 닫기: 팝업이나 같은 칸을 다시 누르면 닫히고, 수업은 그대로 이어진다.
 */
(() => {
  "use strict";

  const CELL = ".g2p-cell";
  let popup = null;
  let openFor = null;      // 지금 열려 있는 칸 번호

  function ensurePopup() {
    if (popup) return popup;
    popup = document.createElement("div");
    popup.className = "onq-g2-word";
    popup.setAttribute("role", "status");
    popup.hidden = true;
    popup.addEventListener("click", (event) => {
      event.stopPropagation();
      close();                                   // 팝업을 누르면 닫힌다
    });
    document.body.appendChild(popup);
    return popup;
  }

  function close() {
    openFor = null;
    if (popup) popup.hidden = true;
    try { window.ONQ_AUDIO?.stop?.(); } catch (_) {}
  }

  function place(cell) {
    const box = cell.getBoundingClientRect();
    const node = ensurePopup();
    node.hidden = false;
    // 먼저 보이게 한 뒤 크기를 재야 자리를 정확히 잡는다.
    const own = node.getBoundingClientRect();
    const gap = 10;
    let left = box.left + box.width / 2 - own.width / 2;
    let top = box.top - own.height - gap;
    if (top < 8) top = box.bottom + gap;                       // 위가 좁으면 아래로
    left = Math.max(8, Math.min(left, window.innerWidth - own.width - 8));
    node.style.left = `${Math.round(left)}px`;
    node.style.top = `${Math.round(top)}px`;
  }

  function wordOf(cell) {
    const face = cell.querySelector(".g2p-word");
    const text = (face ? face.textContent : cell.textContent) || "";
    return text.trim();
  }

  document.addEventListener("click", (event) => {
    const cell = event.target instanceof Element ? event.target.closest(CELL) : null;
    if (!cell) {
      if (openFor !== null) close();                           // 판 밖을 누르면 닫는다
      return;
    }
    const index = cell.dataset.g2pCell;
    if (openFor === index) { close(); return; }                // 같은 칸 → 닫기

    const word = wordOf(cell);
    if (!word) { close(); return; }

    openFor = index;
    const node = ensurePopup();
    node.textContent = word;
    place(cell);
    try { window.ONQ_AUDIO?.play?.(word); } catch (_) {}
  }, true);

  // 판이 다시 그려지면(다음 보드·재시작) 열린 팝업은 의미가 없다.
  new MutationObserver(() => {
    if (openFor === null) return;
    if (!document.querySelector(`${CELL}[data-g2p-cell="${openFor}"]`)) close();
  }).observe(document.body, { childList: true, subtree: true });

  window.addEventListener("resize", close, { passive: true });
})();
