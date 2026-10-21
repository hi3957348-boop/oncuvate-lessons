/* 이야기 차례 — 인지훈련게임 「차례대로 놓기」 엔진(release/step-order.js)에 넣는 판. _tools/sets 의 STORY_ORDER 에서 만든다. */
window.ONQ_STORY_ORDER = {
  "activityId": "game.story_order",
  "credit": "자체 제작 · 활동 방식 참고: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 「순서 찾기」 · 이야기: 사자와 토끼",
  "texts": {
    "title": "이야기 차례",
    "ready": "이야기에서 일어난 차례대로 카드를 놓아요.",
    "first": "가장 먼저 일어난 일은 무엇일까요?",
    "middle": "그다음에는 무슨 일이 있었나요?",
    "last": "마지막에는 무슨 일이 있었나요?",
    "miss": "그건 조금 뒤에 일어난 일이에요. 바로 다음 일을 찾아봐요."
  },
  "rounds": [
    {
      "id": "r1",
      "items": [
        {
          "id": "r1-promise",
          "title": "동물들의 약속",
          "icon": "🤝",
          "steps": [
            {
              "icon": "🦁",
              "text": "날마다 동물을 잡아요"
            },
            {
              "icon": "🐾",
              "text": "동물들이 말해요"
            },
            {
              "icon": "☝️",
              "text": "한 마리씩 갈게요"
            },
            {
              "icon": "🐰",
              "text": "토끼 차례예요"
            }
          ]
        }
      ]
    },
    {
      "id": "r2",
      "items": [
        {
          "id": "r2-trick",
          "title": "토끼의 꾀",
          "icon": "💡",
          "steps": [
            {
              "icon": "🐢",
              "text": "일부러 천천히 가요"
            },
            {
              "icon": "😠",
              "text": "사자가 화를 내요"
            },
            {
              "icon": "🗣️",
              "text": "다른 사자가 막았어요"
            },
            {
              "icon": "💧",
              "text": "우물로 가요"
            }
          ]
        }
      ]
    },
    {
      "id": "r3",
      "items": [
        {
          "id": "r3-story",
          "title": "사자와 토끼 이야기",
          "icon": "📖",
          "steps": [
            {
              "icon": "🦁",
              "text": "사나운 사자가 살아요"
            },
            {
              "icon": "🐰",
              "text": "토끼가 천천히 가요"
            },
            {
              "icon": "💧",
              "text": "우물에 모습이 비쳐요"
            },
            {
              "icon": "💦",
              "text": "우물로 뛰어들어요"
            },
            {
              "icon": "🌳",
              "text": "모두 안전해요"
            }
          ]
        }
      ]
    }
  ]
};
