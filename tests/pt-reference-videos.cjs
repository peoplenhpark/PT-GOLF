const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('js/pt-videos.js','utf8'),ctx);
const refs=JSON.parse(JSON.stringify(ctx.window.PTReferenceVideos)),seed=JSON.parse(fs.readFileSync('data/seed.json','utf8'));
const validate=require('../scripts/pt-video-validation.cjs');assert.equal(validate(seed,refs),54);
const sample=Object.keys(refs).find(id=>!refs[id].pending);
for(const change of [v=>{delete v.moments;},v=>{v.durationSeconds=181;},v=>{delete v.moments[0].url;},v=>{v.moments[0].url=v.moments[0].url.replace(v.youtubeId,'abcdefghijk');},v=>{v.moments[0].s++;}]){
 const copy=structuredClone(refs);change(copy[sample]);assert.throws(()=>validate(seed,copy));
}
const manifest={};vm.runInNewContext(fs.readFileSync('release-assets.js','utf8'),manifest);
for(const [id,v] of Object.entries(refs))for(const f of [v,...v.additionalVideos||[]].flatMap(x=>x.frames||[])){assert(fs.existsSync(f.src));assert(manifest.PTGolfRelease.exercises[id].includes(f.src));}
assert(manifest.PTGolfRelease.shell.includes('js/pt-videos.js'));
console.log('PASS: PT54 coverage, <=180s, scoped coaching, source frames, core links, stale/mismatched link rejection and offline assets.');

assert.equal(refs.pt_pullup.youtubeId,'um8J524Y5gg');assert.equal(refs.pt_pullup.additionalVideos[0].youtubeId,'HpFzt4_EHko');
const badExtra=structuredClone(refs);badExtra.pt_pullup.additionalVideos[0].moments[0].s++;assert.throws(()=>validate(seed,badExtra));
