window.SPACE_SESSION={
  id:'03',storage:'space-observatory-03:state:v1',lab:'Moon Mission 03',hero:'lander-hero',
  start:{eyebrow:'JELLY SPACE DETECTIVES · CASE 03',title:'The Mystery of<br><em>the Silent Moon Lander</em>',lead:'고장 정보를 읽고 수리 순서를 정한 뒤, 전력·온도·통신 시스템을 직접 복구하세요.'},
  caseLines:[
    ['MISSION ALERT · LUNAR DAWN','A robotic lander stopped sending data after a cold lunar night. Its power light and two other warning lights are red.'],
    ['SYSTEM REPORT','The battery is low, the instrument box is too cold, and the antenna is pointing away from Earth.'],
    ['UNRESOLVED QUESTION','Which controls will restore the mission? Make a short plan, repair one system at a time, and check every result.']
  ],
  goal:{question:['What is the best mission goal?','가장 알맞은 임무 목표는 무엇일까요?'],correct:'restore',choices:[
    ['fast','Press every control as fast as possible.','모든 조작 버튼을 최대한 빨리 누른다.'],
    ['restore','Plan, repair, and check the three failed systems.','세 고장 시스템을 계획하고 수리한 뒤 확인한다.'],
    ['photo','Take a new picture of the Moon.','달의 새 사진을 찍는다.']
  ]},
  words:[["power", "energy used to run a machine · 전력 : 기계를 움직이거나 작동시키는 데 쓰는 에너지", "The solar panel provides power to the lander.", ["power"], "pow·er"], ["insulate", "protect from heat or cold · 단열하다 : 열이 들어오거나 나가는 것을 막다", "The cover helps insulate the instrument box.", ["insulate", "insulated"], "in·su·late"], ["antenna", "a part that sends or receives signals · 안테나 : 신호를 보내거나 받는 장치", "The antenna sends data toward Earth.", ["antenna", "antennas"], "an·ten·na"], ["sequence", "an order of steps · 순서 : 일이 이루어지는 앞뒤의 차례", "The team followed a short repair sequence.", ["sequence"], "se·quence"], ["lunar", "about the Moon · 달의", "The lunar night is very cold.", ["lunar"], "lu·nar"], ["instrument", "a tool for measuring · 기구 : 재거나 조사하는 도구", "The instrument box is too cold.", ["instrument", "instruments"], "in·stru·ment"], ["atmosphere", "the air around a planet · 대기 : 행성을 둘러싼 공기", "The Moon has almost no atmosphere.", ["atmosphere"], "at·mos·phere"], ["electricity", "energy that runs lights and machines · 전기", "Solar panels make electricity.", ["electricity", "electrical"], "e·lec·tric·i·ty"], ["signal", "a message sent by radio · 신호", "Earth receives no signal.", ["signal", "signals"], "sig·nal"], ["repair", "to fix · 수리하다", "Repair one system at a time.", ["repair", "repairs", "repaired"], "re·pair"], ["restore", "to bring back to working · 복구하다 : 다시 되게 하다", "Which controls will restore the mission?", ["restore", "restored"], "re·store"], ["result", "what happens after you do something · 결과", "Check every result.", ["result", "results"], "re·sult"], ["control", "a button or switch that runs a machine · 조작 장치", "Test one control in each system.", ["control", "controls"], "con·trol"], ["verify", "to check that it is true · 확인하다", "Mission teams verify each result.", ["verify"], "ver·i·fy"], ["convert", "to change into another form · 바꾸다", "Solar panels convert sunlight into energy.", ["convert"], "con·vert"], ["protection", "keeping safe · 보호", "Machines have little natural protection on the Moon.", ["protection"], "pro·tec·tion"], ["several", "more than two · 여러", "Landers need several connected systems.", ["several"], "sev·er·al"], ["difficult", "hard to do · 어려운", "The Moon is a difficult place for machines.", ["difficult"], "dif·fi·cult"], ["receive", "to get · 받다", "Earth receives the signal.", ["receive", "receives"], "re·ceive"], ["communication", "sending and getting messages · 통신", "The communication system was restored.", ["communication"], "com·mu·ni·ca·tion"], ["temperature", "how hot or cold something is · 온도", "The box is below its safe temperature.", ["temperature", "temperatures"], "tem·per·a·ture"], ["compartment", "a closed section inside · 칸 : 안이 나뉜 한 공간", "Insulated compartments slow heat loss.", ["compartment", "compartments"], "com·part·ment"]],
  strategy:{labels:['짧게 계획','하나씩 실행','결과 확인'],game:'먼저 순서를 정하고 한 시스템씩 수리해요',check:'세 결과가 모두 바뀌었는지 확인해요'},
  guide:{game:[
    {en:'Make a short three-step repair plan.',ko:'세 단계의 짧은 수리 계획을 세워요.'},
    {en:'Repair only the system marked REPAIR NOW.',ko:'REPAIR NOW로 표시된 시스템 하나만 수리해요.'},
    {en:'Check the result before the next repair.',ko:'다음 수리 전에 결과를 확인해요.'}
  ]},
  game:{type:'systems',title:'Restore the silent lander.',eyebrow:'MISSION CONTROL',intro:'Choose a repair order. Then test one control in each system.',items:[
    {id:'power',name:'POWER',problem:'Battery level: 8%. Sunlight has reached the landing site.',correct:'Turn the solar panel toward the Sun.',options:['Turn the solar panel toward the Sun.','Cover the solar panel.','Point the antenna at the ground.']},
    {id:'heat',name:'TEMPERATURE',problem:'The instrument box is below its safe temperature.',correct:'Close the insulated cover around the box.',options:['Open the box to space.','Close the insulated cover around the box.','Turn the antenna in a circle.']},
    {id:'signal',name:'COMMUNICATION',problem:'The radio works, but Earth receives no signal.',correct:'Point the antenna toward Earth.',options:['Point the antenna toward Earth.','Point the antenna at the Moon.','Switch off the radio.']}
  ]},
  check:{title:'Which mission report matches the repair?',lead:'Look at the three green systems and choose the complete report.',correct:'complete',choices:[
    ['signal','Only the antenna needed repair.'],['complete','Power, temperature, and communication were each restored with a matching control.'],['random','Random button pressing repaired the lander.']
  ],success:'Mission restored. A short plan kept one problem from being forgotten.'},
  reading:{title:'How Machines Work on the Moon',easy:[
    'The Moon is a difficult place for machines.','It has almost no atmosphere to hold heat or block harmful space conditions.','Solar panels can make electricity when sunlight reaches them.','Insulated covers help instruments stay within a safer temperature range.','Antennas must point correctly so radio signals can travel between the Moon and Earth.'
  ],challenge:[
    'Robotic landers need several connected systems to work on the Moon.','Because the Moon has almost no atmosphere, machines face large temperature changes and little natural protection.','Solar panels convert sunlight into electrical energy, while insulated compartments slow unwanted heat loss or gain.','Directional antennas send radio data across space when they are aimed toward Earth.','Mission teams plan a repair sequence and verify each result so that one successful change does not hide another problem.'
  ]},
  organize:{type:'repair-order',title:'Turn the repair into a clear sequence.',lead:'Place all three action cards in your chosen order. Then type the final checking word.',cards:[
    ['power','Aim the solar panel.'],['heat','Close the insulated cover.'],['signal','Point the antenna toward Earth.']
  ],answer:'check'},
  retell:{title:'How did you restore the lander?',prompt:'Write a short mission report in English. Use order words and name at least two repairs.',placeholder:'First, I... Next... Finally...',frame:'First, I ____. Next, I ____. Finally, I checked ____.'},
  solved:{eyebrow:'CASE 03 · SIGNAL RESTORED',title:'계획하고 하나씩 실행해<br>달 착륙선을 깨웠어요!',text:'해야 할 일이 여러 개일 때는 짧은 순서를 만들고, 한 단계가 끝날 때마다 결과를 확인하면 빠뜨림이 줄어듭니다.'},
  coach:{watch:'정답 버튼을 찾는 속도보다, 시작 전에 세 시스템의 순서를 스스로 정하고 완료 표시를 따라가는지 관찰합니다.',answer:'POWER: solar panel toward Sun. TEMPERATURE: insulated cover. COMMUNICATION: antenna toward Earth. 빈칸: check.'}
};
