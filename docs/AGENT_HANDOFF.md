# PT-GOLF — 에이전트 인수인계 (Agent Handoff)

> **목적:** 다른 AI 코딩 에이전트가 **이 문서 하나만 읽고** 곧바로 작업을 이어받을 수 있도록 정리한 자기완결형 핸드오프.
> **최종 갱신:** 2026-08-06 · **현재 상태:** seed `v23` · SW `ptgolf-v36` · 자산 `?v=36`/`ASSET_VER='36'` · `main` = `origin/main` 동기화됨.

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
│   └── images/                   동작 일러스트 SVG 01~27 (비골프 32동작 중 27개) + 28·29(골프, 미참조)
│                                 (옛 01~04 .png는 미참조로 잔존)
├── reference/                make_figs.py(옛 스틱피규어 생성기·현재 미사용), make_pdf.py, 등운동 PDF
└── 새 폴더/                  ⛔ gitignore됨(스테이징 사본) — 수정 대상 아님
```

---

## 2. 데이터 모델 (`data/seed.json`)

최상위: `{ version, updated, parts[], principles[], exercises[] }`

```jsonc
// parts: 상단 탭
{ "id": "pt"|"golf", "label": "PT", "icon": "🏋️" }

// principles: 카테고리 공통 원칙 (동작 상세 하단에 1개만 표시)
{ "id": "pr_xxx", "part": "pt", "scope": "등"|"*"|"하체 · 머신",
  "title": "...", "items": ["..."], "reminders": ["..."] }
// scope: 특정 카테고리명 매칭, "*" = 해당 part 전체
// ⚠️ getPrinciple은 '카테고리 전용'을 '*'보다 우선(배열 순서 무관). 한 동작당 원칙 1개만 렌더.

// exercises: 동작 카드
{ "id": "pt_pullup", "part": "pt", "category": "등",
  "name": "풀업", "spec": "60kg · 언더그립 위주",
  "image": "docs/images/01_quadset.svg",   // 선택 — 있으면 상세에 참고 그림 표시
  "steps": ["준비 골반접기","①백스윙","②체중이동"],  // 선택 — 상세 상단에 키워드 흐름
  "focus": { "muscle":"…", "move":"…", "feel":"…" },  // 선택 — 상세 최상단 🎯 타깃 카드
  "favorite": true,
  "cues": ["자세 체크리스트 줄들"],          // 상세에서 탭하면 체크(1회용, 저장 안 함)
  "reminders": ["잊지 말 것"],
  "memo": "", "updated": "2026-07-07" }
