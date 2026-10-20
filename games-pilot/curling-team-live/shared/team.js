/*!
 * 「젤리 컬링 팀전」 여러 기기 · 코치 진행  v1.1.0
 *
 * 얼음판 물리·그림은 shared/curling.js(원본 엔진 사본)의 Curling.sim / Curling.draw 를 그대로 쓴다 — 먼저 불러야 한다.
 *
 * 규칙
 *   빨강 팀 · 파랑 팀. 한 판(엔드)에 팀마다 돌 stonesPerTeam(4)개, 번갈아 던진다(먼저 던지는 팀부터).
 *   팀 안에서는 아이들이 차례로 돌아가며 던진다(아이가 적으면 같은 아이가 또 던짐, 끊긴 아이는 건너뜀).
 *   돌끼리 부딪쳐 밀려나는 것은 원본 물리 그대로. 과녁 앞에 못 미친 돌은 멈춘 뒤 치운다(원본 clearShort).
 *   다 던지면: 가운데에 가장 가까운 돌의 팀만, 상대 팀의 가장 가까운 돌보다 더 가까운 자기 돌 수(과녁 안 돌만)만큼 점수.
 *   다음 판: 점수는 쌓이고, 먼저 던지는 팀은 지난 판에 점수를 못 낸 팀(0:0이면 그대로). ends(3)판이면 경기 끝.
 *
 * 화면은 셋 — 온큐베이트가 넣어 주는 window.ONCUVATE 로 정한다(역할 고르기·입장 코드·이름 입력 없음)
 *   ① 코치(role === 'coach' 일 때만, 실시간 연결이 있을 때) — 심판. 팀 나누기·경기 시작·차례 넘기기·다음 판·처음부터.
 *   ② 아이(그 밖의 모든 역할, 실시간 연결이 있을 때) — 이름표는 ONCUVATE.child 4글자 코드. 내 차례에만 던진다.
 *   ③ 한 기기 팀전(room 이 없거나 연결이 주입되지 않았을 때 · 내 컴퓨터에서 파일로 열 때) — 한 기기에서 두 팀이 번갈아 던진다.
 *
 * 실시간 연동(온큐베이트 표준 — 연결을 만들지 않고 주입된 것만 쓴다)
 *   window._firebaseReady · pth() · window._set / _onValue / _onDisconnect
 *   state                      코치만 쓴다, 모두 읽는다. 경기 상태 전부:
 *                              {status, gen, endNo, first, turn, team, thrower, stones, score, thrown, ptr, history,
 *                               result, over, players{코드:{team,at,on}}, shot{id,power,aim,sx,by}, sx}
 *   board/<회차키>/<내 코드>    아이가 자기 칸에만 쓰는 짧은 글자(40자 이하, 줄바꿈 없음). 읽기는 코치만.
 *                              'j'(들어왔어요) · 's|차례번호|출발자리' · 't|차례번호|힘|방향|출발자리|n'(던지기)
 *                              접속이 끊기면 _onDisconnect 로 그 칸이 지워진다 → 코치 명단에서 흐려짐.
 *   회차키 = 이 파일 이름에서 .html 을 뗀 것(session01). GAME.boardKey 로 바꿀 수 있다.
 *
 * 던지기 맞추기(코치 기기가 유일한 심판)
 *   아이 기기가 board 에 던지기를 쓴다 → 코치가 board 를 읽어 「지금 차례인 아이 + 지금 차례 번호」인 것만 받아
 *   state.shot 에 올린다(차례가 아닌 던지기·지난 차례 번호는 버림).
 *   모든 화면이 state.stones(같은 시작 자리)에서 같은 물리로 굴린다(30ms 고정 틱 — 틱 수로 정해지므로 기기 빠르기와 무관).
 *   코치 기기에서 굴림이 끝나면 앞에 못 미친 돌을 치운 최종 자리 + 다음 차례를 state 에 올리고, 다른 화면은 그것으로 맞춘다.
 *
 * 기록: oncuvate:log(schemaVersion 0.2, activityId 실음) — 아이 기기·한 기기 팀전에서만
 *   game-item-ready(내 차례가 옴) · game-response(내 돌 하나: 힘·방향·출발 자리·누른 시간·가운데까지 거리·과녁 안·짧음/긺)
 *   game-item-complete(한 판 끝: 두 팀 점수) · game-activity-complete(경기 끝)
 *
 * 크롬 109(클래스인) 하한: var·function 글씨만, 새 문법을 쓰지 않았다. 진행은 setTimeout 만.
 * 아이 화면 그림은 SVG·젤리 이미지만(이모지 없음), SVG 색은 글자값(hex). 저장은 sessionStorage 'curling-team:' 접두사(소리만).
 */
