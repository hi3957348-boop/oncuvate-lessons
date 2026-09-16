(() => {
  "use strict";

  let scheduled = false;

  function placeSentenceAudio() {
    scheduled = false;
    document.querySelectorAll(".ws-step5 .ws-item").forEach(row => {
      const sentence = row.querySelector(".ws-sentence");
      const audio = row.querySelector(".ws-audio");
      if (!sentence || !audio || audio.parentElement === sentence) return;
      sentence.append(audio);
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(placeSentenceAudio);
  }

  new MutationObserver(schedule).observe(document.getElementById("app"), { childList: true, subtree: true });
  schedule();
})();
