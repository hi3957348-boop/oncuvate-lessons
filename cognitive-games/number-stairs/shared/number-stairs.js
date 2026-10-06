/*!
 * 「숫자 계단」 숫자 빼기 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 1장 작업기억 「숫자 거꾸로 세기, 숫자 빼기」(61~68쪽)
 *            (100부터 2·3·5·7씩 뺀 숫자를 암산으로 말하며 숫자판에서 짚는다) — 활동 방식만 가져왔다.
 *
 * 한 판: 시작 수(예 100)에서 step씩 빼며 count번 숫자판을 짚는다. 짚는 순간 판정.
 *   오른쪽에 「97 − 3 = ?」 식과 지금까지 내려온 계단(100 → 97 → …)이 보인다.
 *   어긋나면 1번째 : 칸이 흔들리고 「다시 계산해 봐요」
 *            2번째 : 맞는 칸이 금색으로 반짝(도움 A4)
 *   「하나씩 세어 보기」(아이가 고름, 도움 A3): 지금 수에서 하나씩 짚으며 step만큼 내려가 보여 준다.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 숫자 칸        data-track="answer" + data-item-id(판-몇째) + data-correct + data-response + (맞는 칸) data-accuracy
 *   - 하나씩 세어 보기 data-track="hint" data-help-level="A3"
 *   - 끝 화면        data-track="activity-complete"
 *   - 자세한 신호    oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '숫자 계단',
    ready: '{s}에서 {k}씩 빼요. 머릿속으로 계산해서 숫자판에서 콕 짚어요.',
    start: '시작',
    run: '{k}씩 빼서 다음 수를 콕!',
    oops: '다시 계산해 봐요.',
    cue: '반짝이는 칸이에요.',
    count: '하나씩 세어 보기',
    counting: '하나씩 세어 봐요.',
    good: ['좋아요!', '딱 맞아요!', '척척이에요!'],
    allDone: '{n}계단 모두 내려왔어요!',
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoBig: '{s}에서 {k}씩 빼기',
    infoSmall: '{n}계단 내려가요',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = { ready: 'jelly-default', run: 'jelly-default', oops: 'jelly-thinking', help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer' };

  var DEFAULTS = {
    activityId: 'number-stairs',
    storageKey: null,
    rounds: [],                // [ {id, start:100, step:3, count:10, low:1} ]
    countMs: 420,              // 하나씩 세어 보기: 한 칸 짚는 시간
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
    '.nd-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--coral:#ff8a80;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:nd / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.nd-root *,.nd-root *::before,.nd-root *::after{box-sizing:border-box}',
    '.nd-root [hidden]{display:none!important}',
    '.nd-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    /* 숫자판 */
    '.nd-arena{container:ndarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'display:flex;align-items:center;justify-content:center;padding:3.2cqmin;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.nd-board{--rows:10;--g:max(2px,.7cqmin);position:relative;z-index:2;width:100%;height:100%;display:grid;gap:var(--g);',
    'grid-template-columns:repeat(10,minmax(0,1fr));grid-template-rows:repeat(var(--rows),minmax(0,1fr))}',
    '.nd-cell{container-type:size;position:relative;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;border:0;padding:0;',
    'border-radius:max(5px,1.3cqmin);font:inherit;font-weight:850;color:#2b2140;background:#fffaf0;cursor:pointer;touch-action:manipulation;',
    'box-shadow:inset 0 -2px 0 #efe6d2;transition:background .15s,transform .12s}',
    '.nd-cell b{font-size:clamp(9px,46cqmin,22px);letter-spacing:-.04em;font-variant-numeric:tabular-nums;pointer-events:none}',
    '.nd-cell:hover{background:#fff}',
    '.nd-cell:focus-visible{outline:3px solid var(--gold);outline-offset:1px}',
    '.nd-cell.is-blank{visibility:hidden}',
    '.nd-cell.is-start,.nd-cell.is-step{color:#3b2a9e;background:linear-gradient(180deg,#ffe98a,#ffd23f);box-shadow:inset 0 -2px 0 var(--gold-d)}',
    '.nd-cell.is-step{background:linear-gradient(180deg,#d7f8e9,#9eeccb);color:#0f6b46;box-shadow:inset 0 -2px 0 #3ddc97}',
    '.nd-cell.is-now{outline:3px solid var(--gold);outline-offset:1px;z-index:2}',
    '.nd-cell.is-no{background:#ffe1dd;animation:nd-wob .4s ease-in-out}',
    '.nd-cell.is-cue{animation:nd-cue 1s ease-in-out infinite;z-index:2}',
    '.nd-cell.is-count{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold)}',
    '.nd-cell .nd-tick{position:absolute;right:6%;top:2%;font-size:clamp(7px,24cqmin,12px);font-weight:900;color:var(--mint-d)}',
    '.nd-cell .nd-num{position:absolute;left:8%;top:4%;font-size:clamp(7px,24cqmin,12px);font-weight:900;color:#b07a00}',

    /* 오른쪽 칸 */
    '.nd-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.nd-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.nd-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.nd-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.nd-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 6px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.nd-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.nd-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.nd-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.nd-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,15cqh,72px)}',
    '.nd-coach-img{width:clamp(44px,13cqh,62px);height:clamp(44px,13cqh,62px);object-fit:contain}',
    '.nd-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.nd-bubble{margin:0;padding:9px 12px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,3.8cqh,17px);font-weight:800;line-height:1.4}',
    '.nd-coach.is-temp .nd-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.nd-coach.is-good .nd-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.nd-eq{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.6cqh;padding:10px;border-radius:18px;',
    'background:#fff;box-shadow:inset 0 0 0 2px #e6dffa,0 4px 0 var(--v3)}',
    '.nd-sum{display:flex;align-items:center;gap:1.6cqw;font-size:clamp(30px,12cqh,64px);font-weight:900;letter-spacing:-.03em;color:#2b2140;font-variant-numeric:tabular-nums;line-height:1}',
    '.nd-sum .nd-minus{color:var(--v6)}',
    '.nd-sum .nd-q{display:grid;place-items:center;min-width:1.5em;height:1.25em;padding:0 .12em;border-radius:.22em;background:var(--v1);color:var(--v6)}',
    '.nd-sum .nd-q.is-ok{background:#d7f8e9;color:var(--mint-d)}',
    '.nd-trail{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px;max-width:100%;font-size:clamp(12px,3.4cqh,15px);font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums}',
    '.nd-trail span{padding:2px 7px;border-radius:8px;background:#f3effd}',
    '.nd-trail span.is-first{background:#fff1b8;color:#9a6c00}',
    '.nd-trail em{font-style:normal;color:#b9b2cc}',
    '.nd-prog{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}',
    '.nd-prog i{width:11px;height:11px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px var(--v3)}',
    '.nd-prog i.on{background:var(--mint);box-shadow:none}',
    '.nd-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.nd-info-icon{font-size:clamp(30px,10cqh,48px);line-height:1}',
    '.nd-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.nd-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.nd-info-ex{padding:5px 12px;border-radius:12px;background:#fff;font-size:clamp(14px,4cqh,18px);font-weight:900;color:#2b2140;box-shadow:0 3px 0 var(--v3);font-variant-numeric:tabular-nums}',
    '.nd-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.nd-left{display:flex;gap:8px;margin-right:auto}',
    '.nd-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.nd-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.nd-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.nd-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.nd-btn:focus-visible,.nd-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    /* 끝 화면 */
    '.nd-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.nd-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.nd-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.nd-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.nd-end .nd-btns{margin:0;justify-content:center}',
    '.nd-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.nd-stamps .nd-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.nd-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.nd-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '.nd-bit{position:absolute;left:50%;top:50%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:nd-bit .9s ease-out forwards}',
    '@keyframes nd-wob{20%{transform:translateX(-4px)}45%{transform:translateX(4px)}70%{transform:translateX(-2px)}}',
    '@keyframes nd-cue{0%,100%{box-shadow:inset 0 0 0 3px var(--gold)}50%{box-shadow:inset 0 0 0 3px var(--gold),0 0 0 5px rgba(255,210,63,.6)}}',
    '@keyframes nd-pop{from{transform:scale(.85)}}',
    '@keyframes nd-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',
    '.nd-pop{animation:nd-pop .25s cubic-bezier(.3,1.5,.5,1)}',

    '@container nd (max-aspect-ratio:5/4){',
    '.nd-wrap{--arena:min(calc(100cqw - 24px),52cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.nd-side{width:100%}.nd-sum{font-size:clamp(28px,7cqh,52px)}}',

    '@media (prefers-reduced-motion:reduce){.nd-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('nd-style')) return;
    var s = document.createElement('style');
    s.id = 'nd-style';
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
  function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function median(a) {
    if (!a.length) return 0;
    var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2);
    return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
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
    step: function (i) { tones([392 + (i % 8) * 45], 0.07, 'sine', 0.12); },
    again: function () { tones([440, 392], 0.1, 'triangle', 0.1); },
    count: function () { tones([660], 0.04, 'sine', 0.06); },
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
    function sfx(name, a) { if (soundOn) SFX[name](a); }

    function log(type, detail) {
      var d = { type: type, schemaVersion: '0.2', activityId: o.activityId };
      for (var key in detail) d[key] = detail[key];
      try { global.dispatchEvent(new CustomEvent('oncuvate:log', { detail: d })); } catch (e) {}
      if (o.debug && global.console) console.log('[oncuvate:log]', d);
    }
    function coachSrc(mood) { return o.coachBase ? o.coachBase + COACH[mood] + o.coachExt : ''; }
    if (o.coachBase) Object.keys(COACH).forEach(function (m) { var im = new Image(); im.src = coachSrc(m); });

    var root = h('div', 'nd-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'primary');
    root.innerHTML =
      '<div class="nd-wrap">' +
        '<div class="nd-arena"><div class="nd-board" role="group" aria-label="숫자판"></div></div>' +
        '<aside class="nd-side">' +
          '<div class="nd-top">' +
            '<span class="nd-title">' + esc(T.title) + '</span>' +
            '<ol class="nd-rounds" aria-label="판"></ol>' +
            '<button type="button" class="nd-sound" data-nd-act="sound"></button>' +
          '</div>' +
          '<div class="nd-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="nd-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="nd-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="nd-info" hidden></div>' +
          '<div class="nd-eq" hidden><div class="nd-sum"></div><div class="nd-trail"></div><div class="nd-prog"></div></div>' +
          '<div class="nd-actions"><div class="nd-left"></div><div class="nd-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="nd-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="nd-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="nd-end-line"></p><div class="nd-stamps"></div><div class="nd-btns"></div>' +
        (o.credit ? '<p class="nd-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'nd-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.nd-rounds'), elSound = $('.nd-sound'), elArena = $('.nd-arena'), elBoard = $('.nd-board'),
        elCoach = $('.nd-coach'), elCoachImg = $('.nd-coach-img'), elBubble = $('.nd-bubble'),
        elInfo = $('.nd-info'), elEq = $('.nd-eq'), elSum = $('.nd-sum'), elTrail = $('.nd-trail'), elProg = $('.nd-prog'),
        elLeft = $('.nd-left'), elActs = $('.nd-side .nd-btns'), elEnd = $('.nd-end');

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
      var start = spec.start || 100, step = spec.step || 2, low = spec.low || 1;
      var maxCount = Math.floor((start - low) / step);
      var count = Math.min(spec.count || 10, maxCount);
      return { id: spec.id || ('r' + (idx + 1)), start: start, step: step, low: low, count: count };
    }

    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'nd-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood, cls) {
      say(text, mood, cls || 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1500);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'nd-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-nd-act', act);
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
        var li = h('li', 'nd-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), '−' + p.step);
        li.setAttribute('aria-label', (i + 1) + '판 ' + p.step + '씩 빼기' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function showInfo(kind) {
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var p = R.p, left = plans.length - ri - 1;
      if (kind === 'done') {
        elInfo.appendChild(h('span', 'nd-info-icon', '🎉'));
        elInfo.appendChild(h('b', 'nd-info-big', esc(fmt(T.infoDone, { n: ri + 1 }))));
        elInfo.appendChild(h('span', 'nd-info-small', esc(left ? fmt(T.infoLeft, { n: left }) : T.infoLast)));
      } else {
        elInfo.appendChild(h('span', 'nd-info-icon', '🪜'));
        elInfo.appendChild(h('b', 'nd-info-big', esc(fmt(T.infoBig, { s: p.start, k: p.step }))));
        elInfo.appendChild(h('span', 'nd-info-small', esc(fmt(T.infoSmall, { n: p.count }))));
        elInfo.appendChild(h('span', 'nd-info-ex', esc(p.start + ' → ' + (p.start - p.step) + ' → ' + (p.start - 2 * p.step) + ' → …')));
      }
      elInfo.hidden = false;
    }

    /* 숫자판: 위 왼쪽이 큰 수, 한 줄에 10칸(책과 같음). 첫 줄은 오른쪽으로 붙인다 */
    function buildBoard() {
      var p = R.p, top = p.start, bottom = p.low;
      var lead = (10 - (top % 10)) % 10;           /* 127이면 첫 줄 앞 3칸 비움 */
      var total = lead + (top - bottom + 1);
      var rows = Math.ceil(total / 10);
      elBoard.style.setProperty('--rows', rows);
      elBoard.innerHTML = '';
      R.cells = {};
      for (var i = 0; i < lead; i++) elBoard.appendChild(h('span', 'nd-cell is-blank'));
      for (var n = top; n >= bottom; n--) {
        var c = h('button', 'nd-cell', '<b>' + n + '</b>');
        c.type = 'button';
        c.setAttribute('data-n', n);
        c.setAttribute('aria-label', String(n));
        elBoard.appendChild(c);
        R.cells[n] = c;
      }
    }
    function expected() { return R.cur - R.p.step; }
    function accNow() { return (R.errs >= 2 || R.counted) ? 'support' : (R.errs === 1 ? 'self-corrected' : 'accurate'); }
    /* 칸마다 기록 표시 — 지금 정답 칸만 data-correct="true" */
    function arm() {
      var p = R.p, exp = expected(), id = p.id + '-' + (R.done + 1);
      Object.keys(R.cells).forEach(function (n) {
        var c = R.cells[n];
        if (c.classList.contains('is-step') || c.classList.contains('is-start')) {
          ['data-track', 'data-item-id', 'data-correct', 'data-response', 'data-accuracy'].forEach(function (a) { c.removeAttribute(a); });
          return;
        }
        c.setAttribute('data-track', 'answer');
        c.setAttribute('data-item-id', id);
        c.setAttribute('data-response', n);
        c.setAttribute('data-correct', +n === exp ? 'true' : 'false');
        if (+n === exp) c.setAttribute('data-accuracy', accNow()); else c.removeAttribute('data-accuracy');
      });
    }
    function paintEq(ok) {
      var p = R.p;
      elSum.innerHTML = '<span>' + R.cur + '</span><span class="nd-minus">−</span><span>' + p.step + '</span><span>=</span>' +
        '<span class="nd-q' + (ok ? ' is-ok' : '') + '">' + (ok ? (R.cur - p.step) : '?') + '</span>';
      var trail = R.path.slice(-6), html = '';
      if (R.path.length > 6) html += '<em>…</em>';
      trail.forEach(function (n, i) {
        html += (i || R.path.length > 6 ? '<em>→</em>' : '') + '<span' + (n === p.start ? ' class="is-first"' : '') + '>' + n + '</span>';
      });
      elTrail.innerHTML = html;
      elProg.innerHTML = '';
      for (var i = 0; i < p.count; i++) elProg.appendChild(h('i', i < R.done ? 'on' : ''));
    }
    function markNow() {
      Object.keys(R.cells).forEach(function (n) { R.cells[n].classList.toggle('is-now', +n === R.cur); });
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var p = plans[i];
      R = { p: p, phase: 'ready', cur: p.start, done: 0, errs: 0, counted: false, path: [p.start], acc: [], rts: [], wrong: 0,
            countUses: 0, sayText: '', sayMood: 'ready', tStart: 0, tStep: 0 };
      paintRounds(i);
      buildBoard();
      R.cells[p.start].classList.add('is-start');
      markNow();
      elEq.hidden = true;
      showInfo('ready');
      say(fmt(T.ready, { s: p.start, k: p.step }), 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    function startRun() {
      var p = R.p;
      R.phase = 'run';
      showInfo(null);
      elEq.hidden = false;
      paintEq(false);
      say(fmt(T.run, { k: p.step }), 'run');
      setActions([], [button('👆 ' + esc(T.count), 'count', true, {
        'data-track': 'hint', 'data-help-level': 'A3', 'data-help-type': 'model', 'data-help-trigger': 'child-request', 'data-item-id': p.id
      })]);
      log('game-item-ready', { itemId: p.id, start: p.start, step: p.step, count: p.count, engine: 'number-stairs@' + VERSION });
      R.tStart = R.tStep = now();
      arm();
    }

    function tapCell(c) {
      if (!R || R.phase !== 'run') return;
      var n = +c.getAttribute('data-n');
      if (c.classList.contains('is-step') || c.classList.contains('is-start')) { return; }
      var p = R.p, exp = expected(), ok = n === exp, t = now();
      var acc = ok ? accNow() : '';
      /* 어긋난 종류: 지금 수보다 큼(direction) · 정답보다 한두 칸 차이(near) · 다음다음 계단(skip) · 그 밖(calc) */
      var errorType = ok ? '' : (n >= R.cur ? 'direction' : (Math.abs(n - exp) <= 2 ? 'near' : (n === exp - p.step ? 'skip' : 'calc')));
      log('game-response', {
        itemId: p.id + '-' + (R.done + 1), from: R.cur, step: p.step, correct: ok, response: n, expected: exp,
        attempt: R.errs + 1, errorType: errorType, accuracy: acc, responseMs: Math.round(t - R.tStep)
      });
      if (ok) {
        if (R.errs === 0 && !R.counted) R.rts.push(t - R.tStep);
        R.acc.push(acc);
        sfx('step', R.done);
        clearCounting();
        Object.keys(R.cells).forEach(function (k2) { R.cells[k2].classList.remove('is-cue', 'is-no'); });
        c.classList.add('is-step', 'nd-pop');
        c.insertAdjacentHTML('beforeend', '<i class="nd-num">' + (R.done + 1) + '</i>');
        paintEq(true);
        R.cur = n;
        R.path.push(n);
        R.done++;
        R.errs = 0;
        R.counted = false;
        if (R.done >= p.count) { later(roundDone, reduced ? 200 : 450); R.phase = 'wait'; return; }
        R.phase = 'wait';
        later(function () {
          R.phase = 'run';
          markNow();
          paintEq(false);
          R.tStep = now();
          arm();
        }, reduced ? 120 : 380);
        if (R.done % 4 === 0) sayTemp(pick(T.good), 'good', 'is-good');
        return;
      }
      R.errs++;
      R.wrong++;
      sfx('again');
      c.classList.remove('is-no');
      void c.offsetWidth;
      c.classList.add('is-no');
      later(function () { c.classList.remove('is-no'); }, 450);
      if (R.errs === 1) {
        sayTemp(T.oops, 'oops');
      } else {
        R.cells[exp].classList.add('is-cue');
        say(T.cue, 'help');
        log('game-help', { itemId: p.id + '-' + (R.done + 1), helpLevel: 'A4', helpType: 'answer-cue', trigger: 'second-miss' });
      }
      arm();
    }

    /* 하나씩 세어 보기: 지금 수에서 한 칸씩 짚으며 step만큼 내려간다 */
    function clearCounting() {
      Object.keys(R.cells).forEach(function (n) {
        var c = R.cells[n];
        c.classList.remove('is-count');
        var tag = c.querySelector('.nd-tick');
        if (tag) tag.remove();
      });
    }
    function doCount() {
      if (!R || R.phase !== 'run') return;
      var p = R.p;
      R.counted = true;
      R.countUses++;
      clearCounting();
      arm();
      say(T.counting, 'help');
      log('game-help', { itemId: p.id + '-' + (R.done + 1), helpLevel: 'A3', helpType: 'count-down', trigger: 'child-request' });
      for (var i = 1; i <= p.step; i++) {
        (function (i) {
          later(function () {
            var c = R.cells[R.cur - i];
            if (!c) return;
            c.classList.add('is-count');
            c.insertAdjacentHTML('beforeend', '<i class="nd-tick">' + i + '</i>');
            sfx('count');
          }, (reduced ? 120 : o.countMs) * i);
        })(i);
      }
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'nd-bit');
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
      clearCounting();
      markNow();
      sfx('done');
      burst();
      var count = { accurate: 0, 'self-corrected': 0, support: 0 };
      R.acc.forEach(function (a) { count[a]++; });
      var summary = {
        itemId: p.id, start: p.start, step: p.step, count: p.count,
        accurate: count.accurate, selfCorrected: count['self-corrected'], support: count.support,
        wrongTaps: R.wrong, countUses: R.countUses, totalMs: Math.round(now() - R.tStart), medianRtMs: median(R.rts)
      };
      results.push(summary);
      log('game-item-complete', summary);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(summary); } catch (e) {} }
      elEq.hidden = true;
      say(fmt(T.allDone, { n: p.count }), 'good', 'is-good');
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
      elEnd.querySelector('.nd-end-line').textContent = fmt(T.endLine, { n: plans.length });
      var st = elEnd.querySelector('.nd-stamps');
      st.innerHTML = '';
      plans.forEach(function (p) { st.appendChild(h('span', 'nd-dot is-done', '−' + p.step)); });
      var acts = elEnd.querySelector('.nd-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      log('game-activity-complete', {
        rounds: plans.length,
        steps: results.reduce(function (s, r) { return s + r.count; }, 0),
        accurate: results.reduce(function (s, r) { return s + r.accurate; }, 0),
        selfCorrected: results.reduce(function (s, r) { return s + r.selfCorrected; }, 0),
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
      else if (name === 'count') doCount();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-nd-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-nd-act')); return; }
      var c = e.target.closest('.nd-cell');
      if (c && root.contains(c)) {
        if (R.phase === 'ready') { sayTemp(fmt(T.ready, { s: R.p.start, k: R.p.step }), 'ready'); return; }
        tapCell(c);
      }
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

  global.NumberStairs = { version: VERSION, mount: mount };
})(window);
