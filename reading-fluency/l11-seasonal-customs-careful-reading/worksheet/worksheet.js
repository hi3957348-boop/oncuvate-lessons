/* Shared web worksheet behaviour: save answers locally, print, and run light self-checks. */
(() => {
  const key = `oncuvate-workbook:${document.body.dataset.workbook || location.pathname}`;
  const fields = [...document.querySelectorAll('input, textarea')];
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  fields.forEach((el, i) => {
    const id = el.name || el.id || `field-${i}`;
    if (saved[id] !== undefined) {
      if (el.type === 'radio' || el.type === 'checkbox') el.checked = saved[id] === el.value || saved[id] === true;
      else el.value = saved[id];
    }
    el.addEventListener('input', save);
    el.addEventListener('change', save);
    if (el.type !== 'radio' && el.type !== 'checkbox') {
      const printValue = document.createElement('span');
      printValue.className = 'print-value';
      printValue.setAttribute('aria-hidden', 'true');
      printValue.textContent = el.value || ' ';
      el.insertAdjacentElement('afterend', printValue);
      el.addEventListener('input', () => { printValue.textContent = el.value || ' '; });
    }
  });
  function save() {
    const data = {};
    fields.forEach((el, i) => {
      const id = el.name || el.id || `field-${i}`;
      if (el.type === 'radio') { if (el.checked) data[id] = el.value; }
      else if (el.type === 'checkbox') data[id] = el.checked;
      else data[id] = el.value;
    });
    localStorage.setItem(key, JSON.stringify(data));
  }

  document.querySelectorAll('[data-passage]').forEach(p => {
    const text = p.textContent.trim();
    const parts = text.split(/\s+/);
    p.textContent = '';
    parts.forEach((part, i) => {
      p.append(document.createTextNode(part));
      if (i < parts.length - 1) {
        const cut = document.createElement('button');
        cut.type = 'button'; cut.className = 'cut'; cut.textContent = '·'; cut.setAttribute('aria-pressed', 'false');
        cut.addEventListener('click', () => { const on = cut.getAttribute('aria-pressed') !== 'true'; cut.setAttribute('aria-pressed', String(on)); cut.textContent = on ? '/' : '·'; });
        p.append(cut);
      }
    });
  });

  document.querySelectorAll('[data-check="fill"]').forEach(btn => btn.addEventListener('click', () => {
    const box = btn.closest('.question'); let ok = true;
    box.querySelectorAll('[data-answer]').forEach(el => { const answers = el.dataset.answer.split('|'); const hit = answers.includes(el.value.trim()); el.style.borderColor = hit ? '#2d8a70' : '#ba6a39'; ok = ok && hit; });
    const out = box.querySelector('.feedback'); out.className = `feedback ${ok ? 'good' : ''}`; out.textContent = ok ? '좋아요. 본문의 핵심 말이 모두 맞아요.' : '보기와 본문을 다시 살펴보세요.';
  }));

  document.querySelectorAll('[data-check="repair"]').forEach(btn => btn.addEventListener('click', () => {
    const box = btn.closest('.question'); const name = box.dataset.name; const picked = box.querySelector(`input[name="${name}"]:checked`); const fix = box.querySelector('[data-fix]');
    const rightPick = picked && picked.value === box.dataset.wrong; const rightFix = fix.dataset.fix.split('|').includes(fix.value.trim()); const ok = rightPick && rightFix;
    const out = box.querySelector('.feedback'); out.className = `feedback ${ok ? 'good' : ''}`; out.textContent = ok ? '정확해요. 고친 말을 넣어 문장 전체를 다시 읽어 보세요.' : '본문과 비교해 다른 말을 찾고, 바른 말을 써 보세요.';
  }));

  document.querySelectorAll('[data-check="sequence"]').forEach(btn => btn.addEventListener('click', () => {
    const box = btn.closest('.question'); let ok = true;
    box.querySelectorAll('[data-seq]').forEach(el => { const hit = el.value.trim() === el.dataset.seq; el.style.borderColor = hit ? '#2d8a70' : '#ba6a39'; ok = ok && hit; });
    const out = box.querySelector('.feedback'); out.className = `feedback ${ok ? 'good' : ''}`; out.textContent = ok ? '순서가 정확해요. 각 단계가 다음 단계와 어떻게 이어지는지 말해 보세요.' : '본문의 과정이 나온 차례를 다시 확인해 보세요.';
  }));

  document.querySelectorAll('[data-example]').forEach(btn => btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.example); target.hidden = !target.hidden; btn.setAttribute('aria-expanded', String(!target.hidden));
  }));

  const ws = window.WORDSEARCH;
  if (ws) {
    const board = document.getElementById('wsBoard');
    ws.grid.forEach((ch, i) => { const b=document.createElement('button'); b.type='button'; b.className='ws-cell'; b.textContent=ch; b.dataset.cell=i; b.setAttribute('aria-label', `${Math.floor(i/8)+1}행 ${i%8+1}열 ${ch}`); board.append(b); });
    let start=null; const found=new Set(); const cells=[...board.children];
    const path=(a,b)=>{ const ar=Math.floor(a/8), ac=a%8, br=Math.floor(b/8), bc=b%8; if(ar===br) return Array.from({length:Math.abs(b-a)+1},(_,k)=>Math.min(a,b)+k); if(ac===bc) return Array.from({length:Math.abs(br-ar)+1},(_,k)=>(Math.min(ar,br)+k)*8+ac); return []; };
    cells.forEach(c=>c.addEventListener('click',()=>{ const i=+c.dataset.cell; if(start===null){ start=i; c.classList.add('selected'); return; } const p=path(start,i); cells[start].classList.remove('selected'); start=null; const word=p.map(n=>ws.grid[n]).join(''); const rev=[...word].reverse().join(''); const ix=ws.words.findIndex((w,n)=>!found.has(n)&&(w===word||w===rev)); if(ix<0){ document.getElementById('wsStatus').textContent='가로나 세로로 이어진 낱말인지 다시 살펴보세요.'; return; } found.add(ix); p.forEach(n=>cells[n].classList.add('found')); document.querySelector(`[data-word="${ix}"]`).classList.add('found'); document.querySelector(`[data-word="${ix}"] .ws-answer`).textContent=ws.words[ix]; document.getElementById('wsCount').textContent=`${found.size} / ${ws.words.length}`; document.getElementById('wsStatus').textContent=found.size===ws.words.length?'여덟 낱말을 모두 찾았어요!':'다음 설명의 낱말도 찾아보세요.'; }));
  }

  document.getElementById('printBlank')?.addEventListener('click',()=>{document.body.classList.add('print-blank'); window.print(); setTimeout(()=>document.body.classList.remove('print-blank'),300);});
  document.getElementById('printAnswers')?.addEventListener('click',()=>window.print());
  document.getElementById('reset')?.addEventListener('click',()=>{if(confirm('입력한 답과 표시를 모두 지울까요?')){localStorage.removeItem(key); location.reload();}});
})();
