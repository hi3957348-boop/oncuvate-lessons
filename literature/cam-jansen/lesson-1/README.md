# 카메라 탐정단 1회차 운영 메모

## 배포 경로

- 정적 진입점: `/literature/cam-jansen/lesson-1/`
- GitHub Pages의 폴더형 URL `https://read.oncuvate.com/literature/cam-jansen/lesson-1/`로 서비스한다.
- AI API 비밀키, Firebase 설정, 실명 학생 식별자는 이 수업 파일에 넣지 않는다. Web3Forms 공개용 access key만 `activity-config.js`에서 임시로 설정할 수 있다.

## 진행 데이터 계약

수업은 입력 후 350ms 디바운스로 로컬 상태를 저장하고, 같은 출처의 부모 창이 있을 때 아래 메시지를 보낸다.

```js
{
  type: "oncuvate-lesson-progress",
  schema: "oncuvate.lesson-progress.v1",
  lessonId: "cam-jansen-stolen-diamonds-l01",
  lessonVersion: 13,
  entryMode: "self",
  roomCode: "",
  currentPage: 1,
  sourceChapters: [1, 2, 3],
  totalPages: 12,
  progress: 8,
  score: 0,
  badges: [],
  answeredFields: 0,
  completed: false,
  updatedAt: "ISO-8601"
}
```

상위 스튜디오는 `event.origin === window.location.origin`과 `schema`, `lessonId`를 확인한 뒤 서버에 저장한다. 학생의 자유서술 전문은 기본 진행 메시지에 포함하지 않는다.

첫 진입화면에서 자율활동, 실시간 수업 참여, 강사 화면 중 하나를 선택한다. 자율활동은 문항별 사고 힌트를 표시하고, 실시간 수업은 학생 이름 또는 코드와 숫자 5자리 방 코드를 받아 `도와주세요`를 활성화한다. 강사 화면은 교수용 메모와 진행안 링크를 표시한다. 사이드바에는 역할·지원 모드 전환 버튼을 두지 않으며 상단 `입장 선택`에서만 다시 전환한다.

강사 연동 모드의 `도와주세요` 버튼은 아래처럼 답안 전문 없이 현재 위치만 전달한다.

```js
{
  type: "oncuvate-help-request",
  schema: "oncuvate.help-request.v1",
  lessonId: "cam-jansen-stolen-diamonds-l01",
  lessonVersion: 13,
  currentPage: 6,
  promptId: "ch1-q1",
  status: "requested",
  createdAt: "ISO-8601"
}
```

상위 스튜디오는 같은 출처의 자식 프레임에 `{ type: "oncuvate:set-support-mode", mode: "linked" }`를 보내 연동 모드를 켤 수 있다.

## 임시 Web3Forms 자동 수집

`activity-config.js`의 `web3formsAccessKey`에 Web3Forms access key를 넣으면 별도 제출 버튼 없이 자동 전송한다. access key가 비어 있거나 네트워크가 끊기면 최신 기록을 로컬 대기열에 두고, 설정과 연결이 준비되면 다시 시도한다.

자동 전송 시점은 핵심 활동 확인, Chapter 활동 화면 이탈, 쓰기 도움 사용, 8분 주기 변경분, 수업 종료, 탭 숨김이다. 전송량을 줄이기 위해 같은 상태는 중복 전송하지 않는다.

전송 레코드 `oncuvate.activity-record.v1`에는 다음이 포함된다.

- 학생이 진입화면에 입력한 이름 또는 수업용 코드와 익명 세션 ID. 기관 운영 시에는 실명 대신 수업용 코드를 사용한다.
- 객관 문항 정오답, 서술 문항 완성 여부, 확인 시도 횟수
- 페이지 체류 시간과 문항별 첫 반응 시간
- 자율 힌트 열람 횟수와 강사 도움 요청 횟수
- 모든 학생 답안
- 쓰기 도움 전 초안, 피드백, 제안문, 적용 여부, 이후 학생 수정문

