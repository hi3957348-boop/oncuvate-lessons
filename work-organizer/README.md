# 업무정리 (Work Organizer)

윈도우용 **원노트형 업무·법령/규정 정리 프로그램** — 완전 포터블(무설치) 데스크톱 앱.

- 📚 **원노트형 4단 계층**: 노트북 › 규정(섹션) › 하위주제 › 페이지
- 🕓 **변경 히스토리**: 조문별 버전 타임라인, 개정 요약 기록
- 📎 **문서 첨부**: PDF·HWP·XLS 등을 버전에 연결(포터블 폴더로 복사 보관)
- 🔗 **상호 참조 + 호버 미리보기**: 마우스만 올리면 대상 조문 원문을 팝업으로 즉시 확인
- 🕸 **참조 관계도**: 현재 규정을 중심으로 참조/역참조를 그래프로 시각화(노드 클릭 이동)
- ⇄ **버전 비교(diff)**: 두 개정 버전의 본문 차이를 단어 단위로 하이라이트
- 💾 **표준 파일 `.owp`**: 내보내기/가져오기로 동료와 손쉽게 공유
- 🧳 **완전 포터블**: `업무정리.exe` 옆 `data/` 폴더에 저장 → USB째 이동 가능
- 🤖 **자동 빌드**: GitHub Actions로 push 시 포터블 exe 자동 생성(Actions 탭 → Artifacts)

---

## 개발 실행

```bash
cd work-organizer
npm install
npm start
```

## 무설치 포터블 exe 빌드 (Windows 대상)

```bash
npm run build:win        # → dist/업무정리-0.1.0-portable.exe (더블클릭 실행)
npm run build:win:setup  # (선택) 설치형 exe
```

> Windows에서 빌드하는 것을 권장합니다. macOS/Linux에서 Windows exe를 빌드하려면
> electron-builder가 Wine을 요구할 수 있습니다.

## 데이터 저장 위치

| 모드 | 위치 |
|------|------|
| 포터블 exe 실행 | `업무정리.exe`와 같은 폴더의 `data/workspace.owp` |
| 개발 실행(`npm start`) | 프로젝트 루트의 `data/workspace.owp` |
| 첨부 문서 | `data/attachments/` 로 사본 복사 |

편집 시 **자동 저장**되며, 저장 직전 상태는 `workspace.owp.bak`으로 백업됩니다.

## 브라우저 미리보기

`src/renderer/index.html`을 브라우저로 열면 UI를 체험할 수 있습니다.
이 경우 데이터는 브라우저 `localStorage`에 임시 저장됩니다(파일 저장·첨부 복사는 데스크톱 앱에서만 동작).

## 폴더 구조

```
work-organizer/
├─ package.json          # 의존성·빌드 설정(포터블 타겟)
├─ 개발계획서.md          # 개발 계획 문서
├─ src/
│  ├─ main.js            # Electron 메인(창·파일IO·포터블 경로·메뉴)
│  ├─ preload.js         # 보안 IPC 브리지
│  └─ renderer/          # UI (index.html · styles.css · renderer.js)
└─ README.md
```

## 데이터 포맷 `.owp`

사람이 읽을 수 있는 JSON입니다. 스키마는 `개발계획서.md`의 5장을 참고하세요.
