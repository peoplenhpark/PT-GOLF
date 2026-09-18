# PT & GOLF VER1.3 — 새 세션 핸드오프

## 최신 릴리스 작업 · 2026-09-18 · PT 프레스 2종 시각 자료 v67 (배포 승인)

- 사용자 상시 지침: 앞으로 신규PT는 준비·동작2컷과 회전·재생 가능한3D를 항상 함께 추가한다. `AGENTS.md` 및 `.cursor/rules/pt-media.mdc`에 영구 기록했다.
- 사용자 요청으로 덤벨 프레스(pt_dumbbell_press)와 인클라인 스미스 벤치프레스(pt_incline_smith_press)에 준비·동작2컷과 회전/재생형3D를 추가했다. 두 운동 모두 focus → 2컷 → 입체로 자세 보기 → 기존 코칭/메모 순서를 따른다.
- 내장 image_gen으로 은색 인체·붉은 가슴·차콜 배경의2컷을 생성하고4개WebP로 연결했다. 최종 경로와 프롬프트: `docs/visuals/pt-press-image-prompts.json`. 원본PNG는 ignored `docs/images/guides/source/`에 보존.
- `dumbbellpress`: 수평 벤치·각각의 덤벨·천천히 받아 살짝 모아 미는 궤적. `smithincline`: 경사 벤치·수직레일·바와 슬라이딩 칼라가 같이 움직이는 모델. 손목과 팔꿈치의 하단 수직 정렬, 발/골반/몸통 고정, 고정 관절 길이를 유지한다.
- 시각 자료는 예시이며 실제 수업의 각도·중량 재현은 아니다. 이 안내를2컷과3D에 표시했다. seed34/49운동/원문/날짜/개인 기록은 그대로다. 골프 이미지·3D 제거도 유지된다. PT45개 모두2컷+3D를 갖는다.
- 앱/SW/공통뷰어와 호환 주소를 v67로 맞췄다. 라이브는 직전 v66 커밋8d2834d77d625ecd55ece644c3456689f643e772, Pages35311294425 success이며 공개15파일·실제UI 검증 완료 상태다. 사용자가 후속 “배포해줘”로 v67 배포를 승인했다. main 정상 push 후 해당 Pages 실행 성공과 공개 파일/UI를 확인한다.
- 검증: `tests/pt-press-media.cjs` 2,002포즈의 관절길이/연속성/지지고정/덤벨분리/스미스레일/이미지형식/코칭일치 통과. 기존PT882포즈 및43개registry가 이전커밋과 동일, seed파일 불변. `tests/golf-training-data.cjs`의13원본/4그룹/골프3D제거/과거주소7경우 통과.
- CUA에서 실제3D준비·밀기자세, 시점전환, 느린재생/일시정지/슬라이더,2컷4장로딩,2운동×320/390/768px 가로넘침없음·iframe잘림없음·접을때제거·메모영역유지 확인. JS오류없음. 사용자기록에 테스트값을 저장하지 않았다.
- 미리보기: http://127.0.0.1:8792/index.html?v=67#exercise/pt_dumbbell_press 및 pt_incline_smith_press. 이 작업의 로컬서버는 기존 세션87868/8792를 재사용했다.


## 최신 릴리스 작업 · 2026-09-18 · v66 / seed34 (배포 승인)

