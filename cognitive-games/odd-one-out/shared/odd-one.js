/*!
 * 「다른 하나 찾기」 관련성 찾기 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 4장 집행력 「관련성 찾기 1~6」(119~124쪽)
 *            (낱말·그림 가운데 특성이 다른 하나를 찾고, 어떤 점이 다른지 말해 보기) — 활동 방식만 가져왔다.
 *
 * 한 문제: 그림 4~5장 가운데 무리와 다른 하나를 누른다 → 「왜 다를까요?」 이유 두 개 가운데 맞는 것을 고른다.
 *   이유를 고르는 단계는 문제에 why가 있을 때만 나온다.
 *   누르는 순간 판정. 어긋나면 1번째 = 그 카드가 흐려지고 다시 / 2번째 = 다른 하나가 금색으로 반짝(A4).
 *   「힌트」(아이가 고름, 도움 A2): 같은 무리 두 장에 초록 점선 테를 둘러 준다.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 그림 카드   data-track="answer" + data-item-id + data-correct + data-response + (다른 하나) data-accuracy
 *   - 이유 단추   data-track="answer" + data-item-id(문제-why) + data-correct + data-response + (맞는 이유) data-accuracy
 *   - 힌트        data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '다른 하나 찾기',
    ready: '그림 가운데 하나만 달라요. 다른 하나를 찾아요.',
    start: '시작',
    ask: '다른 하나를 찾아요.',
    miss: '다시 살펴봐요. 나머지는 어떤 점이 같을까요?',
    cue: '반짝이는 그림을 살펴봐요.',
    hint: '힌트',
    hinted: '초록 테 두 장은 같은 무리예요.',
    found: '{x} 찾았어요!',
    why: '왜 다를까요?',
    whyMiss: '다시 생각해 봐요.',
    good: ['맞아요!', '좋아요!', '그렇지요!'],
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoReady: '{n}장 가운데 하나',
    infoReadySmall: '{q}문제를 풀어요',
    infoAsk: '하나만 달라요',
    infoAskSmall: '나머지는 같은 무리예요',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = { ready: 'jelly-default', ask: 'jelly-look', miss: 'jelly-thinking', help: 'jelly-puzzle', why: 'jelly-thinking', good: 'jelly-praise', end: 'jelly-cheer' };

  var DEFAULTS = {
    activityId: 'odd-one-out',
    storageKey: null,
    cards: {},                 // { key: { label, img | emoji } }
    rounds: [],                // [ { id, items: [ { id, same:[key…], odd:key, why:[맞는 이유, 틀린 이유], say } ] } ]
    nextMs: 1700,
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
    '.oo-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;--cream:#fff8e8;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:oo / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.oo-root *,.oo-root *::before,.oo-root *::after{box-sizing:border-box}',
    '.oo-root [hidden]{display:none!important}',
    '.oo-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    '.oo-arena{container:ooarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.oo-cards{position:absolute;inset:0;padding:4cqmin;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:4cqmin}',
    '.oo-card{--cw:41cqmin;position:relative;width:var(--cw);height:calc(var(--cw) * 1.05);border:0;padding:6% 6% 4%;margin:0;border-radius:16px;cursor:pointer;',
    'font:inherit;color:var(--ink);background:var(--cream);box-shadow:0 5px 0 #d9cfa8,0 10px 16px rgba(0,0,0,.18);',
    'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2%;transition:transform .12s,opacity .2s}',
    '.oo-cards.is-5{gap:2.5cqmin}',
    '.oo-cards.is-5 .oo-card{--cw:28cqmin;border-radius:13px}',
    '.oo-cards.is-3 .oo-card{--cw:40cqmin}',
    '.oo-card:active{transform:translateY(3px);box-shadow:0 2px 0 #d9cfa8}',
    '.oo-card:focus-visible{outline:4px solid rgba(75,201,220,.8);outline-offset:3px}',
    '.oo-card img{width:100%;min-height:0;flex:1 1 auto;object-fit:contain}',
    '.oo-card .oo-emo{flex:1 1 auto;display:grid;place-items:center;font-size:calc(var(--cw) * .5);line-height:1}',
    '.oo-card b{font-size:max(13px,calc(var(--cw) * .12));font-weight:900;letter-spacing:-.03em;line-height:1.2;white-space:nowrap}',
    '.oo-card.is-gone{opacity:.32;pointer-events:none;filter:grayscale(.6)}',
    '.oo-card.is-pair{box-shadow:0 5px 0 #d9cfa8,0 0 0 4px #fff,0 0 0 8px var(--mint)}',
    '.oo-card.is-pair::after{content:"";position:absolute;inset:-9px;border:3px dashed #3ddc97;border-radius:22px;pointer-events:none}',
    '.oo-card.is-same{box-shadow:0 5px 0 #a8dcc4,0 0 0 4px var(--mint);background:#effff7}',
    '.oo-card.is-odd{background:#fff6d6;box-shadow:0 5px 0 var(--gold-d),0 0 0 5px var(--gold),0 0 24px rgba(255,210,63,.65);animation:oo-pop .4s cubic-bezier(.3,1.5,.5,1)}',
    '.oo-card.is-cue{animation:oo-cue 1s ease-in-out infinite}',
    '.oo-card.is-shake{animation:oo-shake .4s}',
    '.oo-done .oo-card{cursor:default}',

    '.oo-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.oo-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.oo-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.oo-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.oo-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 8px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.oo-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.oo-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.oo-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.oo-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.oo-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.oo-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.oo-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.oo-coach.is-temp .oo-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.oo-coach.is-good .oo-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.oo-steps{list-style:none;margin:0;padding:0;display:flex;justify-content:center;gap:7px}',
    '.oo-steps li{width:14px;height:14px;border-radius:50%;background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.oo-steps li.is-now{background:#fff6d6;box-shadow:inset 0 0 0 3px var(--gold)}',
    '.oo-steps li.is-done{background:var(--mint);box-shadow:none}',
    '.oo-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.oo-info-icon{font-size:clamp(30px,10cqh,48px);line-height:1}',
    '.oo-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.oo-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.oo-why{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:10px}',
    '.oo-reason{width:100%;min-height:clamp(48px,14cqh,64px);border:0;border-radius:16px;padding:8px 14px;font:inherit;font-size:clamp(15px,4.4cqh,20px);font-weight:900;',
    'letter-spacing:-.03em;line-height:1.3;color:var(--ink);background:#fff;box-shadow:0 4px 0 var(--v3),inset 0 0 0 2px var(--v1);cursor:pointer;text-align:center}',
    '.oo-reason:active{transform:translateY(2px);box-shadow:0 2px 0 var(--v3)}',
    '.oo-reason:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',
    '.oo-reason.is-right{background:#eafff5;color:#14704b;box-shadow:0 4px 0 #a8dcc4,inset 0 0 0 3px var(--mint)}',
    '.oo-reason.is-gone{opacity:.35;pointer-events:none}',
    '.oo-reason.is-shake{animation:oo-shake .4s}',
    '.oo-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.oo-left{display:flex;gap:8px;margin-right:auto}',
    '.oo-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.oo-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.oo-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.oo-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.oo-btn:focus-visible,.oo-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.oo-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.oo-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.oo-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.oo-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.oo-end .oo-btns{margin:0;justify-content:center}',
    '.oo-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.oo-stamps .oo-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.oo-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.oo-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '@keyframes oo-pop{from{transform:scale(.85)}}',
    '@keyframes oo-cue{50%{box-shadow:0 5px 0 #d9cfa8,0 0 0 6px var(--gold),0 0 22px rgba(255,210,63,.8)}}',
    '@keyframes oo-shake{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}',

    '@container oo (max-aspect-ratio:5/4){',
    '.oo-wrap{--arena:min(calc(100cqw - 24px),52cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.oo-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.oo-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('oo-style')) return;
    var s = document.createElement('style');
    s.id = 'oo-style';
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
  /* 받침 있으면 '을', 없으면 '를' */
  function obj(word) {
    var c = String(word).charCodeAt(String(word).length - 1);
    if (c < 0xac00 || c > 0xd7a3) return word + '를';
    return word + ((c - 0xac00) % 28 ? '을' : '를');
  }
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
    good: function () { tones([660, 880], 0.08, 'sine', 0.13); },
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
    function sfx(name) { if (soundOn) SFX[name](); }

    function log(type, detail) {
      var d = { type: type, schemaVersion: '0.2', activityId: o.activityId };
      for (var key in detail) d[key] = detail[key];
      try { global.dispatchEvent(new CustomEvent('oncuvate:log', { detail: d })); } catch (e) {}
      if (o.debug && global.console) console.log('[oncuvate:log]', d);
    }
    function coachSrc(mood) { return o.coachBase ? o.coachBase + COACH[mood] + o.coachExt : ''; }
    if (o.coachBase) Object.keys(COACH).forEach(function (m) { var im = new Image(); im.src = coachSrc(m); });
    function card(key) { return o.cards[key] || { label: key }; }

    var root = h('div', 'oo-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="oo-wrap">' +
        '<div class="oo-arena"><div class="oo-cards" role="group" aria-label="그림 카드"></div></div>' +
        '<aside class="oo-side">' +
          '<div class="oo-top">' +
            '<span class="oo-title">' + esc(T.title) + '</span>' +
            '<ol class="oo-rounds" aria-label="판"></ol>' +
            '<button type="button" class="oo-sound" data-oo-act="sound"></button>' +
          '</div>' +
          '<div class="oo-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="oo-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="oo-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<ol class="oo-steps" aria-label="문제"></ol>' +
          '<div class="oo-info" hidden></div>' +
          '<div class="oo-why" hidden></div>' +
          '<div class="oo-actions"><div class="oo-left"></div><div class="oo-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="oo-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="oo-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="oo-end-line"></p><div class="oo-stamps"></div><div class="oo-btns"></div>' +
        (o.credit ? '<p class="oo-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'oo-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.oo-rounds'), elSound = $('.oo-sound'), elArena = $('.oo-arena'), elCards = $('.oo-cards'),
        elCoach = $('.oo-coach'), elCoachImg = $('.oo-coach-img'), elBubble = $('.oo-bubble'), elSteps = $('.oo-steps'),
        elInfo = $('.oo-info'), elWhy = $('.oo-why'), elLeft = $('.oo-left'), elActs = $('.oo-side .oo-btns'), elEnd = $('.oo-end');

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
      elCoach.className = 'oo-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood) {
      say(text, mood, 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1600);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'oo-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-oo-act', act);
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
        var li = h('li', 'oo-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), (i + 1) + '판');
        li.setAttribute('aria-label', (i + 1) + '판' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function paintSteps() {
      elSteps.innerHTML = '';
      R.r.items.forEach(function (it, i) {
        var li = h('li', i < R.qi ? 'is-done' : (i === R.qi && R.phase !== 'ready' ? 'is-now' : ''));
        elSteps.appendChild(li);
      });
      elSteps.setAttribute('aria-label', R.r.items.length + '문제 가운데 ' + Math.min(R.qi + 1, R.r.items.length) + '번째');
    }
    function showInfo(icon, big, small) {
      elInfo.innerHTML = '';
      if (!icon) { elInfo.hidden = true; return; }
      elInfo.appendChild(h('span', 'oo-info-icon', icon));
      elInfo.appendChild(h('b', 'oo-info-big', esc(big)));
      if (small) elInfo.appendChild(h('span', 'oo-info-small', esc(small)));
      elInfo.hidden = false;
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var r = rounds[i];
      R = { r: r, qi: 0, phase: 'ready', sayText: '', sayMood: 'ready', tally: { accurate: 0, 'self-corrected': 0, support: 0 } };
      paintRounds(i);
      paintSteps();
      elCards.innerHTML = '';
      elWhy.hidden = true;
      var n = r.items[0].same.length + 1;
      showInfo('🔍', fmt(T.infoReady, { n: n }), fmt(T.infoReadySmall, { q: r.items.length }));
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    /* 한 문제 보여 주기 */
    function ask() {
      var it = R.r.items[R.qi];
      var keys = shuffle(it.same.concat([it.odd]));
      R.it = it;
      R.phase = 'pick';
      R.miss = 0; R.whyMiss = 0; R.helps = 0; R.hintUsed = false; R.cued = false;
      R.tItem = R.tAsk = now();
      elCards.className = 'oo-cards is-' + Math.min(Math.max(keys.length, 3), 5);
      elCards.innerHTML = '';
      keys.forEach(function (key) {
        var c = card(key);
        var b = h('button', 'oo-card');
        b.type = 'button';
        b.setAttribute('data-key', key);
        b.setAttribute('aria-label', c.label);
        b.innerHTML = (c.img ? '<img alt="" src="' + esc(c.img) + '">' : '<span class="oo-emo">' + esc(c.emoji || '❔') + '</span>') + '<b>' + esc(c.label) + '</b>';
        elCards.appendChild(b);
      });
      elArena.classList.remove('oo-done');
      tagCards();
      elWhy.hidden = true;
      showInfo('🧐', T.infoAsk, T.infoAskSmall);
      paintSteps();
      say(it.ask || T.ask, 'ask');
      setActions([], [hintButton()]);
      log('game-item-ready', { itemId: it.id, step: 'odd', cards: keys.join(','), odd: it.odd, size: keys.length, engine: 'odd-one@' + VERSION });
    }
    function accNow(misses) { return R.helps ? 'support' : (misses ? 'self-corrected' : 'accurate'); }
    function tagCards() {
      Array.prototype.forEach.call(elCards.children, function (b) {
        var key = b.getAttribute('data-key'), right = key === R.it.odd;
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', R.it.id);
        b.setAttribute('data-response', card(key).label);
        b.setAttribute('data-correct', right ? 'true' : 'false');
        if (right) b.setAttribute('data-accuracy', accNow(R.miss)); else b.removeAttribute('data-accuracy');
      });
    }
    function hintButton() {
      var b = button('💡 ' + esc(T.hint), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'same-pair', 'data-item-id': R.it.id
      });
      if (R.hintUsed) b.hidden = true;
      return b;
    }

    function onCard(b) {
      if (!R || R.phase !== 'pick' || b.classList.contains('is-gone')) return;
      var key = b.getAttribute('data-key'), it = R.it, right = key === it.odd, t = now();
      if (right) {
        var acc = accNow(R.miss);
        log('game-response', { itemId: it.id, step: 'odd', response: key, correct: true, attempt: R.miss + 1, accuracy: acc, responseMs: Math.round(t - R.tAsk) });
        R.oddAcc = acc;
        found(b);
        return;
      }
      R.miss++;
      sfx('miss');
      log('game-response', { itemId: it.id, step: 'odd', response: key, correct: false, attempt: R.miss, errorType: 'same-group', responseMs: Math.round(t - R.tAsk) });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake');
      later(function () { b.classList.remove('is-shake'); b.classList.add('is-gone'); }, 380);
      if (R.miss >= 2 && !R.cued) {
        R.cued = true;
        R.helps++;
        var oddEl = elCards.querySelector('[data-key="' + it.odd + '"]');
        if (oddEl) oddEl.classList.add('is-cue');
        log('game-help', { itemId: it.id, helpLevel: 'A4', helpType: 'cue-odd', trigger: 'second-miss' });
        say(T.cue, 'help');
      } else {
        sayTemp(T.miss, 'miss');
      }
      tagCards();
    }

    function found(b) {
      var it = R.it;
      sfx('good');
      Array.prototype.forEach.call(elCards.children, function (c) {
        c.classList.remove('is-cue', 'is-pair', 'is-gone');
        c.classList.add(c === b ? 'is-odd' : 'is-same');
      });
      elArena.classList.add('oo-done');
      setActions([], []);
      if (it.why && it.why.length >= 2) {
        R.phase = 'why';
        R.tAsk = now();
        say(fmt(T.found, { x: obj(card(it.odd).label) }) + ' ' + T.why, 'why');
        elInfo.hidden = true;
        elWhy.innerHTML = '';
        shuffle(it.why.map(function (w, i) { return { text: w, right: i === 0 }; })).forEach(function (w) {
          var rb = h('button', 'oo-reason', esc(w.text));
          rb.type = 'button';
          rb.setAttribute('data-right', w.right ? '1' : '0');
          rb.setAttribute('data-track', 'answer');
          rb.setAttribute('data-item-id', it.id + '-why');
          rb.setAttribute('data-response', w.text);
          rb.setAttribute('data-correct', w.right ? 'true' : 'false');
          if (w.right) rb.setAttribute('data-accuracy', R.helps ? 'support' : 'accurate');
          elWhy.appendChild(rb);
        });
        elWhy.hidden = false;
        log('game-item-ready', { itemId: it.id + '-why', step: 'why', options: it.why.length });
      } else {
        R.phase = 'done';
        itemDone();
      }
    }

    function onReason(b) {
      if (!R || R.phase !== 'why' || b.classList.contains('is-gone')) return;
      var it = R.it, right = b.getAttribute('data-right') === '1', t = now();
      if (right) {
        var acc = R.helps ? 'support' : (R.whyMiss ? 'self-corrected' : 'accurate');
        log('game-response', { itemId: it.id + '-why', step: 'why', response: it.why[0], correct: true, attempt: R.whyMiss + 1, accuracy: acc, responseMs: Math.round(t - R.tAsk) });
        b.classList.add('is-right');
        Array.prototype.forEach.call(elWhy.children, function (x) { if (x !== b) x.classList.add('is-gone'); });
        R.phase = 'done';
        itemDone();
        return;
      }
      R.whyMiss++;
      sfx('miss');
      log('game-response', { itemId: it.id + '-why', step: 'why', response: b.textContent, correct: false, attempt: R.whyMiss, errorType: 'reason', responseMs: Math.round(t - R.tAsk) });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake');
      later(function () { b.classList.remove('is-shake'); b.classList.add('is-gone'); }, 380);
      Array.prototype.forEach.call(elWhy.children, function (x) {
        if (x.getAttribute('data-right') === '1') x.setAttribute('data-accuracy', R.helps ? 'support' : 'self-corrected');
      });
      sayTemp(T.whyMiss, 'miss');
    }

    function itemDone() {
      var it = R.it;
      var misses = R.miss + R.whyMiss;
      var acc = R.helps ? 'support' : (misses ? 'self-corrected' : 'accurate');
      R.tally[acc]++;
      var summary = { itemId: it.id, accuracy: acc, misses: R.miss, whyMisses: R.whyMiss, helps: R.helps, hint: R.hintUsed, totalMs: Math.round(now() - R.tItem) };
      results.push(summary);
      log('game-item-complete', summary);
      sfx('done');
      say(it.say || (it.why ? pick(T.good) + ' ' + it.why[0] + '.' : pick(T.good)), 'good', 'is-good');
      R.qi++;
      paintSteps();
      later(function () {
        if (R.qi < R.r.items.length) ask();
        else roundDone();
      }, o.nextMs);
    }

    function roundDone() {
      R.phase = 'round-done';
      elWhy.hidden = true;
      var left = rounds.length - ri - 1;
      showInfo('🎉', fmt(T.infoDone, { n: ri + 1 }), left ? fmt(T.infoLeft, { n: left }) : T.infoLast);
      var sum = { roundId: R.r.id, items: R.r.items.length, accurate: R.tally.accurate, selfCorrected: R.tally['self-corrected'], support: R.tally.support };
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(sum); } catch (e) {} }
      say(pick(T.good), 'good', 'is-good');
      var last = ri === rounds.length - 1;
      setActions([button(last ? '🏁 ' + esc(T.finish) : esc(T.next) + ' ▶', last ? 'finish' : 'next')], []);
      paintRounds(ri + 1);
    }

    function doHint() {
      if (!R || R.phase !== 'pick' || R.hintUsed) return;
      var it = R.it;
      R.hintUsed = true;
      R.helps++;
      sfx('show');
      var pair = shuffle(Array.prototype.filter.call(elCards.children, function (c) {
        return c.getAttribute('data-key') !== it.odd && !c.classList.contains('is-gone');
      })).slice(0, 2);
      pair.forEach(function (c) { c.classList.add('is-pair'); });
      say(T.hinted, 'help');
      setActions([], [hintButton()]);
      tagCards();
      log('game-help', { itemId: it.id, helpLevel: 'A2', helpType: 'same-pair', trigger: 'child-request', pair: pair.map(function (c) { return c.getAttribute('data-key'); }).join(',') });
    }

    function finish() {
      elEnd.hidden = false;
      ri = rounds.length;
      paintRounds(rounds.length);
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.oo-end-line').textContent = fmt(T.endLine, { n: rounds.length });
      var st = elEnd.querySelector('.oo-stamps');
      st.innerHTML = '';
      rounds.forEach(function (r, i) { st.appendChild(h('span', 'oo-dot is-done', (i + 1) + '판')); });
      var acts = elEnd.querySelector('.oo-btns');
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
        return { id: r.id || ('r' + (i + 1)), items: (r.shuffle === false ? r.items : shuffle(r.items)).slice() };
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
      var b = e.target.closest('[data-oo-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-oo-act')); return; }
      var c = e.target.closest('.oo-card');
      if (c && root.contains(c)) { onCard(c); return; }
      var r = e.target.closest('.oo-reason');
      if (r && root.contains(r)) onReason(r);
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

  global.OddOne = { version: VERSION, mount: mount };
})(window);
