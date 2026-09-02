/* RF-L8-001 「동물은 어떻게 자랄까요?」 읽기유창성 — ONQ 8 · 1회차 40분.
 *
 * 비문학 설명문. 승인 본문 5문단 · 11문장 · 88어절.
 * ⚠️ 원문 1문단 셋째 문장의 「생을 마칠 때 까지의」는 조사 「까지」를 붙여 쓰는 것이 맞아
 *    「때까지의」로 바로잡았다. 그 밖에는 한 글자도 손대지 않았다.
 * ⚠️ ‘동물의 한살이’의 홑따옴표는 인용 부호라 본문에 그대로 살렸다.
 *    다만 젤리캡쳐 타일·글자 조각·낱말 판에는 부호가 붙지 않은 어절만 넣었다.
 *
 * 🔴 이 회차는 L1~L3과 달리 **한 문단 = 한 쪽**이다.
 *    sentences[].page 에 문단 번호를 넣어 여러 문장이 같은 쪽을 나눠 쓴다(1쪽 3 · 2쪽 5 · 3~5쪽 각 1).
 *
 * 중심 소리 규칙 둘:
 *   ① 받침 연음 liaison    — 동물은 · 자손을 · 한살이 · 먹이를 · 먹으며 · 알에서 · 알을 · 어른으로 · 태어났을
 *   ② 비음화 nasalization  — 낳는[난는] · 있는[인는] · 겪는답니다[경는담니다]
 * 보조: 된소리 tensification(죽게 · 있고 · 몸집이) · 겹받침 연음 clusterLiaison(늙어가다)
 *      · 거센소리 aspiration(비슷한)
 *
 * ⚠️ questions 의 answer 는 ‘sentences 의 번호’다(0부터, 쪽 번호가 아니다).
 *    아이가 본문에서 그 문장을 눌러 답한다.
 */
