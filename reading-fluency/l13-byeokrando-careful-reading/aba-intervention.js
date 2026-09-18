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
        passage: "마을 장터에서 농부가 직접 기른 딸기를 팔았습니다. 지수는 농부가 들인 시간과 노력, 재배 비용이 제대로 인정되어야 한다고 생각해 가격을 깎지 않고 제값을 지불했습니다. 농부는 그 돈으로 다음 농사를 준비했습니다.",
        question: "이 글에서 ‘정당한 대가’에 해당하는 것은 무엇인가요?",
        answers: [
          { value: "fair", text: "지수가 농부의 노동과 비용을 인정해 가격을 깎지 않고 제값을 지불한 것" },
          { value: "material", text: "농부가 다음 농사를 준비한 것" },
          { value: "place", text: "마을에서 장터를 연 것" }
        ],
        answer: "fair",
        cueQuestion: "‘정당한 대가’의 뜻을 보여 주는 표현을 본문에서 누르세요.",
        cues: [
          { value: "place", text: "마을 장터에서" },
          { value: "fair", text: "시간과 노력, 재배 비용을 인정해 가격을 깎지 않고 제값을 지불했습니다" },
          { value: "material", text: "다음 농사를 준비했습니다" }
        ],
        cue: "fair",
        retry: "생산자의 노동과 비용을 올바르게 인정한 행동을 찾아보세요.",
        explanation: "생산자의 노동과 비용을 제대로 인정하여 부당하게 깎지 않고 지불한 제값이 ‘정당한 대가’예요."
      },      {
        label: "전략 전이",
        passage: "민호는 두 공책 중 하나를 고르려 했습니다. A 공책은 가격이 더 쌌지만 생산 정보가 없었습니다. B 공책은 재생 종이를 사용했고 생산 과정을 확인할 수 있는 표시가 있었습니다. 민호는 가격만 보지 않고 B 공책을 골랐습니다.",
        question: "민호가 B 공책을 고른 결정적인 이유는 무엇인가요?",
        answers: [
          { value: "cheap", text: "가격이 가장 쌌기 때문" },
          { value: "evidence", text: "재생 종이와 확인 가능한 생산 표시가 있었기 때문" },
          { value: "two", text: "공책이 두 권 있었기 때문" }
        ],
        answer: "evidence",
        cueQuestion: "선택의 조건을 알려 주는 표현을 본문에서 누르세요.",
        cues: [
          { value: "cheap", text: "A 공책은 가격이 더 쌌지만" },
          { value: "evidence", text: "재생 종이를 사용했고 생산 과정을 확인할 수 있는 표시가 있었습니다" },
          { value: "two", text: "두 공책 중 하나" }
        ],
        cue: "evidence",
        retry: "결과가 아니라 민호가 선택한 이유를 보여 주는 정보를 찾아보세요.",
        explanation: "가격만 보지 않고 재료와 생산 정보를 확인하는 전략을 새 글에도 적용했어요."
      },
      {
        label: "생활·교과 전이",
        passage: "마트에서 바나나를 사려고 합니다. 첫 상품은 ‘착한 상품’이라는 광고만 있고 생산 정보가 없습니다. 둘째 상품은 정해진 노동·환경 기준을 확인받았다는 설명과 공정 무역 인증 표시가 있습니다. 필요한 양은 한 묶음입니다.",
        question: "글의 정보에 따라 책임 있게 고른 행동은 무엇인가요?",
        answers: [
          { value: "ad", text: "광고만 보고 첫 상품을 두 묶음 산다." },
          { value: "checked", text: "기준과 표시를 확인한 둘째 상품을 한 묶음 산다." },
          { value: "many", text: "두 상품을 필요한 양보다 많이 산다." }
        ],
        answer: "checked",
        cueQuestion: "믿을 수 있는 생산 정보를 보여 주는 표현을 본문에서 누르세요.",
        cues: [
          { value: "ad", text: "‘착한 상품’이라는 광고만 있고" },
          { value: "checked", text: "정해진 노동·환경 기준을 확인받았다는 설명과 공정 무역 인증 표시가 있습니다" },
          { value: "amount", text: "필요한 양은 한 묶음입니다" }
        ],
        cue: "checked",
        retry: "광고 문구가 아니라 실제 기준을 확인할 수 있는 표현을 찾아보세요.",
        explanation: "생산 기준과 인증 표시를 확인하고 필요한 만큼만 사는 행동이 책임 있는 소비에 가까워요."
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
    const storageKey = "l12-fair-trade-careful-reading:reflection-v1.0";
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






