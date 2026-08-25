(() => {
  "use strict";

  const pagesBySession = {
    session01: [3, 4, 6, 7],
    session02: [9, 10, 11, 13]
  };

  const altByPage = {
    3: "친구인 새를 소개하는 장면",
    4: "코뿔소와 작은 벌레가 나오는 장면",
    6: "악어가 이빨을 닦지 못해 고민하는 장면",
    7: "새가 악어의 이빨을 청소하는 장면",
    9: "새가 기린의 가려운 곳을 긁어 주는 장면",
    10: "먼 곳을 보기 어려운 얼룩말 장면",
    11: "새가 위험한 동물을 감시하는 장면",
    13: "서로 다른 친구들이 노래를 듣는 장면"
  };

  function artSource(page) {
    return `assets/book/art/page-${String(page).padStart(2, "0")}-art.webp`;
  }

  function applyCollage() {
    const card = document.querySelector(".word-scene-layout .scene-card");
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