(function (global) {
  'use strict';

  var VERSION = '1.1.0';
  var C = global.Curling;
  if (!C || !C.sim || !C.draw) throw new Error('shared/curling.js(팀전 사본)를 team.js 보다 먼저 불러 주세요');
  var S = C.sim, D = C.draw, SFX = D.SFX;
  var DT = S.DT, TICK = S.TICK_MS, QUICK = 4, AIM_STEP = 3, AIM_MAX = 30, SX_STEP = 3, SX_MIN = 34, SX_MAX = 66;
  var HOUSE = { x: 50, y: S.HOUSE_Y, r: [S.RING[0], S.RING[1], S.RING[2]] };

  var TEAM = {
    red:  { name: '빨강 팀', fill: '#ff7a7a', stroke: '#d64545', inner: '#ffe0e0', dark: '#c23b3b', soft: '#fff0f0' },
    blue: { name: '파랑 팀', fill: '#5aa9ff', stroke: '#2f6fd1', inner: '#dcecff', dark: '#2a62c0', soft: '#edf5ff' }
  };
  function other(t) { return t === 'red' ? 'blue' : 'red'; }

  var TEXT = {
    title: '젤리 컬링 팀전',
    coach: '코치',
    connecting: '연결하는 중…',
    waitStart: '코치님이 시작하면 시작해요.',
    kidLobby: '같은 팀 친구들과 번갈아 던져요.',
    soloReady: '「시작」을 누르면 빨강 팀부터 던져요.',
    soloTip: '한 기기로 두 팀이 번갈아 던져요.',
    coachReady: '팀을 나누고 「경기 시작」을 눌러요.',
    myTurn: '내 차례!',
    turnOf: '{name} 차례',
    teamTurn: '{team} 차례',
    aimGo: '얼음을 눌러 방향을 정하고, 돌을 꾹 눌러요.',
    holding: '알맞을 때 떼요!',
    watch: '잘 봐요.',
    sliding: '돌이 가요!',
    quick: '꾹 누르고 있다가 떼요.',
    resend: '다시 던져요.',
    aimTip: '얼음을 누르면 방향',
    hold: '꾹 누르기',
    start: '시작',
    nextEnd: '다음 판',
    again: '처음부터 다시',
    endNo: '{n} / {max}판',
    endDone: '{n}판 끝!',
    points: '{team} {n}점!',
    blank: '이번 판은 0 : 0',
    blankLine: '과녁 안에 돌이 없어요.',
    winLine: '{team} 돌이 가운데에 가장 가까워요!',
    soloNext: '「다음 판」을 눌러요.',
    overLine: '{max}판이 모두 끝났어요. 모두 수고했어요!',
    endTitle: '경기 끝!',
    endWin: '{team} 승리 · {red} : {blue}',
    endTie: '비겼어요 · {red} : {blue}',
    waitCoach: '코치님을 기다려요.',
    autoSplit: '팀 자동 나누기',
    startGame: '경기 시작',
    skipTurn: '이번 차례 넘기기',
    oneMore: '다음 판',
    restart: '처음부터',
    restartSure: '한 번 더 누르면 처음부터',
    needBoth: '두 팀에 한 명씩은 있어야 해요.',
    tapSwap: '아이를 누르면 팀이 바뀌어요.',
    nobody: '아직 아무도 없어요.',
    joined: '들어온 아이 {n}',
    history: '판별 점수',
    startPos: '출발 자리',
    aimDir: '던지는 방향',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  /* ───────────── 스타일(팀전에 더하는 것 — 얼음판·단추 모양은 엔진 CSS 그대로) ───────────── */
  var CSS = [
    '.ct-host{position:fixed;left:0;top:0;right:0;bottom:0;padding:8px;box-sizing:border-box}',
    '.ct-root{min-height:0}',
    '.ct-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',
    '.ct-root.is-coach .ct-wrap{--arena:min(calc(100cqh - 24px),46cqw)}',
    '.ct-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:8px}',
    '.ct-chip{flex:none;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border-radius:99px;font-size:13px;font-weight:900;white-space:nowrap}',
    '.ct-chip i{width:12px;height:12px;border-radius:50%}',
    '.ct-score{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}',
    '.ct-sc{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 12px;border-radius:14px;font-weight:900}',
    '.ct-sc b{font-size:clamp(13px,3.6cqh,16px);white-space:nowrap}',
    '.ct-sc strong{font-size:clamp(22px,7cqh,38px);line-height:1}',
    '.ct-sc.is-red{background:#fff0f0;color:#c23b3b;box-shadow:inset 0 0 0 2px #ffc2c2}',
    '.ct-sc.is-blue{background:#edf5ff;color:#2a62c0;box-shadow:inset 0 0 0 2px #b9d6ff}',
    '.ct-endno{font-size:13px;font-weight:900;color:#6f7789;white-space:nowrap}',
    '.ct-turn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:5px 12px;border-radius:14px;text-align:center;',
    'font-size:clamp(15px,4.4cqh,21px);font-weight:900;letter-spacing:-.02em;background:#f3effd;color:#3b2a9e;box-shadow:inset 0 0 0 2px #e6dffa}',
    '.ct-turn.is-red{background:#fff0f0;color:#c23b3b;box-shadow:inset 0 0 0 2px #ffb3b3}',
    '.ct-turn.is-blue{background:#edf5ff;color:#2a62c0;box-shadow:inset 0 0 0 2px #a9ccff}',
    '.ct-turn.is-me{animation:ct-pulse 1.1s ease-in-out infinite alternate}',
    '.ct-turn small{font-size:.72em;opacity:.85}',
    '.ct-pips{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(3px,1.4cqh,10px);padding:4px 10px;',
    'border-radius:16px;background:#f7f4ff;box-shadow:inset 0 0 0 2px #ece6fb;overflow:hidden}',
    '.ct-pips .cu-row b{min-width:4.6em}',
    '.ct-pips .cu-pips i{--d:clamp(14px,4.8cqh,24px)}',
    '.ct-pips .cu-pips i.red{background:radial-gradient(circle at 50% 50%,#ffe0e0 0 38%,#ff7a7a 40%);box-shadow:0 2px 0 #d64545}',
    '.ct-pips .cu-pips i.blue{background:radial-gradient(circle at 50% 50%,#dcecff 0 38%,#5aa9ff 40%);box-shadow:0 2px 0 #2f6fd1}',
    '.ct-pips .cu-pips i.used{opacity:.22}',
    '.ct-team-line{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:clamp(12px,3.4cqh,15px);font-weight:800;color:#6f7789;text-align:center}',
    '.ct-foot{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:800;color:#8a90a0;white-space:nowrap}',
    '.ct-result{position:absolute;left:50%;top:60%;z-index:6;transform:translate(-50%,-50%);max-width:94%;padding:.35em 1em;border-radius:99px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    'font-size:clamp(16px,7cqmin,32px);font-weight:900;letter-spacing:-.02em;background:#fff8e8;color:#3b2a9e;box-shadow:0 4px 0 rgba(27,20,98,.35),0 0 0 3px rgba(255,255,255,.3);',
    'pointer-events:none;animation:cu-pop .35s cubic-bezier(.3,1.5,.5,1)}',
    '.ct-result.is-red{background:#fff0f0;color:#c23b3b}.ct-result.is-blue{background:#edf5ff;color:#2a62c0}',
    '.ct-glow{animation:ct-glow .7s ease-in-out infinite alternate}',
    '.ct-live{position:absolute;left:50%;bottom:10px;z-index:5;transform:translateX(-50%);padding:.3em .9em;border-radius:99px;background:#ffffff;color:#3b3170;font-size:clamp(12px,4cqmin,15px);font-weight:900;white-space:nowrap;box-shadow:0 3px 0 rgba(27,20,98,.25)}',
    '.ct-live.is-red{color:#c0392b;box-shadow:0 0 0 3px #f8b4ac,0 3px 0 rgba(27,20,98,.25)}',
    '.ct-live.is-blue{color:#1f5fbf;box-shadow:0 0 0 3px #a9c8f5,0 3px 0 rgba(27,20,98,.25)}',
    '@keyframes ct-glow{from{opacity:.2}to{opacity:1}}',
    '@keyframes ct-pulse{from{filter:none}to{filter:brightness(1.07) saturate(1.2)}}',
    '.cu-arena.is-locked{cursor:default}',
    '.ct-wait{position:absolute;left:0;top:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:18px;font-weight:900;color:#3b2a9e}',
    '.ct-wait img{width:84px;height:84px;object-fit:contain}',
    '.ct-ctrl{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
    '.ct-ctrl-row{display:flex;align-items:center;gap:5px;padding:4px 6px;border-radius:12px;background:#f3effe}',
    '.ct-ctrl-row span{flex:1;min-width:0;overflow:hidden;color:#4b24a5;font-size:12.5px;font-weight:900;white-space:nowrap}',
    '.ct-cb{display:grid;place-items:center;width:34px;height:30px;padding:0;border:2px solid #d4cdf0;border-radius:10px;background:#fff;cursor:pointer;touch-action:manipulation}',
    '.ct-cb svg{width:18px;height:18px}',
    '.ct-cb:disabled{opacity:.4;cursor:default}',
    '.ct-root .cu-actions{min-height:0}',
    '.ct-root .cu-btn{touch-action:manipulation}',
    '.ct-root .cu-btn.is-hold{touch-action:none}',
    /* 코치 칸 */
    '.ct-count{font-size:13px;font-weight:900;color:#6f7789;white-space:nowrap}',
    '.ct-roster{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.ct-col{min-height:0;overflow:hidden;display:flex;flex-wrap:wrap;align-content:flex-start;gap:5px;padding:6px;border-radius:14px}',
    '.ct-col.is-red{background:#fff0f0;box-shadow:inset 0 0 0 2px #ffc2c2}.ct-col.is-blue{background:#edf5ff;box-shadow:inset 0 0 0 2px #b9d6ff}',
    '.ct-col h3{flex:0 0 100%;margin:0;font-size:14px;font-weight:900}',
    '.ct-col.is-red h3{color:#c23b3b}.ct-col.is-blue h3{color:#2a62c0}',
    '.ct-kid{font:inherit;display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 10px;border:0;border-radius:10px;cursor:pointer;',
    'font-size:15px;font-weight:900;letter-spacing:.06em;color:#27344e;background:#fff;box-shadow:0 2px 0 rgba(0,0,0,.08)}',
    '.ct-kid.is-now{box-shadow:inset 0 0 0 3px #ffd23f}',
    '.ct-kid.is-off{opacity:.4;text-decoration:line-through}',
    '.ct-tip{font-size:12px;font-weight:800;color:#8a90a0}',
    '.ct-cbtns{display:flex;flex-wrap:wrap;gap:6px}',
    '.ct-cbtns .cu-btn{min-height:40px;font-size:15px;padding:0 12px}',
    '.ct-cbtns .cu-btn[disabled]{opacity:.38;pointer-events:none}',
    '.ct-cbtns .cu-btn.is-warn{background:linear-gradient(135deg,#d64545,#ff7a7a);box-shadow:0 4px 0 #a52f2f;color:#fff}',
    '.ct-hist{font-size:12px;font-weight:800;color:#6f7789;min-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ct-msg{font-size:13px;font-weight:900;color:#d64545;min-height:1.2em}',
    '.ct-msg:empty{display:none}',
    /* 끝 화면 */
    '.ct-end .cu-end-line{color:#3b2a9e}',
    '.ct-end .cu-end-line.is-red{color:#c23b3b}.ct-end .cu-end-line.is-blue{color:#2a62c0}',
    '.ct-end-sub{margin:0;font-size:clamp(13px,3.8cqh,17px);font-weight:800;color:#6f7789}',
    /* 낮은 화면(750×417 등) */
    '@container cu (max-height:470px){',
    '.ct-wrap{gap:10px;padding:8px}.ct-wrap{--arena:min(calc(100cqh - 16px),54cqw)}',
    '.ct-root.is-coach .ct-wrap{--arena:min(calc(100cqh - 16px),44cqw)}',
    '.ct-side{gap:5px}.ct-turn{min-height:34px}.ct-root .cu-coach{min-height:0}.ct-root .cu-coach-img{width:44px;height:44px}',
    '.ct-root .cu-bubble{padding:6px 10px;font-size:14px}.ct-root .cu-top{min-height:30px}',
    '.ct-root .cu-btn.is-hold{min-height:46px}.ct-root .cu-btn{min-height:42px}',
    '.ct-cbtns .cu-btn{min-height:34px;font-size:13.5px;padding:0 9px}.ct-tip{display:none}',
    '.ct-sc{padding:3px 10px}.ct-sc strong{font-size:24px}}',
    /* 세로 화면 */
    '@container cu (max-aspect-ratio:5/4){',
    '.ct-wrap,.ct-root.is-coach .ct-wrap{--arena:min(calc(100cqw - 16px),46cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center;gap:8px;padding:8px}',
    '.ct-side{width:100%;gap:6px}}'
  ].join('\n');

  /* ───────────── 작은 도구 ───────────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(t, map) { return String(t).replace(/\{(\w+)\}/g, function (m, k) { return map[k] != null ? map[k] : m; }); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clone(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
  function r3(n) { return Math.round(n * 1000) / 1000; }
  function r2(n) { return Math.round(n * 100) / 100; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function arr(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(function (x) { return x != null; });
    return Object.keys(v).sort(function (a, b) { return a - b; }).map(function (k) { return v[k]; }).filter(function (x) { return x != null; });
  }
  function againIcon(c) {
    return '<svg class="cu-ic" viewBox="0 0 20 20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M15.5 10a5.5 5.5 0 1 1-1.6-3.9" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M15.8 3.2v3.6h-3.6" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  /* 회차키: 이 파일 이름(session01.html → session01) */
  function fileKey() {
    var f = String((global.location && global.location.pathname) || '').split('/').pop() || '';
    f = f.replace(/\.html?$/i, '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return f || 'session01';
  }

  /* ───────────── 규칙(순수 함수) ───────────── */
  function norm(g) {
    g = g || {};
    g.stones = arr(g.stones);
    g.history = arr(g.history);
    g.score = g.score || {}; g.score.red = g.score.red || 0; g.score.blue = g.score.blue || 0;
    g.thrown = g.thrown || {}; g.thrown.red = g.thrown.red || 0; g.thrown.blue = g.thrown.blue || 0;
    g.ptr = g.ptr || {}; g.ptr.red = g.ptr.red || 0; g.ptr.blue = g.ptr.blue || 0;
    g.players = g.players || {};
    Object.keys(g.players).forEach(function (c) {
      var p = g.players[c];
      if (!p || typeof p !== 'object') { delete g.players[c]; return; }
      p.team = p.team === 'blue' ? 'blue' : 'red';
      p.at = p.at || 0;
      p.on = p.on !== false;
    });
    g.turn = g.turn || 0; g.endNo = g.endNo || 1; g.first = g.first || 'red'; g.gen = g.gen || 0;
    g.status = g.status || 'lobby';
    g.shot = g.shot || null;
    g.sx = g.sx == null ? null : g.sx;
    if (g.result) g.result.glow = arr(g.result.glow);
    return g;
  }
  function members(players, team) {
    var out = [];
    Object.keys(players || {}).forEach(function (c) {
      var p = players[c];
      if (p && p.team === team) out.push({ code: c, at: p.at || 0, on: p.on !== false });
    });
    out.sort(function (a, b) { return a.at - b.at || (a.code < b.code ? -1 : 1); });
    return out;
  }
  /* 팀 안에서 다음에 던질 아이: 차례(ptr)부터 찾되 끊긴 아이는 건너뜀(모두 끊겼으면 차례대로) */
  function pickThrower(g, team) {
    var list = members(g.players, team);
    if (!list.length) return null;
    for (var k = 0; k < list.length; k++) {
      var m = list[(g.ptr[team] + k) % list.length];
      if (m.on) { g.ptr[team] += k; return m.code; }
    }
    return list[g.ptr[team] % list.length].code;
  }
  /* 다 던진 판의 점수 — glow: 점수가 된 돌의 번호(stones 안 순서) */
  function scoreEnd(stones) {
    var inH = [];
    stones.forEach(function (s, i) {
      if (S.starsAt(HOUSE, s) >= 1) inH.push({ i: i, d: S.distTo(HOUSE, s), t: s.t });
    });
    if (!inH.length) return { win: '', pts: 0, glow: [], red: 0, blue: 0 };
    inH.sort(function (a, b) { return a.d - b.d; });
    var win = inH[0].t, otherMin = Infinity;
    inH.forEach(function (q) { if (q.t !== win && q.d < otherMin) otherMin = q.d; });
    var glow = inH.filter(function (q) { return q.t === win && q.d < otherMin; }).map(function (q) { return q.i; });
    var r = { win: win, pts: glow.length, glow: glow, red: 0, blue: 0 };
    r[win] = glow.length;
    return r;
  }
  function startTurnOrFinish(g, N, ENDS) {
    for (var guard = 0; guard < 2 * N + 2; guard++) {
      if (g.turn >= 2 * N) {
        var r = scoreEnd(g.stones);
        g.status = 'result';
        g.result = r;
        if (r.win) g.score[r.win] += r.pts;
        g.history.push({ red: r.red, blue: r.blue });
        g.thrower = null;
        g.over = g.endNo >= ENDS;
        return g;
      }
      g.team = g.turn % 2 === 0 ? g.first : other(g.first);
      g.thrower = pickThrower(g, g.team);
      if (g.thrower) return g;
      g.thrown[g.team]++;
      g.turn++;                     // 그 팀에 아무도 없으면 그 돌은 건너뜀
    }
    return g;
  }
  function idOf(g) { return g ? g.gen + '-' + g.endNo + '-' + g.turn : ''; }

  function teamStone(t, glow) {
    var c = TEAM[t] || TEAM.red;
    return (glow ? '<circle class="ct-glow" r="5.6" fill="#ffd23f" fill-opacity="0.35" stroke="#ffd23f" stroke-width="1.1"/>' : '') +
      '<ellipse cx="0" cy="1.1" rx="3.3" ry="2.6" fill="#1b1462" fill-opacity="0.18"/>' +
      '<circle r="3.2" fill="' + c.fill + '" stroke="' + c.stroke + '" stroke-width="0.6"/>' +
      '<circle r="2.1" fill="' + c.inner + '"/>' +
      '<rect x="-1.5" y="-0.5" width="3" height="1" rx="0.5" fill="' + c.stroke + '"/>';
  }

  /* ───────────── 화면 ───────────── */
  function mount(host, cfg) {
    D.injectCSS();
    if (!document.getElementById('ct-style')) { var st = document.createElement('style'); st.id = 'ct-style'; st.textContent = CSS; document.head.appendChild(st); }
    cfg = cfg || {};
    var AID = cfg.activityId || 'curling-team';
    var N = cfg.stonesPerTeam || 4, BAR_MS = cfg.barMs || 1400, ENDS = cfg.ends || 3;
    var CREDIT = cfg.credit || '자체 제작';
    var T = {}, k;
    for (k in TEXT) T[k] = TEXT[k];
    for (k in cfg.texts || {}) T[k] = cfg.texts[k];
    var coachBase = cfg.coachBase || 'assets/images/jelly/';
    function jelly(m) { return coachBase + m + '.webp'; }
    var reduced = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var O = global.ONCUVATE || {};
    var IS_COACH = O.role === 'coach';                 // 화이트리스트: coach 만 코치, 나머지는 모두 아이
    var CHILD = String(O.child || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12);
    var SK = cfg.boardKey || fileKey();

    host.classList.add('ct-host');
    var root = h('div', 'cu-root ct-root');
    root.setAttribute('data-activity-id', AID);
    root.setAttribute('data-inhibition-load', 'primary');
    host.appendChild(root);

    var soundOn = true;
    try { var sv = sessionStorage.getItem(AID + ':sound'); if (sv !== null) soundOn = sv === '1'; } catch (e) {}
    function sfx(n, a) { if (soundOn) { try { SFX[n](a); } catch (e) {} } }
    function log(type, detail) {
      var d = { type: type, schemaVersion: '0.2', activityId: AID };
      for (var kk in detail) d[kk] = detail[kk];
      try { global.dispatchEvent(new CustomEvent('oncuvate:log', { detail: d })); } catch (e) {}
    }

    /* 상태 */
    var mode = '';                 // 'solo' 한 기기 팀전 · 'coach' 심판 · 'kid' 아이
    var G = null;
    var K = { phase: 'idle', aim: 0, power: 0, dir: 1, holdTicks: 0, forId: '', sx: S.START_X };
    var A = null, W = null, done = {}, animT = null, holdT = null, aimDrag = false, seenResult = {}, seenOver = {}, endT = null;
    var el = {};
    var stat = { ignored: 0, accepted: 0, myThrows: 0, endThrows: 0 };
    var seenMsg = {}, lastBoard = {}, sendN = 0, resendT = null, joinN = 0, lastRejoin = 0;

    function me() { return mode === 'kid' ? CHILD : ''; }
    function myTurn() { return !!(G && (mode === 'solo' || (mode === 'kid' && G.thrower === CHILD))); }
    function isRef() { return mode === 'solo' || mode === 'coach'; }

    /* ── 실시간 연결(주입된 것만) ── */
    function rtReady() {
      return !!O.room && global._firebaseReady === true && typeof global.pth === 'function' &&
        typeof global._set === 'function' && typeof global._onValue === 'function';
    }
    function snapVal(s) { if (s && typeof s.val === 'function') return s.val(); return s === undefined ? null : s; }
    function rset(p, v) {
      try { var r = global._set(global.pth(p), v); if (r && typeof r.then === 'function') r.then(null, function () {}); } catch (e) {}
    }
    function ron(p, cb) {
      try { global._onValue(global.pth(p), function (s) { var v = null; try { v = snapVal(s); } catch (e) {} cb(v); }); } catch (e) {}
    }
    function boardPath(code) { return 'board/' + SK + (code ? '/' + code : ''); }
    function writeBoard(s) {
      s = String(s).replace(/[\r\n]/g, '').slice(0, 40);   // board: 문자열 40자 이하, 줄바꿈 없음
      rset(boardPath(CHILD), s);
    }
    function armDisconnect() {
      try { var od = global._onDisconnect(global.pth(boardPath(CHILD))); if (od && typeof od.remove === 'function') od.remove(); } catch (e) {}
    }

    /* 상태 올리기: 코치는 state 에, 한 기기 팀전은 바로 화면에 */
    function push() {
      if (mode === 'coach') { G.rev = (G.rev || 0) + 1; rset('state', clone(G)); }
      sync();
    }
    function lobby(gen, players) { return norm({ status: 'lobby', gen: gen || 0, endNo: 1, players: players || {} }); }

    /* ── 시작: 어느 화면인지 정하기 ── */
    function boot() {
      if (!O.room) { startSolo(); return; }
      if (!IS_COACH && !CHILD) { startSolo(); return; }
      root.innerHTML = '<div class="ct-wait"><img alt="" aria-hidden="true" src="' + esc(jelly('jelly-look')) + '"><span>' + esc(T.connecting) + '</span></div>';
      var waited = 0;
      (function tryIt() {
        if (rtReady()) { if (IS_COACH) startCoach(); else startKid(); return; }
        waited += 200;
        if (waited >= (cfg.connectMs || 6000)) { startSolo(); return; }
        setTimeout(tryIt, 200);
      })();
    }

    function startSolo() {
      mode = 'solo';
      G = lobby(0, { red: { team: 'red', at: 1, on: true }, blue: { team: 'blue', at: 2, on: true } });
      buildPlay();
      sync();
    }
    function startKid() {
      mode = 'kid';
      buildPlay();
      ron('state', function (v) { G = v ? norm(v) : null; sync(); });
      writeBoard('j');
      armDisconnect();
      sync();
    }
    function startCoach() {
      mode = 'coach';
      buildCoach();
      var first = true, boardIn = false;
      function take(v) {
        if (!first) return;                 // 코치는 첫 값(다시 열었을 때 이어 하기)만 읽고, 그 뒤로는 자기 것이 정본
        first = false;
        G = v ? norm(v) : lobby(1, {});
        if (G.shot) done = {};
        push();
        if (boardIn) onBoard(lastBoard);
      }
      ron('state', take);
      setTimeout(function () { take(null); }, cfg.stateWaitMs || 2500);
      ron(boardPath(''), function (v) { boardIn = true; lastBoard = v && typeof v === 'object' ? v : {}; if (G) onBoard(lastBoard); });
    }

    /* ── 코치: board 읽기 → 명단·던지기 받기 ── */
    function onBoard(map) {
      if (!G || mode !== 'coach') return;
      var ch = false, P = G.players;
      Object.keys(P).forEach(function (c) {
        var on = map[c] != null;
        if (P[c].on !== on) { P[c].on = on; ch = true; }
      });
      Object.keys(map).forEach(function (c) {
        if (!/^[A-Za-z0-9_-]{1,12}$/.test(c) || map[c] == null) return;
        if (!P[c]) {
          var cnt = { red: members(P, 'red').length, blue: members(P, 'blue').length };
          G.seq = (G.seq || 0) + 1;
          P[c] = { team: cnt.red <= cnt.blue ? 'red' : 'blue', at: G.seq, on: true };
          ch = true;
        }
        var v = map[c];
        if (typeof v !== 'string' || seenMsg[c] === v) return;
        seenMsg[c] = v;
        var a = v.split('|');
        if (a[0] === 't') {
          if (acceptThrow(c, a)) { ch = true; stat.accepted++; }
          else stat.ignored++;
        } else if (a[0] === 's') {
          var sx = +a[2];
          if (G.status === 'play' && !G.shot && a[1] === idOf(G) && c === G.thrower && sx >= SX_MIN && sx <= SX_MAX) { G.sx = sx; ch = true; }
        }
      });
      if (G.status === 'play' && !G.shot && G.thrower && !P[G.thrower]) { G.thrower = pickThrower(G, G.team); ch = true; }
      if (ch) push(); else paintAll();
    }
    function acceptThrow(c, a) {
      if (!G || G.status !== 'play' || G.shot) return false;
      if (a[1] !== idOf(G) || c !== G.thrower) return false;          // 차례가 아닌 던지기 · 지난 차례 번호는 버림
      var p = +a[2], aim = +a[3], sx = +a[4];
      if (!(p >= 0 && p <= 1) || !(Math.abs(aim) <= AIM_MAX) || !(sx >= SX_MIN && sx <= SX_MAX)) return false;
      G.shot = { id: a[1], power: p, aim: aim, sx: sx, by: c };
      return true;
    }

    /* ── 심판 조작(코치 · 한 기기 팀전) ── */
    function doStart() {
      var g = norm({ status: 'play', gen: G.gen + 1, endNo: 1, first: 'red', turn: 0, players: G.players, seq: G.seq });
      G = startTurnOrFinish(g, N, ENDS);
      stat.myThrows = 0;
      push(); sfx('up');
    }
    function doNext() {
      if (G.status !== 'result' || G.over) return;
      var r = G.result || {};
      if (r.win) G.first = other(r.win);              // 점수를 못 낸 팀이 먼저(0:0이면 그대로)
      G.endNo++; G.turn = 0; G.stones = []; G.thrown = { red: 0, blue: 0 }; G.result = null; G.status = 'play'; G.shot = null; G.sx = null;
      G = startTurnOrFinish(G, N, ENDS);
      push(); sfx('up');
    }
    function doSkip() {
      if (G.status !== 'play' || G.shot) return;
      var t = G.team, list = members(G.players, t), before = G.thrower;
      G.ptr[t]++;
      var nx = pickThrower(G, t);
      G.sx = null;
      if (list.length > 1 && nx && nx !== before) { G.thrower = nx; G.skips = (G.skips || 0) + 1; push(); return; }
      G.thrown[t]++; G.turn++;                      // 팀에 한 명뿐이면 그 돌은 넘어감
      G = startTurnOrFinish(G, N, ENDS);
      push();
    }
    function doReset() { G = lobby(G.gen + 1, G.players); G.seq = G.seq || 0; stat.myThrows = 0; push(); }
    function commit(a) {
      if (!G || G.status !== 'play' || G.gen !== a.gen || G.endNo !== a.endNo || G.turn !== a.turn) return;
      var t = G.team;
      G.stones = a.final;
      G.thrown[t]++;
      G.ptr[t]++;
      G.turn++;
      G.result = null; G.shot = null; G.sx = null;
      G = startTurnOrFinish(G, N, ENDS);
      push();
    }

    /* ── 화면 짓기 ── */
    function arenaHTML(canPlay) {
      return '<div class="cu-arena ct-arena"><div class="cu-rays"></div>' + D.sheetSVG() +
        (canPlay ? '<button type="button" class="cu-aimb is-l" data-act="aimL" aria-label="왼쪽으로" hidden>' + D.icon('left', '#5b48d6') + '</button>' +
               '<button type="button" class="cu-aimb is-r" data-act="aimR" aria-label="오른쪽으로" hidden>' + D.icon('right', '#5b48d6') + '</button>' : '') +
        '<div class="cu-hint" hidden></div><div class="cu-toast" hidden></div><div class="ct-result" hidden></div><div class="ct-live" hidden></div></div>';
    }
    function scoreHTML() {
      return '<div class="ct-score"><div class="ct-sc is-red"><b>' + esc(TEAM.red.name) + '</b><strong data-sc="red">0</strong></div>' +
        '<span class="ct-endno"></span>' +
        '<div class="ct-sc is-blue"><strong data-sc="blue">0</strong><b>' + esc(TEAM.blue.name) + '</b></div></div>';
    }
    function markHTML() { return CHILD ? '<span class="cu-mark">' + esc(nm(CHILD)) + '</span>' : ''; }
    function bindArena() {
      var $ = function (s) { return root.querySelector(s); };
      el.arena = $('.cu-arena'); el.sheet = $('.cu-sheet'); el.toast = $('.cu-toast'); el.hint = $('.cu-hint'); el.result = $('.ct-result'); el.live = $('.ct-live');
      el.aimL = $('.cu-aimb.is-l'); el.aimR = $('.cu-aimb.is-r');
      el.house = $('.cu-house'); el.r0 = $('.cu-r0'); el.r1 = $('.cu-r1'); el.r2 = $('.cu-r2');
      el.stones = $('.cu-stones'); el.aim = $('.cu-aim'); el.spare = $('.cu-spare');
      el.barF = $('.cu-bar-f'); el.barN = $('.cu-bar-n');
      el.house.setAttribute('transform', 'translate(' + HOUSE.x + ' ' + HOUSE.y + ')');
      el.r0.setAttribute('r', HOUSE.r[0]); el.r1.setAttribute('r', HOUSE.r[1]); el.r2.setAttribute('r', HOUSE.r[2]);
      el.sound = $('.cu-sound');
      el.turn = $('.ct-turn');
      if (el.sound) {
        paintSound();
        el.sound.addEventListener('click', function () {
          soundOn = !soundOn;
          try { sessionStorage.setItem(AID + ':sound', soundOn ? '1' : '0'); } catch (e) {}
          paintSound(); sfx('pick');
        });
      }
    }
    function paintSound() {
      el.sound.innerHTML = D.icon(soundOn ? 'soundOn' : 'soundOff', '#5b48d6');
      el.sound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      el.sound.style.opacity = soundOn ? '1' : '.55';
    }

    /* 아이 · 한 기기 팀전 화면 */
    function buildPlay() {
      root.classList.remove('is-coach');
      root.innerHTML =
        '<div class="ct-wrap">' + arenaHTML(true) +
          '<aside class="ct-side">' +
            '<div class="cu-top"><span class="cu-title">' + esc(T.title) + '</span><span class="ct-chip ct-mine" style="margin-left:auto"></span>' +
              '<button type="button" class="cu-sound"></button></div>' +
            scoreHTML() +
            '<div class="ct-turn"></div>' +
            '<div class="cu-coach"><img class="cu-coach-img" alt="" aria-hidden="true"><p class="cu-bubble" aria-live="polite"></p></div>' +
            '<div class="ct-pips">' +
              '<div class="cu-row"><b>' + esc(TEAM.red.name) + '</b><span class="cu-pips" data-pips="red"></span></div>' +
              '<div class="cu-row"><b>' + esc(TEAM.blue.name) + '</b><span class="cu-pips" data-pips="blue"></span></div>' +
              '<div class="ct-team-line"></div>' +
            '</div>' +
            '<div class="ct-ctrl">' +
              '<div class="ct-ctrl-row"><span>' + esc(T.startPos) + '</span><button type="button" class="ct-cb" data-act="sxL" aria-label="출발 자리 왼쪽">' + D.icon('left', '#5b48d6') + '</button><button type="button" class="ct-cb" data-act="sxR" aria-label="출발 자리 오른쪽">' + D.icon('right', '#5b48d6') + '</button></div>' +
              '<div class="ct-ctrl-row"><span>' + esc(T.aimDir) + '</span><button type="button" class="ct-cb" data-act="aL" aria-label="방향 왼쪽">' + D.icon('left', '#5b48d6') + '</button><button type="button" class="ct-cb" data-act="aR" aria-label="방향 오른쪽">' + D.icon('right', '#5b48d6') + '</button></div>' +
            '</div>' +
            '<div class="cu-actions"><div class="cu-btns">' +
              '<button type="button" class="cu-btn is-hold is-off" data-act="hold">' + D.icon('stone', '#ffffff') + esc(T.hold) + '</button>' +
              (mode === 'solo' ? '<button type="button" class="cu-btn" data-act="start" hidden>' + D.icon('play', '#ffffff') + esc(T.start) + '</button>' +
                                 '<button type="button" class="cu-btn" data-act="next" hidden>' + esc(T.nextEnd) + D.icon('right', '#ffffff') + '</button>' : '') +
            '</div></div>' +
            '<div class="ct-foot"><span class="ct-credit">' + esc(CREDIT) + '</span></div>' +
          '</aside>' +
        '</div>' + markHTML();
      bindArena();
      el.mine = root.querySelector('.ct-mine');
      el.bubble = root.querySelector('.cu-bubble'); el.coachImg = root.querySelector('.cu-coach-img');
      el.hold = root.querySelector('[data-act="hold"]'); el.teamLine = root.querySelector('.ct-team-line');
      el.start = root.querySelector('[data-act="start"]'); el.next = root.querySelector('[data-act="next"]');
      el.hold.addEventListener('pointerdown', function (e) { if (canAct()) holdStart(e, el.hold); });
      el.arena.addEventListener('pointerdown', onArenaDown);
      el.arena.addEventListener('pointermove', onArenaMove);
      el.aimL.addEventListener('click', function () { setAim(K.aim - AIM_STEP); });
      el.aimR.addEventListener('click', function () { setAim(K.aim + AIM_STEP); });
      root.querySelector('[data-act="aL"]').addEventListener('click', function () { setAim(K.aim - AIM_STEP); });
      root.querySelector('[data-act="aR"]').addEventListener('click', function () { setAim(K.aim + AIM_STEP); });
      root.querySelector('[data-act="sxL"]').addEventListener('click', function () { setSx(K.sx - SX_STEP); });
      root.querySelector('[data-act="sxR"]').addEventListener('click', function () { setSx(K.sx + SX_STEP); });
      if (el.start) el.start.addEventListener('click', function () { if (mode === 'solo' && G.status === 'lobby') doStart(); });
      if (el.next) el.next.addEventListener('click', function () { if (mode === 'solo') doNext(); });
    }

    /* 코치 화면 */
    function buildCoach() {
      root.classList.add('is-coach');
      root.innerHTML =
        '<div class="ct-wrap">' + arenaHTML(false) +
          '<aside class="ct-side">' +
            '<div class="cu-top"><span class="cu-title">' + esc(T.title) + ' · ' + esc(T.coach) + '</span>' +
              '<span class="ct-count" style="margin-left:auto"></span>' +
              '<button type="button" class="cu-sound"></button></div>' +
            scoreHTML() +
            '<div class="ct-turn"></div>' +
            '<div class="ct-roster">' +
              '<div class="ct-col is-red" data-col="red"></div><div class="ct-col is-blue" data-col="blue"></div>' +
            '</div>' +
            '<div class="ct-tip">' + esc(T.tapSwap) + '</div>' +
            '<div class="ct-msg"></div>' +
            '<div class="ct-cbtns">' +
              '<button type="button" class="cu-btn is-soft" data-c="split">' + esc(T.autoSplit) + '</button>' +
              '<button type="button" class="cu-btn" data-c="start">' + esc(T.startGame) + '</button>' +
              '<button type="button" class="cu-btn is-soft" data-c="skip">' + esc(T.skipTurn) + '</button>' +
              '<button type="button" class="cu-btn" data-c="more">' + esc(T.oneMore) + '</button>' +
              '<button type="button" class="cu-btn is-soft" data-c="reset">' + esc(T.restart) + '</button>' +
            '</div>' +
            '<div class="ct-foot"><span class="ct-hist"></span><span class="ct-credit">' + esc(CREDIT) + '</span></div>' +
          '</aside>' +
        '</div>';
      bindArena();
      el.msg = root.querySelector('.ct-msg'); el.hist = root.querySelector('.ct-hist'); el.count = root.querySelector('.ct-count');
      el.cols = { red: root.querySelector('[data-col="red"]'), blue: root.querySelector('[data-col="blue"]') };
      root.querySelector('.ct-roster').addEventListener('click', function (e) {
        var b = e.target.closest('[data-code]');
        if (b) swapTeam(b.getAttribute('data-code'));
      });
      root.querySelector('.ct-cbtns').addEventListener('click', function (e) {
        var b = e.target.closest('[data-c]');
        if (b && !b.disabled) coachAct(b.getAttribute('data-c'), b);
      });
    }

    /* ── 코치 조작 ── */
    function say(msg) { if (el.msg) el.msg.textContent = msg || ''; }
    function swapTeam(code) {
      if (!G || !G.players[code]) return;
      G.players[code].team = other(G.players[code].team);
      sfx('pick'); push();
    }
    var resetArm = 0;
    function coachAct(c, btn) {
      say('');
      if (!G) return;
      if (c === 'split') {
        var ids = Object.keys(G.players);
        ids.sort(function (a, b) { return (G.players[a].at || 0) - (G.players[b].at || 0) || (a < b ? -1 : 1); });
        ids.forEach(function (p, i) { G.players[p].team = i % 2 === 0 ? 'red' : 'blue'; });
        sfx('pick'); push();
      } else if (c === 'start') {
        if (!members(G.players, 'red').length || !members(G.players, 'blue').length) { say(T.needBoth); return; }
        doStart();
      } else if (c === 'skip') {
        doSkip();
      } else if (c === 'more') {
        doNext();
      } else if (c === 'reset') {
        if (!resetArm) {
          resetArm = setTimeout(function () { resetArm = 0; btn.textContent = T.restart; btn.classList.remove('is-warn'); }, 3000);
          btn.textContent = T.restartSure; btn.classList.add('is-warn');
          return;
        }
        clearTimeout(resetArm); resetArm = 0; btn.textContent = T.restart; btn.classList.remove('is-warn');
        doReset();
      }
    }

    /* ── 맞추기: 경기 상태가 바뀌면 화면에 ── */
    function worldFromG() {
      var w = { snow: false, stones: [], active: -1 };
      if (!G) return w;
      G.stones.forEach(function (s) { w.stones.push({ x: s.x, y: s.y, vx: 0, vy: 0, own: s.t, out: false }); });
      return w;
    }
    function stopAnim() { if (A) { clearTimeout(A.t2); } clearTimeout(animT); animT = null; A = null; }
    function sync() {
      if (!el.turn) return;
      /* 상태가 앞으로 나갔으면(다음 차례·다음 판·처음부터) 굴리던 것을 멈추고 올라온 자리로 맞춘다 */
      if (A && (!G || G.gen !== A.gen || G.endNo !== A.endNo || G.status !== 'play' || G.turn !== A.turn)) stopAnim();
      if (A && A.running) { paintAll(); return; }
      if (!A && G && G.status === 'play' && G.shot && G.shot.id === idOf(G) && !done[G.shot.id]) { startAnim(); return; }
      if (!A) W = worldFromG();
      /* 내 차례 */
      if (G && G.status === 'play' && myTurn() && !G.shot) {
        if (K.forId !== idOf(G)) {
          K = { phase: 'aim', aim: 0, power: 0, dir: 1, holdTicks: 0, forId: idOf(G), sx: S.START_X, readyAt: Date.now() };
          clearTimeout(resendT);
          sfx('up');
          log('game-item-ready', { itemId: idOf(G), endNo: G.endNo, turn: G.turn + 1, team: G.team });
        } else if (K.phase === 'idle') K.phase = 'aim';     // 잠깐 끊겼다 돌아온 같은 차례: 다시 던질 수 있게
      } else if (K.phase === 'aim' || K.phase === 'hold') {
        K.phase = 'idle'; stopHold();
      }
      /* 아이: 내가 끊긴 것으로 보이면 다시 알림 */
      if (mode === 'kid' && G && G.players[CHILD] && G.players[CHILD].on === false && Date.now() - lastRejoin > 3000) {
        lastRejoin = Date.now();
        joinN = (joinN + 1) % 10;
        writeBoard('j|' + joinN); armDisconnect();
      }
      /* 한 판 끝 · 경기 끝 */
      if (G && G.status === 'result') {
        var rk = idOf(G);
        if (!seenResult[rk]) {
          seenResult[rk] = 1;
          if (G.result && G.result.win) sfx('star', 3); else sfx('down');
          if (mode !== 'coach') log('game-item-complete', { itemId: 'g' + G.gen + '-e' + G.endNo, endNo: G.endNo, myTeam: myTeamOf(), red: G.result ? G.result.red : 0, blue: G.result ? G.result.blue : 0, myThrows: stat.endThrows });
          stat.endThrows = 0;
        }
        if (G.over && !seenOver[G.gen]) {
          seenOver[G.gen] = 1;
          if (mode !== 'coach') {
            clearTimeout(endT);
            endT = setTimeout(showEnd, reduced ? 600 : 2200);
          }
        }
      }
      if (!(G && G.status === 'result' && G.over)) hideEnd();
      paintAll();
    }

    function startAnim() {
      var sh = G.shot;
      done[sh.id] = 1;
      var L = S.launch(sh.power, sh.aim, sh.sx);
      W = worldFromG();
      W.active = W.stones.length;
      W.stones.push({ x: L.x, y: L.y, vx: L.vx, vy: L.vy, own: G.team, out: false });
      A = { running: true, id: sh.id, gen: G.gen, endNo: G.endNo, turn: G.turn, team: G.team, by: sh.by, power: sh.power, aim: sh.aim, sx: sh.sx, tick: 0, final: null, bumped: false };
      if (K.phase !== 'idle') { K.phase = 'idle'; stopHold(); }
      clearTimeout(resendT);
      sfx('slide', 1 + sh.power * 1.5);
      clearTimeout(animT);
      animT = setTimeout(animTick, TICK);
      paintAll();
    }
    function animTick() {
      animT = null;
      if (!A || !A.running) return;
      var ev = S.stepWorld(W, false);
      A.tick++;
      if (ev.bumped) { A.bumped = true; sfx('clack'); }
      if (ev.walled) sfx('wall');
      render();
      if (S.allStopped(W) || A.tick > 4000) animStop();
      else animT = setTimeout(animTick, TICK);
    }
    function outcomeOf(a, s, stars) {
      if (stars >= 1) return 'house';
      var rad = a.aim * Math.PI / 180;
      var along = (HOUSE.x - a.sx) * Math.sin(rad) - (HOUSE.y - S.START_Y) * Math.cos(rad);
      var went = s.out ? 999 : (s.x - a.sx) * Math.sin(rad) - (s.y - S.START_Y) * Math.cos(rad);
      if (s.out || went > along + HOUSE.r[2] * 0.6) return 'long';
      if (went < along - HOUSE.r[2] * 0.6) return 'short';
      return 'side';
    }
    function animStop() {
      var a = A, mine = W.stones[W.active];
      var stars = S.starsAt(HOUSE, mine);
      if (stars > 0) sfx('star', stars);
      var mineThrow = mode === 'solo' || (mode === 'kid' && a.by === CHILD);
      if (mineThrow) {
        var outcome = outcomeOf(a, mine, stars), ok = stars >= 1;
        stat.myThrows++; stat.endThrows++;
        var d = {
          itemId: a.id, endNo: a.endNo, turn: a.turn + 1, team: a.team, correct: ok, response: outcome, expected: 'house', attempt: 1,
          errorType: ok ? '' : (outcome === 'short' ? 'too-weak' : outcome === 'long' ? 'too-strong' : 'off-line'),
          responseMs: K.lastHoldMs || null, holdMs: K.lastHoldMs || null,
          power: r2(a.power), aimDeg: r1(a.aim), startX: r1(a.sx),
          distCenter: mine.out ? null : r1(S.distTo(HOUSE, mine)), stars: stars, inHouse: ok, bumped: a.bumped,
          mode: mode === 'solo' ? 'one-device' : 'team-live'
        };
        if (ok) d.accuracy = 'accurate';
        log('game-response', d);
      }
      a.t2 = setTimeout(function () {
        if (A !== a) return;
        S.clearShort(W.stones, HOUSE);
        a.final = W.stones.filter(function (s) { return !s.out; }).map(function (s) { return { x: r3(s.x), y: r3(s.y), t: s.own }; });
        a.running = false;
        if (isRef()) commit(a);
        else sync();
      }, reduced ? 300 : 800);
    }

    /* ── 던지기 조작(아이 · 한 기기 팀전) ── */
    function canAct() {
      return mode !== 'coach' && !!G && G.status === 'play' && myTurn() && !G.shot && !(A && A.running) &&
        (K.phase === 'aim' || K.phase === 'hold') && K.forId === idOf(G);
    }
    function fieldXY(e) {
      var r = el.sheet.getBoundingClientRect();
      if (!r.width) return null;
      return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
    }
    function aimTo(x, y) { return Math.atan2(x - K.sx, S.START_Y - y) * 180 / Math.PI; }
    function setSx(x) {
      if (!canAct() || K.phase !== 'aim') return;
      K.sx = Math.max(SX_MIN, Math.min(SX_MAX, x));
      if (mode === 'kid') writeBoard('s|' + idOf(G) + '|' + K.sx);
      sfx('pick'); paintAll();
    }
    function setAim(a) {
      if (!canAct() || K.phase !== 'aim') return;
      K.aim = Math.round(Math.max(-AIM_MAX, Math.min(AIM_MAX, a)) * 2) / 2;
      render();
    }
    function onArenaDown(e) {
      if (e.target.closest('.cu-aimb')) return;
      if (!canAct() || K.phase !== 'aim') return;
      var q = fieldXY(e);
      if (q && q.y < 74 && q.x > S.SHEET_L - 2 && q.x < S.SHEET_R + 2) {
        aimDrag = true;
        setAim(aimTo(q.x, Math.min(q.y, S.START_Y - 8)));
        try { el.arena.setPointerCapture(e.pointerId); } catch (er) {}
        return;
      }
      holdStart(e, el.arena);
    }
    function onArenaMove(e) {
      if (!aimDrag || !canAct() || K.phase !== 'aim') return;
      var q = fieldXY(e);
      if (q) setAim(aimTo(q.x, Math.min(q.y, S.START_Y - 8)));
    }
    function onUp() { aimDrag = false; if (K.phase === 'hold') release(); }
    function holdStart(e, target) {
      if (!canAct() || K.phase !== 'aim') return;
      if (e && target) { try { target.setPointerCapture(e.pointerId); } catch (er) {} }
      K.phase = 'hold'; K.power = 0; K.dir = 1; K.holdTicks = 0;
      if (el.hold) el.hold.classList.add('is-down');
      el.hint.hidden = true;
      stopHold();
      holdT = setTimeout(holdTick, TICK);
      paintAll();
    }
    function holdTick() {
      holdT = null;
      if (K.phase !== 'hold') return;
      K.holdTicks++;
      K.power += K.dir * DT / (BAR_MS / 1000);
      if (K.power >= 1) { K.power = 2 - K.power; K.dir = -1; sfx('edge'); }
      else if (K.power <= 0) { K.power = -K.power; K.dir = 1; }
      render();
      holdT = setTimeout(holdTick, TICK);
    }
    function stopHold() { if (holdT) { clearTimeout(holdT); holdT = null; } if (el.hold) el.hold.classList.remove('is-down'); }
    function release() {
      if (K.phase !== 'hold') return;
      stopHold();
      if (!canAct()) { K.phase = 'idle'; paintAll(); return; }
      if (K.holdTicks < QUICK) {
        K.phase = 'aim'; K.power = 0;
        sfx('quick');
        toast(esc(T.quick), 1100);
        paintAll();
        return;
      }
      var p = Math.round(Math.max(0, Math.min(1, K.power)) * 10000) / 10000, aim = K.aim, id = idOf(G);
      K.lastHoldMs = K.holdTicks * TICK;
      if (mode === 'solo') {
        G.shot = { id: id, power: p, aim: aim, sx: K.sx, by: G.thrower };
        K.phase = 'sent';
        push();
        return;
      }
      /* 아이: 내 칸에 던지기를 쓴다 → 코치가 받아 state 에 올리면 모두 함께 굴린다 */
      K.phase = 'sent';
      sendN = (sendN + 1) % 10;
      writeBoard('t|' + id + '|' + p + '|' + aim + '|' + K.sx + '|' + sendN);
      clearTimeout(resendT);
      resendT = setTimeout(function () {            // 코치에게 닿지 않았으면 다시 던질 수 있게
        if (K.phase === 'sent' && K.forId === id && G && idOf(G) === id && !G.shot && myTurn()) {
          K.phase = 'aim'; toast(esc(T.resend), 1100); paintAll();
        }
      }, cfg.resendMs || 5000);
      paintAll();
    }
    function onKeyDown(e) {
      if (mode === 'coach' || !mode) return;
      var k2 = e.key;
      if (k2 === ' ' || k2 === 'Spacebar') {
        if (!canAct()) return;
        e.preventDefault();
        if (!e.repeat && K.phase === 'aim') holdStart(null, null);
      } else if ((k2 === 'ArrowLeft' || k2 === 'ArrowRight') && canAct() && K.phase === 'aim') {
        e.preventDefault();
        setAim(K.aim + (k2 === 'ArrowLeft' ? -AIM_STEP : AIM_STEP));
      }
    }
    function onKeyUp(e) { if ((e.key === ' ' || e.key === 'Spacebar') && K.phase === 'hold') release(); }
    global.addEventListener('pointerup', onUp);
    global.addEventListener('pointercancel', onUp);
    global.addEventListener('keydown', onKeyDown);
    global.addEventListener('keyup', onKeyUp);
    global.addEventListener('blur', function () { if (K.phase === 'hold') release(); });
    root.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    var toastT = null;
    function toast(html, ms) {
      if (!el.toast) return;
      clearTimeout(toastT);
      el.toast.className = 'cu-toast';
      el.toast.innerHTML = html; el.toast.hidden = false;
      toastT = setTimeout(function () { el.toast.hidden = true; }, ms || 900);
    }

    /* ── 끝 화면(아이 · 한 기기 팀전) ── */
    function showEnd() {
      endT = null;
      if (!G || !G.over || G.status !== 'result' || root.querySelector('.ct-end')) return;
      var fw = G.score.red > G.score.blue ? 'red' : G.score.blue > G.score.red ? 'blue' : '';
      var line = fw ? fmt(T.endWin, { team: TEAM[fw].name, red: G.score.red, blue: G.score.blue }) : fmt(T.endTie, { red: G.score.red, blue: G.score.blue });
      var sec = h('section', 'cu-end ct-end');
      sec.setAttribute('data-track', 'activity-complete');
      sec.setAttribute('data-activity-id', AID);
      sec.innerHTML =
        '<img class="cu-end-img" alt="" aria-hidden="true" src="' + esc(jelly('jelly-cheer')) + '">' +
        '<h2>' + esc(T.endTitle) + '</h2>' +
        '<p class="cu-end-line' + (fw ? ' is-' + fw : '') + '">' + esc(line) + '</p>' +
        '<p class="ct-end-sub">' + esc(fmt(T.overLine, { max: ENDS })) + '</p>' +
        (mode === 'solo' ? '<div class="cu-btns"><button type="button" class="cu-btn" data-act="again">' + againIcon('#ffffff') + esc(T.again) + '</button></div>'
                         : '<p class="ct-end-sub">' + esc(T.waitCoach) + '</p>') +
        '<p class="cu-credit">' + esc(CREDIT) + '</p>';
      root.appendChild(sec);
      var ag = sec.querySelector('[data-act="again"]');
      if (ag) ag.addEventListener('click', function () { sfx('pick'); doReset(); });
      sfx('done');
      log('game-activity-complete', { itemId: 'g' + G.gen, ends: G.endNo, red: G.score.red, blue: G.score.blue, myTeam: myTeamOf(), myThrows: stat.myThrows,
        mode: mode === 'solo' ? 'one-device' : 'team-live' });
    }
    function hideEnd() {
      clearTimeout(endT); endT = null;
      var e2 = root.querySelector('.ct-end');
      if (e2) e2.parentNode.removeChild(e2);
    }

    /* ── 그리기 ── */
    function myTeamOf() { return mode === 'kid' && G && G.players[CHILD] ? G.players[CHILD].team : ''; }
    function nm(code) { var n = global.ONCUVATE && global.ONCUVATE.names; return (n && n[code]) || code || ''; }   // 이름표: 넣어 준 이름이 있으면 그것, 없으면 코드
    function nameOf(code) { return mode === 'solo' ? (TEAM[code] ? TEAM[code].name : '') : nm(code); }
    function render() {
      if (!el.stones) return;
      var html = '', glow = [];
      var w = W || worldFromG();
      var showResult = G && G.status === 'result' && !(A && A.running);
      if (showResult && G.result) glow = arr(G.result.glow);
      var live = null, rank = {};
      if (G && G.status === 'play' && !(A && A.running)) {
        live = scoreEnd(w.stones.map(function (s) { return s.out ? { x: -99, y: -99, t: s.own } : { x: s.x, y: s.y, t: s.own }; }));
        var ord = live.glow.slice().sort(function (a, b) { return S.distTo(HOUSE, w.stones[a]) - S.distTo(HOUSE, w.stones[b]); });
        ord.forEach(function (i, k2) { rank[i] = k2 + 1; });
      }
      w.stones.forEach(function (s, i) {
        if (s.out) return;
        var badge = rank[i] ? '<g transform="translate(3.4 -3.4)"><circle r="2.3" fill="#ffd23f" stroke="#ffffff" stroke-width="0.6"/><text y="0.95" text-anchor="middle" font-size="2.8" font-weight="900" fill="#3a2a00">' + rank[i] + '</text></g>' : '';
        html += '<g transform="translate(' + s.x.toFixed(2) + ' ' + s.y.toFixed(2) + ')">' + teamStone(s.own, glow.indexOf(i) >= 0) + badge + '</g>';
      });
      if (el.live) {
        if (live && w.stones.length) {
          el.live.hidden = false;
          el.live.className = 'ct-live' + (live.win ? ' is-' + live.win : '');
          el.live.textContent = live.win ? '지금은 ' + TEAM[live.win].name + ' ' + live.pts + '점' : '아직 과녁 안에 돌이 없어요';
        } else el.live.hidden = true;
      }
      /* 던질 돌(아직 안 던졌을 때) */
      var waiting = G && G.status === 'play' && !A && !G.shot;
      if (waiting) {
        var px = (myTurn() && K.forId === idOf(G)) ? K.sx : (G.sx != null ? G.sx : S.START_X);
        html += '<g transform="translate(' + px + ' ' + S.START_Y + ')">' + teamStone(G.team, false) + '</g>';
      }
      el.stones.innerHTML = html;
      /* 방향 점선(내가 던질 때만) */
      if (canAct()) {
        var ar = K.aim * Math.PI / 180, L = 40;
        el.aim.setAttribute('display', 'inline');
        el.aim.setAttribute('x1', K.sx);
        el.aim.setAttribute('x2', (K.sx + Math.sin(ar) * L).toFixed(2));
        el.aim.setAttribute('y2', (S.START_Y - Math.cos(ar) * L).toFixed(2));
      } else el.aim.setAttribute('display', 'none');
      /* 힘 막대 */
      var p = K.phase === 'hold' ? K.power : (A ? A.power : 0);
      var fh = 60 * Math.max(0, Math.min(1, p));
      el.barF.setAttribute('y', (91 - fh).toFixed(2));
      el.barF.setAttribute('height', fh.toFixed(2));
      el.barN.setAttribute('transform', 'translate(0 ' + (91 - fh).toFixed(2) + ')');
      /* 남은 돌(왼쪽): 빨강은 아래에서 위로, 파랑은 위에서 아래로 */
      var lh = '';
      if (G && G.status !== 'lobby') {
        var y, i, left;
        left = N - G.thrown.red - (waiting && G.team === 'red' ? 1 : 0) - (A && A.team === 'red' ? 1 : 0);
        for (i = 0, y = 74; i < left; i++, y -= 7) lh += '<g transform="translate(7.5 ' + y + ') scale(0.8)">' + teamStone('red') + '</g>';
        left = N - G.thrown.blue - (waiting && G.team === 'blue' ? 1 : 0) - (A && A.team === 'blue' ? 1 : 0);
        for (i = 0, y = 10; i < left; i++, y += 7) lh += '<g transform="translate(7.5 ' + y + ') scale(0.8)">' + teamStone('blue') + '</g>';
      }
      el.spare.innerHTML = lh;
    }

    function turnInfo() {
      if (!G || G.status === 'lobby') return { cls: '', html: esc(mode === 'solo' ? T.soloTip : mode === 'coach' ? T.coachReady : T.waitStart) };
      if (G.status === 'result') {
        var r = G.result || {};
        return { cls: r.win ? 'is-' + r.win : '', html: esc(fmt(T.endDone, { n: G.endNo })) };
      }
      var team = A ? A.team : G.team, who = A ? A.by : G.thrower;
      if (mode === 'solo') return { cls: 'is-' + team + (A ? '' : ' is-me'), html: esc(fmt(T.teamTurn, { team: TEAM[team].name })) };
      if (mode === 'kid' && who === CHILD) return { cls: 'is-' + team + (A ? '' : ' is-me'), html: esc(T.myTurn) + ' <small>· ' + esc(TEAM[team].name) + '</small>' };
      return { cls: 'is-' + team, html: esc(fmt(T.turnOf, { name: nameOf(who) || '…' })) + ' <small>· ' + esc(TEAM[team].name) + '</small>' };
    }

    function paintAll() {
      if (!el.turn) return;
      var g = G;
      var scR = root.querySelector('[data-sc="red"]'), scB = root.querySelector('[data-sc="blue"]'), en = root.querySelector('.ct-endno');
      scR.textContent = g ? g.score.red : 0; scB.textContent = g ? g.score.blue : 0;
      en.textContent = g && g.status !== 'lobby' ? fmt(T.endNo, { n: g.endNo, max: ENDS }) : '';
      var ti = turnInfo();
      el.turn.className = 'ct-turn' + (ti.cls ? ' ' + ti.cls : '');
      el.turn.innerHTML = ti.html;
      if (g && g.status === 'result' && !(A && A.running)) {
        var r = g.result || {};
        el.result.className = 'ct-result' + (r.win ? ' is-' + r.win : '');
        if (g.over) {
          var fw = g.score.red > g.score.blue ? 'red' : g.score.blue > g.score.red ? 'blue' : '';
          el.result.className = 'ct-result' + (fw ? ' is-' + fw : '');
          el.result.textContent = T.endTitle + ' ' + (fw ? TEAM[fw].name + ' 승리 ' : '비겼어요 ') + g.score.red + ' : ' + g.score.blue;
        } else el.result.textContent = r.win ? fmt(T.points, { team: TEAM[r.win].name, n: r.pts }) : T.blank;
        el.result.hidden = false;
      } else el.result.hidden = true;
      if (mode === 'coach') paintCoach(); else paintKid();
      render();
    }
    function paintKid() {
      var g = G, t = myTeamOf();
      if (mode === 'kid') {
        el.mine.hidden = false;
        el.mine.innerHTML = (t ? '<i style="background:' + TEAM[t].fill + '"></i>' : '') + esc(nm(CHILD)) + (t ? ' · ' + esc(TEAM[t].name) : '');
        el.mine.style.background = t ? TEAM[t].soft : '#f3effd';
        el.mine.style.color = t ? TEAM[t].dark : '#3b2a9e';
      } else el.mine.hidden = true;
      ['red', 'blue'].forEach(function (tm) {
        var box = root.querySelector('[data-pips="' + tm + '"]'), html = '', used = g && g.status !== 'lobby' ? g.thrown[tm] : 0;
        for (var i = 0; i < N; i++) html += '<i class="' + tm + (i < used ? ' used' : '') + '"></i>';
        box.innerHTML = html;
      });
      var mates = t && g ? members(g.players, t).map(function (m) { return m.code; }) : [];
      el.teamLine.textContent = t ? TEAM[t].name + ' · ' + mates.join(', ') : '';
      /* 말풍선 · 단추 */
      var line = T.watch, mood = 'jelly-look', act = canAct();
      if (!g || g.status === 'lobby') { line = mode === 'solo' ? T.soloReady : T.kidLobby; mood = 'jelly-default'; }
      else if (g.status === 'result') {
        var r = g.result || {};
        line = r.win ? fmt(T.winLine, { team: TEAM[r.win].name }) : T.blankLine;
        if (mode === 'solo' && !g.over) line += ' ' + T.soloNext;
        mood = r.win ? 'jelly-cheer' : 'jelly-thinking';
        if (g.over) { line = fmt(T.overLine, { max: ENDS }); mood = 'jelly-cheer'; }
      } else if (A && A.running) { line = T.sliding; }
      else if (act) { line = K.phase === 'hold' ? T.holding : T.aimGo; mood = 'jelly-praise'; }
      if (el.bubble.textContent !== line) el.bubble.textContent = line;
      var src = jelly(mood);
      if (el.coachImg.getAttribute('src') !== src) el.coachImg.setAttribute('src', src);
      el.hold.classList.toggle('is-off', !act);
      var st = g ? g.status : 'lobby';
      if (el.start) el.start.hidden = !(st === 'lobby');
      if (el.next) el.next.hidden = !(st === 'result' && !g.over);
      el.hold.hidden = mode === 'solo' && st !== 'play';
      el.arena.classList.toggle('is-locked', !act);
      var showAim = act && K.phase === 'aim';
      el.aimL.hidden = el.aimR.hidden = !showAim;
      Array.prototype.forEach.call(root.querySelectorAll('.ct-cb'), function (b) { b.disabled = !showAim; });
      if (showAim) { el.hint.textContent = T.aimTip; el.hint.className = 'cu-hint is-top'; el.hint.hidden = false; }
      else el.hint.hidden = true;
    }
    function paintCoach() {
      var g = G;
      var P = g ? g.players : {};
      var total = 0;
      ['red', 'blue'].forEach(function (tm) {
        var list = members(P, tm), html = '<h3>' + esc(TEAM[tm].name) + ' · ' + list.length + '</h3>';
        total += list.length;
        if (!list.length) html += '<span class="ct-tip">' + esc(T.nobody) + '</span>';
        list.forEach(function (m) {
          var now = g && g.status === 'play' && ((A && A.running) ? A.by === m.code : g.thrower === m.code);
          html += '<button type="button" class="ct-kid' + (now ? ' is-now' : '') + (m.on ? '' : ' is-off') + '" data-code="' + esc(m.code) + '"' +
            ' aria-label="' + esc(nm(m.code) + ' — ' + TEAM[other(tm)].name + '로') + '">' + esc(nm(m.code)) + '</button>';
        });
        el.cols[tm].innerHTML = html;
      });
      el.count.textContent = fmt(T.joined, { n: total });
      var st = g ? g.status : 'lobby';
      var flying = !!(g && g.shot) || !!(A && A.running);
      function en(c, on) { var b = root.querySelector('[data-c="' + c + '"]'); if (b) b.disabled = !on; }
      en('split', st !== 'play');
      en('start', st === 'lobby');
      en('skip', st === 'play' && !flying);
      en('more', st === 'result' && !(g && g.over));
      en('reset', true);
      var hs = g ? g.history : [];
      el.hist.textContent = hs.length ? T.history + ': ' + hs.map(function (x, i) {
        return (i + 1) + '판 ' + (x.red ? '빨강 ' + x.red : x.blue ? '파랑 ' + x.blue : '0:0');
      }).join(' · ') : '';
    }

    boot();

    return {
      /* 시험용(읽기만) */
      peek: function () {
        return { version: VERSION, mode: mode, child: CHILD, boardKey: SK, phase: K.phase, power: K.power, aim: K.aim, sx: K.sx, canAct: canAct(),
                 animating: !!(A && A.running), game: clone(G), stat: clone(stat),
                 stones: (W || worldFromG()).stones.filter(function (s) { return !s.out; }).map(function (s) { return { x: r3(s.x), y: r3(s.y), t: s.own }; }) };
      }
    };
  }

  global.CurlingTeam = { version: VERSION, mount: mount, scoreEnd: scoreEnd, HOUSE: HOUSE };
})(window);
