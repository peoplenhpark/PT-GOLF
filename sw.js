/* App shell stays small; selected exercise media is prepared explicitly. */
importScripts('./release-assets.js');
const RELEASE = globalThis.PTGolfRelease;
const CACHE = 'ptgolf-v' + RELEASE.version;
const OWN_CACHE = /^ptgolf-v\d+$/;
const BASE = new URL('./', self.location.href);
const TIMEOUT_MS = 4000;
const KNOWN_FILES = new Set([...RELEASE.shell, ...Object.values(RELEASE.exercises).flat()]);
const META_URL = new URL('__offline-prepared__', BASE).href;

function localFile(value) {
  const url = new URL(typeof value === 'string' ? value : value.url, BASE);
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return null;
  return url.pathname.slice(BASE.pathname.length) || 'index.html';
}
function cacheKey(value) {
  const file = localFile(value);
  return file === null ? null : new URL(file, BASE).href;
}
async function fetchBounded(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try { return await fetch(request, { signal: controller.signal, cache: 'no-cache' }); }
  finally { clearTimeout(timer); }
}
async function cacheResponse(cache, key, response) {
  if (response.ok && response.type !== 'opaque') await cache.put(key, response.clone());
}
async function loadAsset(file, cache) {
  const key = cacheKey(file);
  const cached = await cache.match(key);
  if (cached) return true;
  const response = await fetchBounded(new URL(file, BASE).href);
  if (!response.ok) throw new Error(String(response.status));
  await cacheResponse(cache, key, response);
  return true;
}
async function preparedIds(cache) {
  try { return (await (await cache.match(META_URL)).json()).exerciseIds || []; }
  catch { return []; }
}
async function rememberPrepared(cache, ids) {
  const previous = await preparedIds(cache);
  await cache.put(META_URL, new Response(JSON.stringify({ exerciseIds: [...new Set([...previous, ...ids])] }),
    { headers: { 'Content-Type': 'application/json' } }));
}
async function prepareExercises(ids) {
  const cache = await caches.open(CACHE);
  const requestedIds = [...new Set(ids)];
  const validIds = requestedIds.filter(id => Object.prototype.hasOwnProperty.call(RELEASE.exercises, id));
  const files = [...new Set(validIds.flatMap(id => RELEASE.exercises[id]))];
  const failed = [];
  let cached = 0;
  // Four concurrent downloads keep large selections responsive without flooding the connection.
  let cursor = 0;
  async function worker() {
    while (cursor < files.length) {
      const file = files[cursor++];
      try { await loadAsset(file, cache); cached++; } catch { failed.push(file); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, files.length) }, worker));
  const ready = validIds.filter(id => RELEASE.exercises[id].every(file => !failed.includes(file)));
  await rememberPrepared(cache, ready);
  return { ok: failed.length === 0 && validIds.length === requestedIds.length, cached, failed, exerciseIds: ready };
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(RELEASE.shell.map(async file => {
      const response = await fetchBounded(new URL(file, BASE).href);
      if (!response.ok) throw new Error('Cannot install required asset: ' + file);
      await cacheResponse(cache, cacheKey(file), response);
    }));
    // Existing clients decide when their drafts are safe before activating an update.
    if (!self.registration.active) await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const ownKeys = (await caches.keys()).filter(key => OWN_CACHE.test(key) && key !== CACHE);
    // Keep only the chosen offline exercises across releases, never arbitrary old JS/assets.
    const ids = new Set();
    for (const key of ownKeys) for (const id of await preparedIds(await caches.open(key))) ids.add(id);
    const result = ids.size ? await prepareExercises([...ids]) : { ok: true };
    // Keep an old own cache if network failed during migration; fetch fallback remains current-only.
    const retained = result.ok ? null : ownKeys.sort((a,b)=>Number(b.slice(8))-Number(a.slice(8)))[0];
    await Promise.all(ownKeys.filter(key=>key!==retained).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const file = localFile(event.request);
  if (event.request.method !== 'GET' || file === null) return;
  if (!KNOWN_FILES.has(file) && event.request.mode !== 'navigate') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = cacheKey(event.request);
    const cached = await cache.match(key);
    // Keep seed, HTML, JS and CSS on the controlling release until a verified worker activates.
    // New seed entries must not be paired with an old ExerciseMedia registry.
    if (cached) return cached;
    try {
      const response = await fetchBounded(event.request);
      if (response.status >= 500 && cached) return cached;
      if (response.ok && KNOWN_FILES.has(file)) {
        event.waitUntil(cacheResponse(cache, key, response));
      }
      return response;
    } catch {
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const shell = await cache.match(cacheKey('index.html'));
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
self.addEventListener('message', event => {
  const message = event.data || {};
  if (message.type === 'PTGOLF_SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (!['PTGOLF_PREPARE_OFFLINE', 'PTGOLF_OFFLINE_STATUS'].includes(message.type)) return;
  const ids = Array.isArray(message.exerciseIds) ? message.exerciseIds.filter(id => typeof id === 'string') : [];
  const reply = data => {
    const result = { requestId: message.requestId, version: RELEASE.version, ...data };
    if (event.ports?.[0]) event.ports[0].postMessage(result); else event.source?.postMessage(result);
  };
  event.waitUntil((async () => {
    if (message.type === 'PTGOLF_PREPARE_OFFLINE') {
      reply({ type: 'PTGOLF_OFFLINE_RESULT', ...await prepareExercises(ids) });
      return;
    }
    const cache = await caches.open(CACHE);
    const readyIds = [], missingIds = [];
    for (const id of ids) {
      const files = RELEASE.exercises[id];
      const ready = files && (await Promise.all(files.map(file => cache.match(cacheKey(file))))).every(Boolean);
      (ready ? readyIds : missingIds).push(id);
    }
    reply({ type: 'PTGOLF_OFFLINE_STATUS', ok: true, readyIds, missingIds });
  })().catch(() => reply({ type: 'PTGOLF_OFFLINE_RESULT', ok: false, cached: 0, failed: ['오프라인 저장을 완료하지 못했습니다.'], exerciseIds: [] })));
});
