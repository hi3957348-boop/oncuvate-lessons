(function () {
  "use strict";

  var refs = {};
  var sentences = [];
  var fullText = "";
  var flow = {
    role: "student",
    activity: "sentence",
    sentenceIndex: 0,
    revision: 0,
    latestReport: null
  };
  var reports = [];
  var reportIds = {};
  var recorder = null;
  var stream = null;
  var chunks = [];
  var startedAt = 0;
  var audioContext = null;
  var analyser = null;
  var monitorFrame = 0;
  var hasSpoken = false;
  var silenceStartedAt = 0;
  var pauses = [];
  var status = "idle";
  var latestLocalResult = null;
  var microphonePermission = "unknown";
  var permissionRequesting = false;
  var syncApplying = false;
  var originalGetState = null;
  var originalApplyState = null;

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function isConnected() {
    try { return typeof syncClient !== "undefined" && syncClient && syncClient.connected; } catch (_) { return false; }
  }
  function isTeacher() {
    if (window.OcLearning && typeof window.OcLearning.isTeacher === "function") return window.OcLearning.isTeacher();
    var consoleEl = byId("ocConsole");
    if (isConnected()) return !!consoleEl && consoleEl.style.display === "flex";
    return !/room=/.test(location.hash);
  }
  function learnerName() {
    try {
      var context = window.Oc && typeof window.Oc.ctx === "function" ? window.Oc.ctx() : null;
      return context && context.name ? String(context.name) : "학생";
    } catch (_) { return "학생"; }
  }
  function cleanText(value) {
    return String(value || "").replace(/\s*\/\s*/g, " ").replace(/\s+/g, " ").trim();
  }
  function targetText() {
    return flow.activity === "full" ? fullText : (sentences[flow.sentenceIndex] || sentences[0] || "");
  }
  function syllableCount(text) {
    var matches = String(text || "").match(/[가-힣]/g);
    return matches ? matches.length : 0;
  }
  function resampleMono(buffer, targetRate) {
    var sourceRate = buffer.sampleRate;
    var length = Math.max(1, Math.round(buffer.duration * targetRate));
    var output = new Float32Array(length);
    for (var index = 0; index < length; index++) {
      var position = index * sourceRate / targetRate;
      var left = Math.floor(position);
      var right = Math.min(buffer.length - 1, left + 1);
      var ratio = position - left;
      var sample = 0;
      for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
        var data = buffer.getChannelData(channel);
        sample += (data[left] * (1 - ratio) + data[right] * ratio) / buffer.numberOfChannels;
      }
      output[index] = sample;
    }
    return output;
  }
  function encodeWav(samples, sampleRate) {
    var output = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(output);
    function writeText(offset, value) {
      for (var index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index));
    }
    writeText(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (var sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
      var sample = Math.max(-1, Math.min(1, samples[sampleIndex]));
      view.setInt16(44 + sampleIndex * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
    }
    return new Blob([output], { type: "audio/wav" });
  }
  async function toAssessmentWav(blob) {
    var context = new (window.AudioContext || window.webkitAudioContext)();
    try {
      var buffer = await context.decodeAudioData(await blob.arrayBuffer());
      return encodeWav(resampleMono(buffer, 16000), 16000);
    } finally {
      context.close().catch(function () {});
    }
  }
  function stars(value) {
    var numeric = Math.max(.5, Math.min(5, Number(value) || .5));
    var full = Math.floor(numeric);
    var half = numeric - full >= .5;
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)));
  }
  function roleLabel() {
    if (!isConnected()) return isTeacher() ? "강사 미리보기" : "학생 연결 중";
    return isTeacher() ? "강사 결과 화면" : "학생 활동 화면";
  }

  function init() {
    refs.panel = byId("testMode");
    refs.button = byId("mTest");
    refs.content = byId("ocStudioContent");
    if (!refs.panel || !refs.button || !refs.content) return;

    sentences = Array.prototype.map.call(
      document.querySelectorAll("#reading .sentence"),
      function (element) { return cleanText(element.textContent); }
    ).filter(Boolean);
    fullText = sentences.join(" ");

    refs.panel.innerHTML =
      '<section class="oc-fluency-shell">' +
        '<header class="oc-fluency-head"><div><span>AUTOMATIC FLUENCY CHECK</span><h2>읽기 유창성 테스트</h2>' +
        '<p>시작 버튼을 누르고 읽으면 녹음·전사·분석이 자동으로 이어집니다.</p></div>' +
        '<span class="oc-fluency-role" data-fluency-role></span></header>' +
        '<div class="oc-fluency-switch" data-fluency-switch>' +
          '<button type="button" data-activity="sentence">문장 단위</button>' +
          '<button type="button" data-activity="full">글 전체</button>' +
        '</div>' +
        '<div data-fluency-body></div>' +
      '</section>';
    refs.body = refs.panel.querySelector("[data-fluency-body]");
    refs.switcher = refs.panel.querySelector("[data-fluency-switch]");

    refs.panel.addEventListener("click", onPanelClick);
    refs.panel.addEventListener("input", onPanelInput);
    refs.button.onclick = function () {
      if (window.OcLearning) window.OcLearning.showMode("test", true);
      render();
      if (!isTeacher()) prepareMicrophonePermission();
    };
    window.OcFluency = { prepareMicrophone: prepareMicrophonePermission };
    bindSync();
    restoreReports();
    render();
    window.setInterval(function () {
      var role = refs.panel.querySelector("[data-fluency-role]");
      if (role) role.textContent = roleLabel();
    }, 700);
  }

  function onPanelClick(event) {
    var activity = event.target.closest("[data-activity]");
    if (activity) {
      if (!isTeacher() || status === "recording" || status === "analyzing") return;
      flow.activity = activity.dataset.activity;
      flow.sentenceIndex = 0;
      flow.latestReport = null;
      latestLocalResult = null;
      status = "idle";
      flow.revision++;
      render();
      publish();
      return;
    }
    var action = event.target.closest("[data-fluency-action]");
    if (!action) return;
    var name = action.dataset.fluencyAction;
    if (name === "start") startRecording();
    else if (name === "request-microphone") prepareMicrophonePermission();
    else if (name === "stop") stopRecording();
    else if (name === "retry") {
      latestLocalResult = null;
      status = "idle";
      render();
    } else if (name === "prev-sentence" && isTeacher()) {
      flow.sentenceIndex = Math.max(0, flow.sentenceIndex - 1);
      flow.latestReport = null;
      flow.revision++;
      render(); publish();
    } else if (name === "next-sentence" && isTeacher()) {
      flow.sentenceIndex = Math.min(sentences.length - 1, flow.sentenceIndex + 1);
      flow.latestReport = null;
      flow.revision++;
      render(); publish();
    } else if (name === "clear-reports" && isTeacher()) {
      reports = [];
      reportIds = {};
      saveReports();
      render();
    }
  }

  function onPanelInput(event) {
    var note = event.target.closest("[data-report-note]");
    if (!note || !isTeacher()) return;
    var report = reports.find(function (item) { return item.id === note.dataset.reportNote; });
    if (report) {
      report.teacherNote = note.value;
      saveReports();
    }
  }

  function render() {
    if (!refs.body) return;
    refs.panel.querySelector("[data-fluency-role]").textContent = roleLabel();
    refs.switcher.querySelectorAll("button").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.activity === flow.activity);
      button.disabled = !isTeacher() || status === "recording" || status === "analyzing";
    });
    if (isTeacher()) renderTeacher();
    else renderStudent();
  }

  function renderTeacher() {
    var target = targetText();
    var report = flow.latestReport;
    refs.body.innerHTML =
      '<div class="oc-fluency-teacher-grid">' +
        '<section class="oc-fluency-target-card"><div class="oc-card-label"><span>학생에게 보이는 글</span>' +
          (flow.activity === "sentence" ? '<b>' + (flow.sentenceIndex + 1) + ' / ' + sentences.length + '</b>' : '<b>전체</b>') +
        '</div><p>' + escapeHtml(target) + '</p>' +
        (flow.activity === "sentence" ? '<div class="oc-sentence-nav"><button type="button" data-fluency-action="prev-sentence" ' + (flow.sentenceIndex === 0 ? "disabled" : "") + '>이전 문장</button>' +
          '<button type="button" data-fluency-action="next-sentence" ' + (flow.sentenceIndex >= sentences.length - 1 ? "disabled" : "") + '>다음 문장</button></div>' : "") +
        '<small>강사가 문장 또는 활동 유형을 바꾸면 학생 화면에 바로 반영됩니다.</small></section>' +
        '<section class="oc-live-result-card">' +
          (report ? teacherCurrentResult(report) :
            '<div class="oc-empty-result"><i></i><span>학생 결과 대기</span><strong>학생이 읽기를 마치면 요약이 이곳에 도착해요</strong></div>') +
        '</section>' +
      '</div>' +
      '<section class="oc-class-results"><div class="oc-class-results-head"><div><span>STUDENT RESULTS</span><h3>학생 활동 결과</h3></div>' +
        (reports.length ? '<button type="button" data-fluency-action="clear-reports">목록 비우기</button>' : "") + '</div>' +
        (reports.length ? '<div class="oc-report-list">' + reports.map(reportCard).join("") + '</div>' :
          '<div class="oc-no-reports">아직 전송된 결과가 없습니다.</div>') + '</section>';
  }

  function teacherCurrentResult(report) {
    return '<div class="oc-live-result-head"><span class="' + (report.confidence === "high" ? "is-high" : "") + '">새 결과</span><b>' + escapeHtml(report.studentName) + '</b></div>' +
      '<div class="oc-live-metrics"><div><span>발음</span><strong>' + Number(report.pronunciationStars).toFixed(1) + '</strong></div>' +
      '<div><span>속도</span><strong>' + Number(report.speedStars).toFixed(1) + '</strong></div>' +
      '<div><span>끊어읽기</span><strong>' + Number(report.phrasingStars).toFixed(1) + '</strong></div></div>' +
      '<p class="oc-live-transcript"><span>전사</span>' + escapeHtml(report.transcript) + '</p>';
  }

  function reportCard(report) {
    var issueCount = Array.isArray(report.issues) ? report.issues.length : 0;
    return '<article class="oc-report-card"><header><div><strong>' + escapeHtml(report.studentName) + '</strong><span>' +
      (report.activity === "full" ? "글 전체" : "문장 " + (report.sentenceIndex + 1)) + '</span></div><time>' + escapeHtml(report.timeLabel) + '</time></header>' +
      '<div class="oc-report-scoreline"><span>발음 <b>' + Number(report.pronunciationStars).toFixed(1) + '</b></span>' +
      '<span>속도 <b>' + Number(report.speedStars).toFixed(1) + '</b></span>' +
      '<span>끊어읽기 <b>' + Number(report.phrasingStars).toFixed(1) + '</b></span>' +
      '<span>확인점 <b>' + issueCount + '</b></span></div>' +
      '<details><summary>전사와 분석 자세히 보기</summary><div class="oc-report-detail"><label>목표 문장</label><p>' + escapeHtml(report.targetText) + '</p>' +
      '<label>인식된 읽기</label><p>' + escapeHtml(report.transcript) + '</p>' +
      '<label>AI 요약</label><p>' + escapeHtml(report.pronunciationSummary) + '<br>' + escapeHtml(report.speedSummary) + '<br>' + escapeHtml(report.phrasingSummary) + '</p>' +
      '<label>강사 피드백 메모</label><textarea data-report-note="' + escapeHtml(report.id) + '" placeholder="학생에게 전달할 피드백을 적어 두세요.">' +
      escapeHtml(report.teacherNote || "") + '</textarea></div></details></article>';
  }

  function renderStudent() {
    var target = targetText();
    var activityLabel = flow.activity === "full" ? "글 전체 읽기" : "문장 " + (flow.sentenceIndex + 1);
    var content =
      '<section class="oc-student-fluency-card"><div class="oc-student-target-head"><span>' + activityLabel + '</span>' +
      '<b>' + syllableCount(target) + '음절</b></div><p class="oc-student-target">' + escapeHtml(target) + '</p>';

    if (permissionRequesting) {
      content += '<div class="oc-mic-permission is-checking"><i></i><strong>마이크 연결을 확인하고 있어요</strong><p>권한창이 나타나면 <b>허용</b>을 눌러 주세요.</p></div>';
    } else if (microphonePermission === "denied" && status !== "recording") {
      content += '<div class="oc-mic-permission is-denied"><strong>마이크 허용이 필요해요</strong>' +
        '<p>주소창 왼쪽의 사이트 설정에서 <b>마이크 → 허용</b>으로 바꾼 뒤 다시 눌러 주세요.</p>' +
        '<button type="button" data-fluency-action="request-microphone">마이크 다시 허용하기</button></div>';
    } else if (status === "recording") {
      content += '<div class="oc-recording-state"><span class="oc-record-dot"></span><div><strong>읽는 소리를 듣고 있어요</strong>' +
        '<small>읽기를 마치고 잠시 기다리면 자동으로 분석합니다.</small></div></div>' +
        '<button class="oc-stop-reading" type="button" data-fluency-action="stop">읽기 끝내기</button>';
    } else if (status === "analyzing") {
      content += '<div class="oc-analyzing-state"><i></i><strong>녹음을 글자로 바꾸고 있어요</strong><small>발음·속도·끊어읽기도 함께 확인합니다.</small></div>';
    } else if (status === "error") {
      content += '<div class="oc-fluency-error"><strong>분석을 완료하지 못했어요</strong><p>' +
        escapeHtml(latestLocalResult && latestLocalResult.error || "마이크 상태를 확인해 주세요.") +
        '</p><button type="button" data-fluency-action="retry">다시 시도</button></div>';
    } else if (status === "result" && latestLocalResult) {
      content += studentResult(latestLocalResult);
    } else {
      content += '<div class="oc-start-reading"><button type="button" data-fluency-action="start"><span></span>읽기 시작</button>' +
        '<p>버튼을 누르면 바로 녹음이 시작돼요. 따로 읽은 곳을 표시하지 않아도 됩니다.</p></div>';
    }
    content += "</section>";
    refs.body.innerHTML = content;
  }

  function studentResult(result) {
    var assessment = result.assessment;
    var incorrect = (assessment.phonologyChecks || []).filter(function (check) { return check.status === "incorrect"; });
    var issues = (assessment.issues || []).slice(0, 5);
    var focus = incorrect.length ? incorrect.map(function (check) {
      return '<li><strong>' + escapeHtml(check.written) + '</strong><span>[' + escapeHtml(check.expectedPronunciation) + ']</span><p>' + escapeHtml(check.explanation) + '</p></li>';
    }).join("") : issues.map(function (issue) {
      return '<li><strong>' + escapeHtml(issue.target || "읽기") + '</strong><span>' + escapeHtml(issue.type) + '</span><p>' + escapeHtml(issue.explanation) + '</p></li>';
    }).join("");
    return '<div class="oc-auto-result"><div class="oc-auto-result-title"><span>분석 완료</span><h3>내 읽기 결과</h3></div>' +
      '<div class="oc-auto-ratings">' +
        rating("발음", assessment.pronunciationStars, assessment.pronunciationSummary) +
        rating("속도", assessment.speedStars, assessment.speedSummary) +
        rating("끊어읽기", assessment.phrasingStars, assessment.phrasingSummary) +
      '</div><div class="oc-transcript-box"><span>내가 읽은 문장</span><p>' + escapeHtml(result.transcript) + '</p></div>' +
      (focus ? '<div class="oc-result-focus"><span>확인할 부분</span><ul>' + focus + '</ul></div>' :
        '<div class="oc-result-perfect">읽은 내용에서 큰 오류가 발견되지 않았어요.</div>') +
      '<div class="oc-result-sent"><b></b> 결과가 선생님 화면으로 전송됐어요</div>' +
      '<button class="oc-retry-reading" type="button" data-fluency-action="retry">다시 읽기</button></div>';
  }

  function rating(label, value, summary) {
    return '<article><span>' + label + '</span><strong>' + stars(value) + '<b>' + Number(value).toFixed(1) + '</b></strong><p>' +
      escapeHtml(summary) + '</p></article>';
  }

  async function prepareMicrophonePermission() {
    if (isTeacher() || permissionRequesting || microphonePermission === "granted") return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      microphonePermission = "denied";
      render();
      return;
    }
    permissionRequesting = true;
    render();
    try {
      var permissionStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      permissionStream.getTracks().forEach(function (track) { track.stop(); });
      microphonePermission = "granted";
      latestLocalResult = null;
      if (status === "error") status = "idle";
    } catch (_) {
      microphonePermission = "denied";
    } finally {
      permissionRequesting = false;
      render();
    }
  }

  async function startRecording() {
    if (isTeacher() || status === "recording" || status === "analyzing") return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      latestLocalResult = { error: "이 브라우저에서는 마이크 녹음을 사용할 수 없습니다." };
      status = "error"; render(); return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      microphonePermission = "granted";
      chunks = [];
      pauses = [];
      hasSpoken = false;
      silenceStartedAt = 0;
      startedAt = Date.now();
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = function (event) { if (event.data && event.data.size) chunks.push(event.data); };
      recorder.onstop = finishRecording;
      recorder.start(250);
      status = "recording";
      startSilenceMonitor();
      render();
    } catch (error) {
      microphonePermission = "denied";
      latestLocalResult = { error: "마이크 사용을 허용한 뒤 다시 시작해 주세요." };
      status = "error";
      render();
    }
  }

  function startSilenceMonitor() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      var source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      var data = new Uint8Array(analyser.fftSize);
      var silenceLimit = flow.activity === "full" ? 4000 : 2300;
      function tick() {
        if (status !== "recording" || !analyser) return;
        analyser.getByteTimeDomainData(data);
        var sum = 0;
        for (var index = 0; index < data.length; index++) {
          var normalized = (data[index] - 128) / 128;
          sum += normalized * normalized;
        }
        var rms = Math.sqrt(sum / data.length);
        var now = Date.now();
        if (rms > .035) {
          if (silenceStartedAt && hasSpoken && now - silenceStartedAt >= 800) pauses.push((now - silenceStartedAt) / 1000);
          hasSpoken = true;
          silenceStartedAt = 0;
        } else if (hasSpoken) {
          if (!silenceStartedAt) silenceStartedAt = now;
          if (now - silenceStartedAt >= silenceLimit) { stopRecording(); return; }
        }
        if (now - startedAt > (flow.activity === "full" ? 240000 : 60000)) { stopRecording(); return; }
        monitorFrame = requestAnimationFrame(tick);
      }
      tick();
    } catch (_) {}
  }

  function stopRecording() {
    if (status !== "recording") return;
    status = "analyzing";
    render();
    if (monitorFrame) cancelAnimationFrame(monitorFrame);
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  async function finishRecording() {
    var duration = Math.max(1, (Date.now() - startedAt) / 1000);
    var mime = recorder && recorder.mimeType ? recorder.mimeType : "audio/webm";
    var blob = new Blob(chunks, { type: mime });
    cleanupAudio();
    if (!blob.size || duration < .8) {
      latestLocalResult = { error: "읽는 소리가 너무 짧아요. 다시 읽어 주세요." };
      status = "error"; render(); return;
    }
    try {
      var wav = await toAssessmentWav(blob);
      var signalSummary = JSON.stringify({
        speech_seconds: Number(duration.toFixed(2)),
        voiced_seconds: Number(Math.max(1, duration - pauses.reduce(function (a, b) { return a + b; }, 0)).toFixed(2)),
        long_pause_count: pauses.length,
        longest_pause_seconds: Number((pauses.length ? Math.max.apply(Math, pauses) : 0).toFixed(2)),
        long_pause_total_seconds: Number(pauses.reduce(function (a, b) { return a + b; }, 0).toFixed(2)),
        selected_syllables: syllableCount(targetText())
      });
      var form = new FormData();
      form.append("audio", wav, "reading.wav");
      form.append("targetText", targetText());
      form.append("signalSummary", signalSummary);
      var response = await fetch("/api/reading-assessment", { method: "POST", body: form });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || "음성 분석에 실패했습니다.");
      latestLocalResult = { transcript: data.transcript, assessment: data.assessment, duration: duration };
      status = "result";
      sendReport(latestLocalResult);
      render();
    } catch (error) {
      latestLocalResult = { error: error && error.message ? error.message : "음성 분석에 실패했습니다." };
      status = "error";
      render();
    }
  }

  function cleanupAudio() {
    if (monitorFrame) cancelAnimationFrame(monitorFrame);
    monitorFrame = 0;
    if (audioContext) audioContext.close().catch(function () {});
    audioContext = null;
    analyser = null;
    if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
    stream = null;
    recorder = null;
  }

  function sendReport(result) {
    var assessment = result.assessment || {};
    var now = new Date();
    var report = {
      id: "fr-" + now.getTime() + "-" + Math.random().toString(36).slice(2, 7),
      studentName: learnerName(),
      activity: flow.activity,
      sentenceIndex: flow.sentenceIndex,
      targetText: targetText(),
      transcript: result.transcript || "",
      pronunciationStars: Number(assessment.pronunciationStars) || .5,
      speedStars: Number(assessment.speedStars || assessment.fluencyStars) || .5,
      phrasingStars: Number(assessment.phrasingStars || assessment.fluencyStars) || .5,
      pronunciationSummary: assessment.pronunciationSummary || "",
      speedSummary: assessment.speedSummary || assessment.fluencySummary || "",
      phrasingSummary: assessment.phrasingSummary || assessment.fluencySummary || "",
      issues: (assessment.issues || []).slice(0, 10),
      phonologyChecks: (assessment.phonologyChecks || []).slice(0, 16),
      confidence: assessment.confidence || "low",
      duration: Number(result.duration || 0),
      timeLabel: now.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      teacherNote: ""
    };
    flow.latestReport = report;
    flow.role = "student";
    flow.revision++;
    publish();
  }

  function bindSync() {
    try {
      if (typeof getState === "function") {
        originalGetState = getState;
        getState = function () {
          var value = originalGetState() || {};
          value.fluencyFlow = {
            role: isTeacher() ? "teacher" : "student",
            activity: flow.activity,
            sentenceIndex: flow.sentenceIndex,
            revision: flow.revision,
            latestReport: flow.latestReport
          };
          return value;
        };
      }
      if (typeof applyState === "function") {
        originalApplyState = applyState;
        applyState = function (value) {
          syncApplying = true;
          try {
            originalApplyState(value);
            if (value && value.fluencyFlow) acceptFlow(value.fluencyFlow);
          } finally { syncApplying = false; }
        };
      }
    } catch (_) {}
  }

  function acceptFlow(incoming) {
    if (!incoming) return;
    if (isTeacher() && incoming.role === "student") {
      if (incoming.latestReport && !reportIds[incoming.latestReport.id]) {
        var report = clone(incoming.latestReport);
        reportIds[report.id] = true;
        reports.unshift(report);
        reports = reports.slice(0, 40);
        flow.latestReport = report;
        saveReports();
        render();
        window.setTimeout(publish, 100);
      }
      return;
    }
    if (!isTeacher() && incoming.role === "teacher") {
      var changed = flow.activity !== incoming.activity || flow.sentenceIndex !== incoming.sentenceIndex;
      flow.activity = incoming.activity || "sentence";
      flow.sentenceIndex = Math.max(0, Math.min(sentences.length - 1, Number(incoming.sentenceIndex) || 0));
      if (changed && status !== "recording" && status !== "analyzing") {
        latestLocalResult = null;
        status = "idle";
      }
      render();
    }
  }

  function publish() {
    if (syncApplying) return;
    try { if (typeof broadcast === "function") broadcast(); } catch (_) {}
  }

  function saveReports() {
    try { localStorage.setItem("oncuvate-fluency-reports-v2", JSON.stringify(reports)); } catch (_) {}
  }

  function restoreReports() {
    if (!isTeacher()) return;
    try {
      reports = JSON.parse(localStorage.getItem("oncuvate-fluency-reports-v2") || "[]");
      reports.forEach(function (report) { reportIds[report.id] = true; });
    } catch (_) { reports = []; }
  }

  window.addEventListener("beforeunload", cleanupAudio);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 20); });
  else setTimeout(init, 20);
})();
