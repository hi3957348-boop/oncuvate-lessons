(() => {
  "use strict";

  const cases = [
    {
      parts: [
        { text: "여러" }, { text: "유통" }, { text: "계단", after: "을" }, { text: "거치면" },
        { text: "생산자에게" }, { text: "돌아가는" }, { text: "수익이" }, { text: "적어질" }, { text: "수" }, { text: "있다", after: "." }
      ],
      wrong: "계단",
      answer: "단계",
      hint: "물건이 생산자에게서 소비자에게 가는 차례를 나타내는 말인지 살펴봐.",
      strongerHint: "바른 단어는 ‘단’으로 시작해.",
      corrected: "여러 유통 단계를 거치면 생산자에게 돌아가는 수익이 적어질 수 있다."
    },
    {
      parts: [
        { text: "일부" }, { text: "농장에서는" }, { text: "어린이의" }, { text: "교육과" },
        { text: "안전이" }, { text: "위험받는" }, { text: "문제가" }, { text: "생긴다", after: "." }
      ],
      wrong: "위험받는",
      answer: "위협받는",
      hint: "교육과 안전이 해를 입을 가능성이 있다는 뜻에 어울리는 말을 생각해 봐.",
      strongerHint: "바른 단어는 ‘위협’으로 시작해.",
      corrected: "일부 농장에서는 어린이의 교육과 안전이 위협받는 문제가 생긴다."
    },
    {
      parts: [
        { text: "기준을" }, { text: "지킨" }, { text: "생산물에는" }, { text: "인증" },
        { text: "표정이" }, { text: "붙기도" }, { text: "한다", after: "." }
      ],
      wrong: "표정이",
      answer: "표시가",
      accepted: ["표시", "표시가"],
      hint: "기준을 지킨 물건인지 알아볼 수 있게 붙이는 것을 뜻하는 말이야.",
      strongerHint: "바른 단어는 ‘표시’로 시작해.",
      corrected: "기준을 지킨 생산물에는 인증 표시가 붙기도 한다."
    },
    {
      parts: [
        { text: "필요한" }, { text: "만큼" }, { text: "사고" }, { text: "생산" }, { text: "과장을" },
        { text: "확인하는" }, { text: "것이" }, { text: "책임" }, { text: "있는" }, { text: "소비의" }, { text: "시작이다", after: "." }
      ],
      wrong: "과장을",
      answer: "과정을",
      accepted: ["과정", "과정을"],
      hint: "물건이 만들어지는 순서와 방법을 뜻하는 말을 생각해 봐.",
      strongerHint: "바른 단어는 ‘과정’으로 시작해.",
      corrected: "필요한 만큼 사고 생산 과정을 확인하는 것이 책임 있는 소비의 시작이다."
    }
  ];

  const activity = document.getElementById("thiefActivity");
  const complete = document.getElementById("thiefComplete");
  if (!activity || !complete) return;

  const counter = document.getElementById("thiefCounter");
  const caseLabel = document.getElementById("thiefCaseLabel");
  const caseStatus = document.getElementById("thiefCaseStatus");
  const sentence = document.getElementById("thiefSummaryOptions");
  const correctionStep = document.getElementById("thiefErrorStep");
  const correctionForm = document.getElementById("wordSpyCorrectionForm");
  const correctionInput = document.getElementById("wordSpyCorrection");
  const correctionSubmit = correctionForm?.querySelector('button[type="submit"]');
  const result = document.getElementById("wordSpyResult");
  const selectedWrongWord = document.getElementById("selectedWrongWord");
  const nextButton = document.getElementById("thiefNext");
  const restartButton = document.getElementById("thiefRestart");
  const phaseOne = document.getElementById("thiefPhaseOne");
  const phaseTwo = document.getElementById("thiefPhaseTwo");
  const promptLevelLabel = document.getElementById("thiefPromptLevel");
  const hintButton = document.getElementById("thiefHintButton");
  const coachMessage = document.getElementById("thiefCoachMessage");
  const coachScroll = document.querySelector(".thief-coach-scroll");
  const caseCard = document.querySelector(".thief-case-card");

  let caseIndex = 0;
  let phase = "find";
  let solvedCount = 0;
  let promptLevel = 0;
  let findAttempts = 0;
  let correctionAttempts = 0;

  function emit(type, detail = {}) {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: { type, activityId: "word-spy", ...detail, response: detail.response ?? detail.value }
    }));
  }

  function setCoach(message, kind = "") {
    coachMessage.textContent = message;
    coachMessage.className = "thief-coach-message" + (kind ? " " + kind : "");
    requestAnimationFrame(() => coachScroll?.scrollTo({ top: coachScroll.scrollHeight, behavior: "smooth" }));
  }

  function updatePromptDisplay() {
    const labels = ["스스로 확인", "뜻 단서", "첫소리 단서"];
    promptLevelLabel.textContent = "A" + promptLevel + " · " + labels[promptLevel];
    hintButton.textContent = promptLevel >= 2 ? "최대 도움 사용" : (promptLevel ? "한 단계 더 도움" : "확인 힌트");
    hintButton.disabled = promptLevel >= 2 || phase === "solved";
  }

  function makeToken(part) {
    const fragment = document.createDocumentFragment();
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-spy-token";
    button.dataset.word = part.text;
    button.dataset.track = "answer";
    button.textContent = part.text;
    button.addEventListener("click", () => chooseWord(button, part.text));
    fragment.append(button);
    if (part.after) fragment.append(document.createTextNode(part.after));
    return fragment;
  }

  function renderSentence(item) {
    sentence.replaceChildren();
    item.parts.forEach((part, index) => {
      sentence.append(makeToken(part));
      if (index < item.parts.length - 1) sentence.append(document.createTextNode(" "));
    });
  }

  function chooseWord(button, word) {
    if (phase !== "find" || button.disabled) return;
    const item = cases[caseIndex];
    const correct = word === item.wrong;
    findAttempts += 1;
    emit("answer", {
      itemId: "word-spy-find-" + (caseIndex + 1),
      correct,
      value: word,
      promptLevel: "A" + promptLevel,
      selfCorrected: correct && findAttempts > 1
    });

    if (!correct) {
      button.classList.add("miss");
      setTimeout(() => button.classList.remove("miss"), 650);
      setCoach("그 단어는 문장 뜻에 어울려. 문장을 끝까지 다시 읽고 다른 단어를 찾아봐.", "attention");
      return;
    }

    phase = "correct";
    sentence.querySelectorAll("button").forEach(token => { token.disabled = true; });
    button.classList.add("caught");
    caseStatus.textContent = "스파이 발견";
    caseStatus.classList.add("caught");
    phaseOne.classList.remove("active");
    phaseOne.classList.add("complete");
    phaseTwo.classList.add("active");
    selectedWrongWord.textContent = "‘" + item.wrong + "’";
    correctionStep.classList.remove("hidden");
    setCoach("찾았어! ‘" + item.wrong + "’ 대신 들어갈 바른 단어를 적어 봐.", "success");
    updatePromptDisplay();
    requestAnimationFrame(() => {
      caseCard?.scrollTo({ top: correctionStep.offsetTop - 12, behavior: "smooth" });
      correctionInput?.focus();
    });
  }

  function normalize(value) {
    return value.trim().replace(/[.!?,]/g, "").replace(/\s+/g, "");
  }

  correctionForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (phase !== "correct") return;
    const item = cases[caseIndex];
    const value = normalize(correctionInput.value);
    if (!value) {
      setCoach("바른 단어를 먼저 적어 봐.", "attention");
      correctionInput.focus();
      return;
    }

    correctionAttempts += 1;
    const accepted = (item.accepted || [item.answer]).map(normalize);
    const correct = accepted.includes(value);
    emit("answer", {
      itemId: "word-spy-correct-" + (caseIndex + 1),
      correct,
      value,
      promptLevel: "A" + promptLevel,
      selfCorrected: correct && correctionAttempts > 1
    });

    if (!correct) {
      correctionInput.classList.add("wrong");
      setCoach("아직 문장 뜻과 맞지 않아. 선택한 단어 앞뒤를 다시 이어 읽어 봐.", "attention");
      correctionInput.select();
      return;
    }

    phase = "solved";
    solvedCount += 1;
    correctionInput.classList.remove("wrong");
    correctionInput.classList.add("correct");
    correctionInput.disabled = true;
    correctionSubmit.disabled = true;
    result.textContent = item.corrected;
    result.classList.remove("hidden");
    phaseTwo.classList.remove("active");
    phaseTwo.classList.add("complete");
    caseStatus.textContent = "문장 수정 완료";
    setCoach("정확해! 바른 문장을 처음부터 끝까지 한 번 더 읽어 봐.", "success");
    nextButton.textContent = caseIndex === cases.length - 1 ? "결과 보기" : "다음 문장";
    nextButton.classList.remove("hidden");
    updatePromptDisplay();
    nextButton.focus();
  });

  hintButton.addEventListener("click", () => {
    if (phase === "solved") return;
    const item = cases[caseIndex];
    promptLevel = Math.min(2, promptLevel + 1);
    updatePromptDisplay();
    emit("hint", { itemId: "word-spy-hint-" + (caseIndex + 1), promptLevel: "A" + promptLevel });
    if (promptLevel === 1) {
      setCoach(item.hint, "attention");
    } else {
      setCoach(item.strongerHint, "attention");
      sentence.querySelector('[data-word="' + item.wrong + '"]')?.classList.add("modelled");
    }
  });

  function renderCase() {
    const item = cases[caseIndex];
    phase = "find";
    promptLevel = 0;
    findAttempts = 0;
    correctionAttempts = 0;
    renderSentence(item);
    counter.textContent = "문장 " + (caseIndex + 1) + " / " + cases.length;
    caseLabel.textContent = "문장 기록 " + String(caseIndex + 1).padStart(2, "0");
    caseStatus.textContent = "단어 수색 중";
    caseStatus.classList.remove("caught");
    phaseOne.classList.add("active");
    phaseOne.classList.remove("complete");
    phaseTwo.classList.remove("active", "complete");
    correctionStep.classList.add("hidden");
    correctionInput.value = "";
    correctionInput.disabled = false;
    correctionInput.classList.remove("wrong", "correct");
    correctionSubmit.disabled = false;
    result.textContent = "";
    result.classList.add("hidden");
    nextButton.classList.add("hidden");
    setCoach("문장을 끝까지 읽고, 뜻에 어울리지 않는 단어 하나를 눌러 봐.");
    caseCard.scrollTop = 0;
    coachScroll.scrollTop = 0;
    updatePromptDisplay();
  }

  function finishActivity() {
    activity.classList.add("hidden");
    document.querySelector(".thief-phase-guide")?.classList.add("hidden");
    complete.classList.remove("hidden");
    counter.textContent = cases.length + " / " + cases.length + " 완료";
    emit("activity-complete", { score: solvedCount, itemId: "all-cases" });
    restartButton.focus();
  }

  nextButton.addEventListener("click", () => {
    if (phase !== "solved") return;
    if (caseIndex === cases.length - 1) {
      finishActivity();
      return;
    }
    caseIndex += 1;
    renderCase();
  });

  restartButton.addEventListener("click", () => {
    caseIndex = 0;
    solvedCount = 0;
    complete.classList.add("hidden");
    document.querySelector(".thief-phase-guide")?.classList.remove("hidden");
    activity.classList.remove("hidden");
    renderCase();
  });

  renderCase();
})();
