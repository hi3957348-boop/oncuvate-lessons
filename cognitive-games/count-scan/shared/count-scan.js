/*!
 * 「몇 개일까?」 계획하고 세기 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 4장 집행력 「문제해결 1~2」(141~142쪽)
 *            (먼저 훑어보고 어떤 방법으로 셀지 계획한 뒤, 그림 가운데 같은 것을 빠짐없이 세기) — 활동 방식만 가져왔다.
 *
 * 한 문제: 판에 그림·기호가 가득 → 오른쪽에 찾을 것(예: 고양이).
 *   준비: 「먼저 훑어보고 어떻게 셀지 생각해요」 → 아이가 「세기 시작」을 누른다(계획할 시간, 시간 제한 없음).
 *   세기: 찾을 것을 누르면 1, 2, 3 … 번호표가 붙는다(센 것을 표시해 두 번 세지 않게). 다른 그림은 흔들림.
 *   다 찾으면 저절로 끝 → 「고양이는 모두 6마리! 마지막 번호가 모두의 수예요」.
 *   「줄 짚기」(아이가 고름, 도움 A2): 아직 못 찾은 것이 있는 첫 줄을 띠로 밝혀 준다(한 줄씩 세는 방법).
 *   다른 그림을 잇달아 2번 누르면 남은 것 하나가 금색으로 반짝(A4).
 *   기록에는 찾은 차례가 줄 순서(왼쪽 위 → 오른쪽 아래)를 얼마나 따랐는지(orderedRatio)를 남긴다 = 계획한 세기의 흔적.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 판의 칸     data-track="answer" + data-item-id + data-correct + data-response + (찾을 것) data-accuracy
 *   - 줄 짚기     data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '몇 개일까?',
    ready: '먼저 판을 훑어보고, 어떻게 셀지 생각해요. 준비되면 「세기 시작」!',
    start: '세기 시작',
    begin: '시작',
    ask: '{x} 찾아 하나씩 눌러요. 누르면 번호가 붙어요.',
    miss: '그건 {x}{가} 아니에요.',
    cue: '반짝이는 것을 살펴봐요.',
    hint: '줄 짚기',
    hinted: '빛나는 줄을 왼쪽부터 살펴봐요.',
    found: '{n}',
    done: '{x} 모두 {n}{u}! 마지막 번호가 모두의 수예요.',
    target: '찾을 것',
    counted: '센 수',
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

  /* 기호(그림 파일 없이 쓰는 것) */
  var SHAPE = {
    star: '<polygon points="20,4 24.7,14.6 36,15.5 27.4,23 30,34 20,28.2 10,34 12.6,23 4,15.5 15.3,14.6" fill="#f59e0b"/>',
    heart: '<path d="M20 34C8 25 4 19 4 13.5 4 8.8 7.8 5 12.3 5c3.4 0 6.1 1.9 7.7 4.6C21.6 6.9 24.3 5 27.7 5 32.2 5 36 8.8 36 13.5 36 19 32 25 20 34Z" fill="#ef476f"/>',
    tri: '<polygon points="20,5 36,33 4,33" fill="#3a86ff"/>',
    square: '<rect x="7" y="7" width="26" height="26" rx="4" fill="#16a06a"/>',
    circle: '<circle cx="20" cy="20" r="14" fill="#8b5cf6"/>',
    diamond: '<polygon points="20,3 36,20 20,37 4,20" fill="#ec4899"/>',
    moon: '<path d="M26 4a16 16 0 1 0 10 25A13 13 0 0 1 26 4Z" fill="#eab308"/>',
    star2: '<polygon points="20,4 24.7,14.6 36,15.5 27.4,23 30,34 20,28.2 10,34 12.6,23 4,15.5 15.3,14.6" fill="#94a3b8"/>'
  };

  var DEFAULTS = {
    activityId: 'count-scan',
    storageKey: null,
    things: {},                // { key: { label, img | shape | emoji, unit } }
    rounds: [],                // [ { id, size, items: [ { id, target, count, others:[key…] } ] } ]
    nextMs: 1900,
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
    '.cs-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;--cream:#fff8e8;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:cs / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.cs-root *,.cs-root *::before,.cs-root *::after{box-sizing:border-box}',
    '.cs-root [hidden]{display:none!important}',
    '.cs-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    '.cs-arena{container:csarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.cs-grid{--n:5;position:absolute;inset:0;padding:3cqmin;display:grid;gap:1.4cqmin;',
    'grid-template-columns:repeat(var(--n),minmax(0,1fr));grid-template-rows:repeat(var(--n),minmax(0,1fr))}',
    '.cs-row-band{position:absolute;left:1.5cqmin;right:1.5cqmin;border-radius:10px;background:rgba(75,201,220,.28);box-shadow:0 0 0 3px #4bc9dc;pointer-events:none;z-index:0}',
    '.cs-cell{position:relative;z-index:1;min-width:0;min-height:0;border:0;margin:0;padding:10%;border-radius:10px;cursor:pointer;',
    'background:var(--cream);box-shadow:0 3px 0 #d9cfa8;display:grid;place-items:center;transition:transform .12s}',
    '.cs-cell img,.cs-cell svg{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}',
    '.cs-cell .cs-emo{font-size:calc(var(--cell,60px) * .55);line-height:1}',
    '.cs-cell:active{transform:translateY(2px)}',
    '.cs-cell:focus-visible{outline:4px solid rgba(75,201,220,.8);outline-offset:2px}',
    '.cs-cell.is-got{background:#effff7;box-shadow:0 3px 0 #a8dcc4,0 0 0 3px var(--mint)}',
    '.cs-badge{position:absolute;right:-4px;top:-4px;min-width:calc(var(--cell,60px) * .42);height:calc(var(--cell,60px) * .42);padding:0 3px;border-radius:999px;',
    'display:grid;place-items:center;background:#16a06a;color:#fff;font-weight:900;font-size:calc(var(--cell,60px) * .26);line-height:1;',
    'box-shadow:0 0 0 2px #fff;animation:cs-pop .35s cubic-bezier(.3,1.5,.5,1)}',
    '.cs-cell.is-cue{animation:cs-cue 1s ease-in-out infinite}',
    '.cs-cell.is-shake{animation:cs-shake .4s}',
    '.cs-off .cs-cell{cursor:default}',

    '.cs-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.cs-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.cs-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.cs-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.cs-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 8px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.cs-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.cs-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.cs-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.cs-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(52px,15cqh,72px)}',
    '.cs-coach-img{width:clamp(44px,13cqh,62px);height:clamp(44px,13cqh,62px);object-fit:contain}',
    '.cs-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.cs-bubble{margin:0;padding:9px 12px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,3.8cqh,17px);font-weight:800;line-height:1.4}',
    '.cs-coach.is-temp .cs-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.cs-coach.is-good .cs-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.cs-steps{list-style:none;margin:0;padding:0;display:flex;justify-content:center;gap:7px}',
    '.cs-steps li{width:14px;height:14px;border-radius:50%;background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.cs-steps li.is-now{background:#fff6d6;box-shadow:inset 0 0 0 3px var(--gold)}',
    '.cs-steps li.is-done{background:var(--mint);box-shadow:none}',
    '.cs-panel{container:cspanel / size;flex:1 1 auto;min-height:0;position:relative;border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.cs-panel-in{position:absolute;inset:0;padding:8px 12px;display:flex;align-items:center;justify-content:center;gap:6cqw}',
    '.cs-box{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.cs-box small{font-size:clamp(12px,9cqh,15px);font-weight:800;color:var(--muted)}',
    '.cs-tcard{width:min(52cqh,120px);height:min(52cqh,120px);padding:10%;border-radius:16px;background:var(--cream);box-shadow:0 4px 0 #d9cfa8,0 0 0 4px var(--gold);display:grid;place-items:center}',
    '.cs-tcard img,.cs-tcard svg{width:100%;height:100%;object-fit:contain;display:block}',
    '.cs-tcard .cs-emo{font-size:min(30cqh,64px);line-height:1}',
    '.cs-tname{font-size:clamp(15px,11cqh,20px);font-weight:900;color:var(--v8)}',
    '.cs-count{font-size:min(40cqh,72px);font-weight:900;color:#16a06a;line-height:1;font-variant-numeric:tabular-nums}',
    '.cs-info-icon{font-size:clamp(28px,24cqh,44px);line-height:1}',
    '.cs-info-big{font-size:clamp(18px,15cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.cs-info-small{font-size:clamp(13px,10cqh,16px);font-weight:700;color:var(--muted);text-align:center}',
    '.cs-col{display:flex;flex-direction:column;align-items:center;gap:4px}',

    '.cs-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.cs-left{display:flex;gap:8px;margin-right:auto}',
    '.cs-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.cs-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 16px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.cs-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.cs-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.cs-btn:focus-visible,.cs-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.cs-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.cs-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.cs-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.cs-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.cs-end .cs-btns{margin:0;justify-content:center}',
    '.cs-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.cs-stamps .cs-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.cs-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.cs-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '@keyframes cs-pop{from{transform:scale(.3)}}',
    '@keyframes cs-cue{50%{box-shadow:0 3px 0 #d9cfa8,0 0 0 4px var(--gold),0 0 18px rgba(255,210,63,.85)}}',
    '@keyframes cs-shake{20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}',

    '@container cs (max-aspect-ratio:5/4){',
    '.cs-wrap{--arena:min(calc(100cqw - 24px),56cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.cs-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.cs-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('cs-style')) return;
    var s = document.createElement('style');
    s.id = 'cs-style';
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
  /* 받침 있으면 a, 없으면 b */
  function jo(word, a, b) {
    var c = String(word).charCodeAt(String(word).length - 1);
    if (c < 0xac00 || c > 0xd7a3) return b;
    return (c - 0xac00) % 28 ? a : b;
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
    count: function (k) { tones([440 * Math.pow(2, Math.min(k, 14) / 12)], 0.07, 'sine', 0.11); },
    miss: function () { tones([294, 262], 0.09, 'triangle', 0.1); },
    show: function () { tones([587, 698], 0.08, 'sine', 0.08); },
    done: function () { tones([523, 659, 784, 1047], 0.09, 'sine', 0.14); }
  };

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
    function thing(key) { return o.things[key] || { label: key }; }
    function face(key) {
      var t = thing(key);
      if (t.img) return '<img alt="" src="' + esc(t.img) + '">';
      if (t.shape) return '<svg viewBox="0 0 40 40" aria-hidden="true">' + (SHAPE[t.shape] || '') + '</svg>';
      return '<span class="cs-emo">' + esc(t.emoji || '❔') + '</span>';
    }

    var root = h('div', 'cs-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="cs-wrap">' +
        '<div class="cs-arena cs-off"><div class="cs-grid" role="group" aria-label="그림 판"></div></div>' +
        '<aside class="cs-side">' +
          '<div class="cs-top">' +
            '<span class="cs-title">' + esc(T.title) + '</span>' +
            '<ol class="cs-rounds" aria-label="판"></ol>' +
            '<button type="button" class="cs-sound" data-cs-act="sound"></button>' +
          '</div>' +
          '<div class="cs-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="cs-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="cs-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<ol class="cs-steps" aria-label="문제"></ol>' +
          '<div class="cs-panel"><div class="cs-panel-in"></div></div>' +
          '<div class="cs-actions"><div class="cs-left"></div><div class="cs-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="cs-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="cs-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="cs-end-line"></p><div class="cs-stamps"></div><div class="cs-btns"></div>' +
        (o.credit ? '<p class="cs-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'cs-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.cs-rounds'), elSound = $('.cs-sound'), elArena = $('.cs-arena'), elGrid = $('.cs-grid'),
        elCoach = $('.cs-coach'), elCoachImg = $('.cs-coach-img'), elBubble = $('.cs-bubble'), elSteps = $('.cs-steps'),
        elPanel = $('.cs-panel-in'), elLeft = $('.cs-left'), elActs = $('.cs-side .cs-btns'), elEnd = $('.cs-end');

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
      elCoach.className = 'cs-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood) {
      say(text, mood, 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1400);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'cs-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-cs-act', act);
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
      rounds.forEach(function (r, i) {
        var done = i < doneUpTo;
        var li = h('li', 'cs-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), (i + 1) + '판');
        li.setAttribute('aria-label', (i + 1) + '판' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function paintSteps() {
      elSteps.innerHTML = '';
      R.r.items.forEach(function (it, i) {
        elSteps.appendChild(h('li', i < R.qi ? 'is-done' : (i === R.qi && R.phase !== 'ready' && R.phase !== 'round-done' ? 'is-now' : '')));
      });
    }
    function panelInfo(icon, big, small) {
      elPanel.innerHTML = '';
      var c = h('div', 'cs-col');
      c.appendChild(h('span', 'cs-info-icon', icon));
      c.appendChild(h('b', 'cs-info-big', esc(big)));
      if (small) c.appendChild(h('span', 'cs-info-small', esc(small)));
      elPanel.appendChild(c);
    }
    function panelTarget() {
      var t = thing(R.it.target);
      elPanel.innerHTML = '';
      var a = h('div', 'cs-box');
      a.appendChild(h('small', '', esc(T.target)));
      a.appendChild(h('div', 'cs-tcard', face(R.it.target)));
      a.appendChild(h('b', 'cs-tname', esc(t.label)));
      elPanel.appendChild(a);
      if (R.phase !== 'look') {
        var b = h('div', 'cs-box');
        b.appendChild(h('small', '', esc(T.counted)));
        b.appendChild(h('b', 'cs-count', String(R.found.length)));
        elPanel.appendChild(b);
      }
    }

    /* 판 만들기: 찾을 것 count개 + 나머지는 others에서 */
    function buildGrid(it, n) {
      var total = n * n, cnt = Math.max(1, Math.min(it.count, total - 1));
      var others = (it.others || []).filter(function (x) { return x !== it.target; });
      var cells = [];
      for (var i = 0; i < cnt; i++) cells.push(it.target);
      while (cells.length < total) cells.push(others.length ? pick(others) : '?');
      return shuffle(cells);
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var r = rounds[i];
      R = { r: r, qi: 0, phase: 'ready', sayText: '', sayMood: 'ready', tally: { accurate: 0, 'self-corrected': 0, support: 0 } };
      paintRounds(i);
      paintSteps();
      elGrid.innerHTML = '';
      elArena.classList.add('cs-off');
      panelInfo('🔎', (i + 1) + '판 · ' + r.size + '×' + r.size, r.items.length + '번 세어요');
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.begin), 'begin')]);
    }

    /* 문제 보여 주기(훑어보기 단계) */
    function show() {
      var r = R.r, it = r.items[R.qi], n = r.size;
      R.it = it;
      R.cells = buildGrid(it, n);
      R.found = []; R.misses = 0; R.missRun = 0; R.helps = 0; R.hintUsed = 0; R.cued = false;
      R.phase = 'look';
      R.tLook = now();
      elGrid.style.setProperty('--n', n);
      elGrid.innerHTML = '';
      R.cells.forEach(function (key, idx) {
        var b = h('button', 'cs-cell', face(key));
        b.type = 'button';
        b.setAttribute('data-key', key);
        b.setAttribute('data-idx', idx);
        b.setAttribute('aria-label', thing(key).label);
        elGrid.appendChild(b);
      });
      var cell = Math.min(elGrid.clientWidth, elGrid.clientHeight) / n;
      elGrid.style.setProperty('--cell', Math.round(cell) + 'px');
      elArena.classList.add('cs-off');
      paintSteps();
      panelTarget();
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')], []);
      log('game-item-ready', {
        itemId: it.id, target: it.target, count: R.cells.filter(function (x) { return x === it.target; }).length,
        size: n, layout: R.cells.map(function (x) { return x === it.target ? 1 : 0; }).join(''), engine: 'count-scan@' + VERSION
      });
    }
    function startCount() {
      R.phase = 'count';
      R.lookMs = Math.round(now() - R.tLook);
      R.tAsk = R.tStart = now();
      elArena.classList.remove('cs-off');
      panelTarget();
      var t = thing(R.it.target);
      say(fmt(T.ask, { x: t.label + jo(t.label, '을', '를') }), 'ask');
      setActions([], [hintButton()]);
      tagCells();
    }
    function remaining() {
      return Array.prototype.filter.call(elGrid.querySelectorAll('.cs-cell'), function (c) {
        return c.getAttribute('data-key') === R.it.target && !c.classList.contains('is-got');
      });
    }
    function accNow() { return R.helps ? 'support' : (R.misses ? 'self-corrected' : 'accurate'); }
    function tagCells() {
      Array.prototype.forEach.call(elGrid.querySelectorAll('.cs-cell'), function (b) {
        if (b.classList.contains('is-got')) { b.removeAttribute('data-track'); return; }
        var right = b.getAttribute('data-key') === R.it.target;
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', R.it.id);
        b.setAttribute('data-response', thing(b.getAttribute('data-key')).label);
        b.setAttribute('data-correct', right ? 'true' : 'false');
        if (right) b.setAttribute('data-accuracy', accNow()); else b.removeAttribute('data-accuracy');
      });
    }
    function hintButton() {
      return button('📏 ' + esc(T.hint), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'row-guide', 'data-item-id': R.it.id
      });
    }
    function clearBand() {
      var b = elGrid.querySelector('.cs-row-band');
      if (b) b.remove();
    }

    function onCell(b) {
      if (!R || R.phase !== 'count' || b.classList.contains('is-got')) return;
      var key = b.getAttribute('data-key'), it = R.it, t = now(), idx = +b.getAttribute('data-idx');
      if (key === it.target) {
        R.found.push(idx);
        R.missRun = 0;
        b.classList.remove('is-cue');
        b.classList.add('is-got');
        b.appendChild(h('span', 'cs-badge', String(R.found.length)));
        sfx('count', R.found.length);
        log('game-response', { itemId: it.id, response: key, correct: true, index: idx, order: R.found.length, accuracy: accNow(), responseMs: Math.round(t - R.tAsk) });
        R.tAsk = t;
        var band = elGrid.querySelector('.cs-row-band');
        if (band && !remaining().some(function (c) { return Math.floor(+c.getAttribute('data-idx') / R.r.size) === +band.getAttribute('data-row'); })) clearBand();
        panelTarget();
        if (!remaining().length) { done(); return; }
        tagCells();
        return;
      }
      R.misses++;
      R.missRun++;
      sfx('miss');
      var tt = thing(it.target);
      log('game-response', { itemId: it.id, response: key, correct: false, index: idx, errorType: 'not-target', responseMs: Math.round(t - R.tAsk) });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake');
      later(function () { b.classList.remove('is-shake'); }, 420);
      if (R.missRun >= 2 && !R.cued) {
        R.cued = true;
        R.helps++;
        var rest = remaining();
        if (rest.length) rest[0].classList.add('is-cue');
        log('game-help', { itemId: it.id, helpLevel: 'A4', helpType: 'cue-one', trigger: 'second-miss' });
        say(T.cue, 'help');
      } else {
        sayTemp(fmt(T.miss, { x: tt.label, '가': jo(tt.label, '이', '가') }), 'miss');
      }
      tagCells();
    }

    function doHint() {
      if (!R || R.phase !== 'count') return;
      var rest = remaining();
      if (!rest.length) return;
      var n = R.r.size, row = Math.floor(+rest[0].getAttribute('data-idx') / n);
      R.hintUsed++;
      R.helps++;
      sfx('show');
      clearBand();
      var first = elGrid.children[row * n];
      var band = h('div', 'cs-row-band');
      band.setAttribute('data-row', row);
      band.style.top = (first.offsetTop - 4) + 'px';
      band.style.height = (first.offsetHeight + 8) + 'px';
      elGrid.insertBefore(band, elGrid.firstChild);
      say(T.hinted, 'help');
      tagCells();
      log('game-help', { itemId: R.it.id, helpLevel: 'A2', helpType: 'row-guide', trigger: 'child-request', row: row + 1 });
    }

    function done() {
      var it = R.it, t = thing(it.target), acc = accNow(), f = R.found;
      R.phase = 'done';
      clearBand();
      elArena.classList.add('cs-off');
      setActions([], []);
      sfx('done');
      /* 찾은 차례가 줄 순서(가로) 또는 세로 순서를 얼마나 따랐는지 — 거꾸로 훑어도 차례대로면 1 */
      var n = R.r.size;
      function orderRatio(list) {
        if (list.length < 2) return 1;
        var up = 0, down = 0;
        for (var i = 1; i < list.length; i++) { if (list[i] > list[i - 1]) up++; else down++; }
        return Math.round(Math.max(up, down) / (list.length - 1) * 100) / 100;
      }
      var ordered = orderRatio(f);
      var colOrdered = orderRatio(f.map(function (x) { return (x % n) * n + Math.floor(x / n); }));
      R.tally[acc]++;
      say(fmt(T.done, { x: t.label + jo(t.label, '은', '는'), n: f.length, u: t.unit || '개' }), 'good', 'is-good');
      var summary = {
        itemId: it.id, target: it.target, count: f.length, accuracy: acc, misses: R.misses, helps: R.helps, rowGuides: R.hintUsed,
        orderedRatio: ordered, colOrderedRatio: colOrdered, lookMs: R.lookMs, totalMs: Math.round(now() - R.tStart)
      };
      results.push(summary);
      log('game-item-complete', summary);
      later(function () {
        R.qi++;
        paintSteps();
        if (R.qi < R.r.items.length) show();
        else roundDone();
      }, o.nextMs);
    }

    function roundDone() {
      R.phase = 'round-done';
      paintSteps();
      var left = rounds.length - ri - 1;
      panelInfo('🎉', fmt(T.infoDone, { n: ri + 1 }), left ? fmt(T.infoLeft, { n: left }) : T.infoLast);
      var sum = { roundId: R.r.id, items: R.r.items.length, accurate: R.tally.accurate, selfCorrected: R.tally['self-corrected'], support: R.tally.support };
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(sum); } catch (e) {} }
      var last = ri === rounds.length - 1;
      setActions([button(last ? '🏁 ' + esc(T.finish) : esc(T.next) + ' ▶', last ? 'finish' : 'next')], []);
      paintRounds(ri + 1);
    }

    function finish() {
      elEnd.hidden = false;
      ri = rounds.length;
      paintRounds(rounds.length);
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.cs-end-line').textContent = fmt(T.endLine, { n: rounds.length });
      var st = elEnd.querySelector('.cs-stamps');
      st.innerHTML = '';
      rounds.forEach(function (r, i) { st.appendChild(h('span', 'cs-dot is-done', (i + 1) + '판')); });
      var acts = elEnd.querySelector('.cs-btns');
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
        return { id: r.id || ('r' + (i + 1)), size: Math.max(3, Math.min(r.size || 5, 9)), items: r.items.slice() };
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
      if (name === 'begin' && R.phase === 'ready') show();
      else if (name === 'start' && R.phase === 'look') startCount();
      else if (name === 'hint') doHint();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-cs-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-cs-act')); return; }
      var c = e.target.closest('.cs-cell');
      if (c && root.contains(c)) onCell(c);
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

  global.CountScan = { version: VERSION, mount: mount };
})(window);
