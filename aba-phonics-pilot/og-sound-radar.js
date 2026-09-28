/* 이중자 Sound Check · 6회차 session06-t-radar.js 화면을 그대로 쓰고, 목표 소리를 두 글자(ch·sh·th…)까지 받도록 넓힌 판.
   - 소리 단위: tch ch sh th wh ck qu ss ll ff zz 는 한 칸(한 소리)으로 셉니다.
   - 낱말 음성은 options.speak(낱말 녹음 → 없으면 브라우저 임시 음성)로 재생합니다. */
(() => {
  'use strict';
  const DIGRAPHS=['ch','sh','th','wh','ck','qu','ss','ll','ff','zz'];
  const units=word=>{const out=[];for(let i=0;i<word.length;){if(word.slice(i,i+3)==='tch'){out.push('tch');i+=3;continue}const two=word.slice(i,i+2);if(DIGRAPHS.includes(two)){out.push(two);i+=2}else{out.push(word[i]);i+=1}}return out};
  const banks={
    ch:[
      {word:'chip',position:'first'},{word:'catch',position:'last'},{word:'jam',position:'first'},{word:'match',position:'last'},{word:'chat',position:'first'},
      {word:'dig',position:'last'},{word:'chin',position:'first'},{word:'map',position:'last'},{word:'jet',position:'first'},{word:'pitch',position:'last'}
    ],
    j:[
      {word:'jam',position:'first'},{word:'chip',position:'first'},{word:'jet',position:'first'},{word:'jig',position:'first'},{word:'chat',position:'first'},
      {word:'jab',position:'first'},{word:'chin',position:'first'},{word:'jug',position:'first'},{word:'chop',position:'first'},{word:'job',position:'first'}
    ]
  };
  let letter='ch',items=banks.ch,qText='',yesText='',noText='';
  const sessions={};
  const soundIcon='<span class="tr-brand-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M7 17v-2a9 9 0 0 1 18 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="5" y="15" width="5" height="9" rx="2.5" fill="currentColor"/><rect x="22" y="15" width="5" height="9" rx="2.5" fill="currentColor"/><path d="M13 17v5m3-9v13m3-9v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';
  let index=0,selected=null,confirmed=false,complete=false,message='',speakWord=null;
  let visited=new Set();
  const $=s=>document.querySelector(s);
  const label=l=>l[0].toUpperCase()+l.slice(1);
  const targetIndex=item=>item.position==='first'?0:units(item.word).length-1;
  // tch는 ch와 같은 소리
  const sound=u=>u==='tch'?'ch':u;
  const answer=item=>item.answer||(sound(units(item.word)[targetIndex(item)])===letter?'O':'X');
  const total=()=>items.length;
  function render(){
    if(complete)return '<section class="s6-t-radar tr-finish"><div class="tr-finish-badge" aria-hidden="true">'+label(letter)+'<span>'+total()+'</span></div><h3>소리 탐험 완료!</h3><p>낱말의 처음과 끝을 살펴봤어요.</p><button class="tr-primary" data-tr-continue>소리 학습으로 돌아가기</button><button class="tr-again" data-tr-again>한 번 더 탐험하기</button></section>';
    const item=items[index],ti=targetIndex(item),parts=units(item.word);
    const feedback=confirmed?(selected===answer(item)?'잘 살펴봤어요! ':'한 번 더 살펴봐요. ')+(answer(item)==='O'?(yesText||'빈칸은 '+letter+' 소리예요.'):(noText||'빈칸은 다른 소리예요.')):message;
    return '<section class="s6-t-radar" aria-label="'+label(letter)+' 소리 레이더">'+
      '<div class="tr-top"><span class="tr-title">'+soundIcon+' 소리 레이더</span><span class="tr-counter">'+(index+1)+' <span>/ '+total()+'</span></span></div>'+
      '<div class="tr-console"><div class="tr-word" aria-label="'+(confirmed?item.word:parts.map((c,i)=>i===ti?'빈칸':c).join(' '))+'">'+parts.map((c,i)=>'<span class="tr-letter '+(i===ti?'tr-target':'')+'">'+(i===ti&&!confirmed?'_':c)+'</span>').join('')+'</div>'+
      '<button class="tr-play" data-tr-play aria-label="낱말 전체 듣기">'+soundIcon+'<b>낱말 듣기</b><span class="tr-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></button></div>'+
      '<p class="tr-question">'+(qText||('빈칸에 <b>'+letter+'</b> 소리가 들어갈까요?'))+'</p>'+
      '<div class="tr-answers" role="group" aria-label="'+label(letter)+' 소리인가요">'+['O','X'].map(v=>'<button class="tr-choice '+(selected===v?'selected':'')+'" data-tr-choice="'+v+'" aria-pressed="'+(selected===v)+'" '+(confirmed?'disabled':'')+'><span aria-hidden="true" class="tr-symbol '+(v==='O'?'tr-circle':'tr-cross')+'"></span><b>'+v+'<small>'+(v==='O'?'맞아요':'아니에요')+'</small></b></button>').join('')+'</div>'+
      '<div class="tr-action"><p class="tr-message" role="status">'+feedback+'</p>'+(confirmed?'<button class="tr-primary" data-tr-next>'+(index===total()-1?'탐험 마치기':'다음 소리')+' →</button>':'<button class="tr-primary" data-tr-confirm '+(selected===null?'disabled':'')+'>확인</button>')+'</div>'+
      '<div class="tr-bottom"><div class="tr-route" aria-label="문항 바로 이동">'+items.map((_,i)=>'<button data-tr-jump="'+i+'" class="'+(i===index?'current':visited.has(i)?'visited':'')+'" aria-label="'+(i+1)+'번째 낱말" '+(i===index?'aria-current="step"':'')+'><span></span></button>').join('')+'</div><small id="tr-audio-note">낱말 전체를 듣고 골라요</small></div></section>';
  }
  function bind(options){
    const root=$('.s6-t-radar');if(!root)return;
    const repaint=focus=>{root.outerHTML=render();bind(options);if(focus)$(focus)?.focus({preventScroll:true})};
    const move=n=>{options.stopAudio();index=n;selected=null;confirmed=false;complete=false;message='';repaint('[data-tr-play]')};
    root.querySelectorAll('[data-tr-choice]').forEach(b=>b.onclick=()=>{selected=b.dataset.trChoice;message='';repaint('[data-tr-choice="'+selected+'"]')});
    root.querySelector('[data-tr-confirm]')?.addEventListener('click',()=>{
      if(selected===null)return;
      const ok=selected===answer(items[index]);
      window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'answer',activityId:'intro-'+letter,itemId:'radar-'+(index+1),response:selected,correct:ok}}));
      if(!ok){message='소리를 다시 잘 듣고 빈칸의 자리를 살펴봐요.';selected=null;confirmed=false;window.S6Help?.wrong({activityId:'intro-'+letter,itemId:'radar-'+(index+1)});repaint('[data-tr-play]');return}
      confirmed=true;visited.add(index);repaint('[data-tr-next]')
    });
    root.querySelector('[data-tr-next]')?.addEventListener('click',()=>{if(index<total()-1)move(index+1);else{options.stopAudio();complete=true;repaint('[data-tr-continue]')}});
    root.querySelectorAll('[data-tr-jump]').forEach(b=>b.onclick=()=>move(Number(b.dataset.trJump)));
    root.querySelector('[data-tr-again]')?.addEventListener('click',()=>{visited.clear();move(0)});
    root.querySelector('[data-tr-continue]')?.addEventListener('click',()=>{options.stopAudio();options.next()});
    root.querySelector('[data-tr-play]')?.addEventListener('click',()=>{window.S6Help?.hold(1800);speakWord&&speakWord(items[index].word,'word')});
  }
  function launch(options){
    if(!options.bank&&!banks[options.letter])return;
    const host=$('.s6-intro-layout');if(!host||host.querySelector('[data-tr-open]'))return;
    host.insertAdjacentHTML('beforeend','<button type="button" class="tr-launch" data-tr-open>'+soundIcon+' Sound Check <b aria-hidden="true">→</b></button>');
    const trigger=host.querySelector('[data-tr-open]');
    trigger.onclick=()=>{
      if($('.tr-modal'))return;
      options.stopAudio();speakWord=options.speak;qText=options.question||'';yesText=options.yes||'';noText=options.no||'';
      letter=options.letter;items=options.bank||banks[letter];
      const saved=sessions[letter]||{index:0,selected:null,confirmed:false,complete:false,visited:new Set()};
      ({index,selected,confirmed,complete,visited}=saved);message='';
      const dialog=document.createElement('dialog');dialog.className='tr-modal';dialog.setAttribute('aria-label',label(letter)+' 소리 레이더');
      dialog.innerHTML='<div class="tr-modal-bar"><span>'+label(letter)+' · 소리 탐험</span><button type="button" data-tr-close aria-label="활동 닫기">닫기 <b aria-hidden="true">×</b></button></div><div class="tr-modal-content">'+render()+'</div>';
      document.body.append(dialog);
      const activeLetter=letter;let cleaned=false;
      const cleanup=()=>{if(cleaned)return;cleaned=true;options.stopAudio();sessions[activeLetter]={index,selected,confirmed,complete,visited};dialog.remove();if(trigger.isConnected)trigger.focus({preventScroll:true})};
      const closeDialog=()=>{dialog.close();cleanup()};
      dialog.addEventListener('close',cleanup,{once:true});
      dialog.querySelector('[data-tr-close]').onclick=closeDialog;
      dialog.showModal();bind({stopAudio:options.stopAudio,next:closeDialog});
    };
  }
  window.OGSoundRadar={launch,units};
})();
