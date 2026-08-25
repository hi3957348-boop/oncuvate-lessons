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
 * 쓰는 법 (주소 파라미터)
 *   학생  …/session01.html?ocroom=12345
 *   코치  …/session01.html?ocroom=12345&ocrole=coach&ockey=<코치키>
 *   여러 학생을 가를 때  &occhild=a1
 *
 * ⚠️ 보안에 대해 솔직히
 *   코치 판정을 **주소로** 한다. 규격은 「서버가 판정한다」인데 그 서버가 아직 없어서다.
 *   그래서 ①코치키를 아는 사람만 코치가 되고 ②방 코드는 5자리 숫자이며
 *   ③파일럿이 끝나면 이 파일을 걷어낸다. 진짜 인증이 아니다 — 그 전제로만 쓴다.
 */
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const room = String(params.get("ocroom") || "").replace(/\D/g, "").slice(0, 5);
  if (!room) return;                       // 방이 없으면 자율학습 그대로 둔다

  // 코치키는 비밀이 아니라 **실수 방지**다(아이가 주소를 고쳐 코치 화면을 열지 않게).
  const COACH_KEY = "onq-pilot-2026";
  const wantsCoach = params.get("ocrole") === "coach";
  const role = wantsCoach && params.get("ockey") === COACH_KEY ? "coach" : "child";
  if (wantsCoach && role !== "coach") {
    console.warn("[oncuvate] 코치키가 맞지 않아 학생 화면으로 엽니다.");
  }

  // 회차 파일은 이 객체를 **읽는 즉시** 역할을 정한다. 그래서 값부터 동기로 세운다.
  const bridge = {
    role,
    room,
    child: params.get("occhild") || null,
    session: params.get("ocsession") || document.body.dataset.session || null
  };
  window.ONCUVATE = Object.assign(window.ONCUVATE || {}, bridge);

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

      // 다리가 늦게 붙어도 화면이 스스로 다시 맞추도록 알린다.
      window.dispatchEvent(new CustomEvent("oncuvate:runtime-ready", { detail: { role, room } }));
      console.info(`[oncuvate] 실시간 다리 연결 — 방 ${room} · ${role === "coach" ? "코치" : "학생"}`);
    })
    .catch((error) => {
      // 못 붙어도 수업은 돌아야 한다. 같은 PC 안에서는 폴백 통로가 계속 쓰인다.
      console.warn("[oncuvate] 실시간 다리를 붙이지 못했습니다 — 이 PC 안에서만 맞춰집니다.", error);
    });
})();
