/* 파일럿 전용 — URL 의 방·역할을 window.ONCUVATE 로 바꿔 넣는다. 정식 서비스에서는 서버가 넣어 주므로 이 파일은 납품 폴더에 두지 않는다. */
(function(){
  'use strict';
  const params=new URLSearchParams(location.search);
  const room=/^\d{5}$/.test(params.get('room')||'')?params.get('room'):'';
  if(!room){location.replace('pilot-entry.html');return}
  /* 코치 권한은 링크가 아니라 '방을 연 기기'에 붙는다. 코치 링크가 다른 기기(양방향 브라우저 등)로 넘어가면 그 기기는 학생으로 연다. */
  const CLAIM_KEY='oncuvate.pilot.titanic-voyage.coach-room',CODE_KEY='oncuvate.pilot.titanic-voyage.child-code';
  function stored(key){try{return localStorage.getItem(key)||''}catch(_){return ''}}
  function deviceCode(){let code=stored(CODE_KEY);if(!/^[A-Z2-9]{4}$/.test(code)){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';code=Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join('');try{localStorage.setItem(CODE_KEY,code)}catch(_){}}return code}
  const role=params.get('pilotRole')==='coach'&&stored(CLAIM_KEY)===room?'coach':'child';
  if(params.get('pilotRole')==='coach'&&role!=='coach'){location.replace(location.pathname+'?pilotRole=child&room='+room+'&child='+deviceCode()+'&from=coach-link');return}
  const child=String(params.get('child')||'').replace(/[^A-Z0-9_-]/gi,'').slice(0,12)||(role==='coach'?'COACH':deviceCode());
  const match=location.pathname.match(/session(\d+)\.html/);
  window.ONCUVATE={role,room,child,session:match?Number(match[1]):1,folder:'titanic-voyage-pilot',base:'./'};
  window._firebaseReady=false;
  import('./pilot-firebase-core.js').then(api=>api.connectBridge(room)).catch(()=>{document.documentElement.dataset.pilotRelay='offline'});
})();
