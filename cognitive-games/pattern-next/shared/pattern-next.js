/*!
 * 「규칙 찾기」 되풀이 규칙 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 4장 집행력 「규칙 찾기 1~2」(125~126쪽)
 *            (그림이 어떤 규칙으로 되풀이되는지 살펴보고 '?'에 올 그림 찾기) — 활동 방식만 가져왔다.
 *
 * 한 문제: 그림 줄(6~8칸)에 빈칸 '?' 하나 → 아래 보기(2~3개) 가운데 맞는 그림을 누른다.
 *   규칙(AB · AAB · ABB · ABC · AABB …)과 그림은 문제마다 새로 뽑는다. 보기는 규칙 안의 그림들이라
 *   「처음 보는 그림」으로 맞힐 수 없고 규칙을 알아야 한다.
 *   누르는 순간 판정. 맞으면 빈칸이 채워지고 줄 전체가 그림마다 다른 음으로 한 번 울린다(리듬으로 규칙 확인).
 *   어긋나면 1번째 = 보기가 흔들리고 흐려짐 / 2번째 = 맞는 보기가 금색으로 반짝(A4).
 *   「묶어 보기」(아이가 고름, 도움 A2): 되풀이 묶음마다 색 띠를 깔아 준다.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 보기 카드   data-track="answer" + data-item-id + data-correct + data-response + (맞는 보기) data-accuracy
 *   - 묶어 보기   data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '규칙 찾기',
    ready: '그림이 어떤 규칙으로 되풀이되는지 살펴봐요.',
    start: '시작',
    ask: '?에 어떤 그림이 와야 할까요?',
    miss: '다시 살펴봐요. 무엇이 되풀이될까요?',
    cue: '반짝이는 그림을 살펴봐요.',
    hint: '묶어 보기',
    hinted: '되풀이되는 묶음을 색 띠로 나눠 봤어요.',
    good: ['맞아요! 규칙대로 들어갔어요.', '좋아요! 규칙을 찾았어요.', '그렇지요! 딱 맞아요.'],
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
  var NOTE = { A: 523, B: 659, C: 784, D: 988 };

  var DEFAULTS = {
    activityId: 'pattern-next',
    storageKey: null,
    cards: {},                 // { key: { label, img | emoji } }
    pool: null,                // 뽑을 그림 key 목록(없으면 cards 전부)
    rounds: [],                // [ { id, patterns:['AB'], length:6, blank:'end'|'any', choices:2, count:4 } ]
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
    '.pt-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;--cream:#fff8e8;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:pt / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.pt-root *,.pt-root *::before,.pt-root *::after{box-sizing:border-box}',
    '.pt-root [hidden]{display:none!important}',
    '.pt-wrap{height:100%;display:grid;grid-template-rows:auto minmax(0,46fr) minmax(0,54fr);gap:10px;padding:12px}',

    '.pt-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.pt-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.pt-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.pt-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 8px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.pt-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.pt-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.pt-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',

    /* 그림 줄 */
    '.pt-strip{container:ptstrip / size;position:relative;min-height:0;border-radius:18px;overflow:hidden;',
    'background:radial-gradient(circle at 50% 30%,#5b48d6 0%,#3b2a9e 55%,#1b1462 100%);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.pt-row{--n:6;--cols:var(--n);--gap:1.6cqw;position:absolute;inset:0;padding:3cqh 2.5cqw;display:grid;',
    'grid-template-columns:repeat(var(--cols),var(--cw));justify-content:center;align-content:center;gap:var(--gap);',
    '--cw:min(calc((100cqw - 5cqw - (var(--cols) - 1) * var(--gap)) / var(--cols)),78cqh)}',
    '.pt-cell{position:relative;width:var(--cw);height:var(--cw);border-radius:14px;background:var(--cream);',
    'box-shadow:0 4px 0 #d9cfa8,0 8px 12px rgba(0,0,0,.18);display:grid;place-items:center;padding:9%;transition:transform .12s}',
    '.pt-cell img{width:100%;height:100%;object-fit:contain}',
    '.pt-cell .pt-emo{font-size:calc(var(--cw) * .55);line-height:1}',
    '.pt-cell.is-blank{background:rgba(255,246,214,.12);box-shadow:inset 0 0 0 3px var(--gold);border:0}',
    '.pt-cell.is-blank::before{content:"?";font-size:calc(var(--cw) * .5);font-weight:900;color:var(--gold)}',
    '.pt-cell.is-filled{background:#effff7;box-shadow:0 4px 0 #a8dcc4,0 0 0 3px var(--mint);animation:pt-pop .4s cubic-bezier(.3,1.5,.5,1)}',
    '.pt-cell.is-filled::before{content:none}',
    '.pt-cell.is-beat{transform:translateY(-10%) scale(1.06)}',
    '.pt-cell::after{content:"";position:absolute;left:calc(var(--gap) / -2 - 1px);right:calc(var(--gap) / -2 - 1px);bottom:-13%;height:7%;border-radius:6px;opacity:0;transition:opacity .25s}',
    '.pt-cell.u-start::after{left:4%}.pt-cell.u-end::after{right:4%}',
    '.pt-cell.u0:not(.is-blank){background:#dff6fa;box-shadow:0 4px 0 #9fd9e3,0 0 0 3px #4bc9dc}',
    '.pt-cell.u1:not(.is-blank){background:#ffeedd;box-shadow:0 4px 0 #f0c79a,0 0 0 3px #ff9f43}',
    '.pt-cell.u0::after{background:#4bc9dc;opacity:1}.pt-cell.u1::after{background:#ff9f43;opacity:1}',

    /* 아래: 코치 + 보기 */
    '.pt-bottom{min-height:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:stretch}',
    '.pt-left{min-width:0;display:flex;flex-direction:column;gap:8px;justify-content:center}',
    '.pt-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center}',
    '.pt-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.pt-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.pt-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.pt-coach.is-temp .pt-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.pt-coach.is-good .pt-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.pt-steps{list-style:none;margin:0;padding:0;display:flex;gap:7px}',
    '.pt-steps li{width:14px;height:14px;border-radius:50%;background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.pt-steps li.is-now{background:#fff6d6;box-shadow:inset 0 0 0 3px var(--gold)}',
    '.pt-steps li.is-done{background:var(--mint);box-shadow:none}',
    '.pt-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.pt-opts{--ow:min(30cqh,150px);display:flex;align-items:center;justify-content:center;gap:12px;padding:6px 4px}',
    '.pt-opt{position:relative;width:var(--ow);height:var(--ow);border:0;padding:8%;margin:0;border-radius:16px;cursor:pointer;background:#fff;',
    'box-shadow:0 5px 0 var(--v3),inset 0 0 0 2px var(--v1);display:grid;place-items:center;transition:transform .12s,opacity .2s}',
    '.pt-opt:active{transform:translateY(3px);box-shadow:0 2px 0 var(--v3)}',
    '.pt-opt:focus-visible{outline:4px solid rgba(75,201,220,.8);outline-offset:3px}',
    '.pt-opt img{width:100%;height:100%;object-fit:contain}',
    '.pt-opt .pt-emo{font-size:calc(var(--ow) * .55);line-height:1}',
    '.pt-opt.is-gone{opacity:.3;pointer-events:none;filter:grayscale(.6)}',
    '.pt-opt.is-right{background:#effff7;box-shadow:0 5px 0 #a8dcc4,0 0 0 4px var(--mint)}',
    '.pt-opt.is-cue{animation:pt-cue 1s ease-in-out infinite}',
    '.pt-opt.is-shake{animation:pt-shake .4s}',
    '.pt-info{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:min(260px,38cqw);text-align:center;padding:10px 16px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.pt-info-icon{font-size:clamp(28px,9cqh,44px);line-height:1}',
    '.pt-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.pt-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.pt-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.pt-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.pt-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.pt-btn:focus-visible,.pt-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.pt-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.pt-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.pt-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.pt-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.pt-end-btns{display:flex;gap:8px;justify-content:center}',
    '.pt-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.pt-stamps .pt-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.pt-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.pt-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '@keyframes pt-pop{from{transform:scale(.6)}}',
    '@keyframes pt-cue{50%{box-shadow:0 5px 0 var(--v3),0 0 0 6px var(--gold),0 0 22px rgba(255,210,63,.8)}}',
    '@keyframes pt-shake{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}',

    /* 세로 화면: 그림 줄은 4칸씩 두 줄, 아래는 코치 위·보기 아래 */
    '@container pt (max-aspect-ratio:5/4){',
    '.pt-wrap{grid-template-rows:auto minmax(0,36fr) minmax(0,64fr)}',
    '.pt-row{--cols:4;row-gap:7cqh;--cw:min(calc((100cqw - 5cqw - 3 * var(--gap)) / 4),38cqh)}',
    '.pt-bottom{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}',
    '.pt-opts{--ow:min(28cqw,22cqh,150px)}}',

    '@media (prefers-reduced-motion:reduce){.pt-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('pt-style')) return;
    var s = document.createElement('style');
    s.id = 'pt-style';
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

  /* 규칙 글자(AB, AAB …)로 그림 줄 만들기 */
  function makeItem(spec, id, pool) {
    var pat = pick(spec.patterns || ['AB']);
    var letters = [];
    pat.split('').forEach(function (c) { if (letters.indexOf(c) < 0) letters.push(c); });
    var keys = shuffle(pool).slice(0, letters.length);
    var map = {};
    letters.forEach(function (c, i) { map[c] = keys[i]; });
    var len = spec.length || Math.max(6, pat.length * 2 + 1);
    var seq = [];
    for (var i = 0; i < len; i++) seq.push(pat.charAt(i % pat.length));
    /* 빈칸 자리: 끝이거나, 규칙을 한 번은 다 본 뒤 아무 데나 */
    var blank = len - 1;
    if (spec.blank === 'any' && Math.random() < 0.6) {
      var from = Math.min(pat.length, len - 2);
      blank = from + Math.floor(Math.random() * (len - 1 - from));
    }
    var answer = map[seq[blank]];
    var opts = letters.map(function (c) { return map[c]; });
    var want = Math.max(2, spec.choices || opts.length);
    var extra = shuffle(pool.filter(function (k) { return opts.indexOf(k) < 0; }));
    while (opts.length < want && extra.length) opts.push(extra.shift());
    if (opts.length > want) {
      opts = [answer].concat(shuffle(opts.filter(function (k) { return k !== answer; })).slice(0, want - 1));
    }
    return {
      id: id, pattern: pat, letters: seq, seq: seq.map(function (c) { return map[c]; }), blank: blank,
      answer: answer, options: shuffle(opts), unit: pat.length
    };
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
    var pool = (o.pool && o.pool.length ? o.pool : Object.keys(o.cards)).slice();

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
    function card(key) { return o.cards[key] || { label: key }; }
    function face(key) {
      var c = card(key);
      return c.img ? '<img alt="" src="' + esc(c.img) + '">' : '<span class="pt-emo">' + esc(c.emoji || '❔') + '</span>';
    }

    var root = h('div', 'pt-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="pt-wrap">' +
        '<div class="pt-top">' +
          '<span class="pt-title">' + esc(T.title) + '</span>' +
          '<ol class="pt-rounds" aria-label="판"></ol>' +
          '<button type="button" class="pt-sound" data-pt-act="sound"></button>' +
        '</div>' +
        '<div class="pt-strip"><div class="pt-row" role="list" aria-label="그림 줄"></div></div>' +
        '<div class="pt-bottom">' +
          '<div class="pt-left">' +
            '<div class="pt-coach' + (o.coachBase ? '' : ' no-img') + '">' +
              (o.coachBase ? '<img class="pt-coach-img" alt="" aria-hidden="true">' : '') +
              '<p class="pt-bubble" aria-live="polite"></p>' +
            '</div>' +
            '<ol class="pt-steps" aria-label="문제"></ol>' +
            '<div class="pt-actions"></div>' +
          '</div>' +
          '<div class="pt-opts" role="group" aria-label="보기"></div>' +
        '</div>' +
      '</div>' +
      '<section class="pt-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="pt-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="pt-end-line"></p><div class="pt-stamps"></div><div class="pt-end-btns"></div>' +
        (o.credit ? '<p class="pt-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'pt-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.pt-rounds'), elSound = $('.pt-sound'), elRow = $('.pt-row'), elOpts = $('.pt-opts'),
        elCoach = $('.pt-coach'), elCoachImg = $('.pt-coach-img'), elBubble = $('.pt-bubble'), elSteps = $('.pt-steps'),
        elActs = $('.pt-actions'), elEnd = $('.pt-end');

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
      elCoach.className = 'pt-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood) {
      say(text, mood, 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1600);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'pt-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-pt-act', act);
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
        var li = h('li', 'pt-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), (i + 1) + '판');
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
      var d = h('div', 'pt-info');
      d.appendChild(h('span', 'pt-info-icon', icon));
      d.appendChild(h('b', 'pt-info-big', esc(big)));
      if (small) d.appendChild(h('span', 'pt-info-small', esc(small)));
      elOpts.appendChild(d);
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var r = rounds[i];
      R = { r: r, qi: 0, phase: 'ready', sayText: '', sayMood: 'ready', tally: { accurate: 0, 'self-corrected': 0, support: 0 } };
      paintRounds(i);
      paintSteps();
      /* 첫 문제 줄을 미리 보여 준다(누르기 전에 살펴볼 수 있게) */
      R.it = makeItem(r, r.id + '-1', pool);
      drawRow(R.it);
      info('🔁', (i + 1) + '판', r.count + '문제를 풀어요');
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    function drawRow(it) {
      elRow.style.setProperty('--n', it.seq.length);
      elRow.innerHTML = '';
      it.seq.forEach(function (key, i) {
        var c = h('div', 'pt-cell' + (i === it.blank ? ' is-blank' : ''));
        c.setAttribute('role', 'listitem');
        c.setAttribute('aria-label', i === it.blank ? '빈칸' : card(key).label);
        if (i !== it.blank) c.innerHTML = face(key);
        elRow.appendChild(c);
      });
    }

    function ask() {
      var it = R.it;
      R.phase = 'pick';
      R.miss = 0; R.helps = 0; R.hintUsed = false; R.cued = false;
      R.tAsk = now();
      elOpts.innerHTML = '';
      it.options.forEach(function (key) {
        var b = h('button', 'pt-opt', face(key));
        b.type = 'button';
        b.setAttribute('data-key', key);
        b.setAttribute('aria-label', card(key).label);
        elOpts.appendChild(b);
      });
      tagOpts();
      paintSteps();
      say(T.ask, 'ask');
      setActions([hintButton()]);
      log('game-item-ready', {
        itemId: it.id, pattern: it.pattern, sequence: it.seq.join(','), blankIndex: it.blank, answer: it.answer,
        options: it.options.join(','), length: it.seq.length, engine: 'pattern-next@' + VERSION
      });
    }
    function accNow() { return R.helps ? 'support' : (R.miss ? 'self-corrected' : 'accurate'); }
    function tagOpts() {
      Array.prototype.forEach.call(elOpts.querySelectorAll('.pt-opt'), function (b) {
        var key = b.getAttribute('data-key'), right = key === R.it.answer;
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', R.it.id);
        b.setAttribute('data-response', card(key).label);
        b.setAttribute('data-correct', right ? 'true' : 'false');
        if (right) b.setAttribute('data-accuracy', accNow()); else b.removeAttribute('data-accuracy');
      });
    }
    function hintButton() {
      var b = button('🎨 ' + esc(T.hint), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'chunk-units', 'data-item-id': R.it.id
      });
      if (R.hintUsed) b.hidden = true;
      return b;
    }

    function onOpt(b) {
      if (!R || R.phase !== 'pick' || b.classList.contains('is-gone')) return;
      var key = b.getAttribute('data-key'), it = R.it, t = now();
      if (key === it.answer) {
        var acc = accNow();
        log('game-response', { itemId: it.id, response: key, correct: true, attempt: R.miss + 1, accuracy: acc, responseMs: Math.round(t - R.tAsk) });
        solved(b, acc);
        return;
      }
      R.miss++;
      sfx('miss');
      log('game-response', {
        itemId: it.id, response: key, correct: false, attempt: R.miss,
        errorType: it.seq.indexOf(key) >= 0 ? 'pattern-member' : 'outside', responseMs: Math.round(t - R.tAsk)
      });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake', 'is-gone');
      later(function () { b.classList.remove('is-shake'); }, 380);
      var left = Array.prototype.filter.call(elOpts.querySelectorAll('.pt-opt'), function (x) { return !x.classList.contains('is-gone'); });
      if (R.miss >= 2 && !R.cued && left.length > 1) {
        R.cued = true;
        R.helps++;
        var r = elOpts.querySelector('[data-key="' + it.answer + '"]');
        if (r) r.classList.add('is-cue');
        log('game-help', { itemId: it.id, helpLevel: 'A4', helpType: 'cue-answer', trigger: 'second-miss' });
        say(T.cue, 'help');
      } else {
        sayTemp(T.miss, 'miss');
      }
      tagOpts();
    }

    /* 맞혔을 때: 빈칸 채우기 → 줄 전체를 한 번 울리기 → 다음 */
    function solved(b, acc) {
      var it = R.it;
      R.phase = 'play';
      b.classList.remove('is-cue');
      b.classList.add('is-right');
      Array.prototype.forEach.call(elOpts.querySelectorAll('.pt-opt'), function (x) { if (x !== b) x.classList.add('is-gone'); });
      var cell = elRow.children[it.blank];
      cell.classList.remove('is-blank');
      cell.classList.add('is-filled');
      cell.innerHTML = face(it.answer);
      setActions([]);
      say(pick(T.good), 'good', 'is-good');
      R.tally[acc]++;
      var summary = { itemId: it.id, pattern: it.pattern, accuracy: acc, misses: R.miss, helps: R.helps, hint: R.hintUsed, totalMs: Math.round(now() - R.tAsk) };
      results.push(summary);
      log('game-item-complete', summary);
      var cells = Array.prototype.slice.call(elRow.children), step = 170;
      cells.forEach(function (c, i) {
        later(function () {
          cells.forEach(function (x) { x.classList.remove('is-beat'); });
          c.classList.add('is-beat');
          sfx('note', NOTE[it.letters[i]] || 523);
        }, 300 + i * step);
      });
      later(function () {
        cells.forEach(function (x) { x.classList.remove('is-beat'); });
        R.qi++;
        paintSteps();
        if (R.qi < R.r.count) {
          R.it = makeItem(R.r, R.r.id + '-' + (R.qi + 1), pool);
          drawRow(R.it);
          ask();
        } else roundDone();
      }, 300 + cells.length * step + o.nextMs);
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
      Array.prototype.forEach.call(elRow.children, function (c, i) {
        var u = Math.floor(i / it.unit), pos = i % it.unit;
        c.classList.add('u' + (u % 2));
        if (pos === 0) c.classList.add('u-start');
        if (pos === it.unit - 1 || i === it.seq.length - 1) c.classList.add('u-end');
      });
      say(T.hinted, 'help');
      setActions([hintButton()]);
      tagOpts();
      log('game-help', { itemId: it.id, helpLevel: 'A2', helpType: 'chunk-units', trigger: 'child-request', unit: it.unit });
    }

    function finish() {
      elEnd.hidden = false;
      ri = rounds.length;
      paintRounds(rounds.length);
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.pt-end-line').textContent = fmt(T.endLine, { n: rounds.length });
      var st = elEnd.querySelector('.pt-stamps');
      st.innerHTML = '';
      rounds.forEach(function (r, i) { st.appendChild(h('span', 'pt-dot is-done', (i + 1) + '판')); });
      var acts = elEnd.querySelector('.pt-end-btns');
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
      var b = e.target.closest('[data-pt-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-pt-act')); return; }
      var c = e.target.closest('.pt-opt');
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

  global.PatternNext = { version: VERSION, mount: mount, makeItem: makeItem };
})(window);
