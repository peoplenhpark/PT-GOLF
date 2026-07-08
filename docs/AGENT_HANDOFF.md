# PT-GOLF — 에이전트 인수인계 (Agent Handoff)

> **목적:** 다른 AI 코딩 에이전트가 **이 문서 하나만 읽고** 곧바로 작업을 이어받을 수 있도록 정리한 자기완결형 핸드오프.
> **최종 갱신:** 2026-07-08 · **현재 상태:** seed `v6` · SW `ptgolf-v13` · `main` = `origin/main` 동기화됨.

---

## 0. 30초 요약

- **무엇:** 운동 중(헬스장·필드) 한 손으로 보는 **개인용 설치형 PWA** — PT/골프 자세 큐 카드 & 셀프 체크리스트. 빌드 도구 없는 순수 HTML/CSS/JS.
- **라이브:** https://peoplenhpark.github.io/PT-GOLF/
- **배포:** GitHub Pages. **`main`에 push하면 자동 배포**(별도 CI 없음, 30~60초 후 반영).
- **저장소:** `peoplenhpark/PT-GOLF` (remote `origin`, HTTPS).
- **데이터:** `data/seed.json`(git 영구본) + 브라우저 `localStorage` 오버레이(사용자 편집). 서버·로그인 없음.
- **작업 원칙:** ① 모든 경로 **상대경로**(서브패스 `/PT-GOLF/`) ② 자산(css/js/seed/이미지) 바꾸면 **`sw.js`의 `CACHE` 버전을 올린다** ③ push 후 **라이브 URL을 폴링해 검증**.

---

## 1. ⚠️ 저장소 구조 — 헷갈리기 쉬움 (반드시 먼저 이해)

git 저장소 루트는 **`C:\APARK\PT_GOLF`** 이고, 앱 소스가 전부 여기 있다.
`C:\APARK\PT_GOLF\새 폴더\` 는 **작업용 스테이징 사본**이며 **`.gitignore`로 제외**되어 있다(리포에 커밋 안 됨). 새 콘텐츠는 이미 루트로 복사·반영 완료. 앱을 고칠 땐 항상 **루트의 파일**을 수정할 것.

```
C:\APARK\PT_GOLF\            ← git 루트 = 앱
├── index.html               앱 셸 + 모달(동작추가/확인/캘린더)
├── css/style.css            다크·라이트 테마, 모바일 우선 (CSS 변수 토큰)
├── js/store.js              데이터 레이어: seed.json + localStorage 병합, CRUD, export/import, 캘린더
├── js/app.js                라우팅·렌더·이벤트 위임·모달 (빌드 없음, vanilla)
├── data/seed.json           ★ 영구 콘텐츠(동작·원칙). 여기를 편집해 콘텐츠 추가.
├── sw.js                    서비스워커(오프라인 캐시). 자산 바꾸면 CACHE 버전 ↑
├── manifest.webmanifest     PWA 매니페스트 (scope/start_url 상대경로)
├── icon.svg / icon-maskable.svg
├── CLAUDE.md                프로젝트 메모리(요약+규칙)
├── README.md                사용자용 설명
├── docs/
│   ├── HANDOFF.md                원 프로젝트 배경·타임라인·데이터모델·시드
│   ├── AGENT_HANDOFF.md          ← 이 문서
│   ├── 일일수행2_동작입력.md       재활 4동작 원문 입력 콘텐츠
│   ├── PT재활_이미지_프롬프트.md    실사 이미지 생성 프롬프트(보류 중, 재시도용)
│   └── images/                   동작 일러스트 (01~04 재활, .svg 사용)
├── reference/                make_figs.py(옛 스틱피규어 생성기·현재 미사용), make_pdf.py, 등운동 PDF
└── 새 폴더/                  ⛔ gitignore됨(스테이징 사본) — 수정 대상 아님
```

---

## 2. 데이터 모델 (`data/seed.json`)

최상위: `{ version, updated, parts[], principles[], exercises[] }`

```jsonc
// parts: 상단 탭
{ "id": "pt"|"golf", "label": "PT", "icon": "🏋️" }

