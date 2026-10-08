/* 낱말 탑 쌓기 — 탑 블록(아래→위)·함정·번개 탑 보기. _tools/sets 의 세트 파일 TOWER 에서 만든다.
 * 블록 덩이는 음성 목록(tools/collect-aoede-texts.mjs)도 읽는다 — 덩이마다 Aoede 클립이 생긴다. */
window.ONQ_WORD_TOWER = {
  "activityId": "game.word_tower",
  "flash": {
    "startMs": 1500,
    "endMs": 700,
    "minMs": 600
  },
  "words": [
    {
      "w": "한가운데에",
      "chunks": [
        "가운데",
        "한가운데",
        "한가운데에"
      ],
      "lures": [
        [
          "안가운데",
          "initialSwap"
        ],
        [
          "한가운대에",
          "vowelSwap"
        ]
      ],
      "flash": [
        [
          "한가운데로",
          null
        ],
        [
          "한가운대에",
          "vowelSwap"
        ]
      ],
      "focus": "데에"
    },
    {
      "w": "들어섰어요",
      "chunks": [
        "들어",
        "들어서다",
        "들어섰어요"
      ],
      "lures": [
        [
          "들러서다",
          "initialSwap"
        ],
        [
          "들어썼어요",
          "initialSwap"
        ]
      ],
      "flash": [
        [
          "들어섯어요",
          "codaSwap"
        ],
        [
          "들어썼어요",
          "initialSwap"
        ]
      ],
      "eq": [
        "섰",
        "어",
        "[서써]"
      ],
      "tip": "ㅆ 받침이 뒤로 넘어가요. [드러서써요]",
      "rule": "liaison",
      "focus": "섰어"
    },
    {
      "w": "모여들었어요",
      "chunks": [
        "모여",
        "모여들다",
        "모여들었어요"
      ],
      "lures": [
        [
          "모아들다",
          "vowelSwap"
        ],
        [
          "모여들엇어요",
          "codaSwap"
        ]
      ],
      "flash": [
        [
          "모여드렀어요",
          "soundSpelling"
        ],
        [
          "모여들었서요",
          "doubleCoda"
        ]
      ],
      "eq": [
        "들",
        "어",
        "[드러]"
      ],
      "tip": "ㄹ 받침이 뒤로 넘어가요. [모여드러써요]",
      "rule": "liaison",
      "focus": "들었어"
    },
    {
      "w": "수프랍니다",
      "chunks": [
        "수프",
        "수프라고",
        "수프랍니다"
      ],
      "lures": [
        [
          "수피라고",
          "vowelSwap"
        ],
        [
          "수프람니다",
          "soundSpelling"
        ]
      ],
      "flash": [
        [
          "수프람니다",
          "soundSpelling"
        ],
        [
          "수프랍디다",
          "initialSwap"
        ]
      ],
      "eq": [
        "랍",
        "니",
        "[람니]"
      ],
      "tip": "ㅂ 받침이 ㄴ 앞에서 [ㅁ] 소리가 나요. [수프람니다]",
      "rule": "nasalization",
      "focus": "랍니"
    },
    {
      "w": "가져왔어요",
      "chunks": [
        "가져",
        "가져오다",
        "가져왔어요"
      ],
      "lures": [
        [
          "가저오다",
          "soundSpelling"
        ],
        [
          "가져왓어요",
          "codaSwap"
        ]
      ],
      "flash": [
        [
          "가저와써요",
          "soundSpelling"
        ],
        [
          "가져갔어요",
          null
        ]
      ],
      "eq": [
        "왔",
        "어",
        "[와써]"
      ],
      "tip": "ㅆ 받침이 뒤로 넘어가요. [가저와써요]",
      "rule": "liaison",
      "focus": "왔어"
    },
    {
      "w": "끓으면서",
      "chunks": [
        "끓어",
        "끓으면",
        "끓으면서"
      ],
      "lures": [
        [
          "끌으면",
          "codaSwap"
        ],
        [
          "끓으며서",
          "codaDrop"
        ]
      ],
      "flash": [
        [
          "끄르면서",
          "soundSpelling"
        ],
        [
          "끓이면서",
          "vowelSwap"
        ]
      ],
      "eq": [
        "끓",
        "으",
        "[끄르]"
      ],
      "tip": "ㅎ은 소리 나지 않고 ㄹ이 넘어가요. [끄르면서]",
      "rule": "hDeletion",
      "focus": "끓으"
    },
    {
      "w": "둘러앉아",
      "chunks": [
        "둘러",
        "둘러앉다",
        "둘러앉아"
      ],
      "lures": [
        [
          "둘러안다",
          "codaSwap"
        ],
        [
          "둘러안자",
          "soundSpelling"
        ]
      ],
      "flash": [
        [
          "둘러안자",
          "soundSpelling"
        ],
        [
          "둘러앉자",
          "initialSwap"
        ]
      ],
      "eq": [
        "앉",
        "아",
        "[안자]"
      ],
      "tip": "겹받침 ㄵ에서 ㅈ이 뒤로 넘어가요. [둘러안자]",
      "rule": "clusterLiaison",
      "focus": "앉아"
    },
    {
      "w": "떠났답니다",
      "chunks": [
        "떠나다",
        "떠났다",
        "떠났답니다"
      ],
      "lures": [
        [
          "떠낫다",
          "codaSwap"
        ],
        [
          "떠났담니다",
          "soundSpelling"
        ]
      ],
      "flash": [
        [
          "떠낟땀니다",
          "soundSpelling"
        ],
        [
          "떠났습니다",
          null
        ]
      ],
      "eq": [
        "답",
        "니",
        "[담니]"
      ],
      "tip": "‘답니다’는 [담니다]로 읽어요. [떠낟땀니다]",
      "rule": "nasalization",
      "focus": "답니"
    }
  ],
  "cards": {
    "flash": {
      "startMs": 450,
      "endMs": 250,
      "minMs": 200
    },
    "items": [
      {
        "w": "집집마다",
        "sound": "[집찜마다]",
        "lures": [
          [
            "집찜마다",
            "soundSpelling"
          ],
          [
            "짐짐마다",
            "codaSwap"
          ],
          [
            "집집마타",
            "initialSwap"
          ]
        ],
        "rule": "nasalization",
        "focus": "집마"
      },
      {
        "w": "퍼졌어요",
        "sound": "[퍼저써요]",
        "lures": [
          [
            "퍼저써요",
            "soundSpelling"
          ],
          [
            "퍼졋어요",
            "codaSwap"
          ],
          [
            "퍼젔어요",
            "vowelSwap"
          ]
        ],
        "rule": "liaison",
        "focus": "졌어"
      },
      {
        "w": "처음이라며",
        "sound": "[처으미라며]",
        "lures": [
          [
            "처으미라며",
            "soundSpelling"
          ],
          [
            "처은이라며",
            "codaSwap"
          ],
          [
            "처움이라며",
            "vowelSwap"
          ]
        ],
        "rule": "liaison",
        "focus": "음이"
      },
      {
        "w": "퐁당 넣었어요",
        "sound": "[퐁당 너어써요]",
        "lures": [
          [
            "퐁당 너어써요",
            "soundSpelling"
          ],
          [
            "퐁당 너었어요",
            "codaDrop"
          ],
          [
            "퐁당 넣엇어요",
            "codaSwap"
          ]
        ],
        "rule": "hDeletion",
        "focus": "넣었"
      },
      {
        "w": "끓이는 거예요",
        "sound": "[끄리는 거에요]",
        "lures": [
          [
            "끄리는 거예요",
            "soundSpelling"
          ],
          [
            "끌이는 거예요",
            "codaSwap"
          ],
          [
            "끓이는 거에요",
            "vowelSwap"
          ]
        ],
        "rule": "hDeletion",
        "focus": "끓이"
      },
      {
        "w": "맛있는 냄새가",
        "sound": "[마신는 냄새가]",
        "lures": [
          [
            "마신는 냄새가",
            "soundSpelling"
          ],
          [
            "맛잇는 냄새가",
            "codaSwap"
          ],
          [
            "맛있는 냄세가",
            "vowelSwap"
          ]
        ],
        "rule": "nasalization",
        "focus": "맛있는"
      },
      {
        "w": "이렇게 맛있는",
        "sound": "[이러케 마신는]",
        "lures": [
          [
            "이러케 맛있는",
            "soundSpelling"
          ],
          [
            "이럭게 맛있는",
            "codaSwap"
          ],
          [
            "이렇게 마신는",
            "soundSpelling"
          ]
        ],
        "rule": "aspiration",
        "focus": "렇게"
      },
      {
        "w": "사람도 있었고",
        "sound": "[사람도 이썯꼬]",
        "lures": [
          [
            "사람도 이썯꼬",
            "soundSpelling"
          ],
          [
            "사람도 있엇고",
            "codaSwap"
          ],
          [
            "사람도 있었꼬",
            "soundSpelling"
          ]
        ],
        "rule": "tensification",
        "focus": "있었고"
      }
    ]
  }
};
