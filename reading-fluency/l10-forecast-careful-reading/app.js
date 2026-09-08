(() => {
  "use strict";

  const contentId = "l10-forecast-careful-reading";
  const pages = [...document.querySelectorAll(".page")];
  const stepLinks = [...document.querySelectorAll(".step-link")];
  const progressBar = document.getElementById("progressBar");
  const stage = document.getElementById("stage");
  const sidebar = document.getElementById("sidebar");
  const menuButton = document.getElementById("menuButton");
  const backButton = document.getElementById("backButton");
  const nextButton = document.getElementById("nextButton");
  const stepDots = document.getElementById("stepDots");
  const helpButton = document.getElementById("helpButton");
  const toast = document.getElementById("toast");
  const watermark = document.getElementById("watermark");
  const completionSignal = document.getElementById("completionSignal");

  let currentPage = 0;
  let toastTimer = null;
  const state = {
    prediction: "",
    firstAnswers: [],
    trapsCorrect: 0,
    pipelineCorrect: 0,
    verified: false,
    reflection: ""
  };

  function emit(type, detail = {}) {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: { type, activityId: detail.activityId || pages[currentPage]?.dataset.activityId || "", ...detail }
    }));
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function showPage(index) {
    currentPage = Math.max(0, Math.min(index, pages.length - 1));
    pages.forEach((page, i) => page.classList.toggle("active", i === currentPage));
    stepLinks.forEach((link, i) => {
      link.classList.toggle("active", i === currentPage);
      if (i === currentPage) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    [...stepDots.children].forEach((dot, i) => dot.classList.toggle("active", i === currentPage));
    progressBar.style.width = ((currentPage + 1) / pages.length * 100) + "%";
    backButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === pages.length - 1;
    nextButton.textContent = currentPage === pages.length - 1 ? "완료" : "다음";
    stage.scrollTop = 0;
    sidebar.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
    emit("step-view", { itemId: String(currentPage + 1) });
  }

  pages.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", (i + 1) + "단계로 이동");
    dot.addEventListener("click", () => showPage(i));
    stepDots.append(dot);
  });
  stepLinks.forEach(link => link.addEventListener("click", () => showPage(Number(link.dataset.go))));
  backButton.addEventListener("click", () => showPage(currentPage - 1));
  nextButton.addEventListener("click", () => showPage(currentPage + 1));
  menuButton?.addEventListener("click", () => {
    const opened = sidebar.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(opened));
  });

  document.addEventListener("click", event => {
    if (window.innerWidth > 860 || !sidebar.classList.contains("open")) return;
    if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
      sidebar.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });

  const helpMessages = [
    "제목과 그림을 충분히 살핀 뒤 주제와 관련 있는 낱말인지 판단해 보세요.",
    "처음 답을 고른 뒤, 질문에서 답의 범위를 정하는 말을 확인하고 확정해요.",
    "먼저 원문과 뜻이 다른 요약문을 찾고, 필요할 때 확인 힌트를 한 단계씩 사용해요.",
    "질문의 핵심 단서를 먼저 고른 뒤, 그 단서와 답을 함께 뒷받침하는 문장을 찾아요.",
    "조건 대조판에서 대상·시점·범위·근거 수를 직접 골라 내 답과 비교하세요.",
    "새 글에서도 답을 고른 뒤 결정적 표현을 찾고, 오늘 도움이 된 확인 행동을 골라요."
  ];
  helpButton.addEventListener("click", () => showToast(helpMessages[currentPage]));

  // 1. 예측하기
  const predictionFeedback = document.getElementById("predictionFeedback");
  document.querySelectorAll("[data-predict]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-predict]").forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
      state.prediction = button.dataset.predict;
      predictionFeedback.textContent = "내 예측: " + state.prediction + " · 이제 글을 읽으며 맞는지 확인해 보세요.";
      predictionFeedback.className = "inline-feedback success";
      button.dataset.correct = button.dataset.predict.startsWith("날씨를 관측") ? "true" : "false";
      emit("answer", { activityId: "predict-weather-text", itemId: "prediction", value: state.prediction });
    });
  });

  // 2. 1차 읽기 — 답 선택 → 조건 확인 → 답 확정
  const firstQuestions = [
    {
      question: "일기예보를 만드는 일은 무엇부터 시작하나요?",
      options: ["미래의 기온을 계산하는 일", "여러 곳에서 날씨를 관측하는 일", "방송으로 예보를 전달하는 일"],
      correct: 1,
      cueOptions: ["일기예보", "무엇부터", "시작하나요"],
      cueCorrect: 1,
      explanation: "글의 첫 문단에서 ‘관측하는 일부터 시작합니다’라고 했어요."
    },
    {
      question: "대형 컴퓨터가 하는 일로 알맞은 것은 무엇인가요?",
      options: ["미래 날씨의 예상 자료를 만든다.", "지역의 산과 바다를 직접 살핀다.", "사람들에게 휴대 전화로 예보한다."],
      correct: 0,
      cueOptions: ["대형 컴퓨터", "알맞은 것", "무엇인가요"],
      cueCorrect: 0,
      explanation: "컴퓨터는 공기의 움직임을 계산하여 미래 날씨의 예상 자료를 만들어요."
    },
    {
      question: "예보관이 일기예보를 작성할 때 추가로 살피는 것은 무엇인가요?",
      options: ["위성의 발사 날짜", "방송 시간과 앱의 모양", "산과 바다 같은 지역 조건"],
      correct: 2,
      cueOptions: ["작성할 때", "추가로", "무엇인가요"],
      cueCorrect: 1,
      explanation: "예보관은 예상 결과뿐 아니라 지역 날씨에 영향을 주는 조건도 살펴요."
    }
  ];
  let firstQuestionIndex = 0;
  let firstDraft = null;
  let firstInitial = null;
  let firstCuePassed = false;
  let firstCuePromptLevel = 0;
  let firstConfirmed = false;
  const firstPassage = document.getElementById("firstPassage");
  const firstQuiz = document.getElementById("firstQuiz");
  const firstReadCoach = document.getElementById("firstReadCoach");
  const toggleFirstPassage = document.getElementById("toggleFirstPassage");
  const revealFirstPassage = document.getElementById("revealFirstPassage");
  const firstReadCounter = document.getElementById("firstReadCounter");
  const firstQuestionNumber = document.getElementById("firstQuestionNumber");
  const firstQuestionText = document.getElementById("firstQuestionText");
  const firstAnswerList = document.getElementById("firstAnswerList");
  const firstQuizFeedback = document.getElementById("firstQuizFeedback");
  const firstCueCheck = document.getElementById("firstCueCheck");
  const firstCueOptions = document.getElementById("firstCueOptions");
  const confirmFirstAnswer = document.getElementById("confirmFirstAnswer");
  const firstQuestionNext = document.getElementById("firstQuestionNext");
  const firstChainSteps = [...document.querySelectorAll("#firstResponseChain [data-chain-step]")];

  function scrollFirstQuizTo(target = null) {
    requestAnimationFrame(() => {
      const top = target ? Math.max(0, target.offsetTop - 10) : firstQuiz.scrollHeight;
      firstQuiz.scrollTo({ top, behavior: "smooth" });
    });
  }

  function setFirstChain(activeName, completed = []) {
    firstChainSteps.forEach(step => {
      const name = step.dataset.chainStep;
      step.classList.toggle("active", name === activeName);
      step.classList.toggle("complete", completed.includes(name));
    });
  }

  function renderFirstQuestion() {
    const q = firstQuestions[firstQuestionIndex];
    firstDraft = null;
    firstInitial = null;
    firstCuePassed = false;
    firstCuePromptLevel = 0;
    firstConfirmed = false;
    firstReadCounter.textContent = (firstQuestionIndex + 1) + " / " + firstQuestions.length;
    firstQuestionNumber.textContent = (firstQuestionIndex + 1) + " / " + firstQuestions.length;
    firstQuestionText.textContent = q.question;
    firstQuizFeedback.textContent = "기억한 내용으로 답을 먼저 골라 보세요. 아직 채점되지 않아요.";
    firstQuizFeedback.className = "inline-feedback";
    firstCueCheck.classList.add("hidden");
    confirmFirstAnswer.classList.add("hidden");
    confirmFirstAnswer.disabled = true;
    firstQuestionNext.classList.add("hidden");
    setFirstChain("answer");
    firstAnswerList.replaceChildren();
    firstCueOptions.replaceChildren();
    firstQuiz.scrollTop = 0;

    q.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.track = "answer";
      const mark = document.createElement("span");
      mark.textContent = String.fromCharCode(65 + index);
      const label = document.createElement("b");
      label.textContent = option;
      button.append(mark, label);
      button.addEventListener("click", () => {
        if (firstConfirmed) return;
        if (firstInitial === null) {
          firstInitial = index;
          const initialCorrect = index === q.correct;
          emit("answer", {
            activityId: "first-read-and-answer",
            itemId: "q" + (firstQuestionIndex + 1) + "-initial",
            correct: initialCorrect,
            value: option,
            stage: "initial"
          });
          window.CarefulReadingSession?.recordInitial("q" + (firstQuestionIndex + 1), initialCorrect);
        }
        firstDraft = index;
        [...firstAnswerList.children].forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
        firstCueCheck.classList.remove("hidden");
        confirmFirstAnswer.classList.remove("hidden");
        firstQuizFeedback.textContent = "답을 골랐어요. 이제 질문에서 답의 범위를 정하는 말을 확인하세요.";
        firstQuizFeedback.className = "inline-feedback";
        setFirstChain("cue", ["answer"]);
        scrollFirstQuizTo(firstCueCheck);
        firstCueOptions.firstElementChild?.focus();
      });
      firstAnswerList.append(button);
    });

    q.cueOptions.forEach((cue, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.track = "answer";
      button.textContent = cue;
      button.addEventListener("click", () => {
        if (firstConfirmed || button.disabled) return;
        const correct = index === q.cueCorrect;
        button.dataset.correct = String(correct);
        emit("answer", {
          activityId: "first-read-and-answer",
          itemId: "q" + (firstQuestionIndex + 1) + "-cue",
          correct,
          value: cue,
          promptLevel: "A" + firstCuePromptLevel
        });
        if (!correct) {
          firstCuePromptLevel = Math.max(1, firstCuePromptLevel);
          button.classList.add("wrong");
          button.disabled = true;
          firstQuizFeedback.textContent = "그 말도 질문에 있지만 답의 대상이나 범위를 결정하지는 않아요. 다시 살펴보세요.";
          firstQuizFeedback.className = "inline-feedback attention";
          scrollFirstQuizTo();
          return;
        }
        firstCuePassed = true;
        button.classList.add("correct");
        [...firstCueOptions.children].forEach(item => { item.disabled = true; });
        confirmFirstAnswer.disabled = false;
        setFirstChain("confirm", ["answer", "cue"]);
        firstQuizFeedback.textContent = "핵심 조건을 확인했어요. 필요하면 답을 바꾼 뒤 확정하세요.";
        firstQuizFeedback.className = "inline-feedback success";
        window.CarefulReadingSession?.recordCheck("q" + (firstQuestionIndex + 1), firstCuePromptLevel);
        scrollFirstQuizTo();
        confirmFirstAnswer.focus();
      });
      firstCueOptions.append(button);
    });
  }

  confirmFirstAnswer.addEventListener("click", () => {
    if (firstDraft === null || !firstCuePassed || firstConfirmed) return;
    const q = firstQuestions[firstQuestionIndex];
    firstConfirmed = true;
    const correct = firstDraft === q.correct;
    const selfCorrected = firstInitial !== firstDraft && correct;
    state.firstAnswers[firstQuestionIndex] = { selected: firstDraft, correct, initialCorrect: firstInitial === q.correct, selfCorrected };
    [...firstAnswerList.children].forEach((item, index) => {
      item.disabled = true;
      item.classList.remove("selected");
      if (index === q.correct) item.classList.add("correct");
      if (index === firstDraft && !correct) item.classList.add("wrong");
    });
    confirmFirstAnswer.classList.add("hidden");
    firstQuestionNext.classList.remove("hidden");
    firstQuestionNext.textContent = firstQuestionIndex === firstQuestions.length - 1 ? "1차 읽기 결과 보기" : "다음 문제";
    setFirstChain("", ["answer", "cue", "confirm"]);
    firstQuizFeedback.textContent = (correct ? (selfCorrected ? "스스로 다시 확인해 바로잡았어요. " : "정확해요. ") : "답과 근거가 어긋난 부분을 찾았어요. ") + q.explanation;
    firstQuizFeedback.className = "inline-feedback " + (correct ? "success" : "attention");
    emit("answer", {
      activityId: "first-read-and-answer",
      itemId: "q" + (firstQuestionIndex + 1),
      correct,
      value: q.options[firstDraft],
      initialCorrect: firstInitial === q.correct,
      selfCorrected,
      promptLevel: "A" + firstCuePromptLevel
    });
    window.CarefulReadingSession?.recordFinal("q" + (firstQuestionIndex + 1), correct, selfCorrected);
    scrollFirstQuizTo();
    firstQuestionNext.focus();
  });

  firstQuestionNext.addEventListener("click", () => {
    if (!firstConfirmed) return;
    if (firstQuestionIndex < firstQuestions.length - 1) {
      firstQuestionIndex += 1;
      renderFirstQuestion();
      firstQuiz.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    firstReadCounter.textContent = "3 / 3 완료";
    firstQuestionNext.classList.add("hidden");
    firstQuizFeedback.textContent += " 이제 원문과 요약문을 비교할 차례예요.";
    emit("activity-complete", {
      activityId: "first-read-and-answer",
      score: state.firstAnswers.filter(item => item?.correct).length,
      firstResponseScore: state.firstAnswers.filter(item => item?.initialCorrect).length,
      selfCorrections: state.firstAnswers.filter(item => item?.selfCorrected).length
    });
  });

  document.getElementById("finishFirstRead").addEventListener("click", () => {
    firstPassage.classList.add("is-covered");
    toggleFirstPassage.classList.remove("hidden");
    toggleFirstPassage.setAttribute("aria-expanded", "false");
    toggleFirstPassage.textContent = "본문 다시 보기";
    firstReadCoach.classList.add("hidden");
    firstQuiz.classList.remove("hidden");
    firstReadCounter.textContent = "1 / 3";
    renderFirstQuestion();
    emit("activity-complete", { activityId: "first-read-and-answer", itemId: "first-reading" });
    firstQuestionText.focus?.();
  }, { once: true });

  function toggleFirstPassageView() {
    const willOpen = firstPassage.classList.contains("is-covered");
    firstPassage.classList.toggle("is-covered", !willOpen);
    toggleFirstPassage.setAttribute("aria-expanded", String(willOpen));
    toggleFirstPassage.textContent = willOpen ? "본문 다시 가리기" : "본문 다시 보기";
    if (willOpen) {
      emit("hint", {
        activityId: "first-read-and-answer",
        itemId: "first-reading-reopen",
        promptLevel: "A1",
        value: "passage-open"
      });
      showToast("본문을 다시 열었어요. 확인한 뒤 다시 가릴 수 있어요.");
    } else {
      emit("tap", {
        activityId: "first-read-and-answer",
        itemId: "first-reading-reopen",
        target: "tool",
        value: "passage-covered"
      });
    }
  }

  toggleFirstPassage.addEventListener("click", toggleFirstPassageView);
  revealFirstPassage.addEventListener("click", toggleFirstPassageView);

  // 3. 정보 도둑 잡기는 information-thief.js에서 독립적으로 운영합니다.

  // 4. 예보 제작 라인 복구 — 과정 문장을 알맞은 단계로 배치
  const pipelineTasks = [
    { id: "satellite", stage: "observe", cue: "살펴봅니다", text: "기상 위성은 우주에서 구름의 위치와 움직임을 살펴봅니다." },
    { id: "compare", stage: "judge", cue: "비교합니다", text: "예보관은 관측 자료와 여러 예상 결과를 비교합니다." },
    { id: "air-motion", stage: "calculate", cue: "계산합니다", text: "컴퓨터는 작은 구역마다 공기가 어떻게 움직일지 계산합니다." },
    { id: "radar", stage: "observe", cue: "관측합니다", text: "기상 레이더는 비구름과 비가 내리는 정도를 관측합니다." },
    { id: "publish", stage: "deliver", cue: "전달됩니다", text: "완성된 예보는 방송과 인터넷, 휴대 전화 앱으로 전달됩니다." },
    { id: "region", stage: "judge", cue: "살펴봅니다", text: "예보관은 산과 바다처럼 지역의 날씨에 영향을 주는 조건도 살펴봅니다." },
    { id: "ground", stage: "observe", cue: "측정합니다", text: "지상 관측소는 기온, 습도, 기압과 바람을 측정합니다." },
    { id: "forecast-data", stage: "calculate", cue: "만듭니다", text: "컴퓨터는 미래의 기온, 바람과 비를 나타낸 예상 자료를 만듭니다." }
  ];
  const pipelineStageMeta = {
    observe: { label: "자료 관측", total: 3 },
    calculate: { label: "컴퓨터 계산", total: 2 },
    judge: { label: "예보관 판단", total: 2 },
    deliver: { label: "예보 전달", total: 1 }
  };
  const pipelineStageOrder = ["observe", "calculate", "judge", "deliver"];
  const pipelineStations = [...document.querySelectorAll("[data-pipeline-stage]")];
  const pipelineStatusSegments = [...document.querySelectorAll(".pipeline-status-line span")];
  const pipelineCounter = document.getElementById("pipelineCounter");
  const pipelinePageCounter = document.getElementById("pipelinePageCounter");
  const pipelineCard = document.getElementById("pipelineCard");
  const pipelineCardText = document.getElementById("pipelineCardText");
  const pipelineInstruction = document.getElementById("pipelineInstruction");
  const pipelineFeedback = document.getElementById("pipelineFeedback");
  const pipelineNext = document.getElementById("pipelineNext");
  const pipelineMission = document.getElementById("pipelineMission");
  const pipelineComplete = document.getElementById("pipelineComplete");
  const pipelineResult = document.getElementById("pipelineResult");
  const pipelineRestart = document.getElementById("pipelineRestart");
  let pipelineIndex = 0;
  let pipelineAttempts = 0;
  let pipelineSolved = false;
  let pipelineFirstCorrect = 0;
  let pipelineSelfCorrections = 0;
  let pipelineAdvanceTimer = 0;
  const pipelineStageCounts = { observe: 0, calculate: 0, judge: 0, deliver: 0 };

  function renderPipelineCardText(task, showCue = false) {
    pipelineCardText.replaceChildren();
    if (!showCue) {
      pipelineCardText.textContent = task.text;
      return;
    }
    const cueAt = task.text.lastIndexOf(task.cue);
    if (cueAt < 0) {
      pipelineCardText.textContent = task.text;
      return;
    }
    pipelineCardText.append(document.createTextNode(task.text.slice(0, cueAt)));
    const mark = document.createElement("mark");
    mark.textContent = task.cue;
    pipelineCardText.append(mark, document.createTextNode(task.text.slice(cueAt + task.cue.length)));
  }

  function updatePipelineBoard() {
    pipelineStageOrder.forEach((stage, index) => {
      const count = pipelineStageCounts[stage];
      const total = pipelineStageMeta[stage].total;
      const station = pipelineStations.find(item => item.dataset.pipelineStage === stage);
      const countLabel = document.querySelector('[data-pipeline-count="' + stage + '"]');
      if (countLabel) countLabel.textContent = count + " / " + total + (count === total ? " ✓" : "");
      station?.classList.toggle("powered", count === total);
      pipelineStatusSegments[index]?.classList.toggle("powered", count === total);
    });
  }

  function renderPipelineTask() {
    const task = pipelineTasks[pipelineIndex];
    pipelineAttempts = 0;
    pipelineSolved = false;
    const progress = (pipelineIndex + 1) + " / " + pipelineTasks.length;
    pipelineCounter.textContent = progress;
    pipelinePageCounter.textContent = progress;
    renderPipelineCardText(task);
    pipelineCard.className = "pipeline-card";
    pipelineCard.draggable = true;
    pipelineInstruction.textContent = "카드를 끌거나 알맞은 칸을 눌러요.";
    pipelineFeedback.textContent = "문장 끝의 행동을 확인해 보세요.";
    pipelineFeedback.className = "pipeline-feedback";
    pipelineNext.classList.add("hidden");
    pipelineStations.forEach(station => {
      station.disabled = false;
      station.classList.remove("wrong", "drag-over");
    });
    pipelineCard.focus();
  }

  function placePipelineCard(stage, interaction = "tap") {
    if (pipelineSolved) return;
    const task = pipelineTasks[pipelineIndex];
    const station = pipelineStations.find(item => item.dataset.pipelineStage === stage);
    pipelineAttempts += 1;
    const correct = stage === task.stage;
    const promptLevel = pipelineAttempts < 2 ? "A0" : pipelineAttempts === 2 ? "A1" : "A2";

    emit("answer", {
      activityId: "restore-forecast-pipeline",
      itemId: "pipeline-" + task.id,
      correct,
      value: stage,
      targetStage: task.stage,
      attempt: pipelineAttempts,
      initialCorrect: pipelineAttempts === 1 && correct,
      selfCorrected: pipelineAttempts > 1 && correct,
      promptLevel,
      interaction
    });

    if (!correct) {
      station?.classList.add("wrong");
      window.setTimeout(() => station?.classList.remove("wrong"), 280);
      if (pipelineAttempts === 1) {
        pipelineFeedback.textContent = "아직 연결되지 않았어요. 문장 끝에서 무엇을 하는지 다시 봐요.";
      } else {
        renderPipelineCardText(task, true);
        pipelineFeedback.textContent = "‘" + task.cue + "’가 어느 단계의 일인지 확인해 보세요.";
      }
      pipelineFeedback.className = "pipeline-feedback attention";
      return;
    }

    pipelineSolved = true;
    state.pipelineCorrect += 1;
    if (pipelineAttempts === 1) pipelineFirstCorrect += 1;
    else pipelineSelfCorrections += 1;
    pipelineStageCounts[task.stage] += 1;
    updatePipelineBoard();
    pipelineCard.classList.add("delivered");
    pipelineCard.draggable = false;
    pipelineStations.forEach(item => { item.disabled = true; });
    pipelineFeedback.textContent = (pipelineAttempts > 1 ? "다시 확인해 연결했어요. " : "정확해요. ") + "‘" + task.cue + "’는 " + pipelineStageMeta[task.stage].label + " 단계예요.";
    pipelineFeedback.className = "pipeline-feedback success";
    pipelineInstruction.textContent = pipelineIndex === pipelineTasks.length - 1
      ? "정확해요. 완성된 라인을 보여 줄게요."
      : "정확해요. 다음 카드로 넘어갈게요.";
    pipelineNext.classList.add("hidden");
    window.clearTimeout(pipelineAdvanceTimer);
    pipelineAdvanceTimer = window.setTimeout(advancePipeline, 1050);
  }

  pipelineStations.forEach(station => {
    station.addEventListener("click", () => placePipelineCard(station.dataset.pipelineStage, "tap"));
    station.addEventListener("dragover", event => {
      if (pipelineSolved) return;
      event.preventDefault();
      station.classList.add("drag-over");
    });
    station.addEventListener("dragleave", () => station.classList.remove("drag-over"));
    station.addEventListener("drop", event => {
      event.preventDefault();
      station.classList.remove("drag-over");
      placePipelineCard(station.dataset.pipelineStage, "drag");
    });
  });

  pipelineCard.addEventListener("dragstart", event => {
    if (pipelineSolved) {
      event.preventDefault();
      return;
    }
    pipelineCard.classList.add("dragging");
    event.dataTransfer?.setData("text/plain", pipelineTasks[pipelineIndex].id);
  });
  pipelineCard.addEventListener("dragend", () => {
    pipelineCard.classList.remove("dragging");
    pipelineStations.forEach(station => station.classList.remove("drag-over"));
  });

  function advancePipeline() {
    if (!pipelineSolved) return;
    if (pipelineIndex < pipelineTasks.length - 1) {
      pipelineIndex += 1;
      renderPipelineTask();
      return;
    }
    pipelineCounter.textContent = "8 / 8 완료";
    pipelinePageCounter.textContent = "8 / 8 완료";
    pipelineMission.classList.add("hidden");
    pipelineComplete.classList.remove("hidden");
    pipelineResult.textContent = "처음부터 정확히 연결 " + pipelineFirstCorrect + "개 · 스스로 수정 " + pipelineSelfCorrections + "개";
    pipelineStations.forEach(station => { station.disabled = true; station.classList.add("powered"); });
    pipelineStatusSegments.forEach(segment => segment.classList.add("powered"));
    emit("activity-complete", {
      activityId: "restore-forecast-pipeline",
      score: state.pipelineCorrect,
      firstResponseScore: pipelineFirstCorrect,
      selfCorrections: pipelineSelfCorrections
    });
    pipelineRestart.focus();
  }

  pipelineNext.addEventListener("click", advancePipeline);

  pipelineRestart.addEventListener("click", () => {
    window.clearTimeout(pipelineAdvanceTimer);
    pipelineIndex = 0;
    pipelineAttempts = 0;
    pipelineSolved = false;
    pipelineFirstCorrect = 0;
    pipelineSelfCorrections = 0;
    state.pipelineCorrect = 0;
    pipelineStageOrder.forEach(stage => { pipelineStageCounts[stage] = 0; });
    pipelineMission.classList.remove("hidden");
    pipelineComplete.classList.add("hidden");
    updatePipelineBoard();
    renderPipelineTask();
  });

  updatePipelineBoard();
  renderPipelineTask();

  // 5. 검산하기 — 질문 조건을 실제로 선택하여 답과 대조
  const verifyAnswers = document.getElementById("verifyAnswers");
  const makeAnswerButton = document.getElementById("makeAnswerButton");
  const verifyQuestionCard = document.querySelector(".verify-question-card");
  const conditionHighlights = [...document.querySelectorAll("[data-condition-highlight]")];
  const verificationBoard = document.getElementById("verificationBoard");
  const verificationProgress = document.getElementById("verificationProgress");
  const conditionChatScroll = document.getElementById("conditionChatScroll");
  const conditionChatIntro = document.getElementById("conditionChatIntro");
  const conditionChatFinish = document.getElementById("conditionChatFinish");
  const verifyButton = document.getElementById("verifyButton");
  const verifyFeedback = document.getElementById("verifyFeedback");
  const conditionRows = [...document.querySelectorAll("[data-condition-row]")];
  const conditionRoutes = [...document.querySelectorAll("[data-condition-route]")];
  const conditionAnswers = { subject: "forecaster", time: "before", range: "all", evidence: "two" };
  const selectedConditions = new Map();
  let verifyPromptLevel = 0;
  let activeConditionIndex = 0;
  let conditionChatStarted = false;

  function prepareConditionChat(waiting = false) {
    activeConditionIndex = 0;
    selectedConditions.clear();
    verificationBoard.classList.toggle("is-waiting", waiting);
    conditionChatIntro.classList.toggle("hidden", !waiting);
    verificationProgress.textContent = waiting ? "준비" : "0 / " + conditionRows.length;
    verifyButton.disabled = true;
    verifyButton.classList.add("hidden");
    conditionChatFinish.classList.add("hidden");
    verifyFeedback.textContent = "";
    verifyFeedback.className = "inline-feedback hidden";
    conditionRoutes.forEach((route, index) => {
      route.classList.remove("is-active", "is-done", "needs-review");
      if (!waiting && index === 0) route.classList.add("is-active");
    });
    conditionRows.forEach((row, index) => {
      row.classList.remove("chat-current", "chat-pending", "chat-answered");
      row.classList.add(!waiting && index === 0 ? "chat-current" : "chat-pending");
      delete row.dataset.answered;
      [...row.querySelectorAll("button")].forEach(button => {
        button.disabled = waiting || index !== 0;
        button.classList.remove("selected", "wrong", "correct");
      });
    });
  }

  prepareConditionChat(true);

  makeAnswerButton.addEventListener("click", () => {
    const selected = [...verifyAnswers.querySelectorAll("input:checked")];
    if (!selected.length) { showToast("먼저 답이라고 생각하는 항목을 골라 보세요."); return; }
    if (!conditionChatStarted) {
      prepareConditionChat(false);
      conditionChatStarted = true;
    }
    makeAnswerButton.textContent = "답을 바꾼 뒤 다시 검산하기";
    conditionChatScroll.scrollTo({ top: 0, behavior: "smooth" });
    emit("answer", {
      activityId: "verify-all-conditions",
      itemId: "draft-answer",
      value: selected.map(input => input.value).join(","),
      stage: "draft"
    });
  });

  conditionRows.forEach(row => {
    const key = row.dataset.conditionRow;
    [...row.querySelectorAll("button")].forEach(button => {
      button.dataset.track = "answer";
      button.addEventListener("click", () => {
        if (row.classList.contains("chat-pending")) return;
        const rowIndex = conditionRows.indexOf(row);
        const isFirstAnswer = !row.dataset.answered;
        [...row.querySelectorAll("button")].forEach(item => item.classList.remove("selected", "wrong", "correct"));
        button.classList.add("selected");
        selectedConditions.set(key, button.dataset.value);
        row.dataset.answered = "true";
        row.classList.add("chat-answered");
        const selectedCount = selectedConditions.size;
        verificationProgress.textContent = selectedCount + " / " + conditionRows.length;
        if (isFirstAnswer && rowIndex === activeConditionIndex) {
          row.classList.remove("chat-current");
          const currentRoute = conditionRoutes.find(route => route.dataset.conditionRoute === key);
          currentRoute?.classList.remove("is-active", "needs-review");
          currentRoute?.classList.add("is-done");
          activeConditionIndex += 1;
          const nextRow = conditionRows[activeConditionIndex];
          if (nextRow) {
            const nextRoute = conditionRoutes.find(route => route.dataset.conditionRoute === nextRow.dataset.conditionRow);
            nextRoute?.classList.add("is-active");
            nextRow.classList.remove("chat-pending");
            nextRow.classList.add("chat-current");
            [...nextRow.querySelectorAll("button")].forEach(item => { item.disabled = false; });
            requestAnimationFrame(() => {
              conditionChatScroll.scrollTo({ top: nextRow.offsetTop - 18, behavior: "smooth" });
            });
          }
        }
        if (selectedCount === conditionRows.length) {
          conditionChatFinish.classList.remove("hidden");
          verifyButton.classList.remove("hidden");
          verifyButton.disabled = false;
          requestAnimationFrame(() => {
            conditionChatScroll.scrollTo({ top: conditionChatScroll.scrollHeight, behavior: "smooth" });
          });
        }
        emit("answer", {
          activityId: "verify-all-conditions",
          itemId: "verify-condition-" + key,
          correct: button.dataset.value === conditionAnswers[key],
          value: button.dataset.value,
          promptLevel: "A" + verifyPromptLevel
        });
      });
    });
  });

  verifyButton.addEventListener("click", () => {
    const selected = [...verifyAnswers.querySelectorAll("input:checked")].map(input => input.value).sort();
    const answerCorrect = selected.length === 2 && selected[0] === "compare" && selected[1] === "region";
    const incorrectRows = conditionRows.filter(row => selectedConditions.get(row.dataset.conditionRow) !== conditionAnswers[row.dataset.conditionRow]);
    conditionRoutes.forEach(route => route.classList.remove("needs-review"));
    conditionHighlights.forEach(mark => mark.classList.remove("needs-attention"));
    verifyQuestionCard.classList.remove("show-condition-highlights");
    conditionRows.forEach(row => {
      const key = row.dataset.conditionRow;
      [...row.querySelectorAll("button")].forEach(button => {
        button.classList.remove("wrong", "correct");
        if (button.dataset.value === selectedConditions.get(key)) {
          button.classList.add(button.dataset.value === conditionAnswers[key] ? "correct" : "wrong");
        }
      });
    });
    state.verified = answerCorrect && incorrectRows.length === 0;
    emit("answer", {
      activityId: "verify-all-conditions",
      itemId: "verified-answer",
      correct: answerCorrect,
      value: selected.join(","),
      processCorrect: incorrectRows.length === 0,
      promptLevel: "A" + verifyPromptLevel
    });
    if (incorrectRows.length) {
      verifyPromptLevel = Math.max(1, verifyPromptLevel);
      verifyQuestionCard.classList.add("show-condition-highlights");
      incorrectRows.forEach(row => {
        const mark = verifyQuestionCard.querySelector('[data-condition-highlight="' + row.dataset.conditionRow + '"]');
        if (mark) mark.classList.add("needs-attention");
        const route = conditionRoutes.find(item => item.dataset.conditionRoute === row.dataset.conditionRow);
        route?.classList.add("needs-review");
      });
      conditionRows.forEach(row => row.classList.remove("chat-current"));
      incorrectRows[0].classList.add("chat-current");
      verifyFeedback.textContent = "아직 질문과 어긋난 조건이 있어. 빨간 선택부터 다시 확인해 볼까?";
      verifyFeedback.className = "inline-feedback attention";
      conditionChatScroll.scrollTo({ top: incorrectRows[0].offsetTop - 18, behavior: "smooth" });
      return;
    }
    if (!answerCorrect) {
      verifyPromptLevel = Math.max(1, verifyPromptLevel);
      verifyQuestionCard.classList.add("show-condition-highlights");
      conditionHighlights.forEach(mark => mark.classList.add("needs-attention"));
      verifyFeedback.textContent = "조건은 정확히 찾았어. 그 네 조건에 맞도록 왼쪽 답을 다시 골라 보자.";
      verifyFeedback.className = "inline-feedback attention";
      conditionChatScroll.scrollTo({ top: conditionChatScroll.scrollHeight, behavior: "smooth" });
      return;
    }
    verifyFeedback.innerHTML = "<strong>정답이에요!</strong><span>대상·시점·범위·근거 수를 하나씩 대조해서 답을 정확히 확인했어.</span>";
    verifyFeedback.className = "inline-feedback success final-success";
    conditionRoutes.forEach(route => {
      route.classList.remove("is-active", "needs-review");
      route.classList.add("is-done");
    });
    verifyButton.disabled = true;
    verifyButton.textContent = "정답 확인 완료 ✓";
    makeAnswerButton.disabled = true;
    makeAnswerButton.textContent = "검산 완료 ✓";
    [...verifyAnswers.querySelectorAll("input")].forEach(input => { input.disabled = true; });
    conditionRows.forEach(row => [...row.querySelectorAll("button")].forEach(button => { button.disabled = true; }));
    conditionChatScroll.scrollTo({ top: conditionChatScroll.scrollHeight, behavior: "smooth" });
    emit("activity-complete", {
      activityId: "verify-all-conditions",
      promptLevel: "A" + verifyPromptLevel
    });
  });

  // 6. 전이·기록은 aba-intervention.js에서 운영합니다.

  function updateWatermark() {
    const child = window.ONCUVATE && window.ONCUVATE.child;
    watermark.textContent = child ? "Oncuvate · " + child : "";
  }
  updateWatermark();
  window.addEventListener("oncuvate:ready", updateWatermark);
  showPage(0);
})();
