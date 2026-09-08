(() => {
  "use strict";

  const page = document.querySelector('.page[data-page="1"]');
  const toolbar = document.getElementById("annotationToolbar");
  const canvas = document.getElementById("annotationCanvas");
  const toggle = document.getElementById("annotationToggle");
  const stateLabel = document.getElementById("annotationState");
  const toolButtons = [...document.querySelectorAll("[data-annotation-tool]")];
  const undoButton = document.getElementById("annotationUndo");
  const clearButton = document.getElementById("annotationClear");

  if (!page || !toolbar || !canvas || !toggle) return;

  const context = canvas.getContext("2d", { alpha: true });
  const activityId = "first-read-and-answer";
  let enabled = false;
  let selectedTool = "pen";
  let drawing = false;
  let currentStroke = null;
  let strokes = [];
  let cssWidth = 0;
  let cssHeight = 0;
  let pixelRatio = 1;
  let clearArmed = false;
  let clearTimer = null;

  const tools = {
    pen: { color: "#4b24a5", width: 3.5, alpha: .94, operation: "source-over" },
    highlighter: { color: "#f3d65c", width: 22, alpha: .32, operation: "source-over" },
    eraser: { color: "rgba(0,0,0,1)", width: 34, alpha: 1, operation: "destination-out" }
  };

  function logTool(itemId, value = "") {
    window.dispatchEvent(new CustomEvent("oncuvate:log", {
      detail: { type: "tap", target: "tool", activityId, itemId, value }
    }));
  }

  function setContextFor(stroke) {
    const style = tools[stroke.tool];
    context.globalCompositeOperation = style.operation;
    context.globalAlpha = style.alpha;
    context.strokeStyle = style.color;
    context.lineWidth = style.width;
    context.lineCap = "round";
    context.lineJoin = "round";
  }

  function drawStroke(stroke) {
    if (!stroke?.points?.length) return;
    setContextFor(stroke);
    context.beginPath();
    const first = stroke.points[0];
    context.moveTo(first.x, first.y);
    if (stroke.points.length === 1) context.lineTo(first.x + .15, first.y + .15);
    else stroke.points.slice(1).forEach(point => context.lineTo(point.x, point.y));
    context.stroke();
  }

  function redraw() {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    strokes.forEach(drawStroke);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
  }

  function resizeCanvas() {
    if (!page.classList.contains("active")) return;
    const nextWidth = Math.max(page.clientWidth, page.scrollWidth);
    const nextHeight = Math.max(page.clientHeight, page.scrollHeight);
    if (!nextWidth || !nextHeight) return;

    if (cssWidth && nextWidth !== cssWidth) {
      const scaleX = nextWidth / cssWidth;
      strokes.forEach(stroke => stroke.points.forEach(point => { point.x *= scaleX; }));
    }

    cssWidth = nextWidth;
    cssHeight = nextHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";
    canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
    canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    redraw();
  }

  function pointFrom(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(cssWidth, event.clientX - rect.left)),
      y: Math.max(0, Math.min(cssHeight, event.clientY - rect.top))
    };
  }

  function updateCommands() {
    undoButton.disabled = !enabled || strokes.length === 0;
    clearButton.disabled = !enabled || strokes.length === 0;
  }

  function setEnabled(next) {
    enabled = next;
    toolbar.classList.toggle("is-on", enabled);
    canvas.classList.toggle("drawing", enabled);
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.textContent = enabled ? "판서 끄기" : "판서 켜기";
    stateLabel.textContent = enabled ? "켜짐" : "꺼짐";
    toolButtons.forEach(button => { button.disabled = !enabled; });
    if (enabled) requestAnimationFrame(resizeCanvas);
    else drawing = false;
    updateCommands();
    logTool("annotation-toggle", enabled ? "on" : "off");
  }

  function selectTool(tool) {
    if (!tools[tool]) return;
    selectedTool = tool;
    toolButtons.forEach(button => {
      const active = button.dataset.annotationTool === tool;
      button.setAttribute("aria-pressed", String(active));
    });
    canvas.classList.toggle("tool-highlighter", tool === "highlighter");
    canvas.classList.toggle("tool-eraser", tool === "eraser");
    logTool("annotation-" + tool, "select");
  }

  function cancelClearArm() {
    clearTimeout(clearTimer);
    clearArmed = false;
    clearButton.classList.remove("clear-armed");
    clearButton.textContent = "전체 지우기";
  }

  toggle.addEventListener("click", () => setEnabled(!enabled));
  toolButtons.forEach(button => button.addEventListener("click", () => selectTool(button.dataset.annotationTool)));
  undoButton.addEventListener("click", () => {
    if (!strokes.length) return;
    strokes.pop();
    redraw();
    updateCommands();
    cancelClearArm();
    logTool("annotation-undo", "last-stroke");
  });
  clearButton.addEventListener("click", () => {
    if (!strokes.length) return;
    if (!clearArmed) {
      clearArmed = true;
      clearButton.classList.add("clear-armed");
      clearButton.textContent = "한 번 더";
      clearTimer = setTimeout(cancelClearArm, 3000);
      return;
    }
    strokes = [];
    redraw();
    updateCommands();
    cancelClearArm();
    logTool("annotation-clear", "all");
  });

  canvas.addEventListener("pointerdown", event => {
    if (!enabled || event.button > 0) return;
    event.preventDefault();
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    currentStroke = { tool: selectedTool, points: [pointFrom(event)] };
    strokes.push(currentStroke);
    drawStroke(currentStroke);
    updateCommands();
  });

  canvas.addEventListener("pointermove", event => {
    if (!drawing || !currentStroke) return;
    event.preventDefault();
    const samples = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
    samples.forEach(sample => {
      const point = pointFrom(sample);
      const previous = currentStroke.points[currentStroke.points.length - 1];
      currentStroke.points.push(point);
      setContextFor(currentStroke);
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    });
  });

  function endStroke(event) {
    if (!drawing) return;
    drawing = false;
    currentStroke = null;
    if (event && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);
  canvas.addEventListener("lostpointercapture", () => { drawing = false; currentStroke = null; });

  const pageObserver = new MutationObserver(() => {
    if (page.classList.contains("active")) requestAnimationFrame(resizeCanvas);
  });
  pageObserver.observe(page, { attributes: true, attributeFilter: ["class"], subtree: false });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(resizeCanvas));
    resizeObserver.observe(page);
  }
  window.addEventListener("resize", () => requestAnimationFrame(resizeCanvas));

  selectTool("pen");
  setEnabled(false);
})();
