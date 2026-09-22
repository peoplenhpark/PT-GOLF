const assert=require("node:assert/strict"),P=require("../media/3d/poses.js");
const p=P.pose("sidelunge",.5,"pt_wide_sidelunge_stretch");
const degrees=i=>{const a=P.sub(p.hips[i],p.knees[i]),b=P.sub(p.ankles[i],p.knees[i]),dot=a.reduce((n,v,j)=>n+v*b[j],0);return Math.acos(Math.max(-1,Math.min(1,dot/(P.len(a)*P.len(b)))))*180/Math.PI;};
assert(degrees(0)<130,"loaded-side knee must bend");
assert(degrees(1)>170,"outside leg must remain nearly straight");
for(let i=0;i<=1000;i++){const frame=P.pose("sidelunge",i/1000,"pt_wide_sidelunge_stretch");for(const key of ["hip","head","chest","neck","hips","shoulders","elbows","wrists","knees","ankles"])assert(frame[key].flat().every(Number.isFinite),key);const a=P.sub(frame.hips[1],frame.knees[1]),b=P.sub(frame.ankles[1],frame.knees[1]),dot=a.reduce((n,v,j)=>n+v*b[j],0),angle=Math.acos(Math.max(-1,Math.min(1,dot/(P.len(a)*P.len(b)))))*180/Math.PI;assert(angle>170,"outside leg must lock long before the loaded knee bends");}
console.log(JSON.stringify({activeKnee:Math.round(degrees(0)),outsideKnee:Math.round(degrees(1)),frames:1001}));
