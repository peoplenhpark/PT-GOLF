# 헬스 노트 — PT & 골프 🏋️⛳

운동하면서 폰으로 바로 보는 **나만의 자세 큐 카드 & 셀프 체크리스트**.
PT / 골프 2파트로 동작을 누적 관리하고, 화면에서 보고, 메모하고, 추가·수정·삭제할 수 있습니다.

> 빌드 도구 없는 순수 HTML/CSS/JS PWA — GitHub Pages에 폴더째 올리면 끝.

## 기능
- **2파트 구조** — PT(부위별) / 골프(클럽별), 부정기적으로 동작 누적
- **동작 상세** — 핵심 스펙 + 자세 체크리스트(탭하면 체크) + 잊지 말 것 + 카테고리 공통 원칙 + 내 메모
- **CRUD** — 동작 추가 / 수정(✏️) / 삭제(🗑) / 즐겨찾기(★) / 메모 인라인 편집
- **검색** — 동작명·큐·메모 전체 검색
- **오프라인 PWA** — "홈 화면에 추가" 시 앱처럼 풀스크린·오프라인 동작
- **백업/복원** — JSON 내보내기·가져오기

## 데이터 저장 방식 (하이브리드)
| 구분 | 위치 | 성격 |
|---|---|---|
| 기본 동작·원칙 | `data/seed.json` (git) | 버전관리되는 **영구 원본** |
| 내 추가·수정·메모·즐겨찾기 | 브라우저 `localStorage` | 이 기기에 **즉시 저장**, 오프라인·운동 중 OK |

- 평소 추가·수정·메모는 자동으로 이 기기에 저장됩니다.
- **영구 보존**하려면: 홈 화면 → `⬇︎ 내보내기` → 받은 JSON의 `exercises`/`principles`를 `data/seed.json`에 반영 후 커밋.
- 다른 기기/캐시 삭제 대비 백업은 `⬇︎ 내보내기`로.

## 로컬 실행
정적 서버가 필요합니다(파일 직접 열기는 `fetch` 제약으로 동작 안 함).
```bash
cd pt_golf
python -m http.server 5599
# → http://localhost:5599/index.html
```

## GitHub Pages 배포
1. 이 폴더를 GitHub 저장소로 push
2. 저장소 **Settings → Pages → Source: `main` 브랜치 / `/ (root)`** 선택
3. `https://<유저명>.github.io/<레포명>/` 접속 → 폰에서 **홈 화면에 추가**

## 동작 데이터 직접 추가 (선택)
앱에서 추가해도 되고, `data/seed.json`의 `exercises` 배열에 직접 넣어도 됩니다:
```json
{
  "id": "pt_bench",
  "part": "pt",
  "category": "가슴",
  "name": "벤치프레스",
  "spec": "40kg · 가슴 고립",
  "favorite": false,
  "cues": ["견갑 모으고 고정", "가슴으로 밀어낸다"],
  "reminders": ["허리 과도하게 들지 말 것"],
  "memo": "",
  "updated": "2026-06-09"
}
```
- `part`: `"pt"` 또는 `"golf"`
- 카테고리 공통 원칙은 `principles` 배열에서 `scope`로 지정(`"*"` = 해당 파트 전체).

## 파일 구조
```
index.html              앱 셸 + 모달
css/style.css           다크 테마, 모바일 우선
js/store.js             하이브리드 데이터 레이어 (seed + localStorage 병합, CRUD, export/import)
js/app.js               라우팅 · 렌더 · CRUD UI
data/seed.json          기본 동작/원칙 (영구 원본)
manifest.webmanifest    PWA 매니페스트
sw.js                   서비스워커 (오프라인 캐시)
icon.svg / icon-maskable.svg
```
