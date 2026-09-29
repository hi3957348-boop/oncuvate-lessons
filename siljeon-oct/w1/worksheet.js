const STORE='oncuvate-hangul-review-v1';
const saved=JSON.parse(localStorage.getItem(STORE)||'{}');
if(saved.wordGridVersion!==2){
  Object.keys(saved).filter(key=>key.startsWith('word-')).forEach(key=>delete saved[key]);
  saved.solvedWords=[];
  saved.wordGridVersion=2;
  localStorage.setItem(STORE,JSON.stringify(saved));
}
const controls=[...document.querySelectorAll('[data-save]')];
controls.forEach((el)=>{
  const key=el.dataset.save;
  if(el.type==='radio'){if(saved[key]===el.value)el.checked=true}
  else if(el.type==='checkbox'){el.checked=Boolean(saved[key])}
  else if(saved[key]!==undefined){el.value=saved[key]}
  el.addEventListener('input',()=>{saved[key]=el.type==='radio'?el.value:el.type==='checkbox'?el.checked:el.value;localStorage.setItem(STORE,JSON.stringify(saved))});
});

document.querySelectorAll('[data-check-group]').forEach(btn=>btn.addEventListener('click',()=>{
  const root=document.querySelector('.'+btn.dataset.checkGroup);
  root.querySelectorAll('[data-answer]').forEach(el=>{
    const normalize=v=>v.replace(/\s|·/g,'').split(',').filter(Boolean).sort().join(',');
    el.classList.toggle('correct',normalize(el.value)===normalize(el.dataset.answer));
    el.classList.toggle('wrong',el.value!==''&&normalize(el.value)!==normalize(el.dataset.answer));
  });
  const radios=[...root.querySelectorAll('input[type=radio]:checked')];
  radios.forEach(el=>{const label=el.closest('label');label.classList.toggle('correct',el.dataset.correct==='true');label.classList.toggle('wrong',el.dataset.correct!=='true')});
}));

const rows=[
  '세책배리학나나하라날백글',
  '봄마반봄화술빛꿈글화성교',
  '문람배포랑희대봄우지날모',
  '나바리망라우나회랑음음교',
  '라람세희손화화지음자문문',
  '특꽃음소별책움나식희봄구',
  '별친종학배구움늘한랑한날',
  '전빛라식람람늘하한한나격',
  '라학구꽃사정끝봄학세친려',
  '나념구학제소구망글화라친',
  '글기움끝말소별문글한종끝',
  '끝희꿈빛책우점자날날리리'
];
const grid=document.getElementById('wordGrid');
const solutions=[
  {word:'반포',start:[1,2],end:[2,3]},
  {word:'백성',start:[0,10],end:[1,10]},
  {word:'자음',start:[4,9],end:[4,8]},
  {word:'모음',start:[2,11],end:[3,10]},
  {word:'기념',start:[10,1],end:[9,1]},
  {word:'제정',start:[9,4],end:[8,5]},
  {word:'점자',start:[11,6],end:[11,7]},
  {word:'특별전',start:[5,0],end:[7,0]},
  {word:'학술대회',start:[0,4],end:[3,7]},
  {word:'격려',start:[7,11],end:[8,11]}
];
const cellAt=(r,c)=>grid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
const lineBetween=(start,end)=>{
  const [r1,c1]=start,[r2,c2]=end,rd=r2-r1,cd=c2-c1;
  if(rd!==0&&cd!==0&&Math.abs(rd)!==Math.abs(cd))return [];
  const length=Math.max(Math.abs(rd),Math.abs(cd))+1;
  const dr=Math.sign(rd),dc=Math.sign(cd);
  return Array.from({length},(_,i)=>[r1+dr*i,c1+dc*i]);
};
const pathKey=path=>path.map(([r,c])=>`${r},${c}`).join('|');
const solutionPaths=new Map();
solutions.forEach(solution=>{
  const path=lineBetween(solution.start,solution.end);
  solution.path=path;
  solutionPaths.set(pathKey(path),solution);
  solutionPaths.set(pathKey([...path].reverse()),solution);
});

rows.forEach((row,r)=>[...row].forEach((ch,c)=>{
  const button=document.createElement('button');
  button.type='button';button.textContent=ch;button.dataset.row=r;button.dataset.col=c;
  button.setAttribute('aria-label',`${r+1}행 ${c+1}열 ${ch}`);
  grid.appendChild(button);
}));

