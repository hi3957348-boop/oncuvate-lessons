const params=new URLSearchParams(location.search);
const lessonKey=params.get('lesson')||'taejong';
const d=window.HISTORY_LESSONS[lessonKey]||window.HISTORY_LESSONS.taejong;
document.title=`실전! 문해력 - 역사 읽기 - ${d.title}`;
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const head=(label,extra='')=>`<header class="sheet-head"><div><span class="brand-line">ONCUVATE · 실전! 문해력</span><span class="issue">${esc(label)}</span></div><div class="student-line">이름 <input data-save="name${extra}" aria-label="이름"> 날짜 <input data-save="date${extra}" aria-label="날짜"></div></header>`;
const pageTitle=(n,t,klass='')=>`<div class="page-title ${klass}"><span>활동 ${n}</span><h2>${t}</h2></div>`;
const vocab=d.vocab.map((v,i)=>`<article class="vocab-card"><h3>${v[0]} <small>${v[1]}</small></h3><p>${v[2]}</p><label>같은 <b>${v[3]}</b>이 든 말<input data-save="vocab-${i}" aria-label="${esc(v[3])}이 든 말"></label></article>`).join('');
const fills=d.fills.map((v,i)=>`<li>${v[0]} <input data-save="fill-${i}" data-answer="${esc(v[1])}" aria-label="${i+1}번 빈칸">${v[2]}</li>`).join('');
const corrections=d.corrections.map((v,i)=>`<div><p><b>${i+1}</b> ${v[0]}</p><label>바르게 고치기 <input data-save="correct-${i}" data-answer="${esc(v[1])}" aria-label="${i+1}번 고쳐 쓰기"></label></div>`).join('');
const quizzes=d.quiz.map((q,i)=>`<fieldset class="quiz"><legend><b>${i+1}</b> ${q[0]}</legend>${q[1].map((a,j)=>`<label><input type="radio" name="q${i}" data-save="q${i}" value="${j}" ${j===q[2]?'data-correct="true"':''}> ${a}</label>`).join('')}</fieldset>`).join('');
const ox=d.ox.map((q,i)=>`<div><p>${q[0]}</p><label><input type="radio" name="ox${i}" data-save="ox${i}" value="O" ${q[1]==='O'?'data-correct="true"':''}>O</label><label><input type="radio" name="ox${i}" data-save="ox${i}" value="X" ${q[1]==='X'?'data-correct="true"':''}>X</label></div>`).join('');
const eventCards=[...d.events].sort(()=>.5-Math.random()).map((e,i)=>`<span><b>${i+1}</b>${e[1]}</span>`).join('');
const eventAnswers=d.events.map((e,i)=>`<label><b>${e[0]}</b><input data-save="event-${i}" data-answer="${esc(e[1])}" aria-label="${e[0]}년 사건"></label>`).join('');