window.ONQ_CONTENT_PACK = {
  version: "0.1.0",
  contentId: "RF-L8-001",
  series: "읽기유창성 · ONQ 8",
  bookTitle: "동물은 어떻게 자랄까요?",
  credit: {
    title: "동물은 어떻게 자랄까요?",
    source: "온큐베이트",
    license: "직접 제작 텍스트 · 온큐베이트 수업용 재구성",
    modified: "온큐베이트 창작",
    programRights: "읽기유창성 프로그램 활동 · 평가 설계 © 온큐베이트",
    allRights: "© 2026 온큐베이트. All rights reserved."
  },
  sessions: {
    session01: {
      lessonId: "reading.fluency.rf-l8-001-animal-lifecycle.s01",
      sessionLabel: "1회차",
      range: "본문 1~5쪽 전체",
      coverTitle: "태어나서 어른이 될 때까지",
      goal: "받침 소리를 뒤로 넘겨 이어 읽고, 긴 문장을 뜻 덩어리로 나누어 읽어요.",
      coverImage: "assets/book/page-01.webp",
      focusRules: [
        "받침 뒤에 모음이 오면 받침을 뒤로 넘겨 이어 읽어요.",
        "받침 뒤에 ㄴ·ㅁ이 오면 받침이 콧소리로 바뀌어요.",
        "‘동물은 태어나서 / 자라고’처럼 뜻 덩어리로 끊어 읽어요."
      ],

      // 문장 완성 — 소리를 듣고 글자 조각을 순서대로 고른다. 미끼는 음절 하나짜리다.
      game1: [
        { word: "자손을",   chunks: ["자", "손", "을"],       distractors: ["차", "소", "늘"], hint: "받침 ㄴ을 넘겨 [자소늘]로 소리 나요.", rule: "liaison" },
        { word: "먹이를",   chunks: ["먹", "이", "를"],       distractors: ["머", "기", "르"], hint: "받침 ㄱ을 넘겨 [머기를]로 소리 나요.", rule: "liaison" },
        { word: "알에서",   chunks: ["알", "에", "서"],       distractors: ["아", "레", "저"], hint: "받침 ㄹ을 넘겨 [아레서]로 소리 나요.", rule: "liaison" },
        { word: "어른으로", chunks: ["어", "른", "으", "로"], distractors: ["여", "르", "노", "루"], hint: "받침 ㄴ을 넘겨 [어르느로]로 소리 나요.", rule: "liaison" },
        { word: "늙어가다", chunks: ["늙", "어", "가", "다"], distractors: ["늘", "거", "나", "따"], hint: "겹받침에서 뒤 자음만 넘어가 [늘거가다]로 읽어요.", rule: "clusterLiaison" },
        { word: "몸집이",   chunks: ["몸", "집", "이"],       distractors: ["못", "찝", "비"], hint: "‘집’이 된소리로 세게 나 [몸찌비]로 읽어요.", rule: "tensification" },
        { word: "낳는",     chunks: ["낳", "는"],             distractors: ["나", "능"],       hint: "받침이 콧소리로 바뀌어 [난는]으로 읽어요.", rule: "nasalization" },
        { word: "비슷한",   chunks: ["비", "슷", "한"],       distractors: ["스", "탄", "슬"], hint: "받침이 ㅎ을 만나 [비스탄]처럼 거세게 나요.", rule: "aspiration" }
      ],

      // 젤리캡쳐 — 타일 열두 개. 모두 부호가 붙지 않은 본문 어절이다.
      game2: [
        { word: "동물은",   phrase: "동물은 태어나서 자라고",      rule: "liaison" },
        { word: "늙어가다", phrase: "시간이 흐르면 늙어가다",      rule: "clusterLiaison" },
        { word: "죽게",     phrase: "마침내 죽게 되지요",          rule: "tensification" },
        { word: "자손을",   phrase: "자손을 남기고 생을 마칠",     rule: "liaison" },
        { word: "한살이의", phrase: "한살이의 모습은 달라요",      rule: "liaison" },
        { word: "비슷한",   phrase: "어미와 비슷한 모습의 새끼로", rule: "aspiration" },
        { word: "먹이를",   phrase: "새끼는 먹이를 먹으며",        rule: "liaison" },
        { word: "몸집이",   phrase: "몸집이 커져요",               rule: "tensification" },
        { word: "알에서",   phrase: "알에서 애벌레로 태어나요",    rule: "liaison" },
        { word: "있는",     phrase: "날개가 있는 나비가",          rule: "nasalization" },
        { word: "낳는",     phrase: "알을 낳는 동물도",            rule: "nasalization" },
        { word: "어른으로", phrase: "어른으로 성장하며",           rule: "liaison" }
      ],

      // 나누어 읽기 판. related:false 는 이 글 밖의 낱말이다.
      wordPool: [
        { word: "한살이",  related: true },  { word: "애벌레",  related: true },
        { word: "번데기",  related: true },  { word: "나비",    related: true },
        { word: "어미",    related: true },  { word: "곤충",    related: true },
        { word: "우산",    related: false }, { word: "기차",    related: false },
        { word: "냉장고",  related: false }, { word: "자전거",  related: false },
        { word: "축구공",  related: false }, { word: "지우개",  related: false }
      ],

      // 본문 11문장 — page 는 **문단 번호**다(한 문단 = 한 쪽).
      sentences: [
        { page: 1, text: "동물은 태어나서 자라고, 다 자라면 새끼를 낳아요.",
          focus: "동물은", guide: "받침 ㄹ을 뒤로 넘겨 [동무른]으로 이어 읽어요.",
          apply: "동물은 저마다 사는 곳이 달라요.", rule: "liaison" },
        { page: 1, text: "시간이 흐르면 늙어가다 마침내 죽게 되지요.",
          focus: "늙어가다", guide: "겹받침에서 뒤 자음만 넘어가 [늘거가다]로 읽어요.",
          apply: "큰 나무도 오래되면 늙어가다 쓰러져요.", rule: "clusterLiaison" },
        { page: 1, text: "이렇게 동물이 태어나서 자손을 남기고 생을 마칠 때까지의 과정을 ‘동물의 한살이’라고 해요.",
          focus: "자손을", guide: "받침 ㄴ을 뒤로 넘겨 [자소늘]로 이어 읽어요.",
          apply: "동물은 자손을 남기고 떠나요.", rule: "liaison" },
        { page: 2, text: "동물마다 한살이의 모습은 달라요.",
          focus: "한살이의", guide: "받침 ㄹ을 뒤로 넘겨 [한사리]처럼 이어 읽어요.",
          apply: "개구리도 한살이의 과정을 거쳐요.", rule: "liaison" },
        { page: 2, text: "개는 어미와 비슷한 모습의 새끼로 태어나요.",
          focus: "비슷한", guide: "받침이 ㅎ을 만나 [비스탄]처럼 거센소리로 나요.",
          apply: "동생은 나와 비슷한 옷을 입어요.", rule: "aspiration" },
        { page: 2, text: "새끼는 먹이를 먹으며 몸집이 커져요.",
          focus: "몸집이", guide: "‘몸’과 ‘집’이 붙어 [몸찝]이 되고, 받침을 넘겨 [몸찌비]로 읽어요.",
          apply: "강아지는 몸집이 점점 커져요.", rule: "compoundJuncture" },
        { page: 2, text: "반면 나비는 알에서 애벌레로 태어나요.",
          focus: "알에서", guide: "받침 ㄹ을 뒤로 넘겨 [아레서]로 이어 읽어요.",
          apply: "병아리가 알에서 톡 나와요.", rule: "liaison" },
        { page: 2, text: "애벌레는 번데기를 거쳐 날개가 있는 나비가 돼요.",
          focus: "있는", guide: "받침이 콧소리로 바뀌어 [인는]으로 읽어요.",
          apply: "날개가 있는 곤충을 찾아봐요.", rule: "nasalization" },
        { page: 3, text: "이렇게 모습이 크게 변하는 동물도 있고, 태어났을 때의 모습을 유지하며 자라는 동물도 있어요.",
          focus: "있고", guide: "뒤 글자가 된소리로 세게 나 [읻꼬]로 읽어요.",
          apply: "물에 사는 동물도 있고 땅에 사는 동물도 있어요.", rule: "tensification" },
        { page: 4, text: "또 새나 곤충처럼 알을 낳는 동물도 있고, 포유류처럼 새끼를 낳는 동물도 있어요.",
          focus: "낳는", guide: "받침이 콧소리로 바뀌어 [난는]으로 읽어요.",
          apply: "알을 낳는 새를 보았어요.", rule: "nasalization" },
        { page: 5, text: "사람도 다른 동물들과 마찬가지로 아기에서 어린이, 청소년, 어른으로 성장하며 한살이를 겪는답니다.",
          focus: "어른으로", guide: "받침 ㄴ을 뒤로 넘겨 [어르느로]로 이어 읽어요.",
          apply: "아이가 자라서 어른으로 성장해요.", rule: "liaison" }
      ],

      // 어휘 활동 여덟 — ①생활 장면 ②본문 문장 두 걸음.
      vocab: [
        { word: "한살이",
          image: "assets/vocab/vocab-s01-01-lifecycle.webp", alt: "알·애벌레·번데기·나비가 동그랗게 이어진 그림",
          bookImage: "assets/vocab/vocab-s01-01-book-lifecycle.webp", bookAlt: "동물마다 자라는 모습이 다르게 그려진 장면",
          daily: { frame: ["개구리의 ", "를 그려 봤어요."], answer: "한살이", other: "발자국" },
          book:  { frame: ["동물마다 ", "의 모습은 달라요."], answer: "한살이", other: "발자국" },
          meaning: "태어나서 자라고 자손을 남기고 생을 마칠 때까지의 과정이에요." },
        { word: "자손",
          image: "assets/vocab/vocab-s01-02-offspring.webp", alt: "어미 동물 뒤로 새끼와 그 새끼가 줄지어 선 그림",
          bookImage: "assets/vocab/vocab-s01-02-book-offspring.webp", bookAlt: "동물이 새끼를 남기고 생을 마치는 장면",
          daily: { frame: ["새끼가 태어나 ", "이 늘어요."], answer: "자손", other: "친구" },
          book:  { frame: ["이렇게 동물이 태어나서 ", "을 남기고 생을 마칠 때까지의 과정을 ‘동물의 한살이’라고 해요."], answer: "자손", other: "친구" },
          meaning: "나에게서 이어지는 새끼와 그 뒤로 이어지는 것들이에요." },
        { word: "어미",
          image: "assets/vocab/vocab-s01-03-mother-animal.webp", alt: "몸집이 큰 고양이가 새끼를 품고 있는 그림",
          bookImage: "assets/vocab/vocab-s01-03-book-mother-animal.webp", bookAlt: "어미 개와 닮은 강아지가 나란히 있는 장면",
          daily: { frame: ["", " 고양이가 새끼를 품어요."], answer: "어미", other: "새끼" },
          book:  { frame: ["개는 ", "와 비슷한 모습의 새끼로 태어나요."], answer: "어미", other: "새끼" },
          meaning: "새끼를 낳아 기르는 짐승의 엄마예요." },
        { word: "새끼",
          image: "assets/vocab/vocab-s01-04-baby-animal.webp", alt: "작은 강아지 여러 마리가 폴짝 뛰노는 그림",
          bookImage: "assets/vocab/vocab-s01-04-book-baby-animal.webp", bookAlt: "포유류가 새끼를 낳아 돌보는 장면",
          daily: { frame: ["강아지 ", "가 폴짝 뛰어놀아요."], answer: "새끼", other: "어미" },
          book:  { frame: ["또 새나 곤충처럼 알을 낳는 동물도 있고, 포유류처럼 ", "를 낳는 동물도 있어요."], answer: "새끼", other: "어미" },
          meaning: "동물이 낳은 지 얼마 안 된 어린 것이에요." },
        { word: "먹이",
          image: "assets/vocab/vocab-s01-05-food.webp", alt: "새가 부리에 벌레를 물고 날아가는 그림",
          bookImage: "assets/vocab/vocab-s01-05-book-food.webp", bookAlt: "새끼 동물이 먹으며 몸집이 커지는 장면",
          daily: { frame: ["새가 ", "를 물고 날아가요."], answer: "먹이", other: "나뭇가지" },
          book:  { frame: ["새끼는 ", "를 먹으며 몸집이 커져요."], answer: "먹이", other: "나뭇가지" },
          meaning: "동물이 살아가려고 먹는 것이에요." },
        { word: "애벌레",
          image: "assets/vocab/vocab-s01-06-caterpillar.webp", alt: "초록 잎사귀 위를 기어가는 통통한 애벌레",
          bookImage: "assets/vocab/vocab-s01-06-book-caterpillar.webp", bookAlt: "나비 알에서 애벌레가 나오는 장면",
          daily: { frame: ["잎사귀 위에 ", "가 기어가요."], answer: "애벌레", other: "개미" },
          book:  { frame: ["반면 나비는 알에서 ", "로 태어나요."], answer: "애벌레", other: "개미" },
          meaning: "알에서 나온, 아직 날개가 없는 벌레예요." },
        { word: "번데기",
          image: "assets/vocab/vocab-s01-07-pupa.webp", alt: "나뭇가지에 매달린 갈색 번데기",
          bookImage: "assets/vocab/vocab-s01-07-book-pupa.webp", bookAlt: "애벌레가 번데기를 거쳐 나비가 되는 장면",
          daily: { frame: ["나뭇가지에 ", "가 붙어 있어요."], answer: "번데기", other: "열매" },
          book:  { frame: ["애벌레는 ", "를 거쳐 날개가 있는 나비가 돼요."], answer: "번데기", other: "열매" },
          meaning: "애벌레가 나비가 되기 전에 머무는 껍질이에요." },
        { word: "포유류",
          image: "assets/vocab/vocab-s01-08-mammal.webp", alt: "어미 소가 새끼에게 젖을 먹이는 그림",
          bookImage: "assets/vocab/vocab-s01-08-book-mammal.webp", bookAlt: "알을 낳는 동물과 새끼를 낳는 동물을 나눈 장면",
          daily: { frame: ["", " 어미가 새끼에게 젖을 줘요."], answer: "포유류", other: "물고기" },
          book:  { frame: ["또 새나 곤충처럼 알을 낳는 동물도 있고, ", "처럼 새끼를 낳는 동물도 있어요."], answer: "포유류", other: "물고기" },
          meaning: "새끼를 낳아 젖을 먹여 기르는 동물이에요." }
      ],

      // 읽기이해 넷 — answer 는 위 sentences 의 번호(0부터)다. 넷이 서로 다르다.
      questions: [
        { prompt: "‘동물의 한살이’가 무엇인지 알려 주는 문장은 무엇인가요?", answer: 2,
          hint: "‘한살이’라는 말이 처음 나오는 문장을 찾아보세요.",
          explanation: "태어나서 자손을 남기고 생을 마칠 때까지의 과정을 ‘동물의 한살이’라고 했어요." },
        { prompt: "개는 어미와 비슷한 모습의 새끼로 태어나요. 나비는 이와 달리 어떻게 태어나는지 말한 문장은 무엇인가요?", answer: 6,
          hint: "‘반면’으로 시작하는 문장을 보세요.",
          explanation: "개와 달리 나비는 알에서 애벌레로 태어난다고 했어요 — 개와 나비가 서로 다른 자리예요." },
        { prompt: "나비는 자라면서 모습이 크게 바뀌고, 개는 크게 바뀌지 않아요. 이 두 가지를 함께 말한 문장은 무엇인가요?", answer: 8,
          hint: "‘이렇게’로 시작하는 긴 문장을 보세요.",
          explanation: "모습이 크게 변하는 동물도 있고, 태어났을 때의 모습을 유지하며 자라는 동물도 있다고 했어요." },
        { prompt: "나도 아기였다가 어린이가 되었어요. 사람도 동물처럼 한살이를 겪는다는 것을 알 수 있는 문장은 무엇인가요?", answer: 10,
          hint: "‘사람도’로 시작하는 마지막 문장을 보세요.",
          explanation: "사람도 아기에서 어린이, 청소년, 어른으로 성장하며 한살이를 겪는다고 했어요." }
      ]
    }
  }
};