const feedback=document.getElementById('wordFeedback');
const solvedWords=new Set(Array.isArray(saved.solvedWords)?saved.solvedWords:[]);
let dragStart=null,currentPath=[];
const clearPreview=()=>grid.querySelectorAll('.selecting').forEach(cell=>cell.classList.remove('selecting'));
const paintPreview=path=>{clearPreview();path.forEach(([r,c])=>cellAt(r,c)?.classList.add('selecting'))};
const refreshProgress=(message='낱말을 드래그해 찾아보세요.')=>{
  feedback.classList.remove('is-correct','is-wrong','is-complete');
  if(solvedWords.size===solutions.length){feedback.classList.add('is-complete');message='모두 찾았어요! 기사 핵심 낱말을 정확히 확인했습니다.'}
  feedback.innerHTML=`${message} <b>${solvedWords.size} / ${solutions.length}</b>`;
};
const saveSolved=()=>{saved.solvedWords=[...solvedWords];localStorage.setItem(STORE,JSON.stringify(saved))};
const markSolved=solution=>{
  solution.path.forEach(([r,c])=>cellAt(r,c)?.classList.add('solved'));
  const check=document.querySelector(`.word-list input[data-word="${solution.word}"]`);
  if(check){check.checked=true;saved[check.dataset.save]=true}
};
const gradePath=path=>{
  clearPreview();
  const solution=solutionPaths.get(pathKey(path));
  if(solution){
    const wasSolved=solvedWords.has(solution.word);
    solvedWords.add(solution.word);markSolved(solution);saveSolved();
    feedback.classList.add('is-correct');
    refreshProgress(wasSolved?`‘${solution.word}’은 이미 찾았어요.`:`정답! ‘${solution.word}’을 찾았어요.`);
    feedback.classList.add('is-correct');
  }else{
    path.forEach(([r,c])=>cellAt(r,c)?.classList.add('wrong-selection'));
    feedback.classList.add('is-wrong');feedback.innerHTML=`다시 살펴보세요. 낱말은 한 줄로 이어져요. <b>${solvedWords.size} / ${solutions.length}</b>`;
    setTimeout(()=>path.forEach(([r,c])=>cellAt(r,c)?.classList.remove('wrong-selection')),650);
  }
};

grid.addEventListener('pointerdown',event=>{
  const cell=event.target.closest('button');if(!cell)return;
  event.preventDefault();dragStart=[Number(cell.dataset.row),Number(cell.dataset.col)];currentPath=[dragStart];paintPreview(currentPath);
});
grid.addEventListener('pointermove',event=>{
  if(!dragStart)return;const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('#wordGrid button');if(!cell)return;
  const end=[Number(cell.dataset.row),Number(cell.dataset.col)],path=lineBetween(dragStart,end);if(path.length){currentPath=path;paintPreview(path)}
});
const finishSelection=()=>{if(!dragStart)return;const path=currentPath;dragStart=null;currentPath=[];if(path.length>1)gradePath(path);else clearPreview()};
grid.addEventListener('pointerup',finishSelection);window.addEventListener('pointerup',finishSelection);grid.addEventListener('pointercancel',()=>{dragStart=null;currentPath=[];clearPreview()});
grid.addEventListener('pointerleave',event=>{if(event.buttons===0)finishSelection()});

solutions.filter(solution=>solvedWords.has(solution.word)).forEach(markSolved);
refreshProgress();

function doPrint(blank){document.body.classList.toggle('print-blank',blank);setTimeout(()=>window.print(),50)}
document.getElementById('printBlank').addEventListener('click',()=>doPrint(true));
document.getElementById('printFilled').addEventListener('click',()=>doPrint(false));
window.addEventListener('afterprint',()=>document.body.classList.remove('print-blank'));
document.getElementById('resetAll').addEventListener('click',()=>{if(confirm('작성한 내용을 모두 지울까요?')){localStorage.removeItem(STORE);location.reload()}});