```

- **카테고리 = 서브탭(칩).** `part` 뷰에서 `category`별 칩으로 그룹핑되고, 등장 순서(=배열 순서)가 칩 순서다.
- **`image` 필드:** 존재하면 `renderDetail`이 `.ex-figure`로 렌더. 경로는 루트 기준 상대경로.
- **편집 시 image 보존됨:** 편집 폼엔 image 입력이 없지만 `Store.upsert`가 기존 객체를 스프레드 병합하므로 유지됨.
- **`focus` 필드**(2026-08-06 신설, **32동작 전부 보유**): `{muscle, move, feel}` — 상세 **최상단**에 `.focus-box`로 «🎯 타깃 근육 / 움직임 / 느낌» 카드를 렌더. 기존 cues·원칙에 흩어진 트레이너 코칭을 **3줄로 압축한 요약 레이어**(중복 아님 — 먼저 읽는 개념). `Store.search`도 focus를 훑으므로 **「중둔근」「대퇴사두」 등 근육명으로 검색** 가능. 새 동작 추가 시 focus도 같이 작성할 것.
- **`steps` 필드**(2026-07-30 신설): 있으면 `renderDetail`이 상세 **최상단**(스펙 위)에 `.steps-flow`로 **키워드 흐름**(`›` 구분)을 렌더. 현재 골프 4종만 사용(4종 동일 문구) — `준비 골반접기 › ①백스윙(어깨 높이 유지) › ②체중이동+손 내리기 › ③지연(수직 낙하까지) › ④임팩트(몸으로·면타격) › ⑤팔 펴기·중심 확인`. **스크롤 없이 `flex-wrap:wrap`으로 한 화면에 전부 노출**(가로 스크롤 방식은 폐기). ⚠️ 골프는 **시퀀스 일러스트를 만들었다가 사용자 요청으로 제거**(`d4d7bb5`→`0963670`)하고 이 키워드 스트립으로 대체함. 이미지로 되돌리지 말 것(파일 `28/29_golf_steps_*.svg`는 미참조로 잔존).
- 현재: `version 23`, exercises **32**, principles **9**. PT 칩 순서 = 등 / 팔 / **가슴** / 하체 / 하체 · 머신 / 일일 수행 / 하체 재활 · 일일수행2 / 추천운동 (골프 = 드라이버·아이언).
- **콘텐츠만 바뀌면(seed.json) 자산 버전 bump 불필요** — `store.js`가 seed를 `?v=Date.now()`로 매번 새로 받으므로 어느 기기든 즉시 최신. (css/js/그림을 바꿀 때만 §3의 5곳 bump 필요.)
- **`추천운동` 카테고리**(2026-07-24 파생): 트레이너 추천 밸런스·둔근 기능성 모음 = **브릿지·버드독·데드버그·티밸런스·스텝업**(데드버그는 7/25에 일일 수행 → 이동, 브릿지는 7/30 추가). 전용 원칙 `pr_pt_recommended`. 향후 트레이너가 추천/선호한다고 강조한 운동은 이 카테고리로.
- **`가슴` 카테고리**(2026-07-30 신설): 플랫 벤치프레스 + 전용 원칙 `pr_pt_chest`. 프리웨이트 확대 국면이라 덤벨 종목이 여기 추가될 가능성 높음.
- **그림 확대 = 화면 전체 핀치줌**: `index.html` 뷰포트 `user-scalable=yes, maximum-scale=5`로 두 손가락 확대 허용(그림 포함 전체). ⚠️ 탭-투-확대 라이트박스도 만들어봤으나(`6276d2c`) **사용자가 "심플한 화면 전체 확대가 더 편하다"며 원복**(`b838788`) — 다시 라이트박스로 바꾸지 말 것.
- **이미지 커버리지**: 비골프 32동작 중 **27개**에 SVG(`docs/images/01~27`). 미보유 = 뒤꿈치 받침 스쿼트(사용자가 불필요라 함)·**골프 4종(이미지 대신 `steps` 키워드 스트립 사용 — 위 참조)**. 새 동작 추가 시 같은 스타일(라이트 패널 + 마네킹 라인/관절원 + amber glow + 핵심 라벨 2~3줄 + 우상단 배지)로 그리고 seed `image` + SW ASSETS 등록 + CACHE bump.
- **라벨 텍스트 크기**: 본문 라벨은 원본×1.3(≈15.6~17.5px). 제목·배지는 `font-weight="700"`로 구분해 미확대. 일괄 조정은 스크립트로(§8-1 참고).
- **칩 레이아웃**: 카테고리가 6개라 한 줄로는 모바일 폭을 넘어감 → `.chips`는 **`flex-wrap:wrap`(여러 행)**, 모바일에서 2행으로 전부 노출(가로 스크롤 없음). 칩 라벨의 `' · '`는 `<br>`로 렌더돼 2줄이 된다. ⚠️ 과거의 "한 줄 가로 스크롤" 방식은 **폐기됨** — 되돌리지 말 것.

### 검색 (`Store.search` + `renderSearch`)
- 검색 대상 = **이름·스펙·카테고리·focus(근육/움직임/느낌)·cues·reminders·steps·memo 전부**. 공백으로 여러 단어를 넣으면 **모두 포함(AND)**.
- 진입 경로: 홈 상단 검색바 + **PT/골프·즐겨찾기 화면 헤더의 🔍 버튼**(`.hd-search`, `data-act="search-focus"`).
- 결과에 **개수 + 파트·카테고리 라벨**을 표시(`exRow(e, null, true)`의 3번째 인자 `showCat`). 실시간 갱신은 `#search-results` innerHTML 교체.

### 하이브리드 저장 로직 (`store.js`)
- `getAll()` = seed + `localStorage` 오버레이(overrides/deleted) 병합.
- seed 항목 삭제 = deleted 마스크, 로컬 추가분 = overrides. **seed.json 편집이 "영구", 앱 내 편집은 기기 로컬.**
- ⚠️ **홈 화면 내보내기/가져오기(export/import) UI는 제거됨**(2026-07-25, 불필요). `Store.exportData/importData`는 코드에 남아 있으나 미사용 — 되살리지 말 것.

