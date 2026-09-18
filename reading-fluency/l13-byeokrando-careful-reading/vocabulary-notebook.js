(() => {
  "use strict";

  const words = {
    "international-port": { word: "국제 무역항", hanja: "國際貿易港 · 나라 국, 즈음 제, 무역할 무, 바꿀 역, 항구 항", meaning: "여러 나라의 배와 상인이 드나들며 무역하는 항구예요.", example: "벽란도는 고려의 대표적인 국제 무역항이었어요." },
    estuary: { word: "하구", hanja: "河口 · 강 하, 입 구", meaning: "강물이 바다나 큰 강으로 흘러 들어가는 어귀예요.", example: "벽란도는 예성강 하구에 자리 잡았어요." },
    exchange: { word: "교류", hanja: "交流 · 사귈 교, 흐를 류", meaning: "사람이나 나라가 서로 물건, 생각, 문화를 주고받는 일이에요.", example: "고려는 송, 일본, 동남아시아 여러 나라와 교류했어요." },
    "arab-merchants": { word: "아라비아 상인", hanja: "商人 · 장사 상, 사람 인", meaning: "아라비아 지역에서 물건을 사고팔러 다니던 사람들이에요.", example: "아라비아 상인은 송에서 고려의 소문을 들었어요." },
    export: { word: "수출", hanja: "輸出 · 나를 수, 날 출", meaning: "자기 나라의 물건을 다른 나라에 내다 파는 일이에요.", example: "고려는 인삼과 종이를 송에 수출했어요." },
    import: { word: "수입", hanja: "輸入 · 나를 수, 들 입", meaning: "다른 나라의 물건을 자기 나라로 들여오는 일이에요.", example: "고려는 송에서 비단과 서적을 수입했어요." },
    hwamunseok: { word: "화문석", hanja: "花紋席 · 꽃 화, 무늬 문, 자리 석", meaning: "여러 색으로 꽃무늬를 놓아 짠 돗자리예요.", example: "화문석은 고려의 아름다운 수출품이었어요." },
    najeon: { word: "나전 칠기", hanja: "螺鈿漆器 · 소라 나, 비녀 전, 옻 칠, 그릇 기", meaning: "옻칠한 물건에 자개를 붙여 꾸민 공예품이에요.", example: "고려의 나전 칠기는 다른 나라에서도 인기가 있었어요." },
    medicine: { word: "약재", hanja: "藥材 · 약 약, 재목 재", meaning: "약을 만드는 데 쓰는 여러 가지 재료예요.", example: "고려는 송에서 약재를 들여왔어요." }
  };

  const storageKey = "l13-byeokrando-careful-reading:vocabulary-notebook-v1";
  const dialog = document.getElementById("vocabDialog");
  if (!dialog) return;
  const terms = [...document.querySelectorAll(".vocab-term")];
  const openButton = document.getElementById("vocabNotebookOpen");
  const closeButton = document.getElementById("vocabDialogClose");
  const detailTab = document.getElementById("vocabDetailTab");
  const notebookTab = document.getElementById("vocabNotebookTab");
  const detailPanel = document.getElementById("vocabDetailPanel");
  const notebookPanel = document.getElementById("vocabNotebookPanel");
  const wordEl = document.getElementById("vocabWord");
  const hanjaEl = document.getElementById("vocabHanja");
  const meaningEl = document.getElementById("vocabMeaning");
  const exampleEl = document.getElementById("vocabExample");
  const addedState = document.getElementById("vocabAddedState");
  const countEls = [document.getElementById("vocabNotebookCount"), document.getElementById("vocabDialogCount")];
  const summaryEl = document.getElementById("vocabNotebookSummary");
  const emptyEl = document.getElementById("vocabEmpty");
  const savedList = document.getElementById("vocabSavedList");
  const goNotebook = document.getElementById("vocabGoNotebook");
  const gameSetup = document.getElementById("vocabGameSetup");
  const gamePlay = document.getElementById("vocabGamePlay");
  const gameComplete = document.getElementById("vocabGameComplete");
  const gameStart = document.getElementById("vocabGameStart");
  const gameRequirement = document.getElementById("vocabGameRequirement");
  const gameMode = document.getElementById("vocabGameMode");
  const gameCounter = document.getElementById("vocabGameCounter");
  const gamePromptLabel = document.getElementById("vocabGamePromptLabel");
  const gamePrompt = document.getElementById("vocabGamePrompt");
  const gameOptions = document.getElementById("vocabGameOptions");
  const gameFeedback = document.getElementById("vocabGameFeedback");
  const gameNext = document.getElementById("vocabGameNext");
  const gameResult = document.getElementById("vocabGameResult");
  const gameRestart = document.getElementById("vocabGameRestart");
  let saved = [];
  let lastFocus = null;
  let gameItems = [];
  let gameIndex = 0;
  let gameScore = 0;
  let gameDirection = "word-to-meaning";
  let answered = false;

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(stored)) saved = stored.filter(id => words[id]);
  } catch (_) {}

  function emit(type, detail = {}) {
    window.dispatchEvent(new CustomEvent("oncuvate:log", { detail: { type, ...detail, response: detail.response ?? detail.value } }));
  }
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) {}
  }
  function updateNotebook() {
    countEls.forEach(el => { if (el) el.textContent = String(saved.length); });
    summaryEl.textContent = saved.length + "개";
    emptyEl.hidden = saved.length > 0;
    savedList.replaceChildren(...saved.map(id => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = "<strong>" + words[id].word + "</strong><small>" + words[id].meaning + "</small>";
      button.addEventListener("click", () => showWord(id, false));
      item.append(button);
      return item;
    }));
    terms.forEach(term => term.classList.toggle("is-saved", saved.includes(term.dataset.vocabId)));
    gameStart.disabled = saved.length < 2;
    gameRequirement.textContent = saved.length < 2 ? "낱말을 2개 이상 모으면 시작할 수 있어요." : saved.length + "개 낱말로 연습할 수 있어요.";
  }
  function selectTab(tab) {
    const detail = tab === "detail";
    detailTab.setAttribute("aria-selected", String(detail));
    notebookTab.setAttribute("aria-selected", String(!detail));
    detailPanel.hidden = !detail;
    notebookPanel.hidden = detail;
  }
  function openDialog(tab = "notebook") {
    lastFocus = document.activeElement;
    dialog.hidden = false;
    document.body.classList.add("vocab-dialog-open");
    selectTab(tab);
    (tab === "detail" ? detailTab : notebookTab).focus();
  }
  function closeDialog() {
    dialog.hidden = true;
    document.body.classList.remove("vocab-dialog-open");
    lastFocus?.focus?.();
  }
  function showWord(id, add = true) {
    const item = words[id];
    if (!item) return;
    const isNew = !saved.includes(id);
    if (add && isNew) {
      saved.push(id);
      persist();
      updateNotebook();
      emit("tap", { activityId: "vocabulary-notebook", itemId: id, target: "word", value: id });
    }
    wordEl.textContent = item.word;
    hanjaEl.textContent = item.hanja;
    meaningEl.textContent = item.meaning;
    exampleEl.textContent = item.example;
    addedState.textContent = isNew && add ? "누른 낱말을 단어장에 담았어요." : "이미 내 단어장에 있는 낱말이에요.";
    openDialog("detail");
  }
  function resetGameView() {
    gameSetup.hidden = false;
    gamePlay.hidden = true;
    gameComplete.hidden = true;
  }
  function renderGameQuestion() {
    answered = false;
    gameNext.hidden = true;
    gameFeedback.textContent = "";
    const id = gameItems[gameIndex];
    const item = words[id];
    const wordToMeaning = gameDirection === "word-to-meaning";
    gameMode.textContent = wordToMeaning ? "낱말 → 뜻" : "뜻 → 낱말";
    gameCounter.textContent = (gameIndex + 1) + " / " + gameItems.length;
    gamePromptLabel.textContent = wordToMeaning ? "이 낱말의 뜻은?" : "이 뜻에 알맞은 낱말은?";
    gamePrompt.textContent = wordToMeaning ? item.word : item.meaning;
    const distractors = shuffle(saved.filter(savedId => savedId !== id)).slice(0, 3);
    const options = shuffle([id, ...distractors]);
    gameOptions.replaceChildren(...options.map(optionId => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.value = optionId;
      button.textContent = wordToMeaning ? words[optionId].meaning : words[optionId].word;
      button.addEventListener("click", () => answerGame(button, id));
      return button;
    }));
  }
  function answerGame(button, correctId) {
    if (answered) return;
    answered = true;
    const correct = button.dataset.value === correctId;
    if (correct) gameScore += 1;
    [...gameOptions.children].forEach(option => {
      option.disabled = true;
      if (option.dataset.value === correctId) option.classList.add("correct");
      if (option === button && !correct) option.classList.add("wrong");
    });
    gameFeedback.textContent = correct ? "정확해요." : "정답을 함께 확인했어요.";
    emit("answer", { activityId: "vocabulary-match", itemId: gameDirection + "-" + correctId, value: button.dataset.value, response: button.dataset.value, correct, promptLevel: "A0" });
    gameNext.textContent = gameIndex === gameItems.length - 1 ? "결과 보기" : "다음 문제";
    gameNext.hidden = false;
    gameNext.focus();
  }
  function finishGame() {
    gamePlay.hidden = true;
    gameComplete.hidden = false;
    gameResult.textContent = gameItems.length + "문제 중 " + gameScore + "문제를 맞혔어요.";
    emit("activity-complete", { activityId: "vocabulary-match", itemId: gameDirection, score: gameScore, total: gameItems.length, direction: gameDirection });
  }

  terms.forEach(term => term.addEventListener("click", () => showWord(term.dataset.vocabId)));
  openButton?.addEventListener("click", () => { updateNotebook(); resetGameView(); openDialog("notebook"); });
  closeButton?.addEventListener("click", closeDialog);
  dialog.querySelectorAll("[data-vocab-close]").forEach(button => button.addEventListener("click", closeDialog));
  detailTab.addEventListener("click", () => selectTab("detail"));
  notebookTab.addEventListener("click", () => { updateNotebook(); selectTab("notebook"); });
  goNotebook.addEventListener("click", () => { updateNotebook(); selectTab("notebook"); });
  gameStart.addEventListener("click", () => {
    gameDirection = document.querySelector('input[name="vocabDirection"]:checked')?.value || "word-to-meaning";
    gameItems = shuffle(saved);
    gameIndex = 0;
    gameScore = 0;
    gameSetup.hidden = true;
    gameComplete.hidden = true;
    gamePlay.hidden = false;
    renderGameQuestion();
  });
  gameNext.addEventListener("click", () => {
    if (!answered) return;
    if (gameIndex === gameItems.length - 1) finishGame();
    else { gameIndex += 1; renderGameQuestion(); }
  });
  gameRestart.addEventListener("click", resetGameView);
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !dialog.hidden) closeDialog(); });
  updateNotebook();
})();



