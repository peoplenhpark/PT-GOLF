/* Textured Rocketbox player, driven by the existing CMU golf pose. MIT asset credits: player/LICENSE.md. */
(function(){
'use strict';
const T=window.THREE,P=window.GolfPoses;
const v=a=>new T.Vector3(...a),q=a=>new T.Quaternion(...a),I=new T.Matrix4();
function frame(x,z){x=x.clone().normalize();z=z.clone().addScaledVector(x,-z.dot(x)).normalize();if(z.lengthSq()<.01)z=new T.Vector3(0,0,1).addScaledVector(x,-x.z).normalize();const y=new T.Vector3().crossVectors(z,x).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));}
window.GolfPlayer={async create(){
 const base=new URL('player/',document.currentScript?.src||new URL('player.js',location.href));
 const [doc,buffer]=await Promise.all([fetch(new URL('player.json',base)).then(r=>{if(!r.ok)throw Error('player metadata');return r.json();}),fetch(new URL('player.bin',base)).then(r=>{if(!r.ok)throw Error('player geometry');return r.arrayBuffer();})]);
 const geometry=new T.BufferGeometry();for(const [name,a] of Object.entries(doc.attributes)){const ArrayType={Float32Array,Uint16Array,Uint32Array}[a.type];if(!ArrayType)throw Error('Unsupported player attribute');geometry.setAttribute(name,new T.BufferAttribute(new ArrayType(buffer,a.offset,a.length),a.itemSize));}doc.groups.forEach(g=>geometry.addGroup(g.start,g.count,g.materialIndex));geometry.computeBoundingSphere();
 const loader=new T.TextureLoader();const texture=async(file,color)=>{const t=await loader.loadAsync(new URL(file,base).href);if(color)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;};
 const maps=await Promise.all(['body-color.webp','head-color.webp','opacity-color.webp','body-normal.webp','head-normal.webp'].map((f,i)=>texture(f,i<3)));
 const materials=[new T.MeshStandardMaterial({map:maps[0],normalMap:maps[3],normalScale:new T.Vector2(.45,.45),roughness:.86}),new T.MeshStandardMaterial({map:maps[1],normalMap:maps[4],normalScale:new T.Vector2(.35,.35),roughness:.78}),new T.MeshStandardMaterial({map:maps[2],alphaTest:.45,side:T.DoubleSide,roughness:.9})];
 const group=new T.Group(),rest=doc.bones.map(b=>({name:b.name,parent:b.parent,pos:v(b.position),rot:q(b.quaternion),matrix:new T.Matrix4().compose(v(b.position),q(b.quaternion),new T.Vector3(1,1,1))}));
 const bones=rest.map(b=>{const bone=new T.Bone();bone.name=b.name;bone.position.copy(b.pos);bone.quaternion.copy(b.rot);group.add(bone);return bone;});group.updateMatrixWorld(true);
 const skeleton=new T.Skeleton(bones),mesh=new T.SkinnedMesh(geometry,materials);group.add(mesh);mesh.bind(skeleton,I);mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
 const ids=Object.fromEntries(rest.map((b,i)=>[b.name.replace('Bip01_',''),i]));const by=name=>rest[ids[name]];
 const restLocal=rest.map(b=>b.parent<0?b.matrix.clone():rest[b.parent].matrix.clone().invert().multiply(b.matrix));
 function pose(p){
  const scale=.85*p.scale,desired=new Map(),one=new T.Vector3(scale,scale,scale);
  const set=(name,pos,delta,s=one)=>{const b=by(name);if(b)desired.set(ids[name],new T.Matrix4().compose(pos,delta.clone().multiply(b.rot),s));};
  const trunk=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(v(p.right),v(p.up),v(p.front)));
  const hipRight=v(P.sub(p.hips[0],p.hips[1])).normalize(),up=new T.Vector3(0,1,0),hipFront=new T.Vector3().crossVectors(hipRight,up).normalize();hipRight.crossVectors(up,hipFront).normalize();const hips=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(hipRight,up,hipFront));
  set('Pelvis',v(p.hip),hips);
  for(const name of ['Spine','Spine1','Spine2','Neck']){const t=(by(name).pos.y-by('Pelvis').pos.y)/(by('Neck').pos.y-by('Pelvis').pos.y);set(name,v(P.mix(p.hip,p.neck,t)),trunk);}
  const hf=v(p.headFront),hu=v(p.headUp),hr=new T.Vector3().crossVectors(hu,hf).normalize();hu.crossVectors(hf,hr).normalize();const headRotation=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(hr,hu,hf));
  set('Head',v(p.head).addScaledVector(hu,-.105*scale),headRotation);
  function segment(name,next,a,b,restNormal,targetNormal){const rb=by(name),end=by(next);const direction=end.pos.clone().sub(rb.pos);const to=b.clone().sub(a);const delta=frame(to,targetNormal).multiply(frame(direction,restNormal).invert());set(name,a,delta,new T.Vector3(to.length()/direction.length(),scale,scale));}
  for(let i=0;i<2;i++){
   const side=i===0?'L':'R',n=x=>side+'_'+x;
   const shoulder=v(p.shoulders[i]),elbow=v(p.elbows[i]),wrist=v(p.wrists[i]);
   // Palm centers remain attached to the recorded grip; wrists follow their captured approach.
   const center=v(p.hands[i]),approach=center.clone().sub(wrist).normalize();wrist.copy(center).addScaledVector(approach,-.066*scale);
   const rs=by(n('UpperArm')).pos,re=by(n('Forearm')).pos,rw=by(n('Hand')).pos;
   const rn=new T.Vector3().crossVectors(re.clone().sub(rs),rw.clone().sub(re)).normalize();const tn=new T.Vector3().crossVectors(elbow.clone().sub(shoulder),wrist.clone().sub(elbow)).normalize();
   const clavicle=v(p.neck).lerp(shoulder,.4);set(n('Clavicle'),clavicle,trunk);
   segment(n('UpperArm'),n('Forearm'),shoulder,elbow,rn,tn);segment(n('Forearm'),n('Hand'),elbow,wrist,rn,tn);
   const handRestDir=by(n('Finger2')).pos.clone().sub(rw),handRestSide=by(n('Finger4')).pos.clone().sub(by(n('Finger1')).pos);
   const handSide=v(p.dir).multiplyScalar(i===0?1:-1);const handDelta=frame(approach,handSide).multiply(frame(handRestDir,handRestSide).invert());set(n('Hand'),wrist,handDelta,new T.Vector3(scale*.85,scale*.85,scale*.85));
   const rh=by(n('Thigh')).pos,rk=by(n('Calf')).pos,ra=by(n('Foot')).pos,hip=v(p.hips[i]),knee=v(p.knees[i]),ankle=v(p.ankles[i]);ankle.y+=.025*scale;
   const ln=new T.Vector3().crossVectors(rk.clone().sub(rh),ra.clone().sub(rk)).normalize();const pn=new T.Vector3().crossVectors(knee.clone().sub(hip),ankle.clone().sub(knee)).normalize();
   segment(n('Thigh'),n('Calf'),hip,knee,ln,pn);segment(n('Calf'),n('Foot'),knee,ankle,ln,pn);
   const forward=v(P.sub(p.feet[i].toe,p.feet[i].heel)).normalize(),right=new T.Vector3().crossVectors(up,forward).normalize(),footUp=new T.Vector3().crossVectors(forward,right).normalize();
   const footQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,footUp,forward));set(n('Foot'),ankle,footQ);
  }
  const solved=new Map();
  function solve(i){if(solved.has(i))return solved.get(i);let m=desired.get(i);if(!m){const b=rest[i];m=b.parent>=0?solve(b.parent).clone().multiply(restLocal[i]):b.matrix.clone();
    // Curl the original finger joints into a club grip, keeping the textured hands.
    if(/_Finger[1-4](1|2)?$/.test(b.name)){const a=/_Finger[1-4]$/.test(b.name)?.62:1.05;m.multiply(new T.Matrix4().makeRotationZ(a));}
    if(/_Finger0(1|2)?$/.test(b.name))m.multiply(new T.Matrix4().makeRotationZ(.38));
   }solved.set(i,m);return m;}
  for(let i=0;i<bones.length;i++)solve(i).decompose(bones[i].position,bones[i].quaternion,bones[i].scale);
  group.updateMatrixWorld(true);skeleton.update();
 }
 return {group,pose,mesh,skeleton,source:doc.source};
}};
})();
