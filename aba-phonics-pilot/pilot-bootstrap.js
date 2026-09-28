/* 파일럿 전용 — URL 의 방·역할을 window.ONCUVATE 로 바꿔 넣는다. 정식 서비스에서는 서버가 넣어 주므로 이 파일은 납품 폴더에 두지 않는다. */
(function(){
  'use strict';
  const params=new URLSearchParams(location.search);
  const room=/^\d{5}$/.test(params.get('room')||'')?params.get('room'):'';
  if(!room){location.replace('pilot-entry.html');return}
  /* 코치 권한은 링크가 아니라 '방을 연 기기'에 붙는다. 코치 링크가 다른 기기(양방향 브라우저 등)로 넘어가면 그 기기는 학생으로 연다. */
  const CLAIM_KEY='oncuvate.pilot.aba-phonics.coach-room',CODE_KEY='oncuvate.pilot.aba-phonics.child-code';
  function stored(key){try{return localStorage.getItem(key)||''}catch(_){return ''}}
  function deviceCode(){let code=stored(CODE_KEY);if(!/^[A-Z2-9]{4}$/.test(code)){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';code=Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join('');try{localStorage.setItem(CODE_KEY,code)}catch(_){}}return code}
  const role=params.get('pilotRole')==='coach'&&stored(CLAIM_KEY)===room?'coach':'child';
  if(params.get('pilotRole')==='coach'&&role!=='coach'){location.replace(location.pathname+'?pilotRole=child&room='+room+'&child='+deviceCode()+'&from=coach-link');return}
  const child=String(params.get('child')||'').replace(/[^A-Z0-9_-]/gi,'').slice(0,12)||(role==='coach'?'COACH':deviceCode());
  const match=location.pathname.match(/session(\d+)\.html/);
  window.ONCUVATE={role,room,child,session:match?Number(match[1]):1,folder:'aba-phonics-pilot',base:'./'};
  window._firebaseReady=false;
  const NICK_EMOJI={"토끼": "🐰", "고래": "🐳", "펭귄": "🐧", "다람쥐": "🐿️", "부엉이": "🦉", "수달": "🦦", "판다": "🐼", "여우": "🦊", "사자": "🦁", "호랑이": "🐯", "코알라": "🐨", "돌고래": "🐬", "기린": "🦒", "하마": "🦛", "오리": "🦆", "병아리": "🐥", "거북이": "🐢", "고양이": "🐱", "강아지": "🐶", "햄스터": "🐹", "딸기": "🍓", "사과": "🍎", "포도": "🍇", "수박": "🍉", "레몬": "🍋", "복숭아": "🍑", "체리": "🍒", "망고": "🥭", "바나나": "🍌", "귤": "🍊"};
  /* 학생 화면 오른쪽 위에 내 닉네임을 고정으로 보여 줌 */
  function showNick(nick){const put=()=>{let el=document.getElementById('pilotNick');if(!el){el=document.createElement('div');el.id='pilotNick';el.setAttribute('aria-label','내 닉네임');el.style.cssText='position:fixed;top:8px;right:10px;z-index:2147483000;display:flex;gap:6px;align-items:center;padding:5px 14px 5px 10px;border-radius:999px;background:#fff;color:#35206f;font:900 15px/1.2 "Malgun Gothic",system-ui,sans-serif;box-shadow:0 0 0 2px #d9cff5,0 6px 16px rgba(36,20,79,.18);pointer-events:none';document.documentElement.appendChild(el)}el.innerHTML='<span style="font-size:20px">'+(NICK_EMOJI[nick]||'🙂')+'</span>'+nick};put()}
  /* 칭찬 점수: 닉네임 옆 ⭐누적 + 축포와 +점수 */
  function showTotal(t){const put=()=>{const el=document.getElementById('pilotNick');if(!el)return setTimeout(put,300);let s=el.querySelector('.pn-total');if(!s){s=document.createElement('b');s.className='pn-total';s.style.cssText='margin-left:4px;padding:1px 8px;border-radius:999px;background:#ffd23f;color:#5a3d00;font-size:13px';el.appendChild(s)}s.textContent='⭐ '+(Number(t)||0)};put()}
  function celebrate(last){
    const root=document.documentElement,box=document.createElement('div');
    box.style.cssText='position:fixed;inset:0;z-index:2147483001;pointer-events:none;overflow:hidden';
    const colors=['#ff6b8b','#ffd23f','#4cc9f0','#7b61ff','#3ddc97','#ff9f43'];
    for(let i=0;i<90;i++){const c=document.createElement('i');const x=Math.random()*100,d=1.6+Math.random()*1.4,r=Math.random()*720,dx=(Math.random()*160-80);
      c.style.cssText=`position:absolute;left:${x}%;top:-20px;width:9px;height:14px;border-radius:2px;background:${colors[i%6]};opacity:.95;transition:transform ${d}s cubic-bezier(.2,.6,.4,1),opacity ${d}s ease-in`;
      box.appendChild(c);requestAnimationFrame(()=>requestAnimationFrame(()=>{c.style.transform=`translate(${dx}px,${innerHeight+60}px) rotate(${r}deg)`;c.style.opacity='.2'}))}
    const card=document.createElement('div');
    card.style.cssText='position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) scale(.3);opacity:0;transition:transform .5s cubic-bezier(.3,1.7,.5,1),opacity .3s;display:grid;justify-items:center;gap:6px;padding:18px 34px;border-radius:26px;background:#fff;box-shadow:0 0 0 5px #ffd23f,0 20px 50px rgba(36,20,79,.35);font-family:"Malgun Gothic",system-ui,sans-serif;text-align:center';
    card.innerHTML='<b style="font-size:54px;line-height:1;color:#ff9f1a;text-shadow:0 3px 0 #ffe7a8">+'+(Number(last.delta)||0)+'</b><span style="font-size:20px;font-weight:900;color:#35206f">'+String(last.reason||'칭찬해요!').replace(/[<>&]/g,'')+' 👏</span>';
    box.appendChild(card);root.appendChild(box);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{card.style.transform='translate(-50%,-50%) scale(1)';card.style.opacity='1'}));
    try{const A=window.AudioContext||window.webkitAudioContext,ctx=new A(),t=ctx.currentTime;[[523,0],[659,.1],[784,.2],[1047,.32]].forEach(([f,dl])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;g.gain.setValueAtTime(.0001,t+dl);g.gain.exponentialRampToValueAtTime(.18,t+dl+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dl+.35);o.connect(g);g.connect(ctx.destination);o.start(t+dl);o.stop(t+dl+.4)})}catch(_){}
    setTimeout(()=>{card.style.opacity='0';card.style.transform='translate(-50%,-60%) scale(.9)'},2600);setTimeout(()=>box.remove(),3400)}
  import('./pilot-firebase-core.js').then(async api=>{
    if(role==='child'){let nick='';try{nick=await api.claimNick(room,child)}catch(_){}if(nick){window.ONCUVATE.childName=nick;showNick(nick)}}
    if(role==='coach')window.ONQ_PILOT_PRAISE=(childId,delta,reason)=>api.sendPraise(room,childId,delta,reason);
    if(role==='coach')window.ONQ_PILOT_NOTE=(childId,text)=>api.sendNote(room,childId,text);
    if(role==='child'){let seen=-1;api.listenPraise(room,child,v=>{if(!v){if(seen<0)seen=0;return}showTotal(v.total);if(seen>=0&&v.seq>seen&&v.last)celebrate(v.last);seen=Number(v.seq)||0})}
    return api.connectBridge(room)}).catch(()=>{document.documentElement.dataset.pilotRelay='offline'});
})();
