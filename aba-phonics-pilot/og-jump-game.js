/* 점핑워드 · 바닥에서 콩콩 뛰던 젤리가 하늘로 튀어 오르면, 하늘에 닿기 전에 잡는다.
   잡으면 숨어 있던 낱말이 크게 나타나고, 잠깐 뒤 소리가 난다(먼저 읽어 보게).
   모드: 'ten' = 젤리 GOAL(20)개 잡기(걸린 시간), 'minute' = 1분 동안 몇 개.
   아이마다 자기 화면에서 혼자 하는 게임이라 수업방 공유는 쓰지 않는다. */
(() => {
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const HUES=[0,-70,60,140,200,-120];
  const LANES=[10,26,42,58,74,90];
  const GOAL=20;   // 챌린지 목표 개수 — 반복 연습이 목적이라 같은 낱말이 다시 나와도 됨
  let ctx=null;
  function tone(freqs,type='sine',vol=.14){
    try{
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      ctx=ctx||new C();if(ctx.state==='suspended')ctx.resume();
      const now=ctx.currentTime;
      freqs.forEach(([f,d,e,f2])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,now+d);if(f2)o.frequency.exponentialRampToValueAtTime(f2,now+e);g.gain.setValueAtTime(.0001,now+d);g.gain.exponentialRampToValueAtTime(vol,now+d+.02);g.gain.exponentialRampToValueAtTime(.0001,now+e);o.connect(g);g.connect(ctx.destination);o.start(now+d);o.stop(now+e+.02)});
    }catch(e){}
  }
  const sfx={
    launch:()=>tone([[220,0,.28,660]],'triangle',.08),
    catch:()=>tone([[784,0,.12],[1046,.08,.26]],'sine',.16),
    miss:()=>tone([[330,0,.3,160]],'sine',.07),
    count:()=>tone([[520,0,.12]],'square',.05),
    go:()=>tone([[660,0,.1],[880,.1,.3]],'square',.06),
    win:()=>tone([[523,0,.15],[659,.12,.28],[784,.24,.42],[1046,.36,.7]],'triangle',.12)
  };
  // 속도: 뛰어오르는 시간·다음 젤리 간격에 곱하는 값 (클수록 느림). 고른 값은 이 기기에 기억
  const SPEEDS=[{id:'slow',label:'🐢 천천히',k:1.4},{id:'normal',label:'🙂 보통',k:1},{id:'fast',label:'🐇 빠르게',k:.75}];
  const readSpeed=()=>{try{return SPEEDS.find(x=>x.id===localStorage.getItem('ogkr-digraph:jump-speed-v2'))||SPEEDS[1]}catch(e){return SPEEDS[1]}};
  const writeSpeed=id=>{try{localStorage.setItem('ogkr-digraph:jump-speed-v2',id)}catch(e){}};
  const readEasy=()=>{try{return localStorage.getItem('ogkr-digraph:jump-easy')==='1'}catch(e){return false}};
  const writeEasy=v=>{try{localStorage.setItem('ogkr-digraph:jump-easy',v?'1':'0')}catch(e){}};
  const bestKey=m=>'ogkr-digraph:jump-best-'+m+(m==='ten'?GOAL:'')+'-'+readSpeed().id;
  const readBest=m=>{try{return Number(localStorage.getItem(bestKey(m)))||0}catch(e){return 0}};
  const writeBest=(m,v)=>{try{localStorage.setItem(bestKey(m),String(v))}catch(e){}};

  window.createJumpingWords=function(config){
    const bag0=config.words.slice();
    let el=null,raf=0,timers=[],g=null,speed=readSpeed(),easy=readEasy();
    // 코치가 정한 값이 있으면 그걸 쓰고 아이는 바꿀 수 없음
    const policy=()=>(config.policy&&config.policy())||{easy:'child',speed:'child'};
    const lockEasy=()=>policy().easy!=='child',lockSpeed=()=>policy().speed!=='child';
    function applyPolicy(){const pol=policy();if(pol.easy!=='child')easy=pol.easy==='on';if(pol.speed!=='child')speed=SPEEDS.find(x=>x.id===pol.speed)||speed}
    const later=(fn,ms)=>{const t=setTimeout(fn,ms);timers.push(t);return t};
    const clearAll=()=>{cancelAnimationFrame(raf);raf=0;timers.forEach(clearTimeout);timers=[]};
    let bag=[];
    const nextWord=()=>{if(!bag.length){bag=bag0.slice();for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}}return bag.pop()};
    function freshGame(mode){
      return{mode,phase:'count',count:3,start:0,now:0,caught:0,missed:0,combo:0,best:readBest(mode),log:[],
        jellies:LANES.map((x,i)=>({id:i,x,hue:HUES[i%HUES.length],state:'ground',phase:Math.random()*6,t0:0,dur:0,word:'',drift:0,y:0})),
        nextLaunch:0,last:null};
    }
    // ---------- 화면 ----------
    function menuHtml(){
      applyPolicy();
      const b10=readBest('ten'),b60=readBest('minute');
      return '<div class="ojw-menu"><div class="ojw-title"><b>JUMPING WORDS</b><strong>점핑워드</strong><span>하늘로 뛰어오르는 젤리를 잡으면 낱말이 나타나요. 소리 내어 읽어요!</span></div><div class="ojw-modes"><button type="button" class="ojw-mode ten" data-jw-mode="ten"><i>🎯</i><b>'+GOAL+'개 잡기 챌린지</b><small>젤리 '+GOAL+'개를 누가 더 빨리?</small><em>'+(b10?'최고 기록 '+(b10/1000).toFixed(1)+'초':'첫 기록에 도전!')+'</em></button><button type="button" class="ojw-mode minute" data-jw-mode="minute"><i>⏱️</i><b>1분 도전</b><small>1분 동안 몇 개나 잡을까?</small><em>'+(b60?'최고 기록 '+b60+'개':'첫 기록에 도전!')+'</em></button></div><div class="ojw-speed" role="group" aria-label="젤리 속도"><span>젤리 속도</span>'+SPEEDS.map(x=>'<button type="button" data-jw-speed="'+x.id+'" aria-pressed="'+(x.id===speed.id)+'" class="'+(x.id===speed.id?'on':'')+'" '+(lockSpeed()?'disabled':'')+'>'+x.label+'</button>').join('')+(lockSpeed()?'<em class="ojw-lock">🔒 코치가 정함</em>':'')+'</div><button type="button" class="ojw-easy '+(easy?'on':'')+'" data-jw-easy aria-pressed="'+easy+'" '+(lockEasy()?'disabled':'')+'><i></i><b>이지모드</b><small>'+(lockEasy()?'🔒 코치가 정함 · ':'')+(easy?'뛰어오를 젤리에 🚀 부스터가 먼저 붙어요':'꺼짐 · 어느 젤리가 뛸지 몰라요')+'</small></button></div>';
    }
    function stageHtml(){
      return '<div class="ojw-stage '+(easy?'easy':'')+'" data-jw-stage><div class="ojw-sky"><i class="c1"></i><i class="c2"></i><i class="c3"></i></div><div class="ojw-skyline"><span>하늘 선</span></div><div class="ojw-hud"><span class="ojw-hud-mode">'+(g.mode==='ten'?'🎯 '+GOAL+'개 잡기':'⏱️ 1분 도전')+' · '+speed.label+(easy?' · 🚀 이지':'')+'</span><span class="ojw-hud-main" data-jw-main></span><span class="ojw-hud-time" data-jw-time></span><span class="ojw-hud-combo" data-jw-combo></span></div><div class="ojw-field" data-jw-field>'+g.jellies.map(j=>'<button type="button" class="ojw-jelly" data-jw-jelly="'+j.id+'" style="--hue:'+j.hue+'deg" aria-label="젤리 잡기"><img src="'+config.sprite+'" alt="" draggable="false"><span class="ojw-boost" aria-hidden="true"><i></i><i></i><i></i></span></button>').join('')+'</div><div class="ojw-ground"></div><div class="ojw-word" data-jw-word aria-live="assertive"></div><div class="ojw-overlay" data-jw-overlay></div></div>';
    }
    function endHtml(){
      const ms=g.now-g.start,record=g.mode==='ten'?ms:g.caught,isBest=g.newBest;
      const counts={};g.log.forEach(w=>{counts[w]=(counts[w]||0)+1});
      const chips=Object.entries(counts).map(([w,n])=>'<button type="button" class="ojw-chip" data-jw-say="'+esc(w)+'">'+config.wordHtml(w)+(n>1?'<small>×'+n+'</small>':'')+'</button>').join('');
      const head=g.mode==='ten'?(g.caught>=GOAL?'<b>'+(ms/1000).toFixed(1)+'초</b> 만에 '+GOAL+'개!':'<b>'+g.caught+'개</b>'):'1분 동안 <b>'+g.caught+'개</b>!';
      return '<div class="ojw-end"><div class="ojw-trophy">'+(isBest?'🏆':'⭐')+'</div><h3>'+head+'</h3><p class="ojw-best">'+(isBest?'새 최고 기록!':'최고 기록 '+(g.mode==='ten'?(g.best/1000).toFixed(1)+'초':g.best+'개'))+' · 놓친 젤리 '+g.missed+'개</p><p class="ojw-read">잡은 낱말을 눌러 다시 들어 봐요</p><div class="ojw-chips">'+(chips||'<span>잡은 낱말이 없어요</span>')+'</div><div class="ojw-end-act"><button type="button" class="ogd-soft" data-jw-menu>모드 고르기</button><button type="button" class="s6-primary" data-jw-again>한 번 더!</button></div></div>';
    }
    function html(){
      if(!g)return '<div class="ojw" data-jw-root>'+menuHtml()+'</div>';
      if(g.phase==='end')return '<div class="ojw" data-jw-root>'+endHtml()+'</div>';
      return '<div class="ojw" data-jw-root>'+stageHtml()+'</div>';
    }
    // ---------- 동작 ----------
    function hud(){
      if(!el)return;
      const main=el.querySelector('[data-jw-main]'),time=el.querySelector('[data-jw-time]'),combo=el.querySelector('[data-jw-combo]');
      const ms=Math.max(0,g.now-g.start);
      if(main)main.innerHTML=g.mode==='ten'?'잡은 젤리 <b>'+g.caught+'</b> / '+GOAL:'잡은 젤리 <b>'+g.caught+'</b>';
      if(time)time.innerHTML=g.mode==='ten'?(ms/1000).toFixed(1)+'초':'남은 시간 <b class="'+(60000-ms<10000?'hot':'')+'">'+Math.ceil(Math.max(0,60000-ms)/1000)+'</b>초';
      if(combo)combo.textContent=g.combo>=3?'🔥 '+g.combo+' 연속!':'';
    }
    function mountStage(){
      el.innerHTML=html();
      el.querySelectorAll('[data-jw-jelly]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();grab(Number(b.dataset.jwJelly))}));
      hud();
    }
    function start(mode){
      applyPolicy();clearAll();g=freshGame(mode);bag=[];mountStage();
      const ov=el.querySelector('[data-jw-overlay]');
      const show=t=>{if(ov){ov.innerHTML='<span>'+t+'</span>';ov.classList.remove('pop');void ov.offsetWidth;ov.classList.add('pop')}};
      show(3);sfx.count();
      later(()=>{show(2);sfx.count()},700);later(()=>{show(1);sfx.count()},1400);
      later(()=>{show('GO!');sfx.go();g.phase='play';g.start=performance.now();g.nextLaunch=g.start+500;loop()},2100);
      later(()=>{if(ov)ov.innerHTML=''},2600);
    }
    function launch(now){
      const ground=g.jellies.filter(j=>j.state==='ground');if(!ground.length)return;
      const j=ground[Math.floor(Math.random()*ground.length)];
      const level=Math.min(12,g.caught);
      // 먼저 웅크렸다가(0.45초) 힘껏 뛰어오른다. 하늘까지 2.9초 → 조금씩 빨라져도 1.9초보다 빠르지 않게
      j.state='crouch';j.t0=now;j.dur=(Math.max(1150,2300-level*95)+Math.random()*250)*speed.k;j.word=nextWord();j.drift=(Math.random()*2-1)*5;
      const b=el&&el.querySelector('[data-jw-jelly="'+j.id+'"]');if(b){b.classList.add('crouch');b.classList.remove('caught','escaped')}
      const warn=easy?300:0;j.warn=warn;
      const go=()=>{if(!g||j.state!=='crouch')return;j.state='fly';j.t0=performance.now();if(b){b.classList.remove('crouch');b.classList.add('fly')}sfx.launch()};
      if(warn)later(go,warn);else go();
    }
    function grab(id){
      if(!g||g.phase!=='play')return;
      const j=g.jellies[id];if(!j||j.state!=='fly')return;
      j.state='caught';g.caught++;g.combo++;g.log.push(j.word);
      config.onCatch&&config.onCatch(j.word);
      sfx.catch();
      const field=el.querySelector('[data-jw-field]'),b=el.querySelector('[data-jw-jelly="'+id+'"]');
      if(b){b.classList.remove('fly');b.classList.add('caught')}
      if(field){const pop=document.createElement('div');pop.className='ojw-pop';pop.style.left=j.x+'%';pop.style.bottom=(j.y+30)+'px';pop.innerHTML='<b>+1</b>'+'<i></i>'.repeat(8);field.appendChild(pop);later(()=>pop.remove(),900)}
      const wordEl=el.querySelector('[data-jw-word]');
      if(wordEl){wordEl.innerHTML='<strong>'+config.wordHtml(j.word)+'</strong>';wordEl.classList.remove('show');void wordEl.offsetWidth;wordEl.classList.add('show')}
      g.nextLaunch=performance.now()+1200+250*speed.k;
      const w=j.word;later(()=>config.speak&&config.speak(w),350);
      later(()=>{j.state='ground';j.y=0;if(b)b.classList.remove('caught')},900);
      hud();
      if(g.mode==='ten'&&g.caught>=GOAL)finish();
    }
    function finish(){
      if(g.phase==='end')return;
      g.now=performance.now();g.phase='end';clearAll();
      const ms=g.now-g.start,val=g.mode==='ten'?ms:g.caught;
      const done=g.mode==='minute'||g.caught>=GOAL;
      g.newBest=done&&(g.mode==='ten'?(!g.best||val<g.best):val>g.best);
      if(g.newBest){writeBest(g.mode,Math.round(val));g.best=Math.round(val)}
      config.onFinish&&config.onFinish({mode:g.mode,caught:g.caught,missed:g.missed,ms:Math.round(ms)});
      sfx.win();
      if(el){el.innerHTML=html();bindEnd()}
    }
    function loop(){
      raf=requestAnimationFrame(loop);
      if(!el||!el.isConnected){clearAll();return}
      const now=performance.now();g.now=now;
      if(g.mode==='minute'&&now-g.start>=60000){finish();return}
      const flying=g.jellies.filter(j=>j.state==='fly').length,level=Math.min(12,g.caught);
      const busy=g.jellies.filter(j=>j.state==='crouch').length;
      // 한 번에 한 젤리만. 잡은 낱말 상자가 완전히 사라진 뒤에 다음 젤리가 뛴다
      if(now>=g.nextLaunch&&flying+busy===0){launch(now);g.nextLaunch=Infinity}
      const field=el.querySelector('[data-jw-field]');const H=field?field.clientHeight:260;
      g.jellies.forEach(j=>{
        const b=el.querySelector('[data-jw-jelly="'+j.id+'"]');if(!b)return;
        if(j.state==='ground'){
          // 뽀용뽀용: 바닥에 닿을 때 납작, 떠오를 때 살짝 길쭉
          const s=Math.abs(Math.sin(now/300+j.phase)),y=s*18,squash=Math.pow(1-s,4);
          j.y=y;b.style.left=j.x+'%';
          b.style.transform='translate(-50%,0) translateY('+(-y)+'px) rotate('+(Math.sin(now/600+j.phase)*4)+'deg) scale('+(1+squash*.18-s*.03)+','+(1-squash*.2+s*.05)+')';return}
        if(j.state==='crouch'){const k=Math.min(1,(now-j.t0)/Math.max(1,j.warn||450));b.style.left=j.x+'%';b.style.transform='translate(-50%,0) translateX('+(Math.sin(now/30)*1.5)+'px) scale('+(1+k*.28)+','+(1-k*.34)+')';return}
        if(j.state==='fly'){
          const p=(now-j.t0)/j.dur;
          if(p>=1){j.state='escaped';g.missed++;g.nextLaunch=now+(500+Math.random()*400)*speed.k;g.combo=0;sfx.miss();b.classList.remove('fly');b.classList.add('escaped');config.onMiss&&config.onMiss(j.word);later(()=>{j.state='ground';j.y=0;b.classList.remove('escaped')},900);hud();return}
          // 처음엔 힘차게 솟고(쭉 늘어남) 위로 갈수록 살짝 느려짐
          const e=1-Math.pow(1-p,1.6);j.y=(H+60)*e;
          const stretch=Math.max(0,.35-p)*.9;
          b.style.transform='translate(-50%,0) translateY('+(-j.y)+'px) rotate('+(j.drift*p*4)+'deg) scale('+(1-stretch*.5)+','+(1+stretch)+')';b.style.left=(j.x+j.drift*p)+'%';
        }
      });
      hud();
    }
    function bindMenu(){
      el.querySelector('[data-jw-easy]')?.addEventListener('click',()=>{easy=!easy;writeEasy(easy);el.innerHTML=html();bindMenu()});
      el.querySelectorAll('[data-jw-mode]').forEach(b=>b.onclick=()=>start(b.dataset.jwMode));
      el.querySelectorAll('[data-jw-speed]').forEach(b=>b.onclick=()=>{speed=SPEEDS.find(x=>x.id===b.dataset.jwSpeed)||speed;writeSpeed(speed.id);el.innerHTML=html();bindMenu()});
    }
    function bindEnd(){
      el.querySelectorAll('[data-jw-say]').forEach(b=>b.onclick=()=>config.speak&&config.speak(b.dataset.jwSay));
      el.querySelector('[data-jw-again]')?.addEventListener('click',()=>start(g.mode));
      el.querySelector('[data-jw-menu]')?.addEventListener('click',()=>{g=null;el.innerHTML=html();bindMenu()});
    }
    function mount(host){
      el=host;
      if(!g){el.innerHTML=html();bindMenu();return}
      if(g.phase==='end'){el.innerHTML=html();bindEnd();return}
      mountStage();if(g.phase==='play'&&!raf)loop();
    }
    function stop(){clearAll();g=null;el=null}
    return{html,mount,stop,getState:()=>g?{mode:g.mode,phase:g.phase,caught:g.caught,missed:g.missed}:{phase:'menu',caught:0}};
  };
})();
