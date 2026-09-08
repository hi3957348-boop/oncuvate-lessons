(() => {
  "use strict";

  const cases = [
    {
      source: "일기예보는 여러 곳에서 날씨를 관측하는 일부터 시작합니다.",
      sourceCue: "여러 곳", thiefCue: "한 곳", hintCategory: "관측 범위를 나타내는 수량 표현을 비교해 보세요.",
      summaries: [
        { code: "A", text: "일기예보는 여러 곳에서 날씨를 관측하는 일부터 시작한다.", note: "원문의 ‘여러 곳’과 ‘시작한다’는 정보가 그대로 있어요." },
        { code: "B", text: "일기예보는 한 곳에서 날씨를 관측하는 일부터 시작한다.", note: "" },
        { code: "C", text: "여러 장소의 날씨를 관측하는 것이 일기예보의 첫 단계이다.", note: "표현은 다르지만 관측 범위와 순서가 원문과 같아요." }
      ],
      thief: "B",
      errors: [
        { code: "quantity-change", text: "‘여러 곳’을 ‘한 곳’으로 바꾸어 관측 범위를 줄였다." },
        { code: "order-change", text: "날씨 관측이 마지막 단계라고 순서를 바꾸었다." },
        { code: "actor-change", text: "관측하는 사람을 예보관에서 컴퓨터로 바꾸었다." }
      ],
      error: "quantity-change",
      explanation: "맞아요. ‘여러 곳’이 ‘한 곳’으로 바뀌면서 관측 범위가 달라졌어요."
    },
    {
      source: "지상 관측소는 기온, 습도, 기압과 바람을 측정합니다.",
      sourceCue: "기온, 습도, 기압과 바람", thiefCue: "기온과 바람만", hintCategory: "측정 항목의 개수와 ‘만’이라는 제한 표현을 비교해 보세요.",
      summaries: [
        { code: "A", text: "지상 관측소는 기온과 바람만 측정한다.", note: "" },
        { code: "B", text: "지상 관측소에서는 기온, 습도, 기압과 바람을 잰다.", note: "‘측정한다’를 ‘잰다’로 바꾸었을 뿐 네 가지 정보가 모두 있어요." },
        { code: "C", text: "땅 위의 관측소는 네 가지 날씨 요소를 측정한다.", note: "항목 이름을 ‘네 가지 날씨 요소’로 묶어 정확하게 요약했어요." }
      ],
      thief: "A",
      errors: [
        { code: "place-change", text: "지상 관측소를 기상 위성으로 바꾸었다." },
        { code: "missing-elements", text: "습도와 기압을 빼고 ‘만’을 붙여 측정 대상을 줄였다." },
        { code: "measurement-change", text: "측정한다는 내용을 전달한다고 바꾸었다." }
      ],
      error: "missing-elements",
      explanation: "정확해요. 습도와 기압이 사라졌고 ‘만’이 붙어 측정 대상이 둘로 줄었어요."
    },
    {
      source: "기상 레이더는 비구름이 있는 곳과 비가 내리는 정도를 관측합니다.",
      sourceCue: "비구름이 있는 곳과 비가 내리는 정도", thiefCue: "구름이 생기는 까닭", hintCategory: "레이더가 관측하는 대상을 비교해 보세요.",
      summaries: [
        { code: "A", text: "기상 레이더는 비구름의 위치와 비의 세기를 관측한다.", note: "‘있는 곳’은 위치, ‘내리는 정도’는 세기로 바르게 줄였어요." },
        { code: "B", text: "비구름이 어디에 있고 비가 얼마나 내리는지 레이더로 살핀다.", note: "원문의 두 관측 대상을 빠뜨리지 않았어요." },
        { code: "C", text: "기상 레이더는 구름이 생기는 까닭을 관측한다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "target-change", text: "비구름의 위치와 비의 정도를 ‘구름이 생기는 까닭’으로 바꾸었다." },
        { code: "device-change", text: "기상 레이더를 지상 관측소로 바꾸었다." },
        { code: "time-change", text: "현재 관측을 미래 관측으로 바꾸었다." }
      ],
      error: "target-change",
      explanation: "맞아요. 레이더가 보는 것은 구름이 생긴 까닭이 아니라 비구름의 위치와 비의 정도예요."
    },
    {
      source: "컴퓨터는 각 구역의 공기가 앞으로 어떻게 움직일지 계산합니다. 그 결과를 이용하여 미래의 기온, 바람과 비의 모습을 나타낸 예상 자료를 만듭니다.",
      sourceCue: "앞으로 어떻게 움직일지 계산", thiefCue: "현재 날씨만 보고 완성된 일기예보를 작성", hintCategory: "컴퓨터가 하는 과정과 결과를 비교해 보세요.",
      summaries: [
        { code: "A", text: "컴퓨터는 공기의 움직임을 계산해 미래 날씨의 예상 자료를 만든다.", note: "계산하는 내용과 그 결과를 사용하는 과정이 모두 담겼어요." },
        { code: "B", text: "컴퓨터는 현재 날씨만 보고 완성된 일기예보를 작성한다.", note: "" },
        { code: "C", text: "각 구역의 공기 움직임을 계산한 결과로 미래의 기온·바람·비를 예상한다.", note: "두 문장의 핵심 과정을 한 문장으로 정확히 묶었어요." }
      ],
      thief: "B",
      errors: [
        { code: "location-change", text: "컴퓨터가 있는 장소를 우주로 바꾸었다." },
        { code: "process-change", text: "공기 움직임을 계산해 예상 자료를 만드는 과정을 ‘현재 날씨만 보고 완성된 예보 작성’으로 바꾸었다." },
        { code: "weather-missing", text: "미래의 기온만 빼고 바람과 비는 그대로 두었다." }
      ],
      error: "process-change",
      explanation: "정확해요. 컴퓨터는 예상 자료를 만들 뿐이고, 완성된 일기예보를 작성하는 주체는 예보관이에요."
    },
    {
      source: "그러나 컴퓨터의 계산만으로 예보가 완성되지는 않습니다. 예보관은 관측 자료와 여러 예상 결과를 비교합니다.",
      sourceCue: "완성되지는 않습니다", thiefCue: "완성된다", hintCategory: "뜻을 반대로 만드는 부정 표현을 확인해 보세요.",
      summaries: [
        { code: "A", text: "컴퓨터 계산만으로는 예보가 완성되지 않아 예보관의 비교가 필요하다.", note: "부정 표현과 예보관의 역할을 모두 정확히 담았어요." },
        { code: "B", text: "예보를 완성하려면 컴퓨터 계산뿐 아니라 예보관의 자료 비교도 필요하다.", note: "컴퓨터 계산만으로는 부족하고 예보관의 비교가 필요하다는 뜻을 정확히 담았어요." },
        { code: "C", text: "컴퓨터의 계산만으로 일기예보가 완성된다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "negative-reversal", text: "‘완성되지는 않습니다’를 ‘완성된다’로 바꾸어 뜻을 반대로 만들었다." },
        { code: "result-added", text: "예상 결과를 세 가지라고 숫자를 덧붙였다." },
        { code: "comparison-added", text: "예보관이 자료를 비교한다는 내용을 새로 덧붙였다." }
      ],
      error: "negative-reversal",
      explanation: "맞아요. ‘않습니다’를 없애면 컴퓨터 계산만으로 충분하다는 반대 뜻이 돼요."
    },
    {
      source: "완성된 예보는 방송과 인터넷, 휴대 전화 앱을 통해 사람들에게 전달됩니다. 우리는 일기예보를 보고 옷차림을 정하거나 야외 활동을 계획하고, 위험한 날씨에 미리 대비할 수 있습니다.",
      sourceCue: "방송과 인터넷, 휴대 전화 앱", thiefCue: "방송으로만", hintCategory: "전달 방법의 범위와 빠진 활용 정보를 비교해 보세요.",
      summaries: [
        { code: "A", text: "예보는 방송으로만 전달되며 사람들은 옷차림을 정하는 데 이용한다.", note: "" },
        { code: "B", text: "예보는 여러 매체로 전달되어 생활 계획과 위험한 날씨 대비에 쓰인다.", note: "전달 방법을 묶고, 생활 계획과 안전 대비라는 쓰임을 모두 담았어요." },
        { code: "C", text: "사람들은 방송·인터넷·앱으로 예보를 보고 옷차림과 야외 활동을 계획하며 위험에 대비한다.", note: "전달 매체와 세 가지 활용 정보를 빠뜨리지 않았어요." }
      ],
      thief: "A",
      errors: [
        { code: "weather-added", text: "눈이 내린다는 날씨 정보를 새로 덧붙였다." },
        { code: "speaker-change", text: "예보를 전달하는 사람을 예보관으로 바꾸었다." },
        { code: "missing-use", text: "인터넷·휴대 전화 앱과 야외 활동·위험 대비 정보를 빼고 ‘방송만’으로 좁혔다." }
      ],
      error: "missing-use",
      explanation: "정확해요. 전달 방법과 예보의 쓰임이 여러 가지인데 일부를 지우고 ‘방송만’으로 줄였어요."
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
      detail: { type, activityId: "information-thief", ...detail }
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
