/* 세계전래동화 45 「돌멩이 수프」 한국어 5단계 읽기유창성 — 줄글 · 받침 이어 읽기(여러 받침) · ㅎ이 사라지는 말.
 * 이 파일은 _tools/build_set.py 가 만든다 — 고칠 때는 _tools/sets/ 의 세트 파일을 고친 뒤 다시 돌린다.
 * 확장 읽기 목표: 받침 이어 읽기. */
window.ONQ_CONTENT_PACK = {
  "version": "0.1.0",
  "contentId": "RF-FOLK45-STONESOUP-K5",
  "series": "읽기유창성 · ONQ 5 · 받침 이어 읽기",
  "bookTitle": "돌멩이 수프",
  "badchim": "ㄴ",
  "targetRule": "liaison",
  "helpSpelling": "소리는 이어져도 글자는 받침을 그대로 써요. 글자를 잘 봐요.",
  "credit": {
    "title": "돌멩이 수프",
    "source": "온큐베이트",
    "license": "직접 제작 텍스트 · 온큐베이트 수업용 재구성",
    "modified": "온큐베이트 창작",
    "programRights": "읽기유창성 프로그램 활동 · 평가 설계 © 온큐베이트",
    "allRights": "© 2026 온큐베이트. All rights reserved."
  },
  "sessions": {
    "session01": {
      "lessonId": "reading.fluency.folk45-stonesoup-k5.s01",
      "sessionLabel": "1회차",
      "range": "줄글 · 1~8쪽",
      "coverTitle": "돌멩이 수프",
      "goal": "받침이 뒤로 넘어가는 말([무늘]·[머글])을 이어 읽고, 긴 낱말은 조금씩 늘려 읽어요(가운데 → 한가운데 → 한가운데에).",
      "coverImage": "assets/book/page-01.webp",
      "focusRules": [
        "받침 뒤에 모음이 오면 받침을 뒤로 넘겨 이어 읽어요(문을 → [무늘], 먹을 → [머글]).",
        "‘넣었어요’·‘끓이는’처럼 ㅎ이 소리 나지 않는 말은 [너어써요]·[끄리는]으로 읽어요.",
        "‘한가운데에’·‘모여들었어요’처럼 긴 낱말은 ＋를 눌러 덩이씩 늘려 읽어요.",
        "따옴표 안의 말은 말하듯이, 쉼표에서는 살짝 쉬고 문장 끝까지 이어 읽어요."
      ],
      "game1": [
        {
          "word": "마을에",
          "chunks": [
            "마",
            "을",
            "에"
          ],
          "distractors": [
            "마",
            "으",
            "레"
          ],
          "hint": "[마으레]로 들려도 글자로는 받침 ㄹ을 그대로 써요.",
          "rule": "liaison"
        },
        {
          "word": "먹을",
          "chunks": [
            "먹",
            "을"
          ],
          "distractors": [
            "머",
            "글"
          ],
          "hint": "[머글]로 들려도 글자로는 받침 ㄱ을 그대로 써요.",
          "rule": "liaison"
        },
        {
          "word": "문을",
          "chunks": [
            "문",
            "을"
          ],
          "distractors": [
            "무",
            "늘"
          ],
          "hint": "[무늘]로 들려도 글자로는 받침 ㄴ을 그대로 써요.",
          "rule": "liaison"
        },
        {
          "word": "물을",
          "chunks": [
            "물",
            "을"
          ],
          "distractors": [
            "무",
            "를"
          ],
          "hint": "[무를]로 들려도 글자로는 받침 ㄹ을 그대로 써요.",
          "rule": "liaison"
        }
      ],
      "game1Mode": "fill",
      "game1Fill": [
        {
          "line": 0,
          "answer": "마을에",
          "hint": "[마으레]로 들려도 글자로는 받침 ㄹ을 그대로 써요.",
          "traps": [
            [
              "마으레",
              "soundSpelling"
            ],
            [
              "마은에",
              "codaSwap"
            ],
            [
              "마읍에",
              "codaSwap"
            ],
            [
              "마알에",
              "vowelSwap"
            ],
            [
              "바을에",
              "initialSwap"
            ],
            [
              "마으에",
              "codaDrop"
            ],
            [
              "마을레",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 1,
          "answer": "먹을",
          "hint": "[머글]로 들려도 글자로는 받침 ㄱ을 그대로 써요.",
          "traps": [
            [
              "머글",
              "soundSpelling"
            ],
            [
              "멍을",
              "codaSwap"
            ],
            [
              "멉을",
              "codaSwap"
            ],
            [
              "묵을",
              "vowelSwap"
            ],
            [
              "벅을",
              "initialSwap"
            ],
            [
              "머을",
              "codaDrop"
            ],
            [
              "먹글",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 3,
          "answer": "문을",
          "hint": "[무늘]로 들려도 글자로는 받침 ㄴ을 그대로 써요.",
          "traps": [
            [
              "무늘",
              "soundSpelling"
            ],
            [
              "뭄을",
              "codaSwap"
            ],
            [
              "묵을",
              "codaSwap"
            ],
            [
              "먼을",
              "vowelSwap"
            ],
            [
              "눈을",
              "initialSwap"
            ],
            [
              "무을",
              "codaDrop"
            ],
            [
              "문늘",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 4,
          "answer": "물을",
          "hint": "[무를]로 들려도 글자로는 받침 ㄹ을 그대로 써요.",
          "traps": [
            [
              "무를",
              "soundSpelling"
            ],
            [
              "문을",
              "codaSwap"
            ],
            [
              "뭄을",
              "codaSwap"
            ],
            [
              "멀을",
              "vowelSwap"
            ],
            [
              "불을",
              "initialSwap"
            ],
            [
              "무을",
              "codaDrop"
            ],
            [
              "물를",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 7,
          "answer": "무엇을",
          "hint": "[무어슬]로 들려도 글자로는 받침 ㅅ을 그대로 써요.",
          "traps": [
            [
              "무어슬",
              "soundSpelling"
            ],
            [
              "무언을",
              "codaSwap"
            ],
            [
              "무엄을",
              "codaSwap"
            ],
            [
              "무앗을",
              "vowelSwap"
            ],
            [
              "부엇을",
              "initialSwap"
            ],
            [
              "무어을",
              "codaDrop"
            ],
            [
              "무엇슬",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 10,
          "answer": "집에",
          "hint": "[지베]로 들려도 글자로는 받침 ㅂ을 그대로 써요.",
          "traps": [
            [
              "지베",
              "soundSpelling"
            ],
            [
              "짐에",
              "codaSwap"
            ],
            [
              "직에",
              "codaSwap"
            ],
            [
              "접에",
              "vowelSwap"
            ],
            [
              "십에",
              "initialSwap"
            ],
            [
              "지에",
              "codaDrop"
            ],
            [
              "집베",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 13,
          "answer": "소금을",
          "hint": "[소그믈]로 들려도 글자로는 받침 ㅁ을 그대로 써요.",
          "traps": [
            [
              "소그믈",
              "soundSpelling"
            ],
            [
              "소근을",
              "codaSwap"
            ],
            [
              "소글을",
              "codaSwap"
            ],
            [
              "소감을",
              "vowelSwap"
            ],
            [
              "고금을",
              "initialSwap"
            ],
            [
              "소그을",
              "codaDrop"
            ],
            [
              "소금믈",
              "doubleCoda"
            ]
          ]
        }
      ],
      "game2": [
        {
          "word": "마을에",
          "phrase": "작은 마을에",
          "rule": "liaison"
        },
        {
          "word": "들어섰어요",
          "phrase": "마을에 들어섰어요",
          "rule": "liaison"
        },
        {
          "word": "문을",
          "phrase": "문을 두드리며",
          "rule": "liaison"
        },
        {
          "word": "먹을",
          "phrase": "먹을 것을",
          "rule": "liaison"
        },
        {
          "word": "닫았어요",
          "phrase": "문을 꼭 닫았어요",
          "rule": "liaison"
        },
        {
          "word": "불을",
          "phrase": "불을 피우고",
          "rule": "liaison"
        },
        {
          "word": "물을",
          "phrase": "물을 부었어요",
          "rule": "liaison"
        },
        {
          "word": "넣었어요",
          "phrase": "퐁당 넣었어요",
          "rule": "hDeletion"
        },
        {
          "word": "모여들었어요",
          "phrase": "하나둘 모여들었어요",
          "rule": "liaison"
        },
        {
          "word": "무엇을",
          "phrase": "무엇을 끓이는",
          "rule": "liaison"
        },
        {
          "word": "끓이는",
          "phrase": "끓이는 거예요",
          "rule": "hDeletion"
        },
        {
          "word": "수프랍니다",
          "phrase": "돌멩이 수프랍니다",
          "rule": "nasalization"
        },
        {
          "word": "당근을",
          "phrase": "당근을 가져왔어요",
          "rule": "liaison"
        },
        {
          "word": "소금을",
          "phrase": "소금을 보탠",
          "rule": "liaison"
        },
        {
          "word": "끓으면서",
          "phrase": "보글보글 끓으면서",
          "rule": "hDeletion"
        },
        {
          "word": "맛있는",
          "phrase": "맛있는 냄새가",
          "rule": "nasalization"
        },
        {
          "word": "둘러앉아",
          "phrase": "둘러앉아 수프를",
          "rule": "clusterLiaison"
        },
        {
          "word": "웃었어요",
          "phrase": "처음이라며 웃었어요",
          "rule": "liaison"
        },
        {
          "word": "한가운데에",
          "phrase": "마을 한가운데에",
          "rule": ""
        },
        {
          "word": "집집마다",
          "phrase": "집집마다 문을",
          "rule": "nasalization"
        },
        {
          "word": "주머니에서",
          "phrase": "주머니에서 둥근",
          "rule": ""
        },
        {
          "word": "가져왔어요",
          "phrase": "당근을 가져왔어요",
          "rule": "liaison"
        },
        {
          "word": "퍼졌어요",
          "phrase": "마을에 퍼졌어요",
          "rule": "liaison"
        },
        {
          "word": "처음이라며",
          "phrase": "처음이라며 웃었어요",
          "rule": "liaison"
        },
        {
          "word": "떠났답니다",
          "phrase": "마을로 떠났답니다",
          "rule": "nasalization"
        }
      ],
      "wordIntro": false,
      "wordPoolMode": "pick",
      "wordPool": [
        {
          "word": "나그네",
          "related": true
        },
        {
          "word": "마을",
          "related": true
        },
        {
          "word": "냄비",
          "related": true
        },
        {
          "word": "돌멩이",
          "related": true
        },
        {
          "word": "당근",
          "related": true
        },
        {
          "word": "감자",
          "related": true
        },
        {
          "word": "마음",
          "related": false,
          "like": "마을"
        },
        {
          "word": "감사",
          "related": false,
          "like": "감자"
        },
        {
          "word": "수표",
          "related": false,
          "like": "수프"
        }
      ],
      "sentences": [
        {
          "page": 1,
          "text": "해 질 무렵, 배고픈 나그네가 작은 마을에 들어섰어요.",
          "focus": "마을에",
          "guide": "받침 ㄹ을 뒤로 넘겨 [마으레]로 이어 읽어요.",
          "apply": "하늘에 별이 떠요.",
          "rule": "liaison"
        },
        {
          "page": 1,
          "text": "나그네는 집집마다 문을 두드리며 먹을 것을 조금 나누어 달라고 했어요.",
          "focus": "먹을",
          "guide": "받침 ㄱ을 뒤로 넘겨 [머글]로 이어 읽어요.",
          "apply": "얼음이 녹을 때까지 기다려요.",
          "rule": "liaison"
        },
        {
          "page": 2,
          "text": "“올해는 우리 먹을 것도 모자라요.”",
          "focus": "것도",
          "guide": "받침 ㅅ 뒤의 ㄷ은 된소리로 [걷또]처럼 읽어요.",
          "apply": "옷도 입어요.",
          "rule": "tensification"
        },
        {
          "page": 2,
          "text": "사람들은 고개를 저으며 문을 꼭 닫았어요.",
          "focus": "닫았어요",
          "guide": "받침 ㄷ을 뒤로 넘겨 [다다써요]로 이어 읽어요.",
          "apply": "창문을 닫아요.",
          "rule": "liaison"
        },
        {
          "page": 3,
          "text": "나그네는 마을 한가운데에 불을 피우고 커다란 냄비에 물을 부었어요.",
          "focus": "불을",
          "guide": "받침 ㄹ을 뒤로 넘겨 [부를]로 이어 읽어요.",
          "apply": "줄을 서요.",
          "rule": "liaison"
        },
        {
          "page": 3,
          "text": "그리고 주머니에서 둥근 돌멩이 하나를 꺼내 퐁당 넣었어요.",
          "focus": "넣었어요",
          "guide": "ㅎ은 소리 나지 않아요. [너어써요]로 읽어요.",
          "apply": "상자에 공을 넣어요.",
          "rule": "hDeletion"
        },
        {
          "page": 4,
          "text": "궁금해진 사람들이 하나둘 모여들었어요.",
          "focus": "모여들었어요",
          "guide": "받침을 뒤로 넘겨 [모여드러써요]로 이어 읽어요.",
          "apply": "아이들이 모여들어요.",
          "rule": "liaison"
        },
        {
          "page": 4,
          "text": "“무엇을 끓이는 거예요?”",
          "focus": "끓이는",
          "guide": "ㅎ은 소리 나지 않고 ㄹ이 넘어가요. [끄리는]으로 읽어요.",
          "apply": "라면을 끓여요.",
          "rule": "hDeletion"
        },
        {
          "page": 5,
          "text": "“돌멩이 수프랍니다.”",
          "focus": "수프랍니다",
          "guide": "‘랍니다’는 [람니다]처럼 콧소리로 읽어요.",
          "apply": "오늘은 소풍이랍니다.",
          "rule": "nasalization"
        },
        {
          "page": 5,
          "text": "“그런데 당근이 있으면 더 맛있을 텐데.”",
          "focus": "당근이",
          "guide": "받침 ㄴ을 뒤로 넘겨 [당그니]로 이어 읽어요.",
          "apply": "수건이 젖었어요.",
          "rule": "liaison"
        },
        {
          "page": 5,
          "text": "한 아이가 얼른 집에 가서 당근을 가져왔어요.",
          "focus": "집에",
          "guide": "받침 ㅂ을 뒤로 넘겨 [지베]로 이어 읽어요.",
          "apply": "밥에 콩을 넣어요.",
          "rule": "liaison"
        },
        {
          "page": 6,
          "text": "“감자가 있으면 더 맛있을 텐데.”",
          "focus": "있으면",
          "guide": "받침 ㅆ을 뒤로 넘겨 [이쓰면]으로 이어 읽어요.",
          "apply": "시간이 있으면 놀아요.",
          "rule": "liaison"
        },
        {
          "page": 6,
          "text": "그러자 누군가 감자를 가져왔어요.",
          "focus": "가져왔어요",
          "guide": "받침 ㅆ을 뒤로 넘겨 [가저와써요]로 이어 읽어요.",
          "apply": "공을 가져왔어요.",
          "rule": "liaison"
        },
        {
          "page": 6,
          "text": "양파를 가져온 사람도 있었고, 고기와 소금을 보탠 사람도 있었어요.",
          "focus": "소금을",
          "guide": "받침 ㅁ을 뒤로 넘겨 [소그믈]로 이어 읽어요.",
          "apply": "구름을 봐요.",
          "rule": "liaison"
        },
        {
          "page": 7,
          "text": "냄비가 보글보글 끓으면서 맛있는 냄새가 온 마을에 퍼졌어요.",
          "focus": "끓으면서",
          "guide": "ㅎ은 소리 나지 않고 ㄹ이 넘어가요. [끄르면서]로 읽어요.",
          "apply": "물이 끓으면 알려 줘요.",
          "rule": "hDeletion"
        },
        {
          "page": 7,
          "text": "사람들은 둘러앉아 수프를 함께 나누어 먹었어요.",
          "focus": "둘러앉아",
          "guide": "받침 ㄵ에서 ㅈ이 넘어가 [둘러안자]로 읽어요.",
          "apply": "의자에 앉아요.",
          "rule": "clusterLiaison"
        },
        {
          "page": 7,
          "text": "모두 이렇게 맛있는 수프는 처음이라며 웃었어요.",
          "focus": "맛있는",
          "guide": "[마신는]처럼 콧소리로 이어 읽어요.",
          "apply": "재미있는 책이에요.",
          "rule": "nasalization"
        },
        {
          "page": 8,
          "text": "다음 날 아침, 나그네는 냄비에서 돌멩이를 꺼내 들고 다음 마을로 떠났답니다.",
          "focus": "떠났답니다",
          "guide": "‘답니다’는 [담니다]처럼 읽어요. [떠낟땀니다]",
          "apply": "다 먹었답니다.",
          "rule": "nasalization"
        }
      ],
      "vocab": [
        {
          "word": "나그네",
          "image": "assets/vocab/vocab-s01-01-traveler.webp",
          "alt": "배낭을 메고 지도를 든 여행자가 마을 길을 지나가며 손 흔드는 가족에게 인사하는 모습",
          "bookImage": "assets/vocab/vocab-s01-01-book-traveler.webp",
          "bookAlt": "지팡이를 짚고 보따리를 멘 나그네가 마을에 들어서고 아이가 문 뒤에서 내다보는 모습",
          "daily": {
            "frame": [
              "배낭을 메고 지도를 든 ",
              "가 마을을 지나가요."
            ],
            "answer": "나그네",
            "other": "요리사"
          },
          "book": {
            "frame": [
              "해 질 무렵, 배고픈 ",
              "가 작은 마을에 들어섰어요."
            ],
            "answer": "나그네",
            "other": "요리사"
          },
          "meaning": "집을 떠나 여기저기 길을 다니는 사람이에요."
        },
        {
          "word": "모자라요",
          "image": "assets/vocab/vocab-s01-02-short.webp",
          "alt": "아이는 다섯 명인데 의자가 네 개뿐이라 한 아이가 서 있는 교실",
          "bookImage": "assets/vocab/vocab-s01-02-book-short.webp",
          "bookAlt": "빈 냄비 앞에서 빈 그릇을 든 채 시무룩한 나그네와 문 뒤의 아이",
          "daily": {
            "frame": [
              "아이는 다섯 명인데 의자가 네 개라 하나가 ",
              "."
            ],
            "answer": "모자라요",
            "other": "남아요"
          },
          "book": {
            "frame": [
              "“올해는 우리 먹을 것도 ",
              ".”"
            ],
            "answer": "모자라요",
            "other": "남아요"
          },
          "meaning": "있어야 할 만큼보다 적은 거예요."
        },
        {
          "word": "보태다",
          "image": "assets/vocab/vocab-s01-03-add.webp",
          "alt": "친구가 쌓은 블록 위에 다른 아이가 블록을 하나 더 올리는 모습",
          "bookImage": "assets/vocab/vocab-s01-03-book-add.webp",
          "bookAlt": "아이가 끓는 냄비에 당근을 보태고 나그네가 웃는 모습",
          "daily": {
            "frame": [
              "친구가 쌓은 블록 위에 나도 블록을 하나 ",
              "."
            ],
            "answer": "보탰어요",
            "other": "숨겼어요"
          },
          "book": {
            "frame": [
              "양파를 가져온 사람도 있었고, 고기와 소금을 ",
              " 사람도 있었어요."
            ],
            "answer": "보탠",
            "other": "숨긴"
          },
          "meaning": "모자란 것에 더해서 채우는 거예요."
        },
        {
          "word": "둘러앉다",
          "image": "assets/vocab/vocab-s01-04-sit-around.webp",
          "alt": "아이들이 둥근 매트 위에 동그랗게 모여 앉아 블록 놀이를 하는 모습",
          "bookImage": "assets/vocab/vocab-s01-04-book-sit-around.webp",
          "bookAlt": "냄비 둘레에 동그랗게 모여 앉아 수프를 먹는 마을 사람들",
          "daily": {
            "frame": [
              "아이들이 매트 위에 빙 ",
              " 놀이를 해요."
            ],
            "answer": "둘러앉아",
            "other": "흩어져"
          },
          "book": {
            "frame": [
              "사람들은 ",
              " 수프를 함께 나누어 먹었어요."
            ],
            "answer": "둘러앉아",
            "other": "흩어져"
          },
          "meaning": "여럿이 동그랗게 모여 앉는 거예요."
        }
      ],
      "questions": [
        {
          "prompt": "마을 사람들은 왜 나그네에게 먹을 것을 주지 않았나요?",
          "answer": 2,
          "hint": "마을 사람이 한 말을 찾아보세요.",
          "explanation": "‘올해는 우리 먹을 것도 모자라요.’ — 자기들 먹을 것도 모자랐기 때문이에요."
        },
        {
          "prompt": "나그네는 냄비에 무엇을 넣었나요?",
          "answer": 5,
          "hint": "‘퐁당’이 들어 있는 문장을 보세요.",
          "explanation": "‘둥근 돌멩이 하나를 꺼내 퐁당 넣었어요.’ — 돌멩이를 넣었어요."
        },
        {
          "prompt": "당근을 가져온 사람은 누구인가요?",
          "answer": 10,
          "hint": "‘당근을 가져왔어요’로 끝나는 문장을 찾아보세요.",
          "explanation": "‘한 아이가 얼른 집에 가서 당근을 가져왔어요.’ — 한 아이가 가져왔어요."
        },
        {
          "prompt": "수프를 함께 먹은 사람들의 마음이 드러나는 문장은 어느 것인가요?",
          "answer": 16,
          "hint": "사람들이 어떤 얼굴을 했는지 찾아보세요.",
          "explanation": "‘모두 이렇게 맛있는 수프는 처음이라며 웃었어요.’ — 모두 기뻐서 웃었어요."
        }
      ],
      "bingo": [
        "문을",
        "물을",
        "먹을",
        "집에",
        "마을에",
        "당근을",
        "소금을",
        "손을",
        "풀을",
        "먹어",
        "밥에",
        "하늘에",
        "수건을",
        "얼음을",
        "눈을",
        "줄을"
      ]
    }
  }
};
