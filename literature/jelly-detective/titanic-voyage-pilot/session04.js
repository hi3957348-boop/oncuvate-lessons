window.CASE_SESSION={
  id:'04',storage:'titanic-voyage-04:state:v1',lab:'Lifeboat Deck 04',hero:'image-hero titanic-safety-image',
  start:{eyebrow:'JELLY SEA DETECTIVES · TITANIC CASE 04',title:'The Mystery of<br><em>the Empty Seats</em>',lead:'구명보트가 충분하지 않았고 일부 자리까지 비었던 이유를 읽고, 정해진 예산 안에서 안전 규칙을 골라 세 가지 시험을 통과하도록 설계를 고치세요.'},
  caseLines:[
    ['LIFEBOAT REPORT · APRIL 15, 1912','The Titanic carried 20 lifeboats, with room for only about half of the people on board. Many of the first boats left less than half full.'],
    ['AFTER THE DISASTER','The Carpathia rescued more than 700 people, but over 1,500 were lost. Governments held hearings and asked how travel by sea could be safer.'],
    ['UNRESOLVED QUESTION','Which safety rules will provide enough lifeboat seats, keep distress calls heard, and help crews spot danger? Choose rules within the 11-credit budget. Test the design, and revise what is missing.']
  ],
  goal:{question:['What must the design do?','설계가 해야 할 일은 무엇일까요?'],correct:'needs',choices:[
    ['exciting','Choose the rules that sound the most exciting.','가장 신나게 들리는 규칙을 고른다.'],
    ['needs','Meet every safety need within 11 credits.','11 크레딧 안에서 모든 안전 필요를 충족한다.'],
    ['all','Load all six rules at once.','규칙 여섯 개를 한꺼번에 모두 싣는다.']
  ]},
  words:[["disaster", "a terrible event that hurts many people · 재난 : 많은 사람이 다치는 큰 사고", "After the disaster, new laws were passed.", ["disaster"], "dis·as·ter"], ["rescue", "to save someone from danger · 구조하다 : 위험에서 구해 내다", "The Carpathia rescued 706 people.", ["rescue", "rescued"], "res·cue"], ["survivor", "a person who lived through a disaster · 생존자 : 사고에서 살아남은 사람", "The Carpathia carried the survivors to New York.", ["survivor", "survivors"], "sur·vi·vor"], ["hearing", "an official meeting to find out what happened · 청문회 : 무슨 일이 있었는지 묻는 공식 모임", "Governments held hearings after the disaster.", ["hearing", "hearings"], "hear·ing"], ["government", "the people who make the laws of a country · 정부 : 나라의 법을 만드는 사람들", "Governments passed new laws for ships.", ["government", "governments"], "gov·ern·ment"], ["distress", "great danger or trouble · 조난 : 배가 큰 위험에 빠진 상태", "Ships must hear every distress call.", ["distress"], "dis·tress"], ["budget", "the amount you are allowed to spend · 예산 : 쓸 수 있다고 정해 둔 양", "Stay inside the budget of 11 credits.", ["budget"], "budg·et"], ["credit", "a point you can spend · 크레딧 : 쓸 수 있는 점수", "Each rule costs credits.", ["credit", "credits"], "cred·it"], ["design", "a plan for how to build something · 설계 : 무엇을 어떻게 만들지 정한 계획", "Test the design and revise it.", ["design", "designs"], "de·sign"], ["revise", "to change something to make it better · 고치다 : 더 낫게 바꾸다", "Revise the design when a need is missing.", ["revise"], "re·vise"], ["require", "to need something by rule · 요구하다 : 반드시 하도록 정하다", "New laws required enough lifeboats for everyone.", ["require", "required"], "re·quire"], ["drill", "a practice session for an emergency · 훈련 : 위험할 때 할 일을 미리 연습하는 것", "Ships now hold lifeboat drills.", ["drill", "drills"], "drill"], ["practice", "to do something again to learn it · 연습하다", "Passengers and crew practice what to do.", ["practice"], "prac·tice"], ["patrol", "a group that travels around to watch for danger · 순찰대 : 돌아다니며 위험을 살피는 무리", "The ice patrol warns ships of danger.", ["patrol", "patrols"], "pa·trol"], ["wireless", "a radio machine that sent messages without wires · 무선 전신", "New laws required a wireless watch that never stops.", ["wireless"], "wire·less"], ["refuse", "to say no · 거절하다 : 하지 않겠다고 하다", "Many women refused to leave their husbands.", ["refuse", "refused"], "re·fuse"], ["husband", "the man a woman is married to · 남편", "Many women refused to leave their husbands.", ["husband", "husbands"], "hus·band"], ["accident", "something bad that happens by chance · 사고 : 뜻하지 않게 일어난 나쁜 일", "Practice what to do in case of an accident.", ["accident"], "ac·ci·dent"], ["steam", "to travel by a steam engine · 증기로 달리다 : 여기서는 「증기선으로 가다」", "The Carpathia steamed nearly 60 miles through the ice.", ["steam", "steamed"], "steam"], ["scientist", "a person who studies how things work · 과학자", "In 1985 a scientist found the wreck.", ["scientist"], "sci·en·tist"], ["wreck", "what is left of a broken ship · 잔해 : 부서진 배의 남은 부분", "Robert Ballard found the wreck of the Titanic.", ["wreck"], "wreck"]],
  strategy:{labels:['필요 확인','설계 시험','한 가지 수정'],game:'필요와 예산을 보며 안전 규칙을 설계해요',check:'실패한 시험 하나를 보고 설계를 바꿔요'},
  guide:{game:[
    {en:'Choose rules within 11 credits.',ko:'11 크레딧 안에서 규칙을 골라요.'},
    {en:'Run the safety tests.',ko:'안전 시험을 실행해요.'},
    {en:'If a test fails, change only one rule.',ko:'시험이 실패하면 규칙 하나만 바꿔요.'}
  ]},
  game:{type:'base',title:'Design safety rules for every ship.',eyebrow:'SAFETY RULE DESIGNER',intro:'Choose rules up to 11 credits. Run the tests, then change only what is needed.',budget:11,modules:[
    {id:'boats',name:'LIFEBOATS FOR ALL',cost:3,need:'seats',detail:'carries enough lifeboat seats for more than the number of people on board'},
    {id:'radio',name:'24-HOUR WIRELESS WATCH',cost:2,need:'signal',detail:'keeps the radio on at all times to hear distress calls'},
    {id:'patrol',name:'ICE PATROL',cost:2,need:'ice',detail:'looks for icebergs and warns ships of danger'},
    {id:'drill',name:'LIFEBOAT DRILLS',cost:2,need:'practice',detail:'passengers and crew practice what to do in an accident'},
    {id:'lookout',name:'MORE LOOKOUTS · BINOCULARS',cost:2,need:'watch',detail:'extra eyes and binoculars to spot ice early'},
    {id:'band',name:'DECK ORCHESTRA',cost:4,need:'music',detail:'music helps passengers stay calm; comforting but not required for this test'}
  ],required:['seats','signal','ice','practice','watch'],tests:[
    {name:'LIFEBOAT TEST',needs:['seats','practice']},{name:'SIGNAL TEST',needs:['signal']},{name:'ICE TEST',needs:['ice','watch']}
  ]},
  check:{title:'What should a designer do when a safety test fails?',lead:'Use the test result to decide what to change.',correct:'revise',choices:[
    ['all','Take every rule, even if the budget is broken.'],['guess','Keep the first design even when a need is missing.'],['revise','Use the test result to replace one rule and test again.']
  ],success:'Correct. Testing showed exactly which need the design was missing.'},
  reading:{title:'Lessons from the Titanic',easy:[
    'The Titanic had lifeboats for only about half of the people on board.','At first, some passengers hesitated because they did not understand how serious the danger was.','Some of the first lifeboats left the ship less than half full.','After the disaster, new laws required enough lifeboats for everyone on board.','Ships now hold lifeboat drills to practice what to do in an accident.'
  ],challenge:[
    'Safety rules in 1912 were written for smaller ships, so 20 lifeboats were considered enough under the old rules.','Without enough practice, loading the lifeboats was confusing and some boats left with empty seats.','The Carpathia hurried through icy water and rescued more than 700 survivors.','New rules later required lifeboats for everyone, lifeboat drills, and a wireless watch that never stops.','The International Ice Patrol still warns ships today, and a U.S.–French team located the wreck in 1985.'
  ]},
  organize:{type:'needs-map',title:'Connect each need to its rule.',lead:'Choose a rule card, place it beside the matching need, and complete the design rule.',bank:'RULE CARDS',cards:[
    ['seats','A SEAT FOR EVERYONE','LIFEBOATS FOR ALL'],['signal','HEAR EVERY DISTRESS CALL','24-HOUR WIRELESS WATCH'],['ice','KNOW WHERE THE ICE IS','ICE PATROL'],['practice','KNOW WHAT TO DO','LIFEBOAT DRILLS'],['watch','SPOT DANGER EARLY','MORE LOOKOUTS · BINOCULARS']
  ],blank:['Build,','and revise.'],answer:'test'},
  retell:{title:'Why will your safety rules work?',prompt:'Write 2–4 English sentences. Name at least three needs and explain one rule you chose.',placeholder:'My rules give every person a seat... I chose... because...',frame:'Every ship needs ____. I chose ____ because ____. After the test, I changed ____.'},
  solved:{eyebrow:'CASE 04 · RULES APPROVED',title:'시험하고 고쳐서<br>모두를 위한 안전 규칙을 만들었어요!',text:'첫 설계가 완벽하지 않아도 괜찮습니다. 시험 결과에서 빠진 필요 하나를 찾고, 그 규칙만 바꾸면 더 안전한 배가 됩니다.'},
  coach:{watch:'무작정 모든 규칙을 고르기보다 필요 목록과 예산을 대조하고, 실패 후 한 항목만 바꾸어 재시험하는지 관찰합니다.',answer:'11크레딧 통과 조합: boats+radio+patrol+drill+lookout (DECK ORCHESTRA 제외). 정리 빈칸: test.'}
};
window.CASE_SESSION.words = window.CASE_SESSION.words.map(entry => {
  if (entry[0] === 'rescue') return ['rescue', 'to save someone from danger · 구조하다 : 위험에서 구해 내다', 'The Carpathia rescued more than 700 people.', entry[3], entry[4]];
  if (entry[0] === 'credit') return ['credit', 'a game point you can spend · 크레딧 : 이 활동에서 사용할 수 있는 점수', entry[2], entry[3], entry[4]];
  if (entry[0] === 'steam') return ['steam', 'to travel using steam power · 증기로 항해하다 : 증기 기관의 힘으로 배가 나아가다', 'The Carpathia steamed through icy water to help.', entry[3], entry[4]];
  if (entry[0] === 'scientist') return ['oceanographer', 'a scientist who studies the ocean · 해양학자 : 바다를 연구하는 과학자', 'Oceanographers helped locate the wreck in 1985.', ['oceanographer', 'oceanographers'], 'o·cean·og·ra·pher'];
  if (entry[0] === 'wreck') return ['wreck', entry[1], 'A U.S.–French team located the wreck in 1985.', entry[3], entry[4]];
  return entry;
}).filter(entry => entry[0] !== 'refuse' && entry[0] !== 'husband');
