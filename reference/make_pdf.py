# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

pdfmetrics.registerFont(UnicodeCIDFont('HYSMyeongJo-Medium'))
pdfmetrics.registerFont(UnicodeCIDFont('HYGothic-Medium'))
SERIF = 'HYSMyeongJo-Medium'
SANS = 'HYGothic-Medium'

NAVY = HexColor('#1F3A5F')
ACCENT = HexColor('#2E6CB0')
GRAY = HexColor('#555555')
LIGHT = HexColor('#EAF0F7')
LINE = HexColor('#C9D6E5')

W, H = A4
c = canvas.Canvas('etc.pdf', pagesize=A4)

ML, MR = 15*mm, 15*mm
x0 = ML
xw = W - ML - MR
y = H - 13*mm

# ---- Title ----
c.setFillColor(NAVY)
c.setFont(SANS, 17)
c.drawString(x0, y, '등 운동 셀프 체크리스트')
c.setFont(SERIF, 9)
c.setFillColor(GRAY)
c.drawRightString(W-MR, y+2, 'PT 요약  |  풀업 / 시티드로우 / 암풀다운')
y -= 5*mm
c.setStrokeColor(NAVY); c.setLineWidth(1.2)
c.line(x0, y, W-MR, y)
y -= 6*mm

def box(label):
    """draw a checkbox square, return text x start"""
    s = 3.2*mm
    c.setStrokeColor(ACCENT); c.setLineWidth(0.8)
    c.rect(x0+1*mm, y-s+0.6*mm, s, s, stroke=1, fill=0)
    return x0 + 6*mm

def item(text, indent=0, bullet=True):
    global y
    c.setFont(SERIF, 9)
    c.setFillColor(HexColor('#222222'))
    tx = x0 + 6*mm + indent
    if bullet:
        c.setFillColor(ACCENT)
        c.drawString(tx-3.2*mm, y, '·')
        c.setFillColor(HexColor('#222222'))
    # wrap
    maxw = (W-MR) - tx
    words = text.split(' ')
    line = ''
    for wd in words:
        t = (line+' '+wd).strip()
        if pdfmetrics.stringWidth(t, SERIF, 9) > maxw:
            c.drawString(tx, y, line); y -= 4.6*mm; line = wd
        else:
            line = t
    if line:
        c.drawString(tx, y, line); y -= 4.6*mm

def check_item(text):
    """checkbox + text"""
    global y
    s = 3.0*mm
    c.setStrokeColor(ACCENT); c.setLineWidth(0.8)
    c.rect(x0+1*mm, y-2.2*mm, s, s, stroke=1, fill=0)
    tx = x0 + 6.5*mm
    c.setFont(SERIF, 9)
    c.setFillColor(HexColor('#222222'))
    maxw = (W-MR) - tx
    words = text.split(' ')
    line = ''
    first = True
    while words:
        wd = words.pop(0)
        t = (line+' '+wd).strip()
        if pdfmetrics.stringWidth(t, SERIF, 9) > maxw:
            c.drawString(tx, y, line); y -= 4.6*mm; line = wd
        else:
            line = t
    if line:
        c.drawString(tx, y, line); y -= 4.8*mm

def section(num, title, sub):
    global y
    y -= 1*mm
    c.setFillColor(LIGHT)
    c.rect(x0, y-5.6*mm, xw, 6.4*mm, stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont(SANS, 10.5)
    c.drawString(x0+2*mm, y-4*mm, f'{num}  {title}')
    c.setFont(SERIF, 8.5)
    c.setFillColor(ACCENT)
    c.drawRightString(W-MR-2*mm, y-4*mm, sub)
    y -= 9*mm

# ---- Core principle banner ----
c.setFillColor(NAVY)
c.roundRect(x0, y-17.5*mm, xw, 17.5*mm, 2*mm, stroke=0, fill=1)
c.setFillColor(HexColor('#FFFFFF'))
c.setFont(SANS, 9.5)
c.drawString(x0+3*mm, y-4.8*mm, '오늘의 핵심 원칙')
c.setFont(SERIF, 8.6)
c.setFillColor(HexColor('#DCE6F2'))
lines = [
    '매 순간 「어느 근육이 늘어나고 어느 근육이 수축되는지」를 인지하며 한다 (고립).',
    '무게 욕심 금지 - 가벼울수록 자기 힘으로 하는 것이라 더 힘들다. 어디를 쓰는지가 우선.',
    '등 운동은 손날(새끼-약지 라인)과 손바닥 힘으로 감아쥔다. 손가락 끝힘은 힘이 샌다.',
]
yy = y-9*mm
for ln in lines:
    c.drawString(x0+3*mm, yy, '•  '+ln); yy -= 3.9*mm
y -= 20.5*mm

# ---- Section 1 ----
section('①', '풀업 / 턱걸이', '60kg  |  언더 그립 위주')
check_item('언더 그립으로 - 등/어깨 안정 + 등 늘리기에 좋고 힘도 더 쓸 수 있다')
check_item('매달려 충분히 늘리기 → 엉덩이 살짝 쪼이기')
check_item('올라갈 때 「가슴이 먼저」 출발 (어깨 으쓱이 먼저 X), 턱/가슴이 하늘을 보게')
check_item('내려올 때 늘어난 느낌을 그대로 당겨 올라간다 / 몸 앞으로 굽히지 말 것')

# ---- Section 2 ----
section('②', '시티드 로우', '20kg  |  오버 그립 위주')
check_item('오버 그립으로 — 등 상부 발달 (상부가 살면 하부는 따라온다)')
check_item('두 번째 손가락을 은색에 걸기, 너무 넓게 잡지 말 것')
check_item('등을 감아 들어가듯 늘렸다가, 어깨 들리지 않게 명치 살짝 들며 일자로 당기기')
check_item('팔꿈치는 그립 결 방향 그대로 빠져나오게 (아래로 갈수록 몸쪽으로 붙음)')

# ---- Section 3 ----
section('③', '암풀다운 (스트레이트 암 풀다운)', '10kg x 15회  |  보조')
check_item('빼서 잡기(꾹 X), 넓이 약 50cm / 힙힌지로 엉덩이 뒤, 무게중심 발가락 옆')
check_item('배꼽보다 무릎이 무조건 뒤. 가슴이 바닥을 보고 싶어 하는 느낌')
check_item('바가 턱쯤 오면 가슴 살짝 내밀며 당기기(허리 꺾지 말고) — 큰 원을 그리며')
check_item('세팅 자세를 10개 내내 유지 / 겨드랑이를 꽉 조이는 힘으로')

# ---- Footer reminder ----
y -= 1.5*mm
c.setStrokeColor(LINE); c.setLineWidth(0.6)
c.line(x0, y, W-MR, y)
y -= 5*mm
c.setFont(SANS, 9)
c.setFillColor(NAVY)
c.drawString(x0, y, '잊지 말 것')
y -= 4.8*mm
c.setFont(SERIF, 8.6)
c.setFillColor(GRAY)
for t in [
    '•  「잡아채기」 - 같은 자세라도 잡아채면 힘 들어가는 게 완전히 다르다. 계속 연습.',
    '•  자세 흐트러지면 멈춘다. 횟수보다 자세. 한 달만 제대로 하면 등에 힘 들어가는 게 느껴진다.',
]:
    c.drawString(x0, y, t); y -= 4.4*mm

c.save()
print('done')
