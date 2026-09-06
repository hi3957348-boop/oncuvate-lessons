/* 파일럿 전용 — URL 의 방·역할을 window.ONCUVATE 로 바꿔 넣는다. 정식 서비스에서는 서버가 넣어 주므로 이 파일은 납품 폴더에 두지 않는다. */
(function(){
  'use strict';
  const params=new URLSearchParams(location.search);
  const role=params.get('pilotRole')==='coach'?'coach':'child';
  const room=/^\d{5}$/.test(params.get('room')||'')?params.get('room'):'';
  const child=String(params.get('child')||'').replace(/[^A-Z0-9_-]/gi,'').slice(0,12)||(role==='coach'?'COACH':'P001');
  if(!room){location.replace('pilot-entry.html');return}
  const match=location.pathname.match(/session(\d+)\.html/);
  window.ONCUVATE={role,room,child,session:match?Number(match[1]):1,folder:'space-observatory-pilot',base:'./'};
  window._firebaseReady=false;
  import('./pilot-firebase-core.js').then(api=>api.connectBridge(room)).catch(()=>{document.documentElement.dataset.pilotRelay='offline'});
})();
