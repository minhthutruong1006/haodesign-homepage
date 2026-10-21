# -*- coding: utf-8 -*-
"""
2차: 사진 슬롯·서비스 문구·FAQ·서브페이지 문구·헤드코드 마커 심기 + defaults.json 확장. 한 번만 실행.
(python -I tools/seed2.py)
"""
import re, io, json, os, html as H

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = sorted(f for f in os.listdir(ROOT) if f.endswith('.html') and not f.startswith('_') and not re.match(r'column-\d+\.html$', f))
SERVICE = {'catalog-brochure': 'catalog', 'leaflet-pamphlet': 'leaflet', 'poster-flyer': 'poster',
           'ci-logo': 'ci', 'package-label': 'package', 'global-design': 'global'}
SUB = ['work', 'board', 'contact', 'faq']

def rd(n): return io.open(os.path.join(ROOT, n), encoding='utf-8').read()
def wr(n, s): io.open(os.path.join(ROOT, n), 'w', encoding='utf-8', newline='').write(s)
def mark(k, inner): return f'<!--B:{k}-->{inner}<!--/B:{k}-->'
def wrap(html, pattern, key, flags=0):
    def rep(m):
        inner = m.group(1)
        if inner.lstrip().startswith(f'<!--B:{key}-->'): return m.group(0)
        return m.group(0).replace(inner, mark(key, inner), 1)
    return re.subn(pattern, rep, html, count=1, flags=flags)

dp = os.path.join(ROOT, 'admin', 'defaults.json')
D = json.load(io.open(dp, encoding='utf-8'))

# 1) 홈: 포트폴리오 띠 7장 + CREATIVE 사진
ix = rd('index.html')
band = re.findall(r'<div class="hz-img n\d"[^>]*><i><span><img src="([^"]+)"', ix)
m = re.search(r'(<div class="hz-img n1"[\s\S]*?<div class="hz-img n7"[\s\S]*?</div>)', ix)
ix, n = wrap(ix, r'(<div class="hz-img n1"[\s\S]*?<div class="hz-img n7"[\s\S]*?</div>)', 'band'); print('band', n, len(band))
cm = re.search(r'<div class="doc-frame doc-anim"><img src="([^"]+)" alt="[^"]*"(?: style="object-position:([^"]+)")?></div>', ix)
ix, n = wrap(ix, r'<div class="doc-frame doc-anim">(<img [^>]*>)</div>', 'creative_img'); print('creative', n)
D['slots'] = {'band': band, 'creative_img': cm.group(1), 'creative_pos': cm.group(2) or 'center 20%'}

# 2) FAQ (홈 + faq.html 동일 10개)
faq = []
for q, a in re.findall(r'<button class="fq-q" aria-expanded="false"><span>([^<]+)</span></button><button class="fq-pl"[^>]*><i></i></button><div class="fq-a"><div>([\s\S]*?)</div></div>', ix):
    faq.append({'q': H.unescape(q), 'a': a.strip()})
D['faq'] = faq
ix, n = wrap(ix, r'<div class="fq-list reveal">\s*\n([\s\S]*?)\s*<div class="center"><button class="fq-more"', 'faq.home'); print('faq.home', n, len(faq))
wr('index.html', ix)
fq = rd('faq.html')
fq, n = wrap(fq, r'<div class="fq-list reveal">\s*\n([\s\S]*?)\s*</div>\s*\n\s*<p class="center faq-cta">', 'faq.page'); print('faq.page', n)
fq, n = wrap(fq, r'(<script type="application/ld\+json">\{"@context": "https://schema\.org", "@type": "FAQPage"[\s\S]*?</script>)', 'faq.ld'); print('faq.ld', n)
wr('faq.html', fq)
# 홈/FAQ 페이지의 fq 클래스 패턴(앞 N개 보임, 나머지 more)
D['faq_home_visible'] = len(re.findall(r'<div class="fq">', ix)); D['faq_page_visible'] = len(re.findall(r'<div class="fq">', fq))

# 3) 서비스 6페이지: 갤러리(작품 자동) + 상단 문구
svc = {}
for page, key in SERVICE.items():
    h = rd(page + '.html')
    head = re.search(r'<p class="sc-head"><span class="l1">([^<]*)</span><span class="l2">([^<]*)</span></p>', h)
    tag = re.search(r'<p class="sc-tag">([^<]*)</p>', h); h1 = re.search(r'<h1 class="sc-kw">([^<]*)</h1>', h); desc = re.search(r'<p class="sc-desc">([\s\S]*?)</p>', h)
    gal_n = len(re.findall(r'<li><a class="sc-card"', h))
    svc[key] = {'l1': head.group(1), 'l2': head.group(2), 'tag': H.unescape(tag.group(1)), 'h1': h1.group(1), 'desc': desc.group(1), 'gal_n': gal_n}
    h, a = wrap(h, r'<ul class="sc-gal">([\s\S]*?)</ul>', 'gal.' + key)
    h, b = wrap(h, r'<p class="sc-head">([\s\S]*?)</p>', 'svc.' + key + '.head')
    h, c = wrap(h, r'<p class="sc-tag">([^<]*)</p>', 'svc.' + key + '.tag')
    h, d = wrap(h, r'<h1 class="sc-kw">([^<]*)</h1>', 'svc.' + key + '.h1')
    h, e = wrap(h, r'<p class="sc-desc">([\s\S]*?)</p>', 'svc.' + key + '.desc')
    wr(page + '.html', h); print(page, 'gal', a, 'copy', b + c + d + e, 'gal_n', gal_n)
D['svc'] = svc

# 4) 서브페이지 상단 문구 → copy 키
for p in SUB:
    h = rd(p + '.html')
    m = re.search(r'<h1>([^<]*)</h1><p class="lead">([^<]*)</p>', h)
    D['copy']['pg_%s_h1' % p] = m.group(1); D['copy']['pg_%s_lead' % p] = m.group(2)
    h, a = wrap(h, r'<h1>([^<]*)</h1><p class="lead">', 'copy.pg_%s_h1' % p)
    h, b = wrap(h, r'<p class="lead">([^<]*)</p>', 'copy.pg_%s_lead' % p)
    wr(p + '.html', h); print(p, 'copy', a + b)

# 5) SEO 기본값 + 헤드코드 마커 (전 페이지)
seo = {'siteUrl': 'https://minhthutruong1006.github.io/haodesign-homepage', 'ogImage': '', 'pages': {}}
for p in PAGES:
    h = rd(p)
    t = re.search(r'<title>([^<]*)</title>', h); d = re.search(r'<meta name="description" content="([^"]*)">', h)
    seo['pages'][p] = {'title': H.unescape(t.group(1)) if t else '', 'desc': H.unescape(d.group(1)) if d else '', 'noindex': bool(re.search(r'<meta name="robots" content="noindex', h))}
    if '<!--B:headcode-->' not in h:
        h = h.replace('</head>', '<!--B:headcode--><!--/B:headcode-->\n</head>', 1)
    wr(p, h)
D['seo'] = seo; D['headcode'] = ''
print('seo pages', len(seo['pages']), 'noindex:', [p for p, v in seo['pages'].items() if v['noindex']])

io.open(dp, 'w', encoding='utf-8', newline='\n').write(json.dumps(D, ensure_ascii=False, indent=1))
print('defaults.json updated')
