/* Oncuvate live mirror — 코치·아동 실시간 연동 (규격 6장: 주입되는 window.ONCUVATE · pth · _set · _onValue · _onDisconnect 만 사용)
 * 아이: prog/<child> 에 진행 스냅샷을 쓴다.  코치: prog 전체를 구독해 참가자 목록을 그린다.
 * room 이 없으면(자율학습) 아무것도 하지 않는다 — 혼자 도는 것이 기본 동작.
 */
(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(ch){return({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])})}
  var NOTE_PREFIX=(document.documentElement.getAttribute('data-lesson-id')||'lesson')+':coach-note:';
  var drafts={},statusText={};
  function noteKey(sessionNo,child){return NOTE_PREFIX+sessionNo+':'+child}
  function loadNote(sessionNo,child){try{return localStorage.getItem(noteKey(sessionNo,child))||''}catch(_){return ''}}
  function storeNote(sessionNo,child,text){try{localStorage.setItem(noteKey(sessionNo,child),text)}catch(_){}}
  /* 코치 메모 저장 — 학습 기록 통로(oncuvate:log type coach-note) + 규격 7장 코치 메모 통로(POST __memo, 상대 경로) */
  function saveNote(sessionNo,child,text,done){
    var runtime=window.ONCUVATE||{};
    var clean=String(text||'').trim().slice(0,2000);
    storeNote(sessionNo,child,clean);
    var detail={type:'coach-note',schemaVersion:'0.2',contentId:document.documentElement.getAttribute('data-lesson-id')||'',sessionNo:Number(sessionNo)||0,childId:child,text:clean,chars:clean.length,author:'coach',at:new Date().toISOString()};
    try{window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:detail}))}catch(_){}
    if(!clean){done('빈 메모는 서버에 보내지 않았습니다');return}
    var url=(typeof runtime.base==='string'&&runtime.base?runtime.base:'')+'__memo';
    try{
      fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({childId:child,sessionNo:Number(sessionNo)||0,text:clean}),credentials:'same-origin'})
        .then(function(r){done(r.ok?'서버 저장됨 '+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}):'기기에 저장 · 서버 응답 '+r.status)})
        .catch(function(){done('기기에 저장 · 서버 연결 없음')});
    }catch(_){done('기기에 저장')}
  }
  function bindNotes(element,sessionNo){
    if(!element||element.dataset.notesBound)return;
    element.dataset.notesBound='1';
    element.addEventListener('input',function(e){var t=e.target.closest('[data-coach-note]');if(t)drafts[t.dataset.coachNote]=t.value});
    element.addEventListener('click',function(e){
      var b=e.target.closest('[data-coach-note-save]');if(!b)return;
      var child=b.dataset.coachNoteSave,box=element.querySelector('[data-coach-note="'+child+'"]'),st=element.querySelector('[data-coach-note-status="'+child+'"]');
      var text=box?box.value:'';b.disabled=true;if(st)st.textContent='저장 중…';
      saveNote(sessionNo,child,text,function(msg){statusText[child]=msg;if(st)st.textContent=msg;b.disabled=false;drafts[child]=text});
    });
    element.addEventListener('focusout',function(){if(element.dataset.pendingRender){var map=JSON.parse(element.dataset.pendingRender);delete element.dataset.pendingRender;setTimeout(function(){renderList(element,map,sessionNo)},50)}});
  }
  function ready(){return window._firebaseReady===true&&typeof window.pth==='function'&&typeof window._set==='function'&&typeof window._onValue==='function'}
  function create(options){
    options=options||{};
    var runtime=window.ONCUVATE||{};
    var isCoach=runtime.role==='coach';
    var room=String(runtime.room||'');
    var child=String(runtime.child||'').replace(/[^a-zA-Z0-9_-]/g,'')||'child';
    var snapshot=typeof options.snapshot==='function'?options.snapshot:function(){return{}};
    var onParticipants=typeof options.onParticipants==='function'?options.onParticipants:function(){};
    var onStatus=typeof options.onStatus==='function'?options.onStatus:function(){};
    var started=false,timer=0,lastJson='';
    function status(text){try{onStatus(text)}catch(_){}}
    function publish(){
      if(isCoach||!room||!started||!ready())return;
      var data;
      try{data=Object.assign({child:child,updatedAt:Date.now()},snapshot()||{})}catch(_){return}
      var json=JSON.stringify(data);
      if(json===lastJson)return;
      lastJson=json;
      try{Promise.resolve(window._set(window.pth('prog/'+child),data)).catch(function(){})}catch(_){}
    }
    function publishSoon(delay){if(isCoach||!room)return;clearTimeout(timer);timer=setTimeout(publish,delay||120)}
    function connect(){
      if(started)return true;
      if(!ready())return false;
      started=true;
      if(isCoach){
        window._onValue(window.pth('prog'),function(s){
          var v=s&&typeof s.val==='function'?s.val():s;
          var map=v&&typeof v==='object'?v:{};
          var n=Object.keys(map).length;
          status(n?'연결됨 · 학생 '+n+'명':'연결됨 · 학생 대기');
          try{onParticipants(map)}catch(_){}
        });
        status('연결됨 · 학생 대기');
      }else{
        try{var d=window._onDisconnect&&window._onDisconnect(window.pth('prog/'+child));if(d&&d.remove)d.remove()}catch(_){}
        publish();
      }
      return true;
    }
    if(!room){
      status(isCoach?'수업방 없음 · 혼자 보기':'');
    }else{
      status('연결 대기');
      if(!connect()){
        var tries=0;
        var poll=setInterval(function(){tries+=1;if(connect()||tries>240){clearInterval(poll);if(!started)status('실시간 연결 지연')}},250);
        window.addEventListener('oncuvate:pilot-realtime-ready',function(){connect()});
      }
      if(!isCoach){
        ['input','change','click','pointerup','keyup'].forEach(function(name){document.addEventListener(name,function(){publishSoon(160)},true)});
        window.addEventListener('pagehide',function(){publish()});
      }
    }
    return{publish:publish,publishSoon:publishSoon,isCoach:isCoach,room:room,child:child,connected:function(){return started}};
  }
  /* 코치 패널용 참가자 목록 — 두 엔진(session01·space-series)이 같은 모양의 스냅샷을 보내므로 그리는 코드는 하나 */
  function renderList(element,map,sessionNo){
    if(!element)return;
    sessionNo=sessionNo||Number((window.ONCUVATE||{}).session)||0;
    bindNotes(element,sessionNo);
    var active=document.activeElement;
    if(active&&element.contains(active)&&active.matches('[data-coach-note]')){element.dataset.pendingRender=JSON.stringify(map||{});return}
    var rows=Object.keys(map||{}).map(function(key){return[key,map[key]]}).filter(function(pair){return pair[1]&&typeof pair[1]==='object'})
      .sort(function(a,b){return(b[1].updatedAt||0)-(a[1].updatedAt||0)})
      .map(function(pair){
        var key=pair[0],p=pair[1];
        var time=p.updatedAt?new Date(p.updatedAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}):'';
        var helpAge=p.helpRequestedAt?Math.round((Date.now()-Number(p.helpRequestedAt))/60000):-1;
        var help=helpAge>=0&&helpAge<30?'<strong class="coach-help-flag">🙋 도움 요청 · '+(helpAge<1?'방금':helpAge+'분 전')+(p.helpRequests>1?' · '+p.helpRequests+'회':'')+'</strong>':'';
        var child=String(p.child||key);
        var draft=drafts[child]!==undefined?drafts[child]:loadNote(sessionNo,child);
        var note='<div class="coach-note"><textarea data-coach-note="'+esc(child)+'" rows="2" placeholder="이 학생에 대한 코치 메모 (학습 기록과 함께 저장)">'+esc(draft)+'</textarea><div><button type="button" data-coach-note-save="'+esc(child)+'">메모 저장</button><i data-coach-note-status="'+esc(child)+'">'+esc(statusText[child]||(draft?'기기에 저장된 메모':''))+'</i></div></div>';
        return '<li class="coach-participant'+(p.done?' done':'')+(help?' asking':'')+'"><b>'+esc(p.child||key)+'</b><span>'+esc(p.screenLabel||p.screen||'')+'</span>'+help
          +(p.summary?'<small>'+esc(p.summary)+'</small>':'')
          +(p.notes?'<small>'+esc(p.notes)+'</small>':'')
          +(p.retell?'<em>'+esc(p.retell)+'</em>':'')
          +'<i>'+esc(time)+(p.done?' · 완료':'')+'</i>'+note+'</li>';
      });
    element.innerHTML=rows.length?rows.join(''):'<li>아직 들어온 학생이 없습니다.</li>';
  }
  window.OncuvateLiveMirror={create:create,renderList:renderList};
}());
