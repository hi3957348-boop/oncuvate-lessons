/* RF-L10-002 「일기예보는 어떻게 만들어질까요?」 읽기유창성 — ONQ 10 · 1회차 40분.
 *
 * 비문학 설명문. 승인 본문 15문장은 한 글자도 손대지 않았다.
 * 문체는 **-습니다체**다(앞선 회차의 -요체가 아니다). 안내·문항·어휘 지문도 -습니다체로 맞췄다.
 *
 * 쪽 나눔은 승인 지시대로 여덟 쪽이다. 2~5쪽이 한 문장 = 한 쪽인 까닭은
 * 관측 수단 넷(위성·지상 관측소·레이더·바다 장비와 기구)이 저마다 다른 장비여서
 * 한 그림에 뭉치면 견주어 볼 수 없기 때문이다.
 *
 * 글의 뼈대는 「관측 → 계산 → 사람의 판단 → 전달」의 차례다.
 * 7쪽의 「컴퓨터의 계산만으로 예보가 완성되지 않는다」가 이 글의 매듭이라
 * 이해 문항 하나(questions[2], answer 9)를 그 자리에 걸었다.
 *
 * 소리 규칙은 브리핑이 부르지 않고 **본문 어절을 전수로 훑어 뽑았다**.
 *   중심 둘  liaison(연음)      — 곳에서 · 움직임을 · 필요한 · 앞으로 · 앱을 …
 *            nasalization(비음화) — 있는 · 살펴봅니다 · 만듭니다 · 전달됩니다 …
 *   보조     tensification(제23·26·27항·제12항4) · aspiration(제12항1) ·
 *            codaNeutralization(제9항) · compoundJuncture(조건도[조껀도])
 *   규칙 없음 위성은 · 결과를 · 산과 · 영향을 · 변화를 · 방송과 (ㅇ 받침 · 한자어 ㄹ+ㄱ ·
 *            울림소리 뒤 ㅎ) — 짚지 않는다.
 *
 * ⚠️ questions 의 answer 는 ‘sentences 의 번호’다(0부터, 쪽 번호가 아니다).
 *
 * 🔑 wordPool 은 **읽기 전 예측** 활동이다(shared.js renderWordFind).
 *    「이 낱말이 나올까요?」를 묻는 자리라 **안 나오는 낱말이 절반은 있어야** 물음이 성립한다.
 *    그래서 여섯은 본문 밖에서 골랐다 — 날씨 이야기와 가까워 **헷갈릴 만한** 것으로 두었다
 *    (무지개·천둥·태풍·안개·우산·온도계). 어휘체크 오답과 젤리캡쳐 타일은 규칙대로 전부 본문 낱말이다.
 */