- 배포: 2026-09-18 사용자 승인. 배포 전 골프 회귀·변경 JS 문법·diff 검사 통과, 원격 main과 동기화 확인. main 정상 push 후 해당 커밋의 Pages 성공 및 라이브 파일/UI를 확인한다. 아래 v65 배포 기록은 이전 릴리스 이력이다.
- 사용자 요청: 골프 전체의 3D 이미지 삭제, `새로운 노트 (18).txt`의 PT 추가·업데이트.
- 골프 유튜브 13편·네 그룹과 원본/편집 설명/개인 기록은 유지. 전역 카드·영상 상세·관련 자료에서 3D 옵션·안내를 제거했다.
- 골프 스윙 노트 4종은 정지 2컷과 회전형 3D 모두 화면에서 제거했다. 이 범위는 사용자에게 질문 후 응답이 없어 명시한 가정이다. 개인 overlay의 이미지도 화면에 노출하지 않으며 저장 데이터는 수정하지 않는다.
- 예전 golf3d viewer/lesson/consistency/training/original HTML 및 공통 PT viewer의 골프 주소는 원본 설명/해당 노트로 이동. 3D 모델·텍스처는 선캐시에서 제외했다. 소스·라이선스·과거 자산은 복구 자료로 남아 있으나 앱에서 로딩하지 않는다.
- PT 기존 43개 운동의 2컷/3D 유지. 풀오버·푸시다운 코칭과 캡션 보강, 신규 인클라인 스미스 벤치프레스/덤벨 프레스는 가슴 카테고리에 코칭으로 추가했다. 신규 두 운동은 아직 이미지·3D가 없다.
- 총49개(PT45+골프4), seed34, 앱/SW 자산66. 이전 라이브는 v65 / 7f633495854995b7b8d9c7bba4120534d7194f72이며 사용자가 후속 “배포해줘” 요청으로 이번 변경 전체의 배포를 승인했다.
- 녹취 근거와 수치 불확실성: `docs/PT_2026_09_18_UPDATE.md`. 푸시다운 상체 살짝 숙임은 확인됐지만 중량·손잡이·정확한 각도·세트 수는 여전히 미확인이다.
- 검증: `tests/golf-training-data.cjs`로13개 원본/4그룹/렌더링/캐시/과거 주소7경우/저장 호출0회 통과. 기존45개 운동 및 원칙 불변·메모/즐겨찾기 기본값 보존 확인. CUA390px에서 골프4종 이미지·3D0개, 기존 PT2종은2컷+3D 유지, 신규2종 코칭·9/18표시·가로넘침없음 확인. 풀오버3D 실제 로딩 확인. 개인 기록에 테스트 값을 저장하지 않음.
- `tests/visual-media.cjs`의 기대값은 골프/신규 PT의 이미지 없는 상태에 맞췄지만 전체 WebGL 재검사는 이번에 실행하지 않았다. 과거 golf-3d/golf-lesson/golf-player 등은 은퇴한 3D 구현의 이력용 검사다. 현재 골프 회귀 검사는 golf-training-data가 기준.


작성일: 2026-09-16. 이전 세션의 작업과 배포를 완료한 상태에서 새 사용자 요청을 받기 위한 시작 문서다. **새 작업 준비 외에 남은 구현·배포 요청은 없다.**

## 먼저 확인할 현재 상태

- 실제 저장소: `C:/APARK/PT_GOLF` (Git main). Codex의 작업 디렉터리 `C:/Users/peopl`과 다르므로 모든 저장소 명령에 workdir를 지정한다.
- Git 원격: `https://github.com/peoplenhpark/PT-GOLF.git`.
- 코드·라이브 버전: **v65**, 커밋 `7f633495854995b7b8d9c7bba4120534d7194f72`.
- GitHub Pages 배포 실행 `34941539155` 성공. URL: https://github.com/peoplenhpark/PT-GOLF/actions/runs/34941539155 .
- 대표 라이브: https://peoplenhpark.github.io/PT-GOLF/?v=65#golf/videos .
- 로컬 미리보기: http://127.0.0.1:8792/index.html?v=65#golf/videos . 서버가 중지됐으면 저장소에서 Python http.server를8792포트로 실행한다. 기존 서버가 있으면 중복 실행하지 않는다.
- seed v33, 운동47개(PT43+골프4). SW `ptgolf-v65`, app ASSET_VER65.
- 이번 핸드오프 작성 직전 `git status --short`는 비어 있었다. 현재 변경은 이 새 문서와 `docs/AGENT_HANDOFF.md`뿐이어야 한다. 사용자 변경이 추가되면 보존한다.
- **PT & GOLF VER1.3은 새 세션 이름**이다. 앱 v65, seed33, 브랜치명과 혼동하거나 임의로 변경하지 않는다.

## 사용자와 합의한 화면·콘텐츠 기준

