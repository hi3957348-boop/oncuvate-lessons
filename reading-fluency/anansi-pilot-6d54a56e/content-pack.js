/* 「게으른 거미 아난시」 읽기유창성 — 두 회차분 데이터.
 *
 * 회차 배정은 사용자가 정한 목표 낱말에 맞춰 쪽을 갈랐다.
 *   1회차 2~5쪽 · H7  어절 경계 연결
 *   2회차 6~9쪽 · M12 어절 단위 자동화
 *
 * 본문은 **원문 그대로**다(배정표의 「원문 유지」). 배정표 26번 열(원회차 본문)은
 * OCR이라 부스러기가 섞여 있어 쪽 그림을 눈으로 대조해 바로잡았다.
 *   5쪽 「맛있는 공 요리」 → 「맛있는 콩 요리」
 *   6쪽 「줄을 당겨 쥐.」 → 「줄을 당겨 줘.」
 *   7쪽 「다리 여덟 개는 모두 맛있는 있었어요.」
 *       → 「… 다리 여덟 개는 모두 맛있는 음식을 요리하는 냄비와 이어져 있었어요.」
 *   8쪽 대사 「“멈춰!”」가 통째로 빠져 있었다 — 되살렸다.
 *   9쪽 「돌아오지 않았어요 거미 아난시는」 → 마침표가 빠져 두 문장이 붙어 있었다.
 *   여는 따옴표(“ ‘)가 거의 다 지워져 있었다 — 쪽 그림대로 되살렸다.
 *
 * rule 값은 음운규칙 정본 열셋에서만 고른다.
 * ⚠️ 소리 바뀜이 **하나도 없는 낱말**에는 rule을 적지 않았다(거의 · 기다리면서 ·
 *    달콤한 · 완성되면 · 팽팽해지는 · 당겨지는). 이 낱말들은 규칙이 아니라
 *    「어절을 통째로 읽기」를 겨냥한다 — 없는 규칙을 붙이면 첨삭이 아이에게
 *    틀린 말을 하게 된다.
 */
