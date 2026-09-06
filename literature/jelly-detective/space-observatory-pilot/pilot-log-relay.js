/* 파일럿 전용 — 콘텐츠가 내는 oncuvate:log 와 data-track 클릭을 기기에 모아 두었다가 Web3Forms 로 묶어 보낸다.
 * 정식 서비스에서는 온큐베이트가 주입하는 activity-tracker.js 가 같은 일을 하므로 납품 폴더에 넣지 않는다.
 * 실명·이메일·좌표·음성은 모으지 않는다. 아이 화면에는 아무것도 보이지 않는다(코치 화면에서는 동작하지 않는다).
 */
(function(){
  'use strict';
  const CONFIG=window.ONCUVATE_PILOT_CONFIG||{};
  const R=window.ONCUVATE||{};
  if(R.role==='coach'){
    /* 코치 화면에서는 코치 메모만 모아 보낸다 */
    const key=String(CONFIG.web3formsAccessKey||'').trim();
    window.addEventListener('oncuvate:log',event=>{
      const d=event.detail||{};if(d.type!=='coach-note'||!key||!CONFIG.submissionEnabled)return;
      const body={access_key:key,subject:`[Oncuvate Pilot] Space ${d.sessionNo||'?'} · coach note · ${d.childId||''}`,from_name:'Oncuvate Pilot Coach Note',lesson_id:'space-observatory',session_no:String(d.sessionNo||''),participant_code:String(d.childId||''),room:String(R.room||''),note_text:String(d.text||''),note_json:JSON.stringify(d),botcheck:''};
      fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),keepalive:true}).catch(()=>{});
    });
    return;
  }
  const sourceFile=(location.pathname.split('/').pop()||'').split('?')[0];
  const KEY='oncuvate.pilot.space-observatory.log.'+sourceFile+'.v1';
  const OUTBOX='oncuvate.pilot.space-observatory.outbox.v1';
  const ENDPOINT='https://api.web3forms.com/submit';
  const MAX_EVENTS=1200;
  let record=load()||fresh();
  let dirty=false,timer=0,busy=false;

  function fresh(){return{schema:'oncuvate.pilot-log.v1',lessonId:'space-observatory',sourceFile,sessionNo:Number(R.session)||0,child:String(R.child||''),room:String(R.room||''),classroomCode:String(CONFIG.classroomCode||'SPACE-PILOT'),sessionId:'sp-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),startedAt:new Date().toISOString(),events:[],tracks:[],completed:false,completedAt:null,lastSubmittedAt:null}}
  function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&v.schema==='oncuvate.pilot-log.v1'&&!v.completed?v:null}catch(_){return null}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(record))}catch(_){}}
  function outbox(){try{const v=JSON.parse(localStorage.getItem(OUTBOX)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}}
  function setOutbox(items){try{localStorage.setItem(OUTBOX,JSON.stringify(items.slice(-6)))}catch(_){}}
  function counts(){
    const ev=record.events;
    const by=t=>ev.filter(e=>e.type===t);
    const responses=by('response');
    return{events:ev.length,responses:responses.length,correct:responses.filter(e=>e.correct===true).length,accurate:responses.filter(e=>e.accuracy==='accurate').length,selfCorrected:responses.filter(e=>e.accuracy==='self-corrected').length,support:responses.filter(e=>e.accuracy==='support').length,hints:by('hint').length,tooFast:by('engagement_response').filter(e=>e.tooFast).length,activities:by('activity-summary').length,monitoringItems:by('monitoring-item').length}
  }
  function payload(trigger){return Object.assign({},record,{trigger,createdAt:new Date().toISOString(),summary:counts()})}
  function body(p){return{access_key:String(CONFIG.web3formsAccessKey||'').trim(),subject:`[Oncuvate Pilot] Space ${p.sessionNo||'?'} · ${p.child||p.sessionId.slice(-6)} · ${p.trigger}`,from_name:'Oncuvate Pilot Log Relay',lesson_id:p.lessonId,source_file:p.sourceFile,session_no:String(p.sessionNo),classroom_code:p.classroomCode,participant_code:p.child,room:p.room,session_id:p.sessionId,trigger:p.trigger,completed:String(p.completed),summary_json:JSON.stringify(p.summary),events_json:JSON.stringify(p.events),tracks_json:JSON.stringify(p.tracks),botcheck:''}}
  function enqueue(trigger,force){
    if(!CONFIG.submissionEnabled)return;
    if(!force&&!dirty)return;
    const p=payload(trigger);
    let items=outbox().filter(item=>item.sessionId!==p.sessionId||item.completed);
    items.push({sessionId:p.sessionId,completed:p.completed,body:body(p)});
    setOutbox(items);dirty=false;save();flush();
  }
  function schedule(trigger,delay){clearTimeout(timer);timer=setTimeout(()=>enqueue(trigger,false),delay||900)}
  async function flush(){
    const key=String(CONFIG.web3formsAccessKey||'').trim();
    if(busy||!CONFIG.submissionEnabled||!key||!navigator.onLine)return;
    const items=outbox();if(!items.length)return;
    busy=true;const remaining=[];
    for(let i=0;i<items.length;i+=1){
      try{
        const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(items[i].body),keepalive:true});
        const result=await response.json().catch(()=>({}));
        if(!response.ok||result.success===false)throw new Error('submission failed');
        record.lastSubmittedAt=new Date().toISOString();
      }catch(_){remaining.push(...items.slice(i));break}
    }
    setOutbox(remaining);busy=false;save();
  }

  window.addEventListener('oncuvate:log',event=>{
    const detail=event.detail||{};
    record.events.push(Object.assign({at:Date.now()},detail));
    if(record.events.length>MAX_EVENTS)record.events=record.events.slice(-MAX_EVENTS);
    dirty=true;save();
    if(detail.type==='activity-summary')schedule('activity-'+(detail.activityId||''),1200);
    if(detail.type==='lesson-summary'){record.completed=true;record.completedAt=new Date().toISOString();enqueue('lesson-complete',true)}
  });
  document.addEventListener('click',event=>{
    const t=event.target.closest('[data-track]');if(!t)return;
    const scope=t.closest('[data-activity-id]');
    record.tracks.push({at:Date.now(),track:t.dataset.track,activityId:t.dataset.activityId||(scope?scope.dataset.activityId:''),itemId:t.dataset.itemId||'',correct:t.dataset.correct,accuracy:t.dataset.accuracy,attemptNo:t.dataset.attemptNo,helpLevel:t.dataset.helpLevel,helpType:t.dataset.helpType});
    if(record.tracks.length>MAX_EVENTS)record.tracks=record.tracks.slice(-MAX_EVENTS);
    dirty=true;save();
  });
  window.addEventListener('online',flush);
  window.addEventListener('pagehide',()=>enqueue(record.completed?'pagehide-completed':'pagehide',true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
  const minutes=Math.max(2,Number(CONFIG.recoverySubmitMinutes)||10);
  setInterval(()=>{if(dirty)enqueue('autosave',false)},minutes*60*1000);
  function download(){try{const blob=new Blob([JSON.stringify(Object.assign({},record,{summary:counts()}),null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pilot-log_'+(record.child||'child')+'_s'+String(record.sessionNo||0).padStart(2,'0')+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(_){}}
  document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&(e.key==='E'||e.key==='e')){e.preventDefault();download()}});
  window.ONCUVATE_PILOT_LOG={record:()=>record,counts,flush,download};
  record.events.push({at:Date.now(),type:'pilot-session-ready',standalone:!R.room,child:R.child||''});
  save();flush();
})();
