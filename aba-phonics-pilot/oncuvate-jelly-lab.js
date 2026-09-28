(()=>{
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SPOTS=[[8,12],[36,15],[64,11],[92,17],[18,49],[45,52],[72,46],[92,54],[8,88],[36,85],[64,90],[90,83]];
  const headsetIcon='<span class="s6-listen-headset" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M7 17v-2a9 9 0 0 1 18 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="5" y="15" width="5" height="9" rx="2.5" fill="currentColor"/><rect x="22" y="15" width="5" height="9" rx="2.5" fill="currentColor"/><path d="M13 17v5m3-9v13m3-9v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  let audioContext=null;
  function boing(){
    try{
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      audioContext=audioContext||new C();if(audioContext.state==='suspended')audioContext.resume();
      const now=audioContext.currentTime,o=audioContext.createOscillator(),g=audioContext.createGain();
      o.type='sine';o.frequency.setValueAtTime(180,now);o.frequency.exponentialRampToValueAtTime(620,now+.08);o.frequency.exponentialRampToValueAtTime(135,now+.38);
      g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.19,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+.42);
      o.connect(g);g.connect(audioContext.destination);o.start(now);o.stop(now+.45);
    }catch(e){}
  }
  function createPositions(previous=null){
    let best=null,bestScore=-1;
    const attempts=previous?36:1;
    for(let attempt=0;attempt<attempts;attempt++){
      const order=SPOTS.map((_,i)=>i);
      for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
      const candidate=order.map(slot=>{const p=SPOTS[slot];return{x:clamp(p[0]+(Math.random()*1.6-.8),7,93),y:clamp(p[1]+(Math.random()*1.6-.8),10,90)}});
      const score=previous?Math.min(...candidate.map((p,i)=>Math.hypot((p.x-previous[i].x)*2.7,p.y-previous[i].y))):0;
      if(score>bestScore){best=candidate;bestScore=score}
    }
    return best;
  }
  window.createOncuvateJellyLab=function(config){
    const targets=config.targets.map(x=>Array.isArray(x)?{word:x[0],parts:x[1]}:x);
    const grid=config.grid.slice(0,12);
    const wordHtml=config.wordHtml||esc;
    let index=0,made=[],positions=null,fromPositions=null,active=null,rejected=[],merged=[],feedback='',shuffling=false,retryTimer=null,advanceTimer=null;
    const requestRender=()=>config.render&&config.render();
    function clearTimers(){clearTimeout(retryTimer);clearTimeout(advanceTimer);retryTimer=null;advanceTimer=null}
    function reset(){clearTimers();index=0;made=[];positions=null;fromPositions=null;active=null;rejected=[];merged=[];feedback='';shuffling=false}
    function next(){
      if(index<targets.length-1){index++;positions=null;fromPositions=null;active=null;rejected=[];merged=[];feedback='';shuffling=false;requestRender()}
      else if(config.finish)config.finish();
    }
    function scheduleNext(){clearTimeout(advanceTimer);const n=index;advanceTimer=setTimeout(()=>{advanceTimer=null;if(index===n&&feedback==='correct')next()},1550)}
    function tryPair(first,second,spatial=false){
      if(first===second||feedback==='correct'||shuffling)return;
      const target=targets[index],ordered=spatial?[first,second].sort((a,b)=>positions[a].x-positions[b].x):[first,second],values=ordered.map(i=>grid[i]);
      if(values[0]===target.parts[0]&&values[1]===target.parts[1]){
        merged=ordered;active=null;rejected=[];feedback='correct';if(!made.includes(target.word))made.push(target.word);
        if(config.success)config.success();setTimeout(()=>config.speak&&config.speak(target.word,'word'),100);requestRender();scheduleNext();return;
      }
      const previous=positions.map(p=>({...p})),nextPositions=createPositions(previous);
      positions=nextPositions;fromPositions=previous;shuffling=true;rejected=[first,second];active=null;feedback='retry';boing();requestRender();if(config.retry)config.retry();
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(!shuffling)return;
        document.querySelectorAll('[data-ocj-card]').forEach(piece=>{const p=positions[Number(piece.dataset.ocjCard)];piece.style.left=p.x+'%';piece.style.top=p.y+'%'});
      }));
      clearTimeout(retryTimer);retryTimer=setTimeout(()=>{rejected=[];fromPositions=null;shuffling=false;feedback='';requestRender()},650);
    }
    function html(){
      if(!positions)positions=createPositions();
      const target=targets[index],mergedIds=new Set(merged),display=fromPositions||positions;
      const pieces=grid.map((value,i)=>{
        if(mergedIds.has(i))return '';
        const p=display[i],selected=active===i,repel=rejected.indexOf(i);
        return '<button type="button" class="ocj-piece '+(value.length===1?'type-consonant ':'type-vc ')+(selected?'active ':'')+(shuffling?'shuffling ':'')+(repel===0?'repel-one ':repel===1?'repel-two ':'')+'" data-ocj-card="'+i+'" style="left:'+p.x+'%;top:'+p.y+'%;--jelly-turn:'+((i%7)-3)+'deg" aria-pressed="'+selected+'" '+(feedback==='correct'?'disabled':'')+'><span>'+(value.length>1?wordHtml(value):esc(value))+'</span></button>';
      }).join('');
      const celebration=feedback==='correct'?'<div class="ocj-celebration" role="status" aria-live="assertive"><strong>'+wordHtml(target.word)+'</strong><small>완성!</small></div>':'';
      const visible=feedback==='correct'?made.slice(0,-1):made;
      const tray='<div class="ocj-tray" aria-label="완성한 단어 '+visible.length+'개">'+(visible.length?visible.map((word,i)=>'<button type="button" data-ocj-sound="'+esc(word)+'" class="'+(feedback!=='correct'&&i===visible.length-1?'latest':'')+'">'+wordHtml(word)+'</button>').join(''):'<span>완성한 단어가 여기에 모여요.</span>')+'</div>';
      const status=feedback==='correct'?'완성한 단어가 아래로 이동해요. 다음 낱말을 준비할게요.':feedback==='retry'?'띠용! 젤리가 새 자리로 흩어졌어요. 소리를 다시 들어보세요.':'젤리 두 개를 끌어 서로 가까이 붙여요.';
      return '<div class="ocj-lab"><div class="ocj-toolbar"><button type="button" class="ocj-listen" data-ocj-sound="'+esc(target.word)+'">'+headsetIcon+'<span>낱말 소리 듣기</span></button><strong>JELLY SOUND LAB</strong><span>'+(index+1)+' / '+targets.length+' · 젤리 2개 합치기</span></div><div class="ocj-field" data-ocj-field>'+pieces+'</div>'+celebration+tray+'<div class="ocj-feedback '+(feedback==='correct'?'good':feedback==='retry'?'retry':'')+'" role="status">'+status+'</div></div>';
    }
    function bind(root=document){
      const field=root.querySelector('[data-ocj-field]');
      root.querySelectorAll('[data-ocj-sound]').forEach(button=>button.onclick=e=>{e.stopPropagation();if(config.speak)config.speak(button.dataset.ocjSound,'word')});
      root.querySelectorAll('[data-ocj-card]').forEach(piece=>{
        let pointer=null,moved=false,startX=0,startY=0;
        piece.addEventListener('pointerdown',event=>{if(feedback==='correct'||shuffling)return;pointer=event.pointerId;moved=false;startX=event.clientX;startY=event.clientY;piece.setPointerCapture(pointer);piece.classList.add('dragging')});
        piece.addEventListener('pointermove',event=>{if(pointer!==event.pointerId||!field)return;if(Math.hypot(event.clientX-startX,event.clientY-startY)>4)moved=true;if(!moved)return;const r=field.getBoundingClientRect(),id=Number(piece.dataset.ocjCard),x=clamp((event.clientX-r.left)/r.width*100,7,93),y=clamp((event.clientY-r.top)/r.height*100,10,90);positions[id]={x,y};piece.style.left=x+'%';piece.style.top=y+'%'});
        piece.addEventListener('pointerup',event=>{if(pointer!==event.pointerId)return;piece.classList.remove('dragging');piece.releasePointerCapture(pointer);pointer=null;const id=Number(piece.dataset.ocjCard);if(moved&&field){piece.dataset.ignoreClick='1';const r=field.getBoundingClientRect(),here=positions[id];let nearest=null,best=Infinity;grid.forEach((_,other)=>{if(other===id)return;const p=positions[other],distance=Math.hypot((here.x-p.x)*r.width/100,(here.y-p.y)*r.height/100);if(distance<best){best=distance;nearest=other}});if(nearest!==null&&best<76)tryPair(id,nearest,true);else{active=id;requestRender()}}});
        piece.addEventListener('click',()=>{if(piece.dataset.ignoreClick){delete piece.dataset.ignoreClick;return}if(shuffling)return;const id=Number(piece.dataset.ocjCard),value=grid[id];if(config.speak)config.speak(value,value.length===1?'phoneme':'rime');if(active===null){active=id;feedback='';requestRender()}else if(active===id){active=null;requestRender()}else tryPair(active,id,false)});
      });
    }
    return{html,bind,reset,getState:()=>({index,made:[...made],positions:positions&&positions.map(p=>({...p})),feedback,shuffling})};
  };
})();
