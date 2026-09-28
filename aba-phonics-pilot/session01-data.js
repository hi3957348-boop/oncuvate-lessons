/* 이중자 1회차 · ch (j와 비교, tch 규칙) — 회차 데이터
   엔진(og-digraph-engine.js)은 모든 회차가 같고, 회차마다 이 파일만 바꿉니다.
   그림이 없는 낱말은 NEED의 번호로 점선 자리가 보입니다(설명에는 영어 낱말을 쓰지 않음). */
window.OGD_SESSION={
  session:1,target:'ch',artDir:'digraph01',
  text:{
    sideLabel:'이중자 1회차 · ch 소리 활동',
    buildNav:'낱말 공방 a·i',introNav:'Ch ch 소리 톡톡',newGroup:'새 소리 ch·tch',
    spellNav:'끝소리 구분하기',spellInstruction:'빈칸에 ch와 tch 중 알맞은 것을 골라요.',
    spellBubble:'짧은 모음 바로 뒤에 오면 t가 도와줘요. tch!',
    spellRule:'<div class="ogd-rule"><b>tch</b> 짧은 모음 하나 바로 뒤 끝소리<i></i><b>ch</b> 그 밖 (맨 앞, 자음 뒤)<small>예외: much · such · rich · which</small></div>',
    spellGood:x=>x.except?'맞아요! rich는 예외라서 ch를 써요.':x.answer==='tch'?'맞아요! 짧은 모음 바로 뒤라서 tch!':'맞아요! 모음 바로 뒤 끝소리가 아니라서 ch!',
    spellRetry:x=>x.except?'rich는 외워야 하는 예외 단어예요.':'모음 바로 뒤 끝소리인지 살펴봐요.'
  },
  cover:{kicker:'READING STUDIO · DIGRAPH 01',title:'ch·j',h2:'두 글자가 만드는 한 소리 ch를 만나요.',
    desc:'a·i 낱말을 다시 읽고, ch와 j를 비교하고, ch와 tch를 구별한 뒤<br>chip · chat · catch를 만들고 읽어봅니다.',
    tags:['ch? tch?','손가락 톡톡','외계어 스파이','문장 퍼즐'],orbits:[['Ch','ch'],['J','j'],['a','·i']]},
  FILES:['cap','cat','hat','map','mat','pat','pig','sap','sat','tap'],
  NEED:{
    match:['IMG-23','성냥개비']
  },
  INTRO_ART:{'IMG-01':'coach-ch.webp'},
  // 받은 그림(assets/images/digraph01, 900px WebP) — 원본은 assets/session01
  ART:{chip:'digraph01/chip.webp',chin:'digraph01/chin.webp',chop:'digraph01/chop.webp',chat:'digraph01/chat.webp',jam:'digraph01/jam.webp',jet:'digraph01/jet.webp',jug:'digraph01/jug.webp',dig:'digraph01/dig.webp',zip:'digraph01/zip.webp',zap:'digraph01/zap.webp',catch:'digraph01/catch.webp',ship:'digraph01/ship.webp',shop:'digraph01/shop.webp',mop:'digraph01/mop.webp',pin:'digraph01/pin.webp',fin:'digraph01/fin.webp',net:'digraph01/net.webp',vet:'digraph01/vet.webp',ham:'digraph01/ham.webp',champ:'digraph01/champ.webp',patch:'digraph01/patch.webp'},
  // ① 룰렛 빙고: 30개 중 24개가 아이마다 다르게 깔림
  BINGO_POOL:['cat','map','bag','jam','van','hat','bed','pet','ten','web','leg','hen','pig','sit','fin','lip','zip','dig','dog','hot','mop','pot','fox','log','bug','sun','cup','nut','rug','hut'],
  // ② 낱말 공방
  BUILD_WORDS:[
    {word:'cat',sounds:['c','a','t']},{word:'pig',sounds:['p','i','g']},{word:'map',sounds:['m','a','p']},{word:'zip',sounds:['z','i','p']},
    {word:'hat',sounds:['h','a','t']},{word:'dig',sounds:['d','i','g']},{word:'cap',sounds:['c','a','p']},{word:'mat',sounds:['m','a','t']}
  ],
  BUILD_BANKS:[['c','h','m','p','d','z'],['a','i'],['t','p','g']],
  // ③ 새 소리 소개
  consonants:[
    {letter:'ch',korean:'ㅊ',word:'chip',jelly:['IMG-01','「칫, 삐졌어!」 젤리코치'],mouth:'입술을 앞으로 둥글게 내밀어요.',motion:['IMG-03','ch 소리: 혀 앞쪽을 윗잇몸에 붙였다가 떼며 바람을 내보내는 옆모습'],action:'「칫, 삐졌어!」 할 때의 「칫」 소리예요. 혀를 붙였다 떼며 바람을 세게 “ㅊ” 내보내요. 목은 울리지 않아요.'}
  ],
  // ③-1 Sound Check(소리 레이더): 빈칸 자리(first/last)에 목표 소리가 들어가나 — O/X
  RADAR:[
    {word:'chip',position:'first'},{word:'catch',position:'last'},{word:'jam',position:'first'},{word:'match',position:'last'},{word:'chat',position:'first'},
    {word:'dig',position:'last'},{word:'chin',position:'first'},{word:'map',position:'last'},{word:'jet',position:'first'},{word:'pitch',position:'last'}
  ],
  // ④ 첫소리 구분하기: 보기 수 2~4개, 정답 섞음
  firstSound:[
    {word:'chip',answer:'ch',choices:['ch','j']},{word:'zip',answer:'z',choices:['ch','z','j']},
    {word:'cat',answer:'c',choices:['c','ch']},{word:'jam',answer:'j',choices:['j','z','ch']},
    {word:'chin',answer:'ch',choices:['ch','c','j','z']},{word:'cap',answer:'c',choices:['z','c','ch']},
    {word:'jet',answer:'j',choices:['ch','j']},{word:'zap',answer:'z',choices:['z','j','ch']},
    {word:'chop',answer:'ch',choices:['c','ch']},{word:'jug',answer:'j',choices:['j','ch','c','z']}
  ],
  FIRST_KEYS:['ch','c','j','z'],
  KEY_TIPS:{
    ch:['ch “ㅊ”','입술을 내밀고, 혀를 붙였다 떼며 바람을 터뜨려요. 목은 안 울려요.'],
    c:['c “ㅋ”','혀 뒤쪽을 입천장 안쪽에 댔다가 떼요. 목 안쪽에서 나는 소리예요.'],
    j:['j “ㅈ”','ch와 입모양은 같아요. 목을 울려서 내요.'],
    z:['z “zzz”','이를 살짝 모으고 벌처럼 길게 “zzz”. 목이 울려요.']
  },
  // ⑤ 끝소리(철자) 구분하기: tch / ch
  SPELL:[
    {word:'catch',blank:'ca_',answer:'tch'},{word:'chin',blank:'_in',answer:'ch'},{word:'pitch',blank:'pi_',answer:'tch'},
    {word:'chop',blank:'_op',answer:'ch'},{word:'fetch',blank:'fe_',answer:'tch'},{word:'match',blank:'ma_',answer:'tch'},
    {word:'rich',blank:'ri_',answer:'ch',except:true}
  ],
  SPELL_CHOICES:['ch','tch'],
  // ⑥ 글자·소리 조각·박자 (+ 한글 소리 짝)
  TAP_WORDS:['chat','catch','chip','match','pitch','jam'],
  TAP_KO:{chat:['ㅊ','ㅐ','ㅌ','챝'],catch:['ㅋ','ㅐ','ㅊ','캧'],chip:['ㅊ','ㅣ','ㅍ','칲'],match:['ㅁ','ㅐ','ㅊ','맻'],pitch:['ㅍ','ㅣ','ㅊ','핓'],jam:['ㅈ','ㅐ','ㅁ','잼']},
  // ⑦ 낱말 실험실(첫소리 + 나머지)
  LAB_TARGETS:[
    {word:'chip',parts:['ch','ip']},{word:'chat',parts:['ch','at']},{word:'chin',parts:['ch','in']},{word:'jam',parts:['j','am']},
    {word:'chap',parts:['ch','ap']},{word:'jig',parts:['j','ig']},{word:'match',parts:['m','atch']}
  ],
  LAB_GRID:['ch','j','m','ch','j','ip','at','in','ap','am','ig','atch'],
  // ⑧ 낱말-그림 짝: 소리가 비슷한 그림 셋
  PIC:[
    {word:'chip',pics:['ship','chip','zip']},{word:'chop',pics:['chop','shop','mop']},
    {word:'chat',pics:['cat','hat','chat']},{word:'chin',pics:['pin','chin','fin']},
    {word:'catch',pics:['catch','cat','match']},{word:'jet',pics:['net','vet','jet']},
    {word:'jam',pics:['ham','jam','champ']},{word:'match',pics:['map','patch','match']}
  ],
  // ⑨ 외계어 스파이: 외계어 10 + 진짜 낱말 15
  SPY_ALIEN:['chid','chog','chab','chep','chup','vatch','zitch','jat','jid','lotch'],
  SPY_REAL:['chip','chat','chin','chop','chap','catch','match','pitch','fetch','jam','jet','jug','zip','cat','mop'],
  // ⑩ 점핑워드: 사이트워드·이름·낯선 낱말 ×3, 목표 낱말 ×2, 나머지 ×1
  JUMP_WEIGHT:{
    3:['all','day','look','the','at','wet','Jim','Pam','Jan','Ben'],
    2:['chat','chip','Chad','chop','catch','Kim','Tim'],
    1:['had','can','and','big','sit','nap','dig','hot','red','jam','pig','hat','fig','ham','cat','bug','hop','cup','log','nut','cap']
  },
  // ⑪ 문장 놀이터: 틀마다 목표 낱말 하나 고정
  sentences:[
    {parts:['I ',0,' and chat all day.'],slots:[{options:['sit','nap','dig','hop']}]},
    {parts:['Look at the ',0,' chip!'],slots:[{options:['big','hot','red','wet']}]},
    {parts:['Chad had a big ',0,'.'],slots:[{options:['jam','pig','hat','cup']}]},
    {parts:[0,' and ',1,' chat.'],slots:[{options:['Jim','Pam','Kim']},{options:['Tim','Jan','Ben']}]},
    {parts:['I can chop the ',0,'.'],slots:[{options:['fig','ham','log','nut']}]},
    {parts:['Catch the ',0,'!'],slots:[{options:['cat','bug','pig','cap']}]}
  ]
};
