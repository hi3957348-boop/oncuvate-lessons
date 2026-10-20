/* 파일럿 전용 — 정식 납품본에는 넣지 않는다(10-20).
 * 신문읽기 파일럿 수업의 「게임 불러오기」 창 안에서 이 게임이 열릴 때, 온큐베이트가 넣어 줄 값(window.ONCUVATE · pth · _set · _onValue · _onDisconnect)을
 * 수업 파일럿과 같은 Firebase 방 안의 게임 칸으로 대신 채운다. 주소: session01.html?r=<수업방>&role=coach|child&child=<아이 번호>
 * 아이 이름은 수업방의 prog/<아이>/nickname 에서 읽어 ONCUVATE.names 로 넘긴다. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, onDisconnect, onValue, ref, set } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAHib_-XPXfuvhsZcPlMSnqi4O46kAR0mM",authDomain:"non-1-4a6f5.firebaseapp.com",databaseURL:"https://non-1-4a6f5-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"non-1-4a6f5",storageBucket:"non-1-4a6f5.firebasestorage.app",messagingSenderId:"871721592960",appId:"1:871721592960:web:b342eab286024473845e65"};
const q=new URLSearchParams(location.search);
const room=/^\d{5}$/.test(q.get('r')||'')?q.get('r'):'';
const role=q.get('role')==='coach'?'coach':'child';
const child=String(q.get('child')||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,12);
if(room){
  const app=getApps().find(a=>a.name==='game-pilot')||initializeApp(firebaseConfig,'game-pilot');
  const db=getDatabase(app);
  const lessonBase=`nie-news-pilot/rooms/${room}`;
  const base=`${lessonBase}/games/curling-team`;
  const O=window.ONCUVATE=window.ONCUVATE||{};
  O.room=room;O.role=role;O.child=role==='coach'?'':child;O.names=O.names||{};
  onValue(ref(db,`${lessonBase}/prog`),snap=>{const v=snap.val()||{};Object.keys(v).forEach(id=>{const n=v[id]&&v[id].nickname;if(n)O.names[id.replace(/[^A-Za-z0-9_-]/g,'').slice(0,12)]=n})});
  window.pth=p=>ref(db,`${base}/${String(p||'').replace(/^\/+|\/+$/g,'')}`);
  window._set=(t,d)=>set(t,d===undefined?null:JSON.parse(JSON.stringify(d)));
  window._onValue=(t,cb)=>onValue(t,cb);
  window._onDisconnect=t=>onDisconnect(t);
  window._firebaseReady=true;
}
