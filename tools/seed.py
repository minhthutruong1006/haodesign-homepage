# -*- coding: utf-8 -*-
"""
현재 정적 HTML에서 관리자 기본 데이터를 뽑고(admin/defaults.json), 굽기 마커(<!--B:key-->…<!--/B:key-->)를 심는다.
한 번만 실행. (python -I tools/seed.py)
"""
import re, io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [f for f in os.listdir(ROOT) if f.endswith('.html') and not f.startswith('_') and f != 'column-template.html']
SERVICE = {'catalog-brochure': 'catalog', 'leaflet-pamphlet': 'leaflet', 'poster-flyer': 'poster',
           'ci-logo': 'ci', 'package-label': 'package', 'global-design': 'global'}

def rd(name): return io.open(os.path.join(ROOT, name), encoding='utf-8').read()
def wr(name, s): io.open(os.path.join(ROOT, name), 'w', encoding='utf-8', newline='').write(s)
def mark(key, inner): return f'<!--B:{key}-->{inner}<!--/B:{key}-->'
def wrap_once(html, pattern, key, flags=0):
    """pattern의 group(1)을 마커로 감싼다(이미 감싸져 있으면 그대로)."""
    def rep(m):
        inner = m.group(1)
        if inner.startswith(f'<!--B:{key}-->'): return m.group(0)
        return m.group(0).replace(inner, mark(key, inner), 1)
    new, n = re.subn(pattern, rep, html, flags=flags)
    return new, n

D = {}

# 1) 포트폴리오 전체 (work.html #wgrid)
w = rd('work.html')
m = re.search(r'(<div class="wgrid all" id="wgrid">)([\s\S]*?)(</div>\s*\n\s*</div></section>)', w)
cards = re.findall(r'<a class="wc" data-g="([^"]+)"><div class="m"><img src="([^"]+)" alt="[^"]*"[^>]*></div><h4>([^<]+)</h4><span>([^<]+)</span></a>', m.group(2))
D['works'] = [{'id': i + 1, 'c': g, 'img': src, 't': t} for i, (g, src, t, lab) in enumerate(cards)]
D['cats'] = [{'k': k, 'label': lab} for k, lab in dict((g, lab) for g, _, _, lab in cards).items()]
w = w[:m.start(2)] + mark('works', m.group(2)) + w[m.end(2):] if not m.group(2).startswith('<!--B:') else w
wr('work.html', w)
print('works', len(cards), 'cats', [c['k'] for c in D['cats']])

# 2) 서비스 6페이지 작업 사례 그리드
for page, key in SERVICE.items():
    h = rd(page + '.html')
    h, n = wrap_once(h, r'<div class="wf-slide" data-n="\d+">([\s\S]*?)</div>\s*\n\s*<p class="more">', 'svc.' + key)
    wr(page + '.html', h); print(page, 'svc marker', n)

# 3) 칼럼 카드 (board.html .cgrid)
b = rd('board.html')
m = re.search(r'(<div class="cgrid">)([\s\S]*?)(</div></div></section>)', b)
posts = []
for i, (href, img, title, summ, date) in enumerate(re.findall(
        r'<a class="cc reveal" href="([^"]+)"[^>]*><div class="m"><img src="([^"]+)"[^>]*>(?:<span class="new">NEW</span>)?</div><div class="b"><h3>([^<]+)</h3><p>([^<]*)</p><time>([^<]+)</time></div></a>', m.group(2))):
    posts.append({'id': i + 1, 'title': title, 'summary': summ, 'img': img, 'date': date, 'url': href, 'bodyHtml': ''})
D['posts'] = posts
if not m.group(2).startswith('<!--B:'):
    b = b[:m.start(2)] + mark('posts', m.group(2)) + b[m.end(2):]
wr('board.html', b); print('posts', len(posts))

# 4) 히어로 슬라이드 (index.html)
ix = rd('index.html')
m = re.search(r'(<div class="hero-in">\s*\n)([\s\S]*?)(\s*<div class="hero-ctrl">)', ix)
slides = re.findall(r'<div class="slide[^"]*"><div class="ph dark"><img src="([^"]+)" alt=""></div>\s*<div class="hero-txt"><p class="badge">([^<]*)</p><(h1|h2 class="h1")>([\s\S]*?)</h[12]><p>([\s\S]*?)</p><a class="btn" href="([^"]*)">', m.group(2))
D['hero'] = [{'img': s[0], 'badge': s[1], 'title': s[3], 'desc': s[4], 'href': s[5]} for s in slides]
if not m.group(2).lstrip().startswith('<!--B:'):
    ix = ix[:m.start(2)] + mark('hero', m.group(2)) + ix[m.end(2):]
print('hero', len(slides))

# 5) CREATIVE 섹션 문구 (index.html)
copy = {}
mm = re.search(r'<div class="doc-lead">\s*<p class="doc-kicker">[^<]*</p>\s*<h3>([\s\S]*?)</h3>', ix)
copy['cr_title'] = mm.group(1); ix, _ = wrap_once(ix, r'<p class="doc-kicker">[^<]*</p>\s*<h3>([\s\S]*?)</h3>', 'copy.cr_title')
bodies = re.findall(r'<div class="doc-body">\s*([\s\S]*?)\s*</div>', ix)
copy['cr_p1'], copy['cr_p2'] = bodies[0].strip(), bodies[1].strip()
cnt = [0]
def rep_body(mo):
    cnt[0] += 1; key = 'copy.cr_p%d' % cnt[0]
    return mo.group(0).replace(mo.group(1), mark(key, mo.group(1).strip()), 1)
ix = re.sub(r'<div class="doc-body">\s*([\s\S]*?)\s*</div>', rep_body, ix, count=2)
wr('index.html', ix)

# 6) 견적 섹션 문구 (13페이지 공통)
qt = None
for p in PAGES:
    h = rd(p)
    mt = re.search(r'<h2 class="qt-title">([\s\S]*?)</h2>', h); md = re.search(r'<p class="qt-desc">([\s\S]*?)</p>', h)
    if not mt: continue
    if qt is None: qt = (mt.group(1), md.group(1))
    h, n1 = wrap_once(h, r'<h2 class="qt-title">([\s\S]*?)</h2>', 'copy.qt_title')
    h, n2 = wrap_once(h, r'<p class="qt-desc">([\s\S]*?)</p>', 'copy.qt_desc')
    wr(p, h)
copy['qt_title'], copy['qt_desc'] = qt
D['copy'] = copy

# 7) 연락처 (문자열 치환용, 마커 없음)
D['settings'] = {'tel': '1666-2027', 'email': 'sales@haodesign.co.kr', 'address': '서울시 광진구 능동로49길 9, 2F'}
D['mail'] = {'on': False, 'to': 'sales@haodesign.co.kr', 'url': ''}

os.makedirs(os.path.join(ROOT, 'admin'), exist_ok=True)
io.open(os.path.join(ROOT, 'admin', 'defaults.json'), 'w', encoding='utf-8', newline='\n').write(json.dumps(D, ensure_ascii=False, indent=1))
io.open(os.path.join(ROOT, 'tools', 'bake-state.json'), 'w', encoding='utf-8', newline='\n').write(json.dumps({'settings': D['settings']}, ensure_ascii=False, indent=1))
print('defaults.json written; copy keys', list(copy))
