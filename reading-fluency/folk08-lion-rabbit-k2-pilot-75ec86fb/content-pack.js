/* 세계전래동화 08 「사자와 토끼」 한국어 2단계 읽기유창성 — 줄글 · 받침 이어 읽기 · 저학년.
 * 이 파일은 _tools/build_set.py 가 만든다 — 고칠 때는 _tools/sets/ 의 세트 파일을 고친 뒤 다시 돌린다.
 * 확장 읽기 목표: 받침 이어 읽기. */
window.ONQ_CONTENT_PACK = {
  "version": "0.1.0",
  "contentId": "RF-FOLK08-LION-RABBIT-K2",
  "series": "읽기유창성 · ONQ 2 · 받침 이어 읽기",
  "bookTitle": "사자와 토끼",
  "badchim": "ㄴ",
  "targetRule": "liaison",
  "helpSpelling": "소리는 이어져도 글자는 받침을 그대로 써요. 글자를 잘 봐요.",
  "credit": {
    "title": "사자와 토끼",
    "allRights": "© 2026 온큐베이트"
  },
  "sessions": {
    "session01": {
      "lessonId": "reading.fluency.folk08-lion-rabbit-k2.s01",
      "sessionLabel": "1회차",
      "range": "줄글 · 1~8쪽",
      "coverTitle": "사자와 토끼",
      "goal": "받침이 뒤로 넘어가는 말([수페]·[동무를])을 이어 읽고, 낱말을 조금씩 늘려 읽어요(동물 → 동물들이).",
      "coverImage": "assets/book/page-01.webp",
      "focusRules": [
        "받침 뒤에 모음이 오면 받침을 뒤로 넘겨 이어 읽어요(숲에 → [수페], 동물을 → [동무를]).",
        "‘갈게요’·‘잡지’는 된소리로 [갈께요]·[잡찌]처럼 읽어요.",
        "따옴표 안의 말은 말하듯이 읽어요."
      ],
      "game1": [
        {
          "word": "숲에",
          "chunks": [
            "숲",
            "에"
          ],
          "distractors": [
            "수",
            "페"
          ],
          "hint": "[수페]로 들려도 글자로는 받침 ㅍ을 그대로 써요.",
          "rule": "liaison"
        },
        {
          "word": "동물을",
          "chunks": [
            "동",
            "물",
            "을"
          ],
          "distractors": [
            "동",
            "무",
            "를"
          ],
          "hint": "[동무를]로 들려도 글자로는 받침 ㄹ을 그대로 써요.",
          "rule": "liaison"
        },
        {
          "word": "동물들이",
          "chunks": [
            "동",
            "물",
            "들",
            "이"
          ],
          "distractors": [
            "동",
            "물",
            "드",
            "리"
          ],
          "hint": "[동물드리]로 들려도 글자로는 받침 ㄹ을 그대로 써요.",
          "rule": "liaison"
        },
        {
          "word": "모습이",
          "chunks": [
            "모",
            "습",
            "이"
          ],
          "distractors": [
            "모",
            "스",
            "비"
          ],
          "hint": "[모스비]로 들려도 글자로는 받침 ㅂ을 그대로 써요.",
          "rule": "liaison"
        }
      ],
      "game1Mode": "fill",
      "game1Fill": [
        {
          "line": 0,
          "answer": "숲에",
          "hint": "[수페]로 들려도 글자로는 받침 ㅍ을 그대로 써요.",
          "traps": [
            [
              "수페",
              "soundSpelling"
            ],
            [
              "숩에",
              "codaSwap"
            ],
            [
              "숫에",
              "codaSwap"
            ],
            [
              "솦에",
              "vowelSwap"
            ],
            [
              "줖에",
              "initialSwap"
            ],
            [
              "수에",
              "codaDrop"
            ],
            [
              "숲페",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 1,
          "answer": "동물을",
          "hint": "[동무를]로 들려도 글자로는 받침 ㄹ을 그대로 써요.",
          "traps": [
            [
              "동무를",
              "soundSpelling"
            ],
            [
              "동뭄을",
              "codaSwap"
            ],
            [
              "동문을",
              "codaSwap"
            ],
            [
              "동멀을",
              "vowelSwap"
            ],
            [
              "통물을",
              "initialSwap"
            ],
            [
              "동무을",
              "codaDrop"
            ],
            [
              "동물를",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 2,
          "answer": "동물들이",
          "hint": "[동물드리]로 들려도 글자로는 받침 ㄹ을 그대로 써요.",
          "traps": [
            [
              "동물드리",
              "soundSpelling"
            ],
            [
              "동물듬이",
              "codaSwap"
            ],
            [
              "동물든이",
              "codaSwap"
            ],
            [
              "동물달이",
              "vowelSwap"
            ],
            [
              "공물들이",
              "initialSwap"
            ],
            [
              "동물드이",
              "codaDrop"
            ],
            [
              "동물들리",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 12,
          "answer": "모습이",
          "hint": "[모스비]로 들려도 글자로는 받침 ㅂ을 그대로 써요.",
          "traps": [
            [
              "모스비",
              "soundSpelling"
            ],
            [
              "모슴이",
              "codaSwap"
            ],
            [
              "모슥이",
              "codaSwap"
            ],
            [
              "모숩이",
              "vowelSwap"
            ],
            [
              "보습이",
              "initialSwap"
            ],
            [
              "모스이",
              "codaDrop"
            ],
            [
              "모습비",
              "doubleCoda"
            ]
          ]
        },
        {
          "line": 17,
          "answer": "덕분에",
          "hint": "[덕뿌네]로 들려도 글자로는 ‘덕분에’라고 써요.",
          "traps": [
            [
              "덕뿌네",
              "soundSpelling"
            ],
            [
              "덕불에",
              "codaSwap"
            ],
            [
              "덕붐에",
              "codaSwap"
            ],
            [
              "덕번에",
              "vowelSwap"
            ],
            [
              "턱분에",
              "initialSwap"
            ],
            [
              "덕부에",
              "codaDrop"
            ],
            [
              "덕분네",
              "doubleCoda"
            ]
          ]
        }
      ],
      "game2": [
        {
          "word": "숲에",
          "phrase": "숲에 사나운",
          "rule": "liaison"
        },
        {
          "word": "살아요",
          "phrase": "사자가 살아요",
          "rule": "liaison"
        },
        {
          "word": "동물을",
          "phrase": "동물을 잡아요",
          "rule": "liaison"
        },
        {
          "word": "잡아요",
          "phrase": "동물을 잡아요",
          "rule": "liaison"
        },
        {
          "word": "동물들이",
          "phrase": "동물들이 말해요",
          "rule": "liaison"
        },
        {
          "word": "갈게요",
          "phrase": "한 마리씩 갈게요",
          "rule": "tensification"
        },
        {
          "word": "잡지",
          "phrase": "잡지 마세요",
          "rule": "tensification"
        },
        {
          "word": "늦었어",
          "phrase": "왜 늦었어",
          "rule": "liaison"
        },
        {
          "word": "막았어요",
          "phrase": "저를 막았어요",
          "rule": "liaison"
        },
        {
          "word": "우물에",
          "phrase": "우물에 자기",
          "rule": "liaison"
        },
        {
          "word": "모습이",
          "phrase": "모습이 비쳐요",
          "rule": "liaison"
        },
        {
          "word": "우물에서도",
          "phrase": "우물에서도 으르렁",
          "rule": "liaison"
        },
        {
          "word": "뛰어들어요",
          "phrase": "우물로 뛰어들어요",
          "rule": "liaison"
        },
        {
          "word": "덕분에",
          "phrase": "토끼 덕분에",
          "rule": "tensification"
        },
        {
          "word": "으르렁거려요",
          "phrase": "사자가 으르렁거려요",
          "rule": ""
        }
      ],
      "wordIntro": false,
      "wordPoolMode": "pick",
      "wordPool": [
        {
          "word": "사자",
          "related": true
        },
        {
          "word": "토끼",
          "related": true
        },
        {
          "word": "동물",
          "related": true
        },
        {
          "word": "우물",
          "related": true
        },
        {
          "word": "숲",
          "related": true
        },
        {
          "word": "소리",
          "related": true
        },
        {
          "word": "사과",
          "related": false,
          "like": "사자"
        },
        {
          "word": "도끼",
          "related": false,
          "like": "토끼"
        },
        {
          "word": "소라",
          "related": false,
          "like": "소리"
        }
      ],
      "sentences": [
        {
          "page": 1,
          "text": "숲에 사나운 사자가 살아요.",
          "focus": "숲에",
          "guide": "받침 ㅍ을 뒤로 넘겨 [수페]로 이어 읽어요.",
          "apply": "옆에 친구가 있어요.",
          "rule": "liaison"
        },
        {
          "page": 1,
          "text": "사자는 날마다 동물을 잡아요.",
          "focus": "동물을",
          "guide": "받침 ㄹ을 뒤로 넘겨 [동무를]로 이어 읽어요.",
          "apply": "물을 마셔요.",
          "rule": "liaison"
        },
        {
          "page": 2,
          "text": "동물들이 말해요.",
          "focus": "동물들이",
          "guide": "받침 ㄹ을 뒤로 넘겨 [동물드리]로 이어 읽어요.",
          "apply": "아이들이 뛰어요.",
          "rule": "liaison"
        },
        {
          "page": 2,
          "text": "“날마다 한 마리씩 갈게요.”",
          "focus": "갈게요",
          "guide": "‘게’는 된소리로 [갈께요]처럼 읽어요.",
          "apply": "내가 먼저 할게요.",
          "rule": "tensification"
        },
        {
          "page": 2,
          "text": "“다른 동물은 잡지 마세요.”",
          "focus": "잡지",
          "guide": "받침 ㅂ 뒤의 ㅈ은 된소리로 [잡찌]처럼 읽어요.",
          "apply": "많이 먹지 마세요.",
          "rule": "tensification"
        },
        {
          "page": 3,
          "text": "이제 토끼 차례예요.",
          "focus": "차례예요",
          "guide": "‘이제’ 다음에 살짝 쉬고 ‘토끼 차례예요’를 이어 읽어요.",
          "apply": "이제 내 차례예요.",
          "rule": ""
        },
        {
          "page": 3,
          "text": "토끼는 일부러 천천히 가요.",
          "focus": "천천히",
          "guide": "‘천천히’는 말뜻처럼 느긋하게 읽어 봐요.",
          "apply": "거북이가 천천히 걸어요.",
          "rule": ""
        },
        {
          "page": 4,
          "text": "사자가 화를 내요.",
          "focus": "화를",
          "guide": "‘화를 내요’를 한 덩이로 이어 읽어요.",
          "apply": "동생이 화를 내요.",
          "rule": ""
        },
        {
          "page": 4,
          "text": "“왜 늦었어?”",
          "focus": "늦었어",
          "guide": "받침 ㅈ과 ㅆ을 뒤로 넘겨 [느저써]로 이어 읽어요.",
          "apply": "학교에 늦었어요.",
          "rule": "liaison"
        },
        {
          "page": 5,
          "text": "“다른 사자가 저를 막았어요.”",
          "focus": "막았어요",
          "guide": "받침 ㄱ과 ㅆ을 뒤로 넘겨 [마가써요]로 이어 읽어요.",
          "apply": "친구가 길을 막았어요.",
          "rule": "liaison"
        },
        {
          "page": 5,
          "text": "“자기가 숲의 왕이래요.”",
          "focus": "왕이래요",
          "guide": "받침 ㅇ은 넘어가지 않아요. [왕이래요] 그대로 읽어요.",
          "apply": "공이 굴러가요.",
          "rule": ""
        },
        {
          "page": 6,
          "text": "사자는 토끼를 따라 우물로 가요.",
          "focus": "우물로",
          "guide": "‘토끼를 따라’ 다음에 살짝 쉬고 ‘우물로 가요’를 이어 읽어요.",
          "apply": "강아지가 엄마를 따라 집으로 가요.",
          "rule": ""
        },
        {
          "page": 6,
          "text": "우물에 자기 모습이 비쳐요.",
          "focus": "모습이",
          "guide": "받침 ㅂ을 뒤로 넘겨 [모스비]로 이어 읽어요.",
          "apply": "밥이 맛있어요.",
          "rule": "liaison"
        },
        {
          "page": 7,
          "text": "“감히 나에게 덤벼?”",
          "focus": "덤벼",
          "guide": "따옴표 안의 말은 화난 사자처럼 말하듯이 읽어요.",
          "apply": "누가 내 빵을 먹었어?",
          "rule": ""
        },
        {
          "page": 7,
          "text": "사자가 으르렁거려요.",
          "focus": "으르렁거려요",
          "guide": "‘으르렁거려요’를 끊지 말고 한 번에 이어 읽어요.",
          "apply": "강아지가 으르렁거려요.",
          "rule": ""
        },
        {
          "page": 7,
          "text": "우물에서도 으르렁 소리가 나요.",
          "focus": "우물에서도",
          "guide": "받침 ㄹ을 뒤로 넘겨 [우무레서도]로 이어 읽어요.",
          "apply": "교실에서도 노래가 들려요.",
          "rule": "liaison"
        },
        {
          "page": 8,
          "text": "사자는 우물로 뛰어들어요.",
          "focus": "뛰어들어요",
          "guide": "받침 ㄹ을 뒤로 넘겨 [뛰어드러요]로 이어 읽어요.",
          "apply": "개구리가 물에 뛰어들어요.",
          "rule": "liaison"
        },
        {
          "page": 8,
          "text": "토끼 덕분에 모두 안전해요.",
          "focus": "덕분에",
          "guide": "‘분’은 된소리 [뿐]으로, 받침 ㄴ은 뒤로 넘겨 [덕뿌네]로 읽어요.",
          "apply": "친구 덕분에 즐거워요.",
          "rule": "tensification"
        }
      ],
      "vocab": [
        {
          "word": "사나운",
          "image": "assets/vocab/vocab-s01-01-fierce.webp",
          "alt": "해 질 녘 굴 앞에서 화난 사자가 입을 벌리고 웅크린 토끼를 노려보는 모습",
          "bookImage": "assets/vocab/vocab-s01-01-book-fierce.webp",
          "bookAlt": "숲 속 바위 아래 모인 동물들과 멀리 굴 앞에 앉아 있는 사자",
          "daily": {
            "frame": [
              "입을 벌린 ",
              " 사자가 토끼를 노려봐요."
            ],
            "answer": "사나운",
            "other": "순한"
          },
          "book": {
            "frame": [
              "숲에 ",
              " 사자가 살아요."
            ],
            "answer": "사나운",
            "other": "순한"
          },
          "meaning": "성질이 거칠고 무서운 모양이에요."
        },
        {
          "word": "우물",
          "image": "assets/vocab/vocab-s01-02-well.webp",
          "alt": "토끼가 돌로 쌓은 둥근 우물 가에 앞발을 얹고 물속을 들여다보는 모습",
          "bookImage": "assets/vocab/vocab-s01-02-book-well.webp",
          "bookAlt": "사자가 우물 가에 앞발을 얹고 물속을 노려보고, 뒤에서 토끼가 지켜보는 모습",
          "daily": {
            "frame": [
              "토끼가 돌로 쌓은 ",
              "을 들여다봐요."
            ],
            "answer": "우물",
            "other": "굴"
          },
          "book": {
            "frame": [
              "사자는 토끼를 따라 ",
              "로 가요."
            ],
            "answer": "우물",
            "other": "굴"
          },
          "meaning": "땅을 깊이 파서 물이 고이게 만든 곳이에요."
        },
        {
          "word": "비쳐요",
          "image": "assets/vocab/vocab-s01-03-reflect.webp",
          "alt": "우물 속 물에 토끼 얼굴이 비친 모습",
          "bookImage": "assets/vocab/vocab-s01-03-book-reflect.webp",
          "bookAlt": "우물 물에 사자 얼굴이 비치고, 사자가 그 얼굴을 노려보는 모습",
          "daily": {
            "frame": [
              "우물 물에 토끼 얼굴이 ",
              "."
            ],
            "answer": "비쳐요",
            "other": "숨어요"
          },
          "book": {
            "frame": [
              "우물에 자기 모습이 ",
              "."
            ],
            "answer": "비쳐요",
            "other": "숨어요"
          },
          "meaning": "물이나 거울에 모습이 나타나 보여요."
        },
        {
          "word": "으르렁",
          "image": "assets/vocab/vocab-s01-04-growl.webp",
          "alt": "해 질 녘 화난 사자가 입을 크게 벌리고 토끼를 내려다보는 모습",
          "bookImage": "assets/vocab/vocab-s01-04-book-growl.webp",
          "bookAlt": "우물 가에서 물속을 노려보는 사자와 뒤에서 지켜보는 토끼",
          "daily": {
            "frame": [
              "화난 사자가 입을 벌리고 ",
              " 소리를 내요."
            ],
            "answer": "으르렁",
            "other": "야옹"
          },
          "book": {
            "frame": [
              "우물에서도 ",
              " 소리가 나요."
            ],
            "answer": "으르렁",
            "other": "야옹"
          },
          "meaning": "사나운 짐승이 성이 나서 크고 낮게 내는 소리예요."
        }
      ],
      "questions": [
        {
          "prompt": "동물들은 사자에게 무엇을 약속했나요?",
          "answer": 3,
          "hint": "‘한 마리씩’이 들어 있는 문장을 찾아보세요.",
          "explanation": "‘날마다 한 마리씩 갈게요.’ — 날마다 한 마리씩 가기로 했어요."
        },
        {
          "prompt": "토끼는 늦은 까닭을 무엇이라고 말했나요?",
          "answer": 9,
          "hint": "‘막았어요’가 들어 있는 문장을 찾아보세요.",
          "explanation": "‘다른 사자가 저를 막았어요.’ — 다른 사자가 막았다고 말했어요."
        },
        {
          "prompt": "우물에는 무엇이 비쳤나요?",
          "answer": 12,
          "hint": "‘비쳐요’가 들어 있는 문장을 보세요.",
          "explanation": "‘우물에 자기 모습이 비쳐요.’ — 사자 자기 모습이 비쳤어요."
        },
        {
          "prompt": "사자는 마지막에 어떻게 했나요?",
          "answer": 16,
          "hint": "‘뛰어들어요’가 들어 있는 문장을 보세요.",
          "explanation": "‘사자는 우물로 뛰어들어요.’ — 우물로 뛰어들었어요."
        }
      ],
      "bingo": [
        "동물을",
        "숲에",
        "잡아요",
        "모습이",
        "동물들이",
        "우물에",
        "살아요",
        "연필을",
        "앞에",
        "입어요",
        "밥이",
        "아이들이",
        "교실에",
        "놀아요",
        "얼굴을",
        "옆에"
      ]
    }
  }
};
