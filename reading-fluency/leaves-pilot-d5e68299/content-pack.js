/* RF-L4-006 「낙엽」 읽기유창성 — ONQ 4 · 3학년 · 2회차 × 40분.
 *
 * 비문학 설명문. 승인 본문 10문장 · 66어절 · 281자는 한 글자도 손대지 않았다.
 * 쪽 나눔도 승인안 그대로다(4쪽·7쪽만 두 문장, 나머지는 한 문장).
 *
 * 글의 뼈대:  1회차 = 무엇이 일어나는가 / 2회차 = 왜 그런가 · 예외는 무엇인가
 *   1회차 매듭 — 「낙엽이 무엇인지」(4쪽 첫 문장)      → questions[2]가 걸린다
 *   2회차 매듭 — 「모든 나무가 그런 것은 아니다」(7쪽) → questions[2]
 *                「저마다 다른 방식」(8쪽)             → questions[3]
 *
 * 소리 규칙은 **본문에서 뽑았다**(브리핑이 불러 주지 않았다).
 *   1회차 중심 : liaison(15자리) · compoundJuncture(붙은 낱말 — 나뭇잎·나뭇가지·빛 낱말)
 *          보조 : tensification(초록빛) · clusterLiaison(붉은) · aspiration(이렇게)
 *                 nInsertion(나뭇잎[나문닙])
 *   2회차 중심 : liaison(14자리)
 *          보조 : tensification(얻기[얻끼]) · aspiration(뾰족한[뾰조칸]) · nasalization(한답니다[한담니다])
 *   판단 못 함 : 노란빛·붉은빛의 된소리(제28항 사잇소리인지 사전 표기를 확인 못 함) — rule 비움
 *                땅이[땅이]는 ㅇ 받침이라 넘어가지 않는다 — 규칙 없음
 *
 * ⚠️ questions 의 answer 는 ‘그 회차 sentences 의 번호’다(0부터). 아이가 본문에서 그 문장을 고른다.
 * ⚠️ sentences[].page 는 **책 전체 쪽 번호**다(1회차 1~4쪽 · 2회차 5~8쪽).
 */
