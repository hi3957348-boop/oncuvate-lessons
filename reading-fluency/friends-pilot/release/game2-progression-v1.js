(() => {
  "use strict";

  const pack = window.ONQ_CONTENT_PACK;
  const sessionKey = document.body.dataset.session;
  const lesson = pack?.sessions?.[sessionKey];
  if (!lesson) return;

  const ASSETS = {
    safe: "assets/shield-safe-3d.png",
    monster: "assets/jelly/jellymonster-face.png",
    listening: "assets/jelly/listening.png",
    praise: "assets/jelly/praise.png"
  };
  const LEVELS = [
    { level: 1, size: 4, complexity: "simple", hints: 3, seeds: [2, 3, 21] },
    { level: 2, size: 4, complexity: "complex", hints: 2, seeds: [47, 50, 54] },
    { level: 3, size: 5, complexity: "simple", hints: 2, seeds: [24, 39, 64] },
    { level: 4, size: 5, complexity: "complex", hints: 1, seeds: [67, 237, 333] },
    { level: 5, size: 6, complexity: "complex", hints: 1, seeds: [446, 705, 948] }
  ];
  const PALETTE = ["#FCE7DA", "#F7DDD8", "#F9EFCB", "#F7E1E7", "#E7E8F7", "#E2EDF5"];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const storageKey = `oncuvate:friends:game2:v2:${sessionKey}`;

  // 타일은 **content-pack에서 만든다.** 예전에는 회차별 목록을 이 파일에 박아 두어
  // ①책을 바꾸면 지난 책 낱말이 뜨고 ②그 낱말은 음성 목록에 없어 **소리가 안 났다.**
  //
  //   목표(target:true) = game2의 낱말 — 오늘 겨냥하는 소리
  //   아닌 것(false)    = wordPool의 related:false — 분명히 이 책 밖의 낱말
  //
  // 두 가지를 더 거른다.
  //   · 띄어쓴 것 — 소리가 구·문장으로 나간다(이 활동은 낱말 하나를 읽는 자리다)
  //   · 음성이 없는 것 — 눌렀는데 조용한 칸이 생긴다
  const source = (() => {
    const lesson = window.ONQ_CONTENT_PACK?.sessions?.[sessionKey] || {};
    const audio = window.ONQ_AOEDE_AUDIO_MAP || null;
    const tag = sessionKey.replace("session", "s");

    // 소리가 있는 낱말 하나짜리만 타일이 된다.
    //  · 띄어쓴 것 — 소리가 구·문장으로 나간다(여기는 낱말 하나를 읽는 자리다)
    //  · 소리 없는 것 — 눌렀는데 조용한 칸이 된다
    const usable = (value) => {
      const text = String(value || "").trim();
      if (!text || text.length < 2 || /\s/.test(text)) return "";
      if (audio && !audio[text]) return "";
      return text;
    };

    const targets = [];
    const seen = new Set();
    (lesson.game2 || []).forEach((item) => {
      const word = usable(item.word);
      if (!word || seen.has(word)) return;
      seen.add(word);
      targets.push({ id: `${tag}-t${targets.length + 1}`, shortLabel: word, prompt: word, target: true });
    });

    // 나머지 칸은 **본문 어절**로 채운다 — 같은 낱말만 돌면 지루하다.
    const others = [];
    const pushOther = (value) => {
      const word = usable(value);
      if (!word || seen.has(word)) return;
      seen.add(word);
      others.push({ id: `${tag}-o${others.length + 1}`, shortLabel: word, prompt: word, target: false });
    };
    (lesson.wordPool || []).forEach((item) => { if (item.related === false) pushOther(item.word); });
    (lesson.sentences || []).forEach((item) => {
      String(item.text || "").replace(/[.,!?"\u201c\u201d\u2018\u2019]/g, " ")
        .split(/\s+/).forEach(pushOther);
    });

    // 겨냥이 묻히지 않게 아닌 것을 너무 많이 넣지는 않는다.
    return [...targets, ...others.slice(0, Math.max(12, targets.length * 3))];
  })();

  function rng(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value + 0x6D2B79F5) >>> 0;
      let mixed = value;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffled(values, random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  const permutationsCache = new Map();
  function validPermutations(size) {
    if (permutationsCache.has(size)) return permutationsCache.get(size);
    const result = [];
    const used = new Set();
    const walk = columns => {
      if (columns.length === size) { result.push([...columns]); return; }
      for (let column = 0; column < size; column += 1) {
        if (used.has(column)) continue;
        if (columns.length && Math.abs(columns[columns.length - 1] - column) === 1) continue;
        used.add(column); columns.push(column); walk(columns); columns.pop(); used.delete(column);
      }
    };
    walk([]);
    permutationsCache.set(size, result);
    return result;
  }

  function growRegions(size, solution, random, complexity) {
    const regions = Array(size * size).fill(-1);
    solution.forEach((column, row) => { regions[row * size + column] = row; });
    let remaining = size * size - size;
    let guard = 0;
    while (remaining > 0 && guard < 10000) {
      guard += 1;
      const frontier = [];
      regions.forEach((region, index) => {
        if (region < 0) return;
        const row = Math.floor(index / size), column = index % size;
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
          const rr = row + dr, cc = column + dc, next = rr * size + cc;
          if (rr >= 0 && rr < size && cc >= 0 && cc < size && regions[next] < 0) frontier.push([next, region]);
        });
      });
      if (!frontier.length) return null;
      let pick;
      if (complexity === "simple") {
        const sizes = Array(size).fill(0);
        regions.forEach(region => { if (region >= 0) sizes[region] += 1; });
        frontier.sort((left, right) => sizes[left[1]] - sizes[right[1]] || left[0] - right[0]);
        pick = frontier[Math.floor(random() * Math.min(frontier.length, size + 1))];
      } else {
        pick = frontier[Math.floor(random() * frontier.length)];
      }
      if (regions[pick[0]] < 0) { regions[pick[0]] = pick[1]; remaining -= 1; }
    }
    return remaining === 0 ? regions : null;
  }

  function solveBoard(size, regions, limit = 2) {
    const solutions = [];
    for (const columns of validPermutations(size)) {
      const counts = Array(size).fill(0);
      columns.forEach((column, row) => { counts[regions[row * size + column]] += 1; });
      if (counts.every(count => count === 1)) {
        solutions.push(columns);
        if (solutions.length >= limit) break;
      }
    }
    return solutions;
  }

  function generateDefinition(config, requestedSeed) {
    for (let offset = 0; offset < 5000; offset += 1) {
      const seed = requestedSeed + offset;
      const random = rng(seed);
      const solution = shuffled(Array.from({ length: config.size }, (_, index) => index), random);
      if (solution.some((column, row) => row > 0 && Math.abs(solution[row - 1] - column) === 1)) continue;
      const regions = growRegions(config.size, solution, random, config.complexity);
      if (!regions) continue;
      const solved = solveBoard(config.size, regions);
      if (solved.length !== 1 || solved[0].some((column, row) => column !== solution[row])) continue;
      return { seed, size:config.size, complexity:config.complexity, regions, solution, solutionCount:solved.length };
    }
    throw new Error(`Game2 board generation failed: L${config.level}/${requestedSeed}`);
  }

  const definitions = LEVELS.map(config => config.seeds.map(seed => generateDefinition(config, seed)));

  function buildReadingBoard(size, seed) {
    const count = size * size;
    const balanced = Array.from({ length:count }, (_, index) => ({ ...source[index % source.length], copy:index }));
    const random = rng(seed ^ 0x9E3779B9);
    let fallback = balanced;
    for (let attempt = 0; attempt < 400; attempt += 1) {
      const candidate = shuffled(balanced, random);
      fallback = candidate;
      const adjacentRepeat = candidate.some((item, index) =>
        (index % size > 0 && candidate[index - 1].id === item.id) ||
        (index >= size && candidate[index - size].id === item.id)
      );
      if (!adjacentRepeat) return candidate;
    }
    return fallback;
  }

  function blankState() {
    return {
      levelIndex:0, boardIndex:0, phase:"board", marks:[], revealed:[], pending:null, ready:false,
      hints:LEVELS[0].hints, metrics:{}, reviewItems:[], reviewIndex:0, recognitionOn:false,
      recognitionFailures:0, message:"색 타일을 골라 보세요.", boardShownAt:performance.now()
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!saved || saved.levelIndex < 0 || saved.levelIndex >= LEVELS.length || saved.boardIndex < 0 || saved.boardIndex > 2) return blankState();
      return { ...blankState(), ...saved, pending:null, ready:false, boardShownAt:performance.now() };
    } catch { return blankState(); }
  }

  const state = loadState();
  let recognition = null;
  let audioBusy = false;
  let scheduled = false;

  function currentConfig() { return LEVELS[state.levelIndex]; }
  function currentDefinition() { return definitions[state.levelIndex][state.boardIndex]; }
  function currentReading() { const def = currentDefinition(); return buildReadingBoard(def.size, def.seed); }
  function monsterIndexes(def = currentDefinition()) { return new Set(def.solution.map((column, row) => row * def.size + column)); }
  function persist() {
    const saved = { ...state, pending:null, ready:false, boardShownAt:undefined };
    localStorage.setItem(storageKey, JSON.stringify(saved));
  }

  function emit(type, payload = {}) {
    const event = {
      event_type:type, lesson_id:lesson.lessonId, lesson_version:pack.version, session_id:sessionKey,
      activity_id:"intervention.word_phrase", timestamp:new Date().toISOString(), ...payload
    };
    window.ONQ_EVENT_SINK?.(event);
    window.dispatchEvent(new CustomEvent("oncuvate:event", { detail:event }));
  }

  function setAudioBusy(value) {
    audioBusy = Boolean(value);
    document.body.toggleAttribute("data-game2-audio-busy", audioBusy);
  }

  function speak(text) {
    if (audioBusy) return false;
    const release = () => setAudioBusy(false);
    setAudioBusy(true);
    if (window.ONQ_AUDIO?.play(text, { onended:release, onerror:release })) return true;
    if (!("speechSynthesis" in window)) { release(); return false; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = .82;
    utterance.onend = release;
    utterance.onerror = release;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => /^ko/i.test(voice.lang) && /natural|neural|sunhi|injoon|online/i.test(voice.name)) || voices.find(voice => /^ko/i.test(voice.lang)) || null;
    speechSynthesis.speak(utterance);
    return true;
  }

  function metric(itemId) {
    if (!state.metrics[itemId]) state.metrics[itemId] = { replays:0, retries:0, hints:0, latency:0, attempts:0 };
    return state.metrics[itemId];
  }

  function canonical(text) {
    return String(text || "").normalize("NFD").replace(/[\s.,!?"'’“”]/g, "").replace(/ᅢ/g,"ᅦ")
      .replace(/[ᄏᄁ]/g,"ᄀ").replace(/[ᄐᄄ]/g,"ᄃ").replace(/[ᄑᄈ]/g,"ᄇ").replace(/[ᄎᄍ]/g,"ᄌ");
  }

  function similarity(left, right) {
    const a = canonical(left), b = canonical(right);
    const matrix = Array.from({ length:a.length + 1 }, (_, row) => Array(b.length + 1).fill(0));
    for (let row = 0; row <= a.length; row += 1) matrix[row][0] = row;
    for (let column = 0; column <= b.length; column += 1) matrix[0][column] = column;
    for (let row = 1; row <= a.length; row += 1) for (let column = 1; column <= b.length; column += 1) {
      matrix[row][column] = Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1));
    }
    let distance = matrix[a.length][b.length];
    if (a.endsWith("ᆷ") && !b.endsWith("ᆷ")) distance = Math.min(distance, matrix[a.length - 1][b.length]);
    return 1 - distance / Math.max(a.length, b.length, 1);
  }

  function stateIcon(mark) {
    if (!mark) return "";
    const safe = mark === "safe";
    return `<span class="g2p-state-icon ${safe ? "safe" : "monster"}"><img src="${safe ? ASSETS.safe : ASSETS.monster}" alt=""><span class="g2p-sr-only">${safe ? "안전" : "젤리 몬스터"}</span></span>`;
  }

  function boardMarkup(def, reading) {
    const monsters = monsterIndexes(def);
    return reading.map((item, index) => {
      const revealed = state.revealed.includes(index), mark = state.marks[index] || "", pending = state.pending === index;
      const label = mark ? `${mark === "safe" ? "안전" : "젤리 몬스터"}으로 표시됨` : revealed ? `${item.shortLabel}가 보임` : "아직 열지 않은 색 타일";
      return `<button type="button" role="gridcell" class="g2p-cell ${revealed ? "revealed" : "covered"} ${pending ? "pending" : ""} ${mark}" style="--region:${PALETTE[def.regions[index] % PALETTE.length]}" data-g2p-cell="${index}" aria-label="${index + 1}번 타일, ${label}" data-solution-test="${monsters.has(index) ? "monster" : "safe"}">
        <span class="g2p-cell-face">${revealed ? `<span class="g2p-word">${item.shortLabel}</span>` : ""}</span>${stateIcon(mark)}
      </button>`;
    }).join("");
  }

  function toggleMarkup() {
    return `<label class="g2p-recognition"><input type="checkbox" data-g2p-action="recognition" ${state.recognitionOn ? "checked" : ""}><span>음성 인식 ${state.recognitionOn ? "켬" : "끔"}</span></label>`;
  }

  function renderBoard(view) {
    const config = currentConfig(), def = currentDefinition(), reading = currentReading();
    const selected = state.pending == null ? null : reading[state.pending];
    const found = state.marks.filter(mark => mark === "monster").length;
    view.innerHTML = `<div class="override-game2 progression-game2" style="--board-size:${def.size}" data-level="${config.level}" data-complexity="${config.complexity}">
      <div class="g2p-topbar"><div><strong>단계 ${config.level}</strong><span>${state.boardIndex + 1} / 3 보드</span></div><span>젤리 몬스터 ${found} / ${def.size}</span><button type="button" data-action="open-modal">활동 안내</button></div>
      <div class="g2p-layout">
        <section class="g2p-board-panel"><div class="g2p-rule"><span>가로·세로·색 구역마다 하나</span><span>대각선으로 붙지 않아요</span></div><div class="g2p-board" role="grid" aria-label="${def.size} 곱하기 ${def.size} 젤리 몬스터 찾기">${boardMarkup(def, reading)}</div></section>
        <aside class="g2p-side">
          <div class="g2p-reading">${selected ? `<button type="button" data-g2p-action="replay">다시 듣기</button><strong>${selected.prompt}</strong><p>${state.ready ? "읽은 뒤 알맞은 표시를 골라요." : "소리를 듣고 읽어 봐요."}</p>` : `<strong>색 타일을 골라요</strong><p>열면 읽을 말이 나타나요.</p>`}</div>
          ${toggleMarkup()}
          <div class="g2p-decisions"><button type="button" data-g2p-action="safe" aria-label="안전으로 표시" ${state.pending == null || !state.ready ? "disabled" : ""}><img src="${ASSETS.safe}" alt=""><span>안전</span></button><button type="button" data-g2p-action="monster" aria-label="젤리 몬스터로 표시" ${state.pending == null || !state.ready ? "disabled" : ""}><img src="${ASSETS.monster}" alt=""><span>젤리 몬스터</span></button></div>
          <p class="g2p-message" role="status">${state.message}</p>
          <div class="g2p-tools"><button type="button" data-g2p-action="hint" ${state.hints <= 0 ? "disabled" : ""}>힌트 ${state.hints}</button><button type="button" data-g2p-action="reset">이 보드 다시 하기</button>${state.recognitionFailures >= 2 && state.pending != null ? `<button type="button" data-g2p-action="reading-skip">다음으로 넘어가기</button>` : ""}</div>
        </aside>
      </div>
    </div>`;
  }

  function uniqueReviewItems() {
    const reading = currentReading();
    const seen = new Set();
    const ranked = reading.map(item => ({
      item,
      score:(item.target ? 1000 : 0) + item.shortLabel.length * 14 + (state.metrics[item.id]?.retries || 0) * 130 + (state.metrics[item.id]?.replays || 0) * 90 + (state.metrics[item.id]?.hints || 0) * 150
    })).sort((left, right) => right.score - left.score);
    const result = [];
    for (const entry of ranked) {
      if (seen.has(entry.item.id)) continue;
      seen.add(entry.item.id); result.push(entry.item);
      if (result.length === 3) break;
    }
    return result;
  }

  function renderReview(view) {
    const item = state.reviewItems[state.reviewIndex];
    if (!item) { state.phase = "levelComplete"; persist(); renderLevelComplete(view); return; }
    view.innerHTML = `<div class="override-game2 progression-game2 g2p-review">
      <div class="g2p-topbar"><div><strong>단계 ${currentConfig().level}</strong><span>다시 말해 보기 ${state.reviewIndex + 1} / 3</span></div><button type="button" data-action="open-modal">활동 안내</button></div>
      <section class="g2p-review-card"><button type="button" class="g2p-listen" data-g2p-action="review-listen" aria-label="${item.shortLabel} 듣기"><img src="${ASSETS.listening}" alt="귀 기울이는 젤리티처"></button><span>다시 말해 보기</span><strong>${item.shortLabel}</strong><p role="status">${state.message}</p>${toggleMarkup()}<div><button type="button" data-g2p-action="review-done">${state.recognitionOn ? "말했어요" : "따라 읽었어요"}</button>${state.recognitionFailures >= 2 ? `<button type="button" data-g2p-action="review-skip">다음으로 넘어가기</button>` : ""}</div></section>
    </div>`;
  }

  function renderLevelComplete(view) {
    const finalLevel = state.levelIndex === LEVELS.length - 1;
    view.innerHTML = `<div class="override-game2 progression-game2 g2p-level-complete"><section><img src="${ASSETS.praise}" alt="기뻐하는 젤리티처"><span>단계 ${currentConfig().level} 완료</span><strong>세 보드와 다시 말하기를 마쳤어요.</strong><div>${finalLevel ? `<button type="button" data-g2p-action="finish">활동 마치기</button>` : `<button type="button" data-g2p-action="next-level">다음 단계</button>`}<button type="button" data-g2p-action="stop">오늘은 여기까지</button></div></section></div>`;
  }

  function render() {
    const stepId = document.querySelector(".step-btn.active")?.dataset.stepId
                || document.querySelector("main")?.dataset.stepId;
    if (stepId !== "game2") return;
    const view = document.querySelector(".activity-view");
    if (!view || view.querySelector(".progression-game2")) return;
    redraw(view);
  }

  function redraw(view = document.querySelector(".activity-view")) {
    if (!view) return;
    if (state.phase === "review") renderReview(view);
    else if (state.phase === "levelComplete") renderLevelComplete(view);
    else renderBoard(view);
  }

  function selectCell(index) {
    if (state.phase !== "board" || state.pending != null || state.marks[index]) return;
    const reading = currentReading(), item = reading[index];
    if (!state.revealed.includes(index)) state.revealed.push(index);
    state.pending = index; state.ready = false; state.recognitionFailures = 0;
    const data = metric(item.id);
    data.latency += performance.now() - state.boardShownAt;
    // 처음 여는 낱말만 저절로 들려준다. 다시 열 때까지 소리가 따라오면
    // 아이가 듣기만 하고 넘어가기 쉬워, 두 번째부터는 「다시 듣기」로 청하게 한다.
    if (!data.heard) {
      data.heard = true;
      state.message = "소리를 듣고 짧은 글을 읽어 봐요.";
      speak(item.shortLabel);
    } else {
      state.message = "읽어 봐요. 소리가 필요하면 ‘다시 듣기’를 눌러요.";
    }
    emit("reading_attempt", { item_id:item.id, board_index:index, level:currentConfig().level, board_number:state.boardIndex + 1, text:item.prompt, transcript:null, correct:null, measurement_state:"notMeasured", assistance_level:"notMeasured", replay_count:data.replays, latency_ms:Math.round(data.latency) });
    persist(); redraw();
    setTimeout(() => {
      if (state.pending !== index) return;
      state.ready = true; state.message = "안전인지 젤리 몬스터인지 골라요."; persist(); redraw();
    }, reducedMotion.matches ? 250 : 900);
  }

  function decide(kind) {
    if (state.pending == null || !state.ready) return;
    const index = state.pending, reading = currentReading(), item = reading[index];
    const answer = monsterIndexes().has(index) ? "monster" : "safe";
    const correct = kind === answer;
    if (correct === false) state.boardWrong = (state.boardWrong || 0) + 1;
    emit("mine_decision", { item_id:`L${currentConfig().level}-B${state.boardIndex + 1}-C${index}`, board_index:index, level:currentConfig().level, board_number:state.boardIndex + 1, response:kind, correct, reading_item_id:item.id });
    if (!correct) {
      metric(item.id).retries += 1; state.recognitionFailures += 1;
      state.message = "보드 규칙을 다시 살펴봐요."; state.pending = null; state.ready = false; persist(); redraw(); return;
    }
    state.marks[index] = kind; state.pending = null; state.ready = false;
    state.message = kind === "monster" ? "젤리 몬스터를 찾았어요." : "안전한 타일이에요.";
    const found = state.marks.filter(mark => mark === "monster").length;
    if (found === currentDefinition().size) completeBoard();
    persist(); redraw();
  }

  function completeBoard() {
    emit("activity_complete", { completion:"logic_board", level:currentConfig().level, board_number:state.boardIndex + 1, board_seed:currentDefinition().seed,
      accuracy:(window.ONQ_ACCURACY || (f => f > 0 ? "self-corrected" : "accurate"))(state.boardWrong || 0, (currentConfig().hints - state.hints) > 0),
      hints_used:currentConfig().hints - state.hints, wrong_marks:state.boardWrong || 0 });
    if (state.boardIndex < 2) {
      state.boardIndex += 1; state.marks = []; state.revealed = []; state.pending = null; state.ready = false; state.boardWrong = 0;
      state.hints = currentConfig().hints; state.message = "새 보드가 열렸어요."; state.boardShownAt = performance.now();
    } else {
      state.reviewItems = uniqueReviewItems(); state.reviewIndex = 0; state.phase = "review";
      state.message = "먼저 듣고 따라 말해 보세요."; state.recognitionFailures = 0;
    }
  }

  function useHint() {
    if (state.hints <= 0) return;
    const monsters = monsterIndexes();
    const safeIndex = currentReading().findIndex((_, index) => !monsters.has(index) && !state.marks[index]);
    if (safeIndex < 0) return;
    state.marks[safeIndex] = "safe"; state.revealed.push(safeIndex); state.hints -= 1;
    const item = currentReading()[safeIndex]; metric(item.id).hints += 1;
    state.message = "안전한 타일 하나를 알려 줬어요.";
    emit("hint", { item_id:item.id, board_index:safeIndex, level:currentConfig().level, board_number:state.boardIndex + 1, hint_level:"safe_tile", assistance_level:"A1" });
    persist(); redraw();
  }

  function resetBoard() {
    state.marks = []; state.revealed = []; state.pending = null; state.ready = false; state.hints = currentConfig().hints; state.boardWrong = 0;
    state.message = "이 보드를 처음부터 다시 해요."; state.boardShownAt = performance.now(); persist(); redraw();
  }

  function currentSpeechItem() {
    if (state.phase === "review") return state.reviewItems[state.reviewIndex] || null;
    return state.pending == null ? null : currentReading()[state.pending];
  }

  function handleTranscript(transcript) {
    const item = currentSpeechItem();
    if (!item) return;
    const score = similarity(item.shortLabel, transcript), correct = score >= .75;
    const data = metric(item.id); data.attempts += 1;
    state.message = correct ? "잘 들렸어요." : "한 번 더 천천히 읽어 봐요.";
    state.recognitionFailures = correct ? 0 : state.recognitionFailures + 1;
    emit("reading_attempt", { item_id:item.id, text:item.shortLabel, transcript, correct, similarity:score, measurement_state:"autoConfirmed", attempt:data.attempts });
    persist(); redraw();
  }

  function startRecognition() {
    if (recognition) return;
    if (window.ONQ_SPEECH_ADAPTER?.startContinuous) {
      recognition = window.ONQ_SPEECH_ADAPTER.startContinuous({ lang:"ko-KR", onResult:handleTranscript });
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const item = currentSpeechItem();
      state.message = "음성 평가가 연결되지 않았어요. 음성 인식을 끄고 계속할 수 있어요.";
      if (item) emit("reading_attempt", { item_id:item.id, measurement_state:"notMeasured", transcript:null, correct:null, assistance_level:"notMeasured" });
      redraw(); return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = "ko-KR"; recognition.continuous = true; recognition.interimResults = false;
    recognition.onresult = event => handleTranscript(event.results[event.results.length - 1][0].transcript);
    recognition.onerror = () => { state.message = "소리를 확인하지 못했어요. 다시 읽어 보세요."; state.recognitionFailures += 1; redraw(); };
    recognition.onend = () => { if (state.recognitionOn) try { recognition.start(); } catch {} };
    try { recognition.start(); } catch {}
  }

  function advanceReview() {
    const item = state.reviewItems[state.reviewIndex];
    if (item) emit("reading_attempt", { item_id:item.id, text:item.shortLabel, transcript:null, correct:null, measurement_state:"notMeasured", assistance_level:"notMeasured" });
    state.reviewIndex += 1; state.recognitionFailures = 0; state.message = "먼저 듣고 따라 말해 보세요."; persist(); redraw();
  }

  function nextLevel() {
    if (state.levelIndex >= LEVELS.length - 1) return finishActivity();
    state.levelIndex += 1; state.boardIndex = 0; state.phase = "board"; state.marks = []; state.revealed = []; state.boardWrong = 0;
    state.pending = null; state.ready = false; state.hints = currentConfig().hints; state.reviewItems = []; state.reviewIndex = 0;
    state.message = "새 단계의 첫 보드예요."; state.boardShownAt = performance.now(); persist(); redraw();
  }

  function finishActivity() {
    emit("activity_complete", { completion:"game2_progression", highest_level:currentConfig().level, stopped:state.levelIndex < LEVELS.length - 1 });
    document.querySelector('.step-btn[data-step-id="game1"]')?.click();
  }

  document.addEventListener("click", event => {
    if (audioBusy && event.target.closest(".progression-game2 button, .progression-game2 input, .progression-game2 select")) {
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    const cell = event.target.closest("[data-g2p-cell]");
    if (cell) { event.preventDefault(); event.stopImmediatePropagation(); selectCell(Number(cell.dataset.g2pCell)); return; }
    const control = event.target.closest("[data-g2p-action]");
    if (!control) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const action = control.dataset.g2pAction;
    if (action === "safe" || action === "monster") decide(action);
    else if (action === "replay") { const item = currentSpeechItem(); if (item) { metric(item.id).replays += 1; speak(item.shortLabel); emit("replay", { item_id:item.id, level:currentConfig().level }); } }
    else if (action === "hint") useHint();
    else if (action === "reset") resetBoard();
    else if (action === "reading-skip") { state.pending = null; state.ready = false; state.message = "다른 타일로 넘어가요."; persist(); redraw(); }
    else if (action === "review-listen") { const item = currentSpeechItem(); if (item) { metric(item.id).replays += 1; speak(item.shortLabel); } }
    else if (action === "review-done" || action === "review-skip") advanceReview();
    else if (action === "next-level") nextLevel();
    else if (action === "stop" || action === "finish") finishActivity();
  }, true);

  document.addEventListener("change", event => {
    if (audioBusy && event.target.closest(".progression-game2")) { event.preventDefault(); return; }
    if (event.target.dataset.g2pAction !== "recognition") return;
    state.recognitionOn = event.target.checked;
    state.message = state.recognitionOn ? "마이크를 한 번만 연결하고 계속 들어요." : "음성 인식 없이도 계속할 수 있어요.";
    if (state.recognitionOn) startRecognition(); else { try { recognition?.stop?.(); } catch {} recognition = null; }
    persist(); redraw();
  }, true);

  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; render(); });
  });
  observer.observe(document.getElementById("app"), { childList:true, subtree:true });

  window.ONQ_GAME2_PROGRESSION_TEST = {
    validate() {
      const boards = definitions.flatMap((items, levelIndex) => items.map((definition, boardIndex) => ({
        level:levelIndex + 1, board:boardIndex + 1, seed:definition.seed, size:definition.size,
        unique:solveBoard(definition.size, definition.regions).length === 1,
        rowColumnsUnique:new Set(definition.solution).size === definition.size,
        noDiagonal:definition.solution.every((column, row) => row === 0 || Math.abs(definition.solution[row - 1] - column) !== 1),
        regionCounts:Array.from({ length:definition.size }, (_, region) => definition.solution.filter((column, row) => definition.regions[row * definition.size + column] === region).length)
      })));
      return { boards, allValid:boards.every(board => board.unique && board.rowColumnsUnique && board.noDiagonal && board.regionCounts.every(count => count === 1)), eventTypes:["reading_attempt","mine_decision"], readingPuzzleIndependent:source.every(item => !("safe" in item) && !("monster" in item) && !("mine" in item)) };
    },
    state() { return JSON.parse(JSON.stringify(state)); },
    clearProgress() { localStorage.removeItem(storageKey); location.reload(); }
  };

  render();
})();
