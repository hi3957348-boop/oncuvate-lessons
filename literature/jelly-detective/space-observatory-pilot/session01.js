(function () {
  'use strict';

  const runtime = window.ONCUVATE || {};
  const requestedRole = new URLSearchParams(window.location.search).get('pilotRole');
  if (!runtime.role && requestedRole === 'coach') runtime.role = requestedRole;
  const isCoach = runtime.role === 'coach';
  const signals = window.OncuvateCaseSignals?.create({ sessionNo: 1, lessonId: 'space-observatory' })
    || { log() {}, enterScreen() {}, startLesson() {}, ready() { return {}; }, respond() { return { attemptNo: 1 }; }, hint() {}, close() {}, activityComplete() {}, lessonComplete() {}, decorate() {}, decorateLater() {}, fire(el) { el?.click(); }, textLength() { return 0; }, item() { return { attempts: 0 }; }, sinceReadyMs() { return undefined; } };
  const storageKey = 'space-observatory:s01:state:v3';
  const screenOrder = ['start', 'case', 'goal', 'search', 'deduction', 'reading', 'wordhunt', 'mindmap', 'retell', 'solved'];
  const screenActivity = { goal: 'goal', search: 'clue-notes', deduction: 'deduction', reading: 'information-reading', wordhunt: 'sound-alike-words', mindmap: 'information-mindmap', retell: 'retell' };
  const screenLabels = {
    start: '준비', case: '사건파일', goal: '목표 찾기', search: '단서 수색',
    deduction: '기록 판별', reading: '정보글 읽기', wordhunt: '소리 닮은 말', mindmap: '마인드맵', retell: '다시 설명하기', solved: '사건 해결'
  };
  const screenGoals = {
    start: '사건 파일을 열어요',
    case: '사건 정보를 한 문장씩 확인해요',
    goal: '오늘 해결할 문제 하나를 골라요',
    search: '숨은 단서를 찾고 중요한 정보만 남겨요',
    deduction: '세 정보와 기록을 다시 맞춰 봐요',
    reading: '증거가 생각을 바꾼 과정을 읽어요',
    wordhunt: '소리가 비슷한 틀린 낱말을 찾아 고쳐요',
    mindmap: '정보의 관계를 마인드맵으로 연결해요',
    retell: '증거를 사용해 내 말로 설명해요',
    solved: '오늘 사용한 방법을 기억해요'
  };
  const caseLines = [
    {
      label: "INCIDENT REPORT · 9:20 P.M.",
      text: "At 9:20 P.M., the sky model in the observatory restarted by itself. When the lights came back, the record showed everything in space moving around Earth.",
      next: "다음 사건 기록"
    },
    {
      label: "MISSING EVIDENCE",
      text: "The room went dark during the restart. Three printed observation cards are now missing from the evidence tray.",
      next: "마지막 사건 기록"
    },
    {
      label: "UNRESOLVED QUESTION",
      text: "An old archive card makes this claim: Every object in space travels around Earth. Is the archive correct, or did the model restore a mistaken idea?",
      next: "해결 목표 정하기"
    }
  ];
  const clues = [
    {
      id: 'jupiter', title: 'Jupiter Track', symbol: 'jupiter',
      sentence: 'Four of Jupiter’s moons travel around the planet. Their positions change from night to night.',
      correct: 'Jupiter’s moons travel around Jupiter.',
      options: ['Jupiter travels around Earth.', 'Jupiter’s moons travel around Jupiter.', 'All stars disappeared.'],
      reviewPrompt: 'What do Jupiter’s four moons move around?', wordUnlock: 2
    },
    {
      id: 'venus', title: 'Venus Record', symbol: 'venus',
      sentence: 'Venus appears as a crescent, then half lit, and later nearly full.',
      correct: 'Venus changes its lit shape.',
      options: ['Venus never changes.', 'Venus changes its lit shape.', 'Venus is one of Earth’s moons.'],
      reviewPrompt: 'How did the lit part of Venus change?', wordUnlock: 3
    },
    {
      id: 'orbit', title: 'Orbit Model', symbol: 'orbit',
      sentence: 'The model shows Earth moving around the Sun while the Moon moves around Earth.',
      correct: 'Earth circles the Sun.',
      options: ['The Sun circles Earth.', 'Earth circles the Sun.', 'The Moon circles the Sun alone.'],
      reviewPrompt: 'What does Earth move around?', wordUnlock: 4
    }
  ];
  const readingTexts = {
    easy: [
      'Long ago, many people thought Earth was at the center of everything.',
      'Astronomers later used telescopes and careful records to test that idea.',
      'They saw moons moving around Jupiter.',
      'They also saw that Venus seemed to change shape.',
      'This new evidence showed that not everything in space moves around Earth.',
      'Today, we know that Earth and the other planets move around the Sun.'
    ],
    challenge: [
      'Long ago, many people believed Earth stood at the center of everything in the sky.',
      'Later, astronomers used telescopes and careful observations to test that model.',
      'They saw moons orbiting Jupiter and watched the lit shape of Venus change over time.',
      'Those observations showed that not every object in space travels around Earth.',
      'Today we know that Earth and the other planets orbit the Sun, while the Moon orbits Earth.'
    ]
  };
  const words = [
    { word: "observatory", meaning: "a building used to study the sky · 관측소 : 하늘과 우주를 관찰하는 시설", example: "The astronomer studied Jupiter from the observatory.", forms: ["observatory", "observatories"], read: "ob·ser·va·to·ry [업저버토리]" },
    { word: "observe", meaning: "to watch carefully · 관찰하다 : 어떤 대상이나 현상을 자세히 살펴보다", example: "Astronomers observe the sky through a telescope.", forms: ["observe", "observes", "observed", "observation", "observations"], read: "ob·serve [업저브]" },
    { word: "record", meaning: "information saved for later · 기록 : 나중에 확인할 수 있도록 남겨 둔 정보", example: "The astronomer wrote each observation in the record.", forms: ["record", "records", "recorded"], read: "re·cord [레코드]" },
    { word: "orbit", meaning: "to move around another object · 공전하다 : 한 천체가 다른 천체의 둘레를 돌다", example: "Earth and the other planets orbit the Sun.", forms: ["orbit", "orbits", "orbited", "orbiting"], read: "or·bit [오빗]" },
    { word: "evidence", meaning: "a fact that helps us decide · 근거 : 어떤 판단이 맞는지 확인하는 데 도움이 되는 사실", example: "The changing shape of Venus was important evidence.", forms: ["evidence"], read: "ev·i·dence [에비던스]" },
    { word: "archive", meaning: "a place or collection that keeps old records · 기록 보관소 : 오래된 기록을 모아 보관하는 곳", example: "The team found an old sky record in the archive.", forms: ["archive", "archives"], read: "ar·chive [아카이브] · ch가 「ㅋ」" },
    { word: "claim", meaning: "a statement said to be true · 주장 : 사실이라고 내세우는 말", example: "The archive card makes a claim about how objects move.", forms: ["claim", "claims", "claimed"], read: "claim [클레임]" },
    { word: "restore", meaning: "to return something to an earlier state · 복원하다 : 이전의 상태로 되돌리다", example: "The program restored the old sky model.", forms: ["restore", "restores", "restored", "restoring"], read: "re·store [리스토어]" },
    { word: "mistaken", meaning: "based on a wrong idea · 잘못된 : 사실과 다르게 알고 있거나 판단한", example: "The old card contained a mistaken idea.", forms: ["mistaken"], read: "mis·tak·en [미스테이큰]" },
    { word: "astronomer", meaning: "a person who studies stars and planets · 천문학자 : 별과 행성을 연구하는 사람", example: "The astronomer looked at Jupiter every night.", forms: ["astronomer", "astronomers"], read: "as·tron·o·mer [어스트라너머]" },
    { word: "telescope", meaning: "a tool that makes far things look close · 망원경 : 멀리 있는 것을 가깝게 보이게 하는 도구", example: "They looked at the Moon through a telescope.", forms: ["telescope", "telescopes"], read: "tel·e·scope [텔러스코프]" },
    { word: "crescent", meaning: "a thin curved moon shape · 초승달 모양 : 얇고 굽은 달 모양", example: "Venus looked like a crescent.", forms: ["crescent"], read: "cres·cent [크레슨트] · sc는 「ㅅ」" },
    { word: "incident", meaning: "something that happened · 사건 : 일어난 일", example: "The incident report tells what happened at 9:20.", forms: ["incident"], read: "in·ci·dent [인시던트]" },
    { word: "unresolved", meaning: "not yet solved · 아직 풀리지 않은 : 아직 해결되지 않은", example: "One unresolved question is left.", forms: ["unresolved"], read: "un·re·solved [언리잘브드]" },
    { word: "position", meaning: "the place where something is · 위치 : 어떤 것이 있는 자리", example: "The moons change their positions every night.", forms: ["position", "positions"], read: "po·si·tion [퍼지션] · tion은 「션」" },
    { word: "appear", meaning: "to be seen · 보이다 : 눈에 보이게 되다", example: "Venus appears as a crescent.", forms: ["appear", "appears", "appeared"], read: "ap·pear [어피어]" },
    { word: "believe", meaning: "to think something is true · 믿다", example: "People believed Earth stood at the center.", forms: ["believe", "believed"], read: "be·lieve [빌리브] · ie는 「이」" },
    { word: "lit", meaning: "with light on it · 빛을 받은 : light(빛을 비추다)의 과거형", example: "Only the lit side of Venus can be seen.", forms: ["lit"], read: "lit [릿]" }
  ];
  const wordHuntItems = [
    { id: 'wh1', words: ['Four', 'of', 'Jupiter’s', 'moons', 'travel', 'around', 'the', 'plant.'], wrong: 7, decoy: 3, answer: 'planet', choices: ['planet', 'plant', 'plane'], ko: '목성의 위성 네 개는 그 행성 주위를 돌아요.' },
    { id: 'wh2', words: ['Venus', 'changes', 'its', 'lid', 'shape.'], wrong: 3, decoy: 1, answer: 'lit', choices: ['lit', 'lid', 'lip'], ko: '금성은 빛을 받는 모양이 달라져요.' },
    { id: 'wh3', words: ['Earth', 'and', 'the', 'other', 'planets', 'move', 'around', 'the', 'Sum.'], wrong: 8, decoy: 4, answer: 'Sun', choices: ['Sun', 'Sum', 'Son'], ko: '지구와 다른 행성들은 태양 주위를 돌아요.' },
    { id: 'wh4', words: ['Astronomers', 'absorb', 'the', 'sky', 'through', 'a', 'telescope.'], wrong: 1, decoy: 6, answer: 'observe', choices: ['observe', 'absorb', 'reserve'], ko: '천문학자들은 망원경으로 하늘을 관찰해요.' },
    { id: 'wh5', words: ['New', 'evidence', 'changed', 'the', 'old', 'sky', 'medal.'], wrong: 6, decoy: 1, answer: 'model', choices: ['model', 'medal', 'metal'], ko: '새 증거가 옛 하늘 모형을 바꾸었어요.' },
    { id: 'wh6', words: ['The', 'astronomer', 'wrote', 'each', 'observation', 'in', 'the', 'rocket.'], wrong: 7, decoy: 4, answer: 'record', choices: ['record', 'rocket', 'racket'], ko: '천문학자는 관찰한 것을 기록에 적었어요.' }
  ];
  const WORD_HUNT_BLOCK = 3;
  const wordHuntActivity = 'sound-alike-words';
  const wordHuntMeasure = 'case.sound-alike-word';
  const mindMapCards = [
    { id: 'venus', target: 'venus', before: 'Venus ', answer: 'changes', after: ' its lit shape.' },
    { id: 'new', target: 'new', before: 'Earth and the other planets move around the ', answer: 'Sun', after: '.' },
    { id: 'old', target: 'old', before: 'People once thought everything moved around ', answer: 'Earth', after: '.' },
    { id: 'jupiter', target: 'jupiter', before: 'Jupiter’s moons move ', answer: 'around', after: ' Jupiter.' }
  ];

  const defaultState = {
    screen: 'start', caseLine: 0, goalSolved: false, searchPhase: 'map', searchBriefSeen: false,
    found: [], discoveryOrder: [], activeClue: '', notes: {}, noteAttempts: {},
    selectedRecord: '', deductionAttempts: 0, readingLevel: 'easy', sentenceIndex: 0,
    mindMapPlacements: {}, mindMapAnswers: {}, selectedMindMapCard: '', mindMapSolved: false, mindMapAttempts: 0,
    retell: '', retellHint: false, unlockedWords: 1, openedWords: [], startedAt: 0,
    goalAttempts: 0, wordHunt: null, readingRereads: 0, readingSupport: false, readingSelfCheck: '', helpRequestedAt: 0, helpRequests: 0
  };
  const wordHuntDefault = () => ({ index: 0, phase: 'find', attempts: {}, fixAttempts: {}, hinted: {}, meaningShown: {}, revealed: {}, done: {}, rereads: {}, detectMs: {}, findAccuracy: {}, fixAccuracy: {}, complete: false, breakSeen: false });

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
  ['attempts', 'fixAttempts', 'hinted', 'meaningShown', 'revealed', 'done', 'rereads', 'detectMs', 'findAccuracy', 'fixAccuracy'].forEach(key => { if (!state.wordHunt[key] || typeof state.wordHunt[key] !== 'object') state.wordHunt[key] = {}; });
  if (!saved?.mindMapAnswers) {
    state.mindMapPlacements = {};
    state.selectedMindMapCard = '';
  }
  if (mindMapCards.some(card => !String(state.mindMapAnswers[card.id] || '').trim())) state.mindMapSolved = false;
  const screens = Object.fromEntries(screenOrder.map(name => [name, byId(name + 'Screen')]));
  let goalKoreanVisible = false;
  const caseVocab = window.OncuvateCaseVocab?.create({
    words,
    onOpen(word) {
      if (!state.openedWords.includes(word)) state.openedWords.push(word);
      signals.log('word-open', { activityId: screenActivity[state.screen] || state.screen, word });
      updateWordBank(); saveState();
    }
  });
  const focusGuide = window.OncuvateFocusGuide?.create({
    key: storageKey,
    replayButton: 'focusGuideReplay',
    guides: {
      case: [{ en: 'Read one incident record at a time.', ko: '사건 기록을 한 번에 한 문장씩 읽어요.' }],
      goal: [{ en: 'Choose the one question this case must solve.', ko: '이 사건에서 꼭 해결할 질문 하나를 골라요.' }],
      deduction: [
        { en: 'Compare all three clue notes.', ko: '세 단서의 메모를 모두 비교해요.' },
        { en: 'Choose the record that does not fit the evidence.', ko: '증거와 맞지 않는 기록 하나를 골라요.' }
      ],
      reading: [{ en: 'Read one sentence at a time. Watch how new evidence changes an old idea.', ko: '한 문장씩 읽으며 새 증거가 옛 생각을 어떻게 바꾸는지 살펴봐요.' }],
      wordhunt: [
        { en: 'Read the whole sentence first.', ko: '문장을 끝까지 먼저 읽어요.' },
        { en: 'Tap the one word that sounds right but is wrong.', ko: '소리는 맞는 것 같지만 뜻이 틀린 낱말 하나를 눌러요.' }
      ],
      mindmap: [
        { en: 'Complete one card, then place it on the matching branch.', ko: '카드 하나의 빈칸을 채운 뒤 알맞은 가지에 놓아요.' },
        { en: 'Work with one card at a time.', ko: '한 번에는 카드 하나만 다뤄요.' }
      ],
      retell: [
        { en: 'Use the map to explain what people once thought.', ko: '마인드맵을 보며 사람들이 예전에 어떻게 생각했는지 설명해요.' },
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
    if (whDone || Object.keys(wh.attempts).length) parts.push(`소리 닮은 말 ${whDone}/6 · 단서 없이 ${counts.spontaneousDetections} · 답 제시 ${Object.keys(wh.revealed).length}`);
    if (state.mindMapSolved) parts.push('마인드맵 ✓'); else if (state.mindMapAttempts) parts.push(`마인드맵 시도 ${state.mindMapAttempts}`);
    return { screen: state.screen, screenLabel: screenLabels[state.screen] || state.screen, summary: parts.join(' · '), notes: orderedNotes().join(' | '), retell: state.retell.slice(0, 240), done: state.screen === 'solved', sessionNo: 1, helpRequestedAt: state.helpRequestedAt || 0, helpRequests: state.helpRequests || 0 };
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
    if (state.screen === 'deduction' || ['reading', 'wordhunt', 'mindmap', 'retell', 'solved'].includes(state.screen)) active = 'match';
    document.querySelectorAll('[data-strategy-step]').forEach(item => {
      const key = item.dataset.strategyStep;
      item.classList.toggle('active', key === active);
      item.classList.toggle('done', (key === 'find' && state.found.length === 3) || (key === 'note' && Object.keys(state.notes).length === 3) || (key === 'match' && ['reading', 'wordhunt', 'mindmap', 'retell', 'solved'].includes(state.screen)));
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
      ? '그림 속에 보호색 단서 세 개가 숨어 있어요.'
      : state.found.length === 3 ? '단서 세 개를 모두 찾았어요.' : `찾았다! 아직 ${3 - state.found.length}개가 숨어 있어요.`;
    if (sheetMode) renderMemorySheet();
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
  function openClueDialog(id, review) {
    const clue = clueById(id);
    if (!clue) return;
    const discoveryNumber = state.discoveryOrder.indexOf(id) + 1;
    byId('clueDialog').dataset.clueId = id;
    byId('clueDialog').dataset.review = String(review);
    byId('clueDialogKicker').textContent = review ? 'CLUE REVIEW' : `CLUE FOUND · ${discoveryNumber} OF 3`;
    byId('clueDialogTitle').textContent = clue.title;
    if (caseVocab) caseVocab.render(byId('clueDialogText'), clue.sentence); else byId('clueDialogText').textContent = clue.sentence;
    byId('clueDialogSymbol').className = `clue-symbol ${clue.symbol}`;
    byId('clueDialogAction').textContent = review ? (state.searchPhase === 'sheet' ? '시트로 돌아가기' : '탐색으로 돌아가기') : '기억하고 시트 작성하기';
    byId('clueDialog').showModal();
  }
  function closeClueDialog() {
    const dialog = byId('clueDialog');
    const review = dialog.dataset.review === 'true';
    dialog.close();
    if (review) return;
    state.searchPhase = 'sheet';
    renderSearch();
    saveState();
  }

  function renderMemorySheet() {
    const active = clueById(state.activeClue);
    if (!active) return;
    byId('sheetCounter').textContent = `${Object.keys(state.notes).length} / 3 기록`;
    byId('memoryProgress').innerHTML = clues.map((clue, index) => {
      const found = state.found.includes(clue.id);
      const noted = Boolean(state.notes[clue.id]);
      const current = clue.id === state.activeClue;
      return `<div class="${noted ? 'done' : current ? 'current' : found ? 'found' : ''}"><i>${index + 1}</i><span>${noted ? '기록 완료' : current ? '체크 중' : found ? '발견' : '숨은 단서'}</span></div>`;
    }).join('');

    const completed = state.discoveryOrder.filter(id => state.notes[id] && id !== state.activeClue).map(id => {
      const clue = clueById(id);
      return `<article class="memory-row complete"><div><small>CHECKED FACT</small><strong>${escapeHtml(state.notes[id])}</strong></div><button type="button" data-review-clue="${id}" data-track="hint">단서 다시 보기</button></article>`;
    }).join('');
    const choices = active.options.map(option => {
      const selected = state.notes[active.id] === option;
      return `<button type="button" data-memory-note="${escapeHtml(option)}" data-item-id="note-${active.id}" data-correct="${option === active.correct}" data-track="answer" class="${selected ? 'selected correct' : ''}"><i aria-hidden="true"></i><span>${escapeHtml(option)}</span></button>`;
    }).join('');
    byId('memoryRows').innerHTML = `${completed}<article class="memory-row active"><div class="memory-question"><small>CLUE ${state.discoveryOrder.indexOf(active.id) + 1}</small><h3>${escapeHtml(active.reviewPrompt)}</h3><p>단서 문장은 보이지 않아요. 기억나는 핵심 정보에 체크하세요.</p></div><div class="memory-options">${choices}</div></article>`;
    const solved = Boolean(state.notes[active.id]);
    signals.decorate(byId('memoryRows').querySelectorAll('[data-memory-note]'), 'clue-notes', 'note-' + active.id, button => button.dataset.memoryNote === active.correct);
    if (!solved) signals.ready('clue-notes', 'note-' + active.id, { textNode: byId('memoryRows'), attempts: state.noteAttempts[active.id] || 0, measureId: 'case.clue-note' });
    const nextButton = byId('sheetNextButton');
    if (Object.keys(state.notes).length === 3) { nextButton.dataset.track = 'activity-complete'; nextButton.dataset.activityId = 'clue-notes'; }
    else { delete nextButton.dataset.track; delete nextButton.dataset.activityId; }
    byId('sheetFeedback').textContent = solved ? '중요한 정보를 남겼어요. 이제 다음 단서를 찾을 수 있어요.' : '단서 문장을 떠올리며 핵심 정보 하나를 고르세요.';
    byId('sheetFeedback').className = `sheet-feedback${solved ? ' success' : ''}`;
    byId('sheetNextButton').hidden = !solved;
    byId('sheetNextButton').textContent = Object.keys(state.notes).length === 3 ? '세 기록 맞춰 보기' : '다음 단서 찾기';
    byId('reviewActiveClueButton').hidden = false;
  }
  function handleMemorySheet(event) {
    const review = event.target.closest('[data-review-clue]');
    if (review) { signals.hint('clue-notes', 'note-' + state.activeClue, { helpLevel: 'A3', helpType: 'clue-review', reviewedClue: review.dataset.reviewClue }); signals.decorateLater(byId('memoryRows').querySelectorAll('[data-memory-note]'), 'clue-notes', 'note-' + state.activeClue, b => b.dataset.memoryNote === clueById(state.activeClue).correct); openClueDialog(review.dataset.reviewClue, true); return; }
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
      byId('sheetFeedback').textContent = '아직 핵심 정보가 달라요. 잠시 떠올리거나 단서를 다시 보세요.';
      byId('sheetFeedback').className = 'sheet-feedback attention';
      saveState();
      return;
    }
    state.notes[clue.id] = clue.correct;
    button.classList.add('correct');
    renderMemorySheet();
    updateCoachPanel();
    saveState();
  }
  function nextSearchStep() {
    if (!state.notes[state.activeClue]) return;
    if (Object.keys(state.notes).length === 3) { signals.activityComplete('clue-notes'); state.searchPhase = 'map'; state.activeClue = ''; showScreen('deduction'); return; }
    state.searchPhase = 'map';
    state.activeClue = '';
    renderSearch();
    saveState();
  }

  function orderedNotes() { return clues.map(clue => state.notes[clue.id]).filter(Boolean); }
  function renderDeduction() {
    byId('miniEvidenceBoard').innerHTML = orderedNotes().map(note => `<div>${escapeHtml(note)}</div>`).join('');
    document.querySelectorAll('[data-record]').forEach(button => {
      button.classList.remove('selected', 'correct', 'incorrect');
      if (button.dataset.record === state.selectedRecord) button.classList.add('selected', state.selectedRecord === 'old' ? 'correct' : 'incorrect');
    });
    byId('deductionContinueButton').disabled = state.selectedRecord !== 'old';
    signals.decorate(document.querySelectorAll('[data-record]'), 'deduction', 'record', button => button.dataset.record === 'old');
    if (state.selectedRecord !== 'old') signals.ready('deduction', 'record', { textNode: byId('deductionScreen'), attempts: state.deductionAttempts, measureId: 'case.deduction' });
  }
  function handleRecord(event) {
    const button = event.target.closest('[data-record]');
    if (!button) return;
    if (state.selectedRecord === 'old') return;
    state.deductionAttempts += 1;
    signals.respond('deduction', 'record', { correct: button.dataset.record === 'old', value: button.dataset.record, expected: 'old', visibleTextLen: signals.textLength(byId('deductionScreen')), measureId: 'case.deduction' });
    signals.decorateLater(document.querySelectorAll('[data-record]'), 'deduction', 'record', b => b.dataset.record === 'old');
    state.selectedRecord = button.dataset.record;
    document.querySelectorAll('[data-record]').forEach(choice => choice.classList.remove('selected', 'correct', 'incorrect'));
    button.classList.add('selected');
    if (state.selectedRecord !== 'old') {
      button.classList.add('incorrect');
      byId('deductionFeedback').textContent = 'Compare this record with each of the three facts again.';
      byId('deductionFeedback').className = 'feedback-line attention';
      byId('deductionContinueButton').disabled = true;
    } else {
      button.classList.add('correct');
      byId('deductionFeedback').textContent = 'Correct. This record does not match the three observation clues.';
      byId('deductionFeedback').className = 'feedback-line success';
      byId('deductionContinueButton').disabled = false;
    }
    saveState();
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
    const rereadButton = byId('wordhuntRereadButton');
    const nextButton = byId('wordhuntNextButton');
    const continueButton = byId('wordhuntContinueButton');
    updateCoachPanel();
    sentence.classList.remove('is-note');
    choices.hidden = true; choices.replaceChildren();
    meaning.hidden = true; meaning.textContent = '';
    hintButton.hidden = true; rereadButton.hidden = true; nextButton.hidden = true; continueButton.hidden = true;
    byId('wordhuntCounter').textContent = `${Math.min(wh.index + 1, wordHuntItems.length)} / ${wordHuntItems.length}`;
    if (wh.complete) {
      sentence.classList.add('is-note');
      sentence.innerHTML = `<span>여섯 문장의 소리 닮은 말을 모두 고쳤어요!</span><small>소리가 비슷해도 뜻을 보면 가려낼 수 있어요.</small>`;
      byId('wordhuntLead').textContent = '이제 정리한 정보로 마인드맵을 만들어요.';
      wordHuntFeedback('소리가 닮은 말은 문장의 뜻으로 확인해요.', 'success');
      continueButton.hidden = false;
      return;
    }
    if (wh.phase === 'break') {
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
    if (done) {
      byId('wordhuntLead').textContent = '문장이 바르게 되었어요.';
      meaning.hidden = false; meaning.textContent = `뜻: ${item.ko}`;
      wordHuntFeedback(`맞는 낱말: "${item.answer}". 소리가 닮은 말은 뜻으로 가려요.`, 'success');
      nextButton.hidden = false;
      const nextIndex = wh.index + 1;
      nextButton.textContent = nextIndex >= wordHuntItems.length ? '모두 고쳤어요' : (nextIndex % WORD_HUNT_BLOCK === 0 ? '잠깐 쉬기' : '다음 문장');
      return;
    }
    if (fixing) {
      byId('wordhuntLead').textContent = '이 자리에 맞는 낱말을 골라요.';
      rereadButton.hidden = false;
      if (wh.meaningShown[item.id]) { meaning.hidden = false; meaning.textContent = `뜻: ${item.ko}`; }
      choices.hidden = false;
      const label = document.createElement('p');
      label.className = 'wordhunt-fix-label';
      label.textContent = 'WHICH WORD BELONGS HERE?';
      choices.append(label);
      item.choices.forEach(choice => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.word = choice;
        button.textContent = choice;
        choices.append(button);
      });
      signals.decorate(choices.querySelectorAll('[data-word]'), wordHuntActivity, item.id + '-fix', button => button.dataset.word === item.answer);
      signals.ready(wordHuntActivity, item.id + '-fix', { textNode: choices, attempts: wh.fixAttempts[item.id] || 0, measureId: wordHuntMeasure, step: 'fix', discourseType: 'expository', inconsistencyType: 'lexical' });
      if (!byId('wordhuntFeedback').textContent) wordHuntFeedback('세 낱말은 소리가 비슷해요. 문장의 뜻에 맞는 것을 골라요.');
      return;
    }
    byId('wordhuntLead').textContent = '문장에서 소리는 비슷하지만 뜻이 맞지 않는 낱말 하나를 눌러요.';
    hintButton.hidden = false;
    rereadButton.hidden = false;
    hintButton.disabled = hinted;
    hintButton.textContent = hinted ? '두 낱말로 좁혔어요' : '두 낱말로 좁히기';
    signals.decorate(sentence.querySelectorAll('.wordhunt-word'), wordHuntActivity, item.id, chip => Number(chip.dataset.wordIndex) === item.wrong);
    signals.ready(wordHuntActivity, item.id, { textNode: sentence, attempts: wh.attempts[item.id] || 0, measureId: wordHuntMeasure, step: 'find', discourseType: 'expository', inconsistencyType: 'lexical' });
  }
  function paceWords() {
    const chips = [...byId('wordhuntSentence').querySelectorAll('.wordhunt-word')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chips.forEach((chip, index) => {
      chip.classList.remove('pace');
      if (reduce) return;
      setTimeout(() => chip.classList.add('pace'), index * 320);
      setTimeout(() => chip.classList.remove('pace'), index * 320 + 300);
    });
  }
  function wordHuntReread() {
    const wh = state.wordHunt;
    if (wh.complete || wh.phase === 'break' || wh.phase === 'done') return;
    const item = wordHuntItem();
    wh.rereads[item.id] = (wh.rereads[item.id] || 0) + 1;
    signals.hint(wordHuntActivity, wh.phase === 'fix' ? item.id + '-fix' : item.id, { helpLevel: 'A1', helpType: 'reread-pace', cueStage: 1, rereadCount: wh.rereads[item.id], trigger: 'child-request' });
    paceWords();
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
      wordHuntFeedback(`찾았어요! 소리는 비슷하지만 뜻이 안 맞는 낱말: "${splitWord(item.words[item.wrong]).core}". 이제 맞는 낱말을 골라요.`, 'success');
      saveState(); renderWordHunt();
      return;
    }
    byId('wordhuntSentence').querySelectorAll('.wordhunt-word').forEach(other => other.classList.remove('incorrect'));
    chip.classList.add('incorrect');
    if (attempt === 1) {
      wordHuntFeedback('이 낱말은 문장에 잘 맞아요. 소리는 비슷한데 뜻이 이상한 낱말을 찾아 문장을 끝까지 다시 읽어요.', 'attention');
      signals.decorateLater(byId('wordhuntSentence').querySelectorAll('.wordhunt-word'), wordHuntActivity, item.id, c => Number(c.dataset.wordIndex) === item.wrong);
    } else if (attempt === 2) {
      if (!wh.hinted[item.id]) {
        wh.hinted[item.id] = 'auto';
        signals.hint(wordHuntActivity, item.id, { helpLevel: 'A2', helpType: 'auto-narrow', cueStage: 2, trigger: 'second-miss' });
      }
      wordHuntFeedback('두 낱말 중 하나예요. 어느 쪽이 문장의 뜻과 맞지 않나요?', 'attention');
      setTimeout(renderWordHunt, 0);
    } else {
      wh.revealed[item.id] = true;
      wh.findAccuracy[item.id] = 'support';
      signals.hint(wordHuntActivity, item.id, { helpLevel: 'A4', helpType: 'reveal-answer', cueStage: 5, trigger: 'third-miss' });
      signals.close(wordHuntActivity, item.id, { resolution: 'revealed', measureId: wordHuntMeasure });
      wh.phase = 'fix';
      wordHuntFeedback(`함께 볼게요. 뜻에 맞지 않는 낱말: "${splitWord(item.words[item.wrong]).core}". 이제 맞는 낱말을 골라요.`, 'attention');
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
    if (correct) {
      button.classList.add('correct');
      wh.fixAccuracy[item.id] = result.accuracy || 'accurate';
      wh.done[item.id] = true;
      wh.phase = 'done';
      logMonitoringItem(item);
      byId('wordhuntFeedback').textContent = '';
      saveState(); renderWordHunt();
      return;
    }
    button.classList.add('incorrect');
    if (attempt === 1) {
      wordHuntFeedback('소리는 닮았지만 뜻이 달라요. 문장 전체의 뜻을 떠올리며 다시 골라요.', 'attention');
      signals.decorateLater(byId('wordhuntChoices').querySelectorAll('[data-word]'), wordHuntActivity, item.id + '-fix', b => b.dataset.word === item.answer);
    } else if (attempt === 2) {
      wh.meaningShown[item.id] = true;
      signals.hint(wordHuntActivity, item.id + '-fix', { helpLevel: 'A2', helpType: 'meaning-ko', cueStage: 4, trigger: 'second-miss' });
      wordHuntFeedback('문장의 뜻을 한국어로 보여 줄게요. 그 뜻에 맞는 낱말을 골라요.', 'attention');
      setTimeout(renderWordHunt, 0);
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
      wordHuntFeedback(`함께 볼게요. 맞는 낱말: "${item.answer}".`, 'attention');
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
    wordHuntFeedback('두 낱말로 좁혔어요. 어느 쪽이 문장의 뜻과 맞지 않나요?');
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
  function normalizeMindMapWord(value) {
    return String(value || '').trim().toLowerCase().replace(/[.,!?]+$/g, '');
  }
  function buildMindMapLine(container, card) {
    container.replaceChildren();
    container.append(document.createTextNode(card.before));
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'mindmap-cloze';
    input.dataset.mapInput = card.id;
    input.value = state.mindMapAnswers[card.id] || '';
    input.maxLength = 12;
    input.size = Math.max(5, card.answer.length + 1);
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', `${card.id} missing word`);
    container.append(input, document.createTextNode(card.after));
  }
  function updateMindMapProgress() {
    const wordCount = mindMapCards.filter(card => normalizeMindMapWord(state.mindMapAnswers[card.id])).length;
    const placedCount = Object.keys(state.mindMapPlacements).length;
    byId('mindmapCounter').textContent = `${wordCount} / 4 words · ${placedCount} / 4 placed`;
    signals.decorateLater([byId('mindmapCheckButton')], 'information-mindmap', 'map-check', () => mindMapAllCorrect());
    byId('mindmapCheckButton').disabled = wordCount < 4 || placedCount < 4 || state.mindMapSolved;
    byId('mindmapCheckButton').hidden = state.mindMapSolved;
    byId('mindmapContinueButton').hidden = !state.mindMapSolved;
    return { wordCount, placedCount };
  }
  function mindMapCardCorrect(slotId) {
    const card = mindMapCards.find(item => item.id === state.mindMapPlacements[slotId]);
    return Boolean(card && card.target === slotId && normalizeMindMapWord(state.mindMapAnswers[card.id]) === card.answer.toLowerCase());
  }
  function mindMapAllCorrect() { return mindMapCards.every(card => mindMapCardCorrect(card.target)); }
  function renderMindMap() {
    if (!state.mindMapSolved) signals.ready('information-mindmap', 'map-check', { textNode: byId('mindmapScreen'), attempts: state.mindMapAttempts, measureId: 'case.organize' });
    const placements = state.mindMapPlacements;
    const usedCards = new Set(Object.values(placements));
    const availableCards = mindMapCards.filter(card => !usedCards.has(card.id));
    const cardBank = byId('mindmapCards');
    cardBank.replaceChildren();
    availableCards.slice(0, 1).forEach(card => {
      const article = document.createElement('article');
      article.className = 'mindmap-card';
      article.classList.toggle('selected', state.selectedMindMapCard === card.id);
      const line = document.createElement('p');
      buildMindMapLine(line, card);
      const choose = document.createElement('button');
      choose.type = 'button';
      choose.className = 'mindmap-card-pick';
      choose.dataset.mapPick = card.id;
      choose.dataset.tap = 'answer';
      choose.setAttribute('aria-pressed', String(state.selectedMindMapCard === card.id));
      choose.textContent = state.selectedMindMapCard === card.id ? 'Selected — tap a branch' : 'Choose this card';
      article.append(line, choose);
      cardBank.append(article);
    });
    if (!availableCards.length) {
      const empty = document.createElement('p');
      empty.className = 'mindmap-bank-empty';
      empty.textContent = 'All cards are on the map. You can still edit each word there.';
      cardBank.append(empty);
    }
    document.querySelectorAll('[data-map-slot]').forEach(slot => {
      const cardId = placements[slot.dataset.mapSlot];
      const card = mindMapCards.find(item => item.id === cardId);
      const status = slot.querySelector('.mindmap-status');
      const returnButton = slot.querySelector('[data-map-remove]');
      slot.classList.remove('filled', 'ready', 'correct', 'incorrect');
      slot.classList.toggle('filled', Boolean(card));
      slot.classList.toggle('ready', Boolean(state.selectedMindMapCard) && !card);
      slot.classList.toggle('correct', state.mindMapSolved && Boolean(card));
      if (card) buildMindMapLine(slot.querySelector('span'), card);
      else slot.querySelector('span').textContent = 'Place a card';
      status.textContent = state.mindMapSolved && card ? '✓' : '';
      returnButton.hidden = !card || state.mindMapSolved;
      slot.setAttribute('aria-label', card ? `${slot.querySelector('small').textContent}: card placed` : `${slot.querySelector('small').textContent}: empty branch`);
    });
    const progress = updateMindMapProgress();
    const feedback = byId('mindmapFeedback');
    feedback.textContent = state.mindMapSolved
      ? 'The words and connections are correct. Use this map when you explain the case.'
      : progress.wordCount < 4
        ? 'Type one missing word in each card.'
        : progress.placedCount < 4
          ? 'Now choose each card and place it on a matching branch.'
          : 'All cards are complete and placed. Check your map.';
    feedback.className = state.mindMapSolved ? 'mindmap-feedback success' : 'mindmap-feedback';
  }
  function handleMindMapInput(event) {
    const input = event.target.closest('[data-map-input]');
    if (!input) return;
    state.mindMapAnswers[input.dataset.mapInput] = input.value;
    state.mindMapSolved = false;
    const holder = input.closest('.mindmap-slot, .mindmap-card');
    if (holder) holder.classList.remove('correct', 'incorrect');
    if (holder?.querySelector('.mindmap-status')) holder.querySelector('.mindmap-status').textContent = '';
    updateMindMapProgress();
    byId('mindmapFeedback').textContent = 'Keep going. Complete the words and connect all four cards.';
    byId('mindmapFeedback').className = 'mindmap-feedback';
    updateHeader();
    saveState();
  }
  function handleMindMapCard(event) {
    const button = event.target.closest('[data-map-pick]');
    if (!button) return;
    state.selectedMindMapCard = state.selectedMindMapCard === button.dataset.mapPick ? '' : button.dataset.mapPick;
    state.mindMapSolved = false;
    renderMindMap();
    saveState();
  }
  function handleMindMapSlot(event) {
    if (event.target.closest('[data-map-input]')) return;
    const slot = event.target.closest('[data-map-slot]');
    if (!slot) return;
    const slotId = slot.dataset.mapSlot;
    const existing = state.mindMapPlacements[slotId];
    if (event.target.closest('[data-map-remove]') && existing) {
      delete state.mindMapPlacements[slotId];
      state.selectedMindMapCard = existing;
      state.mindMapSolved = false;
    } else if (!existing && state.selectedMindMapCard) {
      state.mindMapPlacements[slotId] = state.selectedMindMapCard;
      state.selectedMindMapCard = '';
      state.mindMapSolved = false;
    } else if (!existing) {
      byId('mindmapFeedback').textContent = 'Choose an information card first.';
      byId('mindmapFeedback').className = 'mindmap-feedback attention';
      return;
    } else {
      return;
    }
    renderMindMap();
    updateHeader();
    saveState();
  }
  function checkMindMap() {
    if (Object.keys(state.mindMapPlacements).length < mindMapCards.length) return;
    state.mindMapAttempts += 1;
    signals.respond('information-mindmap', 'map-check', { correct: mindMapAllCorrect(), value: mindMapCards.map(card => `${card.target}:${state.mindMapPlacements[card.target] || '-'}/${normalizeMindMapWord(state.mindMapAnswers[state.mindMapPlacements[card.target]] || '')}`).join(' '), cardOld: mindMapCardCorrect('old'), cardJupiter: mindMapCardCorrect('jupiter'), cardVenus: mindMapCardCorrect('venus'), cardNew: mindMapCardCorrect('new'), measureId: 'case.organize' });
    signals.decorateLater([byId('mindmapCheckButton')], 'information-mindmap', 'map-check', () => mindMapAllCorrect());
    let wrongCount = 0;
    document.querySelectorAll('[data-map-slot]').forEach(slot => {
      const cardId = state.mindMapPlacements[slot.dataset.mapSlot];
      const card = mindMapCards.find(item => item.id === cardId);
      const wordIsCorrect = card && normalizeMindMapWord(state.mindMapAnswers[card.id]) === card.answer.toLowerCase();
      const branchIsCorrect = card && card.target === slot.dataset.mapSlot;
      const isCorrect = Boolean(wordIsCorrect && branchIsCorrect);
      slot.classList.toggle('correct', isCorrect);
      slot.classList.toggle('incorrect', !isCorrect);
      slot.querySelector('.mindmap-status').textContent = isCorrect ? '✓' : '!';
      if (!isCorrect) wrongCount += 1;
    });
    if (wrongCount) {
      state.mindMapSolved = false;
      byId('mindmapFeedback').textContent = `Check the ${wrongCount} branch${wrongCount === 1 ? '' : 'es'} marked !. Edit a word there, or return the card to move it.`;
      byId('mindmapFeedback').className = 'mindmap-feedback attention';
    } else {
      state.mindMapSolved = true;
      updateMindMapProgress();
      byId('mindmapFeedback').textContent = 'The words and connections are correct. Use this map when you explain the case.';
      byId('mindmapFeedback').className = 'mindmap-feedback success';
      document.querySelectorAll('[data-map-remove]').forEach(button => { button.hidden = true; });
      updateHeader();
    }
    saveState();
  }
  function resetMindMap() {
    signals.log('reset', { activityId: 'information-mindmap', itemId: 'map-check', attemptsSoFar: state.mindMapAttempts });
    state.mindMapPlacements = {};
    state.mindMapAnswers = {};
    state.selectedMindMapCard = '';
    state.mindMapSolved = false;
    renderMindMap();
    updateHeader();
    saveState();
    byId('mindmapCards').querySelector('[data-map-input]')?.focus();
  }

  function renderRetell() {
    signals.ready('retell', 'retell', { textNode: byId('retellScreen'), measureId: 'case.retell' });
    byId('retellInput').value = state.retell;
    byId('retellCount').textContent = `${state.retell.length} / 360`;
    byId('retellSupport').hidden = !state.retellHint;
    byId('finishButton').disabled = state.retell.trim().length < 24;
    byId('retellEvidence').innerHTML = orderedNotes().map(note => `<div>${escapeHtml(note)}</div>`).join('');
  }
  function handleRetellInput() {
    const wasEmpty = !state.retell.trim();
    state.retell = byId('retellInput').value;
    if (wasEmpty && state.retell.trim()) signals.log('retell-first-input', { activityId: 'retell', itemId: 'retell', sinceReadyMs: signals.sinceReadyMs('retell', 'retell') });
    byId('retellCount').textContent = `${state.retell.length} / 360`;
    byId('finishButton').disabled = state.retell.trim().length < 24;
    byId('retellFeedback').textContent = state.retell.trim().length < 24 ? '세 증거 중 하나를 넣어 설명을 조금 더 이어 보세요.' : '좋아요. 설명에 관측 증거가 들어 있는지 한 번 확인해 보세요.';
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
    signals.log('retell-text', { activityId: 'retell', itemId: 'retell', text, chars: text.length, words, sentences: (text.match(/[.!?]+/g) || []).length, accuracy: 'notApplicable', hintUsed: state.retellHint, evidenceMentioned: ['jupiter', 'venus', 'sun', 'moon', 'evidence', 'telescope'].filter(key => text.toLowerCase().includes(key)).join(',') });
    signals.fire(byId('retellDoneMarker'));
    signals.activityComplete('retell', { chars: text.length, words });
    signals.lessonComplete({ retellChars: text.length });
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

  function renderCoachParticipants(map) { window.OncuvateLiveMirror?.renderList(byId('coachParticipants'), map, 1); }
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
        if (wh.rereads[item.id]) parts.push(`다시 읽기 ${wh.rereads[item.id]}`);
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

  const menuKey = 'space-observatory:menu-collapsed';
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
    if (!state.activeClue) return;
    const clue = clueById(state.activeClue);
    signals.hint('clue-notes', 'note-' + clue.id, { helpLevel: 'A3', helpType: 'clue-review' });
    signals.decorateLater(byId('memoryRows').querySelectorAll('[data-memory-note]'), 'clue-notes', 'note-' + clue.id, b => b.dataset.memoryNote === clue.correct);
    openClueDialog(state.activeClue, true);
  });
  byId('sheetNextButton').addEventListener('click', nextSearchStep);
  byId('recordChoices').addEventListener('click', handleRecord);
  byId('deductionContinueButton').addEventListener('click', () => { signals.activityComplete('deduction'); showScreen('reading'); });
  byId('sentenceNextButton').addEventListener('click', nextSentence);
  byId('readingLevelButton').addEventListener('click', toggleReadingLevel);
  byId('readingContinueButton').addEventListener('click', () => { signals.activityComplete('information-reading', { level: state.readingLevel, rereadCount: state.readingRereads, selfCheck: state.readingSelfCheck || undefined, discourseType: 'expository' }); showScreen('wordhunt'); });
  byId('readingSelfCheck').addEventListener('click', handleReadingSelfCheck);
  byId('wordhuntRereadButton').addEventListener('click', wordHuntReread);
  byId('wordhuntSentence').addEventListener('click', handleWordHuntWord);
  byId('wordhuntChoices').addEventListener('click', handleWordHuntChoice);
  byId('wordhuntHintButton').addEventListener('click', wordHuntHint);
  byId('wordhuntNextButton').addEventListener('click', wordHuntNext);
  byId('wordhuntContinueButton').addEventListener('click', () => showScreen('mindmap'));
  byId('mindmapCards').addEventListener('input', handleMindMapInput);
  byId('mindmapCards').addEventListener('click', handleMindMapCard);
  byId('mindmapBoard').addEventListener('input', handleMindMapInput);
  byId('mindmapBoard').addEventListener('click', handleMindMapSlot);
  byId('mindmapCheckButton').addEventListener('click', checkMindMap);
  byId('mindmapResetButton').addEventListener('click', resetMindMap);
  byId('mindmapHintButton').addEventListener('click', () => { signals.hint('information-mindmap', 'map-check', { helpLevel: 'A2', helpType: 'word-hint', trigger: 'child-request' }); signals.decorateLater([byId('mindmapCheckButton')], 'information-mindmap', 'map-check', () => mindMapAllCorrect()); byId('mindmapHintDialog').showModal(); });
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













