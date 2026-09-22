const assert=require("node:assert/strict"),P=require("../media/3d/poses.js");
const start=P.pose("hipopenclose",0,"pt_hip_openclose_stretch"),open=P.pose("hipopenclose",.5,"pt_hip_openclose_stretch");
const degrees=i=>{const a=P.sub(open.hips[i],open.knees[i]),b=P.sub(open.ankles[i],open.knees[i]),dot=a.reduce((n,v,j)=>n+v*b[j],0);return Math.acos(Math.max(-1,Math.min(1,dot/(P.len(a)*P.len(b)))))*180/Math.PI;};
assert.deepEqual(open.ankles[0],[-.105,.065,0],"support foot stays planted");
assert(degrees(0)<160,"support knee remains softly bent");
assert(degrees(1)>170,"free leg stays long behind");
assert(open.head[1]<start.head[1]-.15,"torso hinges from the hip");
assert(Math.abs(open.shoulders[1][2]-open.shoulders[0][2])>.15,"chest opens with pelvis");
for(let i=0;i<=1000;i++){const frame=P.pose("hipopenclose",i/1000,"pt_hip_openclose_stretch");for(const key of ["hip","head","chest","neck","hips","shoulders","elbows","wrists","knees","ankles"])assert(frame[key].flat().every(Number.isFinite),key);}
console.log(JSON.stringify({supportKnee:Math.round(degrees(0)),trailKnee:Math.round(degrees(1)),frames:1001}));
