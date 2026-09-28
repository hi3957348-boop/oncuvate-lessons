/* 그림판 · 코치가 자유롭게 쓰는 칠판 (두 가지 모드, 코치가 전환)
   ① 함께 그리기: 모두의 그림이 한 판에 겹쳐 모든 화면에 보인다. 한 획을 다 그리면(손을 떼면) 공유.
   ② 각자 그리기: 자기 판에 따로 그리고 [공유하기]를 누르면, [모아보기]에서 분할 화면(이름표 칸)으로 함께 본다.
      칸을 누르면 크게 볼 수 있다.
   공유 방식(외계어 스파이와 같음): 아이는 자기 것만 자기 주제 'drawp-<ID해시>'에 올리고,
   코치 화면이 모두의 것을 모아 'draw' 주제로 알린다 → 여러 명이 동시에 그려도 덮어쓰지 않음.
   그래서 코치가 이 화면을 열어 두어야 아이 그림이 서로에게 보인다. 수업방이 없으면 혼자 그리는 판. */
(() => {
  'use strict';
  const W=1600,H=800;                    // 논리 좌표(화면 크기와 무관하게 같은 그림)
  const COLORS=['#29243a','#e0524d','#2785c7','#2f9a64','#f0a020','#8d70d7'];
  const SIZES=[{id:'s',w:5,label:'가늘게'},{id:'m',w:10,label:'보통'},{id:'l',w:22,label:'굵게'}];
  const MAX_OWN=80,MAX_PTS=240;
  const r3=v=>Math.round(v*1000)/1000;
  const clean=(v,n=20)=>String(v??'').replace(/[<>"'&]/g,'').trim().slice(0,n);
  const esc=clean;

  window.createDrawBoard=function(cfg){
    let el=null,canvas=null,ctx2=null;
    let color=COLORS[0],size=SIZES[1],eraser=false,view='draw',zoomKey=null;
    // master: 모두에게 알리는 상태
    let master={id:0,allow:true,mode:'together',strokes:[],gallery:{}};
    let mine=[];          // 함께 그리기에서 내 획
    let myPic=[];         // 각자 그리기에서 내 그림(공유 전에는 나만 봄)
    let mySharedAt=0;
    let live=null,seq=0,shareTimer=0;
    const kids={};        // 코치: 아이별 함께 그리기 획
    const subs={};
    const solo=()=>master.mode==='solo';
    // ---------- 공유 ----------
    const normStroke=s=>s&&Array.isArray(s.p)?{c:/^#[0-9a-f]{6}$/i.test(s.c)?s.c:'#29243a',w:Math.max(2,Math.min(50,Number(s.w)||10)),e:!!s.e,by:clean(s.by),k:clean(s.k,16),t:Number(s.t)||0,p:s.p.slice(0,MAX_PTS).map(q=>[r3(Number(q[0])||0),r3(Number(q[1])||0)])}:null;
    const normList=a=>(Array.isArray(a)?a:[]).slice(-MAX_OWN).map(normStroke).filter(Boolean);
    function applyMaster(v){
      if(!v||typeof v!=='object')return;
      const id=Number(v.id)||0;
      if(id!==master.id&&!cfg.isCoach){mine=[];myPic=[];mySharedAt=0}
      const gallery={};Object.entries(v.gallery&&typeof v.gallery==='object'?v.gallery:{}).forEach(([k,g])=>{if(g)gallery[clean(k,16)]={name:clean(g.name),t:Number(g.t)||0,strokes:normList(g.strokes)}});
      const prevMode=master.mode;
      master={id,allow:v.allow!==false,mode:v.mode==='solo'?'solo':'together',strokes:Array.isArray(v.strokes)?v.strokes.slice(-600).map(normStroke).filter(Boolean):[],gallery};
      if(prevMode!==master.mode){view='draw';zoomKey=null;if(el)rebuild();return}
      refresh();
    }
    function snapshot(){return{id:master.id,allow:master.allow,mode:master.mode,strokes:master.strokes,gallery:master.gallery}}
    function publishMaster(){
      clearTimeout(shareTimer);
      shareTimer=setTimeout(()=>{
        const all=[...mine,...Object.values(kids).flat()].sort((a,b)=>a.t-b.t).slice(-600);
        master={...master,strokes:all};refresh();
        if(cfg.inRoom())cfg.share('draw',snapshot());
      },120);
    }
    function publishMine(){
      if(cfg.isCoach||!cfg.inRoom()){publishMaster();return}
      cfg.share('drawp-'+cfg.myKey(),{id:master.id,seq:++seq,strokes:mine.slice(-MAX_OWN),pic:mySharedAt?{t:mySharedAt,strokes:myPic.slice(-MAX_OWN)}:null});
    }
    function shareMyPic(){
      if(!myPic.length)return flash('먼저 그림을 그려요.');
      mySharedAt=Date.now();
      if(cfg.isCoach||!cfg.inRoom()){master.gallery={...master.gallery,[cfg.myKey()]:{name:cfg.myName(),t:mySharedAt,strokes:myPic.slice(-MAX_OWN)}};publishMaster()}
      else publishMine();
      flash('공유했어요! 모아보기에서 함께 봐요.');refresh();
    }
    function watch(list){
      if(!cfg.isCoach||!Array.isArray(list))return;
      let added=false;
      list.forEach(l=>{const id=clean(l.id,60);if(!id||subs[id])return;added=true;const key=cfg.hash(id),name=clean(l.name||id);
        subs[id]=cfg.onShared('drawp-'+key,v=>{
          if(!v||Number(v.id)!==master.id)return;
          kids[id]=normList(v.strokes).map(s=>({...s,by:name,k:key}));
          const gallery={...master.gallery};
          if(v.pic&&Array.isArray(v.pic.strokes))gallery[key]={name,t:Number(v.pic.t)||Date.now(),strokes:normList(v.pic.strokes)};
          master={...master,gallery};
          publishMaster();
        })});
      if(added&&cfg.inRoom())cfg.share('draw',snapshot());   // 늦게 들어온 아이도 지금 상태를 받도록
    }
    // ---------- 그리기 ----------
    function drawStroke(c,s,sx,sy){
      if(!s.p.length)return;
      c.save();c.globalCompositeOperation=s.e?'destination-out':'source-over';
      c.strokeStyle=s.c;c.fillStyle=s.c;c.lineWidth=s.w*sx;c.lineCap='round';c.lineJoin='round';
      c.beginPath();c.moveTo(s.p[0][0]*W*sx,s.p[0][1]*H*sy);
      if(s.p.length===1){c.arc(s.p[0][0]*W*sx,s.p[0][1]*H*sy,s.w*sx/2,0,Math.PI*2);c.fill()}
      else{for(let i=1;i<s.p.length;i++)c.lineTo(s.p[i][0]*W*sx,s.p[i][1]*H*sy);c.stroke()}
      c.restore();
    }
    function paintInto(cv,strokes){
      const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
      const cw=Math.max(1,Math.round(r.width*dpr)),ch=Math.max(1,Math.round(r.height*dpr));
      if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch}
      const c=cv.getContext('2d');c.clearRect(0,0,cw,ch);
      strokes.forEach(s=>drawStroke(c,s,cw/W,ch/H));
    }
    function boardStrokes(){
      if(solo())return live?[...myPic,live]:myPic;
      const myKey=cfg.myKey();
      const shown=cfg.isCoach||!cfg.inRoom()?master.strokes:[...master.strokes.filter(s=>s.k!==myKey),...mine].sort((a,b)=>a.t-b.t);
      return live?[...shown,live]:shown;
    }
    function paint(){if(canvas&&canvas.isConnected)paintInto(canvas,boardStrokes())}
    const canDraw=()=>cfg.isCoach||master.allow;
    function pos(e){const r=canvas.getBoundingClientRect();return[r3(Math.min(1,Math.max(0,(e.clientX-r.left)/r.width))),r3(Math.min(1,Math.max(0,(e.clientY-r.top)/r.height)))]}
    function bindCanvas(){
      canvas.addEventListener('pointerdown',e=>{
        if(!canDraw()){flash('지금은 코치만 그릴 수 있어요.');return}
        e.preventDefault();try{canvas.setPointerCapture(e.pointerId)}catch(_){}
        live={c:color,w:size.w*(eraser?2.2:1),e:eraser,by:cfg.myName(),k:cfg.myKey(),t:Date.now(),p:[pos(e)]};paint();
      });
      canvas.addEventListener('pointermove',e=>{
        if(!live)return;const q=pos(e),l=live.p[live.p.length-1];
        if(Math.hypot(q[0]-l[0],(q[1]-l[1])/2)<.002)return;
        if(live.p.length<MAX_PTS)live.p.push(q);paint();
      });
      const end=()=>{
        if(!live)return;
        if(solo()){myPic.push(live);if(myPic.length>MAX_OWN)myPic=myPic.slice(-MAX_OWN);live=null;paint();refresh();return}
        mine.push(live);if(mine.length>MAX_OWN)mine=mine.slice(-MAX_OWN);live=null;paint();publishMine();
      };
      canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
    }
    let flashTimer=0;
    function flash(msg){const f=el&&el.querySelector('[data-db-msg]');if(!f)return;f.textContent=msg;f.classList.add('show');clearTimeout(flashTimer);flashTimer=setTimeout(()=>f.classList.remove('show'),1800)}
    // ---------- 화면 ----------
    const galleryList=()=>Object.entries(master.gallery).map(([k,g])=>({k,...g})).sort((a,b)=>a.t-b.t);
    function galleryHtml(){
      const list=galleryList();
      if(!list.length)return '<div class="odb-empty">아직 공유한 그림이 없어요.</div>';
      const cols=list.length<=1?1:list.length<=4?2:list.length<=9?3:4;
      if(zoomKey&&master.gallery[zoomKey]){const g=master.gallery[zoomKey];return '<div class="odb-zoom"><div class="odb-tile big"><canvas data-db-tile="'+zoomKey+'"></canvas><b>'+esc(g.name)+'</b></div><button type="button" class="odb-tool" data-db-unzoom>← 모아보기</button></div>'}
      return '<div class="odb-grid" style="--cols:'+cols+'">'+list.map(g=>'<button type="button" class="odb-tile" data-db-zoom="'+g.k+'"><canvas data-db-tile="'+g.k+'"></canvas><b>'+esc(g.name)+'</b></button>').join('')+'</div>';
    }
    function barHtml(){
      const n=galleryList().length;
      const tools='<div class="odb-colors">'+COLORS.map(c=>'<button type="button" data-db-color="'+c+'" style="--c:'+c+'" aria-label="색 '+c+'"></button>').join('')+'</div>'+
        '<div class="odb-sizes">'+SIZES.map(s=>'<button type="button" data-db-size="'+s.id+'" aria-label="'+s.label+'"><i style="width:'+(s.w+4)+'px;height:'+(s.w+4)+'px"></i></button>').join('')+'</div>'+
        '<button type="button" class="odb-tool" data-db-eraser>🧽 지우개</button>'+
        '<button type="button" class="odb-tool" data-db-undo>↶ 취소</button>';
      const soloBtns=solo()?(view==='draw'?'<button type="button" class="odb-tool odb-share" data-db-share>📤 공유하기</button>':'')+'<button type="button" class="odb-tool '+(view==='gallery'?'on':'')+'" data-db-view>'+(view==='gallery'?'✏️ 내 그림':'🖼 모아보기 '+n)+'</button>':'';
      const coach=cfg.isCoach?'<span class="odb-sep"></span><div class="odb-modes"><button type="button" data-db-mode="together" class="'+(solo()?'':'on')+'">함께 그리기</button><button type="button" data-db-mode="solo" class="'+(solo()?'on':'')+'">각자 그리기</button></div>'+(solo()?'':'<button type="button" class="odb-tool odb-allow" data-db-allow><i></i><small></small></button>')+'<button type="button" class="odb-tool" data-db-clear>🗑 전체 지우기</button><button type="button" class="odb-tool" data-db-save>💾 저장</button>':'<span class="odb-state" data-db-state></span>';
      return (view==='draw'?tools:'')+soloBtns+coach;
    }
    function html(){
      return '<div class="odb"><div class="odb-bar" data-db-bar>'+barHtml()+'</div>'+(view==='gallery'?'<div class="odb-gallery" data-db-gallery>'+galleryHtml()+'</div>':'<div class="odb-board"><canvas data-db-canvas aria-label="그림판"></canvas><div class="odb-msg" data-db-msg role="status"></div></div>')+'</div>';
    }
    function bar(){
      if(!el)return;
      el.querySelectorAll('[data-db-color]').forEach(b=>b.classList.toggle('on',!eraser&&b.dataset.dbColor===color));
      el.querySelectorAll('[data-db-size]').forEach(b=>b.classList.toggle('on',b.dataset.dbSize===size.id));
      el.querySelector('[data-db-eraser]')?.classList.toggle('on',eraser);
      const lock=el.querySelector('[data-db-allow]');if(lock){lock.classList.toggle('on',master.allow);lock.querySelector('small').textContent=master.allow?'아이도 그려요':'코치만 그려요'}
      const st=el.querySelector('[data-db-state]');if(st)st.textContent=solo()?(mySharedAt?'공유했어요 ✓':''):master.allow?'모두 함께 그려요':'🔒 지금은 코치만 그려요';
      el.querySelector('.odb-board')?.classList.toggle('locked',!canDraw());
    }
    function refresh(){
      if(!el||!el.isConnected)return;
      // 버튼 줄(개수·모드 표시)은 다시 그리고, 그림은 다시 칠한다
      const b=el.querySelector('[data-db-bar]');if(b){b.innerHTML=barHtml();bindBar()}
      if(view==='gallery'){const g=el.querySelector('[data-db-gallery]');if(g){g.innerHTML=galleryHtml();bindGallery()}}
      else paint();
      bar();
    }
    function rebuild(){el.innerHTML=html();canvas=el.querySelector('[data-db-canvas]');ctx2=canvas?canvas.getContext('2d'):null;if(canvas)bindCanvas();bindBar();if(view==='gallery')bindGallery();bar();requestAnimationFrame(()=>{paint();paintTiles()})}
    function paintTiles(){if(!el)return;el.querySelectorAll('[data-db-tile]').forEach(cv=>{const g=master.gallery[cv.dataset.dbTile];if(g)paintInto(cv,g.strokes)})}
    function bindGallery(){
      el.querySelectorAll('[data-db-zoom]').forEach(b=>b.onclick=()=>{zoomKey=b.dataset.dbZoom;refresh()});
      el.querySelector('[data-db-unzoom]')?.addEventListener('click',()=>{zoomKey=null;refresh()});
      requestAnimationFrame(paintTiles);
    }
    function bindBar(){
      el.querySelectorAll('[data-db-color]').forEach(b=>b.onclick=()=>{color=b.dataset.dbColor;eraser=false;bar()});
      el.querySelectorAll('[data-db-size]').forEach(b=>b.onclick=()=>{size=SIZES.find(s=>s.id===b.dataset.dbSize)||size;bar()});
      el.querySelector('[data-db-eraser]')?.addEventListener('click',()=>{eraser=!eraser;bar()});
      el.querySelector('[data-db-undo]')?.addEventListener('click',()=>{
        if(solo()){if(!myPic.length)return flash('취소할 획이 없어요.');myPic.pop();paint();return}
        if(!mine.length)return flash('취소할 내 획이 없어요.');mine.pop();paint();publishMine()});
      el.querySelector('[data-db-share]')?.addEventListener('click',shareMyPic);
      el.querySelector('[data-db-view]')?.addEventListener('click',()=>{view=view==='gallery'?'draw':'gallery';zoomKey=null;rebuild()});
      el.querySelectorAll('[data-db-mode]').forEach(b=>b.onclick=()=>{if(master.mode===b.dataset.dbMode)return;master={...master,mode:b.dataset.dbMode};view='draw';zoomKey=null;rebuild();if(cfg.inRoom())cfg.share('draw',snapshot())});
      el.querySelector('[data-db-allow]')?.addEventListener('click',()=>{master={...master,allow:!master.allow};bar();publishMaster()});
      el.querySelector('[data-db-clear]')?.addEventListener('click',()=>{mine=[];myPic=[];mySharedAt=0;Object.keys(kids).forEach(k=>delete kids[k]);master={id:Date.now(),allow:master.allow,mode:master.mode,strokes:[],gallery:{}};zoomKey=null;rebuild();if(cfg.inRoom())cfg.share('draw',snapshot());flash('모두의 그림을 지웠어요.')});
      el.querySelector('[data-db-save]')?.addEventListener('click',save);
    }
    function mount(host){
      el=host;rebuild();
      if(!window.__odbResize){window.__odbResize=true;addEventListener('resize',()=>{paint();paintTiles()})}
    }
    function save(){
      // 흰 바탕 PNG로 저장(코치 기기에 파일로 받음): 모아보기에서 크게 본 그림 → 그 그림, 아니면 지금 판
      const strokes=view==='gallery'&&zoomKey&&master.gallery[zoomKey]?master.gallery[zoomKey].strokes:boardStrokes();
      const out=document.createElement('canvas');out.width=W;out.height=H;const c=out.getContext('2d');
      const layer=document.createElement('canvas');layer.width=W;layer.height=H;const lc=layer.getContext('2d');
      strokes.forEach(s=>drawStroke(lc,s,1,1));
      c.fillStyle='#fff';c.fillRect(0,0,W,H);c.drawImage(layer,0,0);
      const a=document.createElement('a');a.href=out.toDataURL('image/png');a.download='그림판-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.png';a.click();
    }
    function start(){
      if(cfg.isCoach&&!master.id){master.id=Date.now();if(cfg.inRoom())cfg.share('draw',snapshot())}
      if(!cfg.inRoom()&&!master.id)master.id=1;
    }
    return{mount,start,applyMaster,watch,getState:()=>({mode:master.mode,strokes:master.strokes.length,gallery:Object.keys(master.gallery).length,mine:mine.length,myPic:myPic.length,allow:master.allow,view})};
  };
})();
