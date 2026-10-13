(()=>{
  const audio=document.getElementById('listenAudio');
  const marks=window.LISTEN_MARKS||[];
  const segs=[...document.querySelectorAll('[data-seg]')];
  const play=document.getElementById('listenPlay'),restart=document.getElementById('listenRestart');
  const bar=document.getElementById('listenBar'),time=document.getElementById('listenTime');
  if(!audio||!play)return;
  const fmt=s=>{s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  const total=()=>isFinite(audio.duration)&&audio.duration?audio.duration:(marks.length?marks[marks.length-1][1]:0);
  let current=-1;
  const mark=i=>{
    if(i===current)return;current=i;
    segs.forEach(el=>el.classList.toggle('is-reading',Number(el.dataset.seg)===i));
    const el=segs.find(x=>Number(x.dataset.seg)===i);
    if(el&&!audio.paused){const r=el.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-20)el.scrollIntoView({block:'center',behavior:'smooth'})}
  };
  const sync=()=>{
    const t=audio.currentTime;let i=-1;
    marks.forEach(([a,b],k)=>{if(t>=a-0.05&&t<b+0.3)i=k});
    mark(audio.paused&&t===0?-1:i);
    bar.style.width=(total()?t/total()*100:0)+'%';
    time.textContent=fmt(t)+' / '+fmt(total());
  };
  const setBtn=()=>{play.textContent=audio.paused?'▶ 본문 듣기':'❚❚ 잠깐 멈춤';play.classList.toggle('is-playing',!audio.paused)};
  play.addEventListener('click',()=>{if(audio.paused){audio.play().catch(()=>{})}else audio.pause()});
  restart.addEventListener('click',()=>{audio.currentTime=0;audio.play().catch(()=>{})});
  segs.forEach(el=>el.addEventListener('click',e=>{
    if(e.target.closest('input,button,a'))return;
    const m=marks[Number(el.dataset.seg)];if(!m)return;audio.currentTime=m[0];audio.play().catch(()=>{});
  }));
  document.getElementById('listenTrack').addEventListener('click',e=>{
    const r=e.currentTarget.getBoundingClientRect();audio.currentTime=(e.clientX-r.left)/r.width*total();
  });
  ['play','pause'].forEach(ev=>audio.addEventListener(ev,()=>{setBtn();sync()}));
  audio.addEventListener('ended',()=>{audio.currentTime=0;setBtn();mark(-1)});
  audio.addEventListener('timeupdate',sync);audio.addEventListener('loadedmetadata',sync);
  setBtn();sync();
})();
