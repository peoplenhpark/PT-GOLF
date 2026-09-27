'use strict';
// Lightweight form/storage doubles: these tests do not open a browser or access user records.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const persistenceSource = fs.readFileSync(path.join(root, 'js/persistence.js'), 'utf8');
const draftSource = fs.readFileSync(path.join(root, 'js/drafts.js'), 'utf8');
const updateSource = fs.readFileSync(path.join(root, 'js/update.js'), 'utf8');
const KEY = 'ptgolf_drafts_v1';
class Element {
  constructor(tag, props = {}) { Object.assign(this, { tag, id: '', name: '', value: '', checked: false, type: '', readOnly: false, disabled: false, dataset: {}, className: '', children: [], parent: null, isConnected: false, listeners: {} }, props); }
  matches(selector) { return selector.split(',').some(s => {
    s = s.trim(); if (['input', 'textarea', 'select', 'form'].includes(s)) return this.tag === s;
    if (s === '[data-no-draft]') return this.dataset.noDraft !== undefined;
    if (s === '[data-draft-status]') return this.dataset.draftStatus !== undefined;
    if (s === '[data-g-form=search]') return this.dataset.gForm === 'search';
    if (s === '.hidden') return this.className.split(' ').includes('hidden');
    if (s === '.modal:not(.hidden)') return this.className.split(' ').includes('modal') && !this.matches('.hidden');
    const type = /^\[type=(\w+)\]$/.exec(s); return type ? this.type === type[1] : false;
  }); }
  closest(selector) { for (let node = this; node; node = node.parent) if (node.matches(selector)) return node; return null; }
  append(child) { this.children.push(child); child.parent = this; child.connect(this.isConnected); }
  connect(value) { this.isConnected = value; this.children.forEach(child => child.connect(value)); }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  emit(type) { for (const fn of this.listeners[type] || []) fn({ target: this }); }
  setAttribute() {}
}
function memory() { const values = new Map(); let failing = false; return { values, fail(value) { failing = value; },
  api: { getItem: key => values.get(key) ?? null, setItem(key, value) { if (failing) throw new Error('quota'); values.set(key, value); }, removeItem(key) { if (failing) throw new Error('quota'); values.delete(key); } } }; }
