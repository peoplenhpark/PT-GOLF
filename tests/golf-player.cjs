const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {pathToFileURL,fileURLToPath}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),runtime=process.argv[2];assert(runtime,'Pass Three.js package directory');
 const T=await import(pathToFileURL(path.join(runtime,'build/three.module.js')));
 const P=require(path.join(root,'media/golf3d/poses.js'));
 class Textures{async loadAsync(){return new T.Texture();}}
 const context={window:{THREE:{...T,TextureLoader:Textures},GolfPoses:P},URL,document:{currentScript:{src:pathToFileURL(path.join(root,'media/golf3d/player.js')).href}},location:{href:pathToFileURL(path.join(root,'media/golf3d/viewer.html')).href},fetch:async url=>{const bytes=fs.readFileSync(fileURLToPath(url));return {ok:true,json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};},console};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'media/golf3d/player.js'),'utf8'),context);
 const player=await context.window.GolfPlayer.create();const bones=player.skeleton.bones;
 let maxMove=0,maxRotation=0,maxGrip=0,samples=0;
 for(const id of Object.keys(P.clubs)){
  let previous=null;
  for(let k=0;k<=1000;k++){
   const p=P.pose(id,k/1000);player.pose(p);samples++;
   const state=bones.map(b=>({pos:b.position.clone(),q:b.quaternion.clone()}));
   for(let j=0;j<bones.length;j++){
    const b=bones[j];assert(b.matrixWorld.elements.every(Number.isFinite));assert(b.scale.x>0&&b.scale.y>0&&b.scale.z>0);
    if(previous){maxMove=Math.max(maxMove,b.position.distanceTo(previous[j].pos));maxRotation=Math.max(maxRotation,b.quaternion.angleTo(previous[j].q));}
   }
   for(let j=0;j<2;j++){const hand=bones.find(b=>b.name===`Bip01_${j?'R':'L'}_Hand`);const d=hand.position.distanceTo(new T.Vector3(...p.hands[j]));maxGrip=Math.max(maxGrip,d);assert(d<.075,'Wrist separated from club grip');}
   for(let v=0;v<player.mesh.geometry.attributes.position.count;v+=701){const pt=player.mesh.getVertexPosition(v,new T.Vector3());assert(pt.toArray().every(Number.isFinite));assert(pt.length()<5,'Skin exploded');}
   previous=state;
  }
 }
 assert(maxMove<.2,'Discontinuous bone translation');assert(maxRotation<.5,'Discontinuous bone rotation');
 console.log(JSON.stringify({samples,bones:bones.length,vertices:player.mesh.geometry.attributes.position.count,maxBoneStep:maxMove,maxRotationStepRadians:maxRotation,maxWristGripDistance:maxGrip,finiteSkinnedVertices:true}));
})().catch(e=>{console.error(e);process.exit(1);});
