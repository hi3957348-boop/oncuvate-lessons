/*!
 * 「사다리 선물」 사다리 타기 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 4장 집행력 「사다리타기 1~4」(111~114쪽)
 *            (손을 쓰지 않고 눈으로만 사다리를 따라가 누가 무엇과 이어지는지 찾는다) — 활동 방식만 가져왔다.
 *
 * 한 판: 위에 동물, 아래에 선물. 금색 테 동물이 어떤 선물을 받는지 눈으로 따라가 아래 선물을 누른다 — 누르는 순간 판정.
 *        맞으면 금색 길이 위에서 아래로 그려진다. 한 판에 asks번 묻는다. 뒤 판일수록 줄과 가로줄이 많아진다.
 *   「따라가 보기」(아이가 고름, 도움 A2): 길의 앞쪽 절반을 하늘색으로 그려 준다
 *   어긋나면 1번째 : 흔들리고 「눈으로 다시 따라가 봐요」 · 2번째 : 길 전체를 그려 주고 맞는 선물이 반짝(도움 A4)
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 사다리 그림은 SVG(색은 SVG 속성에 글자값, 크기는 페이지 스타일)로 그린다.
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 선물 단추   data-track="answer" + data-item-id(판-몇째) + data-correct + data-response + (맞는 것) data-accuracy
 *   - 따라가 보기 data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var SVGNS = 'http://www.w3.org/2000/svg';

  var TEXT = {
    title: '사다리 선물',
    ready: '손 말고 눈으로 사다리를 따라가서, 누가 어떤 선물을 받는지 찾아요.',
    start: '시작',
    ask: '{who}{neun} 어떤 선물을 받을까요?',
    oops: '눈으로 다시 따라가 봐요.',
    cue: '반짝이는 선물이에요.',
    got: '{who}{neun} {what}{eul} 받았어요!',
    trace: '따라가 보기',
    allDone: '선물을 모두 찾았어요!',
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoBig: '사다리 {n}줄',
    infoSmall: '{k}번 찾아요',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = { ready: 'jelly-default', ask: 'jelly-look', oops: 'jelly-thinking', help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer' };

  var DEFAULTS = {
    activityId: 'ladder',
    storageKey: null,
    tops: [],                  // 위(동물) [ {key, label, img|emoji} ]
    bottoms: [],               // 아래(선물) [ {key, label, img|emoji} ]
    rounds: [],                // [ {id, lines, levels, asks, density} ]
    drawMs: 900,               // 길 그리는 시간
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
    '.ld-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--coral:#ff8a80;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:ld / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.ld-root *,.ld-root *::before,.ld-root *::after{box-sizing:border-box}',
    '.ld-root [hidden]{display:none!important}',
    '.ld-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    '.ld-arena{container:ldarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'display:grid;grid-template-rows:auto minmax(0,1fr) auto;padding:3cqmin 2cqmin;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.ld-row{--n:3;position:relative;z-index:2;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr))}',
    '.ld-slot{display:flex;justify-content:center;min-width:0}',
    '.ld-tok{container-type:size;position:relative;width:min(16cqh,calc(84cqw / var(--n)));height:min(16cqh,calc(84cqw / var(--n)));display:flex;flex-direction:column;align-items:center;justify-content:center;',
    'padding:2px;border:0;border-radius:12px;font:inherit;color:#2b2140;background:linear-gradient(180deg,#fff,#fffaf0);',
    'box-shadow:inset 0 -3px 0 #efe6d2,0 3px 0 var(--v3)}',
    '.ld-tok img{width:66cqmin;height:66cqmin;object-fit:contain;pointer-events:none}',
    '.ld-tok .ld-emo{font-size:56cqmin;line-height:1}',
    '.ld-tok b{font-size:clamp(8px,15cqmin,14px);font-weight:850;line-height:1.05}',
    '.ld-tok.is-now{box-shadow:inset 0 0 0 3px var(--gold),0 3px 0 var(--gold-d),0 0 18px rgba(255,210,63,.75);transform:scale(1.08)}',
    '.ld-tok.is-done{opacity:.55}',
    'button.ld-tok{cursor:pointer;touch-action:manipulation;transition:transform .12s}',
    'button.ld-tok:hover{transform:translateY(-2px)}',
    'button.ld-tok:focus-visible{outline:3px solid var(--gold);outline-offset:2px}',
    'button.ld-tok.is-no{background:#ffe1dd;animation:ld-wob .45s ease-in-out}',
    'button.ld-tok.is-cue{animation:ld-cue 1s ease-in-out infinite}',
    'button.ld-tok.is-got{box-shadow:inset 0 0 0 3px var(--mint),0 3px 0 #9fdcc0;background:linear-gradient(180deg,#eafff5,#c9f3df)}',
    '.ld-off button.ld-tok{pointer-events:none}',
    '.ld-svg{position:relative;z-index:1;display:block;width:100%;height:100%;min-height:0;margin:1cqh 0}',

    '.ld-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.ld-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.ld-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.ld-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.ld-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 6px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.ld-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.ld-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.ld-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.ld-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.ld-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.ld-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.ld-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.ld-coach.is-temp .ld-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.ld-coach.is-good .ld-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.ld-card{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;gap:4cqw;padding:12px;border-radius:18px;background:#fff;box-shadow:inset 0 0 0 2px #e6dffa,0 4px 0 var(--v3)}',
    '.ld-big{container-type:size;width:min(22cqw,26cqh);height:min(22cqw,26cqh);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;',
    'background:linear-gradient(180deg,#fff,#fffaf0);box-shadow:inset 0 0 0 2px #f1e9d6,0 4px 0 var(--v3)}',
    '.ld-big img{width:70cqmin;height:70cqmin;object-fit:contain}',
    '.ld-big .ld-emo{font-size:56cqmin;line-height:1}',
    '.ld-big b{font-size:clamp(12px,13cqmin,20px);font-weight:900}',
    '.ld-big.is-q{background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.ld-big.is-q span{font-size:46cqmin;font-weight:900;color:var(--v6)}',
    '.ld-arrow{font-size:clamp(24px,8cqh,44px);font-weight:900;color:var(--v5)}',
    '.ld-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.ld-info-icon{font-size:clamp(30px,10cqh,48px);line-height:1}',
    '.ld-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.ld-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.ld-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.ld-left{display:flex;gap:8px;margin-right:auto}',
    '.ld-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.ld-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.ld-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.ld-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.ld-btn:focus-visible,.ld-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.ld-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.ld-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.ld-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.ld-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.ld-end .ld-btns{margin:0;justify-content:center}',
    '.ld-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.ld-stamps .ld-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.ld-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.ld-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '.ld-bit{position:absolute;left:50%;top:50%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:ld-bit .9s ease-out forwards}',
    '@keyframes ld-wob{20%{transform:rotate(-5deg) translateX(-4px)}45%{transform:rotate(4deg) translateX(4px)}70%{transform:rotate(-2deg)}}',
    '@keyframes ld-cue{0%,100%{box-shadow:inset 0 0 0 3px var(--gold),0 3px 0 var(--gold-d)}50%{box-shadow:inset 0 0 0 4px var(--gold),0 3px 0 var(--gold-d),0 0 0 6px rgba(255,210,63,.55)}}',
    '@keyframes ld-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    '@container ld (max-aspect-ratio:5/4){',
    '.ld-wrap{--arena:min(calc(100cqw - 24px),52cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.ld-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.ld-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('ld-style')) return;
    var s = document.createElement('style');
    s.id = 'ld-style';
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
  function hasBatchim(word) {
    var c = String(word).charCodeAt(String(word).length - 1);
    return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
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
    slide: function () { tones([523, 587, 659, 698, 784], 0.07, 'sine', 0.09); },
    again: function () { tones([440, 392], 0.1, 'triangle', 0.1); },
    show: function () { tones([587, 698], 0.08, 'sine', 0.08); },
    pick: function () { tones([740], 0.05, 'sine', 0.08); },
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

    var root = h('div', 'ld-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="ld-wrap">' +
        '<div class="ld-arena"><div class="ld-row ld-tops"></div><svg class="ld-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"></svg><div class="ld-row ld-bottoms"></div></div>' +
        '<aside class="ld-side">' +
          '<div class="ld-top">' +
            '<span class="ld-title">' + esc(T.title) + '</span>' +
            '<ol class="ld-rounds" aria-label="판"></ol>' +
            '<button type="button" class="ld-sound" data-ld-act="sound"></button>' +
          '</div>' +
          '<div class="ld-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="ld-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="ld-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="ld-info" hidden></div>' +
          '<div class="ld-card" hidden></div>' +
          '<div class="ld-actions"><div class="ld-left"></div><div class="ld-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="ld-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="ld-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="ld-end-line"></p><div class="ld-stamps"></div><div class="ld-btns"></div>' +
        (o.credit ? '<p class="ld-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'ld-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.ld-rounds'), elSound = $('.ld-sound'), elArena = $('.ld-arena'), elTops = $('.ld-tops'), elBottoms = $('.ld-bottoms'),
        elSvg = $('.ld-svg'), elCoach = $('.ld-coach'), elCoachImg = $('.ld-coach-img'), elBubble = $('.ld-bubble'),
        elInfo = $('.ld-info'), elCard = $('.ld-card'), elLeft = $('.ld-left'), elActs = $('.ld-side .ld-btns'), elEnd = $('.ld-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var plans = [], R = null, ri = 0, results = [], timers = [], tempTimer = null, raf = null, pathSeq = 0;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; if (raf) cancelAnimationFrame(raf); raf = null; }

    /* 사다리 만들기: levels줄마다 이웃 줄 사이에 가로줄을 놓되, 한 줄에서 양쪽 가로줄이 같은 높이에 겹치지 않게 */
    function makeLadder(n, levels, density) {
      var rungs = [];
      for (var r = 0; r < levels; r++) {
        var used = {};
        shuffle(range(n - 1)).forEach(function (g) {
          if (used[g - 1] || used[g + 1]) return;
          if (Math.random() < density) { used[g] = true; rungs.push({ row: r, gap: g, jitter: (Math.random() - 0.5) * 0.5 }); }
        });
      }
      /* 빈 사이(가로줄이 하나도 없는 사이)가 없도록 — 그 사이에 가로줄을 넣되 같은 높이 이웃과 겹치지 않는 줄을 고른다 */
      for (var tries = 0; tries < 30; tries++) {
        var empty = range(n - 1).filter(function (g) { return !rungs.some(function (x) { return x.gap === g; }); });
        if (!empty.length) break;
        var g0 = empty[0];
        var free = range(levels).filter(function (r) {
          return !rungs.some(function (x) { return x.row === r && Math.abs(x.gap - g0) <= 1; });
        });
        var row = free.length ? free[Math.floor(Math.random() * free.length)] : Math.floor(Math.random() * levels);
        rungs = rungs.filter(function (x) { return !(x.row === row && Math.abs(x.gap - g0) <= 1); });
        rungs.push({ row: row, gap: g0, jitter: 0 });
      }
      return rungs;
    }
    function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
    /* 위에서 i번 줄을 타고 내려가며 지나는 점들과 도착 줄 */
    function trace(p, i) {
      var top = 30, bottom = 970, rowH = (bottom - top) / (p.levels + 1);
      var x = function (j) { return (j + 0.5) / p.n * 1000; };
      var pts = [[x(i), 0], [x(i), top]], cur = i;
      for (var r = 0; r < p.levels; r++) {
        var rung = null;
        p.rungs.forEach(function (g) { if (g.row === r && (g.gap === cur || g.gap === cur - 1)) rung = g; });
        if (!rung) continue;
        var y = top + rowH * (r + 1 + rung.jitter);
        var to = rung.gap === cur ? cur + 1 : cur - 1;
        pts.push([x(cur), y]);
        pts.push([x(to), y]);
        cur = to;
      }
      pts.push([x(cur), 1000]);
      return { pts: pts, end: cur };
    }

    function plan(spec, idx) {
      var n = Math.max(2, Math.min(spec.lines || 3, o.tops.length, o.bottoms.length));
      var levels = spec.levels || (n * 2 + 1);
      var p = { id: spec.id || ('r' + (idx + 1)), n: n, levels: levels };
      p.rungs = makeLadder(n, levels, spec.density || 0.45);
      p.tops = shuffle(o.tops).slice(0, n);
      p.bottoms = shuffle(o.bottoms).slice(0, n);
      p.asks = shuffle(range(n)).slice(0, Math.min(spec.asks || 3, n));
      p.ends = range(n).map(function (i) { return trace(p, i).end; });
      return p;
    }

    function pic(it, cls) {
      if (it.img) return '<img src="' + esc(it.img) + '" alt="" draggable="false">';
      if (it.emoji) return '<span class="ld-emo" aria-hidden="true">' + esc(it.emoji) + '</span>';
      return '';
    }
    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'ld-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood, cls) {
      say(text, mood, cls || 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1700);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'ld-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-ld-act', act);
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
        var li = h('li', 'ld-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), p.n + '줄');
        li.setAttribute('aria-label', (i + 1) + '판 사다리 ' + p.n + '줄' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function showInfo(kind) {
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var p = R.p, left = plans.length - ri - 1;
      if (kind === 'done') {
        elInfo.appendChild(h('span', 'ld-info-icon', '🎉'));
        elInfo.appendChild(h('b', 'ld-info-big', esc(fmt(T.infoDone, { n: ri + 1 }))));
        elInfo.appendChild(h('span', 'ld-info-small', esc(left ? fmt(T.infoLeft, { n: left }) : T.infoLast)));
      } else {
        elInfo.appendChild(h('span', 'ld-info-icon', '🪜'));
        elInfo.appendChild(h('b', 'ld-info-big', esc(fmt(T.infoBig, { n: p.n }))));
        elInfo.appendChild(h('span', 'ld-info-small', esc(fmt(T.infoSmall, { k: p.asks.length }))));
      }
      elInfo.hidden = false;
    }

    function drawLadder() {
      var p = R.p;
      while (elSvg.firstChild) elSvg.removeChild(elSvg.firstChild);
      var top = 30, bottom = 970, rowH = (bottom - top) / (p.levels + 1);
      for (var i = 0; i < p.n; i++) {
        var x = (i + 0.5) / p.n * 1000;
        elSvg.appendChild(sv('line', { x1: x, y1: 0, x2: x, y2: 1000, stroke: '#fff6dc', 'stroke-width': 5, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
      }
      p.rungs.forEach(function (g) {
        var y = top + rowH * (g.row + 1 + g.jitter);
        elSvg.appendChild(sv('line', { x1: (g.gap + 0.5) / p.n * 1000, y1: y, x2: (g.gap + 1.5) / p.n * 1000, y2: y,
          stroke: '#fff6dc', 'stroke-width': 5, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
      });
      R.pathEl = sv('polyline', { points: '', fill: 'none', stroke: '#ffd23f', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' });
      elSvg.appendChild(R.pathEl);
    }
    /* 길을 frac(0~1)만큼 그린다 — 애니메이션 */
    function drawPath(i, frac, color, done) {
      if (raf) cancelAnimationFrame(raf);
      var pts = trace(R.p, i).pts, segs = [], total = 0;
      for (var s = 1; s < pts.length; s++) {
        var len = Math.abs(pts[s][0] - pts[s - 1][0]) + Math.abs(pts[s][1] - pts[s - 1][1]);
        segs.push(len); total += len;
      }
      R.pathEl.setAttribute('stroke', color);
      var target = total * frac, t0 = now(), dur = reduced ? 0 : o.drawMs * frac;
      function partial(d) {
        var out = [pts[0]], acc = 0;
        for (var s2 = 1; s2 < pts.length; s2++) {
          if (acc + segs[s2 - 1] >= d) {
            var r = segs[s2 - 1] ? (d - acc) / segs[s2 - 1] : 0;
            out.push([pts[s2 - 1][0] + (pts[s2][0] - pts[s2 - 1][0]) * r, pts[s2 - 1][1] + (pts[s2][1] - pts[s2 - 1][1]) * r]);
            return out;
          }
          out.push(pts[s2]); acc += segs[s2 - 1];
        }
        return out;
      }
      var finished = false, el = R.pathEl, token = ++pathSeq;
      function paint(d) {
        el.setAttribute('points', partial(d).map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '));
      }
      /* 화면이 가려져 그리기가 멈춰도 시간이 되면 끝까지 그리고 다음으로 넘어간다 */
      function finish() {
        if (finished || token !== pathSeq) return;
        finished = true;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        paint(target);
        if (done) done();
      }
      function step() {
        if (finished || token !== pathSeq) return;
        var k2 = dur ? Math.min(1, (now() - t0) / dur) : 1;
        paint(target * k2);
        if (k2 < 1) raf = requestAnimationFrame(step); else finish();
      }
      later(finish, dur + 400);
      step();
    }
    function clearPath() { pathSeq++; if (raf) cancelAnimationFrame(raf); raf = null; if (R.pathEl) R.pathEl.setAttribute('points', ''); }

    function buildRows() {
      var p = R.p;
      [elTops, elBottoms].forEach(function (row) { row.style.setProperty('--n', p.n); row.innerHTML = ''; });
      R.topEls = []; R.botEls = [];
      p.tops.forEach(function (it) {
        var slot = h('div', 'ld-slot'), t = h('div', 'ld-tok', pic(it) + '<b>' + esc(it.label) + '</b>');
        t.setAttribute('aria-label', it.label);
        slot.appendChild(t); elTops.appendChild(slot); R.topEls.push(t);
      });
      p.bottoms.forEach(function (it, j) {
        var slot = h('div', 'ld-slot'), b = h('button', 'ld-tok', pic(it) + '<b>' + esc(it.label) + '</b>');
        b.type = 'button';
        b.setAttribute('data-b', j);
        b.setAttribute('aria-label', it.label);
        slot.appendChild(b); elBottoms.appendChild(slot); R.botEls.push(b);
      });
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var p = plans[i];
      R = { p: p, phase: 'ready', q: 0, errs: 0, traced: false, acc: [], wrong: 0, traces: 0, sayText: '', sayMood: 'ready' };
      paintRounds(i);
      buildRows();
      drawLadder();
      elArena.classList.add('ld-off');
      elCard.hidden = true;
      showInfo('ready');
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }
    function startRun() {
      var p = R.p;
      R.phase = 'ask';
      showInfo(null);
      elArena.classList.remove('ld-off');
      log('game-item-ready', {
        itemId: p.id, lines: p.n, levels: p.levels, rungs: p.rungs.length,
        tops: p.tops.map(function (t) { return t.label; }).join('|'), bottoms: p.bottoms.map(function (b) { return b.label; }).join('|'),
        engine: 'ladder@' + VERSION
      });
      R.tStart = now();
      ask();
    }
    function cur() { return R.p.asks[R.q]; }
    function names(who, what) {
      return { who: who, neun: hasBatchim(who) ? '은' : '는', what: what || '', eul: what && hasBatchim(what) ? '을' : '를' };
    }
    function accNow() { return (R.errs >= 2 || R.traced) ? 'support' : (R.errs === 1 ? 'self-corrected' : 'accurate'); }
    function arm() {
      var p = R.p, i = cur(), end = p.ends[i];
      R.botEls.forEach(function (b, j) {
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', p.id + '-' + (R.q + 1));
        b.setAttribute('data-response', p.bottoms[j].label);
        b.setAttribute('data-correct', j === end ? 'true' : 'false');
        if (j === end) b.setAttribute('data-accuracy', accNow()); else b.removeAttribute('data-accuracy');
      });
    }
    function ask() {
      var p = R.p, i = cur(), who = p.tops[i];
      R.errs = 0; R.traced = false; R.tAsk = now();
      clearPath();
      R.topEls.forEach(function (t, j) { t.classList.toggle('is-now', j === i); });
      R.botEls.forEach(function (b) { b.classList.remove('is-cue', 'is-no', 'is-got'); });
      elCard.innerHTML = '<span class="ld-big">' + pic(who) + '<b>' + esc(who.label) + '</b></span><span class="ld-arrow">➜</span><span class="ld-big is-q"><span>?</span></span>';
      elCard.hidden = false;
      say(fmt(T.ask, names(who.label)), 'ask');
      setActions([], [button('👉 ' + esc(T.trace), 'trace', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'partial-path', 'data-item-id': p.id + '-' + (R.q + 1)
      })]);
      arm();
    }
    function choose(j) {
      if (!R || R.phase !== 'ask') return;
      var p = R.p, i = cur(), end = p.ends[i], ok = j === end, t = now(), acc = ok ? accNow() : '';
      log('game-response', {
        itemId: p.id + '-' + (R.q + 1), from: p.tops[i].label, correct: ok, response: p.bottoms[j].label, expected: p.bottoms[end].label,
        attempt: R.errs + 1, errorType: ok ? '' : (j === i ? 'straight-down' : (Math.abs(j - end) === 1 ? 'neighbor' : 'other')),
        accuracy: acc, responseMs: Math.round(t - R.tAsk)
      });
      if (ok) {
        R.acc.push(acc);
        R.phase = 'wait';
        setActions([], []);
        sfx('slide');
        drawPath(i, 1, '#ffd23f', function () {
          var b = R.botEls[j];
          b.classList.remove('is-cue');
          b.classList.add('is-got');
          var what = p.bottoms[j];
          elCard.innerHTML = '<span class="ld-big">' + pic(p.tops[i]) + '<b>' + esc(p.tops[i].label) + '</b></span><span class="ld-arrow">➜</span><span class="ld-big">' + pic(what) + '<b>' + esc(what.label) + '</b></span>';
          say(fmt(T.got, names(p.tops[i].label, what.label)), 'good', 'is-good');
          R.topEls[i].classList.remove('is-now');
          R.topEls[i].classList.add('is-done');
          R.q++;
          later(function () {
            if (R.q >= p.asks.length) { roundDone(); return; }
            R.phase = 'ask';
            ask();
          }, reduced ? 500 : 1300);
        });
        return;
      }
      R.errs++;
      R.wrong++;
      sfx('again');
      var bb = R.botEls[j];
      bb.classList.remove('is-no');
      void bb.offsetWidth;
      bb.classList.add('is-no');
      later(function () { bb.classList.remove('is-no'); }, 460);
      if (R.errs === 1) sayTemp(T.oops, 'oops');
      else {
        drawPath(i, 1, '#4bc9dc');
        R.botEls[end].classList.add('is-cue');
        say(T.cue, 'help');
        log('game-help', { itemId: p.id + '-' + (R.q + 1), helpLevel: 'A4', helpType: 'full-path', trigger: 'second-miss' });
      }
      arm();
    }
    function doTrace() {
      if (!R || R.phase !== 'ask' || R.traced) return;
      R.traced = true;
      R.traces++;
      sfx('show');
      drawPath(cur(), 0.5, '#4bc9dc');
      log('game-help', { itemId: R.p.id + '-' + (R.q + 1), helpLevel: 'A2', helpType: 'partial-path', trigger: 'child-request' });
      setActions([], []);
      arm();
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'ld-bit');
        var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 120;
        b.style.background = colors[i % colors.length];
        b.style.setProperty('--dx', 'calc(-50% + ' + Math.round(Math.cos(ang) * dist) + 'px)');
        b.style.setProperty('--dy', 'calc(-50% + ' + Math.round(Math.sin(ang) * dist) + 'px)');
        b.style.setProperty('--r', Math.round(Math.random() * 540) + 'deg');
        elArena.appendChild(b);
        later(function (x) { return function () { x.remove(); }; }(b), 1000);
      }
    }

    function roundDone() {
      var p = R.p;
      R.phase = 'done';
      elArena.classList.add('ld-off');
      elCard.hidden = true;
      sfx('done');
      burst();
      var count = { accurate: 0, 'self-corrected': 0, support: 0 };
      R.acc.forEach(function (a) { count[a]++; });
      var summary = {
        itemId: p.id, lines: p.n, rungs: p.rungs.length, asks: p.asks.length,
        accurate: count.accurate, selfCorrected: count['self-corrected'], support: count.support,
        wrongTaps: R.wrong, traceUses: R.traces, totalMs: Math.round(now() - R.tStart)
      };
      results.push(summary);
      log('game-item-complete', summary);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(summary); } catch (e) {} }
      say(T.allDone, 'good', 'is-good');
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
      elEnd.querySelector('.ld-end-line').textContent = fmt(T.endLine, { n: plans.length });
      var st = elEnd.querySelector('.ld-stamps');
      st.innerHTML = '';
      plans.forEach(function (p) { st.appendChild(h('span', 'ld-dot is-done', p.n + '줄')); });
      var acts = elEnd.querySelector('.ld-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      log('game-activity-complete', {
        rounds: plans.length,
        asks: results.reduce(function (s, r) { return s + r.asks; }, 0),
        accurate: results.reduce(function (s, r) { return s + r.accurate; }, 0),
        support: results.reduce(function (s, r) { return s + r.support; }, 0),
        wrongTaps: results.reduce(function (s, r) { return s + r.wrongTaps; }, 0)
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
      else if (name === 'trace') doTrace();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }
    function onClick(e) {
      var b = e.target.closest('[data-ld-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-ld-act')); return; }
      var t = e.target.closest('button.ld-tok');
      if (t && root.contains(t)) choose(+t.getAttribute('data-b'));
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

  global.Ladder = { version: VERSION, mount: mount };
})(window);
