(function () {
  "use strict";

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function setModeButton(button, icon, label) {
    if (!button) return;
    button.innerHTML =
      '<span class="oc-nav-icon ' + icon + '" aria-hidden="true"></span>' +
      '<span class="oc-nav-label">' + label + "</span>";
  }

  function initStudio() {
    if (document.getElementById("ocStudioShell")) return;

    var wrap = document.querySelector(".wrap");
    var originalHeader = wrap && wrap.querySelector(":scope > header");
    var modebar = wrap && wrap.querySelector(":scope > .modebar");
    var readingMode = document.getElementById("readingMode");
    var gameMode = document.getElementById("gameMode");
    var testMode = document.getElementById("testMode");
    var toolbar = readingMode && readingMode.querySelector(":scope > .toolbar");
    var indexButtons = wrap && wrap.querySelector(".oc-indexbtn");

    if (!wrap || !originalHeader || !modebar || !readingMode || !gameMode || !testMode) {
      return;
    }

    document.body.classList.add("oc-studio-page");

    var originalTitle = originalHeader.querySelector("h1");
    var originalSub = originalHeader.querySelector(".sub");
    var originalLogo = originalHeader.querySelector("img");
    var titleText = originalTitle ? originalTitle.textContent.trim() : "어떤 병원으로 가야 할까?";
    var subText = originalSub ? originalSub.textContent.trim() : "읽기 유창성 학습";
    var logoSource = originalLogo && originalLogo.src ? originalLogo.src : "/oncuvate-brand-logo.png";

    var shell = el("div", "oc-studio-shell");
    shell.id = "ocStudioShell";

    var nav = el("aside", "oc-studio-nav");
    nav.setAttribute("aria-label", "학습 메뉴");

    var brand = el(
      "div",
      "oc-brand",
      '<img class="oc-brand-logo" src="' + logoSource + '" alt="Oncuvate">' +
        '<span class="oc-brand-kicker">READING STUDIO</span>' +
        '<strong class="oc-book-name"></strong>'
    );
    brand.querySelector(".oc-book-name").textContent = titleText;
    nav.appendChild(brand);
    nav.appendChild(modebar);

    setModeButton(document.getElementById("mReading"), "book", "읽기");
    setModeButton(document.getElementById("mGame"), "game", "게임");
    setModeButton(document.getElementById("mTest"), "mic", "유창성 확인");

    var toolHeading = el(
      "div",
      "oc-tool-heading",
      '<span>READING TOOLS</span><button class="oc-tool-toggle" type="button" aria-expanded="true" aria-label="읽기 도구 접기">−</button>'
    );
    nav.appendChild(toolHeading);

    var toolScroll = el("div", "oc-tools-scroll");
    if (toolbar) toolScroll.appendChild(toolbar);
    nav.appendChild(toolScroll);

    var main = el("main", "oc-studio-main");
    var topbar = el(
      "header",
      "oc-studio-topbar",
      '<div class="oc-studio-title">' +
        '<span class="eyebrow">ONCUVATE READING LAB</span>' +
        "<h1></h1><p></p>" +
      "</div>" +
      '<div class="oc-top-actions">' +
        '<span class="oc-ai-chip"><i class="oc-ai-dot"></i>AI 발음·유창성 분석</span>' +
        '<span class="oc-focus-chip">집중 읽기</span>' +
      "</div>"
    );
    topbar.querySelector("h1").textContent = titleText;
    topbar.querySelector("p").textContent = subText;

    var content = el("div", "oc-studio-content");
    content.id = "ocStudioContent";
    content.appendChild(readingMode);
    content.appendChild(gameMode);
    content.appendChild(testMode);
    if (indexButtons) content.appendChild(indexButtons);
    main.appendChild(topbar);
    main.appendChild(content);

    var board = el(
      "aside",
      "oc-mini-board",
      '<button class="oc-board-resizer" type="button" aria-label="칠판 폭 조절" title="좌우로 끌어 칠판 폭 조절"></button>' +
      '<div class="oc-board-top">' +
        '<div class="oc-board-title">' +
          '<span class="oc-board-mark" aria-hidden="true"></span>' +
          '<span class="oc-board-label"><strong>나의 미니칠판</strong><span>읽으며 떠오른 생각</span></span>' +
        "</div>" +
        '<button class="oc-board-toggle" type="button" aria-label="미니칠판 접기" title="미니칠판 접기">›</button>' +
      "</div>" +
      '<div class="oc-board-canvas-wrap"><canvas id="ocBoardCanvas" aria-label="자유롭게 필기하는 미니칠판"></canvas></div>' +
      '<div class="oc-board-tools">' +
        '<div class="oc-board-toolset">' +
          '<button class="oc-board-tool is-active" type="button" data-board-mode="pen">펜</button>' +
          '<button class="oc-board-tool" type="button" data-board-mode="eraser">지우개</button>' +
        "</div>" +
        '<div class="oc-board-toolset" aria-label="펜 색상">' +
          '<button class="oc-board-color is-active" type="button" data-board-color="#ffffff" style="--swatch:#ffffff" aria-label="흰색"></button>' +
          '<button class="oc-board-color" type="button" data-board-color="#65d7e6" style="--swatch:#65d7e6" aria-label="청록색"></button>' +
          '<button class="oc-board-color" type="button" data-board-color="#c9a9ff" style="--swatch:#c9a9ff" aria-label="연보라색"></button>' +
        "</div>" +
        '<button class="oc-board-clear" type="button">전체삭제</button>' +
      "</div>"
    );

    originalHeader.remove();
    wrap.appendChild(shell);
    shell.appendChild(nav);
    shell.appendChild(main);
    shell.appendChild(board);

    toolHeading.querySelector(".oc-tool-toggle").addEventListener("click", function () {
      var isClosed = toolScroll.classList.toggle("is-closed");
      this.textContent = isClosed ? "+" : "−";
      this.setAttribute("aria-expanded", String(!isClosed));
      this.setAttribute("aria-label", isClosed ? "읽기 도구 펼치기" : "읽기 도구 접기");
    });

    Array.prototype.forEach.call(modebar.querySelectorAll("button"), function (button) {
      button.addEventListener("click", function () {
        content.scrollTop = 0;
        var label = button.querySelector(".oc-nav-label");
        var modeName = label ? label.textContent : "학습";
        topbar.querySelector(".oc-focus-chip").textContent =
          modeName === "유창성 확인" ? "발음 · 속도 · 끊어읽기" : modeName;
      });
    });

    initBoard(shell, board);
  }

  function initBoard(shell, board) {
    var canvas = board.querySelector("#ocBoardCanvas");
    var context = canvas.getContext("2d");
    var toggle = board.querySelector(".oc-board-toggle");
    var clear = board.querySelector(".oc-board-clear");
    var resizer = board.querySelector(".oc-board-resizer");
    var modeButtons = board.querySelectorAll("[data-board-mode]");
    var colorButtons = board.querySelectorAll("[data-board-color]");
    var mode = "pen";
    var color = "#ffffff";
    var drawing = false;
    var lastPoint = null;

    function resizeCanvas() {
      var bounds = canvas.getBoundingClientRect();
      if (bounds.width < 2 || bounds.height < 2) return;
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var snapshot = null;
      if (canvas.width && canvas.height) {
        snapshot = document.createElement("canvas");
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;
        snapshot.getContext("2d").drawImage(canvas, 0, 0);
      }
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      if (snapshot) {
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, canvas.width, canvas.height);
        context.restore();
      }
    }

    function pointFromEvent(event) {
      var bounds = canvas.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }

    function start(event) {
      drawing = true;
      lastPoint = pointFromEvent(event);
      canvas.setPointerCapture(event.pointerId);
    }

    function draw(event) {
      if (!drawing || !lastPoint) return;
      var point = pointFromEvent(event);
      context.save();
      context.globalCompositeOperation = mode === "eraser" ? "destination-out" : "source-over";
      context.strokeStyle = color;
      context.lineWidth = mode === "eraser" ? 18 : 3.2;
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(point.x, point.y);
      context.stroke();
      context.restore();
      lastPoint = point;
    }

    function stop(event) {
      drawing = false;
      lastPoint = null;
      if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    }

    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
    canvas.addEventListener("pointerleave", function (event) {
      if (event.buttons === 0) stop(event);
    });

    Array.prototype.forEach.call(modeButtons, function (button) {
      button.addEventListener("click", function () {
        mode = button.getAttribute("data-board-mode");
        Array.prototype.forEach.call(modeButtons, function (item) {
          item.classList.toggle("is-active", item === button);
        });
      });
    });

    Array.prototype.forEach.call(colorButtons, function (button) {
      button.addEventListener("click", function () {
        color = button.getAttribute("data-board-color");
        mode = "pen";
        Array.prototype.forEach.call(colorButtons, function (item) {
          item.classList.toggle("is-active", item === button);
        });
        Array.prototype.forEach.call(modeButtons, function (item) {
          item.classList.toggle("is-active", item.getAttribute("data-board-mode") === "pen");
        });
      });
    });

    clear.addEventListener("click", function () {
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    var resizing = false;
    var resizeStartX = 0;
    var resizeStartWidth = 0;

    function setBoardWidth(width, persist) {
      var available = Math.max(220, shell.clientWidth - 560);
      var nextWidth = Math.max(220, Math.min(520, available, Math.round(width)));
      shell.style.setProperty("--oc-board-width", nextWidth + "px");
      if (persist) {
        try {
          localStorage.setItem("oncuvate-board-width", String(nextWidth));
        } catch (_) {}
      }
      window.requestAnimationFrame(resizeCanvas);
    }

    if (resizer) {
      resizer.addEventListener("pointerdown", function (event) {
        if (window.innerWidth <= 760 || shell.classList.contains("board-collapsed")) return;
        resizing = true;
        resizeStartX = event.clientX;
        resizeStartWidth = board.getBoundingClientRect().width;
        resizer.setPointerCapture(event.pointerId);
        shell.classList.add("board-resizing");
      });
      resizer.addEventListener("pointermove", function (event) {
        if (!resizing) return;
        setBoardWidth(resizeStartWidth + (resizeStartX - event.clientX), false);
      });
      function finishResize(event) {
        if (!resizing) return;
        resizing = false;
        shell.classList.remove("board-resizing");
        if (event.pointerId !== undefined && resizer.hasPointerCapture(event.pointerId)) {
          resizer.releasePointerCapture(event.pointerId);
        }
        setBoardWidth(board.getBoundingClientRect().width, true);
      }
      resizer.addEventListener("pointerup", finishResize);
      resizer.addEventListener("pointercancel", finishResize);
      resizer.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        var delta = event.key === "ArrowLeft" ? 20 : -20;
        setBoardWidth(board.getBoundingClientRect().width + delta, true);
      });
    }

    toggle.addEventListener("click", function () {
      var collapsed = shell.classList.toggle("board-collapsed");
      toggle.setAttribute("aria-label", collapsed ? "미니칠판 펼치기" : "미니칠판 접기");
      toggle.setAttribute("title", collapsed ? "미니칠판 펼치기" : "미니칠판 접기");
      try {
        localStorage.setItem("oncuvate-board-collapsed", collapsed ? "1" : "0");
      } catch (_) {}
      window.setTimeout(resizeCanvas, 320);
    });

    try {
      var savedBoardWidth = Number(localStorage.getItem("oncuvate-board-width"));
      if (savedBoardWidth) setBoardWidth(savedBoardWidth, false);
      if (localStorage.getItem("oncuvate-board-collapsed") === "1") {
        shell.classList.add("board-collapsed");
        toggle.setAttribute("aria-label", "미니칠판 펼치기");
        toggle.setAttribute("title", "미니칠판 펼치기");
      }
    } catch (_) {}

    if (window.ResizeObserver) {
      new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }
    window.requestAnimationFrame(resizeCanvas);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStudio);
  } else {
    initStudio();
  }
})();
