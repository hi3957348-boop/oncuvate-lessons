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
