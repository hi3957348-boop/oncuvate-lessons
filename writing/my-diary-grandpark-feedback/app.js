const feedback = {
  repeat: {
    type: '고칠 곳', tone: 'fix', title: '같은 말이 겹쳤어요',
    reason: '한 문장 안에 “나는”이 두 번 나오면 리듬이 끊겨요. 한 번만 남겨 보세요.',
    example: '나는 오늘 아침에 일어나 <mark class="revision-highlight">엄마에게</mark> 놀이공원에 가자고 했다.',
    cheer: '주인공이 누구인지 이미 알 수 있으니 “나는”은 한 번이면 충분해요.'
  },
  'park-particle': {
    type: '고칠 곳', tone: 'fix', title: '“놀이공원에”라고 써요',
    reason: '‘가다’ 앞에서 목적지를 나타내는 장소에는 조사 “에”를 붙여요.',
    example: '엄마에게 놀이공원<mark class="revision-highlight">에</mark> 가자고 했다.',
    cheer: '말로 할 때 빠뜨리기 쉬운 조사를 글에서는 챙겨 써요.'
  },
  particle: {
    type: '고칠 곳', tone: 'fix', title: '목적지가 나오면 “에”',
    reason: '어디로 갔는지를 나타낼 때는 장소 뒤에 “에”를 붙여요.',
    example: '어린이대공원<mark class="revision-highlight">에</mark> 갔다.',
    cheer: '“공원을 구경했다”처럼 행동의 대상을 말할 때는 “을”을 쓸 수 있어요.'
  },
  'animal-spelling': {
    type: '고칠 곳', tone: 'fix', title: '동물 이름을 다시 확인해요',
    reason: '동물 이름과 쉼표 뒤 띄어쓰기를 함께 고쳐 보세요. “꼬끼리”는 “코끼리”, “시라손니”는 “스라소니”, “팽궨”은 “펭귄”, “미여캣”은 “미어캣”, “라미”는 “라마”예요.',
    example: '<mark class="revision-highlight">코끼리</mark>, 곰, <mark class="revision-highlight">스라소니</mark>, 얼룩말, 물개, 물범, 수달, <mark class="revision-highlight">펭귄</mark>, 고슴도치, 원숭이, 두더지, 뱀, 거북이, <mark class="revision-highlight">미어캣</mark>, 토끼, 알파카, <mark class="revision-highlight">라마</mark>를',
    cheer: '동물의 특징과 이름을 연결해 기억하면 다음에는 더 쉽게 쓸 수 있어요.'
  },
  comma: {
    type: '고칠 곳', tone: 'fix', title: '쉼표와 띄어쓰기를 다듬어요',
    reason: '“사자, 호랑이”처럼 쉼표 뒤를 띄고, 목적격 조사 “를” 앞의 쉼표는 빼요. “못 보다”는 띄어 써요.',
    example: '사자, <mark class="revision-highlight">호랑이를 못 봐서</mark>',
    cheer: '소리 내어 읽으며 잠깐 쉬는 곳에만 쉼표를 넣어 보세요.'
  },
  feeling: {
    type: '잘한 표현', tone: 'praise', title: '사건 뒤에 느낌을 붙였어요',
    reason: '“못 봤다”에서 끝내지 않고 “아쉬웠다”라고 마음을 덧붙여 일기답게 썼어요.',
    example: '가장 보고 싶었던 사자와 호랑이를 못 봐서 아쉬웠다.',
    cheer: '무슨 일이 있었는지와 그때의 느낌이 함께 있어 좋아요.'
  },
  elephant: {
    type: '고칠 곳', tone: 'fix', title: '아빠의 느낌임을 분명히 해요',
    reason: '이 문장의 주어는 “아빠”예요. “신기했다”라고 끝내기보다 아빠가 그렇게 느끼거나 말했다는 표현으로 바꾸면 더 자연스러워요.',
    example: '① 아빠는 코끼리가 활발하게 움직이는 걸 보고 <mark class="revision-highlight">신기해하셨다.</mark><br>② 아빠는 코끼리가 활발하게 움직이는 모습이 <mark class="revision-highlight">신기하다고 말씀하셨다.</mark>',
    cheer: '“신기해하셨다”는 붙여 쓰는 것이 알맞아요. 두 표현 중 글의 상황에 더 가까운 것을 골라 써요.'
  },
  'ride-names': {
    type: '고칠 곳', tone: 'fix', title: '놀이기구 이름을 통일해요',
    reason: '놀이기구 이름은 “후룸라이드, 범퍼카, 슈퍼점핑, 회전컵, 바이킹”처럼 정확히 쓰고, 쉼표 뒤를 한 칸 띄어요.',
    example: '<mark class="revision-highlight">후룸라이드</mark>, 범퍼카, 슈퍼점핑, <mark class="revision-highlight">회전컵</mark>, 바이킹을 탔지만',
    cheer: '여러 놀이기구를 탄 순서가 한눈에 보여요.'
  },
  family: {
    type: '고칠 곳', tone: 'fix', title: '“패밀리코스터를 못 타서”',
    reason: '“페밀리”는 “패밀리”로, “못타서”는 “못 타서”로 고쳐 써요.',
    example: '<mark class="revision-highlight">패밀리</mark>코스터를 <mark class="revision-highlight">못 타서</mark> 아쉬웠다.',
    cheer: '타지 못한 놀이기구와 그때의 느낌을 잘 연결했어요.'
  },
  flume: {
    type: '고칠 곳', tone: 'fix', title: '“후룸라이드”로 통일해요',
    reason: '앞에서는 “후름라이더”, 여기에서는 “흐름라이더”라고 썼어요. 같은 놀이기구 이름은 “후룸라이드”로 통일해요.',
    example: '<mark class="revision-highlight">후룸라이드</mark>는 줄이 길었지만',
    cheer: '고유한 이름은 안내판이나 표를 보고 정확히 옮겨 쓰면 좋아요.'
  },
  scene: {
    type: '잘한 표현', tone: 'praise', title: '재미있던 순간이 보여요',
    reason: '놀이기구의 어느 부분이 재미있었는지 “내려가는 부분”이라고 콕 집었어요. “탈 때”는 띄어 써요.',
    example: '<mark class="revision-highlight">탈 때</mark> 내려가는 부분이 재밌었다.',
    cheer: '몸의 느낌을 한 가지 더 붙이면 독자가 그 순간을 더 잘 상상할 수 있어요.'
  },
  'super-jump': {
    type: '고칠 곳', tone: 'fix', title: '같은 놀이기구 이름으로 써요',
    reason: '앞에서 쓴 “슈퍼점핑”과 같은 놀이기구를 가리킨다면 이름을 똑같이 써야 해요.',
    example: '<mark class="revision-highlight">슈퍼점핑</mark>에서는',
    cheer: '같은 대상을 가리키는 이름은 글 전체에서 통일해요.'
  },
  'like-spacing': {
    type: '고칠 곳', tone: 'fix', title: '“처럼”은 붙여 써요',
    reason: '앞말과 닮았다는 뜻의 “처럼”은 앞말에 붙여 써요.',
    example: '도레미파솔라시도<mark class="revision-highlight">처럼</mark>',
    cheer: '자동차가 차례로 움직이는 모습을 음계에 빗댄 생각이 재미있어요.'
  },
  sequence: {
    type: '더 써 볼 곳', tone: 'grow', title: '무엇이 어떻게 움직였을까요?',
    reason: '“1번 자동차부터 뜬다”는 장면이 흥미롭지만, 어떤 순서로 움직였는지 분명하게 써 주면 더 생생하게 느껴질 거예요.',
    example: '1번 자동차부터 <mark class="revision-highlight">차례로 위로</mark> <mark class="revision-highlight">뜨는 게</mark> 신기했다.',
    cheer: '차례를 나타내는 말을 넣으면 독자가 움직임을 쉽게 상상할 수 있어요.'
  },
  viking: {
    type: '더 써 볼 곳', tone: 'grow', title: '이어 주는 말과 느낌을 다듬어요',
    reason: '“탔는데” 뒤에 다시 “탔지만”이 나와 어색해요. 어디에 탔는지와 어떤 느낌이 들었는지를 자연스럽게 이어 보세요.',
    example: '마지막으로 바이킹 <mark class="revision-highlight">뒤쪽에 탔는데, 신나고 활기찬 느낌이 들었다.</mark>',
    cheer: '바이킹을 타고 난 뒤의 힘찬 기분이 잘 느껴져요.'
  },
  ending: {
    type: '고칠 곳', tone: 'fix', title: '이름과 띄어쓰기를 확인해요',
    reason: '“페밀리”는 “패밀리”로, “타고싶다”는 “타고 싶다”로 써요. 문장 끝에는 마침표도 붙여요.',
    example: '다음에는 꼭 <mark class="revision-highlight">패밀리</mark>코스터를 <mark class="revision-highlight">타고 싶다.</mark>',
    cheer: '다음에 하고 싶은 일을 마지막에 쓴 마무리 방식은 아주 좋아요.'
  }
};

