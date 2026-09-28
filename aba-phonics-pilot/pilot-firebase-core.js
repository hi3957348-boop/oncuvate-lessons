/* 파일럿 전용 — 정식 납품 폴더에 넣지 않는다. 온큐베이트 정식 서비스는 서버가 window.ONCUVATE 와 pth/_set/_onValue 를 주입한다. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, get, onDisconnect, onValue, ref, remove, runTransaction, set, update } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAHib_-XPXfuvhsZcPlMSnqi4O46kAR0mM",authDomain:"non-1-4a6f5.firebaseapp.com",databaseURL:"https://non-1-4a6f5-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"non-1-4a6f5",storageBucket:"non-1-4a6f5.firebasestorage.app",messagingSenderId:"871721592960",appId:"1:871721592960:web:b342eab286024473845e65"};
const ROOT="aba-phonics-pilot/rooms";
const ROOM_LIFETIME_MS=3*60*60*1000;
const app=getApps().find(item=>item.name==="aba-phonics-pilot")||initializeApp(firebaseConfig,"aba-phonics-pilot");
const db=getDatabase(app);

function validRoom(value){return /^\d{5}$/.test(String(value||""))?String(value):""}
function validSession(value){return /^session0[1-4]\.html$/.test(String(value||""))?String(value):"session01.html"}
function metaRef(room){return ref(db,`${ROOT}/${room}/meta`)}

export async function createRoom(value,sessionFile){
  const room=validRoom(value);if(!room)throw new Error("invalid-room");
  const now=Date.now(),file=validSession(sessionFile);
  const result=await runTransaction(metaRef(room),current=>{if(current&&Number(current.expiresAt||0)>now)return;return{lessonId:"aba-phonics-pilot",sessionFile:file,status:"open",createdAt:now,expiresAt:now+ROOM_LIFETIME_MS,updatedAt:now}},{applyLocally:false});
  if(!result.committed)throw new Error("room-exists");
  return{ok:true,room,sessionFile:file,expiresAt:now+ROOM_LIFETIME_MS}
}
export async function setRoomSession(value,sessionFile){
  const room=validRoom(value);if(!room)throw new Error("invalid-room");
  const file=validSession(sessionFile);await update(metaRef(room),{sessionFile:file,updatedAt:Date.now()});return{ok:true,room,sessionFile:file}
}
export async function roomExists(value){
  const room=validRoom(value);if(!room)return{ok:false};
  const snapshot=await get(metaRef(room)),meta=snapshot.val();
  return{ok:Boolean(meta&&meta.status==="open"&&Number(meta.expiresAt||0)>Date.now()),room,sessionFile:validSession(meta?.sessionFile),expiresAt:Number(meta?.expiresAt||0)}
}
export async function connectBridge(value){
  const room=validRoom(value);const status=await roomExists(room);if(!status.ok)throw new Error("room-not-found");
  const base=`${ROOT}/${room}`;
  window.pth=path=>ref(db,`${base}/${String(path||"").replace(/^\/+|\/+$/g,"")}`);
  window._set=(target,data)=>set(target,data);
  window._remove=target=>remove(target);
  window._onDisconnect=target=>onDisconnect(target);
  window._onValue=(target,callback)=>onValue(target,callback);
  window._firebaseReady=true;
  window.dispatchEvent(new CustomEvent("oncuvate:pilot-realtime-ready"));
  return status
}

/* 한글 닉네임: 방 안에서 겹치지 않게 하나 잡음(같은 기기 코드는 같은 닉네임). 실패하면 코드로 고른 닉네임 */
const NICKS=["토끼", "고래", "펭귄", "다람쥐", "부엉이", "수달", "판다", "여우", "사자", "호랑이", "코알라", "돌고래", "기린", "하마", "오리", "병아리", "거북이", "고양이", "강아지", "햄스터", "딸기", "사과", "포도", "수박", "레몬", "복숭아", "체리", "망고", "바나나", "귤"];
export async function claimNick(value,code){const room=validRoom(value);code=String(code||"").slice(0,12);let h=0;for(const c of code)h=(h*31+c.charCodeAt(0))>>>0;
  const order=NICKS.map((n,i)=>NICKS[(i+h)%NICKS.length]);let got="";
  await runTransaction(ref(db,`${ROOT}/${room}/nicks`),cur=>{cur=cur||{};if(cur[code]){got=cur[code];return cur}const used=new Set(Object.values(cur));got=order.find(n=>!used.has(n))||order[0];cur[code]=got;return cur});
  return got||order[0]}

/* 칭찬 점수: rooms/<방>/praise/<아이> = {total, seq, last} — 코치가 보내고 학생 화면이 받아 축포 */
export async function sendPraise(value,child,delta,reason){const room=validRoom(value);child=String(child||"").slice(0,60);let out=null;
  await runTransaction(ref(db,`${ROOT}/${room}/praise/${child}`),cur=>{cur=cur||{total:0,seq:0};cur.total=(Number(cur.total)||0)+Number(delta||0);cur.seq=(Number(cur.seq)||0)+1;cur.last={delta:Number(delta||0),reason:String(reason||"").slice(0,60),at:Date.now()};out=cur;return cur});
  return out}
export function listenPraise(value,child,cb){const room=validRoom(value);return onValue(ref(db,`${ROOT}/${room}/praise/${String(child||"").slice(0,60)}`),s=>cb(s.val()))}

/* 코치 메모: rooms/<방>/notes/<아이>/<시각> = {text, at} (방이 닫혀도 남음) */
export async function sendNote(value,child,text){const room=validRoom(value),at=Date.now();await set(ref(db,`${ROOT}/${room}/notes/${String(child||"").slice(0,60)}/${at}`),{text:String(text||"").slice(0,2000),at});return{ok:true,at}}
