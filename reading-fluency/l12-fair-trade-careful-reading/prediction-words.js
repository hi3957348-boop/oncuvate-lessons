(() => {
  "use strict";

  const activity = document.getElementById("rapidWordActivity");
  const playArea = document.getElementById("rapidWordPlay");
  const wordElement = document.getElementById("rapidWord");
  const counter = document.getElementById("rapidWordCounter");
  const progress = document.getElementById("rapidWordProgress");
  const feedback = document.getElementById("rapidWordFeedback");
  const yesButton = document.getElementById("rapidWordYes");
  const noButton = document.getElementById("rapidWordNo");
  const summary = document.getElementById("rapidWordSummary");
  const summaryScore = document.getElementById("rapidWordScore");
  const restartButton = document.getElementById("rapidWordRestart");

  if (!activity || !wordElement || !yesButton || !noButton || !feedback) return;

  const words = [
    {
      id: "predict-word-01", word: "공정 무역", expected: true,
      meaning: "생산자가 정당한 대가를 받고 안전하게 일하도록 돕는 거래 방식이자 운동이에요.",
      hanja: "公正(공정): 한쪽으로 치우치지 않고 올바름 · 貿易(무역): 나라 사이의 거래",
      example: "공정 무역 제품은 생산 과정과 거래 조건을 중요하게 살펴요."
    },
    {
      id: "predict-word-02", word: "생산자", expected: true,
      meaning: "물건이나 서비스를 만들어 내는 사람이나 단체예요.",
      hanja: "生産者(생산자): 만들어 내는 사람",
      example: "카카오를 기르고 수확하는 농부는 생산자예요."
    },
    {
      id: "predict-word-03", word: "관세", expected: false,
      meaning: "나라 밖에서 들어오거나 나가는 물건에 매기는 세금이에요.",
      hanja: "關稅(관세): 국경을 지나는 물품에 매기는 세금",
      example: "나라마다 수입 물품에 적용하는 관세가 다를 수 있어요."
    },
    {
      id: "predict-word-04", word: "정당한 대가", expected: true,
      meaning: "한 일이나 제공한 물건에 알맞게 받는 돈이나 보상을 뜻해요.",
      hanja: "正當(정당): 이치에 맞아 올바름 · 代價(대가): 일이나 물건에 치르는 값",
      example: "생산자는 수확한 카카오에 대해 정당한 대가를 받아야 해요."
    },
    {
      id: "predict-word-05", word: "환율", expected: false,
      meaning: "한 나라의 돈과 다른 나라 돈을 바꾸는 비율이에요.",
      hanja: "換率(환율): 돈을 바꾸는 비율",
      example: "환율이 달라지면 같은 물건의 수입 가격도 달라질 수 있어요."
    },
    {
      id: "predict-word-06", word: "인증 표시", expected: true,
      meaning: "정해진 기준을 지켰는지 확인받았음을 나타내는 표시예요.",
      hanja: "認證(인증): 기준에 맞는지 확인하여 인정함",
      example: "소비자는 포장의 인증 표시와 설명을 함께 확인했어요."
    },
    {
      id: "predict-word-07", word: "소비자", expected: true,
      meaning: "필요한 물건이나 서비스를 선택해 사용하는 사람이에요.",
      hanja: "消費者(소비자): 물건이나 서비스를 써서 없애는 사람",
      example: "소비자는 가격뿐 아니라 생산 과정도 살펴볼 수 있어요."
    },
    {
      id: "predict-word-08", word: "불매 운동", expected: false,
      meaning: "문제가 있다고 생각하는 상품을 사지 않기로 함께 행동하는 일이에요.",
      hanja: "不買(불매): 사지 않음",
      example: "소비자들이 기업의 변화를 요구하며 불매 운동을 벌이기도 해요."
    },
    {
      id: "predict-word-09", word: "직거래", expected: true,
      meaning: "중간 단계를 줄이고 생산자와 구매자가 직접 거래하는 방식이에요.",
      hanja: "直去來(직거래): 사이 단계를 거치지 않고 바로 거래함",
      example: "생산자 단체와 직접 거래하면 유통 단계를 줄이는 데 도움이 될 수 있어요."
    },
    {
      id: "predict-word-10", word: "안전한 노동 환경", expected: true,
      meaning: "일하는 사람이 위험이나 부당한 대우를 줄이며 일할 수 있는 조건이에요.",
      hanja: "勞動(노동): 몸이나 머리를 써서 일함 · 環境(환경): 둘러싼 조건",
      example: "공정 무역은 안전한 노동 환경을 중요한 기준으로 살펴요."
    }
  ];
  let index = 0;
  let correctCount = 0;
  let locked = false;
  let shownAt = performance.now();

  function emitAnswer(item, choice, correct, responseMs) {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: {
        type: "answer",
        activityId: "predict-fair-trade",
        itemId: item.id,
        word: item.word,
        value: choice,
        response: choice,
        correct,
        responseMs
      }
    }));
  }

  function emitComplete() {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: {
        type: "activity-complete",
        activityId: "predict-fair-trade",
        itemId: "rapid-word-judgment",
        score: correctCount,
        total: words.length
      }
    }));
  }

  function addInfoRow(list, label, value, className = "") {
    if (!value) return;
    const row = document.createElement("div");
    if (className) row.className = className;
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    list.append(row);
  }

  function renderFeedback(item, correct) {
    feedback.replaceChildren();
    feedback.className = "rapid-word-feedback expanded " + (correct ? "success" : "attention");
    feedback.setAttribute("role", "presentation");
    feedback.removeAttribute("aria-live");

    const dialog = document.createElement("section");
    dialog.className = "rapid-feedback-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "rapidWordDialogTitle");

    const result = document.createElement("div");
    result.className = "rapid-feedback-result";
    const badge = document.createElement("span");
    badge.textContent = correct ? "정확해요" : "다시 확인";
    const answer = document.createElement("strong");
    answer.id = "rapidWordDialogTitle";
    answer.textContent = "정답: " + (item.expected ? "이 글에 나와요" : "이 글에는 나오지 않아요");
    result.append(badge, answer);

    const info = document.createElement("dl");
    info.className = "rapid-feedback-info";
    addInfoRow(info, "뜻", item.meaning);
    addInfoRow(info, "한자", item.hanja, "hanja-row");
    addInfoRow(info, "예문", item.example, "example-row");

    const note = document.createElement("p");
    note.className = "rapid-feedback-note";
    note.textContent = item.expected
      ? "본문에서 실제로 만날 낱말이에요. 읽으면서 찾아보세요."
      : "본문에는 나오지 않지만 뜻을 알아 두면 좋은 낱말이에요.";

    const next = document.createElement("button");
    next.type = "button";
    next.id = "rapidWordNext";
    next.className = "rapid-feedback-next";
    next.textContent = index < words.length - 1 ? "다음 낱말" : "결과 보기";
    next.setAttribute("aria-label", next.textContent + " (Enter 키)");

    dialog.append(result, info, note, next);
    feedback.append(dialog);
    next.focus({ preventScroll: true });
  }

  function renderWord() {
    const item = words[index];
    locked = false;
    counter.textContent = (index + 1) + " / " + words.length;
    progress.style.width = ((index + 1) / words.length * 100) + "%";
    wordElement.textContent = item.word;
    wordElement.classList.remove("word-pop");
    void wordElement.offsetWidth;
    wordElement.classList.add("word-pop");
    feedback.textContent = "제목과 그림을 떠올려 판단해 보세요. 고르면 뜻과 예문을 확인할 수 있어요.";
    feedback.className = "rapid-word-feedback sr-only";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    [yesButton, noButton].forEach(button => {
      button.disabled = false;
      button.classList.remove("correct", "wrong");
    });
    yesButton.dataset.correct = String(item.expected);
    noButton.dataset.correct = String(!item.expected);
    yesButton.dataset.itemId = item.id;
    noButton.dataset.itemId = item.id;
    shownAt = performance.now();
  }

  function finishRound() {
    playArea.classList.add("hidden");
    summary.classList.remove("hidden");
    counter.textContent = words.length + " / " + words.length;
    progress.style.width = "100%";
    summaryScore.textContent = correctCount + " / " + words.length;
    emitComplete();
    restartButton.focus({ preventScroll: true });
  }

  function advance() {
    if (!locked) return;
    if (index < words.length - 1) {
      index += 1;
      renderWord();
      wordElement.focus?.({ preventScroll: true });
    } else {
      finishRound();
    }
  }

  function choose(expected) {
    if (locked || summary.classList.contains("hidden") === false) return;
    locked = true;
    const item = words[index];
    const correct = expected === item.expected;
    const selectedButton = expected ? yesButton : noButton;
    const correctButton = item.expected ? yesButton : noButton;
    const responseMs = Math.round(performance.now() - shownAt);
    if (correct) correctCount += 1;

    yesButton.disabled = true;
    noButton.disabled = true;
    correctButton.classList.add("correct");
    if (!correct) selectedButton.classList.add("wrong");
    renderFeedback(item, correct);
    emitAnswer(item, expected ? "yes" : "no", correct, responseMs);
  }

  yesButton.addEventListener("click", () => choose(true));
  noButton.addEventListener("click", () => choose(false));
  feedback.addEventListener("click", event => {
    if (event.target.closest("#rapidWordNext")) advance();
  });
  restartButton.addEventListener("click", () => {
    index = 0;
    correctCount = 0;
    summary.classList.add("hidden");
    playArea.classList.remove("hidden");
    renderWord();
  });

  document.addEventListener("keydown", event => {
    if (!activity.closest(".page")?.classList.contains("active")) return;
    if (locked && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      advance();
      return;
    }
    if (locked) return;
    if (event.key.toLowerCase() === "o") choose(true);
    if (event.key.toLowerCase() === "x") choose(false);
  });

  renderWord();
})();



