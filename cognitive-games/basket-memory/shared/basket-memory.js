/*!
 * 「끼리끼리 바구니」 묶어서 기억하기 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 2장 기억력 「같은 특성끼리 묶어서 기억하기 1·2」(79~81쪽)
 *            (그림·낱말을 같은 특성끼리 묶어 외우고, 범주별로 나누어 떠올린다) — 활동 방식만 가져왔다.
 *
 * 한 판의 흐름
 *   ① 담기   : 그림이 하나씩 나오면 맞는 바구니를 누른다(누르는 순간 판정, 그림이 바구니로 들어감)
 *   ② 외우기 : 바구니별로 모인 그림을 다시 본다(모래시계, 「다 기억했어요」로 먼저 끝낼 수 있음)
 *   ③ 떠올리기: 바구니가 닫히고, 금색 테 바구니에 있던 그림을 받침에서 모두 고른다
 *              받침에는 같은 종류의 「안 나온 그림」이 섞여 있다(누르는 순간 판정)
 *   어긋나면 1번째 : 흔들리고 「다시 생각해 봐요」 · 2번째 : 맞는 것이 금색으로 반짝(도움 A4)
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 바구니(담기)·받침 그림(떠올리기)  data-track="answer" + data-item-id + data-correct + data-response + (맞는 것) data-accuracy
 *   - 끝 화면  data-track="activity-complete"
 *   - 자세한 신호  oncuvate:log  game-item-ready / game-response(phase: sort|recall) / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '끼리끼리 바구니',
    ready: '그림을 같은 것끼리 바구니에 담고, 바구니별로 기억해요.',
    start: '시작',
    sort: '이 그림은 어느 바구니에 넣을까요?',
    look: '바구니별로 무엇이 있는지 기억해요.',
    lookDone: '다 기억했어요',
    recall: '{name} 바구니에 있던 그림을 모두 골라요.',
    oops: '다시 생각해 봐요.',
    cue: '반짝이는 것을 보세요.',
    good: ['좋아요!', '딱 맞아요!', '척척이에요!'],
    basketDone: '{name} 바구니 끝!',
    allDone: '바구니를 모두 채웠어요!',
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoBig: '바구니 {b}개 · 그림 {n}장',
    infoSmall: '담고 → 기억하고 → 떠올려요',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = { ready: 'jelly-default', sort: 'jelly-default', look: 'jelly-look', recall: 'jelly-default', oops: 'jelly-thinking', help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer' };

  var DEFAULTS = {
    activityId: 'basket-memory',
    storageKey: null,
    categories: [],            // [ {key, name, icon} ]
    items: [],                 // [ {key, label, img|emoji, cat} ]
    rounds: [],                // [ {id, cats:[key…], per, extra, lookSec} ]
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
    '.bm-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--coral:#ff8a80;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:bm / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.bm-root *,.bm-root *::before,.bm-root *::after{box-sizing:border-box}',
    '.bm-root [hidden]{display:none!important}',
    '.bm-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    /* 무대 */
    '.bm-arena{container:bmarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'display:flex;flex-direction:column;gap:3cqh;padding:4cqmin;',
    'border-radius:18px;background:radial-gradient(circle at 50% 30%,#5b48d6 0%,#3b2a9e 50%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.bm-rays{position:absolute;left:50%;top:30%;width:1400px;height:1400px;margin:-700px 0 0 -700px;pointer-events:none;',
    'background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.05) 0 8deg,transparent 8deg 20deg);animation:bm-spin 90s linear infinite}',
    '.bm-stage{position:relative;z-index:2;flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center}',
    '.bm-big{width:min(38cqw,38cqh);height:min(38cqw,38cqh)}',
    '.bm-ask{display:flex;align-items:center;gap:3cqw;padding:2.4cqh 5cqw;border-radius:20px;background:#fff;box-shadow:0 5px 0 var(--v3),0 12px 22px rgba(10,4,50,.25);animation:bm-pop .3s cubic-bezier(.3,1.5,.5,1)}',
    '.bm-ask i{font-style:normal;font-size:clamp(28px,10cqmin,52px);line-height:1}',
    '.bm-ask b{font-size:clamp(22px,8cqmin,40px);font-weight:900;letter-spacing:-.03em;color:#2b2140}',
    '.bm-ask span{padding:2px 12px;border-radius:99px;background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);font-size:clamp(16px,5cqmin,26px);font-weight:900;color:#9a6c00;font-variant-numeric:tabular-nums}',
    '.bm-baskets{position:relative;z-index:2;flex:none;height:48cqh;display:grid;grid-template-columns:repeat(var(--b,3),minmax(0,1fr));gap:2.4cqw}',
    '.bm-basket{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;gap:1cqh;padding:1.6cqh 1.4cqw 1.6cqh;border:0;border-radius:16px;',
    'font:inherit;color:#2b2140;cursor:pointer;background:linear-gradient(180deg,#fff7e0,#ffe8b3);box-shadow:inset 0 -6px 0 #f0c76a,0 4px 0 #b98a2c,0 10px 16px rgba(10,4,50,.25);',
    'transition:transform .12s,box-shadow .15s;touch-action:manipulation}',
    '.bm-basket:active{transform:translateY(2px)}',
    '.bm-basket:focus-visible{outline:3px solid #4bc9dc;outline-offset:2px}',
    '.bm-bhead{display:flex;align-items:center;gap:4px;font-size:clamp(13px,4.6cqh,20px);font-weight:900;white-space:nowrap}',
    '.bm-bhead i{font-style:normal;font-size:1.2em}',
    '.bm-count{position:absolute;z-index:2;left:50%;bottom:7%;transform:translateX(-50%);min-width:34px;height:24px;padding:0 8px;border-radius:99px;display:grid;place-items:center;',
    'background:#fff;color:#9a6c00;font-size:13px;font-weight:900;box-shadow:inset 0 0 0 2px var(--gold)}',
    '.bm-inside{flex:1;min-height:0;width:100%;display:flex;flex-wrap:wrap;align-content:flex-start;justify-content:center;gap:4px;overflow:hidden}',
    '.bm-thumb{container-type:size;width:min(10cqw,11cqh);height:min(10cqw,11cqh);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:9px;background:#fff;box-shadow:0 2px 0 #e7d3a6}',
    '.bm-thumb img{width:84cqmin;height:84cqmin;object-fit:contain}',
    '.bm-thumb .bm-emo{font-size:62cqmin;line-height:1}',
    '.bm-thumb.is-in{animation:bm-pop .3s cubic-bezier(.3,1.5,.5,1)}',
    '.bm-inside{position:relative;z-index:1}',
    '.bm-basket.is-closed::after{content:"";position:absolute;z-index:0;left:8%;right:8%;top:38%;bottom:12%;border-radius:12px;',
    'background:repeating-linear-gradient(45deg,#e9c46a 0 8px,#dfb550 8px 16px);box-shadow:inset 0 0 0 2px #c99a33}',
    '.bm-basket.is-now{box-shadow:inset 0 0 0 3px var(--gold),inset 0 -6px 0 #f0c76a,0 4px 0 var(--gold-d),0 0 22px rgba(255,210,63,.75);transform:translateY(-3px)}',
    '.bm-basket.is-full{background:linear-gradient(180deg,#eafff5,#c9f3df);box-shadow:inset 0 -6px 0 #8fdcb8,0 4px 0 #3e9b73,0 10px 16px rgba(10,4,50,.2)}',
    '.bm-basket.is-no{animation:bm-wob .45s ease-in-out}',
    '.bm-basket.is-cue{animation:bm-cue 1s ease-in-out infinite}',
    '.bm-baskets.is-off .bm-basket{cursor:default}',
    '.bm-arena.is-look .bm-stage{display:none}',
    '.bm-arena.is-look .bm-baskets{height:100%}',
    '.bm-arena.is-look .bm-inside{align-content:center;gap:8px}',
    '.bm-arena.is-look .bm-thumb{width:min(15cqw,19cqh);height:min(15cqw,19cqh);flex-direction:column;border-radius:12px}',
    '.bm-thumb b{display:none}',
    '.bm-arena.is-look .bm-thumb b{display:block;font-size:clamp(9px,16cqmin,14px);font-weight:850;line-height:1.1}',
    '.bm-arena.is-look .bm-thumb img{width:68cqmin;height:68cqmin}',

    /* 카드 */
    '.bm-card{container-type:size;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px 6px;border-radius:14px;',
    'background:linear-gradient(180deg,#fff 0%,#fffaf0 100%);box-shadow:inset 0 0 0 2px #fff,inset 0 -5px 0 #efe6d2,0 4px 0 var(--v3),0 8px 14px rgba(10,4,50,.2)}',
    '.bm-card::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;border-radius:14px 14px 0 0;background:linear-gradient(90deg,var(--gold),var(--orange))}',
    '.bm-card img{width:64cqmin;height:64cqmin;object-fit:contain;pointer-events:none}',
    '.bm-card .bm-emo{font-size:52cqmin;line-height:1}',
    '.bm-card b{font-size:clamp(10px,15cqmin,22px);font-weight:850;line-height:1.15}',
    '.bm-card.is-in{animation:bm-pop .3s cubic-bezier(.3,1.5,.5,1)}',
    '.bm-card.bm-wob{animation:bm-wob .45s ease-in-out}',

    /* 오른쪽 칸 */
    '.bm-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.bm-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.bm-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.bm-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.bm-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 6px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.bm-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.bm-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.bm-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.bm-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.bm-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.bm-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.bm-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.bm-coach.is-temp .bm-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.bm-coach.is-good .bm-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.bm-sand{height:14px;border-radius:99px;background:var(--v1);overflow:hidden}',
    '.bm-sand-fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--gold),var(--orange));transform-origin:left center}',
    '.bm-prog{display:flex;flex-wrap:wrap;gap:5px}',
    '.bm-prog i{width:11px;height:11px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px var(--v3)}',
    '.bm-prog i.on{background:var(--mint);box-shadow:none}',
    '.bm-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.bm-info-icon{font-size:clamp(30px,10cqh,48px);line-height:1}',
    '.bm-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.bm-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.bm-tray{--tc:clamp(56px,min(19cqh,10.5cqw),92px);flex:1 1 auto;min-height:0;overflow:auto;display:flex;flex-wrap:wrap;align-content:flex-start;justify-content:center;',
    'gap:10px;padding:10px;border-radius:16px;background:#f3effd;box-shadow:inset 0 0 0 2px #e6dffa}',
    '.bm-tray .bm-card{flex:none;width:var(--tc);height:var(--tc);cursor:pointer;touch-action:manipulation;transition:transform .12s}',
    '.bm-tray .bm-card:hover{transform:translateY(-3px) rotate(-1.5deg)}',
    '.bm-tray .bm-card.is-used{opacity:.25;pointer-events:none}',
    '.bm-tray .bm-card.is-no{background:#ffe1dd}',
    '.bm-tray .bm-card.is-cue{animation:bm-cue 1s ease-in-out infinite}',
    '.bm-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.bm-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.bm-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 18px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.bm-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.bm-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.bm-btn:focus-visible,.bm-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    /* 끝 화면 */
    '.bm-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.bm-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.bm-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.bm-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.bm-end .bm-btns{margin:0;justify-content:center}',
    '.bm-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.bm-stamps .bm-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.bm-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.bm-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '.bm-bit{position:absolute;left:50%;top:40%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:bm-bit .9s ease-out forwards}',
    '@keyframes bm-spin{to{transform:rotate(360deg)}}',
    '@keyframes bm-pop{from{transform:scale(.6)}}',
    '@keyframes bm-wob{20%{transform:rotate(-4deg) translateX(-5px)}45%{transform:rotate(3deg) translateX(5px)}70%{transform:rotate(-1deg)}}',
    '@keyframes bm-cue{0%,100%{box-shadow:inset 0 0 0 3px var(--gold),0 4px 0 var(--gold-d)}50%{box-shadow:inset 0 0 0 4px var(--gold),0 4px 0 var(--gold-d),0 0 0 6px rgba(255,210,63,.55)}}',
    '@keyframes bm-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    '@container bm (max-aspect-ratio:5/4){',
    '.bm-wrap{--arena:min(calc(100cqw - 24px),52cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.bm-side{width:100%}.bm-tray{--tc:clamp(56px,18cqw,84px)}}',

    '@media (prefers-reduced-motion:reduce){.bm-root *:not(.bm-sand-fill){animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('bm-style')) return;
    var s = document.createElement('style');
    s.id = 'bm-style';
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
    drop: function () { tones([523, 659], 0.06, 'triangle', 0.12); },
    tick: function () { tones([784], 0.05, 'sine', 0.1); },
    again: function () { tones([440, 392], 0.1, 'triangle', 0.1); },
    close: function () { tones([392, 330], 0.08, 'sine', 0.08); },
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
    var CATS = {}, ITEMS = {};
    o.categories.forEach(function (c) { CATS[c.key] = c; });
    o.items.forEach(function (it) { ITEMS[it.key] = it; });
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
    o.items.forEach(function (it) { if (it.img) { var im = new Image(); im.src = it.img; } });

    var root = h('div', 'bm-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'primary');
    root.innerHTML =
      '<div class="bm-wrap">' +
        '<div class="bm-arena"><div class="bm-rays"></div><div class="bm-stage"></div><div class="bm-baskets"></div></div>' +
        '<aside class="bm-side">' +
          '<div class="bm-top">' +
            '<span class="bm-title">' + esc(T.title) + '</span>' +
            '<ol class="bm-rounds" aria-label="판"></ol>' +
            '<button type="button" class="bm-sound" data-bm-act="sound"></button>' +
          '</div>' +
          '<div class="bm-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="bm-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="bm-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="bm-sand" hidden><span class="bm-sand-fill"></span></div>' +
          '<div class="bm-prog" hidden></div>' +
          '<div class="bm-info" hidden></div>' +
          '<div class="bm-tray" hidden></div>' +
          '<div class="bm-actions"><div class="bm-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="bm-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="bm-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="bm-end-line"></p><div class="bm-stamps"></div><div class="bm-btns"></div>' +
        (o.credit ? '<p class="bm-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'bm-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.bm-rounds'), elSound = $('.bm-sound'), elArena = $('.bm-arena'), elStage = $('.bm-stage'), elBaskets = $('.bm-baskets'),
        elCoach = $('.bm-coach'), elCoachImg = $('.bm-coach-img'), elBubble = $('.bm-bubble'),
        elSand = $('.bm-sand'), elFill = $('.bm-sand-fill'), elProg = $('.bm-prog'), elInfo = $('.bm-info'), elTray = $('.bm-tray'),
        elActs = $('.bm-side .bm-btns'), elEnd = $('.bm-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var plans = [], R = null, ri = 0, results = [], timers = [], tempTimer = null;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    /* 판 계획: 범주마다 per개를 고르고, 떠올리기 받침에 같은 범주의 안 나온 것 extra개 */
    function plan(spec, idx) {
      var cats = (spec.cats || []).filter(function (c) { return CATS[c]; });
      var per = spec.per || 2, extra = spec.extra == null ? 2 : spec.extra, chosen = [], extras = {};
      cats.forEach(function (c) {
        var pool = shuffle(o.items.filter(function (it) { return it.cat === c; }).map(function (it) { return it.key; }));
        chosen = chosen.concat(pool.slice(0, per));
        extras[c] = pool.slice(per, per + extra);
      });
      return { id: spec.id || ('r' + (idx + 1)), cats: cats, per: per, sortOrder: shuffle(chosen), extras: extras,
               lookSec: spec.lookSec || (chosen.length * 3 + 6) };
    }

    function pic(it) {
      if (it.img) return '<img src="' + esc(it.img) + '" alt="" draggable="false">';
      if (it.emoji) return '<span class="bm-emo" aria-hidden="true">' + esc(it.emoji) + '</span>';
      return '';
    }
    function makeCard(key) {
      var it = ITEMS[key];
      var c = h('div', 'bm-card', pic(it) + '<b>' + esc(it.label) + '</b>');
      c.setAttribute('data-key', key);
      return c;
    }

    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'bm-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood, cls) {
      say(text, mood, cls || 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1500);
    }
    function wob(el, cls) {
      var c = cls || 'is-no';
      el.classList.remove(c);
      void el.offsetWidth;
      el.classList.add(c);
      later(function () { el.classList.remove(c); }, 460);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'bm-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-bm-act', act);
      for (var a in attrs || {}) b.setAttribute(a, attrs[a]);
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
        var li = h('li', 'bm-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), '🧺' + p.cats.length);
        li.setAttribute('aria-label', (i + 1) + '판 바구니 ' + p.cats.length + '개' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function showInfo(kind) {
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var p = R.p, left = plans.length - ri - 1;
      if (kind === 'done') {
        elInfo.appendChild(h('span', 'bm-info-icon', '🎉'));
        elInfo.appendChild(h('b', 'bm-info-big', esc(fmt(T.infoDone, { n: ri + 1 }))));
        elInfo.appendChild(h('span', 'bm-info-small', esc(left ? fmt(T.infoLeft, { n: left }) : T.infoLast)));
      } else {
        elInfo.appendChild(h('span', 'bm-info-icon', '🧺'));
        elInfo.appendChild(h('b', 'bm-info-big', esc(fmt(T.infoBig, { b: p.cats.length, n: p.sortOrder.length }))));
        elInfo.appendChild(h('span', 'bm-info-small', esc(T.infoSmall)));
      }
      elInfo.hidden = false;
    }
    function paintProg(total, done) {
      elProg.innerHTML = '';
      for (var i = 0; i < total; i++) elProg.appendChild(h('i', i < done ? 'on' : ''));
    }

    function buildBaskets() {
      var p = R.p;
      elBaskets.style.setProperty('--b', p.cats.length);
      elBaskets.innerHTML = '';
      R.baskets = {};
      p.cats.forEach(function (c) {
        var cat = CATS[c];
        var b = h('button', 'bm-basket', '<span class="bm-bhead"><i>' + esc(cat.icon || '🧺') + '</i>' + esc(cat.name) + '</span><span class="bm-inside"></span>');
        b.type = 'button';
        b.setAttribute('data-cat', c);
        b.setAttribute('aria-label', cat.name + ' 바구니');
        elBaskets.appendChild(b);
        R.baskets[c] = b;
      });
    }
    function addThumb(c, key) {
      var t = h('span', 'bm-thumb is-in', pic(ITEMS[key]) + '<b>' + esc(ITEMS[key].label) + '</b>');
      t.setAttribute('title', ITEMS[key].label);
      R.baskets[c].querySelector('.bm-inside').appendChild(t);
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var p = plans[i];
      R = { p: p, phase: 'ready', si: 0, errs: 0, acc: [], sortAcc: [], wrong: 0, sayText: '', sayMood: 'ready', recallIdx: 0, got: {} };
      paintRounds(i);
      elArena.classList.remove('is-look');
      buildBaskets();
      elBaskets.classList.add('is-off');
      elStage.innerHTML = '';
      elTray.hidden = true; elSand.hidden = true; elProg.hidden = true;
      showInfo('ready');
      say(T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    /* ① 담기 */
    function startSort() {
      var p = R.p;
      R.phase = 'sort';
      showInfo(null);
      elBaskets.classList.remove('is-off');
      elProg.hidden = false;
      setActions([]);
      log('game-item-ready', {
        itemId: p.id, phase: 'sort', cats: p.cats.map(function (c) { return CATS[c].name; }).join('|'),
        items: p.sortOrder.map(function (key) { return ITEMS[key].label + ':' + CATS[ITEMS[key].cat].name; }).join('|'),
        engine: 'basket-memory@' + VERSION
      });
      R.tStart = now();
      nextSort();
    }
    function sortInfo() {
      var p = R.p;
      elInfo.innerHTML = '';
      elInfo.appendChild(h('span', 'bm-info-icon', '🧺'));
      elInfo.appendChild(h('b', 'bm-info-big', esc(R.si + ' / ' + p.sortOrder.length)));
      elInfo.appendChild(h('span', 'bm-info-small', esc(p.cats.map(function (c) { return (CATS[c].icon || '') + ' ' + CATS[c].name; }).join(' · '))));
      elInfo.hidden = false;
    }
    function nextSort() {
      var p = R.p, key = p.sortOrder[R.si];
      sortInfo();
      R.errs = 0;
      R.tItem = now();
      elStage.innerHTML = '';
      var c = makeCard(key);
      c.classList.add('bm-big', 'is-in');
      elStage.appendChild(c);
      paintProg(p.sortOrder.length, R.si);
      Object.keys(R.baskets).forEach(function (cat) { R.baskets[cat].classList.remove('is-cue'); });
      say(T.sort, 'sort');
      armSort();
    }
    function sortAcc() { return R.errs >= 2 ? 'support' : (R.errs === 1 ? 'self-corrected' : 'accurate'); }
    function armSort() {
      var p = R.p, key = p.sortOrder[R.si];
      Object.keys(R.baskets).forEach(function (cat) {
        var b = R.baskets[cat];
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', p.id + '-s' + (R.si + 1));
        b.setAttribute('data-response', CATS[cat].name);
        b.setAttribute('data-correct', cat === ITEMS[key].cat ? 'true' : 'false');
        if (cat === ITEMS[key].cat) b.setAttribute('data-accuracy', sortAcc()); else b.removeAttribute('data-accuracy');
      });
    }
    function disarmBaskets() {
      Object.keys(R.baskets).forEach(function (cat) {
        ['data-track', 'data-item-id', 'data-correct', 'data-response', 'data-accuracy'].forEach(function (a) { R.baskets[cat].removeAttribute(a); });
      });
    }
    function tapBasket(cat) {
      if (!R || R.phase !== 'sort') return;
      var p = R.p, key = p.sortOrder[R.si], it = ITEMS[key], ok = cat === it.cat, t = now();
      var acc = ok ? sortAcc() : '';
      log('game-response', {
        itemId: p.id + '-s' + (R.si + 1), phase: 'sort', item: it.label, correct: ok, response: CATS[cat].name, expected: CATS[it.cat].name,
        attempt: R.errs + 1, errorType: ok ? '' : 'category', accuracy: acc, responseMs: Math.round(t - R.tItem)
      });
      if (ok) {
        R.sortAcc.push(acc);
        sfx('drop');
        addThumb(cat, key);
        R.si++;
        if (R.si >= p.sortOrder.length) {
          R.phase = 'wait';
          paintProg(p.sortOrder.length, R.si);
          elStage.innerHTML = '';
          later(startLook, reduced ? 200 : 500);
          return;
        }
        R.phase = 'wait';
        later(function () { R.phase = 'sort'; nextSort(); }, reduced ? 100 : 260);
        return;
      }
      R.errs++;
      R.wrong++;
      sfx('again');
      wob(R.baskets[cat]);
      var big = elStage.querySelector('.bm-card');
      if (big) wob(big, 'bm-wob');
      if (R.errs === 1) sayTemp(T.oops, 'oops');
      else {
        R.baskets[it.cat].classList.add('is-cue');
        say(T.cue, 'help');
        log('game-help', { itemId: p.id + '-s' + (R.si + 1), helpLevel: 'A4', helpType: 'answer-cue', trigger: 'second-miss' });
      }
      armSort();
    }

    /* ② 외우기 */
    function startLook() {
      var p = R.p;
      R.phase = 'look';
      elInfo.innerHTML = '';
      elInfo.appendChild(h('span', 'bm-info-icon', '👀'));
      elInfo.appendChild(h('b', 'bm-info-big', esc(p.cats.map(function (c) { return CATS[c].name; }).join(' · '))));
      elInfo.appendChild(h('span', 'bm-info-small', esc('그림 ' + p.sortOrder.length + '장')));
      elInfo.hidden = false;
      elArena.classList.add('is-look');
      disarmBaskets();
      elBaskets.classList.add('is-off');
      elProg.hidden = true;
      R.tLook = now();
      elStage.innerHTML = '';
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
      R.lookMs = Math.round(now() - R.tLook);
      R.lookBy = by;
      elSand.hidden = true;
      elInfo.hidden = true;
      elArena.classList.remove('is-look');
      setActions([]);
      sfx('close');
      Object.keys(R.baskets).forEach(function (cat) {
        var b = R.baskets[cat];
        b.classList.add('is-closed');
        b.querySelector('.bm-inside').innerHTML = '';
        b.insertAdjacentHTML('beforeend', '<span class="bm-count">0/' + R.p.per + '</span>');
      });
      R.recallIdx = 0;
      later(startRecall, reduced ? 100 : 400);
    }

    /* ③ 떠올리기: 바구니 하나씩 */
    function startRecall() {
      var p = R.p, cat = p.cats[R.recallIdx];
      R.phase = 'recall';
      R.found = 0;
      Object.keys(R.baskets).forEach(function (c) { R.baskets[c].classList.toggle('is-now', c === cat); });
      var studied = p.sortOrder.filter(function (key) { return ITEMS[key].cat === cat; });
      R.studied = studied;
      elTray.innerHTML = '';
      shuffle(studied.concat(p.extras[cat])).forEach(function (key) {
        var c = makeCard(key);
        c.setAttribute('role', 'button');
        c.setAttribute('aria-label', ITEMS[key].label);
        c.tabIndex = 0;
        elTray.appendChild(c);
      });
      elTray.hidden = false;
      elStage.innerHTML = '<div class="bm-ask"><i>' + esc(CATS[cat].icon || '🧺') + '</i><b>' + esc(CATS[cat].name) + '</b><span class="bm-ask-n">0 / ' + studied.length + '</span></div>';
      say(fmt(T.recall, { name: CATS[cat].name }), 'recall');
      if (R.recallIdx === 0) log('game-item-ready', { itemId: p.id, phase: 'recall', lookMs: R.lookMs, lookEndedBy: R.lookBy });
      R.errs = 0;
      R.tItem = now();
      armRecall();
    }
    function recallAcc() { return R.errs >= 2 ? 'support' : (R.errs === 1 ? 'self-corrected' : 'accurate'); }
    function armRecall() {
      var p = R.p, cat = p.cats[R.recallIdx];
      Array.prototype.forEach.call(elTray.children, function (c) {
        var key = c.getAttribute('data-key');
        if (c.classList.contains('is-used')) {
          ['data-track', 'data-item-id', 'data-correct', 'data-response', 'data-accuracy'].forEach(function (a) { c.removeAttribute(a); });
          return;
        }
        var ok = R.studied.indexOf(key) >= 0;
        c.setAttribute('data-track', 'answer');
        c.setAttribute('data-item-id', p.id + '-' + cat + '-' + (R.found + 1));
        c.setAttribute('data-response', ITEMS[key].label);
        c.setAttribute('data-correct', ok ? 'true' : 'false');
        if (ok) c.setAttribute('data-accuracy', recallAcc()); else c.removeAttribute('data-accuracy');
      });
    }
    function tapRecall(card) {
      if (!R || R.phase !== 'recall' || card.classList.contains('is-used')) return;
      var p = R.p, cat = p.cats[R.recallIdx], key = card.getAttribute('data-key'), ok = R.studied.indexOf(key) >= 0, t = now();
      var acc = ok ? recallAcc() : '';
      log('game-response', {
        itemId: p.id + '-' + cat + '-' + (R.found + 1), phase: 'recall', basket: CATS[cat].name, correct: ok, response: ITEMS[key].label,
        attempt: R.errs + 1, errorType: ok ? '' : 'lure', accuracy: acc, responseMs: Math.round(t - R.tItem)
      });
      if (ok) {
        R.acc.push(acc);
        sfx('tick');
        card.classList.add('is-used');
        card.classList.remove('is-cue');
        addThumb(cat, key);
        R.found++;
        R.errs = 0;
        R.tItem = now();
        R.baskets[cat].querySelector('.bm-count').textContent = R.found + '/' + p.per;
        var askN = elStage.querySelector('.bm-ask-n');
        if (askN) askN.textContent = R.found + ' / ' + R.studied.length;
        Array.prototype.forEach.call(elTray.children, function (c) { c.classList.remove('is-cue'); });
        if (R.found >= R.studied.length) {
          var b = R.baskets[cat];
          b.classList.remove('is-closed', 'is-now');
          b.classList.add('is-full');
          R.recallIdx++;
          R.phase = 'wait';
          if (R.recallIdx >= p.cats.length) { later(roundDone, reduced ? 200 : 500); return; }
          sayTemp(fmt(T.basketDone, { name: CATS[cat].name }), 'good', 'is-good');
          later(startRecall, reduced ? 200 : 700);
          return;
        }
        armRecall();
        return;
      }
      R.errs++;
      R.wrong++;
      sfx('again');
      wob(card);
      if (R.errs === 1) sayTemp(T.oops, 'oops');
      else {
        Array.prototype.forEach.call(elTray.children, function (c) {
          if (!c.classList.contains('is-used') && R.studied.indexOf(c.getAttribute('data-key')) >= 0) c.classList.add('is-cue');
        });
        say(T.cue, 'help');
        log('game-help', { itemId: p.id + '-' + cat + '-' + (R.found + 1), helpLevel: 'A4', helpType: 'answer-cue', trigger: 'second-miss' });
      }
      armRecall();
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'bm-bit');
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
      elTray.hidden = true;
      elStage.innerHTML = '';
      sfx('done');
      burst();
      function tally(list) {
        var c = { accurate: 0, 'self-corrected': 0, support: 0 };
        list.forEach(function (a) { c[a]++; });
        return c;
      }
      var s = tally(R.sortAcc), r = tally(R.acc);
      var summary = {
        itemId: p.id, baskets: p.cats.length, items: p.sortOrder.length,
        sortAccurate: s.accurate, sortSelfCorrected: s['self-corrected'], sortSupport: s.support,
        recallAccurate: r.accurate, recallSelfCorrected: r['self-corrected'], recallSupport: r.support,
        wrongTaps: R.wrong, lookMs: R.lookMs, lookEndedBy: R.lookBy, totalMs: Math.round(now() - R.tStart)
      };
      results.push(summary);
      log('game-item-complete', summary);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(summary); } catch (e) {} }
      say(T.allDone, 'good', 'is-good');
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
      elEnd.querySelector('.bm-end-line').textContent = fmt(T.endLine, { n: plans.length });
      var st = elEnd.querySelector('.bm-stamps');
      st.innerHTML = '';
      plans.forEach(function (p) { st.appendChild(h('span', 'bm-dot is-done', '🧺' + p.cats.length)); });
      var acts = elEnd.querySelector('.bm-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      log('game-activity-complete', {
        rounds: plans.length,
        items: results.reduce(function (s, r) { return s + r.items; }, 0),
        recallAccurate: results.reduce(function (s, r) { return s + r.recallAccurate; }, 0),
        recallSupport: results.reduce(function (s, r) { return s + r.recallSupport; }, 0),
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
      if (name === 'start' && R.phase === 'ready') startSort();
      else if (name === 'lookDone') endLook('child');
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-bm-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-bm-act')); return; }
      var bk = e.target.closest('.bm-basket');
      if (bk && root.contains(bk)) {
        if (R.phase === 'sort') tapBasket(bk.getAttribute('data-cat'));
        else if (R.phase === 'recall') { sayTemp(R.sayText, R.sayMood); wob(elTray, 'bm-wob'); }
        return;
      }
      var c = e.target.closest('.bm-tray .bm-card');
      if (c && root.contains(c)) tapRecall(c);
    }
    function onKey(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target;
      if (t.classList && t.classList.contains('bm-card') && root.contains(t)) { e.preventDefault(); t.click(); }
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

  global.BasketMemory = { version: VERSION, mount: mount };
})(window);
