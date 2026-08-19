import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, get, onDisconnect, onValue, ref, remove, runTransaction, set } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAHib_-XPXfuvhsZcPlMSnqi4O46kAR0mM",authDomain:"non-1-4a6f5.firebaseapp.com",databaseURL:"https://non-1-4a6f5-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"non-1-4a6f5",storageBucket:"non-1-4a6f5.firebasestorage.app",messagingSenderId:"871721592960",appId:"1:871721592960:web:b342eab286024473845e65"};
const ROOT="water-play-poem-pilot/rooms";
const ROOM_LIFETIME_MS=3*60*60*1000;
const EVERGREEN_ROOM=String(window.WATER_PLAY_PILOT_CONFIG?.evergreenRoomCode||"");
const EVERGREEN_EXPIRES_AT=4102444800000;
const app=getApps().find(item=>item.name==="water-play-poem-pilot")||initializeApp(firebaseConfig,"water-play-poem-pilot");
const db=getDatabase(app);

function validRoom(value){return /^\d{5}$/.test(String(value||""))?String(value):""}
function safeKey(value){return String(value||"").replace(/[.#$\[\]\/]/g,"-").slice(0,40)}
function isEvergreen(room){return Boolean(EVERGREEN_ROOM&&room===EVERGREEN_ROOM)}
function evergreenPath(room,lessonId){return ROOT+"/"+room+"/lessons/"+safeKey(lessonId)}
function metaRef(room){return ref(db,`${ROOT}/${room}/meta`)}

export async function createRoom(value,lessonId){
  const room=validRoom(value);if(!room)throw new Error("invalid-room");
  const now=Date.now();
  if(isEvergreen(room))return{ok:true,room,expiresAt:EVERGREEN_EXPIRES_AT,evergreen:true};
  const result=await runTransaction(metaRef(room),current=>{
    if(current&&Number(current.expiresAt||0)>now)return;
    return{lessonId:String(lessonId||""),status:"open",createdAt:now,expiresAt:now+ROOM_LIFETIME_MS,updatedAt:now};
  },{applyLocally:false});
  if(!result.committed)throw new Error("room-exists");
  return{ok:true,room,expiresAt:now+ROOM_LIFETIME_MS};
}

export async function roomExists(value,expectedLessonId){
  const room=validRoom(value);if(!room)return{ok:false};
  if(isEvergreen(room))return{ok:true,room,lessonId:String(expectedLessonId||""),expiresAt:EVERGREEN_EXPIRES_AT,evergreen:true};
  const snapshot=await get(metaRef(room)),meta=snapshot.val();
  return{ok:Boolean(meta&&meta.status==="open"&&Number(meta.expiresAt||0)>Date.now()&&(!expectedLessonId||meta.lessonId===expectedLessonId)),room,lessonId:String(meta?.lessonId||""),expiresAt:Number(meta?.expiresAt||0)};
}

export async function reserveNickname(roomValue,nickname,childCode,expectedLessonId){
  const room=validRoom(roomValue),name=safeKey(nickname),child=safeKey(childCode);
  if(!room||!name||!child)throw new Error("invalid-participant");
  const status=await roomExists(room,expectedLessonId);if(!status.ok)throw new Error("room-not-found");
  const target=ref(db,isEvergreen(room)?evergreenPath(room,expectedLessonId)+"/nicknames/"+name:ROOT+"/"+room+"/nicknames/"+name),now=Date.now();
  const result=await runTransaction(target,current=>{
    if(current&&current.child!==child&&Number(current.expiresAt||0)>now)return;
    return{child,nickname:String(nickname).slice(0,20),joinedAt:now,expiresAt:isEvergreen(room)?now+ROOM_LIFETIME_MS:status.expiresAt};
  },{applyLocally:false});
  if(!result.committed)throw new Error("nickname-taken");
  return{ok:true};
}

export async function connectBridge(value,expectedLessonId){
  const room=validRoom(value),status=await roomExists(room,expectedLessonId);if(!status.ok)throw new Error("room-not-found");
  const base=isEvergreen(room)?evergreenPath(room,expectedLessonId):ROOT+"/"+room;
  window.pth=path=>ref(db,`${base}/${String(path||"").replace(/^\/+|\/+$/g,"")}`);
  window._set=(target,data)=>set(target,data);
  window._remove=target=>remove(target);
  window._onDisconnect=target=>onDisconnect(target);
  window._onValue=(target,callback)=>onValue(target,callback);
  window._firebaseReady=true;
  window.dispatchEvent(new CustomEvent("oncuvate:pilot-realtime-ready"));
  return status;
}
