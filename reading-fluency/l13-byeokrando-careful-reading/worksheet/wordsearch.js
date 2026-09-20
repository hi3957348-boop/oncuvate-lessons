'use strict';
(()=>{
const words=[{"word":"벽란도","r":0,"c":1,"dr":0,"dc":1,"clue":"여러 나라 상인이 모여 물건을 사고팔던 고려의 항구."},{"word":"상인","r":2,"c":0,"dr":1,"dc":0,"clue":"물건을 사고파는 일을 하는 사람."},{"word":"수출","r":2,"c":3,"dr":0,"dc":1,"clue":"우리나라 물건을 다른 나라에 파는 일."},{"word":"수입","r":4,"c":5,"dr":1,"dc":0,"clue":"다른 나라의 물건을 사들여오는 일."},{"word":"교류","r":1,"c":6,"dr":1,"dc":0,"clue":"사람이나 물건, 지식이 서로 오가는 일."},{"word":"서적","r":5,"c":1,"dr":0,"dc":1,"clue":"송에서 들여온 물건으로, 글이나 지식을 담은 책."},{"word":"개경","r":6,"c":4,"dr":1,"dc":0,"clue":"벽란도와 가까웠던 고려의 수도."},{"word":"인삼","r":7,"c":6,"dr":0,"dc":1,"clue":"고려가 수출한 약초로, 종이와 함께 품질이 좋기로 이름난 물건."}];
const cells=[...document.querySelectorAll('.ws-cell')],message=document.querySelector('#wsStatus'),cancel=document.querySelector('#wsCancel');
let start=null;
state.wordSearch=Array.isArray(state.wordSearch)?state.wordSearch.filter(i=>Number.isInteger(i)&&i>=0&&i<words.length):[];
state.wordSearch=[...new Set(state.wordSearch)];
function indices(w){return [...w.word].map((_,k)=>(w.r+k*w.dr)*8+w.c+k*w.dc);}
function draw(){
 const found=new Set(state.wordSearch.flatMap(i=>indices(words[i])));
 cells.forEach((b,i)=>{b.classList.toggle('found',found.has(i));b.classList.toggle('selected',i===start);b.setAttribute('aria-pressed',String(i===start||found.has(i)));});
 words.forEach((w,i)=>{const clue=document.querySelector('.ws-clue[data-word="'+i+'"]'),done=state.wordSearch.includes(i);clue.classList.toggle('found',done);clue.querySelector('.ws-answer').textContent=done?w.word:'□'.repeat(w.word.length);});
 document.querySelector('#wsCount').textContent=state.wordSearch.length+' / '+words.length;
 cancel.hidden=start===null;
}
function clear(){start=null;draw();message.textContent='낱말의 첫 글자를 누른 뒤, 마지막 글자를 누르세요.';}
cells.forEach((b,i)=>b.addEventListener('click',()=>{
 if(start===null){start=i;message.textContent='이제 낱말의 마지막 글자를 누르세요.';draw();return;}
 const from=start;start=null;
 const match=words.findIndex(w=>{const a=indices(w);return (a[0]===from&&a.at(-1)===i)||(a[0]===i&&a.at(-1)===from);});
 if(match<0){message.textContent='설명을 다시 읽고, 가로나 세로로 이어진 낱말을 찾아보세요.';}
 else if(state.wordSearch.includes(match)){message.textContent='이미 찾은 낱말이에요. 다른 설명을 살펴보세요.';}
 else{state.wordSearch.push(match);save();message.textContent=state.wordSearch.length===words.length?'8개를 모두 찾았어요! 설명과 낱말을 한 번 더 짝지어 읽어 보세요.':(match+1)+'번 설명의 낱말, ‘'+words[match].word+'’을 찾았어요.';}
 draw();
}));
cancel.addEventListener('click',clear);
document.querySelector('.ws-board').addEventListener('keydown',e=>{if(e.key==='Escape')clear();});
draw();
})();
const reasonAnswer=document.querySelector('#reasonAnswer'),reasonExample=document.querySelector('#reasonExample'),reasonToggle=document.querySelector('#reasonExampleToggle');
reasonToggle.addEventListener('click',()=>{reasonExample.hidden=!reasonExample.hidden;reasonToggle.setAttribute('aria-expanded',String(!reasonExample.hidden));reasonToggle.textContent=reasonExample.hidden?'쓴 답과 예시 비교하기':'예시 접기';reasonExample.textContent=reasonAnswer.value.trim()?'예시: 강물이 깊어 큰 배가 드나들기 좋았기 때문입니다. 내 답에 강물의 깊이가 담겼는지 비교해 보세요.':'먼저 기억을 떠올려 이유를 써 보세요. 쓴 뒤에 예시와 비교할 수 있어요.';});
reasonAnswer.addEventListener('input',()=>{reasonExample.hidden=true;reasonToggle.setAttribute('aria-expanded','false');reasonToggle.textContent='쓴 답과 예시 비교하기';});