// 선택형 문항은 고르는 즉시 채점합니다.
const choiceRoots=[...document.querySelectorAll('.quiz,.ox-grid>div')];
const renderChoiceFeedback=root=>{
  const radios=[...root.querySelectorAll('input[type="radio"]')];
  const selected=radios.find(radio=>radio.checked);
  root.querySelectorAll('label').forEach(label=>label.classList.remove('correct','wrong'));
  let feedback=root.querySelector('.choice-feedback');
  if(!selected){feedback?.remove();return}
  const correct=selected.dataset.correct==='true';
  selected.closest('label')?.classList.add(correct?'correct':'wrong');
  if(!feedback){feedback=document.createElement('p');feedback.className='choice-feedback';feedback.setAttribute('role','status');root.appendChild(feedback)}
  feedback.className=`choice-feedback ${correct?'is-correct':'is-wrong'}`;
  feedback.textContent=correct?'정답이에요. 근거가 나온 문장도 확인해 보세요.':'다시 확인해 보세요. 기사에서 근거를 찾으면 좋아요.';
};
choiceRoots.forEach(root=>{
  root.querySelectorAll('input[type="radio"]').forEach(radio=>radio.addEventListener('change',()=>renderChoiceFeedback(root)));
  renderChoiceFeedback(root);
});

const RESULT_GROUPS=[
  {title:'낱말 돋보기',items:[
    ['같은 布(펼 포)가 든 말','vocab-po'],['같은 字(글자 자)가 든 말','vocab-ja'],['같은 定(정할 정)이 든 말','vocab-jeong'],['같은 展(펼 전)이 든 말','vocab-jeon']
  ]},
  {title:'활동 1 · 본문 낱말',items:[
    ['1. 훈민정음을 널리 알린 일','fill-1'],['2. 한자를 배우기 힘들었던 사람들','fill-2'],['3-1. 한글의 소리 글자','fill-3a'],['3-2. 한글의 홀소리 글자','fill-3b'],['4. 여섯 점으로 읽는 한글 점자','fill-4'],['5. 2026년에 붙인 이름','fill-5']
  ]},
  {title:'활동 2 · 바르게 고쳐 쓰기',items:[
    ['1. 훈민정음 반포 연도','correct-1'],['2. 훈맹정음의 점 개수','correct-2'],['3. 가갸날의 새 이름','correct-3']
  ]},
  {title:'활동 3 · 기사 이해',items:[
    ['1. 세종대왕이 훈민정음을 만든 까닭','q1','choice'],['2. 훈맹정음을 만든 대상과 방법','q2','choice'],['3. 2026년이 한글의 해가 된 까닭','q3','choice']
  ]},
  {title:'활동 4 · OX',items:[
    ['1. 훈민정음 반포 580돌','ox1','choice'],['2. 훈맹정음은 네 개의 점','ox2','choice'],['3. 훈맹정음과 가갸날 발표일','ox3','choice'],['4. 11월의 특별전과 학술대회','ox4','choice']
  ]},
  {title:'활동 5 · 두 글자 비교',items:[
    ['훈민정음만 해당하는 설명 번호','compare-a'],['두 글자 모두 해당하는 설명 번호','compare-b'],['훈맹정음만 해당하는 설명 번호','compare-c'],['두 글자가 덜어 주려 한 어려움','open-1','open']
  ]},
  {title:'활동 6 · 핵심 낱말과 마무리',items:[
    ['기사 제목과 가장 가까운 핵심 낱말','finish-1'],['두 글자가 모두를 위한 글자인 까닭','finish-2','open']
  ]}
];

