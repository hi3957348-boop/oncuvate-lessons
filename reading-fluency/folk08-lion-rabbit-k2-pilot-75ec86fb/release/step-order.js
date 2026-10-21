/*!
 * 「차례대로 놓기」 순서 찾기 게임 엔진  v2.0.1 (단계 사다리판)
 *
 * 한 문제: 상황 하나(예: 이를 닦아요)의 단계 카드 4~5장이 섞여 아래 받침에 놓인다.
 *   먼저 할 일부터 차례대로 누르면 위 번호 칸(1 → 2 → 3 …)에 하나씩 들어간다. 누르는 순간 판정.
 *   어긋나면 1번째 = 카드가 흔들리고 받침에 남음 / 같은 칸에서 2번째 = 맞는 카드가 금색으로 반짝(A4).
 *   「끝 보기」(아이가 고름, 도움 A2): 마지막 단계 카드를 마지막 칸에 먼저 놓아 준다(끝을 알면 순서를 세우기 쉽다).
 *   다 놓으면 번호 칸이 차례로 한 번씩 울리고 다음 문제로.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *   거꾸로 칸(mode 'backward'): 마지막 칸부터 거꾸로 채운다(「무엇이 가장 마지막일까요?」). 도움은 「처음 보기」(첫 단계를 첫 칸에).
 *   그림 없는 문제(단계에 icon·img가 없음)는 카드에 글만 크게 보인다.
 *   v2.0.1: 단계 카드 그림으로 그림 파일(img — 낱말 그림 은행에서 복사한 것)도 쓴다(이모지 icon은 v1 문제 자료).
 *
 * 단계 사다리(판 3개 대신)
 *   - 칸 목록(ladder.steps): 칸마다 문제 목록(items, 3개 이상)과 방향(mode). 칸에서 문제를 하나씩 고르되
 *     같은 「오늘의 도전」 안에서는 다시 내지 않는다(칸의 문제가 다 떨어지면 섞어 다시).
 *   - 「맞음」= 한 번도 어긋나지 않고 도움 없이 다 놓음(ladder.countSelfCorrected: true면 스스로 고친 것도 맞음).
 *   - 오르내리기·지도·이어 하기는 공용 부품 shared/ladder.js(OncuLadder) — 이 파일보다 먼저 불러야 한다.
 *   - 「오늘의 도전」: challenge.trials번 또는 challenge.minutes분, breakEvery번마다 쉬는 화면. 아이 화면에는 칸 번호만.
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 단계 카드   data-track="answer" + data-item-id(t번-칸번호) + data-level + data-correct + data-response + (맞는 카드) data-accuracy
 *   - 끝 보기     data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete (모두 level 실음)
 *                 game-level-change / game-break / game-activity-complete(startLevel·maxLevel·endLevel)
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다. 화면 아이콘은 SVG(카드 그림 이모지는 v1 문제 자료).
 */
