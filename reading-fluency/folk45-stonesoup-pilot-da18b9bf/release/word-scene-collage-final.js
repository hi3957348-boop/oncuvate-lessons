(() => {
  "use strict";

  // 나누어 읽기 앞머리(낱말 예측)의 장면 카드에 **네 쪽 삽화**를 나란히 깐다.
  // 기존 L3 관례가 회차마다 네 쪽이다. 회차 첫 쪽(1쪽·8쪽)은 표지가 쓰므로 그다음 넷을 쓴다.
  const pagesBySession = {
    session01: [1, 3, 5, 7]
  };

  // 7쪽 모두 적어 둔다 — 삽화 요청 목록과 그림 설명이 여기서 나온다.
  const altByPage = {
    1: "해 질 무렵 배고픈 나그네가 작은 마을에 들어와 집집마다 문을 두드리는 모습",
    2: "고개를 저으며 문을 꼭 닫는 마을 사람들",
    3: "마을 한가운데 불 위 커다란 냄비에 둥근 돌멩이를 퐁당 넣는 나그네",
    4: "궁금한 얼굴로 하나둘 냄비 곁에 모여드는 마을 사람들",
    5: "당근을 두 손에 들고 달려오는 아이와 웃는 나그네",
    6: "감자·양파·고기·소금을 하나씩 가져오는 마을 사람들",
    7: "보글보글 끓는 냄비 둘레에 둘러앉아 수프를 나누어 먹으며 웃는 사람들",
    8: "다음 날 아침 돌멩이를 들고 다음 마을로 떠나는 나그네의 뒷모습"
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
