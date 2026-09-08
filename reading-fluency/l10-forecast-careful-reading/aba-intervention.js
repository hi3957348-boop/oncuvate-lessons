(() => {
  "use strict";

  const probes = new Map();

  function ensureProbe(id) {
    if (!probes.has(id)) probes.set(id, { initialCorrect: false, checked: false, independentCheck: false, finalCorrect: false, selfCorrected: false });
    return probes.get(id);
  }

  function summary() {
    const values = [...probes.values()];
    return {
      total: values.length,
      initialCorrect: values.filter(item => item.initialCorrect).length,
      checked: values.filter(item => item.checked).length,
      independentChecks: values.filter(item => item.independentCheck).length,
      selfCorrections: values.filter(item => item.selfCorrected).length,
      finalCorrect: values.filter(item => item.finalCorrect).length
    };
  }

  function renderMetrics() {
    const result = summary();
    const first = document.getElementById("firstAccuracyMetric");
    const independent = document.getElementById("independentCheckMetric");
    const corrections = document.getElementById("selfCorrectionMetric");
    if (first) first.textContent = result.initialCorrect + " / 6";
    if (independent) independent.textContent = result.independentChecks + " / 6";
    if (corrections) corrections.textContent = result.selfCorrections + "회";
  }

  window.CarefulReadingSession = {
    recordInitial(id, correct) {
      const item = ensureProbe(id);
      if (item.initialRecorded) return;
      item.initialRecorded = true;
      item.initialCorrect = Boolean(correct);
      renderMetrics();
    },
    recordCheck(id, promptLevel = 0) {
      const item = ensureProbe(id);
      item.checked = true;
      item.independentCheck = Number(promptLevel) === 0;
      renderMetrics();
    },
    recordFinal(id, correct, selfCorrected = false) {
      const item = ensureProbe(id);
      item.finalCorrect = Boolean(correct);
      item.selfCorrected = Boolean(selfCorrected);
      renderMetrics();
    },
    summary
  };

  if (document.getElementById("transferCard")) {
    const tasks = [
      {
        label: "부정 조건",
        passage: "학교 텃밭에 물을 주는 날은 화요일과 목요일입니다. 비가 온 날에는 물을 주지 않습니다. 이번 목요일에는 비가 왔으므로 민지는 물뿌리개를 가져왔지만 텃밭에 물을 주지 않았습니다.",
        question: "민지는 이번 목요일에 텃밭에 물을 주었나요?",
        answers: [
          { value: "yes", text: "물을 주었다." },
          { value: "no", text: "물을 주지 않았다." },
          { value: "unknown", text: "글만으로 알 수 없다." }
        ],
        answer: "no",
        cueQuestion: "물을 주지 않은 까닭을 알려 주는 표현을 본문에서 누르세요.",
        cues: [
          { value: "schedule", text: "화요일과 목요일" },
          { value: "rain", text: "비가 왔으므로" },
          { value: "negative", text: "물을 주지 않았습니다" }
        ],
        cue: "rain",
        retry: "물을 주지 않게 된 까닭을 알려 주는 표현을 다시 찾아보세요.",
        explanation: "‘비가 왔으므로’가 물을 주지 않은 조건을 알려 줘요."
      },
      {
        label: "수량 조건",
        passage: "도서관에서 지후는 과학책 두 권과 동화책 한 권을 빌렸습니다. 반납일에 과학책 두 권은 반납했지만, 동화책 한 권은 다음 주에 반납하기로 했습니다.",
        question: "지후가 반납일에 반납한 책은 몇 권인가요?",
        answers: [
          { value: "one", text: "한 권" },
          { value: "two", text: "두 권" },
          { value: "three", text: "세 권" }
        ],
        answer: "two",
        cueQuestion: "반납일에 돌려준 수량을 직접 알려 주는 표현은?",
        cues: [
          { value: "borrowed", text: "과학책 두 권과 동화책 한 권을 빌렸습니다" },
          { value: "returned", text: "과학책 두 권은 반납했지만" },
          { value: "later", text: "동화책 한 권은 다음 주에" }
        ],
        cue: "returned",
        retry: "빌린 수가 아니라 반납일에 실제로 돌려준 수를 확인하세요.",
        explanation: "‘과학책 두 권은 반납했지만’이 반납한 수량을 정해요."
      },
      {
        label: "순서 조건",
        passage: "현우는 실험을 시작하기 전에 안전 안경을 쓰고 준비물을 확인했습니다. 실험을 마친 뒤에는 사용한 도구를 씻었습니다.",
        question: "현우는 안전 안경을 쓴 뒤에 실험을 시작했나요?",
        answers: [
          { value: "yes", text: "그렇다." },
          { value: "no", text: "그렇지 않다." },
          { value: "unknown", text: "글만으로 알 수 없다." }
        ],
        answer: "yes",
        cueQuestion: "안전 안경과 실험의 순서를 직접 알려 주는 표현은?",
        cues: [
          { value: "before", text: "실험을 시작하기 전에 안전 안경을 쓰고" },
          { value: "materials", text: "준비물을 확인했습니다" },
          { value: "after", text: "실험을 마친 뒤에는" }
        ],
        cue: "before",
        retry: "무엇을 먼저 했는지 알려 주는 순서 표현을 찾아보세요.",
        explanation: "‘시작하기 전에 안전 안경을 쓰고’가 행동의 순서를 정해요."
      }
    ];

    const transferCard = document.getElementById("transferCard");
    const transferPlay = document.getElementById("transferPlay");
    const transferCompletePanel = document.getElementById("transferComplete");
    const transferLabel = document.getElementById("transferLabel");
    const transferCounter = document.getElementById("transferCounter");
    const transferPassageText = document.getElementById("transferPassageText");
    const transferQuestionText = document.getElementById("transferQuestionText");
    const transferQuestion = document.querySelector(".transfer-page .transfer-question");
    const answerOptions = document.getElementById("transferAnswerOptions");
    const cueCheck = document.getElementById("transferCueCheck");
    const cuePrompt = document.getElementById("transferCuePrompt");
    const cueOptions = document.getElementById("transferCueOptions");
    const confirmTransfer = document.getElementById("confirmTransfer");
    const transferNext = document.getElementById("transferNext");
    const transferFeedback = document.getElementById("transferFeedback");
    const transferStatus = document.getElementById("transferStatus");
    const transferResult = document.getElementById("transferResult");
    const goToReflection = document.getElementById("goToReflection");
    const categoryButtons = [...document.querySelectorAll("#reflectionCategories button")];
    const mistakeInput = document.getElementById("mistakeInput");
    const charCount = document.getElementById("charCount");
    const mistakeFeedback = document.getElementById("mistakeFeedback");
    const saveButton = document.getElementById("saveMistakeButton");
    const completionMessage = document.getElementById("completionMessage");
    const completionSignal = document.getElementById("completionSignal");
    const storageKey = "l10-forecast-careful-reading:mistake-log-v1.20";

    let index = 0;
    let initialAnswer = null;
    let selectedAnswer = null;
    let cuePassed = false;
    let cuePromptLevel = 0;
    let itemConfirmed = false;
    let transferComplete = false;
    let firstCorrectCount = 0;
    let selfCorrectionCount = 0;
    let selectedCategory = "";
    let passageCueButtons = [];

    function emit(type, detail = {}) {
      window.dispatchEvent(new CustomEvent("oncuvate:log", {
        detail: { type, activityId: "transfer-practice", ...detail }
      }));
    }

    function setFeedback(message, kind = "") {
      transferFeedback.textContent = message;
      transferFeedback.className = "inline-feedback" + (kind ? " " + kind : "");
    }

    function scrollTransferToBottom() {
      requestAnimationFrame(() => transferQuestion?.scrollTo({ top: transferQuestion.scrollHeight, behavior: "smooth" }));
    }

    function makeButton(option, optionIndex, kind) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.value = option.value;
      button.dataset.track = "answer";
      if (kind === "answer") {
        const marker = document.createElement("span");
        marker.textContent = String.fromCharCode(65 + optionIndex);
        button.append(marker, document.createTextNode(option.text));
        button.addEventListener("click", () => chooseAnswer(button));
      } else {
        button.textContent = option.text;
        button.addEventListener("click", () => chooseCue(button));
      }
      return button;
    }

    function makePassageCue(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "transfer-passage-cue";
      button.dataset.value = option.value;
      button.dataset.track = "answer";
      button.textContent = option.text;
      button.disabled = true;
      button.setAttribute("aria-label", "본문 표현: " + option.text);
      button.addEventListener("click", () => chooseCue(button));
      return button;
    }

    function renderPassage(task) {
      transferPassageText.replaceChildren();
      transferPassageText.classList.remove("is-cue-mode");
      passageCueButtons = [];
      const matches = task.cues
        .map(option => ({ option, start: task.passage.indexOf(option.text) }))
        .filter(match => match.start >= 0)
        .sort((a, b) => a.start - b.start);
      let cursor = 0;
      matches.forEach(match => {
        transferPassageText.append(document.createTextNode(task.passage.slice(cursor, match.start)));
        const button = makePassageCue(match.option);
        passageCueButtons.push(button);
        transferPassageText.append(button);
        cursor = match.start + match.option.text.length;
      });
      transferPassageText.append(document.createTextNode(task.passage.slice(cursor)));
    }

    function renderTask() {
      const task = tasks[index];
      initialAnswer = null;
      selectedAnswer = null;
      cuePassed = false;
      cuePromptLevel = 0;
      itemConfirmed = false;
      transferLabel.textContent = task.label;
      transferCounter.textContent = (index + 1) + " / " + tasks.length;
      renderPassage(task);
      transferQuestionText.textContent = task.question;
      cuePrompt.textContent = "왼쪽 본문에서 답을 결정한 표현을 눌러 보세요.";
      answerOptions.replaceChildren(...task.answers.map((option, optionIndex) => makeButton(option, optionIndex, "answer")));
      cueOptions.replaceChildren();
      cueCheck.classList.add("hidden");
      confirmTransfer.classList.add("hidden");
      confirmTransfer.disabled = true;
      transferNext.classList.add("hidden");
      transferStatus.textContent = "답 선택";
      setFeedback("답을 먼저 고른 뒤, 본문에서 근거를 찾아요.");
      transferCard.scrollTop = 0;
    }

    function chooseAnswer(button) {
      if (itemConfirmed) return;
      const task = tasks[index];
      const value = button.dataset.value;
      if (initialAnswer === null) {
        initialAnswer = value;
        const correct = value === task.answer;
        if (correct) firstCorrectCount += 1;
        window.CarefulReadingSession.recordInitial("transfer" + (index + 1), correct);
        emit("answer", { itemId: "transfer-" + (index + 1) + "-initial", correct, value, stage: "initial" });
      }
      selectedAnswer = value;
      [...answerOptions.children].forEach(item => item.classList.toggle("selected", item === button));
      cueCheck.classList.remove("hidden");
      confirmTransfer.classList.remove("hidden");
      transferPassageText.classList.add("is-cue-mode");
      scrollTransferToBottom();
      if (cuePassed) {
        passageCueButtons.forEach(item => { item.disabled = true; });
        transferStatus.textContent = "확정 준비";
        setFeedback("본문 근거는 확인했어요. 바꾼 답을 확정하세요.", "success");
        confirmTransfer.disabled = false;
        confirmTransfer.focus();
      } else {
        passageCueButtons.forEach(item => {
          item.disabled = item.classList.contains("wrong");
        });
        transferStatus.textContent = "본문에서 근거 찾기";
        setFeedback("왼쪽 본문에서 답을 결정한 표현을 눌러 보세요.");
        passageCueButtons.find(item => !item.disabled)?.focus();
      }
    }

    function chooseCue(button) {
      if (itemConfirmed || button.disabled) return;
      const task = tasks[index];
      const correct = button.dataset.value === task.cue;
      emit("answer", {
        itemId: "transfer-" + (index + 1) + "-cue",
        correct,
        value: button.dataset.value,
        promptLevel: "A" + cuePromptLevel
      });
      if (!correct) {
        cuePromptLevel = Math.max(1, cuePromptLevel);
        button.classList.add("wrong");
        button.disabled = true;
        setFeedback(task.retry, "attention");
        scrollTransferToBottom();
        return;
      }
      cuePassed = true;
      button.classList.add("correct");
      passageCueButtons.forEach(item => { item.disabled = true; });
      confirmTransfer.disabled = false;
      transferStatus.textContent = "확정 준비";
      setFeedback("본문에서 결정적 표현을 찾았어요. 답을 바꿔도 좋아요.", "success");
      window.CarefulReadingSession.recordCheck("transfer" + (index + 1), cuePromptLevel);
      scrollTransferToBottom();
      confirmTransfer.focus();
    }

    function confirmAnswer() {
      if (!cuePassed || selectedAnswer === null || itemConfirmed) return;
      const task = tasks[index];
      itemConfirmed = true;
      const correct = selectedAnswer === task.answer;
      const selfCorrected = initialAnswer !== selectedAnswer && correct;
      if (selfCorrected) selfCorrectionCount += 1;
      [...answerOptions.children].forEach(button => {
        button.disabled = true;
        button.classList.remove("selected");
        if (button.dataset.value === task.answer) button.classList.add("correct");
        if (button.dataset.value === selectedAnswer && !correct) button.classList.add("wrong");
      });
      confirmTransfer.classList.add("hidden");
      transferStatus.textContent = correct ? "정확해요" : "정답 확인";
      setFeedback(
        correct
          ? (selfCorrected ? "근거를 확인하고 답을 스스로 바로잡았어요. " + task.explanation : "정확해요. " + task.explanation)
          : "정답을 확인했어요. " + task.explanation,
        correct ? "success" : "attention"
      );
      window.CarefulReadingSession.recordFinal("transfer" + (index + 1), correct, selfCorrected);
      emit("answer", {
        itemId: "transfer-" + (index + 1) + "-final",
        correct,
        value: selectedAnswer,
        initialCorrect: initialAnswer === task.answer,
        selfCorrected,
        promptLevel: "A" + cuePromptLevel
      });
      scrollTransferToBottom();
      transferNext.textContent = index === tasks.length - 1 ? "결과 보기" : "다음 글";
      transferNext.classList.remove("hidden");
      transferNext.focus();
    }

    function finishTransfer() {
      transferComplete = true;
      transferPlay.classList.add("hidden");
      transferCompletePanel.classList.remove("hidden");
      transferLabel.textContent = "전이 연습 완료";
      transferCounter.textContent = "3 / 3";
      transferResult.textContent = "첫 반응 정확 " + firstCorrectCount + "개 · 스스로 바로잡기 " + selfCorrectionCount + "회";
      emit("activity-complete", { itemId: "all-transfer-items", score: firstCorrectCount, selfCorrections: selfCorrectionCount });
      goToReflection.focus();
    }

    confirmTransfer?.addEventListener("click", confirmAnswer);
    transferNext?.addEventListener("click", () => {
      if (!itemConfirmed) return;
      if (index === tasks.length - 1) {
        finishTransfer();
        return;
      }
      index += 1;
      renderTask();
    });
    goToReflection?.addEventListener("click", () => {
      document.querySelector('[data-go="6"]')?.click();
    });

    categoryButtons.forEach(button => {
      button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;
        categoryButtons.forEach(item => item.classList.toggle("selected", item === button));
        mistakeFeedback.textContent = "‘" + selectedCategory + "’ 확인을 오늘의 전략으로 골랐어요.";
        mistakeFeedback.className = "inline-feedback success";
      });
    });

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved?.text) {
        mistakeInput.value = saved.text;
        charCount.textContent = saved.text.length + " / 120";
      }
    } catch (_) {}

    mistakeInput?.addEventListener("input", () => {
      charCount.textContent = mistakeInput.value.length + " / 120";
    });

    saveButton?.addEventListener("click", () => {
      if (!transferComplete) {
        mistakeFeedback.textContent = "먼저 6번 새 글 전이 문제 3개를 완료해 주세요.";
        mistakeFeedback.className = "inline-feedback attention";
        return;
      }
      if (!selectedCategory) {
        mistakeFeedback.textContent = "오늘 가장 도움이 된 확인 행동을 한 가지 골라 주세요.";
        mistakeFeedback.className = "inline-feedback attention";
        categoryButtons[0]?.focus();
        return;
      }

      const text = mistakeInput.value.trim();
      const metrics = window.CarefulReadingSession.summary();
      try {
        localStorage.setItem(storageKey, JSON.stringify({ category: selectedCategory, text }));
      } catch (_) {}
      window.dispatchEvent(new CustomEvent("oncuvate:log", {
        detail: { type: "writing-draft", activityId: "reflection-record", itemId: "reflection", category: selectedCategory, text, metrics }
      }));
      window.dispatchEvent(new CustomEvent("oncuvate:log", {
        detail: { type: "activity-complete", activityId: "reflection-record", itemId: "reflection", category: selectedCategory, metrics }
      }));
      completionSignal.hidden = false;
      window.dispatchEvent(new CustomEvent("oncuvate:log", {
        detail: { type: "lesson-complete", activityId: "reflection-record", metrics }
      }));
      renderMetrics();
      mistakeFeedback.textContent = "저장했어요. 오늘 확인한 방법을 다음 글에서도 사용해 보세요.";
      mistakeFeedback.className = "inline-feedback success";
      completionMessage.classList.remove("hidden");
      saveButton.disabled = true;
      completionMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    renderTask();
    renderMetrics();
    return;
  }

  const transferCard = document.getElementById("transferCard");
  if (!transferCard) return;

  const answerButtons = [...document.querySelectorAll("#transferAnswerOptions button")];
  const cueCheck = document.getElementById("transferCueCheck");
  const cueButtons = [...document.querySelectorAll("#transferCueOptions button")];
  const confirmTransfer = document.getElementById("confirmTransfer");
  const transferFeedback = document.getElementById("transferFeedback");
  const transferStatus = document.getElementById("transferStatus");
  const categoryButtons = [...document.querySelectorAll("#reflectionCategories button")];
  const mistakeInput = document.getElementById("mistakeInput");
  const charCount = document.getElementById("charCount");
  const mistakeFeedback = document.getElementById("mistakeFeedback");
  const saveButton = document.getElementById("saveMistakeButton");
  const completionMessage = document.getElementById("completionMessage");
  const completionSignal = document.getElementById("completionSignal");
  const storageKey = "l10-forecast-careful-reading:mistake-log-v1.7";

  let initialAnswer = null;
  let selectedAnswer = null;
  let cuePassed = false;
  let cuePromptLevel = 0;
  let transferComplete = false;
  let selectedCategory = "";

  function emit(type, detail = {}) {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: { type, activityId: "transfer-and-reflect", ...detail }
    }));
  }

  function setFeedback(message, kind = "") {
    transferFeedback.textContent = message;
    transferFeedback.className = "inline-feedback" + (kind ? " " + kind : "");
  }

  answerButtons.forEach(button => {
    button.addEventListener("click", () => {
      if (transferComplete) return;
      const value = button.dataset.value;
      if (initialAnswer === null) {
        initialAnswer = value;
        const correct = value === "no";
        emit("answer", {
          itemId: "transfer-answer-initial",
          correct,
          value,
          stage: "initial"
        });
        window.CarefulReadingSession.recordInitial("transfer", correct);
      }
      selectedAnswer = value;
      answerButtons.forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
      cueCheck.classList.remove("hidden");
      confirmTransfer.classList.remove("hidden");
      transferStatus.textContent = "결정적 표현 확인";
      setFeedback("답은 아직 확정되지 않았어요. 답을 결정한 표현을 고르세요.");
      cueButtons[0]?.focus();
    });
  });

  cueButtons.forEach(button => {
    button.addEventListener("click", () => {
      if (transferComplete || button.disabled) return;
      const correct = button.dataset.value === "negative";
      button.dataset.correct = String(correct);
      emit("answer", {
        itemId: "transfer-cue",
        correct,
        value: button.dataset.value,
        promptLevel: "A" + cuePromptLevel
      });
      if (!correct) {
        cuePromptLevel = Math.max(1, cuePromptLevel);
        button.classList.add("wrong");
        button.disabled = true;
        setFeedback("그 표현은 배경 정보예요. 민지가 실제로 물을 주었는지 직접 알려 주는 표현을 다시 찾으세요.", "attention");
        return;
      }
      cuePassed = true;
      button.classList.add("correct");
      cueButtons.forEach(item => { item.disabled = true; });
      confirmTransfer.disabled = false;
      transferStatus.textContent = "답 확정 준비";
      setFeedback("결정적 표현을 확인했어요. 필요하면 답을 바꾼 뒤 확정하세요.", "success");
      window.CarefulReadingSession.recordCheck("transfer", cuePromptLevel);
      confirmTransfer.focus();
    });
  });

  confirmTransfer.addEventListener("click", () => {
    if (!cuePassed || selectedAnswer === null || transferComplete) return;
    transferComplete = true;
    const correct = selectedAnswer === "no";
    const selfCorrected = initialAnswer !== selectedAnswer && correct;
    answerButtons.forEach(button => {
      button.disabled = true;
      button.classList.remove("selected");
      if (button.dataset.value === "no") button.classList.add("correct");
      if (button.dataset.value === selectedAnswer && !correct) button.classList.add("wrong");
    });
    confirmTransfer.classList.add("hidden");
    transferStatus.textContent = "전이 확인 완료";
    setFeedback(
      correct
        ? (selfCorrected ? "결정적 표현을 확인하고 답을 스스로 바로잡았어요." : "새 글에서도 결정적 표현을 확인해 정확히 답했어요.")
        : "‘물을 주지 않았습니다’가 실제 행동을 알려 줘요. 첫 반응은 기록하고 다음 읽기에 활용해요.",
      correct ? "success" : "attention"
    );
    emit("answer", {
      itemId: "transfer-answer",
      correct,
      value: selectedAnswer,
      initialCorrect: initialAnswer === "no",
      selfCorrected,
      promptLevel: "A" + cuePromptLevel
    });
    window.CarefulReadingSession.recordFinal("transfer", correct, selfCorrected);
    renderMetrics();
  });

  categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;
      categoryButtons.forEach(item => item.classList.toggle("selected", item === button));
      mistakeFeedback.textContent = "‘" + selectedCategory + "’ 확인을 오늘의 전략으로 골랐어요.";
      mistakeFeedback.className = "inline-feedback success";
    });
  });

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved?.text) {
      mistakeInput.value = saved.text;
      charCount.textContent = saved.text.length + " / 120";
    }
  } catch (_) {}

  mistakeInput.addEventListener("input", () => {
    charCount.textContent = mistakeInput.value.length + " / 120";
  });

  saveButton.addEventListener("click", () => {
    if (!transferComplete) {
      mistakeFeedback.textContent = "먼저 위의 새 글 전이 문제에서 답과 결정적 표현을 확인해 주세요.";
      mistakeFeedback.className = "inline-feedback attention";
      transferCard.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!selectedCategory) {
      mistakeFeedback.textContent = "오늘 가장 도움이 된 확인 행동을 한 가지 골라 주세요.";
      mistakeFeedback.className = "inline-feedback attention";
      categoryButtons[0]?.focus();
      return;
    }

    const text = mistakeInput.value.trim();
    const metrics = window.CarefulReadingSession.summary();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ category: selectedCategory, text }));
    } catch (_) {}
    emit("writing-draft", {
      itemId: "reflection",
      category: selectedCategory,
      text,
      metrics
    });
    emit("activity-complete", {
      itemId: "transfer-and-reflection",
      category: selectedCategory,
      metrics
    });
    completionSignal.hidden = false;
    emit("lesson-complete", { metrics });
    renderMetrics();
    mistakeFeedback.textContent = "저장했어요. 오늘 실제로 한 확인 행동이 다음 읽기의 전략이 됩니다.";
    mistakeFeedback.className = "inline-feedback success";
    completionMessage.classList.remove("hidden");
    saveButton.disabled = true;
    completionMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  renderMetrics();
})();