const marks = [...document.querySelectorAll('.mark[data-note]')];
const panel = document.getElementById('feedbackPanel');
const empty = document.getElementById('feedbackEmpty');
const detail = document.getElementById('feedbackDetail');
const type = document.getElementById('feedbackType');
const feedbackIcon = document.getElementById('feedbackIcon');
const feedbackCallout = document.getElementById('feedbackCallout');
const changeLabel = document.getElementById('changeLabel');
const title = document.getElementById('feedbackTitle');
const reason = document.getElementById('feedbackReason');
const example = document.getElementById('feedbackExample');
const cheer = document.getElementById('feedbackCheer');
const changeCard = document.getElementById('changeCard');

function closeFeedback() {
  marks.forEach(mark => {
    mark.classList.remove('is-selected');
    mark.setAttribute('aria-expanded', 'false');
  });
  detail.hidden = true;
  empty.hidden = false;
  panel.removeAttribute('data-tone');
}

const thumbsUpIcon = '<svg viewBox="0 0 48 48" focusable="false"><path d="M6.5 22.5h9v19h-9z"/><path d="M15.5 39c3.5 2.2 6.8 3 11 3h8.3c2.6 0 4.7-1.8 5.3-4.3l3.3-13.2c.8-3.3-1.7-6.5-5.1-6.5h-7.2l1.3-6.2c.6-3.1-1.2-6.4-4.2-7.3-1.2-.4-2.4.4-2.5 1.7-.7 7.3-3.6 12.6-10.2 17.2z"/></svg>';
const pencilIcon = '<svg viewBox="0 0 48 48" focusable="false"><path d="m9 38 3.1-10.7L31.5 7.9a4.1 4.1 0 0 1 5.8 0l2.8 2.8a4.1 4.1 0 0 1 0 5.8L20.7 35.9z"/><path d="m12.1 27.3 8.6 8.6M28.5 10.9l8.6 8.6M9 38l-.7 4.1 4.1-.7"/></svg>';