const getSavedControl=key=>document.querySelector(`[data-save="${key}"]`);
const cleanText=value=>String(value??'').trim().replace(/\s+/g,' ');
const choiceEntry=(label,key)=>{
  const selected=document.querySelector(`input[type="radio"][data-save="${key}"]:checked`);
  if(!selected)return{label,answer:'미응답',status:'미응답',tone:'missing',missing:1,choice:true,correct:false};
  const answer=cleanText(selected.closest('label')?.textContent||selected.value);
  const correct=selected.dataset.correct==='true';
  return{label,answer,status:correct?'정답':'다시 확인',tone:correct?'correct':'wrong',missing:0,choice:true,correct};
};
const textEntry=(label,key)=>{
  const control=getSavedControl(key);const answer=cleanText(control?.value);
  if(!answer)return{label,answer:'미응답',status:'미응답',tone:'missing',missing:1};
  const checkedCorrect=control.classList.contains('correct'),checkedWrong=control.classList.contains('wrong');
  return{label,answer,status:checkedCorrect?'정답':checkedWrong?'다시 확인':'작성됨',tone:checkedCorrect?'correct':checkedWrong?'wrong':'written',missing:0};
};
const collectReport=()=>{
  const groups=RESULT_GROUPS.map(group=>({title:group.title,items:group.items.map(([label,key,type])=>type==='choice'?choiceEntry(label,key):textEntry(label,key))}));
  const wordInputs=[...document.querySelectorAll('.word-list input[data-word]')];
  const found=wordInputs.filter(input=>input.checked).map(input=>input.dataset.word);
  const missingWords=wordInputs.filter(input=>!input.checked).map(input=>input.dataset.word);
  groups[groups.length-1].items.unshift({label:'핵심 낱말 10개 찾기',answer:found.length?found.join(', '):'미응답',status:found.length===10?'완료':found.length?`${found.length}/10 찾음`:'미응답',tone:found.length===10?'correct':found.length?'written':'missing',missing:missingWords.length,missingWords});
  const checkItems=[
    ['날짜와 숫자를 정확히 읽었어요','self-1'],['틀린 부분을 본문과 비교했어요','self-2'],['제목과 소제목을 먼저 읽었어요','reflect-1'],['날짜와 숫자를 정확히 확인했어요','reflect-2'],['답의 근거를 기사에서 찾았어요','reflect-3']
  ].map(([label,key])=>({label,answer:getSavedControl(key)?.checked?'확인함':'미확인',status:getSavedControl(key)?.checked?'확인함':'미확인',tone:getSavedControl(key)?.checked?'correct':'written',missing:0}));
  groups.push({title:'읽기 자기 점검',items:checkItems});
  const items=groups.flatMap(group=>group.items);
  const choices=items.filter(item=>item.choice);
  const name=['student-name','student-name-2','student-name-3','student-name-4'].map(key=>cleanText(getSavedControl(key)?.value)).find(Boolean)||'미입력';
  const date=cleanText(getSavedControl('student-date')?.value)||new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return{groups,name,date,correct:choices.filter(item=>item.correct).length,choiceAnswered:choices.filter(item=>!item.missing).length,choiceTotal:choices.length,missing:items.reduce((sum,item)=>sum+item.missing,0)};
};

const escapeHtml=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const resultDialog=document.getElementById('resultDialog');
const resultSummary=document.getElementById('resultSummary');
const resultDetails=document.getElementById('resultDetails');
let currentReport=null;
const renderResult=report=>{
  resultSummary.innerHTML=`<div class="result-stat"><span>객관식 자동 채점</span><b>${report.correct} / ${report.choiceTotal}</b></div><div class="result-stat"><span>객관식 응답</span><b>${report.choiceAnswered} / ${report.choiceTotal}</b></div><div class="result-stat is-missing"><span>전체 미응답</span><b>${report.missing}개</b></div><p class="result-meta">이름 ${escapeHtml(report.name)} · 날짜 ${escapeHtml(report.date)} · 미응답이 있어도 이 결과표를 저장하거나 제출할 수 있습니다.</p>`;
  resultDetails.innerHTML=report.groups.map(group=>`<section class="result-group"><h3>${escapeHtml(group.title)}</h3>${group.items.map(item=>`<div class="result-row"><span class="result-row__label">${escapeHtml(item.label)}</span><span class="result-row__answer">${escapeHtml(item.answer)}${item.missingWords?.length?`<br><small>못 찾은 낱말: ${escapeHtml(item.missingWords.join(', '))}</small>`:''}</span><span class="result-row__status is-${escapeHtml(item.tone)}">${escapeHtml(item.status)}</span></div>`).join('')}</section>`).join('');
};
const openResult=()=>{
  currentReport=collectReport();renderResult(currentReport);
  if(typeof resultDialog.showModal==='function')resultDialog.showModal();else resultDialog.setAttribute('open','');
};
document.getElementById('makeResult').addEventListener('click',openResult);
document.getElementById('closeResult').addEventListener('click',()=>resultDialog.close?.());

