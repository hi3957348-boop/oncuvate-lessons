/*!
 * 「순서대로 콕콕」 순서 기억 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 1장 작업기억
 *            「숫자 따라 말하기」「숫자 듣고 거꾸로 말하기」「낱말 거꾸로 말하기」(39~60쪽)
 *            — 불러 주는 것을 순서대로(또는 거꾸로) 기억해 내는 활동. 방식만 가져왔고 책의 숫자·낱말 목록은 쓰지 않았다.
 *
 * 한 번(시행)의 흐름
 *   보기: 그림이 하나씩 나타났다 뒷면으로 사라진다(위 칸줄에서 그 차례 칸이 금색으로 빛남)
 *   누르기: 받침에서 그림을 차례대로 누른다 — 누르는 순간 판정
 *           앞으로(forward)는 왼쪽 칸부터, 거꾸로(backward)는 오른쪽 칸(마지막에 본 그림)부터 채운다
 *   어긋나면 1번째 : 그림이 흔들리고 「다시 떠올려 봐요」 · 「다시 보기」(아이가 고름, 도움 A2)를 누를 수 있다
 *            2번째 : 맞는 그림이 금색으로 반짝(도움 A4)
 *   한 판 = 같은 길이·방향의 시행 여러 번. 시행이 끝나면 저절로 다음 시행으로 넘어간다.
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 받침 그림     data-track="answer" + data-item-id(판-시행-몇째) + data-correct + data-response + (맞는 그림) data-accuracy
 *   - 다시 보기     data-track="hint" data-help-level="A2"
 *   - 끝 화면       data-track="activity-complete"
 *   - 자세한 신호   oncuvate:log  game-item-ready(시행) / game-response / game-help / game-item-complete(시행) / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '순서대로 콕콕',
    readyF: '그림이 하나씩 나와요. 나온 순서대로 눌러요.',
    readyB: '그림이 하나씩 나와요. 거꾸로, 마지막 그림부터 눌러요.',
    start: '시작',
    watch: '잘 봐요!',
    pressF: '본 순서대로 눌러요.',
    pressB: '거꾸로! 마지막에 본 그림부터 눌러요.',
    oops: '다시 떠올려 봐요.',
    cue: '반짝이는 그림이에요.',
    replay: '다시 보기',
    good: ['좋아요!', '딱 맞아요!', '척척이에요!'],
    next: '다음 판',
    finish: '다 했어요',
    allDone: '{n}번 모두 했어요!',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoCount: '그림 {n}개 · {t}번',
    infoF: '본 순서대로 ➜',
    infoB: '⬅ 거꾸로 (마지막 그림부터)',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    dirF: '순서대로 ➜',
    dirB: '⬅ 거꾸로',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var DEFAULTS = {
    activityId: 'sequence-memory',
    storageKey: null,
    pool: [],                  // [ {key, label, img|emoji} ]
    rounds: [],                // [ {id, mode:'forward'|'backward', length, trials, distractors} ]
    showMs: 1000,              // 그림 하나 보여 주는 시간
    gapMs: 350,                // 그림 사이 쉬는 시간
    showLabels: true,
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

  var COACH = { ready: 'jelly-default', watch: 'jelly-look', press: 'jelly-default', oops: 'jelly-thinking',
                help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer' };

  /* ───────────── 스타일 ───────────── */
  var CSS = [
    '.sm-root,.sm-drag{--v8:#3b2a9e;--v7:#4a32c9;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--coral:#ff8a80;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}',
    '.sm-root{container:sm / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.sm-root *,.sm-root *::before,.sm-root *::after{box-sizing:border-box}',
    '.sm-root [hidden]{display:none!important}',
    '.sm-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    /* 무대: 위 칸줄 + 가운데 보여 주는 자리 */
    '.sm-arena{container:smarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'display:flex;flex-direction:column;align-items:center;gap:4cqh;padding:6cqh 4cqw 5cqh;',
    'border-radius:18px;background:radial-gradient(circle at 50% 58%,#5b48d6 0%,#3b2a9e 50%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.sm-rays{position:absolute;left:50%;top:58%;width:1400px;height:1400px;margin:-700px 0 0 -700px;pointer-events:none;',
    'background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.05) 0 8deg,transparent 8deg 20deg);animation:sm-spin 90s linear infinite}',
    '.sm-rail{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:1.6cqh}',
    '.sm-dir{padding:3px 12px;border-radius:99px;background:rgba(255,255,255,.14);color:#fff;font-size:clamp(12px,3.6cqmin,16px);font-weight:900;letter-spacing:-.01em}',
    '.sm-dir.is-back{background:var(--gold);color:#3b2a9e}',
    '.sm-slots{--n:3;--ss:min(calc((92cqw - (var(--n) - 1) * 1.6cqw) / var(--n)),22cqh,20cqw);display:flex;gap:1.6cqw}',
    '.sm-slot{container-type:size;position:relative;width:var(--ss);height:var(--ss);border-radius:12px;display:flex;align-items:center;justify-content:center;',
    'background:rgba(255,255,255,.09);box-shadow:inset 0 0 0 2px rgba(255,255,255,.18);transition:box-shadow .15s,background .15s}',
    '.sm-slot>i{position:absolute;left:6%;top:4%;font-style:normal;font-size:clamp(10px,20cqmin,16px);font-weight:900;color:rgba(255,255,255,.5)}',
    '.sm-slot.is-lit{background:rgba(255,210,63,.22);box-shadow:inset 0 0 0 3px var(--gold),0 0 16px rgba(255,210,63,.5)}',
    '.sm-slot.is-next{box-shadow:inset 0 0 0 2px rgba(255,210,63,.75)}',
    '.sm-slot.sm-wob{animation:sm-wob .45s ease-in-out}',
    '.sm-stage{position:relative;z-index:2;flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center}',
    '.sm-big{width:min(40cqw,40cqh);height:min(40cqw,40cqh)}',

    /* 카드 */
    '.sm-card{container-type:size;position:relative;display:block;perspective:700px;outline:none;transition:transform .18s cubic-bezier(.3,1.5,.5,1),opacity .2s}',
    '.sm-flip{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .42s cubic-bezier(.3,1.35,.5,1)}',
    '.sm-card.is-down .sm-flip{transform:rotateY(180deg)}',
    '.sm-face,.sm-back{position:absolute;inset:0;border-radius:14px;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden}',
    '.sm-face{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9% 4% 7%;',
    'background:linear-gradient(180deg,#fff 0%,#fffaf0 100%);box-shadow:inset 0 0 0 2px #fff,inset 0 -5px 0 #efe6d2,0 4px 0 var(--v3),0 8px 14px rgba(10,4,50,.2)}',
    '.sm-face::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,var(--gold),var(--orange))}',
    '.sm-back{transform:rotateY(180deg);display:grid;place-items:center;',
    'background:radial-gradient(ellipse at 28% 12%,rgba(255,255,255,.45),transparent 42%),',
    'repeating-linear-gradient(45deg,rgba(255,255,255,.1) 0 5px,transparent 5px 14px),',
    'repeating-linear-gradient(-45deg,rgba(255,255,255,.1) 0 5px,transparent 5px 14px),linear-gradient(150deg,#8b72ff 0%,#5b48d6 50%,#3b2a9e 100%);',
    'box-shadow:inset 0 0 0 3px rgba(255,255,255,.75),inset 0 0 0 6px #4a32c9,inset 0 0 0 7px rgba(255,210,63,.6),0 4px 0 #231773}',
    '.sm-gem{display:grid;place-items:center;width:34cqmin;height:34cqmin;border-radius:50%;color:#3b2a9e;font-size:19cqmin;font-weight:900;font-style:normal;',
    'background:radial-gradient(circle at 35% 30%,#fff3b0,#ffd23f 55%,#e0a100);box-shadow:0 0 0 3px rgba(59,42,158,.55),0 0 14px rgba(255,210,63,.6)}',
    '.sm-img{width:64cqmin;height:64cqmin;object-fit:contain;pointer-events:none;-webkit-user-drag:none}',
    '.sm-pic{font-size:52cqmin;line-height:1}',
    '.sm-lab{font-size:clamp(10px,14.5cqmin,22px);font-weight:850;color:#2b2140;line-height:1.15;text-align:center;letter-spacing:-.02em}',
    '.sm-lab.is-only{font-size:clamp(14px,30cqmin,48px);font-weight:900}',
    '.sm-slot .sm-card{width:88%;height:88%}',
    '.sm-slot .sm-face{box-shadow:inset 0 0 0 3px var(--mint),0 3px 0 #9fdcc0}',
    '.sm-slot .sm-face::before{background:var(--mint)}',
    '.sm-card.is-in{animation:sm-pop .3s cubic-bezier(.3,1.5,.5,1)}',

    /* 오른쪽 칸 */
    '.sm-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.sm-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.sm-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.sm-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.sm-dot{display:inline-flex;align-items:center;justify-content:center;gap:1px;min-width:28px;height:28px;padding:0 6px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:11px;font-weight:900;white-space:nowrap}',
    '.sm-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.sm-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.sm-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.sm-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.sm-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.sm-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.sm-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.sm-coach.is-temp .sm-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.sm-coach.is-good .sm-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.sm-prog{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:var(--muted)}',
    '.sm-prog i{width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px var(--v3)}',
    '.sm-prog i.on{background:var(--mint);box-shadow:none}.sm-prog i.now{box-shadow:inset 0 0 0 3px var(--gold)}',
    '.sm-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.sm-info-icon{font-size:clamp(30px,10cqh,48px);line-height:1}',
    '.sm-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.sm-info-small{font-size:clamp(13px,3.8cqh,17px);font-weight:800;color:var(--muted)}',
    '.sm-info-small.is-back{color:#b07a00}',
    '.sm-tray{--tc:clamp(56px,min(19cqh,10.5cqw),96px);flex:1 1 auto;min-height:0;overflow:auto;display:flex;flex-wrap:wrap;align-content:flex-start;justify-content:center;',
    'gap:10px;padding:10px;border-radius:16px;background:#f3effd;box-shadow:inset 0 0 0 2px #e6dffa}',
    '.sm-tray .sm-card{flex:none;width:var(--tc);height:var(--tc);cursor:pointer;touch-action:manipulation}',
    '.sm-tray.is-many{--tc:clamp(50px,min(14cqh,8.5cqw),80px)}',
    '.sm-tray.is-lots{--tc:clamp(44px,min(11.5cqh,7cqw),68px)}',
    '.sm-tray .sm-card:hover{transform:translateY(-3px) rotate(-1.5deg)}',
    '.sm-tray .sm-card:focus-visible .sm-face{box-shadow:inset 0 0 0 3px #4bc9dc,0 4px 0 var(--v3)}',
    '.sm-tray .sm-card.is-used{opacity:.28;pointer-events:none}',
    '.sm-tray .sm-card.is-no .sm-face{box-shadow:inset 0 0 0 3px var(--coral),0 4px 0 #f3b7ae}',
    '.sm-tray .sm-card.sm-wob{animation:sm-wob .45s ease-in-out}',
    '.sm-tray .sm-card.is-cue .sm-face{animation:sm-cue 1s ease-in-out infinite}',
    '.sm-tray.is-wait .sm-card{pointer-events:none}','.sm-tray .sm-card.is-down:hover{transform:none}',
    '.sm-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.sm-left{display:flex;gap:8px;margin-right:auto}',
    '.sm-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.sm-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 20px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.sm-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.sm-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.sm-btn:focus-visible,.sm-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    /* 끝 화면 */
    '.sm-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.sm-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.sm-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.sm-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.sm-end .sm-btns{margin:0;justify-content:center}',
    '.sm-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.sm-stamps .sm-dot{height:40px;padding:0 12px;border-radius:12px;font-size:14px}',
    '.sm-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.sm-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '.sm-bit{position:absolute;left:50%;top:50%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:sm-bit .9s ease-out forwards}',
    '@keyframes sm-spin{to{transform:rotate(360deg)}}',
    '@keyframes sm-pop{from{transform:scale(.7)}}',
    '@keyframes sm-wob{20%{transform:rotate(-6deg) translateX(-5px)}45%{transform:rotate(5deg) translateX(5px)}70%{transform:rotate(-2deg)}}',
    '@keyframes sm-cue{0%,100%{box-shadow:inset 0 0 0 3px var(--gold),0 4px 0 var(--gold-d)}50%{box-shadow:inset 0 0 0 4px var(--gold),0 4px 0 var(--gold-d),0 0 0 6px rgba(255,210,63,.55)}}',
    '@keyframes sm-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    '@container sm (max-aspect-ratio:5/4){',
    '.sm-wrap{--arena:min(calc(100cqw - 24px),50cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.sm-side{width:100%}.sm-tray{--tc:clamp(56px,18cqw,84px)}}',

    '@media (prefers-reduced-motion:reduce){.sm-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('sm-style')) return;
    var s = document.createElement('style');
    s.id = 'sm-style';
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
    show: function (i) { tones([523 + i * 70], 0.08, 'sine', 0.1); },
    tick: function () { tones([784], 0.05, 'sine', 0.1); },
    again: function () { tones([440, 392], 0.1, 'triangle', 0.1); },
    ok: function () { tones([659, 880], 0.08, 'sine', 0.13); },
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
    var POOL = {};
    o.pool.forEach(function (p) { POOL[p.key] = p; });
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
    o.pool.forEach(function (p) { if (p.img) { var im = new Image(); im.src = p.img; } });

    var root = h('div', 'sm-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'primary');
    root.innerHTML =
      '<div class="sm-wrap">' +
        '<div class="sm-arena"><div class="sm-rays"></div>' +
          '<div class="sm-rail"><span class="sm-dir"></span><div class="sm-slots"></div></div>' +
          '<div class="sm-stage"></div>' +
        '</div>' +
        '<aside class="sm-side">' +
          '<div class="sm-top">' +
            '<span class="sm-title">' + esc(T.title) + '</span>' +
            '<ol class="sm-rounds" aria-label="판"></ol>' +
            '<button type="button" class="sm-sound" data-sm-act="sound"></button>' +
          '</div>' +
          '<div class="sm-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="sm-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="sm-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="sm-prog" hidden></div>' +
          '<div class="sm-info" hidden></div>' +
          '<div class="sm-tray" hidden></div>' +
          '<div class="sm-actions"><div class="sm-left"></div><div class="sm-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="sm-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="sm-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="sm-end-line"></p><div class="sm-stamps"></div><div class="sm-btns"></div>' +
        (o.credit ? '<p class="sm-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'sm-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.sm-rounds'), elSound = $('.sm-sound'), elArena = $('.sm-arena'), elDir = $('.sm-dir'), elSlots = $('.sm-slots'),
        elStage = $('.sm-stage'), elCoach = $('.sm-coach'), elCoachImg = $('.sm-coach-img'), elBubble = $('.sm-bubble'),
        elProg = $('.sm-prog'), elInfo = $('.sm-info'), elTray = $('.sm-tray'), elLeft = $('.sm-left'),
        elActs = $('.sm-side .sm-btns'), elEnd = $('.sm-end');

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
      var len = Math.max(2, spec.length || 3), trials = spec.trials || 3, extra = spec.distractors == null ? 2 : spec.distractors;
      var keys = o.pool.map(function (p) { return p.key; }), list = [];
      for (var t = 0; t < trials; t++) {
        var pickd = shuffle(keys);
        list.push({ seq: pickd.slice(0, len), extras: pickd.slice(len, len + extra) });
      }
      return { id: spec.id || ('r' + (idx + 1)), back: spec.mode === 'backward', len: len, trials: list };
    }

    function cardInner(key) {
      var p = POOL[key], pic = '';
      if (p.img) pic = '<img class="sm-img" src="' + esc(p.img) + '" alt="" draggable="false">';
      else if (p.emoji) pic = '<span class="sm-pic" aria-hidden="true">' + esc(p.emoji) + '</span>';
      var lab = (o.showLabels || !pic) ? '<span class="sm-lab' + (pic ? '' : ' is-only') + '">' + esc(p.label) + '</span>' : '';
      return pic + lab;
    }
    function makeCard(key, down) {
      var c = h('div', 'sm-card' + (down ? ' is-down' : ''),
        '<span class="sm-flip"><span class="sm-face">' + cardInner(key) + '</span>' +
        '<span class="sm-back" aria-hidden="true"><i class="sm-gem">?</i></span></span>');
      c.setAttribute('data-key', key);
      return c;
    }

    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'sm-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood, cls) {
      say(text, mood, cls || 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1500);
    }
    function wob(el) {
      el.classList.remove('sm-wob');
      void el.offsetWidth;
      el.classList.add('sm-wob');
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'sm-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-sm-act', act);
      for (var a in attrs || {}) b.setAttribute(a, attrs[a]);
      return b;
    }
    function setActions(list, left) {
      elActs.innerHTML = '';
      list.forEach(function (b) { elActs.appendChild(b); });
      elLeft.innerHTML = '';
      (left || []).forEach(function (b) { elLeft.appendChild(b); });
    }
    function roundDot(p, cls) {
      return h('li', 'sm-dot' + (cls ? ' ' + cls : ''), (p.back ? '⬅' : '➜') + p.len);
    }
    function paintRounds(doneUpTo) {
      elRounds.innerHTML = '';
      plans.forEach(function (p, i) {
        var done = i < doneUpTo;
        var li = roundDot(p, done ? 'is-done' : (i === ri ? 'is-now' : ''));
        li.setAttribute('aria-label', (i + 1) + '판 ' + (p.back ? '거꾸로 ' : '') + '그림 ' + p.len + '개' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function paintProg() {
      var p = R.p;
      elProg.innerHTML = '';
      p.trials.forEach(function (t, j) { elProg.appendChild(h('i', j < R.ti ? 'on' : (j === R.ti ? 'now' : ''))); });
    }
    function showInfo(kind) {
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var p = R.p, left = plans.length - ri - 1;
      if (kind === 'done') {
        elInfo.appendChild(h('span', 'sm-info-icon', '🎉'));
        elInfo.appendChild(h('b', 'sm-info-big', esc(fmt(T.infoDone, { n: ri + 1 }))));
        elInfo.appendChild(h('span', 'sm-info-small', esc(left ? fmt(T.infoLeft, { n: left }) : T.infoLast)));
      } else {
        elInfo.appendChild(h('span', 'sm-info-icon', p.back ? '🔁' : '🎞️'));
        elInfo.appendChild(h('b', 'sm-info-big', esc(fmt(T.infoCount, { n: p.len, t: p.trials.length }))));
        elInfo.appendChild(h('span', 'sm-info-small' + (p.back ? ' is-back' : ''), esc(p.back ? T.infoB : T.infoF)));
      }
      elInfo.hidden = false;
    }

    /* 칸 i(0부터)가 몇 번째로 채워지나 */
    function slotOrder(i) { return R.p.back ? R.p.len - 1 - i : i; }
    function nextSlot() { return R.p.back ? R.p.len - 1 - R.pos : R.pos; }
    function paintSlots(lit) {
      Array.prototype.forEach.call(elSlots.children, function (s, i) {
        s.classList.toggle('is-lit', i === lit);
        s.classList.toggle('is-next', R.phase === 'press' && i === nextSlot() && !s.querySelector('.sm-card'));
      });
    }

    /* ── 판 ── */
    function startRound(i) {
      ri = i;
      clearTimers();
      var p = plans[i];
      R = { p: p, phase: 'ready', ti: 0, pos: 0, errs: 0, replay: false, cue: false, acc: [], sayText: '', sayMood: 'ready',
            trialErr: 0, results: [] };
      paintRounds(i);
      elDir.textContent = p.back ? T.dirB : T.dirF;
      elDir.classList.toggle('is-back', p.back);
      buildSlots();
      elStage.innerHTML = '';
      var c = makeCard(p.trials[0].seq[0], true);
      c.classList.add('sm-big');
      elStage.appendChild(c);
      elTray.hidden = true; elProg.hidden = true;
      showInfo('ready');
      say(p.back ? T.readyB : T.readyF, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }
    function buildSlots() {
      var p = R.p;
      elSlots.innerHTML = '';
      elSlots.style.setProperty('--n', p.len);
      for (var i = 0; i < p.len; i++) {
        var s = h('div', 'sm-slot', '<i>' + (slotOrder(i) + 1) + '</i>');
        elSlots.appendChild(s);
      }
    }

    function startTrial() {
      var p = R.p, tr = p.trials[R.ti];
      clearTimers();
      R.pos = 0; R.errs = 0; R.replay = false; R.cue = false; R.trialErr = 0; R.taps = [];
      buildSlots();
      /* 받침: 뒷면으로 깔아 두었다가 누를 차례에 뒤집는다 */
      elTray.innerHTML = '';
      shuffle(tr.seq.concat(tr.extras)).forEach(function (key) {
        var c = makeCard(key, true);
        c.setAttribute('role', 'button');
        c.setAttribute('aria-label', POOL[key].label);
        c.tabIndex = 0;
        elTray.appendChild(c);
      });
      var n = elTray.children.length;
      elTray.classList.toggle('is-many', n > 6 && n <= 8);
      elTray.classList.toggle('is-lots', n > 8);
      elTray.hidden = false;
      elTray.classList.add('is-wait');
      showInfo(null);
      elProg.hidden = false;
      paintProg();
      setActions([]);
      log('game-item-ready', {
        itemId: p.id + '-' + (R.ti + 1), mode: p.back ? 'backward' : 'forward', length: p.len,
        sequence: tr.seq.map(function (key) { return POOL[key].label; }).join('|'),
        distractors: tr.extras.map(function (key) { return POOL[key].label; }).join('|'),
        engine: 'sequence-memory@' + VERSION
      });
      playSequence(function () { startPress(); });
    }

    /* 그림을 하나씩: 앞면으로 → 잠깐 → 뒷면 */
    function playSequence(done) {
      var tr = R.p.trials[R.ti];
      R.phase = 'watch';
      say(T.watch, 'watch');
      elTray.classList.add('is-wait');
      var t = 350;
      tr.seq.forEach(function (key, i) {
        later(function () {
          elStage.innerHTML = '';
          var c = makeCard(key, true);
          c.classList.add('sm-big');
          elStage.appendChild(c);
          void c.offsetWidth;
          c.classList.remove('is-down');
          paintSlots(i);
          sfx('show', i);
        }, t);
        t += o.showMs;
        later(function () {
          var c = elStage.querySelector('.sm-card');
          if (c) c.classList.add('is-down');
          paintSlots(-1);
        }, t);
        t += o.gapMs;
      });
      later(done, t + 250);
    }

    function startPress() {
      var p = R.p, tr = p.trials[R.ti];
      R.phase = 'press';
      R.tPress = now();
      R.tTap = now();
      Array.prototype.forEach.call(elTray.children, function (c, j) {
        if (c.classList.contains('is-down')) later(function () { c.classList.remove('is-down'); }, reduced ? 0 : j * 60);
      });
      elTray.hidden = false;
      elTray.classList.remove('is-wait');
      say(p.back ? T.pressB : T.pressF, 'press');
      refreshHelp();
      paintSlots(-1);
      arm();
    }
    function refreshHelp() {
      var p = R.p;
      var left = [];
      if (R.trialErr > 0 && !R.replay) {
        left.push(button('🔁 ' + esc(T.replay), 'replay', true, {
          'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'child-request', 'data-item-id': p.id + '-' + (R.ti + 1)
        }));
      }
      setActions([], left);
    }

    function expectedKey() {
      var tr = R.p.trials[R.ti];
      return tr.seq[nextSlot()];
    }
    function accNow() {
      if (R.errs >= 2 || R.replay) return 'support';
      return R.errs === 1 ? 'self-corrected' : 'accurate';
    }
    /* 받침 그림마다 「누르면 맞나」를 미리 붙여 둔다 */
    function arm() {
      if (R.phase !== 'press') return;
      var exp = expectedKey(), p = R.p;
      Array.prototype.forEach.call(elTray.children, function (c) {
        if (c.classList.contains('is-used')) {
          ['data-track', 'data-item-id', 'data-correct', 'data-response', 'data-accuracy'].forEach(function (a) { c.removeAttribute(a); });
          return;
        }
        var key = c.getAttribute('data-key');
        c.setAttribute('data-track', 'answer');
        c.setAttribute('data-item-id', p.id + '-' + (R.ti + 1) + '-' + (R.pos + 1));
        c.setAttribute('data-correct', key === exp ? 'true' : 'false');
        c.setAttribute('data-response', POOL[key].label);
        if (key === exp) c.setAttribute('data-accuracy', accNow()); else c.removeAttribute('data-accuracy');
      });
    }

    function tap(card) {
      if (!R || R.phase !== 'press' || card.classList.contains('is-used')) return;
      var p = R.p, tr = p.trials[R.ti], key = card.getAttribute('data-key'), exp = expectedKey(), ok = key === exp, t = now();
      var inSeq = tr.seq.indexOf(key);
      var errorType = ok ? '' : (inSeq < 0 ? 'intrusion' : 'order');
      var acc = ok ? accNow() : '';
      log('game-response', {
        itemId: p.id + '-' + (R.ti + 1) + '-' + (R.pos + 1), correct: ok, response: POOL[key].label, expected: POOL[exp].label,
        mode: p.back ? 'backward' : 'forward', attempt: R.errs + 1, errorType: errorType, accuracy: acc, responseMs: Math.round(t - R.tTap)
      });
      if (ok) {
        R.acc.push(acc);
        R.taps.push(acc);
        sfx('tick');
        card.classList.remove('is-cue', 'is-no');
        card.classList.add('is-used');
        var slot = elSlots.children[nextSlot()];
        var placed = makeCard(key, false);
        placed.classList.add('is-in');
        slot.appendChild(placed);
        R.pos++;
        R.errs = 0;
        R.tTap = now();
        Array.prototype.forEach.call(elTray.children, function (c) { c.classList.remove('is-cue', 'is-no'); });
        if (R.pos >= p.len) { trialDone(); return; }
        paintSlots(-1);
        arm();
        return;
      }
      R.errs++;
      R.trialErr++;
      sfx('again');
      card.classList.add('is-no');
      wob(card);
      wob(elSlots.children[nextSlot()]);
      later(function () { card.classList.remove('is-no'); }, 500);
      if (R.errs === 1) {
        sayTemp(T.oops, 'oops');
      } else {
        R.cue = true;
        Array.prototype.forEach.call(elTray.children, function (c) {
          if (c.getAttribute('data-key') === exp) c.classList.add('is-cue');
        });
        say(T.cue, 'help');
        log('game-help', { itemId: p.id + '-' + (R.ti + 1) + '-' + (R.pos + 1), helpLevel: 'A4', helpType: 'answer-cue', trigger: 'second-miss' });
      }
      refreshHelp();
      arm();
    }

    function doReplay() {
      if (!R || R.phase !== 'press' || R.replay) return;
      R.replay = true;
      setActions([]);
      log('game-help', { itemId: R.p.id + '-' + (R.ti + 1), helpLevel: 'A2', helpType: 'replay', trigger: 'child-request' });
      playSequence(function () { startPress(); });
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'sm-bit');
        var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 120;
        b.style.background = colors[i % colors.length];
        b.style.setProperty('--dx', 'calc(-50% + ' + Math.round(Math.cos(ang) * dist) + 'px)');
        b.style.setProperty('--dy', 'calc(-50% + ' + Math.round(Math.sin(ang) * dist) + 'px)');
        b.style.setProperty('--r', Math.round(Math.random() * 540) + 'deg');
        elArena.appendChild(b);
        later(function (x) { return function () { x.remove(); }; }(b), 1000);
      }
    }

    function trialDone() {
      var p = R.p, tr = p.trials[R.ti];
      R.phase = 'wait';
      elTray.classList.add('is-wait');
      sfx('ok');
      var count = { accurate: 0, 'self-corrected': 0, support: 0 };
      R.taps.forEach(function (a) { count[a]++; });
      var allClean = count.accurate === p.len;
      var summary = {
        itemId: p.id + '-' + (R.ti + 1), mode: p.back ? 'backward' : 'forward', length: p.len,
        accuracy: allClean ? 'accurate' : (count.support || R.replay ? 'support' : 'self-corrected'),
        accurate: count.accurate, selfCorrected: count['self-corrected'], support: count.support,
        wrongTaps: R.trialErr, replayUsed: R.replay, pressMs: Math.round(now() - R.tPress)
      };
      R.results.push(summary);
      log('game-item-complete', summary);
      sayTemp(pick(T.good), 'good', 'is-good');
      R.ti++;
      paintProg();
      later(function () {
        if (R.ti >= p.trials.length) roundDone(); else startTrial();
      }, reduced ? 400 : 1100);
    }

    function roundDone() {
      var p = R.p;
      R.phase = 'done';
      elTray.hidden = true;
      elProg.hidden = true;
      sfx('done');
      burst();
      var rs = {
        itemId: p.id, mode: p.back ? 'backward' : 'forward', length: p.len, trials: p.trials.length,
        cleanTrials: R.results.filter(function (r) { return r.accuracy === 'accurate'; }).length,
        wrongTaps: R.results.reduce(function (s, r) { return s + r.wrongTaps; }, 0),
        replays: R.results.filter(function (r) { return r.replayUsed; }).length
      };
      results.push(rs);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(rs); } catch (e) {} }
      say(fmt(T.allDone, { n: p.trials.length }), 'good', 'is-good');
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
      elEnd.querySelector('.sm-end-line').textContent = fmt(T.endLine, { n: plans.length });
      var st = elEnd.querySelector('.sm-stamps');
      st.innerHTML = '';
      plans.forEach(function (p) { st.appendChild(roundDot(p, 'is-done')); });
      var acts = elEnd.querySelector('.sm-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      log('game-activity-complete', {
        rounds: plans.length,
        trials: results.reduce(function (s, r) { return s + r.trials; }, 0),
        cleanTrials: results.reduce(function (s, r) { return s + r.cleanTrials; }, 0),
        wrongTaps: results.reduce(function (s, r) { return s + r.wrongTaps; }, 0),
        replays: results.reduce(function (s, r) { return s + r.replays; }, 0),
        longestForward: results.filter(function (r) { return r.mode === 'forward' && r.cleanTrials; }).reduce(function (m, r) { return Math.max(m, r.length); }, 0),
        longestBackward: results.filter(function (r) { return r.mode === 'backward' && r.cleanTrials; }).reduce(function (m, r) { return Math.max(m, r.length); }, 0)
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
      if (name === 'start' && R.phase === 'ready') { startTrial(); }
      else if (name === 'replay') doReplay();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-sm-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-sm-act')); return; }
      var card = e.target.closest('.sm-tray .sm-card');
      if (card && root.contains(card)) { tap(card); return; }
      if (R && R.phase === 'watch' && e.target.closest('.sm-tray, .sm-arena')) sayTemp(T.watch, 'watch');
    }
    function onKey(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target;
      if (t.classList && t.classList.contains('sm-card') && root.contains(t)) { e.preventDefault(); t.click(); }
    }

    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);

    restart();

    return {
      root: root,
      restart: restart,
      results: function () { return results.slice(); },
      destroy: function () { clearTimers(); clearTimeout(tempTimer); root.remove(); }
    };
  }

  global.SequenceMemory = { version: VERSION, mount: mount };
})(window);
