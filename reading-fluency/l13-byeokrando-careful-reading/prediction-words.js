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
    { id: "predict-word-01", word: "벽란도", expected: true, meaning: "고려 시대에 여러 나라 상인이 모인 국제 무역항이에요.", hanja: "碧瀾渡(벽란도): 푸른 물결의 나루", example: "외국 상인들은 벽란도에서 물건을 사고팔았어요." },
    { id: "predict-word-02", word: "국제 무역항", expected: true, meaning: "여러 나라의 배와 상인이 드나들며 무역하는 항구예요.", hanja: "國際貿易港(국제 무역항): 나라 사이의 무역이 이루어지는 항구", example: "벽란도는 고려의 대표적인 국제 무역항이었어요." },
    { id: "predict-word-03", word: "하구", expected: true, meaning: "강물이 바다나 큰 강으로 흘러 들어가는 어귀예요.", hanja: "河口(하구): 강 하, 입 구", example: "벽란도는 예성강 하구에 있었어요." },
    { id: "predict-word-04", word: "아라비아 상인", expected: true, meaning: "아라비아 지역에서 물건을 사고팔러 다니던 사람들이에요.", hanja: "商人(상인): 장사 상, 사람 인", example: "아라비아 상인도 고려의 소문을 듣고 찾아왔어요." },
    { id: "predict-word-05", word: "수출", expected: true, meaning: "자기 나라의 물건을 다른 나라에 내다 파는 일이에요.", hanja: "輸出(수출): 나를 수, 날 출", example: "고려는 인삼과 종이를 송에 수출했어요." },
    { id: "predict-word-06", word: "수입", expected: true, meaning: "다른 나라의 물건을 자기 나라로 들여오는 일이에요.", hanja: "輸入(수입): 나를 수, 들 입", example: "고려는 송에서 비단과 서적을 수입했어요." },
    { id: "predict-word-07", word: "화문석", expected: true, meaning: "여러 색으로 꽃무늬를 놓아 짠 돗자리예요.", hanja: "花紋席(화문석): 꽃 화, 무늬 문, 자리 석", example: "화문석은 고려가 내보낸 아름다운 공예품이었어요." },
    { id: "predict-word-08", word: "나전 칠기", expected: true, meaning: "옻칠한 물건에 자개를 붙여 꾸민 공예품이에요.", hanja: "螺鈿漆器(나전 칠기): 자개로 꾸민 옻칠 그릇", example: "고려의 나전 칠기는 정교하고 아름다웠어요." },
    { id: "predict-word-09", word: "자동차 공장", expected: false, meaning: "자동차를 만드는 시설이에요.", hanja: "自動車工場(자동차 공장)", example: "자동차 공장은 고려 시대 벽란도 무역과 관계없는 말이에요." },
    { id: "predict-word-10", word: "놀이공원", expected: false, meaning: "놀이기구를 타며 즐기는 곳이에요.", hanja: "遊園地(유원지): 놀 유, 동산 원, 땅 지", example: "놀이공원은 이 글의 주제와 관계없는 말이에요." }
  ];
  let index = 0;
  let correctCount = 0;
  let locked = false;
  let shownAt = performance.now();

  function emitAnswer(item, choice, correct, responseMs) {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: {
        type: "answer",
        activityId: "predict-byeokrando",
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
        activityId: "predict-byeokrando",
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



