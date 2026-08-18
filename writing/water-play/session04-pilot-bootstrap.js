(function(){
  'use strict';
  const lessons={
    'session01-life.html':{key:'life',entry:'session01-entry.html'},
    'session02-explanation.html':{key:'explanation',entry:'session02-entry.html'},
    'session03-persuasion.html':{key:'persuasion',entry:'session03-entry.html'},
    'session04-poem.html':{key:'poem',entry:'session04-entry.html'}
  };
  const file=location.pathname.split('/').pop()||'',lesson=lessons[file];
  const params=new URLSearchParams(location.search),requestedRole=params.get('pilotRole');
  if(!lesson){location.replace('course.html');return}
  if(requestedRole!=='coach'&&requestedRole!=='child'){location.replace(lesson.entry);return}
  const role=requestedRole==='coach'?'coach':'child';
  const room=/^\d{5}$/.test(params.get('room')||'')?params.get('room'):'';
  const child=String(params.get('child')||'').replace(/[^A-Z0-9_-]/gi,'').slice(0,12)||(role==='coach'?'coach':'P001');
  if(!room){location.replace(lesson.entry);return}
  window.ONCUVATE={role,room,child,session:'pilot',folder:`water-play-${lesson.key}`,lessonKey:lesson.key};
  window._firebaseReady=false;
  import('./session04-pilot-firebase.js').then(api=>api.connectBridge(room,lesson.key)).catch(()=>location.replace(`${lesson.entry}?error=room`));
})();