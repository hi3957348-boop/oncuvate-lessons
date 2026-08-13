// 2회차 데이터 — app.js의 lessons 객체에서 내용 변경 없이 옮겼습니다.
window.ONCUVATE_SESSION = 2;
window.ONCUVATE_LESSON = {
  title: '빵집을 찾아가요',
  subtitle: '받침 뒤에서 달라지는 소리를 긴 문장에서도 정확하게 읽어요.',
  thumb: 'assets/scenes/scene-08.jpg',
  steps: [
    { type: 'goal', title: '오늘 읽기', minutes: 2 },
    { type: 'scale', title: '시작 전 생각하기', minutes: 2 },
    { type: 'colorobservation', phase: 'pre_observation', supportLevel: 'none', title: '내 색이 나오면 빠르게 읽어요', minutes: 3,
      heading: '내 색이 나오면 빠르게 읽어요',
      description: '카드를 한 장씩 뒤집어요. 내 색 카드가 나오면 보이는 낱말을 읽어요.',
      items: [
        { word: '악기', expectedPronunciation: '악끼', targetRule: 'tensing', exposure: 'unseen' },
        { word: '떡국', expectedPronunciation: '떡꾹', targetRule: 'tensing', exposure: 'unseen' },
        { word: '답장', expectedPronunciation: '답짱', targetRule: 'tensing', exposure: 'unseen' },
        { word: '옥수수', expectedPronunciation: '옥쑤수', targetRule: 'tensing', exposure: 'unseen' },
        { word: '잡곡', expectedPronunciation: '잡꼭', targetRule: 'tensing', exposure: 'unseen' },
        { word: '복도', expectedPronunciation: '복또', targetRule: 'tensing', exposure: 'unseen' }
      ],
      fillerItems: ['포도', '하마', '오리', '구두', '나비', '도토리'],
      colorCount: 4, rounds: 12 },
    { type: 'syllable', title: '끝소리 길게 이어 보기', minutes: 2,
      pairs: [['소', '속'], ['구', '국'], ['바', '밥']],
      question: '‘국’의 끝소리를 길게 이어 말할 수 있을까요?', answer: '짧게 멈춰요' },
    { type: 'lettergame', title: '끝소리 느낌 찾기', minutes: 2,
      items: [
        { letter: '도', answer: 'open' }, { letter: '독', answer: 'closed' },
        { letter: '구', answer: 'open' }, { letter: '국', answer: 'closed' },
        { letter: '자', answer: 'open' }, { letter: '집', answer: 'closed' }
      ] },
    { type: 'flipgame', title: '끝소리 카드 뒤집기', minutes: 3 },
    // 1회차의 소리 변화 탐구실을 복습 확인 성격으로 축소한 자리.
    // 된소리 하나·연음 하나·둘 다 하나로, 2회차 본문에 나오는 낱말만 씁니다.
    { type: 'soundchange', title: '소리 변화 다시 확인하기', minutes: 2,
      rounds: [
        { word: '약국', syllables: ['약', '국'], targets: [1], tensingTargets: [1], change: '국의 첫소리가 세게 바뀌어요.' },
        { word: '앞을', syllables: ['앞', '을'], targets: [1], liaisonTargets: [1], change: '앞의 끝소리가 을로 이어져요.' },
        { word: '발걸음이', syllables: ['발', '걸', '음', '이'], targets: [1, 2, 3], tensingTargets: [1], liaisonTargets: [2, 3], change: '걸의 첫소리가 세게 바뀌고, 끝소리는 뒤로 이어져요.' }
      ] },
    { type: 'story', title: '그림책에서 읽기', minutes: 3, scene: 5,
      passage: '소방서, 경찰서, 약국, 우편 취급소 앞을 지났어요.<br>“여기는 어디지?”<br>가만가만 주위를 살폈어요.',
      spoken: '소방서, 경찰서, 약국, 우편 취급소 앞을 지났어요. 여기는 어디지? 가만가만 주위를 살폈어요.',
      soundMarks: [{ surface: '약국', indices: [1] }, { surface: '취급소', indices: [2] }, { surface: '앞을', liaisonIndices: [0, 1] }, { surface: '지났어요', liaisonIndices: [1, 2] }, { surface: '살폈어요', liaisonIndices: [1, 2] }],
      excludedSoundMarks: [{ surface: '경찰서', indices: [2], reason: 'current-stage-out-of-scope' }],
      chunks: ['소방서, 경찰서, 약국,', '우편 취급소 앞을', '지났어요.', '“여기는 어디지?”', '가만가만', '주위를 살폈어요.'] },
    { type: 'story', title: '그림책에서 읽기', minutes: 3, scene: 6,
      passage: '학교가 보여요.<br>아이스크림 가게랑 치킨집도 보여요.<br>“맞아, 이 길이야!”',
      spoken: '학교가 보여요. 아이스크림 가게랑 치킨집도 보여요. 맞아, 이 길이야!',
      soundMarks: [{ surface: '학교가', indices: [1] }, { surface: '치킨집도', indices: [2, 3], pronunciation: '치킨찝또' }, { surface: '맞아', liaisonIndices: [0, 1] }, { surface: '길이야', liaisonIndices: [0, 1] }],
      chunks: ['학교가 보여요.', '아이스크림 가게랑', '치킨집도 보여요.', '“맞아, 이 길이야!”'] },
    { type: 'story', title: '끊어읽기 연습', minutes: 3, scene: 7,
      passage: '발걸음이 <span class="focus-word">씩씩해졌어요.</span><br><span class="focus-word">국숫집을 지나니</span>, 맛있는 빵 냄새가 나요.<br>빵집이 여기 있었어요.<br>과일 가게 옆에요.',
      spoken: '발걸음이 씩씩해졌어요. 국숫집을 지나니, 맛있는 빵 냄새가 나요. 빵집이 여기 있었어요. 과일 가게 옆에요.',
      soundMarks: [{ surface: '발걸음이', indices: [1], liaisonIndices: [2, 3] }, { surface: '씩씩해졌어요', liaisonIndices: [3, 4], otherIndices: [1, 2] }, { surface: '국숫집을', indices: [1, 2], liaisonIndices: [3] }, { surface: '맛있는', otherIndices: [0, 1, 2], pronunciation: '마신는' }, { surface: '빵집이', indices: [1], liaisonIndices: [2] }, { surface: '있었어요', liaisonIndices: [0, 1, 2] }, { surface: '옆에요', liaisonIndices: [0, 1] }],
      chunks: ['발걸음이', '씩씩해졌어요.', '국숫집을 지나니,', '맛있는 빵 냄새가 나요.', '빵집이 여기 있었어요.', '과일 가게 옆에요.'] },
    { type: 'story', title: '그림책에서 읽기', minutes: 3, scene: 8,
      passage: '빵집 문을 열고 들어서며 큰 소리로 말해요.<br>“아저씨, 식빵이랑 꽈배기 주세요.”',
      spoken: '빵집 문을 열고 들어서며 큰 소리로 말해요. 아저씨, 식빵이랑 꽈배기 주세요.',
      soundMarks: [{ surface: '빵집', indices: [1] }, { surface: '문을', liaisonIndices: [0, 1] }, { surface: '들어서며', liaisonIndices: [0, 1] }],
      excludedSoundMarks: [{ surface: '열고', indices: [1], reason: 'current-stage-out-of-scope' }] },
    { type: 'game', title: '글자 조각 맞추기', minutes: 2,
      prompt: '그림 속 짧은 말을 떠올리며 글자 조각을 차례로 놓아 보세요.',
      pool: [
        { scene: 5, phrase: '약국 앞을', answer: ['약', '국', '앞', '을'], breakAfter: [1] },
        { scene: 5, phrase: '여기는 어디지', answer: ['여', '기', '는', '어', '디', '지'], breakAfter: [2] },
        { scene: 5, phrase: '주위를 살폈어요', answer: ['주', '위', '를', '살', '폈', '어', '요'], breakAfter: [2] },
        { scene: 6, phrase: '학교가 보여요', answer: ['학', '교', '가', '보', '여', '요'], breakAfter: [2] },
        { scene: 6, phrase: '치킨집도 보여요', answer: ['치', '킨', '집', '도', '보', '여', '요'], breakAfter: [3] },
        { scene: 6, phrase: '맞아 이 길이야', answer: ['맞', '아', '이', '길', '이', '야'], breakAfter: [1, 2] },
        { scene: 7, phrase: '국숫집을 지나니', answer: ['국', '숫', '집', '을', '지', '나', '니'], breakAfter: [3] },
        { scene: 7, phrase: '빵 냄새가 나요', answer: ['빵', '냄', '새', '가', '나', '요'], breakAfter: [0, 3] },
        { scene: 7, phrase: '빵집이 여기', answer: ['빵', '집', '이', '여', '기'], breakAfter: [2] },
        { scene: 7, phrase: '과일 가게 옆에', answer: ['과', '일', '가', '게', '옆', '에'], breakAfter: [1, 3] },
        { scene: 8, phrase: '큰 소리로 말해요', answer: ['큰', '소', '리', '로', '말', '해', '요'], breakAfter: [0, 3] },
        { scene: 8, phrase: '꽈배기 주세요', answer: ['꽈', '배', '기', '주', '세', '요'], breakAfter: [2] }
      ] },
    { type: 'reread', title: '한 번 더 읽기', minutes: 3, scene: 7,
      passage: '발걸음이 씩씩해졌어요.<br>국숫집을 지나니, 맛있는 빵 냄새가 나요.<br>빵집이 여기 있었어요.<br>과일 가게 옆에요.',
      spoken: '발걸음이 씩씩해졌어요. 국숫집을 지나니, 맛있는 빵 냄새가 나요. 빵집이 여기 있었어요. 과일 가게 옆에요.',
      soundMarks: [{ surface: '발걸음이', indices: [1], liaisonIndices: [2, 3] }, { surface: '씩씩해졌어요', liaisonIndices: [3, 4], otherIndices: [1, 2] }, { surface: '국숫집을', indices: [1, 2], liaisonIndices: [3] }, { surface: '맛있는', otherIndices: [0, 1, 2], pronunciation: '마신는' }, { surface: '빵집이', indices: [1], liaisonIndices: [2] }, { surface: '있었어요', liaisonIndices: [0, 1, 2] }, { surface: '옆에요', liaisonIndices: [0, 1] }] },
    { type: 'generalization', title: '책 밖의 새 자료 읽기', minutes: 6,
      levels: [
        { code: 'T1', label: '스피드리딩', kind: 'words', passAt: 8, poolStart: 10,
          items: ['국수', '숙제', '식당', '앞집', '빗방울', '꽃다발', '책가방', '옷걸이', '맥주', '작가'],
          pool: ['옷가게', '낮잠', '책상', '국밥', '학생', '옷장', '꽃병', '밥상', '책장', '입구', '국수', '숙제', '식당', '앞집', '빗방울', '꽃다발', '책가방', '옷걸이', '맥주', '작가', '축구', '약속', '깃발', '꽃밭', '낚시', '접시', '박수', '색종이', '각자', '법정'],
          instruction: '책에서 보지 않은 낱말 10개를 하나씩 도움 없이 읽어 보세요.' },
        { code: 'T2', label: '글자 바꾸기', kind: 'nonwords', passAt: 4, poolStart: 5,
          items: ['봅성', '척중', '촉가', '졋붕', '넉소'],
          pool: ['칙송', '닻점', '귝법', '압게', '삭조', '봅성', '척중', '촉가', '졋붕', '넉소', '엇종', '갓벌', '줍새', '얍봉', '억고'],
          reviewStatus: 'human-review-required',
          instruction: '소리를 듣고 비단어를 글자 조각으로 나누거나 다시 하나의 말로 모아 보세요.' },
        { code: 'T3', label: '문장 순서 맞추기', kind: 'sentence-order', passAt: 4,
          items: ['숙제를 마치고 국수를 먹어요.', '앞집에서 빗방울 소리가 들려요.', '꽃다발을 들고 옷걸이 옆에 섰어요.', '작가가 축구 이야기를 썼어요.', '약속 장소는 책가방 가게 앞이에요.'],
          instruction: '새 문장의 낱말 순서를 맞춘 뒤 정확하게 읽어 보세요.' }
      ] },
    { type: 'reflection', title: '활동 후 돌아보기', minutes: 1 }
  ]
};
