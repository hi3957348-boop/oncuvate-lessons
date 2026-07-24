(function () {
  "use strict";

  var BOOK_CONFIG = window.ONCUVATE_BOOK_CONFIG || {};

  var GAME_ACTIVITIES = BOOK_CONFIG.gameActivities || {
    listen: {
      title: "듣고 고르기",
      icon: "ear",
      note: "소리를 듣고 비슷하게 생긴 글자 중 정답을 찾아요.",
      items: [
        { cue: "먹었어요.", answer: "먹었어요.", choices: ["먹었어요.", "먹었지요.", "먹었고요.", "먹었네요.", "먹을까요?"] },
        { cue: "걸렸어요.", answer: "걸렸어요.", choices: ["걸렸어요.", "걸었어요.", "걸렀어요.", "걸리지요.", "걸렸네요."] },
        { cue: "아파요.", answer: "아파요.", choices: ["아파요.", "아파서요.", "아프고요.", "아프지요.", "아플까요?"] },
        { cue: "시려요.", answer: "시려요.", choices: ["시려요.", "싫어요.", "시려서요.", "시리고요.", "시릴까요?"] },
        { cue: "가려워요.", answer: "가려워요.", choices: ["가려워요.", "가벼워요.", "가려워서요.", "가렵지요.", "가려울까요?"] },
        { cue: "삐끗했어요.", answer: "삐끗했어요.", choices: ["삐끗했어요.", "삐걱했어요.", "삐끗했고요.", "삐끗했지요.", "삐끗할까요?"] },
        { cue: "진찰해요.", answer: "진찰해요.", choices: ["진찰해요.", "진찰했어요.", "진찰하고요.", "진찰하지요.", "진찰할까요?"] },
        { cue: "안과에서", answer: "안과에서", choices: ["안과에서", "안과에도", "안과부터", "안과까지", "안과하고"] },
        { cue: "목이", answer: "목이", choices: ["목이", "목을", "목은", "목과", "몫이"] },
        { cue: "감기약을", answer: "감기약을", choices: ["감기약을", "감기약이", "감기약은", "감기약과", "감기약도"] }
      ]
    },
    order: {
      title: "순서대로 고르기",
      icon: "order",
      note: "들은 말을 차례대로 기차에 태워 문장을 완성해요.",
      items: [
        { cue: ["내과", "안과", "치과"], answer: ["내과", "안과", "치과"], distractors: ["외과", "피부과", "약국"] },
        { cue: ["목이", "귀가", "아파요"], answer: ["목이", "귀가", "아파요"], distractors: ["눈이", "코가", "시려요"] },
        { cue: ["감기", "주사", "약"], answer: ["감기", "주사", "약"], distractors: ["기침", "진찰", "병원"] },
        { cue: ["피부과", "안과", "정형외과"], answer: ["피부과", "안과", "정형외과"], distractors: ["치과", "내과", "이비인후과"] },
        { cue: ["넘어져서", "발목이", "삐끗했어요"], answer: ["넘어져서", "발목이", "삐끗했어요"], distractors: ["달려가서", "손목이", "아팠어요"] }
      ]
    },
    anagram: {
      title: "낱말 · 어구 조립",
      icon: "blocks",
      note: "세 음절 이상의 낱말이나 짧은 말을 조립해 읽어요.",
      items: [
        { cue: "감 · 기 · 약을 읽고 그대로 조립해요.", answer: "감기약", parts: ["감", "기", "약"] },
        { cue: "진 · 찰 · 실을 읽고 그대로 조립해요.", answer: "진찰실", parts: ["진", "찰", "실"] },
        { cue: "소 · 아 · 과를 읽고 그대로 조립해요.", answer: "소아과", parts: ["소", "아", "과"] },
        { cue: "피 · 부 · 과를 읽고 그대로 조립해요.", answer: "피부과", parts: ["피", "부", "과"] },
        { cue: "정 · 형 · 외 · 과를 읽고 그대로 조립해요.", answer: "정형외과", parts: ["정", "형", "외", "과"] }
      ]
    }
  };

  var REVIEW_ACTIVITIES = BOOK_CONFIG.reviewActivities || {
    quiz: {
      title: "내용 퀴즈",
      icon: "quiz",
      note: "읽은 내용을 떠올려 정답을 찾아요.",
      items: [
        { cue: "감기에 걸리거나 배가 아플 때 가는 곳은?", answer: "내과", choices: ["내과", "안과", "치과", "피부과"] },
        { cue: "눈동자가 시리거나 다래끼가 났을 때 가는 곳은?", answer: "안과", choices: ["이비인후과", "정형외과", "안과", "내과"] },
        { cue: "이가 아프거나 충치가 생겼을 때 가는 곳은?", answer: "치과", choices: ["치과", "피부과", "안과", "내과"] },
        { cue: "피부가 가렵거나 두드러기가 났을 때 가는 곳은?", answer: "피부과", choices: ["소아청소년과", "피부과", "정형외과", "치과"] },
        { cue: "넘어져서 발목이 삐끗했을 때 가는 곳은?", answer: "정형외과", choices: ["정형외과", "이비인후과", "안과", "내과"] }
      ]
    },
    train: {
      title: "문장 기차",
      icon: "train",
      note: "앞뒤 뜻이 자연스럽게 이어지는 칸을 골라요.",
      items: [
        { cue: "콜록콜록 감기에", answer: "걸렸어요.", choices: ["걸렸어요.", "넘어졌어요.", "가려워요.", "삐끗했어요."] },
        { cue: "목이 아프고 귀가", answer: "아파요.", choices: ["시려요.", "아파요.", "가려워요.", "부러졌어요."] },
        { cue: "눈동자가 시리면", answer: "안과에 가요.", choices: ["치과에 가요.", "안과에 가요.", "피부과에 가요.", "내과에 가요."] },
        { cue: "피부가 가렵거나", answer: "두드러기가 났어요.", choices: ["이가 아파요.", "배가 아파요.", "두드러기가 났어요.", "눈이 시려요."] },
        { cue: "넘어져서 발목이", answer: "삐끗했어요.", choices: ["삐끗했어요.", "가려워요.", "시려요.", "따가워요."] }
      ]
    },
    josa: {
      title: "조사 채우기",
      icon: "pencil",
      note: "문장에 알맞은 조사를 골라 완성해요.",
      items: [
        { cue: "감기__ 걸렸어요.", answer: "에", choices: ["에", "를", "가", "는"] },
        { cue: "목__ 아파요.", answer: "이", choices: ["이", "을", "에", "와"] },
        { cue: "안과__ 가요.", answer: "에", choices: ["에", "가", "를", "은"] },
        { cue: "의사 선생님__ 진찰해요.", answer: "이", choices: ["이", "을", "와", "에"] },
        { cue: "발목__ 삐끗했어요.", answer: "을", choices: ["을", "이", "에", "는"] }
      ]
    }
  };

  var WORKSHEET_ACTIVITIES = BOOK_CONFIG.worksheets || {};

  var state = {
    mode: "read",
    section: "game",
    activity: "listen",
    unit: "word",
    difficulty: "easy",
    phase: "intro",
    index: 0,
    score: 0,
    attempts: 0,
    response: null,
    selected: [],
    revision: 0
  };

  var refs = {};
  var applyingLearningState = false;
  var originalGetState = null;
  var originalApplyState = null;
  var heardQuestionKey = "";
  var cuePlayingKey = "";
  var learningAudio = null;
  var worksheetAudio = null;
  var learningPlaybackId = 0;
  var gameAudioContext = null;

  function byId(id) { return document.getElementById(id); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function shuffle(values) {
    var list = values.slice();
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    }
    return list;
  }
  function stableShuffle(values, seedText) {
    var list = values.slice();
    var seed = 2166136261;
    String(seedText).split("").forEach(function (character) {
      seed ^= character.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    });
    for (var i = list.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      var j = seed % (i + 1);
      var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    }
    return list;
  }
  function questionKey() {
    return [state.section, state.activity, state.index, state.difficulty].join(":");
  }
  function distractorCount(activity) {
    if (activity === "order") {
      return state.difficulty === "challenge" ? 3 : state.difficulty === "normal" ? 2 : 1;
    }
    if (activity === "listen") {
      return state.difficulty === "challenge" ? 4 : state.difficulty === "normal" ? 3 : 2;
    }
    return state.difficulty === "challenge" ? 3 : state.difficulty === "normal" ? 2 : 1;
  }
  function difficultyHint(activity, value) {
    var count = value === "challenge" ? (activity === "listen" ? 4 : 3)
      : value === "normal" ? (activity === "listen" ? 3 : 2)
      : (activity === "listen" ? 2 : 1);
    return activity === "listen" || activity === "order" ? "방해 " + count : "보기 " + (count + 1);
  }
  function playGameSound(kind) {
    if (isTeacher()) return;
    try {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!gameAudioContext) gameAudioContext = new AudioContextClass();
      var context = gameAudioContext;
      if (context.state === "suspended") context.resume();
      var now = context.currentTime;
      var notes = kind === "correct" ? [523.25, 659.25, 783.99]
        : kind === "wrong" ? [246.94, 196]
        : kind === "remove" ? [392, 329.63]
        : [440, 554.37];
      notes.forEach(function (frequency, index) {
        var oscillator = context.createOscillator();
        var gain = context.createGain();
        var start = now + index * (kind === "correct" ? 0.09 : 0.06);
        oscillator.type = kind === "wrong" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(kind === "correct" ? 0.09 : 0.055, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.18);
      });
    } catch (_) {}
  }
  function removeBatchim(character) {
    var code = String(character || "").charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return character;
    var finalIndex = (code - 0xac00) % 28;
    return finalIndex ? String.fromCharCode(code - finalIndex) : character;
  }
  function isConnected() {
    try { return typeof syncClient !== "undefined" && syncClient && syncClient.connected; } catch (_) { return false; }
  }
  function isTeacher() {
    var consoleEl = byId("ocConsole");
    if (isConnected()) return !!consoleEl && consoleEl.style.display === "flex";
    return !/room=/.test(location.hash);
  }
  function roleName() {
    if (!isConnected()) return isTeacher() ? "강사 미리보기" : "학생 연결 중";
    return isTeacher() ? "강사 화면" : "학생 화면";
  }
  function activityMap() { return state.section === "review" ? REVIEW_ACTIVITIES : GAME_ACTIVITIES; }
  function currentActivity() { return activityMap()[state.activity] || activityMap()[Object.keys(activityMap())[0]]; }
  function currentItem() {
    var activity = currentActivity();
    return activity.items[Math.max(0, Math.min(state.index, activity.items.length - 1))];
  }
  function answerText(item) {
    return Array.isArray(item.answer) ? item.answer.join(" → ") : item.answer;
  }
  function totalItems() { return currentActivity().items.length; }

  function makeNavButton(id, icon, label) {
    var button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.innerHTML = '<span class="oc-nav-icon ' + icon + '" aria-hidden="true"></span><span class="oc-nav-label">' + label + "</span>";
    return button;
  }

  function createPanel(id, section) {
    var panel = document.createElement("section");
    panel.id = id;
    panel.className = "oc-learning-panel";
    panel.dataset.section = section;
    panel.style.display = "none";
    return panel;
  }

  function init() {
    var shell = byId("ocStudioShell");
    var content = byId("ocStudioContent");
    var modebar = document.querySelector(".oc-studio-nav .modebar");
    var gameMode = byId("gameMode");
    var testMode = byId("testMode");
    var mGame = byId("mGame");
    var mReading = byId("mReading");
    var mTest = byId("mTest");
    var mWS = byId("mWS");
    if (!shell || !content || !modebar || !gameMode || !testMode || !mGame || !mReading || !mTest || !mWS) return;

    refs.shell = shell;
    refs.content = content;
    refs.modebar = modebar;
    refs.game = gameMode;
    refs.read = byId("readingMode");
    refs.test = testMode;
    refs.mGame = mGame;
    refs.mRead = mReading;
    refs.mTest = mTest;
    refs.mWS = mWS;

    gameMode.innerHTML = "";
    gameMode.className = "oc-learning-panel";
    gameMode.dataset.section = "game";

    var review = createPanel("reviewMode", "review");
    var worksheet = createPanel("worksheetMode", "worksheet");
    content.insertBefore(review, testMode);
    content.insertBefore(worksheet, content.querySelector(".oc-indexbtn"));
    refs.review = review;
    refs.worksheet = worksheet;

    var mReview = makeNavButton("mReview", "review", "복습");
    refs.mReview = mReview;
    modebar.insertBefore(mReview, mTest);

    mGame.innerHTML = '<span class="oc-nav-icon game" aria-hidden="true"></span><span class="oc-nav-label">게임</span>';
    mReading.innerHTML = '<span class="oc-nav-icon book" aria-hidden="true"></span><span class="oc-nav-label">읽기</span>';
    mTest.innerHTML = '<span class="oc-nav-icon mic" aria-hidden="true"></span><span class="oc-nav-label">유창성 테스트</span>';
    mWS.innerHTML = '<span class="oc-nav-icon sheet" aria-hidden="true"></span><span class="oc-nav-label">워크시트</span>';

    [mGame, mReading, mReview, mTest, mWS].forEach(function (button) { modebar.appendChild(button); });

    buildLearningPanel(gameMode, "game");
    buildLearningPanel(review, "review");
    buildWorksheet(worksheet);
    bindModeButtons();
    bindSync();
    window.OcLearning = {
      showMode: showMode,
      isTeacher: isTeacher,
      publish: publish
    };
    window.setInterval(refreshRole, 600);
    showMode("game", false);
  }

  function buildLearningPanel(panel, section) {
    var isReview = section === "review";
    panel.innerHTML =
      '<div class="oc-flow-head">' +
        '<div><span class="oc-flow-kicker">' + (isReview ? "REVIEW LAB" : "LEARNING GAME") + '</span>' +
        '<h2>' + (isReview ? "읽은 내용을 단단하게 복습해요" : "소리와 글자를 즐겁게 연결해요") + '</h2>' +
        '<p>' + (isReview ? "퀴즈·문장·조사를 한 문제씩 확인합니다." : "강사가 시작하고, 학생이 충분히 읽은 뒤 다음 문제로 이동합니다.") + '</p></div>' +
        '<span class="oc-role-chip" data-role></span>' +
      '</div>' +
      '<div class="oc-activity-cards" data-activities></div>' +
      '<div class="oc-session-options">' +
        '<div class="oc-option-group" data-unit-wrap><span>읽기 단위</span><div class="oc-option-seg" data-option="unit">' +
          '<button type="button" data-value="syl">1음절</button><button type="button" data-value="word">낱말</button>' +
        '</div></div>' +
        '<div class="oc-option-group"><span>난이도</span><div class="oc-option-seg" data-option="difficulty">' +
          '<button type="button" data-value="easy">쉬움</button><button type="button" data-value="normal">보통</button><button type="button" data-value="challenge">도전</button>' +
        '</div></div>' +
      '</div>' +
      '<div class="oc-session-card" data-session></div>';

    var activityBox = panel.querySelector("[data-activities]");
    var activities = isReview ? REVIEW_ACTIVITIES : GAME_ACTIVITIES;
    Object.keys(activities).forEach(function (key) {
      var item = activities[key];
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.activity = key;
      button.innerHTML =
        '<span class="oc-activity-icon ' + item.icon + '" aria-hidden="true"></span>' +
        '<span><strong>' + item.title + '</strong><small>' + item.note + "</small></span>";
      activityBox.appendChild(button);
    });
    if (isReview) panel.querySelector("[data-unit-wrap]").style.display = "none";

    panel.addEventListener("click", function (event) {
      var activityButton = event.target.closest("[data-activity]");
      var optionButton = event.target.closest("[data-option] button");
      var actionButton = event.target.closest("[data-action]");
      if (activityButton) {
        if (!isTeacher()) return;
        state.section = section;
        state.activity = activityButton.dataset.activity;
        resetSession();
        publish();
      } else if (optionButton) {
        if (!isTeacher()) return;
        var name = optionButton.closest("[data-option]").dataset.option;
        state[name] = optionButton.dataset.value;
        resetSession();
        publish();
      } else if (actionButton) {
        handleAction(actionButton.dataset.action, actionButton);
      }
    });
  }

  function buildWorksheet(panel) {
    panel.innerHTML =
      '<div class="oc-flow-head"><div><span class="oc-flow-kicker">A4 ACTIVITY</span><h2>화면에서 풀고, A4로 인쇄해요</h2>' +
      '<p>바로 내려받지 않고 수업 중 작성한 뒤 그대로 인쇄할 수 있습니다.</p></div>' +
      '<button class="oc-print-btn" type="button" data-print>인쇄하기</button></div>' +
      '<div class="oc-ws-tabs">' +
        '<button type="button" class="is-active" data-ws-tab="batchim">빠진 받침</button>' +
        '<button type="button" data-ws-tab="josa">조사 채우기</button>' +
        '<button type="button" data-ws-tab="dictation">받아쓰기</button>' +
      '</div>' +
      '<article class="oc-worksheet-sheet" data-ws-sheet></article>';

    panel.addEventListener("click", function (event) {
      var syllableInput = event.target.closest(".oc-syllable-input.needs-fix");
      if (syllableInput && syllableInput.dataset.started !== "true") {
        syllableInput.value = "";
        syllableInput.dataset.started = "true";
      }
      var tab = event.target.closest("[data-ws-tab]");
      if (tab) {
        panel.querySelectorAll("[data-ws-tab]").forEach(function (button) { button.classList.toggle("is-active", button === tab); });
        renderWorksheet(tab.dataset.wsTab);
      }
      if (event.target.closest("[data-print]")) window.print();
      var check = event.target.closest("[data-ws-check]");
      if (check) checkWorksheet(check.dataset.wsCheck);
      var play = event.target.closest("[data-ws-play]");
      if (play) playWorksheetText(play.dataset.wsPlay);
    });
    renderWorksheet("batchim");
  }

  function worksheetHeader(title, instruction) {
    return '<header class="oc-ws-header"><div><span>ONCUVATE READING STUDIO</span><h2>' + title + '</h2><p>' + instruction + '</p></div>' +
      '<div class="oc-ws-name"><label>이름 <input type="text" aria-label="이름"></label><label>날짜 <input type="text" aria-label="날짜"></label></div></header>';
  }

  function renderWorksheet(type) {
    var sheet = refs.worksheet.querySelector("[data-ws-sheet]");
    if (type === "josa") {
      var rows = WORKSHEET_ACTIVITIES.josa || [
        ["감기", "걸렸어요.", "에"], ["목", "아파요.", "이"], ["안과", "가요.", "에"],
        ["의사 선생님", "진찰해요.", "이"], ["발목", "삐끗했어요.", "을"]
      ];
      sheet.innerHTML = worksheetHeader("조사 채우기", "빈칸에 알맞은 조사를 골라 문장을 완성해 보세요.") +
        '<ol class="oc-ws-list">' + rows.map(function (row, index) {
          return '<li><span>' + row[0] + '</span><select data-answer="' + row[2] + '"><option value="">고르기</option><option>이</option><option>가</option><option>을</option><option>를</option><option>에</option></select><span>' + row[1] + '</span><i></i></li>';
        }).join("") + '</ol><button class="oc-ws-check" type="button" data-ws-check="josa">확인하기</button>';
    } else if (type === "dictation") {
      var dictation = WORKSHEET_ACTIVITIES.dictation || ["내과에 가요.", "목이 아파요.", "안과에서 진찰을 받아요.", "피부과에 가야 해요.", "발목을 삐끗했어요."];
      sheet.innerHTML = worksheetHeader("문장 받아쓰기", "소리를 듣고 문장을 천천히 적어 보세요.") +
        '<ol class="oc-ws-list oc-dictation">' + dictation.map(function (text) {
          return '<li><button type="button" data-ws-play="' + escapeHtml(text) + '">소리 듣기</button><input type="text" data-answer="' + escapeHtml(text.replace(/[.\s]/g, "")) + '" aria-label="받아쓰기 답"><i></i></li>';
        }).join("") + '</ol><button class="oc-ws-check" type="button" data-ws-check="dictation">확인하기</button>';
    } else {
      var batchim = (WORKSHEET_ACTIVITIES.batchim || [
        { answer: "감기에 걸렸어요." },
        { answer: "목이 아파요." },
        { answer: "발목을 삐끗했어요." },
        { answer: "눈동자가 시려요." },
        { answer: "감기약을 먹었어요." }
      ]).map(function (row) {
        return typeof row === "string" ? { answer: row } : row;
      });
      sheet.innerHTML = worksheetHeader("빠진 받침 채우기", "소리를 듣고, 받침이 빠진 글자를 완성해서 적어 보세요.") +
        '<div class="oc-batchim-guide"><span>1. 소리 듣기</span><i></i><span>2. 받침 없는 글자 보기</span><i></i><span>3. 완성 글자 쓰기</span></div>' +
        '<ol class="oc-ws-list oc-batchim-list is-sentence">' + batchim.map(function (row, index) {
          var answerLetters = Array.from(row.answer);
          var syllables = answerLetters.map(function (answerLetter, letterIndex) {
            var shownLetter = removeBatchim(answerLetter);
            if (answerLetter === " ") return '<span class="oc-syllable-space" aria-hidden="true"></span>';
            if (!/[가-힣]/.test(answerLetter)) return '<span class="oc-syllable-punctuation">' + escapeHtml(answerLetter) + '</span>';
            var needsFix = answerLetter !== shownLetter;
            return '<input type="text" maxlength="1" class="oc-syllable-input ' + (needsFix ? "needs-fix" : "is-given") + '" value="' +
              escapeHtml(shownLetter) + '" data-syllable-answer="' + escapeHtml(answerLetter) + '" ' +
              (needsFix ? "" : "readonly ") + 'aria-label="' + (letterIndex + 1) + '번째 음절">';
          }).join("");
          return '<li><span class="oc-batchim-number">' + (index + 1) + '</span><button type="button" class="oc-batchim-listen" data-ws-play="' + escapeHtml(row.answer) + '"><b></b>문장 듣기</button>' +
            '<div class="oc-syllable-editor" aria-label="받침이 빠진 문장">' + syllables + '</div><i class="oc-sentence-mark"></i></li>';
        }).join("") + '</ol><button class="oc-ws-check" type="button" data-ws-check="batchim">확인하기</button>';
    }
  }

  function checkWorksheet() {
    refs.worksheet.querySelectorAll("[data-answer]").forEach(function (input) {
      var value = (input.value || "").replace(/[.\s]/g, "");
      var correct = value === input.dataset.answer;
      var row = input.closest("li");
      row.classList.toggle("is-correct", correct);
      row.classList.toggle("is-wrong", !correct);
      var mark = row.querySelector("i");
      if (mark) mark.textContent = correct ? "정답" : "다시 보기";
    });
    refs.worksheet.querySelectorAll(".oc-batchim-list.is-sentence > li").forEach(function (row) {
      var fields = row.querySelectorAll("[data-syllable-answer]");
      var allCorrect = true;
      fields.forEach(function (input) {
        var correct = input.value === input.dataset.syllableAnswer;
        input.classList.toggle("is-correct", correct);
        input.classList.toggle("is-wrong", !correct);
        if (!correct) allCorrect = false;
      });
      row.classList.toggle("is-correct", allCorrect);
      row.classList.toggle("is-wrong", !allCorrect);
      var mark = row.querySelector(".oc-sentence-mark");
      if (mark) mark.textContent = allCorrect ? "정답" : "받침을 다시 확인해요";
    });
  }

  async function playWorksheetText(text) {
    if (worksheetAudio) {
      try { worksheetAudio.pause(); } catch (_) {}
    }
    try {
      var response = await fetch("/api/google-tts?text=" + encodeURIComponent(text), { cache: "force-cache" });
      if (!response.ok) throw new Error("google-tts");
      var objectUrl = URL.createObjectURL(await response.blob());
      var audio = new Audio(objectUrl);
      worksheetAudio = audio;
      audio.onended = function () { URL.revokeObjectURL(objectUrl); };
      audio.onerror = function () { URL.revokeObjectURL(objectUrl); playBrowserFallback(text); };
      var started = audio.play();
      if (started && typeof started.catch === "function") {
        started.catch(function () { URL.revokeObjectURL(objectUrl); playBrowserFallback(text); });
      }
    } catch (_) {
      playBrowserFallback(text);
    }
  }

  function bindModeButtons() {
    refs.mGame.onclick = function () { showMode("game", true); };
    refs.mRead.onclick = function () { showMode("read", true); };
    refs.mReview.onclick = function () { showMode("review", true); };
    refs.mTest.onclick = function () { showMode("test", true); };
    refs.mWS.onclick = function (event) { event.preventDefault(); showMode("worksheet", true); };
  }

  function showMode(mode, shouldPublish) {
    state.mode = mode;
    var visible = { game: refs.game, read: refs.read, review: refs.review, test: refs.test, worksheet: refs.worksheet };
    Object.keys(visible).forEach(function (key) {
      if (visible[key]) visible[key].style.display = key === mode ? "" : "none";
    });
    var buttons = { game: refs.mGame, read: refs.mRead, review: refs.mReview, test: refs.mTest, worksheet: refs.mWS };
    Object.keys(buttons).forEach(function (key) { buttons[key].classList.toggle("on", key === mode); });
    if (mode === "game") state.section = "game";
    if (mode === "review") state.section = "review";
    if (mode === "game" || mode === "review") {
      ensureActivityForSection();
      renderLearning();
    }
    if (mode === "test" && window.OcFluency && typeof window.OcFluency.prepareMicrophone === "function") {
      window.setTimeout(function () { window.OcFluency.prepareMicrophone(); }, 80);
    }
    var focus = document.querySelector(".oc-focus-chip");
    if (focus) {
      var labels = { game: "게임", read: "읽기", review: "복습", test: "발음 · 속도 · 끊어읽기", worksheet: "A4 활동지" };
      focus.textContent = labels[mode];
    }
    refs.content.scrollTop = 0;
    if (shouldPublish && isTeacher()) publish();
  }

  function ensureActivityForSection() {
    var map = activityMap();
    if (!map[state.activity]) state.activity = Object.keys(map)[0];
  }

  function resetSession() {
    state.phase = "intro";
    state.index = 0;
    state.score = 0;
    state.attempts = 0;
    state.response = null;
    state.selected = [];
    heardQuestionKey = "";
    cuePlayingKey = "";
    state.revision++;
    renderLearning();
  }

  function startSession() {
    if (!isTeacher()) return;
    state.phase = "question";
    state.index = 0;
    state.score = 0;
    state.attempts = 0;
    state.response = null;
    state.selected = [];
    heardQuestionKey = "";
    cuePlayingKey = "";
    state.revision++;
    renderLearning();
    publish();
  }

  function nextQuestion() {
    if (!isTeacher() || state.phase !== "answered") return;
    if (state.index + 1 >= totalItems()) {
      state.phase = "complete";
    } else {
      state.index++;
      state.phase = "question";
      state.response = null;
      state.selected = [];
      heardQuestionKey = "";
      cuePlayingKey = "";
    }
    state.revision++;
    renderLearning();
    publish();
  }

  function handleAction(action, button) {
    if (action === "start" || action === "restart") { startSession(); return; }
    if (action === "next") { nextQuestion(); return; }
    if (action === "replay") { if (!isTeacher()) revealAfterCue(currentItem()); return; }
    if (action === "answer") { submitAnswer(button.dataset.value); return; }
    if (action === "part") { submitPart(button.dataset.value); return; }
    if (action === "remove-part") {
      if (!isTeacher() && state.phase === "question") {
        state.selected.splice(Number(button.dataset.index), 1);
        playGameSound("remove");
        renderLearning();
      }
      return;
    }
    if (action === "check-order") {
      if (!isTeacher() && state.phase === "question" && state.selected.length === currentItem().answer.length) {
        submitAnswer(state.selected.join("|"));
      }
      return;
    }
    if (action === "clear-parts") {
      if (!isTeacher() && state.phase === "question") {
        state.selected = [];
        playGameSound("remove");
        renderLearning();
      }
    }
  }

  function submitPart(value) {
    if (isTeacher() || state.phase !== "question") return;
    var item = currentItem();
    if (state.activity === "order" && state.selected.length >= item.answer.length) return;
    state.selected.push(value);
    playGameSound("select");
    if (state.activity !== "order" && state.selected.length >= item.answer.length) {
      submitAnswer(state.selected.join("|"));
    } else {
      renderLearning();
    }
  }

  function submitAnswer(value) {
    if (isTeacher() || state.phase !== "question") return;
    var item = currentItem();
    var expected = Array.isArray(item.answer) ? item.answer.join("|") : item.answer;
    var correct = value === expected;
    state.attempts++;
    state.response = { value: value, correct: correct, at: Date.now() };
    state.phase = "answered";
    if (correct) state.score++;
    playGameSound(correct ? "correct" : "wrong");
    renderLearning();
    publish();
  }

  function renderLearning() {
    var panel = state.section === "review" ? refs.review : refs.game;
    if (!panel) return;
    refreshRole();
    panel.querySelectorAll("[data-activity]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.activity === state.activity);
      button.disabled = !isTeacher();
    });
    panel.querySelectorAll("[data-option] button").forEach(function (button) {
      var name = button.closest("[data-option]").dataset.option;
      button.classList.toggle("is-active", state[name] === button.dataset.value);
      button.disabled = !isTeacher();
      if (name === "difficulty") {
        var labels = { easy: "쉬움", normal: "보통", challenge: "도전" };
        button.innerHTML = "<strong>" + labels[button.dataset.value] + "</strong><small>" +
          difficultyHint(state.activity, button.dataset.value) + "</small>";
      }
    });
    var session = panel.querySelector("[data-session]");
    if (state.phase === "intro") renderIntro(session);
    else if (state.phase === "complete") renderComplete(session);
    else renderQuestion(session);
  }

  function renderIntro(session) {
    var activity = currentActivity();
    session.className = "oc-session-card is-intro";
    session.innerHTML =
      '<div class="oc-session-ribbon"><span>준비</span><strong>시작과 끝이 있는 ' + totalItems() + '문제</strong></div>' +
      '<div class="oc-intro-visual"><span class="oc-big-activity ' + activity.icon + '"></span></div>' +
      '<h3>' + activity.title + '</h3><p>' + activity.note + '</p>' +
      '<div class="oc-session-guide"><span>1</span> 선생님이 시작해요 <i></i><span>2</span> 학생이 풀어요 <i></i><span>3</span> 선생님이 다음 문제로 넘겨요</div>' +
      (isTeacher()
        ? '<button class="oc-primary-action" type="button" data-action="start">수업 시작</button>'
        : '<div class="oc-waiting"><b></b> 선생님이 시작할 때까지 기다려요</div>');
  }

  function renderQuestion(session) {
    var teacher = isTeacher();
    var item = currentItem();
    var activity = currentActivity();
    var answered = state.phase === "answered";
    var needsListening = !teacher && !answered && state.section === "game" && (state.activity === "listen" || state.activity === "order");
    var currentKey = questionKey();
    var choicesReady = !needsListening || heardQuestionKey === currentKey;
    var progress = Math.round(((state.index + (answered ? 1 : 0)) / totalItems()) * 100);
    session.className = "oc-session-card is-question" + (answered ? " is-answered" : "");
    var html =
      '<div class="oc-question-top"><div><span class="oc-round-label">' + (state.section === "review" ? "복습" : "게임") + ' · ' + activity.title + '</span>' +
      '<strong>' + (state.index + 1) + ' / ' + totalItems() + '</strong></div><span class="oc-role-mini">' + roleName() + '</span></div>' +
      '<div class="oc-progress-track"><i style="width:' + progress + '%"></i></div>';

    if (teacher) html += renderTeacherQuestion(item, answered);
    else html += renderStudentQuestion(item, answered, choicesReady);
    session.innerHTML = html;

    if (needsListening && !choicesReady && cuePlayingKey !== currentKey) {
      window.setTimeout(function () { revealAfterCue(item); }, 180);
    }
  }

  function renderTeacherQuestion(item, answered) {
    var result = "";
    if (answered && state.response) {
      result = '<div class="oc-teacher-result ' + (state.response.correct ? "is-correct" : "is-wrong") + '">' +
        '<span class="oc-result-mark">' + (state.response.correct ? "✓" : "×") + '</span>' +
        '<div><small>학생 응답</small><strong>' + (state.response.correct ? "정답이에요" : "다시 확인이 필요해요") + '</strong></div></div>';
    } else {
      result = '<div class="oc-teacher-wait"><span></span><div><small>학생 응답 대기</small><strong>학생 화면에서 문제를 풀고 있어요</strong></div></div>';
    }
    return '<div class="oc-teacher-console">' +
      '<div class="oc-teacher-cue"><span>현재 문제</span><strong>' + escapeHtml(Array.isArray(item.cue) ? item.cue.join(" · ") : item.cue) + '</strong>' +
      '<small>강사 화면에서는 소리가 재생되지 않습니다.</small></div>' + result +
      '<div class="oc-teacher-actions">' +
        '<span>' + (answered ? "학생이 충분히 읽었는지 확인한 뒤 이동하세요." : "학생의 응답이 오면 정답·오답만 표시됩니다.") + '</span>' +
        '<button type="button" data-action="next" ' + (!answered ? "disabled" : "") + '>' + (state.index + 1 >= totalItems() ? "학습 마치기" : "다음 문제") + '</button>' +
      '</div></div>';
  }

  function renderStudentQuestion(item, answered, choicesReady) {
    if (answered) {
      var correct = state.response && state.response.correct;
      var trainCelebration = state.activity === "order" && correct
        ? '<div class="oc-mini-train-celebration" aria-hidden="true"><i></i><b></b><span></span></div>' : "";
      return '<div class="oc-student-feedback ' + (correct ? "is-correct" : "is-wrong") + '">' + trainCelebration +
        '<span class="oc-feedback-icon">' + (correct ? "✓" : "↻") + '</span>' +
        '<h3>' + (correct ? "정확하게 읽었어요!" : "한 번 더 소리 내어 읽어 봐요") + '</h3>' +
        '<p>정답: <strong>' + escapeHtml(answerText(item)) + '</strong></p>' +
        '<div class="oc-waiting"><b></b> 선생님이 확인하고 다음 문제로 넘겨 줄 거예요</div></div>';
    }

    var isListeningGame = state.section === "game" && (state.activity === "listen" || state.activity === "order");
    var cue = isListeningGame
      ? (choicesReady ? "이제 보기에서 골라 보세요." : "소리가 끝나면 보기가 나타나요.")
      : (Array.isArray(item.cue) ? "소리의 순서를 기억하세요" : item.cue);
    var replay = state.section === "game" && (state.activity === "listen" || state.activity === "order")
      ? '<button class="oc-listen-button" type="button" data-action="replay"><span></span>' + (choicesReady ? "다시 듣기" : "소리 듣기") + '</button>' : "";
    var answerArea = "";
    if (!choicesReady) {
      answerArea = '<div class="oc-listening-gate"><i></i><strong>먼저 소리를 잘 들어 보세요</strong><span>재생이 끝나면 글자 카드가 나타나요.</span></div>';
    } else if (state.activity === "order") {
      var orderPool = item.answer.concat((item.distractors || []).slice(0, distractorCount("order")));
      var remaining = stableShuffle(orderPool, questionKey()).slice();
      state.selected.forEach(function (selected) {
        var selectedIndex = remaining.indexOf(selected);
        if (selectedIndex >= 0) remaining.splice(selectedIndex, 1);
      });
      var orderOptions = remaining.map(function (value) {
        return '<button type="button" class="oc-station-ticket" data-action="part" data-value="' + escapeHtml(value) + '" ' +
          (state.selected.length >= item.answer.length ? "disabled" : "") + '><span>탑승</span>' + escapeHtml(value) + '</button>';
      }).join("");
      answerArea = '<div class="oc-order-answer oc-order-train-game">' +
        '<div class="oc-train-sky" aria-hidden="true"><i></i><i></i><b></b><b></b></div>' +
        '<div class="oc-game-train"><div class="oc-train-engine" aria-hidden="true"><i></i><b></b><span></span></div>' +
        '<div class="oc-order-slots oc-train-cars">' +
        item.answer.map(function (_, index) {
          return state.selected[index]
            ? '<button type="button" class="oc-train-car is-filled" data-action="remove-part" data-index="' + index + '" title="눌러서 기차에서 내리기"><em>' + (index + 1) + '</em><strong>' + escapeHtml(state.selected[index]) + '</strong><small>눌러서 내리기</small><i></i><i></i></button>'
            : '<span class="oc-train-car"><em>' + (index + 1) + '</em><strong>빈 칸</strong><small>말을 태워 주세요</small><i></i><i></i></span>';
        }).join("") +
        '</div></div><div class="oc-train-track" aria-hidden="true"><i></i></div>' +
        '<div class="oc-station-label"><span>말 카드 승강장</span><strong>들은 순서대로 기차에 태워요</strong></div>' +
        '<div class="oc-answer-grid is-train-options">' + orderOptions + '</div>' +
        '<div class="oc-order-actions"><button class="oc-clear-answer" type="button" data-action="clear-parts">기차 비우기</button>' +
        '<button class="oc-check-answer" type="button" data-action="check-order" ' + (state.selected.length !== item.answer.length ? "disabled" : "") + '>확인하기</button></div></div>';
    } else if (state.activity === "anagram") {
      var parts = shuffle(item.parts).map(function (value) {
        return '<button type="button" data-action="part" data-value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</button>';
      }).join("");
      answerArea = '<div class="oc-order-answer"><div class="oc-build-word">' + (state.selected.length ? escapeHtml(state.selected.join("")) : "글자를 눌러 보세요") +
        '</div><div class="oc-answer-grid is-parts">' + parts + '</div><button class="oc-clear-answer" type="button" data-action="clear-parts">다시 만들기</button></div>';
    } else {
      var listenDistractors = (item.choices || []).filter(function (value) { return value !== item.answer; });
      var wantedDistractors = state.section === "game" && state.activity === "listen"
        ? distractorCount("listen") : distractorCount("other");
      var choices = [item.answer].concat(listenDistractors.slice(0, wantedDistractors));
      choices = stableShuffle(choices, questionKey());
      answerArea = '<div class="oc-answer-grid ' + (state.activity === "listen" ? "is-listen-options" : "") + '">' + choices.map(function (value) {
        return '<button type="button" data-action="answer" data-value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</button>';
      }).join("") + "</div>";
    }
    return '<div class="oc-student-question ' + (state.activity === "order" ? "is-train-question" : state.activity === "listen" ? "is-listen-question" : "") +
      '"><div class="oc-cue-card"><span>' + (state.section === "review" ? "읽고 생각해요" : "잘 듣고 읽어요") + '</span>' +
      '<h3>' + escapeHtml(cue) + '</h3>' + replay + '</div>' + answerArea + "</div>";
  }

  function renderComplete(session) {
    var teacher = isTeacher();
    session.className = "oc-session-card is-complete";
    session.innerHTML =
      '<div class="oc-finish-flag"><i></i><span>FINISH</span><i></i></div>' +
      '<div class="oc-finish-medal"><span>✓</span></div>' +
      '<h3>' + (teacher ? "학습이 끝났습니다" : "오늘 학습을 끝까지 마쳤어요!") + '</h3>' +
      '<p>' + totalItems() + '문제를 천천히 확인하며 모두 완료했어요.</p>' +
      '<div class="oc-finish-score"><span>정확하게 해결</span><strong>' + state.score + ' / ' + totalItems() + '</strong></div>' +
      (teacher
        ? '<button class="oc-primary-action" type="button" data-action="restart">같은 활동 다시 시작</button>'
        : '<div class="oc-waiting is-finished">참 잘했어요. 다음 학습을 기다려요</div>');
  }

  async function revealAfterCue(item) {
    if (isTeacher()) return;
    var key = questionKey();
    if (cuePlayingKey === key) return;
    cuePlayingKey = key;
    await playCue(item);
    if (cuePlayingKey === key) cuePlayingKey = "";
    if (state.phase === "question" && questionKey() === key) {
      heardQuestionKey = key;
      renderLearning();
    }
  }

  function playCue(item) {
    if (isTeacher()) return Promise.resolve(false);
    var text = Array.isArray(item.cue) ? item.cue.join(", ") : item.cue;
    return playText(text);
  }

  function playBrowserFallback(text, playbackId) {
    return new Promise(function (resolve) {
      if (playbackId && playbackId !== learningPlaybackId) { resolve(false); return; }
      if (!("speechSynthesis" in window)) { resolve(false); return; }
      speechSynthesis.cancel();
      var utterance = new SpeechSynthesisUtterance(text);
      var settled = false;
      var fallbackTimer = window.setTimeout(function () { finish(true); }, Math.max(2200, String(text).length * 260));
      function finish(value) {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallbackTimer);
        resolve(value);
      }
      utterance.lang = "ko-KR";
      utterance.rate = 0.86;
      utterance.pitch = 0.86;
      utterance.onend = function () { finish(true); };
      utterance.onerror = function () { finish(true); };
      if (playbackId && playbackId !== learningPlaybackId) { finish(false); return; }
      speechSynthesis.speak(utterance);
    });
  }

  async function playText(text) {
    if (isTeacher()) return Promise.resolve(false);
    var playbackId = ++learningPlaybackId;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (learningAudio) {
      try { learningAudio.pause(); } catch (_) {}
      learningAudio.src = "";
      learningAudio = null;
    }
    try {
      var response = await fetch("/api/google-tts?text=" + encodeURIComponent(text), { cache: "force-cache" });
      if (playbackId !== learningPlaybackId) return false;
      if (!response.ok) throw new Error("google-tts");
      var objectUrl = URL.createObjectURL(await response.blob());
      return await new Promise(function (resolve) {
        if (playbackId !== learningPlaybackId) {
          URL.revokeObjectURL(objectUrl);
          resolve(false);
          return;
        }
        var audio = new Audio(objectUrl);
        learningAudio = audio;
        var settled = false;
        var fallbackStarted = false;
        var urlRevoked = false;
        function revokeUrl() {
          if (urlRevoked) return;
          urlRevoked = true;
          URL.revokeObjectURL(objectUrl);
        }
        function finish(value) {
          if (settled) return;
          settled = true;
          revokeUrl();
          resolve(value);
        }
        function startFallback() {
          if (settled || fallbackStarted || playbackId !== learningPlaybackId) {
            finish(false);
            return;
          }
          fallbackStarted = true;
          if (learningAudio === audio) learningAudio = null;
          try { audio.pause(); } catch (_) {}
          revokeUrl();
          playBrowserFallback(text, playbackId).then(finish);
        }
        audio.onended = function () {
          if (learningAudio === audio) learningAudio = null;
          finish(playbackId === learningPlaybackId);
        };
        audio.onerror = startFallback;
        var started = audio.play();
        if (started && typeof started.catch === "function") started.catch(startFallback);
      });
    } catch (_) {
      if (playbackId !== learningPlaybackId) return false;
      return playBrowserFallback(text, playbackId);
    }
  }

  function refreshRole() {
    document.querySelectorAll("[data-role]").forEach(function (chip) {
      chip.textContent = roleName();
      chip.classList.toggle("is-teacher", isTeacher());
      chip.classList.toggle("is-student", !isTeacher());
    });
    if ((state.mode === "game" || state.mode === "review") && refs[state.section]) {
      refs[state.section].classList.toggle("is-teacher-view", isTeacher());
      refs[state.section].classList.toggle("is-student-view", !isTeacher());
    }
  }

  function exportLearningState() {
    var outgoing = clone(state);
    outgoing.role = isTeacher() ? "teacher" : "student";
    return outgoing;
  }

  function acceptLearningState(incoming) {
    if (!incoming) return;
    var teacher = isTeacher();
    if (teacher && incoming.role === "student") {
      if (incoming.response && incoming.index === state.index && incoming.activity === state.activity && state.phase === "question") {
        state.response = clone(incoming.response);
        state.selected = clone(incoming.selected || []);
        state.attempts = incoming.attempts || state.attempts;
        state.score = incoming.score || 0;
        state.phase = "answered";
        renderLearning();
        window.setTimeout(publish, 80);
      }
      return;
    }
    if (!teacher && incoming.role === "teacher") {
      state = Object.assign(state, clone(incoming));
      ensureActivityForSection();
      showMode(state.mode || "game", false);
      renderLearning();
    }
  }

  function bindSync() {
    try {
      if (typeof getState === "function") {
        originalGetState = getState;
        getState = function () {
          var value = originalGetState() || {};
          value.learningFlow = exportLearningState();
          value.mode = state.mode;
          return value;
        };
      }
      if (typeof applyState === "function") {
        originalApplyState = applyState;
        applyState = function (value) {
          applyingLearningState = true;
          try {
            originalApplyState(value);
            if (value && value.learningFlow) acceptLearningState(value.learningFlow);
          } finally {
            applyingLearningState = false;
          }
        };
      }
    } catch (_) {}
  }

  function publish() {
    if (applyingLearningState) return;
    state.revision++;
    renderLearning();
    try { if (typeof broadcast === "function") broadcast(); } catch (_) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { window.setTimeout(init, 0); });
  else window.setTimeout(init, 0);
})();
