/* Service-worker behavior in an isolated in-memory cache; never touches browser/user storage. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const buckets = new Map(), handlers = {};
const base = 'https://example.test/PT-GOLF/';
let network = async () => new Response('fresh'), skipped = 0;
const cacheApi = {
  async keys() { return [...buckets.keys()]; },
  async delete(key) { return buckets.delete(key); },
  async open(key) {
    if (!buckets.has(key)) buckets.set(key, new Map());
    const data = buckets.get(key);
    return {
      async match(request) { return data.get(typeof request === 'string' ? request : request.url)?.clone(); },
      async put(request, response) { data.set(typeof request === 'string' ? request : request.url, response.clone()); }
    };
  }
};
const context = { URL, Response, Request, AbortController, Set, console, setTimeout, clearTimeout, caches: cacheApi,
  fetch: (...args) => network(...args),
  importScripts() { context.PTGolfRelease = { version: '90', shell: ['index.html','js/app.js','js/exercise-media.js','data/seed.json'],
    exercises: { pt_one: ['one.webp','media/viewer.html'], pt_two: ['two.webp','media/viewer.html'] } }; },
  self: { location: { href: base + 'sw.js' }, registration: { active: {} },
    addEventListener(type, handler) { handlers[type] = handler; },
    async skipWaiting() { skipped++; }, clients: { async claim() {} } }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('sw.js','utf8').replace(/^\uFEFF/,''), context);
async function event(type, extra = {}, workerHandlers = handlers) {
  const tasks = []; let response, reply;
  workerHandlers[type]({ waitUntil(p) { tasks.push(p); }, respondWith(p) { response = p; },
    ports: [{ postMessage(value) { reply = value; } }], ...extra });
  const value = response ? await response : undefined;
  await Promise.all(tasks);
  return reply || value;
}
const request = (file, mode = 'cors') => ({ method:'GET', url:base + file, mode });
(async () => {
  await event('install');
  assert.equal(skipped, 0, 'updates must wait until drafts are safe');
  await cacheApi.open('another-app-cache');
  await cacheApi.open('ptgolf-v88');
  await event('activate');
  assert(buckets.has('another-app-cache'), 'unrelated app cache must survive');
  assert(!buckets.has('ptgolf-v88'));
  let newerReleaseRequests = 0;
  network = async () => { newerReleaseRequests++; return new Response('release-91'); };
  assert.equal(await (await event('fetch', { request:request('index.html?v=91','navigate') })).text(),'fresh');
  assert.equal(await (await event('fetch', { request:request('js/app.js?v=91') })).text(),'fresh');
  assert.equal(await (await event('fetch', { request:request('js/exercise-media.js?v=91') })).text(),'fresh');
  assert.equal(await (await event('fetch', { request:request('data/seed.json?v=91') })).text(),'fresh');
  assert.equal(newerReleaseRequests, 0, 'active v90 must keep seed and ExerciseMedia on its controlling release');
  network = async () => new Response('seed-live');
  await event('fetch', { request: request('data/seed.json?v=123') });
  await event('fetch', { request: request('data/seed.json?v=456') });
  assert.equal([...buckets.get('ptgolf-v90').keys()].filter(k=>k.includes('seed.json')).length, 1);
  network = async () => new Response('server failure', { status:503 });
  assert.equal(await (await event('fetch', { request:request('data/seed.json?v=789') })).text(),'fresh');
  network = async () => { throw new Error('offline'); };
  assert.equal(await (await event('fetch', { request:request('index.html?v=90','navigate') })).text(),'fresh');
  network = async url => new Response('asset:' + url);
  const prepared = await event('message', { data:{ type:'PTGOLF_PREPARE_OFFLINE', exerciseIds:['pt_one'], requestId:'one' } });
  assert.equal(prepared.ok, true); assert.equal(prepared.cached, 2); assert.equal(prepared.requestId,'one');
  const repeated = await event('message', { data:{ type:'PTGOLF_PREPARE_OFFLINE', exerciseIds:['pt_one','pt_one'] } });
  assert.equal(repeated.ok, true);
  const status = await event('message', { data:{ type:'PTGOLF_OFFLINE_STATUS', exerciseIds:['pt_one','pt_two'] } });
  assert.deepEqual(Array.from(status.readyIds), ['pt_one']); assert.deepEqual(Array.from(status.missingIds), ['pt_two']);
  const invalid = await event('message', { data:{ type:'PTGOLF_PREPARE_OFFLINE', exerciseIds:['https://bad.test/path'] } });
  assert.equal(invalid.ok, false);
  const previous = await cacheApi.open('ptgolf-v89');
  await previous.put(base + '__offline-prepared__', new Response(JSON.stringify({ exerciseIds:['pt_two'] })));
  await previous.put(base + 'two.webp', new Response('old-version-image'));
  network = async () => { throw new Error('migration is offline'); };
  await event('activate');
  assert(buckets.has('ptgolf-v89'), 'failed migration keeps one previous metadata source');
  const failedMigration = await event('message', { data:{ type:'PTGOLF_OFFLINE_STATUS', exerciseIds:['pt_two'] } });
  assert.deepEqual(Array.from(failedMigration.missingIds), ['pt_two']);
  assert.equal((await event('fetch', { request:request('two.webp') })).type, 'error', 'previous-release media must not silently replace missing current-release media');
  await event('message', { data:{ type:'PTGOLF_SKIP_WAITING' } });
  assert.equal(skipped, 1);
  // A waiting update has its own seed/registry but cannot change the active release's responses.
  const nextSeed = JSON.stringify({ version:36, items:[{ id:'pt_one' }, { id:'pt_new' }] });
  const nextMedia = 'globalThis.ExerciseMedia={pt_one:{},pt_new:{}};';
  network = async input => {
    const url = typeof input === 'string' ? input : input.url;
    if (new URL(url).pathname.endsWith('/data/seed.json')) return new Response(nextSeed);
    if (new URL(url).pathname.endsWith('/js/exercise-media.js')) return new Response(nextMedia);
    return new Response('release-91');
  };
  const waitingHandlers = {};
  const waitingContext = { ...context,
    importScripts() { waitingContext.PTGolfRelease = { ...context.PTGolfRelease, version:'91' }; },
    self: { ...context.self, addEventListener(type, handler) { waitingHandlers[type] = handler; } }
  };
  vm.createContext(waitingContext);
  vm.runInContext(fs.readFileSync('sw.js','utf8').replace(/^\uFEFF/,''), waitingContext);
  await event('install', {}, waitingHandlers);
  assert.equal(skipped, 1, 'installing the next release must still wait for safe activation');
  assert.equal(await (await event('fetch', { request:request('data/seed.json?v=91') })).text(), 'fresh', 'waiting seed cannot leak into the active release');
  assert.equal(await (await event('fetch', { request:request('js/exercise-media.js?v=91') })).text(), 'fresh');
  await event('activate', {}, waitingHandlers);
  network = async () => { throw new Error('offline after release activation'); };
  assert.equal(await (await event('fetch', { request:request('data/seed.json?v=91') }, waitingHandlers)).text(), nextSeed);
  assert.equal(await (await event('fetch', { request:request('js/exercise-media.js?v=91') }, waitingHandlers)).text(), nextMedia, 'new seed and new registry must become available together, including offline');
  console.log('PASS: release-coherent seed/HTML/JS before and after update activation, cache namespace, normalized seed key, 503/offline cache use, explicit exercise download/status, guarded activation.');
})().catch(error => { console.error(error); process.exit(1); });
