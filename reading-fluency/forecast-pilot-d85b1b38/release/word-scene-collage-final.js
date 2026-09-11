(() => {
  "use strict";

  const pagesBySession = {
    session01: [2, 3, 4, 5]
  };

  const altByPage = {
    1: "내일 날씨가 궁금해 창밖 하늘을 올려다보는 아이의 장면",
    2: "기상 위성이 우주에서 구름의 위치와 움직임을 살펴보는 장면",
    3: "지상 관측소의 백엽상과 풍향계가 기온과 바람을 재는 장면",
    4: "기상 레이더가 비구름을 향해 전파를 쏘아 비의 정도를 살피는 장면",
    5: "바다에 뜬 관측 장비와 하늘로 올라가는 기상 관측 기구가 자료를 모으는 장면"
  };

  function artSource(page) {
    return `assets/book/art/page-${String(page).padStart(2, "0")}-art.webp`;
  }

  function applyCollage() {
    const card = document.querySelector(".word-scene-layout .scene-card, .word-quiz-layout .scene-card");
    if (!card || card.classList.contains("word-scene-collage")) return;
    const pages = pagesBySession[document.body.dataset.session];
    if (!pages) return;

    card.classList.add("word-scene-collage");
    card.setAttribute("aria-label", "그림책의 네 장면");
    card.innerHTML = pages.map(page => `
      <div class="word-scene-collage__item">
        <img src="${artSource(page)}" alt="${altByPage[page]}" draggable="false">
      </div>`).join("");
  }

  applyCollage();
  new MutationObserver(applyCollage).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
