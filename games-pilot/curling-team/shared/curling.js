/*!
 * 「젤리 컬링」 힘 조절·참기 게임 엔진  v1.0.0 (단계 사다리판)
 *
 * ※ 이 파일은 curling/shared/curling.js 의 사본이다(팀전 curling-team 용). 물리·그림은 그대로이고,
 *   맨 아래 Curling.sim 에 launch 등 몇 개, Curling.draw(그림·효과음)를 밖으로 꺼내는 줄만 더했다.
 *   팀전은 mount()를 쓰지 않으므로 ladder.js 가 필요 없다.
 *
 * 한 번(시행)의 흐름
 *   얼음판 아래에 내 젤리 돌, 위에 과녁(동그라미 셋). 돌(또는 「꾹 누르기」 단추·스페이스)을 꾹 누르고 있으면
 *   오른쪽 힘 막대가 오르내린다 → 알맞을 때 손을 떼면 그 힘으로 미끄러진다(힘 조절 = 뗄 때를 참고 기다리기).
 *   돌이 멈춘 자리가 과녁 안이면 성공. 가운데일수록 별이 더 나온다(점수 숫자 대신 별 1~3개).
 *   못 넣으면 「괜찮아요, 다시!」 — 같은 판으로 다시 던진다. 한 번에 chances번까지 던질 수 있다.
 *   너무 짧게 톡 누르면(0.12초 안) 던지지 않고 「꾹 누르고 있다가 떼요」(기록에 quickTaps로만 셈).
 *
 * 칸이 오르며 하나씩 생기는 것
 *   과녁이 작아짐 → 힘 막대가 빨라짐 → 과녁 자리가 바뀜(move) → 방향도 고르기(aim: 얼음을 누르거나 ◀ ▶)
 *   → 앞에 놓인 돌 피하기(guard) → 과녁 안 젤리 돌 밀어내기(knock) → 눈 얼음 + 솔질(snow: 돌이 가는 동안 꾹 누르면
 *   덜 멈춤, 너무 하면 지나감 — 참기) → 젤리와 번갈아 던지기(versus: 끝에 가운데에 더 가까운 쪽이 이김, 내가 마지막 돌)
 *
 * 어긋남 단계(한 번 안에서)
 *   1번째 못 넣음 : 「괜찮아요, 다시!」 + 뗄 때 알려 주는 말 + 「힘 자리 보기」 단추(아이가 고름, 도움 A2 — 힘 막대에 금색 금)
 *   2번째 못 넣음 : 다음 돌부터 금색 금 + (방향 칸이면) 금색 방향 점선이 저절로 보인다(도움 A4)
 *
 * 판 만들기: 앞에 놓인 돌·밀어낼 돌이 있는 판은 엔진이 방향×힘(×솔질)을 모두 시험해 과녁 안에 넣을 수 있는 판만 낸다.
 *
 * 움직임: setTimeout 고정 간격(30ms) 한 틱 = 게임 시간 0.03초. requestAnimationFrame 은 쓰지 않는다.
 *         마찰로 빠르기가 줄고, 벽에는 단순 반사, 돌끼리는 같은 무게 튕김(단순).
 *
 * 단계 사다리: 칸 목록(ladder.steps) · 오르내리기·지도·이어 하기는 공용 부품 shared/ladder.js(OncuLadder) — 먼저 불러야 한다.
 *   「오늘의 도전」 challenge.trials번 또는 challenge.minutes분, challenge.breakEvery번마다 쉬는 화면.
 *   아이 화면에는 점수·시간 숫자를 띄우지 않는다(칸 번호와 별만). 내려가도 단계 지도의 별은 그대로.
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 힘 자리 보기  data-track="hint" data-help-level="A2"
 *   - 끝 화면       data-track="activity-complete"
 *   - 자세한 신호   oncuvate:log  game-item-ready / game-response(내 돌마다) / game-help / game-item-complete (모두 level 실음)
 *                   game-level-change / game-break / game-activity-complete(startLevel·maxLevel·endLevel)
 *     game-response: power(뗀 때의 힘 0~1) · idealPower(그 방향의 알맞은 힘) · powerDiff · releaseTiming(early 너무 일찍 /
 *                    late 너무 늦게 / ontime) · barPhase(up/down) · holdMs · aimDeg · brushMs · distCenter · stars · outcome
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다. 아이 화면 그림은 모두 SVG(이모지 안 씀), SVG 색은 글자값(hex).
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '젤리 컬링',
    readyFirst: '돌을 꾹 누르면 힘 막대가 오르내려요. 알맞을 때 손을 떼서 과녁에 넣어요!',
    readyResume: '지난번에 {last}칸까지 왔어요. {start}칸에서 몸풀기로 시작해요.',
    readyCoach: '{start}칸에서 시작해요.',
    today: '오늘의 도전 · {n}번 해 봐요',
    howTo: '돌을 꾹 → 알맞을 때 떼기',
    start: '시작',
    hold: '꾹 누르기',
    brush: '솔질',
    goal: '꾹 누르고, 알맞을 때 떼요.',
    goalAim: '얼음을 눌러 방향을 정하고, 돌을 꾹 눌러요.',
    goalGuard: '앞의 돌을 피해서 과녁에 넣어요.',
    goalKnock: '젤리 돌보다 가운데에 가깝게!',
    goalSnow: '돌이 가는 동안 꾹 누르면 솔질! 더 미끄러져요.',
    goalVersus: '젤리와 번갈아 던져요. 가운데에 더 가까우면 이겨요! 과녁 앞에 멈춘 돌은 치워요.',
    newRing: '과녁이 작아졌어요!',
    newBar: '힘 막대가 빨라졌어요!',
    newMove: '과녁 자리가 바뀌어요!',
    newAim: '방향도 골라요!',
    newGuard: '앞에 돌이 있어요!',
    newKnock: '젤리 돌을 밀어내요!',
    newSnow: '눈 얼음! 솔질해요',
    newVersus: '젤리와 번갈아 던져요!',
    aimTip: '얼음을 누르면 방향',
    holding: '알맞을 때 떼요!',
    sliding: '잘 봐요.',
    brushing: '솔질 중!',
    quick: '꾹 누르고 있다가 떼요.',
    inHouse: ['과녁 안!', '들어갔어요!', '좋아요!'],
    center: '가운데!',
    miss: '괜찮아요, 다시!',
    early: '조금 더 기다렸다 떼요.',
    late: '조금 일찍 떼요.',
    side: '방향을 살짝 바꿔 봐요.',
    brushMore: '솔질을 조금 더 해 봐요.',
    brushLess: '솔질을 조금 일찍 멈춰요.',
    blocked: '앞의 돌을 피해 봐요.',
    knockLose: '젤리 돌이 더 가까워요. 다시!',
    help: '힘 자리 보기',
    helpOn: '금색 금에서 손을 떼요.',
    helpBrush: '꼭대기에서 떼고 솔질해요.',
    cue: '금색 금과 금색 길을 따라 해 봐요.',
    jellyTurn: '젤리 차례예요.',
    myTurn: '내 차례예요.',
    win: '내 돌이 가운데에 더 가까워요!',
    lose: '이번엔 젤리 돌이 더 가까워요.',
    noOne: '과녁 안에 돌이 없어요.',
    good: ['멋지게 넣었어요!', '딱 좋은 힘이에요!', '잘 참고 뗐어요!'],
    notYet: '여기까지! 다음 번에 또 해 봐요.',
    up: '한 칸 올라가요!',
    top: '꼭대기예요! 정말 잘했어요.',
    down: '한 칸 쉬운 데서 다시 연습해요.',
    restTitle: '잠깐 쉬어요',
    restLine: '지금 {level}칸에 있어요.',
    restCoach: '손을 쥐었다 펴고 계속해요.',
    keepOn: '계속하기',
    endTitle: '오늘의 도전 끝!',
    endFirst: '오늘 {max}칸까지 올라왔어요.',
    endAgain: '지난번 {prev}칸 → 오늘 최고 {max}칸',
    endSteady: '오늘 {max}칸까지 연습했어요. 다음에 또 올라가 봐요!',
    again: '처음부터 다시',
    levelChip: '{n}칸',
    myStones: '내 돌',
    jellyStones: '젤리 돌',
    lastStars: '이번 돌',
    aimLeft: '왼쪽으로',
    aimRight: '오른쪽으로',
    pickTitle: '시작 칸',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var DEFAULTS = {
    activityId: 'curling',
    storageKey: null,
    ladder: null,              // { steps:[{ring, barMs, move, aim, guard, knock, snow, versus}], tries, upNeed, downAfter, warmup, countSelfCorrected }
    challenge: null,           // { trials, minutes, breakEvery }
    chances: 3,                // 한 번에 던질 수 있는 돌 수(칸에 chances가 있으면 그 값, 번갈아 칸은 versus 수)
    jellyError: 0.09,          // 번갈아 칸에서 젤리가 던지는 힘의 흔들림(클수록 젤리가 자주 빗나감)
    sound: true,
    restartButton: true,
    credit: '',
    coachBase: 'assets/images/jelly/',
    coachExt: '.webp',
    texts: null,
    debug: false,
    onFinish: null
  };

  var COACH = { ready: 'jelly-default', play: 'jelly-look', oops: 'jelly-thinking',
                help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer', rest: 'jelly-cheer' };

  /* ───────────── 얼음판 물리(화면과 따로 — 시험 스크립트에서도 쓴다) ─────────────
     판은 가로·세로 100칸. 얼음판 x 14~86, y 3~97. 던지는 자리(50, 87). 돌 반지름 3.2.
     힘 p(0~1) → 갈 거리 D_MIN + p×(D_MAX − D_MIN) 만큼 가는 첫 빠르기. 마찰(감속) FRICTION 칸/초².
     눈 얼음(snow)은 마찰 SNOW배, 솔질하는 동안은 그 BRUSH배. */
  var R_STONE = 3.2, SHEET_L = 14, SHEET_R = 86, SHEET_T = 3, SHEET_B = 97;
  var START_X = 50, START_Y = 87, HOUSE_Y = 24, BACK_Y = 6;
  var FRICTION = 26, D_MIN = 12, D_MAX = 96, SNOW = 1.5, BRUSH = 0.42, WALL_KEEP = 0.6, BUMP_E = 0.92;
  var DT = 0.03, TICK_MS = 30, SUB = 2, MAX_AIM = 22, AIM_STEP = 1.5, QUICK_TICKS = 4;
  var MIN_WAYS = 30;         // 놓인 돌이 있는 판: 이기는 던지기 수가 이만큼은 되어야 낸다(너무 좁은 판 막기)
  var RING = [5, 10, 15];    // 과녁 동그라미 반지름(ring 1일 때): 가운데 · 가운데 둘레 · 바깥

  function speedFor(p) { return Math.sqrt(2 * FRICTION * (D_MIN + Math.max(0, p) * (D_MAX - D_MIN))); }
  function rad(deg) { return deg * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }
  function moving(s) { return !s.out && (s.vx !== 0 || s.vy !== 0); }

  /* 한 틱 움직이기 — world: { stones:[{x,y,vx,vy,own,out}], snow, active(던진 돌 번호) }, brushing: 솔질 중인가 */
  function stepWorld(w, brushing) {
    var dt = DT / SUB, i, j, s, k, bumped = false, walled = false;
    for (k = 0; k < SUB; k++) {
      for (i = 0; i < w.stones.length; i++) {
        s = w.stones[i];
        if (!moving(s)) continue;
        var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        var f = FRICTION * (w.snow ? SNOW : 1) * (brushing && i === w.active ? BRUSH : 1);
        var ns = Math.max(0, sp - f * dt);
        if (ns < 0.05) { s.vx = 0; s.vy = 0; continue; }
        s.vx *= ns / sp; s.vy *= ns / sp;
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < SHEET_L + R_STONE) { s.x = 2 * (SHEET_L + R_STONE) - s.x; s.vx = -s.vx * WALL_KEEP; s.vy *= WALL_KEEP; walled = true; }
        else if (s.x > SHEET_R - R_STONE) { s.x = 2 * (SHEET_R - R_STONE) - s.x; s.vx = -s.vx * WALL_KEEP; s.vy *= WALL_KEEP; walled = true; }
        if (s.y < SHEET_T - R_STONE || s.y > SHEET_B + R_STONE) { s.out = true; s.vx = 0; s.vy = 0; }
      }
      /* 돌끼리: 같은 무게 튕김 */
      for (i = 0; i < w.stones.length; i++) {
        var a = w.stones[i];
        if (a.out) continue;
        for (j = i + 1; j < w.stones.length; j++) {
          var b = w.stones[j];
          if (b.out) continue;
          var dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, min = 2 * R_STONE;
          if (d2 >= min * min || d2 === 0) continue;
          var d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
          var vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (vn > 0) {
            var J = (1 + BUMP_E) / 2 * vn;
            a.vx -= J * nx; a.vy -= J * ny; b.vx += J * nx; b.vy += J * ny;
            bumped = true;
          }
          var push = (min - d) / 2 + 0.01;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        }
      }
    }
    return { bumped: bumped, walled: walled };
  }
  function allStopped(w) {
    for (var i = 0; i < w.stones.length; i++) if (moving(w.stones[i])) return false;
    return true;
  }
  function launch(p, aimDeg, sx) {
    var v = speedFor(p), a = rad(aimDeg);
    return { x: sx == null ? START_X : sx, y: START_Y, vx: v * Math.sin(a), vy: -v * Math.cos(a) };
  }
  /* 던져 보기: stones(놓인 돌들) + 내 돌(p, aim, brushTicks: 던진 뒤 몇 틱 솔질) → 멈춘 뒤 돌들 */
  function simulate(stones, p, aimDeg, opt) {
    opt = opt || {};
    var w = { snow: !!opt.snow, stones: [], active: 0 };
    (stones || []).forEach(function (s) { if (!s.out) w.stones.push({ x: s.x, y: s.y, vx: 0, vy: 0, own: s.own, out: false }); });
    var L = launch(p, aimDeg);
    w.active = w.stones.length;
    w.stones.push({ x: L.x, y: L.y, vx: L.vx, vy: L.vy, own: opt.own || 'kid', out: false });
    var bt = opt.brushTicks || 0;
    for (var t = 0; t < 4000 && !allStopped(w); t++) stepWorld(w, t < bt);
    return w;
  }
  /* 빈 얼음에서 곧게 갈 거리(1차원) */
  function travel(p, snow) {
    var w = { snow: !!snow, stones: [{ x: 50, y: 1000, vx: 0, vy: -speedFor(p), own: 'kid', out: false }], active: 0 };
    var t = 0;
    while (t < 4000 && moving(w.stones[0])) {
      var s = w.stones[0], sp = -s.vy, dt = DT / SUB;
      for (var k = 0; k < SUB && sp > 0; k++) {
        var ns = Math.max(0, sp - FRICTION * (snow ? SNOW : 1) * dt);
        if (ns < 0.05) { sp = 0; break; }
        sp = ns; s.y -= sp * dt;
      }
      s.vy = -sp; t++;
    }
    return 1000 - w.stones[0].y;
  }
  /* 거리 dist를 가려면 필요한 힘(1을 넘을 수도 있음 — 눈 얼음) */
  function powerFor(dist, snow) {
    var lo = -0.2, hi = 3;
    for (var i = 0; i < 40; i++) { var m = (lo + hi) / 2; if (travel(m, snow) < dist) lo = m; else hi = m; }
    return Math.max(0, (lo + hi) / 2);
  }
  /* 방향 aim으로 던졌을 때 과녁 가운데에 가장 가까워지는 거리 */
  function alongDist(house, aimDeg) {
    var a = rad(aimDeg);
    return (house.x - START_X) * Math.sin(a) - (house.y - START_Y) * Math.cos(a);
  }
  function aimTo(x, y) { return deg(Math.atan2(x - START_X, START_Y - y)); }
  function clampAim(a) { return Math.max(-MAX_AIM, Math.min(MAX_AIM, a)); }
  function starsAt(house, s) {
    if (!s || s.out) return 0;
    var d = Math.sqrt((s.x - house.x) * (s.x - house.x) + (s.y - house.y) * (s.y - house.y));
    if (d <= house.r[0]) return 3;
    if (d <= house.r[1]) return 2;
    if (d <= house.r[2]) return 1;
    return 0;
  }
  function distTo(house, s) { return Math.sqrt((s.x - house.x) * (s.x - house.x) + (s.y - house.y) * (s.y - house.y)); }

  /* 판이 이겼나: guard/plain = 내 돌이 과녁 안, knock = 과녁 안 + 젤리 돌보다 가깝게 */
  function wins(lay, w) {
    var me = w.stones[w.active];
    if (starsAt(lay.house, me) < 1) return false;
    if (!lay.knock) return true;
    var dm = distTo(lay.house, me);
    for (var i = 0; i < w.stones.length; i++) {
      var s = w.stones[i];
      if (i === w.active || s.out || s.own !== 'jelly') continue;
      if (starsAt(lay.house, s) >= 1 && distTo(lay.house, s) <= dm) return false;
    }
    return true;
  }
  /* 풀이기: 방향 × 힘 (× 솔질) 을 모두 던져 보고 이기는 수와 가장 좋은 수 */
  function solve(lay) {
    var aims = [], a, p, best = null, okCount = 0, tries = 0;
    if (lay.aim) for (a = -MAX_AIM; a <= MAX_AIM + 0.001; a += 1) aims.push(a); else aims.push(0);
    var brushes = lay.snow ? [0, 15, 30, 45, 60] : [0];
    for (var ai = 0; ai < aims.length; ai++) {
      for (p = 0.2; p <= 1.0001; p += 0.02) {
        for (var bi = 0; bi < brushes.length; bi++) {
          tries++;
          var w = simulate(lay.stones, p, aims[ai], { snow: lay.snow, brushTicks: brushes[bi] });
          if (!wins(lay, w)) continue;
          okCount++;
          var st = starsAt(lay.house, w.stones[w.active]), dd = distTo(lay.house, w.stones[w.active]);
          if (!best || st > best.stars || (st === best.stars && dd < best.dist)) {
            best = { aim: aims[ai], power: Math.round(p * 100) / 100, brushTicks: brushes[bi], stars: st, dist: dd };
          }
        }
      }
    }
    return { ok: okCount, tries: tries, best: best };
  }

  /* 젤리가 던지는 수: 가운데를 노리되 방향·힘이 조금씩 흔들림(err = 힘 흔들림). 눈 얼음에서 힘이 모자라면 솔질로 보탠다 */
  function jellyShot(hs, sp, err, rnd) {
    rnd = rnd || Math.random;
    var a = (sp.aim ? aimTo(hs.x, hs.y) : 0) + gauss(rnd) * 1.2;
    var need = powerFor(alongDist(hs, a), sp.snow);
    var p = Math.max(0.2, Math.min(1, need + gauss(rnd) * err)), bt = 0;
    if (sp.snow && need > 1) {
      var want = alongDist(hs, a), bestT = 0, bestE = 1e9;
      for (var t = 0; t <= 90; t += 3) {
        var s = simulate([], 1, a, { snow: true, brushTicks: t }).stones[0];
        var got = (s.x - START_X) * Math.sin(rad(a)) - (s.y - START_Y) * Math.cos(rad(a));
        if (Math.abs(got - want) < bestE) { bestE = Math.abs(got - want); bestT = t; }
      }
      p = 1; bt = Math.max(0, Math.round(bestT + gauss(rnd) * 6 * err / 0.06));
    }
    return { power: p, aim: a, brushTicks: bt };
  }
  /* 번갈아 칸: 과녁에 닿지 못하고 앞에 멈춘 돌은 치운다(앞을 막는 돌이 쌓이지 않게) */
  function clearShort(stones, hs) {
    var n = 0;
    stones.forEach(function (s) { if (!s.out && s.y > hs.y + hs.r[2] + R_STONE) { s.out = true; n++; } });
    return n;
  }
  function gauss(rnd) { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* 칸 내용 → 판 하나(과녁 자리 · 놓인 돌). rnd 주면 그것으로(시험용) */
  function makeLayout(sp, rnd) {
    rnd = rnd || Math.random;
    var ring = sp.ring || 1;
    for (var guardTry = 0; guardTry < 60; guardTry++) {
      var hx = 50, hy = HOUSE_Y;
      if (sp.move) hy = sp.snow ? 16 + rnd() * 14 : 18 + rnd() * 20;
      if (sp.aim) hx = 50 + (rnd() < 0.5 ? -1 : 1) * (6 + rnd() * 9);
      var house = { x: hx, y: hy, r: [RING[0] * ring, RING[1] * ring, RING[2] * ring], ring: ring };
      var lay = { house: house, stones: [], aim: !!sp.aim, snow: !!sp.snow, knock: !!sp.knock, guard: !!sp.guard,
                  versus: sp.versus || 0 };
      if (sp.guard) {
        /* 과녁 가운데로 가는 곧은 길 위(조금 비껴) — 곧게 던지면 부딪힌다 */
        var t = 0.22 + rnd() * 0.14;
        var gx = START_X + (hx - START_X) * (1 - t) , gy = START_Y + (hy - START_Y) * (1 - t);
        var L = Math.sqrt((hx - START_X) * (hx - START_X) + (hy - START_Y) * (hy - START_Y));
        var off = (rnd() < 0.5 ? -1 : 1) * (2 + rnd() * 2.5);   // 길 한가운데에서 2~4.5칸 비껴 — 한쪽으로 돌아갈 틈
        gx += -(hy - START_Y) / L * off; gy += (hx - START_X) / L * off;
        lay.stones.push({ x: gx, y: gy, own: 'jelly' });
      }
      if (sp.knock) lay.stones.push({ x: hx + (rnd() - 0.5) * 3, y: hy + (rnd() - 0.5) * 3, own: 'jelly' });
      if (lay.stones.length) {
        var sv = solve(lay);
        if (sv.ok < MIN_WAYS) continue;   // 넣을 수 있는 수(방향×힘×솔질)가 너무 적으면 다시 만든다
        lay.solution = sv.best; lay.solveCount = sv.ok; lay.solveTries = sv.tries;
      } else {
        var aimC = lay.aim ? aimTo(hx, hy) : 0;
        var need = powerFor(alongDist(house, aimC), lay.snow);
        lay.solution = { aim: Math.round(aimC * 10) / 10, power: Math.round(Math.min(1, need) * 100) / 100,
                         brushTicks: need > 1 ? -1 : 0, stars: 3 };
      }
      lay.tries = guardTry + 1;
      return lay;
    }
    return null;
  }

  /* 아이콘(SVG, 색은 글자값) */
  function icon(name, color) {
    var c = color || '#ffffff';
    var body = {
      play: '<path d="M5 3.2v13.6c0 .7.8 1.1 1.4.7l10-6.8c.5-.4.5-1.1 0-1.4l-10-6.8C5.8 2.1 5 2.5 5 3.2z" fill="' + c + '"/>',
      stone: '<ellipse cx="10" cy="13" rx="7.5" ry="4.6" fill="' + c + '"/><path d="M7 9.2V6.4h6" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      broom: '<path d="M14.5 2.5l-6 9" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/><path d="M4 12.5l5.6 3.6-1.4 2.4L2.5 15z" fill="' + c + '"/>',
      mark: '<rect x="3" y="8.6" width="14" height="2.8" rx="1.4" fill="' + c + '"/><path d="M3 4.5h14M3 15.5h14" stroke="' + c + '" stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.5"/>',
      left: '<path d="M12.5 4l-6 6 6 6" fill="none" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
      right: '<path d="M7.5 4l6 6-6 6" fill="none" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
      soundOn: '<path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="' + c + '"/><path d="M13 7a4 4 0 0 1 0 6M15.2 4.8a7 7 0 0 1 0 10.4" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
      soundOff: '<path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="' + c + '"/><path d="M13 7.5l5 5M18 7.5l-5 5" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>'
    }[name];
    return '<svg class="cu-ic" viewBox="0 0 20 20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  }
  function starPts(cx, cy, R, r) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var rr = i % 2 ? r : R, a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((cx + Math.cos(a) * rr).toFixed(2) + ',' + (cy + Math.sin(a) * rr).toFixed(2));
    }
    return pts.join(' ');
  }
  function starSVG(on) {
    return '<svg class="cu-star" viewBox="0 0 20 20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><polygon points="' + starPts(10, 10.6, 9, 4) +
      '" fill="' + (on ? '#ffd23f' : '#ffffff') + '" stroke="' + (on ? '#e0a100' : '#cfc3ee') + '" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  }
  /* 돌 그림(가운데 0,0) — own: kid(민트) / jelly(분홍, 얼굴) */
  function stoneSVG(own, cls) {
    var kid = own === 'kid';
    return '<g class="' + (cls || '') + '">' +
      '<ellipse cx="0" cy="1.1" rx="3.3" ry="2.6" fill="#1b1462" fill-opacity="0.18"/>' +
      '<circle r="3.2" fill="' + (kid ? '#3ddc97' : '#ff8fc8') + '" stroke="' + (kid ? '#16a06a' : '#d94f98') + '" stroke-width="0.6"/>' +
      '<circle r="2.1" fill="' + (kid ? '#b9ffe0' : '#ffd0e8') + '"/>' +
      (kid ? '<rect x="-1.5" y="-0.5" width="3" height="1" rx="0.5" fill="#16a06a"/>'
           : '<circle cx="-0.8" cy="-0.3" r="0.38" fill="#3b2a9e"/><circle cx="0.8" cy="-0.3" r="0.38" fill="#3b2a9e"/>' +
             '<path d="M-0.6 0.6q0.6 0.5 1.2 0" fill="none" stroke="#3b2a9e" stroke-width="0.3" stroke-linecap="round"/>') +
      '</g>';
  }

  /* 얼음판 SVG — 색은 모두 글자값 */
  function sheetSVG() {
    var flakes = '';
    var fl = [[22, 14], [70, 9], [30, 33], [78, 40], [19, 52], [61, 57], [40, 70], [76, 74], [26, 84], [55, 93], [46, 18], [66, 29]];
    fl.forEach(function (q) { flakes += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="0.9" fill="#ffffff"/>'; });
    return '<svg class="cu-sheet" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="cu-bar-g" x1="0" y1="1" x2="0" y2="0">' +
        '<stop offset="0" stop-color="#3ddc97"/><stop offset="0.55" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff9f43"/></linearGradient></defs>' +
      '<rect x="' + SHEET_L + '" y="' + SHEET_T + '" width="' + (SHEET_R - SHEET_L) + '" height="' + (SHEET_B - SHEET_T) + '" rx="3" fill="#eaf6ff" stroke="#ffffff" stroke-width="0.9"/>' +
      '<rect class="cu-snow" x="' + SHEET_L + '" y="' + SHEET_T + '" width="' + (SHEET_R - SHEET_L) + '" height="' + (SHEET_B - SHEET_T) + '" rx="3" fill="#ffffff" fill-opacity="0.55" display="none"/>' +
      '<g class="cu-flakes" display="none">' + flakes + '</g>' +
      '<line x1="50" y1="' + (SHEET_T + 1) + '" x2="50" y2="' + (SHEET_B - 1) + '" stroke="#b7d9f2" stroke-width="0.35"/>' +
      '<line x1="' + SHEET_L + '" y1="' + BACK_Y + '" x2="' + SHEET_R + '" y2="' + BACK_Y + '" stroke="#9bc8e8" stroke-width="0.5"/>' +
      '<line x1="' + SHEET_L + '" y1="80" x2="' + SHEET_R + '" y2="80" stroke="#9bc8e8" stroke-width="0.5" stroke-dasharray="1.6 1.2"/>' +
      '<g class="cu-house">' +
        '<circle class="cu-r2" r="15" fill="#4bc9dc" fill-opacity="0.75" stroke="#2cb7cb" stroke-width="0.4"/>' +
        '<circle class="cu-r1" r="10" fill="#ffffff"/>' +
        '<circle class="cu-r0" r="5" fill="#ff8a80" fill-opacity="0.85"/>' +
        '<circle r="0.8" fill="#3b2a9e"/>' +
      '</g>' +
      '<line class="cu-aim" x1="50" y1="' + START_Y + '" x2="50" y2="60" stroke="#5b48d6" stroke-width="0.7" stroke-dasharray="1.6 1.4" stroke-linecap="round" display="none"/>' +
      '<line class="cu-cue" x1="50" y1="' + START_Y + '" x2="50" y2="30" stroke="#ffd23f" stroke-width="1.1" stroke-dasharray="2 1.4" stroke-linecap="round" display="none"/>' +
      '<g class="cu-stones"></g>' +
      '<g class="cu-broom" display="none">' +
        '<path d="M-3.6 0q3.6 -2.2 7.2 0" fill="none" stroke="#ff9f43" stroke-width="0.9" stroke-linecap="round"/>' +
        '<path d="M-2.6 -1.4q2.6 -1.6 5.2 0" fill="none" stroke="#ffd23f" stroke-width="0.7" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="cu-spare"></g>' +
      /* 힘 막대(오른쪽) */
      '<g class="cu-bar">' +
        '<rect x="89.5" y="30" width="7" height="62" rx="3.5" fill="#1b1462" fill-opacity="0.45" stroke="#ffffff" stroke-opacity="0.6" stroke-width="0.6"/>' +
        '<rect class="cu-bar-f" x="90.5" y="91" width="5" height="0" rx="2.5" fill="url(#cu-bar-g)"/>' +
        '<rect class="cu-bar-m" x="88.6" y="60" width="8.8" height="1.6" rx="0.8" fill="#ffd23f" stroke="#e0a100" stroke-width="0.4" display="none"/>' +
        '<path class="cu-bar-n" d="M86.6 0l2.6 -1.8v3.6z" fill="#ffffff" transform="translate(0 91)"/>' +
      '</g>' +
    '</svg>';
  }

  /* ───────────── 스타일 ───────────── */
  var CSS = [
    '.cu-root{--v8:#3b2a9e;--v7:#4a32c9;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--coral:#ff8a80;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}',
    '.cu-root{container:cu / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.cu-root *,.cu-root *::before,.cu-root *::after{box-sizing:border-box}',
    '.cu-root [hidden]{display:none!important}',
    '.cu-ic{width:1.05em;height:1.05em;flex:none;display:block}',
    '.cu-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    /* 무대: 얼음판 */
    '.cu-arena{container:cuarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'border-radius:18px;background:radial-gradient(circle at 50% 58%,#5b48d6 0%,#3b2a9e 50%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22);touch-action:none;cursor:pointer}',
    '.cu-rays{position:absolute;left:50%;top:58%;width:1400px;height:1400px;margin:-700px 0 0 -700px;pointer-events:none;',
    'background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.04) 0 8deg,transparent 8deg 20deg);animation:cu-spin 90s linear infinite}',
    '.cu-sheet{position:absolute;left:3%;top:3%;width:94%;height:94%;display:block;pointer-events:none}',
    '.cu-toast{position:absolute;left:50%;top:50%;z-index:5;transform:translate(-50%,-50%);max-width:88%;padding:.35em .9em;border-radius:99px;',
    'display:flex;align-items:center;gap:.25em;font-size:clamp(15px,7cqmin,30px);font-weight:900;letter-spacing:-.02em;white-space:nowrap;color:#3b2a9e;background:#fff8e8;',
    'box-shadow:0 4px 0 rgba(27,20,98,.35),0 0 0 3px rgba(255,255,255,.25);pointer-events:none;animation:cu-pop .35s cubic-bezier(.3,1.5,.5,1)}',
    '.cu-toast .cu-star{width:1.1em;height:1.1em}',
    '.cu-toast.is-good{background:#eafff5;color:#14704b}',
    '.cu-toast.is-new{background:var(--gold);color:#3b2a9e}',
    '.cu-hint{position:absolute;left:50%;bottom:2.5%;z-index:4;transform:translateX(-50%);padding:3px 12px;border-radius:99px;white-space:nowrap;',
    'background:rgba(27,20,98,.55);color:#fff;font-size:clamp(11px,3.6cqmin,15px);font-weight:800;pointer-events:none}',
    '.cu-hint.is-top{bottom:auto;top:2.5%}',
    '.cu-aimb{position:absolute;bottom:4%;z-index:4;display:grid;place-items:center;width:clamp(36px,11cqmin,52px);height:clamp(36px,11cqmin,52px);',
    'border:0;border-radius:50%;background:#fff;color:#5b48d6;font-size:clamp(18px,6cqmin,26px);box-shadow:0 3px 0 #3b2a9e;cursor:pointer;touch-action:manipulation}',
    '.cu-aimb.is-l{left:4%}.cu-aimb.is-r{right:17%}',
    '.cu-aimb:active{transform:translateY(2px);box-shadow:0 1px 0 #3b2a9e}',

    /* 오른쪽 칸 */
    '.cu-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.cu-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.cu-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.cu-mini{flex:1 1 auto;min-width:60px;max-width:220px;height:30px;margin-left:auto}',
    '.cu-lv{flex:none;display:inline-flex;align-items:center;height:28px;padding:0 9px;border-radius:9px;background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);',
    'color:#b07a00;font-size:13px;font-weight:900;white-space:nowrap}',
    '.cu-lv.is-up{animation:cu-pop2 .5s cubic-bezier(.3,1.5,.5,1)}',
    '.cu-sound{flex:none;display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:18px;line-height:1;cursor:pointer}',
    '.cu-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.cu-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.cu-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.cu-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.cu-coach.is-temp .cu-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.cu-coach.is-good .cu-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.cu-prog{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:var(--muted)}',
    '.cu-prog i{width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px var(--v3)}',
    '.cu-prog i.on{background:var(--mint);box-shadow:none}.cu-prog i.now{box-shadow:inset 0 0 0 3px var(--gold)}',
    '.cu-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.cu-info-map{width:100%;flex:1 1 auto;min-height:40px;max-height:150px}',
    '.cu-info-big{font-size:clamp(17px,5cqh,24px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.cu-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:800;color:var(--muted)}',
    '.cu-panel{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(4px,2cqh,12px);padding:8px 10px;',
    'border-radius:16px;background:#f3effd;box-shadow:inset 0 0 0 2px #e6dffa}',
    '.cu-row{display:flex;align-items:center;gap:8px;font-size:clamp(12px,3.5cqh,15px);font-weight:900;color:var(--v6);white-space:nowrap}',
    '.cu-row b{min-width:3.6em;text-align:right}',
    '.cu-pips{display:flex;gap:6px}',
    '.cu-pips i{--d:clamp(16px,5.6cqh,26px);width:var(--d);height:var(--d);border-radius:50%;box-shadow:inset 0 0 0 2px var(--v3);background:#fff}',
    '.cu-pips i.kid{background:radial-gradient(circle at 50% 50%,#b9ffe0 0 38%,#3ddc97 40%);box-shadow:0 2px 0 #16a06a}',
    '.cu-pips i.jelly{background:radial-gradient(circle at 50% 50%,#ffd0e8 0 38%,#ff8fc8 40%);box-shadow:0 2px 0 #d94f98}',
    '.cu-pips i.used{opacity:.25}',
    '.cu-stars{display:flex;gap:4px}',
    '.cu-stars .cu-star{width:clamp(20px,7cqh,34px);height:clamp(20px,7cqh,34px);display:block}',
    '.cu-stars .cu-star.is-new{animation:cu-pop2 .4s cubic-bezier(.3,1.5,.5,1)}',
    '.cu-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.cu-left{display:flex;align-items:center;gap:8px;margin-right:auto;min-width:0}',
    '.cu-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.cu-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22);touch-action:none}',
    '.cu-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.cu-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3);padding:0 14px}',
    '.cu-btn.is-hold{min-height:56px;padding:0 22px;background:linear-gradient(135deg,#16a06a,#3ddc97);box-shadow:0 4px 0 #0e7a50,0 8px 16px rgba(22,160,106,.25)}',
    '.cu-btn.is-hold.is-down,.cu-btn.is-hold:active{transform:none;box-shadow:inset 0 3px 0 rgba(0,0,0,.2),0 1px 0 #0e7a50;filter:brightness(1.08)}',
    '.cu-btn.is-hold.is-brush{background:linear-gradient(135deg,#e0a100,#ffd23f);color:#3b2a9e;box-shadow:0 4px 0 #b07a00}',
    '.cu-btn.is-off{opacity:.45;pointer-events:none}',
    '.cu-btn:focus-visible,.cu-sound:focus-visible,.cu-aimb:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    /* 끝 화면 */
    '.cu-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px 16px 26px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.cu-end-img{width:clamp(64px,19cqh,110px);height:clamp(64px,19cqh,110px);object-fit:contain}',
    '.cu-end h2{margin:0;font-size:clamp(22px,6.4cqh,32px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.cu-end-line{margin:0;font-size:clamp(15px,4.4cqh,20px);font-weight:900;color:#b07a00}',
    '.cu-end .cu-btns{margin:0;justify-content:center}',
    '.cu-end-map{width:min(520px,92cqw);height:clamp(70px,24cqh,140px)}',
    '.cu-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.cu-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '.cu-bit{position:absolute;left:50%;top:50%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:cu-bit .9s ease-out forwards}',
    '@keyframes cu-spin{to{transform:rotate(360deg)}}',
    '@keyframes cu-pop{from{transform:translate(-50%,-50%) scale(.7)}}',
    '@keyframes cu-pop2{from{transform:scale(.7)}}',
    '@keyframes cu-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    '@container cu (max-aspect-ratio:5/4){',
    '.cu-wrap{--arena:min(calc(100cqw - 24px),52cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.cu-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.cu-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('cu-style')) return;
    var s = document.createElement('style');
    s.id = 'cu-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ───────────── 작은 도구 ───────────── */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(t, map) {
    return String(t).replace(/\{(\w+)\}/g, function (m, k) { return map[k] != null ? map[k] : m; });
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function r2(n) { return Math.round(n * 100) / 100; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function mean(a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : null; }

  /* ───────────── 효과음(웹 오디오로 합성 — 파일 없음) ───────────── */
  var AC = null;
  function ac() {
    AC = AC || new (global.AudioContext || global.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tones(freqs, step, type, vol) {
    try {
      var A = ac(), t0 = A.currentTime;
      freqs.forEach(function (f, i) {
        var o = A.createOscillator(), g = A.createGain(), t = t0 + i * step;
        o.type = type || 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.16, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + step + 0.12);
        o.connect(g); g.connect(A.destination);
        o.start(t); o.stop(t + step + 0.15);
      });
    } catch (e) { /* 소리가 없어도 게임은 돈다 */ }
  }
  /* 얼음 미끄러지는 소리·솔질 소리: 걸러 낸 잡음 */
  function noise(sec, freq, vol, q) {
    try {
      var A = ac(), n = Math.floor(A.sampleRate * sec), buf = A.createBuffer(1, n, A.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      var src = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain(), t = A.currentTime;
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 0.8;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + sec);
      src.connect(f); f.connect(g); g.connect(A.destination);
      src.start(t); src.stop(t + sec + 0.05);
    } catch (e) {}
  }
  var SFX = {
    slide: function (sec) { noise(Math.min(3, sec || 1.5), 380, 0.07, 0.6); },
    brush: function () { noise(0.12, 2600, 0.05, 1.2); },
    clack: function () { tones([1240, 620], 0.03, 'triangle', 0.14); },
    wall: function () { tones([300], 0.04, 'triangle', 0.08); },
    edge: function () { tones([880], 0.03, 'sine', 0.04); },
    star: function (n) { tones([659, 784, 988, 1175].slice(0, (n || 1) + 1), 0.08, 'sine', 0.13); },
    miss: function () { tones([440, 392], 0.1, 'triangle', 0.1); },
    quick: function () { tones([520], 0.05, 'triangle', 0.07); },
    up: function () { tones([523, 659, 784, 1047], 0.08, 'sine', 0.14); },
    down: function () { tones([587, 523], 0.12, 'sine', 0.1); },
    pick: function () { tones([740], 0.05, 'sine', 0.08); },
    done: function () { tones([523, 659, 784, 1047], 0.09, 'sine', 0.14); }
  };

  /* ───────────── 게임 ───────────── */
  function mount(host, options) {
    injectCSS();
    if (!global.OncuLadder) throw new Error('shared/ladder.js 를 curling.js 보다 먼저 불러 주세요');
    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    for (k in options || {}) o[k] = options[k];
    var T = {};
    for (k in TEXT) T[k] = TEXT[k];
    for (k in o.texts || {}) T[k] = o.texts[k];
    var LD = o.ladder || {};
    var STEPS = LD.steps || [];
    var CH = o.challenge || {};
    var CH_TRIALS = Math.max(1, CH.trials || 15), CH_MS = (CH.minutes == null ? 10 : CH.minutes) * 60000,
        CH_BREAK = CH.breakEvery || 5;
    var storeKey = (o.storageKey || o.activityId) + ':';
    var reduced = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coach = global.OncuLadder.isCoach();

    var ladder = global.OncuLadder.create({
      id: o.storageKey || o.activityId, steps: STEPS,
      tries: LD.tries, upNeed: LD.upNeed, downAfter: LD.downAfter, warmup: LD.warmup
    });

    var soundOn = o.sound;
    try { var sv = sessionStorage.getItem(storeKey + 'sound'); if (sv !== null) soundOn = sv === '1'; } catch (e) {}
    function sfx(name, a) { if (soundOn) SFX[name](a); }

    function log(type, detail) {
      var d = { type: type, schemaVersion: '0.2', activityId: o.activityId };
      for (var key in detail) d[key] = detail[key];
      try { global.dispatchEvent(new CustomEvent('oncuvate:log', { detail: d })); } catch (e) {}
      if (o.debug && global.console) console.log('[oncuvate:log]', d);
    }
    function coachSrc(mood) { return o.coachBase ? o.coachBase + COACH[mood] + o.coachExt : ''; }
    if (o.coachBase) Object.keys(COACH).forEach(function (m) { var im = new Image(); im.src = coachSrc(m); });

    var root = h('div', 'cu-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.setAttribute('data-inhibition-load', 'primary');
    root.innerHTML =
      '<div class="cu-wrap">' +
        '<div class="cu-arena"><div class="cu-rays"></div>' + sheetSVG() +
          '<button type="button" class="cu-aimb is-l" data-cu-act="aimL" aria-label="' + esc(T.aimLeft) + '" hidden>' + icon('left', '#5b48d6') + '</button>' +
          '<button type="button" class="cu-aimb is-r" data-cu-act="aimR" aria-label="' + esc(T.aimRight) + '" hidden>' + icon('right', '#5b48d6') + '</button>' +
          '<div class="cu-hint" hidden></div><div class="cu-toast" hidden></div></div>' +
        '<aside class="cu-side">' +
          '<div class="cu-top">' +
            '<span class="cu-title">' + esc(T.title) + '</span>' +
            '<span class="cu-mini"></span>' +
            '<span class="cu-lv"></span>' +
            '<button type="button" class="cu-sound" data-cu-act="sound"></button>' +
          '</div>' +
          '<div class="cu-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="cu-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="cu-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="cu-prog" hidden></div>' +
          '<div class="cu-info" hidden></div>' +
          '<div class="cu-panel" hidden>' +
            '<div class="cu-row cu-row-kid"><b>' + esc(T.myStones) + '</b><span class="cu-pips cu-pips-kid"></span></div>' +
            '<div class="cu-row cu-row-jelly"><b>' + esc(T.jellyStones) + '</b><span class="cu-pips cu-pips-jelly"></span></div>' +
            '<div class="cu-row"><b>' + esc(T.lastStars) + '</b><span class="cu-stars"></span></div>' +
          '</div>' +
          '<div class="cu-actions"><div class="cu-left"></div><div class="cu-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="cu-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="cu-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="cu-end-line"></p><div class="cu-end-map"></div><div class="cu-btns"></div>' +
        (o.credit ? '<p class="cu-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'cu-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elSound = $('.cu-sound'), elArena = $('.cu-arena'), elSheet = $('.cu-sheet'), elToast = $('.cu-toast'), elHint = $('.cu-hint'),
        elCoach = $('.cu-coach'), elCoachImg = $('.cu-coach-img'), elBubble = $('.cu-bubble'),
        elProg = $('.cu-prog'), elInfo = $('.cu-info'), elPanel = $('.cu-panel'), elLeft = $('.cu-left'),
        elActs = $('.cu-side .cu-btns'), elEnd = $('.cu-end'), elMini = $('.cu-mini'), elLv = $('.cu-lv'),
        elAimL = $('.cu-aimb.is-l'), elAimR = $('.cu-aimb.is-r'),
        elPipsK = $('.cu-pips-kid'), elPipsJ = $('.cu-pips-jelly'), elRowJ = $('.cu-row-jelly'), elStars = $('.cu-stars');
    var sv_ = {
      house: $('.cu-house'), r0: $('.cu-r0'), r1: $('.cu-r1'), r2: $('.cu-r2'), aim: $('.cu-aim'), cue: $('.cu-cue'),
      stones: $('.cu-stones'), broom: $('.cu-broom'), snow: $('.cu-snow'), flakes: $('.cu-flakes'), left: $('.cu-spare'),
      barF: $('.cu-bar-f'), barM: $('.cu-bar-m'), barN: $('.cu-bar-n')
    };

    function paintSound() {
      elSound.innerHTML = icon(soundOn ? 'soundOn' : 'soundOff', '#5b48d6');
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    /* G: 오늘의 도전 / R: 지금 한 번 / W: 얼음판 위 돌들 */
    var G = null, R = null, W = null, timers = [], tempTimer = null, toastTimer = null, loopT = null, holdBtn = null;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; stopLoop(); }

    function stepAt(lv) { return STEPS[lv - 1] || {}; }
    function stepOpts(sp) {
      return { ring: sp.ring || 1, barMs: sp.barMs || 1500, move: !!sp.move, aim: !!sp.aim, guard: !!sp.guard, knock: !!sp.knock,
               snow: !!sp.snow, versus: sp.versus || 0, chances: Math.max(1, sp.chances || o.chances || 3) };
    }
    /* 이 칸에서 처음 나오는 것(바로 아래 칸과 견주어) */
    function newThing(lv) {
      var a = stepOpts(stepAt(lv)), b = lv > 1 ? stepOpts(stepAt(lv - 1)) : null;
      if (!b) return '';
      if (a.versus && !b.versus) return T.newVersus;
      if (a.snow && !b.snow) return T.newSnow;
      if (a.knock && !b.knock) return T.newKnock;
      if (a.guard && !b.guard) return T.newGuard;
      if (a.aim && !b.aim) return T.newAim;
      if (a.move && !b.move) return T.newMove;
      if (a.barMs < b.barMs) return T.newBar;
      if (a.ring < b.ring) return T.newRing;
      return '';
    }

    var sayText = '', sayMood = 'ready';
    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'cu-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { sayText = text; sayMood = mood; }
    }
    function sayTemp(text, mood, cls, ms) {
      say(text, mood, cls || 'is-temp');
      tempTimer = setTimeout(function () { say(sayText, sayMood); }, ms || 1500);
    }
    function toast(html, cls, ms) {
      clearTimeout(toastTimer);
      elToast.className = 'cu-toast' + (cls ? ' ' + cls : '');
      elToast.innerHTML = html;
      elToast.hidden = false;
      void elToast.offsetWidth;
      toastTimer = setTimeout(function () { elToast.hidden = true; }, ms || 900);
    }
    function button(label, act, cls, attrs) {
      var b = h('button', 'cu-btn' + (cls ? ' ' + cls : ''), label);
      b.type = 'button';
      b.setAttribute('data-cu-act', act);
      for (var a in attrs || {}) b.setAttribute(a, attrs[a]);
      return b;
    }
    function setActions(list, left) {
      elActs.innerHTML = '';
      list.forEach(function (b) { elActs.appendChild(b); });
      elLeft.innerHTML = '';
      (left || []).forEach(function (b) { elLeft.appendChild(b); });
    }

    /* 단계 지도 */
    function paintMap(pop) {
      elMini.innerHTML = ladder.mapSVG({ mini: true });
      elLv.textContent = fmt(T.levelChip, { n: ladder.level() });
      if (pop) { elLv.classList.remove('is-up'); void elLv.offsetWidth; elLv.classList.add('is-up'); }
    }
    function paintProg() {
      elProg.innerHTML = '';
      var segStart = Math.floor(G.done / CH_BREAK) * CH_BREAK;
      var segLen = Math.min(CH_BREAK, CH_TRIALS - segStart);
      for (var j = 0; j < segLen; j++) {
        var n = segStart + j;
        elProg.appendChild(h('i', n < G.done ? 'on' : (n === G.done ? 'now' : '')));
      }
    }
    function showInfo(kind) {
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var map = h('div', 'cu-info-map', ladder.mapSVG());
      if (kind === 'rest') {
        elInfo.appendChild(h('b', 'cu-info-big', esc(T.restTitle)));
        elInfo.appendChild(map);
        elInfo.appendChild(h('span', 'cu-info-small', esc(fmt(T.restLine, { level: ladder.level() }))));
      } else {
        elInfo.appendChild(map);
        elInfo.appendChild(h('span', 'cu-info-small', esc(fmt(T.today, { n: CH_TRIALS }))));
      }
      elInfo.hidden = false;
    }
    function paintPanel(newStars) {
      if (!R || !R.sp) return;
      var sp = R.sp, i, html = '';
      var nk = sp.versus || sp.chances, usedK = sp.versus ? R.kidThrown : R.throws;
      for (i = 0; i < nk; i++) html += '<i class="kid' + (i < usedK ? ' used' : '') + '"></i>';
      elPipsK.innerHTML = html;
      elRowJ.hidden = !sp.versus;
      if (sp.versus) {
        html = '';
        for (i = 0; i < sp.versus; i++) html += '<i class="jelly' + (i < R.jellyThrown ? ' used' : '') + '"></i>';
        elPipsJ.innerHTML = html;
      }
      html = '';
      for (i = 0; i < 3; i++) html += starSVG(i < R.lastStars);
      elStars.innerHTML = html;
      if (newStars) Array.prototype.forEach.call(elStars.children, function (s, j) { if (j < R.lastStars) s.classList.add('is-new'); });
    }

    /* ── 판 그리기 ── */
    function paintLayout() {
      var lay = R && R.lay;
      var hs = lay ? lay.house : { x: 50, y: HOUSE_Y, r: [5, 10, 15] };
      sv_.house.setAttribute('transform', 'translate(' + hs.x.toFixed(2) + ' ' + hs.y.toFixed(2) + ')');
      sv_.r0.setAttribute('r', hs.r[0].toFixed(2)); sv_.r1.setAttribute('r', hs.r[1].toFixed(2)); sv_.r2.setAttribute('r', hs.r[2].toFixed(2));
      var snow = !!(R && R.sp && R.sp.snow);
      sv_.snow.setAttribute('display', snow ? 'inline' : 'none');
      sv_.flakes.setAttribute('display', snow ? 'inline' : 'none');
    }
    function render() {
      /* 돌 */
      var html = '';
      if (W) {
        W.stones.forEach(function (s, i) {
          if (s.out) return;
          html += '<g transform="translate(' + s.x.toFixed(2) + ' ' + s.y.toFixed(2) + ')">' + stoneSVG(s.own, i === W.active ? 'cu-me' : '') + '</g>';
        });
      }
      sv_.stones.innerHTML = html;
      /* 솔 */
      var br = R && R.phase === 'slide' && R.brushing && W && W.stones[W.active] && moving(W.stones[W.active]);
      if (br) {
        var a = W.stones[W.active], sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy) || 1;
        var bx = a.x + a.vx / sp * 5.4, by = a.y + a.vy / sp * 5.4, wig = (R.tick % 4 < 2) ? -1.2 : 1.2;
        sv_.broom.setAttribute('display', 'inline');
        sv_.broom.setAttribute('transform', 'translate(' + (bx + wig).toFixed(2) + ' ' + by.toFixed(2) + ')');
      } else sv_.broom.setAttribute('display', 'none');
      /* 방향 점선 */
      var aiming = R && R.sp && R.sp.aim && (R.phase === 'aim' || R.phase === 'hold');
      if (aiming) {
        var ar = rad(R.aim), L = 26;
        sv_.aim.setAttribute('display', 'inline');
        sv_.aim.setAttribute('x2', (START_X + Math.sin(ar) * L).toFixed(2));
        sv_.aim.setAttribute('y2', (START_Y - Math.cos(ar) * L).toFixed(2));
      } else sv_.aim.setAttribute('display', 'none');
      var cueOn = R && R.cue && R.sp && R.sp.aim && R.lay && R.lay.solution && (R.phase === 'aim' || R.phase === 'hold');
      if (cueOn) {
        var cr = rad(R.lay.solution.aim), CL = 40;
        sv_.cue.setAttribute('display', 'inline');
        sv_.cue.setAttribute('x2', (START_X + Math.sin(cr) * CL).toFixed(2));
        sv_.cue.setAttribute('y2', (START_Y - Math.cos(cr) * CL).toFixed(2));
      } else sv_.cue.setAttribute('display', 'none');
      /* 힘 막대 */
      var p = R && (R.phase === 'hold' || R.phase === 'slide' || R.phase === 'settle') ? R.power : 0;
      var fh = 60 * Math.max(0, Math.min(1, p));
      sv_.barF.setAttribute('y', (91 - fh).toFixed(2));
      sv_.barF.setAttribute('height', fh.toFixed(2));
      sv_.barN.setAttribute('transform', 'translate(0 ' + (91 - fh).toFixed(2) + ')');
      var mk = markPower();
      if (mk != null && R && (R.phase === 'aim' || R.phase === 'hold')) {
        sv_.barM.setAttribute('display', 'inline');
        sv_.barM.setAttribute('y', (91 - 60 * Math.min(1, mk) - 0.8).toFixed(2));
      } else sv_.barM.setAttribute('display', 'none');
      /* 왼쪽: 남은 돌 */
      var lh = '';
      if (R && R.sp) {
        var sp2 = R.sp, nk = sp2.versus || sp2.chances, used = sp2.versus ? R.kidThrown : R.throws, y = sp2.aim ? 74 : 92;
        for (var i = used; i < nk; i++) { lh += '<g transform="translate(7.5 ' + y + ') scale(0.8)">' + stoneSVG('kid') + '</g>'; y -= 7; }
        if (sp2.versus) { y = 10; for (i = R.jellyThrown; i < sp2.versus; i++) { lh += '<g transform="translate(7.5 ' + y + ') scale(0.8)">' + stoneSVG('jelly') + '</g>'; y += 7; } }
      }
      sv_.left.innerHTML = lh;
    }
    /* 힘 막대의 금색 금: 도움(A2)이면 지금 방향의 알맞은 힘, 단서(A4)면 풀이의 힘 */
    function markPower() {
      if (!R || !R.lay) return null;
      if (R.cue) return R.lay.solution ? R.lay.solution.power : idealFor(R.aim);
      if (R.help) return idealFor(R.aim);
      return null;
    }
    function idealFor(aimDeg) {
      if (!R || !R.lay) return null;
      var key = aimDeg.toFixed(1);
      if (!R.idealCache[key]) R.idealCache[key] = powerFor(alongDist(R.lay.house, aimDeg), R.sp.snow);
      return R.idealCache[key];
    }

    /* ── 입력 ── */
    function fieldXY(e) {
      var r = elSheet.getBoundingClientRect();
      if (!r.width) return null;
      return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
    }
    function setAim(a) {
      if (!R || R.phase !== 'aim') return;
      R.aim = Math.round(clampAim(a) * 2) / 2;
      R.aimMoves++;
      render();
    }
    function onArenaDown(e) {
      if (e.target.closest('.cu-aimb')) return;
      if (!R) return;
      if (R.phase === 'slide') { brushOn(e); return; }
      if (R.phase !== 'aim') return;
      var q = fieldXY(e);
      if (R.sp.aim && q && q.y < 74 && q.x > SHEET_L - 2 && q.x < SHEET_R + 2) {
        R.aimDrag = true;
        setAim(aimTo(q.x, Math.min(q.y, START_Y - 8)));
        try { elArena.setPointerCapture(e.pointerId); } catch (er) {}
        return;
      }
      holdStart(e, elArena);
    }
    function onArenaMove(e) {
      if (!R || !R.aimDrag || R.phase !== 'aim') return;
      var q = fieldXY(e);
      if (q) setAim(aimTo(q.x, Math.min(q.y, START_Y - 8)));
    }
    function onUp() {
      if (R) R.aimDrag = false;
      if (R && R.phase === 'hold') release();
      else if (R && R.brushing) brushOff();
    }
    function onHoldDown(e) {
      if (!R) return;
      if (R.phase === 'slide') { brushOn(e); return; }
      if (R.phase === 'aim') holdStart(e, holdBtn);
    }
    function onKeyDown(e) {
      if (!R || !root.isConnected) return;
      var k2 = e.key;
      if (k2 === ' ' || k2 === 'Spacebar') {
        if (e.target && e.target.closest && e.target.closest('button') && R.phase !== 'aim' && R.phase !== 'hold' && R.phase !== 'slide') return;
        e.preventDefault();
        if (e.repeat) return;
        if (R.phase === 'aim') holdStart(null, null);
        else if (R.phase === 'slide') brushOn(null);
        return;
      }
      if ((k2 === 'ArrowLeft' || k2 === 'Left' || k2 === 'ArrowRight' || k2 === 'Right') && R.phase === 'aim' && R.sp.aim) {
        e.preventDefault();
        setAim(R.aim + ((k2 === 'ArrowLeft' || k2 === 'Left') ? -AIM_STEP : AIM_STEP));
      }
    }
    function onKeyUp(e) {
      if (e.key !== ' ' && e.key !== 'Spacebar') return;
      if (R && R.phase === 'hold') release();
      else if (R && R.brushing) brushOff();
    }
    function onBlur() { if (R && R.phase === 'hold') release(); else if (R && R.brushing) brushOff(); }

    function holdStart(e, el) {
      if (!R || R.phase !== 'aim') return;
      if (e && el) { try { el.setPointerCapture(e.pointerId); } catch (er) {} }
      R.phase = 'hold';
      R.power = 0; R.dir = 1; R.holdTicks = 0; R.cycles = 0;
      R.input = e ? (e.pointerType || 'pointer') : 'key';
      if (holdBtn) holdBtn.classList.add('is-down');
      elHint.hidden = true;
      say(T.holding, 'play');
      render();
    }
    function brushOn(e) {
      if (!R || R.phase !== 'slide' || !R.sp.snow || !R.kidTurn) return;
      R.brushing = true;
      if (holdBtn) holdBtn.classList.add('is-down');
      if (e && e.pointerId != null) { try { (e.currentTarget || elArena).setPointerCapture(e.pointerId); } catch (er) {} }
    }
    function brushOff() {
      if (!R) return;
      R.brushing = false;
      if (holdBtn) holdBtn.classList.remove('is-down');
    }

    /* ── 놀이 반복(30ms 고정 간격) ── */
    function stopLoop() { if (loopT) { clearTimeout(loopT); loopT = null; } }
    function startLoop() { stopLoop(); loopT = setTimeout(tick, TICK_MS); }
    function playing() { return R && (R.phase === 'aim' || R.phase === 'hold' || R.phase === 'slide' || R.phase === 'settle' || R.phase === 'jelly'); }
    function tick() {
      loopT = null;
      if (!playing()) return;
      R.tick++;
      if (R.phase === 'hold') {
        R.holdTicks++;
        R.power += R.dir * DT / (R.sp.barMs / 1000);
        if (R.power >= 1) { R.power = 2 - R.power; R.dir = -1; sfx('edge'); }
        else if (R.power <= 0) { R.power = -R.power; R.dir = 1; R.cycles++; }
      } else if (R.phase === 'slide') {
        if (!R.kidTurn) R.brushing = R.jellyT++ < R.jellyBrush;     // 젤리는 정해 둔 틱만큼 솔질
        var ev = stepWorld(W, R.brushing);
        if (R.brushing && moving(W.stones[W.active])) { if (R.kidTurn) R.brushTicks++; if (R.tick % 4 === 0) sfx('brush'); }
        if (ev.bumped) { sfx('clack'); R.bumps++; }
        if (ev.walled) sfx('wall');
        if (allStopped(W)) settle();
      }
      render();
      if (R && playing()) loopT = setTimeout(tick, TICK_MS);
    }

    function itemId() { return 't' + R.no; }
    function accNow() {
      if (R.help || R.cue) return 'support';
      return R.misses > 0 ? 'self-corrected' : 'accurate';
    }

    /* 손을 뗌 → 던지기 */
    function release() {
      if (!R || R.phase !== 'hold') return;
      if (holdBtn) holdBtn.classList.remove('is-down');
      if (R.holdTicks < QUICK_TICKS) {
        /* 톡 누름: 던지지 않음 */
        R.quickTaps++;
        R.phase = 'aim'; R.power = 0;
        sfx('quick');
        sayTemp(T.quick, 'oops', 'is-temp', 1600);
        toast(esc(T.quick), '', 1100);
        render();
        return;
      }
      var p = Math.max(0, Math.min(1, R.power));
      var ideal = idealFor(R.aim);
      R.shot = { power: p, phase: R.dir > 0 ? 'up' : 'down', holdMs: R.holdTicks * TICK_MS, cycles: R.cycles, aim: R.aim,
                 ideal: ideal, brush0: R.brushTicks, bumps0: R.bumps, idealAim: R.sp.aim ? aimTo(R.lay.house.x, R.lay.house.y) : 0 };
      var L = launch(p, R.aim);
      var me = W.stones[W.active];
      me.vx = L.vx; me.vy = L.vy;
      R.phase = 'slide';
      R.kidTurn = true;
      R.brushing = false;
      elLeft.innerHTML = '';
      elAimL.hidden = elAimR.hidden = true;
      elHint.hidden = true;
      sfx('slide', 1 + p * 1.5);
      say(R.sp.snow ? T.goalSnow : T.sliding, 'play');
      setHoldButton();
    }

    /* 돌이 모두 멈춤 */
    function settle() {
      R.phase = 'settle';
      R.brushing = false;
      if (holdBtn) holdBtn.classList.remove('is-down');
      setHoldButton();
      if (R.kidTurn) judgeKid(); else judgeJelly();
    }
    function judgeKid() {
      var sp = R.sp, lay = R.lay, me = W.stones[W.active], sh = R.shot;
      var stars = starsAt(lay.house, me), ok;
      if (sp.versus) ok = stars >= 1;
      else ok = wins(lay, W);
      var dist = me.out ? null : r1(distTo(lay.house, me));
      /* 어디로 빗나갔나: 방향으로 견준 거리 */
      var outcome = 'house';
      var along = alongDist(lay.house, sh.aim);
      var travelled = me.out ? 999 : (me.x - START_X) * Math.sin(rad(sh.aim)) - (me.y - START_Y) * Math.cos(rad(sh.aim));
      if (stars < 1) {
        if (me.out || travelled > along + lay.house.r[2] * 0.6) outcome = 'long';
        else if (travelled < along - lay.house.r[2] * 0.6) outcome = 'short';
        else outcome = 'side';
      } else if (!ok) outcome = 'beaten';
      var bumped = R.bumps > sh.bumps0;
      var diff = sh.ideal == null ? null : r2(sh.power - Math.min(1, sh.ideal));
      var timing = 'ontime';
      if (diff != null && Math.abs(diff) > 0.03) {
        var weak = diff < 0;
        timing = sh.phase === 'up' ? (weak ? 'early' : 'late') : (weak ? 'late' : 'early');
      }
      var brushMs = (R.brushTicks - sh.brush0) * TICK_MS;
      var errorType = '';
      if (!ok) {
        if (outcome === 'beaten') errorType = 'beaten';
        else if (bumped && (sp.guard || sp.knock || sp.versus) && outcome !== 'side' && Math.abs(diff || 0) <= 0.06) errorType = 'blocked';
        else if (outcome === 'side') errorType = 'off-line';
        else errorType = outcome === 'short' ? 'too-weak' : 'too-strong';
      }
      var acc = ok ? accNow() : '';
      if (!sp.versus) R.throws++; else R.kidThrown++;
      R.lastStars = stars;
      R.bestStars = Math.max(R.bestStars, stars);
      log('game-response', {
        itemId: itemId() + '-s' + (R.throwNo), level: R.level, correct: ok, response: outcome, expected: 'house',
        attempt: R.throwNo, errorType: errorType, accuracy: acc, responseMs: sh.holdMs,
        power: r2(sh.power), idealPower: sh.ideal == null ? null : r2(sh.ideal), powerDiff: diff,
        releaseTiming: timing, barPhase: sh.phase, holdMs: sh.holdMs, barCycles: sh.cycles,
        aimDeg: r1(sh.aim), centerAimDeg: r1(sh.idealAim), brushMs: brushMs, bumped: bumped,
        distCenter: dist, stars: stars, helpShown: !!(R.help || R.cue), input: R.input || ''
      });
      R.diffs.push(Math.abs(diff || 0));
      if (timing === 'early') R.early++; else if (timing === 'late') R.late++;
      R.brushMsSum += brushMs;
      paintPanel(stars > 0);
      render();

      if (sp.versus) {
        if (stars > 0) { sfx('star', stars); toast(starsHTML(stars), 'is-good', 900); }
        else { sfx('miss'); R.misses++; afterMissHelp(outcome, timing, errorType); }
        later(nextTurn, reduced ? 500 : 1200);
        return;
      }
      if (ok) {
        sfx('star', stars);
        toast(starsHTML(stars) + esc(stars >= 3 ? T.center : pick(T.inHouse)), 'is-good', 1200);
        later(function () { trialDone(true); }, reduced ? 400 : 1100);
        return;
      }
      R.misses++;
      sfx('miss');
      if (R.misses >= sp.chances) {
        toast(esc(T.miss), '', 1000);
        later(function () { trialDone(false); }, reduced ? 500 : 1300);
        return;
      }
      toast(esc(outcome === 'beaten' ? T.knockLose : T.miss), '', 1000);
      afterMissHelp(outcome, timing, errorType);
      later(nextThrow, reduced ? 500 : 1400);
    }
    function starsHTML(n) { var s = ''; for (var i = 0; i < n; i++) s += starSVG(true); return s; }
    /* 못 넣은 뒤 알려 주는 말 + 도움 단계 */
    function afterMissHelp(outcome, timing, errorType) {
      var line = T.miss;
      if (errorType === 'blocked') line = T.blocked;
      else if (errorType === 'beaten') line = T.knockLose;
      else if (outcome === 'side') line = T.side;
      else if (R.sp.snow && R.shot.power > 0.93 && outcome === 'short') line = T.brushMore;
      else if (R.sp.snow && outcome === 'long' && (R.brushTicks - R.shot.brush0) > 0) line = T.brushLess;
      else if (timing === 'early') line = T.early;
      else if (timing === 'late') line = T.late;
      if (R.misses === 1) sayTemp(line, 'oops', 'is-temp', 2200);
      else sayTemp(line, 'oops', 'is-temp', 1800);
      if (R.misses >= 2 && !R.cue) {
        R.cue = true;
        log('game-help', { itemId: itemId(), level: R.level, helpLevel: 'A4', helpType: 'answer-cue', trigger: 'second-miss' });
      }
    }

    /* 같은 판으로 다시 던지기(놓인 돌은 처음 자리로) */
    function resetStones() {
      W = { snow: R.sp.snow, stones: [], active: 0 };
      R.lay.stones.forEach(function (s) { W.stones.push({ x: s.x, y: s.y, vx: 0, vy: 0, own: s.own, out: false }); });
      W.active = W.stones.length;
      W.stones.push({ x: START_X, y: START_Y, vx: 0, vy: 0, own: 'kid', out: false });
    }
    function nextThrow() {
      resetStones();
      kidReady();
    }
    function kidReady() {
      R.phase = 'aim';
      R.kidTurn = true;
      R.power = 0;
      R.throwNo++;
      if (!R.sp.aim) R.aim = 0;
      R.shot = null;
      var sp = R.sp;
      if (R.cue) say(T.cue, 'help');
      else if (R.help) say(idealFor(R.aim) > 1 ? T.helpBrush : T.helpOn, 'help');
      else if (sp.versus) say(T.myTurn + ' ' + (sp.aim ? T.goalAim : T.goal), 'play');
      else say(sp.knock ? T.goalKnock : sp.guard ? T.goalGuard : sp.snow ? T.goalSnow : sp.aim ? T.goalAim : T.goal, 'play');
      elAimL.hidden = elAimR.hidden = !sp.aim;
      if (sp.aim) { elHint.textContent = T.aimTip; elHint.className = 'cu-hint is-top'; elHint.hidden = false; }
      else elHint.hidden = true;
      setHoldButton();
      refreshHelp();
      paintPanel();
      render();
    }
    function setHoldButton() {
      var acts = [];
      var canHold = R && (R.phase === 'aim' || R.phase === 'hold');
      var canBrush = R && R.sp && R.sp.snow && R.kidTurn && R.phase === 'slide';
      if (R && R.sp && (canHold || canBrush || R.phase === 'settle' || R.phase === 'slide' || R.phase === 'jelly')) {
        var lab = canBrush ? icon('broom', '#3b2a9e') + esc(T.brush) : icon('stone', '#ffffff') + esc(T.hold);
        holdBtn = button(lab, 'hold', 'is-hold' + (canBrush ? ' is-brush' : '') + (canHold || canBrush ? '' : ' is-off'));
        holdBtn.addEventListener('pointerdown', onHoldDown);
        acts.push(holdBtn);
      } else holdBtn = null;
      elActs.innerHTML = '';
      acts.forEach(function (b) { elActs.appendChild(b); });
    }
    function refreshHelp() {
      elLeft.innerHTML = '';
      if (R.misses > 0 && !R.help && !R.cue && R.phase === 'aim') {
        elLeft.appendChild(button(icon('mark', '#5b48d6') + esc(T.help), 'help', 'is-soft', {
          'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'power-mark', 'data-item-id': itemId()
        }));
      }
    }
    function doHelp() {
      if (!R || R.phase !== 'aim' || R.help || R.cue) return;
      R.help = true;
      say(idealFor(R.aim) > 1 ? T.helpBrush : T.helpOn, 'help');
      log('game-help', { itemId: itemId(), level: R.level, helpLevel: 'A2', helpType: 'power-mark', trigger: 'child-request' });
      refreshHelp();
      render();
    }

    /* ── 번갈아 던지기(젤리 차례) ── */
    function nextTurn() {
      var sp = R.sp;
      var total = sp.versus * 2, thrown = R.kidThrown + R.jellyThrown;
      if (thrown >= total) { endVersus(); return; }
      if (clearShort(W.stones, R.lay.house)) render();
      /* 젤리가 먼저, 내가 마지막 돌 */
      var jellyNext = R.jellyThrown <= R.kidThrown;
      W.stones.forEach(function (s) { s.vx = 0; s.vy = 0; });
      if (jellyNext) jellyThrow();
      else {
        W.active = W.stones.length;
        W.stones.push({ x: START_X, y: START_Y, vx: 0, vy: 0, own: 'kid', out: false });
        kidReady();
      }
    }
    function jellyThrow() {
      R.phase = 'jelly';
      R.kidTurn = false;
      elAimL.hidden = elAimR.hidden = true;
      elHint.hidden = true;
      elLeft.innerHTML = '';
      say(T.jellyTurn, 'ready');
      setHoldButton();
      W.active = W.stones.length;
      W.stones.push({ x: START_X, y: START_Y, vx: 0, vy: 0, own: 'jelly', out: false });
      render();
      later(function () {
        var js = jellyShot(R.lay.house, R.sp, o.jellyError, Math.random), p = js.power, a = js.aim, bt = js.brushTicks;
        var L = launch(p, a), me = W.stones[W.active];
        me.vx = L.vx; me.vy = L.vy;
        R.jellyBrush = bt; R.jellyT = 0;
        R.jellyPlan.push({ power: r2(p), aim: r1(a), brushTicks: bt });
        R.phase = 'slide';
        sfx('slide', 1 + p * 1.5);
      }, reduced ? 300 : 900);
    }
    function judgeJelly() {
      R.jellyThrown++;
      var s = W.stones[W.active];
      R.jellyStars.push(starsAt(R.lay.house, s));
      paintPanel();
      render();
      later(nextTurn, reduced ? 400 : 900);
    }
    function endVersus() {
      var hs = R.lay.house, best = null;
      W.stones.forEach(function (s) {
        if (s.out || starsAt(hs, s) < 1) return;
        var d = distTo(hs, s);
        if (!best || d < best.d) best = { d: d, own: s.own };
      });
      var win = !!(best && best.own === 'kid');
      R.versusResult = win ? 'win' : (best ? 'lose' : 'none');
      if (win) { sfx('star', 3); toast(esc(T.win), 'is-good', 1400); }
      else { sfx('miss'); toast(esc(best ? T.lose : T.noOne), '', 1400); }
      later(function () { trialDone(win); }, reduced ? 600 : 1500);
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'cu-bit');
        var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 120;
        b.style.background = colors[i % colors.length];
        b.style.setProperty('--dx', 'calc(-50% + ' + Math.round(Math.cos(ang) * dist) + 'px)');
        b.style.setProperty('--dy', 'calc(-50% + ' + Math.round(Math.sin(ang) * dist) + 'px)');
        b.style.setProperty('--r', Math.round(Math.random() * 540) + 'deg');
        elArena.appendChild(b);
        later(function (x) { return function () { x.remove(); }; }(b), 1000);
      }
    }

    /* ── 시작 화면 ── */
    function readyLine() {
      var s = ladder.summary();
      if (s.source === 'coach') return fmt(T.readyCoach, { start: s.startLevel });
      if (s.source === 'resume') return fmt(T.readyResume, { last: s.prevLast, start: s.startLevel });
      return T.readyFirst;
    }
    function idleSheet() {
      var sp = stepOpts(ladder.step() || {});
      R = { phase: R ? R.phase : 'ready', no: 0, sp: sp, lay: { house: { x: 50, y: HOUSE_Y, r: [RING[0] * sp.ring, RING[1] * sp.ring, RING[2] * sp.ring] }, stones: [] },
            aim: 0, power: 0, throws: 0, kidThrown: 0, jellyThrown: 0, lastStars: 0, idealCache: {} };
      W = { snow: sp.snow, stones: [{ x: START_X, y: START_Y, vx: 0, vy: 0, own: 'kid', out: false }], active: 0 };
      paintLayout();
      elAimL.hidden = elAimR.hidden = true;
      render();
    }
    function showReady() {
      clearTimers();
      idleSheet();
      R.phase = 'ready';
      paintMap();
      elPanel.hidden = true; elProg.hidden = true; elToast.hidden = true;
      elHint.textContent = T.howTo; elHint.className = 'cu-hint'; elHint.hidden = false;
      showInfo('ready');
      say(readyLine(), 'ready');
      var left = [];
      if (coach) {
        left.push(ladder.coachPicker(function () { showReady(); }, function (lv, st) {
          var s2 = stepOpts(st || {}), tag = '';
          if (s2.versus) tag = '번갈아'; else if (s2.snow) tag = '솔질'; else if (s2.knock) tag = '밀어내기';
          else if (s2.guard) tag = '피하기'; else if (s2.aim) tag = '방향'; else if (s2.move) tag = '움직이는 과녁';
          return lv + '칸' + (tag ? ' · ' + tag : '');
        }, T.pickTitle));
      }
      setActions([button(icon('play') + esc(T.start), 'start')], left);
    }

    function startTrial() {
      clearTimers();
      var lv = ladder.level(), sp = stepOpts(ladder.step() || {});
      var lay = makeLayout(sp) || makeLayout({ ring: sp.ring, barMs: sp.barMs });
      G.done = G.done || 0;
      R = { phase: 'aim', no: G.done + 1, level: lv, sp: sp, lay: lay, tick: 0, aim: 0, power: 0, dir: 1, holdTicks: 0, cycles: 0,
            throws: 0, throwNo: 0, misses: 0, help: false, cue: false, quickTaps: 0, brushing: false, brushTicks: 0, bumps: 0,
            kidTurn: true, kidThrown: 0, jellyThrown: 0, jellyStars: [], jellyPlan: [], jellyBrush: 0, lastStars: 0, bestStars: 0,
            diffs: [], early: 0, late: 0, brushMsSum: 0, aimMoves: 0, idealCache: {}, input: '' };
      paintMap();
      paintLayout();
      showInfo(null);
      elProg.hidden = false; paintProg();
      elPanel.hidden = false;
      var nt = newThing(lv);
      log('game-item-ready', {
        itemId: itemId(), level: lv, ring: sp.ring, barMs: sp.barMs, move: sp.move, aim: sp.aim, guard: sp.guard, knock: sp.knock,
        snow: sp.snow, versus: sp.versus, chances: sp.versus ? sp.versus : sp.chances,
        houseX: r1(lay.house.x), houseY: r1(lay.house.y), houseR: r1(lay.house.r[2]),
        idealPower: r2(powerFor(alongDist(lay.house, sp.aim ? aimTo(lay.house.x, lay.house.y) : 0), sp.snow)),
        stones: lay.stones.map(function (s) { return r1(s.x) + ',' + r1(s.y); }).join('|'),
        solvable: lay.solveCount == null ? null : lay.solveCount, newRule: nt || '', engine: 'curling@' + VERSION
      });
      if (nt) toast(esc(nt), 'is-new', 1700);
      W = { snow: sp.snow, stones: [], active: 0 };
      if (sp.versus) {
        lay.stones = [];
        W.active = -1;
        R.phase = 'jelly'; R.kidTurn = false;     // 젤리가 먼저 — 그 사이 눌러도 아무 일 없음
        say(T.goalVersus, 'play');
        setHoldButton();
        paintPanel();
        later(nextTurn, nt ? 1200 : 400);
        startLoop();
        render();
        return;
      }
      resetStones();
      kidReady();
      startLoop();
    }

    function trialDone(success) {
      R.phase = 'wait';
      clearTimers();
      elAimL.hidden = elAimR.hidden = true;
      elHint.hidden = true;
      setActions([]);
      var sp = R.sp;
      var accuracy = success ? accNow() : '';
      var summary = {
        itemId: itemId(), level: R.level, completed: success, throws: sp.versus ? R.kidThrown : R.throws, misses: R.misses,
        bestStars: R.bestStars, meanPowerDiff: R.diffs.length ? r2(mean(R.diffs)) : null, earlyReleases: R.early, lateReleases: R.late,
        brushMs: R.brushMsSum, quickTaps: R.quickTaps, helpUsed: R.help, cueShown: R.cue, aimMoves: R.aimMoves, playMs: R.tick * TICK_MS
      };
      if (sp.versus) { summary.versusResult = R.versusResult; summary.jellyStars = R.jellyStars.join('|'); }
      if (success) summary.accuracy = accuracy;
      G.results.push(summary);
      G.done++;
      log('game-item-complete', summary);

      var pass = success && (accuracy === 'accurate' || (LD.countSelfCorrected && accuracy === 'self-corrected'));
      var r = ladder.result(pass);
      var wait = reduced ? 600 : 1400;
      if (success) burst();
      if (r.changed) {
        log('game-level-change', {
          itemId: itemId(), fromLevel: r.from, toLevel: r.to, reason: r.reason,
          passes: r.passes, misses: r.fails, tries: r.tried
        });
        if (r.reason === 'up') { sfx('up'); sayTemp(T.up, 'good', 'is-good', 1900); }
        else { sfx('down'); sayTemp(T.down, 'ready', 'is-temp', 2300); }
        paintMap(true);
        wait = reduced ? 900 : (r.reason === 'up' ? 1900 : 2300);
      } else if (r.atTop) {
        sfx('up'); sayTemp(T.top, 'good', 'is-good', 1900);
        paintMap(true);
        wait = reduced ? 900 : 1900;
      } else {
        if (success) sayTemp(pick(T.good), 'good', 'is-good');
        else sayTemp(T.notYet, 'ready', 'is-temp');
        paintMap();
      }
      paintProg();
      later(function () {
        var timeUp = Date.now() - G.t0 >= CH_MS;
        if (G.done >= CH_TRIALS || timeUp) finish(timeUp && G.done < CH_TRIALS ? 'time' : 'trials');
        else if (G.done % CH_BREAK === 0) rest();
        else startTrial();
      }, wait);
    }

    function rest() {
      clearTimers();
      idleSheet();
      R.phase = 'rest';
      elPanel.hidden = true; elProg.hidden = true; elHint.hidden = true;
      showInfo('rest');
      say(T.restCoach, 'rest');
      setActions([button(icon('play') + esc(T.keepOn), 'continue')]);
      log('game-break', { afterTrial: G.done, level: ladder.level() });
    }

    function finish(reason) {
      clearTimers();
      if (R) R.phase = 'end';
      var s = ladder.summary();
      ladder.save();
      elEnd.hidden = false;
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.cu-end-line').textContent = !s.prevLast ? fmt(T.endFirst, { max: s.maxLevel })
        : (s.maxLevel >= s.prevLast ? fmt(T.endAgain, { prev: s.prevLast, max: s.maxLevel }) : fmt(T.endSteady, { max: s.maxLevel }));
      elEnd.querySelector('.cu-end-map').innerHTML = ladder.mapSVG();
      var acts = elEnd.querySelector('.cu-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', 'is-soft'));
      sfx('done');
      var res = G.results;
      function sum(f) { return res.reduce(function (a, r) { return a + (r[f] || 0); }, 0); }
      var diffs = res.filter(function (r) { return r.meanPowerDiff != null; }).map(function (r) { return r.meanPowerDiff; });
      log('game-activity-complete', {
        trials: res.length,
        completedTrials: res.filter(function (r) { return r.completed; }).length,
        cleanTrials: res.filter(function (r) { return r.accuracy === 'accurate'; }).length,
        throws: sum('throws'), misses: sum('misses'), earlyReleases: sum('earlyReleases'), lateReleases: sum('lateReleases'),
        quickTaps: sum('quickTaps'), brushMs: sum('brushMs'),
        helps: res.filter(function (r) { return r.helpUsed; }).length, cues: res.filter(function (r) { return r.cueShown; }).length,
        meanPowerDiff: diffs.length ? r2(mean(diffs)) : null,
        startLevel: s.startLevel, maxLevel: s.maxLevel, endLevel: s.endLevel,
        prevLastLevel: s.prevLast, prevBestLevel: s.prevBest, startSource: s.source,
        levelUps: s.ups, levelDowns: s.downs, ladderSize: ladder.size, endReason: reason
      });
      if (typeof o.onFinish === 'function') { try { o.onFinish(res.slice(), s); } catch (e) {} }
    }

    function restart() {
      clearTimers();
      elEnd.hidden = true;
      G = { done: 0, results: [], t0: 0 };
      ladder.begin();
      showReady();
    }

    function act(name) {
      if (name === 'sound') {
        soundOn = !soundOn;
        try { sessionStorage.setItem(storeKey + 'sound', soundOn ? '1' : '0'); } catch (e) {}
        paintSound();
        sfx('pick');
        return;
      }
      if (name === 'restart') { restart(); return; }
      if (name === 'start' && R && R.phase === 'ready') { G.t0 = Date.now(); startTrial(); }
      else if (name === 'continue' && R && R.phase === 'rest') startTrial();
      else if (name === 'help') doHelp();
      else if (name === 'aimL' && R && R.phase === 'aim') setAim(R.aim - AIM_STEP);
      else if (name === 'aimR' && R && R.phase === 'aim') setAim(R.aim + AIM_STEP);
    }

    function onClick(e) {
      var b = e.target.closest('[data-cu-act]');
      if (b && root.contains(b) && b.getAttribute('data-cu-act') !== 'hold') act(b.getAttribute('data-cu-act'));
    }

    root.addEventListener('click', onClick);
    elArena.addEventListener('pointerdown', onArenaDown);
    elArena.addEventListener('pointermove', onArenaMove);
    global.addEventListener('pointerup', onUp);
    global.addEventListener('pointercancel', onUp);
    global.addEventListener('keydown', onKeyDown);
    global.addEventListener('keyup', onKeyUp);
    global.addEventListener('blur', onBlur);
    root.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    restart();

    return {
      root: root,
      ladder: ladder,
      restart: restart,
      results: function () { return G ? G.results.slice() : []; },
      /* 시험용: 지금 판 위 상태(읽기만) */
      peek: function () {
        return { phase: R ? R.phase : '', level: R ? R.level : 0, power: R ? R.power : 0, dir: R ? R.dir : 0, aim: R ? R.aim : 0,
                 ideal: R && R.lay ? idealFor(R.aim || 0) : null, solution: R && R.lay ? R.lay.solution : null,
                 house: R && R.lay ? R.lay.house : null, sp: R ? R.sp : null, misses: R ? R.misses : 0,
                 help: !!(R && R.help), cue: !!(R && R.cue), kidTurn: !!(R && R.kidTurn), brushing: !!(R && R.brushing),
                 tick: R ? R.tick : 0, throwNo: R ? R.throwNo : 0, active: W ? W.active : -1,
                 stones: W ? W.stones.map(function (s) { return { x: s.x, y: s.y, vx: s.vx, vy: s.vy, own: s.own, out: s.out }; }) : [] };
      },
      destroy: function () {
        clearTimers(); clearTimeout(tempTimer); clearTimeout(toastTimer);
        global.removeEventListener('pointerup', onUp); global.removeEventListener('pointercancel', onUp);
        global.removeEventListener('keydown', onKeyDown); global.removeEventListener('keyup', onKeyUp); global.removeEventListener('blur', onBlur);
        root.remove();
      }
    };
  }

  global.Curling = {
    version: VERSION, mount: mount,
    /* 얼음판 계산(시험 스크립트용) */
    sim: { stepWorld: stepWorld, simulate: simulate, travel: travel, powerFor: powerFor, alongDist: alongDist, aimTo: aimTo,
           starsAt: starsAt, wins: wins, solve: solve, makeLayout: makeLayout, speedFor: speedFor, jellyShot: jellyShot, distTo: distTo, clearShort: clearShort,
           START_X: START_X, START_Y: START_Y, R_STONE: R_STONE, DT: DT, TICK_MS: TICK_MS, MAX_AIM: MAX_AIM,
           /* 팀전 사본에서 더함 */
           launch: launch, allStopped: allStopped, moving: moving, clampAim: clampAim,
           HOUSE_Y: HOUSE_Y, RING: RING, SHEET_L: SHEET_L, SHEET_R: SHEET_R },
    /* 팀전 사본에서 더함: 그림·효과음을 밖에서 쓰도록 */
    draw: { sheetSVG: sheetSVG, stoneSVG: stoneSVG, starSVG: starSVG, icon: icon, injectCSS: injectCSS, SFX: SFX }
  };
})(window);
