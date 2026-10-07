/* 이야기 차례 — 인지훈련게임 「차례대로 놓기」 엔진(release/step-order.js)에 넣는 판. _tools/sets 의 STORY_ORDER 에서 만든다. */
window.ONQ_STORY_ORDER = {
  "activityId": "game.story_order",
  "credit": "자체 제작 · 활동 방식 참고: 『느린 학습자 인지훈련 프로그램』(박현숙, 2021) 「순서 찾기」 · 이야기: 돌멩이 수프",
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
          "id": "r1-begin",
          "title": "나그네가 왔어요",
          "icon": "🚶",
          "steps": [
            {
              "icon": "🚪",
              "text": "문을 두드려요"
            },
            {
              "icon": "🙅",
              "text": "문을 꼭 닫아요"
            },
            {
              "icon": "🔥",
              "text": "불을 피워요"
            },
            {
              "icon": "🥌",
              "text": "돌멩이를 넣어요"
            }
          ]
        }
      ]
    },
    {
      "id": "r2",
      "items": [
        {
          "id": "r2-pot",
          "title": "냄비에 들어간 차례",
          "icon": "🍲",
          "steps": [
            {
              "icon": "🥌",
              "text": "둥근 돌멩이"
            },
            {
              "icon": "🥕",
              "text": "당근"
            },
            {
              "icon": "🥔",
              "text": "감자"
            },
            {
              "icon": "🧂",
              "text": "양파·고기·소금"
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
          "title": "돌멩이 수프 이야기",
          "icon": "📖",
          "steps": [
            {
              "icon": "🚶",
              "text": "나그네가 와요"
            },
            {
              "icon": "🍲",
              "text": "수프를 끓여요"
            },
            {
              "icon": "🙋",
              "text": "재료를 보태요"
            },
            {
              "icon": "🥣",
              "text": "둘러앉아 먹어요"
            },
            {
              "icon": "👋",
              "text": "나그네가 떠나요"
            }
          ]
        }
      ]
    }
  ]
};