### 글자 크기
- `css` `body`에 `text-size-adjust:125%` — 크롬 등에서 작게 보이던 글자를 전체 균일 확대(카톡 웹뷰 크기 기준). 크기 조정은 이 값만 바꾸면 됨.

---

## 3. 배포 & 검증 워크플로 (그대로 따를 것)

🚨 **버전 번호는 5곳을 항상 함께 올린다**(자산 캐시버스팅). 하나라도 빠지면 일부 기기(특히 카톡 웹뷰)가 옛 파일을 물어온다:
1. `sw.js` — `const CACHE = 'ptgolf-vN'`
2. `index.html` — `css/style.css?v=N`
3. `index.html` — `js/store.js?v=N`
4. `index.html` — `js/app.js?v=N`
5. `js/app.js` — `const ASSET_VER = 'N'` (동작 그림 SVG src에 붙음)

한 번에 올리는 예:
```bash
cd "C:/APARK/PT_GOLF"
N=31   # 다음 번호
sed -i "s/ptgolf-v[0-9]*/ptgolf-v$N/" sw.js
sed -i "s/\(style\.css\|store\.js\|app\.js\)?v=[0-9]*/\1?v=$N/g" index.html
sed -i "s/const ASSET_VER = '[0-9]*'/const ASSET_VER = '$N'/" js/app.js
git config user.name "apark"; git config user.email "peoplenhpark@github.com"  # identity 없을 때만
git add -A && git commit -m "…내용… (SW v$N)"   # 한국어, 끝에 Co-Authored-By
git push origin main
```
- **왜 필요?** GitHub Pages는 정적이라 헤더 제어 불가 + 카톡/삼성인터넷 웹뷰가 하위 파일(css/js/그림)을 끈질기게 캐시함. URL에 `?v=N`을 박아 강제 재다운로드시킨다. (`data/seed.json`은 `store.js`가 `?v=Date.now()`로 이미 매번 새로 받음.)
- **자동 갱신**: `app.js` 부트에서 SW를 `{updateViaCache:'none'}`로 등록 + `controllerchange` 시 1회 자동 새로고침 → 실브라우저는 다음 열 때 자동 최신. **단 카톡 인앱 브라우저는 SW 미지원 → 외부 브라우저(Chrome) 권장.**

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
- **GitHub Actions/Pages 장애로 배포가 멈출 수 있음**(2026-08-06 실제 발생 — 30분+ 미반영). 진단 순서: ①`git ls-remote origin main`으로 push는 됐는지 ②`https://api.github.com/repos/peoplenhpark/PT-GOLF/deployments`로 **마지막 성공 배포 sha** 확인 ③`.../commits/<sha>/check-runs`에서 `cancelled`인지 ④`https://www.githubstatus.com/api/v2/summary.json`으로 Pages·Actions 상태 확인. **장애면 기다리는 게 유일한 해법**(재시도해도 계속 취소됨), 복구 후 **빈 커밋 push로 재트리거**하면 30초 내 반영. Pages 빌드 상태 API(`/pages/builds/latest`)는 인증 필요라 404.
- **기기별 구버전 표시(캐시)** — Pages 빌드가 수 분 지연되기도 하고, **카톡 인앱 브라우저/삼성인터넷은 하위 파일을 끈질기게 캐시**한다. 대응 = ①§3의 5곳 버전 동시 bump(자산 캐시버스팅) ②사용자에겐 "카톡 ⋮ → 다른 브라우저로 열기(Chrome)" 안내. 카톡 웹뷰는 서비스워커 미지원이라 자동 갱신이 안 됨.

---

## 5. 작업 이력 (시간순 · 커밋)

