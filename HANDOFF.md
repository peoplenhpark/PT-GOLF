# HANDOFF — 헬스 노트 (PT & 골프) PWA

> **목적**: 이 문서 하나만 읽고 다른 에이전트가 작업을 이어받을 수 있게 한다.
> **최종 갱신**: 2026-06-09 · **상태**: v1 완성·배포 push 완료, GitHub Pages 활성화만 사용자 대기

---

## 0. 30초 요약

- **무엇**: 사용자가 운동(PT/골프)하면서 폰으로 보는 **자세 큐 카드 + 셀프 체크리스트** PWA.
- **스택**: 순수 HTML/CSS/JS (빌드 도구·프레임워크·의존성 **0**). GitHub Pages 정적 호스팅.
- **저장**: 하이브리드 — 기본 데이터 `data/seed.json`(git 영구) + 사용자 편집은 브라우저 `localStorage`(즉시·오프라인).
- **배포처**: `https://github.com/peoplenhpark/PT-GOLF` (브랜치 `main`, push 완료).
- **남은 일**: 사용자가 GitHub **Pages 토글**만 켜면 끝 → `https://peoplenhpark.github.io/PT-GOLF/`
- **작업 디렉토리**: `C:\apark\pt_golf`

---

## 1. 사용자 의도 (원 요청)

1. 나만의 헬스 노트를 운동하며 쉽게 보는 **앱**으로, GitHub에 올린다.
2. **2파트**: PT / 골프. 동작이 **부정기적으로 추가**됨 → 누적관리 + 화면 디스플레이 + 메모.
3. 유사 앱 참고해 구성. → 결론: 세트 로깅 앱(Hevy/Strong)이 아니라 **"동작별 자세 큐 + 체크리스트 레퍼런스"**가 핵심. 무게/횟수 로깅은 의도적으로 **배제**.
4. (추가 확정) **추가·수정·삭제(CRUD)** 기능 포함.
5. 시작 데이터: 사용자가 준 `등운동_셀프체크리스트.pdf`(PT 등 3동작) + 골프 4클럽 연습노트(중복제거 요약 확정).

---

## 2. 현재 상태 (무엇이 끝났나)

| 항목 | 상태 | 비고 |
|---|---|---|
| 시드 데이터 (PT 등 3 + 골프 4 + 원칙 2블록) | ✅ | `data/seed.json` |
| 하이브리드 저장 + CRUD 데이터레이어 | ✅ | `js/store.js` |
| UI (홈/파트/상세/즐겨찾기/검색 + 모달) | ✅ | `index.html` `css/style.css` `js/app.js` |
| PWA (manifest/SW/아이콘, 오프라인) | ✅ | `manifest.webmanifest` `sw.js` `icon*.svg` |
| 브라우저 실동작 검증 | ✅ | §6 검증결과 참고 |
| README | ✅ | 배포·데이터 추가 가이드 포함 |
| git init + 첫 커밋 | ✅ | `c26bf1a` (branch `main`) |
| GitHub push | ✅ | `origin = peoplenhpark/PT-GOLF` |
| **GitHub Pages 활성화** | ⏳ **대기** | 사용자가 Settings에서 켜야 함 (§7) |

---

## 3. 파일 맵

```
C:\apark\pt_golf\
├─ index.html                 앱 셸 + 추가/수정 모달(#modal) + 확인(#confirm) + 토스트(#toast)
├─ css\style.css              다크 테마, 모바일 우선, CSS 변수(:root). PT=초록 / 골프=파랑
├─ js\store.js                ★ 데이터 레이어 (Store IIFE). seed+localStorage 병합, CRUD, export/import
├─ js\app.js                  ★ 라우팅 + 렌더 + 이벤트(위임) + 모달/메모/검색
├─ data\seed.json             ★ 기본 동작/원칙 (버전관리되는 영구 원본)
├─ manifest.webmanifest       PWA
├─ sw.js                      서비스워커. CACHE='ptgolf-v1', network-first→cache fallback
├─ icon.svg, icon-maskable.svg  SVG 아이콘 (덤벨+골프깃발)
├─ README.md                  사용자용 가이드(배포/데이터추가)
├─ HANDOFF.md                 (이 문서)
├─ .gitignore
├─ .claude\launch.json        프리뷰용(python http.server 5599) — 프로젝트 로컬 사본
└─ 등운동_셀프체크리스트.pdf    사용자 원본 노트 (PT 등운동 출처)
```

---

## 4. 데이터 모델 & 저장 구조 (가장 중요)

