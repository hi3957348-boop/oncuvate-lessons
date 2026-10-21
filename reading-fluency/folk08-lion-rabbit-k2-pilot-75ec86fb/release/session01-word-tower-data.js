/* 낱말 탑 쌓기 — 탑 블록(아래→위)·함정·번개 탑 보기. _tools/sets 의 세트 파일 TOWER 에서 만든다.
 * 블록 덩이는 음성 목록(tools/collect-aoede-texts.mjs)도 읽는다 — 덩이마다 Aoede 클립이 생긴다. */
window.ONQ_WORD_TOWER = {
  "activityId": "game.word_tower",
  "flash": {
    "startMs": 1500,
    "endMs": 800,
    "minMs": 700
  },
  "words": [
    {
      "w": "숲에",
      "chunks": [
        "숲",
        "숲에"
      ],
      "lures": [
        [
          "숲애",
          "vowelSwap"
        ]
      ],
      "flash": [
        [
          "수페",
          "soundSpelling"
        ],
        [
          "숩에",
          "codaSwap"
        ]
      ],
      "eq": [
        "숲",
        "에",
        "[수페]"
      ],
      "tip": "ㅍ 받침이 뒤로 넘어가요. [수페]",
      "rule": "liaison",
      "focus": "숲에"
    },
    {
      "w": "잡아요",
      "chunks": [
        "잡아",
        "잡아요"
      ],
      "lures": [
        [
          "잡아오",
          "vowelSwap"
        ]
      ],
      "flash": [
        [
          "자바요",
          "soundSpelling"
        ],
        [
          "잠아요",
          "codaSwap"
        ]
      ],
      "eq": [
        "잡",
        "아",
        "[자바]"
      ],
      "tip": "ㅂ 받침이 뒤로 넘어가요. [자바요]",
      "rule": "liaison",
      "focus": "잡아"
    },
    {
      "w": "동물들이",
      "chunks": [
        "동물",
        "동물들",
        "동물들이"
      ],
      "lures": [
        [
          "동문들",
          "codaSwap"
        ],
        [
          "동물드리",
          "soundSpelling"
        ]
      ],
      "flash": [
        [
          "동물드리",
          "soundSpelling"
        ],
        [
          "동문들이",
          "codaSwap"
        ]
      ],
      "eq": [
        "들",
        "이",
        "[드리]"
      ],
      "tip": "ㄹ 받침이 뒤로 넘어가요. [동물드리]",
      "rule": "liaison",
      "focus": "들이"
    },
    {
      "w": "갈게요",
      "chunks": [
        "갈게",
        "갈게요"
      ],
      "lures": [
        [
          "갈께요",
          "soundSpelling"
        ]
      ],
      "flash": [
        [
          "갈께요",
          "soundSpelling"
        ],
        [
          "갈개요",
          "vowelSwap"
        ]
      ],
      "eq": [
        "갈",
        "게",
        "[갈께]"
      ],
      "tip": "‘게’가 된소리로 나요. [갈께요]",
      "rule": "tensification",
      "focus": "갈게"
    },
    {
      "w": "모습이",
      "chunks": [
        "모습",
        "모습이"
      ],
      "lures": [
        [
          "모스비",
          "soundSpelling"
        ]
      ],
      "flash": [
        [
          "모스비",
          "soundSpelling"
        ],
        [
          "모슴이",
          "codaSwap"
        ]
      ],
      "eq": [
        "습",
        "이",
        "[스비]"
      ],
      "tip": "ㅂ 받침이 뒤로 넘어가요. [모스비]",
      "rule": "liaison",
      "focus": "습이"
    },
    {
      "w": "우물에서도",
      "chunks": [
        "우물",
        "우물에",
        "우물에서도"
      ],
      "lures": [
        [
          "우무레",
          "soundSpelling"
        ],
        [
          "우물애서도",
          "vowelSwap"
        ]
      ],
      "flash": [
        [
          "우무레서도",
          "soundSpelling"
        ],
        [
          "우문에서도",
          "codaSwap"
        ]
      ],
      "eq": [
        "물",
        "에",
        "[무레]"
      ],
      "tip": "ㄹ 받침이 뒤로 넘어가요. [우무레서도]",
      "rule": "liaison",
      "focus": "물에"
    },
    {
      "w": "뛰어들어요",
      "chunks": [
        "뛰어",
        "뛰어들어",
        "뛰어들어요"
      ],
      "lures": [
        [
          "뛰어드러",
          "soundSpelling"
        ],
        [
          "뛰어들어오",
          "vowelSwap"
        ]
      ],
      "flash": [
        [
          "뛰어드러요",
          "soundSpelling"
        ],
        [
          "띄어들어요",
          "vowelSwap"
        ]
      ],
      "eq": [
        "들",
        "어",
        "[드러]"
      ],
      "tip": "ㄹ 받침이 뒤로 넘어가요. [뛰어드러요]",
      "rule": "liaison",
      "focus": "들어"
    },
    {
      "w": "덕분에",
      "chunks": [
        "덕분",
        "덕분에"
      ],
      "lures": [
        [
          "덕뿌네",
          "soundSpelling"
        ]
      ],
      "flash": [
        [
          "덕뿌네",
          "soundSpelling"
        ],
        [
          "덕붐에",
          "codaSwap"
        ]
      ],
      "eq": [
        "덕",
        "분",
        "[덕뿐]"
      ],
      "tip": "‘분’이 된소리 [뿐]으로 나고, ㄴ 받침이 넘어가요. [덕뿌네]",
      "rule": "tensification",
      "focus": "덕분"
    }
  ]
};
