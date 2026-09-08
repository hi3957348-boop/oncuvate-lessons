(() => {
  "use strict";

  const studio = document.getElementById("studio");
  const sidebar = document.getElementById("sidebar");
  const menuButton = document.getElementById("menuButton");
  const stage = document.getElementById("stage");
  const finishFirstRead = document.getElementById("finishFirstRead");
  const firstPassage = document.getElementById("firstPassage");
  const firstQuiz = document.getElementById("firstQuiz");
  const readingLayout = firstPassage?.closest(".reading-layout");
  const readingReminder = readingLayout?.querySelector(".reading-reminder");

  if (!studio || !sidebar || !menuButton) return;

  function syncMenuState() {
    const mobile = window.innerWidth <= 860;
    const expanded = mobile
      ? sidebar.classList.contains("open")
      : !studio.classList.contains("sidebar-collapsed");
    menuButton.setAttribute("aria-expanded", String(expanded));
    menuButton.setAttribute("aria-label", expanded ? "학습 순서 접기" : "학습 순서 펼치기");
    menuButton.title = expanded ? "메뉴 접기" : "메뉴 펼치기";
    menuButton.textContent = expanded ? "◀" : "▶";
  }

  menuButton.addEventListener("click", () => {
    if (window.innerWidth <= 860) {
      studio.classList.remove("sidebar-collapsed");
    } else {
      sidebar.classList.remove("open");
      studio.classList.toggle("sidebar-collapsed");
    }
    syncMenuState();
  });

  document.querySelectorAll("[data-go], #backButton, #nextButton").forEach(button => {
    button.addEventListener("click", () => queueMicrotask(syncMenuState));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) sidebar.classList.remove("open");
    else studio.classList.remove("sidebar-collapsed");
    syncMenuState();
  });

  finishFirstRead?.addEventListener("click", () => {
    requestAnimationFrame(() => {
      readingLayout?.classList.remove("quiz-mode");
      firstPassage?.classList.remove("hidden");
      if (firstQuiz) {
        firstQuiz.style.gridColumn = "";
        firstQuiz.style.maxWidth = "";
        firstQuiz.style.width = "";
        firstQuiz.style.justifySelf = "";
      }
      if (stage) stage.scrollTo({ top: 0, behavior: "smooth" });
      firstQuiz?.focus?.({ preventScroll: true });
    });
  });

  syncMenuState();
})();

