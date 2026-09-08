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
      id: "predict-word-01", word: "세시 풍속", expected: true,
      meaning: "한 해의 절기나 달, 계절에 맞추어 이어 온 생활 습관이에요.",
      hanja: "歲(세): 한 해 · 時(시): 때 · 風俗(풍속): 오래 이어 온 생활 모습",
      example: "설날에 세배하는 것은 우리나라의 세시 풍속이에요."
    },
    {
      id: "predict-word-02", word: "인공지능", expected: false,
      meaning: "컴퓨터가 사람처럼 배우고 판단하도록 만든 기술이에요.",
      hanja: "人工(인공): 사람이 만듦 · 知能(지능): 생각하고 판단하는 능력",
      example: "인공지능이 사진 속 동물을 구별했어요."
    },
    {
      id: "predict-word-03", word: "절기", expected: true,
      meaning: "계절의 변화를 알 수 있도록 한 해를 스물네 때로 나눈 것이에요.",
      hanja: "節氣(절기): 계절을 나눈 마디와 기운",
      example: "입춘은 봄이 시작됨을 알리는 절기예요."
    },
    {
      id: "predict-word-04", word: "하이브리드", expected: false,
      meaning: "서로 다른 두 가지 방식이나 성질을 섞은 것을 말해요.",
      example: "이 자동차는 전기와 기름을 함께 쓰는 하이브리드 자동차예요."
    },
    {
      id: "predict-word-05", word: "입춘", expected: true,
      meaning: "봄이 시작됨을 알리는 절기예요.",
      hanja: "立春(입춘): 설 립, 봄 춘",
      example: "입춘을 맞아 대문에 좋은 글귀를 붙였어요."
    },
    {
      id: "predict-word-06", word: "기상 레이더", expected: false,
      meaning: "전파를 이용해 비구름의 위치와 비의 세기를 살피는 장비예요.",
      hanja: "氣象(기상): 공기의 상태",
      example: "기상 레이더로 비구름이 다가오는 모습을 확인했어요."
    },
    {
      id: "predict-word-07", word: "동지", expected: true,
      meaning: "일 년 중 밤이 가장 긴 때에 드는 겨울 절기예요.",
      hanja: "冬至(동지): 겨울 동, 이를 지",
      example: "동지에는 팥죽을 쑤어 이웃과 나누어 먹었어요."
    },
    {
      id: "predict-word-08", word: "유비쿼터스", expected: false,
      meaning: "언제 어디서나 컴퓨터나 인터넷을 이용할 수 있는 환경을 뜻해요.",
      example: "스마트 기기로 어디서나 정보를 확인하는 유비쿼터스 환경이 넓어졌어요."
    },
    {
      id: "predict-word-09", word: "송편", expected: true,
      meaning: "추석에 즐겨 빚어 먹는 반달 모양의 떡이에요.",
      example: "가족이 둘러앉아 솔잎 향이 나는 송편을 빚었어요."
    },
    {
      id: "predict-word-10", word: "기우제", expected: true,
      meaning: "비가 오랫동안 내리지 않을 때 비가 오기를 바라며 지내던 의식이에요.",
      hanja: "祈雨祭(기우제): 빌 기, 비 우, 제사 제",
      example: "하지 무렵까지 비가 오지 않자 기우제를 지냈어요."
    }
  ];

  let index = 0;
  let correctCount = 0;
  let locked = false;
  let shownAt = performance.now();
  let autoAdvanceTimer = null;

  function emitAnswer(item, choice, correct, responseMs) {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: {
        type: "answer",
        activityId: "predict-seasonal-customs",
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
        activityId: "predict-seasonal-customs",
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
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
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
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
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
    if (correct) {
      autoAdvanceTimer = window.setTimeout(advance, 1200);
    }
  }

  yesButton.addEventListener("click", () => choose(true));
  noButton.addEventListener("click", () => choose(false));
  feedback.addEventListener("click", event => {
    if (event.target.closest("#rapidWordNext")) advance();
  });
  restartButton.addEventListener("click", () => {
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
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



