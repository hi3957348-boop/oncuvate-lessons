/* 읽기 첨삭 — 「잘했다/못했다」 대신 **읽은 글 위에 직접 표시**한다.
 *
 * 왜 이 모양인가
 *  - 점수·판정 문구는 아이 화면에서 금지다(규격 8장 · 통합규격 §10.5의 「3단계 속도판정 제거」).
 *    그리고 「보통이에요」는 무엇을 고칠지 알려 주지 않는다.
 *  - 대신 **어디가 어떻게 달랐는지**를 글자 위에 표시하고, 그 표시를 누르면
 *    ① 올바른 읽기를 **들려주고** ② 왜 그런지 **명시적으로 적어 준다**.
 *
 * 쓰는 곳: shared.js의 renderDetailedAssessment(문장 읽기·전체 읽기) · reading-check-v1(게임 뒤 읽기).
 * 소리: window.ONQ_AUDIO(미리 만든 클립) → 없으면 speechSynthesis.
 */
(() => {
  "use strict";

  const esc = value => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // 규칙 id → 아이가 읽을 말. 51·60번에서 정한 열셋을 그대로 쓴다.
  const RULE_SAY = {
    codaNeutralization: "받침 소리가 같아요",
    liaison: "받침이 뒤로 넘어가요",
    neutralizedLiaison: "대표음으로 바뀐 뒤 넘어가요",
    clusterReduction: "겹받침 중 하나만 소리 나요",
    clusterLiaison: "겹받침이 나뉘어 넘어가요",
    nasalization: "콧소리로 바뀌어요",
    lateralization: "ㄹ소리로 바뀌어요",
    palatalization: "ㄷ·ㅌ이 ㅈ·ㅊ으로 바뀌어요",
    tensification: "된소리로 바뀌어요",
    aspiration: "거센소리로 바뀌어요",
    hDeletion: "ㅎ이 사라져요",
    nInsertion: "없던 ㄴ이 생겨요",
    compoundJuncture: "낱말이 붙으면 소리가 달라져요"
  };

  // ── 표시할 것 모으기 ────────────────────────────────────────────────
  // errors[]와 phonological_rules[]가 같은 낱말을 두 번 말할 수 있다. 낱말로 합친다.
  function collectMarks(result) {
    const byWord = new Map();
    const add = (word, patch) => {
      const key = String(word || "").trim();
      if (!key) return;
      byWord.set(key, Object.assign({ word: key }, byWord.get(key) || {}, patch));
    };
    (result.errors || []).forEach(item => add(item.target || item.word, {
      heard: item.heard || "",
      note: item.note || item.type || "",
      say: item.expected_pronunciation || ""
    }));
    (result.phonological_rules || []).forEach(item => {
      if (item.applied) return;                       // 잘 지킨 규칙은 표시하지 않는다
      add(item.word, {
        ruleId: item.rule || "",
        note: item.feedback || byWord.get(String(item.word || "").trim())?.note || "",
        say: item.expected_pronunciation || byWord.get(String(item.word || "").trim())?.say || ""
      });
    });
    return byWord;
  }

  // ── 첨삭 화면 ──────────────────────────────────────────────────────
  function render(target, result) {
    const text = String(target || "").trim();
    if (!text) return "";
    const marks = collectMarks(result || {});
    const words = text.split(/\s+/);

    const pieces = words.map(word => {
      // 「긁을」이 「긁을」·「긁을,」처럼 구두점을 달고 있을 수 있어 느슨하게 맞춘다.
      const bare = word.replace(/[.,!?·"'”’]+$/g, "");
      const hit = marks.get(bare) || marks.get(word);
      const chunk = hit
        ? `<button class="ra-word wrong" type="button" data-ra-word="${esc(bare)}"
             aria-label="${esc(bare)} — 다시 살펴볼 낱말. 눌러서 바른 소리를 들어요">${esc(word)}</button>`
        : `<span class="ra-word">${esc(word)}</span>`;
      return chunk;
    }).join(" ");

    const data = {};
    marks.forEach((value, key) => { data[key] = value; });

    return `<section class="reading-annotate" aria-label="읽기 첨삭"
              data-ra-marks="${esc(JSON.stringify(data))}">
      <p class="ra-caption">${marks.size
        ? "표시된 낱말을 눌러 보세요. 바른 소리를 들려줄게요."
        : "표시할 곳이 없어요. 읽은 그대로예요."}</p>
      <p class="ra-text">${pieces}</p>
      <div class="ra-detail" hidden></div>
    </section>`;
  }

  // ── 표시를 누르면 ──────────────────────────────────────────────────
  function speak(text) {
    if (!text) return;
    if (window.ONQ_AUDIO && window.ONQ_AUDIO.resolve && window.ONQ_AUDIO.resolve(text)) {
      window.ONQ_AUDIO.play(text);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (_) { /* 소리가 없어도 설명은 남는다 */ }
  }

  function openDetail(root, word) {
    let marks = {};
    try { marks = JSON.parse(root.dataset.raMarks || "{}"); } catch (_) { marks = {}; }
    const info = marks[word];
    const box = root.querySelector(".ra-detail");
    if (!info || !box) return;

    const say = info.say || word;
    const rule = info.ruleId ? RULE_SAY[info.ruleId] : "";
    // 「무엇이 어떻게 달랐나」를 먼저, 규칙 이름은 그 뒤에. 규칙만 던지면 아이가 못 읽는다.
    // 들린 것과 바른 소리가 같으면 나란히 놓지 않는다 — 같은 글자가 두 번 뜨면
    // 「무엇이 다른가」가 안 보이고 아이가 더 헷갈린다.
    const differs = info.heard && String(info.heard).trim() !== String(say).trim();
    const compare = differs
      ? `<div class="ra-compare"><span><small>이렇게 읽었어요</small><b>${esc(info.heard)}</b></span>
           <i aria-hidden="true">→</i>
           <span class="right"><small>이렇게 읽어요</small><b>${esc(say)}</b></span></div>`
      : `<div class="ra-compare"><span class="right"><small>이렇게 읽어요</small><b>${esc(say)}</b></span></div>`;

    box.innerHTML = `<div class="ra-detail-head"><strong>${esc(word)}</strong>
        <button class="ra-listen" type="button" data-ra-listen="${esc(say)}">
          <span aria-hidden="true">🔊</span> 들어보기</button>
        <button class="ra-close" type="button" data-ra-close aria-label="설명 닫기">✕</button></div>
      ${compare}
      ${rule ? `<p class="ra-rule"><b>${esc(rule)}</b></p>` : ""}
      ${info.note ? `<p class="ra-note">${esc(info.note)}</p>` : ""}`;
    box.hidden = false;
    root.querySelectorAll(".ra-word.wrong").forEach(node => {
      node.classList.toggle("open", node.dataset.raWord === word);
    });
    speak(say);                                        // 누르면 바로 들려준다
    try {
      window.dispatchEvent(new CustomEvent("oncuvate:event", { detail: {
        event_type: "annotation_open", item_id: word, target_rule_id: info.ruleId || undefined
      }}));
    } catch (_) {}
  }

  document.addEventListener("click", event => {
    const node = event.target instanceof Element ? event.target : null;
    if (!node) return;
    const listen = node.closest("[data-ra-listen]");
    if (listen) { speak(listen.dataset.raListen); return; }
    const close = node.closest("[data-ra-close]");
    if (close) {
      const root = close.closest(".reading-annotate");
      if (root) {
        root.querySelector(".ra-detail").hidden = true;
        root.querySelectorAll(".ra-word.open").forEach(item => item.classList.remove("open"));
      }
      return;
    }
    const word = node.closest("[data-ra-word]");
    if (!word) return;
    const root = word.closest(".reading-annotate");
    if (root) openDetail(root, word.dataset.raWord);
  });

  // ── 속도 — 분당 음절 수 ────────────────────────────────────────────
  // 통합규격 §10.5: 속도는 **자동성 해석을 위한 참고치**다. 분당 음절 수로 재고,
  // **속도만으로 수준을 판정하지 않는다.** 그래서 값과 산식만 내고 등급은 붙이지 않는다.
  // 아이 화면에는 아예 내지 않는다(§10.5 「3단계 속도판정은 아동 화면에서 제거」).
  function syllablesPerMinute(target, result) {
    const metrics = (result || {}).metrics || {};
    const ms = Number(metrics.speaking_duration_ms) || Number(metrics.total_duration_ms) || 0;
    const syllables = (String(target || "").match(/[가-힣]/g) || []).length;
    if (!ms || !syllables) return null;
    return {
      spm: Math.round(syllables / (ms / 60000)),
      syllables,
      seconds: Math.round(ms / 100) / 10,
      formula: `${syllables}음절 ÷ ${(ms / 60000).toFixed(2)}분`
    };
  }

  window.ONQ_READING_ANNOTATE = { render, syllablesPerMinute, RULE_SAY };
})();
