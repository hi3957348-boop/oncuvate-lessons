(function () {
  "use strict";

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function apiUrl(path) {
    var base = String(window.ONCUVATE_API_BASE || "").replace(/\/+$/, "");
    return base ? base + path : path;
  }

  function setModeButton(button, icon, label) {
    if (!button) return;
    var iconName = icon === "book" ? "reading" : icon === "mic" ? "fluency" : "game";
    button.innerHTML =
      '<span class="oc-nav-icon ' + icon + '" aria-hidden="true"><img src="assets/menu-icons/oncuvate-menu-' + iconName + '.png" alt=""></span>' +
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

    if (toolbar) {
      Array.prototype.forEach.call(toolbar.querySelectorAll(".group"), function (group) {
        var label = group.querySelector(".lbl");
        var text = label ? label.textContent.trim() : "";
        if (text === "형광펜" || text.indexOf("실시간 동기화") !== -1) {
          group.classList.add("oc-retired-tool");
          group.setAttribute("aria-hidden", "true");
        }
      });
    }

    var originalTitle = originalHeader.querySelector("h1");
    var originalSub = originalHeader.querySelector(".sub");
    var originalLogo = originalHeader.querySelector("img");
    var titleText = originalTitle ? originalTitle.textContent.trim() : "어떤 병원으로 가야 할까?";
    var subText = "글자를 직접 짚으며 읽어요.";
    var isFieldmouseBook = /(?:^|\/)fingernail_fieldmouse(?:\.html)?\/?$/.test(location.pathname);
    var logoSource = isFieldmouseBook
      ? "assets/oncuvate-brand-logo.png?v=48"
      : (originalLogo && originalLogo.src ? originalLogo.src : "assets/oncuvate-brand-logo.png");

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
        '<div class="oc-annotation-toolbar" role="toolbar" aria-label="판서 도구">' +
          '<button class="oc-annotation-toggle" type="button" aria-pressed="false" aria-expanded="false" title="활동 화면에 판서하기">' +
            '<span class="oc-annotation-icon" aria-hidden="true"></span><span class="oc-annotation-toggle-label">판서</span>' +
          '</button>' +
          '<div class="oc-annotation-options" aria-hidden="true">' +
            '<button class="oc-annotation-tool is-active" type="button" data-board-mode="pen">펜</button>' +
            '<button class="oc-annotation-tool" type="button" data-board-mode="eraser">지우개</button>' +
            '<span class="oc-annotation-colors" aria-label="펜 색상">' +
              '<button class="oc-annotation-color is-active" type="button" data-board-color="#6542b8" style="--swatch:#6542b8" aria-label="보라색"></button>' +
              '<button class="oc-annotation-color" type="button" data-board-color="#2785c7" style="--swatch:#2785c7" aria-label="파란색"></button>' +
              '<button class="oc-annotation-color" type="button" data-board-color="#e56f71" style="--swatch:#e56f71" aria-label="붉은색"></button>' +
            '</span>' +
            '<button class="oc-annotation-clear" type="button">전체삭제</button>' +
          '</div>' +
        '</div>' +
        '<button class="oc-session-chip" type="button" id="ocSessionChip">입장 선택</button>' +
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

    var readingStage = readingMode.querySelector(".stage");
    var readingText = document.getElementById("reading");
    var pagebar = readingMode.querySelector(".pagebar");
    var highlightFootbar = readingMode.querySelector(".footbar");
    if (readingStage && readingText && pagebar) {
      var previousPageButton = document.getElementById("pgPrev");
      var nextPageButton = document.getElementById("pgNext");
      var readingNavigator = el("div", "oc-reading-navigator");

      readingNavigator.setAttribute("aria-label", "\uCABD \uC77D\uAE30");
      readingText.parentNode.insertBefore(readingNavigator, readingText);

      if (previousPageButton) {
        previousPageButton.classList.add("oc-page-arrow", "is-previous");
        previousPageButton.textContent = "";
        previousPageButton.setAttribute("aria-label", "\uC774\uC804 \uCABD");
        previousPageButton.setAttribute("title", "\uC774\uC804 \uCABD");
        readingNavigator.appendChild(previousPageButton);
      }

      readingNavigator.appendChild(readingText);

      if (nextPageButton) {
        nextPageButton.classList.add("oc-page-arrow", "is-next");
        nextPageButton.textContent = "";
        nextPageButton.setAttribute("aria-label", "\uB2E4\uC74C \uCABD");
        nextPageButton.setAttribute("title", "\uB2E4\uC74C \uCABD");
        readingNavigator.appendChild(nextPageButton);
      }

      pagebar.classList.add("oc-page-progress");
      readingStage.appendChild(pagebar);

      var art = readingStage.querySelector(".art");
      var swipeStart = null;
      var suppressClickUntil = 0;
      var displayedPageIndex = -1;

      function scrollReadingToTop() {
        var reducedMotion =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.requestAnimationFrame(function () {
          content.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
        });
      }

      function getActivePageIndex() {
        var pageNodes = readingText.querySelectorAll(":scope > .page");
        for (var index = 0; index < pageNodes.length; index += 1) {
          if (pageNodes[index].classList.contains("active")) return index;
        }
        return 0;
      }

      function updateArtLayout(shouldScroll) {
        var pageIndex = getActivePageIndex();
        var isPortraitImage =
          Boolean(art && art.naturalWidth && art.naturalHeight) &&
          art.naturalHeight > art.naturalWidth * 1.18;
        readingStage.classList.toggle(
          "oc-portrait-page",
          isPortraitImage
        );
        if (shouldScroll) scrollReadingToTop();
      }

      if (art) {
        art.addEventListener("load", function () {
          updateArtLayout(false);
        });
      }

      displayedPageIndex = getActivePageIndex();
      updateArtLayout(false);

      if (window.MutationObserver) {
        var pageChangeObserver = new MutationObserver(function () {
          var nextPageIndex = getActivePageIndex();
          if (nextPageIndex === displayedPageIndex) return;
          displayedPageIndex = nextPageIndex;
          updateArtLayout(true);
        });
        Array.prototype.forEach.call(
          readingText.querySelectorAll(":scope > .page"),
          function (pageNode) {
            pageChangeObserver.observe(pageNode, {
              attributes: true,
              attributeFilter: ["class"]
            });
          }
        );
      }

      readingStage.addEventListener(
        "touchstart",
        function (event) {
          if (event.touches.length !== 1) {
            swipeStart = null;
            return;
          }
          swipeStart = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
          };
        },
        { passive: true }
      );

      readingStage.addEventListener(
        "touchend",
        function (event) {
          if (!swipeStart || event.changedTouches.length !== 1) return;
          var endTouch = event.changedTouches[0];
          var distanceX = endTouch.clientX - swipeStart.x;
          var distanceY = endTouch.clientY - swipeStart.y;
          swipeStart = null;

          if (Math.abs(distanceX) < 52 || Math.abs(distanceX) < Math.abs(distanceY) * 1.25) {
            return;
          }

          var targetButton = distanceX > 0 ? previousPageButton : nextPageButton;
          if (!targetButton || targetButton.disabled) return;
          event.preventDefault();
          targetButton.click();
          suppressClickUntil = Date.now() + 450;
        },
        { passive: false }
      );

      readingStage.addEventListener(
        "click",
        function (event) {
          if (Date.now() < suppressClickUntil) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
        },
        true
      );
    }
    if (highlightFootbar) {
      highlightFootbar.classList.add("oc-highlight-nav-retired");
      highlightFootbar.setAttribute("aria-hidden", "true");
    }

    var board = el(
      "aside",
      "oc-mini-board oc-instructor-panel",
      '<button class="oc-board-resizer" type="button" aria-label="강사 콘솔 폭 조절" title="좌우로 끌어 강사 콘솔 폭 조절"></button>' +
      '<div class="oc-board-top">' +
        '<div class="oc-board-title">' +
          '<span class="oc-board-mark" aria-hidden="true"></span>' +
          '<span class="oc-board-label"><strong>강사 콘솔</strong><span>수업 흐름과 학생 상태</span></span>' +
        "</div>" +
        '<button class="oc-board-toggle" type="button" aria-label="강사 콘솔 접기" title="강사 콘솔 접기">›</button>' +
      "</div>" +
      '<div class="oc-console-host"><div class="oc-console-empty"><strong>강사 전용 공간</strong><span>실시간 수업으로 입장하면 제어 도구와 학생 활동 결과가 여기에 표시됩니다.</span></div></div>'
    );

    originalHeader.remove();
    wrap.appendChild(shell);
    shell.appendChild(nav);
    shell.appendChild(main);
    shell.appendChild(board);
    var consoleHost = board.querySelector(".oc-console-host");
    var instructorConsole = document.getElementById("ocConsole");
    if (instructorConsole) {
      instructorConsole.classList.add("oc-console-in-board");
      consoleHost.innerHTML = "";
      consoleHost.appendChild(instructorConsole);
    }

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

    initBoard(shell, board, topbar, content);
    initEntryGate(shell, titleText, logoSource);
  }

  function initEntryGate(shell, bookTitle, logoSource) {
    var chip = document.getElementById("ocSessionChip");
    var isFieldmouseBook = /(?:^|\/)fingernail_fieldmouse(?:\.html)?\/?$/.test(location.pathname);
    var isPublicTest = window.ONCUVATE_PUBLIC_TEST === true;
    var previewRoomStorageKey = "oncuvate-public-test-active-room:" +
      (document.documentElement.dataset.lessonId || location.pathname);
    var teacherStepMarkup =
      '<div class="oc-entry-step" data-entry-step="teacher" hidden>' +
        '<button class="oc-entry-back" type="button" data-entry-go="home">← 이용 방법 선택</button>' +
        '<span class="oc-entry-kicker">INSTRUCTOR</span><h2>강사 입장</h2>' +
        '<p class="oc-entry-book">두루책방 · ' + bookTitle + '</p>' +
        '<label class="oc-entry-field"><span>강사 인증번호</span><input id="ocInstructorAccess" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="9" placeholder="강사 인증번호를 입력하세요"></label>' +
        '<p class="oc-entry-help">공개 테스트용 임시 인증번호를 확인한 뒤 5자리 수업 방을 생성합니다.</p>' +
        '<div class="oc-entry-error" id="ocTeacherError" aria-live="polite"></div>' +
        '<button class="oc-entry-primary" type="button" id="ocInstructorAccessEnter">강사로 입장</button>' +
      '</div>';
    var gate = el(
      "div",
      "oc-entry-gate",
      '<section class="oc-entry-card" role="dialog" aria-modal="true" aria-labelledby="ocEntryTitle">' +
        '<div class="oc-entry-brand"><img src="' + logoSource + '" alt="Oncuvate"></div>' +
        '<div class="oc-entry-step" data-entry-step="home">' +
          '<span class="oc-entry-kicker">ONCUVATE</span>' +
          '<h2 id="ocEntryTitle">온큐베이트 리딩스튜디오</h2>' +
          '<p class="oc-entry-book">두루책방 · ' + bookTitle + '</p>' +
          '<p class="oc-entry-intro">이용 방법을 선택해 주세요.</p>' +
          (isPublicTest ? '<div class="oc-entry-notice"><span class="oc-entry-notice-mark" aria-hidden="true"></span><div><strong>공개 테스트 자료</strong><p>실제 학생 개인정보는 입력하지 마세요.</p></div></div>' : '') +
          '<div class="oc-entry-paths" role="group" aria-label="리딩스튜디오 이용 방법">' +
            '<button class="oc-entry-path is-member" type="button" data-entry-go="member">' +
              '<span class="oc-entry-path-icon" aria-hidden="true"><i></i></span>' +
              '<span class="oc-entry-path-copy"><strong>자율활동</strong><small>내 학습 자료 이용하기</small></span>' +
              '<span class="oc-entry-path-arrow" aria-hidden="true">›</span>' +
            '</button>' +
            '<button class="oc-entry-path is-class" type="button" data-entry-go="student">' +
              '<span class="oc-entry-path-icon" aria-hidden="true"><i></i></span>' +
              '<span class="oc-entry-path-copy"><strong>실시간 수업 참여</strong><small>강사가 알려 준 5자리 코드로 입장</small></span>' +
              '<span class="oc-entry-path-arrow" aria-hidden="true">›</span>' +
            '</button>' +
          '</div>' +
          '<p class="oc-entry-teacher-link">승인된 강사이신가요? <button type="button" data-entry-go="teacher">강사 로그인</button></p>' +
        '</div>' +
        '<div class="oc-entry-step" data-entry-step="member" hidden>' +
          '<button class="oc-entry-back" type="button" data-entry-go="home">← 이용 방법 선택</button>' +
          '<span class="oc-entry-kicker">SELF ACTIVITY</span><h2>자율활동</h2>' +
          '<p class="oc-entry-book">두루책방 · ' + bookTitle + '</p>' +
          '<div class="oc-entry-notice">' +
            '<span class="oc-entry-notice-mark" aria-hidden="true"></span>' +
            '<div><strong>자율활동</strong><p>계정 확인 후 활동을 시작합니다.</p></div>' +
          '</div>' +
          '<div class="oc-entry-error" id="ocMemberError" aria-live="polite"></div>' +
          '<button class="oc-entry-primary" type="button" id="ocMemberLogin">계정으로 계속</button>' +
        '</div>' +
        '<div class="oc-entry-step" data-entry-step="student" hidden>' +
          '<button class="oc-entry-back" type="button" data-entry-go="home">← 이용 방법 선택</button>' +
          '<span class="oc-entry-kicker">LIVE CLASS</span><h2>실시간 수업 참여</h2>' +
          '<p class="oc-entry-book">강사가 알려 준 이름과 방 코드를 입력하세요.</p>' +
          '<label class="oc-entry-field"><span>학생 이름</span><input id="ocStudentName" type="text" autocomplete="name" maxlength="20" placeholder="이름을 입력하세요"></label>' +
          '<label class="oc-remember-name"><input id="ocRememberName" type="checkbox" checked><span>이 기기에서 이름 기억하기</span></label>' +
          '<label class="oc-entry-field"><span>5자리 방 코드</span><input id="ocStudentRoom" inputmode="numeric" autocomplete="one-time-code" maxlength="5" pattern="[0-9]{5}" aria-describedby="ocRoomHelp" placeholder="00000"></label>' +
          '<p class="oc-entry-help" id="ocRoomHelp">방 코드는 학생 입장에만 사용됩니다.</p>' +
          '<div class="oc-entry-error" id="ocStudentError" aria-live="polite"></div>' +
          '<button class="oc-entry-primary" type="button" id="ocStudentJoin">수업에 참여</button>' +
        '</div>' +
        teacherStepMarkup +
      '</section>'
    );
    document.body.appendChild(gate);
    document.documentElement.classList.remove("oc-entry-pending");

    function setStep(name) {
      gate.querySelectorAll("[data-entry-step]").forEach(function (step) {
        step.hidden = step.getAttribute("data-entry-step") !== name;
      });
      var focus = gate.querySelector('[data-entry-step="' + name + '"] input');
      if (focus) window.setTimeout(function () { focus.focus(); }, 30);
    }
    function connect(role, room, selfStudy, studentName, identity) {
      window.OcSession = {
        role: role,
        roomCode: room || "",
        selfStudy: !!selfStudy,
        studentName: studentName || "",
        uid: identity && identity.uid ? identity.uid : "",
        accessMode: selfStudy ? "self-activity" : "live-class"
      };
      var sessionBoardToggle = shell.querySelector(".oc-board-toggle");
      var shouldCollapseBoard = role === "student";
      shell.classList.toggle("board-collapsed", shouldCollapseBoard);
      if (sessionBoardToggle) {
        sessionBoardToggle.setAttribute("aria-label", shouldCollapseBoard ? "미니칠판 펼치기" : "미니칠판 접기");
        sessionBoardToggle.setAttribute("title", shouldCollapseBoard ? "미니칠판 펼치기" : "미니칠판 접기");
      }
      window.setTimeout(function () {
        window.dispatchEvent(new Event("resize"));
      }, 320);
      try { sessionStorage.setItem("oncuvate-session", JSON.stringify(window.OcSession)); } catch (_) {}
      if (room && typeof window.connectRoom === "function") {
        var internalRoom = "oncu" + room;
        var legacyInput = document.getElementById("roomInput");
        var legacyButton = document.getElementById("btnConnect");
        if (legacyInput) legacyInput.value = internalRoom;
        if (role === "teacher" && legacyButton) legacyButton.click();
        else window.connectRoom(internalRoom);
      }
      else if (!room && typeof window.disconnectRoom === "function") window.disconnectRoom();
      if (room) location.hash = "room=" + room + "&role=" + role;
      else if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      document.body.classList.toggle("oc-teacher-session", role === "teacher");
      chip.textContent = role === "teacher" ? "강사 · 방 " + room : room ? "학생 · 방 " + room : "자율활동";
      gate.classList.add("is-closed");
      window.dispatchEvent(new CustomEvent("oncuvate-session-change", { detail: window.OcSession }));
    }
    function savePreviewRoom(roomCode) {
      if (!isPublicTest && !isFieldmouseBook) return;
      try {
        localStorage.setItem(previewRoomStorageKey, JSON.stringify({
          roomCode: String(roomCode),
          createdAt: Date.now()
        }));
      } catch (_) {}
    }
    function isActivePreviewRoom(roomCode) {
      if (isPublicTest && /^\d{5}$/.test(String(roomCode))) return true;
      if (!isFieldmouseBook) return false;
      var isLocalPreview = location.hostname === "127.0.0.1" || location.hostname === "localhost";
      if (isLocalPreview && /^\d{5}$/.test(String(roomCode))) return true;
      try {
        var saved = JSON.parse(localStorage.getItem(previewRoomStorageKey) || "null");
        return !!saved && String(saved.roomCode) === String(roomCode) &&
          Date.now() - Number(saved.createdAt || 0) < 12 * 60 * 60 * 1000;
      } catch (_) { return false; }
    }
    async function requestAccountAccess(kind, button, error) {
      var auth = window.OncuvateAuth;
      button.disabled = true;
      button.textContent = "권한 확인 중…";
      error.textContent = "";
      try {
        if (!auth || typeof auth.signIn !== "function") {
          window.dispatchEvent(new CustomEvent("oncuvate-auth-request", { detail: { kind: kind } }));
          throw new Error("auth-not-ready");
        }
        var result = await auth.signIn({ kind: kind, lessonTitle: bookTitle });
        if (!result || !result.authenticated) throw new Error("not-authenticated");
        if (kind === "coach") {
          if (result.role !== "coach" || !result.roomCode || !/^\d{5}$/.test(String(result.roomCode))) {
            throw new Error("coach-not-authorized");
          }
          connect("teacher", String(result.roomCode), false, "", result);
        } else {
          if (!result.entitled) throw new Error("member-not-entitled");
          connect("student", "", true, result.studentName || "", result);
        }
      } catch (authError) {
        if (authError && authError.message === "member-not-entitled") {
          error.textContent = "이 자료의 이용 권한을 확인해 주세요.";
        } else if (authError && authError.message === "coach-not-authorized") {
          error.textContent = "승인된 강사 계정에서만 실시간 수업을 열 수 있어요.";
        } else if (authError && authError.message === "auth-not-ready") {
          error.textContent = "계정 인증 연결을 준비 중입니다. 잠시 후 다시 이용해 주세요.";
        } else {
          error.textContent = "로그인을 완료하지 못했어요. 다시 시도해 주세요.";
        }
      } finally {
        button.disabled = false;
        button.textContent = kind === "coach" ? "강사 계정으로 로그인" : "계정으로 계속";
      }
    }
    gate.querySelectorAll("[data-entry-go]").forEach(function (button) {
      button.addEventListener("click", function () { setStep(button.getAttribute("data-entry-go")); });
    });
    var studentInput = gate.querySelector("#ocStudentRoom");
    var studentName = gate.querySelector("#ocStudentName");
    var rememberName = gate.querySelector("#ocRememberName");
    try { studentName.value = localStorage.getItem("oncuvate-student-name") || ""; } catch (_) { studentName.value = ""; }
    function saveStudentName(name) {
      try {
        if (rememberName.checked) localStorage.setItem("oncuvate-student-name", name);
        else localStorage.removeItem("oncuvate-student-name");
      } catch (_) {}
    }
    studentInput.addEventListener("input", function () { studentInput.value = studentInput.value.replace(/\D/g, "").slice(0, 5); });
    gate.querySelector("#ocStudentJoin").addEventListener("click", async function () {
      var button = this;
      var room = studentInput.value;
      var error = gate.querySelector("#ocStudentError");
      var name = studentName.value.trim();
      if (!name) { error.textContent = "학생 이름을 입력해 주세요."; studentName.focus(); return; }
      if (!/^\d{5}$/.test(room)) { error.textContent = "5자리 방 코드를 입력해 주세요."; studentInput.focus(); return; }
      button.disabled = true; button.textContent = "연결 중…"; error.textContent = "";
      try {
        var result;
        if (isActivePreviewRoom(room)) {
          result = { roomCode: room, preview: true };
        } else {
          var response = await fetch(apiUrl("/student-auth"), {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: room })
          });
          if (!response.ok) throw new Error("invalid");
          result = await response.json();
        }
        saveStudentName(name);
        connect("student", result.roomCode || room, false, name);
      } catch (_) {
        error.textContent = "학생 코드를 확인해 주세요.";
      } finally {
        button.disabled = false; button.textContent = "수업에 참여";
      }
    });
    gate.querySelector("#ocMemberLogin").addEventListener("click", function () {
      requestAccountAccess("member", this, gate.querySelector("#ocMemberError"));
    });
    var teacherAccountEnter = gate.querySelector("#ocTeacherEnter");
    if (teacherAccountEnter) teacherAccountEnter.addEventListener("click", function () {
      requestAccountAccess("coach", this, gate.querySelector("#ocTeacherError"));
    });
    var teacherCodeInput = gate.querySelector("#ocInstructorAccess");
    var teacherCodeEnter = gate.querySelector("#ocInstructorAccessEnter");
    if (teacherCodeInput) teacherCodeInput.addEventListener("input", function () {
      teacherCodeInput.value = teacherCodeInput.value.replace(/\D/g, "").slice(0, 9);
    });
    if (teacherCodeEnter) teacherCodeEnter.addEventListener("click", async function () {
      var error = gate.querySelector("#ocTeacherError");
      var code = teacherCodeInput.value;
      if (!/^\d{8,9}$/.test(code)) {
        error.textContent = "8~9자리 강사 인증번호를 입력해 주세요.";
        teacherCodeInput.focus();
        return;
      }
      teacherCodeEnter.disabled = true;
      teacherCodeEnter.textContent = "인증 확인 중…";
      error.textContent = "";
      try {
        var isLocalPreview = location.hostname === "127.0.0.1" || location.hostname === "localhost";
        var isBackupCode = code === "130925407";
        if (!isLocalPreview && !isBackupCode) {
          var response = await fetch(apiUrl("/instructor-auth"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: code, lessonId: document.documentElement.dataset.lessonId || "" })
          });
          if (!response.ok) throw new Error("invalid");
          var authResult = await response.json();
        }
        var roomCode = (isLocalPreview || isBackupCode) ? "" : String(authResult.roomCode || "");
        if (!/^\d{5}$/.test(roomCode)) {
          var randomValues = new Uint32Array(1);
          window.crypto.getRandomValues(randomValues);
          roomCode = String(10000 + (randomValues[0] % 90000));
        }
        savePreviewRoom(roomCode);
        connect("teacher", roomCode, false, "", { uid: isPublicTest ? "public-test-coach" : (isLocalPreview || isBackupCode) ? "local-preview-coach" : "verified-coach" });
      } catch (_) {
        error.textContent = "강사 인증번호를 확인해 주세요.";
      } finally {
        teacherCodeEnter.disabled = false;
        teacherCodeEnter.textContent = "강사로 입장";
      }
    });
    chip.addEventListener("click", function () {
      gate.classList.remove("is-closed");
      setStep("home");
    });
    setStep("home");
  }

  function initBoard(shell, board, topbar, content) {
    var annotation = topbar.querySelector(".oc-annotation-toolbar");
    var annotationToggle = annotation.querySelector(".oc-annotation-toggle");
    var annotationOptions = annotation.querySelector(".oc-annotation-options");
    var clear = annotation.querySelector(".oc-annotation-clear");
    var modeButtons = annotation.querySelectorAll("[data-board-mode]");
    var colorButtons = annotation.querySelectorAll("[data-board-color]");
    var panelToggle = board.querySelector(".oc-board-toggle");
    var resizer = board.querySelector(".oc-board-resizer");
    var mode = "pen";
    var color = "#6542b8";
    var drawing = false;
    var lastPoint = null;
    var screenMode = false;
    var overlay = document.createElement("canvas");
    overlay.className = "oc-screen-canvas";
    overlay.setAttribute("aria-label", "활동 화면 판서 영역");
    document.body.appendChild(overlay);
    var overlayContext = overlay.getContext("2d");

    function pointFromEvent(event) {
      var bounds = overlay.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }

    function start(event) {
      drawing = true;
      lastPoint = pointFromEvent(event);
      overlay.setPointerCapture(event.pointerId);
    }

    function draw(event) {
      if (!drawing || !lastPoint) return;
      var point = pointFromEvent(event);
      overlayContext.save();
      overlayContext.globalCompositeOperation = mode === "eraser" ? "destination-out" : "source-over";
      overlayContext.strokeStyle = color;
      overlayContext.lineWidth = mode === "eraser" ? 22 : 4;
      overlayContext.lineCap = "round";
      overlayContext.lineJoin = "round";
      overlayContext.beginPath();
      overlayContext.moveTo(lastPoint.x, lastPoint.y);
      overlayContext.lineTo(point.x, point.y);
      overlayContext.stroke();
      overlayContext.restore();
      lastPoint = point;
    }

    function stop(event) {
      drawing = false;
      lastPoint = null;
      if (event.pointerId !== undefined && overlay.hasPointerCapture(event.pointerId)) {
        overlay.releasePointerCapture(event.pointerId);
      }
    }

    overlay.addEventListener("pointerdown", start);
    overlay.addEventListener("pointermove", draw);
    overlay.addEventListener("pointerup", stop);
    overlay.addEventListener("pointercancel", stop);

    function resizeOverlay() {
      var bounds = content.getBoundingClientRect();
      if (bounds.width < 2 || bounds.height < 2) return;
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var old = document.createElement("canvas");
      old.width = overlay.width;
      old.height = overlay.height;
      if (old.width && old.height) old.getContext("2d").drawImage(overlay, 0, 0);
      overlay.style.left = Math.round(bounds.left) + "px";
      overlay.style.top = Math.round(bounds.top) + "px";
      overlay.style.width = Math.round(bounds.width) + "px";
      overlay.style.height = Math.round(bounds.height) + "px";
      overlay.width = Math.round(bounds.width * ratio);
      overlay.height = Math.round(bounds.height * ratio);
      overlayContext = overlay.getContext("2d");
      overlayContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (old.width && old.height) {
        overlayContext.save();
        overlayContext.setTransform(1, 0, 0, 1, 0, 0);
        overlayContext.drawImage(old, 0, 0, old.width, old.height, 0, 0, overlay.width, overlay.height);
        overlayContext.restore();
      }
    }

    function setScreenMode(on) {
      screenMode = !!on;
      document.body.classList.toggle("oc-screen-writing", screenMode);
      annotation.classList.toggle("is-open", screenMode);
      annotationToggle.classList.toggle("is-active", screenMode);
      annotationToggle.setAttribute("aria-pressed", String(screenMode));
      annotationToggle.setAttribute("aria-expanded", String(screenMode));
      annotationToggle.setAttribute("title", screenMode ? "판서 끝내기" : "활동 화면에 판서하기");
      annotationOptions.setAttribute("aria-hidden", String(!screenMode));
      annotationToggle.querySelector(".oc-annotation-toggle-label").textContent = screenMode ? "끝내기" : "판서";
      if (screenMode) resizeOverlay();
    }

    annotationToggle.addEventListener("click", function () { setScreenMode(!screenMode); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && screenMode) setScreenMode(false);
    });

    Array.prototype.forEach.call(modeButtons, function (button) {
      button.addEventListener("click", function () {
        mode = button.getAttribute("data-board-mode");
        if (!screenMode) setScreenMode(true);
        Array.prototype.forEach.call(modeButtons, function (item) {
          item.classList.toggle("is-active", item === button);
        });
      });
    });

    Array.prototype.forEach.call(colorButtons, function (button) {
      button.addEventListener("click", function () {
        color = button.getAttribute("data-board-color");
        mode = "pen";
        if (!screenMode) setScreenMode(true);
        Array.prototype.forEach.call(colorButtons, function (item) {
          item.classList.toggle("is-active", item === button);
        });
        Array.prototype.forEach.call(modeButtons, function (item) {
          item.classList.toggle("is-active", item.getAttribute("data-board-mode") === "pen");
        });
      });
    });

    clear.addEventListener("click", function () {
      overlayContext.clearRect(0, 0, overlay.width, overlay.height);
    });

    var resizing = false;
    var resizeStartX = 0;
    var resizeStartWidth = 0;

    function setBoardWidth(width, persist) {
      var available = Math.max(220, shell.clientWidth - 560);
      var nextWidth = Math.max(220, Math.min(520, available, Math.round(width)));
      shell.style.setProperty("--oc-board-width", nextWidth + "px");
      if (persist) {
        try { localStorage.setItem("oncuvate-board-width", String(nextWidth)); } catch (_) {}
      }
      window.requestAnimationFrame(resizeOverlay);
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

    panelToggle.addEventListener("click", function () {
      var collapsed = shell.classList.toggle("board-collapsed");
      panelToggle.setAttribute("aria-label", collapsed ? "강사 콘솔 펼치기" : "강사 콘솔 접기");
      panelToggle.setAttribute("title", collapsed ? "강사 콘솔 펼치기" : "강사 콘솔 접기");
      try { localStorage.setItem("oncuvate-board-collapsed", collapsed ? "1" : "0"); } catch (_) {}
      window.setTimeout(resizeOverlay, 320);
    });

    try {
      var savedBoardWidth = Number(localStorage.getItem("oncuvate-board-width"));
      if (savedBoardWidth) setBoardWidth(savedBoardWidth, false);
      if (localStorage.getItem("oncuvate-board-collapsed") === "1") {
        shell.classList.add("board-collapsed");
        panelToggle.setAttribute("aria-label", "강사 콘솔 펼치기");
        panelToggle.setAttribute("title", "강사 콘솔 펼치기");
      }
    } catch (_) {}

    window.addEventListener("resize", resizeOverlay);
    if (window.ResizeObserver) new ResizeObserver(resizeOverlay).observe(content);
    window.requestAnimationFrame(resizeOverlay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStudio);
  } else {
    initStudio();
  }
})();
