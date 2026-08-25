(() => {
  "use strict";

  /* 표지 그림은 **회차 데이터에서** 가져온다.
   * 예전에는 여기에 파일 이름 하나가 박혀 있었고(「우리는 친구」의 덧그린 표지),
   * 그래서 책을 갈아도 표지에는 앞 책 그림이 그대로 남았다 — 콘텐츠는 멀쩡한데
   * 화면만 지난 책이라 알아채기가 어렵다. */
  function coverSrc() {
    const session = document.body.dataset.session || "session01";
    return window.ONQ_CONTENT_PACK?.sessions?.[session]?.coverImage || "assets/book/page-01.webp";
  }

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

    const src = coverSrc();
    document.querySelectorAll(".cover-art img").forEach((image) => {
      if (image.getAttribute("src") !== src) image.setAttribute("src", src);
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
      const session = String(document.body.dataset.session || "session01").replace(/^session0*/, "") || "1";
      meta.innerHTML = `<strong>${window.ONQ_CONTENT_PACK?.bookTitle || ""}</strong><span>${session}</span>`;
      meta.addEventListener("click", () => {
        if (typeof window.ONQ_GOTO === "function") window.ONQ_GOTO(0);
      });
      brand.insertAdjacentElement("afterend", meta);
    }

    /* ⚠️ 여기에 있던 「2회차부터는 표지 문구를 …로 덮어쓴다」는 손질을 걷어냈다.
     * 「우리는 친구」 2회차 한 곳을 고치려고 넣은 것인데, 책이 바뀌면 회차마다 적어 둔
     * goal이 통째로 남의 문구로 덮여 버린다. 표지 문구는 content-pack의 goal 하나로 정한다. */
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
