const assert=require("node:assert/strict"),P=require("../media/3d/poses.js");
const low=P.pose("backextension",0,"pt_backextension"),top=P.pose("backextension",.5,"pt_backextension");
assert(low.head[1]<1.20,"start position reaches a deeper hip hinge");
assert(low.head[2]>.60,"start torso moves farther forward and down");
assert(top.head[1]>low.head[1]+.30,"return reaches neutral without hyperextension");
assert.deepEqual(low.equipment.map(e=>e.type),["backextension"]);
for(let i=0;i<=1000;i++){const frame=P.pose("backextension",i/1000,"pt_backextension");for(const key of ["hip","head","chest","neck","hips","shoulders","elbows","wrists","knees","ankles"])assert(frame[key].flat().every(Number.isFinite),key);}
console.log(JSON.stringify({lowHeadY:+low.head[1].toFixed(2),topHeadY:+top.head[1].toFixed(2),frames:1001}));