function setup(storage = memory()) {
  let mounted = [], reloads = 0; const windowEvents = {}, documentEvents = {}, swEvents = {}, posts = [];
  const document = { createElement: tag => new Element(tag), hidden: false,
    querySelectorAll: selector => mounted.flatMap(node => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]),
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    addEventListener(type, fn) { documentEvents[type] = fn; } };
  const worker = { postMessage: msg => posts.push(msg) };
  const registration = { waiting: worker, update: async () => {}, addEventListener() {} };
  const context = { console, Date, Set, Map, WeakMap, WeakSet, Error, Event: class { constructor(type) { this.type = type; } },
    localStorage: storage.api, document, location: { hash: '#exercise/a', protocol: 'https:', reload: () => { reloads++; } },
    addEventListener: (type, fn) => { windowEvents[type] = fn; }, dispatchEvent: event => { windowEvents[event.type]?.(event); },
    setTimeout: fn => { fn(); }, navigator: { serviceWorker: { controller: {}, addEventListener: (type, fn) => { swEvents[type] = fn; }, register: async () => registration } } };
  context.window = context; vm.createContext(context); vm.runInContext(persistenceSource, context); vm.runInContext(draftSource, context);
  return { drafts: context.AppDrafts, persistence: context.Persistence, storage, context, document, posts, reloads: () => reloads, windowEvents, swEvents,
    mount(...nodes) { mounted.forEach(node => node.connect(false)); mounted = nodes; nodes.forEach(node => node.connect(true)); },
    loadUpdate() { vm.runInContext(updateSource, context); context.AppUpdate.init(() => {}); } };
}
function editor(id = 'memo-input', value = '') { const box = new Element('section'), field = new Element('textarea', { id, value }); box.append(field); return { box, field }; }
let count = 0;
async function test(name, fn) { await fn(); count++; }
(async () => {
  await test('failed writes retain latest input after leaving and returning', async () => {
    const t = setup(), first = editor(); t.mount(first.box); t.drafts.bind(first.box, '#exercise/a'); t.storage.fail(true);
    first.field.value = 'latest unsaved input'; first.field.emit('input');
    assert.equal(t.drafts.hasUnstored(), true); assert.equal(t.drafts.activePending(), true);
    t.mount(new Element('section')); assert.equal(t.drafts.activePending(), false); assert.equal(t.drafts.hasUnstored(), true);
    const again = editor(); t.mount(again.box); t.drafts.bind(again.box, '#exercise/a');
    assert.equal(again.field.value, 'latest unsaved input'); assert.equal(t.drafts.activePending(), true);
  });
  await test('hidden fields are not active, successful clear removes drafts', async () => {
    const t = setup(), { box, field } = editor(); box.className = 'modal'; t.mount(box); t.drafts.bind(box, 'editor:a');
    field.value = 'saved draft'; field.emit('input'); assert.equal(t.drafts.activePending(), true);
    box.className = 'modal hidden'; assert.equal(t.drafts.activePending(), false); box.className = 'modal';
    t.drafts.clear(box); assert.equal(t.drafts.activePending(), false); assert.equal(t.drafts.hasPending(), false);
  });
  await test('reused form fields rebind to a different scope without duplicate listeners', async () => {
    const t = setup(), { box, field } = editor('f-name', 'A'); t.mount(box); t.drafts.bind(box, 'editor:a', true);
    field.value = 'A draft'; field.emit('input'); field.value = 'B'; t.drafts.bind(box, 'editor:b', true);
    assert.equal(field.value, 'B'); assert.equal(t.drafts.activePending(), false);
    field.value = 'B draft'; field.emit('input'); field.value = 'A'; t.drafts.bind(box, 'editor:a', true);
    assert.equal(field.value, 'A draft'); assert.equal(field.listeners.input.length, 1);
    assert.equal(Object.keys(JSON.parse(t.storage.values.get(KEY))).length, 2);
  });
  await test('conflicting same-field draft writes keep both disk and local input', async () => {
    const storage = memory(), a = setup(storage), b = setup(storage), one = editor(), two = editor();
    a.mount(one.box); b.mount(two.box); a.drafts.bind(one.box, 'same'); b.drafts.bind(two.box, 'same');
    one.field.value = 'first tab'; one.field.emit('input'); two.field.value = 'second tab'; two.field.emit('input');
    assert.equal(JSON.parse(storage.values.get(KEY))['same||memo-input'].value, 'first tab'); assert.equal(b.drafts.hasUnstored(), true);
    const returnTo = editor(); b.mount(returnTo.box); b.drafts.bind(returnTo.box, 'same'); assert.equal(returnTo.field.value, 'second tab');
  });
  await test('clear failure after domain save does not throw or erase another tab draft', async () => {
    const storage = memory(); storage.values.set(KEY, JSON.stringify({ 'same||memo-input': { value: 'initial draft', updated: '2026-09-27T00:00:00.000Z' } }));
    const a = setup(storage), b = setup(storage), one = editor(), two = editor();
    a.mount(one.box); b.mount(two.box); a.drafts.bind(one.box, 'same'); b.drafts.bind(two.box, 'same');
    one.field.value = 'first tab'; one.field.emit('input'); two.field.value = 'second tab'; two.field.emit('input');
    let result; assert.doesNotThrow(() => { result = b.drafts.clear(two.box); });
    assert.equal(result, false); assert.equal(b.drafts.hasUnstored(), false); assert.equal(b.drafts.activePending(), false);
    assert.equal(JSON.parse(storage.values.get(KEY))['same||memo-input'].value, 'first tab');
  });
  await test('malformed draft entry is preserved and never assigned as undefined', async () => {
    const storage = memory(); storage.values.set(KEY, JSON.stringify({ 'scope||memo-input': 'malformed' }));
    const t = setup(storage), { box, field } = editor('memo-input', 'base'); t.mount(box); t.drafts.bind(box, 'scope');
    assert.equal(field.value, 'base'); field.value = 'new'; field.emit('input'); assert.equal(t.drafts.hasUnstored(), true);
    assert.equal(storage.values.get(KEY), JSON.stringify({ 'scope||memo-input': 'malformed' }));
  });
  await test('pending failed draft blocks update after its field is detached', async () => {
    const t = setup(), { box, field } = editor(); t.mount(box); t.drafts.bind(box, 'scope'); t.storage.fail(true);
    field.value = 'cannot store'; field.emit('input'); t.mount(new Element('section')); t.loadUpdate();
    await Promise.resolve(); await Promise.resolve();
    assert.equal(t.posts.length, 0); t.swEvents.controllerchange(); assert.equal(t.reloads(), 0);
  });
  await test('persisted inactive draft allows update and survives a new app session', async () => {
    const t = setup(), { box, field } = editor(); t.mount(box); t.drafts.bind(box, 'scope');
    field.value = 'durable draft'; field.emit('input'); t.mount(new Element('section')); t.loadUpdate();
    await Promise.resolve(); await Promise.resolve();
    assert.equal(t.posts.length, 1); t.swEvents.controllerchange(); assert.equal(t.reloads(), 1);
    const next = setup(t.storage), reopened = editor(); next.mount(reopened.box); next.drafts.bind(reopened.box, 'scope');
    assert.equal(reopened.field.value, 'durable draft');
  });
  console.log(`PASS: ${count} draft/update safety scenarios; isolated form and storage doubles.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
