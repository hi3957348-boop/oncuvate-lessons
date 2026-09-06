window.SPACE_SESSION={
  id:'02',storage:'space-observatory-02:state:v1',lab:'Planet Route 02',hero:'planet-hero',
  start:{eyebrow:'JELLY SPACE DETECTIVES · CASE 02',title:'The Mystery of<br><em>the Lost Planet Route</em>',lead:'행성을 직접 탐험하고 같은 기준으로 비교해, 착륙할 수 없는 목적지를 찾아내세요.'},
  caseLines:[
    ['ROUTE ALERT · 7:40 A.M.','The probe’s four destination labels were erased during a software update. Only its surface scan records remain.'],
    ['MISSION RULE','The probe must touch down on solid ground to collect a sample. One stop on the route has no solid surface like Earth.'],
    ['UNRESOLVED QUESTION','Which planet must be removed from the landing route? Compare every scan by the same two questions: What is it made of? What is its surface like?']
  ],
  goal:{question:['What must we find?','무엇을 찾아야 할까요?'],correct:'landing',choices:[
    ['count','Count every moon in the solar system.','태양계의 모든 달을 센다.'],
    ['landing','Find the planet that cannot provide solid landing ground.','단단한 착륙 지면을 제공할 수 없는 행성을 찾는다.'],
    ['bright','Choose the brightest object.','가장 밝은 천체를 고른다.']
  ]},
  words:[["surface", "the outside layer · 표면 : 물체의 겉을 이루는 부분", "The rover needs a solid surface to land on.", ["surface", "surfaces"], "sur·face"], ["rocky", "made mostly of rock · 암석으로 된 : 주로 돌이나 바위로 이루어진", "Mars is a rocky planet.", ["rocky"], "rock·y"], ["giant", "something much larger · 거대한 : 크기가 매우 큰", "Jupiter is a giant planet.", ["giant", "giants"], "gi·ant"], ["compare", "look for the same and different parts · 비교하다 : 둘 이상의 같은 점과 다른 점을 살펴보다", "We compare the planets using the same questions.", ["compare", "compares", "comparison"], "com·pare"], ["probe", "a machine sent to explore space · 탐사선 : 우주를 조사하러 보내는 기계", "The probe must land on solid ground.", ["probe", "probes"], "probe"], ["destination", "the place you are going to · 목적지 : 가려고 하는 곳", "One destination has no solid ground.", ["destination", "destinations"], "des·ti·na·tion"], ["remain", "to stay or be left · 남다", "Only the scan records remain.", ["remain", "remains"], "re·main"], ["sample", "a small piece taken to study · 표본 : 조사하려고 조금 떼어 낸 것", "The probe collects a rock sample.", ["sample", "samples"], "sam·ple"], ["route", "the way you travel · 경로 : 가는 길", "Which planet must leave the route?", ["route"], "route"], ["solid", "hard, not liquid or gas · 단단한 : 액체나 기체가 아닌", "Mars has a solid surface.", ["solid"], "sol·id"], ["liquid", "something that flows, like water · 액체", "Jupiter is made mostly of gas and liquid.", ["liquid"], "liq·uid"], ["mission", "an important job to do · 임무 : 맡은 중요한 일", "This mission needs a place to land.", ["mission", "missions"], "mis·sion"], ["feature", "one part of what something is like · 특징", "Scientists compare the same features.", ["feature", "features"], "fea·ture"], ["temperature", "how hot or cold something is · 온도", "Planets can be compared by their temperatures.", ["temperature", "temperatures"], "tem·per·a·ture"], ["category", "a group of things that go together · 분류 항목 : 같은 종류끼리 묶은 칸", "Use the same comparison categories.", ["category", "categories"], "cat·e·go·ry"], ["decision", "a choice you make · 결정", "Comparing helps make a fair decision.", ["decision", "decisions"], "de·ci·sion"], ["beneath", "under · 아래에", "The ground is solid beneath the probe.", ["beneath"], "be·neath"], ["layer", "one level on top of another · 층", "Jupiter’s outer layers are gas.", ["layer", "layers"], "lay·er"], ["distance", "how far apart · 거리", "A probe can study Jupiter from a distance.", ["distance"], "dis·tance"]],
  strategy:{labels:['기준 정하기','같은 칸 비교','결론 확인'],game:'같은 두 질문으로 행성을 조사해요',check:'비교표를 가로로 읽고 결론을 확인해요'},
  guide:{game:[
    {en:'Move the probe to one planet.',ko:'탐사선을 행성 하나로 옮겨요.'},
    {en:'Read its scan, then mark one route note.',ko:'스캔을 읽은 뒤 항로 메모 하나를 표시해요.'}
  ]},
  game:{type:'planets',title:'Move the probe and scan four planets.',eyebrow:'EXPLORE THE SOLAR MAP',intro:'Tap a planet. Read its scan, remember the key fact, and mark one note.',items:[
    {id:'venus',name:'VENUS',fact:'Venus is a rocky planet. Thick clouds trap heat above its solid surface.',question:'What should the route log record?',correct:'Rocky · solid surface',options:['Rocky · solid surface','Gas giant · no solid surface','Made only of ice']},
    {id:'earth',name:'EARTH',fact:'Earth is a rocky planet with a solid surface. Liquid water covers much of it.',question:'What should the route log record?',correct:'Rocky · solid surface',options:['Gas giant · no solid surface','Rocky · solid surface','A star that makes light']},
    {id:'mars',name:'MARS',fact:'Mars is a cold, rocky planet. Its dusty ground is solid beneath the probe.',question:'What should the route log record?',correct:'Rocky · solid surface',options:['Rocky · solid surface','A moon of Earth','Gas giant · no solid surface']},
    {id:'jupiter',name:'JUPITER',fact:'Jupiter is a gas giant. It does not have a solid surface where this probe can land.',question:'What should the route log record?',correct:'Gas giant · no solid surface',options:['Rocky · solid surface','Gas giant · no solid surface','Small rocky moon']}
  ]},
  check:{title:'Which stop must leave the landing route?',lead:'Use all four scan notes. Do not choose by size or color alone.',correct:'jupiter',choices:[
    ['venus','VENUS · It is hidden by clouds.'],['jupiter','JUPITER · It has no solid landing surface.'],['mars','MARS · Its ground is dusty.']
  ],success:'Correct. Jupiter is a gas giant, so this landing mission needs a different destination.'},
  reading:{title:'Rocky Planets and Giant Planets',easy:[
    'The planets in our solar system are not all alike.','Venus, Earth, and Mars are rocky planets with solid surfaces.','Jupiter is a giant planet made mostly of gas and liquid.','A spacecraft can fly near Jupiter, but it cannot land on a solid surface there.','Scientists compare the same features before they choose a mission destination.'
  ],challenge:[
    'Planets can be compared by their materials, surfaces, temperatures, and other features.','Venus, Earth, and Mars belong to the rocky planet group because they have solid outer surfaces.','Jupiter is a giant planet made mostly of gas and liquid, so its outer layers do not provide ground like Earth’s.','A probe may orbit or study Jupiter from a distance, but a solid-ground lander needs another destination.','Using the same comparison categories helps mission planners make a fair decision.'
  ]},
  organize:{type:'planet-sort',title:'Build a planet comparison board.',lead:'Choose a planet card, place it in the correct group, and complete the comparison sentence.',cards:[
    ['venus','VENUS','rocky'],['earth','EARTH','rocky'],['mars','MARS','rocky'],['jupiter','JUPITER','giant']
  ],answer:'surface'},
  retell:{title:'Why did the route change?',prompt:'Write 2–3 English sentences. Compare Jupiter with at least one rocky planet.',placeholder:'Venus, Earth, and Mars... Jupiter...',frame:'Venus, Earth, and Mars are ____. Jupiter is ____. The probe should ____ because ____.'},
  solved:{eyebrow:'CASE 02 · ROUTE RESTORED',title:'같은 기준으로 비교해<br>안전한 항로를 찾았어요!',text:'대상이 여러 개일 때는 같은 질문과 같은 칸으로 비교하면 중요한 차이가 더 잘 보입니다.'},
  coach:{watch:'행성마다 기준을 바꾸지 않고 material과 surface 두 칸을 반복해서 확인하는지 관찰합니다.',answer:'비교 결론: Jupiter 제외. 정리 문장 빈칸: surface.'}
};
