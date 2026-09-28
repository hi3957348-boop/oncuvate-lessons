/* 이중자 4회차 · qu (k·w와 비교, q 뒤엔 늘 u) + x·y 복습 — 회차 데이터
   엔진(og-digraph-engine.js)은 모든 회차가 같고, 회차마다 이 파일만 바꿉니다.
   그림이 없는 낱말은 NEED의 번호로 점선 자리가 보입니다(설명에는 영어 낱말을 쓰지 않음). */
window.OGD_SESSION={
  session:4,target:'qu',artDir:'digraph04',
  text:{
    sideLabel:'이중자 4회차 · qu 소리 활동',
    buildNav:'낱말 공방 a·i',introNav:'Qu qu 소리 톡톡',newGroup:'새 소리 qu·x·y',
    spellNav:'첫 글자 구분하기',spellInstruction:'소리를 듣고 빈칸에 qu, k, c 중 알맞은 것을 골라요.',
    spellBubble:'“ㅋ” 뒤에 “우”가 붙어 들리면 qu! q 뒤엔 늘 u가 따라와요.',
    spellRule:'<div class="ogd-rule"><b>qu</b> “ㅋ+우”가 붙은 소리<i></i><b>c</b> a·o·u 앞의 “ㅋ”<i></i><b>k</b> e·i 앞의 “ㅋ”<small>q 뒤엔 늘 u — “쿠(ㅋ+우)” 소리는 qu</small></div>',
    spellGood:x=>x.answer==='qu'?'맞아요! “ㅋ+우” 소리라서 qu!':x.answer==='c'?'맞아요! a·o·u 앞의 “ㅋ”는 c!':'맞아요! e·i 앞의 “ㅋ”는 k!',
    spellRetry:x=>'“우”가 붙어 들리는지, 뒤에 오는 모음이 무엇인지 살펴봐요.'
  },
  cover:{kicker:'READING STUDIO · DIGRAPH 04',title:'qu·x·y',h2:'늘 붙어 다니는 두 글자 qu를 만나요.',
    desc:'a·i 낱말을 다시 읽고, qu와 k·w를 비교하고, qu·k·c 중 알맞은 첫 글자를 고른 뒤<br>quit · quiz · quack을 만들고 읽어봅니다.',
    tags:['qu? k? c?','손가락 톡톡','외계어 스파이','문장 퍼즐'],orbits:[['Qu','qu'],['X','x'],['Y','y']]},
  ART:{ham:'digraph01/ham.webp',jam:'digraph01/jam.webp'},
  FILES:['cap','cat','hat','map','mat','pat','pig','sap','sat','tap'],
  NEED:{
    quack:['4-03','꽥꽥 우는 오리'],quiz:['4-04','물음표가 가득한 문제 풀이판'],quit:['4-05','하던 게임기를 내려놓고 그만두는 아이'],quick:['4-06','속도 선을 그리며 아주 빠르게 달리는 토끼'],
    kit:['4-07','구급상자'],kick:['4-08','공을 발로 차는 아이'],web:['4-09','거미줄'],wig:['4-10','머리에 쓰는 가발'],
    yak:['4-11','털이 길게 늘어진 산에 사는 소'],yam:['4-12','고구마처럼 생긴 덩이뿌리'],
    six:['4-13','주사위 여섯 눈'],wax:['4-14','녹아 흐르는 양초의 촛농'],fix:['4-15','망치로 의자를 고치는 아이'],mix:['4-16','거품기로 그릇 속 반죽을 섞기'],
    sack:['4-17','곡식이 든 커다란 자루'],back:['4-18','아이의 등(뒷모습)'],fizz:['4-19','거품이 톡톡 올라오는 탄산음료 컵'],kiss:['4-20','엄마 볼에 뽀뽀하는 아이'],
    pit:['4-21','땅에 파인 구덩이'],chick:['4-22','노란 병아리']
  },
  INTRO_ART:{},
  // ① 룰렛 빙고: 30개 중 24개가 아이마다 다르게 깔림 (ch·wh·ck 복습 + x·y + CVC)
  BINGO_POOL:['chip','chat','chin','chop','catch','when','whip','whiz','whim','back','sock','duck','neck','kick','rock','pick','fox','six','yes','cat','map','jam','hat','pig','sit','lip','bed','dog','bug','sun'],
  // ② 낱말 공방
  BUILD_WORDS:[
    {word:'cat',sounds:['c','a','t']},{word:'six',sounds:['s','i','x']},{word:'yam',sounds:['y','a','m']},{word:'pig',sounds:['p','i','g']},
    {word:'wax',sounds:['w','a','x']},{word:'fix',sounds:['f','i','x']},{word:'sat',sounds:['s','a','t']},{word:'pat',sounds:['p','a','t']}
  ],
  BUILD_BANKS:[['c','s','p','w','y','f'],['a','i'],['t','g','x','m']],
  // ③ 새 소리 소개
  consonants:[
    {letter:'qu',korean:'쿠(ㅋ+우)',word:'queen',jelly:['4-01','왕관을 쓰고 손을 흔드는 젤리코치'],mouth:'입술을 동그랗게 모아 앞으로 내밀어요.',motion:['4-02','쿠 소리: 혀 뒤쪽을 입천장 안쪽에 댔다 떼면서 입술을 동그랗게 오므리는 옆모습'],action:'혀 뒤쪽으로 “ㅋ”를 터뜨리자마자 입술을 오므려 “우”로 이어요. 한 번에 “쿠”!'}
  ],
  // ③-1 Sound Check(소리 레이더): 빈칸 자리(first/last)에 목표 소리가 들어가나 — O/X
  RADAR:[
    {word:'quit',position:'first'},{word:'kit',position:'first'},{word:'wig',position:'first'},{word:'quiz',position:'first'},{word:'quack',position:'first'},
    {word:'yak',position:'first'},{word:'cap',position:'first'},{word:'quick',position:'first'},{word:'web',position:'first'},{word:'quip',position:'first'}
  ],
  // ④ 첫소리 구분하기: 보기 수 2~4개, 정답 섞음
  firstSound:[
    {word:'quack',answer:'qu',choices:['qu','k']},{word:'kit',answer:'k',choices:['k','qu','w']},
    {word:'web',answer:'w',choices:['w','qu']},{word:'quiz',answer:'qu',choices:['y','qu','k']},
    {word:'yak',answer:'y',choices:['y','w','qu']},{word:'kick',answer:'k',choices:['qu','k','w','y']},
    {word:'quit',answer:'qu',choices:['w','k','qu']},{word:'wig',answer:'w',choices:['qu','y','w']},
    {word:'yam',answer:'y',choices:['k','y']},{word:'quick',answer:'qu',choices:['k','w','y','qu']}
  ],
  FIRST_KEYS:['qu','k','w','y'],
  KEY_TIPS:{
    qu:['qu “ㅋ+우”','“ㅋ”를 내자마자 입술을 동그랗게 오므려요. 두 소리가 한 번에 붙어요.'],
    k:['k “ㅋ”','혀 뒤쪽을 입천장 안쪽에 댔다가 떼요. 입술은 오므리지 않아요.'],
    w:['w “우~”','입술을 동그랗게 모았다가 벌려요. “ㅋ” 소리는 없어요.'],
    y:['y “이~”','혀를 입천장 가까이 올렸다가 내리며 다음 모음으로 미끄러져요. 목이 울려요.']
  },
  // ⑤ 첫 글자(철자) 구분하기: qu / k / c
  SPELL:[
    {word:'quit',blank:'_it',answer:'qu'},{word:'cat',blank:'_at',answer:'c'},{word:'kid',blank:'_id',answer:'k'},
    {word:'quack',blank:'_ack',answer:'qu'},{word:'cup',blank:'_up',answer:'c'},{word:'kit',blank:'_it',answer:'k'},
    {word:'quiz',blank:'_iz',answer:'qu'}
  ],
  SPELL_CHOICES:['qu','k','c'],
  // ⑥ 글자·소리 조각·박자 (qu는 한 조각, 한글 짝은 kit만)
  TAP_WORDS:['quit','quack','quiz','kit','quick','quip'],
  TAP_KO:{kit:['ㅋ','ㅣ','ㅌ','킽']},
  // ⑦ 낱말 실험실(첫소리 + 나머지)
  LAB_TARGETS:[
    {word:'quit',parts:['qu','it']},{word:'quick',parts:['qu','ick']},{word:'kit',parts:['k','it']},{word:'quack',parts:['qu','ack']},
    {word:'yak',parts:['y','ak']},{word:'kick',parts:['k','ick']},{word:'quiz',parts:['qu','iz']}
  ],
  LAB_GRID:['qu','k','y','qu','k','it','ick','ack','iz','ak','ip','ap'],
  // ⑧ 낱말-그림 짝: 소리가 비슷한 그림 셋
  PIC:[
    {word:'quack',pics:['sack','quack','back']},{word:'quiz',pics:['quiz','fizz','kiss']},
    {word:'quit',pics:['kit','pit','quit']},{word:'quick',pics:['kick','quick','chick']},
    {word:'kick',pics:['kick','sack','chick']},{word:'yak',pics:['yak','back','sack']},
    {word:'six',pics:['fix','mix','six']},{word:'yam',pics:['ham','yam','jam']}
  ],
  // ⑨ 외계어 스파이: 외계어 10 + 진짜 낱말 15
  SPY_ALIEN:['quib','quep','quap','quog','quex','quob','quig','queck','quem','quen'],
  SPY_REAL:['quit','quiz','quick','quack','quip','kit','kick','yak','yam','yes','fox','six','wax','cat','wig'],
  // ⑩ 점핑워드: 사이트워드·이름·낯선 낱말 ×3, 목표 낱말 ×2, 나머지 ×1
  JUMP_WEIGHT:{
    3:['not','have','this','down','how','the','Jim','Pam','Ben','Kim','Tim','Jan','yak','jig'],
    2:['quiz','quack','quick','quit'],
    1:['big','fun','bad','duck','can','and','sit','nap','dip','hop','is','cat','fox','bug','did','job','sat','pig']
  },
  // ⑪ 문장 놀이터: 틀마다 목표 낱말 하나 고정
  sentences:[
    {parts:['I have a ',0,' quiz.'],slots:[{options:['big','fun','bad']}]},
    {parts:['The duck can quack and ',0,'.'],slots:[{options:['sit','nap','dip','hop']}]},
    {parts:[0,' is not quick.'],slots:[{options:['Jim','Pam','Ben','Kim']}]},
    {parts:['How quick is the ',0,'?'],slots:[{options:['cat','fox','yak','bug']}]},
    {parts:[0,' did not quit this ',1,'.'],slots:[{options:['Tim','Jan','Ben']},{options:['quiz','job','jig']}]},
    {parts:['The quick ',0,' sat down.'],slots:[{options:['cat','fox','pig','yak']}]}
  ]
};
