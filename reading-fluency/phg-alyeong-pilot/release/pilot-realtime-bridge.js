/* 파일럿용 코치–학생 실시간 다리 (임시).
 *
 * 왜 필요한가
 *  - 회차 파일의 코치 연동은 **플랫폼이 넣어 주는 통로**(window.ONCUVATE + _firebaseReady
 *    + pth/_set/_onValue)를 쓴다. 그게 없으면 BroadcastChannel로 물러나는데,
 *    그건 **같은 브라우저 안에서만** 통한다 — 다른 PC끼리는 절대 안 맞춰진다.
 *  - 플랫폼 통로가 열릴 때까지, 파일럿 수업을 위해 그 규격을 **그대로 흉내 내는** 다리다.
 *
 * ⚠️ 임시다. 플랫폼 통로가 생기면 이 파일을 빼면 되고, 회차 파일은 손댈 것이 없다.
 *
 * 코치는 어떻게 정해지나 — **먼저 연 사람이 차지한다**
 *   종전에는 주소에 `ocrole=coach`만 있으면 **어느 브라우저에서든** 코치가 됐다.
 *   링크가 한 번 새어 나가면 그걸로 끝이었다. 그래서 방마다 `coach` 자리를 두고
 *   **트랜잭션으로 한 사람만** 앉힌다. 이미 주인이 있으면 뒤에 온 사람은 학생으로 들어간다.
 *   같은 브라우저는 새로고침해도 자기 자리를 다시 찾는다(브라우저마다 고유 id를 둔다).
 *
 * ⚠️ 보안에 대해 솔직히
 *   이건 **자리 선점**이지 인증이 아니다. 진짜 판정은 서버가 해야 하고, 그 서버가 아직 없다.
 *   파일럿이 끝나면 이 파일을 걷어낸다.
 */
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const room = String(params.get("ocroom") || "").replace(/\D/g, "").slice(0, 5);
  if (!room) return;                       // 방이 없으면 자율학습 그대로 둔다

  const COACH_KEY = "onq-pilot-2026";
  const wantsCoach = params.get("ocrole") === "coach" && params.get("ockey") === COACH_KEY;

  // 브라우저마다 하나. 이게 「누구인가」의 자리를 대신한다.
  const CLIENT_STORE = "onq.pilot.client.v1";
  let clientId = "";
  try {
    clientId = localStorage.getItem(CLIENT_STORE) || "";
    if (!clientId) {
      clientId = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(CLIENT_STORE, clientId);
    }
  } catch (_) {
    clientId = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  // 회차 파일은 이 객체를 **읽는 즉시** 역할을 정한다. 그래서 값부터 세워 두고,
  // 자리 다툼이 끝난 뒤에 코치 모드를 띄운다(아래 startCoachMode).
  window.ONCUVATE = Object.assign(window.ONCUVATE || {}, {
    role: "child",                                   // 기본은 학생. 자리를 얻으면 바꾼다.
    room,
    child: params.get("occhild") || clientId.slice(0, 8),
    session: params.get("ocsession") || document.body.dataset.session || null
  });

  // 지난 파일럿(animal-persuasion)이 쓰던 실시간 DB를 그대로 쓴다.
  // ⚠️ 이 설정값은 비밀이 아니다(웹 클라이언트 식별자). 실제 방어는 DB 규칙이 한다.
  const firebaseConfig = {
    apiKey: "AIzaSyAHib_-XPXfuvhsZcPlMSnqi4O46kAR0mM",
    authDomain: "non-1-4a6f5.firebaseapp.com",
    databaseURL: "https://non-1-4a6f5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "non-1-4a6f5",
    storageBucket: "non-1-4a6f5.firebasestorage.app",
    messagingSenderId: "871721592960",
    appId: "1:871721592960:web:b342eab286024473845e65"
  };

  // 자료마다 뿌리를 갈라 둔다 — 같은 방 번호를 다른 자료가 써도 섞이지 않는다.
  const lessonId = document.body.dataset.lessonId || "lesson";
  const ROOT = `reading-fluency-pilot/${lessonId}/rooms/${room}`;

  // 코치가 자리를 비운 지 이만큼 지나면 다른 사람이 이어받을 수 있다.
  // 짧으면 잠깐 끊겼을 때 자리를 뺏기고, 길면 사고가 났을 때 수업을 못 연다.
  const CLAIM_STALE_MS = 10 * 60 * 1000;

  const src = "https://www.gstatic.com/firebasejs/12.2.1/";
  Promise.all([import(src + "firebase-app.js"), import(src + "firebase-database.js")])
    .then(([app, database]) => {
      const instance = app.getApps().find(item => item.name === "onq-pilot")
        || app.initializeApp(firebaseConfig, "onq-pilot");
      const db = database.getDatabase(instance);

      // 회차 파일이 부르는 이름 그대로 맞춘다(규격 6장).
      window.pth = (suffix) => (suffix ? `${ROOT}/${String(suffix).replace(/^\/+/, "")}` : ROOT);
      window._set = (path, value) => database.set(database.ref(db, path), value);
      window._onValue = (path, callback) => database.onValue(database.ref(db, path), callback);
      window._onDisconnect = (path) => database.onDisconnect(database.ref(db, path));
      window._firebaseReady = true;

      const claimRef = database.ref(db, `${ROOT}/coach`);

      // 학생·코치 모두 방에 이름을 걸어 둔다 — 「몇 명이 들어와 있나」가 여기서 나온다.
      const seat = database.ref(db, `${ROOT}/members/${clientId}`);
      database.set(seat, { at: Date.now(), session: window.ONCUVATE.session || "" }).catch(() => {});
      try { database.onDisconnect(seat).remove(); } catch (_) {}

      if (!wantsCoach) { startCoachMode(); return; }

      // ── 자리 다툼: 먼저 온 한 사람만 앉는다 ────────────────────────────
      database.runTransaction(claimRef, (current) => {
        const now = Date.now();
        if (!current) return { id: clientId, at: now };                  // 빈자리 → 내가 앉는다
        if (current.id === clientId) return { id: clientId, at: now };   // 내 자리 → 갱신
        if (now - (current.at || 0) > CLAIM_STALE_MS) {                  // 오래 비었다 → 이어받는다
          return { id: clientId, at: now };
        }
        return undefined;                                                // 주인이 있다 → 물러난다
      }).then((result) => {
        const owner = result?.snapshot?.val?.() || result?.snapshot?.val || null;
        const mine = owner && owner.id === clientId;
        if (mine) {
          window.ONCUVATE.role = "coach";
          // 자리를 지키고 있다고 알린다. 끊기면 위 CLAIM_STALE_MS 뒤에 남이 이어받는다.
          setInterval(() => {
            database.set(claimRef, { id: clientId, at: Date.now() }).catch(() => {});
          }, 60 * 1000);
          console.info(`[oncuvate] 이 방의 코치입니다 — 방 ${room}`);
        } else {
          console.warn(`[oncuvate] 방 ${room}에는 이미 코치가 있습니다 — 학생으로 들어갑니다.`);
        }
        startCoachMode();
      }).catch((error) => {
        // 자리를 못 물어봤으면 **학생으로** 들어간다. 모르는 채 코치를 열지 않는다.
        console.warn("[oncuvate] 코치 자리를 확인하지 못해 학생으로 엽니다.", error);
        startCoachMode();
      });
    })
    .catch((error) => {
      // 못 붙어도 수업은 돌아야 한다. 같은 PC 안에서는 폴백 통로가 계속 쓰인다.
      console.warn("[oncuvate] 실시간 다리를 붙이지 못했습니다 — 이 PC 안에서만 맞춰집니다.", error);
      startCoachMode();
    });

  // ⚠️ 회차 파일(coach-mode-v2)은 **켜지는 순간** 통로가 살아 있는지 한 번 보고
  //    아니면 로컬 통로로 내려간다. 다리는 네트워크로 붙느라 늦으므로,
  //    로컬에서는 안 드러나다가 **인터넷에서만** 어긋났다(학생이 값은 받는데 안 움직임).
  //    그래서 코치 모드를 우리가 **다리 뒤에** 띄운다.
  let started = false;
  function startCoachMode() {
    if (started) return;
    started = true;
    const script = document.createElement("script");
    script.src = "release/coach-mode-v2.js?rev=20260825pilot";
    document.body.appendChild(script);
  }
  // 다리가 아주 오래 걸려도 수업이 멈추지 않게 마지막 방어선.
  setTimeout(startCoachMode, 8000);
})();