document.getElementById('workbook').innerHTML=`
<section class="sheet" id="page-1">${head(d.issue)}
  <div class="title-block"><p>실전! 문해력 -역사 읽기-</p><h1>${d.title}</h1><h2>${d.subtitle}</h2></div>
  <div class="reading-guide"><span><b>1</b> 인물·사건에 표시하기</span><span><b>2</b> 원인과 결과 연결하기</span><span><b>3</b> 시간 순서 파악하기</span></div>
  <article class="history-article"><p>${d.article}</p></article>
  <section class="vocab-strip"><div class="section-kicker"><span class="magnifier"></span><b>낱말 돋보기</b><em>뜻과 한자를 살펴보세요.</em></div><div class="vocab-grid">${vocab}</div></section>
  <footer><span>사건이 일어난 까닭과 달라진 점을 생각하며 읽었나요?</span><b>1 / 4</b></footer>
</section>
<section class="sheet" id="page-2">${head('정확히 읽기','-2')}
  ${pageTitle(1,'본문에 나온 말로 빈칸을 채우세요.')}
  <div class="word-bank"><b>보기</b>${d.bank.map(w=>`<span>${w}</span>`).join('')}</div>
  <ol class="fill-list">${fills}</ol><button class="check-btn" data-check-group="fill-list">즉시 채점</button>
  ${pageTitle(2,'본문과 다른 부분을 찾아 바르게 고쳐 쓰세요.','second')}
  <div class="correction-list">${corrections}</div><button class="check-btn" data-check-group="correction-list">즉시 채점</button>
  <div class="self-check"><b>읽기 점검</b><label><input type="checkbox" data-save="self-1"> 인물과 사건을 정확히 연결했어요.</label><label><input type="checkbox" data-save="self-2"> 문장을 끝까지 읽고 본문과 비교했어요.</label></div>
  <footer><span>단어만 훑지 않고 문장을 끝까지 확인했나요?</span><b>2 / 4</b></footer>
</section>
<section class="sheet" id="page-3">${head('깊이 이해하기','-3')}
  ${pageTitle(3,'본문의 내용을 생각하며 답하세요.')}
  <div class="quiz-grid">${quizzes}</div><button class="check-btn compact" data-check-group="quiz-grid">즉시 채점</button>
  ${pageTitle(4,'맞으면 O, 다르면 X에 표시하세요.','mini')}
  <div class="ox-grid">${ox}</div><button class="check-btn compact" data-check-group="ox-grid">즉시 채점</button>
  ${pageTitle(5,'사건을 시간 순서대로 정리하세요.','mini')}
  <p class="activity-note">보기의 사건 이름을 알맞은 연도 칸에 쓰세요.</p><div class="event-bank">${eventCards}</div><div class="event-answers">${eventAnswers}</div><button class="check-btn compact" data-check-group="event-answers">즉시 채점</button>
  <footer><span>연도보다 먼저 원인과 결과를 연결해 보세요.</span><b>3 / 4</b></footer>
</section>
<section class="sheet" id="page-4">${head('핵심 낱말','-4')}
  ${pageTitle(6,'본문의 핵심 낱말 10개를 찾아 표시하세요.')}
  <p class="wordsearch-help">가로·세로·대각선으로 드래그하세요. 맞으면 바로 채점됩니다.</p>
  <div class="wordsearch-layout"><div id="wordGrid" class="word-grid"></div><aside class="word-list"><h3>찾을 낱말</h3>${d.words.map((w,i)=>`<label><input type="checkbox" data-save="word-${i}" data-word="${w}">${w}</label>`).join('')}<p id="wordFeedback" class="word-feedback">낱말을 드래그해 찾아보세요. <b>0 / 10</b></p></aside></div>
  <section class="finish-writing"><div><span>1</span><label>${d.finish[0]}<input data-save="finish-1"></label></div><div><span>2</span><label>${d.finish[1]}<textarea data-save="finish-2" rows="3"></textarea></label></div></section>
  <div class="reflection"><b>역사 읽기 마무리</b><label><input type="checkbox" data-save="reflect-1"> 사건의 순서를 파악했어요.</label><label><input type="checkbox" data-save="reflect-2"> 원인과 결과를 연결했어요.</label><label><input type="checkbox" data-save="reflect-3"> 답의 근거를 본문에서 찾았어요.</label></div>
  <footer><span>역사 글 한 편을 끝까지 꼼꼼하게 읽었습니다!</span><b>4 / 4</b></footer>
</section>`;

const storeKey=`oncuvate-history-workbook-${lessonKey}-v1`;
const saved=JSON.parse(localStorage.getItem(storeKey)||'{}');
document.querySelectorAll('[data-save]').forEach(el=>{const key=el.dataset.save;if(el.type==='radio'){if(saved[key]===el.value)el.checked=true}else if(el.type==='checkbox'){el.checked=Boolean(saved[key])}else if(saved[key]!=null)el.value=saved[key];el.addEventListener('input',()=>{saved[key]=el.type==='radio'?el.value:el.type==='checkbox'?el.checked:el.value;localStorage.setItem(storeKey,JSON.stringify(saved))})});
const norm=v=>String(v).replace(/\s|[.,·ㆍ]/g,'').replace(/(입니다|합니다|했습니다)$/,'');
document.querySelectorAll('[data-check-group]').forEach(btn=>btn.addEventListener('click',()=>{const root=document.querySelector('.'+btn.dataset.checkGroup);let total=0,correct=0;root.querySelectorAll('[data-answer]').forEach(el=>{total++;const ok=norm(el.value)===norm(el.dataset.answer);correct+=ok?1:0;el.classList.toggle('correct',ok);el.classList.toggle('wrong',el.value!==''&&!ok)});root.querySelectorAll('input[type=radio]:checked').forEach(el=>{total++;const ok=el.dataset.correct==='true';correct+=ok?1:0;el.closest('label').classList.toggle('correct',ok);el.closest('label').classList.toggle('wrong',!ok)});let fb=root.nextElementSibling?.classList.contains('inline-feedback')?root.nextElementSibling:null;if(!fb){fb=document.createElement('p');fb.className='inline-feedback';root.after(fb)}fb.textContent=total&&correct===total?`모두 맞았어요! ${correct}/${total}`:`${correct}/${total}개를 맞췄어요. 본문과 다시 비교해 보세요.`;fb.classList.toggle('good',total&&correct===total)}));

