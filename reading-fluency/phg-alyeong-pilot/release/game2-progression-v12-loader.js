(() => {
  "use strict";

  function latestGame2(source, replaceOnce) {
    source = source.replace(
      /  const LEVELS = \[[\s\S]*?\n  \];/,
      `  const LEVELS = [
    // 레벨이 오를수록 판이 커지고 색 구역도 그만큼 늘어난다(색 수 = 한 변의 칸 수).
    // ⚠️ 3×3은 대각선 인접 금지 규칙 때문에 놓을 자리가 아예 없고(순열 0),
    //    8×8은 유일해가 나오는 판을 찾지 못했다(시드 2,000개·110초 탐색에서 0건).
    //    그래서 4~7이 이 퍼즐의 한계다. 5레벨은 같은 7×7이되 색 구역이 더 들쭉날쭉하다.
    { level:1, size:4, complexity:"simple",  hints:3, seeds:[3,21,47] },
    { level:2, size:5, complexity:"complex", hints:3, seeds:[24,39,64] },
    { level:3, size:6, complexity:"complex", hints:2, seeds:[446,705,948] },
    { level:4, size:7, complexity:"complex", hints:2, seeds:[1187,1767,2921] },
    { level:5, size:7, complexity:"complex", hints:1, seeds:[3041,3531,4836] }
  ];`
    );
    source = source.replace(
      'const PALETTE = ["#FCE7DA", "#F7DDD8", "#F9EFCB", "#F7E1E7", "#E7E8F7", "#E2EDF5"];',
      'const PALETTE = ["#F3C64E", "#EE8873", "#6DA8D5", "#70B694", "#9781C5", "#DE8FAB", "#E7A95E"];'
    );


    source = replaceOnce(source,
      'const definitions = LEVELS.map(config => config.seeds.map(seed => generateDefinition(config, seed)));',
      `const definitions = LEVELS.map(config => config.seeds.map(seed => generateDefinition(config, seed)));
  source.forEach(item => { item.prompt = item.shortLabel.trim().split(/\s+/).slice(0,3).join(" "); });

  function answerMark(definition, index) {
    return definition.solution[Math.floor(index / definition.size)] === index % definition.size ? "monster" : "safe";
  }
  function buildMinimumClues(definition) {
    const marks = Array(definition.size * definition.size).fill(null), clues = [];
    let analysis = forcedAnalysis(definition.size, definition.regions, marks);
    while (!analysis.noGuess) {
      let best = null;
      marks.forEach((mark, index) => {
        if (mark) return;
        const trial = [...marks]; trial[index] = answerMark(definition, index);
        const result = forcedAnalysis(definition.size, definition.regions, trial);
        const score = (result.noGuess ? 1000000 : 0) + result.marks.filter(Boolean).length * 100 + (trial[index] === "monster" ? 1 : 0);
        if (!best || score > best.score) best = { index, score, result };
      });
      if (!best) break;
      marks[best.index] = answerMark(definition, best.index);
      clues.push({ index:best.index, mark:marks[best.index], source:"given" });
      analysis = best.result;
    }
    if (!clues.length) {
      const forced = analysis.moves[0] || { index:0, mark:answerMark(definition, 0) };
      marks[forced.index] = answerMark(definition, forced.index);
      clues.push({ index:forced.index, mark:marks[forced.index], source:"given" });
      analysis = forcedAnalysis(definition.size, definition.regions, marks);
    }
    let changed = true;
    while (changed && clues.length > 1) {      changed = false;
      for (let position = clues.length - 1; position >= 0; position -= 1) {
        if (clues.length <= 1) break;
        const trial = Array(marks.length).fill(null);
        clues.forEach((clue, index) => { if (index !== position) trial[clue.index] = clue.mark; });
        if (forcedAnalysis(definition.size, definition.regions, trial).noGuess) {
          marks[clues[position].index] = null; clues.splice(position, 1); changed = true;
        }
      }
    }
    analysis = forcedAnalysis(definition.size, definition.regions, marks);
    return { clues, noGuess:analysis.noGuess, initialForced:analysis.moves.filter(move => move.round === 1).length, logicalSteps:analysis.moves.length };
  }
  definitions.forEach(boards => boards.forEach(definition => { definition.cluePlan = buildMinimumClues(definition); }));`,
      "minimal visible clues");

    source = replaceOnce(source,
      'hints:LEVELS[0].hints, hintIndex:null, conflictIndexes:[], metrics:{}, reviewItems:[], reviewIndex:0, recognitionOn:false,',
      'hints:LEVELS[0].hints, hintIndex:null, hintClues:[], conflictIndexes:[], metrics:{}, reviewItems:[], reviewIndex:0, recognitionOn:false,',
      "hint clue state");
    source = replaceOnce(source,
      'function monsterIndexes(def = currentDefinition()) { return new Set(def.solution.map((column, row) => row * def.size + column)); }',
      `function monsterIndexes(def = currentDefinition()) { return new Set(def.solution.map((column, row) => row * def.size + column)); }
  function fixedClues(def = currentDefinition()) {
    return [...(def.cluePlan?.clues || []), ...(state.hintClues || [])]
      .filter(clue => Number.isInteger(clue?.index) && clue.index >= 0 && clue.index < def.size * def.size)
      .map(clue => ({ ...clue, mark:answerMark(def, clue.index) }));
  }
  function fixedMap(def = currentDefinition()) { return new Map(fixedClues(def).map(clue => [clue.index, clue])); }
  function isFixed(index) { return fixedMap().has(index); }
  function effectiveMarks(def = currentDefinition()) {
    const marks = Array(def.size * def.size).fill(null);
    state.marks.forEach((mark, index) => { if (mark) marks[index] = mark; });
    fixedClues(def).forEach(clue => { marks[clue.index] = clue.mark; });
    return marks;
  }`,
      "visible clue helpers");

    source = source.replace(/  function boardMarkup\(def, reading\) \{[\s\S]*?\n  \}\n\n  function toggleMarkup/,
      `  function boardMarkup(def, reading) {
    const fixed = fixedMap(def);
    return reading.map((item, index) => {
      const clue = fixed.get(index), mark = clue?.mark || state.marks[index] || "";
      const pending = state.pending === index, conflict = state.conflictIndexes.includes(index);
      return \`<button type="button" role="gridcell" class="g2p-cell revealed \${pending ? "pending" : ""} \${conflict ? "rule-conflict" : ""} \${clue ? "fixed-clue " + clue.source : "user-hypothesis"} \${mark}" style="--region:\${PALETTE[def.regions[index] % PALETTE.length]}" data-g2p-cell="\${index}" aria-label="\${item.shortLabel}\${clue ? ", 고정 단서" : ""}">
        <span class="g2p-cell-face"><span class="g2p-word">\${item.shortLabel}</span></span>\${stateIcon(mark)}
      </button>\`;
    }).join("");
  }

  function toggleMarkup`);

    source = source.replaceAll(
      '${state.pending == null || !state.ready ? "disabled" : ""}',
      '${state.pending == null || !state.ready || isFixed(state.pending) ? "disabled" : ""}'
    );
    source = source.replaceAll('다시 듣기', '젤리 듣기');
    source = source.replace('색 타일을 골라요</strong><p>열면 읽을 말이 나타나요.', '읽을 말을 골라요</strong><p>타일을 누르면 짧은 구가 보여요.');

    source = source.replace(/  function conflictReport\(\) \{[\s\S]*?\n  \}\n\n  function checkBoard/,
      `  function conflictReport() {
    const def = currentDefinition(), size = def.size, marks = effectiveMarks(def);
    const allClassified = marks.filter(Boolean).length === size * size, conflict = new Set(), reasons = [];
    puzzleUnits(size, def.regions).forEach(unit => {
      const monsters = unit.cells.filter(index => marks[index] === "monster");
      if (monsters.length > 1 || (allClassified && monsters.length !== 1)) { unit.cells.forEach(index => conflict.add(index)); reasons.push(unit.kind); }
    });
    marks.forEach((mark, index) => {
      if (mark !== "monster") return;
      const row=Math.floor(index/size), column=index%size;
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => {
        const rr=row+dr, cc=column+dc, next=rr*size+cc;
        if (rr>=0 && rr<size && cc>=0 && cc<size && marks[next] === "monster") { conflict.add(index); conflict.add(next); reasons.push("대각선"); }
      });
    });
    return { allClassified, indexes:[...conflict], reasons:[...new Set(reasons)] };
  }

  function checkBoard`);
    source = source.replaceAll('classified_count:state.marks.filter(Boolean).length', 'classified_count:effectiveMarks().filter(Boolean).length');

    source = source.replace(/  function cycleHypothesis\(index\) \{[\s\S]*?\n  \}\n\n  function selectCell/,
      `  function cycleHypothesis(index) {
    if (isFixed(index)) { state.pending=index; state.ready=true; state.message="고정 단서예요."; persist(); redraw(); return; }
    const current=state.marks[index], next=current === "safe" ? "monster" : current === "monster" ? null : "safe";
    state.marks[index]=next; state.conflictIndexes=[];
    emit("mine_decision", { item_id:"L"+currentConfig().level+"-B"+(state.boardIndex+1)+"-C"+index, board_index:index, level:currentConfig().level, board_number:state.boardIndex+1, response:next||"unselected", correct:null, measurement_state:"pendingClassification", revision:true });
    state.message=next ? "가설을 표시했어요. 언제든 바꿀 수 있어요." : "표시를 지웠어요.";
    if (effectiveMarks().filter(Boolean).length === currentDefinition().size ** 2) checkBoard(true); else { persist(); redraw(); }
  }

  function selectCell`);

    source = source.replace(/  function selectCell\(index\) \{[\s\S]*?\n  \}\n\n  function decide/,
      `  function selectCell(index) {
    if (state.phase !== "board") return;
    if (state.pending === index && state.marks[index]) { cycleHypothesis(index); return; }
    const item=currentReading()[index], data=metric(item.id);
    state.pending=index; state.ready=true; state.recognitionFailures=0; data.latency += performance.now()-state.boardShownAt;
    state.message=isFixed(index) ? "고정 단서예요. 짧은 구를 읽어 보세요." : "짧은 구를 읽고 가설을 표시해 보세요.";
    emit("reading_attempt", { item_id:item.id, board_index:index, level:currentConfig().level, board_number:state.boardIndex+1, text:item.prompt, transcript:null, correct:null, measurement_state:"notMeasured", assistance_level:"notMeasured", replay_count:data.replays, latency_ms:Math.round(data.latency) });
    persist(); redraw();
  }

  function decide`);

    source = source.replace(/  function decide\(kind\) \{[\s\S]*?\n  \}\n\n  function completeBoard/,
      `  function decide(kind) {
    if (state.pending == null || !state.ready || isFixed(state.pending)) return;
    const index=state.pending, item=currentReading()[index];
    state.marks[index]=state.marks[index] === kind ? null : kind; state.conflictIndexes=[];
    emit("mine_decision", { item_id:"L"+currentConfig().level+"-B"+(state.boardIndex+1)+"-C"+index, board_index:index, level:currentConfig().level, board_number:state.boardIndex+1, response:state.marks[index]||"unselected", correct:null, measurement_state:"pendingClassification", reading_item_id:item.id, revision:true });
    state.message=state.marks[index] ? "가설을 표시했어요. 언제든 바꿀 수 있어요." : "가설 표시를 지웠어요.";
    state.pending=null; state.ready=false;
    if (effectiveMarks().filter(Boolean).length === currentDefinition().size ** 2) checkBoard(true); else { persist(); redraw(); }
  }

  function completeBoard`);

    source = source.replace(/  function useHint\(\) \{[\s\S]*?\n  \}\n\n  function resetBoard/,
      `  function useHint() {
    if (state.hints <= 0) return;
    const analysis=forcedAnalysis(currentDefinition().size,currentDefinition().regions,effectiveMarks());
    const fixed=fixedMap(), move=analysis.moves.find(candidate => !fixed.has(candidate.index) && !state.marks[candidate.index]);
    if (!move) { state.message="표시한 가설을 먼저 확인해 보세요."; redraw(); return; }
    state.hintClues.push({ index:move.index, mark:move.mark, source:"hint" }); state.hintIndex=move.index; state.hints-=1;
    const item=currentReading()[move.index]; metric(item.id).hints+=1; state.message=move.reason;
    emit("hint", { item_id:item.id, board_index:move.index, level:currentConfig().level, board_number:state.boardIndex+1, hint_level:"forced_clue", forced_mark:move.mark, rationale:move.reason, assistance_level:"A1" });
    persist(); redraw();
  }

  function resetBoard`);

    source = source.replaceAll('state.marks = []; state.revealed = []; state.pending = null; state.ready = false; state.hintIndex = null; state.conflictIndexes = []; state.hints = currentConfig().hints;', 'state.marks = []; state.revealed = []; state.pending = null; state.ready = false; state.hintIndex = null; state.hintClues = []; state.conflictIndexes = []; state.hints = currentConfig().hints;');
    source = source.replaceAll('state.hintIndex = null; state.hints = currentConfig().hints;', 'state.hintIndex = null; state.hintClues = []; state.hints = currentConfig().hints;');

    source = source.replace(
      'noGuess:forcedAnalysis(definition.size, definition.regions).noGuess',
      'noGuess:forcedAnalysis(definition.size, definition.regions).noGuess, fixedClueCount:definition.cluePlan.clues.length, initialForcedWithClues:definition.cluePlan.initialForced, noGuessWithClues:definition.cluePlan.noGuess, logicalSteps:definition.cluePlan.logicalSteps'
    );
    source = source.replace(
      '(board.level !== 1 || (board.initialForced >= 1 && board.noGuess)))',
      '(board.level !== 1 || (board.initialForced >= 1 && board.noGuess)) && board.fixedClueCount >= 1 && board.initialForcedWithClues >= 1 && board.noGuessWithClues)'
    );
    source = source.replaceAll('"먼 곳이 안 보여요"', '"멀리 안 보여요"');
    source = source.replace(
      'hints:LEVELS[0].hints, hintIndex:null, hintClues:[], conflictIndexes:[], metrics:{}, reviewItems:[], reviewIndex:0, recognitionOn:false,',
      'hints:LEVELS[0].hints, hintIndex:null, hintClues:[], conflictIndexes:[], gateDone:[], gateIntent:null, metrics:{}, reviewItems:[], reviewIndex:0, recognitionOn:false,'
    );
    source = source.replaceAll('state.marks = []; state.revealed = [];', 'state.marks = []; state.revealed = []; state.gateDone = []; state.gateIntent = null;');

    source = source.replace('  function puzzleUnits(size, regions) {', `  let tileClickTimer=0, lastTileTap={index:-1,time:0};
  function readingGateIndexes(def=currentDefinition()) {
    const fixed=new Set((def.cluePlan?.clues||[]).map(clue=>clue.index));
    const candidates=Array.from({length:def.size*def.size},(_,index)=>index).filter(index=>!fixed.has(index));
    return shuffled(candidates,rng((def.seed^0x6A09E667)>>>0)).slice(0,5);
  }
  function isReadingGate(index){return readingGateIndexes().includes(index);}
  function readingGatesComplete(){return readingGateIndexes().every(index=>(state.gateDone||[]).includes(index));}
  function commitIntent(index,kind){
    if(isFixed(index))return;
    const item=currentReading()[index];
    state.marks[index]=kind;state.pending=null;state.ready=false;state.gateIntent=null;state.conflictIndexes=[];
    emit("mine_decision",{item_id:"L"+currentConfig().level+"-B"+(state.boardIndex+1)+"-C"+index,board_index:index,level:currentConfig().level,board_number:state.boardIndex+1,response:kind,correct:null,measurement_state:"pendingClassification",reading_item_id:item.id,revision:true});
    state.message=kind==="safe"?"방패로 표시했어요.":"젤리몬스터로 표시했어요.";
    if(effectiveMarks().filter(Boolean).length===currentDefinition().size**2)checkBoard(true);else{persist();redraw();}
  }
  function openReadingGate(index,kind){
    const item=currentReading()[index],data=metric(item.id);
    state.pending=index;state.ready=false;state.gateIntent=kind;state.recognitionFailures=0;data.latency+=performance.now()-state.boardShownAt;
    state.message=state.recognitionOn?"짧은 말을 읽어 주세요.":"읽은 뒤 ‘읽었어요’를 눌러요.";
    emit("reading_attempt",{item_id:item.id,board_index:index,level:currentConfig().level,board_number:state.boardIndex+1,text:item.prompt,transcript:null,correct:null,measurement_state:"notMeasured",assistance_level:"notMeasured",replay_count:data.replays,latency_ms:Math.round(data.latency),reading_gate:true});
    persist();redraw();
  }
  function finishReadingGate(){
    if(state.pending==null||!isReadingGate(state.pending)||!state.gateIntent)return;
    const index=state.pending;if(!state.gateDone.includes(index))state.gateDone.push(index);commitIntent(index,state.gateIntent);
  }
  function handleTileIntent(index,kind){
    if(state.phase!=="board")return;
    if(isFixed(index)){state.pending=index;state.ready=true;state.gateIntent=null;state.message="고정 단서예요. 짧은 말을 확인해요.";persist();redraw();return;}
    if(isReadingGate(index)&&!state.gateDone.includes(index)){openReadingGate(index,kind);return;}
    commitIntent(index,kind);
  }
  function scheduleTileIntent(index,detail=1){
    const now=performance.now(),double=detail>=2||(lastTileTap.index===index&&now-lastTileTap.time<310);
    clearTimeout(tileClickTimer);lastTileTap=double?{index:-1,time:0}:{index,time:now};
    if(double){handleTileIntent(index,"monster");return;}tileClickTimer=setTimeout(()=>handleTileIntent(index,"safe"),280);
  }

  function puzzleUnits(size, regions) {`);

    source = source.replace('const correct = report.allClassified && report.indexes.length === 0;', 'const gatesComplete=readingGatesComplete();\n    const correct = report.allClassified && report.indexes.length === 0 && gatesComplete;');
    source = source.replace('else state.message = "아직 표시하지 않은 타일이 있어요.";', 'else if(!gatesComplete)state.message="읽기 칸 5개를 먼저 마쳐요.";\n    else state.message="아직 표시하지 않은 타일이 있어요.";');

    source = source.replace(/          <div class="g2p-decisions">[\s\S]*?<\/div>\n          <p class="g2p-message"/, `          \${selected&&isReadingGate(state.pending)&&!(state.gateDone||[]).includes(state.pending)?\`<div class="g2p-decisions g2p-gate-fallback">\${!state.recognitionOn||state.recognitionFailures>=2?'<button type="button" data-g2p-action="gate-done">읽었어요</button>':'<span role="status">음성을 확인하고 있어요</span>'}</div>\`:'<div class="g2p-decisions" hidden></div>'}
          <p class="g2p-message"`);

    source = source.replace('const data = metric(item.id); data.attempts += 1;', 'const data = metric(item.id); data.attempts += 1;\n    if(correct&&state.pending!=null&&isReadingGate(state.pending))queueMicrotask(finishReadingGate);');
    source = source.replace('else if (action === "check") checkBoard(false);', 'else if(action==="gate-done")finishReadingGate();\n    else if (action === "check") checkBoard(false);');
    source = source.replace('if (cell) { event.preventDefault(); event.stopImmediatePropagation(); selectCell(Number(cell.dataset.g2pCell)); return; }', 'if(cell){event.preventDefault();event.stopImmediatePropagation();scheduleTileIntent(Number(cell.dataset.g2pCell),event.detail);return;}');
    source = source.replace('  document.addEventListener("click", event => {', `  document.addEventListener("keydown",event=>{
    const cell=event.target.closest?.("[data-g2p-cell]");if(!cell)return;const index=Number(cell.dataset.g2pCell);
    if(event.key==="Enter"){event.preventDefault();event.stopImmediatePropagation();handleTileIntent(index,"safe");}
    else if(event.key===" "||event.key.toLowerCase()==="m"){event.preventDefault();event.stopImmediatePropagation();handleTileIntent(index,"monster");}
  },true);

  document.addEventListener("click", event => {`);

    source = source.replace('  function completeBoard() {', `  function completeBoard(){
    const finalBoard=state.boardIndex===2;
    emit("board_complete",{level:currentConfig().level,board_number:state.boardIndex+1,board_seed:currentDefinition().seed});
    if(finalBoard)emit("level_complete",{level:currentConfig().level});
    const view=document.querySelector(".activity-view");
    if(view)view.innerHTML=\`<div class="progression-game2 g2p-transition" role="status"><img src="\${ASSETS.praise}" alt=""><strong>\${finalBoard?currentConfig().level+"단계 완료! 다음 단계로 가요.":"좋아요, 규칙을 잘 찾았어요!"}</strong></div>\`;
    setTimeout(()=>advanceCompletedBoard(),finalBoard?1800:1600);
  }

  function advanceCompletedBoard(){`);

    source = source.replace('readingPuzzleIndependent:source.every(item => !("safe" in item) && !("monster" in item) && !("mine" in item))', 'readingPuzzleIndependent:source.every(item=>!("safe" in item)&&!("monster" in item)&&!("mine" in item)),readingGateCount:definitions.flat().every(definition=>readingGateIndexes(definition).length===5),maxPhraseWords:Math.max(...source.map(item=>item.prompt.trim().split(/\\s+/).length))');
    return source;
  }

  fetch("release/game2-progression-v6-loader.js?rev=20260825j")
    .then(response => response.ok ? response.text() : Promise.reject(new Error(`Game2 v6 loader failed: ${response.status}`)))
    .then(loaderSource => {
      const line='      const insertion = "      source = (" + applyDeferredValidation.toString() + ")(source, replaceOnce);\\n";';
      if (!loaderSource.includes(line)) throw new Error("Game2 v8 insertion point missing");
      const added=line+'\n      const latest = "      source = (" + '+latestGame2.toString()+'.toString() + ")(source, replaceOnce);\\n";';
      let runtime=loaderSource.replace(line,added).replace('loaderSource.replace(marker, insertion + marker)','loaderSource.replace(marker, insertion + latest + marker)');
      runtime=runtime.replaceAll('state.marks.every(Boolean)','effectiveMarks().filter(Boolean).length === currentDefinition().size * currentDefinition().size');
      Function(`${runtime}\n//# sourceURL=game2-progression-v12-loader-runtime.js`)();
    })
    .catch(error => { console.error(error); window.dispatchEvent(new CustomEvent("oncuvate:game2-error",{detail:{message:error.message}})); });
})();



