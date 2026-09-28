(()=>{
  'use strict';
  const levels=new Map(),wrongCounts=new Map();
  var paceOff=false;
  const delays=Array.isArray(window.__S6_HELP_TEST_DELAYS)?window.__S6_HELP_TEST_DELAYS:[12000,14000];
  let current={activityId:'',itemId:'',complete:false},timer=null,nudge=null,marked=[],holdUntil=0;
  let audioContext=null;
  const signature=()=>current.activityId+':'+current.itemId;
  const canPrompt=()=>!paceOff&&!document.body.classList.contains('coach-mode')&&!current.complete&&!document.hidden&&Date.now()>=holdUntil&&document.documentElement.dataset.oncuvateActivityLocked!=='true'&&!document.querySelector('.dragging')&&document.querySelector('.s6-app');
  const clearTimer=()=>{clearTimeout(timer);timer=null};
  function clearVisual(){
    if(nudge?.isConnected)nudge.remove();
    nudge=null;
    marked.forEach(el=>el.classList.remove('s6-help-focus','s6-help-focus-strong'));
    marked=[];
  }
  function chime(){
    try{
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      audioContext=audioContext||new C();if(audioContext.state==='suspended')audioContext.resume();
      const now=audioContext.currentTime,o=audioContext.createOscillator(),g=audioContext.createGain();
      o.type='triangle';o.frequency.setValueAtTime(720,now);o.frequency.exponentialRampToValueAtTime(1040,now+.11);
      g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.12,now+.018);g.gain.exponentialRampToValueAtTime(.0001,now+.24);
      o.connect(g);g.connect(audioContext.destination);o.start(now);o.stop(now+.25);
    }catch(_){}
  }
  function visible(selector){
    if(!selector)return[];
    try{return[...document.querySelectorAll(selector)].filter(el=>!el.disabled&&el.getClientRects().length)}catch(_){return[]}
  }
  function plan(level){
    const specific=level==='A2';
    if(document.querySelector('.tr-modal'))return specific
      ?{text:'낱말의 빈칸이 처음인지 끝인지 보고 O와 X를 골라봐요.',selector:'.tr-modal .tr-question,.tr-modal .tr-answers'}
      :{text:'낱말 듣기를 눌러 소리를 다시 들어봐요.',selector:'.tr-modal [data-tr-play]'};
    const id=current.activityId;
    if(id.startsWith('intro-'))return specific
      ?{text:'입모양 그림을 보고 같은 소리를 천천히 따라해봐요.',selector:'.s6-intro-feature-info'}
      :{text:'글자나 낱말을 눌러 소리를 먼저 들어봐요.',selector:'.s6-intro-phoneme,.s6-intro-word-sound'};
    if(id==='match')return specific
      ?{text:'왼쪽에서 고른 소리와 닮은 한글 소리를 오른쪽에서 찾아봐요.',selector:'[data-right]'}
      :{text:'아직 잇지 않은 왼쪽 카드를 눌러 소리를 들어봐요.',selector:'[data-left]:not(.s6x-linked)'};
    if(id==='first')return specific
      ?{text:'낱말의 맨 앞소리만 떼어 생각하고 글자를 골라봐요.',selector:'.s6-answer-row'}
      :{text:'그림을 눌러 낱말을 한 번 더 들어봐요.',selector:'.s6-letter-picture'};
    if(id==='hidden')return specific
      ?{text:'찾은 그림의 맨 앞소리를 말한 뒤 첫소리 상자를 골라봐요.',selector:'.s6x-picked:not(.empty),.s6x-sort-row'}
      :{text:'정원 그림을 천천히 살피고 숨은 물건을 눌러봐요.',selector:'.s6x-scene'};
    if(id==='vowel'){
      if(document.querySelector('[data-odd-dialog]'))return specific
        ?{text:'힌트를 눌러 글자를 보고, a 소리가 아닌 하나를 찾아봐요.',selector:'[data-odd-hint],.s6x-odd'}
        :{text:'그림을 하나씩 눌러 세 낱말의 소리를 비교해봐요.',selector:'.s6x-odd'};
      return specific
        ?{text:'입모양 그림처럼 입을 옆으로 벌리고 짧게 소리 내봐요.',selector:'.s6x-mouth-card'}
        :{text:'A a를 눌러 짧은 소리를 먼저 들어봐요.',selector:'.s6x-vowel-target'};
    }
    if(id==='elkonin')return specific
      ?{text:'하늘색 첫소리 하나와 보라색 뒤소리 하나를 차례로 골라봐요.',selector:'.ocj-piece.type-consonant,.ocj-piece.type-vc'}
      :{text:'낱말 소리 듣기를 누르고 두 소리로 나눠봐요.',selector:'.ocj-listen'};
    if(id==='build'){
      if(!document.querySelector('.s6forge-picture.selected'))return{text:'그림을 눌러 만들 낱말의 소리를 들어봐요.',selector:'[data-build-target]:not(.done)'};
      return specific
        ?{text:'모음과 끝소리를 먼저 놓고 1번 젤리를 눌러봐요.',selector:'.s6forge-bank,[data-build-merge="1"]'}
        :{text:'아래 소리 버튼을 눌러 빈칸에 소리를 놓아봐요.',selector:'.s6forge-banks'};
    }
    if(id==='ihave')return specific
      ?{text:'형광펜 낱말과 같은 “I have” 카드를 찾아봐요.',selector:'.s6x-hand'}
      :{text:'Who has 옆의 형광펜 낱말을 눌러 읽어봐요.',selector:'.s6x-card-big .s6x-who-line:last-child [data-sound]'};
    if(id==='sentence')return specific
      ?{text:'두 낱말을 모두 읽었으면 생성하기를 눌러봐요.',selector:'[data-sentence-make]'}
      :{text:'밑줄 친 낱말을 눌러 다른 낱말로 바꿔 읽어봐요.',selector:'[data-toggle]'};
    // 이중자 회차 활동
    if(id==='bingo')return document.querySelector('.ogd-spin.mine')
      ?{text:'내 차례예요! 룰렛을 돌려 봐요.',selector:'.ogd-spin.mine'}
      :{text:'룰렛에 나온 단어를 소리 내어 읽고, 내 판에서 찾아봐요.',selector:'[data-reel]'};
    if(id==='tap'){
      if(document.querySelector('.ogd-letters'))return{text:'글자 말고 소리 조각을 세요. 조각마다 손가락을 한 번씩 톡톡!',selector:'.ogd-letters,.ogd-count'};
      if(document.querySelector('.ogd-box:not(.lit):not([disabled])'))return{text:'상자를 차례로 눌러 소리 조각을 하나씩 짚어봐요.',selector:'.ogd-box:not(.lit)'};
      return{text:'다음 단계 버튼을 눌러 이어가요.',selector:'[data-tap-merge],[data-tap-beat],.ogd-count,[data-item-next]'};
    }
    if(id==='tch')return{text:'빈칸 바로 앞이 짧은 모음 하나인지 살펴봐요. 그러면 tch!',selector:'.ogd-word-card,.ogd-rule'};
    if(id==='pic')return specific
      ?{text:'낱말을 누르면 소리 조각으로 나뉘어요. 조각마다 소리를 들어봐요.',selector:'.ogd-pic-word,.ogd-pic-split'}
      :{text:'그림을 하나씩 눌러 소리를 듣고, 낱말과 같은 소리를 골라봐요.',selector:'.ogd-pic-card'};
    if(id==='real')return{text:'낱말을 한 소리씩 읽어 보고, 뜻이 없는 외계어를 골라봐요.',selector:'.ogd-spy-tile:not(.flipped)'};
    if(id==='jump')return document.querySelector('.ojw-menu')
      ?{text:'도전할 모드를 골라봐요.',selector:'.ojw-mode'}
      :{text:'하늘로 뛰어오르는 젤리를 눌러 잡아봐요!',selector:'.ojw-jelly.fly,.ojw-jelly.crouch'};
    return{text:'빛나는 곳을 눌러 다음 행동을 해봐요.',selector:'[data-sound],button:not([disabled])'};
  }
  function emit(level,reason,text){
    window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'hint',activityId:current.activityId,itemId:current.itemId,helpLevel:level,trigger:reason,prompt:text}}));
    window.dispatchEvent(new CustomEvent('oncuvate:event',{detail:{type:'support_applied',activityId:current.activityId,itemId:current.itemId,helpLevel:level,provider:'system',trigger:reason}}));
  }
  function show(level,reason){
    if(!canPrompt())return;
    clearTimer();clearVisual();
    const p=plan(level),targets=visible(p.selector);
    marked=targets.slice(0,12);
    marked.forEach(el=>{el.classList.add('s6-help-focus');if(level==='A2')el.classList.add('s6-help-focus-strong')});
    const host=document.querySelector('#s6Stage')||document.body;
    nudge=document.createElement('div');
    nudge.className='s6-help-nudge '+(level==='A2'?'is-specific':'');
    nudge.setAttribute('role','status');nudge.setAttribute('aria-live','polite');
    nudge.dataset.track='hint';nudge.dataset.helpLevel=level;
    nudge.innerHTML='<i aria-hidden="true"></i><span>'+p.text+'</span>';
    host.append(nudge);
    const key=signature();levels.set(key,Math.max(levels.get(key)||0,Number(level.slice(1))));
    emit(level,reason,p.text);if(reason==='idle')chime();
  }
  function schedule(){
    clearTimer();if(!canPrompt())return;
    const highest=levels.get(signature())||0;if(highest>=2)return;
    const wait=highest?delays[1]:delays[0],next=highest?'A2':'A1';
    timer=setTimeout(()=>{timer=null;show(next,'idle');if(next==='A1')schedule()},wait);
  }
  function activate(next){
    const before=signature();current={...current,...next};
    if(before!==signature()){clearVisual();clearTimer()}
    if(current.complete){clearVisual();clearTimer();return}
    schedule();
  }
  function wrong(next={}){
    current={...current,...next,complete:false};
    const key=signature(),count=(wrongCounts.get(key)||0)+1;wrongCounts.set(key,count);
    const highest=levels.get(key)||0,level=(count>=2||highest>=1)?'A2':'A1';
    holdUntil=0;
    show(level,'wrong');schedule();
    if(count>=3)window.dispatchEvent(new CustomEvent('oncuvate:event',{detail:{type:'coach_support_needed',activityId:current.activityId,itemId:current.itemId,attempt:count}}));
  }
  function manual(level='A2',reason='request'){
    const p=plan(level),key=signature();
    levels.set(key,Math.max(levels.get(key)||0,Number(level.slice(1))||0));
    emit(level,reason,p.text);
  }
  function hold(ms=1800){
    holdUntil=Date.now()+Math.max(0,Number(ms)||0);clearTimer();clearVisual();
    setTimeout(schedule,Math.max(0,Number(ms)||0)+30);
  }
  function userActivity(event){
    if(event.target?.closest?.('.s6-help-nudge'))return;
    clearVisual();schedule();
  }
  ['pointerdown','keydown','input','change'].forEach(type=>document.addEventListener(type,userActivity,true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimer();clearVisual()}else schedule()});
  window.addEventListener('pagehide',()=>{clearTimer();clearVisual()});
  // 코치 도움 설정: 자동 도움말이 뜨는 시간(보통 12·14초 / 빠르게 7·9초 / 끄기)
  function pace(mode){paceOff=mode==='off';delays[0]=mode==='fast'?7000:12000;delays[1]=mode==='fast'?9000:14000;if(paceOff){clearTimer();clearVisual()}}
  window.S6Help={pace,activate,wrong,manual,hold,suspend(){clearTimer();clearVisual()},getState:()=>({current:{...current},level:levels.get(signature())||0,wrongs:wrongCounts.get(signature())||0})};
})();
