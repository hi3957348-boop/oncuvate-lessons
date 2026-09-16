/* 읽기 연습 구간의 **머문 시간**을 잰다.
 *
 * 왜 재는가
 *  - 나누어 읽기·확장 읽기 듣기 단계에는 API 평가가 없다. 아이가 「읽었어요/다음」을
 *    누르는 것 말고는 남는 것이 없어, **정말 읽었는지 그냥 눌렀는지**를 알 수 없다.
 *  - 가장 분명한 단서는 **모델 소리가 끝나기도 전에 눌렀는가**다. 그다음이
 *    소리가 끝난 뒤 실제로 읽을 만한 시간이 흘렀는가.
 *
 * ⚠️ 여기서 **판정하지 않는다.** 통합규격 §10.5대로 속도는 참고치이고,
 *    「기계적으로 눌렀다」는 판단은 사람(코치)이 여러 회차를 보고 내릴 몫이다.
 *    그래서 이 파일은 **숫자와 사실만** 내보낸다.
 *
 * 쓰는 법
 *   ONQ_PACING.show(key)       — 문항이 화면에 뜬 순간
 *   ONQ_PACING.audioEnd(key)   — 모델 소리가 끝난 순간
 *   ONQ_PACING.replay(key)     — 「들어보기」를 누른 순간
 *   ONQ_PACING.take(key)       — 「다음/읽었어요」를 누른 순간. 잰 값을 돌려주고 지운다.
 */
(() => {
  "use strict";

  const marks = new Map();

  const now = () => performance.now();

  function show(key) {
    marks.set(key, { shownAt: now(), audioEndedAt: 0, replays: 0, audioPlayed: false });
  }

  function audioStart(key) {
    const mark = marks.get(key);
    if (mark) { mark.audioPlayed = true; mark.audioEndedAt = 0; }
  }

  function audioEnd(key) {
    const mark = marks.get(key);
    if (mark) mark.audioEndedAt = now();
  }

  function replay(key) {
    const mark = marks.get(key);
    if (mark) mark.replays += 1;
  }

  /** 잰 값을 돌려주고 지운다. 표시가 없으면 null — 부른 쪽이 그냥 빼면 된다. */
  function take(key) {
    const mark = marks.get(key);
    if (!mark) return null;
    marks.delete(key);
    const pressedAt = now();
    const out = {
      elapsed_ms: Math.round(pressedAt - mark.shownAt),
      replays: mark.replays,
    };
    if (mark.audioPlayed) {
      // 소리가 아직 안 끝났는데 눌렀다 — 들을 시간조차 없었다는 사실만 적는다.
      out.heard_full = Boolean(mark.audioEndedAt);
      if (mark.audioEndedAt) out.after_audio_ms = Math.round(pressedAt - mark.audioEndedAt);
    }
    return out;
  }

  window.ONQ_PACING = Object.freeze({ show, audioStart, audioEnd, replay, take });
})();
