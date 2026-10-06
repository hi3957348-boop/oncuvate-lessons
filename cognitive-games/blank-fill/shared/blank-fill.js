/*!
 * 「빈칸 채우기」 지나가는 숫자 기억 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 1장 작업기억 「불러 주는 숫자(글자)를 잘 들으며 빈칸 채워 넣기 1~5」(41~50쪽)
 *            (차례대로 불러 주는 숫자를 들으며 빈칸에 들어갈 숫자 적기) — 활동 방식만 가져왔다. 소리 대신 화면으로 하나씩 보여 준다.
 *
 * 한 문제: 아래 「종이」에 숫자 줄이 있고 몇 칸이 빈칸 → 「보기 시작」을 누르면
 *   위 화면에 숫자가 하나씩(약 1초) 나타나고, 종이의 그 자리가 금색으로 따라간다(빈칸 자리에서는 「?」가 빛남).
 *   다 지나가면 빈칸을 차례로 채운다: 보기 칩 4개 가운데 그 자리에 나왔던 숫자를 누른다. 누르는 순간 판정.
 *   틀린 보기는 바로 앞·뒤에 나온 숫자(자리 헷갈림)와 범위 안 다른 수로 만든다.
 *   어긋나면 1번째 = 칩이 흔들림 / 같은 빈칸 2번째 = 맞는 칩이 금색으로 반짝(A4).
 *   「한 번 더 보기」(아이가 고름, 도움 A2): 숫자 줄을 처음부터 다시 보여 준다(문제마다 한 번).
 *   kind:'syllable'이면 숫자 대신 글자(가·나·다 …)로 한다(책 49~50쪽).
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 보기 칩     data-track="answer" + data-item-id(문제-빈칸) + data-correct + data-response + (맞는 칩) data-accuracy
 *   - 한 번 더    data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '빈칸 채우기',
    ready: '숫자가 하나씩 지나가요. 빈칸 자리에 나온 것을 기억해요.',
    readySyl: '글자가 하나씩 지나가요. 빈칸 자리에 나온 것을 기억해요.',
    start: '시작',
    go: '보기 시작',
    look: '종이의 금색 자리를 따라가며 봐요.',
    ask: '금색 빈칸에는 무엇이 나왔나요?',
    miss: '다시 떠올려 봐요. 그 자리 바로 앞뒤도 생각해 봐요.',
    cue: '반짝이는 것을 눌러요.',
    hint: '한 번 더 보기',
    hinted: '다시 보여 줄게요. 빈칸 자리를 잘 봐요.',
    good: ['다 채웠어요!', '좋아요! 빈칸을 다 기억했어요.', '그렇지요! 딱 맞아요.'],
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
  var SYL = '가나다라마바사아자하고노도로모보소오조호구누두루무부수우주후'.split('');

  var DEFAULTS = {
    activityId: 'blank-fill',
    storageKey: null,
    rounds: [],                // [ { id, kind:'number'|'syllable', min, max, pool, length, blanks, showMs, gapMs, count } ]
    sound: true,
    restartButton: true,
    credit: '',
    coachBase: 'assets/images/jelly/',
    coachExt: '.webp',
    texts: null,
    nextMs: 1500,
    debug: false,
    onRoundEnd: null,
    onFinish: null
  };

  var CSS = [
    '.bf-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;--cream:#fff8e8;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:bf / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.bf-root *,.bf-root *::before,.bf-root *::after{box-sizing:border-box}',
    '.bf-root [hidden]{display:none!important}',
    '.bf-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    '.bf-arena{container:bfarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.bf-stage{position:absolute;inset:0;padding:5cqmin;display:grid;grid-template-rows:minmax(0,46fr) minmax(0,54fr);gap:4cqmin}',
    '.bf-tv{position:relative;justify-self:center;width:72%;height:100%;border-radius:20px;background:#14104a;box-shadow:inset 0 0 0 5px #2b2380,0 6px 0 #0d0a33;',
    'display:grid;place-items:center;overflow:hidden}',
    '.bf-tv b{font-size:24cqmin;font-weight:900;color:#fff6dc;line-height:1;font-variant-numeric:tabular-nums;text-shadow:0 0 18px rgba(255,210,63,.45)}',
    '.bf-tv b.is-flash{animation:bf-in .25s ease-out}',
    '.bf-tv b.is-dim{color:#8a7fc0;text-shadow:none;font-size:14cqmin}',
    '.bf-sheet{align-self:center;justify-self:center;width:100%;padding:3cqmin;border-radius:16px;background:#fffdf6;box-shadow:0 5px 0 #d9cfa8;',
    'display:grid;grid-template-columns:repeat(var(--cols,4),minmax(0,1fr));gap:2cqmin}',
    '.bf-c{position:relative;aspect-ratio:1.25;border-radius:10px;display:grid;place-items:center;background:#f3eedd;',
    'font-size:7.6cqmin;font-weight:900;color:#27344e;font-variant-numeric:tabular-nums;transition:box-shadow .15s,background .15s}',
    '.bf-c.is-blank{background:#fff;box-shadow:inset 0 0 0 2.5px #b9aee6;color:var(--v6)}',
    '.bf-c.is-blank:not(.is-filled)::before{content:"?";color:#b9aee6}',
    '.bf-c.is-ptr{box-shadow:inset 0 0 0 3px var(--gold);background:#fff6d6}',
    '.bf-c.is-blank.is-ptr::before{color:var(--gold-d)}',
    '.bf-c.is-now{box-shadow:inset 0 0 0 3px var(--gold);background:#fff6d6;animation:bf-bob 1s ease-in-out infinite}',
    '.bf-c.is-filled{background:#effff7;box-shadow:inset 0 0 0 3px var(--mint);color:#14704b;animation:bf-pop .35s cubic-bezier(.3,1.5,.5,1)}',

    '.bf-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.bf-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.bf-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.bf-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.bf-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 8px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.bf-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.bf-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.bf-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.bf-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.bf-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.bf-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.bf-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.bf-coach.is-temp .bf-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.bf-coach.is-good .bf-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.bf-steps{list-style:none;margin:0;padding:0;display:flex;justify-content:center;gap:7px}',
    '.bf-steps li{width:14px;height:14px;border-radius:50%;background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.bf-steps li.is-now{background:#fff6d6;box-shadow:inset 0 0 0 3px var(--gold)}',
    '.bf-steps li.is-done{background:var(--mint);box-shadow:none}',
    '.bf-panel{container:bfpanel / size;flex:1 1 auto;min-height:0;position:relative;border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.bf-panel-in{position:absolute;inset:0;padding:10px;display:flex;flex-wrap:wrap;align-content:center;align-items:center;justify-content:center;gap:4cqmin}',
    '.bf-chip{--w:min(40cqh,20cqw,110px);width:var(--w);height:var(--w);border:0;margin:0;padding:0;border-radius:16px;cursor:pointer;font:inherit;',
    'font-size:calc(var(--w) * .42);font-weight:900;color:var(--ink);background:#fff;box-shadow:0 5px 0 var(--v3),inset 0 0 0 2px var(--v1);font-variant-numeric:tabular-nums;transition:transform .12s,opacity .2s}',
    '.bf-chip:active{transform:translateY(3px);box-shadow:0 2px 0 var(--v3)}',
    '.bf-chip:focus-visible{outline:4px solid rgba(75,201,220,.8);outline-offset:3px}',
    '.bf-chip.is-gone{opacity:.3;pointer-events:none}',
    '.bf-chip.is-cue{animation:bf-cue 1s ease-in-out infinite}',
    '.bf-chip.is-shake{animation:bf-shake .4s}',
    '.bf-info{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}',
    '.bf-info-icon{font-size:clamp(28px,24cqh,46px);line-height:1}',
    '.bf-info-big{font-size:clamp(18px,15cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.bf-info-small{font-size:clamp(13px,10cqh,16px);font-weight:700;color:var(--muted)}',
    '.bf-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.bf-left{display:flex;gap:8px;margin-right:auto}',
    '.bf-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.bf-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.bf-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.bf-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.bf-btn:focus-visible,.bf-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.bf-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.bf-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.bf-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.bf-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.bf-end .bf-btns{margin:0;justify-content:center}',
    '.bf-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.bf-stamps .bf-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.bf-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.bf-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '@keyframes bf-in{from{transform:scale(.6)}}',
    '@keyframes bf-pop{from{transform:scale(.6)}}',
    '@keyframes bf-bob{50%{transform:translateY(-6%)}}',
    '@keyframes bf-cue{50%{box-shadow:0 5px 0 var(--v3),0 0 0 6px var(--gold),0 0 22px rgba(255,210,63,.8)}}',
    '@keyframes bf-shake{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}',

    '@container bf (max-aspect-ratio:5/4){',
    '.bf-wrap{--arena:min(calc(100cqw - 24px),54cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.bf-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.bf-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('bf-style')) return;
    var s = document.createElement('style');
    s.id = 'bf-style';
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
    tick: function () { tones([660], 0.04, 'sine', 0.06); },
    blank: function () { tones([880], 0.06, 'triangle', 0.09); },
    hit: function () { tones([784, 988], 0.07, 'sine', 0.12); },
    miss: function () { tones([294, 262], 0.09, 'triangle', 0.1); },
    show: function () { tones([587, 698], 0.08, 'sine', 0.08); },
    done: function () { tones([523, 659, 784, 1047], 0.09, 'sine', 0.14); }
  };

  /* 문제 만들기 */
  function makeItem(spec, id) {
    var len = Math.max(4, Math.min(spec.length || 6, 12)), seq = [], vals, i;
    if (spec.kind === 'syllable') {
      vals = shuffle(spec.pool && spec.pool.length ? spec.pool : SYL);
      seq = vals.slice(0, len);
    } else {
      var lo = spec.min || 0, hi = Math.max(lo + len, spec.max || 20);
      while (seq.length < len) {
        var v = lo + Math.floor(Math.random() * (hi - lo + 1));
        if (seq.indexOf(v) < 0) seq.push(v);
      }
    }
    /* 빈칸 자리: 서로 붙지 않게 */
    var nb = Math.max(1, Math.min(spec.blanks || 2, Math.floor(len / 2))), idx = [];
    for (var t = 0; t < 200 && idx.length < nb; t++) {
      var p = Math.floor(Math.random() * len);
      if (idx.indexOf(p) < 0 && idx.indexOf(p - 1) < 0 && idx.indexOf(p + 1) < 0) idx.push(p);
    }
    idx.sort(function (a, b) { return a - b; });
    /* 빈칸마다 보기: 정답 + 바로 앞·뒤 + 범위 안 다른 것 */
    var opts = idx.map(function (p) {
      var o = [seq[p]];
      [p - 1, p + 1].forEach(function (q) { if (q >= 0 && q < len && o.indexOf(seq[q]) < 0) o.push(seq[q]); });
      var pool = spec.kind === 'syllable' ? shuffle(spec.pool && spec.pool.length ? spec.pool : SYL) : null;
      for (var g = 0; o.length < 4 && g < 200; g++) {
        var x = pool ? pool[g % pool.length] : ((spec.min || 0) + Math.floor(Math.random() * ((spec.max || 20) - (spec.min || 0) + 1)));
        if (o.indexOf(x) < 0) o.push(x);
      }
      return shuffle(o);
    });
    return { id: id, kind: spec.kind === 'syllable' ? 'syllable' : 'number', seq: seq, blanks: idx, options: opts };
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
    function sfx(name) { if (soundOn) SFX[name](); }

    function log(type, detail) {
      var d = { type: type, schemaVersion: '0.2', activityId: o.activityId };
      for (var key in detail) d[key] = detail[key];
      try { global.dispatchEvent(new CustomEvent('oncuvate:log', { detail: d })); } catch (e) {}
      if (o.debug && global.console) console.log('[oncuvate:log]', d);
    }
    function coachSrc(mood) { return o.coachBase ? o.coachBase + COACH[mood] + o.coachExt : ''; }
    if (o.coachBase) Object.keys(COACH).forEach(function (m) { var im = new Image(); im.src = coachSrc(m); });

    var root = h('div', 'bf-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'primary');
    root.innerHTML =
      '<div class="bf-wrap">' +
        '<div class="bf-arena"><div class="bf-stage">' +
          '<div class="bf-tv" aria-live="off"><b class="is-dim">📺</b></div>' +
          '<div class="bf-sheet" role="list" aria-label="종이"></div>' +
        '</div></div>' +
        '<aside class="bf-side">' +
          '<div class="bf-top">' +
            '<span class="bf-title">' + esc(T.title) + '</span>' +
            '<ol class="bf-rounds" aria-label="판"></ol>' +
            '<button type="button" class="bf-sound" data-bf-act="sound"></button>' +
          '</div>' +
          '<div class="bf-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="bf-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="bf-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<ol class="bf-steps" aria-label="문제"></ol>' +
          '<div class="bf-panel"><div class="bf-panel-in" role="group" aria-label="보기"></div></div>' +
          '<div class="bf-actions"><div class="bf-left"></div><div class="bf-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="bf-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="bf-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="bf-end-line"></p><div class="bf-stamps"></div><div class="bf-btns"></div>' +
        (o.credit ? '<p class="bf-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'bf-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.bf-rounds'), elSound = $('.bf-sound'), elTv = $('.bf-tv b'), elSheet = $('.bf-sheet'),
        elCoach = $('.bf-coach'), elCoachImg = $('.bf-coach-img'), elBubble = $('.bf-bubble'), elSteps = $('.bf-steps'),
        elPanel = $('.bf-panel-in'), elLeft = $('.bf-left'), elActs = $('.bf-side .bf-btns'), elEnd = $('.bf-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var rounds = [], R = null, ri = 0, results = [], timers = [], tempTimer = null, playSeq = 0;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'bf-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood) {
      say(text, mood, 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1600);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'bf-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-bf-act', act);
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
        var li = h('li', 'bf-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), (i + 1) + '판');
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
    function panelInfo(icon, big, small) {
      elPanel.innerHTML = '';
      var d = h('div', 'bf-info');
      d.appendChild(h('span', 'bf-info-icon', icon));
      d.appendChild(h('b', 'bf-info-big', esc(big)));
      if (small) d.appendChild(h('span', 'bf-info-small', esc(small)));
      elPanel.appendChild(d);
    }
    function tv(text, dim) {
      elTv.className = dim ? 'is-dim' : '';
      elTv.textContent = text;
      if (!dim) { void elTv.offsetWidth; elTv.classList.add('is-flash'); }
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var r = rounds[i];
      R = { r: r, qi: 0, phase: 'ready', sayText: '', sayMood: 'ready', tally: { accurate: 0, 'self-corrected': 0, support: 0 } };
      paintRounds(i);
      paintSteps();
      elSheet.innerHTML = '';
      tv('📺', true);
      panelInfo(r.kind === 'syllable' ? '🔤' : '🔢', (i + 1) + '판 · ' + r.length + '칸 · 빈칸 ' + r.blanks + '개', r.count + '번 해요');
      say(r.kind === 'syllable' ? T.readySyl : T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    /* 문제 준비: 종이만 보여 주고 「보기 시작」을 기다린다 */
    function prepare() {
      var it = makeItem(R.r, R.r.id + '-' + (R.qi + 1));
      R.it = it;
      R.phase = 'prep';
      R.bi = 0; R.misses = 0; R.bMiss = 0; R.helps = 0; R.replayed = false; R.cued = false;
      var cols = it.seq.length <= 6 ? 3 : 4;
      if (it.seq.length > 8) cols = 5;
      elSheet.style.setProperty('--cols', cols);
      elSheet.innerHTML = '';
      it.seq.forEach(function (v, i) {
        var blank = it.blanks.indexOf(i) >= 0;
        var c = h('div', 'bf-c' + (blank ? ' is-blank' : ''), blank ? '' : esc(v));
        c.setAttribute('role', 'listitem');
        c.setAttribute('aria-label', blank ? '빈칸' : String(v));
        elSheet.appendChild(c);
      });
      tv('📺', true);
      paintSteps();
      panelInfo('👀', '빈칸 ' + it.blanks.length + '개', '「' + T.go + '」를 누르면 지나가요');
      say(R.r.kind === 'syllable' ? T.readySyl : T.ready, 'ready');
      setActions([button('▶ ' + esc(T.go), 'go')], []);
      log('game-item-ready', { itemId: it.id, kind: it.kind, sequence: it.seq.join(','), blanks: it.blanks.map(function (x) { return x + 1; }).join(','), length: it.seq.length, engine: 'blank-fill@' + VERSION });
    }

    /* 숫자 지나가기 — setTimeout만 쓴다(창이 가려져도 끝까지 돈다) */
    function play(after) {
      var it = R.it, token = ++playSeq, show = R.r.showMs || 1000, gap = R.r.gapMs || 400;
      R.phase = 'play';
      setActions([], []);
      panelInfo('👀', '잘 봐요', '빈칸 자리에 나온 것을 기억해요');
      say(T.look, 'look');
      var cells = elSheet.children;
      Array.prototype.forEach.call(cells, function (c) { c.classList.remove('is-ptr', 'is-now'); });
      var steps = ['3', '2', '1'];
      steps.forEach(function (s, i) { later(function () { if (token === playSeq) { tv(s, true); sfx('tick'); } }, i * 450); });
      var base = steps.length * 450;
      it.seq.forEach(function (v, i) {
        later(function () {
          if (token !== playSeq) return;
          Array.prototype.forEach.call(cells, function (c, j) { c.classList.toggle('is-ptr', j === i); });
          tv(String(v), false);
          sfx(it.blanks.indexOf(i) >= 0 ? 'blank' : 'tick');
        }, base + i * (show + gap));
        later(function () { if (token === playSeq) tv('', true); }, base + i * (show + gap) + show);
      });
      later(function () {
        if (token !== playSeq) return;
        Array.prototype.forEach.call(cells, function (c) { c.classList.remove('is-ptr'); });
        tv('?', true);
        after();
      }, base + it.seq.length * (show + gap) + 200);
    }

    function askBlank() {
      var it = R.it, p = it.blanks[R.bi];
      R.phase = 'pick';
      R.bMiss = 0; R.cued = false;
      R.tAsk = now();
      Array.prototype.forEach.call(elSheet.children, function (c, j) { c.classList.toggle('is-now', j === p); });
      elPanel.innerHTML = '';
      it.options[R.bi].forEach(function (v) {
        var b = h('button', 'bf-chip', esc(v));
        b.type = 'button';
        b.setAttribute('data-v', v);
        b.setAttribute('aria-label', String(v));
        elPanel.appendChild(b);
      });
      tagChips();
      say(T.ask, 'ask');
      setActions([], R.replayed ? [] : [hintButton()]);
    }
    function accNow() { return R.helps ? 'support' : (R.bMiss ? 'self-corrected' : 'accurate'); }
    function tagChips() {
      var it = R.it, want = String(it.seq[it.blanks[R.bi]]);
      Array.prototype.forEach.call(elPanel.querySelectorAll('.bf-chip'), function (b) {
        var right = b.getAttribute('data-v') === want;
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', it.id + '-' + (R.bi + 1));
        b.setAttribute('data-response', b.getAttribute('data-v'));
        b.setAttribute('data-correct', right ? 'true' : 'false');
        if (right) b.setAttribute('data-accuracy', accNow()); else b.removeAttribute('data-accuracy');
      });
    }
    function hintButton() {
      return button('🔁 ' + esc(T.hint), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'replay', 'data-item-id': R.it.id
      });
    }

    function onChip(b) {
      if (!R || R.phase !== 'pick' || b.classList.contains('is-gone')) return;
      var it = R.it, p = it.blanks[R.bi], want = String(it.seq[p]), v = b.getAttribute('data-v'), t = now();
      if (v === want) {
        log('game-response', { itemId: it.id + '-' + (R.bi + 1), position: p + 1, target: want, response: v, correct: true, attempt: R.bMiss + 1, accuracy: accNow(), responseMs: Math.round(t - R.tAsk) });
        var c = elSheet.children[p];
        c.classList.remove('is-now');
        c.classList.add('is-filled');
        c.textContent = want;
        sfx('hit');
        R.bi++;
        if (R.bi >= it.blanks.length) { done(); return; }
        askBlank();
        return;
      }
      R.bMiss++;
      R.misses++;
      sfx('miss');
      var near = (p > 0 && String(it.seq[p - 1]) === v) || (p < it.seq.length - 1 && String(it.seq[p + 1]) === v);
      log('game-response', { itemId: it.id + '-' + (R.bi + 1), position: p + 1, target: want, response: v, correct: false, attempt: R.bMiss, errorType: near ? 'neighbor' : 'other', responseMs: Math.round(t - R.tAsk) });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake', 'is-gone');
      later(function () { b.classList.remove('is-shake'); }, 400);
      var left = elPanel.querySelectorAll('.bf-chip:not(.is-gone)').length;
      if (R.bMiss >= 2 && !R.cued && left > 1) {
        R.cued = true;
        R.helps++;
        var r = elPanel.querySelector('[data-v="' + want + '"]');
        if (r) r.classList.add('is-cue');
        log('game-help', { itemId: it.id + '-' + (R.bi + 1), helpLevel: 'A4', helpType: 'cue-chip', trigger: 'second-miss' });
        say(T.cue, 'ask');
      } else {
        sayTemp(T.miss, 'miss');
      }
      tagChips();
    }

    function doHint() {
      if (!R || R.phase !== 'pick' || R.replayed) return;
      R.replayed = true;
      R.helps++;
      sfx('show');
      log('game-help', { itemId: R.it.id, helpLevel: 'A2', helpType: 'replay', trigger: 'child-request', blank: R.bi + 1 });
      say(T.hinted, 'look');
      later(function () { play(askBlank); }, 700);
    }

    function done() {
      var it = R.it, acc = R.helps ? 'support' : (R.misses ? 'self-corrected' : 'accurate');
      R.phase = 'done';
      setActions([], []);
      sfx('done');
      R.tally[acc]++;
      tv('✓', true);
      panelInfo('🎉', pick(T.good), '');
      say(pick(T.good), 'good', 'is-good');
      var summary = { itemId: it.id, kind: it.kind, length: it.seq.length, blanks: it.blanks.length, accuracy: acc, misses: R.misses, helps: R.helps, replayed: R.replayed, totalMs: Math.round(now() - R.tStart) };
      results.push(summary);
      log('game-item-complete', summary);
      later(function () {
        R.qi++;
        if (R.qi < R.r.count) prepare();
        else roundDone();
      }, o.nextMs);
    }

    function roundDone() {
      R.phase = 'round-done';
      paintSteps();
      var left = rounds.length - ri - 1;
      panelInfo('🎉', fmt(T.infoDone, { n: ri + 1 }), left ? fmt(T.infoLeft, { n: left }) : T.infoLast);
      var sum = { roundId: R.r.id, items: R.r.count, accurate: R.tally.accurate, selfCorrected: R.tally['self-corrected'], support: R.tally.support };
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
      elEnd.querySelector('.bf-end-line').textContent = fmt(T.endLine, { n: rounds.length });
      var st = elEnd.querySelector('.bf-stamps');
      st.innerHTML = '';
      rounds.forEach(function (r, i) { st.appendChild(h('span', 'bf-dot is-done', (i + 1) + '판')); });
      var acts = elEnd.querySelector('.bf-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      var tally = { accurate: 0, 'self-corrected': 0, support: 0 };
      results.forEach(function (r) { tally[r.accuracy]++; });
      log('game-activity-complete', { rounds: rounds.length, items: results.length, accurate: tally.accurate, selfCorrected: tally['self-corrected'], support: tally.support });
      if (typeof o.onFinish === 'function') { try { o.onFinish(results.slice()); } catch (e) {} }
    }

    function restart() {
      clearTimers();
      playSeq++;
      rounds = o.rounds.map(function (r, i) {
        var x = {};
        for (var key in r) x[key] = r[key];
        x.id = r.id || ('r' + (i + 1));
        x.count = r.count || 3;
        x.length = r.length || 6;
        x.blanks = r.blanks || 2;
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
      if (name === 'start' && R.phase === 'ready') prepare();
      else if (name === 'go' && R.phase === 'prep') { R.tStart = now(); play(askBlank); }
      else if (name === 'hint') doHint();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-bf-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-bf-act')); return; }
      var c = e.target.closest('.bf-chip');
      if (c && root.contains(c)) onChip(c);
    }
    root.addEventListener('click', onClick);

    restart();

    return {
      root: root,
      restart: restart,
      results: function () { return results.slice(); },
      destroy: function () { clearTimers(); playSeq++; clearTimeout(tempTimer); root.remove(); }
    };
  }

  global.BlankFill = { version: VERSION, mount: mount, makeItem: makeItem };
})(window);
