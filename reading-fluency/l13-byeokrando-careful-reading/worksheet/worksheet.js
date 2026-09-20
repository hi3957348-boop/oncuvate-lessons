'use strict';
const KEY='oncuvate-byeokrando-workbook-v3';
const status=document.querySelector('#saveStatus');
let state={fields:{},cuts:[]};
try{state=JSON.parse(localStorage.getItem(KEY))||state;}catch(e){status.textContent='이 브라우저에서는 저장할 수 없어요. 답을 포함해 인쇄해 주세요.';}
document.querySelectorAll('[data-passage]').forEach(p=>{
 const words=p.textContent.split(' ');p.textContent='';
 words.forEach((word,i)=>{p.append(document.createTextNode(word));if(i<words.length-1){const b=document.createElement('button');const id=p.dataset.passage+'-'+i;b.className='cut';b.type='button';b.dataset.cut=id;b.setAttribute('aria-label',word+' 뒤 끊어 읽기 표시');b.setAttribute('aria-pressed',String(state.cuts?.includes(id)||false));b.textContent=b.getAttribute('aria-pressed')==='true'?'/':'·';b.onclick=()=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));b.textContent=on?'/':'·';save();};p.append(b);}});
});
const fields=[...document.querySelectorAll('input[name],textarea[name]')];
fields.forEach(el=>{
 const v=state.fields?.[el.name];
 if(el.type==='radio'||el.type==='checkbox')el.checked=Array.isArray(v)&&v.includes(el.value);
 else{el.value=typeof v==='string'?v:'';const mirror=document.createElement('span');mirror.className='print-value';mirror.setAttribute('aria-hidden','true');el.after(mirror);}
 el.addEventListener('input',()=>{const q=el.closest('[data-q]');if(q){q.classList.remove('done');const f=q.querySelector('.feedback');if(f)f.textContent='';}if(el.name==='understand'){document.querySelector('#example').hidden=true;document.querySelector('#exampleToggle').setAttribute('aria-expanded','false');}save();});
});
function mirrors(){document.querySelectorAll('.trade-item').forEach(row=>{const selected=row.querySelector('input[type=radio]:checked');row.querySelector('.ox-print b').textContent=selected?(selected.value==='o'?'○':'×'):'';});fields.forEach(el=>{if(el.nextElementSibling?.classList.contains('print-value'))el.nextElementSibling.textContent=el.value;});}
function save(){const data={fields:{},cuts:[...document.querySelectorAll('.cut[aria-pressed=true]')].map(b=>b.dataset.cut)};fields.forEach(el=>{if(el.type==='radio'||el.type==='checkbox'){data.fields[el.name]??=[];if(el.checked)data.fields[el.name].push(el.value);}else data.fields[el.name]=el.value;});mirrors();try{localStorage.setItem(KEY,JSON.stringify(data));status.textContent='답과 끊어 읽기 표시를 이 브라우저에 저장했어요.';}catch(e){status.textContent='저장되지 않았어요. 내 답 포함 인쇄로 보관해 주세요.';}}
mirrors();
const val=name=>document.querySelector('[name="'+name+'"]')?.value.trim()||'';
const radio=name=>document.querySelector('[name="'+name+'"]:checked')?.value;
const norm=s=>s.replace(/[\\s.,!?。]/g,'');
const checks={
 fill:()=>[['river','예성강'],['capital','개경'],['export','수출'],['import','수입'],['knowledge','지식']].every(([n,a])=>norm(val(n))===a),
 particle:()=>radio('particle')==='0'&&norm(val('particle-fix'))==='송에서',
 ending:()=>radio('ending')==='0'&&['깊어서','깊으므로','깊기때문에'].includes(norm(val('ending-fix'))),
 word:()=>radio('word')==='1'&&norm(val('word-fix'))==='수입',
 reason:()=>radio('reason')==='0',merchants:()=>radio('merchants')==='1',material:()=>radio('material')==='0',
 goods:()=>[...document.querySelectorAll('[name=goods]:checked')].map(e=>e.value).sort().join(',')==='1,3'
};
const hints={
 fill:'1쪽에서 빈칸 앞뒤의 말과 같은 부분을 찾아보세요. ‘송에’와 ‘송에서’도 함께 읽어요.',
 particle:'비단이 어디에서 고려로 오는지 생각해 보세요. ‘송’ 뒤에 붙은 말을 살펴요.',
 ending:'강물이 깊은 것은 배가 드나들기 좋은 이유예요. ‘하지만’의 뜻 대신 이유가 이어지도록 고쳐 보세요.',
 word:'고려가 송에서 사들여온 물건이에요. 수출과 수입의 방향을 다시 비교해 보세요.',
 reason:'1쪽 가 문단에서 ‘큰 배’ 앞에 나온 말을 찾아보세요.',
 merchants:'1쪽 나 문단의 첫 문장을 끝까지 읽어 보세요. ‘뿐 아니라’ 뒤에 누가 나오나요?',
 material:'1쪽 다 문단에서 꾸미는 재료와 완성된 물건을 구별해 보세요.',
 goods:'고려로 들어온 물건을 모두 골랐나요? 나 문단의 ‘수입했습니다’ 앞을 확인해 보세요.'
};
document.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{const k=b.dataset.check,q=b.closest('[data-q]'),f=q.querySelector('.feedback'),ok=checks[k]();f.textContent=ok?'잘 확인했어요. 본문의 뜻과 맞아요.':hints[k];f.className='feedback '+(ok?'good':'');q.classList.toggle('done',ok);});
document.querySelector('#exampleToggle').onclick=()=>{const e=document.querySelector('#example'),b=document.querySelector('#exampleToggle');e.hidden=!e.hidden;b.setAttribute('aria-expanded',String(!e.hidden));b.textContent=e.hidden?'쓴 답과 예시 비교하기':'예시 접기';if(!val('understand')&&!e.hidden)e.textContent='먼저 한 문장으로 써 보세요. 쓴 뒤에 이 버튼을 다시 눌러 예시와 비교할 수 있어요.';else e.textContent='예시: 들어온 책을 통해 다른 나라의 지식도 배웠다는 뜻입니다. ‘지식도 배웠다’는 뜻이 담겼는지 내 답과 비교해 보세요.';};
function print(blank){mirrors();document.body.classList.toggle('print-blank',blank);window.print();}
document.querySelector('#printBlank').onclick=()=>print(true);
document.querySelector('#printAnswers').onclick=()=>print(false);
window.addEventListener('afterprint',()=>document.body.classList.remove('print-blank'));
document.querySelector('#reset').onclick=()=>{if(confirm('이 브라우저에 저장한 이름, 답, 끊어 읽기 표시를 모두 지울까요?')){try{localStorage.removeItem(KEY);}catch(e){}location.reload();}};

checks.trade=()=>{const list=[['인삼','x'],['비단','o'],['종이','x'],['약재','o'],['나전칠기','x'],['책','o']];let ok=true;list.forEach(([a,t],i)=>{const n=i+1,v=norm(val('item-'+n));const nameOK=v===a||(a==='책'&&v==='서적')||(a==='나전칠기'&&v==='나전칠기상자');const typeOK=radio('ox-'+n)===t;const row=document.querySelector('[name="item-'+n+'"]').closest('.trade-item');row.classList.toggle('needs-check',!nameOK||!typeOK);row.querySelector('.item-feedback').textContent=nameOK&&typeOK?'확인했어요.':!nameOK?'이름을 다시 살펴요.':'들어오나요, 나가나요?';if(!nameOK||!typeOK)ok=false;});return ok;};hints.trade='표시된 칸만 다시 살펴보세요. 본문의 ‘수출했습니다’와 ‘수입했습니다’를 기준으로 확인해요.';

