(() => {
  "use strict";

  const rows = [
    ["곳이", ["멋이", "잣이", "벗이", "엿이", "못이"]],
    ["위험한", ["위험해", "위험하지", "위험하고", "위험할지도", "위험합니다"]],
    ["생겼지만", ["생겼어요", "생겼다", "생겼고", "생겼거든", "생겼더라"]],
    ["상관없어요", ["문제없어요", "쓸모없어요", "필요없어요", "재미없어요", "소용없어요"]],
    ["즐거워요", ["고마워요", "뜨거워요", "귀여워요", "부러워요", "가벼워요"]],
    ["친구니까요", ["더우니까요", "추우니까요", "바쁘니까요", "좋으니까요", "싫으니까요"]],
    ["기린이에요", ["어린이에요", "물건이에요", "공원이에요", "병원이에요", "학원이에요"]],
    ["가렵지만", ["부럽지만", "서럽지만", "그립지만", "더럽지만", "어렵지만"]],
    ["긁어", ["긁은", "긁을", "긁고", "긁지", "긁다"]],
    ["시원해", ["시원한", "시원하지", "시원하고", "시원할지도", "시원합니다"]],
    ["얼룩말", ["속마음", "백만원", "악몽", "식물", "먹물"]],
    ["듣는", ["받는", "닫는", "걷는", "젖는", "믿는"]]
  ];

  const targets = rows.map(([target, expansions], index) => Object.freeze({
    id: `s02-target-${String(index + 1).padStart(2, "0")}`,
    target,
    expansions: Object.freeze([...expansions])
  }));

  window.ONQ_SESSION02_TARGET_EXPANSIONS = Object.freeze(targets);
  const lesson = window.ONQ_CONTENT_PACK?.sessions?.session02;
  if (lesson) lesson.readingTargets = window.ONQ_SESSION02_TARGET_EXPANSIONS;
})();
