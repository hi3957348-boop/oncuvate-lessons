(() => {
  "use strict";

  const contentId = "l12-fair-trade-careful-reading";
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
    const payload = { type, activityId: detail.activityId || pages[currentPage]?.dataset.activityId || "", ...detail };
    if (type === "answer" && payload.response === undefined && payload.value !== undefined) {
      payload.response = String(payload.value);
    }
    window.dispatchEvent(new CustomEvent("oncuvate:log", { detail: payload }));
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
    "어려운 낱말은 눌러 뜻을 확인하고, 문제에서는 답을 하나 골라요.",
    "먼저 원문과 뜻이 다른 요약문을 찾고, 필요할 때 확인 힌트를 한 단계씩 사용해요.",
    "카드의 핵심 내용을 확인해 공정한 거래 과정의 알맞은 칸에 놓아요.",
    "조건 대조판에서 대상·시점·범위·근거 수를 직접 골라 내 답과 비교하세요.",
    "새 상황에서 어휘, 읽기 전략, 생활 판단을 차례로 적용해 보세요.",
    "오늘 도움이 된 확인 행동을 한 가지 골라 기록해요."
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
      button.dataset.correct = button.dataset.predict.startsWith("공정") ? "true" : "false";
      emit("answer", { activityId: "predict-fair-trade", itemId: "prediction", value: state.prediction });
    });
  });

  // 2. 꼼꼼하게 읽기 — 본문 확인 뒤 한 번에 답 선택
  const firstQuestions = [
    {
      question: "공정 무역은 어떤 거래 방식인가요?",
      options: ["가장 싼 물건만 고르는 거래", "구매자가 생산자에게 정당한 대가를 지불하는 거래", "중간 상인이 가격을 모두 정하는 거래"],
      correct: 1,
      cueOptions: ["공정 무역은", "어떤", "거래 방식인가요"],
      cueCorrect: 0,
      explanation: "공정 무역은 구매자가 생산자에게 정당한 대가를 지불하고 안전한 생산 조건을 지키도록 돕는 거래 방식이에요."
    },
    {
      question: "생산자의 수입이 너무 적거나 불안정하면 생길 수 있는 문제는 무엇인가요?",
      options: ["생활비와 교육비를 마련하기 어려워진다.", "모든 상품의 가격이 같아진다.", "유통 단계가 자동으로 사라진다."],
      correct: 0,
      cueOptions: ["생산자의 수입이", "너무 적거나 불안정하면", "생길 수 있는 문제"],
      cueCorrect: 0,
      explanation: "수입이 적거나 불안정하면 생산자 가족이 생활비와 교육비를 마련하기 어려울 수 있어요."
    },
    {
      question: "책임 있는 소비의 시작으로 글에서 제안한 행동은 무엇인가요?",
      options: ["비싼 물건을 많이 산다.", "광고 문구만 믿고 바로 산다.", "필요한 만큼 사고 생산 정보를 확인한다."],
      correct: 2,
      cueOptions: ["책임 있는 소비의 시작", "글에서", "제안한 행동"],
      cueCorrect: 0,
      explanation: "필요한 만큼 사고 누가 어떤 환경에서 만들었는지 확인하는 것이 책임 있는 소비의 시작이에요."
    }
  ];  let firstQuestionIndex = 0;
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
  const firstQuestionNext = document.getElementById("firstQuestionNext");

  function setFirstCoachFeedback(message, kind = "") {
    firstQuizFeedback.replaceChildren();
    const image = document.createElement("img");
    image.src = "assets/jelly-coach-square.png";
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    const body = document.createElement("p");
    const name = document.createElement("strong");
    name.textContent = "젤리코치";
    const textNode = document.createElement("span");
    textNode.textContent = message;
    body.append(name, textNode);
    firstQuizFeedback.append(image, body);
    firstQuizFeedback.className = "inline-feedback coach-inline-feedback" + (kind ? " " + kind : "");
  }

  function scrollFirstQuizToBottom() {
    requestAnimationFrame(() => {
      firstQuiz.scrollTo({ top: firstQuiz.scrollHeight, behavior: "smooth" });
    });
  }

  function renderFirstQuestion() {
    const q = firstQuestions[firstQuestionIndex];
    firstConfirmed = false;
    firstReadCounter.textContent = (firstQuestionIndex + 1) + " / " + firstQuestions.length;
    firstQuestionNumber.textContent = (firstQuestionIndex + 1) + " / " + firstQuestions.length;
    firstQuestionText.textContent = q.question;
    firstQuestionNext.classList.add("hidden");
    firstAnswerList.replaceChildren();
    firstQuiz.scrollTop = 0;
    setFirstCoachFeedback("답을 하나 골라 봐.");

    q.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.track = "answer";
      button.dataset.response = option;
      const mark = document.createElement("span");
      mark.textContent = String.fromCharCode(65 + index);
      const label = document.createElement("b");
      label.textContent = option;
      button.append(mark, label);
      button.addEventListener("click", () => {
        if (firstConfirmed) return;
        firstConfirmed = true;
        const correct = index === q.correct;
        state.firstAnswers[firstQuestionIndex] = {
          selected: index,
          correct,
          initialCorrect: correct,
          selfCorrected: false
        };
        [...firstAnswerList.children].forEach((item, itemIndex) => {
          item.disabled = true;
          if (itemIndex === q.correct) item.classList.add("correct");
          if (itemIndex === index && !correct) item.classList.add("wrong");
        });
        firstQuestionNext.classList.remove("hidden");
        firstQuestionNext.textContent = firstQuestionIndex === firstQuestions.length - 1 ? "꼼꼼하게 읽기 결과 보기" : "다음 문제";
        setFirstCoachFeedback(
          correct
            ? "정확해. " + q.explanation
            : "이 부분을 다시 확인해 보자. " + q.explanation,
          correct ? "success" : "attention"
        );
        emit("answer", {
          activityId: "first-read-and-answer",
          itemId: "q" + (firstQuestionIndex + 1),
          correct,
          value: option,
          response: option,
          promptLevel: "A0"
        });
        window.CarefulReadingSession?.recordInitial("q" + (firstQuestionIndex + 1), correct);
        window.CarefulReadingSession?.recordFinal("q" + (firstQuestionIndex + 1), correct, false);
        scrollFirstQuizToBottom();
        firstQuestionNext.focus();
      });
      firstAnswerList.append(button);
    });
  }

  firstQuestionNext.addEventListener("click", () => {
    if (!firstConfirmed) return;
    if (firstQuestionIndex < firstQuestions.length - 1) {
      firstQuestionIndex += 1;
      renderFirstQuestion();
      return;
    }
    firstReadCounter.textContent = "3 / 3 완료";
    firstQuestionNext.classList.add("hidden");
    setFirstCoachFeedback("세 문제를 모두 확인했어. 다음 활동으로 넘어가도 좋아.", "success");
    emit("activity-complete", {
      activityId: "first-read-and-answer",
      score: state.firstAnswers.filter(item => item?.correct).length,
      firstResponseScore: state.firstAnswers.filter(item => item?.initialCorrect).length,
      selfCorrections: 0
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

  // 4. 공정 거래 연결 — 약속 카드를 알맞은 과정에 배치
  const pipelineTaskBank = [
    { id: "grow", stage: "producer", cue: "씨를 심고 열매를 기르며 수확", text: "생산자는 씨를 심고 열매를 기르며 수확합니다." },
    { id: "fair-pay", stage: "price", cue: "정당한 대가", text: "구매자는 생산자에게 일한 만큼 정당한 대가를 지불해야 합니다." },
    { id: "no-child-labor", stage: "work", cue: "어린이 노동", text: "강제로 일하게 하거나 어린이 노동을 이용하지 않습니다." },
    { id: "check-label", stage: "consumer", cue: "인증 표시", text: "소비자는 인증 표시와 생산 과정을 확인해 물건을 고릅니다." },
    { id: "cooperate", stage: "producer", cue: "생산자 단체", text: "생산자 단체는 함께 모여 구매자와 거래할 수 있습니다." },
    { id: "stable-sale", stage: "price", cue: "안정적으로 판매", text: "생산자는 비교적 안정적으로 판매할 기회를 얻습니다." },
    { id: "safe-work", stage: "work", cue: "안전한 환경", text: "생산자가 안전한 환경에서 일하도록 돕습니다." },
    { id: "responsible-choice", stage: "consumer", cue: "필요한 만큼", text: "소비자는 필요한 만큼 사고 믿을 수 있는 정보를 확인합니다." }
  ];
  const pipelineStageMeta = {
    producer: { label: "생산자", total: 2 },
    price: { label: "정당한 대가", total: 2 },
    work: { label: "생산 조건", total: 2 },
    consumer: { label: "소비자", total: 2 }
  };
  const pipelineStageOrder = ["producer", "price", "work", "consumer"];
  function makePipelineOrder() {
    const items = [...pipelineTaskBank];
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    const fixedPattern = items.every((task, index) => task.stage === pipelineStageOrder[index % pipelineStageOrder.length]);
    if (fixedPattern && items.length > 1) items.push(items.shift());
    return items;
  }
  let pipelineTasks = makePipelineOrder();
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
  const pipelineStageCounts = { producer: 0, price: 0, work: 0, consumer: 0 };

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
    pipelineFeedback.textContent = "카드가 누구와 어떤 약속에 관한 내용인지 확인해 보세요.";
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
      activityId: "restore-fair-trade-chain",
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
        pipelineFeedback.textContent = "아직 맞지 않아요. 카드의 대상과 행동을 다시 확인해 봐요.";
      } else {
        renderPipelineCardText(task, true);
        pipelineFeedback.textContent = "‘" + task.cue + "’가 어느 과정과 연결되는지 확인해 보세요.";
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
    pipelineFeedback.textContent = (pipelineAttempts > 1 ? "다시 확인해 연결했어요. " : "정확해요. ") + "이 카드는 " + pipelineStageMeta[task.stage].label + " 칸이에요.";
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
      activityId: "restore-fair-trade-chain",
      score: state.pipelineCorrect,
      firstResponseScore: pipelineFirstCorrect,
      selfCorrections: pipelineSelfCorrections
    });
    pipelineRestart.focus();
  }

  pipelineNext.addEventListener("click", advancePipeline);

  pipelineRestart.addEventListener("click", () => {
    window.clearTimeout(pipelineAdvanceTimer);
    pipelineTasks = makePipelineOrder();
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

  // 5. 검산하기 — 읽기 조건을 먼저 확인한 뒤 답을 고르고 대조
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
  const conditionAnswers = { subject: "both", time: "trade", range: "all", evidence: "all" };
  const conditionLabels = { subject: "대상", time: "시점", range: "범위", evidence: "선택" };
  const selectedConditions = new Map();
  const correctVerifyAnswers = ["fair-pay", "trace"];
  let verifyPromptLevel = 0;

  function lockVerifyAnswers(locked) {
    verifyAnswers.classList.toggle("is-locked", locked);
    verifyAnswers.setAttribute("aria-disabled", String(locked));
    [...verifyAnswers.querySelectorAll("input")].forEach(input => { input.disabled = locked; });
    makeAnswerButton.disabled = locked;
    makeAnswerButton.textContent = locked ? "먼저 읽기 조건을 확인해요" : "내 답 확인하기";
  }

  function setVerifyFeedback(message, kind = "") {
    verifyFeedback.textContent = message;
    verifyFeedback.className = "inline-feedback" + (kind ? " " + kind : "");
  }

  function showNextCondition() {
    const nextRow = conditionRows.find(row => !selectedConditions.has(row.dataset.conditionRow));
    conditionRows.forEach(row => {
      const answered = selectedConditions.has(row.dataset.conditionRow);
      row.classList.toggle("chat-answered", answered);
      row.classList.toggle("chat-current", row === nextRow);
      row.classList.toggle("chat-pending", !answered && row !== nextRow);
      [...row.querySelectorAll("button")].forEach(button => { button.disabled = row !== nextRow; });
    });
    verificationProgress.textContent = selectedConditions.size + " / " + conditionRows.length;
    conditionChatFinish.classList.toggle("hidden", Boolean(nextRow));
    if (nextRow) {
      lockVerifyAnswers(true);
      requestAnimationFrame(() => conditionChatScroll.scrollTo({ top: nextRow.offsetTop - 18, behavior: "smooth" }));
      return;
    }
    lockVerifyAnswers(false);
    setVerifyFeedback("문제의 네 가지 조건을 확인했어. 이제 답을 골라 봐.", "success");
    requestAnimationFrame(() => conditionChatScroll.scrollTo({ top: conditionChatScroll.scrollHeight, behavior: "smooth" }));
  }

  function prepareConditionCheck() {
    selectedConditions.clear();
    verificationBoard.classList.remove("is-waiting");
    conditionChatIntro.classList.add("hidden");
    conditionChatFinish.classList.add("hidden");
    verifyButton.classList.add("hidden");
    verifyButton.disabled = true;
    verifyFeedback.className = "inline-feedback hidden";
    verifyFeedback.textContent = "";
    conditionHighlights.forEach(mark => mark.classList.remove("needs-attention"));
    verifyQuestionCard.classList.remove("show-condition-highlights");
    conditionRoutes.forEach(route => route.classList.remove("is-active", "is-done", "needs-review"));
    conditionRows.forEach(row => {
      delete row.dataset.answered;
      [...row.querySelectorAll("button")].forEach(button => button.classList.remove("selected", "wrong", "correct"));
    });
    lockVerifyAnswers(true);
    showNextCondition();
  }

  conditionRows.forEach(row => {
    const key = row.dataset.conditionRow;
    [...row.querySelectorAll("button")].forEach(button => {
      button.dataset.track = "answer";
      button.addEventListener("click", () => {
        if (!row.classList.contains("chat-current")) return;
        [...row.querySelectorAll("button")].forEach(item => item.classList.remove("selected", "wrong", "correct"));
        button.classList.add("selected");
        selectedConditions.set(key, button.dataset.value);
        row.dataset.answered = "true";
        emit("answer", {
          activityId: "verify-all-conditions",
          itemId: "verify-condition-" + key,
          correct: button.dataset.value === conditionAnswers[key],
          value: button.dataset.value,
          response: button.dataset.value,
          promptLevel: "A" + verifyPromptLevel
        });
        showNextCondition();
      });
    });
  });

  [...verifyAnswers.querySelectorAll("input")].forEach(input => {
    input.addEventListener("change", () => input.closest("label")?.classList.remove("wrong-selected"));
  });

  function evaluateVerification() {
    if (selectedConditions.size !== conditionRows.length) {
      showToast("대상·시점·범위·근거 수부터 확인해 주세요.");
      return;
    }
    const selected = [...verifyAnswers.querySelectorAll("input:checked")].map(input => input.value).sort();
    if (!selected.length) {
      showToast("답이라고 생각하는 항목을 골라 보세요.");
      return;
    }
    const expected = [...correctVerifyAnswers].sort();
    const answerCorrect = selected.length === expected.length && selected.every((value, index) => value === expected[index]);
    const incorrectRows = conditionRows.filter(row => selectedConditions.get(row.dataset.conditionRow) !== conditionAnswers[row.dataset.conditionRow]);

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
    [...verifyAnswers.querySelectorAll("label")].forEach(label => label.classList.remove("wrong-selected"));
    state.verified = answerCorrect && incorrectRows.length === 0;
    emit("answer", {
      activityId: "verify-all-conditions",
      itemId: "verified-answer",
      correct: answerCorrect,
      value: selected.join(","),
      response: selected.join(","),
      processCorrect: incorrectRows.length === 0,
      promptLevel: "A" + verifyPromptLevel
    });

    if (incorrectRows.length) {
      verifyPromptLevel = Math.max(1, verifyPromptLevel);
      verifyQuestionCard.classList.add("show-condition-highlights");
      incorrectRows.forEach(row => {
        const key = row.dataset.conditionRow;
        verifyQuestionCard.querySelector('[data-condition-highlight="' + key + '"]')?.classList.add("needs-attention");
        selectedConditions.delete(key);
        delete row.dataset.answered;
        [...row.querySelectorAll("button")].forEach(button => button.classList.remove("selected", "correct"));
      });
      const firstKey = incorrectRows[0].dataset.conditionRow;
      setVerifyFeedback("‘" + conditionLabels[firstKey] + "’에서 질문과 어긋났어. 강조된 말을 다시 보고 확인해 봐.", "attention");
      lockVerifyAnswers(true);
      showNextCondition();
      return;
    }

    if (!answerCorrect) {
      verifyPromptLevel = Math.max(1, verifyPromptLevel);
      verifyQuestionCard.classList.add("show-condition-highlights");
      ["range", "evidence"].forEach(key => verifyQuestionCard.querySelector('[data-condition-highlight="' + key + '"]')?.classList.add("needs-attention"));
      [...verifyAnswers.querySelectorAll("label")].forEach(label => {
        const input = label.querySelector("input");
        if (input.checked && !correctVerifyAnswers.includes(input.value)) label.classList.add("wrong-selected");
      });
      setVerifyFeedback("질문의 선택 범위를 다시 확인해 봐. 해당하는 답을 빠짐없이 골랐는지 대조해 보자.", "attention");
      makeAnswerButton.textContent = "답을 바꿔 다시 확인하기";
      conditionChatScroll.scrollTo({ top: conditionChatScroll.scrollHeight, behavior: "smooth" });
      return;
    }

    setVerifyFeedback("정확해요. 네 가지 조건과 답이 모두 맞았어.", "success final-success");
    conditionRows.forEach(row => [...row.querySelectorAll("button")].forEach(button => { button.disabled = true; }));
    [...verifyAnswers.querySelectorAll("input")].forEach(input => { input.disabled = true; });
    makeAnswerButton.disabled = true;
    makeAnswerButton.textContent = "검산 완료 ✓";
    makeAnswerButton.classList.add("is-complete");
    emit("activity-complete", { activityId: "verify-all-conditions", promptLevel: "A" + verifyPromptLevel });
    conditionChatScroll.scrollTo({ top: conditionChatScroll.scrollHeight, behavior: "smooth" });
  }

  makeAnswerButton.addEventListener("click", evaluateVerification);
  prepareConditionCheck();
  // 6. 전이·기록은 aba-intervention.js에서 운영합니다.

  function updateWatermark() {
    const child = window.ONCUVATE && window.ONCUVATE.child;
    watermark.textContent = child ? "Oncuvate · " + child : "";
  }
  updateWatermark();
  window.addEventListener("oncuvate:ready", updateWatermark);
  showPage(0);
})();














