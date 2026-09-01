"""일러스트 SVG 겹침 검사 — 텍스트×도형 / 텍스트×텍스트 / 배지·캔버스 오버플로.

사용: PYTHONIOENCODING=utf-8 python tools/svgcheck.py [파일...]
      (인자 없으면 docs/images/*.svg 전체)

주의: 대각선 선분은 AABB(축정렬 사각형)로 근사하므로 기존 그림 일부는
      오탐이 난다. 새로 만들거나 고친 그림이 0건인지만 보면 된다.
"""
import re, sys, glob, os, itertools

sys.stdout.reconfigure(encoding='utf-8')

FULL = set('「」·↔↑↓→←①②③④⑤×~⭐°✓✗∞')


def gw(t, fs):
    """한글 1em, 공백 0.3em, 그 외 0.55em로 근사한 텍스트 폭."""
    n = 0.0
    for c in t:
        if '가' <= c <= '힣' or c in FULL:
            n += fs
        elif c == ' ':
            n += fs * 0.30
        else:
            n += fs * 0.55
    return n


def boxes(path):
    s = open(path, encoding='utf-8').read()
    T, S, B = [], [], []
    for m in re.finditer(r'<text x="([-\d.]+)" y="([-\d.]+)"[^>]*font-size="([\d.]+)"([^>]*)>(.*?)</text>', s):
        x, y, fs, at, tx = float(m[1]), float(m[2]), float(m[3]), m[4], m[5]
        w = gw(tx, fs)
        x0 = x - w / 2 if 'middle' in at else x
        T.append((x0, y - fs * 0.86, x0 + w, y + fs * 0.12, tx))
    for m in re.finditer(r'<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)" stroke="(#\w+)" stroke-width="([\d.]+)"', s):
        x1, y1, x2, y2, c, sw = float(m[1]), float(m[2]), float(m[3]), float(m[4]), m[5], float(m[6])
        if c in ('#E4EBE9', '#CBD8D3'):
            continue
        S.append((min(x1, x2) - sw / 2, min(y1, y2) - sw / 2, max(x1, x2) + sw / 2, max(y1, y2) + sw / 2))
    for m in re.finditer(r'<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)"', s):
        cx, cy, r = float(m[1]), float(m[2]), float(m[3])
        S.append((cx - r, cy - r, cx + r, cy + r))
    for m in re.finditer(r'<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"[^>]*fill="(#\w+)"', s):
        x, y, w, h, c = float(m[1]), float(m[2]), float(m[3]), float(m[4]), m[5]
        if c == '#EAF3F1':
            B.append((x, y, w, h)); continue
        if c == '#CBD8D3':
            continue
        S.append((x, y, x + w, y + h))
    return T, S, B


def ov(a, b, pad=1):
    return not (a[2] <= b[0] + pad or b[2] <= a[0] + pad or a[3] <= b[1] + pad or b[3] <= a[1] + pad)


def main(paths):
    total = 0
    for f in paths:
        T, S, B = boxes(f)
        iss = []
        for t in T:
            if t[2] > 474:
                iss.append('  OVERFLOW→%.0f "%s"' % (t[2], t[4]))
            if t[0] < 6:
                iss.append('  OVERFLOW←%.0f "%s"' % (t[0], t[4]))
            for s in S:
                if ov(t, s):
                    iss.append('  TEXT×SHAPE "%s" vs (%.0f,%.0f)-(%.0f,%.0f)' % (t[4], s[0], s[1], s[2], s[3]))
        for a, b in itertools.combinations(T, 2):
            if ov(a, b):
                iss.append('  TEXT×TEXT "%s" / "%s"' % (a[4], b[4]))
        for bx in B:
            for t in T:
                if bx[0] - 40 <= t[0] and t[2] <= bx[0] + bx[2] + 40 and bx[1] <= (t[1] + t[3]) / 2 <= bx[1] + bx[3]:
                    if t[0] < bx[0] + 3 or t[2] > bx[0] + bx[2] - 3:
                        iss.append('  BADGE OVERFLOW "%s" (%.0fpx in %.0fpx)' % (t[4], t[2] - t[0], bx[2]))
        total += len(iss)
        if iss:
            print(os.path.basename(f) + ':')
            print('\n'.join(iss))
    print('=' * 40)
    print('TOTAL:', total, '(%d files)' % len(paths))


if __name__ == '__main__':
    args = sys.argv[1:]
    root = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'docs', 'images')
    main(args if args else sorted(glob.glob(os.path.join(root, '*.svg'))))
