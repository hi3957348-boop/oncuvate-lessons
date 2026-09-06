/* Oncuvate case signals — 학습과정 상세 신호(oncuvate:log) 계측기
 * 규격 7장 「oncuvate:log」 통로만 사용한다. 전송·저장은 온큐베이트가 주입하는 트래커 몫.
 * 보내는 것: response · engagement_response · hint · item-ready · item-complete ·
 *            activity-summary · engagement_summary · screen-view · lesson-summary
 * 아이 화면에는 어떤 값도 보이지 않는다.
 */
(function(){
  'use strict';
  var FAST_MS_PER_CHAR=120, FAST_BASE_MS=300, IDLE_GAP_MS=20000, TEXT_CAP=3900;
  var HELP_ORDER={A1:1,A2:2,A3:3,A4:4};
  function now(){return (window.performance&&performance.now)?performance.now():Date.now()}
  function round(v){return Math.round(v)}
  function clean(value){
    if(value===undefined||value===null)return undefined;
    if(typeof value==='string')return value.length>TEXT_CAP?value.slice(0,TEXT_CAP):value;
    if(typeof value==='number')return isFinite(value)?value:undefined;
    if(typeof value==='boolean')return value;
    return String(value);
  }
  function textLength(node){
    if(!node)return 0;
    var text=typeof node==='string'?node:(node.innerText||node.textContent||'');
    return String(text).replace(/\s+/g,'').length;
  }
  function expectedMinMs(len){return FAST_BASE_MS+FAST_MS_PER_CHAR*Math.max(0,len|0)}
  /* 호출부가 실어 보낸 나머지 키(discourseType·cueStage·rereadCount 등)는 그대로 통과시킨다 — 규격 7장 「type 외 모든 키가 저장된다」 */
  var INTERNAL_KEYS={correct:1,visibleTextLen:1,textNode:1,attempts:1,force:1,helpLevel:1,helpType:1};
  function extras(opts){var out={};Object.keys(opts||{}).forEach(function(k){if(!INTERNAL_KEYS[k])out[k]=opts[k]});return out}

  function create(options){
    options=options||{};
    var root=document.documentElement;
    var contentId=options.lessonId||root.getAttribute('data-lesson-id')||'';
    var contentVersion=root.getAttribute('data-lesson-version')||'';
    var sessionNo=Number(options.sessionNo)||0;
    var sourceFile=(location.pathname.split('/').pop()||'').split('?')[0];
    var openedAt=now(), lessonStartedAt=0;
    var screen='', screenEnteredAt=openedAt, screenTextLen=0;
    var items={}, activities={};
    var fresh=function(){return{answer:0,nav:0,tool:0,word:0,ui:0,offTask:0,offTaskByPhase:[0,0,0,0],tooFast:0,fastWrongRun:0,fastNav:0,idleGaps:0,idleMs:0,hiddenCount:0,hiddenMs:0,since:now()}};
    var total=fresh(), window_=fresh();
    var fastWrongRun=0, lastInputAt=now(), hiddenAt=0, wordOpens=0;

    function lessonMs(){return round(now()-(lessonStartedAt||openedAt))}
    function phaseIndex(){var m=lessonMs()/60000;return m<10?0:m<20?1:m<30?2:3}
    function log(type,detail){
      var payload={type:String(type||'signal'),schemaVersion:'0.2',contentId:contentId,contentVersion:contentVersion,sessionNo:sessionNo,sourceFile:sourceFile,screen:screen,elapsedMs:round(now()-openedAt),lessonMs:lessonMs()};
      Object.keys(detail||{}).forEach(function(key){var v=clean(detail[key]);if(v!==undefined)payload[key]=v});
      try{window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:payload}))}catch(_){}
      if(options.debug)try{console.debug('[oncuvate:log]',payload)}catch(_){}
      return payload;
    }
    function bump(key,phase){total[key]++;window_[key]++;if(phase!==undefined){total.offTaskByPhase[phase]++;window_.offTaskByPhase[phase]++}}

    /* ---------- 탭 분류 · 무입력 · 화면 가림 ---------- */
    function classify(el){
      if(!el||!el.closest)return 'offTask';
      if(el.closest('.case-vocab-word'))return 'word';
      if(el.closest('[data-tap="answer"],[data-track="answer"]'))return 'answer';
      if(el.closest('[data-tap="tool"],[data-track="hint"],.hold-translate,.hold,.focus-guide-hold,.focus-guide-replay'))return 'tool';
      if(el.closest('[data-tap="nav"],button[data-menu-screen],button[data-screen],button[data-coach-screen],.primary-action,.primary,.lesson-back,.nav-back,.focus-guide-next'))return 'nav';
      if(el.closest('button,input,textarea,select,a,label,summary,[role="button"],[contenteditable]'))return 'ui';
      return 'offTask';
    }
    function noteInput(){
      var t=now(),gap=t-lastInputAt;
      if(gap>=IDLE_GAP_MS&&!document.hidden){total.idleGaps++;window_.idleGaps++;total.idleMs+=gap;window_.idleMs+=gap}
      lastInputAt=t;
    }
    document.addEventListener('pointerdown',function(e){
      if(e.button!==undefined&&e.button!==0)return;
      noteInput();
      var kind=classify(e.target);
      if(kind==='offTask')bump('offTask',phaseIndex());else bump(kind);
      if(kind==='word')wordOpens++;
    },true);
    document.addEventListener('keydown',function(){noteInput()},true);
    document.addEventListener('visibilitychange',function(){
      if(document.hidden){hiddenAt=now();total.hiddenCount++;window_.hiddenCount++;return}
      if(hiddenAt){var ms=now()-hiddenAt;total.hiddenMs+=ms;window_.hiddenMs+=ms;hiddenAt=0}
      lastInputAt=now();
    });

    /* ---------- 화면 ---------- */
    function enterScreen(name,textNode){
      var t=now();
      if(screen&&screen!==name){
        var dwell=round(t-screenEnteredAt),fast=screenTextLen>0&&dwell<expectedMinMs(screenTextLen);
        if(fast)bump('fastNav');
        log('screen-view',{screenName:screen,nextScreen:name,dwellMs:dwell,visibleTextLen:screenTextLen,expectedMinMs:expectedMinMs(screenTextLen),tooFast:fast});
      }
      screen=name;screenEnteredAt=t;screenTextLen=textLength(textNode);
    }
    function startLesson(){if(!lessonStartedAt){lessonStartedAt=now();log('lesson-start',{})}}

    /* ---------- 활동 · 문항 ---------- */
    function key(a,i){return a+'|'+i}
    function activity(id){if(!activities[id])activities[id]={id:id,startedAt:now(),hints:0,done:false};return activities[id]}
    function item(a,i,seed){
      var k=key(a,i);
      if(!items[k])items[k]={activityId:a,itemId:i,attempts:Number(seed&&seed.attempts)||0,hints:0,strongHints:0,maxHelp:'',readyAt:0,firstReadyAt:0,lastAt:0,textLen:0,done:false,ready:false};
      return items[k];
    }
    function predictAccuracy(it){return it.strongHints>0?'support':it.attempts>0?'self-corrected':'accurate'}
    function ready(a,i,opts){
      opts=opts||{};activity(a);
      var it=item(a,i,opts);
      if(it.done)return it;
      var t=now();
      if(it.ready&&!opts.force){it.readyAt=it.readyAt||t;return it}
      it.ready=true;it.readyAt=t;it.lastAt=t;if(!it.firstReadyAt)it.firstReadyAt=t;
      it.textLen=opts.visibleTextLen!==undefined?Number(opts.visibleTextLen)||0:textLength(opts.textNode);
      log('item-ready',Object.assign(extras(opts),{activityId:a,itemId:i,attemptNo:it.attempts+1,visibleTextLen:it.textLen,expectedMinMs:expectedMinMs(it.textLen)}));
      return it;
    }
    function respond(a,i,opts){
      opts=opts||{};activity(a);
      var it=item(a,i,opts),t=now();
      if(!it.readyAt){it.readyAt=t;it.firstReadyAt=it.firstReadyAt||t;it.lastAt=t}
      var correct=!!opts.correct,accuracy=correct?predictAccuracy(it):undefined; /* 이번 시도 이전의 상태로 판정 */
      it.attempts++;
      var attemptNo=it.attempts;
      var textLen=opts.visibleTextLen!==undefined?Number(opts.visibleTextLen)||0:it.textLen;
      var responseTimeMs=round(t-(it.lastAt||it.readyAt)),minMs=expectedMinMs(textLen),tooFast=responseTimeMs<minMs;
      if(tooFast&&!correct)fastWrongRun++;else if(correct)fastWrongRun=0;
      if(tooFast)bump('tooFast');
      if(fastWrongRun>=2)bump('fastWrongRun');
      var base={activityId:a,itemId:i,attemptNo:attemptNo,correct:correct,measureId:opts.measureId,trendGroupId:opts.trendGroupId,step:opts.step};
      log('response',Object.assign(extras(opts),base,{accuracy:accuracy,firstTry:attemptNo===1,selfCorrected:correct&&attemptNo>1,responseTimeMs:responseTimeMs,sinceReadyMs:round(t-it.readyAt),hintCount:it.hints,maxHelpLevel:it.maxHelp||undefined}));
      log('engagement_response',Object.assign({},base,{responseTimeMs:responseTimeMs,visibleTextLen:textLen,expectedMinMs:minMs,tooFast:tooFast,fastWrongRun:fastWrongRun}));
      it.lastAt=t;
      if(correct){
        it.done=true;
        log('item-complete',{activityId:a,itemId:i,attempts:attemptNo,firstTryCorrect:attemptNo===1,accuracy:accuracy,totalMs:round(t-it.firstReadyAt),hintCount:it.hints,maxHelpLevel:it.maxHelp||undefined,measureId:opts.measureId});
      }
      return{attemptNo:attemptNo,accuracy:accuracy,responseTimeMs:responseTimeMs,tooFast:tooFast};
    }
    function hint(a,i,opts){
      opts=opts||{};var act=activity(a);act.hints++;
      var level=String(opts.helpLevel||'');
      var it=i?item(a,i):null;
      if(it){it.hints++;if(HELP_ORDER[level]>=2)it.strongHints++;if((HELP_ORDER[level]||0)>(HELP_ORDER[it.maxHelp]||0))it.maxHelp=level}
      log('hint',Object.assign(extras(opts),{activityId:a,itemId:i||undefined,helpLevel:level||undefined,helpType:opts.helpType,helpBy:'content',attemptNo:it?it.attempts+1:undefined,sinceReadyMs:it&&it.readyAt?round(now()-it.readyAt):undefined}));
    }
    /* 아이가 못 맞혀 콘텐츠가 답을 열어 준 문항 — 판정은 support, 혼자 해낸 것으로 남기지 않는다 */
    function close(a,i,opts){
      opts=opts||{};activity(a);
      var it=item(a,i);if(it.done)return;
      it.done=true;if(!it.maxHelp||HELP_ORDER[it.maxHelp]<4)it.maxHelp='A4';it.strongHints++;
      log('item-complete',{activityId:a,itemId:i,attempts:it.attempts,firstTryCorrect:false,accuracy:'support',resolution:opts.resolution||'revealed',totalMs:it.firstReadyAt?round(now()-it.firstReadyAt):undefined,hintCount:it.hints,maxHelpLevel:it.maxHelp,measureId:opts.measureId});
    }
    function summary(scope,extra){
      var w=scope==='lesson'?total:window_;
      var payload=Object.assign({scope:scope,windowMs:round(now()-w.since),tapAnswer:w.answer,tapNav:w.nav,tapTool:w.tool,tapWord:w.word,tapUi:w.ui,tapOffTask:w.offTask,offTask0_10min:w.offTaskByPhase[0],offTask10_20min:w.offTaskByPhase[1],offTask20_30min:w.offTaskByPhase[2],offTask30minPlus:w.offTaskByPhase[3],signalTooFast:w.tooFast,signalFastWrongRun:w.fastWrongRun,signalFastNav:w.fastNav,idleGaps:w.idleGaps,idleMs:round(w.idleMs),hiddenCount:w.hiddenCount,hiddenMs:round(w.hiddenMs)},extra||{});
      log('engagement_summary',payload);
      if(scope!=='lesson')window_=fresh();
    }
    function activityComplete(a,extra){
      var act=activity(a);if(act.done)return;act.done=true;
      var list=Object.keys(items).map(function(k){return items[k]}).filter(function(it){return it.activityId===a});
      var done=list.filter(function(it){return it.done});
      log('activity-summary',Object.assign({activityId:a,durationMs:round(now()-act.startedAt),items:list.length,itemsDone:done.length,itemsFirstTry:done.filter(function(it){return it.attempts===1&&it.strongHints===0}).length,itemsSelfCorrected:done.filter(function(it){return it.attempts>1&&it.strongHints===0}).length,itemsWithSupport:done.filter(function(it){return it.strongHints>0}).length,attempts:list.reduce(function(s,it){return s+it.attempts},0),hintCount:act.hints},extra||{}));
      summary('activity',{activityId:a});
    }
    function lessonComplete(extra){
      log('lesson-summary',Object.assign({totalMs:lessonMs(),wordOpens:wordOpens,activities:Object.keys(activities).length,activitiesDone:Object.keys(activities).filter(function(k){return activities[k].done}).length},extra||{}));
      summary('lesson',{});
    }
    /* 보기 버튼에 트래커가 읽는 표시를 미리 붙인다 — 클릭 전에 값이 맞아야 한다 */
    function decorate(buttons,a,i,isCorrect){
      var it=item(a,i),next=String(it.attempts+1),acc=predictAccuracy(it);
      Array.prototype.forEach.call(buttons||[],function(b){
        b.dataset.track='answer';b.dataset.itemId=i;b.dataset.attemptNo=next;
        var ok=typeof isCorrect==='function'?isCorrect(b):b.dataset.correct==='true';
        b.dataset.correct=String(!!ok);
        if(ok)b.dataset.accuracy=acc;else delete b.dataset.accuracy;
      });
    }
    function decorateLater(buttons,a,i,isCorrect){setTimeout(function(){decorate(buttons,a,i,isCorrect)},0)}
    function fire(el){
      if(!el)return;
      try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))}catch(_){try{el.click()}catch(__){}}
    }
    return{log:log,enterScreen:enterScreen,startLesson:startLesson,ready:ready,respond:respond,hint:hint,close:close,activityComplete:activityComplete,lessonComplete:lessonComplete,decorate:decorate,decorateLater:decorateLater,fire:fire,textLength:textLength,item:function(a,i){return item(a,i)},sinceReadyMs:function(a,i){var it=item(a,i);return it.readyAt?round(now()-it.readyAt):undefined},snapshot:function(){return{answer:total.answer,nav:total.nav,tool:total.tool,word:total.word,ui:total.ui,offTask:total.offTask,tooFast:total.tooFast,fastNav:total.fastNav,idleGaps:total.idleGaps}}};
  }
  function stub(){
    var noop=function(){};
    return{log:noop,enterScreen:noop,startLesson:noop,ready:function(){return{}},respond:function(){return{attemptNo:1}},hint:noop,close:noop,activityComplete:noop,lessonComplete:noop,decorate:noop,decorateLater:noop,fire:function(el){try{el&&el.click()}catch(_){}},textLength:textLength,item:function(){return{attempts:0}},sinceReadyMs:function(){return undefined}};
  }
  window.OncuvateCaseSignals={create:create,stub:stub};
}());
