/*!
 * 「청기백기」 행동억제 게임 엔진  v1.0.0
 *
 * 바탕 활동: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 3장 행동억제 「청기백기 게임 1·2」
 *            (왼손에 청기, 오른손에 백기를 들고 「청기 올려」「백기 올리지 마」「청기 올리지 말고 백기 내려」 같은
 *            명령을 30번쯤 이어서 따라 한다) — 활동 방식만 가져왔고, 책의 명령 목록·그림은 쓰지 않았다.
 *
 * 난이도(판마다 level)
 *   1  한 깃발 명령          「청기 올려」「백기 내려」
 *   2  + 하지 마              「백기 올리지 마」 — 깃발을 그대로 두어야 한다
 *   3  두 깃발 · 말고         「청기 올리고 백기 내려」「청기 올리지 말고 백기 올려」
 *   명령은 지금 깃발 상태를 보고 만든다. 이미 올라간 깃발에 「올려」처럼 「움직이지 않아도 되는」 명령도 섞인다.
 *   rounds에 commands: ['청기 올려', …]를 주면 그 글을 그대로 읽어 쓴다(책처럼 정한 목록).
 *
 * 한 번의 흐름: 명령 → 깃발 단추(올려/내려)로 깃발을 맞춤 → 「됐어요」
 *   어긋나면 1번째 : 깃발이 명령 전으로 돌아가고 「명령을 다시 읽어 봐요」
 *            2번째 : 맞는 단추가 금색으로 반짝, 「청기는 올려요, 백기는 그대로예요」(도움 A4)
 *   걸린 시간은 기록에만 남긴다(아이 화면에 점수 금지).
 *
 * 크기: 넣은 칸을 가득 채운다(온큐베이트 기본 활동창 안쪽 약 920×450 기준, 750×417까지). ⚠ 칸에 높이를 줄 것.
 *
 * 기록(온큐베이트 규격 v1.28)
 *   - 「됐어요」  data-track="answer" + data-item-id(판-몇째) + data-correct + data-response + (맞을 때) data-accuracy
 *   - 끝 화면     data-track="activity-complete"
 *   - 자세한 신호 oncuvate:log  game-item-ready / game-response / game-help / game-item-complete / game-activity-complete
 *
 * 크롬 109(클래스인) 하한에 맞춰 최신 문법을 쓰지 않았다.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var TEXT = {
    title: '청기백기',
    ready: '명령을 읽고 깃발을 움직인 다음 「됐어요」를 눌러요.',
    readyTitle: '준비!',
    start: '시작',
    run: '명령대로 깃발을 움직여요.',
    submit: '됐어요',
    up: '올려',
    down: '내려',
    good: ['좋아요!', '딱 맞아요!', '척척이에요!'],
    held: '잘 참았어요!',
    oops: '명령을 다시 읽어 봐요.',
    cueUp: '올려요',
    cueDown: '내려요',
    cueKeep: '그대로 둬요',
    cueAlreadyUp: '이미 올라가 있어요',
    cueAlreadyDown: '이미 내려가 있어요',
    allDone: '명령 {n}개를 모두 했어요!',
    next: '다음 판',
    finish: '다 했어요',
    endTitle: '다 했어요!',
    endLine: '{n}판을 모두 마쳤어요.',
    again: '처음부터 다시',
    infoCount: '명령 {n}개',
    level1: '깃발 하나씩 움직여요',
    level2: '「하지 마」가 섞여요',
    level3: '두 깃발을 함께 들어요',
    example: '예: {t}',
    infoDone: '{n}판 끝!',
    infoLeft: '남은 판 {n}개',
    infoLast: '마지막 판까지 왔어요',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  var DEFAULTS = {
    activityId: 'flag-game',
    storageKey: null,
    /* 왼쪽·오른쪽 깃발 (책: 왼손 청기, 오른손 백기) */
    flags: [
      { key: 'blue', name: '청기', color: '#2f6fe4', edge: '#1d4fb8' },
      { key: 'white', name: '백기', color: '#ffffff', edge: '#b9b2cc' }
    ],
    rounds: [],                // [ {id, level:1|2|3, count} ] 또는 [ {id, commands:['청기 올려', …]} ]
    noChangeRate: 0.3,         // 움직이지 않아도 되는 명령의 비율(대략)
    sound: true,
    restartButton: true,
    credit: '',
    jellyBase: 'assets/images/jelly/',
    jellyExt: '.webp',
    texts: null,
    debug: false,
    onRoundEnd: null,
    onFinish: null
  };

  /* ───────────── 스타일 ───────────── */
  var CSS = [
    '.fg-root{--v8:#3b2a9e;--v6:#5b48d6;--v5:#8b72ff;--v3:#cfc3ee;--v1:#ede7ff;--v05:#f7f4ff;',
    '--gold:#ffd23f;--gold-d:#e0a100;--orange:#ff9f43;--mint:#3ddc97;--mint-d:#16a06a;--coral:#ff8a80;--cyan-bg:#e9f8fa;',
    '--blue:#2f6fe4;--ink:#27344e;--muted:#6f7789;--line:#e7e3ef;',
    '--font:Pretendard,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;',
    'container:fg / size;position:relative;box-sizing:border-box;width:100%;height:100%;min-height:400px;overflow:hidden;',
    'font-family:var(--font);color:var(--ink);border:1px solid var(--line);border-radius:22px;',
    'background:linear-gradient(145deg,#fff,var(--v05));box-shadow:0 12px 32px rgba(37,20,78,.08);',
    '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;word-break:keep-all;line-break:strict}',
    '.fg-root *,.fg-root *::before,.fg-root *::after{box-sizing:border-box}',
    '.fg-root [hidden]{display:none!important}',
    '.fg-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',

    /* 무대: 위 명령 말풍선 + 아래 깃발 든 젤리 */
    '.fg-arena{container:fgarena / size;position:relative;width:var(--arena);height:var(--arena);align-self:center;overflow:hidden;',
    'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3cqh;padding:5cqh 4cqw 0;',
    'border-radius:18px;background:radial-gradient(circle at 50% 62%,#5b48d6 0%,#3b2a9e 50%,#1b1462 100%);',
    'box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 8px 18px rgba(27,20,98,.22)}',
    '.fg-rays{position:absolute;left:50%;top:62%;width:1400px;height:1400px;margin:-700px 0 0 -700px;pointer-events:none;',
    'background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.05) 0 8deg,transparent 8deg 20deg);animation:fg-spin 90s linear infinite}',
    '.fg-call{position:relative;z-index:3;min-height:24cqh;width:100%;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:1.6cqw;',
    'padding:2.5cqh 4cqw;border-radius:20px;background:#fff;box-shadow:0 5px 0 var(--v3),0 12px 22px rgba(10,4,50,.25);',
    'font-size:clamp(20px,7.6cqmin,40px);font-weight:900;letter-spacing:-.03em;color:#2b2140;text-align:center;line-height:1.25}',
    '.fg-call::after{content:"";position:absolute;left:50%;bottom:-11px;margin-left:-11px;border:11px solid transparent;border-bottom:0;border-top-color:#fff}',
    '.fg-call.is-new{animation:fg-pop .3s cubic-bezier(.3,1.5,.5,1)}',
    '.fg-call.fg-wob{animation:fg-wob .45s ease-in-out}',
    '.fg-call.is-wait{color:var(--v6)}',
    '.fg-chip{display:inline-block;padding:.08em .42em .12em;border-radius:.45em;line-height:1.15}',
    '.fg-chip.is-0{color:#fff;background:var(--blue);box-shadow:0 3px 0 #1d4fb8}',
    '.fg-chip.is-1{color:#2b2140;background:#fff;box-shadow:inset 0 0 0 2px #b9b2cc,0 3px 0 #b9b2cc}',
    '.fg-figure{position:relative;z-index:2;width:min(52cqw,46cqh);aspect-ratio:1/1;margin-top:auto;margin-bottom:12cqh}',
    '.fg-jelly{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}',
    '.fg-flag{position:absolute;bottom:40%;width:30%;height:56%;transform-origin:50% 100%;transition:transform .28s cubic-bezier(.3,1.4,.5,1)}',
    '.fg-flag svg{display:block;width:100%;height:100%;overflow:visible}',
    '.fg-flag.is-left{left:calc(5% - 15%)}.fg-flag.is-right{right:calc(5% - 15%)}',
    '.fg-flag.is-left{transform:rotate(-122deg)}.fg-flag.is-right{transform:rotate(122deg)}',
    '.fg-flag.is-left.is-up{transform:rotate(-8deg)}.fg-flag.is-right.is-up{transform:rotate(8deg)}',
    '.fg-figure.is-ok .fg-jelly{animation:fg-hop .45s ease-out}',
    '.fg-figure.fg-wob{animation:fg-wob .45s ease-in-out}',

    /* 오른쪽 칸 */
    '.fg-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:9px}',
    '.fg-top{display:flex;align-items:center;gap:8px;min-height:34px}',
    '.fg-title{font-size:clamp(15px,4.2cqh,19px);font-weight:900;letter-spacing:-.03em;color:var(--v8);white-space:nowrap}',
    '.fg-rounds{list-style:none;margin:0 0 0 auto;padding:0;display:flex;gap:5px}',
    '.fg-dot{display:inline-flex;align-items:center;justify-content:center;gap:2px;min-width:28px;height:28px;padding:0 7px;border-radius:9px;background:var(--v1);color:#8a7fc0;font-size:12px;font-weight:900}',
    '.fg-dot.is-now{background:#fff6d6;box-shadow:inset 0 0 0 2px var(--gold);color:#b07a00}',
    '.fg-dot.is-done{background:#d7f8e9;color:var(--mint-d)}',
    '.fg-sound{flex:none;width:34px;height:34px;border:0;border-radius:10px;background:#fff;box-shadow:0 3px 0 var(--v3);font-size:16px;line-height:1;cursor:pointer}',
    '.fg-bubble{margin:0;min-height:clamp(46px,13cqh,64px);display:flex;align-items:center;padding:10px 13px;border:1px solid rgba(44,183,203,.3);',
    'border-radius:16px;background:var(--cyan-bg);font-size:clamp(14px,4cqh,18px);font-weight:800;line-height:1.4}',
    '.fg-bubble.is-good{border-color:rgba(61,220,151,.5);background:#eafff5;color:#14704b}',
    '.fg-bubble.is-temp{border-color:rgba(224,161,0,.4);background:#fff6d6}',
    '.fg-prog{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums}',
    '.fg-prog-bar{flex:1;height:8px;border-radius:99px;background:var(--v1);overflow:hidden}',
    '.fg-prog-bar i{display:block;width:0;height:100%;border-radius:99px;background:linear-gradient(90deg,#5b48d6,#4bc9dc);transition:width .2s}',
    '.fg-info{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:10px;',
    'border-radius:16px;background:rgba(237,231,255,.45);box-shadow:inset 0 0 0 2px rgba(217,207,245,.6)}',
    '.fg-info-icon{font-size:clamp(30px,10cqh,48px);line-height:1}',
    '.fg-info-big{font-size:clamp(18px,5.5cqh,26px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.fg-info-small{font-size:clamp(13px,3.6cqh,16px);font-weight:700;color:var(--muted)}',
    '.fg-info-ex{margin-top:2px;padding:6px 12px;border-radius:12px;background:#fff;font-size:clamp(14px,4cqh,18px);font-weight:900;color:#2b2140;box-shadow:0 3px 0 var(--v3)}',
    '.fg-info-ex .fg-chip{font-size:.92em}',
    '.fg-pads{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '.fg-pad{container-type:size;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) minmax(0,1fr);gap:6px;padding:8px;border-radius:18px;',
    'background:#f3effd;box-shadow:inset 0 0 0 2px #e6dffa}',
    '.fg-pad-name{justify-self:center;font-size:clamp(14px,4.2cqh,18px)}',
    '.fg-seg{position:relative;min-height:0;display:flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:14px;cursor:pointer;font:inherit;',
    'font-size:clamp(16px,min(13cqw,14cqh),26px);font-weight:900;color:var(--v8);background:#fff;box-shadow:0 4px 0 var(--v3);touch-action:manipulation;transition:transform .1s}',
    '.fg-seg:active{transform:translateY(2px);box-shadow:0 2px 0 var(--v3)}',
    '.fg-seg:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',
    '.fg-seg .fg-arw{font-size:1.1em;line-height:1}',
    '.fg-pad.is-0 .fg-seg.is-on{color:#fff;background:var(--blue);box-shadow:0 4px 0 #1d4fb8}',
    '.fg-pad.is-1 .fg-seg.is-on{color:#2b2140;background:#fffdf5;box-shadow:inset 0 0 0 3px #8f86ad,0 4px 0 #8f86ad}',
    '.fg-seg.is-cue{animation:fg-cue 1s ease-in-out infinite}',
    '.fg-actions{display:flex;align-items:center;gap:8px;min-height:50px}',
    '.fg-btns{flex:1;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}',
    '.fg-btn{font:inherit;font-size:clamp(15px,4.2cqh,18px);font-weight:900;min-height:48px;padding:0 22px;border:0;border-radius:14px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:7px;white-space:nowrap;color:#fff;background:linear-gradient(135deg,#5b48d6,#8b72ff);',
    'box-shadow:0 4px 0 #3b2a9e,0 8px 16px rgba(59,42,158,.22)}',
    '.fg-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2a9e}',
    '.fg-btn.is-soft{color:var(--v6);background:#fff;box-shadow:0 4px 0 var(--v3)}',
    '.fg-btn.is-wide{flex:1;justify-content:center;min-height:52px;font-size:clamp(17px,4.8cqh,21px)}',
    '.fg-btn:focus-visible,.fg-sound:focus-visible{outline:3px solid rgba(75,201,220,.6);outline-offset:2px}',

    /* 끝 화면 */
    '.fg-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px 16px 28px;',
    'text-align:center;background:radial-gradient(circle at 50% 28%,#fff 0%,var(--v05) 70%)}',
    '.fg-end-img{width:clamp(80px,26cqh,130px);height:clamp(80px,26cqh,130px);object-fit:contain}',
    '.fg-end h2{margin:0;font-size:clamp(24px,7cqh,34px);font-weight:900;letter-spacing:-.03em;color:var(--v8)}',
    '.fg-end-line{margin:0;font-size:clamp(14px,4cqh,18px);font-weight:700;color:var(--muted)}',
    '.fg-end .fg-btns{margin:0;justify-content:center}',
    '.fg-stamps{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.fg-stamps .fg-dot{height:40px;padding:0 14px;border-radius:12px;font-size:15px}',
    '.fg-credit{position:absolute;left:12px;right:12px;bottom:6px;margin:0;font-size:10px;color:var(--muted);opacity:.75}',
    '.fg-mark{position:absolute;right:12px;bottom:3px;z-index:30;font-size:10px;color:var(--muted);opacity:.35;pointer-events:none}',

    '.fg-bit{position:absolute;left:50%;top:60%;z-index:7;width:9px;height:13px;border-radius:2px;pointer-events:none;animation:fg-bit .9s ease-out forwards}',
    '@keyframes fg-spin{to{transform:rotate(360deg)}}',
    '@keyframes fg-pop{from{transform:scale(.9)}}',
    '@keyframes fg-hop{30%{transform:translateY(-7%)}}',
    '@keyframes fg-wob{20%{transform:rotate(-4deg) translateX(-5px)}45%{transform:rotate(3deg) translateX(5px)}70%{transform:rotate(-1deg)}}',
    '@keyframes fg-cue{0%,100%{box-shadow:inset 0 0 0 3px var(--gold),0 4px 0 var(--gold-d)}50%{box-shadow:inset 0 0 0 4px var(--gold),0 4px 0 var(--gold-d),0 0 0 6px rgba(255,210,63,.55)}}',
    '@keyframes fg-bit{from{opacity:1;transform:translate(-50%,-50%)}to{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',

    '@container fg (max-aspect-ratio:5/4){',
    '.fg-wrap{--arena:min(calc(100cqw - 24px),50cqh);grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:center}',
    '.fg-side{width:100%}}',

    '@media (prefers-reduced-motion:reduce){.fg-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('fg-style')) return;
    var s = document.createElement('style');
    s.id = 'fg-style';
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
  function hasBatchim(word) {
    var c = String(word).charCodeAt(String(word).length - 1);
    return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
  }
  function eun(word) { return word + (hasBatchim(word) ? '은' : '는'); }
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
  function same(a, b) { return a[0] === b[0] && a[1] === b[1]; }

  /* 깃발 그림(SVG). 색은 SVG 안에 글자값으로 — CSS 변수를 쓰지 않는다 */
  function flagSvg(f, side) {
    var cloth = side === 0 ? 'M28 8 L28 46 L-14 40 L-10 26 L-16 12 Z' : 'M32 8 L32 46 L74 40 L70 26 L76 12 Z';
    return '<svg viewBox="0 0 60 120" aria-hidden="true">' +
      '<rect x="27" y="4" width="6" height="114" rx="3" fill="#8a5a2b"/>' +
      '<circle cx="30" cy="5" r="5" fill="#ffd23f"/>' +
      '<path d="' + cloth + '" fill="' + f.color + '" stroke="' + f.edge + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '</svg>';
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
    flip: function () { tones([620], 0.04, 'triangle', 0.08); },
    ok: function () { tones([659, 880], 0.08, 'sine', 0.13); },
    again: function () { tones([440, 392], 0.1, 'triangle', 0.1); },
    call: function () { tones([523], 0.05, 'sine', 0.06); },
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
    var F = o.flags;
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
    function jellySrc(name) { return o.jellyBase ? o.jellyBase + name + o.jellyExt : ''; }
    if (o.jellyBase) ['jelly-default', 'jelly-thinking', 'jelly-praise', 'jelly-puzzle', 'jelly-cheer'].forEach(function (n) {
      var im = new Image(); im.src = jellySrc(n);
    });

    /* ── 명령: 글 ↔ 동작 ── 동작 act: 'up' | 'down' | 'keep' */
    var PH = {
      up: { end: '올려', join: '올리고', no: '올리지 마', noJoin: '올리지 말고' },
      down: { end: '내려', join: '내리고', no: '내리지 마', noJoin: '내리지 말고' }
    };
    function flagIndexByName(name) {
      for (var i = 0; i < F.length; i++) if (F[i].name === name) return i;
      return -1;
    }
    /* 글로 적은 명령을 읽는다: 「청기 올리지 말고 백기 내려」 → [{f:0,act:'keep'},{f:1,act:'down'}] */
    function parse(text) {
      var names = F.map(function (f) { return f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|');
      var re = new RegExp('(' + names + ')\\s*(올리지\\s*말고|내리지\\s*말고|들지\\s*말고|올리지\\s*마|내리지\\s*마|들지\\s*마|올리고|내리고|들고|올려|내려|들어)', 'g');
      var ops = [], m;
      while ((m = re.exec(text))) {
        var v = m[2].replace(/\s+/g, '');
        var act = /말고|마$/.test(v) ? 'keep' : (/^(올|들)/.test(v) ? 'up' : 'down');
        ops.push({ f: flagIndexByName(m[1]), act: act });
      }
      return ops;
    }
    function apply(state, ops) {
      var s = state.slice();
      ops.forEach(function (op) { if (op.act !== 'keep' && op.f >= 0) s[op.f] = op.act === 'up'; });
      return s;
    }
    function render(text) {
      var html = esc(text);
      F.forEach(function (f, i) {
        html = html.split(esc(f.name)).join('<span class="fg-chip is-' + i + '">' + esc(f.name) + '</span>');
      });
      return html;
    }
    /* 지금 상태를 보고 판 수준에 맞는 명령 하나 만들기 */
    function makeCommand(level, state, noChangeStreak, f) {
      var allowNo = noChangeStreak < 1, wantNo = allowNo && Math.random() < o.noChangeRate;
      var g = 1 - f;
      function changeAct(i) { return state[i] ? 'down' : 'up'; }
      function stayAct(i) { return state[i] ? 'up' : 'down'; }
      if (level <= 1 || (level === 2 && Math.random() < 0.55)) {
        var act = wantNo ? stayAct(f) : changeAct(f);
        return F[f].name + ' ' + PH[act].end;
      }
      if (level === 2) {
        /* 하지 마: 그 깃발은 그대로 */
        return F[f].name + ' ' + PH[pick(['up', 'down'])].no;
      }
      if (Math.random() < 0.5) {
        /* 두 깃발 함께: 「청기 올리고 백기 내려」 */
        var a1 = wantNo ? stayAct(f) : (Math.random() < 0.6 ? changeAct(f) : stayAct(f));
        var a2 = wantNo ? stayAct(g) : (a1 === stayAct(f) ? changeAct(g) : pick([changeAct(g), stayAct(g)]));
        return F[f].name + ' ' + PH[a1].join + ' ' + F[g].name + ' ' + PH[a2].end;
      }
      /* 말고: 「청기 올리지 말고 백기 내려」 (가끔 같은 깃발: 「백기 올리지 말고 백기 내려」) */
      var g2 = Math.random() < 0.12 ? f : g;
      var a = wantNo ? stayAct(g2) : changeAct(g2);
      return F[f].name + ' ' + PH[pick(['up', 'down'])].noJoin + ' ' + F[g2].name + ' ' + PH[a].end;
    }

    /* 판 계획: 명령 목록을 미리 만들어 둔다(깃발은 둘 다 내린 채 시작) */
    function plan(spec, idx) {
      var level = spec.level || 1, cmds = [], state = [false, false], streak = 0, used = [0, 0], lastF = [];
      var texts = spec.commands ? spec.commands.slice() : null;
      var count = texts ? texts.length : (spec.count || 8);
      for (var i = 0; i < count; i++) {
        /* 깃발은 고르게, 같은 깃발이 세 번 이어지지 않게 */
        var f = used[0] === used[1] ? (Math.random() < 0.5 ? 0 : 1) : (used[0] < used[1] ? 0 : 1);
        if (lastF.length >= 2 && lastF[0] === lastF[1] && lastF[1] === f && Math.random() < 0.85) f = 1 - f;
        var text = texts ? texts[i] : makeCommand(level, state, streak, f);
        used[f]++;
        lastF = [lastF[lastF.length - 1], f];
        var ops = parse(text), before = state.slice(), target = apply(state, ops);
        cmds.push({ text: text, ops: ops, before: before, target: target });
        streak = same(before, target) ? streak + 1 : 0;
        state = target;
      }
      return { id: spec.id || ('r' + (idx + 1)), level: level, fixed: !!texts, count: count, cmds: cmds };
    }

    var root = h('div', 'fg-root');
    root.setAttribute('data-activity-id', o.activityId);
    root.setAttribute('data-working-memory-load', 'secondary');
    root.innerHTML =
      '<div class="fg-wrap">' +
        '<div class="fg-arena"><div class="fg-rays"></div>' +
          '<div class="fg-call" aria-live="polite"></div>' +
          '<div class="fg-figure">' +
            (o.jellyBase ? '<img class="fg-jelly" alt="" aria-hidden="true">' : '') +
            '<div class="fg-flag is-left">' + flagSvg(F[0], 0) + '</div>' +
            '<div class="fg-flag is-right">' + flagSvg(F[1], 1) + '</div>' +
          '</div>' +
        '</div>' +
        '<aside class="fg-side">' +
          '<div class="fg-top">' +
            '<span class="fg-title">' + esc(T.title) + '</span>' +
            '<ol class="fg-rounds" aria-label="판"></ol>' +
            '<button type="button" class="fg-sound" data-fg-act="sound"></button>' +
          '</div>' +
          '<p class="fg-bubble" aria-live="polite"></p>' +
          '<div class="fg-prog" hidden><span class="fg-prog-txt"></span><span class="fg-prog-bar"><i></i></span></div>' +
          '<div class="fg-info" hidden></div>' +
          '<div class="fg-pads" hidden>' +
            F.map(function (f, i) {
              return '<div class="fg-pad is-' + i + '"><b class="fg-pad-name"><span class="fg-chip is-' + i + '">' + esc(f.name) + '</span></b>' +
                '<button type="button" class="fg-seg" data-flag="' + i + '" data-dir="up"><span class="fg-arw">⬆</span>' + esc(T.up) + '</button>' +
                '<button type="button" class="fg-seg" data-flag="' + i + '" data-dir="down"><span class="fg-arw">⬇</span>' + esc(T.down) + '</button></div>';
            }).join('') +
          '</div>' +
          '<div class="fg-actions"><div class="fg-btns"></div></div>' +
        '</aside>' +
      '</div>' +
      '<section class="fg-end" hidden data-track="activity-complete" data-activity-id="' + esc(o.activityId) + '">' +
        (o.jellyBase ? '<img class="fg-end-img" alt="" aria-hidden="true" src="' + esc(jellySrc('jelly-cheer')) + '">' : '') +
        '<h2></h2><p class="fg-end-line"></p><div class="fg-stamps"></div><div class="fg-btns"></div>' +
        (o.credit ? '<p class="fg-credit">' + esc(o.credit) + '</p>' : '') +
      '</section>';
    host.appendChild(root);

    var child = global.ONCUVATE && global.ONCUVATE.child;
    if (child) root.appendChild(h('span', 'fg-mark', esc(child)));

    var $ = function (s) { return root.querySelector(s); };
    var elRounds = $('.fg-rounds'), elSound = $('.fg-sound'), elArena = $('.fg-arena'), elCall = $('.fg-call'),
        elFigure = $('.fg-figure'), elJelly = $('.fg-jelly'), elFlags = [$('.fg-flag.is-left'), $('.fg-flag.is-right')],
        elBubble = $('.fg-bubble'), elProg = $('.fg-prog'), elProgTxt = $('.fg-prog-txt'), elProgBar = $('.fg-prog-bar i'),
        elInfo = $('.fg-info'), elPads = $('.fg-pads'), elSegs = root.querySelectorAll('.fg-seg'),
        elActs = $('.fg-side .fg-btns'), elEnd = $('.fg-end');

    function paintSound() {
      elSound.textContent = soundOn ? '🔊' : '🔈';
      elSound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      elSound.style.opacity = soundOn ? '1' : '.55';
    }
    paintSound();

    var plans = [], R = null, ri = 0, results = [], tempTimer = null, nextTimer = null;

    function setJelly(name) { if (elJelly) elJelly.src = jellySrc(name); }
    function say(text, cls) {
      clearTimeout(tempTimer);
      elBubble.className = 'fg-bubble' + (cls ? ' ' + cls : '');
      elBubble.textContent = text;
      R.sayText = text;
    }
    function sayTemp(text, cls) {
      clearTimeout(tempTimer);
      elBubble.className = 'fg-bubble ' + (cls || 'is-temp');
      elBubble.textContent = text;
      tempTimer = setTimeout(function () { elBubble.className = 'fg-bubble'; elBubble.textContent = R.sayText; }, 1400);
    }
    function wob(el) {
      el.classList.remove('fg-wob');
      void el.offsetWidth;
      el.classList.add('fg-wob');
    }
    function button(label, act, cls, attrs) {
      var b = h('button', 'fg-btn' + (cls ? ' ' + cls : ''), label);
      b.type = 'button';
      b.setAttribute('data-fg-act', act);
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
        var li = h('li', 'fg-dot' + (done ? ' is-done' : (i === ri ? ' is-now' : '')), done ? '✓' : String(i + 1));
        li.setAttribute('aria-label', (i + 1) + '판' + (done ? ' 마침' : ''));
        elRounds.appendChild(li);
      });
    }
    function levelText(p) { return p.fixed ? '' : T['level' + Math.min(3, p.level)]; }
    function showInfo(kind) {
      elInfo.innerHTML = '';
      if (!kind) { elInfo.hidden = true; return; }
      var p = R.p, left = plans.length - ri - 1;
      if (kind === 'done') {
        elInfo.appendChild(h('span', 'fg-info-icon', '🎉'));
        elInfo.appendChild(h('b', 'fg-info-big', esc(fmt(T.infoDone, { n: ri + 1 }))));
        elInfo.appendChild(h('span', 'fg-info-small', esc(left ? fmt(T.infoLeft, { n: left }) : T.infoLast)));
      } else {
        elInfo.appendChild(h('span', 'fg-info-icon', '🚩'));
        elInfo.appendChild(h('b', 'fg-info-big', esc(fmt(T.infoCount, { n: p.count }))));
        if (levelText(p)) elInfo.appendChild(h('span', 'fg-info-small', esc(levelText(p))));
        elInfo.appendChild(h('span', 'fg-info-ex', fmt(esc(T.example), { t: render(p.cmds[0].text) })));
      }
      elInfo.hidden = false;
    }

    /* 깃발 상태 그리기 + 단추 켜짐 */
    function paintFlags() {
      R.state.forEach(function (up, i) { elFlags[i].classList.toggle('is-up', up); });
      Array.prototype.forEach.call(elSegs, function (b) {
        var i = +b.getAttribute('data-flag'), dir = b.getAttribute('data-dir');
        b.classList.toggle('is-on', (dir === 'up') === R.state[i]);
        b.setAttribute('aria-pressed', (dir === 'up') === R.state[i] ? 'true' : 'false');
      });
      arm();
    }
    function respText(s) {
      return F.map(function (f, i) { return f.name + (s[i] ? '↑' : '↓'); }).join(' ');
    }
    /* 「됐어요」 단추에 기록 표시 — 지금 깃발이 맞는지 미리 붙여 둔다 */
    function arm() {
      var b = elActs.querySelector('[data-fg-act="submit"]');
      if (!b || !R.cmd) return;
      var ok = same(R.state, R.cmd.target);
      b.setAttribute('data-item-id', R.p.id + '-' + (R.idx + 1));
      b.setAttribute('data-correct', ok ? 'true' : 'false');
      b.setAttribute('data-response', respText(R.state));
      if (ok) b.setAttribute('data-accuracy', R.errs >= 2 ? 'support' : (R.errs === 1 ? 'self-corrected' : 'accurate'));
      else b.removeAttribute('data-accuracy');
    }

    /* ── 한 판 ── */
    function startRound(i) {
      ri = i;
      var p = plans[i];
      clearTimeout(nextTimer);
      R = { p: p, phase: 'ready', idx: 0, cmd: null, state: [false, false], errs: 0, moves: 0,
            acc: [], rts: [], wrong: 0, inhibitFail: 0, sayText: '', tCmd: 0, tStart: 0 };
      paintRounds(i);
      elCall.innerHTML = esc(T.readyTitle);
      elCall.className = 'fg-call is-wait';
      setJelly('jelly-default');
      elPads.hidden = true; elProg.hidden = true;
      showInfo('ready');
      say(T.ready);
      paintFlags();
      setActions([button('▶ ' + esc(T.start), 'start')]);
    }

    function startRun() {
      var p = R.p;
      R.phase = 'run';
      showInfo(null);
      elPads.hidden = false;
      elProg.hidden = false;
      say(T.run);
      setActions([button('✔ ' + esc(T.submit), 'submit', 'is-wide', { 'data-track': 'answer' })]);
      log('game-item-ready', {
        itemId: p.id, level: p.level, count: p.count, fixed: p.fixed,
        commands: p.cmds.map(function (c) { return c.text; }).join('|'),
        engine: 'flag-game@' + VERSION
      });
      R.tStart = now();
      showCommand();
    }

    function showCommand() {
      var p = R.p;
      R.cmd = p.cmds[R.idx];
      R.errs = 0;
      R.moves = 0;
      R.state = R.cmd.before.slice();
      elCall.className = 'fg-call';
      void elCall.offsetWidth;
      elCall.classList.add('is-new');
      elCall.innerHTML = render(R.cmd.text);
      Array.prototype.forEach.call(elSegs, function (b) { b.classList.remove('is-cue'); });
      setJelly('jelly-default');
      elProgTxt.textContent = R.idx + ' / ' + p.count;
      elProgBar.style.width = (R.idx / p.count * 100) + '%';
      if (R.sayText !== T.run) say(T.run);
      paintFlags();
      sfx('call');
      R.tCmd = now();
    }

    function setFlag(i, up) {
      if (!R || R.phase !== 'run') return;
      if (R.state[i] !== up) R.moves++;
      R.state[i] = up;
      sfx('flip');
      paintFlags();
    }

    function submit() {
      if (!R || R.phase !== 'run') return;
      var p = R.p, c = R.cmd, ok = same(R.state, c.target), t = now();
      var acc = ok ? (R.errs >= 2 ? 'support' : (R.errs === 1 ? 'self-corrected' : 'accurate')) : '';
      var noChange = same(c.before, c.target);
      /* 어긋난 종류: 그대로 두어야 할 깃발을 움직임(inhibition) / 움직여야 할 깃발을 안 움직임·반대로(action) */
      var errorType = '';
      if (!ok) {
        var moved = false, missed = false;
        F.forEach(function (f, i) {
          if (R.state[i] !== c.target[i]) {
            if (c.before[i] === c.target[i]) moved = true; else missed = true;
          }
        });
        errorType = moved ? 'inhibition' : (missed ? 'action' : '');
      }
      log('game-response', {
        itemId: p.id + '-' + (R.idx + 1), command: c.text, correct: ok, response: respText(R.state),
        expected: respText(c.target), before: respText(c.before), noChange: noChange,
        attempt: R.errs + 1, errorType: errorType, accuracy: acc, moves: R.moves, responseMs: Math.round(t - R.tCmd)
      });
      if (ok) {
        if (R.errs === 0) R.rts.push(t - R.tCmd);
        R.acc.push(acc);
        sfx('ok');
        setJelly('jelly-praise');
        elFigure.classList.remove('is-ok');
        void elFigure.offsetWidth;
        elFigure.classList.add('is-ok');
        sayTemp(noChange && R.moves === 0 ? T.held : pick(T.good), 'is-good');
        R.phase = 'wait';
        R.idx++;
        nextTimer = setTimeout(function () {
          R.phase = 'run';
          if (R.idx >= p.count) roundDone(); else showCommand();
        }, reduced ? 250 : 650);
        return;
      }
      R.errs++;
      R.wrong++;
      if (errorType === 'inhibition') R.inhibitFail++;
      sfx('again');
      wob(elCall);
      wob(elFigure);
      setJelly('jelly-thinking');
      R.state = c.before.slice();
      R.moves = 0;
      paintFlags();
      if (R.errs === 1) {
        sayTemp(T.oops);
      } else {
        /* 맞는 단추를 금색으로, 말로도 알려 줌 */
        var parts = F.map(function (f, i) {
          var told = c.ops.some(function (op) { return op.f === i && op.act !== 'keep'; });
          var cue = c.before[i] !== c.target[i] ? (c.target[i] ? T.cueUp : T.cueDown)
                  : (told ? (c.target[i] ? T.cueAlreadyUp : T.cueAlreadyDown) : T.cueKeep);
          if (c.before[i] !== c.target[i]) {
            var seg = root.querySelector('.fg-seg[data-flag="' + i + '"][data-dir="' + (c.target[i] ? 'up' : 'down') + '"]');
            if (seg) seg.classList.add('is-cue');
          }
          return eun(f.name) + ' ' + cue;
        });
        setJelly('jelly-puzzle');
        say(parts.join(', ') + '.');
        log('game-help', { itemId: p.id + '-' + (R.idx + 1), helpLevel: 'A4', helpType: 'answer-cue', trigger: 'second-miss' });
      }
    }

    function burst() {
      if (reduced) return;
      var colors = ['#ffd23f', '#3ddc97', '#8b72ff', '#2f6fe4', '#ffffff', '#ff9f43'];
      for (var i = 0; i < 18; i++) {
        var b = h('i', 'fg-bit');
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
      R.cmd = null;
      elPads.hidden = true;
      elProg.hidden = true;
      elCall.className = 'fg-call is-wait';
      elCall.innerHTML = '🎉';
      setJelly('jelly-praise');
      sfx('done');
      burst();
      var count = { accurate: 0, 'self-corrected': 0, support: 0 };
      R.acc.forEach(function (a) { count[a]++; });
      var summary = {
        itemId: p.id, level: p.level, count: p.count,
        accurate: count.accurate, selfCorrected: count['self-corrected'], support: count.support,
        wrongSubmits: R.wrong, inhibitionErrors: R.inhibitFail,
        totalMs: Math.round(now() - R.tStart), medianRtMs: median(R.rts)
      };
      results.push(summary);
      log('game-item-complete', summary);
      if (typeof o.onRoundEnd === 'function') { try { o.onRoundEnd(summary); } catch (e) {} }
      say(fmt(T.allDone, { n: p.count }), 'is-good');
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
      elEnd.querySelector('.fg-end-line').textContent = fmt(T.endLine, { n: plans.length });
      var st = elEnd.querySelector('.fg-stamps');
      st.innerHTML = '';
      plans.forEach(function () { st.appendChild(h('span', 'fg-dot is-done', '🚩')); });
      var acts = elEnd.querySelector('.fg-btns');
      acts.innerHTML = '';
      if (o.restartButton) acts.appendChild(button('↺ ' + esc(T.again), 'restart', 'is-soft'));
      log('game-activity-complete', {
        rounds: plans.length,
        commands: results.reduce(function (s, r) { return s + r.count; }, 0),
        accurate: results.reduce(function (s, r) { return s + r.accurate; }, 0),
        selfCorrected: results.reduce(function (s, r) { return s + r.selfCorrected; }, 0),
        support: results.reduce(function (s, r) { return s + r.support; }, 0),
        inhibitionErrors: results.reduce(function (s, r) { return s + r.inhibitionErrors; }, 0)
      });
      if (typeof o.onFinish === 'function') { try { o.onFinish(results.slice()); } catch (e) {} }
    }

    function restart() {
      clearTimeout(nextTimer);
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
      if (name === 'start' && R.phase === 'ready') { startRun(); }
      else if (name === 'submit') submit();
      else if (name === 'next') startRound(ri + 1);
      else if (name === 'finish') finish();
    }

    function onClick(e) {
      var b = e.target.closest('[data-fg-act]');
      if (b && root.contains(b)) { act(b.getAttribute('data-fg-act')); return; }
      var seg = e.target.closest('.fg-seg');
      if (seg && root.contains(seg)) { setFlag(+seg.getAttribute('data-flag'), seg.getAttribute('data-dir') === 'up'); return; }
      if (R && R.phase === 'run' && e.target.closest('.fg-figure')) {
        sayTemp(T.run);
        wob(elPads);
      }
    }
    /* 키보드: 1 청기↑ 2 청기↓ 3 백기↑ 4 백기↓, Enter 됐어요 */
    function onKey(e) {
      if (!R || R.phase !== 'run' || e.repeat) return;
      var a = document.activeElement;
      if (a && a !== document.body && !root.contains(a)) return;
      var map = { '1': [0, true], '2': [0, false], '3': [1, true], '4': [1, false] };
      if (map[e.key]) { e.preventDefault(); setFlag(map[e.key][0], map[e.key][1]); }
      else if (e.key === 'Enter' && (!a || a === document.body)) {
        e.preventDefault();
        var s = elActs.querySelector('[data-fg-act="submit"]');
        if (s) s.click();
      }
    }

    root.addEventListener('click', onClick);
    global.addEventListener('keydown', onKey);

    restart();

    return {
      root: root,
      restart: restart,
      results: function () { return results.slice(); },
      parse: parse,
      destroy: function () {
        clearTimeout(tempTimer); clearTimeout(nextTimer);
        global.removeEventListener('keydown', onKey);
        root.remove();
      }
    };
  }

  global.FlagGame = { version: VERSION, mount: mount };
})(window);
