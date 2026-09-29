window.SPACE_SESSION={
  id:'04',storage:'space-observatory-04:state:v1',lab:'Moon Base 04',hero:'base-hero',
  start:{eyebrow:'JELLY SPACE DETECTIVES · CASE 04',title:'The Mystery of<br><em>the Last Cargo Window</em>',lead:'제한된 크레딧으로 필요한 장비를 고르고, 세 가지 생존 시험을 통과하도록 설계를 수정하세요.'},
  caseLines:[
    ['CARGO ALERT · FINAL LAUNCH','The first Moon habitat can carry only 11 cargo credits of equipment. Six modules are waiting.'],
    ['CREW NEEDS','The crew needs breathable air, clean water, electrical power, and protection from harsh temperature changes. Dust must stay outside the living area.'],
    ['UNRESOLVED QUESTION','Which combination will keep the crew safe without going over the cargo limit? Build, test, and change the design when a need is missing.']
  ],
  goal:{question:['What must the design do?','설계가 해야 할 일은 무엇일까요?'],correct:'needs',choices:[
    ['pretty','Use the modules that look the most interesting.','가장 멋져 보이는 장비를 고른다.'],
    ['needs','Meet every survival need within 11 cargo credits.','11 크레딧 안에서 모든 생존 필요를 충족한다.'],
    ['all','Load all six modules.','장비 여섯 개를 모두 싣는다.']
  ]},
  words:[["habitat", "a protected place to live · 거주 시설 : 사람이 안전하게 생활할 수 있도록 만든 곳", "The crew lives inside a sealed habitat.", ["habitat", "habitats"], "hab·i·tat"], ["recycle", "use something again · 재활용하다 : 쓴 것을 다시 사용할 수 있게 하다", "The system can recycle water.", ["recycle", "recycling", "recycler"], "re·cy·cle"], ["insulated", "protected from heat or cold · 단열된 : 열이 들어오거나 나가기 어렵게 보호된", "An insulated wall slows temperature change.", ["insulated"], "in·su·lat·ed"], ["resource", "something useful but limited · 자원 : 생활이나 활동에 쓰이는 유용한 것", "Water is a valuable resource on the Moon.", ["resource", "resources"], "re·source"], ["cargo", "things carried by a ship or rocket · 화물", "The rocket can carry 11 cargo credits.", ["cargo"], "car·go"], ["credit", "a point you can spend · 크레딧 : 쓸 수 있는 점수", "Each module costs credits.", ["credit", "credits"], "cred·it"], ["module", "one part that fits with others · 모듈 : 끼워 맞추는 한 부분", "Six modules are waiting.", ["module", "modules"], "mod·ule"], ["equipment", "tools and machines for a job · 장비", "The habitat carries equipment.", ["equipment"], "e·quip·ment"], ["crew", "the people working on a ship · 승무원", "The crew needs clean water.", ["crew"], "crew"], ["breathable", "safe to breathe · 숨 쉴 수 있는", "The habitat holds breathable air.", ["breathable", "breathe"], "breath·a·ble"], ["harsh", "very rough or hard · 혹독한", "The Moon has harsh temperature changes.", ["harsh"], "harsh"], ["combination", "things put together · 조합", "Which combination keeps the crew safe?", ["combination"], "com·bi·na·tion"], ["limit", "the most that is allowed · 한도", "Do not go over the cargo limit.", ["limit"], "lim·it"], ["design", "a plan for how to build something · 설계", "Change the design when a need is missing.", ["design", "designs"], "de·sign"], ["survival", "staying alive · 생존", "Run the survival tests.", ["survival", "survive"], "sur·viv·al"], ["engineer", "a person who designs and builds machines · 공학자", "Engineers test a design.", ["engineer", "engineers"], "en·gi·neer"], ["provide", "to give what is needed · 제공하다", "Solar panels provide power.", ["provide", "provides"], "pro·vide"], ["manage", "to control or handle · 관리하다", "A habitat must manage temperature changes.", ["manage"], "man·age"], ["sealed", "closed so nothing gets in or out · 밀폐된", "The crew lives inside a sealed habitat.", ["sealed"], "sealed"], ["structure", "something built · 구조물", "The structure must hold air.", ["structure"], "struc·ture"], ["deliver", "to bring to a place · 배달하다", "Water must be delivered from Earth.", ["deliver", "delivered"], "de·liv·er"], ["essential", "needed; very important · 꼭 필요한", "Essential needs must be met.", ["essential"], "es·sen·tial"], ["available", "ready to use · 쓸 수 있는", "Use only the available resources.", ["available"], "a·vail·a·ble"], ["airlock", "a small room with two doors that keeps air in · 에어록 : 공기가 빠지지 않게 문이 둘인 작은 방", "A dust airlock keeps dust outside.", ["airlock"], "air·lock"], ["greenhouse", "a glass room for growing plants · 온실", "The greenhouse grows fresh food.", ["greenhouse"], "green·house"], ["oxygen", "the gas we need to breathe · 산소", "The oxygen recycler reuses air.", ["oxygen"], "ox·y·gen"], ["solar", "from the Sun · 태양의", "A solar array makes power in sunlight.", ["solar"], "so·lar"], ["protection", "keeping safe · 보호", "The crew needs protection from temperature changes.", ["protection", "protections"], "pro·tec·tion"], ["abrasive", "rough and scratchy · 거칠어 긁히는", "Moon dust is abrasive.", ["abrasive"], "a·bra·sive"], ["require", "to need · 필요로 하다", "The greenhouse is not required for this test.", ["require", "required"], "re·quire"]],
  strategy:{labels:['필요 확인','설계 시험','한 가지 수정'],game:'필요와 크레딧을 보며 기지를 설계해요',check:'실패한 시험 하나를 보고 설계를 바꿔요'},
  guide:{game:[
    {en:'Lock the five crew needs in your memory.',ko:'크루에게 필요한 다섯 가지를 기억에 잠가요.'},
    {en:'Swipe through the module cards. Load what the crew needs.',ko:'장비 카드를 넘겨 보며 크루에게 필요한 것을 실어요.'},
    {en:'Run the survival tests.',ko:'생존 시험을 실행해요.'},
    {en:'If a test fails, change only one module.',ko:'시험이 실패하면 장비 하나만 바꿔요.'}
  ],check:[
    {en:'Read one rule at a time.',ko:'규칙을 한 장씩 읽어요.'},
    {en:'Did it work in your tests? TRUE or FAKE.',ko:'내 시험에서 통했나요? TRUE 또는 FAKE로 판정해요.'}
  ]},
  mission:{title:'크루에게 꼭 필요한 다섯 가지',diveSeconds:5,needs:[
    ['power','🔋','POWER','전기'],['air','🫁','AIR','숨 쉴 공기'],['water','💧','WATER','깨끗한 물'],['temperature','🌡️','TEMPERATURE','더위·추위 막기'],['dust','🧹','DUST','먼지는 밖에']
  ],groupTips:[
    '<b>동시 출발</b> 페이지 잠금으로 모두 3번 화면에 모은 뒤 해제하고 「🔒 기억 잠그기」.',
    '<b>잠수 규칙</b> 🫧 잠수 중인 친구에겐 말 걸지 않기. 크루 보드에 「잠수 중」으로 보여요.',
    '<b>크루 도우미</b> 먼저 통과한 아이는 답 대신 「시험 결과에서 NOT READY를 봐」 같은 힌트만 건네요.',
    '<b>판정은 다 같이</b> 모두 4번에 오면 활동 잠금 → 규칙 한 장마다 「셋 하면 엄지 위(TRUE)·아래(FAKE)!」 → 해제 후 각자 누르기.',
    '<b>팀 보물</b> 순위 없이 합계만 봐요. 🔎 탐정 보석도 똑같이 한 칸이에요.'
  ]},
  game:{type:'base',title:'Build and test a Moon habitat.',eyebrow:'LUNAR BASE BUILDER',intro:'Choose modules up to 11 credits. Run the tests, then change only what is needed.',budget:11,modules:[
    {id:'solar',icon:'☀️',name:'SOLAR ARRAY',cost:2,need:'power',detail:'makes electrical power in sunlight'},
    {id:'oxygen',icon:'🌬️',name:'OXYGEN RECYCLER',cost:2,need:'air',detail:'reuses air inside the habitat'},
    {id:'water',icon:'🚰',name:'WATER RECYCLER',cost:2,need:'water',detail:'cleans water for use again'},
    {id:'shelter',icon:'🏠',name:'INSULATED SHELTER',cost:3,need:'temperature',detail:'slows dangerous temperature change'},
    {id:'airlock',icon:'🚪',name:'DUST AIRLOCK',cost:2,need:'dust',detail:'keeps sharp Moon dust outside'},
    {id:'greenhouse',icon:'🌱',name:'GREENHOUSE',cost:4,need:'food',detail:'grows some fresh food; useful but not required for this short test'}
  ],required:['power','air','water','temperature','dust']},
  check:{title:'Which design rule solved the cargo problem?',lead:'Think about what happened when a test failed.',correct:'revise',choices:[
    ['all','Take every module, even if the cargo limit is broken.'],['guess','Keep the first design even when a need is missing.'],['revise','Use the test result to replace one module and test again.']
  ],success:'Correct. Testing showed exactly what the design needed next.',judge:{title:'TRUE or FAKE?',lead:'',prompt:'Did this rule solve the cargo problem? 통한 규칙이면 TRUE, 아니면 FAKE.',cards:[
    ['all','Take every module, even if the cargo limit is broken.',false,'FAKE! 크레딧 한도를 넘으면 로켓에 실을 수 없어요.'],
    ['revise','Use the test result to replace one module and test again.',true,'TRUE ✓ 시험 결과가 다음에 바꿀 장비를 알려 줬어요.'],
    ['guess','Keep the first design even when a need is missing.',false,'FAKE! 필요가 하나라도 빠지면 크루가 안전하지 않아요.']
  ]}},
  reading:{title:'What a Moon Habitat Must Provide',context:'Your habitat passed the survival tests. Now read what a real Moon habitat must provide, so you can explain why each module was needed.',easy:[
    'People cannot live on the Moon without a protected habitat.','A habitat must hold breathable air and help manage dangerous temperature changes.','Water is heavy to carry, so recycling systems clean and reuse it.','Solar panels can provide power, and an airlock can help keep Moon dust outside.','Engineers test a design and change it when an important need is missing.'
  ],challenge:[
    'A lunar habitat replaces several protections that Earth provides naturally.','Its sealed and insulated structure must hold breathable air and reduce harmful temperature changes.','Because every cargo item has a cost, recycling water and air can reduce the amount that must be delivered from Earth.','Power systems run the equipment, while a dust airlock limits the amount of abrasive lunar dust entering the living area.','Engineers use test results to revise a design until essential needs are met within the available resources.'
  ]},
  organize:{type:'needs-map',title:'Connect each need to its module.',lead:'Choose a module card, place it beside the matching need, and complete the design rule.',cards:[
    ['power','POWER','SOLAR ARRAY'],['air','AIR','OXYGEN RECYCLER'],['water','WATER','WATER RECYCLER'],['temperature','TEMPERATURE','INSULATED SHELTER'],['dust','DUST','DUST AIRLOCK']
  ],answer:'test',hint:'Look at strategy step 2: 설계 시험. The rule is Build, ____, and revise. The word starts with t and means 시험하다.'},
  retell:{title:'Why will your Moon base work?',prompt:'Write 2–4 English sentences. Name at least three needs and explain one design choice.',placeholder:'My Moon base has... It keeps the crew safe because...',frame:'The crew needs ____. I chose ____ because ____. After the test, I changed ____.'},
  solved:{eyebrow:'CASE 04 · HABITAT APPROVED',title:'시험하고 고쳐서<br>안전한 달 기지를 만들었어요!',text:'첫 설계가 완벽하지 않아도 괜찮습니다. 시험 결과에서 빠진 필요 하나를 찾고, 그 부분만 수정하면 더 좋은 해결책이 됩니다.'},
  coach:{watch:'필요 다섯 가지를 🔒 잠근 뒤 5초 잠수하고, 목록 없이 기억으로 모듈을 고르는지 봅니다(「살짝 보기」를 쓰면 🔎 탐정 보석, 감점 없음). 실패 후 한 항목만 바꾸어 재시험하는지, 4번에서 「📋 기록」을 몇 번 여는지도 관찰합니다.',answer:'11크레딧 통과 조합: solar+oxygen+water+shelter+airlock. 규칙 판정: all=FAKE · revise=TRUE · guess=FAKE. 정리 빈칸: test.'}
};
