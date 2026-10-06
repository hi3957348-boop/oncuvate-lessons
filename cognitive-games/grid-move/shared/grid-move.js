/*!
 * 「자리 규칙 찾기」 도형 자리 옮기기 규칙 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 4장 집행력 「규칙 찾기 3~5」(127~129쪽)
 *            (네모 칸 안 도형이 어떻게 자리를 옮기는지 살펴보고 '?'에 올 칸 고르기) — 활동 방식만 가져왔다.
 *
 * 한 문제: 2×2 칸 그림 3장이 ⇨로 이어지고 한 자리가 '?' → 아래 보기(3~4개) 가운데 맞는 칸을 누른다.
 *   규칙: rotate(도형들이 시계·반시계 방향으로 한 칸씩 돎) · grow(시계 방향으로 하나씩 늘어남) · shrink(하나씩 줄어듦)
 *   문제는 판마다 새로 만든다. 틀린 보기는 「거꾸로 돎」「두 칸 돎」「그대로」 같은 그럴듯한 실수로 만든다.
 *   누르는 순간 판정. 맞으면 '?'가 채워지고 칸들이 차례로 한 번씩 울린다.
 *   어긋나면 1번째 = 보기가 흔들리고 흐려짐 / 2번째(둘 이상 남았을 때) = 맞는 보기가 금색으로 반짝(A4).
 *   「지나온 자리」(아이가 고름, 도움 A2): 각 칸에 바로 앞 칸의 도형 자리를 점선 동그라미로 겹쳐 보여 준다.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 도형은 SVG(색은 SVG 속성에 글자값)로 그린다. 그림 파일이 필요 없다.
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 보기 칸     data-track="answer" + data-item-id + data-correct + data-response + (맞는 보기) data-accuracy
 *   - 지나온 자리 data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *     칸 상태는 네 글자(왼쪽 위 → 오른쪽 위 → 오른쪽 아래 → 왼쪽 아래, 시계 방향): . 빈칸 · S 별 · O 동그라미 · X 가위표
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '자리 규칙 찾기',
    ready: '도형이 어떻게 자리를 옮기는지 살펴봐요.',
    start: '시작',
    ask: '?에 어떤 칸이 와야 할까요?',
    miss: '다시 살펴봐요. 도형이 어느 쪽으로 움직일까요?',
    cue: '반짝이는 칸을 살펴봐요.',
    hint: '지나온 자리',
    hinted: '흐린 도형은 바로 앞 칸에서 있던 자리예요.',
    good: ['맞아요! 규칙대로 움직였어요.', '좋아요! 규칙을 찾았어요.', '그렇지요! 딱 맞아요.'],
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = { ready: 'jelly-default', ask: 'jelly-look', miss: 'jelly-thinking', help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer' };
  var NAMES = { S: '별', O: '동그라미', X: '가위표' };
  var POS = ['왼쪽 위', '오른쪽 위', '오른쪽 아래', '왼쪽 아래'];
  var CENTER = [[25, 25], [75, 25], [75, 75], [25, 75]];

  var DEFAULTS = {
    activityId: 'grid-move',
    storageKey: null,
    rounds: [],                // [ { id, rules:['rotate'], marks:1, shapes:['S'], dir:'cw'|'any', frames:4, blank:'end'|'any', choices:3, count:4 } ]
    nextMs: 1500,
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
    '.gm-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;--cream:#fff8e8;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:gm / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.gm-root *,.gm-root *::before,.gm-root *::after{box-sizing:border-box}',
    '.gm-root [hidden]{display:none!important}',
    '.gm-wrap{height:100%;display:grid;grid-template-rows:auto minmax(0,46fr) minmax(0,54fr);gap:10px;padding:12px}',

    '.gm-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.gm-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.gm-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.gm-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 8px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.gm-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.gm-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.gm-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',

    '.gm-strip{container:gmstrip / size;position:relative;min-height:0;border-radius:18px;overflow:hidden;',
    'background:radial-gradient(circle at 50% 30%,#5b48d6 0%,#3b2a9e 55%,#1b1462 100%);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.gm-row{--n:4;--aw:6cqw;position:absolute;inset:0;padding:3cqh 3cqw;display:flex;align-items:center;justify-content:center;gap:1.2cqw;',
    '--fw:min(calc((100cqw - 6cqw - (var(--n) - 1) * (var(--aw) + 2.4cqw)) / var(--n)),80cqh)}',
    '.gm-frame{position:relative;flex:none;width:var(--fw);height:var(--fw);border-radius:14px;transition:transform .12s}',
    '.gm-frame svg{display:block;width:100%;height:100%}',
    '.gm-frame.is-blank{border-radius:14px;background:rgba(255,246,214,.12);box-shadow:inset 0 0 0 3px var(--gold);display:grid;place-items:center}',
    '.gm-frame.is-blank::before{content:"?";font-size:calc(var(--fw) * .5);font-weight:900;color:var(--gold)}',
    '.gm-frame.is-filled{border-radius:16px;box-shadow:0 0 0 4px var(--mint);animation:gm-pop .4s cubic-bezier(.3,1.5,.5,1)}',
    '.gm-frame.is-beat{transform:translateY(-8%) scale(1.05)}',
    '.gm-arrow{flex:none;width:var(--aw);text-align:center;font-size:min(5cqw,16cqh);font-weight:900;color:#fff6dc;opacity:.85;line-height:1}',

    '.gm-bottom{min-height:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:stretch}',
    '.gm-left{min-width:0;display:flex;flex-direction:column;gap:8px;justify-content:center}',
    '.gm-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center}',
    '.gm-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.gm-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.gm-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.gm-coach.is-temp .gm-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.gm-coach.is-good .gm-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.gm-steps{list-style:none;margin:0;padding:0;display:flex;gap:7px}',
    '.gm-steps li{width:14px;height:14px;border-radius:50%;background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.gm-steps li.is-now{background:#fff6d6;box-shadow:inset 0 0 0 3px var(--gold)}',
    '.gm-steps li.is-done{background:var(--mint);box-shadow:none}',
    '.gm-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.gm-opts{--ow:min(30cqh,13cqw,140px);display:flex;align-items:center;justify-content:center;gap:10px;padding:6px 4px}',
    '.gm-opt{position:relative;width:var(--ow);height:var(--ow);border:0;padding:5px;margin:0;border-radius:16px;cursor:pointer;background:#fff;',
    'box-shadow:0 5px 0 var(--v3),inset 0 0 0 2px var(--v1);transition:transform .12s,opacity .2s}',
    '.gm-opt svg{display:block;width:100%;height:100%;pointer-events:none}',
    '.gm-opt:active{transform:translateY(3px);box-shadow:0 2px 0 var(--v3)}',
    '.gm-opt:focus-visible{outline:4px solid rgba(75,201,220,.8);outline-offset:3px}',
    '.gm-opt.is-gone{opacity:.3;pointer-events:none;filter:grayscale(.6)}',
    '.gm-opt.is-right{background:#effff7;box-shadow:0 5px 0 #a8dcc4,0 0 0 4px var(--mint)}',
    '.gm-opt.is-cue{animation:gm-cue 1s ease-in-out infinite}',
    '.gm-opt.is-shake{animation:gm-shake .4s}',
    '.gm-info{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:min(260px,38cqw);text-align:center;padding:10px 16px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.gm-info-icon{font-size:clamp(28px,9cqh,44px);line-height:1}',
    '.gm-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.gm-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.gm-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.gm-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.gm-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.gm-btn:focus-visible,.gm-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.gm-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.gm-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.gm-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.gm-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.gm-end-btns{display:flex;gap:8px;justify-content:center}',
    '.gm-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.gm-stamps .gm-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.gm-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.gm-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '@keyframes gm-pop{from{transform:scale(.6)}}',
    '@keyframes gm-cue{50%{box-shadow:0 5px 0 var(--v3),0 0 0 6px var(--gold),0 0 22px rgba(255,210,63,.8)}}',
    '@keyframes gm-shake{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}',

    '@container gm (max-aspect-ratio:5/4){',
    '.gm-wrap{grid-template-rows:auto minmax(0,28fr) minmax(0,72fr)}',
    '.gm-bottom{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}',
    '.gm-opts{--ow:min(19cqw,20cqh,128px);flex-wrap:wrap}}',

    '@media (prefers-reduced-motion:reduce){.gm-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('gm-style')) return;
    var s = document.createElement('style');
    s.id = 'gm-style';
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
    pick: function () { tones([740], 0.05, 'sine', 0.08); },
    miss: function () { tones([294, 262], 0.09, 'triangle', 0.1); },
    show: function () { tones([587, 698], 0.08, 'sine', 0.08); },
    note: function (f) { tones([f], 0.1, 'sine', 0.12); },
    done: function () { tones([523, 659, 784, 1047], 0.09, 'sine', 0.14); }
  };

  /* ── 칸 상태: 길이 4 배열(시계 방향 0 왼쪽위 · 1 오른쪽위 · 2 오른쪽아래 · 3 왼쪽아래), 값 '' | 'S' | 'O' | 'X' ── */
  function enc(st) { return st.map(function (v) { return v || '.'; }).join(''); }
  function rot(st, d) { var out = ['', '', '', '']; st.forEach(function (v, i) { out[((i + d) % 4 + 4) % 4] = v; }); return out; }
  function count(st) { return st.filter(Boolean).length; }

  /* 문제 만들기 */
  function makeItem(spec, id) {
    var rule = pick(spec.rules || ['rotate']), frames = spec.frames || 4, seq = [], dir = 1, i, st;
    var shapes = spec.shapes || ['S'];
    if (rule === 'rotate') {
      dir = spec.dir === 'any' ? pick([1, -1]) : (spec.dir === 'ccw' ? -1 : 1);
      var k = Math.max(1, Math.min(spec.marks || 1, 3));
      for (var tries = 0; tries < 30; tries++) {
        st = ['', '', '', ''];
        var cells = shuffle([0, 1, 2, 3]).slice(0, k);
        cells.forEach(function (c, j) { st[c] = shapes[j % shapes.length]; });
        /* 돌려도 똑같아 보이면(규칙이 안 보이면) 다시 */
        if (enc(rot(st, 1)) !== enc(st)) break;
      }
      seq.push(st);
      for (i = 1; i < frames; i++) seq.push(rot(seq[i - 1], dir));
    } else {
      /* grow: 시계 방향으로 하나씩 늘어남 / shrink: 그 거꾸로 */
      var p = Math.floor(Math.random() * 4), sh = shapes[0], full = [];
      st = ['', '', '', ''];
      for (i = 0; i < 4; i++) { st[(p + i) % 4] = sh; full.push(st.slice()); }
      seq = rule === 'grow' ? full.slice(4 - frames) : full.slice().reverse().slice(0, frames);
      if (rule === 'grow' && frames < 4) seq = full.slice(0, frames);
    }
    var blank = frames - 1;
    if (spec.blank === 'any' && Math.random() < 0.5) blank = 1 + Math.floor(Math.random() * (frames - 1));
    var ans = seq[blank];
    var prev = blank > 0 ? seq[blank - 1] : null;

    /* 그럴듯한 실수 보기 */
    var cands = [];
    if (rule === 'rotate' && prev) {
      cands.push({ st: rot(prev, -dir), why: 'reverse' });
      cands.push({ st: rot(prev, 2 * dir), why: 'double' });
      cands.push({ st: prev.slice(), why: 'same' });
    } else if (prev) {
      cands.push({ st: prev.slice(), why: 'same' });
    }
    /* 한 도형만 다른 자리로 · 하나 더 · 하나 덜 · 두 도형 바꾸기 — 모두 만들어 섞는다 */
    var filled = [], empty = [], more = [];
    ans.forEach(function (v, j) { (v ? filled : empty).push(j); });
    filled.forEach(function (a) {
      empty.forEach(function (b) { var m = ans.slice(); m[b] = m[a]; m[a] = ''; more.push(m); });
      if (filled.length > 1) { var m2 = ans.slice(); m2[a] = ''; more.push(m2); }
    });
    empty.forEach(function (b) { shapes.forEach(function (sh) { var m = ans.slice(); m[b] = sh; more.push(m); }); });
    for (var x1 = 0; x1 < filled.length; x1++) for (var x2 = x1 + 1; x2 < filled.length; x2++) {
      if (ans[filled[x1]] === ans[filled[x2]]) continue;
      var m3 = ans.slice(); m3[filled[x1]] = ans[filled[x2]]; m3[filled[x2]] = ans[filled[x1]]; more.push(m3);
    }
    shuffle(more).forEach(function (m) { cands.push({ st: m, why: 'other' }); });
    var want = Math.max(2, spec.choices || 4), opts = [{ st: ans, why: 'answer' }], seen = {};
    seen[enc(ans)] = 1;
    cands.forEach(function (c) {
      if (opts.length >= want || seen[enc(c.st)] || !count(c.st)) return;
      seen[enc(c.st)] = 1;
      opts.push(c);
    });
    return { id: id, rule: rule, dir: dir, seq: seq, blank: blank, answer: enc(ans), options: shuffle(opts) };
  }

  /* SVG 한 칸 그리기 */
  function shapeSvg(v, cx, cy, s) {
    if (v === 'S') {
      var pts = [];
      for (var i = 0; i < 10; i++) {
        var r = i % 2 ? s * 0.46 : s, a = -Math.PI / 2 + i * Math.PI / 5;
        pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
      }
      return '<polygon points="' + pts.join(' ') + '" fill="#ffc233" stroke="#d98e00" stroke-width="2" stroke-linejoin="round"/>';
    }
    if (v === 'O') return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (s * 0.78) + '" fill="none" stroke="#3a86ff" stroke-width="6"/>';
    if (v === 'X') {
      var d = s * 0.68;
      return '<path d="M' + (cx - d) + ' ' + (cy - d) + 'L' + (cx + d) + ' ' + (cy + d) + 'M' + (cx + d) + ' ' + (cy - d) + 'L' + (cx - d) + ' ' + (cy + d) + '" stroke="#ef476f" stroke-width="7" stroke-linecap="round"/>';
    }
    return '';
  }
  function gridSvg(st, ghost) {
    var s = '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<rect x="2" y="2" width="96" height="96" rx="12" fill="#fff8e8" stroke="#d9cfa8" stroke-width="2"/>' +
      '<path d="M50 8V92M8 50H92" stroke="#ece2c6" stroke-width="2" stroke-linecap="round"/>';
    if (ghost) ghost.forEach(function (v, i) {
      if (v) s += '<rect x="' + (CENTER[i][0] - 20) + '" y="' + (CENTER[i][1] - 20) + '" width="40" height="40" rx="8" fill="#e9f8fa" stroke="#2cb7cb" stroke-width="2" stroke-dasharray="4 3"/>' +
        '<g opacity="0.3">' + shapeSvg(v, CENTER[i][0], CENTER[i][1], 13) + '</g>';
    });
    st.forEach(function (v, i) { s += shapeSvg(v, CENTER[i][0], CENTER[i][1], 15); });
    return s + '</svg>';
  }
  function say4(st) {
    var parts = [];
    st.forEach(function (v, i) { if (v) parts.push(POS[i] + ' ' + NAMES[v]); });
    return parts.length ? parts.join(', ') : '빈칸';
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

    var soundOn = o.sound;
    try { var svv = sessionStorage.getItem(storeKey + 'sound'); if (svv !== null) soundOn = svv === '1'; } catch (e) {}
    function sfx(name, arg) { if (soundOn) SFX[name](arg); }

    function log(type, detail) {
      var d = { type: type, schemaVersion: '0.2', activityId: o.activityId };
      for (var key in detail) d[key] = detail[key];
      try { global.dispatchEvent(new CustomEvent('oncuvate:log', { detail: d })); } catch (e) {}
      if (o.debug && global.console) console.log('[oncuvate:log]', d);
    }
    function coachSrc(mood) { return o.coachBase ? o.coachBase + COACH[mood] + o.coachExt : ''; }
    if (o.coachBase) Object.keys(COACH).forEach(function (m) { var im = new Image(); im.src = coachSrc(m); });

    var root = h('div', 'gm-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="gm-wrap">' +
        '<div class="gm-top">' +
          '<span class="gm-title">' + esc(T.title) + '</span>' +
          '<ol class="gm-rounds" aria-label="판"></ol>' +
          '<button type="button" class="gm-sound" data-gm-act="sound"></button>' +
        '</div>' +
        '<div class="gm-strip"><div class="gm-row" role="list" aria-label="도형 칸 줄"></div></div>' +
        '<div class="gm-bottom">' +
          '<div class="gm-left">' +
            '<div class="gm-coach' + (o.coachBase ? '' : ' no-img') + '">' +
              (o.coachBase ? '<img class="gm-coach-img" alt="" aria-hidden="true">' : '') +
              '<p class="gm-bubble" aria-live="polite"></p>' +
            '</div>' +
            '<ol class="gm-steps" aria-label="문제"></ol>' +
            '<div class="gm-actions"></div>' +
          '</div>' +
          '<div class="gm-opts" role="group" aria-label="보기"></div>' +
        '</div>' +
      '</div>' +
      '<section class="gm-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="gm-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="gm-end-line"></p><div class="gm-stamps"></div><div class="gm-end-btns"></div>' +
        (o.credit ? '<p class="gm-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'gm-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.gm-rounds'), elSound = $('.gm-sound'), elRow = $('.gm-row'), elOpts = $('.gm-opts'),
        elCoach = $('.gm-coach'), elCoachImg = $('.gm-coach-img'), elBubble = $('.gm-bubble'), elSteps = $('.gm-steps'),
        elActs = $('.gm-actions'), elEnd = $('.gm-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var rounds = [], R = null, ri = 0, results = [], timers = [], tempTimer = null;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'gm-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood) {
      say(text, mood, 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1600);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'gm-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-gm-act', act);
      for (var a in attrs || {}) b.setAttribute(a, attrs[a]);
      return b;
    }
    function setActions(list) {
      elActs.innerHTML = '';
      list.forEach(function (b) { elActs.appendChild(b); });
    }
    function paintRounds(doneUpTo) {
      elRounds.innerHTML = '';
      rounds.forEach(function (r, i) {
        var done = i < doneUpTo;
        var li = h('li', 'gm-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), (i + 1) + '판');
        li.setAttribute('aria-label', (i + 1) + '판' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function paintSteps() {
      elSteps.innerHTML = '';
      for (var i = 0; i < R.r.count; i++) {
        elSteps.appendChild(h('li', i < R.qi ? 'is-done' : (i === R.qi && R.phase !== 'ready' && R.phase !== 'round-done' ? 'is-now' : '')));
      }
    }
    function info(icon, big, small) {
      elOpts.innerHTML = '';
      var d = h('div', 'gm-info');
      d.appendChild(h('span', 'gm-info-icon', icon));
      d.appendChild(h('b', 'gm-info-big', esc(big)));
      if (small) d.appendChild(h('span', 'gm-info-small', esc(small)));
      elOpts.appendChild(d);
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var r = rounds[i];
      R = { r: r, qi: 0, phase: 'ready', sayText: '', sayMood: 'ready', tally: { accurate: 0, 'self-corrected': 0, support: 0 } };
      paintRounds(i);
      paintSteps();
      R.it = makeItem(r, r.id + '-1');
      drawRow(R.it, false);
      info('🧭', (i + 1) + '판', r.count + '문제를 풀어요');
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    function drawRow(it, ghosts) {
      elRow.style.setProperty('--n', it.seq.length);
      elRow.innerHTML = '';
      it.seq.forEach(function (st, i) {
        if (i) elRow.appendChild(h('span', 'gm-arrow', '⇨'));
        var f = h('div', 'gm-frame' + (i === it.blank ? ' is-blank' : ''));
        f.setAttribute('role', 'listitem');
        f.setAttribute('aria-label', i === it.blank ? '빈칸' : say4(st));
        if (i !== it.blank) f.innerHTML = gridSvg(st, ghosts && i > 0 && i - 1 !== it.blank ? it.seq[i - 1] : null);
        elRow.appendChild(f);
      });
    }

    function ask() {
      var it = R.it;
      R.phase = 'pick';
      R.miss = 0; R.helps = 0; R.hintUsed = false; R.cued = false;
      R.tAsk = now();
      elOpts.innerHTML = '';
      it.options.forEach(function (op) {
        var b = h('button', 'gm-opt', gridSvg(op.st));
        b.type = 'button';
        b.setAttribute('data-state', enc(op.st));
        b.setAttribute('data-why', op.why);
        b.setAttribute('aria-label', say4(op.st));
        elOpts.appendChild(b);
      });
      tagOpts();
      paintSteps();
      say(T.ask, 'ask');
      setActions([hintButton()]);
      log('game-item-ready', {
        itemId: it.id, rule: it.rule, dir: it.dir === 1 ? 'cw' : 'ccw', frames: it.seq.map(enc).join('|'), blankIndex: it.blank,
        answer: it.answer, options: it.options.map(function (x) { return enc(x.st); }).join('|'), engine: 'grid-move@' + VERSION
      });
    }
    function accNow() { return R.helps ? 'support' : (R.miss ? 'self-corrected' : 'accurate'); }
    function tagOpts() {
      Array.prototype.forEach.call(elOpts.querySelectorAll('.gm-opt'), function (b) {
        var st = b.getAttribute('data-state'), right = st === R.it.answer;
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', R.it.id);
        b.setAttribute('data-response', st);
        b.setAttribute('data-correct', right ? 'true' : 'false');
        if (right) b.setAttribute('data-accuracy', accNow()); else b.removeAttribute('data-accuracy');
      });
    }
    function hintButton() {
      var b = button('👣 ' + esc(T.hint), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'ghost-previous', 'data-item-id': R.it.id
      });
      if (R.hintUsed) b.hidden = true;
      return b;
    }

    function onOpt(b) {
      if (!R || R.phase !== 'pick' || b.classList.contains('is-gone')) return;
      var st = b.getAttribute('data-state'), it = R.it, t = now();
      if (st === it.answer) {
        var acc = accNow();
        log('game-response', { itemId: it.id, response: st, correct: true, attempt: R.miss + 1, accuracy: acc, responseMs: Math.round(t - R.tAsk) });
        solved(b, acc);
        return;
      }
      R.miss++;
      sfx('miss');
      log('game-response', { itemId: it.id, response: st, correct: false, attempt: R.miss, errorType: b.getAttribute('data-why'), responseMs: Math.round(t - R.tAsk) });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake', 'is-gone');
      later(function () { b.classList.remove('is-shake'); }, 380);
      var left = Array.prototype.filter.call(elOpts.querySelectorAll('.gm-opt'), function (x) { return !x.classList.contains('is-gone'); });
      if (R.miss >= 2 && !R.cued && left.length > 1) {
        R.cued = true;
        R.helps++;
        var r = elOpts.querySelector('[data-state="' + it.answer + '"]');
        if (r) r.classList.add('is-cue');
        log('game-help', { itemId: it.id, helpLevel: 'A4', helpType: 'cue-answer', trigger: 'second-miss' });
        say(T.cue, 'help');
      } else {
        sayTemp(T.miss, 'miss');
      }
      tagOpts();
    }

    function solved(b, acc) {
      var it = R.it;
      R.phase = 'play';
      b.classList.remove('is-cue');
      b.classList.add('is-right');
      Array.prototype.forEach.call(elOpts.querySelectorAll('.gm-opt'), function (x) { if (x !== b) x.classList.add('is-gone'); });
      var frames = elRow.querySelectorAll('.gm-frame'), f = frames[it.blank];
      f.classList.remove('is-blank');
      f.classList.add('is-filled');
      f.innerHTML = gridSvg(it.seq[it.blank]);
      setActions([]);
      say(pick(T.good), 'good', 'is-good');
      R.tally[acc]++;
      var summary = { itemId: it.id, rule: it.rule, accuracy: acc, misses: R.miss, helps: R.helps, hint: R.hintUsed, totalMs: Math.round(now() - R.tAsk) };
      results.push(summary);
      log('game-item-complete', summary);
      var list = Array.prototype.slice.call(frames), step = 260, notes = [523, 587, 659, 784, 880];
      list.forEach(function (c, i) {
        later(function () {
          list.forEach(function (x) { x.classList.remove('is-beat'); });
          c.classList.add('is-beat');
          sfx('note', notes[i % notes.length]);
        }, 300 + i * step);
      });
      later(function () {
        list.forEach(function (x) { x.classList.remove('is-beat'); });
        R.qi++;
        paintSteps();
        if (R.qi < R.r.count) {
          R.it = makeItem(R.r, R.r.id + '-' + (R.qi + 1));
          drawRow(R.it, false);
          ask();
        } else roundDone();
      }, 300 + list.length * step + o.nextMs);
    }

    function roundDone() {
      R.phase = 'round-done';
      paintSteps();
      sfx('done');
      var left = rounds.length - ri - 1;
      info('🎉', fmt(T.infoDone, { n: ri + 1 }), left ? fmt(T.infoLeft, { n: left }) : T.infoLast);
      var sum = { roundId: R.r.id, items: R.r.count, accurate: R.tally.accurate, selfCorrected: R.tally['self-corrected'], support: R.tally.support };
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(sum); } catch (e) {} }
      var last = ri === rounds.length - 1;
      setActions([button(last ? '🏁 ' + esc(T.finish) : esc(T.next) + ' ▶', last ? 'finish' : 'next')]);
      paintRounds(ri + 1);
    }

    function doHint() {
      if (!R || R.phase !== 'pick' || R.hintUsed) return;
      var it = R.it;
      R.hintUsed = true;
      R.helps++;
      sfx('show');
      drawRow(it, true);
      say(T.hinted, 'help');
      setActions([hintButton()]);
      tagOpts();
      log('game-help', { itemId: it.id, helpLevel: 'A2', helpType: 'ghost-previous', trigger: 'child-request' });
    }

    function finish() {
      elEnd.hidden = false;
      ri = rounds.length;
      paintRounds(rounds.length);
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.gm-end-line').textContent = fmt(T.endLine, { n: rounds.length });
      var st = elEnd.querySelector('.gm-stamps');
      st.innerHTML = '';
      rounds.forEach(function (r, i) { st.appendChild(h('span', 'gm-dot is-done', (i + 1) + '판')); });
      var acts = elEnd.querySelector('.gm-end-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      var tally = { accurate: 0, 'self-corrected': 0, support: 0 };
      results.forEach(function (r) { tally[r.accuracy]++; });
      log('game-activity-complete', { rounds: rounds.length, items: results.length, accurate: tally.accurate, selfCorrected: tally['self-corrected'], support: tally.support });
      if (typeof o.onFinish === 'function') { try { o.onFinish(results.slice()); } catch (e) {} }
    }

    function restart() {
      clearTimers();
      rounds = o.rounds.map(function (r, i) {
        var x = {};
        for (var key in r) x[key] = r[key];
        x.id = r.id || ('r' + (i + 1));
        x.count = r.count || 4;
        return x;
      });
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
      if (name === 'start' && R.phase === 'ready') ask();
      else if (name === 'hint') doHint();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-gm-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-gm-act')); return; }
      var c = e.target.closest('.gm-opt');
      if (c && root.contains(c)) onOpt(c);
    }
    root.addEventListener('click', onClick);

    restart();

    return {
      root: root,
      restart: restart,
      results: function () { return results.slice(); },
      destroy: function () { clearTimers(); clearTimeout(tempTimer); root.remove(); }
    };
  }

  global.GridMove = { version: VERSION, mount: mount, makeItem: makeItem };
})(window);
