/* sw.js — 오프라인 캐시 (앱 셸 + 데이터)
   콘텐츠 수정 시 CACHE 버전을 올리면 갱신됩니다. */
const CACHE = 'ptgolf-v85';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/store.js',
  './js/app.js',
  './css/golf.css?v=85',
  './js/golf-data.js?v=85',
  './js/golf.js?v=85',
  './js/exercise-media.js?v=85',
  './media/golf3d/viewer.html?v=85',
  './media/golf3d/lesson.html?v=85',
  './media/golf3d/consistency.html?v=85',
  './media/golf3d/training.html?v=85',
  './media/golf3d/original.html?v=85',
  './media/3d/viewer.html?v=85',
  './media/3d/poses.js?v=85',
  './media/3d/viewer.js?v=85',
  './data/seed.json',
  './manifest.webmanifest',
  './icon.svg',
  './icon-maskable.svg',
  './docs/images/01_quadset.svg',
  './docs/images/02_slr.svg',
  './docs/images/03_clamshell.svg',
  './docs/images/04_sslr.svg',
  './docs/images/05_halfsquat.svg',
  './docs/images/06_frontsquat.svg',
  './docs/images/07_armcurl.svg',
  './docs/images/08_pullup.svg',
  './docs/images/09_seatedrow.svg',
  './docs/images/10_latpulldown.svg',
  './docs/images/11_armpulldown.svg',
  './docs/images/12_vsquat.svg',
  './docs/images/13_squat.svg',
  './docs/images/14_legcurl.svg',
  './docs/images/15_adduction.svg',
  './docs/images/16_legextension.svg',
  './docs/images/17_deadbug.svg',
  './docs/images/18_plank.svg',
  './docs/images/19_hamstring.svg',
  './docs/images/20_piriformis.svg',
  './docs/images/21_foam.svg',
  './docs/images/22_birddog.svg',
  './docs/images/23_tbalance.svg',
  './docs/images/24_stepup.svg',
  './docs/images/25_bridge.svg',
  './docs/images/26_openbook.svg',
  './docs/images/27_benchpress.svg',
  './docs/images/30_tailbone_raise.svg',
  './docs/images/31_rotationlunge.svg',
  './docs/images/32_dbpullover.svg',
  './docs/images/33_widesquat.svg',
  './docs/images/34_machinerow.svg',
  './docs/images/35_bosurotation.svg',
  './docs/images/36_legpress.svg',
  './docs/images/37_pushdown.svg',
  './docs/images/38_backextension.svg',
  './docs/images/39_facepull.svg',
  './docs/images/40_lateralraise.svg',
  './docs/images/41_gobletsquat.svg',
  './docs/images/42_sldl.svg',
  './docs/images/43_chestpress.svg',
  './docs/images/44_pecdeck.svg',
  './samples/pushdown-3d/combined-start.png?v=85',
  './samples/pushdown-3d/combined-end.png?v=85',
  './samples/pushdown-3d/viewer.html?v=85',
  './samples/pushdown-3d/three.min.js',
  './samples/pushdown-3d/pushdown.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 네트워크 우선(최신 seed 반영) → 실패 시 캐시 폴백
self.addEventListener('fetch', (e) => {
  // Let the browser handle external players and their origin/referrer requirements.
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (!res.ok) return res;
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(async () => {
        const exact = await caches.match(e.request);
        if (exact) return exact;
        const url = new URL(e.request.url);
        if (url.origin === self.location.origin) {
          const cached = await caches.match(e.request, { ignoreSearch: true });
          if (cached) return cached;
          if (e.request.mode === 'navigate') return caches.match('./index.html');
        }
        return Response.error();
      })
  );
});
