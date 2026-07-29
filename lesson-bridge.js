(() => {
  if (window.parent === window) return;
  let previous = "";

  function report() {
    const raw = localStorage.getItem("oncuvate_animal_observation_v1") || "{}";
    const activePage = Number(document.querySelector(".page.on")?.dataset.page || 0);
    const payload = JSON.parse(raw);
    const answers = payload.answers || {};
    const chars = Object.values(answers).reduce((sum, value) => sum + String(value || "").length, 0);
    const completed = [1, 2, 3, 4, 5, 6].filter(index => String(answers[index] || "").trim()).length;
    const snapshot = JSON.stringify({ activePage, chars, completed, animal: payload.animal || "", answers });

    if (snapshot === previous) return;
    previous = snapshot;
    window.parent.postMessage({
      type: "oncuvate-progress",
      activePage,
      chars,
      progress: Math.round(completed / 6 * 100),
      animal: payload.animal || "",
      answers
    }, window.location.origin);
  }

  window.addEventListener("load", report);
  window.addEventListener("input", report);
  window.addEventListener("click", () => setTimeout(report, 80));
  setInterval(report, 1500);
})();
