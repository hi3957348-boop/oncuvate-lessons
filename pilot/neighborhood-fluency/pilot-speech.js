// 파일럿 전용 — 음성 판정 시험대 (Azure 발음평가)
// ⚠️ 납품본에 넣지 않습니다. 규격 4장(외부 전송 금지)·5장(키를 파일에 넣지 않음) 때문입니다.
//
// 콘텐츠는 이미 「목표 텍스트 + 보정 규칙」을 담아 평가를 요청하고 결과를 기다립니다.
// 이 파일은 그 사이만 메웁니다 — app.js는 이 파일의 존재를 모릅니다.
//   받는 것: oncuvate:generalization-evaluation-request · oncuvate:reading-evaluation-request
//   주는 것: oncuvate:evaluation-result { result: 'accurate' | 'support' }
//
// 🔑 구독 키는 **이 화면에서 입력받아 브라우저 안에만** 둡니다(sessionStorage).
//    공개 저장소에 올라가는 파일이라 키를 적어 두면 그대로 노출됩니다. 창을 닫으면 지워집니다.
(() => {
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@1.41.0/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js';
  const STORE_KEY = 'neighborhood-fluency-pilot:azure';
  const LANG = 'ko-KR';

  let sdk = null;
  let sdkLoading = null;
  let recognizer = null;
  let panelOpen = false;
  let status = '대기';
  let pending = null;      // 지금 판정 중인 요청
  let last = null;         // 마지막 결과 — 인식률을 눈으로 보려고 남긴다
  let tryText = '책방';    // 「바로 시험」에 넣어 둘 목표 텍스트

  function creds() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
  }

  function loadSdk() {
    if (sdk) return Promise.resolve(sdk);
    if (sdkLoading) return sdkLoading;
    sdkLoading = new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = SDK_URL;
      tag.onload = () => { sdk = window.SpeechSDK; sdk ? resolve(sdk) : reject(new Error('sdk-missing')); };
      tag.onerror = () => reject(new Error('sdk-load-failed'));
      document.head.appendChild(tag);
    });
    return sdkLoading;
  }

  // 마이크를 먼저 명시적으로 연다. SDK에 맡기면 거부·미연결이 조용히 실패로만 나와
  // 「버튼이 안 뜬다」의 원인을 알 수 없다.
  async function ensureMic() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('이 브라우저는 마이크를 지원하지 않습니다');
    if (!window.isSecureContext) throw new Error('https 또는 localhost에서만 마이크가 열립니다');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 권한만 확인하고 바로 놓아준다 — SDK가 자기 스트림을 다시 연다.
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      if (error.name === 'NotAllowedError') throw new Error('마이크가 차단돼 있습니다 — 주소창 자물쇠 → 사이트 설정 → 마이크 허용');
      if (error.name === 'NotFoundError') throw new Error('마이크를 찾지 못했습니다 — 장치가 연결돼 있는지 확인해 주세요');
      throw new Error(`마이크를 열지 못했습니다 (${error.name})`);
    }
  }

  // 목표 텍스트를 주고 그것과 대조해 채점한다 — 자유 받아쓰기가 아니다.
  async function assess(referenceText) {
    const cred = creds();
    if (!cred?.key || !cred?.region) throw new Error('no-credentials');
    const S = await loadSdk();

    const speechConfig = S.SpeechConfig.fromSubscription(cred.key, cred.region);
    speechConfig.speechRecognitionLanguage = LANG;
    const audioConfig = S.AudioConfig.fromDefaultMicrophoneInput();
    const paConfig = new S.PronunciationAssessmentConfig(
      referenceText,
      S.PronunciationAssessmentGradingSystem.HundredMark,
      S.PronunciationAssessmentGranularity.Word,
      true // enableMiscue — 빠뜨리거나 덧붙여 읽은 것을 잡는다
    );

    recognizer = new S.SpeechRecognizer(speechConfig, audioConfig);
    paConfig.applyTo(recognizer);

    return new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(result => {
        try {
          if (result.reason !== S.ResultReason.RecognizedSpeech) {
            resolve({ recognized: '', scores: null, reason: String(result.reason) });
            return;
          }
          const pa = S.PronunciationAssessmentResult.fromResult(result);
          resolve({
            recognized: result.text || '',
            scores: {
              accuracy: pa.accuracyScore,
              fluency: pa.fluencyScore,
              completeness: pa.completenessScore,
              pronunciation: pa.pronunciationScore
            },
            words: (pa.detailResult?.Words || []).map(w => ({
              word: w.Word,
              score: w.PronunciationAssessment?.AccuracyScore ?? null,
              errorType: w.PronunciationAssessment?.ErrorType || 'None'
            }))
          });
        } catch (error) { reject(error); }
        finally { recognizer?.close(); recognizer = null; }
      }, error => {
        recognizer?.close(); recognizer = null;
        reject(new Error(String(error)));
      });
    });
  }

  function answer(result) {
    window.dispatchEvent(new CustomEvent('oncuvate:evaluation-result', { detail: { result } }));
  }

  async function handleRequest(detail, referenceText) {
    if (!referenceText) return;
    if (detail?.evaluationEnabled === false) return;
    if (!creds()) { status = '키를 먼저 넣어 주세요'; panelOpen = true; render(); return; }

    try { await ensureMic(); }
    catch (error) { status = error.message; panelOpen = true; render(); return; }

    pending = {
      reference: referenceText,
      mode: detail?.mode || '',
      level: detail?.level || '',
      rules: detail?.correctionRules || null
    };
    status = '듣는 중 — 지금 읽어 주세요';
    panelOpen = true;
    render();

    try {
      const outcome = await assess(referenceText);
      // 합격선은 콘텐츠가 보내 준 보정 규칙을 그대로 쓴다(유사도 75%).
      // ⚠️ 「스스로 고쳐 읽음」은 점수로 알 수 없다 — 다시 읽었는지는 채점기가 말해 주지 않는다.
      //    그래서 여기서는 정확/도움필요 둘로만 답하고, 자기수정 판정은 코치 몫으로 둔다.
      const bar = Math.round((detail?.correctionRules?.minimumSimilarity ?? 0.75) * 100);
      const accuracy = outcome.scores?.accuracy ?? 0;
      last = { ...outcome, reference: referenceText, bar, at: new Date().toLocaleTimeString('ko-KR') };
      status = outcome.scores ? '판정 완료' : `못 알아들었어요 (${outcome.reason})`;
      // 직접 시험은 콘텐츠 진행을 건드리지 않는다 — 재 보기만 하는 자리다.
      if (!detail?.silent) answer(outcome.scores && accuracy >= bar ? 'accurate' : 'support');
    } catch (error) {
      status = error.message === 'no-credentials' ? '키를 먼저 넣어 주세요' : `실패: ${error.message}`;
      last = null;
    } finally {
      pending = null;
      render();
    }
  }

  // T1 낱말·T3 문장은 item, 오늘 읽은 글 전체는 text로 온다.
  window.addEventListener('oncuvate:generalization-evaluation-request', event => {
    handleRequest(event.detail || {}, event.detail?.item);
  });
  window.addEventListener('oncuvate:reading-evaluation-request', event => {
    handleRequest(event.detail || {}, event.detail?.text);
  });

  // ── 시험대 화면 ────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.className = 'speech-lab';
  document.body.appendChild(host);

  function esc(text) {
    return String(text ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function wordChips(words) {
    if (!words?.length) return '';
    return `<div class="speech-lab-words">${words.map(w => {
      const bad = w.errorType && w.errorType !== 'None';
      return `<span class="${bad ? 'miss' : ''}">${esc(w.word)}<b>${w.score === null ? '–' : Math.round(w.score)}</b></span>`;
    }).join('')}</div>`;
  }

  function render() {
    const cred = creds();
    if (!panelOpen) {
      host.innerHTML = `<button class="speech-lab-toggle" data-speech="open">🎤 음성판정 ${cred ? '' : '· 키 필요'}</button>`;
      return;
    }
    host.innerHTML = `<section class="speech-lab-panel">
      <header><strong>음성판정 시험대</strong><button data-speech="close" aria-label="닫기">✕</button></header>
      <p class="speech-lab-status">${esc(status)}</p>
      ${cred
        ? `<p class="speech-lab-cred">지역 <b>${esc(cred.region)}</b> · 키는 이 창에만 있습니다<button data-speech="forget">키 지우기</button></p>`
        : `<div class="speech-lab-form">
             <label>구독 키<input type="password" data-speech-key autocomplete="off" placeholder="Azure Speech 키"></label>
             <label>지역<input type="text" data-speech-region autocomplete="off" placeholder="koreacentral" value="koreacentral"></label>
             <button data-speech="save">저장</button>
             <small>브라우저 안에만 저장되고 창을 닫으면 지워집니다. 어디로도 보내지 않습니다.</small>
           </div>`}
      ${cred ? `<div class="speech-lab-try">
        <label>바로 시험<input type="text" data-speech-try value="${esc(tryText)}" placeholder="읽을 낱말이나 문장"></label>
        <button data-speech="try" ${pending ? 'disabled' : ''}>${pending ? '듣는 중…' : '누르고 읽기'}</button>
        <small>수업 흐름과 무관하게 지금 바로 마이크를 열어 재 봅니다.</small>
      </div>` : ''}
      ${last ? `<div class="speech-lab-result">
        <div><span>목표</span><b>${esc(last.reference)}</b></div>
        <div><span>들린 것</span><b class="${last.recognized ? '' : 'miss'}">${esc(last.recognized || '(없음)')}</b></div>
        ${last.scores ? `<div class="speech-lab-scores">
          <i>정확도 <b>${Math.round(last.scores.accuracy)}</b></i>
          <i>유창성 <b>${Math.round(last.scores.fluency)}</b></i>
          <i>완성도 <b>${Math.round(last.scores.completeness)}</b></i>
          <i>합격선 ${last.bar}</i>
        </div>` : ''}
        ${wordChips(last.words)}
        <small>${esc(last.at)}</small>
      </div>` : ''}
    </section>`;
  }

  host.addEventListener('click', event => {
    const action = event.target.closest('[data-speech]')?.dataset.speech;
    if (!action) return;
    if (action === 'open') { panelOpen = true; render(); }
    else if (action === 'close') { panelOpen = false; render(); }
    else if (action === 'forget') { sessionStorage.removeItem(STORE_KEY); status = '키를 지웠습니다'; render(); }
    else if (action === 'try') {
      tryText = host.querySelector('[data-speech-try]')?.value.trim() || tryText;
      // 수업 흐름과 무관한 직접 시험 — 콘텐츠에 결과를 돌려보내지 않는다.
      handleRequest({ mode: 'manual-test', correctionRules: { minimumSimilarity: .75 }, silent: true }, tryText);
    }
    else if (action === 'save') {
      const key = host.querySelector('[data-speech-key]')?.value.trim();
      const region = host.querySelector('[data-speech-region]')?.value.trim();
      if (!key || !region) { status = '키와 지역을 모두 넣어 주세요'; render(); return; }
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ key, region }));
      status = '준비됐습니다 — 읽기 활동에서 자동으로 판정합니다';
      render();
    }
  });

  render();
})();
