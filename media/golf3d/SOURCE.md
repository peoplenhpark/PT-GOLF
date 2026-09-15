# Golf motion provenance

- Source: [CMU Graphics Lab Motion Capture Database, subject 64, trial 01](https://mocap.cs.cmu.edu/search.php?subjectnumber=64).
- Original point data: [64_01.c3d](https://mocap.cs.cmu.edu/subjects/64/64_01.c3d), 120 Hz.
- Source SHA-256: `bfa60767b82a07a4494a988a0d35621187963c269e4a019d29fd1133cc065648`.
- Bundled clip: source frames 141–421 inclusive, 281 frames, 2.333 seconds. Stage selections reference this continuous timeline.
- Credit: Motion data from the CMU Graphics Lab Motion Capture Database, funded by NSF EIA-0196217.
- [Usage terms](https://mocap.cs.cmu.edu/): CMU permits the data's inclusion in products, including commercial products, but prohibits selling the motion data itself. This app uses the clip as an integrated illustration, with source attribution. No endorsement by CMU is implied.

## Processing

`tools/build_golf_mocap.py` reads this particular C3D file with NumPy. A proper coordinate rotation changes the source Z-up coordinates into Y-up coordinates with the target toward +X. It applies a five-sample noise filter and trims the idle lead-in and late settling motion. It retains measured body, head, foot and club marker trajectories. No YouTube video or user motion recording was used to generate this clip.

`motion.js` is generated data. Regenerate it with `python tools/build_golf_mocap.py /path/to/64_01.c3d`. The converter validates the source format and records its hash.

`poses.js` interpolates adjacent recorded samples with a cubic curve. Stage buttons do not change the trajectory or introduce pauses. To suppress apparent limb stretching from skin marker motion, elbows and knees use fixed lengths and the captured bend planes while wrist and foot endpoints retain their recorded paths. Hands are connected to the tracked club shaft. Head and shoe directions also come from markers.

The same captured swing is uniformly scaled for the four note views; club head geometry and tee display vary. These are **common swing illustrations**, not four separately measured club techniques or a reconstruction of the user's swing. They must not be presented as individualized coaching or motion analysis. Existing note and lesson content remains authoritative for personal corrections.

The renderer keeps the same camera framing while playing, pausing, scrubbing and selecting stages. Users can deliberately rotate and zoom. Playback offers the recorded tempo and slower views; it ends at the finish instead of blending backward into address.

## Validation

Run `tests/golf-3d.cjs` against a locally served checkout. It checks fixed limb lengths, hand/shaft attachment, continuity and nonzero velocities across stage boundaries, consistent camera framing, all four note mappings, mobile controls and offline loading. Screenshots and playback still require visual review; passing coordinate tests alone does not establish a natural-looking or technically ideal swing.


## 60초 임팩트 레슨 (v55)

- 원본: 조윤성프로, https://www.youtube.com/watch?v=du58mmLNMnQ . 2026-09-13 자막과 8:14 시범 화면 확인. 영상 파일·음성·인물 외형을 복제하지 않고 설명을 재구성.
- lesson.html/js/css: 60초 자막 + 7단계 + 전신/손목 시점. 전신은 위 CMU 공통 예시이며 해당 YouTube 인물의 캡처가 아니다. 손목은 별도의 교육용 절차적 모형이며 각도는 측정값이 아니다. 손가락은 한 그립을 감싸며 팔 길이는 고정된다.
- 원본 2:59 점진적 동작, 4:14 힌지, 8:14 실제 왼손목은 평평해도 된다는 설명을 반영. 과도한 보잉 각도를 강제하지 않는다.


## 이전 길이 기준 편집 레슨 (v56 · v57에서 3D 제거됨)

- UA-HYcmiKTA: 백현범프로[백점골프], 원본15:53(953초). 자동자막 전체를 확인해 에이밍·셋업 핵심을80초·8단계 3D 배치도로 재구성. 코스/궤적/티높이 비교는 설명용이며 수치 시뮬레이션이 아니다. https://www.youtube.com/watch?v=UA-HYcmiKTA
- CA-TZ7WQlHY: 심승룡 투어프로 [Nak Ta 골프], 원본2:46(166초). 쇼츠 링크지만2분 초과라60초·6단계 3D로 편집. 자동자막 전체와0:30 시범 화면 확인. https://www.youtube.com/watch?v=CA-TZ7WQlHY
- 원본 동영상 파일을 복제/다운로드하지 않았다. 원본·시점 링크·기존 YouTube 임베드는 별도로 유지한다. 체중이동의 전신은 기존 CMU64_01; 화살표·고리는 교육용 안내이고 발 압력·근력 측정값이 아니다.
- training-data.js는 원본 길이·출처 초·각 장면 세 가지 설명을 보관한다. 원본15:53 중 주된 에이밍과 티샷 셋업을 중심으로 요약하며 파3 세부 동작 전체를 복원한 것이 아니다.

## v57 원본 유지 기준 변경

원본 유지 기준은180초 이하(3분 포함). 에이밍은 사용자의 요청으로3D를 제거하고 원본과 편집 설명을 유지한다. 체중이동2:46도 원본으로 전환했다. training.js/css/data.js와 전신 강조 모드는 제거되었고 training.html은 이전 링크를 원본 자료로 연결하는 호환 페이지다. 손목·임팩트3D는 유지한다.


## v58 어깨·임팩트 / 힘·타이밍

- https://www.youtube.com/watch?v=IsSS-GnQQyY — 조윤성프로, 「일관성 있는 스윙 만드는 방법 [아내에게하는 골프레슨345]」. 2026-09-14 공개 플레이어611초 및 원본 자막 확인. 0:14 페이스 방향, 2:29 기울어진 축 회전, 3:05 골반·어깨 연결, 4:42 숙임 유지, 5:33 힌지와 얕은 통과, 8:00 어깨·팔꿈치,9:21 전체 연결을60초7단계로 재구성.
- consistency.html/js: 어깨 회전축 도식과 클럽페이스·지면 확대 모형은 절차적 교육용3D다. 각도·경로는 실측이 아니며 긴 구간의 페이스 고정, 손목 잠금, 몸통 옆굽힘, 강제 머리 고정 지시가 아니다. 전신은 기존 CMU64_01예시 그대로 사용.
- https://www.youtube.com/shorts/ULOLFCC-ly8 — 깡프로, 힘·타이밍. 공개 플레이어92초 및 자동자막 확인. 0:18 긴장 비교,0:36 중간 감각,0:44 전환 긴장 완화,1:00 과장 시범 설명,1:19 개인 리듬 찾기.3분 이하 원본+편집 설명으로 유지.0/5는 실제 근력 비율이 아니며 클럽을 놓거나 손목 구조를 무너뜨리는 지시가 아니다.
- 영상 파일·음성·인물 외형은 복제하지 않았다. 원본 YouTube 및 시점 링크, 클릭 시 임베드 연결을 유지한다.


## v60 일관성 레슨 표현 교체 (v58 별도 모형을 대체)

사용자 요청으로 consistency.html/js의 추상 어깨·클럽 모형을 제거했다. 모든 장면은 기존 CMU64_01 골퍼의 동일한 연속 동작을 사용한다. 상체 확대는 골퍼의 양쪽 어깨와 몸통 축을, 임팩트 확대는 골퍼·손·클럽헤드와 짧은 실측 헤드 궤적을 함께 보여준다. 모션 데이터 자체는 수정하지 않았다. 색상·축은 교육용 안내이며 영상 속 강사의 동작을 측정하거나 그대로 재현한 것이 아니다. 원본 출처·7단계60초 설명 및 시점 링크는 유지한다.


## v61 실사형 골퍼

- 인물: Microsoft Rocketbox `Male_Adult_01`, https://github.com/microsoft/Microsoft-Rocketbox/tree/master/Assets/Avatars/Adults/Male_Adult_01 . 공식 MIT 라이선스는 player/LICENSE.md에 포함. 특정 프로 선수의 외형이나 사용자의 아바타가 아니다.
- 원본 FBX는 Three.js0.160.1 FBXLoader로 변환. tools/build_golf_player.mjs가 모델 골격·스키닝 가중치·메시를 player.json/player.bin으로 내보낸다.80개 뼈,22,320개 비색인 정점(7,440삼각형). 원본 출처·SHA256는 player/SOURCE.json에 기록.
- 2K TGA 색상/노멀/알파 텍스처를 최대1024px WebP로 변환. 라이선스·메타데이터 포함 전체약2.0MB. 런타임은 추가 로더 라이브러리 없이 기존 Three.js SkinnedMesh/Skeleton을 사용한다.
- player.js는 기존 CMU64_01의 골반·척추·어깨·팔·발을 인물 골격에 맞춰 재지정한다. 텍스처가 있는 손과 손가락을 그립 형태로 굽히며, 손목은 기록된 손 위치 주변에서 연결한다. 인물 체형에 맞춘 재타기팅이므로 원본 인체 치수를 그대로 측정·재현한 것으로 표현하지 않는다.
- 기존 클럽·공·스윙 데이터는 유지. 네 클럽의 스윙 노트, 손목 레슨의 전신, 일관성 레슨의 모든 골퍼 장면에 공통 적용. 손목 원리의 별도 확대 모형은 보조 설명으로 유지.
- 검증 명령: `node tests/golf-player.cjs <three-0.160.1-package-directory>` .4,004개포즈×80개뼈의 유한 행렬·연속성 및 스킨 정점 샘플 검사. 최대 인접관절 이동0.0175m,회전0.0787rad미만,손목–그립거리0.062m미만.
