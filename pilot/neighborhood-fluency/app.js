const app = document.querySelector('#app');
const runtimeParams = new URLSearchParams(window.location.search);
// 역할과 방은 서버가 주입한다. window.ONCUVATE가 있으면 그것만 보고 주소는 읽지 않는다.
// 주소 파라미터는 플랫폼 밖에서 화면을 확인할 때만 살아 있는 폴백이다.
const platformRuntime = window.ONCUVATE && typeof window.ONCUVATE === 'object'
  ? window.ONCUVATE
  : null;
// 화이트리스트 — coach 외에는 전부 아이로 본다.
const viewSurface = platformRuntime
  ? (platformRuntime.role === 'coach' ? 'coach' : 'child')
  : (runtimeParams.get('view') === 'coach' ? 'coach' : 'child');
// 방이 없으면 자율학습 — 실시간 연동을 끄고 혼자 도는 것이 기본 동작이다.
const activeRoom = (platformRuntime ? platformRuntime.room : runtimeParams.get('room')) || null;
const roomKey = activeRoom || 'solo';
// 아동 식별코드 4글자 — 실명이 아니다. 이름표·워터마크·진행 경로 구분에 그대로 쓴다(규격 6장).
const childId = platformRuntime?.child || runtimeParams.get('child') || null;
// 이 파일이 담당하는 회차 — sessionNN-data.js가 주입한다. 한 파일에는 한 회차만 있다.
const SESSION = Number(window.ONCUVATE_SESSION) || 1;
const serviceMode = activeRoom ? 'coaching' : 'independent';
// 파일럿 빌드에만 회차·역할·입장코드를 고르는 화면(index.html)이 따로 있고, 거기서 표시를 달아 보낸다.
// 납품본과 플랫폼 수업에는 그런 화면이 없다 — 주소는 플랫폼이 정하므로 콘텐츠가 옮기지 않는다.
const entryScreenAvailable = !platformRuntime && runtimeParams.get('entry') === '1';
const coachSurface = serviceMode === 'coaching' && viewSurface === 'coach';
const showPerformanceRecording = serviceMode !== 'coaching' || coachSurface;
// 자율학습이면 맞출 화면이 없다 — 동기화 자체를 끈다.
// 「젤리티처와 1:1로 겨루는 판인가」는 이것과 별개다(참가자 수로 정해진다 → soloFlipMode).
const independentFlipMode = serviceMode !== 'coaching';
// 저장소 키·채널 이름에 회차를 넣어 같은 방에서도 회차끼리 상태를 덮어쓰지 않게 한다.
const flipStorageKey = `oncuvate-neighborhood-flip-s${SESSION}-${roomKey}`;
const sessionStorageKey = `oncuvate-neighborhood-session-s${SESSION}-${roomKey}`;
const sessionSource = `${viewSurface}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

document.documentElement.dataset.surface = viewSurface;

const FLIP_LETTER_PAIRS = [
  ['가', '각'], ['나', '낮'], ['와', '왔'], ['꼬', '꽃'],
  ['하', '학'], ['소', '속'], ['구', '국'], ['바', '밥'],
  ['자', '잣'], ['비', '빛'], ['도', '돛'], ['부', '붓']
];

function createFlipGameState() {
  return {
    lessonId: null,
    active: false,
    completed: false,
    cards: [],
    childSide: 'open',
    coachSide: 'closed',
    // 그룹수업에서는 참가자 식별코드별로 두 편을 배정한다.
    teamAssignments: {},
    // 아이가 한 명뿐이면 편을 가를 수 없다 — 젤리티처가 상대편을 맡는다.
    // 참가자 수를 아는 것은 코치 화면뿐이라 판정을 여기 실어 아동 화면까지 보낸다.
    solo: false,
    turn: 'child',
    turns: 0,
    maxTurns: 100,
    durationSeconds: 30,
    endsAt: null,
    lastMove: null,
    winner: null
  };
}

// 회차 데이터는 sessionNN-data.js가 주입한다 — 한 파일에는 한 회차만 담긴다.
const lessons = { [SESSION]: window.ONCUVATE_LESSON };

const state = {
  lesson: SESSION,
  step: 0,
  sound: true,
  chunkMode: false,
  scale: null,
  reflection: null,
  focusWord: 0,
  syllableChoice: null,
  storyTextVisible: false,
  markedSoundLetters: [],
  letterGameRound: 0,
  letterGameChoice: null,
  letterGameScore: 0,
  letterGameDone: false,
  letterGamePhase: 'ready',
  letterGameSpeedMs: 3000,
  letterGamePresentedAt: null,
  letterGameDeck: [],
  letterGameResponses: [],
  // 화면 간에 오가는 요약(원자료는 각 화면에 남는다)
  letterGameSummary: { answered: 0, averageMs: null, lastMs: null },
  // 코치가 진도를 열었는가. 방이 없는 자율학습에서는 쓰이지 않는다.
  lessonStarted: false,
  // 두 잠금 — 코치가 켜고 끈다. nav로 전원에게 공유된다(규격 6장 nav = 화면 위치·잠금).
  //   페이지 잠금: 아동이 스스로 페이지를 넘기지 못한다. 다 같이 같은 페이지를 본다.
  //   활동 잠금: 페이지는 보되 활동 조작을 멈춘다. 코치가 설명하는 동안 쓴다.
  // 페이지 잠금은 **기본 켬** — 다 같이 같은 페이지를 보는 것이 수업의 기본 형태다.
  // 코치가 필요할 때 풀어 준다(자율학습에는 애초에 걸리지 않는다).
  pageLocked: true,
  activityLocked: false,
  // 아동이 스스로 알리는 두 신호 — 07번 §6.2의 「제출상태·도움요청」
  activityDone: false,
  // 손들기 — 5초 뒤 자동으로 내려가고, 아이가 직접 내릴 수도 있다.
  handRaised: false,
  // 최종 독립수행 확인 — 오늘 읽은 글 전체를 읽고 아동이 마쳤다고 알린 상태
  finalReadingDone: false,
  // 1분 읽기 도전 — 마이크 없이 속도(음절/분)를 잰다
  minuteChallengeActive: false,
  minuteChallengeStartedAt: null,
  minuteChallengeMark: 0,
  minuteChallengeResult: null,
  // 코치 화면이 받은 참가자별 진행 — 식별코드를 키로 한다. 코치 화면에만 산다.
  participants: {},
  // 도움 기록을 누구에게 붙일지(그룹수업). 1:1이면 자동으로 그 한 명.
  selectedParticipant: null,
  // 코치가 남긴 도움·개입 기록. 아동 화면에는 보내지 않는다(LOCAL_ONLY_KEYS).
  supportEntries: [],
  coachPanelOpen: false,
  pendingSupport: null,
  soundRound: 0,
  phenomenonChoice: null,
  soundChoice: [],
  colorObservationCount: 2,
  colorObservationMyColor: 0,
  // 색 주인 배정 — { count, seats: {참가자ID: 색}, childColors, coachColor }.
  // 시작할 때 코치가 한 번 정해 굳히고 화면 간에 공유한다(도중에 바뀌면 카드 주인이 흔들린다).
  colorObservationSeating: null,
  colorObservationDeck: [],
  colorObservationIndex: 0,
  colorObservationRevealed: false,
  colorObservationResponses: [],
  colorObservationDone: false,
  generalizationLevel: 0,
  generalizationResult: null,
  generalizationFinished: false,
  generalizationSet: 0,
  generalizationRecords: [[], [], []],
  // 수준별 진입 맥락 — 'standard' | 'coach-continued'(코치 판단으로 재개한 뒤)
  transferContext: {},
  // 코치가 그 수준에서 「계속 진행」을 누른 기록
  transferCoachContinued: {},
  t1SpeedMode: 'practice',
  t1SpeedActive: false,
  t1SpeedFinished: false,
  t1SpeedTimeLeft: 30,
  t1SpeedStartedAt: null,
  t1SpeedDeck: [],
  t1SpeedCurrent: 0,
  t1SpeedRevealed: [],
  t2TransformMode: 'word-to-syllables',
  t2TransformSelection: [],
  t2TransformHadError: false,
  t2TransformFeedback: '',
  t2TransformSoundPlayed: false,
  t2TransformPieceHeard: [],
  t3SentenceKey: '',
  t3SentenceOrder: [],
  t3SelectedIndex: null,
  t3ReadingStatus: 'arranging',
  t3ReadingAttempts: 0,
  t3ReadingResult: null,
  t3HadError: false,
  gameChoice: [],
  gameRound: 0,
  gameSetIndex: 0,
  gameScore: 0,
  gameFinished: false,
  flipGame: createFlipGameState(),
  transferChoice: null,
  timerStart: null,
  timerValue: 0,
  timerHandle: null,
  readingEvaluationEnabled: true,
  // 「처음으로」를 한 번 눌렀는가. 실수로 눌러 진행이 날아가지 않도록 두 번 묻는다.
  restartAsking: false
};

// 처음 상태를 그대로 떠 둔다 — 「처음으로」가 필드 하나를 빠뜨리지 않게.
// 아직 저장소를 읽기 전이라 이 값이 곧 「아무것도 안 한 상태」다.
const INITIAL_STATE = JSON.parse(JSON.stringify(state));

let letterGameAutoTimer = null;
let letterGameAdvanceTimer = null;
let flipOpponentTimer = null;
let flipClockTimer = null;
let t1SpeedTimer = null;
let t2TransformTimer = null;
let koreanSpeechVoices = [];
let speechSequenceToken = 0;
let flipGameChannel = null;
let sessionChannel = null;
let sessionRef = null;
let participantChannel = null;
let sessionRevision = 0;
let colorObservationTimingKey = null;
let colorObservationVisibleAt = null;

// 계측용 시계는 브라우저마다 원점이 다른 performance.now() 기준이라 화면 간에 주고받지 않는다.
// 상대에게 필요한 것은 파생값(responseTimeMs · t1SpeedTimeLeft)이고 그것은 state로 전달된다.
// 활동 진행 — **아동마다 다른 값**. 그룹에서 같은 페이지를 보더라도 푸는 속도는 제각각이다.
// 여기 없는 것(페이지 위치·덱 구성·난이도 설정·잠금)은 공유해야 같은 화면·같은 문제를 본다.
const ACTIVITY_PROGRESS_KEYS = [
  'sound', 'scale', 'reflection', 'chunkMode', 'focusWord', 'syllableChoice',
  'storyTextVisible', 'markedSoundLetters', 'transferChoice', 'timerValue',
  'activityDone', 'handRaised', 'finalReadingDone',
  'minuteChallengeActive', 'minuteChallengeStartedAt', 'minuteChallengeMark', 'minuteChallengeResult',
  'letterGameRound', 'letterGameChoice', 'letterGameScore', 'letterGameDone',
  'letterGamePhase', 'letterGameSummary',
  'soundRound', 'phenomenonChoice', 'soundChoice',
  // ⚠️ 컬러카드(colorObservation*)는 여기 없다 — 한 장씩 함께 보는 **공유 보드**라서
  //    카드 위치·뒤집힘·색 주인을 모두가 같은 값으로 봐야 한다. 코치가 넘기고 아이들은 따라온다.
  'generalizationResult', 'generalizationFinished', 'generalizationRecords',
  'transferContext', 'transferCoachContinued',
  't1SpeedMode', 't1SpeedActive', 't1SpeedFinished', 't1SpeedTimeLeft',
  't1SpeedCurrent', 't1SpeedRevealed',
  't2TransformMode', 't2TransformSelection', 't2TransformHadError',
  't2TransformFeedback', 't2TransformSoundPlayed', 't2TransformPieceHeard',
  't3SentenceOrder', 't3SelectedIndex', 't3ReadingStatus',
  't3ReadingAttempts', 't3ReadingResult', 't3HadError',
  'gameChoice', 'gameRound', 'gameScore', 'gameFinished'
];

// `nav`로 오가는 것은 **어느 페이지에서 무엇을 보는가**뿐이다(규격 6장 — nav = 화면 위치·잠금).
// 아래 키들은 nav에 싣지 않는다. 이유는 셋으로 나뉜다.
const LOCAL_ONLY_KEYS = [
  // ⑴ 타이머 핸들·계측 시계 — 브라우저마다 원점이 다르다
  'timerHandle', 'timerStart',
  'letterGamePresentedAt', 't1SpeedStartedAt',
  // ⑵ 계측 원자료 — 실시간은 소수 상태만(12번 §10). 코치에겐 요약·prog로 간다
  'letterGameResponses', 'colorObservationResponses',
  // ⑶ 코치 기록·참가자 목록 — 아동 화면에 코치 메모를 노출하지 않는다(12번 §8)
  'supportEntries', 'coachPanelOpen', 'pendingSupport', 'participants', 'selectedParticipant',
  // 「처음으로」 확인 단계는 누른 사람 화면에서만 뜬다
  'restartAsking',
  // ⑷ **활동 진행은 아동마다 다르다.** 그룹에서 같은 페이지를 보더라도 활동 속도는 제각각이므로
  //    이 값들을 공유하면 서로의 진행을 덮어쓴다. 코치는 `prog`로 각자의 진행을 본다.
  ...ACTIVITY_PROGRESS_KEYS
];

function sessionSnapshot() {
  const snapshot = {};
  Object.keys(state).forEach(key => {
    if (LOCAL_ONLY_KEYS.includes(key)) return;
    snapshot[key] = state[key];
  });
  return snapshot;
}

function applySessionSnapshot(payload) {
  if (!payload || payload.source === sessionSource || !payload.state) return;
  const revision = Number(payload.revision) || 0;
  if (revision && revision <= sessionRevision) return;
  // 리비전은 두 화면의 최신성 비교용이라 벽시계를 쓴다(계측값이 아니다).
  sessionRevision = revision || Date.now();
  Object.keys(payload.state).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(state, key) && !LOCAL_ONLY_KEYS.includes(key)) {
      state[key] = payload.state[key];
    }
  });
  render(true);
}

function runtimeBridgeMethod(name) {
  if (typeof platformRuntime?.[name] === 'function') return platformRuntime[name].bind(platformRuntime);
  if (typeof window[name] === 'function') return window[name].bind(window);
  return null;
}

// ── 참가자 진행 구독(코치 화면) ──────────────────────────────────────
// ⚠️ 플랫폼에서 코치가 `prog` 전체를 구독할 수 있는지 아직 확인되지 않았다
// (규격 6장 예시는 `prog/<내ID>`로 **자기 것을 다루는 것**뿐이다. `20`번으로 문의 예정).
// 그래서 **읽어오는 경로를 이 함수 하나로 몰아 두었다** — 확인되면 여기만 고치면 된다.
// 화면(참가자 목록)은 어느 통로로 받든 그대로 쓴다.
function subscribeParticipants() {
  if (!coachSurface) return;

  if (platformRuntime) {
    const pth = runtimeBridgeMethod('pth');
    const onValue = runtimeBridgeMethod('_onValue');
    if (!pth || !onValue) return;
    try {
      onValue(pth('prog'), snapshot => {
        const value = typeof snapshot?.val === 'function' ? snapshot.val() : snapshot;
        // `prog` 아래에 참가자 ID를 키로 한 객체가 온다는 전제. 확인 뒤 조정한다.
        state.participants = value && typeof value === 'object' ? value : {};
        refreshSoloFlipMode();
        render(true);
      });
    } catch { /* 전체 구독이 막혀 있으면 목록은 비어 있고 수업 진행은 유지된다 */ }
    return;
  }

  // 로컬 검수용 폴백 — 아동 창이 BroadcastChannel로 자기 진행을 알린다.
  if ('BroadcastChannel' in window) {
    participantChannel = new BroadcastChannel(`${sessionStorageKey}-prog`);
    participantChannel.addEventListener('message', event => {
      const p = event.data;
      if (!p?.child) return;
      state.participants = { ...state.participants, [p.child]: p };
      refreshSoloFlipMode();
      render(true);
    });
    // 아이가 먼저 들어와 있으면 그 알림은 이미 지나갔다. 한 번 불러 다시 알리게 한다
    // — 그러지 않으면 아이가 뭔가 누를 때까지 코치 화면에 아무도 없는 것처럼 보인다.
    try { participantChannel.postMessage({ type: 'roll-call' }); } catch { /* 무시 */ }
  }
}

function setupSessionSync() {
  if (serviceMode !== 'coaching') return;

  if (platformRuntime) {
    const pth = runtimeBridgeMethod('pth');
    const onValue = runtimeBridgeMethod('_onValue');
    if (!pth || !onValue) return;
    try {
      // 규격 6장 — 경로는 nav·prog·report 셋뿐이다. 콘텐츠가 새 최상위 경로를 만들지 않는다.
      // 방 구분은 pth()가 처리하고, 회차 구분은 플랫폼이 회차마다 수업을 여는 것으로 처리된다.
      sessionRef = pth('nav');
      armProgressDisconnect();
      onValue(sessionRef, snapshot => {
        const payload = typeof snapshot?.val === 'function' ? snapshot.val() : snapshot;
        applySessionSnapshot(payload);
      });
    } catch { /* 플랫폼이 동기화 경로를 제공하지 않으면 현재 화면만 사용 */ }
    return;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(sessionStorageKey) || 'null');
    if (stored?.state) applySessionSnapshot(stored);
  } catch { /* 공개 시연 상태 없이 시작 */ }

  if ('BroadcastChannel' in window) {
    sessionChannel = new BroadcastChannel(sessionStorageKey);
    sessionChannel.addEventListener('message', event => applySessionSnapshot(event.data));
  }
}

// 진행 위치 — 규격 6장의 `prog`(참여자별 진행 현황)에 실어 보낸다.
// 화면 위치만 있는 `nav`와 달리 **활동 안 몇 번째 문항인지**를 담는다.
// 코치가 준 도움이 어느 문항에 대한 것인지 플랫폼이 이어붙일 수 있어야 하기 때문이다.
function currentProgress() {
  const steps = lessons[state.lesson]?.steps;
  if (!steps) return null;
  const step = steps[state.step];
  // 마지막 단계를 넘어서면 완료 화면이다 — 그것도 알려야 할 진행 상태다.
  if (!step) return { screen: steps.length, screens: steps.length, activity: 'finish', title: '마침' };
  return {
    screen: state.step + 1,
    screens: steps.length,
    activity: step.type,
    title: step.title ?? null,
    ...activityStats(step)
  };
}

// **페이지 안의 진행**을 센다 — 전체 진도(11/14)만으로는 코치가 아무것도 판단할 수 없다.
// 「10문항 중 5개 풀고 3개 맞음」이 보여야 느린 아이·막힌 아이에게 먼저 갈 수 있다.
// 판정이 아직 안 붙은 문항은 correct/wrong 어디에도 넣지 않는다(미판정을 정답으로 세지 않는다).
function activityStats(step) {
  const none = { itemsDone: null, itemsTotal: null, correct: null, wrong: null };
  if (!step) return none;

  if (step.type === 'lettergame') {
    const total = currentLetterGameDeck(step).length;
    const answered = state.letterGameRound + (state.letterGamePhase === 'feedback' ? 1 : 0);
    return { itemsDone: Math.min(answered, total), itemsTotal: total,
             correct: state.letterGameScore, wrong: Math.max(0, Math.min(answered, total) - state.letterGameScore) };
  }

  if (step.type === 'generalization') {
    const level = step.levels?.[state.generalizationLevel];
    if (!level) return none;
    const items = currentGeneralizationItems(level);
    const records = state.generalizationRecords[state.generalizationLevel] || [];
    const score = scoreTransferLevel(records, level, items.length);
    return { itemsDone: records.length, itemsTotal: items.length,
             correct: score.independent, wrong: score.supported,
             unmeasured: score.unscorable || 0,
             level: level.code, item: items[records.length] ?? null };
  }

  if (step.type === 'colorobservation') {
    const total = state.colorObservationDeck.length;
    const answered = state.colorObservationIndex;
    return { itemsDone: answered, itemsTotal: total, correct: null, wrong: null };
  }

  if (step.type === 'game') {
    const total = step.pool?.length ?? null;
    return { itemsDone: state.gameRound, itemsTotal: total,
             correct: state.gameScore, wrong: Math.max(0, state.gameRound - state.gameScore) };
  }

  if (step.type === 'soundchange') {
    return { itemsDone: state.soundRound, itemsTotal: step.rounds?.length ?? null, correct: null, wrong: null };
  }

  return none;
}

// 진행은 **참가자별 하위 경로**에 쓴다 — `prog/<식별코드>`(규격 6장 예시 그대로).
// 그룹수업에서 아동이 여럿이어도 서로 덮어쓰지 않고, 코치는 `prog` 전체를 구독해 목록으로 본다.
function progressPath(pth) {
  return childId ? pth(`prog/${childId}`) : pth('prog');
}

function publishProgress() {
  if (!platformRuntime || serviceMode !== 'coaching') return;
  // 아동 화면만 자기 진행을 알린다 — 코치 화면이 되쓰면 서로 덮어쓴다.
  if (viewSurface === 'coach') return;
  const pth = runtimeBridgeMethod('pth');
  const setValue = runtimeBridgeMethod('_set');
  if (!pth || !setValue) return;
  const progress = currentProgress();
  if (!progress) return;
  try { setValue(progressPath(pth), progressPayload()); }
  catch { /* 연결이 끊겨도 화면 진행은 유지 */ }
}

// 완료 조건이 **있는** 활동만 「마침」을 말할 수 있다.
// `activityComplete()`는 처리하지 않는 유형에 true를 돌려준다(그냥 보는 화면이라 막을 이유가 없어서).
// 그 값을 그대로 코치에게 보내면 아동이 화면에 도착하자마자 「마침」이 떠서 표시가 뜻을 잃는다.
const COMPLETABLE_ACTIVITIES = [
  'scale', 'reflection', 'story', 'reread', 'transfer', 'lettergame',
  'flipgame', 'soundchange', 'colorobservation', 'generalization', 'game'
];

function progressPayload() {
  const step = lessons[state.lesson]?.steps[state.step];
  return {
    ...currentProgress(),
    child: childId,
    // 활동 완료는 시스템·코치가 판정한다. 아동의 종료 탭은 되돌릴 수 없으므로 받지 않는다.
    // 완료 조건이 없는 화면(안내·준비)은 null — 도착만 해도 「마침」이 뜨는 것을 막는다.
    complete: step
      ? (COMPLETABLE_ACTIVITIES.includes(step.type) ? activityComplete(step) : null)
      : true,
    selfReported: false,
    handRaised: state.handRaised || false,            // 「손들기」
    // 마지막 조작 이후 흐른 시간. 코치가 「멈춰 있는 아이」를 먼저 알아보라고 싣는다.
    idleMs: Math.round(performance.now() - lastInteractionAt),
    at: Math.round(performance.now())
  };
}

// 진행은 클릭뿐 아니라 **시간 초과·자동 진행으로도 바뀐다**. 그래서 렌더마다 확인하되
// 값이 실제로 달라졌을 때만 보낸다(67B짜리라 비교 비용이 전송보다 싸다).
let lastProgressSent = '';
// 되돌리는 동안에는 아무것도 발행하지 않는다(아래 restartSession 참고).
let restarting = false;
let lastInteractionAt = performance.now();
app.addEventListener('pointerdown', () => { lastInteractionAt = performance.now(); }, true);
function publishProgressIfChanged() {
  if (serviceMode !== 'coaching' || coachSurface) return;
  // 시각은 비교에서 빼고, 정체 시간은 10초 단위로 뭉갠다 —
  // 그대로 두면 렌더마다 값이 달라져 매번 보내게 되고, 아예 빼면 멈춰 있는 아이가 갱신되지 않는다.
  const p = progressPayload();
  const payload = JSON.stringify({ ...p, at: 0, idleMs: Math.floor(p.idleMs / 10000) });
  if (payload === lastProgressSent) return;
  lastProgressSent = payload;
  publishProgress();
  publishProgressLocal();
}

// 로컬 검수용 — 플랫폼이 없을 때 아동 창이 자기 진행을 코치 창에 알린다.
function publishProgressLocal() {
  if (platformRuntime || serviceMode !== 'coaching' || viewSurface === 'coach') return;
  if (!('BroadcastChannel' in window)) return;
  if (!participantChannel) {
    participantChannel = new BroadcastChannel(`${sessionStorageKey}-prog`);
    // 코치가 뒤늦게 들어와 점호하면 그 자리에서 다시 자기를 알린다.
    participantChannel.addEventListener('message', event => {
      if (event.data?.type === 'roll-call') publishProgressLocal();
    });
  }
  try { participantChannel.postMessage(progressPayload()); } catch { /* 무시 */ }
}

// 창을 닫으면 그 참가자 항목이 사라진다 → 코치 화면의 접속상태가 자동으로 유지된다(07번 §6.2).
function armProgressDisconnect() {
  if (!platformRuntime || serviceMode !== 'coaching' || viewSurface === 'coach') return;
  const pth = runtimeBridgeMethod('pth');
  const onDisconnect = runtimeBridgeMethod('_onDisconnect');
  if (!pth || !onDisconnect) return;
  try { onDisconnect(progressPath(pth)).remove(); } catch { /* 미지원 환경은 건너뛴다 */ }
}

function publishSessionSnapshot() {
  // 「처음으로」를 누른 클릭에도 발행이 예약돼 있다. 그대로 두면 방금 지운 진행을 도로 써 버린다.
  if (serviceMode !== 'coaching' || restarting) return;
  const payload = {
    source: sessionSource,
    revision: Date.now() * 1000 + Math.floor(Math.random() * 1000),
    state: sessionSnapshot()
  };
  sessionRevision = payload.revision;
  publishProgress();
  publishProgressLocal();

  if (platformRuntime) {
    const setValue = runtimeBridgeMethod('_set');
    if (setValue && sessionRef) {
      try { setValue(sessionRef, payload); } catch { /* 플랫폼 연결이 끊기면 화면 진행은 유지 */ }
    }
    return;
  }

  try { localStorage.setItem(sessionStorageKey, JSON.stringify(payload)); } catch { /* 저장 불가 환경 */ }
  sessionChannel?.postMessage(payload);
}

function esc(text) {
  return text.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function validFlipGame(game) {
  return game && typeof game === 'object' && Array.isArray(game.cards)
    && ['open', 'closed'].includes(game.childSide)
    && ['open', 'closed'].includes(game.coachSide)
    && ['child', 'coach'].includes(game.turn)
    && (!game.teamAssignments || typeof game.teamAssignments === 'object');
}

function hydrateFlipGame() {
  if (independentFlipMode) return;
  try {
    const stored = JSON.parse(localStorage.getItem(flipStorageKey) || 'null');
    if (validFlipGame(stored)) state.flipGame = { ...createFlipGameState(), ...stored, teamAssignments: { ...(stored.teamAssignments || {}) } };
  } catch { /* 새 게임 상태로 시작 */ }
}

function syncFlipGame() {
  if (independentFlipMode) return;
  // 플랫폼 수업은 허용된 nav 경로를 통해 편 배정·카드 상태를 모든 기기에 전달한다.
  // 로컬 검수에서는 같은 브라우저 프로필의 저장소와 채널을 사용한다.
  if (platformRuntime) {
    publishSessionSnapshot();
    return;
  }
  try { localStorage.setItem(flipStorageKey, JSON.stringify(state.flipGame)); } catch { /* 저장 불가 환경 */ }
  flipGameChannel?.postMessage({ type: 'flip-game-state', game: state.flipGame });
}

function setupFlipGameSync() {
  if (independentFlipMode || !('BroadcastChannel' in window)) return;
  flipGameChannel = new BroadcastChannel(flipStorageKey);
  flipGameChannel.addEventListener('message', event => {
    if (event.data?.type !== 'flip-game-state' || !validFlipGame(event.data.game)) return;
    state.flipGame = event.data.game;
    const step = state.lesson ? lessons[state.lesson]?.steps[state.step] : null;
    if (step?.type === 'flipgame') render(true);
  });
}

function refreshKoreanSpeechVoices() {
  if (!('speechSynthesis' in window)) return;
  koreanSpeechVoices = window.speechSynthesis.getVoices().filter(voice => {
    const lang = String(voice.lang || '').toLowerCase();
    const name = String(voice.name || '');
    return lang.startsWith('ko') || /korean|한국|sunhi|injoo?n|heami|선희|인준|혜미/i.test(name);
  });
}

function preferredKoreanSpeechVoice() {
  if (!koreanSpeechVoices.length) refreshKoreanSpeechVoices();
  const score = voice => {
    const name = `${voice.name || ''} ${voice.voiceURI || ''}`;
    const lang = String(voice.lang || '').toLowerCase();
    let value = lang === 'ko-kr' ? 100 : lang.startsWith('ko') ? 75 : 0;
    if (/natural|neural/i.test(name)) value += 90;
    if (/online/i.test(name)) value += 48;
    if (/sunhi|선희/i.test(name)) value += 32;
    if (/injoo?n|인준/i.test(name)) value += 28;
    if (/microsoft|google/i.test(name)) value += 16;
    if (voice.localService === false) value += 8;
    return value;
  };
  return [...koreanSpeechVoices].sort((a, b) => score(b) - score(a))[0] || null;
}

function makeKoreanUtterance(text, rate = 0.88) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = preferredKoreanSpeechVoice();
  utterance.lang = voice?.lang || 'ko-KR';
  if (voice) utterance.voice = voice;
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;
  return utterance;
}

function setupNaturalKoreanSpeech() {
  if (!('speechSynthesis' in window)) return;
  refreshKoreanSpeechVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshKoreanSpeechVoices);
}

function speak(text, rate = 0.88) {
  if (!state.sound || !('speechSynthesis' in window)) return;
  speechSequenceToken += 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(makeKoreanUtterance(text, rate));
}

function speakWordThenPieces(text) {
  if (!state.sound || !('speechSynthesis' in window)) return;
  const pieces = Array.from(String(text).replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, ''));
  const sequence = [{ text, rate: .84, pause: 360 }, ...pieces.map(piece => ({ text: piece, rate: .7, pause: 210 }))];
  const token = ++speechSequenceToken;
  window.speechSynthesis.cancel();
  const play = index => {
    if (token !== speechSequenceToken || index >= sequence.length || !state.sound) return;
    const current = sequence[index];
    const utterance = makeKoreanUtterance(current.text, current.rate);
    utterance.onend = () => window.setTimeout(() => play(index + 1), current.pause);
    window.speechSynthesis.speak(utterance);
  };
  play(0);
}


// 회차 선택 화면(homeView)과 그 상단바(header)는 제거했다.
// 한 파일 = 한 회차이므로 다른 회차로 넘어가는 화면 자체가 없어야 한다.

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function soundMarkedText(text, step) {
  if (!step.soundMarks?.length) return esc(text);
  const marks = [...step.soundMarks].sort((a, b) => b.surface.length - a.surface.length);
  const marksBySurface = new Map(marks.map(mark => [mark.surface, mark]));
  const pattern = new RegExp(marks.map(mark => escapeRegex(mark.surface)).join('|'), 'g');
  let cursor = 0;
  let html = '';

  for (const match of text.matchAll(pattern)) {
    html += esc(text.slice(cursor, match.index));
    const mark = marksBySurface.get(match[0]);
    const markedIndices = [...new Set([...(mark.indices || []), ...(mark.liaisonIndices || []), ...(mark.otherIndices || [])])];
    html += Array.from(match[0]).map((letter, index) => {
      if (!markedIndices.includes(index)) return esc(letter);
      const key = `${mark.surface}:${index}`;
      const selected = state.markedSoundLetters.includes(key);
      const soundType = (mark.liaisonIndices || []).includes(index)
        ? 'liaison'
        : (mark.otherIndices || []).includes(index) ? 'other' : 'tensing';
      const soundLabel = soundType === 'liaison'
        ? '앞의 끝소리가 이어지는 글자'
        : soundType === 'other' ? '함께 살펴볼 소리' : '첫소리가 세게 들리는 글자';
      return `<button class="sound-letter ${soundType} ${selected ? 'selected' : ''}" data-sound-letter="${esc(key)}" data-sound-type="${soundType}" aria-pressed="${selected}" aria-label="${letter}, ${soundLabel} 표시">${esc(letter)}</button>`;
    }).join('');
    cursor = match.index + match[0].length;
  }
  return html + esc(text.slice(cursor));
}

function markedPassageHtml(step) {
  return step.passage.split(/(<[^>]+>)/g).map(part => part.startsWith('<') ? part : soundMarkedText(part, step)).join('');
}

function chunksHtml(step) {
  if (!state.chunkMode || !step.chunks) return markedPassageHtml(step);
  return step.chunks.map(chunk => {
    const sentenceEnd = /[.!?][”’"')）]?$/.test(chunk.trim());
    return `<span class="chunk on">${soundMarkedText(chunk, step)}</span>${sentenceEnd ? '<br>' : ' '}`;
  }).join('');
}

function goalView(step) {
  const isFirst = state.lesson === 1;
  return `<div class="activity-card goal-card">
    <header class="goal-book-header">
      <h2>동네 한 바퀴</h2>
      <p>글 박철주 <i aria-hidden="true"></i> 그림 박은현</p>
    </header>
    <div class="goal-copy">
      <span class="eyebrow">${state.lesson}회차 · 오늘의 목표</span>
      <h3>${isFirst ? '받침 뒤에서 <span class="gentle">첫소리가 세게 바뀌는</span> 낱말을 정확하게 읽어 봐요.' : '<span class="gentle">첫소리가 세게 바뀌는</span> 낱말을 긴 문장에서도 정확하게 읽어 봐요.'}</h3>
      <ul class="goal-list">
        <li>받침과 그다음 첫소리를 함께 살펴요.</li>
        <li>세게 바뀐 첫소리를 듣고 정확하게 읽어요.</li>
        <li>그림책 문장과 처음 보는 낱말에도 적용해요.</li>
      </ul>
    </div>
    <div class="goal-visual goal-visual-session-${state.lesson}">
      <img src="assets/scenes/scene-${state.lesson === 1 ? '02' : '06'}.jpg" alt="동네를 둘러보는 아이">
    </div>
    <footer class="goal-book-rights">
      <span>원작 그림책 《동네 한 바퀴》 · 글 박철주 · 그림 나은현</span>
      <span>© 2019 Enuma, Inc. &amp; The Foundation SeeArt for Book Culture · <a href="https://creativecommons.org/licenses/by/4.0/deed.ko" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></span>
      <span class="oncuvate-rights">읽기유창성 훈련 콘텐츠(수업 설계·문항·활동·UI·코드) © 2026 Oncuvate. All rights reserved. 원작의 CC BY 4.0 적용 부분을 제외한 온큐베이트 제작물은 사전 서면 허가 없이 복제·배포할 수 없습니다.</span>
    </footer>
  </div>`;
}

function scaleView(kind) {
  const reflection = kind === 'reflection';
  const selected = reflection ? state.reflection : state.scale;
  const labels = reflection
    ? ['조금 더 연습할래요', '조금 헷갈려요', '자연스럽게 읽었어요', '다른 글도 해볼래요']
    : ['처음 만난 느낌이에요', '조금 읽을 수 있어요', '꽤 자신 있어요', '편하게 읽을 수 있어요'];
  const confidenceImages = [
    'assets/jelly-confidence-1.png',
    'assets/jelly-confidence-2.png',
    'assets/jelly-confidence-3.png',
    'assets/jelly-confidence-4.png'
  ];
  return `<div class="activity-card scale-card">
    <h2 class="question">${reflection ? '읽고 난 지금, 내 읽기는 어떤가요?' : '오늘 문장을 읽을 때 나는 어떨 것 같나요?'}</h2>
    <p class="question-helper">정답은 없어요. 지금 내 생각과 가장 가까운 것을 골라 보세요.</p>
    <div class="scale-options">
      ${labels.map((label, index) => `<button class="scale-option ${selected === index ? 'selected' : ''}" data-scale="${index}" data-kind="${kind}">
        <img class="scale-character level-${index + 1}" src="${confidenceImages[index]}" alt=""><span>${label}</span>
      </button>`).join('')}
    </div>
  </div>`;
}

function storyView(step, variant = 'story') {
  const isReread = variant === 'reread';
  const isTransfer = variant === 'transfer';
  return `<div class="activity-card scene-card ${state.storyTextVisible ? 'text-visible' : 'picture-only'}">
    <img class="scene-image" src="assets/scenes/scene-${String(step.scene).padStart(2, '0')}.jpg" alt="동네 한 바퀴 이야기 장면">
    ${!state.storyTextVisible ? `<button class="story-text-toggle reveal" data-action="toggle-story-text"><strong>글 보기</strong></button>` : `<div class="reading-layer">
      <div class="reading-meta">
        <span>${isTransfer ? '처음 보는 장면' : isReread ? '연습한 문장 다시 읽기' : '그림을 보고 문장 읽기'}</span>
        ${isReread ? `<span class="timer-box">읽기 시간 <b id="timer">${formatTime(state.timerValue)}</b></span>` : '<span>뜻이 이어지는 곳에서 쉬어요</span>'}
      </div>
      ${step.soundMarks?.length ? `<div class="sound-mark-guide"><div>${state.markedSoundLetters.length
        ? '<strong>표시 완료</strong><span>색이 바뀐 글자에 주의하며 읽어 보세요.</span>'
        : '<strong>먼저 찾기</strong><span>글자와 소리가 다르게 들리는 곳을 눌러 보세요.</span>'}</div>
        <div class="sound-mark-legend" aria-label="색상 안내"><span><i class="tensing"></i>첫소리가 세게 들려요</span><span><i class="liaison"></i>앞의 끝소리가 이어져요</span><span><i class="other"></i>함께 살펴봐요</span></div></div>` : ''}
      <p class="passage ${step.passage.length > 115 ? 'compact' : ''}">${chunksHtml(step)}</p>
      <div class="scene-actions">
        <button class="btn btn-secondary" data-action="speak" data-text="${esc(step.spoken)}">들어보기</button>
        ${step.chunks ? `<button class="btn btn-ghost" data-action="chunks">${state.chunkMode ? '원문 보기' : '끊어읽기'}</button>` : ''}
        ${isReread ? `<button class="btn ${state.timerStart ? 'btn-secondary' : 'btn-primary'}" data-action="timer">${state.timerStart ? '읽기 마침' : state.timerValue ? '다시 재기' : '읽기 시작'}</button>` : ''}
        <button class="btn btn-ghost" data-action="toggle-story-text">그림만 보기</button>
      </div>
      ${isTransfer ? `<div class="transfer-check">
        <div class="transfer-question">읽고 찾기 · ${step.quizPrompt}</div>
        <div class="transfer-options">${step.quizOptions.map(option => {
          const chosen = state.transferChoice === option;
          const status = chosen ? (option === step.quizAnswer ? 'correct' : 'wrong') : '';
          return `<button class="transfer-choice ${status}" data-transfer-choice="${esc(option)}" data-track="answer" data-correct="${option === step.quizAnswer}">${option}</button>`;
        }).join('')}</div>
        <div class="transfer-feedback">${state.transferChoice ? (state.transferChoice === step.quizAnswer ? '맞아요. 문장에서 알맞은 정보를 찾았어요.' : '문장을 천천히 다시 읽고 찾아보세요.') : ''}</div>
      </div>` : ''}
    </div>`}
  </div>`;
}

function focusView(step) {
  const current = step.words[state.focusWord] || step.words[0];
  return `<div class="activity-card focus-layout">
    <div class="word-list">
      ${step.words.map((item, index) => `<button class="word-card ${index === state.focusWord ? 'selected' : ''}" data-word="${index}">
        <span><strong>${item.word}</strong><small>눌러서 연습하기</small></span><span aria-hidden="true">›</span>
      </button>`).join('')}
    </div>
    <div class="practice-panel">
      <span class="practice-label">오늘의 읽기 포인트 · 받침 뒤 첫소리</span>
      <div class="practice-word">${current.word}</div>
      <div class="practice-chunks">${current.chunks}</div>
      <p class="practice-tip">${current.tip}</p>
      <div class="practice-actions">
        <button class="btn btn-secondary" data-action="speak" data-text="${esc(current.word)}">들어보기</button>
        <button class="btn btn-primary" data-action="speak-slow" data-text="${esc(current.word)}">천천히 듣기</button>
      </div>
    </div>
  </div>`;
}

function syllableView(step) {
  return `<div class="activity-card syllable-activity">
    <div class="letter-lesson-head">
      <div class="letter-lesson-title">
        <span class="eyebrow">젤리티처의 한눈에 보기</span>
        <h2><em>끝소리</em>를 얼마나 길게 이어 볼 수 있을까요?</h2>
        <p>글자를 누르고 끝소리를 길게 말해 보세요. 이어지는지, 짧게 멈추는지 느껴 봐요.</p>
      </div>
    </div>
    <div class="letter-rule-grid">
      <section class="letter-rule-card open">
        <div class="letter-rule-copy">
          <span class="letter-rule-number">1</span>
          <div><h3>길게 이어져요</h3><p><mark>“${step.pairs[0][0]}——” 하고 길게 말할 수 있어요.</mark></p></div>
        </div>
        <button class="letter-demo" data-action="speak" data-text="${step.pairs[0][0]}" aria-label="${step.pairs[0][0]} 소리 듣기">
          <span class="demo-letter open-letter">${step.pairs[0][0]}</span>
          <img class="letter-concept-icon" src="assets/jelly-vocalize-ah.png" alt="눈을 감고 두 손을 모아 끝소리를 길게 내는 젤리티처">
        </button>
      </section>
      <section class="letter-rule-card closed">
        <div class="letter-rule-copy">
          <span class="letter-rule-number">2</span>
          <div><h3>짧게 멈춰요</h3><p><mark>“${step.pairs[0][1]}” 하고 끝소리가 짧게 멈춰요.</mark></p></div>
        </div>
        <button class="letter-demo" data-action="speak" data-text="${step.pairs[0][1]}" aria-label="${step.pairs[0][1]} 소리 듣기">
          <span class="demo-letter closed-letter" aria-hidden="true">
            <canvas class="closed-letter-canvas" data-colored-final="${step.pairs[0][1]}"></canvas>
          </span>
          <img class="letter-concept-icon" src="assets/jelly-brace-force.png" alt="입을 다물고 힘을 주어 끝소리를 멈추는 젤리티처">
        </button>
      </section>
    </div>
    <div class="letter-memory-line">
      <strong>기억하기</strong>
      <span><b>길게 말할 수 있으면</b> 소리가 이어지고</span>
      <i aria-hidden="true"></i>
      <span><b>길게 말하기 어려우면</b> 끝소리가 짧게 멈춰요.</span>
    </div>
  </div>`;
}

function shuffledLetterGameDeck(items) {
  const deck = items.map(item => ({ ...item }));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function clearLetterGameTimers() {
  if (letterGameAutoTimer) clearTimeout(letterGameAutoTimer);
  if (letterGameAdvanceTimer) clearTimeout(letterGameAdvanceTimer);
  letterGameAutoTimer = null;
  letterGameAdvanceTimer = null;
}

function currentLetterGameDeck(step) {
  return state.letterGameDeck.length ? state.letterGameDeck : step.items;
}

function recordLetterGameResponse(step, choice, timedOut = false) {
  if (state.letterGamePhase !== 'active') return;
  clearLetterGameTimers();
  const deck = currentLetterGameDeck(step);
  const item = deck[state.letterGameRound];
  // 반응시간은 콘텐츠에서 잰다(09번 §6). 벽시계가 아니라 단조 증가하는 상대시각을 쓴다.
  const respondedAt = performance.now();
  const responseTimeMs = state.letterGamePresentedAt
    ? Math.min(state.letterGameSpeedMs, Math.max(0, Math.round(respondedAt - state.letterGamePresentedAt)))
    : null;
  const correct = !timedOut && choice === item.answer;

  state.letterGameChoice = timedOut ? 'timeout' : choice;
  state.letterGamePhase = 'feedback';
  if (correct) state.letterGameScore += 1;
  state.letterGameResponses.push({
    lessonId: state.lesson,
    itemIndex: state.letterGameRound,
    letter: item.letter,
    expected: item.answer,
    response: timedOut ? null : choice,
    correct,
    timedOut,
    presentedAt: state.letterGamePresentedAt,
    respondedAt,
    responseTimeMs
  });
  // 원자료는 화면에 남기고, 화면 간에는 요약만 오간다(12번 §10 「필요한 소수 상태만 동기화」).
  const measured = state.letterGameResponses.filter(r => !r.timedOut && r.responseTimeMs !== null);
  state.letterGameSummary = {
    answered: measured.length,
    averageMs: measured.length
      ? Math.round(measured.reduce((sum, r) => sum + r.responseTimeMs, 0) / measured.length)
      : null,
    lastMs: timedOut ? null : responseTimeMs
  };
  render(true);

  letterGameAdvanceTimer = setTimeout(() => advanceLetterGame(step), timedOut ? 900 : 600);
}

function scheduleLetterGameTimeout(step) {
  clearTimeout(letterGameAutoTimer);
  if (state.letterGamePhase !== 'active') return;
  const elapsed = state.letterGamePresentedAt ? performance.now() - state.letterGamePresentedAt : 0;
  const remaining = Math.max(0, state.letterGameSpeedMs - elapsed);
  letterGameAutoTimer = setTimeout(() => recordLetterGameResponse(step, null, true), remaining);
}

function presentLetterGameItem(step) {
  clearLetterGameTimers();
  state.letterGamePhase = 'active';
  state.letterGameChoice = null;
  state.letterGamePresentedAt = performance.now();
  render(true);
  scheduleLetterGameTimeout(step);
}

function startLetterGame(step) {
  clearLetterGameTimers();
  state.letterGameRound = 0;
  state.letterGameChoice = null;
  state.letterGameScore = 0;
  state.letterGameDone = false;
  state.letterGamePhase = 'countdown';
  state.letterGamePresentedAt = null;
  state.letterGameDeck = shuffledLetterGameDeck(step.items);
  state.letterGameResponses = [];
  state.letterGameSummary = { answered: 0, averageMs: null, lastMs: null };
  render(true);
  letterGameAdvanceTimer = setTimeout(() => presentLetterGameItem(step), 700);
}

function advanceLetterGame(step) {
  clearLetterGameTimers();
  const deck = currentLetterGameDeck(step);
  if (state.letterGameRound >= deck.length - 1) {
    state.letterGameDone = true;
    state.letterGamePhase = 'done';
    state.letterGamePresentedAt = null;
    render(true);
    return;
  }
  state.letterGameRound += 1;
  presentLetterGameItem(step);
}

function letterGameView(step) {
  const deck = currentLetterGameDeck(step);
  const item = deck[state.letterGameRound] || step.items[0];
  const ready = state.letterGamePhase === 'ready';
  const countingDown = state.letterGamePhase === 'countdown';
  const active = state.letterGamePhase === 'active';
  const answered = state.letterGamePhase === 'feedback';
  const timedOut = state.letterGameChoice === 'timeout';
  const correct = state.letterGameChoice === item.answer;
  const choiceClass = answer => !answered ? '' : answer === item.answer ? 'correct' : state.letterGameChoice === answer ? 'wrong' : '';
  const summary = state.letterGameSummary;
  const progressNumber = ready || countingDown ? 0 : state.letterGameRound + 1;

  if (state.letterGameDone) {
    const answeredResponses = { length: summary.answered };
    const averageMs = summary.averageMs;
    return `<div class="activity-card letter-game-card letter-game-finish" data-track="activity-complete" data-activity-id="lettergame">
    <img src="assets/jelly-confidence-3.png" alt="두 엄지를 든 젤리티처">
    <div><span class="eyebrow">끝소리 게임 완료</span><h2>끝소리의 느낌을 잘 구분했어요!</h2>
    <p>모두 ${deck.length}개 중 ${state.letterGameScore}개를 정확하게 찾았어요.</p>
    <div class="letter-game-summary"><span><b>${answeredResponses.length}</b>개 응답</span><span><b>${averageMs === null ? '―' : `${(averageMs / 1000).toFixed(1)}초`}</b> 평균 반응</span></div>
    <button class="btn btn-secondary" data-action="start-letter-game">다시 해보기</button></div>
  </div>`;
  }

  const target = ready || countingDown
    ? `<div class="letter-game-target is-ready" aria-label="${countingDown ? '준비' : '시작 전 준비'}"><b>${countingDown ? '준비!' : '3초'}</b><span>${countingDown ? '곧 시작해요' : '문제마다'}</span></div>`
    : `<button class="letter-game-target" data-action="speak" data-text="${item.letter}" aria-label="${item.letter} 소리 듣기">
        <b>${item.letter}</b><span>눌러서 듣기</span><i>끝소리</i>
      </button>`;

  let feedback = '준비되면 시작을 눌러요. 글자가 나오면 3초 안에 골라요.';
  if (countingDown) feedback = '<strong>준비!</strong> 첫 글자가 곧 나와요.';
  else if (active) feedback = '<strong>지금!</strong> 끝소리가 길게 이어지는지, 짧게 멈추는지 골라요.';
  else if (answered && timedOut) feedback = `<strong>시간이 지났어요.</strong> ‘${item.letter}’은 ${item.answer === 'open' ? '길게 이어져요' : '짧게 멈춰요'}.`;
  else if (answered && correct) feedback = `<strong>맞아요!</strong> ${item.answer === 'open' ? '끝소리가 길게 이어져요.' : '끝소리가 짧게 멈춰요.'}`;
  else if (answered) feedback = `<strong>다음에는 이렇게 골라요.</strong> ‘${item.letter}’은 ${item.answer === 'open' ? '길게 이어져요' : '짧게 멈춰요'}.`;

  return `<div class="activity-card letter-game-card">
    <div class="letter-game-head">
      <div><span class="eyebrow">젤리티처의 끝소리 게임</span><h2>끝소리를 길게 이어 말할 수 있을까요?</h2>
      <p>${ready ? '준비한 뒤, 글자가 나오면 빠르게 골라요.' : answered ? '다음 글자가 곧 자동으로 나와요.' : '글자를 보고 <em>끝소리</em>의 느낌을 빠르게 골라요.'}</p></div>
      <div class="letter-round">${progressNumber}<small>/${deck.length}</small></div>
    </div>
    <div class="letter-game-stage">
      ${target}
      ${active ? `<div class="letter-speed-window" aria-label="3초 응답 시간"><i style="--letter-game-speed:${state.letterGameSpeedMs}ms"></i></div>` : ''}
    </div>
    <div class="letter-gates" aria-label="끝소리 느낌 고르기">
      <button class="letter-gate open ${choiceClass('open')}" data-letter-game-choice="open" data-track="answer" data-correct="${item.answer === 'open'}" ${!active ? 'disabled' : ''}>
        <img class="gate-art" src="assets/jelly-vocalize-ah.png" alt="">
        <strong>길게 이어져요</strong><small>끝소리를 늘여 말할 수 있어요</small>
      </button>
      <button class="letter-gate closed ${choiceClass('closed')}" data-letter-game-choice="closed" data-track="answer" data-correct="${item.answer === 'closed'}" ${!active ? 'disabled' : ''}>
        <img class="gate-art" src="assets/jelly-brace-force.png" alt="">
        <strong>짧게 멈춰요</strong><small>끝소리를 늘여 말하기 어려워요</small>
      </button>
    </div>
    <div class="letter-game-feedback ${answered ? (correct ? 'success' : 'retry') : ''}" aria-live="polite">
      <span>${feedback}</span>
      ${answered && summary.lastMs !== null ? `<small>${(summary.lastMs / 1000).toFixed(1)}초</small>` : ''}
      ${ready ? '<button class="btn btn-primary" data-action="start-letter-game">3초 속도로 시작</button>' : ''}
    </div>
  </div>`;
}

function shuffledValues(values) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function shuffleFlipCards() {
  const pairs = shuffledValues(Array.from({ length: 100 }, (_, index) => {
    const [open, closed] = FLIP_LETTER_PAIRS[index % FLIP_LETTER_PAIRS.length];
    return { open, closed };
  }));
  const sides = shuffledValues([
    ...Array(Math.ceil(pairs.length / 2)).fill('open'),
    ...Array(Math.floor(pairs.length / 2)).fill('closed')
  ]);
  return pairs.map((pair, index) => ({
    id: `flip-${index}-${Math.random().toString(36).slice(2, 7)}`,
    open: pair.open,
    closed: pair.closed,
    side: sides[index]
  }));
}

function flipCounts(game = state.flipGame) {
  return game.cards.reduce((counts, card) => {
    counts[card.side] += 1;
    return counts;
  }, { open: 0, closed: 0 });
}

function flipSideLabel(side) {
  return side === 'open' ? '길게 이어지는 편' : '짧게 멈추는 편';
}

function flipTeamLabel(side) {
  return side === 'open' ? '보라팀' : '하늘팀';
}

function flipTeamAssignments(game = currentLessonFlipGame()) {
  return game.teamAssignments && typeof game.teamAssignments === 'object' ? game.teamAssignments : {};
}

function flipTeamMembers(side, game = currentLessonFlipGame()) {
  const assignments = flipTeamAssignments(game);
  return Object.keys(assignments).filter(id => assignments[id] === side);
}

function flipParticipantCount() {
  return Object.keys(state.participants || {}).length;
}

// 젤리티처와 1:1로 겨루는 판인가.
function soloFlipMode(game = currentLessonFlipGame()) {
  if (independentFlipMode) return true;
  // 판이 돌기 시작하면 시작할 때 정한 값을 지킨다 — 도중에 인원이 바뀌어도 판은 흔들리지 않는다.
  if (game.active || game.completed) return game.solo === true;
  // 시작 전에는 접속 인원이 곧 답이다. 그 수를 아는 것은 코치 화면뿐이라
  // 아동 화면은 코치가 보내 준 값(game.solo)을 쓴다.
  return coachSurface ? flipParticipantCount() <= 1 : game.solo === true;
}

// 참가자 목록은 코치 화면만 가지고 있다. 접속 상황이 바뀔 때마다 코치가 다시 판정해
// 게임 상태에 실어 보낸다. 진행 중에는 건드리지 않는다 — 판이 도중에 바뀌면 안 된다.
function refreshSoloFlipMode() {
  if (independentFlipMode || !coachSurface) return;
  const current = currentLessonFlipGame();
  if (current.active) return;
  const solo = flipParticipantCount() <= 1;
  if (current.solo === solo && state.flipGame.lessonId === state.lesson) return;
  state.flipGame = { ...current, lessonId: state.lesson, solo };
  syncFlipGame();
}

function currentParticipantFlipSide(game = currentLessonFlipGame()) {
  if (soloFlipMode(game)) return game.childSide;
  return childId ? flipTeamAssignments(game)[childId] || null : null;
}

function currentLessonFlipGame() {
  return state.flipGame.lessonId === state.lesson ? state.flipGame : createFlipGameState();
}

function setFlipAssignment(childSide) {
  const current = currentLessonFlipGame();
  if (!['open', 'closed'].includes(childSide) || current.active) return;
  state.flipGame = {
    ...current,
    lessonId: state.lesson,
    childSide,
    coachSide: childSide === 'open' ? 'closed' : 'open'
  };
  syncFlipGame();
  render(true);
}

function setFlipParticipantTeam(participantId, side) {
  const current = currentLessonFlipGame();
  if (!coachSurface || current.active || !participantId || !['open', 'closed'].includes(side)) return;
  state.flipGame = { ...current, lessonId: state.lesson, teamAssignments: { ...flipTeamAssignments(current), [participantId]: side } };
  syncFlipGame();
  render(true);
}

function balanceFlipTeams() {
  const current = currentLessonFlipGame();
  if (!coachSurface || current.active) return;
  const ids = Object.keys(state.participants || {}).sort((a, b) => a.localeCompare(b, 'ko'));
  const assignments = {};
  ids.forEach((id, index) => { assignments[id] = index % 2 === 0 ? 'open' : 'closed'; });
  state.flipGame = { ...current, lessonId: state.lesson, teamAssignments: assignments };
  syncFlipGame();
  render(true);
}

function swapFlipTeams() {
  const current = currentLessonFlipGame();
  if (!coachSurface || current.active) return;
  const assignments = Object.fromEntries(Object.entries(flipTeamAssignments(current)).map(([id, side]) => [id, side === 'open' ? 'closed' : 'open']));
  state.flipGame = { ...current, lessonId: state.lesson, teamAssignments: assignments };
  syncFlipGame();
  render(true);
}

function startFlipGame() {
  if (flipOpponentTimer) clearTimeout(flipOpponentTimer);
  if (flipClockTimer) clearInterval(flipClockTimer);
  const previous = currentLessonFlipGame();
  const solo = independentFlipMode || flipParticipantCount() <= 1;
  if (!solo && (!flipTeamMembers('open', previous).length || !flipTeamMembers('closed', previous).length)) return;
  const durationSeconds = [20, 30, 60].includes(previous.durationSeconds) ? previous.durationSeconds : 30;
  state.flipGame = {
    ...createFlipGameState(),
    lessonId: state.lesson,
    active: true,
    cards: shuffleFlipCards(),
    childSide: previous.childSide,
    coachSide: previous.coachSide,
    teamAssignments: { ...flipTeamAssignments(previous) },
    solo,
    maxTurns: 100,
    durationSeconds,
    // 카드 뒤집기 종료 시각은 두 화면이 공유하므로 벽시계여야 한다.
    // performance.now()는 탭마다 원점이 달라 여기서는 쓸 수 없다(반응시간 계측과 다른 용도).
    endsAt: Date.now() + durationSeconds * 1000,
    turn: 'child'
  };
  syncFlipGame();
  render(true);
}

function finishFlipGame() {
  const game = state.flipGame;
  if (!game.active) return;
  const counts = flipCounts(game);
  const childCount = counts[game.childSide];
  const coachCount = counts[game.coachSide];
  game.active = false;
  game.completed = true;
  game.winner = soloFlipMode(game)
    ? (childCount === coachCount ? 'tie' : childCount > coachCount ? 'child' : 'coach')
    : (counts.open === counts.closed ? 'tie' : counts.open > counts.closed ? 'open' : 'closed');
  if (flipOpponentTimer) clearTimeout(flipOpponentTimer);
  flipOpponentTimer = null;
  if (flipClockTimer) clearInterval(flipClockTimer);
  flipClockTimer = null;
  syncFlipGame();
  render(true);
}

function passFlipTurn(actor) {
  const game = state.flipGame;
  if (!game.active || game.turn !== actor) return;
  game.turn = actor === 'child' ? 'coach' : 'child';
  game.lastMove = { actor, passed: true, turnNumber: game.turns };
  syncFlipGame();
  render(true);
}

function makeFlipMove(cardId, actor, participantId = null) {
  const game = state.flipGame;
  if (!game.active) return;
  const actorSide = ['open', 'closed'].includes(actor) ? actor : actor === 'child' ? game.childSide : game.coachSide;
  const card = game.cards.find(item => item.id === cardId);
  if (!card || card.side === actorSide) return;
  const from = card.side;
  card.side = actorSide;
  game.turns += 1;
  game.lastMove = {
    actor,
    participantId,
    cardId,
    from,
    to: actorSide,
    open: card.open,
    closed: card.closed,
    turnNumber: game.turns
  };
  game.turn = actor === 'child' ? 'coach' : 'child';
  syncFlipGame();
  render(true);
}

// 젤리티처는 한 화면에서만 움직여야 한다. 두 화면이 각자 돌리면 한 번에 두 장이 넘어간다.
// 코칭 수업에서는 코치 화면이, 자율학습에서는 아동 화면이 상대 역할을 맡는다.
function jellyDrivesHere() {
  return independentFlipMode || coachSurface;
}

function scheduleJellyFlip() {
  if (!jellyDrivesHere() || flipOpponentTimer) return;
  const game = state.flipGame;
  if (!game.active || game.lessonId !== state.lesson || !soloFlipMode(game)) return;
  flipOpponentTimer = setTimeout(() => {
    flipOpponentTimer = null;
    const current = state.flipGame;
    if (!current.active) return;
    const choices = current.cards.filter(card => card.side !== current.coachSide);
    if (choices.length) makeFlipMove(choices[Math.floor(Math.random() * choices.length)].id, 'coach');
    else scheduleJellyFlip();
  }, 520 + Math.floor(Math.random() * 260));
}

function remainingFlipSeconds(game = state.flipGame) {
  if (!game.active || !game.endsAt) return game.completed ? 0 : (game.durationSeconds || 30);
  return Math.max(0, Math.ceil((game.endsAt - Date.now()) / 1000));
}

function scheduleFlipClock() {
  if (flipClockTimer) clearInterval(flipClockTimer);
  flipClockTimer = null;
  const game = state.flipGame;
  if (!game.active || !game.endsAt) return;
  const tick = () => {
    const remaining = remainingFlipSeconds();
    document.querySelectorAll('.flip-time-value').forEach(node => { node.textContent = remaining; });
    if (remaining <= 0) finishFlipGame();
  };
  tick();
  if (state.flipGame.active) flipClockTimer = setInterval(tick, 200);
}

function flipGameView() {
  const game = currentLessonFlipGame();
  const counts = flipCounts(game);
  const solo = soloFlipMode(game);
  const opponentName = solo ? '젤리티처' : '코치';
  const myTeamSide = currentParticipantFlipSide(game);
  const openMembers = flipTeamMembers('open', game);
  const closedMembers = flipTeamMembers('closed', game);
  const childCount = counts[game.childSide] || 0;
  const coachCount = counts[game.coachSide] || 0;
  const canAct = game.active && !coachSurface && (solo || myTeamSide);
  const actingSide = solo ? game.childSide : myTeamSide;
  const winnerText = game.winner === 'tie'
    ? '두 편이 같은 수로 마쳤어요!'
    : solo
      ? (game.winner === 'child' ? '아동 편이 더 많이 보여요!' : `${opponentName} 편이 더 많이 보여요!`)
      : `${flipTeamLabel(game.winner)}이 더 많이 보여요!`;

  const cards = game.cards.map(card => {
    const disabled = !canAct || !actingSide || card.side === actingSide;
    const last = game.lastMove?.cardId === card.id;
    const visibleLetter = card.side === 'open' ? card.open : card.closed;
    return `<button class="flip-card side-${card.side} ${last ? 'is-last' : ''}" data-flip-card="${card.id}" ${disabled ? 'disabled' : ''} aria-label="${visibleLetter}, ${flipSideLabel(card.side)}">
      <span class="flip-card-inner"><span class="flip-card-face open"><strong>${card.open}</strong></span><span class="flip-card-face closed"><strong>${card.closed}</strong></span></span>
    </button>`;
  }).join('');

  const childTeamReady = !solo && !coachSurface
    ? (myTeamSide
      ? `<div class="flip-my-team side-${myTeamSide}"><small>내가 참가할 편</small><strong>${flipTeamLabel(myTeamSide)}</strong><span>${flipSideLabel(myTeamSide)}</span></div>`
      : '<div class="flip-my-team waiting"><small>편 배정 대기</small><strong>코치가 편을 나누고 있어요</strong><span>배정이 끝나면 내 편이 여기에 표시돼요.</span></div>')
    : '';
  const readyPanel = `<div class="flip-ready-panel">
    <img src="assets/jelly-confidence-3.png" alt="카드 뒤집기를 준비하는 젤리티처">
    <div><span class="eyebrow">정해진 시간 동안 최대한 많이</span><h3>${solo ? '젤리티처와 빠르게 뒤집어요' : coachSurface ? '참가 아동을 두 편으로 나눠요' : '우리 편과 함께 준비해요'}</h3>
    <p>상대편 색 카드를 보이는 즉시 눌러 내 편 글자로 바꿔요.</p>
    ${childTeamReady}
    ${independentFlipMode ? '<button class="btn btn-primary" data-action="flip-start">30초 게임 시작</button>' : coachSurface ? '' : `<small>${solo ? '코치가 시작하면 젤리티처와 겨뤄요.' : '코치가 시작하면 모든 아동 화면에서 동시에 시작해요.'}</small>`}</div>
  </div>`;

  const participantIds = Object.keys(state.participants || {}).sort((a, b) => a.localeCompare(b, 'ko'));
  const teamParticipantRows = participantIds.length ? participantIds.map(id => {
    const assigned = flipTeamAssignments(game)[id];
    return `<div class="flip-team-participant"><span>${esc(id)}</span><div role="group" aria-label="${esc(id)} 편 배정"><button class="team-open ${assigned === 'open' ? 'selected' : ''}" data-flip-team-child="${esc(id)}" data-flip-team-side="open" ${game.active ? 'disabled' : ''}>보라팀</button><button class="team-closed ${assigned === 'closed' ? 'selected' : ''}" data-flip-team-child="${esc(id)}" data-flip-team-side="closed" ${game.active ? 'disabled' : ''}>하늘팀</button></div></div>`;
  }).join('') : '<p class="flip-team-empty">참가 아동이 접속하면 이곳에 표시됩니다.</p>';
  const teamsReady = openMembers.length > 0 && closedMembers.length > 0;
  const coachControls = coachSurface ? `<aside class="flip-coach-controls" aria-label="코치 게임 설정">
    ${solo ? `<div class="flip-team-builder"><div class="flip-team-builder-head"><strong>젤리티처와 1:1</strong><span>참가 아동 ${participantIds.length}명</span></div>
    <p class="flip-team-empty">아이가 한 명이면 편을 가르지 않고 젤리티처가 상대편을 맡아요. 두 명 이상 접속하면 편 나누기가 나타나요.</p></div>` : ''}
    ${solo ? '' : `<div class="flip-team-builder"><div class="flip-team-builder-head"><strong>참가 아동 편 나누기</strong><span>보라팀 ${openMembers.length}명 · 하늘팀 ${closedMembers.length}명</span><button data-action="flip-balance-teams" ${game.active || participantIds.length < 2 ? 'disabled' : ''}>자동 균등 배정</button><button data-action="flip-swap-teams" ${game.active || !participantIds.length ? 'disabled' : ''}>양 편 바꾸기</button></div><div class="flip-team-participants">${teamParticipantRows}</div></div>`}
    <div class="flip-time-settings"><strong>게임 시간</strong><button class="${(game.durationSeconds || 30) === 20 ? 'selected' : ''}" data-flip-length="20" ${game.active ? 'disabled' : ''}>20초</button><button class="${(game.durationSeconds || 30) === 30 ? 'selected' : ''}" data-flip-length="30" ${game.active ? 'disabled' : ''}>30초</button><button class="${game.durationSeconds === 60 ? 'selected' : ''}" data-flip-length="60" ${game.active ? 'disabled' : ''}>60초</button></div>
    <div class="flip-coach-actions"><button class="btn btn-primary" data-action="flip-start" ${!game.active && !solo && !teamsReady ? 'disabled' : ''}>${game.active ? '처음부터 시작' : solo ? '젤리티처와 시작' : '두 편 동시에 시작'}</button>${game.active ? '<button class="btn btn-ghost" data-action="flip-end">지금 종료</button>' : !solo && !teamsReady ? '<small>두 편에 한 명 이상 배정하면 시작할 수 있어요.</small>' : ''}</div>
  </aside>` : '';

  const lastMoveText = !game.lastMove ? '' : solo
    ? (game.lastMove.passed ? `${game.lastMove.actor === 'child' ? '아동은' : `${opponentName}는`} 뒤집을 카드가 없어 차례를 넘겼어요.` : `${game.lastMove.actor === 'child' ? '아동이' : `${opponentName}가`} ${game.lastMove.open}↔${game.lastMove.closed} 카드를 뒤집었어요.`)
    : `${game.lastMove.participantId ? `${esc(game.lastMove.participantId)} · ` : ''}${flipTeamLabel(game.lastMove.to)}이 ${game.lastMove.open}↔${game.lastMove.closed} 카드를 뒤집었어요.`;

  return `<div class="activity-card flip-game-card">
    <div class="flip-game-head"><div><span class="eyebrow">끝소리 카드 뒤집기</span><h2>${game.completed ? winnerText : '우리 편 글자가 더 많이 보이게 해요'}</h2><p>카드 앞뒤에는 서로 짝이 되는 글자가 들어 있어요.</p></div><div class="flip-turn-count"><b class="flip-time-value">${remainingFlipSeconds(game)}</b><span>초</span></div></div>
    ${coachControls}
    ${game.active || game.completed ? `<div class="flip-scoreboard">
      <section class="child"><small>${solo ? `아동 · ${flipSideLabel(game.childSide)}` : `${flipTeamLabel('open')} · ${flipSideLabel('open')} · ${openMembers.length}명`}</small><strong>${solo ? childCount : counts.open}</strong></section>
      <div class="flip-turn-status"><span>${game.completed ? '게임 끝' : '빠르게 뒤집어요'}</span><b>${game.completed ? winnerText : `${solo ? '젤리티처와 동시에 진행해요' : '두 편이 동시에 진행해요'} · ${game.turns}장 뒤집음`}</b></div>
      <section class="coach"><small>${solo ? `${opponentName} · ${flipSideLabel(game.coachSide)}` : `${flipTeamLabel('closed')} · ${flipSideLabel('closed')} · ${closedMembers.length}명`}</small><strong>${solo ? coachCount : counts.closed}</strong></section>
    </div>${lastMoveText ? `<div class="flip-last-move">${lastMoveText}</div>` : ''}<div class="flip-card-grid">${cards}</div>${game.completed ? '<button class="btn btn-secondary flip-restart" data-action="flip-start">같은 편으로 다시 하기</button>' : ''}` : readyPanel}
  </div>`;
}
function sameNumberSet(left, right) {
  return left.length === right.length && left.every(value => right.includes(value));
}

function soundRoundComplete(step) {
  const round = step.rounds[state.soundRound] || step.rounds[0];
  return sameNumberSet(state.soundChoice, round.targets);
}

function soundTargetType(round, index) {
  return (round.liaisonTargets || []).includes(index) ? 'liaison' : 'tensing';
}

function soundChangeView(step) {
  const round = step.rounds[state.soundRound] || step.rounds[0];
  const soundCorrect = sameNumberSet(state.soundChoice, round.targets);
  const complete = soundCorrect;
  const lastRound = state.soundRound === step.rounds.length - 1;
  const chosenAreSubset = state.soundChoice.every(value => round.targets.includes(value));
  let feedback = '한 글자씩 들은 소리와 이어 들은 소리를 비교해 보세요.';
  if (!soundCorrect && state.soundChoice.length > 0 && chosenAreSubset) feedback = '맞는 곳을 찾았어요. 소리가 달라지는 글자가 더 있는지 살펴보세요.';
  else if (!soundCorrect && state.soundChoice.length > 0) feedback = '한 글자씩 들은 소리와 이어 들은 소리를 다시 비교해 보세요.';
  else if (complete) feedback = `맞아요. ${round.change}`;
  return `<div class="activity-card sound-game">
    <div class="sound-game-head">
      <div><span class="eyebrow">소리 변화 비교 게임</span><h2>글자는 그대로인데, 어떤 소리가 달라졌을까요?</h2></div>
      <span class="round-chip">${state.soundRound + 1} / ${step.rounds.length}</span>
    </div>
    <aside class="jelly-guide">
      <div class="jelly-guide-copy">
        <span>젤리티처의 관찰 팁</span>
        <p>한 글자씩 들은 소리와 이어 읽은 소리를 비교해요.<br>소리가 달라지는 글자는 빠짐없이 모두 골라요.</p>
      </div>
      <img src="assets/jelly-confidence-2.png" alt="소리가 어떻게 달라졌는지 생각하는 젤리티처">
    </aside>
    <div class="sound-compare">
      <section class="sound-stage">
        <span class="sound-stage-label">1. 한 글자씩 들어 보기</span>
        <div class="separate-syllables">
          ${round.syllables.map(syllable => `<button class="sound-syllable" data-action="speak" data-text="${syllable}" aria-label="${syllable} 소리 듣기"><b>${syllable}</b></button>`).join('')}
        </div>
      </section>
      <section class="sound-stage connected">
        <span class="sound-stage-label">2. 낱말로 이어 듣기</span>
        <button class="connected-word" data-action="speak" data-text="${round.word}" aria-label="${round.word} 이어 듣기">${round.word}</button>
      </section>
    </div>
    <div class="sound-question">
      <div class="syllable-find-step sound-find-only">
        <span class="question-number">1</span><h3>소리가 달라지는 글자를 모두 고르세요</h3>
        <div class="sound-choices">
          ${round.syllables.map((syllable, index) => {
            const selected = state.soundChoice.includes(index);
            const status = selected ? (round.targets.includes(index) ? 'correct' : 'wrong') : '';
            const soundType = status === 'correct' ? soundTargetType(round, index) : '';
            return `<button class="sound-choice ${status} ${soundType}" data-sound-choice="${index}" data-track="answer" data-correct="${round.targets.includes(index)}" aria-pressed="${selected}">${syllable}</button>`;
          }).join('')}
        </div>
        <div class="sound-answer-legend"><span><i class="tensing"></i>첫소리가 세게 들려요</span><span><i class="liaison"></i>앞의 끝소리가 이어져요</span></div>
      </div>
      <div class="sound-feedback">${feedback}</div>
      ${complete && !lastRound ? '<button class="btn btn-primary" data-action="next-sound-word">다음 낱말</button>' : ''}
      ${complete && lastRound ? '<div class="sound-complete">소리가 달라지는 곳을 모두 찾았어요.</div>' : ''}
    </div>
  </div>`;
}

const COLOR_OBSERVATION_PALETTE = [
  { name: '블루', className: 'blue' },
  { name: '보라', className: 'violet' },
  { name: '민트', className: 'mint' },
  { name: '코랄', className: 'coral' }
];

function normalizedObservationItem(item, index) {
  return typeof item === 'string'
    ? { word: item, itemIndex: index, exposure: 'unseen' }
    : { ...item, itemIndex: index };
}

// 선생님 카드는 아동 카드의 절반만 넣는다 — 읽을 기회를 갖는 것이 관찰의 목적이라
// 아동 색이 확실히 더 자주 나와야 한다.
const COACH_CARD_RATIO = 0.5;

// 색 주인 정하기 — 아이가 둘 이상이면 아이들끼리 색을 나눠 갖고(선생님은 색 없이 진행만 한다),
// 1:1이면 남은 한 색을 선생님이 갖는다.
function assignObservationSeating() {
  const ids = Object.keys(state.participants || {}).sort((a, b) => a.localeCompare(b, 'ko'));
  if (ids.length >= 2) {
    const count = Math.min(ids.length, COLOR_OBSERVATION_PALETTE.length);
    const seats = {};
    ids.forEach((id, index) => { seats[id] = index % count; });
    return { count, seats, childColors: Array.from({ length: count }, (_, index) => index), coachColor: null };
  }
  const childColor = state.colorObservationMyColor === 1 ? 1 : 0;
  return {
    count: 2,
    seats: ids.length ? { [ids[0]]: childColor } : {},
    childColors: [childColor],
    coachColor: childColor === 0 ? 1 : 0
  };
}

function currentObservationSeating() {
  return state.colorObservationSeating || assignObservationSeating();
}

// 내 색 — 코치는 1:1에서만 색을 갖는다(그룹에서는 null, 즉 읽을 카드가 없다).
function myObservationColor(seating = currentObservationSeating()) {
  if (coachSurface) return seating.coachColor;
  if (childId && seating.seats[childId] !== undefined) return seating.seats[childId];
  return seating.childColors[0];
}

function observationCardOwner(card, seating = currentObservationSeating()) {
  if (!card) return null;
  if (seating.coachColor !== null && card.color === seating.coachColor) return { kind: 'coach', id: null, label: '선생님' };
  const ids = Object.keys(seating.seats).filter(id => seating.seats[id] === card.color);
  return { kind: 'child', id: ids[0] || null, label: ids[0] || '아동' };
}

// 덱 길이는 인원에 비례한다. 목표 낱말을 아이들끼리 나눠 가지면 넷일 때 한 아이가
// 한두 낱말만 읽게 되는데, 그 정도로는 그 아이의 기준선이 되지 못한다.
// 그래서 **아이마다 목표 낱말 전부**를 주고, 대신 덱이 길어지는 쪽을 택한다.
// 선생님 카드는 1:1에서만 넣는다 — 그룹에서는 다른 아이 차례가 그 역할을 대신한다.
function observationDeckPlan(step, seating = currentObservationSeating()) {
  const perChild = (step.items || []).length;
  const seats = seating.childColors.length;
  const budget = Math.max(0, (step.rounds || perChild * 2) - perChild);
  const coach = seating.coachColor === null ? 0 : Math.min(budget, Math.round(perChild * COACH_CARD_RATIO));
  return { perChild, seats, coach, total: perChild * seats + coach };
}

function buildColorObservationDeck(step) {
  const items = (step.items || []).map(normalizedObservationItem);
  const seating = currentObservationSeating();
  const plan = observationDeckPlan(step, seating);
  const ownCards = seating.childColors.flatMap((color, seatIndex) => items.map((item, index) => ({
    id: `target-${state.lesson}-${seatIndex}-${index}`,
    ...item,
    color,
    observed: true
  })));
  const fillerItems = step.fillerItems || [];
  const extraCards = Array.from({ length: plan.coach }, (_, index) => ({
    id: `filler-${state.lesson}-${index}`,
    word: fillerItems[index % fillerItems.length] || '쉬어 가요',
    itemIndex: null,
    exposure: 'filler',
    color: seating.coachColor,
    observed: false
  }));
  return shuffledValues([...ownCards, ...extraCards]);
}

function ensureIndependentColorObservation(step) {
  if (serviceMode !== 'independent' || state.colorObservationDeck.length) return;
  state.colorObservationCount = 2;
  state.colorObservationMyColor = 0;
  state.colorObservationSeating = assignObservationSeating();
  state.colorObservationDeck = buildColorObservationDeck(step);
}

// 개입 전 관찰의 낱말 판정 — 전이(T1~T3)와 달리 **훈련 전 상태를 재는 자리**라
// 기록이 섞이지 않게 별도 액션으로 둔다(08번 §5 관찰구간).
function observationJudgement(word) {
  if (!coachSurface) return '';
  return `<div class="item-observation coach-observation">
    <div class="coach-observation-title"><strong>코치 기록</strong><span>${esc(word)}</span></div>
    <button data-observation-result="accurate">처음부터 정확</button>
    <button data-observation-result="self-corrected">스스로 고쳐 읽음</button>
    <button data-observation-result="support">도움 필요</button>
  </div>`;
}

function colorObservationView(step) {
  ensureIndependentColorObservation(step);
  const started = state.colorObservationDeck.length > 0;
  const canConfigure = coachSurface;
  // 카드를 뒤집고 넘기는 것은 코치가 쥔다 — 읽기 양상을 보면서 진행해야 하기 때문이다.
  // 자율학습에는 코치가 없으므로 아동이 직접 넘긴다.
  const canAdvance = serviceMode === 'independent' || coachSurface;
  const seating = currentObservationSeating();
  const groupPlay = seating.coachColor === null;
  // 시작 전에 분량을 알려 준다 — 인원에 따라 덱 길이가 달라지므로 코치가 미리 가늠해야 한다.
  const plan = observationDeckPlan(step, seating);
  const palette = COLOR_OBSERVATION_PALETTE.slice(0, seating.count);
  const childColor = COLOR_OBSERVATION_PALETTE[seating.childColors[0]];
  const myColorIndex = myObservationColor(seating);
  const myColor = myColorIndex === null ? null : COLOR_OBSERVATION_PALETTE[myColorIndex];
  const card = state.colorObservationDeck[state.colorObservationIndex];
  const owner = observationCardOwner(card, seating);
  const isMine = myColorIndex !== null && !!card && card.color === myColorIndex;
  const seatRows = Object.keys(seating.seats).sort((a, b) => a.localeCompare(b, 'ko')).map(id => {
    const color = COLOR_OBSERVATION_PALETTE[seating.seats[id]];
    return `<div class="color-seat"><span>${esc(id)}</span><strong class="color-swatch ${color.className}"><i></i>${color.name}</strong></div>`;
  }).join('');

  if (state.colorObservationDone) return `<div class="activity-card color-observation-card color-observation-complete">
    <img src="assets/jelly-confidence-3.png" alt="색깔 카드 활동을 마친 젤리티처">
    <span class="eyebrow">색깔 카드 활동 완료</span>
    <h2>내 색 카드를 모두 읽었어요</h2>
    <p>이제 오늘의 읽기를 시작해요.</p>
  </div>`;

  return `<div class="activity-card color-observation-card">
    <header class="color-observation-head ${!started && !canConfigure ? 'waiting-head' : ''}">
      <div><span class="eyebrow">컬러카드 뒤집기</span><h2>${step.heading}</h2><p>${step.description}</p></div>
      ${started || canConfigure ? '<img src="assets/jelly-listen-v2.png" alt="자기 색을 기다리는 젤리티처">' : ''}
    </header>
    ${!started && canConfigure ? `<section class="color-observation-setup">
      ${groupPlay
        ? `<div class="color-seat-list"><span>아이들이 색을 나눠 가져요</span><div>${seatRows}</div></div>`
        : `<div class="my-color-setting"><span>아동의 색</span><div>${palette.map((color, index) => `<button class="color-swatch ${color.className} ${seating.childColors[0] === index ? 'selected' : ''}" data-my-color="${index}" aria-pressed="${seating.childColors[0] === index}"><i></i>${color.name}</button>`).join('')}</div></div>`}
      <div class="color-observation-ready"><strong>${groupPlay
        ? `참가 아동 ${Object.keys(seating.seats).length}명이 각자 색을 맡아요`
        : `<i class="${childColor.className}"></i>아동은 ${childColor.name} · 선생님은 ${COLOR_OBSERVATION_PALETTE[seating.coachColor].name}`}</strong><span>${groupPlay
        ? `선생님은 색 없이 진행과 기록을 맡아요. 카드 ${plan.total}장 · 한 명이 ${plan.perChild}장씩 읽어요.`
        : `아동 색 카드가 선생님 카드보다 많이 나와요. 카드 ${plan.total}장 · 아동 ${plan.perChild}장, 선생님 ${plan.coach}장.`}</span><button class="btn btn-primary" data-action="start-color-observation">카드 섞고 시작</button></div>
    </section>` : !started ? `<section class="color-observation-waiting">
      <div class="waiting-card-back"><img src="assets/color-card-back-light.png" alt="뒤집기 전 카드 뒷면"></div>
      <p>카드를 준비하고 있어요.</p>
    </section>` : `<section class="color-observation-play">
      <div class="color-observation-progress"><span>${state.colorObservationIndex + 1} / ${state.colorObservationDeck.length}</span><i><b style="width:${(state.colorObservationIndex / state.colorObservationDeck.length) * 100}%"></b></i>${myColor ? `<strong><i class="${myColor.className}"></i>내 색 ${myColor.name}</strong>` : '<strong>진행·기록</strong>'}</div>
      <div class="color-card-stage">
        <div class="color-card-stack" aria-hidden="true"></div>
        <button class="color-flip-card ${state.colorObservationRevealed ? `is-revealed ${COLOR_OBSERVATION_PALETTE[card.color].className}` : 'is-card-back'}" data-action="flip-color-observation" ${state.colorObservationRevealed || !canAdvance ? 'disabled' : ''} aria-label="${state.colorObservationRevealed ? `${card.word} 카드` : '컬러카드 뒤집기'}">
          ${state.colorObservationRevealed ? `<strong>${card.word}</strong>` : '<img class="color-card-back-image" src="assets/color-card-back-light.png" alt=""><span>카드 뒤집기</span>'}
        </button>
      </div>
      <div class="color-observation-feedback ${state.colorObservationRevealed ? (isMine ? 'my-turn' : 'other-turn') : ''}" aria-live="polite">
        ${!state.colorObservationRevealed
          ? `<span>${canAdvance ? '카드를 눌러 어떤 색과 낱말이 나오는지 확인해요.' : '선생님이 카드를 뒤집어요.'}</span>`
          : coachSurface
            ? `<span>${owner.kind === 'coach' ? '선생님 차례예요.' : `<b>${esc(owner.label)}</b> · ${COLOR_OBSERVATION_PALETTE[card.color].name} 차례예요.`}</span>${owner.kind === 'child' ? observationJudgement(card.word) : ''}<button class="btn btn-secondary" data-action="next-color-observation-card">다음 카드</button>`
            : isMine
              ? `<span><b>내 색이에요.</b> 보이는 낱말을 소리 내어 읽어요.</span>${canAdvance ? `<button class="btn btn-primary" data-action="complete-color-observation-card">읽었어요</button>` : ''}`
              : `<span>${COLOR_OBSERVATION_PALETTE[card.color].name} 차례예요.</span>${canAdvance ? '<button class="btn btn-secondary" data-action="next-color-observation-card">다음 카드</button>' : ''}`}
      </div>
    </section>`}
  </div>`;
}

function armColorObservationTiming() {
  const step = state.lesson ? lessons[state.lesson]?.steps[state.step] : null;
  const card = state.colorObservationDeck[state.colorObservationIndex];
  // 카드가 보인 순간부터 잰다 — 수업에서는 코치가 판정할 때, 자율학습에서는 아동이 「읽었어요」를 누를 때 쓰인다.
  if (step?.type !== 'colorobservation' || !state.colorObservationRevealed || !card) {
    colorObservationTimingKey = null;
    colorObservationVisibleAt = null;
    return;
  }
  const key = `${state.lesson}:${state.step}:${state.colorObservationIndex}:${card.id}`;
  if (colorObservationTimingKey === key) return;
  colorObservationTimingKey = key;
  colorObservationVisibleAt = performance.now();
}

function currentGeneralizationItems(level) {
  if (!level.pool) return level.items;
  const count = level.items.length;
  const start = (level.poolStart + (state.generalizationSet * count)) % level.pool.length;
  return Array.from({ length: count }, (_, index) => level.pool[(start + index) % level.pool.length]);
}

// ── 전이(T1~T3) 수행결과와 판정 ──────────────────────────────────────
// 세 값을 분리한다.
//   ① 활동을 다음 단계까지 진행할 수 있는가   → canOpenNextTransferLevel()
//   ② 수행결과가 정답·오답·미판정 중 무엇인가 → RESULT
//   ③ 그 결과를 독립 전이 통과 판정에 쓸 수 있는가 → countsAsIndependentTransfer()
// 영문 코드는 정본 확정 전까지 내부 명칭이다(12번 보완서 §12).
const RESULT = {
  ACCURATE: 'accurate',             // 처음부터 정확 — 독립 정확
  SELF_CORRECTED: 'self-corrected', // 스스로 고쳐 읽음 — 독립 정확
  SUPPORT: 'support',               // 도움 받은 수행 — 결과는 보존하되 독립 통과율의 분자에서 제외
  AWAITING: 'awaiting-judgement',   // 판정 대기 — 수행 중
  UNMEASURED: 'unmeasured',         // 못 쟀음 — 활동이 끝났는데 판정값을 얻지 못함
  SKIPPED: 'skipped',               // 건너뜀
  ABORTED: 'aborted'                // 중단
};
const INDEPENDENT_CORRECT = [RESULT.ACCURATE, RESULT.SELF_CORRECTED];
// 정오를 확인할 수 있어 통과율의 분모에 들어가는 값
const JUDGED_RESULTS = [...INDEPENDENT_CORRECT, RESULT.SUPPORT];
// 판정 대기·못 쟀음·중단·건너뜀 — 분자와 분모에서 모두 제외한다
const UNSCORABLE_RESULTS = [RESULT.AWAITING, RESULT.UNMEASURED, RESULT.SKIPPED, RESULT.ABORTED];

// 판정 근거가 부족하면 통과·미통과로 단정하지 않는다 — 전체 문항의 절반 이상이
// 판정됐을 때만 해석한다. 그 미만은 판정값이 없는 것과 같이 다룬다.
const MIN_JUDGED_RATIO = 0.5;

// 통과율에는 ⑴ 유효한 판정값이 있고 ⑵ 정오를 확인할 수 있는 문항만 분모에 넣고,
// 그 중 ⑶ 독립수행 조건을 충족한 문항만 분자에 넣는다.
function scoreTransferLevel(records, level, itemCount) {
  const list = records || [];
  const total = itemCount || list.length;
  const judged = list.filter(result => JUDGED_RESULTS.includes(result)).length;
  const independent = list.filter(result => INDEPENDENT_CORRECT.includes(result)).length;
  const rate = judged ? independent / judged : null;
  const coverage = total ? judged / total : 0;
  // 판정 건수가 모자라면 비율이 아무리 높아도 통과로 해석하지 않는다.
  const interpretable = judged > 0 && coverage >= MIN_JUDGED_RATIO;
  // 08번 §11의 초기 운영값(T1 8/10 · T2·T3 4/5 = 80%)을 비율로 환산해 쓴다.
  const threshold = total ? level.passAt / total : 0;
  return {
    total, judged, independent, rate, threshold, coverage, interpretable,
    firstTry: list.filter(result => result === RESULT.ACCURATE).length,
    selfCorrected: list.filter(result => result === RESULT.SELF_CORRECTED).length,
    supported: list.filter(result => result === RESULT.SUPPORT).length,
    unscorable: list.filter(result => UNSCORABLE_RESULTS.includes(result)).length,
    // 판정값이 없거나 부족하면 통과·미통과·일반화 성공으로 해석하지 않는다.
    verdict: !interpretable ? 'unjudged' : rate >= threshold ? 'met' : 'below'
  };
}

// ① 진행 — 평가 판정과 분리한다.
function canOpenNextTransferLevel(score) {
  // 독립학습: T1의 정오를 확인할 수 없어도 훈련을 위해 T2·T3를 열어 둔다.
  if (serviceMode !== 'coaching') return true;
  // 코칭: 기준 미달이면 자동 진행을 멈추고 복습을 권장한다(08번 §11-5).
  if (score.verdict === 'met') return true;
  // 다만 코치가 진단·추가 훈련이 필요하다고 판단하면 재개할 수 있다.
  return !!state.transferCoachContinued[state.generalizationLevel];
}

// ③ 이 수준의 결과를 독립적인 전이 통과 판정에 쓸 수 있는가.
function countsAsIndependentTransfer(levelIndex, score) {
  if (score.verdict !== 'met') return false;
  // 코치 판단으로 재개한 뒤의 수준은 지원·탐색 맥락이므로 독립 통과로 쓰지 않는다.
  return state.transferContext[levelIndex] !== 'coach-continued';
}

// 다음 전이수준으로 넘어갈 때 진입 맥락을 남긴다.
// 코치가 기준 미달 상태에서 재개했다면 그 뒤의 수준은 「코치 판단으로 계속 진행 · 지원 후 수행 ·
// 전이수준 탐색」 맥락이 되고, 독립적인 T2·T3 통과 판정에는 사용하지 않는다.
function enterNextTransferLevel(levelCount) {
  const from = state.generalizationLevel;
  const next = Math.min(levelCount - 1, from + 1);
  const carried = !!state.transferCoachContinued[from] || state.transferContext[from] === 'coach-continued';
  state.transferContext[next] = carried ? 'coach-continued' : 'standard';
  state.generalizationLevel = next;
}

// 활동이 끝났는데 판정값이 없는 문항을 「못 쟀음」으로 확정한다(도움 필요로 채우지 않는다).
function sealUnjudgedItems(records, itemCount) {
  for (let index = 0; index < records.length; index += 1) {
    if (records[index] === RESULT.AWAITING) records[index] = RESULT.UNMEASURED;
  }
  while (records.length < itemCount) records.push(RESULT.UNMEASURED);
  return records;
}

function legacyGeneralizationView(step) {
  const level = step.levels[state.generalizationLevel] || step.levels[0];
  const items = currentGeneralizationItems(level);
  const records = state.generalizationRecords[state.generalizationLevel] || [];
  const complete = records.length === items.length;
  const isLast = state.generalizationLevel === step.levels.length - 1;
  const score = scoreTransferLevel(records, level, items.length);
  const passed = complete && score.verdict === 'met';
  const canAdvance = complete && canOpenNextTransferLevel(score);
  const currentIndex = Math.min(records.length, items.length - 1);
  const currentItem = items[currentIndex];
  return `<div class="activity-card generalization-card">
    <div class="generalization-head">
      <div><span class="eyebrow">그림책과 분리된 새 자료</span><h2>책 밖의 낱말과 문장에서도 읽어 봐요</h2></div>
      <img src="assets/jelly-teacher.png" alt="새 자료 읽기를 안내하는 젤리티처">
    </div>
    <div class="level-track">
      ${step.levels.map((item, index) => `<button class="level-node ${(state.generalizationRecords[index] || []).length ? 'has-data' : ''} ${index === state.generalizationLevel ? 'current' : ''}" data-generalization-level="${index}" aria-pressed="${index === state.generalizationLevel}" ${childSubPageLocked() ? 'disabled' : ''}><strong>${item.code}</strong><span>${item.label}</span></button>`).join('')}
    </div>
    <section class="generalization-task">
      <div class="generalization-task-title"><span>${level.code}</span><div><strong>${level.label}</strong><p>${level.instruction}</p></div></div>
      ${level.pool && records.length === 0 ? `<button class="redraw-set" data-action="redraw-generalization" ${childSubPageLocked() ? 'disabled' : ''}>${level.kind === 'nonwords' ? '새 비단어 세트 뽑기' : '새 단어 세트 뽑기'} <small>${level.pool.length}개 풀</small></button>` : ''}
      ${!complete ? `<div class="generalization-run">
        <div class="generalization-run-head"><span>${records.length + 1} / ${items.length}</span><div class="run-progress"><i style="width:${(records.length / items.length) * 100}%"></i></div></div>
        <div class="generalization-current ${level.kind}">${currentItem}</div>
        ${level.kind === 'nonwords' ? '<p class="nonword-note">뜻을 찾지 말고, 글자를 보며 처음 읽는 소리로 읽어요.</p>' : ''}
        ${showPerformanceRecording ? `<div class="item-observation ${coachSurface ? 'coach-observation' : ''}">
          ${coachSurface ? '<div class="coach-observation-title"><strong>코치 기록</strong><span>아동 화면에는 표시되지 않습니다.</span></div>' : ''}
          <button data-generalization-item-result="accurate">처음부터 정확</button>
          <button data-generalization-item-result="self-corrected">스스로 고쳐 읽음</button>
          <button data-generalization-item-result="support">도움 필요</button>
        </div>` : ''}
      </div>` : `<div class="generalization-score" data-track="activity-complete" data-activity-id="transfer-${level.code.toLowerCase()}">
        <strong>${score.independent} / ${score.judged}</strong><span>${score.judged ? '정오를 확인한 문항 중 도움 없이 읽은 수' : '정오를 확인한 문항 없음'}</span>
        <p>처음부터 정확 ${score.firstTry} · 스스로 고침 ${score.selfCorrected} · 도움 필요 ${score.supported}${score.unscorable ? ` · 못 쟀음 ${score.unscorable}` : ''}</p>
        <small>${score.verdict === 'unjudged'
          ? (score.judged
              ? `${score.total}문항 중 ${score.judged}문항만 정확성을 확인해, 통과·미통과로 해석하지 않아요.`
              : `${score.total}문항을 수행했지만 정확성을 확인하지 못해 통과·미통과로 해석하지 않아요.`)
          : `다음 단계 진행값 ${level.passAt}/${items.length} · 최종 일반화 판정과는 구분해요.`}</small>
      </div>`}
    </section>
    ${complete && score.verdict === 'unjudged' ? `<div class="generalization-outcome pending"><strong>${level.code} 수행 완료</strong><span>끝까지 읽었어요. 정확성은 나중에 확인해요.</span>${!isLast && canAdvance ? `<button class="btn btn-primary" data-action="next-generalization" ${childSubPageLocked() ? 'disabled' : ''}>${step.levels[state.generalizationLevel + 1].code}로 가기</button>` : ''}</div>` : ''}
    ${complete && score.verdict === 'below' && !canAdvance ? `<div class="generalization-outcome support"><strong>해당 회차 복습 권장</strong><span>${level.code} 진행값에 미치지 않아 오늘은 여기까지 진행합니다. 정확한 답을 알려주고 비슷한 낱말로 다시 연습합니다.</span>${coachSurface && !isLast ? `<button class="btn btn-ghost" data-action="coach-continue-transfer">코치 판단으로 계속 진행</button>` : ''}</div>` : ''}
    ${complete && score.verdict === 'below' && canAdvance ? `<div class="generalization-outcome pending"><strong>${level.code} 수행 완료</strong><span>${state.transferCoachContinued[state.generalizationLevel] ? '코치 판단으로 다음 자료까지 이어서 연습해요. 이 뒤의 수행은 독립 통과 판정에 쓰지 않습니다.' : '더 연습할 자료로 이어서 읽어 봐요.'}</span>${!isLast ? `<button class="btn btn-primary" data-action="next-generalization" ${childSubPageLocked() ? 'disabled' : ''}>${step.levels[state.generalizationLevel + 1].code}로 가기</button>` : ''}</div>` : ''}
    ${passed && !isLast ? `<div class="generalization-outcome success"><strong>${level.code} 진행값 충족</strong><span>도움 없이 ${score.independent}/${score.judged}을 읽어 다음 자료로 넓힐 수 있어요.</span><button class="btn btn-primary" data-action="next-generalization" ${childSubPageLocked() ? 'disabled' : ''}>${step.levels[state.generalizationLevel + 1].code}로 가기</button></div>` : ''}
    ${passed && isLast ? '<div class="generalization-outcome success"><strong>T3까지 완료</strong><span>처음 보는 말에서도 달라지는 소리를 적용해 읽었습니다.</span></div>' : ''}
  </div>`;
}

function transferHeader(step) {
  return `<div class="generalization-head compact-transfer-head">
    <div><span class="eyebrow">책 밖에서 한 번 더</span><h2>${step.heading || '배운 읽기를 새로운 자료에 적용해 봐요'}</h2></div>
    <img src="assets/jelly-teacher.png" alt="새로운 읽기 활동을 안내하는 젤리티처">
  </div>
  <div class="level-track">
    ${step.levels.map((item, index) => `<button class="level-node ${(state.generalizationRecords[index] || []).length ? 'has-data' : ''} ${index === state.generalizationLevel ? 'current' : ''}" data-generalization-level="${index}" aria-pressed="${index === state.generalizationLevel}" ${childSubPageLocked() ? 'disabled' : ''}><strong>${item.code}</strong><span>${item.label}</span></button>`).join('')}
  </div>`;
}

function clearT1SpeedTimer() {
  if (t1SpeedTimer) clearInterval(t1SpeedTimer);
  t1SpeedTimer = null;
}

function clearT2TransformTimer() {
  if (t2TransformTimer) clearTimeout(t2TransformTimer);
  t2TransformTimer = null;
}

function finishT1SpeedChallenge(level, items) {
  clearT1SpeedTimer();
  state.t1SpeedActive = false;
  state.t1SpeedFinished = true;
  const records = state.generalizationRecords[state.generalizationLevel];
  // 제한시간 안에 도달하지 못한 문항은 「안 한 것」이지 「도움이 필요했던 것」이 아니다.
  sealUnjudgedItems(records, items.length);
  const score = scoreTransferLevel(records, level, items.length);
  state.generalizationResult = score.verdict;
  state.generalizationFinished = !canOpenNextTransferLevel(score);
  render(true);
}

function startT1SpeedChallenge(level, items) {
  clearT1SpeedTimer();
  state.generalizationRecords[state.generalizationLevel] = [];
  state.generalizationResult = null;
  state.generalizationFinished = false;
  state.t1SpeedDeck = shuffledValues(items);
  state.t1SpeedMode = 'challenge';
  state.t1SpeedActive = true;
  state.t1SpeedFinished = false;
  state.t1SpeedTimeLeft = 30;
  state.t1SpeedStartedAt = performance.now();
  state.t1SpeedCurrent = Math.floor(Math.random() * state.t1SpeedDeck.length);
  state.t1SpeedRevealed = [];
  t1SpeedTimer = setInterval(() => {
    state.t1SpeedTimeLeft = Math.max(0, 30 - Math.floor((performance.now() - state.t1SpeedStartedAt) / 1000));
    const timer = document.querySelector('[data-t1-speed-timer]');
    if (timer) timer.textContent = `${state.t1SpeedTimeLeft}초`;
    if (state.t1SpeedTimeLeft <= 0) finishT1SpeedChallenge(level, items);
  }, 200);
  render(true);
}

// 문항 판정 입력 — 코치 화면에만 뜬다. 활동이 달라도 같은 세 선택지·같은 모양이라
// 코치가 화면마다 조작을 다시 익히지 않는다(12번 §8 「최소 조작」).
// 값과 순서는 08번 §11·통합규격 §10.2를 따른다: 처음부터 정확 · 스스로 고쳐 읽음 · 도움 필요.
// 최종 독립수행 확인 — **오늘 읽은 본문을 삽화 없이 한 페이지에 모아** 읽는다.
// 삽화가 있으면 그림 단서로 읽을 수 있어 순수 해독을 확인하지 못한다(14번 §3의 7번 기능).
// 본문은 이 회차의 story 단계에서 그대로 모으므로 데이터를 따로 적지 않는다.
function todayPassages() {
  return (lessons[state.lesson]?.steps || [])
    .filter(x => x.type === 'story' && (x.passage || x.spoken))
    .map(x => ({ passage: x.passage || esc(x.spoken), spoken: x.spoken || '', soundMarks: x.soundMarks || [] }));
}

// ── 1분 읽기 도전 ────────────────────────────────────────────────────
// 마이크 없이 읽기 속도를 잰다. 시작을 누르고, 1분이 지나거나 아동이 멈추면
// **마지막으로 읽은 음절을 눌러** 거기까지의 음절 수와 걸린 시간으로 속도를 낸다.
// 본문 데이터에 의존하지 않으므로 다른 파일럿에도 그대로 옮길 수 있다.
const MINUTE_CHALLENGE_MS = 60000;
let minuteChallengeTimer = null;

const HANGUL_SYLLABLE = /[가-힣]/;

// 본문 HTML에서 태그를 걷어내고 음절마다 누를 수 있게 감싼다.
// 줄바꿈만 살리고 강조 표시는 뺀다 — 도전 중에는 꾸밈이 읽기를 방해한다.
function syllableMarkup(passages) {
  let index = 0;
  return passages.map(part => {
    const plain = String(part.passage || '')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, '');
    const body = Array.from(plain).map(ch => {
      if (ch === '\n') return '<br>';
      if (!HANGUL_SYLLABLE.test(ch)) return esc(ch);
      const at = index++;
      return `<b class="syl ${at < state.minuteChallengeMark ? 'read' : ''}" data-syllable="${at}">${esc(ch)}</b>`;
    }).join('');
    return `<p>${body}</p>`;
  }).join('');
}

function totalSyllables(passages) {
  return passages.reduce((sum, part) => {
    const plain = String(part.passage || '').replace(/<[^>]*>/g, '');
    return sum + Array.from(plain).filter(ch => HANGUL_SYLLABLE.test(ch)).length;
  }, 0);
}

function startMinuteChallenge() {
  clearTimeout(minuteChallengeTimer);
  state.minuteChallengeActive = true;
  state.minuteChallengeStartedAt = performance.now();
  state.minuteChallengeMark = 0;
  state.minuteChallengeResult = null;
  minuteChallengeTimer = setTimeout(() => finishMinuteChallenge(null), MINUTE_CHALLENGE_MS);
  render(true);
}

// 마지막 음절을 누르면(또는 1분이 차면) 거기까지로 속도를 낸다.
function finishMinuteChallenge(syllableIndex) {
  if (!state.minuteChallengeActive) return;
  clearTimeout(minuteChallengeTimer);
  const elapsedMs = Math.min(MINUTE_CHALLENGE_MS, Math.round(performance.now() - state.minuteChallengeStartedAt));
  const read = syllableIndex === null ? state.minuteChallengeMark : syllableIndex + 1;
  const perMinute = elapsedMs > 0 ? Math.round(read / (elapsedMs / 60000)) : null;
  state.minuteChallengeActive = false;
  state.minuteChallengeMark = read;
  state.minuteChallengeResult = { read, elapsedMs, perMinute, total: totalSyllables(todayPassages()) };
  // 속도는 자동성 축의 재료다. 정확성 판정과 섞지 않고 따로 내보낸다.
  window.dispatchEvent(new CustomEvent('oncuvate:reading-rate', {
    detail: { ...state.minuteChallengeResult, unit: 'syllables-per-minute', context: currentProgress() }
  }));
  render(true);
}

function finalReadingView(step) {
  const parts = todayPassages();
  const spoken = parts.map(p => p.spoken).join(' ');
  const marks = parts.flatMap(p => p.soundMarks);
  const revealed = state.storyTextVisible;
  return `<div class="activity-card final-reading-card">
    <div class="final-reading-head">
      <div><span class="eyebrow">${esc(step.title || '오늘 읽은 글')}</span>
        <h2>그림 없이 글만 읽어 봐요</h2>
        <p>오늘 읽은 이야기를 처음부터 끝까지 이어서 읽어요.</p></div>
      <img src="assets/jelly-listen-v2.png" alt="귀 기울여 듣는 젤리티처">
    </div>
    ${revealed ? `<section class="final-reading-text ${state.minuteChallengeActive ? 'is-challenge' : ''}" lang="ko">
      ${state.minuteChallengeActive || state.minuteChallengeResult
        ? syllableMarkup(parts)
        : parts.map(p => `<p>${p.passage}</p>`).join('')}
    </section>` : `<section class="final-reading-cover">
      <p>준비되면 글을 열어요.</p>
      <button class="btn btn-primary" data-action="toggle-story-text">글 보기</button>
    </section>`}
    ${revealed ? `<div class="final-reading-actions">
      <button class="btn btn-primary" data-action="finish-final-reading" ${state.finalReadingDone ? 'disabled' : ''}>
        ${state.finalReadingDone ? '읽기를 마쳤어요' : '다 읽었어요'}</button>
      ${state.minuteChallengeActive
        ? '<button class="btn btn-secondary" data-action="stop-minute-challenge">여기까지 읽었어요</button>'
        : `<button class="btn btn-ghost" data-action="start-minute-challenge">1분 읽기 도전${state.minuteChallengeResult ? ' 다시' : ''}</button>`}
    </div>
    ${state.minuteChallengeActive ? `<p class="challenge-hint" aria-live="polite">
      1분 동안 읽어요. 멈춘 자리의 <b>마지막 음절을 눌러</b> 주세요.</p>` : ''}
    ${state.minuteChallengeResult ? `<div class="challenge-result" data-track="activity-complete" data-activity-id="minute-reading">
      <strong>${state.minuteChallengeResult.perMinute}</strong><span>음절 / 분</span>
      <p>${state.minuteChallengeResult.read}음절을 ${(state.minuteChallengeResult.elapsedMs / 1000).toFixed(1)}초 동안 읽었어요
         <small>(전체 ${state.minuteChallengeResult.total}음절)</small></p>
    </div>` : ''}` : ''}
    ${itemJudgement('오늘 읽은 글 전체', { done: state.finalReadingDone })}
  </div>`;
}

function itemJudgement(label, opts = {}) {
  if (!coachSurface) return '';
  const done = opts.done;
  if (done) return `<div class="item-observation coach-observation is-done">
    <span class="coach-observation-title"><strong>코치 기록</strong></span>
    <span class="judged-note">${esc(label)} · 판정 완료</span></div>`;
  return `<div class="item-observation coach-observation">
    <div class="coach-observation-title"><strong>코치 기록</strong><span>${esc(label)}</span></div>
    <button data-generalization-item-result="accurate">처음부터 정확</button>
    <button data-generalization-item-result="self-corrected">스스로 고쳐 읽음</button>
    <button data-generalization-item-result="support">도움 필요</button>
  </div>`;
}

function t1SpeedReadingView(step, level, items, records) {
  if (state.t1SpeedDeck.length !== items.length) {
    state.t1SpeedDeck = shuffledValues(items);
    state.t1SpeedCurrent = Math.floor(Math.random() * state.t1SpeedDeck.length);
  }
  const deck = state.t1SpeedDeck;
  const challenge = state.t1SpeedMode === 'challenge';
  const active = challenge && state.t1SpeedActive;
  const practiceDone = state.t1SpeedRevealed.length === deck.length;
  const complete = records.length === items.length;
  return `<div class="activity-card generalization-card speed-reading-challenge">
    ${transferHeader(step)}
    <section class="speed-challenge-panel">
      <div class="speed-challenge-title"><div><span class="eyebrow">T1 · 스피드리딩 챌린지</span><h3>뒤집고, 정확하게 읽어요</h3><p>반짝이는 카드를 찾아 누르고 나타난 낱말을 바로 읽어요.</p></div>
        <div class="speed-mode-tabs"><button class="${!challenge ? 'active' : ''}" data-t1-speed-mode="practice">연습</button><button class="${challenge ? 'active' : ''}" data-t1-speed-mode="challenge">30초 도전</button></div>
      </div>
      <div class="speed-challenge-status"><span>${challenge ? '도전 시간' : '연습한 카드'}</span><strong data-t1-speed-timer>${challenge ? `${state.t1SpeedTimeLeft}초` : `${state.t1SpeedRevealed.length} / ${deck.length}`}</strong></div>
      <div class="speed-card-grid">${deck.map((word, index) => {
        const revealed = state.t1SpeedRevealed.includes(index);
        const target = (challenge ? active : !practiceDone) && index === state.t1SpeedCurrent;
        return `<button class="speed-word-card ${revealed ? 'revealed' : ''} ${target ? 'is-target' : ''}" data-t1-speed-card="${index}" ${revealed || !target || (challenge && !active) ? 'disabled' : ''}>${revealed ? `<span>${word}</span>` : '<i>?</i>'}</button>`;
      }).join('')}</div>
      <div class="speed-challenge-action">${!challenge && !practiceDone ? '<span>카드를 누르면 다음 카드가 무작위로 반짝여요.</span>' : ''}${!challenge && practiceDone ? '<span>연습을 마쳤어요.</span><button class="btn btn-primary" data-action="start-t1-speed">30초 도전 시작</button>' : ''}${challenge && !active && !state.t1SpeedFinished ? '<span>준비되면 시작해요.</span><button class="btn btn-primary" data-action="start-t1-speed">도전 시작</button>' : ''}${active ? '<span>반짝이는 카드를 찾아 빠르게 읽어요.</span>' : ''}${state.t1SpeedFinished || complete ? '<span>도전을 마쳤어요.</span><button class="btn btn-secondary" data-action="start-t1-speed">다시 도전</button>' : ''}</div>
    </section>
    ${!complete ? itemJudgement(`${records.length + 1}/${items.length} · ${deck[state.t1SpeedCurrent] ?? ''}`) : ''}
    ${complete && !state.generalizationFinished ? `<div class="generalization-outcome pending"><strong>T1 완료</strong><span>읽기 기록이 저장되었어요.</span><button class="btn btn-primary" data-action="next-generalization" ${childSubPageLocked() ? 'disabled' : ''}>T2로 가기</button></div>` : ''}
  </div>`;
}

function koreanPieces(word) {
  return Array.from(String(word).replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, ''));
}

function koreanInitials(word) {
  const initials = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  return koreanPieces(word).map(letter => {
    const code = letter.charCodeAt(0) - 0xac00;
    return code >= 0 && code <= 11171 ? initials[Math.floor(code / 588)] : letter;
  });
}

function stableRotate(values, amount) {
  if (!values.length) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return values.slice(offset).concat(values.slice(0, offset));
}

function t2PieceCards(level, word, itemIndex) {
  const targets = koreanPieces(word).map((value, index) => ({ id: `target-${index}`, value }));
  const fallback = Array.from('가나다라마바사아자차카타파하거너더러머버서어저고노도로모보소오조구누두루무부수우주기니디리미비시이지개내대래매배새애제');
  const targetValues = new Set(targets.map(item => item.value));
  const source = [...(level.pool || level.items || []).flatMap(koreanPieces), ...fallback];
  const distractors = Array.from(new Set(source.filter(value => !targetValues.has(value)))).slice(0, Math.max(0, 25 - targets.length));
  const seed = Array.from(`${word}-${itemIndex}-${state.generalizationSet}`).reduce((total, letter) => ((total * 31) + letter.charCodeAt(0)) >>> 0, 17);
  const filler = stableRotate(distractors.map((value, index) => ({ id: `distractor-${index}`, value })), seed % Math.max(1, distractors.length));
  const cards = Array(25);
  const row = seed % 5;
  const start = row * 5 + (Math.floor(seed / 5) % Math.max(1, 6 - targets.length));
  targets.forEach((card, index) => { cards[start + index] = card; });
  let fill = 0;
  return Array.from({ length: 25 }, (_, index) => cards[index] || filler[fill++]);
}

function t2WordOptions(level, target, itemIndex) {
  const source = Array.from(new Set(level.pool || level.items || []));
  const distractors = stableRotate(source.filter(item => item !== target), itemIndex + state.generalizationSet).slice(0, Math.min(14, source.length - 1));
  return stableRotate([target, ...distractors], itemIndex + 1);
}

function currentT2Direction(recordsLength) {
  return state.t2TransformMode === 'mixed' ? (recordsLength % 2 ? 'syllables-to-word' : 'word-to-syllables') : state.t2TransformMode;
}

function advanceT2Transform() {
  if (state.t2TransformFeedback !== 'correct') return;
  const step = lessons[state.lesson].steps[state.step];
  const level = step.levels[state.generalizationLevel];
  const items = currentGeneralizationItems(level);
  const records = state.generalizationRecords[state.generalizationLevel];
  const finishing = records.length === items.length - 1;
  const result = state.t2TransformHadError ? 'self-corrected' : 'accurate';
  state.t2TransformSelection = [];
  state.t2TransformHadError = false;
  state.t2TransformFeedback = '';
  state.t2TransformSoundPlayed = false;
  state.t2TransformPieceHeard = [];
  recordGeneralizationItem(result);
  if (finishing && state.generalizationLevel < step.levels.length - 1) {
    state.generalizationLevel += 1;
    state.generalizationResult = null;
    state.generalizationFinished = false;
    render(true);
  }
}

function scheduleT2TransformResolution(result) {
  clearT2TransformTimer();
  t2TransformTimer = setTimeout(() => {
    t2TransformTimer = null;
    if (result === 'correct') advanceT2Transform();
    else if (state.t2TransformFeedback === 'wrong') {
      state.t2TransformSelection = [];
      state.t2TransformFeedback = '';
      render(true);
    }
  }, result === 'correct' ? 1000 : 850);
}

function t2TransformView(step, level, items, records) {
  const complete = records.length === items.length;
  const itemIndex = Math.min(records.length, items.length - 1);
  const word = items[itemIndex];
  const direction = currentT2Direction(records.length);
  const parts = koreanPieces(word);
  const hints = koreanInitials(word);
  const cards = t2PieceCards(level, word, itemIndex);
  const selected = state.t2TransformSelection.map(id => cards.find(card => card.id === id)).filter(Boolean);
  const options = t2WordOptions(level, word, itemIndex);
  const allHeard = parts.every((_, index) => state.t2TransformPieceHeard.includes(index));
  const correct = state.t2TransformFeedback === 'correct';
  const wrong = state.t2TransformFeedback === 'wrong';
  return `<div class="activity-card generalization-card syllable-transform-game">${transferHeader(step)}
    <section class="transform-panel">
      <div class="transform-title-row"><div><span class="eyebrow">T2 · 글자 바꾸어 보기</span><h3>${direction === 'word-to-syllables' ? '말을 글자 조각으로 바꿔요' : '글자 조각을 말로 모아요'}</h3><p>소리를 듣고 알맞은 글자를 찾아요.</p></div><label class="transform-mode-control"><span>조립 방향</span><select data-t2-transform-mode><option value="word-to-syllables" ${state.t2TransformMode === 'word-to-syllables' ? 'selected' : ''}>단어 → 글자 조각</option><option value="syllables-to-word" ${state.t2TransformMode === 'syllables-to-word' ? 'selected' : ''}>글자 조각 → 단어</option><option value="mixed" ${state.t2TransformMode === 'mixed' ? 'selected' : ''}>두 방향 번갈아</option></select></label></div>
      <div class="transform-progress"><span>${complete ? items.length : records.length + 1} / ${items.length}</span><i><b style="width:${(records.length / items.length) * 100}%"></b></i></div>
      ${!complete && direction === 'word-to-syllables' ? `<div class="transform-board word-to-pieces"><aside class="transform-listen-card"><img src="assets/jelly-listen-v2.png" alt="귀 기울여 듣는 젤리티처"><button data-action="play-t2-transform-sound" data-text="${word}">${state.t2TransformSoundPlayed ? '한 번 더 듣기' : '소리 듣기'}</button></aside><div class="transform-workspace"><div class="piece-answer-row">${parts.map((_, index) => `<span class="${selected[index] ? 'filled' : state.t2TransformHadError ? 'hint' : ''}">${selected[index]?.value || (state.t2TransformHadError ? hints[index] : index + 1)}</span>`).join('')}</div><div class="piece-grid ${state.t2TransformSoundPlayed ? '' : 'waiting-for-sound'}">${cards.map(card => `<button class="${state.t2TransformSelection.includes(card.id) ? 'selected' : ''}" data-t2-piece="${card.id}" ${correct || !state.t2TransformSoundPlayed ? 'disabled' : ''}>${card.value}</button>`).join('')}</div></div></div>` : ''}
      ${!complete && direction === 'syllables-to-word' ? `<div class="transform-board pieces-to-word"><aside class="transform-listen-card reverse-piece-listen-card"><img src="assets/jelly-listen-v2.png" alt="귀 기울여 듣는 젤리티처"><div class="hidden-piece-cards">${parts.map((part, index) => `<button class="${state.t2TransformPieceHeard.includes(index) ? 'heard' : ''}" data-action="play-t2-piece-sound" data-piece-index="${index}" data-text="${part}"><b>?</b><small>${index + 1}</small></button>`).join('')}</div></aside><div class="transform-workspace"><div class="word-option-grid dense ${allHeard ? '' : 'waiting-for-sound'}">${options.map(option => `<button data-t2-word-option="${option}" ${correct || !allHeard ? 'disabled' : ''}>${option}</button>`).join('')}</div></div></div>` : ''}
      ${!complete ? itemJudgement(`${records.length + 1}/${items.length} · ${word}`) : ''}
      ${!complete ? `<div class="transform-feedback ${correct ? 'success' : wrong ? 'retry' : ''}"><span>${correct ? `<b>${word}</b>이 완성되었어요.` : wrong ? `첫소리 힌트 <b>${hints.join(' · ')}</b>를 보고 다시 해 보세요.` : !state.t2TransformSoundPlayed ? '먼저 소리를 들어요.' : '알맞은 글자를 골라요.'}</span></div>` : '<div class="transform-complete"><strong>T2 활동 완료</strong></div>'}
    </section>
  </div>`;
}

function t3SentenceParts(sentence) { return String(sentence || '').trim().split(/\s+/).filter(Boolean); }

function initializeT3Sentence(sentence, itemIndex) {
  const key = `${state.lesson}:${state.generalizationSet}:${itemIndex}:${sentence}`;
  const parts = t3SentenceParts(sentence);
  if (state.t3SentenceKey === key && state.t3SentenceOrder.length === parts.length) return;
  state.t3SentenceKey = key;
  state.t3SentenceOrder = shuffledValues(parts.map((_, index) => index));
  if (state.t3SentenceOrder.every((value, index) => value === index) && parts.length > 1) state.t3SentenceOrder.push(state.t3SentenceOrder.shift());
  state.t3SelectedIndex = null;
  state.t3ReadingStatus = 'arranging';
  state.t3ReadingResult = null;
}

function t3OrderIsCorrect(sentence) {
  const parts = t3SentenceParts(sentence);
  return state.t3SentenceOrder.length === parts.length && state.t3SentenceOrder.every((value, index) => value === index);
}

function requestT3SentenceReading(sentence, itemIndex) {
  if (!t3OrderIsCorrect(sentence)) return;
  state.t3SelectedIndex = null;
  state.t3ReadingStatus = state.readingEvaluationEnabled ? 'evaluating' : 'reading';
  render(true);
  window.dispatchEvent(new CustomEvent('oncuvate:generalization-evaluation-request', { detail: { lesson: state.lesson, level: 'T3', item: sentence, itemIndex, mode: 'sentence-order-reading', evaluationEnabled: state.readingEvaluationEnabled, correctionRules: { minimumSimilarity: .75, equivalentVowels: [['ㅐ', 'ㅔ']], allowInitialPlainAspiratedCorrection: true, allowFinalMieumOmissionAtWordEnd: true } } }));
}

function moveT3SentencePiece(fromIndex, toIndex, sentence, itemIndex) {
  if (state.t3ReadingStatus !== 'arranging' || fromIndex === toIndex) return;
  const order = state.t3SentenceOrder.slice();
  const [moved] = order.splice(fromIndex, 1);
  // 선택한 위치 자체로 이동하고, 그 자리에 있던 낱말부터 옆으로 밀린다.
  order.splice(toIndex, 0, moved);
  state.t3SentenceOrder = order;
  state.t3SelectedIndex = null;
  state.t3HadError = !t3OrderIsCorrect(sentence);
  render(true);
  if (t3OrderIsCorrect(sentence)) setTimeout(() => requestT3SentenceReading(sentence, itemIndex), 350);
}

function t3SentenceOrderView(step, level, items, records) {
  if (records.length >= items.length) return `<div class="activity-card generalization-card t3-sentence-order">${transferHeader(step)}<section class="t3-complete-panel"><img src="assets/jelly-confidence-4.png" alt="자신 있는 젤리티처"><div><span>T3 완료</span><h3>문장 순서를 맞추고 정확하게 읽었어요</h3></div></section></div>`;
  const itemIndex = records.length;
  const sentence = items[itemIndex];
  initializeT3Sentence(sentence, itemIndex);
  const parts = t3SentenceParts(sentence);
  const correct = t3OrderIsCorrect(sentence);
  const arranged = state.t3SentenceOrder.map(sourceIndex => ({ sourceIndex, text: parts[sourceIndex] }));
  return `<div class="activity-card generalization-card t3-sentence-order">${transferHeader(step)}<section class="t3-order-panel">
    <div class="t3-order-heading"><div><span class="eyebrow">T3 · 문장 순서 맞추기</span><h3>낱말을 옮겨 문장을 완성해요</h3><p>조각을 끌거나 두 조각을 차례로 눌러 위치를 바꿔요.</p></div><strong>${itemIndex + 1}<small>/ ${items.length}</small></strong></div>
    <div class="t3-sentence-stage ${correct ? 'is-correct' : ''}"><div class="t3-piece-row">${correct ? `<div class="t3-completed-sentence">${esc(sentence)}</div>` : arranged.map((piece, position) => `<button class="t3-word-piece ${state.t3SelectedIndex === position ? 'is-selected' : ''}" draggable="true" data-t3-piece-position="${position}"><span>${esc(piece.text)}</span></button>`).join('')}</div>
      <div class="t3-reading-prompt">${state.t3ReadingStatus !== 'arranging' ? `<img src="assets/jelly-listen-v2.png" alt="귀 기울여 듣는 젤리티처"><div><strong>완성한 문장을 정확하게 읽어요</strong><span>확실하게 읽었으면 다음으로 가요.</span></div><button class="btn btn-primary" data-action="complete-t3-sentence">정확하게 읽었어요</button>` : `<div><strong>${state.t3SelectedIndex === null ? '옮길 낱말을 골라 보세요' : '옮겨 갈 자리를 골라 보세요'}</strong><span>다른 낱말은 자동으로 밀려나요.</span></div>`}</div>
    </div>
    ${itemJudgement(`${itemIndex + 1}/${items.length} · 문장 읽기`)}
    </section></div>`;
}

function generalizationView(step) {
  const level = step.levels[state.generalizationLevel] || step.levels[0];
  const items = currentGeneralizationItems(level);
  const records = state.generalizationRecords[state.generalizationLevel] || [];
  if (level.code === 'T1') return t1SpeedReadingView(step, level, items, records);
  if (level.code === 'T2') return t2TransformView(step, level, items, records);
  if (level.code === 'T3' && level.kind === 'sentence-order') return t3SentenceOrderView(step, level, items, records);
  return legacyGeneralizationView(step);
}

function recordGeneralizationItem(result) {
  const step = lessons[state.lesson]?.steps[state.step];
  if (step?.type !== 'generalization') return;
  const level = step.levels[state.generalizationLevel];
  const items = currentGeneralizationItems(level);
  const records = state.generalizationRecords[state.generalizationLevel];
  if (records.length >= items.length) return;
  // 알 수 없는 값을 「도움 필요」로 떨어뜨리지 않는다 — 판정 대기로 둔다.
  const known = [RESULT.ACCURATE, RESULT.SELF_CORRECTED, RESULT.SUPPORT, RESULT.AWAITING];
  records.push(known.includes(result) ? result : RESULT.AWAITING);
  if (records.length === items.length) {
    sealUnjudgedItems(records, items.length);
    const score = scoreTransferLevel(records, level, items.length);
    state.generalizationResult = score.verdict;
    const isLast = state.generalizationLevel === step.levels.length - 1;
    state.generalizationFinished = isLast || !canOpenNextTransferLevel(score);
  }
  render(true);
}

function currentGameSet(step) {
  const count = Math.min(5, step.pool.length);
  const start = (state.gameSetIndex * count) % step.pool.length;
  return Array.from({ length: count }, (_, index) => step.pool[(start + index) % step.pool.length]);
}

function gameOptions(answer) {
  const tokens = answer.map((value, id) => ({ id, value }));
  if (tokens.length < 2) return tokens;
  const shift = ((state.gameSetIndex + state.gameRound) % (answer.length - 1)) + 1;
  return [...tokens.slice(shift), ...tokens.slice(0, shift)];
}

function gameView(step) {
  const sets = currentGameSet(step);
  const item = sets[state.gameRound] || sets[0];
  const options = gameOptions(item.answer);
  const complete = state.gameChoice.length === item.answer.length;
  const correct = complete && state.gameChoice.every((tokenId, index) => tokenId === index);

  if (state.gameFinished) return `<div class="activity-card sentence-game syllable-order-game sentence-game-complete">
    <div class="game-complete-art"><img src="assets/jelly-confidence-3.png" alt="다섯 개의 짧은 말을 완성해 기뻐하는 젤리티처"></div>
    <div><span class="eyebrow">L3 완료</span><h2>5세트의 글자 조각을 모두 맞췄어요!</h2>
      <p>이번 회차의 전체 ${step.pool.length}개 연습 중 다른 다섯 세트도 이어서 할 수 있어요.</p>
      <button class="btn btn-primary" data-action="game-new-set">다른 5세트 연습</button>
    </div>
  </div>`;

  return `<div class="activity-card sentence-game syllable-order-game">
    <div class="sentence-game-head">
      <div><span class="eyebrow">L3 · 기본 5세트</span><h2>글자 조각 맞추기</h2><p>${step.prompt}</p></div>
      <div class="sentence-game-round"><strong>${state.gameRound + 1}</strong><span>/ ${sets.length}</span><small>전체 ${step.pool.length}개 연습</small></div>
    </div>
    <div class="sentence-game-progress" aria-label="${sets.length}세트 중 ${state.gameRound + 1}세트">
      ${sets.map((_, index) => `<i class="${index < state.gameRound ? 'done' : index === state.gameRound ? 'current' : ''}"></i>`).join('')}
    </div>
    <div class="sentence-game-board">
      <figure class="sentence-game-scene">
        <img class="game-scene-image" src="assets/scenes/scene-${String(item.scene).padStart(2, '0')}.jpg" alt="짧은 말을 떠올릴 그림책 장면">
        <img class="game-jelly" src="assets/jelly-confidence-3.png" alt="글자 조각 맞추기를 응원하는 젤리티처">
      </figure>
      <section class="sentence-game-play">
        <div class="game-sentence ${correct ? 'correct' : complete ? 'wrong' : ''}">
          ${item.answer.map((_, index) => {
            const wordEnd = (item.breakAfter || []).includes(index) ? ' word-end' : '';
            return state.gameChoice[index] !== undefined
              ? `<button class="chunk-button placed syllable-piece${wordEnd}" data-remove-chunk="${index}" aria-label="${index + 1}번째 글자 빼기"><span>${index + 1}</span>${item.answer[state.gameChoice[index]]}</button>`
              : `<span class="sentence-slot syllable-piece${wordEnd}" aria-label="${index + 1}번째 글자 놓기"><b>${index + 1}</b></span>`;
          }).join('')}
        </div>
        <div class="game-bank">
          ${options.map((option, index) => `<button class="chunk-button syllable-piece ${state.gameChoice.includes(option.id) ? 'used' : ''}" data-add-chunk="${index}" ${state.gameChoice.includes(option.id) ? 'disabled' : ''}>${option.value}</button>`).join('')}
        </div>
        <div class="game-feedback ${correct ? 'success' : complete ? 'retry' : ''}">
          ${correct ? `<strong>짧은 말이 완성됐어요.</strong><span>“${item.phrase}” 하고 소리 내어 읽어 보세요.</span>` : complete ? '<strong>순서를 다시 살펴봐요.</strong><span>글자 조각을 천천히 이어 읽어 보세요.</span>' : '<span>놓은 글자를 누르면 다시 뺄 수 있어요.</span>'}
          ${correct ? `<button class="btn btn-primary" data-action="next-game-round">${state.gameRound === sets.length - 1 ? '5세트 결과 보기' : '다음 문제'}</button>` : complete ? '<button class="btn btn-ghost" data-action="game-reset">다시 놓기</button>' : ''}
        </div>
      </section>
    </div>
  </div>`;
}

function finishView() {
  const first = state.scale;
  const last = state.reflection;
  const note = first == null || last == null ? '오늘의 읽기를 끝까지 마쳤어요.' : last > first ? '처음 생각보다 읽기가 더 편해졌어요.' : '오늘 확인한 부분을 다음 읽기에서 다시 이어 갈 수 있어요.';
  return `<div class="activity-card finish-card" data-track="lesson-complete"><div class="finish-inner">
    <div class="finish-ring">완료</div>
    <h2>${state.lesson}회차를 마쳤어요</h2>
    <p>${note}</p>
    <div class="finish-summary">
      <div><strong>바뀐 소리</strong>목표 낱말 정확성</div>
      <div><strong>문장 읽기</strong>바뀐 소리 유지</div>
      <div><strong>새 장면</strong>새 낱말에 적용</div>
    </div>
    <p class="finish-close">오늘 읽기는 여기까지예요. 화면을 그대로 두고 선생님과 이야기해 보세요.</p>
  </div></div>`;
}

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

function activityBody(step) {
  if (!step) return finishView();
  if (step.type === 'goal') return goalView(step);
  if (step.type === 'scale' || step.type === 'reflection') return scaleView(step.type);
  if (step.type === 'story') return storyView(step);
  if (step.type === 'focus') return focusView(step);
  if (step.type === 'syllable') return syllableView(step);
  if (step.type === 'lettergame') return letterGameView(step);
  if (step.type === 'flipgame') return flipGameView(step);
  if (step.type === 'soundchange') return soundChangeView(step);
  if (step.type === 'colorobservation') return colorObservationView(step);
  if (step.type === 'generalization') return generalizationView(step);
  if (step.type === 'game') return gameView(step);
  if (step.type === 'reread') return finalReadingView(step);
  if (step.type === 'transfer') return storyView(step, 'transfer');
  return '';
}

function activityComplete(step) {
  if (!step) return true;
  if (step.type === 'scale') return state.scale !== null;
  if (step.type === 'reflection') return state.reflection !== null;
  if (step.type === 'reread') return state.finalReadingDone;
  if (step.type === 'story' || step.type === 'transfer') return state.storyTextVisible;
  if (step.type === 'lettergame') return state.letterGameDone;
  if (step.type === 'flipgame') return currentLessonFlipGame().completed;
  if (step.type === 'soundchange') return state.soundRound === step.rounds.length - 1 && soundRoundComplete(step);
  if (step.type === 'colorobservation') return state.colorObservationDone;
  if (step.type === 'generalization') return state.generalizationFinished;
  if (step.type === 'game') return state.gameFinished;
  return true;
}

function lessonView() {
  const lesson = lessons[state.lesson];
  const step = lesson.steps[state.step];
  const finished = state.step >= lesson.steps.length;
  // 제작·검수 화면에서는 활동 완료 여부와 무관하게 모든 페이지를 자유롭게 확인한다.
  // 다만 **페이지 잠금**이 걸리면 아동은 넘기지 못한다 — 코치가 진도를 끈다.
  const nextDisabled = childPageLocked();
  const progress = Math.min(state.step + 1, lesson.steps.length);
  const readyForNext = !finished && activityComplete(step);

  return `<main class="child-main">
    <section class="child-stage" aria-label="${finished ? '오늘 읽기 완료' : step.title}">
      <div class="child-activity ${childActivityLocked() ? 'is-locked' : ''}">${activityBody(step)}${activityLockOverlay()}</div>
      ${finished ? '' : childSignals(step)}
      ${finished ? '' : `<nav class="child-controls" aria-label="학습 이동">
        <button class="btn btn-ghost child-nav-button" data-action="prev" ${state.step === 0 || nextDisabled ? 'disabled' : ''}>이전</button>
        <div class="child-progress" aria-label="전체 ${lesson.steps.length}단계 중 ${progress}단계">
          <span>${progress}/${lesson.steps.length}</span>
          <div class="child-progress-track"><i style="width:${(progress / lesson.steps.length) * 100}%"></i></div>
        </div>
        <button class="btn child-sound-button" data-action="sound" aria-label="소리 설정" aria-pressed="${state.sound}">소리 ${state.sound ? '켬' : '끔'}</button>
        <button class="btn btn-primary child-nav-button ${readyForNext ? 'ready-next' : ''}" data-action="next" aria-label="${readyForNext ? '활동 완료, 다음' : '다음'}" ${nextDisabled ? 'disabled' : ''}>${state.step === lesson.steps.length - 1 ? '활동 마치기' : '다음'}</button>
      </nav>`}
    </section>
    ${coachConsole()}
    ${childWatermark()}
  </main>`;
}

// 소리 다시 듣기·느리게 듣기·글 보기는 아동에게 제공되는 도움이므로 hint로 표시한다.
// 클릭 처리보다 먼저 세팅되도록 렌더 직후에 붙인다(규격 7장).
const HINT_ACTIONS = ['speak', 'speak-slow', 'play-t2-piece-sound', 'play-t2-transform-sound', 'toggle-story-text'];

function markHintControls() {
  HINT_ACTIONS.forEach(action => {
    app.querySelectorAll(`[data-action="${action}"]`).forEach(node => {
      if (!node.dataset.track) node.dataset.track = 'hint';
    });
  });
}

// 두 잠금은 **아동에게만** 걸린다. 코치는 잠금을 켠 채로도 자기 화면을 움직일 수 있어야 한다.
// 자율학습(방 없음)에는 걸 코치가 없으므로 항상 열려 있다.
function childPageLocked() {
  return serviceMode === 'coaching' && !coachSurface && state.pageLocked;
}
// 페이지 잠금은 **하위 페이지에도 걸린다.** 전이 활동은 한 화면 안에서 T1→T2→T3로 나뉘므로
// 상단 이동만 막으면 아동이 하위 단계를 앞질러 간다. 코치가 진도를 끄는 원칙은 같다.
function childSubPageLocked() {
  return childPageLocked();
}

function childActivityLocked() {
  return serviceMode === 'coaching' && !coachSurface && state.activityLocked;
}

// 활동이 잠기면 그 위에 덮어 조작을 막는다. 페이지는 그대로 보인다.
function activityLockOverlay() {
  if (!childActivityLocked()) return '';
  return `<div class="activity-lock" role="status">
    <img src="assets/jelly-listen-v2.png" alt="">
    <strong>선생님 설명을 들어요</strong>
    <span>잠시 뒤에 이어서 해요.</span>
  </div>`;
}

// 코치용 잠금 스위치 — 켜고 끄는 것은 코치뿐이고, 값은 nav로 전원에게 간다.
function lockControls() {
  if (!coachSurface) return '';
  return `<div class="lock-controls" aria-label="잠금">
    <button class="lock-toggle ${state.pageLocked ? 'is-on' : ''}" data-action="toggle-page-lock"
      aria-pressed="${state.pageLocked}">페이지 잠금 ${state.pageLocked ? '켬' : '끔'}</button>
    <button class="lock-toggle ${state.activityLocked ? 'is-on' : ''}" data-action="toggle-activity-lock"
      aria-pressed="${state.activityLocked}">활동 잠금 ${state.activityLocked ? '켬' : '끔'}</button>
  </div>`;
}

// 코칭 모드의 활동 종료는 코치가 진도를 이동할 때 확정한다.
// 아동 화면에는 되돌릴 수 없는 종료 버튼을 두지 않고 도움 요청만 제공한다.
// 손들기 — 교실에서 손을 드는 것과 같다. 10초 뒤 저절로 내려가고, 아이가 먼저 내릴 수도 있다.
// 잘못 눌러도 스스로 사라지므로 「조작 실수」 버튼을 따로 두지 않는다.
const HAND_LOWER_MS = 10000;
let handLowerTimer = null;

function raiseHand(on) {
  clearTimeout(handLowerTimer);
  state.handRaised = on;
  window.dispatchEvent(new CustomEvent('oncuvate:child-signal', {
    detail: { kind: 'hand', on, context: currentProgress() }
  }));
  if (on) handLowerTimer = setTimeout(() => raiseHand(false), HAND_LOWER_MS);
  render(true);
}

function childSignals(step) {
  if (serviceMode !== 'coaching' || coachSurface || !step) return '';
  return `<div class="child-signals">
    <span class="child-finish-managed">
      <i aria-hidden="true"></i>
      <span><b>활동 마침은 선생님이 확인해요</b><small>끝났으면 화면을 그대로 두고 기다려 주세요.</small></span>
    </span>
    <button class="btn child-signal hand ${state.handRaised ? 'is-on' : ''}"
      data-action="raise-hand" aria-pressed="${state.handRaised}">${state.handRaised ? '손내리기' : '손들기'}</button>
  </div>`;
}

// 화면 구석의 아동 식별코드(규격 6장 v1.3). 실명이 아닌 4글자라 그룹에서 보여도 무방하다.
// 방침은 「막는다」가 아니라 「흘러나간 화면에 누구의 것이었는지 남긴다」이므로 작게·흐리게 둔다.
function childWatermark() {
  return childId ? `<span class="child-watermark" aria-hidden="true">${esc(childId)}</span>` : '';
}

// ── 코치 입력 선언 ──────────────────────────────────────────────────
// 최종 형태는 **플랫폼 공통 코치 콘솔이 이 선언을 읽어 화면을 만드는 것**이다(12번 §8).
// 콘솔이 오기 전까지 콘텐츠가 같은 선언으로 임시 패널을 그린다 —
// 콘솔이 열리면 선언만 넘기고 아래 패널 렌더는 걷어낸다.
// 값과 문구는 통합규격 §6.4(도움수준)와 12번 §4.3(도움·개입)을 그대로 따른다.
const COACH_INPUTS = {
  supportLevel: {
    label: '도움 수준', scope: 'item', required: true,
    note: '유효 수행에 도움 기록이 없으면 A0로 자동 처리한다. 코치는 도움을 줬을 때만 남긴다.',
    options: [
      { code: 'A1', label: '주의환기·다시 보기·가벼운 촉진' },
      { code: 'A2', label: '위치·부분·첫소리·선택지 등 구체적 힌트' },
      { code: 'A3', label: '모델 제시 후 따라 하기·함께 수행' },
      { code: 'A4', label: '정답 직접 제시·상세 설명·대리조작' }
    ]
  },
  supportType: {
    label: '도움 유형', scope: 'item',
    options: [
      { code: 'hint', label: '힌트' }, { code: 'reexplain', label: '재설명' },
      { code: 'model', label: '시범' }, { code: 'answer', label: '정답 제시' }
    ]
  },
  trigger: {
    label: '제공 계기', scope: 'item',
    options: [
      { code: 'request', label: '아동 요청' }, { code: 'delay', label: '지연' },
      { code: 'error', label: '오류' }, { code: 'preemptive', label: '코치 선제개입' }
    ]
  },
  followUp: { label: '추후 확인', scope: 'session', options: [{ code: 'flag', label: '표시' }] }
};

// 수업방이 있을 때만 진도를 코치에게 맡긴다(규격 6장 `nav` = 화면 잠금).
// 방이 없는 자율학습·콘텐츠 단독 사용에서는 곧바로 첫 화면이 열린다.
// 역할과 방은 서버가 정해서 들어오므로, 이 화면은 아무것도 고르지 않고 상태만 보여준다.
// 도움 기록 한 건 — 아동·회차·활동·문항·시각은 코치가 고르지 않고 자동으로 붙는다(12번 §8).
function recordSupport(levelCode) {
  const option = COACH_INPUTS.supportLevel.options.find(o => o.code === levelCode);
  if (!option) return;
  // 누구에게 준 도움인가 — 참가자가 한 명이면 자동으로 그 한 명, 여럿이면 고른 참가자.
  const target = state.selectedParticipant;
  if (!target) return;   // 누구에게 준 도움인지 정해지지 않으면 기록하지 않는다
  const entry = {
    level: levelCode,
    provider: 'coach',
    child: target,
    at: Math.round(performance.now()),   // 콘텐츠 상대시각
    // 맥락은 **그 아동이 있던 자리**를 쓴다. 코치 화면 위치가 아니다.
    context: (target && state.participants[target]) || currentProgress(),
    // 지원 효과는 코치가 따로 누르지 않는다 — 도움 뒤 그 문항의 판정에서 파생된다.
    type: null, trigger: null
  };
  state.supportEntries.push(entry);
  state.pendingSupport = entry;
  state.coachPanelOpen = true;
  window.dispatchEvent(new CustomEvent('oncuvate:support-recorded', { detail: entry }));
  render(true);
}

function setPendingSupportField(field, code) {
  if (!state.pendingSupport) return;
  state.pendingSupport[field] = state.pendingSupport[field] === code ? null : code;
  window.dispatchEvent(new CustomEvent('oncuvate:support-updated', { detail: state.pendingSupport }));
  render(true);
}

function optionButtons(group, field, selected) {
  return COACH_INPUTS[group].options
    .map(o => `<button class="support-chip ${selected === o.code ? 'is-on' : ''}"
      data-support-field="${field}" data-support-value="${o.code}">${o.label}</button>`).join('');
}

// 참가자 목록 — 07번 §6.2가 그룹수업 코치에게 제공하기로 한 넷을 한 자리에 둔다:
// 전체 진도 · 제출상태 · 도움요청 · 접속상태.
// 1:1에서도 같은 화면을 쓴다(참가자가 한 명일 뿐이다).
// 코치 콘솔 — 한 패널에 모은다. 잠금·참가자·도움 기록이 흩어져 있으면 매번 찾게 된다.
// 07번 §6.2가 그룹수업 코치에게 주기로 한 것(진도·제출·도움요청·접속)과
// 12번 §4.3의 도움·개입 입력을 같은 자리에 둔다.
// 코치 콘솔 — 한 패널에 모은다. 잠금·참가자·도움 기록이 흩어져 있으면 매번 찾게 된다.
// 07번 §6.2가 그룹수업 코치에게 주기로 한 것(진도·제출·도움요청·접속)과
// 12번 §4.3의 도움·개입 입력을 같은 자리에 둔다.
function coachConsole() {
  if (!coachSurface) return '';
  const entries = Object.entries(state.participants || {});
  const total = lessons[state.lesson]?.steps.length || 1;
  const helping = entries.filter(([, p]) => p.handRaised).length;
  const finished = entries.filter(([, p]) => p.complete || p.selfReported).length;

  const rows = entries.length ? entries.map(([id, p]) => {
    // 전체 진도가 아니라 **이 페이지에서 얼마나 했는지**를 앞세운다.
    const hasItems = Number.isFinite(p.itemsTotal) && p.itemsTotal > 0;
    const shown = Math.min(p.itemsTotal || 0, 12);
    const dots = hasItems ? Array.from({ length: shown }, (_, i) => {
      const idx = Math.round(i * p.itemsTotal / shown);
      return `<i class="${idx < (p.itemsDone || 0) ? 'filled' : ''}"></i>`;
    }).join('') : '';
    const stalled = (p.idleMs || 0) > 45000;
    const struggling = Number.isFinite(p.wrong) && p.wrong >= 3;
    const open = state.selectedParticipant === id;
    return `<li class="participant ${p.handRaised ? 'hand-raised' : ''} ${stalled || struggling ? 'attention' : ''} ${open ? 'is-selected' : ''}">
      <button data-participant="${esc(id)}" aria-expanded="${open}">
        <span class="participant-id">${esc(id)}</span>
        <span class="participant-where">${esc(p.title || p.activity || '')}${p.level ? ` · ${esc(p.level)}` : ''}</span>
        <span class="participant-step">${p.screen || 0}/${total}</span>
        ${hasItems ? `<span class="participant-items">
          <span class="item-dots">${dots}</span>
          <b>${p.itemsDone || 0}<span>/${p.itemsTotal}</span></b>
          ${Number.isFinite(p.correct) ? `<span class="tally"><em class="ok">정답 ${p.correct}</em>${p.wrong ? `<em class="no">오답 ${p.wrong}</em>` : ''}${p.unmeasured ? `<em class="na">미판정 ${p.unmeasured}</em>` : ''}</span>` : ''}
        </span>` : `<span class="participant-items muted">${p.complete ? '활동 마침' : '진행 중'}</span>`}
        <span class="participant-flags">
          ${stalled ? `<em class="flag stalled">${Math.floor((p.idleMs || 0) / 1000)}초 멈춤</em>` : ''}
          ${p.handRaised ? '<em class="flag hand">손 들었어요</em>' : ''}
          ${p.selfReported ? '<em class="flag done">다했어요</em>' : ''}
          ${p.complete && !p.handRaised ? '<em class="flag complete">마침</em>' : ''}
        </span>
      </button>
      ${open ? supportEditor(id, p) : ''}
    </li>`;
  }).join('') : '<li class="participant empty">아직 들어온 참가자가 없습니다.</li>';

  const count = state.supportEntries.length;
  return `<aside class="participant-panel" aria-label="코치 콘솔">
    <header><strong>참가자</strong><span>${entries.length}명</span>
      ${count ? `<em class="flag rec">도움 ${count}건</em>` : ''}
      ${finished ? `<em class="flag complete">마침 ${finished}</em>` : ''}
      ${helping ? `<em class="flag help">요청 ${helping}</em>` : ''}</header>
    ${lockControls()}
    <ul>${rows}</ul>
  </aside>`;
}

// 도움 기록 — **누른 참가자 바로 밑에서** 편다. 목록 아래로 내려가면 두 명만 돼도 멀어진다.
function supportEditor(id, p) {
  const pending = state.pendingSupport && state.pendingSupport.child === id ? state.pendingSupport : null;
  const spot = `${p.title || p.activity || ''}${p.item ? ` · ${p.item}` : ''}`;
  return `<div class="support-inline">
    <div class="support-row"><span class="support-row-label">도움 수준</span>
      <div class="support-chips">${COACH_INPUTS.supportLevel.options
        .map(o => `<button class="support-chip level ${pending?.level === o.code ? 'is-on' : ''}"
          data-support-level="${o.code}" title="${o.label}"><b>${o.code}</b></button>`).join('')}</div>
    </div>
    ${pending ? `
    <div class="support-row"><span class="support-row-label">유형</span>
      <div class="support-chips">${optionButtons('supportType', 'type', pending.type)}</div></div>
    <div class="support-row"><span class="support-row-label">계기</span>
      <div class="support-chips">${optionButtons('trigger', 'trigger', pending.trigger)}</div></div>
    <div class="support-done"><span>${esc(spot)}</span>
      <button class="btn btn-ghost" data-action="support-close">마침</button></div>`
    : '<p class="support-hint">도움을 주셨을 때만 누르세요. 없으면 A0로 기록됩니다.</p>'}
  </div>`;
}

// ── 처음으로 되돌리기 ────────────────────────────────────────────────
// 진행이 저장소에 남아 있어서 다시 열어도 하던 자리에서 이어진다. 그래서 다음 아이를
// 앉히거나 처음부터 다시 해 보려면 그것을 지울 수단이 화면에 늘 있어야 한다.
function restartControl() {
  const label = entryScreenAvailable ? '처음 화면으로' : '처음부터 다시';
  if (!state.restartAsking) {
    return `<div class="restart-corner">
      <button class="btn btn-ghost restart-button" data-action="restart-ask">${label}</button>
    </div>`;
  }
  // 실수로 눌러 진행이 통째로 날아가는 일이 없도록 한 번 더 묻는다.
  const scope = serviceMode === 'coaching' && coachSurface
    ? '지금까지의 진행이 지워지고 아이들 화면도 함께 처음으로 돌아가요.'
    : serviceMode === 'coaching'
      ? '내 화면만 처음으로 돌아가요. 수업 진행은 그대로예요.'
      : '지금까지의 진행이 지워져요.';
  return `<div class="restart-corner is-asking" role="group" aria-label="처음으로 돌아가기 확인">
    <p>${scope}</p>
    <button class="btn btn-primary restart-button" data-action="restart-confirm">${label}</button>
    <button class="btn btn-ghost restart-button" data-action="restart-cancel">그만두기</button>
  </div>`;
}

function restartSession() {
  // 수업에서는 코치만 전체를 되돌린다 — 아이가 누르면 반 전체 진행이 날아간다.
  const authoritative = serviceMode !== 'coaching' || coachSurface;
  restarting = true;
  if (authoritative) {
    try {
      localStorage.removeItem(sessionStorageKey);
      localStorage.removeItem(flipStorageKey);
    } catch { /* 저장 불가 환경 */ }
  }
  // 입장 화면으로 나가는 길에는 잠금을 풀지 않는다 — 떠나기 전에 예약된 발행이 되살아난다.
  if (entryScreenAvailable) { location.href = 'index.html'; return; }
  resetStepState();
  Object.assign(state, JSON.parse(JSON.stringify(INITIAL_STATE)));
  lastProgressSent = null;
  restarting = false;
  render();
  publishSessionSnapshot();
}

function sessionGateRequired() {
  return serviceMode === 'coaching' && !state.lessonStarted;
}

function sessionGateView() {
  const meta = lessons[state.lesson] || {};
  return `<main class="main session-gate">
    <section class="activity-card session-gate-card">
      <img src="assets/jelly-teacher.png" alt="" class="session-gate-art">
      <span class="eyebrow">${meta.title || '오늘 읽기'}</span>
      ${coachSurface
        ? `<h2>수업을 시작할까요?</h2>
           <p>시작하면 아동 화면도 함께 열립니다.</p>
           <button class="btn btn-primary" data-action="start-session">수업 시작</button>`
        : `<h2>선생님과 함께 시작해요</h2>
           <p>선생님이 시작하면 첫 화면이 열려요. 잠시만 기다려 주세요.</p>
           <div class="session-gate-wait" aria-live="polite"><i></i><i></i><i></i></div>`}
    </section>
    ${childWatermark()}
  </main>`;
}

function render(preserveScroll = false) {
  const previousScroll = window.scrollY;
  // 「처음으로」는 화면 종류와 무관하게 늘 붙인다 — 입장 대기 화면에서도, 다 마친 뒤에도 필요하다.
  app.innerHTML = (sessionGateRequired() ? sessionGateView() : lessonView()) + restartControl();
  markHintControls();
  publishProgressIfChanged();
  requestAnimationFrame(drawColoredFinalSyllables);
  const currentStep = state.lesson ? lessons[state.lesson]?.steps[state.step] : null;
  // 상태만 보고 재므로 그리기를 기다릴 필요가 없다. rAF에 얹으면 화면이 가려졌을 때 무장되지 않아
  // 반응시간이 통째로 결측이 된다.
  if (currentStep?.type === 'colorobservation') armColorObservationTiming();
  else {
    colorObservationTimingKey = null;
    colorObservationVisibleAt = null;
  }
  // 여기도 rAF에 얹지 않는다 — 코치 화면이 가려지면 젤리티처가 멈추고 시계도 서 버린다.
  // 둘 다 방금 그린 DOM만 보므로 바로 불러도 안전하다.
  if (currentStep?.type === 'flipgame') {
    scheduleJellyFlip();
    scheduleFlipClock();
  }
  else if (flipOpponentTimer) {
    clearTimeout(flipOpponentTimer);
    flipOpponentTimer = null;
  }
  if (preserveScroll) requestAnimationFrame(() => window.scrollTo({ top: previousScroll }));
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

function drawColoredFinalSyllables() {
  document.querySelectorAll('.closed-letter-canvas[data-colored-final]').forEach(canvas => {
    const letter = canvas.dataset.coloredFinal;
    const scale = Math.max(2, Math.ceil(window.devicePixelRatio || 1));
    const size = 92;
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#28243a';
    ctx.font = `650 ${76 * scale}px Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2 + scale);

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = image;
    const visited = new Uint8Array(width * height);
    const components = [];
    const neighbors = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const start = y * width + x;
        if (visited[start] || data[start * 4 + 3] < 8) continue;
        const pixels = [];
        const stack = [start];
        visited[start] = 1;
        let maxY = y;
        while (stack.length) {
          const point = stack.pop();
          pixels.push(point);
          const px = point % width;
          const py = Math.floor(point / width);
          if (py > maxY) maxY = py;
          for (const [dx, dy] of neighbors) {
            const nx = px + dx;
            const ny = py + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const next = ny * width + nx;
            if (!visited[next] && data[next * 4 + 3] >= 8) {
              visited[next] = 1;
              stack.push(next);
            }
          }
        }
        if (pixels.length > 20 * scale) components.push({ pixels, maxY });
      }
    }

    const finalComponent = components.sort((a, b) => b.maxY - a.maxY)[0];
    if (finalComponent) {
      for (const point of finalComponent.pixels) {
        data[point * 4] = 19;
        data[point * 4 + 1] = 157;
        data[point * 4 + 2] = 176;
      }
      ctx.putImageData(image, 0, 0);
    }
  });
}

