/*!
 * 「반대로 누르기」 행동억제 게임 엔진  v1.1.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 3장 행동억제
 *            「행동억제를 위한 훈련 1~6」(눈사람을 보면 '비', 우산을 보면 '눈' / 해를 보면 '밤', 별을 보면 '낮'.
 *            격자의 그림을 왼쪽에서 오른쪽으로 읽으며 반대 낱말로 답하고, 틀린 횟수·걸린 시간을 적는다)
 *            — 활동 방식만 가져왔고, 책의 그림·문장은 쓰지 않았다.
 *
 * 난이도: 판마다 반대 짝을 하나씩 더한다(그림 2가지 → 4가지 → 6가지). 그림마다 「반대 낱말」이 정해져 있고,
 *         그 판에 필요한 낱말 단추만 나온다(2·4·6개). 새로 들어온 그림은 규칙판에 「새 그림」으로 표시한다.
 *
 * 크기: 넣은 칸을 가득 채운다. 온큐베이트 기본 수업의 활동창 안쪽(약 920×450)이 기준이고,
 *       클래스인 최소 화면 속 활동창(약 750×417)까지 스크롤 없이 들어간다. 세로로 긴 칸은 위아래로 쌓인다.
 *       ⚠ 넣을 칸에 높이를 주어야 한다(높이가 없으면 400px로 잡힌다).
 *
 * 쓰는 법
 *   <div id="game" style="height:450px"></div>
 *   <script src="shared/opposite-press.js"></script>
 *   <script> OppositePress.mount(document.getElementById('game'), { kinds: {...}, rounds: [...] }) </script>
 *
 * 한 판의 흐름
 *   규칙판(그림 ➜ 눌러야 할 낱말) → 시작 → 금색 테 카드를 보고 반대 낱말 단추 누르기(말하면서) → 다음 카드 …
 *   어긋나게 누르면
 *     1번째 : 카드가 흔들리고 「잠깐! 반대로예요.」 → 다시 누르기
 *     2번째 : 맞는 단추가 금색으로 반짝이고 「해를 보면 '밤'이에요」(도움 A4) → 누르기
 *   「규칙 보기」는 아이가 언제든 누를 수 있다(도움 A2).
 *   걸린 시간·틀린 횟수는 기록에만 남기고 아이 화면에는 띄우지 않는다(규격 7장: 점수 표시 금지).
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 낱말 단추      data-track="answer" + data-item-id(판-몇째) + data-correct + data-response + (맞는 단추) data-accuracy
 *   - 규칙 보기      data-track="hint" data-help-level="A2"
 *   - 끝 화면        data-track="activity-complete"
 *   - 자세한 신호    oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.1.0';

  var TEXT = {
    title: '반대로 누르기',
    ready: '그림을 보고 반대 낱말을 말하면서 눌러요.',
    readySame: '그림과 같은 낱말을 말하면서 눌러요.',
    start: '시작',
    run: '반대로 눌러요!',
    runSame: '같은 것을 눌러요!',
    oops: '잠깐! 반대로예요.',
    oopsSame: '잠깐! 같은 것을 눌러요.',
    cue: '{name} 보면 「{word}」{ida}.',
    rule: '규칙 보기',
    ruleOpposite: '반대로!',
    ruleSame: '똑같이!',
    newKind: '새 그림',
    allDone: '{n}장 모두 했어요!',
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoCount: '카드 {n}장',
    infoKinds: '그림 {n}가지',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var COACH = {
    ready: 'jelly-default', run: 'jelly-look', oops: 'jelly-thinking', help: 'jelly-puzzle',
    done: 'jelly-praise', end: 'jelly-cheer'
  };

  var DEFAULTS = {
    activityId: 'opposite-press',
    storageKey: null,
    kinds: {},                 // { key: {name, word, opposite, img|emoji} } — 적은 순서가 단추 순서
    rounds: [],                // [ {id, kinds:[key…], count, rule:'opposite'|'same'} ]
    peekMs: 1800,              // 규칙 보기 시간
    guardMs: 150,              // 새 카드가 나온 직후 이 시간 안의 누름은 받지 않음(겹쳐 누름 막기)
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
    '.op-root{--v8:#3b2a9e;--v7:#4a32c9;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--coral:#ff8a80;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:op / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.op-root *,.op-root *::before,.op-root *::after{box-sizing:border-box}',
    '.op-root [hidden]{display:none!important}',
    '.op-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    /* 무대 */
    '.op-arena{container:oparena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.op-rays{position:absolute;left:50%;top:45%;width:1400px;height:1400px;margin:-700px 0 0 -700px;pointer-events:none;',
    'background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.05) 0 8deg,transparent 8deg 20deg);animation:op-spin 90s linear infinite}',
    '.op-grid{--cols:4;--rows:2;--g:8px;',
    '--cs:min(calc((100cqw - 32px - (var(--cols) - 1) * var(--g)) / var(--cols)),calc((100cqh - 32px - (var(--rows) - 1) * var(--g)) / var(--rows)),118px);',
    'position:relative;z-index:2;width:100%;height:100%;display:grid;gap:var(--g);justify-content:center;align-content:center;',
    'grid-template-columns:repeat(var(--cols),var(--cs));grid-template-rows:repeat(var(--rows),var(--cs))}',

    /* 카드 */
    '.op-card{container-type:size;position:relative;display:flex;align-items:center;justify-content:center;border-radius:14px;',
    'background:linear-gradient(180deg,#fff 0%,#fffaf0 100%);box-shadow:inset 0 0 0 2px #fff,inset 0 -4px 0 #efe6d2,0 4px 0 var(--v3),0 8px 14px rgba(10,4,50,.2);',
    'transition:transform .18s cubic-bezier(.3,1.5,.5,1),opacity .25s,box-shadow .18s}',
    '.op-card img{width:72cqmin;height:72cqmin;object-fit:contain;pointer-events:none;-webkit-user-drag:none}',
    '.op-card .op-emo{font-size:60cqmin;line-height:1;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif}',
    '.op-card .op-txt{font-size:30cqmin;font-weight:900;color:#2b2140}',
    '.op-card.is-now{z-index:3;transform:scale(1.12);box-shadow:inset 0 0 0 3px var(--gold),0 5px 0 var(--gold-d),0 0 22px rgba(255,210,63,.75)}',
    '.op-card.is-done{opacity:.3;transform:scale(.9)}',
    '.op-card.is-done::after{content:"\\2713";position:absolute;right:7%;top:5%;color:var(--mint-d);font-size:clamp(11px,20cqmin,20px);font-weight:900}',
    '.op-card.op-wob{animation:op-wob .45s ease-in-out}',

    /* 규칙판: 그림 수만큼 줄, 칸 크기는 줄 수에 맞춤 */
    '.op-rule{--rk:2;--rc:1;--rs:min(24cqmin,calc(64cqh / var(--rk)),calc(90cqw / var(--rc) / 3.7));position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;',
    'gap:calc(var(--rs) * .16);background:rgba(27,20,98,.88);animation:op-pop .22s ease-out}',
    '.op-rule-title{font-size:clamp(20px,8cqh,40px);font-weight:900;color:var(--gold);letter-spacing:-.02em;text-shadow:0 3px 0 rgba(0,0,0,.25);margin-bottom:1cqh}',
    '.op-rule-rows{display:grid;grid-template-columns:repeat(var(--rc),auto);gap:calc(var(--rs) * .2) 5cqw}',
    '.op-rule-row{position:relative;display:flex;align-items:center;gap:calc(var(--rs) * .22)}',
    '.op-rule .op-card{width:var(--rs);height:var(--rs);flex:none}',
    '.op-arrow{font-size:calc(var(--rs) * .38);font-weight:900;color:var(--gold)}',
    '.op-chip{display:flex;align-items:center;gap:calc(var(--rs) * .08);height:var(--rs);padding:0 calc(var(--rs) * .18) 0 calc(var(--rs) * .1);border-radius:16px;background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.op-chip img{width:calc(var(--rs) * .62);height:calc(var(--rs) * .62);object-fit:contain}',
    '.op-chip .op-emo{font-size:calc(var(--rs) * .5);line-height:1}',
    '.op-chip b{font-size:calc(var(--rs) * .42);font-weight:900;color:var(--v8)}',
    '.op-new{position:absolute;left:calc(var(--rs) * -.18);top:calc(var(--rs) * -.14);z-index:2;padding:2px 7px;border-radius:99px;background:var(--gold);color:#3b2a9e;',
    'font-size:clamp(10px,calc(var(--rs) * .16),13px);font-weight:900;white-space:nowrap;box-shadow:0 2px 0 var(--gold-d);transform:rotate(-8deg)}',

    /* 오른쪽 칸 */
    '.op-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.op-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.op-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.op-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.op-dot{display:inline-flex;align-items:center;justify-content:center;gap:2px;min-width:28px;height:28px;padding:0 6px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900}',
    '.op-dot i{display:block;width:6px;height:9px;border-radius:2px;background:currentColor;opacity:.8}',
    '.op-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.op-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.op-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.op-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.op-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.op-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.op-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.op-coach.is-temp .op-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.op-prog{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums}',
    '.op-prog-bar{flex:1;height:8px;border-radius:99px;background:var(--v1);overflow:hidden}',
    '.op-prog-bar i{display:block;width:0;height:100%;border-radius:99px;background:linear-gradient(90deg,#5b48d6,#4bc9dc);transition:width .2s}',
    '.op-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.op-info-icon{font-size:clamp(34px,11cqh,52px);line-height:1}',
    '.op-info-pics{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;align-items:center}',
    '.op-info-pics img{width:clamp(34px,11cqh,52px);height:clamp(34px,11cqh,52px);object-fit:contain}',
    '.op-info-pics .op-emo{font-size:clamp(28px,9cqh,44px);line-height:1}',
    '.op-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.op-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.op-answers{--ac:2;--ar:1;flex:1 1 auto;min-height:0;display:grid;gap:10px;',
    'grid-template-columns:repeat(var(--ac),minmax(0,1fr));grid-template-rows:repeat(var(--ar),minmax(0,1fr));grid-auto-flow:column}',
    '.op-ans{container-type:size;position:relative;min-width:0;min-height:0;display:block;',
    'padding:6px;border:0;border-radius:18px;cursor:pointer;font:inherit;color:var(--ink);touch-action:manipulation;',
    'background:linear-gradient(180deg,#fff,#fffaf0);box-shadow:inset 0 0 0 2px #fff,inset 0 -6px 0 #efe6d2,0 5px 0 var(--v3),0 10px 18px rgba(37,20,78,.12);',
    'transition:transform .1s,box-shadow .15s}',
    '.op-ans-in{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3cqh;width:100%;height:100%}',
    '.op-ans img{width:min(46cqw,42cqh);height:min(46cqw,42cqh);object-fit:contain;pointer-events:none}',
    '.op-ans .op-emo{font-size:min(38cqw,34cqh);line-height:1}',
    '.op-ans b{font-size:clamp(20px,min(30cqw,26cqh),56px);font-weight:900;letter-spacing:-.02em;color:var(--v8);line-height:1}',
    /* 단추가 옆으로 넓으면(단추 4개) 그림과 낱말을 나란히 */
    '@container (min-aspect-ratio:3/2){.op-ans-in{flex-direction:row;gap:7cqw}',
    '.op-ans img{width:min(34cqw,66cqh);height:min(34cqw,66cqh)}.op-ans .op-emo{font-size:min(28cqw,56cqh)}',
    '.op-ans b{font-size:clamp(22px,min(24cqw,48cqh),56px)}}',
    '.op-ans:active{transform:translateY(3px);box-shadow:inset 0 0 0 2px #fff,inset 0 -6px 0 #efe6d2,0 2px 0 var(--v3)}',
    '.op-ans:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:3px}',
    '.op-ans.is-ok{box-shadow:inset 0 0 0 4px var(--mint),0 5px 0 #9fdcc0}',
    '.op-ans.is-no{box-shadow:inset 0 0 0 4px var(--coral),0 5px 0 #f3b7ae;animation:op-wob .45s ease-in-out}',
    '.op-ans.is-cue{animation:op-cue 1s ease-in-out infinite}',
    '.op-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.op-left{display:flex;gap:8px;margin-right:auto}',
    '.op-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.op-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 20px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.op-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.op-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.op-btn:focus-visible,.op-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    /* 끝 화면 */
    '.op-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.op-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.op-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.op-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.op-end .op-btns{margin:0;justify-content:center}',
    '.op-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.op-stamps .op-dot{height:40px;padding:0 12px;gap:3px;border-radius:12px}',
    '.op-stamps .op-dot i{width:9px;height:14px}',
    '.op-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.op-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    /* 움직임 */
    '.op-bit{position:absolute;left:50%;top:50%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:op-bit .9s ease-out forwards}',
    '@keyframes op-spin{to{transform:rotate(360deg)}}',
    '@keyframes op-pop{from{transform:scale(.94)}}',
    '@keyframes op-wob{20%{transform:rotate(-6deg) translateX(-5px)}45%{transform:rotate(5deg) translateX(5px)}70%{transform:rotate(-2deg)}}',
    '@keyframes op-cue{0%,100%{box-shadow:inset 0 0 0 3px var(--gold),0 5px 0 var(--gold-d)}50%{box-shadow:inset 0 0 0 4px var(--gold),0 5px 0 var(--gold-d),0 0 0 7px rgba(255,210,63,.55)}}',
    '@keyframes op-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    /* 세로로 긴 칸 */
    '@container op (max-aspect-ratio:5/4){',
    '.op-wrap{--arena:min(calc(100cqw - 24px),50cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.op-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.op-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('op-style')) return;
    var s = document.createElement('style');
    s.id = 'op-style';
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
  /* 받침 여부로 조사 고르기 */
  function hasBatchim(word) {
    var c = String(word).charCodeAt(String(word).length - 1);
    return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
  }
  function eul(word) { return word + (hasBatchim(word) ? '을' : '를'); }
  function ida(word) { return hasBatchim(word) ? '이에요' : '예요'; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  /* 그림 k가지를 고르게 섞되, 같은 그림이 maxRun번 넘게 이어지지 않게 */
  function sequence(k, count) {
    var maxRun = k <= 2 ? 3 : 2, base = [];
    /* 그림마다 같은 수, 나누어떨어지지 않으면 남는 장은 무작위 그림에 한 장씩 */
    var extra = shuffle(Array.apply(null, { length: k }).map(function (x, i) { return i; })).slice(0, count % k);
    for (var i = 0; i < k; i++) {
      for (var j = 0; j < Math.floor(count / k) + (extra.indexOf(i) >= 0 ? 1 : 0); j++) base.push(i);
    }
    var best = base;
    for (var tries = 0; tries < 400; tries++) {
      var s = shuffle(base), run = 1, ok = true;
      for (var m = 1; m < s.length; m++) {
        run = s[m] === s[m - 1] ? run + 1 : 1;
        if (run > maxRun) { ok = false; break; }
      }
      if (ok) return s;
      best = s;
    }
    return best;
  }
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
    var KINDS = o.kinds, ORDER = Object.keys(KINDS);
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

    var root = h('div', 'op-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="op-wrap">' +
        '<div class="op-arena"><div class="op-rays"></div><div class="op-grid" role="list" aria-label="카드판"></div></div>' +
        '<aside class="op-side">' +
          '<div class="op-top">' +
            '<span class="op-title">' + esc(T.title) + '</span>' +
            '<ol class="op-rounds" aria-label="판"></ol>' +
            '<button type="button" class="op-sound" data-op-act="sound"></button>' +
          '</div>' +
          '<div class="op-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="op-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="op-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="op-prog" hidden><span class="op-prog-txt"></span><span class="op-prog-bar"><i></i></span></div>' +
          '<div class="op-info" hidden></div>' +
          '<div class="op-answers" hidden></div>' +
          '<div class="op-actions"><div class="op-left"></div><div class="op-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="op-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="op-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="op-end-line"></p><div class="op-stamps"></div><div class="op-btns"></div>' +
        (o.credit ? '<p class="op-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'op-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.op-rounds'), elSound = $('.op-sound'), elArena = $('.op-arena'), elGrid = $('.op-grid'),
        elCoach = $('.op-coach'), elCoachImg = $('.op-coach-img'), elBubble = $('.op-bubble'),
        elProg = $('.op-prog'), elProgTxt = $('.op-prog-txt'), elProgBar = $('.op-prog-bar i'),
        elInfo = $('.op-info'), elAns = $('.op-answers'), elLeft = $('.op-left'), elActs = $('.op-side .op-btns'), elEnd = $('.op-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var plans = [], R = null, ri = 0, results = [], tempTimer = null, ruleTimer = null;

    /* 판 계획: 나올 그림 ks, 그림마다 눌러야 할 낱말(그림 key), 단추 목록, 카드 순서 */
    function plan(spec, idx) {
      var ks = (spec.kinds || []).filter(function (key) { return KINDS[key]; });
      var rule = spec.rule === 'same' ? 'same' : 'opposite';
      var answerOf = {};
      ks.forEach(function (key) {
        var op = KINDS[key].opposite;
        answerOf[key] = rule === 'same' || !op || !KINDS[op] ? key : op;
      });
      var buttons = ORDER.filter(function (key) {
        return ks.some(function (c) { return answerOf[c] === key; });
      });
      var count = Math.max(ks.length, spec.count || 16);
      var cols = count <= 16 ? 4 : Math.ceil(Math.sqrt(count));
      return {
        id: spec.id || ('r' + (idx + 1)), ks: ks, rule: rule, answerOf: answerOf, buttons: buttons,
        count: count, cols: cols, rows: Math.ceil(count / cols),
        seq: sequence(ks.length, count).map(function (n) { return ks[n]; })
      };
    }

    function pic(item, cls) {
      if (item.img) return '<img src="' + esc(item.img) + '" alt="" draggable="false">';
      if (item.emoji) return '<span class="op-emo" aria-hidden="true">' + esc(item.emoji) + '</span>';
      return cls === 'card' ? '<span class="op-txt">' + esc(item.name) + '</span>' : '';
    }

    function say(text, mood) {
      clearTimeout(tempTimer);
      elCoach.classList.remove('is-temp');
      R.sayText = text; R.sayMood = mood;
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
    }
    function sayTemp(text, mood) {
      clearTimeout(tempTimer);
      elCoach.classList.add('is-temp');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood || 'oops');
      tempTimer = setTimeout(function () {
        elCoach.classList.remove('is-temp');
        elBubble.textContent = R.sayText;
        if (elCoachImg) elCoachImg.src = coachSrc(R.sayMood);
      }, 1600);
    }
    function wob(el, cls) {
      el.classList.remove(cls || 'op-wob');
      void el.offsetWidth;
      el.classList.add(cls || 'op-wob');
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'op-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-op-act', act);
      for (var a in attrs || {}) b.setAttribute(a, attrs[a]);
      return b;
    }
    function setActions(list, left) {
      elActs.innerHTML = '';
      list.forEach(function (b) { elActs.appendChild(b); });
      elLeft.innerHTML = '';
      (left || []).forEach(function (b) { elLeft.appendChild(b); });
    }
    /* 판 표시: 그 판의 그림 가짓수만큼 막대 */
    function roundDot(p, cls) {
      return h('li', 'op-dot' + (cls ? ' ' + cls : ''), new Array(p.ks.length + 1).join('<i></i>'));
    }
    function paintRounds(doneUpTo) {
      elRounds.innerHTML = '';
      plans.forEach(function (p, i) {
        var done = i < doneUpTo;
        var li = roundDot(p, done ? 'is-done' : (i === ri ? 'is-now' : ''));
        li.setAttribute('aria-label', (i + 1) + '판 그림 ' + p.ks.length + '가지' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function showInfo(kind) {
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var p = R.p, left = plans.length - ri - 1;
      if (kind === 'done') {
        elInfo.appendChild(h('span', 'op-info-icon', '🎉'));
        elInfo.appendChild(h('b', 'op-info-big', esc(fmt(T.infoDone, { n: ri + 1 }))));
        elInfo.appendChild(h('span', 'op-info-small', esc(left ? fmt(T.infoLeft, { n: left }) : T.infoLast)));
      } else {
        elInfo.appendChild(h('span', 'op-info-pics', p.ks.map(function (key) { return pic(KINDS[key], 'chip'); }).join('')));
        elInfo.appendChild(h('b', 'op-info-big', esc(fmt(T.infoCount, { n: p.count }))));
        elInfo.appendChild(h('span', 'op-info-small', esc(fmt(T.infoKinds, { n: p.ks.length }) + ' · ' + (p.rule === 'same' ? T.ruleSame : T.ruleOpposite))));
      }
      elInfo.hidden = false;
    }

    /* 규칙판: 그림 ➜ 눌러야 할 낱말 (새로 들어온 그림엔 「새 그림」) */
    function ruleBoard() {
      var p = R.p, prev = ri > 0 ? plans[ri - 1].ks : null;
      var board = h('div', 'op-rule'), rc = p.ks.length > 4 ? 2 : 1;
      board.style.setProperty('--rc', rc);
      board.style.setProperty('--rk', Math.ceil(p.ks.length / rc));
      board.appendChild(h('div', 'op-rule-title', esc(p.rule === 'same' ? T.ruleSame : T.ruleOpposite)));
      var rows = h('div', 'op-rule-rows');
      board.appendChild(rows);
      p.ks.forEach(function (key) {
        var target = KINDS[p.answerOf[key]];
        var isNew = prev && prev.indexOf(key) < 0 && R.phase === 'ready';
        rows.appendChild(h('div', 'op-rule-row',
          (isNew ? '<span class="op-new">' + esc(T.newKind) + '</span>' : '') +
          '<span class="op-card">' + pic(KINDS[key], 'card') + '</span>' +
          '<span class="op-arrow" aria-hidden="true">➜</span>' +
          '<span class="op-chip">' + pic(target, 'chip') + '<b>' + esc(target.word) + '</b></span>'));
      });
      return board;
    }
    function showRule(ms) {
      hideRule();
      elArena.appendChild(ruleBoard());
      if (ms) ruleTimer = setTimeout(hideRule, ms);
    }
    function hideRule() {
      clearTimeout(ruleTimer);
      var b = elArena.querySelector('.op-rule');
      if (b) b.remove();
    }

    /* ── 한 판 시작 ── */
    function startRound(i) {
      ri = i;
      var p = plans[i];
      R = { p: p, phase: 'ready', idx: 0, errs: 0, peekOnItem: false, peeks: 0, acc: [], rts: [], wrong: 0, prepotent: 0,
            cards: [], btns: [], sayText: '', sayMood: 'ready', tItem: 0, tStart: 0 };
      paintRounds(i);
      elGrid.style.setProperty('--cols', p.cols);
      elGrid.style.setProperty('--rows', p.rows);
      elGrid.innerHTML = '';
      p.seq.forEach(function (key, j) {
        var c = h('div', 'op-card', pic(KINDS[key], 'card'));
        c.setAttribute('role', 'listitem');
        c.setAttribute('aria-label', (j + 1) + '번째 ' + KINDS[key].name);
        elGrid.appendChild(c);
        R.cards.push(c);
      });
      elAns.innerHTML = '';
      elAns.hidden = true; elProg.hidden = true;
      showInfo('ready');
      showRule(0);
      say(p.rule === 'same' ? T.readySame : T.ready, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    function startRun() {
      var p = R.p, n = p.buttons.length;
      hideRule();
      showInfo(null);
      R.phase = 'run';
      /* 단추는 위아래 두 줄을 넘지 않게, 짝(적은 순서로 이웃한 둘)이 한 기둥에 서도록 세로부터 채움 */
      var ac = n <= 3 ? n : Math.ceil(n / 2);
      elAns.style.setProperty('--ac', ac);
      elAns.style.setProperty('--ar', Math.ceil(n / ac));
      p.buttons.forEach(function (key, b) {
        var item = KINDS[key];
        var el = h('button', 'op-ans', '<span class="op-ans-in">' + pic(item, 'ans') + '<b>' + esc(item.word) + '</b></span>');
        el.type = 'button';
        el.setAttribute('data-b', b);
        el.setAttribute('aria-label', item.word + ' (' + (b + 1) + '번 단추)');
        elAns.appendChild(el);
        R.btns.push(el);
      });
      elAns.hidden = false;
      elProg.hidden = false;
      say(p.rule === 'same' ? T.runSame : T.run, 'run');
      setActions([], [button('📋 ' + esc(T.rule), 'rule', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'child-request', 'data-item-id': p.id
      })]);
      log('game-item-ready', {
        itemId: p.id, kinds: p.ks.length, kindList: p.ks.map(function (key) { return KINDS[key].name; }).join('|'),
        buttons: p.buttons.map(function (key) { return KINDS[key].word; }).join('|'),
        rule: p.rule, count: p.count,
        sequence: p.seq.map(function (key) { return KINDS[key].name; }).join('|'),
        engine: 'opposite-press@' + VERSION
      });
      R.tStart = now();
      focusItem();
    }

    function expectedBtn() { return R.p.buttons.indexOf(R.p.answerOf[R.p.seq[R.idx]]); }

    /* 지금 카드에 금색 테 + 단추마다 기록 표시 */
    function focusItem() {
      var p = R.p;
      R.cards.forEach(function (c, j) { c.classList.toggle('is-now', j === R.idx); });
      elProgTxt.textContent = R.idx + ' / ' + p.count;
      elProgBar.style.width = (R.idx / p.count * 100) + '%';
      R.errs = 0;
      R.peekOnItem = false;
      R.tItem = now();
      R.btns.forEach(function (b) { b.classList.remove('is-cue', 'is-no'); });
      if (R.sayMood === 'help') say(p.rule === 'same' ? T.runSame : T.run, 'run');
      arm();
    }
    function arm() {
      var p = R.p, exp = expectedBtn();
      R.btns.forEach(function (b, i) {
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', p.id + '-' + (R.idx + 1));
        b.setAttribute('data-response', KINDS[p.buttons[i]].word);
        b.setAttribute('data-correct', i === exp ? 'true' : 'false');
        if (i === exp) b.setAttribute('data-accuracy', accNow());
        else b.removeAttribute('data-accuracy');
      });
    }
    function accNow() {
      if (R.errs >= 2 || R.peekOnItem) return 'support';
      return R.errs === 1 ? 'self-corrected' : 'accurate';
    }

    function press(b) {
      if (!R || R.phase !== 'run') return;
      var p = R.p, t = now();
      if (t - R.tItem < o.guardMs) return;
      var shown = p.seq[R.idx], exp = expectedBtn(), ok = b === exp, btn = R.btns[b], pressed = p.buttons[b];
      var acc = ok ? accNow() : '';
      /* 어긋난 종류: 보이는 그림 그대로 누름(prepotent) / 다른 그림의 낱말(other) */
      var errorType = ok ? '' : (pressed === shown ? 'prepotent' : 'other');
      log('game-response', {
        itemId: p.id + '-' + (R.idx + 1), picture: KINDS[shown].name, kinds: p.ks.length, correct: ok,
        response: KINDS[pressed].word, expected: KINDS[p.answerOf[shown]].word, attempt: R.errs + 1,
        errorType: errorType, accuracy: acc, responseMs: Math.round(t - R.tItem)
      });
      if (ok) {
        if (R.errs === 0 && !R.peekOnItem) R.rts.push(t - R.tItem);
        R.acc.push(acc);
        wob(btn, 'is-ok');
        setTimeout(function () { btn.classList.remove('is-ok'); }, 220);
        sfx('tick');
        var card = R.cards[R.idx];
        card.classList.remove('is-now');
        card.classList.add('is-done');
        R.idx++;
        if (R.idx >= p.count) { roundDone(); return; }
        focusItem();
        return;
      }
      R.errs++;
      R.wrong++;
      if (errorType === 'prepotent') R.prepotent++;
      sfx('again');
      wob(R.cards[R.idx]);
      wob(btn, 'is-no');
      setTimeout(function () { btn.classList.remove('is-no'); }, 460);
      if (R.errs === 1) {
        sayTemp(p.rule === 'same' ? T.oopsSame : T.oops);
      } else {
        var target = KINDS[p.answerOf[shown]];
        R.btns[exp].classList.add('is-cue');
        say(fmt(T.cue, { name: eul(KINDS[shown].name), word: target.word, ida: ida(target.word) }), 'help');
        log('game-help', { itemId: p.id + '-' + (R.idx + 1), helpLevel: 'A4', helpType: 'answer-cue', trigger: 'second-miss' });
      }
      arm();
    }

    function peekRule() {
      if (!R || R.phase !== 'run') return;
      R.peeks++;
      R.peekOnItem = true;
      arm();
      sfx('show');
      showRule(o.peekMs);
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'op-bit');
        var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 120;
        b.style.background = colors[i % colors.length];
        b.style.setProperty('--dx', 'calc(-50% + ' + Math.round(Math.cos(ang) * dist) + 'px)');
        b.style.setProperty('--dy', 'calc(-50% + ' + Math.round(Math.sin(ang) * dist) + 'px)');
        b.style.setProperty('--r', Math.round(Math.random() * 540) + 'deg');
        elArena.appendChild(b);
        setTimeout(function (x) { return function () { x.remove(); }; }(b), 1000);
      }
    }

    function roundDone() {
      var p = R.p;
      R.phase = 'done';
      hideRule();
      elAns.hidden = true;
      elProg.hidden = true;
      sfx('done');
      burst();
      var count = { accurate: 0, 'self-corrected': 0, support: 0 };
      R.acc.forEach(function (a) { count[a]++; });
      var summary = {
        itemId: p.id, kinds: p.ks.length, rule: p.rule, count: p.count,
        accurate: count.accurate, selfCorrected: count['self-corrected'], support: count.support,
        wrongPresses: R.wrong, prepotentPresses: R.prepotent, rulePeeks: R.peeks,
        totalMs: Math.round(now() - R.tStart), medianRtMs: median(R.rts)
      };
      results.push(summary);
      log('game-item-complete', summary);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(summary); } catch (e) {} }
      say(fmt(T.allDone, { n: p.count }), 'done');
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
      elEnd.querySelector('.op-end-line').textContent = fmt(T.endLine, { n: plans.length });
      var st = elEnd.querySelector('.op-stamps');
      st.innerHTML = '';
      plans.forEach(function (p) { st.appendChild(roundDot(p, 'is-done')); });
      var acts = elEnd.querySelector('.op-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      log('game-activity-complete', {
        rounds: plans.length,
        presses: results.reduce(function (s, r) { return s + r.count; }, 0),
        accurate: results.reduce(function (s, r) { return s + r.accurate; }, 0),
        selfCorrected: results.reduce(function (s, r) { return s + r.selfCorrected; }, 0),
        support: results.reduce(function (s, r) { return s + r.support; }, 0),
        wrongPresses: results.reduce(function (s, r) { return s + r.wrongPresses; }, 0)
      });
      if (typeof o.onFinish === 'function') { try { o.onFinish(results.slice()); } catch (e) {} }
    }

    function restart() {
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
      if (name === 'start' && R.phase === 'ready') { setActions([]); startRun(); }
      else if (name === 'rule') peekRule();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-op-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-op-act')); return; }
      var ans = e.target.closest('.op-ans');
      if (ans && root.contains(ans)) { press(+ans.getAttribute('data-b')); return; }
      if (R && R.phase === 'run' && e.target.closest('.op-card')) {
        sayTemp(R.p.rule === 'same' ? T.runSame : T.run, 'run');
        R.btns.forEach(function (x) { wob(x); });
      }
    }
    /* 키보드: 1~4 = 단추 순서, ← → = 단추가 둘일 때 */
    function onKey(e) {
      if (!R || R.phase !== 'run' || e.repeat) return;
      var a = document.activeElement;
      if (a && a !== document.body && !root.contains(a)) return;
      var i = -1;
      if (/^[1-9]$/.test(e.key)) i = +e.key - 1;
      else if (R.btns.length === 2 && e.key === 'ArrowLeft') i = 0;
      else if (R.btns.length === 2 && e.key === 'ArrowRight') i = 1;
      if (i >= 0 && i < R.btns.length) { e.preventDefault(); R.btns[i].click(); }
    }

    root.addEventListener('click', onClick);
    global.addEventListener('keydown', onKey);

    restart();

    return {
      root: root,
      restart: restart,
      results: function () { return results.slice(); },
      destroy: function () {
        clearTimeout(tempTimer); clearTimeout(ruleTimer);
        global.removeEventListener('keydown', onKey);
        root.remove();
      }
    };
  }

  global.OppositePress = { version: VERSION, mount: mount };
})(window);