const wrapCanvasText=(ctx,text,maxWidth)=>{
  const chars=[...String(text)],lines=[];let line='';
  chars.forEach(char=>{const test=line+char;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=char}else line=test});
  if(line)lines.push(line);return lines.length?lines:[''];
};
const buildResultCanvas=async report=>{
  await document.fonts?.ready;
  const width=1240,draft=document.createElement('canvas');draft.width=width;draft.height=6500;
  const ctx=draft.getContext('2d');ctx.fillStyle='#fffefb';ctx.fillRect(0,0,draft.width,draft.height);
  const left=76,right=76,content=width-left-right;let y=72;
  ctx.fillStyle='#2785c7';ctx.font='800 22px Pretendard, sans-serif';ctx.fillText('ONCUVATE · 실전! 문해력',left,y);y+=48;
  ctx.fillStyle='#24144f';ctx.font='900 48px Pretendard, sans-serif';ctx.fillText('신문 읽기 활동 결과표',left,y);y+=42;
  ctx.fillStyle='#777187';ctx.font='600 22px Pretendard, sans-serif';ctx.fillText(`이름 ${report.name}   ·   날짜 ${report.date}`,left,y);y+=38;
  ctx.strokeStyle='#d9cff5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();y+=38;
  const cards=[['객관식 자동 채점',`${report.correct} / ${report.choiceTotal}`,'#f8f6fd','#4b24a5'],['객관식 응답',`${report.choiceAnswered} / ${report.choiceTotal}`,'#f8f6fd','#4b24a5'],['전체 미응답',`${report.missing}개`,'#fff8ee','#9a5a17']];
  const gap=18,cardW=(content-gap*2)/3;
  cards.forEach(([label,value,bg,color],index)=>{const x=left+index*(cardW+gap);ctx.fillStyle=bg;ctx.fillRect(x,y,cardW,112);ctx.fillStyle='#777187';ctx.font='750 19px Pretendard, sans-serif';ctx.fillText(label,x+20,y+31);ctx.fillStyle=color;ctx.font='900 34px Pretendard, sans-serif';ctx.fillText(value,x+20,y+79)});y+=150;
  for(const group of report.groups){
    ctx.fillStyle='#4b24a5';ctx.font='850 26px Pretendard, sans-serif';ctx.fillText(group.title,left,y);y+=24;
    ctx.strokeStyle='#d9cff5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();y+=18;
    for(const item of group.items){
      ctx.font='750 20px Pretendard, sans-serif';const labelLines=wrapCanvasText(ctx,item.label,290);
      ctx.font='500 20px Pretendard, sans-serif';let answerText=item.answer;if(item.missingWords?.length)answerText+=` / 못 찾음: ${item.missingWords.join(', ')}`;const answerLines=wrapCanvasText(ctx,answerText,570);
      const rowH=Math.max(62,Math.max(labelLines.length,answerLines.length)*30+22);
      ctx.fillStyle='#29243a';ctx.font='750 20px Pretendard, sans-serif';labelLines.forEach((line,i)=>ctx.fillText(line,left,y+27+i*30));
      ctx.fillStyle='#555064';ctx.font='500 20px Pretendard, sans-serif';answerLines.forEach((line,i)=>ctx.fillText(line,left+320,y+27+i*30));
      const toneColor=item.tone==='correct'?'#247354':item.tone==='wrong'?'#b44246':item.tone==='missing'?'#9a5a17':'#625d6b';ctx.fillStyle=toneColor;ctx.font='850 18px Pretendard, sans-serif';ctx.textAlign='right';ctx.fillText(item.status,width-right,y+27);ctx.textAlign='left';
      y+=rowH;ctx.strokeStyle='#e8e3f3';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();
    }
    y+=40;
  }
  ctx.fillStyle='#777187';ctx.font='600 18px Pretendard, sans-serif';ctx.fillText('※ 서술형과 작성형 답은 결과표에 그대로 기록되며, 자동 채점하지 않습니다.',left,y);y+=66;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.ceil(y);canvas.getContext('2d').drawImage(draft,0,0,width,y,0,0,width,y);return canvas;
};
const resultFile=async()=>{
  currentReport=collectReport();
  const canvas=await buildResultCanvas(currentReport);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',.95));
  const safeName=currentReport.name==='미입력'?'이름미입력':currentReport.name.replace(/[\\/:*?"<>|\s]+/g,'-');
  return new File([blob],`신문읽기-결과표-${safeName}.png`,{type:'image/png'});
};
const downloadFile=file=>{const url=URL.createObjectURL(file);const link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
document.getElementById('downloadResult').addEventListener('click',async event=>{event.currentTarget.disabled=true;try{downloadFile(await resultFile())}finally{event.currentTarget.disabled=false}});
document.getElementById('shareResult').addEventListener('click',async event=>{
  event.currentTarget.disabled=true;
  try{
    const file=await resultFile();
    if(navigator.canShare?.({files:[file]})){await navigator.share({title:'신문 읽기 활동 결과표',text:'신문 읽기 활동 결과표입니다.',files:[file]})}
    else{downloadFile(file);alert('이 브라우저에서는 파일 공유창을 열 수 없어 결과표 이미지를 저장했습니다. 저장된 이미지를 제출해 주세요.')}
  }catch(error){if(error?.name!=='AbortError')alert('공유하지 못했습니다. 이미지 저장을 이용해 주세요.')}
  finally{event.currentTarget.disabled=false}
});