window.ONQ_CONTENT_PACK = Object.freeze({
  version: "0.1.0",
  series: "읽기유창성",
  bookTitle: "게으른 거미 아난시",
  credit: {
    title: "게으른 거미 아난시",
    originalText: "가나 민담",
    originalArt: "비한 드 야허 (Wiehan de Jager)",
    koreanText: "김은파",
    source: "두루책방",
    license: "CC BY 4.0",
    modified: "변경함 — 읽기유창성 수업용으로 재구성(회차 분할·활동 추가)",
    programRights: "읽기유창성 프로그램 활동 · 평가 설계 © 온큐베이트",
    allRights: "© 2026 온큐베이트. All rights reserved."
  },
  sourceLicense: "CC BY 4.0 · © 2019 Enuma, Inc. & The Foundation SeeArt for Book Culture",

  sessions: {
    // ── 1회차 ─────────────────────────────────────────────────────────────
    // 겨냥: 낱말을 하나씩 끊어 읽지 않고 어절 경계에서도 흐름을 잇기.
    session01: {
      lessonId: "reading.fluency.anansi.s01",
      sessionLabel: "1회차",
      range: "그림책 2~5쪽",
      coverTitle: "거미줄을 묶어 놓고",
      goal: "낱말을 하나씩 끊지 않고 어절끼리 이어 한 덩어리로 읽어요.",
      coverImage: "assets/book/page-01.webp",
      focusRules: [
        "받침 뒤에 모음이 오면 소리를 자연스럽게 이어 읽어요.",
        "받침 ㅌ 뒤에 ㄴ이 오면 콧소리로 바뀌어 읽어요.",
        "낱말 사이를 끊지 말고 뜻이 이어지는 덩어리로 묶어 읽어요."
      ],
      game2: [
        { word: "게을렀어요", phrase: "아난시는 아주 게을렀어요", rule: "liaison" },
        { word: "얻어먹었어요", phrase: "맛있는 음식을 얻어먹었어요", rule: "liaison" },
        { word: "맡았어요", phrase: "맛있는 냄새를 맡았어요", rule: "liaison" },
        { word: "얻어먹을", phrase: "음식을 얻어먹을 생각에", rule: "liaison" },
        { word: "끝났어", phrase: "아직 요리가 안 끝났어", rule: "nasalization" },
        { word: "기다리면서", phrase: "기다리면서 설거지를" },
        { word: "대답했어요", phrase: "아난시가 대답했어요", rule: "aspiration" },
        { word: "거의", phrase: "음식이 거의 다 됐어" },
        { word: "묶을게", phrase: "냄비에 묶을게", rule: "liaison" },
        { word: "끝났을", phrase: "요리가 끝났을 때", rule: "nasalization" },
        { word: "어떻게", phrase: "어떻게 널 부르지", rule: "aspiration" },
        { word: "묶고", phrase: "내 다리에 묶고", rule: "tensification" },
        { word: "묶을", phrase: "냄비에 묶을 거야", rule: "liaison" },
        { word: "줄을", phrase: "줄을 당겨 줘", rule: "liaison" },
        { word: "끝나면", phrase: "요리가 끝나면", rule: "nasalization" }
      ],
      game1: [
        { word: "게을렀어요", chunks: ["게","을","렀","어","요"], distractors: ["개","은","럿","여","오"], hint: "「렀어」는 받침 ㅆ이 넘어가 「러써」로 소리 나요.", rule: "liaison" },
        { word: "얻어먹었어요", chunks: ["얻","어","먹","었","어","요"], distractors: ["엇","아","멱","앋","여","오"], hint: "「얻어」는 「어더」로 이어 읽어요.", rule: "liaison" },
        { word: "맡았어요", chunks: ["맡","았","어","요"], distractors: ["맏","앋","여","오"], hint: "받침 ㅌ이 뒤로 넘어가 「마타」예요.", rule: "liaison" },
        { word: "얻어먹을", chunks: ["얻","어","먹","을"], distractors: ["엇","아","멱","울"], hint: "「먹을」은 「머글」로 이어 읽어요.", rule: "liaison" },
        { word: "끝났어", chunks: ["끝","났","어"], distractors: ["끋","낫","여"], hint: "받침 ㅌ 뒤에 ㄴ이 와서 「끈나」로 소리 나요.", rule: "nasalization" },
        { word: "기다리면서", chunks: ["기","다","리","면","서"], distractors: ["끼","따","니","먼","써"], hint: "다섯 글자를 한 덩어리로 묶어 읽어요." },
        { word: "대답했어요", chunks: ["대","답","했","어","요"], distractors: ["때","담","핻","여","오"], hint: "ㅂ과 ㅎ이 만나 「대다패」가 돼요.", rule: "aspiration" },
        { word: "거의", chunks: ["거","의"], distractors: ["커","이"], hint: "두 글자를 붙여 한 번에 읽어요." },
        { word: "묶을게", chunks: ["묶","을","게"], distractors: ["묵","은","께"], hint: "「묶을」은 「무끌」로 이어 읽어요.", rule: "liaison" },
        { word: "끝났을", chunks: ["끝","났","을"], distractors: ["끋","낫","울"], hint: "「끝났」은 「끈낟」으로 소리 나요.", rule: "nasalization" },
        { word: "어떻게", chunks: ["어","떻","게"], distractors: ["아","떠","께"], hint: "ㅎ과 ㄱ이 만나 「어떠케」가 돼요.", rule: "aspiration" },
        { word: "묶고", chunks: ["묶","고"], distractors: ["묵","꼬"], hint: "뒤 글자가 된소리로 바뀌어 「묵꼬」예요.", rule: "tensification" },
        { word: "묶을", chunks: ["묶","을"], distractors: ["묵","울"], hint: "받침이 뒤로 넘어가 「무끌」이에요.", rule: "liaison" },
        { word: "줄을", chunks: ["줄","을"], distractors: ["준","울"], hint: "받침 ㄹ이 넘어가 「주를」이에요.", rule: "liaison" },
        { word: "끝나면", chunks: ["끝","나","면"], distractors: ["끋","냐","멘"], hint: "받침 ㅌ 뒤에 ㄴ이 와서 「끈나면」이에요.", rule: "nasalization" }
      ],
      wordPool: [
        { word: "게을렀어요", related: true },
        { word: "얻어먹었어요", related: true },
        { word: "맡았어요", related: true },
        { word: "대답했어요", related: true },
        { word: "묶을게", related: true },
        { word: "기다리면서", related: true },
        { word: "자전거를", related: false },
        { word: "냉장고를", related: false },
        { word: "미끄럼틀", related: false },
        { word: "휴대전화가", related: false },
        { word: "컴퓨터를", related: false },
        { word: "아이스크림을", related: false }
      ],
      vocab: [],
      sentences: [
        { page: 2, text: "아난시라는 거미가 있었어요. 아난시는 아주 게을렀어요.",
          focus: "게을렀어요", guide: "「렀어요」의 받침 ㅆ이 뒤로 넘어가 「게을러써요」로 소리 나요.",
          apply: "동생은 아침마다 게을렀어요.", rule: "liaison" },
        { page: 2, text: "그래서 스스로 요리를 하지 않고 매일 친구네 집에 가서 맛있는 음식을 얻어먹었어요.",
          focus: "얻어먹었어요", guide: "「얻어」를 「어더」로 이어 읽어요.",
          apply: "형네 집에서 저녁을 얻어먹었어요.", rule: "liaison" },
        { page: 3, text: "어느 날 아난시는 토끼네 집 앞에서 맛있는 냄새를 맡았어요.",
          focus: "맡았어요", guide: "받침 ㅌ이 뒤로 넘어가 「마타써요」로 소리 나요.",
          apply: "꽃 냄새를 코로 맡았어요.", rule: "liaison" },
        { page: 3, text: "아난시는 음식을 얻어먹을 생각에 신이 났어요. 토끼가 아난시에게 말했어요.",
          focus: "얻어먹을", guide: "「먹을」을 「머글」로 이어 읽어요.",
          apply: "빵을 얻어먹을 생각에 웃었어요.", rule: "liaison" },
        { page: 3, text: "“아직 요리가 안 끝났어. 기다리면서 설거지를 도와줄래?”",
          focus: "끝났어", guide: "받침 ㅌ 뒤에 ㄴ이 와서 「끈나써」로 소리 나요.",
          apply: "숙제가 아직 안 끝났어.", rule: "nasalization" },
        { page: 3, text: "아난시가 대답했어요. “미안, 나는 할 일이 있어. 나중에 다시 올게.”",
          focus: "대답했어요", guide: "ㅂ과 ㅎ이 만나 거센소리 「대다패써요」가 돼요.",
          apply: "누나가 웃으며 대답했어요.", rule: "aspiration" },
        { page: 4, text: "“요리가 끝났을 때 어떻게 널 부르지?” 하고 토끼가 물었어요. 아난시는 말했어요.",
          focus: "끝났을", guide: "「끝났」을 「끈낟」으로 읽고 뒤와 이어요.",
          apply: "청소가 끝났을 때 불러 줘.", rule: "nasalization" },
        { page: 4, text: "“내가 거미줄을 칠게. 한쪽은 내 다리에 묶고 다른 한쪽은 냄비에 묶을 거야.”",
          focus: "묶고", guide: "받침 뒤 ㄱ이 된소리로 바뀌어 「묵꼬」로 소리 나요.",
          apply: "신발 끈을 묶고 나갔어요.", rule: "tensification" },
        { page: 4, text: "“음식이 준비되면 줄을 당겨 줘. 그럼 바로 올게.” 아난시는 줄을 냄비에 묶고 토끼네 집을 떠났어요.",
          focus: "줄을", guide: "받침 ㄹ이 뒤로 넘어가 「주를」로 소리 나요.",
          apply: "빨래 줄을 팽팽하게 당겼어요.", rule: "liaison" },
        { page: 5, text: "아난시는 원숭이들이 맛있는 콩 요리를 만들고 있는 것을 보았어요. “아난시, 이리 와. 음식이 거의 다 됐어.”",
          focus: "거의", guide: "「거의」를 붙여 읽고 「다 됐어」와 이어요.",
          apply: "밥이 거의 다 됐어요." },
        { page: 5, text: "원숭이가 말했어요. 아난시는 대답했어요. “나는 할 일이 있어. 내가 거미줄 한쪽을 다리에 묶고 다른 한쪽을 냄비에 묶을게.”",
          focus: "묶을게", guide: "「묶을」을 「무끌」로 이어 읽어요.",
          apply: "내가 끈을 묶을게.", rule: "liaison" },
        { page: 5, text: "“요리가 끝나면 줄을 당겨 줘. 그럼 바로 올게.”",
          focus: "끝나면", guide: "받침 ㅌ 뒤에 ㄴ이 와서 「끈나면」으로 소리 나요.",
          apply: "숙제가 끝나면 같이 놀자.", rule: "nasalization" }
      ],
      questions: [
        { prompt: "아난시가 매일 친구네 집에 가서 한 일은 무엇인가요?", answer: 1 },
        { prompt: "아난시가 토끼네 집 앞에서 맡은 것은 무엇인가요?", answer: 2 },
        { prompt: "토끼가 아난시에게 부탁한 일은 무엇인가요?", answer: 4 },
        { prompt: "아난시는 거미줄을 어디에 묶겠다고 했나요?", answer: 7 },
        { prompt: "원숭이가 아난시를 부른 까닭이 드러난 문장을 찾아보세요.", answer: 9 }
      ]
    },

    // ── 2회차 ─────────────────────────────────────────────────────────────
    // 겨냥: 규칙 하나씩이 아니라 조사·어미까지 붙은 어절을 통째로 읽기.
    session02: {
      lessonId: "reading.fluency.anansi.s02",
      sessionLabel: "2회차",
      range: "그림책 6~9쪽",
      coverTitle: "여덟 개의 줄",
      goal: "조사와 어미까지 붙은 어절을 통째로 한 번에 읽어요.",
      coverImage: "assets/book/page-01.webp",
      focusRules: [
        "조사와 어미까지 붙은 어절을 통째로 한 번에 읽어요.",
        "겹받침은 하나만 소리 나거나 나뉘어 넘어가는 것을 가려 읽어요.",
        "긴 문장은 뜻이 이어지는 짧은 덩어리로 나누어 읽어요."
      ],
      game2: [
        { word: "멧돼지", phrase: "멧돼지네 집 앞에서", rule: "tensification" },
        { word: "달콤한", phrase: "달콤한 냄새를 맡았어요" },
        { word: "완성되면", phrase: "고구마 요리가 완성되면" },
        { word: "팽팽해지는", phrase: "줄이 팽팽해지는 것을" },
        { word: "준비되었군", phrase: "토끼네 음식이 준비되었군", rule: "tensification" },
        { word: "당겨지는", phrase: "다리가 당겨지는 것을" },
        { word: "느꼈어요", phrase: "것을 느꼈어요", rule: "liaison" },
        { word: "잡아당겨져서", phrase: "쭉쭉 잡아당겨져서", rule: "liaison" },
        { word: "가늘어졌어요", phrase: "점점 가늘어졌어요", rule: "liaison" },
        { word: "끊어졌어요", phrase: "모두 끊어졌어요", rule: "hDeletion" },
        { word: "되었답니다", phrase: "긴 다리를 갖게 되었답니다", rule: "nasalization" },
        { word: "여덟", phrase: "다리 여덟 개는", rule: "clusterReduction" }
      ],
      game1: [
        { word: "멧돼지", chunks: ["멧","돼","지"], distractors: ["멛","대","치"], hint: "받침 뒤 ㄷ이 된소리로 바뀌어 「멛뙈지」예요.", rule: "tensification" },
        { word: "달콤한", chunks: ["달","콤","한"], distractors: ["닫","꼼","안"], hint: "세 글자를 한 덩어리로 묶어 읽어요." },
        { word: "완성되면", chunks: ["완","성","되","면"], distractors: ["왼","선","뒈","멘"], hint: "「완성」과 「되면」을 끊지 말고 이어요." },
        { word: "팽팽해지는", chunks: ["팽","팽","해","지","는"], distractors: ["팬","펭","애","치","능"], hint: "다섯 글자를 한 번에 읽어요." },
        { word: "준비되었군", chunks: ["준","비","되","었","군"], distractors: ["줌","미","뒈","얻","꾼"], hint: "받침 ㅆ 뒤 ㄱ이 된소리로 바뀌어 「되얻꾼」이에요.", rule: "tensification" },
        { word: "당겨지는", chunks: ["당","겨","지","는"], distractors: ["단","거","치","능"], hint: "네 글자를 한 덩어리로 읽어요." },
        { word: "느꼈어요", chunks: ["느","꼈","어","요"], distractors: ["나","껻","여","오"], hint: "받침 ㅆ이 넘어가 「느껴써요」예요.", rule: "liaison" },
        { word: "잡아당겨져서", chunks: ["잡","아","당","겨","져","서"], distractors: ["잠","자","단","거","저","써"], hint: "「잡아」는 「자바」로 이어 읽어요.", rule: "liaison" },
        { word: "가늘어졌어요", chunks: ["가","늘","어","졌","어","요"], distractors: ["까","는","러","젇","여","오"], hint: "「늘어」는 「느러」로 이어 읽어요.", rule: "liaison" },
        { word: "끊어졌어요", chunks: ["끊","어","졌","어","요"], distractors: ["끈","너","젇","여","오"], hint: "ㅎ이 사라지고 ㄴ이 넘어가 「끄너」예요.", rule: "hDeletion" },
        { word: "되었답니다", chunks: ["되","었","답","니","다"], distractors: ["뒈","얻","땁","미","타"], hint: "「답니다」는 「담니다」로 소리 나요.", rule: "nasalization" },
        { word: "여덟", chunks: ["여","덟"], distractors: ["야","덜"], hint: "겹받침 ㄼ에서 ㄹ만 소리 나요.", rule: "clusterReduction" }
      ],
      wordPool: [
        { word: "멧돼지네", related: true },
        { word: "달콤한", related: true },
        { word: "팽팽해지는", related: true },
        { word: "준비되었군", related: true },
        { word: "끊어졌어요", related: true },
        { word: "되었답니다", related: true },
        { word: "지하철이", related: false },
        { word: "축구공은", related: false },
        { word: "놀이터에서", related: false },
        { word: "선풍기는", related: false },
        { word: "텔레비전", related: false },
        { word: "떡볶이를", related: false }
      ],
      vocab: [],
      sentences: [
        { page: 6, text: "아난시는 멧돼지네 집 앞에서 달콤한 냄새를 맡았어요.",
          focus: "달콤한", guide: "「달콤한」을 붙여 읽고 「냄새를」과 이어요.",
          apply: "달콤한 딸기 냄새가 났어요." },
        { page: 6, text: "멧돼지가 말했어요. “고구마 요리를 만들고 있어. 이 포크로 조금만 저으면 완성이야.”",
          focus: "멧돼지", guide: "받침 뒤 ㄷ이 된소리로 바뀌어 「멛뙈지」로 소리 나요.",
          apply: "숲에서 멧돼지를 보았어요.", rule: "tensification" },
        { page: 6, text: "아난시는 말했어요. “난 좀 이따가 올게. 내가 거미줄 한쪽을 다리에 묶고 다른 한쪽을 냄비에 묶을 거야.”",
          focus: "말했어요", guide: "「했어요」를 「해써요」로 이어 읽어요.",
          apply: "동생이 크게 말했어요.", rule: "liaison" },
        { page: 6, text: "“고구마 요리가 완성되면 줄을 당겨 줘.”",
          focus: "완성되면", guide: "「완성」과 「되면」을 끊지 말고 한 번에 읽어요.",
          apply: "그림이 완성되면 보여 줄게요." },
        { page: 7, text: "강에 도착했을 때, 아난시의 다리 여덟 개는 모두 맛있는 음식을 요리하는 냄비와 이어져 있었어요.",
          focus: "도착했을", guide: "ㄱ과 ㅎ이 만나 거센소리 「도차캐쓸」이 돼요.",
          apply: "집에 도착했을 때 비가 왔어요.", rule: "aspiration" },
        { page: 7, text: "아난시는 첫 번째 다리에 묶인 줄이 팽팽해지는 것을 느꼈어요.",
          focus: "팽팽해지는", guide: "다섯 글자를 한 덩어리로 읽고 「것을」과 이어요.",
          apply: "고무줄이 팽팽해지는 것을 보았어요." },
        { page: 7, text: "‘토끼네 음식이 준비되었군!’ 아난시는 입맛을 다시며 생각했어요.",
          focus: "준비되었군", guide: "받침 ㅆ 뒤 ㄱ이 된소리로 바뀌어 「준비되얻꾼」으로 소리 나요.",
          apply: "밥이 벌써 준비되었군!", rule: "tensification" },
        { page: 8, text: "아난시는 두 번째 다리가 당겨지는 것을 느꼈어요.",
          focus: "느꼈어요", guide: "받침 ㅆ이 뒤로 넘어가 「느껴써요」로 소리 나요.",
          apply: "손끝이 시린 것을 느꼈어요.", rule: "liaison" },
        { page: 8, text: "그리고 세 번째, 네 번째, 다섯 번째, 여섯 번째, 일곱 번째, 여덟 번째도요. 모두가 동시에 줄을 당기고 있었어요.",
          focus: "여덟 번째", guide: "겹받침 ㄼ에서 ㄹ만 남아 「여덜 번째」로 소리 나요.",
          apply: "내 차례는 여덟 번째예요.", rule: "clusterReduction" },
        { page: 8, text: "“멈춰!” 아난시는 아파서 소리를 질렀어요. 그사이 아난시의 다리는 쭉쭉 잡아당겨져서 점점 가늘어졌어요.",
          focus: "잡아당겨져서", guide: "「잡아」를 「자바」로 이어 읽어요.",
          apply: "옷소매를 잡아당겨서 늘어났어요.", rule: "liaison" },
        { page: 9, text: "마침내 줄은 더 버티지 못하고 모두 끊어졌어요. 하지만 아난시의 다리는 원래 모습으로 돌아오지 않았어요.",
          focus: "끊어졌어요", guide: "ㅎ이 사라지고 ㄴ이 넘어가 「끄너져써요」로 소리 나요.",
          apply: "실이 툭 끊어졌어요.", rule: "hDeletion" },
        { page: 9, text: "거미 아난시는 이렇게 해서 가늘고 긴 다리를 갖게 되었답니다.",
          focus: "되었답니다", guide: "「답니다」가 「담니다」로 콧소리가 나요.",
          apply: "우리는 좋은 친구가 되었답니다.", rule: "nasalization" }
      ],
      questions: [
        { prompt: "아난시가 멧돼지네 집 앞에서 맡은 냄새는 어떤 냄새였나요?", answer: 0 },
        { prompt: "멧돼지가 만들고 있던 요리는 무엇인가요?", answer: 1 },
        { prompt: "강에 도착했을 때 아난시의 다리는 어떤 모습이었나요?", answer: 4 },
        { prompt: "아난시의 다리가 가늘어진 까닭은 무엇인가요?", answer: 9 },
        { prompt: "아난시가 마지막에 어떻게 되었는지 드러난 문장을 찾아보세요.", answer: 11 }
      ]
    }
  }
});
