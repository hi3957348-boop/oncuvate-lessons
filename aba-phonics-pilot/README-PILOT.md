# ABA 파닉스 · 이중자 1~4회차 파일럿 (aba-phonics-pilot)

`ORKR_diagraph/tools/build-pilot.py`가 납품본에서 생성한다. 직접 고치지 말고 납품본을 고친 뒤 다시 빌드한다.

- 입장: `pilot-entry.html` — 학생은 방 번호 5자리, 코치는 **코치 고유번호** + 회차 → 「코치 화면 열기」.
- 코치 권한은 방을 연 기기에만 붙는다(코치 링크를 다른 기기에 붙이면 학생으로 열림).
- 실시간 방: Firebase `aba-phonics-pilot/rooms/<방>`(3시간). 기록: Web3Forms(ABA-PHONICS-PILOT) + 기기 저장 + 방 logs.
