# -*- coding: utf-8 -*-
import os, cairosvg

FONT = "Noto Sans CJK KR"
TEAL = "#14776A"; TEAL2 = "#5CA99E"; AMBER = "#E0982A"; RED = "#C0392B"
MAT = "#D3D8DD"; INK = "#243B36"; SUB = "#5A6B66"
os.makedirs("images", exist_ok=True)

def frame(inner, title):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 300" font-family="{FONT}, sans-serif">
<rect x="1" y="1" width="468" height="298" rx="16" fill="#FFFFFF" stroke="#E4E8EA" stroke-width="2"/>
<text x="26" y="40" font-size="21" font-weight="700" fill="{INK}">{title}</text>
<line x1="26" y1="52" x2="444" y2="52" stroke="#EEF1F2" stroke-width="2"/>
{inner}
</svg>'''

def arrow(x1,y1,x2,y2,color=RED,w=5):
    import math
    ang=math.atan2(y2-y1,x2-x1)
    l=12; sp=0.45
    ax1=x2-l*math.cos(ang-sp); ay1=y2-l*math.sin(ang-sp)
    ax2=x2-l*math.cos(ang+sp); ay2=y2-l*math.sin(ang+sp)
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<polygon points="{x2},{y2} {ax1:.1f},{ay1:.1f} {ax2:.1f},{ay2:.1f}" fill="{color}"/>')

def lab(x,y,t,size=15,color=SUB,anchor="start",weight="400"):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}" font-weight="{weight}">{t}</text>'

def limb(x1,y1,x2,y2,w=13,color=TEAL):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>'

def head(cx,cy,r=15,color=TEAL):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}"/>'

# ---------- 1. Quad Set (long sitting) ----------
mat = f'<line x1="40" y1="240" x2="430" y2="240" stroke="{MAT}" stroke-width="7" stroke-linecap="round"/>'
g = mat
g += limb(150,234,126,142,12)          # torso
g += head(120,126)                      # head
g += limb(132,152,178,180,9)           # arm
g += f'<ellipse cx="256" cy="230" rx="30" ry="12" fill="{AMBER}"/>'  # towel roll
g += limb(150,234,256,216,13)          # thigh (small bend over roll)
g += limb(256,216,372,228,13)          # shin
g += limb(372,228,372,204,10)          # foot flexed up
g += arrow(256,168,256,206)            # press down
g += lab(214,150,'허벅지 힘으로 눌러 10초',15,INK)
g += lab(396,220,'발끝',13); g += lab(396,236,'당김',13)
svg1 = frame(g, '① 쿼드 셋 · Quad Set')

# ---------- 2. SLR (supine) ----------
g = mat
g += head(74,220)                       # head lying
g += limb(90,228,214,236,12)            # torso along floor
g += limb(96,228,150,236,8)             # arm
g += limb(214,236,330,236,13)           # resting leg flat
g += limb(330,236,330,214,10)           # resting foot
g += limb(214,236,352,158,13)           # raised straight leg
g += limb(352,158,336,142,10)           # raised foot flexed
g += arrow(300,214,336,176)             # lift arrow
g += lab(250,120,'다리 쭉 펴서 들기',16,INK)
g += lab(250,142,'(무릎 굽히지 않기)',14)
g += lab(150,205,'엉덩이 뜨지 않게',14)
svg2 = frame(g, '② SLR · 스트레이트 레그 레이즈')

# ---------- 3. Clamshell (side-lying) ----------
g = mat
g += limb(96,205,66,238,9)              # support forearm to mat
g += head(78,150)                       # head
g += limb(94,160,244,176,12)            # torso (side-lying)
g += limb(244,176,278,214,13)           # bottom thigh
g += limb(278,214,236,238,13)           # shin to feet
g += limb(244,168,300,182,13,TEAL2)     # top thigh opened
g += limb(300,182,250,214,13,TEAL2)     # top shin
g += f'<ellipse cx="289" cy="198" rx="20" ry="10" fill="none" stroke="{AMBER}" stroke-width="5"/>'  # band
g += f'<path d="M 292 214 A 34 34 0 0 0 305 184" fill="none" stroke="{RED}" stroke-width="5"/>'
g += arrow(302,190,305,184)             # rotation arrow tip
g += lab(250,120,'무릎 벌리기',16,INK)
g += lab(250,142,'(뒤꿈치는 붙인 채)',14)
g += lab(150,232,'밴드 걸면 자극 ↑',13,AMBER)
svg3 = frame(g, '③ 클램쉘 · Clamshell')

# ---------- 4. SSLR (side-lying straight leg raise) ----------
g = mat
g += limb(96,196,66,238,9)              # support forearm
g += head(78,148)                       # head
g += limb(94,158,238,172,12)            # torso side-lying
g += limb(238,172,332,206,13)           # bottom leg slightly forward-down
g += limb(332,206,332,228,10)           # bottom foot
g += limb(238,166,340,120,13)           # top leg raised straight
g += limb(340,120,326,104,10)           # top foot
g += arrow(300,150,332,118)             # lift arrow
g += lab(222,92,'위 다리 곧게 펴 옆으로 들기',14,INK)
g += lab(222,112,'(엉덩이·골반 힘)',14)
g += lab(300,224,'아래 다리 살짝 앞으로',13)
svg4 = frame(g, '④ SSLR · 사이드 레그 레이즈')

files = [('01_quadset',svg1),('02_slr',svg2),('03_clamshell',svg3),('04_sslr',svg4)]
for name, svg in files:
    with open(f'images/{name}.svg','w',encoding='utf-8') as f: f.write(svg)
    cairosvg.svg2png(bytestring=svg.encode('utf-8'), write_to=f'images/{name}.png',
                     output_width=940, output_height=600)
print('done', [n for n,_ in files])
