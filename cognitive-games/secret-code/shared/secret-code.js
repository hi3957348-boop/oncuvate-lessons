/*!
 * 「암호 풀기」 한글 암호 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 4장 집행력 「암호 풀기 1~2 · 암호문 만들기 1~2」(143~146쪽)
 *            (자음은 숫자, 모음은 기호로 바꾼 규칙표를 보고 암호를 풀거나 만들기) — 활동 방식만 가져왔다. 기호는 새로 정했다.
 *
 * 왼쪽 보라 무대 = 암호표(칸마다 기호 + 글자). 이 표가 곧 누르는 자판이다.
 *   풀기(decode): 오른쪽 암호 줄에서 금색 기호를 표에서 찾아 누르면 그 글자가 들어가고 글자가 조립된다 → 낱말 + 그림.
 *   만들기(encode): 낱말과 그림이 보이고, 금색 칸에 들어갈 글자(자모)를 표에서 찾아 누르면 기호가 들어간다.
 *   누르는 순간 판정. 어긋나면 1번째 = 칸이 흔들림 / 같은 자리 2번째 = 맞는 칸이 금색으로 반짝(A4).
 *   도움(아이가 고름, A2): 풀기 = 「줄 보기」 찾을 기호가 자음 줄인지 모음 줄인지 밝혀 줌 / 만들기 = 「글자 나누기」 지금 글자를 자모로 나눠 보여 줌.
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 표 칸       data-track="answer" + data-item-id(문제-자리) + data-correct + data-response + (맞는 칸) data-accuracy
 *   - 도움        data-track="hint" data-help-level="A2"
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '암호 풀기',
    titleEncode: '암호 만들기',
    readyDecode: '자음은 숫자, 모음은 모양으로 바꾼 암호예요. 표를 보고 암호를 풀어요.',
    readyEncode: '이번에는 거꾸로! 낱말을 암호로 바꿔요.',
    start: '시작',
    askDecode: '금색 기호를 표에서 찾아 눌러요.',
    askEncode: '금색 칸에 들어갈 글자를 표에서 찾아 눌러요.',
    miss: '다시 찾아봐요.',
    cue: '반짝이는 칸을 눌러요.',
    hintDecode: '줄 보기',
    hintEncode: '글자 나누기',
    hintedDecode: '빛나는 줄에서 찾아봐요.',
    hintedEncode: '글자를 나눠 봤어요. 차례대로 찾아봐요.',
    solved: '{w}! 암호를 풀었어요.',
    made: '「{w}」 암호를 만들었어요!',
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

  /* 한글 자모 */
  var LS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  var VS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  var TS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  /* 자음 번호(책처럼 ㄱ=1 … ㅎ=14) · 모음 기호(새로 정함) */
  var CONS = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ';
  var VSYM = {
    'ㅏ': 'star', 'ㅑ': 'heart', 'ㅓ': 'tri', 'ㅕ': 'square', 'ㅗ': 'circle',
    'ㅛ': 'diamond', 'ㅜ': 'plus', 'ㅠ': 'hex', 'ㅡ': 'bar', 'ㅣ': 'moon'
  };
  var SHAPE = {
    star: '<polygon points="20,4 24.7,14.6 36,15.5 27.4,23 30,34 20,28.2 10,34 12.6,23 4,15.5 15.3,14.6" fill="#f59e0b"/>',
    heart: '<path d="M20 34C8 25 4 19 4 13.5 4 8.8 7.8 5 12.3 5c3.4 0 6.1 1.9 7.7 4.6C21.6 6.9 24.3 5 27.7 5 32.2 5 36 8.8 36 13.5 36 19 32 25 20 34Z" fill="#ef476f"/>',
    tri: '<polygon points="20,5 36,33 4,33" fill="#3a86ff"/>',
    square: '<rect x="7" y="7" width="26" height="26" rx="4" fill="#16a06a"/>',
    circle: '<circle cx="20" cy="20" r="14" fill="#8b5cf6"/>',
    diamond: '<polygon points="20,3 36,20 20,37 4,20" fill="#ec4899"/>',
    plus: '<path d="M15 5h10v10h10v10H25v10H15V25H5V15h10Z" fill="#0ea5e9"/>',
    hex: '<polygon points="20,4 34,12 34,28 20,36 6,28 6,12" fill="#f97316"/>',
    bar: '<rect x="4" y="15" width="32" height="10" rx="5" fill="#14b8a6"/>',
    moon: '<path d="M26 4a16 16 0 1 0 10 25A13 13 0 0 1 26 4Z" fill="#eab308"/>'
  };

  function splitSyl(ch) {
    var c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c > 11171) return null;
    var t = c % 28, v = Math.floor(c / 28) % 21, l = Math.floor(c / 588);
    var out = [LS.charAt(l), VS.charAt(v)];
    if (t) out.push(TS[t]);
    return out;
  }
  /* 자모 1~3개로 글자 하나 (아직 다 안 찼으면 있는 만큼) */
  function joinSyl(parts) {
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0];
    var l = LS.indexOf(parts[0]), v = VS.indexOf(parts[1]), t = parts[2] ? TS.indexOf(parts[2]) : 0;
    if (l < 0 || v < 0 || t < 0) return parts.join('');
    return String.fromCharCode(0xac00 + (l * 21 + v) * 28 + t);
  }

  var DEFAULTS = {
    activityId: 'secret-code',
    storageKey: null,
    rounds: [],                // [ { id, mode:'decode'|'encode', consonants:'ㄱㄴ…', vowels:'ㅏㅗ…', words:[{word, icon}], count } ]
    nextMs: 1800,
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
    '.sc-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--mint:#3ddc97;--mint-d:#16a06a;--cyan-bg:#e9f8fa;--cream:#fff8e8;',
    '--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:sc / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.sc-root *,.sc-root *::before,.sc-root *::after{box-sizing:border-box}',
    '.sc-root [hidden]{display:none!important}',
    '.sc-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    '.sc-arena{container:scarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'border-radius:18px;background:radial-gradient(circle at 50% 42%,#5b48d6 0%,#3b2a9e 48%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.sc-table{--cols:4;--rows:4;position:absolute;inset:0;padding:3cqmin;display:grid;gap:2cqmin;',
    'grid-template-columns:repeat(var(--cols),minmax(0,1fr));grid-template-rows:repeat(var(--rows),minmax(0,1fr))}',
    '.sc-cell{position:relative;min-width:0;min-height:0;border:0;margin:0;padding:6% 4%;border-radius:12px;font:inherit;color:var(--ink);cursor:pointer;',
    'background:var(--cream);box-shadow:0 4px 0 #d9cfa8;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;transition:transform .12s,box-shadow .2s,opacity .2s}',
    '.sc-cell.is-v{background:#fff0f5;box-shadow:0 4px 0 #efc3d3}',
    '.sc-cell:active{transform:translateY(3px)}',
    '.sc-cell:focus-visible{outline:4px solid rgba(75,201,220,.8);outline-offset:2px}',
    '.sc-sym{display:grid;place-items:center;width:52%;aspect-ratio:1;max-height:52%}',
    '.sc-sym svg{width:100%;height:100%;display:block}',
    '.sc-num{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;border:2px solid #5b48d6;color:#3b2a9e;background:#fff;',
    'font-weight:900;font-size:calc(var(--sz,40px) * .5);line-height:1}',
    '.sc-jamo{font-size:clamp(14px,calc(var(--cell,60px) * .26),26px);font-weight:900;line-height:1;color:#27344e}',
    '.sc-table.is-dim .sc-cell:not(.is-group){opacity:.35}',
    '.sc-cell.is-group{box-shadow:0 4px 0 #d9cfa8,0 0 0 3px #4bc9dc}',
    '.sc-cell.is-cue{animation:sc-cue 1s ease-in-out infinite}',
    '.sc-cell.is-shake{animation:sc-shake .4s}',
    '.sc-cell.is-hit{background:#effff7;box-shadow:0 4px 0 #a8dcc4,0 0 0 3px var(--mint)}',
    '.sc-off .sc-cell{cursor:default}',

    '.sc-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.sc-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.sc-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.sc-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.sc-dot{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 8px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900;white-space:nowrap}',
    '.sc-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.sc-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.sc-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.sc-coach{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;min-height:clamp(52px,15cqh,72px)}',
    '.sc-coach-img{width:clamp(44px,13cqh,62px);height:clamp(44px,13cqh,62px);object-fit:contain}',
    '.sc-coach.no-img{grid-template-columns:minmax(0,1fr)}',
    '.sc-bubble{margin:0;padding:9px 12px;border:1px solid rgba(44,183,203,.3);border-radius:6px 16px 16px 16px;background:var(--cyan-bg);',
    'font-size:clamp(14px,3.8cqh,17px);font-weight:800;line-height:1.4}',
    '.sc-coach.is-temp .sc-bubble{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.sc-coach.is-good .sc-bubble{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.sc-steps{list-style:none;margin:0;padding:0;display:flex;justify-content:center;gap:7px}',
    '.sc-steps li{width:14px;height:14px;border-radius:50%;background:var(--v1);box-shadow:inset 0 0 0 2px var(--v3)}',
    '.sc-steps li.is-now{background:#fff6d6;box-shadow:inset 0 0 0 3px var(--gold)}',
    '.sc-steps li.is-done{background:var(--mint);box-shadow:none}',

    '.sc-board{container:scboard / size;flex:1 1 auto;min-height:0;position:relative;border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.sc-board-in{position:absolute;inset:0;padding:8px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4cqh}',
    '.sc-pic{font-size:min(30cqh,64px);line-height:1}',
    '.sc-word{font-size:min(20cqh,40px);font-weight:900;letter-spacing:.06em;color:var(--v8);line-height:1.1}',
    '.sc-code{display:flex;flex-wrap:wrap;justify-content:center;gap:3cqw}',
    '.sc-syl{display:flex;flex-direction:column;align-items:center;gap:1.5cqh;padding:1.5cqh 1.2cqw;border-radius:12px;background:#fff;box-shadow:0 3px 0 var(--v3)}',
    '.sc-syl.is-now{box-shadow:0 3px 0 var(--v3),0 0 0 3px var(--gold)}',
    '.sc-syl.is-done{box-shadow:0 3px 0 #a8dcc4,0 0 0 3px var(--mint)}',
    '.sc-slots{display:flex;gap:4px}',
    '.sc-slot{--sz:min(16cqh,8.5cqw,44px);width:var(--sz);height:var(--sz);border-radius:9px;display:grid;place-items:center;background:var(--v05);box-shadow:inset 0 0 0 2px var(--v1)}',
    '.sc-slot .sc-sym{width:86%;max-height:86%}',
    '.sc-slot.is-now{box-shadow:inset 0 0 0 3px var(--gold);background:#fff6d6}',
    '.sc-slot.is-now .sc-sym{animation:sc-bob 1s ease-in-out infinite}',
    '.sc-slot .sc-j{font-size:calc(var(--sz) * .55);font-weight:900;color:#27344e}',
    '.sc-out{min-height:calc(min(16cqh,8.5cqw,44px) * 1.1);font-size:min(16cqh,8.5cqw,44px);font-weight:900;color:var(--v8);line-height:1.1}',
    '.sc-parts{font-size:min(9cqh,18px);font-weight:800;color:#2a8fa0;letter-spacing:.1em}',
    '.sc-info-icon{font-size:clamp(28px,24cqh,44px);line-height:1}',
    '.sc-info-big{font-size:clamp(18px,15cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.sc-info-small{font-size:clamp(13px,10cqh,16px);font-weight:700;color:var(--muted);text-align:center}',

    '.sc-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.sc-left{display:flex;gap:8px;margin-right:auto}',
    '.sc-btns{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}',
    '.sc-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 16px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.sc-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.sc-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.sc-btn:focus-visible,.sc-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    '.sc-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.sc-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.sc-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.sc-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.sc-end .sc-btns{margin:0;justify-content:center}',
    '.sc-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.sc-stamps .sc-dot{height:40px;padding:0 12px;border-radius:12px;font-size:15px}',
    '.sc-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.sc-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '@keyframes sc-cue{50%{box-shadow:0 4px 0 #d9cfa8,0 0 0 5px var(--gold),0 0 20px rgba(255,210,63,.85)}}',
    '@keyframes sc-shake{20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}',
    '@keyframes sc-bob{50%{transform:scale(1.12)}}',
    '@keyframes sc-pop{from{transform:scale(.5)}}',
    '.sc-pop{animation:sc-pop .4s cubic-bezier(.3,1.5,.5,1)}',

    '@container sc (max-aspect-ratio:5/4){',
    '.sc-wrap{--arena:min(calc(100cqw - 24px),50cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.sc-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.sc-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('sc-style')) return;
    var s = document.createElement('style');
    s.id = 'sc-style';
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
  function isCons(j) { return CONS.indexOf(j) >= 0; }
  /* 기호 그리기: 자음은 동그라미 번호, 모음은 모양 */
  function symHtml(j) {
    if (isCons(j)) return '<span class="sc-sym"><span class="sc-num">' + (CONS.indexOf(j) + 1) + '</span></span>';
    var sh = VSYM[j];
    return '<span class="sc-sym"><svg viewBox="0 0 40 40" aria-hidden="true">' + (SHAPE[sh] || '') + '</svg></span>';
  }
  function symName(j) {
    return isCons(j) ? (CONS.indexOf(j) + 1) + '번' : ({ star: '별', heart: '하트', tri: '세모', square: '네모', circle: '동그라미', diamond: '마름모', plus: '더하기', hex: '육각형', bar: '막대', moon: '달' })[VSYM[j]];
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
    hit: function () { tones([880], 0.06, 'sine', 0.1); },
    syl: function () { tones([659, 988], 0.07, 'sine', 0.12); },
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

    var root = h('div', 'sc-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'primary');
    root.innerHTML =
      '<div class="sc-wrap">' +
        '<div class="sc-arena sc-off"><div class="sc-table" role="group" aria-label="암호표"></div></div>' +
        '<aside class="sc-side">' +
          '<div class="sc-top">' +
            '<span class="sc-title">' + esc(T.title) + '</span>' +
            '<ol class="sc-rounds" aria-label="판"></ol>' +
            '<button type="button" class="sc-sound" data-sc-act="sound"></button>' +
          '</div>' +
          '<div class="sc-coach' + (o.coachBase ? '' : ' no-img') + '">' +
            (o.coachBase ? '<img class="sc-coach-img" alt="" aria-hidden="true">' : '') +
            '<p class="sc-bubble" aria-live="polite"></p>' +
          '</div>' +
          '<ol class="sc-steps" aria-label="문제"></ol>' +
          '<div class="sc-board"><div class="sc-board-in"></div></div>' +
          '<div class="sc-actions"><div class="sc-left"></div><div class="sc-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="sc-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.coachBase ? '<img class="sc-end-img" alt="" aria-hidden="true" src="' + esc(coachSrc('end')) + '">' : '') +
        '<h2></h2><p class="sc-end-line"></p><div class="sc-stamps"></div><div class="sc-btns"></div>' +
        (o.credit ? '<p class="sc-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'sc-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.sc-rounds'), elSound = $('.sc-sound'), elTitle = $('.sc-title'), elArena = $('.sc-arena'), elTable = $('.sc-table'),
        elCoach = $('.sc-coach'), elCoachImg = $('.sc-coach-img'), elBubble = $('.sc-bubble'), elSteps = $('.sc-steps'),
        elBoard = $('.sc-board-in'), elLeft = $('.sc-left'), elActs = $('.sc-side .sc-btns'), elEnd = $('.sc-end');

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
      elCoach.className = 'sc-coach' + (o.coachBase ? '' : ' no-img') + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      if (elCoachImg) elCoachImg.src = coachSrc(mood);
      if (!cls) { R.sayText = text; R.sayMood = mood; }
    }
    function sayTemp(text, mood) {
      say(text, mood, 'is-temp');
      tempTimer = setTimeout(function () { say(R.sayText, R.sayMood); }, 1500);
    }
    function button(label, act, soft, attrs) {
      var b = h('button', 'sc-btn' + (soft ? ' is-soft' : ''), label);
      b.type = 'button';
      b.setAttribute('data-sc-act', act);
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
        var li = h('li', 'sc-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), (i + 1) + '판');
        li.setAttribute('aria-label', (i + 1) + '판' + (r.mode === 'encode' ? ' 암호 만들기' : ' 암호 풀기') + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function paintSteps() {
      elSteps.innerHTML = '';
      R.r.words.forEach(function (w, i) {
        elSteps.appendChild(h('li', i < R.qi ? 'is-done' : (i === R.qi && R.phase !== 'ready' && R.phase !== 'round-done' ? 'is-now' : '')));
      });
    }
    function boardInfo(icon, big, small) {
      elBoard.innerHTML = '';
      elBoard.appendChild(h('span', 'sc-info-icon', icon));
      elBoard.appendChild(h('b', 'sc-info-big', esc(big)));
      if (small) elBoard.appendChild(h('span', 'sc-info-small', esc(small)));
    }

    /* 암호표(자판) */
    function drawTable(r) {
      var cells = r.cons.concat(r.vows), n = cells.length;
      var cols = n <= 9 ? 3 : (n <= 16 ? 4 : (n <= 20 ? 5 : 6));
      var rows = Math.ceil(n / cols);
      elTable.style.setProperty('--cols', cols);
      elTable.style.setProperty('--rows', rows);
      elTable.innerHTML = '';
      cells.forEach(function (j) {
        var b = h('button', 'sc-cell' + (isCons(j) ? '' : ' is-v'), symHtml(j) + '<span class="sc-jamo">' + esc(j) + '</span>');
        b.type = 'button';
        b.setAttribute('data-j', j);
        b.setAttribute('aria-label', symName(j) + ' ' + j);
        elTable.appendChild(b);
      });
      /* 칸 크기를 글자 크기 계산에 넘긴다 */
      var cw = elTable.clientWidth / cols, ch = elTable.clientHeight / rows;
      elTable.style.setProperty('--cell', Math.round(Math.min(cw, ch)) + 'px');
      Array.prototype.forEach.call(elTable.querySelectorAll('.sc-num'), function (x) {
        x.style.setProperty('--sz', Math.round(Math.min(cw, ch) * 0.5) + 'px');
      });
    }

    function startRound(i) {
      ri = i;
      clearTimers();
      var r = rounds[i];
      R = { r: r, qi: 0, phase: 'ready', sayText: '', sayMood: 'ready', tally: { accurate: 0, 'self-corrected': 0, support: 0 } };
      elTitle.textContent = r.mode === 'encode' ? T.titleEncode : T.title;
      paintRounds(i);
      paintSteps();
      drawTable(r);
      elArena.classList.add('sc-off');
      boardInfo(r.mode === 'encode' ? '🔐' : '🔓', (i + 1) + '판 · ' + (r.mode === 'encode' ? T.titleEncode : T.title), r.words.length + '낱말');
      say(r.mode === 'encode' ? T.readyEncode : T.readyDecode, 'ready');
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    function ask() {
      var r = R.r, w = r.words[R.qi];
      var syls = w.word.split('').map(splitSyl);
      R.w = w; R.syls = syls; R.mode = r.mode;
      R.seq = [];
      syls.forEach(function (parts, si) { parts.forEach(function (j, pi) { R.seq.push({ si: si, pi: pi, j: j }); }); });
      R.pos = 0; R.got = syls.map(function () { return []; });
      R.misses = 0; R.posMiss = 0; R.helps = 0; R.cued = false; R.hintPos = -1;
      R.phase = 'pick';
      R.tItem = R.tAsk = now();
      elArena.classList.remove('sc-off');
      drawBoard();
      paintSteps();
      say(R.mode === 'encode' ? T.askEncode : T.askDecode, 'ask');
      setActions([], [hintButton()]);
      tagCells();
      log('game-item-ready', {
        itemId: r.id + '-' + (R.qi + 1), mode: R.mode, word: w.word, jamo: R.seq.map(function (x) { return x.j; }).join(''),
        tableSize: r.cons.length + r.vows.length, engine: 'secret-code@' + VERSION
      });
    }
    function itemId() { return R.r.id + '-' + (R.qi + 1); }

    function drawBoard() {
      elBoard.innerHTML = '';
      var enc = R.mode === 'encode';
      if (enc) {
        elBoard.appendChild(h('span', 'sc-pic', esc(R.w.icon || '')));
        elBoard.appendChild(h('b', 'sc-word', esc(R.w.word)));
      }
      var code = h('div', 'sc-code');
      var cur = R.seq[R.pos];
      R.syls.forEach(function (parts, si) {
        var done = R.got[si].length === parts.length;
        var syl = h('div', 'sc-syl' + (done ? ' is-done' : (cur && cur.si === si ? ' is-now' : '')));
        var slots = h('div', 'sc-slots');
        parts.forEach(function (j, pi) {
          var isNow = cur && cur.si === si && cur.pi === pi;
          var have = pi < R.got[si].length;
          var s = h('span', 'sc-slot' + (isNow ? ' is-now' : ''));
          /* 풀기: 기호가 처음부터 보임 / 만들기: 맞힌 칸만 기호가 보임 */
          if (!enc || have) s.innerHTML = symHtml(j);
          slots.appendChild(s);
        });
        syl.appendChild(slots);
        if (!enc) syl.appendChild(h('span', 'sc-out', esc(joinSyl(R.got[si])) || '&nbsp;'));
        else if (R.hintPos === si) syl.appendChild(h('span', 'sc-parts', esc(parts.join(' '))));
        code.appendChild(syl);
      });
      elBoard.appendChild(code);
    }
    function accNow() { return R.helps ? 'support' : (R.posMiss ? 'self-corrected' : 'accurate'); }
    function tagCells() {
      var cur = R.seq[R.pos];
      Array.prototype.forEach.call(elTable.querySelectorAll('.sc-cell'), function (b) {
        if (!cur) { b.removeAttribute('data-track'); return; }
        var j = b.getAttribute('data-j'), right = j === cur.j;
        b.setAttribute('data-track', 'answer');
        b.setAttribute('data-item-id', itemId() + '-' + (R.pos + 1));
        b.setAttribute('data-response', j);
        b.setAttribute('data-correct', right ? 'true' : 'false');
        if (right) b.setAttribute('data-accuracy', accNow()); else b.removeAttribute('data-accuracy');
      });
    }
    function hintButton() {
      var enc = R.mode === 'encode';
      var b = button((enc ? '✂️ ' + esc(T.hintEncode) : '🔦 ' + esc(T.hintDecode)), 'hint', true, {
        'data-track': 'hint', 'data-help-level': 'A2', 'data-help-type': enc ? 'split-syllable' : 'show-group', 'data-item-id': itemId()
      });
      return b;
    }
    function clearGroup() {
      elTable.classList.remove('is-dim');
      Array.prototype.forEach.call(elTable.querySelectorAll('.sc-cell'), function (c) { c.classList.remove('is-group', 'is-cue'); });
    }

    function onCell(b) {
      if (!R || R.phase !== 'pick') return;
      var j = b.getAttribute('data-j'), cur = R.seq[R.pos], t = now();
      if (j === cur.j) {
        log('game-response', {
          itemId: itemId() + '-' + (R.pos + 1), mode: R.mode, target: cur.j, response: j, correct: true,
          attempt: R.posMiss + 1, accuracy: accNow(), responseMs: Math.round(t - R.tAsk)
        });
        clearGroup();
        b.classList.add('is-hit');
        later(function () { b.classList.remove('is-hit'); }, 350);
        R.got[cur.si].push(j);
        R.pos++;
        R.posMiss = 0; R.cued = false; R.tAsk = now();
        var sylDone = R.got[cur.si].length === R.syls[cur.si].length;
        sfx(sylDone ? 'syl' : 'hit');
        drawBoard();
        if (R.pos >= R.seq.length) { solved(); return; }
        if (R.hintPos >= 0 && R.seq[R.pos].si !== R.hintPos) { R.hintPos = -1; drawBoard(); }
        say(R.mode === 'encode' ? T.askEncode : T.askDecode, 'ask');
        tagCells();
        return;
      }
      R.posMiss++;
      R.misses++;
      sfx('miss');
      log('game-response', {
        itemId: itemId() + '-' + (R.pos + 1), mode: R.mode, target: cur.j, response: j, correct: false, attempt: R.posMiss,
        errorType: isCons(j) === isCons(cur.j) ? 'same-group' : 'other-group', responseMs: Math.round(t - R.tAsk)
      });
      b.classList.remove('is-shake');
      void b.offsetWidth;
      b.classList.add('is-shake');
      later(function () { b.classList.remove('is-shake'); }, 420);
      if (R.posMiss >= 2 && !R.cued) {
        R.cued = true;
        R.helps++;
        var r = elTable.querySelector('[data-j="' + cur.j + '"]');
        if (r) r.classList.add('is-cue');
        log('game-help', { itemId: itemId() + '-' + (R.pos + 1), helpLevel: 'A4', helpType: 'cue-cell', trigger: 'second-miss' });
        say(T.cue, 'help');
      } else {
        sayTemp(T.miss, 'miss');
      }
      tagCells();
    }

    function doHint() {
      if (!R || R.phase !== 'pick') return;
      var cur = R.seq[R.pos];
      R.helps++;
      sfx('show');
      if (R.mode === 'encode') {
        R.hintPos = cur.si;
        drawBoard();
        say(T.hintedEncode, 'help');
        log('game-help', { itemId: itemId() + '-' + (R.pos + 1), helpLevel: 'A2', helpType: 'split-syllable', trigger: 'child-request', syllable: R.w.word.charAt(cur.si) });
      } else {
        var cons = isCons(cur.j);
        elTable.classList.add('is-dim');
        Array.prototype.forEach.call(elTable.querySelectorAll('.sc-cell'), function (c) {
          c.classList.toggle('is-group', isCons(c.getAttribute('data-j')) === cons);
        });
        say(T.hintedDecode, 'help');
        log('game-help', { itemId: itemId() + '-' + (R.pos + 1), helpLevel: 'A2', helpType: 'show-group', trigger: 'child-request', group: cons ? 'consonant' : 'vowel' });
      }
      tagCells();
    }

    function solved() {
      var w = R.w, acc = R.helps ? 'support' : (R.misses ? 'self-corrected' : 'accurate');
      R.phase = 'done';
      elArena.classList.add('sc-off');
      clearGroup();
      R.tally[acc]++;
      setActions([], []);
      sfx('done');
      if (R.mode !== 'encode') {
        var pic = h('span', 'sc-pic sc-pop', esc(w.icon || ''));
        elBoard.insertBefore(pic, elBoard.firstChild);
      }
      say(fmt(R.mode === 'encode' ? T.made : T.solved, { w: w.word }), 'good', 'is-good');
      var summary = { itemId: itemId(), mode: R.mode, word: w.word, accuracy: acc, misses: R.misses, helps: R.helps, totalMs: Math.round(now() - R.tItem) };
      results.push(summary);
      log('game-item-complete', summary);
      later(function () {
        R.qi++;
        paintSteps();
        if (R.qi < R.r.words.length) ask();
        else roundDone();
      }, o.nextMs);
    }

    function roundDone() {
      R.phase = 'round-done';
      paintSteps();
      var left = rounds.length - ri - 1;
      boardInfo('🎉', fmt(T.infoDone, { n: ri + 1 }), left ? fmt(T.infoLeft, { n: left }) : T.infoLast);
      var sum = { roundId: R.r.id, items: R.r.words.length, accurate: R.tally.accurate, selfCorrected: R.tally['self-corrected'], support: R.tally.support };
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
      elEnd.querySelector('.sc-end-line').textContent = fmt(T.endLine, { n: rounds.length });
      var st = elEnd.querySelector('.sc-stamps');
      st.innerHTML = '';
      rounds.forEach(function (r, i) { st.appendChild(h('span', 'sc-dot is-done', (i + 1) + '판')); });
      var acts = elEnd.querySelector('.sc-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', true));
      var tally = { accurate: 0, 'self-corrected': 0, support: 0 };
      results.forEach(function (r) { tally[r.accuracy]++; });
      log('game-activity-complete', { rounds: rounds.length, items: results.length, accurate: tally.accurate, selfCorrected: tally['self-corrected'], support: tally.support });
      if (typeof o.onFinish === 'function') { try { o.onFinish(results.slice()); } catch (e) {} }
    }

    /* 판 준비: 표에 없는 자모가 든 낱말은 빼고(콘솔에 알림) count만큼 뽑는다 */
    function prepRound(r, i) {
      var cons = (r.consonants || CONS).split('').filter(function (j) { return isCons(j); });
      var vows = (r.vowels || 'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ').split('').filter(function (j) { return !!VSYM[j]; });
      var ok = (r.words || []).filter(function (w) {
        var good = w.word.split('').every(function (ch) {
          var p = splitSyl(ch);
          return p && cons.indexOf(p[0]) >= 0 && vows.indexOf(p[1]) >= 0 && (!p[2] || cons.indexOf(p[2]) >= 0);
        });
        if (!good && global.console) console.warn('[암호 풀기] 표에 없는 글자가 있어 뺐어요:', w.word);
        return good;
      });
      return { id: r.id || ('r' + (i + 1)), mode: r.mode === 'encode' ? 'encode' : 'decode', cons: cons, vows: vows, words: shuffle(ok).slice(0, r.count || 4) };
    }

    function restart() {
      clearTimers();
      rounds = o.rounds.map(prepRound);
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
      var b = e.target.closest('[data-sc-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-sc-act')); return; }
      var c = e.target.closest('.sc-cell');
      if (c && root.contains(c)) onCell(c);
    }
    root.addEventListener('click', onClick);
    var onResize = function () { if (R && R.r) { var keep = R.phase; drawTable(R.r); if (keep === 'pick') tagCells(); } };
    global.addEventListener('resize', onResize);

    restart();

    return {
      root: root,
      restart: restart,
      results: function () { return results.slice(); },
      destroy: function () { clearTimers(); clearTimeout(tempTimer); global.removeEventListener('resize', onResize); root.remove(); }
    };
  }

  global.SecretCode = { version: VERSION, mount: mount, split: splitSyl, join: joinSyl };
})(window);
