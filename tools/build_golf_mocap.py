"""Convert CMU subject 64 trial 01 C3D into the bundled golf motion.
Usage: python tools/build_golf_mocap.py /path/to/64_01.c3d
Requires NumPy. This intentionally handles this verified source, not arbitrary C3D.
Source and usage terms: media/golf3d/SOURCE.md.
"""
from pathlib import Path
import sys, struct, re, json, hashlib
import numpy as np

source = Path(sys.argv[1]); raw = source.read_bytes()
assert hashlib.sha256(raw).hexdigest() == 'bfa60767b82a07a4494a988a0d35621187963c269e4a019d29fd1133cc065648', 'Unexpected source file'
assert raw[1] == 80 and raw[515] == 84, 'Expected Intel C3D'
count = struct.unpack_from('<H', raw, 2)[0]
first, last = struct.unpack_from('<HH', raw, 6)
start = struct.unpack_from('<H', raw, 16)[0]
rate = struct.unpack_from('<f', raw, 20)[0]
assert count == 45 and first == 11 and last == 458 and rate == 120
assert struct.unpack_from('<f', raw, 12)[0] < 0, 'Expected float point data'
labels = re.search(rb'Subject1:RWRB.{1000,}?Subject1:RHEE-1\s+', raw, re.S).group().decode().split()
points = np.frombuffer(raw, dtype='<f4', offset=(start-1)*512, count=(last-first+1)*count*4).reshape(-1,count,4)
def marker(name):
    data = points[:,labels.index('Subject1:'+name)]
    assert np.all(data[:,3] >= 0), 'Missing marker '+name
    # Proper rotation: -X is trail side, +X is target/lead, +Z faces the ball.
    v = data[:,:3].astype(float)[:,[0,2,1]]/1000
    v[:,0] *= -1
    # Mild five-frame filter (33 ms support) suppresses optical marker noise.
    padded = np.pad(v,((2,2),(0,0)),mode='edge')
    return sum(w*padded[i:i+len(v)] for i,w in enumerate([-3,12,17,12,-3]))/35
m = {n:marker(n) for n in ['LFWT','RFWT','LBWT','RBWT','LSHO','RSHO','LELB','RELB','LWRA','LWRB','RWRA','RWRB','LKNE','RKNE','LANK','RANK','LFHD','RFHD','LBHD','RBHD','LHEE','LTOE','RHEE','RTOE','WEP1','WEP2','WEP3']}
def unit(v):return v/np.linalg.norm(v,axis=1)[:,None]
hips = [(m[a]+m[b])/2-[0,.08,0] for a,b in [('LFWT','LBWT'),('RFWT','RBWT')]]
head = (m['LFHD']+m['RFHD']+m['LBHD']+m['RBHD'])/4
head_front = unit((m['LFHD']+m['RFHD'])-(m['LBHD']+m['RBHD']))
head_right = unit((m['LFHD']+m['LBHD'])-(m['RFHD']+m['RBHD']))
head_up = unit(np.cross(head_front,head_right))
data = {'hip':(hips[0]+hips[1])/2,'lhip':hips[0],'rhip':hips[1],
 'lshoulder':m['LSHO'],'rshoulder':m['RSHO'],'lelbow':m['LELB'],'relbow':m['RELB'],
 'lwrist':(m['LWRA']+m['LWRB'])/2,'rwrist':(m['RWRA']+m['RWRB'])/2,
 'lknee':m['LKNE'],'rknee':m['RKNE'],'lankle':m['LANK'],'rankle':m['RANK'],
 'head':head,'headFront':head_front,'headUp':head_up,
 'lheel':m['LHEE'],'ltoe':m['LTOE'],'rheel':m['RHEE'],'rtoe':m['RTOE'],
 'shaft1':m['WEP1'],'shaft2':m['WEP2'],'shaft3':m['WEP3']}
clip_start,clip_end = 130,410
origin = (data['lankle'][clip_start]+data['rankle'][clip_start])/2
origin[1] = min(m[n][clip_start,1] for n in ['LHEE','LTOE','RHEE','RTOE'])-.026
names = list(data)
for k,v in data.items():
    if k not in ['headFront','headUp']:data[k]=v-origin
frames = np.stack([data[k] for k in names],axis=1)[clip_start:clip_end+1]
payload = {'source':'CMU 64_01','sha256':hashlib.sha256(raw).hexdigest(),'fps':120,
 'firstSourceFrame':first+clip_start,'lastSourceFrame':first+clip_end,
 'duration':(clip_end-clip_start)/120,'names':names,
 'stages':[0,(180-130)/280,(255-130)/280,(290-130)/280,(320-130)/280,(333-130)/280,(349-130)/280,1],
 'frames':np.round(frames.reshape(len(frames),-1),5).tolist()}
out = Path(__file__).resolve().parents[1]/'media/golf3d/motion.js'
out.write_text('/* Derived from CMU 64_01. See SOURCE.md. */\n(function(root){const data='+json.dumps(payload,separators=(',',':'))+';if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.GolfMotion=data;})(typeof window!=="undefined"?window:globalThis);\n',encoding='utf-8')
print(json.dumps({'frames':len(frames),'fps':rate,'bytes':out.stat().st_size,'sha256':payload['sha256']}))