window.ONQ_CONTENT_PACK = {
  version: "0.1.0",
  contentId: "RF-L10-002",
  series: "읽기유창성 · ONQ 10",
  bookTitle: "일기예보는 어떻게 만들어질까요?",
  credit: {
    title: "일기예보는 어떻게 만들어질까요?",
    source: "온큐베이트",
    license: "직접 제작 텍스트 · 온큐베이트 수업용 재구성",
    modified: "온큐베이트 창작",
    programRights: "읽기유창성 프로그램 활동 · 평가 설계 © 온큐베이트",
    allRights: "© 2026 온큐베이트. All rights reserved."
  },
  sessions: {
    session01: {
      lessonId: "reading.fluency.rf-l10-002-forecast-how.s01",
      sessionLabel: "1회차",
      range: "본문 1~8쪽 전체",
      coverTitle: "일기예보가 만들어지는 길",
      goal: "관측에서 예보까지 이어지는 차례를 소리 규칙에 맞게 이어 읽습니다.",
      coverImage: "assets/book/page-01.webp",
      focusRules: [
        "받침 뒤에 모음이 오면 받침을 뒤로 넘겨 이어 읽습니다.",
        "받침 뒤에 ㄴ이 오면 받침이 콧소리(ㅁ·ㄴ·ㅇ)로 바뀝니다.",
        "받침 ㄱ·ㅂ 뒤에 오는 첫소리는 된소리로 세게 납니다.",
        "‘기상 위성은 / 우주에서’처럼 뜻 덩어리로 끊어 읽습니다."
      ],

      // 문장 완성 — 소리를 듣고 글자 조각을 순서대로 고릅니다. 미끼는 음절 하나짜리입니다.
      game1: [
        { word: "곳에서", chunks: ["곳", "에", "서"], distractors: ["고", "세", "써"], hint: "받침 ㅅ을 넘겨 [고세서]로 소리 납니다.", rule: "liaison" },
        { word: "습도",   chunks: ["습", "도"],       distractors: ["슴", "또", "숩"], hint: "뒤 글자가 된소리로 세게 납니다.", rule: "tensification" },
        { word: "있는",   chunks: ["있", "는"],       distractors: ["인", "능", "읻"], hint: "받침이 콧소리로 바뀝니다.", rule: "nasalization" },
        { word: "이렇게", chunks: ["이", "렇", "게"], distractors: ["러", "케", "엏"], hint: "ㅎ이 뒤 소리와 합쳐져 [이러케]로 납니다.", rule: "aspiration" },
        { word: "앞으로", chunks: ["앞", "으", "로"], distractors: ["아", "프", "르"], hint: "받침 ㅍ을 넘겨 [아프로]로 소리 납니다.", rule: "liaison" },
        { word: "필요한", chunks: ["필", "요", "한"], distractors: ["피", "료", "항"], hint: "받침 ㄹ을 넘겨 [피료한]으로 소리 납니다.", rule: "liaison" },
        { word: "활동을", chunks: ["활", "동", "을"], distractors: ["화", "똥", "슬"], hint: "가운데 글자가 된소리로 세게 납니다.", rule: "tensification" },
        { word: "앱을",   chunks: ["앱", "을"],       distractors: ["애", "블", "엡"], hint: "받침 ㅂ을 넘겨 [애블]로 소리 납니다.", rule: "liaison" }
      ],

      // 젤리캡쳐 — 타일 열두 개. 모두 본문 어절이고 부호를 뺐습니다.
      game2: [
        { word: "곳에서",   phrase: "여러 곳에서 날씨를",          rule: "liaison" },
        { word: "관측하는", phrase: "날씨를 관측하는 일부터",      rule: "aspiration" },
        { word: "움직임을", phrase: "위치와 움직임을 살펴봅니다",  rule: "liaison" },
        { word: "기압과",   phrase: "기압과 바람을 측정합니다",    rule: "tensification" },
        { word: "있는",     phrase: "비구름이 있는 곳과",          rule: "nasalization" },
        { word: "필요한",   phrase: "필요한 자료를 모읍니다",      rule: "liaison" },
        { word: "이렇게",   phrase: "이렇게 모은 자료는",          rule: "aspiration" },
        { word: "앞으로",   phrase: "공기가 앞으로 어떻게",        rule: "liaison" },
        { word: "않습니다", phrase: "예보가 완성되지는 않습니다",  rule: "tensification" },
        { word: "예보관은", phrase: "예보관은 관측 자료와",        rule: "liaison" },
        { word: "활동을",   phrase: "야외 활동을 계획하고",        rule: "tensification" },
        { word: "앱을",     phrase: "휴대 전화 앱을 통해",         rule: "liaison" }
      ],

      // 나누어 읽기 판. 지시대로 열둘 모두 본문 낱말이다(파일 맨 위 ⚠️ 참고).
      wordPool: [
        { word: "일기예보", related: true },  { word: "위성",     related: true },
        { word: "레이더",   related: true },  { word: "예보관",   related: true },
        { word: "관측",     related: true },  { word: "컴퓨터",   related: true },
        { word: "무지개",   related: false }, { word: "천둥",     related: false },
        { word: "태풍",     related: false }, { word: "안개",     related: false },
        { word: "우산",     related: false }, { word: "온도계",   related: false }
      ],

      // 본문 15문장 — 여덟 쪽. 2~5쪽은 관측 수단 넷이라 한 문장 = 한 쪽이다.
      sentences: [
        { page: 1, text: "내일 비가 올지, 바람이 얼마나 불지는 어떻게 알 수 있을까요?",
          focus: "있을까요", guide: "받침 ㅆ을 뒤로 넘겨 [이쓸까요]로 이어 읽습니다.",
          apply: "책상 위에 무엇이 있을까요?", rule: "liaison" },
        { page: 1, text: "일기예보는 여러 곳에서 날씨를 관측하는 일부터 시작합니다.",
          focus: "관측하는", guide: "받침 ㄱ이 ㅎ과 합쳐져 [관추카는]으로 읽습니다.",
          apply: "별을 관측하는 밤입니다.", rule: "aspiration" },
        { page: 2, text: "기상 위성은 우주에서 구름의 위치와 움직임을 살펴봅니다.",
          focus: "움직임을", guide: "받침을 차례로 넘겨 [움지기믈]로 이어 읽습니다.",
          apply: "친구의 움직임을 따라 합니다.", rule: "liaison" },
        { page: 3, text: "지상 관측소는 기온, 습도, 기압과 바람을 측정합니다.",
          focus: "습도", guide: "받침 ㅂ 뒤의 ㄷ이 된소리가 되어 [습또]로 읽습니다.",
          apply: "장마철에는 습도가 높습니다.", rule: "tensification" },
        { page: 4, text: "기상 레이더는 비구름이 있는 곳과 비가 내리는 정도를 관측합니다.",
          focus: "있는", guide: "받침이 콧소리로 바뀌어 [인는]으로 읽습니다.",
          apply: "책상 위에 있는 공책을 폅니다.", rule: "nasalization" },
        { page: 5, text: "바다의 관측 장비와 하늘로 띄운 기상 관측 기구도 필요한 자료를 모읍니다.",
          focus: "필요한", guide: "받침 ㄹ을 뒤로 넘겨 [피료한]으로 이어 읽습니다.",
          apply: "지금 필요한 것을 챙깁니다.", rule: "liaison" },
        { page: 6, text: "이렇게 모은 자료는 대형 컴퓨터로 전달됩니다.",
          focus: "이렇게", guide: "받침 ㅎ이 ㄱ과 합쳐져 [이러케]로 읽습니다.",
          apply: "이렇게 하면 더 쉽습니다.", rule: "aspiration" },
        { page: 6, text: "컴퓨터는 지구의 대기를 작은 구역으로 나누고, 각 구역의 공기가 앞으로 어떻게 움직일지 계산합니다.",
          focus: "앞으로", guide: "받침 ㅍ을 뒤로 넘겨 [아프로]로 이어 읽습니다.",
          apply: "한 걸음 앞으로 나갑니다.", rule: "liaison" },
        { page: 6, text: "그 결과를 이용하여 미래의 기온, 바람과 비의 모습을 나타낸 예상 자료를 만듭니다.",
          focus: "만듭니다", guide: "받침 ㅂ이 콧소리로 바뀌어 [만듬니다]로 읽습니다.",
          apply: "찰흙으로 그릇을 만듭니다.", rule: "nasalization" },
        { page: 7, text: "그러나 컴퓨터의 계산만으로 예보가 완성되지는 않습니다.",
          focus: "않습니다", guide: "겹받침 ㄶ 뒤의 ㅅ이 된소리가 되어 [안씀니다]로 읽습니다.",
          apply: "저는 우유를 먹지 않습니다.", rule: "tensification" },
        { page: 7, text: "예보관은 관측 자료와 여러 예상 결과를 비교합니다.",
          focus: "예보관은", guide: "받침 ㄴ을 뒤로 넘겨 [예보과는]으로 이어 읽습니다.",
          apply: "예보관은 날씨를 알려 줍니다.", rule: "liaison" },
        { page: 7, text: "산과 바다처럼 지역의 날씨에 영향을 주는 조건도 살펴봅니다.",
          focus: "살펴봅니다", guide: "받침 ㅂ이 콧소리로 바뀌어 [살펴봄니다]로 읽습니다.",
          apply: "그림을 자세히 살펴봅니다.", rule: "nasalization" },
        { page: 7, text: "그런 다음 비가 올 가능성이나 기온의 변화를 판단하여 일기예보를 작성합니다.",
          focus: "작성합니다", guide: "받침 ㄱ 뒤의 ㅅ이 된소리가 되어 [작썽함니다]로 읽습니다.",
          apply: "일기를 날마다 작성합니다.", rule: "tensification" },
        { page: 8, text: "완성된 예보는 방송과 인터넷, 휴대 전화 앱을 통해 사람들에게 전달됩니다.",
          focus: "앱을", guide: "받침 ㅂ을 뒤로 넘겨 [애블]로 이어 읽습니다.",
          apply: "지도 앱을 켭니다.", rule: "liaison" },
        { page: 8, text: "우리는 일기예보를 보고 옷차림을 정하거나 야외 활동을 계획하고, 위험한 날씨에 미리 대비할 수 있습니다.",
          focus: "활동을", guide: "받침 ㄹ 뒤의 ㄷ이 된소리가 되어 [활똥을]로 읽습니다.",
          apply: "운동장에서 활동을 시작합니다.", rule: "tensification" }
      ],

      // 어휘 활동 여덟 — ①생활 장면 ②본문 문장 두 걸음.
      // 오답(other)은 모두 본문에 나오는 낱말이고, 지문 안에 그 오답이 보이지 않게 골랐습니다.
      vocab: [
        { word: "일기예보",
          image: "assets/vocab/vocab-s01-01-forecast.webp", alt: "텔레비전 화면에 내일 날씨 그림과 기온이 떠 있는 모습",
          bookImage: "assets/vocab/vocab-s01-01-book-forecast.webp", bookAlt: "예보관이 완성한 일기예보 화면을 가리키는 장면",
          daily: { frame: ["아침에 ", "를 보고 옷을 정합니다."], answer: "일기예보", other: "컴퓨터" },
          book:  { frame: ["그런 다음 비가 올 가능성이나 기온의 변화를 판단하여 ", "를 작성합니다."], answer: "일기예보", other: "컴퓨터" },
          hanja: { chars: "日氣豫報",
            parts: [{ char: "日", gloss: "날" }, { char: "氣", gloss: "기운" }, { char: "豫", gloss: "미리" }, { char: "報", gloss: "알리다" }],
            sum: "「날의 기운을 미리 알린다」",
            example: "지나간 날씨를 적은 것은 일기예보가 아니에요. 아직 오지 않은 날의 날씨여야 해요." },
          meaning: "앞으로의 날씨를 미리 알려 주는 소식입니다." },
        { word: "관측",
          image: "assets/vocab/vocab-s01-02-observe.webp", alt: "망원경으로 밤하늘의 별을 살펴보는 아이",
          bookImage: "assets/vocab/vocab-s01-02-book-observe.webp", bookAlt: "여러 장비가 저마다 날씨를 살펴 재는 장면",
          daily: { frame: ["밤하늘의 별을 ", "합니다."], answer: "관측", other: "계산" },
          book:  { frame: ["일기예보는 여러 곳에서 날씨를 ", "하는 일부터 시작합니다."], answer: "관측", other: "계산" },
          hanja: { chars: "觀測",
            parts: [{ char: "觀", gloss: "보다" }, { char: "測", gloss: "재다" }],
            sum: "「보고 잰다」 — 살펴서 재는 일",
            example: "그냥 하늘을 쳐다보는 것은 관측이 아니에요. 온도계로 기온을 재어 적으면 관측이에요." },
          meaning: "기계나 눈으로 살펴서 재는 일입니다." },
        { word: "위성",
          image: "assets/vocab/vocab-s01-03-satellite.webp", alt: "지구 둘레를 도는 인공위성이 태양 전지판을 편 모습",
          bookImage: "assets/vocab/vocab-s01-03-book-satellite.webp", bookAlt: "기상 위성이 우주에서 구름을 내려다보는 장면",
          daily: { frame: ["우주를 도는 ", "을 봅니다."], answer: "위성", other: "레이더" },
          book:  { frame: ["기상 ", "은 우주에서 구름의 위치와 움직임을 살펴봅니다."], answer: "위성", other: "레이더" },
          hanja: { chars: "衛星",
            parts: [{ char: "衛", gloss: "지키다" }, { char: "星", gloss: "별" }],
            sum: "「지키듯 둘레를 도는 별」",
            example: "달은 저절로 생긴 지구의 위성, 기상 위성은 사람이 만들어 올린 인공위성이에요." },
          meaning: "지구 둘레를 돌면서 우주에서 지구를 살피는 기계입니다." },
        { word: "관측소",
          image: "assets/vocab/vocab-s01-04-station.webp", alt: "울타리 안에 백엽상과 풍향계가 서 있는 관측소 마당",
          bookImage: "assets/vocab/vocab-s01-04-book-station.webp", bookAlt: "지상 관측소에서 기온과 바람을 재는 장면",
          daily: { frame: ["산 위의 ", "에서 기온을 잽니다."], answer: "관측소", other: "컴퓨터" },
          book:  { frame: ["지상 ", "는 기온, 습도, 기압과 바람을 측정합니다."], answer: "관측소", other: "컴퓨터" },
          hanja: { chars: "觀測所",
            parts: [{ char: "觀", gloss: "보다" }, { char: "測", gloss: "재다" }, { char: "所", gloss: "곳" }],
            sum: "「보고 재는 곳」",
            example: "所가 붙으면 자리를 뜻해요. 표를 파는 매표소, 몸을 피하는 대피소처럼요." },
          meaning: "한자리에서 날씨를 재고 기록하는 곳입니다." },
        { word: "레이더",
          image: "assets/vocab/vocab-s01-05-radar.webp", alt: "둥근 덮개를 쓴 레이더 안테나가 언덕 위에 서 있는 모습",
          bookImage: "assets/vocab/vocab-s01-05-book-radar.webp", bookAlt: "기상 레이더가 비구름을 향해 전파를 쏘는 장면",
          daily: { frame: ["", "가 비구름을 찾아냅니다."], answer: "레이더", other: "위성" },
          book:  { frame: ["기상 ", "는 비구름이 있는 곳과 비가 내리는 정도를 관측합니다."], answer: "레이더", other: "위성" },
          meaning: "전파를 쏘아 비구름 같은 것을 찾아내는 기계입니다." },
        { word: "예보관",
          image: "assets/vocab/vocab-s01-06-forecaster.webp", alt: "날씨 지도 앞에서 내일 날씨를 설명하는 사람",
          bookImage: "assets/vocab/vocab-s01-06-book-forecaster.webp", bookAlt: "예보관이 관측 자료와 예상 결과를 나란히 놓고 견주는 장면",
          daily: { frame: ["", "이 내일 날씨를 알려 줍니다."], answer: "예보관", other: "컴퓨터" },
          book:  { frame: ["", "은 관측 자료와 여러 예상 결과를 비교합니다."], answer: "예보관", other: "컴퓨터" },
          hanja: { chars: "豫報官",
            parts: [{ char: "豫", gloss: "미리" }, { char: "報", gloss: "알리다" }, { char: "官", gloss: "일을 맡은 사람" }],
            sum: "「미리 알려 주는 일을 맡은 사람」",
            example: "官이 붙으면 그 일을 맡은 사람이에요. 경찰관·소방관처럼, 기계가 아니라 사람이에요." },
          meaning: "관측 자료를 살펴 일기예보를 만드는 사람입니다." },
        { word: "예상",
          image: "assets/vocab/vocab-s01-07-prediction.webp", alt: "달력의 내일 칸에 구름과 빗방울 그림을 미리 그려 넣는 손",
          bookImage: "assets/vocab/vocab-s01-07-book-prediction.webp", bookAlt: "컴퓨터가 만든 미래 날씨 예상 자료가 화면에 뜬 장면",
          daily: { frame: ["내일 기온을 미리 ", "합니다."], answer: "예상", other: "관측" },
          book:  { frame: ["그 결과를 이용하여 미래의 기온, 바람과 비의 모습을 나타낸 ", " 자료를 만듭니다."], answer: "예상", other: "관측" },
          hanja: { chars: "豫想",
            parts: [{ char: "豫", gloss: "미리" }, { char: "想", gloss: "생각하다" }],
            sum: "「앞일을 미리 생각한다」",
            example: "관측은 지금 있는 것을 재는 일, 예상은 아직 오지 않은 일을 미리 헤아리는 일이에요." },
          meaning: "앞으로 어떻게 될지 미리 생각해 보는 일입니다." },
        { word: "계산",
          image: "assets/vocab/vocab-s01-08-calculate.webp", alt: "공책에 더하기 문제를 풀며 수를 따져 보는 아이",
          bookImage: "assets/vocab/vocab-s01-08-book-calculate.webp", bookAlt: "대형 컴퓨터가 대기를 작은 구역으로 나누어 계산하는 장면",
          daily: { frame: ["더하기 문제를 빠르게 ", "합니다."], answer: "계산", other: "관측" },
          book:  { frame: ["그러나 컴퓨터의 ", "만으로 예보가 완성되지는 않습니다."], answer: "계산", other: "관측" },
          hanja: { chars: "計算",
            parts: [{ char: "計", gloss: "헤아리다" }, { char: "算", gloss: "셈하다" }],
            sum: "「헤아려 셈한다」 — 수를 따지는 일",
            example: "컴퓨터는 공기가 앞으로 어떻게 움직일지 수로 따져 계산해요. 어림잡는 것과 달라요." },
          meaning: "수를 따져서 답을 구하는 일입니다." }
      ],

      // 읽기이해 넷 — answer 는 위 sentences 의 번호(0부터)다.
      // 셋째 문항이 이 글의 매듭(7쪽 「컴퓨터의 계산만으로 완성되지 않는다」)에 걸려 있다.
      questions: [
        { prompt: "우주에서 구름의 위치와 움직임을 살펴보는 것은 무엇인가요?", answer: 2,
          hint: "우주에서 살펴본다고 말한 문장을 찾아봅니다.",
          explanation: "‘기상 위성은 우주에서 구름의 위치와 움직임을 살펴봅니다.’라고 했습니다 — 기상 위성입니다." },
        { prompt: "컴퓨터가 하는 일이 나온 문장은 무엇인가요?", answer: 7,
          hint: "대기를 작은 구역으로 나눈다고 말한 문장을 찾아봅니다.",
          explanation: "컴퓨터는 대기를 작은 구역으로 나누고, 각 구역의 공기가 앞으로 어떻게 움직일지 계산합니다." },
        { prompt: "일기예보에 사람의 판단이 필요한 까닭을 알 수 있는 문장은 무엇인가요?", answer: 9,
          hint: "‘그러나’로 시작하는 문장을 살펴봅니다.",
          explanation: "컴퓨터의 계산만으로는 예보가 완성되지 않기 때문에, 예보관이 자료를 비교하고 판단합니다." },
        { prompt: "일기예보를 보고 우리가 할 수 있는 일이 나온 문장은 무엇인가요?", answer: 14,
          hint: "‘우리는’으로 시작하는 마지막 문장을 살펴봅니다.",
          explanation: "옷차림을 정하거나 야외 활동을 계획하고, 위험한 날씨에 미리 대비할 수 있습니다." }
      ]
    }
  }
};
