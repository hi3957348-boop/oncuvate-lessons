(function(){
  'use strict';
  const C=window.SPACE_SESSION;
  if(!C)return;
  const runtime=window.ONCUVATE||{},requestedRole=new URLSearchParams(window.location.search).get('pilotRole');
  if(!runtime.role&&requestedRole==='coach')runtime.role=requestedRole;
  const isCoach=runtime.role==='coach';
  const signals=window.OncuvateCaseSignals?window.OncuvateCaseSignals.create({sessionNo:Number(C.id)||0,lessonId:'space-observatory'}):{log(){},enterScreen(){},startLesson(){},ready(){return{}},respond(){return{attemptNo:1}},hint(){},close(){},activityComplete(){},lessonComplete(){},decorate(){},decorateLater(){},fire(el){el&&el.click()},textLength(){return 0},item(){return{attempts:0}},sinceReadyMs(){return undefined}};
  const screenActivity={goal:'goal',game:'game',check:'check',reading:'information-reading',organize:'organize',retell:'retell'};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const order=['start','case','goal','game','check','reading','organize','retell','solved'];
  const labels={start:'준비',case:'사건 파일',goal:'목표',game:'직접 조작',check:'증거 확인',reading:'정보글',organize:'정보 정리',retell:'다시 말하기',solved:'해결'};
  const menuOrder=['case','goal','game','check','reading','organize','retell'];
  const defaults={screen:'start',caseLine:0,goalSolved:false,gameComplete:false,checkSolved:false,readingLevel:'easy',sentenceIndex:0,organizeSolved:false,retell:'',hint:false,visited:[],notes:{},activeItem:'',plan:[],repaired:{},selectedModules:[],testsRun:0,placements:{},selectedCard:'',organizeAnswer:'',vocabOpened:[],goalAttempts:0,checkAttempts:0,organizeAttempts:0,itemAttempts:{},readingRereads:0,readingSupport:false,readingSelfCheck:'',helpRequestedAt:0,helpRequests:0,organizeHintShown:false};
  let stored=null;
  try{stored=JSON.parse(sessionStorage.getItem(C.storage)||'null')}catch(_){}
  const S=Object.assign({},defaults,stored||{});
  S.visited=Array.isArray(S.visited)?S.visited:[];S.notes=S.notes||{};S.plan=Array.isArray(S.plan)?S.plan:[];S.repaired=S.repaired||{};S.selectedModules=Array.isArray(S.selectedModules)?S.selectedModules:[];S.placements=S.placements||{};S.vocabOpened=Array.isArray(S.vocabOpened)?S.vocabOpened:[];S.itemAttempts=S.itemAttempts&&typeof S.itemAttempts==='object'?S.itemAttempts:{};
  if(C.mission){const m=S.mission&&typeof S.mission==='object'?S.mission:{};S.mission=Object.assign({phase:'brief',peeks:0,gem:'',judged:{},judgeAttempts:{},slide:0,flips:0,testLog:[]},m);if(!Array.isArray(S.mission.testLog))S.mission.testLog=[];if(!S.mission.judged||typeof S.mission.judged!=='object')S.mission.judged={};if(!S.mission.judgeAttempts||typeof S.mission.judgeAttempts!=='object')S.mission.judgeAttempts={};if(S.gameComplete)S.mission.phase='build'}
  function bumpAttempt(id){S.itemAttempts[id]=(S.itemAttempts[id]||0)+1;return S.itemAttempts[id]}
  const screens=Object.fromEntries(order.map(n=>[n,$(n+'Screen')]));
  let korean=false;
  const screenGoals={
    start:'사건 파일을 열어요',case:'사건을 한 문장씩 확인해요',goal:'오늘 해결할 목표 하나를 골라요',
    game:C.strategy.game,check:C.strategy.check,reading:'정보글을 한 문장씩 읽어요',
    organize:'정보 관계를 눈에 보이게 정리해요',retell:'정리한 정보를 내 말로 설명해요',solved:'오늘 사용한 해결 방법을 돌아봐요'
  };
  const caseVocab=window.OncuvateCaseVocab?.create({words:C.words,storageKey:C.storage,onOpen:function(word,info){if(!S.vocabOpened.includes(word))S.vocabOpened.push(word);signals.log('word-open',Object.assign({activityId:screenActivity[S.screen]||S.screen,screenName:S.screen,word:word},info||{}));save();updateChrome()},onClose:function(word,info){signals.log('word-card',Object.assign({activityId:screenActivity[S.screen]||S.screen,screenName:S.screen,word:word},info))}});
  const focusGuide=window.OncuvateFocusGuide?.create({
    key:C.storage,
    replayButton:'focusGuideReplay',
    guides:{
      case:[{en:'Read one incident record at a time.',ko:'사건 기록을 한 번에 한 문장씩 읽어요.'}],
      goal:[{en:'Choose the one mission goal that solves this case.',ko:'이 사건을 해결할 임무 목표 하나를 골라요.'}],
      game:C.guide?.game||[{en:'Use one control at a time.',ko:'한 번에는 조작 하나만 해요.'}],
      check:C.guide?.check||[{en:'Look across all of your results.',ko:'지금까지 얻은 결과를 모두 살펴봐요.'},{en:'Choose the one report that fits every result.',ko:'모든 결과와 맞는 보고서 하나를 골라요.'}],
      reading:[{en:'Read one sentence at a time. Keep the idea that helps the case.',ko:'한 문장씩 읽고 사건 해결에 필요한 생각을 남겨요.'}],
      organize:[{en:'Move one card, then complete one key word.',ko:'카드 하나를 옮긴 뒤 핵심 단어 하나를 완성해요.'},{en:'Check the connections only after every card is placed.',ko:'모든 카드를 놓은 뒤 연결을 확인해요.'}],
      retell:[{en:'Use your work to explain the solution in your own words.',ko:'내가 정리한 내용을 보며 해결 과정을 내 말로 설명해요.'},{en:'Name evidence or a reason.',ko:'증거나 이유를 꼭 하나 넣어요.'}]
    }
  });
  let liveMirror=null;
  function save(){try{sessionStorage.setItem(C.storage,JSON.stringify(S))}catch(_){}liveMirror?.publishSoon(150)}
  function gameSummary(){
    if(C.game.type==='planets')return '행성 기록 '+Object.keys(S.notes).length+'/4';
    if(C.game.type==='systems')return '계획 '+S.plan.length+'/3 · 복구 '+Object.keys(S.repaired).length+'/3';
    return '모듈 '+S.selectedModules.length+'개 · '+moduleTotal()+'/'+C.game.budget+' credits · 시험 '+S.testsRun+'회';
  }
  function buildProgressSnapshot(){
    const parts=[];
    if(S.goalSolved)parts.push('목표 ✓');else if(S.goalAttempts)parts.push('목표 시도 '+S.goalAttempts);
    parts.push(gameSummary()+(S.gameComplete?' ✓':''));
    if(S.checkSolved)parts.push('증거 확인 ✓');else if(S.checkAttempts)parts.push('증거 확인 시도 '+S.checkAttempts);
    if(S.sentenceIndex)parts.push('정보글 '+Math.min(S.sentenceIndex,C.reading[S.readingLevel].length)+'/'+C.reading[S.readingLevel].length+(S.readingRereads?' · 다시 읽기 '+S.readingRereads:'')+(S.readingSelfCheck?' · '+({understood:'이해했어요',reread:'다시 볼래요',unsure:'잘 모르겠어요'})[S.readingSelfCheck]:''));
    if(S.organizeSolved)parts.push('정보 정리 ✓');else if(S.organizeAttempts)parts.push('정리 시도 '+S.organizeAttempts);
    return{screen:S.screen,screenLabel:labels[S.screen]||S.screen,summary:parts.join(' · '),retell:String(S.retell||'').slice(0,240),done:S.screen==='solved',sessionNo:Number(C.id)||0,helpRequestedAt:S.helpRequestedAt||0,helpRequests:S.helpRequests||0,vault:C.mission?Object.assign(mgStats(),{stage:mgStage(),diving:Boolean(mgDiveTimer),tests:S.testsRun}):undefined};
  }
  function setWatermark(){const child=typeof runtime.child==='string'?runtime.child:runtime.child?.nickname||runtime.child?.name||runtime.child?.id;$('childWatermark').textContent=child?'ONCUVATE · '+child:'ONCUVATE · DEMO'}
  function unlocked(name){
    return true;
  }
  function show(name,skipSave){
    if(!screens[name])return;
    if(!isCoach&&!skipSave&&window.OncuvateClassroomControl?.pageLocked&&name!==S.screen)return;
    Object.entries(screens).forEach(([key,el])=>{const on=key===name;el.hidden=!on;el.classList.toggle('active',on)});
    S.screen=name;
    if(name==='case')renderCase();
    if(name==='goal')renderGoal();
    if(name==='game')renderGame();
    if(name==='check')renderCheck();
    if(name==='reading')renderReading();
    if(name==='organize')renderOrganize();
    if(name==='retell')renderRetell();
    updateChrome();updateCoach();
    if(!skipSave)save();
    window.scrollTo({top:0,behavior:'smooth'});
    signals.enterScreen(name,screens[name]);
    focusGuide?.visit(name);
  }
  function updateChrome(){
    $('lessonMenu').hidden=false;
    $('progressLabel').textContent=labels[S.screen];
    const idx=order.indexOf(S.screen);
    $('progressDots').innerHTML=order.map((_,i)=>'<i class="'+(i<idx?'done':i===idx?'active':'')+'"></i>').join('');
    $('menuSteps').querySelectorAll('button').forEach(b=>{const name=b.dataset.screen;b.disabled=!unlocked(name);b.classList.toggle('active',name===S.screen);b.classList.toggle('done',unlocked(name)&&name!==S.screen)});
    $('currentGoal').textContent=screenGoals[S.screen];
    let active=0;
    if(['game'].includes(S.screen))active=1;
    if(['check','reading','organize'].includes(S.screen))active=2;
    if(['retell','solved'].includes(S.screen))active=3;
    $('strategySteps').querySelectorAll('li').forEach((li,i)=>{li.classList.toggle('active',i+1===active);li.classList.toggle('done',i+1<active)});
    $('wordCount').textContent=S.vocabOpened.length;
  }
  function buildChrome(){
    $('menuSteps').innerHTML=menuOrder.map((n,i)=>'<button type="button" data-screen="'+n+'"><b>'+(i+1)+'</b><span> · '+labels[n]+'</span></button>').join('');
    if($('wordTotal'))$('wordTotal').textContent=C.words.length;
    $('strategySteps').innerHTML=C.strategy.labels.map((v,i)=>'<li><b>'+(i+1)+'</b> '+esc(v)+'</li>').join('');
    $('heroScene').innerHTML='<div class="'+C.hero+'"></div>';
    $('startEyebrow').textContent=C.start.eyebrow;$('startTitle').innerHTML=C.start.title;$('startLead').textContent=C.start.lead;
    $('coachTitle').textContent=C.lab;$('coachWatch').textContent=C.coach.watch;$('coachAnswer').textContent=C.coach.answer;
  }
  function home(){
    if($('infoDialog').open)$('infoDialog').close();
    show('start');
  }
  function renderCase(){const line=C.caseLines[Math.min(S.caseLine,C.caseLines.length-1)];$('caseLabel').textContent=line[0];if(caseVocab)caseVocab.render($('caseText'),line[1]);else $('caseText').textContent=line[1];$('caseNext').textContent=S.caseLine===C.caseLines.length-1?'해결 목표 정하기':'다음 기록'}
  function nextCase(){if(S.caseLine<C.caseLines.length-1){S.caseLine++;renderCase();updateChrome();save()}else show('goal')}
  function applyLanguage(showKo){
    korean=!!showKo;$('holdKorean').classList.toggle('active',korean);
    document.querySelectorAll('[data-bilingual]').forEach(el=>el.textContent=korean?el.dataset.ko:el.dataset.en);
    C.goal.choices.forEach(([id,en,ko])=>{const b=document.querySelector('[data-goal="'+id+'"]');if(b)b.textContent=korean?ko:en});
    $('goalQuestion').textContent=korean?C.goal.question[1]:C.goal.question[0];
  }
  function renderGoal(){
    $('goalQuestion').dataset.en=C.goal.question[0];$('goalQuestion').dataset.ko=C.goal.question[1];
    $('goalChoices').innerHTML=C.goal.choices.map(([id,en])=>'<button type="button" data-goal="'+id+'" data-item-id="goal" data-track="answer" data-correct="'+(id===C.goal.correct)+'">'+esc(en)+'</button>').join('');
    signals.decorate(document.querySelectorAll('[data-goal]'),'goal','goal',b=>b.dataset.goal===C.goal.correct);
    if(!S.goalSolved)signals.ready('goal','goal',{textNode:$('goalScreen'),attempts:S.goalAttempts,measureId:'case.goal'});
    if(S.goalSolved){const b=document.querySelector('[data-goal="'+C.goal.correct+'"]');b?.classList.add('correct');$('goalContinue').disabled=false;$('goalFeedback').textContent='Good. Keep this one mission goal in view.';$('goalFeedback').className='feedback success'}
    applyLanguage(false);
  }
  function chooseGoal(e){
    const b=e.target.closest('[data-goal]');if(!b||S.goalSolved)return;
    S.goalAttempts++;
    signals.respond('goal','goal',{correct:b.dataset.goal===C.goal.correct,value:b.dataset.goal,expected:C.goal.correct,visibleTextLen:signals.textLength($('goalScreen')),measureId:'case.goal'});
    signals.decorateLater(document.querySelectorAll('[data-goal]'),'goal','goal',x=>x.dataset.goal===C.goal.correct);
    document.querySelectorAll('[data-goal]').forEach(x=>x.classList.remove('correct','wrong'));
    if(b.dataset.goal!==C.goal.correct){b.classList.add('wrong');$('goalFeedback').textContent='Read the unresolved question once more.';$('goalFeedback').className='feedback attention';save();return}
    S.goalSolved=true;b.classList.add('correct');$('goalContinue').disabled=false;$('goalFeedback').textContent='Good. Keep this one mission goal in view.';$('goalFeedback').className='feedback success';save();updateChrome();
  }
  function openModal(kicker,title,html,action){
    $('modalKicker').textContent=kicker;$('modalTitle').textContent=title;$('modalBody').innerHTML=html;if(caseVocab)$('modalBody').querySelectorAll('p').forEach(p=>caseVocab.render(p,p.textContent));$('modalAction').textContent=action||'확인했어요';$('infoDialog').showModal();
  }

  function renderGame(){
    $('gameEyebrow').textContent=C.game.eyebrow;$('gameTitle').textContent=C.game.title;if($('gameIntro'))$('gameIntro').textContent=C.game.intro||'';
    if(C.game.type==='planets')renderPlanetGame();
    if(C.game.type==='systems')renderSystemGame();
    if(C.game.type==='base')renderBaseGame();
    $('gameContinue').disabled=!S.gameComplete;
  }
  function renderPlanetGame(){
    $('gameCounter').textContent=Object.keys(S.notes).length+' / 4 scans';
    const active=C.game.items.find(x=>x.id===S.activeItem);
    $('gameArea').innerHTML='<div class="map-layout"><div class="space-map" id="spaceMap"><div class="probe"></div>'+C.game.items.map(x=>'<button class="planet-stop '+(S.notes[x.id]?'done':'')+'" data-planet="'+x.id+'" type="button" aria-label="Scan '+x.name+'">'+x.name+'</button>').join('')+'</div><aside class="side-panel"><h3>ROUTE LOG</h3><p>'+esc(C.game.intro)+'</p><div class="note-list">'+C.game.items.map(x=>'<article><small>'+x.name+'</small>'+(S.notes[x.id]?esc(S.notes[x.id]):'Not scanned yet')+'</article>').join('')+'</div>'+(active&&!S.notes[active.id]?'<div class="choices" id="planetNoteChoices"><p><b>'+esc(active.question)+'</b></p>'+active.options.map(o=>'<button type="button" data-note="'+esc(o)+'" data-item-id="note-'+active.id+'" data-track="answer" data-correct="'+(o===active.correct)+'">'+esc(o)+'</button>').join('')+'</div>':'')+'</aside></div>';
    if(active&&!S.notes[active.id]){signals.decorate($('planetNoteChoices').querySelectorAll('[data-note]'),'game','note-'+active.id,b=>b.dataset.note===active.correct);signals.ready('game','note-'+active.id,{textNode:$('planetNoteChoices'),attempts:S.itemAttempts['note-'+active.id]||0,measureId:'case.game'})}
    $('spaceMap').addEventListener('click',e=>{const b=e.target.closest('[data-planet]');if(!b)return;const item=C.game.items.find(x=>x.id===b.dataset.planet);S.activeItem=item.id;if(!S.visited.includes(item.id))S.visited.push(item.id);signals.log('planet-scan',{activityId:'game',itemId:'note-'+item.id,visitNo:S.visited.length,alreadyNoted:!!S.notes[item.id]});save();openModal('PLANET SCAN · '+item.name,item.name,'<p>'+esc(item.fact)+'</p>','기억하고 항로 기록하기');$('infoDialog').dataset.after='planet';});
    $('planetNoteChoices')?.addEventListener('click',e=>{const b=e.target.closest('[data-note]');if(!b)return;const item=C.game.items.find(x=>x.id===S.activeItem);bumpAttempt('note-'+item.id);signals.respond('game','note-'+item.id,{correct:b.dataset.note===item.correct,value:b.dataset.note,expected:item.correct,measureId:'case.game'});if(b.dataset.note!==item.correct){signals.decorateLater($('planetNoteChoices').querySelectorAll('[data-note]'),'game','note-'+item.id,x=>x.dataset.note===item.correct);b.classList.add('wrong');save();$('gameFeedback').textContent='That note changes an important feature. Review the scan and compare the same two questions.';$('gameFeedback').className='feedback attention';return}S.notes[item.id]=item.correct;S.activeItem='';S.gameComplete=Object.keys(S.notes).length===C.game.items.length;save();renderGame();updateChrome();updateCoach()});
    $('gameFeedback').textContent=S.gameComplete?'All four scans are ready. Read across the log.':'Choose any planet. You do not have to follow a fixed order.';
  }
  function renderSystemGame(){
    const repaired=Object.keys(S.repaired).length,planned=S.plan.length===C.game.items.length;
    $('gameCounter').textContent=repaired+' / 3 systems';
    const remaining=C.game.items.filter(x=>!S.plan.includes(x.id));
    const planHtml='<section class="side-panel">'+(C.game.image?'<img class="game-art" src="'+esc(C.game.image)+'" alt="'+esc(C.game.imageAlt||'')+'">':'')+'<h3>MY 3-STEP PLAN</h3><p>Choose the order before touching the controls.</p><div class="mission-order">'+[0,1,2].map((_,i)=>'<div>STEP '+(i+1)+' · '+(S.plan[i]?esc(C.game.items.find(x=>x.id===S.plan[i]).name):'Choose a system')+'</div>').join('')+'</div>'+(remaining.length?'<div class="control-row">'+remaining.map(x=>'<button data-plan="'+x.id+'" type="button">'+x.name+'</button>').join('')+'</div>':'<p class="feedback success">Plan ready. Repair one system at a time.</p>')+(S.plan.length>repaired?'<button class="quiet" id="clearPlan" type="button">'+(repaired?'남은 순서 다시 세우기':'계획 다시 세우기')+'</button>':'')+'</section>';
    const currentId=planned?S.plan.find(id=>!S.repaired[id]):'',current=C.game.items.find(x=>x.id===currentId);
    let workHtml='<div class="system-grid">'+C.game.items.map(x=>'<article class="system-card '+(S.repaired[x.id]?'online':'')+'"><header><h3>'+x.name+'</h3><span class="status-chip">'+(S.repaired[x.id]?'ONLINE':planned&&x.id===currentId?'REPAIR NOW':'WAIT')+'</span></header></article>').join('')+'</div>';
    if(current)workHtml+='<article class="system-card" style="margin-top:14px"><header><div><small>ONE SYSTEM NOW</small><h3>'+current.name+'</h3><p>'+esc(current.problem)+'</p></div><span class="status-chip">ALERT</span></header><div class="control-row">'+current.options.map(o=>'<button type="button" data-system="'+current.id+'" data-control="'+esc(o)+'" data-item-id="system-'+current.id+'" data-track="answer" data-correct="'+(o===current.correct)+'">'+esc(o)+'</button>').join('')+'</div></article>';
    $('gameArea').innerHTML='<div class="sim-layout"><section>'+workHtml+'</section>'+planHtml+'</div>';
    if(caseVocab)$('gameArea').querySelectorAll('.system-card header p').forEach(p=>caseVocab.render(p,p.textContent));
    if(current){signals.decorate($('gameArea').querySelectorAll('[data-system]'),'game','system-'+current.id,b=>b.dataset.control===current.correct);signals.ready('game','system-'+current.id,{textNode:$('gameArea'),attempts:S.itemAttempts['system-'+current.id]||0,measureId:'case.game'})}
    $('gameArea').querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{S.plan.push(b.dataset.plan);signals.log('plan-step',{activityId:'game',itemId:'plan',stepNo:S.plan.length,value:b.dataset.plan});save();renderGame()}));
    $('clearPlan')?.addEventListener('click',()=>{const kept=S.plan.filter(id=>S.repaired[id]);signals.log('reset',{activityId:'game',itemId:'plan',stepsCleared:S.plan.length-kept.length,keptRepaired:kept.length});S.plan=kept;save();renderGame();$('gameFeedback').textContent=kept.length?'Repaired systems stay done. Choose the order for the rest.':'Make a three-step plan before using the controls.';$('gameFeedback').className='feedback'});
    $('gameArea').querySelectorAll('[data-system]').forEach(b=>b.addEventListener('click',()=>{const item=C.game.items.find(x=>x.id===b.dataset.system);bumpAttempt('system-'+item.id);signals.respond('game','system-'+item.id,{correct:b.dataset.control===item.correct,value:b.dataset.control,expected:item.correct,measureId:'case.game'});if(b.dataset.control!==item.correct){signals.decorateLater($('gameArea').querySelectorAll('[data-system]'),'game','system-'+item.id,x=>x.dataset.control===item.correct);b.classList.add('wrong');save();$('gameFeedback').textContent='The warning did not change. Read only this system report again.';$('gameFeedback').className='feedback attention';return}S.repaired[item.id]=item.correct;S.gameComplete=Object.keys(S.repaired).length===C.game.items.length;save();renderGame();updateChrome();updateCoach()}));
    $('gameFeedback').textContent=S.gameComplete?'All three systems are green. Check the complete mission report.':planned?'Work on the one system marked REPAIR NOW.':'Make a three-step plan before using the controls.';
  }
  function moduleTotal(){return C.game.modules.filter(m=>S.selectedModules.includes(m.id)).reduce((a,m)=>a+m.cost,0)}
  function missingNeeds(){const needs=new Set(C.game.modules.filter(m=>S.selectedModules.includes(m.id)).map(m=>m.need));return C.game.required.filter(n=>!needs.has(n))}
  function renderBaseGame(){
    if(C.mission&&S.mission.phase!=='build'&&!S.gameComplete){renderMissionBrief();return}
    if(C.mission){renderMissionBuild();return}
    const total=moduleTotal(),missing=missingNeeds();
    $('gameCounter').textContent=total+' / '+C.game.budget+' credits';
    const modules=C.game.modules.map(m=>'<button class="module '+(S.selectedModules.includes(m.id)?'selected':'')+'" type="button" data-module="'+m.id+'"><b>'+m.cost+'</b><strong>'+m.name+'</strong><span>'+esc(m.detail)+'</span></button>').join('');
    const tests=S.testsRun?'<div class="test-list"><div class="'+((!missing.includes('air')&&!missing.includes('water'))?'pass':'fail')+'">LIFE SUPPORT · '+((!missing.includes('air')&&!missing.includes('water'))?'PASS':'NOT READY')+'</div><div class="'+(!missing.includes('power')?'pass':'fail')+'">ENERGY · '+(!missing.includes('power')?'PASS':'NOT READY')+'</div><div class="'+((!missing.includes('temperature')&&!missing.includes('dust'))?'pass':'fail')+'">PROTECTION · '+((!missing.includes('temperature')&&!missing.includes('dust'))?'PASS':'NOT READY')+'</div></div>':'<p>Run the tests when your first design is ready.</p>';
    $('gameArea').innerHTML='<div class="build-layout"><section><div class="module-bank">'+modules+'</div></section><aside class="side-panel"><h3>CARGO METER</h3><div class="meter"><i style="width:'+Math.min(100,total/C.game.budget*100)+'%"></i></div><p><b>'+total+'</b> of '+C.game.budget+' credits used</p><button class="primary" id="runTests" type="button" data-track="answer" data-item-id="base-design" data-correct="'+(missing.length===0&&S.selectedModules.length>0)+'" '+(!S.selectedModules.length?'disabled':'')+'>Run 3 survival tests</button>'+tests+'</aside></div>';
    if(!S.gameComplete){signals.decorate([$('runTests')],'game','base-design',()=>missingNeeds().length===0&&S.selectedModules.length>0);signals.ready('game','base-design',{textNode:$('gameArea'),attempts:S.testsRun,measureId:'case.game'})}
    $('gameArea').querySelectorAll('[data-module]').forEach(b=>b.addEventListener('click',()=>{const m=C.game.modules.find(x=>x.id===b.dataset.module),selected=S.selectedModules.includes(m.id);signals.log('base-module',{activityId:'game',itemId:'base-design',module:m.id,selected:!selected,overBudget:!selected&&total+m.cost>C.game.budget});if(!selected&&total+m.cost>C.game.budget){$('gameFeedback').textContent='Cargo limit reached. Remove or replace one module first.';$('gameFeedback').className='feedback attention';return}S.selectedModules=selected?S.selectedModules.filter(id=>id!==m.id):[...S.selectedModules,m.id];S.gameComplete=false;save();renderGame()}));
    $('runTests')?.addEventListener('click',()=>{S.testsRun++;const pass=missingNeeds().length===0;signals.respond('game','base-design',{correct:pass,value:S.selectedModules.join('+'),expected:C.game.required.join('+'),missing:missingNeeds().join(','),credits:moduleTotal(),measureId:'case.game'});S.gameComplete=pass;if(C.mission)mgAfterTest(pass);save();renderGame();updateChrome();updateCoach()});
    $('gameFeedback').textContent=S.gameComplete?'All tests pass within the cargo limit.':S.testsRun?'A test is not ready. Compare it with the crew needs, then replace one module.':'Build a first design. It does not need to be perfect.';
    $('gameFeedback').className=S.gameComplete?'feedback success':S.testsRun?'feedback attention':'feedback';
    if(C.mission)mgDecorateBuild();
  }


  /* ---------- 기억 금고 작전(C.mission이 있는 회차만): 필요 기억 → 잠그기 → 잠수 → 설계·시험 → 보석, 증거 확인은 한 장씩 TRUE/FAKE ---------- */
  let mgDiveTimer=0,mgDiveEnds=0,mgDiveStart=0,mgDiveTotal=0,mgPeekTimer=0;
  function needLabel(id){const n=(C.mission.needs||[]).find(x=>x[0]===id);return n?n[1]+' '+n[2]:id}
  function mgStats(){
    const m=S.mission||{};const judged=Object.keys(m.judged||{}).length;
    const boss=Boolean(C.check.judge)&&judged>=C.check.judge.cards.length;
    return{memory:m.gem==='memory'?1:0,detective:m.gem==='detective'?1:0,boss:boss,bare:boss&&!(m.flips>0),peeks:m.peeks||0,flips:m.flips||0};
  }
  function mgStage(){
    const m=S.mission||{};
    if(mgStats().boss)return 'boss-cleared';
    if(S.gameComplete)return 'boss';
    if(mgDiveTimer)return 'diving';
    if(m.phase==='build')return 'vault';
    return 'search';
  }
  function mgHud(){
    const m=S.mission,st=mgStats();
    const stepA=m.phase==='build'||S.gameComplete?'done':'current';
    const stepB=S.gameComplete?'done':m.phase==='build'?'current':'';
    const stepC=st.boss?'done':S.gameComplete?'current':'';
    const gemIcon=m.gem==='memory'?'💎':m.gem==='detective'?'🔎':'🔒';
    return '<div class="vault-hud" aria-label="기억 금고 작전 진행"><span class="hud-title"><b>MISSION</b>기억 금고 작전</span><ol class="hud-steps"><li class="'+stepA+'"><span aria-hidden="true">🔒</span>필요 기억</li><li class="'+stepB+'"><span aria-hidden="true">'+(S.gameComplete?gemIcon:'🛠️')+'</span>설계·시험</li><li class="boss '+stepC+'"><span aria-hidden="true">'+(st.boss?'🏴‍☠️':'👾')+'</span>규칙 판정</li></ol><span class="hud-gems" aria-label="모은 보석">💎 '+st.memory+' <i>·</i> 🔎 '+st.detective+'</span></div>';
  }
  function mgNeedsList(){return '<ul class="mg-needs-list">'+C.mission.needs.map(n=>'<li><span aria-hidden="true">'+n[1]+'</span><b>'+esc(n[2])+'</b><small>'+esc(n[3])+'</small></li>').join('')+'</ul>'}
  function renderMissionBrief(){
    const m=S.mission;
    $('gameCounter').textContent='CREW NEEDS';
    $('gameContinue').disabled=true;
    if(mgDiveTimer){
      $('gameArea').innerHTML=mgHud()+'<div class="dive-row mg-dive"><div class="dive-panel"><div class="dive-sonar" aria-hidden="true"><i class="dive-gauge" id="diveGauge"></i><b id="diveCount">'+mgDiveTotal+'</b></div><div class="dive-copy"><small>DIVE · 달 기지까지</small><h3>다섯 가지를 꼭 붙들고 내려가요</h3><p>🫧 방울은 톡톡 터뜨려도 괜찮아요.</p></div></div><div class="dive-sea" aria-hidden="true">'+[1,2,3,4,5,6].map(i=>'<button type="button" class="dive-bubble b'+i+'" data-bubble tabindex="-1"></button>').join('')+'</div></div>';
      $('gameFeedback').textContent='목록은 잠겼어요. 머릿속에서 꼭 붙들어요.';$('gameFeedback').className='feedback';
      return;
    }
    $('gameArea').innerHTML=mgHud()+'<div class="mg-needs"><small>CREW NEEDS · 🔒 금고에 잠글 기억</small><h3>'+esc(C.mission.title)+'</h3>'+mgNeedsList()+'<button class="primary" id="mgLock" type="button">🔒 기억 잠그기</button></div>';
    $('gameFeedback').textContent='다 외웠으면 잠가요.';$('gameFeedback').className='feedback';
    $('mgLock').addEventListener('click',()=>{signals.log('memory-lock',{activityId:'game',itemId:'base-design',readMs:Math.round(performance.now()-mgBriefShownAt)});mgStartDive(C.mission.diveSeconds||5)});
    mgBriefShownAt=performance.now();
  }
  let mgBriefShownAt=0;
  function mgStartDive(sec){
    clearInterval(mgDiveTimer);mgDiveTotal=sec;mgDiveStart=Date.now();mgDiveEnds=mgDiveStart+sec*1000;
    mgDiveTimer=setInterval(mgTick,200);renderGame();liveMirror?.publishSoon(100);
  }
  function mgTick(){
    const left=Math.max(0,Math.ceil((mgDiveEnds-Date.now())/1000));
    if($('diveCount'))$('diveCount').textContent=String(left);
    if($('diveGauge'))$('diveGauge').style.height=Math.min(100,(Date.now()-mgDiveStart)/(mgDiveTotal*1000)*100)+'%';
    if(Date.now()<mgDiveEnds)return;
    clearInterval(mgDiveTimer);mgDiveTimer=0;
    signals.log('memory-hold',{activityId:'game',itemId:'base-design',holdMs:mgDiveTotal*1000});
    S.mission.phase='build';save();renderGame();updateCoach();
  }
  function mgAfterTest(pass){
    S.mission.testLog.push(missingNeeds());
    if(pass&&!S.mission.gem){S.mission.gem=S.mission.peeks?'detective':'memory';signals.log('vault-open',{activityId:'game',itemId:'base-design',gem:S.mission.gem,tests:S.testsRun,peeks:S.mission.peeks})}
    if(pass)setTimeout(()=>$('gameContinue')?.scrollIntoView({block:'nearest',behavior:'smooth'}),450);
  }
  function mgDecorateBuild(){
    const area=$('gameArea');
    area.insertAdjacentHTML('afterbegin',mgHud());
    const panel=area.querySelector('.side-panel');
    if(!panel)return;
    if(!S.gameComplete)panel.insertAdjacentHTML('afterbegin','<button class="quiet mg-peek" id="mgPeek" type="button" data-track="hint" data-help-level="A3" data-help-type="needs-review">🔭 필요 살짝 보기</button>');
    const m=S.mission;
    if(S.gameComplete&&m.gem){
      const fixed=S.testsRun>1?'<small class="mg-fix">🔧 시험 '+S.testsRun+'번 · 고쳐서 통과했어요</small>':'';
      panel.insertAdjacentHTML('beforeend','<div class="vault-reward '+m.gem+'" role="status"><span class="reward-gem" aria-hidden="true">'+(m.gem==='memory'?'💎':'🔎')+'</span><div><strong>'+(m.gem==='memory'?'기억 보석 획득!':'탐정 보석 획득!')+'</strong><small>'+(m.gem==='memory'?'목록을 다시 보지 않고 다섯 가지를 채웠어요.':'목록을 확인하고 정확하게 채웠어요.')+'</small>'+fixed+'</div></div>');
    }
    $('mgPeek')?.addEventListener('click',()=>{S.mission.peeks++;signals.hint('game','base-design',{helpLevel:'A3',helpType:'needs-review',trigger:'child-request'});signals.decorateLater([$('runTests')],'game','base-design',()=>missingNeeds().length===0&&S.selectedModules.length>0);save();openModal('PEEK · 살짝 다시 보기','CREW NEEDS',mgNeedsList(),'다시 설계하기')});
  }
  function mgTestSummary(){
    const log=S.mission.testLog||[];
    if(!log.length)return '아직 시험 기록이 없어요.';
    const first=log[0];
    if(log.length===1&&!first.length)return '시험 1번 · 한 번에 모두 통과';
    return '시험 '+log.length+'번 · 처음엔 '+(first.length?first.map(needLabel).join(', ')+' 빠짐':'통과')+' → 고친 뒤 통과';
  }
  function renderJudge(){
    const J=C.check.judge,m=S.mission;
    const index=Math.min(m.slide||0,J.cards.length-1),card=J.cards[index],judged=m.judged[card[0]];
    const solved=mgStats().boss;
    $('checkTitle').textContent=J.title;$('checkLead').textContent=J.lead;
    $('checkChoices').className='mg-judge'+(solved?' is-cleared':'');
    $('checkChoices').innerHTML=mgHud()
      +'<div class="gem-peek"><small>MY RESULTS</small><button type="button" id="mgLogPeek" data-track="hint" data-help-level="A1" data-help-type="evidence-flip" aria-label="내 시험 기록 잠깐 보기">📋<i>기록</i></button></div><p class="gem-peek-bubble" id="mgLogBubble" role="status" hidden></p>'
      +'<div class="boss-stage"><article class="mg-log'+(judged==='true'?' is-true':judged==='fake'?' is-fake':'')+'" id="mgLogCard"><small>MISSION LOG · RULE '+(index+1)+' / '+J.cards.length+'</small><strong>'+esc(card[1])+'</strong><span class="mg-log-scan" aria-hidden="true"></span></article>'
      +'<div class="judge-row" id="judgeRow"'+(judged?' hidden':'')+'><button type="button" class="game-btn" data-judge="true" data-track="answer" data-item-id="check-'+card[0]+'" data-correct="'+card[2]+'"><span class="game-btn-icon" aria-hidden="true">✓</span><span class="game-btn-label">TRUE<em>통한 규칙</em></span><kbd>T</kbd></button><button type="button" class="game-btn" data-judge="fake" data-track="answer" data-item-id="check-'+card[0]+'" data-correct="'+(!card[2])+'"><span class="game-btn-icon" aria-hidden="true">✗</span><span class="game-btn-label">FAKE<em>안 통한 규칙</em></span><kbd>F</kbd></button></div></div>'
      +'<div class="record-nav"><div class="record-dots" aria-hidden="true">'+J.cards.map((c,i)=>'<i class="'+(m.judged[c[0]]?(c[2]?'true':'fake'):'')+(i===index?' now':'')+'"></i>').join('')+'</div><button class="primary" id="mgNextRule" type="button"'+(!judged||index>=J.cards.length-1?' hidden':'')+'>다음 규칙 ▶</button></div>'
      +(solved?'<div class="boss-summary" role="status"><strong>MISSION CLEAR!</strong><ul><li><b>'+(m.gem==='memory'?'💎':'🔎')+'</b>보석</li>'+(S.testsRun>1?'<li><b>🔧</b>시험 '+S.testsRun+'번</li>':'')+(mgStats().bare?'<li class="gold"><b>🏆</b>맨기억 보너스</li>':'')+'</ul></div>':'');
    if(judged){$('checkFeedback').textContent=card[3];$('checkFeedback').className='feedback success'}
    else if(!$('checkFeedback').classList.contains('attention')){$('checkFeedback').textContent=J.prompt;$('checkFeedback').className='feedback'}
    $('checkContinue').disabled=!solved;$('checkContinue').hidden=!solved;
    signals.decorate($('checkChoices').querySelectorAll('[data-judge]'),'check','check-'+card[0],b=>(b.dataset.judge==='true')===card[2]);
    if(!judged)signals.ready('check','check-'+card[0],{textNode:$('mgLogCard'),attempts:(m.judgeAttempts[card[0]]||0),measureId:'case.check'});
  }
  function mgJudgeClick(e){
    if(!C.check.judge)return;
    const J=C.check.judge,m=S.mission;
    if(e.target.closest('#mgLogPeek')){
      const card=J.cards[Math.min(m.slide||0,J.cards.length-1)];
      if(!mgStats().boss){m.flips=(m.flips||0)+1;signals.hint('check','check-'+card[0],{helpLevel:'A1',helpType:'evidence-flip',trigger:'child-request'});save()}
      const bub=$('mgLogBubble');bub.textContent=mgTestSummary();bub.hidden=false;clearTimeout(mgPeekTimer);mgPeekTimer=setTimeout(()=>{if($('mgLogBubble'))$('mgLogBubble').hidden=true},3500);return;
    }
    if(e.target.closest('#mgNextRule')){mgNextRule();return}
    const b=e.target.closest('[data-judge]');if(!b||b.disabled)return;
    const index=Math.min(m.slide||0,J.cards.length-1),card=J.cards[index];
    if(m.judged[card[0]])return;
    const saysTrue=b.dataset.judge==='true',correct=saysTrue===card[2];
    m.judgeAttempts[card[0]]=(m.judgeAttempts[card[0]]||0)+1;S.checkAttempts++;
    signals.respond('check','check-'+card[0],{correct:correct,value:b.dataset.judge,expected:card[2]?'true':'fake',visibleTextLen:signals.textLength($('mgLogCard')),measureId:'case.check'});
    signals.decorateLater($('checkChoices').querySelectorAll('[data-judge]'),'check','check-'+card[0],x=>(x.dataset.judge==='true')===card[2]);
    if(!correct){
      b.classList.add('incorrect');const lc=$('mgLogCard');lc.classList.remove('dial-miss');void lc.offsetWidth;lc.classList.add('dial-miss');
      $('checkFeedback').textContent=m.judgeAttempts[card[0]]>=2?'📋 기록을 눌러 내 시험 결과를 잠깐 확인해 봐요.':'음, 내 시험 결과와 한 번 더 맞춰 봐요.';$('checkFeedback').className='feedback attention';
      save();return;
    }
    m.judged[card[0]]=card[2]?'true':'fake';
    if(mgStats().boss){S.checkSolved=true;signals.log('boss-cleared',{activityId:'check',flips:m.flips||0,attempts:S.checkAttempts})}
    $('checkFeedback').className='feedback';
    save();renderJudge();updateChrome();updateCoach();
  }
  function mgNextRule(){
    const J=C.check.judge,m=S.mission,index=m.slide||0;
    if(!m.judged[J.cards[index][0]]||index>=J.cards.length-1)return;
    m.slide=index+1;$('checkFeedback').className='feedback';save();renderJudge();
    const lc=$('mgLogCard');lc.classList.add('slide-in');
  }
  function mgKeys(e){
    if(!C.check.judge||S.screen!=='check'||document.querySelector('dialog[open]'))return;
    if(e.target.closest&&e.target.closest('input, textarea, select'))return;
    const k=e.key.toLowerCase();
    if(k==='t'||k==='1'){$('checkChoices').querySelector('[data-judge="true"]:not(:disabled)')?.click();e.preventDefault()}
    else if(k==='f'||k==='2'){$('checkChoices').querySelector('[data-judge="fake"]:not(:disabled)')?.click();e.preventDefault()}
    else if((k==='arrowright'||k==='enter')&&$('mgNextRule')&&!$('mgNextRule').hidden){mgNextRule();e.preventDefault()}
  }
  /* 그룹 수업: 아이별 보석·단계를 코치 화면 「크루 보드」에 모은다(순위 없음, 팀 합계). */
  function renderCrewBoard(map){
    const rowsEl=$('crewRows'),teamEl=$('crewTeam');if(!rowsEl||!teamEl)return;
    const crew=Object.keys(map||{}).map(k=>[k,map[k]]).filter(p=>p[1]&&typeof p[1]==='object').sort((a,b)=>String(a[1].child||a[0]).localeCompare(String(b[1].child||b[0])));
    if(!crew.length){teamEl.innerHTML='<p>수업방이 열리면 학생별 보석이 여기 모여요.</p>';rowsEl.innerHTML='';return}
    const stageLabel={search:'🔒 필요 외우는 중',diving:'🫧 잠수 중 (말 걸지 않기)',vault:'🛠️ 설계·시험 중',boss:'👾 규칙 판정 중','boss-cleared':'🏴‍☠️ 미션 완료'};
    let gems=0,memory=0,bosses=0;
    rowsEl.innerHTML=crew.map(([k,p])=>{const v=p.vault||{};const mm=Number(v.memory)||0,d=Number(v.detective)||0;gems+=mm+d;memory+=mm;if(v.boss)bosses++;
      const extra=[v.bare?'🏆 맨기억':'',v.peeks?'살짝 보기 '+v.peeks:'',v.tests?'시험 '+v.tests+'번':'',v.flips?'기록 보기 '+v.flips:''].filter(Boolean).join(' · ');
      return '<li class="'+(v.boss?'done':'')+(v.diving?' diving':'')+'"><b>'+esc(p.child||k)+'</b><span class="crew-gems">'+('💎'.repeat(mm)+'🔎'.repeat(d)||'<i>🔒</i>')+(v.boss?' 🏴‍☠️':'')+'</span><small>'+(stageLabel[v.stage]||esc(p.screenLabel||''))+(extra?' · '+extra:'')+'</small></li>'}).join('');
    const goal=crew.length*2,got=gems+bosses,pct=Math.round(got/goal*100);
    const cheer=bosses===crew.length?'🎉 모든 크루가 미션을 마쳤어요! 달 기지 승인':got>=Math.ceil(goal/2)?'🚀 절반 넘게 모았어요. 발사 준비 중':'🧭 크루 모두의 보석이 로켓을 채워요';
    teamEl.innerHTML='<div class="crew-ship"><span style="width:'+pct+'%"></span><em aria-hidden="true" style="left:'+Math.min(94,pct)+'%">🚀</em></div><p><b>팀 보물 '+got+' / '+goal+'</b> · 기억 보석 '+memory+' · 미션 완료 '+bosses+'/'+crew.length+'</p><p class="crew-cheer">'+cheer+'</p>';
  }
  function buildMissionCoach(){
    if(!isCoach||!C.mission)return;
    const anchor=$('coachParticipants')?.closest('section');if(!anchor)return;
    anchor.insertAdjacentHTML('afterend','<section class="crew-board"><small>크루 보드 · 기억 금고 작전 (화면 공유용)</small><div id="crewTeam" class="crew-team"><p>수업방이 열리면 학생별 보석이 여기 모여요.</p></div><ul id="crewRows" class="crew-rows"></ul></section><section class="group-tips"><small>그룹 진행 (4명 안팎)</small><ol>'+(C.mission.groupTips||[]).map(t=>'<li>'+t+'</li>').join('')+'</ol></section>');
  }

  /* 설계 화면(미션 모드): 장비 카드는 한 장씩 슬라이드로 넘겨 보고, 화물칸 동전·실은 장비 아이콘·필요 다섯 칸 불빛만 곁에 둔다. */
  function renderMissionBuild(){
    const mods=C.game.modules,total=moduleTotal(),missing=missingNeeds(),m=S.mission;
    const idx=Math.max(0,Math.min(mods.length-1,m.card||0)),mod=mods[idx],loaded=S.selectedModules.includes(mod.id);
    const coins=n=>'<span class="mb-coins" aria-label="'+n+' 크레딧">'+'<i></i>'.repeat(n)+'</span>';
    const slots=[];let used=0;
    mods.filter(x=>S.selectedModules.includes(x.id)).forEach(x=>{for(let i=0;i<x.cost;i++)slots.push('<i class="on" title="'+esc(x.name)+'"></i>');used+=x.cost});
    for(let i=used;i<C.game.budget;i++)slots.push('<i></i>');
    const loadedIcons=mods.map((x,i)=>S.selectedModules.includes(x.id)?'<button type="button" data-mb-jump="'+i+'" aria-label="'+esc(x.name)+' 카드 보기">'+x.icon+'</button>':'').join('');
    const lights=S.testsRun?'<ul class="mb-lights" aria-label="시험 결과">'+C.mission.needs.map(n=>'<li class="'+(missing.includes(n[0])?'fail':'pass')+'"><span aria-hidden="true">'+n[1]+'</span><b>'+(missing.includes(n[0])?'✗':'✓')+'</b></li>').join('')+'</ul>':'';
    $('gameArea').innerHTML='<div class="mb-layout">'
      +'<section class="mb-stage" id="mbStage"><button class="mb-arrow" type="button" data-mb-nav="-1" aria-label="이전 장비 카드"'+(idx===0?' disabled':'')+'>◀</button>'
      +'<article class="mb-card'+(loaded?' loaded':'')+'" id="mbCard"><small>MODULE '+(idx+1)+' / '+mods.length+'</small><span class="mb-icon" aria-hidden="true">'+mod.icon+'</span><strong>'+esc(mod.name)+'</strong>'+coins(mod.cost)+'<p>'+esc(mod.detail)+'</p>'
      +'<button class="mb-load" type="button" data-module="'+mod.id+'">'+(loaded?'✓ 실음 · 빼기':'🚀 싣기')+'</button></article>'
      +'<button class="mb-arrow" type="button" data-mb-nav="1" aria-label="다음 장비 카드"'+(idx===mods.length-1?' disabled':'')+'>▶</button>'
      +'<div class="mb-dots" aria-hidden="true">'+mods.map((x,i)=>'<i class="'+(i===idx?'now ':'')+(S.selectedModules.includes(x.id)?'on':'')+'"></i>').join('')+'</div></section>'
      +'<aside class="side-panel mb-side"><div class="mb-cargo" id="mbCargo" aria-label="화물칸 '+total+' / '+C.game.budget+'">'+slots.join('')+'</div>'
      +'<div class="mb-loaded">'+(loadedIcons||'<span class="mb-empty" aria-hidden="true"></span>')+'</div>'
      +'<button class="primary" id="runTests" type="button" data-track="answer" data-item-id="base-design" data-correct="'+(missing.length===0&&S.selectedModules.length>0)+'" '+(!S.selectedModules.length?'disabled':'')+'>🚀 시험 발사</button>'+lights+'</aside></div>';
    $('gameCounter').textContent=total+' / '+C.game.budget+' credits';
    if(!S.gameComplete){signals.decorate([$('runTests')],'game','base-design',()=>missingNeeds().length===0&&S.selectedModules.length>0);signals.ready('game','base-design',{textNode:$('gameArea'),attempts:S.testsRun,measureId:'case.game'})}
    $('gameArea').querySelector('[data-module]').addEventListener('click',()=>{const selected=S.selectedModules.includes(mod.id);signals.log('base-module',{activityId:'game',itemId:'base-design',module:mod.id,selected:!selected,overBudget:!selected&&total+mod.cost>C.game.budget});if(!selected&&total+mod.cost>C.game.budget){$('gameFeedback').textContent='화물칸이 모자라요. 다른 장비 하나를 빼 봐요.';$('gameFeedback').className='feedback attention';const cg=$('mbCargo');cg.classList.remove('full');void cg.offsetWidth;cg.classList.add('full');return}S.selectedModules=selected?S.selectedModules.filter(id=>id!==mod.id):[...S.selectedModules,mod.id];S.gameComplete=false;save();renderGame()});
    $('runTests').addEventListener('click',()=>{S.testsRun++;const pass=missingNeeds().length===0;signals.respond('game','base-design',{correct:pass,value:S.selectedModules.join('+'),expected:C.game.required.join('+'),missing:missingNeeds().join(','),credits:moduleTotal(),measureId:'case.game'});S.gameComplete=pass;mgAfterTest(pass);save();renderGame();updateChrome();updateCoach()});
    $('gameFeedback').textContent=S.gameComplete?'모든 불이 초록! 크레딧 안에서 통과했어요.':S.testsRun?'빨간 칸을 채울 장비로 하나만 바꿔 봐요.':'카드를 넘겨 보며 실을 장비를 골라요.';
    $('gameFeedback').className=S.gameComplete?'feedback success':S.testsRun?'feedback attention':'feedback';
    mgDecorateBuild();
  }
  function mbGo(delta){const n=C.game.modules.length;S.mission.card=Math.max(0,Math.min(n-1,(S.mission.card||0)+delta));save();renderGame();const c=$('mbCard');if(c){c.classList.add(delta<0?'from-left':'from-right')}}
  function mbJump(i){S.mission.card=i;save();renderGame()}
  function mbKeys(e){
    if(!C.mission||S.screen!=='game'||S.mission.phase!=='build'||document.querySelector('dialog[open]'))return;
    if(e.target.closest&&e.target.closest('input, textarea, select'))return;
    if(e.key==='ArrowLeft'){mbGo(-1);e.preventDefault()}else if(e.key==='ArrowRight'){mbGo(1);e.preventDefault()}
  }
  let mbSwipeX=null;

  function renderCheck(){
    if(C.check.judge){renderJudge();return}
    $('checkTitle').textContent=C.check.title;$('checkLead').textContent=C.check.lead;
    $('checkChoices').innerHTML=C.check.choices.map(([id,text])=>'<button type="button" data-check="'+id+'" data-item-id="check" data-track="answer" data-correct="'+(id===C.check.correct)+'" class="'+(S.checkSolved&&id===C.check.correct?'correct':'')+'">'+esc(text)+'</button>').join('');
    signals.decorate(document.querySelectorAll('[data-check]'),'check','check',b=>b.dataset.check===C.check.correct);
    if(!S.checkSolved)signals.ready('check','check',{textNode:$('checkScreen'),attempts:S.checkAttempts,measureId:'case.check'});
    $('checkFeedback').textContent=S.checkSolved?C.check.success:'Choose the report that matches all of your results.';
    $('checkFeedback').className=S.checkSolved?'feedback success':'feedback';
    $('checkContinue').disabled=!S.checkSolved;
  }
  function chooseCheck(e){
    const b=e.target.closest('[data-check]');if(!b||S.checkSolved)return;
    S.checkAttempts++;
    signals.respond('check','check',{correct:b.dataset.check===C.check.correct,value:b.dataset.check,expected:C.check.correct,visibleTextLen:signals.textLength($('checkScreen')),measureId:'case.check'});
    signals.decorateLater(document.querySelectorAll('[data-check]'),'check','check',x=>x.dataset.check===C.check.correct);
    document.querySelectorAll('[data-check]').forEach(x=>x.classList.remove('correct','wrong'));
    if(b.dataset.check!==C.check.correct){b.classList.add('wrong');$('checkFeedback').textContent='One part does not match all of the evidence. Check the complete record.';$('checkFeedback').className='feedback attention';save();return}
    S.checkSolved=true;b.classList.add('correct');$('checkFeedback').textContent=C.check.success;$('checkFeedback').className='feedback success';$('checkContinue').disabled=false;save();updateChrome();
  }
  let sentenceShownAt=0;
  function renderReading(){
    sentenceShownAt=performance.now();
    const list=C.reading[S.readingLevel],done=S.sentenceIndex>=list.length,index=Math.min(S.sentenceIndex,list.length-1);
    $('readingTitle').textContent=C.reading.title;if($('readingContext'))$('readingContext').textContent=C.reading.context||'';$('readingLevel').textContent=S.readingLevel==='easy'?'TRY CHALLENGE':'BACK TO STANDARD';
    $('readingBox').hidden=done;$('sentenceNext').hidden=done;$('fullReading').hidden=!done;
    if(!done){$('sentenceCounter').textContent='SENTENCE '+(index+1)+' OF '+list.length;if(caseVocab)caseVocab.render($('sentenceText'),list[index]);else $('sentenceText').textContent=list[index];$('sentenceNext').textContent=index===list.length-1?'문단 전체 보기':'다음 문장'}
    if(caseVocab)caseVocab.render($('paragraphText'),list.join(' '));else $('paragraphText').textContent=list.join(' ');
    document.querySelectorAll('[data-self-check]').forEach(b=>b.classList.toggle('chosen',done&&b.dataset.selfCheck===S.readingSelfCheck));
    if(done&&S.readingSelfCheck!=='understood'){$('readingSelfCheckFeedback').textContent=S.readingRereads?'다시 읽었어요. 지금은 어떤가요?':'읽은 느낌을 하나 골라요. 어느 것을 골라도 괜찮아요.';$('readingSelfCheckFeedback').className='feedback'}
  }
  function nextSentence(){const list=C.reading[S.readingLevel];if(S.sentenceIndex<list.length){const textLen=list[S.sentenceIndex].replace(/\s+/g,'').length,dwellMs=Math.round(performance.now()-sentenceShownAt);signals.log('reading-sentence',{activityId:'information-reading',itemId:S.readingLevel+'-s'+(S.sentenceIndex+1),level:S.readingLevel,sentenceNo:S.sentenceIndex+1,textLen:textLen,dwellMs:dwellMs,msPerChar:textLen?Math.round(dwellMs/textLen):undefined,tooFast:dwellMs<300+120*textLen});S.sentenceIndex++}renderReading();save();updateChrome()}
  function readingSelfCheck(e){
    const b=e.target.closest('[data-self-check]');if(!b)return;
    const choice=b.dataset.selfCheck,itemId='paragraph-'+S.readingLevel;
    S.readingSelfCheck=choice;
    signals.log('self-check',{activityId:'information-reading',itemId:itemId,choice:choice,cueStage:1,rereadCount:S.readingRereads,level:S.readingLevel,discourseType:'expository'});
    document.querySelectorAll('[data-self-check]').forEach(x=>x.classList.toggle('chosen',x===b));
    if(choice==='understood'){$('readingSelfCheckFeedback').textContent='좋아요. 읽은 내용을 다음 활동에서 써요.';$('readingSelfCheckFeedback').className='feedback success';save();return}
    S.readingRereads++;S.readingSupport=choice==='unsure';
    signals.hint('information-reading',itemId,{helpLevel:'A1',helpType:choice==='unsure'?'self-check-unsure':'reread',cueStage:1,rereadCount:S.readingRereads,trigger:'child-request'});
    S.sentenceIndex=0;renderReading();
    $('readingSelfCheckFeedback').textContent=choice==='unsure'?'괜찮아요. 한 문장씩 천천히 다시 읽어요. 파란 낱말을 누르면 뜻이 나와요.':'한 문장씩 다시 읽어요.';$('readingSelfCheckFeedback').className='feedback';
    save();
  }
  function toggleReading(){S.readingLevel=S.readingLevel==='easy'?'challenge':'easy';S.readingSelfCheck='';signals.log('reading-level',{activityId:'information-reading',level:S.readingLevel});S.sentenceIndex=0;renderReading();save()}
  function renderOrganize(){
    $('organizeTitle').textContent=C.organize.title;$('organizeLead').textContent=C.organize.lead;
    if(C.organize.type==='planet-sort')renderPlanetSort();
    if(C.organize.type==='repair-order')renderRepairOrder();
    if(C.organize.type==='needs-map')renderNeedsMap();
    $('organizeContinue').hidden=!S.organizeSolved;$('organizeCheck').hidden=S.organizeSolved;
    signals.decorateLater([$('organizeCheck')],'organize','organize-check',()=>{const r=evaluateOrganize();return r.placed&&r.correct&&r.word});
    if(!S.organizeSolved)signals.ready('organize','organize-check',{textNode:$('organizeScreen'),attempts:S.organizeAttempts,measureId:'case.organize'});
  }
  function inputRow(sentenceBefore,sentenceAfter){
    const hint=C.organize.hint?(S.organizeHintShown?'<span class="hint-text" id="organizeHintText">'+esc(C.organize.hint)+'</span>':'<button class="quiet hint-button" id="organizeHint" type="button" data-track="hint" data-help-level="A2" data-help-type="word-hint">낱말 힌트</button>'):'';
    return '<div class="type-row">'+sentenceBefore+' <input id="organizeInput" type="text" autocomplete="off" spellcheck="false" value="'+esc(S.organizeAnswer)+'" aria-label="missing word"> '+sentenceAfter+hint+'</div>';
  }
  function renderPlanetSort(){
    const cards=C.organize.cards,used=new Set(Object.keys(S.placements));
    function placed(group){return cards.filter(c=>S.placements[c[0]]===group).map(c=>'<button type="button" data-return-card="'+c[0]+'">'+c[1]+' · return</button>').join('')}
    const bank=cards.filter(c=>!used.has(c[0])).map(c=>'<button type="button" data-pick-card="'+c[0]+'" class="'+(S.selectedCard===c[0]?'selected':'')+'">'+c[1]+'</button>').join('');
    $('organizeArea').innerHTML='<div class="organize-grid"><div class="sort-board"><section class="sort-zone" data-zone="rocky"><h3>ROCKY · SOLID SURFACE</h3>'+placed('rocky')+'</section><section class="sort-zone" data-zone="giant"><h3>GIANT · NO SOLID SURFACE</h3>'+placed('giant')+'</section></div><aside class="card-bank"><h3>PLANET CARDS</h3>'+bank+'</aside></div>'+inputRow('Jupiter cannot give this probe a solid','.');
    bindPlacement();
  }
  /* 끌어다 놓기 — 카드를 누른 채 움직이면 놓는 칸으로 옮긴다. 탭(카드 누르고 칸 누르기)도 그대로 된다. */
  function enableDrag(cardSelector,dropSelector,onDrop){
    document.querySelectorAll(cardSelector).forEach(card=>card.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      const startX=e.clientX,startY=e.clientY;let ghost=null,over=null,moved=false;
      try{card.setPointerCapture(e.pointerId)}catch(_){}
      const clearOver=()=>{if(over){over.classList.remove('drop-target');over=null}};
      const move=ev=>{
        if(!moved&&Math.hypot(ev.clientX-startX,ev.clientY-startY)<6)return;
        if(!moved){moved=true;ghost=card.cloneNode(true);ghost.className='drag-ghost';ghost.style.width=card.offsetWidth+'px';document.body.appendChild(ghost);card.classList.add('dragging')}
        ghost.style.left=(ev.clientX-card.offsetWidth/2)+'px';ghost.style.top=(ev.clientY-22)+'px';
        const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest(dropSelector);
        if(target!==over){clearOver();over=target;if(over)over.classList.add('drop-target')}
        ev.preventDefault();
      };
      const end=ev=>{
        card.removeEventListener('pointermove',move);card.removeEventListener('pointerup',end);card.removeEventListener('pointercancel',end);
        if(!moved)return;
        ghost?.remove();card.classList.remove('dragging');clearOver();card.dataset.dragged='1';
        const target=ev.type==='pointerup'?document.elementFromPoint(ev.clientX,ev.clientY)?.closest(dropSelector):null;
        signals.log('drag-drop',{activityId:'organize',itemId:'organize-check',card:card.dataset.pickCard||card.dataset.orderCard||'',dropped:Boolean(target),zone:target?(target.dataset.zone||target.dataset.orderRemove||'zone'):''});
        if(target)onDrop(card,target);
      };
      card.addEventListener('pointermove',move);card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end);
    }));
  }
  function renderRepairOrder(){
    const chosen=Array.isArray(S.placements.order)?S.placements.order:[];
    const bank=C.organize.cards.filter(c=>!chosen.includes(c[0])).map(c=>'<button type="button" data-order-card="'+c[0]+'">'+c[1]+'</button>').join('');
    $('organizeArea').innerHTML='<div class="organize-grid"><section class="sort-zone"><h3>MY REPAIR SEQUENCE</h3>'+[0,1,2].map((_,i)=>'<button class="order-slot" type="button" data-order-remove="'+i+'">STEP '+(i+1)+' · '+(chosen[i]?esc(C.organize.cards.find(c=>c[0]===chosen[i])[1]):'empty')+'</button>').join('')+'</section><aside class="card-bank"><h3>ACTION CARDS</h3>'+bank+'</aside></div>'+inputRow('After every repair,','the result.');
    document.querySelectorAll('[data-order-card]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.dragged)return;const a=Array.isArray(S.placements.order)?S.placements.order:[];a.push(b.dataset.orderCard);S.placements.order=a;S.organizeSolved=false;save();renderOrganize()}));
    enableDrag('[data-order-card]','.order-slot,.sort-zone',(card,target)=>{const a=Array.isArray(S.placements.order)?S.placements.order:[];const i=target.classList.contains('order-slot')?Number(target.dataset.orderRemove):a.length;if(i<a.length)a[i]=card.dataset.orderCard;else a.push(card.dataset.orderCard);S.placements.order=a;S.organizeSolved=false;save();renderOrganize()});
    document.querySelectorAll('[data-order-remove]').forEach(b=>b.addEventListener('click',()=>{const a=Array.isArray(S.placements.order)?S.placements.order:[];a.splice(Number(b.dataset.orderRemove),1);S.placements.order=a;S.organizeSolved=false;save();renderOrganize()}));
    bindOrganizeInput();
  }
  function renderNeedsMap(){
    const cards=C.organize.cards,used=new Set(Object.values(S.placements));
    const bank=cards.filter(c=>!used.has(c[0])).map(c=>'<button type="button" data-pick-card="'+c[0]+'" class="'+(S.selectedCard===c[0]?'selected':'')+'">'+c[2]+'</button>').join('');
    const zones=cards.map(c=>'<section class="sort-zone" data-zone="'+c[0]+'" style="min-height:130px"><h3>'+c[1]+'</h3>'+(S.placements[c[0]]?'<button type="button" data-zone-return="'+c[0]+'">'+C.organize.cards.find(x=>x[0]===S.placements[c[0]])[2]+' · return</button>':'<p>Place a module</p>')+'</section>').join('');
    $('organizeArea').innerHTML='<div class="organize-grid"><div class="sort-board">'+zones+'</div><aside class="card-bank"><h3>MODULE CARDS</h3>'+bank+'</aside></div>'+inputRow('Build,','and revise.');
    bindPlacement();bindOrganizeInput();
  }
  function bindPlacement(){
    document.querySelectorAll('[data-pick-card]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.dragged)return;S.selectedCard=S.selectedCard===b.dataset.pickCard?'':b.dataset.pickCard;save();renderOrganize()}));
    enableDrag('[data-pick-card]','[data-zone]',(card,zone)=>{const id=card.dataset.pickCard;if(C.organize.type==='planet-sort')S.placements[id]=zone.dataset.zone;else S.placements[zone.dataset.zone]=id;S.selectedCard='';S.organizeSolved=false;save();renderOrganize()});
    document.querySelectorAll('[data-zone]').forEach(z=>z.addEventListener('click',e=>{if(e.target.closest('[data-return-card],[data-zone-return]'))return;if(!S.selectedCard)return;if(C.organize.type==='planet-sort')S.placements[S.selectedCard]=z.dataset.zone;else S.placements[z.dataset.zone]=S.selectedCard;S.selectedCard='';S.organizeSolved=false;save();renderOrganize()}));
    document.querySelectorAll('[data-return-card]').forEach(b=>b.addEventListener('click',()=>{delete S.placements[b.dataset.returnCard];S.organizeSolved=false;save();renderOrganize()}));
    document.querySelectorAll('[data-zone-return]').forEach(b=>b.addEventListener('click',()=>{delete S.placements[b.dataset.zoneReturn];S.organizeSolved=false;save();renderOrganize()}));
    bindOrganizeInput();
  }
  function bindOrganizeInput(){$('organizeHint')?.addEventListener('click',()=>{S.organizeHintShown=true;signals.hint('organize','organize-check',{helpLevel:'A2',helpType:'word-hint',trigger:'child-request'});save();renderOrganize()});$('organizeInput')?.addEventListener('input',e=>{S.organizeAnswer=e.target.value;S.organizeSolved=false;save();signals.decorate([$('organizeCheck')],'organize','organize-check',()=>{const r=evaluateOrganize();return r.placed&&r.correct&&r.word})})}
  function normalize(v){return String(v||'').trim().toLowerCase().replace(/[.,!?]+$/,'')}
  function evaluateOrganize(){
    let placed=false,correct=false;
    if(C.organize.type==='planet-sort'){placed=Object.keys(S.placements).length===C.organize.cards.length;correct=placed&&C.organize.cards.every(c=>S.placements[c[0]]===c[2])}
    if(C.organize.type==='repair-order'){const a=S.placements.order||[];placed=a.length===3;correct=placed&&new Set(a).size===3}
    if(C.organize.type==='needs-map'){placed=Object.keys(S.placements).length===C.organize.cards.length;correct=placed&&C.organize.cards.every(c=>S.placements[c[0]]===c[0])}
    return{placed:placed,correct:correct,word:normalize(S.organizeAnswer)===C.organize.answer};
  }
  function checkOrganize(){
    const r=evaluateOrganize(),placed=r.placed,correct=r.correct,word=r.word;
    if(placed){S.organizeAttempts++;signals.respond('organize','organize-check',{correct:correct&&word,value:JSON.stringify(S.placements).slice(0,300)+' | '+S.organizeAnswer,expected:C.organize.answer,cardsCorrect:correct,wordCorrect:word,measureId:'case.organize'});signals.decorateLater([$('organizeCheck')],'organize','organize-check',()=>{const x=evaluateOrganize();return x.placed&&x.correct&&x.word})}
    else signals.log('check-blocked',{activityId:'organize',itemId:'organize-check',reason:'cards-missing'});
    if(!placed){$('organizeFeedback').textContent='Place every card before checking.';$('organizeFeedback').className='feedback attention';return}
    if(!correct||!word){$('organizeFeedback').textContent=!correct?'Some connections do not match the information. Move only the cards that need revision.':'Check the missing word in the design rule.';$('organizeFeedback').className='feedback attention';return}
    S.organizeSolved=true;$('organizeFeedback').textContent='The cards and the key word are complete. Use them for your explanation.';$('organizeFeedback').className='feedback success';save();renderOrganize();updateChrome();
  }
  function resetOrganize(){signals.log('reset',{activityId:'organize',itemId:'organize-check',attemptsSoFar:S.organizeAttempts});S.placements={};S.selectedCard='';S.organizeAnswer='';S.organizeSolved=false;save();renderOrganize();$('organizeFeedback').textContent='Start with one card at a time.';$('organizeFeedback').className='feedback'}


  function organizeSummary(){
    if(!S.organizeSolved)return '';
    const cards=C.organize.cards;let rows='';
    if(C.organize.type==='planet-sort'){rows=[['rocky','ROCKY · SOLID SURFACE'],['giant','GIANT · NO SOLID SURFACE']].map(([g,label])=>'<article><b>'+label+'</b><br>'+(cards.filter(c=>S.placements[c[0]]===g).map(c=>c[1]).join(', ')||'—')+'</article>').join('')+'<article><b>KEY SENTENCE</b><br>Jupiter cannot give this probe a solid '+esc(S.organizeAnswer)+'.</article>'}
    if(C.organize.type==='repair-order'){const a=S.placements.order||[];rows='<article><b>MY REPAIR SEQUENCE</b><br>'+a.map((id,i)=>(i+1)+'. '+esc(cards.find(c=>c[0]===id)[1])).join('<br>')+'</article><article><b>KEY SENTENCE</b><br>After every repair, '+esc(S.organizeAnswer)+' the result.</article>'}
    if(C.organize.type==='needs-map'){rows='<article><b>NEED → MODULE</b><br>'+cards.map(c=>c[1]+' → '+(S.placements[c[0]]?cards.find(x=>x[0]===S.placements[c[0]])[2]:'—')).join('<br>')+'</article><article><b>KEY SENTENCE</b><br>Build, '+esc(S.organizeAnswer)+', and revise.</article>'}
    return rows;
  }
  function workEvidence(){
    if(C.game.type==='planets')return C.game.items.map(x=>'<article><b>'+x.name+'</b><br>'+(S.notes[x.id]||'—')+'</article>').join('');
    if(C.game.type==='systems')return C.game.items.map(x=>'<article><b>'+x.name+'</b><br>'+(S.repaired[x.id]||'—')+'</article>').join('');
    return C.game.modules.filter(m=>S.selectedModules.includes(m.id)).map(m=>'<article><b>'+m.name+'</b><br>'+m.detail+'</article>').join('');
  }
  function renderRetell(){
    signals.ready('retell','retell',{textNode:$('retellScreen'),measureId:'case.retell'});
    $('retellTitle').textContent=C.retell.title;$('retellPrompt').textContent=C.retell.prompt;$('retellInput').placeholder=C.retell.placeholder;$('retellInput').value=S.retell;
    $('retellCount').textContent=S.retell.length+' / 420';$('finishButton').disabled=S.retell.trim().length<28;
    $('retellEvidence').innerHTML=(S.hint?'<article class="frame"><b>SENTENCE FRAME</b><br>'+esc(C.retell.frame)+'</article>':'')+organizeSummary()+'<small class="evidence-sub">MY WORK · 조작 결과</small>'+workEvidence();
    $('retellFeedback').textContent=S.retell.trim().length<28?'Use your organized information to write at least two ideas.':'Good. Check that your explanation names evidence or a reason.';
  }
  function updateRetell(){const wasEmpty=!S.retell.trim();S.retell=$('retellInput').value;if(wasEmpty&&S.retell.trim())signals.log('retell-first-input',{activityId:'retell',itemId:'retell',sinceReadyMs:signals.sinceReadyMs('retell','retell')});$('retellCount').textContent=S.retell.length+' / 420';$('finishButton').disabled=S.retell.trim().length<28;$('retellFeedback').textContent=S.retell.trim().length<28?'Add one more evidence-based idea.':'Good. Check that your explanation names evidence or a reason.';save();updateCoach()}
  function renderSolved(){$('solvedEyebrow').textContent=C.solved.eyebrow;$('solvedTitle').innerHTML=C.solved.title;$('solvedText').textContent=C.solved.text}
  function showWordBank(){
    const openedWords=C.words.filter(w=>S.vocabOpened.includes(w[0]));
    $('wordList').innerHTML='<div class="note-list">'+(openedWords.length?openedWords.map(w=>{const meaningKo=String(w[1]||'').split('·').pop().trim();return '<article><small>'+esc(w[0].toUpperCase())+'</small>'+esc(meaningKo)+'<br>'+esc(w[2]||'')+'</article>'}).join(''):'<article><small>NO WORDS YET</small>사건 파일에서 파란 단어를 누르면 여기에 저장됩니다.</article>')+'</div>';
    $('wordDialog').showModal();
  }
  function updateCoach(){
    if(!isCoach)return;
    $('coachGoal').textContent=screenGoals[S.screen];
    let summary='';
    if(C.game.type==='planets')summary='기록한 행성 '+Object.keys(S.notes).length+'/4';
    if(C.game.type==='systems')summary='계획 '+S.plan.length+'/3 · 복구 '+Object.keys(S.repaired).length+'/3';
    if(C.game.type==='base')summary='선택 '+S.selectedModules.length+'개 · '+moduleTotal()+'/'+C.game.budget+' credits · 시험 '+S.testsRun+'회';
    if(S.retell)summary+='<br><b>학생 문장</b><br>'+esc(S.retell);
    $('coachState').innerHTML='<p>'+summary+'</p>';
  }
  function buildCoach(){
    if(!isCoach)return;$('coachPanel').hidden=false;document.body.classList.add('coach-role');
    $('coachClose').setAttribute('aria-expanded','true');
    $('coachClose').setAttribute('aria-label','코치 패널 접기');
    $('coachNav').innerHTML=order.map(n=>'<button type="button" data-coach-screen="'+n+'">'+labels[n]+'</button>').join('');
    $('coachNav').addEventListener('click',e=>{const b=e.target.closest('[data-coach-screen]');if(b)show(b.dataset.coachScreen)});
  }
  function restore(){
    renderSolved();
    if(S.screen==='goal')renderGoal();
    show(S.screen||'start',true);
  }
  $('startButton').addEventListener('click',()=>show('case'));
  $('caseNext').addEventListener('click',nextCase);
  $('goalChoices').addEventListener('click',chooseGoal);
  $('startButton').addEventListener('click',()=>signals.startLesson());
  $('goalContinue').addEventListener('click',()=>{signals.activityComplete('goal');show('game')});
  $('gameContinue').addEventListener('click',()=>{signals.activityComplete('game',{gameType:C.game.type,testsRun:S.testsRun});show('check')});
  $('checkChoices').addEventListener('click',e=>{if(C.check.judge)mgJudgeClick(e);else chooseCheck(e)});
  document.addEventListener('keydown',mgKeys);
  document.addEventListener('keydown',mbKeys);
  if(C.mission)$('gameScreen').classList.add('mg-mode');
  $('gameArea').addEventListener('click',e=>{const nav=e.target.closest('[data-mb-nav]');if(nav&&!nav.disabled){mbGo(Number(nav.dataset.mbNav));return}const j=e.target.closest('[data-mb-jump]');if(j)mbJump(Number(j.dataset.mbJump))});
  $('gameArea').addEventListener('pointerdown',e=>{if(e.target.closest('#mbStage')&&!e.target.closest('button'))mbSwipeX=e.clientX});
  $('gameArea').addEventListener('pointerup',e=>{if(mbSwipeX===null)return;const dx=e.clientX-mbSwipeX;mbSwipeX=null;if(Math.abs(dx)>40)mbGo(dx<0?1:-1)});
  $('gameArea').addEventListener('click',e=>{const b=e.target.closest('[data-bubble]');if(b){b.classList.remove('popped');void b.offsetWidth;b.classList.add('popped')}});
  $('checkContinue').addEventListener('click',()=>{signals.activityComplete('check');show('reading')});
  $('sentenceNext').addEventListener('click',nextSentence);
  $('readingLevel').addEventListener('click',toggleReading);
  $('readingContinue').addEventListener('click',()=>{signals.activityComplete('information-reading',{level:S.readingLevel,rereadCount:S.readingRereads,selfCheck:S.readingSelfCheck||undefined,discourseType:'expository'});show('organize')});
  $('readingSelfCheck').addEventListener('click',readingSelfCheck);
  $('organizeCheck').addEventListener('click',checkOrganize);
  $('organizeReset').addEventListener('click',resetOrganize);
  $('organizeContinue').addEventListener('click',()=>{signals.activityComplete('organize',{attempts:S.organizeAttempts});show('retell')});
  $('retellInput').addEventListener('input',updateRetell);
  $('retellHint').addEventListener('click',()=>{S.hint=!S.hint;if(S.hint)signals.hint('retell','retell',{helpLevel:'A2',helpType:'sentence-frame',trigger:'child-request'});save();renderRetell()});
  $('finishButton').addEventListener('click',()=>{const text=S.retell.trim();if(text.length<28)return;const words=text.split(/\s+/).filter(Boolean).length;signals.log('retell-text',{activityId:'retell',itemId:'retell',text:text,chars:text.length,words:words,sentences:(text.match(/[.!?]+/g)||[]).length,accuracy:'notApplicable',hintUsed:S.hint});signals.fire($('retellDoneMarker'));signals.activityComplete('retell',{chars:text.length,words:words});signals.lessonComplete(Object.assign({retellChars:text.length},caseVocab&&caseVocab.stats?caseVocab.stats():{}));show('solved')});
  $('restartButton').addEventListener('click',()=>{signals.log('restart',{});try{sessionStorage.removeItem(C.storage)}catch(_){}location.reload()});
  $('homeButton').addEventListener('click',home);
  const menuKey='space-observatory:menu-collapsed';
  function applyMenuCollapsed(collapsed){document.body.classList.toggle('menu-collapsed',collapsed);const t=$('menuToggle');if(!t)return;t.setAttribute('aria-expanded',String(!collapsed));t.setAttribute('aria-label',collapsed?'메뉴 펼치기':'메뉴 접기');t.querySelector('i').textContent=collapsed?'›':'‹';t.querySelector('span').textContent=collapsed?'펼치기':'메뉴 접기'}
  $('menuToggle')?.addEventListener('click',()=>{const c=!document.body.classList.contains('menu-collapsed');try{sessionStorage.setItem(menuKey,c?'1':'')}catch(_){}applyMenuCollapsed(c);signals.log('menu-toggle',{collapsed:c})});
  try{applyMenuCollapsed(sessionStorage.getItem(menuKey)==='1')}catch(_){applyMenuCollapsed(false)}
  let helpResetTimer=0;
  $('helpButton')?.addEventListener('click',()=>{const b=$('helpButton');S.helpRequestedAt=Date.now();S.helpRequests=(S.helpRequests||0)+1;const activityId=screenActivity[S.screen]||S.screen;signals.hint(activityId,'',{helpType:'child-request',trigger:'child-request',screenName:S.screen});signals.log('help-request',{activityId:activityId,screenName:S.screen,requestNo:S.helpRequests,room:Boolean(runtime.room)});save();b.textContent=runtime.room?'코치에게 알렸어요 ✓':'도움 요청을 남겼어요 ✓';b.disabled=true;clearTimeout(helpResetTimer);helpResetTimer=setTimeout(()=>{b.innerHTML='<span aria-hidden="true">🙋</span> 도와주세요';b.disabled=false},4000)});
  $('menuSteps').addEventListener('click',e=>{const b=e.target.closest('[data-screen]');if(b&&!b.disabled)show(b.dataset.screen)});
  let holdLogged=false;
  $('holdKorean').addEventListener('pointerdown',e=>{e.preventDefault();if(!holdLogged){holdLogged=true;signals.hint('goal','goal',{helpLevel:'A1',helpType:'korean-hold'})}applyLanguage(true)});
  ['pointerup','pointercancel','lostpointercapture'].forEach(n=>$('holdKorean').addEventListener(n,()=>{holdLogged=false}));
  $('focusGuideReplay').addEventListener('click',()=>signals.hint(screenActivity[S.screen]||S.screen,'',{helpLevel:'A1',helpType:'guide-replay',trigger:'child-request'}));
  ['pointerup','pointercancel','lostpointercapture'].forEach(n=>$('holdKorean').addEventListener(n,()=>applyLanguage(false)));
  $('holdKorean').addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat)applyLanguage(true)});
  $('holdKorean').addEventListener('keyup',()=>applyLanguage(false));
  $('wordButton').addEventListener('click',showWordBank);$('wordClose').addEventListener('click',()=>$('wordDialog').close());
  $('modalAction').addEventListener('click',()=>{$('infoDialog').close();if($('infoDialog').dataset.after==='planet'){$('infoDialog').dataset.after='';renderGame()}});
  $('infoDialog').addEventListener('cancel',e=>e.preventDefault());
  $('coachClose').addEventListener('click',event=>{
    const collapsed=document.body.classList.toggle('coach-collapsed');
    event.currentTarget.textContent=collapsed?'‹':'×';
    event.currentTarget.setAttribute('aria-expanded',String(!collapsed));
    event.currentTarget.setAttribute('aria-label',collapsed?'코치 패널 펼치기':'코치 패널 접기');
  });
  setWatermark();buildChrome();buildCoach();buildMissionCoach();renderSolved();restore();
  liveMirror=window.OncuvateLiveMirror?window.OncuvateLiveMirror.create({sessionNo:Number(C.id)||0,snapshot:buildProgressSnapshot,onParticipants:map=>{window.OncuvateLiveMirror.renderList($('coachParticipants'),map,Number(C.id)||0);if(C.mission)renderCrewBoard(map)},onStatus:text=>{const el=$('coachLiveStatus');if(el)el.textContent=text}}):null;
}());
