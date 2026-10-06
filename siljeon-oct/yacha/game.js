/* 안전 지킴이 훈련(1쪽 숨은 숫자 찾기 · 4쪽 젤리 길) — worksheet.js 뒤에 읽는다(saved·STORE·solvedWords 사용). */
(()=>{
  const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(saved))}catch(e){}};
  /* 배지: 그림 파일이 아직 없으면 글자 배지로 보인다 */
  const whenImage=(img,ok,bad)=>{if(img.complete){img.naturalWidth?ok():bad()}else{img.addEventListener('load',ok);img.addEventListener('error',bad)}};
  document.querySelectorAll('.ef-badge img').forEach(img=>whenImage(img,()=>img.closest('.ef-badge').classList.add('has-img'),()=>img.remove()));
  /* 비교 그림: 아직 없으면 자리째 숨긴다 */
  document.querySelectorAll('.cmp-pics img').forEach(img=>whenImage(img,()=>{},()=>{const box=img.closest('.cmp-pics');img.closest('figure').remove();if(box&&!box.querySelector('figure'))box.remove()}));
  /* 배지판: 배지를 받으면 위쪽 막대에도 별이 켜진다 */
  const boardSync=()=>document.querySelectorAll('[data-board]').forEach(a=>{const b=document.getElementById(a.dataset.board);a.classList.toggle('won',Boolean(b&&b.classList.contains('won')))});
  const win=(badge)=>{if(badge&&!badge.classList.contains('won')){badge.classList.add('won')}boardSync()};

  /* ---------- 1쪽 숨은 숫자 찾기 ---------- */
  const article=document.querySelector('#page-1 .news-article p:not(.source)');
  const missions=[...document.querySelectorAll('.num-mission')];
  const msg=document.getElementById('numHuntMsg'),badge1=document.getElementById('badgeDetective');
  if(article&&missions.length){
    const re=/\d+(?:\.\d+)?(?:건|%|학년도|월|년)/g;
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const text=node.nodeValue;if(!re.test(text))return;re.lastIndex=0;
      const frag=document.createDocumentFragment();let last=0,m;
      while((m=re.exec(text))){frag.append(text.slice(last,m.index));const s=document.createElement('span');s.className='num-pick';s.textContent=m[0];s.dataset.num=m[0];frag.append(s);last=m.index+m[0].length}
      frag.append(text.slice(last));node.replaceWith(frag);
    });
    const found=new Set(Array.isArray(saved.numFound)?saved.numFound:[]);
    const paint=()=>{
      missions.forEach(card=>{const ok=found.has(card.dataset.answer);card.classList.toggle('found',ok);card.querySelector('strong').textContent=ok?card.dataset.answer:''});
      document.querySelectorAll('.num-pick').forEach(s=>s.classList.toggle('found',found.has(s.dataset.num)));
      if(found.size===missions.length){win(badge1);if(msg){msg.className='num-hunt-msg good';msg.textContent='숫자 4개를 모두 찾았어요! 「기사 탐정」 배지를 받았어요.'}}
    };
    article.addEventListener('click',e=>{
      const s=e.target.closest('.num-pick');if(!s)return;e.stopPropagation();
      const card=missions.find(c=>c.dataset.answer===s.dataset.num);
      if(card){const fresh=!found.has(s.dataset.num);found.add(s.dataset.num);saved.numFound=[...found];save();paint();
        if(fresh&&found.size<missions.length&&msg){msg.className='num-hunt-msg good';msg.textContent='찾았어요! ‘'+card.dataset.label+'’ → '+s.dataset.num+' ('+found.size+' / '+missions.length+')'}}
      else{s.classList.remove('nope');void s.offsetWidth;s.classList.add('nope');setTimeout(()=>s.classList.remove('nope'),900);if(msg){msg.className='num-hunt-msg bad';msg.textContent='‘'+s.dataset.num+'’'+(/[%도]$/.test(s.dataset.num)?'는':'은')+' 다른 내용의 숫자예요. 카드를 다시 읽어 봐요.'}}
    },true);
    paint();
  }

  /* ---------- 4쪽 젤리 길 ---------- */
  const track=document.getElementById('jellyTrack'),walkerImg=document.getElementById('jellyWalker'),badge4=document.getElementById('badgeShield');
  if(track&&walkerImg&&typeof solvedWords!=='undefined'){
    const cells=[...track.querySelectorAll('i')];let last=-1;
    const move=()=>{
      const n=Math.min(cells.length,solvedWords.size);
      cells.forEach((c,i)=>c.classList.toggle('on',i<n));
      const target=n===0?null:cells[n-1];
      walkerImg.style.left=target?(target.offsetLeft+target.offsetWidth/2)+'px':'0px';
      if(n!==last){if(last>=0){walkerImg.classList.remove('hop');void walkerImg.offsetWidth;walkerImg.classList.add('hop')}last=n}
      walkerImg.src='public/jelly/jelly-'+(n>=cells.length?'praise':n>0?'default':'guide')+'.webp';
      if(n>=cells.length)win(badge4);
    };
    const fb=document.getElementById('wordFeedback');
    if(fb)new MutationObserver(move).observe(fb,{childList:true,subtree:true,characterData:true});
    addEventListener('resize',move);move();
  }

  /* ---------- 2쪽 열쇠 금고: 빈칸 문장 하나를 다 맞히면 열쇠 조각 하나 ---------- */
  const vault=document.getElementById('keyVault'),badge2=document.getElementById('badgeKey');
  if(vault){
    const pieces=[...vault.querySelectorAll('.key-piece')],items=[...document.querySelectorAll('.fill-list > li')];
    let got=new Set(Array.isArray(saved.keyPieces)?saved.keyPieces:[]);
    const paintKeys=()=>{
      pieces.forEach((k,i)=>k.classList.toggle('on',got.has(i)));
      const open=got.size>=pieces.length;vault.classList.toggle('open',open);
      vault.querySelector('.vault-door').textContent=open?'🔓':'🔒';
      document.getElementById('vaultSecret').innerHTML='숨은 말: <em>'+(open?'싫으면 싫다고 말해도 돼!':'__________')+'</em>';
      if(open)win(badge2);
    };
    const btn=document.querySelector('[data-check-group="fill-list"]');
    if(btn)btn.addEventListener('click',()=>{
      items.forEach((li,i)=>{const ins=[...li.querySelectorAll('input[data-answer]')];if(ins.length&&ins.every(x=>x.classList.contains('correct')))got.add(i)});
      saved.keyPieces=[...got];save();paintKeys();
    });
    paintKeys();
  }

  /* ---------- 3쪽 신호등 O X: 네 문제를 모두 맞히면 판정 심판 배지 ---------- */
  const oxBtn=document.getElementById('oxLightButton'),badge3=document.getElementById('badgeReferee');
  if(oxBtn){
    oxBtn.addEventListener('click',()=>{
      const rows=[...document.querySelectorAll('.ox-grid > div')];
      const all=rows.every(r=>{const c=r.querySelector('input:checked');return c&&c.dataset.correct==='true'});
      if(all){saved.refereeWon=true;save();win(badge3)}
    });
    if(saved.refereeWon)win(badge3);
  }
  boardSync();
})();
