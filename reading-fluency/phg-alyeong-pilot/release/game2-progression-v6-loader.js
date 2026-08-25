(() => {
  "use strict";

  function applyDeferredValidation(source, replaceOnce) {
    source = replaceOnce(source,
      'hints:LEVELS[0].hints, hintIndex:null, metrics:{}, reviewItems:[], reviewIndex:0, recognitionOn:false,',
      'hints:LEVELS[0].hints, hintIndex:null, conflictIndexes:[], metrics:{}, reviewItems:[], reviewIndex:0, recognitionOn:false,',
      "conflict state");
    source = replaceOnce(source,
      'const revealed = state.revealed.includes(index), mark = state.marks[index] || "", pending = state.pending === index, hinted = state.hintIndex === index;',
      'const revealed = state.revealed.includes(index), mark = state.marks[index] || "", pending = state.pending === index, hinted = state.hintIndex === index, conflict = state.conflictIndexes.includes(index);',
      "conflict cell state");
    source = replaceOnce(source,
      'class="g2p-cell ${revealed ? "revealed" : "covered"} ${pending ? "pending" : ""} ${hinted ? "forced-hint" : ""} ${mark}"',
      'class="g2p-cell ${revealed ? "revealed" : "covered"} ${pending ? "pending" : ""} ${hinted ? "forced-hint" : ""} ${conflict ? "rule-conflict" : ""} ${mark}"',
      "conflict cell class");
    source = replaceOnce(source,
      '<div class="g2p-tools"><button type="button" data-g2p-action="hint" data-hints-left="${state.hints}" aria-label="힌트 ${state.hints}개 남음" ${state.hints <= 0 ? "disabled" : ""}>힌트 ${state.hints}</button><button type="button" data-g2p-action="reset">재시작</button>',
      '<div class="g2p-tools"><button type="button" class="g2p-check" data-g2p-action="check" ${state.marks.filter(Boolean).length ? "" : "disabled"}>보드 확인</button><button type="button" data-g2p-action="hint" data-hints-left="${state.hints}" aria-label="힌트 ${state.hints}개 남음" ${state.hints <= 0 ? "disabled" : ""}>힌트 ${state.hints}</button><button type="button" data-g2p-action="reset">재시작</button>',
      "board check control");

    const oldSelectStart = `  function selectCell(index) {
    if (state.phase !== "board" || state.pending != null || state.marks[index]) return;`;
    const helpersAndSelect = `  function conflictReport() {
    const def = currentDefinition(), size = def.size, allClassified = state.marks.filter(Boolean).length === size * size;
    const conflict = new Set(), reasons = [];
    puzzleUnits(size, def.regions).forEach(unit => {
      const monsters = unit.cells.filter(index => state.marks[index] === "monster");
      if (monsters.length > 1 || (allClassified && monsters.length !== 1)) { unit.cells.forEach(index => conflict.add(index)); reasons.push(unit.kind); }
    });
    state.marks.forEach((mark, index) => {
      if (mark !== "monster") return;
      const row = Math.floor(index / size), column = index % size;
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => {
        const rr=row+dr, cc=column+dc, next=rr*size+cc;
        if (rr>=0 && rr<size && cc>=0 && cc<size && state.marks[next] === "monster") { conflict.add(index); conflict.add(next); reasons.push("대각선"); }
      });
    });
    return { allClassified, indexes:[...conflict], reasons:[...new Set(reasons)] };
  }

  function checkBoard(automatic = false) {
    const report = conflictReport();
    state.conflictIndexes = report.indexes;
    const correct = report.allClassified && report.indexes.length === 0;
    emit("board_check", { level:currentConfig().level, board_number:state.boardIndex + 1, automatic, correct, classified_count:state.marks.filter(Boolean).length, conflict_types:report.reasons });
    if (correct) { state.message = "보드 규칙을 모두 지켰어요."; completeBoard(); persist(); redraw(); return true; }
    if (report.indexes.length) state.message = "표시한 가로·세로·색 구역을 다시 살펴봐요.";
    else state.message = "아직 표시하지 않은 타일이 있어요.";
    persist(); redraw(); return false;
  }

  function cycleHypothesis(index) {
    const current = state.marks[index];
    const next = current === "safe" ? "monster" : current === "monster" ? null : "safe";
    state.marks[index] = next; state.conflictIndexes = []; state.hintIndex = null;
    emit("mine_decision", { item_id:"L" + currentConfig().level + "-B" + (state.boardIndex + 1) + "-C" + index, board_index:index, level:currentConfig().level, board_number:state.boardIndex + 1, response:next || "unselected", correct:null, measurement_state:"pendingClassification", revision:true });
    state.message = next ? "이 칸을 " + (next === "safe" ? "방패" : "젤리몬스터") + "로 표시했어요." : "이 칸의 표시를 지웠어요.";
    if (state.marks.every(Boolean)) checkBoard(true); else { persist(); redraw(); }
  }

  function selectCell(index) {
    if (state.phase !== "board" || state.pending != null) return;
    if (state.marks[index]) { cycleHypothesis(index); return; }`;
    source = replaceOnce(source, oldSelectStart, helpersAndSelect, "editable hypotheses and board check");

    const decisionPattern = /  function decide\(kind\) \{[\s\S]*?\n  \}\n\n  function completeBoard/;
    const newDecision = `  function decide(kind) {
    if (state.pending == null || !state.ready) return;
    const index = state.pending, reading = currentReading(), item = reading[index];
    state.marks[index] = kind; state.pending = null; state.ready = false; state.conflictIndexes = []; state.hintIndex = null;
    emit("mine_decision", { item_id:"L" + currentConfig().level + "-B" + (state.boardIndex + 1) + "-C" + index, board_index:index, level:currentConfig().level, board_number:state.boardIndex + 1, response:kind, correct:null, measurement_state:"pendingClassification", reading_item_id:item.id });
    state.message = "이 칸을 " + (kind === "safe" ? "방패" : "젤리몬스터") + "로 표시했어요.";
    if (state.marks.every(Boolean)) checkBoard(true); else { persist(); redraw(); }
  }

  function completeBoard`;
    if (!decisionPattern.test(source)) throw new Error("Game2 patch target not found: deferred board validation");
    source = source.replace(decisionPattern, newDecision);
    source = source.replaceAll('state.hintIndex = null; state.hints = currentConfig().hints;', 'state.hintIndex = null; state.conflictIndexes = []; state.hints = currentConfig().hints;');
    source = replaceOnce(source,
      'else if (action === "hint") useHint();',
      'else if (action === "check") checkBoard(false);\n    else if (action === "hint") useHint();',
      "board check event");
    return source;
  }

  const marker = '      Function(`${source}\\n//# sourceURL=game2-progression-v3-runtime.js`)();';
  fetch("release/game2-progression-v3-loader.js?rev=20260825j")
    .then(response => {
      if (!response.ok) throw new Error(`Game2 v3 loader failed: ${response.status}`);
      return response.text();
    })
    .then(loaderSource => {
      if (!loaderSource.includes(marker)) throw new Error("Game2 v6 insertion point missing");
      const insertion = "      source = (" + applyDeferredValidation.toString() + ")(source, replaceOnce);\n";
      Function(`${loaderSource.replace(marker, insertion + marker)}\n//# sourceURL=game2-progression-v6-loader-runtime.js`)();
    })
    .catch(error => {
      console.error(error);
      window.dispatchEvent(new CustomEvent("oncuvate:game2-error", { detail:{ message:error.message } }));
    });
})();
