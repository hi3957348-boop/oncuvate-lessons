/*!
 * 「모아모아」 범주 낱말 모으기 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 4장 집행력 「언어(범주) 유창성 1~6」(105~110쪽)
 *            (정한 범주에 속하는 낱말을 짧은 시간에 되도록 많이 떠올린다) — 활동 방식만 가져왔다.
 *            그림 판에서 범주에 맞는 것을 모두 찾아 모으는 방식으로 바꿨다. 뒤 판일수록 범주가 넓어진다
 *            (동물 → 물건 → 「하늘에서 볼 수 있는 것」 → 「물에서 볼 수 있는 것」).
 *
 * 한 판: 섞인 그림 판에서 범주에 맞는 그림을 모두 누른다 — 누르는 순간 판정. 다 모으면 판 끝.
 *   어긋나면 1번째 : 흔들리고 「다시 생각해 봐요」 · 연달아 2번째 : 남은 것 하나가 금색으로 반짝(도움 A4)
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 그림 카드  data-track="answer" + data-item-id(판-그림) + data-correct + data-response + (맞는 그림) data-accuracy
 *   - 끝 화면    data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '모아모아',
    ready: '판에서 「{name}」{eul} 모두 찾아 모아요.',
    start: '시작',
    run: '「{name}」{eul} 모두 찾아요!',
    oops: '다시 생각해 봐요.',
    cue: '반짝이는 그림도 「{name}」{ida}.',
    good: ['좋아요!', '찾았다!', '척척이에요!'],
    allDone: '「{name}」{eul} 모두 모았어요!',
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoSmall: '그림 {b}장 가운데 {n}개',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = { ready: 'jelly-default', run: 'jelly-look', oops: 'jelly-thinking', help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer' };

  var DEFAULTS = {
    activityId: 'category-collect',
    storageKey: null,
    items: [],                 // [ {key, label, img|emoji, tags:[…]} ]
    rounds: [],                // [ {id, tag, name, icon, board, targets} ]
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

  /* ───────────── 스타일 ───────────── */
  var CSS = [
    '.cc-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--coral:#ff8a80;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:cc / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.cc-root *,.cc-root *::before,.cc-root *::after{box-sizing:border-box}',
    '.cc-root [hidden]{display:none!important}',
    '.cc-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    '.cc-arena{container:ccarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'display:flex;align-items:center;justify-content:center;padding:3.5cqmin;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.cc-rays{position:absolute;left:50%;top:45%;width:1400px;height:1400px;margin:-700px 0 0 -700px;pointer-events:none;',
    'background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.05) 0 8deg,transparent 8deg 20deg);animation:cc-spin 90s linear infinite}',
    '.cc-board{--cols:4;--rows:4;--g:2cqmin;position:relative;z-index:2;width:100%;height:100%;display:grid;gap:var(--g);',
    'grid-template-columns:repeat(var(--cols),minmax(0,1fr));grid-template-rows:repeat(var(--rows),minmax(0,1fr))}',
    '.cc-card{container-type:size;position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;',
    'padding:4px;border:0;border-radius:12px;font:inherit;cursor:pointer;color:#2b2140;touch-action:manipulation;',
    'background:linear-gradient(180deg,#fff 0%,#fffaf0 100%);box-shadow:inset 0 0 0 2px #fff,inset 0 -4px 0 #efe6d2,0 4px 0 var(--v3),0 8px 14px rgba(10,4,50,.2);',
    'transition:transform .15s cubic-bezier(.3,1.5,.5,1),opacity .2s}',
    '.cc-card:hover{transform:translateY(-3px) rotate(-1.5deg)}',
    '.cc-card:focus-visible{outline:3px solid var(--gold);outline-offset:2px}',
    '.cc-card img{width:66cqmin;height:66cqmin;object-fit:contain;pointer-events:none}',
    '.cc-card .cc-emo{font-size:54cqmin;line-height:1}',
    '.cc-card b{font-size:clamp(9px,14cqmin,16px);font-weight:850;line-height:1.1}',
    '.cc-card.is-got{cursor:default;background:linear-gradient(180deg,#eafff5,#c9f3df);box-shadow:inset 0 0 0 3px var(--mint),0 4px 0 #9fdcc0;transform:scale(.94)}',
    '.cc-card.is-got::after{content:"\\2713";position:absolute;right:7%;top:5%;color:var(--mint-d);font-size:clamp(11px,18cqmin,20px);font-weight:900}',
    '.cc-card.is-no{background:#ffe1dd;animation:cc-wob .45s ease-in-out}',
    '.cc-card.is-cue{animation:cc-cue 1s ease-in-out infinite}',
    '.cc-board.is-off .cc-card{pointer-events:none}',

    '.cc-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.cc-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.cc-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.cc-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.cc-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 6px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:14px;font-weight:900}',
    '.cc-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold)}',
    '.cc-dot.is-done{background:#d7f8e9}',
    '.cc-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.cc-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.cc-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.cc-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.cc-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.cc-coach.is-temp .cc-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.cc-coach.is-good .cc-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.cc-goal{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.6cqh;padding:12px;text-align:center;',
    'border-radius:18px;background:#fff;box-shadow:inset 0 0 0 2px #e6dffa,0 4px 0 var(--v3)}',
    '.cc-goal-icon{font-size:clamp(34px,12cqh,60px);line-height:1}',
    '.cc-goal-name{font-size:clamp(20px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:#2b2140;line-height:1.2}',
    '.cc-goal-count{padding:3px 14px;border-radius:99px;background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);font-size:clamp(16px,5cqh,24px);font-weight:900;color:#9a6c00;font-variant-numeric:tabular-nums}',
    '.cc-goal-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.cc-bag{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;min-height:clamp(28px,8cqh,40px)}',
    '.cc-bag span{container-type:size;width:clamp(28px,8cqh,40px);height:clamp(28px,8cqh,40px);display:grid;place-items:center;border-radius:9px;background:#eafff5;box-shadow:inset 0 0 0 2px var(--mint);animation:cc-pop .3s cubic-bezier(.3,1.5,.5,1)}',
    '.cc-bag img{width:80cqmin;height:80cqmin;object-fit:contain}',
    '.cc-bag .cc-emo{font-size:62cqmin;line-height:1}',
    '.cc-bag i{width:clamp(28px,8cqh,40px);height:clamp(28px,8cqh,40px);border-radius:9px;box-shadow:inset 0 0 0 2px var(--v3);background:var(--v05)}',
    '.cc-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.cc-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.cc-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.cc-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.cc-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.cc-btn:focus-visible,.cc-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.cc-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.cc-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.cc-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.cc-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.cc-end .cc-btns{margin:0;justify-content:center}',
    '.cc-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.cc-stamps .cc-dot{height:40px;padding:0 12px;border-radius:12px;font-size:20px}',
    '.cc-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.cc-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '.cc-bit{position:absolute;left:50%;top:50%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:cc-bit .9s ease-out forwards}',
    '@keyframes cc-spin{to{transform:rotate(360deg)}}',
    '@keyframes cc-pop{from{transform:scale(.5)}}',
    '@keyframes cc-wob{20%{transform:rotate(-5deg) translateX(-4px)}45%{transform:rotate(4deg) translateX(4px)}70%{transform:rotate(-2deg)}}',
    '@keyframes cc-cue{0%,100%{box-shadow:inset 0 0 0 3px var(--gold),0 4px 0 var(--gold-d)}50%{box-shadow:inset 0 0 0 4px var(--gold),0 4px 0 var(--gold-d),0 0 0 6px rgba(255,210,63,.55)}}',
    '@keyframes cc-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    '@container cc (max-aspect-ratio:5/4){',
    '.cc-wrap{--arena:min(calc(100cqw - 24px),52cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.cc-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.cc-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('cc-style')) return;
    var s = document.createElement('style');
    s.id = 'cc-style';
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
  /* 범주 이름에 맞는 조사 */
  function nm(name) { return { name: name, eul: hasBatchim(name) ? '을' : '를', ida: hasBatchim(name) ? '이에요' : '예요' }; }
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
    got: function (i) { tones([523 + (i % 6) * 60, 784 + (i % 6) * 60], 0.05, 'sine', 0.12); },
    again: function () { tones([440, 392], 0.1, 'triangle', 0.1); },
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
    var ITEMS = {};
    o.items.forEach(function (it) { ITEMS[it.key] = it; });
    var storeKey = (o.storageKey || o.activityId) + ':';
    var reduced = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    o.items.forEach(function (it) { if (it.img) { var im = new Image(); im.src = it.img; } });

    var root = h('div', 'cc-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="cc-wrap">' +
        '<div class="cc-arena"><div class="cc-rays"></div><div class="cc-board" role="group" aria-label="그림 판"></div></div>' +
        '<aside class="cc-side">' +
          '<div class="cc-top">' +
            '<span class="cc-title">' + esc(T.title) + '</span>' +
            '<ol class="cc-rounds" aria-label="판"></ol>' +
            '<button type="button" class="cc-sound" data-cc-act="sound"></button>' +
          '</div>' +
          '<div class="cc-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="cc-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="cc-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="cc-goal"></div>' +
          '<div class="cc-actions"><div class="cc-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="cc-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="cc-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="cc-end-line"></p><div class="cc-stamps"></div><div class="cc-btns"></div>' +
        (o.credit ? '<p class="cc-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'cc-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.cc-rounds'), elSound = $('.cc-sound'), elArena = $('.cc-arena'), elBoard = $('.cc-board'),
        elCoach = $('.cc-coach'), elCoachImg = $('.cc-coach-img'), elBubble = $('.cc-bubble'), elGoal = $('.cc-goal'),
        elActs = $('.cc-side .cc-btns'), elEnd = $('.cc-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var plans = [], R = null, ri = 0, results = [], timers = [], tempTimer = null;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function hasTag(it, tag) { return (it.tags || []).indexOf(tag) >= 0; }

    function plan(spec, idx) {
      var tag = spec.tag, board = spec.board || 16;
      var yes = shuffle(o.items.filter(function (it) { return hasTag(it, tag); }).map(function (it) { return it.key; }));
      var no = shuffle(o.items.filter(function (it) { return !hasTag(it, tag); }).map(function (it) { return it.key; }));
      var targets = yes.slice(0, Math.min(spec.targets || yes.length, yes.length, board));
      var cards = shuffle(targets.concat(no.slice(0, board - targets.length)));
      var cols = board <= 12 ? (board <= 9 ? 3 : 4) : (board <= 16 ? 4 : 5);
      return { id: spec.id || ('r' + (idx + 1)), tag: tag, name: spec.name || tag, icon: spec.icon || '⭐', cards: cards, targets: targets,
               cols: cols, rows: Math.ceil(cards.length / cols) };
    }

    function pic(it) {
      if (it.img) return '<img src="' + esc(it.img) + '" alt="" draggable="false">';
      if (it.emoji) return '<span class="cc-emo" aria-hidden="true">' + esc(it.emoji) + '</span>';
      return '';
    }
    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'cc-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood, cls) {
      say(text, mood, cls || 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1500);
    }
    function button(label, act, soft) {
      var b = h('button', 'cc-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-cc-act', act);
      return b;
    }
    function setActions(list) {
      elActs.innerHTML = '';
      list.forEach(function (b) { elActs.appendChild(b); });
    }
    function paintRounds(doneUpTo) {
      elRounds.innerHTML = '';
      plans.forEach(function (p, i) {
        var done = i < doneUpTo;
        var li = h('li', 'cc-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), esc(p.icon));
        li.setAttribute('aria-label', (i + 1) + '판 ' + p.name + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    /* 오른쪽 목표 칸: 범주 이름 + 모은 수 + 모은 그림 */
    function paintGoal(kind) {
      var p = R.p, left = plans.length - ri - 1;
      if (kind === 'done') {
        elGoal.innerHTML = '<span class="cc-goal-icon">🎉</span><b class="cc-goal-name">' + esc(fmt(T.infoDone, { n: ri + 1 })) + '</b>' +
          '<span class="cc-goal-small">' + esc(left ? fmt(T.infoLeft, { n: left }) : T.infoLast) + '</span>';
        return;
      }
      var bag = '';
      for (var i = 0; i < p.targets.length; i++) {
        bag += R.got[i] ? '<span>' + pic(ITEMS[R.got[i]]) + '</span>' : '<i></i>';
      }
      elGoal.innerHTML = '<span class="cc-goal-icon">' + esc(p.icon) + '</span><b class="cc-goal-name">' + esc(p.name) + '</b>' +
        (kind === 'ready' ? '<span class="cc-goal-small">' + esc(fmt(T.infoSmall, { b: p.cards.length, n: p.targets.length })) + '</span>'
                          : '<span class="cc-goal-count">' + R.got.length + ' / ' + p.targets.length + '</span>') +
        '<div class="cc-bag">' + bag + '</div>';
    }

    function buildBoard() {
      var p = R.p;
      elBoard.style.setProperty('--cols', p.cols);
      elBoard.style.setProperty('--rows', p.rows);
      elBoard.innerHTML = '';
      R.cards = {};
      p.cards.forEach(function (key) {
        var it = ITEMS[key];
        var c = h('button', 'cc-card', pic(it) + '<b>' + esc(it.label) + '</b>');
        c.type = 'button';
        c.setAttribute('data-key', key);
        c.setAttribute('aria-label', it.label);
        elBoard.appendChild(c);
        R.cards[key] = c;
      });
    }

    function accNow() { return R.errs >= 2 ? 'support' : (R.errs === 1 ? 'self-corrected' : 'accurate'); }
    function arm() {
      var p = R.p;
      Object.keys(R.cards).forEach(function (key) {
        var c = R.cards[key];
        if (c.classList.contains('is-got')) {
          ['data-track', 'data-item-id', 'data-correct', 'data-response', 'data-accuracy'].forEach(function (a) { c.removeAttribute(a); });
          return;
        }
        var ok = p.targets.indexOf(key) >= 0;
        c.setAttribute('data-track', 'answer');
        c.setAttribute('data-item-id', p.id + '-' + key);
        c.setAttribute('data-response', ITEMS[key].label);
        c.setAttribute('data-correct', ok ? 'true' : 'false');
        if (ok) c.setAttribute('data-accuracy', accNow()); else c.removeAttribute('data-accuracy');
      });
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var p = plans[i];
      R = { p: p, phase: 'ready', got: [], errs: 0, acc: [], wrong: 0, sayText: '', sayMood: 'ready' };
      paintRounds(i);
      buildBoard();
      elBoard.classList.add('is-off');
      paintGoal('ready');
      say(fmt(T.ready, nm(p.name)), 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }
    function startRun() {
      var p = R.p;
      R.phase = 'run';
      elBoard.classList.remove('is-off');
      paintGoal('run');
      say(fmt(T.run, nm(p.name)), 'run');
      setActions([]);
      log('game-item-ready', {
        itemId: p.id, category: p.name, board: p.cards.length,
        targets: p.targets.map(function (key) { return ITEMS[key].label; }).join('|'), engine: 'category-collect@' + VERSION
      });
      R.tStart = R.tLast = now();
      arm();
    }

    function tap(c) {
      if (!R || R.phase !== 'run' || c.classList.contains('is-got')) return;
      var p = R.p, key = c.getAttribute('data-key'), ok = p.targets.indexOf(key) >= 0, t = now();
      var acc = ok ? accNow() : '';
      log('game-response', {
        itemId: p.id + '-' + key, category: p.name, item: ITEMS[key].label, correct: ok, attempt: R.errs + 1,
        errorType: ok ? '' : 'out-of-category', accuracy: acc, responseMs: Math.round(t - R.tLast)
      });
      if (ok) {
        R.acc.push(acc);
        sfx('got', R.got.length);
        c.classList.remove('is-cue', 'is-no');
        c.classList.add('is-got');
        R.got.push(key);
        R.errs = 0;
        R.tLast = now();
        Object.keys(R.cards).forEach(function (kk) { R.cards[kk].classList.remove('is-cue'); });
        paintGoal('run');
        if (R.got.length >= p.targets.length) { R.phase = 'wait'; later(roundDone, reduced ? 200 : 450); return; }
        if (R.got.length % 3 === 0) sayTemp(pick(T.good), 'good', 'is-good');
        arm();
        return;
      }
      R.errs++;
      R.wrong++;
      sfx('again');
      c.classList.remove('is-no');
      void c.offsetWidth;
      c.classList.add('is-no');
      later(function () { c.classList.remove('is-no'); }, 460);
      if (R.errs === 1) sayTemp(T.oops, 'oops');
      else {
        var leftKeys = p.targets.filter(function (kk) { return R.got.indexOf(kk) < 0; });
        var cueKey = leftKeys[0];
        if (cueKey) R.cards[cueKey].classList.add('is-cue');
        say(fmt(T.cue, nm(p.name)), 'help');
        log('game-help', { itemId: p.id + '-' + cueKey, helpLevel: 'A4', helpType: 'answer-cue', trigger: 'second-miss' });
      }
      arm();
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'cc-bit');
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
      elBoard.classList.add('is-off');
      sfx('done');
      burst();
      var count = { accurate: 0, 'self-corrected': 0, support: 0 };
      R.acc.forEach(function (a) { count[a]++; });
      var summary = {
        itemId: p.id, category: p.name, board: p.cards.length, targets: p.targets.length,
        accurate: count.accurate, selfCorrected: count['self-corrected'], support: count.support,
        wrongTaps: R.wrong, totalMs: Math.round(now() - R.tStart)
      };
      results.push(summary);
      log('game-item-complete', summary);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(summary); } catch (e) {} }
      say(fmt(T.allDone, nm(p.name)), 'good', 'is-good');
      paintGoal('done');
      var last = ri === plans.length - 1;
      setActions([button(last ? '🏁 ' + esc(T.finish) : esc(T.next) + ' ▶', last ? 'finish' : 'next')]);
      paintRounds(ri + 1);
    }

    function finish() {
      elEnd.hidden = false;
      ri = plans.length;
      paintRounds(plans.length);
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.cc-end-line').textContent = fmt(T.endLine, { n: plans.length });
      var st = elEnd.querySelector('.cc-stamps');
      st.innerHTML = '';
      plans.forEach(function (p) { st.appendChild(h('span', 'cc-dot is-done', esc(p.icon))); });
      var acts = elEnd.querySelector('.cc-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      log('game-activity-complete', {
        rounds: plans.length,
        found: results.reduce(function (s, r) { return s + r.targets; }, 0),
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
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-cc-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-cc-act')); return; }
      var c = e.target.closest('.cc-card');
      if (c && root.contains(c)) tap(c);
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

  global.CategoryCollect = { version: VERSION, mount: mount };
})(window);
