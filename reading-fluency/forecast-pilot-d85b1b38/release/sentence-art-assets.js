(() => {
  "use strict";

  const artSource = page => `assets/book/art/page-${String(page).padStart(2, "0")}-art.webp`;

  function updateBookArt(root = document) {
    root.querySelectorAll(".sentence-art img, .scene-card img").forEach(image => {
      const match = image.getAttribute("src")?.match(/page-(\d{2})\.webp$/);
      if (match) image.src = artSource(Number(match[1]));
    });
  }

  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) updateBookArt(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => updateBookArt(), { once: true });
  } else {
    updateBookArt();
  }
})();
