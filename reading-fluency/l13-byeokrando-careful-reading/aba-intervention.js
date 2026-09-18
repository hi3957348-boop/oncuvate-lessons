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
        label: "어휘 전이",
        passage: "바다로 이어지는 다온강의 하구에는 작은 항구가 있습니다. 강에서 내려온 배와 바다에서 온 배가 이곳에서 만납니다.",
        question: "이 글에서 ‘하구’에 해당하는 곳은 어디인가요?",
        answers: [
          { value: "mouth", text: "강물이 바다로 흘러 들어가는 어귀" },
          { value: "mountain", text: "강물이 시작되는 높은 산" },
          { value: "field", text: "농사를 짓는 넓은 들판" }
        ],
        answer: "mouth",
        cueQuestion: "‘하구’의 위치를 알려 주는 표현을 본문에서 누르세요.",
        cues: [
          { value: "mouth", text: "바다로 이어지는 다온강의 하구" },
          { value: "ships", text: "강에서 내려온 배" },
          { value: "port", text: "작은 항구" }
        ],
        cue: "mouth",
        retry: "강과 바다가 만나는 위치를 찾아보세요.",
        explanation: "강물이 바다나 큰 강으로 흘러 들어가는 어귀를 하구라고 해요."
      },
      {
        label: "전략 전이",
        passage: "해솔항은 수도와 가까웠습니다. 강물이 깊어 큰 무역선도 안전하게 드나들 수 있었습니다. 이런 위치와 자연조건 덕분에 여러 나라 상인이 모였습니다.",
        question: "해솔항이 무역의 중심지로 성장한 이유는 무엇인가요?",
        answers: [
          { value: "conditions", text: "수도와 가깝고 강물이 깊었기 때문" },
          { value: "gold", text: "강에서 금이 많이 났기 때문" },
          { value: "ban", text: "외국 상인의 출입을 막았기 때문" }
        ],
        answer: "conditions",
        cueQuestion: "항구가 성장한 이유를 보여 주는 표현을 본문에서 누르세요.",
        cues: [
          { value: "capital", text: "수도와 가까웠습니다" },
          { value: "conditions", text: "강물이 깊어 큰 무역선도 안전하게 드나들 수 있었습니다" },
          { value: "result", text: "여러 나라 상인이 모였습니다" }
        ],
        cue: "conditions",
        retry: "항구의 위치와 배가 다니기 좋은 조건을 함께 확인해 보세요.",
        explanation: "장소의 위치와 자연조건을 확인해 중심지가 된 이유를 찾았어요."
      },
      {
        label: "교과 전이",
        passage: "우리나라는 자동차를 다른 나라에 내다 팔고, 다른 나라에서 원유를 들여옵니다. 자동차는 우리나라의 수출품이고 원유는 수입품입니다.",
        question: "수출품과 수입품을 바르게 구분한 것은 무엇인가요?",
        answers: [
          { value: "correct", text: "자동차는 수출품, 원유는 수입품" },
          { value: "reverse", text: "자동차는 수입품, 원유는 수출품" },
          { value: "both-export", text: "자동차와 원유는 모두 수출품" }
        ],
        answer: "correct",
        cueQuestion: "물건이 오가는 방향을 보여 주는 표현을 본문에서 누르세요.",
        cues: [
          { value: "correct", text: "자동차를 다른 나라에 내다 팔고, 다른 나라에서 원유를 들여옵니다" },
          { value: "cars", text: "자동차" },
          { value: "oil", text: "원유" }
        ],
        cue: "correct",
        retry: "우리나라에서 나가는 물건과 들어오는 물건을 구분해 보세요.",
        explanation: "나라 밖으로 내다 파는 것은 수출, 나라 안으로 들여오는 것은 수입이에요."
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
    const storageKey = "l13-byeokrando-careful-reading:reflection-v1.0";
    const answerHighlights = [
      { fair: ["fair"], material: ["material"], place: ["place"] },
      { cheap: ["cheap"], evidence: ["evidence"], two: ["two"] },
      { ad: ["ad"], checked: ["checked", "amount"], many: ["amount"] }
    ];

    let index = 0;
    let initialAnswer = null;
    let selectedAnswer = null;
    let itemConfirmed = false;
    let transferComplete = false;
    let firstCorrectCount = 0;
    let selfCorrectionCount = 0;
    let selectedCategory = "";
    let passageEvidence = [];

    function emit(type, detail = {}) {
      window.dispatchEvent(new CustomEvent("oncuvate:log", {
        detail: { type, activityId: "transfer-practice", ...detail, response: detail.response ?? detail.value }
      }));
    }

    function setFeedback(message, kind = "") {
      const icon = document.createElement("img");
      icon.src = "assets/jelly-coach-square.png";
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      const body = document.createElement("p");
      body.textContent = message;
      transferFeedback.replaceChildren(icon, body);
      transferFeedback.className = "inline-feedback coach-inline-feedback" + (kind ? " " + kind : "");
    }

    function scrollTransferToBottom() {
      requestAnimationFrame(() => transferQuestion?.scrollTo({ top: transferQuestion.scrollHeight, behavior: "smooth" }));
    }

    function makeAnswerButton(option, optionIndex) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.value = option.value;
      button.dataset.track = "answer";
      const marker = document.createElement("span");
      marker.textContent = String.fromCharCode(65 + optionIndex);
      button.append(marker, document.createTextNode(option.text));
      button.addEventListener("click", () => chooseAnswer(button));
      return button;
    }

    function makeEvidenceMark(option) {
      const mark = document.createElement("mark");
      mark.className = "transfer-evidence";
      mark.dataset.value = option.value;
      mark.textContent = option.text;
      return mark;
    }

    function renderPassage(task) {
      transferPassageText.replaceChildren();
      passageEvidence = [];
      const matches = task.cues
        .map(option => ({ option, start: task.passage.indexOf(option.text) }))
        .filter(match => match.start >= 0)
        .sort((a, b) => a.start - b.start);
      let cursor = 0;
      matches.forEach(match => {
        transferPassageText.append(document.createTextNode(task.passage.slice(cursor, match.start)));
        const mark = makeEvidenceMark(match.option);
        passageEvidence.push(mark);
        transferPassageText.append(mark);
        cursor = match.start + match.option.text.length;
      });
      transferPassageText.append(document.createTextNode(task.passage.slice(cursor)));
    }

    function showAnswerEvidence(value) {
      const values = answerHighlights[index][value] || [];
      passageEvidence.forEach(mark => mark.classList.toggle("is-highlighted", values.includes(mark.dataset.value)));
      const first = passageEvidence.find(mark => mark.classList.contains("is-highlighted"));
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function renderTask() {
      const task = tasks[index];
      initialAnswer = null;
      selectedAnswer = null;
      itemConfirmed = false;
      transferLabel.textContent = task.label;
      transferCounter.textContent = (index + 1) + " / " + tasks.length;
      renderPassage(task);
      transferQuestionText.textContent = task.question;
      answerOptions.replaceChildren(...task.answers.map(makeAnswerButton));
      transferNext.classList.add("hidden");
      transferStatus.textContent = "답 선택";
      setFeedback("답을 고르면 본문 근거를 바로 보여 줄게.");
      transferCard.scrollTop = 0;
    }

    function chooseAnswer(button) {
      if (itemConfirmed) return;
      const task = tasks[index];
      const value = button.dataset.value;
      const correct = value === task.answer;
      if (initialAnswer === null) {
        initialAnswer = value;
        if (correct) firstCorrectCount += 1;
        window.CarefulReadingSession.recordInitial("transfer" + (index + 1), correct);
      }
      selectedAnswer = value;
      [...answerOptions.children].forEach(item => {
        item.classList.remove("selected", "wrong", "correct");
        item.classList.toggle("selected", item === button);
      });
      showAnswerEvidence(value);
      emit("answer", {
        itemId: "transfer-" + (index + 1) + "-choice",
        correct,
        value,
        response: value,
        stage: initialAnswer === value ? "initial" : "retry"
      });

      if (!correct) {
        button.classList.add("wrong");
        transferStatus.textContent = "다시 확인";
        setFeedback(task.retry + " 강조된 본문을 보고 답을 다시 골라 봐.", "attention");
        scrollTransferToBottom();
        return;
      }

      itemConfirmed = true;
      const selfCorrected = initialAnswer !== value;
      if (selfCorrected) selfCorrectionCount += 1;
      [...answerOptions.children].forEach(item => {
        item.disabled = true;
        item.classList.remove("selected", "wrong");
        if (item.dataset.value === task.answer) item.classList.add("correct");
      });
      transferStatus.textContent = "정확해요";
      setFeedback("정확해요. " + task.explanation, "success");
      window.CarefulReadingSession.recordCheck("transfer" + (index + 1), selfCorrected ? 1 : 0);
      window.CarefulReadingSession.recordFinal("transfer" + (index + 1), true, selfCorrected);
      emit("answer", {
        itemId: "transfer-" + (index + 1) + "-final",
        correct: true,
        value,
        response: value,
        initialCorrect: initialAnswer === task.answer,
        selfCorrected,
        promptLevel: selfCorrected ? "A1" : "A0"
      });
      transferNext.textContent = index === tasks.length - 1 ? "결과 보기" : "다음 전이";
      transferNext.classList.remove("hidden");
      scrollTransferToBottom();
      transferNext.focus();
    }

    function finishTransfer() {
      transferComplete = true;
      transferPlay.classList.add("hidden");
      transferCompletePanel.classList.remove("hidden");
      transferLabel.textContent = "전이 연습 완료";
      transferCounter.textContent = "3 / 3";
      transferResult.textContent = "첫 반응 정확 " + firstCorrectCount + "개 · 근거를 보고 바로잡기 " + selfCorrectionCount + "회";
      emit("activity-complete", { itemId: "all-transfer-items", score: firstCorrectCount, selfCorrections: selfCorrectionCount });
      goToReflection.focus();
    }

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
        mistakeFeedback.textContent = "먼저 6번의 세 가지 전이 활동을 완료해 주세요.";
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

})();






