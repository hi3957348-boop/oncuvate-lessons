(() => {
  "use strict";

  function replaceOnce(source, before, after, label) {
    if (!source.includes(before)) throw new Error(`Game2 patch target not found: ${label}`);
    return source.replace(before, after);
  }

  fetch("release/game2-progression-v1.js?rev=20260825r2")
    .then(response => {
      if (!response.ok) throw new Error(`Game2 engine load failed: ${response.status}`);
      return response.text();
    })
    .then(original => {
      let source = original;
      source = replaceOnce(source, "seeds: [2, 3, 21]", "seeds: [3, 21, 47]", "L1 seeds");
      source = replaceOnce(source, "seeds: [24, 39, 64]", "seeds: [250, 523, 1339]", "L3 seeds");

      const solverEnd = `  function solveBoard(size, regions, limit = 2) {
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
`;
      const logicHelpers = `${solverEnd}
  function puzzleUnits(size, regions) {
    const rows = Array.from({ length:size }, (_, row) => Array.from({ length:size }, (_, column) => row * size + column));
    const columns = Array.from({ length:size }, (_, column) => Array.from({ length:size }, (_, row) => row * size + column));
    const colored = Array.from({ length:size }, (_, region) => regions.map((value, index) => value === region ? index : -1).filter(index => index >= 0));
    return [
      ...rows.map((cells, index) => ({ cells, kind:"가로줄", index })),
      ...columns.map((cells, index) => ({ cells, kind:"세로줄", index })),
      ...colored.map((cells, index) => ({ cells, kind:"같은 색 구역", index }))
    ];
  }

  function forcedAnalysis(size, regions, initialMarks = []) {
    const marks = Array(size * size).fill(null);
    initialMarks.forEach((mark, index) => { if (mark === "safe" || mark === "monster") marks[index] = mark; });
    const moves = [];
    let contradiction = false;
    let changed = true;
    let round = 0;
    while (changed && !contradiction && round < size * size * 3) {
      changed = false;
      round += 1;
      const monsters = marks.map((mark, index) => mark === "monster" ? index : -1).filter(index => index >= 0);
      monsters.forEach(index => {
        const row = Math.floor(index / size), column = index % size;
        [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr, dc]) => {
          const rr = row + dr, cc = column + dc;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) return;
          const target = rr * size + cc;
          if (marks[target] === "monster") contradiction = true;
          if (!marks[target]) {
            marks[target] = "safe";
            moves.push({ index:target, mark:"safe", reason:"젤리몬스터는 대각선으로 붙지 않아요.", round });
            changed = true;
          }
        });
      });
      for (const unit of puzzleUnits(size, regions)) {
        const unitMonsters = unit.cells.filter(index => marks[index] === "monster");
        const open = unit.cells.filter(index => !marks[index]);
        if (unitMonsters.length > 1 || (!unitMonsters.length && !open.length)) { contradiction = true; break; }
        if (unitMonsters.length === 1) {
          open.forEach(index => {
            marks[index] = "safe";
            moves.push({ index, mark:"safe", reason:unit.kind + "에는 젤리몬스터가 하나만 있어요.", round });
            changed = true;
          });
        } else if (open.length === 1) {
          marks[open[0]] = "monster";
          moves.push({ index:open[0], mark:"monster", reason:unit.kind + "에서 들어갈 수 있는 곳이 이 칸뿐이에요.", round });
          changed = true;
        }
      }
    }
    const monsterCount = marks.filter(mark => mark === "monster").length;
    return {
      marks,
      moves,
      contradiction,
      initialForced:moves.filter(move => move.round === 1 && move.mark === "monster").length,
      noGuess:!contradiction && monsterCount === size && marks.every(Boolean)
    };
  }

  function growNoGuessRegions(size, solution, random) {
    const lockedRegion = Math.floor(random() * size);
    const regions = Array(size * size).fill(-1);
    solution.forEach((column, row) => { regions[row * size + column] = row; });
    let remaining = size * size - size;
    let guard = 0;
    while (remaining > 0 && guard < 10000) {
      guard += 1;
      const sizes = Array(size).fill(0);
      regions.forEach(region => { if (region >= 0) sizes[region] += 1; });
      const frontier = [];
      regions.forEach((region, index) => {
        if (region < 0 || region === lockedRegion) return;
        const row = Math.floor(index / size), column = index % size;
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => {
          const rr = row + dr, cc = column + dc, next = rr * size + cc;
          if (rr >= 0 && rr < size && cc >= 0 && cc < size && regions[next] < 0) frontier.push([next, region]);
        });
      });
      if (!frontier.length) return null;
      frontier.sort((left, right) => sizes[left[1]] - sizes[right[1]] || left[0] - right[0]);
      const pick = frontier[Math.floor(random() * Math.min(frontier.length, size + 1))];
      if (regions[pick[0]] < 0) { regions[pick[0]] = pick[1]; remaining -= 1; }
    }
    return remaining === 0 ? regions : null;
  }
`;
      source = replaceOnce(source, solverEnd, logicHelpers, "forced logic helpers");

      const oldGenerator = `  function generateDefinition(config, requestedSeed) {
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
    throw new Error(\`Game2 board generation failed: L\${config.level}/\${requestedSeed}\`);
  }
`;
      // 판 하나를 찾는 데 필요한 시도 수는 판 크기에 따라 크게 튄다.
      // 7×7(4·5레벨)에서 12,000번으로는 **모자란 시드가 실제로 있었다** —
      // 시드는 lessonId에서 나오므로 책·폴더 이름을 바꾸는 순간 아무 예고 없이 터진다
      // (「Game2 board generation failed: L5/74512」 → 판이 통째로 안 뜨고 「불러오는 중…」에서 멈춤).
      // 지금까지 확인한 가장 나쁜 자리가 +12,280이라 넉넉히 40만으로 둔다.
      // 맞으면 그 자리에서 빠져나오므로 흔한 경우의 비용은 그대로다(회차당 총 0.2초 안쪽).
      const newGenerator = `  function generateDefinition(config, requestedSeed) {
    for (let offset = 0; offset < 400000; offset += 1) {
      const seed = requestedSeed + offset;
      const random = rng(seed);
      const solution = shuffled(Array.from({ length: config.size }, (_, index) => index), random);
      if (solution.some((column, row) => row > 0 && Math.abs(solution[row - 1] - column) === 1)) continue;
      const regions = config.level === 1
        ? growNoGuessRegions(config.size, solution, random)
        : growRegions(config.size, solution, random, config.complexity);
      if (!regions) continue;
      const solved = solveBoard(config.size, regions);
      if (solved.length !== 1 || solved[0].some((column, row) => column !== solution[row])) continue;
      const forced = forcedAnalysis(config.size, regions);
      if (config.level === 1 && (forced.initialForced < 1 || !forced.noGuess)) continue;
      return { seed, size:config.size, complexity:config.complexity, regions, solution, solutionCount:solved.length, initialForced:forced.initialForced, noGuess:forced.noGuess };
    }
    throw new Error(\`Game2 board generation failed: L\${config.level}/\${requestedSeed}\`);
  }
`;
      source = replaceOnce(source, oldGenerator, newGenerator, "no-guess generator");

      source = replaceOnce(source,
        `hints:LEVELS[0].hints, metrics:{}, reviewItems:[], reviewIndex:0, recognitionOn:false,`,
        `hints:LEVELS[0].hints, hintIndex:null, metrics:{}, reviewItems:[], reviewIndex:0, recognitionOn:false,`,
        "hint state");
      source = replaceOnce(source,
        `const revealed = state.revealed.includes(index), mark = state.marks[index] || "", pending = state.pending === index;`,
        `const revealed = state.revealed.includes(index), mark = state.marks[index] || "", pending = state.pending === index, hinted = state.hintIndex === index;`,
        "hinted cell state");
      source = replaceOnce(source,
        `class="g2p-cell \${revealed ? "revealed" : "covered"} \${pending ? "pending" : ""} \${mark}"`,
        `class="g2p-cell \${revealed ? "revealed" : "covered"} \${pending ? "pending" : ""} \${hinted ? "forced-hint" : ""} \${mark}"`,
        "hinted cell class");
      source = replaceOnce(source,
        `<section class="g2p-board-panel"><div class="g2p-rule"><span>가로·세로·색 구역마다 하나</span><span>대각선으로 붙지 않아요</span></div>`,
        `<section class="g2p-board-panel"><div class="g2p-rule" aria-label="보드 규칙"><span>가로 1</span><i aria-hidden="true">·</i><span>세로 1</span><i aria-hidden="true">·</i><span>같은 색 1</span><i aria-hidden="true">·</i><span>대각선 붙지 않음</span></div>`,
        "rule strip");
      source = replaceOnce(source,
        `<div class="g2p-tools"><button type="button" data-g2p-action="hint" \${state.hints <= 0 ? "disabled" : ""}>힌트 \${state.hints}</button><button type="button" data-g2p-action="reset">이 보드 다시 하기</button>`,
        `<div class="g2p-tools"><button type="button" data-g2p-action="hint" data-hints-left="\${state.hints}" aria-label="힌트 \${state.hints}개 남음" \${state.hints <= 0 ? "disabled" : ""}>힌트 \${state.hints}</button><button type="button" data-g2p-action="reset">재시작</button>`,
        "hint and reset controls");

      const oldHint = `  function useHint() {
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
`;
      const newHint = `  function useHint() {
    if (state.hints <= 0) return;
    const analysis = forcedAnalysis(currentDefinition().size, currentDefinition().regions, state.marks);
    const move = analysis.moves.find(candidate => !state.marks[candidate.index]);
    if (!move) {
      state.message = "지금 표시한 칸을 한 번 더 살펴봐요.";
      redraw();
      return;
    }
    state.hintIndex = move.index;
    state.hints -= 1;
    const item = currentReading()[move.index]; metric(item.id).hints += 1;
    state.message = move.reason;
    emit("hint", { item_id:item.id, board_index:move.index, level:currentConfig().level, board_number:state.boardIndex + 1, hint_level:"forced_cell", forced_mark:move.mark, rationale:move.reason, assistance_level:"A1" });
    persist(); redraw();
  }
`;
      source = replaceOnce(source, oldHint, newHint, "forced hint");
      source = replaceOnce(source,
        `state.marks = []; state.revealed = []; state.pending = null; state.ready = false; state.hints = currentConfig().hints;`,
        `state.marks = []; state.revealed = []; state.pending = null; state.ready = false; state.hintIndex = null; state.hints = currentConfig().hints;`,
        "reset hint state");
      source = replaceOnce(source,
        `state.pending = index; state.ready = false; state.recognitionFailures = 0;`,
        `state.pending = index; state.ready = false; state.hintIndex = null; state.recognitionFailures = 0;`,
        "clear hint on cell select");
      source = source.replaceAll(
        `state.boardIndex += 1; state.marks = []; state.revealed = []; state.pending = null; state.ready = false;`,
        `state.boardIndex += 1; state.marks = []; state.revealed = []; state.pending = null; state.ready = false; state.hintIndex = null;`
      );
      source = source.replaceAll(
        `state.pending = null; state.ready = false; state.hints = currentConfig().hints; state.reviewItems = [];`,
        `state.pending = null; state.ready = false; state.hintIndex = null; state.hints = currentConfig().hints; state.reviewItems = [];`
      );
      source = replaceOnce(source,
        `regionCounts:Array.from({ length:definition.size }, (_, region) => definition.solution.filter((column, row) => definition.regions[row * definition.size + column] === region).length)`,
        `regionCounts:Array.from({ length:definition.size }, (_, region) => definition.solution.filter((column, row) => definition.regions[row * definition.size + column] === region).length),\n        initialForced:forcedAnalysis(definition.size, definition.regions).initialForced,\n        noGuess:forcedAnalysis(definition.size, definition.regions).noGuess`,
        "QA no-guess fields");
      source = replaceOnce(source,
        `boards.every(board => board.unique && board.rowColumnsUnique && board.noDiagonal && board.regionCounts.every(count => count === 1))`,
        `boards.every(board => board.unique && board.rowColumnsUnique && board.noDiagonal && board.regionCounts.every(count => count === 1) && (board.level !== 1 || (board.initialForced >= 1 && board.noGuess)))`,
        "QA validity rule");

      Function(`${source}\n//# sourceURL=game2-progression-v3-runtime.js`)();
    })
    .catch(error => {
      console.error(error);
      window.dispatchEvent(new CustomEvent("oncuvate:game2-error", { detail:{ message:error.message } }));
    });
})();
