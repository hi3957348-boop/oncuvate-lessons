/* 문장 자라기 — 같은 장면 문장이 단계마다 자란다. _tools/sets 의 GROW(여섯 단계) 에서 STAGE 에 맞춰 make_lesson.py 가 고른다.
 * 줄 글은 음성 목록(tools/collect-aoede-texts.mjs)도 읽는다. */
window.ONQ_SENTENCE_GROW = {
  "level": 2,
  "scenes": [
    {
      "pic": "assets/book/art/page-01-art.webp",
      "alt": "숲 속 바위 아래 모인 동물들과 멀리 굴 앞에 앉아 있는 사자",
      "rungs": [
        {
          "lv": 1,
          "text": "사자는 동물을 잡아요."
        },
        {
          "lv": 2,
          "text": "사자는 날마다 동물을 잡아요.",
          "today": true
        },
        {
          "lv": 3,
          "text": "사자는 날마다 동물들을 잡았어요.",
          "challenge": true
        }
      ]
    },
    {
      "pic": "assets/book/art/page-03-art.webp",
      "alt": "토끼가 돌로 쌓은 우물 가에 앞발을 얹고 물속을 들여다보는 모습",
      "rungs": [
        {
          "lv": 1,
          "text": "토끼는 천천히 가요."
        },
        {
          "lv": 2,
          "text": "토끼는 일부러 천천히 가요.",
          "today": true
        },
        {
          "lv": 3,
          "text": "토끼는 일부러 천천히 갔어요.",
          "challenge": true
        }
      ]
    },
    {
      "pic": "assets/book/art/page-04-art.webp",
      "alt": "해 질 녘 굴 앞에서 화난 사자에게 웅크린 토끼가 말하는 모습",
      "rungs": [
        {
          "lv": 1,
          "text": "“자기가 왕이래요.”"
        },
        {
          "lv": 2,
          "text": "“자기가 숲의 왕이래요.”",
          "today": true
        }
      ]
    },
    {
      "pic": "assets/book/art/page-06-art.webp",
      "alt": "사자가 우물 가에 앞발을 얹고 들여다보고, 물에 사자 얼굴이 비친 모습",
      "rungs": [
        {
          "lv": 1,
          "text": "우물 안에 사자가 있어요!"
        },
        {
          "lv": 2,
          "text": "우물에 자기 모습이 비쳐요.",
          "today": true
        },
        {
          "lv": 3,
          "text": "물속에 자기 모습이 비쳤어요.",
          "challenge": true
        }
      ]
    }
  ]
};
