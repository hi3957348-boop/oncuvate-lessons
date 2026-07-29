# 생각을 정리하는 주제글쓰기

온큐베이트 학생·강사 통합 글쓰기 스튜디오입니다.

## 제공 기능

- 학생번호 입장
- 강사 이메일 로그인
- 학생별 현재 단계, 진행률, 작성량, 선택 동물 모니터링
- 학생 개인 메시지 전송
- 강사 판서 작성 및 학생 화면 전송
- Firebase 미설정 시 한 브라우저에서 기능을 확인하는 데모 모드

## Firebase 연결

1. Firebase에서 새 웹 앱을 만들고 Authentication의 **익명 로그인**과 **이메일/비밀번호 로그인**을 켭니다.
2. Firestore Database를 만든 뒤 강사 계정을 Authentication에 등록합니다.
3. `firebase-config.js`에 웹 앱 설정값을 붙여 넣습니다.
4. `firebase deploy --only firestore:rules,hosting`으로 보안 규칙과 사이트를 배포합니다.

학생은 익명 로그인 후 자신의 학생번호 문서만 갱신합니다. 이메일이 있는 Firebase Authentication 계정만 강사 권한으로 학생 목록, 메시지, 판서를 관리할 수 있습니다.
