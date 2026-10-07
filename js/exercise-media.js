/* Exercise preparation/action images and interactive pose registry. */
window.ExerciseMedia = {
  "pt_pullup": {
    "name": "풀업",
    "kind": "pullup",
    "captions": [
      "매달려 등 늘리기",
      "가슴부터 당겨 올라가기"
    ],
    "notes": [
      "언더 그립 위주 — 등/어깨 안정 + 등이 더 길게 늘어나 느끼기 쉽다(오버가 더 어렵다). 새끼·약지에 힘이 걸리도록 약간 감아 잡기",
      "내려갈 때 뒤 겨드랑이가 길게 늘어나는 느낌 — 이걸 먼저 느끼는 게 핵심"
    ],
    "focus": {
      "muscle": "광배근·대원근 (등 전체) + 견갑 거상·하강",
      "move": "팔꿈치를 바닥으로 눌러 내리며 가슴이 먼저 올라간다 (팔이 아니라 등으로 끌기)",
      "feel": "내려갈 때 뒤 겨드랑이가 길게 늘어나는 느낌 — 이걸 먼저 느끼는 게 핵심"
    },
    "target": "back",
    "images": [
      "docs/images/guides/pt_pullup-start.webp",
      "docs/images/guides/pt_pullup-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_pullup"
  },
  "pt_seatedrow": {
    "name": "시티드로우",
    "kind": "row",
    "captions": [
      "날개뼈를 앞으로",
      "명치 들며 뒤로 당기기"
    ],
    "notes": [
      "그립 3종: 오버(윗등·바깥쪽) / 뉴트럴(중간) / 언더(아래·옆구리 붙게) — 오버 위주(상부가 살면 하부는 따라온다), 팔꿈치는 그립 결 방향 그대로 빠져나오게",
      "등이 달려 나갔다 접히는 느낌 / 오버는 승모근 개입도 정상"
    ],
    "focus": {
      "muscle": "등 상부(오버)~하부(언더) + 견갑 전인·후인",
      "move": "날개뼈를 앞으로 뽑았다가(전인) 명치 들며 접어 당긴다(후인)",
      "feel": "등이 달려 나갔다 접히는 느낌 / 오버는 승모근 개입도 정상"
    },
    "target": "back",
    "images": [
      "docs/images/guides/pt_seatedrow-start.webp",
      "docs/images/guides/pt_seatedrow-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_seatedrow"
  },
  "pt_latpulldown": {
    "name": "랫풀다운",
    "kind": "latpull",
    "captions": [
      "가슴 들고 위로 뻗기",
      "턱 아래까지만 당기기"
    ],
    "notes": [
      "⭐세팅 「3층 공사」 ① 까치발을 든다 — 발가락으로 골반을 잡아 흔들리지 않게 (1층 = 골반)",
      "턱걸이하듯 몸이 올라가는 느낌 · 손끝부터 옆구리까지 조여진다. 어깨가 뜨면 너무 내린 것"
    ],
    "focus": {
      "muscle": "광배근 + 척추 기준선 (트레이너는 「척추 운동」이라 부른다)",
      "move": "까치발 → 가슴을 먼저 세우기 → 뒤로 살짝 제끼기로 기준선을 만든 뒤, 좌우를 맞춰 팔꿈치를 안으로 넣어 턱 밑까지",
      "feel": "턱걸이하듯 몸이 올라가는 느낌 · 손끝부터 옆구리까지 조여진다. 어깨가 뜨면 너무 내린 것"
    },
    "visualNote": "현재 준비·동작 이미지와 3D는 기본 오버그립 자세 예시입니다. 손 위치별 자세·느낌은 위 비교 안내를 확인하세요.",
    "target": "back",
    "images": [
      "docs/images/guides/pt_latpulldown-start.webp",
      "docs/images/guides/pt_latpulldown-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_latpulldown"
  },
  "pt_armpulldown": {
    "name": "암풀다운 (스트레이트 암 랫풀다운)",
    "kind": "armpull",
    "captions": [
      "팔 살짝 굽혀 준비",
      "겨드랑이 조이며 내리기"
    ],
    "notes": [
      "그립 넓이 30~50cm / 척골(새끼·약지) 쪽으로 살짝 감아 잡되, 손목이 위아래로 꺾이지 않는 정도까지만(내리면 일자가 되게)",
      "막판에 겨드랑이가 강하게 조여지며 마찰되는 느낌"
    ],
    "focus": {
      "muscle": "광배근·대원근 (등 아래·겨드랑이)",
      "move": "팔을 살짝 구부린 채 큰 원을 그리며 아래로, 어깨도 같이 낮아진다",
      "feel": "막판에 겨드랑이가 강하게 조여지며 마찰되는 느낌"
    },
    "target": "back",
    "images": [
      "docs/images/guides/pt_armpulldown-start.webp",
      "docs/images/guides/pt_armpulldown-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_armpulldown"
  },
  "pt_dbpullover": {
    "name": "덤벨 풀오버",
    "kind": "pullover",
    "captions": [
      "무릎을 몸쪽에 고정",
      "겨드랑이 늘리며 넘기기"
    ],
    "notes": [
      "양손을 세모로 만들어 손바닥으로 받치고, 무릎과 골반을 고정한다",
      "어깨를 밀어 편 채 천천히 넘긴다 — 뒤에서도 덤벨 무게를 받치며 버틴다"
    ],
    "focus": {
      "muscle": "광배근·전거근·겨드랑이 라인 + 어깨·날개뼈 가동",
      "move": "골반을 고정하고 어깨를 밀어 편 채, 덤벨을 손바닥으로 받치며 천천히 머리 뒤로 넘겼다 명치까지",
      "feel": "뒤로 넘어가도 손바닥에 무게가 받쳐지고 겨드랑이가 길어지는 느낌"
    },
    "target": "chest",
    "images": [
      "docs/images/guides/pt_dbpullover-start.webp",
      "docs/images/guides/pt_dbpullover-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_dbpullover"
  },
  "pt_machinerow": {
    "name": "머신 로우 (해머 스트렝스)",
    "kind": "machinerow",
    "captions": [
      "가슴을 패드에 지지",
      "팔꿈치를 옆구리로"
    ],
    "notes": [
      "세팅: 손잡이가 심장 높이쯤 오도록 의자 높이 조절(3~4번) — 앞뒤 조절은 안 되니 높이만 맞춘다",
      "등에 무게가 얹히며 빨래 짜듯 쫀쫀한 느낌 — 어깨가 들리면 실패"
    ],
    "focus": {
      "muscle": "등 (광배·능형근·상부 등) + 겨드랑이 밑",
      "move": "골반·허리를 고정한 채 팔꿈치를 옆구리로 당긴다",
      "feel": "등에 무게가 얹히며 빨래 짜듯 쫀쫀한 느낌 — 어깨가 들리면 실패"
    },
    "target": "back",
    "images": [
      "docs/images/guides/pt_machinerow-start.webp",
      "docs/images/guides/pt_machinerow-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_machinerow"
  },
  "pt_seal_row": {
    "name": "씰 로우 (인클라인 가슴 지지 로우)",
    "kind": "sealrow",
    "captions": [
      "경사 벤치에 가슴 고정",
      "가슴을 붙인 채 팔꿈치 당기기"
    ],
    "notes": [
      "경사 벤치에 가슴을 붙이고 두 발로 바닥을 지지한 채 팔을 자연스럽게 늘어뜨린다",
      "몸통을 들지 않고 팔꿈치를 뒤로 보내 등 가운데를 좌우 고르게 조인다"
    ],
    "focus": {
      "muscle": "광배근·능형근·등 상부",
      "move": "경사 벤치에 가슴을 고정하고 팔꿈치를 뒤로 당겼다가 천천히 편다",
      "feel": "몸통은 패드에 고정되고 등 가운데가 좌우 고르게 조여지는 느낌"
    },
    "target": "back",
    "images": [
      "docs/images/guides/pt_seal_row-start.webp",
      "docs/images/guides/pt_seal_row-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_seal_row",
    "visualNote": "오늘 PT에서 확인한 경사 벤치 가슴 지지와 덤벨 한 개당 7kg을 반영한 자세 예시입니다. 정확한 벤치 각도는 미확인입니다."
  },
  "pt_backextension": {
    "name": "백 익스텐션 (맨몸 · 허리 세우기)",
    "kind": "backextension",
    "captions": [
      "힙힌지로 더 깊게 숙이기",
      "엉덩이로 몸 일자"
    ],
    "notes": [
      "턱을 살짝 당기고 시선은 바닥 — 목과 허리를 한 줄로 길게 둔다",
      "허리를 꺾지 말고 엉덩이를 조여 몸통을 일자까지만 든다"
    ],
    "focus": {
      "muscle": "둔근 + 햄스트링 + 척추기립근",
      "move": "엉덩이를 조여 몸통을 일자까지만 들고, 힙힌지로 천천히 내려간다",
      "feel": "엉덩이와 뒷벅지가 먼저 단단해지고 허리는 길게 버티는 느낌"
    },
    "target": "posterior",
    "images": [
      "docs/images/guides/pt_backextension-start.webp",
      "docs/images/guides/pt_backextension-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_backextension"
  },
  "pt_armcurl": {
    "name": "암컬 (바벨 컬)",
    "kind": "curl",
    "captions": [
      "가슴 들고 팔꿈치 붙이기",
      "이두로 끌어올리기"
    ],
    "notes": [
      "상완골(위 팔뚝)은 절대 움직이지 않게 고정 — 팔꿈치 위치 그대로",
      "원판이 수직으로 오르는 궤적 · 팔꿈치가 몸에서 떨어지면 반원이 된다"
    ],
    "focus": {
      "muscle": "이두 전체 (바깥쪽뿐 아니라 안쪽까지)",
      "move": "팔꿈치를 몸에 붙인 채 안으로 넣어 끌어올려 원판을 「일자」로 올린다",
      "feel": "원판이 수직으로 오르는 궤적 · 팔꿈치가 몸에서 떨어지면 반원이 된다"
    },
    "target": "biceps",
    "images": [
      "docs/images/guides/pt_armcurl-start.webp",
      "docs/images/guides/pt_armcurl-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_armcurl"
  },
  "pt_benchpress": {
    "name": "플랫 벤치프레스",
    "kind": "benchpress",
    "captions": [
      "날개뼈를 벤치에",
      "가슴으로 밀어내기"
    ],
    "notes": [
      "세팅: 날개뼈를 벤치에 제대로 박아 넣어 흉추를 열고, 엉덩이에 힘을 넣어 허리 뜨는 정도를 감지",
      "가슴이 늘어나며 어깨가 낮아지는 느낌 (어깨가 앞으로 빠지면 잘못된 것)"
    ],
    "focus": {
      "muscle": "대흉근 (가슴) + 흉추 신전",
      "move": "날개뼈를 벤치에 박은 채 가슴이 마중 나오듯 내렸다가 밀어낸다",
      "feel": "가슴이 늘어나며 어깨가 낮아지는 느낌 (어깨가 앞으로 빠지면 잘못된 것)"
    },
    "target": "chest",
    "images": [
      "docs/images/guides/pt_benchpress-start.webp",
      "docs/images/guides/pt_benchpress-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_benchpress"
  },
  "pt_chestpress": {
    "name": "체스트 프레스 (머신)",
    "kind": "chestpress",
    "captions": [
      "가슴 들고 손잡이 받기",
      "가슴을 유지하며 밀기"
    ],
    "notes": [
      "다리를 한 칸 위에 올려 걸고 고관절·허벅지를 살짝 눌러 ⭐흔들림이 없게 고정",
      "가슴이 계속 들려 있고 사각형으로 버틴 느낌 — 손목만 아프면 견착 실패"
    ],
    "focus": {
      "muscle": "대흉근 + 전면 어깨 · (전제) 흉추 신전",
      "move": "흉추로 가슴을 먼저 밀어낸 상태를 유지한 채, 큰 벽을 넓게 받아 밀어낸다",
      "feel": "가슴이 계속 들려 있고 사각형으로 버틴 느낌 — 손목만 아프면 견착 실패"
    },
    "target": "chest",
    "images": [
      "docs/images/guides/pt_chestpress-start.webp",
      "docs/images/guides/pt_chestpress-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_chestpress"
  },
  "pt_pecdeck": {
    "name": "펙덱 플라이 (가슴 모으기)",
    "kind": "pecdeck",
    "captions": [
      "팔을 옆으로 열기",
      "가슴부터 모아오기"
    ],
    "notes": [
      "손잡이를 잡고 ⭐손목을 살짝 닫아준다",
      "가슴 바깥쪽이 조이며 모이는 느낌 — 손으로 채면 실패"
    ],
    "focus": {
      "muscle": "대흉근 (+ 전면 어깨로 팔을 밀어놓은 상태)",
      "move": "팔을 밀어놓은 채, 가슴이 먼저 움직여 양팔을 앞으로 모아온다",
      "feel": "가슴 바깥쪽이 조이며 모이는 느낌 — 손으로 채면 실패"
    },
    "target": "chest",
    "images": [
      "docs/images/guides/pt_pecdeck-start.webp",
      "docs/images/guides/pt_pecdeck-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_pecdeck"
  },
  "pt_facepull": {
    "name": "페이스 풀 (Face Pull)",
    "kind": "facepull",
    "captions": [
      "몸을 안정시키고 팔 뻗기",
      "얼굴로 당기며 외회전"
    ],
    "notes": [
      "이름 그대로 「얼굴 쪽으로」 당긴다 — 높게, 얼굴로, 과감하게",
      "어깨 뒤가 「아몬드 모양」으로 잡히는 느낌 — 어깨만 쓰면 실패"
    ],
    "focus": {
      "muscle": "후면 어깨 + 외회전 근육(회전근개) · 등 상부",
      "move": "몸을 뒤로 매단 채 팔·등을 같이 들고, 팔꿈치를 바깥으로 밀며 얼굴로 당긴다",
      "feel": "어깨 뒤가 「아몬드 모양」으로 잡히는 느낌 — 어깨만 쓰면 실패"
    },
    "target": "shoulders",
    "images": [
      "docs/images/guides/pt_facepull-start.webp",
      "docs/images/guides/pt_facepull-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_facepull"
  },
  "pt_lateralraise": {
    "name": "사이드 레터럴 레이즈",
    "kind": "lateral",
    "captions": [
      "가볍게 들고 중심 잡기",
      "어깨 높이까지 펼치기"
    ],
    "notes": [
      "다리를 모으고(주먹 하나 간격) 엉덩이만 살짝 빼 중심을 앞으로 — 숙이는 게 아니라 「살짝 앉은」 느낌",
      "손끝으로 날아가는 느낌 · 1kg인데도 타는 느낌 — 반동이 들어가면 실패"
    ],
    "focus": {
      "muscle": "측면 어깨(삼각근 중간) + 날개뼈 동반 움직임",
      "move": "엉덩이만 살짝 뺀 자세에서 손끝이 멀어지듯 어깨 높이까지 올린다",
      "feel": "손끝으로 날아가는 느낌 · 1kg인데도 타는 느낌 — 반동이 들어가면 실패"
    },
    "target": "shoulders",
    "images": [
      "docs/images/guides/pt_lateralraise-start.webp",
      "docs/images/guides/pt_lateralraise-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_lateralraise"
  },
  "pt_uprightrow": {
    "name": "해머 스트렝스 아이소-레터럴 D.Y. 로우",
    "kind": "dyrow",
    "captions": [
      "가슴을 패드에 고정",
      "팔꿈치를 아래·뒤로 당기기"
    ],
    "notes": [
      "기울어진 시트·가슴 패드에 몸을 고정하고, 언더핸드 그립으로 손잡이를 잡아 팔을 위·앞으로 뻗는다",
      "몸통을 젖히지 않고 팔꿈치를 아래·뒤로 보내 윗배 쪽으로 당긴다"
    ],
    "focus": {
      "muscle": "광배근·대원근 중심의 등 + 능형근·이두 보조",
      "move": "가슴을 패드에 고정하고 팔꿈치를 위·앞에서 아래·뒤로 보내 손잡이를 윗배 쪽으로 당긴다",
      "feel": "몸통은 흔들리지 않고 겨드랑이 뒤쪽에서 등 아래 방향으로 조여드는 느낌"
    },
    "target": "back",
    "images": [
      "docs/images/guides/pt_uprightrow-start.webp",
      "docs/images/guides/pt_uprightrow-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_uprightrow",
    "visualNote": "첨부 사진과 제조사 설명에서 확인한 언더핸드 그립·머리 위 피벗·기울어진 시트와 가슴 패드·좌우 독립 레버를 반영한 예시입니다. 실제 사용 중량은 미확인입니다."
  },
  "pt_vsquat": {
    "name": "V-스쿼트",
    "kind": "vsquat",
    "captions": [
      "어깨 패드에 기대기",
      "고관절 접어 앉기"
    ],
    "notes": [
      "뒤로 기댄 상태에서 시작 (몸이 뒤로 기울어진 게 정상) / 명치 살짝 들고 발 어깨 넓이",
      "엉덩이(고관절 바깥)가 늘어나는 느낌 — 무릎이 아니라 고관절이 접히는 느낌"
    ],
    "focus": {
      "muscle": "대퇴사두 + 둔근 (엉덩이)",
      "move": "엉덩이를 뒤로 밀며 고관절을 접고, 뒤꿈치로 받아 밀어 올린다",
      "feel": "엉덩이(고관절 바깥)가 늘어나는 느낌 — 무릎이 아니라 고관절이 접히는 느낌"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_vsquat-start.webp",
      "docs/images/guides/pt_vsquat-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_vsquat"
  },
  "pt_squat": {
    "name": "스쿼트",
    "kind": "squat",
    "captions": [
      "힙힌지로 중심 잡기",
      "엉덩이로 앉기"
    ],
    "notes": [
      "발 어깨 넓이, 앞꿈치 15도 외회전 / 무릎 방향 = 발가락 방향 일치",
      "발볼에 무게가 실린 채 엉덩이로 앉았다 일어서는 느낌"
    ],
    "focus": {
      "muscle": "대퇴사두 + 둔근 · 발바닥 밸런스",
      "move": "힙힌지로 엉덩이를 살짝 빼고 무릎은 발가락 방향으로 앉는다",
      "feel": "발볼에 무게가 실린 채 엉덩이로 앉았다 일어서는 느낌"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_squat-start.webp",
      "docs/images/guides/pt_squat-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_squat"
  },
  "pt_halfsquat": {
    "name": "하프 스쿼트",
    "kind": "halfsquat",
    "captions": [
      "중립 자세로 준비",
      "절반 범위만 앉기"
    ],
    "notes": [
      "발 어깨 넓이, 발끝 살짝 바깥 / 발 폭은 뒤꿈치가 고관절을 살짝 넘어가는 정도(골반보다 조금 넓게)",
      "고관절이 접히며 엉덩이가 늘어나는 느낌 (무릎·허리 부담은 적게)"
    ],
    "focus": {
      "muscle": "대퇴사두 + 둔근 (가동범위 절반)",
      "move": "힙힌지 셋업 후 무릎 수직 정도까지만 앉았다 일어난다",
      "feel": "고관절이 접히며 엉덩이가 늘어나는 느낌 (무릎·허리 부담은 적게)"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_halfsquat-start.webp",
      "docs/images/guides/pt_halfsquat-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_halfsquat"
  },
  "pt_frontsquat": {
    "name": "프론트 스쿼트",
    "kind": "frontsquat",
    "captions": [
      "바벨을 앞에 얹기",
      "상체 세워 앉기"
    ],
    "notes": [
      "바벨을 앞쪽(쇄골·어깨 앞)에 올리고 팔꿈치를 살짝 올려 고정 (떨어지면 바벨이 흔들림)",
      "내려갈 때 배에 힘이 들어차는 느낌 + 허벅지 앞이 매끄럽게 눌림"
    ],
    "focus": {
      "muscle": "대퇴직근 (앞 허벅지 중간) + 코어",
      "move": "바벨을 앞에 얹어 상체를 세운 채 엉덩이로 내려간다",
      "feel": "내려갈 때 배에 힘이 들어차는 느낌 + 허벅지 앞이 매끄럽게 눌림"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_frontsquat-start.webp",
      "docs/images/guides/pt_frontsquat-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_frontsquat"
  },
  "pt_heelsquat": {
    "name": "뒤꿈치 받침 스쿼트 (힐 엘리베이티드)",
    "kind": "heelsquat",
    "captions": [
      "뒤꿈치를 받치고 준비",
      "엉덩이로 내려앉기"
    ],
    "notes": [
      "뒤꿈치만 살짝 원판에 받치기(발 전체 X) — 발목 각도를 올려 가동성 보완, 앞꿈치는 떨어지지 않게 붙여둔다",
      "앞 허벅지와 안쪽이 평소보다 깊이 눌리는 느낌"
    ],
    "focus": {
      "muscle": "대퇴직근·내전근 + 둔근 (발목 보완)",
      "move": "뒤꿈치를 받쳐 발목 각도를 올린 뒤 엉덩이로 깊게 앉는다",
      "feel": "앞 허벅지와 안쪽이 평소보다 깊이 눌리는 느낌"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_heelsquat-start.webp",
      "docs/images/guides/pt_heelsquat-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_heelsquat"
  },
  "pt_gobletsquat": {
    "name": "고블릿 스쿼트 (중량 앞으로)",
    "kind": "goblet",
    "captions": [
      "덤벨을 가슴 앞에",
      "등으로 버티며 앉기"
    ],
    "notes": [
      "덤벨을 가슴 앞에 세워 잡는다 — 중량이 앞에 있으므로 앞으로 쏠리는 힘이 생긴다",
      "앞허벅지 한 곳이 아니라 다리 전체·위쪽까지 · 발바닥에서 엉덩이가 올라오는 느낌"
    ],
    "focus": {
      "muscle": "둔근·대퇴 전체 + 버텨주는 등(척추기립근)",
      "move": "중량을 앞에 든 채 등으로 버티고, 중심은 앞·엉덩이만 뒤로 빼며 앉는다",
      "feel": "앞허벅지 한 곳이 아니라 다리 전체·위쪽까지 · 발바닥에서 엉덩이가 올라오는 느낌"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_gobletsquat-start.webp",
      "docs/images/guides/pt_gobletsquat-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_gobletsquat"
  },
  "pt_widesquat": {
    "name": "와이드 스쿼트 (내전근)",
    "kind": "widesquat",
    "captions": [
      "보폭·발끝 넓히기",
      "안쪽 허벅지로 받기"
    ],
    "notes": [
      "스쿼트와 같되 ⭐발끝과 보폭을 더 넓게 연다",
      "안쪽 허벅지가 「다리 찢기」 하듯 늘어나고 딱 걸리는 지점이 온다 — 뒤로 밀리면 실패"
    ],
    "focus": {
      "muscle": "내전근(안쪽 허벅지) — 둔근을 걸리게 해주는 짝",
      "move": "보폭·발끝을 넓히고 무릎을 발끝 방향으로 밀어주며, 내전근으로 잡으면서 내려간다",
      "feel": "안쪽 허벅지가 「다리 찢기」 하듯 늘어나고 딱 걸리는 지점이 온다 — 뒤로 밀리면 실패"
    },
    "target": "adductors",
    "images": [
      "docs/images/guides/pt_widesquat-start.webp",
      "docs/images/guides/pt_widesquat-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_widesquat"
  },
  "pt_dumbbell_rdl": {
    "name": "덤벨 루마니안 데드리프트 (양발·덤벨 1개)",
    "kind": "dbrdl",
    "captions": [
      "덤벨 1개를 턱밑 성배 그립으로 들기",
      "중앙선으로 내리며 힙힌지"
    ],
    "notes": [
      "양발로 선 뒤 덤벨 한 개를 세로로 두고 양손을 모아 성배처럼 잡아 턱밑까지 올린다",
      "턱밑의 덤벨을 몸의 중앙선으로 내리며 엉덩이를 뒤로 보내 뒤 허벅지의 늘어남을 찾는다"
    ],
    "focus": {
      "muscle": "둔근·햄스트링·척추기립근",
      "move": "덤벨 한 개를 턱밑에서 중앙선으로 내리며 양발을 고르게 누르고 엉덩이를 뒤로 보내 고관절을 접는다",
      "feel": "허리가 접히지 않은 채 엉덩이와 뒤 허벅지가 길게 늘어났다 단단히 서는 느낌"
    },
    "target": "posterior",
    "images": [
      "docs/images/guides/pt_dumbbell_rdl-start.webp",
      "docs/images/guides/pt_dumbbell_rdl-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_dumbbell_rdl",
    "visualNote": "오늘 PT에서 확인한 덤벨 1개·턱밑 성배 그립에서 중앙선으로 내리는 양발 힙힌지를 남자 모형으로 반영한 자세 예시입니다. 사용 중량은 미확인입니다."
  },
  "pt_legcurl": {
    "name": "레그 컬 (라잉 레그 컬)",
    "kind": "legcurl",
    "captions": [
      "엎드려 골반 고정",
      "뒤 허벅지로 접기"
    ],
    "notes": [
      "엎드려 발목 거치대에 아킬레스건을 잘 걸고, 앞쪽 발등 잡기",
      "뒤 허벅지가 짧아지며 조여지는 느낌 (반동 없이)"
    ],
    "focus": {
      "muscle": "햄스트링 (뒤 허벅지)",
      "move": "엎드려 거치대를 엉덩이에 붙이듯 무릎을 끝까지 접는다",
      "feel": "뒤 허벅지가 짧아지며 조여지는 느낌 (반동 없이)"
    },
    "target": "hamstrings",
    "images": [
      "docs/images/guides/pt_legcurl-start.webp",
      "docs/images/guides/pt_legcurl-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_legcurl"
  },
  "pt_adduction": {
    "name": "이너타이 (힙 어덕션 · 모으기)",
    "kind": "adduction",
    "captions": [
      "패드에 기대 다리 벌리기",
      "안쪽 허벅지로 모으기"
    ],
    "notes": [
      "목적은 내전근을 부드럽게 만드는 것 — 모으기보다 벌려 늘릴 때에 더 집중 (아플 정도까지는 X)",
      "벌릴 때 안쪽이 시원하게 늘어나고, 모은 지점에서 꽉 조이는 느낌"
    ],
    "focus": {
      "muscle": "내전근 (안쪽 허벅지)",
      "move": "다리를 넓게 벌려 늘렸다가 무릎 힘으로 모은다 (발 힘 X)",
      "feel": "벌릴 때 안쪽이 시원하게 늘어나고, 모은 지점에서 꽉 조이는 느낌"
    },
    "target": "adductors",
    "images": [
      "docs/images/guides/pt_adduction-start.webp",
      "docs/images/guides/pt_adduction-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_adduction"
  },
  "pt_legextension": {
    "name": "레그 익스텐션 (원레그)",
    "kind": "legextension",
    "captions": [
      "골반 잡고 앉기",
      "허벅지로 들어 펴기"
    ],
    "notes": [
      "⭐패드를 발등이 아니라 「발목」에 건다 — 발목과 발등이 같이 걸리는 위치가 정답",
      "골반에 힘이 딱 잡히고 마지막엔 무릎이 뜰 것 같은 느낌 — 무릎 관절이 아니라 허벅지 전체"
    ],
    "focus": {
      "muscle": "대퇴직근 — 허벅지 가운데, 골반까지 이어진 유일한 갈래",
      "move": "무릎을 앞으로 밀지 말고 골반 쪽으로 들어 올리면서 다리를 편다",
      "feel": "골반에 힘이 딱 잡히고 마지막엔 무릎이 뜰 것 같은 느낌 — 무릎 관절이 아니라 허벅지 전체"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_legextension-start.webp",
      "docs/images/guides/pt_legextension-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_legextension"
  },
  "pt_legpress": {
    "name": "레그 프레스 (와이드 스탠스)",
    "kind": "legpress",
    "captions": [
      "고관절 준비 후 넓게 딛기",
      "골반 고정 · 발바닥으로 밀기"
    ],
    "notes": [
      "고관절 오픈·클로즈와 와이드 사이드 런지로 먼저 준비한다",
      "골반이 뜨지 않는 범위에서 천천히 내리고, 무릎은 발끝 방향을 따라간다"
    ],
    "focus": {
      "muscle": "안쪽 허벅지(내전근) + 둔근 + 골반 안정",
      "move": "넓게 딛고 발바닥 전체로 밀며, 골반이 흔들리지 않는 범위에서 천천히 내렸다 민다",
      "feel": "안쪽 허벅지가 늘어나며 발바닥으로 고르게 미는 느낌 — 무릎이나 허리가 불편하면 범위를 줄인다"
    },
    "target": "adductors",
    "images": [
      "docs/images/guides/pt_legpress-start.webp",
      "docs/images/guides/pt_legpress-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_legpress"
  },
  "pt_wide_sidelunge_stretch": {
    "name": "와이드 사이드 런지 스트레칭 (내전근)",
    "kind": "sidelunge",
    "captions": [
      "반대 다리 먼저 길게 펴기",
      "지지 다리 굽혀 · 엉덩이 뒤로"
    ],
    "notes": [
      "반대쪽 다리를 먼저 길게 펴고 발바닥을 바닥에 붙여 고정한다",
      "그다음 지지 다리에 앉듯 엉덩이를 뒤로 보내고, 안쪽 허벅지가 당기는 범위까지만 갔다가 돌아온다"
    ],
    "focus": {
      "muscle": "내전근(안쪽 허벅지) + 둔근",
      "move": "반대쪽 다리를 먼저 길게 편 뒤, 지지 다리에 앉듯 엉덩이를 뒤로 보내며 돌아온다",
      "feel": "편 다리의 안쪽 허벅지가 길게 늘어나는 느낌"
    },
    "target": "adductors",
    "images": [
      "docs/images/guides/pt_wide_sidelunge_stretch-start.webp",
      "docs/images/guides/pt_wide_sidelunge_stretch-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_wide_sidelunge_stretch"
  },
  "pt_hip_openclose_stretch": {
    "name": "고관절 오픈·클로즈 스트레칭",
    "kind": "hipopenclose",
    "captions": [
      "지지 다리 누르고 힙힌지",
      "반대 다리 길게 · 골반 열기"
    ],
    "notes": [
      "지지 발과 안쪽 허벅지로 바닥을 누른 채, 반대 다리를 뒤로 길게 뻗는다",
      "균형이 잡히면 골반·가슴을 천천히 열었다가 정면으로 닫는다"
    ],
    "focus": {
      "muscle": "고관절 주변 + 중둔근 + 지지 다리 내전근",
      "move": "지지물을 잡고 한 발 힙힌지로 반대 다리를 뒤로 뻗은 뒤, 골반·가슴을 천천히 열고 닫는다",
      "feel": "지지 발은 바닥을 누르고, 뒤로 뻗은 다리와 골반이 함께 길어지며 고관절이 부드럽게 열리는 느낌"
    },
    "target": "glutes",
    "images": [
      "docs/images/guides/pt_hip_openclose_stretch-start.webp",
      "docs/images/guides/pt_hip_openclose_stretch-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_hip_openclose_stretch"
  },
  "pt_daily_hamstring": {
    "name": "햄스트링 스트레칭",
    "kind": "hamstring",
    "captions": [
      "누워 수건으로 받치기",
      "편 다리를 당겨 늘리기"
    ],
    "notes": [
      "누워서 수건을 발에 걸고 다리 펴주기",
      "뒤 허벅지가 길게 늘어나는 느낌 (앞꿈치는 자연스럽게)"
    ],
    "focus": {
      "muscle": "햄스트링 (뒤 허벅지) 유연성",
      "move": "누워서 수건으로 다리를 편 채 당긴다",
      "feel": "뒤 허벅지가 길게 늘어나는 느낌 (앞꿈치는 자연스럽게)"
    },
    "target": "hamstrings",
    "images": [
      "docs/images/guides/pt_daily_hamstring-start.webp",
      "docs/images/guides/pt_daily_hamstring-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_daily_hamstring"
  },
  "pt_daily_piriformis": {
    "name": "이상근 스트레칭",
    "kind": "piriformis",
    "captions": [
      "앞다리를 벤치에 직각으로",
      "상체를 앞으로 눕히기"
    ],
    "notes": [
      "벤치·박스 위에 앞다리를 「직각」으로 접어 올리기 (정강이가 가로로 놓이게)",
      "엉덩이 깊은 곳이 강하게 늘어나는 느낌 — 20~30초 릴렉스하며"
    ],
    "focus": {
      "muscle": "이상근 (엉덩이 깊은 곳 · 좌골신경 통로)",
      "move": "앞다리를 벤치에 직각으로 걸고 뒷다리를 뺀 뒤 상체를 눕힌다",
      "feel": "엉덩이 깊은 곳이 강하게 늘어나는 느낌 — 20~30초 릴렉스하며"
    },
    "target": "glutes",
    "images": [
      "docs/images/guides/pt_daily_piriformis-start.webp",
      "docs/images/guides/pt_daily_piriformis-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_daily_piriformis"
  },
  "pt_plank": {
    "name": "플랭크",
    "kind": "plank",
    "captions": [
      "팔꿈치로 바닥 지지",
      "몸을 일직선으로 유지"
    ],
    "notes": [
      "어깨와 팔꿈치가 사각형을 이루게 팔꿈치로 지지",
      "배가 지속적으로 조여지는 느낌 (허리가 아니라 배가 일해야)"
    ],
    "focus": {
      "muscle": "복부 (코어) 전체",
      "move": "팔꿈치로 지지해 몸을 일직선으로 두고 배를 등에 붙인다",
      "feel": "배가 지속적으로 조여지는 느낌 (허리가 아니라 배가 일해야)"
    },
    "target": "core",
    "images": [
      "docs/images/guides/pt_plank-start.webp",
      "docs/images/guides/pt_plank-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_plank"
  },
  "pt_daily_foam": {
    "name": "폼롤러 이완",
    "kind": "foam",
    "captions": [
      "겨드랑이 아래에 롤러",
      "작은 범위로 천천히 이완"
    ],
    "notes": [
      "등 뒤 바깥: 겨드랑이 아래 광배근·대원근 라인 비비기 (10회씩)",
      "뭉친 곳이 풀리며 어깨·등이 가벼워지는 느낌"
    ],
    "focus": {
      "muscle": "광배근·대원근·소흉근 이완",
      "move": "폼롤러로 겨드랑이 아래 라인을 비벼 푼다",
      "feel": "뭉친 곳이 풀리며 어깨·등이 가벼워지는 느낌"
    },
    "target": "lats",
    "images": [
      "docs/images/guides/pt_daily_foam-start.webp",
      "docs/images/guides/pt_daily_foam-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_daily_foam"
  },
  "pt_openbook": {
    "name": "오픈북 (흉추 스트레칭)",
    "kind": "openbook",
    "captions": [
      "옆으로 누워 무릎 포개기",
      "팔·시선 함께 열기"
    ],
    "notes": [
      "옆으로 누워 무릎 굽히고 두 팔을 앞으로 나란히 뻗기",
      "날개뼈가 벌어지며 가슴 앞이 열리는 느낌 (팔만 돌리면 안 됨)"
    ],
    "focus": {
      "muscle": "흉추 회전 + 견갑 가동성",
      "move": "옆으로 누워 날개뼈를 열며 팔과 시선을 함께 돌린다",
      "feel": "날개뼈가 벌어지며 가슴 앞이 열리는 느낌 (팔만 돌리면 안 됨)"
    },
    "target": "core",
    "images": [
      "docs/images/guides/pt_openbook-start.webp",
      "docs/images/guides/pt_openbook-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_openbook"
  },
  "pt_rehab_quadset": {
    "name": "쿼드 셋 (Quad Set)",
    "kind": "quadset",
    "captions": [
      "무릎 아래 수건 받치기",
      "허벅지 조여 수건 누르기"
    ],
    "notes": [
      "무릎 아래 접힌 부위 살짝 아래에 수건 받치기",
      "허벅지 앞이 단단해지는 느낌 — 3초 이상 유지"
    ],
    "focus": {
      "muscle": "대퇴사두 (앞 허벅지) · 무릎 안정",
      "move": "수건을 무릎으로 눌러 허벅지에 힘을 주고 버틴다",
      "feel": "허벅지 앞이 단단해지는 느낌 — 3초 이상 유지"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_rehab_quadset-start.webp",
      "docs/images/guides/pt_rehab_quadset-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_rehab_quadset"
  },
  "pt_rehab_slr": {
    "name": "SLR (스트레이트 레그 레이즈)",
    "kind": "slr",
    "captions": [
      "반대 다리는 세워 고정",
      "편 다리만 천천히 들기"
    ],
    "notes": [
      "골반 바닥 고정 — 엉덩이가 들썩이지 않는 범위에서만 든다 (많이 올릴 필요 없음)",
      "무릎 위와 골반 앞이 당겨지는 느낌 (엉덩이는 뜨지 않게)"
    ],
    "focus": {
      "muscle": "대퇴사두 + 장요근 (골반 앞)",
      "move": "골반 고정한 채 편 다리를 천천히 들었다 내린다",
      "feel": "무릎 위와 골반 앞이 당겨지는 느낌 (엉덩이는 뜨지 않게)"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_rehab_slr-start.webp",
      "docs/images/guides/pt_rehab_slr-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_rehab_slr"
  },
  "pt_rehab_clamshell": {
    "name": "클램쉘 (Clamshell)",
    "kind": "clamshell",
    "captions": [
      "옆으로 누워 발 모으기",
      "발 붙인 채 무릎 열기"
    ],
    "notes": [
      "옆으로 누워 무릎을 90도로 세우고, 뒤꿈치는 딱 붙인 채 발 고정 — 발이 움직이지 않게 (앞꿈치는 들려도 됨)",
      "엉덩이 바깥이 조여지는 느낌 — 옛 좌골 통증 지점을 정확히 자극"
    ],
    "focus": {
      "muscle": "중둔근 (엉덩이 바깥)",
      "move": "발은 붙인 채 엉덩이 힘으로 무릎을 조개처럼 연다",
      "feel": "엉덩이 바깥이 조여지는 느낌 — 옛 좌골 통증 지점을 정확히 자극"
    },
    "target": "glutes",
    "images": [
      "docs/images/guides/pt_rehab_clamshell-start.webp",
      "docs/images/guides/pt_rehab_clamshell-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_rehab_clamshell"
  },
  "pt_rehab_sslr": {
    "name": "SSLR (사이드 스트레이트 레그 레이즈)",
    "kind": "sslr",
    "captions": [
      "몸과 위 다리를 일자로",
      "엉덩이 옆으로 들어올리기"
    ],
    "notes": [
      "옆으로 누워 몸을 완전히 일자로 — 목(경추)부터 발뒤꿈치까지 한 라인 유지, 몸을 더 옆으로 돌려서",
      "엉덩이 옆이 뻑뻑하게 조여지는 느낌 (허벅지 힘 아님)"
    ],
    "focus": {
      "muscle": "중둔근·대둔근 (엉덩이 옆)",
      "move": "몸을 일자로 두고 편 다리를 옆으로 들어 올린다",
      "feel": "엉덩이 옆이 뻑뻑하게 조여지는 느낌 (허벅지 힘 아님)"
    },
    "target": "glutes",
    "images": [
      "docs/images/guides/pt_rehab_sslr-start.webp",
      "docs/images/guides/pt_rehab_sslr-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_rehab_sslr"
  },
  "pt_bridge": {
    "name": "브릿지 (Bridge)",
    "kind": "bridge",
    "captions": [
      "누워 무릎 세우기",
      "엉덩이로 골반 밀기"
    ],
    "notes": [
      "누워서 다리를 넓게 — 뒤꿈치가 내 골반 라인에 오게, 앞꿈치는 살짝 팔자로 (무릎에 벌어지는 장력)",
      "힘은 전부 엉덩이에 — 허리는 뻐근한 정도까지만(뜨끔하면 중단)"
    ],
    "focus": {
      "muscle": "대둔근 (엉덩이) + 흉추 신전",
      "move": "엉덩이 → 가슴 → 엉덩이 순서로 밀어 올린다",
      "feel": "힘은 전부 엉덩이에 — 허리는 뻐근한 정도까지만(뜨끔하면 중단)"
    },
    "target": "glutes",
    "images": [
      "docs/images/guides/pt_bridge-start.webp",
      "docs/images/guides/pt_bridge-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_bridge"
  },
  "pt_birddog": {
    "name": "버드독 (Bird Dog)",
    "kind": "birddog",
    "captions": [
      "네 발로 중립 잡기",
      "반대 팔·다리 길게 뻗기"
    ],
    "notes": [
      "사족(무릎 꿇고 손 짚은) 자세에서 척추 중립 — 꺾이지도 말리지도 않게 (애매하면 살짝 말린 쪽이 낫다)",
      "배에 힘이 걸린 채 흔들림을 잡아내는 느낌 (허리는 꺾이지 않게)"
    ],
    "focus": {
      "muscle": "척추 기립근 + 코어 (중립 유지)",
      "move": "배 중립을 지킨 채 반대쪽 팔·다리를 길게 뻗는다",
      "feel": "배에 힘이 걸린 채 흔들림을 잡아내는 느낌 (허리는 꺾이지 않게)"
    },
    "target": "core",
    "images": [
      "docs/images/guides/pt_birddog-start.webp",
      "docs/images/guides/pt_birddog-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_birddog"
  },
  "pt_deadbug": {
    "name": "데드버그",
    "kind": "deadbug",
    "captions": [
      "허리를 바닥에 눌러 준비",
      "반대 팔·다리 반쯤만 뻗기"
    ],
    "notes": [
      "⭐가장 중요 — 팔·다리를 끝까지 펴지 마세요. 「반쯤」(약 40%)만 내려갔다 올라옵니다",
      "내내 배가 조인 느낌 — 허리와 바닥 사이가 뜨면 이미 범위 초과"
    ],
    "focus": {
      "muscle": "복부 (코어) · 척추 정렬",
      "move": "배를 조인 채 팔·다리를 「반쯤」(40%)만 천천히 뻗었다 돌아온다",
      "feel": "내내 배가 조인 느낌 — 허리와 바닥 사이가 뜨면 이미 범위 초과"
    },
    "target": "core",
    "images": [
      "docs/images/guides/pt_deadbug-start.webp",
      "docs/images/guides/pt_deadbug-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_deadbug"
  },
  "pt_tbalance": {
    "name": "티밸런스 (T-balance)",
    "kind": "tbalance",
    "captions": [
      "한 발로 중심 잡기",
      "팔·반대 다리 뒤로 길게"
    ],
    "notes": [
      "지지하는 발로 힙힌지 찍고 무게중심을 그 다리에 싣기 (손은 대각 앞쪽에 두면 밸런스에 도움)",
      "발가락과 바깥 엉덩이에 텐션이 계속 걸린 느낌"
    ],
    "focus": {
      "muscle": "중둔근·대둔근 + 발바닥",
      "move": "한 발로 힙힌지하며 반대 팔·다리를 뒤로 뻗는다",
      "feel": "발가락과 바깥 엉덩이에 텐션이 계속 걸린 느낌"
    },
    "target": "glutes",
    "images": [
      "docs/images/guides/pt_tbalance-start.webp",
      "docs/images/guides/pt_tbalance-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_tbalance"
  },
  "pt_stepup": {
    "name": "스텝업 (Step-up)",
    "kind": "stepup",
    "captions": [
      "한 발을 벤치 위에",
      "딛는 발로 밀어 올라가기"
    ],
    "notes": [
      "올라갈 때는 무조건 딛는 발 뒤꿈치로 밟아 올라간다 (발을 조금 더 앞으로)",
      "엉덩이가 접혔다 펴지며 강하게 쓰이는 느낌"
    ],
    "focus": {
      "muscle": "중둔근·대둔근 (엉덩이)",
      "move": "딛는 발 뒤꿈치로 밟아 올라가고 천천히 내려온다",
      "feel": "엉덩이가 접혔다 펴지며 강하게 쓰이는 느낌"
    },
    "target": "quads",
    "images": [
      "docs/images/guides/pt_stepup-start.webp",
      "docs/images/guides/pt_stepup-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_stepup"
  },
  "pt_tailbone_raise": {
    "name": "레그레이즈 (꼬리뼈 컨트롤)",
    "kind": "legraise",
    "captions": [
      "아랫배 누르고 다리 들기",
      "무릎 편 채 범위 조절"
    ],
    "notes": [
      "머리를 받치고 눕는다 — 목이 꺾이지 않을 정도의 수건·베개",
      "누르면 뜬다 · 아랫배가 조이며 떨린다 — 허리가 아프면 말아 올린 것"
    ],
    "focus": {
      "muscle": "하복근 — 손바닥이 얹히는 바로 그 자리",
      "move": "무릎을 편 채, 바닥을 강하게 눌러 시소처럼 다리가 저절로 떠오르게 한다",
      "feel": "누르면 뜬다 · 아랫배가 조이며 떨린다 — 허리가 아프면 말아 올린 것"
    },
    "target": "core",
    "images": [
      "docs/images/guides/pt_tailbone_raise-start.webp",
      "docs/images/guides/pt_tailbone_raise-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_tailbone_raise"
  },
  "pt_rotationlunge": {
    "name": "로테이션 런지 (로봇 런지)",
    "kind": "rotationlunge",
    "captions": [
      "앞발에 중심을 싣기",
      "살짝 돌며 뒤로 런지"
    ],
    "notes": [
      "덤벨(또는 맨몸)을 잡고 선다 — 손은 앞쪽에 둔다",
      "허벅지보다 엉덩이 자극이 강하게 — 축발이 땅에 박힌 느낌"
    ],
    "focus": {
      "muscle": "둔근(엉덩이) + 복사근·흉추 회전 (상·하지 분리)",
      "move": "돌리고 → 엉덩이 빼며 앉고 → 일어나 제자리 (로봇처럼 단계별로)",
      "feel": "허벅지보다 엉덩이 자극이 강하게 — 축발이 땅에 박힌 느낌"
    },
    "target": "glutes",
    "images": [
      "docs/images/guides/pt_rotationlunge-start.webp",
      "docs/images/guides/pt_rotationlunge-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_rotationlunge"
  },
  "pt_bosurotation": {
    "name": "보수 로테이션 (한 발 밸런스 회전)",
    "kind": "bosu",
    "captions": [
      "보수 위 한 발로 중심 잡기",
      "공을 돌린 뒤 앉기"
    ],
    "notes": [
      "공(볼)을 들고 먼저 중심부터 잡는다 — 손을 앞으로 밀면 앞발에 중심이 실린다",
      "엉덩이에 크게 · 발목·종아리 힘이 빠질수록 잘 되고 있는 것"
    ],
    "focus": {
      "muscle": "중둔근·뒷벅지 + 흉추 회전",
      "move": "공을 먼저 ∞ 모양으로 돌리고, 발바닥 전체로 과감하게 깊게 앉는다",
      "feel": "엉덩이에 크게 · 발목·종아리 힘이 빠질수록 잘 되고 있는 것"
    },
    "target": "glutes",
    "images": [
      "docs/images/guides/pt_bosurotation-start.webp",
      "docs/images/guides/pt_bosurotation-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_bosurotation"
  },
  "pt_sldl": {
    "name": "싱글 레그 데드리프트 (외발)",
    "kind": "sldl",
    "captions": [
      "한 발로 중심을 옮기기",
      "다리를 뒤로 빼며 힙힌지"
    ],
    "notes": [
      "덤벨을 잡고 선다 · 다리는 팔자 말고 ⭐11자로",
      "고관절이 접히며 엉덩이·뒷벅지에 · 올라오면 바짝 선 느낌"
    ],
    "focus": {
      "muscle": "중둔근·햄스트링 + 발바닥 균형 (고관절 힌지)",
      "move": "체중을 앞으로 옮긴 뒤 다리를 뒤로 빼며, 몸을 앞뒤로 길게 뽑아 접는다",
      "feel": "고관절이 접히며 엉덩이·뒷벅지에 · 올라오면 바짝 선 느낌"
    },
    "target": "glutes",
    "images": [
      "docs/images/guides/pt_sldl-start.webp",
      "docs/images/guides/pt_sldl-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_sldl"
  },
  "pt_pushdown": {
    "name": "케이블 푸시다운",
    "kind": "pushdown",
    "viewer": "samples/pushdown-3d/viewer.html",
    "images": [
      "samples/pushdown-3d/combined-start.png",
      "samples/pushdown-3d/combined-end.png"
    ]
  },
  "pt_dumbbell_press": {
    "name": "덤벨 프레스 (가슴)",
    "kind": "dumbbellpress",
    "captions": [
      "가슴을 들고 덤벨 받기",
      "양팔을 밀며 살짝 모으기"
    ],
    "notes": [
      "발과 골반을 고정하고, 가슴 옆에서 손목·팔꿈치로 덤벨을 받칩니다",
      "가슴 높이를 유지하며 밀고, 돌아올 때도 천천히 무게를 버팁니다"
    ],
    "focus": {
      "muscle": "대흉근 + 어깨·삼두 + 좌우 균형",
      "move": "가슴을 든 채 덤벨을 천천히 받아 내리고, 양팔을 앞으로 나란히 밀며 살짝 모은다",
      "feel": "아래에서도 가슴·어깨·팔이 무게를 함께 받치며 좌우 궤적이 일정한 느낌"
    },
    "target": "chest",
    "images": [
      "docs/images/guides/pt_dumbbell_press-start.webp",
      "docs/images/guides/pt_dumbbell_press-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_dumbbell_press",
    "visualNote": "수평 벤치에서의 동작 예시입니다. 실제 수업의 벤치 각도·중량을 재현한 것은 아닙니다."
  },
  "pt_incline_smith_press": {
    "name": "인클라인 스미스 벤치프레스",
    "kind": "smithincline",
    "captions": [
      "경사 벤치에서 바 받기",
      "가슴을 유지하며 밀기"
    ],
    "notes": [
      "가슴을 들고 손바닥·팔꿈치로 받칩니다. 바는 윗가슴에서 주먹 하나 정도 띄웁니다",
      "발과 골반은 고정한 채 바를 레일을 따라 밀고, 내려올 때 천천히 버팁니다"
    ],
    "focus": {
      "muscle": "윗가슴 + 어깨·삼두 + 골반을 잡는 하체",
      "move": "인클라인 벤치에서 가슴을 들고 손바닥·팔꿈치로 바를 수직으로 받았다가 밀어낸다",
      "feel": "가슴·어깨·팔이 넓게 무게를 함께 받치고, 가슴 높이가 유지되는 느낌"
    },
    "target": "chest",
    "images": [
      "docs/images/guides/pt_incline_smith_press-start.webp",
      "docs/images/guides/pt_incline_smith_press-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_incline_smith_press",
    "visualNote": "경사 벤치와 수직 레일의 동작 예시입니다. 실제 기구의 각도·중량은 수업에서 맞춘 세팅을 따릅니다."
  },
  "ht_bulgarian_split_squat": {
    "name": "불가리안 스플릿 스쿼트",
    "kind": "bulgariansplit",
    "captions": [
      "뒷발을 벤치에 올려 준비",
      "앞발을 고정하고 몸 낮추기"
    ],
    "notes": [
      "앞발은 바닥에, 뒷발 발등은 벤치에 지지한 준비 예시입니다. 몸에 맞는 간격을 먼저 확인합니다.",
      "앞쪽 무릎과 고관절을 굽히며 몸을 낮춥니다. 상체는 약간 기울이고 두 발의 지지 위치는 유지합니다."
    ],
    "focus": {
      "muscle": "둔근·대퇴사두 · 앞쪽 다리 지지",
      "move": "앞발을 바닥에 고정하고, 뒷발은 벤치에 지지한 채 천천히 내려갔다 올라옵니다.",
      "feel": "앞쪽 다리로 버티는 느낌과 균형을 확인합니다. 그림의 깊이를 그대로 맞추기보다 편안하게 조절합니다."
    },
    "target": "glutes",
    "visualNote": "이미지와 3D는 원본 영상의 동작을 설명하는 예시입니다. 벤치 높이·보폭·깊이·각도는 개인 수업 실측값이나 처방이 아닙니다.",
    "images": [
      "docs/images/guides/ht_bulgarian_split_squat-start.webp",
      "docs/images/guides/ht_bulgarian_split_squat-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=ht_bulgarian_split_squat"
  },
  "ht_wide_dumbbell": {
    "id": "ht_wide_dumbbell",
    "name": "와이드 덤벨 하체 운동",
    "kind": "sumodumbbell",
    "target": "glutes",
    "captions": [
      "넓게 서서 덤벨을 아래로",
      "무릎과 골반을 굽혀 낮추기"
    ],
    "notes": [
      "발을 넓게 두고 덤벨 하나를 양손으로 몸 아래에 잡은 예시입니다.",
      "발을 고정한 채 골반과 무릎을 굽힙니다. 영상의 하단 부분 반복은 원본과 따로 비교하세요."
    ],
    "focus": {
      "muscle": "둔근·허벅지",
      "move": "덤벨을 양다리 사이에 두고 골반과 무릎을 굽혔다가 천천히 올라옵니다.",
      "feel": "몸통과 지지 부위를 유지하며 편안한 범위에서 움직임을 확인합니다."
    },
    "visualNote": "동작 구조를 설명하는 예시입니다. 기구 높이·각도·가동 범위·중량은 개인 수업 실측값이나 처방이 아닙니다. 3D는 기본 하강·복귀 경로이며 영상의 하단 부분 반복 전체를 재현하지 않습니다.",
    "images": [
      "docs/images/guides/ht_wide_dumbbell-start.webp",
      "docs/images/guides/ht_wide_dumbbell-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=ht_wide_dumbbell"
  },
  "ht_upper_form": {
    "id": "ht_upper_form",
    "name": "상체 운동 자세 체크 · 6가지",
    "kind": "htlateral",
    "target": "shoulders",
    "captions": [
      "팔을 길게 내려 준비",
      "팔을 옆으로 들어 올리기"
    ],
    "notes": [
      "덤벨을 양옆에 들고 몸통을 안정시킵니다.",
      "팔꿈치를 가볍게 굽힌 상태로 팔을 옆으로 들어 올리는 예시입니다."
    ],
    "focus": {
      "muscle": "어깨",
      "move": "상체를 약간 기울인 채 팔을 옆으로 올렸다가 천천히 내립니다.",
      "feel": "몸통과 지지 부위를 유지하며 편안한 범위에서 움직임을 확인합니다."
    },
    "visualNote": "동작 구조를 설명하는 예시입니다. 기구 높이·각도·가동 범위·중량은 개인 수업 실측값이나 처방이 아닙니다. 2컷은 기존 PT의 같은 동작 기본 예시를 공유합니다. 영상의 교정 포인트는 위 설명과 원본에서 비교하세요.",
    "images": [
      "docs/images/guides/pt_lateralraise-start.webp",
      "docs/images/guides/pt_lateralraise-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=ht_upper_form",
    "variants": [
      {
        "id": "ht_upper_lateral",
        "name": "레터럴 레이즈",
        "kind": "htlateral",
        "target": "shoulders",
        "captions": [
          "팔을 길게 내려 준비",
          "팔을 옆으로 들어 올리기"
        ],
        "notes": [
          "덤벨을 양옆에 들고 몸통을 안정시킵니다.",
          "팔꿈치를 가볍게 굽힌 상태로 팔을 옆으로 들어 올리는 예시입니다."
        ],
        "focus": {
          "muscle": "어깨",
          "move": "상체를 약간 기울인 채 팔을 옆으로 올렸다가 천천히 내립니다.",
          "feel": "몸통과 지지 부위를 유지하며 편안한 범위에서 움직임을 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시입니다. 기구 높이·각도·가동 범위·중량은 개인 수업 실측값이나 처방이 아닙니다. 2컷은 기존 PT의 같은 동작 기본 예시를 공유합니다. 영상의 교정 포인트는 위 설명과 원본에서 비교하세요.",
        "images": [
          "docs/images/guides/pt_lateralraise-start.webp",
          "docs/images/guides/pt_lateralraise-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_form&variant=ht_upper_lateral"
      },
      {
        "id": "ht_upper_onearmrow",
        "name": "원암 덤벨 로우",
        "kind": "onearmrow",
        "target": "back",
        "captions": [
          "한 손·한 무릎으로 지지",
          "팔꿈치를 뒤로 당기기"
        ],
        "notes": [
          "한 손과 같은 쪽 무릎을 벤치에 지지하고 반대쪽 손에 덤벨을 듭니다.",
          "지지 자세를 유지하며 덤벨을 허리 옆으로 당기는 예시입니다."
        ],
        "focus": {
          "muscle": "등·견갑 주변",
          "move": "몸통을 유지하고 작업 쪽 팔꿈치를 뒤로 보내며 덤벨을 허리 옆으로 당깁니다.",
          "feel": "몸통과 지지 부위를 유지하며 편안한 범위에서 움직임을 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시입니다. 기구 높이·각도·가동 범위·중량은 개인 수업 실측값이나 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_upper_onearmrow-start.webp",
          "docs/images/guides/ht_upper_onearmrow-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_form&variant=ht_upper_onearmrow"
      },
      {
        "id": "ht_upper_preacher",
        "name": "프리처 컬",
        "kind": "preachercurl",
        "target": "biceps",
        "captions": [
          "위팔을 패드에 붙여 준비",
          "위팔을 유지하며 팔꿈치 굽히기"
        ],
        "notes": [
          "위팔을 경사진 패드에 지지하고 바를 아래로 내려 준비합니다.",
          "위팔을 패드에서 떼지 않고 팔꿈치를 굽혀 바를 올립니다."
        ],
        "focus": {
          "muscle": "상완이두",
          "move": "패드에 위팔을 지지한 상태에서 팔꿈치를 굽혔다 폅니다. 끝범위를 강제로 잠그지 않습니다.",
          "feel": "몸통과 지지 부위를 유지하며 편안한 범위에서 움직임을 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시입니다. 기구 높이·각도·가동 범위·중량은 개인 수업 실측값이나 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_upper_preacher-start.webp",
          "docs/images/guides/ht_upper_preacher-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_form&variant=ht_upper_preacher"
      },
      {
        "id": "ht_upper_latpull",
        "name": "랫풀다운",
        "kind": "htlatpull",
        "target": "back",
        "captions": [
          "앉아서 위쪽 바 잡기",
          "팔꿈치를 옆구리 방향으로"
        ],
        "notes": [
          "앉아서 허벅지를 고정하고 위쪽 바를 잡은 예시입니다.",
          "몸통을 유지하면서 팔꿈치를 아래로 내리는 경로를 확인합니다."
        ],
        "focus": {
          "muscle": "등·견갑 주변",
          "move": "위쪽 바를 잡고 팔꿈치를 옆구리 방향으로 내렸다가 천천히 돌아갑니다.",
          "feel": "몸통과 지지 부위를 유지하며 편안한 범위에서 움직임을 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시입니다. 기구 높이·각도·가동 범위·중량은 개인 수업 실측값이나 처방이 아닙니다. 2컷은 기존 PT의 같은 동작 기본 예시를 공유합니다. 영상의 교정 포인트는 위 설명과 원본에서 비교하세요.",
        "images": [
          "docs/images/guides/pt_latpulldown-start.webp",
          "docs/images/guides/pt_latpulldown-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_form&variant=ht_upper_latpull"
      },
      {
        "id": "ht_upper_lyingextension",
        "name": "라잉 트라이셉스 익스텐션",
        "kind": "lyingextension",
        "target": "triceps",
        "captions": [
          "누워 팔을 머리 쪽으로 기울이기",
          "위팔을 유지하고 팔꿈치 굽히기"
        ],
        "notes": [
          "벤치에 누워 발을 지지하고, 위팔을 머리 방향으로 약간 기울여 바를 듭니다.",
          "위팔을 유지하면서 팔꿈치를 굽혀 머리 뒤쪽으로 바를 낮추는 예시입니다."
        ],
        "focus": {
          "muscle": "상완삼두",
          "move": "위팔의 기울기를 유지하며 팔꿈치를 굽혔다 펴고 바가 머리에 닿지 않도록 여유를 둡니다.",
          "feel": "몸통과 지지 부위를 유지하며 편안한 범위에서 움직임을 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시입니다. 기구 높이·각도·가동 범위·중량은 개인 수업 실측값이나 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_upper_lyingextension-start.webp",
          "docs/images/guides/ht_upper_lyingextension-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_form&variant=ht_upper_lyingextension"
      },
      {
        "id": "ht_upper_facepull",
        "name": "페이스풀",
        "kind": "facepull",
        "target": "back",
        "captions": [
          "로프를 앞으로 잡기",
          "팔꿈치 높이를 유지하며 당기기"
        ],
        "notes": [
          "서서 케이블 로프를 앞으로 잡고 몸통을 안정시킵니다.",
          "팔꿈치를 어깨 부근 높이로 두고 로프를 얼굴 쪽으로 당깁니다."
        ],
        "focus": {
          "muscle": "등·견갑 주변",
          "move": "몸통을 유지하고 팔꿈치 높이를 확인하며 로프를 얼굴 쪽으로 당겼다가 돌아갑니다.",
          "feel": "몸통과 지지 부위를 유지하며 편안한 범위에서 움직임을 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시입니다. 기구 높이·각도·가동 범위·중량은 개인 수업 실측값이나 처방이 아닙니다. 2컷은 기존 PT의 같은 동작 기본 예시를 공유합니다. 영상의 교정 포인트는 위 설명과 원본에서 비교하세요.",
        "images": [
          "docs/images/guides/pt_facepull-start.webp",
          "docs/images/guides/pt_facepull-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_form&variant=ht_upper_facepull"
      }
    ]
  },
  "ht_lower_six": {
    "name": "하체 운동 시범 · 6가지",
    "kind": "legcurl",
    "target": "hamstrings",
    "captions": [
      "엎드려 골반과 허벅지 지지",
      "양 무릎을 굽혀 롤러 올리기"
    ],
    "notes": [
      "기구에 엎드려 하체를 지지하고 발목 위에 롤러를 둡니다.",
      "골반 지지를 유지하며 양 무릎을 굽혔다가 천천히 돌아옵니다."
    ],
    "focus": {
      "muscle": "허벅지 뒤쪽",
      "move": "골반 지지를 유지하며 양 무릎을 굽혔다가 천천히 돌아옵니다.",
      "feel": "지지 부위를 유지하고 편안한 범위에서 준비 자세와 동작 자세의 차이를 확인합니다."
    },
    "visualNote": "동작 구조를 설명하는 예시이며 기구 높이·보폭·깊이·중량은 개인 수업 실측값이나 처방이 아닙니다. 2컷은 기존 PT의 같은 동작 기본 예시를 공유합니다.",
    "images": [
      "docs/images/guides/pt_legcurl-start.webp",
      "docs/images/guides/pt_legcurl-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=ht_lower_six",
    "variants": [
      {
        "id": "ht_lower_curl",
        "name": "라잉 레그 컬",
        "kind": "legcurl",
        "target": "hamstrings",
        "captions": [
          "엎드려 골반과 허벅지 지지",
          "양 무릎을 굽혀 롤러 올리기"
        ],
        "notes": [
          "기구에 엎드려 하체를 지지하고 발목 위에 롤러를 둡니다.",
          "골반 지지를 유지하며 양 무릎을 굽혔다가 천천히 돌아옵니다."
        ],
        "focus": {
          "muscle": "허벅지 뒤쪽",
          "move": "골반 지지를 유지하며 양 무릎을 굽혔다가 천천히 돌아옵니다.",
          "feel": "지지 부위를 유지하고 편안한 범위에서 준비 자세와 동작 자세의 차이를 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시이며 기구 높이·보폭·깊이·중량은 개인 수업 실측값이나 처방이 아닙니다. 2컷은 기존 PT의 같은 동작 기본 예시를 공유합니다.",
        "images": [
          "docs/images/guides/pt_legcurl-start.webp",
          "docs/images/guides/pt_legcurl-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_lower_six&variant=ht_lower_curl"
      },
      {
        "id": "ht_lower_wide",
        "name": "와이드 고블릿 스쿼트",
        "kind": "htwidegoblet",
        "target": "quads",
        "captions": [
          "발을 넓히고 덤벨을 가슴 앞에",
          "같은 발 간격으로 내려앉기"
        ],
        "notes": [
          "발을 넓게 두고 덤벨 1개를 가슴 앞에 가로로 받칩니다.",
          "발바닥을 지지하며 무릎과 골반을 굽혔다가 일어납니다."
        ],
        "focus": {
          "muscle": "허벅지·둔근",
          "move": "발바닥을 지지하며 무릎과 골반을 굽혔다가 일어납니다.",
          "feel": "지지 부위를 유지하고 편안한 범위에서 준비 자세와 동작 자세의 차이를 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시이며 기구 높이·보폭·깊이·중량은 개인 수업 실측값이나 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_lower_wide-start.webp",
          "docs/images/guides/ht_lower_wide-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_lower_six&variant=ht_lower_wide"
      },
      {
        "id": "ht_lower_narrow",
        "name": "내로우 고블릿 스쿼트",
        "kind": "htnarrowgoblet",
        "target": "quads",
        "captions": [
          "발 간격을 좁혀 준비",
          "발 지지를 유지하며 내려앉기"
        ],
        "notes": [
          "발을 골반 너비 부근으로 두고 덤벨 1개를 가슴 앞에 잡습니다.",
          "같은 발 간격을 유지하면서 무릎과 골반을 굽혔다가 일어납니다."
        ],
        "focus": {
          "muscle": "허벅지 앞쪽·둔근",
          "move": "같은 발 간격을 유지하면서 무릎과 골반을 굽혔다가 일어납니다.",
          "feel": "지지 부위를 유지하고 편안한 범위에서 준비 자세와 동작 자세의 차이를 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시이며 기구 높이·보폭·깊이·중량은 개인 수업 실측값이나 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_lower_narrow-start.webp",
          "docs/images/guides/ht_lower_narrow-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_lower_six&variant=ht_lower_narrow"
      },
      {
        "id": "ht_lower_split",
        "name": "스플릿 스쿼트 · 바닥 지지",
        "kind": "htfloorsplit",
        "target": "quads",
        "captions": [
          "앞발과 뒷발 모두 바닥에",
          "양 무릎을 굽혀 낮아지기"
        ],
        "notes": [
          "앞발 전체와 뒷발 앞부분을 바닥에 지지하고 두 손은 골반에 둡니다.",
          "두 발 위치를 유지한 채 양 무릎을 굽혀 낮아졌다가 올라옵니다."
        ],
        "focus": {
          "muscle": "허벅지·둔근",
          "move": "두 발 위치를 유지한 채 양 무릎을 굽혀 낮아졌다가 올라옵니다.",
          "feel": "지지 부위를 유지하고 편안한 범위에서 준비 자세와 동작 자세의 차이를 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시이며 기구 높이·보폭·깊이·중량은 개인 수업 실측값이나 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_lower_split-start.webp",
          "docs/images/guides/ht_lower_split-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_lower_six&variant=ht_lower_split"
      },
      {
        "id": "ht_lower_stiff",
        "name": "덤벨 스티프레그 데드리프트",
        "kind": "htstiffdeadlift",
        "target": "hamstrings",
        "captions": [
          "덤벨 2개를 아래로 들기",
          "골반을 뒤로 접어 덤벨 낮추기"
        ],
        "notes": [
          "양손에 덤벨을 하나씩 들고 무릎을 부드럽게 둡니다.",
          "허리를 둥글게 말지 않고 골반을 뒤로 보내며 덤벨을 다리 가까이 낮춥니다."
        ],
        "focus": {
          "muscle": "허벅지 뒤쪽·둔근",
          "move": "허리를 둥글게 말지 않고 골반을 뒤로 보내며 덤벨을 다리 가까이 낮춥니다.",
          "feel": "지지 부위를 유지하고 편안한 범위에서 준비 자세와 동작 자세의 차이를 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시이며 기구 높이·보폭·깊이·중량은 개인 수업 실측값이나 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_lower_stiff-start.webp",
          "docs/images/guides/ht_lower_stiff-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_lower_six&variant=ht_lower_stiff"
      },
      {
        "id": "ht_lower_extension",
        "name": "레그 익스텐션 · 양발",
        "kind": "htlegextension",
        "target": "quads",
        "captions": [
          "등을 기대고 양 무릎 굽히기",
          "양 무릎을 함께 펴기"
        ],
        "notes": [
          "기구에 앉아 등과 허벅지를 지지하고 양쪽 정강이 아래에 롤러를 둡니다.",
          "허벅지와 골반을 지지한 채 양 무릎을 함께 폈다가 돌아옵니다."
        ],
        "focus": {
          "muscle": "허벅지 앞쪽",
          "move": "허벅지와 골반을 지지한 채 양 무릎을 함께 폈다가 돌아옵니다.",
          "feel": "지지 부위를 유지하고 편안한 범위에서 준비 자세와 동작 자세의 차이를 확인합니다."
        },
        "visualNote": "동작 구조를 설명하는 예시이며 기구 높이·보폭·깊이·중량은 개인 수업 실측값이나 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_lower_extension-start.webp",
          "docs/images/guides/ht_lower_extension-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_lower_six&variant=ht_lower_extension"
      }
    ]
  },
  "ht_legpress_positions": {
    "name": "레그프레스 발 위치 5가지 · PT 보강",
    "kind": "htlegpresswide",
    "target": "quads",
    "captions": [
      "와이드 스탠스 · 지지 위치 확인",
      "와이드 스탠스 · 무릎을 굽힌 시범"
    ],
    "notes": [
      "등과 골반을 등받이에 지지한 원본 장면에서 발 위치를 확인합니다.",
      "발 위치를 유지하며 무릎을 굽혔다 펴는 두 장면을 비교합니다."
    ],
    "focus": {
      "muscle": "허벅지·둔근",
      "move": "등·골반 지지와 양발 위치를 유지한 채 무릎을 굽혔다 펴는 시범입니다.",
      "feel": "기존 PT에서 배운 발바닥 지지와 비교하세요. 새로운 발 위치·중량·깊이는 개인 처방으로 확정하지 않습니다."
    },
    "visualNote": "원본 영상 2초·4초를 추출했습니다. 근육 강조 그림은 원본 제작자 설명이며 3D의 기구 크기·간격·깊이는 예시입니다.",
    "images": [
      "docs/images/guides/ht_legpress_wide-start.webp",
      "docs/images/guides/ht_legpress_wide-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=ht_legpress_positions",
    "variants": [
      {
        "id": "ht_legpress_wide",
        "name": "와이드 스탠스",
        "kind": "htlegpresswide",
        "target": "quads",
        "captions": [
          "와이드 스탠스 · 지지 위치 확인",
          "와이드 스탠스 · 무릎을 굽힌 시범"
        ],
        "notes": [
          "등과 골반을 등받이에 지지한 원본 장면에서 발 위치를 확인합니다.",
          "발 위치를 유지하며 무릎을 굽혔다 펴는 두 장면을 비교합니다."
        ],
        "focus": {
          "muscle": "허벅지·둔근",
          "move": "등·골반 지지와 양발 위치를 유지한 채 무릎을 굽혔다 펴는 시범입니다.",
          "feel": "기존 PT에서 배운 발바닥 지지와 비교하세요. 새로운 발 위치·중량·깊이는 개인 처방으로 확정하지 않습니다."
        },
        "visualNote": "원본 영상 2초·4초를 추출했습니다. 근육 강조 그림은 원본 제작자 설명이며 3D의 기구 크기·간격·깊이는 예시입니다.",
        "images": [
          "docs/images/guides/ht_legpress_wide-start.webp",
          "docs/images/guides/ht_legpress_wide-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_legpress_positions&variant=ht_legpress_wide"
      },
      {
        "id": "ht_legpress_narrow",
        "name": "내로우 스탠스",
        "kind": "htlegpressnarrow",
        "target": "quads",
        "captions": [
          "내로우 스탠스 · 지지 위치 확인",
          "내로우 스탠스 · 무릎을 굽힌 시범"
        ],
        "notes": [
          "등과 골반을 등받이에 지지한 원본 장면에서 발 위치를 확인합니다.",
          "발 위치를 유지하며 무릎을 굽혔다 펴는 두 장면을 비교합니다."
        ],
        "focus": {
          "muscle": "허벅지·둔근",
          "move": "등·골반 지지와 양발 위치를 유지한 채 무릎을 굽혔다 펴는 시범입니다.",
          "feel": "기존 PT에서 배운 발바닥 지지와 비교하세요. 새로운 발 위치·중량·깊이는 개인 처방으로 확정하지 않습니다."
        },
        "visualNote": "원본 영상 20초·22초를 추출했습니다. 근육 강조 그림은 원본 제작자 설명이며 3D의 기구 크기·간격·깊이는 예시입니다.",
        "images": [
          "docs/images/guides/ht_legpress_narrow-start.webp",
          "docs/images/guides/ht_legpress_narrow-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_legpress_positions&variant=ht_legpress_narrow"
      },
      {
        "id": "ht_legpress_standard",
        "name": "기본 스탠스",
        "kind": "htlegpressstandard",
        "target": "quads",
        "captions": [
          "기본 스탠스 · 지지 위치 확인",
          "기본 스탠스 · 무릎을 굽힌 시범"
        ],
        "notes": [
          "등과 골반을 등받이에 지지한 원본 장면에서 발 위치를 확인합니다.",
          "발 위치를 유지하며 무릎을 굽혔다 펴는 두 장면을 비교합니다."
        ],
        "focus": {
          "muscle": "허벅지·둔근",
          "move": "등·골반 지지와 양발 위치를 유지한 채 무릎을 굽혔다 펴는 시범입니다.",
          "feel": "기존 PT에서 배운 발바닥 지지와 비교하세요. 새로운 발 위치·중량·깊이는 개인 처방으로 확정하지 않습니다."
        },
        "visualNote": "원본 영상 28초·30초를 추출했습니다. 근육 강조 그림은 원본 제작자 설명이며 3D의 기구 크기·간격·깊이는 예시입니다.",
        "images": [
          "docs/images/guides/ht_legpress_standard-start.webp",
          "docs/images/guides/ht_legpress_standard-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_legpress_positions&variant=ht_legpress_standard"
      },
      {
        "id": "ht_legpress_high",
        "name": "발판 높은 위치",
        "kind": "htlegpresshigh",
        "target": "quads",
        "captions": [
          "발판 높은 위치 · 지지 위치 확인",
          "발판 높은 위치 · 무릎을 굽힌 시범"
        ],
        "notes": [
          "등과 골반을 등받이에 지지한 원본 장면에서 발 위치를 확인합니다.",
          "발 위치를 유지하며 무릎을 굽혔다 펴는 두 장면을 비교합니다."
        ],
        "focus": {
          "muscle": "허벅지·둔근",
          "move": "등·골반 지지와 양발 위치를 유지한 채 무릎을 굽혔다 펴는 시범입니다.",
          "feel": "기존 PT에서 배운 발바닥 지지와 비교하세요. 새로운 발 위치·중량·깊이는 개인 처방으로 확정하지 않습니다."
        },
        "visualNote": "원본 영상 42초·44초를 추출했습니다. 근육 강조 그림은 원본 제작자 설명이며 3D의 기구 크기·간격·깊이는 예시입니다.",
        "images": [
          "docs/images/guides/ht_legpress_high-start.webp",
          "docs/images/guides/ht_legpress_high-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_legpress_positions&variant=ht_legpress_high"
      },
      {
        "id": "ht_legpress_low",
        "name": "발판 낮은 위치",
        "kind": "htlegpresslow",
        "target": "quads",
        "captions": [
          "발판 낮은 위치 · 지지 위치 확인",
          "발판 낮은 위치 · 무릎을 굽힌 시범"
        ],
        "notes": [
          "등과 골반을 등받이에 지지한 원본 장면에서 발 위치를 확인합니다.",
          "발 위치를 유지하며 무릎을 굽혔다 펴는 두 장면을 비교합니다."
        ],
        "focus": {
          "muscle": "허벅지·둔근",
          "move": "등·골반 지지와 양발 위치를 유지한 채 무릎을 굽혔다 펴는 시범입니다.",
          "feel": "기존 PT에서 배운 발바닥 지지와 비교하세요. 새로운 발 위치·중량·깊이는 개인 처방으로 확정하지 않습니다."
        },
        "visualNote": "원본 영상 51초·53초를 추출했습니다. 근육 강조 그림은 원본 제작자 설명이며 3D의 기구 크기·간격·깊이는 예시입니다.",
        "images": [
          "docs/images/guides/ht_legpress_low-start.webp",
          "docs/images/guides/ht_legpress_low-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_legpress_positions&variant=ht_legpress_low"
      }
    ]
  },
  "pt_lunge": {
    "name": "일반 런지 · 앞다리 지지",
    "kind": "ptlunge",
    "target": "glutes",
    "captions": [
      "앞발로 지지하며 준비",
      "회전 없이 엉덩이를 내려 앉기"
    ],
    "notes": [
      "앞뒤로 발을 나누고 앞발 전체로 지면을 지지합니다. 뒷다리는 균형을 돕습니다.",
      "몸통을 돌리지 않고 엉덩이를 내려 앉았다가 앞발로 지면을 밟으며 일어납니다."
    ],
    "focus": {
      "muscle": "앞다리 허벅지·둔근",
      "move": "몸통을 돌리지 않고 엉덩이를 내려 앉았다가 앞발로 지면을 밟으며 일어납니다.",
      "feel": "앞다리와 엉덩이가 몸을 받쳐 올리고, 뒷다리는 중심을 거드는 느낌"
    },
    "visualNote": "10월 7일 수업의 앞다리 지지·회전 없는 런지를 설명하는 3D 예시에서 준비/동작 2컷을 만들었습니다. 보폭·깊이·팔 위치는 개인 실측값이 아닙니다.",
    "images": [
      "docs/images/guides/pt_lunge-start.webp",
      "docs/images/guides/pt_lunge-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=pt_lunge"
  },
  "ht_latpulldown_reference": {
    "name": "랫풀다운 자세 · PT 보강",
    "kind": "htlatpull",
    "target": "back",
    "captions": [
      "팔을 올린 준비",
      "팔꿈치를 내린 동작"
    ],
    "notes": [
      "랫풀다운의 원본 준비·지지 자세를 확인합니다.",
      "허벅지와 몸통을 지지하며 팔꿈치가 아래로 내려오는 경로를 비교합니다."
    ],
    "focus": {
      "muscle": "광배근·견갑 주변",
      "move": "허벅지와 몸통을 지지하며 팔꿈치가 아래로 내려오는 경로를 비교합니다.",
      "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
    },
    "visualNote": "2컷은 원본 12초·13.35초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
    "images": [
      "docs/images/guides/ht_latpulldown_reference_latpull-start.webp",
      "docs/images/guides/ht_latpulldown_reference_latpull-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=ht_latpulldown_reference"
  },
  "ht_upper_elbows": {
    "name": "상체 4종 · 팔꿈치 경로 비교",
    "kind": "htlatpull",
    "target": "back",
    "captions": [
      "팔을 뻗은 준비",
      "팔꿈치를 내린 동작"
    ],
    "notes": [
      "랫풀다운의 원본 준비·지지 자세를 확인합니다.",
      "팔꿈치를 뒤로 과하게 빼는 예와 아래로 내리는 예를 비교합니다."
    ],
    "focus": {
      "muscle": "등·광배근",
      "move": "팔꿈치를 뒤로 과하게 빼는 예와 아래로 내리는 예를 비교합니다.",
      "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
    },
    "visualNote": "2컷은 원본 3초·2.1초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
    "images": [
      "docs/images/guides/ht_upper_elbows_latpull-start.webp",
      "docs/images/guides/ht_upper_elbows_latpull-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=ht_upper_elbows",
    "variants": [
      {
        "id": "ht_upper_elbows_latpull",
        "name": "랫풀다운",
        "kind": "htlatpull",
        "target": "back",
        "captions": [
          "팔을 뻗은 준비",
          "팔꿈치를 내린 동작"
        ],
        "notes": [
          "랫풀다운의 원본 준비·지지 자세를 확인합니다.",
          "팔꿈치를 뒤로 과하게 빼는 예와 아래로 내리는 예를 비교합니다."
        ],
        "focus": {
          "muscle": "등·광배근",
          "move": "팔꿈치를 뒤로 과하게 빼는 예와 아래로 내리는 예를 비교합니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 3초·2.1초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_upper_elbows_latpull-start.webp",
          "docs/images/guides/ht_upper_elbows_latpull-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_elbows&variant=ht_upper_elbows_latpull"
      },
      {
        "id": "ht_upper_elbows_row",
        "name": "V 핸들 케이블 로우",
        "kind": "htvrow",
        "target": "back",
        "captions": [
          "팔을 뻗은 준비",
          "몸 가까이 당기기"
        ],
        "notes": [
          "V 핸들 케이블 로우의 원본 준비·지지 자세를 확인합니다.",
          "중립 그립에서 팔꿈치가 몸 가까이 뒤로 이동하는 경로를 비교합니다."
        ],
        "focus": {
          "muscle": "등·견갑 주변",
          "move": "중립 그립에서 팔꿈치가 몸 가까이 뒤로 이동하는 경로를 비교합니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 6.3초·5.1초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_upper_elbows_row-start.webp",
          "docs/images/guides/ht_upper_elbows_row-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_elbows&variant=ht_upper_elbows_row"
      },
      {
        "id": "ht_upper_elbows_shoulder",
        "name": "시티드 덤벨 숄더프레스",
        "kind": "htshoulderpress",
        "target": "shoulders",
        "captions": [
          "덤벨을 받친 준비",
          "위로 밀어 올리기"
        ],
        "notes": [
          "시티드 덤벨 숄더프레스의 원본 준비·지지 자세를 확인합니다.",
          "등을 지지하고 팔꿈치를 몸통보다 약간 앞에 두어 덤벨을 위로 미는 시범입니다."
        ],
        "focus": {
          "muscle": "어깨·삼두",
          "move": "등을 지지하고 팔꿈치를 몸통보다 약간 앞에 두어 덤벨을 위로 미는 시범입니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 9.3초·10.2초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_upper_elbows_shoulder-start.webp",
          "docs/images/guides/ht_upper_elbows_shoulder-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_elbows&variant=ht_upper_elbows_shoulder"
      },
      {
        "id": "ht_upper_elbows_chest",
        "name": "덤벨 체스트프레스",
        "kind": "dumbbellpress",
        "target": "chest",
        "captions": [
          "덤벨을 내린 준비",
          "양팔로 밀기"
        ],
        "notes": [
          "덤벨 체스트프레스의 원본 준비·지지 자세를 확인합니다.",
          "가슴을 지지하며 팔꿈치가 지나치게 옆으로 벌어지는 예와 몸통 쪽으로 모이는 예를 비교합니다."
        ],
        "focus": {
          "muscle": "가슴·어깨·삼두",
          "move": "가슴을 지지하며 팔꿈치가 지나치게 옆으로 벌어지는 예와 몸통 쪽으로 모이는 예를 비교합니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 12.6초·13.5초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_upper_elbows_chest-start.webp",
          "docs/images/guides/ht_upper_elbows_chest-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_upper_elbows&variant=ht_upper_elbows_chest"
      }
    ]
  },
  "ht_chest_six": {
    "name": "가슴 운동 6종 · PT 보강",
    "kind": "htbenchpullover",
    "target": "back",
    "captions": [
      "덤벨을 위에 받친 준비",
      "머리 뒤로 넘기기"
    ],
    "notes": [
      "덤벨 풀오버 · 발 바닥 지지의 원본 준비·지지 자세를 확인합니다.",
      "발을 바닥에 두고 벤치에 누워 덤벨 한 개를 양손으로 받쳐 머리 뒤로 넘깁니다."
    ],
    "focus": {
      "muscle": "가슴·광배근·어깨 주변",
      "move": "발을 바닥에 두고 벤치에 누워 덤벨 한 개를 양손으로 받쳐 머리 뒤로 넘깁니다.",
      "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
    },
    "visualNote": "2컷은 원본 4초·7초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
    "images": [
      "docs/images/guides/ht_chest_six_pullover-start.webp",
      "docs/images/guides/ht_chest_six_pullover-end.webp"
    ],
    "viewer": "media/3d/viewer.html?exercise=ht_chest_six",
    "variants": [
      {
        "id": "ht_chest_six_pullover",
        "name": "덤벨 풀오버 · 발 바닥 지지",
        "kind": "htbenchpullover",
        "target": "back",
        "captions": [
          "덤벨을 위에 받친 준비",
          "머리 뒤로 넘기기"
        ],
        "notes": [
          "덤벨 풀오버 · 발 바닥 지지의 원본 준비·지지 자세를 확인합니다.",
          "발을 바닥에 두고 벤치에 누워 덤벨 한 개를 양손으로 받쳐 머리 뒤로 넘깁니다."
        ],
        "focus": {
          "muscle": "가슴·광배근·어깨 주변",
          "move": "발을 바닥에 두고 벤치에 누워 덤벨 한 개를 양손으로 받쳐 머리 뒤로 넘깁니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 4초·7초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_chest_six_pullover-start.webp",
          "docs/images/guides/ht_chest_six_pullover-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_chest_six&variant=ht_chest_six_pullover"
      },
      {
        "id": "ht_chest_six_fly",
        "name": "덤벨 플라이",
        "kind": "htdumbbellfly",
        "target": "chest",
        "captions": [
          "덤벨을 위에 모으기",
          "양팔을 벌린 동작"
        ],
        "notes": [
          "덤벨 플라이의 원본 준비·지지 자세를 확인합니다.",
          "팔꿈치를 약간 굽힌 채 덤벨을 양옆으로 벌렸다 가슴 위로 모읍니다."
        ],
        "focus": {
          "muscle": "가슴·어깨 주변",
          "move": "팔꿈치를 약간 굽힌 채 덤벨을 양옆으로 벌렸다 가슴 위로 모읍니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 10초·13초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_chest_six_fly-start.webp",
          "docs/images/guides/ht_chest_six_fly-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_chest_six&variant=ht_chest_six_fly"
      },
      {
        "id": "ht_chest_six_incline",
        "name": "인클라인 스미스 프레스",
        "kind": "smithincline",
        "target": "chest",
        "captions": [
          "바를 받친 준비",
          "레일을 따라 밀기"
        ],
        "notes": [
          "인클라인 스미스 프레스의 원본 준비·지지 자세를 확인합니다.",
          "경사진 벤치에 지지하고 스미스 바를 레일을 따라 내렸다 밀어 올립니다."
        ],
        "focus": {
          "muscle": "윗가슴·어깨·삼두",
          "move": "경사진 벤치에 지지하고 스미스 바를 레일을 따라 내렸다 밀어 올립니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 22초·25초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_chest_six_incline-start.webp",
          "docs/images/guides/ht_chest_six_incline-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_chest_six&variant=ht_chest_six_incline"
      },
      {
        "id": "ht_chest_six_flat",
        "name": "플랫 스미스 프레스",
        "kind": "htsmithflat",
        "target": "chest",
        "captions": [
          "바를 받친 준비",
          "수직으로 밀기"
        ],
        "notes": [
          "플랫 스미스 프레스의 원본 준비·지지 자세를 확인합니다.",
          "평평한 벤치에서 스미스 바를 정해진 레일을 따라 내렸다 밀어 올립니다."
        ],
        "focus": {
          "muscle": "가슴·어깨·삼두",
          "move": "평평한 벤치에서 스미스 바를 정해진 레일을 따라 내렸다 밀어 올립니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 31초·32초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_chest_six_flat-start.webp",
          "docs/images/guides/ht_chest_six_flat-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_chest_six&variant=ht_chest_six_flat"
      },
      {
        "id": "ht_chest_six_press",
        "name": "덤벨 체스트프레스",
        "kind": "dumbbellpress",
        "target": "chest",
        "captions": [
          "덤벨을 받친 준비",
          "양팔로 밀기"
        ],
        "notes": [
          "덤벨 체스트프레스의 원본 준비·지지 자세를 확인합니다.",
          "양손의 덤벨을 천천히 받았다 가슴 위로 밀어 올리는 경로를 비교합니다."
        ],
        "focus": {
          "muscle": "가슴·어깨·삼두",
          "move": "양손의 덤벨을 천천히 받았다 가슴 위로 밀어 올리는 경로를 비교합니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 39초·40초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_chest_six_press-start.webp",
          "docs/images/guides/ht_chest_six_press-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_chest_six&variant=ht_chest_six_press"
      },
      {
        "id": "ht_chest_six_squeeze",
        "name": "덤벨 모아 밀기",
        "kind": "htsqueezepress",
        "target": "chest",
        "captions": [
          "덤벨을 모은 준비",
          "모은 채 위로 밀기"
        ],
        "notes": [
          "덤벨 모아 밀기의 원본 준비·지지 자세를 확인합니다.",
          "가슴 위에서 두 덤벨을 가까이 모은 채 내렸다 밀어 올리는 시범입니다."
        ],
        "focus": {
          "muscle": "가슴·어깨·삼두",
          "move": "가슴 위에서 두 덤벨을 가까이 모은 채 내렸다 밀어 올리는 시범입니다.",
          "feel": "개인 PT에서 배운 지지·움직임과 비교하고 다른 세팅은 보조 자료로 기록합니다."
        },
        "visualNote": "2컷은 원본 47초·49초 장면입니다. 3D는 동작 구조를 설명하는 예시이며 중량·각도·깊이는 개인 처방이 아닙니다.",
        "images": [
          "docs/images/guides/ht_chest_six_squeeze-start.webp",
          "docs/images/guides/ht_chest_six_squeeze-end.webp"
        ],
        "viewer": "media/3d/viewer.html?exercise=ht_chest_six&variant=ht_chest_six_squeeze"
      }
    ]
  }
};