### 4.1 seed.json 스키마
```jsonc
{
  "version": 1,
  "updated": "2026-06-09",
  "parts": [ { "id": "pt", "label": "PT", "icon": "🏋️" }, { "id": "golf", "label": "골프", "icon": "⛳" } ],
  "principles": [
    {
      "id": "pr_pt_back", "part": "pt", "scope": "등",   // scope: 특정 카테고리명 또는 "*"(파트 전체)
      "title": "등 운동 핵심 원칙",
      "items": ["...", "..."],        // 상세화면 "📌 원칙" 블록
      "reminders": ["...", "..."]     // 그 아래 노란 강조
    }
  ],
  "exercises": [
    {
      "id": "pt_pullup",              // 고유 id (seed는 수동 명명, 앱 추가분은 'usr_xxxxx')
      "part": "pt",                   // "pt" | "golf"
      "category": "등",               // 부위(PT) / 클럽(골프). 화면 그룹핑 단위
      "name": "풀업 · 턱걸이",
      "spec": "60kg · 언더그립 위주",  // 상세 상단 "핵심" 박스 한 줄
      "favorite": true,
      "cues": ["...", "..."],         // ✅ 자세 체크리스트(탭=체크)
      "reminders": ["..."],           // 🔥 잊지 말 것 (비어도 됨)
      "memo": "",                     // 📝 내 메모
      "updated": "2026-06-09"
    }
  ]
}
```
현재 수록: PT 등(`pt_pullup`,`pt_seatedrow`,`pt_armpulldown`) / 골프(`golf_driver`,`golf_iron7`,`golf_iron5`,`golf_ironp`). 원칙 2블록(`pr_pt_back`, `pr_golf_common`(scope `*`)).

### 4.2 하이브리드 병합 로직 (store.js 핵심)
- **seed** = `data/seed.json` (fetch, `?v=Date.now()` 캐시버스팅).
- **overlay** = `localStorage["ptgolf_overlay_v1"]`, 형태 `{ overrides: {id: exercise}, deleted: [id,...] }`.
- `getAll()` = seed에서 `deleted` 제외 → 각 항목 `overrides[id]`로 덮어쓰기(병합) → seed에 없는 overrides(=앱에서 신규추가)를 append.
- **seed 항목 수정** = overrides에 병합본 저장 / **seed 항목 삭제** = `deleted`에 id push / **신규 추가** = id `usr_xxxxx` 생성 후 overrides에 저장.
- 체크리스트 체크상태는 **저장 안 함**(app.js의 메모리 `checks` 객체, 새로고침 시 리셋 — 운동 1회용).

### 4.3 영구화 흐름 (사용자 → git)
앱 내 추가·수정은 그 기기 localStorage에만 남음. **모든 기기 공유/영구 보존**하려면:
홈 → `⬇︎ 내보내기` → 받은 JSON의 `exercises`/`principles`를 `data/seed.json`에 반영 → `git commit && git push`.

---

## 5. 코드 아키텍처 메모

### store.js — `Store` IIFE
공개 API: `init()`(async, seed fetch) · `getParts` · `getPrinciple(part,category)` · `getAll` · `getByPart` · `getById` · `getFavorites` · `getCategories(part)` · `search(q)` · `upsert(ex)` · `remove(id)` · `patch(id,fields)` · `setMemo` · `toggleFavorite` · `exportData()` · `importData(data)` · `resetOverlay()` · `hasLocalChanges()` · `todayStr()`.

### app.js — `(IIFE)`
- **상태**: `view = { name, part, cat, id, q }`. name ∈ `home|part|detail|favorites|search`.
- **렌더**: `render()`가 view.name으로 분기 → `app.innerHTML = ...` 전체 교체. (가벼운 앱이라 가상DOM 없이 풀 리렌더)
- **네비**: `go(name, opts)`.
- **이벤트**: `document.body`에 click 위임 — `data-nav` `data-open` `data-part-open` `data-cat` `data-cue` `data-back` `data-act`. CRUD/모달/메모/export-import는 `data-act`로.
- **모달**: 추가/수정 공용(`openEditor(ex|null)` → `saveEditor()`), 삭제 확인(`askConfirm`).
- 카테고리 컬러 테마는 `.scr[data-part="golf"]` 셀렉터로 CSS에서 분기.

### 컨벤션
- **UI 텍스트는 한국어**. 빌드도구·라이브러리 도입 금지(요청 정신: 미니멀). 기존 코드 스타일(주석 톤·네이밍) 따를 것.
- HTML escape는 app.js의 `esc()` 사용(사용자 입력 렌더 시 필수).

---

## 6. 검증 결과 (실제 브라우저, Claude_Preview MCP)

