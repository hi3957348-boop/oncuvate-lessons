/*!
 * 「젤리 컬링 팀전」 여러 기기 · 코치 진행  v1.0.0 (파일럿)
 *
 * 얼음판 물리·그림은 shared/curling.js(원본 엔진 사본)의 Curling.sim / Curling.draw 를 그대로 쓴다 — 먼저 불러야 한다.
 *
 * 규칙
 *   빨강 팀 · 파랑 팀. 한 판(엔드)에 팀마다 돌 stonesPerTeam(4)개, 번갈아 던진다(먼저 던지는 팀부터).
 *   팀 안에서는 아이들이 차례로 돌아가며 던진다(아이가 적으면 같은 아이가 또 던짐).
 *   돌끼리 부딪쳐 밀려나는 것은 원본 물리 그대로. 과녁 앞에 못 미친 돌은 멈춘 뒤 치운다(원본 clearShort).
 *   다 던지면: 가운데에 가장 가까운 돌의 팀만, 상대 팀의 가장 가까운 돌보다 더 가까운 자기 돌 수(과녁 안 돌만)만큼 점수.
 *   한 판 더: 점수는 쌓이고, 먼저 던지는 팀은 지난 판에 점수를 못 낸 팀(0:0이면 그대로).
 *
 * 수업방(두 길)
 *   ① Firebase 실시간 DB  — <fbRoot>/<방>/{meta, players, game, throw}. 방은 3시간. 방 만들기는 transaction.
 *   ② 이 브라우저 안 연습 방 — file:// 이거나 Firebase 에 못 붙으면 localStorage + storage 이벤트로 같은 브라우저 탭끼리.
 *
 * 던지기 맞추기
 *   던진 아이 기기가 throw = {id, power, aim, by} 를 올림(id = 경기번호-판-차례, 같은 id 는 한 번만).
 *   모든 화면이 game.stones(같은 시작 자리)에서 같은 물리로 굴린다(30ms 고정 틱 — 틱 수로 정해지므로 기기 빠르기와 무관).
 *   굴림이 끝나면 던진 아이 기기가 최종 돌 자리 + 다음 차례를 game 에 transaction 으로 올림(차례 번호가 맞을 때만).
 *   다른 화면은 올라온 최종 자리로 맞춘다. 던진 아이가 끊기면 코치 기기가 2.5초 뒤 대신 마무리(같은 조건의 transaction).
 *
 * 크롬 109(클래스인) 하한: 새 문법을 쓰지 않았다. 아이 화면 그림은 SVG·젤리 이미지만(이모지 없음), SVG 색은 글자값(hex).
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var C = global.Curling;
  if (!C || !C.sim || !C.draw) throw new Error('shared/curling.js(팀전 사본)를 team.js 보다 먼저 불러 주세요');
  var S = C.sim, D = C.draw, SFX = D.SFX;
  var LIFE = 3 * 60 * 60 * 1000;
  var DT = S.DT, TICK = S.TICK_MS, QUICK = 4, AIM_STEP = 3, AIM_MAX = 30, SX_STEP = 3, SX_MIN = 34, SX_MAX = 66;
  var HOUSE = { x: 50, y: S.HOUSE_Y, r: [S.RING[0], S.RING[1], S.RING[2]] };
  var MAX_ENDS = 3;   // 3판이면 경기 끝

  var TEAM = {
    red:  { name: '빨강 팀', fill: '#ff7a7a', stroke: '#d64545', inner: '#ffe0e0', dark: '#c23b3b', soft: '#fff0f0' },
    blue: { name: '파랑 팀', fill: '#5aa9ff', stroke: '#2f6fd1', inner: '#dcecff', dark: '#2a62c0', soft: '#edf5ff' }
  };
  function other(t) { return t === 'red' ? 'blue' : 'red'; }

  var TEXT = {
    title: '젤리 컬링 팀전',
    pickRole: '누구인가요?',
    coach: '코치',
    kid: '아이',
    coachCode: '코치 번호',
    makeRoom: '방 만들기',
    wrongCode: '코치 번호가 달라요.',
    roomNo: '방 번호',
    next: '다음',
    noRoom: '그 방이 없어요. 방 번호를 다시 봐요.',
    pickName: '내 이름을 골라요',
    back: '뒤로',
    connecting: '연결하는 중…',
    localMode: '이 브라우저 안 연습 방',
    waitStart: '코치님이 시작하면 시작해요.',
    myTurn: '내 차례!',
    turnOf: '{name} 차례',
    aimGo: '얼음을 눌러 방향을 정하고, 돌을 꾹 눌러요.',
    holding: '알맞을 때 떼요!',
    watch: '잘 봐요.',
    sliding: '돌이 가요!',
    quick: '꾹 누르고 있다가 떼요.',
    aimTip: '얼음을 누르면 방향',
    hold: '꾹 누르기',
    endNo: '{n} / 3판',
    points: '{team} {n}점!',
    blank: '이번 판은 0 : 0',
    blankLine: '과녁 안에 돌이 없어요.',
    winLine: '{team} 돌이 가운데에 가장 가까워요!',
    waitMore: '코치님이 다음 판을 열어요.',
    autoSplit: '팀 자동 나누기',
    startGame: '경기 시작',
    skipTurn: '이번 차례 넘기기',
    oneMore: '한 판 더',
    restart: '처음부터',
    restartSure: '한 번 더 누르면 처음부터',
    needBoth: '두 팀에 한 명씩은 있어야 해요.',
    tapSwap: '아이를 누르면 팀이 바뀌어요.',
    nobody: '아직 아무도 없어요.',
    history: '판별 점수',
    stones: '돌',
    soundOn: '소리 끄기',
    soundOff: '소리 켜기'
  };

  /* ───────────── 스타일(팀전에 더하는 것 — 얼음판·단추 모양은 엔진 CSS 그대로) ───────────── */
  var CSS = [
    'html,body{height:100%;margin:0}',
    '.ct-host{position:fixed;inset:0;padding:8px;box-sizing:border-box}',
    '.ct-root{min-height:0}',
    '.ct-wrap{--arena:min(calc(100cqh - 24px),54cqw);height:100%;display:grid;grid-template-columns:var(--arena) minmax(0,1fr);gap:14px;padding:12px}',
    '.ct-root.is-coach .ct-wrap{--arena:min(calc(100cqh - 24px),50cqw)}',
    '.ct-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:8px}',
    '.ct-chip{flex:none;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border-radius:99px;font-size:13px;font-weight:900;white-space:nowrap}',
    '.ct-chip i{width:12px;height:12px;border-radius:50%}',
    '.ct-score{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}',
    '.ct-sc{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 12px;border-radius:14px;font-weight:900}',
    '.ct-sc b{font-size:clamp(13px,3.6cqh,16px)}',
    '.ct-sc strong{font-size:clamp(24px,8cqh,40px);line-height:1}',
    '.ct-sc.is-red{background:#fff0f0;color:#c23b3b;box-shadow:inset 0 0 0 2px #ffc2c2}',
    '.ct-sc.is-blue{background:#edf5ff;color:#2a62c0;box-shadow:inset 0 0 0 2px #b9d6ff}',
    '.ct-endno{font-size:13px;font-weight:900;color:#6f7789;white-space:nowrap}',
    '.ct-turn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:6px 12px;border-radius:14px;text-align:center;',
    'font-size:clamp(15px,4.6cqh,21px);font-weight:900;letter-spacing:-.02em;background:#f3effd;color:#3b2a9e;box-shadow:inset 0 0 0 2px #e6dffa}',
    '.ct-turn.is-red{background:#fff0f0;color:#c23b3b;box-shadow:inset 0 0 0 2px #ffb3b3}',
    '.ct-turn.is-blue{background:#edf5ff;color:#2a62c0;box-shadow:inset 0 0 0 2px #a9ccff}',
    '.ct-turn.is-me{animation:ct-pulse 1.1s ease-in-out infinite alternate}',
    '.ct-turn small{font-size:.72em;opacity:.85}',
    '.ct-pips{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(4px,1.6cqh,10px);padding:6px 10px;',
    'border-radius:16px;background:#f7f4ff;box-shadow:inset 0 0 0 2px #ece6fb}',
    '.ct-pips .cu-row b{min-width:4.6em}',
    '.ct-pips .cu-pips i.red{background:radial-gradient(circle at 50% 50%,#ffe0e0 0 38%,#ff7a7a 40%);box-shadow:0 2px 0 #d64545}',
    '.ct-pips .cu-pips i.blue{background:radial-gradient(circle at 50% 50%,#dcecff 0 38%,#5aa9ff 40%);box-shadow:0 2px 0 #2f6fd1}',
    '.ct-pips .cu-pips i.used{opacity:.22}',
    '.ct-team-line{font-size:clamp(12px,3.4cqh,15px);font-weight:800;color:#6f7789;text-align:center}',
    '.ct-foot{margin-top:auto;display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:800;color:#8a90a0;white-space:nowrap}',
    '.ct-foot .ct-local{color:#b07a00}',
    '.ct-result{position:absolute;left:50%;top:60%;z-index:6;transform:translate(-50%,-50%);max-width:90%;padding:.35em 1em;border-radius:99px;white-space:nowrap;',
    'font-size:clamp(18px,8cqmin,34px);font-weight:900;letter-spacing:-.02em;background:#fff8e8;color:#3b2a9e;box-shadow:0 4px 0 rgba(27,20,98,.35),0 0 0 3px rgba(255,255,255,.3);',
    'pointer-events:none;animation:cu-pop .35s cubic-bezier(.3,1.5,.5,1)}',
    '.ct-result.is-red{background:#fff0f0;color:#c23b3b}.ct-result.is-blue{background:#edf5ff;color:#2a62c0}',
    '.ct-glow{animation:ct-glow .7s ease-in-out infinite alternate}',
    '.ct-live{position:absolute;left:50%;bottom:10px;z-index:5;transform:translateX(-50%);padding:.3em .9em;border-radius:99px;background:#ffffff;color:#3b3170;font-size:15px;font-weight:900;white-space:nowrap;box-shadow:0 3px 0 rgba(27,20,98,.25)}',
    '.ct-live.is-red{color:#c0392b;box-shadow:0 0 0 3px #f8b4ac,0 3px 0 rgba(27,20,98,.25)}',
    '.ct-live.is-blue{color:#1f5fbf;box-shadow:0 0 0 3px #a9c8f5,0 3px 0 rgba(27,20,98,.25)}',
    '@keyframes ct-glow{from{opacity:.2}to{opacity:1}}',
    '@keyframes ct-pulse{from{filter:none}to{filter:brightness(1.07) saturate(1.2)}}',
    '.cu-arena.is-locked{cursor:default}',
    /* 첫 화면 · 들어가기 */
    '.ct-join{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;text-align:center}',
    '.ct-join h1{margin:0;font-size:clamp(22px,6cqh,32px);font-weight:900;letter-spacing:-.03em;color:#3b2a9e}',
    '.ct-join p{margin:0;font-size:clamp(14px,3.8cqh,18px);font-weight:800;color:#6f7789}',
    '.ct-join .ct-err{color:#d64545;min-height:1.3em}',
    '.ct-join-img{width:clamp(60px,16cqh,96px);height:clamp(60px,16cqh,96px);object-fit:contain}',
    '.ct-roles{display:flex;gap:16px}',
    '.ct-role{font:inherit;min-width:150px;min-height:72px;font-size:22px;font-weight:900;border:0;border-radius:18px;cursor:pointer;color:#fff;',
    'background:linear-gradient(135deg,#5b48d6,#8b72ff);box-shadow:0 5px 0 #3b2a9e}',
    '.ct-role.is-kid{background:linear-gradient(135deg,#16a06a,#3ddc97);box-shadow:0 5px 0 #0e7a50}',
    '.ct-role:active{transform:translateY(3px);box-shadow:0 2px 0 #3b2a9e}',
    '.ct-role[disabled]{opacity:.45;cursor:default}',
    '.ct-field{display:flex;align-items:center;gap:10px}',
    '.ct-input{font:inherit;width:9.5em;height:52px;padding:0 14px;border:0;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 2px #cfc3ee;',
    'font-size:24px;font-weight:900;letter-spacing:.12em;text-align:center;color:#3b2a9e}',
    '.ct-input:focus{outline:none;box-shadow:inset 0 0 0 3px #8b72ff}',
    '.ct-names{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:min(640px,100%)}',
    '.ct-name{font:inherit;min-height:46px;padding:0 6px;border:0;border-radius:14px;cursor:pointer;font-size:clamp(14px,3.8cqh,17px);font-weight:900;',
    'color:#3b2a9e;background:#fff;box-shadow:0 4px 0 #cfc3ee}',
    '.ct-name:active{transform:translateY(2px);box-shadow:0 2px 0 #cfc3ee}',
    '.ct-name[disabled]{opacity:.35;cursor:default;box-shadow:none;background:#eeeaf7}',
    '.ct-join .cu-btn{touch-action:manipulation}',
    '.ct-ctrl{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
    '.ct-ctrl-row{display:flex;align-items:center;gap:5px;padding:4px 6px;border-radius:12px;background:#f3effe}',
    '.ct-ctrl-row span{flex:1;color:#4b24a5;font-size:12.5px;font-weight:900;white-space:nowrap}',
    '.ct-cb{display:grid;place-items:center;width:34px;height:30px;padding:0;border:2px solid #d4cdf0;border-radius:10px;background:#fff;cursor:pointer;touch-action:manipulation}',
    '.ct-cb svg{width:18px;height:18px}',
    '.ct-cb:disabled{opacity:.4;cursor:default}',
    /* 코치 칸 */
    '.ct-room{display:flex;align-items:baseline;gap:8px;font-weight:900;color:#3b2a9e}',
    '.ct-room b{font-size:13px;color:#6f7789}',
    '.ct-room strong{font-size:30px;letter-spacing:.14em}',
    '.ct-roster{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.ct-col{min-height:0;overflow:auto;display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:14px}',
    '.ct-col.is-red{background:#fff0f0;box-shadow:inset 0 0 0 2px #ffc2c2}.ct-col.is-blue{background:#edf5ff;box-shadow:inset 0 0 0 2px #b9d6ff}',
    '.ct-col h3{margin:0 0 2px;font-size:15px;font-weight:900}',
    '.ct-col.is-red h3{color:#c23b3b}.ct-col.is-blue h3{color:#2a62c0}',
    '.ct-kid{font:inherit;display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:38px;padding:0 10px;border:0;border-radius:10px;cursor:pointer;',
    'font-size:15px;font-weight:900;color:#27344e;background:#fff;box-shadow:0 2px 0 rgba(0,0,0,.08)}',
    '.ct-kid.is-now{box-shadow:inset 0 0 0 3px #ffd23f}',
    '.ct-kid.is-off{opacity:.45}',
    '.ct-kid em{font-style:normal;font-size:12px;color:#6f7789}',
    '.ct-tip{font-size:12px;font-weight:800;color:#8a90a0}',
    '.ct-cbtns{display:flex;flex-wrap:wrap;gap:8px}',
    '.ct-cbtns .cu-btn{min-height:44px;font-size:16px;padding:0 14px;touch-action:manipulation}',
    '.ct-cbtns .cu-btn[disabled]{opacity:.38;pointer-events:none}',
    '.ct-cbtns .cu-btn.is-warn{background:linear-gradient(135deg,#d64545,#ff7a7a);box-shadow:0 4px 0 #a52f2f}',
    '.ct-hist{font-size:13px;font-weight:800;color:#6f7789;min-height:1.2em}',
    '.ct-msg{font-size:13px;font-weight:900;color:#d64545;min-height:1.2em}'
  ].join('\n');

  /* ───────────── 작은 도구 ───────────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(t, map) { return String(t).replace(/\{(\w+)\}/g, function (m, k) { return map[k] != null ? map[k] : m; }); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clone(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
  function r3(n) { return Math.round(n * 1000) / 1000; }
  function r2(n) { return Math.round(n * 100) / 100; }
  function arr(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(function (x) { return x != null; });
    return Object.keys(v).sort(function (a, b) { return a - b; }).map(function (k) { return v[k]; }).filter(function (x) { return x != null; });
  }
  function pathGet(o, p) {
    if (!p) return o == null ? null : o;
    var a = p.split('/');
    for (var i = 0; i < a.length; i++) { if (o == null) return null; o = o[a[i]]; }
    return o === undefined ? null : o;
  }
  function pathSet(o, p, v) {
    var a = p.split('/'), cur = o;
    for (var i = 0; i < a.length - 1; i++) {
      if (cur[a[i]] == null || typeof cur[a[i]] !== 'object') cur[a[i]] = {};
      cur = cur[a[i]];
    }
    if (v == null) delete cur[a[a.length - 1]]; else cur[a[a.length - 1]] = v;
  }
  function randRoom() { return String(10000 + Math.floor(Math.random() * 90000)); }
  function randId() { return 'k' + Math.random().toString(36).slice(2, 10); }

  /* ───────────── 저장소 ① 이 브라우저 안 연습 방(localStorage) ───────────── */
  function LocalStore(prefix) {
    var subs = [], room = '', fireT = null;
    function key(r) { return prefix + (r || room); }
    function read(r) { try { return JSON.parse(localStorage.getItem(key(r)) || 'null'); } catch (e) { return null; } }
    function writeAll(v) { try { localStorage.setItem(key(), JSON.stringify(v)); } catch (e) {} fire(); }
    function fire() {
      if (fireT) return;
      fireT = setTimeout(function () {
        fireT = null;
        var data = read();
        subs.forEach(function (s) {
          var v = pathGet(data, s.path), j = JSON.stringify(v);
          if (j !== s.last) { s.last = j; try { s.cb(clone(v)); } catch (e) { if (global.console) console.error(e); } }
        });
      }, 0);
    }
    global.addEventListener('storage', function (e) { if (room && e.key === key()) fire(); });
    function sweep() {
      try {
        var now = Date.now(), dead = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(prefix) === 0) {
            var v = null; try { v = JSON.parse(localStorage.getItem(k)); } catch (e) {}
            if (!v || !v.meta || v.meta.expiresAt < now) dead.push(k);
          }
        }
        dead.forEach(function (k2) { localStorage.removeItem(k2); });
      } catch (e) {}
    }
    return {
      kind: 'local',
      createRoom: function (r) {
        sweep();
        var now = Date.now(), cur = read(r);
        if (cur && cur.meta && cur.meta.expiresAt > now) return Promise.reject(new Error('room-exists'));
        try { localStorage.setItem(key(r), JSON.stringify({ meta: { status: 'open', createdAt: now, expiresAt: now + LIFE } })); }
        catch (e) { return Promise.reject(e); }
        return Promise.resolve(r);
      },
      roomOpen: function (r) {
        var cur = read(r);
        return Promise.resolve(!!(cur && cur.meta && cur.meta.status === 'open' && cur.meta.expiresAt > Date.now()));
      },
      use: function (r) { room = r; },
      on: function (path, cb) { subs.push({ path: path, cb: cb, last: undefined }); fire(); },
      set: function (path, v) { var d = read() || {}; pathSet(d, path, clone(v)); writeAll(d); return Promise.resolve(); },
      txn: function (path, fn) {
        var d = read() || {}, cur = clone(pathGet(d, path)), nv = fn(cur);
        if (nv === undefined) return Promise.resolve({ committed: false, value: cur });
        pathSet(d, path, clone(nv)); writeAll(d);
        return Promise.resolve({ committed: true, value: clone(nv) });
      },
      presence: function (path) { return this.set(path, true); },
      removeRoom: function (r) { try { localStorage.removeItem(key(r)); } catch (e) {} return Promise.resolve(); }
    };
  }

  /* ───────────── 저장소 ② Firebase 실시간 DB ───────────── */
  function loadFire(cfg) {
    var base = 'https://www.gstatic.com/firebasejs/12.2.1/';
    var timeout = new Promise(function (res, rej) { setTimeout(function () { rej(new Error('timeout')); }, cfg.connectMs || 7000); });
    var go = Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-database.js')]).then(function (m) {
      var A = m[0], F = m[1];
      var app = A.getApps().filter(function (a) { return a.name === 'curling-team-pilot'; })[0] || A.initializeApp(cfg.firebase, 'curling-team-pilot');
      var db = F.getDatabase(app);
      return new Promise(function (res) {
        F.onValue(F.ref(db, '.info/connected'), function (s) { if (s.val() === true) res(makeFire(F, db, cfg.fbRoot)); });
      });
    });
    return Promise.race([go, timeout]);
  }
  function makeFire(F, db, ROOT) {
    var room = '';
    function R(path) { return F.ref(db, ROOT + '/' + room + (path ? '/' + path : '')); }
    return {
      kind: 'fire',
      createRoom: function (r) {
        var now = Date.now();
        return F.runTransaction(F.ref(db, ROOT + '/' + r + '/meta'), function (cur) {
          if (cur && Number(cur.expiresAt || 0) > now) return;
          return { lesson: 'curling-team', status: 'open', createdAt: now, expiresAt: now + LIFE };
        }, { applyLocally: false }).then(function (res) {
          if (!res.committed) throw new Error('room-exists');
          return Promise.all(['players', 'game', 'throw'].map(function (p) { return F.remove(F.ref(db, ROOT + '/' + r + '/' + p)); }));
        }).then(function () { return r; });
      },
      roomOpen: function (r) {
        return F.get(F.ref(db, ROOT + '/' + r + '/meta')).then(function (s) {
          var m = s.val();
          return !!(m && m.status === 'open' && Number(m.expiresAt || 0) > Date.now());
        });
      },
      use: function (r) { room = r; },
      on: function (path, cb) { F.onValue(R(path), function (s) { cb(s.val()); }); },
      set: function (path, v) { return F.set(R(path), clone(v)); },
      txn: function (path, fn) {
        return F.runTransaction(R(path), function (cur) { return fn(clone(cur)); }).then(function (res) {
          return { committed: res.committed, value: res.snapshot.val() };
        });
      },
      presence: function (path) { var rf = R(path); return F.set(rf, true).then(function () { return F.onDisconnect(rf).set(false); }); },
      removeRoom: function (r) { return F.remove(F.ref(db, ROOT + '/' + r)); }
    };
  }

  /* ───────────── 규칙(순수 함수) ───────────── */
  function norm(g) {
    g = g || {};
    g.stones = arr(g.stones);
    g.history = arr(g.history);
    g.score = g.score || {}; g.score.red = g.score.red || 0; g.score.blue = g.score.blue || 0;
    g.thrown = g.thrown || {}; g.thrown.red = g.thrown.red || 0; g.thrown.blue = g.thrown.blue || 0;
    g.ptr = g.ptr || {}; g.ptr.red = g.ptr.red || 0; g.ptr.blue = g.ptr.blue || 0;
    g.turn = g.turn || 0; g.endNo = g.endNo || 1; g.first = g.first || 'red';
    return g;
  }
  function members(players, team) {
    var out = [];
    Object.keys(players || {}).forEach(function (pid) {
      var p = players[pid];
      if (p && p.team === team) out.push({ pid: pid, at: p.at || 0, name: p.name });
    });
    out.sort(function (a, b) { return a.at - b.at || (a.pid < b.pid ? -1 : 1); });
    return out;
  }
  function pickThrower(g, team, players) {
    var list = members(players, team);
    if (!list.length) return null;
    return list[g.ptr[team] % list.length].pid;
  }
  /* 다 던진 판의 점수 — glow: 점수가 된 돌의 번호(stones 안 순서) */
  function scoreEnd(stones) {
    var inH = [];
    stones.forEach(function (s, i) {
      if (S.starsAt(HOUSE, s) >= 1) inH.push({ i: i, d: S.distTo(HOUSE, s), t: s.t });
    });
    if (!inH.length) return { win: '', pts: 0, glow: [], red: 0, blue: 0 };
    inH.sort(function (a, b) { return a.d - b.d; });
    var win = inH[0].t, otherMin = Infinity;
    inH.forEach(function (q) { if (q.t !== win && q.d < otherMin) otherMin = q.d; });
    var glow = inH.filter(function (q) { return q.t === win && q.d < otherMin; }).map(function (q) { return q.i; });
    var r = { win: win, pts: glow.length, glow: glow, red: 0, blue: 0 };
    r[win] = glow.length;
    return r;
  }
  function startTurnOrFinish(g, players, N) {
    for (var guard = 0; guard < 2 * N + 2; guard++) {
      if (g.turn >= 2 * N) {
        var r = scoreEnd(g.stones);
        g.status = 'result';
        g.result = r;
        if (r.win) g.score[r.win] += r.pts;
        g.history.push({ red: r.red, blue: r.blue });
        g.thrower = null;
        if (g.endNo >= MAX_ENDS) g.over = true;
        return g;
      }
      g.team = g.turn % 2 === 0 ? g.first : other(g.first);
      g.thrower = pickThrower(g, g.team, players);
      if (g.thrower) return g;
      g.turn++;                     // 그 팀에 아무도 없으면 그 돌은 건너뜀
    }
    return g;
  }
  function advance(g, finalStones, players, N) {
    var t = g.team;
    g.stones = finalStones;
    g.thrown[t]++;
    g.ptr[t]++;
    g.turn++;
    g.result = null;
    return startTurnOrFinish(g, players, N);
  }
  function idOf(g) { return g ? (g.gen || 0) + '-' + g.endNo + '-' + g.turn : ''; }

  function teamStone(t, glow) {
    var c = TEAM[t] || TEAM.red;
    return (glow ? '<circle class="ct-glow" r="5.6" fill="#ffd23f" fill-opacity="0.35" stroke="#ffd23f" stroke-width="1.1"/>' : '') +
      '<ellipse cx="0" cy="1.1" rx="3.3" ry="2.6" fill="#1b1462" fill-opacity="0.18"/>' +
      '<circle r="3.2" fill="' + c.fill + '" stroke="' + c.stroke + '" stroke-width="0.6"/>' +
      '<circle r="2.1" fill="' + c.inner + '"/>' +
      '<rect x="-1.5" y="-0.5" width="3" height="1" rx="0.5" fill="' + c.stroke + '"/>';
  }

  /* ───────────── 화면 ───────────── */
  function mount(host, cfg) {
    D.injectCSS();
    if (!document.getElementById('ct-style')) { var st = document.createElement('style'); st.id = 'ct-style'; st.textContent = CSS; document.head.appendChild(st); }
    cfg = cfg || {};
    var N = cfg.stonesPerTeam || 4, BAR_MS = cfg.barMs || 1400;
    var NAMES = cfg.names || [];
    var T = {}, k;
    for (k in TEXT) T[k] = TEXT[k];
    for (k in cfg.texts || {}) T[k] = cfg.texts[k];
    var coachBase = cfg.coachBase || 'assets/images/jelly/';
    function jelly(m) { return coachBase + m + '.webp'; }
    var reduced = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    host.classList.add('ct-host');
    var root = h('div', 'cu-root ct-root');
    root.setAttribute('data-activity-id', cfg.activityId || 'curling-team');
    root.setAttribute('data-inhibition-load', 'primary');
    host.appendChild(root);

    var soundOn = true;
    try { var sv = sessionStorage.getItem('curling-team:sound'); if (sv !== null) soundOn = sv === '1'; } catch (e) {}
    function sfx(n, a) { if (soundOn) { try { SFX[n](a); } catch (e) {} } }
    function log(type, detail) {
      var d = { type: type, schemaVersion: '0.2', activityId: cfg.activityId || 'curling-team' };
      for (var kk in detail) d[kk] = detail[kk];
      try { global.dispatchEvent(new CustomEvent('oncuvate:log', { detail: d })); } catch (e) {}
    }

    /* 상태 */
    var store = null, role = '', room = '', me = '', myName = '';
    var P = {}, G = null, TH = null;
    var POS = null;
    var K = { phase: 'idle', aim: 0, power: 0, dir: 1, holdTicks: 0, forId: '', sx: S.START_X };
    var A = null, W = null, done = {}, animT = null, holdT = null, aimDrag = false, seenResult = {};
    var el = {};

    function sess(v) {
      try {
        if (v === undefined) return JSON.parse(sessionStorage.getItem('curling-team:sess') || 'null');
        if (v === null) sessionStorage.removeItem('curling-team:sess'); else sessionStorage.setItem('curling-team:sess', JSON.stringify(v));
      } catch (e) { return null; }
    }

    /* ── 저장소 고르기 ── */
    var qs = global.location.search || '';
    var wantLocal = global.location.protocol === 'file:' || /[?&]local=1/.test(qs) || !cfg.firebase;
    var storeReady = (wantLocal ? Promise.reject(new Error('local')) : loadFire(cfg)).then(function (s) { return s; }, function () {
      return LocalStore('curling-team:local:');
    }).then(function (s) { store = s; global.__curlingTeamStore = s; return s; });

    /* ── 첫 화면 ── */
    function showRoles() {
      root.classList.remove('is-coach');
      root.innerHTML =
        '<section class="ct-join">' +
          '<img class="ct-join-img" alt="" aria-hidden="true" src="' + esc(jelly('jelly-default')) + '">' +
          '<h1>' + esc(T.title) + '</h1>' +
          '<p class="ct-status">' + esc(T.connecting) + '</p>' +
          '<div class="ct-roles">' +
            '<button type="button" class="ct-role" data-role="coach" disabled>' + esc(T.coach) + '</button>' +
            '<button type="button" class="ct-role is-kid" data-role="kid" disabled>' + esc(T.kid) + '</button>' +
          '</div>' +
        '</section>';
      storeReady.then(function () {
        var stEl = root.querySelector('.ct-status');
        if (!stEl) return;
        stEl.textContent = T.pickRole;
        Array.prototype.forEach.call(root.querySelectorAll('.ct-role'), function (b) {
          b.disabled = false;
          b.addEventListener('click', function () { sfx('pick'); if (b.getAttribute('data-role') === 'coach') showCoachGate(); else showKidRoom(); });
        });
        if (store.kind === 'local') root.querySelector('.ct-join').appendChild(h('p', 'ct-local-note', '<small>' + esc(T.localMode) + '</small>'));
      });
    }
    function modeNote() { return store && store.kind === 'local' ? '<p><small style="color:#b07a00">' + esc(T.localMode) + '</small></p>' : ''; }

    function showCoachGate() {
      root.innerHTML =
        '<section class="ct-join">' +
          '<h1>' + esc(T.coach) + '</h1>' +
          '<p>' + esc(T.coachCode) + '</p>' +
          '<div class="ct-field"><input class="ct-input" type="password" inputmode="numeric" autocomplete="off" maxlength="12" aria-label="' + esc(T.coachCode) + '">' +
          '<button type="button" class="cu-btn" data-go>' + esc(T.makeRoom) + '</button></div>' +
          '<p class="ct-err"></p>' +
          '<button type="button" class="cu-btn is-soft" data-back>' + esc(T.back) + '</button>' + modeNote() +
        '</section>';
      var inp = root.querySelector('.ct-input'), err = root.querySelector('.ct-err'), go = root.querySelector('[data-go]');
      inp.focus();
      function submit() {
        if (inp.value.replace(/\D/g, '') !== String(cfg.coachCode)) { err.textContent = T.wrongCode; return; }
        go.disabled = true; err.textContent = '';
        makeRoom(0).then(function (r) {
          room = r; role = 'coach'; me = 'coach';
          sess({ role: 'coach', room: r });
          enterCoach();
        }, function (e) { go.disabled = false; err.textContent = '방을 만들지 못했어요. (' + (e && e.message || '') + ')'; });
      }
      go.addEventListener('click', submit);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      root.querySelector('[data-back]').addEventListener('click', showRoles);
    }
    function makeRoom(n) {
      var r = randRoom();
      return store.createRoom(r).then(function () { return r; }, function (e) {
        if (e && e.message === 'room-exists' && n < 6) return makeRoom(n + 1);
        throw e;
      });
    }

    function showKidRoom(msg) {
      root.innerHTML =
        '<section class="ct-join">' +
          '<img class="ct-join-img" alt="" aria-hidden="true" src="' + esc(jelly('jelly-look')) + '">' +
          '<h1>' + esc(T.roomNo) + '</h1>' +
          '<div class="ct-field"><input class="ct-input" type="text" inputmode="numeric" autocomplete="off" maxlength="5" aria-label="' + esc(T.roomNo) + '">' +
          '<button type="button" class="cu-btn" data-go>' + esc(T.next) + '</button></div>' +
          '<p class="ct-err">' + esc(msg || '') + '</p>' +
          '<button type="button" class="cu-btn is-soft" data-back>' + esc(T.back) + '</button>' + modeNote() +
        '</section>';
      var inp = root.querySelector('.ct-input'), err = root.querySelector('.ct-err'), go = root.querySelector('[data-go]');
      inp.focus();
      inp.addEventListener('input', function () { inp.value = inp.value.replace(/\D/g, '').slice(0, 5); });
      function submit() {
        var r = inp.value.replace(/\D/g, '');
        if (r.length !== 5) { err.textContent = T.noRoom; return; }
        go.disabled = true;
        store.roomOpen(r).then(function (ok) {
          if (!ok) { go.disabled = false; err.textContent = T.noRoom; return; }
          room = r; store.use(r);
          showNames();
        }, function () { go.disabled = false; err.textContent = T.noRoom; });
      }
      go.addEventListener('click', submit);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      root.querySelector('[data-back]').addEventListener('click', showRoles);
    }

    var namesSub = false;
    function showNames() {
      if (!me) me = randId();
      root.innerHTML =
        '<section class="ct-join">' +
          '<h1>' + esc(T.pickName) + '</h1>' +
          '<div class="ct-names"></div>' +
          '<p class="ct-err"></p>' +
          '<button type="button" class="cu-btn is-soft" data-back>' + esc(T.back) + '</button>' +
        '</section>';
      var box = root.querySelector('.ct-names');
      function paintNames() {
        if (!box.isConnected) return;
        var taken = {};
        Object.keys(P || {}).forEach(function (pid) { if (pid !== me && P[pid]) taken[P[pid].name] = 1; });
        box.innerHTML = '';
        NAMES.forEach(function (nm) {
          var b = h('button', 'ct-name', esc(nm));
          b.type = 'button';
          b.disabled = !!taken[nm];
          b.addEventListener('click', function () { join(nm); });
          box.appendChild(b);
        });
      }
      paintNames();
      if (!namesSub) { namesSub = true; store.on('players', function (v) { P = v || {}; paintNames(); if (role) paintAll(); }); }
      root.querySelector('[data-back]').addEventListener('click', function () { showKidRoom(); });
      function join(nm) {
        var err = root.querySelector('.ct-err');
        store.txn('players', function (cur) {
          cur = cur || {};
          var cnt = { red: 0, blue: 0 };
          for (var pid in cur) {
            if (!cur[pid]) continue;
            if (pid !== me && cur[pid].name === nm) return;
            if (pid !== me) cnt[cur[pid].team === 'blue' ? 'blue' : 'red']++;
          }
          var old = cur[me];
          cur[me] = { name: nm, team: old ? old.team : (cnt.red <= cnt.blue ? 'red' : 'blue'), at: old ? old.at : Date.now(), on: true };
          return cur;
        }).then(function (res) {
          if (!res.committed || !res.value || !res.value[me] || res.value[me].name !== nm) { if (err) err.textContent = '다른 이름을 골라요.'; return; }
          myName = nm; role = 'kid';
          sess({ role: 'kid', room: room, pid: me, name: nm });
          store.presence('players/' + me + '/on');
          sfx('up');
          enterKid();
        }, function (e) { if (err) err.textContent = '들어가지 못했어요. (' + (e && e.message || '') + ')'; });
      }
    }

    /* ── 게임 화면(아이·코치 같은 얼음판) ── */
    function arenaHTML(kid) {
      return '<div class="cu-arena ct-arena"><div class="cu-rays"></div>' + D.sheetSVG() +
        (kid ? '<button type="button" class="cu-aimb is-l" data-act="aimL" aria-label="왼쪽으로" hidden>' + D.icon('left', '#5b48d6') + '</button>' +
               '<button type="button" class="cu-aimb is-r" data-act="aimR" aria-label="오른쪽으로" hidden>' + D.icon('right', '#5b48d6') + '</button>' : '') +
        '<div class="cu-hint" hidden></div><div class="cu-toast" hidden></div><div class="ct-result" hidden></div><div class="ct-live" hidden></div></div>';
    }
    function scoreHTML() {
      return '<div class="ct-score"><div class="ct-sc is-red"><b>' + esc(TEAM.red.name) + '</b><strong data-sc="red">0</strong></div>' +
        '<span class="ct-endno"></span>' +
        '<div class="ct-sc is-blue"><strong data-sc="blue">0</strong><b>' + esc(TEAM.blue.name) + '</b></div></div>';
    }
    function bindArena() {
      var $ = function (s) { return root.querySelector(s); };
      el.arena = $('.cu-arena'); el.sheet = $('.cu-sheet'); el.toast = $('.cu-toast'); el.hint = $('.cu-hint'); el.result = $('.ct-result'); el.live = $('.ct-live');
      el.aimL = $('.cu-aimb.is-l'); el.aimR = $('.cu-aimb.is-r');
      el.house = $('.cu-house'); el.r0 = $('.cu-r0'); el.r1 = $('.cu-r1'); el.r2 = $('.cu-r2');
      el.stones = $('.cu-stones'); el.aim = $('.cu-aim'); el.spare = $('.cu-spare');
      el.barF = $('.cu-bar-f'); el.barN = $('.cu-bar-n');
      el.house.setAttribute('transform', 'translate(' + HOUSE.x + ' ' + HOUSE.y + ')');
      el.r0.setAttribute('r', HOUSE.r[0]); el.r1.setAttribute('r', HOUSE.r[1]); el.r2.setAttribute('r', HOUSE.r[2]);
      el.sound = $('.cu-sound');
      if (el.sound) { paintSound(); el.sound.addEventListener('click', function () { soundOn = !soundOn; try { sessionStorage.setItem('curling-team:sound', soundOn ? '1' : '0'); } catch (e) {} paintSound(); sfx('pick'); }); }
    }
    function paintSound() {
      el.sound.innerHTML = D.icon(soundOn ? 'soundOn' : 'soundOff', '#5b48d6');
      el.sound.setAttribute('aria-label', soundOn ? T.soundOn : T.soundOff);
      el.sound.style.opacity = soundOn ? '1' : '.55';
    }
    function subscribe() {
      store.use(room);
      if (!namesSub) { namesSub = true; store.on('players', function (v) { P = v || {}; paintAll(); }); }
      store.on('game', function (v) { G = v ? norm(v) : null; sync(); });
      store.on('throw', function (v) { TH = v; sync(); });
      store.on('pos', function (v) { POS = v; if (!(A && A.running)) paintAll(); });
    }

    function enterKid() {
      root.classList.remove('is-coach');
      root.innerHTML =
        '<div class="ct-wrap">' + arenaHTML(true) +
          '<aside class="ct-side">' +
            '<div class="cu-top"><span class="cu-title">' + esc(T.title) + '</span><span class="ct-chip ct-mine" style="margin-left:auto"></span>' +
              '<button type="button" class="cu-sound"></button></div>' +
            scoreHTML() +
            '<div class="ct-turn"></div>' +
            '<div class="cu-coach"><img class="cu-coach-img" alt="" aria-hidden="true"><p class="cu-bubble" aria-live="polite"></p></div>' +
            '<div class="ct-pips">' +
              '<div class="cu-row"><b>' + esc(TEAM.red.name) + '</b><span class="cu-pips" data-pips="red"></span></div>' +
              '<div class="cu-row"><b>' + esc(TEAM.blue.name) + '</b><span class="cu-pips" data-pips="blue"></span></div>' +
              '<div class="ct-team-line"></div>' +
            '</div>' +
            '<div class="ct-ctrl">' +
              '<div class="ct-ctrl-row"><span>출발 자리</span><button type="button" class="ct-cb" data-act="sxL" aria-label="출발 자리 왼쪽">' + D.icon('left', '#5b48d6') + '</button><button type="button" class="ct-cb" data-act="sxR" aria-label="출발 자리 오른쪽">' + D.icon('right', '#5b48d6') + '</button></div>' +
              '<div class="ct-ctrl-row"><span>던지는 방향</span><button type="button" class="ct-cb" data-act="aL" aria-label="방향 왼쪽">' + D.icon('left', '#5b48d6') + '</button><button type="button" class="ct-cb" data-act="aR" aria-label="방향 오른쪽">' + D.icon('right', '#5b48d6') + '</button></div>' +
            '</div>' +
            '<div class="cu-actions"><div class="cu-btns"><button type="button" class="cu-btn is-hold is-off" data-act="hold">' + D.icon('stone', '#ffffff') + esc(T.hold) + '</button></div></div>' +
            '<div class="ct-foot"><span>' + esc(T.roomNo) + ' ' + esc(room) + '</span>' + (store.kind === 'local' ? '<span class="ct-local">' + esc(T.localMode) + '</span>' : '') + '</div>' +
          '</aside>' +
        '</div>';
      bindArena();
      el.mine = root.querySelector('.ct-mine'); el.turn = root.querySelector('.ct-turn');
      el.bubble = root.querySelector('.cu-bubble'); el.coachImg = root.querySelector('.cu-coach-img');
      el.hold = root.querySelector('[data-act="hold"]'); el.teamLine = root.querySelector('.ct-team-line');
      el.hold.addEventListener('pointerdown', function (e) { if (canAct()) holdStart(e, el.hold); });
      el.arena.addEventListener('pointerdown', onArenaDown);
      el.arena.addEventListener('pointermove', onArenaMove);
      el.aimL.addEventListener('click', function () { setAim(K.aim - AIM_STEP); });
      el.aimR.addEventListener('click', function () { setAim(K.aim + AIM_STEP); });
      root.querySelector('[data-act="aL"]').addEventListener('click', function () { setAim(K.aim - AIM_STEP); });
      root.querySelector('[data-act="aR"]').addEventListener('click', function () { setAim(K.aim + AIM_STEP); });
      root.querySelector('[data-act="sxL"]').addEventListener('click', function () { setSx(K.sx - SX_STEP); });
      root.querySelector('[data-act="sxR"]').addEventListener('click', function () { setSx(K.sx + SX_STEP); });
      subscribe();
      paintAll();
    }

    function enterCoach() {
      root.classList.add('is-coach');
      root.innerHTML =
        '<div class="ct-wrap">' + arenaHTML(false) +
          '<aside class="ct-side">' +
            '<div class="cu-top"><span class="cu-title">' + esc(T.title) + ' · ' + esc(T.coach) + '</span>' +
              '<span class="ct-room" style="margin-left:auto"><b>' + esc(T.roomNo) + '</b><strong>' + esc(room) + '</strong></span>' +
              '<button type="button" class="cu-sound"></button></div>' +
            (store.kind === 'local' ? '<div class="ct-foot" style="margin-top:0"><span class="ct-local">' + esc(T.localMode) + '</span></div>' : '') +
            scoreHTML() +
            '<div class="ct-turn"></div>' +
            '<div class="ct-roster">' +
              '<div class="ct-col is-red" data-col="red"></div><div class="ct-col is-blue" data-col="blue"></div>' +
            '</div>' +
            '<div class="ct-tip">' + esc(T.tapSwap) + '</div>' +
            '<div class="ct-msg"></div>' +
            '<div class="ct-cbtns">' +
              '<button type="button" class="cu-btn is-soft" data-c="split">' + esc(T.autoSplit) + '</button>' +
              '<button type="button" class="cu-btn" data-c="start">' + esc(T.startGame) + '</button>' +
              '<button type="button" class="cu-btn is-soft" data-c="skip">' + esc(T.skipTurn) + '</button>' +
              '<button type="button" class="cu-btn" data-c="more">' + esc(T.oneMore) + '</button>' +
              '<button type="button" class="cu-btn is-soft" data-c="reset">' + esc(T.restart) + '</button>' +
            '</div>' +
            '<div class="ct-hist"></div>' +
          '</aside>' +
        '</div>';
      bindArena();
      el.turn = root.querySelector('.ct-turn'); el.msg = root.querySelector('.ct-msg'); el.hist = root.querySelector('.ct-hist');
      el.cols = { red: root.querySelector('[data-col="red"]'), blue: root.querySelector('[data-col="blue"]') };
      root.querySelector('.ct-roster').addEventListener('click', function (e) {
        var b = e.target.closest('[data-pid]');
        if (b) swapTeam(b.getAttribute('data-pid'));
      });
      root.querySelector('.ct-cbtns').addEventListener('click', function (e) {
        var b = e.target.closest('[data-c]');
        if (b && !b.disabled) coachAct(b.getAttribute('data-c'), b);
      });
      subscribe();
      store.txn('game', function (g) { if (g) return; return { status: 'lobby', gen: Date.now(), endNo: 1, score: { red: 0, blue: 0 } }; });
      paintAll();
    }

    /* ── 코치 조작 ── */
    function say(msg) { if (el.msg) el.msg.textContent = msg || ''; }
    function swapTeam(pid) {
      store.txn('players/' + pid, function (cur) { if (!cur) return; cur.team = other(cur.team === 'blue' ? 'blue' : 'red'); return cur; })
        .then(function () { sfx('pick'); });
    }
    var resetArm = 0;
    function coachAct(c, btn) {
      say('');
      if (c === 'split') {
        store.txn('players', function (cur) {
          if (!cur) return;
          var ids = Object.keys(cur).filter(function (p) { return cur[p]; });
          ids.sort(function (a, b) { return (cur[a].at || 0) - (cur[b].at || 0) || (a < b ? -1 : 1); });
          ids.forEach(function (p, i) { cur[p].team = i % 2 === 0 ? 'red' : 'blue'; });
          return cur;
        }).then(function () { sfx('pick'); });
      } else if (c === 'start') {
        if (!members(P, 'red').length || !members(P, 'blue').length) { say(T.needBoth); return; }
        var players = clone(P);
        store.set('throw', null);
        store.txn('game', function () {
          var g = norm({ status: 'play', gen: Date.now(), endNo: 1, first: 'red', turn: 0 });
          return startTurnOrFinish(g, players, N);
        }).then(function () { sfx('up'); });
      } else if (c === 'skip') {
        var players2 = clone(P);
        if (TH && G && TH.id === idOf(G)) return;          // 이미 던진 돌이 가는 중
        store.txn('game', function (g) {
          if (!g) return null;
          g = norm(g);
          if (g.status !== 'play') return;
          var t = g.team, list = members(players2, t), before = g.thrower;
          g.ptr[t]++;
          var nx = pickThrower(g, t, players2);
          if (list.length > 1 && nx && nx !== before) { g.thrower = nx; g.skips = (g.skips || 0) + 1; return g; }
          g.thrown[t]++; g.turn++;                      // 팀에 한 명뿐이면 그 돌은 넘어감
          return startTurnOrFinish(g, players2, N);
        });
      } else if (c === 'more') {
        var players3 = clone(P);
        store.set('throw', null);
        store.txn('game', function (g) {
          if (!g) return null;
          g = norm(g);
          if (g.status !== 'result' || g.over) return;
          var r = g.result || {};
          if (r.win) g.first = other(r.win);              // 점수를 못 낸 팀이 먼저(0:0이면 그대로)
          g.endNo++; g.turn = 0; g.stones = []; g.thrown = { red: 0, blue: 0 }; g.result = null; g.status = 'play';
          return startTurnOrFinish(g, players3, N);
        }).then(function () { sfx('up'); });
      } else if (c === 'reset') {
        if (!resetArm) {
          resetArm = setTimeout(function () { resetArm = 0; btn.textContent = T.restart; btn.classList.remove('is-warn'); }, 3000);
          btn.textContent = T.restartSure; btn.classList.add('is-warn');
          return;
        }
        clearTimeout(resetArm); resetArm = 0; btn.textContent = T.restart; btn.classList.remove('is-warn');
        store.set('throw', null);
        store.txn('game', function () { return { status: 'lobby', gen: Date.now(), endNo: 1, score: { red: 0, blue: 0 } }; });
      }
    }

    /* ── 맞추기: 게임·던지기 바뀜을 화면에 ── */
    function worldFromG() {
      var w = { snow: false, stones: [], active: -1 };
      if (!G) return w;
      G.stones.forEach(function (s) { w.stones.push({ x: s.x, y: s.y, vx: 0, vy: 0, own: s.t, out: false }); });
      return w;
    }
    function sync() {
      if (!role) return;
      if (A && A.running) { paintAll(); return; }
      if (A && (!G || G.gen !== A.gen || G.endNo !== A.endNo || G.status !== 'play' || G.turn !== A.turn)) {
        clearTimeout(A.coachT); A = null;
      }
      if (!A && G && G.status === 'play' && TH && TH.id === idOf(G) && !done[TH.id]) { startAnim(); return; }
      if (!A) W = worldFromG();
      if (G && G.status === 'play' && G.thrower === me && !(TH && TH.id === idOf(G))) {
        if (K.forId !== idOf(G)) {
          K = { phase: 'aim', aim: 0, power: 0, dir: 1, holdTicks: 0, forId: idOf(G), sx: S.START_X };
          sfx('up');
        }
      } else if (K.phase === 'aim' || K.phase === 'hold') {
        K.phase = 'idle'; stopHold();
      }
      if (G && G.status === 'result') {
        var rk = idOf(G);
        if (!seenResult[rk]) {
          seenResult[rk] = 1;
          if (G.result && G.result.win) sfx('star', 3); else sfx('down');
          if (role === 'kid') log('game-item-complete', { itemId: 'e' + G.endNo, myTeam: myTeam(), red: G.result ? G.result.red : 0, blue: G.result ? G.result.blue : 0 });
        }
      }
      paintAll();
    }

    function startAnim() {
      done[TH.id] = 1;
      var L = S.launch(TH.power, TH.aim, TH.sx);
      W = worldFromG();
      W.active = W.stones.length;
      W.stones.push({ x: L.x, y: L.y, vx: L.vx, vy: L.vy, own: G.team, out: false });
      A = { running: true, id: TH.id, gen: G.gen, endNo: G.endNo, turn: G.turn, team: G.team, by: TH.by, power: TH.power, aim: TH.aim, tick: 0, final: null };
      if (K.phase !== 'idle') { K.phase = 'idle'; stopHold(); }
      sfx('slide', 1 + TH.power * 1.5);
      clearTimeout(animT);
      animT = setTimeout(animTick, TICK);
      paintAll();
    }
    function animTick() {
      animT = null;
      if (!A || !A.running) return;
      var ev = S.stepWorld(W, false);
      A.tick++;
      if (ev.bumped) sfx('clack');
      if (ev.walled) sfx('wall');
      render();
      if (S.allStopped(W) || A.tick > 4000) animStop();
      else animT = setTimeout(animTick, TICK);
    }
    function animStop() {
      var a = A, mine = W.stones[W.active];
      var stars = S.starsAt(HOUSE, mine);
      if (stars > 0) sfx('star', stars);
      if (a.by === me && role === 'kid') {
        log('game-response', { itemId: a.id, team: a.team, power: r2(a.power), aimDeg: Math.round(a.aim * 10) / 10,
          holdMs: K.lastHoldMs || null, distCenter: mine.out ? null : Math.round(S.distTo(HOUSE, mine) * 10) / 10, stars: stars, inHouse: stars > 0 });
      }
      a.t2 = setTimeout(function () {
        if (A !== a) return;
        S.clearShort(W.stones, HOUSE);
        a.final = W.stones.filter(function (s) { return !s.out; }).map(function (s) { return { x: r3(s.x), y: r3(s.y), t: s.own }; });
        a.running = false;
        if (a.by === me) commit(a);
        else if (role === 'coach') a.coachT = setTimeout(function () { commit(a); }, cfg.coachFinishMs || 2500);
        sync();
      }, reduced ? 300 : 800);
    }
    function commit(a) {
      var players = clone(P);
      store.txn('game', function (g) {
        if (!g) return null;
        g = norm(g);
        if (g.status !== 'play' || g.gen !== a.gen || g.endNo !== a.endNo || g.turn !== a.turn) return;
        return advance(g, a.final, players, N);
      });
    }

    /* ── 아이 조작 ── */
    function canAct() {
      return role === 'kid' && G && G.status === 'play' && G.thrower === me && !(A && A.running) &&
        !(TH && TH.id === idOf(G)) && (K.phase === 'aim' || K.phase === 'hold') && K.forId === idOf(G);
    }
    function fieldXY(e) {
      var r = el.sheet.getBoundingClientRect();
      if (!r.width) return null;
      return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
    }
    function aimTo(x, y) { return Math.atan2(x - K.sx, S.START_Y - y) * 180 / Math.PI; }
    function setSx(x) {
      if (!canAct() || K.phase !== 'aim') return;
      K.sx = Math.max(SX_MIN, Math.min(SX_MAX, x));
      try { store.set('pos', { id: idOf(G), sx: K.sx }); } catch (e) {}
      sfx('pick'); paintAll();
    }
    function setAim(a) {
      if (!canAct() || K.phase !== 'aim') return;
      K.aim = Math.round(Math.max(-AIM_MAX, Math.min(AIM_MAX, a)) * 2) / 2;
      render();
    }
    function onArenaDown(e) {
      if (e.target.closest('.cu-aimb')) return;
      if (!canAct() || K.phase !== 'aim') return;
      var q = fieldXY(e);
      if (q && q.y < 74 && q.x > S.SHEET_L - 2 && q.x < S.SHEET_R + 2) {
        aimDrag = true;
        setAim(aimTo(q.x, Math.min(q.y, S.START_Y - 8)));
        try { el.arena.setPointerCapture(e.pointerId); } catch (er) {}
        return;
      }
      holdStart(e, el.arena);
    }
    function onArenaMove(e) {
      if (!aimDrag || !canAct() || K.phase !== 'aim') return;
      var q = fieldXY(e);
      if (q) setAim(aimTo(q.x, Math.min(q.y, S.START_Y - 8)));
    }
    function onUp() { aimDrag = false; if (K.phase === 'hold') release(); }
    function holdStart(e, target) {
      if (!canAct() || K.phase !== 'aim') return;
      if (e && target) { try { target.setPointerCapture(e.pointerId); } catch (er) {} }
      K.phase = 'hold'; K.power = 0; K.dir = 1; K.holdTicks = 0;
      if (el.hold) el.hold.classList.add('is-down');
      el.hint.hidden = true;
      stopHold();
      holdT = setTimeout(holdTick, TICK);
      paintAll();
    }
    function holdTick() {
      holdT = null;
      if (K.phase !== 'hold') return;
      K.holdTicks++;
      K.power += K.dir * DT / (BAR_MS / 1000);
      if (K.power >= 1) { K.power = 2 - K.power; K.dir = -1; sfx('edge'); }
      else if (K.power <= 0) { K.power = -K.power; K.dir = 1; }
      render();
      holdT = setTimeout(holdTick, TICK);
    }
    function stopHold() { if (holdT) { clearTimeout(holdT); holdT = null; } if (el.hold) el.hold.classList.remove('is-down'); }
    function release() {
      if (K.phase !== 'hold') return;
      stopHold();
      if (!canAct()) { K.phase = 'idle'; paintAll(); return; }
      if (K.holdTicks < QUICK) {
        K.phase = 'aim'; K.power = 0;
        sfx('quick');
        toast(esc(T.quick), 1100);
        paintAll();
        return;
      }
      var p = Math.round(Math.max(0, Math.min(1, K.power)) * 10000) / 10000, aim = K.aim, id = idOf(G);
      K.phase = 'sent'; K.lastHoldMs = K.holdTicks * TICK;
      var shot = { id: id, power: p, aim: aim, sx: K.sx, by: me, at: Date.now() };
      store.txn('throw', function (cur) { if (cur && cur.id === id) return; return shot; }).then(function (res) {
        if (!res.committed) { if (K.phase === 'sent' && K.forId === id) K.phase = 'aim'; sync(); return; }
        TH = shot; sync();
      }, function () { if (K.phase === 'sent') K.phase = 'aim'; sync(); });
      paintAll();
    }
    function onKeyDown(e) {
      if (role !== 'kid') return;
      var k2 = e.key;
      if (k2 === ' ' || k2 === 'Spacebar') {
        if (!canAct()) return;
        e.preventDefault();
        if (!e.repeat && K.phase === 'aim') holdStart(null, null);
      } else if ((k2 === 'ArrowLeft' || k2 === 'ArrowRight') && canAct() && K.phase === 'aim') {
        e.preventDefault();
        setAim(K.aim + (k2 === 'ArrowLeft' ? -AIM_STEP : AIM_STEP));
      }
    }
    function onKeyUp(e) { if ((e.key === ' ' || e.key === 'Spacebar') && K.phase === 'hold') release(); }
    global.addEventListener('pointerup', onUp);
    global.addEventListener('pointercancel', onUp);
    global.addEventListener('keydown', onKeyDown);
    global.addEventListener('keyup', onKeyUp);
    global.addEventListener('blur', function () { if (K.phase === 'hold') release(); });
    root.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    var toastT = null;
    function toast(html, ms) {
      clearTimeout(toastT);
      el.toast.className = 'cu-toast';
      el.toast.innerHTML = html; el.toast.hidden = false;
      toastT = setTimeout(function () { el.toast.hidden = true; }, ms || 900);
    }

    /* ── 그리기 ── */
    function myTeam() { return P && P[me] ? (P[me].team === 'blue' ? 'blue' : 'red') : ''; }
    function nameOf(pid) { return pid && P && P[pid] ? P[pid].name : ''; }
    function render() {
      if (!el.stones) return;
      var html = '', glow = [];
      var w = W || worldFromG();
      var showResult = G && G.status === 'result' && !(A && A.running);
      if (showResult && G.result) glow = arr(G.result.glow);
      var live = null, rank = {};
      if (G && G.status === 'play' && !(A && A.running)) {
        live = scoreEnd(w.stones.map(function (s) { return s.out ? { x: -99, y: -99, t: s.own } : { x: s.x, y: s.y, t: s.own }; }));
        var ord = live.glow.slice().sort(function (a, b) { return S.distTo(HOUSE, w.stones[a]) - S.distTo(HOUSE, w.stones[b]); });
        ord.forEach(function (i, k) { rank[i] = k + 1; });
      }
      w.stones.forEach(function (s, i) {
        if (s.out) return;
        var badge = rank[i] ? '<g transform="translate(3.4 -3.4)"><circle r="2.3" fill="#ffd23f" stroke="#ffffff" stroke-width="0.6"/><text y="0.95" text-anchor="middle" font-size="2.8" font-weight="900" fill="#3a2a00">' + rank[i] + '</text></g>' : '';
        html += '<g transform="translate(' + s.x.toFixed(2) + ' ' + s.y.toFixed(2) + ')">' + teamStone(s.own, glow.indexOf(i) >= 0) + badge + '</g>';
      });
      if (el.live) {
        if (live) {
          el.live.hidden = false;
          el.live.className = 'ct-live' + (live.win ? ' is-' + live.win : '');
          el.live.textContent = live.win ? '지금은 ' + TEAM[live.win].name + ' ' + live.pts + '점' : '아직 과녁 안에 돌이 없어요';
        } else el.live.hidden = true;
      }
      /* 던질 돌(아직 안 던졌을 때) */
      var waiting = G && G.status === 'play' && !A && !(TH && TH.id === idOf(G));
      if (waiting) html += '<g transform="translate(' + (canAct() ? K.sx : (POS && POS.id === idOf(G) ? POS.sx : S.START_X)) + ' ' + S.START_Y + ')">' + teamStone(G.team, false) + '</g>';
      el.stones.innerHTML = html;
      /* 방향 점선(내 차례일 때만) */
      var aiming = canAct();
      if (aiming) {
        var ar = K.aim * Math.PI / 180, L = 40;
        el.aim.setAttribute('display', 'inline');
        el.aim.setAttribute('x1', K.sx);
        el.aim.setAttribute('x2', (K.sx + Math.sin(ar) * L).toFixed(2));
        el.aim.setAttribute('y2', (S.START_Y - Math.cos(ar) * L).toFixed(2));
      } else el.aim.setAttribute('display', 'none');
      /* 힘 막대 */
      var p = K.phase === 'hold' ? K.power : (A ? A.power : 0);
      var fh = 60 * Math.max(0, Math.min(1, p));
      el.barF.setAttribute('y', (91 - fh).toFixed(2));
      el.barF.setAttribute('height', fh.toFixed(2));
      el.barN.setAttribute('transform', 'translate(0 ' + (91 - fh).toFixed(2) + ')');
      /* 남은 돌(왼쪽): 빨강은 아래에서 위로, 파랑은 위에서 아래로 */
      var lh = '';
      if (G && G.status !== 'lobby') {
        var y, i, left;
        left = N - G.thrown.red - (waiting && G.team === 'red' ? 1 : 0) - (A && A.team === 'red' ? 1 : 0);
        for (i = 0, y = 74; i < left; i++, y -= 7) lh += '<g transform="translate(7.5 ' + y + ') scale(0.8)">' + teamStone('red') + '</g>';
        left = N - G.thrown.blue - (waiting && G.team === 'blue' ? 1 : 0) - (A && A.team === 'blue' ? 1 : 0);
        for (i = 0, y = 10; i < left; i++, y += 7) lh += '<g transform="translate(7.5 ' + y + ') scale(0.8)">' + teamStone('blue') + '</g>';
      }
      el.spare.innerHTML = lh;
    }

    function turnInfo() {
      if (!G || G.status === 'lobby') return { cls: '', html: esc(T.waitStart) };
      if (G.status === 'result') {
        var r = G.result || {};
        if (!r.win) return { cls: '', html: esc(T.blank) };
        return { cls: 'is-' + r.win, html: esc(fmt(T.points, { team: TEAM[r.win].name, n: r.pts })) };
      }
      var team = A ? A.team : G.team, who = A ? A.by : G.thrower;
      if (role === 'kid' && who === me) return { cls: 'is-' + team + (A ? '' : ' is-me'), html: esc(T.myTurn) + ' <small>· ' + esc(TEAM[team].name) + '</small>' };
      return { cls: 'is-' + team, html: esc(fmt(T.turnOf, { name: nameOf(who) || '…' })) + ' <small>· ' + esc(TEAM[team].name) + '</small>' };
    }

    function paintAll() {
      if (!el.turn) return;
      var g = G;
      /* 점수판 */
      var scR = root.querySelector('[data-sc="red"]'), scB = root.querySelector('[data-sc="blue"]'), en = root.querySelector('.ct-endno');
      scR.textContent = g ? g.score.red : 0; scB.textContent = g ? g.score.blue : 0;
      en.textContent = g && g.status !== 'lobby' ? fmt(T.endNo, { n: g.endNo }) : '';
      var ti = turnInfo();
      el.turn.className = 'ct-turn' + (ti.cls ? ' ' + ti.cls : '');
      el.turn.innerHTML = ti.html;
      /* 결과 */
      if (g && g.status === 'result' && !(A && A.running)) {
        var r = g.result || {};
        el.result.className = 'ct-result' + (r.win ? ' is-' + r.win : '');
        if (g.over) {
          var fw = g.score.red > g.score.blue ? 'red' : g.score.blue > g.score.red ? 'blue' : '';
          el.result.className = 'ct-result' + (fw ? ' is-' + fw : '');
          el.result.textContent = '경기 끝! ' + (fw ? TEAM[fw].name + ' 승리 ' : '비겼어요 ') + g.score.red + ' : ' + g.score.blue;
        } else el.result.textContent = r.win ? fmt(T.points, { team: TEAM[r.win].name, n: r.pts }) : T.blank;
        el.result.hidden = false;
      } else el.result.hidden = true;
      if (role === 'kid') paintKid(); else paintCoach();
      render();
    }
    function paintKid() {
      var t = myTeam(), g = G;
      el.mine.innerHTML = t ? '<i style="background:' + TEAM[t].fill + '"></i>' + esc(myName || nameOf(me)) + ' · ' + esc(TEAM[t].name) : esc(myName);
      el.mine.style.background = t ? TEAM[t].soft : '#f3effd';
      el.mine.style.color = t ? TEAM[t].dark : '#3b2a9e';
      ['red', 'blue'].forEach(function (tm) {
        var box = root.querySelector('[data-pips="' + tm + '"]'), html = '', used = g && g.status !== 'lobby' ? g.thrown[tm] : 0;
        for (var i = 0; i < N; i++) html += '<i class="' + tm + (i < used ? ' used' : '') + '"></i>';
        box.innerHTML = html;
      });
      var mates = t ? members(P, t).map(function (m) { return m.name; }) : [];
      el.teamLine.textContent = t ? TEAM[t].name + ' · ' + mates.join(', ') : '';
      /* 말풍선 · 단추 */
      var line = T.watch, mood = 'jelly-look', act = canAct();
      if (!g || g.status === 'lobby') { line = T.waitStart; mood = 'jelly-default'; }
      else if (g.status === 'result') {
        var r = g.result || {};
        line = r.win ? fmt(T.winLine, { team: TEAM[r.win].name }) : T.blankLine;
        mood = r.win ? 'jelly-cheer' : 'jelly-thinking';
        if (g.over) { line = '3판이 모두 끝났어요. 모두 수고했어요!'; mood = 'jelly-cheer'; }
      } else if (A && A.running) { line = T.sliding; }
      else if (act) { line = K.phase === 'hold' ? T.holding : T.aimGo; mood = 'jelly-praise'; }
      if (el.bubble.textContent !== line) el.bubble.textContent = line;
      var src = jelly(mood);
      if (el.coachImg.getAttribute('src') !== src) el.coachImg.setAttribute('src', src);
      el.hold.classList.toggle('is-off', !act);
      el.arena.classList.toggle('is-locked', !act);
      var showAim = act && K.phase === 'aim';
      el.aimL.hidden = el.aimR.hidden = !showAim;
      Array.prototype.forEach.call(root.querySelectorAll('.ct-cb'), function (b) { b.disabled = !showAim; });
      if (showAim) { el.hint.textContent = T.aimTip; el.hint.className = 'cu-hint is-top'; el.hint.hidden = false; }
      else el.hint.hidden = true;
    }
    function paintCoach() {
      var g = G;
      ['red', 'blue'].forEach(function (tm) {
        var list = members(P, tm), html = '<h3>' + esc(TEAM[tm].name) + ' · ' + list.length + '</h3>';
        if (!list.length) html += '<span class="ct-tip">' + esc(T.nobody) + '</span>';
        list.forEach(function (m) {
          var p = P[m.pid] || {}, now = g && g.status === 'play' && ((A && A.running) ? A.by === m.pid : g.thrower === m.pid);
          html += '<button type="button" class="ct-kid' + (now ? ' is-now' : '') + (p.on === false ? ' is-off' : '') + '" data-pid="' + esc(m.pid) + '">' +
            '<span>' + esc(m.name) + '</span><em>' + esc(TEAM[other(tm)].name) + '로</em></button>';
        });
        el.cols[tm].innerHTML = html;
      });
      var st = g ? g.status : 'lobby';
      var flying = !!(TH && g && TH.id === idOf(g)) || !!(A && A.running);
      function en(c, on) { var b = root.querySelector('[data-c="' + c + '"]'); if (b) b.disabled = !on; }
      en('split', st !== 'play');
      en('start', st === 'lobby');
      en('skip', st === 'play' && !flying);
      en('more', st === 'result' && !(g && g.over));
      en('reset', true);
      var hs = g ? g.history : [];
      el.hist.textContent = hs.length ? T.history + ': ' + hs.map(function (x, i) {
        return (i + 1) + '판 ' + (x.red ? '빨강 ' + x.red : x.blue ? '파랑 ' + x.blue : '0:0');
      }).join(' · ') : '';
    }

    /* ── 다시 열었을 때 이어 들어가기 ── */
    storeReady.then(function () {
      var s = sess();
      if (!s || !s.room) return;
      store.roomOpen(s.room).then(function (ok) {
        if (!ok) { sess(null); return; }
        room = s.room; store.use(room);
        if (s.role === 'coach') { role = 'coach'; me = 'coach'; enterCoach(); }
        else if (s.role === 'kid' && s.pid) {
          me = s.pid; myName = s.name;
          store.txn('players/' + me, function (cur) { if (!cur) return; cur.on = true; return cur; }).then(function (res) {
            if (!res.committed) { showKidRoom(); return; }
            role = 'kid'; store.presence('players/' + me + '/on'); enterKid();
          });
        }
      });
    });

    showRoles();

    return {
      /* 시험용(읽기만) */
      peek: function () {
        return { role: role, room: room, me: me, mode: store ? store.kind : '', phase: K.phase, power: K.power, aim: K.aim, canAct: canAct(),
                 animating: !!(A && A.running), game: clone(G), thr: clone(TH),
                 stones: (W || worldFromG()).stones.filter(function (s) { return !s.out; }).map(function (s) { return { x: r3(s.x), y: r3(s.y), t: s.own }; }) };
      },
      store: function () { return store; }
    };
  }

  global.CurlingTeam = { version: VERSION, mount: mount, scoreEnd: scoreEnd, HOUSE: HOUSE };
})(window);
