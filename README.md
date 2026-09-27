# PT & GOLF

운동 중 휴대폰에서 자세 큐·메모·레슨을 확인하는 개인용 정적 PWA입니다. PT는 준비·동작 이미지와 3D를, 골프는 원본 영상·개인 스윙 노트·레슨 기록을 제공합니다.

**현재 운영 기준과 사용자 결정은 [docs/CURRENT.md](docs/CURRENT.md)를 확인하세요.** 이전 HANDOFF 문서는 역사 자료입니다.

## 실행

```sh
python -m http.server 8792
```

`http://127.0.0.1:8792/`를 엽니다. 서버 없이 HTML 파일을 직접 여는 방식은 지원하지 않습니다.

## 데이터

기본 운동과 원칙은 `data/seed.json`, PT 미디어는 `js/exercise-media.js`, 골프 영상은 `js/golf-data.js`가 관리합니다. 개인 메모·즐겨찾기·편집·캘린더·골프 학습 기록은 사용 중인 기기에 저장됩니다. 백업 UI는 이전 사용자 요청으로 제거된 상태입니다.

## 변경 검증과 배포

```sh
npm ci
npm run release:prepare
npm run validate
npx playwright install chromium
npm run test:browser
npm run build:site
```

릴리스할 때 `release.json`의 버전만 수정한 뒤 `release:prepare`를 실행합니다. 생성된 버전 참조와 자산 목록을 수작업으로 수정하지 않습니다. 브라우저 검사 의존성은 lockfile에 고정되어 있습니다.

GitHub Pages Source를 **GitHub Actions**로 설정하면 저장소 워크플로가 검증 성공 후 `_site`만 배포합니다. 실패한 검사를 건너뛰어 배포하지 않습니다. 배포 파일에는 개발·인수인계 문서와 퇴역 골프 엔진이 포함되지 않습니다.

## 파일 역할

- `js/app.js`: 화면 구성과 UI 연결
- `js/store.js`: 기본 콘텐츠와 개인 운동 기록 병합
- `js/golf.js`: 골프 영상·스윙 노트·레슨 흐름
- `release.json` / `scripts/release.cjs`: 릴리스 버전과 자산 목록 생성
- `sw.js`: 앱 셸 캐시·선택 운동 오프라인 준비·안전한 업데이트
- `scripts/validate.cjs` / `tests/`: 현행 검증 게이트와 격리된 테스트
- `docs/CURRENT.md`: 단일 현재 운영 기준
