# PT 재활 4동작 — 실사 이미지 생성 프롬프트

> 목적: 상세화면 참고 이미지(쿼드셋·SLR·클램쉘·SSLR)를 **한 세트처럼 일관된 실사**로 생성.
> ChatGPT(DALL·E)·Midjourney·Stable Diffusion 등 어디서든 사용. 뽑은 뒤 `docs/images/`에 넣고 알려주면 앱에 연결·압축.

## 사용법 (일관성이 핵심)
- **4장을 같은 모델·같은 복장·같은 스튜디오·같은 카메라 각도**로 생성할 것.
  - ChatGPT: 첫 장 생성 후 "same model, same wardrobe, same studio and camera as the previous image, next exercise: …" 로 이어서 요청.
  - Midjourney: 동일 `--seed` + 캐릭터 레퍼런스(`--cref`) 사용, `--ar 3:2`.
- 각 프롬프트 = **[동작 묘사] + [공통 스타일 블록]**.
- 파일명: `01_quadset`, `02_slr`, `03_clamshell`, `04_sslr` / 가로 3:2(약 1536×1024) / PNG·JPG.

## 공통 스타일 블록 (모든 프롬프트 뒤에 붙임)
```
Photorealistic instructional physiotherapy photography. A single fit adult demonstrating a rehab exercise, wearing fitted neutral athletic wear (heather-grey top, teal leggings), on a charcoal exercise mat, in a bright clean physio studio with a soft light-grey seamless background. Soft diffused lighting, sharp focus, natural skin, calm neutral expression. Full body fully inside the frame, clear correct form. Shot on a 50mm lens at eye level, side profile. 3:2 landscape. High detail. No text, no numbers, no watermark, no logo, no equipment clutter.
```

## 네거티브 프롬프트 (SD/MJ `--no` 등)
```
text, letters, numbers, watermark, logo, extra limbs, deformed anatomy, multiple people, gym machines, dumbbells, cluttered background, dark mood, blurry, cropped body
```

---

## ① 01_quadset — 쿼드 셋 (Quad Set)
```
A person sitting on the floor in a long-sitting position with both legs extended straight forward. A small rolled towel is placed under ONE knee, creating a slight bend. The person presses the back of that knee down into the towel to engage the front thigh (quadriceps); the ankle is flexed with the toes pulled back toward the shin. Upright back, hands resting on the mat beside the hips. Side profile so the straight leg, the towel under the knee, and the flexed foot are all clearly visible.
```
+ 공통 스타일 블록

## ② 02_slr — SLR (스트레이트 레그 레이즈)
```
A person lying flat on their back (supine) on the mat. One leg rests on the floor with the knee comfortably bent. The OTHER leg is kept completely straight and lifted about 30 cm off the floor, toes pulled back toward the shin, pelvis and lower back flat on the mat. Side profile showing the straight raised leg and the height of the lift.
```
+ 공통 스타일 블록

## ③ 03_clamshell — 클램쉘 (Clamshell)
```
A person lying on their side on the mat, hips and knees bent about 45 degrees, both feet stacked together with the heels touching. The TOP knee is lifted and rotated open like a clamshell while the feet stay together and the pelvis stays stacked and stable (not rolling backward). A light fabric resistance band is looped around both thighs just above the knees. Camera slightly in front and above to clearly show the top knee opening.
```
+ 공통 스타일 블록

## ④ 04_sslr — SSLR (사이드 스트레이트 레그 레이즈)
```
A person lying on their side on the mat in a straight body line, the BOTTOM leg slightly bent and moved a little forward for support. The TOP leg is kept perfectly straight and lifted upward about 30-40 cm (hip abduction), hips stacked vertically without rolling backward, toes pointing forward. Side profile showing the straight raised top leg.
```
+ 공통 스타일 블록

---

## 뽑은 뒤
`docs/images/` 에 위 파일명으로 넣고 알려주면:
1) WebP로 압축(장당 ~150–250KB, 화질 유지) 2) 3:2 정렬 3) `seed.json` 이미지 경로 교체 + 서비스워커 캐시 갱신 4) 라이브 배포·검증.
