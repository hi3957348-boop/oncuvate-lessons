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
      id: "predict-word-01", word: "기상 위성", expected: true,
      meaning: "우주에서 구름과 날씨의 변화를 관측하는 인공위성이에요.",
      hanja: "氣象(기상): 공기의 상태 · 衛星(위성): 행성 둘레를 도는 천체",
      example: "기상 위성이 태풍의 이동 경로를 관측했어요."
    },
    {
      id: "predict-word-02", word: "프레젠테이션", expected: false,
      meaning: "여러 사람 앞에서 자료를 보여 주며 설명하거나 발표하는 일이에요.",
      example: "민수는 조사 결과를 프레젠테이션으로 발표했어요."
    },
    {
      id: "predict-word-03", word: "관측 자료", expected: true,
      meaning: "어떤 현상을 자세히 살피고 재어서 얻은 정보예요.",
      hanja: "觀測(관측): 볼 관, 잴 측 · 資料(자료): 판단의 바탕이 되는 정보",
      example: "연구자는 여러 날의 관측 자료를 표로 정리했어요."
    },
    {
      id: "predict-word-04", word: "생물다양성", expected: false,
      meaning: "한 지역에 여러 종류의 생물과 다양한 생태 관계가 존재하는 성질이에요.",
      hanja: "生物(생물): 살아 있는 것 · 多樣性(다양성): 여러 모습이 있는 성질",
      example: "산호초에는 다양한 생물이 살아 생물다양성이 높아요."
    },
    {
      id: "predict-word-05", word: "기압", expected: true,
      meaning: "공기의 무게 때문에 생기는, 공기가 누르는 힘이에요.",
      hanja: "氣壓(기압): 기운 기, 누를 압",
      example: "태풍의 중심으로 갈수록 기압이 낮아져요."
    },
    {
      id: "predict-word-06", word: "국제무역협정", expected: false,
      meaning: "여러 나라가 물건이나 서비스를 사고파는 규칙을 함께 정한 약속이에요.",
      hanja: "國際(국제): 나라 사이 · 貿易(무역): 나라 사이의 거래 · 協定(협정): 함께 정한 약속",
      example: "두 나라는 관세를 낮추는 국제무역협정을 맺었어요."
    },
    {
      id: "predict-word-07", word: "예보관", expected: true,
      meaning: "관측 자료를 분석하여 앞으로의 날씨를 판단하고 알리는 전문가예요.",
      hanja: "豫報(예보): 미리 예, 알릴 보",
      example: "예보관은 내일 비가 올 가능성을 자세히 살펴보았어요."
    },
    {
      id: "predict-word-08", word: "애니메이션", expected: false,
      meaning: "그림이나 인형의 장면을 이어 움직이는 것처럼 보이게 만든 영상이에요.",
      example: "우리 모둠은 물의 순환을 설명하는 애니메이션을 만들었어요."
    },
    {
      id: "predict-word-09", word: "비구름", expected: true,
      meaning: "빗방울을 품고 있어 비를 내리게 하는 구름이에요.",
      example: "짙은 비구름이 다가오자 곧 굵은 비가 내렸어요."
    },
    {
      id: "predict-word-10", word: "산업혁명", expected: false,
      meaning: "기계를 널리 사용하면서 생산 방식과 사회가 크게 바뀐 역사적 변화예요.",
      hanja: "産業(산업): 물건과 서비스를 만드는 활동 · 革命(혁명): 사회가 크게 바뀌는 일",
      example: "산업혁명 이후 공장에서 기계를 널리 사용했어요."
    },
  ];

  let index = 0;
  let correctCount = 0;
  let locked = false;
  let shownAt = performance.now();

  function emitAnswer(item, choice, correct, responseMs) {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: {
        type: "answer",
        activityId: "predict-weather-text",
        itemId: item.id,
        word: item.word,
        value: choice,
        correct,
        responseMs
      }
    }));
  }

  function emitComplete() {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: {
        type: "activity-complete",
        activityId: "predict-weather-text",
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



