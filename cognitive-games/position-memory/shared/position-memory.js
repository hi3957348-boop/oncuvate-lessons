/*!
 * 「어디 있었지?」 그림 자리 기억 게임 엔진  v1.1.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 1장 작업기억
 *            「그림 보고 기억나는 대로 적어 보기」(9칸·16칸에 놓인 그림의 자리 기억)
 *            — 활동 방식만 가져왔고, 책의 그림·문장은 쓰지 않았다.
 *
 * 크기: 넣은 칸을 가득 채운다. 온큐베이트 기본 수업의 활동창 안쪽(약 920×450)이 기준이고,
 *       클래스인 최소 화면에서 활동창이 줄어든 크기(약 750×417)까지 스크롤 없이 들어간다.
 *       세로로 긴 칸(휴대폰)에서는 판이 위, 받침이 아래로 쌓인다.
 *       ⚠ 넣을 칸에 높이를 주어야 한다(높이가 없으면 400px로 잡힌다).
 *
 * 쓰는 법
 *   <div id="game" style="height:450px"></div>
 *   <script src="shared/position-memory.js"></script>
 *   <script> PositionMemory.mount(document.getElementById('game'), { pool: [...], rounds: [...] }) </script>
 *
 * 한 판의 흐름
 *   시작 → 보기(그림이 앞면으로 나옴, 모래시계) → 카드가 뒤집혀 받침으로 → 놓기 → 확인
 *   확인에서 어긋난 그림은 받침으로 돌아간다.
 *     1번째 확인 뒤  : 다시 떠올리기 + 「살짝 보기」(아이가 고름, 도움 A2)
 *     2번째 확인 뒤  : 「자리 보여 줘」 → 남은 그림 자리를 보여 줌(도움 A3) → 아이가 놓기
 *     3번째 확인 뒤  : 「제자리로 옮겨 줘」 → 엔진이 옮겨 줌(도움 A4) → 판 끝
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 확인 단추       data-track="answer" (data-item-id=판, data-correct, data-response)
 *   - 도움 단추 셋    data-track="hint" + data-help-level A2/A3/A4
 *   - 끝 화면         data-track="activity-complete"
 *   - 자세한 신호     oncuvate:log  game-item-ready / game-response / game-item-complete / game-activity-complete
 *   - 화면 밖으로 아무것도 보내지 않는다(기록은 온큐베이트가 주입하는 트래커가 가져간다).
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.1.0';

  var TEXT = {
    title: '어디 있었지?',
    ready: '그림 {n}개가 나와요. 자리를 잘 기억해요.',
    start: '시작',
    look: '그림이 어디 있는지 잘 봐요.',
    lookDone: '다 기억했어요',
    place: '그림을 골라 제자리에 놓아요.',
    placeExtra: '판에 있던 그림만 골라 제자리에 놓아요.',
    pickFirst: '먼저 아래에서 그림을 하나 골라요.',
    check: '다 놓았어요',
    retry: '{n}개는 제자리예요. 나머지 자리를 한 번 더 떠올려 봐요.',
    retryZero: '자리를 한 번 더 떠올려 봐요.',
    peek: '살짝 보기',
    model: '이번에는 자리를 보여 줄게요.',
    modelBtn: '자리 보여 줘',
    afterModel: '봤지요? 이제 제자리에 놓아요.',
    support: '제자리로 같이 옮겨 봐요.',
    supportBtn: '제자리로 옮겨 줘',
    waitModel: '먼저 「자리 보여 줘」를 눌러요.',
    waitSupport: '먼저 「제자리로 옮겨 줘」를 눌러요.',
    allDone: '모두 제자리예요!',
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기',
    infoGrid: '{n}칸 판',
    infoCount: '그림 {n}개',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요'
  };

  /* 젤리코치 표정: 상황 → 파일 이름(coachBase 안) */
  var COACH = {
    ready: 'jelly-default', look: 'jelly-look', place: 'jelly-default', retry: 'jelly-thinking',
    help: 'jelly-puzzle', done: 'jelly-praise', end: 'jelly-cheer', nudge: 'jelly-thinking'
  };

  var DEFAULTS = {
    activityId: 'position-memory',
    storageKey: null,          // 저장소 접두사. 비우면 activityId
    pool: [],
    rounds: [],
    showLabels: true,          // 그림 아래 낱말 보이기
    peekMs: 1500,              // 살짝 보기 시간
    modelMs: 2200,             // 자리 보여 주기 시간
    sound: true,
    restartButton: true,       // 끝 화면의 「처음부터 다시」
    credit: '',                // 끝 화면 아래 작은 출처 표시
    coachBase: 'assets/images/jelly/',   // 젤리코치 그림 폴더. false면 그림 없이 말풍선만
    coachExt: '.webp',
    texts: null,
    debug: false,
    onRoundEnd: null,
    onFinish: null
  };

  /* ───────────── 스타일 (한 번만 넣는다) ───────────── */
  var CSS = [
    '.pm-root,.pm-drag{--v9:#1b1462;--v8:#3b2a9e;--v7:#4a32c9;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v2:#d9cff5;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}',
    '.pm-root{container:pm / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.pm-root *,.pm-root *::before,.pm-root *::after,.pm-drag,.pm-drag *{box-sizing:border-box}',
    '.pm-root [hidden]{display:none!important}',

    /* 배치: 왼쪽 무대(정사각) + 오른쪽 칸 */
    '.pm-wrap{--arena:min(calc(100cqh - 24px),56cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    /* 무대 */
    '.pm-arena{position:relative;width:var(--arena);height:var(--arena);align-self:center;display:grid;place-items:center;overflow:hidden;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.pm-rays{position:absolute;left:50%;top:45%;width:1400px;height:1400px;margin:-700px 0 0 -700px;pointer-events:none;',
    'background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.05) 0 8deg,transparent 8deg 20deg);animation:pm-spin 90s linear infinite}',
    '.pm-sky{position:absolute;inset:0;pointer-events:none}',
    '.pm-sky b{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 8px #fff;animation:pm-twinkle 2.6s ease-in-out infinite}',
    '.pm-sky b:nth-child(1){left:3%;top:3%}.pm-sky b:nth-child(2){left:52%;top:1.5%;animation-delay:-.8s}',
    '.pm-sky b:nth-child(3){left:97%;top:6%;animation-delay:-1.5s}.pm-sky b:nth-child(4){left:2%;top:96%;animation-delay:-1.1s}',
    '.pm-sky b:nth-child(5){left:96%;top:97%;animation-delay:-2s}',
    '.pm-board{--n:3;position:relative;z-index:2;width:calc(100% - 28px);aspect-ratio:1/1;display:grid;gap:7px;',
    'grid-template-columns:repeat(var(--n),minmax(0,1fr));grid-template-rows:repeat(var(--n),minmax(0,1fr))}',
    '.pm-cell{position:relative;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;padding:4px;outline:none;',
    'border-radius:14px;background:rgba(255,255,255,.09);box-shadow:inset 0 0 0 2px rgba(255,255,255,.16);transition:background .15s,box-shadow .15s}',
    '.pm-root.is-placing .pm-cell{cursor:pointer}',
    '.pm-root.is-picking .pm-cell:not(.is-locked){background:rgba(255,210,63,.1);box-shadow:inset 0 0 0 2px rgba(255,210,63,.55)}',
    '.pm-cell.is-over{background:rgba(255,210,63,.3)!important;box-shadow:inset 0 0 0 3px var(--gold)!important}',
    '.pm-cell:focus-visible{box-shadow:inset 0 0 0 3px var(--gold)}',
    '.pm-cell.is-locked{background:rgba(61,220,151,.16);box-shadow:inset 0 0 0 2px rgba(61,220,151,.5)}',

    /* 카드: 바깥(옮기기·흔들기) / 안(뒤집기) / 앞·뒷면 */
    '.pm-card{container-type:size;position:relative;display:block;width:100%;height:100%;max-width:150px;max-height:150px;perspective:700px;outline:none;',
    'transition:transform .18s cubic-bezier(.3,1.5,.5,1),opacity .2s}',
    '.pm-flip{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.3,1.35,.5,1)}',
    '.pm-card.is-down .pm-flip{transform:rotateY(180deg)}',
    '.pm-face,.pm-back{position:absolute;inset:0;border-radius:14px;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden}',
    '.pm-face{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:9% 4% 7%;',
    'background:linear-gradient(180deg,#fff 0%,#fffaf0 100%);box-shadow:inset 0 0 0 2px #fff,inset 0 -5px 0 #efe6d2,0 4px 0 var(--v3),0 8px 14px rgba(10,4,50,.2)}',
    '.pm-face::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,var(--gold),var(--orange))}',
    '.pm-back{transform:rotateY(180deg);display:grid;place-items:center;',
    'background:radial-gradient(ellipse at 28% 12%,rgba(255,255,255,.45),transparent 42%),',
    'repeating-linear-gradient(45deg,rgba(255,255,255,.1) 0 5px,transparent 5px 14px),',
    'repeating-linear-gradient(-45deg,rgba(255,255,255,.1) 0 5px,transparent 5px 14px),linear-gradient(150deg,#8b72ff 0%,#5b48d6 50%,#3b2a9e 100%);',
    'box-shadow:inset 0 0 0 3px rgba(255,255,255,.75),inset 0 0 0 6px #4a32c9,inset 0 0 0 7px rgba(255,210,63,.6),0 4px 0 #231773}',
    '.pm-gem{display:grid;place-items:center;width:34cqmin;height:34cqmin;border-radius:50%;color:#3b2a9e;font-size:19cqmin;font-weight:900;font-style:normal;',
    'background:radial-gradient(circle at 35% 30%,#fff3b0,#ffd23f 55%,#e0a100);box-shadow:0 0 0 3px rgba(59,42,158,.55),0 0 14px rgba(255,210,63,.6)}',
    '.pm-img{width:62cqmin;height:62cqmin;object-fit:contain;pointer-events:none;-webkit-user-drag:none}',
    '.pm-pic{font-size:50cqmin;line-height:1}',
    '.pm-lab{font-size:clamp(11px,14.5cqmin,17px);font-weight:850;color:#2b2140;line-height:1.15;text-align:center;letter-spacing:-.02em}',
    '.pm-lab.is-only{font-size:clamp(14px,22cqmin,32px);font-weight:900}',
    '.pm-root.is-placing .pm-card:not(.is-locked){cursor:grab;touch-action:none}',
    '.pm-root.is-placing .pm-card:not(.is-locked):not(.is-picked):hover{transform:translateY(-3px) rotate(-1.5deg)}',
    '.pm-card.is-picked{transform:translateY(-5px) scale(1.05);z-index:3}',
    '.pm-card.is-picked .pm-face{box-shadow:inset 0 0 0 3px var(--gold),0 5px 0 var(--gold-d),0 0 18px rgba(255,210,63,.6)}',
    '.pm-card:focus-visible .pm-face{box-shadow:inset 0 0 0 3px #4bc9dc,0 4px 0 var(--v3)}',
    '.pm-card.is-locked .pm-face{background:linear-gradient(180deg,#eafff5,#d4f7e7);box-shadow:inset 0 0 0 3px var(--mint),0 4px 0 #9fdcc0}',
    '.pm-card.is-locked .pm-face::before{background:var(--mint)}',
    '.pm-card.is-locked .pm-face::after{content:"\\2713";position:absolute;right:8%;top:9%;color:var(--mint-d);font-size:clamp(11px,14cqmin,18px);font-weight:900}',
    '.pm-card.is-lifted{opacity:.25}',
    '.pm-card.pm-wob{animation:pm-wob .5s ease-in-out}',
    '.pm-drag{position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;font-family:var(--font)}',
    '.pm-drag .pm-face{box-shadow:inset 0 0 0 3px var(--gold),0 12px 22px rgba(10,4,50,.3)}',

    /* 도움으로 보여 주는 자리 */
    '.pm-hint{container-type:size;position:absolute;inset:4px;z-index:4;pointer-events:none;animation:pm-pop .25s ease-out}',
    '.pm-hint .pm-face{box-shadow:inset 0 0 0 3px var(--gold),0 0 20px rgba(255,210,63,.75);animation:pm-glow .7s ease-in-out infinite alternate}',

    /* 오른쪽 칸 */
    '.pm-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.pm-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.pm-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.pm-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.pm-dot{display:grid;width:28px;height:28px;padding:5px;gap:1.5px;border-radius:9px;background:var(--v1)}',
    '.pm-dot i{border-radius:1.5px;background:#c3b6ee}',
    '.pm-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold)}.pm-dot.is-now i{background:var(--gold-d)}',
    '.pm-dot.is-done{background:#d7f8e9}.pm-dot.is-done i{background:var(--mint-d)}',
    '.pm-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.pm-sound:active{transform:translateY(2px);box-shadow:0 1px 0 var(--v3)}',
    '.pm-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(56px,16cqh,76px)}',
    '.pm-coach-img{width:clamp(46px,14cqh,66px);height:clamp(46px,14cqh,66px);object-fit:contain}',
    '.pm-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.pm-bubble{margin:0;padding:10px 13px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4;color:var(--ink)}',
    '.pm-coach.is-temp .pm-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.pm-sand{height:14px;border-radius:99px;background:var(--v1);overflow:hidden;box-shadow:inset 0 1px 2px rgba(59,42,158,.12)}',
    '.pm-sand-fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--gold),var(--orange));transform-origin:left center}',
    '.pm-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.pm-info .pm-dot{width:clamp(56px,18cqh,84px);height:clamp(56px,18cqh,84px);padding:10px;gap:4px;border-radius:16px;margin-bottom:4px}',
    '.pm-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.pm-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.pm-tray{--tc:clamp(56px,min(19cqh,10.5cqw),96px);flex:1 1 auto;min-height:0;overflow:auto;display:flex;flex-wrap:wrap;align-content:flex-start;',
    'gap:10px;padding:10px;border-radius:16px;background:#f3effd;box-shadow:inset 0 0 0 2px #e6dffa}',
    '.pm-tray .pm-card{flex:none;width:var(--tc);height:var(--tc)}',
    '.pm-tray.is-wait .pm-card{opacity:.45}',
    '.pm-actions{margin-top:auto;display:flex;align-items:center;gap:8px;min-height:50px}',
    '.pm-tally{display:flex;flex-wrap:wrap;gap:5px;margin-right:auto}',
    '.pm-tally i{width:13px;height:13px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px var(--v3)}',
    '.pm-tally i.on{background:var(--v6);box-shadow:none}',
    '.pm-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.pm-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 20px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.pm-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.pm-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.pm-btn.is-soft:active{box-shadow:0 2px 0 var(--v3)}',
    '.pm-btn.is-call{animation:pm-call 1.1s ease-in-out infinite}',
    '.pm-btn:focus-visible,.pm-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    /* 끝 화면 */
    '.pm-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.pm-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.pm-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.pm-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.pm-end .pm-btns{margin:0;justify-content:center}',
    '.pm-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.pm-stamps .pm-dot{width:44px;height:44px;padding:8px;gap:2.5px;border-radius:12px}',
    '.pm-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.pm-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    /* 움직임 */
    '.pm-out{animation:pm-out .25s ease-in forwards}',
    '.pm-nudge{animation:pm-nudge .42s}',
    '.pm-bit{position:absolute;left:50%;top:50%;z-index:5;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:pm-bit .9s ease-out forwards}',
    '@keyframes pm-spin{to{transform:rotate(360deg)}}',
    '@keyframes pm-twinkle{0%,100%{opacity:.2;transform:scale(.5)}50%{opacity:1;transform:scale(1.25)}}',
    '@keyframes pm-out{to{opacity:0;transform:scale(.6)}}',
    '@keyframes pm-pop{from{transform:scale(.7)}}',
    '@keyframes pm-glow{to{box-shadow:inset 0 0 0 3px rgba(255,210,63,.45),0 0 6px rgba(255,210,63,.3)}}',
    '@keyframes pm-wob{20%{transform:rotate(-7deg) translateX(-5px)}45%{transform:rotate(6deg) translateX(5px)}70%{transform:rotate(-3deg)}}',
    '@keyframes pm-nudge{0%,100%{transform:none}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}',
    '@keyframes pm-call{50%{box-shadow:0 4px 0 #3b2a9e,0 0 0 6px rgba(255,210,63,.65)}}',
    '@keyframes pm-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    /* 세로로 긴 칸(휴대폰): 판 위, 받침 아래 */
    '@container pm (max-aspect-ratio:5/4){',
    '.pm-wrap{--arena:min(calc(100cqw - 24px),56cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.pm-side{width:100%}.pm-tray{--tc:clamp(56px,18cqw,84px)}}',

    '@media (prefers-reduced-motion:reduce){.pm-root *:not(.pm-sand-fill){animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('pm-style')) return;
    var s = document.createElement('style');
    s.id = 'pm-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ───────────── 작은 도구 ───────────── */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fill(t, n) { return String(t).replace('{n}', n); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  /* 칸 이름: 1-1(첫째 줄 첫째 칸) … n-n */
  function cellName(i, n) { return (Math.floor(i / n) + 1) + '-' + (i % n + 1); }
  function cellIndex(v, n) {
    if (typeof v === 'number') return v;
    var m = String(v).match(/^(\d+)\s*-\s*(\d+)$/);
    return m ? (+m[1] - 1) * n + (+m[2] - 1) : -1;
  }

  /* ───────────── 효과음 (단추를 누른 뒤에만 난다) ───────────── */
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
    place: function () { tones([523], 0.06, 'triangle', 0.14); },
    flip: function () { tones([880, 660], 0.04, 'sine', 0.05); },
    ok: function () { tones([659, 880], 0.09, 'sine', 0.14); },
    again: function () { tones([440, 392], 0.11, 'triangle', 0.1); },
    show: function () { tones([587, 698, 587], 0.08, 'sine', 0.08); },
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
    var POOL = {};
    o.pool.forEach(function (p) { POOL[p.key] = p; });
    var reduced = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var FLIP_MS = reduced ? 0 : 460;

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
    o.pool.forEach(function (p) { if (p.img) { var im = new Image(); im.src = p.img; } });

    /* 뼈대 */
    var root = h('div', 'pm-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'primary');
    root.innerHTML =
      '<div class="pm-wrap">' +
        '<div class="pm-arena">' +
          '<div class="pm-rays"></div><div class="pm-sky"><b></b><b></b><b></b><b></b><b></b></div>' +
          '<div class="pm-board" role="group" aria-label="그림판"></div>' +
        '</div>' +
        '<aside class="pm-side">' +
          '<div class="pm-top">' +
            '<span class="pm-title">' + esc(T.title) + '</span>' +
            '<ol class="pm-rounds" aria-label="판"></ol>' +
            '<button type="button" class="pm-sound" data-pm-act="sound"></button>' +
          '</div>' +
          '<div class="pm-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="pm-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="pm-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<div class="pm-sand" hidden><span class="pm-sand-fill"></span></div>' +
          '<div class="pm-info" hidden></div>' +
          '<div class="pm-tray" hidden></div>' +
          '<div class="pm-actions"><div class="pm-tally" hidden></div><div class="pm-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="pm-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="pm-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="pm-end-line"></p><div class="pm-stamps"></div><div class="pm-btns"></div>' +
        (o.credit ? '<p class="pm-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    /* 아동 식별코드 워터마크(온큐베이트가 넣어 줄 때만) */
    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'pm-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.pm-rounds'), elSound = $('.pm-sound'), elArena = $('.pm-arena'),
        elBoard = $('.pm-board'), elCoach = $('.pm-coach'), elCoachImg = $('.pm-coach-img'), elBubble = $('.pm-bubble'),
        elInfo = $('.pm-info'), elSand = $('.pm-sand'), elFill = $('.pm-sand-fill'), elTray = $('.pm-tray'), elTally = $('.pm-tally'),
        elActs = $('.pm-side .pm-btns'), elEnd = $('.pm-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    function miniGrid(n, cls) {
      var d = h('span', 'pm-dot ' + (cls || ''));
      d.style.gridTemplateColumns = 'repeat(' + n + ',1fr)';
      d.innerHTML = new Array(n * n + 1).join('<i></i>');
      return d;
    }

    /* 판 계획: 어떤 그림을 어느 칸에 */
    function plan(spec, idx) {
      var n = spec.grid === 4 ? 4 : 3, cells = n * n;
      var keys = spec.items ? spec.items.slice() : shuffle(o.pool.map(function (p) { return p.key; })).slice(0, spec.count || 4);
      keys = keys.filter(function (key) { return POOL[key]; }).slice(0, cells);
      var rest = shuffle(o.pool.map(function (p) { return p.key; }).filter(function (key) { return keys.indexOf(key) < 0; }));
      var extras = spec.extraItems ? spec.extraItems.filter(function (key) { return POOL[key] && keys.indexOf(key) < 0; })
                                   : rest.slice(0, spec.extra || 0);
      var spots;
      if (spec.layout && spec.layout.length === keys.length) {
        spots = spec.layout.map(function (v) { return cellIndex(v, n); });
      } else {
        spots = shuffle(range(cells)).slice(0, keys.length);
      }
      return {
        id: spec.id || ('r' + (idx + 1)),
        n: n,
        targets: keys.map(function (key, i) { return { key: key, cell: spots[i] }; }),
        extras: extras,
        lookSec: spec.lookSec || (n === 3 ? 30 : 60)
      };
    }

    var plans = [], R = null, ri = 0, results = [], timer = null, tempTimer = null;

    function setCoach(mood) {
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
    }
    function say(text, mood) {
      clearTimeout(tempTimer);
      elCoach.classList.remove('is-temp');
      R.sayText = text; R.sayMood = mood;
      elBubble.textContent = text;
      setCoach(mood);
    }
    function sayTemp(text) {
      clearTimeout(tempTimer);
      elCoach.classList.add('is-temp');
      elBubble.textContent = text;
      setCoach('nudge');
      tempTimer = setTimeout(function () {
        elCoach.classList.remove('is-temp');
        elBubble.textContent = R.sayText;
        setCoach(R.sayMood);
      }, 1800);
    }
    function nudge(el) {
      if (!el) return;
      el.classList.remove('pm-nudge');
      void el.offsetWidth;
      el.classList.add('pm-nudge');
    }
    function wob(card) {
      card.classList.remove('pm-wob');
      void card.offsetWidth;
      card.classList.add('pm-wob');
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'pm-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-pm-act', act);
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
        var li = h('li');
        var done = i < doneUpTo;
        li.appendChild(miniGrid(p.n, done ? 'is-done' : (i === ri ? 'is-now' : '')));
        li.setAttribute('aria-label', (i + 1) + '판' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }

    /* 오른쪽 빈자리 안내: 이번 판 크기 / 판 끝 */
    function showInfo(kind) {
      var p = R.p;
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var left = plans.length - ri - 1;
      elInfo.appendChild(miniGrid(p.n, kind === 'done' ? 'is-done' : 'is-now'));
      elInfo.appendChild(h('b', 'pm-info-big', esc(kind === 'done' ? fill(T.infoDone, ri + 1) : fill(T.infoGrid, p.n * p.n))));
      elInfo.appendChild(h('span', 'pm-info-small', esc(kind === 'done' ? (left ? fill(T.infoLeft, left) : T.infoLast)
                                                                       : fill(T.infoCount, p.targets.length))));
      elInfo.hidden = false;
    }

    function cardInner(key) {
      var p = POOL[key], pic = '';
      if (p.img) pic = '<img class="pm-img" src="' + esc(p.img) + '" alt="" draggable="false">';
      else if (p.emoji) pic = '<span class="pm-pic" aria-hidden="true">' + esc(p.emoji) + '</span>';
      var lab = (o.showLabels || !pic) ? '<span class="pm-lab' + (pic ? '' : ' is-only') + '">' + esc(p.label) + '</span>' : '';
      return pic + lab;
    }
    function makeCard(key, down) {
      var c = h('div', 'pm-card' + (down ? ' is-down' : ''),
        '<span class="pm-flip"><span class="pm-face">' + cardInner(key) + '</span>' +
        '<span class="pm-back" aria-hidden="true"><i class="pm-gem">?</i></span></span>');
      c.setAttribute('role', 'button');
      c.setAttribute('aria-label', POOL[key].label);
      c.tabIndex = 0;
      c.setAttribute('data-key', key);
      return c;
    }

    /* 카드를 다른 자리로 옮길 때 미끄러지듯 */
    function flip(card, parent) {
      var a = card.getBoundingClientRect();
      parent.appendChild(card);
      if (reduced) return;
      var b = card.getBoundingClientRect();
      if (!b.width || !a.width) return;
      card.style.transition = 'none';
      card.style.transformOrigin = '0 0';
      card.style.transform = 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ',' + (a.height / b.height) + ')';
      void card.offsetWidth;
      card.style.transition = 'transform .3s cubic-bezier(.2,.8,.2,1)';
      card.style.transform = '';
      setTimeout(function () { card.style.transition = ''; card.style.transformOrigin = ''; }, 330);
    }
    /* 뒷면으로 놓인 카드들을 차례로 앞면으로 */
    function turnUp(cards, gap) {
      cards.forEach(function (c, j) {
        setTimeout(function () { c.classList.remove('is-down'); }, 40 + j * (reduced ? 0 : gap));
      });
      if (cards.length) sfx('flip');
    }

    /* ── 한 판 시작 ── */
    function startRound(i) {
      ri = i;
      var p = plans[i];
      R = {
        p: p, phase: 'ready', pos: {}, at: {}, cards: {}, locked: {}, sel: null,
        checks: 0, peekUsed: false, modelUsed: false, supportUsed: false, wait: null, busy: false,
        acc: {}, sayText: '', sayMood: 'ready'
      };
      paintRounds(i);
      elBoard.style.setProperty('--n', p.n);
      elBoard.innerHTML = '';
      for (var c = 0; c < p.n * p.n; c++) {
        var cell = h('div', 'pm-cell');
        cell.setAttribute('role', 'button');
        cell.tabIndex = 0;
        cell.setAttribute('data-cell', c);
        cell.setAttribute('aria-label', (Math.floor(c / p.n) + 1) + '번째 줄 ' + (c % p.n + 1) + '번째 칸');
        elBoard.appendChild(cell);
      }
      elBoard.setAttribute('data-item-id', p.id);
      elTray.innerHTML = '';
      elTray.hidden = true; elTally.hidden = true; elSand.hidden = true;
      root.classList.remove('is-placing', 'is-picking');
      say(fill(T.ready, p.targets.length), 'ready');
      showInfo('ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    function cellEl(i) { return elBoard.children[i]; }

    /* ── 보기 ── */
    function startLook() {
      var p = R.p, cards = [];
      R.phase = 'look';
      R.tLook = now();
      p.targets.forEach(function (t) {
        var card = makeCard(t.key, true);
        card.tabIndex = -1;
        cellEl(t.cell).appendChild(card);
        cards.push(card);
      });
      turnUp(cards, 70);
      say(T.look, 'look');
      elSand.hidden = false;
      elFill.style.transition = 'none';
      elFill.style.transform = 'scaleX(1)';
      void elFill.offsetWidth;
      elFill.style.transition = 'transform ' + p.lookSec + 's linear';
      elFill.style.transform = 'scaleX(0)';
      setActions([button('✋ ' + esc(T.lookDone), 'lookDone')]);
      timer = setTimeout(function () { endLook('timer'); }, p.lookSec * 1000);
    }

    function endLook(by) {
      if (R.phase !== 'look') return;
      clearTimeout(timer);
      R.phase = 'hide';
      R.lookMs = Math.round(now() - R.tLook);
      R.lookBy = by;
      elSand.hidden = true;
      setActions([]);
      var cards = elBoard.querySelectorAll('.pm-card');
      each(cards, function (c) { c.classList.add('is-down'); });
      sfx('flip');
      setTimeout(function () {
        each(cards, function (c) { c.classList.add('pm-out'); });
        setTimeout(startPlace, reduced ? 0 : 240);
      }, FLIP_MS);
    }

    /* ── 놓기 ── */
    function startPlace() {
      var p = R.p, list = [];
      each(elBoard.querySelectorAll('.pm-card'), function (c) { c.remove(); });
      var keys = shuffle(p.targets.map(function (t) { return t.key; }).concat(p.extras));
      showInfo(null);
      elTray.hidden = false;
      elTally.hidden = false;
      keys.forEach(function (key, j) {
        var card = makeCard(key, true);
        card.style.order = j;
        R.cards[key] = card;
        R.at[key] = null;
        elTray.appendChild(card);
        list.push(card);
      });
      turnUp(list, 80);
      root.classList.add('is-placing');
      R.phase = 'place';
      R.tPlace = now();
      say(p.extras.length ? T.placeExtra : T.place, 'place');
      refresh();
      log('game-item-ready', {
        itemId: p.id, grid: p.n + 'x' + p.n, targets: p.targets.length, extras: p.extras.length,
        lookSec: p.lookSec, lookMs: R.lookMs, lookEndedBy: R.lookBy,
        layout: p.targets.map(function (t) { return POOL[t.key].label + '@' + cellName(t.cell, p.n); }).join('|'),
        engine: 'position-memory@' + VERSION
      });
    }

    function onBoard() {
      var n = 0;
      for (var key in R.at) if (R.at[key] != null) n++;
      return n;
    }

    /* 확인 단추·점 표시를 지금 놓인 상태에 맞춘다 */
    function refresh() {
      var p = R.p, n = onBoard(), need = p.targets.length;
      elTally.innerHTML = '';
      for (var i = 0; i < need; i++) elTally.appendChild(h('i', i < n ? 'on' : ''));
      elTray.classList.toggle('is-wait', !!R.wait);
      if (R.wait) return;
      if (n === need) {
        var all = p.targets.every(function (t) { return R.at[t.key] === t.cell; });
        var resp = p.targets.concat(p.extras.map(function (key) { return { key: key }; }))
          .filter(function (t) { return R.at[t.key] != null; })
          .map(function (t) { return POOL[t.key].label + '@' + cellName(R.at[t.key], p.n); });
        var b = button('✔ ' + esc(T.check), 'check', false, {
          'data-track': 'answer',
          'data-item-id': p.id,
          'data-correct': all ? 'true' : 'false',
          'data-response': resp.join('|')
        });
        setActions(peekButton() ? [peekButton(), b] : [b]);
      } else {
        setActions(peekButton() ? [peekButton()] : []);
      }
    }
    var peekBtn = null;
    function peekButton() {
      if (R.checks !== 1 || R.peekUsed) return null;
      if (!peekBtn || peekBtn.getAttribute('data-item-id') !== R.p.id) {
        peekBtn = button('👀 ' + esc(T.peek), 'peek', true, {
          'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': 'child-request', 'data-item-id': R.p.id
        });
      }
      return peekBtn;
    }

    function select(key) {
      if (R.sel) R.cards[R.sel].classList.remove('is-picked');
      R.sel = key;
      R.cards[key].classList.add('is-picked');
      root.classList.add('is-picking');
      sfx('pick');
    }
    function deselect() {
      if (R.sel) R.cards[R.sel].classList.remove('is-picked');
      R.sel = null;
      root.classList.remove('is-picking');
    }
    function moveTo(key, cell) {
      var from = R.at[key];
      if (from != null) delete R.pos[from];
      R.at[key] = cell;
      R.pos[cell] = key;
      flip(R.cards[key], cellEl(cell));
    }
    function toTray(key) {
      var from = R.at[key];
      if (from != null) delete R.pos[from];
      R.at[key] = null;
      flip(R.cards[key], elTray);
    }
    function place(key, cell) {
      var occ = R.pos[cell];
      if (occ === key) { deselect(); return; }
      var from = R.at[key];
      if (occ != null) {
        if (from != null) moveTo(occ, from);   // 판 위에서 옮기면 서로 자리 바꾸기
        else toTray(occ);
      }
      moveTo(key, cell);
      deselect();
      sfx('place');
      refresh();
    }
    function lock(key) {
      R.locked[key] = true;
      var card = R.cards[key];
      card.classList.add('is-locked');
      card.tabIndex = -1;
      cellEl(R.at[key]).classList.add('is-locked');
    }

    /* 도움 자리 보여 주기(살짝 보기·자리 보여 줘) */
    function showSpots(ms, done) {
      var p = R.p, hints = [];
      R.busy = true;
      deselect();
      p.targets.forEach(function (t) {
        if (R.locked[t.key]) return;
        var hint = h('div', 'pm-hint', '<span class="pm-face">' + cardInner(t.key) + '</span>');
        cellEl(t.cell).appendChild(hint);
        hints.push(hint);
      });
      sfx('show');
      setTimeout(function () {
        hints.forEach(function (x) { x.remove(); });
        R.busy = false;
        if (done) done();
      }, ms);
    }

    /* ── 확인 ── */
    function check() {
      var p = R.p, ms = Math.round(now() - R.tPlace), back = [], newOk = 0;
      R.checks++;
      deselect();
      p.targets.forEach(function (t) {
        if (R.locked[t.key]) return;
        var c = R.at[t.key], ok = c === t.cell;
        var acc = '';
        if (ok) {
          acc = R.checks === 1 ? 'accurate' : (R.checks === 2 && !R.peekUsed ? 'self-corrected' : 'support');
          R.acc[t.key] = acc;
          newOk++;
        }
        log('game-response', {
          itemId: p.id + '-' + t.key, label: POOL[t.key].label, correct: ok,
          response: c == null ? '' : cellName(c, p.n), expected: cellName(t.cell, p.n),
          attempt: R.checks, errorType: ok ? '' : (c == null ? 'omission' : 'position'),
          accuracy: acc, responseMs: ms
        });
        if (ok) lock(t.key); else if (c != null) back.push(t.key);
      });
      p.extras.forEach(function (key) {
        var c = R.at[key];
        if (c == null) return;
        log('game-response', {
          itemId: p.id + '-' + key, label: POOL[key].label, correct: false,
          response: cellName(c, p.n), expected: '', attempt: R.checks, errorType: 'intrusion', responseMs: ms
        });
        back.push(key);
      });
      var left = p.targets.filter(function (t) { return !R.locked[t.key]; }).length;
      if (!left) { sfx('ok'); roundDone(); return; }

      R.busy = true;
      setActions([]);
      if (newOk) sfx('ok'); else sfx('again');
      back.forEach(function (key) { wob(R.cards[key]); });
      setTimeout(function () {
        back.forEach(toTray);
        R.busy = false;
        var lockedN = p.targets.length - left;
        if (R.checks === 1) {
          say(lockedN ? fill(T.retry, lockedN) : T.retryZero, 'retry');
        } else if (R.checks === 2) {
          R.wait = 'model';
          say(T.model, 'help');
        } else {
          R.wait = 'support';
          say(T.support, 'help');
        }
        refresh();
        if (R.wait === 'model') {
          setActions([button('👀 ' + esc(T.modelBtn), 'model', false, {
            'data-track': 'hint', 'data-help-level': 'A3', 'data-help-type': 'model',
            'data-help-trigger': 'second-miss', 'data-item-id': p.id, 'class': 'pm-btn is-call'
          })]);
        } else if (R.wait === 'support') {
          setActions([button('🤝 ' + esc(T.supportBtn), 'support', false, {
            'data-track': 'hint', 'data-help-level': 'A4', 'data-help-type': 'answer',
            'data-help-trigger': 'third-miss', 'data-item-id': p.id, 'class': 'pm-btn is-call'
          })]);
        }
      }, reduced ? 0 : 520);
    }

    function doModel() {
      R.modelUsed = true;
      setActions([]);
      showSpots(o.modelMs, function () {
        R.wait = null;
        say(T.afterModel, 'place');
        refresh();
      });
    }

    function doSupport() {
      var p = R.p;
      R.supportUsed = true;
      R.wait = null;
      setActions([]);
      R.busy = true;
      var j = 0;
      p.targets.forEach(function (t) {
        if (R.locked[t.key]) return;
        setTimeout(function () {
          var occ = R.pos[t.cell];
          if (occ != null && occ !== t.key) toTray(occ);
          moveTo(t.key, t.cell);
          R.acc[t.key] = 'support';
          lock(t.key);
          sfx('place');
        }, j++ * 280);
      });
      setTimeout(function () { R.busy = false; roundDone(); }, j * 280 + 380);
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#ff9f43', '#4bc9dc', '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'pm-bit');
        var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 120;
        b.style.background = colors[i % colors.length];
        b.style.setProperty('--dx', 'calc(-50% + ' + Math.round(Math.cos(ang) * dist) + 'px)');
        b.style.setProperty('--dy', 'calc(-50% + ' + Math.round(Math.sin(ang) * dist) + 'px)');
        b.style.setProperty('--r', Math.round(Math.random() * 540) + 'deg');
        elArena.appendChild(b);
        setTimeout(function (x) { return function () { x.remove(); }; }(b), 1000);
      }
    }

    /* ── 판 끝 ── */
    function roundDone() {
      var p = R.p;
      R.phase = 'done';
      deselect();
      root.classList.remove('is-placing');
      elTally.hidden = true;
      elTray.hidden = true;
      sfx('done');
      burst();
      var count = { accurate: 0, 'self-corrected': 0, support: 0 };
      p.targets.forEach(function (t) { count[R.acc[t.key]] = (count[R.acc[t.key]] || 0) + 1; });
      var summary = {
        itemId: p.id, grid: p.n + 'x' + p.n, targets: p.targets.length, extras: p.extras.length,
        checks: R.checks, accurate: count.accurate, selfCorrected: count['self-corrected'], support: count.support,
        peekUsed: R.peekUsed, modelUsed: R.modelUsed, supportUsed: R.supportUsed,
        lookMs: R.lookMs, lookEndedBy: R.lookBy, placeMs: Math.round(now() - R.tPlace),
        accuracyList: p.targets.map(function (t) { return POOL[t.key].label + ':' + R.acc[t.key]; }).join('|')
      };
      results.push(summary);
      log('game-item-complete', summary);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(summary); } catch (e) {} }
      say(T.allDone, 'done');
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
      elEnd.querySelector('.pm-end-line').textContent = fill(T.endLine, plans.length);
      var st = elEnd.querySelector('.pm-stamps');
      st.innerHTML = '';
      plans.forEach(function (p) { st.appendChild(miniGrid(p.n, 'is-done')); });
      var acts = elEnd.querySelector('.pm-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      log('game-activity-complete', {
        rounds: plans.length,
        checksTotal: results.reduce(function (s, r) { return s + r.checks; }, 0),
        accurate: results.reduce(function (s, r) { return s + r.accurate; }, 0),
        selfCorrected: results.reduce(function (s, r) { return s + r.selfCorrected; }, 0),
        support: results.reduce(function (s, r) { return s + r.support; }, 0)
      });
      if (typeof o.onFinish === 'function') { try { o.onFinish(results.slice()); } catch (e) {} }
    }

    function restart() {
      clearTimeout(timer);
      plans = o.rounds.map(plan);
      results = [];
      elEnd.hidden = true;
      startRound(0);
    }

    /* ───── 입력 ───── */
    function act(name) {
      if (name === 'sound') {
        soundOn = !soundOn;
        try { sessionStorage.setItem(storeKey + 'sound', soundOn ? '1' : '0'); } catch (e) {}
        paintSound();
        sfx('pick');
        return;
      }
      if (name === 'restart') { restart(); return; }
      if (R.busy) return;
      if (name === 'start' && R.phase === 'ready') { setActions([]); startLook(); }
      else if (name === 'lookDone') endLook('child');
      else if (name === 'check' && R.phase === 'place' && !R.wait) check();
      else if (name === 'peek' && R.phase === 'place') {
        R.peekUsed = true;
        refresh();
        showSpots(o.peekMs);
      }
      else if (name === 'model' && R.wait === 'model') doModel();
      else if (name === 'support' && R.wait === 'support') doSupport();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    var drag = null, eatClick = false;

    function onClick(e) {
      if (eatClick) { eatClick = false; return; }
      var b = e.target.closest('[data-pm-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-pm-act')); return; }
      if (!R || R.phase !== 'place' || R.busy) return;
      var cell = e.target.closest('.pm-cell'), card = e.target.closest('.pm-card'), tray = e.target.closest('.pm-tray');
      if (R.wait) {
        if (cell || card) { sayTemp(R.wait === 'model' ? T.waitModel : T.waitSupport); nudge(elActs.firstChild); }
        return;
      }
      if (cell) {
        var idx = +cell.getAttribute('data-cell'), occ = R.pos[idx];
        if (occ != null && R.locked[occ]) { wob(R.cards[occ]); return; }
        if (R.sel) { place(R.sel, idx); return; }
        if (occ != null) { select(occ); return; }
        sayTemp(T.pickFirst);
        nudge(elTray);
        return;
      }
      if (card) {
        var key = card.getAttribute('data-key');
        if (R.sel === key) deselect(); else select(key);
        return;
      }
      if (tray && R.sel && R.at[R.sel] != null) {
        var k2 = R.sel;
        deselect();
        toTray(k2);
        sfx('place');
        refresh();
      }
    }

    function onKey(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target;
      if (t.getAttribute && t.getAttribute('role') === 'button' && t.tagName !== 'BUTTON') {
        e.preventDefault();
        t.click();
      }
    }

    function onDown(e) {
      if (!R || R.phase !== 'place' || R.busy || R.wait) return;
      if (e.button) return;
      var card = e.target.closest('.pm-card');
      if (!card || !root.contains(card)) return;
      var key = card.getAttribute('data-key');
      if (!key || R.locked[key]) return;
      drag = { key: key, card: card, x: e.clientX, y: e.clientY, id: e.pointerId, on: false, ghost: null, over: null };
    }
    function dropTarget(x, y) {
      var el = document.elementFromPoint(x, y);
      if (!el || !root.contains(el)) return null;
      return el.closest('.pm-cell') || el.closest('.pm-tray');
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (dx * dx + dy * dy < 64) return;
        drag.on = true;
        deselect();
        var r = drag.card.getBoundingClientRect(), size = Math.max(64, Math.min(110, r.width));
        drag.ghost = drag.card.cloneNode(true);
        drag.ghost.className = 'pm-card pm-drag';
        drag.ghost.style.cssText = 'width:' + size + 'px;height:' + size + 'px;margin:' + (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px;transform:scale(1.06)';
        document.body.appendChild(drag.ghost);
        drag.card.classList.add('is-lifted');
        sfx('pick');
      }
      e.preventDefault();
      drag.ghost.style.left = e.clientX + 'px';
      drag.ghost.style.top = e.clientY + 'px';
      var t = dropTarget(e.clientX, e.clientY);
      var over = t && t.classList.contains('pm-cell') && !t.classList.contains('is-locked') ? t : null;
      if (over !== drag.over) {
        if (drag.over) drag.over.classList.remove('is-over');
        if (over) over.classList.add('is-over');
        drag.over = over;
      }
    }
    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      if (!d.on) return;
      eatClick = true;
      setTimeout(function () { eatClick = false; }, 60);
      if (d.over) d.over.classList.remove('is-over');
      d.ghost.remove();
      d.card.classList.remove('is-lifted');
      if (e.type === 'pointercancel') return;
      var t = dropTarget(e.clientX, e.clientY);
      if (t && t.classList.contains('pm-cell')) {
        var idx = +t.getAttribute('data-cell'), occ = R.pos[idx];
        if (occ != null && R.locked[occ]) { wob(R.cards[occ]); return; }
        place(d.key, idx);
      } else if (R.at[d.key] != null) {
        toTray(d.key);
        sfx('place');
        refresh();
      }
    }

    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    root.addEventListener('pointerdown', onDown);
    global.addEventListener('pointermove', onMove, { passive: false });
    global.addEventListener('pointerup', onUp);
    global.addEventListener('pointercancel', onUp);

    restart();

    return {
      root: root,
      restart: restart,
      results: function () { return results.slice(); },
      destroy: function () {
        clearTimeout(timer);
        global.removeEventListener('pointermove', onMove);
        global.removeEventListener('pointerup', onUp);
        global.removeEventListener('pointercancel', onUp);
        root.remove();
      }
    };
  }

  global.PositionMemory = { version: VERSION, mount: mount };
})(window);
