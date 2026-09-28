const STORE='oncuvate-esports-review-v1';
const saved=JSON.parse(localStorage.getItem(STORE)||'{}');
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
  [...root.querySelectorAll('input[type=radio]:checked')].forEach(el=>{const label=el.closest('label');label.classList.toggle('correct',el.dataset.correct==='true');label.classList.toggle('wrong',el.dataset.correct!=='true')});
}));

const size=12,fillers=[...'게임선수대회메달경기퍼즐학교연습나라화면규칙심판스포츠'];
const solutions=[
  {word:'종목',start:[0,0],dir:[0,1]},{word:'시범',start:[1,10],dir:[0,-1]},
  {word:'정식',start:[2,2],dir:[1,0]},{word:'개최국',start:[0,5],dir:[1,1]},
  {word:'결승',start:[4,1],dir:[1,1]},{word:'최연소',start:[8,0],dir:[0,1]},
  {word:'기록',start:[3,9],dir:[1,0]},{word:'연쇄',start:[10,10],dir:[0,-1]},
  {word:'평균',start:[6,11],dir:[1,0]},{word:'논쟁',start:[11,4],dir:[0,1]}
];
const cells=Array.from({length:size},()=>Array(size).fill(''));
solutions.forEach(s=>{s.path=[...s.word].map((ch,i)=>[s.start[0]+s.dir[0]*i,s.start[1]+s.dir[1]*i]);s.path.forEach(([r,c],i)=>{cells[r][c]=[...s.word][i]})});
let seed=17;const random=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
cells.forEach((row,r)=>row.forEach((ch,c)=>{if(!ch)cells[r][c]=fillers[Math.floor(random()*fillers.length)]}));
const grid=document.getElementById('wordGrid');
cells.forEach((row,r)=>row.forEach((ch,c)=>{const button=document.createElement('button');button.type='button';button.textContent=ch;button.dataset.row=r;button.dataset.col=c;button.setAttribute('aria-label',`${r+1}행 ${c+1}열 ${ch}`);grid.appendChild(button)}));
const cellAt=(r,c)=>grid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
const lineBetween=(start,end)=>{const [r1,c1]=start,[r2,c2]=end,rd=r2-r1,cd=c2-c1;if(rd!==0&&cd!==0&&Math.abs(rd)!==Math.abs(cd))return[];const length=Math.max(Math.abs(rd),Math.abs(cd))+1,dr=Math.sign(rd),dc=Math.sign(cd);return Array.from({length},(_,i)=>[r1+dr*i,c1+dc*i])};
const pathKey=path=>path.map(([r,c])=>`${r},${c}`).join('|');
const solutionPaths=new Map();solutions.forEach(s=>{solutionPaths.set(pathKey(s.path),s);solutionPaths.set(pathKey([...s.path].reverse()),s)});
const feedback=document.getElementById('wordFeedback'),solvedWords=new Set(Array.isArray(saved.solvedWords)?saved.solvedWords:[]);let dragStart=null,currentPath=[];
const clearPreview=()=>grid.querySelectorAll('.selecting').forEach(cell=>cell.classList.remove('selecting'));
const paintPreview=path=>{clearPreview();path.forEach(([r,c])=>cellAt(r,c)?.classList.add('selecting'))};
const refreshProgress=(message='낱말을 드래그해 찾아보세요.')=>{feedback.classList.remove('is-correct','is-wrong','is-complete');if(solvedWords.size===solutions.length){feedback.classList.add('is-complete');message='모두 찾았어요! 기사 핵심 낱말을 정확히 확인했습니다.'}feedback.innerHTML=`${message} <b>${solvedWords.size} / ${solutions.length}</b>`};
const saveSolved=()=>{saved.solvedWords=[...solvedWords];localStorage.setItem(STORE,JSON.stringify(saved))};
const markSolved=s=>{s.path.forEach(([r,c])=>cellAt(r,c)?.classList.add('solved'));const check=document.querySelector(`.word-list input[data-word="${s.word}"]`);if(check){check.checked=true;saved[check.dataset.save]=true}};
const gradePath=path=>{clearPreview();const solution=solutionPaths.get(pathKey(path));if(solution){const wasSolved=solvedWords.has(solution.word);solvedWords.add(solution.word);markSolved(solution);saveSolved();refreshProgress(wasSolved?`‘${solution.word}’은 이미 찾았어요.`:`정답! ‘${solution.word}’을 찾았어요.`);feedback.classList.add('is-correct')}else{path.forEach(([r,c])=>cellAt(r,c)?.classList.add('wrong-selection'));feedback.classList.add('is-wrong');feedback.innerHTML=`다시 살펴보세요. 낱말은 한 줄로 이어져요. <b>${solvedWords.size} / ${solutions.length}</b>`;setTimeout(()=>path.forEach(([r,c])=>cellAt(r,c)?.classList.remove('wrong-selection')),650)}};
grid.addEventListener('pointerdown',event=>{const cell=event.target.closest('button');if(!cell)return;event.preventDefault();dragStart=[Number(cell.dataset.row),Number(cell.dataset.col)];currentPath=[dragStart];paintPreview(currentPath)});
grid.addEventListener('pointermove',event=>{if(!dragStart)return;const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('#wordGrid button');if(!cell)return;const end=[Number(cell.dataset.row),Number(cell.dataset.col)],path=lineBetween(dragStart,end);if(path.length){currentPath=path;paintPreview(path)}});
const finishSelection=()=>{if(!dragStart)return;const path=currentPath;dragStart=null;currentPath=[];if(path.length>1)gradePath(path);else clearPreview()};
grid.addEventListener('pointerup',finishSelection);window.addEventListener('pointerup',finishSelection);grid.addEventListener('pointercancel',()=>{dragStart=null;currentPath=[];clearPreview()});grid.addEventListener('pointerleave',event=>{if(event.buttons===0)finishSelection()});
solutions.filter(s=>solvedWords.has(s.word)).forEach(markSolved);refreshProgress();

function doPrint(blank){document.body.classList.toggle('print-blank',blank);setTimeout(()=>window.print(),50)}
document.getElementById('printBlank').addEventListener('click',()=>doPrint(true));
document.getElementById('printFilled').addEventListener('click',()=>doPrint(false));
window.addEventListener('afterprint',()=>document.body.classList.remove('print-blank'));
document.getElementById('resetAll').addEventListener('click',()=>{if(confirm('작성한 내용을 모두 지울까요?')){localStorage.removeItem(STORE);location.reload()}});