function openFeedback(mark) {
  const note = feedback[mark.dataset.note];
  if (!note) return;
  const alreadyOpen = mark.classList.contains('is-selected') && !detail.hidden;
  closeFeedback();
  if (alreadyOpen) return;
  mark.classList.add('is-selected');
  mark.setAttribute('aria-expanded', 'true');
  const praise = note.tone === 'praise';
  const grow = note.tone === 'grow';
  type.textContent = praise ? '잘한 표현' : grow ? '더 써 볼 표현' : '수정할 표현';
  feedbackIcon.innerHTML = praise ? thumbsUpIcon : pencilIcon;
  feedbackCallout.textContent = praise ? '좋아!' : '이렇게 써 볼까?';
  changeLabel.textContent = praise ? '좋았던 문장' : '고쳐 쓴 문장';
  title.textContent = note.title;
  reason.textContent = note.reason;
  example.innerHTML = note.example;
  cheer.textContent = note.cheer;
  panel.dataset.tone = note.tone;
  changeCard.hidden = !note.example;
  empty.hidden = true;
  detail.hidden = false;
  if (window.matchMedia('(max-width: 940px)').matches) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

marks.forEach(mark => {
  mark.setAttribute('aria-expanded', 'false');
  mark.setAttribute('aria-controls', 'feedbackDetail');
  mark.addEventListener('click', () => openFeedback(mark));
});

document.getElementById('closeNote').addEventListener('click', closeFeedback);

const toggleMarks = document.getElementById('toggleMarks');
toggleMarks.addEventListener('click', () => {
  const hidden = document.body.classList.toggle('marks-hidden');
  closeFeedback();
  toggleMarks.setAttribute('aria-pressed', String(hidden));
  toggleMarks.innerHTML = hidden
    ? '<span class="button-mark" aria-hidden="true"></span> 첨삭 표시 다시 보기'
    : '<span class="button-mark" aria-hidden="true"></span> 첨삭 표시 숨기기';
});

document.getElementById('printPage').addEventListener('click', () => window.print());

const storageKey = 'oncuvate-big-notebook-grandpark-revision-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}

document.querySelectorAll('textarea[data-save]').forEach(area => {
  const key = area.dataset.save;
  area.value = saved[key] || '';
  area.addEventListener('input', () => {
    saved[key] = area.value;
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) {}
  });
});

