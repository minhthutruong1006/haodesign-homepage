# -*- coding: utf-8 -*-
"""
3차: 전 페이지 본문 문구(h1~h5·p·li·dt·dd·span 일부)에 편집 마커 <!--B:copy.KEY-->…<!--/B:copy.KEY--> 를 심고
defaults.json 의 copy 에 기본 문구를, copy_pages 에 페이지별 키 목록(순서·태그·섹션)을 적는다. 한 번만 실행.
(python -I tools/seed3.py)
"""
import re, io, json, os
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = sorted(f for f in os.listdir(ROOT) if f.endswith('.html') and not f.startswith('_') and not re.match(r'column-\d+\.html$', f))
TARGET = {'h1', 'h2', 'h3', 'h4', 'h5', 'p', 'li', 'dt', 'dd', 'blockquote', 'figcaption'}
SPAN_CLASS = {'badge', 'sp-tag', 'sc-tag', 'ps-no', 'os-num', 'os-lab', 'hz-sub', 'doc-kicker', 'l1', 'l2', 'en', 'eg', 'wk-tag', 'ab-tag', 'cc-tag'}
SKIP_IN = {'script', 'style', 'form', 'select', 'nav', 'header', 'button', 'a', 'textarea', 'noscript', 'svg', 'template'}
BLOCKY = {'div', 'section', 'ul', 'ol', 'table', 'form', 'header', 'footer', 'nav', 'article', 'aside', 'main', 'figure', 'dl', 'blockquote'} | TARGET

class P(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=False)
        self.html = html; self.lines = [0]
        for i, ch in enumerate(html):
            if ch == '\n': self.lines.append(i + 1)
        self.stack = []     # [tag, attrs, inner_start, has_marked_child, skip_depth_flag]
        self.marker = 0     # 이미 마커 안 (B:) 깊이
        self.skip = 0       # SKIP_IN 안 깊이
        self.found = []     # (inner_start, inner_end, tag, section_id, cls)
        self.section = ''
    def off(self):
        l, c = self.getpos(); return self.lines[l - 1] + c
    def handle_comment(self, data):
        d = data.strip()
        if d.startswith('B:'): self.marker += 1
        elif d.startswith('/B:'): self.marker -= 1
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'section' or (tag == 'div' and a.get('id')): self.section = a.get('id') or a.get('class', '').split(' ')[0] or self.section
        if tag in SKIP_IN: self.skip += 1
        start = self.off(); end = self.html.find('>', start) + 1
        self.stack.append([tag, a, end, False])
    def handle_startendtag(self, tag, attrs): pass
    def handle_endtag(self, tag):
        # 스택에서 같은 태그 찾기(닫히지 않은 태그 정리)
        idx = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag: idx = i; break
        if idx is None: return
        el = self.stack[idx]; del self.stack[idx:]
        if tag in SKIP_IN: self.skip -= 1
        cls = set(el[1].get('class', '').split())
        is_target = tag in TARGET or (tag == 'span' and cls & SPAN_CLASS)
        if is_target and not el[3] and self.marker == 0 and self.skip == 0:
            inner_start, inner_end = el[2], self.off()
            inner = self.html[inner_start:inner_end]
            text = re.sub(r'<[^>]+>', '', inner).strip()
            if text and not re.search(r'<(div|section|ul|ol|table|figure|dl|h[1-6]|p|li)\b', inner) and '<!--B:' not in inner and 'data-nocopy' not in el[1]:
                self.found.append((inner_start, inner_end, tag, self.section, ' '.join(sorted(cls))))
                for s in self.stack: s[3] = True   # 부모들은 건너뜀
        elif is_target and el[3]:
            pass
        if el[3]:
            for s in self.stack: s[3] = True

dp = os.path.join(ROOT, 'admin', 'defaults.json')
D = json.load(io.open(dp, encoding='utf-8'))
D.setdefault('copy', {}); D['copy_pages'] = {}
total = 0
for page in PAGES:
    path = os.path.join(ROOT, page); html = io.open(path, encoding='utf-8').read()
    p = P(html); p.feed(html)
    pid = page.replace('.html', '').replace('-', '_')
    counters = {}; items = []
    # 뒤에서부터 삽입해야 오프셋이 안 밀림
    for (s, e, tag, section, cls) in sorted(p.found, key=lambda x: x[0]):
        counters[tag] = counters.get(tag, 0) + 1
        key = '%s.%s.%d' % (pid, tag, counters[tag])
        items.append((s, e, key, tag, section, cls))
    for (s, e, key, tag, section, cls) in sorted(items, key=lambda x: -x[0]):
        inner = html[s:e]
        D['copy'][key] = inner
        html = html[:s] + '<!--B:copy.%s-->' % key + inner + '<!--/B:copy.%s-->' % key + html[e:]
    D['copy_pages'][page] = [{'k': k, 'tag': t, 'sec': sec, 'cls': cls} for (_, _, k, t, sec, cls) in sorted(items, key=lambda x: x[0])]
    io.open(path, 'w', encoding='utf-8', newline='').write(html)
    total += len(items); print(page, len(items))
io.open(dp, 'w', encoding='utf-8', newline='\n').write(json.dumps(D, ensure_ascii=False, indent=1))
print('total', total)
