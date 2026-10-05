# 검사 범위

`npm run validate`는 현재 제품의 Node 검사와 문법·릴리스 일관성을 검사합니다. 개인 브라우저나 실제 사용자 저장소를 쓰지 않습니다. `npm run test:browser`는 별도 임시 브라우저 컨텍스트를 이용합니다.

## 현행 필수 검사

- 골프 개인 감각 원문·연습 저장 스키마 이전 버전 호환·52개 영상의 대표 이미지 104컷과 시점: `golf-practice.cjs`. `browser-smoke.cjs`는 감각 선택·클럽 선택·초안 복원·저장 실패 입력 보존·5구 기록 새로고침·기존 개인 필드 보존·이미지 게시·모바일 화면을 검사한다.

- HT 불가리안 스플릿 스쿼트 전용 포즈·고정 발/벤치 접촉·관절 길이 1,001프레임: `ht-bulgarian-pose.cjs`. 2컷·3D 조작·오프라인 재열기는 `browser-smoke.cjs`에 포함한다.

- HT 섹션·PT 기본 분류·PT/HT 양방향 연동·영상 검색·개인 기록 보존·숨김/복원·삭제 요청 게이트: `ht-training.cjs`. 실제 UI와 모바일·오프라인은 `browser-smoke.cjs`에서 함께 확인한다.

- 중앙 삭제 요청 파싱·사용자 승인과 원본 제거 동시 조건·GitHub 조회 실패 차단: `deletion-requests.cjs` (모의 API, 네트워크 호출 없음)

- 골프 영상 ID·그룹·앱 최초 등록일·최근 등록 정렬·영상 즐겨찾기·로컬 수정·렌더 및 과거 주소 연결: `golf-training-data.cjs`, `golf-usability.cjs`
- PT 이미지 등록·개인 코칭 자세·3D 자동 재생 및 느린 기본 속도: `pt-press-media.cjs`, `pt-*-pose.cjs`, `pt-viewer-defaults.cjs`
- SW 캐시 범위·데이터 키·실패 폴백·선택 운동 준비·업데이트: `service-worker.cjs`
- 추가 저장 계층/앱 상태 Node 검사는 `scripts/validate.cjs`에서 자동 탐색한다.
- 모바일 화면·최근 등록일 표시·영상 즐겨찾기/수정/복원·뒤로/앞으로·새 설치/오프라인 등 브라우저 회귀: `browser-smoke.cjs`

## 역사·선택 검사

- `golf-3d.cjs`, `golf-lesson.cjs`, `golf-original.cjs`, `golf-player.cjs`: 현재 제거된 골프 3D/재생 엔진에 대한 과거 검사. 현재 배포 게이트에서 제외한다.
- `golf-hub.cjs`: v52의 영상 수·UI를 가정한 과거 브라우저 검사. 해당 파일이 현행 골프 UI를 보증한다고 해석하지 않는다. 현행 경로는 `browser-smoke.cjs`가 담당한다.
- `visual-media.cjs`: PT 전수 시각 검사 도구. 이미지 로딩, 3D 자동 재생·느린 기본 속도, 터치 회전·확대와 오프라인 재열기를 확인한다. 다량의 화면·산출물을 만들므로 기본 gate 대신 필요한 미디어 변경 시 별도로 사용한다.

현재 상태의 정답은 `docs/CURRENT.md`이다. 고정된 과거 영상 수나 제거된 기능을 맞추기 위해 제품을 되돌리지 않는다.

- `ht-media-collection.cjs`: 복합 HT 영상의 6개 동작 + 하체 1개, 7007프레임 관절·지지점·동작 및 전체 이미지 오프라인 포함을 검사한다. `browser-smoke.cjs`는 동작 전환 시 메모 초안/기존 iframe, 3종 모바일 폭, 각 동작의 온라인/오프라인 이미지·3D를 검사한다.