> 반복 패턴: 사용자가 **PT 녹취록(clovanote) .txt**를 주면 → 기존 동작 cues/reminders 보강 + 신규 동작(필요시 신규 카테고리·원칙) 추가 → seed `version`·`updated` 갱신 → SW bump → push → 라이브 검증. (7/7·7/10·7/14·7/16·7/21·7/24·7/28·7/30·8/6 동일 패턴)
>
> ⚠️ **녹취록에 앱 주인이 아닌 타 회원 레슨이 섞일 수 있음.** 7/24 후반부는 다른 회원(윤경)의 골프 레슨이 같은 녹음에 이어졌다 — 화자가 바뀌고("참석자 8"), 주인 세션 종료 인사("다음 주에 뵐게요") 이후 내용은 반영하지 말 것. 애매하면 사용자에게 확인.
>
> 🚨 **반영 전 필수: 중복 대조 (§8 참조).** 초기에 무지성 append로 한 동작에 같은 지시가 3겹씩 쌓이고 "살짝 쪼이기 vs 강하게 쪼기" 같은 **상충 지시**까지 생겨 `56ca395`에서 99→69로 정리해야 했다. 같은 실수를 반복하지 말 것.

| 커밋 | 내용 |
|---|---|
| `43be76a` | **일일수행2(하체 재활) 4동작** 반영: 쿼드셋·SLR·클램쉘·SSLR + 재활 공통원칙 `pr_pt_rehab`. exercise에 **`image` 필드 신설**, `renderDetail`에 그림 렌더, `.ex-figure` CSS, SW v9. `새 폴더/` gitignore. |
| `be556cc` | 원격 웹 업로드 2커밋과 **클린 머지**. |
| `346a64d` | PT 부위 칩(서브탭) **한 줄 가로 스크롤**(`flex-wrap:nowrap`+overflow, 스크롤바 숨김). SW v10. |
| `8c97494` | 긴 칩 **라벨 2줄** 표시(`' · '`→`<br>`), 칩 높이 균일(inline-flex+min-height), 알약→둥근사각(radius16). SW v11. |
| `5cfd796` | 재활 이미지 **스틱피규어→플랫 벡터 일러스트(SVG)** 4종 교체(관절 마네킹·근육 글로우·화살표·그림자·라이트패널). seed 이미지 `.png→.svg`(선명·경량), `.ex-figure` 이중프레임 제거. **동작 상세 3번째 행 카테고리 태그 클릭 시 해당 파트+카테고리로 바로 이동**(`data-catnav` 위임 핸들러 + `.tag.link`). SW v12. |
| `1155f8e` | 실사 이미지 생성 프롬프트 문서(`docs/PT재활_이미지_프롬프트.md`) 추가. |
| `b72125d` | **7/7 PT 보강 세션(녹취록)** 반영: 재활 4종·풀업·시티드로우·플랭크의 cues/reminders 보강. seed v6. |
| `3de4e2e` | 이 인수인계 문서(`docs/AGENT_HANDOFF.md`) 최초 작성. |
| `1f0f129` | **7/10 세션**: SLR 그림 수정(받치는 다리 무릎 접기·과신전 방지)·데드버그/쿼드셋 보강·신규 카테고리 **하체 · 머신** 3동작(레그컬·이너타이/어덕션·레그익스텐션)+원칙 `pr_pt_machine`. 🐛 **`getPrinciple` 버그 수정**(카테고리 전용이 `*`보다 우선 → 그동안 안 보이던 `pr_pt_rehab` 노출). seed v7, SW v14. |
| `a36828c` | **7/14 세션**: 신규(하체) **하프 스쿼트·프론트 스쿼트**(+케틀벨 대체) + **준비자세 이미지** `05_halfsquat`·`06_frontsquat`. 데드버그(골반 후방경사)·이너타이(늘리기·무릎힘·2초 유지) 보강. seed v8, SW v15. |
| `229d264` | **7/16 세션**: 풀업(spec 60→**55kg** 강도 상향·엉덩이 세트 내내 쪼기·팔꿈치 바닥으로 누르기)·시티드로우(전인→후인·바깥쪽으로 감아 팔꿈치 닫기) 보완. 신규 카테고리 **팔** + 암컬(바벨 컬) + 준비자세 `07_armcurl`. seed v9, SW v16. |
| `adbf87e` | 카테고리 칩 **가로 스크롤 → 여러 행 줄바꿈**(`flex-wrap:wrap`) + 칩 컴팩트화 — 6개 칩이 모바일 2행으로 전부 노출. SW v17. |
| `56ca395` | **동작 내 중복·유사 큐 통합 99→69**(30개 병합). 풀업의 "살짝 쪼이기↔강하게 쪼기" 등 상충 해소, 쿼드셋 버티기 시간 충돌 해소. 등 원칙 견갑 매핑 병합. 검증: 동작 내 Jaccard 0.20 유사쌍 0. seed v10, SW v18. |
| `25c6918` | **§8-0 규칙 명문화**(큐 추가 전 중복 대조 — **최신 우선**) + 핸드오프 v10 현행화. |
| `5f81765` | **7/21 세션**: 신규 원칙 **`pr_pt_lower`(하체 스쿼트 셋업 — 힙힌지·복압·발바닥 밸런스)**로 스쿼트류 공통을 원칙으로 묶어 동작별 중복 방지. 신규 동작 **뒤꿈치 받침 스쿼트(힐 엘리베이티드)**. 스쿼트·레그익스텐션·이너타이·하프스쿼트 보완(회복기 무게 5kg↓ 등). seed v11, SW v19. |
| `c760406` | **비골프 14개 동작 일러스트 추가**(08~21) — 이미지 커버리지 7→21동작. seed v12, SW v20. |
| `464fdf4`→`40228ba` | 일러스트 라벨 텍스트 확대(도형·제목·배지 유지) — 1.5배 시도 후 **원본×1.3로 확정**(사용자 피드백). SW v21→v22. |
| `993ed71` | **7/24 세션**: 신규 카테고리 **`추천운동`** 파생 + **버드독·티밸런스·스텝업**(일러스트 22~24) + 원칙 `pr_pt_recommended`. 코어 원칙에 "얕고 긴 호흡" 보완. 골프 파트(타 회원 레슨)는 제외. seed v13, SW v23. |
| `c531545` | 티밸런스 그림 지지다리 수직 교정 + **데드버그→추천운동** 이동 + 핀치줌(user-scalable=yes) 1차. seed v14, SW v24. |
| `6276d2c`→`b838788` | 탭-투-확대 라이트박스 추가 후 **사용자 요청으로 revert** — 화면 전체 핀치줌 유지. SW v26. |
| `97d9a00` | **SW 자동 갱신 강화** — `register(sw.js,{updateViaCache:'none'})` + `controllerchange` 시 1회 자동 새로고침. SW v27. |
| `eacab41` | **자산 캐시버스팅** — css/js/그림 URL에 `?v=N`(카톡 등 웹뷰 하위파일 캐시 대응). SW v28. |
| `bfd524c`→`f9e74aa` | **내보내기/가져오기 제거** + **글자 크기 확대**(`text-size-adjust` 118%→**125%**). SW v29→v30. |
| `596e943`→`6f4fec2` | **7/28 세션**: 하체 4종 핵심 보강(레그익스텐션·이너타이·뒤꿈치받침·**V-스쿼트=오늘 핵심**) + `pr_pt_lower`에 최우선 2가지(고관절 앞 접기+엉덩이 활용)·호흡 refinement / `pr_pt_machine` 호흡 갱신 + 레그익스텐션 호흡 큐. 골프·타인 대화 제외. seed v15, **SW bump 없음**(콘텐츠만 변경). |
| `a1c2274` | **골프 공통 4스텝**(준비 골반접기 → ①백스윙 ②왼쪽 체중이동 ③면 타격(드라이버=뒤에서 못 박듯) ④임팩트 확인)을 드라이버·아이언 4종 **cues 최상단**에 배치 + 공통 원칙의 옛 '스윙 순서' 항목 갱신. seed v17. |
| `d4d7bb5`→`0963670` | 골프 4스텝 **시퀀스 일러스트 추가 후 제거** — 사용자 요청으로 이미지 대신 **`steps` 키워드 스트립**(`.steps-flow`, 상세 최상단)으로 대체. seed v18→v19, SW v32→v33. |
| `6fbe822` | steps 문구 확정(4종 동일, ③에 면타격·못 박듯 통합) + `.steps-flow` **가로 스크롤 → 줄바꿈**으로 한 화면 노출. seed v20, SW v34. |
| `71cad2a` | **8/6 세션**: 상체 3종 보강 — 시티드로우(어깨 들림=과도하게 빼는 것·내 가동범위에서 끝내기, 승모근 개입은 정상, 전거근 스트레칭 안내)·**암풀다운 전면 갱신**(정식명 스트레이트 암 랫풀다운, ⭐팔 살짝 구부려 팔꿈치 힘 빼기, 힘 뺐다가 임팩트)·풀업(척추 중립 세팅·시선 고정·상방회전 컨트롤). seed **v21**, **SW bump 없음**(콘텐츠만). |
| `639a53e` | **골프 스윙 핵심 재구성**(사용자 제공 개념 반영) — 상단 체크리스트를 4스텝 → **준비+①~⑤ 5단계**로 확장. 신규 핵심 = **③지연(채가 수직 낙하할 때까지 기다렸다 몸통 회전)**, **④임팩트 시 좌우 팔은 저항**, ⑤임팩트 후 팔 곧게. steps 스트립·focus·`pr_golf_common`도 함께 갱신, 어깨 문구는 「왼쪽=허벅지 밖 X / 오른쪽=내려오지 않게」로 대체. seed **v23**(콘텐츠만, SW bump 없음). |
| `83f2c42` | **전 동작 `focus` 카드 추가**(🎯 근육/움직임/느낌 3줄) + 근육명 검색. seed **v22**, SW **v36**. |
| `ee5f9d7`·`cafa523` | GitHub Actions·Pages **장애로 배포 중단** → 복구 후 빈 커밋으로 재트리거해 반영(§4 참고). |
| `e467ea5` | **검색 강화** — 검색 범위에 reminders·steps 추가 + 다중 단어 AND, 결과에 개수·파트/카테고리 라벨, PT·골프·즐겨찾기 헤더에 🔍 진입 버튼(기존엔 홈에서만). SW **v35**. |
| `b567ba9` | **7/30 세션**: 신규 **브릿지**(추천운동·백로그 해소)·**오픈북**(일일수행)·**플랫 벤치프레스**(신규 카테고리 `가슴` + 원칙 `pr_pt_chest`), 일러스트 25~27. 버드독(배 중립·수직 세팅)·데드버그(좌우 밸런스)·티밸런스(**드는 다리 뒤꿈치 안 돌아가게**) 보강. seed v16, SW v31. |