(function (global) {
  'use strict';

  var VERSION = '2.0.1';

  var TEXT = {
    title: '차례대로 놓기',
    readyFirst: '카드를 일이 일어나는 차례대로 놓아요. 1칸부터 올라가 봐요!',
    readyResume: '지난번에 {last}칸까지 왔어요. {start}칸에서 몸풀기로 시작해요.',
    readyCoach: '{start}칸에서 시작해요.',
    today: '오늘의 도전 · {n}번 해 봐요',
    start: '시작',
    first: '무엇을 가장 먼저 할까요?',
    middle: '그다음에는 무엇을 할까요?',
    last: '마지막에는 무엇을 할까요?',
    miss: '그건 조금 뒤에 해요. 바로 다음 일을 찾아봐요.',
    firstB: '거꾸로! 무엇이 가장 마지막일까요?',
    middleB: '그 바로 앞은 무엇일까요?',
    lastB: '가장 처음은 무엇일까요?',
    missB: '그건 조금 앞이에요. 바로 앞 것을 찾아봐요.',
    hintB: '처음 보기',
    hintedB: '처음 것을 먼저 놓았어요. 끝부터 거꾸로 이어 봐요.',
    cue: '반짝이는 카드를 살펴봐요.',
    hint: '끝 보기',
    hinted: '마지막 일을 먼저 놓았어요. 처음부터 차례대로 이어 봐요.',
    good: ['차례대로 잘 놓았어요!', '좋아요! 순서가 딱 맞아요.', '그렇지요! 차례차례 맞아요.'],
    up: '한 칸 올라가요!',
    top: '꼭대기예요! 정말 잘했어요.',
    down: '한 칸 쉬운 데서 다시 연습해요.',
    restTitle: '잠깐 쉬어요',
    restLine: '지금 {level}칸에 있어요.',
    restCoach: '숨 한 번 크게 쉬고 계속해요.',
    keepOn: '계속하기',
    endTitle: '오늘의 도전 끝!',
    endFirst: '오늘 {max}칸까지 올라왔어요.',
    endAgain: '지난번 {prev}칸 → 오늘 최고 {max}칸',
    endSteady: '오늘 {max}칸까지 연습했어요. 다음에 또 올라가 봐요!',
    again: '처음부터 다시',
    levelChip: '{n}칸',
    pickTitle: '시작 칸',
    pickSteps: '장',
    pickText: '글만',
    pickBack: '거꾸로',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = { ready: 'jelly-default', ask: 'jelly-look', miss: 'jelly-thinking', help: 'jelly-puzzle', good: 'jelly-praise', end: 'jelly-cheer', rest: 'jelly-cheer' };

  /* 아이콘(SVG, 색은 글자값) */
  function icon(name, color, cls) {
    var c = color || '#ffffff';
    var body = {
      play: '<path d="M5 3.2v13.6c0 .7.8 1.1 1.4.7l10-6.8c.5-.4.5-1.1 0-1.4l-10-6.8C5.8 2.1 5 2.5 5 3.2z" fill="' + c + '"/>',
      soundOn: '<path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="' + c + '"/><path d="M13 7a4 4 0 0 1 0 6M15.2 4.8a7 7 0 0 1 0 10.4" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
      soundOff: '<path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="' + c + '"/><path d="M13 7.5l5 5M18 7.5l-5 5" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
      flag: '<path d="M5 2.5v15" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/><path d="M5.8 3.5h10l-2.6 3.5 2.6 3.5h-10z" fill="' + c + '"/>',
      arrow: '<path d="M3 10h12M10.5 4.5L16 10l-5.5 5.5" fill="none" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
      back: '<path d="M17 10H5M9.5 4.5L4 10l5.5 5.5" fill="none" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
    }[name];
    return '<svg class="' + (cls || 'so-ic') + '" viewBox="0 0 20 20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  }
  var NOTES = [523, 587, 659, 784, 880, 988];

  var DEFAULTS = {
    activityId: 'step-order',
    storageKey: null,
    ladder: null,              // { steps: [ { mode:'forward'|'backward', say, items: [ { id, title, icon, steps: [ { icon, text } … ] } ] } ], tries, upNeed, downAfter, warmup, countSelfCorrected }
    challenge: null,           // { trials, minutes, breakEvery }
    nextMs: 1500,
    sound: true,
    restartButton: true,
    credit: '',
    coachBase: 'assets/images/jelly/',
    coachExt: '.webp',
    texts: null,
    debug: false,
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
    '.so-ic{width:1.05em;height:1.05em;flex:none;display:block}',
    '.so-wrap{height:100%;display:grid;grid-template-rows:auto minmax(0,47fr) minmax(0,53fr);gap:10px;padding:12px}',

    '.so-top{display:flex;align-items:center;gap:8px;min-height:34px;min-width:0}',
    '.so-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.so-scene{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 12px;border-radius:999px;background:#fff6d6;',
    'box-shadow:inset 0 0 0 2px var(--gold);font-size:clamp(14px,4cqh,17px);font-weight:900;color:#8a5a00}',
    '.so-mini{flex:1 1 auto;min-width:60px;max-width:200px;height:30px;margin-left:auto}',
    '.so-lv{flex:none;display:inline-flex;align-items:center;height:28px;padding:0 9px;border-radius:9px;background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00;font-size:13px;font-weight:900;white-space:nowrap}',
    '.so-lv.is-up{animation:so-pop .5s cubic-bezier(.3,1.5,.5,1)}',
    '.so-sound{flex:none;display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',

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
    '.so-arrow{flex:none;width:var(--aw);height:var(--aw);opacity:.8}',
    '.so-arrow svg{width:100%;height:100%;display:block}',

    /* 카드(번호 칸 안 · 받침 위 공통) */
    '.so-card{--cw:120px;position:relative;width:var(--cw);height:var(--cw);border:0;margin:0;padding:7% 6%;border-radius:14px;font:inherit;color:var(--ink);',
    'background:var(--cream);box-shadow:0 4px 0 #d9cfa8,0 8px 12px rgba(0,0,0,.14);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4%;',
    'text-align:center;transition:transform .12s,opacity .2s}',
    '.so-card .so-ico{font-size:calc(var(--cw) * .36);line-height:1}',
    '.so-card .so-ico img{display:block;width:calc(var(--cw) * .44);height:calc(var(--cw) * .44);object-fit:contain;margin:0 auto}',
    '.so-card .so-txt{font-size:max(12px,calc(var(--cw) * .118));font-weight:800;letter-spacing:-.04em;line-height:1.25}',
    '.so-card.is-text .so-ico{display:none}',
    '.so-card.is-text .so-txt{font-size:max(13px,calc(var(--cw) * .15));line-height:1.3}',
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
    '.so-prog{display:flex;align-items:center;gap:6px}',
    '.so-prog i{width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px var(--v3)}',
    '.so-prog i.on{background:var(--mint);box-shadow:none}.so-prog i.now{box-shadow:inset 0 0 0 3px var(--gold)}',
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
    '.so-info-map{width:100%;flex:1 1 auto;min-height:30px;max-height:130px}',
    '.so-info-big{font-size:clamp(18px,14cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.so-info-small{font-size:clamp(13px,9cqh,16px);font-weight:700;color:var(--muted)}',
    '.so-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 16px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.so-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.so-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.so-btn:focus-visible,.so-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.so-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px 16px 26px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.so-end-img{width:clamp(64px,19cqh,110px);height:clamp(64px,19cqh,110px);object-fit:contain}',
    '.so-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.so-end-line{margin:0;font-size:clamp(15px,4.4cqh,20px);font-weight:900;color:#b07a00}',
    '.so-end-map{width:min(520px,92cqw);height:clamp(70px,24cqh,140px)}',
    '.so-end-btns{display:flex;gap:8px;justify-content:center}',
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

    if (!global.OncuLadder) throw new Error('shared/ladder.js 를 step-order.js 보다 먼저 불러 주세요');
    var LD = o.ladder || {};
    var CH = o.challenge || {};
    var CH_TRIALS = Math.max(1, CH.trials || 15), CH_MS = (CH.minutes == null ? 10 : CH.minutes) * 60000, CH_BREAK = CH.breakEvery || 5;
    var coach = global.OncuLadder.isCoach();
    var ladder = global.OncuLadder.create({
      id: o.storageKey || o.activityId, steps: LD.steps || [],
      tries: LD.tries, upNeed: LD.upNeed, downAfter: LD.downAfter, warmup: LD.warmup
    });

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
          '<span class="so-mini"></span><span class="so-lv"></span>' +
          '<button type="button" class="so-sound" data-so-act="sound"></button>' +
        '</div>' +
        '<div class="so-strip"><div class="so-slots" role="list" aria-label="순서 칸"></div></div>' +
        '<div class="so-bottom">' +
          '<div class="so-left">' +
            '<div class="so-coach' + (o.coachBase ? '' : ' no-img') + '">' +
              (o.coachBase ? '<img class="so-coach-img" alt="" aria-hidden="true">' : '') +
              '<p class="so-bubble" aria-live="polite"></p>' +
            '</div>' +
            '<div class="so-prog" hidden></div>' +
            '<div class="so-actions"></div>' +
          '</div>' +
          '<div class="so-tray"><div class="so-tray-in" role="group" aria-label="카드"></div></div>' +
        '</div>' +
      '</div>' +
      '<section class="so-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="so-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="so-end-line"></p><div class="so-end-map"></div><div class="so-end-btns"></div>' +
        (o.credit ? '<p class="so-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'so-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elMini = $('.so-mini'), elLv = $('.so-lv'), elSound = $('.so-sound'), elScene = $('.so-scene'), elSlots = $('.so-slots'), elTray = $('.so-tray-in'),
        elCoach = $('.so-coach'), elCoachImg = $('.so-coach-img'), elBubble = $('.so-bubble'), elProg = $('.so-prog'),
        elActs = $('.so-actions'), elEnd = $('.so-end');

    function paintSound() {
      elSound.innerHTML = icon(soundOn ? 'soundOn' : 'soundOff', '#5b48d6');
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var G = null, R = null, timers = [], tempTimer = null, sayText = '', sayMood = 'ready';
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function say(text, mood, cls) {
      clearTimeout(tempTimer);
      elCoach.className = 'so-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { sayText = text; sayMood = mood; }
    }
    function sayTemp(text, mood) {
      say(text, mood, 'is-temp');
      tempTimer = setTimeout(function () { say(sayText, sayMood); }, 1800);
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
    function paintMap(pop) {
      elMini.innerHTML = ladder.mapSVG({ mini: true });
      elLv.textContent = fmt(T.levelChip, { n: ladder.level() });
      if (pop) { elLv.classList.remove('is-up'); void elLv.offsetWidth; elLv.classList.add('is-up'); }
    }
    function paintProg() {
      elProg.innerHTML = '';
      var segStart = Math.floor(G.done / CH_BREAK) * CH_BREAK;
      var segLen = Math.min(CH_BREAK, CH_TRIALS - segStart);
      for (var j = 0; j < segLen; j++) {
        var n = segStart + j;
        elProg.appendChild(h('i', n < G.done ? 'on' : (n === G.done ? 'now' : '')));
      }
    }
    /* 받침 자리에 큰 단계 지도(시작·쉬는 화면) */
    function showMap(kind) {
      elTray.innerHTML = '';
      var d = h('div', 'so-info');
      if (kind === 'rest') d.appendChild(h('b', 'so-info-big', esc(T.restTitle)));
      d.appendChild(h('div', 'so-info-map', ladder.mapSVG()));
      d.appendChild(h('span', 'so-info-small', esc(kind === 'rest' ? fmt(T.restLine, { level: ladder.level() }) : fmt(T.today, { n: CH_TRIALS }))));
      elTray.appendChild(d);
    }
    function itemId() { return 't' + R.no; }
    function hasIcons(it) { return it.steps.some(function (st) { return !!(st.icon || st.img); }); }
    function cardHtml(st) {
      var ico = st.img ? '<img alt="" src="' + esc(st.img) + '">' : esc(st.icon || '');
      return '<span class="so-ico" aria-hidden="true">' + ico + '</span><span class="so-txt">' + esc(st.text) + '</span>';
    }

    /* 지금 칸에서 문제 고르기 — 같은 오늘의 도전 안에서는 다시 내지 않고, 다 떨어지면 섞어 다시 */
    function pickItem() {
      var lv = ladder.level(), sp = ladder.step() || { items: [] }, list = sp.items || [];
      var used = G.used[lv] = G.used[lv] || [];
      var fresh = list.filter(function (t) { return used.indexOf(t.id) < 0; });
      if (!fresh.length) {
        G.used[lv] = used = [];
        fresh = list.filter(function (t) { return list.length < 2 || t.id !== G.lastId; });
      }
      var it = pick(fresh);
      used.push(it.id);
      G.lastId = it.id;
      return { it: it, sp: sp, level: lv };
    }
    function readyLine() {
      var s = ladder.summary();
      if (s.source === 'coach') return fmt(T.readyCoach, { start: s.startLevel });
      if (s.source === 'resume') return fmt(T.readyResume, { last: s.prevLast, start: s.startLevel });
      return T.readyFirst;
    }
    function newTrial(first) {
      clearTimers();
      if (first) G.used = {};
      var pk = pickItem();
      R = { it: pk.it, sp: pk.sp, level: pk.level, no: G.done + 1, back: pk.sp.mode === 'backward', phase: first ? 'ready' : 'pick' };
      paintMap();
      if (first) {
        elScene.hidden = true;
        elSlots.innerHTML = '';
        elProg.hidden = true;
        showMap('ready');
        say(readyLine(), 'ready');
        var acts = [button(icon('play') + esc(T.start), 'start')];
        if (coach) {
          acts.push(ladder.coachPicker(function () { newTrial(true); }, function (lv, st) {
            st = st || { items: [] };
            var it0 = st.items[0] || { steps: [] };
            return lv + '칸 · ' + it0.steps.length + T.pickSteps + (hasIcons(it0) ? '' : ' ' + T.pickText) + (st.mode === 'backward' ? ' ' + T.pickBack : '');
          }, T.pickTitle));
        }
        setActions(acts);
        return;
      }
      ask();
    }

    function ask() {
      var it = R.it, n = it.steps.length;
      R.phase = 'pick';
      R.slot = R.back ? n - 1 : 0; R.filled = []; R.slotMiss = 0; R.misses = 0; R.helps = 0; R.hintUsed = false;
      R.tItem = R.tAsk = now();
      R.textOnly = !hasIcons(it);
      elScene.textContent = (it.icon ? it.icon + ' ' : '') + it.title;
      elScene.hidden = false;
      elProg.hidden = false;
      paintProg();
      /* 번호 칸 */
      elSlots.style.setProperty('--n', n);
      elSlots.innerHTML = '';
      for (var i = 0; i < n; i++) {
        if (i) elSlots.appendChild(h('span', 'so-arrow', icon(R.back ? 'back' : 'arrow', '#fff6dc')));
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
        var b = h('button', 'so-card' + (R.textOnly ? ' is-text' : ''), cardHtml(it.steps[si]));
        b.type = 'button';
        b.setAttribute('data-so-step', si);
        b.setAttribute('aria-label', it.steps[si].text);
        elTray.appendChild(b);
      });
      log('game-item-ready', {
        itemId: itemId(), level: R.level, target: it.id, title: it.title, steps: n, mode: R.back ? 'backward' : 'forward', pictures: !R.textOnly,
        trayOrder: R.order.map(function (x) { return x + 1; }).join(','), engine: 'step-order@' + VERSION
      });
      R.sayFirst = R.sp.say && G.saidLevel !== R.level ? R.sp.say : '';
      G.saidLevel = R.level;
      nextSlot();
    }
    function slotEl(i) { return elSlots.querySelector('[data-slot="' + i + '"]'); }
    function nextSlot() {
      var n = R.it.steps.length;
      if (R.back) { while (R.slot >= 0 && R.filled[R.slot]) R.slot--; }
      else { while (R.slot < n && R.filled[R.slot]) R.slot++; }
      Array.prototype.forEach.call(elSlots.querySelectorAll('.so-slot'), function (s) { s.classList.remove('is-next'); });
      if (R.slot >= n || R.slot < 0) { itemDone(); return; }
      slotEl(R.slot).classList.add('is-next');
      R.slotMiss = 0;
      R.cued = false;
      R.tAsk = now();
      var remain = 0;
      for (var i = 0; i < n; i++) if (!R.filled[i]) remain++;
      var startEdge = R.back ? R.slot === n - 1 : R.slot === 0;
      var line = R.back ? (startEdge ? T.firstB : (remain === 1 ? T.lastB : T.middleB)) : (startEdge ? T.first : (remain === 1 ? T.last : T.middle));
      if (startEdge && R.sayFirst) { line = R.sayFirst; R.sayFirst = ''; }
      say(line, 'ask');
      setActions([hintButton()]);
      tagCards();
    }
    function accNow() { return R.helps ? 'support' : (R.misses ? 'self-corrected' : 'accurate'); }
    function tagCards() {
      Array.prototype.forEach.call(elTray.querySelectorAll('.so-card'), function (b) {
        var si = +b.getAttribute('data-so-step'), right = si === R.slot;
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', itemId() + '-' + (R.slot + 1));
        b.setAttribute('data-level', String(R.level));
        b.setAttribute('data-response', R.it.steps[si].text);
        b.setAttribute('data-correct', right ? 'true' : 'false');
        if (right) b.setAttribute('data-accuracy', R.helps ? 'support' : (R.slotMiss ? 'self-corrected' : 'accurate')); else b.removeAttribute('data-accuracy');
      });
    }
    function hintButton() {
      var n = R.it.steps.length;
      var b = button(icon('flag', '#5b48d6') + esc(R.back ? T.hintB : T.hint), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': R.back ? 'show-first' : 'show-last', 'data-item-id': itemId()
      });
      /* 반대쪽 끝 칸이 이미 찼거나 남은 칸이 둘 이하면 감춘다 */
      var remain = 0, far = R.back ? 0 : n - 1;
      for (var i = 0; i < n; i++) if (!R.filled[i]) remain++;
      if (R.hintUsed || R.filled[far] || remain <= 2) b.hidden = true;
      return b;
    }
    function place(si, given) {
      var it = R.it;
      var card = elTray.querySelector('[data-so-step="' + si + '"]');
      if (card) {
        card.classList.remove('is-cue');
        card.classList.add('is-used');
        card.removeAttribute('data-track');
      }
      R.filled[si] = true;
      var s = slotEl(si);
      s.classList.add(given ? 'is-given' : 'is-done');
      var c = h('div', 'so-card' + (R.textOnly ? ' is-text' : ''), cardHtml(it.steps[si]));
      s.appendChild(c);
      sfx('place', si);
    }

    function onCard(b) {
      if (!R || R.phase !== 'pick' || b.classList.contains('is-used')) return;
      var si = +b.getAttribute('data-so-step'), it = R.it, t = now(), slot = R.slot;
      if (si === slot) {
        log('game-response', { itemId: itemId() + '-' + (slot + 1), level: R.level, slot: slot + 1, response: si + 1, correct: true, attempt: R.slotMiss + 1, accuracy: R.helps ? 'support' : (R.slotMiss ? 'self-corrected' : 'accurate'), responseMs: Math.round(t - R.tAsk) });
        place(si, false);
        R.slot += R.back ? -1 : 1;
        nextSlot();
        return;
      }
      R.slotMiss++;
      R.misses++;
      sfx('miss');
      log('game-response', {
        itemId: itemId() + '-' + (slot + 1), level: R.level, slot: slot + 1, response: si + 1, correct: false, attempt: R.slotMiss,
        errorType: 'skip-ahead', distance: R.back ? slot - si : si - slot, responseMs: Math.round(t - R.tAsk)
      });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake');
      later(function () { b.classList.remove('is-shake'); }, 420);
      if (R.slotMiss >= 2 && !R.cued) {
        R.cued = true;
        R.helps++;
        var r = elTray.querySelector('[data-so-step="' + slot + '"]');
        if (r) r.classList.add('is-cue');
        log('game-help', { itemId: itemId() + '-' + (slot + 1), level: R.level, helpLevel: 'A4', helpType: 'cue-next', trigger: 'second-miss' });
        say(T.cue, 'help');
      } else {
        sayTemp(R.back ? T.missB : T.miss, 'miss');
      }
      tagCards();
    }

    function doHint() {
      if (!R || R.phase !== 'pick' || R.hintUsed) return;
      var it = R.it, last = R.back ? 0 : it.steps.length - 1;
      if (R.filled[last]) return;
      R.hintUsed = true;
      R.helps++;
      sfx('show');
      place(last, true);
      say(R.back ? T.hintedB : T.hinted, 'help');
      log('game-help', { itemId: itemId(), level: R.level, helpLevel: 'A2', helpType: R.back ? 'show-first' : 'show-last', trigger: 'child-request' });
      setActions([hintButton()]);
      tagCards();
    }

    function itemDone() {
      var it = R.it, acc = accNow();
      R.phase = 'play';
      setActions([]);
      var summary = { itemId: itemId(), level: R.level, target: it.id, title: it.title, steps: it.steps.length, mode: R.back ? 'backward' : 'forward', pictures: !R.textOnly,
                      accuracy: acc, misses: R.misses, helps: R.helps, hint: R.hintUsed, totalMs: Math.round(now() - R.tItem) };
      G.results.push(summary);
      G.done++;
      log('game-item-complete', summary);
      /* 오르내리기: 한 번도 어긋나지 않고 도움 없이 다 놓으면 맞음 */
      var pass = acc === 'accurate' || (LD.countSelfCorrected && acc === 'self-corrected');
      var r = ladder.result(pass);
      var line = pick(T.good);
      if (r.changed) {
        log('game-level-change', { itemId: itemId(), fromLevel: r.from, toLevel: r.to, reason: r.reason, passes: r.passes, misses: r.fails, tries: r.tried });
        say(r.reason === 'up' ? line + ' ' + T.up : T.down, r.reason === 'up' ? 'good' : 'ready', r.reason === 'up' ? 'is-good' : 'is-temp');
        paintMap(true);
      } else if (r.atTop) {
        say(line + ' ' + T.top, 'good', 'is-good');
        paintMap(true);
      } else say(line, 'good', 'is-good');
      paintProg();
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
        var timeUp = Date.now() - G.t0 >= CH_MS;
        if (G.done >= CH_TRIALS || timeUp) finish(timeUp && G.done < CH_TRIALS ? 'time' : 'trials');
        else if (G.done % CH_BREAK === 0) rest();
        else newTrial(false);
      }, 350 + slots.length * step + o.nextMs + (r.changed ? 500 : 0));
    }

    function rest() {
      clearTimers();
      R.phase = 'rest';
      elProg.hidden = true;
      showMap('rest');
      say(T.restCoach, 'rest');
      setActions([button(icon('play') + esc(T.keepOn), 'continue')]);
      log('game-break', { afterTrial: G.done, level: ladder.level() });
    }

    function finish(reason) {
      clearTimers();
      if (R) R.phase = 'end';
      var s = ladder.summary();
      ladder.save();
      sfx('done');
      elEnd.hidden = false;
      elEnd.querySelector('h2').textContent = T.endTitle;
      elEnd.querySelector('.so-end-line').textContent = !s.prevLast ? fmt(T.endFirst, { max: s.maxLevel })
        : (s.maxLevel >= s.prevLast ? fmt(T.endAgain, { prev: s.prevLast, max: s.maxLevel }) : fmt(T.endSteady, { max: s.maxLevel }));
      elEnd.querySelector('.so-end-map').innerHTML = ladder.mapSVG();
      var acts = elEnd.querySelector('.so-end-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      var res = G.results, tally = { accurate: 0, 'self-corrected': 0, support: 0 };
      res.forEach(function (r) { tally[r.accuracy]++; });
      log('game-activity-complete', {
        trials: res.length, accurate: tally.accurate, selfCorrected: tally['self-corrected'], support: tally.support, cleanTrials: tally.accurate,
        misses: res.reduce(function (a, r) { return a + r.misses; }, 0),
        startLevel: s.startLevel, maxLevel: s.maxLevel, endLevel: s.endLevel,
        prevLastLevel: s.prevLast, prevBestLevel: s.prevBest, startSource: s.source,
        levelUps: s.ups, levelDowns: s.downs, ladderSize: ladder.size, endReason: reason
      });
      if (typeof o.onFinish === 'function') { try { o.onFinish(res.slice(), s); } catch (e) {} }
    }

    function restart() {
      clearTimers();
      elEnd.hidden = true;
      G = { done: 0, results: [], t0: 0, used: {}, lastId: '', saidLevel: 0 };
      ladder.begin();
      newTrial(true);
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
      if (name === 'start' && R && R.phase === 'ready') { G.t0 = Date.now(); ask(); }
      else if (name === 'continue' && R && R.phase === 'rest') newTrial(false);
      else if (name === 'hint') doHint();
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
      ladder: ladder,
      restart: restart,
      results: function () { return G ? G.results.slice() : []; },
      destroy: function () { clearTimers(); clearTimeout(tempTimer); root.remove(); }
    };
  }

  global.StepOrder = { version: VERSION, mount: mount };
})(window);
