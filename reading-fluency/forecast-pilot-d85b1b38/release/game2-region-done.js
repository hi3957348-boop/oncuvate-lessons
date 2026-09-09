/* 젤리캡쳐 — **다 찾은 색을 확정 표시**한다.
 *
 * 왜
 *  색마다 젤리는 하나뿐이다. 그런데 화면에는 그게 안 드러나서, 아이가 이미 끝낸 색을
 *  또 들여다본다. 끝난 색을 눈에 보이게 해 두면 **남은 곳으로 눈이 간다.**
 *
 * ⚠️ 정답을 알려 주는 것이 아니다. **아이가 놓은 것**을 되비쳐 줄 뿐이다.
 *    그래서 규칙을 어긴 젤리는 확정으로 치지 않는다 — 틀린 자리를 굳혀 주면 안 된다.
 *
 * 판단
 *   그 색에 젤리가 **딱 하나** 있고, 그 젤리가 **어떤 규칙도 어기지 않을 때**만 확정.
 *   확정이 풀리면(젤리를 지우거나 어김이 생기면) 표시도 곧바로 사라진다.
 *
 * 엔진은 건드리지 않는다 — 로더가 소스를 글자로 찾아 바꾸는 구조라 손대면 판이 안 뜬다.
 */
(() => {
  "use strict";

  const cells = () => [].slice.call(document.querySelectorAll(".g2p-cell"));
  const isJelly = (cell) => cell.classList.contains("monster");
  const regionOf = (cell) => (cell.getAttribute("style") || "").split("--region:")[1] || "";

  /** 이 젤리가 규칙을 어겼는가. 어겼으면 확정으로 치지 않는다. */
  function breaksRule(cell, all, size) {
    const index = Number(cell.dataset.g2pCell);
    const row = Math.floor(index / size), col = index % size;
    const region = regionOf(cell);
    const others = all.filter(item => item !== cell && isJelly(item));
    const at = (item) => {
      const i = Number(item.dataset.g2pCell);
      return { row: Math.floor(i / size), col: i % size };
    };
    if (others.some(item => at(item).row === row)) return true;
    if (others.some(item => at(item).col === col)) return true;
    if (region && others.some(item => regionOf(item) === region)) return true;
    return others.some(item => {
      const p = at(item);
      return Math.abs(p.row - row) <= 1 && Math.abs(p.col - col) <= 1;
    });
  }

  function paint() {
    const all = cells();
    const size = Math.round(Math.sqrt(all.length));
    if (!size) return;

    // 색마다 젤리를 센다.
    const byRegion = new Map();
    all.forEach((cell) => {
      const region = regionOf(cell);
      if (!region) return;
      if (!byRegion.has(region)) byRegion.set(region, []);
      if (isJelly(cell)) byRegion.get(region).push(cell);
    });

    const done = new Set();
    byRegion.forEach((jellies, region) => {
      if (jellies.length !== 1) return;                     // 없거나 둘 이상이면 확정 아님
      if (breaksRule(jellies[0], all, size)) return;        // 어긴 자리는 굳혀 주지 않는다
      done.add(region);
    });

    all.forEach((cell) => {
      const settled = done.has(regionOf(cell));
      cell.classList.toggle("onq-region-done", settled);
      // 그 색의 젤리 자체는 「여기가 답」으로 또렷하게, 나머지 같은 색은 조용하게.
      cell.classList.toggle("onq-region-anchor", settled && isJelly(cell));
    });
  }

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;                                     // 판이 한 번 바뀔 때 한 번만
    queued = true;
    requestAnimationFrame(() => { queued = false; paint(); });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  paint();
})();
