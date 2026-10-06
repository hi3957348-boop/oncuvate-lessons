/*!
 * 「차례대로 놓기」 순서 찾기 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 4장 집행력 「순서 찾기 1~6」(135~140쪽)
 *            (먼저 일어난 일과 나중에 일어난 일의 순서 알기) — 활동 방식만 가져왔다. 상황 문장은 새로 썼다.
 *
 * 한 문제: 상황 하나(예: 이를 닦아요)의 단계 카드 4~5장이 섞여 아래 받침에 놓인다.
 *   먼저 할 일부터 차례대로 누르면 위 번호 칸(1 → 2 → 3 …)에 하나씩 들어간다. 누르는 순간 판정.
 *   어긋나면 1번째 = 카드가 흔들리고 받침에 남음 / 같은 칸에서 2번째 = 맞는 카드가 금색으로 반짝(A4).
 *   「끝 보기」(아이가 고름, 도움 A2): 마지막 단계 카드를 마지막 칸에 먼저 놓아 준다(끝을 알면 순서를 세우기 쉽다).
 *   다 놓으면 번호 칸이 차례로 한 번씩 울리고 다음 문제로.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 단계 카드   data-track="answer" + data-item-id(문제-칸번호) + data-correct + data-response + (맞는 카드) data-accuracy
 *   - 끝 보기     data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '차례대로 놓기',
    ready: '카드를 일이 일어나는 차례대로 놓아요.',
    start: '시작',
    first: '무엇을 가장 먼저 할까요?',
    middle: '그다음에는 무엇을 할까요?',
    last: '마지막에는 무엇을 할까요?',
    miss: '그건 조금 뒤에 해요. 바로 다음 일을 찾아봐요.',
    cue: '반짝이는 카드를 살펴봐요.',
    hint: '끝 보기',
    hinted: '마지막 일을 먼저 놓았어요. 처음부터 차례대로 이어 봐요.',
    good: ['차례대로 잘 놓았어요!', '좋아요! 순서가 딱 맞아요.', '그렇지요! 차례차례 맞아요.'],
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
  var NOTES = [523, 587, 659, 784, 880, 988];

  var DEFAULTS = {
    activityId: 'step-order',
    storageKey: null,
    rounds: [],                // [ { id, items: [ { id, title, icon, steps: [ { icon, text } … ] } ] } ]
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
    '.so-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;--cream:#fff8e8;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:so / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.so-root *,.so-root *::before,.so-root *::after{box-sizing:border-box}',
    '.so-root [hidden]{display:none!important}',
    '.so-wrap{height:100%;display:grid;grid-template-rows:auto minmax(0,47fr) minmax(0,53fr);gap:10px;padding:12px}',

    '.so-top{display:flex;align-items:center;gap:8px;min-height:34px;min-width:0}',
    '.so-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.so-scene{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 12px;border-radius:999px;background:#fff6d6;',
    'box-shadow:inset 0 0 0 2px var(--gold);font-size:clamp(14px,4cqh,17px);font-weight:900;color:#8a5a00}',
    '.so-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px;flex:none}',
    '.so-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 8px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.so-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.so-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.so-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',

    /* 번호 칸 줄 */
    '.so-strip{container:sostrip / size;position:relative;min-height:0;border-radius:18px;overflow:hidden;',
    'background:radial-gradient(circle at 50% 30%,#5b48d6 0%,#3b2a9e 55%,#1b1462 100%);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.so-slots{--n:4;--aw:3.2cqw;position:absolute;inset:0;padding:4cqh 2.5cqw;display:flex;align-items:center;justify-content:center;gap:1cqw;',
    '--sw:min(calc((100cqw - 5cqw - (var(--n) - 1) * (var(--aw) + 2cqw)) / var(--n)),84cqh)}',
    '.so-slot{position:relative;flex:none;width:var(--sw);height:var(--sw);border-radius:16px;box-shadow:inset 0 0 0 3px rgba(255,255,255,.35);',
    'background:rgba(255,255,255,.06);display:grid;place-items:center}',
    '.so-slot.is-next{box-shadow:inset 0 0 0 3px var(--gold);background:rgba(255,246,214,.12)}',
    '.so-num{position:absolute;left:-6px;top:-6px;z-index:2;width:clamp(22px,16cqh,30px);height:clamp(22px,16cqh,30px);border-radius:50%;',
    'display:grid;place-items:center;background:#fff;color:var(--v8);font-size:clamp(12px,9cqh,16px);font-weight:900;box-shadow:0 2px 0 var(--v3)}',
    '.so-slot.is-next .so-num{background:var(--gold);color:#5a3d00}',
    '.so-slot.is-done .so-num{background:var(--mint);color:#fff}',
    '.so-arrow{flex:none;width:var(--aw);text-align:center;font-size:min(3.4cqw,14cqh);font-weight:900;color:#fff6dc;opacity:.8;line-height:1}',

    /* 카드(번호 칸 안 · 받침 위 공통) */
    '.so-card{--cw:120px;position:relative;width:var(--cw);height:var(--cw);border:0;margin:0;padding:7% 6%;border-radius:14px;font:inherit;color:var(--ink);',
    'background:var(--cream);box-shadow:0 4px 0 #d9cfa8,0 8px 12px rgba(0,0,0,.14);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4%;',
    'text-align:center;transition:transform .12s,opacity .2s}',
    '.so-card .so-ico{font-size:calc(var(--cw) * .36);line-height:1}',
    '.so-card .so-txt{font-size:max(12px,calc(var(--cw) * .118));font-weight:800;letter-spacing:-.04em;line-height:1.25}',
    '.so-slot .so-card{--cw:var(--sw);cursor:default;animation:so-pop .35s cubic-bezier(.3,1.5,.5,1)}',
    '.so-slot.is-done .so-card{background:#effff7;box-shadow:0 4px 0 #a8dcc4,0 0 0 3px var(--mint)}',
    '.so-slot.is-given .so-card{background:#e9f8fa;box-shadow:0 4px 0 #9fd9e3,0 0 0 3px #4bc9dc}',
    '.so-slot.is-beat{transform:translateY(-7%) scale(1.04);transition:transform .12s}',

    '.so-bottom{min-height:0;display:grid;grid-template-columns:minmax(0,30fr) minmax(0,70fr);gap:12px;align-items:stretch}',
    '.so-left{min-width:0;display:flex;flex-direction:column;gap:8px;justify-content:center}',
    '.so-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center}',
    '.so-coach-img{width:clamp(44px,13cqh,62px);height:clamp(44px,13cqh,62px);object-fit:contain}',
    '.so-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.so-bubble{margin:0;padding:9px 12px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,3.8cqh,17px);font-weight:800;line-height:1.4}',
    '.so-coach.is-temp .so-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.so-coach.is-good .so-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.so-steps{list-style:none;margin:0;padding:0;display:flex;gap:7px}',
    '.so-steps li{width:14px;height:14px;border-radius:50%;background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.so-steps li.is-now{background:#fff6d6;box-shadow:inset 0 0 0 3px var(--gold)}',
    '.so-steps li.is-done{background:var(--mint);box-shadow:none}',
    '.so-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.so-tray{container:sotray / size;position:relative;min-width:0;min-height:0;border-radius:18px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.so-tray-in{--n:4;position:absolute;inset:0;padding:5cqh 2cqw;display:flex;align-items:center;justify-content:center;gap:2cqw;',
    '--cw2:min(calc((100cqw - 4cqw - (var(--n) - 1) * 2cqw) / var(--n)),88cqh)}',
    '.so-tray .so-card{--cw:var(--cw2);cursor:pointer}',
    '.so-tray .so-card:active{transform:translateY(3px);box-shadow:0 2px 0 #d9cfa8}',
    '.so-tray .so-card:focus-visible{outline:4px solid rgba(75,201,220,.8);outline-offset:3px}',
    '.so-card.is-cue{animation:so-cue 1s ease-in-out infinite}',
    '.so-card.is-shake{animation:so-shake .4s}',
    '.so-card.is-used{visibility:hidden;pointer-events:none}',
    '.so-info{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;padding:10px}',
    '.so-info-icon{font-size:clamp(28px,22cqh,44px);line-height:1}',
    '.so-info-big{font-size:clamp(18px,14cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.so-info-small{font-size:clamp(13px,9cqh,16px);font-weight:700;color:var(--muted)}',
    '.so-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 16px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.so-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.so-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.so-btn:focus-visible,.so-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.so-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.so-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.so-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.so-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.so-end-btns{display:flex;gap:8px;justify-content:center}',
    '.so-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.so-stamps .so-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.so-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.so-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '@keyframes so-pop{from{transform:scale(.6)}}',
    '@keyframes so-cue{50%{box-shadow:0 4px 0 #d9cfa8,0 0 0 5px var(--gold),0 0 20px rgba(255,210,63,.8)}}',
    '@keyframes so-shake{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}',

    /* 세로 화면: 번호 칸·받침 모두 한 줄에 두세 장씩 */
    '@container so (max-aspect-ratio:5/4){',
    '.so-wrap{grid-template-rows:auto minmax(0,40fr) minmax(0,60fr)}',
    '.so-slots{flex-wrap:wrap;align-content:center;row-gap:4cqh;--sw:min(calc((100cqw - 5cqw - 2 * 3cqw) / 3),44cqh)}',
    '.so-arrow{display:none}',
    '.so-bottom{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}',
    '.so-tray-in{flex-wrap:wrap;align-content:center;row-gap:3cqh;--cw2:min(calc((100cqw - 4cqw - 2 * 2cqw) / 3),44cqh)}}',

    '@media (prefers-reduced-motion:reduce){.so-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('so-style')) return;
    var s = document.createElement('style');
    s.id = 'so-style';
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
  /* 섞되 처음 순서 그대로는 피한다 */
  function scramble(n) {
    var idx = [], i;
    for (i = 0; i < n; i++) idx.push(i);
    for (var t = 0; t < 20; t++) {
      var s = shuffle(idx), same = 0;
      for (i = 0; i < n; i++) if (s[i] === i) same++;
      if (same <= 1) return s;
    }
    return shuffle(idx);
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
    place: function (k) { tones([NOTES[k % NOTES.length]], 0.08, 'sine', 0.12); },
    miss: function () { tones([294, 262], 0.09, 'triangle', 0.1); },
    show: function () { tones([587, 698], 0.08, 'sine', 0.08); },
    note: function (f) { tones([f], 0.1, 'sine', 0.12); },
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

    var root = h('div', 'so-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="so-wrap">' +
        '<div class="so-top">' +
          '<span class="so-title">' + esc(T.title) + '</span>' +
          '<span class="so-scene" hidden></span>' +
          '<ol class="so-rounds" aria-label="판"></ol>' +
          '<button type="button" class="so-sound" data-so-act="sound"></button>' +
        '</div>' +
        '<div class="so-strip"><div class="so-slots" role="list" aria-label="순서 칸"></div></div>' +
        '<div class="so-bottom">' +
          '<div class="so-left">' +
            '<div class="so-coach' + (o.coachBase ? '' : ' no-img') + '">' +
              (o.coachBase ? '<img class="so-coach-img" alt="" aria-hidden="true">' : '') +
              '<p class="so-bubble" aria-live="polite"></p>' +
            '</div>' +
            '<ol class="so-steps" aria-label="문제"></ol>' +
            '<div class="so-actions"></div>' +
          '</div>' +
          '<div class="so-tray"><div class="so-tray-in" role="group" aria-label="카드"></div></div>' +
        '</div>' +
      '</div>' +
      '<section class="so-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="so-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="so-end-line"></p><div class="so-stamps"></div><div class="so-end-btns"></div>' +
        (o.credit ? '<p class="so-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'so-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.so-rounds'), elSound = $('.so-sound'), elScene = $('.so-scene'), elSlots = $('.so-slots'), elTray = $('.so-tray-in'),
        elCoach = $('.so-coach'), elCoachImg = $('.so-coach-img'), elBubble = $('.so-bubble'), elSteps = $('.so-steps'),
        elActs = $('.so-actions'), elEnd = $('.so-end');

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
      elCoach.className = 'so-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood) {
      say(text, mood, 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1800);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'so-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-so-act', act);
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
        var li = h('li', 'so-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), (i + 1) + '판');
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
    function info(icon, big, small) {
      elTray.innerHTML = '';
      var d = h('div', 'so-info');
      d.appendChild(h('span', 'so-info-icon', icon));
      d.appendChild(h('b', 'so-info-big', esc(big)));
      if (small) d.appendChild(h('span', 'so-info-small', esc(small)));
      elTray.appendChild(d);
    }
    function cardHtml(st) {
      return '<span class="so-ico" aria-hidden="true">' + esc(st.icon || '') + '</span><span class="so-txt">' + esc(st.text) + '</span>';
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var r = rounds[i];
      R = { r: r, qi: 0, phase: 'ready', sayText: '', sayMood: 'ready', tally: { accurate: 0, 'self-corrected': 0, support: 0 } };
      paintRounds(i);
      paintSteps();
      elScene.hidden = true;
      elSlots.innerHTML = '';
      info('🪜', (i + 1) + '판', r.items.length + '가지 일을 차례대로 놓아요');
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    function ask() {
      var it = R.r.items[R.qi], n = it.steps.length;
      R.it = it;
      R.phase = 'pick';
      R.slot = 0; R.filled = []; R.slotMiss = 0; R.misses = 0; R.helps = 0; R.hintUsed = false;
      R.tItem = R.tAsk = now();
      elScene.textContent = (it.icon ? it.icon + ' ' : '') + it.title;
      elScene.hidden = false;
      /* 번호 칸 */
      elSlots.style.setProperty('--n', n);
      elSlots.innerHTML = '';
      for (var i = 0; i < n; i++) {
        if (i) elSlots.appendChild(h('span', 'so-arrow', '→'));
        var s = h('div', 'so-slot', '<span class="so-num">' + (i + 1) + '</span>');
        s.setAttribute('role', 'listitem');
        s.setAttribute('aria-label', (i + 1) + '번째 칸');
        s.setAttribute('data-slot', i);
        elSlots.appendChild(s);
      }
      /* 받침 카드 */
      R.order = scramble(n);
      elTray.style.setProperty('--n', n);
      elTray.innerHTML = '';
      R.order.forEach(function (si) {
        var b = h('button', 'so-card', cardHtml(it.steps[si]));
        b.type = 'button';
        b.setAttribute('data-step', si);
        b.setAttribute('aria-label', it.steps[si].text);
        elTray.appendChild(b);
      });
      paintSteps();
      nextSlot();
      log('game-item-ready', {
        itemId: it.id, title: it.title, steps: n, trayOrder: R.order.map(function (x) { return x + 1; }).join(','), engine: 'step-order@' + VERSION
      });
    }
    function slotEl(i) { return elSlots.querySelector('[data-slot="' + i + '"]'); }
    function nextSlot() {
      var n = R.it.steps.length;
      while (R.slot < n && R.filled[R.slot]) R.slot++;
      Array.prototype.forEach.call(elSlots.querySelectorAll('.so-slot'), function (s) { s.classList.remove('is-next'); });
      if (R.slot >= n) { itemDone(); return; }
      slotEl(R.slot).classList.add('is-next');
      R.slotMiss = 0;
      R.cued = false;
      R.tAsk = now();
      var remain = 0;
      for (var i = 0; i < n; i++) if (!R.filled[i]) remain++;
      say(R.slot === 0 ? T.first : (remain === 1 ? T.last : T.middle), 'ask');
      setActions([hintButton()]);
      tagCards();
    }
    function accNow() { return R.helps ? 'support' : (R.misses ? 'self-corrected' : 'accurate'); }
    function tagCards() {
      Array.prototype.forEach.call(elTray.querySelectorAll('.so-card'), function (b) {
        var si = +b.getAttribute('data-step'), right = si === R.slot;
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', R.it.id + '-' + (R.slot + 1));
        b.setAttribute('data-response', R.it.steps[si].text);
        b.setAttribute('data-correct', right ? 'true' : 'false');
        if (right) b.setAttribute('data-accuracy', R.helps ? 'support' : (R.slotMiss ? 'self-corrected' : 'accurate')); else b.removeAttribute('data-accuracy');
      });
    }
    function hintButton() {
      var n = R.it.steps.length;
      var b = button('🏁 ' + esc(T.hint), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'show-last', 'data-item-id': R.it.id
      });
      /* 끝 칸이 이미 찼거나 남은 칸이 둘 이하면 감춘다 */
      var remain = 0;
      for (var i = 0; i < n; i++) if (!R.filled[i]) remain++;
      if (R.hintUsed || R.filled[n - 1] || remain <= 2) b.hidden = true;
      return b;
    }
    function place(si, given) {
      var it = R.it;
      var card = elTray.querySelector('[data-step="' + si + '"]');
      if (card) {
        card.classList.remove('is-cue');
        card.classList.add('is-used');
        card.removeAttribute('data-track');
      }
      R.filled[si] = true;
      var s = slotEl(si);
      s.classList.add(given ? 'is-given' : 'is-done');
      var c = h('div', 'so-card', cardHtml(it.steps[si]));
      s.appendChild(c);
      sfx('place', si);
    }

    function onCard(b) {
      if (!R || R.phase !== 'pick' || b.classList.contains('is-used')) return;
      var si = +b.getAttribute('data-step'), it = R.it, t = now(), slot = R.slot;
      if (si === slot) {
        log('game-response', { itemId: it.id + '-' + (slot + 1), slot: slot + 1, response: si + 1, correct: true, attempt: R.slotMiss + 1, accuracy: R.helps ? 'support' : (R.slotMiss ? 'self-corrected' : 'accurate'), responseMs: Math.round(t - R.tAsk) });
        place(si, false);
        R.slot++;
        nextSlot();
        return;
      }
      R.slotMiss++;
      R.misses++;
      sfx('miss');
      log('game-response', {
        itemId: it.id + '-' + (slot + 1), slot: slot + 1, response: si + 1, correct: false, attempt: R.slotMiss,
        errorType: 'skip-ahead', distance: si - slot, responseMs: Math.round(t - R.tAsk)
      });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake');
      later(function () { b.classList.remove('is-shake'); }, 420);
      if (R.slotMiss >= 2 && !R.cued) {
        R.cued = true;
        R.helps++;
        var r = elTray.querySelector('[data-step="' + slot + '"]');
        if (r) r.classList.add('is-cue');
        log('game-help', { itemId: it.id + '-' + (slot + 1), helpLevel: 'A4', helpType: 'cue-next', trigger: 'second-miss' });
        say(T.cue, 'help');
      } else {
        sayTemp(T.miss, 'miss');
      }
      tagCards();
    }

    function doHint() {
      if (!R || R.phase !== 'pick' || R.hintUsed) return;
      var it = R.it, last = it.steps.length - 1;
      if (R.filled[last]) return;
      R.hintUsed = true;
      R.helps++;
      sfx('show');
      place(last, true);
      say(T.hinted, 'help');
      log('game-help', { itemId: it.id, helpLevel: 'A2', helpType: 'show-last', trigger: 'child-request' });
      setActions([hintButton()]);
      tagCards();
    }

    function itemDone() {
      var it = R.it, acc = accNow();
      R.phase = 'play';
      R.tally[acc]++;
      setActions([]);
      say(pick(T.good), 'good', 'is-good');
      var summary = { itemId: it.id, title: it.title, steps: it.steps.length, accuracy: acc, misses: R.misses, helps: R.helps, hint: R.hintUsed, totalMs: Math.round(now() - R.tItem) };
      results.push(summary);
      log('game-item-complete', summary);
      var slots = Array.prototype.slice.call(elSlots.querySelectorAll('.so-slot')), step = 280;
      slots.forEach(function (s, i) {
        later(function () {
          slots.forEach(function (x) { x.classList.remove('is-beat'); });
          s.classList.add('is-beat');
          sfx('note', NOTES[i % NOTES.length]);
        }, 350 + i * step);
      });
      later(function () {
        slots.forEach(function (x) { x.classList.remove('is-beat'); });
        R.qi++;
        paintSteps();
        if (R.qi < R.r.items.length) ask();
        else roundDone();
      }, 350 + slots.length * step + o.nextMs);
    }

    function roundDone() {
      R.phase = 'round-done';
      paintSteps();
      sfx('done');
      var left = rounds.length - ri - 1;
      info('🎉', fmt(T.infoDone, { n: ri + 1 }), left ? fmt(T.infoLeft, { n: left }) : T.infoLast);
      var sum = { roundId: R.r.id, items: R.r.items.length, accurate: R.tally.accurate, selfCorrected: R.tally['self-corrected'], support: R.tally.support };
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(sum); } catch (e) {} }
      var last = ri === rounds.length - 1;
      setActions([button(last ? '🏁 ' + esc(T.finish) : esc(T.next) + ' ▶', last ? 'finish' : 'next')]);
      paintRounds(ri + 1);
    }

    function finish() {
      elEnd.hidden = false;
      ri = rounds.length;
      paintRounds(rounds.length);
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.so-end-line').textContent = fmt(T.endLine, { n: rounds.length });
      var st = elEnd.querySelector('.so-stamps');
      st.innerHTML = '';
      rounds.forEach(function (r, i) { st.appendChild(h('span', 'so-dot is-done', (i + 1) + '판')); });
      var acts = elEnd.querySelector('.so-end-btns');
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
      var b = e.target.closest('[data-so-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-so-act')); return; }
      var c = e.target.closest('.so-tray .so-card');
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

  global.StepOrder = { version: VERSION, mount: mount };
})(window);
