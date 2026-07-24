(function () {
  "use strict";

  var analyzedRecording = "";
  var pendingContext = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cleanWord(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  }

  function getSelectedReading() {
    var syllables = Array.prototype.slice.call(
      document.querySelectorAll("#tPassage .tsyl"),
    );
    var start = document.querySelector("#tPassage .tsyl.tstart");
    var end = document.querySelector("#tPassage .tsyl.tend");
    if (!start || !end) return null;

    var startIndex = Number(start.dataset.i);
    var endIndex = Number(end.dataset.i);
    var range = document.createRange();
    range.setStartBefore(start);
    range.setEndAfter(end);
    var targetText = (range.cloneContents().textContent || "")
      .replace(/\s+/g, " ")
      .trim();

    return {
      syllables: syllables,
      startIndex: startIndex,
      endIndex: endIndex,
      readSyllables: Math.max(1, endIndex - startIndex + 1),
      targetText: targetText,
    };
  }

  function waitForRecording(callback, tries) {
    tries = tries || 0;
    if (window.OcRec && window.OcRec.lastBlob) {
      callback(window.OcRec.lastBlob);
      return;
    }
    if (tries > 80) {
      showError("녹음 파일을 준비하지 못했습니다. 다시 검사해 주세요.");
      return;
    }
    setTimeout(function () {
      waitForRecording(callback, tries + 1);
    }, 100);
  }

  function resampleMono(buffer, targetRate) {
    var sourceRate = buffer.sampleRate;
    var length = Math.max(1, Math.round(buffer.duration * targetRate));
    var output = new Float32Array(length);
    var channels = buffer.numberOfChannels;
    for (var index = 0; index < length; index++) {
      var sourcePosition = (index * sourceRate) / targetRate;
      var left = Math.floor(sourcePosition);
      var right = Math.min(buffer.length - 1, left + 1);
      var ratio = sourcePosition - left;
      var sample = 0;
      for (var channel = 0; channel < channels; channel++) {
        var data = buffer.getChannelData(channel);
        sample += (data[left] * (1 - ratio) + data[right] * ratio) / channels;
      }
      output[index] = sample;
    }
    return output;
  }

  function encodeWav(samples, sampleRate) {
    var output = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(output);
    function text(offset, value) {
      for (var i = 0; i < value.length; i++) {
        view.setUint8(offset + i, value.charCodeAt(i));
      }
    }
    text(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    text(8, "WAVE");
    text(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (var index = 0; index < samples.length; index++) {
      var sample = Math.max(-1, Math.min(1, samples[index]));
      view.setInt16(
        44 + index * 2,
        sample < 0 ? sample * 32768 : sample * 32767,
        true,
      );
    }
    return new Blob([output], { type: "audio/wav" });
  }

  async function prepareAudio(blob) {
    var context = new (window.AudioContext || window.webkitAudioContext)();
    try {
      var buffer = await context.decodeAudioData(await blob.arrayBuffer());
      var samples = resampleMono(buffer, 16000);
      return {
        wav: encodeWav(samples, 16000),
        signal: analyzeSignal(samples, 16000),
      };
    } finally {
      await context.close();
    }
  }

  function analyzeSignal(samples, sampleRate) {
    var frameSeconds = 0.02;
    var frameSize = Math.max(1, Math.round(sampleRate * frameSeconds));
    var levels = [];
    for (var offset = 0; offset < samples.length; offset += frameSize) {
      var sum = 0;
      var end = Math.min(samples.length, offset + frameSize);
      for (var i = offset; i < end; i++) sum += samples[i] * samples[i];
      levels.push(Math.sqrt(sum / Math.max(1, end - offset)));
    }
    var sorted = levels.slice().sort(function (a, b) {
      return a - b;
    });
    var noise = sorted[Math.floor(sorted.length * 0.2)] || 0;
    var peak = sorted[sorted.length - 1] || 0.01;
    var threshold = Math.max(0.009, noise * 2.8, peak * 0.085);
    var voiced = levels.map(function (level) {
      return level > threshold;
    });
    var first = voiced.indexOf(true);
    var last = voiced.lastIndexOf(true);
    if (first < 0 || last <= first) {
      return {
        duration: samples.length / sampleRate,
        voicedDuration: 0,
        longPauses: 0,
        longestPause: 0,
        pauseDuration: 0,
      };
    }

    var longPauses = 0;
    var longestPause = 0;
    var pauseDuration = 0;
    var cursor = first;
    while (cursor <= last) {
      if (voiced[cursor]) {
        cursor++;
        continue;
      }
      var pauseStart = cursor;
      while (cursor <= last && !voiced[cursor]) cursor++;
      var seconds = (cursor - pauseStart) * frameSeconds;
      if (seconds >= 0.8) {
        longPauses++;
        pauseDuration += seconds;
        longestPause = Math.max(longestPause, seconds);
      }
    }
    return {
      duration: (last - first + 1) * frameSeconds,
      voicedDuration:
        voiced.slice(first, last + 1).filter(Boolean).length * frameSeconds,
      longPauses: longPauses,
      longestPause: longestPause,
      pauseDuration: pauseDuration,
    };
  }

  function alignWords(targetText, transcript) {
    var target = targetText.match(/[\p{L}\p{N}]+/gu) || [];
    var heard = transcript.match(/[\p{L}\p{N}]+/gu) || [];
    var rows = target.length + 1;
    var cols = heard.length + 1;
    var score = Array.from({ length: rows }, function () {
      return new Array(cols).fill(0);
    });
    var move = Array.from({ length: rows }, function () {
      return new Array(cols).fill("");
    });
    for (var i = 1; i < rows; i++) {
      score[i][0] = i;
      move[i][0] = "delete";
    }
    for (var j = 1; j < cols; j++) {
      score[0][j] = j;
      move[0][j] = "insert";
    }
    for (i = 1; i < rows; i++) {
      for (j = 1; j < cols; j++) {
        var same = cleanWord(target[i - 1]) === cleanWord(heard[j - 1]);
        var choices = [
          { value: score[i - 1][j - 1] + (same ? 0 : 1), op: same ? "same" : "substitution" },
          { value: score[i - 1][j] + 1, op: "delete" },
          { value: score[i][j - 1] + 1, op: "insert" },
        ].sort(function (a, b) {
          return a.value - b.value;
        });
        score[i][j] = choices[0].value;
        move[i][j] = choices[0].op;
      }
    }

    var aligned = [];
    var insertions = [];
    i = target.length;
    j = heard.length;
    while (i > 0 || j > 0) {
      var op = move[i][j];
      if (op === "same" || op === "substitution") {
        aligned.unshift({
          target: target[i - 1],
          heard: heard[j - 1],
          status: op,
        });
        i--;
        j--;
      } else if (op === "delete") {
        aligned.unshift({
          target: target[i - 1],
          heard: "",
          status: "omission",
        });
        i--;
      } else {
        insertions.unshift(heard[j - 1]);
        j--;
      }
    }
    return { aligned: aligned, insertions: insertions };
  }

  function setLoading() {
    var wrap = document.querySelector("#tResult .ai-assessment");
    if (!wrap) {
      wrap = document.createElement("section");
      wrap.className = "ai-assessment";
      document.querySelector("#tResult").appendChild(wrap);
    }
    wrap.innerHTML =
      '<div class="ai-loading"><div class="ai-spinner"></div>' +
      "<strong>발음과 유창성을 분석하고 있어요</strong>" +
      "<p>녹음을 듣고 원문과 비교하는 데 잠시 시간이 걸립니다.</p></div>";
  }

  function showError(message) {
    var wrap = document.querySelector("#tResult .ai-assessment");
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="ai-error"><strong>자동 분석을 완료하지 못했어요</strong><p>' +
      escapeHtml(message) +
      '</p><button type="button" class="ai-retry">다시 분석</button></div>';
    var retry = wrap.querySelector(".ai-retry");
    if (retry) {
      retry.onclick = function () {
        if (pendingContext) runAssessment(pendingContext.blob, pendingContext.reading);
      };
    }
  }

  function starBlock(label, value, summary, icon, tone, metric, coachPoint) {
    var numeric = Number(value) || 0.5;
    var percent = Math.max(10, Math.min(100, (numeric / 5) * 100));
    return (
      '<div class="ai-rating ai-rating-' +
      tone +
      '"><div class="ai-rating-top"><span class="ai-rating-label"><i>' +
      icon +
      "</i>" +
      escapeHtml(label) +
      '</span><span class="ai-rating-value">' +
      numeric.toFixed(1) +
      " / 5</span></div>" +
      '<span class="ai-stars" aria-label="' +
      escapeHtml(label) +
      " " +
      numeric.toFixed(1) +
      '점">★★★★★<span class="ai-stars-fill" style="width:' +
      percent +
      '%">★★★★★</span></span>' +
      (metric
        ? '<div class="ai-rating-metric"><strong>' +
          escapeHtml(metric.primary) +
          '</strong><span>' +
          escapeHtml(metric.secondary) +
          "</span></div>"
        : "") +
      "<p>" +
      escapeHtml(summary) +
      "</p>" +
      (coachPoint
        ? '<div class="ai-card-point"><span>이번 연습 포인트</span><b>' +
          escapeHtml(coachPoint) +
          "</b></div>"
        : "") +
      "</div>"
    );
  }

  var TYPE_LABELS = {
    omission: "빠뜨림",
    substitution: "다르게 읽음",
    insertion: "덧붙임",
    repetition: "반복",
    pronunciation: "발음",
    pause: "끊어읽기",
    self_correction: "고쳐 읽기",
  };

  function markPassage(reading, aligned, aiIssues) {
    reading.syllables.forEach(function (syllable) {
      syllable.classList.remove("ai-reading-error", "ai-reading-pronunciation");
    });
    var cursor = reading.startIndex;
    aligned.forEach(function (word) {
      var length = cleanWord(word.target).length;
      if (word.status === "omission" || word.status === "substitution") {
        for (
          var i = cursor;
          i < Math.min(cursor + length, reading.syllables.length);
          i++
        ) {
          reading.syllables[i].classList.add("ai-reading-error");
        }
      }
      cursor += length;
    });

    aiIssues
      .filter(function (issue) {
        return issue.type === "pronunciation" && issue.target;
      })
      .forEach(function (issue) {
        var target = cleanWord(issue.target);
        if (!target) return;
        var text = "";
        var indexes = [];
        for (var i = reading.startIndex; i <= reading.endIndex; i++) {
          text += cleanWord(reading.syllables[i].textContent);
          indexes.push(i);
        }
        var found = text.indexOf(target);
        if (found < 0) return;
        for (var n = found; n < found + target.length && n < indexes.length; n++) {
          reading.syllables[indexes[n]].classList.add(
            "ai-reading-pronunciation",
          );
        }
      });
  }

  function getStudentContext() {
    try {
      return JSON.parse(localStorage.getItem("oc_student_v1") || "null") || {};
    } catch (_) {
      return {};
    }
  }

  function openExpertReport(report) {
    var popup = window.open("", "_blank");
    if (!popup) {
      alert("보고서를 열 수 있도록 팝업을 허용해 주세요.");
      return;
    }
    var student = getStudentContext();
    var phonologyRows = report.phonologyChecks.length
      ? report.phonologyChecks
          .map(function (check) {
            var status =
              check.status === "correct"
                ? "적용"
                : check.status === "incorrect"
                  ? "확인 필요"
                  : "판단 보류";
            return (
              "<tr><td>" +
              escapeHtml(check.written) +
              "</td><td>" +
              escapeHtml(check.phenomenon) +
              "</td><td>[" +
              escapeHtml(check.expectedPronunciation || "-") +
              "]</td><td>[" +
              escapeHtml(check.heardPronunciation || "-") +
              "]</td><td>" +
              status +
              "</td><td>" +
              escapeHtml(check.explanation || "") +
              "</td></tr>"
            );
          })
          .join("")
      : '<tr><td colspan="6">확인할 음운변동 항목이 없습니다.</td></tr>';
    var issueRows = report.issues.length
      ? report.issues
          .map(function (issue) {
            return (
              "<tr><td>" +
              escapeHtml(TYPE_LABELS[issue.type] || "확인") +
              "</td><td>" +
              escapeHtml(issue.target || "-") +
              "</td><td>" +
              escapeHtml(issue.heard || "-") +
              "</td><td>" +
              escapeHtml(issue.explanation || "") +
              "</td></tr>"
            );
          })
          .join("")
      : '<tr><td colspan="4">뚜렷한 오류가 발견되지 않았습니다.</td></tr>';

    var html =
      '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>읽기 유창성 전문가용 보고서</title>' +
      "<style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,'Noto Sans KR',sans-serif;color:#17352f;margin:0;font-size:11px;line-height:1.55}header{border-bottom:3px solid #214f45;padding-bottom:14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-end}h1{margin:0;font-size:23px}h2{font-size:15px;margin:22px 0 8px;color:#214f45}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.box{border:1px solid #d9e1dc;border-radius:7px;padding:8px}.box span{display:block;color:#77857f;font-size:9px}.scores{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.score{padding:12px;border-radius:9px;background:#f3f7f4}.score b{font-size:19px}.reading{display:grid;grid-template-columns:1fr 1fr;gap:9px}.reading p{margin:4px 0 0;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dce3df;padding:6px;text-align:left;vertical-align:top}th{background:#eef4f0}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.notes{height:75px;border:1px solid #cfd8d3;border-radius:8px}.notice{margin-top:18px;color:#6d7b75;font-size:9px}.actions{position:fixed;right:16px;top:16px}.actions button{border:0;border-radius:999px;background:#214f45;color:white;padding:10px 15px;font-weight:700;cursor:pointer}@media print{.actions{display:none}}</style></head><body>" +
      '<div class="actions"><button onclick="window.print()">인쇄 · PDF로 저장</button></div>' +
      "<header><div><div>ONCUVATE READING ASSESSMENT</div><h1>읽기 유창성 전문가용 보고서</h1></div><strong>" +
      escapeHtml(report.bookTitle) +
      "</strong></header>" +
      '<section class="meta"><div class="box"><span>학생</span><b>' +
      escapeHtml(student.name || "미입력") +
      '</b></div><div class="box"><span>학급</span><b>' +
      escapeHtml(student.cls || "미입력") +
      '</b></div><div class="box"><span>검사 일시</span><b>' +
      escapeHtml(report.date) +
      '</b></div><div class="box"><span>분석 신뢰도</span><b>' +
      escapeHtml(report.confidence) +
      "</b></div></section>" +
      '<h2>종합 점수</h2><section class="scores"><div class="score">발음<br><b>' +
      report.pronunciationStars.toFixed(1) +
      " / 5</b><p>" +
      escapeHtml(report.pronunciationSummary) +
      '</p></div><div class="score">속도<br><b>' +
      report.speedStars.toFixed(1) +
      " / 5</b><p>" +
      escapeHtml(report.speedSummary) +
      '</p></div><div class="score">끊어읽기<br><b>' +
      report.phrasingStars.toFixed(1) +
      " / 5</b><p>" +
      escapeHtml(report.phrasingSummary) +
      '</p><p><b>권장 끊어읽기:</b> ' +
      escapeHtml(report.phrasingExample || "-") +
      "</p></div></section>" +
      '<h2>읽기 자료</h2><section class="reading"><div class="box"><span>목표 글</span><p>' +
      escapeHtml(report.targetText) +
      '</p></div><div class="box"><span>음성인식 전사</span><p>' +
      escapeHtml(report.transcript) +
      "</p></div></section>" +
      '<h2>정량 지표</h2><section class="metrics"><div class="box"><span>정확 음절/분</span><b>' +
      report.correctSpm +
      '</b></div><div class="box"><span>전체 음절/분</span><b>' +
      report.rawSpm +
      '</b></div><div class="box"><span>0.8초 이상 쉼</span><b>' +
      report.longPauses +
      '회</b></div><div class="box"><span>가장 긴 쉼</span><b>' +
      report.longestPause.toFixed(1) +
      "초</b></div></section>" +
      "<h2>연음·음운변동 세부 확인</h2><table><thead><tr><th>표기</th><th>현상</th><th>기대 발음</th><th>들린 발음</th><th>판정</th><th>관찰</th></tr></thead><tbody>" +
      phonologyRows +
      "</tbody></table>" +
      "<h2>오류 및 유창성 관찰</h2><table><thead><tr><th>유형</th><th>목표</th><th>들림</th><th>관찰 내용</th></tr></thead><tbody>" +
      issueRows +
      '</tbody></table><h2>전문가 종합 의견</h2><div class="notes"></div>' +
      '<p class="notice">본 보고서는 AI 음성 분석을 활용한 교육적 참고 자료입니다. 주변 소음과 마이크 상태의 영향을 받을 수 있으며, 진단이나 중재 결정에는 전문가가 원음과 학생의 읽기 행동을 함께 확인해야 합니다.</p></body></html>';
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  function renderResult(reading, signal, transcript, assessment) {
    var wrap = document.querySelector("#tResult .ai-assessment");
    if (!wrap) return;
    var diff = alignWords(reading.targetText, transcript);
    var textIssues = diff.aligned.filter(function (word) {
      return word.status !== "same";
    });
    var aiIssues = Array.isArray(assessment.issues) ? assessment.issues : [];
    var phonologyChecks = Array.isArray(assessment.phonologyChecks)
      ? assessment.phonologyChecks
      : [];
    var errorSyllables = textIssues.reduce(function (sum, word) {
      return sum + cleanWord(word.target).length;
    }, 0);
    var correctSyllables = Math.max(0, reading.readSyllables - errorSyllables);
    var duration = Math.max(1, signal.duration || 1);
    var rawSpm = Math.round((reading.readSyllables * 60) / duration);
    var correctSpm = Math.round((correctSyllables * 60) / duration);

    var combinedIssues = aiIssues.slice();
    phonologyChecks
      .filter(function (check) {
        return check.status === "incorrect";
      })
      .forEach(function (check) {
        var exists = combinedIssues.some(function (issue) {
          return (
            issue.type === "pronunciation" &&
            cleanWord(issue.target) === cleanWord(check.written)
          );
        });
        if (!exists) {
          combinedIssues.push({
            target: check.written,
            heard: check.heardPronunciation,
            type: "pronunciation",
            explanation:
              '"' +
              check.written +
              '"은(는) [' +
              check.expectedPronunciation +
              "]로 읽어야 하지만 [" +
              (check.heardPronunciation || "다른 소리") +
              "]처럼 들렸습니다.",
          });
        }
      });
    textIssues.forEach(function (word) {
      var exists = combinedIssues.some(function (issue) {
        return (
          cleanWord(issue.target) === cleanWord(word.target) &&
          issue.type === word.status
        );
      });
      if (!exists) {
        combinedIssues.push({
          target: word.target,
          heard: word.heard,
          type: word.status,
          explanation:
            word.status === "omission"
              ? '"' + word.target + '"을(를) 빠뜨렸습니다.'
              : '"' + word.target + '"이(가) "' + word.heard + '"처럼 인식되었습니다.',
        });
      }
    });
    diff.insertions.forEach(function (word) {
      combinedIssues.push({
        target: "",
        heard: word,
        type: "insertion",
        explanation: '원문에 없는 "' + word + '"을(를) 덧붙여 읽었습니다.',
      });
    });

    var incorrectPhonology = phonologyChecks.filter(function (check) {
      return check.status === "incorrect";
    });
    var pronunciationFocus =
      incorrectPhonology.find(function (check) {
        return String(check.phenomenon || "").includes("연음");
      }) ||
      incorrectPhonology[0] ||
      null;
    var pronunciationIssue = aiIssues.find(function (issue) {
      return issue.type === "pronunciation";
    });
    var pronunciationPoint = pronunciationFocus
      ? '"' +
        pronunciationFocus.written +
        '" → [' +
        pronunciationFocus.expectedPronunciation +
        "]처럼 이어 읽기"
      : pronunciationIssue
        ? pronunciationIssue.explanation
        : "낱말 끝소리까지 지금처럼 또박또박 읽기";

    var nextSpeedGoal =
      correctSpm < rawSpm
        ? Math.max(correctSpm + 1, Math.min(rawSpm, correctSpm + 10))
        : correctSpm + 10;
    var speedPoint =
      correctSpm < rawSpm
        ? "다음 목표: 정확 " + nextSpeedGoal + "음절/분"
        : "다음 목표: 정확 " +
          Math.max(1, correctSpm - 5) +
          "~" +
          (correctSpm + 5) +
          "음절/분 유지";

    var phrasingExample = String(assessment.phrasingExample || "").trim();
    if (!phrasingExample) {
      var exampleWords = reading.targetText.split(/\s+/).filter(Boolean).slice(0, 9);
      var exampleGroups = [];
      for (var exampleIndex = 0; exampleIndex < exampleWords.length; exampleIndex += 3) {
        exampleGroups.push(exampleWords.slice(exampleIndex, exampleIndex + 3).join(" "));
      }
      phrasingExample = exampleGroups.join(" / ");
    }
    var phrasingPoint = phrasingExample
      ? "이렇게 읽기: " + phrasingExample
      : "뜻이 이어지는 낱말을 한 덩어리로 읽기";

    var confidenceLabel =
      assessment.confidence === "high"
        ? "분석 완료"
        : assessment.confidence === "medium"
          ? "선생님과 함께 확인"
          : "녹음을 다시 확인해 주세요";
    var report = {
      bookTitle:
        ((document.querySelector("h1") || {}).textContent || "읽기 자료").trim(),
      date: new Date().toLocaleString("ko-KR"),
      targetText: reading.targetText,
      transcript: transcript,
      pronunciationStars: Number(assessment.pronunciationStars) || 0.5,
      speedStars: Number(assessment.speedStars || assessment.fluencyStars) || 0.5,
      phrasingStars:
        Number(assessment.phrasingStars || assessment.fluencyStars) || 0.5,
      pronunciationSummary: assessment.pronunciationSummary,
      speedSummary: assessment.speedSummary || assessment.fluencySummary,
      phrasingSummary: assessment.phrasingSummary || assessment.fluencySummary,
      phrasingExample: phrasingExample,
      correctSpm: correctSpm,
      rawSpm: rawSpm,
      longPauses: signal.longPauses,
      longestPause: signal.longestPause || 0,
      phonologyChecks: phonologyChecks,
      issues: combinedIssues.slice(0, 24),
      confidence: confidenceLabel,
    };

    wrap.innerHTML =
      '<div class="ai-head ai-child-head"><div><span>AI 읽기 코치</span><h3>🌱 유창성 확인</h3></div><span class="ai-confidence">' +
      confidenceLabel +
      "</span></div>" +
      '<div class="ai-ratings ai-three-ratings">' +
      starBlock(
        "발음",
        assessment.pronunciationStars,
        assessment.pronunciationSummary,
        "👄",
        "sound",
        null,
        pronunciationPoint,
      ) +
      starBlock(
        "속도",
        assessment.speedStars || assessment.fluencyStars,
        assessment.speedSummary || assessment.fluencySummary,
        "⏱",
        "speed",
        {
          primary: correctSpm + " 음절/분",
          secondary: "정확히 읽은 속도 · 전체 " + rawSpm + " 음절/분",
        },
        speedPoint,
      ) +
      starBlock(
        "끊어읽기",
        assessment.phrasingStars || assessment.fluencyStars,
        assessment.phrasingSummary || assessment.fluencySummary,
        "〰",
        "phrasing",
        null,
        phrasingPoint,
      ) +
      "</div>" +
      '<div class="ai-child-actions"><button type="button" class="ai-report-button">📄 전문가용 보고서 보기</button><span>자세한 발음·속도·끊어읽기 자료는 보고서에 담았어요.</span></div>' +
      '<p class="ai-note">음성인식 결과는 주변 소음과 마이크 상태의 영향을 받을 수 있어요. 중요한 부분은 선생님과 녹음을 함께 들어 보세요.</p>';

    var reportButton = wrap.querySelector(".ai-report-button");
    if (reportButton) {
      reportButton.onclick = function () {
        openExpertReport(report);
      };
    }

    markPassage(
      reading,
      diff.aligned,
      aiIssues.concat(
        phonologyChecks
          .filter(function (check) {
            return check.status === "incorrect";
          })
          .map(function (check) {
            return { type: "pronunciation", target: check.written };
          }),
      ),
    );
    wrap.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function runAssessment(blob, reading) {
    pendingContext = { blob: blob, reading: reading };
    setLoading();
    try {
      var prepared = await prepareAudio(blob);
      var signalSummary = JSON.stringify({
        speech_seconds: Number(prepared.signal.duration.toFixed(2)),
        voiced_seconds: Number(prepared.signal.voicedDuration.toFixed(2)),
        long_pause_count: prepared.signal.longPauses,
        longest_pause_seconds: Number(prepared.signal.longestPause.toFixed(2)),
        long_pause_total_seconds: Number(prepared.signal.pauseDuration.toFixed(2)),
        selected_syllables: reading.readSyllables,
      });
      var form = new FormData();
      form.append("audio", prepared.wav, "reading.wav");
      form.append("targetText", reading.targetText);
      form.append("signalSummary", signalSummary);
      var response = await fetch("/api/reading-assessment", {
        method: "POST",
        body: form,
      });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || "음성 분석에 실패했습니다.");
      renderResult(reading, prepared.signal, data.transcript, data.assessment);
    } catch (error) {
      showError(
        error && error.message
          ? error.message
          : "인터넷 연결과 마이크 상태를 확인한 뒤 다시 시도해 주세요.",
      );
    }
  }

  function maybeAnalyze() {
    var result = document.getElementById("tResult");
    if (!result || result.style.display === "none") return;
    var reading = getSelectedReading();
    if (!reading || !reading.targetText) return;
    var recordingId =
      window.OcRec && window.OcRec.currentId
        ? window.OcRec.currentId
        : reading.startIndex + "-" + reading.endIndex;
    if (recordingId === analyzedRecording) return;
    analyzedRecording = recordingId;
    waitForRecording(function (blob) {
      runAssessment(blob, reading);
    });
  }

  function attach() {
    var result = document.getElementById("tResult");
    if (!result) {
      setTimeout(attach, 150);
      return;
    }
    new MutationObserver(function () {
      setTimeout(maybeAnalyze, 50);
    }).observe(result, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["style"],
    });
    var reset = document.getElementById("tReset");
    if (reset) {
      reset.addEventListener("click", function () {
        pendingContext = null;
        document
          .querySelectorAll("#tPassage .tsyl")
          .forEach(function (syllable) {
            syllable.classList.remove(
              "ai-reading-error",
              "ai-reading-pronunciation",
            );
          });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
})();
