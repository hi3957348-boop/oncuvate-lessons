(() => {
  // 차례 이름으로 찾는다. 번호로 잡으면 차례를 하나 넣고 뺄 때마다 어긋난다.
  // 차례 이름으로 찾는다. 번호로 잡으면 차례를 하나 넣고 뺄 때마다 어긋난다.
  const labels = {
    vocab:      ["어휘체크", "그림 보고 고르기"],
    game2:      ["젤리캡쳐", "색 타일 찾고 읽기"],
    game1:      ["문장 완성", "듣고 순서 맞추기"],
    sentence:   ["나누어 읽기", "한 문장씩 끊어 읽기"],
    paragraph:  ["전체 읽기", "전체 글과 질문"],
    worksheet:  ["3단계 쓰기", "보기·첫소리·스스로"]
  };
  let scheduled = false;

  function normalizeShell() {
    scheduled = false;
    document.querySelector(".lesson-meta")?.remove();
    document.querySelector(".nav-title")?.remove();

    const coverCopy = document.querySelector(".cover-copy");
    if (coverCopy && !coverCopy.querySelector(".cover-book-title")) {
      const title = document.createElement("p");
      title.className = "cover-book-title";
      title.textContent = "《우리는 친구》";
      coverCopy.prepend(title);
    }

    const nav = document.querySelector(".step-nav");
    if (nav) {
      const cover = [...nav.querySelectorAll(".step-btn")].find(button => button.dataset.step === "0");
      if (cover) cover.remove();
      [...nav.querySelectorAll(".step-btn")].forEach((button, index) => {
        const number = button.querySelector(".step-no");
        const strong = button.querySelector(".step-copy strong");
        const small = button.querySelector(".step-copy small");
        if (number && number.textContent !== String(index + 1)) number.textContent = String(index + 1);
        const label = labels[button.dataset.stepId];
        if (!label) return;
        if (strong && strong.textContent !== label[0]) strong.textContent = label[0];
        if (small && small.textContent !== label[1]) small.textContent = label[1];
      });
    }

    const dots = document.querySelector(".page-dots");
    if (dots) {
      const all = [...dots.querySelectorAll(".page-dot")];
      const stepCount = document.querySelectorAll(".step-nav .step-btn").length;
      if (all.length === stepCount + 1) all[0].remove();
      const activeStep = Number(document.querySelector(".step-btn.active")?.dataset.step || 0);
      [...dots.querySelectorAll(".page-dot")].forEach((dot, index) => dot.classList.toggle("active", activeStep === index + 1));
      const label = activeStep ? `${activeStep} / ${stepCount}` : "회차 표지";
      if (dots.getAttribute("aria-label") !== label) dots.setAttribute("aria-label", label);
    }

    const footer = document.querySelector(".bottombar");
    if (footer && document.querySelector(".cover-start")) {
      footer.querySelector('[data-action="next"]')?.remove();
      footer.querySelector('[data-action="prev"]')?.setAttribute("disabled", "");
    }
  }

  const observer = new MutationObserver(() => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(normalizeShell); }
  });
  observer.observe(document.getElementById("app"), { childList: true, subtree: true });
  normalizeShell();
})();
