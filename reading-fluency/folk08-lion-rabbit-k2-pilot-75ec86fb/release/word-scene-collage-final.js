(() => {
  "use strict";

  // 나누어 읽기 앞머리(낱말 예측)의 장면 카드에 **네 쪽 삽화**를 나란히 깐다.
  // 기존 L3 관례가 회차마다 네 쪽이다. 회차 첫 쪽(1쪽·8쪽)은 표지가 쓰므로 그다음 넷을 쓴다.
  const pagesBySession = {
    session01: [1, 3, 4, 6]
  };

  // 7쪽 모두 적어 둔다 — 삽화 요청 목록과 그림 설명이 여기서 나온다.
  const altByPage = {
    1: "숲 속 커다란 바위 아래에 사슴·원숭이·멧돼지·공작·다람쥐·토끼가 모여 있고, 멀리 바위 굴 앞에 사자가 앉아 있는 모습",
    2: "바위 아래 모인 동물들이 걱정스러운 얼굴로 이야기를 나누고, 멀리 굴 앞에서 사자가 내려다보는 모습",
    3: "토끼가 돌로 쌓은 우물 가에 앞발을 얹고 들여다보고, 물에 토끼 얼굴이 비친 모습",
    4: "해 질 녘 굴 앞에서 화난 사자가 입을 벌리고 웅크린 토끼를 내려다보는 모습",
    5: "해 질 녘 웅크린 토끼가 화난 사자를 올려다보며 말하는 모습",
    6: "사자가 우물 가에 앞발을 얹고 노려보고, 물에 사자 얼굴이 비친 모습 · 뒤에서 토끼가 지켜봄",
    7: "우물 물에 비친 자기 얼굴을 노려보는 사자와 뒤에서 지켜보는 토끼",
    8: "우물 앞에 선 사자와 뒤에 앉아 조용히 지켜보는 토끼"
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