### 기능적으로 추가된 것 (코드 위치)
- **참고 이미지:** `app.js` `renderDetail` 내 `e.image` 블록 + `css` `.ex-figure`. 현재 이미지 6종(재활 4 + 스쿼트 준비자세 2), 모두 손으로 작성한 플랫 벡터 SVG.
- **칩 서브탭 한 줄+2줄 라벨:** `app.js` chip 생성부(`' · '.split.join('<br>')`) + `css` `.chips`/`.chip`.
- **카테고리 태그 바로가기:** `app.js` 클릭 위임 셀렉터에 `[data-catnav]` 추가 + 핸들러(`view={name:'part',part,cat}` 후 `render()`), 태그 마크업 `data-catnav="part::category"`, `css` `.tag.link`.
- **원칙 매칭 버그 수정:** `store.js` `getPrinciple` — `filter(part)` 후 `카테고리 정확 매칭 → '*' 폴백`. 카테고리 전용 원칙이 배열 순서와 무관하게 우선.

---

## 6. 현재 열린 결정 / 스탠스 (되돌리지 말 것)

- **이미지 = 현행 간략화 SVG 일러스트 유지.** 실사(포토리얼) 시도는 **사용자 요청으로 보류**. 이유: 이 환경엔 실사 생성기가 없고, 저작권 스톡 무단 사용 불가. 재시도 시 **`docs/PT재활_이미지_프롬프트.md`**의 프롬프트로 사용자가 이미지 AI에서 생성 → 파일 받으면 WebP 압축·경로 교체·SW bump·배포. (사용자가 "실사 다시" 라고 하면 그때 진행.)
- **`reference/make_figs.py`는 옛 스틱피규어 생성기 → 현재 앱과 무관.** 지금 SVG는 손으로 작성한 것. 이미지 재생성 시 이 스크립트에 의존하지 말 것.
- **커밋/push = 정상 워크플로.** 이 리포는 개인 PWA이고 push가 곧 배포다. (⚠️ 사용자 메모리의 "원격 push 금지"는 **다른 저장소(주식/telegram_summary)** 한정 — PT-GOLF와 무관.)