Web3Forms는 기록 전송만 담당하며 AI를 실행하지 않는다. `aiTutorEndpoint`가 비어 있으면 로컬 문장 틀·기본 문법 코치가 작동하고 `local_scaffold`로 기록된다. 실제 AI Tutor를 연결할 때는 인증이 포함된 보호된 서버 엔드포인트를 사용하고 브라우저 파일에 AI API 키를 넣지 않는다.

## 운영 원칙

- 학생 화면은 브라우저 로컬 저장만으로도 작동한다.
- 1회차는 Chapter 1–3을 수업 안에서 모두 읽는 70분 방학특강 표준안이다. 예습과 숙제를 요구하지 않으며, 미완성 답도 가정 과제로 넘기지 않는다.
- 읽기가 느린 학습자는 75–80분까지 교사 모델링을 추가한다. 50분안은 이미 Chapters 1–3을 읽은 학생의 빠른 복습에만 사용한다.
- 화면 2는 16개 단어 Word Lab, 화면 3–4는 전체 읽기에 적용하는 관찰과 Fact/Guess 연습이다.
- 이후에는 Chapter 1 안내→전체 읽기, Chapter 2 안내→전체 읽기, Chapter 3 안내→전체 읽기 순서로 한 안내와 한 읽기 화면을 짝지어 진행한다.
- Listen은 `assets/audio`에 포함된 자연스러운 영어 MP3만 재생하며 자동 재생하지 않는다. 브라우저·운영체제 TTS와 실시간 음성 API는 사용하지 않는다. 문장별 한국어 번역은 제공하지 않는다.
- 음성은 단어 16개, Chapter 안내 3개, 읽기 질문 7개, 관찰 연습 지문 1개로 총 27개다. 같은 목소리와 수업용 말투를 유지한다.
- 자율학습 힌트는 정답 대신 다시 볼 장면과 답의 구조를 안내한다. 강사 연동 요청에는 답안 내용을 포함하지 않는다.
- 학생 화면의 Chapter 1–3 읽기 문항은 답과 판본별 쪽수를 각각 저장하며, 모든 필수 칸이 채워지면 기록 완료 상태가 자동 표시된다.
- 강사 모드는 지도 포인트와 `teacher-guide.html` 진입 링크를 보여 준다. 교수안의 예상 답은 핵심 의미만 요약하며 원문을 대체하지 않는다.
- 오른쪽 패널은 모든 모드에서 자유 필기용 미니칠판을 제공한다. 강사 모드에서는 현재 화면, 방 코드, 현재 브라우저 세션의 도움 요청 수, 화면 바로가기와 교수용 진행안 링크가 함께 표시된다.
- `화면 판서`는 수업 화면 위에 임시로 선을 그리는 도구다. 종료하거나 새로고침하면 지워지며 학생 활동 기록과 Web3Forms에는 포함하지 않는다.
- Web3Forms 임시 수집은 보호자·기관의 적법한 동의와 개인정보 처리 고지를 준비한 수업에서만 활성화한다. 정식 백엔드 전환 후에는 인증, 교사별 접근 권한, 보존·삭제 정책을 적용한다.
- 배포 전 모바일, 키보드, A4 인쇄, 콘솔 오류를 확인한다.
- 원서 문장·삽화·표지 이미지를 이 폴더에 추가하지 않는다.

## 교수용 진행안

- 파일: `teacher-guide.html`
- 인쇄본: `output/pdf/cam-jansen-lesson-1-teacher-guide.pdf` (A4, 6쪽)
- 용도: 수업 중 교사용 진행, 예상 답의 핵심 의미 확인, 5분 즉흥 증인 인터뷰 운영
- 원칙: 학생별 합법 원서 사용, 원작 대사 대본화 금지, 역할극 녹화·공개 배포 금지
