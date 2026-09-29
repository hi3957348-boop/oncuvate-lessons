/* 파일럿 전용 — 정식 납품본에는 넣지 않는다.
 * 여러 기기가 같은 수업방을 쓰도록 Firebase 방을 열고, 수업 파일의 'platform' 모드가 쓰는 pth/_set/_onValue 를 채운다. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, get, onDisconnect, onValue, ref, remove, runTransaction, set } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAHib_-XPXfuvhsZcPlMSnqi4O46kAR0mM",authDomain:"non-1-4a6f5.firebaseapp.com",databaseURL:"https://non-1-4a6f5-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"non-1-4a6f5",storageBucket:"non-1-4a6f5.firebasestorage.app",messagingSenderId:"871721592960",appId:"1:871721592960:web:b342eab286024473845e65"};
const ROOT="nie-news-pilot/rooms";
const ROOM_LIFETIME_MS=3*60*60*1000;
const LESSON=String(window.NIE_PILOT_LESSON||"nie");
const app=getApps().find(item=>item.name==="nie-news-pilot")||initializeApp(firebaseConfig,"nie-news-pilot");
const db=getDatabase(app);

function validRoom(value){return /^\d{5}$/.test(String(value||""))?String(value):""}
function metaRef(room){return ref(db,`${ROOT}/${room}/meta`)}

async function createRoom(value){
  const room=validRoom(value);if(!room)throw new Error("invalid-room");
  const now=Date.now();
  const result=await runTransaction(metaRef(room),current=>{if(current&&Number(current.expiresAt||0)>now)return;return{lesson:LESSON,status:"open",createdAt:now,expiresAt:now+ROOM_LIFETIME_MS}},{applyLocally:false});
  if(!result.committed)throw new Error("room-exists");
  await remove(ref(db,`${ROOT}/${room}/board`));await remove(ref(db,`${ROOT}/${room}/prog`));
  return room;
}
async function roomOpen(value){
  const room=validRoom(value);if(!room)return false;
  const meta=(await get(metaRef(room))).val();
  return Boolean(meta&&meta.status==="open"&&meta.lesson===LESSON&&Number(meta.expiresAt||0)>Date.now());
}
async function readBoard(room){return (await get(ref(db,`${ROOT}/${room}/board/vocabFishing`))).val()}
async function connectBridge(value){
  const room=validRoom(value);if(!(await roomOpen(room)))throw new Error("room-not-found");
  const base=`${ROOT}/${room}`;
  window.pth=path=>ref(db,`${base}/${String(path||"").replace(/^\/+|\/+$/g,"")}`);
  window._set=(target,data)=>set(target,data===undefined?null:JSON.parse(JSON.stringify(data)));
  window._remove=target=>remove(target);
  window._onDisconnect=target=>onDisconnect(target);
  window._onValue=(target,callback)=>onValue(target,callback);
  window._firebaseReady=true;
  if(!window.__niePilotWatch){window.__niePilotWatch=true;onValue(ref(db,'.info/connected'),snap=>{if(snap.val()===true)window.dispatchEvent(new CustomEvent('nie-pilot-connected'))})}
  return room;
}
const api={createRoom,roomOpen,readBoard,connectBridge};
window.NIE_PILOT=api;
if(typeof window.NIE_PILOT_RESOLVE==="function")window.NIE_PILOT_RESOLVE(api);