// principles: 카테고리 공통 원칙 (동작 상세 하단에 자동 표시)
{ "id": "pr_xxx", "part": "pt", "scope": "등"|"*"|"하체 재활 · 일일수행2",
  "title": "...", "items": ["..."], "reminders": ["..."] }
// scope: 특정 카테고리명 매칭, "*" = 해당 part 전체

// exercises: 동작 카드
{ "id": "pt_pullup", "part": "pt", "category": "등",
  "name": "풀업", "spec": "60kg · 언더그립 위주",
  "image": "docs/images/01_quadset.svg",   // 선택 — 있으면 상세에 참고 그림 표시
  "favorite": true,
  "cues": ["자세 체크리스트 줄들"],          // 상세에서 탭하면 체크(1회용, 저장 안 함)
  "reminders": ["잊지 말 것"],
  "memo": "", "updated": "2026-07-07" }
```

- **카테고리 = 서브탭(칩).** `part` 뷰에서 `category`별 칩으로 그룹핑되고, 등장 순서(=배열 순서)가 칩 순서다.
- **`image` 필드**(이번 세션 신설): 존재하면 `renderDetail`이 `.ex-figure`로 렌더. 경로는 루트 기준 상대경로.
- **편집 시 image 보존됨:** 편집 폼엔 image 입력이 없지만 `Store.upsert`가 기존 객체를 스프레드 병합하므로 유지됨.
- 현재: `version 6`, exercises **19**, principles **5**. PT 카테고리 = 등 / 하체 / 일일 수행 / **하체 재활 · 일일수행2**.

### 하이브리드 저장 로직 (`store.js`)
- `getAll()` = seed + `localStorage` 오버레이(overrides/deleted) 병합.
- seed 항목 삭제 = deleted 마스크, 로컬 추가분 = overrides. **seed.json 편집이 "영구", 앱 내 편집은 기기 로컬.**
- `exportData()`(백업 JSON) → 그 내용을 seed.json에 반영하면 영구화.

---

## 3. 배포 & 검증 워크플로 (그대로 따를 것)

```bash
# 루트에서
cd "C:/APARK/PT_GOLF"
# 1) 파일 수정
# 2) 자산(css/js/seed.json/이미지)을 바꿨으면 sw.js의 CACHE 값을 올린다: 'ptgolf-vN' → 'ptgolf-v(N+1)'
# 3) 커밋 (git identity가 없으면 아래처럼 로컬 지정)
git config user.name "apark"; git config user.email "peoplenhpark@github.com"
git add <files>
git commit -m "메시지 ... (SW vN)"   # 메시지·본문은 한국어, 커밋 끝에 Co-Authored-By 유지
git push origin main
```

### 라이브 검증 (샌드박스에서 로컬 서버가 안 되므로 배포본으로 검증)
push 후 PowerShell로 30~60초 폴링:
```powershell
for($i=1;$i -le 12;$i++){ Start-Sleep 12
  try{ $j=(Invoke-WebRequest "https://peoplenhpark.github.io/PT-GOLF/data/seed.json?cb=$i" -TimeoutSec 12 -UseBasicParsing).Content|ConvertFrom-Json
    if($j.version -ge <기대버전>){ "DEPLOYED v$($j.version)"; break } else { "v$($j.version) 대기" } }
  catch { $_.Exception.Message } }