function resetStepState() {
  // 아동 신호는 활동마다 새로 받는다
  state.activityDone = false;
  state.handRaised = false;
  state.finalReadingDone = false;
  clearTimeout(handLowerTimer);
  clearLetterGameTimers();
  clearT1SpeedTimer();
  clearT2TransformTimer();
  if (flipOpponentTimer) clearTimeout(flipOpponentTimer);
  flipOpponentTimer = null;
  if (flipClockTimer) clearInterval(flipClockTimer);
  flipClockTimer = null;
  state.chunkMode = false;
  state.focusWord = 0;
  state.syllableChoice = null;
  state.storyTextVisible = false;
  state.markedSoundLetters = [];
  state.letterGameRound = 0;
  state.letterGameChoice = null;
  state.letterGameScore = 0;
  state.letterGameDone = false;
  state.letterGamePhase = 'ready';
  state.letterGameSpeedMs = 3000;
  state.letterGamePresentedAt = null;
  state.letterGameDeck = [];
  state.soundRound = 0;
  state.phenomenonChoice = null;
  state.soundChoice = [];
  state.colorObservationCount = 2;
  state.colorObservationMyColor = 0;
  state.colorObservationSeating = null;
  state.colorObservationDeck = [];
  state.colorObservationIndex = 0;
  state.colorObservationRevealed = false;
  state.colorObservationResponses = [];
  state.colorObservationDone = false;
  colorObservationTimingKey = null;
  colorObservationVisibleAt = null;
  state.generalizationLevel = 0;
  state.generalizationResult = null;
  state.generalizationFinished = false;
  state.generalizationSet = 0;
  state.generalizationRecords = [[], [], []];
  state.t1SpeedMode = 'practice';
  state.t1SpeedActive = false;
  state.t1SpeedFinished = false;
  state.t1SpeedTimeLeft = 30;
  state.t1SpeedStartedAt = null;
  state.t1SpeedDeck = [];
  state.t1SpeedCurrent = 0;
  state.t1SpeedRevealed = [];
  state.t2TransformMode = 'word-to-syllables';
  state.t2TransformSelection = [];
  state.t2TransformHadError = false;
  state.t2TransformFeedback = '';
  state.t2TransformSoundPlayed = false;
  state.t2TransformPieceHeard = [];
  state.t3SentenceKey = '';
  state.t3SentenceOrder = [];
  state.t3SelectedIndex = null;
  state.t3ReadingStatus = 'arranging';
  state.t3ReadingAttempts = 0;
  state.t3ReadingResult = null;
  state.t3HadError = false;
  state.gameChoice = [];
  state.gameRound = 0;
  state.gameSetIndex = 0;
  state.gameScore = 0;
  state.gameFinished = false;
  state.transferChoice = null;
  state.timerStart = null;
  state.timerValue = 0;
  if (state.timerHandle) clearInterval(state.timerHandle);
  state.timerHandle = null;
}

