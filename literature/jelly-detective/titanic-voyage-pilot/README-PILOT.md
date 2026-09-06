# 젤리 바다탐정 · 파일럿 사본 (titanic-voyage-pilot)

이 폴더는 `tools/build-pilot.py titanic-voyage`가 **납품본 `titanic-voyage`에서 생성**한다. 직접 고치지 말고 납품본을 고친 뒤 다시 빌드한다.

## 파일럿에만 있는 것 — 납품 폴더에 넣지 않는다
- `pilot-entry.html` / `pilot-entry.css` — 코치가 방 번호와 회차를 열고, 학생은 방 번호로 들어온다.
- `pilot-bootstrap.js` — URL의 역할·방·기기 코드를 `window.ONCUVATE`로 넣는다(정식 서비스에서는 서버가 넣는다).
- `pilot-firebase-core.js` — 파일럿 Firebase 방(`titanic-voyage-pilot/rooms/<방>`), 3시간 뒤 닫힘.
- `pilot-config.js` / `pilot-log-relay.js` — `oncuvate:log`·`data-track`을 기기에 모아 Web3Forms로 묶어 보낸다(정식에서는 플랫폼 트래커가 한다).

## 열기
1. `pilot-entry.html`을 연다(로컬 확인은 launch.json `titanic-voyage-pilot`, 포트 8988).
2. 코치 탭 → 회차 고르기 → 「코치 화면 열기」. 방 번호를 학생에게 알려 준다.
3. 학생은 학생 탭에 방 번호 입력 → 해당 회차가 열린다. 코치 패널 「접속한 학생」에 진행이 실시간으로 뜬다.

## 모으는 것
학습기록 신호 전부(문항·시도·정오·힌트 수준·반응시간·집중 신호·이해 모니터링), 다시 말하기 원문. 실명·이메일·좌표·음성은 모으지 않는다.
