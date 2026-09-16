(() => {
  "use strict";

  const words = {
    producer: { word: "생산자", hanja: "生産者 · 날 생, 낳을 산, 사람 자", meaning: "물건이나 서비스를 만들어 내는 사람이나 단체예요.", example: "카카오를 기르고 수확하는 농부는 생산자예요." },
    distribution: { word: "유통", hanja: "流通 · 흐를 유, 통할 통", meaning: "물건이 생산자에게서 소비자에게 전달되는 과정이에요.", example: "초콜릿은 여러 유통 단계를 거쳐 가게에 도착해요." },
    unstable: { word: "불안정", hanja: "不安定 · 아닐 불, 편안할 안, 정할 정", meaning: "상태가 일정하지 않고 자주 달라지는 것을 말해요.", example: "수입이 불안정하면 생활 계획을 세우기 어려워요." },
    "fair-trade": { word: "공정 무역", hanja: "公正貿易 · 공평할 공, 바를 정, 무역할 무, 바꿀 역", meaning: "생산자에게 정당한 대가와 안전한 생산 조건을 보장하려는 거래 방식이에요.", example: "우리는 공정 무역 표시가 있는 초콜릿을 살펴보았어요." },
    "fair-pay": { word: "정당한 대가", hanja: "正當한 代價 · 바를 정, 마땅할 당, 대신할 대, 값 가", meaning: "한 일과 들인 노력을 제대로 인정해 마땅하고 올바르게 지불하는 값이에요.", example: "구매자는 농부에게 수확한 카카오의 정당한 대가를 지불했어요." },
    soil: { word: "토양", hanja: "土壤 · 흙 토, 흙 양", meaning: "식물이 자라는 바탕이 되는 땅의 흙을 말해요.", example: "농부는 토양을 건강하게 지키며 카카오나무를 길러요." },
    certification: { word: "인증 표시", hanja: "認證表示 · 알 인, 증거 증, 겉 표, 보일 시", meaning: "정해진 기준을 지켰는지 확인했다는 것을 알려 주는 표시에요.", example: "소비자는 포장의 인증 표시를 보고 생산 기준을 확인했어요." },
    "direct-trade": { word: "직거래", hanja: "直去來 · 곧을 직, 갈 거, 올 래", meaning: "중간 상인을 거치지 않고 생산자와 구매자가 직접 하는 거래예요.", example: "농부와 가게가 직거래하여 유통 단계를 줄였어요." },
    "responsible-consumption": { word: "책임 있는 소비", hanja: "責任 있는 消費 · 맡을 책, 맡길 임, 사라질 소, 쓸 비", meaning: "필요와 생산 과정을 생각하며 물건을 고르고 사용하는 행동이에요.", example: "필요한 만큼만 사고 생산 정보를 확인하는 것도 책임 있는 소비예요." }
  };

  const storageKey = "l12-fair-trade-careful-reading:vocabulary-notebook-v1";
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



