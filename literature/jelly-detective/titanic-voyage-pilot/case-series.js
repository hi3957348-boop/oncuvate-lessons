(function(){
  'use strict';
  const C=window.CASE_SESSION;
  if(!C)return;
  const runtime=window.ONCUVATE||{},requestedRole=new URLSearchParams(window.location.search).get('pilotRole');
  if(!runtime.role&&requestedRole==='coach')runtime.role=requestedRole;
  const isCoach=runtime.role==='coach';
  const signals=window.OncuvateCaseSignals?window.OncuvateCaseSignals.create({sessionNo:Number(C.id)||0,lessonId:'titanic-voyage'}):{log(){},enterScreen(){},startLesson(){},ready(){return{}},respond(){return{attemptNo:1}},hint(){},close(){},activityComplete(){},lessonComplete(){},decorate(){},decorateLater(){},fire(el){el&&el.click()},textLength(){return 0},item(){return{attempts:0}},sinceReadyMs(){return undefined}};
  const screenActivity={goal:'goal',game:'game',check:'check',reading:'information-reading',organize:'organize',retell:'retell'};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const order=['start','case','goal','game','check','reading','organize','retell','solved'];
  const labels={start:'준비',case:'사건 파일',goal:'목표',game:'직접 조작',check:'증거 확인',reading:'정보글',organize:'정보 정리',retell:'다시 말하기',solved:'해결'};
  const menuOrder=['case','goal','game','check','reading','organize','retell'];
  const defaults={screen:'start',caseLine:0,goalSolved:false,gameComplete:false,checkSolved:false,readingLevel:'easy',sentenceIndex:0,organizeSolved:false,retell:'',hint:false,visited:[],notes:{},activeItem:'',plan:[],repaired:{},selectedModules:[],testsRun:0,placements:{},selectedCard:'',organizeAnswer:'',vocabOpened:[],goalAttempts:0,checkAttempts:0,organizeAttempts:0,itemAttempts:{},readingRereads:0,readingSupport:false,readingSelfCheck:'',helpRequestedAt:0,helpRequests:0};
  let stored=null;
  try{stored=JSON.parse(sessionStorage.getItem(C.storage)||'null')}catch(_){}
  const S=Object.assign({},defaults,stored||{});
  S.visited=Array.isArray(S.visited)?S.visited:[];S.notes=S.notes||{};S.plan=Array.isArray(S.plan)?S.plan:[];S.repaired=S.repaired||{};S.selectedModules=Array.isArray(S.selectedModules)?S.selectedModules:[];S.placements=S.placements||{};S.vocabOpened=Array.isArray(S.vocabOpened)?S.vocabOpened:[];S.itemAttempts=S.itemAttempts&&typeof S.itemAttempts==='object'?S.itemAttempts:{};
  function bumpAttempt(id){S.itemAttempts[id]=(S.itemAttempts[id]||0)+1;return S.itemAttempts[id]}
  const screens=Object.fromEntries(order.map(n=>[n,$(n+'Screen')]));
  let korean=false;
  const screenGoals={
    start:'사건 파일을 열어요',case:'사건을 한 문장씩 확인해요',goal:'오늘 해결할 목표 하나를 골라요',
    game:C.strategy.game,check:C.strategy.check,reading:'정보글을 한 문장씩 읽어요',
    organize:'정보 관계를 눈에 보이게 정리해요',retell:'정리한 정보를 내 말로 설명해요',solved:'오늘 사용한 해결 방법을 돌아봐요'
  };
  const caseVocab=window.OncuvateCaseVocab?.create({words:C.words,onOpen:function(word){if(!S.vocabOpened.includes(word))S.vocabOpened.push(word);signals.log('word-open',{activityId:screenActivity[S.screen]||S.screen,word:word});save();updateChrome()},onClose:function(word,info){signals.log('word-card',Object.assign({activityId:screenActivity[S.screen]||S.screen,screenName:S.screen,word:word},info))}});
  const focusGuide=window.OncuvateFocusGuide?.create({
    key:C.storage,
    replayButton:'focusGuideReplay',
    guides:{
      case:[{en:'Read one incident record at a time.',ko:'사건 기록을 한 번에 한 문장씩 읽어요.'}],
      goal:[{en:'Choose the one mission goal that solves this case.',ko:'이 사건을 해결할 임무 목표 하나를 골라요.'}],
      game:C.guide?.game||[{en:'Use one control at a time.',ko:'한 번에는 조작 하나만 해요.'}],
      check:[{en:'Look across all of your results.',ko:'지금까지 얻은 결과를 모두 살펴봐요.'},{en:'Choose the one report that fits every result.',ko:'모든 결과와 맞는 보고서 하나를 골라요.'}],
      reading:[{en:'Read one sentence at a time. Keep the idea that helps the case.',ko:'한 문장씩 읽고 사건 해결에 필요한 생각을 남겨요.'}],
      organize:[{en:'Move one card, then complete one key word.',ko:'카드 하나를 옮긴 뒤 핵심 단어 하나를 완성해요.'},{en:'Check the connections only after every card is placed.',ko:'모든 카드를 놓은 뒤 연결을 확인해요.'}],
      retell:[{en:'Use your work to explain the solution in your own words.',ko:'내가 정리한 내용을 보며 해결 과정을 내 말로 설명해요.'},{en:'Name evidence or a reason.',ko:'증거나 이유를 꼭 하나 넣어요.'}]
    }
  });
  let liveMirror=null;
  function save(){try{sessionStorage.setItem(C.storage,JSON.stringify(S))}catch(_){}liveMirror?.publishSoon(150)}
  function gameSummary(){
    if(C.game.type==='planets')return '구역 기록 '+Object.keys(S.notes).length+'/4';
    if(C.game.type==='systems')return '계획 '+S.plan.length+'/3 · 복구 '+Object.keys(S.repaired).length+'/3';
    return '규칙 '+S.selectedModules.length+'개 · '+moduleTotal()+'/'+C.game.budget+' credits · 시험 '+S.testsRun+'회';
  }
  function buildProgressSnapshot(){
    const parts=[];
    if(S.goalSolved)parts.push('목표 ✓');else if(S.goalAttempts)parts.push('목표 시도 '+S.goalAttempts);
    parts.push(gameSummary()+(S.gameComplete?' ✓':''));
    if(S.checkSolved)parts.push('증거 확인 ✓');else if(S.checkAttempts)parts.push('증거 확인 시도 '+S.checkAttempts);
    if(S.sentenceIndex)parts.push('정보글 '+Math.min(S.sentenceIndex,C.reading[S.readingLevel].length)+'/'+C.reading[S.readingLevel].length+(S.readingRereads?' · 다시 읽기 '+S.readingRereads:'')+(S.readingSelfCheck?' · '+({understood:'이해했어요',reread:'다시 볼래요',unsure:'잘 모르겠어요'})[S.readingSelfCheck]:''));
    if(S.organizeSolved)parts.push('정보 정리 ✓');else if(S.organizeAttempts)parts.push('정리 시도 '+S.organizeAttempts);
    return{screen:S.screen,screenLabel:labels[S.screen]||S.screen,summary:parts.join(' · '),retell:String(S.retell||'').slice(0,240),done:S.screen==='solved',sessionNo:Number(C.id)||0,helpRequestedAt:S.helpRequestedAt||0,helpRequests:S.helpRequests||0};
  }
  function setWatermark(){const child=typeof runtime.child==='string'?runtime.child:runtime.child?.nickname||runtime.child?.name||runtime.child?.id;$('childWatermark').textContent=child?'ONCUVATE · '+child:'ONCUVATE · DEMO'}
  function unlocked(name){
    return true;
  }
  function show(name,skipSave){
    if(!screens[name])return;
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
    $('gameEyebrow').textContent=C.game.eyebrow;$('gameTitle').textContent=C.game.title;
    if(C.game.type==='planets')renderPlanetGame();
    if(C.game.type==='systems')renderSystemGame();
    if(C.game.type==='base')renderBaseGame();
    $('gameContinue').disabled=!S.gameComplete;
  }
  function renderPlanetGame(){
    $('gameCounter').textContent=Object.keys(S.notes).length+' / 4 areas';
    const active=C.game.items.find(x=>x.id===S.activeItem);
    $('gameArea').innerHTML='<div class="map-layout"><div class="space-map" id="spaceMap"><div class="probe"></div>'+C.game.items.map(x=>'<button class="planet-stop '+(S.notes[x.id]?'done':'')+'" data-planet="'+x.id+'" data-id="'+x.id+'" type="button" aria-label="Check '+x.name+'">'+x.name+'</button>').join('')+'</div><aside class="side-panel"><h3>DECK LOG</h3><p>'+esc(C.game.intro)+'</p><div class="note-list">'+C.game.items.map(x=>'<article><small>'+x.name+'</small>'+(S.notes[x.id]?esc(S.notes[x.id]):'Not checked yet')+'</article>').join('')+'</div>'+(active&&!S.notes[active.id]?'<div class="choices" id="planetNoteChoices"><p><b>'+esc(active.question)+'</b></p>'+active.options.map(o=>'<button type="button" data-note="'+esc(o)+'" data-item-id="note-'+active.id+'" data-track="answer" data-correct="'+(o===active.correct)+'">'+esc(o)+'</button>').join('')+'</div>':'')+'</aside></div>';
    if(active&&!S.notes[active.id]){signals.decorate($('planetNoteChoices').querySelectorAll('[data-note]'),'game','note-'+active.id,b=>b.dataset.note===active.correct);signals.ready('game','note-'+active.id,{textNode:$('planetNoteChoices'),attempts:S.itemAttempts['note-'+active.id]||0,measureId:'case.game'})}
    $('spaceMap').addEventListener('click',e=>{const b=e.target.closest('[data-planet]');if(!b)return;const item=C.game.items.find(x=>x.id===b.dataset.planet);S.activeItem=item.id;if(!S.visited.includes(item.id))S.visited.push(item.id);signals.log('planet-scan',{activityId:'game',itemId:'note-'+item.id,visitNo:S.visited.length,alreadyNoted:!!S.notes[item.id]});save();openModal('DECK REPORT · '+item.name,item.name,'<p>'+esc(item.fact)+'</p>','기억하고 갑판 기록하기');$('infoDialog').dataset.after='planet';});
    $('planetNoteChoices')?.addEventListener('click',e=>{const b=e.target.closest('[data-note]');if(!b)return;const item=C.game.items.find(x=>x.id===S.activeItem);bumpAttempt('note-'+item.id);signals.respond('game','note-'+item.id,{correct:b.dataset.note===item.correct,value:b.dataset.note,expected:item.correct,measureId:'case.game'});if(b.dataset.note!==item.correct){signals.decorateLater($('planetNoteChoices').querySelectorAll('[data-note]'),'game','note-'+item.id,x=>x.dataset.note===item.correct);b.classList.add('wrong');save();$('gameFeedback').textContent='That note changes an important fact. Read the report again and compare the same two questions.';$('gameFeedback').className='feedback attention';return}S.notes[item.id]=item.correct;S.activeItem='';S.gameComplete=Object.keys(S.notes).length===C.game.items.length;save();renderGame();updateChrome();updateCoach()});
    $('gameFeedback').textContent=S.gameComplete?'All four areas are logged. Read across the deck log.':'Choose any area. You do not have to follow a fixed order.';
  }
  function renderSystemGame(){
    const repaired=Object.keys(S.repaired).length,planned=S.plan.length===C.game.items.length;
    $('gameCounter').textContent=repaired+' / 3 stations';
    const remaining=C.game.items.filter(x=>!S.plan.includes(x.id));
    const planHtml='<section class="side-panel"><h3>MY 3-STEP WATCH PLAN</h3><p>Choose the order before touching the controls.</p><div class="mission-order">'+[0,1,2].map((_,i)=>'<div>STEP '+(i+1)+' · '+(S.plan[i]?esc(C.game.items.find(x=>x.id===S.plan[i]).name):'Choose a station')+'</div>').join('')+'</div>'+(remaining.length?'<div class="control-row">'+remaining.map(x=>'<button data-plan="'+x.id+'" type="button">'+x.name+'</button>').join('')+'</div>':'<p class="feedback success">Plan ready. Check one station at a time.</p>')+(S.plan.length?'<button class="quiet" id="clearPlan" type="button">계획 다시 세우기</button>':'')+'</section>';
    const currentId=planned?S.plan.find(id=>!S.repaired[id]):'',current=C.game.items.find(x=>x.id===currentId);
    let workHtml='<div class="system-grid">'+C.game.items.map(x=>'<article class="system-card '+(S.repaired[x.id]?'online':'')+'"><header><h3>'+x.name+'</h3><span class="status-chip">'+(S.repaired[x.id]?'SAFE':planned&&x.id===currentId?'CHECK NOW':'WAIT')+'</span></header></article>').join('')+'</div>';
    if(current)workHtml+='<article class="system-card" style="margin-top:14px"><header><div><small>ONE STATION NOW</small><h3>'+current.name+'</h3><p>'+esc(current.problem)+'</p></div><span class="status-chip">ALERT</span></header><div class="control-row">'+current.options.map(o=>'<button type="button" data-system="'+current.id+'" data-control="'+esc(o)+'" data-item-id="system-'+current.id+'" data-track="answer" data-correct="'+(o===current.correct)+'">'+esc(o)+'</button>').join('')+'</div></article>';
    $('gameArea').innerHTML='<div class="sim-layout"><section>'+workHtml+'</section>'+planHtml+'</div>';
    if(caseVocab)$('gameArea').querySelectorAll('.system-card header p').forEach(p=>caseVocab.render(p,p.textContent));
    if(current){signals.decorate($('gameArea').querySelectorAll('[data-system]'),'game','system-'+current.id,b=>b.dataset.control===current.correct);signals.ready('game','system-'+current.id,{textNode:$('gameArea'),attempts:S.itemAttempts['system-'+current.id]||0,measureId:'case.game'})}
    $('gameArea').querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{S.plan.push(b.dataset.plan);signals.log('plan-step',{activityId:'game',itemId:'plan',stepNo:S.plan.length,value:b.dataset.plan});save();renderGame()}));
    $('clearPlan')?.addEventListener('click',()=>{if(repaired)return;signals.log('reset',{activityId:'game',itemId:'plan',stepsCleared:S.plan.length});S.plan=[];save();renderGame()});
    $('gameArea').querySelectorAll('[data-system]').forEach(b=>b.addEventListener('click',()=>{const item=C.game.items.find(x=>x.id===b.dataset.system);bumpAttempt('system-'+item.id);signals.respond('game','system-'+item.id,{correct:b.dataset.control===item.correct,value:b.dataset.control,expected:item.correct,measureId:'case.game'});if(b.dataset.control!==item.correct){signals.decorateLater($('gameArea').querySelectorAll('[data-system]'),'game','system-'+item.id,x=>x.dataset.control===item.correct);b.classList.add('wrong');save();$('gameFeedback').textContent='The warning still did not reach the bridge. Read only this station report again.';$('gameFeedback').className='feedback attention';return}S.repaired[item.id]=item.correct;S.gameComplete=Object.keys(S.repaired).length===C.game.items.length;save();renderGame();updateChrome();updateCoach()}));
    $('gameFeedback').textContent=S.gameComplete?'All three stations are safe. Check the complete watch report.':planned?'Work on the one station marked CHECK NOW.':'Make a three-step plan before using the controls.';
  }
  function moduleTotal(){return C.game.modules.filter(m=>S.selectedModules.includes(m.id)).reduce((a,m)=>a+m.cost,0)}
  function missingNeeds(){const needs=new Set(C.game.modules.filter(m=>S.selectedModules.includes(m.id)).map(m=>m.need));return C.game.required.filter(n=>!needs.has(n))}
  function renderBaseGame(){
    const total=moduleTotal(),missing=missingNeeds();
    $('gameCounter').textContent=total+' / '+C.game.budget+' credits';
    const modules=C.game.modules.map(m=>'<button class="module '+(S.selectedModules.includes(m.id)?'selected':'')+'" type="button" data-module="'+m.id+'"><b>'+m.cost+'</b><strong>'+m.name+'</strong><span>'+esc(m.detail)+'</span></button>').join('');
    const tests=S.testsRun?'<div class="test-list">'+C.game.tests.map(t=>{const ok=t.needs.every(n=>!missing.includes(n));return '<div class="'+(ok?'pass':'fail')+'">'+esc(t.name)+' · '+(ok?'PASS':'NOT READY')+'</div>'}).join('')+'</div>':'<p>Run the tests when your first design is ready.</p>';
    $('gameArea').innerHTML='<div class="build-layout"><section><div class="module-bank">'+modules+'</div></section><aside class="side-panel"><h3>RULE BUDGET</h3><div class="meter"><i style="width:'+Math.min(100,total/C.game.budget*100)+'%"></i></div><p><b>'+total+'</b> of '+C.game.budget+' credits used</p><button class="primary" id="runTests" type="button" data-track="answer" data-item-id="base-design" data-correct="'+(missing.length===0&&S.selectedModules.length>0)+'" '+(!S.selectedModules.length?'disabled':'')+'>Run 3 safety tests</button>'+tests+'</aside></div>';
    if(!S.gameComplete){signals.decorate([$('runTests')],'game','base-design',()=>missingNeeds().length===0&&S.selectedModules.length>0);signals.ready('game','base-design',{textNode:$('gameArea'),attempts:S.testsRun,measureId:'case.game'})}
    $('gameArea').querySelectorAll('[data-module]').forEach(b=>b.addEventListener('click',()=>{const m=C.game.modules.find(x=>x.id===b.dataset.module),selected=S.selectedModules.includes(m.id);signals.log('base-module',{activityId:'game',itemId:'base-design',module:m.id,selected:!selected,overBudget:!selected&&total+m.cost>C.game.budget});if(!selected&&total+m.cost>C.game.budget){$('gameFeedback').textContent='Budget limit reached. Remove or replace one rule first.';$('gameFeedback').className='feedback attention';return}S.selectedModules=selected?S.selectedModules.filter(id=>id!==m.id):[...S.selectedModules,m.id];S.gameComplete=false;save();renderGame()}));
    $('runTests')?.addEventListener('click',()=>{S.testsRun++;const pass=missingNeeds().length===0;signals.respond('game','base-design',{correct:pass,value:S.selectedModules.join('+'),expected:C.game.required.join('+'),missing:missingNeeds().join(','),credits:moduleTotal(),measureId:'case.game'});S.gameComplete=pass;save();renderGame();updateChrome();updateCoach()});
    $('gameFeedback').textContent=S.gameComplete?'All tests pass within the budget.':S.testsRun?'A test is not ready. Compare it with the ship needs, then replace one rule.':'Build a first design. It does not need to be perfect.';
    $('gameFeedback').className=S.gameComplete?'feedback success':S.testsRun?'feedback attention':'feedback';
  }


  function renderCheck(){
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
    $('readingTitle').textContent=C.reading.title;$('readingLevel').textContent=S.readingLevel==='easy'?'TRY CHALLENGE':'BACK TO STANDARD';
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
    return '<div class="type-row">'+sentenceBefore+' <input id="organizeInput" type="text" autocomplete="off" spellcheck="false" value="'+esc(S.organizeAnswer)+'" aria-label="missing word"> '+sentenceAfter+'</div>';
  }
  function renderPlanetSort(){
    const cards=C.organize.cards,used=new Set(Object.keys(S.placements));
    function placed(group){return cards.filter(c=>S.placements[c[0]]===group).map(c=>'<button type="button" data-return-card="'+c[0]+'">'+c[1]+' · return</button>').join('')}
    const bank=cards.filter(c=>!used.has(c[0])).map(c=>'<button type="button" data-pick-card="'+c[0]+'" class="'+(S.selectedCard===c[0]?'selected':'')+'">'+c[1]+'</button>').join('');
    $('organizeArea').innerHTML='<div class="organize-grid"><div class="sort-board">'+C.organize.zones.map(z=>'<section class="sort-zone" data-zone="'+z[0]+'"><h3>'+esc(z[1])+'</h3>'+placed(z[0])+'</section>').join('')+'</div><aside class="card-bank"><h3>'+esc(C.organize.bank||'AREA CARDS')+'</h3>'+bank+'</aside></div>'+inputRow(C.organize.blank[0],C.organize.blank[1]);
    bindPlacement();
  }
  function renderRepairOrder(){
    const chosen=Array.isArray(S.placements.order)?S.placements.order:[];
    const bank=C.organize.cards.filter(c=>!chosen.includes(c[0])).map(c=>'<button type="button" data-order-card="'+c[0]+'">'+c[1]+'</button>').join('');
    $('organizeArea').innerHTML='<div class="organize-grid"><section class="sort-zone"><h3>MY WATCH SEQUENCE</h3>'+[0,1,2].map((_,i)=>'<button class="order-slot" type="button" data-order-remove="'+i+'">STEP '+(i+1)+' · '+(chosen[i]?esc(C.organize.cards.find(c=>c[0]===chosen[i])[1]):'empty')+'</button>').join('')+'</section><aside class="card-bank"><h3>'+esc(C.organize.bank||'EVENT CARDS')+'</h3>'+bank+'</aside></div>'+inputRow(C.organize.blank[0],C.organize.blank[1]);
    document.querySelectorAll('[data-order-card]').forEach(b=>b.addEventListener('click',()=>{const a=Array.isArray(S.placements.order)?S.placements.order:[];a.push(b.dataset.orderCard);S.placements.order=a;S.organizeSolved=false;save();renderOrganize()}));
    document.querySelectorAll('[data-order-remove]').forEach(b=>b.addEventListener('click',()=>{const a=Array.isArray(S.placements.order)?S.placements.order:[];a.splice(Number(b.dataset.orderRemove),1);S.placements.order=a;S.organizeSolved=false;save();renderOrganize()}));
    bindOrganizeInput();
  }
  function renderNeedsMap(){
    const cards=C.organize.cards,used=new Set(Object.values(S.placements));
    const bank=cards.filter(c=>!used.has(c[0])).map(c=>'<button type="button" data-pick-card="'+c[0]+'" class="'+(S.selectedCard===c[0]?'selected':'')+'">'+c[2]+'</button>').join('');
    const zones=cards.map(c=>'<section class="sort-zone" data-zone="'+c[0]+'" style="min-height:130px"><h3>'+c[1]+'</h3>'+(S.placements[c[0]]?'<button type="button" data-zone-return="'+c[0]+'">'+C.organize.cards.find(x=>x[0]===S.placements[c[0]])[2]+' · return</button>':'<p>Place a rule</p>')+'</section>').join('');
    $('organizeArea').innerHTML='<div class="organize-grid"><div class="sort-board">'+zones+'</div><aside class="card-bank"><h3>'+esc(C.organize.bank||'RULE CARDS')+'</h3>'+bank+'</aside></div>'+inputRow(C.organize.blank[0],C.organize.blank[1]);
    bindPlacement();bindOrganizeInput();
  }
  function bindPlacement(){
    document.querySelectorAll('[data-pick-card]').forEach(b=>b.addEventListener('click',()=>{S.selectedCard=S.selectedCard===b.dataset.pickCard?'':b.dataset.pickCard;save();renderOrganize()}));
    document.querySelectorAll('[data-zone]').forEach(z=>z.addEventListener('click',e=>{if(e.target.closest('[data-return-card],[data-zone-return]'))return;if(!S.selectedCard)return;if(C.organize.type==='planet-sort')S.placements[S.selectedCard]=z.dataset.zone;else S.placements[z.dataset.zone]=S.selectedCard;S.selectedCard='';S.organizeSolved=false;save();renderOrganize()}));
    document.querySelectorAll('[data-return-card]').forEach(b=>b.addEventListener('click',()=>{delete S.placements[b.dataset.returnCard];S.organizeSolved=false;save();renderOrganize()}));
    document.querySelectorAll('[data-zone-return]').forEach(b=>b.addEventListener('click',()=>{delete S.placements[b.dataset.zoneReturn];S.organizeSolved=false;save();renderOrganize()}));
    bindOrganizeInput();
  }
  function bindOrganizeInput(){$('organizeInput')?.addEventListener('input',e=>{S.organizeAnswer=e.target.value;S.organizeSolved=false;save();signals.decorate([$('organizeCheck')],'organize','organize-check',()=>{const r=evaluateOrganize();return r.placed&&r.correct&&r.word})})}
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


  function workEvidence(){
    if(C.game.type==='planets')return C.game.items.map(x=>'<article><b>'+x.name+'</b><br>'+(S.notes[x.id]||'—')+'</article>').join('');
    if(C.game.type==='systems')return C.game.items.map(x=>'<article><b>'+x.name+'</b><br>'+(S.repaired[x.id]||'—')+'</article>').join('');
    return C.game.modules.filter(m=>S.selectedModules.includes(m.id)).map(m=>'<article><b>'+m.name+'</b><br>'+m.detail+'</article>').join('');
  }
  function renderRetell(){
    signals.ready('retell','retell',{textNode:$('retellScreen'),measureId:'case.retell'});
    $('retellTitle').textContent=C.retell.title;$('retellPrompt').textContent=C.retell.prompt;$('retellInput').placeholder=C.retell.placeholder;$('retellInput').value=S.retell;
    $('retellCount').textContent=S.retell.length+' / 420';$('finishButton').disabled=S.retell.trim().length<28;
    $('retellEvidence').innerHTML=workEvidence()+(S.hint?'<article><b>SENTENCE FRAME</b><br>'+esc(C.retell.frame)+'</article>':'');
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
    if(C.game.type==='planets')summary='기록한 구역 '+Object.keys(S.notes).length+'/4';
    if(C.game.type==='systems')summary='계획 '+S.plan.length+'/3 · 복구 '+Object.keys(S.repaired).length+'/3';
    if(C.game.type==='base')summary='규칙 '+S.selectedModules.length+'개 · '+moduleTotal()+'/'+C.game.budget+' credits · 시험 '+S.testsRun+'회';
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
  $('checkChoices').addEventListener('click',chooseCheck);
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
  $('finishButton').addEventListener('click',()=>{const text=S.retell.trim();if(text.length<28)return;const words=text.split(/\s+/).filter(Boolean).length;signals.log('retell-text',{activityId:'retell',itemId:'retell',text:text,chars:text.length,words:words,sentences:(text.match(/[.!?]+/g)||[]).length,accuracy:'notApplicable',hintUsed:S.hint});signals.fire($('retellDoneMarker'));signals.activityComplete('retell',{chars:text.length,words:words});signals.lessonComplete({retellChars:text.length});show('solved')});
  $('restartButton').addEventListener('click',()=>{signals.log('restart',{});try{sessionStorage.removeItem(C.storage)}catch(_){}location.reload()});
  $('homeButton').addEventListener('click',home);
  const menuKey='titanic-voyage:menu-collapsed';
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
  setWatermark();buildChrome();buildCoach();renderSolved();restore();
  liveMirror=window.OncuvateLiveMirror?window.OncuvateLiveMirror.create({snapshot:buildProgressSnapshot,onParticipants:map=>window.OncuvateLiveMirror.renderList($('coachParticipants'),map,Number(C.id)||0),onStatus:text=>{const el=$('coachLiveStatus');if(el)el.textContent=text}}):null;
}());