홈/파트/상세 렌더 ✅ · 체크리스트 탭 토글(`1/6` 카운터) ✅ · **추가**(퍼터 신규)→localStorage 저장 ✅ · **삭제**(확인다이얼로그) ✅ · **수정**(메모+즐겨찾기)→**새로고침 후 유지** ✅ · 검색("어깨"→4동작) ✅ · 내보내기(7동작 전체) ✅ · `resetOverlay()`로 클린상태 복귀 ✅.
> 검증 후 테스트 편집은 모두 reset 처리 → 첫 실행은 깨끗한 시드 상태.

---

## 7. 남은 작업 / 다음 단계

### 즉시 (사용자 액션)
1. **GitHub Pages 켜기**: https://github.com/peoplenhpark/PT-GOLF/settings/pages → Source `Deploy from a branch` → `main` / `/(root)` → Save. 1~2분 후 → **https://peoplenhpark.github.io/PT-GOLF/**
2. 폰에서 접속 → 홈 화면에 추가(설치).

### 선택/검토
- `등운동_셀프체크리스트.pdf`가 Public 저장소에 포함됨. 사용자가 원치 않으면 `git rm` 후 push.
- 더 넓은 기기 설치 호환: 현재 아이콘은 SVG. 일부 환경 대비 192/512 **PNG 아이콘** 추가 검토(필수는 아님).
- 콘텐츠 확장: PT 가슴/하체/어깨/팔, 골프 어프로치/벙커 등 → 앱에서 추가하거나 seed.json 직접 편집.
- (요청 시) 동작 순서 변경/드래그, 카테고리 편집 UI.

### SW 캐시 주의
콘텐츠/코드 수정 후 `sw.js`의 `CACHE = 'ptgolf-v1'` 버전을 올려야 사용자 기기에서 강제 갱신됨. seed.json은 network-first라 온라인이면 대체로 최신.

---

## 8. 환경/실행 & 함정 (Windows)

- **OS**: Windows 11, 기본 셸 PowerShell. 작업 루트 `C:\apark\pt_golf`.
- **로컬 실행**: `python -m http.server 5599 --directory C:\apark\pt_golf` → `http://localhost:5599/index.html`.
  - ⚠️ **file:// 직접 열기는 안 됨** (seed.json `fetch` CORS 제약). 반드시 http 서버.
- **프리뷰 MCP**: `C:\Users\peopl\.claude\launch.json`에 `ptgolf-static`(위 서버) 등록됨. 프리뷰 서버는 세션 사이 멈출 수 있음 → 재시작 필요. mockup 검증 시 `preview_eval`로 `location.href='http://localhost:5599/index.html'` 후 스크린샷.
- **git**: `credential.helper=manager`(GCM), `github.com` 자격증명 저장됨 → **일반 `git push`는 자동 인증되어 동작**.
- ⚠️ **`gh` CLI 미설치**. 저장소 생성/Pages 토글을 명령으로 못 함(그래서 사용자 수동).
- ⚠️ **토큰/자격증명 추출 시도는 auto-classifier가 차단**함(`git credential fill`, `cmdkey` 등). 시도하지 말 것 — `git push`만으로 충분.
- PDF 텍스트 추출 시: `pip` 직접 없음 → `python -m pip install pypdf`, 그리고 `PYTHONIOENCODING=utf-8 PYTHONUTF8=1`(cp949 인코딩 에러 회피).
- `git`이 LF→CRLF 경고 출력 — 무해.
- 커밋 메시지 끝: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## 9. 골프 데이터 출처/요약 근거 (재작업 시 참고)

골프 4클럽은 사용자의 **시간순 연습 메모(날짜별)**를 클럽별로 중복제거·압축한 것. 규칙:
- 여러 클럽에 반복되는 큐 → **공통 원칙**(`pr_golf_common`, scope `*`)으로 통합.
- 클럽 고유 포인트만 각 exercise `cues`에 잔류. ☆ 강조였던 항목은 `reminders`(잊지말것)로 승격.
- 연습 날짜는 큐카드에 불필요 → **제거**.
- 클럽별 `spec`은 한 줄 부제: 드라이버="공간확보 + 타이밍", 7번="체중이동-지지-채만", 5번="왼팔 고정 = 정타", P="목표 100m · 축·몸 고정".
원본 raw 노트가 더 필요하면 사용자에게 재요청.

---

## 10. 관련 메모리(시스템 영구 규칙) 연결

이 사용자는 [no-system-for-system]/[efficacy-first]/[task-retrospective] 원칙 보유 — **실질 도움되는 최소 기능만**, 작업 마무리 시 효과성·간결성 자가평가. v1은 로깅 등 군더더기 배제·의존성 0으로 이 정신 준수. 확장 제안 시에도 "운동 중 실제로 쓰는가"로 거를 것.
