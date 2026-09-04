"""JS 괄호 균형 러프 검사 — 이 환경에 node 가 없어 문법 검사 대용으로 쓴다.

문자열·템플릿리터럴·주석·정규식 리터럴을 제거한 뒤 {} () [] 짝만 확인한다.
문법 오류를 전부 잡지는 못하지만, 편집 중 흔한 괄호 깨짐은 잡힌다.

사용: PYTHONIOENCODING=utf-8 python tools/jsbal.py js/app.js js/store.js
"""
import sys, os

sys.stdout.reconfigure(encoding='utf-8')

BS = chr(92)      # \
TICK = chr(96)    # `
DQ = chr(34)      # "
SQ = chr(39)      # '


def strip(src):
    out = []
    i, n = 0, len(src)

    def prev_sig():
        for ch in reversed(out):
            if not ch.isspace():
                return ch
        return ''

    while i < n:
        c = src[i]
        if c == '/' and i + 1 < n and src[i + 1] == '/':
            j = src.find('\n', i); i = n if j < 0 else j; continue
        if c == '/' and i + 1 < n and src[i + 1] == '*':
            j = src.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if c == '/' and prev_sig() in '(,=:[!&|?{;+~^':      # 정규식 리터럴
            i += 1
            incls = False
            while i < n:
                ch = src[i]
                if ch == BS: i += 2; continue
                if ch == '[': incls = True
                elif ch == ']': incls = False
                elif ch == '/' and not incls: break
                elif ch == '\n': break
                i += 1
            i += 1
            while i < n and src[i].isalpha():
                i += 1
            continue
        if c in (DQ, SQ):
            q = c; i += 1
            while i < n and src[i] != q:
                i += 2 if src[i] == BS else 1
            i += 1; continue
        if c == TICK:
            i += 1; depth = 0
            while i < n:
                ch = src[i]
                if ch == BS: i += 2; continue
                if ch == TICK and depth == 0: break
                if ch == '$' and i + 1 < n and src[i + 1] == '{':
                    depth += 1; i += 2; out.append('{'); continue
                if ch == '}' and depth > 0:
                    depth -= 1; i += 1; out.append('}'); continue
                if depth > 0: out.append(ch)
                i += 1
            i += 1; continue
        out.append(c); i += 1
    return ''.join(out)


def main(paths):
    ok = True
    for path in paths:
        t = strip(open(path, encoding='utf-8').read())
        print(os.path.basename(path))
        for op, cl in (('{', '}'), ('(', ')'), ('[', ']')):
            a, b = t.count(op), t.count(cl)
            if a != b: ok = False
            print('   %s%s  %d / %d  %s' % (op, cl, a, b, 'OK' if a == b else '*** 불일치 ***'))
        depth = 0
        for ch in t:
            if ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth < 0:
                    ok = False; print('   *** 닫는 중괄호 초과 ***'); break
    print('RESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    args = sys.argv[1:] or [os.path.join(root, 'js', 'app.js'), os.path.join(root, 'js', 'store.js')]
    sys.exit(main(args))
