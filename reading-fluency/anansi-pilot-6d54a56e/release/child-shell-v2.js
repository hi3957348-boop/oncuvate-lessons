(() => {
  "use strict";
  const platformState = { menuHidden:false, locked:false };
  let scheduled = false;
  function applyShell() {
    scheduled = false;
    const studio = document.querySelector(".studio");
    const sidebar = studio?.querySelector(".sidebar");
    if (!studio || !sidebar) return;
    studio.querySelector(".topbar")?.remove();
    sidebar.querySelector(".nav-title")?.remove();
    if (!sidebar.querySelector(".sidebar-brand")) {
      const brand=document.createElement("div"); brand.className="sidebar-brand";
      brand.innerHTML='<img src="assets/brand/oncuvate-brand-logo.png" alt="Oncuvate">'; sidebar.prepend(brand);
    }
    if (!sidebar.querySelector(".sidebar-menu-toggle")) {
      const hide=document.createElement("button"); hide.type="button"; hide.className="sidebar-menu-toggle";
      hide.dataset.childMenuAction="hide"; hide.textContent="메뉴 숨기기"; sidebar.append(hide);
    }
    if (!studio.querySelector(".menu-reopen")) {
      const show=document.createElement("button"); show.type="button"; show.className="menu-reopen";
      show.dataset.childMenuAction="show"; show.textContent="메뉴 열기"; studio.append(show);
    }
    const hidden=platformState.menuHidden||platformState.locked;
    studio.classList.toggle("menu-hidden",hidden); studio.classList.remove("mobile-menu-open");
    studio.dataset.platformLocked=String(platformState.locked);
  }
  function schedule(){ if(scheduled)return; scheduled=true; requestAnimationFrame(applyShell); }
  window.addEventListener("oncuvate:platform-control",event=>{
    const detail=event.detail||{};
    if(typeof detail.menuHidden==="boolean") platformState.menuHidden=detail.menuHidden;
    if(typeof detail.locked==="boolean") platformState.locked=detail.locked;
    schedule();
  });
  document.addEventListener("click",event=>{
    const control=event.target.closest("[data-child-menu-action]"); if(!control)return;
    platformState.menuHidden=control.dataset.childMenuAction==="hide"; schedule();
  },true);
  window.ONQ_CHILD_SHELL=Object.freeze({
    setMenuHidden(value){platformState.menuHidden=Boolean(value);schedule();},
    setLocked(value){platformState.locked=Boolean(value);schedule();}
  });
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();
