/* 이중자 2회차 · wh (w·h와 비교, w? wh? 철자) — 회차 데이터
   엔진(og-digraph-engine.js)은 모든 회차가 같고, 회차마다 이 파일만 바꿉니다.
   w와 wh는 같은 소리라서, 듣기는 소리(w·h·v·f)로 구별하고 철자(w? wh?)는 외워서 고릅니다.
   그림이 없는 낱말은 NEED의 번호로 점선 자리가 보입니다(설명에는 영어 낱말을 쓰지 않음). */
window.OGD_SESSION={
  session:2,target:'wh',artDir:'digraph02',
  text:{
    sideLabel:'이중자 2회차 · wh 소리 활동',
    buildNav:'낱말 공방 e·o',introNav:'Wh wh 소리 톡톡',newGroup:'새 소리 wh',
    spellNav:'철자 구분하기',spellInstruction:'빈칸에 w와 wh 중 알맞은 것을 골라요.',
    spellBubble:'w와 wh는 소리가 같아요. wh로 쓰는 낱말은 외워 둬요!',
    spellRule:'<div class="ogd-rule"><b>w</b> 대부분의 낱말 (web · wet · wig)<i></i><b>wh</b> 외워 두는 낱말<small>when · which · whip · whiz · whim · wham</small></div>',
    spellGood:x=>x.answer==='wh'?'맞아요! '+x.word+'는 wh로 쓰는 낱말이에요.':'맞아요! 대부분의 낱말은 w로 써요.',
    spellRetry:x=>x.answer==='wh'?'wh로 쓰는 낱말 목록을 다시 살펴봐요.':'목록에 없는 낱말은 대부분 w로 써요.'
  },
  cover:{kicker:'READING STUDIO · DIGRAPH 02',title:'wh·w',h2:'두 글자가 만드는 한 소리 wh를 만나요.',
    desc:'e·o 낱말을 다시 읽고, wh와 w·h를 비교하고, w와 wh를 구별한 뒤<br>whip · when · which를 만들고 읽어봅니다.',
    tags:['w? wh?','손가락 톡톡','외계어 스파이','문장 퍼즐'],orbits:[['Wh','wh'],['W','w'],['e','·o']]},
  ART:{dig:'digraph01/dig.webp',ham:'digraph01/ham.webp',jam:'digraph01/jam.webp',mop:'digraph01/mop.webp',net:'digraph01/net.webp',ship:'digraph01/ship.webp',vet:'digraph01/vet.webp'},
  FILES:['cap','cat','hat','map','mat','pat','pig','sap','sat','tap','dog','log','pen'],
  NEED:{
    whip:['2-03','공중에서 휘어지는 긴 채찍'],wham:['2-04','쾅! 하고 문에 부딪힌 공(충돌 효과선)'],whiz:['2-05','씽~ 하고 빠르게 지나가는 킥보드 탄 아이'],
    web:['2-06','거미줄에 앉은 거미'],wet:['2-07','비에 흠뻑 젖은 아이'],wig:['2-08','곱슬곱슬한 가발'],
    hen:['2-09','달걀 옆의 암탉'],hop:['2-10','깡충 뛰는 토끼'],hip:['2-11','손으로 엉덩이를 가리키는 아이'],fan:['2-13','돌아가는 선풍기'],fox:['2-14','주황색 여우'],fizz:['2-15','뽀글뽀글 거품이 오르는 탄산음료'],
    van:['2-16','짐을 싣는 승합차'],bed:['2-20','이불이 덮인 침대'],ten:['2-22','숫자 10 카드'],
    top:['2-24','빙글빙글 도는 팽이'],pot:['2-26','뚜껑 달린 냄비']
  },
  INTRO_ART:{},
  // ① 룰렛 빙고: 30개 중 24개가 아이마다 다르게 깔림 (지난 회차 ch·tch + e·o CVC)
  BINGO_POOL:['chip','chat','chin','chop','chap','catch','match','fetch','pitch','rich','bed','pet','ten','web','leg','hen','jet','net','red','wet','dog','hot','mop','pot','fox','log','top','hop','job','rod'],
  // ② 낱말 공방
  BUILD_WORDS:[
    {word:'pen',sounds:['p','e','n']},{word:'dog',sounds:['d','o','g']},{word:'hen',sounds:['h','e','n']},{word:'top',sounds:['t','o','p']},
    {word:'net',sounds:['n','e','t']},{word:'log',sounds:['l','o','g']},{word:'pot',sounds:['p','o','t']},{word:'hop',sounds:['h','o','p']}
  ],
  BUILD_BANKS:[['p','d','h','t','n','l'],['e','o'],['n','g','p','t']],
  // ③ 새 소리 소개
  consonants:[
    {letter:'wh',korean:'우',word:'whale',jelly:['2-01','고래 등에 올라탄 젤리코치'],mouth:'입술을 작고 동그랗게 모아 앞으로 내밀어요.',motion:['2-02','wh 소리: 동그랗게 모은 입술을 벌리며 소리 내는 옆모습'],action:'동그랗게 모은 입술을 벌리며 “우어” 하고 내요. w와 같은 소리예요. 목이 울려요.'}
  ],
  // ③-1 Sound Check(소리 레이더): 빈칸(맨 앞)에 wh 소리가 들어가나 — O/X
  //   w로 시작하는 낱말은 wh와 소리가 같아 헷갈리므로 넣지 않음(비교는 h·f·v)
  RADAR:[
    {word:'whip',position:'first'},{word:'hen',position:'first'},{word:'fan',position:'first'},{word:'when',position:'first'},{word:'which',position:'first'},
    {word:'hat',position:'first'},{word:'wham',position:'first'},{word:'van',position:'first'},{word:'hop',position:'first'},{word:'whiz',position:'first'}
  ],
  // ④ 첫소리 구분하기: 소리로 구별(wh 낱말의 답은 같은 소리 w), 보기 수 2~4개, 정답 섞음
  firstSound:[
    {word:'whip',answer:'w',choices:['w','h']},{word:'fan',answer:'f',choices:['h','f','v']},
    {word:'hen',answer:'h',choices:['h','w']},{word:'van',answer:'v',choices:['f','v','w','h']},
    {word:'web',answer:'w',choices:['v','w']},{word:'fox',answer:'f',choices:['f','h']},
    {word:'hat',answer:'h',choices:['f','w','h']},{word:'vet',answer:'v',choices:['v','w','f']},
    {word:'wig',answer:'w',choices:['h','f','w','v']},{word:'hop',answer:'h',choices:['w','h']}
  ],
  FIRST_KEYS:['w','h','v','f'],
  KEY_TIPS:{
    w:['w “우”','입술을 동그랗게 모았다가 벌려요. wh도 같은 소리예요.'],
    h:['h “ㅎ”','입을 벌리고 목에서 따뜻한 바람만 “하~”. 입술은 모으지 않아요.'],
    v:['v “브~”','윗니를 아랫입술에 살짝 대고 목을 울려요.'],
    f:['f “프~”','v와 입모양은 같아요. 목은 안 울리고 바람만 내보내요.']
  },
  // ⑤ 철자 구분하기: w / wh (소리는 같고, wh 낱말은 외워요)
  SPELL:[
    {word:'web',blank:'_eb',answer:'w'},{word:'when',blank:'_en',answer:'wh'},{word:'wig',blank:'_ig',answer:'w'},
    {word:'whip',blank:'_ip',answer:'wh'},{word:'which',blank:'_ich',answer:'wh'},{word:'wet',blank:'_et',answer:'w'},
    {word:'whiz',blank:'_iz',answer:'wh'}
  ],
  SPELL_CHOICES:['w','wh'],
  // ⑥ 글자·소리 조각·박자 (+ 한글 소리 짝: 한글에 w 자음이 없어 hen만)
  TAP_WORDS:['when','whip','which','wham','whiz','hen'],
  TAP_KO:{hen:['ㅎ','ㅔ','ㄴ','헨']},
  // ⑦ 낱말 실험실(첫소리 + 나머지)
  LAB_TARGETS:[
    {word:'whip',parts:['wh','ip']},{word:'when',parts:['wh','en']},{word:'wham',parts:['wh','am']},{word:'wig',parts:['w','ig']},
    {word:'whiz',parts:['wh','iz']},{word:'hen',parts:['h','en']},{word:'wet',parts:['w','et']}
  ],
  LAB_GRID:['wh','w','h','wh','w','ip','en','am','iz','ig','et','ot'],
  // ⑧ 낱말-그림 짝: 소리가 비슷한 그림 셋
  PIC:[
    {word:'whip',pics:['hip','whip','ship']},{word:'wham',pics:['wham','ham','jam']},
    {word:'whiz',pics:['wig','fizz','whiz']},{word:'web',pics:['web','wet','bed']},
    {word:'wig',pics:['pig','wig','dig']},{word:'hen',pics:['hen','pen','ten']},
    {word:'wet',pics:['vet','net','wet']},{word:'hop',pics:['top','hop','mop']}
  ],
  // ⑨ 외계어 스파이: 외계어 10 + 진짜 낱말 15
  SPY_ALIEN:['whep','whog','whub','whid','whob','wheg','whaf','whev','whez','whud'],
  SPY_REAL:['when','which','whip','whiz','whim','wham','web','wet','wig','hen','hop','chip','chat','van','fox'],
  // ⑩ 점핑워드: 사이트워드·이름·낯선 낱말 ×3, 목표 낱말 ×2, 나머지 ×1
  JUMP_WEIGHT:{
    3:['when','which','had','the','to','is','den','Jim','Pam','Ben','Tim','Kim','Jan','Tom'],
    2:['whip','wham','whiz'],
    1:['can','nap','sit','dig','hop','hat','pen','cup','mop','big','cat','dog','pig','hen','hit','log','pot','net','box','hut','van','top','did','get','fox','jet']
  },
  // ⑪ 문장 놀이터: 틀마다 목표 낱말 하나 고정
  sentences:[
    {parts:['When can I ',0,'?'],slots:[{options:['nap','sit','dig','hop']}]},
    {parts:['Which ',0,' is big?'],slots:[{options:['hat','pen','cup','mop']}]},
    {parts:[0,' had a whip.'],slots:[{options:['Jim','Pam','Ben','Tim']}]},
    {parts:['Wham! The ',0,' hit the ',1,'.'],slots:[{options:['cat','dog','pig','hen']},{options:['log','pot','net','box']}]},
    {parts:['I whiz to the ',0,'.'],slots:[{options:['den','hut','van','top']}]},
    {parts:['When did ',0,' get the ',1,'?'],slots:[{options:['Kim','Jan','Tom']},{options:['pen','hen','fox','jet']}]}
  ]
};
