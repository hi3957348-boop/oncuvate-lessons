(() => {
  "use strict";
  const names={vocab:"어휘체크",game2:"점핑워드",game1:"문장 완성",sentence:"나누어 읽기",bingo:"낱말 빙고",nonword:"비단어 게임",paragraph:"전체 읽기",worksheet:"3단계 쓰기"};let scheduled=false;
  function polish(){scheduled=false;const modal=document.querySelector(".modal");if(!modal)return;const step=document.querySelector(".step-btn.active")?.dataset.stepId||"",heading=modal.querySelector("h2");if(heading&&names[step])heading.textContent=names[step];const confirm=modal.querySelector('.modal-actions [data-action="close-modal"]');if(confirm&&confirm.textContent!=="시작")confirm.textContent="시작"}
  new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(polish)}}).observe(document.body,{childList:true,subtree:true});polish();
  // 🔴 2026-09-30: 2단계를 점핑워드로 갈아 끼우면서 game2-* 조각을 **모두** 뺐다.
  //    특히 game2-progression-v14-board-hold-loader.js 는 v1.js 를 fetch로 끌어오는
  //    사슬의 첫 고리였다 — 파일만 지우면 404가 나므로 **부르는 줄을 지웠다**.
  //    점핑워드의 js·css는 회차 HTML이 직접 싣는다(fetch 사슬 없음).
  [["layout-final","release/layout-final.css",null],["sentence-step-layout-v2","release/sentence-step-layout-v2.css",null],["long-reading-guide-v2","release/long-reading-guide-v2.css",null],["ui-refinement-v25","release/ui-refinement-v24.css","release/ui-refinement-v25.js"]].forEach(([key,css,js])=>{if(css&&!document.querySelector(`link[data-module="${key}"]`)){const link=document.createElement("link");link.rel="stylesheet";link.href=css;link.dataset.module=key;document.head.append(link)}if(js&&!document.querySelector(`script[data-module="${key}"]`)){const script=document.createElement("script");script.src=js;script.dataset.module=key;document.body.append(script)}})
})();
