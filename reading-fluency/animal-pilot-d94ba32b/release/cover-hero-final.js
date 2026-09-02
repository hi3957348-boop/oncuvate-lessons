(() => {
  "use strict";

  // 표지 그림은 **content-pack의 coverImage**를 쓴다.
  // 파일 이름을 여기 박아 두면 책을 바꿔도 지난 책 표지가 그대로 뜬다.
  const COVER_SRC = window.ONQ_CONTENT_PACK?.sessions?.[document.body.dataset.session]?.coverImage
    || "assets/book/page-01.webp";
  let scheduled = false;

  function loadStylesheet(key, href) {
    if (document.querySelector(`link[data-module="${key}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.module = key;
    document.head.append(link);
  }

  function loadScript(key, src) {
    if (document.querySelector(`script[data-module="${key}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.dataset.module = key;
    document.body.append(script);
  }

  function loadFinalOverlays() {
    if (!document.querySelector('link[data-annotation-text-overlay]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "release/annotation-text-overlay-final.css";
      link.dataset.annotationTextOverlay = "";
      document.head.append(link);
    }
    if (!document.querySelector('script[data-annotation-text-overlay]')) {
      const script = document.createElement("script");
      script.src = "release/annotation-text-overlay-final.js";
      script.dataset.annotationTextOverlay = "";
      document.body.append(script);
    }
    loadStylesheet("common-shell-annotation-final", "release/common-shell-annotation-final.css");
    loadScript("common-shell-annotation-final", "release/common-shell-annotation-final.js");
  }

  function applyCover() {
    scheduled = false;

    document.querySelectorAll(".cover-art img").forEach((image) => {
      if (image.getAttribute("src") !== COVER_SRC) image.setAttribute("src", COVER_SRC);
      image.setAttribute("alt", `《${window.ONQ_CONTENT_PACK?.bookTitle || ""}》 표지 삽화`);
      image.setAttribute("draggable", "false");
    });

    /* Keep the legacy marker for menu-fix, but remove it from the visible hero. */
    document.querySelectorAll(".cover-book-title").forEach((title) => {
      title.setAttribute("aria-hidden", "true");
    });
    document.querySelectorAll(".cover-badge").forEach((badge) => badge.remove());

    const sidebar = document.querySelector(".sidebar");
    const brand = sidebar?.querySelector(".sidebar-brand");
    if (sidebar && brand && !sidebar.querySelector(".sidebar-lesson-meta")) {
      // 책 제목을 누르면 표지로 돌아간다 — 차례에는 표지 칸이 없어서 돌아갈 길이 없었다.
      const meta = document.createElement("button");
      meta.type = "button";
      meta.className = "sidebar-lesson-meta";
      meta.title = "표지로 돌아가기";
      // 회차가 하나뿐인 책에는 번호를 달지 않는다 — 「1」만 떠 있으면 뜻이 없다.
      const sessionCount = Object.keys(window.ONQ_CONTENT_PACK?.sessions || {}).length;
      const session = document.body.dataset.session === "session02" ? "2" : "1";
      meta.innerHTML = `<strong>${window.ONQ_CONTENT_PACK?.bookTitle || ""}</strong>`
        + (sessionCount > 1 ? `<span>${session}</span>` : "");
      meta.addEventListener("click", () => {
        if (typeof window.ONQ_GOTO === "function") window.ONQ_GOTO(0);
      });
      brand.insertAdjacentElement("afterend", meta);
    }

    if (document.body.dataset.session === "session02") {
      const coverGoal = document.querySelector(".cover-copy > p:not(.cover-book-title)");
      if (coverGoal && coverGoal.textContent !== "이어지는 소리를 문장에서 정확하게 읽어요.") {
        coverGoal.textContent = "이어지는 소리를 문장에서 정확하게 읽어요.";
      }

      document.querySelectorAll("#app p, #app li, #app small, #app span").forEach((node) => {
        if (!node.children.length && node.textContent.includes("코로 바뀌는 받침 소리")) {
          node.textContent = node.textContent.replaceAll("코로 바뀌는 받침 소리", "달라지는 소리");
        }
      });
    }
  }

  function scheduleCover() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyCover);
  }

  loadFinalOverlays();
  applyCover();
  new MutationObserver(scheduleCover).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
