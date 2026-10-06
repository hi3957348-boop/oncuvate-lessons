/*!
 * 「거꾸로 말해요」 낱말 거꾸로 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 1장 작업기억 「낱말 거꾸로 말하기 1~10」(51~60쪽)
 *            (낱말을 듣고 따라 말한 뒤 거꾸로 말하기) — 활동 방식만 가져왔다. 낱말은 새로 골랐고, 소리 대신 화면으로 보여 준다.
 *
 * 한 문제: 낱말(그림 + 글자)을 보고 외운다 → 「다 외웠어요」를 누르면 가려진다 →
 *   아래 글자 카드에서 끝 글자부터 거꾸로 눌러 빈칸을 채운다(고양이 → 이 · 양 · 고). 누르는 순간 판정.
 *   어긋나면 1번째 = 카드가 흔들림 / 같은 칸 2번째 = 맞는 카드가 금색으로 반짝(A4).
 *   「다시 보기」(아이가 고름, 도움 A2): 가린 낱말을 잠깐 다시 보여 준다.
 *   다 채우면 「고양이 → 이양고」를 보여 주고 소리 내어 말해 보게 한다.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 글자 카드   data-track="answer" + data-item-id(문제-칸) + data-correct + data-response + (맞는 카드) data-accuracy
 *   - 다시 보기   data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '거꾸로 말해요',
    ready: '낱말을 외운 뒤, 끝 글자부터 거꾸로 놓아요.',
    start: '시작',
    look: '낱말을 잘 보고 외워요. 소리 내어 읽어 봐도 좋아요.',
    lookDone: '다 외웠어요',
    ask: '거꾸로! 끝 글자부터 눌러요.',
    askNext: '그다음 글자는?',
    miss: '다시 생각해 봐요. 끝에서부터 거꾸로예요.',
    cue: '반짝이는 카드를 눌러요.',
    hint: '다시 보기',
    hinted: '잘 보고 다시 해 봐요.',
    done: '{w} → {r}! 소리 내어 말해 봐요.',
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

  var COACH = { ready: 'jelly-default', look: 'jelly-look', ask: 'jelly-thinking', miss: 'jelly-thinking', help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer' };

  var DEFAULTS = {
    activityId: 'word-reverse',
    storageKey: null,
    rounds: [],                // [ { id, lures, words: [ { word, icon } ], count } ]
    peekMs: 1500,
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
    '.wr-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;--cream:#fff8e8;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:wr / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.wr-root *,.wr-root *::before,.wr-root *::after{box-sizing:border-box}',
    '.wr-root [hidden]{display:none!important}',
    '.wr-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    '.wr-arena{container:wrarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.wr-stage{position:absolute;inset:0;padding:5cqmin;display:grid;grid-template-rows:minmax(0,40fr) minmax(0,26fr) minmax(0,34fr);gap:3.5cqmin;align-items:center;justify-items:center}',
    '.wr-word{position:relative;width:86%;height:100%;border-radius:18px;background:var(--cream);box-shadow:0 5px 0 #d9cfa8,0 10px 16px rgba(0,0,0,.18);',
    'display:flex;align-items:center;justify-content:center;gap:5cqmin;overflow:hidden}',
    '.wr-word .wr-ico{font-size:17cqmin;line-height:1}',
    '.wr-word b{font-size:12cqmin;font-weight:900;letter-spacing:.08em;color:var(--v8);white-space:nowrap}',
    '.wr-cover{position:absolute;inset:0;display:grid;place-items:center;border-radius:18px;background:repeating-linear-gradient(135deg,#8b72ff 0 14px,#7a62f0 14px 28px);',
    'color:#fff;font-size:7cqmin;font-weight:900;transition:opacity .25s}',
    '.wr-cover.is-off{opacity:0;pointer-events:none}',
    '.wr-slots{display:flex;align-items:center;justify-content:center;gap:2.4cqmin;height:100%}',
    '.wr-slot{--sw:min(17cqmin,calc(80cqmin / var(--n, 3)));width:var(--sw);height:var(--sw);border-radius:14px;display:grid;place-items:center;',
    'background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 3px rgba(255,255,255,.35);font-size:calc(var(--sw) * .5);font-weight:900;color:#fff}',
    '.wr-slot.is-now{box-shadow:inset 0 0 0 3px var(--gold);background:rgba(255,246,214,.14)}',
    '.wr-slot.is-filled{background:#effff7;color:#14704b;box-shadow:0 4px 0 #a8dcc4,0 0 0 3px var(--mint);animation:wr-pop .35s cubic-bezier(.3,1.5,.5,1)}',
    '.wr-arrowrow{font-size:5cqmin;color:#fff6dc;opacity:.8;font-weight:900}',
    '.wr-tray{display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:2.4cqmin;height:100%;width:100%}',
    '.wr-card{--cw:min(16cqmin,calc((88cqmin - (var(--m, 4) - 1) * 2.4cqmin) / var(--m, 4)));width:var(--cw);height:var(--cw);border:0;margin:0;padding:0;border-radius:14px;cursor:pointer;',
    'font:inherit;font-size:calc(var(--cw) * .5);font-weight:900;color:var(--ink);background:var(--cream);box-shadow:0 5px 0 #d9cfa8;transition:transform .12s,opacity .2s}',
    '.wr-card:active{transform:translateY(3px);box-shadow:0 2px 0 #d9cfa8}',
    '.wr-card:focus-visible{outline:4px solid rgba(75,201,220,.8);outline-offset:3px}',
    '.wr-card.is-used{visibility:hidden;pointer-events:none}',
    '.wr-card.is-cue{animation:wr-cue 1s ease-in-out infinite}',
    '.wr-card.is-shake{animation:wr-shake .4s}',
    '.wr-off .wr-card{cursor:default}',

    '.wr-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.wr-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.wr-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.wr-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.wr-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 8px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.wr-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.wr-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.wr-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.wr-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.wr-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.wr-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.wr-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.wr-coach.is-temp .wr-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.wr-coach.is-good .wr-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.wr-steps{list-style:none;margin:0;padding:0;display:flex;justify-content:center;gap:7px}',
    '.wr-steps li{width:14px;height:14px;border-radius:50%;background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.wr-steps li.is-now{background:#fff6d6;box-shadow:inset 0 0 0 3px var(--gold)}',
    '.wr-steps li.is-done{background:var(--mint);box-shadow:none}',
    '.wr-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.wr-info-icon{font-size:clamp(30px,10cqh,48px);line-height:1}',
    '.wr-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.wr-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.wr-flip{display:flex;align-items:center;gap:10px;font-size:clamp(20px,6.5cqh,32px);font-weight:900;color:var(--v8)}',
    '.wr-flip i{font-style:normal;color:var(--gold-d)}',
    '.wr-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.wr-left{display:flex;gap:8px;margin-right:auto}',
    '.wr-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.wr-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.wr-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.wr-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.wr-btn:focus-visible,.wr-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.wr-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.wr-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.wr-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.wr-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.wr-end .wr-btns{margin:0;justify-content:center}',
    '.wr-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.wr-stamps .wr-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.wr-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.wr-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '@keyframes wr-pop{from{transform:scale(.5)}}',
    '@keyframes wr-cue{50%{box-shadow:0 5px 0 #d9cfa8,0 0 0 5px var(--gold),0 0 20px rgba(255,210,63,.85)}}',
    '@keyframes wr-shake{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}',

    '@container wr (max-aspect-ratio:5/4){',
    '.wr-wrap{--arena:min(calc(100cqw - 24px),56cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.wr-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.wr-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('wr-style')) return;
    var s = document.createElement('style');
    s.id = 'wr-style';
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
    hide: function () { tones([523, 392], 0.08, 'sine', 0.09); },
    place: function (k) { tones([[784, 659, 587, 523, 440][k % 5]], 0.08, 'sine', 0.12); },
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

    var root = h('div', 'wr-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'primary');
    root.innerHTML =
      '<div class="wr-wrap">' +
        '<div class="wr-arena wr-off"><div class="wr-stage">' +
          '<div class="wr-word"><span class="wr-ico"></span><b></b><div class="wr-cover">🙈</div></div>' +
          '<div class="wr-slots" aria-label="거꾸로 놓을 칸"></div>' +
          '<div class="wr-tray" role="group" aria-label="글자 카드"></div>' +
        '</div></div>' +
        '<aside class="wr-side">' +
          '<div class="wr-top">' +
            '<span class="wr-title">' + esc(T.title) + '</span>' +
            '<ol class="wr-rounds" aria-label="판"></ol>' +
            '<button type="button" class="wr-sound" data-wr-act="sound"></button>' +
          '</div>' +
          '<div class="wr-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="wr-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="wr-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<ol class="wr-steps" aria-label="문제"></ol>' +
          '<div class="wr-info"></div>' +
          '<div class="wr-actions"><div class="wr-left"></div><div class="wr-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="wr-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="wr-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="wr-end-line"></p><div class="wr-stamps"></div><div class="wr-btns"></div>' +
        (o.credit ? '<p class="wr-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'wr-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.wr-rounds'), elSound = $('.wr-sound'), elArena = $('.wr-arena'), elWord = $('.wr-word'), elIco = $('.wr-ico'),
        elWordB = $('.wr-word b'), elCover = $('.wr-cover'), elSlots = $('.wr-slots'), elTray = $('.wr-tray'),
        elCoach = $('.wr-coach'), elCoachImg = $('.wr-coach-img'), elBubble = $('.wr-bubble'), elSteps = $('.wr-steps'),
        elInfo = $('.wr-info'), elLeft = $('.wr-left'), elActs = $('.wr-side .wr-btns'), elEnd = $('.wr-end');

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
      elCoach.className = 'wr-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood) {
      say(text, mood, 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1600);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'wr-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-wr-act', act);
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
        var li = h('li', 'wr-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), (i + 1) + '판');
        li.setAttribute('aria-label', (i + 1) + '판' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function paintSteps() {
      elSteps.innerHTML = '';
      R.r.words.forEach(function (w, i) {
        elSteps.appendChild(h('li', i < R.qi ? 'is-done' : (i === R.qi && R.phase !== 'ready' && R.phase !== 'round-done' ? 'is-now' : '')));
      });
    }
    function info(icon, big, small) {
      elInfo.innerHTML = '';
      elInfo.appendChild(h('span', 'wr-info-icon', icon));
      elInfo.appendChild(h('b', 'wr-info-big', esc(big)));
      if (small) elInfo.appendChild(h('span', 'wr-info-small', esc(small)));
    }
    function infoFlip(word, rev, showRev) {
      elInfo.innerHTML = '';
      var f = h('div', 'wr-flip');
      f.appendChild(h('span', '', esc(word)));
      f.appendChild(h('i', '', '➜'));
      f.appendChild(h('span', '', showRev ? esc(rev) : '?'));
      elInfo.appendChild(f);
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var r = rounds[i];
      R = { r: r, qi: 0, phase: 'ready', sayText: '', sayMood: 'ready', tally: { accurate: 0, 'self-corrected': 0, support: 0 } };
      paintRounds(i);
      paintSteps();
      elArena.classList.add('wr-off');
      elIco.textContent = '🔄';
      elWordB.textContent = '';
      elCover.classList.add('is-off');
      elSlots.innerHTML = '';
      elTray.innerHTML = '';
      var len = r.words.length ? r.words[0].word.length : 2;
      info('🔄', (i + 1) + '판 · ' + len + '글자 낱말', r.words.length + '낱말을 거꾸로');
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    /* 낱말 보여 주기(외우기) */
    function look() {
      var w = R.r.words[R.qi];
      R.w = w;
      R.rev = w.word.split('').reverse();
      R.phase = 'look';
      R.tLook = now();
      R.pos = 0; R.misses = 0; R.posMiss = 0; R.helps = 0; R.peeks = 0; R.cued = false;
      elArena.classList.remove('wr-off');
      elIco.textContent = w.icon || '';
      elWordB.textContent = w.word;
      elCover.classList.add('is-off');
      elSlots.style.setProperty('--n', R.rev.length);
      elSlots.innerHTML = '';
      R.rev.forEach(function (s, i) {
        var d = h('span', 'wr-slot');
        d.setAttribute('aria-label', (i + 1) + '번째 칸');
        elSlots.appendChild(d);
      });
      elTray.innerHTML = '';
      infoFlip(w.word, '', false);
      paintSteps();
      say(T.look, 'look');
      setActions([button('🙈 ' + esc(T.lookDone), 'hide')], []);
      log('game-item-ready', { itemId: itemId(), word: w.word, syllables: w.word.length, engine: 'word-reverse@' + VERSION });
    }
    function itemId() { return R.r.id + '-' + (R.qi + 1); }

    /* 가리고 거꾸로 놓기 */
    function hideWord() {
      R.phase = 'pick';
      R.lookMs = Math.round(now() - R.tLook);
      elCover.classList.remove('is-off');
      sfx('hide');
      /* 카드: 낱말 글자 + 미끼 */
      var syl = R.w.word.split(''), lures = shuffle((R.r.lurePool || []).filter(function (x) { return syl.indexOf(x) < 0; })).slice(0, R.r.lures || 0);
      var cards = shuffle(syl.concat(lures));
      /* 받침에 이미 거꾸로(정답) 순서로 놓이지 않게 */
      for (var t = 0; t < 10 && cards.slice(0, R.rev.length).join('') === R.rev.join(''); t++) cards = shuffle(cards);
      elTray.style.setProperty('--m', cards.length);
      elTray.innerHTML = '';
      cards.forEach(function (s, i) {
        var b = h('button', 'wr-card', esc(s));
        b.type = 'button';
        b.setAttribute('data-s', s);
        b.setAttribute('data-i', i);
        b.setAttribute('aria-label', s);
        elTray.appendChild(b);
      });
      R.tAsk = R.tPick = now();
      infoFlip('🙈', '', false);
      markSlot();
      say(T.ask, 'ask');
      setActions([], [hintButton()]);
      tagCards();
    }
    function markSlot() {
      Array.prototype.forEach.call(elSlots.children, function (s, i) { s.classList.toggle('is-now', i === R.pos); });
    }
    function accNow() { return R.helps ? 'support' : (R.posMiss ? 'self-corrected' : 'accurate'); }
    function tagCards() {
      var want = R.rev[R.pos], first = null;
      Array.prototype.forEach.call(elTray.querySelectorAll('.wr-card'), function (b) {
        if (b.classList.contains('is-used')) { b.removeAttribute('data-track'); return; }
        var right = b.getAttribute('data-s') === want;
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', itemId() + '-' + (R.pos + 1));
        b.setAttribute('data-response', b.getAttribute('data-s'));
        b.setAttribute('data-correct', right ? 'true' : 'false');
        if (right && !first) { first = b; b.setAttribute('data-accuracy', accNow()); } else b.removeAttribute('data-accuracy');
      });
    }
    function hintButton() {
      return button('👀 ' + esc(T.hint), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'peek-word', 'data-item-id': itemId()
      });
    }

    function onCard(b) {
      if (!R || R.phase !== 'pick' || b.classList.contains('is-used')) return;
      var s = b.getAttribute('data-s'), want = R.rev[R.pos], t = now();
      if (s === want) {
        log('game-response', { itemId: itemId() + '-' + (R.pos + 1), slot: R.pos + 1, target: want, response: s, correct: true, attempt: R.posMiss + 1, accuracy: accNow(), responseMs: Math.round(t - R.tAsk) });
        b.classList.remove('is-cue');
        b.classList.add('is-used');
        var slot = elSlots.children[R.pos];
        slot.textContent = s;
        slot.classList.add('is-filled');
        sfx('place', R.pos);
        R.pos++;
        R.posMiss = 0; R.cued = false; R.tAsk = t;
        Array.prototype.forEach.call(elTray.querySelectorAll('.is-cue'), function (x) { x.classList.remove('is-cue'); });
        if (R.pos >= R.rev.length) { done(); return; }
        markSlot();
        say(T.askNext, 'ask');
        tagCards();
        return;
      }
      R.posMiss++;
      R.misses++;
      sfx('miss');
      var w = R.w.word, errorType = w.indexOf(s) < 0 ? 'lure' : (w.charAt(R.pos) === s ? 'forward-order' : 'wrong-syllable');
      log('game-response', { itemId: itemId() + '-' + (R.pos + 1), slot: R.pos + 1, target: want, response: s, correct: false, attempt: R.posMiss, errorType: errorType, responseMs: Math.round(t - R.tAsk) });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake');
      later(function () { b.classList.remove('is-shake'); }, 420);
      if (R.posMiss >= 2 && !R.cued) {
        R.cued = true;
        R.helps++;
        var r = elTray.querySelector('.wr-card:not(.is-used)[data-s="' + want + '"]');
        if (r) r.classList.add('is-cue');
        log('game-help', { itemId: itemId() + '-' + (R.pos + 1), helpLevel: 'A4', helpType: 'cue-card', trigger: 'second-miss' });
        say(T.cue, 'help');
      } else {
        sayTemp(T.miss, 'miss');
      }
      tagCards();
    }

    function doHint() {
      if (!R || R.phase !== 'pick') return;
      R.helps++;
      R.peeks++;
      sfx('show');
      elCover.classList.add('is-off');
      say(T.hinted, 'help');
      log('game-help', { itemId: itemId(), helpLevel: 'A2', helpType: 'peek-word', trigger: 'child-request', slot: R.pos + 1 });
      tagCards();
      later(function () { if (R.phase === 'pick') { elCover.classList.remove('is-off'); say(T.ask, 'ask'); } }, o.peekMs);
    }

    function done() {
      var w = R.w, acc = R.helps ? 'support' : (R.misses ? 'self-corrected' : 'accurate');
      R.phase = 'done';
      elArena.classList.add('wr-off');
      elCover.classList.add('is-off');
      Array.prototype.forEach.call(elSlots.children, function (s) { s.classList.remove('is-now'); });
      setActions([], []);
      sfx('done');
      R.tally[acc]++;
      infoFlip(w.word, R.rev.join(''), true);
      say(fmt(T.done, { w: w.word, r: R.rev.join('') }), 'good', 'is-good');
      var summary = { itemId: itemId(), word: w.word, accuracy: acc, misses: R.misses, helps: R.helps, peeks: R.peeks, lookMs: R.lookMs, totalMs: Math.round(now() - R.tPick) };
      results.push(summary);
      log('game-item-complete', summary);
      later(function () {
        R.qi++;
        if (R.qi < R.r.words.length) look();
        else roundDone();
      }, o.nextMs);
    }

    function roundDone() {
      R.phase = 'round-done';
      paintSteps();
      var left = rounds.length - ri - 1;
      info('🎉', fmt(T.infoDone, { n: ri + 1 }), left ? fmt(T.infoLeft, { n: left }) : T.infoLast);
      var sum = { roundId: R.r.id, items: R.r.words.length, accurate: R.tally.accurate, selfCorrected: R.tally['self-corrected'], support: R.tally.support };
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
      elEnd.querySelector('.wr-end-line').textContent = fmt(T.endLine, { n: rounds.length });
      var st = elEnd.querySelector('.wr-stamps');
      st.innerHTML = '';
      rounds.forEach(function (r, i) { st.appendChild(h('span', 'wr-dot is-done', (i + 1) + '판')); });
      var acts = elEnd.querySelector('.wr-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      var tally = { accurate: 0, 'self-corrected': 0, support: 0 };
      results.forEach(function (r) { tally[r.accuracy]++; });
      log('game-activity-complete', { rounds: rounds.length, items: results.length, accurate: tally.accurate, selfCorrected: tally['self-corrected'], support: tally.support });
      if (typeof o.onFinish === 'function') { try { o.onFinish(results.slice()); } catch (e) {} }
    }

    function restart() {
      clearTimers();
      /* 미끼 글자는 모든 판의 낱말 글자에서 */
      var pool = [];
      o.rounds.forEach(function (r) { (r.words || []).forEach(function (w) { w.word.split('').forEach(function (s) { if (pool.indexOf(s) < 0) pool.push(s); }); }); });
      rounds = o.rounds.map(function (r, i) {
        return { id: r.id || ('r' + (i + 1)), lures: r.lures || 0, lurePool: pool, words: shuffle(r.words || []).slice(0, r.count || 4) };
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
      if (name === 'start' && R.phase === 'ready') look();
      else if (name === 'hide' && R.phase === 'look') hideWord();
      else if (name === 'hint') doHint();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-wr-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-wr-act')); return; }
      var c = e.target.closest('.wr-card');
      if (c && root.contains(c)) onCard(c);
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

  global.WordReverse = { version: VERSION, mount: mount };
})(window);
