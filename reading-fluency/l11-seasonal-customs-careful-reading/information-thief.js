(() => {
  "use strict";

  const cases = [
    {
      source: "세시 풍속은 한 해의 절기나 달, 계절에 맞추어 이어 온 생활 습관입니다.",
      sourceCue: "절기나 달, 계절", thiefCue: "명절에만", hintCategory: "생활 습관이 이어지는 때의 범위를 비교해 보세요.",
      summaries: [
        { code: "A", text: "세시 풍속은 계절의 흐름에 맞추어 이어 온 생활 습관이다.", note: "표현은 짧아졌지만 계절에 맞춘 생활 습관이라는 뜻은 같아요." },
        { code: "B", text: "세시 풍속은 절기와 달에 따라 되풀이해 온 생활 모습이다.", note: "‘생활 모습’은 ‘생활 습관’과 비슷한 뜻이고 범위도 맞아요." },
        { code: "C", text: "세시 풍속은 명절에만 하는 특별한 놀이이다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "range-change", text: "절기·달·계절의 생활 습관을 ‘명절에만 하는 놀이’로 범위를 바꾸었다." },
        { code: "number-change", text: "한 해를 두 해로 바꾸었다." },
        { code: "actor-change", text: "조상들을 어린이로 바꾸었다." }
      ],
      error: "range-change",
      explanation: "정확해요. 세시 풍속은 명절에만 하는 놀이가 아니라 절기·달·계절에 맞춘 생활 습관이에요."
    },
    {
      source: "우리 조상들은 한 해를 스물네 절기로 나누어 계절의 변화를 살폈습니다.",
      sourceCue: "스물네 절기", thiefCue: "열두 절기", hintCategory: "한 해를 몇 절기로 나누었는지 수량을 확인해 보세요.",
      summaries: [
        { code: "A", text: "우리 조상들은 한 해를 스물네 절기로 나누었다.", note: "스물네 절기라는 수량이 정확해요." },
        { code: "B", text: "조상들은 24개의 절기를 통해 계절 변화를 살폈다.", note: "‘스물네’를 숫자 24로 바꾸었지만 뜻은 같아요." },
        { code: "C", text: "우리 조상들은 한 해를 열두 절기로 나누었다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "purpose-change", text: "계절 변화를 살핀 일을 농사일로 바꾸었다." },
        { code: "quantity-change", text: "‘스물네 절기’를 ‘열두 절기’로 줄였다." },
        { code: "time-change", text: "한 해를 한 달로 바꾸었다." }
      ],
      error: "quantity-change",
      explanation: "맞아요. 원문은 열두가 아니라 스물네 절기라고 했어요."
    },
    {
      source: "입춘에는 콩을 뿌리거나 대문에 좋은 글귀를 붙였습니다.",
      sourceCue: "콩을 뿌리거나 대문에 좋은 글귀", thiefCue: "팥죽을 쑤어", hintCategory: "입춘에 한 두 가지 행동을 끝까지 비교해 보세요.",
      summaries: [
        { code: "A", text: "입춘에는 콩을 뿌리거나 대문에 좋은 글을 붙였다.", note: "‘글귀’를 ‘좋은 글’로 바꾸었을 뿐 두 행동이 같아요." },
        { code: "B", text: "봄이 시작되는 입춘에 콩을 뿌리고 좋은 글귀를 붙이기도 했다.", note: "입춘의 두 행동을 모두 담았어요." },
        { code: "C", text: "입춘에는 팥죽을 쑤어 이웃과 나누어 먹었다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "custom-change", text: "입춘 풍속을 동지의 팥죽 풍속으로 바꾸었다." },
        { code: "place-change", text: "대문을 부엌으로 바꾸었다." },
        { code: "missing-only", text: "‘콩’이라는 낱말만 빼고 나머지는 그대로 두었다." }
      ],
      error: "custom-change",
      explanation: "정확해요. 팥죽은 동지 풍속이고, 입춘에는 콩을 뿌리거나 좋은 글귀를 붙였어요."
    },
    {
      source: "낮이 가장 긴 하지 무렵까지 비가 오지 않으면 비가 내리기를 바라며 기우제를 지내기도 했습니다.",
      sourceCue: "비가 오지 않으면", thiefCue: "비가 많이 오면", hintCategory: "기우제를 지낸 조건을 반대로 바꾼 표현이 있는지 보세요.",
      summaries: [
        { code: "A", text: "하지 무렵까지 비가 오지 않을 때 기우제를 지내기도 했다.", note: "‘오지 않으면’을 ‘오지 않을 때’로 바꿨지만 뜻은 같아요." },
        { code: "B", text: "비가 부족하면 비가 내리기를 바라며 기우제를 지냈다.", note: "기우제를 지낸 조건과 바람이 정확해요." },
        { code: "C", text: "하지 무렵에 비가 많이 오면 기우제를 지냈다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "season-change", text: "하지를 동지로 바꾸었다." },
        { code: "negative-reversal", text: "‘비가 오지 않으면’을 ‘비가 많이 오면’으로 바꾸어 조건을 뒤집었다." },
        { code: "wish-change", text: "비가 내리기를 바라는 마음을 눈이 오기를 바라는 마음으로 바꾸었다." }
      ],
      error: "negative-reversal",
      explanation: "맞아요. 기우제는 비가 많이 올 때가 아니라 비가 오지 않을 때 지냈어요."
    },
    {
      source: "처서에는 조상의 묘를 찾아 벌초하고, 여름 동안 눅눅해진 옷과 이불을 햇볕에 말렸습니다.",
      sourceCue: "벌초하고, 여름 동안 눅눅해진 옷과 이불", thiefCue: "옷만", hintCategory: "처서에 한 일과 말린 물건의 범위를 확인해 보세요.",
      summaries: [
        { code: "A", text: "처서에는 벌초하고 옷과 이불을 햇볕에 말렸다.", note: "처서의 두 가지 활동과 말린 물건이 모두 있어요." },
        { code: "B", text: "가을의 처서에는 묘를 돌보고 눅눅한 옷과 이불을 말렸다.", note: "표현은 달라도 원문의 두 활동과 뜻이 같아요." },
        { code: "C", text: "처서에는 벌초하지 않고 눅눅한 옷만 말렸다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "action-range-change", text: "벌초를 하지 않았다고 바꾸고, 말린 물건도 옷만으로 줄였다." },
        { code: "weather-added", text: "비가 왔다는 정보를 새로 더했다." },
        { code: "person-change", text: "조상을 이웃으로 바꾸었다." }
      ],
      error: "action-range-change",
      explanation: "정확해요. 원문에는 벌초도 했고 옷뿐 아니라 이불도 말렸다고 나와요."
    },
    {
      source: "입동에는 햇곡식으로 시루떡을 만들어 이웃과 나누고 김장을 준비했습니다. 동지에는 팥죽을 쑤어 이웃과 나누어 먹었습니다.",
      sourceCue: "입동에는", thiefCue: "입동에는 팥죽", hintCategory: "입동과 동지에 한 일을 서로 바꾸지 않았는지 살펴보세요.",
      summaries: [
        { code: "A", text: "입동에는 시루떡을 나누고 김장을 준비했으며, 동지에는 팥죽을 나누었다.", note: "두 겨울 절기와 각각의 풍속을 정확히 연결했어요." },
        { code: "B", text: "겨울의 입동에는 시루떡과 김장을 준비하고 동지에는 팥죽을 먹었다.", note: "표현을 줄였지만 절기와 풍속의 짝이 맞아요." },
        { code: "C", text: "입동에는 팥죽을 쑤고, 동지에는 김장을 준비했다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "pair-swap", text: "입동과 동지의 풍속을 서로 바꾸어 연결했다." },
        { code: "neighbor-missing", text: "이웃이라는 낱말만 빠졌다." },
        { code: "food-number", text: "음식을 세 가지로 늘렸다." }
      ],
      error: "pair-swap",
      explanation: "맞아요. 입동은 시루떡과 김장, 동지는 팥죽과 연결해야 해요."
    }
  ];

  const activity = document.getElementById("thiefActivity");
  const complete = document.getElementById("thiefComplete");
  if (!activity || !complete) return;

  const source = document.getElementById("thiefSource");
  const sourceReveal = document.getElementById("thiefSourceReveal");
  const counter = document.getElementById("thiefCounter");
  const caseLabel = document.getElementById("thiefCaseLabel");
  const caseStatus = document.getElementById("thiefCaseStatus");
  const summaryOptions = document.getElementById("thiefSummaryOptions");
  const errorStep = document.getElementById("thiefErrorStep");
  const errorOptions = document.getElementById("thiefErrorOptions");
  const feedback = document.getElementById("thiefFeedback");
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
  let phase = "summary";
  let solvedCount = 0;
  let promptLevel = 0;
  let summaryWrongAttempts = 0;
  let errorWrongAttempts = 0;

  function emit(type, detail = {}) {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: { type, activityId: "information-thief", ...detail, response: detail.response ?? detail.value }
    }));
  }

  function renderMarkedText(element, text, needle = "") {
    element.replaceChildren();
    if (!needle || !text.includes(needle)) {
      element.textContent = text;
      return;
    }
    const before = text.slice(0, text.indexOf(needle));
    const after = text.slice(text.indexOf(needle) + needle.length);
    element.append(document.createTextNode(before));
    const mark = document.createElement("mark");
    mark.textContent = needle;
    element.append(mark, document.createTextNode(after));
  }

  function updatePromptDisplay() {
    const labels = ["스스로 확인", "확인 신호", "범주 단서", "원문 위치", "비교 모델"];
    promptLevelLabel.textContent = "A" + promptLevel + " · " + labels[promptLevel];
    hintButton.textContent = promptLevel >= 4 ? "최대 도움 사용" : (promptLevel ? "한 단계 더 도움" : "확인 힌트");
    hintButton.disabled = promptLevel >= 4 || phase === "solved";
  }

  function makeChoice(option, index, group) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "thief-choice";
    button.dataset.track = "answer";
    button.dataset.value = option.code;

    const label = document.createElement("span");
    label.textContent = group === "summary" ? option.code : String(index + 1);
    const text = document.createElement("b");
    text.textContent = option.text;
    button.append(label, text);
    button.addEventListener("click", () => group === "summary" ? chooseSummary(button, option) : chooseError(button, option));
    return button;
  }

  function setFeedback(message, kind = "") {
    feedback.textContent = message;
    feedback.className = "visually-hidden";
    coachMessage.textContent = message;
    coachMessage.className = "thief-coach-message" + (kind ? " " + kind : "");
    requestAnimationFrame(() => coachScroll?.scrollTo({ top: coachScroll.scrollHeight, behavior: "smooth" }));
  }

  function setHintMessage(message, kind = "") {
    coachMessage.textContent = message;
    coachMessage.className = "thief-coach-message" + (kind ? " " + kind : "");
  }

  function chooseSummary(button, option) {
    if (phase !== "summary" || button.disabled) return;
    const item = cases[caseIndex];
    const correct = option.code === item.thief;
    button.dataset.correct = String(correct);
    emit("answer", {
      itemId: "thief-summary-" + (caseIndex + 1),
      correct,
      value: option.code,
      promptLevel: "A" + promptLevel,
      selfCorrected: correct && summaryWrongAttempts > 0
    });

    if (!correct) {
      summaryWrongAttempts += 1;
      promptLevel = Math.max(1, promptLevel);
      updatePromptDisplay();
      button.classList.add("wrong");
      button.disabled = true;
      setFeedback("이 요약문은 정확해요. " + option.note + " 다른 요약문을 살펴보세요.", "attention");
      return;
    }

    phase = "error";
    promptLevel = 0;
    updatePromptDisplay();
    sourceReveal?.classList.remove("revealed");
    renderMarkedText(source, item.source);
    setHintMessage("좋아, 도둑을 잡았어. 이제 무엇을 빼거나 바꿨는지 스스로 찾아보자.");
    button.classList.add("correct");
    [...summaryOptions.children].forEach(choice => { choice.disabled = true; });
    caseStatus.textContent = "도둑 검거";
    caseStatus.classList.add("caught");
    phaseOne.classList.remove("active");
    phaseOne.classList.add("complete");
    phaseTwo.classList.add("active");
    errorStep.classList.remove("hidden");
    setFeedback("정보 도둑을 잡았어요. 이제 무엇을 빼거나 바꾸었는지 정확히 고르세요.", "success");
    requestAnimationFrame(() => caseCard?.scrollTo({ top: errorStep.offsetTop - 12, behavior: "smooth" }));
    errorOptions.firstElementChild?.focus();
  }

  function chooseError(button, option) {
    if (phase !== "error" || button.disabled) return;
    const item = cases[caseIndex];
    const correct = option.code === item.error;
    button.dataset.correct = String(correct);
    emit("answer", {
      itemId: "thief-error-" + (caseIndex + 1),
      correct,
      value: option.code,
      promptLevel: "A" + promptLevel,
      selfCorrected: correct && errorWrongAttempts > 0
    });

    if (!correct) {
      errorWrongAttempts += 1;
      promptLevel = Math.max(1, promptLevel);
      updatePromptDisplay();
      button.classList.add("wrong");
      button.disabled = true;
      setFeedback("그 내용은 원문과 요약문을 비교했을 때 달라지지 않았어요. 두 문장의 다른 낱말을 다시 찾아보세요.", "attention");
      return;
    }

    phase = "solved";
    updatePromptDisplay();
    solvedCount += 1;
    button.classList.add("correct");
    [...errorOptions.children].forEach(choice => { choice.disabled = true; });
    phaseTwo.classList.remove("active");
    phaseTwo.classList.add("complete");
    caseStatus.textContent = "사건 해결";
    setFeedback(item.explanation, "success");
    nextButton.textContent = caseIndex === cases.length - 1 ? "결과 보기" : "다음 사건";
    nextButton.classList.remove("hidden");
    nextButton.focus();
  }

  function renderCase() {
    const item = cases[caseIndex];
    phase = "summary";
    promptLevel = 0;
    summaryWrongAttempts = 0;
    errorWrongAttempts = 0;
    renderMarkedText(source, item.source);
    sourceReveal?.classList.remove("revealed");
    setHintMessage("세 문장을 끝까지 읽고, 다른 문장을 골라 봐.");
    counter.textContent = "사건 " + (caseIndex + 1) + " / " + cases.length;
    caseLabel.textContent = "사건 기록 " + String(caseIndex + 1).padStart(2, "0");
    caseStatus.textContent = "도둑 수색 중";
    caseStatus.classList.remove("caught");
    phaseOne.classList.add("active");
    phaseOne.classList.remove("complete");
    phaseTwo.classList.remove("active", "complete");
    summaryOptions.replaceChildren(...item.summaries.map((option, index) => makeChoice(option, index, "summary")));
    errorOptions.replaceChildren(...item.errors.map((option, index) => makeChoice(option, index, "error")));
    errorStep.classList.add("hidden");
    nextButton.classList.add("hidden");
    setFeedback("조금 전 읽은 내용을 떠올리며 세 문장을 끝까지 확인해 보세요.");
    caseCard.scrollTop = 0;
    coachScroll.scrollTop = 0;
    updatePromptDisplay();
  }

  hintButton.addEventListener("click", () => {
    if (phase !== "summary" && phase !== "error") return;
    const item = cases[caseIndex];
    promptLevel = Math.min(4, promptLevel + 1);
    updatePromptDisplay();
    emit("hint", {
      itemId: "thief-" + phase + "-hint-" + (caseIndex + 1),
      promptLevel: "A" + promptLevel
    });
    if (promptLevel === 1) {
      setHintMessage("세 문장에서 수량·대상·과정·부정 표현을 다시 확인해 봐.", "attention");
      setFeedback("수량·대상·과정·부정 표현을 다시 확인해 봐.", "attention");
    } else if (promptLevel === 2) {
      setHintMessage(item.hintCategory, "attention");
      setFeedback(item.hintCategory, "attention");
    } else if (promptLevel === 3) {
      sourceReveal?.classList.add("revealed");
      renderMarkedText(source, item.source, item.sourceCue);
      setHintMessage("원문 단서를 열었어. 표시된 부분과 세 문장을 비교해 봐.", "attention");
      setFeedback("열린 원문 단서와 선택지를 비교해 봐.", "attention");
    } else {
      sourceReveal?.classList.add("revealed");
      renderMarkedText(source, item.source, item.sourceCue);
      if (phase === "summary") {
        const thiefButton = summaryOptions.querySelector('[data-value="' + item.thief + '"]');
        const label = thiefButton?.querySelector("b");
        if (label) renderMarkedText(label, item.summaries.find(option => option.code === item.thief).text, item.thiefCue);
        thiefButton?.classList.add("modelled");
        setHintMessage("원문과 다른 표현을 나란히 표시했어. 두 표현의 뜻이 어떻게 달라졌는지 확인해 봐.", "attention");
        setFeedback("표시한 두 표현의 뜻이 어떻게 달라졌는지 확인해 봐.", "attention");
      } else {
        const correctError = errorOptions.querySelector('[data-value="' + item.error + '"]');
        correctError?.classList.add("modelled");
        setHintMessage("달라진 표현을 설명하는 선택지까지 표시했어. 이제 직접 확인해 봐.", "attention");
        setFeedback("표시된 선택지를 확인하고 직접 답해 봐.", "attention");
      }
    }
  });

  function finishActivity() {
    activity.classList.add("hidden");
    document.querySelector(".thief-phase-guide")?.classList.add("hidden");
    complete.classList.remove("hidden");
    counter.textContent = "6 / 6 완료";
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
    caseCard.scrollTo({ top: 0, behavior: "smooth" });
    coachScroll.scrollTo({ top: 0, behavior: "smooth" });
  });

  restartButton.addEventListener("click", () => {
    caseIndex = 0;
    solvedCount = 0;
    complete.classList.add("hidden");
    document.querySelector(".thief-phase-guide")?.classList.remove("hidden");
    activity.classList.remove("hidden");
    renderCase();
    source.focus?.();
  });

  renderCase();
})();
