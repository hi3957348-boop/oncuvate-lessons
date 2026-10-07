/* 늘려 읽기 — 꼼꼼 읽기 수업(부주의 읽기 · history-prehistory-careful-reading)의 「늘려 읽기」를 읽기유창성 나누어 읽기로 옮겼다.
 *
 *  · 4음절 이상이면서 낯설거나 소리가 바뀌는 어절 옆에 작은 ＋ 단추가 붙는다.
 *  · 누르면 덩이를 한 줄씩 늘려 읽는다(가운데 → 한가운데 → 한가운데에). 소리가 바뀌는 자리는 먼저 「여기만 기억해요」로 보여 준다.
 *  · 데이터: window.ONQ_SESSION01_STRETCH = { "<문장 번호>": [{ w, chunks, focus, eq:[앞,뒤,"[소리]"], rule, tip }] }
 *  · ＋·✓ 표시는 CSS ::before 로 그린다 — 글자를 넣으면 문장 textContent 가 바뀌어 확장 읽기 꾸미기가 다시 돌며 단추를 지운다.
 *  · 도움으로 기록한다(data-track="hint", A2 — 덩이로 나눠 보여 주는 부분 단서). 판정은 하지 않는다.
 */
(() => {
  "use strict";
  const pack = window.ONQ_CONTENT_PACK || {};
  const sessionKey = document.body.dataset.session || "session01";
  const lesson = (pack.sessions || {})[sessionKey] || {};
  const DATA = window[`ONQ_${sessionKey.toUpperCase()}_STRETCH`] || {};
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const t0 = performance.now();
  const done = new Set();
  let pop = null, cur = null, step = 0, opened = 0;

  function emit(type, extra = {}) {
    const ev = { event_type: type, lesson_id: lesson.lessonId || "", lesson_version: pack.version || "0.1.0", session_id: sessionKey,
                 activity_id: "intervention.sentence", measure_id: "intervention.sentence.stretch", elapsed_ms: Math.round(performance.now() - t0),
                 timestamp: new Date().toISOString(), ...extra };
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: ev }));
  }

  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement("div"); pop.className = "xr-pop"; pop.hidden = true;
    pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "늘려 읽기");
    pop.innerHTML = '<div class="xr-head"><b>늘려 읽기</b><small>한 줄씩 소리 내어 읽어요</small><button class="xr-x" type="button" aria-label="닫기">✕</button></div><div class="xr-say" hidden></div><ol class="xr-lines"></ol><button class="xr-go" type="button">읽어 볼게요 ▶</button>';
    pop.querySelector(".xr-x").onclick = () => close(false);
    pop.querySelector(".xr-go").onclick = next;
    document.body.append(pop);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !pop.hidden) close(false); });
    return pop;
  }
  function place(chip) {
    const r = chip.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    const x = Math.min(Math.max(12, r.left - w / 2), innerWidth - w - 12);
    let y = r.bottom + 10; if (y + h > innerHeight - 12) y = Math.max(12, r.top - h - 10);
    pop.style.left = x + "px"; pop.style.top = y + "px";
  }
  function open(item, chip) {
    ensurePop(); cur = { item, chip }; opened = Date.now();
    const ol = pop.querySelector(".xr-lines");
    const mk = c => item.focus && c.includes(item.focus) ? esc(c).replace(esc(item.focus), `<mark>${esc(item.focus)}</mark>`) : esc(c);
    ol.innerHTML = item.chunks.map(c => `<li hidden>${mk(c)}</li>`).join("");
    const say = pop.querySelector(".xr-say");
    say.innerHTML = item.eq ? `<span class="xr-tag">여기만 기억해요</span><div class="xr-eq"><span class="s">${esc(item.eq[0])}</span><span class="op">+</span><span class="s">${esc(item.eq[1])}</span><span class="op">→</span><span class="to">${esc(item.eq[2])}</span></div><p>${esc(item.tip || "")}</p>` : "";
    const go = pop.querySelector(".xr-go");
    if (item.eq) { say.hidden = false; step = -1; go.textContent = "읽어 볼게요 ▶"; }
    else { say.hidden = true; step = 0; ol.firstChild.hidden = false; ol.firstChild.classList.add("now"); go.textContent = item.chunks.length > 1 ? "읽었어요 ▶" : "다 읽었어요 ✓"; }
    pop.hidden = false; place(chip); go.focus();
    emit("stretch_open", { item_id: "stretch-" + item.w, word: item.w, ...(item.rule ? { target_rule_id: item.rule } : {}) });
  }
  function next() {
    if (!cur) return;
    const lis = [...pop.querySelectorAll(".xr-lines li")], go = pop.querySelector(".xr-go");
    if (step < lis.length - 1) {
      if (step >= 0) lis[step].classList.replace("now", "read");
      step++; lis[step].hidden = false; lis[step].classList.add("now");
      go.textContent = step === lis.length - 1 ? "다 읽었어요 ✓" : "읽었어요 ▶";
      place(cur.chip); return;
    }
    close(true);
  }
  function close(finished) {
    if (!cur) return;
    const { item, chip } = cur;
    emit("stretch_read", { item_id: "stretch-" + item.w, word: item.w, ...(item.rule ? { target_rule_id: item.rule } : {}),
                           steps: Math.max(0, step + 1), total_steps: item.chunks.length, completed: !!finished, duration_ms: Date.now() - opened });
    if (finished) { done.add(item.w); chip.classList.add("done"); chip.setAttribute("aria-label", "늘려 읽기 다 했어요: " + item.w); }
    pop.hidden = true; cur = null; chip.focus();
  }

  // 나누어 읽기 문장에서 어절 끝자리를 찾아 바로 뒤에 단추를 넣는다(확장 읽기 단추로 글자가 나뉘어 있어도 찾는다).
  function decorate() {
    document.querySelectorAll(".sentence-layout .reading-sentence").forEach(p => {
      const text = p.textContent || "";
      const index = (lesson.sentences || []).findIndex(s => s.text === text);
      const list = DATA[String(index)] || [];
      list.forEach(item => {
        if (p.querySelector(`.xr-chip[data-w="${CSS.escape(item.w)}"]`)) return;
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest(".xr-chip") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
        const nodes = []; let all = "";
        while (walker.nextNode()) { nodes.push([walker.currentNode, all.length]); all += walker.currentNode.data; }
        let at = -1, from = 0;
        while ((at = all.indexOf(item.w, from)) >= 0) {
          const before = all[at - 1] || " ", after = all[at + item.w.length] || " ";
          if (/[\s,.“‘(「]/.test(before) && /[\s,.!?”’)」]/.test(after)) break;
          from = at + 1;
        }
        if (at < 0) return;
        const end = at + item.w.length;
        const hit = nodes.find(([n, o]) => end > o && end <= o + n.data.length); if (!hit) return;
        const [node, off] = hit;
        if (node.parentElement.closest("button")) return;            // 다른 단추 안에는 넣지 않는다
        const rest = node.splitText(end - off);
        // 낱말이 한 글자 마디 안에 다 있으면 낱말+단추를 한 덩이(.xr-word, 줄바꿈 금지)로 묶는다 — 단추만 다음 줄로 떨어지지 않게
        let wrap = null;
        if (at >= off) {
          const word = node.splitText(at - off);                    // node = 앞부분, word = 낱말
          wrap = document.createElement("span"); wrap.className = "xr-word";
          word.parentNode.insertBefore(wrap, word); wrap.append(word);
        }
        const chip = document.createElement("button");
        chip.type = "button"; chip.className = "xr-chip" + (done.has(item.w) ? " done" : ""); chip.dataset.w = item.w;
        chip.dataset.track = "hint"; chip.dataset.helpLevel = "A2"; chip.dataset.helpType = "stretch-reading";
        chip.setAttribute("aria-label", (done.has(item.w) ? "늘려 읽기 다 했어요: " : "늘려 읽기: ") + item.w); chip.title = "늘려 읽기";
        chip.addEventListener("click", e => { e.stopPropagation(); open(item, chip); });
        if (wrap) wrap.append(chip); else rest.parentNode.insertBefore(chip, rest);
      });
    });
  }
  let queued = false;
  const mo = new MutationObserver(() => { if (queued) return; queued = true; setTimeout(() => { queued = false; decorate(); }, 0); });
  function boot() { decorate(); mo.observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.addEventListener("resize", () => { if (cur && pop && !pop.hidden) place(cur.chip); });
  document.addEventListener("click", e => { if (pop && !pop.hidden && !pop.contains(e.target) && !e.target.closest(".xr-chip")) close(false); });
})();
