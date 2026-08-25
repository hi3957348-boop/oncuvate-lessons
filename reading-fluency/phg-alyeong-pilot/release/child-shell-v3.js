(() => {
  "use strict";

  const platformState = { menuHidden: false, locked: false };
  let scheduled = false;
  let narrowModeWasApplied = false;

  function buildBrand(sidebar) {
    if (sidebar.querySelector(".sidebar-brand")) return;
    const brand = document.createElement("div");
    brand.className = "sidebar-brand";
    brand.innerHTML = '<img src="assets/brand/oncuvate-brand-logo.png" alt="Oncuvate">';
    sidebar.prepend(brand);
  }

  function buildEdgeControl(studio, hidden) {
    studio.querySelectorAll(".sidebar-menu-toggle, .menu-reopen").forEach(node => node.remove());

    let control = studio.querySelector(":scope > .sidebar-edge-toggle");
    if (platformState.locked) {
      control?.remove();
      return;
    }
    if (!control) {
      control = document.createElement("button");
      control.type = "button";
      control.className = "sidebar-edge-toggle";
      studio.append(control);
    }
    control.dataset.childMenuAction = hidden ? "show" : "hide";
    control.textContent = hidden ? "▶" : "◀";
    control.setAttribute("aria-label", hidden ? "메뉴 열기" : "메뉴 접기");
    control.setAttribute("aria-expanded", String(!hidden));
    control.title = hidden ? "메뉴 열기" : "메뉴 접기";
  }

  function removeChildOnlyControls(studio) {
    studio.querySelectorAll('[data-action="toggle-lock"]').forEach(node => node.remove());
    studio.querySelector(".topbar")?.remove();
    studio.querySelector(".nav-title")?.remove();
  }

  function applyShell() {
    scheduled = false;
    const studio = document.querySelector(".studio");
    const sidebar = studio?.querySelector(".sidebar");
    if (!studio || !sidebar) return;

    removeChildOnlyControls(studio);
    buildBrand(sidebar);

    if (matchMedia("(max-width: 899px)").matches && !narrowModeWasApplied) {
      platformState.menuHidden = true;
      narrowModeWasApplied = true;
    }

    const hidden = platformState.menuHidden || platformState.locked;
    studio.classList.toggle("menu-hidden", hidden);
    studio.classList.toggle("platform-locked", platformState.locked);
    studio.classList.remove("mobile-menu-open");
    studio.dataset.platformLocked = String(platformState.locked);
    buildEdgeControl(studio, hidden);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyShell);
  }

  window.addEventListener("oncuvate:platform-control", event => {
    const detail = event.detail || {};
    if (typeof detail.menuHidden === "boolean") platformState.menuHidden = detail.menuHidden;
    if (typeof detail.locked === "boolean") platformState.locked = detail.locked;
    schedule();
  });

  document.addEventListener("click", event => {
    const control = event.target.closest("[data-child-menu-action]");
    if (!control) return;
    platformState.menuHidden = control.dataset.childMenuAction === "hide";
    schedule();
  }, true);

  window.ONQ_CHILD_SHELL = Object.freeze({
    setMenuHidden(value) { platformState.menuHidden = Boolean(value); schedule(); },
    setLocked(value) { platformState.locked = Boolean(value); schedule(); }
  });

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule, { once: true });
  else schedule();
})();
