/*!
 * 「젤리 미로」 미로 찾기 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 4장 집행력 「미로 찾기 1~4」(115~118쪽)
 *            (출발에서 도착까지 길을 찾는다 — 계획하고 막히면 돌아가기) — 활동 방식만 가져왔다.
 *
 * 한 판: 젤리를 케이크까지 데려간다. 미로는 판마다 새로 만든다(길이 하나뿐인 미로).
 *   움직이기: 옆 칸 누르기 · 곧게 이어진 칸 누르기(그 칸까지 미끄러짐) · 손가락으로 끌기 · 키보드 화살표
 *   벽 쪽으로 가려 하면 젤리가 툭 튕긴다(부딪힘으로 기록). 지나온 길은 점선으로 남고, 되돌아가면 지워진다.
 *   「길 보기」(아이가 고름, 도움 A3): 지금 자리에서 앞으로 갈 몇 칸을 하늘색 점으로 잠깐 보여 준다.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 미로 그림은 SVG(색은 SVG 속성에 글자값)로 그린다.
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 길 보기   data-track="hint" data-help-level="A3"
 *   - 끝 화면   data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response(도착할 때 판 단위 정확성) / game-help / game-item-complete / game-activity-complete
 *     (판 끝에 걸음 수·최단 걸음 수·부딪힘·되돌아감·길 보기 횟수를 남긴다)
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var SVGNS = 'http://www.w3.org/2000/svg';

  var TEXT = {
    title: '젤리 미로',
    ready: '젤리를 케이크까지 데려가요. 먼저 눈으로 길을 찾아봐요.',
    start: '출발',
    run: '옆 칸을 누르거나 끌어서 움직여요.',
    bump: '앗, 벽이에요! 다른 길로 가 봐요.',
    far: '젤리 옆 칸이나 곧게 이어진 칸을 눌러요.',
    hint: '길 보기',
    hinted: '하늘색 점을 따라가 봐요.',
    good: ['좋아요!', '잘 가고 있어요!'],
    arrive: '케이크에 도착했어요!',
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoBig: '{n} × {n} 미로',
    infoSmall: '막히면 돌아가도 괜찮아요',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = { ready: 'jelly-default', run: 'jelly-look', bump: 'jelly-thinking', help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer' };

  var DEFAULTS = {
    activityId: 'maze',
    storageKey: null,
    rounds: [],                // [ {id, size} ]
    player: 'assets/images/jelly/jelly-default.webp',
    goal: 'assets/images/cards/cake.webp',
    hintSteps: 5,              // 길 보기로 보여 줄 칸 수
    hintMs: 1800,
    sound: true,
    restartButton: true,
    credit: '',
    coachBase: 'assets/images/jelly/',
    coachExt: '.webp',
    texts: null,
    debug: false,
    onRoundEnd: null,
    onFinish: null
  };

  var CSS = [
    '.mz-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:mz / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.mz-root *,.mz-root *::before,.mz-root *::after{box-sizing:border-box}',
    '.mz-root [hidden]{display:none!important}',
    '.mz-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    '.mz-arena{container:mzarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;padding:4cqmin;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.mz-board{--n:5;position:relative;width:100%;height:100%;touch-action:none}',
    '.mz-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}',
    '.mz-cells{position:absolute;inset:0;display:grid;grid-template-columns:repeat(var(--n),1fr);grid-template-rows:repeat(var(--n),1fr)}',
    '.mz-cell{border:0;padding:0;margin:0;background:transparent;cursor:pointer;outline:none}',
    '.mz-cell:focus-visible{background:rgba(255,210,63,.25)}',
    '.mz-tok{position:absolute;left:0;top:0;width:calc(100% / var(--n));height:calc(100% / var(--n));display:grid;place-items:center;pointer-events:none;',
    'transition:transform .14s ease-out}',
    '.mz-tok img{width:86%;height:86%;object-fit:contain;filter:drop-shadow(0 3px 2px rgba(0,0,0,.35))}',
    '.mz-tok.mz-bump{animation:mz-bump .3s ease-in-out}',
    '.mz-goal img{animation:mz-bob 1.6s ease-in-out infinite}',
    '.mz-goal.is-got img{animation:mz-pop .4s cubic-bezier(.3,1.5,.5,1)}',
    '.mz-off .mz-cell{cursor:default}',

    '.mz-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.mz-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.mz-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.mz-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.mz-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 6px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.mz-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.mz-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.mz-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.mz-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.mz-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.mz-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.mz-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.mz-coach.is-temp .mz-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.mz-coach.is-good .mz-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.mz-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.mz-info-icon{font-size:clamp(30px,10cqh,48px);line-height:1}',
    '.mz-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.mz-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.mz-pad{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:8px;',
    'max-width:300px;width:100%;align-self:center}',
    '.mz-arrow{border:0;border-radius:16px;font:inherit;font-size:clamp(20px,7cqh,34px);font-weight:900;color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3);cursor:pointer;touch-action:manipulation}',
    '.mz-arrow:active{transform:translateY(2px);box-shadow:0 2px 0 var(--v3)}',
    '.mz-arrow:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',
    '.mz-arrow.u{grid-column:2;grid-row:1}.mz-arrow.l{grid-column:1;grid-row:2}.mz-arrow.d{grid-column:2;grid-row:2}.mz-arrow.r{grid-column:3;grid-row:2}',
    '.mz-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.mz-left{display:flex;gap:8px;margin-right:auto}',
    '.mz-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.mz-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.mz-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.mz-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.mz-btn.is-call{animation:mz-call 1.1s ease-in-out infinite}',
    '.mz-btn:focus-visible,.mz-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.mz-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.mz-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.mz-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.mz-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.mz-end .mz-btns{margin:0;justify-content:center}',
    '.mz-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.mz-stamps .mz-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.mz-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.mz-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '.mz-bit{position:absolute;left:50%;top:50%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:mz-bit .9s ease-out forwards}',
    '@keyframes mz-bump{30%{transform:var(--from) translate(var(--bx),var(--by))}}',
    '@keyframes mz-bob{50%{transform:translateY(-6%)}}',
    '@keyframes mz-pop{from{transform:scale(.5)}}',
    '@keyframes mz-call{50%{box-shadow:0 4px 0 var(--v3),0 0 0 6px rgba(255,210,63,.6)}}',
    '@keyframes mz-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    '@container mz (max-aspect-ratio:5/4){',
    '.mz-wrap{--arena:min(calc(100cqw - 24px),52cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.mz-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.mz-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('mz-style')) return;
    var s = document.createElement('style');
    s.id = 'mz-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(t, map) {
    return String(t).replace(/\{(\w+)\}/g, function (m, k) { return map[k] != null ? map[k] : m; });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function sv(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    return e;
  }

  var AC = null;
  function tones(freqs, step, type, vol) {
    try {
      AC = AC || new (global.AudioContext || global.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      var t0 = AC.currentTime;
      freqs.forEach(function (f, i) {
        var o = AC.createOscillator(), g = AC.createGain(), t = t0 + i * step;
        o.type = type || 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.16, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + step + 0.12);
        o.connect(g); g.connect(AC.destination);
        o.start(t); o.stop(t + step + 0.15);
      });
    } catch (e) { /* 소리가 없어도 게임은 돈다 */ }
  }
  var SFX = {
    step: function () { tones([660], 0.03, 'sine', 0.05); },
    bump: function () { tones([196], 0.08, 'triangle', 0.12); },
    show: function () { tones([587, 698], 0.08, 'sine', 0.08); },
    pick: function () { tones([740], 0.05, 'sine', 0.08); },
    done: function () { tones([523, 659, 784, 1047], 0.09, 'sine', 0.14); }
  };

  /* 미로 만들기: 깊이 우선으로 벽을 허문다(길이 하나뿐인 미로). walls[r][c] = {r: 오른쪽 벽, b: 아래 벽} */
  function makeMaze(n) {
    var walls = [], seen = [], r, c;
    for (r = 0; r < n; r++) { walls.push([]); seen.push([]); for (c = 0; c < n; c++) { walls[r].push({ r: true, b: true }); seen[r].push(false); } }
    var stack = [[0, 0]];
    seen[0][0] = true;
    while (stack.length) {
      var cur = stack[stack.length - 1], cr = cur[0], cc = cur[1];
      var nb = shuffle([[cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]]).filter(function (p) {
        return p[0] >= 0 && p[0] < n && p[1] >= 0 && p[1] < n && !seen[p[0]][p[1]];
      });
      if (!nb.length) { stack.pop(); continue; }
      var nx = nb[0];
      if (nx[0] === cr) { if (nx[1] > cc) walls[cr][cc].r = false; else walls[cr][nx[1]].r = false; }
      else { if (nx[0] > cr) walls[cr][cc].b = false; else walls[nx[0]][cc].b = false; }
      seen[nx[0]][nx[1]] = true;
      stack.push(nx);
    }
    return walls;
  }
  function open(walls, n, r, c, dr, dc) {
    var r2 = r + dr, c2 = c + dc;
    if (r2 < 0 || r2 >= n || c2 < 0 || c2 >= n) return false;
    if (dr === 0) return dc > 0 ? !walls[r][c].r : !walls[r][c2].r;
    return dr > 0 ? !walls[r][c].b : !walls[r2][c].b;
  }
  /* 지금 칸에서 도착까지의 길(칸 목록) */
  function solve(walls, n, from, to) {
    var prev = {}, q = [from], key = function (p) { return p[0] + ',' + p[1]; };
    prev[key(from)] = null;
    while (q.length) {
      var p = q.shift();
      if (p[0] === to[0] && p[1] === to[1]) break;
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) {
        if (!open(walls, n, p[0], p[1], d[0], d[1])) return;
        var nx = [p[0] + d[0], p[1] + d[1]];
        if (prev.hasOwnProperty(key(nx))) return;
        prev[key(nx)] = p;
        q.push(nx);
      });
    }
    var path = [], cur = to;
    while (cur) { path.unshift(cur); cur = prev[key(cur)]; }
    return path;
  }

  function mount(host, options) {
    injectCSS();
    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    for (k in options || {}) o[k] = options[k];
    var T = {};
    for (k in TEXT) T[k] = TEXT[k];
    for (k in o.texts || {}) T[k] = o.texts[k];
    var storeKey = (o.storageKey || o.activityId) + ':';
    var reduced = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var soundOn = o.sound;
    try { var svv = sessionStorage.getItem(storeKey + 'sound'); if (svv !== null) soundOn = svv === '1'; } catch (e) {}
    function sfx(name) { if (soundOn) SFX[name](); }

    function log(type, detail) {
      var d = { type: type, schemaVersion: '0.2', activityId: o.activityId };
      for (var key in detail) d[key] = detail[key];
      try { global.dispatchEvent(new CustomEvent('oncuvate:log', { detail: d })); } catch (e) {}
      if (o.debug && global.console) console.log('[oncuvate:log]', d);
    }
    function coachSrc(mood) { return o.coachBase ? o.coachBase + COACH[mood] + o.coachExt : ''; }
    if (o.coachBase) Object.keys(COACH).forEach(function (m) { var im = new Image(); im.src = coachSrc(m); });

    var root = h('div', 'mz-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="mz-wrap">' +
        '<div class="mz-arena"><div class="mz-board" role="group" aria-label="미로">' +
          '<svg class="mz-svg" aria-hidden="true"></svg><div class="mz-cells"></div>' +
          '<div class="mz-tok mz-goal"><img alt="" src="' + esc(o.goal) + '"></div>' +
          '<div class="mz-tok mz-me"><img alt="" src="' + esc(o.player) + '"></div>' +
        '</div></div>' +
        '<aside class="mz-side">' +
          '<div class="mz-top">' +
            '<span class="mz-title">' + esc(T.title) + '</span>' +
            '<ol class="mz-rounds" aria-label="판"></ol>' +
            '<button type="button" class="mz-sound" data-mz-act="sound"></button>' +
          '</div>' +
          '<div class="mz-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="mz-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="mz-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="mz-info" hidden></div>' +
          '<div class="mz-pad" hidden>' +
            '<button type="button" class="mz-arrow u" data-dir="u" aria-label="위로">▲</button>' +
            '<button type="button" class="mz-arrow l" data-dir="l" aria-label="왼쪽으로">◀</button>' +
            '<button type="button" class="mz-arrow d" data-dir="d" aria-label="아래로">▼</button>' +
            '<button type="button" class="mz-arrow r" data-dir="r" aria-label="오른쪽으로">▶</button>' +
          '</div>' +
          '<div class="mz-actions"><div class="mz-left"></div><div class="mz-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="mz-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="mz-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="mz-end-line"></p><div class="mz-stamps"></div><div class="mz-btns"></div>' +
        (o.credit ? '<p class="mz-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'mz-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.mz-rounds'), elSound = $('.mz-sound'), elArena = $('.mz-arena'), elBoard = $('.mz-board'), elSvg = $('.mz-svg'),
        elCells = $('.mz-cells'), elMe = $('.mz-me'), elGoal = $('.mz-goal'),
        elCoach = $('.mz-coach'), elCoachImg = $('.mz-coach-img'), elBubble = $('.mz-bubble'),
        elInfo = $('.mz-info'), elPad = $('.mz-pad'), elLeft = $('.mz-left'), elActs = $('.mz-side .mz-btns'), elEnd = $('.mz-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var plans = [], R = null, ri = 0, results = [], timers = [], tempTimer = null;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function plan(spec, idx) {
      var n = Math.max(3, Math.min(spec.size || 5, 12));
      var walls = makeMaze(n);
      return { id: spec.id || ('r' + (idx + 1)), n: n, walls: walls, best: solve(walls, n, [0, 0], [n - 1, n - 1]).length - 1 };
    }

    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'mz-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood, cls) {
      say(text, mood, cls || 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1500);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'mz-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-mz-act', act);
      for (var a in attrs || {}) b.setAttribute(a, attrs[a]);
      return b;
    }
    function setActions(list, left) {
      elActs.innerHTML = '';
      list.forEach(function (b) { elActs.appendChild(b); });
      elLeft.innerHTML = '';
      (left || []).forEach(function (b) { elLeft.appendChild(b); });
    }
    function paintRounds(doneUpTo) {
      elRounds.innerHTML = '';
      plans.forEach(function (p, i) {
        var done = i < doneUpTo;
        var li = h('li', 'mz-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), p.n + '×' + p.n);
        li.setAttribute('aria-label', (i + 1) + '판 ' + p.n + '칸 미로' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function showInfo(kind) {
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var p = R.p, left = plans.length - ri - 1;
      if (kind === 'done') {
        elInfo.appendChild(h('span', 'mz-info-icon', '🎉'));
        elInfo.appendChild(h('b', 'mz-info-big', esc(fmt(T.infoDone, { n: ri + 1 }))));
        elInfo.appendChild(h('span', 'mz-info-small', esc(left ? fmt(T.infoLeft, { n: left }) : T.infoLast)));
      } else {
        elInfo.appendChild(h('span', 'mz-info-icon', '🧭'));
        elInfo.appendChild(h('b', 'mz-info-big', esc(fmt(T.infoBig, { n: p.n }))));
        elInfo.appendChild(h('span', 'mz-info-small', esc(T.infoSmall)));
      }
      elInfo.hidden = false;
    }

    /* 그리기: 바깥 테두리 + 벽, 지나온 길(점선), 길 보기 점 */
    function drawMaze() {
      var p = R.p, n = p.n;
      elBoard.style.setProperty('--n', n);
      elSvg.setAttribute('viewBox', '0 0 ' + (n * 10) + ' ' + (n * 10));
      while (elSvg.firstChild) elSvg.removeChild(elSvg.firstChild);
      elSvg.appendChild(sv('rect', { x: 0, y: 0, width: n * 10, height: n * 10, rx: 2, fill: '#2b1f7a', 'fill-opacity': 0.35 }));
      /* 출발·도착 칸 바닥 */
      elSvg.appendChild(sv('rect', { x: 1, y: 1, width: 8, height: 8, rx: 2, fill: '#ffd23f', 'fill-opacity': 0.25 }));
      elSvg.appendChild(sv('rect', { x: (n - 1) * 10 + 1, y: (n - 1) * 10 + 1, width: 8, height: 8, rx: 2, fill: '#3ddc97', 'fill-opacity': 0.3 }));
      R.trailEl = sv('polyline', { points: '', fill: 'none', stroke: '#ffd23f', 'stroke-width': 1.4, 'stroke-dasharray': '1.6 1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      elSvg.appendChild(R.trailEl);
      R.hintG = sv('g', {});
      elSvg.appendChild(R.hintG);
      var d = 'M0 0H' + n * 10 + 'V' + n * 10 + 'H0Z';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
        if (p.walls[r][c].r && c < n - 1) d += 'M' + (c + 1) * 10 + ' ' + r * 10 + 'V' + (r + 1) * 10;
        if (p.walls[r][c].b && r < n - 1) d += 'M' + c * 10 + ' ' + (r + 1) * 10 + 'H' + (c + 1) * 10;
      }
      elSvg.appendChild(sv('path', { d: d, fill: 'none', stroke: '#fff6dc', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
      elCells.innerHTML = '';
      for (var rr = 0; rr < n; rr++) for (var cc = 0; cc < n; cc++) {
        var b = h('button', 'mz-cell');
        b.type = 'button';
        b.tabIndex = -1;
        b.setAttribute('data-r', rr);
        b.setAttribute('data-c', cc);
        b.setAttribute('aria-label', (rr + 1) + '줄 ' + (cc + 1) + '칸');
        elCells.appendChild(b);
      }
      place(elGoal, n - 1, n - 1, true);
    }
    /* snap: 판이 바뀔 때는 미끄러지지 않고 바로 그 자리에 */
    function place(el, r, c, snap) {
      if (snap) el.style.transition = 'none';
      el.style.setProperty('--from', 'translate(' + (c * 100) + '%,' + (r * 100) + '%)');
      el.style.transform = 'translate(' + (c * 100) + '%,' + (r * 100) + '%)';
      if (snap) { void el.offsetWidth; el.style.transition = ''; }
    }
    function paintTrail() {
      R.trailEl.setAttribute('points', R.stack.map(function (q) { return (q[1] * 10 + 5) + ',' + (q[0] * 10 + 5); }).join(' '));
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var p = plans[i];
      R = { p: p, phase: 'ready', pos: [0, 0], stack: [[0, 0]], moves: 0, bumps: 0, backs: 0, hints: 0, bumpRun: 0, sayText: '', sayMood: 'ready' };
      paintRounds(i);
      Array.prototype.forEach.call(root.querySelectorAll('.mz-bit'), function (b) { b.remove(); });
      drawMaze();
      elGoal.classList.remove('is-got');
      place(elMe, 0, 0, true);
      paintTrail();
      elArena.classList.add('mz-off');
      elPad.hidden = true;
      showInfo('ready');
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }
    function startRun() {
      var p = R.p;
      R.phase = 'run';
      showInfo(null);
      elPad.hidden = false;
      elArena.classList.remove('mz-off');
      say(T.run, 'run');
      setActions([], [hintButton()]);
      log('game-item-ready', { itemId: p.id, size: p.n, bestSteps: p.best, engine: 'maze@' + VERSION });
      R.tStart = now();
    }
    function hintButton(call) {
      return button('🧭 ' + esc(T.hint), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A3', 'data-help-type': 'path-preview', 'data-item-id': R.p.id,
        'class': 'mz-btn is-soft' + (call ? ' is-call' : '')
      });
    }

    /* 한 칸 움직이기(가능하면 true) */
    function step(dr, dc) {
      var p = R.p, r = R.pos[0], c = R.pos[1];
      if (!open(p.walls, p.n, r, c, dr, dc)) {
        bump(dr, dc);
        return false;
      }
      var nr = r + dr, nc = c + dc, st = R.stack;
      if (st.length > 1 && st[st.length - 2][0] === nr && st[st.length - 2][1] === nc) { st.pop(); R.backs++; }
      else st.push([nr, nc]);
      R.pos = [nr, nc];
      R.moves++;
      R.bumpRun = 0;
      place(elMe, nr, nc);
      paintTrail();
      sfx('step');
      if (nr === p.n - 1 && nc === p.n - 1) arrive();
      return true;
    }
    function bump(dr, dc) {
      R.bumps++;
      R.bumpRun++;
      sfx('bump');
      elMe.style.setProperty('--bx', (dc * 18) + '%');
      elMe.style.setProperty('--by', (dr * 18) + '%');
      elMe.classList.remove('mz-bump');
      void elMe.offsetWidth;
      elMe.classList.add('mz-bump');
      sayTemp(T.bump, 'bump');
      if (R.bumpRun === 3) setActions([], [hintButton(true)]);
    }
    /* 칸을 눌렀을 때: 옆 칸이면 한 칸, 같은 줄로 곧게 이어지면 미끄러지기 */
    function goTo(r, c) {
      if (!R || R.phase !== 'run') return;
      var pr = R.pos[0], pc = R.pos[1];
      if (r === pr && c === pc) return;
      if (r !== pr && c !== pc) { sayTemp(T.far, 'bump'); return; }
      var dr = r === pr ? 0 : (r > pr ? 1 : -1), dc = c === pc ? 0 : (c > pc ? 1 : -1), dist = Math.abs(r - pr) + Math.abs(c - pc);
      for (var i = 0; i < dist; i++) {
        if (R.phase !== 'run') return;
        if (!step(dr, dc)) return;
      }
    }

    function doHint() {
      if (!R || R.phase !== 'run') return;
      var p = R.p, path = solve(p.walls, p.n, R.pos, [p.n - 1, p.n - 1]).slice(1, 1 + o.hintSteps);
      R.hints++;
      sfx('show');
      while (R.hintG.firstChild) R.hintG.removeChild(R.hintG.firstChild);
      var line = [R.pos].concat(path).map(function (q) { return (q[1] * 10 + 5) + ',' + (q[0] * 10 + 5); }).join(' ');
      R.hintG.appendChild(sv('polyline', { points: line, fill: 'none', stroke: '#4bc9dc', 'stroke-width': 1.2, 'stroke-opacity': 0.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      path.forEach(function (q, i) {
        R.hintG.appendChild(sv('circle', { cx: q[1] * 10 + 5, cy: q[0] * 10 + 5, r: 1.9 - i * 0.15, fill: '#4bc9dc' }));
      });
      say(T.hinted, 'help');
      setActions([], [hintButton()]);
      log('game-help', { itemId: p.id, helpLevel: 'A3', helpType: 'path-preview', trigger: R.bumpRun >= 3 ? 'bumps' : 'child-request', steps: path.length });
      later(function () { while (R.hintG.firstChild) R.hintG.removeChild(R.hintG.firstChild); if (R.phase === 'run') say(T.run, 'run'); }, o.hintMs);
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'mz-bit');
        var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 120;
        b.style.background = colors[i % colors.length];
        b.style.setProperty('--dx', 'calc(-50% + ' + Math.round(Math.cos(ang) * dist) + 'px)');
        b.style.setProperty('--dy', 'calc(-50% + ' + Math.round(Math.sin(ang) * dist) + 'px)');
        b.style.setProperty('--r', Math.round(Math.random() * 540) + 'deg');
        elArena.appendChild(b);
        setTimeout(function (x) { return function () { x.remove(); }; }(b), 1000);
      }
    }

    function arrive() {
      var p = R.p;
      R.phase = 'done';
      elArena.classList.add('mz-off');
      elPad.hidden = true;
      elGoal.classList.add('is-got');
      sfx('done');
      burst();
      var acc = R.hints ? 'support' : (R.bumps || R.backs ? 'self-corrected' : 'accurate');
      var ms = Math.round(now() - R.tStart);
      log('game-response', { itemId: p.id, correct: true, accuracy: acc, responseMs: ms, attempt: 1 });
      var summary = {
        itemId: p.id, size: p.n, bestSteps: p.best, moves: R.moves, bumps: R.bumps, backtracks: R.backs, hints: R.hints,
        accuracy: acc, totalMs: ms
      };
      results.push(summary);
      log('game-item-complete', summary);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(summary); } catch (e) {} }
      say(T.arrive, 'good', 'is-good');
      showInfo('done');
      var last = ri === plans.length - 1;
      setActions([button(last ? '🏁 ' + esc(T.finish) : esc(T.next) + ' ▶', last ? 'finish' : 'next')], []);
      paintRounds(ri + 1);
    }

    function finish() {
      elEnd.hidden = false;
      ri = plans.length;
      paintRounds(plans.length);
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.mz-end-line').textContent = fmt(T.endLine, { n: plans.length });
      var st = elEnd.querySelector('.mz-stamps');
      st.innerHTML = '';
      plans.forEach(function (p) { st.appendChild(h('span', 'mz-dot is-done', p.n + '×' + p.n)); });
      var acts = elEnd.querySelector('.mz-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      log('game-activity-complete', {
        rounds: plans.length,
        moves: results.reduce(function (s, r) { return s + r.moves; }, 0),
        bumps: results.reduce(function (s, r) { return s + r.bumps; }, 0),
        hints: results.reduce(function (s, r) { return s + r.hints; }, 0)
      });
      if (typeof o.onFinish === 'function') { try { o.onFinish(results.slice()); } catch (e) {} }
    }

    function restart() {
      clearTimers();
      plans = o.rounds.map(plan);
      results = [];
      elEnd.hidden = true;
      startRound(0);
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
      if (name === 'start' && R.phase === 'ready') startRun();
      else if (name === 'hint') doHint();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }
    var DIRS = { u: [-1, 0], d: [1, 0], l: [0, -1], r: [0, 1] };

    var dragging = false, eatClick = false;
    function cellAt(x, y) {
      var el = document.elementFromPoint(x, y);
      return el && el.classList && el.classList.contains('mz-cell') && root.contains(el) ? el : null;
    }
    function onDown(e) {
      if (!R || R.phase !== 'run') return;
      var c = cellAt(e.clientX, e.clientY);
      if (c) dragging = true;
    }
    function onMove(e) {
      if (!dragging || !R || R.phase !== 'run') return;
      var c = cellAt(e.clientX, e.clientY);
      if (!c) return;
      var r = +c.getAttribute('data-r'), cc = +c.getAttribute('data-c');
      var dr = r - R.pos[0], dc = cc - R.pos[1];
      if (Math.abs(dr) + Math.abs(dc) === 1) { eatClick = true; step(dr, dc); }
    }
    function onUp() { dragging = false; setTimeout(function () { eatClick = false; }, 50); }
    function onClick(e) {
      var b = e.target.closest('[data-mz-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-mz-act')); return; }
      var a = e.target.closest('.mz-arrow');
      if (a && root.contains(a)) { if (R && R.phase === 'run') { var d = DIRS[a.getAttribute('data-dir')]; step(d[0], d[1]); } return; }
      if (eatClick) return;
      var c = e.target.closest('.mz-cell');
      if (c && root.contains(c)) goTo(+c.getAttribute('data-r'), +c.getAttribute('data-c'));
    }
    function onKey(e) {
      if (!R || R.phase !== 'run' || e.repeat) return;
      var a = document.activeElement;
      if (a && a !== document.body && !root.contains(a)) return;
      var map = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r' };
      if (map[e.key]) { e.preventDefault(); var d = DIRS[map[e.key]]; step(d[0], d[1]); }
    }

    root.addEventListener('click', onClick);
    elBoard.addEventListener('pointerdown', onDown);
    global.addEventListener('pointermove', onMove);
    global.addEventListener('pointerup', onUp);
    global.addEventListener('pointercancel', onUp);
    global.addEventListener('keydown', onKey);

    restart();

    return {
      root: root,
      restart: restart,
      results: function () { return results.slice(); },
      destroy: function () {
        clearTimers(); clearTimeout(tempTimer);
        global.removeEventListener('pointermove', onMove);
        global.removeEventListener('pointerup', onUp);
        global.removeEventListener('pointercancel', onUp);
        global.removeEventListener('keydown', onKey);
        root.remove();
      }
    };
  }

  global.Maze = { version: VERSION, mount: mount };
})(window);
