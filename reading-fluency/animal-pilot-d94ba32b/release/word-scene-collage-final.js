(() => {
  "use strict";

  const pagesBySession = {
    session01: [1, 2, 4, 5]
  };

  const altByPage = {
    1: "동물이 태어나 자라고 새끼를 낳은 뒤 늙어가는 한살이의 흐름을 이어 보여 주는 장면",
    2: "어미와 닮은 강아지 새끼와, 알에서 애벌레로 태어나는 나비를 나란히 놓고 견주는 장면",
    4: "알을 낳는 새·곤충과 새끼를 낳는 포유류를 좌우로 나누어 보여 주는 장면",
    5: "아기에서 어린이, 청소년, 어른으로 자라는 사람의 한살이 장면"
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