window.ONQ_CONTENT_PACK = {
  version: "0.1.0",
  contentId: "RF-L4-006",
  series: "읽기유창성 · ONQ 4",
  bookTitle: "낙엽",
  credit: {
    title: "낙엽",
    source: "온큐베이트",
    license: "직접 제작 텍스트 · 온큐베이트 수업용 재구성",
    modified: "온큐베이트 창작",
    programRights: "읽기유창성 프로그램 활동 · 평가 설계 © 온큐베이트",
    allRights: "© 2026 온큐베이트. All rights reserved."
  },
  sessions: {

    // ──────────────────────────────────────────── 1회차 · 1~4쪽 (문장 1~5)
    session01: {
      lessonId: "reading.fluency.rf-l4-006-fallen-leaves.s01",
      sessionLabel: "1회차",
      range: "1~4쪽",
      coverTitle: "잎이 물들고 떨어져요",
      goal: "받침을 뒤로 넘겨 이어 읽고, 붙은 낱말에서 달라진 소리를 살려 읽어요.",
      coverImage: "assets/book/page-01.webp",
      focusRules: [
        "받침 뒤에 모음이 오면 받침을 뒤로 넘겨 이어 읽어요.",
        "낱말과 낱말이 붙으면 뒤 첫소리가 세게 나거나 없던 ㄴ소리가 생겨요.",
        "‘가을이 되면 / 나뭇잎의 색이’처럼 뜻 덩어리로 끊어 읽어요."
      ],

      // 문장 완성 — 소리를 듣고 글자 조각을 순서대로 고른다. 미끼는 조각 수와 1:1이다.
      game1: [
        { word: "나뭇잎의",     chunks: ["나", "뭇", "잎", "의"],
          distractors: ["무", "묻", "입", "이"], hint: "없던 ㄴ소리가 생겨 [나문니페]처럼 들려요.", rule: "nInsertion" },
        { word: "초록빛이",     chunks: ["초", "록", "빛", "이"],
          distractors: ["추", "녹", "빚", "치"], hint: "받침 ㄱ 뒤에서 ‘빛’이 세게 나요.", rule: "tensification" },
        { word: "붉은빛이",     chunks: ["붉", "은", "빛", "이"],
          distractors: ["불", "근", "빚", "치"], hint: "첫 글자에는 받침이 두 개 있어요.", rule: "clusterLiaison" },
        { word: "나뭇가지에서", chunks: ["나", "뭇", "가", "지", "에", "서"],
          distractors: ["무", "묻", "까", "치", "애", "써"], hint: "‘나무’와 ‘가지’가 붙어 [나무까지]로 들려요.", rule: "compoundJuncture" },
        { word: "이렇게",       chunks: ["이", "렇", "게"],
          distractors: ["히", "러", "케"], hint: "ㅎ이 뒤 소리와 합쳐져 [이러케]로 나요.", rule: "aspiration" },
        { word: "낙엽이라고",   chunks: ["낙", "엽", "이", "라", "고"],
          distractors: ["나", "겹", "비", "러", "구"], hint: "받침이 뒤로 넘어가 [나겨비라고]로 들려요.", rule: "liaison" },
        { word: "깊어지면",     chunks: ["깊", "어", "지", "면"],
          distractors: ["기", "퍼", "치", "멘"], hint: "받침 ㅍ을 넘겨 [기퍼지면]으로 읽어요.", rule: "liaison" }
      ],

      // 젤리캡쳐 — 타일 열둘. 모두 1회차 본문 어절이다.
      game2: [
        { word: "가을이",       phrase: "가을이 되면",                     rule: "liaison" },
        { word: "나뭇잎의",     phrase: "나뭇잎의 색이",                   rule: "nInsertion" },
        { word: "색이",         phrase: "나뭇잎의 색이 점점 달라져요",     rule: "liaison" },
        { word: "초록빛이",     phrase: "초록빛이 줄어들고",               rule: "tensification" },
        { word: "줄어들고",     phrase: "초록빛이 줄어들고",               rule: "liaison" },
        { word: "붉은빛이",     phrase: "노란빛이나 붉은빛이 나타나요",    rule: "clusterLiaison" },
        { word: "잎이",         phrase: "그러다가 잎이",                   rule: "liaison" },
        { word: "나뭇가지에서", phrase: "잎이 나뭇가지에서 떨어져요",      rule: "compoundJuncture" },
        { word: "떨어져요",     phrase: "나뭇가지에서 떨어져요",           rule: "liaison" },
        { word: "이렇게",       phrase: "이렇게 나무에서",                 rule: "aspiration" },
        { word: "낙엽이라고",   phrase: "떨어진 잎을 낙엽이라고 해요",     rule: "liaison" },
        { word: "깊어지면",     phrase: "가을이 깊어지면",                 rule: "liaison" }
      ],

      // 읽기 전 예측 — 「이 낱말이 나올까요?」. related 는 **1회차 본문 등장 여부**와 정확히 같다.
      // false 여섯은 가을·나무와 가까워 헷갈릴 만한 것으로 골랐다(엉뚱하면 눈치 게임이 된다).
      wordPool: [
        { word: "가을",     related: true },  { word: "나뭇잎",   related: true },
        { word: "낙엽",     related: true },  { word: "나뭇가지", related: true },
        { word: "붉은빛",   related: true },  { word: "날씨",     related: true },
        { word: "도토리",   related: false }, { word: "단풍놀이", related: false },
        { word: "낙엽길",   related: false }, { word: "열매",     related: false },
        { word: "뿌리",     related: false }, { word: "허수아비", related: false }
      ],

      // 본문 1~4쪽 · 다섯 문장. 4쪽만 두 문장이다.
      sentences: [
        { page: 1, text: "가을이 되면 나뭇잎의 색이 점점 달라져요.",
          focus: "나뭇잎의", guide: "‘나뭇잎’은 없던 ㄴ소리가 생겨 [나문니페]처럼 이어 읽어요.",
          apply: "봄에는 꽃잎이 날려요.", rule: "nInsertion" },
        { page: 2, text: "초록빛이 줄어들고 노란빛이나 붉은빛이 나타나요.",
          focus: "초록빛이", guide: "‘초록’의 받침 ㄱ 뒤에서 ‘빛’이 된소리로 세게 나요.",
          apply: "창밖에 학교가 보여요.", rule: "tensification" },
        { page: 3, text: "그러다가 잎이 나뭇가지에서 떨어져요.",
          focus: "나뭇가지에서", guide: "‘나무’와 ‘가지’가 붙어 [나무까지]처럼 세게 소리 나요.",
          apply: "우리는 바닷가에서 놀았어요.", rule: "compoundJuncture" },
        { page: 4, text: "이렇게 나무에서 떨어진 잎을 낙엽이라고 해요.",
          focus: "낙엽이라고", guide: "받침을 뒤로 넘겨 [나겨비라고]로 이어 읽어요.",
          apply: "동생이 책을 읽어요.", rule: "liaison" },
        { page: 4, text: "가을이 깊어지면 날씨가 점점 추워져요.",
          focus: "깊어지면", guide: "받침 ㅍ을 뒤로 넘겨 [기퍼지면]으로 이어 읽어요.",
          apply: "이 산은 아주 높아요.", rule: "liaison" }
      ],

      // 어휘체크 다섯 — ①생활 장면 ②본문 문장 두 걸음. other 는 모두 **1회차 본문에 나오는 낱말**이다.
      vocab: [
        { word: "낙엽",
          image: "assets/vocab/vocab-s01-01-fallenleaf.webp", alt: "공원 산책길 바닥에 노랗고 붉은 잎이 두껍게 쌓여 있다",
          bookImage: "assets/vocab/vocab-s01-01-book-fallenleaf.webp", bookAlt: "나무 아래 떨어진 잎을 아이가 손에 들고 바라보는 장면",
          daily: { frame: ["길에 ", "이 잔뜩 쌓였어요."], answer: "낙엽", other: "색" },
          book:  { frame: ["이렇게 나무에서 떨어진 잎을 ", "이라고 해요."], answer: "낙엽", other: "색" },
          meaning: "나무에서 떨어진 잎이에요." },
        { word: "나뭇잎",
          image: "assets/vocab/vocab-s01-02-treeleaf.webp", alt: "가지에 달린 잎 여러 장이 햇빛에 비쳐 잎맥이 보인다",
          bookImage: "assets/vocab/vocab-s01-02-book-treeleaf.webp", bookAlt: "가지에 달린 채 색이 조금씩 물들어 가는 잎들",
          daily: { frame: ["나무마다 ", "의 모양이 달라요."], answer: "나뭇잎", other: "초록빛" },
          book:  { frame: ["가을이 되면 ", "의 색이 점점 달라져요."], answer: "나뭇잎", other: "초록빛" },
          meaning: "나무에 달려 있는 잎이에요." },
        { word: "초록빛",
          image: "assets/vocab/vocab-s01-03-green.webp", alt: "풀잎 위에 앉은 개구리의 등이 짙은 풀색이다",
          bookImage: "assets/vocab/vocab-s01-03-book-green.webp", bookAlt: "여름의 짙은 풀색 잎과 가을에 물든 잎을 나란히 놓은 장면",
          daily: { frame: ["개구리는 등이 ", "이에요."], answer: "초록빛", other: "가을" },
          book:  { frame: ["", "이 줄어들고 노란빛이나 붉은빛이 나타나요."], answer: "초록빛", other: "가을" },
          meaning: "풀처럼 푸른 빛깔이에요." },
        { word: "나뭇가지",
          image: "assets/vocab/vocab-s01-04-branch.webp", alt: "굵은 줄기에서 뻗어 나온 가지 위에 작은 새가 앉아 있다",
          bookImage: "assets/vocab/vocab-s01-04-book-branch.webp", bookAlt: "가지 끝에서 잎 하나가 막 떨어지려는 장면",
          daily: { frame: ["작은 새가 ", "에 앉아 쉬어요."], answer: "나뭇가지", other: "날씨" },
          book:  { frame: ["그러다가 잎이 ", "에서 떨어져요."], answer: "나뭇가지", other: "날씨" },
          meaning: "나무 줄기에서 뻗어 나온 가지예요." },
        { word: "날씨",
          image: "assets/vocab/vocab-s01-05-weather.webp", alt: "맑은 하늘에 해가 떠 있고 아이가 창밖을 내다본다",
          bookImage: "assets/vocab/vocab-s01-05-book-weather.webp", bookAlt: "가을이 깊어져 옷깃을 여미고 걷는 사람들",
          daily: { frame: ["아침부터 ", "가 참 맑아요."], answer: "날씨", other: "나뭇가지" },
          book:  { frame: ["가을이 깊어지면 ", "가 점점 추워져요."], answer: "날씨", other: "나뭇가지" },
          meaning: "그날그날의 비·바람·기온 같은 하늘 상태예요." }
      ],

      // 읽기이해 넷 — answer 는 위 sentences 의 번호(0부터)다. 넷이 서로 다르다(0·2·3·4).
      questions: [
        { prompt: "가을이 되면 나뭇잎에 무엇이 달라진다고 했나요?", answer: 0,
          hint: "글이 처음으로 알려 주는 변화를 찾아보세요.",
          explanation: "‘가을이 되면 나뭇잎의 색이 점점 달라져요.’ — 달라지는 것은 잎의 색이에요." },
        { prompt: "잎의 색이 달라진 다음에 일어나는 일을 말한 문장은 무엇인가요?", answer: 2,
          hint: "색이 바뀌는 문장들보다 뒤에 있어요.",
          explanation: "색이 바뀐 뒤에 잎이 나뭇가지에서 떨어져요 — 순서가 이렇게 이어져요." },
        { prompt: "‘낙엽’이 어떤 잎을 가리키는지 알려 주는 문장은 무엇인가요?", answer: 3,
          hint: "‘이렇게’로 시작하는 문장을 보세요.",
          explanation: "나무에서 떨어진 잎을 낙엽이라고 불러요 — 이 문장이 낙엽의 뜻이에요." },
        { prompt: "가을이 더 깊어지면 왜 겉옷이 필요할지 짐작할 수 있는 문장은 무엇인가요?", answer: 4,
          hint: "날씨를 말한 마지막 문장을 보세요.",
          explanation: "날씨가 점점 추워진다고 했으니 더 따뜻한 옷이 필요해져요." }
      ]
    },

    // ──────────────────────────────────────────── 2회차 · 5~8쪽 (문장 6~10)
    session02: {
      lessonId: "reading.fluency.rf-l4-006-fallen-leaves.s02",
      sessionLabel: "2회차",
      range: "5~8쪽",
      coverTitle: "나무마다 다른 겨울 준비",
      goal: "받침을 이어 읽으면서 된소리·거센소리·콧소리로 바뀌는 자리를 살려 읽어요.",
      coverImage: "assets/book/page-05.webp",
      focusRules: [
        "받침 뒤에 모음이 오면 받침을 뒤로 넘겨 이어 읽어요.",
        "받침 뒤에 오는 첫소리가 된소리나 거센소리로 바뀌어요.",
        "받침 ㅂ이 ㄴ 앞에서 콧소리 ㅁ으로 바뀌어요."
      ],

      game1: [
        { word: "겨울에는",   chunks: ["겨", "울", "에", "는"],
          distractors: ["거", "물", "레", "늘"], hint: "받침 ㄹ을 넘겨 [겨우레는]으로 읽어요.", rule: "liaison" },
        { word: "얻기",       chunks: ["얻", "기"],
          distractors: ["언", "끼"], hint: "받침 ㄷ 뒤의 ㄱ이 된소리로 세게 나요.", rule: "tensification" },
        { word: "잎에서",     chunks: ["잎", "에", "서"],
          distractors: ["입", "페", "써"], hint: "받침 ㅍ을 넘겨 [이페서]로 읽어요.", rule: "liaison" },
        { word: "줄이려고",   chunks: ["줄", "이", "려", "고"],
          distractors: ["줃", "리", "여", "구"], hint: "받침 ㄹ을 넘겨 [주리려고]로 읽어요.", rule: "liaison" },
        { word: "것은",       chunks: ["것", "은"],
          distractors: ["거", "슨"], hint: "받침 ㅅ을 넘겨 [거슨]으로 읽어요.", rule: "liaison" },
        { word: "뾰족한",     chunks: ["뾰", "족", "한"],
          distractors: ["뽀", "쪽", "칸"], hint: "받침 ㄱ이 ㅎ과 합쳐져 [뾰조칸]으로 나요.", rule: "aspiration" },
        { word: "한답니다",   chunks: ["한", "답", "니", "다"],
          distractors: ["함", "담", "미", "따"], hint: "받침 ㅂ이 콧소리 ㅁ으로 바뀌어요.", rule: "nasalization" }
      ],

      // 젤리캡쳐 — 타일 열둘. 모두 2회차 본문 어절이다.
      game2: [
        { word: "겨울에는",   phrase: "겨울에는 땅이 얼어",             rule: "liaison" },
        { word: "땅이",       phrase: "겨울에는 땅이 얼어" },
        { word: "얼어",       phrase: "땅이 얼어 나무가",               rule: "liaison" },
        { word: "물을",       phrase: "나무가 물을 얻기",               rule: "liaison" },
        { word: "얻기",       phrase: "물을 얻기 어려울 수 있어요",     rule: "tensification" },
        { word: "있어요",     phrase: "얻기 어려울 수 있어요",          rule: "liaison" },
        { word: "잎에서",     phrase: "어떤 나무는 잎에서",             rule: "liaison" },
        { word: "줄이려고",   phrase: "물을 줄이려고 잎을 떨어뜨려요",  rule: "liaison" },
        { word: "것은",       phrase: "떨어뜨리는 것은 아니에요",       rule: "liaison" },
        { word: "뾰족한",     phrase: "잎이 뾰족한 소나무는",           rule: "aspiration" },
        { word: "한겨울에도", phrase: "소나무는 한겨울에도 푸른 잎을",  rule: "liaison" },
        { word: "한답니다",   phrase: "겨울을 날 준비를 한답니다",      rule: "nasalization" }
      ],

      // 읽기 전 예측 — related 는 **2회차 본문(5~8쪽) 등장 여부**와 정확히 같다.
      wordPool: [
        { word: "겨울",     related: true },  { word: "소나무",   related: true },
        { word: "뾰족한",   related: true },  { word: "준비",     related: true },
        { word: "푸른",     related: true },  { word: "얼어",     related: true },
        { word: "눈사람",   related: false }, { word: "고드름",   related: false },
        { word: "은행나무", related: false }, { word: "도토리",   related: false },
        { word: "얼음판",   related: false }, { word: "새싹",     related: false }
      ],

      // 본문 5~8쪽 · 다섯 문장. 7쪽만 두 문장이다.
      sentences: [
        { page: 5, text: "겨울에는 땅이 얼어 나무가 물을 얻기 어려울 수 있어요.",
          focus: "얻기", guide: "받침 ㄷ 뒤의 ㄱ이 된소리로 세게 나 [얻끼]로 읽어요.",
          apply: "나는 국밥을 좋아해요.", rule: "tensification" },
        { page: 6, text: "그래서 어떤 나무는 잎에서 빠져나가는 물을 줄이려고 잎을 떨어뜨려요.",
          focus: "잎에서", guide: "받침 ㅍ을 뒤로 넘겨 [이페서]로 이어 읽어요.",
          apply: "무릎이 조금 아파요.", rule: "liaison" },
        { page: 7, text: "하지만 모든 나무가 잎을 떨어뜨리는 것은 아니에요.",
          focus: "것은", guide: "받침 ㅅ을 뒤로 넘겨 [거슨]으로 이어 읽어요.",
          apply: "내 옷은 파란색이에요.", rule: "liaison" },
        { page: 7, text: "잎이 뾰족한 소나무는 한겨울에도 푸른 잎을 지녀요.",
          focus: "뾰족한", guide: "받침 ㄱ이 ㅎ과 합쳐져 거센소리 [뾰조칸]으로 나요.",
          apply: "손을 깨끗한 물에 씻어요.", rule: "aspiration" },
        { page: 8, text: "나무들은 저마다 다른 모습으로 겨울을 날 준비를 한답니다.",
          focus: "한답니다", guide: "받침 ㅂ이 콧소리 ㅁ으로 바뀌어 [한담니다]로 읽어요.",
          apply: "우리는 앞마당에서 놀아요.", rule: "nasalization" }
      ],

      // 어휘체크 다섯 — other 는 모두 **2회차 본문에 나오는 낱말**이다.
      vocab: [
        { word: "얼어",
          image: "assets/vocab/vocab-s02-01-freeze.webp", alt: "밤사이 꽁꽁 언 연못 위에 마른 나뭇가지가 붙어 있다",
          bookImage: "assets/vocab/vocab-s02-01-book-freeze.webp", bookAlt: "겨울 들판의 땅이 단단하게 얼어 갈라진 장면",
          daily: { frame: ["연못이 꽁꽁 ", " 버렸어요."], answer: "얼어", other: "줄이려고" },
          book:  { frame: ["겨울에는 땅이 ", " 나무가 물을 얻기 어려울 수 있어요."], answer: "얼어", other: "줄이려고" },
          meaning: "물이 추위에 굳어 딱딱해지는 거예요." },
        { word: "빠져나가는",
          image: "assets/vocab/vocab-s02-02-escape.webp", alt: "바람 빠진 튜브에서 공기가 새어 나가며 쪼그라든다",
          bookImage: "assets/vocab/vocab-s02-02-book-escape.webp", bookAlt: "잎 표면에서 물기가 김처럼 날아가는 모습을 그린 장면",
          daily: { frame: ["튜브에서 바람이 ", " 소리예요."], answer: "빠져나가는", other: "떨어뜨리는" },
          book:  { frame: ["그래서 어떤 나무는 잎에서 ", " 물을 줄이려고 잎을 떨어뜨려요."], answer: "빠져나가는", other: "떨어뜨리는" },
          meaning: "안에 있던 것이 밖으로 나가는 거예요." },
        { word: "모든",
          image: "assets/vocab/vocab-s02-03-all.webp", alt: "교실에 한 명도 빠지지 않고 다 모여 앉은 아이들",
          bookImage: "assets/vocab/vocab-s02-03-book-all.webp", bookAlt: "잎을 떨군 나무들 사이에 푸른 나무 한 그루가 서 있는 장면",
          daily: { frame: ["", " 친구가 빠짐없이 모였어요."], answer: "모든", other: "어떤" },
          book:  { frame: ["하지만 ", " 나무가 잎을 떨어뜨리는 것은 아니에요."], answer: "모든", other: "어떤" },
          meaning: "하나도 빠짐없이 다라는 뜻이에요." },
        { word: "소나무",
          image: "assets/vocab/vocab-s02-04-pine.webp", alt: "마당에 선 큰 소나무의 바늘처럼 뾰족한 잎이 가까이 보인다",
          bookImage: "assets/vocab/vocab-s02-04-book-pine.webp", bookAlt: "눈이 쌓인 겨울 산에서 홀로 푸른 잎을 지닌 소나무",
          daily: { frame: ["앞마당에 커다란 ", "가 있어요."], answer: "소나무", other: "준비" },
          book:  { frame: ["잎이 뾰족한 ", "는 한겨울에도 푸른 잎을 지녀요."], answer: "소나무", other: "준비" },
          meaning: "잎이 바늘처럼 뾰족한 늘 푸른 나무예요." },
        { word: "모습",
          image: "assets/vocab/vocab-s02-05-appearance.webp", alt: "거울 앞에 선 아이가 자기 겉모습을 살펴본다",
          bookImage: "assets/vocab/vocab-s02-05-book-appearance.webp", bookAlt: "가지만 남은 나무와 푸른 소나무가 나란히 겨울을 나는 장면",
          daily: { frame: ["거울에 비친 내 ", "을 보아요."], answer: "모습", other: "땅" },
          book:  { frame: ["나무들은 저마다 다른 ", "으로 겨울을 날 준비를 한답니다."], answer: "모습", other: "땅" },
          meaning: "겉으로 드러나 보이는 생김새예요." }
      ],

      // 읽기이해 넷 — answer 는 위 sentences 의 번호(0부터)다. 넷이 서로 다르다(0·1·2·4).
      questions: [
        { prompt: "겨울에 나무가 물을 얻기 어려워지는 까닭이 나온 문장은 무엇인가요?", answer: 0,
          hint: "땅이 어떻게 되는지 말한 문장을 찾아보세요.",
          explanation: "땅이 얼어 버리면 뿌리가 물을 빨아들이기 어려워요." },
        { prompt: "어떤 나무가 잎을 떨어뜨리는 까닭을 말한 문장은 무엇인가요?", answer: 1,
          hint: "‘그래서’로 시작하는 문장을 보세요.",
          explanation: "잎에서 빠져나가는 물을 줄이려고 잎을 떨어뜨려요 — 이것이 까닭이에요." },
        { prompt: "잎을 떨어뜨리지 않는 나무도 있다는 것을 알려 주는 문장은 무엇인가요?", answer: 2,
          hint: "‘하지만’으로 시작하는 문장을 보세요.",
          explanation: "모든 나무가 잎을 떨어뜨리는 것은 아니라고 했어요 — 예외가 있다는 뜻이에요." },
        { prompt: "나무마다 겨울을 보내는 방법이 다르다고 정리한 문장은 무엇인가요?", answer: 4,
          hint: "글을 마무리하는 마지막 문장을 보세요.",
          explanation: "‘저마다 다른 모습으로’라는 말에 나무마다 방법이 다르다는 뜻이 담겨 있어요." }
      ]
    }
  }
};
