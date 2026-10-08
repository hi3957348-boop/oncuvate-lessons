/* 파일럿 전용 — 정식 납품본에는 넣지 않는다.
 * 역사 읽기 수업 파일의 로컬 수업방 처리기(localRequest)를 Firebase 트랜잭션 안에서 돌려 여러 기기가 같은 방을 쓰게 한다. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, get, onValue, ref, runTransaction, set } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAHib_-XPXfuvhsZcPlMSnqi4O46kAR0mM",authDomain:"non-1-4a6f5.firebaseapp.com",databaseURL:"https://non-1-4a6f5-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"non-1-4a6f5",storageBucket:"non-1-4a6f5.firebasestorage.app",messagingSenderId:"871721592960",appId:"1:871721592960:web:b342eab286024473845e65"};
const ROOT="nie-news-pilot/rooms";
const LIFE=3*60*60*1000;
const LESSON=String(window.HP_LESSON||"history");
const PIN="80646074";
const app=getApps().find(a=>a.name==="history-pilot")||initializeApp(firebaseConfig,"history-pilot");
const db=getDatabase(app);
const cache={};let watching="";

const clean=v=>JSON.parse(JSON.stringify(v===undefined?null:v));
/* Firebase 는 빈 객체·빈 배열을 지운다 → 수업 엔진이 기대하는 모양으로 되살린다 */
const arr=v=>Array.isArray(v)?v:Object.values(v||{});
function fix(s){if(!s)return s;const e=typeof emptyState==="function"?emptyState():{};const n={...e,...s};
  ["players","responses","locks","reflections","openingVotes"].forEach(k=>{if(!n[k]||typeof n[k]!=="object")n[k]={}});
  n.historyLab={timeline:[],comparison:{},lastActor:"",...(s.historyLab||{})};n.historyLab.timeline=arr(n.historyLab.timeline);if(!n.historyLab.comparison)n.historyLab.comparison={};
  if(n.basket&&!n.basket.picks)n.basket.picks={};
  if(n.reviewBingo)n.reviewBingo.called=arr(n.reviewBingo.called);
  if(n.keywordTalk)n.keywordTalk.used=arr(n.keywordTalk.used);
  return n}
async function roomOpen(code){const m=(await get(ref(db,`${ROOT}/${code}/meta`))).val();return Boolean(m&&m.lesson===LESSON&&Number(m.expiresAt||0)>Date.now())}
function watch(code,apply){if(watching===code)return;watching=code;onValue(ref(db,`${ROOT}/${code}/state`),snap=>{const v=fix(snap.val());cache[code]=v;if(v&&typeof apply==="function")apply(v)})}
async function request(action,payload,localRequest){
  if(action==="create"){
    const pin=((document.getElementById("pilotCoachPin")||{}).value||"").trim();if(pin!==PIN)throw new Error("코치 번호를 확인해 주세요.");
    for(let i=0;i<8;i++){const code=String(Math.floor(10000+Math.random()*90000)),now=Date.now();
      const r=await runTransaction(ref(db,`${ROOT}/${code}/meta`),cur=>{if(cur&&Number(cur.expiresAt||0)>now)return;return{lesson:LESSON,status:"open",createdAt:now,expiresAt:now+LIFE}},{applyLocally:false});
      if(!r.committed)continue;
      const st=emptyState();st.updatedAt=now;await set(ref(db,`${ROOT}/${code}/state`),clean(st));
      try{localStorage.setItem("hp-coach-"+LESSON,JSON.stringify({code,token:"pilot-coach"}))}catch(e){}
      return{success:true,room:code,coachToken:"pilot-coach",state:fix(st)}}
    throw new Error("방을 만들지 못했어요. 다시 눌러 주세요.")}
  const code=String(payload.room||"");if(!/^\d{5}$/.test(code))throw new Error("5자리 수업방 번호를 확인해 주세요.");
  if(action==="join"&&!(await roomOpen(code)))throw new Error("열려 있는 수업방이 아니에요. 코치에게 번호를 확인해 주세요.");
  let out=null,err=null;
  const r=await runTransaction(ref(db,`${ROOT}/${code}/state`),cur=>{
    if(cur===null)return null; /* 아직 서버 값을 모름 → 서버가 진짜 값으로 다시 부른다 */
    window.__hpTx={cur:fix(cur)};err=null;out=null;
    try{out=localRequest(action,payload)}catch(e){err=e;window.__hpTx=null;return}
    window.__hpTx=null;return clean(out.state)});
  if(err)throw err;if(!r.committed||!out)throw new Error("수업방이 닫혔어요.");
  const st=fix(r.snapshot.val());cache[code]=st;return{...out,state:st}}
const api={request,watch,cached:c=>cache[c],roomOpen,LESSON};
window.HP_PILOT=api;if(typeof window.HP_RESOLVE==="function")window.HP_RESOLVE(api);