1. 골프 탭 순서: **유튜브 → 레슨 → 스윙 노트**. 홈 골프 카드, 하단 골프 버튼, #golf 및 #golf/ 기본 진입은 유튜브다. 명시적인 레슨/노트 링크는 해당 화면을 연다.
2. 영상은 길이와 관계없이 항상 원본 전체를 볼 수 있다. 원본 버튼은 YouTube watch를 새 탭으로 연다.
3. 3분 이하(180초 포함)는 원본+편집 설명이 기본이다. 긴 영상의 전용 3D 레슨도 원본 링크를 유지한다. 길이 기준은 원본 접근을 제한하지 않는다.
4. 영상 목록·상세에 ‘실사형 3D로 보기’와 ‘원본 영상 보기’를 나란히 표시한다. 현재 원본13개, 3D옵션12개. **에이밍 셋업 3D는 사용자 요청으로 삭제되어 원본만 제공**한다. 되살리지 않는다.
5. 일반 3D는 공통 스윙 예시다. 영상 속 선수의 외형·동작 복원이 아니며 UI에서 구분한다. 두 전용60초 레슨은 영상의 설명을 교육용으로 재구성한 것이다.
6. 설명은 큰 굵은 글씨를 유지한다(주요 설명16.5px/700 이상, 대제목28.5px/800 등). 큰 글씨 요청을 임의로 되돌리지 않는다.
7. 개인 노트·메모·레슨을 보존한다. 영상에서 다른 교정 감각이 제시되면 기존 개인 노트를 덮어쓰지 않고 비교 질문/관련 영상으로 연결한다.

## 유튜브 하위 그룹과 원본 ID

각 영상은 주된 그룹 한 곳에만 들어가고 기존 주제 태그와 관련 영상 링크로 다른 주제를 연결한다.

- **프로 스윙 시범 · 2편** (`pro-swings`): `bfMsJtV61hM` 김민지5 프로(최상단 유지), `-h77kU-fpjg` 드라이버 시범.
- **준비·자세 · 2편** (`setup`): `UA-HYcmiKTA` 에이밍/셋업, `uvgnUl93Twg` 척추·골반 자세.
- **회전·체중이동 · 5편** (`rotation`): `xUgGGs2Rh3w` 오른쪽 어깨104초, `IsSS-GnQQyY` 어깨·임팩트611초, `ULOLFCC-ly8` 힘·타이밍92초, `CA-TZ7WQlHY` 체중이동166초, `0EgzSDUsKvg` 상하체 순서158초.
- **팔·임팩트 · 4편** (`arms-impact`): `Aj1UEMYPxBg` 오른팔 가속53초, `S3fxUFBzfBo` 팔/몸회전90초, `du58mmLNMnQ` 손목·회전566초, `RSbjGWhzEnQ` 팔 사용98초.

전체에서는 그룹별 제목과 영상을 표시한다. 상단 그룹 버튼/‘이 그룹만 보기’로 필터한다. 주소는 `#golf/group/<그룹ID>`이며 새로고침 유지. 영상 상세는 해당 그룹 복귀와 전체 보기 링크를 제공한다. 미분류 영상은 기타로 표시되어 사라지지 않지만 새 영상 추가 때 주된 그룹을 지정해야 한다.

## 주요 파일과 구현

