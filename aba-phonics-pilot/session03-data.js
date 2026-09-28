/* 이중자 3회차 · ck (c·k·ck 철자 규칙, g와 끝소리 비교) — 회차 데이터
   엔진(og-digraph-engine.js)은 모든 회차가 같고, 회차마다 이 파일만 바꿉니다.
   그림이 없는 낱말은 NEED의 번호로 점선 자리가 보입니다(설명에는 영어 낱말을 쓰지 않음). */
window.OGD_SESSION={
  session:3,target:'ck',artDir:'digraph03',
  text:{
    radarYes:'빈칸은 ㅋ 소리예요.',
    sideLabel:'이중자 3회차 · ck 소리 활동',
    buildNav:'낱말 공방 u·a',introNav:'Ck ck 소리 톡톡',newGroup:'새 소리 c·k·ck',
    firstNav:'끝소리 구분하기',firstInstruction:'그림 소리를 듣고 끝소리를 골라요.',
    radarQuestion:'빈칸에 <b>ㅋ</b> 소리가 들어갈까요?',
    spellNav:'c? k? ck?',spellInstruction:'빈칸에 c, k, ck 중 알맞은 것을 골라요.',
    spellBubble:'셋 다 “ㅋ” 소리예요. 빈칸 옆 글자를 보고 골라요!',
    spellRule:'<div class="ogd-rule"><b>c</b> a·o·u 앞, 자음 앞<i></i><b>k</b> e·i 앞<i></i><b>ck</b> 짧은 모음 바로 뒤 끝소리<small>셋 다 “ㅋ” 소리예요.</small></div>',
    spellGood:x=>x.answer==='ck'?'맞아요! 짧은 모음 바로 뒤 끝소리라서 ck!':x.answer==='k'?'맞아요! 뒤에 e나 i가 와서 k!':'맞아요! 뒤에 a·o·u가 와서 c!',
    spellRetry:x=>x.answer==='ck'?'짧은 모음 바로 뒤 끝소리인지 살펴봐요.':'빈칸 바로 뒤에 오는 모음을 살펴봐요.'
  },
  cover:{kicker:'READING STUDIO · DIGRAPH 03',title:'c·k·ck',h2:'세 가지 글자가 내는 한 소리 “ㅋ”를 만나요.',
    desc:'u 낱말을 다시 읽고, ck와 g를 비교하고, c·k·ck 중 알맞은 것을 고른 뒤<br>duck · kick · sock을 만들고 읽어봅니다.',
    tags:['c? k? ck?','손가락 톡톡','외계어 스파이','문장 퍼즐'],orbits:[['Ck','ck'],['G','g'],['u','·a']]},
  ART:{net:'digraph01/net.webp'},
  FILES:['cap','cat','hat','map','pig','log','cup','sun','dog','pen','tap'],
  NEED:{
    duck:['3-03','연못에 떠 있는 오리'],sock:['3-04','양말 한 짝'],lock:['3-05','자물쇠'],bag:['3-06','가방'],
    bug:['3-07','작은 벌레'],hut:['3-08','작은 오두막'],mug:['3-09','손잡이 달린 컵'],
    sack:['3-10','불룩한 자루'],kick:['3-11','공을 발로 차는 아이'],chick:['3-12','노란 병아리'],kid:['3-13','웃고 있는 어린아이'],
    rock:['3-14','큰 돌'],neck:['3-16','기린의 긴 목'],tack:['3-17','압정'],check:['3-18','초록색 체크 표시']
  },
  INTRO_ART:{},
  // ① 룰렛 빙고: 30개 중 24개가 아이마다 다르게 깔림 (ch·tch·wh 복습 + CVC)
  BINGO_POOL:['chip','chat','chop','rich','catch','match','fetch','pitch','when','whip','which','whiz','cat','map','bag','jam','hen','bed','pet','web','pig','sit','lip','dog','hot','fox','bug','sun','cup','rug'],
  // ② 낱말 공방 (u + a 섞기)
  BUILD_WORDS:[
    {word:'cup',sounds:['c','u','p']},{word:'bug',sounds:['b','u','g']},{word:'cat',sounds:['c','a','t']},{word:'sun',sounds:['s','u','n']},
    {word:'hut',sounds:['h','u','t']},{word:'map',sounds:['m','a','p']},{word:'mug',sounds:['m','u','g']},{word:'hat',sounds:['h','a','t']}
  ],
  BUILD_BANKS:[['c','b','s','h','m'],['u','a'],['p','g','t','n']],
  // ③ 새 소리 소개
  consonants:[
    {letter:'ck',korean:'ㅋ',word:'duck',jelly:['3-01','오리 인형을 안은 젤리코치'],mouth:'입을 살짝 벌리고 혀 뒤쪽을 들어 올려요.',motion:['3-02','ㅋ 소리: 혀 뒤쪽을 입천장 안쪽에 붙였다가 떼며 바람을 내보내는 옆모습'],action:'혀 뒤쪽을 입천장 안쪽에 댔다가 톡 떼며 “ㅋ”. 목은 울리지 않아요.'}
  ],
  // ③-1 Sound Check(소리 레이더): 빈칸에 “ㅋ” 소리가 들어가나 — O/X. c·k로 쓴 ㅋ 소리는 답을 직접 적음
  RADAR:[
    {word:'duck',position:'last'},{word:'bag',position:'last'},{word:'cat',position:'first',answer:'O'},{word:'rock',position:'last'},{word:'pig',position:'last'},
    {word:'kid',position:'first',answer:'O'},{word:'lock',position:'last'},{word:'dog',position:'last'},{word:'neck',position:'last'},{word:'hat',position:'last'}
  ],
  // ④ 끝소리 구분하기(듣기): ck와 g(목 울림)·t·p 비교, 보기 수 2~4개, 정답 섞음
  firstSound:[
    {word:'duck',answer:'ck',choices:['ck','g']},{word:'pig',answer:'g',choices:['ck','g','t']},
    {word:'hat',answer:'t',choices:['t','ck']},{word:'lock',answer:'ck',choices:['g','ck','p']},
    {word:'cap',answer:'p',choices:['p','ck','t']},{word:'log',answer:'g',choices:['ck','g']},
    {word:'sock',answer:'ck',choices:['ck','p','t','g']},{word:'map',answer:'p',choices:['ck','p']},
    {word:'bag',answer:'g',choices:['g','ck','t','p']},{word:'cat',answer:'t',choices:['ck','t','g']}
  ],
  FIRST_KEYS:['ck','g','t','p'],
  KEY_TIPS:{
    ck:['ck “ㅋ”','혀 뒤쪽을 입천장 안쪽에 댔다가 톡 떼요. 목은 안 울려요.'],
    g:['g “ㄱ”','ck와 혀 자리는 같아요. 목을 울려서 내요.'],
    t:['t “ㅌ”','혀끝을 윗잇몸에 댔다가 톡 떼요. 목은 안 울려요.'],
    p:['p “ㅍ”','두 입술을 붙였다가 톡 터뜨려요. 목은 안 울려요.']
  },
  // ⑤ 철자 고르기: c / k / ck
  SPELL:[
    {word:'cat',blank:'_at',answer:'c'},{word:'duck',blank:'du_',answer:'ck'},{word:'kid',blank:'_id',answer:'k'},
    {word:'cup',blank:'_up',answer:'c'},{word:'rock',blank:'ro_',answer:'ck'},{word:'kit',blank:'_it',answer:'k'},
    {word:'sock',blank:'so_',answer:'ck'}
  ],
  SPELL_CHOICES:['c','k','ck'],
  // ⑥ 글자·소리 조각·박자 (+ 한글 소리 짝)
  TAP_WORDS:['duck','sock','back','kick','lock','cat'],
  TAP_KO:{duck:['ㄷ','ㅓ','ㅋ','덬'],sock:['ㅅ','ㅏ','ㅋ','샄'],back:['ㅂ','ㅐ','ㅋ','뱈'],kick:['ㅋ','ㅣ','ㅋ','킼'],lock:['ㄹ','ㅏ','ㅋ','랔'],cat:['ㅋ','ㅐ','ㅌ','캩']},
  // ⑦ 낱말 실험실(첫소리 + 나머지)
  LAB_TARGETS:[
    {word:'duck',parts:['d','uck']},{word:'back',parts:['b','ack']},{word:'lock',parts:['l','ock']},{word:'kick',parts:['k','ick']},
    {word:'sack',parts:['s','ack']},{word:'luck',parts:['l','uck']},{word:'sock',parts:['s','ock']}
  ],
  LAB_GRID:['d','b','l','k','s','r','uck','ack','ock','ick','ug','og'],
  // ⑧ 낱말-그림 짝: 소리가 비슷한 그림 셋
  PIC:[
    {word:'duck',pics:['dog','duck','bug']},{word:'sack',pics:['sack','sock','tack']},
    {word:'lock',pics:['log','dog','lock']},{word:'kick',pics:['kick','chick','kid']},
    {word:'rock',pics:['sock','rock','lock']},{word:'neck',pics:['net','pen','neck']},
    {word:'tack',pics:['tap','tack','cap']},{word:'check',pics:['chick','neck','check']}
  ],
  // ⑨ 외계어 스파이: 외계어 10 + 진짜 낱말 15
  SPY_ALIEN:['zock','jeck','bick','gick','meck','vack','nuck','chack','whick','dack'],
  SPY_REAL:['duck','sock','back','kick','lock','neck','rock','sack','pick','luck','chick','check','kid','cup','cat'],
  // ⑩ 점핑워드: 사이트워드·이름·낯선 낱말 ×3, 목표 낱말 ×2, 나머지 ×1
  JUMP_WEIGHT:{
    3:['like','will','see','come','the','Jim','Pam','Ben','Kim'],
    2:['duck','kick','pick','sock','chick','rock','lock'],
    1:['big','red','wet','sad','can','bag','log','bug','cat','dog','hen','van','hut','up','on','and']
  },
  // ⑪ 문장 놀이터: 틀마다 목표 낱말 하나 고정
  sentences:[
    {parts:['I like the ',0,' duck.'],slots:[{options:['big','red','wet','sad']}]},
    {parts:['I will kick the ',0,'.'],slots:[{options:['can','bag','log']}]},
    {parts:[0,' will pick up the sock.'],slots:[{options:['Jim','Pam','Ben','Kim']}]},
    {parts:['Come and see the ',0,' chick.'],slots:[{options:['big','sad','wet']}]},
    {parts:['I see a ',0,' on the rock.'],slots:[{options:['bug','cat','dog','hen']}]},
    {parts:['Lock the ',0,'!'],slots:[{options:['van','hut','bag']}]}
  ]
};