---

## 7. 백로그 / 다음 후보 작업

우선순위 순:
1. **다음 세션 예고(미수행) — 나오면 추가**: ⓐ **덤벨 프레스**(7/30 "다음은 덤벨로" 예고 — `가슴` 카테고리로), ⓑ **장요근·요방형근·대퇴직근 스트레칭**(스쿼트 부드럽게), ⓒ **불가리안 스플릿 스쿼트**(한 발씩, 7/14·7/21·7/28 반복 언급). 실제 수행으로 나오면 추가. (버드독=7/24, **브릿지=7/30** 반영 완료.)
2. **세션(일일수행) 서브탭 계층** — 현재는 `category`를 서브탭으로 활용 중. 레슨이 늘면 세션 그룹 계층 도입 검토(CLAUDE.md §다음작업 2).
3. **편집 폼에 `image` 필드 노출** — 지금은 seed로만 이미지 지정 가능. 앱 내에서 그림 연결 UI가 필요하면 추가.
4. **실사 이미지**(보류) — 위 6 참조. 사용자 재요청 시.
5. **중복 정리(선택)** — 루트 `HANDOFF.md`(구버전)·루트 중복 PDF·`docs/images/01~04*.png`(옛 스틱, 현재 미참조). 삭제는 사용자 승인 필요.
6. `docs/HANDOFF.md` §12 미해결 질문(큐 체크 누적 여부, 편집/삭제 범위 등) 확인.

