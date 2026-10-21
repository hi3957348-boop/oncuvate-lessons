(() => {
  "use strict";
  const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let opener = null;
  let activeModal = null;
  let scheduled = false;

  function focusables(modal) {
    return [...modal.querySelectorAll(selector)].filter(element => !element.hidden && element.getClientRects().length > 0);
  }
  function returnFocus() {
    const target = opener && document.contains(opener) ? opener : document.querySelector('[data-action="open-modal"]');
    requestAnimationFrame(() => target?.focus({ preventScroll:true }));
  }
  function syncModal() {
    scheduled = false;
    const modal = document.querySelector('.modal[role="dialog"], .modal[aria-modal="true"]');
    if (modal && modal !== activeModal) {
      activeModal = modal;
      requestAnimationFrame(() => (focusables(modal)[0] || modal).focus({ preventScroll:true }));
      return;
    }
    if (!modal && activeModal) {
      activeModal = null;
      returnFocus();
    }
  }

  document.addEventListener("click", event => {
    const open = event.target.closest('[data-action="open-modal"]');
    if (open) opener = open;
    if (event.target.closest('[data-action="close-modal"]')) setTimeout(returnFocus, 40);
  }, true);

  document.addEventListener("keydown", event => {
    if (!activeModal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      activeModal.querySelector('[data-action="close-modal"]')?.click();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables(activeModal);
    if (!items.length) { event.preventDefault(); activeModal.focus(); return; }
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(syncModal);
  }).observe(document.getElementById("app") || document.body, { childList:true, subtree:true });
  syncModal();
})();
