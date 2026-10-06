/*!
 * 「이름 짝꿍」 얼굴과 이름 기억 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 2장 기억력 「얼굴과 이름 함께 기억하기 1~3」(73~75쪽)
 *            (친구들의 얼굴과 이름을 외운 뒤 이름을 적고, 어떤 방법으로 기억했는지 이야기한다) — 활동 방식만 가져왔다.
 *
 * 한 판의 흐름
 *   외우기: 친구들 얼굴 아래 이름표가 보인다(모래시계, 「다 외웠어요」로 먼저 끝낼 수 있다)
 *   맞히기: 이름표가 「?」로 바뀌고, 금색 테 친구의 이름을 아래 이름표 받침에서 고른다 — 누르는 순간 판정
 *   어긋나면 1번째 : 이름표가 흔들리고 「다시 떠올려 봐요」 · 「첫 글자 보기」(아이가 고름, 도움 A2)
 *            2번째 : 맞는 이름표가 금색으로 반짝(도움 A4)
 *   이름은 판마다 새로 섞는다(「오늘의 새 친구들」). 걸린 시간은 기록에만 남긴다.
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 이름표 받침    data-track="answer" + data-item-id(판-몇째 친구) + data-correct + data-response + (맞는 이름) data-accuracy
 *   - 첫 글자 보기   data-track="hint" data-help-level="A2"
 *   - 끝 화면        data-track="activity-complete"
 *   - 자세한 신호    oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '이름 짝꿍',
    ready: '새 친구 {n}명이 와요. 얼굴과 이름을 함께 기억해요.',
    start: '시작',
    look: '머리 모양, 옷 색깔과 이름을 함께 기억해요.',
    lookDone: '다 외웠어요',
    ask: '금색 테 친구의 이름은 뭘까요?',
    oops: '다시 떠올려 봐요.',
    cue: '반짝이는 이름이에요.',
    first: '첫 글자 보기',
    good: ['맞아요!', '딱 맞아요!', '척척이에요!'],
    allDone: '친구 {n}명 이름을 모두 찾았어요!',
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoBig: '새 친구 {n}명',
    infoSmall: '얼굴과 이름을 함께 기억해요',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = { ready: 'jelly-default', look: 'jelly-look', ask: 'jelly-default', oops: 'jelly-thinking', help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer' };

  var DEFAULTS = {
    activityId: 'face-name',
    storageKey: null,
    faces: [],                 // [ {key, img} ]
    names: [],                 // 이름 목록(판마다 섞어서 붙인다)
    rounds: [],                // [ {id, count, extraNames, lookSec} ]
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
    '.fn-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--coral:#ff8a80;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:fn / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.fn-root *,.fn-root *::before,.fn-root *::after{box-sizing:border-box}',
    '.fn-root [hidden]{display:none!important}',
    '.fn-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    /* 무대: 친구 카드 */
    '.fn-arena{container:fnarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'display:flex;align-items:center;justify-content:center;padding:4cqmin;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.fn-rays{position:absolute;left:50%;top:45%;width:1400px;height:1400px;margin:-700px 0 0 -700px;pointer-events:none;',
    'background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.05) 0 8deg,transparent 8deg 20deg);animation:fn-spin 90s linear infinite}',
    '.fn-board{--cols:3;--rows:2;--g:3cqmin;',
    '--cw:min(calc((100cqw - 8cqmin - (var(--cols) - 1) * var(--g)) / var(--cols)),calc((100cqh - 8cqmin - (var(--rows) - 1) * var(--g)) / var(--rows) * .78));',
    'position:relative;z-index:2;width:100%;height:100%;display:grid;gap:var(--g);justify-content:center;align-content:center;',
    'grid-template-columns:repeat(var(--cols),var(--cw));grid-template-rows:repeat(var(--rows),calc(var(--cw) / .78))}',
    '.fn-friend{container-type:size;position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3%;',
    'padding:6% 5% 7%;border-radius:16px;background:linear-gradient(180deg,#fff 0%,#fffaf0 100%);',
    'box-shadow:inset 0 0 0 2px #fff,inset 0 -5px 0 #efe6d2,0 4px 0 var(--v3),0 8px 14px rgba(10,4,50,.2);transition:transform .18s,box-shadow .18s}',
    '.fn-friend img{flex:1 1 auto;min-height:0;max-width:92%;object-fit:contain;object-position:bottom;pointer-events:none;image-rendering:auto}',
    '.fn-tag{flex:none;min-width:70%;padding:.18em .6em;border-radius:99px;text-align:center;font-size:clamp(13px,12cqmin,24px);font-weight:900;',
    'letter-spacing:-.02em;color:#2b2140;background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold)}',
    '.fn-tag.is-q{color:var(--v6);background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.fn-tag.is-first{color:#9a6c00;background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold)}',
    '.fn-tag.is-ok{color:#0f6b46;background:#d7f8e9;box-shadow:inset 0 0 0 2px var(--mint)}',
    '.fn-friend.is-now{z-index:3;transform:scale(1.07);box-shadow:inset 0 0 0 3px var(--gold),0 5px 0 var(--gold-d),0 0 22px rgba(255,210,63,.75)}',
    '.fn-friend.is-done{opacity:.9}',
    '.fn-friend.fn-wob{animation:fn-wob .45s ease-in-out}',

    /* 오른쪽 칸 */
    '.fn-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.fn-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.fn-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.fn-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.fn-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 6px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.fn-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.fn-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.fn-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.fn-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.fn-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.fn-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.fn-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.fn-coach.is-temp .fn-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.fn-coach.is-good .fn-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.fn-sand{height:14px;border-radius:99px;background:var(--v1);overflow:hidden}',
    '.fn-sand-fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--gold),var(--orange));transform-origin:left center}',
    '.fn-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.fn-info-icon{font-size:clamp(30px,10cqh,48px);line-height:1}',
    '.fn-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.fn-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.fn-names{flex:1 1 auto;min-height:0;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:10px;padding:10px;',
    'border-radius:16px;background:#f3effd;box-shadow:inset 0 0 0 2px #e6dffa}',
    '.fn-name{min-width:clamp(84px,24cqw,140px);min-height:clamp(48px,13cqh,64px);padding:0 16px;border:0;border-radius:16px;cursor:pointer;font:inherit;',
    'font-size:clamp(18px,6cqh,28px);font-weight:900;letter-spacing:-.02em;color:#2b2140;background:linear-gradient(180deg,#fff,#fffaf0);',
    'box-shadow:inset 0 -4px 0 #efe6d2,0 4px 0 var(--v3);touch-action:manipulation;transition:transform .12s}',
    '.fn-names.is-many{gap:8px}',
    '.fn-names.is-many .fn-name{min-width:clamp(72px,20cqw,124px);min-height:clamp(42px,10.5cqh,56px);font-size:clamp(16px,5cqh,24px);padding:0 12px}',
    '.fn-name:hover{transform:translateY(-2px)}',
    '.fn-name:active{transform:translateY(2px)}',
    '.fn-name:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',
    '.fn-name.is-used{opacity:.3;pointer-events:none}',
    '.fn-name.is-no{background:#ffe1dd;animation:fn-wob .45s ease-in-out}',
    '.fn-name.is-cue{animation:fn-cue 1s ease-in-out infinite}',
    '.fn-names.is-wait .fn-name{pointer-events:none}',
    '.fn-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.fn-left{display:flex;gap:8px;margin-right:auto}',
    '.fn-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.fn-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.fn-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.fn-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.fn-btn:focus-visible,.fn-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    /* 끝 화면 */
    '.fn-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.fn-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.fn-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.fn-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.fn-end .fn-btns{margin:0;justify-content:center}',
    '.fn-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.fn-stamps .fn-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.fn-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.fn-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '.fn-bit{position:absolute;left:50%;top:50%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:fn-bit .9s ease-out forwards}',
    '@keyframes fn-spin{to{transform:rotate(360deg)}}',
    '@keyframes fn-wob{20%{transform:rotate(-5deg) translateX(-5px)}45%{transform:rotate(4deg) translateX(5px)}70%{transform:rotate(-2deg)}}',
    '@keyframes fn-cue{0%,100%{box-shadow:inset 0 0 0 3px var(--gold),0 4px 0 var(--gold-d)}50%{box-shadow:inset 0 0 0 4px var(--gold),0 4px 0 var(--gold-d),0 0 0 6px rgba(255,210,63,.55)}}',
    '@keyframes fn-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    '@container fn (max-aspect-ratio:5/4){',
    '.fn-wrap{--arena:min(calc(100cqw - 24px),50cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.fn-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.fn-root *:not(.fn-sand-fill){animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('fn-style')) return;
    var s = document.createElement('style');
    s.id = 'fn-style';
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

  /* ───────────── 효과음 ───────────── */
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
    tick: function () { tones([784], 0.05, 'sine', 0.1); },
    again: function () { tones([440, 392], 0.1, 'triangle', 0.1); },
    show: function () { tones([587, 698], 0.08, 'sine', 0.08); },
    pick: function () { tones([740], 0.05, 'sine', 0.08); },
    done: function () { tones([523, 659, 784, 1047], 0.09, 'sine', 0.14); }
  };

  /* ───────────── 게임 ───────────── */
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
    try { var sv = sessionStorage.getItem(storeKey + 'sound'); if (sv !== null) soundOn = sv === '1'; } catch (e) {}
    function sfx(name) { if (soundOn) SFX[name](); }

    function log(type, detail) {
      var d = { type: type, schemaVersion: '0.2', activityId: o.activityId };
      for (var key in detail) d[key] = detail[key];
      try { global.dispatchEvent(new CustomEvent('oncuvate:log', { detail: d })); } catch (e) {}
      if (o.debug && global.console) console.log('[oncuvate:log]', d);
    }
    function coachSrc(mood) { return o.coachBase ? o.coachBase + COACH[mood] + o.coachExt : ''; }
    if (o.coachBase) Object.keys(COACH).forEach(function (m) { var im = new Image(); im.src = coachSrc(m); });
    o.faces.forEach(function (f) { var im = new Image(); im.src = f.img; });

    var root = h('div', 'fn-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'primary');
    root.innerHTML =
      '<div class="fn-wrap">' +
        '<div class="fn-arena"><div class="fn-rays"></div><div class="fn-board" role="group" aria-label="친구들"></div></div>' +
        '<aside class="fn-side">' +
          '<div class="fn-top">' +
            '<span class="fn-title">' + esc(T.title) + '</span>' +
            '<ol class="fn-rounds" aria-label="판"></ol>' +
            '<button type="button" class="fn-sound" data-fn-act="sound"></button>' +
          '</div>' +
          '<div class="fn-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="fn-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="fn-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="fn-sand" hidden><span class="fn-sand-fill"></span></div>' +
          '<div class="fn-info" hidden></div>' +
          '<div class="fn-names" hidden></div>' +
          '<div class="fn-actions"><div class="fn-left"></div><div class="fn-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="fn-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="fn-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="fn-end-line"></p><div class="fn-stamps"></div><div class="fn-btns"></div>' +
        (o.credit ? '<p class="fn-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'fn-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.fn-rounds'), elSound = $('.fn-sound'), elArena = $('.fn-arena'), elBoard = $('.fn-board'),
        elCoach = $('.fn-coach'), elCoachImg = $('.fn-coach-img'), elBubble = $('.fn-bubble'),
        elSand = $('.fn-sand'), elFill = $('.fn-sand-fill'), elInfo = $('.fn-info'), elNames = $('.fn-names'),
        elLeft = $('.fn-left'), elActs = $('.fn-side .fn-btns'), elEnd = $('.fn-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var plans = [], R = null, ri = 0, results = [], timers = [], tempTimer = null;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    /* 판 계획: 친구 count명, 이름은 새로 섞어 붙이고, 받침엔 안 쓰인 이름 extraNames개를 섞는다 */
    function plan(spec, idx) {
      var count = Math.min(spec.count || 3, o.faces.length, o.names.length);
      var faces = shuffle(o.faces).slice(0, count);
      var names = shuffle(o.names);
      var people = faces.map(function (f, i) { return { key: f.key, img: f.img, name: names[i] }; });
      var extras = names.slice(count, count + (spec.extraNames || 0));
      return { id: spec.id || ('r' + (idx + 1)), people: people, extras: extras, lookSec: spec.lookSec || (count * 8 + 6),
               order: shuffle(people.map(function (p, i) { return i; })) };
    }

    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'fn-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood, cls) {
      say(text, mood, cls || 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1500);
    }
    function wob(el, cls) {
      el.classList.remove(cls || 'fn-wob');
      void el.offsetWidth;
      el.classList.add(cls || 'fn-wob');
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'fn-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-fn-act', act);
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
        var li = h('li', 'fn-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), p.people.length + '명');
        li.setAttribute('aria-label', (i + 1) + '판 친구 ' + p.people.length + '명' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function showInfo(kind) {
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var p = R.p, left = plans.length - ri - 1;
      if (kind === 'done') {
        elInfo.appendChild(h('span', 'fn-info-icon', '🎉'));
        elInfo.appendChild(h('b', 'fn-info-big', esc(fmt(T.infoDone, { n: ri + 1 }))));
        elInfo.appendChild(h('span', 'fn-info-small', esc(left ? fmt(T.infoLeft, { n: left }) : T.infoLast)));
      } else {
        elInfo.appendChild(h('span', 'fn-info-icon', '👋'));
        elInfo.appendChild(h('b', 'fn-info-big', esc(fmt(T.infoBig, { n: p.people.length }))));
        elInfo.appendChild(h('span', 'fn-info-small', esc(T.infoSmall)));
      }
      elInfo.hidden = false;
    }

    function buildBoard(showNames) {
      var p = R.p, n = p.people.length, cols = n <= 3 ? n : (n === 4 ? 2 : 3), rows = Math.ceil(n / cols);
      elBoard.style.setProperty('--cols', cols);
      elBoard.style.setProperty('--rows', rows);
      elBoard.innerHTML = '';
      R.cards = [];
      p.people.forEach(function (person, i) {
        var c = h('div', 'fn-friend',
          '<img src="' + esc(person.img) + '" alt="" draggable="false">' +
          '<span class="fn-tag' + (showNames ? '' : ' is-q') + '">' + esc(showNames ? person.name : '?') + '</span>');
        c.setAttribute('aria-label', showNames ? person.name : (i + 1) + '번째 친구');
        elBoard.appendChild(c);
        R.cards.push(c);
      });
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var p = plans[i];
      R = { p: p, phase: 'ready', step: 0, errs: 0, first: false, acc: [], wrong: 0, firstUses: 0, sayText: '', sayMood: 'ready' };
      paintRounds(i);
      buildBoard(false);
      elNames.hidden = true; elSand.hidden = true;
      showInfo('ready');
      say(fmt(T.ready, { n: p.people.length }), 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    /* ── 외우기 ── */
    function startLook() {
      var p = R.p;
      R.phase = 'look';
      R.tLook = now();
      buildBoard(true);
      say(T.look, 'look');
      elSand.hidden = false;
      elFill.style.transition = 'none';
      elFill.style.transform = 'scaleX(1)';
      void elFill.offsetWidth;
      elFill.style.transition = 'transform ' + p.lookSec + 's linear';
      elFill.style.transform = 'scaleX(0)';
      setActions([button('✋ ' + esc(T.lookDone), 'lookDone')]);
      later(function () { endLook('timer'); }, p.lookSec * 1000);
    }
    function endLook(by) {
      if (R.phase !== 'look') return;
      clearTimers();
      var p = R.p;
      R.lookMs = Math.round(now() - R.tLook);
      R.lookBy = by;
      elSand.hidden = true;
      showInfo(null);
      R.cards.forEach(function (c) {
        var tag = c.querySelector('.fn-tag');
        tag.textContent = '?';
        tag.className = 'fn-tag is-q';
      });
      /* 이름표 받침 */
      elNames.innerHTML = '';
      shuffle(p.people.map(function (x) { return x.name; }).concat(p.extras)).forEach(function (name) {
        var b = h('button', 'fn-name', esc(name));
        b.type = 'button';
        b.setAttribute('data-name', name);
        elNames.appendChild(b);
      });
      elNames.classList.toggle('is-many', elNames.children.length > 6);
      elNames.hidden = false;
      R.phase = 'ask';
      log('game-item-ready', {
        itemId: p.id, count: p.people.length, extras: p.extras.join('|'),
        pairs: p.people.map(function (x) { return x.key + '=' + x.name; }).join('|'),
        lookSec: p.lookSec, lookMs: R.lookMs, lookEndedBy: by, engine: 'face-name@' + VERSION
      });
      R.tStart = now();
      ask();
    }

    function current() { return R.p.people[R.p.order[R.step]]; }
    function accNow() { return (R.errs >= 2 || R.first) ? 'support' : (R.errs === 1 ? 'self-corrected' : 'accurate'); }
    function arm() {
      var p = R.p, cur = current();
      Array.prototype.forEach.call(elNames.children, function (b) {
        if (b.classList.contains('is-used')) {
          ['data-track', 'data-item-id', 'data-correct', 'data-response', 'data-accuracy'].forEach(function (a) { b.removeAttribute(a); });
          return;
        }
        var name = b.getAttribute('data-name');
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', p.id + '-' + (R.step + 1));
        b.setAttribute('data-response', name);
        b.setAttribute('data-correct', name === cur.name ? 'true' : 'false');
        if (name === cur.name) b.setAttribute('data-accuracy', accNow()); else b.removeAttribute('data-accuracy');
      });
    }
    function ask() {
      var p = R.p, idx = p.order[R.step];
      R.errs = 0;
      R.first = false;
      R.tAsk = now();
      R.cards.forEach(function (c, i) { c.classList.toggle('is-now', i === idx); });
      Array.prototype.forEach.call(elNames.children, function (b) { b.classList.remove('is-cue', 'is-no'); });
      say(T.ask, 'ask');
      setActions([], [button('🔤 ' + esc(T.first), 'first', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'first-letter', 'data-item-id': p.id + '-' + (R.step + 1)
      })]);
      arm();
    }

    function choose(b) {
      if (!R || R.phase !== 'ask' || b.classList.contains('is-used')) return;
      var p = R.p, cur = current(), name = b.getAttribute('data-name'), ok = name === cur.name, t = now();
      var acc = ok ? accNow() : '';
      var errorType = ok ? '' : (p.extras.indexOf(name) >= 0 ? 'new-name' : 'swap');
      log('game-response', {
        itemId: p.id + '-' + (R.step + 1), face: cur.key, correct: ok, response: name, expected: cur.name,
        attempt: R.errs + 1, errorType: errorType, accuracy: acc, responseMs: Math.round(t - R.tAsk)
      });
      if (ok) {
        R.acc.push(acc);
        sfx('tick');
        b.classList.add('is-used');
        b.classList.remove('is-cue');
        var card = R.cards[p.order[R.step]], tag = card.querySelector('.fn-tag');
        tag.textContent = cur.name;
        tag.className = 'fn-tag is-ok';
        card.classList.remove('is-now');
        card.classList.add('is-done');
        R.step++;
        if (R.step >= p.people.length) { R.phase = 'wait'; later(roundDone, reduced ? 200 : 500); return; }
        sayTemp(pick(T.good), 'good', 'is-good');
        R.phase = 'wait';
        later(function () { R.phase = 'ask'; ask(); }, reduced ? 150 : 450);
        return;
      }
      R.errs++;
      R.wrong++;
      sfx('again');
      wob(b);
      b.classList.add('is-no');
      later(function () { b.classList.remove('is-no'); }, 450);
      wob(R.cards[p.order[R.step]]);
      if (R.errs === 1) {
        sayTemp(T.oops, 'oops');
      } else {
        Array.prototype.forEach.call(elNames.children, function (x) { if (x.getAttribute('data-name') === cur.name) x.classList.add('is-cue'); });
        say(T.cue, 'help');
        log('game-help', { itemId: p.id + '-' + (R.step + 1), helpLevel: 'A4', helpType: 'answer-cue', trigger: 'second-miss' });
      }
      arm();
    }

    /* 첫 글자 보기: 금색 테 친구 이름표에 첫 글자만 */
    function showFirst() {
      if (!R || R.phase !== 'ask' || R.first) return;
      var p = R.p, cur = current(), tag = R.cards[p.order[R.step]].querySelector('.fn-tag');
      R.first = true;
      R.firstUses++;
      tag.textContent = cur.name.charAt(0) + '…';
      tag.className = 'fn-tag is-first';
      sfx('show');
      log('game-help', { itemId: p.id + '-' + (R.step + 1), helpLevel: 'A2', helpType: 'first-letter', trigger: 'child-request' });
      setActions([], []);
      arm();
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'fn-bit');
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
      elNames.hidden = true;
      sfx('done');
      burst();
      var count = { accurate: 0, 'self-corrected': 0, support: 0 };
      R.acc.forEach(function (a) { count[a]++; });
      var summary = {
        itemId: p.id, count: p.people.length, accurate: count.accurate, selfCorrected: count['self-corrected'], support: count.support,
        wrongTaps: R.wrong, firstLetterUses: R.firstUses, lookMs: R.lookMs, lookEndedBy: R.lookBy, answerMs: Math.round(now() - R.tStart)
      };
      results.push(summary);
      log('game-item-complete', summary);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(summary); } catch (e) {} }
      say(fmt(T.allDone, { n: p.people.length }), 'good', 'is-good');
      showInfo('done');
      var last = ri === plans.length - 1;
      setActions([button(last ? '🏁 ' + esc(T.finish) : esc(T.next) + ' ▶', last ? 'finish' : 'next')]);
      paintRounds(ri + 1);
    }

    function finish() {
      elEnd.hidden = false;
      ri = plans.length;
      paintRounds(plans.length);
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.fn-end-line').textContent = fmt(T.endLine, { n: plans.length });
      var st = elEnd.querySelector('.fn-stamps');
      st.innerHTML = '';
      plans.forEach(function (p) { st.appendChild(h('span', 'fn-dot is-done', p.people.length + '명')); });
      var acts = elEnd.querySelector('.fn-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      log('game-activity-complete', {
        rounds: plans.length,
        people: results.reduce(function (s, r) { return s + r.count; }, 0),
        accurate: results.reduce(function (s, r) { return s + r.accurate; }, 0),
        selfCorrected: results.reduce(function (s, r) { return s + r.selfCorrected; }, 0),
        support: results.reduce(function (s, r) { return s + r.support; }, 0)
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
      if (name === 'start' && R.phase === 'ready') { setActions([]); startLook(); }
      else if (name === 'lookDone') endLook('child');
      else if (name === 'first') showFirst();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-fn-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-fn-act')); return; }
      var nb = e.target.closest('.fn-name');
      if (nb && root.contains(nb)) { choose(nb); return; }
      if (R && R.phase === 'ask' && e.target.closest('.fn-friend')) { sayTemp(T.ask, 'ask'); wob(elNames); }
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

  global.FaceName = { version: VERSION, mount: mount };
})(window);
