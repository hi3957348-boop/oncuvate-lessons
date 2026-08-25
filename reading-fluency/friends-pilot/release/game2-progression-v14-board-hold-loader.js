(() => {
  "use strict";

  function enhanceSequentialGame(source) {
    source = source.replace(
      'recognitionOn:false,',
      'recognitionOn:false, soundOn:localStorage.getItem("we-are-friends:game2-sound")==="on", topReading:null, topReadingIndex:null, readLogged:[],'
    );
    source = source.replace('if (result.length === 3) break;', 'if (result.length === 5) break;');
    source = source.replace('다시 말해 보기 ${state.reviewIndex + 1} / 3', '소리 내어 읽기 ${state.reviewIndex + 1} / 5');
    source = source.replaceAll('세 보드와 다시 말하기를 마쳤어요.', '세 보드와 소리 내어 읽기를 마쳤어요.');

    source = source.replace(
      /  function renderBoard\(view\) \{[\s\S]*?\n  \}\n\n  function uniqueReviewItems/,
      `  function renderBoard(view) {
    const config=currentConfig(),def=currentDefinition(),reading=currentReading();
    const selected=state.topReadingIndex==null?null:reading[state.topReadingIndex];
    const found=effectiveMarks().filter(mark=>mark==="monster").length;
    view.innerHTML=\`<div class="override-game2 progression-game2 g2-sequential" style="--board-size:\${def.size}" data-level="\${config.level}" data-complexity="\${config.complexity}">
      <div class="g2p-topbar"><div><strong>단계 \${config.level}</strong><span>\${state.boardIndex+1} / 3 보드</span></div><span>젤리몬스터 \${found} / \${def.size}</span></div>
      <section class="g2-reading-wide" aria-live="polite">\${selected?\`<strong>\${selected.prompt}</strong><button type="button" data-g2p-action="replay">다시 듣기</button>\`:'<strong>색 타일을 차례로 눌러 표시해요</strong><span>한 번 방패 · 두 번 젤리 · 세 번 지우기</span>'}</section>
      <div class="g2p-layout">
        <section class="g2p-board-panel"><div class="g2p-board" role="grid" aria-label="\${def.size} 곱하기 \${def.size} 젤리몬스터 찾기">\${boardMarkup(def,reading)}</div></section>
        <aside class="g2p-side">
          <div class="g2-rule-card"><strong>보드 규칙</strong><span>가로 1 · 세로 1 · 같은 색 1</span><span>대각선으로 붙지 않아요</span></div>
          <div class="g2-setting-row">\${toggleMarkup()}<button type="button" data-g2p-action="sound-toggle" aria-pressed="\${state.soundOn}">소리 \${state.soundOn?'켬':'끔'}</button></div>
          <p class="g2p-message" role="status">\${state.message}</p>
          <div class="g2p-tools"><button type="button" data-g2p-action="hint" \${state.hints<=0?'disabled':''}>힌트 \${state.hints}</button><button type="button" data-g2p-action="reset">재시작</button><button type="button" data-g2p-action="check">보드 확인</button></div>
        </aside>
      </div>
    </div>\`;
  }

  function uniqueReviewItems`
    );

    source = source.replace(
      /  function renderReview\(view\) \{[\s\S]*?\n  \}\n\n  function renderLevelComplete/,
      `  function renderReview(view) {
    const item=state.reviewItems[state.reviewIndex];
    if(!item){state.phase="levelComplete";persist();renderLevelComplete(view);return;}
    view.innerHTML=\`<div class="override-game2 progression-game2 g2p-review g2-oral-review">
      <div class="g2p-topbar"><div><strong>단계 \${currentConfig().level}</strong><span>소리 내어 읽기 \${state.reviewIndex+1} / 5</span></div><button type="button" data-action="open-modal">활동 안내</button></div>
      <section class="g2p-review-card"><button type="button" class="g2p-listen" data-g2p-action="review-listen" aria-label="다시 듣기"><img src="\${ASSETS.listening}" alt="귀 기울이는 젤리티처"></button><span>어려웠던 말 다시 읽기</span><strong>\${item.prompt}</strong><p role="status">\${state.message}</p>\${toggleMarkup()}<div><button type="button" data-g2p-action="review-done">\${state.recognitionOn?'말했어요':'다음 말'}</button>\${state.recognitionFailures>=2?'<button type="button" data-g2p-action="review-skip">다음으로 넘어가기</button>':''}</div></section>
    </div>\`;
  }

  function renderLevelComplete`
    );

    source = source.replace(
      /  function handleTileIntent\(index,kind\)\{[\s\S]*?\n  \}\n  function scheduleTileIntent\(index,detail=1\)\{[\s\S]*?\n  \}/,
      `  function handleTileIntent(index,kind){
    if(state.phase!=="board"||audioBusy)return;
    const item=currentReading()[index];
    if(isFixed(index)){state.topReading=item.prompt;state.topReadingIndex=index;state.pending=index;state.ready=true;state.gateIntent=null;state.message="고정 단서예요. 표시는 바꿀 수 없어요.";persist();redraw();return;}
    if(kind==="safe"){
      state.topReading=item.prompt;state.topReadingIndex=index;
      if(!state.readLogged.includes(index)){
        state.readLogged.push(index);const data=metric(item.id);data.attempts+=1;
        if(state.soundOn)speak(item.prompt);
        emit("reading_attempt",{item_id:item.id,board_index:index,level:currentConfig().level,board_number:state.boardIndex+1,text:item.prompt,transcript:null,correct:null,measurement_state:"notMeasured",assistance_level:"notMeasured",replay_count:data.replays,latency_ms:Math.round(performance.now()-state.boardShownAt),automatic_on_first_shield:true});
      }
    }else{state.topReading=null;state.topReadingIndex=null;}
    commitIntent(index,kind);
  }
  function scheduleTileIntent(index){
    if(isFixed(index)){handleTileIntent(index,fixedMap().get(index)?.mark||"safe");return;}
    const current=state.marks[index],next=current==="safe"?"monster":current==="monster"?null:"safe";
    handleTileIntent(index,next);
  }`
    );

    source = source.replace(
      'state.message=kind==="safe"?"방패로 표시했어요.":"젤리몬스터로 표시했어요.";',
      'state.message=kind==="safe"?"방패로 표시했어요.":kind==="monster"?"젤리몬스터로 표시했어요.":"표시를 지웠어요.";'
    );
    source = source.replace(
      'if(event.key==="Enter"){event.preventDefault();event.stopImmediatePropagation();handleTileIntent(index,"safe");}\n    else if(event.key===" "||event.key.toLowerCase()==="m"){event.preventDefault();event.stopImmediatePropagation();handleTileIntent(index,"monster");}',
      'if(event.key==="Enter"||event.key===" "){event.preventDefault();event.stopImmediatePropagation();scheduleTileIntent(index);}'
    );
    source = source.replace(
      'scheduleTileIntent(Number(cell.dataset.g2pCell),event.detail)',
      'scheduleTileIntent(Number(cell.dataset.g2pCell))'
    );
    source = source.replace(
      'if (state.phase === "review") return state.reviewItems[state.reviewIndex] || null;\n    return state.pending == null ? null : currentReading()[state.pending];',
      'if(state.phase==="review")return state.reviewItems[state.reviewIndex]||null;\n    return state.topReadingIndex==null?(state.pending==null?null:currentReading()[state.pending]):currentReading()[state.topReadingIndex];'
    );
    source = source.replace(
      'else if(action==="gate-done")finishReadingGate();',
      'else if(action==="sound-toggle"){state.soundOn=!state.soundOn;localStorage.setItem("we-are-friends:game2-sound",state.soundOn?"on":"off");persist();redraw();}\n    else if(action==="board-next"||action==="review-start"){if(state.phase!=="boardComplete")return;state.phase="board";advanceCompletedBoard();persist();redraw();}\n    else if(action==="gate-done")finishReadingGate();'
    );
    source = source.replaceAll(
      'state.marks = []; state.revealed = []; state.gateDone = []; state.gateIntent = null;',
      'state.marks = []; state.revealed = []; state.gateDone = []; state.gateIntent = null; state.topReading=null; state.topReadingIndex=null; state.readLogged=[];'
    );
    source = source.replace('function readingGatesComplete(){return readingGateIndexes().every(index=>(state.gateDone||[]).includes(index));}','function readingGatesComplete(){return true;}');    source = source.replace(
      'if (correct) { state.message = "보드 규칙을 모두 지켰어요."; completeBoard(); persist(); redraw(); return true; }',
      'if(correct){state.message="보드 규칙을 모두 지켰어요.";completeBoard();persist();return true;}'
    );
    source = source.replace(
      /  function completeBoard\(\)\{[\s\S]*?\n  \}\n\n  function advanceCompletedBoard\(\)\{/,
      `  function renderBoardComplete(view){
    const config=currentConfig(),def=currentDefinition(),reading=currentReading(),finalBoard=state.boardIndex===2;
    const found=effectiveMarks().filter(mark=>mark==="monster").length;
    view.innerHTML=\`<div class="override-game2 progression-game2 g2-sequential g2-board-complete" style="--board-size:\${def.size}" data-level="\${config.level}" data-complexity="\${config.complexity}">
      <div class="g2p-topbar"><div><strong>단계 \${config.level}</strong><span>\${state.boardIndex+1} / 3 보드</span></div><span>젤리몬스터 \${found} / \${def.size}</span></div>
      <section class="g2-reading-wide" aria-live="polite"><strong>보드를 완성했어요</strong><span>찾은 규칙을 함께 확인해요</span></section>
      <div class="g2p-layout">
        <section class="g2p-board-panel"><div class="g2p-board" role="grid" aria-label="완성한 \${def.size} 곱하기 \${def.size} 젤리몬스터 보드">\${boardMarkup(def,reading)}</div></section>
        <aside class="g2p-side g2-success-side" aria-live="polite">
          <img class="g2-success-jelly" src="\${ASSETS.praise}" alt="기뻐하는 젤리티처">
          <strong>좋아요, 규칙을 잘 찾았어요!</strong>
          <p>가로·세로·같은 색마다 젤리 몬스터는 하나씩</p>
          <p>젤리 몬스터끼리는 대각선으로 붙지 않아요.</p>
          <button type="button" class="g2-success-next" data-g2p-action="\${finalBoard?'review-start':'board-next'}">\${finalBoard?'읽기 확인':'다음 보드'}</button>
        </aside>
      </div>
    </div>\`;
  }

  function completeBoard(){
    const finalBoard=state.boardIndex===2;
    emit("board_complete",{level:currentConfig().level,board_number:state.boardIndex+1,board_seed:currentDefinition().seed});
    if(finalBoard)emit("level_complete",{level:currentConfig().level});
    state.phase="boardComplete";state.pending=null;state.ready=false;state.topReading=null;state.topReadingIndex=null;
    const view=document.querySelector(".activity-view");if(view)renderBoardComplete(view);
  }

  function advanceCompletedBoard(){`
    );    source = source.replace(
      'readingGateCount:definitions.flat().every(definition=>readingGateIndexes(definition).length===5)',
      'readingGateCount:0,blockingGate:false,readingLogMode:"first-shield-auto",sequentialCycle:true,reviewCount:5'
    );
    source = source.replace('window.ONQ_GAME2_PROGRESSION_TEST = {', `window.ONQ_GAME2_PROGRESSION_TEST = {
    qaEnabled:new URLSearchParams(location.search).get("qa")==="1",
    qaState:()=>({levelIndex:state.levelIndex,boardIndex:state.boardIndex,phase:state.phase,reviewIndex:state.reviewIndex,reviewCount:state.reviewItems.length,recognitionOn:state.recognitionOn,recognitionFailures:state.recognitionFailures}),
    qaSolveCurrentBoard(){if(new URLSearchParams(location.search).get("qa")!=="1"||state.phase!=="board")return false;const def=currentDefinition(),monsters=monsterIndexes(def);state.marks=Array.from({length:def.size*def.size},(_,index)=>monsters.has(index)?"monster":"safe");state.gateDone=readingGateIndexes(def);persist();checkBoard(false);return true;},
    qaTranscript(text){if(new URLSearchParams(location.search).get("qa")!=="1")return false;handleTranscript(text);return true;},`);
    return source;
  }

  fetch("release/game2-progression-v12-loader.js?rev=20260822-cluefix2")
    .then(response => response.ok ? response.text() : Promise.reject(new Error(`Game2 v12 loader failed: ${response.status}`)))
    .then(loaderSource => {
      const marker = "    return source;\n  }\n\n  fetch(";
      if (!loaderSource.includes(marker)) throw new Error("Game2 v13 enhancement point missing");
      const injected = `    source = (${enhanceSequentialGame.toString()})(source);\n    return source;\n  }\n\n  fetch(`;
      Function(`${loaderSource.replace(marker, injected)}\n//# sourceURL=game2-progression-v13-loader-runtime.js`)();
    })
    .catch(error => {
      console.error(error);
      window.dispatchEvent(new CustomEvent("oncuvate:game2-error", { detail:{ message:error.message } }));
    });
})();