// 새 T1~T3는 기존 목록형 기록 동작보다 먼저 처리한다.
app.addEventListener('click', event => {
  const step = state.lesson ? lessons[state.lesson]?.steps[state.step] : null;
  if (step?.type !== 'generalization') return;
  const level = step.levels[state.generalizationLevel];
  const items = currentGeneralizationItems(level);
  const records = state.generalizationRecords[state.generalizationLevel] || [];
  let handled = false;

  const actionButton = event.target.closest('[data-action]');
  const action = actionButton?.dataset.action;
  if (action === 'play-t2-transform-sound') {
    handled = true;
    state.t2TransformSoundPlayed = true;
    speakWordThenPieces(actionButton.dataset.text || '');
    render(true);
  } else if (action === 'play-t2-piece-sound') {
    handled = true;
    const pieceIndex = Number(actionButton.dataset.pieceIndex);
    if (!state.t2TransformPieceHeard.includes(pieceIndex)) state.t2TransformPieceHeard.push(pieceIndex);
    const word = items[Math.min(records.length, items.length - 1)];
    state.t2TransformSoundPlayed = state.t2TransformPieceHeard.length >= koreanPieces(word).length;
    speak(actionButton.dataset.text || '', .7);
    render(true);
  } else if (action === 'start-t1-speed') {
    handled = true;
    startT1SpeedChallenge(level, items);
  } else if (action === 'complete-t3-sentence') {
    handled = true;
    const result = state.t3ReadingResult || RESULT.AWAITING;
    state.t3SentenceKey = '';
    state.t3SentenceOrder = [];
    state.t3SelectedIndex = null;
    state.t3ReadingStatus = 'arranging';
    state.t3ReadingResult = null;
    recordGeneralizationItem(result);
  } else if (action === 'coach-continue-transfer') {
    // 코치 판단으로 진행 재개 — 기준 미달이어도 진단·추가 훈련을 위해 다음 수준을 연다.
    handled = true;
    state.transferCoachContinued[state.generalizationLevel] = true;
    render(true);
  } else if (action === 'next-generalization') {
    handled = true;
    if (childSubPageLocked()) return;
    clearT1SpeedTimer();
    enterNextTransferLevel(step.levels.length);
    state.generalizationResult = null;
    state.generalizationFinished = false;
    state.t1SpeedActive = false;
    state.t1SpeedFinished = false;
    state.t1SpeedTimeLeft = 30;
    state.t1SpeedDeck = [];
    state.t1SpeedRevealed = [];
    state.t2TransformSelection = [];
    state.t2TransformSoundPlayed = false;
    state.t2TransformPieceHeard = [];
    state.t3SentenceKey = '';
    state.t3SentenceOrder = [];
    state.t3ReadingStatus = 'arranging';
    render(true);
  }

  const levelButton = event.target.closest('[data-generalization-level]');
  if (!handled && levelButton) {
    handled = true;
    if (childSubPageLocked()) return;
    clearT1SpeedTimer();
    clearT2TransformTimer();
    state.generalizationLevel = Number(levelButton.dataset.generalizationLevel);
    state.generalizationResult = null;
    state.generalizationFinished = false;
    state.t1SpeedActive = false;
    state.t1SpeedFinished = false;
    state.t1SpeedTimeLeft = 30;
    state.t1SpeedDeck = [];
    state.t1SpeedRevealed = [];
    state.t2TransformSelection = [];
    state.t2TransformFeedback = '';
    state.t2TransformSoundPlayed = false;
    state.t2TransformPieceHeard = [];
    state.t3SentenceKey = '';
    state.t3SentenceOrder = [];
    state.t3SelectedIndex = null;
    state.t3ReadingStatus = 'arranging';
    render(true);
  }

  const modeButton = event.target.closest('[data-t1-speed-mode]');
  if (!handled && modeButton) {
    handled = true;
    clearT1SpeedTimer();
    state.t1SpeedMode = modeButton.dataset.t1SpeedMode === 'challenge' ? 'challenge' : 'practice';
    state.t1SpeedActive = false;
    state.t1SpeedFinished = false;
    state.t1SpeedTimeLeft = 30;
    state.t1SpeedDeck = [];
    state.t1SpeedRevealed = [];
    render(true);
  }

  const speedCard = event.target.closest('[data-t1-speed-card]');
  if (!handled && speedCard && !speedCard.disabled) {
    handled = true;
    const index = Number(speedCard.dataset.t1SpeedCard);
    const deck = state.t1SpeedDeck.length === items.length ? state.t1SpeedDeck : items;
    if (!state.t1SpeedRevealed.includes(index)) {
      state.t1SpeedRevealed.push(index);
      if (state.t1SpeedMode === 'challenge') {
        records.push(RESULT.AWAITING);
        window.dispatchEvent(new CustomEvent('oncuvate:generalization-evaluation-request', { detail: { lesson: state.lesson, level: level.code, item: deck[index], itemIndex: records.length - 1, mode: 'speed-reading' } }));
        if (records.length >= items.length) {
          clearT1SpeedTimer();
          state.t1SpeedActive = false;
          state.t1SpeedFinished = true;
          sealUnjudgedItems(records, items.length);
          state.generalizationResult = scoreTransferLevel(records, level, items.length).verdict;
        }
      }
      const remaining = deck.map((_, cardIndex) => cardIndex).filter(cardIndex => !state.t1SpeedRevealed.includes(cardIndex));
      if (remaining.length) state.t1SpeedCurrent = remaining[Math.floor(Math.random() * remaining.length)];
    }
    render(true);
  }

  const pieceButton = event.target.closest('[data-t2-piece]');
  if (!handled && pieceButton && state.t2TransformFeedback !== 'correct') {
    handled = true;
    const word = items[Math.min(records.length, items.length - 1)];
    const cards = t2PieceCards(level, word, records.length);
    const card = cards.find(item => item.id === pieceButton.dataset.t2Piece);
    const parts = koreanPieces(word);
    if (card && !state.t2TransformSelection.includes(card.id) && state.t2TransformSelection.length < parts.length) state.t2TransformSelection.push(card.id);
    if (state.t2TransformSelection.length === parts.length) {
      const selected = state.t2TransformSelection.map(id => cards.find(item => item.id === id)?.value || '').join('');
      state.t2TransformFeedback = selected === parts.join('') ? 'correct' : 'wrong';
      if (state.t2TransformFeedback === 'wrong') state.t2TransformHadError = true;
    }
    render(true);
    if (state.t2TransformFeedback) scheduleT2TransformResolution(state.t2TransformFeedback);
  }

  const wordOption = event.target.closest('[data-t2-word-option]');
  if (!handled && wordOption && state.t2TransformFeedback !== 'correct') {
    handled = true;
    const word = items[Math.min(records.length, items.length - 1)];
    speak(wordOption.dataset.t2WordOption || '', .84);
    state.t2TransformFeedback = wordOption.dataset.t2WordOption === word ? 'correct' : 'wrong';
    if (state.t2TransformFeedback === 'wrong') state.t2TransformHadError = true;
    render(true);
    scheduleT2TransformResolution(state.t2TransformFeedback);
  }

  const sentencePiece = event.target.closest('[data-t3-piece-position]');
  if (!handled && sentencePiece && state.t3ReadingStatus === 'arranging') {
    handled = true;
    const position = Number(sentencePiece.dataset.t3PiecePosition);
    if (state.t3SelectedIndex === null) {
      state.t3SelectedIndex = position;
      render(true);
    } else {
      const sentence = items[Math.min(records.length, items.length - 1)];
      moveT3SentencePiece(state.t3SelectedIndex, position, sentence, records.length);
    }
  }

  if (handled) {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.setTimeout(publishSessionSnapshot, 0);
  }
}, true);

