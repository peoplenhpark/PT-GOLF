// Usage: node build_golf_player.mjs <three-package-directory> <source-fbx> <output-directory>
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const [runtime,input,out]=process.argv.slice(2);
const T=await import(pathToFileURL(path.join(runtime,'build/three.module.js')));
const {FBXLoader}=await import(pathToFileURL(path.join(runtime,'examples/jsm/loaders/FBXLoader.js')));
globalThis.window={URL:globalThis.URL};
const manager=new T.LoadingManager();manager.addHandler(/\.tga$/i,{load(url){const t=new T.Texture();t.userData.file=url;return t;},setPath(){return this;}});
const buffer=fs.readFileSync(input),model=new FBXLoader(manager).parse(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');model.updateMatrixWorld(true);
const mesh=model.getObjectByProperty('isSkinnedMesh',true),geo=mesh.geometry.clone();
const world=new T.Matrix4().makeScale(.01,.01,.01).multiply(mesh.matrixWorld);geo.applyMatrix4(world);
const bones=mesh.skeleton.bones.map(b=>({name:b.name,parent:mesh.skeleton.bones.indexOf(b.parent),position:b.getWorldPosition(new T.Vector3()).multiplyScalar(.01).toArray(),quaternion:b.getWorldQuaternion(new T.Quaternion()).toArray()}));
let offset=0;const blocks=[];const attr={};
for(const name of ['position','normal','uv','skinIndex','skinWeight']){const a=geo.attributes[name];const bytes=Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength);attr[name]={offset,length:a.array.length,itemSize:a.itemSize,type:a.array.constructor.name};blocks.push(bytes);offset+=bytes.length;const pad=(4-offset%4)%4;if(pad){blocks.push(Buffer.alloc(pad));offset+=pad;}}
const doc={version:1,source:'Microsoft Rocketbox / Male_Adult_01',vertices:geo.attributes.position.count,attributes:attr,groups:geo.groups,bones};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'player.json'),JSON.stringify(doc));fs.writeFileSync(path.join(out,'player.bin'),Buffer.concat(blocks));
console.log(JSON.stringify({vertices:doc.vertices,bones:bones.length,bytes:offset,groups:geo.groups}));
for(const b of bones.filter(b=>/Pelvis|Spine|Neck|Head$|_Foot$|_Toe0$|_Hand$|_Finger[0-4]$/.test(b.name)))console.log(b.name,b.position);
