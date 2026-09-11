# 운동 시각 안내 — 2컷 + 회전형 3D

- 적용 범위: seed v33의 47개 운동(PT43, 골프4). 케이블 푸시다운 표준을 다른46개에 확장.
- 화면: 준비/동작 2컷 → **입체로 자세 보기** → 기존 움직임·느낌 → 핵심 체크·잊지 말 것·공통 원칙 → 내 메모.
- 이미지 확대 안내나 3D 소개 부제는 넣지 않는다. 브라우저 기본 핀치 확대를 유지한다.
- 운동 데이터와 갱신일은 변경하지 않는다. 시각 자료는 `js/exercise-media.js`가 연결한다.
- 사용자 추가 운동은 기존 상세 표시로 동작하며, 별도 미디어 등록 후 같은 형식으로 확장할 수 있다.

## 파일과 제작
- 46개 새 2컷: `docs/images/guides/<exercise-id>-start.webp`, `-end.webp`.
- 기존 케이블 푸시다운: `samples/pushdown-3d/combined-start.png`, `combined-end.png`.
- 원본 생성본은 `docs/images/guides/source/`에 로컬 보관(git 제외), 배포에는 최적화한 WebP만 사용.
- **내장 image_gen 도구**로 운동별 한 장씩 생성. CLI/API 유료 우회 경로는 사용하지 않았다.
- 초기 전체 프롬프트: [exercise-image-prompts.json](exercise-image-prompts.json).
- 기계적인 패널 분리·WebP 압축은 Sharp. 레그 프레스 생성본은 좌/우 동작 순서가 반대라 [panel-order.json](panel-order.json)에 기록한 순서로 분리한다.
- 교정: 백 익스텐션은 두 컷 모두 척추를 일자로 유지하고 팔만 당기는 등척성 변형, 레터럴 레이즈는 양팔이 모두 어깨 높이까지 보이도록 수정.
- 일부 재생성본은 회색 운동복 위 붉은 표시로 타깃 근육 위치를 표현한다. 회색 인체·차콜 배경·붉은 타깃이라는 공통 구성을 유지한다.
- 글자를 이미지 안에 굽지 않고 원문 기반 네이티브 텍스트로 표시하여 확대와 가독성을 유지한다.
- 기존 SVG는 삭제하지 않는다. 과거 그림의 숫자나 표현이 최신 코칭과 다르면 최신 seed의 내용이 우선한다.

## 3D
- `media/3d/poses.js`: 운동별 관절 위치, 동작 단계, 기구. 순수 JS라 WebGL 없이 좌표 검증 가능.
- `media/3d/viewer.js`: 은색 인체와 붉은 근육 위치, 기구, 카메라, 재생·일시정지·슬라이더.
- `media/3d/viewer.html?exercise=<id>&v=48`: 공통 뷰어. 푸시다운은 기존 전용 뷰어를 유지.
- Three.js는 기존 로컬 배포본을 공유하며 MIT 라이선스는 `samples/pushdown-3d/THREE-LICENSE.txt`.
- 회전: 드래그/한 손가락, 확대: 휠/두 손가락, 시점: 앞·옆·뒤, 속도: 보통/느리게.
- 열 때 iframe 생성, 접거나 상세를 나가면 제거. 높이 메시지는 origin과 source를 검증한다.
- 기구는 필요하면 감춰 가려지는 관절을 확인할 수 있다.
- 개인 코칭 반영: 데드버그 약40% 범위, SLR 반대 무릎 세우기, 풀오버 무릎 당겨 고정, 티밸런스 지지·뒷다리 펴기, 벤치 이상근 스트레칭, 원레그 익스텐션, 수직 궤적 암컬, 발판에 다리 올리는 해머 로우.
- 골프는 오른손잡이 예시. 백스윙→체중이동/손 내리기→지연→임팩트→마무리 순서. 클럽별 길이와 스탠스를 구분한다.
- 모델은 동작 관찰용 단순화 인체이며, 특정 사용자의 신체 치수나 실제 기구 제조사 치수를 복제하지 않는다.

## 검증과 갱신
- `tests/visual-media.cjs`: 47개 상세, 원문 전부, 이미지94개, 모델47개, 회전/열기/접기, 개인 메모·즐겨찾기·개별 큐 보존, 메모 저장/재접속, 모바일 폭, 방문한 운동 오프라인 확인.
- 실행: Node + Playwright 설치 후 정적 서버를 열고 `node tests/visual-media.cjs`. 서버 기본값은 http://127.0.0.1:8792/이며 `PTGOLF_BASE_URL`로 변경 가능.
- 생성 이미지가 다 준비되기 전에는 `SKIP_IMAGE_CHECK=1`로 동작·내용만 검증할 수 있다. 최종 검증에서는 반드시 해제한다.
- `SCREENSHOT_DIR`를 지정하면 모든 운동의 3D 뷰포트 스크린샷을 저장한다.
- 최종 결과: [verification.json](verification.json). 좌표 이상 목록: [pose-check.json](pose-check.json).
- 자산 버전48: index의 CSS/Store/App/ExerciseMedia, App의 ASSET_VER, SW CACHE, 공통 뷰어 내부 스크립트 버전을 함께 갱신.
- SW는 셸/뷰어/라이브러리를 선캐시하고 큰 운동 이미지는 방문 시 캐시한다. 처음 보려는 운동 이미지는 네트워크가 필요하다. 쿼리 버전이 바뀌어도 오프라인 셸/seed가 캐시로 복구되도록 했다.

## 근거
개인 동작의 우선 근거는 현재 seed v33의 준비·큐·리마인더·focus다. 일반 관절 움직임과 운동 분류는 [ACE 운동 라이브러리](https://www.acefitness.org/resources/everyone/exercise-library/) 및 [NASM 버드독](https://www.nasm.org/resource-center/exercise-library/bird-dog), 기존 [ACE 트라이셉스 프레스다운](https://www.acefitness.org/resources/everyone/exercise-library/3/triceps-pressdown/) 자료를 참고했다. 이것을 개인 자세의 임상 검증이나 인증으로 해석하지 않는다.