```
(css/js 변경은 파일 본문에 특정 문자열이 있는지 `-match`로 확인. `?cb=$i`로 캐시 우회.)

---

## 4. 🧰 환경 제약 & 함정 (실제로 겪은 것들)

- **로컬 프리뷰 불가:** 이 샌드박스는 **listen 소켓 바인딩을 차단**한다. `python -m http.server`가 떠도 포트에 안 붙는다(에러도 없이). `preview_start`/curl-localhost 모두 무의미. → **정적 사이트이므로 라이브 URL 폴링으로 검증**한다.
- **`curl`이 localhost에서 행(hang)** — PowerShell `Invoke-WebRequest`(127.0.0.1, `-TimeoutSec`)를 쓸 것. 아웃바운드 HTTPS(github.io)는 정상.
- **git 저자 미설정** — 첫 커밋 시 `user.name/email` 로컬 지정 필요(위 참조). 기존 커밋 저자 = `apark <peoplenhpark@github.com>`.
- **원격에 웹 업로드 커밋이 끼어들 수 있음** — 사용자가 GitHub 웹에서 직접 파일을 올리기도 한다(예: `Add files via upload`). push가 거부되면 `git fetch` → `git merge origin/main`(경로 겹침 없으면 클린 머지) → push.
- **CRLF 경고** — `LF will be replaced by CRLF`는 Windows 정상 경고, 무시.
- **Windows Store python 셔임** — Bash의 `python`이 스토어 셔임일 수 있음. JSON 처리엔 `PYTHONIOENCODING=utf-8 python - <<'PY'` 형태가 안전.
- **콘솔 인코딩(cp949)** — 한글/이모지 print가 깨질 수 있어 `PYTHONIOENCODING=utf-8` 권장.
- **파괴적 작업 차단** — 사용자가 만든/명시 안 한 파일 `rm`은 자동 거부된다. 삭제가 꼭 필요하면 사용자에게 물을 것. (이번에 루트 `HANDOFF.md`·중복 PDF·옛 PNG를 지우려다 막혀서 그대로 둠 → 무해한 중복이 일부 남아 있음.)

---

## 5. 이번 세션에 한 일 (시간순 · 커밋)

| 커밋 | 내용 |
|---|---|
| `43be76a` | **일일수행2(하체 재활) 4동작** 반영: 쿼드셋·SLR·클램쉘·SSLR + 재활 공통원칙 `pr_pt_rehab`. exercise에 **`image` 필드 신설**, `renderDetail`에 그림 렌더, `.ex-figure` CSS, SW v9. `새 폴더/` gitignore. |
| `be556cc` | 원격 웹 업로드 2커밋과 **클린 머지**. |
| `346a64d` | PT 부위 칩(서브탭) **한 줄 가로 스크롤**(`flex-wrap:nowrap`+overflow, 스크롤바 숨김). SW v10. |
| `8c97494` | 긴 칩 **라벨 2줄** 표시(`' · '`→`<br>`), 칩 높이 균일(inline-flex+min-height), 알약→둥근사각(radius16). SW v11. |
| `5cfd796` | 재활 이미지 **스틱피규어→플랫 벡터 일러스트(SVG)** 4종 교체(관절 마네킹·근육 글로우·화살표·그림자·라이트패널). seed 이미지 `.png→.svg`(선명·경량), `.ex-figure` 이중프레임 제거. **동작 상세 3번째 행 카테고리 태그 클릭 시 해당 파트+카테고리로 바로 이동**(`data-catnav` 위임 핸들러 + `.tag.link`). SW v12. |
| `1155f8e` | 실사 이미지 생성 프롬프트 문서(`docs/PT재활_이미지_프롬프트.md`) 추가. |
| `b72125d` | **7/7 PT 보강 세션(녹취록)** 반영: 재활 4종·풀업·시티드로우·플랭크의 cues/reminders 보강. seed v6. |

### 기능적으로 추가된 것 (코드 위치)
- **참고 이미지:** `app.js` `renderDetail` 내 `e.image` 블록 + `css` `.ex-figure`.
- **칩 서브탭 한 줄+2줄 라벨:** `app.js` chip 생성부(`' · '.split.join('<br>')`) + `css` `.chips`/`.chip`.
- **카테고리 태그 바로가기:** `app.js` 클릭 위임 셀렉터에 `[data-catnav]` 추가 + 핸들러(`view={name:'part',part,cat}` 후 `render()`), 태그 마크업 `data-catnav="part::category"`, `css` `.tag.link`.

---

## 6. 현재 열린 결정 / 스탠스 (되돌리지 말 것)

- **이미지 = 현행 간략화 SVG 일러스트 유지.** 실사(포토리얼) 시도는 **사용자 요청으로 보류**. 이유: 이 환경엔 실사 생성기가 없고, 저작권 스톡 무단 사용 불가. 재시도 시 **`docs/PT재활_이미지_프롬프트.md`**의 프롬프트로 사용자가 이미지 AI에서 생성 → 파일 받으면 WebP 압축·경로 교체·SW bump·배포. (사용자가 "실사 다시" 라고 하면 그때 진행.)
- **`reference/make_figs.py`는 옛 스틱피규어 생성기 → 현재 앱과 무관.** 지금 SVG는 손으로 작성한 것. 이미지 재생성 시 이 스크립트에 의존하지 말 것.
- **커밋/push = 정상 워크플로.** 이 리포는 개인 PWA이고 push가 곧 배포다. (⚠️ 사용자 메모리의 "원격 push 금지"는 **다른 저장소(주식/telegram_summary)** 한정 — PT-GOLF와 무관.)

---

## 7. 백로그 / 다음 후보 작업

우선순위 순 (CLAUDE.md의 "다음 작업"과 이번 세션 잔여):
1. **세션(일일수행) 서브탭 계층** — 현재는 `category`를 서브탭으로 활용 중. 레슨이 늘면 세션 그룹 계층 도입 검토(CLAUDE.md §다음작업 2).
2. **편집 폼에 `image` 필드 노출** — 지금은 seed로만 이미지 지정 가능. 앱 내에서 그림 연결 UI가 필요하면 추가.
3. **실사 이미지**(보류) — 위 6 참조. 사용자 재요청 시.
4. **중복 정리(선택)** — 루트 `HANDOFF.md`(구버전)·루트 중복 PDF·`docs/images/*.png`(옛 스틱, 현재 미참조). 삭제는 사용자 승인 필요.
5. `docs/HANDOFF.md` §12 미해결 질문(큐 체크 누적 여부, 편집/삭제 범위 등) 확인.

---

## 8. 콘텐츠·코딩 규칙 (요약)

- UI·커밋 메시지 **한국어**. 재활 동작은 **좌우 각각** 기준.
- **서브패스 안전:** 절대경로 금지, SW `start_url`·manifest `scope`·이미지 모두 상대경로.
- 이미지는 **SVG 직접 참조**(가볍고 선명). 새 일러스트도 SVG 권장, 자체 rounded 패널 배경 포함(현행 4종 스타일 참고).
- 콘텐츠(동작/원칙) 추가·수정은 **`data/seed.json`** 에서. 추가 후 필요시 `version`·`updated` 갱신.
- 자산 변경 → **SW `CACHE` bump 필수**(안 하면 설치된 PWA가 옛 캐시 사용).
- 마무리: JSON 유효성 확인 → 커밋 → push → **라이브 폴링 검증** → 사용자에게 무엇이 라이브인지 보고.

---

## 9. 빠른 시작 체크리스트 (다음 에이전트용)

```
[ ] git 루트 = C:\APARK\PT_GOLF 확인 (새 폴더/ 아님)
[ ] git status -sb 로 origin/main 동기화 확인
[ ] 수정할 대상: data/seed.json(콘텐츠) / js·css(동작) 판단
[ ] 자산 바꿨으면 sw.js CACHE 버전 +1
[ ] JSON이면 PYTHONIOENCODING=utf-8 python 으로 유효성 검사
[ ] git config user.* 없으면 지정 → commit(한국어) → push origin main
[ ] push 거부되면 fetch→merge origin/main→push
[ ] Invoke-WebRequest 로 라이브 URL 폴링 검증(로컬서버 불가)
[ ] 사용자에게 라이브 반영 결과 보고 + 자가평가(효과성/간결성)
```
