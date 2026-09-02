(() => {
  "use strict";

  const href = "release/step5-settings-outside-v24.css?rev=20260822b";
  if (!document.querySelector('link[data-module="step5-settings-outside-v24"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.module = "step5-settings-outside-v24";
    document.head.append(link);
  }

  let scheduled = false;
  function enhance() {
    scheduled = false;
    const root = document.querySelector(".ws-step5");
    const button = root?.querySelector(".ws-settings-button");
    if (!root || !button) return;
    root.dataset.wsSettingsOutside = "true";
    button.setAttribute("aria-label", "활동 설정");
    button.setAttribute("title", "활동 설정");
    // 이 버튼 하나를 예닐곱 파일이 칠하고, 공용 컨트롤 규칙이 `!important`로 테두리를 두른다.
    // 덮어쓰기로는 끝이 안 났다(고칠 때마다 다른 파일이 다시 그렸다).
    // ⇒ **원래 버튼은 숨기고, 옆에 새 버튼을 세운다.** 새 이름(onq-gear)은 어떤
    //    스타일시트도 겨냥하지 않으므로 선이 되살아날 길이 없다. 누르면 원래 버튼을
    //    대신 눌러 주므로 열리는 동작은 그대로다.
    if (button.dataset.onqGear !== "true") {
      button.dataset.onqGear = "true";
      button.style.setProperty("display", "none", "important");

      const gear = document.createElement("button");
      gear.type = "button";
      gear.className = "onq-gear";
      gear.setAttribute("aria-label", "활동 설정");
      gear.setAttribute("title", "활동 설정");
      gear.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" width="26" height="26" aria-hidden="true"><path d="M 9.89 1.61 L 14.11 1.61 L 13.53 4.15 L 16.47 5.37 L 17.85 3.16 L 20.84 6.15 L 18.63 7.53 L 19.85 10.47 L 22.39 9.89 L 22.39 14.11 L 19.85 13.53 L 18.63 16.47 L 20.84 17.85 L 17.85 20.84 L 16.47 18.63 L 13.53 19.85 L 14.11 22.39 L 9.89 22.39 L 10.47 19.85 L 7.53 18.63 L 6.15 20.84 L 3.16 17.85 L 5.37 16.47 L 4.15 13.53 L 1.61 14.11 L 1.61 9.89 L 4.15 10.47 L 5.37 7.53 L 3.16 6.15 L 6.15 3.16 L 7.53 5.37 L 10.47 4.15 Z"/><circle cx="12" cy="12" r="4.15"/></svg>';
      gear.style.cssText = "display:grid;place-items:center;width:38px;height:38px;padding:0;"
        + "border:0;background:none;box-shadow:none;border-radius:0;color:#5c6470;cursor:pointer;";
      gear.addEventListener("click", (event) => { event.preventDefault(); button.click(); });
      button.insertAdjacentElement("afterend", gear);
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  }
  new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  schedule();
})();