const size=12,fillers=[...'나라임금백성정치역사문화제도학문군사시대사건'];
const dirs=[[0,1],[1,0],[1,1],[1,-1]];let seed=lessonKey.length*131;const rnd=()=>((seed=(seed*9301+49297)%233280)/233280);
const cells=Array.from({length:size},()=>Array(size).fill('')),solutions=[];
d.words.forEach(word=>{const chars=[...word.replace(/\s/g,'')];let placed=false;for(let tries=0;tries<300&&!placed;tries++){const dir=dirs[Math.floor(rnd()*dirs.length)],r=Math.floor(rnd()*size),c=Math.floor(rnd()*size),endR=r+dir[0]*(chars.length-1),endC=c+dir[1]*(chars.length-1);if(endR<0||endR>=size||endC<0||endC>=size)continue;const path=chars.map((_,i)=>[r+dir[0]*i,c+dir[1]*i]);if(path.every(([rr,cc],i)=>!cells[rr][cc]||cells[rr][cc]===chars[i])){path.forEach(([rr,cc],i)=>cells[rr][cc]=chars[i]);solutions.push({word,path});placed=true}}});
cells.forEach(row=>row.forEach((v,i)=>{if(!v)row[i]=fillers[Math.floor(rnd()*fillers.length)]}));
const grid=document.getElementById('wordGrid');cells.forEach((row,r)=>row.forEach((ch,c)=>{const b=document.createElement('button');b.type='button';b.textContent=ch;b.dataset.row=r;b.dataset.col=c;grid.appendChild(b)}));
const cellAt=(r,c)=>grid.querySelector(`[data-row="${r}"][data-col="${c}"]`),key=p=>p.map(x=>x.join(',')).join('|');const paths=new Map();solutions.forEach(s=>{paths.set(key(s.path),s);paths.set(key([...s.path].reverse()),s)});let start=null,current=[];const solved=new Set(saved.solved||[]),feedback=document.getElementById('wordFeedback');
const paint=p=>{grid.querySelectorAll('.selecting').forEach(x=>x.classList.remove('selecting'));p.forEach(([r,c])=>cellAt(r,c)?.classList.add('selecting'))};const line=(a,b)=>{const dr=b[0]-a[0],dc=b[1]-a[1];if(dr&&dc&&Math.abs(dr)!==Math.abs(dc))return[];const n=Math.max(Math.abs(dr),Math.abs(dc))+1;return Array.from({length:n},(_,i)=>[a[0]+Math.sign(dr)*i,a[1]+Math.sign(dc)*i])};
function mark(s){s.path.forEach(([r,c])=>cellAt(r,c)?.classList.add('solved'));const box=document.querySelector(`[data-word="${s.word}"]`);if(box)box.checked=true}function progress(msg='낱말을 드래그해 찾아보세요.'){feedback.innerHTML=`${solved.size===solutions.length?'모두 찾았어요!':msg} <b>${solved.size} / ${solutions.length}</b>`}solutions.filter(s=>solved.has(s.word)).forEach(mark);progress();
grid.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();start=[+b.dataset.row,+b.dataset.col];current=[start];paint(current)});grid.addEventListener('pointermove',e=>{if(!start)return;const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('#wordGrid button');if(!b)return;const p=line(start,[+b.dataset.row,+b.dataset.col]);if(p.length){current=p;paint(p)}});function finish(){if(!start)return;const s=paths.get(key(current));paint([]);if(s){solved.add(s.word);mark(s);saved.solved=[...solved];localStorage.setItem(storeKey,JSON.stringify(saved));progress(`정답! ‘${s.word}’을 찾았어요.`)}else if(current.length>1){current.forEach(([r,c])=>cellAt(r,c)?.classList.add('wrong-selection'));progress('한 줄로 이어진 낱말인지 다시 살펴보세요.');setTimeout(()=>grid.querySelectorAll('.wrong-selection').forEach(x=>x.classList.remove('wrong-selection')),500)}start=null;current=[]}grid.addEventListener('pointerup',finish);window.addEventListener('pointerup',finish);
function printIt(blank){document.body.classList.toggle('print-blank',blank);setTimeout(()=>print(),50)}document.getElementById('printBlank').onclick=()=>printIt(true);document.getElementById('printFilled').onclick=()=>printIt(false);window.onafterprint=()=>document.body.classList.remove('print-blank');document.getElementById('resetAll').onclick=()=>{if(confirm('작성한 내용을 모두 지울까요?')){localStorage.removeItem(storeKey);location.reload()}};
const requestedPage=params.get('page');if(requestedPage){document.querySelectorAll('.sheet').forEach(sheet=>sheet.hidden=sheet.id!==`page-${requestedPage}`)}
