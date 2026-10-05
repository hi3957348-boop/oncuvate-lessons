(function () {
  'use strict';

  const runtime = window.ONCUVATE || {};
  const requestedRole = new URLSearchParams(window.location.search).get('pilotRole');
  if (!runtime.role && requestedRole === 'coach') runtime.role = requestedRole;
  const isCoach = runtime.role === 'coach';
  const signals = window.OncuvateCaseSignals?.create({ sessionNo: 1, lessonId: 'titanic-voyage' })
    || { log() {}, enterScreen() {}, startLesson() {}, ready() { return {}; }, respond() { return { attemptNo: 1 }; }, hint() {}, close() {}, activityComplete() {}, lessonComplete() {}, decorate() {}, decorateLater() {}, fire(el) { el?.click(); }, textLength() { return 0; }, item() { return { attempts: 0 }; }, sinceReadyMs() { return undefined; } };
  const storageKey = 'titanic-voyage:s01:state:v1';
  const screenOrder = ['start', 'case', 'goal', 'search', 'deduction', 'reading', 'wordhunt', 'spelling', 'mindmap', 'retell', 'solved'];
  const screenActivity = { goal: 'goal', search: 'clue-notes', deduction: 'deduction', reading: 'information-reading', wordhunt: 'sound-alike-words', spelling: 'spot-the-word', mindmap: 'information-mindmap', retell: 'retell' };
  const screenLabels = {
    start: '준비', case: '사건파일', goal: '목표 찾기', search: '단서 수색',
    deduction: '기록 판별', reading: '정보글 읽기', wordhunt: '소리 닮은 말', spelling: '진짜 낱말 찾기', mindmap: '인포그래픽', retell: '다시 설명하기', solved: '사건 해결'
  };
  const screenGoals = {
    start: '사건 파일을 열어요',
    case: '사건 정보를 한 문장씩 확인해요',
    goal: '오늘 해결할 문제 하나를 골라요',
    search: '단서를 찾아 기억을 잠그고 금고를 열어요',
    deduction: '보석과 맞지 않는 가짜 기록을 잡아요',
    reading: '증거가 주장을 검증한 과정을 읽어요',
    wordhunt: '문장 소리를 듣고 틀리게 적힌 낱말을 찾아 고쳐요',
    spelling: '2분 동안 진짜 낱말을 최대한 많이 냠!',
    mindmap: '문장 카드를 하나씩 완성해 포스터에 붙여요',
    retell: '증거를 사용해 내 말로 설명해요',
    solved: '오늘 사용한 방법을 기억해요'
  };
  const caseLines = [
    {
      label: "CASE STORY NOTE · APRIL 1912",
      text: "In April 1912, some people described the new ship Titanic as unsinkable. It was the largest ship in the world and almost as long as three 100-yard football fields.",
      next: "다음 사건 기록"
    },
    {
      label: "MISSING EVIDENCE",
      text: "Three evidence cards about the safety of the ship are missing from the office file. Without them, nobody can check the record.",
      next: "마지막 사건 기록"
    },
    {
      label: "UNRESOLVED QUESTION",
      text: "The record makes this claim: The Titanic cannot sink. Was the claim correct, or was it a mistaken idea?",
      next: "해결 목표 정하기"
    }
  ];
  const clues = [
    {
      id: 'compartment', title: 'Compartment Drawing', symbol: 'compartment',
      sentence: 'The lower part of the ship was divided into 16 compartments. The compartments were designed to limit flooding.',
      correct: 'The ship had 16 compartments designed to limit flooding.',
      options: ['The compartments proved that the whole ship could never sink.', 'The ship had 16 compartments designed to limit flooding.', 'The ship had no compartments to limit flooding.'],
      reviewPrompt: 'What were the 16 compartments designed to do?', wordUnlock: 2
    },
    {
      id: 'lifeboat', title: 'Lifeboat Count', symbol: 'lifeboat',
      sentence: 'The Titanic carried 20 lifeboats. They had room for only about half of the people on board.',
      correct: 'The lifeboats had room for about half of the people.',
      options: ['The lifeboats had room for everyone on board.', 'The lifeboats had room for about half of the people.', 'The ship carried no lifeboats at all.'],
      reviewPrompt: 'How many people could the 20 lifeboats hold?', wordUnlock: 3
    },
    {
      id: 'sailing', title: 'Sailing Day Notice', symbol: 'sailing',
      sentence: 'The Titanic sailed from Southampton on April 10, 1912. Captain Smith had a crew of more than 800.',
      correct: 'The Titanic sailed on April 10, 1912.',
      options: ['The Titanic sailed on April 2, 1912.', 'The Titanic sailed on April 10, 1912.', 'The Titanic never left the dock.'],
      reviewPrompt: 'When did the Titanic sail from Southampton?', wordUnlock: 4
    }
  ];
  const readingTexts = {
    easy: [
      'In 1912, many people believed the new ship Titanic was so safe it could never sink.',
      'Its lower part was divided into 16 compartments.',
      'The compartments were designed to limit flooding by closing off parts of the ship.',
      'This safety design made the Titanic seem very strong.',
      'But the ship carried only 20 lifeboats, enough for about half of the people on board.',
      'The evidence showed that the ship had safety features, but it did not prove that the whole ship could never sink.'
    ],
    challenge: [
      'On its first voyage in April 1912, the Titanic was the largest passenger ship in the world.',
      'Its lower hull was divided into 16 compartments, and watertight doors could isolate a damaged section.',
      'These safety features were intended to limit flooding, but they did not prove that the entire ship was unsinkable.',
      'The ship also carried only 20 lifeboats, with space for about half of the passengers and crew.',
      'The evidence supports the idea that the Titanic was carefully designed, not the stronger claim that it could never sink.'
    ]
  };
  const words = [
    { word: "Titanic", meaning: "the name of the ship; it means huge and powerful · 타이타닉 : 이 배의 이름, 「거대하고 힘센」이라는 뜻", example: "The Titanic was the biggest ship in the world.", forms: ["Titanic"], read: "Ti·tan·ic" },
    { word: "unsinkable", meaning: "not able to sink · 가라앉을 수 없는 : 물에 절대 가라앉지 않는다는 뜻", example: "Some people called the Titanic unsinkable.", forms: ["unsinkable"], read: "un·sink·a·ble" },
    { word: "claim", meaning: "a statement said to be true · 주장 : 사실이라고 내세우는 말", example: "The record makes a claim about the ship.", forms: ["claim", "claims"], read: "claim" },
    { word: "record", meaning: "information saved for later · 기록 : 나중에 확인할 수 있도록 남겨 둔 정보", example: "The office kept a record of the new ship.", forms: ["record", "records"], read: "rec·ord" },
    { word: "evidence", meaning: "a fact that helps us decide · 근거 : 어떤 판단이 맞는지 확인하는 데 도움이 되는 사실", example: "The lifeboat count was important evidence.", forms: ["evidence"], read: "ev·i·dence" },
    { word: "mistaken", meaning: "based on a wrong idea · 잘못된 : 사실과 다르게 알고 있거나 판단한", example: "The old claim was a mistaken idea.", forms: ["mistaken"], read: "mis·tak·en" },
    { word: "shipyard", meaning: "a place where ships are built · 조선소 : 배를 만드는 곳", example: "The Titanic was built at a shipyard in Belfast.", forms: ["shipyard", "shipyards"], read: "ship·yard" },
    { word: "compartment", meaning: "one closed part inside a ship · 구획 : 배 안을 나누어 막은 칸", example: "The ship had 16 compartments.", forms: ["compartment", "compartments"], read: "com·part·ment" },
    { word: "afloat", meaning: "floating on the water · 물에 떠 있는 : 가라앉지 않고 물 위에 떠 있는", example: "The ship was designed to stay afloat after some damage.", forms: ["afloat"], read: "a·float" },
    { word: "flood", meaning: "to fill with water · 물에 잠기다 : 물이 차서 잠기다", example: "Water flooded the lower compartments.", forms: ["flood", "flooded", "floods"], read: "flood" },
    { word: "seal", meaning: "to close tightly so nothing gets in · 밀봉하다 : 물이 못 들어오게 꼭 막다", example: "A flooded compartment could be sealed off.", forms: ["seal", "sealed"], read: "seal" },
    { word: "divide", meaning: "to split into parts · 나누다 : 여러 부분으로 가르다", example: "The lower part was divided into 16 compartments.", forms: ["divide", "divided"], read: "di·vide" },
    { word: "design", meaning: "a plan for how something is built · 설계 : 어떻게 만들지 정한 계획", example: "Thomas Andrews designed the ship.", forms: ["design", "designed"], read: "de·sign" },
    { word: "believe", meaning: "to think something is true · 믿다 : 사실이라고 생각하다", example: "Many people believed the ship could never sink.", forms: ["believe", "believed"], read: "be·lieve" },
    { word: "passenger", meaning: "a person who rides on a ship · 승객 : 배를 타고 가는 손님", example: "The ship had room for more than 2,500 passengers.", forms: ["passenger", "passengers"], read: "pas·sen·ger" },
    { word: "crew", meaning: "the people who work on a ship · 승무원 : 배에서 일하는 사람들", example: "The crew had more than 800 people.", forms: ["crew"], read: "crew" },
    { word: "captain", meaning: "the person in charge of a ship · 선장 : 배를 지휘하는 사람", example: "Captain Smith was in charge of the Titanic.", forms: ["captain"], read: "cap·tain" },
    { word: "voyage", meaning: "a long trip by ship · 항해 : 배를 타고 가는 긴 여행", example: "The first voyage was from England to New York.", forms: ["voyage", "voyages"], read: "voy·age" },
    { word: "Southampton", meaning: "a port city in England · 사우샘프턴 : 타이타닉이 출항한 영국의 항구 도시", example: "The Titanic sailed from Southampton.", forms: ["Southampton"], read: "South·amp·ton" },
    { word: "on board", meaning: "on or inside a ship · 승선한 : 배에 타고 있거나 배 안에 있는", example: "About half of the people on board could fit in the lifeboats.", forms: ["on board"], read: "on board" }
  ];
  const wordHuntItems = [
    { id: 'wh1', words: ['Passengers', 'crowded', 'the', 'desk', 'as', 'the', 'ship', 'left', 'Southampton.'], wrong: 3, decoy: 1, answer: 'deck', choices: ['deck', 'desk', 'disk'], ko: '배가 사우샘프턴을 떠날 때 승객들이 갑판에 모여들었어요.' },
    { id: 'wh2', words: ['There', 'was', 'room', 'in', 'the', 'bolts', 'for', 'about', 'half', 'of', 'the', 'people.'], wrong: 5, decoy: 2, answer: 'boats', choices: ['boats', 'bolts', 'bowls'], ko: '보트에는 사람들의 약 절반이 탈 자리만 있었어요.' },
    { id: 'wh3', words: ['There', 'was', 'often', 'eyes', 'in', 'the', 'sea', 'lanes', 'in', 'April.'], wrong: 3, decoy: 7, answer: 'ice', choices: ['ice', 'eyes', 'ace'], ko: '4월에는 항로에 얼음이 자주 있었어요.' },
    { id: 'wh4', words: ['Some', 'people', 'said', 'the', 'Titanic', 'could', 'never', 'sing.'], wrong: 7, decoy: 4, answer: 'sink', choices: ['sink', 'sing', 'sick'], ko: '어떤 사람들은 타이타닉이 절대 가라앉을 수 없다고 말했어요.' },
    { id: 'wh5', words: ['Captain', 'Smith', 'commanded', 'a', 'crow', 'of', 'more', 'than', '800', 'people.'], wrong: 4, decoy: 2, answer: 'crew', choices: ['crew', 'crow', 'crown'], ko: '스미스 선장은 800명이 넘는 승무원을 지휘했어요.' },
    { id: 'wh6', words: ['Stokers', 'shoveled', 'coal', 'into', 'the', 'boilers', 'to', 'make', 'stem.'], wrong: 8, decoy: 5, answer: 'steam', choices: ['steam', 'stem', 'stream'], ko: '화부들은 증기를 만들려고 보일러에 석탄을 퍼 넣었어요.' }
  ];
  const spellingItems = [{"id": "sp1", "word": "unsinkable", "choices": [{"w": "unsinkable", "ok": true}, {"w": "unstinkable", "joke": "stink(냄새)! 배에서 냄새가 안 난다는 뜻이 돼요 🐟"}, {"w": "unsinkabel", "joke": "끝은 -able이에요."}]}, {"id": "sp2", "word": "compartment", "choices": [{"w": "compartment", "ok": true}, {"w": "compartmint", "joke": "mint(박하)가 들어갔어요 🍬"}, {"w": "compartmen", "joke": "t가 하나 빠졌어요."}]}, {"id": "sp3", "word": "passenger", "choices": [{"w": "passenger", "ok": true}, {"w": "passenjer", "joke": "g가 j로 바뀌었어요. 소리는 같아도 글자가 달라요."}, {"w": "passengerbil", "joke": "gerbil(햄스터 친구)이 숨었어요 🐹"}]}, {"id": "sp4", "word": "voyage", "choices": [{"w": "voyage", "ok": true}, {"w": "voyoge", "joke": "a가 o로 바뀌었어요."}, {"w": "royage", "joke": "royal(왕)이 들어갔나요? 👑 v를 찾아요."}]}, {"id": "sp5", "word": "shipyard", "choices": [{"w": "shipyard", "ok": true}, {"w": "sheepyard", "joke": "sheep(양) 마당이 됐어요 🐑"}, {"w": "shipyerd", "joke": "a가 e로 바뀌었어요."}]}, {"id": "sp6", "word": "captain", "choices": [{"w": "captain", "ok": true}, {"w": "captin", "joke": "a가 하나 빠졌어요."}, {"w": "capetain", "joke": "cape(망토)를 두른 선장? 🦸 e가 하나 더 있어요."}]}, {"id": "sp7", "word": "evidence", "choices": [{"w": "evidence", "ok": true}, {"w": "evidense", "joke": "c 자리에 s가 들어갔어요. 소리는 같아도 글자가 달라요."}, {"w": "evidance", "joke": "가운데 e가 a로 바뀌었어요."}]}, {"id": "sp8", "word": "believe", "choices": [{"w": "believe", "ok": true}, {"w": "beleive", "joke": "i와 e의 순서가 뒤바뀌었어요. believe는 i 다음 e!"}, {"w": "bee-lieve", "joke": "벌(bee)이 날아왔어요 🐝"}]}, {"id": "sp9", "word": "mistaken", "choices": [{"w": "mistaken", "ok": true}, {"w": "misteaken", "joke": "tea(차)가 숨었어요 ☕"}, {"w": "mistakin", "joke": "끝은 -en이에요."}]}, {"id": "sp10", "word": "design", "choices": [{"w": "design", "ok": true}, {"w": "desine", "joke": "소리 안 나는 g가 빠졌어요."}, {"w": "dessign", "joke": "s가 하나 더 들어갔어요."}]}, {"id": "sp11", "word": "divide", "choices": [{"w": "divide", "ok": true}, {"w": "devide", "joke": "첫 모음이 i예요."}, {"w": "divid", "joke": "끝의 e가 빠졌어요."}]}, {"id": "sp12", "word": "afloat", "choices": [{"w": "afloat", "ok": true}, {"w": "afloot", "joke": "oa가 oo로 바뀌었어요."}, {"w": "aflote", "joke": "소리는 같아도 oa로 써요."}]}, {"id": "sp13", "word": "flood", "choices": [{"w": "flood", "ok": true}, {"w": "flud", "joke": "소리 나는 대로 썼어요. flood는 oo!"}, {"w": "fload", "joke": "load(짐)가 숨었어요 📦"}]}, {"id": "sp14", "word": "record", "choices": [{"w": "record", "ok": true}, {"w": "rekord", "joke": "c 자리에 k가 들어갔어요."}, {"w": "recorde", "joke": "끝에 e가 하나 더 붙었어요."}]}, {"id": "sp15", "word": "claim", "choices": [{"w": "claim", "ok": true}, {"w": "clam", "joke": "clam은 조개예요 🦪 i가 빠졌어요."}, {"w": "clame", "joke": "소리는 같아도 ai로 써요."}]}, {"id": "sp16", "word": "crew", "choices": [{"w": "crew", "ok": true}, {"w": "crue", "joke": "소리는 같아도 ew로 써요."}, {"w": "krew", "joke": "c 자리에 k가 들어갔어요."}]}];
  const WORD_HUNT_BLOCK = 3;
  const wordHuntActivity = 'sound-alike-words';
  const wordHuntMeasure = 'case.sound-alike-word';
  const mindMapCards = [
    { id: 'compartment', target: 'compartment', before: 'The ship had ', answer: 'sixteen', after: ' compartments designed to limit flooding.' },
    { id: 'new', target: 'new', before: 'The unsinkable claim was not supported by the ', answer: 'evidence', after: '.' },
    { id: 'old', target: 'old', before: 'People once believed the Titanic could never ', answer: 'sink', after: '.' },
    { id: 'lifeboat', target: 'lifeboat', before: 'The lifeboats had room for about ', answer: 'half', after: ' of the people.' }
  ];

  const defaultState = {
    screen: 'start', caseLine: 0, goalSolved: false, searchPhase: 'map', searchBriefSeen: false,
    found: [], discoveryOrder: [], activeClue: '', notes: {}, noteAttempts: {},
    selectedRecord: '', deductionAttempts: 0, readingLevel: 'easy', sentenceIndex: 0,
    mindMapPlacements: {}, mindMapAnswers: {}, selectedMindMapCard: '', mindMapSolved: false, mindMapAttempts: 0,
    retell: '', retellHint: false, unlockedWords: 1, openedWords: [], startedAt: 0,
    goalAttempts: 0, wordHunt: null, readingRereads: 0, readingSupport: false, readingSelfCheck: '', helpRequestedAt: 0, helpRequests: 0, spelling: null,
    vault: null
  };
  /* 기억 금고 작전 — 3번(단서→잠그기→잠수→금고 다이얼)과 4번(가짜 기록 보스)을 한 미션으로 묶는 게임 층.
     점수는 쌓이기만 한다(오답·다시 보기로 깎이지 않음). 다시 보기 없이 연 금고 = 기억 보석, 다시 보고 연 금고 = 탐정 보석. */
  const vaultDefault = () => ({ gems: {}, peeks: {}, flips: [], cleared: [], diveMs: {}, judged: {}, judgeAttempts: {}, slide: 0 });
  const DIVE_SECONDS = [3, 4, 5];
  const REDIVE_SECONDS = 2;
  const DIVE_DEPTH = ['10m', '20m', '30m'];
  let diveTimer = 0, diveEndsAt = 0, diveStartedAt = 0, diveTotal = 0, diveKind = '';
  const spellingDefault = () => ({ index: 0, attempts: {}, hinted: {}, narrowed: {}, revealed: {}, done: {}, order: {}, complete: false });
  const wordHuntDefault = () => ({ index: 0, phase: 'find', attempts: {}, fixAttempts: {}, hinted: {}, meaningShown: {}, revealed: {}, done: {}, rereads: {}, detectMs: {}, findAccuracy: {}, fixAccuracy: {}, listens: {}, slowListens: {}, complete: false, breakSeen: false });

  const byId = id => document.getElementById(id);
  const saved = readSavedState();
  const state = Object.assign({}, defaultState, saved || {});
  state.found = Array.isArray(saved?.found) ? saved.found : [];
  state.discoveryOrder = Array.isArray(saved?.discoveryOrder) ? saved.discoveryOrder : [];
  state.notes = saved?.notes && typeof saved.notes === 'object' ? saved.notes : {};
  state.noteAttempts = saved?.noteAttempts && typeof saved.noteAttempts === 'object' ? saved.noteAttempts : {};
  state.mindMapPlacements = saved?.mindMapPlacements && typeof saved.mindMapPlacements === 'object' ? saved.mindMapPlacements : {};
  state.mindMapAnswers = saved?.mindMapAnswers && typeof saved.mindMapAnswers === 'object' ? saved.mindMapAnswers : {};
  state.openedWords = Array.isArray(saved?.openedWords) ? saved.openedWords : [];
  state.wordHunt = Object.assign(wordHuntDefault(), saved?.wordHunt && typeof saved.wordHunt === 'object' ? saved.wordHunt : {});
  ['attempts', 'fixAttempts', 'hinted', 'meaningShown', 'revealed', 'done', 'rereads', 'detectMs', 'findAccuracy', 'fixAccuracy', 'listens', 'slowListens'].forEach(key => { if (!state.wordHunt[key] || typeof state.wordHunt[key] !== 'object') state.wordHunt[key] = {}; });
  state.spelling = Object.assign(spellingDefault(), saved?.spelling && typeof saved.spelling === 'object' ? saved.spelling : {});
  ['attempts', 'hinted', 'narrowed', 'revealed', 'done', 'order'].forEach(key => { if (!state.spelling[key] || typeof state.spelling[key] !== 'object') state.spelling[key] = {}; });
  state.vault = Object.assign(vaultDefault(), saved?.vault && typeof saved.vault === 'object' ? saved.vault : {});
  ['gems', 'peeks', 'diveMs', 'judged', 'judgeAttempts'].forEach(key => { if (!state.vault[key] || typeof state.vault[key] !== 'object') state.vault[key] = {}; });
  ['flips', 'cleared'].forEach(key => { if (!Array.isArray(state.vault[key])) state.vault[key] = []; });
  if (!saved?.mindMapAnswers) {
    state.mindMapPlacements = {};
    state.selectedMindMapCard = '';
  }
  if (mindMapCards.some(card => !String(state.mindMapAnswers[card.id] || '').trim())) state.mindMapSolved = false;
  const screens = Object.fromEntries(screenOrder.map(name => [name, byId(name + 'Screen')]));
  let goalKoreanVisible = false;
  const caseVocab = window.OncuvateCaseVocab?.create({
    words,
    storageKey,
    onOpen(word, info) {
      if (!state.openedWords.includes(word)) state.openedWords.push(word);
      signals.log('word-open', Object.assign({ activityId: screenActivity[state.screen] || state.screen, screenName: state.screen, word }, info || {}));
      updateWordBank(); saveState();
    },
    onClose(word, info) {
      signals.log('word-card', Object.assign({ activityId: screenActivity[state.screen] || state.screen, screenName: state.screen, word }, info));
    }
  });
  const focusGuide = window.OncuvateFocusGuide?.create({
    key: storageKey,
    replayButton: 'focusGuideReplay',
    guides: {
      case: [{ en: 'Read one incident record at a time.', ko: '사건 기록을 한 번에 한 문장씩 읽어요.' }],
      goal: [{ en: 'Choose the one question this case must solve.', ko: '이 사건에서 꼭 해결할 질문 하나를 골라요.' }],
      deduction: [
        { en: 'Remember your three gems first.', ko: '먼저 머릿속 보석 세 개를 떠올려요.' },
        { en: 'Read one record at a time. TRUE or FAKE?', ko: '기록을 한 장씩 읽고 TRUE인지 FAKE인지 판정해요.' }
      ],
      reading: [{ en: 'Read one sentence at a time. Watch how the evidence tests an old claim.', ko: '한 문장씩 읽으며 증거가 옛 주장을 어떻게 검증하는지 살펴봐요.' }],
      wordhunt: [
        { en: 'Listen to the sentence first.', ko: '먼저 문장을 들어요.' },
        { en: 'Tap the one word that is written differently.', ko: '들은 소리와 다르게 적힌 낱말 하나를 눌러요.' }
      ],
      spelling: [
        { en: 'Read the meaning, then look at every letter.', ko: '뜻을 읽고, 글자를 하나씩 봐요.' },
        { en: 'Only one word is spelled correctly.', ko: '바르게 쓴 낱말은 하나뿐이에요.' }
      ],
      mindmap: [
        { en: 'Fill in one missing word, then tap its place on the poster.', ko: '빈칸 낱말 하나를 쓰고, 포스터에서 그 카드의 자리를 눌러요.' },
        { en: 'Work with one card at a time.', ko: '한 번에는 카드 하나만 다뤄요.' }
      ],
      retell: [
        { en: 'Use the map to explain what people once believed about the ship.', ko: '마인드맵을 보며 사람들이 예전에 배를 어떻게 믿었는지 설명해요.' },
        { en: 'Then explain what the evidence showed.', ko: '그다음 증거가 무엇을 보여 주었는지 설명해요.' }
      ]
    }
  });

  function readSavedState() {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); }
    catch (_) { return null; }
  }
  function saveState() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)); }
    catch (_) { /* optional */ }
    liveMirror?.publishSoon(150);
  }
  function buildProgressSnapshot() {
    const wh = state.wordHunt || wordHuntDefault();
    const counts = monitoringCounts();
    const sentences = readingTexts[state.readingLevel];
    const parts = [];
    if (state.goalSolved) parts.push('목표 ✓'); else if (state.goalAttempts) parts.push(`목표 시도 ${state.goalAttempts}`);
    parts.push(`단서 ${state.found.length}/3`, `기록 ${Object.keys(state.notes).length}/3`);
    if (state.selectedRecord === 'old') parts.push('판별 ✓'); else if (state.deductionAttempts) parts.push(`판별 시도 ${state.deductionAttempts}`);
    if (state.sentenceIndex) parts.push(`정보글 ${Math.min(state.sentenceIndex, sentences.length)}/${sentences.length}${state.readingRereads ? ` · 다시 읽기 ${state.readingRereads}` : ''}${state.readingSelfCheck ? ` · ${({ understood: '이해했어요', reread: '다시 볼래요', unsure: '잘 모르겠어요' })[state.readingSelfCheck] || ''}` : ''}`);
    const whDone = wordHuntDoneCount();
    const spDone = state.spelling ? Object.keys(state.spelling.done).length : 0;
    if (spDone) parts.push(`진짜 낱말 ${spDone}/${spellingItems.length}`);
    if (whDone || Object.keys(wh.attempts).length) parts.push(`소리 닮은 말 ${whDone}/6 · 단서 없이 ${counts.spontaneousDetections} · 답 제시 ${Object.keys(wh.revealed).length}`);
    if (state.mindMapSolved) parts.push('인포그래픽 ✓'); else if (state.mindMapAttempts) parts.push(`인포그래픽 시도 ${state.mindMapAttempts}`);
    const vs = vaultStats();
    if (vs.memory + vs.detective) parts.push(`금고 ${gemIcons()}${vs.boss ? ' · 보스 ✓' : ''}`);
    return { screen: state.screen, screenLabel: screenLabels[state.screen] || state.screen, summary: parts.join(' · '), notes: orderedNotes().join(' | '), retell: state.retell.slice(0, 240), done: state.screen === 'solved', sessionNo: 1, stepNo: Math.max(0, screenOrder.indexOf(state.screen)), stepTotal: screenOrder.length - 1, helpRequestedAt: state.helpRequestedAt || 0, helpRequests: state.helpRequests || 0,
      vault: { memory: vs.memory, detective: vs.detective, boss: vs.boss, bare: vs.bare, combo: vs.bestCombo, peeks: vs.peeks, flips: vs.flips, diving: Boolean(diveTimer), stage: vaultStage() } };
  }
  function clueById(id) { return clues.find(clue => clue.id === id); }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }
  function setWatermark() {
    const childLabel = typeof runtime.child === 'string' ? runtime.child : runtime.child?.nickname || runtime.child?.name || runtime.child?.id;
    byId('childWatermark').textContent = childLabel ? `ONCUVATE · ${childLabel}` : 'ONCUVATE · DEMO';
  }

  function showScreen(name, options = {}) {
    if (!screens[name]) return;
    if (!isCoach && !options.ignorePageLock && window.OncuvateClassroomControl?.pageLocked && name !== state.screen) return;
    Object.entries(screens).forEach(([key, element]) => {
      const active = key === name;
      element.hidden = !active;
      element.classList.toggle('is-active', active);
    });
    state.screen = name;
    updateHeader();
    updateStrategyDock();
    if (name === 'case') renderCaseLine();
    if (name === 'search') {
      renderSearch();
      if (!state.searchBriefSeen) requestAnimationFrame(showSearchBrief);
    }
    if (name === 'goal') signals.ready('goal', 'goal', { textNode: byId('goalScreen'), attempts: state.goalAttempts, measureId: 'case.goal' });
    if (name === 'deduction') renderDeduction();
    if (name === 'reading') renderReading();
    if (name === 'wordhunt') renderWordHunt();
    if (name === 'spelling') renderSpelling();
    if (name === 'mindmap') renderMindMap();
    if (name === 'retell') renderRetell();
    updateCoachPanel();
    if (!options.skipSave) saveState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    signals.enterScreen(name, screens[name]);
    focusGuide?.visit(name);
  }
  function updateHeader() {
    byId('progressLabel').textContent = screenLabels[state.screen];
    const activeIndex = screenOrder.indexOf(state.screen);
    byId('progressDots').innerHTML = screenOrder.map((_, index) => `<i class="${index < activeIndex ? 'done' : index === activeIndex ? 'active' : ''}"></i>`).join('');
    updateLessonMenu();
  }
  function isScreenUnlocked(name) {
    return true;
  }
  function updateLessonMenu() {
    byId('lessonMenu').hidden = false;
    document.querySelectorAll('[data-menu-screen]').forEach(button => {
      const target = button.dataset.menuScreen;
      const unlocked = isScreenUnlocked(target);
      const active = state.screen === target;
      button.disabled = !unlocked;
      button.classList.toggle('active', active);
      button.classList.toggle('done', unlocked && !active);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function handleMenuNavigation(event) {
    const button = event.target.closest('[data-menu-screen]');
    if (!button || button.disabled) return;
    showScreen(button.dataset.menuScreen);
  }
  function updateStrategyDock() {
    byId('currentGoal').textContent = screenGoals[state.screen];
    let active = '';
    if (state.screen === 'search') active = state.searchPhase === 'sheet' ? 'note' : 'find';
    if (state.screen === 'deduction' || ['reading', 'wordhunt', 'spelling', 'mindmap', 'retell', 'solved'].includes(state.screen)) active = 'match';
    document.querySelectorAll('[data-strategy-step]').forEach(item => {
      const key = item.dataset.strategyStep;
      item.classList.toggle('active', key === active);
      item.classList.toggle('done', (key === 'find' && state.found.length === 3) || (key === 'note' && Object.keys(state.notes).length === 3) || (key === 'match' && ['reading', 'wordhunt', 'spelling', 'mindmap', 'retell', 'solved'].includes(state.screen)));
    });
  }

  function renderCaseLine() {
    const line = caseLines[Math.min(state.caseLine, caseLines.length - 1)];
    byId('casePulseLabel').textContent = line.label;
    if (caseVocab) caseVocab.render(byId('casePulseText'), line.text);
    else byId('casePulseText').textContent = line.text;
    byId('caseNextButton').textContent = line.next;
  }
  function handleCaseNext() {
    if (state.caseLine < caseLines.length - 1) { state.caseLine += 1; renderCaseLine(); updateHeader(); saveState(); return; }
    showScreen('goal');
  }
  function handleHome() {
    if (byId('clueDialog').open) byId('clueDialog').close();
    showScreen('start');
  }
  function applyGoalLanguage(showKorean) {
    goalKoreanVisible = Boolean(showKorean);
    document.querySelectorAll('#goalScreen [data-en][data-ko]').forEach(element => {
      element.textContent = goalKoreanVisible ? element.dataset.ko : element.dataset.en;
    });
    const button = byId('goalTranslateButton');
    button.setAttribute('aria-pressed', String(goalKoreanVisible));
    button.querySelector('b').textContent = goalKoreanVisible ? '손을 떼면 영어로' : 'Hold for Korean';
  }
  function setGoalFeedback(en, ko, className) {
    const feedback = byId('goalFeedback');
    feedback.dataset.en = en;
    feedback.dataset.ko = ko;
    feedback.className = className;
    applyGoalLanguage(goalKoreanVisible);
  }
  let goalHoldLogged = false;
  function showGoalKorean(event) {
    event.preventDefault();
    if (!goalHoldLogged) { goalHoldLogged = true; signals.hint('goal', 'goal', { helpLevel: 'A1', helpType: 'korean-hold' }); }
    if (event.pointerId !== undefined && event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId);
    applyGoalLanguage(true);
  }
  function hideGoalKorean(event) {
    if (event) event.preventDefault();
    goalHoldLogged = false;
    applyGoalLanguage(false);
  }
  function decorateGoal() { signals.decorate(document.querySelectorAll('[data-goal]'), 'goal', 'goal', button => button.dataset.goal === 'conflict'); }
  function handleGoalTranslationKeyDown(event) {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) showGoalKorean(event);
  }
  function handleGoalTranslationKeyUp(event) {
    if (event.key === ' ' || event.key === 'Enter') hideGoalKorean(event);
  }

  function handleGoal(event) {
    const button = event.target.closest('[data-goal]');
    if (!button) return;
    if (state.goalSolved) return;
    state.goalAttempts += 1;
    signals.respond('goal', 'goal', { correct: button.dataset.goal === 'conflict', value: button.dataset.goal, expected: 'conflict', visibleTextLen: signals.textLength(byId('goalScreen')), measureId: 'case.goal' });
    setTimeout(decorateGoal, 0);
    document.querySelectorAll('[data-goal]').forEach(choice => choice.classList.remove('selected', 'correct', 'incorrect'));
    button.classList.add('selected');
    if (button.dataset.goal !== 'conflict') {
      button.classList.add('incorrect');
      setGoalFeedback('Re-read the unresolved question in the case file.', '사건파일의 미해결 질문을 다시 읽어보세요.', 'feedback-line attention');
      saveState();
      return;
    }
    state.goalSolved = true;
    button.classList.add('correct');
    setGoalFeedback('Good. Find one record that does not match the evidence.', '좋아요. 증거와 맞지 않는 기록 하나를 찾습니다.', 'feedback-line success');
    byId('goalContinueButton').disabled = false;
    saveState();
  }

  function showSearchBrief() {
    const dialog = byId('searchBriefDialog');
    if (!state.searchBriefSeen && !dialog.open) dialog.showModal();
  }
  function startSearch() {
    state.searchBriefSeen = true;
    if (byId('searchBriefDialog').open) byId('searchBriefDialog').close();
    saveState();
  }

  /* ---------- 기억 금고 작전: 공용 계산 ---------- */
  function vaultStats() {
    const v = state.vault || vaultDefault();
    let memory = 0, detective = 0, combo = 0, bestCombo = 0;
    state.discoveryOrder.forEach(id => {
      const gem = v.gems[id];
      if (gem === 'memory') { memory += 1; combo += 1; bestCombo = Math.max(bestCombo, combo); }
      else if (gem === 'detective') { detective += 1; combo = 0; }
    });
    const peeks = Object.values(v.peeks).reduce((sum, n) => sum + (Number(n) || 0), 0);
    const boss = state.selectedRecord === 'old' && Object.keys(v.judged || {}).length >= 3;
    return { memory, detective, combo, bestCombo, peeks, flips: v.flips.length, boss, bare: boss && v.flips.length === 0 };
  }
  function gemIcons() {
    return state.discoveryOrder.map(id => state.vault.gems[id] === 'memory' ? '💎' : state.vault.gems[id] === 'detective' ? '🔎' : '').join('');
  }
  function vaultStage() {
    if (state.selectedRecord === 'old' && Object.keys(state.vault.judged || {}).length >= 3) return 'boss-cleared';
    if (Object.keys(state.notes).length === 3) return 'boss';
    if (diveTimer) return 'diving';
    if (state.searchPhase === 'sheet' && state.activeClue) return 'vault';
    return 'search';
  }
  function renderVaultHud() {
    const vs = vaultStats();
    const noted = Object.keys(state.notes).length;
    const steps = [0, 1, 2].map(index => {
      const id = state.discoveryOrder[index];
      const gem = id ? state.vault.gems[id] : '';
      const current = !gem && (index === noted);
      const icon = gem === 'memory' ? '💎' : gem === 'detective' ? '🔎' : '🔒';
      return `<li class="${gem ? 'done' : current ? 'current' : ''}"><span aria-hidden="true">${icon}</span>금고 ${index + 1}</li>`;
    }).join('');
    const bossClass = vs.boss ? 'done' : noted === 3 ? 'current' : '';
    const combo = vs.combo >= 2 && !vs.boss ? `<span class="hud-combo">🔥 연속 기억 ×${vs.combo}</span>` : '';
    const html = `<span class="hud-title"><b>MISSION</b>기억 금고 작전</span><ol class="hud-steps">${steps}<li class="boss ${bossClass}"><span aria-hidden="true">${vs.boss ? '🏴‍☠️' : '👾'}</span>가짜 기록</li></ol>${combo}<span class="hud-gems" aria-label="모은 보석">💎 ${vs.memory} <i>·</i> 🔎 ${vs.detective}</span>`;
    document.querySelectorAll('[data-vault-hud]').forEach(el => { el.innerHTML = html; });
  }

  /* ---------- 3. 단서 수색 → 잠그기 → 잠수 → 금고 ---------- */
  function renderSearch() {
    const sheetMode = state.searchPhase === 'sheet' && state.activeClue;
    byId('searchMapPhase').hidden = sheetMode;
    byId('clueSheetPhase').hidden = !sheetMode;
    byId('searchCounter').textContent = `${state.found.length} / 3 단서`;
    document.querySelectorAll('[data-clue-id]').forEach(button => {
      const found = state.found.includes(button.dataset.clueId);
      button.classList.toggle('found', found);
      button.setAttribute('aria-label', found ? '찾은 단서 다시 보기' : button.getAttribute('aria-label'));
    });
    byId('mapStatus').textContent = state.found.length === 0
      ? '그림 속에 보호색 단서 세 개가 숨어 있어요. 찾으면 금고가 하나씩 열려요.'
      : state.found.length === 3 ? '단서 세 개를 모두 찾았어요.' : `찾았다! 아직 금고 ${3 - state.found.length}개가 기다려요.`;
    if (sheetMode) renderMemorySheet();
    renderVaultHud();
    updateStrategyDock();
    updateCoachPanel();
  }
  function handleClueClick(event) {
    const button = event.target.closest('[data-clue-id]');
    if (!button) return;
    const id = button.dataset.clueId;
    if (state.found.includes(id)) { openClueDialog(id, true); return; }
    state.found.push(id);
    state.discoveryOrder.push(id);
    state.activeClue = id;
    signals.log('clue-found', { activityId: 'clue-search', itemId: 'clue-' + id, orderNo: state.discoveryOrder.length, foundCount: state.found.length });
    state.unlockedWords = Math.max(state.unlockedWords, clueById(id).wordUnlock);
    saveState();
    renderSearch();
    updateWordBank();
    openClueDialog(id, false);
  }
  let clueShownAt = 0;
  function openClueDialog(id, review) {
    const clue = clueById(id);
    if (!clue) return;
    const discoveryNumber = state.discoveryOrder.indexOf(id) + 1;
    const dialog = byId('clueDialog');
    dialog.dataset.clueId = id;
    dialog.dataset.review = String(review);
    dialog.classList.toggle('is-review', review);
    byId('clueDialogKicker').textContent = review ? 'PEEK · 살짝 다시 보기' : `VAULT ${discoveryNumber} OF 3 · 잠수 깊이 ${DIVE_DEPTH[discoveryNumber - 1] || '30m'}`;
    byId('clueDialogTitle').textContent = clue.title;
    if (caseVocab) caseVocab.render(byId('clueDialogText'), clue.sentence); else byId('clueDialogText').textContent = clue.sentence;
    byId('clueDialogSymbol').className = `clue-symbol ${clue.symbol}`;
    byId('clueDialogTip').textContent = review
      ? '다시 꼭 붙들어요. 닫으면 금고까지 한 번 더 짧게 잠수해요.'
      : '숫자 하나, 핵심 낱말 하나를 속으로 두 번 말해요. 다 외웠으면 금고를 잠가요.';
    const pendingSheet = state.searchPhase === 'sheet' && state.activeClue && !state.notes[state.activeClue];
    byId('clueDialogAction').textContent = review ? (pendingSheet ? '🔒 다시 잠그고 잠수하기' : state.searchPhase === 'sheet' ? '금고로 돌아가기' : '탐색으로 돌아가기') : '🔒 기억 잠그기';
    clueShownAt = performance.now();
    dialog.showModal();
  }
  function closeClueDialog() {
    const dialog = byId('clueDialog');
    const review = dialog.dataset.review === 'true';
    const readMs = Math.round(performance.now() - clueShownAt);
    dialog.close();
    if (review) {
      if (state.searchPhase === 'sheet' && state.activeClue && !state.notes[state.activeClue]) startDive('redive', REDIVE_SECONDS);
      return;
    }
    signals.log('memory-lock', { activityId: 'clue-notes', itemId: 'note-' + dialog.dataset.clueId, readMs });
    state.searchPhase = 'sheet';
    const index = Math.max(0, state.discoveryOrder.indexOf(state.activeClue));
    startDive('dive', DIVE_SECONDS[index] || 3);
    saveState();
  }
  function startDive(kind, seconds) {
    clearInterval(diveTimer);
    diveKind = kind;
    diveTotal = seconds;
    diveStartedAt = Date.now();
    diveEndsAt = diveStartedAt + seconds * 1000;
    diveTimer = setInterval(tickDive, 200);
    renderSearch();
    liveMirror?.publishSoon(100);
  }
  function tickDive() {
    const left = Math.max(0, Math.ceil((diveEndsAt - Date.now()) / 1000));
    const count = byId('diveCount');
    if (count) count.textContent = String(left);
    const gauge = byId('diveGauge');
    if (gauge) gauge.style.height = `${Math.min(100, ((Date.now() - diveStartedAt) / (diveTotal * 1000)) * 100)}%`;
    if (Date.now() < diveEndsAt) return;
    clearInterval(diveTimer);
    diveTimer = 0;
    const id = state.activeClue;
    state.vault.diveMs[id] = (state.vault.diveMs[id] || 0) + diveTotal * 1000;
    signals.log('memory-hold', { activityId: 'clue-notes', itemId: 'note-' + id, holdMs: diveTotal * 1000, kind: diveKind });
    saveState();
    renderSearch();
    byId('memoryRows').querySelector('.memory-row.active')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function diveMarkup(active) {
    const index = Math.max(0, state.discoveryOrder.indexOf(active.id));
    const depth = diveKind === 'redive' ? '다시 잠수' : `깊이 ${DIVE_DEPTH[index] || '30m'}`;
    const bubbles = Array.from({ length: 6 }, (_, i) => `<button type="button" class="dive-bubble b${i + 1}" data-bubble aria-label="방울 터뜨리기" tabindex="-1"></button>`).join('');
    return `<article class="memory-row active dive-row" aria-live="polite">
      <div class="dive-panel">
        <div class="dive-sonar" aria-hidden="true"><i class="dive-gauge" id="diveGauge"></i><b id="diveCount">${diveTotal}</b></div>
        <div class="dive-copy"><small>DIVE · ${depth}</small><h3>기억을 꼭 붙들고 금고까지 내려가요</h3><p>잠그기 전에 본 문장을 속으로 되뇌어요. 🫧 방울은 톡톡 터뜨려도 괜찮아요.</p></div>
      </div>
      <div class="dive-sea" aria-hidden="true">${bubbles}</div>
    </article>`;
  }
  function renderMemorySheet() {
    const active = clueById(state.activeClue);
    if (!active) return;
    byId('sheetCounter').textContent = `${Object.keys(state.notes).length} / 3 금고`;
    byId('memoryProgress').innerHTML = state.discoveryOrder.concat(clues.map(c => c.id).filter(id => !state.discoveryOrder.includes(id))).map((id, index) => {
      const found = state.found.includes(id);
      const noted = Boolean(state.notes[id]);
      const current = id === state.activeClue;
      const gem = state.vault.gems[id];
      return `<div class="${noted ? 'done' : current ? 'current' : found ? 'found' : ''}"><i>${noted ? (gem === 'memory' ? '💎' : '🔎') : index + 1}</i><span>${noted ? (gem === 'memory' ? '기억 보석' : '탐정 보석') : current ? (diveTimer ? '잠수 중' : '다이얼 맞추는 중') : found ? '발견' : '잠긴 금고'}</span></div>`;
    }).join('');

    const completed = state.discoveryOrder.filter(id => state.notes[id] && id !== state.activeClue).map(id => {
      const gem = state.vault.gems[id];
      return `<article class="memory-row complete"><div><small>${gem === 'memory' ? '💎 MEMORY GEM' : '🔎 DETECTIVE GEM'}</small><strong>${escapeHtml(state.notes[id])}</strong></div><button type="button" data-review-clue="${id}" data-track="hint">살짝 다시 보기</button></article>`;
    }).join('');
    const diving = Boolean(diveTimer);
    const solved = Boolean(state.notes[active.id]);
    byId('reviewActiveClueButton').hidden = diving || solved;
    if (diving) {
      byId('memoryRows').innerHTML = completed + diveMarkup(active);
      byId('sheetFeedback').textContent = '잠수하는 동안 문장은 보이지 않아요. 머릿속에서 꼭 붙들어요.';
      byId('sheetFeedback').className = 'sheet-feedback';
      byId('sheetNextButton').hidden = true;
      return;
    }
    const choices = active.options.filter(option => !state.notes[active.id] || option === state.notes[active.id]).map(option => {
      const selected = state.notes[active.id] === option;
      return `<button type="button" data-memory-note="${escapeHtml(option)}" data-item-id="note-${active.id}" data-correct="${option === active.correct}" data-track="answer" class="${selected ? 'selected correct' : ''}"><i aria-hidden="true"></i><span>${escapeHtml(option)}</span></button>`;
    }).join('');
    const gem = state.vault.gems[active.id];
    const vs = vaultStats();
    const reward = solved
      ? `<div class="vault-reward ${gem}" role="status"><span class="reward-gem" aria-hidden="true">${gem === 'memory' ? '💎' : '🔎'}</span><div><strong>${gem === 'memory' ? '기억 보석 획득!' : '탐정 보석 획득!'}</strong><small>${gem === 'memory' ? '다시 보지 않고 기억만으로 금고를 열었어요.' : '다시 보고 확인해서 정확하게 열었어요. 이것도 탐정의 방법이에요.'}${gem === 'memory' && vs.combo >= 2 ? ` 🔥 연속 기억 ×${vs.combo}` : ''}</small></div></div>`
      : '';
    const attempts = state.noteAttempts[active.id] || 0;
    byId('memoryRows').innerHTML = `${completed}<article class="memory-row active vault-row${solved ? ' is-open' : ''}${attempts && !solved ? ' is-retry' : ''}"><div class="memory-question"><small>🔐 VAULT ${state.discoveryOrder.indexOf(active.id) + 1} · 다이얼 맞추기</small><h3>${escapeHtml(active.reviewPrompt)}</h3><p>${solved ? '금고가 열렸어요!' : '기억해 둔 핵심 정보가 금고의 비밀번호예요. 하나를 골라요.'}</p></div>${reward}<div class="memory-options">${choices}</div></article>`;
    signals.decorate(byId('memoryRows').querySelectorAll('[data-memory-note]'), 'clue-notes', 'note-' + active.id, button => button.dataset.memoryNote === active.correct);
    if (!solved) signals.ready('clue-notes', 'note-' + active.id, { textNode: byId('memoryRows'), attempts, measureId: 'case.clue-note' });
    const nextButton = byId('sheetNextButton');
    if (Object.keys(state.notes).length === 3) { nextButton.dataset.track = 'activity-complete'; nextButton.dataset.activityId = 'clue-notes'; }
    else { delete nextButton.dataset.track; delete nextButton.dataset.activityId; }
    byId('sheetFeedback').textContent = solved ? (Object.keys(state.notes).length === 3 ? '금고 세 개가 모두 열렸어요. 이제 가짜 기록을 잡으러 가요!' : '보석을 챙겼어요. 다음 금고를 찾으러 가요.') : attempts >= 2 ? '다이얼이 잘 안 맞으면 「살짝 다시 보기」를 써도 괜찮아요. 보고 나서 한 번 더 잠수해요.' : '잠그기 전에 본 문장을 떠올리며 하나를 골라요.';
    byId('sheetFeedback').className = `sheet-feedback${solved ? ' success' : ''}`;
    byId('reviewActiveClueButton').classList.toggle('is-suggested', attempts >= 2 && !solved);
    nextButton.hidden = !solved;
    nextButton.textContent = Object.keys(state.notes).length === 3 ? '👾 가짜 기록 잡으러 가기' : '다음 금고 찾기';
  }
  function peekClue(id, source) {
    const activeId = state.activeClue;
    if (activeId && !state.notes[activeId]) state.vault.peeks[activeId] = (state.vault.peeks[activeId] || 0) + 1;
    signals.hint('clue-notes', 'note-' + activeId, { helpLevel: 'A3', helpType: 'clue-review', reviewedClue: id, trigger: source });
    signals.decorateLater(byId('memoryRows').querySelectorAll('[data-memory-note]'), 'clue-notes', 'note-' + activeId, b => b.dataset.memoryNote === clueById(activeId).correct);
    saveState();
    openClueDialog(id, true);
  }
  function handleMemorySheet(event) {
    if (event.target.closest('[data-bubble]')) {
      const bubble = event.target.closest('[data-bubble]');
      bubble.classList.remove('popped'); void bubble.offsetWidth; bubble.classList.add('popped');
      return;
    }
    if (diveTimer) return;
    const review = event.target.closest('[data-review-clue]');
    if (review) { peekClue(review.dataset.reviewClue, 'other-clue'); return; }
    const button = event.target.closest('[data-memory-note]');
    if (!button || !state.activeClue) return;
    const clue = clueById(state.activeClue);
    if (state.notes[clue.id]) return;
    state.noteAttempts[clue.id] = (state.noteAttempts[clue.id] || 0) + 1;
    signals.respond('clue-notes', 'note-' + clue.id, { correct: button.dataset.memoryNote === clue.correct, value: button.dataset.memoryNote, expected: clue.correct, measureId: 'case.clue-note' });
    signals.decorateLater(byId('memoryRows').querySelectorAll('[data-memory-note]'), 'clue-notes', 'note-' + clue.id, b => b.dataset.memoryNote === clue.correct);
    document.querySelectorAll('[data-memory-note]').forEach(choice => choice.classList.remove('selected', 'correct', 'incorrect'));
    button.classList.add('selected');
    if (button.dataset.memoryNote !== clue.correct) {
      button.classList.add('incorrect');
      const row = button.closest('.vault-row');
      if (row) { row.classList.remove('dial-miss'); void row.offsetWidth; row.classList.add('dial-miss'); }
      byId('sheetFeedback').textContent = state.noteAttempts[clue.id] >= 2
        ? '딸깍, 아직 안 맞아요. 「살짝 다시 보기」로 문장을 확인해도 보석은 그대로 받아요.'
        : '딸깍, 다이얼이 아직 안 맞아요. 숫자나 핵심 낱말을 다시 떠올려 봐요.';
      byId('sheetFeedback').className = 'sheet-feedback attention';
      byId('reviewActiveClueButton').classList.toggle('is-suggested', state.noteAttempts[clue.id] >= 2);
      saveState();
      return;
    }
    state.notes[clue.id] = clue.correct;
    state.vault.gems[clue.id] = state.vault.peeks[clue.id] ? 'detective' : 'memory';
    signals.log('vault-open', { activityId: 'clue-notes', itemId: 'note-' + clue.id, gem: state.vault.gems[clue.id], attempts: state.noteAttempts[clue.id], peeks: state.vault.peeks[clue.id] || 0 });
    renderSearch();
    saveState();
    setTimeout(() => byId('sheetNextButton').scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 600);
  }
  function nextSearchStep() {
    if (!state.notes[state.activeClue]) return;
    if (Object.keys(state.notes).length === 3) { signals.activityComplete('clue-notes'); state.searchPhase = 'map'; state.activeClue = ''; showScreen('deduction'); return; }
    state.searchPhase = 'map';
    state.activeClue = '';
    renderSearch();
    saveState();
  }

  /* ---------- 4. 보스: 가짜 기록 잡기 ---------- */
  function orderedNotes() { return clues.map(clue => state.notes[clue.id]).filter(Boolean); }
  /* 4번 보스: 기록을 한 장씩 넘기며 TRUE / FAKE 판정. 한 화면엔 기록 한 문장만 둔다.
     보석 아이콘(💎/🔎)을 누르면 그 단서 문장 하나가 잠깐 보인다(도움 A1, 뒤집기로 기록). */
  const archiveRecords = [
    { id: 'compartment', text: 'The Titanic had 16 compartments designed to limit flooding.', fake: false, ok: 'TRUE ✓ 보석과 맞아요. 구획은 16개였어요.' },
    { id: 'old', text: 'The Titanic cannot sink, so nobody on board will ever need a lifeboat.', fake: true, ok: 'FAKE! 구명보트는 절반만 탈 수 있었어요. 가짜 기록을 잡았어요!' },
    { id: 'sailing', text: 'The Titanic sailed from Southampton on April 10, 1912.', fake: false, ok: 'TRUE ✓ 보석과 맞아요. 4월 10일에 출항했어요.' }
  ];
  let gemPeekTimer = 0;
  function bossIndex() {
    const i = archiveRecords.findIndex(r => !state.vault.judged[r.id]);
    return i < 0 ? archiveRecords.length : i;
  }
  function renderDeduction() {
    if (state.selectedRecord === 'old' && !archiveRecords.every(r => state.vault.judged[r.id])) state.selectedRecord = '';  /* 이전 판(기록 고르기)에서 남은 완료 표시 정리 */
    const solved = state.selectedRecord === 'old';
    const index = Math.min(state.vault.slide || 0, archiveRecords.length - 1);
    const record = archiveRecords[index];
    const judged = state.vault.judged[record.id];
    document.querySelector('#deductionScreen .boss-card').classList.toggle('is-cleared', solved);
    byId('gemPeekRow').innerHTML = `<small>MY GEMS</small>` + clues.filter(clue => state.notes[clue.id]).map((clue, i) => {
      const gem = state.vault.gems[clue.id] === 'memory' ? '💎' : '🔎';
      return `<button type="button" data-gem-peek="${clue.id}" data-track="hint" data-help-level="A1" data-help-type="evidence-flip" aria-label="보석 ${i + 1}의 단서 잠깐 보기">${gem}<i>${i + 1}</i></button>`;
    }).join('');
    byId('recordDots').innerHTML = archiveRecords.map((r, i) => `<i class="${state.vault.judged[r.id] ? (r.fake ? 'fake' : 'true') : ''}${i === index ? ' now' : ''}"></i>`).join('');
    byId('recordCounter').textContent = `SHIPYARD ARCHIVE · No. ${index + 1} / ${archiveRecords.length}`;
    byId('recordText').textContent = record.text;
    const slide = byId('recordSlide');
    slide.classList.toggle('is-true', judged === 'true');
    slide.classList.toggle('is-fake', judged === 'fake');
    document.querySelectorAll('[data-judge]').forEach(button => {
      button.dataset.itemId = 'record-' + record.id;
      button.dataset.correct = String((button.dataset.judge === 'fake') === record.fake);
      button.disabled = Boolean(judged);
      button.classList.remove('incorrect');
    });
    byId('judgeRow').hidden = Boolean(judged);
    const last = index >= archiveRecords.length - 1;
    byId('recordNextButton').hidden = !judged || last;
    byId('deductionContinueButton').hidden = !solved;
    byId('deductionContinueButton').disabled = !solved;
    if (judged) { byId('deductionFeedback').textContent = record.ok; byId('deductionFeedback').className = 'feedback-line success'; }
    else if (!byId('deductionFeedback').classList.contains('attention')) { byId('deductionFeedback').textContent = 'Is this record TRUE or FAKE? 보석과 맞으면 TRUE, 맞지 않으면 FAKE.'; byId('deductionFeedback').className = 'feedback-line'; }
    renderBossSummary();
    renderVaultHud();
    signals.decorate(document.querySelectorAll('[data-judge]'), 'deduction', 'record-' + record.id, button => (button.dataset.judge === 'fake') === record.fake);
    if (!judged) signals.ready('deduction', 'record-' + record.id, { textNode: byId('recordSlide'), attempts: (state.vault.judgeAttempts || {})[record.id] || 0, measureId: 'case.deduction' });
  }
  function renderBossSummary() {
    const box = byId('bossSummary');
    if (!box) return;
    const vs = vaultStats();
    box.hidden = !vs.boss;
    if (!vs.boss) return;
    const badges = [
      `<li><b>🔐</b>3/3</li>`,
      `<li><b>${gemIcons()}</b></li>`,
      vs.bestCombo >= 2 ? `<li><b>🔥</b>×${vs.bestCombo}</li>` : '',
      vs.bare ? `<li class="gold"><b>🏆</b>맨기억 보너스</li>` : ''
    ].join('');
    box.innerHTML = `<strong>MISSION CLEAR!</strong><ul>${badges}</ul>`;
  }
  function handleGemPeek(event) {
    const button = event.target.closest('[data-gem-peek]');
    if (!button) return;
    const id = button.dataset.gemPeek;
    const record = archiveRecords[Math.min(state.vault.slide || 0, archiveRecords.length - 1)];
    if (state.selectedRecord !== 'old') {
      if (!state.vault.flips.includes(id)) state.vault.flips.push(id);
      signals.hint('deduction', 'record-' + record.id, { helpLevel: 'A1', helpType: 'evidence-flip', reviewedClue: id });
      signals.decorateLater(document.querySelectorAll('[data-judge]'), 'deduction', 'record-' + record.id, b => (b.dataset.judge === 'fake') === record.fake);
      saveState();
    }
    const bubble = byId('gemPeekBubble');
    bubble.textContent = state.notes[id] || '';
    bubble.hidden = false;
    document.querySelectorAll('[data-gem-peek]').forEach(b => b.classList.toggle('on', b === button));
    clearTimeout(gemPeekTimer);
    gemPeekTimer = setTimeout(() => { bubble.hidden = true; document.querySelectorAll('[data-gem-peek]').forEach(b => b.classList.remove('on')); }, 3500);
    renderVaultHud();
  }
  function handleJudge(event) {
    const button = event.target.closest('[data-judge]');
    if (!button || button.disabled) return;
    const index = Math.min(state.vault.slide || 0, archiveRecords.length - 1);
    const record = archiveRecords[index];
    if (state.vault.judged[record.id]) return;
    const pickFake = button.dataset.judge === 'fake';
    const correct = pickFake === record.fake;
    state.vault.judgeAttempts = state.vault.judgeAttempts || {};
    state.vault.judgeAttempts[record.id] = (state.vault.judgeAttempts[record.id] || 0) + 1;
    state.deductionAttempts += 1;
    signals.respond('deduction', 'record-' + record.id, { correct, value: button.dataset.judge, expected: record.fake ? 'fake' : 'true', visibleTextLen: signals.textLength(byId('recordSlide')), measureId: 'case.deduction' });
    signals.decorateLater(document.querySelectorAll('[data-judge]'), 'deduction', 'record-' + record.id, b => (b.dataset.judge === 'fake') === record.fake);
    if (!correct) {
      button.classList.add('incorrect');
      const slide = byId('recordSlide');
      slide.classList.remove('dial-miss'); void slide.offsetWidth; slide.classList.add('dial-miss');
      byId('deductionFeedback').textContent = state.vault.judgeAttempts[record.id] >= 2
        ? '보석 아이콘을 눌러 단서를 잠깐 확인해 봐요.'
        : '음, 보석과 한 번 더 맞춰 봐요.';
      byId('deductionFeedback').className = 'feedback-line attention';
      byId('gemPeekRow').classList.toggle('is-suggested', state.vault.judgeAttempts[record.id] >= 2);
      saveState();
      return;
    }
    state.vault.judged[record.id] = record.fake ? 'fake' : 'true';
    byId('gemPeekRow').classList.remove('is-suggested');
    if (archiveRecords.every(r => state.vault.judged[r.id])) {
      state.selectedRecord = 'old';
      signals.log('boss-cleared', { activityId: 'deduction', flips: state.vault.flips.length, attempts: state.deductionAttempts });
    }
    renderDeduction();
    saveState();
  }
  function nextRecord() {
    const index = state.vault.slide || 0;
    if (!state.vault.judged[archiveRecords[index].id] || index >= archiveRecords.length - 1) return;
    state.vault.slide = index + 1;
    byId('deductionFeedback').className = 'feedback-line';
    renderDeduction();
    const slide = byId('recordSlide');
    slide.classList.remove('slide-in'); void slide.offsetWidth; slide.classList.add('slide-in');
    saveState();
  }
  function deductionKeys(event) {
    if (state.screen !== 'deduction' || document.querySelector('dialog[open]')) return;
    if (event.target.closest && event.target.closest('input, textarea, select')) return;
    const key = event.key.toLowerCase();
    if (key === 't' || key === '1') { byId('judgeRow').querySelector('[data-judge="true"]')?.click(); event.preventDefault(); }
    else if (key === 'f' || key === '2') { byId('judgeRow').querySelector('[data-judge="fake"]')?.click(); event.preventDefault(); }
    else if ((key === 'arrowright' || key === 'enter') && !byId('recordNextButton').hidden) { nextRecord(); event.preventDefault(); }
  }

  let sentenceShownAt = 0;
  function renderReading() {
    const sentences = readingTexts[state.readingLevel];
    const index = Math.min(state.sentenceIndex, sentences.length - 1);
    sentenceShownAt = performance.now();
    byId('readingLevelButton').textContent = state.readingLevel === 'easy' ? 'TRY CHALLENGE' : 'BACK TO STANDARD';
    byId('sentenceCounter').textContent = `SENTENCE ${index + 1} OF ${sentences.length}`;
    if (caseVocab) caseVocab.render(byId('sentenceText'), sentences[index]);
    else byId('sentenceText').textContent = sentences[index];
    const finished = state.sentenceIndex >= sentences.length;
    document.querySelectorAll('[data-self-check]').forEach(button => button.classList.toggle('chosen', finished && button.dataset.selfCheck === state.readingSelfCheck));
    if (finished && state.readingSelfCheck !== 'understood') {
      byId('readingSelfCheckFeedback').textContent = state.readingRereads ? '다시 읽었어요. 지금은 어떤가요?' : '읽은 느낌을 하나 골라요. 어느 것을 골라도 괜찮아요.';
      byId('readingSelfCheckFeedback').className = 'feedback-line';
    }
    byId('sentenceReader').hidden = finished;
    byId('sentenceNextButton').hidden = finished;
    byId('sentenceNextButton').textContent = index === sentences.length - 1 ? '문단 전체 보기' : '다음 문장';
    byId('fullParagraph').hidden = !finished;
    if (caseVocab) caseVocab.render(byId('paragraphText'), sentences.join(' ')); else byId('paragraphText').textContent = sentences.join(' ');
  }
  function nextSentence() {
    const sentences = readingTexts[state.readingLevel];
    if (state.sentenceIndex < sentences.length) {
      const shown = state.sentenceIndex < sentences.length ? sentences[state.sentenceIndex] : sentences.join(' ');
      const textLen = shown.replace(/\s+/g, '').length;
      const dwellMs = Math.round(performance.now() - sentenceShownAt);
      signals.log('reading-sentence', { activityId: 'information-reading', itemId: `${state.readingLevel}-s${state.sentenceIndex + 1}`, level: state.readingLevel, sentenceNo: state.sentenceIndex + 1, textLen, dwellMs, msPerChar: textLen ? Math.round(dwellMs / textLen) : undefined, tooFast: dwellMs < 300 + 120 * textLen });
      state.sentenceIndex += 1;
    }
    renderReading(); saveState();
  }
  function handleReadingSelfCheck(event) {
    const button = event.target.closest('[data-self-check]');
    if (!button) return;
    const choice = button.dataset.selfCheck;
    const itemId = 'paragraph-' + state.readingLevel;
    state.readingSelfCheck = choice;
    signals.log('self-check', { activityId: 'information-reading', itemId, choice, cueStage: 1, rereadCount: state.readingRereads, level: state.readingLevel, discourseType: 'expository' });
    document.querySelectorAll('[data-self-check]').forEach(other => other.classList.toggle('chosen', other === button));
    if (choice === 'understood') {
      byId('readingSelfCheckFeedback').textContent = '좋아요. 읽은 내용을 다음 활동에서 써요.';
      byId('readingSelfCheckFeedback').className = 'feedback-line success';
      saveState(); return;
    }
    state.readingRereads += 1;
    state.readingSupport = choice === 'unsure';
    signals.hint('information-reading', itemId, { helpLevel: 'A1', helpType: choice === 'unsure' ? 'self-check-unsure' : 'reread', cueStage: 1, rereadCount: state.readingRereads, trigger: 'child-request' });
    state.sentenceIndex = 0;
    renderReading();
    byId('readingSelfCheckFeedback').textContent = choice === 'unsure' ? '괜찮아요. 한 문장씩 천천히 다시 읽어요. 파란 낱말을 누르면 뜻이 나와요.' : '한 문장씩 다시 읽어요.';
    byId('readingSelfCheckFeedback').className = 'feedback-line';
    saveState();
  }
  function toggleReadingLevel() {
    state.readingLevel = state.readingLevel === 'easy' ? 'challenge' : 'easy';
    state.readingSelfCheck = '';
    signals.log('reading-level', { activityId: 'information-reading', level: state.readingLevel });
    state.sentenceIndex = 0; renderReading(); saveState();
  }
  function wordHuntItem() { return wordHuntItems[Math.min(state.wordHunt.index, wordHuntItems.length - 1)]; }
  function wordHuntDoneCount() { return wordHuntItems.filter(item => state.wordHunt.done[item.id]).length; }
  function splitWord(word) {
    const match = String(word).match(/^(.*?)([.,!?]*)$/);
    return { core: match ? match[1] : word, punct: match ? match[2] : '' };
  }
  function wordHuntFeedback(text, tone) {
    byId('wordhuntFeedback').textContent = text;
    byId('wordhuntFeedback').className = `feedback-line${tone ? ' ' + tone : ''}`;
  }
  function renderWordHunt() {
    const wh = state.wordHunt;
    const sentence = byId('wordhuntSentence');
    const choices = byId('wordhuntChoices');
    const meaning = byId('wordhuntMeaning');
    const hintButton = byId('wordhuntHintButton');
    const listenBar = byId('soundhuntListen');
    const slowButton = byId('soundhuntSlowButton');
    const nextButton = byId('wordhuntNextButton');
    const continueButton = byId('wordhuntContinueButton');
    updateCoachPanel();
    stopSoundHunt();
    sentence.classList.remove('is-note');
    choices.hidden = true; choices.replaceChildren();
    meaning.hidden = true; meaning.textContent = '';
    hintButton.hidden = true; nextButton.hidden = true; continueButton.hidden = true;
    listenBar.classList.remove('is-quiet');
    byId('soundhuntPlayButton').hidden = false; slowButton.hidden = false;
    byId('wordhuntCounter').textContent = `${Math.min(wh.index + 1, wordHuntItems.length)} / ${wordHuntItems.length}`;
    if (wh.complete) {
      listenBar.classList.add('is-quiet');
      byId('soundhuntPlayButton').hidden = true; slowButton.hidden = true;
      sentence.classList.add('is-note');
      sentence.innerHTML = `<span>여섯 문장을 모두 고쳤어요!</span><small>귀로 듣고 글자를 맞춰 보면 가려낼 수 있어요.</small>`;
      byId('wordhuntLead').textContent = '';
      wordHuntFeedback('소리와 글자를 함께 확인했어요.', 'success');
      continueButton.hidden = false;
      return;
    }
    if (wh.phase === 'break') {
      listenBar.classList.add('is-quiet');
      byId('soundhuntPlayButton').hidden = true; slowButton.hidden = true;
      sentence.classList.add('is-note');
      sentence.innerHTML = `<span>${WORD_HUNT_BLOCK}개 문장을 고쳤어요. 잠깐 숨을 고르고 이어가요.</span><small>남은 문장 ${wordHuntItems.length - wh.index}개</small>`;
      byId('wordhuntLead').textContent = '준비되면 다음 문장으로 넘어가요.';
      wordHuntFeedback('잘하고 있어요. 서두르지 않아도 돼요.', 'success');
      nextButton.hidden = false; nextButton.textContent = `다음 ${WORD_HUNT_BLOCK}개 시작`;
      return;
    }
    const item = wordHuntItem();
    const done = Boolean(wh.done[item.id]);
    const fixing = wh.phase === 'fix' && !done;
    const hinted = Boolean(wh.hinted[item.id]);
    sentence.replaceChildren();
    item.words.forEach((word, index) => {
      const parts = splitWord(word);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'wordhunt-word';
      chip.dataset.wordIndex = String(index);
      chip.dataset.tap = 'answer';
      const isWrong = index === item.wrong;
      chip.textContent = (done && isWrong ? item.answer : parts.core) + parts.punct;
      if (isWrong && done) chip.classList.add('fixed');
      else if (isWrong && fixing) chip.classList.add('found');
      if (!done && !fixing && hinted && (index === item.wrong || index === item.decoy)) chip.classList.add('candidate');
      chip.disabled = done || fixing;
      chip.setAttribute('aria-label', isWrong && done ? `${item.answer} · 고친 낱말` : `${parts.core} 낱말`);
      sentence.append(chip);
    });
    updateSoundHuntPlayButton();
    if (done) {
      byId('wordhuntLead').textContent = '바르게 고친 문장을 들어 봐요.';
      slowButton.hidden = true;
      meaning.hidden = false; meaning.textContent = `뜻: ${item.ko}`;
      wordHuntFeedback(`맞는 낱말: "${item.answer}"`, 'success');
      nextButton.hidden = false;
      const nextIndex = wh.index + 1;
      nextButton.textContent = nextIndex >= wordHuntItems.length ? '모두 고쳤어요' : (nextIndex % WORD_HUNT_BLOCK === 0 ? '잠깐 쉬기' : '다음 문장');
      return;
    }
    if (fixing) {
      byId('wordhuntLead').textContent = '들은 낱말을 골라요.';
      if (wh.meaningShown[item.id]) { meaning.hidden = false; meaning.textContent = `뜻: ${item.ko}`; }
      choices.hidden = false;
      const label = document.createElement('p');
      label.className = 'wordhunt-fix-label';
      label.textContent = 'WHICH WORD DID YOU HEAR?';
      choices.append(label);
      item.choices.forEach(choice => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.word = choice;
        button.className = 'soundhunt-card';
        button.innerHTML = `<span aria-hidden="true">🔊</span>${escapeHtml(choice)}`;
        button.setAttribute('aria-label', choice);
        choices.append(button);
      });
      signals.decorate(choices.querySelectorAll('[data-word]'), wordHuntActivity, item.id + '-fix', button => button.dataset.word === item.answer);
      signals.ready(wordHuntActivity, item.id + '-fix', { textNode: choices, attempts: wh.fixAttempts[item.id] || 0, measureId: wordHuntMeasure, step: 'fix', discourseType: 'expository', inconsistencyType: 'lexical' });
      return;
    }
    byId('wordhuntLead').textContent = wh.listens[item.id] ? '다르게 적힌 낱말을 눌러요.' : '먼저 ▶ 듣기를 눌러요.';
    hintButton.hidden = false;
    hintButton.disabled = hinted;
    hintButton.textContent = hinted ? '두 낱말로 좁혔어요' : '두 낱말로 좁히기';
    signals.decorate(sentence.querySelectorAll('.wordhunt-word'), wordHuntActivity, item.id, chip => Number(chip.dataset.wordIndex) === item.wrong);
    signals.ready(wordHuntActivity, item.id, { textNode: sentence, attempts: wh.attempts[item.id] || 0, measureId: wordHuntMeasure, step: 'find', discourseType: 'expository', inconsistencyType: 'lexical' });
  }
  /* 소리 듣기 — 로컬 mp3만 재생(assets/audio). 첫 듣기는 과제 제시, 그 뒤 다시 듣기·천천히 듣기는 A1 도움으로 기록. */
  const soundHuntAudio = new Audio();
  soundHuntAudio.preload = 'auto';
  let soundHuntPaceTimers = [];
  function clearSoundHuntPace() {
    soundHuntPaceTimers.forEach(clearTimeout); soundHuntPaceTimers = [];
    byId('wordhuntSentence').querySelectorAll('.wordhunt-word.pace').forEach(chip => chip.classList.remove('pace'));
  }
  function stopSoundHunt() {
    try { soundHuntAudio.pause(); } catch (_) { /* ignore */ }
    clearSoundHuntPace();
    byId('soundhuntListen')?.classList.remove('is-playing');
  }
  function playSoundHunt(src, paceChips) {
    stopSoundHunt();
    soundHuntAudio.src = src;
    soundHuntAudio.currentTime = 0;
    byId('soundhuntListen').classList.add('is-playing');
    if (paceChips && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      soundHuntAudio.onplaying = () => {
        soundHuntAudio.onplaying = null;
        const chips = [...byId('wordhuntSentence').querySelectorAll('.wordhunt-word')];
        const total = (Number.isFinite(soundHuntAudio.duration) ? soundHuntAudio.duration : 3.5) * 1000 * 0.9;
        const step = total / Math.max(chips.length, 1);
        chips.forEach((chip, index) => {
          soundHuntPaceTimers.push(setTimeout(() => chip.classList.add('pace'), index * step));
          soundHuntPaceTimers.push(setTimeout(() => chip.classList.remove('pace'), index * step + step * 0.95));
        });
      };
    } else soundHuntAudio.onplaying = null;
    soundHuntAudio.onended = () => { clearSoundHuntPace(); byId('soundhuntListen').classList.remove('is-playing'); };
    const played = soundHuntAudio.play();
    if (played && played.catch) played.catch(() => byId('soundhuntListen').classList.remove('is-playing'));
  }
  function updateSoundHuntPlayButton() {
    const wh = state.wordHunt;
    const button = byId('soundhuntPlayButton');
    if (wh.complete || wh.phase === 'break') return;
    const item = wordHuntItem();
    const replay = Boolean(wh.listens[item.id]) && !wh.done[item.id];
    byId('soundhuntPlayLabel').textContent = replay ? '한 번 더 듣기' : '듣기';
    if (replay) {
      button.dataset.track = 'hint'; button.dataset.helpLevel = 'A1'; button.dataset.helpType = 'replay-audio';
    } else {
      delete button.dataset.track; delete button.dataset.helpLevel; delete button.dataset.helpType;
    }
  }
  function soundHuntListen(slow) {
    const wh = state.wordHunt;
    if (wh.complete || wh.phase === 'break') return;
    const item = wordHuntItem();
    const src = `assets/audio/${item.id}-sentence${slow ? '-slow' : ''}.mp3`;
    if (wh.done[item.id]) { playSoundHunt(src, true); return; }
    const first = !wh.listens[item.id];
    wh.listens[item.id] = (wh.listens[item.id] || 0) + 1;
    if (slow) wh.slowListens[item.id] = (wh.slowListens[item.id] || 0) + 1;
    if (!first || slow) {
      wh.rereads[item.id] = (wh.rereads[item.id] || 0) + 1;
      signals.hint(wordHuntActivity, wh.phase === 'fix' ? item.id + '-fix' : item.id, { helpLevel: 'A1', helpType: slow ? 'slow-audio' : 'replay-audio', cueStage: 1, rereadCount: wh.rereads[item.id], trigger: 'child-request' });
    }
    playSoundHunt(src, true);
    if (first && wh.phase === 'find') byId('wordhuntLead').textContent = '다르게 적힌 낱말을 눌러요.';
    updateSoundHuntPlayButton();
    saveState(); updateCoachPanel();
  }
  function logMonitoringItem(item) {
    const wh = state.wordHunt;
    const findAcc = wh.findAccuracy[item.id] || '';
    const fixAcc = wh.fixAccuracy[item.id] || '';
    const detected = findAcc === 'accurate' || findAcc === 'self-corrected';
    const corrected = fixAcc === 'accurate' || fixAcc === 'self-corrected';
    const outcome = detected && corrected ? 'detected-corrected' : detected ? 'detected-not-corrected' : corrected ? 'cued-corrected' : 'not-detected';
    const cueStage = wh.revealed[item.id] ? 5 : wh.meaningShown[item.id] ? 4 : wh.hinted[item.id] ? 2 : wh.rereads[item.id] ? 1 : 0;
    const maxHelpLevel = wh.revealed[item.id] ? 'A4' : (wh.hinted[item.id] || wh.meaningShown[item.id]) ? 'A2' : wh.rereads[item.id] ? 'A1' : undefined;
    signals.log('monitoring-item', { activityId: wordHuntActivity, itemId: item.id, discourseType: 'expository', inconsistencyType: 'lexical', detected, corrected, detectionLatencyMs: wh.detectMs[item.id], findAttempts: wh.attempts[item.id] || 0, fixAttempts: wh.fixAttempts[item.id] || 0, rereadCount: wh.rereads[item.id] || 0, selfCorrection: findAcc === 'self-corrected', findAccuracy: findAcc || undefined, fixAccuracy: fixAcc || undefined, maxHelpLevel, cueStage, monitoringOutcome: outcome, measureId: wordHuntMeasure });
  }
  function monitoringCounts() {
    const wh = state.wordHunt;
    const counts = { detectedCorrected: 0, detectedNotCorrected: 0, cuedCorrected: 0, notDetected: 0, spontaneousDetections: 0 };
    wordHuntItems.forEach(item => {
      if (!wh.done[item.id]) return;
      const findAcc = wh.findAccuracy[item.id], fixAcc = wh.fixAccuracy[item.id];
      const detected = findAcc === 'accurate' || findAcc === 'self-corrected';
      const corrected = fixAcc === 'accurate' || fixAcc === 'self-corrected';
      if (findAcc === 'accurate') counts.spontaneousDetections += 1;
      if (detected && corrected) counts.detectedCorrected += 1;
      else if (detected) counts.detectedNotCorrected += 1;
      else if (corrected) counts.cuedCorrected += 1;
      else counts.notDetected += 1;
    });
    return counts;
  }
  function handleWordHuntWord(event) {
    const chip = event.target.closest('.wordhunt-word');
    if (!chip || chip.disabled) return;
    const wh = state.wordHunt;
    if (wh.phase !== 'find' || wh.complete) return;
    const item = wordHuntItem();
    const index = Number(chip.dataset.wordIndex);
    const correct = index === item.wrong;
    wh.attempts[item.id] = (wh.attempts[item.id] || 0) + 1;
    const attempt = wh.attempts[item.id];
    const result = signals.respond(wordHuntActivity, item.id, { correct, value: splitWord(item.words[index]).core, expected: splitWord(item.words[item.wrong]).core, step: 'find', measureId: wordHuntMeasure, discourseType: 'expository', inconsistencyType: 'lexical', detected: correct, rereadCount: wh.rereads[item.id] || 0 });
    if (correct) {
      wh.detectMs[item.id] = result.responseTimeMs;
      wh.findAccuracy[item.id] = result.accuracy || 'accurate';
      wh.phase = 'fix';
      wordHuntFeedback(`찾았어요! "${splitWord(item.words[item.wrong]).core}"는 다르게 적혔어요.`, 'success');
      saveState(); renderWordHunt();
      return;
    }
    byId('wordhuntSentence').querySelectorAll('.wordhunt-word').forEach(other => other.classList.remove('incorrect'));
    chip.classList.add('incorrect');
    if (attempt === 1) {
      wordHuntFeedback('이 낱말은 소리와 같아요. 한 번 더 들으며 글자를 따라가 봐요.', 'attention');
      signals.decorateLater(byId('wordhuntSentence').querySelectorAll('.wordhunt-word'), wordHuntActivity, item.id, c => Number(c.dataset.wordIndex) === item.wrong);
    } else if (attempt === 2) {
      if (!wh.hinted[item.id]) {
        wh.hinted[item.id] = 'auto';
        signals.hint(wordHuntActivity, item.id, { helpLevel: 'A2', helpType: 'auto-narrow', cueStage: 2, trigger: 'second-miss' });
      }
      wordHuntFeedback('두 낱말 중 하나예요. 어느 쪽이 들은 소리와 다른가요?', 'attention');
      setTimeout(renderWordHunt, 0);
    } else {
      wh.revealed[item.id] = true;
      wh.findAccuracy[item.id] = 'support';
      signals.hint(wordHuntActivity, item.id, { helpLevel: 'A4', helpType: 'reveal-answer', cueStage: 5, trigger: 'third-miss' });
      signals.close(wordHuntActivity, item.id, { resolution: 'revealed', measureId: wordHuntMeasure });
      wh.phase = 'fix';
      wordHuntFeedback(`함께 볼게요. 다르게 적힌 낱말: "${splitWord(item.words[item.wrong]).core}"`, 'attention');
      setTimeout(renderWordHunt, 0);
    }
    saveState();
  }
  function handleWordHuntChoice(event) {
    const button = event.target.closest('[data-word]');
    if (!button) return;
    const wh = state.wordHunt;
    if (wh.phase !== 'fix' || wh.complete) return;
    const item = wordHuntItem();
    const correct = button.dataset.word === item.answer;
    wh.fixAttempts[item.id] = (wh.fixAttempts[item.id] || 0) + 1;
    const attempt = wh.fixAttempts[item.id];
    const result = signals.respond(wordHuntActivity, item.id + '-fix', { correct, value: button.dataset.word, expected: item.answer, step: 'fix', measureId: wordHuntMeasure, discourseType: 'expository', inconsistencyType: 'lexical', corrected: correct, rereadCount: wh.rereads[item.id] || 0 });
    byId('wordhuntChoices').querySelectorAll('[data-word]').forEach(other => other.classList.remove('selected', 'correct', 'incorrect'));
    button.classList.add('selected');
    const wordSrc = `assets/audio/word-${button.dataset.word.toLowerCase()}.mp3`;
    if (correct) {
      button.classList.add('correct');
      wh.fixAccuracy[item.id] = result.accuracy || 'accurate';
      wh.done[item.id] = true;
      wh.phase = 'done';
      logMonitoringItem(item);
      byId('wordhuntFeedback').textContent = '';
      saveState(); renderWordHunt();
      playSoundHunt(wordSrc, false);
      return;
    }
    button.classList.add('incorrect');
    playSoundHunt(wordSrc, false);
    if (attempt === 1) {
      wordHuntFeedback('소리를 비교해 봐요. 문장을 한 번 더 듣고 다시 골라요.', 'attention');
      signals.decorateLater(byId('wordhuntChoices').querySelectorAll('[data-word]'), wordHuntActivity, item.id + '-fix', b => b.dataset.word === item.answer);
    } else if (attempt === 2) {
      wh.meaningShown[item.id] = true;
      signals.hint(wordHuntActivity, item.id + '-fix', { helpLevel: 'A2', helpType: 'show-meaning', cueStage: 4, trigger: 'second-miss' });
      const meaning = byId('wordhuntMeaning');
      meaning.hidden = false; meaning.textContent = `뜻: ${item.ko}`;
      wordHuntFeedback('뜻을 보고, 그 뜻에 맞는 낱말을 골라요.', 'attention');
      signals.decorateLater(byId('wordhuntChoices').querySelectorAll('[data-word]'), wordHuntActivity, item.id + '-fix', b => b.dataset.word === item.answer);
    } else {
      signals.hint(wordHuntActivity, item.id + '-fix', { helpLevel: 'A4', helpType: 'reveal-answer', cueStage: 5, trigger: 'third-miss' });
      signals.close(wordHuntActivity, item.id + '-fix', { resolution: 'revealed', measureId: wordHuntMeasure });
      wh.fixAccuracy[item.id] = 'support';
      wh.done[item.id] = true;
      wh.revealed[item.id] = true;
      wh.phase = 'done';
      logMonitoringItem(item);
      byId('wordhuntFeedback').textContent = '';
      saveState(); renderWordHunt();
      wordHuntFeedback(`함께 볼게요. 맞는 낱말: "${item.answer}"`, 'attention');
      playSoundHunt(`assets/audio/word-${item.answer.toLowerCase()}.mp3`, false);
      return;
    }
    saveState();
  }
  function wordHuntHint() {
    const wh = state.wordHunt;
    if (wh.phase !== 'find' || wh.complete) return;
    const item = wordHuntItem();
    if (wh.hinted[item.id]) return;
    wh.hinted[item.id] = 'manual';
    signals.hint(wordHuntActivity, item.id, { helpLevel: 'A2', helpType: 'narrow-choices', cueStage: 2, trigger: 'child-request' });
    wordHuntFeedback('두 낱말로 좁혔어요. 어느 쪽이 들은 소리와 다른가요?');
    saveState(); renderWordHunt();
  }
  function wordHuntNext() {
    const wh = state.wordHunt;
    if (wh.complete) return;
    if (wh.phase === 'break') { wh.phase = 'find'; wh.breakSeen = true; saveState(); renderWordHunt(); return; }
    if (!wh.done[wordHuntItem().id]) return;
    const nextIndex = wh.index + 1;
    if (nextIndex >= wordHuntItems.length) {
      wh.complete = true;
      wh.phase = 'done';
      signals.activityComplete(wordHuntActivity, Object.assign({ itemsRevealed: Object.keys(wh.revealed).length, hintsUsed: Object.keys(wh.hinted).length, rereadTotal: Object.values(wh.rereads).reduce((sum, n) => sum + n, 0), discourseType: 'expository', inconsistencyType: 'lexical' }, monitoringCounts()));
    } else {
      wh.index = nextIndex;
      wh.phase = nextIndex % WORD_HUNT_BLOCK === 0 ? 'break' : 'find';
      if (wh.phase === 'break') signals.log('block-break', { activityId: wordHuntActivity, afterItem: nextIndex, itemsDone: wordHuntDoneCount() });
    }
    byId('wordhuntFeedback').textContent = '';
    saveState(); renderWordHunt();
  }

  const spellingActivity = 'spot-the-word';
  const spellingMeasure = 'case.spelling';
  /* 7번 젤리 달리기 · 2분 타임 플레이(2026-10-01)
     - 낱말 풀(spellingItems)을 섞어 차례로 달려온다. 맞히면 바로 다음 낱말, 틀린 낱말은 두 개 뒤에 다시 온다.
     - 2번째로 틀리면 저절로 둘로 좁혀지고(A2), 3번째부터는 진짜 낱말을 알려 준 뒤(A4) 다시 오게 한다. 맞혀야 끝난다.
     - 🔍 아이템은 처음엔 없다. 가끔 길 위에 나타나는 🔍을 먹으면 모이고(최대 3), H나 버튼으로 둘로 좁힌다(A2, 기존 기록과 같음).
     - 시간은 달리는 동안만 줄어든다(멈춤·코치 활동잠금·화면 이동 때는 멈춤). */
  const JR_TIME = 120, JR_ITEM_MAX = 3, JR_PICKUP_EVERY = 3, JR_PICKUP_SECONDS = 2.6;
  function spShuffle(list) { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function spInit() {
    const sp = state.spelling;
    if (!Array.isArray(sp.queue)) sp.queue = [];
    if (typeof sp.timeLeft !== 'number') sp.timeLeft = JR_TIME;
    if (typeof sp.items !== 'number') sp.items = 0;
    if (typeof sp.waves !== 'number') sp.waves = 0;
    if (typeof sp.collected !== 'number') sp.collected = 0;
    if (!sp.complete && (!sp.current || sp.done[sp.current] || !spellingItems.some(i => i.id === sp.current))) spAdvance();
  }
  function spAdvance() {
    const sp = state.spelling, prev = sp.current;
    sp.queue = sp.queue.filter((id, i, a) => !sp.done[id] && a.indexOf(id) === i && spellingItems.some(item => item.id === id));
    if (!sp.queue.length) sp.queue = spShuffle(spellingItems.filter(i => !sp.done[i.id]).map(i => i.id));
    sp.current = sp.queue.shift() || '';
    if (sp.current && sp.current === prev && sp.queue.length) { const next = sp.queue.shift(); sp.queue.unshift(sp.current); sp.current = next; }
  }
  function spellingItem() { const sp = state.spelling; return spellingItems.find(i => i.id === sp.current) || spellingItems[0]; }
  function spellingDoneCount() { return spellingItems.filter(item => state.spelling.done[item.id]).length; }
  function spellingOrder(item) {
    const sp = state.spelling;
    if (!Array.isArray(sp.order[item.id]) || sp.order[item.id].length !== item.choices.length) {
      const idx = item.choices.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      sp.order[item.id] = idx;
    }
    return sp.order[item.id].map(i => item.choices[i]);
  }
  function spellingFeedback(text, tone) {
    byId('spellingFeedback').textContent = text;
    byId('spellingFeedback').className = `feedback-line${tone ? ' ' + tone : ''}`;
  }
  const JR_SPEED = { slow: 11, mid: 8 };          /* 카드가 지평선에서 젤리까지 오는 초 */
  const JR_F0 = 0.06, JR_FHIT = 0.76, JR_FEND = 1.08;
  const jellyRun = { state: 'cover', speed: 'slow', lane: 1, f: JR_F0, waveId: '', resolved: false, raf: 0, last: 0, gas: 0, mult: 1, timer: 0, stars: -1, started: false, dash: false, pickup: null, phase: 'cards', shownSec: -1 };
  function jellyReduced() { return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function jellyLane(lane) {
    jellyRun.lane = Math.max(0, Math.min(2, lane));
    const track = byId('spellingTrack');
    if (track) track.style.setProperty('--jr-lane', String(jellyRun.lane));
  }
  function jellyReact(cls) {
    const jelly = byId('spellingJelly');
    if (!jelly) return;
    jelly.classList.remove('chomp', 'ouch');
    void jelly.offsetWidth;
    jelly.classList.add(cls);
  }
  function jellyPop(text, tone, lane) {
    const track = byId('spellingTrack');
    if (!track) return;
    const pop = document.createElement('div');
    pop.className = `jr-pop ${tone}`;
    pop.textContent = text;
    pop.style.setProperty('--jr-lane', String(lane));
    pop.setAttribute('aria-hidden', 'true');
    track.append(pop);
    setTimeout(() => pop.remove(), 820);
  }
  function jellyProject(f, lane) {
    const track = byId('spellingTrack');
    const W = track.clientWidth, H = track.clientHeight, hz = H * 0.22;
    return { x: W / 2 + (lane - 1) * W * (0.2 + 0.8 * f) / 3, y: hz + (H - hz) * Math.min(f, 1.2), scale: Math.min(1.08, 0.35 + 0.65 * (f / JR_FHIT)) };
  }
  function jellyPlace() {
    const track = byId('spellingTrack');
    if (!track) return;
    const f = jellyRun.f;
    byId('spellingChoices').querySelectorAll('[data-word]').forEach(button => {
      if (button.classList.contains('eaten')) return;
      const p = jellyProject(f, Number(button.dataset.lane) || 0);
      const w = button.offsetWidth, h = button.offsetHeight;
      button.style.transform = `translate(${(p.x - w / 2).toFixed(1)}px, ${(p.y - h).toFixed(1)}px) scale(${p.scale.toFixed(3)})`;
      const fadeIn = Math.min(1, (f - JR_F0) / 0.06 + 0.15);
      const fadeOut = jellyRun.resolved ? Math.max(0, (JR_FEND - f) / (JR_FEND - JR_FHIT)) : 1;
      button.style.opacity = Math.max(0, Math.min(fadeIn, fadeOut)).toFixed(2);
      button.style.zIndex = String(Math.round(f * 100));
    });
    byId('spellingChoices').classList.toggle('jr-hold', jellyRun.phase === 'pickup');
    const pk = jellyRun.pickup, el = byId('jrPickup');
    if (pk && el) {
      const fp = pk.f;
      const p = jellyProject(fp, pk.lane);
      el.style.transform = `translate(${(p.x - 26).toFixed(1)}px, ${(p.y - 52).toFixed(1)}px) scale(${p.scale.toFixed(3)})`;
      el.style.opacity = pk.taken ? '0' : String(Math.max(0, Math.min(1, (fp - JR_F0) / 0.06, (JR_FEND - fp) / 0.2)));
      el.style.zIndex = String(Math.round(fp * 100));
    }
  }
  function jellyTimerText() {
    const t = Math.max(0, Math.ceil(state.spelling.timeLeft));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }
  function jellyTimerSync() {
    const el = byId('spellingTimer'); if (!el) return;
    el.querySelector('b').textContent = jellyTimerText();
    el.classList.toggle('hurry', state.spelling.timeLeft <= 15 && !state.spelling.complete);
  }
  function jellyCover(kind) {
    const track = byId('spellingTrack');
    if (!track) return;
    let cover = byId('spellingCover');
    if (!cover) { cover = document.createElement('div'); cover.id = 'spellingCover'; cover.className = 'jr-cover'; track.append(cover); }
    if (!kind) { cover.hidden = true; return; }
    const speeds = [['slow', '느리게'], ['mid', '보통']].map(([k, label]) => `<button type="button" data-jr-speed="${k}" class="${jellyRun.speed === k ? 'on' : ''}">${label}</button>`).join('');
    cover.innerHTML = `<strong>${kind === 'start' ? '⏱ 2분 젤리 달리기' : '잠깐 쉬어요 · ⏱ ' + jellyTimerText()}</strong>
      <p>진짜 낱말 쪽으로 줄을 바꿔 <b>냠!</b> 길 위의 🔍을 먹으면 둘로 좁힐 수 있어요.</p>
      <p class="jr-keys"><kbd>←</kbd><kbd>→</kbd> 줄 · <kbd>스페이스</kbd> 냠! · <kbd>H</kbd> 🔍 쓰기 · <kbd>Esc</kbd> 멈춤</p>
      <div class="jr-speed">${speeds}</div>
      <button type="button" class="primary-action" data-jr-go>${kind === 'start' ? '출발!' : '다시 달리기'} <small>Enter</small></button>`;
    cover.hidden = false;
  }
  function jellyStop() { cancelAnimationFrame(jellyRun.raf); jellyRun.raf = 0; byId('spellingTrack')?.classList.remove('is-running', 'boost', 'slowdown'); }
  function jellyGo() {
    if (state.spelling.complete) return;
    jellyCover(null);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (!jellyRun.started) signals.log('jelly-run-start', { activityId: spellingActivity, speed: jellyRun.speed, timeLeft: Math.round(state.spelling.timeLeft) });
    jellyRun.started = true;
    jellyRun.state = jellyRun.resolved ? 'wait' : 'run';
    if (jellyRun.state === 'wait' && !jellyRun.timer) jellyRun.timer = setTimeout(spNextWave, 300);
    jellyRun.last = performance.now();
    jellyStop();
    byId('spellingTrack')?.classList.add('is-running');
    jellyLoop();
  }
  function jellyPause() {
    if (jellyRun.state !== 'run' && jellyRun.state !== 'wait') return;
    jellyRun.gas = 0;
    jellyStop();
    jellyRun.state = 'pause';
    saveState();
    jellyCover('pause');
  }
  function jellyNewWave(itemId) {
    const sp = state.spelling;
    jellyRun.waveId = itemId;
    jellyRun.f = JR_F0;
    jellyRun.resolved = false;
    jellyRun.dash = false;
    byId('spellingTrack')?.classList.remove('dash');
    byId('jrPickup')?.remove();
    jellyRun.pickup = null;
    jellyRun.phase = 'cards';
    sp.waves += 1;
    if (sp.waves % JR_PICKUP_EVERY === 0 && sp.items < JR_ITEM_MAX && !sp.complete) {
      jellyRun.pickup = { lane: Math.floor(Math.random() * 3), taken: false, passed: false, f: JR_F0 };
      jellyRun.phase = 'pickup';
      const el = document.createElement('div');
      el.id = 'jrPickup'; el.className = 'jr-pickup'; el.textContent = '🔍'; el.setAttribute('aria-hidden', 'true');
      byId('spellingTrack').append(el);
    }
    jellyPlace();
    jellyItemSync();
  }
  function jellyCheckPickup() {
    const pk = jellyRun.pickup;
    if (!pk || pk.taken || pk.passed || pk.f < JR_FHIT) return;
    const sp = state.spelling;
    if (pk.lane === jellyRun.lane && sp.items < JR_ITEM_MAX) {
      pk.taken = true; sp.items += 1; sp.collected += 1;
      jellyPop('🔍 +1', 'item', pk.lane);
      signals.log('item-pickup', { activityId: spellingActivity, itemId: spellingItem().id, items: sp.items });
      const btn = byId('spellingItemButton'); if (btn) { btn.classList.remove('used'); void btn.offsetWidth; btn.classList.add('used'); }
      jellyItemSync(); saveState();
    } else pk.passed = true;
  }
  function jellyResolve() {
    jellyRun.resolved = true;
    jellyRun.dash = false;
    byId('spellingTrack')?.classList.remove('dash');
    const hit = Array.from(byId('spellingChoices').querySelectorAll('[data-word]')).find(b => Number(b.dataset.lane) === jellyRun.lane && !b.disabled);
    jellyRun.state = 'wait';
    if (!hit) {
      jellyPop('휙! 다시 와요', 'dodge', jellyRun.lane);
      spellingFeedback('빈 길로 지나갔어요. 낱말이 다시 달려와요.', '');
      jellyRun.timer = setTimeout(() => spNextWave(true), 650);
      return;
    }
    const correct = handleSpellingChoice({ target: hit });
    jellyItemSync();
    jellyRun.timer = setTimeout(spNextWave, correct ? 450 : 900);
  }
  function spNextWave(sameItem) {
    clearTimeout(jellyRun.timer); jellyRun.timer = 0;
    const sp = state.spelling;
    if (sp.complete || state.screen !== 'spelling') return;
    if (!sameItem) spAdvance();
    if (!sp.current) { spFinish('all-found'); return; }
    jellyRun.waveId = '';
    if (jellyRun.state === 'wait') jellyRun.state = 'run';
    saveState();
    renderSpelling();
  }
  function spFinish(reason) {
    const sp = state.spelling;
    if (sp.complete) return;
    clearTimeout(jellyRun.timer); jellyRun.timer = 0;
    sp.complete = true;
    if (reason === 'time') sp.timeLeft = 0;
    const tried = Object.keys(sp.attempts).length;
    signals.activityComplete(spellingActivity, { reason, found: spellingDoneCount(), tried, poolSize: spellingItems.length, itemsRevealed: Object.keys(sp.revealed).length, hintsUsed: Object.values(sp.hinted).filter(v => v === 'manual').length, itemsCollected: sp.collected, secondsUsed: Math.round(JR_TIME - sp.timeLeft) });
    saveState();
    renderSpelling();
    updateCoachPanel();
  }
  function jellyLoop() {
    jellyRun.raf = requestAnimationFrame(t => {
      if (jellyRun.state !== 'run' && jellyRun.state !== 'wait') return;
      if (state.screen !== 'spelling') { jellyPause(); return; }
      const dt = Math.min(0.05, (t - jellyRun.last) / 1000);
      jellyRun.last = t;
      const locked = window.OncuvateClassroomControl?.activityLocked === true && !isCoach;
      const want = jellyRun.gas > 0 ? 1.8 : jellyRun.gas < 0 ? 0.45 : 1;
      jellyRun.mult += (want - jellyRun.mult) * Math.min(1, dt * 6);
      const track = byId('spellingTrack');
      track.classList.toggle('boost', jellyRun.mult > 1.3);
      track.classList.toggle('slowdown', jellyRun.mult < 0.7);
      track.classList.toggle('is-running', !locked);
      if (!locked) {
        const sp = state.spelling;
        sp.timeLeft = Math.max(0, sp.timeLeft - dt);
        const sec = Math.ceil(sp.timeLeft);
        if (sec !== jellyRun.shownSec) { jellyRun.shownSec = sec; jellyTimerSync(); if (sec % 5 === 0) saveState(); }
        if (sp.timeLeft <= 0) { jellyStop(); jellyRun.state = 'idle'; spFinish('time'); return; }
        if (jellyRun.phase === 'pickup' && jellyRun.pickup) {
          /* 🔍 아이템이 혼자 지나가는 구간: 낱말 카드는 아직 나오지 않는다 */
          const pk = jellyRun.pickup;
          pk.f += dt * jellyRun.mult * (JR_FHIT - JR_F0) / JR_PICKUP_SECONDS;
          jellyCheckPickup();
          if (pk.f >= JR_FHIT + 0.14) {
            jellyRun.phase = 'cards'; jellyRun.f = JR_F0; byId('jrPickup')?.remove(); jellyRun.pickup = null;
            const it = spellingItem();
            signals.ready(spellingActivity, it.id, { textNode: byId('spellingScreen'), attempts: state.spelling.attempts[it.id] || 0, measureId: spellingMeasure, step: 'spell' });
          }
        } else {
          jellyRun.f += jellyRun.dash && !jellyRun.resolved ? dt * 2.4 : dt * jellyRun.mult * (JR_FHIT - JR_F0) / JR_SPEED[jellyRun.speed];
        }
        if (jellyRun.state === 'run' && jellyRun.phase !== 'pickup' && !jellyRun.resolved && jellyRun.f >= JR_FHIT) jellyResolve();
        jellyPlace();
      }
      jellyLoop();
    });
  }
  function jellyRunSync(item) {
    const track = byId('spellingTrack');
    if (!track) return;
    jellyItemSync();
    jellyTimerSync();
    const stars = spellingDoneCount();
    byId('spellingStars').textContent = String(stars);
    if (jellyRun.stars >= 0 && stars > jellyRun.stars) {
      const pill = byId('spellingStarPill');
      pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    }
    jellyRun.stars = stars;
    track.classList.toggle('is-complete', !item);
    const old = track.querySelector('.jr-done');
    if (old) old.remove();
    if (!item) {
      clearTimeout(jellyRun.timer);
      jellyStop();
      jellyRun.state = 'idle';
      jellyCover(null);
      byId('jrPickup')?.remove();
      jellyLane(1);
      const done = document.createElement('div');
      done.className = 'jr-done';
      done.innerHTML = `<small>${state.spelling.timeLeft <= 0 ? '⏱ TIME UP' : 'ALL FOUND'}</small>⭐ ${stars}개 냠!`;
      track.append(done);
      return;
    }
    if (jellyRun.waveId !== item.id) jellyNewWave(item.id);
    else jellyPlace();
    if (!jellyRun.started) { jellyRun.state = 'cover'; jellyCover('start'); }
    else if (jellyRun.state === 'pause' || (jellyRun.state === 'run' && !jellyRun.raf)) { jellyRun.state = 'pause'; jellyCover('pause'); }
  }
  function jellyItemSync() {
    const btn = byId('spellingItemButton'); if (!btn) return;
    const sp = state.spelling, item = spellingItem();
    byId('spellingItemCount').textContent = String(sp.items || 0);
    btn.disabled = !sp.items || sp.complete || Boolean(sp.hinted[item.id]) || jellyRun.resolved;
    btn.classList.toggle('empty', !sp.items);
  }
  function jellyUseItem() {
    const btn = byId('spellingItemButton');
    const sp = state.spelling;
    if (!btn || btn.disabled || !sp.items) return;
    const item = spellingItem();
    if (sp.hinted[item.id]) return;
    sp.items -= 1;
    spellingNarrow(item, 'narrow-choices', 'child-request');
    spellingFeedback('🔍 둘로 좁혔어요. 글자를 하나씩 견주어 봐요.');
    saveState(); renderSpelling();
    jellyPop('🔍 둘로 좁혔어!', 'item', jellyRun.lane);
    btn.classList.remove('used'); void btn.offsetWidth; btn.classList.add('used');
  }
  function jellySteer(event) {
    if (event.target.closest('#spellingItemButton')) { jellyUseItem(); return; }
    const cover = event.target.closest('#spellingCover');
    if (cover) {
      const speed = event.target.closest('[data-jr-speed]');
      if (speed) { jellyRun.speed = speed.dataset.jrSpeed; cover.querySelectorAll('[data-jr-speed]').forEach(b => b.classList.toggle('on', b === speed)); return; }
      if (event.target.closest('[data-jr-go]')) jellyGo();
      return;
    }
    if (jellyRun.state !== 'run') return;
    const card = event.target.closest('[data-word]');
    if (card) { const lane = Number(card.dataset.lane) || 0; if (lane === jellyRun.lane) jellyDash(); else jellyLane(lane); return; }
    const rect = byId('spellingTrack').getBoundingClientRect();
    const jellyX = rect.width * (0.18667 + jellyRun.lane * 0.31333);
    jellyLane(jellyRun.lane + (event.clientX - rect.left < jellyX ? -1 : 1));
  }
  function jellyKeys(event) {
    if (state.screen !== 'spelling' || document.querySelector('dialog[open]')) return;
    if (event.target.closest && event.target.closest('input, textarea, select')) return;
    const key = event.key;
    if (jellyRun.state === 'cover' || jellyRun.state === 'pause') {
      if (key === 'Enter' || key === ' ') { event.preventDefault(); jellyGo(); }
      return;
    }
    if (jellyRun.state !== 'run' && jellyRun.state !== 'wait') return;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') { jellyLane(jellyRun.lane - 1); event.preventDefault(); }
    else if (key === 'ArrowRight' || key === 'd' || key === 'D') { jellyLane(jellyRun.lane + 1); event.preventDefault(); }
    else if (key === 'ArrowUp' || key === 'w' || key === 'W') { jellyRun.gas = 1; event.preventDefault(); }
    else if (key === 'ArrowDown' || key === 's' || key === 'S') { jellyRun.gas = -1; event.preventDefault(); }
    else if (key === ' ') { jellyDash(); event.preventDefault(); }
    else if (key === 'h' || key === 'H') { jellyUseItem(); event.preventDefault(); }
    else if (key === 'Escape' || key === 'p' || key === 'P') { jellyPause(); event.preventDefault(); }
  }
  /* 스페이스(또는 지금 줄의 카드를 한 번 더 누르기) = 이 줄로 결정, 카드가 빠르게 다가와 바로 냠/앗 판정 */
  function jellyDash() {
    if (jellyRun.state !== 'run' || jellyRun.resolved || jellyRun.dash || jellyRun.phase === 'pickup') return;
    jellyRun.dash = true;
    signals.log('jelly-dash', { activityId: spellingActivity, itemId: spellingItem().id, lane: jellyRun.lane, depth: Math.round(jellyRun.f * 100) / 100 });
    byId('spellingTrack')?.classList.add('dash');
  }
  function jellyKeysUp(event) {
    if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(event.key)) jellyRun.gas = 0;
  }
  function renderSpelling() {
    spInit();
    const sp = state.spelling;
    const meaning = byId('spellingMeaning');
    const choices = byId('spellingChoices');
    const continueButton = byId('spellingContinueButton');
    choices.replaceChildren();
    byId('spellingHintButton').hidden = true; byId('spellingNextButton').hidden = true; continueButton.hidden = !sp.complete;
    byId('spellingCounter').textContent = `⭐ ${spellingDoneCount()} / ${spellingItems.length}`;
    if (sp.complete) {
      meaning.innerHTML = `<span>${sp.timeLeft <= 0 ? '⏱ 2분 끝!' : '모두 찾았어요!'} 진짜 낱말 ${spellingDoneCount()}개를 냠!</span><small>장난꾸러기 낱말은 글자 하나로 뜻이 달라져요.</small>`;
      byId('spellingLead').textContent = '이제 정리한 정보로 인포그래픽을 만들어요.';
      spellingFeedback('글자를 하나씩 보는 눈이 진짜 낱말을 찾아요.', 'success');
      jellyRunSync(null);
      return;
    }
    const item = spellingItem();
    const entry = words.find(w => w.word === item.word) || { meaning: item.meaning || item.word, read: '' };
    const parts = String(item.meaning || entry.meaning || '').split('·');
    const en = parts.length > 1 ? parts.slice(0, -1).join('·').trim() : '';
    const ko = (parts[parts.length - 1] || '').trim();
    meaning.innerHTML = `<span>${escapeHtml(ko)}</span>${en ? `<small>${escapeHtml(en)}</small>` : ''}`;
    const hidden = sp.narrowed[item.id];
    spellingOrder(item).forEach((choice, lane) => {
      if (hidden && choice.w === hidden) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.word = choice.w;
      button.dataset.lane = String(lane);
      button.style.setProperty('--jr-col', String(lane + 1));
      button.textContent = choice.w;
      choices.append(button);
    });
    byId('spellingLead').textContent = '뜻을 읽고, 바르게 쓴 낱말 쪽으로 달려요.';
    signals.decorate(choices.querySelectorAll('[data-word]'), spellingActivity, item.id, button => button.dataset.word === item.word);
    signals.ready(spellingActivity, item.id, { textNode: byId('spellingScreen'), attempts: sp.attempts[item.id] || 0, measureId: spellingMeasure, step: 'spell' });
    jellyRunSync(item);
    updateCoachPanel();
  }
  function spellingNarrow(item, helpType, trigger) {
    const sp = state.spelling;
    if (sp.hinted[item.id]) return;
    const wrong = item.choices.filter(c => !c.ok);
    sp.hinted[item.id] = trigger === 'child-request' ? 'manual' : 'auto';
    sp.narrowed[item.id] = wrong[Math.floor(Math.random() * wrong.length)].w;
    signals.hint(spellingActivity, item.id, { helpLevel: 'A2', helpType, cueStage: 2, trigger });
  }
  /* 부딪힌 카드 하나를 채점한다. 맞으면 true. 다음 낱말로 넘기는 일은 jellyResolve → spNextWave가 한다. */
  function handleSpellingChoice(event) {
    const button = event.target.closest('[data-word]');
    if (!button || button.disabled) return false;
    const sp = state.spelling;
    if (sp.complete) return false;
    const item = spellingItem();
    if (sp.done[item.id]) return false;
    const choice = item.choices.find(c => c.w === button.dataset.word);
    const correct = Boolean(choice && choice.ok);
    sp.attempts[item.id] = (sp.attempts[item.id] || 0) + 1;
    const attempt = sp.attempts[item.id];
    signals.respond(spellingActivity, item.id, { correct, value: button.dataset.word, expected: item.word, step: 'spell', measureId: spellingMeasure, distractorKind: choice && !choice.ok ? 'funny' : undefined });
    const lane = Number(button.dataset.lane) || 0;
    if (correct) {
      sp.done[item.id] = true;
      button.classList.add('correct', 'eaten');
      jellyReact('chomp'); jellyPop('냠! ⭐', 'good', lane);
      const entry = words.find(w => w.word === item.word);
      spellingFeedback(`맞아요! ${item.word}${entry && entry.read ? ' · ' + entry.read : ''}`, 'success');
      jellyRunSync(item);
      byId('spellingCounter').textContent = `⭐ ${spellingDoneCount()} / ${spellingItems.length}`;
      saveState();
      return true;
    }
    button.classList.add('incorrect', 'bumped');
    jellyReact('ouch'); jellyPop('앗!', 'bad', lane);
    signals.decorateLater(byId('spellingChoices').querySelectorAll('[data-word]'), spellingActivity, item.id, b => b.dataset.word === item.word);
    if (attempt >= 2) spellingNarrow(item, 'auto-narrow', 'second-miss');
    if (attempt >= 3 && !sp.revealed[item.id]) {
      sp.revealed[item.id] = true;
      signals.hint(spellingActivity, item.id, { helpLevel: 'A4', helpType: 'reveal-answer', cueStage: 5, trigger: 'third-miss' });
    }
    spellingFeedback(attempt >= 3 ? `진짜 낱말은 ${item.word}! 다시 올 때 냠 해요.` : `${choice ? choice.joke : '뜻과 맞지 않아요.'} 이 낱말은 조금 뒤에 다시 와요.`, 'attention');
    sp.queue = sp.queue.filter(id => id !== item.id);
    sp.queue.splice(Math.min(2, sp.queue.length), 0, item.id);
    saveState();
    return false;
  }
  function spellingHint() { jellyUseItem(); }
  function spellingNext() { spNextWave(); }
  function normalizeMindMapWord(value) {
    return String(value || '').trim().toLowerCase().replace(/[.,!?]+$/g, '');
  }
  /* 8번 인포그래픽: 문장 카드 한 장씩 — ① 빈칸 낱말 쓰기 → ② 포스터에서 붙일 자리 고르기 → 자리에 핵심 낱말이 켜짐. */
  const igSpots = {
    old: { pre: 'could never', post: '' },
    compartment: { pre: '', post: 'compartments' },
    lifeboat: { pre: 'room for', post: 'of people' },
    new: { pre: 'not supported by', post: '' }
  };
  const igMiss = {};
  function mindMapCardCorrect(slotId) {
    const card = mindMapCards.find(item => item.id === state.mindMapPlacements[slotId]);
    return Boolean(card && card.target === slotId && normalizeMindMapWord(state.mindMapAnswers[card.id]) === card.answer.toLowerCase());
  }
  function mindMapAllCorrect() { return mindMapCards.every(card => mindMapCardCorrect(card.target)); }
  function igCurrentCard() { return mindMapCards.find(card => state.mindMapPlacements[card.target] !== card.id) || null; }
  function igWordDone(card) { return Boolean((state.mindMapConfirmed || {})[card.id] || state.mindMapPlacements[card.target] === card.id) && normalizeMindMapWord(state.mindMapAnswers[card.id]) === card.answer.toLowerCase(); }
  function igRespond(correct, step, card, value) {
    state.mindMapAttempts += 1;
    signals.respond('information-mindmap', 'map-check', { correct, step, card: card ? card.id : '', value, cardOld: mindMapCardCorrect('old'), cardCompartment: mindMapCardCorrect('compartment'), cardLifeboat: mindMapCardCorrect('lifeboat'), cardNew: mindMapCardCorrect('new'), measureId: 'case.organize' });
  }
  function igFeedback(text, tone) { byId('mindmapFeedback').textContent = text; byId('mindmapFeedback').className = `mindmap-feedback${tone ? ' ' + tone : ''}`; }
  function renderMindMap() {
    if (!state.mindMapSolved) signals.ready('information-mindmap', 'map-check', { textNode: byId('igCard'), attempts: state.mindMapAttempts, measureId: 'case.organize' });
    const card = igCurrentCard();
    const doneCount = mindMapCards.filter(c => state.mindMapPlacements[c.target] === c.id).length;
    byId('mindmapCounter').innerHTML = mindMapCards.map((c, i) => `<i class="${state.mindMapPlacements[c.target] === c.id ? 'on' : ''}${card && c.id === card.id ? ' now' : ''}"></i>`).join('');
    document.querySelectorAll('[data-map-slot]').forEach(spot => {
      const slotId = spot.dataset.mapSlot;
      const placed = mindMapCards.find(c => c.target === slotId && state.mindMapPlacements[slotId] === c.id);
      spot.classList.toggle('filled', Boolean(placed));
      spot.classList.toggle('ready', Boolean(card && igWordDone(card) && !placed));
      const sp = igSpots[slotId];
      spot.querySelector('b').innerHTML = placed ? `${sp.pre ? '<em>' + sp.pre + '</em>' : ''}${placed.answer.toUpperCase()}${sp.post ? '<em>' + sp.post + '</em>' : ''}` : '';
      spot.setAttribute('aria-label', `${spot.querySelector('small').textContent}${placed ? ': ' + [sp.pre, placed.answer, sp.post].filter(Boolean).join(' ') : ''}`);
    });
    const sentence = byId('igSentence'), actions = byId('igActions'), cardEl = byId('igCard');
    sentence.replaceChildren(); actions.replaceChildren();
    if (!card) {
      state.mindMapSolved = true;
      byId('igCardStep').textContent = 'INFOGRAPHIC COMPLETE';
      sentence.textContent = 'All four facts are on the poster.';
      cardEl.className = 'ig-card done';
      byId('mindmapHintButton').hidden = true;
      byId('igHintChips').hidden = true;
      byId('mindmapContinueButton').hidden = false;
      igFeedback('포스터 완성! 이 그림을 보며 사건을 설명해요.', 'success');
      return;
    }
    byId('mindmapContinueButton').hidden = true;
    byId('mindmapHintButton').hidden = false;
    byId('igCardStep').textContent = `CARD ${doneCount + 1} / ${mindMapCards.length}`;
    const wordDone = igWordDone(card);
    cardEl.className = 'ig-card' + (wordDone ? ' word-done' : '');
    sentence.append(document.createTextNode(card.before));
    if (wordDone) {
      const mark = document.createElement('mark'); mark.textContent = card.answer; sentence.append(mark);
    } else {
      const input = document.createElement('input');
      input.type = 'text'; input.className = 'mindmap-cloze'; input.dataset.mapInput = card.id;
      input.value = state.mindMapAnswers[card.id] || ''; input.maxLength = 12; input.size = Math.max(5, card.answer.length + 1);
      input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('aria-label', 'missing word');
      sentence.append(input);
    }
    sentence.append(document.createTextNode(card.after));
    if (!wordDone) {
      const ok = document.createElement('button');
      ok.type = 'button'; ok.className = 'primary-action ig-ok'; ok.id = 'igWordCheck'; ok.textContent = '✓ 확인';
      actions.append(ok);
      igFeedback(igMiss[card.id + ':word'] ? '글자를 하나씩 다시 봐요.' : '빈칸에 들어갈 낱말 하나를 써요.', igMiss[card.id + ':word'] ? 'attention' : '');
    } else {
      const pick = document.createElement('p'); pick.className = 'ig-pick'; pick.textContent = '👉 포스터에서 이 카드를 붙일 자리를 눌러요.';
      actions.append(pick);
      igFeedback(igMiss[card.id + ':place'] ? '그 자리는 다른 정보예요. 카드를 한 번 더 읽어 봐요.' : '', igMiss[card.id + ':place'] ? 'attention' : '');
    }
    signals.decorate([byId('igWordCheck')].filter(Boolean), 'information-mindmap', 'map-check', () => igWordDone(card) || normalizeMindMapWord(state.mindMapAnswers[card.id]) === card.answer.toLowerCase());
  }
  function handleMindMapInput(event) {
    const input = event.target.closest('[data-map-input]');
    if (!input) return;
    state.mindMapAnswers[input.dataset.mapInput] = input.value;
    if (state.mindMapConfirmed) delete state.mindMapConfirmed[input.dataset.mapInput];
    saveState();
  }
  function igCheckWord() {
    const card = igCurrentCard();
    if (!card || igWordDone(card)) return;
    state.mindMapConfirmed = state.mindMapConfirmed || {};
    const value = normalizeMindMapWord(state.mindMapAnswers[card.id]);
    if (!value) { byId('igSentence').querySelector('input')?.focus(); return; }
    const correct = value === card.answer.toLowerCase();
    igRespond(correct, 'word', card, value);
    if (!correct) {
      igMiss[card.id + ':word'] = (igMiss[card.id + ':word'] || 0) + 1;
      const c = byId('igCard'); c.classList.remove('miss'); void c.offsetWidth; c.classList.add('miss');
      igFeedback(igMiss[card.id + ':word'] >= 2 ? '「💡 낱말 힌트」를 눌러 봐도 좋아요.' : '글자를 하나씩 다시 봐요.', 'attention');
      saveState();
      return;
    }
    state.mindMapConfirmed[card.id] = true;
    renderMindMap(); updateHeader(); saveState();
  }
  function handleMindMapSlot(event) {
    const spot = event.target.closest('[data-map-slot]');
    if (!spot) return;
    const slotId = spot.dataset.mapSlot;
    const card = igCurrentCard();
    const placed = mindMapCards.find(c => c.target === slotId && state.mindMapPlacements[slotId] === c.id);
    if (placed) { igFeedback(`${placed.before}${placed.answer}${placed.after}`, ''); return; }
    if (!card) return;
    if (!igWordDone(card)) { igFeedback('먼저 빈칸 낱말을 써요.', 'attention'); return; }
    const correct = card.target === slotId;
    igRespond(correct, 'place', card, slotId);
    if (!correct) {
      igMiss[card.id + ':place'] = (igMiss[card.id + ':place'] || 0) + 1;
      spot.classList.remove('miss'); void spot.offsetWidth; spot.classList.add('miss');
      igFeedback('그 자리는 다른 정보예요. 카드를 한 번 더 읽어 봐요.', 'attention');
      saveState();
      return;
    }
    state.mindMapPlacements[slotId] = card.id;
    spot.classList.add('pop');
    setTimeout(() => spot.classList.remove('pop'), 600);
    if (!igCurrentCard()) { state.mindMapSolved = true; signals.log('map-complete', { activityId: 'information-mindmap', itemId: 'map-check', attempts: state.mindMapAttempts }); }
    renderMindMap(); updateHeader(); saveState();
    if (!state.mindMapSolved) setTimeout(() => byId('igSentence').querySelector('input')?.focus(), 50);
  }
  function igShowHint() {
    signals.hint('information-mindmap', 'map-check', { helpLevel: 'A2', helpType: 'word-hint', trigger: 'child-request' });
    const box = byId('igHintChips');
    box.innerHTML = mindMapCards.map(c => `<span class="${state.mindMapPlacements[c.target] === c.id ? 'used' : ''}">${c.answer}</span>`).join('');
    box.hidden = false;
  }
  function resetMindMap() {
    signals.log('reset', { activityId: 'information-mindmap', itemId: 'map-check', attemptsSoFar: state.mindMapAttempts });
    state.mindMapPlacements = {};
    state.mindMapAnswers = {};
    state.mindMapConfirmed = {};
    state.selectedMindMapCard = '';
    state.mindMapSolved = false;
    renderMindMap();
    updateHeader();
    saveState();
  }


  function renderRetell() {
    signals.ready('retell', 'retell', { textNode: byId('retellScreen'), measureId: 'case.retell' });
    byId('retellInput').value = state.retell;
    byId('retellCount').textContent = `${state.retell.length} / 360`;
    byId('retellSupport').hidden = !state.retellHint;
    byId('finishButton').disabled = state.retell.trim().length < 24;
    const notes = orderedNotes();
    const keys = mindMapCards.filter(c => state.mindMapPlacements[c.target] === c.id).map(c => c.answer.toUpperCase());
    byId('retellEvidence').innerHTML = (notes.length ? notes.map(note => `<div>${escapeHtml(note)}</div>`).join('') : '<p class="evidence-empty">3번 기억 금고를 열면 여기에 노트가 모여요.</p>')
      + (keys.length ? `<small class="evidence-keys-label">INFOGRAPHIC KEY WORDS</small><div class="evidence-keys">${keys.map(k => `<span>${escapeHtml(k)}</span>`).join('')}</div>` : '');
  }
  function handleRetellInput() {
    const wasEmpty = !state.retell.trim();
    state.retell = byId('retellInput').value;
    if (wasEmpty && state.retell.trim()) signals.log('retell-first-input', { activityId: 'retell', itemId: 'retell', sinceReadyMs: signals.sinceReadyMs('retell', 'retell') });
    byId('retellCount').textContent = `${state.retell.length} / 360`;
    byId('finishButton').disabled = state.retell.trim().length < 24;
    byId('retellFeedback').textContent = state.retell.trim().length < 24 ? '세 증거 중 하나를 넣어 설명을 조금 더 이어 보세요.' : '좋아요. 설명에 안전 증거가 들어 있는지 한 번 확인해 보세요.';
    saveState(); updateCoachPanel();
  }
  function toggleRetellHint() {
    state.retellHint = !state.retellHint;
    if (state.retellHint) signals.hint('retell', 'retell', { helpLevel: 'A2', helpType: 'sentence-frame', trigger: 'child-request' });
    renderRetell(); saveState();
  }
  function finishRetell() {
    const text = state.retell.trim();
    if (text.length < 24) return;
    const words = text.split(/\s+/).filter(Boolean).length;
    signals.log('retell-text', { activityId: 'retell', itemId: 'retell', text, chars: text.length, words, sentences: (text.match(/[.!?]+/g) || []).length, accuracy: 'notApplicable', hintUsed: state.retellHint, evidenceMentioned: ['compartment', 'lifeboat', 'four', 'half', 'sink', 'evidence'].filter(key => text.toLowerCase().includes(key)).join(',') });
    signals.fire(byId('retellDoneMarker'));
    signals.activityComplete('retell', { chars: text.length, words });
    signals.lessonComplete(Object.assign({ retellChars: text.length }, caseVocab?.stats?.() || {}));
    showScreen('solved');
  }
  function updateWordBank() {
    byId('wordCount').textContent = state.openedWords.length;
    if (byId('wordTotal')) byId('wordTotal').textContent = words.length;
    const openedItems = words.filter(item => state.openedWords.includes(item.word));
    byId('wordList').innerHTML = openedItems.length
      ? openedItems.map(item => {
        const meaningKo = item.meaning.split('·').pop().trim();
        return `<article><strong>${item.word}</strong><span>${meaningKo}</span><span>${item.example}</span></article>`;
      }).join('')
      : '<article class="locked"><strong>NO WORDS YET</strong><span>사건 파일에서 파란 단어를 누르면 여기에 저장됩니다.</span></article>';
  }

  function renderCoachParticipants(map) { window.OncuvateLiveMirror?.renderList(byId('coachParticipants'), map, 1); renderCrewBoard(map); }
  /* 그룹 수업(코치 1 + 아이 4명 안팎): 각자 기기에서 푼 금고 보석을 코치 화면의 「크루 보드」에 모아 팀 보물로 보여 준다.
     순위는 매기지 않는다 — 합계가 배 게이지를 채우는 협동형. 화면 공유로 아이들에게 그대로 보여 줘도 된다. */
  function renderCrewBoard(map) {
    const rowsEl = byId('crewRows'), teamEl = byId('crewTeam');
    if (!rowsEl || !teamEl) return;
    const crew = Object.keys(map || {}).map(key => [key, map[key]]).filter(pair => pair[1] && typeof pair[1] === 'object')
      .sort((a, b) => String(a[1].child || a[0]).localeCompare(String(b[1].child || b[0])));
    if (!crew.length) { teamEl.innerHTML = '<p>수업방이 열리면 학생별 보석이 여기 모여요.</p>'; rowsEl.innerHTML = ''; return; }
    const stageLabel = { search: '🔍 단서 찾는 중', diving: '🫧 잠수 중 (말 걸지 않기)', vault: '🔐 다이얼 맞추는 중', boss: '👾 가짜 기록 추적 중', 'boss-cleared': '🏴‍☠️ 미션 완료' };
    let gems = 0, memory = 0, bosses = 0;
    rowsEl.innerHTML = crew.map(([key, p]) => {
      const v = p.vault || {};
      const m = Number(v.memory) || 0, d = Number(v.detective) || 0;
      gems += m + d; memory += m; if (v.boss) bosses += 1;
      const slots = '💎'.repeat(m) + '🔎'.repeat(d) + '<i>🔒</i>'.repeat(Math.max(0, 3 - m - d));
      const extra = [v.combo >= 2 ? `🔥×${v.combo}` : '', v.bare ? '🏆 맨기억' : '', v.peeks ? `살짝 보기 ${v.peeks}` : '', v.flips ? `카드 뒤집기 ${v.flips}` : ''].filter(Boolean).join(' · ');
      return `<li class="${v.boss ? 'done' : ''}${v.diving ? ' diving' : ''}"><b>${escapeHtml(p.child || key)}</b><span class="crew-gems">${slots}${v.boss ? ' 🏴‍☠️' : ''}</span><small>${stageLabel[v.stage] || escapeHtml(p.screenLabel || '')}${extra ? ' · ' + extra : ''}</small></li>`;
    }).join('');
    const goal = crew.length * 3;
    const pct = Math.round((gems / goal) * 100);
    const cheer = bosses === crew.length ? '🎉 모든 크루가 가짜 기록을 잡았어요! 선장 칭호 획득'
      : gems === goal ? '⚓ 팀 금고 전부 열림! 이제 다 같이 가짜 기록을 잡아요'
      : gems >= Math.ceil(goal / 2) ? '🚢 절반 넘게 모았어요. 배가 출항 준비를 해요'
      : '🧭 크루 모두의 보석이 배를 움직여요';
    teamEl.innerHTML = `<div class="crew-ship"><span style="width:${pct}%"></span><em aria-hidden="true" style="left:${Math.min(94, pct)}%">🚢</em></div><p><b>팀 보물 ${gems} / ${goal}</b> · 기억 보석 ${memory} · 보스 ${bosses}/${crew.length}</p><p class="crew-cheer">${cheer}</p>`;
  }
  function updateCoachPanel() {
    if (!isCoach) return;
    byId('coachCurrentScreen').textContent = screenLabels[state.screen];
    byId('coachCurrentGoal').textContent = screenGoals[state.screen];
    const notes = orderedNotes();
    byId('coachEvidenceList').innerHTML = notes.length ? notes.map(note => `<li>${escapeHtml(note)}</li>`).join('') : '<li>아직 체크한 정보가 없습니다.</li>';
    const monitoring = byId('coachMonitoringList');
    if (monitoring && state.wordHunt) {
      const wh = state.wordHunt;
      const findLabels = { accurate: '단서 없이 발견', 'self-corrected': '스스로 고쳐 발견', support: '답 제시 후' };
      const fixLabels = { accurate: '수정 ✓', 'self-corrected': '수정 ✓ (재시도)', support: '수정 제시' };
      const rows = wordHuntItems.map((item, index) => {
        const find = wh.findAccuracy[item.id];
        if (!find && !(wh.attempts[item.id] > 0)) return null;
        const parts = [find ? findLabels[find] : `찾는 중 · ${wh.attempts[item.id]}회`];
        if (wh.hinted[item.id]) parts.push(wh.hinted[item.id] === 'manual' ? '좁히기 요청' : '좁히기 자동');
        if (wh.meaningShown[item.id]) parts.push('뜻 제시');
        if (wh.fixAccuracy[item.id]) parts.push(fixLabels[wh.fixAccuracy[item.id]]);
        if (wh.listens[item.id]) parts.push(`듣기 ${wh.listens[item.id]}${wh.slowListens[item.id] ? ` (천천히 ${wh.slowListens[item.id]})` : ''}`);
        else if (wh.attempts[item.id]) parts.push('듣지 않고 누름');
        return `<li><b>${index + 1}</b> ${parts.join(' · ')}</li>`;
      }).filter(Boolean);
      const counts = monitoringCounts();
      const done = wordHuntItems.filter(item => wh.done[item.id]).length;
      monitoring.innerHTML = (done ? `<li><b>합계</b> ${done}/6 · 단서 없이 발견 ${counts.spontaneousDetections} · 발견+수정 ${counts.detectedCorrected} · 단서 후 수정 ${counts.cuedCorrected}</li>` : '') + (rows.length ? rows.join('') : '<li>아직 시작하지 않았습니다.</li>');
    }
  }
  function buildCoachNavigation() {
    byId('coachNav').innerHTML = screenOrder.map(name => `<button type="button" data-coach-screen="${name}">${screenLabels[name]}</button>`).join('');
    byId('coachNav').addEventListener('click', event => {
      const button = event.target.closest('[data-coach-screen]');
      if (button) showScreen(button.dataset.coachScreen);
    });
  }
  function restoreDomState() {
    decorateGoal();
    if (state.goalSolved) {
      const button = document.querySelector('[data-goal="conflict"]');
      button.classList.add('selected', 'correct');
      setGoalFeedback('Good. Find one record that does not match the evidence.', '좋아요. 증거와 맞지 않는 기록 하나를 찾습니다.', 'feedback-line success');
      byId('goalContinueButton').disabled = false;
    }
    updateWordBank();
  }

  const menuKey = 'titanic-voyage:menu-collapsed';
  function applyMenuCollapsed(collapsed) {
    document.body.classList.toggle('menu-collapsed', collapsed);
    const toggle = byId('menuToggle');
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? '메뉴 펼치기' : '메뉴 접기');
    toggle.querySelector('i').textContent = collapsed ? '›' : '‹';
    toggle.querySelector('span').textContent = collapsed ? '펼치기' : '메뉴 접기';
  }
  byId('menuToggle')?.addEventListener('click', () => {
    const collapsed = !document.body.classList.contains('menu-collapsed');
    try { sessionStorage.setItem(menuKey, collapsed ? '1' : ''); } catch (_) { /* optional */ }
    applyMenuCollapsed(collapsed);
    signals.log('menu-toggle', { collapsed });
  });
  try { applyMenuCollapsed(sessionStorage.getItem(menuKey) === '1'); } catch (_) { applyMenuCollapsed(false); }
  let helpResetTimer = 0;
  byId('helpButton')?.addEventListener('click', () => {
    const button = byId('helpButton');
    state.helpRequestedAt = Date.now();
    state.helpRequests = (state.helpRequests || 0) + 1;
    const activityId = screenActivity[state.screen] || state.screen;
    signals.hint(activityId, '', { helpType: 'child-request', trigger: 'child-request', screenName: state.screen });
    signals.log('help-request', { activityId, screenName: state.screen, requestNo: state.helpRequests, room: Boolean(runtime.room) });
    saveState();
    button.textContent = runtime.room ? '코치에게 알렸어요 ✓' : '도움 요청을 남겼어요 ✓';
    button.disabled = true;
    clearTimeout(helpResetTimer);
    helpResetTimer = setTimeout(() => { button.innerHTML = '<span aria-hidden="true">🙋</span> 도와주세요'; button.disabled = false; }, 4000);
  });
  byId('homeButton').addEventListener('click', handleHome);
  byId('lessonMenu').addEventListener('click', handleMenuNavigation);
  byId('startButton').addEventListener('click', () => { state.startedAt = performance.now(); signals.startLesson(); showScreen('case'); });
  byId('caseNextButton').addEventListener('click', handleCaseNext);
  byId('goalChoices').addEventListener('click', handleGoal);
  byId('goalTranslateButton').addEventListener('pointerdown', showGoalKorean);
  byId('goalTranslateButton').addEventListener('pointerup', hideGoalKorean);
  byId('goalTranslateButton').addEventListener('pointercancel', hideGoalKorean);
  byId('goalTranslateButton').addEventListener('lostpointercapture', hideGoalKorean);
  byId('goalTranslateButton').addEventListener('keydown', handleGoalTranslationKeyDown);
  byId('goalTranslateButton').addEventListener('keyup', handleGoalTranslationKeyUp);
  byId('goalTranslateButton').addEventListener('blur', hideGoalKorean);
  byId('goalTranslateButton').addEventListener('contextmenu', event => event.preventDefault());
  byId('goalContinueButton').addEventListener('click', () => { signals.activityComplete('goal'); showScreen('search'); });
  byId('focusGuideReplay').addEventListener('click', () => signals.hint(screenActivity[state.screen] || state.screen, '', { helpLevel: 'A1', helpType: 'guide-replay', trigger: 'child-request' }));
  byId('startSearchButton').addEventListener('click', startSearch);
  byId('searchBriefDialog').addEventListener('cancel', event => event.preventDefault());
  byId('hiddenObjectMap').addEventListener('click', handleClueClick);
  byId('clueDialogAction').addEventListener('click', closeClueDialog);
  byId('clueDialog').addEventListener('cancel', event => event.preventDefault());
  byId('memoryRows').addEventListener('click', handleMemorySheet);
  byId('reviewActiveClueButton').addEventListener('click', () => {
    if (!state.activeClue || diveTimer) return;
    peekClue(state.activeClue, 'active-clue');
  });
  byId('sheetNextButton').addEventListener('click', nextSearchStep);
  byId('judgeRow').addEventListener('click', handleJudge);
  byId('gemPeekRow').addEventListener('click', handleGemPeek);
  byId('recordNextButton').addEventListener('click', nextRecord);
  document.addEventListener('keydown', deductionKeys);
  byId('deductionContinueButton').addEventListener('click', () => { signals.activityComplete('deduction'); showScreen('reading'); });
  byId('sentenceNextButton').addEventListener('click', nextSentence);
  byId('readingLevelButton').addEventListener('click', toggleReadingLevel);
  byId('readingContinueButton').addEventListener('click', () => { signals.activityComplete('information-reading', { level: state.readingLevel, rereadCount: state.readingRereads, selfCheck: state.readingSelfCheck || undefined, discourseType: 'expository' }); showScreen('wordhunt'); });
  byId('readingSelfCheck').addEventListener('click', handleReadingSelfCheck);
  byId('soundhuntPlayButton').addEventListener('click', () => soundHuntListen(false));
  byId('soundhuntSlowButton').addEventListener('click', () => soundHuntListen(true));
  byId('wordhuntSentence').addEventListener('click', handleWordHuntWord);
  byId('wordhuntChoices').addEventListener('click', handleWordHuntChoice);
  byId('wordhuntHintButton').addEventListener('click', wordHuntHint);
  byId('wordhuntNextButton').addEventListener('click', wordHuntNext);
  byId('wordhuntContinueButton').addEventListener('click', () => showScreen('spelling'));
  byId('spellingTrack').addEventListener('click', jellySteer);
  document.addEventListener('keydown', jellyKeys);
  document.addEventListener('keyup', jellyKeysUp);
  document.addEventListener('visibilitychange', () => { if (document.hidden) jellyPause(); });
  byId('spellingHintButton').addEventListener('click', spellingHint);
  byId('spellingNextButton').addEventListener('click', spellingNext);
  byId('spellingContinueButton').addEventListener('click', () => showScreen('mindmap'));
  byId('igCard').addEventListener('input', handleMindMapInput);
  byId('igCard').addEventListener('click', event => { if (event.target.closest('#igWordCheck')) igCheckWord(); });
  byId('igCard').addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.closest('[data-map-input]')) { event.preventDefault(); igCheckWord(); } });
  byId('igPoster').addEventListener('click', handleMindMapSlot);
  byId('mindmapHintButton').addEventListener('click', igShowHint);
  byId('mindmapHintClose').addEventListener('click', () => byId('mindmapHintDialog').close());
  byId('mindmapContinueButton').addEventListener('click', () => { signals.activityComplete('information-mindmap', { attempts: state.mindMapAttempts }); showScreen('retell'); });
  byId('retellInput').addEventListener('input', handleRetellInput);
  byId('retellHintButton').addEventListener('click', toggleRetellHint);
  byId('finishButton').addEventListener('click', finishRetell);
  byId('restartButton').addEventListener('click', () => { signals.log('restart', {}); try { sessionStorage.removeItem(storageKey); } catch (_) { /* optional */ } location.reload(); });
  byId('wordBankButton').addEventListener('click', () => byId('wordBankDialog').showModal());
  byId('coachPanelToggle').addEventListener('click', event => {
    const collapsed = document.body.classList.toggle('coach-collapsed');
    event.currentTarget.textContent = collapsed ? '‹' : '×';
    event.currentTarget.setAttribute('aria-expanded', String(!collapsed));
    event.currentTarget.setAttribute('aria-label', collapsed ? '코치 패널 펼치기' : '코치 패널 접기');
  });

  setWatermark();
  const liveMirror = window.OncuvateLiveMirror?.create({
    sessionNo: 1,
    snapshot: buildProgressSnapshot,
    onParticipants: renderCoachParticipants,
    onStatus(text) { const el = byId('coachLiveStatus'); if (el) el.textContent = text; }
  });
  if (isCoach) {
    byId('coachPanel').hidden = false;
    document.body.classList.add('coach-role');
    byId('coachPanelToggle').setAttribute('aria-expanded', 'true');
    buildCoachNavigation();
  }
  restoreDomState();
  applyGoalLanguage(false);
  showScreen(state.screen || 'start', { skipSave: true });
}());










