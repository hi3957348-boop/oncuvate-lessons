/* OGKR 이중자 1회차 · ch (j와 비교) + CVC a·i 복습
   - 6회차 소리 공방(session06-sample.js)의 틀·CSS·클래스 구조를 그대로 씁니다.
   - 그림은 만들지 않았습니다. 들어갈 자리는 .s6x-slot(점선 칸)과 IMG 번호로 비워 두었습니다.
   - 녹음이 없는 소리·낱말은 브라우저 임시 영어 음성으로 재생합니다. */
(() => {
  'use strict';
  const S=window.OGD_SESSION;   // 회차 데이터(낱말·문구) — sessionNN-data.js
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const units=window.OGSoundRadar.units;

  /* ================= 그림 ================= */
  const WORD_CARD_DIR='word-cards-3d-v1/';
  const FILES=Object.fromEntries(S.FILES.map(word=>[word,WORD_CARD_DIR+word+'.png']));
  const NEED=S.NEED,INTRO_ART=S.INTRO_ART||{};
  const slot=(code,label,extra='')=>INTRO_ART[code]
    ?'<img class="s6x-illustration '+extra+'" src="assets/images/'+S.artDir+'/'+INTRO_ART[code]+'" alt="'+esc(label)+'" draggable="false">'
    :'<span class="s6x-slot '+extra+'" data-img-slot="'+code+'"><em>'+code+'</em><b>'+label+'</b></span>';
  // 회차 그림(ART: 낱말 → assets/images 아래 경로)이 있으면 그걸 먼저
  const art=word=>S.ART&&S.ART[word]?'<img class="s6-vocab-art" src="assets/images/'+S.ART[word]+'" alt="" draggable="false">':FILES[word]?'<img class="s6-vocab-art" src="assets/images/'+FILES[word]+'" alt="" draggable="false">':NEED[word]?slot(NEED[word][0],NEED[word][1]):slot('IMG-?',word);
  const VOWELS=/[aeiou]/;
  // 모음은 빨강, 이중자(ch)는 한 덩어리로 묶어 표시
  const redVowel=w=>'<span class="s6x-w">'+units(String(w)).map(u=>u.length>1?'<span class="ogd-dg">'+u+'</span>':VOWELS.test(u)?'<span class="s6x-v">'+u+'</span>':u).join('')+'</span>';
  const cap=l=>l[0].toUpperCase()+l.slice(1);
  const pair=(l,extra='')=>'<span class="s6-phoneme-pair '+extra+'" aria-hidden="true"><b>'+cap(l)+'</b><b>'+l+'</b></span>';

  /* ================= 소리 ================= */
  const WORDS=new Set(['bad','bag','bat','bed','box','can','cat','cup','dig','dog','fan','fox','hat','hop','nap','pan','pen','pig','six','van','zip']);
  let clip=null;
  function stopAudio(){try{clip?.pause();clip=null;speechSynthesis?.cancel()}catch(e){}}
  function tts(text,rate=.72){if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=rate;speechSynthesis.speak(u)}
  // 음가 녹음이 없는 소리의 임시 읽기(나중에 음가 녹음으로 교체)
  const phonemeFallback={b:'buh',c:'kuh',d:'duh',f:'fff',g:'guh',h:'hhh',j:'juh',k:'kuh',l:'lll',m:'mmm',n:'nnn',p:'puh',r:'rrr',s:'sss',t:'tuh',v:'vvv',w:'wuh',x:'ks',y:'yuh',z:'zzz',ch:'chuh',a:'a',e:'eh',i:'ih',o:'ah',u:'uh'};
  const PHONEME_FILES={p:'drill_p',s:'drill_s',t:'drill_t',a:'vowel_short_a'};
  function speak(text,kind='word'){
    stopAudio();window.S6Help?.hold(1900);let t=String(text).toLowerCase();let file='';
    if(kind==='rime'&&phonemeFallback[t])kind='phoneme';
    if(kind==='letter'){tts(t.toUpperCase(),.8);return}
    // 제니 음성 파일(og-audio-index.js의 OG_AUDIO)이 있으면 먼저 씀: 음소·라임·낱말·문장 순서로 찾음
    const A=window.OG_AUDIO,find=(...ks)=>{for(const k of ks){const f=A&&A[k]&&A[k][t];if(f)return 'assets/audio/jenny/'+f}return ''};
    if(A){file=kind==='phoneme'?find('p','r'):kind==='rime'?find('r','p','w'):kind==='sentence'?find('s','w'):find('w','r','p','s')}
    if(!file&&kind==='phoneme'&&PHONEME_FILES[t])file='assets/audio/phonemes/'+PHONEME_FILES[t]+'.mp3';
    else if(!file&&kind==='word'&&WORDS.has(t))file='assets/audio/words/'+t+'.mp3';
    const fallback=kind==='phoneme'?(phonemeFallback[t]||t):t;
    const rate=kind==='phoneme'?.58:.72;
    if(!file){tts(fallback,rate);return}
    const a=new Audio(file);clip=a;a.addEventListener('error',()=>tts(fallback,rate),{once:true});a.play().catch(()=>tts(fallback,rate));
  }
  let successContext=null;
  function playSuccessTone(){
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
      successContext=successContext||new AudioCtx();
      if(successContext.state==='suspended')successContext.resume();
      const now=successContext.currentTime;
      [[659.25,0,.14],[783.99,.11,.25]].forEach(([frequency,delay,end])=>{
        const oscillator=successContext.createOscillator(),gain=successContext.createGain();
        oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,now+delay);
        gain.gain.setValueAtTime(.0001,now+delay);gain.gain.exponentialRampToValueAtTime(.16,now+delay+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+end);
        oscillator.connect(gain);gain.connect(successContext.destination);oscillator.start(now+delay);oscillator.stop(now+end+.02);
      });
    }catch(e){}
  }

  /* ================= 데이터 (회차 파일 sessionNN-data.js) ================= */
  const {BINGO_POOL,BUILD_WORDS,BUILD_BANKS,consonants,firstSound,TAP_WORDS,LAB_TARGETS,LAB_GRID,PIC,SPY_ALIEN,SPY_REAL,SPELL:TCH,JUMP_WEIGHT,sentences}=S;
  const BINGO_FONTS=['Tahoma','"GeekbleMalrangiche"','"SinchonRhapsody"','"Comic Sans MS"','Verdana','Georgia','"Trebuchet MS"'];
  const BINGO_COLORS=[['#fff1f3','#e8637a'],['#effcff','#2785c7'],['#f3effd','#6542c4'],['#fff7e6','#d9822b'],['#ecfaf2','#2f9a64'],['#fffbe0','#b58a00'],['#fdefff','#b03fae']];
  const BINGO_LINES=[[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],[0,6,12,18,24],[4,8,12,16,20]];
  const SPY_GOAL=SPY_ALIEN.length;
  const JUMP_WORDS=Object.entries(JUMP_WEIGHT).flatMap(([n,ws])=>ws.flatMap(w=>Array(Number(n)).fill(w)));
  const TARGET=S.target;                                   // 이 회차 목표 이중자(팝업·문장·점핑워드에서 강조)
  const markTarget=(w,cls)=>esc(w).replace(new RegExp(TARGET,'gi'),m=>'<span class="'+cls+'">'+m+'</span>');

  /* ================= 페이지 ================= */
  function isCoachEarly(){return window.ONQ_ROLE?.isCoach===true}
  const pages=[
    {id:'bingo',view:'bingo',nav:'룰렛 단어 빙고',phase:'CVC 복습',min:'5',instruction:isCoachEarly()?'순번 아이가 룰렛을 돌리고 나온 단어를 읽어요. 필요하면 코치가 대신 돌려요.':'내 차례면 룰렛을 돌리고 단어를 읽어요. 내 판에 있으면 눌러요.'},
    {id:'build',view:'build',nav:S.text.buildNav,phase:'CVC 복습',min:'5',instruction:'그림을 골라 소리를 놓고, 젤리를 눌러 낱말을 합쳐요.'},
    {id:'intro-'+S.target,view:'intro',c:0,nav:S.text.introNav,phase:'새 소리',min:'3',instruction:'소리를 잘 듣고 같은 입모양으로 따라해봐요.'},
    {id:'first',view:'first',nav:S.text.firstNav||'첫소리 구분하기',phase:'듣고 구별',min:'4',instruction:S.text.firstInstruction||'그림 소리를 듣고 첫소리를 골라요.'},
    {id:'tch',view:'tch',nav:S.text.spellNav,phase:'철자 규칙',min:'5',instruction:S.text.spellInstruction},
    {id:'tap',view:'tap',nav:'글자·소리·박자',phase:'소리 나누기',min:'4',instruction:'글자를 세고, 소리로 쪼개고, 다시 합친 뒤 박자를 세요.'},
    {id:'elkonin',view:'elkonin',nav:'낱말 실험실',phase:'소리 합성',min:'3',instruction:'낱말을 듣고, 소리 젤리 두 개를 끌어 가까이 붙여요.'},
    {id:'pic',view:'pic',nav:'낱말-그림 짝',phase:'낱말 읽기',min:'3',instruction:'낱말을 읽고 맞는 그림을 골라요. 그림을 누르면 소리가 나요.'},
    {id:'real',view:'real',nav:'외계어 스파이',phase:'낱말 읽기',min:'5',instruction:isCoachEarly()?'아이들이 함께 외계어 10개를 찾아요. 1인당 기회 수를 조절해요.':'낱말을 읽고 외계어라고 생각되면 눌러요. 외계어 10개를 모두 찾으면 우리 팀 승리!'},
    {id:'jump',view:'jump',nav:'점핑워드',phase:'낱말 반복',min:'5',instruction:'하늘로 뛰어오르는 젤리를 잡아요! 나타난 낱말을 소리 내어 읽어요.'},
    {id:'sentence',view:'sentence',nav:'문장 놀이터',phase:'문장',min:'5',instruction:'낱말을 눌러 마음에 드는 문장을 만들어요.'},
    {id:'draw',view:'draw',nav:'그림판',phase:'자유 활동',min:'',instruction:isCoachEarly()?'자유롭게 그리고 모두와 함께 봐요.':'그림을 그리면 모두의 화면에 함께 보여요.'},
  ];
  const groups=[
    {label:'복습',ids:['bingo','build']},
    {label:S.text.newGroup,ids:['intro-'+S.target,'first','tch']},
    {label:'소리 톡톡',ids:['tap','elkonin']},
    {label:'낱말 읽기',ids:['pic','real']},
    {label:'문장 읽기',ids:['jump','sentence']},
    {label:'그림판',ids:['draw']}
  ].map(g=>({...g,pages:g.ids.map(id=>pages.findIndex(p=>p.id===id))}));
  const menuActive=(menuPage,page)=>page===menuPage;
  const groupFor=i=>Math.max(0,groups.findIndex(g=>g.pages.some(mp=>menuActive(mp,i))));

  const isCoach=window.ONQ_ROLE?.isCoach===true;
  const fresh=()=>({picSplit:false,picHint:false,tapStep:0,selected:[],feedback:'',pending:null,sentenceChoices:[0,0],buildTarget:null,buildSlots:['','',''],buildStage:0,buildMade:[],tapLit:[],sightLit:0,realShown:false});
  let firstAdvanceTimer=null,sharedSentence=null,stopSentenceSharing=null;
  function cancelFirstAdvance(){clearTimeout(firstAdvanceTimer);firstAdvanceTimer=null}
  function scheduleFirstAdvance(){
    cancelFirstAdvance();const page=state.page,item=idx('first');
    firstAdvanceTimer=setTimeout(()=>{firstAdvanceTimer=null;if(state.page===page&&cur().view==='first'&&idx('first')===item&&state.feedback==='correct')nextItem(firstSound.length)},900);
  }
  const state={page:0,menuGroup:0,index:{},bingoMarks:[],bingoGame:0,bingoMsg:'',...fresh()};
  /* 룰렛 빙고 공유 상태 (코치·순번 아이가 씀)
     called/readers = 나온 단어와 그 단어를 읽은 아이, spin = 돌린 횟수,
     roster = 입장한 아이 닉네임 순서(코치가 관리), turn = 다음에 룰렛을 돌릴 차례, size = 명단이 없을 때 쓰는 번호 순번 인원 */
  const clean=(v,n=40)=>String(v??'').replace(/[<>"'&]/g,'').trim().slice(0,n);
  let bingo={game:1,called:[],readers:[],last:null,spin:0,turn:0,size:4,roster:[]};
  let seenSpin=null,reel={spinning:false,word:''},reelTimer=null;
  const myId=()=>clean(window.ONQ_ROLE?.child||window.ONQ_RUNTIME_V1?.child||'',60);
  const bingoSeed=()=>{let id=myId();if(!id){try{id=sessionStorage.getItem('ogkr-digraph'+S.session+':bingo-seat')||'';if(!id){id='s'+Math.random().toString(36).slice(2,8);sessionStorage.setItem('ogkr-digraph'+S.session+':bingo-seat',id)}}catch(e){id='solo'}}return id+':'+bingo.game};
  function bingoBoard(){
    let seed=2166136261;const key=bingoSeed();for(let i=0;i<key.length;i++){seed^=key.charCodeAt(i);seed=Math.imul(seed,16777619)}
    const rnd=()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
    const pool=BINGO_POOL.slice();for(let i=pool.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
    const cells=pool.slice(0,24);cells.splice(12,0,'FREE');return cells;
  }
  const wordLook=w=>{const pi=Math.max(0,BINGO_POOL.indexOf(w));return{colors:BINGO_COLORS[(pi*3)%BINGO_COLORS.length],font:BINGO_FONTS[(pi*5+2)%BINGO_FONTS.length]}};
  // 다음에 룰렛을 돌릴 아이: 명단이 있으면 닉네임, 없으면 「n번 친구」
  const nextSpinner=()=>bingo.roster.length?bingo.roster[bingo.turn%bingo.roster.length]:{id:'',name:((bingo.turn%bingo.size)+1)+'번 친구'};
  const lastReader=()=>bingo.readers[bingo.readers.length-1]||'';
  const myTurn=()=>!isCoach&&bingo.roster.length>0&&nextSpinner().id===myId();
  const isOpen=w=>bingo.called.includes(w)&&!(reel.spinning&&w===bingo.last);
  function paintReel(){
    const box=$('[data-reel]');if(!box)return;
    const look=wordLook(reel.word);
    box.classList.toggle('spinning',reel.spinning);
    box.style.setProperty('--cell-bg',look.colors[0]);box.style.setProperty('--cell-fg',look.colors[1]);
    const word=$('[data-reel-word]',box);if(!word)return;
    word.textContent=reel.word||'?';word.style.fontFamily=look.font+',sans-serif';
    word.classList.remove('tick');void word.offsetWidth;word.classList.add('tick');
  }
  function runSpin(final){
    clearTimeout(reelTimer);stopAudio();
    const others=BINGO_POOL.filter(w=>w!==final);
    // 처음엔 빠르게, 끝으로 갈수록 느려지는 간격(ms)
    const gaps=[55,55,55,60,60,65,70,75,85,95,110,125,145,170,200,240,290,350];
    reel={spinning:true,word:others[Math.floor(Math.random()*others.length)]};
    if(cur()?.view==='bingo')render();
    let i=0;
    const tick=()=>{
      if(i<gaps.length){reel.word=others[Math.floor(Math.random()*others.length)];paintReel();reelTimer=setTimeout(tick,gaps[i++]);return}
      reel={spinning:false,word:final};playSuccessTone();
      if(cur()?.view==='bingo')render();
    };
    reelTimer=setTimeout(tick,gaps[i++]);
  }
  const applyBingo=value=>{
    if(!value||typeof value!=='object')return;
    const called=Array.isArray(value.called)?value.called.filter(w=>BINGO_POOL.includes(w)):[];
    const readers=Array.isArray(value.readers)?value.readers.slice(0,called.length).map(r=>clean(r)):[];
    while(readers.length<called.length)readers.push('');
    const roster=Array.isArray(value.roster)?value.roster.slice(0,12).map(r=>({id:clean(r&&r.id,60),name:clean(r&&(r.name||r.id))})).filter(r=>r.id):[];
    bingo={game:Math.max(1,Number(value.game)||1),called,readers,last:BINGO_POOL.includes(value.last)?value.last:null,spin:Math.max(0,Number(value.spin)||0),turn:Math.max(0,Number(value.turn)||0),size:Math.min(8,Math.max(2,Number(value.size)||4)),roster};
    if(state.bingoGame!==bingo.game){state.bingoGame=bingo.game;state.bingoMarks=[];state.bingoMsg='';clearTimeout(reelTimer);reel={spinning:false,word:''}}
    state.bingoMarks=state.bingoMarks.filter(w=>bingo.called.includes(w));
    const first=seenSpin===null;
    if(!first&&bingo.spin>seenSpin&&bingo.last){seenSpin=bingo.spin;runSpin(bingo.last);return}
    seenSpin=bingo.spin;
    if(!reel.spinning)reel={spinning:false,word:bingo.last||''};
    if(cur()?.view==='bingo')render();
  };
  let stopBingoSharing=null;
  const connectBingo=()=>{const rt=window.ONQ_RUNTIME_V1;if(!rt?.onShared||stopBingoSharing)return;stopBingoSharing=rt.onShared('bingo',applyBingo);if(seenSpin===null)seenSpin=bingo.spin};
  window.addEventListener('oncuvate:runtime-ready',connectBingo);
  const shareBingo=next=>{if(seenSpin===null)seenSpin=bingo.spin;applyBingo(next);window.ONQ_RUNTIME_V1?.share?.('bingo',{...bingo,called:bingo.called.slice(),readers:bingo.readers.slice(),roster:bingo.roster.slice()})};
  function spinBingo(){
    if(reel.spinning)return;
    if(!isCoach&&!myTurn())return;
    const left=BINGO_POOL.filter(w=>!bingo.called.includes(w));if(!left.length)return;
    const w=left[Math.floor(Math.random()*left.length)],reader=nextSpinner().name;
    if(!isCoach)trials.event('bingo','read-turn',{word:w});
    window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'bingo-spin',activityId:'bingo',itemId:w,response:w}}));
    shareBingo({...bingo,called:[...bingo.called,w],readers:[...bingo.readers,reader],last:w,spin:bingo.spin+1,turn:bingo.turn+1});
  }
  // 코치 화면: 입장한 아이 닉네임을 명단 끝에 차례로 붙인다(이미 있는 순서는 바꾸지 않음).
  function syncRoster(list){
    if(!isCoach||!Array.isArray(list))return;
    const have=new Set(bingo.roster.map(r=>r.id)),add=list.map(l=>({id:clean(l.id,60),name:clean(l.name||l.id)})).filter(l=>l.id&&!have.has(l.id));
    if(add.length)shareBingo({...bingo,roster:[...bingo.roster,...add].slice(0,12)});
  }
  window.addEventListener('oncuvate:learners',e=>syncRoster(e.detail));

  /* 외계어 스파이 공유 상태
     흐름: 아이가 타일을 고름 → 모든 화면에 큰 팝업(고른 아이 이름 + 낱말) → 아이가 소리 내어 읽음
          → 코치가 [정확히 읽었어요]를 누르면 뒤집혀 색이 드러남 / [다시 고르기]면 취소.
     코치가 판(master 주제 'spy')을 관리하고, 아이는 자기 주제('spyp-아이ID해시')에 고른 칸 요청만 올린다.
     수업방이 없으면(혼자 검토) 팝업의 [읽었어요]로 스스로 뒤집는다. */
  const hashId=v=>{let h=2166136261;for(const c of String(v)){h^=c.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
  const inRoom=()=>Boolean(window.ONQ_ROLE?.room||window.ONCUVATE?.room);
  let spy={game:0,board:null,flipped:{},picks:{},limit:4,pending:null,last:null};
  let spyReveal=false,spySeenLast=null,spyLocalMsg='',spySeq=0;
  const spyMyKey=()=>hashId(myId()||'solo');
  const spyShuffle=a=>{const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r};
  const spyNewBoard=()=>spyShuffle([...SPY_ALIEN.map(w=>({w,c:'alien'})),...SPY_REAL.map(w=>({w,c:'real'}))]);
  const spyFound=()=>spy.board?spy.board.filter((t,i)=>t.c==='alien'&&spy.flipped[i]).length:0;
  const spyUsed=()=>Number(spy.picks[spyMyKey()])||0;
  const applySpy=value=>{
    if(!value||typeof value!=='object')return;
    const board=Array.isArray(value.board)?value.board.filter(t=>t&&typeof t.w==='string').map(t=>({w:clean(t.w,12),c:t.c==='alien'?'alien':'real'})).slice(0,25):null;
    const ok=i=>board&&board[i]!==undefined;
    const flipped={};Object.entries(value.flipped||{}).forEach(([i,f])=>{if(f&&ok(i))flipped[i]={by:clean(f.by,20),c:board[i].c}});
    const pd=value.pending,pending=pd&&ok(pd.i)&&!flipped[pd.i]?{i:Number(pd.i),by:clean(pd.by,20),key:clean(pd.key,16)}:null;
    const ls=value.last,last=ls&&ok(ls.i)?{i:Number(ls.i),by:clean(ls.by,20),key:clean(ls.key,16),read:ls.read==='support'?'support':'independent',c:board[ls.i].c,seq:Number(ls.seq)||0}:null;
    const prevGame=spy.game;
    spy={game:Math.max(0,Number(value.game)||0),board:board&&board.length?board:null,flipped,picks:value.picks&&typeof value.picks==='object'?value.picks:{},limit:Math.min(10,Math.max(1,Number(value.limit)||4)),pending,last};
    if(prevGame!==spy.game){spySeenLast=last?last.seq:null;spyLocalMsg=''}
    // 새로 뒤집힌 결과는 모든 화면에 한 번 알림
    if(last&&last.seq!==spySeenLast&&prevGame===spy.game&&last.key===spyMyKey()&&!isCoach){const w=board[last.i].w;trials.begin({activityId:'spy',itemId:w,target:w,measureId:'read-aloud',condition:{alien:last.c==='alien'}});if(last.read==='support')trials.prompt('A3','model-reading','coach');trials.respond(w,true)}
    if(last&&last.seq!==spySeenLast){spySeenLast=last.seq;const w=spy.board[last.i].w;spyLocalMsg=last.c==='alien'?'👽 '+last.by+' · 「'+w+'」 외계어 발견!':last.by+' · 「'+w+'」는 진짜 낱말이에요.';if(last.c==='alien')playSuccessTone()}
    if(cur()?.view==='real')render();
  };
  const shareSpy=next=>{applySpy(next);if(inRoom())window.ONQ_RUNTIME_V1?.share?.('spy',{...spy})};
  // 코치: 아이 요청을 받아 팝업(pending)으로 올림 — 한 번에 한 낱말만
  const spySubs={},spyReqSeen={};
  function spyRequest(childId,name,value){
    if(!isCoach||!spy.board||!value||Number(value.game)!==spy.game)return;
    const seq=Number(value.seq)||0;if(seq<=(spyReqSeen[childId]||0))return;spyReqSeen[childId]=seq;
    const i=Number(value.i),key=hashId(childId);
    if(spy.pending||!spy.board[i]||spy.flipped[i]||(Number(spy.picks[key])||0)>=spy.limit)return;
    shareSpy({...spy,pending:{i,by:name,key}});
  }
  function spyWatch(list){
    const rt=window.ONQ_RUNTIME_V1;if(!isCoach||!rt?.onShared||!Array.isArray(list))return;
    let added=false;
    list.forEach(l=>{const id=clean(l.id,60);if(!id||spySubs[id])return;added=true;spySubs[id]=rt.onShared('spyp-'+hashId(id),v=>spyRequest(id,clean(l.name||id),v))});
    // 새로 들어온 아이도 지금 판을 받도록 다시 알림
    if(added&&spy.board&&inRoom())rt.share('spy',{...spy});
  }
  window.addEventListener('oncuvate:learners',e=>spyWatch(e.detail));
  let stopSpySharing=null;
  const connectSpy=()=>{const rt=window.ONQ_RUNTIME_V1;if(!rt?.onShared||stopSpySharing)return;stopSpySharing=rt.onShared('spy',applySpy);spyWatch(window.ONQ_COACH_LEARNERS)};
  window.addEventListener('oncuvate:runtime-ready',connectSpy);
  function spyEnsureBoard(){
    if(spy.board)return;
    if(isCoach||!inRoom())shareSpy({game:Date.now(),board:spyNewBoard(),flipped:{},picks:{},limit:spy.limit,pending:null,last:null});
  }
  function spyPick(i){
    if(!spy.board||spy.flipped[i])return;
    const say=m=>{spyLocalMsg=m;render()};
    if(spyFound()>=SPY_GOAL)return say('외계어를 모두 찾았어요! 우리 팀 승리!');
    if(isCoach)return say('코치 화면에서는 지켜봐요. 아이가 고르면 팝업이 떠요.');
    if(spy.pending)return say('친구가 읽는 중이에요. 잠깐 기다려요!');
    if(spyUsed()>=spy.limit)return say('내 기회를 모두 썼어요. 친구들을 응원해요!');
    const name=clean(myId()||'나',20);
    window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'spy-pick',activityId:'real',itemId:spy.board[i].w,response:'pick'}}));
    if(inRoom()){spySeq=Math.max(spySeq+1,Date.now());window.ONQ_RUNTIME_V1?.share?.('spyp-'+spyMyKey(),{game:spy.game,seq:spySeq,i});say('코치가 확인하면 팝업이 떠요…')}
    else shareSpy({...spy,pending:{i,by:name,key:spyMyKey()}});
  }
  // 코치(혼자 검토면 아이 자신)가 읽기를 확인 → 뒤집기
  function spyConfirm(read='independent'){
    const pd=spy.pending;if(!pd)return;
    const t=spy.board[pd.i];
    window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'answer',activityId:'real',itemId:t.w,response:pd.by,correct:t.c==='alien'}}));
    shareSpy({...spy,flipped:{...spy.flipped,[pd.i]:{by:pd.by,c:t.c}},picks:{...spy.picks,[pd.key]:(Number(spy.picks[pd.key])||0)+1},pending:null,last:{i:pd.i,by:pd.by,key:pd.key,read,c:t.c,seq:Date.now()}});
  }
  const spyCancel=()=>{if(spy.pending)shareSpy({...spy,pending:null})};

  /* ================= 도움 설정 (반 전체 기본 + 필요한 아이만 조정) =================
     코치가 정하고 주제 'support'로 모두에게 알린다. 아이 화면 = 반 설정에 자기 조정만 덮어씀.
     바뀐 설정은 시행 기록의 condition에 함께 남는다(같은 조건끼리 비교하려고). */
  const SUPPORT_DEF=[
    {key:'first.choices',screen:'첫소리 구분하기',label:'보기 수',options:[['item','문항대로'],['2','2개'],['3','3개'],['4','4개']],def:'item'},
    {key:'first.keys',screen:'첫소리 구분하기',label:'소리 단추(왼쪽)',options:[['on','보이기'],['off','숨기기']],def:'on'},
    {key:'spell.rule',screen:S.text.spellNav,label:'규칙 카드',options:[['show','보이기'],['peek','누르면 잠깐'],['hide','숨기기']],def:'show'},
    {key:'tap.letters',screen:'글자·소리 조각·박자',label:'글자 타일',options:[['show','보이기'],['hide','듣고만 세기']],def:'show'},
    {key:'tap.ko',screen:'글자·소리 조각·박자',label:'한글 소리 짝',options:[['on','보이기'],['off','숨기기']],def:'on'},
    {key:'build.mode',screen:'낱말 공방',label:'목표 낱말 주기',options:[['both','그림+소리'],['picture','그림만'],['sound','소리만']],def:'both'},
    {key:'pic.audio',screen:'낱말-그림 짝',label:'그림 소리 듣기',options:[['on','켜기'],['off','끄기']],def:'on'},
    {key:'pic.hint',screen:'낱말-그림 짝',label:'나누기 힌트',options:[['on','켜기'],['off','끄기']],def:'on'},
    {key:'jump.easy',screen:'점핑워드',label:'이지모드',options:[['child','아이가 고름'],['on','켜기'],['off','끄기']],def:'child'},
    {key:'jump.speed',screen:'점핑워드',label:'젤리 속도',options:[['child','아이가 고름'],['slow','천천히'],['normal','보통'],['fast','빠르게']],def:'child'},
    {key:'hl',screen:'모든 화면',label:'목표 글자 색 강조',options:[['on','켜기'],['off','끄기']],def:'on'},
    {key:'help',screen:'모든 화면',label:'자동 도움말',options:[['normal','보통'],['fast','빠르게'],['off','끄기']],def:'normal'}
  ];
  let support={cls:{},kids:{}};
  const supKey=()=>hashId(myId()||'solo');
  const supDef=k=>(SUPPORT_DEF.find(d=>d.key===k)||{}).def;
  function sup(k,kidKey){const kid=support.kids[kidKey??supKey()]||{};return kid[k]??support.cls[k]??supDef(k)}
  function applySupportGlobal(){
    document.documentElement.classList.toggle('ogd-no-hl',sup('hl')==='off');
    window.S6Help?.pace?.(sup('help'));
  }
  const applySupport=v=>{
    if(!v||typeof v!=='object')return;
    const okVal=(k,val)=>{const d=SUPPORT_DEF.find(x=>x.key===k);return d&&d.options.some(o=>o[0]===val)};
    const cls={};Object.entries(v.cls||{}).forEach(([k,val])=>{if(okVal(k,val))cls[k]=val});
    const kids={};Object.entries(v.kids||{}).forEach(([id,o])=>{const m={};Object.entries(o||{}).forEach(([k,val])=>{if(okVal(k,val))m[k]=val});if(Object.keys(m).length)kids[clean(id,16)]=m});
    support={cls,kids};applySupportGlobal();
    if(cur())render();
    document.querySelector('[data-sup-dialog]')&&renderSupportDialog();
  };
  const shareSupport=next=>{applySupport(next);if(inRoom())window.ONQ_RUNTIME_V1?.share?.('support',{cls:support.cls,kids:support.kids})};
  let stopSupportSharing=null;
  window.addEventListener('oncuvate:runtime-ready',()=>{const rt=window.ONQ_RUNTIME_V1;if(!rt?.onShared||stopSupportSharing)return;stopSupportSharing=rt.onShared('support',applySupport)});
  // 늦게 들어온 아이도 지금 설정을 받도록
  const supSeen=new Set();
  window.addEventListener('oncuvate:learners',e=>{if(!isCoach||!inRoom()||!Array.isArray(e.detail))return;let add=false;e.detail.forEach(l=>{if(!supSeen.has(l.id)){supSeen.add(l.id);add=true}});if(add&&(Object.keys(support.cls).length||Object.keys(support.kids).length))window.ONQ_RUNTIME_V1?.share?.('support',{cls:support.cls,kids:support.kids})});
  // 코치 화면: 도움 설정 창
  let supTab='cls';
  function renderSupportDialog(){
    const dlg=document.querySelector('[data-sup-dialog]');if(!dlg)return;
    const kids=(window.ONQ_COACH_LEARNERS||[]).map(l=>({id:hashId(l.id),name:l.name||l.id}));
    const tabs='<div class="osp-tabs"><button type="button" data-sup-tab="cls" class="'+(supTab==='cls'?'on':'')+'">반 전체</button>'+kids.map(k=>{const n=Object.keys(support.kids[k.id]||{}).length;return '<button type="button" data-sup-tab="'+k.id+'" class="'+(supTab===k.id?'on':'')+'">'+esc(k.name)+(n?' <i>'+n+'</i>':'')+'</button>'}).join('')+(kids.length?'':'<span class="osp-none">입장한 아이가 없어 반 전체만 정할 수 있어요.</span>')+'</div>';
    const kidMode=supTab!=='cls';
    let lastScreen='';
    const rows=SUPPORT_DEF.map(d=>{
      const own=kidMode?(support.kids[supTab]||{})[d.key]:support.cls[d.key];
      const eff=kidMode?sup(d.key,supTab):(support.cls[d.key]??d.def);
      const screen=d.screen!==lastScreen?(lastScreen=d.screen):'';
      const opts=(kidMode?[['__inherit','반 설정 따름']]:[]).concat(d.options).map(([v,t])=>{const on=kidMode?(v==='__inherit'?own===undefined:own===v):eff===v;return '<button type="button" data-sup-set="'+d.key+'" data-sup-val="'+v+'" class="'+(on?'on':'')+'">'+t+(kidMode&&v==='__inherit'?' <small>('+esc((d.options.find(o=>o[0]===(support.cls[d.key]??d.def))||[])[1]||'')+')</small>':'')+'</button>'}).join('');
      return '<tr><td class="osp-screen">'+esc(screen)+'</td><td class="osp-label">'+esc(d.label)+'</td><td><div class="osp-opts">'+opts+'</div></td></tr>';
    }).join('');
    dlg.querySelector('[data-sup-body]').innerHTML=tabs+'<p class="osp-hint">'+(kidMode?'이 아이만 다르게 정할 항목을 고르세요. 「반 설정 따름」이면 반 전체 설정을 씁니다.':'반 전체에 적용됩니다. 필요한 아이만 위 이름 탭에서 따로 조정하세요.')+'</p><table class="osp-table"><tbody>'+rows+'</tbody></table>'+(kidMode&&Object.keys(support.kids[supTab]||{}).length?'<button type="button" class="ogd-soft" data-sup-clear>이 아이 조정 모두 되돌리기</button>':'');
    dlg.querySelectorAll('[data-sup-tab]').forEach(b=>b.onclick=()=>{supTab=b.dataset.supTab;renderSupportDialog()});
    dlg.querySelectorAll('[data-sup-set]').forEach(b=>b.onclick=()=>{
      const k=b.dataset.supSet,v=b.dataset.supVal;
      if(kidMode){const m={...(support.kids[supTab]||{})};if(v==='__inherit')delete m[k];else m[k]=v;const kidsAll={...support.kids};if(Object.keys(m).length)kidsAll[supTab]=m;else delete kidsAll[supTab];shareSupport({cls:support.cls,kids:kidsAll})}
      else shareSupport({cls:{...support.cls,[k]:v},kids:support.kids});
      window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'support-setting',scope:kidMode?'child':'class',childKey:kidMode?supTab:null,key:k,value:v}}));
    });
    dlg.querySelector('[data-sup-clear]')?.addEventListener('click',()=>{const kidsAll={...support.kids};delete kidsAll[supTab];shareSupport({cls:support.cls,kids:kidsAll})});
  }
  function openSupport(){
    if(document.querySelector('[data-sup-dialog]'))return;
    const dlg=document.createElement('dialog');dlg.className='osp-dialog';dlg.setAttribute('data-sup-dialog','');
    dlg.innerHTML='<header><h2>도움 설정</h2><button type="button" data-sup-close>닫기 ×</button></header><div data-sup-body></div>';
    document.body.append(dlg);dlg.showModal();
    const close=()=>{dlg.close();dlg.remove()};dlg.querySelector('[data-sup-close]').onclick=close;dlg.addEventListener('cancel',e=>{e.preventDefault();close()});
    renderSupportDialog();
  }

  /* ================= 시행 기록 (ABA) =================
     시행마다 oncuvate:log(type 'trial'·'reaction'·'observation')로 남긴다 → 플랫폼에 저장.
     회기 보고서는 저장된 데이터와 코치 기록을 합쳐 나중에 발행한다(수업 중 즉석 생성 없음). */
  const trials=createTrialRecorder({});
  // 도움말 엔진·힌트 버튼이 남기는 hint 기록을 지금 시행의 촉진으로 연결
  window.addEventListener('oncuvate:log',e=>{const d=e.detail||{};if(d.type!=='hint')return;const req=d.trigger==='request';trials.prompt(d.helpLevel||'A1',req?'child-request':(d.prompt==='소리 조각 나누기'?'part-cue':'system-cue'),req?'child-request':'system')});
  // 화면마다 지금 시행 열기
  function trialBegin(p){
    const cond=o=>Object.assign({hl:sup('hl'),help:sup('help')},o);
    if(p.view==='first'){const x=firstSound[idx('first')];trials.begin({activityId:'first',itemId:x.word,target:x.answer,condition:cond({choices:firstChoices(x).length,soundKeys:sup('first.keys')})})}
    else if(p.view==='tch'){const x=TCH[idx('tch')];trials.begin({activityId:'tch',itemId:x.word,target:x.answer,condition:cond({exception:!!x.except,rule:sup('spell.rule')})})}
    else if(p.view==='pic'){const x=PIC[idx('pic')];trials.begin({activityId:'pic',itemId:x.word,target:x.word,condition:cond({pictures:x.pics.length,audio:sup('pic.audio'),hint:sup('pic.hint')})})}
    else if(p.view==='tap'){const w=TAP_WORDS[idx('tap')];if(state.tapStep===0)trials.begin({activityId:'tap',itemId:w+'-sounds',target:String(units(w).length),measureId:'segment',condition:cond({letters:w.length,letterTiles:sup('tap.letters'),koPair:sup('tap.ko')})});else if(state.tapStep===3)trials.begin({activityId:'tap',itemId:w+'-beats',target:'1',measureId:'syllable'})}
    else if(p.view==='build'&&state.buildTarget)trials.begin({activityId:'build',itemId:state.buildTarget,target:state.buildTarget,condition:cond({mode:sup('build.mode')})});
    else if(p.view==='elkonin'){const x=LAB_TARGETS[jellyLab.getState().index];if(x)trials.begin({activityId:'elkonin',itemId:x.word,target:x.parts.join('+')})}
  }
  const jellyLab=createOncuvateJellyLab({targets:LAB_TARGETS,grid:LAB_GRID,wordHtml:redVowel,speak,success:()=>{playSuccessTone();trials.respond(LAB_TARGETS[jellyLab.getState().index]?.word,true)},retry:()=>{trials.respond('mismatch',false);window.S6Help?.wrong()},render:()=>render(),finish:()=>go(1)});
  const q=new URLSearchParams(location.search).get('view');
  const vi=pages.findIndex(p=>p.id===q);if(vi>=0)state.page=vi;
  const cur=()=>pages[state.page];
  const idx=id=>state.index[id]||0;

  /* ================= 틀 (6회차 마크업 그대로) ================= */
  function shell(){
    document.body.innerHTML='<div class="s6-app '+(isCoach?'coach-mode':'student-mode')+'"><aside class="s6-side"><img class="s6-logo" src="assets/oncuvate-brand-logo.png" alt="Oncuvate"><small>'+S.text.sideLabel+'</small><div class="s6-session-goal" data-session-goal><span>회차 공동 목표</span><b>0 <i>/ 2000</i></b></div><nav class="s6-menu-accordion" aria-label="활동 묶음">'+groups.map((g,gi)=>'<section class="s6-menu-group"><button type="button" class="s6-menu-group-toggle" data-menu-group="'+gi+'"><b>'+(gi+1)+'</b><span>'+g.label+'</span><i aria-hidden="true"></i></button><div class="s6-menu-submenu" data-menu-list="'+gi+'" hidden>'+g.pages.map(pi=>'<button data-page="'+pi+'"><i class="s6-submenu-dot" aria-hidden="true"></i><span>'+pages[pi].nav+'</span></button>').join('')+'</div></section>').join('')+'</nav>'+(isCoach||!inRoom()?'<button type="button" class="osp-open" data-sup-open>⚙ 도움 설정</button>':'')+'<div class="s6-side-note">자체 제작 · 온큐베이트</div></aside><main class="s6-main"><header><span class="s6-phase"></span><span class="s6-minute"></span><i><b></b></i></header><section id="s6Stage"></section><footer class="s6-bottom"><button data-prev>이전</button><span class="s6-count"></span><button data-next>다음</button></footer></main></div>';
    $('[data-prev]').onclick=()=>go(-1);$('[data-next]').onclick=()=>go(1);
    $('[data-sup-open]')?.addEventListener('click',openSupport);applySupportGlobal();
    $$('[data-menu-group]').forEach(b=>{
      const gi=Number(b.dataset.menuGroup),g=groups[gi],direct=g.pages.length===1;
      if(direct){b.querySelector('i')?.remove();$('[data-menu-list="'+gi+'"]')?.remove()}
      b.onclick=()=>{
        state.menuGroup=gi;
        if(direct){if(state.page!==g.pages[0]){state.page=g.pages[0];reset()}render()}
        else updateMenu();
      };
    });
    $$('[data-page]').forEach(b=>b.onclick=()=>{state.page=Number(b.dataset.page);reset();render()});
  }
  function cover(){
    const C=S.cover;
    document.body.innerHTML='<main class="s6-cover"><section class="s6-cover-card"><div class="s6-cover-copy"><div class="s6-cover-brand"><span><img src="assets/oncuvate-brand-logo.png" alt="Oncuvate"></span><small>'+C.kicker+'</small></div><p class="s6-cover-kicker">LISTEN · TAP · BUILD · READ</p><h1>'+C.title+'<br><strong>소리 공방</strong></h1><h2>'+C.h2+'</h2><p class="s6-cover-description">'+C.desc+'</p><ul class="s6-cover-tags">'+C.tags.map(t=>'<li>'+t+'</li>').join('')+'</ul><button type="button" class="s6-cover-start" data-cover-start><span>수업 시작</span><i aria-hidden="true">→</i></button></div><div class="s6-cover-visual" aria-hidden="true">'+['orbit-m','orbit-c','orbit-l'].map((o,i)=>'<span class="s6-cover-orbit '+o+'"><b>'+C.orbits[i][0]+'</b><em>'+C.orbits[i][1]+'</em></span>').join('')+'<div class="s6-cover-glow"></div><img class="s6-cover-coach" src="assets/images/jelly-coach-listening-3d.png" alt=""><div class="s6-cover-wave wave-one"></div><div class="s6-cover-wave wave-two"></div></div></section></main>';
    $('[data-cover-start]').onclick=()=>{shell();render();fit()};
  }
  function fit(){const app=$('.s6-app');if(!app)return;const W=987+(window.ONQ_ROLE?.dockReserve?.()||0);const k=Math.min(1,innerWidth/W,innerHeight/525);app.style.left=W>987?((innerWidth-W*k)/2+987*k/2)+'px':'';app.style.transform='translate(-50%,-50%) scale('+k+')'}
  function updateMenu(){
    $$('[data-menu-group]').forEach(b=>{
      const gi=Number(b.dataset.menuGroup),g=groups[gi],direct=g.pages.length===1;
      const on=direct?menuActive(g.pages[0],state.page):gi===state.menuGroup;
      b.classList.toggle('active',on);
      if(direct){b.removeAttribute('aria-expanded');if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')}
      else b.setAttribute('aria-expanded',String(on));
    });
    $$('[data-menu-list]').forEach(l=>l.hidden=Number(l.dataset.menuList)!==state.menuGroup);
    $$('[data-page]').forEach(b=>b.classList.toggle('active',menuActive(Number(b.dataset.page),state.page)));
  }
  function reset(){trials.end('abandoned');cancelFirstAdvance();stopAudio();jellyLab.reset();if(cur()?.view!=='jump')jumpGame.stop();Object.assign(state,fresh())}
  function go(d){state.page=Math.max(0,Math.min(pages.length-1,state.page+d));reset();render()}
  function nextItem(total){const id=cur().id,n=idx(id);if(n<total-1){state.index[id]=n+1;reset();render()}else go(1)}
  const checkBtn=(ready=true,extra='')=>state.feedback==='correct'?'':'<button class="s6-primary '+extra+'" data-check '+(ready?'':'disabled')+'>Check</button>';
  const fb=(good='잘했어요!',retry='다시 들어 보세요.',next=true)=>'<div class="s6-feedback '+(state.feedback==='correct'?'good':state.feedback==='retry'?'retry':'')+'" role="status">'+(state.feedback==='correct'?good:state.feedback==='retry'?retry:'')+'</div>'+(state.feedback==='correct'&&next?'<button class="s6-primary" data-item-next>다음</button>':'');
  const pill=text=>'<span class="s6-swap-progress">'+text+'</span>';
  const headsetIcon='<span class="s6-listen-headset" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M7 17v-2a9 9 0 0 1 18 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="5" y="15" width="5" height="9" rx="2.5" fill="currentColor"/><rect x="22" y="15" width="5" height="9" rx="2.5" fill="currentColor"/><path d="M13 17v5m3-9v13m3-9v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';

  /* ================= ① 룰렛 단어 빙고 ================= */
  // 도장 그림(assets/images/bingo-stamp.png)이 있으면 도장으로, 없으면 동그라미 표시
  (()=>{const img=new Image();img.onload=()=>document.documentElement.classList.add('ogd-has-stamp');img.src='assets/images/bingo-stamp.png'})();
  const bingoLines=marks=>BINGO_LINES.filter(line=>line.every(i=>i===12||marks.has(i))).length;
  function reelHtml(big=false){
    const look=wordLook(reel.word);
    return '<div class="ogd-reel '+(big?'big ':'')+(reel.spinning?'spinning':'')+'" data-reel style="--cell-bg:'+look.colors[0]+';--cell-fg:'+look.colors[1]+'"><i class="ogd-reel-lamp l"></i><i class="ogd-reel-lamp r"></i><div class="ogd-reel-window"><span class="ogd-reel-word" data-reel-word style="font-family:'+look.font.replace(/"/g,'&quot;')+',sans-serif">'+esc(reel.word||'?')+'</span></div></div>';
  }
  function turnHtml(){
    if(reel.spinning)return '<p class="ogd-turn" role="status">룰렛이 돌아가요…</p>';
    const next=nextSpinner(),mine=myTurn();
    const now=bingo.spin?'<b>'+esc(lastReader())+'</b> 차례! 읽어 볼까요?':'첫 룰렛: <b>'+esc(next.name)+'</b>';
    const after=bingo.spin?'<small>다음 룰렛: '+(mine?'<b class="me">나!</b>':esc(next.name))+'</small>':'';
    return '<p class="ogd-turn" role="status">'+now+after+'</p>';
  }
  const spinBtn=(label,extra='')=>{const left=BINGO_POOL.length-bingo.called.length;return '<button type="button" class="ogd-spin '+extra+'" data-bingo-spin '+(reel.spinning||!left?'disabled':'')+'>'+(left?label:'단어를 모두 썼어요')+'</button>'};
  function vBingo(){
    if(isCoach){
      const roster=bingo.roster,next=nextSpinner();
      const people=roster.length?'<div class="ogd-roster">'+roster.map((r,i)=>'<span class="'+(r.id===next.id&&!reel.spinning?'next':'')+'"><small>'+(i+1)+'</small>'+esc(r.name)+'</span>').join('')+'</div>':'<div class="ogd-size"><span>입장한 아이가 없어 번호로 돌려요 · 인원</span><button type="button" data-bingo-size="-1" aria-label="인원 줄이기">−</button><b>'+bingo.size+'명</b><button type="button" data-bingo-size="1" aria-label="인원 늘리기">+</button></div>';
      return '<div class="ogd-bingo ogd-caller"><div class="ogd-caller-main">'+reelHtml(true)+turnHtml()+'<div class="ogd-row">'+spinBtn('대신 돌리기')+'<button type="button" class="ogd-soft" data-sound="'+esc(bingo.last||'')+'" '+(bingo.last&&!reel.spinning?'':'disabled')+'>'+headsetIcon+' 소리 확인</button></div></div><div class="ogd-caller-side"><span class="s6-swap-progress">'+bingo.game+'판 · 나온 단어 '+bingo.called.length+' / '+BINGO_POOL.length+'</span>'+people+'<div class="ogd-history">'+(bingo.called.length?bingo.called.map((w,i)=>'<span class="'+(i===bingo.called.length-1?'last':'')+'"><small>'+esc(bingo.readers[i]||'')+'</small>'+redVowel(w)+'</span>').join(''):'<em>나온 단어와 읽은 아이가 여기에 쌓여요.</em>')+'</div><div class="ogd-row"><button type="button" class="ogd-soft" data-bingo-skip '+(reel.spinning?'disabled':'')+'>차례 넘기기</button><button type="button" class="ogd-soft" data-bingo-undo '+(bingo.called.length&&!reel.spinning?'':'disabled')+'>되돌리기</button><button type="button" class="ogd-soft" data-bingo-new '+(reel.spinning?'disabled':'')+'>새 판</button></div></div></div>';
    }
    const board=bingoBoard(),marks=new Set(state.bingoMarks.map(w=>board.indexOf(w)).filter(i=>i>=0)),lines=bingoLines(marks);
    const cells=board.map((w,i)=>{
      if(w==='FREE')return '<div class="ogd-cell free"><span>FREE</span></div>';
      const look=wordLook(w),open=isOpen(w),on=marks.has(i);
      return '<button type="button" class="ogd-cell '+(on?'on ':'')+(open?'open':'locked')+'" data-bingo-cell="'+w+'" style="--cell-bg:'+look.colors[0]+';--cell-fg:'+look.colors[1]+';font-family:'+look.font.replace(/"/g,'&quot;')+',sans-serif" aria-label="'+w+(on?' 표시함':'')+'"><span>'+w+'</span>'+(on?'<i class="ogd-stamp'+(w===state.bingoJustStamped?' fresh':'')+'" style="--stamp-turn:'+(((i*37)%17)-8)+'deg" aria-hidden="true"></i>':'')+'</button>';
    }).join('');
    const msg=lines>=3?'빙고 세 줄 완성! BINGO!':state.bingoMsg||(lines?'빙고 '+lines+'줄! 계속 찾아봐요.':bingo.spin&&!reel.spinning?'<span class="ogd-note">판마다 단어가 달라요.<br>내 판에 없으면 다음 룰렛을 기다려요.</span>':'');
    return '<div class="ogd-bingo"><div class="ogd-bingo-board">'+cells+'</div><div class="ogd-bingo-side">'+reelHtml()+turnHtml()+(myTurn()&&!reel.spinning?spinBtn('내 차례! 룰렛 돌리기','mine'):'')+'<div class="ogd-lines"><b>'+lines+'</b><small>/ 3줄</small><span class="ogd-line-dots">'+[0,1,2].map(i=>'<i class="'+(i<lines?'on':'')+'"></i>').join('')+'</span></div><div class="s6-feedback '+(lines?'good':state.bingoMsg?'retry':'')+'" role="status">'+msg+'</div></div></div>';
  }
  /* ================= ② 낱말 공방(CVC) ================= */
  function buildSlot(value,position){
    const labels=['첫소리','모음','끝소리'];
    return '<button type="button" class="s6forge-slot '+(value?'filled ':'')+(position===1?'vowel':'')+'" data-build-slot="'+position+'" '+(value?'':'disabled')+'><small>'+labels[position]+'</small><strong>'+(value?esc(value):'?')+'</strong></button>';
  }
  function buildJelly(step,enabled){
    return '<button type="button" class="s6forge-jelly '+(enabled?'ready':'')+'" data-build-merge="'+step+'" '+(enabled?'':'disabled')+' aria-label="'+(step===1?'모음과 끝소리 합치기':'첫소리와 뒤의 소리 합치기')+'"><img src="assets/images/jelly-merge-3d.png" alt=""><span>'+step+'</span></button>';
  }
  function buildAssembly(){
    const s=state.buildSlots,stage=state.buildStage,whole=s.join(''),rime=s[1]+s[2];
    if(stage===2)return '<div class="s6forge-assembly complete"><button type="button" class="s6forge-whole" data-build-unmerge><strong>'+redVowel(whole)+'</strong><small>눌러서 다시 나누기</small></button></div>';
    if(stage===1)return '<div class="s6forge-assembly joined">'+buildSlot(s[0],0)+buildJelly(2,Boolean(s[0]))+'<button type="button" class="s6forge-open" data-build-part="'+rime+'"><small>뒤의 두 소리</small><strong>'+redVowel(rime)+'</strong></button></div>';
    return '<div class="s6forge-assembly">'+buildSlot(s[0],0)+buildJelly(2,false)+buildSlot(s[1],1)+buildJelly(1,Boolean(s[1]&&s[2]))+buildSlot(s[2],2)+'</div>';
  }
  function vBuild(){
    const target=BUILD_WORDS.find(x=>x.word===state.buildTarget),made=new Set(state.buildMade);
    const cards=BUILD_WORDS.map(x=>'<button type="button" class="s6forge-picture '+(state.buildTarget===x.word?'selected ':'')+(made.has(x.word)?'done':'')+'" data-build-target="'+x.word+'" aria-label="그림 카드, 눌러서 소리 듣기">'+(sup('build.mode')==='sound'?'<span class="ogd-build-ear">'+headsetIcon+'<b>'+(BUILD_WORDS.indexOf(x)+1)+'</b></span>':art(x.word))+(made.has(x.word)?'<i aria-hidden="true">✓</i>':'')+'</button>').join('');
    const banks=BUILD_BANKS.map((values,pos)=>'<div class="s6forge-bank '+(pos===1?'vowel':'')+'"><strong>'+['첫소리','모음','끝소리'][pos]+'</strong><div>'+values.map(value=>'<button type="button" class="'+(state.buildSlots[pos]===value?'selected':'')+'" data-build-choice="'+value+'" data-build-pos="'+pos+'" '+(target?'':'disabled')+'>'+value+'</button>').join('')+'</div></div>').join('');
    const feedback=state.feedback==='correct'?'<div class="s6forge-feedback good" role="status"><b>'+redVowel(state.buildSlots.join(''))+'</b> 완성! 젤리로 세 소리를 합쳤어요.</div>':state.feedback==='retry'?'<div class="s6forge-feedback retry" role="status">목표 그림과 달라요. 완성 낱말을 눌러 다시 나눠 보세요.</div>':'<div class="s6forge-feedback" role="status">'+(target?'소리를 놓고 1번 젤리부터 눌러요.':'먼저 그림을 눌러 목표 낱말을 들어요.')+'</div>';
    return '<div class="s6forge"><div class="s6forge-top"><span>완성한 낱말 '+made.size+' / '+BUILD_WORDS.length+'</span><div class="s6forge-pictures">'+cards+'</div></div>'+buildAssembly()+'<div class="s6forge-banks">'+banks+'</div>'+feedback+'</div>';
  }
  /* ================= ③ 새 소리 소개 ================= */
  function vIntro(){
    const x=consonants[cur().c],n=x.letter.length,at=Math.max(0,x.word.toLowerCase().indexOf(x.letter.toLowerCase()));
    return '<div class="s6-sound-intro s6-sound-intro-tabs s6-intro-no-tabs"><header><h1>소리를 잘 듣고 같은 입모양으로 따라해봐요.</h1></header><section class="s6-intro-feature"><div class="s6-intro-feature-visual"><div class="s6-intro-symbol"><button type="button" class="s6-intro-phoneme" data-sound="'+x.letter+'" data-kind="phoneme">'+pair(x.letter,'intro')+'</button></div>'+slot(x.jelly[0],x.jelly[1],'s6-intro-jelly')+'<div class="s6-intro-word"><button type="button" class="s6-intro-word-sound" data-sound="'+x.word+'">'+esc(x.word.slice(0,at))+'<span class="s6-target-letter">'+esc(x.word.slice(at,at+n))+'</span>'+esc(x.word.slice(at+n))+'</button></div></div><div class="s6-intro-feature-info"><div class="s6-intro-mouth"><b>입모양</b><span>'+x.mouth+'</span></div><div class="s6-intro-motion"><span class="s6-mouth-zoom">'+slot(x.motion[0],x.motion[1])+'</span><span>'+x.action+'</span></div></div></section></div>';
  }
  /* ================= ④ 첫소리 ch / j ================= */
  // 보기 수: 문항대로 또는 2·3·4개(정답 + 다른 소리를 문항마다 같은 순서로 섞음)
  function firstChoices(x){
    const c=sup('first.choices');if(c==='item')return x.choices;
    const n=Math.min(Number(c)||x.choices.length,S.FIRST_KEYS.length);
    const others=S.FIRST_KEYS.filter(k=>k!==x.answer).sort((a,b)=>hashId(x.word+a)<hashId(x.word+b)?-1:1).slice(0,n-1);
    return [x.answer,...others].sort((a,b)=>hashId(x.word+'o'+a)<hashId(x.word+'o'+b)?-1:1);
  }
  function vFirst(){
    const n=idx('first'),x=firstSound[n];
    return '<div class="s6-letter-quiz">'+pill((n+1)+' / '+firstSound.length)+'<button type="button" class="s6-letter-picture" data-sound="'+x.word+'">'+art(x.word)+'</button><div class="s6-answer-row">'+firstChoices(x).map(v=>'<button data-select="'+v+'" class="'+(state.selected[0]===v?'selected':'')+'" '+(state.feedback==='correct'?'disabled':'')+'>'+pair(v,'choice')+'</button>').join('')+'</div></div>'+checkBtn(!!state.selected.length)+fb(S.text.firstGood||((S.text.firstNav||'').startsWith('끝소리')?'끝소리를 찾았어요!':'첫소리를 찾았어요!'),S.text.firstRetry||((S.text.firstNav||'').startsWith('끝소리')?'끝소리만 떼어 다시 들어 봐요. 왼쪽 소리 단추로 비교해도 좋아요.':'첫소리만 떼어 다시 들어 봐요. 왼쪽 소리 단추로 비교해도 좋아요.'),false);
  }
  // ④ 코치 칸 글자 단추: 누르면 소리 + 작은 팝업으로 소리 특징
  const KEY_TIPS=S.KEY_TIPS;
  let keyTipTimer=null;
  function showKeyTip(button){
    const box=button.closest('.ogd-sound-keys'),key=button.dataset.keyTip,tip=KEY_TIPS[key];if(!box||!tip)return;
    box.querySelector('.ogd-key-tip')?.remove();
    const col=[...box.querySelectorAll('[data-key-tip]')].indexOf(button)%2;
    box.insertAdjacentHTML('afterbegin','<div class="ogd-key-tip '+(col?'right':'left')+'" role="status"><b>'+tip[0]+'</b><span>'+tip[1]+'</span></div>');
    const panel=box.closest('.s6-coach-panel');panel?.classList.add('ogd-tip-on');
    clearTimeout(keyTipTimer);keyTipTimer=setTimeout(()=>{box.querySelector('.ogd-key-tip')?.remove();panel?.classList.remove('ogd-tip-on')},4000);
  }
  /* ================= ③-4 ch? tch? ================= */
  function vTch(){
    const n=idx('tch'),x=TCH[n],done=state.feedback==='correct';
    const blank=x.blank.split('_');
    const shown=done?redVowel(x.word):'<span class="s6x-w">'+esc(blank[0])+'<span class="ogd-blank">?</span>'+esc(blank[1])+'</span>';
    return '<div class="s6-letter-quiz ogd-tch">'+pill((n+1)+' / '+TCH.length+(x.except?' · 예외 단어':''))+'<button type="button" class="ogd-word-card" data-sound="'+x.word+'">'+headsetIcon+'<strong>'+shown+'</strong></button><div class="s6-answer-row ogd-real-choices">'+S.SPELL_CHOICES.map(v=>'<button data-select="'+v+'" class="'+(state.selected[0]===v?'selected':'')+'" '+(done?'disabled':'')+'><b class="ogd-dg">'+v+'</b></button>').join('')+'</div></div>'+checkBtn(!!state.selected.length)+fb(S.text.spellGood(x),S.text.spellRetry(x));
  }
  /* ================= ⑤-1 글자·소리·박자 한 흐름 =================
     0 글자 세기(글자 타일이 보임) → 소리 몇 개? / 1 소리 상자 톡톡 / 2 다시 합치기 / 3 박수 몇 번? / 4 정리 */
  // 소리 조각 ↔ 한글 소리 짝 (short a ≈ ㅐ, short i ≈ ㅣ) + 한 글자로 모은 모양
  const TAP_KO=S.TAP_KO||{};
  function vTap(){
    const n=idx('tap'),word=TAP_WORDS[n],parts=units(word),ko=sup('tap.ko')==='off'?[]:(TAP_KO[word]||[]),showLetters=sup('tap.letters')!=='hide',step=state.tapStep,lit=new Set(state.tapLit),allLit=lit.size===parts.length;
    const steps=['글자','소리 조각','합치기','박자'].map((t,i)=>'<i class="'+(i<step?'done':i===step?'now':'')+'">'+(i+1)+' '+t+'</i>').join('');
    const letters='<div class="ogd-letters" aria-label="글자 '+word.length+'개">'+word.split('').map(c=>'<span class="'+(VOWELS.test(c)?'v':'')+'">'+c+'</span>').join('')+'<em>글자 '+word.length+'개</em></div>';
    const boxes=(merged=false)=>'<div class="ogd-boxes '+(merged?'merged':'')+'" aria-label="소리 조각 상자">'+parts.map((u,i)=>'<button type="button" class="ogd-box '+(u.length>1?'dg ':'')+(VOWELS.test(u)?'v ':'')+(lit.has(i)||merged?'lit':'')+'" data-tap-box="'+i+'" '+(merged?'disabled':'')+'><span>'+u+'</span>'+(merged?'':'<small>'+(i+1)+'</small>')+(ko[i]&&(lit.has(i)||merged)?'<em class="ogd-ko">'+ko[i]+'</em>':'')+'</button>').join('')+'</div>';
    const koBlock=()=>ko.length?'<div class="ogd-ko-block"><span>'+ko.slice(0,3).join(' ')+'</span><i>→</i><b>'+ko[3]+'</b></div>':'';
    const choice=(vals,unit)=>'<div class="s6-answer-row s6x-ox ogd-count">'+vals.map(v=>'<button data-select="'+v+'" class="'+(state.selected[0]===String(v)?'selected':'')+'"><b>'+v+'</b><small>'+unit+'</small></button>').join('')+'</div>';
    let body='',action='',msg='';
    if(step===0){body=(showLetters?letters+'<p class="ogd-q">글자는 '+word.length+'개! 소리 조각은 몇 개일까요? 손가락으로 톡톡!</p>':'<button type="button" class="ogd-word-card" data-sound="'+word+'">'+headsetIcon+'<strong>?</strong><small>눌러서 낱말 듣기</small></button><p class="ogd-q">낱말을 듣고, 소리 조각은 몇 개일까요? 손가락으로 톡톡!</p>')+choice([2,3,4,5],'조각');action=checkBtn(!!state.selected.length);msg=state.feedback==='retry'?(parts.some(u=>u.length>1)?'여러 글자가 소리 조각 하나가 될 때가 있어요. 천천히 다시 톡톡!':'소리 조각을 하나씩 다시 세어 봐요.'):''}
    else if(step===1){body=boxes()+'<p class="ogd-q">상자를 차례로 눌러 소리 조각을 말해요. 한글 소리와 짝지어 봐요!</p>';action=allLit?'<button class="s6-primary" data-tap-merge>다시 합치기</button>':'';msg=parts.some(u=>u.length>1)?'<b>'+parts.find(u=>u.length>1)+'</b>는 글자 '+parts.find(u=>u.length>1).length+'개가 소리 조각 하나!':''}
    else if(step===2){body=boxes(true)+'<div class="ogd-merge-row"><button type="button" class="ogd-word-card ogd-merged-word" data-sound="'+word+'">'+headsetIcon+'<strong>'+redVowel(word)+'</strong></button>'+koBlock()+'</div>';action='<button class="s6-primary" data-tap-beat>박자 세기</button>';msg='소리 조각 '+parts.length+'개를 붙이면 입을 한 번 벌려 말하는 <b>한 덩어리</b>!'}
    else if(step===3){body='<button type="button" class="ogd-word-card ogd-merged-word" data-sound="'+word+'">'+headsetIcon+'<strong>'+redVowel(word)+'</strong></button><p class="ogd-q">덩어리를 말하며 박수! 몇 번 쳤나요?</p>'+choice([1,2,3],'박자');action=checkBtn(!!state.selected.length);msg=state.feedback==='retry'?'입을 몇 번 벌려 말하는지 들어 봐요.':''}
    else{body='<div class="ogd-sum"><span><b>'+word.length+'</b>글자</span><span><b>'+parts.length+'</b>소리 조각</span><span><b>1</b>박자</span></div><div class="ogd-merge-row"><button type="button" class="ogd-word-card ogd-merged-word" data-sound="'+word+'">'+headsetIcon+'<strong>'+redVowel(word)+'</strong></button>'+koBlock()+'</div>';action='<button class="s6-primary" data-item-next>'+(n<TAP_WORDS.length-1?'다음 낱말':'활동 마치기')+'</button>';msg=ko.length?'「'+ko[3]+'」도 '+ko.slice(0,3).join('·')+' 소리 조각 '+parts.length+'개가 모여 한 글자 = 한 박자!':'소리 조각은 여럿, 박자는 하나!'}
    return '<div class="s6-letter-quiz ogd-tap">'+pill((n+1)+' / '+TAP_WORDS.length)+'<div class="s6x-steps ogd-flow">'+steps+'</div>'+body+'</div><div class="ogd-tap-foot">'+action+'<div class="s6-feedback '+(state.feedback==='retry'?'retry':step>=1&&msg?'good':'')+'" role="status">'+msg+'</div></div>';
  }
  /* ================= ⑥-0 낱말-그림 짝 ================= */
  function vPic(){
    const n=idx('pic'),x=PIC[n],done=state.feedback==='correct';
    return '<div class="s6-letter-quiz ogd-pic">'+pill((n+1)+' / '+PIC.length)+'<p class="ogd-q">'+(sup('pic.audio')==='off'?'낱말을 읽고 맞는 그림을 골라요.':'이 낱말과 맞는 그림은? 그림을 누르면 소리가 나요.')+'</p>'+(state.picSplit?'<div class="ogd-pic-split" aria-label="소리 조각">'+units(x.word).map(u=>'<button type="button" class="ogd-box '+(u.length>1?'dg ':'')+(VOWELS.test(u)?'v':'')+'" data-pic-unit="'+u+'"><span>'+u+'</span></button>').join('')+'<button type="button" class="ogd-pic-join" data-pic-join aria-label="다시 붙이기">↺</button></div>':(sup('pic.hint')==='off'?'<div class="ogd-pic-word">'+redVowel(x.word)+'</div>':'<button type="button" class="ogd-pic-word" data-pic-split title="누르면 소리 조각으로 나뉘어요 (힌트)">'+redVowel(x.word)+'<small>힌트</small></button>'))+'<div class="ogd-pic-grid">'+x.pics.map(w=>'<button type="button" class="s6-picture ogd-pic-card '+(state.selected[0]===w?'selected ':'')+(done&&w===x.word?'good':'')+'" data-pic="'+w+'" aria-label="그림 소리 듣고 고르기" '+(done?'disabled':'')+'>'+art(w)+(sup('pic.audio')==='off'?'':'<i class="ogd-pic-ear" aria-hidden="true">'+headsetIcon+'</i>')+'</button>').join('')+'</div></div>'+checkBtn(!!state.selected.length)+fb('맞아요! 「'+x.word+'」 그림이에요.','세 그림 소리를 다시 들어 보고, 낱말을 한 소리씩 읽어 봐요.');
  }
  /* ================= ⑥-1 외계어 스파이 ================= */
  // 팝업 낱말: 회차 목표 ch만 빨강(tch는 ch 부분만)
  function spyPopup(){
    const pd=spy.pending;if(!pd)return '';
    const w=spy.board[pd.i].w,mine=pd.key===spyMyKey()&&!isCoach,canConfirm=isCoach||!inRoom();
    const act=canConfirm?'<div class="ogd-spy-pop-act"><button type="button" class="ogd-soft" data-spy-cancel>다시 고르기</button>'+(isCoach?'<button type="button" class="ogd-soft" data-spy-ok="support">도와서 읽었어요</button>':'')+'<button type="button" class="s6-primary" data-spy-ok="independent">'+(isCoach?'혼자 읽었어요 · 뒤집기':'읽었어요 · 뒤집기')+'</button></div>':'<p class="ogd-spy-pop-wait">'+(mine?'소리 내어 또박또박 읽어요! 코치가 확인하면 뒤집혀요.':'친구가 읽는 소리를 들어 봐요.')+'</p>';
    return '<div class="ogd-spy-pop" role="dialog" aria-live="assertive"><div class="ogd-spy-pop-card"><small>'+(mine?'내가 고른 낱말':esc(pd.by)+' 친구가 고른 낱말')+'</small><strong>'+markTarget(w,'ogd-target')+'</strong>'+act+'</div></div>';
  }
  function vReal(){
    if(!spy.board)return '<div class="ogd-spy"><div class="ogd-spy-wait">🛸 코치가 게임을 시작하면 판이 나타나요…</div></div>';
    const found=spyFound(),win=found>=SPY_GOAL,left=Math.max(0,spy.limit-spyUsed());
    const tiles=spy.board.map((t,i)=>{const f=spy.flipped[i],show=f||(isCoach&&spyReveal)||win&&t.c==='alien',picked=spy.pending&&spy.pending.i===i;return '<button type="button" class="ogd-spy-tile '+(show?'flipped '+t.c:'')+(isCoach&&spyReveal&&!f?' peek':'')+(picked?' picked':'')+'" data-spy="'+i+'" '+(f?'disabled':'')+'><span>'+esc(t.w)+'</span>'+(f&&f.by?'<small>'+esc(f.by)+'</small>':'')+'</button>'}).join('');
    const msg=win?'🎉 외계어 10개를 모두 찾았어요! 우리 팀 승리!':spyLocalMsg||(isCoach?'아이가 고르면 팝업이 떠요. 정확히 읽으면 뒤집어 주세요.':'소리 내어 읽고, 외계어라고 생각되면 눌러요!');
    const coachCtl=isCoach?'<div class="ogd-spy-ctl"><div class="ogd-size"><span>1인당 기회</span><button type="button" data-spy-limit="-1" aria-label="기회 줄이기">−</button><b>'+spy.limit+'번</b><button type="button" data-spy-limit="1" aria-label="기회 늘리기">+</button></div><div class="ogd-row"><button type="button" class="ogd-soft" data-spy-new>새 판</button><button type="button" class="ogd-soft" data-spy-reveal>'+(spyReveal?'정답 숨기기':'정답 보기')+'</button></div></div>':'<div class="ogd-spy-left"><span>내 남은 기회</span><b class="'+(left?'':'zero')+'">'+left+'</b></div>';
    return '<div class="ogd-spy '+(win?'win':'')+'"><div class="ogd-spy-board">'+tiles+spyPopup()+'</div><div class="ogd-spy-side"><div class="ogd-spy-score"><span>👽 찾은 외계어</span><b>'+found+'</b><small>/ '+SPY_GOAL+'</small></div><div class="ogd-spy-bar"><i style="width:'+(found/SPY_GOAL*100)+'%"></i></div><div class="ogd-spy-legend"><span class="alien">외계어</span><span class="real">진짜 낱말</span></div>'+coachCtl+'<div class="s6-feedback '+(win||/발견/.test(msg)?'good':/진짜|모두 썼|기다려/.test(msg)?'retry':'')+'" role="status">'+msg+'</div></div></div>';
  }
  /* ================= ⑥-2 보드 게임 ================= */
  /* ================= ⑨ 그림판 (코치 자유 활용) ================= */
  const drawBoard=createDrawBoard({isCoach,inRoom,hash:hashId,myKey:()=>hashId(myId()||'solo'),myName:()=>clean(isCoach?'코치':(myId()||'나'),20),
    share:(topic,v)=>window.ONQ_RUNTIME_V1?.share?.(topic,v),onShared:(topic,fn)=>window.ONQ_RUNTIME_V1?.onShared?.(topic,fn)||(()=>{})});
  let stopDrawSharing=null;
  const connectDraw=()=>{const rt=window.ONQ_RUNTIME_V1;if(!rt?.onShared||stopDrawSharing)return;stopDrawSharing=rt.onShared('draw',v=>drawBoard.applyMaster(v));drawBoard.watch(window.ONQ_COACH_LEARNERS)};
  window.addEventListener('oncuvate:runtime-ready',connectDraw);
  window.addEventListener('oncuvate:learners',e=>drawBoard.watch(e.detail));
  function vDraw(){return '<div class="ogd-draw" data-draw-host></div>'}
  /* ================= ⑦ 점핑워드 ================= */
  const jumpGame=createJumpingWords({policy:()=>({easy:sup('jump.easy'),speed:sup('jump.speed')}),words:JUMP_WORDS,sprite:'assets/images/jelly-merge-3d.png',wordHtml:w=>markTarget(w,'ogd-dg'),speak,
    onCatch:w=>trials.event('jump','catch',{word:w})||window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'answer',activityId:'jump',itemId:w,response:'catch',correct:true}})),
    onMiss:w=>trials.event('jump','miss',{word:w})||window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'jump-miss',activityId:'jump',itemId:w}})),
    onFinish:r=>trials.event('jump','finish',r)||window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'jump-finish',activityId:'jump',itemId:r.mode,response:JSON.stringify(r)}}))});
  function vJump(){return '<div class="ogd-jump" data-jump-host></div>'}
  /* ================= ⑧ 문장 만들기 ================= */
  const sentenceWord=(x,i)=>{const s=x.slots[i],choice=state.sentenceChoices[i]||0;return s.options[choice%s.options.length]};
  const sentenceText=x=>x.parts.map(part=>typeof part==='number'?sentenceWord(x,part):part).join('');
  const applySharedSentence=value=>{
    if(!value||typeof value!=='object'||typeof value.text!=='string')return;
    sharedSentence={frame:Math.max(0,Number(value.frame)||0),text:value.text.replace(/\s+/g,' ').trim().slice(0,120)};
    if(cur()?.view==='sentence')render();
  };
  const connectSentenceSharing=()=>{
    const runtime=window.ONQ_RUNTIME_V1;
    if(!runtime?.onShared||stopSentenceSharing)return;
    stopSentenceSharing=runtime.onShared('sentence',applySharedSentence);
  };
  window.addEventListener('oncuvate:runtime-ready',connectSentenceSharing);
  function vSentence(){
    const n=idx('sentence'),x=sentences[n],made=state.feedback==='created';
    const line=x.parts.map(part=>{if(typeof part!=='number')return '<span class="s6make-static">'+markTarget(part,'ogd-dg')+'</span>';const s=x.slots[part],choice=state.sentenceChoices[part]||0,word=sentenceWord(x,part);return '<span class="s6make-slot"><i aria-hidden="true"></i><button type="button" class="s6make-word" data-toggle="'+part+'" aria-label="'+(part+1)+'번째 낱말 바꾸기" '+(made?'disabled':'')+'>'+redVowel(word)+'</button><small>'+s.options.map((_,i)=>i===choice%s.options.length?'●':'○').join('')+'</small></span>'}).join('');
    const action=made?'<div class="s6make-actions"><button type="button" class="s6make-reset" data-sentence-reset>다시 만들기</button><button type="button" class="s6-primary" data-sentence-next>'+(n<sentences.length-1?'다음 문장 틀':'활동 마치기')+'</button></div>':'<button type="button" class="s6make-create" data-sentence-make><i aria-hidden="true"></i>생성하기</button>';
    const shared=sharedSentence?'<aside class="s6make-shared" role="status"><span>우리 반에 공유된 문장</span><b>'+esc(sharedSentence.text)+'</b></aside>':'';
    return '<div class="s6make '+(made?'is-made':'')+'"><header><span>문장 만들기 · MAKE</span><em>'+(n+1)+' / '+sentences.length+' · 답이 정해져 있지 않아요</em></header><p class="s6make-guide">밑줄 낱말을 눌러 바꾸고, 마음에 들면 생성해요.</p><section class="s6make-card"><div class="s6make-line">'+line+'</div>'+action+shared+'<p class="s6make-status" role="status">'+(made?'내가 고른 낱말로 문장이 완성됐어요!':'어떤 조합을 골라도 좋아요.')+'</p></section></div>';
  }

  const bodies={draw:vDraw,pic:vPic,tch:vTch,bingo:vBingo,build:vBuild,intro:vIntro,first:vFirst,tap:vTap,real:vReal,jump:vJump,sentence:vSentence};
  const play=(snd,kind,label='Play')=>'<div class="s6-memory-actions"><button type="button" class="s6-memory-listen" data-sound="'+esc(snd)+'" data-kind="'+kind+'">'+headsetIcon+'<b>'+label+'</b></button></div>';
  function guide(p){
    if(p.view==='first'&&sup('first.keys')!=='off')return '<div class="ogd-sound-keys">'+S.FIRST_KEYS.map(l=>'<button type="button" data-sound="'+l+'" data-kind="phoneme" data-key-tip="'+l+'">'+pair(l)+'</button>').join('')+'</div>';
    if(p.view==='tch'){const r=sup('spell.rule');return r==='show'?S.text.spellRule:r==='peek'?'<div class="ogd-rule-peek" data-rule-peek-box><button type="button" class="ogd-soft" data-rule-peek>📋 규칙 보기</button></div>':''}
    if(p.view==='sentence'&&state.feedback==='created')return play(sentenceText(sentences[idx('sentence')]),'sentence','내 문장 듣기');
    return '';
  }
  function helpItem(p){
    if(p.view==='real')return 'found-'+spyFound();
    if(p.view==='jump')return jumpGame.getState().phase+'-'+jumpGame.getState().caught;
    if(['first','tch','tap','pic','sentence'].includes(p.view))return 'q-'+(idx(p.view)+1);
    if(p.view==='elkonin')return 'q-'+(jellyLab.getState().index+1);
    if(p.view==='build')return state.buildTarget||'choose-word';
    if(p.view==='bingo')return 'called-'+bingo.called.length;
    return p.id;
  }
  function helpComplete(p){
    if(p.view==='bingo')return !isCoach&&bingoLines(new Set(state.bingoMarks.map(w=>bingoBoard().indexOf(w))))>=3;
    if(p.view==='sentence')return state.feedback==='created';
    if(p.view==='tap')return state.tapStep===4;
    if(p.view==='jump')return jumpGame.getState().phase==='end';
    if(p.view==='draw')return true;   // 자유 활동: 도움말을 띄우지 않음
    if(p.view==='real')return spyFound()>=SPY_GOAL;
    return state.feedback==='correct'||(p.view==='elkonin'&&jellyLab.getState().feedback==='correct');
  }
  function activityProgress(p){
    if(p.view==='bingo')return{index:bingo.called.length,total:BINGO_POOL.length};
    const totals={tch:TCH.length,first:firstSound.length,tap:TAP_WORDS.length,real:SPY_GOAL,pic:PIC.length,elkonin:LAB_TARGETS.length,build:BUILD_WORDS.length,sentence:sentences.length,intro:10};
    if(p.view==='real')return{index:spyFound(),total:SPY_GOAL};
    if(p.view==='jump')return{index:jumpGame.getState().caught,total:20};
    const total=totals[p.view]||1,key=p.view==='elkonin'?jellyLab.getState().index:p.view==='build'?state.buildMade.length:idx(p.view);
    return{index:Math.min(total,key+1),total};
  }
  const bubbles={
    bingo:'룰렛에서 나온 단어를 찾아봐!',build:'그림을 고르고 1번 젤리부터 눌러 소리를 합쳐봐!',
    first:'글자를 눌러 소리를 확인해봐!',tch:S.text.spellBubble,tap:'글자 수와 소리 조각 수는 달라요. 조각을 붙이면 한 박자!',
    elkonin:'낱말을 듣고 맞는 소리 젤리 두 개를 가까이 붙여봐!',pic:'먼저 낱말을 읽고, 그림을 눌러 소리를 비교해봐!',real:'소리 내어 읽고 외계어를 찾아봐!',
    jump:'젤리가 하늘에 닿기 전에 잡아! 나타난 낱말을 읽어봐!',sentence:'밑줄 낱말을 눌러 바꾸고, 네 문장을 만들어봐!'
  };
  function render(){
    if(!$('#s6Stage'))return;   // 표지 화면(수업 시작 전)에 명단·공유 값이 와도 그리지 않음
    const p=cur();
    const coach='<img class="s6-coach-image" src="assets/images/jelly-coach-listening-3d.png" alt="">';
    const coachPanel=coach+'<p class="s6-coach-bubble">'+bubbles[p.view]+'</p>'+guide(p);
    const jellyActivity='<article class="s6-coach-layout s6-top-instruction-layout ocj-full-layout"><h2 class="s6-activity-instruction">'+esc(p.instruction)+'</h2><section class="s6-work-panel"><div class="s6-activity">'+jellyLab.html()+'</div></section></article>';
    $('#s6Stage').innerHTML=p.view==='intro'?'<article class="s6-intro-layout">'+vIntro()+'</article>':p.view==='elkonin'?jellyActivity:(p.view==='bingo'||p.view==='real'||p.view==='jump'||p.view==='draw')?'<article class="s6-coach-layout s6-top-instruction-layout ocj-full-layout"><h2 class="s6-activity-instruction">'+esc(p.instruction)+'</h2><section class="s6-work-panel"><div class="s6-activity s6x-'+p.view+'-wrap">'+(p.view==='real'?vReal():p.view==='jump'?vJump():p.view==='draw'?vDraw():vBingo())+'</div></section></article>':'<article class="s6-coach-layout s6-top-instruction-layout"><h2 class="s6-activity-instruction">'+esc(p.instruction)+'</h2><section class="s6-coach-panel">'+coachPanel+'</section><section class="s6-work-panel"><div class="s6-activity s6x-'+p.view+'-wrap">'+bodies[p.view]()+'</div></section></article>';
    const activity=activityProgress(p),stage=$('#s6Stage');stage.dataset.activityId=p.id;stage.dataset.itemId=helpItem(p);stage.dataset.itemIndex=activity.index;stage.dataset.itemTotal=activity.total;stage.dataset.activityLabel=p.nav;
    $('.s6-phase').textContent=p.phase;$('.s6-minute').textContent=p.min?p.min+'분':'자유';$('.s6-count').textContent=(state.page+1)+' / '+pages.length;$('.s6-main header i b').style.width=((state.page+1)/pages.length*100)+'%';
    $('[data-prev]').disabled=state.page===0;$('[data-next]').disabled=state.page===pages.length-1;
    state.menuGroup=groupFor(state.page);updateMenu();
    if(isCoach&&$('.s6-coach-chat'))$('.s6-coach-chat').textContent=p.instruction;
    wire(p);
    trialBegin(p);
    window.S6Help?.activate({activityId:p.id,itemId:helpItem(p),complete:helpComplete(p)});
  }
  function wire(p){
    if(p.view==='intro')window.OGSoundRadar.launch({stopAudio,speak,letter:consonants[p.c].letter,bank:S.RADAR,question:S.text.radarQuestion,yes:S.text.radarYes,no:S.text.radarNo});
    const glow=b=>{b.classList.remove('s6-sound-active');void b.offsetWidth;b.classList.add('s6-sound-active')};
    $$('[data-sound]').forEach(b=>{b.onclick=e=>{e.stopPropagation();glow(b);speak(b.dataset.sound,b.dataset.kind||'word')}});
    $('[data-item-next]')?.addEventListener('click',()=>nextItem({first:firstSound,tch:TCH,tap:TAP_WORDS,pic:PIC}[p.view].length));
    const judge=(ok,response='')=>{trials.respond(response,ok);window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'answer',activityId:p.id,itemId:helpItem(p),response:String(response),correct:ok}}));state.feedback=ok?'correct':'retry';if(ok)playSuccessTone();render();if(!ok)window.S6Help?.wrong();if(p.view==='first'&&ok)scheduleFirstAdvance()};

    if(p.view==='bingo'){
      $('[data-bingo-spin]')?.addEventListener('click',spinBingo);
      $$('[data-bingo-size]').forEach(b=>b.onclick=()=>shareBingo({...bingo,size:bingo.size+Number(b.dataset.bingoSize)}));
      $('[data-bingo-skip]')?.addEventListener('click',()=>shareBingo({...bingo,turn:bingo.turn+1}));
      $('[data-bingo-undo]')?.addEventListener('click',()=>{const called=bingo.called.slice(0,-1);shareBingo({...bingo,called,readers:bingo.readers.slice(0,-1),last:called[called.length-1]||null,spin:Math.max(0,bingo.spin-1),turn:Math.max(0,bingo.turn-1)})});
      $('[data-bingo-new]')?.addEventListener('click',()=>shareBingo({...bingo,game:bingo.game+1,called:[],readers:[],last:null,spin:0,turn:0}));
      if(isCoach&&Array.isArray(window.ONQ_COACH_LEARNERS))setTimeout(()=>syncRoster(window.ONQ_COACH_LEARNERS));
      $$('[data-bingo-cell]').forEach(b=>b.onclick=()=>{
        const w=b.dataset.bingoCell,fbEl=$('.ogd-bingo .s6-feedback');
        if(!isOpen(w)){state.bingoMsg='룰렛에서 나온 단어만 표시할 수 있어요.';b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');if(fbEl){fbEl.textContent=state.bingoMsg;fbEl.className='s6-feedback retry'}return}
        const idxOf=x=>bingoBoard().indexOf(x),had=state.bingoMarks.includes(w),before=bingoLines(new Set(state.bingoMarks.map(idxOf)));
        state.bingoMarks=had?state.bingoMarks.filter(x=>x!==w):[...state.bingoMarks,w];state.bingoMsg='';state.bingoJustStamped=had?'':w;
        if(!had)window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'answer',activityId:'bingo',itemId:w,response:w,correct:true}}));
        if(bingoLines(new Set(state.bingoMarks.map(idxOf)))>before)playSuccessTone();
        render();
      });
    }
    $('[data-rule-peek]')?.addEventListener('click',()=>{const box=$('[data-rule-peek-box]');if(!box)return;box.innerHTML=S.text.spellRule;window.S6Help?.manual?.('A2','request');setTimeout(()=>{if(box.isConnected)box.innerHTML='<button type="button" class="ogd-soft" data-rule-peek>📋 규칙 보기</button>',box.querySelector('[data-rule-peek]')?.addEventListener('click',()=>render())},3000)});
    if(p.view==='first')$$('[data-key-tip]').forEach(b=>b.addEventListener('click',()=>showKeyTip(b)));
    if(p.view==='pic'){
      // 힌트: 낱말을 누르면 소리 조각(ch | i | p)으로 나뉘고 조각마다 소리를 들을 수 있음 — 힌트 사용으로 기록(문항당 1번)
      $('[data-pic-split]')?.addEventListener('click',()=>{const w=PIC[idx('pic')].word;state.picSplit=true;if(!state.picHint){state.picHint=true;if(window.S6Help?.manual)window.S6Help.manual('A2','request');else window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'hint',activityId:'pic',itemId:w,helpLevel:'A2',trigger:'request',prompt:'소리 조각 나누기'}}))}render()});
      $$('[data-pic-unit]').forEach(b=>b.addEventListener('click',()=>{speak(b.dataset.picUnit,'phoneme');b.classList.remove('lit');void b.offsetWidth;b.classList.add('lit')}));
      $('[data-pic-join]')?.addEventListener('click',()=>{state.picSplit=false;render()});
      $$('[data-pic]').forEach(b=>b.addEventListener('click',()=>{if(sup('pic.audio')!=='off')speak(b.dataset.pic);if(state.feedback==='correct')return;state.selected=[b.dataset.pic];state.feedback='';render()}));
      $('[data-check]')?.addEventListener('click',()=>judge(state.selected[0]===PIC[idx('pic')].word,state.selected[0]));
    }
    if(['first','tch','tap'].includes(p.view)){
      $$('[data-select]').forEach(b=>b.onclick=()=>{if(state.feedback==='correct')return;state.selected=[b.dataset.select];state.feedback='';render()});
      $('[data-check]')?.addEventListener('click',()=>{
        const v=state.selected[0];
        if(p.view==='first')judge(v===firstSound[idx('first')].answer,v);
        else if(p.view==='tch')judge(v===TCH[idx('tch')].answer,v);
        else if(p.view==='tap'){
          const word=TAP_WORDS[idx('tap')],parts=units(word),step=state.tapStep,ok=step===0?Number(v)===parts.length:Number(v)===1;
          window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'answer',activityId:'tap',itemId:word+(step===0?'-sounds':'-beats'),response:String(v),correct:ok}}));
          trials.respond(v,ok);
          if(!ok){state.feedback='retry';render();window.S6Help?.wrong();return}
          playSuccessTone();state.tapStep=step===0?1:4;state.selected=[];state.feedback='';render();
        }
      });
    }
    if(p.view==='tap'){
      const word=TAP_WORDS[idx('tap')],parts=units(word);
      $$('[data-tap-box]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.tapBox);speak(parts[i],'phoneme');if(!state.tapLit.includes(i))state.tapLit.push(i);render()});
      $('[data-tap-merge]')?.addEventListener('click',()=>{state.tapStep=2;render();setTimeout(()=>speak(word),350)});
      $('[data-tap-beat]')?.addEventListener('click',()=>{state.tapStep=3;state.selected=[];state.feedback='';render()});
    }
    if(p.view==='elkonin')jellyLab.bind($('#s6Stage'));
    if(p.view==='build'){
      $$('[data-build-target]').forEach(b=>b.onclick=()=>{state.buildTarget=b.dataset.buildTarget;state.buildSlots=['','',''];state.buildStage=0;state.feedback='';if(sup('build.mode')!=='picture')speak(state.buildTarget);render()});
      $$('[data-build-choice]').forEach(b=>b.onclick=()=>{const pos=Number(b.dataset.buildPos),value=b.dataset.buildChoice;state.buildSlots[pos]=value;state.buildStage=0;state.feedback='';speak(value,'phoneme');render()});
      $$('[data-build-slot]').forEach(b=>b.onclick=()=>{state.buildSlots[Number(b.dataset.buildSlot)]='';state.buildStage=0;state.feedback='';render()});
      $('[data-build-part]')?.addEventListener('click',e=>speak(e.currentTarget.dataset.buildPart));
      $$('[data-build-merge]').forEach(b=>b.onclick=()=>{
        const step=Number(b.dataset.buildMerge),s=state.buildSlots;
        if(step===1&&s[1]&&s[2]){state.buildStage=1;state.feedback='';speak(s[1]+s[2]);render();return}
        if(step===2&&state.buildStage===1&&s[0]){
          const word=s.join('');state.buildStage=2;const ok=word===state.buildTarget;state.feedback=ok?'correct':'retry';trials.respond(word,ok);
          if(ok&&!state.buildMade.includes(word))state.buildMade.push(word);
          window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'answer',activityId:'build',itemId:state.buildTarget,response:word,correct:ok}}));
          speak(word);render();if(!ok)window.S6Help?.wrong();
        }
      });
      $('[data-build-unmerge]')?.addEventListener('click',()=>{state.buildStage=0;state.feedback='';render()});
    }
    if(p.view==='real'){
      spyEnsureBoard();
      $$('[data-spy]').forEach(b=>b.onclick=()=>spyPick(Number(b.dataset.spy)));
      $$('[data-spy-ok]').forEach(b=>b.addEventListener('click',()=>spyConfirm(b.dataset.spyOk)));
      $('[data-spy-cancel]')?.addEventListener('click',spyCancel);
      $$('[data-spy-limit]').forEach(b=>b.onclick=()=>shareSpy({...spy,limit:spy.limit+Number(b.dataset.spyLimit)}));
      $('[data-spy-new]')?.addEventListener('click',()=>{spyLocalMsg='';spyReveal=false;shareSpy({game:Date.now(),board:spyNewBoard(),flipped:{},picks:{},limit:spy.limit,pending:null,last:null})});
      $('[data-spy-reveal]')?.addEventListener('click',()=>{spyReveal=!spyReveal;render()});
      if(isCoach)spyWatch(window.ONQ_COACH_LEARNERS);
    }
    if(p.view==='jump')jumpGame.mount($('[data-jump-host]'));
    if(p.view==='draw'){drawBoard.start();drawBoard.mount($('[data-draw-host]'));if(isCoach)drawBoard.watch(window.ONQ_COACH_LEARNERS)}
    if(p.view==='sentence'){
      $$('[data-toggle]').forEach(b=>b.addEventListener('click',()=>{if(state.feedback==='created')return;const x=sentences[idx('sentence')],i=Number(b.dataset.toggle),s=x.slots[i];state.sentenceChoices[i]=(state.sentenceChoices[i]||0)+1;state.feedback='';speak(s.options[state.sentenceChoices[i]%s.options.length]);render()}));
      $('[data-sentence-make]')?.addEventListener('click',()=>{const frame=idx('sentence'),text=sentenceText(sentences[frame]),shared={frame,text};state.feedback='created';sharedSentence=shared;window.dispatchEvent(new CustomEvent('oncuvate:log',{detail:{type:'sentence-share',activityId:'sentence',itemId:'sentence-'+(frame+1),response:text,correct:true}}));window.ONQ_RUNTIME_V1?.share?.('sentence',shared);speak(text,'sentence');render()});
      $('[data-sentence-reset]')?.addEventListener('click',()=>{state.sentenceChoices=[0,0];state.feedback='';render()});
      $('[data-sentence-next]')?.addEventListener('click',()=>nextItem(sentences.length));
    }
  }
  if(q){shell();render();fit()}else cover();
  addEventListener('resize',fit);
  addEventListener('pagehide',cancelFirstAdvance);
})();