---

## 8. 콘텐츠·코딩 규칙 (요약)

### 🚨 8-0. 큐 추가 전 중복 대조 — **최신 우선(later wins)** [최우선 규칙]

녹취록을 반영할 때 **절대 무지성 append 금지.** 새 큐를 넣기 전에 그 동작의 기존 `cues`·`reminders`를 **전부 읽고 대조**한다.

판정과 처리:
| 상황 | 처리 |
|---|---|
| 같은 내용 반복 | 추가하지 말고 **기존 항목을 최신 표현으로 갱신** |
| 내용이 **상충**(예: "엉덩이 **살짝** 쪼이기" vs "세트 내내 **강하게** 쪼기") | ⭐**나중(최신) 녹취록 내용을 우선**해 기존 것을 **대체**한다. 옛 지시는 남기지 않는다 — 트레이너의 최신 코칭이 이전 지시를 갱신한 것이므로 |
| 수치가 다름(무게·횟수·시간) | **최신 수치로 갱신**(`spec` 포함). 필요하면 "최소 3초, 기본 10초×10"처럼 범위로 통합 |
| 같은 주제의 보강·심화 | 별도 줄로 늘리지 말고 **기존 줄에 병합**해 한 줄로 |
| 진짜 새로운 포인트 | 그때만 새 항목 추가 |

- `cues` ↔ `reminders` **사이의 중복도 확인**(같은 말이 양쪽에 있던 사례 다수).
- 통합 후 자가검증(동작 내 유사쌍 스캔):
```bash
PYTHONIOENCODING=utf-8 python - <<'PY'
import json,io,re,itertools
d=json.load(io.open('data/seed.json',encoding='utf-8'))
t=lambda s:set(w for w in re.sub(r'[^\w가-힣]',' ',s).split() if len(w)>1)
for e in d['exercises']:
    for a,b in itertools.combinations(e.get('cues',[])+e.get('reminders',[]),2):
        A,B=t(a),t(b); s=len(A&B)/len(A|B) if A and B else 0
        if s>=0.20: print(f"[{e['name']}] {s:.2f}\n  A:{a[:55]}\n  B:{b[:55]}\n")
PY
```
→ **0쌍이 목표.** 걸리면 병합 후 재실행.

### 8-1. 일반

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
[ ] ★녹취록 반영이면: 해당 동작의 기존 cues·reminders 먼저 정독 → 중복/상충 대조
    (§8-0) — append 금지, 상충 시 나중(최신) 내용 우선, 병합 후 유사쌍 스캔 0 확인
[ ] 자산(css/js/그림) 바꿨으면 버전 5곳 동시 bump: sw.js CACHE + index.html(css·store·app ?v=N) + app.js ASSET_VER (§3 sed 스니펫)
[ ] JSON이면 PYTHONIOENCODING=utf-8 python 으로 유효성 검사
[ ] git config user.* 없으면 지정 → commit(한국어) → push origin main
[ ] push 거부되면 fetch→merge origin/main→push
[ ] Invoke-WebRequest 로 라이브 URL 폴링 검증(로컬서버 불가)
[ ] 사용자에게 라이브 반영 결과 보고 + 자가평가(효과성/간결성)
```
