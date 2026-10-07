(() => {
  "use strict";

  const notesByPage = new Map();
  let activeEditor = null;
  let composing = false;
  let scheduled = false;

  const pageKey = () => {
    const step = document.querySelector(".step-btn.active")?.dataset.step || "0";
    return `${document.body.dataset.session || "session"}:${step}`;
  };

  function clampElement(element, overlay) {
    requestAnimationFrame(() => {
      if (!element.isConnected || !overlay.isConnected) return;
      const maxLeft = Math.max(8, overlay.clientWidth - element.offsetWidth - 10);
      const maxTop = Math.max(8, overlay.clientHeight - element.offsetHeight - 10);
      element.style.left = `${Math.min(Math.max(8, element.offsetLeft), maxLeft)}px`;
      element.style.top = `${Math.min(Math.max(8, element.offsetTop), maxTop)}px`;
    });
  }

  function renderNotes(overlay) {
    if (!overlay) return;
    const key = pageKey();
    const notes = notesByPage.get(key) || [];
    const signature = `${key}:${JSON.stringify(notes)}`;
    if (overlay.dataset.notesSignature === signature) return;
    overlay.querySelectorAll(".annotation-text-note").forEach(note => note.remove());
    for (const { x, y, text } of notes) {
      const note = document.createElement("span");
      note.className = "annotation-text-note";
      note.textContent = text;
      note.style.left = `${x}%`;
      note.style.top = `${y}%`;
      overlay.append(note);
      clampElement(note, overlay);
    }
    overlay.dataset.notesSignature = signature;
  }

  function ensureOverlay() {
    const shell = document.querySelector(".activity-shell");
    if (!shell) return null;
    let overlay = shell.querySelector(":scope > .annotation-text-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "annotation-text-overlay";
      overlay.setAttribute("aria-live", "polite");
      shell.append(overlay);
    }
    renderNotes(overlay);
    return overlay;
  }

  const isTextToolActive = () => !!document.querySelector('[data-annotation-tool="text"].active');

  function finishEditor(commit) {
    if (!activeEditor) return;
    const { input, overlay, x, y, key } = activeEditor;
    const value = input.value.trim();
    activeEditor = null;
    composing = false;
    input.remove();
    if (commit && value) {
      const notes = notesByPage.get(key) || [];
      notes.push({ x, y, text: value });
      notesByPage.set(key, notes);
      overlay.dataset.notesSignature = "";
      renderNotes(overlay);
    }
  }

  function openEditor(event, canvas) {
    finishEditor(true);
    const overlay = ensureOverlay();
    if (!overlay) return;
    const bounds = overlay.getBoundingClientRect();
    const xPx = Math.min(Math.max(10, event.clientX - bounds.left), Math.max(10, bounds.width - 150));
    const yPx = Math.min(Math.max(10, event.clientY - bounds.top), Math.max(10, bounds.height - 50));
    const input = document.createElement("input");
    input.type = "text";
    input.className = "annotation-text-input";
    input.setAttribute("aria-label", "판서할 글 입력");
    input.setAttribute("inputmode", "text");
    input.setAttribute("enterkeyhint", "done");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocapitalize", "sentences");
    input.style.left = `${xPx}px`;
    input.style.top = `${yPx}px`;
    overlay.append(input);
    clampElement(input, overlay);
    activeEditor = {
      input,
      overlay,
      key: pageKey(),
      x: xPx / Math.max(1, bounds.width) * 100,
      y: yPx / Math.max(1, bounds.height) * 100
    };
    input.addEventListener("compositionstart", () => { composing = true; });
    input.addEventListener("compositionend", () => { composing = false; });
    input.addEventListener("keydown", keyEvent => {
      if (keyEvent.key === "Escape") {
        keyEvent.preventDefault();
        finishEditor(false);
      } else if (keyEvent.key === "Enter" && !composing && !keyEvent.isComposing) {
        keyEvent.preventDefault();
        finishEditor(true);
      }
    });
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
    canvas.releasePointerCapture?.(event.pointerId);
  }

  document.addEventListener("pointerdown", event => {
    const canvas = event.target.closest?.(".annotation-canvas.active");
    if (canvas && isTextToolActive()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openEditor(event, canvas);
      return;
    }
    if (activeEditor && event.target !== activeEditor.input) finishEditor(true);
  }, true);

  document.addEventListener("click", event => {
    if (!event.target.closest?.('[data-action="clear-annotation"]')) return;
    finishEditor(false);
    notesByPage.delete(pageKey());
    const overlay = ensureOverlay();
    if (overlay) {
      overlay.dataset.notesSignature = "";
      renderNotes(overlay);
    }
  }, true);

  function refresh() {
    scheduled = false;
    if (activeEditor && !activeEditor.input.isConnected) activeEditor = null;
    ensureOverlay();
  }

  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }).observe(document.getElementById("app"), { childList: true, subtree: true });

  refresh();
})();
