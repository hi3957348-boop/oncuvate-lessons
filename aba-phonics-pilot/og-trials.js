/* ABA 파닉스 · 시행(trial) 기록기
   문항 하나 = 시행 하나. 시행마다 아래를 한 줄로 묶어 남긴다.
   - 독립 반응: 도움 없이 처음 확정한 답과 정오 (firstResponse · firstCorrect)
   - 촉진: 받은 도움의 가장 강한 수준 A1~A4 (helpLevel) · 종류(helpTypes) · 누가(helpBy)
   - 촉진 후 반응: 이후 시도 수(attemptNo) · 최종 정오
   - 첫 반응시간: 반응할 수 있게 된 때부터 첫 확정까지(reactionMs) · 전체 시간(totalMs)
   - 정확성(플랫폼 3값): accurate(첫 시도·도움 없이 정답) / self-corrected(도움 없이 스스로 고침) / support(도움 뒤 정답)
     정답에 끝내 닿지 못하면 accuracy는 비우고 outcome='unresolved'.
   보내는 곳: oncuvate:log (type 'trial' + 규격의 'reaction'). 플랫폼은 detail 키를 그대로 저장한다.
   회기 보고서는 저장된 이 기록과 코치 기록을 합쳐 나중에 발행한다(이 파일은 기록만 한다). */
(() => {
  'use strict';
  const LEVEL={A1:1,A2:2,A3:3,A4:4};
  const now=()=>performance.now();
  const log=d=>window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:Object.assign({schemaVersion:'0.2'},d)}));

  window.createTrialRecorder=function(cfg){
    let cur=null;            // 지금 진행 중인 시행
    const done=[];           // 이 화면에서 끝난 시행(보고서용 요약)
    let seq=0;
    function begin(t){
      if(cur&&cur.activityId===t.activityId&&cur.itemId===t.itemId)return cur;   // 같은 문항 다시 그리기면 이어감
      if(cur)end('abandoned');
      cur={activityId:t.activityId,itemId:String(t.itemId),target:t.target??null,measureId:t.measureId||t.activityId,condition:t.condition||{},
        t0:now(),firstAt:null,firstResponse:null,firstCorrect:null,responses:[],helps:[],helpBeforeFirst:false,maxHelp:0,attempts:0,finalCorrect:null};
      return cur;
    }
    // 도움(촉진): level A1~A4, type(예: part-cue · model-reading · visual-cue · coach-support), by(system|child-request|coach)
    function prompt(level,type,by='system'){
      if(!cur)return;
      const lv=LEVEL[level]||0;cur.maxHelp=Math.max(cur.maxHelp,lv);
      cur.helps.push({level:level||null,type:type||null,by,atMs:Math.round(now()-cur.t0),beforeFirst:cur.firstAt===null});
      if(cur.firstAt===null)cur.helpBeforeFirst=true;
    }
    // 확정 반응 한 번(Check·선택 확정 등). resolved=true면 정답으로 시행을 끝낸다
    function respond(value,correct){
      if(!cur)return;
      const t=now();cur.attempts++;
      cur.responses.push({value:String(value??''),correct:!!correct,atMs:Math.round(t-cur.t0)});
      if(cur.firstAt===null){cur.firstAt=t;cur.firstResponse=String(value??'');cur.firstCorrect=!!correct;log({type:'reaction',activityId:cur.activityId,itemId:cur.itemId,ms:Math.round(t-cur.t0)})}
      if(correct){cur.finalCorrect=true;end('complete')}
    }
    function end(outcome='complete'){
      if(!cur)return null;const c=cur;cur=null;
      const helped=c.helps.length>0;
      let accuracy=null;
      if(c.finalCorrect){
        if(c.firstCorrect&&!c.helpBeforeFirst)accuracy='accurate';
        else if(!helped)accuracy='self-corrected';
        else accuracy='support';
      }
      const lv=c.maxHelp?'A'+c.maxHelp:null;
      const rec={type:'trial',trialNo:++seq,activityId:c.activityId,itemId:c.itemId,measureId:c.measureId,target:c.target,condition:c.condition,
        outcome:c.finalCorrect?outcome:(outcome==='complete'?'unresolved':outcome),accuracy,
        firstResponse:c.firstResponse,firstCorrect:c.firstCorrect,reactionMs:c.firstAt===null?null:Math.round(c.firstAt-c.t0),totalMs:Math.round(now()-c.t0),
        attemptNo:c.attempts,responses:c.responses.slice(0,12),helpLevel:lv,helpTypes:[...new Set(c.helps.map(h=>h.type).filter(Boolean))],helpBy:[...new Set(c.helps.map(h=>h.by))],helpBeforeFirst:c.helpBeforeFirst};
      if(rec.outcome==='abandoned'&&c.attempts===0&&!helped)return null;   // 보기만 하고 넘긴 화면은 기록하지 않음
      log(rec);
      done.push({a:rec.activityId,i:rec.itemId,g:rec.target,o:rec.outcome,ac:rec.accuracy,f:rec.firstResponse,fc:rec.firstCorrect,ms:rec.reactionMs,n:rec.attemptNo,h:rec.helpLevel,ht:rec.helpTypes,c:rec.condition});
      return rec;
    }
    // 게임처럼 시행이 아닌 활동은 관찰 사건으로만 남긴다(보고서에서 합산)
    function event(activityId,kind,data){
      const rec=Object.assign({type:'observation',activityId,kind},data||{});
      log(rec);
      done.push({a:activityId,k:kind,d:data||{}});
    }
    return{begin,prompt,respond,end,event,current:()=>cur,records:()=>done.slice()};
  };

})();
