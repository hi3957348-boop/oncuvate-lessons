/* 음성 평가 남용 막기 — 평가 배관을 감싸서 모든 활동에 한 번에 건다.
 *
 * 호출부(젤리몬·순서 맞추기·문장 읽기·글 읽기·확장 읽기)를 하나씩 고치지 않는다.
 * 그쪽은 다섯 군데로 흩어져 있어 한 곳을 빠뜨리면 그 자리만 조용히 뚫린다.
 * 여기서 `ONQ_OPENAI_PARAGRAPH_ASSESSOR`를 감싸면 **부르는 모든 길**이 같은 문을 지난다.
 *
 * 거는 것 둘 (2026-08-23 결정):
 *   ① 같은 목표는 **하루 5번**까지 평가한다. 다음 날 다시 도전할 수 있다.
 *      **두 번을 넘기면 「이제 넘어가도 좋다」**고 화면이 권한다(상한이 아니라 권유).
 *      「다시 읽기」 자체는 막지 않는다 — 읽는 것은 얼마든지 하고, **보내는 것만** 멈춘다.
 *   ② **0.7초 미만 녹음은 보내지 않는다.** 잘못 눌러 생기는 빈 호출을 막는다.
 *
 * ⚠️ 이것은 **실수와 습관적 남용**을 막는 것이지 진짜 방어가 아니다.
 *    브라우저에서 도는 코드라 개발자 도구로 우회할 수 있다(규격 5-3과 같은 이유).
 *    의도적 남용은 서버가 막아야 한다 — 학습 기록의 「아이당 일일 상한」과 같은 것을
 *    음성 평가에도 걸어 달라고 45번으로 요청한다.
 */
(() => {
  "use strict";

  const CONTENT_ID = document.documentElement.dataset.lessonId || "lesson";
  // 하루 같은 목표에 대해 — 상한 5번, 2번 뒤부터는 넘어가도 좋다고 권한다.
  // 2번만 주면 마이크가 한 번 헛돌았을 때 남는 것이 한 번뿐이라 아이가 쫓긴다.
  // 5번은 상한이지 목표가 아니다. 설계원칙의 「3회에는 중단·지원 전환」과 같은 방향이다.
  const PER_TARGET_PER_DAY = 5;
  const ENOUGH = 2;
  const MIN_MS = 700;

  const today = () => new Date().toISOString().slice(0, 10);   // 하루 단위로 갈린다
  const budgetKey = () => `${CONTENT_ID}:assess:${today()}`;   // 규격 5-6 — 식별자 접두사

  // 목표 문장을 그대로 저장하지 않는다 — 짧은 지문만 남긴다.
  function fingerprint(target) {
    const text = String(target || "").replace(/\s+/g, " ").trim();
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
    return `${text.length}-${(hash >>> 0).toString(36)}`;
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(budgetKey()) || "{}"); } catch (_) { return {}; }
  }
  function save(counts) {
    try {
      // 어제 것은 남겨 둘 이유가 없다 — 오늘 칸만 두고 옛 칸은 지운다.
      Object.keys(localStorage)
        .filter(k => k.startsWith(`${CONTENT_ID}:assess:`) && k !== budgetKey())
        .forEach(k => localStorage.removeItem(k));
      localStorage.setItem(budgetKey(), JSON.stringify(counts));
    } catch (_) { /* 저장소가 막혀도 평가는 돈다 */ }
  }

  const used = target => Number(load()[fingerprint(target)] || 0);
  const left = target => Math.max(0, PER_TARGET_PER_DAY - used(target));

  function spend(target) {
    const counts = load();
    const key = fingerprint(target);
    counts[key] = Number(counts[key] || 0) + 1;
    save(counts);
  }

  // 아이에게 하는 말이라 「막혔다」가 아니라 「다음에 또 하자」로 적는다.
  function overBudgetMessage() {
    return "오늘은 이만큼 살펴봤어요. 읽기 연습은 계속할 수 있어요.";
  }

  let wrapped = null;
  let startedAt = 0;
  let startedTarget = "";

  function wrap(assessor) {
    if (!assessor || assessor.__onqBudget) return assessor;
    const original = { start: assessor.start, finish: assessor.finish };

    assessor.start = async function (options) {
      const target = options?.target || "";
      if (left(target) <= 0) throw new Error(overBudgetMessage());
      startedAt = performance.now();
      startedTarget = target;
      return original.start.call(this, options);
    };

    assessor.finish = async function (options) {
      const target = options?.target || startedTarget;
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_MS) {
        // 보내지 않는다. 「못 쟀음」으로 남는 것이 「A0」로 남는 것보다 정확하다.
        try { this.release?.(); } catch (_) { /* 무시 */ }
        throw new Error("조금 더 길게 읽어 볼까요.");
      }
      if (left(target) <= 0) throw new Error(overBudgetMessage());
      spend(target);
      return original.finish.call(this, options);
    };

    assessor.__onqBudget = true;
    return assessor;
  }

  // 배관은 늦게 실릴 수 있다 — 나타날 때까지 지켜보다가 감싼다.
  function attach() {
    const assessor = window.ONQ_OPENAI_PARAGRAPH_ASSESSOR;
    if (assessor && assessor !== wrapped) wrapped = wrap(assessor);
  }
  attach();
  const timer = window.setInterval(attach, 400);
  window.setTimeout(() => window.clearInterval(timer), 15000);

  // 코치 콘솔·검수가 읽는다
  window.ONQ_ASSESS_BUDGET = Object.freeze({
    perTargetPerDay: PER_TARGET_PER_DAY,
    enough: ENOUGH,
    minMs: MIN_MS,
    left,
    used,
    // 두 번을 넘겼는가 — 「이제 넘어가도 좋다」를 화면이 판단하는 자리
    isEnough: target => used(target) >= ENOUGH,
    today: () => load(),
    total: () => Object.values(load()).reduce((sum, n) => sum + Number(n || 0), 0)
  });
})();