app.addEventListener('change', event => {
  const select = event.target.closest('[data-t2-transform-mode]');
  if (!select) return;
  clearT2TransformTimer();
  state.t2TransformMode = ['word-to-syllables', 'syllables-to-word', 'mixed'].includes(select.value) ? select.value : 'word-to-syllables';
  state.generalizationSet = (state.generalizationSet + 1) % 3;
  state.t2TransformSelection = [];
  state.t2TransformHadError = false;
  state.t2TransformFeedback = '';
  state.t2TransformSoundPlayed = false;
  state.t2TransformPieceHeard = [];
  render(true);
  window.setTimeout(publishSessionSnapshot, 0);
});

window.addEventListener('oncuvate:evaluation-result', event => {
  const step = state.lesson ? lessons[state.lesson]?.steps[state.step] : null;
  const level = step?.levels?.[state.generalizationLevel];
  if (level?.code === 'T3' && state.t3ReadingStatus === 'evaluating') {
    state.t3ReadingResult = event.detail?.result || 'support';
    state.t3ReadingStatus = 'ready';
    render(true);
  }
});

app.addEventListener('dragstart', event => {
  const piece = event.target.closest('[data-t3-piece-position]');
  if (!piece || state.t3ReadingStatus !== 'arranging') return;
  state.t3SelectedIndex = Number(piece.dataset.t3PiecePosition);
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', piece.dataset.t3PiecePosition);
});

