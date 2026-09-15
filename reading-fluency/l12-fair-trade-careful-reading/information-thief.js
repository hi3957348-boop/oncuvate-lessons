(() => {
  "use strict";

  const cases = [
    {
      source: "여러 유통 단계를 거치면 판매 가격 중 생산자에게 돌아가는 몫이 적을 수 있습니다.",
      sourceCue: "생산자에게 돌아가는 몫이 적을 수", thiefCue: "대부분 생산자에게", hintCategory: "판매 가격이 누구에게 얼마나 돌아가는지 끝까지 확인해 보세요.",
      summaries: [
        { code: "A", text: "유통 단계가 많으면 판매 가격 중 생산자의 몫이 적어질 수 있다.", note: "표현은 짧아졌지만 원문의 가능성과 뜻을 그대로 담았어요." },
        { code: "B", text: "여러 유통 단계를 거쳐도 판매 가격의 대부분은 생산자에게 돌아간다.", note: "" },
        { code: "C", text: "물건이 여러 단계를 거쳐 팔리면 생산자에게 돌아가는 돈이 적을 수 있다.", note: "‘몫’을 ‘돌아가는 돈’으로 풀었지만 뜻은 같아요." }
      ],
      thief: "B",
      errors: [
        { code: "share-reversal", text: "생산자의 몫이 ‘적을 수 있다’를 ‘대부분 돌아간다’로 바꾸었다." },
        { code: "route-change", text: "유통 단계를 생산 단계로 바꾸었다." },
        { code: "buyer-change", text: "생산자를 소비자로 바꾸었다." }
      ],
      error: "share-reversal",
      explanation: "정확해요. 원문은 생산자에게 돌아가는 몫이 적을 수 있다고 했어요."
    },
    {
      source: "일부 농장에서는 어린이가 학교에 가지 못하고 위험한 일을 돕는 문제도 생깁니다.",
      sourceCue: "일부 농장에서는", thiefCue: "모든 농장의 어린이는", hintCategory: "‘일부’인지 ‘모든’인지 범위를 나타내는 말을 비교해 보세요.",
      summaries: [
        { code: "A", text: "어떤 농장에서는 어린이가 학교에 가지 못한 채 위험한 일을 돕기도 한다.", note: "‘일부’를 ‘어떤’으로 바꿨지만 범위와 뜻은 같아요." },
        { code: "B", text: "일부 농장에서는 어린이의 교육과 안전이 위협받는 문제가 생긴다.", note: "학교와 위험한 일의 문제를 간단히 묶어 정확하게 요약했어요." },
        { code: "C", text: "모든 농장의 어린이는 학교 대신 위험한 일을 해야 한다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "range-expand", text: "‘일부 농장’을 ‘모든 농장’으로 넓히고 가능성을 단정으로 바꾸었다." },
        { code: "age-change", text: "어린이를 어른으로 바꾸었다." },
        { code: "place-change", text: "농장을 공장으로 바꾸었다." }
      ],
      error: "range-expand",
      explanation: "맞아요. 원문은 일부 농장에서 그런 문제가 생길 수 있다고 했지, 모든 농장을 말하지 않았어요."
    },
    {
      source: "공정 무역은 생산자가 일한 만큼 정당한 대가를 받고, 안전한 환경에서 일하도록 돕는 거래 방식이자 운동입니다.",
      sourceCue: "생산자가 일한 만큼 정당한 대가", thiefCue: "소비자만 더 싼값에", hintCategory: "공정 무역이 누구를 어떻게 돕는지 대상과 대가를 확인해 보세요.",
      summaries: [
        { code: "A", text: "공정 무역은 소비자만 더 싼값에 물건을 사도록 돕는 판매 방법이다.", note: "" },
        { code: "B", text: "공정 무역은 생산자가 정당한 대가를 받고 안전하게 일하도록 돕는다.", note: "생산자에게 주는 두 가지 도움을 정확히 담았어요." },
        { code: "C", text: "생산자의 대가와 노동 환경을 공정하게 만들려는 거래 방식이 공정 무역이다.", note: "표현은 달라도 대상과 핵심 뜻이 같아요." }
      ],
      thief: "A",
      errors: [
        { code: "purpose-change", text: "생산자를 돕는 목적을 소비자에게 싼값을 주는 목적으로 바꾸었다." },
        { code: "name-change", text: "공정 무역을 자유 무역으로 바꾸었다." },
        { code: "time-change", text: "현재의 거래를 과거의 거래로 바꾸었다." }
      ],
      error: "purpose-change",
      explanation: "정확해요. 공정 무역의 핵심은 소비자만의 싼값이 아니라 생산자의 정당한 대가와 안전한 환경이에요."
    },
    {
      source: "강제로 일하게 하거나 어린이 노동을 이용하지 않고, 토양과 물을 함부로 해치지 않는 생산 기준도 중요하게 봅니다.",
      sourceCue: "이용하지 않고", thiefCue: "상관하지 않는다", hintCategory: "노동과 환경 기준을 중요하게 보는지, 무시하는지 확인해 보세요.",
      summaries: [
        { code: "A", text: "공정 무역은 강제 노동과 어린이 노동을 피하고 환경도 보호하려 한다.", note: "두 종류의 생산 기준을 모두 담은 요약이에요." },
        { code: "B", text: "공정 무역은 가격만 맞으면 노동 조건과 토양·물의 피해는 상관하지 않는다.", note: "" },
        { code: "C", text: "노동력을 함부로 쓰지 않고 자연을 해치지 않는 것도 공정 무역의 기준이다.", note: "원문의 부정 조건과 환경 기준을 정확히 담았어요." }
      ],
      thief: "B",
      errors: [
        { code: "standard-reversal", text: "중요하게 보는 노동·환경 기준을 ‘상관하지 않는다’로 뒤집었다." },
        { code: "material-change", text: "토양과 물을 공기와 빛으로 바꾸었다." },
        { code: "number-change", text: "기준을 한 가지로 줄였다." }
      ],
      error: "standard-reversal",
      explanation: "맞아요. 노동 조건과 토양·물을 해치지 않는 기준도 공정 무역에서 중요하게 봐요."
    },
    {
      source: "기준을 지킨 생산물에는 인증 표시가 붙기도 합니다.",
      sourceCue: "기준을 지킨 생산물", thiefCue: "모든 수입품에는", hintCategory: "인증 표시가 붙는 물건의 조건과 범위를 비교해 보세요.",
      summaries: [
        { code: "A", text: "정해진 기준을 지킨 생산물에는 인증 표시가 붙을 수 있다.", note: "‘붙기도 한다’를 ‘붙을 수 있다’로 바꿨지만 뜻은 같아요." },
        { code: "B", text: "인증 표시는 생산물이 기준을 지켰는지 확인하는 단서가 될 수 있다.", note: "인증 표시의 역할을 원문 뜻에 맞게 풀었어요." },
        { code: "C", text: "모든 수입품에는 공정 무역 인증 표시가 자동으로 붙는다.", note: "" }
      ],
      thief: "C",
      errors: [
        { code: "condition-removed", text: "‘기준을 지킨’이라는 조건을 없애고 모든 수입품으로 범위를 넓혔다." },
        { code: "country-added", text: "특정 나라에서만 붙는다는 정보를 더했다." },
        { code: "color-added", text: "인증 표시의 색을 새로 정했다." }
      ],
      error: "condition-removed",
      explanation: "정확해요. 인증 표시는 모든 수입품에 자동으로 붙는 것이 아니라 기준을 확인한 생산물에 붙을 수 있어요."
    },
    {
      source: "공정 무역 제품을 고른다고 해서 무조건 비싼 물건을 많이 사야 하는 것은 아닙니다.",
      sourceCue: "무조건 비싼 물건을 많이 사야 하는 것은 아닙니다", thiefCue: "반드시 비싼 제품을 많이", hintCategory: "‘아닙니다’까지 문장 끝의 부정 표현을 확인해 보세요.",
      summaries: [
        { code: "A", text: "공정 무역을 실천하려면 반드시 비싼 제품을 많이 사야 한다.", note: "" },
        { code: "B", text: "공정 무역 제품을 고르는 일이 비싼 물건의 많은 구매를 뜻하지는 않는다.", note: "문장의 부정 의미를 정확히 살린 요약이에요." },
        { code: "C", text: "필요를 살피며 생산 과정이 공정한 제품을 고르는 것도 책임 있는 소비이다.", note: "다음 문장의 내용을 함께 압축했지만 원문의 방향과 같아요." }
      ],
      thief: "A",
      errors: [
        { code: "negative-reversal", text: "‘많이 사야 하는 것은 아니다’를 ‘반드시 많이 사야 한다’로 뒤집었다." },
        { code: "product-change", text: "공정 무역 제품을 중고 제품으로 바꾸었다." },
        { code: "person-change", text: "소비자를 생산자로 바꾸었다." }
      ],
      error: "negative-reversal",
      explanation: "맞아요. 공정 무역은 무조건 비싼 물건을 많이 사는 일이 아니라 필요와 생산 과정을 함께 살피는 선택이에요."
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
