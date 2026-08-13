// 파일럿 전용 실시간 런타임.
// ⚠️ 이 파일은 **납품본에 넣지 않습니다.** 제작규격 4장(외부 전송 금지)·5장(자체 게이트 금지)
//    때문이며, 실제 플랫폼에서는 서버가 연결을 만들어 주입합니다.
//
// 하는 일은 하나입니다 — 플랫폼이 주입해 줄 것을 대신 만들어 두고 app.js를 띄웁니다.
// 그래서 app.js는 이 파일의 존재를 모르고, 플랫폼에 올라갔을 때와 똑같은 길로 돕니다.
//   window.ONCUVATE          역할·방·아동 식별코드 (규격 5장)
//   window.pth('nav'|'prog') 허용된 세 경로만 (규격 6장)
//   window._set/_onValue/_remove/_onDisconnect
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import {
  getDatabase, get, onDisconnect, onValue, ref, remove, runTransaction, set
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAHib_-XPXfuvhsZcPlMSnqi4O46kAR0mM',
  authDomain: 'non-1-4a6f5.firebaseapp.com',
  databaseURL: 'https://non-1-4a6f5-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'non-1-4a6f5',
  storageBucket: 'non-1-4a6f5.firebasestorage.app',
  messagingSenderId: '871721592960',
  appId: '1:871721592960:web:b342eab286024473845e65'
};

const APP_NAME = 'neighborhood-fluency-pilot';
const ROOT = 'neighborhood-fluency-pilot/rooms';
// 파일럿 방은 세 시간이면 닫는다 — 남은 방을 다른 수업이 주워 쓰지 않게.
const ROOM_LIFETIME_MS = 3 * 60 * 60 * 1000;
const ENTRY_PAGE = 'index.html';
// 헷갈리는 글자(O/0, I/1)를 뺀 4글자 — 규격 5장의 아동 식별코드와 같은 모양이다.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const app = getApps().find(item => item.name === APP_NAME) || initializeApp(firebaseConfig, APP_NAME);
const db = getDatabase(app);

const params = new URLSearchParams(window.location.search);
const SESSION = Number(window.ONCUVATE_SESSION) || 1;

function normalizeRoom(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 5);
}

function metaRef(room) {
  return ref(db, `${ROOT}/${room}/meta`);
}

async function roomIsOpen(room) {
  const snapshot = await get(metaRef(room));
  const meta = snapshot.val();
  return Boolean(meta && meta.status === 'open' && Number(meta.expiresAt || 0) > Date.now());
}

// 코치가 방을 연다. 이미 열려 있으면 그대로 이어 쓴다 — 새로고침하고 돌아온 경우다.
async function openRoom(room) {
  const now = Date.now();
  await runTransaction(metaRef(room), current => {
    if (current && current.status === 'open' && Number(current.expiresAt || 0) > now) {
      return { ...current, updatedAt: now };
    }
    return {
      lessonId: 'neighborhood-fluency',
      session: SESSION,
      status: 'open',
      createdAt: now,
      expiresAt: now + ROOM_LIFETIME_MS,
      updatedAt: now
    };
  }, { applyLocally: false });
}

// 아동 식별코드 — 실명이 아니다. 같은 창에서 새로고침하면 같은 코드를 유지해야
// 코치 화면의 참가자 목록에 같은 아이가 둘로 늘어나지 않는다.
function childCode(room) {
  const key = `${APP_NAME}:child:${room}`;
  const kept = sessionStorage.getItem(key);
  if (kept) return kept;
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  const made = Array.from(bytes, value => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('');
  sessionStorage.setItem(key, made);
  return made;
}

// 규격 6장 — 콘텐츠에 열어 주는 것은 nav·prog·report 세 경로뿐이다.
// 방 구분은 여기서 처리하므로 콘텐츠는 방 이름을 알지 못한다.
function exposeBridge(room) {
  const base = `${ROOT}/${room}/s${SESSION}`;
  window.pth = suffix => ref(db, `${base}/${String(suffix || '').replace(/^\/+|\/+$/g, '')}`);
  window._set = (target, value) => set(target, value);
  window._onValue = (target, callback) => onValue(target, callback);
  window._remove = target => remove(target);
  window._onDisconnect = target => onDisconnect(target);
  window._firebaseReady = true;
}

function startContent() {
  // 브리지가 준비된 뒤에 띄운다 — app.js는 뜨는 순간 window.ONCUVATE를 읽는다.
  const version = window.ONCUVATE_ASSET_VERSION;
  const script = document.createElement('script');
  script.src = version ? `app.js?v=${encodeURIComponent(version)}` : 'app.js';
  document.body.appendChild(script);
}

function fail(message, detail) {
  document.querySelector('#app').innerHTML = `<main class="main session-gate">
    <section class="activity-card session-gate-card">
      <span class="eyebrow">수업을 열지 못했어요</span>
      <h2>${message}</h2>
      <p>${detail}</p>
      <a class="btn btn-primary" href="${ENTRY_PAGE}">처음 화면으로</a>
    </section>
  </main>`;
}

async function boot() {
  // 되돌아갈 입장 화면이 있다는 표시. 납품본에는 이 파일이 없으므로 값도 없다.
  window.ONCUVATE_PILOT_ENTRY = ENTRY_PAGE;

  const room = normalizeRoom(params.get('room'));
  // 방이 없으면 혼자 하기 — 실시간 연동 없이 콘텐츠가 자율학습으로 돈다.
  if (!room) { startContent(); return; }

  const role = params.get('view') === 'coach' ? 'coach' : 'child';
  try {
    if (role === 'coach') await openRoom(room);
    else if (!await roomIsOpen(room)) {
      fail('그 입장코드로 열린 수업이 없어요.',
        '선생님이 먼저 같은 코드로 「수업 열기」를 눌러야 학생이 들어갈 수 있어요. 코드를 다시 확인해 주세요.');
      return;
    }
  } catch (error) {
    fail('연결하지 못했어요.', '인터넷 연결을 확인하고 다시 시도해 주세요. 혼자 하기는 연결 없이도 됩니다.');
    return;
  }

  exposeBridge(room);
  window.ONCUVATE = {
    role,
    room,
    session: SESSION,
    folder: 'neighborhood-fluency',
    child: role === 'coach' ? null : childCode(room)
  };
  startContent();
}

boot();