app.addEventListener('dragover', event => {
  if (event.target.closest('[data-t3-piece-position]')) event.preventDefault();
});

app.addEventListener('drop', event => {
  const piece = event.target.closest('[data-t3-piece-position]');
  if (!piece || state.t3ReadingStatus !== 'arranging') return;
  event.preventDefault();
  const step = lessons[state.lesson].steps[state.step];
  const level = step.levels[state.generalizationLevel];
  const items = currentGeneralizationItems(level);
  const records = state.generalizationRecords[state.generalizationLevel] || [];
  moveT3SentencePiece(Number(event.dataTransfer.getData('text/plain')), Number(piece.dataset.t3PiecePosition), items[Math.min(records.length, items.length - 1)], records.length);
});

app.addEventListener('click', event => {
  const actionButton = event.target.closest('[data-action]');
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === 'restart-ask') {
      state.restartAsking = true;
      render(true);
    } else if (action === 'restart-cancel') {
      state.restartAsking = false;
      render(true);
    } else if (action === 'restart-confirm') {
      restartSession();
    } else if (action === 'start-session') {
      // 코치가 진도를 연다. 역할·방은 서버가 정해서 들어오므로 여기서 고르는 것은 없다.
      if (coachSurface) { state.lessonStarted = true; render(); }
    } else if (action === 'signal-done') {
      // 이전 캐시 화면에 버튼이 남아 있어도 아동의 종료 신호는 처리하지 않는다.
      state.activityDone = false;
    } else if (action === 'start-minute-challenge') {
      startMinuteChallenge();
    } else if (action === 'stop-minute-challenge') {
      finishMinuteChallenge(state.minuteChallengeMark - 1);
    } else if (action === 'finish-final-reading') {
      // 오늘 읽은 글 전체를 한 번에 보낸다 — 09번 §6의 「문장 단위로 묶어 보내기」와 같은 통로.
      state.finalReadingDone = true;
      window.dispatchEvent(new CustomEvent('oncuvate:reading-evaluation-request', { detail: {
        lesson: state.lesson, mode: 'final-reading',
        text: todayPassages().map(p => p.spoken).join(' '),
        context: currentProgress(),
        correctionRules: {
          minimumSimilarity: .75,
          equivalentVowels: [['ㅐ', 'ㅔ']],
          allowInitialPlainAspiratedCorrection: true,
          allowFinalMieumOmissionAtWordEnd: true
        }
      } }));
      render(true);
    } else if (action === 'raise-hand') {
      raiseHand(!state.handRaised);
    } else if (action === 'toggle-page-lock') {
      if (coachSurface) { state.pageLocked = !state.pageLocked; render(); }
    } else if (action === 'toggle-activity-lock') {
      if (coachSurface) { state.activityLocked = !state.activityLocked; render(); }
    } else if (action === 'toggle-coach-panel') {
      state.coachPanelOpen = !state.coachPanelOpen;
      render(true);
    } else if (action === 'support-close') {
      state.pendingSupport = null;
      state.coachPanelOpen = false;
      render(true);
    } else if (action === 'sound') {
      state.sound = !state.sound;
      if (!state.sound) window.speechSynthesis?.cancel();
      render(true);
    } else if (action === 'next') {
      state.step += 1;
      resetStepState();
      render();
    } else if (action === 'prev' && state.step > 0) {
      state.step -= 1;
      resetStepState();
      render();
    } else if (action === 'speak') {
      if (actionButton.matches('.sound-syllable, .connected-word')) {
        actionButton.classList.remove('sound-glow');
        void actionButton.offsetWidth;
        actionButton.classList.add('sound-glow');
        actionButton.addEventListener('animationend', () => actionButton.classList.remove('sound-glow'), { once: true });
      }
      speak(actionButton.dataset.text || '');
    } else if (action === 'speak-slow') {
      if (state.sound && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(actionButton.dataset.text || '');
        utterance.lang = 'ko-KR';
        utterance.rate = 0.62;
        window.speechSynthesis.speak(utterance);
      }
    } else if (action === 'chunks') {
      state.chunkMode = !state.chunkMode;
      render(true);
    } else if (action === 'toggle-story-text') {
      state.storyTextVisible = !state.storyTextVisible;
      if (!state.storyTextVisible) {
        window.speechSynthesis?.cancel();
        if (state.timerHandle) clearInterval(state.timerHandle);
        state.timerHandle = null;
        state.timerStart = null;
      }
      render(true);
    } else if (action === 'game-reset') {
      state.gameChoice = [];
      render(true);
    } else if (action === 'next-game-round') {
      const step = lessons[state.lesson].steps[state.step];
      const sets = currentGameSet(step);
      state.gameScore += 1;
      state.gameChoice = [];
      if (state.gameRound >= sets.length - 1) state.gameFinished = true;
      else state.gameRound += 1;
      render(true);
    } else if (action === 'game-new-set') {
      state.gameSetIndex += 1;
      state.gameRound = 0;
      state.gameScore = 0;
      state.gameFinished = false;
      state.gameChoice = [];
      render(true);
    } else if (action === 'flip-start') {
      if (independentFlipMode || coachSurface) startFlipGame();
    } else if (action === 'flip-random-assign' && coachSurface) {
      setFlipAssignment(Math.random() < .5 ? 'open' : 'closed');
    } else if (action === 'flip-balance-teams' && coachSurface) {
      balanceFlipTeams();
    } else if (action === 'flip-swap-teams' && coachSurface) {
      swapFlipTeams();
    } else if (action === 'flip-turn-child' && coachSurface && state.flipGame.active) {
      state.flipGame.turn = 'child';
      syncFlipGame();
      render(true);
    } else if (action === 'flip-turn-coach' && coachSurface && state.flipGame.active) {
      state.flipGame.turn = 'coach';
      syncFlipGame();
      render(true);
    } else if (action === 'flip-end' && coachSurface && state.flipGame.active) {
      finishFlipGame();
    } else if (action === 'flip-pass' && state.flipGame.active) {
      passFlipTurn(coachSurface ? 'coach' : 'child');
    } else if (action === 'start-letter-game') {
      const step = lessons[state.lesson].steps[state.step];
      startLetterGame(step);
    } else if (action === 'next-letter-game') {
      const step = lessons[state.lesson].steps[state.step];
      advanceLetterGame(step);
    } else if (action === 'next-sound-word') {
      state.soundRound += 1;
      state.phenomenonChoice = null;
      state.soundChoice = [];
      render(true);
    } else if (action === 'start-color-observation' && coachSurface) {
      const step = lessons[state.lesson].steps[state.step];
      // 접속 인원으로 색 주인을 정하고 굳힌다 — 시작 뒤에 사람이 들락거려도 카드 주인은 그대로다.
      state.colorObservationSeating = assignObservationSeating();
      state.colorObservationCount = state.colorObservationSeating.count;
      state.colorObservationDeck = buildColorObservationDeck(step);
      state.colorObservationIndex = 0;
      state.colorObservationRevealed = false;
      state.colorObservationResponses = [];
      state.colorObservationDone = false;
      colorObservationTimingKey = null;
      colorObservationVisibleAt = null;
      render(true);
    } else if (action === 'flip-color-observation' && state.colorObservationDeck.length) {
      // 수업 중에는 코치가 뒤집는다. 아이들 화면은 같은 카드를 함께 본다.
      if (serviceMode === 'coaching' && !coachSurface) return;
      state.colorObservationRevealed = true;
      colorObservationTimingKey = null;
      colorObservationVisibleAt = null;
      render(true);
    } else if (action === 'complete-color-observation-card' || action === 'next-color-observation-card') {
      if (serviceMode === 'coaching' && !coachSurface) return;
      const card = state.colorObservationDeck[state.colorObservationIndex];
      // 코치가 판정 없이 넘어가면 「못 쟀음」으로 남긴다 — 빈칸을 통과로 세지 않는다.
      if (coachSurface && card?.observed && !state.colorObservationResponses.some(entry => entry.cardId === card.id)) {
        const sealed = {
          lesson: state.lesson,
          cardId: card.id,
          item: card.word,
          itemIndex: card.itemIndex,
          child: observationCardOwner(card)?.id || null,
          responseTimeMs: null,
          observationPhase: 'pre_observation',
          supportLevel: 'none',
          result: RESULT.UNMEASURED,
          expectedPronunciation: card.expectedPronunciation || null,
          targetRule: card.targetRule || null,
          exposure: card.exposure || 'unseen'
        };
        state.colorObservationResponses.push(sealed);
        window.dispatchEvent(new CustomEvent('oncuvate:pre-observation-response', { detail: sealed }));
      }
      if (action === 'complete-color-observation-card' && card?.observed && card.color === myObservationColor()) {
        const responseTimeMs = Number.isFinite(colorObservationVisibleAt)
          ? Math.max(0, Math.round(performance.now() - colorObservationVisibleAt))
          : null;
        const response = {
          lesson: state.lesson,
          cardId: card.id,
          item: card.word,
          itemIndex: card.itemIndex,
          child: childId,
          responseTimeMs,
          observationPhase: 'pre_observation',
          supportLevel: 'none',
          result: responseTimeMs === null ? RESULT.UNMEASURED : RESULT.AWAITING,
          expectedPronunciation: card.expectedPronunciation || null,
          targetRule: card.targetRule || null,
          exposure: card.exposure || 'unseen'
        };
        state.colorObservationResponses.push(response);
        window.dispatchEvent(new CustomEvent('oncuvate:pre-observation-response', { detail: response }));
      }
      if (state.colorObservationIndex >= state.colorObservationDeck.length - 1) {
        state.colorObservationDone = true;
      } else {
        state.colorObservationIndex += 1;
        state.colorObservationRevealed = false;
      }
      colorObservationTimingKey = null;
      colorObservationVisibleAt = null;
      render(true);
    } else if (action === 'coach-continue-transfer') {
      state.transferCoachContinued[state.generalizationLevel] = true;
      render(true);
    } else if (action === 'next-generalization') {
      if (childSubPageLocked()) return;
      const activeStep = lessons[state.lesson]?.steps[state.step];
      enterNextTransferLevel(activeStep?.levels?.length || state.generalizationLevel + 2);
      state.generalizationResult = null;
      state.generalizationFinished = false;
      render(true);
    } else if (action === 'redraw-generalization') {
      if (childSubPageLocked()) return;
      const records = state.generalizationRecords[state.generalizationLevel] || [];
      if (records.length === 0) state.generalizationSet = (state.generalizationSet + 1) % 3;
      render(true);
    } else if (action === 'timer') {
      if (state.timerStart) {
        clearInterval(state.timerHandle);
        state.timerHandle = null;
        state.timerStart = null;
        render(true);
      } else {
        state.timerValue = 0;
        state.timerStart = performance.now();
        state.timerHandle = setInterval(() => {
          state.timerValue = Math.floor((performance.now() - state.timerStart) / 1000);
          const timer = document.querySelector('#timer');
          if (timer) timer.textContent = formatTime(state.timerValue);
        }, 250);
        render(true);
      }
    }
    return;
  }

  // 1분 읽기 도전 — 마지막으로 읽은 음절을 누르면 거기까지로 속도를 낸다.
  const syllable = event.target.closest('[data-syllable]');
  if (syllable && state.minuteChallengeActive) {
    finishMinuteChallenge(Number(syllable.dataset.syllable));
    return;
  }

  // 개입 전 관찰의 낱말 판정 — 코치 화면에서만.
  const observationResult = event.target.closest('[data-observation-result]');
  if (observationResult && coachSurface) {
    const card = state.colorObservationDeck[state.colorObservationIndex];
    const value = observationResult.dataset.observationResult;
    // 카드 주인이 누구인지 함께 남긴다 — 그룹수업에서는 같은 활동 안에 여러 아이의 기록이 섞인다.
    const owner = observationCardOwner(card);
    const responseTimeMs = Number.isFinite(colorObservationVisibleAt)
      ? Math.max(0, Math.round(performance.now() - colorObservationVisibleAt))
      : null;
    const response = {
      lesson: state.lesson,
      cardId: card?.id ?? null,
      word: card?.word ?? null,
      item: card?.word ?? null,
      itemIndex: card?.itemIndex ?? null,
      child: owner?.id || null,
      responseTimeMs,
      observationPhase: 'pre_observation',
      supportLevel: 'none',
      expectedPronunciation: card?.expectedPronunciation ?? null,
      targetRule: card?.targetRule ?? null,
      exposure: card?.exposure || 'unseen',
      result: value,
      judgedBy: 'coach',
      at: Math.round(performance.now())
    };
    state.colorObservationResponses.push(response);
    window.dispatchEvent(new CustomEvent('oncuvate:observation-judged', {
      detail: { ...response, context: currentProgress() }
    }));
    render(true);
    return;
  }

  // 참가자 별명을 누르면 그 자리에서 바로 도움 기록 입력을 연다.
  const participantButton = event.target.closest('[data-participant]');
  if (participantButton && coachSurface) {
    const id = participantButton.dataset.participant;
    // 같은 참가자를 다시 누르면 접는다. 다른 아이를 고르면 앞 기록을 이어 쓰지 않는다
    // — 그대로 두면 도움이 엉뚱한 아이에게 붙는다.
    state.selectedParticipant = state.selectedParticipant === id ? null : id;
    if (state.pendingSupport?.child !== state.selectedParticipant) state.pendingSupport = null;
    render(true);
    requestAnimationFrame(() => document.querySelector('.support-inline .support-chip')?.focus());
    return;
  }

  // 코치 도움 기록 — 코치 화면에서만 받는다.
  const supportLevelButton = event.target.closest('[data-support-level]');
  if (supportLevelButton && coachSurface) {
    recordSupport(supportLevelButton.dataset.supportLevel);
  }
  const supportFieldButton = event.target.closest('[data-support-field]');
  if (supportFieldButton && coachSurface) {
    setPendingSupportField(supportFieldButton.dataset.supportField, supportFieldButton.dataset.supportValue);
  }


  const scaleButton = event.target.closest('[data-scale]');
  if (scaleButton) {
    const value = Number(scaleButton.dataset.scale);
    if (scaleButton.dataset.kind === 'reflection') state.reflection = value;
    else state.scale = value;
    render(true);
    return;
  }

  // 색 개수는 더 이상 고르지 않는다 — 접속한 아이 수가 정한다(1:1이면 아동+선생님 2색).
  // 1:1에서 아동이 어느 색을 가질지만 코치가 고른다.
  const myColorButton = event.target.closest('[data-my-color]');
  if (myColorButton && coachSurface && !state.colorObservationDeck.length) {
    state.colorObservationMyColor = Number(myColorButton.dataset.myColor) === 1 ? 1 : 0;
    render(true);
    return;
  }

  const soundLetter = event.target.closest('[data-sound-letter]');
  if (soundLetter) {
    const key = soundLetter.dataset.soundLetter;
    if (state.markedSoundLetters.includes(key)) state.markedSoundLetters = state.markedSoundLetters.filter(item => item !== key);
    else state.markedSoundLetters.push(key);
    render(true);
    return;
  }

  const wordButton = event.target.closest('[data-word]');
  if (wordButton) {
    state.focusWord = Number(wordButton.dataset.word);
    render(true);
    return;
  }

  const syllableChoice = event.target.closest('[data-syllable-choice]');
  if (syllableChoice) {
    state.syllableChoice = syllableChoice.dataset.syllableChoice;
    render(true);
    return;
  }

  const letterGameChoice = event.target.closest('[data-letter-game-choice]');
  if (letterGameChoice && state.letterGamePhase === 'active') {
    const step = lessons[state.lesson].steps[state.step];
    recordLetterGameResponse(step, letterGameChoice.dataset.letterGameChoice);
    return;
  }

  const flipAssignment = event.target.closest('[data-flip-assign]');
  if (flipAssignment && coachSurface && !currentLessonFlipGame().active) {
    setFlipAssignment(flipAssignment.dataset.flipAssign);
    return;
  }

  const flipTeamChild = event.target.closest('[data-flip-team-child]');
  if (flipTeamChild && coachSurface && !currentLessonFlipGame().active) {
    setFlipParticipantTeam(flipTeamChild.dataset.flipTeamChild, flipTeamChild.dataset.flipTeamSide);
    return;
  }

  const flipLength = event.target.closest('[data-flip-length]');
  if (flipLength && coachSurface && !currentLessonFlipGame().active) {
    const current = currentLessonFlipGame();
    const durationSeconds = [20, 30, 60].includes(Number(flipLength.dataset.flipLength)) ? Number(flipLength.dataset.flipLength) : 30;
    state.flipGame = { ...current, lessonId: state.lesson, durationSeconds, maxTurns: 100 };
    syncFlipGame();
    render(true);
    return;
  }

  const flipCard = event.target.closest('[data-flip-card]');
  if (flipCard) {
    // 코치는 관전한다 — 젤리티처의 수는 scheduleJellyFlip이 대신 둔다.
    if (coachSurface) return;
    if (soloFlipMode()) makeFlipMove(flipCard.dataset.flipCard, 'child', childId);
    else {
      const side = currentParticipantFlipSide();
      if (side) makeFlipMove(flipCard.dataset.flipCard, side, childId);
    }
    return;
  }

  const generalizationLevel = event.target.closest('[data-generalization-level]');
  if (generalizationLevel) {
    state.generalizationLevel = Number(generalizationLevel.dataset.generalizationLevel);
    state.generalizationResult = null;
    state.generalizationFinished = false;
    render(true);
    return;
  }

  const phenomenonChoice = event.target.closest('[data-phenomenon-choice]');
  if (phenomenonChoice) {
    state.phenomenonChoice = phenomenonChoice.dataset.phenomenonChoice;
    state.soundChoice = [];
    render(true);
    return;
  }

  const soundChoice = event.target.closest('[data-sound-choice]');
  if (soundChoice) {
    const value = Number(soundChoice.dataset.soundChoice);
    state.soundChoice = state.soundChoice.includes(value)
      ? state.soundChoice.filter(item => item !== value)
      : [...state.soundChoice, value];
    render(true);
    return;
  }

  const generalizationItemResult = event.target.closest('[data-generalization-item-result]');
  if (generalizationItemResult) {
    const step = lessons[state.lesson].steps[state.step];
    const level = step.levels[state.generalizationLevel];
    const items = currentGeneralizationItems(level);
    const records = state.generalizationRecords[state.generalizationLevel];
    if (records.length >= items.length) return;
    const reported = generalizationItemResult.dataset.generalizationItemResult;
    records.push([RESULT.ACCURATE, RESULT.SELF_CORRECTED, RESULT.SUPPORT].includes(reported) ? reported : RESULT.AWAITING);
    const isLast = state.generalizationLevel === step.levels.length - 1;
    if (records.length === items.length) {
      sealUnjudgedItems(records, items.length);
      const score = scoreTransferLevel(records, level, items.length);
      state.generalizationResult = score.verdict;
      state.generalizationFinished = isLast || !canOpenNextTransferLevel(score);
    }
    render(true);
    return;
  }

  const addChunk = event.target.closest('[data-add-chunk]');
  if (addChunk) {
    const step = lessons[state.lesson].steps[state.step];
    const item = currentGameSet(step)[state.gameRound];
    const token = gameOptions(item.answer)[Number(addChunk.dataset.addChunk)];
    if (!state.gameChoice.includes(token.id)) state.gameChoice.push(token.id);
    render(true);
    return;
  }

  const removeChunk = event.target.closest('[data-remove-chunk]');
  if (removeChunk) {
    state.gameChoice.splice(Number(removeChunk.dataset.removeChunk), 1);
    render(true);
    return;
  }

  const transferChoice = event.target.closest('[data-transfer-choice]');
  if (transferChoice) {
    state.transferChoice = transferChoice.dataset.transferChoice;
    render(true);
  }
});

app.addEventListener('click', event => {
  if (serviceMode !== 'coaching') return;
  const interactive = event.target.closest([
    '[data-action]',
    '[data-scale]',
    '[data-my-color]',
    '[data-sound-letter]',
    '[data-word]',
    '[data-syllable-choice]',
    '[data-letter-game-choice]',
    '[data-flip-assign]',
    '[data-flip-team-child]',
    '[data-flip-length]',
    '[data-flip-card]',
    '[data-generalization-level]',
    '[data-phenomenon-choice]',
    '[data-sound-choice]',
    '[data-generalization-item-result]',
    '[data-t1-speed-mode]',
    '[data-t1-speed-card]',
    '[data-t2-piece]',
    '[data-t2-word-option]',
    '[data-t3-piece-position]',
    '[data-add-chunk]',
    '[data-remove-chunk]',
    '[data-transfer-choice]'
  ].join(','));
  if (interactive) window.setTimeout(publishSessionSnapshot, 0);
});

hydrateFlipGame();
setupFlipGameSync();
setupSessionSync();
subscribeParticipants();
setupNaturalKoreanSpeech();
render();
