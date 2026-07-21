/* sw.js — 오프라인 캐시 (앱 셸 + 데이터)
   콘텐츠 수정 시 CACHE 버전을 올리면 갱신됩니다. */
const CACHE = 'ptgolf-v22';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/store.js',
  './js/app.js',
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
  './docs/images/21_foam.svg'
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
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
