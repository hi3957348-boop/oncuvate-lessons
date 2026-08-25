(() => {
  "use strict";

  // 어느 쪽 그림을 모을지, 그 그림을 뭐라고 읽어 줄지 — 둘 다 **본문에서 가져온다.**
  // 예전에는 쪽 번호와 설명을 박아 두어, 새 책에서 **다른 책 장면 설명**이
  // 화면 낭독에 그대로 나갔다(「코뿔소와 작은 벌레가 나오는 장면」).
  const lessonNow = window.ONQ_CONTENT_PACK?.sessions?.[document.body.dataset.session];
  const lessonPages = [...new Set((lessonNow?.sentences || []).map(item => item.page))];
  const pagesBySession = { [document.body.dataset.session]: lessonPages.slice(0, 4) };
  const altByPage = Object.fromEntries(lessonPages.map(page => [page, `그림책 ${page}쪽 장면`]));

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
