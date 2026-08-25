window.ONQ_CONTENT_PACK = {
  version: "0.1.0",
  series: "그림책 기반 읽기유창성",
  bookTitle: "우리는 친구",
  // 원작 표시 — 규격 9장이 요구하는 다섯(제목·저자·출처·라이선스·변경 여부).
  // CC BY 4.0은 저작자 표시가 **의무**라 원작자를 빠뜨리면 안 된다.
  credit: {
    title: "우리는 친구",
    originalText: "제이드 매티슨 (Jade Mathieson)",
    originalArt: "헤랄 판 와익 (Gerhard Van Wyk)",
    koreanText: "김은파",
    source: "두루책방",
    license: "CC BY 4.0",
    modified: "변경함 — 읽기유창성 수업용으로 재구성(회차 분할·활동 추가·삽화 별도 제작)",
    // 원작은 CC BY 4.0이라 재사용이 열려 있다. 그러나 그 위에 얹은 **읽기유창성 훈련
    // 프로그램**(활동 설계·문항·평가 얼개·삽화)은 별개의 저작물이고 우리 것이다.
    // 원작 표시만 있으면 「이 자료 전체가 CC BY」로 읽힐 자리라 갈라 적는다.
    programRights: "읽기유창성 프로그램 활동 · 평가 설계 © 온큐베이트",
    allRights: "© 2026 온큐베이트. All rights reserved."
  },
  sourceLicense: "CC BY 4.0 원작 기반",
  sessions: {
    session01: {
      lessonId: "reading.fluency.we-are-friends.s01",
      sessionLabel: "1회차",
      range: "그림책 2~7쪽",
      coverTitle: "서로서로 도와줘요",
      goal: "이어지는 받침 소리와 긴 낱말을 정확하게 읽어요.",
      coverImage: "assets/book/page-01.webp",
      focusRules: [
        "받침 뒤에 모음이 오면 소리를 자연스럽게 이어 읽어요.",
        "받침과 ㅎ이 만나 달라지는 소리를 정확하게 읽어요.",
        "긴 낱말은 글자 덩어리를 살펴 천천히 읽어요."
      ],
      game1: [
        { word: "있어요", chunks: ["있", "어", "요"], distractors: ["이", "써", "오", "여"], hint: "첫 글자는 ㅇ으로 시작해요.", rule: "liaison" },
        { word: "생겼어요", chunks: ["생", "겼", "어", "요"], distractors: ["새", "겨", "서", "오"], hint: "두 번째 글자에는 받침 ㅆ이 있어요.", rule: "liaison" },
        { word: "작은", chunks: ["작", "은"], distractors: ["자", "근", "안", "을"], hint: "첫 글자는 ㅈ으로 시작해요.", rule: "liaison" },
        { word: "코뿔소예요", chunks: ["코", "뿔", "소", "예", "요"], distractors: ["꼬", "불", "서", "에", "오"], hint: "두 번째 글자는 뿔의 첫 글자예요." },
        { word: "괴롭혀요", chunks: ["괴", "롭", "혀", "요"], distractors: ["궤", "로", "펴", "여"], hint: "세 번째 글자는 ㅎ으로 시작해요.", rule: "aspiration" }
      ],
      game2: [
        { word: "있어요", phrase: "좋은 친구가 있어요", rule: "liaison" },
        { word: "생겼어요", phrase: "다르게 생겼어요", rule: "liaison" },
        { word: "작은", phrase: "작은 벌레들", rule: "liaison" },
        { word: "괴롭혀요", phrase: "벌레들이 괴롭혀요", rule: "aspiration" },
        { word: "좋은", phrase: "아주 좋은 친구", rule: "hDeletion" },
        { word: "부리로", phrase: "새는 부리로" },
        { word: "우산", phrase: "파란 우산 아래" },
        { word: "기차", phrase: "빠른 기차를 타요" },
        { word: "모래", phrase: "고운 모래를 만져요" },
        { word: "연필", phrase: "연필로 써요" },
        { word: "수박", phrase: "수박을 먹어요" },
        { word: "바다", phrase: "넓은 바다를 봐요" }
      ],
      wordPool: [
        { word: "친구", related: true }, { word: "새", related: true },
        { word: "코뿔소", related: true }, { word: "벌레", related: true },
        { word: "악어", related: true }, { word: "이빨", related: true },
        { word: "청소", related: true }, { word: "우산", related: false },
        { word: "기차", related: false }, { word: "모래", related: false },
        { word: "연필", related: false }, { word: "수박", related: false }
      ],
      sentences: [
        { page: 2, text: "우리에게는 아주 좋은 친구가 있어요.", focus: "있어요", guide: "‘있’의 받침 소리를 뒤 글자와 이어서 [이써요]처럼 읽어요.", apply: "친구가 옆에 있어요.", rule: "liaison" },
        { page: 2, text: "그 친구는 우리와 전혀 다르게 생겼어요.", focus: "생겼어요", guide: "‘겼’의 받침 소리를 뒤 글자와 이어서 [생겨써요]처럼 읽어요.", apply: "새의 날개가 생겼어요.", rule: "liaison" },
        { page: 3, text: "바로 이 새가 우리의 친구랍니다!", focus: "친구랍니다", guide: "긴 낱말은 ‘친구·랍니다’처럼 덩어리를 살펴 읽어요.", apply: "우리는 친구랍니다.", rule: "nasalization" },
        { page: 4, text: "나는 코뿔소예요.", focus: "코뿔소예요", guide: "‘코뿔소·예요’처럼 낱말 안의 글자 덩어리를 살펴 읽어요.", apply: "나는 악어예요." },
        { page: 4, text: "작은 벌레들이 나를 괴롭혀요.", focus: "작은", guide: "‘작’의 받침 소리를 뒤 글자와 이어서 [자근]처럼 읽어요.", apply: "작은 새가 날아요.", rule: "liaison" },
        { page: 5, text: "새는 벌레를 모두 잡아 주지요.", focus: "잡아", guide: "‘잡’의 받침 소리를 뒤 글자와 자연스럽게 이어 읽어요.", apply: "벌레를 잡아요.", rule: "liaison" },
        { page: 6, text: "나는 악어예요.", focus: "악어예요", guide: "받침 소리를 뒤 글자와 이어 [아거예요]처럼 읽어요.", apply: "작은 악어예요.", rule: "liaison" },
        { page: 6, text: "음식을 먹고 나서 이빨을 닦을 수가 없어요.", focus: "없어요", guide: "받침 뒤에 모음이 오면 소리를 자연스럽게 이어 읽어요.", apply: "칫솔이 없어요.", rule: "clusterLiaison" },
        { page: 7, text: "새는 부리로 이빨을 깨끗이 청소해 주지요.", focus: "이빨을", guide: "‘이빨’의 받침 소리를 뒤 글자와 이어서 읽어요.", apply: "이빨을 닦아요.", rule: "liaison" }
      ],
      vocab: [
        { word: "전혀", image: "assets/vocab/vocab-s01-01-notatall.webp", alt: "작고 빨간 운동화와 크고 까만 장화가 나란히 놓여 있고 아이가 둘을 번갈아 보는 모습",
          bookImage: "assets/vocab/vocab-s01-01-book-different.webp", bookAlt: "몸집이 아주 큰 코뿔소와 아주 작은 새가 나란히 서서 서로를 바라보는 모습",
          daily:  { frame: ["내 신발과 동생 신발은 ", " 달라요."], answer: "전혀", other: "조금" },
          book:   { frame: ["그 친구는 우리와 ", " 다르게 생겼어요."], answer: "전혀", other: "조금" },
          meaning: "‘조금도’와 같은 말이에요 — 전혀 다르면 닮은 데가 하나도 없어요." },
        { word: "괴롭히다", image: "assets/vocab/vocab-s01-02-bother.webp", alt: "파리 한 마리가 자꾸 얼굴에 앉아 손을 내저으며 찡그린 아이",
          bookImage: "assets/vocab/vocab-s01-02-book-bugs.webp", bookAlt: "작은 벌레들이 등과 얼굴 둘레를 맴돌아 괴로운 표정을 짓는 코뿔소",
          daily:  { frame: ["파리가 자꾸 나를 ", "."], answer: "괴롭혀요", other: "도와줘요" },
          book:   { frame: ["작은 벌레들이 나를 ", "."], answer: "괴롭혀요", other: "도와줘요" },
          meaning: "귀찮게 하거나 힘들게 해서 싫은 기분이 들게 하는 거예요." },
        { word: "부리", image: "assets/vocab/vocab-s01-03-beak.webp", alt: "참새가 뾰족한 입으로 땅에 떨어진 빵부스러기를 콕콕 쪼아 먹는 모습",
          bookImage: "assets/vocab/vocab-s01-03-book-beak.webp", bookAlt: "새의 뾰족한 부리를 가까이서 본 모습 — 그 부리로 악어의 이빨 하나를 콕 집고 있다",
          daily:  { frame: ["참새가 ", "로 빵부스러기를 쪼아 먹어요."], answer: "부리", other: "꼬리" },
          book:   { frame: ["새는 ", "로 이빨을 깨끗이 청소해 주지요."], answer: "부리", other: "꼬리" },
          meaning: "새의 뾰족하고 단단한 입이에요 — 이것으로 먹이를 쪼아 먹어요." },
        { word: "깨끗이", image: "assets/vocab/vocab-s01-04-clean.webp", alt: "거품을 잔뜩 내어 손가락 사이까지 구석구석 씻는 아이와 옆에 놓인 비누",
          bookImage: "assets/vocab/vocab-s01-04-book-teeth.webp", bookAlt: "청소가 끝나 하얗게 반짝이는 악어의 이빨과 그 옆에서 흐뭇하게 바라보는 새",
          daily:  { frame: ["손을 ", " 씻어요."], answer: "깨끗이", other: "대충" },
          book:   { frame: ["새는 부리로 이빨을 ", " 청소해 주지요."], answer: "깨끗이", other: "대충" },
          meaning: "더러운 것이 하나도 남지 않게 한다는 뜻이에요." },
        { word: "청소하다", image: "assets/vocab/vocab-s01-05-cleanup.webp", alt: "빗자루로 교실 바닥을 쓸고 걸레로 책상을 닦는 아이들",
          bookImage: "assets/vocab/vocab-s01-05-book-cleaning.webp", bookAlt: "악어가 입을 크게 벌리고 그 안에서 새가 이빨 사이를 쪼아 주는 모습",
          daily:  { frame: ["우리는 교실을 함께 ", "."], answer: "청소해요", other: "구경해요" },
          book:   { frame: ["새는 부리로 이빨을 깨끗이 ", " 주지요."], answer: "청소해", other: "구경해" },
          meaning: "더러운 것을 쓸고 닦아서 깨끗하게 만드는 거예요." }
      ],
      questions: [
        { prompt: "우리의 친구는 누구인가요?", answer: 2 },
        { prompt: "코뿔소를 괴롭히는 것은 무엇인가요?", answer: 4 },
        { prompt: "새는 코뿔소를 어떻게 도와주나요?", answer: 5 },
        { prompt: "악어가 혼자 할 수 없는 일은 무엇인가요?", answer: 7 },
        { prompt: "새는 악어의 이빨을 어떻게 청소하나요?", answer: 8 }
      ]
    },
    session02: {
      lessonId: "reading.fluency.we-are-friends.s02",
      sessionLabel: "2회차",
      range: "그림책 8~13쪽",
      coverTitle: "서로 달라도 우리는 친구예요",
      goal: "이어지는 소리를 문장에서 정확하게 읽어요.",
      coverImage: "assets/book/page-01.webp",
      focusRules: [
        "받침 뒤에 모음이 오면 소리를 자연스럽게 이어 읽어요.",
        "목표 낱말을 소리와 글자에 맞추어 한 덩어리로 읽어요.",
        "긴 문장은 뜻이 이어지는 짧은 덩어리로 나누어 읽어요."
      ],
      game1: [
        { word: "얼룩말이에요", chunks: ["얼", "룩", "말", "이", "에", "요"], distractors: ["억", "룽", "마", "리", "예", "오"], hint: "두 번째 글자에는 받침 ㄱ이 있어요.", rule: "nasalization" },
        { word: "기린이에요", chunks: ["기", "린", "이", "에", "요"], distractors: ["키", "린", "리", "예", "오"], hint: "두 번째 글자는 받침 ㄴ으로 끝나요.", rule: "liaison" },
        { word: "가렵지만", chunks: ["가", "렵", "지", "만"], distractors: ["카", "엽", "치", "망"], hint: "두 번째 글자는 ㄹ로 시작하고 받침 ㅂ이 있어요.", rule: "tensification" },
        { word: "긁을", chunks: ["긁", "을"], distractors: ["글", "극", "를", "울"], hint: "첫 글자에는 받침이 두 개 있어요.", rule: "clusterLiaison" },
        { word: "긁어", chunks: ["긁", "어"], distractors: ["글", "극", "거", "오"], hint: "첫 글자에는 받침이 두 개 있어요.", rule: "clusterLiaison" },
        { word: "위험한", chunks: ["위", "험", "한"], distractors: ["의", "혐", "함", "안"], hint: "가운데 글자는 ㅎ으로 시작해요." },
        { word: "생겼지만", chunks: ["생", "겼", "지", "만"], distractors: ["샘", "겻", "치", "망"], hint: "두 번째 글자는 ㄲ으로 시작해요.", rule: "tensification" },
        { word: "상관없어요", chunks: ["상", "관", "없", "어", "요"], distractors: ["산", "광", "업", "서", "오"], hint: "세 번째 글자에는 받침이 두 개 있어요.", rule: "clusterLiaison" },
        { word: "즐거워요", chunks: ["즐", "거", "워", "요"], distractors: ["줄", "고", "와", "오"], hint: "첫 글자에는 받침 ㄹ이 있어요." },
        { word: "동물이", chunks: ["동", "물", "이"], distractors: ["도", "무", "리", "을"], hint: "가운데 글자에는 받침 ㄹ이 있어요.", rule: "liaison" },
        { word: "듣는", chunks: ["듣", "는"], distractors: ["든", "너", "드", "을"], hint: "첫 글자에는 받침 ㄷ이 있어요.", rule: "nasalization" },
        { word: "친구니까요", chunks: ["친", "구", "니", "까", "요"], distractors: ["진", "고", "리", "가", "오"], hint: "네 번째 글자는 ㄲ으로 시작해요." }
      ],
      game2: [
        { word: "얼룩말이에요", phrase: "나는 얼룩말이에요", rule: "nasalization" },
        { word: "기린이에요", phrase: "나는 기린이에요", rule: "liaison" },
        { word: "가렵지만", phrase: "머리가 가렵지만", rule: "tensification" },
        { word: "긁을", phrase: "긁을 수가 없어요", rule: "clusterLiaison" },
        { word: "긁어", phrase: "가려운 곳을 긁어", rule: "clusterLiaison" },
        { word: "위험한", phrase: "위험한 동물이 와요" },
        { word: "생겼지만", phrase: "다르게 생겼지만", rule: "tensification" },
        { word: "상관없어요", phrase: "그건 상관없어요", rule: "clusterLiaison" },
        { word: "즐거워요", phrase: "듣는 것도 즐거워요" },
        { word: "동물이", phrase: "위험한 동물이", rule: "liaison" },
        { word: "듣는", phrase: "노래를 듣는 것도", rule: "nasalization" },
        { word: "친구니까요", phrase: "우리는 친구니까요" }
      ],
      wordPool: [
        { word: "얼룩말이에요", related: true }, { word: "기린이에요", related: true },
        { word: "가렵지만", related: true }, { word: "긁을", related: true },
        { word: "긁어", related: true }, { word: "위험한", related: true },
        { word: "생겼지만", related: true }, { word: "상관없어요", related: true },
        { word: "즐거워요", related: true }, { word: "도토리", related: false },
        { word: "고래", related: false }, { word: "우유", related: false }
      ],
      sentences: [
        { page: 8, text: "나는 기린이에요.", focus: "기린이에요", guide: "기린이에요를 앞말과 자연스럽게 이어 읽어요.", apply: "나는 어린이예요.", rule: "liaison" },
        { page: 8, text: "머리가 가렵지만 긁을 수가 없어요.", focus: "가렵지만 긁을", guide: "가렵지만, 긁을 두 낱말을 글자마다 끊지 않고 한 덩어리로 읽어요.", apply: "손이 가렵지만 긁을 수 없어요.", rule: "clusterLiaison" },
        { page: 9, text: "새는 가려운 곳을 긁어 주지요.", focus: "긁어", guide: "긁어를 앞뒤 말과 자연스럽게 이어 읽어요.", apply: "등을 살살 긁어 줘요.", rule: "clusterLiaison" },
        { page: 9, text: "아, 시원해!", focus: "시원해", guide: "느낌표 앞까지 또렷하게 읽어요.", apply: "아, 좋아!" },
        { page: 10, text: "나는 얼룩말이에요.", focus: "얼룩말이에요", guide: "[얼룽마리에요]처럼 바뀌고 이어지는 소리를 살펴 읽어요.", apply: "얼룩말이 달려요.", rule: "nasalization" },
        { page: 10, text: "나이가 들어서 먼 곳이 잘 안 보여요.", focus: "곳이", guide: "받침 소리가 뒤 글자와 이어지는 것을 살펴 읽어요.", apply: "옷이 보여요.", rule: "liaison" },
        { page: 11, text: "새는 위험한 동물이 오는지 감시해 주지요.", focus: "위험한", guide: "위험한이라는 낱말을 한 덩어리로 또렷하게 읽어요.", apply: "위험한 곳은 피해서 가요." },
        { page: 12, text: "새는 우리와 아주 다르게 생겼지만 그건 상관없어요.", focus: "생겼지만 그건 상관없어요", guide: "생겼지만 / 그건 상관없어요와 같이 뜻이 이어지는 두 덩어리로 읽어요.", apply: "모양이 달라도 상관없어요.", rule: "clusterLiaison" },
        { page: 13, text: "새가 부르는 노래를 듣는 것도 즐거워요.", focus: "즐거워요", guide: "마지막 낱말인 즐거워요까지 힘을 유지해 또렷하게 읽어요.", apply: "함께 노래하면 즐거워요." },
        { page: 13, text: "우리는 친구니까요!", focus: "친구니까요", guide: "마지막 문장을 뜻이 잘 드러나도록 또렷하게 읽어요.", apply: "서로 달라도 친구니까요." }
      ],
      vocab: [
        { word: "가렵다", image: "assets/vocab/vocab-01-itchy.webp", alt: "팔에 모기 물린 자국이 빨갛게 부풀어 찡그린 아이",
          bookImage: "assets/vocab/vocab-01-book-rhino.webp", bookAlt: "벌레들이 등 주위를 맴돌아 괴로운 표정을 짓는 코뿔소",
          daily:  { frame: ["팔이 ", "."], answer: "가려워요", other: "두려워요" },
          book:   { frame: ["머리가 ", " 긁을 수가 없어요."], answer: "가렵지만", other: "두렵지만" },
          meaning: "살갗이 근질근질해서 긁고 싶은 느낌이에요." },
        { word: "긁다", image: "assets/vocab/vocab-02-scratch.webp", alt: "모기 물린 자리를 손톱으로 긁는 손",
          bookImage: "assets/vocab/vocab-02-book-scratch.webp", bookAlt: "새가 부리로 얼룩말의 등을 긁어 주고 얼룩말이 눈을 감고 웃는 모습",
          daily:  { frame: ["물린 데를 ", "."], answer: "긁어요", other: "닦아요" },
          book:   { frame: ["새는 가려운 곳을 ", " 주지요."], answer: "긁어", other: "닦아" },
          meaning: "손톱이나 뾰족한 것으로 살갗을 문지르는 거예요." },
        { word: "위험하다", image: "assets/vocab/vocab-03-danger.webp", alt: "차가 빠르게 지나가는 길과 인도에 서 있는 아이",
          bookImage: "assets/vocab/vocab-03-book-lion.webp", bookAlt: "마른 풀숲에서 이쪽을 노려보는 사자",
          daily:  { frame: ["차가 다니는 길은 ", "."], answer: "위험해요", other: "경험해요" },
          book:   { frame: ["새는 ", " 동물이 오는지 감시해 주지요."], answer: "위험한", other: "경험한" },
          meaning: "다칠 수도 있어서 조심해야 하는 거예요." },
        { word: "감시하다", image: "assets/vocab/vocab-04-watch.webp", alt: "교실 뒤에서 시험 보는 학생들을 지켜보는 선생님",
          bookImage: "assets/vocab/vocab-04-book-bird.webp", bookAlt: "마른 가지 끝에 앉아 먼 초원을 살피는 새",
          daily:  { frame: ["선생님이 교실을 ", "."], answer: "감시해요", other: "무시해요" },
          book:   { frame: ["새는 위험한 동물이 오는지 ", " 주지요."], answer: "감시해", other: "무시해" },
          meaning: "무슨 일이 생기는지 계속 지켜보는 거예요." },
        { word: "상관없다", image: "assets/vocab/vocab-05-fine.webp", alt: "비 오는 날 흙탕물 웅덩이에서 옷이 젖도록 신나게 뛰는 아이. 다른 아이들은 우산을 쓰고 지나간다",
          bookImage: "assets/vocab/vocab-05-book-friends.webp", bookAlt: "코뿔소·기린·얼룩말·악어가 나란히 서서 웃고 그 위에 새가 나는 모습",
          daily:  { frame: ["옷이 더러워져도 ", "."], answer: "상관없어요", other: "신경써요" },
          book:   { frame: ["우리와 다르게 생겼지만 그건 ", "."], answer: "상관없어요", other: "신경써요" },
          meaning: "걱정하거나 문제될 것이 없다는 뜻이에요." }
      ],
      questions: [
        { prompt: "기린이 혼자 해결하기 어려운 일은 무엇인가요?", answer: 1 },
        { prompt: "새는 기린을 어떻게 도와주나요?", answer: 2 },
        { prompt: "얼룩말이 잘 보지 못하는 곳은 어디인가요?", answer: 5 },
        { prompt: "새는 얼룩말을 위해 무엇을 감시하나요?", answer: 6 },
        { prompt: "서로 달라도 친구인 까닭이 드러난 문장을 찾아보세요.", answer: 9 }
      ]
    }
  }
};