- `js/golf-data.js`: 영상 원본 제목/채널/길이/설명/관찰 구간/연결, 180초 정책, modelOptionFor, videoGroups/videoGroupFor.
- `js/golf.js`: 그룹 목록·상세·개인 레슨·메모·관련 링크. 골프 개인 기록 키는 `ptgolf_learning_v1`. 읽기 오류 시 원본 데이터를 보호한다.
- `js/app.js`: 홈·탭·해시 진입 및 골프 호출, ASSET_VER. `css/golf.css`: 그룹과 보기 옵션 UI.
- `media/golf3d/viewer.html/js/css`: 드라이버·7번·5번·P아이언 공통 뷰어. 기존 `poses.js`, `motion.js`의 CMU64_01 실측 스윙 기반.
- `media/golf3d/player.js`, `player/`: Microsoft Rocketbox Male_Adult_01, MIT 라이선스. 텍스처/스키닝 모델 약2MB,80개 뼈. 원본은 특정 프로 선수가 아니다. LICENSE.md/SOURCE.json 유지.
- `media/golf3d/lesson.html/js`: du58 손목·임팩트60초 레슨. 전신 모델과 별도 손목 모형.
- `media/golf3d/consistency.html/js`: IsSS 어깨·임팩트60초 레슨, 실사형 골퍼 전신/상체/임팩트 확대.
- `media/golf3d/view-options.js`: 3D 화면의 원본 및 상세 복귀. 공통 뷰어의 source 쿼리는 알려진 영상 ID만 사용하며 전용 레슨의 원본은 고정.
- `media/golf3d/training.html`: 이전 링크 호환용 리다이렉트. 에이밍3D 재구현 아님.
- `media/golf3d/original.html/css/js`: v62 원본선수+동기화설명 샘플. 인앱 iframe이 빈 화면으로 남아 실제 동기화 재생을 검증하지 못했다. 타임아웃 후 원본 링크로 안내. 기본 진입에서는 v63부터 원본 직접 링크+3D 옵션으로 대체했다. 이 샘플을 완성된 선수3D나 검증된 임베드 재생으로 설명하지 않는다.
- `sw.js`: 같은 출처 앱 자산만 네트워크 우선/캐시 대체. 외부 YouTube 요청은 가로채지 않는다. skipWaiting/clients.claim과 앱 갱신 방식 유지.
- 장기 이력/전체 PT 기술 설명: `docs/AGENT_HANDOFF.md`. 그 안의 과거 미배포·영상개수 기록보다 이 문서의 현재 기준을 우선한다.

## 검증과 개발 환경

현재까지 확인한 것: 원본13개/3D12개, 네 그룹 분류2/2/5/4 중복·누락 없음, 유튜브 기본 진입, 390px 가로넘침 없음, 그룹필터·새로고침·상세복귀, 새 영상→실사형 모델→해당 원본 링크. v65 배포 후 공개11파일의 로컬 일치 및 실제 UI/모델 로딩, 오류로그 없음 확인. 플레이어 자체는 이전 v63에서4클럽×1,001포즈=4,004개 수치검증 완료.

- Node: `C:/Users/peopl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`.
- Python: `C:/Users/peopl/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`.
- 테스트: `tests/golf-training-data.cjs`는 영상/그룹/캐시 정책을 검사한다. 새 영상 추가 시 개수와 분류 기대값도 갱신한다.
- `tests/golf-player.cjs`는 Three 패키지 경로를 인수로 받는 수치검증. 경로: `C:/Users/peopl/Documents/PT-GOLF-samples/realistic-golfer/three-runtime/package`.
- `tests/golf-original.cjs`는 모의 YouTube API로 설명·반복·실패 처리만 검사한다. 실제 YouTube 재생 검증을 대신하지 않는다.
- 브라우저 UI는 현재 허용된 CUA 도구를 사용한다. 사용자 개인 기록을 테스트 값으로 변경하지 않는다. 순수 Node 검사와 `node --check`, `git diff --check`는 적절히 실행한다.
- 이 환경은 과거 기본 셸 샌드박스 래퍼가 실패해 명령에 require_escalated와 한국어 목적을 사용했다. 새 세션의 실제 권한 정책에 따른다. 토큰/자격증명을 출력하지 않는다.

## 배포와 다음 요청 처리

정적 사이트이며 main push로 GitHub Pages 배포된다. 배포 승인 시 검증 → 변경 파일만 stage → diff 검사 → 한국어 커밋 → 정상 push → 해당 커밋 Pages success → 라이브 파일/UI 확인까지 한다. 강제 push하지 않는다. 앱 변경 다음 자산 버전은66이지만 실제 파일을 먼저 확인한다. index 쿼리, app ASSET_VER, 골프 페이지/복귀 링크, SW CACHE/ASSETS를 함께 맞춘다. seed는 별개다.

이번 새 세션 준비는 추가 배포 승인이 아니다. 핸드오프를 읽고 저장소 상태를 확인한 뒤 준비됐음을 알리고 다음 사용자 요청을 기다린다. 확인 질문을 반복하거나 이미 완료된 작업을 다시 구현하지 않는다. 사용자 피드백이 새 작업 범위를 정한다.
