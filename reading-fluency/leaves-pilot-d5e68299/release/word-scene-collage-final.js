(() => {
  "use strict";

  const pagesBySession = {
    session01: [1, 2, 3, 4],
    session02: [5, 6, 7, 8]
  };

  const altByPage = {
    1: "가을이 되어 가지에 달린 잎들의 색이 조금씩 달라지기 시작한 나무",
    2: "짙은 초록이 옅어지고 노랗고 붉은 빛이 번지는 잎들을 가까이 본 장면",
    3: "잎 하나가 나뭇가지에서 떨어져 바람에 실려 내려오는 장면",
    4: "나무 아래 쌓인 낙엽을 바라보는 아이와 옷깃을 여민 사람들",
    5: "꽁꽁 언 땅 위에 잎을 떨군 나무가 서 있는 추운 겨울 들판",
    6: "잎 표면에서 물기가 김처럼 날아가고 나무가 잎을 떨어뜨리는 장면",
    7: "잎을 모두 떨군 나무들 사이에 푸른 잎을 지닌 소나무가 서 있는 장면",
    8: "가지만 남은 나무와 푸른 소나무가 나란히 겨울을 나는 넓은 풍경"
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
